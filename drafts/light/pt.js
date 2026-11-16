(async () => {
const Q = new URLSearchParams(location.search);
const W = +(Q.get('w') || innerWidth || 1920), H = +(Q.get('h') || innerHeight || 1080);
const SPP = +(Q.get('spp') || 64), PHOTON_PASSES = +(Q.get('pp') || 24), PN = +(Q.get('pn') || 512);
const cv = document.getElementById('c'); cv.width = W; cv.height = H; cv.style.width = W + 'px'; cv.style.height = H + 'px';
const gl = cv.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true });
gl.getExtension('EXT_color_buffer_float'); gl.getExtension('EXT_float_blend');
const log = (...a) => console.log(...a);

// ---------- 字形的二维距离场（世界单位）----------
await document.fonts.load('600px NSK');
const GH = 1.7;   // 字高（世界单位）
function glyphSDF(ch, px = 900) {
  const pad = Math.round(px * .3), Wc = px + pad * 2, Hc = px + pad * 2;
  const c = document.createElement('canvas'); c.width = Wc; c.height = Hc; const x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, Wc, Hc); x.fillStyle = '#fff'; x.font = `${px}px NSK`; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  const m = x.measureText(ch); x.fillText(ch, Wc / 2, Hc / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
  const img = x.getImageData(0, 0, Wc, Hc).data; const N = Wc * Hc;
  let minY = Hc, maxY = 0, minX = Wc, maxX = 0; const ins = new Uint8Array(N);
  for (let i = 0; i < N; i++) if (img[i * 4] > 127) { ins[i] = 1; const yy = (i / Wc) | 0, xx = i % Wc; if (yy < minY) minY = yy; if (yy > maxY) maxY = yy; if (xx < minX) minX = xx; if (xx > maxX) maxX = xx; }
  const edt = (mask) => { const INF = 1e20, g = new Float32Array(N); for (let i = 0; i < N; i++) g[i] = mask[i] ? INF : 0;
    const f1 = (f, n) => { const d = new Float32Array(n), v = new Int32Array(n), z = new Float32Array(n + 1); let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
      for (let q = 1; q < n; q++) { let s; while (true) { const p = v[k]; s = ((f[q] + q * q) - (f[p] + p * p)) / (2 * q - 2 * p); if (s <= z[k]) { k--; if (k < 0) { k = 0; break; } } else break; } if (k === 0 && s <= z[0]) { v[0] = q; z[0] = -INF; z[1] = INF; continue; } k++; v[k] = q; z[k] = s; z[k + 1] = INF; }
      k = 0; for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; const p = v[k]; d[q] = (q - p) * (q - p) + f[p]; } return d; };
    const col = new Float32Array(Hc); for (let xx = 0; xx < Wc; xx++) { for (let yy = 0; yy < Hc; yy++) col[yy] = g[yy * Wc + xx]; const d = f1(col, Hc); for (let yy = 0; yy < Hc; yy++) g[yy * Wc + xx] = d[yy]; }
    const row = new Float32Array(Wc); for (let yy = 0; yy < Hc; yy++) { for (let xx = 0; xx < Wc; xx++) row[xx] = g[yy * Wc + xx]; const d = f1(row, Wc); for (let xx = 0; xx < Wc; xx++) g[yy * Wc + xx] = Math.sqrt(d[xx]); }
    return g; };
  const out = new Uint8Array(N); for (let i = 0; i < N; i++) out[i] = !ins[i];
  const dO = edt(out), dI = edt(ins);
  const k = GH / (maxY - minY), cx = (minX + maxX) / 2;
  const S = 512, T = new Float32Array(S * S);    // 重采样到 512²，覆盖字的包围盒 + 边距
  const span = Math.max(maxX - minX, maxY - minY) * 1.18, x0 = cx - span / 2, y0 = (minY + maxY) / 2 - span / 2;
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const u = Math.min(Wc - 1, Math.max(0, Math.round(x0 + (i + .5) / S * span))), v = Math.min(Hc - 1, Math.max(0, Math.round(y0 + (S - 1 - j + .5) / S * span)));
    T[j * S + i] = (dO[v * Wc + u] - dI[v * Wc + u]) * k; }
  // 世界坐标里纹理覆盖的范围（字的底边在 y = 0，左右居中）
  const wx0 = (x0 - cx) * k, wx1 = (x0 + span - cx) * k, wy0 = (maxY - (y0 + span)) * k, wy1 = (maxY - y0) * k;
  return { tex: T, size: S, min: [wx0, wy0], max: [wx1, wy1] };
}
const G = glyphSDF(Q.get('ch') || '光');
const gtex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, gtex);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, G.size, G.size, 0, gl.RED, gl.FLOAT, G.tex);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

