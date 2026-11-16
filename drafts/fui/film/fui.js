// FUI 小样渲染器（Canvas 2D）
const W = 1920, H = 1080, BEAT = 30, END = 300;
const cv = document.getElementById('c'), out = cv.getContext('2d');
const A = document.createElement('canvas'); A.width = W; A.height = H; const x = A.getContext('2d');
const SMALL = document.createElement('canvas'); SMALL.width = W / 4; SMALL.height = H / 4; const sx = SMALL.getContext('2d');
const Q = new URLSearchParams(location.search);
const MB = Q.has('mb') ? +Q.get('mb') : 5;

// ---------- 工具 ----------
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (f, a, b) => clamp((f - a) / (b - a));
const ss = t => (t = clamp(t), t * t * t * (t * (6 * t - 15) + 10));        // smootherstep：速度两端为 0
const eio = t => (t = clamp(t), t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const eout = t => 1 - Math.pow(1 - clamp(t), 3);
// 弹簧：0 → 1，过冲约 5%（ζ = .62）
const spring = (t, z = .62, w = 15) => { if (t <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + z * w / wd * Math.sin(wd * t)); };
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const C = { cy: '#62E6FF', cyA: a => `rgba(98,230,255,${a})`, wh: a => `rgba(232,251,255,${a})`, or: '#FF6A2B', orA: a => `rgba(255,106,43,${a})` };

// ---------- 启动序列：线 → 面 → 字 ----------
// boot(f, t0)：返回 {line, face, text} 三段进度，每段 10 帧，错开 6 帧
const boot = (f, t0, k = 1) => ({ line: ss(prog(f, t0, t0 + 10 * k)), face: ss(prog(f, t0 + 6 * k, t0 + 16 * k)), text: prog(f, t0 + 12 * k, t0 + 26 * k) });
// 解码：字符从乱码一位位落定
const GLYPH = '0123456789ABCDEF#%/<>[]+=_';
function decode(s, p, seed = 0, f = 0) {
  const n = s.length, k = Math.floor(p * (n + 4));
  let r = '';
  for (let i = 0; i < n; i++) {
    if (s[i] === ' ') { r += ' '; continue; }
    if (i < k - 4) r += s[i];
    else if (i < k) r += /[一-鿿]/.test(s[i]) ? s[i] : GLYPH[Math.floor(hash(i * 13 + seed + Math.floor(f / 2) * 7) * GLYPH.length)];
    else r += '';
  }
  return r;
}
const EV = { cues: [] };   // 出字 / 动作时刻（给配乐）
const cue = (t, kind, extra = {}) => EV.cues.push({ t, kind, ...extra });

// ---------- 地球 ----------
const G = { cx: 1210, cy: 560, R: 290, tilt: -0.36 };
const rotY = f => -0.5 + f / 60 * 0.11;           // 每秒约 6.3°
function sph(lat, lon, f) {
  const la = lat * Math.PI / 180, lo = lon * Math.PI / 180 + rotY(f);
  let X = Math.cos(la) * Math.sin(lo), Y = Math.sin(la), Z = Math.cos(la) * Math.cos(lo);
  const c = Math.cos(G.tilt), s = Math.sin(G.tilt);
  const Y2 = Y * c - Z * s, Z2 = Y * s + Z * c;
  return [G.cx + X * G.R, G.cy - Y2 * G.R, Z2];
}
// 假大陆：球面上的低频噪声取阈值
const LAND = [];
for (let i = 0; i < 30000 && LAND.length < 6000; i++) {
  const u = hash(i * 3.1), v = hash(i * 7.7 + 1);
  const lat = Math.asin(2 * u - 1) * 180 / Math.PI, lon = v * 360 - 180;
  const la = lat * Math.PI / 180, lo = lon * Math.PI / 180;
  const X = Math.cos(la) * Math.cos(lo), Y = Math.sin(la), Z = Math.cos(la) * Math.sin(lo);
  const n = Math.sin(X * 4.1 + 1.3) * Math.cos(Z * 3.7 - .4) + Math.sin(Y * 5.2 + X * 2.9) * .8 + Math.sin(Z * 7.3 + Y * 6.1 + X * 2.2) * .5 + Math.sin(X * 11 - Z * 9) * .18;
  if (n > .62 && Math.abs(lat) < 72) LAND.push([lat, lon]);
}
const TGT = { lat: 31, lon: 36 };

function drawGlobe(f) {
  // 经纬线：前半球亮、后半球暗
  const seg = (pts) => { for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], z = (a[2] + b[2]) / 2; x.strokeStyle = z > 0 ? C.cyA(.22 + .3 * z) : C.cyA(.05); x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); } };
  x.lineWidth = 1;
  for (let lat = -75; lat <= 75; lat += 15) { const p = []; for (let lo = -180; lo <= 180; lo += 5) p.push(sph(lat, lo, f)); seg(p); }
  for (let lo = -180; lo < 180; lo += 15) { const p = []; for (let la = -90; la <= 90; la += 5) p.push(sph(la, lo, f)); seg(p); }
  // 大陆点
  for (const [la, lo] of LAND) { const [px, py, z] = sph(la, lo, f); if (z < -.05) continue; x.fillStyle = C.wh(.1 + .6 * z); const d = .8 + 1.2 * z; x.fillRect(px - d / 2, py - d / 2, d, d); }
  // 航线：从目标点出发的大圆弧，抬离地面，虚线在流
  const ARCS = [[31, 36, 52, -2], [31, 36, 8, 78], [31, 36, -18, 20], [31, 36, 58, 104], [31, 36, 14, -18]];
  ARCS.forEach(([a1, o1, a2, o2], k) => {
    const grow = ss(prog(f, LOCK + 8 + k * 4, LOCK + 30 + k * 4)); if (grow <= 0) return;
    const pts = []; for (let i = 0; i <= 40 * grow; i++) { const u = i / 40, lift = 1 + Math.sin(u * Math.PI) * .16;
      const [px, py, z] = sph(lerp(a1, a2, u), lerp(o1, o2, u), f); pts.push([G.cx + (px - G.cx) * lift, G.cy + (py - G.cy) * lift, z]); }
    x.setLineDash([6, 6]); x.lineDashOffset = -f * 1.2; x.lineWidth = 1.4;
    for (let i = 1; i < pts.length; i++) { const z = pts[i][2]; x.strokeStyle = z > -.1 ? C.orA(.8) : C.orA(.15); x.beginPath(); x.moveTo(pts[i - 1][0], pts[i - 1][1]); x.lineTo(pts[i][0], pts[i][1]); x.stroke(); }
    x.setLineDash([]); const e = pts[pts.length - 1]; if (e[2] > 0) { x.fillStyle = C.or; x.fillRect(e[0] - 2.5, e[1] - 2.5, 5, 5); }
  });
  // 轮廓 + 大气光
  const g = x.createRadialGradient(G.cx, G.cy, G.R * .9, G.cx, G.cy, G.R * 1.18);
  g.addColorStop(0, C.cyA(0)); g.addColorStop(.45, C.cyA(.16)); g.addColorStop(1, C.cyA(0));
  x.fillStyle = g; x.beginPath(); x.arc(G.cx, G.cy, G.R * 1.18, 0, 7); x.fill();
  x.strokeStyle = C.cyA(.75); x.lineWidth = 1.5; x.beginPath(); x.arc(G.cx, G.cy, G.R, 0, 7); x.stroke();
  // 扫描线：横切地球的一条亮带，上下往返
  const sy = G.cy + Math.sin(f / 60 * 1.4) * G.R * .92, hw = Math.sqrt(Math.max(0, G.R * G.R - (sy - G.cy) ** 2));
  const sg = x.createLinearGradient(0, sy - 30, 0, sy + 2); sg.addColorStop(0, C.cyA(0)); sg.addColorStop(1, C.cyA(.25));
  x.fillStyle = sg; x.fillRect(G.cx - hw, sy - 30, hw * 2, 32);
  x.strokeStyle = C.wh(.8); x.lineWidth = 1.2; x.beginPath(); x.moveTo(G.cx - hw, sy); x.lineTo(G.cx + hw, sy); x.stroke();
}

