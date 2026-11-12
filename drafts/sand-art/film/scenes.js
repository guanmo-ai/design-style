// 沙画 · 全片的手法时间轴（帧，60fps，一拍 30 帧）。所有画面都是这一盘沙上的操作：push（手指 / 手掌推）、pour（倒沙）、morph（一抹 / 一撒）。
// 时间点和章节在 timeline.js；这里只写“手在哪、往哪走、用多大力”。
const W = 1920, H = 1080;
const { fbm, smooth, clamp, rng } = SANDFILM;
const HZ = 648, M = [1181, 356, 151];          // 地平线、月亮（圆心 + 半径）
const EYE = { l: [742, 384], r: [1620, 384], top: 150, bot: 566 }; // 眼睛：两个眼角、上下眼睑最高 / 最低点
const TEAR = [[1096, 572], [1100, 620], [1106, 700], [1112, 790]];
const RC = [1112, 800];                         // 涟漪中心 = 眼泪落点
const UI = { btn: [1112, 820], tog: [1480, 820] };

// —— 第 0 帧之前就画好的那一盘（和封面同一张画）——
function baseScene(F) {
  const R = rng(3);
  F.fill((x, y) => {
    const v = smooth(-0.1 * H, HZ, y); const arcs = 0.08 * Math.sin(Math.hypot(x - W * 0.4, y - H * 1.4) / 26 + fbm(x / 300, y / 300) * 6);
    if (y < HZ) return 1.15 - 0.95 * Math.pow(v, 1.6) + arcs + (fbm(x / 140, y / 140) - 0.5) * 0.3;
    return 1.05 - 0.55 * Math.exp(-(y - HZ) / (H * 0.05)) + (fbm(x / 90, y / 60) - 0.5) * 0.25;
  });
  const [mx, my, mr] = M;
  SANDFILM_morph(F, (x, y) => (Math.hypot(x - mx, y - my) < mr * 2.4 ? 1 : 0), (x, y, h) => { const d = Math.hypot(x - mx, y - my); const halo = 0.12 + 0.88 * smooth(mr * 0.95, mr * 2.4, d); return Math.min(h, h * halo + 0.1 * (1 - halo)); });
  SANDFILM_morph(F, (x, y) => 1 - smooth(mr - 3, mr + 2, Math.hypot(x - mx, y - my)), (x, y) => 0.02 + 0.16 * Math.max(0, fbm(x / 38, y / 38) - 0.45) + 0.05 * smooth(mr * 0.6, mr, Math.hypot(x - mx + mr * 0.3, y - my + mr * 0.2)));
  const ridge = (x) => HZ - (60 + 120 * Math.max(0, Math.sin(x / 210 + 0.6)) * Math.exp(-Math.pow((x - W * 0.17) / 420, 2)) + 90 * Math.exp(-Math.pow((x - W * 0.93) / 260, 2)) + 22 * fbm(x / 60, 1.7)) * (1 - 0.8 * smooth(W * 0.36, W * 0.47, x) * (1 - smooth(W * 0.74, W * 0.84, x)));
  SANDFILM_morph(F, (x, y) => smooth(ridge(x) - 1.5, ridge(x) + 1.5, y) * (y < HZ + 2 ? 1 : 0), () => 1.25);
  const fin = (pts, o) => SANDFILM_push(F, Object.assign({ pts }, o));
  const rp = []; for (let x = 0; x <= W * 0.47; x += 14) rp.push([x, ridge(x) + 6]); fin(rp, { r: 2.2, side: 0.5, keep: 0.25, front: 0 });
  const rp2 = []; for (let x = W * 0.76; x <= W; x += 14) rp2.push([x, ridge(x) + 6]); fin(rp2, { r: 2.2, side: 0.5, keep: 0.25, front: 0 });
  fin([[0, HZ], [W * 0.5, HZ + 1], [W, HZ]], { r: 2.6, keep: 0.1, side: 0.6, front: 0 });
  for (let i = 0; i < 46; i++) {
    const u = i / 45; const y = HZ + 8 + Math.pow(u, 1.5) * (H - HZ - 10); const half = 18 + u * 170 * (0.5 + R());
    const x0 = mx - half * (0.4 + 0.6 * R()) + (R() - .5) * 40 * u, x1 = mx + half * (0.4 + 0.6 * R()) + (R() - .5) * 40 * u;
    if (R() < 0.12 + u * 0.2) continue;
    fin([[x0, y], [(x0 + x1) / 2, y + (R() - .5) * 3], [x1, y]], { r: 2 + u * 4.5, taper: true, keep: 0.05, side: 0.55, front: 0.1 });
  }
  for (let k = 0; k < 22; k++) {
    const u = k / 21; const y0 = HZ + 14 + Math.pow(u, 1.7) * (H - HZ - 30); const A = 2 + u * 14; const f = 1 / (60 + u * 160);
    let x = -40 + R() * 100;
    while (x < W + 40) {
      const len = 80 + R() * (200 + u * 400); const pts = [];
      for (let xx = x; xx < x + len; xx += 12) pts.push([xx, y0 + A * Math.sin(xx * f + k * 1.7) + (R() - .5) * 2]);
      if (pts.length > 2 && Math.abs((x + len / 2) - mx) > 60 + u * 120 && Math.hypot(x + len / 2 - 1640, y0 - 900) > 260) fin(pts, { r: 1.2 + u * 2.4, taper: true, keep: 0.15, side: 0.7, front: 0.1 });
      x += len + 80 + R() * 260;
    }
  }
  const bx = mx - 120, by = HZ + 120, po = (pts, o) => SANDFILM_pour(F, Object.assign({ pts }, o));
  po([[bx - 70, by - 6], [bx - 30, by + 10], [bx + 30, by + 10], [bx + 74, by - 8]], { r: 9, amt: 1.4 });
  po([[bx - 60, by - 4], [bx + 64, by - 5]], { r: 6, amt: 1.4 });
  po([[bx + 6, by - 8], [bx + 4, by - 46]], { r: 6, amt: 1.5 }); po([[bx + 4, by - 56], [bx + 4, by - 54]], { r: 7.5, amt: 1.5 });
  po([[bx + 4, by - 40], [bx + 34, by - 64], [bx + 70, by - 70]], { r: 2.2, amt: 1.3 });
  po([[bx - 46, by - 6], [bx - 52, by - 70]], { r: 2.5, amt: 1.3 });
  po([[bx - 50, by - 66], [bx - 10, by - 20], [bx - 50, by - 14]], { r: 3, amt: 1.1 });
  for (const [x, y, s] of [[mx - mr * 0.55, my - mr * 0.15 - 150, 1], [mx + mr * 1.5, my - mr * 0.5, 0.55], [mx - mr * 1.3, my + mr * 0.6, 0.5], [mx - mr * 1.9, my - mr * 0.9, 0.6]]) { const w = 34 * s; po([[x - w, y - w * 0.25], [x - w * 0.45, y - w * 0.42], [x, y + w * 0.05], [x + w * 0.45, y - w * 0.42], [x + w, y - w * 0.25]], { r: 3.4 * s + 1, amt: 1.5, taper: true }); }
  // 左下角堆着还没用的沙（托住片名）
  SANDFILM_morph(F, (x, y) => 1 - smooth(640 * 0.55, 640, Math.hypot((x - 140) * 0.8, y - 1170) + (fbm(x / 40, y / 40) - 0.5) * 220), (x, y, h) => Math.max(h, 1.5));
}

