// soft/soft.js — 软材料的光线步进渲染器（WebGL2，依赖 ../glkit.js）。两种材料共用一套场景描述：
//   mode 'jelly'：果冻。光折射进去、按走过的厚度被染色、从另一边出来；地上是染了色的光斑，不是黑影子。
//   mode 'puff' ：充气。不透光的亮皮，沿边一圈压合的缝，缝边有褶；挨在一起的会互相挤扁。
// 场景是 JS 对象，编译成 GLSL（常量全部写进着色器：SwiftShader 上比 uniform 数组快得多）。
// 用法：await SOFT.render(canvas, scene, { spp, tiles })；scene 的字段见 compile() 上面的注释。
// 每一张图只由 scene 决定（抖动的随机数种子固定），所以同一个 scene 渲两次结果一样；做成片子时 scene 是帧号的函数。
const SOFT = (() => {
  const rgb = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255].map(v => Math.pow(v, 2.2)); };
  const f = v => { const s = (+v).toFixed(5); return s.includes('.') ? s : s + '.0'; };
  const v3 = a => `vec3(${a.map(f).join(',')})`;
  const norm = v => { const l = Math.hypot(...v) || 1; return v.map(x => x / l); };
  // 欧拉角（度，先绕 Y 再 X 再 Z）→ 世界到物体的 3×3（按列写给 GLSL）
  function invRot([rx = 0, ry = 0, rz = 0] = []) {
    const [a, b, c] = [rx, ry, rz].map(d => d * Math.PI / 180);
    const X = [[1, 0, 0], [0, Math.cos(a), -Math.sin(a)], [0, Math.sin(a), Math.cos(a)]];
    const Y = [[Math.cos(b), 0, Math.sin(b)], [0, 1, 0], [-Math.sin(b), 0, Math.cos(b)]];
    const Z = [[Math.cos(c), -Math.sin(c), 0], [Math.sin(c), Math.cos(c), 0], [0, 0, 1]];
    const mul = (A, B) => A.map((r, i) => r.map((_, j) => A[i][0] * B[0][j] + A[i][1] * B[1][j] + A[i][2] * B[2][j]));
    const R = mul(Y, mul(X, Z));                       // 物体 → 世界
    // 逆 = 转置；GLSL 的 mat3(...) 按列填，所以把 R 的行依次写进去正好是 R 的转置
    return `mat3(${[R[0][0], R[0][1], R[0][2], R[1][0], R[1][1], R[1][2], R[2][0], R[2][1], R[2][2]].map(f).join(',')})`;
  }

  // —— 平面图形 → 距离场图集。每格 S×S，存 (距离, 梯度x, 梯度y)，单位：格子半宽 = 1，里面为负 ——
  function buildAtlas(gl, masks, S = 512) {
    const n = Math.max(masks.length, 1), cols = Math.min(n, 4), rows = Math.ceil(n / cols), W = cols * S, H = rows * S;
    const data = new Float32Array(W * H * 4).fill(1);
    masks.forEach((draw, i) => {
      const c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d', { willReadFrequently: true });
      x.fillStyle = '#fff'; x.strokeStyle = '#fff'; x.lineJoin = x.lineCap = 'round'; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
      draw(x, S);
      const px = x.getImageData(0, 0, S, S).data, al = new Uint8Array(S * S);
      for (let k = 0; k < S * S; k++) al[k] = px[k * 4 + 3];
      const d = GLK.sdfFromAlpha(al, S, S); GLK.blurField(d, S, S, 1.6);
      const ox = (i % cols) * S, oy = Math.floor(i / cols) * S, at = (xx, yy) => d[Math.min(S - 1, Math.max(0, yy)) * S + Math.min(S - 1, Math.max(0, xx))];
      for (let y = 0; y < S; y++) for (let xx = 0; xx < S; xx++) {
        const o = ((oy + (S - 1 - y)) * W + ox + xx) * 4;                    // 上下翻过来：格子里 +y 朝上
        let gx = (at(xx + 2, y) - at(xx - 2, y)), gy = -(at(xx, y + 2) - at(xx, y - 2)); const l = Math.hypot(gx, gy) || 1;
        data[o] = d[y * S + xx] * 2 / S; data[o + 1] = gx / l; data[o + 2] = gy / l; data[o + 3] = 1;
      }
    });
    gl.getExtension('OES_texture_float_linear');
    const tex = GLK.texture(gl, W, H, { internal: gl.RGBA32F, format: gl.RGBA, type: gl.FLOAT, data, filter: gl.LINEAR });
    const cell = i => `vec4(${f((i % cols) / cols)},${f(Math.floor(i / cols) / rows)},${f(1 / cols)},${f(1 / rows)})`;
    return { tex, cell };
  }

  // —— 一个物体 → 一段 GLSL：算出 float d<i> ——
  // 通用字段：pos [x,y,z]、s 缩放、rot [rx,ry,rz] 度、shear [x 随 y 歪多少, z 随 y 歪多少]（晃到一半的样子）、sq [sx,sy,sz] 压扁拉长、col '#rrggbb'
  // shape：'slab'（平面图形挤出来，圆边；mask、H 半厚、R 圆角、B 正反两面再鼓出多少）· 'pillow'（平面图形充气；mask、H 最厚处半厚、R 多远鼓到最厚、wr 褶的深浅、p 气压 0—1）
  //        'rbox'（b 半边长、R）· 'sphere'（r）· 'dome'（半球；r）· 'torus'（r 环半径、w 管半径）· 'caps'（a、b 两端点、w 半径）
  function itemCode(it, i, cell) {
    const s = it.s ?? 1, sq = it.sq ?? [1, 1, 1], sh = it.shear ?? [0, 0];
    const k = Math.min(...sq) * s / (1 + Math.abs(sh[0]) + Math.abs(sh[1]));          // 变形后距离会被拉长，按最保守的比例缩回来
    let prim, br;
    switch (it.shape) {
      case 'slab': prim = `slab(q, ${cell(it.mask)}, ${f(it.H)}, ${f(it.R)}, ${f(it.B ?? 0)})`; br = Math.hypot(1.45, it.H + (it.B ?? 0)); break;
      case 'pillow': { const p = it.p ?? 1; prim = `pillow(q, ${cell(it.mask)}, ${f(it.H * (0.03 + 0.97 * p))}, ${f(it.R)}, ${f((it.wr ?? 0.5) * (1.5 - 0.5 * p))}, ${f(0.004 + 0.022 * (1 - p) * (1 - p))}, ${f(i * 7.31)})`; br = Math.hypot(1.5, it.H); break; }
      case 'rbox': prim = `rbox(q, ${v3(it.b)}, ${f(it.R)})`; br = Math.hypot(...it.b); break;
      case 'sphere': prim = `(length(q) - ${f(it.r)})`; br = it.r; break;
      case 'dome': prim = `dome(q, ${f(it.r)}, ${f(it.R ?? 0.08)})`; br = it.r * 1.05; break;
      case 'torus': prim = `(length(vec2(length(q.xy) - ${f(it.r)}, q.z)) - ${f(it.w)})`; br = it.r + it.w; break;
      case 'caps': prim = `caps(q, ${v3(it.a)}, ${v3(it.b)}, ${f(it.w)})`; br = Math.max(Math.hypot(...it.a), Math.hypot(...it.b)) + it.w; break;
      default: throw new Error('shape? ' + it.shape);
    }
    br = br * s * Math.max(...sq) * (1 + Math.abs(sh[0]) + Math.abs(sh[1])) + 0.02;
    return `  float d${i}; { vec3 q = p - ${v3(it.pos)}; float b = length(q) - ${f(br)};
    if (b > 0.3) d${i} = b; else { q = ${invRot(it.rot)}*q/${f(s)}; q /= ${v3(sq)}; q.x -= ${f(sh[0])}*q.y; q.z -= ${f(sh[1])}*q.y; d${i} = ${prim}*${f(k)}; } }\n`;
  }

  // scene：mode、eye / at / fov、floor '#'、wall ['#上', '#下']、key 主光方向（指向光）、keyCol、fill 环境亮度、
  //        masks [fn(ctx, S)]、items [...]、inner [...]（果冻里的不透明内芯）、innerCol、squish [[i, j], …]（充气：这两个互相挤）、
  //        wallY [墙色从哪个仰角开始变, 到哪个仰角变完]、far [地面从多远开始卷成墙, 到多远卷完]、soft 影子 / 光斑的软硬、
  //        bubbles [格子大小, 每格有气泡的概率]、glow 里面被照亮的强度、rim 背光那一圈边的强度、
  //        d0 果冻颜色“到位”的厚度、ior、exposure、bloom、vignette、grain、focus [对焦距离, 光圈]
  function compile(gl, sc, atlas) {
    const items = sc.items, inner = sc.inner || [];
    let body = items.map((it, i) => itemCode(it, i, atlas.cell)).join('');
    for (const [a, b] of sc.squish || []) body += `  { float m = (d${a} - d${b})*0.5; float a0 = smax(d${a}, m, 0.03), b0 = smax(d${b}, -m, 0.03); d${a} = a0; d${b} = b0; }\n`;
    body += '  vec2 r = vec2(1e9, 0.0);\n' + items.map((_, i) => `  if (d${i} < r.x) r = vec2(d${i}, ${f(i + 1)});\n`).join('') + '  return r;';
    const innerBody = inner.length ? inner.map((it, i) => itemCode(it, i, atlas.cell)).join('') + '  return ' + inner.map((_, i) => `d${i}`).reduce((a, b) => `min(${a}, ${b})`) + ';' : '  return 1e9;';
    const cols = items.map((it, i) => `  if (id < ${f(i + 1.5)}) return ${v3(rgb(it.col))};\n`).join('') + '  return vec3(1.0);';
    const pars = items.map((it, i) => `  if (id < ${f(i + 1.5)}) return vec3(${f(it.metal ?? 0)}, ${f(it.rough ?? 0.06)}, ${f(it.dens ?? 1)});\n`).join('') + '  return vec3(0.0);';
    const key = norm(sc.key ?? [-0.35, 0.8, -0.5]);
    const FS = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;
uniform sampler2D uAtlas; uniform vec2 uRes; uniform float uSeed;
const vec3 EYE = ${v3(sc.eye)}, AT = ${v3(sc.at)}, KEY = ${v3(key)}, KEYCOL = ${v3(sc.keyCol ?? [3.0, 2.9, 2.75])};
const vec3 FLOORC = ${v3(rgb(sc.floor))}, WALLA = ${v3(rgb(sc.wall[0]))}, WALLB = ${v3(rgb(sc.wall[1]))}, INNERC = ${v3(rgb(sc.innerCol ?? '#ffffff'))};
const vec2 WALLY = vec2(${f(sc.wallY?.[0] ?? -0.05)}, ${f(sc.wallY?.[1] ?? 0.55)}), FAR = vec2(${f(sc.far?.[0] ?? 7)}, ${f(sc.far?.[1] ?? 20)});
const vec2 BUB = vec2(${f(sc.bubbles?.[0] ?? 0.2)}, ${f(sc.bubbles?.[1] ?? 0)});
const float GLOW = ${f(sc.glow ?? 0.75)}, RIM = ${f(sc.rim ?? 0.6)}, JIT = ${f(sc.soft ?? 0.04)}, FOV = ${f(sc.fov ?? 0.5)}, IOR = ${f(sc.ior ?? 1.36)}, D0 = ${f(sc.d0 ?? 0.45)}, FILL = ${f(sc.fill ?? 1.0)}, FOCUS = ${f(sc.focus?.[0] ?? 0)}, APER = ${f(sc.focus?.[1] ?? 0)};
float seed;
float rnd(){ seed = fract(sin(seed*91.3458 + 47.2941)*47453.5453); return seed; }
float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), u = fract(p); u = u*u*(3.0 - 2.0*u); return mix(mix(hs(i), hs(i + vec2(1,0)), u.x), mix(hs(i + vec2(0,1)), hs(i + vec2(1,1)), u.x), u.y); }
float smax(float a, float b, float k){ float h = max(k - abs(a - b), 0.0)/k; return max(a, b) + h*h*k*0.25; }
float rbox(vec3 p, vec3 b, float r){ vec3 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }
float caps(vec3 p, vec3 a, vec3 b, float r){ vec3 pa = p - a, ba = b - a; return length(pa - ba*clamp(dot(pa, ba)/dot(ba, ba), 0.0, 1.0)) - r; }
float dome(vec3 p, float r, float e){ float s = length(p) - r; vec2 w = vec2(s + e, -p.y + e); return length(max(w, 0.0)) + min(max(w.x, w.y), 0.0) - e; }
vec3 cell2(vec2 q, vec4 c){ vec3 t = texture(uAtlas, c.xy + clamp(q*0.5 + 0.5, 0.002, 0.998)*c.zw).rgb; t.x += length(max(abs(q) - 1.0, 0.0)); return t; }
// 平面图形挤成一块，边是圆的
float slab(vec3 q, vec4 c, float H, float R, float B){ float d2 = cell2(q.xy, c).x; float u = clamp(-d2/(R*2.2), 0.0, 1.0);
  vec2 w = vec2(d2 + R, abs(q.z) - (H - R) - B*(1.0 - (1.0 - u)*(1.0 - u))); return (length(max(w, 0.0)) + min(max(w.x, w.y), 0.0) - R)*(B > 0.0 ? 0.8 : 1.0); }