// 环：不同半径、不同速度、不同画法
function drawRings(f, k = 1) {
  const t = f / 60;
  x.save(); x.translate(G.cx, G.cy);
  // 刻度环
  x.save(); x.rotate(t * .12); const r1 = G.R + 46 * k;
  for (let i = 0; i < 180; i++) { const a = i / 180 * Math.PI * 2, L = i % 15 === 0 ? 14 : i % 5 === 0 ? 8 : 4; x.strokeStyle = C.cyA(i % 15 === 0 ? .8 : .35); x.lineWidth = 1; x.beginPath(); x.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); x.lineTo(Math.cos(a) * (r1 + L), Math.sin(a) * (r1 + L)); x.stroke(); }
  x.restore();
  // 分段弧（反向、快）
  x.save(); x.rotate(-t * .45); const r2 = G.R + 80 * k; x.lineWidth = 3;
  [[0, .9], [1.3, 2.1], [2.6, 4.4], [4.9, 5.5]].forEach(([a, b], i) => { x.strokeStyle = i === 2 ? C.cyA(.85) : C.cyA(.4); x.beginPath(); x.arc(0, 0, r2, a, b); x.stroke(); });
  x.restore();
  // 虚线环（慢）
  x.save(); x.rotate(t * .06); x.setLineDash([2, 9]); x.strokeStyle = C.cyA(.45); x.lineWidth = 1.2; x.beginPath(); x.arc(0, 0, G.R + 108 * k, 0, 7); x.stroke(); x.setLineDash([]); x.restore();
  // 雷达扫过的扇形
  const a0 = t * 1.6; const sg = x.createConicGradient(a0, 0, 0); sg.addColorStop(0, C.cyA(.0)); sg.addColorStop(.92, C.cyA(0)); sg.addColorStop(1, C.cyA(.22));
  x.fillStyle = sg; x.beginPath(); x.arc(0, 0, G.R + 46 * k, 0, 7); x.arc(0, 0, G.R + 2, 0, 7, true); x.fill();
  // 外圈的读数
  x.font = '13px GM'; x.fillStyle = C.cyA(.7); x.textAlign = 'center';
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + t * .12, r = G.R + 136 * k; x.save(); x.translate(Math.cos(a) * r, Math.sin(a) * r); x.rotate(a + Math.PI / 2); x.fillText(String(i * 30).padStart(3, '0'), 0, 0); x.restore(); }
  x.restore();
}