// ---------- 共用的着色器代码：场景 ----------
const COMMON = `#version 300 es
precision highp float; precision highp int;
uniform sampler2D uGlyph; uniform vec2 uGMin, uGMax;
uniform vec3 uSun; uniform float uSeed;
#define PI 3.14159265
const float HD = 0.045;    // 笔画边缘的半厚
const float SLOPE = 1.15;  // 切面斜率：每一笔的截面是屋脊形（两面斜切的棱镜）
const float WCAP = 0.14;
const float RB = 0.012;    // 很小的倒角：切面锋利
const vec3 OBJ = vec3(0.0, 0.0, 0.0);
uniform float uRot;
#define ROT uRot   // 字绕 y 转
vec3 toObj(vec3 p){ p -= OBJ; float c = cos(ROT), s = sin(ROT); return vec3(c*p.x + s*p.z, p.y, -s*p.x + c*p.z); }
vec3 toWorldDir(vec3 d){ float c = cos(ROT), s = sin(ROT); return vec3(c*d.x - s*d.z, d.y, s*d.x + c*d.z); }
float g2(vec2 p){ vec2 c = clamp(p, uGMin, uGMax); vec2 uv = (c - uGMin) / (uGMax - uGMin); return texture(uGlyph, uv).r + length(p - c); }
float sdObj(vec3 pw){ vec3 p = toObj(pw); float d2 = g2(p.xy); float hz = HD + SLOPE * clamp(-d2, 0., WCAP);
  vec2 q = vec2(d2 + RB, abs(p.z) - hz + RB); return (min(max(q.x, q.y), 0.) + length(max(q, 0.)) - RB) * .72; }
vec3 nObj(vec3 p){ const vec2 e = vec2(.0015, 0.); return normalize(vec3(sdObj(p+e.xyy)-sdObj(p-e.xyy), sdObj(p+e.yxy)-sdObj(p-e.yxy), sdObj(p+e.yyx)-sdObj(p-e.yyx))); }
// 包围盒（物体空间）
bool boxHit(vec3 ro, vec3 rd, out float t0, out float t1){
  vec3 o = toObj(ro); float c = cos(ROT), s = sin(ROT); vec3 d = vec3(c*rd.x + s*rd.z, rd.y, -s*rd.x + c*rd.z);
  vec3 bmin = vec3(uGMin - .02, -HD - SLOPE*WCAP - .02), bmax = vec3(uGMax + .02, HD + SLOPE*WCAP + .02);
  vec3 inv = 1. / d, ta = (bmin - o) * inv, tb = (bmax - o) * inv; vec3 mn = min(ta, tb), mx = max(ta, tb);
  t0 = max(max(mn.x, mn.y), mn.z); t1 = min(min(mx.x, mx.y), mx.z); return t1 > max(t0, 0.); }
// 从外面打到玻璃
float marchOut(vec3 ro, vec3 rd, float tmax){
  float a, b; if (!boxHit(ro, rd, a, b)) return -1.; float t = max(a, 0.) + 1e-4; b = min(b, tmax);
  for (int i = 0; i < 160; i++){ float d = sdObj(ro + rd*t); if (d < 2e-4) return t; t += d * .92; if (t > b) break; } return -1.; }
// 在玻璃里面走到出口
float marchIn(vec3 ro, vec3 rd){ float t = 1e-3; for (int i = 0; i < 160; i++){ float d = -sdObj(ro + rd*t); if (d < 2e-4) return t; t += max(d * .92, 2e-4); if (t > 4.) break; } return t; }
// 小人（比例尺）：身体 + 头 + 两条腿，站在地上
uniform vec3 uPerson;
float sdCap(vec3 p, vec3 a, vec3 b, float r){ vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.); return length(pa - ba*h) - r; }
float sdPerson(vec3 p){ p -= uPerson; float s = .2;   // 身高约 0.2（字高 1.7 → 字有八层楼那么高）
  float d = sdCap(p, vec3(0., .105*s/.2, 0.), vec3(0., .155*s/.2, 0.), .022*s/.2);
  d = min(d, length(p - vec3(0., .183*s/.2, 0.)) - .0135*s/.2);
  d = min(d, sdCap(p, vec3(-.008, .0, 0.)*s/.2, vec3(-.007, .105, 0.)*s/.2, .0095*s/.2));
  d = min(d, sdCap(p, vec3(.009, .0, .004)*s/.2, vec3(.007, .105, 0.)*s/.2, .0095*s/.2));
  d = min(d, sdCap(p, vec3(-.026, .15, 0.)*s/.2, vec3(-.03, .085, .006)*s/.2, .0075*s/.2));
  d = min(d, sdCap(p, vec3(.026, .15, 0.)*s/.2, vec3(.03, .085, -.004)*s/.2, .0075*s/.2));
  return d; }
float marchPerson(vec3 ro, vec3 rd, float tmax){
  // 包围球
  vec3 oc = ro - (uPerson + vec3(0., .1, 0.)); float b = dot(oc, rd), c = dot(oc, oc) - .13*.13, h = b*b - c; if (h < 0.) return -1.;
  float t = max(-b - sqrt(h), 0.), t1 = min(-b + sqrt(h), tmax);
  for (int i = 0; i < 64; i++){ float d = sdPerson(ro + rd*t); if (d < 1e-4) return t; t += d; if (t > t1) break; } return -1.; }
vec3 nPerson(vec3 p){ const vec2 e = vec2(.0005, 0.); return normalize(vec3(sdPerson(p+e.xyy)-sdPerson(p-e.xyy), sdPerson(p+e.yxy)-sdPerson(p-e.yxy), sdPerson(p+e.yyx)-sdPerson(p-e.yyx))); }
// 随机数
uint hs; float rnd(){ hs ^= hs << 13u; hs ^= hs >> 17u; hs ^= hs << 5u; return float(hs) / 4294967296.; }
uint wang(uint s){ s = (s ^ 61u) ^ (s >> 16u); s *= 9u; s = s ^ (s >> 4u); s *= 0x27d4eb2du; s = s ^ (s >> 15u); return s; }
// 波长 → RGB（平均为白）
vec3 spec(float l){ float t = (l - 400.) / 300.;
  vec3 c = vec3(smoothstep(.45,.75,t)*1.25 + smoothstep(.25,0.,t)*.35, exp(-pow((t-.5)/.2, 2.)), exp(-pow((t-.15)/.18, 2.)));
  return c / vec3(.4497, .3544, .3191); }
float ior(float l){ float um = l * 1e-3; return 1.498 + .0118 / (um*um); }
float fres(float ci, float n1, float n2){ float s = n1/n2, st2 = s*s*(1.-ci*ci); if (st2 > 1.) return 1.; float ct = sqrt(1.-st2);
  float rs = (n1*ci - n2*ct)/(n1*ci + n2*ct), rp = (n1*ct - n2*ci)/(n1*ct + n2*ci); return .5*(rs*rs + rp*rp); }
const vec3 SIGMA = vec3(.16, .045, .06);    // 很淡的海蓝玻璃
// 地面范围（焦散图覆盖）
const vec2 CMIN = vec2(-6.5, -6.0), CMAX = vec2(5.5, 3.0);
`;
// ---------- 光子：太阳 → 玻璃 → 地面，点精灵累加进焦散图 ----------
const PHV = COMMON + `
uniform float uPN; out vec3 vCol;
void main(){
  hs = wang(uint(gl_VertexID) * 1973u + uint(uSeed) * 9277u + 1u);
  // 在太阳方向的垂直平面上，覆盖字的一块圆盘里撒光子
  vec3 L = uSun; vec3 U = normalize(cross(L, vec3(0,1,0))), V = cross(U, L);
  float R = 1.2; float r = R * sqrt(rnd()), a = 2.*PI*rnd();
  vec3 ctr = OBJ + vec3(0., .85, 0.);
  vec3 ro = ctr + U*cos(a)*r + V*sin(a)*r + L*4.;
  // 太阳有大小（半角 0.55°）
  vec3 rd = -L; float ca = 1. - rnd()*(1.-cos(.0096)), sa = sqrt(1.-ca*ca), b = 2.*PI*rnd();
  rd = normalize(rd*ca + U*cos(b)*sa + V*sin(b)*sa);
  float lam = 400. + 300.*rnd(); float n = ior(lam);
  vec3 thr = spec(lam);
  bool hitGlass = false; bool inside = false;
  for (int k = 0; k < 10; k++){
    if (!inside){
      float t = marchOut(ro, rd, 12.);
      if (t < 0.) break;
      ro += rd*t; hitGlass = true; vec3 N = nObj(ro); float ci = -dot(rd, N);
      if (rnd() < fres(ci, 1., n)) { rd = reflect(rd, N); ro += N*4e-4; }
      else { rd = refract(rd, N, 1./n); ro -= N*4e-4; inside = true; }
    } else {
      float t = marchIn(ro, rd); ro += rd*t; thr *= exp(-SIGMA*t);
      vec3 N = nObj(ro); float ci = dot(rd, N);
      if (rnd() < fres(ci, n, 1.)) { rd = reflect(rd, N); ro -= N*4e-4; }
      else { rd = refract(rd, -N, n); ro += N*4e-4; inside = false; }
    }
  }
  vCol = thr;
  gl_PointSize = 1.;
  if (!hitGlass || inside || rd.y >= -1e-4) { gl_Position = vec4(2., 2., 2., 1.); return; }
  float tf = -ro.y / rd.y; vec3 p = ro + rd*tf;
  vec2 uv = (p.xz - CMIN) / (CMAX - CMIN);
  if (any(lessThan(uv, vec2(0))) || any(greaterThan(uv, vec2(1)))) { gl_Position = vec4(2., 2., 2., 1.); return; }
  gl_Position = vec4(uv*2. - 1., 0., 1.);
}`;
const PHF = `#version 300 es
precision highp float; in vec3 vCol; out vec4 o; void main(){ o = vec4(vCol, 1.); }`;

