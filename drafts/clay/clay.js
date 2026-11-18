// clay.js — 黏土渲染器：文字距离场挤出成“手捏的厚片” + 球 / 扁饼 / 搓条 + 拇指按坑（带指纹）
// 一个光线步进着色器。黏土的签名物理是“塑性”：按下去不回弹，体积守恒（压扁 s → 两边各撑开 1/√s），每碰一次都留下指纹。
// 材质：哑光 + 一层很薄的油光（橡皮泥是油性的），阴影里颜色更饱和（次表面），没有一张贴图。
(function (G) {
  const FS = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;
uniform vec2 res, shift;
uniform sampler2D sdfTex; uniform vec4 texRect; uniform float pxWorld; uniform float textOn;
uniform vec3 textPos; uniform float H, R, warp, dome, flatOn;
uniform vec4 gSplit, gCol, gSq, gCx, gRot, gLift;
uniform highp sampler2D primTex; uniform int nBlob, nCoil, nDent, nTool, nChunk;
uniform vec3 pal[12];
uniform vec3 camPos, camTgt; uniform float fov, ortho;
uniform vec3 lightDir, keyCol, skyCol, bounceCol, bgTop, bgBot, floorCol;
uniform float floorY, fogNear, fogFar, shadowK, lumpAmt, seed;
uniform vec3 sceneLo, sceneHi;
uniform vec4 floorTex; uniform int dbg;
uniform vec4 cutPl; uniform vec3 cutOff; uniform float cutOn, cutX; // 钢丝切：平面（法线、偏移）以上的部分整块滑开 cutOff；只切 x > cutX 的字
uniform vec3 mcol[4]; uniform float mScale; // 大理石纹（几色泥揉在一起没揉匀）
uniform vec3 rimDir, rimCol; uniform int nCyl;
vec3 gObjP; vec3 gCylP;
uniform int nPanel; uniform vec4 panR[24]; uniform vec4 panC[24]; // 界面里的底板（世界 xz 矩形 + 颜色 / 圆角），画在桌面上，泥的影子落在上面 // x 纸纹强度, y 网格（切割垫）强度, z 网格间距, w 未用

vec4 PR(int r, int i){ return texelFetch(primTex, ivec2(i, r), 0); }
float smin(float a, float b, float k){ float h = max(k-abs(a-b),0.0)/k; return min(a,b) - h*h*k*0.25; }
float smax(float a, float b, float k){ return -smin(-a, -b, k); }
float hash3(vec3 p){ p = fract(p*0.3183099 + vec3(0.71,0.113,0.419)); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float hash2(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float vn3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(hash3(i+vec3(0,0,0)),hash3(i+vec3(1,0,0)),f.x), mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x), mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y), f.z); }
float vn2(vec2 x){ vec2 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(hash2(i), hash2(i+vec2(1,0)), f.x), mix(hash2(i+vec2(0,1)), hash2(i+vec2(1,1)), f.x), f.y); }

// —— 文字距离场（双三次）——
vec4 bsw(float t){ float t2=t*t, t3=t2*t; return vec4((1.0-t)*(1.0-t)*(1.0-t), 3.0*t3-6.0*t2+4.0, -3.0*t3+3.0*t2+3.0*t+1.0, t3)/6.0; }
float sampleSdf(vec2 q){
  vec2 ts = vec2(textureSize(sdfTex, 0)), st = q*ts - 0.5, i = floor(st), f = st - i;
  vec4 wx = bsw(f.x), wy = bsw(f.y);
  vec2 g0 = vec2(wx.x + wx.y, wy.x + wy.y), g1 = vec2(wx.z + wx.w, wy.z + wy.w);
  vec2 h0 = (vec2(wx.y, wy.y)/g0 - 1.0 + i + 0.5)/ts, h1 = (vec2(wx.w, wy.w)/g1 + 1.0 + i + 0.5)/ts;
  return g0.y*(g0.x*texture(sdfTex, h0).r + g1.x*texture(sdfTex, vec2(h1.x, h0.y)).r) + g1.y*(g0.x*texture(sdfTex, vec2(h0.x, h1.y)).r + g1.x*texture(sdfTex, h1).r);
}
float sdText2D(vec2 p){
  vec2 q = (p - texRect.xy)/texRect.zw; vec2 qc = clamp(q, vec2(0.002), vec2(0.998));
  float e = length((q-qc)*texRect.zw), d = sampleSdf(qc) * pxWorld;
  // 框外：两个下界取大（到框的距离；框边上的距离减去离框边多远），不能用“相加”——那是上界，会穿过东西
  return e > 0.0 ? max(e, d - e) : d;
}
// 每个字自己的变换：绕底边中点转一点（手摆的不会正）、按体积守恒压扁
float sdLettersCore(vec3 p, out float gi){
  gi = 0.0;
  if (flatOn > 0.5) p = vec3(p.x, -p.z, p.y - (H*0.9 + R*0.4)); // 平放在桌上：字的“上”朝 -z，厚度朝上
  int k = p.x < gSplit.x ? 0 : p.x < gSplit.y ? 1 : p.x < gSplit.z ? 2 : 3;
  gi = gCol[k];
  float cx = gCx[k], sy = gSq[k], rt = gRot[k];
  p.y -= gLift[k];
  vec2 q = vec2(p.x - cx, p.y);
  float c = cos(rt), s = sin(rt); q = vec2(c*q.x + s*q.y, -s*q.x + c*q.y);
  float sx = inversesqrt(sy); // 压扁 sy，另外两个方向各撑开 1/√sy，体积不变
  float z;
  if (flatOn > 0.5) { q /= sx; z = (p.z + (H*0.9 + R*0.4)*(1.0 - sy))/sy; } // 从上往下按：变薄、摊开
  else { q.x /= sx; q.y /= sy; z = p.z / sx; }
  q.x += cx;
  // 手捏的不规则：笔画边缘轻轻地晃
  q += warp*(vec2(vn2(q*1.1 + seed), vn2(q*1.1 + 17.3 + seed)) - 0.5);
  float d2 = sdText2D(q);
  float th = H*(0.86 + 0.28*vn2(q*0.8 + 4.0)) + dome*smoothstep(0.0, 0.3, -d2);
  vec2 w = vec2(d2 + R, abs(z) - th);
  float d = min(max(w.x,w.y),0.0) + length(max(w,0.0)) - R;
  return d * min(sy, sx) * 0.8; // 0.8：手捏的扭曲和鼓起让场的斜率略大于 1，步子保守一点
}
float sdLetters(vec3 p, out float gi){
  gi = 0.0;
  if (textOn < 0.5) return 1e5;
  p -= textPos;
  float a = sdLettersCore(p, gi); gObjP = p;
  if (cutOn > 0.5) {
    vec3 N = cutPl.xyz;
    if (p.x > cutX) a = max(a, dot(p, N) - cutPl.w);
    vec3 p2 = p - cutOff; float g2;
    if (p2.x > cutX) {
      float b = max(sdLettersCore(p2, g2), cutPl.w - dot(p2, N));
      if (b < a) { a = b; gi = g2; gObjP = p2; }
    }
  }
  return a;
}
float sdEll(vec3 p, vec3 r){ float k0 = length(p/r), k1 = length(p/(r*r)); return k0*(k0-1.0)/k1; }
float sdCap(vec3 p, vec3 a, vec3 b, float ra, float rb){
  vec3 pa = p-a, ba = b-a; float h = clamp(dot(pa,ba)/dot(ba,ba), 0.0, 1.0);
  return length(pa - ba*h) - mix(ra, rb, h);
}
mat3 basis(vec3 n, vec3 up){ vec3 ex = normalize(cross(up, n)); vec3 ey = cross(n, ex); return mat3(ex, ey, n); }