// ---------- 地形（下一层）：透视线框 + 扫描面 ----------
const hgt = (u, v) => Math.sin(u * .9) * Math.cos(v * .7) * 1.3 + Math.sin(u * .33 + v * .51) * 2.2 + Math.sin(u * 2.1 - v * 1.7) * .35;
const TC = document.createElement('canvas'); TC.width = W; TC.height = H; const tx = TC.getContext('2d');
function terrain(f) {
  const ctx = tx, w = W, h = H, t = f / 60, cz = t * 2.4, DZ = .4;       // 镜头往前飞，行距 0.4
  ctx.fillStyle = '#02060A'; ctx.fillRect(0, 0, w, h);
  const horizon = h * .40, fl = w * .62, camH = 4.6;
  const P = (gx, gz) => { const z = gz - cz; if (z < 1.4) return null; const y = camH - hgt(gx, gz) * .8; return [w / 2 + gx * fl / z, horizon + y * fl / z * .62, z]; };
  // 天边的光
  const sk = ctx.createLinearGradient(0, horizon - 220, 0, horizon + 60); sk.addColorStop(0, 'rgba(98,230,255,0)'); sk.addColorStop(1, 'rgba(98,230,255,.10)');
  ctx.fillStyle = sk; ctx.fillRect(0, horizon - 220, w, 280);
  const ph = (t * 6 / 26) % 1, scanZ = cz + 3 + ph * 26, scanAmp = Math.sin(Math.PI * ph);   // 扫描面往远处推；回到近处时亮度为 0，循环处不跳
  const z0 = Math.floor((cz + 1.4) / DZ + 1) * DZ;
  for (let gz = z0 + 40; gz >= z0; gz -= DZ) {      // 从远到近：先遮挡、再描线
    const zz = gz - cz, pts = [];
    for (let gx = -30; gx <= 30; gx += .4) { const p = P(gx, gz); if (p) pts.push(p); }
    if (pts.length < 2) continue;
    ctx.beginPath(); ctx.moveTo(pts[0][0], h + 10); pts.forEach(p => ctx.lineTo(p[0], p[1])); ctx.lineTo(pts[pts.length - 1][0], h + 10); ctx.closePath();
    ctx.fillStyle = '#02060A'; ctx.fill();
    const d = Math.abs(gz - scanZ), hot = Math.max(0, 1 - d / 1.5) * scanAmp;
    const fade = clamp(1.2 - zz / 22) * clamp((zz - 1.4) / 2.5);
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.strokeStyle = hot > 0 ? `rgba(${Math.round(lerp(98, 240, hot))},${Math.round(lerp(230, 252, hot))},255,${Math.max(fade * .6, hot)})` : C.cyA(fade * .6);
    ctx.lineWidth = 1 + hot * 1.4 + clamp(1 - zz / 8) * .6; ctx.stroke();
    // 顶点上的小点（每隔几列）
    if (Math.round(gz / DZ) % 4 === 0) { ctx.fillStyle = C.wh(fade * .5); for (let i = 0; i < pts.length; i += 10) ctx.fillRect(pts[i][0] - 1, pts[i][1] - 1, 2, 2); }
  }
  // 远处的雾
  const g = ctx.createLinearGradient(0, horizon - 60, 0, horizon + 170); g.addColorStop(0, 'rgba(2,6,10,0)'); g.addColorStop(.3, 'rgba(2,6,10,.8)'); g.addColorStop(1, 'rgba(2,6,10,0)');
  ctx.fillStyle = g; ctx.fillRect(0, horizon - 60, w, 230);
  return { P, cz, scanZ };
}

