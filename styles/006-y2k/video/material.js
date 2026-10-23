/**
 * 006 · Y2K —— 材质渲染器（WebGL2，视频和图片共用这一份）
 *
 * 文字 / 形状 → 掩码 → 距离场（EDT）→ 圆角倒角的高度场 → 法线
 * → 程序化“影棚”环境反射（铬：天空 + 地平线 + 地面）
 * + 果冻球（半透明有色塑料：折射 + 吸收 + 焦散）+ 肥皂泡（薄膜干涉彩虹）
 * + 液态玻璃面板（圆角矩形透镜：边缘折射 + 色散 + 边缘高光）
 *
 * 用法：Y2K.draw(canvas, cfg)（同步；高度场按文字内容缓存）· await Y2K.render(canvas, cfg)（先等字体）
 * 坐标：设计稿像素，y 向下；cfg.scale = 设计稿 → 画布像素
 */
(function (root) {
  const INF = 1e20;
  function edt1d(f, n, d, v, z) {
    let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
    for (let q = 1; q < n; q++) {
      let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
      k++; v[k] = q; z[k] = s; z[k + 1] = INF;
    }
    k = 0;
    for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
  }
  /** 掩码内部每个像素到边界的距离（像素，带亚像素修正） */
  function insideDist(alpha, w, h) {
    const g = new Float64Array(w * h);
    for (let i = 0; i < w * h; i++) g[i] = alpha[i] > 0.5 ? INF : 0;
    const n = Math.max(w, h), f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
    for (let x = 0; x < w; x++) { for (let y = 0; y < h; y++) f[y] = g[y * w + x]; edt1d(f, h, d, v, z); for (let y = 0; y < h; y++) g[y * w + x] = d[y]; }
    for (let y = 0; y < h; y++) { for (let x = 0; x < w; x++) f[x] = g[y * w + x]; edt1d(f, w, d, v, z); for (let x = 0; x < w; x++) g[y * w + x] = Math.sqrt(d[x]); }
    const out = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) out[i] = alpha[i] > 0.5 ? g[i] - 0.5 + (alpha[i] - 0.5) : alpha[i] - 0.5;
    return out;
  }
  function boxBlur(src, w, h, r) {
    const tmp = new Float32Array(w * h), out = new Float32Array(w * h);
    for (let y = 0; y < h; y++) { let acc = 0; const o = y * w;
      for (let x = -r; x <= r; x++) acc += src[o + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x++) { tmp[o + x] = acc / (2 * r + 1); acc += src[o + Math.min(w - 1, x + r + 1)] - src[o + Math.max(0, x - r)]; } }
    for (let x = 0; x < w; x++) { let acc = 0;
      for (let y = -r; y <= r; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) { out[y * w + x] = acc / (2 * r + 1); acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x]; } }
    return out;
  }
  const blur3 = (a, w, h, r) => boxBlur(boxBlur(boxBlur(a, w, h, r), w, h, r), w, h, r);

  /** 高度场：r = 高度（画布像素）g = 覆盖率 b = 模糊掩码（投影用）；按内容缓存 */
  const HF = new Map();
  function heightfield(cfg) {
    const S = cfg.scale || 1, W = Math.round(cfg.w * S), H = Math.round(cfg.h * S);
    const key = JSON.stringify([W, H, S, cfg.bevel, cfg.bulge, cfg.smooth, cfg.shadowBlur, cfg.texts, cfg.shapes]);
    if (HF.has(key)) return HF.get(key);
    const m = document.createElement('canvas'); m.width = W; m.height = H;
    const c2 = m.getContext('2d'); c2.fillStyle = '#fff';
    for (const t of cfg.texts || []) {
      c2.save(); c2.translate(t.x * S, t.y * S); if (t.skew) c2.transform(1, 0, t.skew, 1, 0, 0);
      c2.font = `${t.weight || 900} ${t.size * S}px ${t.font}`; c2.textAlign = t.align || 'left';
      if (t.ls) c2.letterSpacing = `${t.ls * S}px`;
      c2.fillText(t.text, 0, 0); c2.restore();
    }
    for (const sh of cfg.shapes || []) c2.fill(new Path2D(sh.d.replace(/-?\d+(\.\d+)?/g, n => (+n * S).toFixed(2))));
    const img = c2.getImageData(0, 0, W, H).data;
    const a = new Float32Array(W * H); for (let i = 0; i < W * H; i++) a[i] = img[i * 4 + 3] / 255;
    const dist = insideDist(a, W, H);
    const Rb = (cfg.bevel || 26) * S, hgt = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) { const t = Math.min(Math.max(dist[i], 0) / Rb, 1); hgt[i] = Rb * Math.sqrt(1 - (1 - t) * (1 - t)) * (cfg.bulge || 1); }
    const hs = blur3(hgt, W, H, Math.max(1, Math.round(S * (cfg.smooth || 2.4))));
    const sb = blur3(a, W, H, Math.max(1, Math.round((cfg.shadowBlur || 16) * S)));
    const data = new Float32Array(W * H * 4), shd = new Float32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {   // 上下翻转给 GL；斜率在 CPU 上算好，着色器少采样 4 次
      const i = y * W + x, o = ((H - 1 - y) * W + x) * 4;
      const xl = x > 0 ? i - 1 : i, xr = x < W - 1 ? i + 1 : i, yu = y > 0 ? i - W : i, yd = y < H - 1 ? i + W : i;
      data[o] = hs[i]; data[o + 1] = a[i]; data[o + 2] = (hs[xr] - hs[xl]) * 0.5; data[o + 3] = (hs[yd] - hs[yu]) * 0.5;
      shd[(H - 1 - y) * W + x] = sb[i];
    }
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (a[y * W + x] > 0.002) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const mg = Math.round((cfg.shadowBlur || 16) * S * 3);
    const bbox = x1 < 0 ? null : [x0 - mg, y0 - mg, x1 + mg, y1 + mg];   // 画布像素，含投影的余量
    const hf = {key, W, H, data, shd, bbox};
    HF.set(key, hf);
    if (HF.size > 6) HF.delete(HF.keys().next().value);
    return hf;
  }

  const VS = `#version 300 es
in vec2 p; out vec2 uv; void main(){ uv = p*0.5+0.5; gl_Position = vec4(p,0.,1.); }`;
  const FS = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;
