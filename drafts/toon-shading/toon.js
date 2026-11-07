// toon.js — 卡通渲染（三渲二）的光线步进渲染器，WebGL2，无贴图素材
// 原创 Q 版角色“星野 Hoshi”：双马尾 + 呆毛 + 宽大卫衣，比剪刀手。
// 第一遍：光线步进写 4 张缓冲（成片色 / 法线+深度 / 灰模+材质 / 只有两阶光）
// 第二遍：按屏幕上的斜条把 5 个阶段拼在一起，描边从深度和法线的跳变里找出来
(function (G) {
  const COMMON = `
  #define PI 3.14159265
  mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
  float sdEll(vec3 p, vec3 r){ float k0=length(p/r); float k1=length(p/(r*r)); return k0*(k0-1.0)/max(k1,1e-5); }
  float sdCap(vec3 p, vec3 a, vec3 b, float r){ vec3 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return length(pa-ba*h)-r; }
  float smin(float a, float b, float k){ float h=clamp(0.5+0.5*(b-a)/k,0.,1.); return mix(b,a,h)-k*h*(1.-h); }
  float smax(float a, float b, float k){ return -smin(-a,-b,k); }
  float sdRC(vec3 p, vec3 a, vec3 b, float r1, float r2){
    vec3 ba = b - a; float l2 = dot(ba,ba); float rr = r1 - r2; float a2 = l2 - rr*rr; float il2 = 1.0/l2;
    vec3 pa = p - a; float y = dot(pa,ba); float z = y - l2;
    vec3 xv = pa*l2 - ba*y; float x2 = dot(xv,xv);
    float y2 = y*y*l2; float z2 = z*z*l2;
    float k = sign(rr)*rr*rr*x2;
    if (sign(z)*a2*z2 > k) return sqrt(x2 + z2)*il2 - r2;
    if (sign(y)*a2*y2 < k) return sqrt(x2 + y2)*il2 - r1;
    return (sqrt(x2*a2*il2)+y*rr)*il2 - r1;
  }
  float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  `;

  const FS = `#version 300 es
  precision highp float;
  in vec2 uv;
  layout(location=0) out vec4 o0;   // 成片色（不含描边）
  layout(location=1) out vec4 o1;   // 视空间法线 + 深度
  layout(location=2) out vec4 o2;   // 灰模, 材质 id, 是否角色, 脸
  layout(location=3) out vec4 o3;   // 只有两阶光
  uniform vec2 res; uniform vec3 cam, tgt; uniform float fov;
  uniform vec4 root;        // 角色位置 + yaw
  uniform float headTilt, swing, peace, expr, pedOn;
  uniform vec3 L;           // 光的方向（世界）
  uniform vec3 rimCol;
  uniform vec3 cHair, cHairS, cHood, cHoodS, cSkin, cSkinS, cAcc, cAccS, cLeg, cLegS, cShoe, cShoeS, cPed, cPedS, cEye;
  ${COMMON}

  vec3 headSurfZ(float x, float y){ return vec3(x, y, .95 * sqrt(max(0., 1. - x*x - y*y / .92))); }

  // 头（含头发），局部坐标：头心在原点
  vec2 headD(vec3 h){
    float head = sdEll(h, vec3(1., .96, .95));
    head = smin(head, sdEll(h - vec3(0., -.42, .2), vec3(.68, .54, .62)), .3);
    vec2 r = vec2(head, 1.);
    float cap = sdEll(h - vec3(0., .1, -.07), vec3(1.1, 1.08, 1.09));
    float cut = sdEll(h - vec3(0., -.5, .8), vec3(1.0, .84, .78));
    float hair = smax(cap, -cut, .05);
    hair = smin(hair, sdEll(h - vec3(0., -.42, -.36), vec3(1.02, .78, .72)), .2);
    // 刘海尖：贴着额头往下长的 7 缕
    for (int i = 0; i < 7; i++) {
      float fi = float(i), x = -.72 + fi * .24;
      float t = (fract(fi * .618) - .5) * .12 + x * .08;
      float ty = -.02 + .13 * fract(fi * .377 + .2) - (i == 3 ? .12 : 0.) - (i == 2 || i == 4 ? .05 : 0.);
      vec3 a = headSurfZ(x * .95, .52) + vec3(0., 0., .03);
      vec3 b = headSurfZ(clamp(x + t, -.88, .88), ty) + vec3(0., 0., .035);
      hair = smin(hair, sdRC(h, a, b, .155, .02), .045);
    }
    // 鬓角
    vec3 hs = vec3(abs(h.x), h.yz);
    float side = min(sdRC(hs, vec3(.84, .45, .32), vec3(.93, -.25, .42), .24, .17), sdRC(hs, vec3(.93, -.25, .42), vec3(.82, -.92, .44), .17, .03));
    hair = smin(hair, side, .05);
    // 双马尾：甩向同一边（转身的“跟随”）
    float tails = 1e9;
    for (int s = 0; s < 2; s++) {
      float sg = s == 0 ? -1. : 1.;
      float sw = swing * (s == 0 ? 1.25 : .8);
      vec3 p0 = vec3(sg * 1.0, .42, -.38);
      vec3 c1 = vec3(sg * 1.72 - sw * .3, .15 + sw * .1, -.42 - sw * .3);
      vec3 p3 = vec3(sg * 1.28 - sw * 1.2, -1.55 + sw * .6, -.1 - sw * .6);
      float tl = 1e9; vec3 prev = p0; float rp = .25;
      for (int k = 1; k <= 7; k++) {
        float u = float(k) / 7.;
        vec3 c2 = vec3(sg * 1.62 - sw * .8, -.85 + sw * .3, -.3 - sw * .5);
        vec3 pt = mix(mix(mix(p0, c1, u), mix(c1, c2, u), u), mix(mix(c1, c2, u), mix(c2, p3, u), u), u);
        float rr = mix(.25, .03, pow(u, 1.6)) + .07 * sin(u * 3.1416) * (1. - u * .5);
        tl = smin(tl, sdRC(h, prev, pt, rp, rr), .06);
        prev = pt; rp = rr;
      }
      tails = min(tails, tl);
      float tie = length(h - vec3(sg * 1.03, .43, -.38)) - .16;
      if (tie < r.x) r = vec2(tie, 7.);
    }
    hair = smin(hair, tails, .08);
    // 呆毛
    vec3 q0 = vec3(.02, 1.02, .1), q1 = vec3(.08, 1.36, .14), q2 = vec3(.28, 1.6, .18), q3 = vec3(.52, 1.56, .22), q4 = vec3(.62, 1.4, .25);
    float ah = smin(smin(sdRC(h, q0, q1, .08, .06), sdRC(h, q1, q2, .06, .045), .03), smin(sdRC(h, q2, q3, .045, .03), sdRC(h, q3, q4, .03, .008), .02), .02);
    hair = smin(hair, ah, .03);
    if (hair < r.x) r = vec2(hair, 2.);
    return r;
  }

  // 角色局部坐标：头心在原点，脚底 y = -2.95
  vec2 chara(vec3 p){
    vec3 h = p; h.xy = rot(headTilt) * h.xy;
    vec2 r = headD(h);
    float neck = sdCap(p, vec3(0., -.75, -.02), vec3(0., -1.18, 0.), .17);
    if (neck < r.x) r = vec2(neck, 1.);
    vec3 tp = p; tp.z *= 1.2;
    float torso = sdRC(tp, vec3(0., -1.18, -.02), vec3(0., -1.86, 0.), .42, .6) * .83;
    torso = smax(torso, -2.06 - p.y, .05);
    float band = length(vec2(length(p.xz * vec2(1., 1.2)) - .55, p.y + 2.0)) - .07;
    torso = smin(torso, band, .03);
    float hood = sdEll(p - vec3(0., -1.1, -.44), vec3(.66, .36, .34));
    float hd = smin(torso, hood, .1);
    // 袖子
    vec3 sL0 = vec3(-.44, -1.3, 0.), sL1 = vec3(-.8, -1.6, .1), sL2 = vec3(-.92, -1.86, .22);
    float pz = peace;
    vec3 sR0 = vec3(.44, -1.3, 0.), sR1 = mix(vec3(.8, -1.6, .1), vec3(.88, -1.18, .26), pz), sR2 = mix(vec3(.92, -1.86, .22), vec3(.98, -.74, .52), pz);
    float sl = min(sdRC(p, sL0, sL1, .17, .18), sdRC(p, sL1, sL2, .18, .22));
    float sr = min(sdRC(p, sR0, sR1, .17, .18), sdRC(p, sR1, sR2, .18, .22));
    hd = smin(hd, min(sl, sr), .04);
    if (hd < r.x) r = vec2(hd, 3.);
    // 手
    float hl = length(p - (sL2 + vec3(0., -.13, .02))) - .13;
    vec3 hr = sR2 + mix(vec3(0., -.13, .02), vec3(-.02, .14, .03), pz);
    float hn = length(p - hr) - .135;
    float f1 = sdCap(p, hr, hr + vec3(-.13, .3, .07) * pz, .05);
    float f2 = sdCap(p, hr, hr + vec3(.1, .31, .06) * pz, .05);
    float hands = min(hl, smin(hn, min(f1, f2), .04));
    if (hands < r.x) r = vec2(hands, 4.);
    // 腿 + 鞋
    vec3 q = vec3(abs(p.x), p.yz);
    float leg = sdRC(q, vec3(.2, -1.95, 0.), vec3(.22, -2.76, .02), .14, .12);
    if (leg < r.x) r = vec2(leg, 5.);
    float shoe = sdEll(q - vec3(.23, -2.85, .09), vec3(.17, .12, .26));
    if (shoe < r.x) r = vec2(shoe, 6.);
    return r;
  }

  vec3 toChar(vec3 p){ vec3 q = p - root.xyz; q.xz = rot(root.w) * q.xz; return q; }
  vec3 fromCharN(vec3 n){ n.xz = rot(-root.w) * n.xz; return n; }

  vec2 map(vec3 p){
    vec3 q = toChar(p);
    vec2 r = vec2(length(q - vec3(0., -.7, 0.)) - 2.9, 0.);
    if (r.x < .3) r = chara(q);
    if (pedOn > .5) {
      vec2 d = vec2(length(p.xz) - 1.75, abs(p.y + .2) - .2);
      float ped = min(max(d.x, d.y), 0.) + length(max(d, 0.)) - .04;
      if (ped < r.x) r = vec2(ped, 8.);
    }
    return r;
  }
  vec3 nrm(vec3 p){ vec2 e = vec2(.0012, 0.); return normalize(vec3(map(p+e.xyy).x-map(p-e.xyy).x, map(p+e.yxy).x-map(p-e.yxy).x, map(p+e.yyx).x-map(p-e.yyx).x)); }
  float hardShadow(vec3 ro, vec3 rd){
    float t = .03;
    for (int i = 0; i < 70; i++){ float h = map(ro + rd * t).x; if (h < .002) return 0.; t += clamp(h, .01, .35); if (t > 9.) break; }
    return 1.;
  }
  float ao(vec3 p, vec3 n){ float s = 0., w = 1.; for (int i = 1; i <= 5; i++){ float h = .05 * float(i); s += w * (h - map(p + n * h).x); w *= .65; } return clamp(1. - 2.2 * s, 0., 1.); }

  // —— 画在脸上的五官（贴图式，不是模型）——
  vec4 faceArt(vec3 h){
    if (h.z < .25) return vec4(0.);
    float u = h.x, v = h.y;
    vec4 c = vec4(0.);
    // 腮红：斜线
    vec2 bq = vec2(abs(u) - .55, v + .4);
    float bl = length(bq / vec2(.17, .075));
    float hatch = step(.55, fract((u * sign(u) * .7 - v) * 26.));
    c = mix(c, vec4(1., .5, .58, 1.), smoothstep(1., .7, bl) * (.35 + .4 * hatch));
    float side = sign(u);
    vec2 e = vec2(abs(u) - .36, v + .13);
    if (expr < .5) {
      float ed = length(e / vec2(.19, .245));
      float m = smoothstep(1.02, .97, ed);
      // 眼白
      vec4 ec = vec4(1., 1., 1., 1.);
      // 虹膜：上深下亮
      vec2 ie = vec2(e.x + side * .012, e.y + .02);
      float id = length(ie / vec2(.145, .2));
      vec3 irisC = mix(cEye * 1.25 + .05, vec3(.08, .07, .25), smoothstep(-.2, .14, ie.y));
      irisC = mix(irisC, vec3(.04, .03, .14), smoothstep(.95, 1., id));
      ec.rgb = mix(ec.rgb, irisC, smoothstep(1.03, .97, id));
      float pd = length((ie - vec2(0., .02)) / vec2(.06, .1));
      ec.rgb = mix(ec.rgb, vec3(.04, .03, .14), smoothstep(1.05, .95, pd));
      // 虹膜下半圈亮环
      float ring = smoothstep(.07, .0, abs(id - .7)) * smoothstep(0., -.1, ie.y);
      ec.rgb = mix(ec.rgb, cEye * 1.7 + .15, ring * .6);
      // 高光（两只眼睛同一边）
      vec2 hp = vec2(u - side * .36, v + .13);
      float h1 = smoothstep(1.05, .9, length((hp - vec2(-.055, .075)) / vec2(.055, .065)));
      float h2 = smoothstep(1.1, .85, length((hp - vec2(.06, -.1)) / vec2(.025, .025)));
      ec.rgb = mix(ec.rgb, vec3(1.), max(h1, h2));
      c = mix(c, ec, m);
      // 上睫毛：一条粗弧，外眼角翘起
      float top = smoothstep(.0, .02, e.y + .02);
      float lash = smoothstep(1.2, 1.12, ed) * smoothstep(.9, .98, ed) * top;
      float wing = smoothstep(.035, .02, length(vec2(e.x - .19 - (e.y - .14) * .6, 0.)) ) * smoothstep(.1, .14, e.y) * smoothstep(.24, .18, e.y) * step(.12, e.x);
      float lid = smoothstep(.03, .0, abs(ed - 1.05)) * top;
      c = mix(c, vec4(.12, .07, .18, 1.), clamp(max(max(lash, wing), lid), 0., 1.));
      // 下睫毛：一小撇
      float low = smoothstep(.022, .0, abs(ed - 1.04)) * step(e.y, -.16) * step(.02, e.x);
      c = mix(c, vec4(.3, .16, .25, 1.), low * .8);
    } else {
      // 眯眼 > <
      vec2 a = vec2(e.x, e.y);
      float l1 = abs(a.y - a.x * .45 * side * 0. - .0);
      float arc = abs(length(vec2(a.x, a.y + .12) ) - .16);
      float m = smoothstep(.03, .016, arc) * step(-.03, a.y);
      c = mix(c, vec4(.12, .07, .18, 1.), m);
    }
    // 嘴：小小一张开的笑
    vec2 mo = vec2(u, v + .6);
    float md = length(mo / vec2(.1, .085));
    float mm = smoothstep(1.05, .95, md) * step(mo.y, .012);
    vec3 mc = mix(vec3(.55, .12, .2), vec3(1., .5, .55), smoothstep(-.02, -.07, mo.y));
    c = mix(c, vec4(mc, 1.), mm);
    float ml = smoothstep(.02, .0, abs(md - 1.)) * step(mo.y, .015);
    c = mix(c, vec4(.35, .1, .15, 1.), ml * .9);
    return c;
  }

  void main(){
    vec2 sp = (uv - .5) * vec2(res.x / res.y, 1.) * 2.;
    vec3 fw = normalize(tgt - cam), rt = normalize(cross(fw, vec3(0,1,0))), up = cross(rt, fw);
    vec3 rd = normalize(fw / tan(fov * .5) + rt * sp.x + up * sp.y);
    float t = 0.; vec2 h; bool hit = false;
    for (int i = 0; i < 200; i++){
      h = map(cam + rd * t);
      if (h.x < .0005 * t) { hit = true; break; }
      t += h.x * .92;
      if (t > 40.) break;
    }
    if (!hit) { o0 = vec4(0.); o1 = vec4(0., 0., 0., 1e4); o2 = vec4(0.); o3 = vec4(0.); return; }
    vec3 p = cam + rd * t;
    vec3 n = nrm(p);
    float mat = h.y;
    vec3 Ln = normalize(L);
    float ndl = dot(n, Ln);
    float ndv = clamp(dot(n, -rd), 0., 1.);
    float sh = hardShadow(p + n * .012, Ln);
    float oc = ao(p, n);
    vec3 base, shade;
    if (mat < 1.5) { base = cSkin; shade = cSkinS; }
    else if (mat < 2.5) { base = cHair; shade = cHairS; }
    else if (mat < 3.5) { base = cHood; shade = cHoodS; }
    else if (mat < 4.5) { base = cSkin; shade = cSkinS; }
    else if (mat < 5.5) { base = cLeg; shade = cLegS; }
    else if (mat < 6.5) { base = cShoe; shade = cShoeS; }
    else if (mat < 7.5) { base = cAcc; shade = cAccS; }
    else { base = cPed; shade = cPedS; }
    vec3 q = toChar(p);
    vec3 hq = q; hq.xy = rot(headTilt) * hq.xy;
    // 卫衣胸口的星星
    if (mat > 2.5 && mat < 3.5) {
      vec2 sp2 = q.xy - vec2(-.05, -1.5);
      float a = atan(sp2.x, sp2.y), rr = length(sp2);
      float star = .11 * (.62 + .38 * cos(a * 5.)) / (1. + .0);
      float sd = rr - .065 - .06 * pow(abs(cos(a * 2.5)), 3.);
      if (q.z > 0. && sd < 0.) { base = cAcc; shade = cAccS; }
    }
    if (mat > 7.5) {
      float rr = length(p.xz);
      if (n.y > .5) { base = mix(cPed, vec3(1.), smoothstep(.03, .0, abs(rr - 1.45)) * .9); }
      else { float st = step(.5, fract(atan(p.z, p.x) * 3.)); base = mix(cPed, cPedS, .25 * st); }
    }
    // —— 两阶光 ——
    float lam = ndl * .5 + .5;
    float thr = mat < 1.5 ? .44 : (mat < 2.5 ? .5 : .47);
    float lit = smoothstep(thr - .012, thr + .012, lam) * sh;
    // 脸：不用法线，用“阴影阈值图”——明暗交界是画出来的直线
    vec4 fa = vec4(0.);
    bool isFace = mat < 1.5 && hq.z > .2 && hq.y < .5 && hq.y > -1.;
    if (isFace) {
      vec3 Lh = Ln; Lh.xz = rot(root.w) * Lh.xz; Lh.xy = rot(headTilt) * Lh.xy;
      float side = sign(Lh.x);
      float far = -side * hq.x;
      float b = .8 - .35 * abs(Lh.x) + .12 * hq.y * hq.y + .05 * (hq.y + .3);
      lit = smoothstep(b + .008, b - .008, far) * sh;
      fa = faceArt(hq);
    }
    vec3 ramp = mix(shade, base, lit);
    vec3 col = ramp;
    // 天使环：头发上一圈锯齿状高光
    vec3 nv = vec3(dot(n, rt), dot(n, up), dot(n, -fw));
    if (mat > 1.5 && mat < 2.5) {
      vec3 hn = fromCharN(n);
      float az = atan(hq.x, hq.z);
      float ry = .66 + .05 * abs(sin(az * 7.)) - .02 * cos(az);
      float ring = smoothstep(.07, .048, abs(hq.y - ry)) * smoothstep(-.1, .3, hq.z) * smoothstep(.5, .7, ndv + .3);
      col = mix(col, mix(base, vec3(1.), .75), ring * (.55 + .45 * lit));
    }
    // 边缘光：屏幕空间，只在背光的一侧
    float rim = smoothstep(.6, .63, 1. - ndv) * smoothstep(.0, .3, dot(nv.xy, normalize(vec2(1., .35))));
    if (mat < 7.5) col = mix(col, rimCol, rim * .85);
    // 鞋子的小高光
    if (mat > 5.5 && mat < 6.5) { vec3 hv = normalize(Ln - rd); col = mix(col, vec3(1.), step(.97, dot(n, hv)) * .9); }
    col = mix(col, fa.rgb, fa.a);
    ramp = mix(ramp, fa.rgb, fa.a);
    // 灰模：普通的兰伯特 + AO
    float grey = (.16 + .7 * max(ndl, 0.) * mix(.35, 1., sh)) * mix(.5, 1., oc) + .06 * (n.y * .5 + .5);
    float isChar = mat < 7.5 ? 1. : 0.;
    float depth = dot(p - cam, fw);
    o0 = vec4(col, 1.);
    o1 = vec4(nv, depth);
    o2 = vec4(grey, mat, isChar, isFace ? 1. : 0.);
    o3 = vec4(ramp, 1.);
  }`;

  // —— 合成：背景 + 斜条拼 5 个阶段 + 描边 ——
  const FS_COMP = `#version 300 es
  precision highp float;
  in vec2 uv; out vec4 o;
  uniform sampler2D t0, t1, t2, t3;
  uniform vec2 res; uniform float px;           // px：1 个 CSS 像素对应多少物理像素
  uniform vec4 strips;                           // 斜条：原点 xy(CSS px)、宽度、条数
  uniform vec2 sdir;                             // 斜条推进的方向
  uniform float stageAll;                        // >0 时整张都是这个阶段
  uniform vec3 sky0, sky1, sky2, vp0, vp1;
  uniform float seed, swooshOn;
  uniform vec4 swoosh;                           // 圆心 xy(CSS px)、半径 rx、ry
  ${COMMON}
  float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
    return mix(mix(hash21(i), hash21(i+vec2(1,0)), f.x), mix(hash21(i+vec2(0,1)), hash21(i+vec2(1,1)), f.x), f.y); }
  // 动画里的积云：一团团圆，亮面 / 暗面两色，边缘干净
  vec3 clouds(vec2 q, vec3 c){
    vec2 cs[9] = vec2[](vec2(.12,.2), vec2(.24,.16), vec2(.36,.22), vec2(.7,.12), vec2(.84,.18), vec2(.95,.1), vec2(.55,.08), vec2(.03,.12), vec2(.45,.15));
    float rs[9] = float[](.07,.1,.065,.08,.11,.07,.05,.06,.06);
    float d = 1e9, dl = 1e9;
    for (int i = 0; i < 9; i++){
      vec2 cc = cs[i];
      for (int k = 0; k < 5; k++){
        float fk = float(k);
        vec2 off = vec2((fk - 2.) * .55, -abs(fk - 2.) * .22 + .05) * rs[i];
        float r = rs[i] * (1. - abs(fk - 2.) * .18);
        float dd = length((q - cc - off) * vec2(1., 1.)) - r;
        d = min(d, dd);
        dl = min(dl, length(q - cc - off - vec2(-.25, .3) * r) - r * .92);
      }
      d = max(d, -(q.y - cc.y + rs[i] * .35));
      dl = max(dl, -(q.y - cc.y + rs[i] * .35));
    }
    float a = smoothstep(.002, -.0, d);
    vec3 cl = mix(vec3(.62, .74, .98), vec3(1.), smoothstep(.0015, -.001, dl));
    return mix(c, cl, a);
  }
  vec3 skyFinal(vec2 f){ // f：0..1，y 向上
    vec3 c = mix(sky2, sky1, smoothstep(.15, .6, f.y));
    c = mix(c, sky0, smoothstep(.6, 1., f.y));
    vec2 q = vec2(f.x * res.x / res.y, f.y);
    c = clouds(vec2(q.x * .55, (q.y - .12) * 1.1), c);
    return c;
  }
  vec3 viewport(vec2 cpx){
    vec3 c = mix(vp1, vp0, uv.y);
    vec2 g = abs(fract(cpx / 48.) - .5) * 48.;
    float l = smoothstep(1., 0., min(g.x, g.y));
    c += l * .045;
    vec2 g2 = abs(fract(cpx / 240.) - .5) * 240.;
    c += smoothstep(1., 0., min(g2.x, g2.y)) * .05;
    return c;
  }
  void main(){
    vec2 cpx = vec2(uv.x * res.x, (1. - uv.y) * res.y) / px;   // CSS 像素，y 向下
    float sx = dot(cpx - strips.xy, sdir);
    float stage = stageAll > 0. ? stageAll : clamp(floor(sx / strips.z) + 1., 1., strips.w);
    vec4 a0 = texture(t0, uv), a1 = texture(t1, uv), a2 = texture(t2, uv), a3 = texture(t3, uv);
    bool hit = a1.w < 1e3;
    vec3 col;
    vec3 bgF = skyFinal(uv);
    if (swooshOn > 0.) {
      // 一圈转身留下的动画特效：两色的弧带，越往尾巴越细
      vec2 d = (cpx - swoosh.xy) / swoosh.zw;
      float ang = atan(d.y, d.x);
      float u = fract((ang + 2.2) / (2. * PI));
      float w = .085 * smoothstep(.0, .55, u) * smoothstep(1., .7, u);
      float rr = length(d);
      float band = abs(rr - 1.) - w;
      float inner = abs(rr - 1. + w * .35) - w * .4;
      if (band < 0.) bgF = mix(vec3(.55, .9, 1.), vec3(1.), step(inner, 0.));
      float band2 = abs(rr - 1.13) - w * .3;
      if (band2 < 0. && u > .35) bgF = vec3(1.);
    }
    vec3 bgV = viewport(cpx);
    vec3 bg = stage < 2.5 ? bgV : bgF;
    if (!hit) col = bg;
    else {
      if (stage < 1.5) col = vec3(a2.x) * vec3(.95, .96, 1.);
      else if (stage < 2.5) col = a1.xyz * .5 + .5;
      else if (stage < 3.5) col = a3.rgb;
      else if (stage < 4.5) col = a3.rgb;
      else col = a0.rgb;
    }
    // 描边：深度跳变 + 法线折角 + 材质分界
    if (stage > 3.5) {
      float r = 1.45 * px;
      float e = 0.;
      float dc = hit ? a1.w : 1e4;
      for (int i = 0; i < 8; i++){
        float an = float(i) * PI / 4.;
        vec2 off = vec2(cos(an), sin(an)) * r / res;
        vec4 b1 = texture(t1, uv + off), b2 = texture(t2, uv + off);
        float db = b1.w < 1e3 ? b1.w : 1e4;
        float dd = abs(db - dc) / min(db, dc);
        e = max(e, smoothstep(.02, .05, dd));
        if (hit && b1.w < 1e3) {
          e = max(e, smoothstep(.55, .35, dot(b1.xyz, a1.xyz)) * .9);
          if (abs(b2.y - a2.y) > .5 && !(a2.y < 1.5 && b2.y < 1.5) && !(a2.y > 3.5 && a2.y < 4.5 && b2.y < 1.5)) e = max(e, .85);
        }
      }
      vec3 lineC = hit ? a3.rgb * vec3(.32, .26, .4) : vec3(.12, .08, .2);
      if (!hit) { // 站在背景上的那一侧也要描
        vec4 nb; float best = 1e4;
        for (int i = 0; i < 8; i++){ float an = float(i) * PI / 4.; vec2 off = vec2(cos(an), sin(an)) * r / res; nb = texture(t3, uv + off); if (texture(t1, uv + off).w < 1e3) { lineC = nb.rgb * vec3(.32, .26, .4); } }
      }
      col = mix(col, lineC, e);
    }
    // 斜条分界线
    if (stageAll <= 0.) {
      float fx = fract(sx / strips.z) * strips.z;
      float edge = min(fx, strips.z - fx);
      if (sx > strips.z * .5 && sx < strips.z * (strips.w - 1.) + strips.z * .5 && cpx.y > 92.) col = mix(col, vec3(1.), smoothstep(1.6, .4, edge) * .9);
    }
    col = pow(clamp(col, 0., 1.), vec3(1. / 2.2));
    col += (hash21(uv * res + seed) - .5) * .012;
    o = vec4(col, 1.);
  }`;

  function mrt(gl, w, h, n) {
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    const tex = [];
    for (let i = 0; i < n; i++) {
      const t = GLK.texture(gl, w, h, { internal: gl.RGBA32F, format: gl.RGBA, type: gl.FLOAT, filter: gl.NEAREST });
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0);
      tex.push(t);
    }
    gl.drawBuffers(tex.map((_, i) => gl.COLOR_ATTACHMENT0 + i));
    const st = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (st !== gl.FRAMEBUFFER_COMPLETE) throw new Error('mrt incomplete ' + st);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fb, tex, w, h };
  }

  const hex = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
  const L = h => hex(h).map(v => Math.pow(v, 2.2));

  const PAL = {
    hair: '#c9b8ff', hairS: '#7d68e0', hood: '#fbfbff', hoodS: '#aebaf0', skin: '#ffe9dc', skinS: '#f4aaa4',
    acc: '#ffd23f', accS: '#f08a2c', leg: '#3a3156', legS: '#211a36', shoe: '#ff6f9c', shoeS: '#c43c72', ped: '#ffffff', pedS: '#b9c6ff', eye: '#4fc3ff', rim: '#e8fbff',
  };

  // s：{ cam, tgt, fov, root:[x,y,z,yaw], headTilt, swing, peace, expr, light, pal }
  async function render(gl, s, comp) {
    const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
    gl.getExtension('EXT_color_buffer_float');
    const P = GLK.program(gl, FS), C = GLK.program(gl, FS_COMP);
    const G = mrt(gl, W, H, 4);
    gl.useProgram(P);
    gl.uniform2f(P.u.res, W, H);
    gl.uniform3fv(P.u.cam, s.cam); gl.uniform3fv(P.u.tgt, s.tgt); gl.uniform1f(P.u.fov, s.fov * Math.PI / 180);
    gl.uniform4fv(P.u.root, s.root); gl.uniform1f(P.u.headTilt, s.headTilt || 0); gl.uniform1f(P.u.swing, s.swing || 0);
    gl.uniform1f(P.u.peace, s.peace ?? 1); gl.uniform1f(P.u.expr, s.expr || 0); gl.uniform1f(P.u.pedOn, s.ped === false ? 0 : 1);
    const l = s.light || [-0.55, 0.75, 0.6]; gl.uniform3fv(P.u.L, l);
    const pal = Object.assign({}, PAL, s.pal || {});
    const map = { cHair: 'hair', cHairS: 'hairS', cHood: 'hood', cHoodS: 'hoodS', cSkin: 'skin', cSkinS: 'skinS', cAcc: 'acc', cAccS: 'accS', cLeg: 'leg', cLegS: 'legS', cShoe: 'shoe', cShoeS: 'shoeS', cPed: 'ped', cPedS: 'pedS', cEye: 'eye', rimCol: 'rim' };
    for (const k in map) gl.uniform3fv(P.u[k], L(pal[map[k]]));
    gl.bindFramebuffer(gl.FRAMEBUFFER, G.fb);
    gl.drawBuffers([0, 1, 2, 3].map(i => gl.COLOR_ATTACHMENT0 + i));
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    // 分块步进
    gl.enable(gl.SCISSOR_TEST);
    const tiles = s.tiles || 8, tw = Math.ceil(W / tiles), th = Math.ceil(H / tiles);
    for (let y = 0; y < tiles; y++) for (let x = 0; x < tiles; x++) {
      gl.scissor(x * tw, y * th, tw, th);
      gl.bindVertexArray(gl._tri); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.finish(); await GLK.tick();
    }
    gl.disable(gl.SCISSOR_TEST);
    // 合成
    gl.useProgram(C);
    G.tex.forEach((t, i) => GLK.bindTex(gl, C, 't' + i, t, i));
    gl.uniform2f(C.u.res, W, H); gl.uniform1f(C.u.px, comp.px);
    gl.uniform4fv(C.u.strips, comp.strips || [0, 0, 1e5, 1]); gl.uniform2fv(C.u.sdir, comp.sdir || [1, 0]); gl.uniform1f(C.u.stageAll, comp.stageAll || 0);
    gl.uniform3fv(C.u.sky0, L(comp.sky0 || '#2c6cff')); gl.uniform3fv(C.u.sky1, L(comp.sky1 || '#5cb8ff')); gl.uniform3fv(C.u.sky2, L(comp.sky2 || '#d8f4ff'));
    gl.uniform3fv(C.u.vp0, L(comp.vp0 || '#3a3d46')); gl.uniform3fv(C.u.vp1, L(comp.vp1 || '#24262c'));
    gl.uniform1f(C.u.seed, comp.seed || 1);
    gl.uniform1f(C.u.swooshOn, comp.swoosh ? 1 : 0); gl.uniform4fv(C.u.swoosh, comp.swoosh || [0, 0, 1, 1]);
    await GLK.drawTiled(gl, null, 2);
  }

  function project(s, p, w, h) {
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const nrm = a => { const l = Math.hypot(...a); return a.map(v => v / l); };
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const fw = nrm(sub(s.tgt, s.cam)), rt = nrm(cross(fw, [0, 1, 0])), up = cross(rt, fw);
    const d = sub(p, s.cam); const z = dot(d, fw); const f = 1 / Math.tan(s.fov * Math.PI / 360);
    return [w / 2 + dot(d, rt) / z * f * h / 2, h / 2 - dot(d, up) / z * f * h / 2];
  }
  // 角色局部坐标 → 世界
  function charToWorld(s, q) { const a = s.root[3], c = Math.cos(a), sn = Math.sin(a); const x = c * q[0] - sn * q[2], z = sn * q[0] + c * q[2]; return [x + s.root[0], q[1] + s.root[1], z + s.root[2]]; }

  G.TOON = { render, project, charToWorld, PAL, L };
})(window);
