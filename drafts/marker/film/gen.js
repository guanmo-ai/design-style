// 马克笔 · 笔画生成器（v3 起从 board.js 拆出来）：字母、车、产品。GEN(列表) → 往这个列表里加笔画的一组函数。
// 每一笔 = { kind: marker|liner|pencil|white, P(加密的路径), w, th, nib, color, alpha, t0, dur, prof, dwell, clip, G(组变换), tool(哪支笔在画) … }
function GEN(all, seed = 5) {
  const { dense } = INK;
  const COL = { blue: '#3B74E3', orange: '#F0642E', black: '#24262B', glass: '#2D323B', pencil: '#4F82D8', white: '#FFFDF7', liner: '#15161A',
    teal: '#13A58B', violet: '#7457E0', yellow: '#F2B01E', red: '#E8473C', sky: '#3FA7E8' };
  const R = INK.rng(seed);
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

  return { add, seq, ell, pathOf, letters, car, product, COL, R, PROD, bodyPts, greenhouse };
}