// —— 手法 ——
const ops = [];
const fin = (f0, f1, pts, o = {}) => ops.push(Object.assign({ kind: 'push', f0, f1, pts }, o));
const palm = (f0, f1, pts, o = {}) => ops.push(Object.assign({ kind: 'push', f0, f1, pts, r: 120, keep: 0.35, side: 0.6, front: 0.55, soft: 0.5, stepK: 0.18, streak: 1, moundU: 0.5, moundV: 0.9, moundR: 1.6, curve: 1 }, o));
const pour = (f0, f1, pts, o = {}) => ops.push(Object.assign({ kind: 'pour', f0, f1, pts }, o));
const morph = (f0, f1, mask, target, o = {}) => ops.push(Object.assign({ kind: 'morph', f0, f1, mask, target }, o));
const circle = (c, rx, ry, a0, a1, n = 64) => { const p = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; p.push([c[0] + Math.cos(a) * rx, c[1] + Math.sin(a) * ry]); } return p; };
const bez = (a, b, c, n = 24) => { const p = []; for (let i = 0; i <= n; i++) { const t = i / n; p.push([(1 - t) * (1 - t) * a[0] + 2 * t * (1 - t) * b[0] + t * t * c[0], (1 - t) * (1 - t) * a[1] + 2 * t * (1 - t) * b[1] + t * t * c[1]]); } return p; };