// 拇指坑：一个拇指肚形状的椭球按进去 depth，挤出去的泥在坑沿鼓起一圈；坑底印着指纹
float thumb(vec3 p, int i, inout float ridge){
  vec4 a = PR(4, i), b = PR(5, i), c = PR(6, i);
  vec3 n = normalize(b.xyz); float sz = b.w, depth = a.w;
  vec3 r = vec3(0.62, 0.82, 0.5)*sz;
  vec3 ctr = a.xyz - n*(r.z - depth);
  vec3 q = p - ctr;
  if (dot(q,q) > sz*sz*2.6) return 1e5;
  mat3 B = basis(n, normalize(c.xyz));
  vec3 l = q*B;
  float dt = sdEll(l, r);
  // 指纹：弓形 + 箕形，轻微扭曲的同心纹
  vec2 uv = l.xy / r.xy;
  vec2 cq = uv - vec2(0.08, -0.18);
  float rho = length(vec2(cq.x, cq.y*1.25)) + 0.06*sin(cq.x*5.0 + cq.y*3.0) + 0.04*vn2(uv*6.0 + float(i));
  float rid = sin(6.2832*c.w*rho);
  ridge = rid * smoothstep(0.04*sz, 0.0, abs(dt)) * smoothstep(1.05, 0.7, length(uv));
  return dt;
}

