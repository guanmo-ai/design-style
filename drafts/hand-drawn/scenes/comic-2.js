// 漫画墨线 B：冲击帧。落地那一下只画两三张：黑白反过来，只留一个颜色，线全部从落点炸开。
// 上面一条眼睛特写的窄格，是漫画的分格，也是电影里的“大特写”。
SCENES['comic-2'] = ctx => {
  const { W, H, rng, fill, path, paths, ink, hatch, halftone, layer, tint, grain, ellipse, cr, lerp, clamp, n1, TAU } = HD;
  const C = { paper: '#f4ecd8', ink: '#0c0a14', red: '#ff2b4f', yel: '#ffe14a', cyan: '#39d5ff' };
  const r = rng(11);
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);

  // ================= 下格：冲击帧 =================
  const PY = 330, panel = [[30, PY], [W - 30, PY - 46], [W - 30, H - 30], [30, H - 30]];
  const L = layer(x => { x.save(); path(x, panel); x.clip();
    x.fillStyle = C.ink; x.fillRect(0, 0, W, H);
    const F = [900, 640], G = [1090, 900];   // 光的中心、落点
    // 红色的冲击光：锯齿星
    const star = (R0, R1, n, seed) => { const rr = rng(seed), o = []; for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU + (rr() - 0.5) * 0.08, R = i % 2 ? R0 * (0.75 + rr() * 0.3) : R1 * (0.55 + rr() * 0.9); o.push([F[0] + Math.cos(a) * R * 1.5, F[1] + Math.sin(a) * R * 0.92]); } return o; };
    fill(x, star(420, 900, 26, 3), C.red);
    halftone(x, (px, py) => clamp(1.25 - Math.hypot((px - F[0]) / 1.5, py - F[1]) / 640), { pitch: 14, angle: 0.4, color: C.ink, clip: star(420, 900, 26, 3), max: 0.76 });
    fill(x, star(290, 560, 20, 5), C.paper);
    // 放射线：从落点炸开，越靠近落点越细
    for (let i = 0; i < 150; i++) { const a = r() * TAU, d0 = 470 + r() * 420, d1 = d0 + 260 + r() * 900, w = 4 + r() * 22, c = Math.cos(a), s = Math.sin(a) * 0.72;
      ink(x, [[F[0] + c * d1 * 1.3, F[1] + s * d1], [F[0] + c * d0 * 1.3, F[1] + s * d0]], { w, t0: 0.02, t1: 0.96, amp: 0.3, seed: i, color: r() < 0.8 ? C.paper : C.red, min: 0.02 }); }
    // 地面：一条线 + 裂缝 + 飞起来的碎块
    const GY = 912; x.fillStyle = C.paper; x.fillRect(0, GY + 6, W, 400);
    halftone(x, (px, py) => clamp((py - GY) / 150), { pitch: 12, angle: 0.5, color: C.ink, box: [0, GY, W, 200], max: 0.8 });
    ink(x, [[0, GY + 8], [W, GY - 2]], { w: 14, color: C.ink, seed: 2, t0: 0.01, t1: 0.01, min: 0.7, amp: 2 });
    for (let i = 0; i < 16; i++) { const a = (i / 16 - 0.5) * 2.6 + (r() - 0.5) * 0.2, len = 180 + r() * 420, pts = [[G[0] + (r() - 0.5) * 60, GY + 6]]; let ang = Math.PI / 2 + a; for (let k = 0; k < 6; k++) { const p = pts[pts.length - 1]; ang += (r() - 0.5) * 0.9; pts.push([p[0] + Math.cos(ang) * len / 6 * 2.2, p[1] + Math.abs(Math.sin(ang)) * len / 6 * 0.42]); }
      ink(x, pts, { w: 9, t0: 0.02, t1: 0.9, seed: 50 + i, color: C.ink, amp: 0.5 }); }
    for (let i = 0; i < 34; i++) { const a = -Math.PI * (0.06 + r() * 0.88), d = 260 + r() * 640, cx = G[0] + Math.cos(a) * d * 1.5, cy = GY - 20 + Math.sin(a) * d * 0.8, sz = 10 + r() * 46, rot = r() * 6, n = 3 + (r() * 3 | 0), ch = []; for (let k = 0; k < n; k++) { const aa = rot + k / n * TAU; ch.push([cx + Math.cos(aa) * sz * (0.6 + r() * 0.6), cy + Math.sin(aa) * sz * (0.6 + r() * 0.6)]); }
      fill(x, ch, r() < 0.7 ? C.ink : C.red); ink(x, ch, { w: 3.5, closed: true, color: C.paper, seed: 90 + i, amp: 0.6 }); }
    // 猫：反白（纸色的剪影，墨线只留在暗面）
    const T = { x: 930, y: 748, s: 1.04, r: 0 }, cat = CAT.side('land', T, { furAmp: 14, back: [-0.6, -0.8] });
    [[-46, -56, C.red, 1]].forEach(([dx, dy, c]) => { const g = CAT.side('land', { ...T, x: T.x + dx, y: T.y + dy }, { furAmp: 14, back: [-0.6, -0.8] }); CAT.order(g).forEach(q => fill(x, q, c)); });
    FX.inkCat(x, cat, { a: C.paper, b: C.red, da: [6, 10], db: [-4, -7], body: C.ink, farC: '#2c2738', dots: false });
    // 前爪砸出来的两圈灰
    [[1.0, 30], [1.45, 18]].forEach(([k, w], i) => { const e = ellipse(G[0], GY + 4, 250 * k, 46 * k, 0, 70); [[2, 14], [20, 33], [38, 50], [56, 68]].forEach(([a, b], j) => ink(x, e.slice(a, b), { w, color: C.ink, seed: i * 9 + j, t0: 0.3, t1: 0.3 })); });
    x.restore(); });
  ctx.drawImage(L, 0, 0);
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.5; ctx.drawImage(tint(L, C.cyan), -5, -2); ctx.restore(); ctx.drawImage(L, 0, 0);
  // 拟声字
  FX.sfx(ctx, '咚', 1330, 640, { size: 330, rot: 0.1, skew: -0.2, fillc: C.yel, shadow: C.red, seed: 3 });
  FX.sfx(ctx, '!!', 1680, 540, { size: 250, font: 'Bangers', rot: 0.16, skew: -0.2, fillc: C.yel, shadow: C.red, seed: 4, gap: 0.9 });

  // ================= 上格：眼睛特写 =================
  const top = [[30, 30], [W - 30, 30], [W - 30, PY - 76], [30, PY - 30]];
  ctx.save(); path(ctx, top); ctx.clip(); ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  const f = CAT.face({ x: 960, y: 200, s: 3.5 });
  // 脸上的光：一侧红网点
  halftone(ctx, (x, y) => clamp((x - 1200) / 700), { pitch: 12, angle: 0.5, color: C.red, box: [900, 0, 1020, 340], max: 0.74 });
  [f.eyeL, f.eyeR].forEach((e, i) => { fill(ctx, e, C.yel); halftone(ctx, (x, y) => clamp((y - 150) / 150), { pitch: 9, color: '#ff8a1f', clip: e, box: [0, 0, W, 340], angle: 0.3 }); });
  [f.pupL, f.pupR].forEach(p => fill(ctx, p, C.ink));
  [[f.irisL, -1], [f.irisR, 1]].forEach(([c]) => { const px = 960 + c[0] * 3.5, py = 200 + c[1] * 3.5; fill(ctx, ellipse(px + 26, py - 56, 20, 13, -0.5, 20), '#fff'); });
  [f.eyeL, f.eyeR].forEach((e, i) => { ink(ctx, e, { w: 16, closed: true, color: C.ink, seed: i, amp: 1.5 }); });
  // 眉骨的毛：一排斜的墨线
  for (let i = 0; i < 60; i++) { const x = 380 + r() * 1160, y = 30 + r() * 90, l = 40 + r() * 80, a = x < 960 ? 0.5 : Math.PI - 0.5; ink(ctx, [[x, y], [x + Math.cos(a) * l, y + Math.sin(a) * l * 0.6]], { w: 5, color: x > 1100 && r() < 0.5 ? C.red : '#3a3550', seed: 300 + i, t0: 0.1, t1: 0.8 }); }
  ctx.restore();
  // 格子的边
  [panel, top].forEach((pl, k) => pl.forEach((p, i) => ink(ctx, [p, pl[(i + 1) % 4]], { w: 10, seed: 500 + k * 4 + i, t0: 0.01, t1: 0.01, min: 0.7, amp: 1.4, color: C.ink })));
  grain(ctx, { amount: 0.1, fiber: 0.07 });
};