// 00 · 浪头：第 0 帧时正画到一半（0.2 秒内就在动）
(() => {
  const cx = 1640, cy = 880, sc = 1.15;
  const spiral = (R0, dy, turns) => { const p = [[cx - R0 - 220 * sc, cy + (120 + dy) * sc], [cx - R0 - 120 * sc, cy + (60 + dy * 0.6) * sc], [cx - R0 - 40 * sc, cy + 20 * sc]]; for (let a = 0.1; a < Math.PI * turns; a += 0.12) { const r = R0 * Math.exp(-a * 0.3); p.push([cx + Math.cos(Math.PI + a) * r, cy + Math.sin(Math.PI + a) * r]); } return p; };
  fin(-74, 44, spiral(120 * sc, 0, 2.5), { r: 10 * sc, keep: 0, side: 0.8, front: 0.4 });
  fin(36, 78, spiral(145 * sc, 20, 1.9), { r: 5.5 * sc, keep: 0.02, side: 0.75, taper: true });
  fin(62, 100, spiral(170 * sc, 40, 1.4), { r: 3.5 * sc, keep: 0.05, side: 0.7, taper: true });
  // 浪尖三点白沫：指尖点三下（十六分音符）
  [[1560, 760], [1600, 742], [1645, 748]].forEach((p, i) => fin(150 + i * 7.5, 156 + i * 7.5, [p, [p[0] + 3, p[1] + 1]], { r: 7 + i, keep: 0, side: 0.9, front: 0.2 }));
})();
// 一群鸟从月亮前飞过：一只一只倒上去（八分音符），沿一条弧线越来越小
for (let i = 0; i < 9; i++) { const u = i / 8; const x = 820 + u * 620, y = 250 + Math.sin(u * 3.1) * -70 + u * 40, s = 1.05 - u * 0.55; const w = 32 * s;
  pour(46 + i * 7.5, 54 + i * 7.5, [[x - w, y - w * 0.25], [x - w * 0.45, y - w * 0.42 - (i % 2) * 6], [x, y + w * 0.05], [x + w * 0.45, y - w * 0.42 - (i % 2) * 6], [x + w, y - w * 0.25]], { r: 3.2 * s + 1, amt: 1.5, taper: true, ease: 'o' }); }
// 倒影上点几下碎光（指尖轻擦）
[[1150, 700], [1214, 728], [1130, 760], [1236, 800], [1170, 846]].forEach((p, i) => fin(64 + i * 7.5, 74 + i * 7.5, [[p[0] - 26 - i * 5, p[1]], [p[0] + 26 + i * 5, p[1] + 1]], { r: 3 + i * 0.5, keep: 0, side: 0.8, front: 0.2, taper: true, ease: 'o' }));
// 手掌从左推过海面：一道沙浪滚过去，身后留下一片干净的光
palm(100, 186, [[-160, 905], [300, 896], [700, 884], [960, 872]], { r: 125, keep: 0.45, ease: 'io' });