// 场景：x = 距离，y = 颜色编号（>= 0 黏土，-1 木头）
vec2 mapClay(vec3 p){
  if (any(lessThan(p, sceneLo)) || any(greaterThan(p, sceneHi))) {
    vec3 q = max(max(sceneLo - p, p - sceneHi), 0.0); return vec2(length(q) + 0.6, 0.0); // 盒子留了 0.7 的边，离任何东西至少这么远
  }
  float gi; float d = sdLetters(p, gi); float col = gi;
  for (int i = 0; i < 128; i++) { if (i >= nBlob) break;
    vec4 a = PR(0, i), b = PR(1, i);
    vec3 q = p - a.xyz;
    if (dot(q,q) > (a.w*max(b.x,max(b.y,b.z)) + 0.6)*(a.w*max(b.x,max(b.y,b.z)) + 0.6)) { d = min(d, length(q) - a.w*max(b.x,max(b.y,b.z))); continue; }
    float db = sdEll(q, a.w*b.xyz);
    if (db < d) { col = b.w; gObjP = q/a.w*1.2 + vec3(float(i)*3.7, 0.0, float(i)*1.3); gCylP = vec3(q.x, q.z, q.y)/(a.w*max(b.x, b.z)); }
    d = min(d, db);
  }
  // 搓条：一串胶囊，同一条里平滑连起来
  // 先按每 8 段一组的包围球筛，离得远的整组跳过
  float dc = 1e5; float cc = 0.0;
  for (int j = 0; j < 64; j++) { if (j >= nChunk) break;
    vec4 bs = PR(9, j); vec4 rg = PR(10, j);
    float db = length(p - bs.xyz) - bs.w;
    if (db > 0.6) { dc = min(dc, db); continue; } // 0.6 以内算准的；更远只给下界（阴影和 AO 只在近处敏感）
    int i0 = int(rg.x), i1 = int(rg.y);
    for (int i = i0; i < i1; i++) {
      vec4 a = PR(2, i), b = PR(2, i+1), m = PR(3, i);
      if (m.y < 0.5) continue; // 这一点是一条的末尾
      float s = sdCap(p, a.xyz, b.xyz, a.w, b.w);
      if (s < dc) { cc = m.x; if (s < d) gObjP = p*1.6; }
      dc = smin(dc, s, 0.02);
    }
  }
  if (dc < d) col = cc;
  d = min(d, dc);
  // 圆柱（搓好的泥卷被切成的段）：截面上是一圈圈旋进去的纹
  for (int i = 0; i < 8; i++) { if (i >= nCyl) break;
    vec4 a = PR(12, i), b = PR(13, i), e = PR(14, i);
    vec3 q = p - a.xyz; vec3 ax = normalize(b.xyz);
    float y = dot(q, ax); vec3 rq = q - ax*y; float x = length(rq);
    vec2 w = vec2(x - a.w + e.y, abs(y) - b.w + e.y);
    float dcy = min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - e.y;
    if (dcy < d) { d = dcy; col = e.z;
      vec3 u = normalize(cross(abs(ax.y) < 0.9 ? vec3(0,1,0) : vec3(1,0,0), ax)); vec3 v = cross(ax, u);
      gCylP = vec3(dot(rq, u)/a.w, dot(rq, v)/a.w, (y + e.x)/a.w); }
  }
  // 压在桌上的一面是平的
  d = smax(d, floorY - p.y + 0.002, 0.02);
  // 拇指坑。pad > 0 的坑：拇指下面的泥被压成一块扁圆的饼，先长出这块饼，再按坑（窄的泥条被按一下就是这样摊开的）
  float ridge = 0.0;
  for (int i = 0; i < 64; i++) { if (i >= nDent) break;
    vec4 a = PR(4, i), b = PR(5, i), c = PR(6, i);
    if (c.w < 0.0) continue;
    float pad = PR(11, i).x; if (pad <= 0.0) continue;
    vec3 q = p - vec3(a.x, 0.0, a.z);
    vec2 u = normalize(vec2(c.x, c.z)), v = vec2(-u.y, u.x);
    vec3 l = vec3(dot(q.xz, v), q.y, dot(q.xz, u));
    float dp = sdEll(l - vec3(0.0, 0.0, 0.0), vec3(0.62*b.w*pad, a.y - a.w*0.35, 0.82*b.w*pad));
    if (dp < d) col = PR(11, i).y;
    d = smin(d, dp, 0.12);
  }
  for (int i = 0; i < 64; i++) { if (i >= nDent) break;
    float rg = 0.0; float dt = thumb(p, i, rg);
    if (dt > 1e4) continue;
    float sz = PR(5, i).w, lip = sz*0.07, e = (dt - 0.05*sz)/(0.09*sz);
    d = smax(d, -dt, 0.035) - lip*exp(-e*e) * smoothstep(0.25, -0.05, d);
    ridge += rg;
  }
  // 表面：大的鼓包 + 抹过的痕 + 毛孔；离表面远就不算
  if (d < 0.06) {
    float lump = (vn3(p*2.4 + seed) - 0.5)*0.016 + (vn3(p*6.3) - 0.5)*0.006;
    float ang = vn3(p*0.7)*3.0; vec2 sd = vec2(cos(ang), sin(ang));
    float smear = (vn3(vec3(dot(p.xz, sd)*4.0, p.y*7.0, dot(p.xz, vec2(-sd.y, sd.x))*16.0)) - 0.5)*0.0012;
    float pore = (vn3(p*58.0) - 0.5)*0.0011;
    d += (lump + smear)*lumpAmt + pore - ridge*0.006;
  }
  // 工具（木头）
  for (int i = 0; i < 4; i++) { if (i >= nTool) break;
    vec4 a = PR(7, i), b = PR(8, i);
    float dw = sdCap(p, a.xyz, b.xyz, a.w, b.w);
    if (dw < d) { d = dw; col = -1.0; }
  }
  return vec2(d, col);
}