// 平面图形充气：离边越远越鼓（四分之一圆的剖面），沿边一圈压合的缝，缝边的褶垂直于边、往里很快消失
float pillow(vec3 q, vec4 c, float H, float R, float wr, float cr, float ph){
  vec3 t = cell2(q.xy, c); float d2 = t.x;
  float fin = max(d2 - 0.017, abs(q.z) - 0.003);
  if (d2 > 0.0) return min(length(vec2(d2, q.z)) - 0.002, fin);
  float u = min(-d2/R, 1.0), h = H*sqrt(1.0 - (1.0 - u)*(1.0 - u));
  vec2 pb = q.xy - t.yz*d2;                                             // 最近的边上的点：沿着它取噪声，褶就垂直于边
  float w = (vn(pb*26.0 + ph) - 0.5)*1.2 + (vn(pb*61.0 + ph*1.7) - 0.5)*0.5;
  h *= 1.0 + wr*w*exp(-d2*d2/0.0064)*0.55;                               // 褶只有 0.08 那么长，和图形多大无关
  h += cr*((vn(q.xy*7.0 + ph) - 0.5) + 0.5*(vn(q.xy*17.0 - ph) - 0.5))*smoothstep(0.0, 0.08, -d2);   // 整张皮上的起伏：气越少越皱
  return min((abs(q.z) - h)*0.55, fin);
}
vec2 map(vec3 p){
${body}
}
float mapInner(vec3 p){
${innerBody}
}
vec3 matCol(float id){
${cols}
}
vec3 matPar(float id){
${pars}
}
vec3 nrm(vec3 p){ const vec2 e = vec2(1.0, -1.0)*0.0011; return normalize(e.xyy*map(p + e.xyy).x + e.yyx*map(p + e.yyx).x + e.yxy*map(p + e.yxy).x + e.xxx*map(p + e.xxx).x); }
vec3 nrmInner(vec3 p){ const vec2 e = vec2(1.0, -1.0)*0.0011; return normalize(e.xyy*mapInner(p + e.xyy) + e.yyx*mapInner(p + e.yyx) + e.yxy*mapInner(p + e.yxy) + e.xxx*mapInner(p + e.xxx)); }
float march(vec3 ro, vec3 rd, float tmax, out float id){
  float t = 0.0; id = 0.0;
  for (int i = 0; i < 120; i++){ vec2 h = map(ro + rd*t); if (h.x < 0.0006*(1.0 + t*0.4)){ id = h.y; return t; } t += h.x; if (t > tmax) break; }
  return -1.0;
}
// 影棚：头顶偏前一块大柔光、右边一条、左后一条；下半球是地面的颜色
float sbox(vec3 d, vec3 c, vec2 hs, float soft){ vec3 u = normalize(cross(vec3(0.0, 1.0, 0.0), c)), v = cross(c, u); float z = dot(d, c); if (z <= 0.0) return 0.0;
  vec2 q = vec2(dot(d, u), dot(d, v))/z; vec2 e = smoothstep(hs + soft, hs - soft, abs(q)); return e.x*e.y; }
