// marble.js — 湿拓渲染器（WebGL2 全屏片元着色器）。
// 物理：水面上的颜料是一层不可压缩的膜，每个动作都保面积、都有闭式公式（Lu / Jaffer 的 mathematical marbling）。
// 画法是倒着查：对每个像素，把动作表从后往前逆变换回去，落在哪一滴里就是哪个颜色。放大多少倍边缘都是锐的。
//
// 动作（JS 每帧算好“这一刻的有效参数”，打包进浮点纹理；每个动作 3 个 texel）：
//   1 靶心 BULLSEYE（同一个圆心连续滴 n 滴，每滴面积 a·π，r ∝ √t）：[1, cx, cy, a] [n, Δ, T, tt] [colorCode, rimW, 0, 0]
//      同心连续滴的复合逆变换是一个闭式：P′ = C + (P−C)·√(1 − ΣA/|P−C|²)，所以一整个靶心只算一次。
//   2 划线 / 耙 / 梳 TINE：[2, angle, n0, s] [z, λ, tip, a0] [L0, L2, 0, 0]
//      P′ = P + z·u^d·M（u^d = e^(−d/λ)，d = 到最近一根齿的距离，s = 齿距，s=0 是单根）；位移带一个前沿：齿尖前方 L2 内递减。
//   3 漩涡 VORTEX：[3, cx, cy, Θ] [R, 0, 0, 0] — 绕 C 转 Θ·e^(−r²/R²)，保面积，逆变换就是转回去。
// 纸（盖下去 / 揭起来）是一张圆柱卷起来的纸：揭起来的部分翻过来压在上面，背面就是印出来的画。
const MARBLE = (() => {
  const PAL = { cobalt: '#1F3FD8', vermilion: '#F0452B', turmeric: '#F6B81A', teal: '#19B5A5', pink: '#FF7AA8', ink: '#17140F', cream: '#F4EBDD' };
  const ORDER = ['cobalt', 'vermilion', 'turmeric', 'teal', 'pink', 'ink', 'cream'];   // 色号 0—6
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  const MAXOPS = 128;

  const FS = `#version 300 es
  #define PASS __PASS__
  precision highp float; precision highp int;
  in vec2 uv; out vec4 o;
  uniform sampler2D uOps, uLabel, uLabel2;
  uniform int uN0, uN1;               // 第 0 行（水面上现在的）/ 第 1 行（纸上印下来的，冻结）各几个动作
  uniform vec3 uPal[7];
  uniform vec4 uCam;                  // 中心 x, y, 缩放, 旋转
  uniform vec4 uCurl;                 // 纸：nx, ny, p（折线位置）, R（卷的半径）
  uniform vec4 uPaper;                // mode（0 无 / 1 正在盖 / 2 揭起来翻过去）, s0（起始边）, q（盖到哪）, wet（纸背透色）
  uniform vec4 uSheet;                // 纸的半宽、半高、ghost（揭完以后水里残留的颜色）、print 的旋转
  uniform vec4 uLab;                  // 签条：中心 x, y, 半宽, 半高（水面坐标）
  uniform vec4 uLab1;                 // 签条：旋转, 显示(0/1), 落下进度, 0
  uniform vec4 uLab2;                 // 成品上的签条：中心(纸坐标) x, y, 半宽, 半高
  uniform vec4 uLab3;                 // 成品签条：旋转, 显示, 落下高度, 0
  uniform vec4 uRip[8];               // 最近的几滴：x, y, 年龄(帧), 半径
  uniform vec2 uRes; uniform float uTime, uSS; uniform int uNR, uNT;
  uniform vec4 uTools[12];            // 工具在水面上的接触点（弯月面高光）：x, y, 半径, 强度

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

  // 纸的覆盖（毛边，1 像素软边）：PP 是纸上的点
  float sheetMask(vec2 PP, vec2 hs, float soft){
    vec2 d = abs(PP) - hs; float e = 5.*(vn(PP.yx*0.045) - .5) + 2.5*(vn(PP*0.21) - .5);
    float sd = max(d.x, d.y) - e;
    return 1. - smoothstep(-soft, soft, sd);
  }
  float sheetMask(vec2 PP, vec2 hs){ return sheetMask(PP, hs, 1.2/uCam.z); }
  vec3 paperTex(vec2 S){ float f = fbm(S*0.06), fib = vn(S*vec2(0.9, 0.04)); return vec3(0.975, 0.958, 0.925)*(0.965 + 0.05*f + 0.02*fib); }
  vec3 printAt(vec2 PP){ vec3 pt = paperTex(PP); return mix(pt, bath(PP, 1, uN1)*pt*1.03, 0.93); }

  vec4 label(sampler2D tex, vec2 P, vec4 L, float ang){
    vec2 q = rot(-ang)*(P - L.xy); vec2 t = q/abs(L.zw); if(L.z < 0.) t.x = -t.x;
    if(abs(t.x) > 1. || abs(t.y) > 1.) return vec4(0.);
    return texture(tex, t*.5 + .5);
  }

  vec3 shade(vec2 sp){
    mat2 R = rot(uCam.w);
    vec2 P = uCam.xy + R*(sp/uCam.z);
    // 水面：最近几滴的涟漪（只改高光和一点点折射）
    float rip = 0.;
    for(int k=0;k<8;k++){ if(k >= uNR) break; vec4 r = uRip[k]; if(r.z < 0.) continue;
      float d = length(P - r.xy), front = r.w + r.z*5.0, wv = d - front;
      rip += sin(wv*0.18)*exp(-wv*wv/(2.*900.))*exp(-r.z/40.)*smoothstep(r.w*0.6, r.w, d); }
    vec2 Pr = P + rip*vec2(1.2, 0.8);
    vec3 col = bath(Pr, 0, uN0); float idb = gId;
    if(uSheet.z > 0. && idb < 0.){ vec3 gc = bath(Pr, 1, uN1); col = mix(col, gc, uSheet.z); gId += 0.001*(gId + 1.); }
    // 湿的反光：一条柔的高光带 + 涟漪
    float band = exp(-pow((dot(sp/uRes.y, normalize(vec2(1., -0.55))) + 0.25)/0.22, 2.));
    col += vec3(0.09)*band + vec3(0.10)*max(rip, 0.) - vec3(0.05)*max(-rip, 0.);
    // 工具碰水的弯月面：一圈亮一圈暗
    for(int k=0;k<12;k++){ if(k >= uNT) break; vec4 t = uTools[k]; if(t.w <= 0.) continue;
      float d = length(P - t.xy)/t.z;
      col += t.w*(0.35*exp(-pow((d-1.0)/0.25, 2.)) - 0.22*exp(-pow((d-1.7)/0.45, 2.))); }
    // 签条（贴在水面上的纸签）
    if(uLab1.y > 0.){
      vec2 Q = P; float s0 = dot(Q, uCurl.xy) - uPaper.y;
      bool covered = uPaper.x == 1. && s0 < uPaper.z;
      if(!covered){
        float lift = uLab1.z;
        vec4 sh = label(uLabel, P - vec2(10., 14.)*(1. + lift*3.), uLab*vec4(1,1,1.02,1.04), uLab1.x);
        col *= 1. - 0.22*sh.a;
        vec4 lc = label(uLabel, P, uLab, uLab1.x);
        col = mix(col, lc.rgb, lc.a);
      }
    }
    // 纸：一张矩形纸（半宽、半高 = uSheet.xy，毛边），从起始边沿 n 方向盖下去 / 揭起来。
    // 揭：纸坐标 σ < p 的部分绕半径 R 的圆柱翻上来，再平压在没揭的那一截上——翻过来的是背面 = 印下来的画（镜像）。
    if(uPaper.x > 0.){
      vec2 n = uCurl.xy; float s = dot(P, n) - uPaper.y; float p = uCurl.z, Rr = uCurl.w;
      vec2 hs = uSheet.xy;
      vec3 base = col; bool done = false;
      if(uPaper.x == 1.){
        // 正在盖：s < q 已经贴在水上（越久透色越多），前面 Lb 这一段还悬在空中（亮一点，不透色），再前面的水上有影子
        float qq = uPaper.z, Lb = 120.;
        float cov = sheetMask(P, hs);
        if(cov > 0. && s < qq + Lb){
          vec3 pc = paperTex(P);
          vec2 L; vec4 under = pattern(P, 0, uN0, L);
          float wet = uPaper.w*smoothstep(0., 260., qq - s);
          pc = mix(pc, pc*mix(vec3(1.), under.rgb, 0.36), wet);
          pc *= 1. + 0.07*smoothstep(qq - 40., qq + Lb, s);
          col = mix(col, pc, cov);
        } else {
          float sh = sheetMask(P - n*80., hs, 40.);
          col *= 1. - 0.30*sh*exp(-max(0., s - qq - Lb)/60.)*step(qq + Lb, s);
        }
      } else {
        float PI = 3.14159265;
        // 1) 平压着的翻页（印画朝上）
        if(s >= p){
          float sig = 2.*p - PI*Rr - s; vec2 PP = P - n*(s - sig);
          float cov = sheetMask(PP, hs);
          if(cov > 0.){
            vec3 pc = printAt(PP);
            pc *= 0.92 + 0.08*smoothstep(0., 110., s - p);
            if(uLab3.y > 0.){
              vec4 shd = label(uLabel2, PP + vec2(-8., 12.)*(1. + uLab3.z*0.15), uLab2*vec4(1,1,1.015,1.03), uLab3.x);
              pc *= 1. - 0.25*shd.a*uLab3.y;
              vec4 l2 = label(uLabel2, PP, uLab2, uLab3.x); pc = mix(pc, l2.rgb, l2.a*uLab3.y);
            }
            col = pc; done = cov > 0.99; base = mix(base, pc, cov);
          }
        }
        // 2) 圆柱：上半圈（印画朝上，有明暗）
        if(!done && s < p && s > p - Rr){
          float th = PI - asin(clamp((p - s)/Rr, 0., 1.));
          float sig = p - Rr*th; vec2 PP = P - n*(s - sig);
          float cov = sheetMask(PP, hs);
          if(cov > 0.){ vec3 pc = printAt(PP)*(0.74 + 0.36*sin(th)); col = mix(base, pc, cov); done = cov > 0.99; base = col; }
          if(!done){
            float th2 = asin(clamp((p - s)/Rr, 0., 1.)); float sig2 = p - Rr*th2; vec2 PP2 = P - n*(s - sig2);
            float cov2 = sheetMask(PP2, hs);
            if(cov2 > 0.){ col = mix(base, paperTex(PP2)*(0.86 + 0.14*cos(th2)), cov2); done = cov2 > 0.99; base = col; }
          }
        }
        // 3) 还没揭的纸背（透一点色），翻页的边投下影子
        float fsh = 0.;
        { float sig = 2.*p - PI*Rr - (s - 26.); vec2 PP = P - n*26. - n*((s - 26.) - sig);
          fsh = (s - 26. >= p) ? sheetMask(PP, hs, 30.) : 0.; }
        if(!done && s >= p){
          float cov = sheetMask(P, hs);
          if(cov > 0.){
            vec3 pc = paperTex(P);
            vec2 L; vec4 under = pattern(P, 1, uN1, L);
            pc = mix(pc, pc*mix(vec3(1.), under.rgb, 0.36), uPaper.w);
            col = mix(base, pc*(1. - 0.28*fsh), cov); done = cov > 0.99; base = col;
          }
        }
        if(!done){
          // 水：圆柱投下的影子（圆柱上真有纸才投）+ 翻页投到纸外面的影子
          float sigc = p - Rr*PI*0.5; vec2 PC = P - n*(s - sigc);
          float shc = (s < p) ? sheetMask(PC, hs, 30.)*exp(-max(0., (p - Rr) - s)/80.) : 0.;
          col = base*(1. - 0.34*max(shc, fsh));
        }
      }
    }
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

  function create(canvas) {
    const gl = GLK.create(canvas);
    const progs = [GLK.program(gl, FS.replace('__PASS__', '0')), GLK.program(gl, FS.replace('__PASS__', '1'))];
    const opsData = new Float32Array(MAXOPS * 3 * 4 * 2);
    const opsTex = GLK.texture(gl, MAXOPS * 3, 2, { internal: gl.RGBA32F, type: gl.FLOAT, filter: gl.NEAREST });
    const labTex = [GLK.texture(gl, 4, 4, { internal: gl.RGBA8, type: gl.UNSIGNED_BYTE }), GLK.texture(gl, 4, 4, { internal: gl.RGBA8, type: gl.UNSIGNED_BYTE })];
    function setLabel(k, cv) {
      gl.bindTexture(gl.TEXTURE_2D, labTex[k]);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, cv);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    let fb1 = null;
    const pal = new Float32Array(ORDER.flatMap(k => hex(PAL[k])));
    // s = { ops0: [[12 floats]...], ops1: [...], cam: [x,y,z,rot], curl, paper, sheet, lab, lab1, lab2, lab3, rip: [[x,y,age,r]], tools: [[x,y,r,k]], ss, time }
    async function render(s) {
      opsData.fill(0);
      [s.ops0, s.ops1].forEach((L, row) => L.forEach((o, i) => { for (let k = 0; k < 12; k++) opsData[(row * MAXOPS * 3 + i * 3) * 4 + k] = o[k] || 0; }));
      gl.bindTexture(gl.TEXTURE_2D, opsTex);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, MAXOPS * 3, 2, gl.RGBA, gl.FLOAT, opsData);
      const setU = prog => {
        gl.useProgram(prog);
      const u = prog.u;
      GLK.bindTex(gl, prog, 'uOps', opsTex, 0); GLK.bindTex(gl, prog, 'uLabel', labTex[0], 1); GLK.bindTex(gl, prog, 'uLabel2', labTex[1], 2);
      gl.uniform1i(u.uN0, s.ops0.length); gl.uniform1i(u.uN1, s.ops1.length);
      gl.uniform3fv(u.uPal, pal);
      const v4 = (n, a) => gl.uniform4fv(u[n], new Float32Array(a));
      v4('uCam', s.cam); v4('uCurl', s.curl || [1, 0, -1e5, 100]); v4('uPaper', s.paper || [0, 0, 0, 0]); v4('uSheet', s.sheet || [960, 540, 0, 0]);
      v4('uLab', s.lab || [0, 0, 1, 1]); v4('uLab1', s.lab1 || [0, 0, 0, 0]); v4('uLab2', s.lab2 || [0, 0, 1, 1]); v4('uLab3', s.lab3 || [0, 0, 0, 0]);
      const rip = new Float32Array(32).fill(-1); (s.rip || []).slice(0, 8).forEach((r, i) => rip.set(r, i * 4)); gl.uniform4fv(u.uRip, rip);
      const tl = new Float32Array(48); (s.tools || []).slice(0, 12).forEach((r, i) => tl.set(r, i * 4)); gl.uniform4fv(u.uTools, tl);
      gl.uniform2f(u.uRes, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.uniform1i(u.uNR, (s.rip || []).length); gl.uniform1i(u.uNT, (s.tools || []).length); gl.uniform1f(u.uTime, s.time || 0); gl.uniform1f(u.uSS, s.ss || 4);
      };
      if (!fb1) fb1 = GLK.fbo(gl, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, null);
      setU(progs[0]); GLK.draw(gl, fb1);
      setU(progs[1]); GLK.bindTex(gl, progs[1], 'uPrev', fb1.tex, 3); GLK.draw(gl, null);
      const px = new Uint8Array(4); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    }
    return { gl, render, setLabel };
  }
  return { PAL, ORDER, hex, create };
})();