// ---------- 路径追踪 ----------
const QV = `#version 300 es
in vec2 p; out vec2 vUv; void main(){ vUv = p*.5+.5; gl_Position = vec4(p,0,1); }`;
const PTF = COMMON + `
uniform sampler2D uAcc, uCaus; uniform vec2 uRes; uniform float uCausScale, uFrame;
uniform vec3 uCamPos, uCamTgt; uniform float uFov, uAperture, uFocus;
in vec2 vUv; out vec4 o;
const float SUNA = .0096;         // 太阳半角
const vec3 SUNL = vec3(1., .80, .60) * 52000.;   // 太阳辐亮度（低太阳，偏暖）
vec3 skyL(vec3 d, bool lights);
vec3 sky(vec3 d){ return skyL(d, true); }
vec3 skyL(vec3 d, bool lights){
  float h = clamp(d.y, -.2, 1.);
  // 黑色摄影棚：几乎全黑，只有一点冷蓝的环境光（勾出玻璃的边）+ 太阳那一侧一点暖
  float hh = max(h, 0.);
  vec3 c = mix(vec3(.030, .032, .045), vec3(.006, .008, .016), smoothstep(0., .6, hh));
  float sd = max(dot(d, uSun), 0.); c += vec3(1., .6, .32) * (pow(sd, 10.) * .06 + pow(sd, 80.) * .3);
  // 两块很大的柔光板（左上方冷、正上方中性），给玻璃一点轮廓高光
  if (!lights) return c;
  // 长条柔光板：左边一条竖的（冷），头顶一条横的（中性），右后一条（暖，和太阳同侧）——只出现在反射里
  vec3 a1 = normalize(vec3(-1., .35, .45)); c += vec3(.6, .72, 1.) * 6. * smoothstep(.06, .03, abs(d.y - .35 * length(d.xz) * 0. - .35)) * smoothstep(.75, .9, dot(normalize(vec3(d.x, 0., d.z)), normalize(vec3(-1., 0., .45))));
  c += vec3(1.) * 5. * smoothstep(.05, .02, abs(d.z + .05)) * smoothstep(.55, .8, d.y);

  return c; }
float floorTex(vec2 p){ // 石面上极淡的纹理
  return .94 + .06 * (sin(p.x*3.1 + sin(p.y*1.7)*2.) * .5 + .5) * (sin(p.y*2.3 + p.x*.4) * .5 + .5); }
vec3 albedoFloor(vec2 p){ return vec3(.24, .225, .215) * floorTex(p); }
vec3 caustic(vec3 p){ vec2 uv = (p.xz - CMIN)/(CMAX - CMIN); if (any(lessThan(uv, vec2(0))) || any(greaterThan(uv, vec2(1)))) return vec3(0); return texture(uCaus, uv).rgb * uCausScale; }
bool sunVisible(vec3 p){ return marchOut(p, uSun, 20.) < 0. && marchPerson(p, uSun, 20.) < 0.; }
uniform float uBeamR, uDbg;
float beam(vec3 p){ vec3 v = p - vec3(.0, .8, 0.); v -= uSun * dot(v, uSun); return smoothstep(uBeamR, uBeamR * .8, length(v)); }
uniform float uFog, uCausVol;
float hg(float c, float g){ return (1. - g*g) / (4.*PI*pow(1. + g*g - 2.*g*c, 1.5)); }
// 光束圆柱（轴过字的中心、沿太阳方向）和射线的交段
bool beamSpan(vec3 ro, vec3 rd, float tmax, out float a, out float b){
  vec3 C = vec3(0., .8, 0.), oc = ro - C; vec3 d = rd - uSun*dot(rd, uSun), o = oc - uSun*dot(oc, uSun);
  float A = dot(d, d), B = dot(o, d), Cc = dot(o, o) - uBeamR*uBeamR, h = B*B - A*Cc; if (h < 0. || A < 1e-8) return false;
  h = sqrt(h); a = max((-B - h)/A, 0.); b = min((-B + h)/A, tmax); return b > a; }
vec3 inscatter(vec3 ro, vec3 rd, float tmax){
  float a, b; if (!beamSpan(ro, rd, tmax, a, b)) return vec3(0);
  float t = a + rnd()*(b - a); vec3 p = ro + rd*t; if (p.y < 0.) return vec3(0);
  vec3 Li = vec3(0);
  if (uDbg > 2.5) return (sunVisible(p) ? vec3(0., 3., 0.) : vec3(30., 0., 0.)) * uFog * (b - a);
  if (sunVisible(p)) Li += SUNL * (PI * SUNA * SUNA) * beam(p);
  else { vec3 q = p - uSun * (p.y / uSun.y); Li += uDbg > 1.5 ? vec3(20., 0., 0.) : caustic(q) * uCausVol; }     // 在玻璃后面：穿过玻璃的光沿光线落到地上，读那一点的焦散 = 这一点有多少彩虹光
  return Li * uFog * hg(dot(rd, uSun), .62) * exp(-uFog * 1.4 * t) * (b - a); }
vec3 cosHemi(vec3 n){ float r1 = rnd(), r2 = rnd(); float r = sqrt(r1), a = 2.*PI*r2; vec3 t = normalize(abs(n.y) < .99 ? cross(n, vec3(0,1,0)) : cross(n, vec3(1,0,0))), b = cross(n, t); return normalize(t*cos(a)*r + b*sin(a)*r + n*sqrt(1.-r1)); }
void main(){
  hs = wang(uint(gl_FragCoord.x) * 1973u + uint(gl_FragCoord.y) * 9277u + uint(uFrame) * 26699u + 7u);
  vec2 jit = vec2(rnd(), rnd()) - .5;
  vec2 ndc = ((gl_FragCoord.xy + jit) / uRes) * 2. - 1.; ndc.x *= uRes.x / uRes.y;
  vec3 F = normalize(uCamTgt - uCamPos), Rr = normalize(cross(F, vec3(0,1,0))), U = cross(Rr, F);
  float k = tan(uFov * .5);
  vec3 rd = normalize(F + Rr*ndc.x*k + U*ndc.y*k);
  vec3 ro = uCamPos;
  // 薄透镜景深
  vec3 fp = ro + rd * uFocus / dot(rd, F); float la = 2.*PI*rnd(), lr = uAperture * sqrt(rnd());
  ro += Rr*cos(la)*lr + U*sin(la)*lr; rd = normalize(fp - ro);
  vec3 L = vec3(0), thr = vec3(1); bool spec_ = true; bool viaFloor = false; bool waveSet = false; float n = 1.5; bool inside = false;
  for (int b = 0; b < 14; b++){
    if (inside){
      float t = marchIn(ro, rd); ro += rd*t; thr *= exp(-SIGMA*t);
      vec3 N = nObj(ro); float ci = dot(rd, N);
      if (rnd() < fres(ci, n, 1.)) { rd = reflect(rd, N); ro -= N*4e-4; }
      else { rd = refract(rd, -N, n); ro += N*4e-4; inside = false; }
      continue;
    }
    float tf = rd.y < -1e-5 ? -ro.y / rd.y : 1e9;
    float tg = marchOut(ro, rd, min(tf, 30.));
    float tp = marchPerson(ro, rd, min(tf, 30.));
    { float th = min(tf, 30.); if (tg > 0.) th = min(th, tg); if (tp > 0.) th = min(th, tp);
      if (spec_ && uFog > 0.) { L += thr * inscatter(ro, rd, min(th, 14.)); thr *= exp(-uFog * 1.4 * min(th, 14.)); } }
    if (tp > 0. && (tg < 0. || tp < tg) && tp < tf){
      ro += rd*tp; vec3 N = nPerson(ro); vec3 A = vec3(.035, .033, .032);
      vec3 Ld = vec3(0); float nl = dot(N, uSun); if (nl > 0. && sunVisible(ro + N*1e-3)) Ld += A / PI * SUNL * (PI*SUNA*SUNA) * nl * beam(ro);
      vec3 q = ro - uSun * (ro.y / uSun.y); Ld += A / PI * caustic(q) * max(dot(N, -normalize(vec3(uSun.x, 0., uSun.z))*-1.), .2);
      L += thr * Ld; thr *= A; rd = cosHemi(N); ro += N*1e-3; spec_ = false; continue; }
    if (tg > 0. && tg < tf){
      ro += rd*tg; vec3 N = nObj(ro); float ci = -dot(rd, N);
      if (!waveSet){ float lam = 400. + 300.*rnd(); thr *= spec(lam); n = ior(lam); waveSet = true; }
      if (rnd() < fres(ci, 1., n)) { rd = reflect(rd, N); ro += N*4e-4; }
      else { rd = refract(rd, N, 1./n); ro -= N*4e-4; inside = true; }
      spec_ = true; continue;
    }
    if (tf < 1e8){
      ro += rd*tf; vec3 N = vec3(0,1,0); vec3 A = albedoFloor(ro.xz);
      float fog = exp(-max(length(ro.xz) - 4., 0.) * .35);     // 远处融进天色
      // 抛光石面：一层带粗糙度的镜面反射
      float ci = max(-rd.y, 0.), Fr = .035 + .965 * pow(1. - ci, 5.);
      if (rnd() < Fr){ vec3 r = reflect(rd, N); vec3 pert = cosHemi(r); rd = normalize(mix(r, pert, .025)); ro += N*1e-4; spec_ = true; viaFloor = true;
        if (rd.y < 0.) break; continue; }
      vec3 Ld = vec3(0);
      // 直接的太阳光
      if (uSun.y > 0. && sunVisible(ro + N*1e-3)) Ld += A / PI * SUNL * (PI * SUNA * SUNA) * uSun.y * beam(ro) * (uDbg > .5 ? 0. : .045);   // 光只打在字上：地面只有极淡的溢光
      // 穿过玻璃的光（焦散图）
      Ld += A / PI * caustic(ro);
      L += thr * mix(sky(rd) * 0. , Ld, 1.) * fog + thr * (1. - fog) * sky(normalize(vec3(rd.x, .02, rd.z)));
      if (fog < .05) break;
      thr *= A * fog; rd = cosHemi(N); ro += N*1e-3; spec_ = false;
      if (b > 3){ float pr = max(thr.r, max(thr.g, thr.b)); if (rnd() > pr) break; thr /= pr; }
      continue;
    }
    // 天空（镜头直接看过去是暗的背景；灯条只出现在反射 / 折射里）
    L += thr * skyL(rd, b > 0 && spec_);   // 灯条只在镜面路径里出现：漫反射不去采样它们（不然满地噪点）
    if (spec_ && !viaFloor && dot(rd, uSun) > cos(SUNA)) L += thr * SUNL * beam(ro);
    break;
  }
  L = min(L, vec3(60.));     // 压住萤火虫
  vec4 prev = texture(uAcc, vUv);
  o = prev + vec4(L, 1.);
}`;
// ---------- 显示：曝光 + 胶片曲线 + 泛光 + 暗角 + 颗粒 ----------
const BRF = `#version 300 es
precision highp float; uniform sampler2D uAcc; in vec2 vUv; out vec4 o;
void main(){ vec4 a = texture(uAcc, vUv); vec3 c = a.rgb / max(a.a, 1.); float l = max(c.r, max(c.g, c.b)); o = vec4(c * smoothstep(1.6, 6., l), 1.); }`;
const BLF = `#version 300 es
precision highp float; uniform sampler2D uT; uniform vec2 uDir; in vec2 vUv; out vec4 o;
void main(){ vec3 s = vec3(0); float w = 0.; for (int i = -12; i <= 12; i++){ float k = exp(-float(i*i)/50.); s += texture(uT, vUv + uDir*float(i)).rgb*k; w += k; } o = vec4(s/w, 1.); }`;
const DSF = `#version 300 es
precision highp float; uniform sampler2D uAcc, uBloom, uStreak; uniform float uExp; uniform vec2 uRes; in vec2 vUv; out vec4 o;
vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14), 0., 1.); }
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
void main(){ vec4 a = texture(uAcc, vUv); vec3 c = a.rgb / max(a.a, 1.);
  c += texture(uBloom, vUv).rgb * .32;
  c += texture(uStreak, vUv).rgb * vec3(.55, .75, 1.25) * .5;     // 变形镜头的横向光晕（偏蓝）
  c *= uExp;
  float lum = dot(c, vec3(.2126, .7152, .0722));
  c = mix(c, c * vec3(.86, 1.02, 1.12), smoothstep(.5, 0., lum));   // 暗部偏青
  c = mix(c, c * vec3(1.1, 1., .86), smoothstep(.3, 2., lum));      // 亮部偏橙
  c = aces(c);
  vec2 q = vUv - .5; c *= 1. - .42*dot(q,q)*1.6;
  c = pow(c, vec3(1./2.2));
  c += (h(gl_FragCoord.xy) - .5) * .026;
  float bar = (uRes.y - uRes.x / 2.39) * .5;   // 2.39 : 1 宽银幕
  if (gl_FragCoord.y < bar || gl_FragCoord.y > uRes.y - bar) c = vec3(0.);
  o = vec4(c, 1.); }`;