// ---------- 文字面板 ----------
function panel(ctx, f, t0, X, Y, w, h, title, rows, opt = {}) {
  const b = boot(f, t0);
  if (b.line <= 0) return;
  const col = opt.alert ? C.orA : C.cyA;
  // 线：从左上角往右、往下画出来
  ctx.strokeStyle = col(.9); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X + w * b.line, Y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X, Y + h * b.line); ctx.stroke();
  // 面：从上往下长出来
  if (b.face > 0) {
    ctx.fillStyle = col(.08); ctx.fillRect(X, Y, w, h * b.face);
    ctx.strokeStyle = col(.35); ctx.strokeRect(X + .5, Y + .5, w, h * b.face);
    ctx.fillStyle = col(.9); ctx.fillRect(X, Y, 6, 6); ctx.fillRect(X + w - 6, Y + h * b.face - 6, 6, 6);
  }
  // 字
  if (b.text > 0) {
    ctx.textAlign = 'left'; ctx.fillStyle = col(1); ctx.font = '17px GM';
    ctx.fillText(decode(title, b.text, t0, f), X + 14, Y + 24);
    rows.forEach((r, i) => {
      const p = clamp(b.text * 1.4 - i * .12);
      ctx.fillStyle = C.wh(.6); ctx.font = '16px GM'; ctx.fillText(decode(r[0], p, t0 + i, f), X + 14, Y + 58 + i * 28);
      ctx.fillStyle = opt.alert ? C.or : C.cy; ctx.textAlign = 'right'; ctx.font = '19px GM';
      ctx.fillText(decode(typeof r[1] === 'function' ? r[1](f) : r[1], p, t0 + i + 9, f), X + w - 14, Y + 58 + i * 28); ctx.textAlign = 'left';
    });
  }
}
const roll = (base, amp, sp, d = 2) => f => (base + amp * Math.sin(f / 60 * sp) + amp * .3 * Math.sin(f / 60 * sp * 3.7)).toFixed(d);

// ---------- 锁定框 ----------
const LOCK = 30, DIVE0 = 90, DIVE1 = 180, BOX0 = 124;
function bracket(ctx, cx, cy, s, col, lw = 2, len = .28) {
  const L = s * len; ctx.strokeStyle = col; ctx.lineWidth = lw;
  for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const px = cx + dx * s / 2, py = cy + dy * s / 2;
    ctx.beginPath(); ctx.moveTo(px - dx * L, py); ctx.lineTo(px, py); ctx.lineTo(px, py - dy * L); ctx.stroke();
  }
}

