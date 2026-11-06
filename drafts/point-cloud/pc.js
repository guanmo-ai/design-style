// pc.js — 点云渲染器：几百万个带颜色的点，按深度变大小（近大远小 + 景深），加法混合进浮点缓冲
// 扫描面（sweep）以上是真颜色，扫描面上闪一道青光，以下只剩稀疏的“预览点”；顶上一段被风吹散，带运动拖尾
(function (G) {
  const VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 pos; layout(location=1) in vec3 col; layout(location=2) in vec4 aux; // aux: 世界尺寸, 随机数, 相位, 类别
uniform mat4 view, proj; uniform float fpx; // fpx：焦距（像素）
uniform float sweepY, sweepW, ghostFrac, focusD, aperture, minSize, gain;
uniform vec3 edgeCol, ghostCol; uniform float sweepDir, pushK; uniform vec4 push; uniform vec3 pushCol;
uniform float ghostA, nearA, nearB, movingA, glowA, rampOn, rampLen, falloff, rampGain;
uniform vec3 dCol; uniform float dFrac, dFront, dSpan, dAmt, dLift, dSwirl, trail, T; uniform vec3 dAxis;
uniform float sweepOn, mode, sizeK; // mode: 0 不透明主体, 1 加法, 2 拖尾
uniform vec4 clipBox; // 剖切：x>clipBox.x 的点不画（clipBox.w>0 时生效）
out vec3 vCol; out float vA; out float vBok;
float h1(float n){ return fract(sin(n*91.345)*47453.5453); }
vec3 turbo(float x){
  const vec4 kR = vec4(0.13572138, 4.61539260, -42.66032258, 132.13108234), kG = vec4(0.09140261, 2.19418839, 4.84296658, -14.18503333), kB = vec4(0.10667330, 12.64194608, -60.58204836, 110.36276771);
  const vec2 kR2 = vec2(-152.94239396, 59.28637943), kG2 = vec2(4.27729857, 2.82956604), kB2 = vec2(-89.90310912, 27.34824973);
  x = clamp(x, 0.0, 1.0); vec4 v4 = vec4(1.0, x, x*x, x*x*x); vec2 v2 = v4.zw*v4.z;
  return vec3(dot(v4,kR)+dot(v2,kR2), dot(v4,kG)+dot(v2,kG2), dot(v4,kB)+dot(v2,kB2));
}
vec3 curl(vec3 p){
  return vec3(sin(p.y*1.3+T)+sin(p.z*0.7), sin(p.z*1.1-T*0.7)+sin(p.x*0.9), sin(p.x*1.2+T*0.5)+sin(p.y*0.8));
}
void main(){
  vec3 p = pos; vec3 c = col; float a = gain; float kind = aux.w;
  if (clipBox.w > 0.5 && p.x > clipBox.x && kind < 2.5) { gl_Position = vec4(2.,2.,2.,1.); gl_PointSize = 0.; return; }
  // —— 被卷走：相位在 [dFront-dSpan, dFront+dSpan] 的一段，绕井轴转着往下掉 ——
  float amt = 0.0;
  if (dAmt > 0.0 && kind < 2.5) {
    amt = clamp(1.0 - abs(aux.z - dFront)/dSpan + (aux.y-0.5)*0.8, 0.0, 1.0) * step(h1(aux.y*41.0), dFrac);
    amt = amt*amt*(3.0-2.0*amt) * dAmt;
  }
  bool moving = amt > 0.02;
  if (mode > 1.5) { if (!moving) { gl_Position = vec4(2.,2.,2.,1.); gl_PointSize = 0.; return; } amt *= trail; a *= 0.34*trail; }
  if (amt > 0.0) {
    float ang = amt*dSwirl*(0.55 + 0.9*h1(aux.y*17.0));
    float ca = cos(ang), sa = sin(ang);
    p.xz = mat2(ca, sa, -sa, ca)*p.xz * (1.0 - 0.18*amt*h1(aux.y*5.0));
    p.y -= amt*dLift*(0.4 + h1(aux.y*29.0));
    p += curl(p*0.5 + aux.y*6.0)*0.12*amt;
    c = mix(c, dCol, amt*0.75);
    a *= movingA;
  }
  // —— 扫描面 ——
  bool ghost = false; float band = 0.0;
  // 鼠标推开：在垂直于视线的平面上把点往外推，留出一个洞
  if (push.w > 0.0) {
    vec3 vd = -vec3(view[0][2], view[1][2], view[2][2]);
    vec3 d = p - push.xyz; d -= dot(d, vd)*vd; float L = length(d);
    if (L < push.w) { float f = pow(1.0 - L/push.w, 2.0); p += d/max(L,1e-4) * pushK * f; c = mix(c, pushCol, f*0.85); }
  }
  if (sweepOn > 0.5 && kind < 2.5) {
    float s = (p.y - sweepY)*sweepDir;
    if (s < 0.0 && !moving && rampOn > 0.5) {
      // 还没上色：激光雷达的高度色带（turbo），结构明暗从原色里取回来
      float L = 0.03 + 0.97*exp(p.y/falloff);
      float lum = dot(col, vec3(0.3,0.5,0.2));
      float st = clamp(lum/(L*0.75), 0.15, 1.2); st = st*st;
      float t = clamp(-s/rampLen, 0.0, 1.0);
      c = turbo(0.92 - 0.84*pow(t, 0.8)) * st * rampGain * (1.0 - 0.88*pow(t, 0.6));
      if (kind > 0.5 && kind < 1.5) c *= 1.6;
      float e = exp(s/sweepW);
      c = mix(c, edgeCol*3.0, e*0.92);
      band = e;
    } else if (s < 0.0 && !moving) {
      if (aux.y > ghostFrac) { gl_Position = vec4(2.,2.,2.,1.); gl_PointSize = 0.; return; }
      c = ghostCol; a *= ghostA; ghost = true;
    } else {
      float e = exp(-abs(s)/sweepW);
      float settle = exp(-max(s,0.0)/(sweepW*14.0));
      c = mix(c, edgeCol*3.0, e*0.92) + edgeCol*settle*0.22;
      band = e;
    }
  }
  if (kind > 2.5) { a *= sweepOn; }
  bool additive = moving || ghost || kind > 2.5;
  bool glowCopy = (mode > 0.5 && mode < 1.5 && !additive && band > 0.08); // 扫描线：再用加法画一遍更大的点，让它发光
  if ((mode < 0.5 && additive) || (mode > 0.5 && mode < 1.5 && !additive && !glowCopy)) { gl_Position = vec4(2.,2.,2.,1.); gl_PointSize = 0.; return; }
  if (glowCopy) { c = edgeCol; a = band*glowA; }
  vec4 vp = view*vec4(p,1.0);
  float depth = -vp.z;
  gl_Position = proj*vp;
  float s0 = aux.x*fpx/max(depth,0.05)*(mode < 0.5 ? sizeK : 1.0) * (glowCopy ? 2.2 : 1.0);
  float nf = smoothstep(nearA, nearB, depth); c *= mix(0.08, 1.0, nf);
  float coc = aperture*fpx*abs(depth-focusD)/max(depth,0.05)/max(focusD,0.1);
  float size = max(minSize, sqrt(s0*s0 + coc*coc));
  gl_PointSize = min(size, 600.0);
  if (mode < 0.5) { gl_PointSize = max(minSize, s0); a = gain; vBok = -1.0; }
  else { a *= (s0*s0)/(size*size) * (size > 600.0 ? (size*size)/(360000.0) : 1.0); vBok = smoothstep(4.0, 18.0, size); }
  vCol = c; vA = a;
}`;
  const FS = `#version 300 es
precision highp float; in vec3 vCol; in float vA; in float vBok; out vec4 o;
void main(){
  vec2 q = gl_PointCoord*2.0-1.0; float r2 = dot(q,q); if (r2 > 1.0) discard;
  if (vBok < -0.5) { o = vec4(vCol*vA*(1.0 - 0.25*r2), 1.0); return; } // 不透明的点：带一点球形暗边
  float g = exp(-r2*3.2)*1.55;                      // 小点：高斯
  float b = (smoothstep(1.0, 0.86, r2) * (0.75 + 0.35*smoothstep(0.5,0.95,r2)))*0.62; // 大点：光斑（散景）
  float w = mix(g, b, vBok);
  o = vec4(vCol*vA*w, 1.0);
}`;

  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // 可增长的点缓冲：每点 10 个 float
  function Cloud(cap) {
    let buf = new Float32Array(cap * 10), n = 0;
    return {
      push(x, y, z, r, g, b, w, rnd, ph, kind) {
        if (n >= cap) { cap *= 2; const nb = new Float32Array(cap * 10); nb.set(buf); buf = nb; }
        const o = n * 10; buf[o] = x; buf[o + 1] = y; buf[o + 2] = z; buf[o + 3] = r; buf[o + 4] = g; buf[o + 5] = b; buf[o + 6] = w; buf[o + 7] = rnd; buf[o + 8] = ph; buf[o + 9] = kind; n++;
      },
      get data() { return buf.subarray(0, n * 10); }, get count() { return n; },
    };
  }

  // —— 螺旋楼梯（俯看是一口井）——
  function staircase(o = {}) {
    const R = mulberry(o.seed || 3);
    const Rin = o.Rin || 2.55, Rout = o.Rout || 4.8, turnH = o.turnH || 3.7, per = o.per || 24, turns = o.turns || 9, h = turnH / per, D = 2 * Math.PI / per;
    const dens = o.density || 2600;
    const C = Cloud(3_000_000);
    const depthL = y => 0.03 + 0.97 * Math.exp(y / (o.falloff || 9.0));
    const windows = [];
    for (let k = 0; k < turns * 3; k++) { const th = k * (2 * Math.PI / 3) + 0.6; windows.push({ th, y: -th / (2 * Math.PI) * turnH + 1.55, cold: k % 2 === 0 }); }
    const wpos = windows.map(w => [Math.cos(w.th) * Rout, w.y, Math.sin(w.th) * Rout]);
    const winLight = (x, y, z) => {
      let L = [0, 0, 0];
      for (let i = 0; i < wpos.length; i++) {
        const dx = x - wpos[i][0], dy = y - wpos[i][1], dz = z - wpos[i][2]; const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < 12) { const f = Math.pow(1 - Math.sqrt(d2) / 3.46, 2) * 1.4; const c = windows[i].cold ? [0.45, 0.7, 1.0] : [1.0, 0.62, 0.3]; L[0] += c[0] * f; L[1] += c[1] * f; L[2] += c[2] * f; }
      }
      return L;
    };
    const steps = Math.round(turns * per);
    for (let k = 0; k < steps; k++) {
      const th0 = k * D, y = -k * h, ph = k / per;
      const tone = 0.9 + R() * 0.18, warm = R() * 0.05;
      // 踏面
      const area = D / 2 * (Rout * Rout - Rin * Rin), n = Math.round(area * dens);
      for (let i = 0; i < n; i++) {
        const u = R(), v = R();
        const r = Math.sqrt(Rin * Rin + u * (Rout * Rout - Rin * Rin)), th = th0 + v * D;
        const x = Math.cos(th) * r, z = Math.sin(th) * r;
        const L = depthL(y) * (0.92 + 0.08 * (1 - (r - Rin) / (Rout - Rin))) * (0.62 + 0.38 * (0.5 + 0.5 * Math.cos(th - 2.4)));
        const nose = v < 0.07 ? 1.25 : 1.0; const ao = r > Rout - 0.25 ? 0.75 : 1.0;
        const wl = winLight(x, y, z), j = 0.92 + R() * 0.16;
        C.push(x, y, z, (0.82 + warm) * tone * L * nose * ao * j + wl[0] * 0.8, 0.72 * tone * L * nose * ao * j + wl[1] * 0.8, 0.6 * tone * L * nose * ao * j + wl[2] * 0.8, 1 / Math.sqrt(dens), R(), ph + v / per, 0);
      }
      // 踢面（竖着的一小条）
      const thr = th0 + D, nr = Math.round((Rout - Rin) * h * dens * 0.8);
      for (let i = 0; i < nr; i++) {
        const r = Rin + R() * (Rout - Rin), yy = y - R() * h; const x = Math.cos(thr) * r, z = Math.sin(thr) * r;
        const L = depthL(yy) * 0.5;
        C.push(x, yy, z, 0.8 * L, 0.7 * L, 0.6 * L, 1 / Math.sqrt(dens), R(), ph + 1 / per, 0);
      }
      // 内侧梁（踏面下沿的一圈侧面）
      const nb = Math.round(Rin * D * 0.4 * dens * 0.8);
      for (let i = 0; i < nb; i++) {
        const th = th0 + R() * D, yy = y - R() * 0.4; const x = Math.cos(th) * Rin, z = Math.sin(th) * Rin;
        const L = depthL(yy) * 0.62;
        C.push(x, yy, z, 0.86 * L, 0.78 * L, 0.68 * L, 1 / Math.sqrt(dens), R(), ph, 0);
      }
      // 栏杆立柱：每级两根
      for (let b = 0; b < 2; b++) {
        const th = th0 + (b + 0.5) * D / 2, x = Math.cos(th) * (Rin + 0.08), z = Math.sin(th) * (Rin + 0.08);
        for (let i = 0; i < 70; i++) { const yy = y + R() * 0.95; const L = depthL(yy) * 0.55; C.push(x + (R() - .5) * 0.02, yy, z + (R() - .5) * 0.02, 0.32 * L, 0.24 * L, 0.18 * L, 0.012, R(), ph, 2); }
      }
    }
    // 扶手：一条连续的螺旋管
    const railLen = turns * Math.sqrt(Math.pow(2 * Math.PI * (Rin + 0.08), 2) + turnH * turnH);
    const nRail = Math.round(railLen * 2200);
    for (let i = 0; i < nRail; i++) {
      const t = R() * turns * 2 * Math.PI, a = R() * 2 * Math.PI;
      const cx = Math.cos(t) * (Rin + 0.08), cz = Math.sin(t) * (Rin + 0.08), cy = -t / (2 * Math.PI) * turnH + 0.98;
      const rr = 0.045; const nx = Math.cos(t) * Math.cos(a), nz = Math.sin(t) * Math.cos(a), ny = Math.sin(a);
      const L = depthL(cy) * (0.4 + 0.9 * Math.max(0, ny));
      C.push(cx + nx * rr, cy + ny * rr, cz + nz * rr, 0.62 * L + 0.05, 0.42 * L + 0.03, 0.26 * L + 0.02, 0.012, R(), t / (2 * Math.PI), 2);
    }
    // 外墙（开窗）
    const wallTop = 0.8, wallBot = -turns * turnH - 1.2, wa = 2 * Math.PI * Rout * (wallTop - wallBot), nw = Math.round(wa * dens * 0.55);
    for (let i = 0; i < nw; i++) {
      const th = R() * 2 * Math.PI, y = wallBot + R() * (wallTop - wallBot);
      let hole = false, glow = 0;
      for (const w of windows) { let dth = Math.abs(((th - w.th) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI) * Rout; const dy = Math.abs(y - w.y); if (dth < 0.42 && dy < 0.85) { hole = true; } else if (dth < 1.3 && dy < 1.6) glow = Math.max(glow, (1 - dth / 1.3) * (1 - dy / 1.6)); }
      if (hole) continue;
      const x = Math.cos(th) * Rout, z = Math.sin(th) * Rout;
      const thc = -(y - 0.0) / turnH * 2 * Math.PI; // 这一高度对应的楼梯相位
      const L = depthL(y) * 0.42; const wl = winLight(x * 0.97, y, z * 0.97); const j = 0.9 + R() * 0.2;
      C.push(x, y, z, 0.88 * L * j + wl[0] * 0.5 + glow * 0.2, 0.82 * L * j + wl[1] * 0.5 + glow * 0.15, 0.74 * L * j + wl[2] * 0.5 + glow * 0.1, 1 / Math.sqrt(dens * 0.55), R(), 50, 0);
    }
    // 窗洞：发光的点（天光 / 暖光）
    for (const w of windows) {
      const c = w.cold ? [0.7, 0.88, 1.25] : [1.35, 0.95, 0.55];
      for (let i = 0; i < 1600; i++) {
        const dth = (R() - .5) * 0.84 / Rout, dy = (R() - .5) * 1.7, th = w.th + dth;
        const x = Math.cos(th) * (Rout + 0.05), z = Math.sin(th) * (Rout + 0.05), L = 0.35 + 0.65 * depthL(w.y);
        C.push(x, w.y + dy, z, c[0] * L * 1.6, c[1] * L * 1.6, c[2] * L * 1.6, 0.03, R(), 50, 1);
      }
    }
    // 井底：一圈马赛克
    const yb = -turns * turnH - 0.15, nf = Math.round(Math.PI * Rout * Rout * dens * 0.5);
    for (let i = 0; i < nf; i++) {
      const r = Math.sqrt(R()) * Rout, th = R() * 2 * Math.PI; const ring = Math.floor(r * 3) % 2, sp = Math.floor((th / (2 * Math.PI)) * 24 + r * 2) % 2;
      const terr = ring ^ sp; const L = depthL(yb) * 2.5 + 0.03;
      C.push(Math.cos(th) * r, yb, Math.sin(th) * r, (terr ? 0.85 : 0.9) * L, (terr ? 0.45 : 0.84) * L, (terr ? 0.3 : 0.74) * L, 1 / Math.sqrt(dens * 0.5), R(), turns, 0);
    }
    return { cloud: C, Rin, Rout, turnH, turns, windows };
  }

  // 激光片：扫描面上一层很淡的点（看起来像一片光）
  function sheet(C, y, Rout, n, R) {
    for (let i = 0; i < n; i++) { const r = Math.sqrt(R()) * Rout * 0.995, th = R() * 2 * Math.PI; const edge = Math.pow(r / Rout, 6);
      C.push(Math.cos(th) * r, y, Math.sin(th) * r, 0.05 + edge * 0.6, 0.35 + edge * 1.4, 0.55 + edge * 1.8, 0.03, R(), 0, 3); }
  }

  // —— 盆景（手机里扫描的那件东西）：S 形树干 + 几片水平的“云片”叶团 ——
  function bonsai(o = {}) {
    const R = mulberry(o.seed || 9), C = Cloud(900_000);
    const push = (x, y, z, c, w = 0.006, kind = 0) => C.push(x, y, z, c[0], c[1], c[2], w, R(), y, kind);
    // 桌面：圆角的一块深色木板，边缘渐隐
    for (let i = 0; i < 90000; i++) { const x = (R() - .5) * 1.1, z = (R() - .5) * 0.75; const e = Math.max(0, 1 - Math.pow(Math.hypot(x / 0.55, z / 0.375), 6));
      if (R() > e) continue; const g = 0.8 + 0.2 * Math.sin(x * 46 + Math.sin(z * 7) * 2.5); const L = 0.32 * (1 - 0.4 * Math.hypot(x, z)); push(x, 0, z, [0.5 * g * L, 0.33 * g * L, 0.2 * g * L], 0.0045); }
    // 花盆：椭圆浅盆（青瓷），外壁 + 口沿
    for (let i = 0; i < 80000; i++) { const t = R() * 2 * Math.PI, v = R(); const rx = 0.25 - 0.035 * (1 - v), rz = 0.16 - 0.025 * (1 - v), y = 0.015 + v * 0.085;
      const L = 0.45 + 0.55 * Math.max(0, Math.cos(t - 2.2)); push(Math.cos(t) * rx, y, Math.sin(t) * rz, [0.2 * L, 0.42 * L, 0.5 * L], 0.004); }
    for (let i = 0; i < 12000; i++) { const t = R() * 2 * Math.PI, w = R() * 0.012; push(Math.cos(t) * (0.25 - w), 0.1, Math.sin(t) * (0.16 - w), [0.4, 0.62, 0.68], 0.004); }
    for (let i = 0; i < 26000; i++) { const t = R() * 2 * Math.PI, r = Math.sqrt(R()); const moss = R() < 0.5; push(Math.cos(t) * r * 0.235, 0.096 + R() * 0.006, Math.sin(t) * r * 0.148, moss ? [0.16, 0.3, 0.1] : [0.2, 0.15, 0.1], 0.004); }
    // 树干：一条 S 形曲线（三次贝塞尔），越往上越细
    const bez = (P, t) => { const u = 1 - t; return [0, 1, 2].map(k => u * u * u * P[0][k] + 3 * u * u * t * P[1][k] + 3 * u * t * t * P[2][k] + t * t * t * P[3][k]); };
    const limb = (P, r0, r1, n) => { for (let i = 0; i < n; i++) { const t = R(), c = bez(P, t), ang = R() * 2 * Math.PI, rr = r0 + (r1 - r0) * t;
      const L = 0.38 + 0.5 * Math.max(0, Math.cos(ang - 0.6)); const bark = 0.85 + 0.3 * Math.sin(t * 60 + ang * 3);
      push(c[0] + Math.cos(ang) * rr, c[1] + Math.sin(ang) * rr * 0.5, c[2] + Math.sin(ang) * rr, [0.36 * L * bark, 0.26 * L * bark, 0.18 * L * bark], 0.0035); } };
    const trunk = [[0.03, 0.1, 0], [-0.12, 0.22, 0.02], [0.14, 0.32, -0.02], [-0.02, 0.52, 0.0]];
    limb(trunk, 0.04, 0.016, 60000);
    // 枝 + 云片：每片是压扁的椭球，上面亮下面暗
    const pads = [
      { at: 0.45, end: [-0.27, 0.36, 0.05], r: [0.14, 0.04, 0.11] },
      { at: 0.62, end: [0.27, 0.43, -0.04], r: [0.13, 0.04, 0.1] },
      { at: 0.8, end: [-0.17, 0.53, -0.06], r: [0.12, 0.038, 0.1] },
      { at: 0.9, end: [0.15, 0.59, 0.06], r: [0.1, 0.035, 0.09] },
      { at: 1.0, end: [-0.01, 0.66, 0.0], r: [0.11, 0.045, 0.1] },
    ];
    for (const pd of pads) {
      const s0 = bez(trunk, pd.at), e = pd.end; const mid = [(s0[0] + e[0]) / 2, Math.max(s0[1], e[1]) + 0.02, (s0[2] + e[2]) / 2];
      if (pd.at < 1) limb([s0, mid, mid, [e[0], e[1] - 0.02, e[2]]], 0.013, 0.006, 9000);
      const n = Math.round(pd.r[0] * pd.r[2] * 9e6);
      for (let i = 0; i < n; i++) { let x, y, z; do { x = R() * 2 - 1; y = R() * 2 - 1; z = R() * 2 - 1; } while (x * x + y * y + z * z > 1);
        // 叶团表面多、里面少（扫描只扫得到表面）
        const L0 = Math.hypot(x, y, z); if (L0 < 0.75 && R() < 0.85) continue;
        const bump = 1 + 0.18 * Math.sin(x * 9 + z * 7) * Math.sin(z * 11);
        const px = e[0] + x * pd.r[0] * bump, py = e[1] + y * pd.r[1] * bump + 0.015, pz = e[2] + z * pd.r[2] * bump;
        const top = (y + 1) / 2, hue = R(), g = 0.35 + 0.75 * Math.pow(top, 1.3);
        push(px, py, pz, [(0.13 + 0.12 * hue) * g, (0.36 + 0.22 * hue) * g, (0.1 + 0.05 * hue) * g], 0.0042);
      }
    }
    return { cloud: C };
  }

  // —— 相机 ——
  function lookAt(eye, tgt, up) {
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], n = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
    const cr = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], dt = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const z = n(sub(eye, tgt)), x = n(cr(up, z)), y = cr(z, x);
    return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dt(x, eye), -dt(y, eye), -dt(z, eye), 1]);
  }
  function persp(fovY, aspect, near, far, shift = [0, 0]) {
    const f = 1 / Math.tan(fovY / 2), nf = 1 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, shift[0], shift[1], (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  }
  function mul(m, v) { const r = [0, 0, 0, 0]; for (let i = 0; i < 4; i++) r[i] = m[i] * v[0] + m[4 + i] * v[1] + m[8 + i] * v[2] + m[12 + i] * v[3]; return r; }
  function camera(c, W, H) {
    const view = lookAt(c.pos, c.tgt, c.up || [0, 1, 0]);
    const proj = persp(c.fov * Math.PI / 180, W / H, 0.05, 400, c.shift || [0, 0]);
    const fpx = (H / 2) / Math.tan(c.fov * Math.PI / 360);
    const project = (p) => { const v = mul(view, [p[0], p[1], p[2], 1]); const q = mul(proj, v); return [(q[0] / q[3] * 0.5 + 0.5) * W, (0.5 - q[1] / q[3] * 0.5) * H, -v[2]]; };
    return { view, proj, fpx, project };
  }

  function makeProgram(gl) { return G.GLK.program(gl, FS, VS); }

  function upload(gl, data) {
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 40, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 40, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 40, 24);
    gl.bindVertexArray(null);
    return { vao, count: data.length / 10 };
  }

  // 画：主体一次 + 拖尾若干次
  function depthTarget(gl, target) {
    if (target.depth) return;
    const rb = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, target.w, target.h);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
    target.depth = rb;
  }
  async function draw(gl, P, target, mesh, s) {
    depthTarget(gl, target);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb); gl.viewport(0, 0, target.w, target.h);
    gl.clearColor(...(s.clear || [0, 0, 0]), 1); gl.clearDepth(1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(P); const u = P.u; const cam = camera(s.cam, target.w, target.h);
    gl.uniformMatrix4fv(u.view, false, cam.view); gl.uniformMatrix4fv(u.proj, false, cam.proj); gl.uniform1f(u.fpx, cam.fpx);
    gl.uniform1f(u.sweepOn, s.sweep ? 1 : 0); gl.uniform1f(u.sweepY, s.sweep ? s.sweep.y : 0); gl.uniform1f(u.sweepW, s.sweep ? s.sweep.w : 0.1);
    gl.uniform1f(u.ghostFrac, s.sweep ? s.sweep.ghost : 0); gl.uniform1f(u.ghostA, s.sweep ? (s.sweep.ghostA ?? 0.2) : 0);
    gl.uniform1f(u.rampOn, (s.sweep && s.sweep.ramp) ? 1 : 0); gl.uniform1f(u.rampLen, (s.sweep && s.sweep.rampLen) || 20); gl.uniform1f(u.falloff, s.falloff || 9); gl.uniform1f(u.rampGain, (s.sweep && s.sweep.rampGain) || 1);
    gl.uniform1f(u.glowA, (s.sweep && s.sweep.glow) ?? 0.15); gl.uniform1f(u.sweepDir, (s.sweep && s.sweep.dir) || 1); gl.uniform4fv(u.push, s.push ? [...s.push.c, s.push.r] : [0, 0, 0, 0]); gl.uniform1f(u.pushK, s.push ? s.push.k : 0); gl.uniform3fv(u.pushCol, (s.push && s.push.col) || [0.4, 1, 1]);
    gl.uniform1f(u.movingA, (s.dissolve && s.dissolve.alpha) ?? 0.4); gl.uniform1f(u.nearA, (s.near || [0, 0])[0]); gl.uniform1f(u.nearB, (s.near || [0, 0.001])[1]); gl.uniform3fv(u.edgeCol, (s.sweep && s.sweep.col) || [0.25, 0.85, 1.0]); gl.uniform3fv(u.ghostCol, (s.sweep && s.sweep.ghostCol) || [0.05, 0.22, 0.35]);
    gl.uniform1f(u.focusD, s.dof ? s.dof.focus : 10); gl.uniform1f(u.aperture, s.dof ? s.dof.aperture : 0); gl.uniform1f(u.minSize, (s.minSize || 1.3) * (target.h / 1080));
    gl.uniform1f(u.gain, s.gain || 1);
    const d = s.dissolve || { amt: 0 };
    gl.uniform1f(u.dAmt, d.amt || 0); gl.uniform1f(u.dFront, d.front || 0); gl.uniform1f(u.dSpan, d.span || 1); gl.uniform1f(u.dLift, d.lift || 0); gl.uniform1f(u.dSwirl, d.swirl || 0);
    gl.uniform3fv(u.dAxis, d.axis || [0, 1, 0]); gl.uniform3fv(u.dCol, d.col || [1.6, 0.9, 0.5]); gl.uniform1f(u.dFrac, d.frac ?? 1); gl.uniform1f(u.T, s.T || 0);
    gl.uniform4fv(u.clipBox, s.clip ? [s.clip, 0, 0, 1] : [0, 0, 0, 0]);
    gl.bindVertexArray(mesh.vao);
    const CH = 400000;
    const pass = async (mode, trail) => {
      gl.uniform1f(u.mode, mode); gl.uniform1f(u.trail, trail);
      for (let i = 0; i < mesh.count; i += CH) { gl.drawArrays(gl.POINTS, i, Math.min(CH, mesh.count - i)); gl.finish(); await G.GLK.tick(); }
    };
    gl.uniform1f(u.sizeK, s.sizeK || 1.0);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS); gl.depthMask(true); gl.disable(gl.BLEND);
    await pass(0, 1);
    gl.depthMask(false); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    await pass(1, 1);
    if (d.amt && d.trails) for (let k = 1; k <= d.trails; k++) await pass(2, 1 - k * (d.trailStep || 0.06));
    gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST); gl.depthMask(true); gl.bindVertexArray(null);
    return cam;
  }

  G.PC = { staircase, bonsai, sheet, Cloud, mulberry, camera, makeProgram, upload, draw };
})(window);
