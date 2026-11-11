// 手绘特效 B：特效表。火、烟、水、电各五张关键帧：起 → 胀 → 爆 → 断 → 散。
// 蓝铅笔是打稿的辅助线，红铅笔是帧号；下面一行是每张停几帧（一秒 24 帧）。
SCENES['fx-2'] = ctx => {
  const { W, H, rng, fill, path, ellipse, cr, crayon, stroke, wob, grain, lerp } = HD, { fire, smoke, splash, bolt, PAL } = FX2D;
  const C = { paper: '#efe6d2', cell: '#191730', blue: '#3f8fe0', red: '#e2452f', ink: '#2a2740', floor: '#232044' };
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  // 定位孔（动画纸上面那三个孔）
  [[W / 2, 34, 13, 13], [W / 2 - 250, 34, 30, 9], [W / 2 + 250, 34, 30, 9]].forEach(([x, y, rx, ry]) => { ctx.fillStyle = '#1d1b22'; ctx.beginPath(); ctx.roundRect(x - rx, y - ry, rx * 2, ry * 2, ry); ctx.fill(); });
  const X0 = 250, Y0 = 108, CW = 322, CH = 198, GX = 10, GY = 12, cols = 5, rows = 4;
  const cell = (i, j) => [X0 + i * (CW + GX), Y0 + j * (CH + GY)];
  const NAMES = [['火', 'FIRE'], ['烟', 'SMOKE'], ['水', 'SPLASH'], ['电', 'SPARK']], STG = ['起', '胀', '爆', '断', '散'], FR = [1, 3, 7, 13, 21], HOLD = [2, 4, 6, 8, 8];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const [x, y] = cell(i, j), q = wob([[x, y], [x + CW, y], [x + CW, y + CH], [x, y + CH]], 1.5, 90, i * 7 + j * 31 + 1, true); fill(ctx, q, C.cell);
    ctx.save(); path(ctx, q); ctx.clip(); const gy = y + CH - 30; ctx.fillStyle = C.floor; ctx.fillRect(x, gy, CW, 40); const cx = x + CW / 2;
    if (j === 0) fire(ctx, cx, gy, 0.53, i, { seed: 3 + i });
    if (j === 1) smoke(ctx, cx, gy, 0.47, i, { seed: 13 + i });
    if (j === 2) splash(ctx, cx, gy - 6, 0.41, i, { seed: 23 + i });
    if (j === 3) bolt(ctx, [x + 46, y + 30], [x + CW - 50, gy - 4], i, { seed: 5, w: 15 });
    ctx.restore(); }
  // 蓝铅笔：地面线、动势线、外形的框
  crayon(ctx, c => { for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const [x, y] = cell(i, j), gy = y + CH - 30, cx = x + CW / 2, s = i * 5 + j * 17;
      stroke(c, wob([[x + 12, gy], [x + CW - 12, gy]], 1.5, 60, s), 2.2, C.blue);
      if (j < 3) { const hh = [[40, 96, 150, 170, 180], [34, 82, 150, 166, 172], [20, 62, 150, 150, 40]][j][i], ww = [[30, 70, 76, 70, 60], [34, 60, 84, 82, 86], [36, 62, 100, 122, 130]][j][i];
        stroke(c, wob(ellipse(cx, gy - hh / 2, ww, hh / 2 + 6, 0, 40), 2.5, 40, s + 1, true), 1.8, C.blue, true); stroke(c, wob(cr([[cx - 6, gy], [cx + (j === 0 ? 10 : 0), gy - hh * 0.5], [cx + (j === 0 ? 4 : 0), gy - hh - 8]], false, 6), 1.2, 40, s + 2), 1.8, C.blue); }
      else { stroke(c, wob([[x + 46, y + 30], [x + CW - 50, gy - 4]], 1.2, 50, s + 3), 1.8, C.blue); [[x + 46, y + 30], [x + CW - 50, gy - 4]].forEach(p => stroke(c, wob(ellipse(p[0], p[1], 12, 12, 0, 16), 1.5, 20, s + 4, true), 1.8, C.blue, true)); } } }, { press: 0.8, seed: 3 });
  // 铅笔字：行名、阶段、帧号、停几帧
  const pencil = (col, fn, seed) => crayon(ctx, c => { c.fillStyle = col; c.strokeStyle = col; c.textBaseline = 'middle'; fn(c); }, { press: 0.9, seed });
  pencil(C.ink, c => { NAMES.forEach(([zh, en], j) => { const [, y] = cell(0, j); c.font = '112px KuaiLe'; c.textAlign = 'center'; c.fillText(zh, 140, y + CH / 2 - 34); c.font = '700 32px Caveat'; c.fillText(en, 140, y + CH / 2 + 30); });
    c.textAlign = 'center'; STG.forEach((t, i) => { const [x] = cell(i, 0); c.font = '54px KuaiLe'; c.fillText(t, x + CW / 2 - 30, 76); });
    c.textAlign = 'left'; c.font = '44px KuaiLe'; c.fillText('快进慢出：前两张只停 2—4 帧，后面越停越久（红字 = 每张停几帧）', 250, 1046); }, 5);
  pencil(C.red, c => { c.textAlign = 'left'; STG.forEach((t, i) => { const [x] = cell(i, 0); c.font = '700 40px Caveat'; c.fillText('#' + FR[i], x + CW / 2 + 14, 78); });
    // 时间轴：五个刻度，间隔 = 停的帧数
    const tx = 250, tw = 1640, ty = 994, tot = 28; stroke(c, wob([[tx, ty], [tx + tw, ty]], 1.2, 80, 9), 2.6, C.red); let acc = 0; HOLD.forEach((h, i) => { const x = tx + tw * acc / tot; stroke(c, [[x, ty - 16], [x + 1, ty + 16]], 3, C.red); c.font = '30px KuaiLe'; c.fillText(`${STG[i]} ${h}`, x + 10, ty - 22); acc += h; });
    for (let f = 0; f <= tot; f++) { const x = tx + tw * f / tot; stroke(c, [[x, ty - 5], [x, ty + 5]], 1.6, C.red); } }, 7);
  pencil(C.red, c => { c.font = '34px KuaiLe'; STG.forEach((t, i) => { }); c.textAlign = 'right'; c.font = '700 34px Caveat'; c.fillText('FX-01 · 24fps', W - 40, 40); }, 9);
  // 色卡：每种三层
  [PAL.fire.slice(0, 3), PAL.smoke, PAL.water, PAL.bolt].forEach((p, j) => { const [, y] = cell(0, j); p.forEach((col, k) => { fill(ctx, wob(ellipse(86 + k * 54, y + CH - 26, 20, 20, 0, 24), 1.5, 30, j * 5 + k, true), col); }); });
  crayon(ctx, c => { [0, 1, 2, 3].forEach(j => { const [, y] = cell(0, j); [0, 1, 2].forEach(k => stroke(c, wob(ellipse(86 + k * 54, y + CH - 26, 21, 21, 0, 24), 1.5, 30, j * 5 + k + 50, true), 2, C.ink, true)); }); }, { press: 0.85, seed: 11 });
  grain(ctx, { amount: 0.09, fiber: 0.08 });
};