// ---------- 一帧 ----------
function scene(f) {
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.fillStyle = '#02060A'; x.fillRect(0, 0, W, H);
  const tp = sph(TGT.lat, TGT.lon, f);
  // 钻进去：s 按等比走（ln s 线性于缓动）
  const dv = eio(prog(f, DIVE0, DIVE1)), smax = W / BOX0;
  const s = Math.exp(Math.log(smax) * dv);
  const cx = lerp(tp[0], W / 2, dv), cy = lerp(tp[1], H / 2, dv);
  // ===== 第一层：地球 =====
  if (dv < 1) {
    x.save(); x.translate(cx, cy); x.scale(s, s); x.translate(-tp[0], -tp[1]);
    // 背景点阵
    x.fillStyle = C.cyA(.10);
    for (let gx = 0; gx <= W; gx += 40) for (let gy = 0; gy <= H; gy += 40) x.fillRect(gx - 1, gy - 1, 2, 2);
    drawGlobe(f);
    x.restore();
    // 环在更近的一层：放大得更快（视差）
    x.save(); const sr = Math.pow(s, 1.25); x.translate(cx, cy); x.scale(sr, sr); x.translate(-tp[0], -tp[1]); drawRings(f); x.restore();
  }
  // ===== 锁定框 + 框里的下一层 =====
  const lk = f - LOCK;
  let bs, bx, by, col;
  if (lk < 0) {                         // 搜索：大框在转、在缩
    const p = prog(f, -8, LOCK);
    bs = lerp(420, 190, eout(p)); bx = tp[0] + Math.sin(f * .21) * 14 * (1 - p); by = tp[1] + Math.cos(f * .17) * 10 * (1 - p); col = C.cyA(.85);
  } else {                              // 锁定：弹簧咔住（过冲约 5%）
    const sp = spring(lk / 60, .5, 22);
    bs = lerp(190, BOX0, sp); bx = tp[0]; by = tp[1]; col = C.or;
  }
  // 钻进去时框跟着放大到全屏
  const boxS = bs * s, boxX = cx + (bx - tp[0]) * s, boxY = cy + (by - tp[1]) * s;
  if (lk >= 0) {
    // 框里：下一层的取景画面（地形），钻进去时它就是整块屏幕
    const reveal = ss(prog(f, LOCK + 4, LOCK + 18));
    if (reveal > 0) {
      const tr = terrain(f), m = boxS / lerp(440, W, dv);   // 锁定时框里是地形中心 440px 的取景，钻到底时 m = 1、地形正好铺满屏幕
      x.save(); x.beginPath(); x.rect(boxX - boxS / 2, boxY - boxS / 2 * reveal, boxS, boxS * reveal); x.clip();
      x.drawImage(TC, boxX - W / 2 * m, boxY - H / 2 * m, W * m, H * m);
      x.restore();
      if (f >= DIVE1 - 1) { layerB(f, tr); instruments(f); }
    }
    // 锁定闪光：一圈往外扩
    const fl = prog(f, LOCK, LOCK + 24);
    if (fl > 0 && fl < 1) { x.strokeStyle = C.orA(1 - fl); x.lineWidth = 2; x.beginPath(); x.arc(boxX, boxY, BOX0 * (.6 + fl * 1.8), 0, 7); x.stroke(); }
  }
  const lw = lerp(2, 3, dv);
  const corner = lerp(boxS, Math.max(W, H), 0);
  if (dv < 1) bracket(x, boxX, boxY, boxS, col, lw);
  else { // 框变成屏幕的四个角
    x.strokeStyle = C.or; x.lineWidth = 3; const m = 28, L = 70;
    for (const [px, py, dx, dy] of [[m, m, 1, 1], [W - m, m, -1, 1], [W - m, H - m, -1, -1], [m, H - m, 1, -1]]) { x.beginPath(); x.moveTo(px + dx * L, py); x.lineTo(px, py); x.lineTo(px, py + dy * L); x.stroke(); }
  }
  // 十字准星 + 锁定标签
  if (dv < .5) {
    const a = 1 - dv * 2;
    x.strokeStyle = lk >= 0 ? C.orA(a) : C.cyA(.8 * a); x.lineWidth = 1;
    x.beginPath(); x.moveTo(boxX - 8, boxY); x.lineTo(boxX + 8, boxY); x.moveTo(boxX, boxY - 8); x.lineTo(boxX, boxY + 8); x.stroke();
    if (lk >= 0) {
      const p = prog(f, LOCK + 2, LOCK + 20);
      x.font = '14px GM'; x.fillStyle = C.orA(a); x.textAlign = 'left';
      x.fillText(decode('LOCK 01', p, 5, f), boxX + boxS / 2 + 10, boxY - boxS / 2 + 12);
      x.fillStyle = C.wh(.7 * a); x.font = '12px GM';
      x.fillText(decode('31.0N  36.0E', p, 6, f), boxX + boxS / 2 + 10, boxY - boxS / 2 + 30);
    } else {
      x.font = '13px GM'; x.fillStyle = C.cyA(.85); x.textAlign = 'left';
      x.fillText(decode('SEARCHING', prog(f, -10, 10), 4, f) + (Math.floor(f / 8) % 2 ? '_' : ''), boxX + bs / 2 + 10, boxY - bs / 2 + 12);
    }
  }
  // ===== 第一层的信息（跟地球一起被甩出去）=====
  if (dv < 1) {
    x.save(); const sp2 = Math.pow(s, 1.4); x.translate(cx, cy); x.scale(sp2, sp2); x.translate(-tp[0], -tp[1]);
    x.globalAlpha = 1 - ss(prog(dv, .2, .7));
    // 引线：目标 → 右上的面板
    const lp = ss(prog(f, LOCK + 6, LOCK + 18));
    if (lp > 0) { const ax = tp[0] + 70, ay = tp[1] - 70, ex = 1500, ey = 240; x.strokeStyle = C.orA(.9); x.lineWidth = 1.2; x.beginPath(); x.moveTo(ax, ay); const mx = lerp(ax, ex, lp), my = lerp(ay, ey, Math.min(1, lp * 1.5)); x.lineTo(mx, my); x.stroke(); }
    panel(x, f, LOCK + 14, 1500, 170, 360, 146, 'TARGET 01 · 目标', [['DIST km', roll(4210.6, 3, 2.1, 1)], ['VEL m/s', roll(311.42, 1.6, 3.3)], ['CONF', f => (Math.min(99.7, 61 + (f - LOCK - 14) * 1.1)).toFixed(1) + '%']], { alert: true });
    x.restore();
  }
  // ===== 第二层的信息 =====
  return { s, dv };
}