// 01 · 月亮 → 眼睛
(() => {
  const [mx, my, mr] = M;
  // 瞳孔：一股沙倒进月心，从里往外绕满
  const sp = []; for (let a = 0; a < Math.PI * 6; a += 0.2) { const r = 6 + a / (Math.PI * 6) * 50; sp.push([mx + Math.cos(a) * r, my + Math.sin(a) * r]); }
  pour(212, 252, sp, { r: 15, amt: 1.6 });
  pour(250, 282, circle([mx, my], mr - 4, mr - 4, -Math.PI / 2, Math.PI * 1.5, 80), { r: 5, amt: 1.1 }); // 虹膜外圈
  // 上下眼睑：两指一上一下划出眼角
  fin(270, 306, bez(EYE.l, [mx, EYE.top - 60], EYE.r), { r: 8, keep: 0.0, side: 0.8, front: 0.35 });
  fin(284, 318, bez(EYE.l, [mx, EYE.bot + 60], EYE.r), { r: 7, keep: 0.0, side: 0.8, front: 0.35 });
  // 眼白：从虹膜往外一抹变亮；眼睛外面的月晕撒回暗
  const inEye = (x, y) => { const u = (x - EYE.l[0]) / (EYE.r[0] - EYE.l[0]); if (u <= 0 || u >= 1) return -1; const top = (1 - u) * (1 - u) * EYE.l[1] + 2 * u * (1 - u) * (EYE.top - 60) + u * u * EYE.r[1]; const bot = (1 - u) * (1 - u) * EYE.l[1] + 2 * u * (1 - u) * (EYE.bot + 60) + u * u * EYE.r[1]; return Math.min(y - top, bot - y); };
  morph(298, 376, (x, y, t) => { const d = Math.hypot(x - mx, (y - my) * 1.6); const front = t * 520; const m = 1 - smooth(front - 60, front, d); if (m <= 0) return 0; const e = inEye(x, y); if (Math.hypot(x - mx, y - my) < mr + 2) return 0; return m * (e > 6 ? 1 : (e < -4 ? 0.9 * (1 - smooth(mr * 2.2, mr * 2.9, Math.hypot(x - mx, y - my))) : 0)); },
    (x, y, h) => { const e = inEye(x, y); if (e > 6) { const lidShade = 1 - smooth(8, 70, e); return 0.07 + 0.55 * lidShade + 0.05 * fbm(x / 30, y / 30); } return 0.95 + (fbm(x / 140, y / 140) - 0.5) * 0.3; }, { ease: 'io' });
  // 虹膜：十八根放射线，一根根倒上去
  for (let i = 0; i < 18; i++) { const a = -Math.PI / 2 + i / 18 * Math.PI * 2 + (i % 2) * 0.07; const r0 = 70 + (i % 3) * 6, r1 = 132 - (i % 2) * 14; pour(372 + i * 2.5, 380 + i * 2.5, [[mx + Math.cos(a) * r0, my + Math.sin(a) * r0], [mx + Math.cos(a + 0.05) * r1, my + Math.sin(a + 0.05) * r1]], { r: 2.6, amt: 0.85, taper: true }); }
  // 高光：指尖一按
  fin(422, 430, [[mx - 26, my - 24], [mx - 22, my - 22]], { r: 15, keep: 0, side: 0.85, front: 0.1, ease: 'o' });
  // 睫毛：从上眼睑往外甩七下
  for (let i = 0; i < 7; i++) { const u = 0.22 + i * 0.09; const p = [(1 - u) * (1 - u) * EYE.l[0] + 2 * u * (1 - u) * mx + u * u * EYE.r[0], (1 - u) * (1 - u) * EYE.l[1] + 2 * u * (1 - u) * (EYE.top - 60) + u * u * EYE.r[1] - 10]; const a = -Math.PI / 2 + (u - 0.5) * 1.6; fin(430 + i * 3.5, 440 + i * 3.5, [p, [p[0] + Math.cos(a) * 30, p[1] + Math.sin(a) * 30], [p[0] + Math.cos(a - 0.3) * 62, p[1] + Math.sin(a - 0.3) * 62]], { r: 3.2, taper: true, keep: 0.02, side: 0.8, front: 0.2, ease: 'o' }); }
  // 眼泪：从下眼睑滑下来，越落越快
  fin(452, 492, TEAR, { r: 9, keep: 0, side: 0.85, front: 0.45, ease: 'i' });
})();

