// 新浪潮 · 全片的画法。每一帧是帧号的纯函数：render(ctx, f)（f 可以是小数，运动模糊用）。
// 物理只有一条：所有东西都是灯箱上的一张片子——被推（带惯性的弹簧）、被叠（乘法）、被错开（套印 / 台阶 / 字距）。
const W = 1920, H = 1080;
const BG = '#E6E2DA', INK = '#141414', MG = '#EC1C8C', CY = '#12A8D8', YE = '#FFD21F', WH = '#F4F1EA', GR = '#9C988F';
const PI = Math.PI;
const sp = (f, f0, fr = 2.4, z = 0.42) => pop(f, f0, fr, z);                    // 0 → 1，冲过头再回来
const io = (f, a, b, e = ease.inOut3) => e(prog(f, a, b));
const sstep = t => t * t * (3 - 2 * t);
const hex2 = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const mulHex = (...hs) => '#' + hs.map(hex2).reduce((a, b) => a.map((v, i) => v * b[i])).map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
const MxC = mulHex(MG, CY), MxY = mulHex(MG, YE), CxY = mulHex(CY, YE), MCY = mulHex(MG, CY, YE);

// ---------- 小工具 ----------
function T(c, s, x, y, size, o = {}) {
  if (!s) return;
  c.font = `${o.w || 700} ${size}px ${o.fam || 'Heros'}`;
  c.letterSpacing = (o.ls || 0) + 'px';
  c.textAlign = o.align || 'left'; c.textBaseline = o.base || 'alphabetic';
  c.fillStyle = o.color || INK;
  c.fillText(s, x, y);
  c.letterSpacing = '0px';
}
const D = (s, f, f0, rate = 1, kind = 'type') => TFX.decode(s, Math.floor(f), f0, { rate, kind, lead: 3 });
const adv = (c, s, size, fam = 'Heros', w = 700) => { c.font = `${w} ${size}px ${fam}`; c.letterSpacing = '0px'; return [...s].map(ch => c.measureText(ch).width); };
function paper(c) { c.fillStyle = BG; c.fillRect(0, 0, W, H); }
function grid(c, a = 1, skip = null) {
  c.fillStyle = INK;
  for (let i = 1; i < 12; i++) { const k = skip ? skip(i) : 1; if (k <= 0) continue; c.globalAlpha = 0.16 * a * k; c.fillRect(i * 160, 0, 1, H); }
  c.globalAlpha = 0.22 * a; for (const y of [120, 540, 960]) c.fillRect(0, y, W, 1);
  c.globalAlpha = 1;
}
function mult(c, fn) { c.save(); c.globalCompositeOperation = 'multiply'; fn(); c.restore(); }
// 网点：半径 = k · 网格 · √深浅；网格转 ang 度
function dots(c, x0, y0, w, h, cell, fn, ang = 45, color = INK, k = 0.58, ox = 0, oy = 0) {
  const ca = Math.cos(ang * PI / 180), sa = Math.sin(ang * PI / 180);
  const n = Math.ceil(Math.hypot(w, h) / cell / 2) + 2, cx = x0 + w / 2 + ox, cy = y0 + h / 2 + oy;
  c.beginPath();
  for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
    const u = i * cell, v = j * cell, px = cx + u * ca - v * sa, py = cy + u * sa + v * ca;
    if (px < x0 - cell || px > x0 + w + cell || py < y0 - cell || py > y0 + h + cell) continue;
    const d = fn((px - x0) / w, (py - y0) / h, px, py);
    if (d <= 0.015) continue;
    const r = cell * k * Math.sqrt(d);
    c.moveTo(px + r, py); c.arc(px, py, r, 0, 2 * PI);
  }
  c.fillStyle = color; c.fill();
}
function clipRect(c, x, y, w, h) { c.beginPath(); c.rect(x, y, w, h); c.clip(); }
// 线网：每条线的粗细 = step · fn(位置)；phase 让线往下流
function lines(c, x0, y0, w, h, step, fn, color = INK, phase = 0) {
  c.save(); clipRect(c, x0, y0, w, h); c.fillStyle = color;
  const ph = ((phase % step) + step) % step;
  for (let y = y0 - step + ph; y < y0 + h; y += step) { const t = (y - y0) / h, th = step * clamp(fn(t), 0.03, 0.97); c.fillRect(x0, y, w, th); }
  c.restore();
}
function cross(c, x, y, r = 14, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot); c.strokeStyle = INK; c.lineWidth = 1.4;
  c.beginPath(); c.arc(0, 0, r * 0.55, 0, 2 * PI); c.moveTo(-r, 0); c.lineTo(r, 0); c.moveTo(0, -r); c.lineTo(0, r); c.stroke(); c.restore();
}
function hatch(c, x, y, w, h, step = 12, th = 4, phase = 0) {
  c.save(); clipRect(c, x, y, w, h); c.fillStyle = INK;
  c.translate(x, y); c.rotate(PI / 4);
  for (let k = -Math.ceil((w + h) / step) - 2; k < (w + h) / step + 2; k++) c.fillRect(k * step + (phase % step), -h - w, th, (w + h) * 2);
  c.restore();
}
function arrow(c, x, y, len, ang, lw = 4, head = 34) {
  c.save(); c.translate(x, y); c.rotate(ang); c.strokeStyle = INK; c.lineWidth = lw; c.lineCap = 'square';
  c.beginPath(); c.moveTo(0, 0); c.lineTo(len, 0); c.moveTo(len - head, -head * 0.6); c.lineTo(len, 0); c.lineTo(len - head, head * 0.6); c.stroke(); c.restore();
}
function dotted(c, x0, y0, x1, y1, a = 1) {
  c.save(); c.globalAlpha = a; c.strokeStyle = INK; c.lineWidth = 2; c.setLineDash([1, 8]); c.lineCap = 'round';
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.restore();
}
// 章节头：编号 · 中文 · 英文（字距撑开）
function header(c, f, f0, num, zh, en, x = 160, y = 96, a = 1) {
  if (f < f0) return;
  c.save(); c.globalAlpha = a;
  const k = sp(f, f0, 3, 0.5);
  c.fillStyle = MG; c.fillRect(x, y - 54, 64 * k, 64);
  T(c, D(num, f, f0, 1, 'small'), x + 10, y - 8, 30, { color: WH });
  T(c, D(zh, f, f0 + 2, 2.5, 'title'), x + 84, y, 60, { fam: 'NotoSC', w: 900 });
  T(c, D(en, f, f0 + 6, 1, 'small'), x + 84 + zh.length * 64 + 20, y - 4, 22, { ls: 12 });
  c.restore();
}
function rule(c, f, f0, s, x = 160, y = 1030, size = 30) {
  if (f < f0) return;
  T(c, D(s, f, f0, 0.8, 'type'), x, y, size, { fam: 'NotoSC', w: 700 });
}

