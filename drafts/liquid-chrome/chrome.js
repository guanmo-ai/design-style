// chrome.js — 液态金属渲染器：文字距离场挤出 + 平滑并集（smin）的液滴 / 拉丝 / 水洼 / 皇冠溅射
// 全部在一个光线步进着色器里：镜面反射 3 次弹射，环境是手写的“摄影棚”（地平线 + 柔光箱 + 彩色色片）
(function (G) {
  const FS = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;
uniform vec2 res; uniform vec2 shift; // shift：镜头平移（构图用）
uniform sampler2D sdfTex; uniform vec4 texRect; uniform float pxWorld; uniform int fastBicubic;
uniform float T, R, H, wob;
uniform vec3 camPos, camTgt; uniform float fov, roll;
uniform highp sampler2D primTex; uniform int nDrips, nDrops, nBlobs, nMtar, nPools, nRip, nCrowns, nSpikes;
vec4 PR(int r, int i){ return texelFetch(primTex, ivec2(i, r), 0); }
uniform float morph, mtarK; uniform vec3 morphSweep;
uniform vec4 colA, colB; uniform float colAmp, colLam, colOn, colTaper, colWob;
uniform int obj, nCaps, envMode; uniform vec4 objP; uniform vec4 gRise; uniform vec3 gSplit; uniform float seamAmt, checker, capK;
uniform vec4 spikeC; uniform float spikeK, bwob;
uniform float useText, floorOn, floorY, backdropMode;
uniform vec3 bdTop, bdBot, bdGlow; uniform vec2 bdGlowPos;
uniform float envHue, envRot;
uniform vec3 tint, floorTint; uniform mat3 grot; uniform vec3 gpos;
uniform vec3 bbDripLo, bbDripHi, bbDropLo, bbDropHi, bbBlobLo, bbBlobHi; uniform vec4 bbSpike; uniform float poolTop; uniform int maxBounce, aoOn; uniform vec3 sceneLo, sceneHi;

float boxD(vec3 p, vec3 lo, vec3 hi){ vec3 q = max(max(lo - p, p - hi), 0.0); return length(q); }
float smin(float a, float b, float k){ float h = max(k-abs(a-b),0.0)/k; return min(a,b) - h*h*k*0.25; }
float smax(float a, float b, float k){ return -smin(-a, -b, k); }
vec4 bsw(float t){ float t2=t*t, t3=t2*t; return vec4((1.0-t)*(1.0-t)*(1.0-t), 3.0*t3-6.0*t2+4.0, -3.0*t3+3.0*t2+3.0*t+1.0, t3)/6.0; }
float sampleSdf(vec2 q){
  ivec2 sz = textureSize(sdfTex, 0);
  if (fastBicubic > 0) {
    vec2 ts = vec2(sz), st = q*ts - 0.5, i = floor(st), f = st - i;
    vec4 wx = bsw(f.x), wy = bsw(f.y);
    vec2 g0 = vec2(wx.x + wx.y, wy.x + wy.y), g1 = vec2(wx.z + wx.w, wy.z + wy.w);
    vec2 h0 = (vec2(wx.y, wy.y)/g0 - 1.0 + i + 0.5)/ts, h1 = (vec2(wx.w, wy.w)/g1 + 1.0 + i + 0.5)/ts;
    return g0.y*(g0.x*texture(sdfTex, h0).r + g1.x*texture(sdfTex, vec2(h1.x, h0.y)).r) + g1.y*(g0.x*texture(sdfTex, vec2(h0.x, h1.y)).r + g1.x*texture(sdfTex, h1).r);
  }
  vec2 st = q*vec2(sz) - 0.5; vec2 i = floor(st); vec2 f = st - i;
  vec4 wx = bsw(f.x), wy = bsw(f.y);
  float acc = 0.0;
  for(int y=0;y<4;y++){ float row = 0.0;
    for(int x=0;x<4;x++){ ivec2 c = clamp(ivec2(i) + ivec2(x-1,y-1), ivec2(0), sz-1); row += texelFetch(sdfTex, c, 0).r * wx[x]; }
    acc += row*wy[y]; }
  return acc;
}
float sdText2D(vec2 p){
  vec2 q = (p - texRect.xy)/texRect.zw; vec2 qc = clamp(q, vec2(0.002), vec2(0.998));
  float d = sampleSdf(qc) * pxWorld;
  return d + length((q-qc)*texRect.zw);
}
float sdLetters(vec3 p){
  if (useText < 0.5) return 1e5;
  float gi = p.x < gSplit.x ? gRise.x : p.x < gSplit.y ? gRise.y : p.x < gSplit.z ? gRise.z : gRise.w;
  p.y -= gi;
  vec2 lo = texRect.xy - 0.4, hi = texRect.xy + texRect.zw + 0.4;
  vec3 bc = vec3((lo+hi)*0.5, 0.0), bh = vec3((hi-lo)*0.5, H+R+0.4);
  vec3 qb = abs(p-bc)-bh; float db = length(max(qb,0.0)) + min(max(qb.x,max(qb.y,qb.z)),0.0);
  if (db > 0.3) return db;
  float d2 = sdText2D(p.xy) + R;
  vec2 w = vec2(d2, abs(p.z) - H);
  float d = min(max(w.x,w.y),0.0) + length(max(w,0.0)) - R;
  d += wob*sin(p.x*5.1+T*1.7)*sin(p.y*6.3-T*1.1)*sin(p.z*7.7+p.x*2.0);
  return d;
}
float sdRoundCone(vec3 p, vec3 a, vec3 b, float r1, float r2){
  vec3 ba = b - a; float l2 = dot(ba,ba); float rr = r1 - r2; float a2 = l2 - rr*rr; float il2 = 1.0/l2;
  vec3 pa = p - a; float y = dot(pa,ba); float z = y - l2;
  vec3 xv = pa*l2 - ba*y; float x2 = dot(xv,xv); float y2 = y*y*l2; float z2 = z*z*l2;
  float k = sign(rr)*rr*rr*x2;
  if (sign(z)*a2*z2 > k) return sqrt(x2 + z2)*il2 - r2;
  if (sign(y)*a2*y2 < k) return sqrt(x2 + y2)*il2 - r1;
  return (sqrt(x2*a2*il2)+y*rr)*il2 - r1;
}
float sdEll(vec3 p, vec3 r){ float k0 = length(p/r); float k1 = length(p/(r*r)); return k0*(k0-1.0)/k1; }
float ripH(vec2 xz){
  float h = 0.0;
  for(int i=0;i<8;i++){ if(i>=nRip) break;
    vec4 r = PR(9,i); float d = length(xz - r.xy); float front = r.z*1.6;
    if (d > front + 0.1 || r.w < 1e-4) continue;
    h += r.w * sin(d*13.0 - r.z*12.0) * exp(-d*2.2) * smoothstep(front+0.05, front-0.35, d) * smoothstep(0.0, 0.25, d);
  }
  return h;
}
float sdCrown(vec3 p, vec4 c){
  // c: x, z, 半径, 高度。一圈薄壁 + 顶上的尖和小珠
  vec3 q = p - vec3(c.x, floorY, c.y);
  float ang = atan(q.z, q.x);
  float rr = length(q.xz);
  float hgt = c.w * (0.8 + 0.2*sin(ang*3.0 + 1.3));
  float rad = c.z * (1.0 + 0.25*smoothstep(0.0, hgt, q.y));
  float wall = abs(rr - rad) - 0.026*(1.0 - 0.6*clamp(q.y/hgt,0.0,1.0));
  float d = max(wall, max(-q.y, q.y - hgt));
  // 尖上的珠
  float seg = 6.2831853/12.0; float a2 = mod(ang, seg) - seg*0.5;
  float aa = ang - a2;
  float rim = c.z*1.25; float th = c.w*(0.8 + 0.2*sin(aa*3.0 + 1.3));
  vec3 tip = vec3(cos(aa)*rim*1.12, th*1.22, sin(aa)*rim*1.12);
  d = smin(d, sdRoundCone(q, vec3(cos(aa)*rim, th*0.85, sin(aa)*rim), tip, 0.012, 0.026), 0.05);
  return d;
}
float sdColumn(vec3 p){
  // 竖直液柱：半径沿高度按余弦调制，振幅 colAmp → 1 时颈断开，变成一串珠子
  vec3 a = colA.xyz, b = colB.xyz; float L = b.y - a.y;
  float y = clamp(p.y - a.y, 0.0, L);
  float ph = y/colLam*6.2831853;
  float r = colA.w * (1.0 - colAmp*0.5*(1.0 + cos(ph)));
  r *= 1.0 + colTaper*(0.5 - y/max(L,1e-3));
  vec3 cq = p - vec3(mix(a.x, b.x, y/max(L,1e-3)), a.y + y, mix(a.z, b.z, y/max(L,1e-3)));
  r += colWob * (sin(y*6.0 - T*7.0 + atan(cq.z, cq.x)*2.0) * 0.6 + sin(y*11.0 + T*5.0) * 0.4);
  r = max(r, 0.0) * smoothstep(0.0, 0.02, min(y, L - y) + 0.02);
  vec3 c = vec3(mix(a.x, b.x, y/max(L,1e-3)), a.y + y, mix(a.z, b.z, y/max(L,1e-3)));
  return (length(p - c) - r) * 0.7;
}
// 布朗库西《空间中的鸟》：旋转体，半径沿高度变化；objP.x = 长到多高（0..1），objP.y = 往下塌（0..1）
float sdBird(vec3 p){
  float H = 4.3*objP.x; if (H < 0.02) return 1e5;
  float sq = 1.0 - 0.85*objP.y; p.y /= max(sq, 0.05);
  float y = p.y; float rr = length(p.xz);
  float base = max(max(rr - 0.36, -y - 0.55), y + 0.05);                       // 底座
  float u = clamp((y - 0.05)/max(H - 0.05, 0.01), 0.0, 1.0);
  float r = 0.065 + 0.36*pow(sin(3.14159*pow(u, 0.9)), 1.25)*(1.0 - 0.25*u) + 0.05*(1.0 - smoothstep(0.0, 0.08, u));
  float body = (rr - r)*0.55;
  body = max(body, max(-(y - 0.0), y - H));
  body = max(body, dot(p - vec3(0.0, H - 0.12, 0.0), normalize(vec3(0.55, 1.0, 0.0))));   // 顶上斜切一刀
  return smin(base, body, 0.06)*max(sq, 0.05);
}
// 卡普尔《云门》：一颗压扁的豆子，底下掏出一个拱（肚脐）
float sdBean(vec3 p){
  float d = sdEll(p - vec3(0.0, 1.25, 0.0), vec3(2.45, 1.15, 1.35)*objP.x);
  if (objP.y > 0.01) d = smax(d, -sdEll(p - vec3(0.0, 0.05, 0.0), vec3(1.05, 0.8, 0.95)*objP.x*objP.y), 0.35);
  return d;
}
float mapLiquid(vec3 p){
  p = grot*(p - gpos);
  float d = sdLetters(p);
  if (nMtar > 0) {
    float dt = 1e5;
    for(int i=0;i<8;i++){ if(i>=nMtar) break; vec4 m = PR(6,i); dt = smin(dt, sdEll(p - m.xyz, m.w*PR(7,i).xyz), mtarK); }
    float mk = clamp(morph*(1.0 + morphSweep.z) - morphSweep.z*clamp((p.x - morphSweep.x)/(morphSweep.y - morphSweep.x), 0.0, 1.0), 0.0, 1.0);
    mk = mk*mk*(3.0 - 2.0*mk);
    d = (useText > 0.5) ? mix(d, dt, mk) : dt;
  }
  if (colOn > 0.5) d = smin(d, sdColumn(p), 0.12);
  if (obj == 1) d = smin(d, sdBird(p), 0.25);
  if (obj == 4) d = smin(d, sdBean(p), 0.2);
  // 气球：两头细、中间鼓的“香肠”，彼此只用很小的 k 并起来，所以接头处是掐进去的
  for(int i=0;i<16;i++){ if(i>=nCaps) break;
    vec4 a = PR(12,i), b = PR(13,i);
    vec3 ba = b.xyz - a.xyz, pa = p - a.xyz; float h = clamp(dot(pa,ba)/max(dot(ba,ba),1e-6), 0.0, 1.0);
    float r = a.w*(0.62 + 0.42*sin(3.14159*h));
    d = smin(d, length(pa - ba*h) - r, capK);
  }
  if (nDrips > 0 && boxD(p, bbDripLo, bbDripHi) < d + 0.2) {
    for(int i=0;i<32;i++){ if(i>=nDrips) break;
      vec4 a = PR(0,i); vec4 b = PR(1,i);
      vec3 mid = (a.xyz + b.xyz)*0.5; float rad = length(b.xyz - a.xyz)*0.5 + max(a.w, b.w);
      if (length(p - mid) - rad > d + 0.16) continue;
      float dd = sdRoundCone(p, a.xyz, b.xyz, a.w, b.w);
      d = smin(d, dd, 0.16);
    }
  }
  if (nBlobs > 0 && boxD(p, bbBlobLo, bbBlobHi) < d + 0.4)
  for(int i=0;i<10;i++){ if(i>=nBlobs) break;
    vec4 b = PR(4,i); vec4 bk = PR(5,i); vec3 q = p-b.xyz;
    float w = (i==0) ? bwob*(sin(q.x*4.0+T*1.3)*sin(q.y*3.6-T)*sin(q.z*4.4+T*0.7)) : 0.0;
    d = smin(d, sdEll(q, b.w*bk.xyz) + w, bk.w);
  }
  // 磁流体的刺：从球心往外长的圆锥，smin 出凹下去的根
  if (nSpikes > 0 && length(p - spikeC.xyz) - bbSpike.w < d + 0.12)
  for(int i=0;i<64;i++){ if(i>=nSpikes) break;
    vec4 s = PR(11,i); vec3 a = spikeC.xyz + s.xyz*spikeC.w*0.55, b = spikeC.xyz + s.xyz*(spikeC.w + s.w);
    d = smin(d, sdRoundCone(p, a, b, spikeC.w*0.2, 0.006), spikeK);
  }
  return d;
}
float mapDrops(vec3 p){
  p = grot*(p - gpos);
  float d = 1e5;
  for(int i=0;i<40;i++){ if(i>=nDrops) break;
    vec4 a = PR(2,i); d = smin(d, sdEll(p-a.xyz, a.w*PR(3,i).xyz), 0.05);
  }
  return d;
}
float mapPool(vec3 p){
  float d = 1e5;
  for(int i=0;i<4;i++){ if(i>=nCrowns) break; d = min(d, sdCrown(p, PR(10,i))); }
  if (nPools==0) return d;
  for(int i=0;i<8;i++){ if(i>=nPools) break;
    vec4 a = PR(8,i); d = smin(d, sdEll(p - vec3(a.x, floorY, a.y), vec3(a.z, a.w, a.z*0.62)), 0.35);
  }
  if (d < 0.25) d -= ripH(p.xz) * smoothstep(0.0, 0.04, p.y-floorY);
  return d;
}
float map(vec3 p){
  float d = mapLiquid(p);
  if (nDrops > 0) { vec3 q = grot*(p - gpos); if (boxD(q, bbDropLo, bbDropHi) < d + 0.1) d = smin(d, mapDrops(p), 0.08); }
  if ((nCrowns > 0 || nPools > 0) && p.y - floorY < poolTop + d + 0.15) d = smin(d, mapPool(p), 0.12);
  return d;
}
vec3 nrm(vec3 p, float t){
  float e = 0.0006*max(1.0,t*0.35);
  vec2 k = vec2(1,-1);
  return normalize(k.xyy*map(p+k.xyy*e) + k.yyx*map(p+k.yyx*e) + k.yxy*map(p+k.yxy*e) + k.xxx*map(p+k.xxx*e));
}
float ao(vec3 p, vec3 n){
  float occ = 0.0, sca = 1.0;
  for(int i=1;i<=3;i++){ float h = 0.03 + 0.13*float(i); float d = map(p + n*h); occ += (h-d)*sca; sca *= 0.7; }
  return clamp(1.0 - 1.6*occ, 0.0, 1.0);
}
float march(vec3 ro, vec3 rd, float tmax){
#ifdef BG_ONLY
  return -1.0;
#endif
  // 先和整个场景的包围盒求交：碰不到就不走（背景和地面倒影大多走这条路）
  vec3 inv = 1.0/rd; vec3 t0 = (sceneLo - ro)*inv, t1 = (sceneHi - ro)*inv;
  vec3 tn3 = min(t0, t1), tf3 = max(t0, t1);
  float tn = max(max(tn3.x, tn3.y), tn3.z), tfar = min(min(tf3.x, tf3.y), tf3.z);
  if (tfar < max(tn, 0.0)) return -1.0;
  tmax = min(tmax, tfar + 0.01);
  float t = max(tn - 0.01, 0.0);
  for(int i=0;i<170;i++){
    vec3 p = ro + rd*t; float d = map(p);
    if (abs(d) < 0.0005*max(1.0,t)) return t;
    t += d*0.82;
    if (t > tmax) break;
  }
  return -1.0;
}
vec3 hue(vec3 c, float a){ // 绕灰轴转色相
  const vec3 k = vec3(0.57735);
  float ca = cos(a); return c*ca + cross(k,c)*sin(a) + k*dot(k,c)*(1.0-ca);
}
float boxL(vec3 d, vec3 c, vec2 s, float soft){
  c = normalize(c); float cd = dot(d,c); if (cd <= 0.0) return 0.0;
  vec3 r = normalize(cross(c, vec3(0,1,0)+vec3(0.0001))); vec3 u = cross(r, c);
  vec3 q = d/cd - c; float x = dot(q,r), y = dot(q,u);
  return (1.0-smoothstep(s.x-soft, s.x+soft, abs(x))) * (1.0-smoothstep(s.y-soft, s.y+soft, abs(y)));
}
float hsh(float n){ return fract(sin(n*127.1)*43758.5453); }
vec3 envCity(vec3 d){
  float y = d.y, az = atan(d.z, d.x);
  // 蓝调时刻：地平线一条暖橙，往上沉成深蓝
  vec3 sky = mix(vec3(1.0,0.5,0.22)*1.3, vec3(0.08,0.12,0.32), smoothstep(0.0, 0.28, y));
  sky = mix(sky, vec3(0.008,0.012,0.04), smoothstep(0.28, 0.9, y));
  sky += vec3(1.0,0.7,0.45)*2.2*exp(-pow(length(vec2(az - 2.2, y - 0.04)*vec2(1.0, 3.0)), 2.0)*40.0);
  vec3 c = sky;
  // 远处一排矮楼（剪影），近处一排高楼（有窗）
  float s1 = floor(az*26.0), h1 = 0.035 + 0.06*hsh(s1*3.7);
  if (y < h1) c = vec3(0.03,0.035,0.07);
  float s2 = floor(az*11.0 + 0.5), h2 = 0.05 + 0.2*pow(hsh(s2), 1.6), edge = fract(az*11.0 + 0.5);
  if (y < h2 && edge > 0.06 && edge < 0.94) {
    c = vec3(0.008,0.01,0.022);
    vec2 w = vec2(fract(az*190.0), fract(y*70.0)); float id = hsh(floor(az*190.0)*7.0 + floor(y*70.0)*31.0);
    if (w.x > 0.3 && w.x < 0.8 && w.y > 0.35 && w.y < 0.8 && id > 0.78) c = vec3(1.0,0.78,0.45)*1.3;
  }
  if (y < 0.0) c = mix(vec3(0.1,0.08,0.08), vec3(0.015), smoothstep(0.0, 0.25, -y));
  c += 5.0*vec3(1.0,0.98,0.95)*boxL(d, vec3(-0.3,1.0,0.2), vec2(0.6,0.05), 0.04);
  c += 2.0*vec3(0.9,0.95,1.0)*boxL(d, vec3(0.0,0.5,1.0), vec2(0.7,0.18), 0.12);
  return c;
}
vec3 env(vec3 d){
  float ca = cos(envRot), sa = sin(envRot); d.xz = mat2(ca,-sa,sa,ca)*d.xz;
  if (envMode == 1) return hue(envCity(d), envHue);
  float y = d.y;
  vec3 c = vec3(0.0015,0.002,0.004);
  // 天：地平线上一条浅蓝，往上很快沉成黑
  c += mix(vec3(0.42,0.70,1.0)*1.25, vec3(0.0), smoothstep(0.0, 0.30, y)) * step(0.0, y);
  // 地：地平线下一条暖橙，然后黑
  c += mix(vec3(1.0,0.46,0.14)*1.6, vec3(0.0), smoothstep(0.0, 0.14, -y)) * step(y, 0.0);
  c += vec3(1.0,0.92,0.82)*4.0*exp(-abs(y)*320.0);
  // 主光：左上大柔光箱；顶上一条长灯
  c += 8.0*vec3(1.0,0.98,0.96)*boxL(d, vec3(-0.6,0.8,0.6), vec2(0.34,0.13), 0.04);
  c += 3.0*vec3(1.0,0.99,0.97)*boxL(d, vec3(0.3,1.0,0.25), vec2(0.75,0.035), 0.02);
  // 色片：右边洋红竖条，左边电光青竖条
  c += 10.0*vec3(1.0,0.06,0.42)*boxL(d, vec3(1.0,0.16,0.05), vec2(0.09,0.55), 0.03);
  c += 8.0*vec3(0.0,0.62,1.0)*boxL(d, vec3(-1.0,0.12,0.0), vec2(0.08,0.55), 0.03);
  // 正面顶上一大块白（镜头后上方）：圆鼓鼓的字顶会接住一整片白
  c += 2.6*vec3(0.92,0.95,1.0)*boxL(d, vec3(-0.05,0.55,1.0), vec2(0.65,0.22), 0.12);
  // 正面：右前一盏暖色小灯；低位一条冷白（字的下缘高光）
  c += 4.0*vec3(1.0,0.75,0.45)*boxL(d, vec3(0.6,0.3,1.0), vec2(0.11,0.055), 0.02);
  c += 2.0*vec3(0.85,0.95,1.0)*boxL(d, vec3(-0.25,-0.2,1.0), vec2(0.9,0.025), 0.015);
  c = hue(c, envHue);
  return c;
}
vec3 backdrop(vec3 rd, vec2 sp){
  if (envMode == 1) return env(rd)*0.55;
  float g = smoothstep(-0.25, 0.6, rd.y);
  vec3 c = mix(bdBot, bdTop, g);
  vec2 q = sp - bdGlowPos; q.x *= 0.55;
  c += bdGlow * exp(-dot(q,q)*5.0);
  c += bdGlow * 0.35 * exp(-dot(q,q)*1.2);
  return c;
}
void main(){
  vec2 f = gl_FragCoord.xy / res;
  vec2 sp = (f - 0.5) * vec2(res.x/res.y, 1.0) + shift;
  vec3 fw = normalize(camTgt - camPos);
  vec3 rt = normalize(cross(fw, vec3(sin(roll),cos(roll),0)));
  vec3 up = cross(rt, fw);
  vec3 rd = normalize(fw + (sp.x*rt + sp.y*up) * 2.0*tan(fov*0.5));
  vec3 ro = camPos;
  vec3 col = vec3(0.0), thr = vec3(1.0);
  bool viaFloor = false;
  for(int b=0;b<4;b++){
    if (b >= maxBounce) { col += thr*env(rd)*0.5; break; }
    float tf = (floorOn > 0.5 && rd.y < -1e-4) ? (floorY - ro.y)/rd.y : 1e9;
    float t = march(ro, rd, min(tf, 60.0));
    if (t > 0.0){
      vec3 p = ro + rd*t; vec3 n = nrm(p, t);
      float cs = clamp(dot(n,-rd),0.0,1.0);
      vec3 F0 = tint;
      vec3 F = F0 + (1.0-F0)*pow(1.0-cs, 5.0);
      float a = (aoOn > 0 && b == 0) ? ao(p, n) : 1.0;
      thr *= F * mix(0.25, 1.0, a);
      if (seamAmt > 0.0 && b == 0) { vec3 q = grot*(p - gpos); float u = q.x*1.7, v = q.y*2.3 + 0.35*q.z; float e1 = min(fract(u), 1.0 - fract(u)), e2 = min(fract(v), 1.0 - fract(v));
        float sm = 1.0 - smoothstep(0.02, 0.07, min(e1, e2)); thr *= 1.0 - 0.9*seamAmt*sm; }
      ro = p + n*0.004; rd = reflect(rd, n);
      viaFloor = false;
      if (b == 3) col += thr*env(rd)*0.5;
      continue;
    }
    if (tf < 1e8){
      vec3 p = ro + rd*tf;
      vec3 n = vec3(0.0, 1.0, 0.0);
      if (nRip > 0) {
        float e = 0.004;
        float hx = ripH(p.xz + vec2(e,0)) - ripH(p.xz - vec2(e,0));
        float hz = ripH(p.xz + vec2(0,e)) - ripH(p.xz - vec2(0,e));
        n = normalize(vec3(-hx/(2.0*e), 1.0, -hz/(2.0*e)));
      }
      float cs = clamp(dot(n,-rd), 0.0, 1.0);
      vec3 F = floorTint + (1.0-floorTint)*pow(1.0-cs, 5.0);
      if (checker > 0.0) { vec2 cq = floor(p.xz*1.25); float ck = mod(cq.x + cq.y, 2.0); float fade = exp(-length(p.xz)*0.08);
        col += thr*(1.0 - F)*mix(vec3(0.004), vec3(0.32,0.33,0.36), ck)*checker*fade; }
      vec3 po = p + vec3(0,0.12,0);
#ifdef BG_ONLY
      float occ = 1.0;
#else
      float occ = (boxD(po, sceneLo, sceneHi) > 0.5) ? 1.0 : smoothstep(-0.05, 0.5, map(po));
#endif
      float fog = smoothstep(10.0, 30.0, length(p.xz - camPos.xz));
      col += thr * fog * backdrop(rd, sp);
      thr *= F * (1.0 - fog) * mix(0.6, 1.0, occ);
      ro = p + vec3(0,1e-3,0); rd = reflect(rd, n);
      viaFloor = true;
      continue;
    }
    col += thr * ((b == 0 || viaFloor) ? backdrop(rd, sp) : env(rd));
    break;
  }
  o = vec4(col, 1.0);
}`;

  // 把一段文字做成距离场纹理；返回 { tex, rect, pxWorld, bottom(x) }
  function textField(gl, { text, font, worldWidth, center = [0, 0], W = 3072, Hh = 1024, fit = 0.86, letterSpacing = 0, blur = 3 }) {
    const c = document.createElement('canvas'); c.width = W; c.height = Hh;
    const x = c.getContext('2d');
    let size = 400;
    x.font = font.replace('{S}', size + 'px');
    const spacing = s => (letterSpacing * s);
    const measure = () => { let w = 0; for (const ch of text) w += x.measureText(ch).width + spacing(size); return w - spacing(size); };
    const w0 = measure(); size = size * (W * fit) / w0;
    x.font = font.replace('{S}', size + 'px');
    x.fillStyle = '#000'; x.fillRect(0, 0, W, Hh);
    x.fillStyle = '#fff'; x.textBaseline = 'alphabetic';
    const tm = x.measureText(text);
    const asc = tm.actualBoundingBoxAscent, desc = tm.actualBoundingBoxDescent;
    const total = measure();
    let cx = (W - total) / 2; const by = Hh / 2 + (asc - desc) / 2;
    const glyphs = [];
    for (const ch of text) { const gw = x.measureText(ch).width; x.fillText(ch, cx, by); glyphs.push([cx, cx + gw]); cx += gw + spacing(size); }
    const img = x.getImageData(0, 0, W, Hh).data;
    const a = new Uint8Array(W * Hh);
    for (let i = 0; i < W * Hh; i++) a[i] = img[i * 4];
    const sdf = G.GLK.sdfFromAlpha(a, W, Hh);
    G.GLK.blurField(sdf, W, Hh, blur);
    // 纹理 y 翻转（GL 纹理原点在左下）
    const flip = new Float32Array(W * Hh);
    for (let y = 0; y < Hh; y++) flip.set(sdf.subarray((Hh - 1 - y) * W, (Hh - y) * W), y * W);
    const lin = !!gl.getExtension('OES_texture_float_linear');
    const tex = G.GLK.texture(gl, W, Hh, { internal: gl.R32F, format: gl.RED, type: gl.FLOAT, data: flip, filter: lin ? gl.LINEAR : gl.NEAREST }); tex.lin = lin;
    const pxWorld = worldWidth / W;
    const worldH = Hh * pxWorld;
    const rect = [center[0] - worldWidth / 2, center[1] - worldH / 2, worldWidth, worldH];
    // 每一列最低的实心点（世界坐标），用来挂水滴
    const bottom = (wx) => {
      const px = Math.round((wx - rect[0]) / pxWorld);
      if (px < 0 || px >= W) return null;
      for (let py = Hh - 1; py >= 0; py--) if (a[py * W + px] > 127) return rect[1] + (Hh - 1 - py) * pxWorld;
      return null;
    };
    const top = (wx) => {
      const px = Math.round((wx - rect[0]) / pxWorld);
      if (px < 0 || px >= W) return null;
      for (let py = 0; py < Hh; py++) if (a[py * W + px] > 127) return rect[1] + (Hh - 1 - py) * pxWorld;
      return null;
    };
    const glyphWorld = glyphs.map(([l, r]) => [rect[0] + l * pxWorld, rect[0] + r * pxWorld]);
    const capTop = rect[1] + (Hh - 1 - (by - asc)) * pxWorld, base = rect[1] + (Hh - 1 - by) * pxWorld;
    return { tex, rect, pxWorld, bottom, top, glyphs: glyphWorld, capTop, base, alpha: a, W, Hh };
  }

  function setScene(gl, P, s) {
    const u = P.u;
    if (!gl._prim) gl._prim = G.GLK.texture(gl, 64, 14, { internal: gl.RGBA32F, format: gl.RGBA, type: gl.FLOAT, data: null, filter: gl.NEAREST });
    const PD = new Float32Array(64 * 14 * 4);
    const put = (row, arr) => arr.slice(0, 64).forEach((v, i) => PD.set(v.slice(0, 4).concat([0, 0, 0, 0]).slice(0, 4), (row * 64 + i) * 4));
    const drips = s.drips || [], drops = s.drops || [], blobs = s.blobs || [], mt = s.mtar || [];
    put(0, drips.map(d => d[0])); put(1, drips.map(d => d[1]));
    put(2, drops.map(d => d.slice(0, 4))); put(3, drops.map(d => [...(d[4] || [1, 1, 1]), 0]));
    put(4, blobs.map(b => b.slice(0, 4))); put(5, blobs.map(b => [...(b[5] || [1, 1, 1]), b[4] ?? 0.3]));
    put(6, mt.map(m => m.slice(0, 4))); put(7, mt.map(m => [...(m[4] || [1, 1, 1]), 0]));
    put(8, s.pools || []); put(9, s.ripples || []); put(10, s.crowns || []); put(11, s.spikes || []);
    const caps = s.caps || []; put(12, caps.map(c => [...c[0], c[2]])); put(13, caps.map(c => [...c[1], 0]));
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, gl._prim);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 64, 14, gl.RGBA, gl.FLOAT, PD);
    gl.uniform1i(u.nCaps, Math.min(16, caps.length)); gl.uniform1f(u.capK, s.capK ?? 0.06);
    gl.uniform1i(u.obj, s.obj || 0); gl.uniform4fv(u.objP, s.objP || [1, 0, 0, 0]); gl.uniform1i(u.envMode, s.envMode || 0);
    gl.uniform4fv(u.gRise, s.gRise || [0, 0, 0, 0]); gl.uniform3fv(u.gSplit, s.gSplit || [-1e3, -1e3, -1e3]); gl.uniform1f(u.seamAmt, s.seam || 0); gl.uniform1f(u.checker, s.checker || 0);
    gl.uniform1i(u.primTex, 1);
    gl.uniform1i(u.nDrips, Math.min(32, drips.length)); gl.uniform1i(u.nDrops, Math.min(40, drops.length)); gl.uniform1i(u.nBlobs, Math.min(10, blobs.length)); gl.uniform1i(u.nMtar, Math.min(8, mt.length));
    gl.uniform1i(u.nPools, Math.min(8, (s.pools || []).length)); gl.uniform1i(u.nRip, Math.min(8, (s.ripples || []).length)); gl.uniform1i(u.nCrowns, Math.min(4, (s.crowns || []).length)); gl.uniform1i(u.nSpikes, Math.min(64, (s.spikes || []).length));
    gl.uniform1f(u.morph, s.morph ?? 0); gl.uniform1f(u.mtarK, s.mtarK ?? 0.2); gl.uniform3fv(u.morphSweep, s.morphSweep || [0, 1, 0]);
    const col = s.column; gl.uniform1f(u.colOn, col ? 1 : 0);
    if (col) { gl.uniform4fv(u.colA, [...col.a, col.r]); gl.uniform4fv(u.colB, [...col.b, 0]); gl.uniform1f(u.colAmp, col.amp || 0); gl.uniform1f(u.colLam, col.lam || 0.5); gl.uniform1f(u.colTaper, col.taper || 0); gl.uniform1f(u.colWob, col.wob || 0); }
    gl.uniform4fv(u.spikeC, s.spikeC || [0, 0, 0, 1]); gl.uniform1f(u.spikeK, s.spikeK ?? 0.1); gl.uniform1f(u.bwob, s.bwob ?? 0);
    gl.uniform1f(u.T, s.T ?? 0); gl.uniform1f(u.R, s.R ?? 0.12); gl.uniform1f(u.H, s.H ?? 0.06); gl.uniform1f(u.wob, s.wob ?? 0.008);
    gl.uniform3fv(u.camPos, s.cam.pos); gl.uniform3fv(u.camTgt, s.cam.tgt); gl.uniform1f(u.fov, s.cam.fov * Math.PI / 180); gl.uniform1f(u.roll, s.cam.roll || 0);
    gl.uniform1f(u.useText, s.text ? 1 : 0);
    gl.uniform1f(u.floorOn, s.floor === false ? 0 : 1); gl.uniform1f(u.floorY, s.floorY ?? 0);
    const bd = s.backdrop || {};
    gl.uniform3fv(u.bdTop, bd.top || [0.004, 0.006, 0.014]); gl.uniform3fv(u.bdBot, bd.bot || [0.012, 0.014, 0.03]);
    gl.uniform3fv(u.bdGlow, bd.glow || [0.02, 0.03, 0.08]); gl.uniform2fv(u.bdGlowPos, bd.glowPos || [0, 0.1]);
    gl.uniform1f(u.envHue, s.envHue || 0); gl.uniform1f(u.envRot, s.envRot || 0);
    gl.uniform3fv(u.tint, s.tint || [0.86, 0.87, 0.9]);
    gl.uniform3fv(u.floorTint, s.floorTint || [0.04, 0.04, 0.04]);
    const bb = (pts) => { if (!pts.length) return [[0, 0, 0], [0, 0, 0]]; const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
      for (const [x, y, z, r] of pts) { lo[0] = Math.min(lo[0], x - r); lo[1] = Math.min(lo[1], y - r); lo[2] = Math.min(lo[2], z - r); hi[0] = Math.max(hi[0], x + r); hi[1] = Math.max(hi[1], y + r); hi[2] = Math.max(hi[2], z + r); } return [lo, hi]; };
    const [dl, dh] = bb(drips.flatMap(d => [d[0], d[1]])); gl.uniform3fv(u.bbDripLo, dl); gl.uniform3fv(u.bbDripHi, dh);
    const [ol, oh] = bb(drops.map(d => [d[0], d[1], d[2], d[3] * Math.max(...(d[4] || [1, 1, 1]))])); gl.uniform3fv(u.bbDropLo, ol); gl.uniform3fv(u.bbDropHi, oh);
    const [bl, bh] = bb(blobs.map(b => [b[0], b[1], b[2], b[3] * Math.max(...(b[5] || [1, 1, 1])) + (s.bwob || 0)])); gl.uniform3fv(u.bbBlobLo, bl); gl.uniform3fv(u.bbBlobHi, bh);
    const sp = s.spikes || []; gl.uniform4fv(u.bbSpike, [0, 0, 0, (s.spikeC || [0, 0, 0, 1])[3] + Math.max(0, ...sp.map(x => x[3])) + 0.02]);
    gl.uniform1f(u.poolTop, Math.max(0.08, ...(s.crowns || []).map(c => c[3] * 1.3 + 0.05)));
    // 整个场景的世界包围盒（局部的东西按 yaw / gpos 变到世界里）
    { const loc = [], wor = [];
      if (s.text) { const r = s.text.rect, zz = (s.H ?? 0.06) + (s.R ?? 0.12) + 0.1; loc.push([r[0], r[1], -zz, 0], [r[0] + r[2], r[1] + r[3], zz, 0]); }
      drips.forEach(d => loc.push(d[0], d[1])); drops.forEach(d => loc.push([d[0], d[1], d[2], d[3] * Math.max(...(d[4] || [1, 1, 1]))]));
      blobs.forEach(b => loc.push([b[0], b[1], b[2], b[3] * Math.max(...(b[5] || [1, 1, 1])) + (s.bwob || 0) + 0.05]));
      (s.mtar || []).forEach(m => loc.push([m[0], m[1], m[2], m[3] * Math.max(...(m[4] || [1, 1, 1])) + 0.05]));
      if (s.column) { loc.push([...s.column.a, s.column.r + 0.05], [...s.column.b, s.column.r + 0.05]); }
      (s.caps || []).forEach(c => loc.push([...c[0], c[2] * 1.1 + 0.05], [...c[1], c[2] * 1.1 + 0.05]));
      if (s.obj === 1) loc.push([0, -0.6, 0, 0.5], [0, 4.4 * (1 - 0.85 * (s.objP[1] || 0)), 0, 0.5]);
      if (s.obj === 4) { const k = s.objP[0]; loc.push([-2.5 * k, 0, -1.4 * k, 0.05], [2.5 * k, 2.45 * k, 1.4 * k, 0.05]); }
      if (s.text && s.gRise) { const r = s.text.rect, lo = Math.min(...s.gRise), hi = Math.max(...s.gRise); loc.push([r[0], r[1] + lo, 0, 0.5], [r[0] + r[2], r[1] + r[3] + hi, 0, 0.5]); }
      if ((s.spikes || []).length) { const c = s.spikeC; loc.push([c[0], c[1], c[2], c[3] + Math.max(...s.spikes.map(x => x[3])) + 0.05]); }
      (s.crowns || []).forEach(c => wor.push([c[0], (s.floorY ?? 0) + c[3] * 0.7, c[1], c[2] * 1.6 + c[3]]));
      (s.pools || []).forEach(p => wor.push([p[0], (s.floorY ?? 0), p[1], p[2] + 0.2]));
      const g = s.gpos || [0, 0, 0], yw = s.yaw || 0, c = Math.cos(yw), sn = Math.sin(yw);
      for (const [x, y, z, r] of loc) for (const dx of [-r, r]) for (const dz of [-r, r]) for (const dy of [-r, r]) { const X = x + dx, Z = z + dz; wor.push([c * X + sn * Z + g[0], y + dy + g[1], -sn * X + c * Z + g[2], 0]); }
      if (!wor.length) wor.push([0, -100, 0, 0.001]);
      const [lo, hi] = bb(wor); const m = 0.08;
      gl.uniform3fv(u.sceneLo, lo.map(v => v - m)); gl.uniform3fv(u.sceneHi, hi.map(v => v + m)); s._bb = [lo.map(v => v - m), hi.map(v => v + m), wor.length === 1 && wor[0][1] === -100]; }
    gl.uniform1i(u.maxBounce, s.bounces ?? 4); gl.uniform1i(u.aoOn, s.ao === false ? 0 : 1);
    const yaw = s.yaw || 0, cy = Math.cos(yaw), sy = Math.sin(yaw);
    // 世界 → 局部：绕 y 轴转 -yaw（列主序）
    gl.uniformMatrix3fv(u.grot, false, new Float32Array([cy, 0, -sy, 0, 1, 0, sy, 0, cy]));
    gl.uniform3fv(u.gpos, s.gpos || [0, 0, 0]);
    if (!s.text) { // 没有字：解绑 0 号纹理单元，免得和渲染目标形成反馈回路
      if (!gl._dummy) gl._dummy = G.GLK.texture(gl, 1, 1, { internal: gl.R32F, format: gl.RED, type: gl.FLOAT, data: new Float32Array([1]), filter: gl.NEAREST });
      G.GLK.bindTex(gl, P, 'sdfTex', gl._dummy, 0);
    }
    if (s.text) {
      G.GLK.bindTex(gl, P, 'sdfTex', s.text.tex, 0);
      gl.uniform4fv(u.texRect, s.text.rect); gl.uniform1f(u.pxWorld, s.text.pxWorld); gl.uniform1i(u.fastBicubic, s.text.tex.lin ? 1 : 0);
    }
  }

  // 两套程序：完整版 + 只画背景和地面的“背景版”（同一份代码，编译期去掉步进）
  function programs(gl) {
    const full = G.GLK.program(gl, FS);
    const bg = G.GLK.program(gl, FS.replace('precision highp float;', 'precision highp float;\n#define BG_ONLY 1'));
    full.bg = bg; return full;
  }
  // 场景包围盒（以及它在地面镜子里的倒影、地上的波纹）投到屏幕上的矩形
  function screenRect(s, W, H) {
    if (!s._bb) return [0, 0, W, H];
    const [lo, hi, empty] = s._bb; if (empty) return null;
    const fy = s.floorY ?? 0, pts = [];
    for (const x of [lo[0], hi[0]]) for (const y of [lo[1], hi[1]]) for (const z of [lo[2], hi[2]]) { pts.push([x, y, z]); if (s.floor !== false) pts.push([x, 2 * fy - y, z]); }
    const c = s.cam, fw = norm3(sub3(c.tgt, c.pos));
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of pts) { const v = sub3(p, c.pos); if (dot3(v, fw) < 0.3) return [0, 0, W, H];
      const [px, py] = project(s, p, W, H); x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py); }
    const m = 6; x0 = Math.max(0, Math.floor(x0 - m)); y0 = Math.max(0, Math.floor(y0 - m)); x1 = Math.min(W, Math.ceil(x1 + m)); y1 = Math.min(H, Math.ceil(y1 + m));
    if (x1 <= x0 || y1 <= y0) return null;
    return [x0, H - y1, x1 - x0, y1 - y0]; // GL 的 y 从下往上
  }
  const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], norm3 = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
  async function render(gl, P, target, s, tiles = 8) {
    const run = (prog, rect) => {
      gl.useProgram(prog); setScene(gl, prog, s); gl.uniform2f(prog.u.res, target.w, target.h); gl.uniform2fv(prog.u.shift, s.shift || [0, 0]);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb); gl.viewport(0, 0, target.w, target.h);
      if (rect) { gl.enable(gl.SCISSOR_TEST); gl.scissor(...rect); }
      gl.bindVertexArray(gl._tri); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.disable(gl.SCISSOR_TEST);
    };
    if (!P.bg) { gl.useProgram(P); setScene(gl, P, s); gl.uniform2f(P.u.res, target.w, target.h); gl.uniform2fv(P.u.shift, s.shift || [0, 0]); await G.GLK.drawTiled(gl, target, tiles); return; }
    gl.useProgram(P); setScene(gl, P, s); // 先算一次包围盒
    run(P.bg, null);
    if (s._bgOnly) return;
    const r = screenRect(s, target.w, target.h);
    if (r) {
      // 矩形再切成几块，块与块之间让出主线程
      const n = Math.max(1, Math.round(Math.sqrt(tiles))), tw = Math.ceil(r[2] / n), th = Math.ceil(r[3] / n);
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { run(P, [r[0] + i * tw, r[1] + j * th, Math.min(tw, r[0] + r[2] - (r[0] + i * tw)), Math.min(th, r[1] + r[3] - (r[1] + j * th))]); gl.finish(); await G.GLK.tick(); }
    }
    s._rect = r;
  }

  // 环境贴图小样（等距柱状投影）：让设计师看到“铬的颜色从哪来”
  const ENV_FS = `#version 300 es
precision highp float; in vec2 uv; out vec4 o; uniform float envHue, envRot;
` + FS.slice(FS.indexOf('vec3 hue(vec3 c, float a)'), FS.indexOf('vec3 backdrop(vec3 rd, vec2 sp)')) + `
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.,1.); }
void main(){
  float lon = (uv.x - 0.5)*6.2831853 + 3.14159265, lat = (uv.y - 0.5)*3.14159265;
  vec3 d = vec3(cos(lat)*sin(lon), sin(lat), cos(lat)*cos(lon));
  o = vec4(pow(aces(env(d)*1.25), vec3(1.0/2.2)), 1.0);
}`;
  function envPreview(canvas, s) {
    const gl = G.GLK.create(canvas, { preserveDrawingBuffer: true });
    const P = G.GLK.program(gl, ENV_FS);
    gl.useProgram(P); gl.uniform1f(P.u.envHue, s.envHue || 0); gl.uniform1f(P.u.envRot, s.envRot || 0);
    G.GLK.draw(gl, null);
  }
  // 世界坐标 → 屏幕像素（和着色器里的相机完全一致）
  function project(s, P, Wpx, Hpx) {
    const c = s.cam, f = [c.tgt[0] - c.pos[0], c.tgt[1] - c.pos[1], c.tgt[2] - c.pos[2]];
    const n = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const fw = n(f), rt = n(cross(fw, [0, 1, 0])), up = cross(rt, fw);
    const v = [P[0] - c.pos[0], P[1] - c.pos[1], P[2] - c.pos[2]];
    const k = 2 * Math.tan(c.fov * Math.PI / 360), a = dot(v, fw);
    const sx = dot(v, rt) / a / k - (s.shift || [0, 0])[0], sy = dot(v, up) / a / k - (s.shift || [0, 0])[1];
    return [(sx / (Wpx / Hpx) + 0.5) * Wpx, (0.5 - sy) * Hpx];
  }
  // 字的局部坐标 → 世界（绕 y 轴转 yaw）
  function toWorld(s, p) { const y = s.yaw || 0, g = s.gpos || [0, 0, 0];
    return [Math.cos(y) * p[0] + Math.sin(y) * p[2] + g[0], p[1] + g[1], -Math.sin(y) * p[0] + Math.cos(y) * p[2] + g[2]]; }

  G.CHROME = { FS, programs, textField, render, setScene, envPreview, project, toWorld, screenRect };
})(window);
