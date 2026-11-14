// marble.js — 湿拓渲染器（WebGL2 全屏片元着色器）。
// 物理：水面上的颜料是一层不可压缩的膜，每个动作都保面积、都有闭式公式（Lu / Jaffer 的 mathematical marbling）。
// 画法是倒着查：对每个像素，把动作表从后往前逆变换回去，落在哪一滴里就是哪个颜色。放大多少倍边缘都是锐的。
//
// 动作（JS 每帧算好“这一刻的有效参数”，打包进浮点纹理；每个动作 3 个 texel）：
//   1 靶心 BULLSEYE（同一个圆心连续滴 n 滴，每滴面积 a·π，r ∝ √t）：[1, cx, cy, ΣA] [n, Δ, T, tt] [colorCode, rimW, a, 0]
//      同心连续滴的复合逆变换是一个闭式：P = C + (P′−C)·√(1 − ΣA/|P′−C|²)，所以一整个靶心只算一次。
//   2 划线 / 耙 / 梳 TINE：[2, Mx, My, n0] [s, z, λ, tip] [a0, L0, L2, 0]
//      P′ = P + z·u^d·M（u^d = e^(−d/λ)，d = 到最近一根齿的距离，s = 齿距）；位移带一个前沿：齿尖前方 L2 内递减。
//   3 漩涡 VORTEX：[3, cx, cy, Θ] [R², 0, 0, 0] — 绕 C 转 Θ·e^(−r²/R²)，保面积，逆变换就是转回去。
//   4 浸 SINK：[4, cx, cy, A] [H, 0, 0, 0] — 一个东西沉下去，吃掉面积 πA 的膜（包到它身上），四周的膜往里流：
//      |P′−C|² = |P−C|² − A + H；H 是留下的清水洞（东西在水里时 = 它在水线的截面）。逆变换同样是闭式。
// 场景是 3D 的：两只盘子放在一张深色桌子上，镜头是一台真的透视相机（俯视时就是原来的平面画法）；
// 一只蛋（椭球）可以浸进 B 盘：蛋上某一点的颜色 = 从它下面包上来的那一圈膜（面积对得上：πρ₀² = 蛋上包住的面积）。
const MARBLE = (() => {
  const PAL = { cobalt: '#1F3FD8', vermilion: '#F0452B', turmeric: '#F6B81A', teal: '#19B5A5', pink: '#FF7AA8', ink: '#17140F', cream: '#F4EBDD' };
  const ORDER = ['cobalt', 'vermilion', 'turmeric', 'teal', 'pink', 'ink', 'cream'];   // 色号 0—6
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  const MAXOPS = 128, ROWS = 3, FOV = 34 * Math.PI / 180, FOCAL = 540 / Math.tan(FOV / 2);

  const FS = `#version 300 es
  #define PASS __PASS__
  precision highp float; precision highp int;
  in vec2 uv; out vec4 o;
  uniform sampler2D uOps, uLabel;
  uniform int uN0, uN1, uN2;          // 第 0 行 B 盘 / 第 1 行 A 盘 / 第 2 行 蛋上包着的膜（B 盘浸之前那一刻）
  uniform vec3 uPal[7];
  uniform vec3 uCP, uCF, uCR, uCD;    // 相机：位置、前、右、下
  uniform float uFocal, uCamD;        // 焦距（像素）、相机到注视点的距离（雾用）
  uniform vec4 uTrayA, uTrayB;        // 盘：中心 x, z, 半宽, 半高
  uniform vec4 uEgg;                  // 蛋：中心 x, y(高), z, 自转角
  uniform vec4 uEgg2;                 // 蛋：横半径 a, 竖半径 b, 包到哪（局部 y）, 显示(0/1)
  uniform vec4 uEgg3;                 // 蛋：浸的地方（B 盘局部坐标）x, z, 湿(0—1), 0
  uniform vec4 uLab, uLab1;           // 第 0 帧的签条（A 盘局部坐标）：中心 x, z, 半宽, 半高；旋转, 显示
  uniform vec4 uRip[8];               // B 盘最近的几滴：x, z, 年龄(帧), 半径
  uniform vec2 uRes; uniform float uTime, uSS, uTop; uniform int uNR;

  float gId;
  float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
  float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
    return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
  float fbm(vec2 p){ float s = 0., a = .5; for(int i=0;i<4;i++){ s += a*vn(p); p = p*2.03+17.1; a *= .5; } return s; }
  vec4 op(int row, int i, int k){ return texelFetch(uOps, ivec2(i*3+k, row), 0); }
  mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }

  // 倒着查：返回 rgb + 一个“碰到哪一滴”的标记（-1 = 背景水）
  vec4 pattern(vec2 P, int row, int n, out vec2 local){
    local = P;
    for(int i = n-1; i >= 0; i--){
      vec4 a = op(row, i, 0);
      int t = int(a.x + .5);
      if(t == 1){
        vec2 v = P - a.yz; float r2 = dot(v, v), tot = a.w;
        if(r2 < tot){
          vec4 b = op(row, i, 1), c = op(row, i, 2);
          float nn = b.x, dt = b.y, T = b.z, tt = b.w, A = c.z, cum = 0., code = c.x;
          for(int k=11;k>=0;k--){
            if(float(k) >= nn) continue;
            float ak = A*clamp((tt - float(k)*dt)/T, 0., 1.);
            if(ak <= 0.) continue;
            cum += ak;
            if(r2 < cum){
              float ci = mod(floor(code / pow(8., float(k % 7))), 8.);
              vec3 col = uPal[int(ci)];
              float ro = sqrt(cum), rr = sqrt(r2);
              float rim = 1. - smoothstep(0., c.y, ro - rr);       // 每一滴外沿一圈细的深边
              col *= 1. - 0.14*rim;
              local = v + vec2(float(i)*7.31, float(k)*3.17);
              return vec4(col, float(i));
            }
          }
        }
        P = a.yz + v*sqrt(max(0., 1. - tot/max(r2, 1e-6)));
      } else if(t == 2){
        vec4 b = op(row, i, 1), c = op(row, i, 2);
        vec2 M = a.yz, N = vec2(-M.y, M.x);
        float s = b.x, z = b.y, lam = b.z, tip = b.w, a0 = c.x;
        float m = dot(P, M), nn = dot(P, N) - a.w;
        float T;
        if(s > 0.){ float fr = nn - s*floor(nn/s + .5); float d1 = abs(fr), d2 = s - d1; T = exp(-d1/lam) + exp(-d2/lam); }
        else T = exp(-abs(nn)/lam);
        float w = smoothstep(a0, a0 + c.y, m) * (1. - smoothstep(tip, tip + c.z, m));
        P -= z*T*w*M;
      } else if(t == 3){
        vec2 v = P - a.yz; float r2 = dot(v, v);
        float R2 = op(row, i, 1).x;
        if(r2 < 9.*R2){ float ang = -a.w*exp(-r2/R2); P = a.yz + rot(ang)*v; }
      } else if(t == 4){
        vec2 v = P - a.yz; float r2 = dot(v, v), H = op(row, i, 1).x;
        if(r2 < H) { local = v; return vec4(uPal[6], -1.); }       // 清水洞
        P = a.yz + v*sqrt(1. + (a.w - H)/max(r2, 1e-6));
      }
    }
    return vec4(uPal[6], -1.);
  }

  // 水面上的颜料（带颗粒）
  vec3 bath(vec2 P, int row, int n){
    vec2 L; vec4 c = pattern(P, row, n, L); gId = c.w;
    float g = fbm(L*0.045) - .5, sp = h21(floor(L*0.7));
    vec3 col = c.rgb;
    if(c.w >= 0.){ col *= 1. + 0.10*g; col *= 1. - 0.10*step(0.985, sp); col += 0.06*step(0.993, h21(floor(L*0.5)+3.)); }
    else { col *= 1. + 0.025*g; }
    return col;
  }

  vec4 label(sampler2D tex, vec2 P, vec4 L, float ang){
    vec2 q = rot(-ang)*(P - L.xy); vec2 t = q/abs(L.zw);
    if(abs(t.x) > 1. || abs(t.y) > 1.) return vec4(0.);
    return texture(tex, t*.5 + .5);
  }

  // 摄影棚：深色背景，头顶一块大柔光箱（水面和蛋上的反光都来自它），身后一条暖色轮廓光
  vec3 env(vec3 r){
    vec3 bg = mix(vec3(0.035, 0.03, 0.026), vec3(0.11, 0.095, 0.08), smoothstep(-0.2, 0.6, r.y));
    if(r.y > 0.05){
      vec3 q = r*(3200./r.y);                                    // 打到高 3200 的平面上
      vec2 d = abs(q.xz - vec2(1400., -300.)) - vec2(2600., 1300.);
      float box = 1. - smoothstep(-500., 300., max(d.x, d.y));
      bg += vec3(1.0, 0.97, 0.92)*1.6*box;
    }
    bg += vec3(1.0, 0.62, 0.32)*0.25*exp(-pow((r.y - 0.08)/0.12, 2.))*smoothstep(0.3, 1., -r.z);
    return bg;
  }

  // 椭球求交：返回 t（没碰到 = 1e9）
  float hitEgg(vec3 ro, vec3 rd){
    if(uEgg2.w < .5) return 1e9;
    vec3 sc = vec3(uEgg2.x, uEgg2.y, uEgg2.x);
    vec3 o2 = (ro - uEgg.xyz)/sc, d2 = rd/sc;
    float A = dot(d2, d2), B = dot(o2, d2), Cc = dot(o2, o2) - 1., disc = B*B - A*Cc;
    if(disc < 0.) return 1e9;
    float t = (-B - sqrt(disc))/A;
    return t > 0. ? t : 1e9;
  }

  // 蛋的表面：没浸到的地方是白釉；浸到的地方是从它下面包上来的膜
  vec3 eggColor(vec3 H, vec3 rd, out vec3 nrm){
    vec3 L = H - uEgg.xyz; float a = uEgg2.x, b = uEgg2.y;
    nrm = normalize(L/vec3(a*a, b*b, a*a));
    vec3 Lr = L; Lr.xz = rot(-uEgg.w)*L.xz;
    // 从底往上包：这一点下面的蛋面积 S ≈ 2π·a·(y+b)（阿基米德），对应水面上半径 ρ₀ = √(S/π) 的一圈
    float rho = sqrt(max(0., 2.*a*(Lr.y + b))), az = atan(Lr.z, Lr.x);
    vec2 bp = uEgg3.xy + rho*vec2(cos(az), sin(az));
    vec3 glaze = vec3(0.965, 0.95, 0.925);
    float edge = uEgg2.z + 10.*(vn(vec2(az*9., 1.)) - .5);
    float dipped = 1. - smoothstep(edge - 2., edge + 2., Lr.y);
    vec3 base = glaze;
    if(dipped > 0.){ vec2 Lc; vec4 c = pattern(bp, 2, uN2, Lc); gId = 100. + c.w; base = mix(glaze, c.rgb*vec3(1.02), dipped); }
    else gId = 99.;
    vec3 kd = normalize(vec3(-0.45, 0.85, -0.3));
    float dif = max(dot(nrm, kd), 0.)*0.75 + 0.3 + 0.12*max(nrm.y, 0.);
    vec3 R = reflect(rd, nrm); float fr = 0.04 + 0.96*pow(1. - max(dot(-rd, nrm), 0.), 5.);
    float gloss = mix(0.35, 1.0, max(uEgg3.z, dipped*0.6));
    vec3 col = base*dif + env(R)*fr*gloss*0.9 + vec3(1.)*pow(max(dot(R, kd), 0.), 60.)*0.35*gloss;
    col += vec3(1.0, 0.62, 0.32)*0.22*pow(1. - max(dot(-rd, nrm), 0.), 3.);   // 轮廓光
    return col;
  }

  vec3 shade(vec2 sp){
    vec3 rd = normalize(uFocal*uCF + sp.x*uCR + sp.y*uCD), ro = uCP;
    float tP = rd.y < -1e-5 ? -ro.y/rd.y : 1e9;
    float tE = hitEgg(ro, rd);
    gId = -3.;
    if(tE < tP){ vec3 n; return eggColor(ro + tE*rd, rd, n); }
    if(tP > 1e8) { gId = -4.; return env(rd); }
    vec3 H = ro + tP*rd; vec2 P = H.xz;
    float cosT = -rd.y, fres = 0.02 + 0.98*pow(1. - cosT, 5.);
    vec3 col; float wet = 0.;
    vec2 la = P - uTrayA.xy, lb = P - uTrayB.xy;
    vec2 da = abs(la) - uTrayA.zw, db = abs(lb) - uTrayB.zw;
    float dA = max(da.x, da.y), dB = max(db.x, db.y), dT = min(dA, dB);
    float px = tP/uFocal/max(cosT, 0.15);                    // 一个像素在水面上多宽
    if(dT < 0.){
      wet = 1.;
      if(dA < 0.){
        col = bath(la, 1, uN1);
        if(uLab1.y > 0.){
          vec4 sh = label(uLabel, la - vec2(10., 14.), uLab*vec4(1,1,1.02,1.04), uLab1.x); col *= 1. - 0.22*sh.a;
          vec4 lc = label(uLabel, la, uLab, uLab1.x); col = mix(col, lc.rgb, lc.a); wet = 1. - lc.a;
        }
      } else {
        float rip = 0.;
        for(int k=0;k<8;k++){ if(k >= uNR) break; vec4 r = uRip[k];
          float d = length(lb - r.xy), front = r.w + r.z*5.0, wv = d - front;
          rip += sin(wv*0.18)*exp(-wv*wv/(2.*900.))*exp(-r.z/40.)*smoothstep(r.w*0.6, r.w, d); }
        col = bath(lb + rip*vec2(1.2, 0.8), 0, uN0);
        col += vec3(0.10)*max(rip, 0.) - vec3(0.05)*max(-rip, 0.);
        // 蛋在水里：水线一圈弯月面 + 蛋的影子
        if(uEgg2.w > .5){
          float dw = length(P - uEgg.xz);
          float wl = uEgg2.x*sqrt(max(0., 1. - pow(uEgg.y/uEgg2.y, 2.)));
          if(uEgg.y < uEgg2.y) col += 0.25*exp(-pow((dw - wl - 6.)/8., 2.)) - 0.12*exp(-pow((dw - wl - 22.)/14., 2.));
        }
      }
      // 盘子的内壁：贴着边缘一圈暗
      col *= 1. - 0.35*exp(dT/18.);
    } else if(dT < 46.){
      // 盘沿：黄铜色的一圈，外沿一条高光
      float u = dT/46.;
      col = mix(vec3(0.42, 0.33, 0.2), vec3(0.62, 0.5, 0.32), smoothstep(0.1, 0.6, u))*(0.8 + 0.4*smoothstep(0.75, 0.95, u)*(1. - smoothstep(0.95, 1., u)));
      gId = -5.; fres *= 2.5;
    } else {
      // 桌子：深色胡桃木，盘子投下软影
      float g = fbm(P*vec2(0.004, 0.06)), g2 = vn(P*vec2(0.002, 0.03));
      col = vec3(0.16, 0.105, 0.07)*(0.75 + 0.35*g + 0.15*g2);
      col *= 1. - 0.55*exp(-(dT - 46.)/60.);
      gId = -6.; fres *= 0.6;
    }
    // 蛋在桌面 / 水面上的影子
    if(uEgg2.w > .5 && uEgg.y > -uEgg2.y){
      float hgt = max(uEgg.y, 0.);
      float rr = length(P - uEgg.xz - vec2(80., 60.)*hgt/900.)/(uEgg2.x*(1. + hgt/1400.));
      col *= 1. - 0.5*exp(-hgt/1100.)*(1. - smoothstep(0.55, 1.25, rr));
    }
    // 反光：水面按菲涅尔反射摄影棚（俯视时很淡，低机位时很亮），水里也倒映出蛋
    vec3 rr = reflect(rd, vec3(0., 1., 0.));
    vec3 refl = env(rr);
    float tR = hitEgg(H + rr*2., rr);
    if(tR < 1e8){ vec3 n; refl = eggColor(H + rr*2. + tR*rr, rr, n)*0.9; }
    col = mix(col, refl, fres*(0.35 + 0.65*wet));
    // 俯视时一条柔的高光带（大柔光箱在头顶）
    float band = exp(-pow((dot(sp/uRes.y, normalize(vec2(1., -0.55))) + 0.25)/0.22, 2.));
    col += vec3(0.09)*band*uTop*wet;
    // 远处慢慢暗下去（摄影棚只有一盏灯）
    col = mix(col, env(rd)*0.6, smoothstep(1.6*uCamD, 4.5*uCamD, tP));
    return col;
  }
  uniform sampler2D uPrev;
  void main(){
    vec2 q = uv*uRes;
    vec2 sp = vec2(q.x - uRes.x*.5, uRes.y*.5 - q.y);
    vec3 acc;
    #if PASS == 0
    {
      acc = shade(sp);
      o = vec4(acc, (gId + 2.)/256.);
      return;
    }
    #else
    // 第二遍：自适应抗锯齿——和上下左右碰到的滴不一样（或亮度差得多）的像素，才补 4 个旋转网格的采样
    ivec2 ip = ivec2(gl_FragCoord.xy);
    vec4 c0 = texelFetch(uPrev, ip, 0);
    float l0 = dot(c0.rgb, vec3(.3,.59,.11));
    bool edge = false;
    for(int k=0;k<4;k++){
      ivec2 dd = k==0 ? ivec2(1,0) : k==1 ? ivec2(-1,0) : k==2 ? ivec2(0,1) : ivec2(0,-1);
      vec4 cn = texelFetch(uPrev, clamp(ip+dd, ivec2(0), ivec2(uRes)-1), 0);
      if(abs(cn.a - c0.a) > 0.001 || abs(dot(cn.rgb, vec3(.3,.59,.11)) - l0) > 0.05) edge = true;
    }
    acc = c0.rgb;
    if(edge && uSS > 1.){
      for(int k=0;k<4;k++){
        vec2 jo = k==0 ? vec2(-.125,-.375) : k==1 ? vec2(.375,-.125) : k==2 ? vec2(.125,.375) : vec2(-.375,.125);
        acc += shade(sp + jo);
      }
      acc /= 5.;
    }
    #endif
    vec3 c = acc;
    vec2 d = uv - .5; c *= 1. - 0.18*smoothstep(0.2, 0.9, dot(d, d)*2.2);
    c += (h21(q + uTime) - .5)*0.012;
    o = vec4(c, 1.);
  }`;

  // 镜头：注视点 (x, h, z)、缩放（俯视时 = 原来的平面缩放）、滚转、俯仰（90° = 正俯视）
  function camBasis(c) {
    const [x, z, zoom, roll, pitch = Math.PI / 2, h = 0] = c, D = FOCAL / zoom;
    const cr = Math.cos(roll), sr = Math.sin(roll), cp = Math.cos(pitch), spp = Math.sin(pitch);
    const pos = [x + D * cp * -sr, h + D * spp, z + D * cp * cr];
    const T = [x, h, z], f0 = T.map((v, i) => v - pos[i]), fl = Math.hypot(...f0), F = f0.map(v => v / fl);
    const R = [cr, 0, sr];
    let Dn = [F[1] * R[2] - F[2] * R[1], F[2] * R[0] - F[0] * R[2], F[0] * R[1] - F[1] * R[0]]; const dl = Math.hypot(...Dn); Dn = Dn.map(v => v / dl);
    return { pos, F, R, Dn, D };
  }
  // 世界点 (x, h, z) → 屏幕像素（左上原点）和这一点的缩放（屏幕像素 / 世界单位）
  function project(c, x, z, h = 0) {
    const b = camBasis(c), v = [x - b.pos[0], h - b.pos[1], z - b.pos[2]];
    const dz = v[0] * b.F[0] + v[1] * b.F[1] + v[2] * b.F[2];
    if (dz < 1) return [NaN, NaN, 0];
    const k = FOCAL / dz;
    return [960 + k * (v[0] * b.R[0] + v[1] * b.R[1] + v[2] * b.R[2]), 540 + k * (v[0] * b.Dn[0] + v[1] * b.Dn[1] + v[2] * b.Dn[2]), k];
  }

  function create(canvas) {
    const gl = GLK.create(canvas);
    const progs = [GLK.program(gl, FS.replace('__PASS__', '0')), GLK.program(gl, FS.replace('__PASS__', '1'))];
    const opsData = new Float32Array(MAXOPS * 3 * 4 * ROWS);
    const opsTex = GLK.texture(gl, MAXOPS * 3, ROWS, { internal: gl.RGBA32F, type: gl.FLOAT, filter: gl.NEAREST });
    const labTex = GLK.texture(gl, 4, 4, { internal: gl.RGBA8, type: gl.UNSIGNED_BYTE });
    function setLabel(cv) {
      gl.bindTexture(gl.TEXTURE_2D, labTex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, cv);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    let fb1 = null;
    const pal = new Float32Array(ORDER.flatMap(k => hex(PAL[k])));
    // s = { ops0, ops1, ops2, cam: [x, z, zoom, roll, pitch, h], cams（运动模糊：一组镜头）, trayA, trayB, egg, egg2, egg3, lab, lab1, rip, ss, time, res }
    async function render(s) {
      opsData.fill(0);
      [s.ops0, s.ops1, s.ops2 || []].forEach((L, row) => L.forEach((o, i) => { for (let k = 0; k < 12; k++) opsData[(row * MAXOPS * 3 + i * 3) * 4 + k] = o[k] || 0; }));
      gl.bindTexture(gl.TEXTURE_2D, opsTex);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, MAXOPS * 3, ROWS, gl.RGBA, gl.FLOAT, opsData);
      const W = gl.drawingBufferWidth, Hh = gl.drawingBufferHeight, sc = W / 1920;
      const setU = (prog, cam) => {
        gl.useProgram(prog);
        const u = prog.u, b = camBasis(cam);
        GLK.bindTex(gl, prog, 'uOps', opsTex, 0); GLK.bindTex(gl, prog, 'uLabel', labTex, 1);
        gl.uniform1i(u.uN0, s.ops0.length); gl.uniform1i(u.uN1, s.ops1.length); gl.uniform1i(u.uN2, (s.ops2 || []).length);
        gl.uniform3fv(u.uPal, pal);
        gl.uniform3fv(u.uCP, b.pos); gl.uniform3fv(u.uCF, b.F); gl.uniform3fv(u.uCR, b.R); gl.uniform3fv(u.uCD, b.Dn);
        gl.uniform1f(u.uFocal, FOCAL * sc); gl.uniform1f(u.uCamD, b.D);
        const v4 = (n, a) => gl.uniform4fv(u[n], new Float32Array(a));
        v4('uTrayA', s.trayA); v4('uTrayB', s.trayB); v4('uEgg', s.egg || [0, 0, 0, 0]); v4('uEgg2', s.egg2 || [1, 1, 0, 0]); v4('uEgg3', s.egg3 || [0, 0, 0, 0]);
        v4('uLab', s.lab || [0, 0, 1, 1]); v4('uLab1', s.lab1 || [0, 0, 0, 0]);
        const rip = new Float32Array(32).fill(-1); (s.rip || []).slice(0, 8).forEach((r, i) => rip.set(r, i * 4)); gl.uniform4fv(u.uRip, rip);
        gl.uniform1i(u.uNR, Math.min(8, (s.rip || []).length));
        gl.uniform2f(u.uRes, W, Hh); gl.uniform1f(u.uTime, s.time || 0); gl.uniform1f(u.uSS, s.ss || 4);
        gl.uniform1f(u.uTop, clamp(((cam[4] ?? Math.PI / 2) - 1.1) / 0.45));
      };
      if (!fb1) fb1 = GLK.fbo(gl, W, Hh);
      gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, null);
      const cams = s.cams && s.cams.length > 1 ? s.cams : null;
      if (!cams) {
        setU(progs[0], s.cam); GLK.draw(gl, fb1);
        setU(progs[1], s.cam); GLK.bindTex(gl, progs[1], 'uPrev', fb1.tex, 3); GLK.draw(gl, null);
      } else {
        // 运动模糊：快门开着的这段时间里取几个镜头位置，每个都走完两遍（含抗锯齿），叠起来平均
        gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, Hh); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
        cams.forEach(cam => {
          gl.disable(gl.BLEND);
          gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, null);
          setU(progs[0], cam); GLK.draw(gl, fb1);
          setU(progs[1], cam); GLK.bindTex(gl, progs[1], 'uPrev', fb1.tex, 3); gl.uniform1f(progs[1].u.uSS, 1);   // 模糊的帧不用再补抗锯齿
          gl.enable(gl.BLEND); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE); gl.blendColor(0, 0, 0, 1 / cams.length); gl.colorMask(true, true, true, false);
          GLK.draw(gl, null);
          gl.colorMask(true, true, true, true);
        });
        gl.disable(gl.BLEND);
      }
      const px = new Uint8Array(4); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    }
    return { gl, render, setLabel };
  }
  return { PAL, ORDER, hex, create, camBasis, project, FOCAL };
})();