// 第二层的仪表：航向带（上）、准星 + 俯仰梯（中）、高度带（右）；同样 线 → 面 → 字
function instruments(f) {
  const t = f / 60, hd = 36 + Math.sin(t * .7) * 6 + t * 2.5;      // 航向慢慢漂
  let b = boot(f, DIVE1 + 2);
  if (b.line > 0) {
    const cx = W / 2, y = 150, half = 420 * b.line;
    x.strokeStyle = C.cyA(.8); x.lineWidth = 1.2; x.beginPath(); x.moveTo(cx - half, y); x.lineTo(cx + half, y); x.stroke();
    if (b.face > 0) {
      x.save(); x.beginPath(); x.rect(cx - 420, y - 40, 840, 60); x.clip();
      for (let d = Math.floor(hd - 45); d <= hd + 45; d++) {
        const px = cx + (d - hd) * 9.3, a = b.face * clamp(1 - Math.abs(d - hd) / 46);
        const L = d % 10 === 0 ? 18 : d % 5 === 0 ? 10 : 5;
        x.fillStyle = C.cyA(.8 * a); x.fillRect(px, y - L, 1.4, L);
        if (d % 10 === 0 && b.text > 0) { x.font = '16px GM'; x.textAlign = 'center'; x.fillStyle = C.wh(.85 * a * b.text); x.fillText(String((d + 360) % 360).padStart(3, '0'), px, y - 26); }
      }
      x.restore();
      x.fillStyle = C.or; x.beginPath(); x.moveTo(W / 2, y + 4); x.lineTo(W / 2 - 8, y + 16); x.lineTo(W / 2 + 8, y + 16); x.fill();
      if (b.text > 0) { x.font = '20px GM'; x.textAlign = 'center'; x.fillStyle = C.or; x.fillText(decode('HDG ' + hd.toFixed(1).padStart(5, '0'), b.text, 41, f), W / 2, y + 44); }
    }
  }
  b = boot(f, DIVE1 + 10);
  if (b.line > 0) {
    const cx = W / 2, cy = H * .5, roll = Math.sin(t * .9) * .06, pitch = Math.sin(t * .6) * 18;
    x.save(); x.translate(cx, cy);
    x.strokeStyle = C.wh(.95); x.lineWidth = 2; const r = 26;
    x.beginPath(); x.arc(0, 0, r * b.line, 0, 7); x.moveTo(-r - 50 * b.line, 0); x.lineTo(-r, 0); x.moveTo(r, 0); x.lineTo(r + 50 * b.line, 0); x.stroke();
    if (b.face > 0) {
      x.rotate(roll);
      for (let k = -2; k <= 2; k++) { if (!k) continue; const y = k * 70 + pitch, wv = 120 * b.face;
        x.strokeStyle = C.cyA(.7); x.lineWidth = 1.2; x.setLineDash(k > 0 ? [8, 6] : []);
        x.beginPath(); x.moveTo(-wv - 60, y); x.lineTo(-60, y); x.moveTo(60, y); x.lineTo(wv + 60, y); x.stroke(); x.setLineDash([]);
        if (b.text > 0) { x.font = '15px GM'; x.fillStyle = C.cyA(.9 * b.text); x.textAlign = 'right'; x.fillText(String(-k * 10), -wv - 70, y + 5); x.textAlign = 'left'; x.fillText(String(-k * 10), wv + 70, y + 5); }
      }
    }
    x.restore();
  }
  b = boot(f, DIVE1 + 18);
  if (b.line > 0) {
    const X = W - 230, cy = H * .5, alt = 412 + Math.sin(t * .8) * 40 + t * 12;
    x.strokeStyle = C.cyA(.8); x.lineWidth = 1.2; x.beginPath(); x.moveTo(X, cy - 260 * b.line); x.lineTo(X, cy + 260 * b.line); x.stroke();
    if (b.face > 0) {
      x.save(); x.beginPath(); x.rect(X - 4, cy - 260, 120, 520); x.clip();
      for (let a = Math.floor(alt / 10) * 10 - 300; a <= alt + 300; a += 10) { const py = cy - (a - alt) * .86, L = a % 50 === 0 ? 18 : 8, o = b.face * clamp(1 - Math.abs(py - cy) / 260);
        x.fillStyle = C.cyA(.8 * o); x.fillRect(X, py, L, 1.4);
        if (a % 50 === 0 && b.text > 0) { x.font = '15px GM'; x.textAlign = 'left'; x.fillStyle = C.wh(.8 * o * b.text); x.fillText(String(a), X + 26, py + 5); } }
      x.restore();
      x.fillStyle = 'rgba(2,6,10,.85)'; x.fillRect(X + 20, H * .5 - 18, 110, 36);
      x.strokeStyle = C.or; x.lineWidth = 1.5; x.strokeRect(X + 20, H * .5 - 18, 110, 36);
      if (b.text > 0) { x.font = '20px GM'; x.textAlign = 'left'; x.fillStyle = C.or; x.fillText(decode(alt.toFixed(1), b.text, 51, f), X + 30, H * .5 + 7); x.font = '14px GM'; x.fillStyle = C.wh(.7); x.fillText(decode('ALT m', b.text, 52, f), X - 6, H * .5 - 276); }
    }
  }
}

