// chrome.js — 液态金属渲染器：文字距离场挤出 + 平滑并集（smin）的液滴 / 拉丝 / 水洼 / 皇冠溅射
// 全部在一个光线步进着色器里：镜面反射 3 次弹射，环境是手写的“摄影棚”（地平线 + 柔光箱 + 彩色色片）
(function (G) {
  const FS = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;
uniform vec2 res; uniform vec2 shift; // shift：镜头平移（构图用）
uniform sampler2D sdfTex; uniform vec4 texRect; uniform float pxWorld;
uniform float T, R, H, wob;
uniform vec3 camPos, camTgt; uniform float fov, roll;
uniform vec4 drips[32]; uniform vec4 dripB[32]; uniform int nDrips;
uniform vec4 drops[40]; uniform vec3 dropS[40]; uniform int nDrops;
uniform vec4 blobs[10]; uniform float blobK[10]; uniform int nBlobs;
uniform vec4 pools[8]; uniform int nPools;
uniform vec4 rip[8]; uniform int nRip;
uniform vec4 crowns[4]; uniform int nCrowns;
uniform vec4 spikes[64]; uniform int nSpikes; uniform vec4 spikeC; uniform float spikeK, bwob;
uniform float useText, floorOn, floorY, backdropMode;
uniform vec3 bdTop, bdBot, bdGlow; uniform vec2 bdGlowPos;
uniform float envHue, envRot;
uniform vec3 tint, floorTint; uniform mat3 grot; uniform vec3 gpos;

float smin(float a, float b, float k){ float h = max(k-abs(a-b),0.0)/k; return min(a,b) - h*h*k*0.25; }
vec4 bsw(float t){ float t2=t*t, t3=t2*t; return vec4((1.0-t)*(1.0-t)*(1.0-t), 3.0*t3-6.0*t2+4.0, -3.0*t3+3.0*t2+3.0*t+1.0, t3)/6.0; }
float sampleSdf(vec2 q){
  ivec2 sz = textureSize(sdfTex, 0);
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
    vec4 r = rip[i]; float d = length(xz - r.xy); float front = r.z*1.6;
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
float mapLiquid(vec3 p){
  p = grot*(p - gpos);
  float d = sdLetters(p);
  for(int i=0;i<32;i++){ if(i>=nDrips) break;
    vec4 a = drips[i]; vec4 b = dripB[i];
    float dd = sdRoundCone(p, a.xyz, b.xyz, a.w, b.w);
    d = smin(d, dd, 0.16);
  }
  for(int i=0;i<10;i++){ if(i>=nBlobs) break;
    vec4 b = blobs[i]; vec3 q = p-b.xyz;
    float w = (i==0) ? bwob*(sin(q.x*4.0+T*1.3)*sin(q.y*3.6-T)*sin(q.z*4.4+T*0.7)) : 0.0;
    d = smin(d, length(q)-b.w + w, blobK[i]);
  }
  // 磁流体的刺：从球心往外长的圆锥，smin 出凹下去的根
  for(int i=0;i<64;i++){ if(i>=nSpikes) break;
    vec4 s = spikes[i]; vec3 a = spikeC.xyz + s.xyz*spikeC.w*0.55, b = spikeC.xyz + s.xyz*(spikeC.w + s.w);
    d = smin(d, sdRoundCone(p, a, b, spikeC.w*0.2, 0.006), spikeK);
  }
  return d;
}
float mapDrops(vec3 p){
  p = grot*(p - gpos);
  float d = 1e5;
  for(int i=0;i<40;i++){ if(i>=nDrops) break;
    vec4 a = drops[i]; d = smin(d, sdEll(p-a.xyz, a.w*dropS[i]), 0.05);
  }
  return d;
}
float mapPool(vec3 p){
  float d = 1e5;
  for(int i=0;i<4;i++){ if(i>=nCrowns) break; d = min(d, sdCrown(p, crowns[i])); }
  if (nPools==0) return d;
  for(int i=0;i<8;i++){ if(i>=nPools) break;
    vec4 a = pools[i]; d = smin(d, sdEll(p - vec3(a.x, floorY, a.y), vec3(a.z, a.w, a.z*0.62)), 0.35);
  }
  if (d < 0.25) d -= ripH(p.xz) * smoothstep(0.0, 0.04, p.y-floorY);
  return d;
}
float map(vec3 p){
  float d = mapLiquid(p);
  d = smin(d, mapDrops(p), 0.08);
  d = smin(d, mapPool(p), 0.12);
  return d;
}
vec3 nrm(vec3 p, float t){
  float e = 0.0006*max(1.0,t*0.35);
  vec2 k = vec2(1,-1);
  return normalize(k.xyy*map(p+k.xyy*e) + k.yyx*map(p+k.yyx*e) + k.yxy*map(p+k.yxy*e) + k.xxx*map(p+k.xxx*e));
}
float ao(vec3 p, vec3 n){
  float occ = 0.0, sca = 1.0;
  for(int i=1;i<=5;i++){ float h = 0.02 + 0.09*float(i); float d = map(p + n*h); occ += (h-d)*sca; sca *= 0.75; }
  return clamp(1.0 - 1.6*occ, 0.0, 1.0);
}
float march(vec3 ro, vec3 rd, float tmax){
  float t = 0.0;
  for(int i=0;i<220;i++){
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
vec3 env(vec3 d){
  float ca = cos(envRot), sa = sin(envRot); d.xz = mat2(ca,-sa,sa,ca)*d.xz;
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
    float tf = (floorOn > 0.5 && rd.y < -1e-4) ? (floorY - ro.y)/rd.y : 1e9;
    float t = march(ro, rd, min(tf, 60.0));
    if (t > 0.0){
      vec3 p = ro + rd*t; vec3 n = nrm(p, t);
      float cs = clamp(dot(n,-rd),0.0,1.0);
      vec3 F0 = tint;
      vec3 F = F0 + (1.0-F0)*pow(1.0-cs, 5.0);
      float a = ao(p, n);
      thr *= F * mix(0.25, 1.0, a);
      ro = p + n*0.004; rd = reflect(rd, n);
      viaFloor = false;
      if (b == 3) col += thr*env(rd)*0.5;
      continue;
    }
    if (tf < 1e8){
      vec3 p = ro + rd*tf;
      float e = 0.004;
      float hx = ripH(p.xz + vec2(e,0)) - ripH(p.xz - vec2(e,0));
      float hz = ripH(p.xz + vec2(0,e)) - ripH(p.xz - vec2(0,e));
      vec3 n = normalize(vec3(-hx/(2.0*e), 1.0, -hz/(2.0*e)));
      float cs = clamp(dot(n,-rd), 0.0, 1.0);
      vec3 F = floorTint + (1.0-floorTint)*pow(1.0-cs, 5.0);
      float occ = smoothstep(-0.05, 0.5, map(p + vec3(0,0.12,0)));
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
    const tex = G.GLK.texture(gl, W, Hh, { internal: gl.R32F, format: gl.RED, type: gl.FLOAT, data: flip, filter: gl.NEAREST });
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
    const v4 = (name, arr, n) => { if (!arr.length) return; const f = new Float32Array(n * 4); arr.forEach((a, i) => f.set(a, i * 4)); gl.uniform4fv(u[name], f); };
    const v3 = (name, arr, n) => { if (!arr.length) return; const f = new Float32Array(n * 3); arr.forEach((a, i) => f.set(a, i * 3)); gl.uniform3fv(u[name], f); };
    const drips = s.drips || [];
    v4('drips', drips.map(d => d[0]), 32); v4('dripB', drips.map(d => d[1]), 32); gl.uniform1i(u.nDrips, drips.length);
    const drops = s.drops || [];
    v4('drops', drops.map(d => d.slice(0, 4)), 40); v3('dropS', drops.map(d => d[4] || [1, 1, 1]), 40); gl.uniform1i(u.nDrops, drops.length);
    const blobs = s.blobs || [];
    v4('blobs', blobs.map(b => b.slice(0, 4)), 10);
    if (blobs.length) gl.uniform1fv(u.blobK, new Float32Array(10).map((_, i) => blobs[i] ? (blobs[i][4] ?? 0.3) : 0.3));
    gl.uniform1i(u.nBlobs, blobs.length);
    v4('pools', s.pools || [], 8); gl.uniform1i(u.nPools, (s.pools || []).length);
    v4('rip', s.ripples || [], 8); gl.uniform1i(u.nRip, (s.ripples || []).length);
    v4('crowns', s.crowns || [], 4); gl.uniform1i(u.nCrowns, (s.crowns || []).length);
    v4('spikes', s.spikes || [], 64); gl.uniform1i(u.nSpikes, (s.spikes || []).length);
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
      gl.uniform4fv(u.texRect, s.text.rect); gl.uniform1f(u.pxWorld, s.text.pxWorld);
    }
  }

  async function render(gl, P, target, s, tiles = 8) {
    gl.useProgram(P);
    setScene(gl, P, s);
    gl.uniform2f(P.u.res, target.w, target.h);
    gl.uniform2fv(P.u.shift, s.shift || [0, 0]);
    await G.GLK.drawTiled(gl, target, tiles);
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

  G.CHROME = { FS, textField, render, setScene, envPreview, project, toWorld };
})(window);