function sh(type, src){ const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { log(gl.getShaderInfoLog(s)); throw new Error('shader'); } return s; }
function prog(vs, fs){ const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { log(gl.getProgramInfoLog(p)); throw new Error('link'); } return p; }
const U = (p, n) => gl.getUniformLocation(p, n);
function tex(w, h, fmt = gl.RGBA32F){ const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, fmt, w, h, 0, gl.RGBA, gl.FLOAT, null);
  const lin = fmt !== gl.RGBA32F; gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, lin ? gl.LINEAR : gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, lin ? gl.LINEAR : gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; }
function fbo(t){ const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return f; }
const quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
function drawQuad(p){ const l = gl.getAttribLocation(p, 'p'); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); }

// 场景参数
const sunEl = +(Q.get('el') || 28) * Math.PI / 180, sunPhi = +(Q.get('phi') || 52) * Math.PI / 180;     // 低太阳，从右后方来（画外）
const SUN = [Math.cos(sunEl) * Math.sin(sunPhi), Math.sin(sunEl), -Math.cos(sunEl) * Math.cos(sunPhi)];
const CAM = { pos: JSON.parse(Q.get('cam') || '[-3.3,0.2,2.75]'), tgt: JSON.parse(Q.get('tgt') || '[0,0.9,0]'), fov: 44 * Math.PI / 180, aperture: +(Q.get('ap') || 0.035), focus: +(Q.get('focus') || 4.2) };
const common = (p, seed) => { gl.uniform1f(U(p, 'uRot'), +(Q.get('rot') || 0.87)); gl.uniform1i(U(p, 'uGlyph'), 0); gl.uniform2fv(U(p, 'uGMin'), G.min); gl.uniform2fv(U(p, 'uGMax'), G.max); gl.uniform3fv(U(p, 'uSun'), SUN); gl.uniform1f(U(p, 'uSeed'), seed); };