vec3 env(vec3 d){
  vec3 c = mix(FLOORC*0.85, mix(WALLB, WALLA, smoothstep(0.0, 0.7, d.y)), smoothstep(-0.12, 0.1, d.y))*FILL;
  c += sbox(d, normalize(vec3(-0.2, 0.86, 0.5)), vec2(0.5, 0.26), 0.05)*vec3(6.5);
  c += sbox(d, normalize(vec3(0.92, 0.32, 0.25)), vec2(0.1, 0.55), 0.04)*vec3(4.2, 4.0, 3.8);
  c += sbox(d, normalize(vec3(-0.85, 0.3, -0.42)), vec2(0.14, 0.5), 0.06)*vec3(3.2, 3.3, 3.6);
  return c;
}
vec3 keyDir(){ return normalize(KEY + (vec3(rnd(), rnd(), rnd()) - 0.5)*JIT); }
#if ${sc.mode === 'jelly' ? 1 : 0}
vec3 sigmaOf(float id){ return -log(clamp(matCol(id), 0.012, 0.995))/D0*matPar(id).z; }
// 从地上一点朝主光走：穿过了多厚的果冻、被染成什么颜色。果冻的“影子”是一摊有颜色的光，中间还更亮（聚光）
vec3 lightAt(vec3 P){
  vec3 L = keyDir(), acc = vec3(0.0); float t = 0.015, len = 0.0, graze = 1.0;
  for (int i = 0; i < 44; i++){ vec3 q = P + L*t; vec2 h = map(q);
    if (h.x < 0.0){ float st = max(-h.x*0.85, 0.022); acc += sigmaOf(h.y)*st; len += st; t += st; }
    else { graze = min(graze, h.x*14.0/t + 0.25); t += max(h.x, 0.014); }
    if (t > 7.0 || q.y > 3.2) break; }
  vec3 T = exp(-acc);
  float rim = mix(1.0, 0.5, smoothstep(0.0, 0.03, len)*(1.0 - smoothstep(0.03, 0.22, len)));   // 贴着边掠过去的光被折走：光斑外面一圈暗边
  return T*rim*(1.0 + 1.5*smoothstep(0.08, 0.7, len))*mix(0.86, 1.0, clamp(graze, 0.0, 1.0));
}
#else
float shadow(vec3 P, vec3 L){ float t = 0.02 + 0.03*rnd(), r = 1.0, k = 0.75 + 0.5*rnd();                // 步长每次采样都不一样：台阶变成噪点，多采几遍就平了
  for (int i = 0; i < 44; i++){ float h = map(P + L*t).x; r = min(r, 6.0*h/t); if (r < 0.01 || t > 8.0) break; t += clamp(h*k, 0.012, 0.35); } return clamp(r, 0.0, 1.0); }