uniform sampler2D T; uniform sampler2D SH; uniform vec2 R; uniform float S; uniform float time;
uniform vec3 cam; uniform vec3 xf;            // 铬字整体平移 / 缩放（不重算高度场）：dx dy s
uniform float chromeO;                         // 铬字不透明度
uniform vec4 blobs[8]; uniform int nb; uniform float blobK;
uniform vec4 bubbles[8]; uniform float bubO[8]; uniform int nbu;
uniform vec4 gels[6]; uniform vec4 gelC[6]; uniform int ng;
uniform vec4 panes[4]; uniform vec4 paneP[4]; uniform int np;
uniform vec4 shadow; uniform float bg; uniform float wall; uniform vec4 wallC[4];
uniform float tilt; uniform float envRot; uniform vec2 sweep; uniform float expo;
uniform vec3 skyMid; uniform vec3 skyTop; uniform vec3 skyHor; uniform vec3 floorHor; uniform vec3 floorBot;

vec3 envStudio(vec3 r){
  r = normalize(r);
  float c = cos(tilt), s = sin(tilt);
  r = vec3(r.x, c*r.y - s*r.z, s*r.y + c*r.z);
  float el = r.y; float az = atan(r.x, r.z) + envRot;
  vec3 col;
  if (el > 0.0) {
    col = mix(skyHor, skyMid, smoothstep(0.0,0.30,el)); col = mix(col, skyTop, smoothstep(0.25,0.9,el));
    col *= 1.0 + 0.18*sin(az*2.3+0.6) * smoothstep(0.1,0.5,el);
    float b1 = smoothstep(0.08,0.0,abs(az+0.78)-0.20) * smoothstep(0.06,0.0,abs(el-0.40)-0.20);
    float b2 = smoothstep(0.03,0.0,abs(az-0.66)-0.05) * smoothstep(0.04,0.0,abs(el-0.32)-0.22);
    float b3 = smoothstep(0.02,0.0,abs(el-0.80)-0.025) + 0.7*smoothstep(0.02,0.0,abs(el-0.66)-0.012);
    float b4 = smoothstep(0.012,0.0,abs(el-0.14)-0.006) * smoothstep(0.9,0.3,abs(az));
    col += vec3(2.8,2.9,3.1)*b1 + vec3(2.4,2.45,2.6)*b2 + vec3(1.3,1.4,1.6)*b3 + vec3(1.4)*b4;
  } else {
    float de = -el;
    col = mix(floorHor, floorBot, pow(clamp(de,0.,1.), 1.1));
    col += vec3(0.10,0.18,0.45)*smoothstep(0.02,0.25,de)*exp(-de*3.0)*0.35*(0.6+0.4*cos(az*1.7));
    col += vec3(0.9,0.95,1.05)*smoothstep(0.015,0.0,abs(de-0.30)-0.01)*0.5;
  }
  col += vec3(1.8,1.9,2.1) * exp(-abs(el)*70.0);
  // 扫光：一条竖向的亮带沿方位角扫过（铬字“闪一下”）
  col += vec3(3.0) * sweep.y * smoothstep(0.10,0.0,abs(az - sweep.x)) * smoothstep(-0.2,0.3,el+0.25);
  return col;
}
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.,1.); }
vec3 thinFilm(float c){ return 0.5+0.5*cos(6.2832*(c + vec3(0.0,0.33,0.67))); }