// ============ 00 封面 / 07 收束 共用的构图（风格图） ============
const WAVE_X = [870, 1170, 1400, 1640];
function coverComp(c, f, P) {
  paper(c); grid(c);
  // 胶片层（乘法）
  mult(c, () => {
    c.globalAlpha = P.mA ?? 1; c.fillStyle = MG; c.fillRect(960 + P.mx, 120 + P.my, 640, 420);
    c.globalAlpha = P.cA ?? 1; c.fillStyle = CY; c.beginPath(); c.arc(1440 + P.cx, 560 + P.cy, 250 * (P.cS ?? 1), 0, 2 * PI); c.fill();
    c.globalAlpha = P.yA ?? 1; c.fillStyle = YE; c.beginPath(); c.moveTo(640 + P.yx, 1080 + P.yy); c.lineTo(1920 + P.yx, 760 + P.yy); c.lineTo(1920 + P.yx, 1080 + P.yy); c.fill();
    c.globalAlpha = P.c2A ?? 1; c.fillStyle = CY; c.fillRect(160 + P.c2x, 620, 380, 220);
    c.globalAlpha = P.spA ?? 1;
    c.save(); c.translate(1700 + P.spx, 300 + P.spy); c.rotate(-12 * PI / 180 + (P.spR || 0));
    const g = c.createLinearGradient(-140, -160, 160, 140); g.addColorStop(0, '#FF4FA3'); g.addColorStop(0.5, '#FFE45C'); g.addColorStop(1, '#2FC7E6');
    c.fillStyle = g; c.fillRect(-140, -160, 300, 300); c.restore();
    c.globalAlpha = 1;
    // 网点（从左上空到右下满，相位在走）
    c.globalAlpha = P.dA ?? 1;
    dots(c, 160, 540, 600, 300, 12, (u, v) => Math.pow(Math.max(0, u * 0.75 + v * 0.45 - 0.12 + P.dPh), 1.8) * 1.5 * (P.dG ?? 1), 45);
    c.globalAlpha = (P.lA ?? 1) * 0.9;
    lines(c, 1120 + P.mx, 120 + P.my, 480, 420, 12, t => 1 - t + P.lPh, INK, P.lFlow);
    c.globalAlpha = 1;
  });
  hatch(c, 1640 + P.spx * 0.6, 160 + P.spy, 160, 96, 12, 4, P.hPh || 0);
  // 大字
  if (P.newA !== 0) {
    c.save(); c.globalAlpha = P.newA ?? 1; c.translate(150, 470); c.scale(P.newS ?? 1, P.newS ?? 1);
    T(c, 'NEW', 0, 0, 360, { ls: P.newLs ?? -14 }); c.restore();
  }
  ['W', 'A', 'V', 'E'].forEach((ch, k) => {
    const dy = P.wave ? P.wave(k) : 0, a = P.waveA ? P.waveA(k) : 1;
    if (a <= 0) return;
    c.save(); c.globalAlpha = a;
    const x = WAVE_X[k], y = 690 + k * 70 + dy, sq = P.waveSq ? P.waveSq(k) : 1;
    c.translate(x + 110, y); c.scale(1 / Math.sqrt(sq), sq); c.translate(-x - 110, -y);
    if (k === 1) { c.font = '700 300px Heros'; c.lineWidth = 4; c.strokeStyle = INK; c.strokeText(ch, x, y); }
    else T(c, ch, x, y, 300);
    c.restore();
    const tw = (k ? 150 : 260) * (P.tread ? P.tread(k) : 1);
    c.fillStyle = MG; c.fillRect(x, 700 + k * 70, tw, 6);
  });
  // 中文：青版套印错位
  mult(c, () => T(c, '新浪潮', 176 + P.regX, 1008 + P.regY, 150, { fam: 'NotoSC', w: 900, ls: 30, color: CY }));
  T(c, '新浪潮', 176, 1008, 150, { fam: 'NotoSC', w: 900, ls: 30 });
  // 小字
  T(c, D('NEW WAVE TYPOGRAPHY', f, P.t0, 0.7, 'small'), 166, 96, 22, { ls: 14 });
  T(c, D('1972 — 1986', f, P.t0 + 4, 0.7, 'small'), 1606, 96, 22, { ls: 6 });
  const step = P.stepText || ['BASEL', 'LOS ANGELES', 'NEW YORK', '打碎网格，', '但每一块', '都还对得上一根线。'];
  step.forEach((s, i) => T(c, D(s, f, (P.stepT0 ?? P.t0 + 8) + i * 4, 0.8, 'small'), 806 + i * 30, 770 + i * 28, 20, { fam: /[一-鿿]/.test(s) ? 'NotoSC' : 'Heros', ls: /[一-鿿]/.test(s) ? 1 : 2 }));
  // 像素条
  if (P.bar !== false) {
    const bw = 480 * (P.barW ?? 1);
    c.fillStyle = INK; c.fillRect(1286 + 480 - bw, 980, bw, 48);
    T(c, D('MACINTOSH 1984 · 72 DPI', f, P.t0 + 10, 0.8, 'small'), 1302, 1014, 22, { fam: 'Silk', w: 400, ls: 1, color: BG });
  }
  cross(c, 940, 120, 14, P.crossR || 0); cross(c, 1600, 540, 14, -(P.crossR || 0)); cross(c, 160, 960, 14, P.crossR || 0);
  T(c, '01', 968 + P.mx, 150 + P.my, 18, { color: WH }); T(c, '02', 186, 572, 18); T(c, '03', 1620, 790, 18);
  arrow(c, 1700 + (P.arX || 0), 620 - (P.arX || 0) * 0.75, 150, -0.64);
  dotted(c, 160, 500, 160 + 740 * (P.dotLine ?? 1), 500);
}

// 一跳：t0 起跳，14 帧落地，落地压扁再弹回
const hop = (f, t0, h = 46) => { const t = (f - t0) / 14; return t <= 0 || t >= 1 ? 0 : -h * Math.sin(PI * t); };
const hopSq = (f, t0) => squash(f, t0 + 14, 0.16, 3, 3.4, 0.32);
// 套印错位：一下撞开，阻尼抖回
const regWob = (f, t0, amp = 26) => { const s = Math.max(0, (f - t0) / 60); return amp * Math.exp(-s * 5) * Math.cos(s * 2 * PI * 4.2); };

// 跟着拍子的一下轻推（冲激响应：推出去、回来、抖一下）。from..to 之间每拍一次
function kick(f, from, to, every = 1) {   // from / to 是拍数
  let v = 0;
  for (let b = from; b < to; b += every) { const t = f - FB(b); if (t >= 0 && t < 40) v += Math.exp(-t / 7) * Math.sin(t * 0.42); }
  return v;
}
function S0(c, f) {
  const k1 = kick(f, 1, 3, 2), k2 = kick(f, 2, 3, 2);
  const m = 1 - sp(f, -6, 1.6, 0.55), cc = 1 - sp(f, -4, 1.5, 0.5), yy = 1 - sp(f, -2, 1.4, 0.55);
  const lsBump = sp(f, FB(2), 2.2, 0.4) - sp(f, FB(3), 2.2, 0.45);
  coverComp(c, f, {
    t0: -60, stepT0: -40, cS: 1 + 0.05 * k2, mx: 120 * m + 22 * k1, my: 0, cx: 0, cy: 90 * cc, yx: 160 * yy, yy: 0, c2x: -60 * m, spx: 40 * cc, spy: -30 * cc, spR: 0.08 * cc,
    dPh: 0.14 * Math.sin(f / 16), lPh: 0.08 * Math.sin(f / 20), lFlow: f * 0.5,
    newLs: -14 + 26 * lsBump,
    wave: k => hop(f, -5 + 7 * k) + hop(f, FB(2) + 4 * k, 30), waveSq: k => hopSq(f, -5 + 7 * k) * hopSq(f, FB(2) + 4 * k),
    regX: 10 + regWob(f, -3, 22) + regWob(f, FB(2), 14), regY: 10 + regWob(f, -1, 14) * 0.6,
    crossR: f * 0.02, arX: 30 * (1 - sp(f, 0, 2, 0.5)), hPh: f * 0.4,
  });
}