float ao(vec3 p, vec3 n){ float a = 0.0, w = 1.0; for (int i = 1; i <= 5; i++){ float h = 0.035*float(i*i)*0.6 + 0.01; a += w*(h - min(map(p + n*h).x, p.y + n.y*h)); w *= 0.62; } return clamp(1.0 - 2.2*a, 0.0, 1.0); }
vec3 lightAt(vec3 P){
  float s = shadow(P, keyDir());
  float c = 1.0; { float h = map(P + vec3(0.0, 0.05, 0.0)).x; c *= mix(0.55, 1.0, smoothstep(0.0, 0.16, h)); h = map(P + vec3(0.0, 0.25, 0.0)).x; c *= mix(0.72, 1.0, smoothstep(-0.05, 0.4, h)); }
  return vec3(mix(0.42, 1.0, s)*c);
}
#endif
// 地面和背景墙（无缝）
vec3 ground(vec3 ro, vec3 rd){
  vec3 wall = mix(WALLB, WALLA, smoothstep(WALLY.x, WALLY.y, rd.y));
  if (rd.y > -1e-4) return wall*FILL;
  float t = -ro.y/rd.y; vec3 P = ro + rd*t; float far = smoothstep(FAR.x, FAR.y, length(P.xz - AT.xz));
  vec3 c = FLOORC*lightAt(P);
  return mix(c, wall, far)*FILL;
}
#if ${sc.mode === 'jelly' ? 1 : 0}
// 果冻里的小气泡：按格子撒，每格最多一颗，离格子边至少 0.12 格（所以只查当前这一格就够）
vec3 h3(vec3 p){ p = fract(p*vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx)*p.zyx); }
float bubble(vec3 p, out vec3 c){
  vec3 g = floor(p/BUB.x), h = h3(g + 7.0); vec3 e = (0.5 - abs(fract(p/BUB.x) - 0.5))*BUB.x; float edge = min(e.x, min(e.y, e.z)) + 0.1*BUB.x;
  if (h.x > BUB.y) return edge; c = (g + 0.3 + 0.4*h3(g + 19.0))*BUB.x; return min(length(p - c) - BUB.x*(0.05 + 0.12*h.y), edge);
}
// 在果冻里一直走到出去（或撞上里面的内芯）。路上碰到气泡：记一圈亮边，接着走
float through(vec3 ro, vec3 rd, vec3 sg, out bool hitInner, out vec3 glow){
  float t = 0.004; hitInner = false; glow = vec3(0.0);
  for (int i = 0; i < 72; i++){ vec3 q = ro + rd*t; float d = -map(q).x, di = mapInner(q);
    if (di < 0.0012){ hitInner = true; return t; } if (d < 0.0006 || q.y < 0.0) return t;
    float st = min(d, di)*0.9;
    if (BUB.y > 0.0){ vec3 c; float db = bubble(q, c);
      if (db < 0.0015){ vec3 nb = normalize(q - c); float fr = pow(1.0 - abs(dot(nb, rd)), 2.5);
        if (-map(c).x > 0.06) glow += exp(-sg*t)*(fr*1.5 + pow(max(dot(reflect(rd, nb), KEY), 0.0), 40.0)*5.0 + pow(max(dot(reflect(rd, nb), normalize(vec3(-0.2, 0.86, 0.5))), 0.0), 30.0)*2.0);
        t += 2.0*abs(dot(c - q, rd)) + 0.004; continue; }
      st = min(st, db*0.9); }
    t += max(st, 0.003); }
  return t;
}
float toLight(vec3 p){ float t = 0.0; for (int i = 0; i < 14; i++){ float d = -map(p + KEY*t).x; if (d < 0.001) break; t += max(d, 0.02); } return t; }
// 第二层：从果冻背面出来的光再碰到别的果冻，就不折射了，直着穿过去
vec3 behind(vec3 ro, vec3 rd){
  float id; float t = march(ro, rd, 14.0, id);
  if (t < 0.0 || (rd.y < 0.0 && -ro.y/rd.y < t)) return ground(ro, rd);
  vec3 p = ro + rd*t, n = nrm(p), sg = sigmaOf(id), gl; bool hi; float L = through(p - n*0.004, rd, sg, hi, gl);
  vec3 T = exp(-sg*L), pe = p + rd*(L + 0.008);
  vec3 c = (hi ? INNERC*0.85*T : ground(pe, rd)*T) + gl;
  c += matCol(id)*exp(-sg*toLight(p + rd*L*0.5)*0.5)*(1.0 - exp(-L*2.2))*0.55;
  float F = 0.03 + 0.97*pow(1.0 - max(dot(-rd, n), 0.0), 5.0);
  return mix(c, env(reflect(rd, n)), F);
}
vec3 shade(vec3 ro, vec3 rd){
  float id; float t = march(ro, rd, 30.0, id);
  if (t < 0.0 || (rd.y < 0.0 && -ro.y/rd.y < t)) return ground(ro, rd);
  vec3 p = ro + rd*t, n = nrm(p), R = reflect(rd, n);
  float F = 0.025 + 0.975*pow(1.0 - max(dot(-rd, n), 0.0), 5.0);
  vec3 ri = refract(rd, n, 1.0/IOR), sg = sigmaOf(id), gl; bool hi; float L = through(p - n*0.004, ri, sg, hi, gl);
  vec3 pe = p - n*0.004 + ri*L, T = exp(-sg*L), c;
  if (hi){ vec3 ni = nrmInner(pe); c = INNERC*(0.72 + 0.7*max(dot(ni, normalize(vec3(-0.2, 0.86, 0.5))), 0.0) + 0.35*max(dot(ni, KEY), 0.0))*T; }
  else { vec3 ne = nrm(pe); vec3 ro2 = refract(ri, -ne, IOR); if (dot(ro2, ro2) < 0.01) ro2 = reflect(ri, -ne); c = behind(pe + ne*0.006, ro2)*T; }
  // 里面被照亮的那一份：朝着光的那一侧、薄的地方最亮
  float tl = toLight(p + ri*L*0.5);
  c += matCol(id)*exp(-sg*tl*0.55)*(1.0 - exp(-L*2.4))*GLOW*KEYCOL/3.0 + gl;
  c += exp(-sg*tl*0.8)*pow(1.0 - max(dot(-rd, n), 0.0), 2.0)*max(dot(n, -KEY)*0.5 + 0.5, 0.0)*RIM*KEYCOL/3.0;   // 背着光的那一圈边：穿过整块果冻的光从这里出来，带着最浓的颜色
  vec3 rc = env(R); if (R.y < 0.0) rc = mix(rc, FLOORC*0.9, 0.5);
  c = mix(c, rc, F);
  c += KEYCOL*pow(max(dot(R, KEY), 0.0), 900.0)*9.0;
  return c;
}
#else
vec3 lit(vec3 p, vec3 n, vec3 rd, float id, bool cheap){
  vec3 col = matCol(id), par = matPar(id), L = keyDir();
  float sh = cheap ? 1.0 : shadow(p + n*0.006, L), a = cheap ? 0.8 : ao(p, n);
  float nl = dot(n, L), wrap = clamp((nl + 0.35)/1.35, 0.0, 1.0);
  vec3 amb = mix(FLOORC*0.55 + col*0.25, mix(WALLB, WALLA, 0.5)*0.75 + 0.45, n.y*0.5 + 0.5)*FILL;
  vec3 d = col*(KEYCOL*wrap*wrap*mix(0.45, 1.0, sh)*0.52 + amb*a*0.9);
  d += col*col*pow(1.0 - max(dot(-rd, n), 0.0), 2.5)*0.35*a;                   // 胶皮薄，边上透一点自己的颜色
  return d*(1.0 - par.x*0.85);
}
vec3 shade(vec3 ro, vec3 rd){
  float id; float t = march(ro, rd, 30.0, id);
  if (t < 0.0 || (rd.y < 0.0 && -ro.y/rd.y < t)) return ground(ro, rd);
  vec3 p = ro + rd*t, n = nrm(p), col = matCol(id), par = matPar(id);
  vec3 c = lit(p, n, rd, id, false);
  vec3 R = normalize(reflect(rd, n) + (vec3(rnd(), rnd(), rnd()) - 0.5)*par.y);
  float id2; float t2 = march(p + n*0.01, R, 9.0, id2); vec3 rc;
  if (t2 > 0.0 && !(R.y < 0.0 && -(p.y + 0.01)/R.y < t2)){ vec3 p2 = p + n*0.01 + R*t2; rc = lit(p2, nrm(p2), R, id2, true); }
  else if (R.y < 0.0) rc = ground(p + n*0.01, R)*0.9;
  else rc = env(R);
  float fr = pow(1.0 - max(dot(-rd, n), 0.0), 5.0);
  vec3 F = mix(vec3(0.045 + 0.955*fr), mix(col, vec3(1.0), 0.25 + 0.75*fr), par.x);
  float occ = smoothstep(0.0, 0.12, map(p + R*0.14).x + 0.03);
  c = c*(1.0 - F*(1.0 - par.x)) + rc*F*mix(0.45, 1.0, occ);
  c += KEYCOL*pow(max(dot(reflect(rd, n), KEY), 0.0), 320.0)*1.6*shadow(p + n*0.006, KEY);
  return c;
}
#endif
void main(){
  seed = hs(gl_FragCoord.xy + uSeed*17.31) + uSeed*0.618;
  vec2 px = (gl_FragCoord.xy + vec2(rnd(), rnd()) - 0.5*uRes)/uRes.y;
  vec3 f = normalize(AT - EYE), r = normalize(cross(f, vec3(0.0, 1.0, 0.0))), u = cross(r, f);
  vec3 rd = normalize(f + (px.x*r + px.y*u)*2.0*tan(FOV*0.5)), ro = EYE;
  if (APER > 0.0){ vec3 fp = ro + rd*FOCUS/dot(rd, f); float a = rnd()*6.2832, rr = sqrt(rnd())*APER; ro += (r*cos(a) + u*sin(a))*rr; rd = normalize(fp - ro); }
  vec3 c = shade(ro, rd);
  o = vec4(min(c, vec3(24.0)), 1.0);
}`;
    return GLK.program(gl, FS);
  }

  const FS_RESOLVE = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform sampler2D src; uniform float inv;
  void main(){ o = vec4(texture(src, uv).rgb*inv, 1.0); }`;
  const FS_BRIGHT = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform sampler2D src; uniform float thr;
  void main(){ vec3 c = texture(src, uv).rgb; float l = max(c.r, max(c.g, c.b)); o = vec4(c*smoothstep(thr, thr*2.0 + 0.4, l), 1.0); }`;
  const FS_BLUR = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform sampler2D src; uniform vec2 dir;
  void main(){ vec3 s = vec3(0.0); float w[5] = float[](0.227, 0.1946, 0.1216, 0.0541, 0.0162);
    s += texture(src, uv).rgb*w[0]; for (int i = 1; i < 5; i++){ s += texture(src, uv + dir*float(i)).rgb*w[i]; s += texture(src, uv - dir*float(i)).rgb*w[i]; } o = vec4(s, 1.0); }`;
  // 调色：只压高光；亮背景要“白就是白”，所以不用 ACES
  const FS_COMP = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform sampler2D src, b1, b2; uniform float exposure, bloom, grain, vign, sat; uniform vec2 res;
  float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)))*43758.5453); }
  void main(){
    vec3 c = (texture(src, uv).rgb + (texture(b1, uv).rgb*0.6 + texture(b2, uv).rgb)*bloom)*exposure;
    const float A = 0.62; c = mix(c, A + (1.0 - A)*tanh((c - A)/(1.0 - A)), step(A, c));   // 0.62 以下原样，以上才压：白墙还是白的，颜色不被洗
    c = pow(max(c, 0.0), vec3(1.0/2.2)); c = c*c*(3.0 - 2.0*c)*0.35 + c*0.65;          // 一点点对比
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722)); c = mix(vec3(l), c, sat);
    vec2 d = uv - 0.5; c *= 1.0 - vign*smoothstep(0.25, 1.0, dot(d, d)*2.4);
    c += (h(uv*res) - 0.5)*grain; o = vec4(c, 1.0);
  }`;

  async function render(canvas, sc, { spp = 16, tiles = 6, log = () => {} } = {}) {
    const gl = GLK.create(canvas), W = canvas.width, H = canvas.height, t0 = performance.now();
    const atlas = buildAtlas(gl, sc.masks || []);
    const P = compile(gl, sc, atlas), acc = GLK.fbo(gl, W, H), res = GLK.fbo(gl, W, H);
    const Q = { resolve: GLK.program(gl, FS_RESOLVE), bright: GLK.program(gl, FS_BRIGHT), blur: GLK.program(gl, FS_BLUR), comp: GLK.program(gl, FS_COMP) };
    log('compiled ' + ((performance.now() - t0) / 1000).toFixed(1) + 's');
    gl.bindFramebuffer(gl.FRAMEBUFFER, acc.fb); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    for (let k = 0; k < spp; k++) {
      await GLK.drawTiled(gl, acc, tiles, () => { gl.useProgram(P); GLK.bindTex(gl, P, 'uAtlas', atlas.tex, 0); gl.uniform2f(P.u.uRes, W, H); gl.uniform1f(P.u.uSeed, k + 1); });
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, new Float32Array(4));
      log(`spp ${k + 1}/${spp} ${((performance.now() - t0) / 1000).toFixed(1)}s`);
    }
    gl.disable(gl.BLEND);
    gl.useProgram(Q.resolve); GLK.bindTex(gl, Q.resolve, 'src', acc.tex, 0); gl.uniform1f(Q.resolve.u.inv, 1 / spp); GLK.draw(gl, res);
    const lv = [4, 12].map(s => [GLK.fbo(gl, W / s | 0, H / s | 0), GLK.fbo(gl, W / s | 0, H / s | 0)]);
    let src = res.tex, first = true;
    for (const [a, b] of lv) {
      gl.useProgram(Q.bright); GLK.bindTex(gl, Q.bright, 'src', src, 0); gl.uniform1f(Q.bright.u.thr, first ? (sc.thr ?? 1.6) : 0); GLK.draw(gl, a);
      gl.useProgram(Q.blur);
      for (let i = 0; i < 2; i++) { GLK.bindTex(gl, Q.blur, 'src', a.tex, 0); gl.uniform2f(Q.blur.u.dir, 1.3 / a.w, 0); GLK.draw(gl, b); GLK.bindTex(gl, Q.blur, 'src', b.tex, 0); gl.uniform2f(Q.blur.u.dir, 0, 1.3 / a.h); GLK.draw(gl, a); }
      src = a.tex; first = false;
    }
    gl.useProgram(Q.comp); GLK.bindTex(gl, Q.comp, 'src', res.tex, 0); GLK.bindTex(gl, Q.comp, 'b1', lv[0][0].tex, 1); GLK.bindTex(gl, Q.comp, 'b2', lv[1][0].tex, 2);
    gl.uniform1f(Q.comp.u.exposure, sc.exposure ?? 1); gl.uniform1f(Q.comp.u.bloom, sc.bloom ?? 0.1); gl.uniform1f(Q.comp.u.grain, sc.grain ?? 0.02);
    gl.uniform1f(Q.comp.u.vign, sc.vignette ?? 0.25); gl.uniform1f(Q.comp.u.sat, sc.sat ?? 1.06); gl.uniform2f(Q.comp.u.res, W, H);
    GLK.draw(gl, null);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    log('done ' + ((performance.now() - t0) / 1000).toFixed(1) + 's');
  }
  // 画遮罩用的小工具：一个字、一条 SVG 路径（坐标按 100×100 写，自动居中放大）
  // 一个字：按大写字母的高度归一（字高 = 格子高 × size），所以物体的半高就是 size × s；fat 把笔画加粗（圆头），单位同 size
  const capH = font => { const x = document.createElement('canvas').getContext('2d'); x.font = font.replace('$', 200); return x.measureText('H').actualBoundingBoxAscent / 200; };
  const glyph = (ch, font, size = 0.8, fat = 0) => (x, S) => { x.textAlign = 'left'; x.font = font.replace('$', Math.round(size * S / 2 / capH(font))); const m = x.measureText(ch);
    const px = S / 2 - (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2, py = S / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
    x.fillText(ch, px, py); if (fat) { x.lineWidth = fat * S; x.strokeText(ch, px, py); } };
  // 这个字的墨迹有多宽、多高（单位同上，已含加粗）：排字用
  const inkSize = (ch, font, size = 0.8, fat = 0) => { const x = document.createElement('canvas').getContext('2d'); x.font = font.replace('$', 400); const m = x.measureText(ch), k = size / (400 * capH(font));
    return [(m.actualBoundingBoxRight + m.actualBoundingBoxLeft) * k + fat, (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) * k + fat]; };
  const path = (d, { stroke = 0, scale = 0.8 } = {}) => (x, S) => { x.translate(S / 2, S / 2); x.scale(S * scale / 100, S * scale / 100); x.translate(-50, -50); const p = new Path2D(d); if (stroke) { x.lineWidth = stroke; x.stroke(p); } else x.fill(p); };
  return { render, glyph, inkSize, path, rgb };
})();
