// 马克笔 v2 · 一张桌面上的所有笔画（世界坐标）和时间。片尾全景 = 封面：左边一张纸上的车，右上一个网页，右下一部手机，背后三道巨笔。
// 144 BPM：一拍 = 25 帧，一小节 = 100 帧，第一小节的重拍在第 50 帧。
const BOARD = (() => {
  const { dense } = INK;
  const BEAT = 25, BAR = 100, B = n => 50 + BEAT * n;
  const COL = { blue: '#3B74E3', orange: '#F0642E', black: '#24262B', glass: '#2D323B', pencil: '#4F82D8', white: '#FFFDF7', liner: '#15161A',
    teal: '#13A58B', violet: '#7457E0', yellow: '#F2B01E', red: '#E8473C', sky: '#3FA7E8' };
  const all = [];
  const R = INK.rng(5);
  const WORLD = { W: 4600, H: 2588 };
  // —— 布局（世界坐标）——
  const PAPER = { cx: 1330, cy: 1470, w: 2140, h: 1180, rot: -0.03 };
  const BROW = { x: 2560, y: 230, w: 1820, h: 1170, chrome: 64 };
  const PHONE = { x: 3860, y: 1180, w: 560, h: 1220, inset: 26 };
  PHONE.sx = PHONE.x + PHONE.inset; PHONE.sy = PHONE.y + PHONE.inset; PHONE.sw = PHONE.w - 2 * PHONE.inset; PHONE.sh = PHONE.h - 2 * PHONE.inset;
  const rect = (x, y, w, h, r = 0) => { const P = new Path2D(); if (r) P.roundRect(x, y, w, h, r); else P.rect(x, y, w, h); return P; };
  const WEBCLIP = rect(BROW.x, BROW.y + BROW.chrome, BROW.w, BROW.h - BROW.chrome);
  const PHCLIP = rect(PHONE.sx, PHONE.sy, PHONE.sw, PHONE.sh, 56);
  const PAPERCLIP = (() => { const P = new Path2D(), c = Math.cos(PAPER.rot), s = Math.sin(PAPER.rot); const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [PAPER.cx + c * a * PAPER.w / 2 - s * b * PAPER.h / 2, PAPER.cy + s * a * PAPER.w / 2 + c * b * PAPER.h / 2]); pts.forEach((p, i) => i ? P.lineTo(p[0], p[1]) : P.moveTo(p[0], p[1])); P.closePath(); return P; })();

  // 组变换（每帧是帧号的纯函数，film.html 里填）
  const G = {};
  const grp = name => f => G[name](f);

  function add(kind, pts, o) {
    const S = Object.assign({ kind, P: dense(pts, kind === 'marker' ? 3 : 2, !!(o && o.poly)), prof: 'press', seed: all.length * 7 + 1, layer: 'paper' }, o);
    all.push(S); return S;
  }
  function seq(list, t, hop = 1.5) { for (const S of list) { S.t0 = t; t += (S.dwell || 0) + S.dur + hop; } return t; }
  const ell = (cx, cy, rx, ry, a0, a1, n = 40) => { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; };
  const pathOf = (pts) => { const P = new Path2D(); pts.forEach((p, i) => i ? P.lineTo(p[0], p[1]) : P.moveTo(p[0], p[1])); P.closePath(); return P; };

  // ================= 字：扁头笔写的大写字母（单位字高 100）=================
  const GLYPH = {
    M: [[[0, 100], [6, 0], [36, 74], [66, 0], [72, 100]]], A: [[[0, 100], [34, 0], [68, 100]], [[14, 64], [56, 64]]],
    R: [[[0, 100], [0, 0]], [[0, 2], [38, 0], [58, 22], [40, 48], [6, 50], [62, 100]]], K: [[[0, 0], [0, 100]], [[62, 0], [6, 56], [64, 100]]],
    E: [[[62, 2], [0, 0], [0, 100], [64, 100]], [[2, 50], [50, 50]]], I: [[[10, 0], [10, 100]]], T: [[[0, 2], [70, 0]], [[35, 0], [35, 100]]],
    '0': [ell(34, 50, 32, 50, -Math.PI / 2, Math.PI * 1.5, 30)], '1': [[[8, 22], [34, 0], [34, 100]]], ' ': [] };
  const ADV = { M: 92, A: 84, R: 80, K: 80, E: 82, I: 36, T: 82, '0': 82, '1': 60, ' ': 40 };
  function letters(str, x, y, h, o) {
    const out = []; let cx = x; const k = h / 100;
    for (const ch of str) { for (const g of GLYPH[ch] || []) out.push(add('marker', g.map(p => [cx + p[0] * k, y + p[1] * k]), Object.assign({ w: h * 0.24, th: h * 0.06, nib: -0.62, color: COL.black, alpha: 0.95, dens: 2.6, dur: 3, prof: 'press', poly: ch !== '0' }, o))); cx += ADV[ch] * k; }
    return out;
  }

  // ================= 车（原创造型）=================
  const WF = -345, WR = 345, R0 = 100;
  const arch = cx => { const o = []; for (let i = 0; i <= 18; i++) { const a = -0.36 + (Math.PI + 0.72) * i / 18; o.push([cx + 124 * Math.cos(a), -90 - 124 * Math.sin(a)]); } return o; };
  const bodyPts = [[-524, -44], [-554, -92], [-552, -146], [-526, -176], [-440, -204], [-345, -224], [-220, -238], [-140, -250],
    [-40, -308], [40, -338], [190, -348], [300, -334], [420, -294], [520, -254], [576, -238], [584, -222], [574, -170], [562, -92], [550, -46], [480, -44],
    ...arch(WR), ...arch(WF), [-480, -44]];
  const greenhouse = [[-128, -258], [-40, -304], [40, -330], [190, -340], [295, -326], [404, -284], [360, -266], [200, -261], [40, -259], [-128, -258]];
  // o: {x, y, s, color, t0, rate(帧/笔), hop, G, vclip, layer, tools(画的时候有笔), sweeps, sweepColor, pencil}
  function car(o) {
    const T = p => [o.x + p[0] * o.s, o.y + p[1] * o.s], s = o.s, rate = o.rate, hop = o.hop ?? rate * 0.25;
    const base = { G: o.G, vclip: o.vclip, layer: o.layer };
    const BODY = (() => { const P = new Path2D(); dense(bodyPts.map(T), 6).forEach((q, i) => i ? P.lineTo(q.x, q.y) : P.moveTo(q.x, q.y)); P.closePath(); return P; })();
    const GLASS = pathOf(greenhouse.map(T));
    const OUT = (() => { const P = new Path2D(); P.rect(o.x - 3000, o.y - 3000, 6000, 6000); P.addPath(BODY); return P; })();
    const circ = (c, r) => { const P = new Path2D(); P.arc(c[0], c[1], r, 0, Math.PI * 2); return P; };
    const tool = k => o.tools ? k : undefined;
    const M = (pts, w, th, nib, color, alpha, extra) => add('marker', pts, Object.assign({}, base, { w: w * s, th: th * s, nib, color, alpha, dur: rate, tool: tool(extra && extra.tool || 'orange') }, extra));
    const L = (kind, pts, w, color, extra) => add(kind, pts, Object.assign({}, base, { w, color, dur: rate, tool: tool(kind === 'pencil' ? 'pencil' : kind === 'white' ? 'white' : 'liner') }, extra));
    const groups = [];
    // 结构线
    if (o.pencil !== false) groups.push([L('pencil', [[-760, 0], [780, 0]].map(T), 2.4 * Math.max(1, s), COL.pencil, { alpha: .5, prof: 'flick' }),
      ...[WF, WR].map(cx => L('pencil', ell(cx, -100, R0 + 6, R0 + 6, -0.4, Math.PI * 2 + 0.2, 50).map(T), 2.2 * Math.max(1, s), COL.pencil, { alpha: .5, dur: rate * 1.4 })),
      L('pencil', bodyPts.slice(0, 21).map(T), 2.2 * Math.max(1, s), COL.pencil, { alpha: .5, dur: rate * 2 })]);
    // 底色
    if (o.sweeps !== false) { const sw = []; const n = 12;
      for (let i = 0; i < n; i++) { const u = i / (n - 1), bx = -560 + u * 1300 + (R() - .5) * 24; const h0 = 130 + 285 * Math.pow(Math.sin(Math.PI * (0.12 + u * 0.82)), 0.7) + (R() - .5) * 50;
        const lo = [bx - 34, 6 - R() * 30], hi = [bx + 90 + h0 * 0.3, -46 - h0]; const [a, b] = i % 2 ? [hi, lo] : [lo, hi];
        sw.push(M([T(a), T([(a[0] + b[0]) / 2 + 8, (a[1] + b[1]) / 2]), T(b)], 92, 24, 0.25, o.sweepColor || COL.blue, 0.5, { tool: tool('blue'), clip: OUT, clipRule: 'evenodd', prof: i % 3 === 2 ? 'flick' : 'press' })); }
      groups.push(sw); }
    // 车身三遍
    const p1 = []; { let i = 0; for (let yy = -352; yy <= -30; yy += 30) { if (yy > -210 && yy < -180) continue; const l = [-600, yy + 22], m = [0, yy + 2], r = [640, yy - 16]; p1.push(M((i++ % 2 ? [r, m, l] : [l, m, r]).map(T), 44, 13, 1.35, o.color, 0.62, { clip: BODY })); } }
    groups.push(p1);
    const p2 = []; for (let i = 0; i < 5; i++) { const yy = -168 + i * 30; const l = [-560, yy + 10], r = [600, yy - 10]; p2.push(M((i % 2 ? [r, l] : [l, r]).map(T), 40, 12, 1.35, o.color, 0.6, { clip: BODY })); }
    groups.push(p2);
    const p3 = []; for (let i = 0; i < 2; i++) p3.push(M((i % 2 ? [[600, -60 - i * 16], [-560, -56 - i * 16]] : [[-560, -56 - i * 16], [600, -60 - i * 16]]).map(T), 26, 8, 1.35, o.color, 0.62, { clip: BODY }));
    for (const cx of [WF, WR]) p3.push(M(ell(cx, -90, 140, 140, Math.PI + 0.35, Math.PI * 2 - 0.35, 30).map(T), 28, 8, 1.35, o.color, 0.6, { clip: BODY }));
    groups.push(p3);
    // 玻璃、轮胎、影子
    const bk = [];
    for (let i = 0; i < 7; i++) { if (i === 3) continue; const xx = -150 + i * 78; const a = [xx - 60, -240], b = [xx + 70, -360]; bk.push(M((i % 2 ? [b, a] : [a, b]).map(T), 70, 18, 0.3, COL.glass, 0.78, { tool: tool('black'), clip: GLASS })); }
    for (const cx of [WF, WR]) { const c = T([cx, -100]); const C = circ(c, R0 * s), RIM = circ(c, 72 * s);
      for (let i = 0; i < 4; i++) bk.push(M((i % 2 ? [[cx + 130, -150 + i * 48], [cx - 130, -175 + i * 48]] : [[cx - 130, -175 + i * 48], [cx + 130, -150 + i * 48]]).map(T), 56, 15, 1.4, COL.black, 0.9, { tool: tool('black'), clip: C, dens: 1.8 }));
      for (let i = 0; i < 2; i++) bk.push(M((i % 2 ? [[cx + 90, -110 + i * 50], [cx - 90, -130 + i * 50]] : [[cx - 90, -130 + i * 50], [cx + 90, -110 + i * 50]]).map(T), 60, 16, 1.4, i ? '#7D838C' : '#C3C8CF', 0.8, { tool: tool('black'), clip: RIM, taper: .2 })); }
    for (let i = 0; i < 2; i++) bk.push(M((i % 2 ? [[640, 6], [-600, 10]] : [[-620, 2], [660, -2]]).map(T), 22, 7, 1.45, COL.black, 0.85, { tool: tool('black'), prof: 'flick' }));
    groups.push(bk);
    // 勾线
    const ln = [L('liner', dense(bodyPts.map(T), 6).map(q => [q.x, q.y]), 2.6 * Math.max(.7, s), COL.liner, { dur: rate * 6 })];
    for (const pts of [greenhouse, [[-546, -152], [-345, -198], [-100, -214], [200, -216], [420, -214], [578, -204]], [[-124, -256], [-118, -180], [-112, -90], [-104, -54]], [[175, -261], [180, -180], [190, -112], [210, -78]]])
      ln.push(L('liner', pts.map(T), 1.8 * Math.max(.7, s), COL.liner, { prof: 'flick' }));
    for (const cx of [WF, WR]) { const sp = []; for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + 0.3; sp.push([cx + Math.cos(a) * 14, -100 + Math.sin(a) * 14], [cx + Math.cos(a + .25) * 68, -100 + Math.sin(a + .25) * 68]); } sp.push(sp[0]);
      ln.push(L('liner', sp.map(T), 3.6 * Math.max(.6, s), '#24262B', { poly: true, prof: 'even' })); }
    groups.push(ln);
    // 白
    const wh = [L('white', [[-520, -178], [-400, -204], [-200, -232]].map(T), 3.4 * Math.max(.6, s), COL.white, { alpha: .95, prof: 'flick' }),
      L('white', [[-40, -314], [60, -340], [200, -350]].map(T), 3 * Math.max(.6, s), COL.white, { alpha: .9, prof: 'flick' }),
      L('white', [[-480, -178], [-150, -208], [200, -212], [470, -208]].map(T), 2.4 * Math.max(.6, s), COL.white, { alpha: .8, prof: 'flick' }),
      L('white', [[60, -268], [128, -334]].map(T), 7 * Math.max(.6, s), COL.white, { alpha: .55 })];
    groups.push(wh);
    let t = o.t0; const marks = {};
    groups.forEach((g, i) => { marks['g' + i] = t; t = seq(g, t, hop); });
    const dots = [[-524, -178, 6], [-200, -232, 4.5], [60, -342, 4], [-460, -180, 3.2]].map((d, i) => ({ p: T(d), r: d[2] * s, t: t + 2 + i * (o.dotGap ?? 3), G: o.G, vclip: o.vclip, layer: o.layer }));
    return { end: t, dots, marks, BODY, T };
  }

  // ================= 别的东西：多边形 + 自动铺色（之字形一遍、下半身再压一遍、勾线、一笔白）=================
  const PROD = {
    sneaker: { shapes: [{ poly: [[-190, -40], [-178, -78], [-120, -96], [-60, -112], [-14, -150], [40, -162], [110, -152], [160, -122], [190, -80], [196, -40]], c: 'main' },
      { poly: [[-196, -40], [196, -40], [199, -14], [182, 0], [-172, 0], [-197, -18]], c: '#C9CDD3' }],
      lines: [[[-40, -118], [-10, -128], [20, -138], [52, -150]], [[-110, -58], [-20, -92], [96, -110], [150, -84]], [[-196, -20], [198, -20]]], hl: [[-170, -84], [-80, -104], [-10, -148]] },
    phones: { shapes: [{ poly: ell(-132, -70, 44, 72, 0, Math.PI * 2, 30), c: 'main' }, { poly: ell(132, -70, 44, 72, 0, Math.PI * 2, 30), c: 'main' },
      { poly: [...ell(0, -88, 152, 150, Math.PI * 1.06, Math.PI * 1.94, 30), ...ell(0, -88, 126, 126, Math.PI * 1.94, Math.PI * 1.06, 30)], c: '#3A3D44' }],
      lines: [ell(-132, -70, 30, 56, 0, Math.PI * 2, 24), ell(132, -70, 30, 56, 0, Math.PI * 2, 24)], hl: [[-160, -110], [-150, -130]] },
    chair: { shapes: [{ poly: [[-170, -190], [-150, -80], [-110, -64], [120, -78], [176, -118], [150, -128], [100, -104], [-96, -96], [-120, -110], [-140, -196]], c: 'main' },
      { poly: [[-112, -100], [96, -108], [150, -126], [110, -140], [-80, -134], [-118, -120]], c: '#8A5A3C' }],
      lines: [[[-80, -70], [-140, 0]], [[60, -76], [130, 0]], [[-10, -72], [-20, 0]], [[-160, 0], [160, 0]]], hl: [[-160, -186], [-146, -100]] },
    lamp: { shapes: [{ poly: [[40, -232], [150, -190], [176, -140], [126, -128], [60, -178], [26, -214]], c: 'main' }, { poly: ell(-70, -10, 80, 16, 0, Math.PI * 2, 24), c: '#3A3D44' }],
      lines: [[[-70, -16], [-30, -150], [36, -222]], [[-30, -150], [-60, -170]]], beam: [[150, -140], [120, -20], [240, -20]], hl: [[60, -222], [140, -190]] },
  };
  function product(name, o) {
    const D = PROD[name], T = p => [o.x + p[0] * o.s, o.y + p[1] * o.s], s = o.s, base = { G: o.G, vclip: o.vclip, layer: o.layer }, out = [];
    for (const sh of D.shapes) {
      const pts = sh.poly.map(T), clip = pathOf(pts), color = sh.c === 'main' ? o.color : sh.c;
      let y0 = 1e9, y1 = -1e9, x0 = 1e9, x1 = -1e9; for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); }
      const gap = 30 * s, n = Math.max(2, Math.ceil((y1 - y0) / gap) + 1);
      for (let i = 0; i < n; i++) { const yy = y0 + (i + .2) * gap; const a = [x0 - 20 * s, yy + 8 * s], b = [x1 + 20 * s, yy - 8 * s]; out.push(add('marker', i % 2 ? [b, a] : [a, b], Object.assign({}, base, { w: 44 * s, th: 13 * s, nib: 1.35, color, alpha: .62, dur: o.rate, clip }))); }
      for (let i = 0; i < Math.ceil(n / 2); i++) { const yy = y1 - (i + .3) * gap; const a = [x0 - 20 * s, yy], b = [x1 + 20 * s, yy - 4 * s]; out.push(add('marker', i % 2 ? [b, a] : [a, b], Object.assign({}, base, { w: 40 * s, th: 12 * s, nib: 1.35, color, alpha: .55, dur: o.rate, clip }))); }
      out.push(add('liner', [...pts, pts[0]], Object.assign({}, base, { w: 2.2 * Math.max(.7, s), color: COL.liner, dur: o.rate * 2.5 })));
    }
    if (D.beam) out.push(add('marker', D.beam.map(T), Object.assign({}, base, { w: 60 * s, th: 50 * s, nib: 1.4, color: '#FFD86B', alpha: .5, dur: o.rate * 2 })));
    for (const l of D.lines) out.push(add('liner', l.map(T), Object.assign({}, base, { w: 2 * Math.max(.7, s), color: COL.liner, dur: o.rate, prof: 'flick' })));
    out.push(add('white', D.hl.map(T), Object.assign({}, base, { w: 4 * Math.max(.7, s), color: COL.white, alpha: .95, dur: o.rate, prof: 'flick' })));
    const end = seq(out, o.t0, o.rate * 0.2);
    return { end, list: out };
  }

  // ================= 时间线 =================
  // —— 1 · 标题 MARKER（桌面左上，黑色扁头笔）——
  const title = letters('MARKER', 300, 250, 300, { tool: 'black', layer: 'title', dur: 3.2 });
  let t = seq(title, B(0) + 2, 1.1);
  const T_TITLE_END = t;

  // —— 2 · 纸上的车：二十分钟的活压进 2.6 秒 ——
  const PG = 'paper';
  const CARP = car({ x: 1330, y: 1735, s: 1.1, color: COL.orange, t0: t + 4, rate: 1.55, hop: 0.35, G: grp(PG), layer: 'paper', tools: true, dotGap: 2.5 });
  const T_CAR_END = CARP.end;

  // —— 3 · 巨笔①：橙色一笔从纸扫到网页（镜头骑着它走）——
  const SW = [];
  const giant = (pts, color, t0, dur, o = {}) => { const S = add('marker', pts, Object.assign({ w: 820, th: 210, nib: 0.95, color, alpha: .58, dur, t0, prof: 'press', layer: 'bg', tool: 'giant', dens: 1.2, sheen: 1.4 }, o)); SW.push(S); return S; };
  const T_SW1 = B(8) - 14;                              // 第 250 帧（小节线）落在笔扫到一半
  giant([[1500, 2600], [2400, 2030], [3300, 1600], [4400, 1000]], COL.orange, T_SW1, 26);

  // —— 4 · 网页 ——
  const WG = 'web', wb = { G: grp(WG), vclip: WEBCLIP, layer: 'web' };
  const T_WEB = T_SW1 + 14;
  const W = {};
  W.logo = letters('KITE', 64, 30, 50, Object.assign({ dur: 1.4, w: 12, th: 3.2 }, wb)); seq(W.logo, T_WEB, .5);
  W.hero = letters('KITE 01', 80, 268, 200, Object.assign({ dur: 2.2 }, wb)); const T_HERO = seq(W.hero, T_WEB + 2, .6);
  W.car = car({ x: 1260, y: 700, s: .62, color: COL.orange, t0: T_WEB + 1, rate: .55, hop: .12, G: grp(WG), vclip: WEBCLIP, layer: 'web', pencil: true, dotGap: 1.5 });
  W.cta = add('marker', [[80, 676], [400, 670]], Object.assign({ w: 86, th: 24, nib: 1.45, color: COL.orange, alpha: .75, dur: 5, t0: T_HERO + 2, prof: 'press' }, wb));
  W.T_CURSOR = W.cta.t0 + 14;
  W.T_PRESS = W.T_CURSOR + 22;
  W.press = add('marker', [[96, 676], [104, 676]], Object.assign({ w: 86, th: 24, nib: 1.45, color: '#C2381A', alpha: .7, dur: 3, dwell: 30, t0: W.T_PRESS, prof: 'press', dens: 1.6, sheen: 0 }, wb));
  W.T_SCROLL = W.T_PRESS + 40;
  const CARDS = [['sneaker', COL.teal, '运动鞋'], ['phones', COL.violet, '耳机'], ['chair', COL.yellow, '躺椅'], ['lamp', COL.red, '台灯']];
  W.cards = CARDS.map(([n, c, label], i) => { const cx = 80 + i * 430 + 200, cy = 1160; const p = product(n, { x: cx, y: cy, s: .82, color: c, t0: W.T_SCROLL + 16 + i * 3, rate: .9, G: grp(WG), vclip: WEBCLIP, layer: 'web' }); return { n, c, label, cx, cy, ...p }; });
  const T_WEB_END = Math.max(...W.cards.map(c => c.end));

  // —— 5 · 巨笔②：蓝色从网页扫到手机，和橙色叠出一道深的（规则 ①）——
  const T_SW2 = 50 + BAR * Math.ceil((T_WEB_END - 50) / BAR) - 14;
  giant([[2400, 1300], [3100, 1750], [3650, 2150], [4200, 2640]], COL.blue, T_SW2, 26, { nib: 0.35 });

  // —— 6 · 手机：配置器 ——
  const PHG = 'phone', pb = { G: grp(PHG), vclip: PHCLIP, layer: 'phone' };
  const T_PH = T_SW2 + 20;
  const P = { T: T_PH };
  P.swatches = [COL.orange, COL.teal, '#4A4E57', COL.blue].map((c, i) => add('marker', [[46 + i * 112, 690], [124 + i * 112, 686]], Object.assign({ w: 60, th: 17, nib: 1.45, color: c, alpha: .8, dur: 2.2 }, pb)));
  seq(P.swatches, T_PH + 6, 1);
  P.taps = []; P.cards = [];
  const colors = [COL.orange, COL.teal, '#4A4E57'];
  let tc = T_PH + 12;
  colors.forEach((c, k) => {
    const name = 'card' + k; G[name] = null;
    const cc = car({ x: 254, y: 560, s: .34, color: c, t0: tc, rate: .42, hop: .08, G: grp(name), vclip: PHCLIP, layer: 'phone', pencil: false, sweepColor: k === 2 ? COL.yellow : COL.blue, dotGap: 1.2 });
    P.cards.push({ name, t0: tc, end: cc.end, dots: cc.dots });
    if (k < colors.length - 1) { const tap = cc.end + 6; P.taps.push({ t: tap, sw: k + 1 }); tc = tap + 10; }
  });
  P.T_TOGGLE = P.cards[P.cards.length - 1].end + 8;
  P.pencil = [add('pencil', [[24, 560], [484, 560]], Object.assign({ w: 1.6, color: COL.pencil, alpha: .7, dur: 4, prof: 'flick' }, pb, { G: grp('card' + (colors.length - 1)) })),
    ...[-345, 345].map(cx => add('pencil', ell(254 + cx * .34, 560 - 100 * .34, 37, 37, -0.4, Math.PI * 2 + 0.2, 30), Object.assign({ w: 1.5, color: COL.pencil, alpha: .7, dur: 4 }, pb, { G: grp('card' + (colors.length - 1)) })))];
  seq(P.pencil, P.T_TOGGLE + 6, .5);
  P.T_PROG = P.T_TOGGLE + 22;
  P.prog = add('marker', [[40, 1004], [470, 1000]], Object.assign({ w: 30, th: 9, nib: 1.45, color: COL.orange, alpha: .85, dur: 18, t0: P.T_PROG, prof: 'even' }, pb));
  const T_PH_END = P.T_PROG + 22;

  // —— 7 · 巨笔③：最后一笔是白 ——
  const T_SW3 = 50 + BAR * Math.round((T_PH_END - 50) / BAR) - 11;   // 白色巨笔扫到一半落在小节线上（和进度条灌满几乎同时）
  giant([[2150, 2330], [2800, 1930], [3500, 1560], [4200, 1180]], COL.white, T_SW3, 20, { mode: 'source-over', alpha: .92, w: 230, th: 60, nib: 1.25, dens: 3, sheen: 0 });

  // —— 8 · 收束：试色条（规则 ①）、署名、扣帽 ——
  const SWX = { x: 330, y: 2250, w: 230, gap: 64, dy: 92 };
  const strip = [];
  [[COL.blue, 'blue', .5], [COL.orange, 'orange', .6]].forEach(([c, tool, a], row) => { for (let col = 0; col < 3; col++) for (let k = 0; k <= col; k++) {
    const x0 = SWX.x + col * (SWX.w + SWX.gap), y = SWX.y + row * SWX.dy + (k - col / 2) * 2;
    strip.push(add('marker', k % 2 ? [[x0 + SWX.w, y], [x0, y + 1]] : [[x0, y], [x0 + SWX.w, y - 1]], { w: 64, th: 18, nib: 1.45, color: c, alpha: a, dur: 2.2, tool, layer: 'bg2' })); } });
  const T_STRIP = T_SW3 + 40;
  const T_STRIP_END = seq(strip, T_STRIP, .8);
  const T_CAP = 50 + BAR * Math.ceil((T_STRIP_END + 24 - 50) / BAR);   // 扣帽落在试色条画完之后的第一个小节线

  all.sort((a, b) => a.t0 - b.t0);
  all.forEach((S, i) => { S.idx = i; S.end = S.t0 + (S.dwell || 0) + S.dur; });
  const DOTS = [...CARP.dots, ...W.car.dots, ...P.cards.flatMap(c => c.dots)];
  const T_DRAW_END = Math.max(...all.map(S => S.end));
  return { all, COL, BEAT, BAR, B, WORLD, PAPER, BROW, PHONE, WEBCLIP, PHCLIP, PAPERCLIP, G, DOTS, CARP, W, P, SW, SWX, title,
    marks: { T_TITLE_END, T_CAR_END, T_SW1, T_WEB, T_HERO, T_WEB_END, T_SW2, T_PH, T_PH_END, T_SW3, T_STRIP, T_STRIP_END, T_CAP, T_DRAW_END, CAR: CARP.marks } };
})();