// ============ 01 叠 ============
function filmsS1(f) {
  const e = (t0, fr = 2.1, z = 0.52) => 1 - sp(f, t0, fr, z);
  const drift = sstep(prog(f, TL.labels[1], TL.push1[0])), d0 = TL.labels[1];
  return {
    m: { x: 200 - 1900 * e(TL.films[0]) + 70 * drift * Math.sin((f - d0) / 30), y: 250, w: 660, h: 500 },
    c: { x: 900 + 2000 * e(TL.films[1]) - 60 * drift * Math.sin((f - d0) / 26), y: 520 + 30 * drift * Math.sin((f - d0) / 22), r: 300 },
    y: { x: 0, y: 1300 * e(TL.films[2]) - 40 * drift * Math.sin((f - d0) / 34), pts: [[560, 1000], [1460, 1000], [1010, 450]] },
  };
}
function inTri(px, py, P) {
  const [[ax, ay], [bx, by], [cx, cy]] = P, s = (x1, y1, x2, y2, x3, y3) => (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3);
  const d1 = s(px, py, ax, ay, bx, by), d2 = s(px, py, bx, by, cx, cy), d3 = s(px, py, cx, cy, ax, ay);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}
function S1(c, f) {
  const k = lerp(0.6, 1, ease.out3(prog(f, TL.s1 - 17, TL.s1 + 35)));
  paper(c);
  c.save(); c.translate(960, 540); c.scale(k, k); c.translate(-960, -540);
  paper(c); grid(c);
  const F = filmsS1(f), tri = F.y.pts.map(([x, y]) => [x + F.y.x, y + F.y.y]);
  mult(c, () => {
    c.fillStyle = MG; c.fillRect(F.m.x, F.m.y, F.m.w, F.m.h);
    c.fillStyle = CY; c.beginPath(); c.arc(F.c.x, F.c.y, F.c.r, 0, 2 * PI); c.fill();
    c.fillStyle = YE; c.beginPath(); c.moveTo(...tri[0]); c.lineTo(...tri[1]); c.lineTo(...tri[2]); c.fill();
  });
  // 重叠区的重心（粗采样）→ 标注点
  const acc = { mc: [0, 0, 0], my: [0, 0, 0], cy: [0, 0, 0], mcy: [0, 0, 0] };
  for (let y = 0; y < H; y += 24) for (let x = 0; x < 1360; x += 24) {
    const im = x > F.m.x && x < F.m.x + F.m.w && y > F.m.y && y < F.m.y + F.m.h, ic = Math.hypot(x - F.c.x, y - F.c.y) < F.c.r, iy = inTri(x, y, tri);
    const key = im && ic && iy ? 'mcy' : im && ic ? 'mc' : im && iy ? 'my' : ic && iy ? 'cy' : null;
    if (key) { acc[key][0] += x; acc[key][1] += y; acc[key][2]++; }
  }
  const rows = [['mc', 'M × C', MxC, TL.labels[0]], ['my', 'M × Y', MxY, TL.labels[1]], ['cy', 'C × Y', CxY, TL.labels[2]], ['mcy', 'M × C × Y', MCY, TL.labels[3]]];
  rows.forEach(([key, name, hx, t0], i) => {
    if (f < t0) return;
    const a = acc[key], ry = 330 + i * 130, s = sp(f, t0, 2.8, 0.45);
    // 色块 + 名字 + 色号
    c.fillStyle = hx; c.fillRect(1440, ry - 70, 90 * s, 90);
    T(c, D(name, f, t0 + 2, 1, 'type'), 1556, ry - 30, 40);
    T(c, D(hx, f, t0 + 6, 1, 'small'), 1556, ry + 10, 26, { w: 700, ls: 3, color: '#55524C' });
    if (a[2] > 2) {
      const px = a[0] / a[2], py = a[1] / a[2], q = ease.out3(prog(f, t0, t0 + 10));
      c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(1430, ry - 25); c.lineTo(lerp(1430, px, q), lerp(ry - 25, py, q)); c.stroke();
      c.fillStyle = WH; c.beginPath(); c.arc(px, py, 9 * s, 0, 2 * PI); c.fill(); c.lineWidth = 3; c.stroke();
      const ring = prog(f, t0, t0 + 18);
      if (ring < 1) { c.globalAlpha = 1 - ring; c.lineWidth = 2; c.beginPath(); c.arc(px, py, 10 + 60 * ease.out3(ring), 0, 2 * PI); c.stroke(); c.globalAlpha = 1; }
    }
  });
  header(c, f, 116, '01', '叠', 'OVERLAY · MULTIPLY');
  rule(c, f, TL.rule1, '两张胶片叠在一起 = 乘法：每个颜色通道相乘，叠出第三种颜色', 160, 1046, 30);
  c.restore();
}

// ============ 02 台阶 ============
const WORD2 = 'TYPOGRAPHY', SZ2 = 250, CAP2 = 180, STEP2 = 45, X2 = 140, Y2 = 330;
let ADV2 = null;
function stairPos(c) {
  if (!ADV2) ADV2 = adv(c, WORD2, SZ2);
  let x = X2; return ADV2.map((a, i) => { const p = { x, y: Y2 + i * STEP2, w: a }; x += a - 6; return p; });
}
function S2(c, f) {
  paper(c); grid(c);
  const P = stairPos(c);
  P.forEach((p, i) => {
    const tl = TL.stairs0 + i * TL.stairStep, tf = tl - 10;
    if (f < tf) return;
    const fall = f < tl ? -560 * Math.pow(1 - (f - tf) / 10, 2) : 0;
    const sq = squash(f, tl, 0.2, 3, 3.4, 0.3) * hopSq(f, TL.stairWave + i * 2);
    const y = p.y + fall + hop(f, TL.stairWave + i * 2, 36);
    // 踏步：落地那一下从左边长出来
    const tw = sp(f, tl, 3, 0.5);
    c.fillStyle = MG; c.fillRect(p.x, p.y + 16, (p.w - 4) * tw, 9);
    c.save(); c.translate(p.x + p.w / 2, y); c.scale(1 / Math.sqrt(sq), sq); c.translate(-p.x - p.w / 2, -y);
    T(c, WORD2[i], p.x, y, SZ2, { color: i === 3 ? INK : INK });
    c.restore();
  });
  // 标注：字高 H 和 ¼ H
  const a1 = TL.stairs0 + 40;
  if (f >= a1) {
    const q = ease.out3(prog(f, a1, a1 + 10)), p0 = P[0];
    c.strokeStyle = INK; c.lineWidth = 2; const bx = p0.x - 30;
    c.beginPath(); c.moveTo(bx, p0.y); c.lineTo(bx, p0.y - CAP2 * q); c.moveTo(bx - 8, p0.y); c.lineTo(bx + 8, p0.y); c.moveTo(bx - 8, p0.y - CAP2 * q); c.lineTo(bx + 8, p0.y - CAP2 * q); c.stroke();
    T(c, D('H', f, a1, 1, 'type'), bx - 44, p0.y - CAP2 / 2 + 12, 34);
  }
  const a2 = TL.stairs0 + 56;
  if (f >= a2) {
    const i = 6, p = P[i], n = P[i + 1], q = ease.out3(prog(f, a2, a2 + 10)), x = n.x + n.w + 26;
    c.strokeStyle = MG; c.lineWidth = 3;
    c.beginPath(); c.moveTo(p.x + p.w, p.y + 16); c.lineTo(x + 20, p.y + 16); c.moveTo(n.x + n.w, n.y + 16); c.lineTo(x + 20, n.y + 16); c.stroke();
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 10, p.y + 16); c.lineTo(x + 10, p.y + 16 + STEP2 * q); c.stroke();
    T(c, D('¼ H', f, a2, 1, 'type'), x + 30, p.y + 44, 34);
  }
  header(c, f, TL.s2 + 8, '02', '台阶', 'STAIRCASE');
  rule(c, f, TL.stairs0 + 66, '一个字往下走一级：每级下降 ¼ 字高，一级一个十六分音符', 160, 1000, 30);
}
function oCounter(c) {   // 字母 O 的字怀（椭圆）
  const p = stairPos(c)[3];
  return { x: p.x + p.w / 2 - 2, y: p.y - CAP2 / 2, rx: p.w * 0.25, ry: CAP2 * 0.33 };
}

