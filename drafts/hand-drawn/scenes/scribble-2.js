// 速写本乱线 B：爆炸。爆炸是一把从中间甩出去的线：越靠中心越用力（线越粗、涂得越实），烟是连笔的圈。
SCENES['scribble-2'] = ctx => {
  const { W, H, rng, fill, ellipse, cr, lerp, clamp, n1, waxFill, grain, wob, TAU } = HD, { waxShape, waxRim, waxLines, marker, waxText, waxCat } = FX;
  const C = { paper: '#1c1226', yel: '#ffd84a', cream: '#fff1b8', org: '#ff8a2e', red: '#ff4a4a', pink: '#ff5fa2', cyan: '#4be0e6', peri: '#9aa2ff', lime: '#b6f24a', vio: '#7a55e0', smoke: '#8d86b8', smoke2: '#5b5488', black: '#06070f', white: '#fbf7ea', b1: '#2c1f4a' };
  const r = rng(33); const j = k => (r() - 0.5) * 2 * k;
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H); grain(ctx, { amount: 0.16, fiber: 0.14, blend: 'soft-light' });
  const E = [610, 640], GY = 930;
  const ray = (a, r0, r1, bend = 0) => { const c = Math.cos(a), s = Math.sin(a), m = (r0 + r1) / 2; return cr([[E[0] + c * r0, E[1] + s * r0], [E[0] + c * m - s * bend, E[1] + s * m + c * bend], [E[0] + c * r1, E[1] + s * r1]], false, 6); };
  const rays = (n, r0, r1, col, w, press, seed, jit = 0.3) => { const ls = []; for (let i = 0; i < n; i++) { const a = (i + r()) / n * TAU; ls.push(ray(a, r0 * (1 - jit * r()), r1 * (1 - jit * r()), j(40))); } waxLines(ctx, ls, { w, color: col, press, seed, amp: 3, wave: 80 }); };

  // ---- 后面的墙和地：几根线交代一下 ----
  waxFill(ctx, [[1150, 120], [1960, 80], [1960, GY], [1160, GY]], { color: C.b1, w: 17, gap: 17, angle: -0.5, over: 14, press: 0.5, seed: 3 });
  waxLines(ctx, [[[1150, 110], [1160, GY]], [[1150, 118], [1940, 78]], [[1300, 300], [1304, 520], [1470, 512], [1466, 296], [1300, 300]], [[1620, 280], [1624, 500], [1790, 494], [1786, 276], [1620, 280]], [[1300, 660], [1300, GY]], [[1300, 660], [1500, 652], [1500, GY]]], { w: 6, color: C.vio, press: 0.7, seed: 5, amp: 3 });
  waxFill(ctx, [[1632, 290], [1778, 286], [1780, 484], [1634, 490]], { color: C.org, w: 11, gap: 11, angle: 0.7, over: 6, press: 0.6, seed: 7 });
  waxLines(ctx, [[[-20, GY], [700, GY - 8], [1300, GY + 6], [1940, GY - 4]], [[40, GY + 14], [1000, GY + 10], [1900, GY + 18]]], { w: 9, color: C.peri, press: 0.7, seed: 9, amp: 4, wave: 130 });

  // ---- 烟：连笔的圈，一团套一团 ----
  const loops = (cx, cy, R, n, col, w, press, seed, dir = [1, -0.4]) => { const p = []; for (let i = 0; i < n * 22; i++) { const t = i / 22, a = t * TAU, k = t / n; p.push([cx + dir[0] * k * R * 2.4 + Math.cos(a) * R * (0.6 + 0.4 * Math.sin(t * 1.7)) , cy + dir[1] * k * R * 2.4 + Math.sin(a) * R * (0.6 + 0.4 * Math.cos(t * 1.3))]); } waxLines(ctx, [p], { w, color: col, press, seed, amp: 3 }); };
  loops(250, 330, 110, 5, C.smoke2, 13, 0.72, 11, [1.2, -0.5]); loops(160, 560, 120, 5, C.smoke, 11, 0.6, 13, [0.3, -1.2]); loops(700, 200, 100, 5, C.smoke2, 13, 0.72, 15, [1.4, 0.1]);
  loops(880, 300, 80, 4, C.smoke, 10, 0.62, 17, [1.3, -0.5]); loops(120, 830, 90, 5, C.smoke2, 12, 0.72, 19, [1.6, -0.1]); loops(380, 180, 70, 4, C.smoke, 9, 0.6, 21, [1.2, -0.6]);

  // ---- 爆炸：从外到里，越里越用力 ----
  rays(44, 250, 640, C.red, 8, 0.5, 31, 0.45);
  rays(52, 170, 500, C.org, 13, 0.62, 33, 0.4);
  rays(46, 90, 380, C.yel, 18, 0.74, 35, 0.35);
  rays(30, 20, 250, C.cream, 22, 0.86, 37, 0.3);
  rays(22, 0, 170, C.white, 26, 0.9, 38, 0.3); waxFill(ctx, ellipse(E[0], E[1], 84, 78, 0, 30), { color: C.white, w: 22, gap: 15, angle: 0.4, over: 26, press: 0.86, seed: 39, passes: 2 });
  // 冲击圈
  [[430, 12, C.pink], [540, 8, C.cyan]].forEach(([R, w, c], i) => { const e = ellipse(E[0], E[1], R, R * 0.94, 0.3, 80); waxLines(ctx, [e.slice(2, 22), e.slice(30, 44), e.slice(50, 74)], { w, color: c, press: 0.7, seed: 41 + i, amp: 4 }); });
  // 火星：小叉、点、甩出去的短线
  for (let i = 0; i < 46; i++) { const a = r() * TAU, d = 380 + r() * 520, x = E[0] + Math.cos(a) * d, y = E[1] + Math.sin(a) * d * 0.9, s = 8 + r() * 16; if (y > GY - 10 || x > 1900 || x < 10 || y < 10) continue; const c = [C.yel, C.org, C.cream, C.pink][i % 4];
    if (i % 3 === 0) waxLines(ctx, [[[x - s, y - s], [x + s, y + s]], [[x - s, y + s], [x + s, y - s]]], { w: 6, color: c, press: 0.85, seed: 100 + i, amp: 1 });
    else if (i % 3 === 1) waxLines(ctx, [[[x, y], [x + Math.cos(a) * s * 3.4, y + Math.sin(a) * s * 3.4]]], { w: 8, color: c, press: 0.85, seed: 100 + i, amp: 1 });
    else waxFill(ctx, ellipse(x, y, s * 0.8, s * 0.8, 0, 12), { color: c, w: 8, gap: 5, angle: a, over: 2, press: 0.9, seed: 100 + i }); }
  // 飞起来的碎块
  for (let i = 0; i < 9; i++) { const a = -0.2 - r() * 2.7, d = 300 + r() * 380, x = E[0] + Math.cos(a) * d, y = E[1] + Math.sin(a) * d, s = 22 + r() * 30, n = 3 + (r() * 2 | 0), rot = r() * 6, ch = []; for (let k = 0; k < n; k++) ch.push([x + Math.cos(rot + k / n * TAU) * s * (0.7 + r() * 0.5), y + Math.sin(rot + k / n * TAU) * s * (0.7 + r() * 0.5)]);
    waxShape(ctx, [ch], { fillc: C.black, line: i % 2 ? C.org : C.yel, lw: 5, seed: 200 + i, press: 0.92, gap: 8, w: 11, passes: 2, twice: false }); }

  // ---- 猫：叼着鱼往外蹿。背着爆炸的一侧是橙黄的线 ----
  const T = { x: 1300, y: 430, s: 1.02, r: -0.3 }, cat = CAT.side('leap', T);
  // 身后的速度线
  (() => { const d = [Math.cos(T.r), Math.sin(T.r)], n = [-d[1], d[0]], ls = []; for (let i = 0; i < 16; i++) { const o = j(190), st = -520 - r() * 200, L = 120 + r() * 260, a = [T.x + d[0] * st + n[0] * o, T.y + d[1] * st + n[1] * o]; ls.push([a, [a[0] + d[0] * L, a[1] + d[1] * L]]); } waxLines(ctx, ls.slice(0, 9), { w: 9, color: C.cyan, press: 0.7, seed: 51 }); waxLines(ctx, ls.slice(9), { w: 7, color: C.white, press: 0.75, seed: 53 }); })();
  waxCat(ctx, cat, { line: C.peri, seed: 61, rims: [{ color: C.org, d: [16, -15], angle: 0.5, gap: 10, w: 7, press: 0.85 }, { color: C.yel, d: [7, -8], angle: 0.3, gap: 13, w: 6, press: 0.9 }, { color: C.cyan, d: [-6, 11], angle: -0.8, gap: 13, w: 5, press: 0.75 }] });
  // 鱼
  (() => { const m = HD.xf([[84, 34]], { x: CAT.POSES.leap.head.x, y: CAT.POSES.leap.head.y, r: CAT.POSES.leap.head.r, s: CAT.POSES.leap.head.s }), o = HD.xf(m, T)[0], F = { x: o[0], y: o[1], r: T.r + 1.5, s: 0.74 };
    const body = HD.xf(cr([[-40, 0], [0, -30], [70, -24], [112, 0], [70, 24], [0, 30]], true, 8), F), tail = HD.xf([[112, 0], [156, -34], [150, 34]], F);
    waxShape(ctx, [body], { fillc: C.cyan, line: C.white, lw: 5, seed: 71, press: 0.85, gap: 8, w: 10, passes: 2, twice: false }); waxShape(ctx, [tail], { fillc: C.cyan, line: C.white, lw: 5, seed: 73, press: 0.85, gap: 8, w: 10, passes: 1, twice: false });
    const e = HD.xf([[-10, -8]], F)[0]; fill(ctx, ellipse(e[0], e[1], 7, 7, 0, 12), C.black); marker(ctx, [HD.xf([[-16, -14]], F)[0], HD.xf([[-4, -2]], F)[0]], { w: 3.5, color: C.white }); marker(ctx, [HD.xf([[-16, -2]], F)[0], HD.xf([[-4, -14]], F)[0]], { w: 3.5, color: C.white }); })();

  // ---- 字 ----
  waxText(ctx, '砰', 216, 300, { size: 330, color: C.pink, rot: -0.16, seed: 81, press: 0.9, align: 'center' });
  waxText(ctx, '砰', 204, 288, { size: 330, color: C.yel, rot: -0.16, seed: 83, press: 0.93, align: 'center' });
  waxText(ctx, '越用力，线越粗', 760, 980, { size: 50, color: C.cream, rot: -0.03, seed: 85 });
  marker(ctx, cr([[750, 970], [700, 930], [690, 860]], false, 8), { w: 4.5, color: C.cream, seed: 87 }); marker(ctx, [[672, 890], [690, 856], [714, 884]], { w: 4.5, color: C.cream, seed: 89 });
  waxText(ctx, 'p.12  鱼到手了', 1500, 1012, { size: 40, color: C.peri, rot: 0.02, seed: 91 });
  grain(ctx, { amount: 0.07, fiber: 0.05 });
};