// 第二层：地形上的标注一个个启动
let TR = null;
function layerB(f, tr) {
  const pts = [[-7, 9, 'A-01', 212], [6, 12, 'A-02', 222], [-1, 19, 'A-03', 232]];
  for (const [gx, gz, id, t0] of pts) {
    const p = tr.P(gx, gz); if (!p) continue;
    const b = boot(f, t0);
    if (b.line <= 0) continue;
    const top = p[1] - 150 * b.line;
    x.strokeStyle = C.cyA(.9); x.lineWidth = 1.2; x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(p[0], top); x.stroke();
    x.fillStyle = C.cy; x.beginPath(); x.arc(p[0], p[1], 4, 0, 7); x.fill();
    if (b.face > 0) { x.fillStyle = C.cyA(.1); x.fillRect(p[0], top - 52 * b.face, 190, 52 * b.face); x.strokeStyle = C.cyA(.5); x.strokeRect(p[0] + .5, top - 52 * b.face + .5, 190, 52 * b.face); }
    if (b.text > 0) {
      x.textAlign = 'left'; x.fillStyle = C.cy; x.font = '15px GM'; x.fillText(decode(id + ' · 高程', b.text, t0, f), p[0] + 12, top - 30);
      x.fillStyle = C.wh(.8); x.font = '13px GM'; x.fillText(decode((412 + hgt(gx, gz) * 120).toFixed(1) + ' m', b.text, t0 + 3, f), p[0] + 12, top - 11);
    }
  }
}

// HUD 外框（屏幕空间，不跟镜头走）
function hud(f) {
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.textAlign = 'left'; x.font = '20px GM'; x.fillStyle = C.wh(.9);
  x.fillText('风格 · FUI', 64, 70);
  const fi = Math.floor(f); x.textAlign = 'right'; x.fillText('T+' + String(Math.floor(fi / 60)).padStart(2, '0') + ':' + String(fi % 60).padStart(2, '0') + ':' + String(Math.floor(hash(fi) * 99)).padStart(2, '0'), W - 64, 70);
  x.fillStyle = C.wh(.15); x.fillRect(W - 284, 86, 220, 3); x.fillStyle = C.or; x.fillRect(W - 284, 86, 220 * (0.03 + f / 18 / 60 * .97 / 1), 3);
  // 左右两边的刻度尺（跟着时间慢慢滚）
  for (const sxp of [24, W - 24]) for (let i = -2; i < 60; i++) { const y = 140 + ((i * 14 - f * .8) % 840 + 840) % 840; const L = (i % 5 === 0) ? 14 : 6; x.fillStyle = C.cyA(i % 5 === 0 ? .5 : .25); x.fillRect(sxp === 24 ? sxp : sxp - L, y, L, 1); }
  // 标题：左侧，先线后字
  const dv = eio(prog(f, DIVE0, DIVE1));
  const ta = 1 - ss(prog(f, DIVE0, DIVE0 + 40));
  if (ta > 0) {
    x.globalAlpha = ta; x.textAlign = 'left';
    x.fillStyle = C.cyA(.8); x.font = '14px GM'; x.fillText('FICTIONAL USER INTERFACE · 1999 —', 64, 300);
    x.strokeStyle = C.cyA(.6); x.lineWidth = 1; x.beginPath(); x.moveTo(64, 318); x.lineTo(64 + 520, 318); x.stroke();
    x.fillStyle = C.wh(1); x.font = '128px Mic'; x.fillText('FUI', 58, 466);
    x.font = '64px NSB'; x.fillStyle = C.wh(.95); x.fillText('电影界面', 64, 560);
    x.fillStyle = C.wh(.55); x.font = '22px NS'; x.fillText('不是给人用的界面，是给观众“看懂”的界面', 64, 612);
    // 左下：滚动的数据列 + 示波器
    x.font = '13px GM';
    for (let i = 0; i < 6; i++) { const v = hash(i * 9 + Math.floor((f + i * 7) / 6)); x.fillStyle = C.cyA(.45); x.fillText('CH-' + (i + 1) + '  ' + (v * 1000).toFixed(2).padStart(7, '0'), 64, 720 + i * 22); x.fillStyle = C.cyA(.75); x.fillRect(270, 711 + i * 22, 140 * (.2 + .8 * hash(i + Math.floor((f + i * 5) / 4) * 3.3)), 6); }
    x.strokeStyle = C.cyA(.8); x.lineWidth = 1.2; x.beginPath();
    for (let i = 0; i <= 340; i += 2) { const u = i + f * 4; const y = 900 + Math.sin(u * .05) * 14 * Math.sin(u * .011) + Math.sin(u * .23) * 4; i ? x.lineTo(64 + i, y) : x.moveTo(64, y); }
    x.stroke(); x.fillStyle = C.cyA(.4); x.fillText('SIGNAL · 48 kHz', 64, 950);
    x.globalAlpha = 1;
  }
  // 第二层的规则字
  if (f >= 246) {
    const b = boot(f, 246);
    const X = 64, Y = 860;
    x.strokeStyle = C.orA(.9); x.lineWidth = 1.2; x.beginPath(); x.moveTo(X, Y); x.lineTo(X + 660 * b.line, Y); x.stroke();
    if (b.text > 0) {
      x.textAlign = 'left'; x.fillStyle = C.or; x.font = '15px GM'; x.fillText(decode('RULE 01 · BOOT ORDER', b.text, 77, f), X, Y - 14);
      x.fillStyle = C.wh(1); x.font = '44px NSB'; x.fillText(decode('先画线，再长面，最后出字', clamp(b.text * 1.2), 78, f), X, Y + 62);
      x.fillStyle = C.wh(.6); x.font = '16px GM'; x.fillText(decode('line 10f → face 10f → text 14f · stagger 6f', clamp(b.text * 1.2 - .2), 79, f), X, Y + 100);
    }
  }
}