// ============ 03 字距 ============
const WORD3 = 'WAVE', SZ3 = 360, COL3 = [MG, CY, YE, CY];
let ADV3 = null;
function trackAt(f) {   // 字距（1/1000 em），每一拍一个值，弹簧过冲
  const seq = [[TL.s3 - 30, -150], [TL.track[0], 0], [TL.track[1], 300], [TL.track[2], -150], [TL.track[3], 700]];
  let v = seq[0][1];
  for (let i = 1; i < seq.length; i++) v += (seq[i][1] - seq[i - 1][1]) * sp(f, seq[i][0], 2.6, i === seq.length - 1 ? 0.62 : 0.42);
  return v;
}
function letters3(c, f) {
  if (!ADV3) ADV3 = adv(c, WORD3, SZ3);
  const tr = trackAt(f) / 1000 * SZ3, tot = ADV3.reduce((a, b) => a + b) + tr * 3;
  let x = 960 - tot / 2;
  return ADV3.map(a => { const p = { x, w: a }; x += a + tr; return p; });
}
function S3(c, f) {
  const morph = io(f, TL.toGrid[0], TL.toGrid[1], ease.inOut3), TGT = [320, 800, 1120, 1600];
  paper(c); grid(c, 1, i => { const j = TGT.indexOf(i * 160); return j < 0 ? 1 : 1 - morph; });
  const L = letters3(c, f), base = 690;
  // 字距标尺：字之间的空隙标品红
  if (morph < 1) {
    c.globalAlpha = 1 - morph;
    for (let i = 0; i < 3; i++) { const a = L[i].x + L[i].w, b = L[i + 1].x; c.fillStyle = b > a ? MG : INK; c.fillRect(Math.min(a, b), base + 40, Math.abs(b - a), 10); c.fillRect(a - 1, base + 26, 2, 38); c.fillRect(b - 1, base + 26, 2, 38); }
    c.globalAlpha = 1;
  }
  mult(c, () => L.forEach((p, i) => {
    const cxp = p.x + p.w / 2, tx = lerp(cxp, TGT[i] + 0.5, morph);
    c.save(); c.translate(tx, lerp(base - 140, 540, morph));
    c.scale(lerp(1, 1 / p.w, ease.in3(morph)), lerp(1, 1100 / 290, ease.in2(morph)));
    c.globalAlpha = lerp(1, 0.16, ease.in3(morph));
    T(c, WORD3[i], -p.w / 2, 140, SZ3, { color: morph > 0.85 ? INK : COL3[i] });
    c.restore();
  }));
  if (morph < 1) {
    c.save(); c.globalAlpha = 1 - morph;
    const v = Math.round(trackAt(f));
    T(c, D('TRACKING', f, TL.s3 + 10, 1, 'small'), 160, 866, 22, { ls: 12 });
    T(c, (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v), 160, 990, 120);
    T(c, D('/ 1000 em', f, TL.s3 + 14, 1, 'small'), 160, 1030, 22, { ls: 4, color: '#55524C' });
    header(c, f, TL.s3 + 6, '03', '字距', 'TRACKING');
    rule(c, f, TL.track[1] + 4, '同一个词：挤到 −150，叠出新颜色；撑开到 +700，变成一行节奏', 760, 990, 30);
    c.restore();
  }
}

// ============ 04 网格 ============
const BLK = [   // [名字, 整齐的位置, 打碎后的位置, 第二次的位置]（x,y,w,h,转角）
  ['a1', [160, 170, 960, 150, 0], [480, 130, 960, 150, 0], [160, 210, 960, 150, 0]],
  ['a2', [160, 330, 960, 150, 0], [160, 300, 960, 150, 0], [640, 370, 960, 150, 0]],
  ['img', [1120, 170, 640, 470, 0], [960, 250, 640, 470, -0.14], [1120, 130, 640, 470, 0]],
  ['bar', [160, 520, 960, 22, 0], [-40, 560, 1340, 22, 0], [160, 600, 1600, 22, 0]],
  ['t1', [160, 600, 440, 300, 0], [320, 650, 440, 300, 0], [160, 680, 440, 300, 0]],
  ['t2', [640, 600, 440, 300, 0], [960, 760, 440, 300, 0], [800, 720, 440, 300, 0]],
  ['sq', [1120, 680, 320, 220, 0], [1440, 600, 320, 300, 0.2], [1440, 680, 320, 220, 0]],
  ['cap', [1480, 690, 280, 200, 0], [1600, 900, 280, 120, 0], [1280, 860, 280, 120, 0]],
];
function blkAt(b, f, i) {
  const [, A, Bk, Cc] = b;
  const t1 = TL.break + i * 2, t2 = TL.break2 + i * 2;
  const s1 = sp(f, t1, 2.6, 0.45), s2 = sp(f, t2, 2.6, 0.45);
  return A.map((v, j) => v + (Bk[j] - v) * s1 + (Cc[j] - Bk[j]) * s2);
}
function drawBlock(c, name, r, f) {
  const [x, y, w, h, rot] = r;
  c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(rot); c.translate(-w / 2, -h / 2);
  if (name === 'a1') T(c, 'BREAK', 0, 140, 170, { ls: -6 });
  if (name === 'a2') T(c, 'THE GRID', 0, 140, 170, { ls: -6 });
  if (name === 'img') { c.fillStyle = WH; c.fillRect(0, 0, w, h); dots(c, 0, 0, w, h, 14, (u, v) => { const d = Math.hypot(u - 0.42, (v - 0.45) * h / w); return d < 0.36 ? 0.25 + 0.75 * clamp((u - 0.2 + v - 0.2) * 0.9) : 0.08 + 0.1 * v; }); }
  if (name === 'bar') { c.fillStyle = MG; c.fillRect(0, 0, w, h); }
  if (name === 't1' || name === 't2') { c.fillStyle = INK; for (let k = 0; k < 11; k++) { const lw = w * (k % 4 === 3 ? 0.62 : k === 0 ? 1 : 0.96 - (k * 37 % 7) * 0.02); c.globalAlpha = k === 0 ? 1 : 0.55; c.fillRect(0, k * 26 + (k ? 18 : 0), lw, k ? 9 : 16); } c.globalAlpha = 1; }
  if (name === 'sq') mult(c, () => { c.fillStyle = CY; c.fillRect(0, 0, w, h); });
  if (name === 'cap') { T(c, 'Nº 04', 0, 40, 40); T(c, 'SWISS → NEW WAVE', 0, 80, 18, { ls: 4 }); T(c, '1957 / 1972', 0, 108, 18, { ls: 4, color: '#55524C' }); }
  c.restore();
}
function S4(c, f) {
  paper(c); grid(c);
  // 吸附：块落定时，它左右两条栏线闪品红
  const snaps = [];
  BLK.forEach((b, i) => {
    for (const [t0, R] of [[TL.break + i * 2, b[2]], [TL.break2 + i * 2, b[3]]]) {
      const a = 1 - prog(f, t0 + 8, t0 + 30);
      if (f >= t0 + 8 && a > 0 && !R[4]) for (const x of [R[0], R[0] + R[2]]) if (x > 0 && x < W && x % 160 === 0) snaps.push([x, a]);
    }
  });
  for (const [x, a] of snaps) { c.globalAlpha = a; c.fillStyle = MG; c.fillRect(x - 2, 0, 4, H); }
  c.globalAlpha = 1;
  BLK.forEach((b, i) => {
    const t0 = TL.blocks0 + i * 3; if (f < t0) return;
    const r = blkAt(b, f, i), k = sp(f, t0, 3, 0.5);
    c.save(); c.globalAlpha = clamp(k * 1.5); c.translate(r[0] + r[2] / 2, r[1] + r[3] / 2 + 60 * (1 - k)); c.translate(-r[0] - r[2] / 2, -r[1] - r[3] / 2);
    drawBlock(c, b[0], r, f); c.restore();
  });
  // 栏号
  for (let i = 0; i < 12; i++) T(c, D(String(i + 1).padStart(2, '0'), f, TL.s4 + 2 + i, 1, 'small'), i * 160 + 8, 1066, 14, { color: '#55524C' });
  header(c, f, TL.s4 + 4, '04', '网格', f < TL.break ? 'SWISS · TIDY' : 'NEW WAVE · BROKEN', 160, 96, 1);
  rule(c, f, TL.break + 22, '打碎网格，但每一块的边都还对得上一根栏线', 760, 1046, 28);
  // 网点长大，连成一片黑（转到 05）
  if (f >= TL.dots4[0]) {
    const g = ease.in2(prog(f, TL.dots4[0], TL.dots4[1])) * 2.2;
    dots(c, 0, 0, W, H, 40, (u, v, px, py) => clamp(g - Math.hypot(px - 1280, py - 400) / 1500, 0, 1) ** 2 * 1.6, 45, INK, 0.75);
  }
}

