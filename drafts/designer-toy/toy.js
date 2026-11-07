// toy.js — 潮玩（搪胶公仔）的光线步进渲染器，WebGL2，无贴图素材
// 一只原创角色“小菇 MOGU”：蘑菇帽 + 圆脸 + 豆子身体。四种材质：搪胶 / 植绒 / 果冻 / 电镀
// 盲盒（印刷面用 Canvas 现画成纹理）+ 盒盖；“洋葱皮”残影用第二次步进叠上去
(function (G) {
  const MAXF = 8;
  const FS = `#version 300 es
  precision highp float;
  in vec2 uv; out vec4 o;
  uniform vec2 res; uniform vec4 view;          // view: 子画布在整张画布里的偏移(px) + 子画布尺寸
  uniform vec3 cam, tgt; uniform float fov;
  uniform int nF;
  uniform vec4 fA[${MAXF}];   // pos.xyz, yaw
  uniform vec4 fB[${MAXF}];   // 拉伸 sy, 材质(0 搪胶 1 植绒 2 果冻 3 电镀), 手臂(0 放下 1 举起), 侧倾
  uniform vec4 fC[${MAXF}];   // 帽色 rgb, 残影(1)
  uniform vec4 fD[${MAXF}];   // 身体色 rgb, 表情(0 笑 1 惊喜 2 眯眼)
  uniform vec4 boxP; uniform vec3 boxS; uniform float boxOn;  // 盒子：位置 + yaw；半尺寸
  uniform vec4 lidP; uniform vec3 lidR; uniform float lidOn;  // 盒盖：位置 + 是否；旋转(x,y,z)
  uniform vec3 boxCol, boxIn;
  uniform sampler2D boxTex;
  uniform vec3 bgTop, bgBot, floorCol;
  uniform vec3 keyDir; uniform float ghostA;
  uniform float floorOn, shelfOn; uniform vec3 shelfCol; uniform vec2 shelfY; uniform float shelfW;
  uniform vec4 boxRep, boxWig; uniform float boxClosed; uniform vec4 ped; uniform vec3 pedCol; uniform float expo, satu, grainA, seed;

  #define PI 3.14159265
  mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
  float sdEll(vec3 p, vec3 r){ float k0=length(p/r); float k1=length(p/(r*r)); return k0*(k0-1.0)/max(k1,1e-5); }
  float sdCap(vec3 p, vec3 a, vec3 b, float r){ vec3 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return length(pa-ba*h)-r; }
  float sdRBox(vec3 p, vec3 b, float r){ vec3 q=abs(p)-b+r; return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.)-r; }
  float smin(float a, float b, float k){ float h=clamp(0.5+0.5*(b-a)/k,0.,1.); return mix(b,a,h)-k*h*(1.-h); }
  float smax(float a, float b, float k){ return -smin(-a,-b,k); }

  // —— 一只小菇（局部坐标，脚底 y=0，面朝 +z）——
  // 返回 vec2(距离, 部件)：1 帽 2 脸 3 身体 4 手 5 脚
  vec2 mogu(vec3 p, float arm){
    vec3 q = p; q.x = abs(q.x);
    float body = sdEll(p - vec3(0., .6, 0.), vec3(.44, .52, .4));
    float feet = sdEll(q - vec3(.19, .1, .1), vec3(.16, .11, .2));
    vec3 sh = vec3(.33, .84, 0.);
    vec3 hd = mix(vec3(.56, .42, .14), vec3(.74, 1.3, .16), arm);
    float arms = min(sdCap(q, sh, hd, .1), length(q - hd) - .125);
    float head = sdEll(p - vec3(0., 1.34, .03), vec3(.58, .5, .54));
    vec3 cp = p - vec3(0., 1.62, 0.); cp.xy = rot(-.12) * cp.xy;
    float cap = sdEll(cp, vec3(.95, .58, .9));
    cap = smax(cap, -(cp.y + .1), .05);
    float bd = smin(body, feet, .07);
    bd = smin(bd, head, .14);
    float d = smin(bd, arms, .07);
    vec2 r = vec2(d, 3.);
    if (head < body - .02 && head < arms) r.y = 2.;
    if (arms < body + .01 && arms < head) r.y = 4.;
    if (feet < body + .015) r.y = 5.;
    if (cap < d) r = vec2(cap, 1.);
    return r;
  }

  vec3 toLocal(vec3 p, int i){
    vec3 q = p - fA[i].xyz;
    q.xz = rot(fA[i].w) * q.xz;
    q.xy = rot(fB[i].w) * (q.xy - vec2(0., 1.1)) + vec2(0., 1.1);
    float sy = fB[i].x, sx = inversesqrt(sy);
    q.y = (q.y - 1.1) / sy + 1.1; q.xz /= sx;
    return q;
  }

  vec2 figs(vec3 p, float ghost){
    vec2 r = vec2(1e9, 0.);
    for (int i = 0; i < ${MAXF}; i++){
      if (i >= nF) break;
      if (abs(fC[i].w - ghost) > .5) continue;
      float sy = fB[i].x; float sc = min(sy, inversesqrt(sy));
      float bnd = length(p - fA[i].xyz - vec3(0., 1.15, 0.)) - 1.45 * max(sy, 1.);
      if (bnd > .2) { if (bnd < r.x) r = vec2(bnd, 0.); continue; }
      vec2 m = mogu(toLocal(p, i), fB[i].z);
      m.x *= sc * .92;
      if (m.x < r.x) r = vec2(m.x, float(i * 10) + m.y);
    }
    return r;
  }

  vec3 boxLocal(vec3 p){
    vec3 q = p - boxP.xyz; q.xz = rot(boxP.w) * q.xz;
    if (boxRep.x > 0.) {
      q.x += (boxRep.x - 1.) * boxRep.z * .5;
      vec2 id = clamp(round(vec2(q.x / boxRep.z, q.y / boxRep.w - .3)), vec2(0.), boxRep.xy - 1.);
      q.x -= id.x * boxRep.z; q.y -= id.y * boxRep.w;
      if (abs(id.x - boxWig.x) < .5 && abs(id.y - boxWig.y) < .5) {
        vec2 pv = vec2(sign(boxWig.z) * boxS.x, 0.);
        q.xy = rot(boxWig.z) * (q.xy - pv) + pv;
      }
    }
    return q;
  }
  mat3 lidM(){
    mat3 rx = mat3(1,0,0, 0,cos(lidR.x),-sin(lidR.x), 0,sin(lidR.x),cos(lidR.x));
    mat3 ry = mat3(cos(lidR.y),0,sin(lidR.y), 0,1,0, -sin(lidR.y),0,cos(lidR.y));
    mat3 rz = mat3(cos(lidR.z),-sin(lidR.z),0, sin(lidR.z),cos(lidR.z),0, 0,0,1);
    return rx * ry * rz;
  }
  float boxD(vec3 p){
    vec3 q = boxLocal(p) - vec3(0., boxS.y, 0.);
    float outer = sdRBox(q, boxS, .03);
    float inner = sdRBox(q - vec3(0., .6, 0.), boxS + vec3(-.045, .6, -.045), .02);
    return boxClosed > .5 ? outer : max(outer, -inner);
  }
  float lidD(vec3 p){
    vec3 q = lidM() * (p - lidP.xyz);
    vec3 s = vec3(boxS.x + .035, .15, boxS.z + .035);
    float outer = sdRBox(q, s, .03);
    float inner = sdRBox(q - vec3(0., -.05, 0.), s - vec3(.04, 0., .04), .02);
    return max(outer, -inner);
  }

  vec2 map(vec3 p){
    vec2 r = figs(p, 0.);
    if (floorOn > .5) { float fl = p.y; if (fl < r.x) r = vec2(fl, 100.); }
    if (shelfOn > .5) {
      float sh = sdRBox(p - vec3(0., shelfY.x - .12, 0.), vec3(shelfW, .12, 1.1), .06);
      if (shelfY.y > shelfY.x) sh = min(sh, sdRBox(p - vec3(0., shelfY.y - .12, 0.), vec3(shelfW, .12, 1.1), .06));
      if (sh < r.x) r = vec2(sh, 110.);
    }
    if (ped.w > 0.) { vec3 q = p - ped.xyz; vec2 dd = vec2(length(q.xz) - ped.w, abs(q.y + .15) - .15); float pd = min(max(dd.x, dd.y), 0.) + length(max(dd, 0.)) - .03; if (pd < r.x) r = vec2(pd, 120.); }
    if (boxOn > .5) { float b = boxD(p); if (b < r.x) r = vec2(b, 200.); }
    if (lidOn > .5) { float l = lidD(p); if (l < r.x) r = vec2(l, 300.); }
    return r;
  }

  vec3 nrm(vec3 p, float g){
    vec2 e = vec2(.0015, 0.);
    if (g > .5) return normalize(vec3(figs(p+e.xyy,1.).x-figs(p-e.xyy,1.).x, figs(p+e.yxy,1.).x-figs(p-e.yxy,1.).x, figs(p+e.yyx,1.).x-figs(p-e.yyx,1.).x));
    return normalize(vec3(map(p+e.xyy).x-map(p-e.xyy).x, map(p+e.yxy).x-map(p-e.yxy).x, map(p+e.yyx).x-map(p-e.yyx).x));
  }
  float shadow(vec3 ro, vec3 rd, float k){
    float res = 1., t = .02;
    for (int i = 0; i < 64; i++){
      float h = map(ro + rd * t).x;
      res = min(res, k * h / t);
      t += clamp(h, .02, .3);
      if (res < .002 || t > 12.) break;
    }
    return clamp(res, 0., 1.);
  }
  float ao(vec3 p, vec3 n){
    float s = 0., w = 1.;
    for (int i = 1; i <= 5; i++){ float h = .04 * float(i) * float(i) * .5 + .02; s += w * (h - map(p + n * h).x); w *= .7; }
    return clamp(1. - 1.6 * s, 0., 1.);
  }

  vec3 backdrop(vec2 suv){ return mix(bgBot, bgTop, smoothstep(.0, 1., suv.y)); }
  // 摄影棚：两块柔光箱 + 一条轮廓灯条
  vec3 env(vec3 d){
    vec3 c = mix(floorCol * .5, mix(bgBot, bgTop, clamp(d.y * .8 + .4, 0., 1.)), smoothstep(-.15, .1, d.y));
    c *= 1. - .45 * exp(-pow((d.y - .03) / .07, 2.));
    vec3 k = normalize(keyDir);
    vec3 u = normalize(cross(k, vec3(0,1,0))), v = cross(u, k);
    float a = dot(d, k);
    if (a > 0.) { vec2 s = vec2(dot(d,u), dot(d,v)) / a; float m = smoothstep(.62, .5, abs(s.x)) * smoothstep(.42, .32, abs(s.y)); c = mix(c, vec3(5.2, 5., 4.7), m); }
    vec3 k2 = normalize(vec3(.95, .25, -.35));
    float a2 = dot(d, k2);
    if (a2 > 0.) { vec3 u2 = normalize(cross(k2, vec3(0,1,0))), v2 = cross(u2, k2); vec2 s2 = vec2(dot(d,u2), dot(d,v2)) / a2; float m2 = smoothstep(.12, .07, abs(s2.x)) * smoothstep(.9, .7, abs(s2.y)); c = mix(c, vec3(3.6, 3.8, 4.2), m2); }
    return c;
  }

  float hash(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }

  // 印在脸上的表情（移印 tampo）：返回 rgba
  vec4 face(vec3 q, float expr){
    vec2 f = (q - vec3(0., 1.3, .03)).xy;
    if (q.z < .15) return vec4(0.);
    vec4 c = vec4(0.);
    vec2 e = vec2(abs(f.x) - .215, f.y + .0);
    // 腮红
    float bl = length((vec2(abs(f.x), f.y) - vec2(.36, -.13)) / vec2(.1, .055));
    c = mix(c, vec4(1., .45, .5, .55), smoothstep(1., .55, bl) * .8);
    if (expr < .5) {
      // 竖着的椭圆大眼 + 两颗高光
      float ed = length(e / vec2(.088, .118));
      float m = smoothstep(1.03, .97, ed);
      vec3 ec = mix(vec3(.05, .04, .09), vec3(.18, .12, .3), smoothstep(.3, -1., f.y / .1));
      c = mix(c, vec4(ec, 1.), m);
      float h1 = smoothstep(.036, .027, length(e - vec2(.026, .048)));
      float h2 = smoothstep(.017, .011, length(e - vec2(-.024, -.055)));
      c = mix(c, vec4(1.), max(h1, h2) * m);
    } else if (expr < 1.5) {
      // 惊喜：圆眼睛 + 小 o 嘴
      float ed = length(e / vec2(.075, .085));
      float m = smoothstep(1.03, .97, ed);
      c = mix(c, vec4(.05, .04, .09, 1.), m);
      c = mix(c, vec4(1.), smoothstep(.028, .02, length(e - vec2(.022, .03))) * m);
    } else {
      // 眯眼 ^ ^
      vec2 a = vec2(abs(e.x), e.y + .02);
      float arc = abs(length(a - vec2(0., -.05)) - .08);
      float m = smoothstep(.019, .012, arc) * step(-.03, a.y);
      c = mix(c, vec4(.05, .04, .09, 1.), m);
    }
    // 嘴
    vec2 mo = f - vec2(0., -.17);
    if (expr < .5 || expr > 1.5) {
      float md = length(mo / vec2(.075, .06));
      float m = smoothstep(1.04, .96, md) * step(mo.y, .0);
      vec3 mc = mix(vec3(.45, .06, .12), vec3(1., .45, .5), smoothstep(-.02, -.06, mo.y));
      c = mix(c, vec4(mc, 1.), m);
    } else {
      float m = smoothstep(1.04, .96, length(mo / vec2(.035, .045)));
      c = mix(c, vec4(.45, .06, .12, 1.), m);
    }
    return c;
  }

  vec3 spotsCap(vec3 q, vec3 base){
    vec3 cp = q - vec3(0., 1.62, 0.); cp.xy = rot(-.12) * cp.xy;
    if (cp.y < -.06) {
      // 帽子底下的菌褶
      float a = atan(cp.z, cp.x);
      float g = smoothstep(.3, .9, abs(sin(a * 34.)));
      return mix(vec3(1., .93, .82), vec3(.93, .8, .66), g * .7);
    }
    vec3 d = normalize(cp / vec3(.95, .58, .9));
    float s = 0.;
    for (int i = 0; i < 11; i++){
      float fi = float(i);
      float y = .25 + .7 * fract(fi * .618 + .1);
      float ph = fi * 2.39996 + .5;
      float rr = sqrt(1. - y * y);
      vec3 sd = vec3(cos(ph) * rr, y, sin(ph) * rr);
      float rad = .2 + .09 * fract(fi * .37);
      s = max(s, smoothstep(cos(rad), cos(rad * .9), dot(d, sd)));
    }
    return mix(base, vec3(1., .97, .9), s);
  }

  struct Hit { vec3 col; float t; };

  vec3 shadeFig(vec3 p, vec3 n, vec3 rd, int i, float part, bool ghost){
    vec3 q = toLocal(p, i);
    float mat = fB[i].y;
    vec3 base = part < 1.5 ? fC[i].rgb : (part < 2.5 ? vec3(1., .82, .7) : (part < 3.5 ? fD[i].rgb : (part < 4.5 ? vec3(1., .82, .7) : fD[i].rgb * .82)));
    if (part < 1.5) base = spotsCap(q, base);
    if (part > 2.5 && part < 3.5) {
      // 肚子上的小口袋
      float pk = length((q.xy - vec2(0., .55)) / vec2(.17, .13));
      if (q.z > 0.) base = mix(base, base * 1.12 + .05, smoothstep(1.02, .96, pk));
      base = mix(base, base * .78, smoothstep(.04, .0, abs(pk - 1.)) * step(0., q.z));
    }
    vec4 fp = vec4(0.);
    if (part > 1.5 && part < 2.5) fp = face(q, fD[i].w);
    vec3 k = normalize(keyDir);
    float ndl = dot(n, k);
    float ndv = clamp(dot(n, -rd), 0., 1.);
    float sh = ghost ? 1. : shadow(p + n * .01, k, 9.);
    float oc = ghost ? 1. : ao(p, n);
    vec3 col;
    vec3 hemi = mix(floorCol * .55, mix(bgBot, bgTop, .6) * 1.1, n.y * .5 + .5);
    vec3 fillD = normalize(vec3(.9, .25, .5));
    float fill = max(dot(n, fillD), 0.);
    vec3 R = reflect(rd, n);
    if (mat > 3.5) {
      float rim = pow(1. - ndv, 3.);
      return fD[i].rgb * (.7 + .3 * clamp(ndl, 0., 1.)) + vec3(.5, .45, .8) * rim * .5;
    }
    if (mat < .5) {
      // 搪胶：包裹漫反射 + 暗部偏饱和（像有一点透光）+ 柔光箱高光
      float w = .4;
      float dif = clamp((ndl + w) / (1. + w), 0., 1.) * mix(.35, 1., sh);
      vec3 sat = base * base * 1.1;
      col = mix(sat * .42, base, dif) * .95;
      col *= mix(.45, 1., oc);
      col += base * hemi * .16 * oc + base * vec3(.85, .9, 1.) * fill * .12;
      vec3 h = normalize(k - rd);
      float sp = pow(max(dot(n, h), 0.), 60.) * 1.2 * sh;
      float fr = .04 + .96 * pow(1. - ndv, 5.);
      col += (env(R) * .16 * (.3 + fr) + sp) * mix(.4, 1., oc) * (1. - fp.a * .3);
    } else if (mat < 1.5) {
      // 植绒：没有高光，边缘一圈绒光
      float dif = clamp((ndl + .6) / 1.6, 0., 1.) * mix(.45, 1., sh);
      col = base * (.42 + .62 * dif) * mix(.5, 1., oc);
      col += base * hemi * .15;
      float sheen = pow(1. - ndv, 2.2);
      col += mix(base, vec3(1.), .55) * sheen * .55 * oc;
      col *= .94 + .12 * hash(floor(p * 600.));
    } else if (mat < 2.5) {
      // 果冻：中间透出背后的颜色，越往边上越浓，高光又小又亮
      float fr = .04 + .96 * pow(1. - ndv, 4.);
      vec3 tint = base;
      vec3 through = env(refract(rd, n, .7)) * tint * 1.05;
      float edge = smoothstep(.1, .95, 1. - ndv);
      col = mix(through, tint * tint * tint * .55, edge);
      col += tint * .35 * pow(max(dot(n, -k), 0.), 2.);
      col += env(R) * fr * .7;
      vec3 h = normalize(k - rd);
      col += pow(max(dot(n, h), 0.), 160.) * 4. * sh;
      col *= mix(.8, 1., oc);
    } else {
      // 电镀：整个就是一面镜子，颜色来自摄影棚
      vec3 tint = mix(vec3(1.), base, .7);
      float fr = .75 + .25 * pow(1. - ndv, 5.);
      col = (env(R) * fr * 1.15 + .1) * tint * mix(.55, 1., oc);
      col = mix(col, col * 1.1, sh);
    }
    col = mix(col, fp.rgb * mix(.6, 1.05, clamp((ndl + .5) / 1.5, 0., 1.) * mix(.6, 1., sh)) + (mat > 1.5 && mat < 3.5 ? env(R) * .08 : vec3(0.)), fp.a);
    return col;
  }

  vec3 shadeBox(vec3 p, vec3 n, vec3 rd, bool lid){
    vec3 k = normalize(keyDir);
    float sh = shadow(p + n * .01, k, 9.);
    float oc = ao(p, n);
    vec3 base = boxCol;
    if (!lid) {
      vec3 q = boxLocal(p) - vec3(0., boxS.y, 0.);
      vec3 qn = n; qn.xz = rot(boxP.w) * qn.xz;
      bool inside = (abs(q.x) < boxS.x - .03 && abs(q.z) < boxS.z - .03 && q.y < boxS.y - .005);
      if (inside) base = boxIn;
      else if (qn.z > .7) { vec2 t = vec2(q.x / boxS.x * .5 + .5, q.y / boxS.y * .5 + .5); t.x = t.x * .5; base = texture(boxTex, vec2(t.x, 1. - t.y)).rgb; }
      else if (qn.x > .7) { vec2 t = vec2(-q.z / boxS.z * .5 + .5, q.y / boxS.y * .5 + .5); t.x = .5 + t.x * .5; base = texture(boxTex, vec2(t.x, 1. - t.y)).rgb; }
      else if (qn.x < -.7) { vec2 t = vec2(q.z / boxS.z * .5 + .5, q.y / boxS.y * .5 + .5); t.x = .5 + t.x * .5; base = texture(boxTex, vec2(t.x, 1. - t.y)).rgb; }
    } else {
      vec3 q = lidM() * (p - lidP.xyz);
      vec3 qn = lidM() * n;
      if (qn.y < -.5) base = boxIn;
      else if (qn.y > .7) { float st = step(.5, fract((q.x + q.z) * 2.2)); base = mix(boxCol, boxCol * .86 + vec3(.06), st); float c = length(q.xz); base = mix(base, vec3(1., .97, .92), smoothstep(.46, .44, c)); base = mix(base, boxCol * .7, smoothstep(.03, .0, abs(c - .38)) ); }
    }
    float dif = clamp((dot(n, k) + .15) / 1.15, 0., 1.) * mix(.35, 1., sh);
    vec3 hemi = mix(floorCol * .6, mix(bgBot, bgTop, .6), n.y * .5 + .5);
    vec3 col = base * (.32 + .78 * dif) * mix(.45, 1., oc) + base * hemi * .22 * oc;
    vec3 R = reflect(rd, n); float fr = .04 + .96 * pow(1. - clamp(dot(n, -rd), 0., 1.), 5.);
    col += env(R) * fr * .25 * oc;
    return col;
  }

  void main(){
    vec2 px = view.xy + uv * view.zw;
    vec2 suv = px / res;
    vec2 sp = (uv - .5) * vec2(view.z / view.w, 1.) * 2.;
    vec3 fw = normalize(tgt - cam), rt = normalize(cross(fw, vec3(0,1,0))), up = cross(rt, fw);
    vec3 rd = normalize(fw / tan(fov * .5) + rt * sp.x + up * sp.y);
    vec3 bg = backdrop(uv);
    vec3 col = bg;
    float t = 0.; vec2 h = vec2(0.);
    bool hit = false;
    for (int i = 0; i < 220; i++){
      h = map(cam + rd * t);
      if (h.x < .0006 * t) { hit = true; break; }
      t += h.x * .9;
      if (t > 60.) break;
    }
    float tHit = hit ? t : 1e9;
    if (hit) {
      vec3 p = cam + rd * t;
      vec3 n = nrm(p, 0.);
      if (h.y >= 100. && h.y < 200.) {
        vec3 k = normalize(keyDir);
        float sh = shadow(p + n * .01, k, 7.);
        float oc = ao(p, n);
        vec3 fc = h.y < 105. ? floorCol : (h.y < 115. ? shelfCol : pedCol);
        if (h.y > 115. && n.y < .5) { float st = step(.5, fract(atan(p.z - ped.z, p.x - ped.x) * 6.)); fc = mix(pedCol, pedCol * .85, st); }
        if (h.y > 105. && n.y < .5) fc *= .82;
        vec3 shc = fc * vec3(.8, .78, .9) * .82;
        col = mix(shc, fc, mix(.0, 1., sh)) * mix(.62, 1., oc);
        if (h.y < 105.) col = mix(col, bg, smoothstep(9., 26., t));
      } else if (h.y >= 200.) {
        col = shadeBox(p, n, rd, h.y >= 300.);
      } else {
        int i = int(floor(h.y / 10.)); float part = h.y - float(i) * 10.;
        col = shadeFig(p, n, rd, i, part, false);
      }
    }
    // 洋葱皮：残影只描出淡淡一层
    if (ghostA > 0.) {
      float tg = 0.; vec2 g; bool gh = false;
      for (int i = 0; i < 140; i++){
        g = figs(cam + rd * tg, 1.);
        if (g.x < .001 * tg) { gh = true; break; }
        tg += g.x;
        if (tg > 40. || tg > tHit) break;
      }
      if (gh && tg < tHit) {
        vec3 p = cam + rd * tg; vec3 n = nrm(p, 1.);
        int i = int(floor(g.y / 10.)); float part = g.y - float(i) * 10.;
        vec3 gc = shadeFig(p, n, rd, i, part, true);
        float rim = pow(1. - clamp(dot(n, -rd), 0., 1.), 2.);
        gc = mix(gc, vec3(1.), .25);
        col = mix(col, gc, ghostA * (.55 + .45 * rim));
      }
    }
    // 直接出 sRGB：只在高光处软压，保住糖果色
    col *= expo;
    vec3 kn = vec3(.82);
    col = mix(col, kn + (1. - kn) * (1. - exp(-(col - kn) / (1. - kn))), step(kn, col));
    float lu = dot(col, vec3(.2126,.7152,.0722)); col = mix(vec3(lu), col, satu);
    col = pow(clamp(col, 0., 1.), vec3(1. / 2.2));
    col += (fract(sin(dot(px, vec2(12.9898, 78.233)) + seed) * 43758.5453) - .5) * grainA;
    o = vec4(col, 1.);
  }`;

  function setFigs(gl, P, figs) {
    const A = new Float32Array(MAXF * 4), B = new Float32Array(MAXF * 4), C = new Float32Array(MAXF * 4), D = new Float32Array(MAXF * 4);
    figs.forEach((f, i) => {
      A.set([f.pos[0], f.pos[1], f.pos[2], f.yaw || 0], i * 4);
      B.set([f.sy || 1, f.mat || 0, f.arm || 0, f.tilt || 0], i * 4);
      C.set([...(f.cap || [1, .36, .3]), f.ghost ? 1 : 0], i * 4);
      D.set([...(f.body || [.6, .86, .78]), f.expr || 0], i * 4);
    });
    gl.uniform1i(P.u.nF, figs.length);
    gl.uniform4fv(P.u.fA, A); gl.uniform4fv(P.u.fB, B); gl.uniform4fv(P.u.fC, C); gl.uniform4fv(P.u.fD, D);
  }

  const lin = c => c.map(v => Math.pow(v, 2.2));
  const hex = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
  const L = h => lin(hex(h));

  // scene: { cam, tgt, fov, figs[], box?, lid?, bgTop, bgBot, floor, key, ghostA, boxTex(canvas) }
  async function render(gl, P, target, s, tiles = 6) {
    gl.useProgram(P);
    const W = target ? target.w : gl.drawingBufferWidth, H = target ? target.h : gl.drawingBufferHeight;
    gl.uniform2f(P.u.res, W, H);
    gl.uniform4f(P.u.view, 0, 0, W, H);
    gl.uniform3fv(P.u.cam, s.cam); gl.uniform3fv(P.u.tgt, s.tgt); gl.uniform1f(P.u.fov, s.fov * Math.PI / 180);
    setFigs(gl, P, s.figs);
    const box = s.box || { pos: [0, -50, 0], yaw: 0, size: [1, 1, 1] };
    gl.uniform4f(P.u.boxP, ...box.pos, box.yaw || 0); gl.uniform3fv(P.u.boxS, box.size || [0.95, 1, 0.8]); gl.uniform1f(P.u.boxOn, s.box ? 1 : 0);
    const lid = s.lid || { pos: [0, -50, 0], rot: [0, 0, 0] };
    gl.uniform4f(P.u.lidP, ...lid.pos, 0); gl.uniform3fv(P.u.lidR, lid.rot); gl.uniform1f(P.u.lidOn, s.lid ? 1 : 0);
    gl.uniform3fv(P.u.boxCol, L(s.boxCol || '#6ec3ff')); gl.uniform3fv(P.u.boxIn, L(s.boxIn || '#fff3e6'));
    gl.uniform3fv(P.u.bgTop, L(s.bgTop)); gl.uniform3fv(P.u.bgBot, L(s.bgBot)); gl.uniform3fv(P.u.floorCol, L(s.floor));
    gl.uniform3fv(P.u.keyDir, s.key || [-0.55, 0.85, 0.6]);
    gl.uniform1f(P.u.ghostA, s.ghostA || 0);
    gl.uniform1f(P.u.floorOn, s.floorOn === false ? 0 : 1);
    gl.uniform1f(P.u.expo, s.exposure || 1); gl.uniform1f(P.u.satu, s.saturation || 1.08); gl.uniform1f(P.u.grainA, s.grain ?? 0.012); gl.uniform1f(P.u.seed, s.seed || 1);
    gl.uniform1f(P.u.shelfOn, s.shelf ? 1 : 0);
    gl.uniform2fv(P.u.shelfY, s.shelfY || [0, -1]); gl.uniform1f(P.u.shelfW, s.shelfW || 9);
    gl.uniform4fv(P.u.boxRep, s.boxRep || [0, 0, 0, 0]); gl.uniform4fv(P.u.boxWig, s.boxWig || [-9, -9, 0, 0]); gl.uniform1f(P.u.boxClosed, s.boxClosed ? 1 : 0);
    gl.uniform4fv(P.u.ped, s.ped || [0, 0, 0, 0]); gl.uniform3fv(P.u.pedCol, L(s.pedCol || '#ffffff')); gl.uniform3fv(P.u.shelfCol, L(s.shelf || '#ffffff'));
    if (s.boxTex) {
      const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.SRGB8_ALPHA8, gl.RGBA, gl.UNSIGNED_BYTE, s.boxTex);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.uniform1i(P.u.boxTex, 0);
    }
    await GLK.drawTiled(gl, target, tiles);
  }

  // 3D → 屏幕（CSS px），用来画标注线
  function project(s, p, w, h) {
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const nrm = a => { const l = Math.hypot(...a); return a.map(v => v / l); };
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const fw = nrm(sub(s.tgt, s.cam)), rt = nrm(cross(fw, [0, 1, 0])), up = cross(rt, fw);
    const d = sub(p, s.cam); const z = dot(d, fw); const f = 1 / Math.tan(s.fov * Math.PI / 360);
    const x = dot(d, rt) / z * f, y = dot(d, up) / z * f;
    return [w / 2 + x * h / 2, h / 2 - y * h / 2];
  }

  G.TOY = { FS, render, project, L, hex };
})(window);