vec2 blobC(int i){ vec4 b = blobs[i]; return b.xy + vec2(sin(time*0.9+b.w)*b.z*0.12, cos(time*0.7+b.w*1.7)*b.z*0.10); }
float blobField(vec2 p){
  float acc = 0.0;
  for (int i=0;i<8;i++){ if(i>=nb) break; float d = length(p - blobC(i)) - blobs[i].z; acc += exp(-d/blobK); }
  return acc > 0.0 ? blobK*log(acc) : -1e4;
}
float blobH(vec2 p){
  float acc = 0.0, wr = 0.0;
  for (int i=0;i<8;i++){ if(i>=nb) break; float d = length(p - blobC(i)) - blobs[i].z; float w = exp(-d/blobK); acc += w; wr += w*blobs[i].z; }
  if (acc <= 0.0) return -1.0;
  float t = blobK*log(acc); if (t < 0.0) return -1.0;
  float Rm = wr/acc; t = min(t, Rm);
  return sqrt(max(0.0, t*(2.0*Rm - t)));
}
vec3 viewDir(vec2 p, float h){ return normalize(vec3(p, h) - cam); }
vec2 toTex(vec2 p){ vec2 c = R/(2.0*S); vec2 q = (p - xf.xy - c)/xf.z + c; vec2 t = q*S/R; return vec2(t.x, 1.0 - t.y); }

// 壁纸：几团柔和的彩色光（今天那一章，玻璃要折射它）
vec3 wallpaper(vec2 p){
  vec2 q = p / R * S;
  vec3 col = vec3(0.92,0.93,0.96);
  for (int i=0;i<4;i++){ vec4 w = wallC[i];
    vec2 c = vec2(0.2+0.6*fract(float(i)*0.37+0.1), 0.25+0.5*fract(float(i)*0.61+0.3)) + 0.08*vec2(sin(time*0.6+float(i)*2.0), cos(time*0.5+float(i)));
    float d = length((q - c)*vec2(1.6,1.0));
    col = mix(col, w.rgb, w.a*smoothstep(0.55,0.0,d)); }
  return col;
}

vec4 shadeAt(vec2 p){
  vec4 acc = vec4(0.0);
  if (wall > 0.5) acc = vec4(wallpaper(p), 1.0);
  if (nb > 0 && blobField(p) > 0.0) {
    float hb = max(blobH(p), 0.0); float e = 1.5;
    float hx = blobH(p+vec2(e,0.)) - blobH(p-vec2(e,0.));
    float hy = blobH(p+vec2(0.,e)) - blobH(p-vec2(0.,e));
    vec3 n = normalize(vec3(-hx/(2.*e), hy/(2.*e), 1.0));
    vec3 d = viewDir(vec2(p.x,-p.y), hb);
    vec3 col = envStudio(reflect(d, n)) * vec3(0.95,0.97,1.0);
    float edge = clamp(blobField(p)/1.2, 0.0, 1.0);
    acc = vec4(col, 1.0)*edge + acc*(1.0-edge);
  }
  vec4 t = texture(T, toTex(p));
  float cov = t.g * chromeO;
  if (cov > 0.002) {
    vec3 n = normalize(vec3(-t.b, t.a, 1.0));
    vec3 d = viewDir(vec2(p.x,-p.y), t.r*xf.z/S);
    vec3 col = envStudio(reflect(d, n));
    float fres = pow(1.0 - max(dot(-d, n), 0.0), 5.0);
    col = col * mix(vec3(0.86,0.9,0.98), vec3(1.0), fres);
    acc = vec4(col, 1.0)*cov + acc*(1.0-cov);
  }
  return acc;
}
float sdRBox(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q,0.0)) + min(max(q.x,q.y),0.0) - r; }