// ============ 05 网点 ============
const CELL5 = 22, A5 = 45 * PI / 180;
function tone5(px, py, f) {
  const la = lerp(-2.3, 0.9, io(f, TL.light[0], TL.light[1], ease.inOut2)), lx = Math.cos(la), ly = Math.sin(la);
  const cx = 740, cy = 540, R = 380, dx = (px - cx) / R, dy = (py - cy) / R, r2 = dx * dx + dy * dy;
  let t = 0.05;
  const sh = Math.hypot((px - cx - 120) / 420, (py - cy - 400) / 70); if (sh < 1) t = Math.max(t, 0.55 * (1 - sh * sh));
  if (r2 < 1) { const nz = Math.sqrt(1 - r2), lam = clamp(dx * lx + dy * ly + nz * 0.55); t = clamp(1 - lam * 1.05, 0.04, 1); }
  return t;
}
function S5(c, f) {
  paper(c);
  // 从一颗网点里退出来：开始时整屏就是那颗点（黑），镜头指数式拉远
  const P0 = (() => { const ca = Math.cos(A5), sa = Math.sin(A5); const i = 9, j = 3; return [960 + (i * ca - j * sa) * CELL5, 540 + (i * sa + j * ca) * CELL5]; })();
  const p = prog(f, TL.s5, TL.s5 + 64), s = Math.exp(Math.log(140) * (1 - ease.out3(p))), e = ease.inOut2(p);
  const ax = lerp(960, P0[0], e), ay = lerp(540, P0[1], e);
  c.save(); c.translate(ax, ay); c.scale(s, s); c.translate(-P0[0], -P0[1]);
  const vx0 = P0[0] - ax / s, vy0 = P0[1] - ay / s, vw = W / s, vh = H / s;
  grid(c, clamp((1.6 - s) * 2));
  c.save(); clipRect(c, vx0 - 40, vy0 - 40, vw + 80, vh + 80);
  // 网点场：全屏一张，深浅来自那颗被光照着的球
  const ca = Math.cos(A5), sa = Math.sin(A5);
  c.beginPath();
  const n = 60;
  for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
    const px = 960 + (i * ca - j * sa) * CELL5, py = 540 + (i * sa + j * ca) * CELL5;
    if (px < vx0 - CELL5 || px > vx0 + vw + CELL5 || py < vy0 - CELL5 || py > vy0 + vh + CELL5) continue;
    if (px > 1360 && f > TL.s5 + 40) continue;
    const t = i === 9 && j === 3 ? Math.max(tone5(px, py, f), 1 - p) : tone5(px, py, f);
    const r = CELL5 * 0.58 * Math.sqrt(t);
    c.moveTo(px + r, py); c.arc(px, py, r, 0, 2 * PI);
  }
  c.fillStyle = INK; c.fill();
  c.restore(); c.restore();
  if (p < 0.6) return;
  const a = clamp((p - 0.6) * 4);
  c.save(); c.globalAlpha = a;
  c.fillStyle = BG; c.fillRect(1360, 130, 560, 950);
  header(c, f, TL.s5 + 30, '05', '网点', 'HALFTONE');
  // 色阶：10%—100%，每格一颗点
  const t0 = TL.s5 + 50;
  [0.1, 0.2, 0.3, 0.5, 0.7, 1.0].forEach((t, i) => {
    if (f < t0 + i * 3) return;
    const y = 300 + i * 92, k = sp(f, t0 + i * 3, 3, 0.5);
    c.fillStyle = INK; c.beginPath(); c.arc(1460, y, 34 * 0.58 * Math.sqrt(t) * 2 * k, 0, 2 * PI); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(1460 - 40, y - 40, 80, 80);
    T(c, D(Math.round(t * 100) + '%', f, t0 + i * 3, 1, 'small'), 1530, y + 12, 34);
    T(c, D('r = ' + (0.58 * Math.sqrt(t)).toFixed(2), f, t0 + i * 3 + 2, 1, 'small'), 1660, y + 10, 22, { color: '#55524C', ls: 2 });
  });
  T(c, D('r = 0.58 × 网格 × √深浅', f, TL.s5 + 70, 0.8, 'type'), 1420, 880, 34, { fam: 'NotoSC' });
  T(c, D('网格转 45°，眼睛就看不出格子', f, TL.s5 + 84, 0.8, 'type'), 1420, 930, 26, { fam: 'NotoSC', color: '#3a3833' });
  c.restore();
  // 45° 的量角线
  if (f >= TL.s5 + 84) { const q = ease.out3(prog(f, TL.s5 + 84, TL.s5 + 100)); c.strokeStyle = MG; c.lineWidth = 3; c.beginPath(); c.moveTo(1200, 1000); c.lineTo(1200 + 130 * q, 1000); c.moveTo(1200, 1000); c.lineTo(1200 + 92 * q, 1000 - 92 * q); c.stroke(); c.beginPath(); c.arc(1200, 1000, 60, -PI / 4 * q, 0); c.stroke(); T(c, '45°', 1270, 985, 22, { color: MG }); }
}

