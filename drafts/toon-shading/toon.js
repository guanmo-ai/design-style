// toon.js v2 — 卡通渲染（三渲二）：光线步进 + 屏幕空间描边 + 撮影后期，WebGL2，无贴图素材
// 原创角色“星野 Hoshi”（约 2.8 头身）：银紫→粉的渐变长双马尾、星星眼、深靛短夹克 + 百褶裙 + 过膝袜 + 厚底鞋、颈挂耳机
// ① 光线步进写 4 张缓冲：成片色 / 法线+深度 / 灰模+材质 / 只有两阶光
// ② 合成：按斜条拼阶段（灰模 → 两阶 → 描边 → 边缘光·天使环·脸影 → 撮影），背景是游戏立绘式的黄昏天空
// ③ 撮影：扩散光（把画面糊一份再“滤色”叠回去）、渐变叠色、光粒、轻微色差——动画成片“贵”的地方都在这一步
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
  // 线段参数（0 在 a，1 在 b）
  float segT(vec3 p, vec3 a, vec3 b){ vec3 ba = b - a; return clamp(dot(p - a, ba) / dot(ba, ba), 0., 1.); }
  float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  vec3 bez(vec3 a, vec3 b, vec3 c, vec3 d, float t){ vec3 ab = mix(a,b,t), bc = mix(b,c,t), cd = mix(c,d,t); return mix(mix(ab,bc,t), mix(bc,cd,t), t); }
  `;

  const FS = `#version 300 es
  precision highp float;
  in vec2 uv;
  layout(location=0) out vec4 o0;
  layout(location=1) out vec4 o1;
  layout(location=2) out vec4 o2;
  layout(location=3) out vec4 o3;
  uniform vec2 res; uniform vec3 cam, tgt; uniform float fov;
  uniform vec4 root;        // 头心位置 + yaw
  uniform float headTilt, swing, flare, peace, expr, lean;
  uniform vec3 L, rimDir;
  uniform vec3 rimCol;
  uniform vec3 cHairT, cHairTS, cHairB, cHairBS, cSkin, cSkinS, cJk, cJkS, cTop, cTopS, cSk, cSkS, cSock, cSockS, cShoe, cShoeS, cAcc, cAccS, cPink, cPinkS, cEye0, cEye1, cEye2;
  ${COMMON}

  vec3 headSurfZ(float x, float y){ return vec3(x, y, .95 * sqrt(max(0., 1. - x*x - y*y / .92))); }

  // —— 头 + 头发（头心在原点）——
  vec2 headD(vec3 h){
    float head = sdEll(h, vec3(1., .97, .95));
    head = smin(head, sdEll(h - vec3(0., -.42, .2), vec3(.66, .53, .6)), .3);
    vec2 r = vec2(head, 1.);
    float cap = sdEll(h - vec3(0., .1, -.07), vec3(1.1, 1.08, 1.09));
    float cut = sdEll(h - vec3(0., -.5, .8), vec3(1.0, .84, .78));
    float hair = smax(cap, -cut, .05);
    // 后面的头发：披到肩
    hair = smin(hair, sdEll(h - vec3(0., -.5, -.38), vec3(1.06, .92, .72)), .2);
    // 刘海：7 簇，每簇从发旋附近出发，鼓出额头再收成尖；中间一簇最短，眼睛之间夹一簇
    for (int i = 0; i < 9; i++) {
      float fi = float(i), x = -.84 + fi * .21;
      float tip = .06 + .14 * fract(fi * .377 + .2) - (i == 4 ? .14 : 0.) - (i == 3 || i == 5 ? .05 : 0.) + (i == 0 || i == 8 ? -.22 : 0.);
      float lean = x * .12 + (fract(fi * .618) - .5) * .1;
      vec3 a = vec3(x * .5, .95, .35);
      vec3 m = headSurfZ(x * .92, .48) + vec3(0., 0., .1);
      vec3 b = headSurfZ(clamp(x + lean, -.93, .93), tip) + vec3(0., 0., .04);
      float cl = smin(sdRC(h, a, m, .17, .19), sdRC(h, m, b, .19, .01), .07);
      hair = smin(hair, cl, .025);
    }
    // 鬓角：长到胸前，尾巴往里卷一点
    vec3 hs = vec3(abs(h.x), h.yz);
    float side = min(sdRC(hs, vec3(.84, .45, .32), vec3(.94, -.3, .44), .24, .17), sdRC(hs, vec3(.94, -.3, .44), vec3(.84, -1.15, .5), .17, .03));
    hair = smin(hair, side, .05);
    // 双马尾：一把粗的 S 形，到尾巴分出两小绺；转身时甩向同一边
    float tails = 50.;
    for (int s = 0; s < 2; s++) {
      float sg = s == 0 ? -1. : 1.;
      float sw = swing * (s == 0 ? 1.3 : .75);
      vec3 p0 = vec3(sg * 1.0, .42, -.38);
      vec3 c1 = vec3(sg * 1.8 - sw * .3, .3 + sw * .1, -.5 - sw * .3);
      vec3 c2 = vec3(sg * 1.7 - sw * .9, -1.15 + sw * .35, -.35 - sw * .6);
      vec3 p3 = vec3(sg * 1.2 - sw * 1.6, -2.5 + sw * .9, -.1 - sw * .9);
      float bb = sdRC(h, p0, mix(c2, p3, .5), .9, .7);
      if (bb < .3) {
        vec3 prev = p0; float rp = .27;
        for (int k = 1; k <= 14; k++) {
          float u = float(k) / 14.;
          vec3 pt = bez(p0, c1, c2, p3, u);
          float rr = mix(.28, .012, pow(u, 1.25)) + .14 * sin(u * 3.1416) * (1. - u * .55);
          tails = smin(tails, sdRC(h, prev, pt, rp, rr), .06);
          prev = pt; rp = rr;
        }
      }
      float tie = length(vec2(length((h - p0).yz) - .2, (h - p0).x * 2.2)) * .45 - .03;
      if (tie < r.x) r = vec2(tie, 9.);
      float clip = length(h - vec3(sg * 1.02, .62, -.18)) - .13;
      if (clip < r.x) r = vec2(clip, 8.);
    }
    hair = smin(hair, tails, .08);
    // 呆毛
    vec3 q0 = vec3(.02, 1.02, .1), q1 = vec3(.08, 1.36, .14), q2 = vec3(.28, 1.6, .18), q3 = vec3(.52, 1.56, .22), q4 = vec3(.62, 1.4, .25);
    float ah = smin(smin(sdRC(h, q0, q1, .08, .06), sdRC(h, q1, q2, .06, .045), .03), smin(sdRC(h, q2, q3, .045, .03), sdRC(h, q3, q4, .03, .008), .02), .02);
    hair = smin(hair, ah, .03);
    if (hair < r.x) r = vec2(hair, 2.);
    return r;
  }

  // 角色局部坐标：头心在原点，脚底大约 y = -4.45
  vec2 chara(vec3 p){
    vec3 h = p; h.xy = rot(headTilt) * h.xy;
    vec2 r = headD(h);
    vec3 b = p; b.yz = rot(lean) * (b.yz - vec2(-1.8, 0.)) + vec2(-1.8, 0.);   // 身体往后仰一点
    float neck = sdCap(b, vec3(0., -.75, -.02), vec3(0., -1.18, 0.), .14);
    if (neck < r.x) r = vec2(neck, 1.);
    // 夹克 + 内搭：胸 + 腰
    float chest = sdEll(b - vec3(0., -1.55, 0.), vec3(.5, .44, .34));
    float waist = sdEll(b - vec3(0., -2.0, .0), vec3(.37, .36, .28));
    float torso = smin(chest, waist, .22);
    // 立领
    float col = length(vec2(length(b.xz * vec2(1., 1.15)) - .25, b.y + 1.17)) - .07;
    torso = smin(torso, col, .05);
    if (torso < r.x) r = vec2(torso, 3.);
    // 袖子（夹克的长袖，蓬一点）+ 手
    vec3 sR0 = vec3(.48, -1.36, 0.), sR1 = mix(vec3(.72, -1.75, .06), vec3(.86, -1.62, .32), peace), sR2 = mix(vec3(.76, -2.15, .12), vec3(.72, -1.12, .8), peace);
    vec3 sL0 = vec3(-.48, -1.36, 0.), sL1 = vec3(-.9, -1.6, .06), sL2 = vec3(-1.26, -1.82, .2);
    float sl = smin(sdRC(b, sL0, sL1, .18, .2), sdRC(b, sL1, sL2, .2, .17), .05);
    float sr = smin(sdRC(b, sR0, sR1, .18, .2), sdRC(b, sR1, sR2, .2, .17), .05);
    float sleeves = min(sl, sr);
    if (sleeves < r.x) r = vec2(sleeves, 3.);
    vec3 hL = sL2 + vec3(-.12, -.04, .03);
    vec3 hR = sR2 + mix(vec3(0., -.12, .02), vec3(-.02, .12, .04), peace);
    float hands = min(sdEll(b - hL, vec3(.12, .1, .1)), sdEll(b - hR, vec3(.11, .12, .1)));
    hands = min(hands, sdCap(b, hR, hR + vec3(-.1, .3, .1) * peace, .048));
    hands = min(hands, sdCap(b, hR, hR + vec3(.1, .3, .08) * peace, .048));
    for (int k = 0; k < 3; k++) hands = min(hands, sdCap(b, hL, hL + vec3(-.16, .03 - float(k) * .06, .02), .035));
    if (hands < r.x) r = vec2(hands, 1.);
    // 耳机挂在脖子上
    float hp = length(vec2(length((b - vec3(0., -1.08, .02)).xz * vec2(1., 1.05)) - .34, b.y + 1.08 + .12 * b.z)) - .045;
    vec3 bc = vec3(abs(b.x), b.yz);
    float cups = sdEll(bc - vec3(.36, -1.12, .1), vec3(.09, .15, .15));
    if (hp < r.x) r = vec2(hp, 8.);
    if (cups < r.x) r = vec2(cups, 9.);
    // 百褶裙：腰 → 下摆，下摆被转身甩开
    float yt = clamp((-2.08 - b.y) / .72, 0., 1.);
    vec2 sw = vec2(-swing * .22, -swing * .12) * yt * yt;
    vec2 q = b.xz - sw;
    float ang = atan(q.y, q.x);
    float pleat = abs(fract(ang * 14. / (2. * PI) + flare * .2) - .5) * 2.;
    float rad = mix(.37, .76 + flare * .1, yt) + .04 * pleat * yt;
    float skirt = (length(q) - rad) * .85;
    skirt = smax(skirt, b.y + 2.06, .03);
    skirt = smax(skirt, -2.82 - b.y + .02 * pleat - flare * .08 * (q.x * .5 + .5), .02);
    skirt = smax(skirt, -(length(q) - rad + .05), .0);
    if (skirt < r.x) r = vec2(skirt, 5.);
    // 腿：右腿直，左腿往后勾
    vec3 kR = vec3(.17, -3.36, .05), aR = vec3(.17, -4.12, .02);
    vec3 kL = vec3(-.2, -3.22, -.2), aL = vec3(-.24, -3.66, -.78);
    vec3 hipR = vec3(.16, -2.5, 0.), hipL = vec3(-.16, -2.5, 0.);
    float legR = smin(sdRC(b, hipR, kR, .16, .12), sdRC(b, kR, aR, .12, .075), .04);
    float legL = smin(sdRC(b, hipL, kL, .16, .12), sdRC(b, kL, aL, .12, .075), .04);
    float legs = min(legR, legL);
    if (legs < r.x) {
      // 过膝袜：膝盖往上一点就是袜口
      float tR = segT(b, hipR, kR), tL = segT(b, hipL, kL);
      float sock = (legR < legL ? tR : tL) > .62 || (legR < legL ? b.y < kR.y : b.y < kL.y + .01) ? 1. : 0.;
      r = vec2(legs, sock > .5 ? 6. : 1.);
    }
    // 厚底鞋
    float shR = sdEll(b - (aR + vec3(0., -.12, .1)), vec3(.13, .1, .22));
    shR = smin(shR, sdEll(b - (aR + vec3(0., -.24, .12)), vec3(.15, .06, .25)), .03);
    vec3 fl = b - (aL + vec3(0., -.06, -.16)); fl.yz = rot(-1.0) * fl.yz;
    float shL = smin(sdEll(fl, vec3(.13, .1, .22)), sdEll(fl - vec3(0., -.12, .02), vec3(.15, .06, .25)), .03);
    float shoes = min(shR, shL);
    if (shoes < r.x) r = vec2(shoes, 7.);
    return r;
  }

  vec3 toChar(vec3 p){ vec3 q = p - root.xyz; q.xz = rot(root.w) * q.xz; return q; }
  vec3 fromCharN(vec3 n){ n.xz = rot(-root.w) * n.xz; return n; }
  vec2 map(vec3 p){
    vec3 q = toChar(p);
    float bnd = length(q - vec3(-.2, -1.6, -.3)) - 3.6;
    if (bnd > .3) return vec2(bnd, 0.);
    return chara(q);
  }
  vec3 nrm(vec3 p){ vec2 e = vec2(.0012, 0.); return normalize(vec3(map(p+e.xyy).x-map(p-e.xyy).x, map(p+e.yxy).x-map(p-e.yxy).x, map(p+e.yyx).x-map(p-e.yyx).x)); }
  float hardShadow(vec3 ro, vec3 rd){ float t = .03; for (int i = 0; i < 70; i++){ float h = map(ro + rd * t).x; if (h < .002) return 0.; t += clamp(h, .01, .35); if (t > 9.) break; } return 1.; }
  float ao(vec3 p, vec3 n){ float s = 0., w = 1.; for (int i = 1; i <= 5; i++){ float h = .05 * float(i); s += w * (h - map(p + n * h).x); w *= .65; } return clamp(1. - 2.2 * s, 0., 1.); }

  // —— 画在脸上的五官 ——
  float star4(vec2 p, float r){ p = abs(p); return (p.x * p.y < r * r * .02 ? 1. : 0.) * step(p.x + p.y, r) ; }
  vec4 faceArt(vec3 h){
    if (h.z < .25) return vec4(0.);
    float u = h.x, v = h.y;
    vec4 c = vec4(0.);
    vec2 bq = vec2(abs(u) - .55, v + .42);
    float bl = length(bq / vec2(.17, .075));
    float hatch = step(.55, fract((abs(u) * .7 - v) * 26.));
    c = mix(c, vec4(1., .5, .6, 1.), smoothstep(1., .7, bl) * (.3 + .4 * hatch));
    float side = sign(u);
    vec2 e = vec2(abs(u) - .36, v + .13);
    if (expr < .5) {
      float ed = length(e / vec2(.2, .255));
      float m = smoothstep(1.02, .97, ed);
      vec4 ec = vec4(1.);
      vec2 ie = vec2(e.x + side * .012, e.y + .02);
      float id = length(ie / vec2(.155, .21));
      // 虹膜：上深蓝 → 中间水蓝 → 下面一抹粉
      vec3 irisC = mix(cEye2, cEye1, smoothstep(-.21, -.02, ie.y));
      irisC = mix(irisC, cEye0, smoothstep(-.02, .16, ie.y));
      irisC = mix(irisC, cEye0 * .5, smoothstep(.93, 1., id));
      ec.rgb = mix(ec.rgb, irisC, smoothstep(1.03, .97, id));
      float pd = length((ie - vec2(0., .02)) / vec2(.06, .1));
      ec.rgb = mix(ec.rgb, cEye0 * .35, smoothstep(1.05, .95, pd));
      // 星星高光（两只眼同一边）+ 一颗小圆点
      vec2 hp = vec2(u - side * .36, v + .13);
      vec2 sp = hp - vec2(-.06, .07); sp = rot(.2) * sp;
      float st = smoothstep(.0, -.012, max(abs(sp.x) * 1. + abs(sp.y) * .35, abs(sp.y) * 1. + abs(sp.x) * .35) - .055);
      float h2 = smoothstep(1.1, .85, length((hp - vec2(.065, -.11)) / vec2(.028, .028)));
      float h3 = smoothstep(1.1, .85, length((hp - vec2(-.02, -.14)) / vec2(.06, .02))) * .5;
      ec.rgb = mix(ec.rgb, vec3(1.), max(max(st, h2), h3));
      c = mix(c, ec, m);
      // 睫毛：上沿一条粗弧，外眼角翘两根
      float top = smoothstep(.0, .02, e.y + .02);
      float lash = smoothstep(1.22, 1.12, ed) * smoothstep(.9, .98, ed) * top;
      float w1 = smoothstep(.03, .015, abs(e.y - .17 - (e.x - .17) * .9)) * step(.15, e.x) * step(e.x, .27);
      float w2 = smoothstep(.022, .01, abs(e.y - .08 - (e.x - .2) * .35)) * step(.19, e.x) * step(e.x, .29);
      c = mix(c, vec4(.14, .08, .2, 1.), clamp(max(lash, max(w1, w2)), 0., 1.));
      float low = smoothstep(.02, .0, abs(ed - 1.04)) * step(e.y, -.17) * step(.03, e.x);
      c = mix(c, vec4(.32, .17, .28, 1.), low * .8);
    } else {
      float arc = abs(length(vec2(e.x, e.y + .12)) - .16);
      float m = smoothstep(.03, .016, arc) * step(-.03, e.y);
      c = mix(c, vec4(.14, .08, .2, 1.), m);
    }
    // 嘴：张开的笑 + 一颗小虎牙
    vec2 mo = vec2(u - .02, v + .6);
    float md = length(mo / vec2(.11, .09));
    float mm = smoothstep(1.05, .95, md) * step(mo.y, .012);
    vec3 mc = mix(vec3(.55, .12, .22), vec3(1., .52, .58), smoothstep(-.03, -.08, mo.y));
    c = mix(c, vec4(mc, 1.), mm);
    float fang = step(abs(mo.x - .045), .018 * (1. - (-mo.y) / .03)) * step(mo.y, .012) * step(-.03, mo.y);
    c = mix(c, vec4(1.), fang * mm);
    float ml = smoothstep(.02, .0, abs(md - 1.)) * step(mo.y, .015);
    c = mix(c, vec4(.36, .1, .16, 1.), ml * .9);
    return c;
  }

  void main(){
    vec2 sp = (uv - .5) * vec2(res.x / res.y, 1.) * 2.;
    vec3 fw = normalize(tgt - cam), rt = normalize(cross(fw, vec3(0,1,0))), up = cross(rt, fw);
    vec3 rd = normalize(fw / tan(fov * .5) + rt * sp.x + up * sp.y);
    float t = 0.; vec2 h; bool hit = false;
    for (int i = 0; i < 220; i++){ h = map(cam + rd * t); if (h.x < .0005 * t) { hit = true; break; } t += h.x * .9; if (t > 50.) break; }
    if (!hit) { o0 = vec4(0.); o1 = vec4(0., 0., 0., 1e4); o2 = vec4(0.); o3 = vec4(0.); return; }
    vec3 p = cam + rd * t;
    vec3 n = nrm(p);
    float mat = h.y;
    vec3 Ln = normalize(L);
    float ndl = dot(n, Ln);
    float ndv = clamp(dot(n, -rd), 0., 1.);
    float sh = (mat > 1.5 && mat < 2.5) ? 1. : hardShadow(p + n * .012, Ln);
    float oc = ao(p, n);
    vec3 q = toChar(p);
    vec3 hq = q; hq.xy = rot(headTilt) * hq.xy;
    vec3 bq = q; bq.yz = rot(lean) * (bq.yz - vec2(-1.8, 0.)) + vec2(-1.8, 0.);
    vec3 base, shade;
    if (mat < 1.5) { base = cSkin; shade = cSkinS; }
    else if (mat < 2.5) {
      // 渐变发色：头顶银紫 → 发尾粉
      float g = smoothstep(.2, -2.2, hq.y);
      base = mix(cHairT, cHairB, g); shade = mix(cHairTS, cHairBS, g);
    }
    else if (mat < 3.5) {
      base = cJk; shade = cJkS;
      // 前襟敞开露出白色内搭；夹克包边是黄的
      float open = .1 + .07 * (-1.2 - bq.y);
      if (bq.z > .05 && abs(bq.x) < open && bq.y < -1.25 && bq.y > -2.3) { base = cTop; shade = cTopS; }
      if (bq.z > .05 && abs(abs(bq.x) - open) < .028 && bq.y < -1.25 && bq.y > -2.3) { base = cAcc; shade = cAccS; }
      if (abs(bq.y + 2.22) < .05 && bq.y < -1.3) { base = cAcc; shade = cAccS; }
      // 袖口
      vec3 sR2 = mix(vec3(.76, -2.15, .12), vec3(.72, -1.12, .8), peace), sL2 = vec3(-1.26, -1.82, .2);
      if (min(length(bq - sR2), length(bq - sL2)) < .2) { base = cAcc; shade = cAccS; }
      // 胸口的星星徽章
      vec2 s2 = bq.xy - vec2(-.3, -1.5);
      float a = atan(s2.x, s2.y), rr = length(s2);
      if (bq.z > 0. && rr - .055 - .045 * pow(abs(cos(a * 2.5)), 3.) < 0.) { base = cAcc; shade = cAccS; }
    }
    else if (mat < 5.5) {
      base = cSk; shade = cSkS;
      if (bq.y < -2.72) { base = cTop; shade = cTopS; }           // 下摆一圈白线
    }
    else if (mat < 6.5) { base = cSock; shade = cSockS; }
    else if (mat < 7.5) { base = cShoe; shade = cShoeS; if (bq.y < -4.2 || (bq.z < -.5 && bq.y < -3.6)) { base = cTop; shade = cTopS; } }
    else if (mat < 8.5) { base = cAcc; shade = cAccS; }
    else { base = cPink; shade = cPinkS; }
    // —— 两阶光 ——
    if (mat > 1.5 && mat < 2.5) {
      // 头发：用“大形”的法线算明暗（像画师先想好一整块头发的明暗，再画发丝），不然每一簇都会自己脏一块
      vec3 hn = normalize(hq - vec3(0., .1, -.07));
      hn.xy = rot(-headTilt) * hn.xy; hn = fromCharN(hn);
      float far = smoothstep(1.25, 1.6, length(hq - vec3(0., .1, -.07)));
      ndl = dot(normalize(mix(n, hn, .75 * (1. - far))), Ln);
    }
    float lam = ndl * .5 + .5;
    float thr = mat < 1.5 ? .43 : (mat < 2.5 ? .5 : .47);
    float lit = smoothstep(thr - .012, thr + .012, lam) * sh;
    vec4 fa = vec4(0.);
    bool isFace = mat < 1.5 && hq.z > .2 && hq.y < .5 && hq.y > -1. && length(hq) < 1.2;
    if (isFace) {
      vec3 Lh = Ln; Lh.xz = rot(root.w) * Lh.xz; Lh.xy = rot(headTilt) * Lh.xy;
      float side = sign(Lh.x);
      float far = -side * hq.x;
      float bnd = .8 - .35 * abs(Lh.x) + .12 * hq.y * hq.y + .05 * (hq.y + .3);
      lit = smoothstep(bnd + .008, bnd - .008, far) * sh;
      fa = faceArt(hq);
    }
    // 暗面不是一个平色：靠近交界处稍亮一点（动画里的“二影”反过来用）
    vec3 shadeG = mix(shade, mix(shade, base, .25), smoothstep(thr - .2, thr, lam));
    vec3 ramp = mix(shadeG, base, lit);
    vec3 col = ramp;
    vec3 nv = vec3(dot(n, rt), dot(n, up), dot(n, -fw));
    // 天使环
    if (mat > 1.5 && mat < 2.5) {
      float az = atan(hq.x, hq.z);
      float ry = .66 + .05 * abs(sin(az * 7.)) - .02 * cos(az);
      float ring = smoothstep(.07, .048, abs(hq.y - ry)) * smoothstep(-.1, .3, hq.z) * smoothstep(.5, .7, ndv + .3);
      col = mix(col, mix(base, vec3(1.), .8), ring * (.55 + .45 * lit));
      // 发丝：几根细细的暗线
    }
    // 边缘光：从右后方来，屏幕空间一圈
    float rim = smoothstep(.58, .62, 1. - ndv) * smoothstep(.0, .3, dot(nv.xy, normalize(rimDir.xy)));
    col = mix(col, rimCol, rim * .9);
    if (mat > 6.5 && mat < 7.5) { vec3 hv = normalize(Ln - rd); col = mix(col, vec3(1.), step(.96, dot(n, hv)) * .9); }
    col = mix(col, fa.rgb, fa.a);
    ramp = mix(ramp, fa.rgb, fa.a);
    float grey = (.14 + .72 * max(ndl, 0.) * mix(.35, 1., sh)) * mix(.45, 1., oc) + .07 * (n.y * .5 + .5);
    float depth = dot(p - cam, fw);
    o0 = vec4(col, 1.);
    o1 = vec4(nv, depth);
    o2 = vec4(grey, mat, 1., isFace ? 1. : 0.);
    o3 = vec4(ramp, 1.);
  }`;

  // —— 合成：背景 + 阶段 + 描边 → 一张图 ——
  const FS_COMP = `#version 300 es
  precision highp float;
  in vec2 uv; out vec4 o;
  uniform sampler2D t0, t1, t2, t3, txt;
  uniform vec2 res; uniform float px;
  uniform vec4 strips; uniform vec2 sdir; uniform float stageAll;
  uniform vec3 sky0, sky1, sky2, sky3, vp0, vp1, halo;
  uniform vec2 haloC; uniform float haloR, txtOn;
  ${COMMON}
  float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(hash21(i), hash21(i+vec2(1,0)), f.x), mix(hash21(i+vec2(0,1)), hash21(i+vec2(1,1)), f.x), f.y); }
  uniform float bandX;
  float stageAt(vec2 cpx){ float sx = dot(cpx - strips.xy, sdir); if (cpx.x < bandX) return strips.w; return stageAll > 0. ? stageAll : clamp(floor(sx / strips.z) + 1., 1., strips.w); }
  // 游戏立绘式背景：黄昏渐变 + 大光环 + 斜光 + 一排动画云 + 巨型名字
  vec3 splash(vec2 cpx){
    vec2 f = cpx / (res / px);
    vec3 c = mix(sky0, sky1, smoothstep(.0, .45, f.y));
    c = mix(c, sky2, smoothstep(.4, .78, f.y));
    c = mix(c, sky3, smoothstep(.75, 1., f.y));
    float d = length(cpx - haloC);
    c = mix(c, halo, smoothstep(haloR * 1.15, haloR * .2, d) * .55);
    c = mix(c, halo * 1.05, smoothstep(2., 0., abs(d - haloR)) * .5);
    c = mix(c, halo, smoothstep(1.2, 0., abs(d - haloR * 1.18)) * .25);
    // 斜着的几道光
    float ray = sin((cpx.x * .8 + cpx.y * .45) * .012) * .5 + .5;
    c += vec3(1., .9, .85) * smoothstep(.85, 1., ray) * .06 * (1. - f.y);
    // 巨型名字（在角色后面）
    if (txtOn > 0.) { vec4 tx = texture(txt, vec2(f.x, f.y)); c = mix(c, tx.rgb, tx.a); }
    return c;
  }
  vec3 viewport(vec2 cpx){
    vec3 c = mix(vp1, vp0, uv.y);
    vec2 g = abs(fract(cpx / 48.) - .5) * 48.; c += smoothstep(1., 0., min(g.x, g.y)) * .045;
    vec2 g2 = abs(fract(cpx / 240.) - .5) * 240.; c += smoothstep(1., 0., min(g2.x, g2.y)) * .05;
    return c;
  }
  void main(){
    vec2 cpx = vec2(uv.x * res.x, (1. - uv.y) * res.y) / px;
    float stage = stageAt(cpx);
    vec4 a0 = texture(t0, uv), a1 = texture(t1, uv), a2 = texture(t2, uv), a3 = texture(t3, uv);
    bool hit = a1.w < 1e3;
    vec3 col = stage < 1.5 ? viewport(cpx) : (stage < 2.5 ? mix(splash(cpx), vec3(dot(splash(cpx), vec3(.33))), .65) : splash(cpx));
    if (hit) {
      if (stage < 1.5) col = vec3(a2.x) * vec3(.95, .96, 1.);
      else if (stage < 3.5) col = a3.rgb;
      else col = a0.rgb;
    }
    if (stage > 2.5) {
      float r = 1.5 * px, e = 0.;
      float dc = hit ? a1.w : 1e4;
      vec3 lineC = hit ? a3.rgb * vec3(.3, .24, .4) : vec3(.12, .08, .2);
      for (int i = 0; i < 8; i++){
        float an = float(i) * PI / 4.;
        vec2 off = vec2(cos(an), sin(an)) * r / res;
        vec4 b1 = texture(t1, uv + off), b2 = texture(t2, uv + off);
        float db = b1.w < 1e3 ? b1.w : 1e4;
        e = max(e, smoothstep(.02, .05, abs(db - dc) / min(db, dc)));
        if (hit && b1.w < 1e3) {
          e = max(e, smoothstep(.55, .35, dot(b1.xyz, a1.xyz)) * .85);
          if (abs(b2.y - a2.y) > .5 && !(a2.y < 1.5 && b2.y < 1.5)) e = max(e, .8);
        }
        if (!hit && b1.w < 1e3) lineC = texture(t3, uv + off).rgb * vec3(.3, .24, .4);
      }
      col = mix(col, lineC, e);
    }
    o = vec4(col, stage);
  }`;

  const FS_BLUR = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform sampler2D src; uniform vec2 dir;
  void main(){ vec3 s = vec3(0.); float w[7] = float[](0.1964,0.1747,0.1210,0.0656,0.0277,0.0091,0.0024);
    s += texture(src, uv).rgb*w[0];
    for(int i=1;i<7;i++){ s += texture(src, uv+dir*float(i)).rgb*w[i]; s += texture(src, uv-dir*float(i)).rgb*w[i]; }
    o = vec4(s,1.); }`;

  // —— 撮影：只在第 5 阶段加 ——
  const FS_FINAL = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform sampler2D X, Y, Z; uniform vec2 res; uniform float px, seed, diffuse;
  uniform vec4 strips; uniform vec2 sdir; uniform float stageAll;
  uniform vec3 gradA, gradB; uniform float bandX;
  ${COMMON}
  void main(){
    vec4 x = texture(X, uv);
    vec3 col = x.rgb; float stage = x.a;
    vec2 cpx = vec2(uv.x * res.x, (1. - uv.y) * res.y) / px;
    if (stage > 3.5) {
      // 轻微色差
      vec2 d = (uv - .5) * .0016;
      col = vec3(texture(X, uv + d).r, col.g, texture(X, uv - d).b);
      vec3 bl = texture(Y, uv).rgb * .55 + texture(Z, uv).rgb * .45;
      // 扩散光：把糊的那份“滤色”叠回去，亮的地方晕开
      vec3 glow = max(bl - .55, 0.) * 1.1;
      col = 1. - (1. - col) * (1. - glow * diffuse);
      col = mix(col, max(col, bl), .08 * diffuse);
      // 渐变叠色：左上暖、右下冷（柔光）
      vec2 f = cpx / (res / px);
      vec3 g = mix(gradA, gradB, clamp(f.x * .6 + f.y * .6 - .1, 0., 1.));
      vec3 sl = mix(2. * col * g, 1. - 2. * (1. - col) * (1. - g), step(vec3(.5), col));
      col = mix(col, sl, .25);
      // 光粒：几颗大的虚焦光斑 + 很多小亮点
      for (int i = 0; i < 18; i++) {
        float fi = float(i);
        vec2 c = vec2(hash21(vec2(fi, 1.3)), hash21(vec2(fi, 7.1))) * (res / px);
        float r = 4. + 26. * pow(hash21(vec2(fi, 3.3)), 3.);
        float dd = length(cpx - c);
        col += vec3(1., .92, .8) * smoothstep(r, r * .7, dd) * (.06 + .1 * hash21(vec2(fi, 9.)));
      }
      vec2 cell = floor(cpx / 22.);
      float h = hash21(cell);
      if (h > .965) { vec2 cc = (cell + .5) * 22.; vec2 dp = abs(cpx - cc); float sz = 2. + 5. * hash21(cell + 2.); col += vec3(1.) * (smoothstep(1.2, 0., dp.x) * smoothstep(sz, 0., dp.y) + smoothstep(1.2, 0., dp.y) * smoothstep(sz, 0., dp.x)) * .8; }
    }
    // 斜条分界线
    if (stageAll <= 0.) {
      float sx = dot(cpx - strips.xy, sdir);
      float fx = fract(sx / strips.z) * strips.z; float edge = min(fx, strips.z - fx);
      if (sx > strips.z * .5 && sx < strips.z * (strips.w - .5) && cpx.x > bandX) col = mix(col, vec3(1.), smoothstep(1.6, .4, edge) * .9);
      if (cpx.x > bandX && sx < strips.z * (strips.w - 1.)) col = mix(col, vec3(1.), smoothstep(1.4, .3, abs(cpx.x - bandX)) * .9);
    }
    col = pow(clamp(col, 0., 1.), vec3(1. / 2.2));
    col += (hash21(uv * res + seed) - .5) * .01;
    o = vec4(col, 1.);
  }`;

  function mrt(gl, w, h, n) {
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    const tex = [];
    for (let i = 0; i < n; i++) { const t = GLK.texture(gl, w, h, { internal: gl.RGBA32F, format: gl.RGBA, type: gl.FLOAT, filter: gl.NEAREST }); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0); tex.push(t); }
    gl.drawBuffers(tex.map((_, i) => gl.COLOR_ATTACHMENT0 + i));
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('mrt incomplete');
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fb, tex, w, h };
  }
  const hex = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
  const L = h => hex(h).map(v => Math.pow(v, 2.2));
  const PAL = {
    hairT: '#e2dcff', hairTS: '#9a8ae6', hairB: '#ffa6d4', hairBS: '#d8609e', skin: '#ffeee4', skinS: '#f4b0aa',
    jk: '#2e3366', jkS: '#1a1c3c', top: '#ffffff', topS: '#b8c3ef', sk: '#3d4382', skS: '#232655',
    sock: '#ffffff', sockS: '#bcc6ee', shoe: '#ff6f9c', shoeS: '#c43c72', acc: '#ffd23f', accS: '#f08a2c', pink: '#ff8fbf', pinkS: '#d4528c',
    eye0: '#25307e', eye1: '#4fc7ff', eye2: '#ffb3dc', rim: '#ffe9f4',
  };
  const PMAP = { cHairT: 'hairT', cHairTS: 'hairTS', cHairB: 'hairB', cHairBS: 'hairBS', cSkin: 'skin', cSkinS: 'skinS', cJk: 'jk', cJkS: 'jkS', cTop: 'top', cTopS: 'topS', cSk: 'sk', cSkS: 'skS', cSock: 'sock', cSockS: 'sockS', cShoe: 'shoe', cShoeS: 'shoeS', cAcc: 'acc', cAccS: 'accS', cPink: 'pink', cPinkS: 'pinkS', cEye0: 'eye0', cEye1: 'eye1', cEye2: 'eye2', rimCol: 'rim' };

  // 巨型名字的纹理
  function nameTex(W, H, text, x, y, size) {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    g.font = `900 ${size}px Unbounded`; g.textBaseline = 'alphabetic';
    g.lineWidth = Math.max(1.5, size / 110); g.strokeStyle = 'rgba(255,255,255,.42)'; g.strokeText(text, x, y);
    g.fillStyle = 'rgba(255,255,255,.07)'; g.fillText(text, x, y);
    return c;
  }

  async function render(gl, s, comp) {
    const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
    gl.getExtension('EXT_color_buffer_float');
    const P = GLK.program(gl, FS), C = GLK.program(gl, FS_COMP), B = GLK.program(gl, FS_BLUR), F = GLK.program(gl, FS_FINAL);
    const Gb = mrt(gl, W, H, 4);
    gl.useProgram(P);
    gl.uniform2f(P.u.res, W, H);
    gl.uniform3fv(P.u.cam, s.cam); gl.uniform3fv(P.u.tgt, s.tgt); gl.uniform1f(P.u.fov, s.fov * Math.PI / 180);
    gl.uniform4fv(P.u.root, s.root);
    for (const k of ['headTilt', 'swing', 'flare', 'peace', 'expr', 'lean']) gl.uniform1f(P.u[k], s[k] ?? (k === 'peace' ? 1 : 0));
    gl.uniform3fv(P.u.L, s.light || [-0.6, 0.72, 0.6]); gl.uniform3fv(P.u.rimDir, s.rimDir || [1, .35, 0]);
    const pal = Object.assign({}, PAL, s.pal || {});
    for (const k in PMAP) gl.uniform3fv(P.u[k], L(pal[PMAP[k]]));
    gl.bindFramebuffer(gl.FRAMEBUFFER, Gb.fb); gl.drawBuffers([0, 1, 2, 3].map(i => gl.COLOR_ATTACHMENT0 + i));
    gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.SCISSOR_TEST);
    const tiles = s.tiles || 8, tw = Math.ceil(W / tiles), th = Math.ceil(H / tiles);
    for (let y = 0; y < tiles; y++) for (let x = 0; x < tiles; x++) { gl.scissor(x * tw, y * th, tw, th); gl.bindVertexArray(gl._tri); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.finish(); await GLK.tick(); }
    gl.disable(gl.SCISSOR_TEST);
    // 合成 → X
    const X = GLK.fbo(gl, W, H, gl.RGBA16F);
    gl.useProgram(C);
    Gb.tex.forEach((t, i) => GLK.bindTex(gl, C, 't' + i, t, i));
    const cssW = W / comp.px, cssH = H / comp.px;
    const tc = comp.name ? nameTex(cssW, cssH, comp.name.text, comp.name.x, comp.name.y, comp.name.size) : document.createElement('canvas');
    const tt = gl.createTexture(); gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, tt);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tc);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(C.u.txt, 4); gl.uniform1f(C.u.txtOn, comp.name ? 1 : 0);
    gl.uniform2f(C.u.res, W, H); gl.uniform1f(C.u.px, comp.px);
    gl.uniform4fv(C.u.strips, comp.strips || [0, 0, 1e5, 1]); gl.uniform2fv(C.u.sdir, comp.sdir || [1, 0]); gl.uniform1f(C.u.stageAll, comp.stageAll || 0); gl.uniform1f(C.u.bandX, comp.bandX ?? -1);
    const bg = Object.assign({ sky0: '#232c74', sky1: '#6d5ac8', sky2: '#ff9dbb', sky3: '#ffd9ae', vp0: '#3a3d46', vp1: '#24262c', halo: '#fff2d8' }, comp.bg || {});
    for (const k of ['sky0', 'sky1', 'sky2', 'sky3', 'vp0', 'vp1', 'halo']) gl.uniform3fv(C.u[k], L(bg[k]));
    gl.uniform2fv(C.u.haloC, comp.halo || [cssW * .5, cssH * .3]); gl.uniform1f(C.u.haloR, comp.haloR || 260);
    await GLK.drawTiled(gl, X, 2);
    // 糊两份（1/4、1/8）
    const mkBlur = async (scale, rad) => {
      const a = GLK.fbo(gl, Math.ceil(W / scale), Math.ceil(H / scale)), b = GLK.fbo(gl, a.w, a.h);
      gl.useProgram(B);
      GLK.bindTex(gl, B, 'src', X.tex, 0); gl.uniform2f(B.u.dir, rad / a.w, 0); GLK.draw(gl, b);
      GLK.bindTex(gl, B, 'src', b.tex, 0); gl.uniform2f(B.u.dir, 0, rad / a.h); GLK.draw(gl, a);
      GLK.bindTex(gl, B, 'src', a.tex, 0); gl.uniform2f(B.u.dir, rad / a.w, 0); GLK.draw(gl, b);
      GLK.bindTex(gl, B, 'src', b.tex, 0); gl.uniform2f(B.u.dir, 0, rad / a.h); GLK.draw(gl, a);
      gl.finish(); await GLK.tick(); return a;
    };
    const Y = await mkBlur(4, 1.6), Z = await mkBlur(10, 2.2);
    gl.useProgram(F);
    GLK.bindTex(gl, F, 'X', X.tex, 0); GLK.bindTex(gl, F, 'Y', Y.tex, 1); GLK.bindTex(gl, F, 'Z', Z.tex, 2);
    gl.uniform2f(F.u.res, W, H); gl.uniform1f(F.u.px, comp.px); gl.uniform1f(F.u.seed, 1.7); gl.uniform1f(F.u.diffuse, comp.diffuse ?? 1);
    gl.uniform4fv(F.u.strips, comp.strips || [0, 0, 1e5, 1]); gl.uniform2fv(F.u.sdir, comp.sdir || [1, 0]); gl.uniform1f(F.u.stageAll, comp.stageAll || 0); gl.uniform1f(F.u.bandX, comp.bandX ?? -1);
    gl.uniform3fv(F.u.gradA, L(comp.gradA || '#ffd2a8')); gl.uniform3fv(F.u.gradB, L(comp.gradB || '#8aa0ff'));
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
  function charToWorld(s, q) { const a = s.root[3], c = Math.cos(a), sn = Math.sin(a); const x = c * q[0] - sn * q[2], z = sn * q[0] + c * q[2]; return [x + s.root[0], q[1] + s.root[1], z + s.root[2]]; }

  G.TOON = { render, project, charToWorld, PAL, L };
})(window);