// 02 · 沙守恒：一圈圈涟漪（一指一圈），扫描线读出截面
for (let i = 0; i < 7; i++) { const rx = 46 + i * 50, ry = rx * 0.3; fin(494 + i * 11, 510 + i * 11 + i * 1.5, circle(RC, rx, ry, -Math.PI / 2, Math.PI * 1.5 + 0.12, 72), { r: 3.6 + i * 0.5, keep: 0.0, side: 0.85, front: 0.25, ease: 'io2' }); }
// 第二轮：中心一按 + 外圈慢慢再划两圈（让截面一直在变）
fin(600, 610, [[RC[0], RC[1]], [RC[0] + 2, RC[1]]], { r: 22, keep: 0, side: 0.85, front: 0.1, ease: 'o' });
for (let i = 0; i < 2; i++) { const rx = 420 + i * 60, ry = rx * 0.3; fin(612 + i * 20, 660 + i * 20, circle(RC, rx, ry, Math.PI * 0.5, Math.PI * 2.5, 96), { r: 4.5, keep: 0.0, side: 0.85, front: 0.25 }); }

// 03 · 界面：一阵沙雨把涟漪盖成一张暗卡片，再在上面擦出按钮、进度环、滑杆、开关
const CARD = { x: 960, y: 840, w: 1240, h: 300, r: 70 };
const inCard = (x, y) => { const dx = Math.max(0, Math.abs(x - CARD.x) - (CARD.w / 2 - CARD.r)), dy = Math.max(0, Math.abs(y - CARD.y) - (CARD.h / 2 - CARD.r)); return Math.hypot(dx, dy) - CARD.r; };
morph(708, 784, (x, y, t) => { const e = inCard(x, y) + (fbm(x / 26, y / 26) - 0.5) * 30; if (e > 10) return 0; const d = Math.hypot((x - CARD.x) / 1.7, y - CARD.y); const front = t * 420; return (1 - smooth(front - 70, front, d)) * (1 - smooth(-6, 10, e)); },
  (x, y) => 1.15 + (fbm(x / 60, y / 60) - 0.5) * 0.35, { ease: 'io', fx: (t) => { const out = []; const front = t * 420; for (let i = 0; i < 4; i++) { const a = i / 4 * 6.283 + t * 9; out.push({ x: CARD.x + Math.cos(a) * front * 1.7 * 0.8, y: CARD.y + Math.sin(a) * Math.min(front, 150) * 0.8 }); } return out; } });