// ============ 06 用起来 ============
const USE = [['海报', 'POSTER'], ['唱片封面', 'RECORD SLEEVE'], ['杂志跨页', 'MAGAZINE SPREAD'], ['App', 'MUSIC APP'], ['网页', 'WEBSITE'], ['票', 'TICKET']];
function shadowBox(c, x, y, w, h, fill = WH, r = 0) {
  c.save(); c.shadowColor = 'rgba(40,30,20,.28)'; c.shadowBlur = 40; c.shadowOffsetY = 18; c.fillStyle = fill;
  c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); c.restore();
}
function useLayout(c, k, f, t0) {
  const e = (d = 0, fr = 2.8, z = 0.5) => sp(f, t0 + d, fr, z), lt = f - t0;
  paper(c); grid(c, 0.7);
  if (k === 0) {   // 海报
    const x = 660, y = 130, w = 600, h = 840; shadowBox(c, x, y, w, h);
    c.save(); clipRect(c, x, y, w, h);
    c.fillStyle = INK; c.globalAlpha = 0.12; for (let i = 1; i < 6; i++) c.fillRect(x + i * 100, y, 1, h); c.globalAlpha = 1;
    mult(c, () => { c.fillStyle = MG; c.fillRect(x + 300 - 400 * (1 - e(0)), y + 80, 300, 380); c.fillStyle = CY; c.beginPath(); c.arc(x + 230, y + 520 + 200 * (1 - e(3)), 170, 0, 2 * PI); c.fill(); });
    dots(c, x, y + 560, w, 280, 10, (u, v) => clamp(u * 0.8 + v * 0.6 - 0.3 + lt * 0.006) ** 1.6 * 1.4, 45);
    ['S', 'O', 'U', 'N', 'D'].forEach((ch, i) => T(c, ch, x + 30 + i * 108, y + 260 + i * 40 + hop(f, t0 + 4 + i * 2, 24), 150));
    T(c, 'SYSTEM', x + 30, y + 520, 64, { ls: 30 * e(2) });
    c.fillStyle = INK; c.fillRect(x + 30, y + 760, 300, 34); T(c, 'LIVE · BASEL · 1984', x + 40, y + 785, 16, { fam: 'Silk', w: 400, color: BG });
    c.restore();
  }
  if (k === 1) {   // 唱片封面：黑胶从封套里滑出来
    const x = 520, y = 180, s = 720, out = 260 * e(2, 2, 0.6);
    c.save(); c.translate(x + s / 2 + out, y + s / 2); c.rotate(lt * 0.04);
    c.fillStyle = '#111'; c.beginPath(); c.arc(0, 0, 340, 0, 2 * PI); c.fill();
    c.strokeStyle = '#2a2a2a'; c.lineWidth = 1; for (let r = 150; r < 335; r += 9) { c.beginPath(); c.arc(0, 0, r, 0, 2 * PI); c.stroke(); }
    c.fillStyle = MG; c.beginPath(); c.arc(0, 0, 110, 0, 2 * PI); c.fill(); c.fillStyle = BG; c.beginPath(); c.arc(0, 0, 10, 0, 2 * PI); c.fill(); c.restore();
    shadowBox(c, x, y, s, s, YE);
    c.save(); clipRect(c, x, y, s, s);
    mult(c, () => { c.fillStyle = MG; c.fillRect(x, y + 470 - 300 * (1 - e(0)), s, 70); c.fillStyle = CY; c.beginPath(); c.arc(x + 470, y + 300, 210 * e(1), 0, 2 * PI); c.fill(); });
    lines(c, x + 360, y + 90, 300, 300, 10, t => 1 - t, INK, lt * 0.4);
    T(c, 'WAVE', x + 40, y + 660, 150, { ls: -8 });
    T(c, 'F O R M', x + 44, y + 450, 30, { ls: 18 + 40 * e(3) });
    T(c, 'SIDE A', x + 40, y + 80, 22, { fam: 'Silk', w: 400 });
    c.restore();
  }
  if (k === 2) {   // 杂志跨页
    const x = 240, y = 150, w = 1440, h = 820; shadowBox(c, x, y, w, h);
    const g = c.createLinearGradient(x + w / 2 - 40, 0, x + w / 2 + 40, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(0,0,0,.18)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(x + w / 2 - 40, y, 80, h);
    c.save(); clipRect(c, x, y, w, h);
    c.fillStyle = WH; c.fillRect(x + 760, y + 80, 600, 400); dots(c, x + 760, y + 80, 600, 400, 12, (u, v) => clamp(0.15 + 0.8 * Math.abs(Math.sin((u + lt * 0.004) * 5 + v * 2)) * v), 45);
    mult(c, () => { c.fillStyle = MG; c.fillRect(x + 640, y + 40 + 420 * (1 - e(0)), 260, 520); });
    ['BREAKING', 'THE', 'GRID'].forEach((s, i) => T(c, s, x + 60 + i * 260 * e(i + 1), y + 210 + i * 130, 130, { ls: -4 }));
    for (let col = 0; col < 3; col++) for (let l = 0; l < 9; l++) { c.globalAlpha = 0.5; c.fillStyle = INK; c.fillRect(x + 60 + col * 220 + (col === 1 ? 40 : 0), y + 560 + l * 24 + col * 30, 190 - (l * 13 % 50), 8); }
    c.globalAlpha = 1;
    T(c, '72', x + 1250, y + 790, 22); T(c, '73', x + 40, y + 790, 22);
    c.restore();
  }
  if (k === 3) {   // App：播放器
    const x = 760, y = 110, w = 400, h = 860;
    shadowBox(c, x - 14, y - 14, w + 28, h + 28, '#141414', 64);
    c.save(); c.beginPath(); c.roundRect(x, y, w, h, 52); c.clip(); c.fillStyle = BG; c.fillRect(x, y, w, h);
    c.fillStyle = INK; c.globalAlpha = 0.12; for (let i = 1; i < 4; i++) c.fillRect(x + i * 100, y, 1, h); c.globalAlpha = 1;
    c.fillStyle = WH; c.fillRect(x + 30, y + 90, 340, 340);
    dots(c, x + 30, y + 90, 340, 340, 9, (u, v) => { const d = Math.hypot(u - 0.5, v - 0.5); return d < 0.38 ? clamp(0.2 + (u + v) * 0.5) : 0.05; });
    mult(c, () => { c.fillStyle = MG; c.fillRect(x + 30, y + 330, 340 * e(0), 40); });
    T(c, 'WAVEFORM', x + 30, y + 490, 40, { ls: -1 });
    T(c, 'N E W  O R D E R  O F  T Y P E', x + 30, y + 520, 13, { ls: 2, color: '#55524C' });
    const pr = 0.3 + lt * 0.01; c.fillStyle = INK; c.fillRect(x + 30, y + 560, 340, 2); c.fillStyle = MG; c.fillRect(x + 30, y + 556, 340 * pr, 10);
    mult(c, () => { c.fillStyle = CY; c.beginPath(); c.arc(x + 200 - 22, y + 650, 52 * e(2), 0, 2 * PI); c.fill(); c.fillStyle = MG; c.beginPath(); c.arc(x + 200 + 22, y + 650, 52 * e(2), 0, 2 * PI); c.fill(); });
    c.fillStyle = INK; c.beginPath(); c.moveTo(x + 188, y + 628); c.lineTo(x + 222, y + 650); c.lineTo(x + 188, y + 672); c.fill();
    ['01  Overlay', '02  Staircase', '03  Tracking'].forEach((s, i) => { T(c, s, x + 30 + i * 24 * e(3 + i), y + 750 + i * 34, 18); });
    c.restore();
  }
  if (k === 4) {   // 网页
    const x = 210, y = 140, w = 1500, h = 840;
    shadowBox(c, x, y, w, h, WH, 14);
    c.save(); c.beginPath(); c.roundRect(x, y, w, h, 14); c.clip();
    c.fillStyle = '#D9D5CC'; c.fillRect(x, y, w, 46); [0, 1, 2].forEach(i => { c.fillStyle = [MG, YE, CY][i]; c.beginPath(); c.arc(x + 28 + i * 24, y + 23, 7, 0, 2 * PI); c.fill(); });
    c.fillStyle = INK; c.globalAlpha = 0.1; for (let i = 1; i < 12; i++) c.fillRect(x + i * 125, y + 46, 1, h); c.globalAlpha = 1;
    ['WORK', 'TYPE', 'ARCHIVE', 'CONTACT'].forEach((s, i) => T(c, s, x + 760 + i * 170, y + 100, 18, { ls: 6 }));
    T(c, 'NWT', x + 50, y + 104, 30);
    mult(c, () => { c.fillStyle = MG; c.fillRect(x + 760 + 300 * (1 - e(0)), y + 170, 560, 420); c.fillStyle = YE; c.beginPath(); c.arc(x + 1100, y + 640, 240 * e(1), 0, 2 * PI); c.fill(); });
    T(c, 'NEW', x + 50, y + 380, 260, { ls: -10 });
    ['W', 'A', 'V', 'E'].forEach((ch, i) => T(c, ch, x + 470 + i * 200, y + 560 + i * 40 + hop(f, t0 + 4 + i * 2, 22), 220));
    c.fillStyle = INK; c.fillRect(x + 50, y + 700, 220, 64); T(c, 'ENTER →', x + 76, y + 742, 22, { color: WH, ls: 4 });
    c.restore();
  }
  if (k === 5) {   // 票
    const x = 310, y = 300, w = 1300, h = 480; shadowBox(c, x, y, w, h);
    c.save(); clipRect(c, x, y, w, h);
    mult(c, () => { c.fillStyle = CY; c.fillRect(x, y + 300 - 240 * e(0), 1000, 60); c.fillStyle = MG; c.fillRect(x + 640, y, 360 * e(1), h); });
    ['0', '7', '.', '2', '1'].forEach((ch, i) => T(c, ch, x + 50 + i * 120, y + 230 + i * 26, 200));
    T(c, 'NEW WAVE NIGHT', x + 50, y + 420, 34, { ls: 8 + 10 * e(2) });
    T(c, 'DOORS 20:00 · HALL 3', x + 50, y + 455, 16, { fam: 'Silk', w: 400 });
    c.setLineDash([6, 8]); c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 1030, y); c.lineTo(x + 1030, y + h); c.stroke(); c.setLineDash([]);
    for (let i = 0; i < 34; i++) { c.fillStyle = INK; c.fillRect(x + 1080 + i * 5.5, y + 60, (i * 7 % 3) + 1.5, 240); }
    T(c, 'Nº 0721', x + 1080, y + 360, 30); T(c, 'ADMIT ONE', x + 1080, y + 400, 16, { ls: 4 });
    c.restore();
  }
}
function S6(c, f) {
  const L = TL.layouts;
  let k = 0; for (let i = 0; i < L.length; i++) if (f >= L[i] - 8) k = i;
  const tp = k > 0 ? prog(f, L[k] - 8, L[k] + 8) : 1;
  if (tp < 1) {
    const dirs = [[-1, 0], [0, -1], [1, 0], [0, 1], [-1, 0], [0, -1]], d = dirs[k], e = ease.inOut3(tp);
    c.save(); c.translate(d[0] * W * e, d[1] * H * e); useLayout(c, k - 1, f, L[k - 1]); c.restore();
    c.save(); c.translate(-d[0] * W * (1 - e), -d[1] * H * (1 - e)); useLayout(c, k, f, L[k]); seam(c, d, 1 - e); c.restore();
  } else useLayout(c, k, f, L[k]);
  const hd = k;
  header(c, f, TL.s6 + 4, '06', '用起来', 'IN USE');
  T(c, D(USE[hd][0] + '  ' + USE[hd][1], f, L[hd] - 2, 0.7, 'type'), 1760, 96, 24, { fam: 'NotoSC', align: 'right', ls: 4 });
  T(c, String(hd + 1).padStart(2, '0') + ' / 06', 1760, 130, 18, { align: 'right', color: '#55524C', ls: 4 });
}
// 推进来的那一张，领头的边上带一条品红胶片
function seam(c, d, k) {
  mult(c, () => {
    c.fillStyle = MG;
    if (d[0] < 0) c.fillRect(W - 10, 0, 90, H); if (d[0] > 0) c.fillRect(-80, 0, 90, H);
    if (d[1] < 0) c.fillRect(0, H - 10, W, 90); if (d[1] > 0) c.fillRect(0, -80, W, 90);
  });
}