// ---- 1. 光子 ----
const CS = +(Q.get('cs') || 2048), causT = tex(CS, CS, gl.RGBA32F), causF = fbo(causT);
const php = prog(PHV, PHF);
gl.bindFramebuffer(gl.FRAMEBUFFER, causF); gl.viewport(0, 0, CS, CS); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
gl.useProgram(php); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, gtex);
gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
const nPhot = PN * PN; let t0 = performance.now();
const yieldNow = () => new Promise(r => setTimeout(r, 0));   // 交回事件循环：长时间渲染时截图工具才不会超时
for (let i = 0; i < PHOTON_PASSES; i++) { common(php, i + 1); gl.drawArrays(gl.POINTS, 0, nPhot); gl.finish(); await yieldNow(); }
gl.disable(gl.BLEND);
log('photons', PHOTON_PASSES * nPhot, ((performance.now() - t0) / 1000).toFixed(1) + 's');
// 焦散图模糊一下（核密度估计）
const blurP = prog(QV, BLF);
const causB = tex(CS, CS, gl.RGBA16F), causBF = fbo(causB), causC = tex(CS, CS, gl.RGBA16F), causCF = fbo(causC);
gl.useProgram(blurP); gl.viewport(0, 0, CS, CS);
gl.activeTexture(gl.TEXTURE0);
gl.bindFramebuffer(gl.FRAMEBUFFER, causBF); gl.bindTexture(gl.TEXTURE_2D, causT); gl.uniform1i(U(blurP, 'uT'), 0); gl.uniform2f(U(blurP, 'uDir'), .35 / CS, 0); drawQuad(blurP);
gl.bindFramebuffer(gl.FRAMEBUFFER, causCF); gl.bindTexture(gl.TEXTURE_2D, causB); gl.uniform2f(U(blurP, 'uDir'), 0, .35 / CS); drawQuad(blurP);
// 每个光子的功率 = 太阳照度 × 圆盘面积 / 光子数；焦散照度 = 累加 / 纹素面积
const SUNA = .0096, E_sun = 52000 * Math.PI * SUNA * SUNA;     // 和着色器里一致（只取亮度，颜色在 SUNL 里）
const R = 1.2, texelArea = (12 / CS) * (9 / CS);   // 和 CMIN / CMAX 一致
const causScale = E_sun * Math.PI * R * R / (PHOTON_PASSES * nPhot) / texelArea;