(() => {
  const bx = 560, by = CARD.y;
  const sp = []; for (let a = 0; a < Math.PI * 5; a += 0.25) { const r = 4 + a / (Math.PI * 5) * 50; sp.push([bx + Math.cos(a) * r, by + Math.sin(a) * r]); }
  fin(776, 800, sp, { r: 12, keep: 0, side: 0.7, front: 0.1, ease: 'io2' });                  // 按钮：一指旋开
  pour(800, 812, [[bx - 14, by - 22], [bx - 14, by + 22], [bx + 22, by], [bx - 14, by - 22]], { r: 4.5, amt: 1.6 }); // 播放三角：倒上去
  fin(814, 872, circle([bx, by], 100, 100, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.72, 90), { r: 7, keep: 0, side: 0.85, front: 0.35 }); // 进度环 72%
  // 滑杆：一指划出细轨，再推着一团沙走到 60%
  fin(812, 836, [[760, by], [1200, by]], { r: 3, keep: 0.05, side: 0.8, front: 0.2 });
  fin(846, 896, [[760, by], [1024, by]], { r: 15, keep: 0, side: 0.8, front: 0.55 });
  // 开关：一指绕出胶囊，按下圆钮，拖过去——身后亮了 = 开
  const tx = 1400, ty = by, cap = [[tx - 50, ty - 40], [tx + 50, ty - 40], ...circle([tx + 50, ty], 40, 40, -Math.PI / 2, Math.PI / 2, 16).slice(1), [tx - 50, ty + 40], ...circle([tx - 50, ty], 40, 40, Math.PI / 2, Math.PI * 1.5, 16).slice(1), [tx - 30, ty - 40]];
  fin(826, 858, cap, { r: 3, keep: 0.05, side: 0.8, front: 0.2 });
  fin(858, 866, [[tx - 50, ty], [tx - 48, ty]], { r: 25, keep: 0, side: 0.6, front: 0.1, ease: 'o' });
  fin(874, 904, [[tx - 48, ty], [tx + 50, ty]], { r: 25, keep: 0, side: 0.6, front: 0.5 });
})();

// 收束：两掌从右往左推平整盘沙，沙浪滚过全屏
palm(930, 1006, [[2150, 300], [1400, 296], [600, 300], [-260, 306]], { r: 300, keep: 0.08, stepK: 0.08, front: 0.97, lp: 1e5 });
palm(940, 1016, [[2150, 820], [1400, 816], [600, 820], [-260, 826]], { r: 300, keep: 0.08, stepK: 0.08, front: 0.97, lp: 1e5 });
// 写字：整盘推亮之后，“沙画”是倒上去的（字形遮罩，从左到右一笔笔落沙）
ops.push({ kind: 'fn', f0: 1012, f1: 1070, ease: 'io2', fn: (F, t) => TITLE.write(F, t) });
pour(1076, 1082, [[1290, 636], [1292, 637]], { r: 15, amt: 1.7, ease: 'o' }); // 句号：最后一撮沙（落在拍上）

// 片名的字形：一次生成遮罩，按 x 推进
const TITLE = (() => {
  let A = null, B = null, w = 0, h = 0;
  function build(F) {
    w = F.w; h = F.h; const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    g.font = '400 300px Brush'; g.textAlign = 'center'; g.fillStyle = '#000'; g.fillText('沙 画', W / 2 - 20, 650);
    const b = document.createElement('canvas'); b.width = W; b.height = H; const gb = b.getContext('2d'); gb.filter = 'blur(7px)'; gb.drawImage(c, 0, 0);
    const a = g.getImageData(0, 0, W, H).data, bb = gb.getImageData(0, 0, W, H).data; A = new Float32Array(w * h); B = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (Math.round(y / F.r) * W + Math.round(x / F.r)) * 4 + 3; A[y * w + x] = (a[i] || 0) / 255; B[y * w + x] = (bb[i] || 0) / 255; }
  }
  function write(F, t) {
    if (!A || F.w !== w) build(F);
    const x0 = 640, x1 = 1280; const front = x0 + (x1 - x0) * t;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const j = y * w + x; const m = A[j], bl = B[j]; if (m < 0.01 && bl < 0.01) continue;
      const px = x / F.r, py = y / F.r; const rev = 1 - smooth(front - 40, front + 10, px + (fbm(px / 30, py / 30) - 0.5) * 40 + (py - 500) * 0.15);
      if (rev <= 0) continue;
      F.d[j] = Math.max(F.d[j], F.d[j] * (1 - m * rev) + (1.5 + 0.3 * fbm(px / 9, py / 9)) * m * rev + Math.max(0, bl - m) * 0.25 * rev);
    }
    const out = []; for (let i = 0; i < 3; i++) out.push({ x: front - 10, y: 430 + i * 90 + Math.sin(t * 40 + i) * 30 }); return out;
  }
  return { write };
})();
