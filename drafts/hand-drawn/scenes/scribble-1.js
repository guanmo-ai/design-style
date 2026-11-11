// 速写本乱线 A：路灯下的黑猫。深色纸，蜡笔和马克笔；光是一笔笔涂出来的，形状故意画歪。
SCENES['scribble-1'] = ctx => {
  const { W, H, rng, fill, path, ellipse, cr, thick, lerp, clamp, n1, waxFill, waxLine, grain, wob, xf } = HD, { waxShape, waxRim, waxLines, marker, waxText } = FX;
  const C = { paper: '#151936', yel: '#ffd84a', cream: '#fff1b8', org: '#ff9440', pink: '#ff5fa2', cyan: '#4be0e6', peri: '#8f9cff', lime: '#b6f24a', vio: '#6a4bd8', teal: '#22a79f', b1: '#27306a', b2: '#34297a', b3: '#1d2a5c', black: '#06070f', white: '#fbf7ea' };
  const r = rng(21); const j = k => (r() - 0.5) * 2 * k;
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  grain(ctx, { amount: 0.16, fiber: 0.14, blend: 'soft-light' });
  const quad = (x, y, w, h, k = 10) => [[x + j(k), y + j(k)], [x + w + j(k), y + j(k)], [x + w + j(k), y + h + j(k)], [x + j(k), y + h + j(k)]];
  const GY = 900;

  // ---- 月亮：一圈一圈的乱线 ----
  (() => { const sp = []; for (let i = 0; i < 260; i++) { const a = i * 0.33, rr = 8 + i * 0.44; sp.push([1560 + Math.cos(a) * rr * (1 + 0.08 * n1(i * 0.2, 1)), 170 + Math.sin(a) * rr * (1 + 0.08 * n1(i * 0.2, 2))]); }
    waxLines(ctx, [sp], { w: 15, color: C.cream, press: 0.62, seed: 3, amp: 3 }); waxLines(ctx, [ellipse(1560, 170, 150, 146, 0, 50).concat([[1716, 176]])], { w: 6, color: C.peri, press: 0.6, seed: 5, amp: 5 }); })();
  // 星：小叉
  for (let i = 0; i < 26; i++) { const x = 80 + r() * 1760, y = 30 + r() * 330, s = 7 + r() * 10; if (Math.hypot(x - 1560, y - 170) < 200) continue; waxLines(ctx, [[[x - s, y - s], [x + s, y + s]], [[x - s, y + s], [x + s, y - s]], [[x, y - s * 1.3], [x, y + s * 1.3]]].slice(0, r() < 0.5 ? 2 : 3), { w: 4.5, color: r() < 0.7 ? C.cream : C.pink, press: 0.75, seed: 60 + i, amp: 1 }); }

  // ---- 楼：歪的方块，涂不满 ----
  const bld = (x, y, w, fc, lc, seed, wins, wc) => { const q = quad(x, y, w, GY - y, 16); waxShape(ctx, [q], { fillc: fc, line: lc, lw: 6, seed, press: 0.55, gap: 15, w: 16, angle: -0.5 + j(0.3), over: 12, passes: 1, linePress: 0.62 });
    (wins || []).forEach(([c, rw], i) => { const ww = quad(x + w * (0.14 + c * 0.3), y + 46 + rw * 96, w * 0.17, 52, 6); waxFill(ctx, ww, { color: wc[(i + seed) % wc.length], w: 9, gap: 8, angle: 0.2 + j(0.5), over: 5, press: 0.8, seed: seed + i * 5, passes: 1 }); }); };
  bld(1130, 350, 250, C.b2, C.vio, 31, [[0, 0], [2, 1], [1, 3]], [C.org, C.yel]);
  bld(360, 420, 230, C.b3, C.teal, 41, [[1, 0], [0, 2]], [C.yel, C.cyan]);
  bld(-60, 190, 420, C.b1, C.peri, 51, [[0, 0], [2, 0], [1, 2], [0, 4], [2, 5]], [C.yel, C.org, C.pink]);
  bld(1380, 250, 600, C.b1, C.peri, 61, [[2, 1], [1, 3], [2, 5]], [C.yel, C.cyan]);

  // 屋顶上的东西、消防梯、一串灯
  waxLines(ctx, [[[120, 190], [124, 60]], [[90, 96], [156, 90]], [[100, 128], [148, 124]], [[1700, 250], [1706, 96]], [[1676, 130], [1736, 124]], [[1250, 350], [1250, 290], [1330, 290], [1330, 350]], [[1240, 290], [1290, 262], [1340, 290]],
    [[420, 420], [424, 380], [470, 380], [470, 420]], [[250, 330], [330, 400], [250, 470], [330, 540], [250, 610], [330, 680], [250, 750]], [[236, 330], [236, 760]], [[344, 330], [344, 760]]], { w: 6, color: C.peri, press: 0.7, seed: 65, amp: 2.5 });
  (() => { const wire = cr([[352, 300], [640, 392], [900, 330], [1130, 380], [1376, 290]], false, 16); waxLines(ctx, [wire], { w: 4, color: C.peri, press: 0.7, seed: 67, amp: 1.5 }); const cs = [C.pink, C.yel, C.cyan, C.org, C.lime]; for (let i = 3; i < wire.length - 2; i += 4) { const p = wire[i]; if (Math.abs(p[0] - 900) < 90) continue; waxFill(ctx, ellipse(p[0], p[1] + 16, 13, 16, 0, 14), { color: cs[(i / 4 | 0) % 5], w: 8, gap: 5, angle: i, over: 2, press: 0.9, seed: 300 + i }); } })();
  // ---- 霓虹招牌：字是马克笔，光晕是蜡笔绕圈 ----
  (() => { const sx = 1470, sy = 420, sw = 250, sh = 300; const halo = []; for (let i = 0; i < 150; i++) { const a = i * 0.47, rr = 170 + 60 * Math.sin(i * 0.9) + 30 * n1(i * 0.3, 7); halo.push([sx + sw / 2 + Math.cos(a) * rr * 1.05, sy + sh / 2 + Math.sin(a) * rr * 1.1]); }
    waxLines(ctx, [halo], { w: 9, color: C.pink, press: 0.42, seed: 71, amp: 4 });
    const q = quad(sx, sy, sw, sh, 10); waxShape(ctx, [q], { fillc: C.black, line: C.pink, lw: 9, seed: 73, press: 0.9, gap: 10, w: 14, passes: 2 });
    waxText(ctx, '鱼', sx + sw / 2, sy + sh / 2 + 8, { size: 210, color: C.pink, rot: -0.04, outline: 11, line2: C.white, align: 'center', press: 0.92, seed: 75 });
    // 一条鱼
    const fx = 1420, fy = 800, body = cr([[0, 0], [50, -30], [120, -22], [160, 0], [120, 24], [50, 30]], true, 8).map(p => [p[0] + fx, p[1] + fy]);
    waxLines(ctx, [body.concat([body[0]]), [[fx, fy], [fx - 44, fy - 30], [fx - 40, fy + 30], [fx, fy]]], { w: 7, color: C.cyan, press: 0.8, seed: 77, amp: 2 }); waxLines(ctx, [[[fx + 124, fy - 6], [fx + 128, fy - 4]]], { w: 9, color: C.cyan, seed: 78 }); })();

  // ---- 地面 ----
  waxLines(ctx, [[[-20, GY + 4], [640, GY - 6], [1300, GY + 8], [1940, GY - 2]], [[60, GY + 16], [900, GY + 10], [1880, GY + 20]]], { w: 9, color: C.peri, press: 0.7, seed: 81, amp: 4, wave: 120 });
  for (let i = 0; i < 16; i++) { const x = r() * W, y = GY + 40 + r() * 130, l = 80 + r() * 260; waxLines(ctx, [[[x, y], [x + l, y + j(6)]]], { w: 7, color: i % 4 ? C.b1 : C.vio, press: 0.6, seed: 90 + i }); }

  // ---- 路灯：杆是两根线，光是一把线 ----
  const LX = 900, LY = 150;
  waxLines(ctx, [[[560, GY], [566, 520], [560, 230], [600, 130], [700, 100], [840, 104]], [[580, GY], [584, 500], [580, 250], [612, 160], [700, 124]]], { w: 10, color: C.peri, press: 0.8, seed: 101, amp: 3, wave: 140 });
  waxFill(ctx, quad(826, 96, 150, 42, 5), { color: C.peri, w: 10, gap: 7, angle: 0.1, press: 0.85, seed: 103, over: 4 });
  // 光锥：密的在中间，往两边越来越疏
  const cone = (n, spread, col, w, press, seed) => { const ls = []; for (let i = 0; i < n; i++) { const u = (r() + r() + r()) / 3 * 2 - 1, x1 = 930 + u * spread, y0 = LY + r() * 30, y1 = GY - 10 + r() * 70 - Math.abs(u) * 60, st = r() * 0.25; ls.push(cr([[LX + j(26) + (x1 - LX) * st, y0 + (y1 - y0) * st], [lerp(LX, x1, 0.55) + j(14), lerp(y0, y1, 0.55)], [x1, y1]], false, 6)); } waxLines(ctx, ls, { w, color: col, press, seed, amp: 3, wave: 90 }); };
  cone(80, 520, C.org, 11, 0.42, 111); cone(100, 400, C.yel, 12, 0.5, 113); cone(50, 230, C.cream, 12, 0.55, 115);
  // 地上的光：来回涂的椭圆
  waxFill(ctx, ellipse(930, GY + 40, 470, 78, 0, 50), { color: C.yel, w: 15, gap: 14, angle: 0.03, over: 26, press: 0.62, seed: 117, passes: 1 });
  waxFill(ctx, ellipse(930, GY + 40, 300, 46, 0, 40), { color: C.cream, w: 13, gap: 12, angle: -0.06, over: 20, press: 0.7, seed: 119, passes: 1 });
  waxLines(ctx, [[[822, 144], [900, 150], [984, 142]]], { w: 16, color: C.cream, press: 0.9, seed: 121 });

  // ---- 猫：正面坐着。头大身小，两只眼睛不一样大 ----
  const CX = 930, CY = 520, T = { x: CX, y: CY, s: 1.02, r: -0.05 };
  const body = xf(cr([[0, 60], [84, 96], [128, 210], [146, 330], [112, 396], [0, 408], [-112, 396], [-146, 330], [-128, 210], [-84, 96]], true, 8), { x: CX + 8, y: CY, r: 0.02 });
  const tail = xf(thick([[110, 380], [220, 392], [282, 330], [262, 250], [214, 236]], [24, 24, 22, 19, 13]), { x: CX, y: CY });
  const f = CAT.face(T);
  // 影子
  waxFill(ctx, ellipse(CX + 40, GY + 40, 250, 34, 0, 40), { color: C.black, w: 14, gap: 10, angle: 0.04, over: 14, press: 0.85, seed: 131, passes: 2 });
  waxShape(ctx, [tail], { fillc: C.black, line: C.peri, lw: 7, seed: 133, press: 0.92, gap: 9, w: 13, passes: 2 });
  waxShape(ctx, [body], { fillc: C.black, line: C.peri, lw: 8, seed: 135, press: 0.92, gap: 10, w: 15, passes: 2, shift: [5, -3] });
  waxShape(ctx, [f.earL, f.earR, f.head], { fillc: C.black, line: C.peri, lw: 8, seed: 137, press: 0.94, gap: 10, w: 15, passes: 2, shift: [-4, 3] });
  // 光：左上是路灯（黄），右边是霓虹（粉）
  waxRim(ctx, [f.earL, f.earR, f.head], { color: C.yel, d: [22, 30], angle: 1.0, gap: 10, w: 7, seed: 141, press: 0.86 });
  waxRim(ctx, [f.earL, f.earR, f.head], { color: C.cream, d: [9, 13], angle: 0.8, gap: 13, w: 6, seed: 142, press: 0.9 });
  waxRim(ctx, [f.earL, f.earR, f.head], { color: C.pink, d: [-20, -4], angle: -0.5, gap: 11, w: 7, seed: 143, press: 0.82 });
  waxRim(ctx, [body], { color: C.yel, d: [20, 14], angle: 1.1, gap: 11, w: 7, seed: 145, press: 0.82 });
  waxRim(ctx, [body], { color: C.pink, d: [-22, 0], angle: -0.6, gap: 12, w: 7, seed: 147, press: 0.8 });
  waxRim(ctx, [tail], { color: C.pink, d: [-10, 8], angle: -0.4, gap: 10, w: 6, seed: 149, press: 0.8 });
  // 耳朵里、前腿、爪子
  [f.innL, f.innR].forEach((e, i) => waxFill(ctx, e, { color: C.pink, w: 8, gap: 8, angle: 0.9 - i * 1.8, over: 3, press: 0.7, seed: 151 + i }));
  waxLines(ctx, [[[CX - 30, CY + 190], [CX - 40, CY + 300], [CX - 34, CY + 390]], [[CX + 44, CY + 196], [CX + 50, CY + 300], [CX + 46, CY + 392]], [[CX + 6, CY + 250], [CX + 8, CY + 400]]], { w: 6, color: C.peri, press: 0.72, seed: 155, amp: 3 });
  [[-62, 398], [56, 400]].forEach(([dx, dy], i) => waxLines(ctx, [ellipse(CX + dx, CY + dy, 44, 22, 0, 24).concat([[CX + dx + 44, CY + dy + 3]]), [[CX + dx - 12, CY + dy + 6], [CX + dx - 12, CY + dy + 20]], [[CX + dx + 12, CY + dy + 6], [CX + dx + 13, CY + dy + 20]]], { w: 6, color: C.peri, press: 0.75, seed: 157 + i, amp: 2 }));
  // 眼睛：一大一小
  const eyes = [[f.T.x - 66 * 1.02, f.T.y - 14, 50, 46], [f.T.x + 70 * 1.02, f.T.y - 4, 62, 56]];
  eyes.forEach(([x, y, rx, ry], i) => { const e = ellipse(x, y, rx, ry, 0.1, 30); waxFill(ctx, e, { color: C.lime, w: 10, gap: 6, angle: 0.5 + i, over: 2, press: 0.93, seed: 161 + i, passes: 2 }); waxFill(ctx, ellipse(x, y + ry * 0.35, rx * 0.8, ry * 0.5, 0, 20), { color: C.yel, w: 8, gap: 7, angle: -0.3, over: 2, press: 0.7, seed: 165 + i });
    fill(ctx, wob(ellipse(x + 3, y + 2, rx * 0.5, ry * 0.72, 0.05, 30), 2, 24, 167 + i, true), C.black);
    marker(ctx, e, { w: 5, color: C.black, seed: 169 + i, closed: true, amp: 2 }); fill(ctx, ellipse(x - rx * 0.3, y - ry * 0.36, rx * 0.2, ry * 0.17, -0.4, 14), C.white); fill(ctx, ellipse(x + rx * 0.3, y + ry * 0.3, 5, 5, 0, 10), C.white); });
  // 鼻子、嘴、胡子
  waxFill(ctx, f.nose, { color: C.pink, w: 7, gap: 5, angle: 0.3, over: 2, press: 0.95, seed: 171, passes: 2 });
  waxLines(ctx, f.mouth, { w: 5, color: C.peri, press: 0.85, seed: 173, amp: 1.5 });
  waxLines(ctx, f.whiskL.concat(f.whiskR), { w: 4.5, color: C.white, press: 0.85, seed: 175, amp: 3, wave: 80 });

  // ---- 手写的批注 ----
  waxText(ctx, '光 = 一把线', 1090, 210, { size: 52, color: C.cream, rot: -0.05, seed: 185 });
  marker(ctx, cr([[1080, 226], [1040, 262], [1030, 310]], false, 8), { w: 4.5, color: C.cream, seed: 181 }); marker(ctx, [[1012, 284], [1030, 314], [1056, 292]], { w: 4.5, color: C.cream, seed: 183 });
  waxText(ctx, 'p.07  夜 / 路灯 / 猫', 96, 1010, { size: 40, color: C.peri, rot: -0.02, seed: 187 });
  grain(ctx, { amount: 0.07, fiber: 0.05 });
};
