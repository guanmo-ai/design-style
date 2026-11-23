// 64 格：方板是一格。每拉出一层，方块就“一分为四”：新露出的格子从和上一层相接的那个角弹出来。
// 世界坐标：8×8 格、每格 880，左上角 (-4400, -4400)。方板在第 5 列第 5 行（就是 0..880）。
const GRID = (() => {
  const E = ENG, P = E.PAL, I = E.IMG, T = TL;
  const S = 880, X0 = -4400, GAP = 14;
  // 每一层的方块范围（含方板）：L1 = 2×2，L2 = 4×4，L3 = 8×8
  const LV = [{ c0: 5, r0: 5, n: 1 }, { c0: 4, r0: 4, n: 2 }, { c0: 4, r0: 4, n: 4 }, { c0: 0, r0: 0, n: 8 }];
  const center = l => [X0 + (LV[l].c0 + LV[l].n / 2) * S, X0 + (LV[l].r0 + LV[l].n / 2) * S];
  const levelOf = (c, r) => LV.findIndex(L => c >= L.c0 && c < L.c0 + L.n && r >= L.r0 && r < L.r0 + L.n);
  const CELLS = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (c === 5 && r === 5) continue;
    const l = levelOf(c, r);
    const kind = GEOM.KINDS[Math.floor(E.hash(c, r, 7) * GEOM.KINDS.length)];
    // 从上一层方块最近的那个角弹出来
    const L = LV[l - 1], bx0 = X0 + L.c0 * S, by0 = X0 + L.r0 * S, bx1 = bx0 + L.n * S, by1 = by0 + L.n * S;
    const x = X0 + c * S, y = X0 + r * S;
    const ox = x + S / 2 < bx0 ? x + S : x >= bx1 ? x : x + S / 2, oy = y + S / 2 < by0 ? y + S : y >= by1 ? y : y + S / 2;
    CELLS.push({ c, r, l, kind, x, y, ox, oy, dist: Math.hypot(x + S / 2 - (bx0 + bx1) / 2, y + S / 2 - (by0 + by1) / 2) });
  }
  // 拉出：第 12、13、14 拍（第 357、387、416 帧）各露出一层
  const REVEAL = [0, T.bass, T.beat(13), T.beat(14)];
  CELLS.forEach(cl => { const maxd = LV[cl.l].n * S; cl.t0 = REVEAL[cl.l] + 2 + (cl.dist / maxd) * 9; });
  [1, 2, 3].forEach(l => SC.ev(REVEAL[l], 'split', .6 + l * .15));

  // 合：第 946 帧起倒着来，L3 → L2 → L1 → 1。merge[l] = 这一层的格子开始收回的帧
  const MERGE = [0, T.m4, T.m3, T.m2];
  CELLS.forEach(cl => { const maxd = LV[cl.l].n * S; cl.m0 = MERGE[cl.l] - 6 - (cl.dist / maxd) * 6; });

  function cellAnim(cl, f, mode) {
    if (mode === 'out') { const t = (f - cl.t0) / 22; if (t <= 0) return 0; return E.spring(t * 1.15); }
    if (mode === 'in') { const t = (f - cl.m0) / 16; return t <= 0 ? 1 : t >= 1 ? 0 : 1 - E.ease.i3(t); }
    return 1;
  }

  // 画格子。mode: 'out'（拉出）/ 'hold'（全显示）/ 'in'（合回）。swap: {c,r → 画法}（合的时候有几格换成海报、网页、门票）
  function draw(ctx, f, cam, mode, o = {}) {
    const lo = cam.z < .3;
    for (const cl of CELLS) {
      const a = cellAnim(cl, f, mode);
      if (a <= .002) continue;
      ctx.save();
      ctx.translate(cl.ox, cl.oy); ctx.scale(a, a); ctx.translate(-cl.ox, -cl.oy);
      const sw = o.swap && o.swap[`${cl.c},${cl.r}`];
      // 翻牌波浪：沿对角线依次翻过去（背面是金箔）再翻回来
      let fx = 1, gold = false;
      if (o.wave) { const d = (cl.c + cl.r), t = (f - o.wave.t0 - d * o.wave.step) / o.wave.dur;
        if (t > 0 && t < 1) { const ang = E.ease.io(t) * Math.PI * 2; fx = Math.cos(ang); gold = fx < 0; if (Math.abs(fx) < .03) fx = .03 * Math.sign(fx || 1); } }
      if (fx !== 1) { const cx = cl.x + S / 2; ctx.translate(cx, 0); ctx.scale(Math.abs(fx), 1); ctx.translate(-cx, 0); }
      if (gold) {
        ctx.fillStyle = '#4a2e08'; ctx.fillRect(cl.x + GAP, cl.y + GAP, S - 2 * GAP, S - 2 * GAP);
        const n = 3, ts = (S - 2 * GAP) / n;
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) E.leaf(ctx, (cl.c * 3 + i * 5 + j) % 12, cl.x + GAP + (i + .5) * ts, cl.y + GAP + (j + .5) * ts, ts - 4, 0, 0, 0, { glint: Math.pow(1 - Math.abs(fx), 2) * .8 });
      }
      else if (sw) sw(ctx, cl.x + GAP, cl.y + GAP, S - 2 * GAP);
      else ctx.drawImage(I['tile_' + cl.kind], cl.x + GAP, cl.y + GAP, S - 2 * GAP, S - 2 * GAP);
      // 弹出来的那一刻：一圈金线闪一下
      if (mode === 'out') { const fl = Math.exp(-Math.max(0, f - cl.t0) / 6) * (f >= cl.t0 ? 1 : 0); if (fl > .02) { ctx.globalAlpha = fl; ctx.strokeStyle = P.goldHi; ctx.lineWidth = 10 / Math.max(cam.z, .2); ctx.strokeRect(cl.x + GAP, cl.y + GAP, S - 2 * GAP, S - 2 * GAP); } }
      ctx.restore();
    }
  }
  return { draw, center, LV, CELLS, S, X0, REVEAL, MERGE };
})();