// ---- 2. 路径追踪 ----
const ptp = prog(QV, PTF);
let acc = [tex(W, H), tex(W, H)], accF = acc.map(fbo);
for (const f of accF) { gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); }
gl.useProgram(ptp); gl.viewport(0, 0, W, H);
t0 = performance.now();
for (let s = 0; s < SPP; s++) {
  const src = acc[s % 2], dst = accF[(s + 1) % 2];
  gl.bindFramebuffer(gl.FRAMEBUFFER, dst);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, gtex);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, src);
  gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, causC);
  common(ptp, s); gl.uniform1i(U(ptp, 'uAcc'), 1); gl.uniform1i(U(ptp, 'uCaus'), 2);
  gl.uniform2f(U(ptp, 'uRes'), W, H); gl.uniform1f(U(ptp, 'uCausScale'), causScale); gl.uniform1f(U(ptp, 'uFrame'), s);
  gl.uniform3fv(U(ptp, 'uCamPos'), CAM.pos); gl.uniform3fv(U(ptp, 'uCamTgt'), CAM.tgt); gl.uniform1f(U(ptp, 'uFov'), CAM.fov); gl.uniform1f(U(ptp, 'uAperture'), CAM.aperture); gl.uniform1f(U(ptp, 'uFocus'), CAM.focus); gl.uniform1f(U(ptp, 'uBeamR'), +(Q.get('beam') || 1.3)); gl.uniform1f(U(ptp, 'uDbg'), +(Q.get('dbg') || 0)); gl.uniform1f(U(ptp, 'uFog'), +(Q.get('fog') || 0.007)); gl.uniform1f(U(ptp, 'uCausVol'), +(Q.get('cv') || 3)); gl.uniform3fv(U(ptp, 'uPerson'), JSON.parse(Q.get('person') || '[-1.35,0,1.25]'));
  drawQuad(ptp); gl.finish(); await yieldNow();
  if (s % 8 === 7) log('spp', s + 1, ((performance.now() - t0) / 1000 / (s + 1)).toFixed(2) + ' s/spp');
}
const final = acc[SPP % 2];
// ---- 3. 泛光 + 显示 ----
const bw = W / 4 | 0, bh = H / 4 | 0;
const b1 = tex(bw, bh, gl.RGBA16F), b1F = fbo(b1), b2 = tex(bw, bh, gl.RGBA16F), b2F = fbo(b2);
const brp = prog(QV, BRF); gl.useProgram(brp); gl.viewport(0, 0, bw, bh); gl.bindFramebuffer(gl.FRAMEBUFFER, b1F);
gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, final); gl.uniform1i(U(brp, 'uAcc'), 0); drawQuad(brp);
gl.useProgram(blurP);
for (let i = 0; i < 2; i++) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, b2F); gl.bindTexture(gl.TEXTURE_2D, b1); gl.uniform1i(U(blurP, 'uT'), 0); gl.uniform2f(U(blurP, 'uDir'), 1.5 / bw, 0); drawQuad(blurP);
  gl.bindFramebuffer(gl.FRAMEBUFFER, b1F); gl.bindTexture(gl.TEXTURE_2D, b2); gl.uniform2f(U(blurP, 'uDir'), 0, 1.5 / bh); drawQuad(blurP);
}
const s1 = tex(bw, bh, gl.RGBA16F), s1F = fbo(s1), s2 = tex(bw, bh, gl.RGBA16F), s2F = fbo(s2);
gl.useProgram(brp); gl.viewport(0, 0, bw, bh); gl.bindFramebuffer(gl.FRAMEBUFFER, s1F); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, final); gl.uniform1i(U(brp, 'uAcc'), 0); drawQuad(brp);
gl.useProgram(blurP);
for (let i = 0; i < 4; i++) { const k = [3, 7, 14, 24][i];
  gl.bindFramebuffer(gl.FRAMEBUFFER, i % 2 ? s1F : s2F); gl.bindTexture(gl.TEXTURE_2D, i % 2 ? s2 : s1); gl.uniform1i(U(blurP, 'uT'), 0); gl.uniform2f(U(blurP, 'uDir'), k / bw, 0); drawQuad(blurP); }
const dsp = prog(QV, DSF); gl.useProgram(dsp); gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, final); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, b1);
gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, s1); gl.uniform1i(U(dsp, 'uAcc'), 0); gl.uniform1i(U(dsp, 'uBloom'), 1); gl.uniform1i(U(dsp, 'uStreak'), 2); gl.uniform1f(U(dsp, 'uExp'), +(Q.get('exp') || 0.9)); gl.uniform2f(U(dsp, 'uRes'), W, H);
drawQuad(dsp); gl.finish();
if (!Q.has('notext')) { await document.fonts.load('44px ISI'); await document.fonts.load('30px NSC'); document.getElementById('ui').style.opacity = 1; }
window.__done = true;
})().catch(e => { console.log('ERR', e.message, e.stack); window.__done = true; });