// ============ 07 收束 ============
const OFF = [0, 1, 2].map(() => { const k = document.createElement('canvas'); k.width = W; k.height = H; return k; });
// 印版没对准：三个通道各偏一点，再用加法合回来；amp = 0 时和原图一样
function plates(c, src, amp, ang) {
  if (Math.abs(amp) < 0.3) { c.drawImage(src, 0, 0); return; }
  const t = OFF[1], tc = t.getContext('2d');
  c.save(); c.fillStyle = '#000'; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'lighter';
  [['#FF0000', 0], ['#00FF00', 2.1], ['#0000FF', 4.2]].forEach(([col, a]) => {
    tc.globalCompositeOperation = 'source-over'; tc.fillStyle = BG; tc.fillRect(0, 0, W, H);
    tc.drawImage(src, amp * Math.cos(ang + a), amp * Math.sin(ang + a));
    tc.globalCompositeOperation = 'multiply'; tc.fillStyle = col; tc.fillRect(0, 0, W, H);
    c.drawImage(t, 0, 0);
  });
  c.restore();
}
function S7(c, f) {
  const o = OFF[0].getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0);
  // 最后的余音里，镜头很慢地推近一点（不停住）
  const z = 1 + 0.035 * ease.inOut2(prog(f, TL.snap + 10, TL.end + 20));
  if (z > 1) { paper(o); o.translate(960, 560); o.scale(z, z); o.translate(-960, -560); }
  S7comp(o, f); o.setTransform(1, 0, 0, 1, 0, 0);
  let amp = 9 + 3 * Math.sin(f / 4);
  if (f >= TL.slam) amp += 34 * Math.exp(-(f - TL.slam) / 9);
  if (f >= TL.register) amp *= 1 - sp(f, TL.register, 2.6, 0.35);
  if (f >= TL.snap) amp = 16 * Math.exp(-(f - TL.snap) / 7) * Math.cos((f - TL.snap) * 0.9);
  plates(c, OFF[0], amp, f * 0.05);
  // 品红条砸下：一圈网点从署名那里冲出去
  if (f >= TL.snap) {
    const t = f - TL.snap, R = t * 46, fade = Math.exp(-t / 26);
    mult(c, () => dots(c, 0, 0, W, H, 30, (u, v, px, py) => { const d = Math.hypot(px - 1546, py - 1040); return fade * Math.exp(-(((d - R) / 140) ** 2)); }, 45, MG, 0.7));
  }
}
function S7comp(c, f) {
  const e = (t0, fr = 2.0, z = 0.55) => 1 - sp(f, t0, fr, z), s0 = TL.s7;
  const slamP = prog(f, TL.slam - 8, TL.slam), newS = f < TL.slam ? lerp(2.6, 1, ease.in3(slamP)) : squash(f, TL.slam, 0.1, 3, 3, 0.35);
  const shake = f >= TL.snap ? Math.exp(-(f - TL.snap) / 6) * Math.sin((f - TL.snap) * 1.6) * 10 : 0;
  c.save(); c.translate(0, shake);
  coverComp(c, f, {
    cS: 1 + 0.04 * kick(f, 37, 39, 1), c2x: -900 * e(s0 + 16) + 18 * kick(f, 37.5, 39, 1),
    t0: s0 + 20, mx: 1500 * e(s0 + 4) + 16 * kick(f, 37, 39, 1) + (f >= TL.snap ? -14 * (1 - sp(f, TL.snap, 3, 0.4)) : 0), my: 0, cx: 0, cy: -1100 * e(s0 + 8), yx: 1200 * e(s0 + 12), yy: 400 * e(s0 + 12),
    spx: 600 * e(s0 + 20), spy: -600 * e(s0 + 20), spR: 0.6 * e(s0 + 20),
    dPh: 0.1 * Math.sin(f / 18), dG: ease.out3(prog(f, s0 + 10, s0 + 40)), lPh: 0.06 * Math.sin(f / 22), lFlow: f * 0.5, lA: ease.out2(prog(f, s0 + 6, s0 + 20)),
    newA: f < TL.slam - 8 ? 0 : clamp(slamP * 3), newS, newLs: -14,
    wave: k => (f < TL.wave + k * 7 ? -600 * Math.pow(1 - clamp((f - TL.wave - k * 7 + 10) / 10), 2) : 0) + hop(f, TL.snap - 14 + 0, 40),
    waveA: k => f >= TL.wave + k * 7 - 10 ? 1 : 0, waveSq: k => squash(f, TL.wave + k * 7, 0.2, 3, 3.4, 0.3) * hopSq(f, TL.snap - 14),
    tread: k => sp(f, TL.wave + k * 7, 3, 0.5),
    regX: f < TL.register ? 60 + 10 * Math.sin(f / 5) : 6 + regWob(f, TL.register, 30) * 0.5, regY: f < TL.register ? -30 : 6,
    crossR: f * 0.02, arX: 0, hPh: f * 0.4,
    stepText: ['叠  OVERLAY', '台阶  STAIRS', '字距  TRACKING', '网格  GRID', '网点  HALFTONE', ''], stepT0: TL.card,
    bar: false, dotLine: ease.out3(prog(f, s0 + 10, s0 + 30)),
  });
  // 署名条：从右边滑进来，最后一下品红条砸在下面
  const bx = 1286 + 700 * (1 - sp(f, TL.card + 10, 2.4, 0.55));
  c.fillStyle = INK; c.fillRect(bx, 966, 520, 62);
  T(c, D('观默', f, TL.card + 14, 2.5, 'title'), bx + 20, 1012, 36, { fam: 'NotoSC', w: 900, color: BG });
  T(c, D('@guanmo_ai', f, TL.card + 20, 1, 'small'), bx + 120, 1008, 24, { color: BG, ls: 2 });
  T(c, D('NEW WAVE · 1972—1986', f, TL.card + 26, 1, 'small'), bx + 300, 1006, 14, { fam: 'Silk', w: 400, color: BG });
  if (f >= TL.snap - 6) { const k = f < TL.snap ? ease.in3(prog(f, TL.snap - 6, TL.snap)) : squash(f, TL.snap, 0.3, 3, 3, 0.35); c.fillStyle = MG; c.fillRect(bx, 1034, 520 * k, 14); }
  c.restore();
}

