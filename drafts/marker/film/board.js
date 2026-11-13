// 马克笔 · 整张纸上的每一笔（纸面坐标 = 片尾全景时的屏幕坐标，1920×1080）和它们的时间。
// 144 BPM：一拍 = 25 帧，第一小节的重拍在第 50 帧（0—50 是倒放开场）。
const BOARD = (() => {
  const { dense } = INK;
  const BEAT = 25, B = n => 50 + BEAT * n, nb = t => 50 + BEAT * Math.ceil((t - 50) / BEAT - 1e-6);
  const COL = { blue: '#3B74E3', orange: '#F0642E', black: '#24262B', glass: '#2D323B', gray: '#8E949E', pencil: '#4F82D8', white: '#FFFDF7', liner: '#15161A' };
  const all = [];            // 全部笔画（按开始时间排）
  const R = INK.rng(5);

  // —— 车（原创造型；几何沿用候选图 car.js）——
  const CX = 1060, CY = 778, CS = 0.95, WF = -345, WR = 345, R0 = 100;
  const T = p => [CX + p[0] * CS, CY + p[1] * CS];
  const arch = cx => { const o = []; for (let i = 0; i <= 18; i++) { const a = -0.36 + (Math.PI + 0.72) * i / 18; o.push([cx + 124 * Math.cos(a), -90 - 124 * Math.sin(a)]); } return o; };
  const bodyPts = [[-524, -44], [-554, -92], [-552, -146], [-526, -176], [-440, -204], [-345, -224], [-220, -238], [-140, -250],
    [-40, -308], [40, -338], [190, -348], [300, -334], [420, -294], [520, -254], [576, -238], [584, -222], [574, -170], [562, -92], [550, -46], [480, -44],
    ...arch(WR), ...arch(WF), [-480, -44]];
  const greenhouse = [[-128, -258], [-40, -304], [40, -330], [190, -340], [295, -326], [404, -284], [360, -266], [200, -261], [40, -259], [-128, -258]];
  const path2d = (pts, close = true) => { const P = new Path2D(); pts.forEach((p, i) => { const q = T(p); i ? P.lineTo(q[0], q[1]) : P.moveTo(q[0], q[1]); }); if (close) P.closePath(); return P; };
  const BODY = (() => { const P = new Path2D(); dense(bodyPts.map(T), 6).forEach((q, i) => i ? P.lineTo(q.x, q.y) : P.moveTo(q.x, q.y)); P.closePath(); return P; })();
  const GLASS = path2d(greenhouse);
  const OUTSIDE = (() => { const P = new Path2D(); P.rect(-3000, -3000, 8000, 8000); P.addPath(BODY); return P; })();
  const wheelC = cx => T([cx, -100]);
  const circle = (c, r) => { const P = new Path2D(); P.arc(c[0], c[1], r, 0, Math.PI * 2); return P; };
  const ell = (cx, cy, rx, ry, a0, a1, n = 40) => { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; };

  // 车的组变换：轮子转、车身一蹲一冲（片尾“活过来”）——每帧是帧号的纯函数，在 film.html 里定义好再塞进来
  const G = { car: null, wheelF: null, wheelR: null };

  // —— 记一笔 ——
  // kind: marker | pencil | liner | white
  function add(kind, pts, o) {
    const S = Object.assign({ kind, P: dense(pts, kind === 'marker' ? 3 : 2, !!(o && o.poly)), prof: 'press', seed: all.length * 7 + 1 }, o);
    all.push(S); return S;
  }
  // 顺序排时间：每一笔 = 停顿 + 画 + 抬笔移到下一笔
  function seq(list, t, hop = 1.5) { for (const S of list) { S.t0 = t; t += (S.dwell || 0) + S.dur + hop; } return t; }

  // ============ 1 · 标题 MARKER：黑色扁头笔写出来（扁头 30°，横粗竖细是自己出来的）============
  const title = [];
  { const ox = 76, oy = 800, h = 92, k = h / 100, nib = -0.62; let x = ox;
    const L = (pts) => pts.map(p => [x + p[0] * k, oy + p[1] * k]);
    const st = (pts, dur = 5, prof = 'press') => title.push(add('marker', L(pts), { w: 22, th: 5.5, nib, color: COL.black, alpha: 0.95, dens: 2.6, dur, prof, tool: 'black', poly: true }));
    st([[0, 100], [6, 0], [36, 74], [66, 0], [72, 100]], 9); x += 92;                 // M
    st([[0, 100], [34, 0], [68, 100]], 6); st([[14, 64], [56, 64]], 3, 'flick'); x += 84; // A
    st([[0, 100], [0, 0]], 4); st([[0, 2], [38, 0], [58, 22], [40, 48], [6, 50], [62, 100]], 8); x += 80; // R
    st([[0, 0], [0, 100]], 4); st([[62, 0], [6, 56], [64, 100]], 6); x += 80;          // K
    st([[62, 2], [0, 0], [0, 100], [64, 100]], 7); st([[2, 50], [50, 50]], 3, 'flick'); x += 82; // E
    st([[0, 100], [0, 0]], 4); st([[0, 2], [38, 0], [58, 22], [40, 48], [6, 50], [62, 100]], 8, 'flick');  // R
  }
  let t = seq(title, B(0) + 2, 1.6);
  const T_TITLE_END = t;

  // ============ 2 · 蓝铅笔结构线 ============
  const pencil = [];
  const pc = (pts, dur) => pencil.push(add('pencil', pts.map(T), { w: 2.0, color: COL.pencil, alpha: 0.5, dur, prof: 'flick', tool: 'pencil' }));
  pc([[-760, 0], [780, 0]], 5);
  pc([[-700, -100], [720, -100]], 4);
  for (const cx of [WF, WR]) pc(ell(cx, -100, R0 + 6, R0 + 6, -0.4, Math.PI * 2 + 0.2, 50), 6);
  pc(bodyPts.slice(0, 21), 11);
  pc([[-640, -380], [680, -220]], 4);
  t = seq(pencil, t - 4, 1.2);
  const T_PENCIL_END = t;

  // ============ 3 · 蓝色底：大扁头一来一回地扫（之字形，所以两笔之间只挪一点点）============
  const sweeps = [];
  { const n = 18;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1), bx = -560 + u * 1300 + (R() - .5) * 24;
      const h0 = 130 + 285 * Math.pow(Math.sin(Math.PI * (0.12 + u * 0.82)), 0.7) + (R() - .5) * 50;
      const lo = [bx - 34, 6 - R() * 30], hi = [bx + 70 + h0 * 0.3, -46 - h0];
      const [a, b] = i % 2 ? [hi, lo] : [lo, hi];
      sweeps.push(add('marker', [T(a), T([(a[0] + b[0]) / 2 + 8, (a[1] + b[1]) / 2]), T(b)], { w: 64, th: 17, nib: 0.25, color: COL.blue, alpha: 0.5, dur: 4.6, prof: i % 3 === 2 ? 'flick' : 'press', tool: 'blue', clip: OUTSIDE, clipRule: 'evenodd', clipGroup: 'car' }));
    }
  }
  t = seq(sweeps, nb(t + 1), 0.9);
  const T_SWEEP_END = t;

  // ============ 4 · 规则 ①：试色条——同一支笔叠 1 / 2 / 3 遍 ============
  const SW = { x: 1360, y: 172, w: 128, gap: 46, dy: 56 };     // 三格：×1 ×2 ×3
  const swatch = (row, color, tool, alpha) => {
    const out = [];
    for (let c = 0; c < 3; c++) for (let k = 0; k <= c; k++) {
      const x0 = SW.x + c * (SW.w + SW.gap), y = SW.y + row * SW.dy + (k - c / 2) * 1.5;
      const pts = k % 2 ? [[x0 + SW.w, y], [x0, y + 1]] : [[x0, y], [x0 + SW.w, y - 1]];
      out.push(add('marker', pts, { w: 40, th: 12, nib: 1.45, color, alpha, dur: 4.2, prof: 'press', tool, swatch: [row, c] }));
    }
    return out;
  };
  const swBlue = swatch(0, COL.blue, 'blue', 0.5);
  const T_RULE1 = nb(t);
  t = seq(swBlue, T_RULE1 + 2, 2.2);

  // ============ 5 · 车身三层：同一支橙色笔，浅 → 中 → 深 ============
  // 第一遍：整个车身一行行铺，肩线下面空一道（白是留出来的）
  const pass1 = [];
  { const rows = []; for (let yy = -352; yy <= -30; yy += 21) rows.push(yy);
    rows.forEach((yy, i) => {
      if (yy > -206 && yy < -180) return;
      const l = [-600, yy + 22], m = [0, yy + 2], r = [640, yy - 16];
      const pts = (i % 2 ? [r, m, l] : [l, m, r]).map(T);
      pass1.push(add('marker', pts, { w: 34, th: 10, nib: 1.35, color: COL.orange, alpha: 0.62, dur: 4.4, prof: 'press', tool: 'orange', clip: BODY, group: 'car' }));
    });
  }
  const T_PASS1 = nb(t + 6);
  t = seq(pass1, T_PASS1, 1.1);
  // 第二遍：肩线以下 + 车尾；其中一笔落笔前停 16 帧（规则 ③：停得越久，墨越深）
  const pass2 = [];
  { const rows = []; for (let yy = -168; yy <= -40; yy += 21) rows.push(yy);
    rows.forEach((yy, i) => { const l = [-560, yy + 10], r = [600, yy - 10]; pass2.push(add('marker', (i % 2 ? [r, l] : [l, r]).map(T), { w: 32, th: 10, nib: 1.35, color: COL.orange, alpha: 0.6, dur: 4.6, prof: 'press', tool: 'orange', clip: BODY, group: 'car' })); });
    for (let i = 0; i < 5; i++) pass2.push(add('marker', [T([630, -300 + i * 36]), T([300, -190 + i * 32])], { w: 32, th: 10, nib: 1.35, color: COL.orange, alpha: 0.55, dur: 4, prof: 'press', tool: 'orange', clip: BODY, group: 'car' }));
  }
  const dwellStroke = add('marker', [T([-500, -138]), T([-150, -126]), T([260, -116])], { w: 34, th: 10, nib: 1.35, color: COL.orange, dur: 16, dwell: 24, prof: 'press', tool: 'orange', clip: BODY, group: 'car', rule3: true, alpha: 0.72, dens: 1.3 });
  pass2.splice(4, 0, dwellStroke);
  t = seq(pass2, t + 3, 1.2);
  const T_RULE3 = dwellStroke.t0;
  // 第三遍：最深的只放在底边、轮拱、尾灯下
  const pass3 = [];
  for (let i = 0; i < 3; i++) pass3.push(add('marker', (i % 2 ? [[600, -56 - i * 14], [-560, -52 - i * 15]] : [[-560, -52 - i * 15], [600, -56 - i * 14]]).map(T), { w: 24, th: 8, nib: 1.35, color: COL.orange, alpha: 0.62, dur: 4, prof: 'press', tool: 'orange', clip: BODY, group: 'car' }));
  for (const cx of [WF, WR]) pass3.push(add('marker', ell(cx, -90, 140, 140, Math.PI + 0.35, Math.PI * 2 - 0.35, 30).map(T), { w: 26, th: 8, nib: 1.35, color: COL.orange, alpha: 0.6, dur: 5, prof: 'press', tool: 'orange', clip: BODY, group: 'car' }));
  pass3.push(add('marker', [[400, -282], [490, -258], [580, -230]].map(T), { w: 20, th: 7, nib: 1.35, color: COL.orange, alpha: 0.6, dur: 3, tool: 'orange', clip: BODY, group: 'car' }));
  const swOrange = swatch(1, COL.orange, 'orange', 0.6);
  t = seq(pass3, t + 2, 1.2);
  t = seq(swOrange, t + 3, 1.8);
  const T_DARK_END = t;

  // ============ 6 · 玻璃、轮胎、地面影子：深灰 / 黑 ============
  const blk = [];
  for (let i = 0; i < 11; i++) { if (i === 5 || i === 8) continue; const xx = -150 + i * 48; const a = [xx - 60, -240], b = [xx + 70, -360];
    blk.push(add('marker', (i % 2 ? [b, a] : [a, b]).map(T), { w: 50, th: 14, nib: 0.3, color: COL.glass, alpha: 0.78, dur: 3, prof: 'press', tool: 'black', clip: GLASS, group: 'car' })); }
  blk.push(add('marker', [[-130, -266], [380, -274]].map(T), { w: 16, th: 5, nib: 1.4, color: COL.liner, alpha: 0.7, dur: 4, tool: 'black', clip: GLASS, group: 'car' }));
  for (const [cx, gname] of [[WF, 'wheelF'], [WR, 'wheelR']]) {
    const c = wheelC(cx), C = circle(c, R0 * CS), RIM = circle(c, 72 * CS);
    for (let i = 0; i < 5; i++) blk.push(add('marker', (i % 2 ? [[cx + 130, -150 + i * 38], [cx - 130, -175 + i * 38]] : [[cx - 130, -175 + i * 38], [cx + 130, -150 + i * 38]]).map(T), { w: 42, th: 12, nib: 1.4, color: COL.black, alpha: 0.9, dens: 1.8, dur: 2.2, tool: 'black', clip: C, group: gname }));
    for (let i = 0; i < 3; i++) blk.push(add('marker', (i % 2 ? [[cx + 90, -130 + i * 44], [cx - 90, -150 + i * 44]] : [[cx - 90, -150 + i * 44], [cx + 90, -130 + i * 44]]).map(T), { w: 46, th: 13, nib: 1.4, color: i < 1 ? '#C3C8CF' : '#7D838C', alpha: 0.8, dur: 2, tool: 'black', clip: RIM, group: gname, taper: 0.2 }));
  }
  for (let i = 0; i < 3; i++) blk.push(add('marker', (i % 2 ? [[660 - i * 50, -2 + i * 6], [-620 + i * 40, 4 + i * 6]] : [[-620 + i * 40, 4 + i * 6], [660 - i * 50, -2 + i * 6]]).map(T), { w: 18, th: 6, nib: 1.45, color: COL.black, alpha: 0.85, dur: 4, prof: 'flick', tool: 'black', shadow: true }));
  t = seq(blk, nb(t + 4), 0.8);
  const T_BLK_END = t;

  // ============ 7 · 针管笔勾线：一笔绕车身一圈，镜头跟着笔尖跑 ============
  const lin = [];
  const outline = dense(bodyPts.map(T), 6).map(q => [q.x, q.y]);
  lin.push(add('liner', outline, { w: 2.6, color: COL.liner, dur: 36, prof: 'press', tool: 'liner', group: 'car', heavy: true }));
  for (const pts of [greenhouse, [[-546, -152], [-345, -198], [-100, -214], [200, -216], [420, -214], [578, -204]], [[-500, -84], [-300, -98], [-100, -104], [120, -106], [218, -100]], [[-124, -256], [-118, -180], [-112, -90], [-104, -54]], [[175, -261], [180, -180], [190, -112], [210, -78]], [[182, -342], [176, -262]]])
    lin.push(add('liner', pts.map(T), { w: 1.8, color: COL.liner, dur: 3.6, prof: 'flick', tool: 'liner', group: 'car' }));
  for (const [cx, gname] of [[WF, 'wheelF'], [WR, 'wheelR']]) {
    lin.push(add('liner', ell(cx, -100, 72, 72, 0, Math.PI * 2, 50).map(T), { w: 1.8, color: COL.liner, dur: 4, tool: 'liner', group: gname }));
    { const sp = []; for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + 0.3; sp.push([cx + Math.cos(a) * 14, -100 + Math.sin(a) * 14], [cx + Math.cos(a + .25) * 68, -100 + Math.sin(a + .25) * 68]); } sp.push(sp[0]);
      lin.push(add('liner', sp.map(T), { w: 3.6, color: '#24262B', dur: 5, prof: 'even', tool: 'liner', group: gname, poly: true })); }
  }
  lin.push(add('liner', [[-549, -150], [-500, -168], [-430, -182]].map(T), { w: 4, color: COL.liner, dur: 3, tool: 'liner', group: 'car' }));
  lin.push(add('liner', [[566, -230], [582, -218]].map(T), { w: 6, color: '#D81E2C', dur: 2, tool: 'liner', group: 'car', mode: 'source-over' }));
  t = seq(lin, t + 4, 1.1);
  const T_LINE_END = t;

  // ============ 8 · 最后一笔：白 ============
  const wh = [];
  const W = (pts, w, a, dur = 4) => wh.push(add('white', pts.map(T), { w, color: COL.white, alpha: a, dur, prof: 'flick', tool: 'white', group: 'car' }));
  W([[-520, -178], [-400, -204], [-200, -232]], 3.2, .95);
  W([[-40, -314], [60, -340], [200, -350]], 2.8, .9);
  W([[-480, -178], [-150, -208], [200, -212], [470, -208]], 2.2, .8, 6);
  W([[60, -268], [128, -334]], 7, .55, 3); W([[100, -268], [154, -322]], 3, .5, 3);
  const dots = [[-524, -178, 6], [-200, -232, 4.5], [60, -342, 4], [-460, -180, 3.2]];
  const T_WHITE = nb(t + 4);
  t = seq(wh, T_WHITE, 1.6);
  const WHEEL_HL = [WF, WR].map(cx => ell(cx, -100, 64, 64, -2.4, -1.4, 12));
  // 白点：一个个“叮”出来，落在八分音符上
  const DOTS = dots.map((d, i) => ({ p: T(d), r: d[2] * CS, t: T_WHITE + 2 * BEAT + i * BEAT / 2 }));
  for (let i = 0; i < 2; i++) { const g = i ? 'wheelR' : 'wheelF'; wh.push(add('white', WHEEL_HL[i].map(T), { w: 3, color: COL.white, alpha: .8, dur: 3, prof: 'flick', tool: 'white', group: g, t0: T_WHITE + BEAT + 10 + i * 6 })); }

  // ============ 9 · 活过来：轮子转、车身一蹲一冲，背后甩出速度线 ============
  const speed = [];
  for (let i = 0; i < 11; i++) { const y = -40 - i * 30 + (R() - .5) * 12, x1 = -600 - (i % 3) * 30, x0 = x1 - 150 - R() * 110;
    speed.push(add('marker', [T([x1, y]), T([x0, y + 4])], { w: 16, th: 5, nib: 1.45, color: i % 2 ? COL.blue : COL.black, alpha: 0.8, dur: 3.2, prof: 'flick', tool: 'black', taper: 0.9 })); }
  const T_REV = 50 + 4 * BEAT * Math.ceil((T_WHITE + 4 * BEAT - 50) / (4 * BEAT) - 1e-6);   // 落在小节线上
  t = seq(speed, T_REV + BEAT / 2, 1.5);
  const T_SETTLE = T_REV + 2 * BEAT;

  all.sort((a, b) => a.t0 - b.t0);
  all.forEach((S, i) => { S.idx = i; S.end = S.t0 + (S.dwell || 0) + S.dur; });
  const T_DRAW_END = Math.max(...all.map(S => S.end));

  return { all, COL, BEAT, B, CX, CY, CS, WF, WR, R0, T, wheelC, BODY, GLASS, G, SW, DOTS, title, sweeps, pass1, pass2, pass3, dwellStroke, blk, lin, wh, speed,
    marks: { T_TITLE_END, T_PENCIL_END, T_SWEEP_END, T_RULE1, T_PASS1, T_RULE3, T_DARK_END, T_BLK_END, T_LINE_END, T_WHITE, T_REV, T_SETTLE, T_DRAW_END } };
})();