vec3 calcN(vec3 p){
  const vec2 k = vec2(1,-1); const float e = 0.0012;
  return normalize(k.xyy*mapClay(p + k.xyy*e).x + k.yyx*mapClay(p + k.yyx*e).x + k.yxy*mapClay(p + k.yxy*e).x + k.xxx*mapClay(p + k.xxx*e).x);
}
float softShadow(vec3 ro, vec3 rd){
  // 改进版软阴影（用前一步的 h 估最近点），不会沿等距线出一圈圈的台阶
  float res = 1.0, t = 0.02, ph = 1e10;
  for (int i = 0; i < 64; i++) {
    float h = mapClay(ro + rd*t).x;
    float y = min(h*h/(2.0*ph), 0.5*h), d = sqrt(max(h*h - y*y, 0.0)); // h 跳变（出包围盒）时别让 d 掉到 0
    res = min(res, shadowK*d/max(1e-4, t - y));
    ph = h;
    t += clamp(h, 0.006, 0.3);
    if (res < 0.002 || t > 9.0) break;
  }
  res = clamp(res, 0.0, 1.0); return res*res*(3.0-2.0*res);
}
float calcAO(vec3 p, vec3 n){
  float occ = 0.0, sca = 1.0;
  for (int i = 0; i < 6; i++) { float h = 0.02 + 0.07*float(i); vec3 s = p + n*h; float d = min(mapClay(s).x, s.y - floorY); occ += (h - d)*sca; sca *= 0.72; } // 桌面也算遮挡：贴着桌子的底边要暗
  return clamp(1.0 - 2.2*occ, 0.0, 1.0);
}
// 地面的接触阴影：往上探几步
float floorAO(vec3 p){
  float occ = 0.0, sca = 1.0;
  for (int i = 0; i < 5; i++) { float h = 0.03 + 0.12*float(i); float d = mapClay(p + vec3(0,h,0)).x; occ += max(h - d, 0.0)*sca; sca *= 0.65; }
  return clamp(1.0 - 1.6*occ, 0.0, 1.0);
}
vec3 background(vec2 sp){
  float t = clamp(sp.y*0.5 + 0.5, 0.0, 1.0);
  return mix(bgBot, bgTop, smoothstep(0.0, 1.0, t));
}
float ggx(vec3 n, vec3 v, vec3 l, float rough){
  vec3 h = normalize(v + l); float nh = max(dot(n,h),0.0), a = rough*rough, a2 = a*a;
  float dd = nh*nh*(a2-1.0)+1.0; float D = a2/(3.14159*dd*dd);
  float nl = max(dot(n,l),0.0), nv = max(dot(n,v),1e-3); float kk = a*0.5;
  float Vis = 0.25/((nl*(1.0-kk)+kk)*(nv*(1.0-kk)+kk));
  return D*Vis*nl;
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 sp = (frag*2.0 - res)/res.y + shift*2.0;
  vec3 fw = normalize(camTgt - camPos), rt = normalize(cross(fw, vec3(0,1,0))), up = cross(rt, fw);
  vec3 ro, rd;
  if (ortho > 0.0) { ro = camPos + (rt*sp.x + up*sp.y)*ortho; rd = fw; }
  else { float f = 1.0/tan(fov*0.5); ro = camPos; rd = normalize(rt*sp.x + up*sp.y + fw*f); }

  // 地面（解析）
  float tF = rd.y < -1e-4 ? (floorY - ro.y)/rd.y : 1e9;
  // 场景包围盒
  vec3 inv = 1.0/rd; vec3 t0 = (sceneLo - ro)*inv, t1 = (sceneHi - ro)*inv;
  vec3 tmn = min(t0,t1), tmx = max(t0,t1);
  float tn = max(max(tmn.x,tmn.y),max(tmn.z,0.0)), tf = min(min(tmx.x,tmx.y),tmx.z);
  float t = tn; vec2 h = vec2(1e5, 0.0); bool hit = false;
  if (tf > tn) {
    for (int i = 0; i < 220; i++) {
      h = mapClay(ro + rd*t);
      if (h.x < 0.0004*t) { hit = true; break; }
      t += h.x*0.85;
      if (t > tf || t > tF) break;
    }
  }
  vec3 L = normalize(lightDir), V = -rd;
  vec3 col;
  if (hit && t < tF) {
    vec3 p = ro + rd*t; vec3 n = calcN(p);
    vec3 alb; float rough = 0.48, spec = 0.55;
    if (h.y < -0.5) { // 木头：顺着纹理的条
      float g = vn3(vec3(p.x*2.0, p.y*2.0, p.z*2.0)*vec3(1.0,1.0,1.0));
      float grain = 0.5 + 0.5*sin((p.x + p.z)*90.0 + g*14.0);
      alb = mix(vec3(0.56,0.33,0.16), vec3(0.72,0.47,0.25), grain*0.6 + 0.2); rough = 0.38; spec = 0.8;
    } else {
      int ci = int(h.y + 0.5);
      if (ci >= 20) { // 泥卷：螺旋
        mapClay(p); vec3 q = gCylP;
        float rr = length(q.xy), an = atan(q.y, q.x)/6.2831853;
        float t = rr*2.6 - an + 0.18*(vn3(q*2.5 + 3.0) - 0.5) + 0.06*q.z;
        float b = fract(t)*4.0; float fi = floor(b), fr = b - fi;
        int i0 = int(fi), i1 = (i0 + 1) % 4;
        alb = mix(mcol[i0], mcol[i1], smoothstep(0.88, 1.0, fr));
        rough = 0.42;
      } else if (ci >= 10) { // 大理石纹：在字自己的坐标里算，切开以后截面上的纹和外面接得上
        mapClay(p); vec3 q = gObjP*mScale;
        vec3 w = vec3(vn3(q*0.6), vn3(q*0.6 + 5.2), vn3(q*0.6 + 9.7)) - 0.5;
        vec3 q2 = q + 2.2*w; q2 += 0.5*(vec3(vn3(q2*1.7), vn3(q2*1.7 + 3.1), vn3(q2*1.7 + 6.3)) - 0.5);
        float t = q2.x*0.3 + q2.y*1.0 + q2.z*0.4;
        float b = fract(t*1.15)*4.0; float fi = floor(b), fr = b - fi;
        int i0 = int(fi), i1 = (i0 + 1) % 4;
        alb = mix(mcol[i0], mcol[i1], smoothstep(0.9, 1.0, fr));
        rough = 0.42;
      } else
      alb = pal[ci];
      // 揉进去的一点点颜色不匀 + 极少的小斑点（灰、毛屑）
      alb *= 0.95 + 0.09*vn3(p*3.7 + 9.0);
      float sp1 = hash3(floor(p*140.0));
      if (sp1 > 0.9994) alb *= 0.7;
    }
    float sh = softShadow(p + n*0.004, L);
    float ao = calcAO(p, n);
    vec3 aoC = pow(vec3(ao), vec3(1.45) - alb*0.9); // 阴影里更饱和
    float ndl = dot(n, L);
    float wrap = max((ndl + 0.32)/1.32, 0.0);
    float term = smoothstep(-0.32, 0.25, ndl)*(1.0 - smoothstep(0.25, 0.75, ndl)); // 明暗交界线
    vec3 sss = alb*alb*1.25;
    col  = alb*keyCol*wrap*mix(0.08, 1.0, sh);
    col += sss*keyCol*term*0.42*mix(0.3, 1.0, sh);
    col += alb*skyCol*(0.55 + 0.45*n.y)*aoC;
    col += alb*bounceCol*(0.5 - 0.5*n.y)*aoC*0.9;
    float fr = 0.035 + 0.965*pow(1.0 - max(dot(n,V),0.0), 5.0);
    col += keyCol*ggx(n, V, L, rough)*spec*0.06*sh*(0.6 + fr);
    col += skyCol*fr*0.12*ao*(0.5 + 0.5*n.y);
    vec3 RL = normalize(rimDir); float rim = pow(1.0 - max(dot(n,V),0.0), 2.0)*max(dot(n, RL) + 0.3, 0.0);
    col += rimCol*rim*mix(vec3(1.0), alb, 0.5)*ao;
  } else if (tF < 1e8) {
    vec3 p = ro + rd*tF;
    vec3 alb = floorCol;
    float pw = ortho > 0.0 ? 1.5*ortho*2.0/res.y : 0.01;
    for (int i = 0; i < 24; i++) { if (i >= nPanel) break;
      vec4 r = panR[i], c = panC[i];
      vec2 ctr = (r.xy + r.zw)*0.5, hs = (r.zw - r.xy)*0.5;
      vec2 qq = abs(p.xz - ctr) - hs + c.w; float sd = length(max(qq, 0.0)) + min(max(qq.x, qq.y), 0.0) - c.w;
      alb = mix(alb, c.rgb, 1.0 - smoothstep(-pw, pw, sd));
    }
    // 纸纹 + 可选的切割垫网格
    alb *= 1.0 + floorTex.x*(vn2(p.xz*24.0) - 0.5) + floorTex.x*0.5*(vn2(p.xz*90.0) - 0.5);
    if (floorTex.y > 0.0) { vec2 g = abs(fract(p.xz/floorTex.z + 0.5) - 0.5)*floorTex.z; float ln = 1.0 - smoothstep(0.0, 0.012, min(g.x, g.y)); alb = mix(alb, alb*0.55 + 0.32, ln*floorTex.y); }
    float sh = 1.0, ao = 1.0;
    if (p.x > sceneLo.x - 4.0 && p.x < sceneHi.x + 4.0 && p.z > sceneLo.z - 4.0 && p.z < sceneHi.z + 4.0) { if (dbg != 1) sh = softShadow(p + vec3(0,0.002,0), L); if (dbg != 2) ao = floorAO(p); }
    vec3 aoC = pow(vec3(ao), vec3(1.3) - alb*0.7);
    col = alb*keyCol*max(L.y, 0.0)*mix(0.2, 1.0, sh) + alb*skyCol*aoC;
    if (dbg == 3) col = vec3(sh); if (dbg == 4) col = vec3(ao);
    float fog = smoothstep(fogNear, fogFar, tF);
    col = mix(col, background(sp), fog);
  } else col = background(sp);
  float depth = (hit && t < tF) ? t : (tF < 1e8 ? tF : 1e4);
  o = vec4(col, depth);
}`;

  // 输出：超采样平均 + 柔和的胶片曲线（白要是白，粉彩不能被压灰）+ 暗角 + 颗粒
  const FS_OUT = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D src; uniform int ss; uniform float exposure, vign, grain, sat, seed; uniform vec2 res;
uniform float focus, aperture, maxCoc; // 景深：对焦距离、光圈（像素 · 世界单位）、最大弥散圈（像素）
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))+seed)*43758.5453); }
float coc(float z){ return min(maxCoc, aperture*abs(1.0/focus - 1.0/z)*focus); }
vec4 px(vec2 q){ // 输出像素坐标 q 处的超采样平均
  ivec2 base = clamp(ivec2(q), ivec2(0), ivec2(res) - 1)*ss; vec4 c = vec4(0.0);
  for (int y = 0; y < 4; y++) for (int x = 0; x < 4; x++) { if (x >= ss || y >= ss) continue; c += texelFetch(src, base + ivec2(x,y), 0); }
  return c/float(ss*ss);
}
void main(){
  vec4 c0 = px(gl_FragCoord.xy);
  vec3 c = c0.rgb;
  if (aperture > 0.0) {
    float r0 = coc(c0.a);
    vec3 acc = c*1.0; float wsum = 1.0;
    float R = maxCoc;
    for (int i = 0; i < 40; i++) {
      float fi = float(i) + 0.5; float rr = sqrt(fi/40.0)*R; float an = fi*2.39996;
      vec2 off = vec2(cos(an), sin(an))*rr;
      vec4 s = px(gl_FragCoord.xy + off);
      float rs = coc(s.a);
      // 样本自己的弥散圈够得着这里才算（前景糊开会盖过来），背景不往清楚的前景里渗
      float w = smoothstep(rr - 1.0, rr + 1.0, min(rs, s.a > c0.a ? r0 : rs));
      acc += s.rgb*w; wsum += w;
    }
    c = acc/wsum;
  }
  c *= exposure;
  c = c*(1.0 + c/9.0)/(1.0 + c); // 扩展 Reinhard，白点 3
  float l = dot(c, vec3(0.2126,0.7152,0.0722)); c = mix(vec3(l), c, sat);
  c = pow(max(c, 0.0), vec3(1.0/2.2));
  vec2 d = uv - 0.5; c *= 1.0 - vign*smoothstep(0.2, 0.9, dot(d,d)*2.4);
  c += (h(gl_FragCoord.xy)-0.5)*grain;
  o = vec4(c, 1.0);
}`;

  function textField(gl, { text, font, worldWidth, W = 3072, Hh = 1280, fit = 0.9, letterSpacing = 0, blur = 2.5 }) {
    const c = document.createElement('canvas'); c.width = W; c.height = Hh;
    const x = c.getContext('2d');
    let size = 400; x.font = font.replace('{S}', size + 'px');
    const sp = s => letterSpacing * s;
    const measure = () => { let w = 0; for (const ch of text) w += x.measureText(ch).width + sp(size); return w - sp(size); };
    size = size * (W * fit) / measure(); x.font = font.replace('{S}', size + 'px');
    x.fillStyle = '#000'; x.fillRect(0, 0, W, Hh); x.fillStyle = '#fff'; x.textBaseline = 'alphabetic';
    const tm = x.measureText(text); const asc = tm.actualBoundingBoxAscent, desc = tm.actualBoundingBoxDescent;
    let cx = (W - measure()) / 2; const by = Hh / 2 + (asc - desc) / 2;
    const glyphs = [];
    for (const ch of text) { const gw = x.measureText(ch).width; x.fillText(ch, cx, by); glyphs.push([cx, cx + gw]); cx += gw + sp(size); }
    const img = x.getImageData(0, 0, W, Hh).data; const a = new Uint8Array(W * Hh);
    for (let i = 0; i < W * Hh; i++) a[i] = img[i * 4];
    const sdf = G.GLK.sdfFromAlpha(a, W, Hh); G.GLK.blurField(sdf, W, Hh, blur);
    const flip = new Float32Array(W * Hh);
    for (let y = 0; y < Hh; y++) flip.set(sdf.subarray((Hh - 1 - y) * W, (Hh - y) * W), y * W);
    // R16F 在 WebGL2 里一定能线性过滤（R32F 要扩展，SwiftShader 上没有就会退成最近邻，字面出台阶）
    const tex = G.GLK.texture(gl, W, Hh, { internal: gl.R16F, format: gl.RED, type: gl.FLOAT, data: flip, filter: gl.LINEAR });
    const pxWorld = worldWidth / W, worldH = Hh * pxWorld;
    // 让字的最低点落在 y = 0（文字局部坐标）
    let lowest = Hh - 1; outer: for (let py = Hh - 1; py >= 0; py--) for (let px = 0; px < W; px += 2) if (a[py * W + px] > 127) { lowest = py; break outer; }
    let highest = 0; outer2: for (let py = 0; py < Hh; py++) for (let px = 0; px < W; px += 2) if (a[py * W + px] > 127) { highest = py; break outer2; }
    const y0 = -(Hh - 1 - lowest) * pxWorld;
    const rect = [-worldWidth / 2, y0, worldWidth, worldH];
    const toWorld = (px, py) => [rect[0] + px * pxWorld, rect[1] + (Hh - 1 - py) * pxWorld];
    const glyphWorld = glyphs.map(([l, r]) => [rect[0] + l * pxWorld, rect[0] + r * pxWorld]);
    const top = (lowest - highest) * pxWorld;
    // 某一列从上往下第一个实心点（文字局部坐标）
    const colTop = (wx) => { const px = Math.round((wx - rect[0]) / pxWorld); if (px < 0 || px >= W) return null;
      for (let py = 0; py < Hh; py++) if (a[py * W + px] > 127) return rect[1] + (Hh - 1 - py) * pxWorld; return null; };
    const rowLeft = (wy) => { const py = Hh - 1 - Math.round((wy - rect[1]) / pxWorld); for (let px = 0; px < W; px++) if (a[py * W + px] > 127) return rect[0] + px * pxWorld; return null; };
    const solid = (wx, wy) => { const px = Math.round((wx - rect[0]) / pxWorld), py = Hh - 1 - Math.round((wy - rect[1]) / pxWorld); return px >= 0 && px < W && py >= 0 && py < Hh && a[py * W + px] > 127; };
    return { tex, rect, pxWorld, glyphs: glyphWorld, top, colTop, rowLeft, solid, toWorld };
  }

  const PAL_N = 12;
  function setScene(gl, P, s) {
    const u = P.u;
    if (!gl._dummy) gl._dummy = G.GLK.texture(gl, 4, 4, { internal: gl.R32F, format: gl.RED, type: gl.FLOAT, data: new Float32Array(16).fill(1), filter: gl.NEAREST });
    if (!gl._prim) gl._prim = G.GLK.texture(gl, 256, 15, { internal: gl.RGBA32F, format: gl.RGBA, type: gl.FLOAT, data: null, filter: gl.NEAREST });
    const PD = new Float32Array(256 * 15 * 4);
    const put = (row, arr) => arr.slice(0, 256).forEach((v, i) => PD.set([v[0] ?? 0, v[1] ?? 0, v[2] ?? 0, v[3] ?? 0], (row * 256 + i) * 4));
    const blobs = s.blobs || [], coils = s.coils || [], dents = s.dents || [], tools = s.tools || [];
    put(0, blobs.map(b => [b.p[0], b.p[1], b.p[2], b.r])); put(1, blobs.map(b => [...(b.s || [1, 1, 1]), b.c]));
    const cp = [], cm = [];
    for (const c of coils) c.pts.forEach((p, i) => { cp.push([p[0], p[1], p[2], p[3] ?? c.r]); cm.push([c.c, i < c.pts.length - 1 ? 1 : 0]); });
    put(2, cp); put(3, cm);
    const chunks = [], ranges = [];
    for (let i = 0; i < cp.length - 1; i += 8) {
      const i1 = Math.min(cp.length - 1, i + 8), seg = cp.slice(i, i1 + 1);
      const c = [0, 1, 2].map(k => seg.reduce((a, p) => a + p[k], 0) / seg.length);
      const r = Math.max(...seg.map(p => Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]) + p[3]));
      chunks.push([...c, r]); ranges.push([i, i1]);
    }
    put(9, chunks); put(10, ranges); put(11, dents.map(d => [d.pad || 0, d.padCol ?? 0]));
    const cyl = s.cyls || []; put(12, cyl.map(c => [...c.p, c.r])); put(13, cyl.map(c => [...c.ax, c.h])); put(14, cyl.map(c => [c.off || 0, c.rr ?? 0.05, c.c ?? 20, 0]));
    put(4, dents.map(d => [...d.p, d.depth])); put(5, dents.map(d => [...d.n, d.size])); put(6, dents.map(d => [...(d.up || [0, 1, 0]), d.freq || 15]));
    put(7, tools.map(t => [...t.a, t.ra])); put(8, tools.map(t => [...t.b, t.rb]));
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, gl._prim);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 256, 15, gl.RGBA, gl.FLOAT, PD);
    gl.uniform1i(u.primTex, 1);
    gl.uniform1i(u.nBlob, blobs.length); gl.uniform1i(u.nCoil, cp.length); gl.uniform1i(u.nDent, dents.length); gl.uniform1i(u.nTool, tools.length); gl.uniform1i(u.nCyl, (s.cyls || []).length); gl.uniform1i(u.nChunk, Math.ceil(Math.max(0, cp.length - 1) / 8));
    const pal = new Float32Array(PAL_N * 3); (s.palette || []).forEach((c, i) => pal.set(c, i * 3)); gl.uniform3fv(u.pal, pal);
    gl.uniform3fv(u.camPos, s.cam.pos); gl.uniform3fv(u.camTgt, s.cam.tgt); gl.uniform1f(u.fov, (s.cam.fov || 30) * Math.PI / 180); gl.uniform1f(u.ortho, s.cam.ortho || 0);
    gl.uniform2fv(u.shift, s.shift || [0, 0]);
    const L = s.light || {};
    gl.uniform3fv(u.lightDir, L.dir || [-0.5, 0.8, 0.55]); gl.uniform3fv(u.keyCol, L.key || [2.2, 2.05, 1.85]);
    gl.uniform3fv(u.skyCol, L.sky || [0.5, 0.52, 0.58]); gl.uniform3fv(u.bounceCol, L.bounce || [0.3, 0.26, 0.22]);
    gl.uniform3fv(u.bgTop, s.bgTop || [0.8, 0.8, 0.8]); gl.uniform3fv(u.bgBot, s.bgBot || [0.7, 0.7, 0.7]); gl.uniform3fv(u.floorCol, s.floorCol || [0.7, 0.7, 0.7]);
    gl.uniform1f(u.floorY, s.floorY ?? 0); gl.uniform1f(u.fogNear, s.fog ? s.fog[0] : 14); gl.uniform1f(u.fogFar, s.fog ? s.fog[1] : 30);
    gl.uniform1f(u.shadowK, s.shadowK ?? 6); gl.uniform1f(u.lumpAmt, s.lump ?? 1); gl.uniform1f(u.seed, s.seed ?? 0);
    gl.uniform4fv(u.floorTex, s.floorTex || [0.04, 0, 1, 0]);
    const pan = (s.panels || []).slice(0, 24); gl.uniform1i(u.nPanel, pan.length);
    const cut = s.cut; gl.uniform1f(u.cutOn, cut ? 1 : 0);
    if (cut) { const nl = Math.hypot(...cut.n); gl.uniform4fv(u.cutPl, [...cut.n.map(v => v / nl), cut.c]); gl.uniform3fv(u.cutOff, cut.off); gl.uniform1f(u.cutX, cut.x ?? -1e5); }
    const mc = new Float32Array(12); (s.marble || []).forEach((h, i) => mc.set(h, i * 3)); gl.uniform3fv(u.mcol, mc); gl.uniform1f(u.mScale, s.marbleScale || 1);
    gl.uniform3fv(u.rimDir, (s.light || {}).rimDir || [0, 0.3, -1]); gl.uniform3fv(u.rimCol, (s.light || {}).rim || [0, 0, 0]);
    if (pan.length) { gl.uniform4fv(u.panR, new Float32Array(pan.flatMap(q => q.r))); gl.uniform4fv(u.panC, new Float32Array(pan.flatMap(q => [...q.c, q.rad || 0]))); } gl.uniform1i(u.dbg, s.dbg || 0);
    const t = s.text;
    gl.uniform1f(u.textOn, t ? 1 : 0);
    G.GLK.bindTex(gl, P, 'sdfTex', t ? t.tex : gl._dummy, 0);
    const tp = s.textPos || [0, 0, 0];
    if (t) {
      gl.uniform4fv(u.texRect, t.rect); gl.uniform1f(u.pxWorld, t.pxWorld);
      const g = t.glyphs, n = g.length;
      const split = [0, 1, 2].map(i => i < n - 1 ? (g[i][1] + g[i + 1][0]) / 2 : 1e5);
      gl.uniform4fv(u.gSplit, [...split, 1e5]);
      const per = (k, def) => [0, 1, 2, 3].map(i => (s[k] || [])[i] ?? def);
      gl.uniform4fv(u.gCol, per('gCol', 0)); gl.uniform4fv(u.gSq, per('gSq', 1)); gl.uniform4fv(u.gRot, per('gRot', 0)); gl.uniform4fv(u.gLift, per('gLift', 0));
      gl.uniform4fv(u.gCx, [0, 1, 2, 3].map(i => i < n ? (g[i][0] + g[i][1]) / 2 : 0));
    }
    gl.uniform3fv(u.textPos, tp); gl.uniform1f(u.H, s.H ?? 0.14); gl.uniform1f(u.R, s.R ?? 0.09); gl.uniform1f(u.warp, s.warp ?? 0.05); gl.uniform1f(u.dome, s.dome ?? 0.06); gl.uniform1f(u.flatOn, s.flat ? 1 : 0);
    // 包围盒
    const pts = [];
    if (t) { const r = t.rect, z = (s.H ?? 0.14) + (s.R ?? 0.09) + (s.dome ?? 0.06) + 0.25;
      if (s.flat) pts.push([tp[0] + r[0] - 0.4, tp[1] - 0.05, tp[2] - t.top * 1.3 - 0.4], [tp[0] + r[0] + r[2] + 0.4, tp[1] + 2 * z, tp[2] + 0.5]);
      else pts.push([tp[0] + r[0] - 0.3, tp[1] - 0.05, tp[2] - z], [tp[0] + r[0] + r[2] + 0.3 + (s.cut ? Math.abs(s.cut.off[0]) : 0), tp[1] + t.top * 1.25 + 0.3 + (s.cut ? Math.abs(s.cut.off[1]) : 0), tp[2] + z + (s.cut ? Math.abs(s.cut.off[2]) : 0)]); }
    blobs.forEach(b => { const m = b.r * Math.max(...(b.s || [1, 1, 1])) + 0.08; pts.push(b.p.map(v => v - m), b.p.map(v => v + m)); });
    cp.forEach(p => { const m = p[3] + 0.06; pts.push([p[0] - m, p[1] - m, p[2] - m], [p[0] + m, p[1] + m, p[2] + m]); });
    dents.filter(d => d.pad).forEach(d => { const m = d.size * d.pad + 0.1; pts.push([d.p[0] - m, 0, d.p[2] - m], [d.p[0] + m, d.p[1], d.p[2] + m]); });
    (s.cyls || []).forEach(c => { const m = Math.max(c.r, c.h) + 0.1; pts.push(c.p.map(v => v - m), c.p.map(v => v + m)); });
    tools.forEach(tt => { const m = Math.max(tt.ra, tt.rb) + 0.05; [tt.a, tt.b].forEach(p => pts.push(p.map(v => v - m), p.map(v => v + m))); });
    const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
    pts.forEach(p => { for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], p[k]); hi[k] = Math.max(hi[k], p[k]); } });
    if (!pts.length) { lo.fill(-1e3); hi.fill(-999); }
    // 盒子外面的距离只是下界：留足 0.7 的边，让阴影和 AO 只在盒子里取样（不然地上会出一圈圈等高线）
    for (let k = 0; k < 3; k++) { lo[k] -= 0.7; hi[k] += 0.7; }
    lo[1] = Math.max(lo[1], (s.floorY ?? 0) - 0.05);
    gl.uniform3fv(u.sceneLo, lo); gl.uniform3fv(u.sceneHi, hi);
    s._bb = [lo, hi];
  }

  function programs(gl) { return { main: G.GLK.program(gl, FS), out: G.GLK.program(gl, FS_OUT) }; }

  async function render(gl, P, s, { ss = 2, tiles = 8, exposure = 1, vign = 0.25, grain = 0.02, sat = 1.04, focus = 10, aperture = 0, maxCoc = 12 } = {}) {
    const W = gl.drawingBufferWidth, Hh = gl.drawingBufferHeight;
    const target = G.GLK.fbo(gl, W * ss, Hh * ss, gl.RGBA16F);
    gl.useProgram(P.main); setScene(gl, P.main, s); gl.uniform2f(P.main.u.res, target.w, target.h);
    await G.GLK.drawTiled(gl, target, tiles);
    gl.useProgram(P.out); G.GLK.bindTex(gl, P.out, 'src', target.tex, 0);
    gl.uniform1i(P.out.u.ss, ss); gl.uniform1f(P.out.u.exposure, exposure); gl.uniform1f(P.out.u.vign, vign); gl.uniform1f(P.out.u.grain, grain);
    gl.uniform1f(P.out.u.sat, sat); gl.uniform1f(P.out.u.focus, focus); gl.uniform1f(P.out.u.aperture, aperture * W / 1920); gl.uniform1f(P.out.u.maxCoc, maxCoc * W / 1920); gl.uniform1f(P.out.u.seed, 1.0); gl.uniform2f(P.out.u.res, W, Hh);
    await G.GLK.drawTiled(gl, null, 3);
    gl.deleteTexture(target.tex); gl.deleteFramebuffer(target.fb);
  }

  // 世界坐标 → 屏幕像素（CSS 像素，左上为原点）
  function project(s, p, Wpx, Hpx) {
    const c = s.cam, sh = s.shift || [0, 0];
    const fw = norm(sub(c.tgt, c.pos)), rt = norm(cross(fw, [0, 1, 0])), up = cross(rt, fw);
    const v = sub(p, c.pos);
    let sx, sy;
    if (c.ortho) { sx = dot(v, rt) / c.ortho; sy = dot(v, up) / c.ortho; }
    else { const f = 1 / Math.tan((c.fov || 30) * Math.PI / 360), z = dot(v, fw); sx = dot(v, rt) / z * f; sy = dot(v, up) / z * f; }
    sx -= sh[0] * 2; sy -= sh[1] * 2;
    return [(sx * Hpx + Wpx) / 2, Hpx - (sy * Hpx + Hpx) / 2];
  }
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const norm = v => { const l = Math.hypot(...v); return v.map(x => x / l); }, cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const hex = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => Math.pow(v / 255, 2.2)); };

  G.CLAY = { FS, programs, textField, setScene, render, project, hex };
})(window);
