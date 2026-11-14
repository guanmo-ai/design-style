// paint.js — 绘画感 3D（Painterly 3D）候选图的渲染器
// 两步：① WebGL 光线步进出几何缓冲（法线 / 受光 / 投影 / AO / 部件号 / 世界坐标）；
//       ② CPU 上照“画家的做法”一笔一笔画：光只分三档 → 由粗到细四层笔触，笔触顺着等光线（⟂∇L）走 →
//          手画轮廓（亮面断开、暗面加粗）→ 2D 手画特效（蒸汽、闪光）→ 画布纹理。
// 每一步都是确定的（固定随机种子），同一组参数永远出同一张画。
(function (G) {
  // ———————————————————— ① 几何缓冲 ————————————————————
  const FS = `#version 300 es
  precision highp float;
  layout(location=0) out vec4 o0;  // N.xyz, t
  layout(location=1) out vec4 o1;  // id, ndl, shadow, ao
  layout(location=2) out vec4 o2;  // world pos, spec
  layout(location=3) out vec4 o3;  // rim(1-N·V), N·up, part-local y, 0
  uniform vec2 full; uniform vec3 ro, ta; uniform float fov, rot, cupOn, tableOn, sceneId;
  uniform vec3 ldir, cupPos; uniform float cupRot, potScale;

  float smin(float a,float b,float k){ float h=clamp(0.5+0.5*(b-a)/k,0.,1.); return mix(b,a,h)-k*h*(1.-h); }
  float sdEll(vec3 p, vec3 r){ float k0=length(p/r); float k1=length(p/(r*r)); return k0*(k0-1.0)/k1; }
  vec2 sdBez(vec3 pos, vec3 A, vec3 B, vec3 C){
    vec3 a = B - A; vec3 b = A - 2.0*B + C; vec3 c = a * 2.0; vec3 d = A - pos;
    float kk = 1.0/dot(b,b); float kx = kk*dot(a,b); float ky = kk*(2.0*dot(a,a)+dot(d,b))/3.0; float kz = kk*dot(d,a);
    vec2 res; float p = ky - kx*kx; float p3 = p*p*p; float q = kx*(2.0*kx*kx - 3.0*ky) + kz; float h = q*q + 4.0*p3;
    if(h >= 0.0){ h = sqrt(h); vec2 x = (vec2(h,-h)-q)/2.0; vec2 uv = sign(x)*pow(abs(x), vec2(1.0/3.0));
      float t = clamp(uv.x+uv.y-kx, 0.0, 1.0); vec3 q2 = d + (c + b*t)*t; res = vec2(dot(q2,q2), t); }
    else { float z = sqrt(-p); float v = acos(q/(p*z*2.0))/3.0; float m = cos(v); float n = sin(v)*1.732050808;
      vec3 t = clamp(vec3(m+m,-n-m,n-m)*z - kx, 0.0, 1.0);
      vec3 q1 = d + (c+b*t.x)*t.x; float d1 = dot(q1,q1); vec3 q2 = d + (c+b*t.y)*t.y; float d2 = dot(q2,q2);
      res = d1<d2 ? vec2(d1,t.x) : vec2(d2,t.y); }
    res.x = sqrt(res.x); return res;
  }
  mat2 r2(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }

  // 茶壶（犹他茶壶的近似：扁球壶身 + 盖 + 钮 + 贝塞尔壶嘴 / 把手）。返回 (距离, 部件号)
  vec2 teapot(vec3 p){
    float body = sdEll(p - vec3(0,0.66,0), vec3(1.0,0.70,1.0));
    body = max(body, -p.y + 0.03);
    body = max(body, p.y - 1.2);
    vec2 q = vec2(length(p.xz) - 0.64, p.y - 1.19); float rim = length(q) - 0.05;
    body = smin(body, rim, 0.03);
    float lid = sdEll(p - vec3(0,1.19,0), vec3(0.6,0.25,0.6)); lid = max(lid, 1.19 - p.y);
    float knob = sdEll(p - vec3(0,1.5,0), vec3(0.12,0.1,0.12));
    float stem = length(vec2(length(p.xz), max(abs(p.y-1.42)-0.05,0.0))) - 0.055;
    lid = smin(lid, smin(knob, stem, 0.03), 0.05);
    vec2 sb = sdBez(p, vec3(0.72,0.40,0), vec3(1.5,0.42,0), vec3(1.62,1.1,0));
    float sr = mix(0.25, 0.085, sqrt(sb.y)) + 0.035*smoothstep(0.88,1.0,sb.y);
    float spout = sb.x - sr;
    vec3 ph = vec3(p.x, p.y, p.z*1.7);
    vec2 h1 = sdBez(ph, vec3(-0.86,1.0,0), vec3(-1.78,1.16,0), vec3(-1.5,0.62,0));
    vec2 h2 = sdBez(ph, vec3(-1.5,0.62,0), vec3(-1.27,0.2,0), vec3(-0.84,0.33,0));
    float handle = (min(h1.x, h2.x) - 0.085) * 0.62;
    float d = smin(body, spout, 0.09); float part = spout < body ? 2.0 : 0.0;
    float d2 = smin(d, handle, 0.07); if (handle < d) part = 3.0; d = d2;
    if (lid < d) part = 1.0;
    d = min(d, lid);
    return vec2(d, part);
  }
  // 杯子 + 碟子 + 茶
  vec2 cup(vec3 p){
    float h = 0.5;
    float rr = mix(0.3, 0.44, clamp(p.y/h,0.,1.));
    float outer = max(length(p.xz) - rr, max(-p.y+0.07, p.y-h));
    float shell = max(abs(length(p.xz) - rr + 0.03) - 0.03, max(-p.y+0.07, p.y-h));
    shell = min(shell, max(length(p.xz)-rr, abs(p.y-0.1)-0.03));
    vec2 lp = vec2(length(p.xz)-0.0, p.y);
    float saucer = sdEll(p - vec3(0,0.045,0), vec3(0.72,0.05,0.72));
    vec3 hp = p - vec3(0.47,0.28,0); float hd = length(vec2(length(hp.xy)-0.11, hp.z)) - 0.03; hd = max(hd, 0.36 - p.x);
    float c = min(min(shell, saucer), hd);
    float tea = max(length(p.xz) - (rr-0.05), abs(p.y-0.4)-0.01);
    if (tea < c) return vec2(tea, 6.0);
    return vec2(c, saucer < shell && saucer < hd ? 5.0 : 4.0);
  }
  // 场景：id = 材质*10 + 部件；1x 茶壶 · 2x 杯 · 3x 茶 · 4x 桌 · 5x 球
  vec2 map(vec3 p){
    vec2 res = vec2(1e9, 0.0);
    if (sceneId < 0.5) {
      vec3 q = p; q.xz = r2(rot) * q.xz; q /= potScale;
      vec2 t = teapot(q); t.x *= potScale;
      res = vec2(t.x, 10.0 + t.y);
      if (cupOn > 0.5) { vec3 cq = p - cupPos; cq.xz = r2(cupRot)*cq.xz; vec2 c = cup(cq);
        if (c.x < res.x) res = vec2(c.x, c.y < 5.5 ? (c.y > 4.5 ? 21.0 : 20.0) : 30.0); }
    } else {
      float s = length(p - vec3(0,1.0,0)) - 1.0; res = vec2(s, 50.0);
    }
    if (tableOn > 0.5) { vec3 bq = abs(p - vec3(0.4,-0.2,0.2)) - vec3(4.6,0.2,2.3); float tb = length(max(bq,0.0)) + min(max(bq.x,max(bq.y,bq.z)),0.0) - 0.004;
      if (tb < res.x) res = vec2(tb, 40.0); }
    return res;
  }
  vec3 nrm(vec3 p){ vec2 e = vec2(0.0007, 0); return normalize(vec3(map(p+e.xyy).x-map(p-e.xyy).x, map(p+e.yxy).x-map(p-e.yxy).x, map(p+e.yyx).x-map(p-e.yyx).x)); }
  float shadow(vec3 ro, vec3 rd){ float res = 1.0, t = 0.02;
    for (int i=0;i<64;i++){ float h = map(ro+rd*t).x; if (h<0.0008) return 0.0; res = min(res, 14.0*h/t); t += clamp(h, 0.01, 0.3); if (t>12.0) break; }
    return clamp(res,0.,1.); }
  float ao(vec3 p, vec3 n){ float o = 0.0, s = 1.0; for (int i=1;i<=5;i++){ float h = 0.03 + 0.09*float(i); o += (h - map(p+n*h).x)*s; s *= 0.7; } return clamp(1.0 - 1.6*o, 0.0, 1.0); }
  void main(){
    vec2 fc = gl_FragCoord.xy;
    vec2 pp = (2.0*fc - full)/full.y;
    vec3 cw = normalize(ta-ro), cu = normalize(cross(cw, vec3(0,1,0))), cv = cross(cu,cw);
    vec3 rd = normalize(pp.x*cu + pp.y*cv + fov*cw);
    float t = 0.0; vec2 h = vec2(1e9, 0.0); bool hit = false;
    for (int i=0;i<160;i++){ h = map(ro+rd*t); if (h.x < 0.0004*t) { hit = true; break; } t += h.x*0.9; if (t > 40.0) break; }
    if (!hit) { o0 = vec4(0,0,0,-1); o1 = vec4(0); o2 = vec4(ro+rd*40.0, 0); o3 = vec4(0); return; }
    vec3 p = ro + rd*t; vec3 n = nrm(p);
    vec3 L = normalize(ldir);
    float ndl = dot(n, L);
    float sh = ndl > 0.0 ? shadow(p + n*0.004, L) : 0.0;
    float a = ao(p, n);
    vec3 hv = normalize(L - rd); float spec = pow(max(dot(n,hv),0.0), 60.0) * sh;
    o0 = vec4(n, t); o1 = vec4(h.y, ndl, sh, a); o2 = vec4(p, spec); o3 = vec4(1.0 - abs(dot(n,-rd)), n.y, 0, 0);
  }`;

  // 相机（和着色器同一套），把世界坐标投到画面像素（左上为原点）
  function camera(c, W, H) {
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const nz = a => { const l = Math.hypot(...a); return a.map(v => v / l); };
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const cw = nz(sub(c.ta, c.ro)), cu = nz(cross(cw, [0, 1, 0])), cv = cross(cu, cw);
    return X => { const d = sub(X, c.ro); const z = dot(d, cw); const x = dot(d, cu) / z * c.fov, y = dot(d, cv) / z * c.fov;
      return [(x * H + W) / 2, H - (y * H + H) / 2]; };
  }
  // 茶壶局部坐标 → 世界（绕 y 转 rot，缩放 potScale）
  function potToWorld(c, p) { const s = c.potScale || 1, a = c.rot || 0; const x = p[0] * s, z = p[2] * s;
    // GLSL 里 q.xz = r2(rot)*q.xz，r2 = mat2(c,-s,s,c)（列主序）：q.x' = c*x + s*z, q.z' = -s*x + c*z；这里取逆
    const co = Math.cos(a), si = Math.sin(a); return [co * x - si * z, p[1] * s, si * x + co * z]; }

  let PROG = null;
  async function gbuffer(gl, W, H, c) {
    if (!PROG) PROG = GLK.program(gl, FS);
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    const texs = [];
    for (let i = 0; i < 4; i++) {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, W, H, 0, gl.RGBA, gl.FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0); texs.push(t);
    }
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2, gl.COLOR_ATTACHMENT3]);
    gl.useProgram(PROG); const u = PROG.u;
    gl.uniform2f(u.full, W, H); gl.uniform3fv(u.ro, c.ro); gl.uniform3fv(u.ta, c.ta); gl.uniform1f(u.fov, c.fov);
    gl.uniform1f(u.rot, c.rot || 0); gl.uniform1f(u.cupOn, c.cup ? 1 : 0); gl.uniform1f(u.tableOn, c.table === false ? 0 : 1);
    gl.uniform1f(u.sceneId, c.scene || 0); gl.uniform3fv(u.ldir, c.light); gl.uniform3fv(u.cupPos, c.cupPos || [9, 0, 9]);
    gl.uniform1f(u.cupRot, c.cupRot || 0); gl.uniform1f(u.potScale, c.potScale || 1);
    gl.viewport(0, 0, W, H); gl.enable(gl.SCISSOR_TEST);
    const T = Math.max(1, Math.round(Math.max(W, H) / 160));
    const tw = Math.ceil(W / T), th = Math.ceil(H / T);
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
      gl.scissor(x * tw, y * th, tw, th); gl.bindVertexArray(gl._tri); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.finish(); await GLK.tick();
    }
    gl.disable(gl.SCISSOR_TEST);
    const out = [];
    for (let i = 0; i < 4; i++) {
      gl.readBuffer(gl.COLOR_ATTACHMENT0 + i);
      const a = new Float32Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.FLOAT, a);
      // 上下翻转成左上原点
      const f = new Float32Array(W * H * 4);
      for (let y = 0; y < H; y++) f.set(a.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4);
      out.push(f);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); texs.forEach(t => gl.deleteTexture(t)); gl.deleteFramebuffer(fb);
    const N = W * H, B = { W, H, cam: camera(c, W, H), c };
    B.id = new Int16Array(N); B.ndl = new Float32Array(N); B.sh = new Float32Array(N); B.ao = new Float32Array(N);
    B.nx = new Float32Array(N); B.ny = new Float32Array(N); B.nz = new Float32Array(N); B.t = new Float32Array(N);
    B.px = new Float32Array(N); B.py = new Float32Array(N); B.pz = new Float32Array(N); B.spec = new Float32Array(N);
    B.rim = new Float32Array(N); B.up = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const j = i * 4;
      B.nx[i] = out[0][j]; B.ny[i] = out[0][j + 1]; B.nz[i] = out[0][j + 2]; B.t[i] = out[0][j + 3];
      B.id[i] = Math.round(out[1][j]); B.ndl[i] = out[1][j + 1]; B.sh[i] = out[1][j + 2]; B.ao[i] = out[1][j + 3];
      B.px[i] = out[2][j]; B.py[i] = out[2][j + 1]; B.pz[i] = out[2][j + 2]; B.spec[i] = out[2][j + 3];
      B.rim[i] = out[3][j]; B.up[i] = out[3][j + 1];
    }
    return B;
  }

  // ———————————————————— ② 画 ————————————————————
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = Math.imul(s ^ (s >>> 15), 0x2c1b3c6d) + 0x9e3779b9 >>> 0, s = Math.imul(s ^ (s >>> 12), 0x297a2d39) >>> 0, (s ^ (s >>> 15)) >>> 0) / 4294967296); }
  function vnoise(seed) { // 平滑值噪声（2D）
    const R = rng(seed), P = new Float32Array(512); for (let i = 0; i < 512; i++) P[i] = R();
    const hsh = (x, y) => P[((x * 73856093) ^ (y * 19349663)) & 511];
    return (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      return (hsh(xi, yi) * (1 - u) + hsh(xi + 1, yi) * u) * (1 - v) + (hsh(xi, yi + 1) * (1 - u) + hsh(xi + 1, yi + 1) * u) * v; };
  }

  // 默认调色：每种材质 = 暗 / 明暗交界 / 中 / 亮 / 高光 / 反光（边缘冷光）/ 顶面天光
  const PAL = {
    1: { sh: '#3d1846', core: '#2a0f37', term: '#b81f45', mid: '#d4472f', lit: '#f28a4a', hi: '#ffe6b3', rim: '#58e3d9', sky: '#5a3f8f' },
    2: { sh: '#2e3a6e', core: '#1f2855', term: '#6a5aa8', mid: '#a9bfca', lit: '#f3e8d0', hi: '#ffffff', rim: '#ff7aa8', sky: '#6c86b8' },
    3: { sh: '#4a1e14', core: '#33120c', term: '#a33a12', mid: '#c4651c', lit: '#eaa43e', hi: '#fff3c4', rim: '#ffb35c', sky: '#7a3d2a' },
    4: { sh: '#21183a', core: '#160f2a', term: '#4f2840', mid: '#7a4434', lit: '#a8683f', hi: '#f6c47c', rim: '#d4685a', sky: '#3a2a52' },
    5: { sh: '#2b1f5e', core: '#1b1240', term: '#c0335a', mid: '#e0573c', lit: '#f7a052', hi: '#fff0c4', rim: '#4fe0d6', sky: '#4b4aa0' },
  };
  // 一个像素该用的颜色（“三档光”）。L = 受光 × 投影；返回 [rgb, 档位 0–4]
  function shadeAt(B, i, pal, opt) {
    const P = pal[(B.id[i] / 10) | 0]; if (!P) return null;
    const C = P._c || (P._c = Object.fromEntries(Object.entries(P).map(([k, v]) => [k, hex(v)])));
    const L = Math.max(0, B.ndl[i]) * B.sh[i];
    const bb = (opt.bandsBy && opt.bandsBy[(B.id[i] / 10) | 0]) || opt.bands || [0.08, 0.2, 0.55];
    const b1 = bb[0], b2 = bb[1], b3 = bb[2];
    let c, band;
    if (L < b1) { c = mix3(C.sh, C.sky, Math.max(0, B.up[i]) * 0.55); c = mix3(C.core, c, Math.min(1, B.ao[i] * 1.15)); band = 0; }
    else if (L < b2) { c = C.term; band = 1; }
    else if (L < b3) { c = C.mid; band = 2; }
    else { c = C.lit; band = 3; }
    if (opt.base) return [c, band];
    if (B.spec[i] > 0.42) { c = C.hi; band = 4; }
    // 边缘冷光：背光那一侧的轮廓
    if (opt.rim !== false && B.rim[i] > 0.68 && L < b2 && (B.id[i] / 10 | 0) !== 4) { c = mix3(c, C.rim, Math.min(1, (B.rim[i] - 0.68) * 5)); band = 5; }
    return [c, band];
  }

  // 方向场：笔触顺着等光线走（⟂ ∇L）；梯度太小的地方顺着轮廓绕（⟂ 屏幕法线）。用双倍角平滑，保证顺滑
  function directionField(B, opt) {
    const { W, H } = B, N = W * H;
    const Ls = new Float32Array(N);
    for (let i = 0; i < N; i++) Ls[i] = B.id[i] > 0 ? Math.max(0, B.ndl[i]) * (0.35 + 0.65 * B.sh[i]) : 0;
    GLK.blurField(Ls, W, H, 3);
    const cx = new Float32Array(N), cy = new Float32Array(N);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x; const m = (B.id[i] / 10) | 0;
      let dx, dy;
      if (m === 4) { dx = 1; dy = 0.04; }   // 桌面：横着刷
      else if (m === 0) { dx = 0.86; dy = -0.5; }
      else {
        const gx = Ls[i + 1] - Ls[i - 1], gy = Ls[i + W] - Ls[i - W]; const g = Math.hypot(gx, gy);
        const tx = -gy, ty = gx;                  // 等光线方向
        const ox = -B.ny[i], oy = -B.nx[i];        // 绕着轮廓（屏幕里法线的垂直方向；屏幕 y 向下）
        const w = Math.min(1, g / 0.012);
        dx = tx / (g + 1e-9) * w + ox * (1 - w); dy = ty / (g + 1e-9) * w + oy * (1 - w);
      }
      const l = Math.hypot(dx, dy) + 1e-9; dx /= l; dy /= l;
      cx[i] = dx * dx - dy * dy; cy[i] = 2 * dx * dy;
    }
    GLK.blurField(cx, W, H, opt.dirBlur || 5); GLK.blurField(cy, W, H, opt.dirBlur || 5);
    const ang = new Float32Array(N); for (let i = 0; i < N; i++) ang[i] = 0.5 * Math.atan2(cy[i], cx[i]);
    return ang;
  }

  // 一笔：底色一道 + 若干根“刷毛”，两头干、有长有短
  function brush(ctx, pts, w, col, R, o = {}) {
    if (pts.length < 2) return;
    const n = Math.max(4, Math.min(16, Math.round(w / 1.2)));
    const alpha = o.alpha ?? 0.92;
    // 每点的法线
    const nm = pts.map((p, k) => { const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; });
    const taper = k => { const u = k / (pts.length - 1); return Math.pow(Math.sin(Math.PI * Math.min(1, 0.12 + u * 0.88)), 0.35); };
    // 底色
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = css(col, alpha * 0.85); ctx.lineWidth = w * 0.78;
    ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
    // 刷毛
    const vj = o.vj ?? 14;
    for (let j = 0; j < n; j++) {
      const off = ((j + 0.5) / n - 0.5) * w * 0.95 + (R() - 0.5) * w * 0.08;
      const v = (R() - 0.5) * vj; const c = [col[0] + v + (R() - 0.5) * 5, col[1] + v + (R() - 0.5) * 5, col[2] + v + (R() - 0.5) * 5];
      const s0 = Math.floor(R() * R() * pts.length * 0.35), s1 = pts.length - Math.floor(R() * R() * pts.length * 0.45);
      if (s1 - s0 < 2) continue;
      ctx.strokeStyle = css(c, alpha * (0.5 + R() * 0.5)); ctx.lineWidth = Math.max(0.6, w / n * (1.1 + R() * 0.9));
      ctx.beginPath();
      for (let k = s0; k < s1; k++) { const tp = taper(k); const x = pts[k][0] + nm[k][0] * off * tp, y = pts[k][1] + nm[k][1] * off * tp; k === s0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke();
    }
  }

  // 由粗到细的一层：在格点上撒笔，沿方向场走，颜色变了 / 出了物体就停（Hertzmann 1998 的做法）
  function paintLayer(ctx, B, F, ang, layer, R, o) {
    const { W, H } = B, S = o.scale || 1, ox = o.x || 0, oy = o.y || 0;
    const { size, grid, len, filter } = layer;
    const seeds = [];
    for (let y = grid / 2; y < H; y += grid) for (let x = grid / 2; x < W; x += grid) {
      const sx = Math.min(W - 1, Math.max(0, Math.round(x + (R() - 0.5) * grid))), sy = Math.min(H - 1, Math.max(0, Math.round(y + (R() - 0.5) * grid)));
      seeds.push([sx, sy, R()]);
    }
    seeds.sort((a, b) => a[2] - b[2]);
    for (const [sx, sy] of seeds) {
      const i0 = sy * W + sx; const f0 = F[i0]; if (!f0) continue;
      if (filter && !filter(i0, f0)) continue;
      const col = (layer.base && f0.c0) ? f0.c0 : f0.c; const id0 = f0.m;
      const pts = [[sx, sy]];
      const step = Math.max(1.5, size * 0.45), maxN = Math.max(2, Math.round(size * len / step));
      for (const dirSign of [1, -1]) {
        let x = sx, y = sy, pdx = 0, pdy = 0;
        const half = Math.round(maxN * (dirSign > 0 ? 0.55 : 0.45));
        for (let k = 0; k < half; k++) {
          const i = (Math.round(y) * W + Math.round(x)); const a = ang[i]; let dx = Math.cos(a), dy = Math.sin(a);
          if (k === 0) { dx *= dirSign; dy *= dirSign; } else if (dx * pdx + dy * pdy < 0) { dx = -dx; dy = -dy; }
          const nx = x + dx * step, ny = y + dy * step;
          if (nx < 0 || ny < 0 || nx > W - 1 || ny > H - 1) break;
          const f = F[Math.round(ny) * W + Math.round(nx)]; if (!f || f.m !== id0) break;
          const fc = (layer.base && f.c0) ? f.c0 : f.c;
          const dc = Math.abs(fc[0] - col[0]) + Math.abs(fc[1] - col[1]) + Math.abs(fc[2] - col[2]);
          if (dc > (layer.tol || 60)) break;
          x = nx; y = ny; pdx = dx; pdy = dy;
          if (dirSign > 0) pts.push([x, y]); else pts.unshift([x, y]);
        }
      }
      if (pts.length < 2) { const a = ang[i0]; pts.push([sx + Math.cos(a) * size * 0.6, sy + Math.sin(a) * size * 0.6]); }
      // 轻微抖动，不像机器画的
      const wob = size * 0.06;
      const P = pts.map(p => [ox + (p[0] + (R() - 0.5) * wob) * S, oy + (p[1] + (R() - 0.5) * wob) * S]);
      const v = (R() - 0.5) * (layer.cj ?? 16);
      brush(ctx, P, size * S * (0.85 + R() * 0.3), [col[0] + v, col[1] + v * 0.9, col[2] + v * 0.8], R, { alpha: layer.alpha ?? 0.94, vj: layer.vj });
    }
  }

  // 目标颜色场 F[i] = { c: rgb, b: 档位, m: 材质 }（背景交给 bgColor(x,y)）
  function targetField(B, pal, opt) {
    const { W, H } = B, N = W * H, F = new Array(N);
    const nz = vnoise(opt.seed || 7);
    for (let i = 0; i < N; i++) {
      const id = B.id[i]; const x = i % W, y = (i / W) | 0;
      if (id <= 0) { if (opt.bgColor) F[i] = { c: opt.bgColor(x, y), b: 0, m: 0 }; continue; }
      const s = shadeAt(B, i, pal, opt); if (!s) continue;
      // 同一档里也有一点起伏（纸面上颜料的厚薄）
      const v = (nz(x / 23, y / 23) - 0.5) * (opt.wobble ?? 22);
      const s0 = shadeAt(B, i, pal, Object.assign({}, opt, { base: true }));
      F[i] = { c: [s[0][0] + v, s[0][1] + v, s[0][2] + v * 0.8], c0: [s0[0][0] + v, s0[0][1] + v, s0[0][2] + v * 0.8], b: s[1], m: (id / 10) | 0, part: id % 10 };
    }
    return F;
  }

  // 边缘（相邻像素材质 / 部件不同，或深度跳变）
  function edgeMap(B) {
    const { W, H } = B, E = new Uint8Array(W * H);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x, a = B.id[i]; if (a <= 0 || ((a / 10) | 0) === 4) continue;
      for (const j of [i + 1, i - 1, i + W, i - W]) {
        const b = B.id[j];
        if (b !== a && !(b > 0 && ((b / 10) | 0) !== 4 && B.t[j] < B.t[i] - 0.02)) { E[i] = 1; break; }
        if (b === a && B.t[j] > B.t[i] + 0.06 * B.t[i]) { E[i] = 1; break; }
      }
    }
    return E;
  }
  // 把边缘像素串成折线（贪心：从一个点出发，每次找 2 像素内最近的未用点）
  function traceEdges(E, W, H) {
    const used = new Uint8Array(W * H), lines = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let i = y * W + x; if (!E[i] || used[i]) continue;
      const line = [[x, y]]; used[i] = 1;
      for (const dir of [0, 1]) {
        let cx = x, cy = y;
        for (;;) {
          let best = -1, bd = 1e9;
          for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
            const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            const j = ny * W + nx; if (!E[j] || used[j]) continue; const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = j; }
          }
          if (best < 0) break;
          // 把近旁的点也标掉，线就不会变双
          const bx = best % W, by = (best / W) | 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const j = (by + dy) * W + bx + dx; if (j >= 0 && j < W * H && E[j]) used[j] = 1; }
          cx = bx; cy = by; if (dir === 0) line.push([cx, cy]); else line.unshift([cx, cy]);
        }
      }
      if (line.length > 4) lines.push(line);
    }
    // 平滑
    return lines.map(l => l.map((p, k) => { let sx = 0, sy = 0, n = 0; for (let d = -3; d <= 3; d++) { const q = l[Math.min(l.length - 1, Math.max(0, k + d))]; sx += q[0]; sy += q[1]; n++; } return [sx / n, sy / n]; }));
  }
  // 手画轮廓：受光强的地方线断开（“丢边”），背光的地方加粗
  function drawLines(ctx, B, lines, R, o) {
    const S = o.scale || 1, ox = o.x || 0, oy = o.y || 0, { W } = B;
    const col = hex(o.color || '#1b0f2e');
    for (const l of lines) {
      for (let k = 0; k < l.length - 1; k++) {
        const [x, y] = l[k], [x2, y2] = l[k + 1];
        // 取线旁物体那一侧的受光
        const i = Math.round(y) * W + Math.round(x);
        let Lmax = 0; for (const j of [i, i + 2, i - 2, i + 2 * W, i - 2 * W]) if (B.id[j] > 0) Lmax = Math.max(Lmax, Math.max(0, B.ndl[j]) * B.sh[j]);
        const lost = o.lose === false ? 1 : Math.max(0, Math.min(1, (0.78 - Lmax) / 0.3));
        if (lost < 0.05) continue;
        const w = (o.w0 ?? 0.9) + (o.w1 ?? 3.2) * Math.pow(1 - Math.min(1, Lmax), 1.4);
        ctx.strokeStyle = css(col, 0.92 * lost); ctx.lineWidth = w * S * (0.85 + R() * 0.3); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(ox + x * S, oy + y * S); ctx.lineTo(ox + x2 * S, oy + y2 * S); ctx.stroke();
      }
    }
  }

  // 画布纹理（斜纹 + 颗粒），叠加在最上面
  function canvasTexture(ctx, w, h, o = {}) {
    const c = document.createElement('canvas'); const s = 256; c.width = c.height = s; const g = c.getContext('2d');
    const im = g.createImageData(s, s); const R = rng(91);
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const weave = 0.5 + 0.25 * Math.sin(x * 1.6) * Math.sin(y * 1.6) + 0.25 * Math.sin((x + y) * 0.8);
      const v = 128 + (weave - 0.5) * 60 + (R() - 0.5) * 50; const i = (y * s + x) * 4;
      im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = o.alpha ?? 0.16;
    ctx.fillStyle = ctx.createPattern(c, 'repeat'); ctx.fillRect(0, 0, w, h); ctx.restore();
  }

  // 2D 手画蒸汽：一条中线 + 两侧宽度 → 封闭形；平涂两色 + 墨线
  function wisp(ctx, pts, wmax, o = {}) {
    const n = pts.length; const L = [], Rr = [];
    for (let k = 0; k < n; k++) {
      const a = pts[Math.max(0, k - 1)], b = pts[Math.min(n - 1, k + 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1;
      const u = k / (n - 1); const w = wmax * Math.pow(Math.sin(Math.PI * u), 0.8) * (o.shape ? o.shape(u) : 1);
      L.push([pts[k][0] - dy / l * w, pts[k][1] + dx / l * w]); Rr.push([pts[k][0] + dy / l * w, pts[k][1] - dx / l * w]);
    }
    const path = new Path2D(); const all = L.concat(Rr.reverse());
    path.moveTo(all[0][0], all[0][1]);
    for (let k = 1; k < all.length - 1; k++) { const m = [(all[k][0] + all[k + 1][0]) / 2, (all[k][1] + all[k + 1][1]) / 2]; path.quadraticCurveTo(all[k][0], all[k][1], m[0], m[1]); }
    path.closePath();
    // 平涂两色：先整块涂阴影色，再把往光源那边挪一点的同一形状涂成亮色——剩下的月牙就是阴影
    ctx.save(); ctx.globalAlpha = o.alpha ?? 1; ctx.clip(path);
    ctx.fillStyle = o.shade || '#9fc6c8'; ctx.fill(path);
    ctx.translate(o.shx ?? -7, o.shy ?? -6); ctx.fillStyle = o.fill || '#f6e8d2'; ctx.fill(path);
    ctx.restore();
    ctx.strokeStyle = o.line || '#1b0f2e'; ctx.lineWidth = o.lw ?? 2.4; ctx.lineJoin = 'round'; ctx.globalAlpha = o.alpha ?? 1; ctx.stroke(path); ctx.globalAlpha = 1;
  }
  // 四角星闪光
  function sparkle(ctx, x, y, r, col = '#fff6dc', line = '#1b0f2e') {
    const p = new Path2D(); const k = 0.18;
    p.moveTo(x, y - r); p.quadraticCurveTo(x + r * k, y - r * k, x + r, y); p.quadraticCurveTo(x + r * k, y + r * k, x, y + r);
    p.quadraticCurveTo(x - r * k, y + r * k, x - r, y); p.quadraticCurveTo(x - r * k, y - r * k, x, y - r); p.closePath();
    ctx.fillStyle = col; ctx.fill(p); ctx.strokeStyle = line; ctx.lineWidth = Math.max(1, r * 0.07); ctx.stroke(p);
  }

  // 粘土 / 视口那一面：Blender“实体”模式那样的灰（顶上亮一点），桌面画网格
  function clayImage(B, o = {}) {
    const { W, H } = B, im = new ImageData(W, H);
    const kd = [-0.35, 0.62, 0.7], kl = Math.hypot(...kd);
    for (let i = 0; i < W * H; i++) {
      const x = i % W, y = (i / W) | 0, j = i * 4; let c;
      const m = (B.id[i] / 10) | 0;
      if (B.id[i] <= 0 || m === 4) {
        const g = 0.30 - 0.11 * (y / H); c = [g, g, g];
        const ro = B.c.ro; let wx = B.px[i], wz = B.pz[i], t = B.t[i], onFloor = m === 4 && B.py[i] > -0.01;
        if (!onFloor) { const dx = B.px[i] - ro[0], dy = B.py[i] - ro[1], dz = B.pz[i] - ro[2]; if (dy < 0) { const k = -ro[1] / dy; wx = ro[0] + dx * k; wz = ro[2] + dz * k; t = k * Math.hypot(dx, dy, dz); onFloor = true; } }
        if (onFloor) {
          const fw = 0.0022 * t * 1.6;
          const ln = (v, s) => { const f = Math.abs(v / s - Math.round(v / s)) * s; return Math.max(0, 1 - f / fw); };
          const fade = Math.max(0, 1 - t / 16);
          let gl = Math.max(ln(wx, 0.5), ln(wz, 0.5)) * 0.07 * fade;
          c = [g + gl, g + gl, g + gl];
          const ax = Math.max(0, 1 - Math.abs(wz) / (fw * 1.4)) * fade, az = Math.max(0, 1 - Math.abs(wx) / (fw * 1.4)) * fade;
          c = mix3(c, [0.62, 0.22, 0.25], ax * 0.9); c = mix3(c, [0.42, 0.6, 0.22], az * 0.9);
          // 物体落在地上的影子（视口里也有一点接触阴影）
          if (m === 4) c = c.map(v => v * (0.75 + 0.25 * B.ao[i]));
        }
      } else {
        const d = (B.nx[i] * kd[0] + B.ny[i] * kd[1] + B.nz[i] * kd[2]) / kl;
        let v = 0.2 + 0.5 * Math.max(0, d) + 0.12 * B.ny[i] + 0.12 * Math.max(0, B.ndl[i]);
        v *= 0.6 + 0.4 * B.ao[i]; v += 0.25 * Math.pow(B.spec[i], 2);
        c = [v * 0.98, v, v * 1.02];
      }
      im.data[j] = Math.min(255, Math.pow(Math.max(0, c[0]), 1 / 1.25) * 255); im.data[j + 1] = Math.min(255, Math.pow(Math.max(0, c[1]), 1 / 1.25) * 255);
      im.data[j + 2] = Math.min(255, Math.pow(Math.max(0, c[2]), 1 / 1.25) * 255); im.data[j + 3] = 255;
    }
    return im;
  }

  // 平涂三档（没有笔触）：给配方卡做对照
  function flatImage(B, pal, opt = {}) {
    const { W, H } = B, im = new ImageData(W, H);
    for (let i = 0; i < W * H; i++) { const j = i * 4; let c = opt.bg || [0, 0, 0];
      if (B.id[i] > 0) { const s = shadeAt(B, i, pal, opt); if (s) c = s[0]; }
      im.data[j] = c[0]; im.data[j + 1] = c[1]; im.data[j + 2] = c[2]; im.data[j + 3] = B.id[i] > 0 ? 255 : (opt.bgA ?? 0); }
    return im;
  }

  // 一整套：给一块区域画完
  const LAYERS = [
    { size: 26, grid: 14, len: 4.0, tol: 90, cj: 18 },
    { size: 15, grid: 8, len: 4.5, tol: 55, cj: 14 },
    { size: 8.5, grid: 5, len: 5.0, tol: 40, cj: 12 },
    { size: 4.6, grid: 3.2, len: 5.5, tol: 30, cj: 10 },
  ];
  function detailFilter(B, F, r) { // 只在颜色有变化的地方画细笔
    const { W, H } = B;
    return (i, f) => { const x = i % W, y = (i / W) | 0;
      for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r], [r, r], [-r, -r]]) {
        const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const g = F[yy * W + xx]; if (!g || g.m !== f.m || g.b !== f.b) return true; }
      return false; };
  }


  // 给一块面板画完：几何缓冲 → 颜色场 → 背景大笔 → 物体四层（按 k 缩放笔的大小）→ 轮廓
  // o: { w, h, pal, bands, bandsBy, k, bgColor(x,y), seed, clip(Path2D), objOnly, lines, pool:[x,z,r], B }
  async function paintPanel(gl, ctx, cam, o) {
    const B = o.B || await gbuffer(gl, o.w, o.h, cam);
    if (o.pool && !o.B) for (let i = 0; i < B.W * B.H; i++) if (((B.id[i] / 10) | 0) === 4) { const r = Math.hypot(B.px[i] - o.pool[0], B.pz[i] - o.pool[1]); B.ndl[i] *= Math.exp(-Math.pow(r / o.pool[2], 2)); }
    const F = targetField(B, o.pal || PAL, { bgColor: o.objOnly ? null : o.bgColor, seed: o.seed || 3, bands: o.bands || [0.08, 0.2, 0.68], bandsBy: o.bandsBy || { 4: [0.07, 0.16, 0.86] }, wobble: o.wobble });
    const ang = directionField(B, { dirBlur: o.dirBlur || 4 });
    const R = rng(o.seed || 3), k = o.k || 1;
    const sc = l => Object.assign({}, l, { size: l.size * k, grid: l.grid * k });
    ctx.save(); if (o.clip) ctx.clip(o.clip);
    if (o.bgColor && !o.objOnly) {
      for (const l of [{ size: 46, grid: 22, len: 3.0, tol: 200, cj: 16, alpha: 0.95 }, { size: 28, grid: 14, len: 3.2, tol: 200, cj: 12, alpha: 0.9 }])
        paintLayer(ctx, B, F, ang, Object.assign(sc(l), { filter: (i, f) => f.m === 0 }), R, {});
    }
    const objF = o.only ? (i, f) => o.only.includes(f.m) : (i, f) => f.m !== 0;
    for (let j = 0; j < 4; j++) {
      const filt = j < 2 ? null : detailFilter(B, F, j === 2 ? 6 : 3);
      paintLayer(ctx, B, F, ang, Object.assign(sc(LAYERS[j]), { base: j < 2, filter: j < 2 ? objF : (i, f) => objF(i, f) && (f.b >= 4 || filt(i, f)) }), R, {});
      await GLK.tick();
    }
    if (o.lines !== false) drawLines(ctx, B, traceEdges(edgeMap(B), B.W, B.H), R, { w0: (o.lw0 ?? 0.8) * Math.max(0.6, k), w1: (o.lw1 ?? 3.0) * Math.max(0.5, k) });
    ctx.restore();
    return { B, F, ang };
  }

  G.PAINT = { paintPanel, gbuffer, camera, potToWorld, targetField, directionField, paintLayer, brush, edgeMap, traceEdges, drawLines, canvasTexture, wisp, sparkle, clayImage, flatImage, shadeAt, detailFilter, LAYERS, PAL, hex, mix3, css, rng, vnoise };
})(window);