// 后期：泛光 + 扫描线 + 暗角 + 色差
function post() {
  sx.clearRect(0, 0, W / 4, H / 4); sx.filter = 'blur(6px)'; sx.drawImage(A, 0, 0, W / 4, H / 4); sx.filter = 'none';
  out.globalCompositeOperation = 'lighter'; out.globalAlpha = .55; out.drawImage(SMALL, 0, 0, W, H); out.globalAlpha = 1; out.globalCompositeOperation = 'source-over';
  out.fillStyle = 'rgba(0,0,0,.10)'; for (let y = 0; y < H; y += 3) out.fillRect(0, y, W, 1);
  const g = out.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.05); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.6)');
  out.fillStyle = g; out.fillRect(0, 0, W, H);
}

function render(f) { scene(f); hud(f); }
window.frame = async f => {
  // 运动模糊：只在钻进去那一段（镜头最快）做多重采样，两端速度为 0，所以开关处看不出来
  const fast = f > DIVE0 && f < DIVE1;
  const n = fast ? MB : 1;
  out.globalCompositeOperation = 'source-over';
  if (n === 1) { render(f); out.drawImage(A, 0, 0); }
  else {
    out.fillStyle = '#000'; out.fillRect(0, 0, W, H);
    for (let k = 0; k < n; k++) { render(f - .5 + (k + .5) / n * .5 + .25 - .25); out.globalAlpha = 1 / (k + 1); out.drawImage(A, 0, 0); }
    out.globalAlpha = 1;
  }
  post();
};
// 动作时刻（给配乐）
window.events = () => {
  // 出字：[起始帧, 字数, 每字帧数, 种类]；动作：{t, kind}
  const text = [[-10, 9, 2, 'small'], [LOCK + 2, 7, 2, 'small'], [LOCK + 26, 14, 1.2, 'type'], [LOCK + 30, 24, 1.5, 'small'],
    [DIVE1 + 14, 8, 2, 'small'], [DIVE1 + 30, 10, 2, 'small'], [DIVE1 + 30, 8, 1.5, 'small'],
    [212 + 12, 10, 1.5, 'small'], [222 + 12, 10, 1.5, 'small'], [232 + 12, 10, 1.5, 'small'],
    [246 + 12, 20, 1.2, 'small'], [246 + 14, 1, 1, 'slam'], [246 + 18, 30, 1.2, 'small']];
  const acts = [{ t: LOCK, kind: 'lock' }, { t: LOCK + 6, kind: 'line' }, { t: LOCK + 14, kind: 'panel' }, { t: DIVE0, kind: 'dive0' }, { t: DIVE1, kind: 'dive1' },
    { t: DIVE1 + 2, kind: 'line' }, { t: DIVE1 + 10, kind: 'line' }, { t: DIVE1 + 18, kind: 'line' }, { t: 212, kind: 'panel' }, { t: 222, kind: 'panel' }, { t: 232, kind: 'panel' }, { t: 246, kind: 'line' }];
  return { end: END, beat: BEAT, lock: LOCK, dive0: DIVE0, dive1: DIVE1, text, acts };
};
Promise.all(['14px GM', '128px Mic', '64px NSB', '22px NS'].map(s => document.fonts.load(s))).then(() => { window.ready = true; });