void main(){
  vec2 px = vec2(uv.x, 1.0-uv.y) * R;
  vec2 p = px / S;
  // ① 只算几何：找出盖在这个像素上的最上层“透镜”（玻璃 < 泡泡 < 果冻），算出折射后去哪里取样
  int kind = 0; int idx = 0; vec2 rp = p; vec2 dd = vec2(0.0); float aa = 0.0; vec2 gN = vec2(0.0); float rim = 0.0;
  for (int i=0;i<4;i++){ if(i>=np) break; vec4 pr = panes[i]; vec4 pp = paneP[i];
    vec2 c = pr.xy + pr.zw*0.5; vec2 hb = pr.zw*0.5;
    float sd = sdRBox(p - c, hb, pp.x);
    if (sd < 0.0) { float e = 1.5;
      vec2 g = normalize(vec2(sdRBox(p-c+vec2(e,0.),hb,pp.x)-sdRBox(p-c-vec2(e,0.),hb,pp.x), sdRBox(p-c+vec2(0.,e),hb,pp.x)-sdRBox(p-c-vec2(0.,e),hb,pp.x)) + 1e-6);
      rim = 1.0 - smoothstep(0.0, pp.y, -sd);
      kind = 3; idx = i; gN = g; aa = smoothstep(0.0, -1.2, sd)*pp.z; rp = p + g*rim*rim*pp.y*0.9; }
  }
  for (int i=0;i<8;i++){ if(i>=nbu) break; vec4 b = bubbles[i];
    vec2 c = b.xy + vec2(sin(time*0.6+b.w*3.)*6., cos(time*0.8+b.w*2.)*8.);
    vec2 d = (p - c) / b.z; float rr = dot(d,d);
    if (rr < 1.0 && bubO[i] > 0.001) { float zz = sqrt(1.0-rr);
      kind = 1; idx = i; dd = d; aa = smoothstep(1.0, 1.0 - 2.0/(b.z*S), rr)*bubO[i]; rp = mix(p, c + d*b.z*(0.80 + 0.2*zz), bubO[i]); }
  }
  for (int i=0;i<6;i++){ if(i>=ng) break; vec4 b = gels[i];
    vec2 d = (p - b.xy) / b.z; float rr = dot(d,d);
    if (rr < 1.0 && gelC[i].a > 0.001) { float zz = sqrt(1.0-rr);
      kind = 2; idx = i; dd = d; aa = smoothstep(1.0, 1.0 - 2.0/(b.z*S), rr)*gelC[i].a; rp = mix(p, b.xy - d*b.z*(0.55*zz - 0.15), gelC[i].a); }
  }
  // ② 只取样一次
  vec4 col = shadeAt(rp);
  float sh = texture(SH, toTex(rp - shadow.xy)).r * shadow.z * chromeO;
  float bsh = 0.0; if (nb > 0) { float f = blobField(rp - shadow.xy*1.4); bsh = smoothstep(-30.0,10.0,f)*shadow.z*0.8; }
  for (int i=0;i<6;i++){ if(i>=ng) break; vec4 g = gels[i]; float q = length((rp - g.xy - vec2(0.0, g.z*0.22 + shadow.y*0.8))/vec2(g.z*0.95, g.z*0.75));
    bsh = max(bsh, smoothstep(1.0, 0.2, q)*shadow.z*0.85*gelC[i].a); }
  col = col + vec4(0.0,0.0,0.0, max(sh, bsh)*0.55)*(1.0-col.a);
  // ③ 透镜本身的样子
  if (kind == 3) {
    float a = col.a;
    vec3 seen = col.rgb + vec3(0.93,0.94,0.97)*(1.0-a);
    seen = mix(seen, vec3(1.0), 0.10 + 0.10*rim);
    // 色散：边缘一圈偏蓝 / 偏红
    seen += vec3(-0.05, 0.0, 0.08) * rim * dot(gN, vec2(0.7,0.7));
    float spec = pow(rim, 3.0) * (0.55 + 0.45*max(0.0, dot(gN, normalize(vec2(-0.6,-0.8)))));
    seen += vec3(1.2)*spec*0.9;
    col = mix(col, vec4(seen, 1.0), aa);
  } else if (kind == 1) {
    vec2 d = dd; float zz = sqrt(max(0.0, 1.0-dot(d,d))); vec3 n = vec3(d.x, -d.y, zz); float hue = bubbles[idx].w;
    float fres = pow(1.0-zz, 2.2);
    vec3 film = thinFilm(zz*1.3 + d.y*0.4 + hue + time*0.05);
    vec3 refl = envStudio(reflect(vec3(0.,0.,-1.), n));
    vec3 rgb = col.rgb*(1.0-0.35*fres) + (film*0.55 + refl*0.25)*fres*1.2;
    float a = max(col.a, fres*0.85 + 0.06);
    float hl = smoothstep(0.18,0.0, length(d-vec2(-0.42,-0.46))-0.10);
    float hl2 = smoothstep(0.08,0.0, length(d-vec2(0.5,0.55))-0.04);
    rgb += vec3(1.6)*(hl*0.9+hl2*0.5); a = max(a, hl*0.9);
    col = mix(col, vec4(rgb, a), aa);
  } else if (kind == 2) {
    vec2 d = dd; float rr = dot(d,d); float zz = sqrt(max(0.0, 1.0-rr)); vec3 n = vec3(d.x, -d.y, zz); vec3 gc = gelC[idx].rgb;
    vec3 seen = col.rgb + vec3(0.80,0.82,0.86)*(1.0-col.a);
    vec3 absorb = exp(-(1.0-gc)*2.6*(0.35+zz));
    vec3 rgb = seen*absorb*1.15;
    rgb *= mix(1.0, 0.62, smoothstep(0.55,1.0,sqrt(rr)));
    float fres = pow(1.0-zz, 3.0);
    rgb = mix(rgb, envStudio(reflect(vec3(0.,0.,-1.), n))*0.9, fres*0.55);
    float ca = smoothstep(0.22,0.0, length((d-vec2(0.06,0.60))*vec2(0.7,1.4))-0.10);
    rgb += gc*vec3(1.2,1.5,1.6)*ca*0.8 + vec3(0.6)*ca*ca*0.5;
    vec2 q = (d - vec2(-0.30,-0.50)); q = vec2(q.x*0.95 + q.y*0.3, q.y);
    vec2 qb = abs(q) - vec2(0.24,0.09); float sd = length(max(qb,0.0)) + min(max(qb.x,qb.y),0.0) - 0.08;
    float hl = smoothstep(0.03,-0.03, sd) * (0.75 + 0.25*smoothstep(0.1,-0.15,q.y));
    float dot1 = smoothstep(0.06,0.0, length(d-vec2(0.52,0.40))-0.035);
    rgb = mix(rgb, vec3(1.9), hl*0.88); rgb += vec3(1.5)*dot1*0.7;
    col = mix(col, vec4(rgb, 1.0), aa);
  }
  vec3 rgb = col.a > 0.0 ? col.rgb / col.a : vec3(0.0);
  rgb = pow(aces(rgb*0.95*expo), vec3(1.0/2.2));
  if (bg > 0.5) o = vec4(rgb*col.a + vec3(0.92,0.93,0.95)*(1.0-col.a), 1.0);
  else o = vec4(rgb*col.a, col.a);
}`;

  const GL = new WeakMap();
  function setup(canvas) {
    let st = GL.get(canvas);
    if (st) return st;
    const gl = canvas.getContext('webgl2', {premultipliedAlpha: true, preserveDrawingBuffer: true, antialias: false});
    if (!gl) throw new Error('WebGL2 不可用');
    gl.getExtension('OES_texture_float_linear');
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const mk = () => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      // 最近邻：软件 GL（SwiftShader）里浮点纹理的线性过滤非常慢；1:1 采样时看不出差别
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; };
    const tex = mk(), tex2 = mk();
    const U = {}; const u = n => (n in U ? U[n] : (U[n] = gl.getUniformLocation(pr, n)));
    st = {gl, pr, tex, tex2, texKey: '', u};
    GL.set(canvas, st);
    return st;
  }
  const pad = (arr, n, w) => { const a = (arr || []).flat(); return new Float32Array([...a, ...new Array(n * w - a.length).fill(0)].slice(0, n * w)); };
  const ENV = {skyTop: [0.04, 0.16, 0.62], skyMid: [0.45, 0.62, 0.95], skyHor: [1.35, 1.38, 1.45], floorHor: [0.015, 0.018, 0.025], floorBot: [0.20, 0.22, 0.27]};

  /** 画一帧（同步）。cfg 里不变的部分（texts/shapes/bevel）决定高度场，其余都是 uniform，可逐帧动画 */
  function draw(canvas, cfg) {
    const S = cfg.scale || 1, W = Math.round(cfg.w * S), H = Math.round(cfg.h * S);
    if (canvas.width !== W) canvas.width = W;
    if (canvas.height !== H) canvas.height = H;
    const st = setup(canvas), {gl, u} = st;
    const hf = heightfield(cfg);
    if (st.texKey !== hf.key) {
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, st.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, W, H, 0, gl.RGBA, gl.FLOAT, hf.data);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, st.tex2);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, W, H, 0, gl.RED, gl.FLOAT, hf.shd);
      st.texKey = hf.key;
    }
    // 放大（xf.s > 1）时改成线性过滤，否则倒角会出现锯齿台阶；平时最近邻（软件 GL 里快很多）
    const lin = (cfg.xf || [0, 0, 1])[2] > 1.02 ? gl.LINEAR : gl.NEAREST;
    if (st.filt !== lin) {
      for (const [unit, t] of [[gl.TEXTURE0, st.tex], [gl.TEXTURE1, st.tex2]]) {
        gl.activeTexture(unit); gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, lin); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, lin);
      }
      st.filt = lin;
    }
    gl.uniform1i(u('T'), 0); gl.uniform1i(u('SH'), 1); gl.uniform2f(u('R'), W, H); gl.uniform1f(u('S'), S); gl.uniform1f(u('time'), cfg.time || 0);
    gl.uniform3f(u('cam'), ...(cfg.cam || [cfg.w / 2, -cfg.h / 2, 1200]));
    gl.uniform3f(u('xf'), ...(cfg.xf || [0, 0, 1]));
    gl.uniform1f(u('chromeO'), cfg.chromeO ?? 1);
    gl.uniform1f(u('bg'), cfg.bg ? 1 : 0); gl.uniform1f(u('tilt'), cfg.tilt || 0); gl.uniform1f(u('envRot'), cfg.envRot || 0);
    gl.uniform2f(u('sweep'), ...(cfg.sweep || [0, 0])); gl.uniform1f(u('expo'), cfg.expo ?? 1);
    const env = Object.assign({}, ENV, cfg.env || {});
    for (const k of Object.keys(ENV)) gl.uniform3f(u(k), ...env[k]);
    gl.uniform4fv(u('blobs'), pad(cfg.blobs, 8, 4)); gl.uniform1i(u('nb'), (cfg.blobs || []).length); gl.uniform1f(u('blobK'), cfg.blobK || 14);
    const bu = (cfg.bubbles || []);
    gl.uniform4fv(u('bubbles'), pad(bu.map(b => b.slice(0, 4)), 8, 4)); gl.uniform1i(u('nbu'), bu.length);
    gl.uniform1fv(u('bubO'), pad(bu.map(b => [b[4] ?? 1]), 8, 1));
    const ge = (cfg.gels || []);
    gl.uniform4fv(u('gels'), pad(ge.map(g => g.slice(0, 4)), 6, 4)); gl.uniform1i(u('ng'), ge.length);
    gl.uniform4fv(u('gelC'), pad(ge.map(g => [...(g[4] || cfg.gelCol || [0.0, 0.62, 0.78]), g[5] ?? 1]), 6, 4));
    const pa = (cfg.panes || []);
    gl.uniform4fv(u('panes'), pad(pa.map(q => q.slice(0, 4)), 4, 4)); gl.uniform1i(u('np'), pa.length);
    gl.uniform4fv(u('paneP'), pad(pa.map(q => [q[4] ?? 28, q[5] ?? 22, q[6] ?? 1, 0]), 4, 4));
    gl.uniform1f(u('wall'), cfg.wall ? 1 : 0);
    gl.uniform4fv(u('wallC'), pad(cfg.wall || [], 4, 4));
    gl.uniform4f(u('shadow'), ...(cfg.shadow || [0, 20, 0.55, 0]));
    gl.viewport(0, 0, W, H); gl.disable(gl.SCISSOR_TEST); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    // 只画有东西的区域（软件 GL 按像素计费）：铬字包围盒 + 每个泡泡 / 果冻 / 玻璃 / 液滴
    const rects = [];
    const xf = cfg.xf || [0, 0, 1], sh = cfg.shadow || [0, 20, 0.55, 0];
    if (hf.bbox && (cfg.chromeO ?? 1) > 0.001) {
      const cx = W / 2, cy = H / 2, k = xf[2];
      const X = v => (v - cx) * k + cx + xf[0] * S, Y = v => (v - cy) * k + cy + xf[1] * S;
      rects.push([X(hf.bbox[0]) + Math.min(0, sh[0] * S), Y(hf.bbox[1]) + Math.min(0, sh[1] * S), X(hf.bbox[2]) + Math.max(0, sh[0] * S), Y(hf.bbox[3]) + Math.max(0, sh[1] * S)]);
    }
    const circ = (x, y, r, m) => rects.push([(x - r - m) * S, (y - r - m) * S, (x + r + m) * S, (y + r + m + Math.max(0, sh[1]) + r * 0.3) * S]);
    for (const b of bu) if ((b[4] ?? 1) > 0.001) circ(b[0], b[1], b[2], 12);
    for (const g of ge) if ((g[5] ?? 1) > 0.001) circ(g[0], g[1], g[2], 16);
    for (const b of cfg.blobs || []) circ(b[0], b[1], b[2] * 1.4, 40);
    for (const q of pa) rects.push([(q[0] - 4) * S, (q[1] - 4) * S, (q[0] + q[2] + 4) * S, (q[1] + q[3] + 4) * S]);
    if (cfg.wall || cfg.bg) rects.splice(0, rects.length, [0, 0, W, H]);
    // 相交的合并成一个，避免重复画
    let merged = rects.map(r => [Math.max(0, Math.floor(r[0])), Math.max(0, Math.floor(r[1])), Math.min(W, Math.ceil(r[2])), Math.min(H, Math.ceil(r[3]))]).filter(r => r[2] > r[0] && r[3] > r[1]);
    for (let again = true; again;) {
      again = false;
      outer: for (let i = 0; i < merged.length; i++) for (let j = i + 1; j < merged.length; j++) {
        const A = merged[i], B = merged[j];
        if (A[0] <= B[2] && B[0] <= A[2] && A[1] <= B[3] && B[1] <= A[3]) {
          merged[i] = [Math.min(A[0], B[0]), Math.min(A[1], B[1]), Math.max(A[2], B[2]), Math.max(A[3], B[3])];
          merged.splice(j, 1); again = true; break outer;
        }
      }
    }
    gl.enable(gl.SCISSOR_TEST);
    for (const r of merged) { gl.scissor(r[0], H - r[3], r[2] - r[0], r[3] - r[1]); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); }
    gl.disable(gl.SCISSOR_TEST);
    gl.finish();
  }
  async function render(canvas, cfg) {
    const fams = new Set((cfg.texts || []).map(t => `${t.weight || 900} 100px ${t.font}`));
    for (const f of fams) await document.fonts.load(f);
    draw(canvas, cfg);
    return true;
  }
  /** 4 角星（Y2K 的“闪一下”）：返回 path d */
  function star(cx, cy, R, k = 0.24, h = 0.86) {
    const a = R * k, b = R * h;
    return `M${cx} ${cy - R} Q${cx + a} ${cy - a} ${cx + b} ${cy} Q${cx + a} ${cy + a} ${cx} ${cy + R} Q${cx - a} ${cy + a} ${cx - b} ${cy} Q${cx - a} ${cy - a} ${cx} ${cy - R} Z`;
  }
  const api = {heightfield, draw, render, star, ENV};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Y2K = api;
})(typeof window !== 'undefined' ? window : globalThis);