// ============ 转场与总装 ============
function iris(c, f) {   // 00 → 01：冲进青色圆片
  const p = prog(f, TL.iris[0], TL.iris[1]), s = Math.exp(Math.log(16) * ease.in3(p));
  const cy = 560 + 90 * (1 - sp(f, -4, 1.5, 0.5)), cx = 1440, R = 250 * s;
  c.save(); c.translate(cx, cy); c.scale(s, s); c.translate(-cx, -cy); S0(c, f); c.restore();
  c.save(); c.beginPath(); c.arc(cx, cy, R, 0, 2 * PI); c.clip(); S1(c, f);
  mult(c, () => { c.globalAlpha = 1 - ease.out2(prog(f, TL.iris[0] + 12, TL.iris[1] + 2)); c.fillStyle = CY; c.fillRect(0, 0, W, H); });
  c.restore();
}
function push(c, f, A, B, f0, f1, d) {
  const e = ease.inOut3(prog(f, f0, f1));
  c.save(); c.translate(d[0] * W * e, d[1] * H * e); A(c, f); c.restore();
  c.save(); c.translate(-d[0] * W * (1 - e), -d[1] * H * (1 - e));
  B(c, f); seam(c, d, 1 - e); c.restore();
}
function zoomO(c, f) {   // 02 → 03：钻进 O 的字怀
  const o = oCounter(c), p = prog(f, TL.zoomO[0], TL.zoomO[1]), s = Math.exp(Math.log(26) * ease.in3(p)), m = ease.inOut2(p);
  const ax = lerp(o.x, 960, m), ay = lerp(o.y, 540, m);
  c.save(); c.translate(ax, ay); c.scale(s, s); c.translate(-o.x, -o.y); S2(c, f); c.restore();
  c.save(); c.beginPath(); c.ellipse(ax, ay, o.rx * s, o.ry * s, 0, 0, 2 * PI); c.clip();
  const k = lerp(0.35, 1, ease.out3(prog(f, TL.zoomO[0] + 16, TL.zoomO[1] + 14)));
  c.translate(960, 540); c.scale(k, k); c.translate(-960, -540); S3(c, f); c.restore();
}
function S3z(c, f) {   // 03 开头几帧：还在从字怀里推出来的余势
  const k = lerp(0.35, 1, ease.out3(prog(f, TL.zoomO[0] + 16, TL.zoomO[1] + 14)));
  paper(c); c.save(); c.translate(960, 540); c.scale(k, k); c.translate(-960, -540); S3(c, f); c.restore();
}
function linesWipe(c, f) {   // 05 → 06：品红线网扫过去
  const [a, b] = TL.lines, mid = (a + b) / 2;
  if (f < mid) S5(c, f); else S6(c, f);
  const step = 36;
  mult(c, () => { c.fillStyle = MG;
    for (let y = 0; y < H; y += step) { const d = y / H * 0.35, t = f < mid ? ease.in2(clamp((f - a) / (mid - a) * 1.35 - d)) : 1 - ease.out2(clamp((f - mid) / (b - mid) * 1.35 - d));
      if (t > 0) c.fillRect(0, y, W, step * t + (t > 0.98 ? 1 : 0)); } });
}
function render(c, f) {
  c.save();
  if (f < TL.iris[0]) S0(c, f);
  else if (f < TL.iris[1] + 4) iris(c, f);
  else if (f < TL.push1[0]) S1(c, f);
  else if (f < TL.push1[1]) push(c, f, S1, S2, TL.push1[0], TL.push1[1], [-1, 0]);
  else if (f < TL.zoomO[0]) S2(c, f);
  else if (f < TL.zoomO[1]) zoomO(c, f);
  else if (f < TL.toGrid[1]) S3z(c, f);
  else if (f < TL.s5) S4(c, f);
  else if (f < TL.lines[0]) S5(c, f);
  else if (f < TL.lines[1]) linesWipe(c, f);
  else if (f < TL.push7[0]) S6(c, f);
  else if (f < TL.push7[1]) push(c, f, S6, S7, TL.push7[0], TL.push7[1], [0, -1]);
  else S7(c, f);
  c.restore();
}
// 哪些帧要运动模糊（快速的甩、推、冲）：[起, 止, 子帧数, 快门（帧）]
const BLUR = [[TL.iris[0] + 18, TL.iris[1] + 4, 14, 0.9], [TL.films[0], TL.films[2] + 16, 10, 0.8], [TL.push1[0] + 2, TL.push1[1] - 2, 16, 0.9],
  [TL.stairs0 - 10, TL.stairs0 + 70, 3, 0.7], [TL.zoomO[0] + 18, TL.zoomO[1], 14, 0.9], [TL.toGrid[0] + 10, TL.toGrid[1], 4, 0.8],
  [TL.break, TL.break + 24, 3, 0.7], [TL.break2, TL.break2 + 24, 3, 0.7], [TL.s5, TL.s5 + 18, 10, 0.9],
  ...TL.layouts.slice(1).map(t => [t - 7, t + 7, 16, 0.9]), [TL.push7[0] + 2, TL.push7[1] - 2, 16, 0.9], [TL.s7, TL.s7 + 24, 8, 0.8], [TL.slam - 8, TL.slam + 2, 10, 0.9], [TL.wave - 10, TL.wave + 22, 3, 0.7]];
const blurAt = f => { for (const b of BLUR) if (f >= b[0] && f < b[1]) return b; return null; };
