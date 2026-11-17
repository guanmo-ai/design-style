// 果冻软糖渲染器 · 着色器
// 一条光线：打到软糖 → 菲涅尔反射天空 + 折射进去（走内部算真实路径长）→ 比尔–朗伯吸收（越厚越深）
//          + 沿内部路径收集被散射的太阳光（逆光时整颗糖从里面亮起来）→ 从背面折射出去，看见后面的地面 / 天空
// 地面：太阳光穿过软糖 → 彩色的影子 + 中间聚起来的焦散（凸透镜）；低机位的光滑地面反射软糖
window.GUMMY_FS = (NOBJ) => `#version 300 es
precision highp float;
precision highp int;
in vec2 uv; out vec4 o;
#define NOBJ ${NOBJ}
uniform vec2 res, jitter;
uniform vec3 camPos, camTgt, sunDir, sunCol;
uniform float fov, focusDist, time;
uniform vec3 oPos[NOBJ];      // 物体原点（脚底中心）
uniform mat3 oRot[NOBJ];      // 世界 → 物体的旋转
uniform vec4 oShape[NOBJ];    // x 缩放, y 压扁 s, z 头部滞后(前后), w 类型 0熊 1圈 2滴 3方块
uniform vec4 oShape2[NOBJ];   // x 侧向滞后, y 方块圆角/圈粗, z,w 备用
uniform vec4 oMat[NOBJ];      // rgb 吸收系数 σa（每单位长度）, w 散射 σs
uniform vec4 oBound[NOBJ];    // 包围球 xyz 中心, w 半径
uniform vec3 skyHor, skyZen, skyBack, floorCol;
uniform float floorGloss;
uniform int dbg;

const float IOR = 1.46;

// ———— 距离函数 ————
float sdEll(vec3 p, vec3 r){ float k0 = length(p/r); float k1 = length(p/(r*r)); return k0*(k0-1.0)/max(k1,1e-5); }
float sdCap(vec3 p, vec3 a, vec3 b, float r){ vec3 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return length(pa-ba*h)-r; }
float smin(float a, float b, float k){ float h=max(k-abs(a-b),0.)/k; return min(a,b)-h*h*k*0.25; }
float smax(float a, float b, float k){ return -smin(-a,-b,k); }
float sdRBox(vec3 p, vec3 b, float r){ vec3 q=abs(p)-b+r; return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.)-r; }

// 一只原创的胖熊：身高 2，脚底在原点，面朝 +z
float bear(vec3 p){
  p.x = abs(p.x);
  float d = sdEll(p-vec3(0.,0.70,0.), vec3(0.58,0.64,0.42));                    // 身体
  d = smin(d, sdEll(p-vec3(0.,1.47,0.01), vec3(0.52,0.45,0.40)), 0.20);        // 头
  d = smin(d, sdEll(p-vec3(0.35,1.85,-0.02), vec3(0.18,0.17,0.13)), 0.10);     // 耳朵
  d = smin(d, sdEll(p-vec3(0.,1.36,0.33), vec3(0.22,0.15,0.13)), 0.10);        // 鼻吻
  d = smin(d, sdCap(p, vec3(0.42,1.04,0.08), vec3(0.64,0.74,0.22), 0.16), 0.12); // 手
  d = smin(d, sdEll(p-vec3(0.31,0.21,0.12), vec3(0.24,0.22,0.28)), 0.12);      // 脚
  d = smax(d, -sdEll(p-vec3(0.20,1.56,0.395), vec3(0.055,0.06,0.03)), 0.04);   // 眼窝（浅）
  return d;
}

float objLocal(int i, vec3 q){
  float ty = oShape[i].w;
  if (ty < 0.5) return bear(q);
  if (ty < 1.5) { vec3 c = q - vec3(0.,0.32,0.); vec2 t = vec2(length(c.xz)-0.62, c.y); return length(t/vec2(1.,0.92))-oShape2[i].y; }
  if (ty < 2.5) return sdEll(q-vec3(0.,0.45,0.), vec3(0.45,0.45,0.45));
  return sdRBox(q-vec3(0.,0.5,0.), vec3(0.62,0.5,0.62), oShape2[i].y);
}

float mapObj(int i, vec3 p){
  vec3 q = oRot[i]*(p - oPos[i]);
  float sc = oShape[i].x, s = oShape[i].y;
  q /= sc;
  q.y /= s; q.xz *= sqrt(s);                               // 压扁：体积守恒
  float hy = max(q.y, 0.);
  q.z -= oShape[i].z * hy*hy*0.25;                         // 上半身滞后（晃动）
  q.x -= oShape2[i].x * hy*hy*0.25;
  float d = objLocal(i, q) * sc * min(s, inversesqrt(s)) * 0.85;
  return max(d, -p.y);
}

uint gMask;   // 这条光线可能碰到的物体
vec2 mapScene(vec3 p){
  float d = 1e9, id = -1.;
  for (int i=0;i<NOBJ;i++){
    if (((gMask>>uint(i))&1u)==0u) continue;
    float b = length(p-oBound[i].xyz)-oBound[i].w;
    float di = b > 0.25 ? b : mapObj(i,p);
    if (di < d){ d = di; id = float(i); }
  }
  return vec2(d,id);
}
float gT0;   // rayMask 顺便算出的最近入口
uint rayMask(vec3 ro, vec3 rd){
  uint m = 0u; gT0 = 1e9;
  for (int i=0;i<NOBJ;i++){
    vec3 oc = ro - oBound[i].xyz; float b = dot(oc,rd); float c = dot(oc,oc) - oBound[i].w*oBound[i].w;
    float h = b*b - c;
    if (h > 0. && (-b + sqrt(h)) > 0.){ m |= (1u<<uint(i)); gT0 = min(gT0, max(-b - sqrt(h), 0.)); }
  }
  return m;
}
vec3 nrmObj(int i, vec3 p){
  const vec2 e = vec2(1.,-1.)*0.0015;
  return normalize(e.xyy*mapObj(i,p+e.xyy)+e.yyx*mapObj(i,p+e.yyx)+e.yxy*mapObj(i,p+e.yxy)+e.xxx*mapObj(i,p+e.xxx));
}

// ———— 噪声：糖面上手工做出来的细小起伏 ————
float hash3(vec3 p){ p = fract(p*0.3183099+.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vnoise(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
  return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z); }
vec3 bumpN(vec3 n, vec3 p, float amt){
  vec3 q = p*7.0; float e = 0.05;
  float b0 = vnoise(q)+0.5*vnoise(q*2.3);
  vec3 g = vec3(vnoise(q+vec3(e,0,0))+0.5*vnoise((q+vec3(e,0,0))*2.3), vnoise(q+vec3(0,e,0))+0.5*vnoise((q+vec3(0,e,0))*2.3), vnoise(q+vec3(0,0,e))+0.5*vnoise((q+vec3(0,0,e))*2.3)) - b0;
  g /= e; g -= n*dot(g,n);
  return normalize(n - g*amt);
}

// ———— 天空：魔幻时刻（《天国之日》）——太阳低低地压在地平线上，在主角身后 ————
vec3 skyN(vec3 d, float disk){
  float sd = max(dot(d, sunDir), 0.);
  float e = max(d.y, 0.);
  vec3 base = mix(skyHor, skyZen, smoothstep(0.0, 0.22, e));
  float toward = smoothstep(-0.5, 1.0, dot(normalize(vec3(d.x,0.,d.z)+1e-4), normalize(vec3(sunDir.x,0.,sunDir.z))));
  base = mix(skyBack, base, toward);
  float band = exp(-e*14.0);                                   // 贴着地平线的一条暖光
  base += sunCol*band*(0.012*pow(sd, 4.0) + 0.05*pow(sd, 24.0));
  base += sunCol*(0.08*pow(sd, 160.0) + 0.6*pow(sd, 2400.0));
  base += disk * sunCol * 5.0 * smoothstep(0.99985, 0.99993, sd);   // 日轮
  return base;
}
vec3 sky(vec3 d){ return skyN(d, 1.0); }
vec3 env(vec3 d){
  if (d.y >= 0.) return sky(d);
  // 往下看到的远处地面：带着天空颜色的雾
  vec3 fl = floorCol * (sunCol*0.25*max(sunDir.y,0.) + skyZen*0.6);
  return mix(fl, skyHor*0.9, exp(d.y*14.0));
}

// ———— 远处的软糖田（《天国之日》的麦田）：地上按格子重复的小糖，只做虚化背景里的一盏盏灯 ————
uniform float fieldNear, fieldCell;
vec3 hash32(vec2 c){ vec3 p = fract(vec3(c.xyx)*vec3(.1031,.1030,.0973)); p += dot(p, p.yxz+33.33); return fract((p.xxy+p.yzz)*p.zyx); }
vec3 palette(float h){
  if (h < 0.22) return vec3(0.6, 2.4, 2.6);   // 红
  if (h < 0.42) return vec3(0.06, 0.9, 3.4);  // 橙
  if (h < 0.58) return vec3(0.05, 0.2, 2.9);  // 柠檬
  if (h < 0.74) return vec3(2.2, 0.3, 2.0);   // 绿
  if (h < 0.88) return vec3(0.4, 2.6, 0.9);   // 树莓
  return vec3(1.4, 2.4, 0.5);                 // 葡萄
}
float fieldSDF(vec3 p, out vec3 info){
  float cs = fieldCell;
  vec2 c = floor(p.xz/cs);
  vec3 h = hash32(c);
  vec2 ctr = (c+0.5)*cs + (h.xy-0.5)*cs*0.45;
  float r = cs*(0.13 + 0.07*h.z);
  vec3 q = p - vec3(ctr.x, r*0.78, ctr.y);
  float d = sdEll(q, vec3(r, r*0.78, r));
  bool on = h.z*h.x < 0.55 && ctr.y < fieldNear;
  if (!on) d = 1e9;
  vec2 fr = p.xz - c*cs; vec2 bd = min(fr, cs-fr);
  info = vec3(h.y, r, 0.);
  return min(d, min(bd.x, bd.y) + 0.05);
}
// 打到软糖田：返回颜色 + 距离（没打到 w < 0）
vec4 traceField(vec3 ro, vec3 rd, float tmax){
  if (rd.z > -0.05 || ro.y > 3.0 && rd.y > 0.) return vec4(-1.);
  float t = max(0., (fieldNear + 0.5 - ro.z)/rd.z);
  if (ro.y + rd.y*t > 1.2 && rd.y >= 0.) return vec4(-1.);
  vec3 info;
  for (int k=0;k<56;k++){
    vec3 p = ro+rd*t;
    if (p.y > 1.0 && rd.y > 0.) break;
    float d = fieldSDF(p, info);
    if (d < 0.002*t){
      // 简化着色：逆光透过一颗小糖（厚度用球的弦长估）+ 一点反射
      vec3 sig = palette(info.x);
      float th = info.y*1.3;
      float ph = 0.3 + 2.5*pow(max(dot(rd, sunDir),0.), 6.0);
      vec3 c = sunCol*0.09*ph*exp(-sig*th) + skyHor*0.25*exp(-sig*th*2.0);
      float fog = 1.0 - exp(-t*0.035);
      return vec4(mix(c, skyHor, fog*0.8), t);
    }
    t += d;
    if (t > tmax) break;
  }
  return vec4(-1.);
}

// 一条在物体内部的线段穿过多长（从 p 往 dir 走到出去）
float thickness(int i, vec3 p, vec3 dir){
  float t = 0.;
  float d = 0.;
  for (int k=0;k<40;k++){ d = -mapObj(i, p+dir*t); if (d < 0.0015) break; t += max(d, 0.03); }
  return t + d;
}

// 粗估厚度：沿方向固定步长取 8 个点，数有几个在里面（散射用，不需要精确）
float thickFast(int i, vec3 p, vec3 dir){
  float n = 0.;
  for (int k=0;k<8;k++){ float d = mapObj(i, p + dir*(0.06 + 0.16*float(k))); n += clamp(0.5 - d/0.08, 0., 1.); }
  return n*0.16;
}
// 远处软糖田透过软糖看到的样子：已经是虚的，只剩一条五颜六色的柔光带
vec3 fieldGlow(vec3 rd){
  if (fieldNear >= 0.) return vec3(0.);
  float band = exp(-pow((rd.y + 0.03)/0.035, 2.0)) * step(rd.z, 0.);
  float az = atan(rd.x, -rd.z);
  vec3 c = 0.5 + 0.5*cos(6.2831*(vec3(0.0,0.33,0.67) + az*3.0 + vnoise(vec3(az*14.0,0.,0.))));
  c = mix(vec3(1.0,0.55,0.2), c, 0.45);
  return c * band * (0.25 + 0.6*pow(max(dot(rd, sunDir),0.),4.0)) * sunCol * 0.03;
}

// 太阳光到达地面一点：穿过所有挡着的软糖（彩色），带焦散
vec3 sunThrough(vec3 q){
  vec3 L = sunDir; vec3 T = vec3(1.);
  uint m = rayMask(q, L);
  if (m == 0u) return T;
  for (int i=0;i<NOBJ;i++){
    if (((m>>uint(i))&1u)==0u) continue;
    vec3 oc = q - oBound[i].xyz; float bb = dot(oc,L); float hh = bb*bb - dot(oc,oc) + oBound[i].w*oBound[i].w;
    float t = max(0.01, -bb - sqrt(hh)), t1 = -bb + sqrt(hh), hit = -1.;
    for (int k=0;k<40;k++){
      float d = mapObj(i, q+L*t);
      if (d < 0.0015){ hit = t; break; }
      t += max(d, 0.01);
      if (t > t1) break;
    }
    if (hit < 0.){ continue; }
    vec3 pe = q+L*hit;                        // 光离开软糖的那一点（从光的方向看是出口）
    vec3 ne = nrmObj(i, pe);
    float th = thickness(i, pe - ne*0.004, L);
    vec3 sig = oMat[i].rgb + oMat[i].w*0.55;
    vec3 tr = exp(-sig*th);
    // 凸透镜：光从正对太阳的那一片出来时被聚拢，边缘被折走 → 中间亮、边缘暗
    // 出口面上的细小起伏把光拧成一条条亮丝（《银翼杀手 2049》华莱士办公室墙上的水光）
    vec3 nb = bumpN(ne, oRot[i]*(pe-oPos[i])*0.45, 0.22);
    float c = max(dot(nb, -L), 0.), c0 = max(dot(ne, -L), 0.);
    float focus = mix(0.2, 2.2, pow(c0, 2.0)) * (0.55 + 1.6*pow(c, 14.0));
    T *= tr*focus*0.85 + oMat[i].w*0.06;      // 散射出来的那一点点漫射光
  }
  return T;
}

float floorAO(vec3 q){
  float ao = 1.;
  uint m = gMask; gMask = 0xffffffffu;
  for (int k=1;k<=4;k++){ float h = 0.09*float(k); float d = mapScene(q+vec3(0,h,0)).x; ao -= (h-max(d,0.))*0.45/float(k); }
  gMask = m;
  return clamp(ao, 0., 1.);
}

vec3 shadeFloorDirect(vec3 q, vec3 rd){
  vec3 sunL = sunCol * max(sunDir.y, 0.) * sunThrough(q);
  vec3 amb = (skyZen*1.2 + skyHor*0.12) * floorAO(q);
  vec3 c = floorCol * (sunL + amb);
  // 缎面的高光：低太阳擦过地面
  vec3 h = normalize(sunDir - rd);
  c += sunCol * 0.04 * pow(max(h.y,0.), 120.) * sunThrough(q);
  float dist = length(q - camPos);
  return mix(c, skyHor*0.9, 1.0-exp(-max(dist-7.0,0.)*0.035));
}


vec3 traceSecondary(vec3 ro, vec3 rd, int skip){
  // 第二级：出射光线看见的东西——其它软糖（只取颜色）、地面、天空
  gMask = rayMask(ro, rd);
  if (skip >= 0) gMask &= ~(1u<<uint(skip));
  float tF = rd.y < -1e-4 ? max(-ro.y/rd.y, 0.) : 1e9;
  float t = max(0.02, gT0); int id = -1;
  if (gMask != 0u){
    for (int k=0;k<64;k++){ vec2 h = mapScene(ro+rd*t); if (h.x < 0.002){ id = int(h.y); break; } t += h.x; if (t > min(tF, 30.)) break; }
  }
  if (id >= 0 && t < tF){
    vec3 p = ro+rd*t; vec3 n = nrmObj(id, p);
    float F = 0.04 + 0.96*pow(1.0-max(dot(n,-rd),0.), 5.0);
    vec3 refl = env(reflect(rd,n));
    // 近似：里面是厚度决定的颜色，背光加亮
    float th = thickness(id, p - n*0.004, refract(rd, n, 1.0/IOR));
    vec3 sig = oMat[id].rgb + oMat[id].w;
    vec3 glow = sunCol * 0.06 * exp(-sig*th*0.6) * (0.4 + 2.0*pow(max(dot(rd, sunDir),0.),4.));
    vec3 behind = env(rd) * exp(-sig*th);
    return mix(behind + glow, refl, F);
  }
  if (tF < 1e8){
    vec3 q = ro+rd*tF; vec3 c = shadeFloorDirect(q, rd);
    float Ff = 0.03 + 0.97*pow(1.0-max(-rd.y,0.), 5.0);
    return mix(c, skyN(reflect(rd, vec3(0,1,0)), 0.0), floorGloss*Ff) + fieldGlow(rd)*smoothstep(4.0, 9.0, tF);
  }
  return env(rd) + fieldGlow(rd);
}

float hg(float c, float g){ float g2=g*g; return (1.-g2)/(12.566*pow(1.+g2-2.*g*c, 1.5)); }

vec3 shadeGummy(int i, vec3 p, vec3 n0, vec3 rd){
  vec3 n = bumpN(n0, oRot[i]*(p-oPos[i]), 0.012);
  float cosi = max(dot(n,-rd), 0.);
  float F = 0.035 + 0.965*pow(1.0-cosi, 5.0);
  vec3 sigA = oMat[i].rgb; float sigS = oMat[i].w; vec3 sigT = sigA + sigS;

  // —— 反射：天空 + 前方一块看不见的柔光窗（商业食品摄影的那道长高光）——
  vec3 R = reflect(rd, n);
  vec3 refl = env(R);
  vec3 win = normalize(vec3(-0.55, 0.62, 0.56));
  float wv = smoothstep(0.965, 0.975, dot(R, win));
  refl += vec3(1.0,0.93,0.86) * 2.5 * wv;
  // 一条细长的竖向柔光（左前方），在曲面上拉成一道
  vec3 Rl = R; float strip = smoothstep(0.08, 0.02, abs(Rl.x + 0.62)) * smoothstep(-0.1, 0.25, Rl.y) * step(0., Rl.z);
  refl += vec3(1.0,0.95,0.9) * 1.6 * strip;
  vec3 rim = normalize(vec3(0.75, 0.35, 0.55));
  refl += vec3(0.6,0.75,1.0) * 1.2 * smoothstep(0.93, 0.97, dot(R, rim));

  // —— 折射进去，走内部 ——
  vec3 T = refract(rd, n0, 1.0/IOR);
  vec3 pin = p - n0*(max(mapObj(i,p),0.)/0.85 + 0.006);
  float L = thickness(i, pin, T);
  vec3 pe = pin + T*L;
  vec3 ne = nrmObj(i, pe);

  // 沿内部路径收集太阳的散射光（逆光时从里面亮起来）
  vec3 scat = vec3(0.);
  float ph = hg(dot(rd, sunDir), 0.62) * 0.8 + 0.6/12.566;   // 前向为主 + 多次散射的各向同性部分
  const int NS = 3;
  for (int k=0;k<NS;k++){
    float tk = L*(float(k)+0.5)/float(NS);
    vec3 x = pin + T*tk;
    float ts = thickFast(i, x, sunDir);
    vec3 att = exp(-sigT*(ts + tk));
    scat += att * (L/float(NS));
  }
  scat *= sunCol * sigS * ph;
  // 天光的多次散射：让背光的一面也是“亮着的糖”，不是黑的
  scat += (skyZen*0.6 + skyHor*0.4) * sigS * 0.35 * (1.0 - exp(-sigT*L*0.5)) / max(sigT, vec3(1e-3));

  // 出射：背面再折射一次（全反射就用反射方向）
  vec3 T2 = refract(T, -ne, IOR);
  if (dot(T2,T2) < 1e-4){
    vec3 Tb = reflect(T, ne);
    float L2 = thickness(i, pe - ne*0.006, Tb);
    vec3 pe2 = pe - ne*0.006 + Tb*L2; vec3 ne2 = nrmObj(i, pe2);
    L += L2; pe = pe2; ne = ne2; T = Tb;
    T2 = refract(T, -ne, IOR);
    if (dot(T2,T2) < 1e-4) T2 = reflect(T, ne);
  }
  vec3 behind = traceSecondary(pe + ne*0.004, T2, i);
  vec3 trans = behind * exp(-sigT*L);
  // 内部的气泡和杂质：几粒细小的亮点
  float sp = 0.;
  for (int k=0;k<3;k++){
    vec3 x = (oRot[i]*(pin + T*L*(0.25+0.25*float(k)) - oPos[i]))*9.0;
    vec3 ci = floor(x); vec3 cf = fract(x) - 0.5 - (vec3(hash3(ci), hash3(ci+7.1), hash3(ci+3.3))-0.5)*0.6;
    sp += step(0.975, hash3(ci+11.7)) * smoothstep(0.06, 0.0, length(cf));
  }
  vec3 bubbles = sp * sunCol * 0.012 * exp(-sigT*L*0.5);

  vec3 body = trans + scat + bubbles;
  if (dbg==1) return vec3(L*0.4);
  if (dbg==2) return scat;
  if (dbg==3) return trans;
  if (dbg==4) return vec3(F);

  // 太阳的直接高光（逆光：只在边缘的曲面上出现）+ 柔光窗
  vec3 H = normalize(sunDir - rd);
  vec3 spec = sunCol * 0.9 * pow(max(dot(n,H),0.), 900.0) + sunCol*0.12*pow(max(dot(n,H),0.), 160.0) + sunCol*0.02*pow(max(dot(n,H),0.), 30.0);

  return mix(body, refl, F) + spec*F*8.0;
}

void main(){
  vec2 fc = gl_FragCoord.xy + jitter;
  vec2 sp = (fc - 0.5*res)/res.y;
  vec3 fw = normalize(camTgt-camPos), rt = normalize(cross(fw, vec3(0,1,0))), up = cross(rt, fw);
  float f = 1.0/tan(radians(fov)*0.5);
  vec3 rd = normalize(fw*f + rt*sp.x*2.0 + up*sp.y*2.0);
  vec3 ro = camPos;

  gMask = rayMask(ro, rd);
  float tF = rd.y < -1e-4 ? -ro.y/rd.y : 1e9;
  float t = max(0.05, gT0); int id = -1;
  if (gMask != 0u){
    for (int k=0;k<110;k++){ vec2 h = mapScene(ro+rd*t); if (h.x < 0.0008*t){ id = int(h.y); break; } t += h.x; if (t > min(tF, 40.)) break; }
  }
  vec3 col; float depth; vec4 fld;
  if (id >= 0 && t < tF){
    vec3 p = ro+rd*t;
    col = shadeGummy(id, p, nrmObj(id,p), rd);
    depth = t;
  } else if (fieldNear < 0. && (fld = traceField(ro, rd, min(tF, 60.))).w > 0.){
    col = fld.rgb; depth = fld.w;
  } else if (tF < 1e8){
    vec3 q = ro+rd*tF;
    col = shadeFloorDirect(q, rd);
    // 光滑地面：低机位时反射很强
    vec3 rr = reflect(rd, vec3(0,1,0));
    float Ff = 0.03 + 0.97*pow(1.0-max(-rd.y,0.), 5.0);
    float w = floorGloss*Ff;
    if (w > 0.01){
      uint mm = rayMask(q, rr);
      gMask = mm;
      float tt = max(0.01, gT0); int rid = -1;
      if (mm != 0u){ for (int k=0;k<70;k++){ vec2 h = mapScene(q+rr*tt); if (h.x < 0.002){ rid=int(h.y); break;} tt += h.x; if (tt>20.) break; } }
      vec3 rc;
      if (rid >= 0){ rc = traceSecondary(q + rr*0.002, rr, -1); }
      else {
        rc = skyN(rr, 0.0);
        // 略粗糙的湿地面把太阳拉成一条竖直的光带（落日照在水面上）
        vec3 sd2 = normalize(vec3(sunDir.x, sunDir.y, sunDir.z));
        float ax = atan(rr.x, -rr.z) - atan(sd2.x, -sd2.z), ay = rr.y - sd2.y;
        rc += sunCol * 0.9 * exp(-ax*ax/0.00012 - ay*ay/0.004);
      }
      col = mix(col, rc, w);
    }
    depth = tF;
  } else { col = sky(rd); depth = 1e4; }
  if (any(isnan(col)) || any(isinf(col))) col = vec3(0.);
  col = min(col, vec3(80.));
  o = vec4(col, depth);
}
`;
