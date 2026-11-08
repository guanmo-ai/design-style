// paint.js — 治愈系手绘 v2：一个“会画画”的渲染器（WebGL2，无素材）
// 照男鹿和雄式背景的作画顺序：
//   ① 底色（大色块，湿画法：天空渐变、云的暗面晕开）
//   ② 大笔 → ③ 中笔：每一笔都是一个笔刷印子，方向跟着形体走（云沿轮廓、稻子竖着、天空横着），颜色取自底色再抖一点
//   ④ 色点：树叶边上的亮点 / 暗点、草里的小花——“不描绘，只暗示”
// 地面用真实透视（相机高 1.6 m），越远笔越小。
(function (G) {
  // ———————————————————— ① 底色 ————————————————————
  const FS_UNDER = `#version 300 es
  precision highp float;
  in vec2 uv;
  layout(location=0) out vec4 o0;   // 颜色（线性）
  layout(location=1) out vec4 o1;   // id, 笔的方向, 笔的缩放（透视）, 受光
  uniform vec2 res;                 // 画幅 CSS px
  uniform sampler2D cloudT, backT, frontT, ridgeT, solidB, solidF;
  uniform float yh, vpx, foc, hc, wind, seed;
  uniform vec2 sun;
  uniform vec4 road;                // x0, 弯度, 宽, 未用
  uniform vec3 sk0, sk1, sk2, sk3, skSun;
  uniform vec3 cl0, cl1, cl2, cl3;  // 云：亮 / 中 / 暗 / 底
  uniform vec3 mt0, mt1;            // 远山：顶 / 底（空气透视）
  uniform vec3 fo0, fo1, fo2, fo3;  // 树林（远）
  uniform vec3 tr0, tr1, tr2, tr3, tr4;  // 近处的树：最暗 / 暗 / 中 / 亮 / 高光
  uniform vec3 pd0, pd1, pd2, pdW;  // 稻田：远 / 中 / 近 / 风翻起的亮面
  uniform vec3 lv0, rd0, rd1, vg0, vg1;  // 田埂 / 路 / 路的阴影 / 路边草
  uniform float cloudShadowOn, detail;
  uniform vec2 poles[24]; uniform int nPoles; uniform vec2 shDir; uniform vec4 treeSh; uniform vec4 crownS[12]; uniform int nCrown; uniform vec3 sun3;
  #define PI 3.14159265
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)) + seed) * 43758.5453); }
  float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
  float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 5; i++){ s += a * noise(p); p = p * 2.03 + 17.1; a *= .5; } return s; }
  vec4 tx(sampler2D t, vec2 c){ return texture(t, c / res); }

  // 鼓包（云 / 树）的法线：用模糊过的高度算，边缘才圆
  vec3 bumpN(sampler2D t, vec2 c, float e, float z){
    float hx = tx(t, c + vec2(e, 0.)).b - tx(t, c - vec2(e, 0.)).b;
    float hy = tx(t, c + vec2(0., e)).b - tx(t, c - vec2(0., e)).b;
    return normalize(vec3(-hx, -hy, z * e));
  }
  // 叶簇：把树冠切成一小簇一小簇，每簇自己受光（左上亮、右下暗）
  float leafClusters(vec2 c, float cell, vec2 sd){
    vec2 g = floor(c / cell); float best = 9.; vec2 bv = vec2(0.);
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 k = g + vec2(i, j); vec2 ctr = (k + .2 + .6 * vec2(hash(k * 1.3), hash(k * 2.7))) * cell;
      float r = cell * (.6 + .35 * hash(k + 5.));
      vec2 d = (c - ctr) / r; float l = dot(d, d);
      if (l < best) { best = l; bv = d; }
    }
    return dot(normalize(bv + 1e-4) * sqrt(min(best, 1.)), -sd) * smoothstep(1.3, .2, best);
  }
  float roadX(float Z){ return road.x + road.y * (1. - exp(-Z / 70.)) * 9.; }

  void main(){
    vec2 c = vec2(uv.x, 1. - uv.y) * res;
    vec3 L = normalize(vec3(sun, .55));
    vec4 rid = texture(ridgeT, vec2(c.x / res.x, .5));
    vec3 col; float id = 1., ang = .04 + (noise(c * .004) - .5) * .25, sc = 1., lit = 0.;
    // —— 天空：钴蓝 → 天蓝 → 地平线的白，靠太阳一侧更亮、更暖 ——
    float sy = c.y / yh;
    col = mix(sk0, sk1, smoothstep(.0, .5, sy));
    col = mix(col, sk2, smoothstep(.4, .82, sy));
    col = mix(col, sk3, smoothstep(.78, 1., sy));
    col = mix(col, skSun, smoothstep(.55, 1., c.x / res.x) * smoothstep(.3, 1., sy) * .35);
    // —— 云：暗面湿边晕开，亮面边缘干净 ——
    vec4 cv = tx(cloudT, c);
    if (cv.b > .05) {
      vec3 n = bumpN(cloudT, c, 2.5, .9);
      float d = dot(n, L);
      float br = fbm(c * .011) - .5;
      float v = cv.g;
      d += br * .5 - (1. - v) * .5 - .02;
      d = mix(.25 - (1. - v) * .6, d, clamp(detail * 2., 0., 1.));
      float lt = smoothstep(-.3, .55, d);
      vec3 cc = mix(cl2, cl1, lt);
      cc = mix(cc, cl0, smoothstep(.4, .5, d + br * .2));
      cc = mix(cc, cl3, pow(1. - v, 2.2) * .7 * (1. - lt * .6));
      float soft = mix(1.2, 22., pow(1. - v, 1.6)) * (.6 + .8 * smoothstep(.2, -.3, d));
      float a = smoothstep(0., soft, cv.r + br * 10. * (1. - v));
      col = mix(col, cc, a);
      if (a > .5) { id = 2.; vec3 nb = bumpN(cloudT, c, 6., .9); ang = atan(nb.y, nb.x) + PI * .5; lit = d; }
    }
    // —— 远山：空气透视，越往下越浅越蓝 ——
    if (c.y > rid.r) {
      float k = smoothstep(rid.r, yh, c.y);
      float slope = (texture(ridgeT, vec2((c.x + 4.) / res.x, .5)).r - texture(ridgeT, vec2((c.x - 4.) / res.x, .5)).r);
      vec3 m = mix(mt0, mt1, k);
      m *= 1. + clamp(-slope * .06, -.08, .08) * (1. - k) + (fbm(c * vec2(.01, .03)) - .5) * .05;
      col = mix(col, m, smoothstep(0., 1.5, c.y - rid.r));
      if (c.y - rid.r > 1.5) { id = 3.; ang = slope * .1 + (noise(c * .02) - .5) * .5; sc = .7; }
    }
    // —— 远处的树林：先铺暗绿的底，再叠一排鼓包 ——
    if (c.y > rid.g) {
      float t = fbm(c * vec2(.02, .04) + 5.);
      vec3 m = mix(fo1, fo2, smoothstep(.4, .6, t));
      m = mix(m, fo0, smoothstep(rid.g + 40., yh, c.y) * .6);
      col = mix(col, m, smoothstep(0., 1.5, c.y - rid.g));
      if (c.y - rid.g > 1.) { id = 4.; ang = hash(floor(c / 7.)) * 6.28; sc = .55; lit = t - .5; }
    }
    vec4 bv = tx(backT, c);
    if (bv.b > .05) {
      vec3 n = bumpN(backT, c, 1.5, 2.);
      float d = dot(n, L) + (fbm(c * .05) - .5) * .5 - (1. - bv.g) * .3 + leafClusters(c, 8., normalize(sun)) * .4 * detail;
      vec3 m = mix(fo0, fo1, smoothstep(-.4, -.1, d));
      m = mix(m, fo2, smoothstep(.0, .25, d));
      m = mix(m, fo3, smoothstep(.4, .6, d));
      float a = smoothstep(0., 1.5, bv.r + (fbm(c * .09) - .5) * 8.);
      col = mix(col, m, a);
      if (a > .5) { id = 4.; ang = hash(floor(c / 6.)) * 6.28; sc = .55; lit = d; }
    }
    // —— 地面：真实透视 ——
    if (c.y > yh + .5) {
      float Z = foc * hc / (c.y - yh), X = (c.x - vpx) * Z / foc;
      float rx = roadX(Z), rw = road.z;
      float dr = abs(X - rx);
      sc = clamp(9. / Z, .12, 1.8);
      float haze = smoothstep(30., 260., Z);
      // 云影：一大块一大块扫过田野
      float cs = cloudShadowOn * smoothstep(.5, .54, fbm(vec2(X * .02, Z * .009) + vec2(2., 7.)));
      // 电线杆的影子：一根根细长地斜躺在地上
      float psh = 0.;
      for (int i = 0; i < 24; i++) { if (i >= nPoles) break; vec2 a = poles[i], b = a + shDir * 12.; vec2 pa = vec2(X, Z) - a, ba = b - a; float hh = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.); float dd = length(pa - ba * hh); psh = max(psh, smoothstep(.2 + Z * .002, .1, dd)); }
      if (dr < rw * .5) {
        // 土路：两道车辙 + 中间一条草
        vec3 g = mix(rd0, rd0 * vec3(.92, .9, .86), smoothstep(.2, .5, noise(vec2(X * 3., Z * .5))));
        float mid = smoothstep(.32, .22, dr);
        g = mix(g, vg0 * 1.1, mid * smoothstep(.35, .55, noise(vec2(X * 9., Z * 2.))));
        float rut = smoothstep(.12, .0, abs(dr - rw * .28));
        g *= 1. - rut * .08;
        col = g; id = 7.; ang = atan(yh - c.y, vpx + rx * foc / Z - c.x) + PI; lit = 0.;
        if (mid > .5) id = 8.;
      } else if (X < rx && dr > rw * .5 + 1.35 && dr < rw * .5 + 2.15) {
        // 路左边的小水渠：水泥边 + 映着天的水
        float e = dr - (rw * .5 + 1.35);
        float edge = smoothstep(.12, .0, e) + smoothstep(.68, .8, e);
        vec3 wat = mix(sk1, sk2, .55 + .3 * sin(Z * 1.3 + X * 4. + fbm(vec2(X * 6., Z)) * 3.));
        wat = mix(wat, cl1, smoothstep(.6, .75, fbm(vec2(X * 2., Z * .15))) * .6);
        col = mix(wat, vec3(.62, .6, .56), clamp(edge, 0., 1.));
        id = 7.; ang = atan(yh - c.y, vpx + rx * foc / Z - c.x) + PI; sc = clamp(9. / Z, .12, 1.8) * .5;
      } else if (dr < rw * .5 + 1.8 || (X < rx && dr < rw * .5 + 2.6)) {
        // 路边的草
        float t = fbm(vec2(X * 1.5, Z * .4));
        col = mix(vg0, vg1, smoothstep(.35, .7, t));
        id = 8.; ang = -PI * .5 + .35 + (noise(c * .05) - .5) * .5; lit = t - .45;
      } else {
        // 稻田：一块块，田埂隔开
        float side = sign(X - rx);
        float Xs = (X - rx) * side - (rw * .5 + 1.8);
        vec2 cell = vec2(Xs / 18., (Z - 3.) / 24.);
        vec2 fc = fract(cell);
        float pxm = Z / foc;                                  // 1 像素 = 多少米
        float lwx = max(.45 / 18., pxm * 1.2 / 18.), lwz = max(.55 / 24., pxm * 1.2 / 24.);
        float lev = max(smoothstep(lwx, lwx * .4, min(fc.x, 1. - fc.x)), smoothstep(lwz, lwz * .4, min(fc.y, 1. - fc.y)));
        if (Xs < 0.) lev = 0.;
        float h = hash(floor(cell) + side * 7.);
        vec3 g = mix(pd2, pd1, smoothstep(5., 50., Z));
        g = mix(g, pd0, haze);
        g *= .92 + .14 * h;
        g *= .88 + .24 * fbm(vec2(X * .07, Z * .035) + 11.);
        g = mix(g, g * vec3(1.06, 1.02, .86), smoothstep(.55, .75, fbm(vec2(X * .05, Z * .02) + 4.)) * .6);
        g = mix(g, g * vec3(1.08, 1.05, .82), step(.72, h) * .7);   // 有几块田黄一点
        g = mix(g, g * vec3(.86, .97, 1.04), step(h, .22) * .7);    // 有几块田蓝一点
        // 风：一道道浅色的波纹从左往右推过稻田
        float ph = (X * .8 + Z * .45) * .2 - wind + fbm(vec2(X, Z) * .035) * 4.5;
        float wv = smoothstep(.15, 1., sin(ph)) * (.35 + .65 * smoothstep(.3, .7, fbm(vec2(X * .06, Z * .03) + 3.)));
        g = mix(g, pdW, wv * (1. - haze * .6) * .8);
        g = mix(g, g * vec3(.82, .9, .84), smoothstep(-.2, -1., sin(ph)) * .35 * (1. - haze));
        // 一行行的稻子：顺着路的方向排，在画面里汇向消失点（像素够宽才画）
        float rowpx = .3 * foc / Z / sqrt(1. + pow((X - rx) / hc, 2.));
        float rowv = sin((X - rx) * 2. * PI / .3 + h * 6.);
        g *= 1. - smoothstep(.2, 1., rowv) * .2 * smoothstep(3., 9., rowpx);
        g *= 1. + smoothstep(.6, 1., -rowv) * .08 * smoothstep(3., 9., rowpx);
        // 田埂：顶上被太阳照亮的一条
        vec3 lc = mix(lv0, vg1, .35) * (1. + .15 * smoothstep(.5, 1., noise(vec2(X, Z) * .5)));
        g = mix(g, mix(lc, pd0, haze * .7), lev);
        col = g; id = lev > .5 ? 6. : 5.;
        ang = -PI * .5 + .3 * sin(ph) * (1. - haze); lit = wv;
      }
      // 大树的树荫：从地面朝太阳打一条线，被哪团叶子挡住就是影子；叶子缝里漏下来的就是光斑
      float tsh = 0.;
      for (int i = 0; i < 12; i++) {
        if (i >= nCrown) break;
        vec3 ro = vec3(X, 0., Z), ce = crownS[i].xyz; float r = crownS[i].w;
        vec3 oc = ro - ce; float b = dot(oc, sun3); float cc = dot(oc, oc) - r * r; float disc = b * b - cc;
        if (disc > 0.) {
          float t0 = -b - sqrt(disc);
          vec3 hp = ro + sun3 * max(t0, 0.);
          float edge = smoothstep(0., r * .5, sqrt(disc));
          float leaf = smoothstep(.34, .44, fbm(vec2(hp.x + hp.z * .7, hp.y) * 4.2 + float(i) * 3.1)) * (1. - smoothstep(.72, .8, noise(vec2(hp.x * 9. + hp.z * 5., hp.y * 9.))));
          tsh = max(tsh, edge * leaf);
        }
      }
      if (treeSh.z > 0.) {
        vec2 tb = treeSh.xy; vec2 a = tb, b2 = tb + vec2(sun3.x, sun3.z) / sun3.y * -4.2 * -1.;
        vec2 pa = vec2(X, Z) - tb, ba = -vec2(sun3.x, sun3.z) / sun3.y * 4.2;
        float hh = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.);
        tsh = max(tsh, smoothstep(.36, .26, length(pa - ba * hh)));
      }
      col = mix(col, col * vec3(.66, .75, .88), max(cs, psh * .9));
      col = mix(col, col * vec3(.42, .52, .66) + vec3(0., .01, .03), tsh);
      // 地平线的雾
      col = mix(col, mix(sk3, mt1, .5), smoothstep(160., 900., Z) * .6);
    }
    // —— 实心的东西（房子、电线杆、树干）：Canvas 画好再贴 ——
    vec4 sb = tx(solidB, c);
    if (sb.a > .01) { col = mix(col, pow(sb.rgb / max(sb.a, 1e-4), vec3(2.2)), sb.a); if (sb.a > .5) { id = 9.; ang = 0.; sc = .6; } }
    // —— 近处的树：四个色阶 + 叶缘碎一点 ——
    vec4 fv = tx(frontT, c);
    if (fv.b > .05) {
      vec3 n = bumpN(frontT, c, 1.5, 1.8);
      float d = mix(.3, dot(n, L), clamp(detail * 2., 0., 1.)) + (fbm(c * .045) - .5) * .55 * detail - (1. - fv.g) * .45 + (leafClusters(c, 15., normalize(sun)) * .42 + leafClusters(c + 7., 6., normalize(sun)) * .18) * detail;
      vec3 m = mix(tr0, tr1, smoothstep(-.45, -.25, d));
      m = mix(m, tr2, smoothstep(-.05, .12, d));
      m = mix(m, tr3, smoothstep(.32, .46, d));
      m = mix(m, tr4, smoothstep(.62, .72, d) * .7);
      float a = smoothstep(0., 1.5, fv.r + (fbm(c * .08) - .5) * 12. + (noise(c * .35) - .5) * 6.);
      col = mix(col, m, a);
      if (a > .5) { id = 10.; ang = hash(floor(c / 9.)) * 6.28; sc = 1.; lit = d; }
    }
    vec4 sf = tx(solidF, c);
    if (sf.a > .01) { col = mix(col, pow(sf.rgb / max(sf.a, 1e-4), vec3(2.2)), sf.a); if (sf.a > .5) { id = 11.; ang = -PI * .5; sc = .5; } }
    o0 = vec4(col, 1.);
    o1 = vec4(id, ang, sc, lit);
  }`;

  // ———————————————————— ②③④ 笔触 ————————————————————
  const VS_DAB = `#version 300 es
  precision highp float;
  layout(location=0) in vec2 corner;
  layout(location=1) in vec4 dab;      // x, y（CSS px，格点）, 随机 1, 随机 2
  uniform sampler2D tA, tB;
  uniform vec2 res; uniform float dpr, spacing, size; uniform int level;
  uniform vec4 P1[16];   // 每个 id 在 4 层里的笔大小倍数
  uniform vec4 P2[16];   // 每个 id 在 4 层里用哪支笔
  uniform vec4 P3[16];   // 不透明度, 颜色抖动, 越界的量, 方向抖动
  uniform vec3 spotL, spotD, fl0, fl1, fl2, fl3;
  out vec2 vUV; out vec3 vCol; flat out float vBrush, vId, vA, vLeak;
  float h1(float x){ return fract(sin(x * 91.3458) * 47453.5453); }
  void main(){
    vec2 c = dab.xy + (dab.zw - .5) * spacing * 1.15;
    vec2 fp = clamp(c * dpr, vec2(0.), res * dpr - 1.);
    ivec2 ip = ivec2(fp.x, res.y * dpr - 1. - fp.y);
    vec4 B = texelFetch(tB, ip, 0);
    vec3 col = texelFetch(tA, ip, 0).rgb;
    int id = int(B.x + .5);
    float m = P1[id][level];
    float sz = size * m * B.z;
    if (id == 1 || id == 2 || (level == 0 && id < 5)) sz = size * m;
    if (m <= 0. || sz < .7) { gl_Position = vec4(3., 3., 0., 1.); return; }
    float r1 = dab.z, r2 = dab.w, r3 = h1(dab.x * 1.7 + dab.y * 3.1);
    vec4 p3 = P3[id];
    float brush = P2[id][level];
    // 颜色：取底色，明度和冷暖各抖一点
    col *= 1. + (r1 - .5) * p3.y * 2.;
    col.r *= 1. + (r2 - .5) * p3.y; col.b *= 1. - (r2 - .5) * p3.y;
    if (level == 3) {
      if (id == 10 || id == 4) { if (B.w > .45 && r3 < .3) col = mix(col, spotL, .4 + .3 * r3); else if (B.w < -.3 && r3 < .35) col = mix(col, spotD, .55); else { gl_Position = vec4(3., 3., 0., 1.); return; } }
      else if (id == 8) { if (r3 < .06) col = fl0; else if (r3 < .1) col = fl1; else if (r3 < .12) col = fl2; else if (r3 < .14) col = fl3; else col *= 1.18; }
      else col *= 1.12;
    }
    float ang = B.y + (r3 - .5) * p3.w;
    if (level == 0 && id >= 5 && id <= 7) ang = (r3 - .5) * .15;
    vec2 asp = brush < .5 ? vec2(1., .42) : brush < 1.5 ? vec2(.8, .7) : brush < 2.5 ? vec2(1., .13) : vec2(.5, .5);
    vec2 q = corner * asp * sz;
    q = mat2(cos(ang), sin(ang), -sin(ang), cos(ang)) * q;
    vec2 pp = c + q;
    gl_Position = vec4(pp.x / res.x * 2. - 1., 1. - pp.y / res.y * 2., 0., 1.);
    vUV = corner * .5 + .5; vCol = col; vBrush = brush; vId = float(id); vA = p3.x; vLeak = p3.z;
  }`;
  const FS_DAB = `#version 300 es
  precision highp float;
  in vec2 vUV; in vec3 vCol; flat in float vBrush, vId, vA, vLeak;
  uniform sampler2D atlas, tB;
  out vec4 o;
  void main(){
    float a = texture(atlas, vec2((vUV.x + vBrush) * .25, vUV.y)).r;
    float fid = texelFetch(tB, ivec2(gl_FragCoord.xy), 0).x;
    if (abs(fid - vId) > .5) a *= vLeak;
    o = vec4(vCol, a * vA);
  }`;
  const FS_COPY = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform sampler2D t; void main(){ o = texture(t, uv); }`;
  // ———————————————————— 收尾：纸纹 + 颗粒 ————————————————————
  const FS_FINAL = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform sampler2D t; uniform vec2 px; uniform float seed, paper, warm;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)) + seed) * 43758.5453); }
  float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
  void main(){
    vec3 c = texture(t, uv).rgb;
    vec2 p = uv * px;
    float g = noise(p * .55) * .5 + noise(p * .17) * .35 + noise(p * 1.3) * .15;
    c *= 1. + (g - .5) * paper;
    c = mix(c, c * vec3(1.03, 1.0, .95), warm);
    c = pow(clamp(c, 0., 1.), vec3(1. / 2.2));
    c += (hash(p * 1.37) - .5) * .012;
    o = vec4(c, 1.);
  }`;

  // —— 笔刷：Canvas 现画 4 支（平刷 / 圆头 / 细长（草）/ 点）——
  function brushAtlas(R) {
    const S = 128, cv = document.createElement('canvas'); cv.width = S * 4; cv.height = S;
    const x = cv.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, S * 4, S);
    // 0 平刷：一条条鬃毛，两头收
    for (let k = 0; k < 90; k++) {
      const yy = S * (.12 + .76 * R()), a = .18 + .5 * R(), l0 = S * (.04 + .14 * R()), l1 = S * (.86 - .14 * R());
      const g = x.createLinearGradient(l0, 0, l1, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.15, `rgba(255,255,255,${a})`); g.addColorStop(.8, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.strokeStyle = g; x.lineWidth = 1 + 3 * R(); x.beginPath(); x.moveTo(l0, yy); x.quadraticCurveTo(S / 2, yy + (R() - .5) * 6, l1, yy + (R() - .5) * 4); x.stroke();
    }
    // 1 圆头：不规则的一团（树叶）
    x.save(); x.translate(S * 1.5, S / 2);
    for (let k = 0; k < 7; k++) { x.fillStyle = `rgba(255,255,255,${.5 + .5 * R()})`; x.beginPath(); const rr = S * (.2 + .14 * R()); x.ellipse((R() - .5) * S * .3, (R() - .5) * S * .3, rr, rr * (.7 + .3 * R()), R() * 3, 0, 7); x.fill(); }
    x.restore();
    // 2 细长：草叶 / 稻子
    x.save(); x.translate(S * 2, 0);
    x.fillStyle = '#fff'; x.beginPath(); x.moveTo(S * .02, S * .38); x.quadraticCurveTo(S * .5, S * .3, S * .98, S * .5); x.quadraticCurveTo(S * .5, S * .72, S * .02, S * .62); x.closePath(); x.fill();
    x.restore();
    // 3 点：边缘干净的色点
    x.save(); x.translate(S * 3.5, S / 2); x.fillStyle = '#fff'; x.beginPath();
    for (let k = 0; k <= 24; k++) { const a = k / 24 * 6.283, r = S * (.36 + .06 * Math.sin(a * 3 + 1) + .03 * R()); x.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    x.fill(); x.restore();
    return cv;
  }

  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const hex = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
  const L = h => hex(h).map(v => Math.pow(v, 2.2));

  // —— 高度场：一堆球冠取最大值 ——
  function Field(W, H) { return { W, H, h: new Float32Array(W * H), v: new Float32Array(W * H) }; }
  function splat(F, circles, baseY, topY, flat) {
    const { W, H, h, v } = F;
    for (const [cx, cy, r] of circles) {
      const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(W - 1, Math.ceil(cx + r)), y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(H - 1, Math.ceil(cy + r));
      for (let y = y0; y <= y1; y++) {
        const dy = y - cy; let cut = 1;
        if (flat) { cut = Math.min(1, Math.max(0, (baseY - y) / 10)); if (cut <= 0) continue; }
        for (let x = x0; x <= x1; x++) {
          const dx = x - cx, d2 = r * r - dx * dx - dy * dy; if (d2 <= 0) continue;
          const cap = Math.sqrt(d2) * cut, i = y * W + x;
          if (cap > h[i]) { h[i] = cap; v[i] = Math.min(1, Math.max(0, (baseY - y) / (baseY - topY))); }
        }
      }
    }
  }
  // 积乱云：平底 + 往上翻滚、越往上越窄 + 菜花边
  function cumulus(R, { x, base, w, h, bud = 2, lean = 0, tower = .5 }) {
    const C = [];
    const nb = Math.max(4, Math.round(w / 80));
    for (let i = 0; i < nb; i++) { const t = (i + .5) / nb; const r = w / nb * (.7 + .3 * R()); C.push([x - w / 2 + t * w + (R() - .5) * 20, base - r * .45, r]); }
    const N = Math.round(12 + w / 50);
    for (let i = 0; i < N; i++) {
      const t = Math.pow(R(), 1.1);
      const hw = w / 2 * Math.pow(1 - Math.pow(t, 1.2 + tower), .7) * (.5 + .45 * R());
      const r = Math.max(24, (w * .16) * (1 - .5 * t) * (.7 + .5 * R()));
      C.push([x + (R() * 2 - 1) * hw * .8 + lean * t * h, base - r * .55 - t * (h - r * 1.1), r]);
    }
    let out = C.slice(), last = C;
    for (let pass = 0; pass < bud; pass++) {
      const add = [];
      for (const [cx, cy, r] of last) {
        if (r < 18) continue;
        const n = 3 + Math.floor(R() * 4);
        for (let j = 0; j < n; j++) { const a = -Math.PI * (.05 + .9 * R()); const rr = r * (.3 + .17 * R()); add.push([cx + Math.cos(a) * (r - rr * .6), cy + Math.sin(a) * (r - rr * .6), rr]); }
      }
      out = out.concat(add); last = add;
    }
    return out;
  }
  // 一棵树的树冠：几大团 + 每团长小团（叶团）
  function crown(R, { x, y, w, h, clumps = 10 }) {
    const C = [];
    for (let i = 0; i < clumps; i++) {
      const a = -Math.PI * (.05 + .9 * (i / (clumps - 1))) + (R() - .5) * .3;
      const cx = x + Math.cos(a) * w * .33 * (.7 + .4 * R()), cy = y + Math.sin(a) * h * .3 * (.7 + .4 * R()) + h * .1;
      C.push([cx, cy, Math.min(w, h) * (.17 + .07 * R())]);
    }
    C.push([x, y + h * .05, Math.min(w, h) * .3]); C.push([x - w * .2, y + h * .18, Math.min(w, h) * .22]); C.push([x + w * .22, y + h * .2, Math.min(w, h) * .2]);
    let out = C.slice(), last = C;
    for (let pass = 0; pass < 2; pass++) {
      const add = [];
      for (const [cx, cy, r] of last) { if (r < 10) continue; const n = 4 + Math.floor(R() * 4); for (let j = 0; j < n; j++) { const a = -Math.PI * (-.2 + 1.4 * R()); const rr = r * (.28 + .18 * R()); add.push([cx + Math.cos(a) * (r - rr * .4), cy + Math.sin(a) * (r - rr * .4), rr]); } }
      out = out.concat(add); last = add;
    }
    return out;
  }
  // 一棵大树：几大团叶子错开摆，团与团之间漏出天，下沿平一点
  function bigTree(R, { x, y, w, h }) {
    const M = [[-.3, -.02, .21], [-.04, -.2, .24], [.26, -.1, .2], [.4, .12, .13], [-.43, .17, .13], [.06, .1, .17], [-.17, .27, .1], [.2, .26, .09], [-.12, -.36, .12], [.16, -.34, .1]];
    let out = [];
    for (const [dx, dy, r] of M) out = out.concat(crown(R, { x: x + dx * w, y: y + dy * h * 1.3, w: r * 2.3 * w, h: r * 1.9 * w, clumps: 7 }));
    return out;
  }
  // 一排远树（林子的上沿）
  function treeline(R, x0, x1, yOf, hmin, hmax) {
    const C = []; let x = x0;
    while (x < x1) { const r = hmin + (hmax - hmin) * R(); const y = yOf(x); C.push([x, y - r * .6, r]); C.push([x + r * .5, y - r * .3, r * .7]); x += r * (.7 + .5 * R()); }
    let out = C.slice();
    const add = []; for (const [cx, cy, r] of C) { for (let j = 0; j < 3; j++) { const a = -Math.PI * (.1 + .8 * R()); const rr = r * (.35 + .2 * R()); add.push([cx + Math.cos(a) * (r - rr * .5), cy + Math.sin(a) * (r - rr * .5), rr]); } }
    return out.concat(add);
  }
  function ridgeLine(W, R, base, amp, freq, oct = 4) {
    const a = new Float32Array(W); const ph = Array.from({ length: oct }, () => R() * 100);
    for (let x = 0; x < W; x++) { let s = 0, A = 1, F = freq; for (let o = 0; o < oct; o++) { s += A * Math.sin(x * F + ph[o]); A *= .5; F *= 2.1; } a[x] = base(x) + s * amp; }
    return a;
  }
  function fieldTex(gl, F, sigma) {
    const { W, H, h, v } = F;
    const bl = GLK.blurField(Float32Array.from(h), W, H, sigma);
    const d = new Float32Array(W * H * 4);
    for (let i = 0; i < W * H; i++) { d[i * 4] = h[i]; d[i * 4 + 1] = v[i]; d[i * 4 + 2] = bl[i]; d[i * 4 + 3] = 1; }
    return GLK.texture(gl, W, H, { internal: gl.RGBA32F, format: gl.RGBA, type: gl.FLOAT, data: d });
  }
  function canvasTex(gl, cv) {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  // 颜料表（夏天下午，光从右上来）
  const PAL = {
    sk0: '#1c56b8', sk1: '#3b8ad8', sk2: '#86bfe8', sk3: '#d9eef0', skSun: '#fff4dc',
    cl0: '#fffcf2', cl1: '#e9ecf1', cl2: '#a9b0c8', cl3: '#8c95b4',
    mt0: '#6f8fc2', mt1: '#a9c2dc',
    fo0: '#24453f', fo1: '#35604f', fo2: '#4f7f5d', fo3: '#7ba36a',
    tr0: '#0e2a26', tr1: '#1b4236', tr2: '#2f6034', tr3: '#5e913a', tr4: '#a2c45a',
    pd0: '#9dc197', pd1: '#84b84c', pd2: '#5f9a38', pdW: '#cfe6a0',
    lv0: '#557f3c', rd0: '#d8c49c', rd1: '#9b8a76', vg0: '#4f8a3a', vg1: '#86b84a',
    spotL: '#cfe58a', spotD: '#10291f', fl0: '#fffdf2', fl1: '#ffd84a', fl2: '#f6a3c0', fl3: '#b8a6ff',
  };
  // 每个 id 的笔：P1 大小倍数（4 层）、P2 笔刷（4 层）、P3 不透明度 / 颜色抖动 / 越界 / 方向抖动
  //            id: 0 无, 1 天, 2 云, 3 远山, 4 树林, 5 稻田, 6 田埂, 7 路, 8 路边草, 9 房子等, 10 近树, 11 电线杆
  const STROKES = {
    1: [[1.6, 1.0, 0, 0], [0, 0, 0, 0], [.5, .04, .12, .25]],
    2: [[1.1, .95, .8, 0], [0, 0, 0, 0], [.55, .025, .08, .35]],
    3: [[1.0, .8, .6, 0], [0, 0, 0, 0], [.55, .04, .2, .6]],
    4: [[.8, .8, .9, 1.1], [1, 1, 1, 3], [.88, .1, .08, 6.3]],
    5: [[1.0, 1.25, 1.1, .9], [0, 2, 2, 2], [.8, .16, .1, .3]],
    6: [[0, .5, .7, 0], [0, 2, 2, 0], [.6, .07, .05, .3]],
    7: [[1.0, .8, .45, .5], [0, 0, 1, 3], [.45, .06, .1, .25]],
    8: [[.9, 1.15, 1.1, 1.0], [1, 2, 2, 3], [.8, .1, .35, .45]],
    9: [[0, .35, .4, 0], [0, 0, 0, 0], [.3, .07, 0, .1]],
    10: [[.8, .9, .9, 1.0], [1, 1, 1, 3], [.92, .1, .06, 6.3]],
    11: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
  };
  const LEVELS = [{ size: 44, spacing: 24 }, { size: 22, spacing: 12 }, { size: 11, spacing: 6 }, { size: 5.5, spacing: 4 }];

  // S：{ W, H, yh, vpx, foc, hc, road:[x0,弯度,宽], sun, wind, clouds[], back(树林圆), front(近树圆), ridges{far, forest}, solidBack(ctx), solidFront(ctx), levels, pal }
  async function render(gl, S) {
    const W = S.W, H = S.H, dpr = S.dpr || devicePixelRatio;
    const R = rng(S.seed || 7);
    gl.getExtension('EXT_color_buffer_float');
    // 场
    const CF = Field(W, H); for (const c of S.clouds || []) splat(CF, cumulus(R, c), c.base, c.base - c.h, true);
    const BF = Field(W, H); for (const t of S.back || []) splat(BF, t.circles || crown(R, t), t.base ?? (t.y + t.h * .6), t.top ?? (t.y - t.h * .6), false);
    const FF = Field(W, H); for (const t of S.front || []) splat(FF, t.circles || (t.big ? bigTree(R, t) : crown(R, t)), t.y + t.h * .6, t.y - t.h * .6, false);
    const rid = new Float32Array(W * 4);
    for (let x = 0; x < W; x++) { rid[x * 4] = S.ridges.far[x]; rid[x * 4 + 1] = S.ridges.forest[x]; rid[x * 4 + 3] = 1; }
    const sol = (fn) => { const cv = document.createElement('canvas'); cv.width = W * dpr; cv.height = H * dpr; const x = cv.getContext('2d'); x.scale(dpr, dpr); if (fn) fn(x); return cv; };
    const T = {
      cloudT: fieldTex(gl, CF, 7), backT: fieldTex(gl, BF, 2.5), frontT: fieldTex(gl, FF, 3),
      ridgeT: GLK.texture(gl, W, 1, { internal: gl.RGBA32F, format: gl.RGBA, type: gl.FLOAT, data: rid }),
      solidB: canvasTex(gl, sol(S.solidBack)), solidF: canvasTex(gl, sol(S.solidFront)),
    };
    const pal = Object.assign({}, PAL, S.pal || {});
    const DW = gl.drawingBufferWidth, DH = gl.drawingBufferHeight;
    // ① 底色 → MRT
    const mk = () => GLK.texture(gl, DW, DH, { internal: gl.RGBA32F, format: gl.RGBA, type: gl.FLOAT, filter: gl.NEAREST });
    const tA = mk(), tB = mk(), tC = GLK.texture(gl, DW, DH, { internal: gl.RGBA16F, type: gl.HALF_FLOAT });
    const fbU = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbU);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tA, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, tB, 0);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    const PU = GLK.program(gl, FS_UNDER); gl.useProgram(PU);
    let unit = 0; for (const k of Object.keys(T)) GLK.bindTex(gl, PU, k, T[k], unit++);
    for (const k of Object.keys(PAL)) if (PU.u[k]) gl.uniform3fv(PU.u[k], L(pal[k]));
    gl.uniform2f(PU.u.res, W, H); gl.uniform1f(PU.u.yh, S.yh); gl.uniform1f(PU.u.vpx, S.vpx); gl.uniform1f(PU.u.foc, S.foc); gl.uniform1f(PU.u.hc, S.hc);
    gl.uniform1f(PU.u.wind, S.wind || 0); gl.uniform1f(PU.u.seed, (S.seed || 7) * .37); gl.uniform2fv(PU.u.sun, S.sun || [.55, -.62]);
    gl.uniform4fv(PU.u.road, [...(S.road || [.6, .4, 3.4]), 0]);
    const pl = new Float32Array(48); (S.poles || []).slice(0, 24).forEach((p, i) => pl.set(p, i * 2)); gl.uniform2fv(PU.u.poles, pl); gl.uniform1i(PU.u.nPoles, Math.min(24, (S.poles || []).length)); gl.uniform2fv(PU.u.shDir, S.shDir || [-.85, -.55]); gl.uniform4fv(PU.u.treeSh, S.treeShadow || [0, 0, 0, 0]);
    const cr = new Float32Array(48); (S.crownSpheres || []).slice(0, 12).forEach((c, i) => cr.set(c, i * 4)); gl.uniform4fv(PU.u.crownS, cr); gl.uniform1i(PU.u.nCrown, Math.min(12, (S.crownSpheres || []).length));
    { const s3 = S.sun3 || [-.6, .62, .5]; const l = Math.hypot(...s3); gl.uniform3fv(PU.u.sun3, s3.map(v => v / l)); } gl.uniform1f(PU.u.cloudShadowOn, S.cloudShadow ?? 1); gl.uniform1f(PU.u.detail, S.detail ?? 1);
    gl.viewport(0, 0, DW, DH);
    gl.enable(gl.SCISSOR_TEST);
    const tiles = 4, tw = Math.ceil(DW / tiles), th = Math.ceil(DH / tiles);
    for (let y = 0; y < tiles; y++) for (let x = 0; x < tiles; x++) { gl.scissor(x * tw, y * th, tw, th); gl.bindVertexArray(gl._tri); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.finish(); await GLK.tick(); }
    gl.disable(gl.SCISSOR_TEST);
    // 底色拷进画布（累积缓冲）
    const fbC = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbC);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tC, 0); gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
    const PC = GLK.program(gl, FS_COPY); gl.useProgram(PC); GLK.bindTex(gl, PC, 't', tA, 0); gl.viewport(0, 0, DW, DH); gl.bindVertexArray(gl._tri); gl.drawArrays(gl.TRIANGLES, 0, 3);
    // ②③④ 笔触
    const nLevels = S.levels ?? 4;
    if (nLevels > 0) {
      const PD = GLK.program(gl, FS_DAB, VS_DAB); gl.useProgram(PD);
      const atlasCv = brushAtlas(rng(99));
      const at = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, at);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlasCv); gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.uniform1i(PD.u.atlas, 0); GLK.bindTex(gl, PD, 'tA', tA, 1); GLK.bindTex(gl, PD, 'tB', tB, 2);
      const P1 = new Float32Array(64), P2 = new Float32Array(64), P3 = new Float32Array(64);
      for (const id in STROKES) { const [a, b, c] = (S.strokes && S.strokes[id]) || STROKES[id]; P1.set(a, id * 4); P2.set(b, id * 4); P3.set(c, id * 4); }
      gl.uniform4fv(PD.u.P1, P1); gl.uniform4fv(PD.u.P2, P2); gl.uniform4fv(PD.u.P3, P3);
      for (const k of ['spotL', 'spotD', 'fl0', 'fl1', 'fl2', 'fl3']) gl.uniform3fv(PD.u[k], L(pal[k]));
      gl.uniform2f(PD.u.res, W, H); gl.uniform1f(PD.u.dpr, dpr);
      // 单位四边形 + 每笔一个实例
      const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
      const qb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, qb);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      const ib = gl.createBuffer();
      gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbC); gl.viewport(0, 0, DW, DH);
      const Rd = rng((S.seed || 7) + 5);
      for (let lv = 0; lv < Math.min(4, nLevels); lv++) {
        const ss = S.strokeScale ?? 1, size = LEVELS[lv].size * ss, spacing = Math.max(1.5, LEVELS[lv].spacing * ss);
        const pts = [];
        for (let y = -spacing; y < H + spacing; y += spacing) for (let x = -spacing; x < W + spacing; x += spacing) pts.push([x, y, Rd(), Rd()]);
        for (let i = pts.length - 1; i > 0; i--) { const j = Math.floor(Rd() * (i + 1)); [pts[i], pts[j]] = [pts[j], pts[i]]; }
        const data = new Float32Array(pts.length * 4); pts.forEach((p, i) => data.set(p, i * 4));
        gl.bindBuffer(gl.ARRAY_BUFFER, ib); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(1, 1);
        gl.uniform1i(PD.u.level, lv); gl.uniform1f(PD.u.size, size); gl.uniform1f(PD.u.spacing, spacing);
        const chunk = 40000;
        for (let s0 = 0; s0 < pts.length; s0 += chunk) {
          gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, s0 * 16);
          gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, Math.min(chunk, pts.length - s0));
          gl.finish(); await GLK.tick();
        }
      }
      gl.disable(gl.BLEND);
      gl.bindVertexArray(gl._tri);
    }
    // 收尾
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const PF = GLK.program(gl, FS_FINAL); gl.useProgram(PF); GLK.bindTex(gl, PF, 't', tC, 0);
    gl.uniform2f(PF.u.px, W, H); gl.uniform1f(PF.u.seed, 3.1); gl.uniform1f(PF.u.paper, S.paper ?? .07); gl.uniform1f(PF.u.warm, S.warm ?? .3);
    gl.viewport(0, 0, DW, DH); gl.bindVertexArray(gl._tri); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.finish();
    return { CF, BF, FF };
  }

  // 透视：地面上的点 (X, Z, 高 Y) → 屏幕
  function ground(S, X, Z, Y = 0) { return [S.vpx + X * S.foc / Z, S.yh + S.foc * (S.hc - Y) / Z]; }
  function roadX(S, Z) { return S.road[0] + S.road[1] * (1 - Math.exp(-Z / 70)) * 9; }

  G.PAINT = { render, rng, ridgeLine, cumulus, crown, bigTree, treeline, ground, roadX, PAL, hex, L };
})(window);
