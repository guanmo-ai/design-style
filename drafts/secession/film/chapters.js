// 维也纳分离派 · 导演：每一帧画哪一场、镜头在哪、怎么转场。
const CH = (() => {
  const E = ENG, P = E.PAL, T = TL, B = T.beat, I = E.IMG;
  E.ease.sm = E.sm;

  // —— 镜头 ————————————————————————————————————————————————————————————
  // 开场：封面构图（方板在右、标题在左）→ 一路推进到树冠
  const COVER = { x: -30, y: 440, z: 1, rot: 0 };
  const CAM_A = [
    [0, COVER],
    [T.tick0, { x: 70, y: 425, z: 1.2, rot: -.004 }, 'io'],
    [210, { x: 432, y: 382, z: 2.85, rot: .01 }, 'io'],
    [T.bass, { x: 468, y: 350, z: 3.7, rot: .016 }, 'io'],
  ];
  // 一分为四：每一拍拉出一层（快出慢停）；到顶那一拍推近、歪一点，然后斜着滑过 64 格
  const gc = GRID.center;
  const CAM_C = [
    [T.bass, CAM_A[CAM_A.length - 1][1]],
    [T.bass + 24, { x: gc(1)[0], y: gc(1)[1], z: .53, rot: 0 }, 'o3'],
    [B(13), { x: gc(1)[0] + 30, y: gc(1)[1] + 20, z: .5, rot: -.01 }, 'io'],
    [B(13) + 20, { x: gc(2)[0], y: gc(2)[1], z: .27, rot: -.01 }, 'o5'],
    [B(14), { x: gc(2)[0] - 40, y: gc(2)[1] - 30, z: .255, rot: -.02 }, 'io'],
    [B(14) + 20, { x: gc(3)[0], y: gc(3)[1], z: .142, rot: -.02 }, 'o5'],
    [B(15), { x: gc(3)[0] - 60, y: gc(3)[1] - 40, z: .148, rot: -.04 }, 'io'],
    [T.peak, { x: -2250, y: -1950, z: .34, rot: -.075 }, 'io'],
    [T.whip, { x: 250, y: 650, z: .38, rot: .02 }, 'sm'],
  ];
  // 合：从 64 格逐层推回（64 → 16 → 4 → 1），最后回到封面构图
  const CAM_F = [
    [T.merge, { x: gc(3)[0], y: gc(3)[1], z: .142, rot: .03 }],
    [T.m2 - 4, { x: gc(3)[0] + 80, y: gc(3)[1] + 60, z: .15, rot: .02 }, 'sm'],
    [T.m2 + 18, { x: gc(2)[0], y: gc(2)[1], z: .27, rot: .01 }, 'o5'],
    [T.m3, { x: gc(2)[0] - 30, y: gc(2)[1] - 20, z: .285, rot: .006 }, 'sm'],
    [T.m3 + 18, { x: gc(1)[0], y: gc(1)[1], z: .53, rot: 0 }, 'o5'],
    [T.m4, { x: gc(1)[0] - 20, y: gc(1)[1] + 10, z: .56, rot: 0 }, 'sm'],
    [T.m4 + 22, COVER, 'o5'],
    [T.final, { x: -24, y: 440, z: 1.01, rot: 0 }, 'sm'],
    [T.end, { x: 0, y: 440, z: 1.045, rot: 0 }, 'sm'],
  ];

  // —— 1 → 4 → 16 → 64 ——————————————————————————————————————————————————
  const COUNT = [[T.bass, '4'], [B(13), '16'], [B(14), '64']];
  function counter(ctx, f) {
    if (f < T.bass - 2 || f > T.peak + 30) return;
    const out = 1 - E.prog(f, T.peak + 10, T.peak + 30);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.textBaseline = 'alphabetic';
    let x = 1800; const y = 1000;
    const shown = [['1', T.bass - 40], ...COUNT.map(([g, n]) => [n, g])].filter(([, g]) => f >= g);
    for (let i = shown.length - 1; i >= 0; i--) {
      const [n, g] = shown[i], latest = i === shown.length - 1, a = E.clamp((f - g) / 12);
      const sc = latest ? 1 + .35 * Math.exp(-(f - g) / 5) * Math.cos((f - g) * .5) : .62;
      ctx.font = `600 ${Math.round(130 * sc)}px Jost`;
      const w = ctx.measureText(n).width;
      ctx.globalAlpha = out * (latest ? E.ease.o3(a) : .55); ctx.fillStyle = latest ? P.gold : P.bone;
      ctx.fillText(n, x - w, y); x -= w + 18;
      if (i > 0) { ctx.font = '400 44px Jost'; ctx.globalAlpha = out * .5; ctx.fillStyle = P.bone; const aw = ctx.measureText('→').width; ctx.fillText('→', x - aw, y - 20); x -= aw + 18; }
    }
    ctx.restore();
  }
  // 一道斜光扫过画面（只提亮，不改颜色）
  function sweep(ctx, p, a = .3) {
    const x = -600 + p * 3200;
    const g = ctx.createLinearGradient(x - 380, 0, x + 380, 300);
    g.addColorStop(0, 'rgba(255,236,190,0)'); g.addColorStop(.5, `rgba(255,236,190,${a})`); g.addColorStop(1, 'rgba(255,236,190,0)');
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080); ctx.restore();
  }

  // —— 64 格里换上的几格：合的时候，蒙太奇里的东西都变成格子 ————————————————————————————
  const SWAP = {
    '4,4': (ctx, x, y, s) => ctx.drawImage(I.poster, x, y, s, s),
    '5,4': (ctx, x, y, s) => { ctx.fillStyle = P.ink; ctx.fillRect(x, y, s, s); const w = s * .9, h = w * 956 / 1300; ctx.drawImage(I.web, x + (s - w) / 2, y + (s - h) / 2, w, h); },
    '4,5': (ctx, x, y, s) => { ctx.fillStyle = '#D9D0BD'; ctx.fillRect(x, y, s, s); const h = s * .9, w = h * 400 / 930; ctx.drawImage(I.phone, x + (s - w) / 2, y + (s - h) / 2, w, h); },
    '6,4': (ctx, x, y, s) => { ctx.fillStyle = '#1a1815'; ctx.fillRect(x, y, s, s); const c = s * .29, g = s * .035; for (let n = 0; n < 3; n++) ctx.drawImage(I['cover' + n], x + (s - 3 * c - 2 * g) / 2 + n * (c + g), y + (s - c) / 2, c, c); },
  };
  const COVERS_CELL = [6, 4];

  // —— 层：转场时把两场分别画到离屏画布上再合 ————————————————————————————————————
  const mk = () => { const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; return c; };
  let LA, LB;

  function init() {
    LA = mk(); LB = mk();
    MON.prep(); MON.initLetters();
    SC.label(150, 340, '金箔，是方的', 'GOLD LEAF · 8 × 8 CM', 120, 880);
    SC.label(T.bass + 6, T.peak + 20, '一分为四', 'ONE SQUARE · FOUR SQUARES', 120, 880);
    SC.label(T.peak + 14, T.whip - 6, '装饰，从方格里长出来', 'ORNAMENT GROWS FROM THE GRID', 120, 880);
    SC.label(T.whip + 24, T.drop - 2, '高腰：横画在 2.4 / 7', 'EVEN STROKES · HALF-CIRCLE BOWLS', 120, 940);
    SC.label(T.drop + 8, T.dolly - 4, '1 : 1 · 8 列方格', 'SQUARE FORMAT · 8 COLUMNS', 1820, 960, { align: 'right' });
    SC.label(T.press + 2, T.rack - 2, '金，只用一处', 'GOLD IN ONE PLACE ONLY', 1820, 960, { align: 'right' });
    SC.label(T.rack + 10, T.checker - 2, '直角 · 棋盘格分隔', 'SQUARE CORNERS · CHECKER RULES', 120, 960);
    SC.label(T.checker + 26, T.merge - 2, '一套方格，处处能用', 'ONE GRID FOR EVERYTHING', 960, 960, { align: 'center' });
    // 转场的声音
    [[T.whip - 6, 'whoosh', 1], [T.drop, 'thump', 1], [T.flip, 'flip', .8], [T.dolly, 'whoosh', .4], [T.rack, 'rise', .7], [T.merge, 'whoosh', .9],
      [T.m2, 'merge', .6], [T.m3, 'merge', .75], [T.m4, 'merge', .9], [T.final + 26, 'sign', .6]].forEach(([f, k, v]) => SC.ev(f, k, v));
    for (let k = 0; k < 8; k++) SC.ev(T.checker + 2 + k * 2.6, 'tick', .35);
  }

  // 镜头最快的那几帧多拍几个子帧，免得运动模糊出现台阶
  function blurBoost(f) {
    const near = (a, w = 12) => f >= a - 2 && f < a + w;
    if (f >= T.bass && f < T.bass + 10) return 5;
    if (near(T.whip - 8, 26)) return 3;
    if (near(T.bass, 18) || near(B(13), 14) || near(B(14), 14) || near(T.merge, 24) || near(T.m2, 18) || near(T.m3, 18) || near(T.m4, 22)) return 2.5;
    if (near(T.flip, 30) || near(T.drop, 14) || near(T.final - 20, 30)) return 2;
    return 1;
  }

  // —— 每一场 ——————————————————————————————————————————————————————————————
  function sceneA(ctx, f) {
    const cam = E.keys(CAM_A, f);
    E.camTo(ctx, cam);
    SC.world(ctx, f, cam, { sheen: E.prog(f, 300, 350) * 1.4 - .2 });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    SC.ambient(ctx, f, 1 - E.prog(f, 60, 140) * .4);
    SC.frameLines(ctx, 1 - E.prog(f, 30, 90));
  }
  function sceneC(ctx, f) {
    const cam = E.keys(CAM_C, f);
    E.camTo(ctx, cam);
    // 到顶以后：光扫过的地方，格子一格格翻过去露出金箔背面，再翻回来
    const wave = f > T.peak - 6 ? { t0: T.peak - 6, step: 4.2, dur: 22 } : null;
    GRID.draw(ctx, f, cam, 'out', { wave });
    SC.world(ctx, f, cam, { title: false });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (f > T.peak - 10) sweep(ctx, E.prog(f, T.peak - 10, T.whip));
    SC.ambient(ctx, f, E.prog(f, T.peak, T.peak + 40) * .8);
    counter(ctx, f);
  }
  function sceneF(ctx, f) {
    const cam = E.keys(CAM_F, f);
    ctx.fillStyle = P.ink; ctx.fillRect(0, 0, 1920, 1080);
    E.camTo(ctx, cam);
    const swap = f >= T.merge + 22 ? SWAP : Object.fromEntries(Object.entries(SWAP).filter(([k]) => k !== COVERS_CELL.join(',')));
    if (f < T.m4 + 22) GRID.draw(ctx, f, cam, 'in', { swap });
    const tA = E.prog(f, T.m4, T.m4 + 26);
    SC.world(ctx, f, cam, { title: tA > 0, titleAlpha: tA, sheen: E.prog(f, T.final + 2, T.final + 44) * 1.4 - .2 });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (f < T.m4 + 10) sweep(ctx, E.prog(f, T.merge + 10, T.m4 + 10), .22);
    if (f >= T.final) sweep(ctx, E.prog(f, T.final + 4, T.final + 70), .36);
    SC.ambient(ctx, f, E.prog(f, T.final - 30, T.final + 10) * .7, .7);
    SC.frameLines(ctx, E.prog(f, T.final + 6, T.final + 40));
    return cam;
  }
  // 封面那一场缩进 64 格里的一格
  function coversIntoCell(ctx, f, cam) {
    const t = E.ease.o5(E.prog(f, T.merge, T.merge + 22));
    if (t >= 1) return;
    const [c, r] = COVERS_CELL, s = GRID.S, x = GRID.X0 + c * s + 14, y = GRID.X0 + r * s + 14;
    const [sx, sy] = E.toScreen(cam, x, y), side = (s - 28) * cam.z;
    const lb = LB.getContext('2d'); lb.setTransform(1, 0, 0, 1, 0, 0); MON.covers(lb, f);
    const srcX = E.lerp(0, 420, t), srcW = E.lerp(1920, 1080, t);
    const dx = E.lerp(0, sx, t), dy = E.lerp(0, sy, t), dw = E.lerp(1920, side, t), dh = E.lerp(1080, side, t);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 40 * (1 - t);
    ctx.drawImage(LB, srcX, 0, srcW, 1080, dx, dy, dw, dh); ctx.restore();
  }
  function signature(ctx, f) {
    const t = E.prog(f, T.final + 24, T.final + 44); if (t <= 0) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.textAlign = 'right';
    const e = E.ease.o3(t);
    ctx.globalAlpha = e; ctx.fillStyle = P.gold; ctx.font = '700 54px Song'; ctx.fillText('观默', 1866, 1032 + (1 - e) * 16);
    ctx.font = '500 22px Jost'; ctx.letterSpacing = '3px'; ctx.fillStyle = P.bone; ctx.globalAlpha = e * .85;
    ctx.fillText('@guanmo_ai', 1866 - 132, 1026 + (1 - e) * 16); ctx.letterSpacing = '0px';
    ctx.restore();
  }

  // —— 总装 ————————————————————————————————————————————————————————————————
  function draw(ctx, f) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.filter = 'none';
    ctx.fillStyle = P.ink; ctx.fillRect(0, 0, 1920, 1080);
    const a = LA.getContext('2d'), b = LB.getContext('2d');
    [a, b].forEach(x => { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; });

    if (f < T.bass) sceneA(ctx, f);
    else if (f < T.whip - 8) sceneC(ctx, f);
    else if (f < T.whip + 12) {
      // 甩镜：64 格往左甩出去，字从右边甩进来
      a.fillStyle = P.ink; a.fillRect(0, 0, 1920, 1080); sceneC(a, f);
      MON.letters(b, f);
      const p = E.ease.ioexp(E.prog(f, T.whip - 8, T.whip + 12)), off = p * 2200;
      ctx.drawImage(LA, -off, 0); ctx.drawImage(LB, 2200 - off, 0);
    }
    else if (f < T.drop) MON.letters(ctx, f);
    else if (f < T.drop + 22) {
      // 方形光圈：从 O 字怀里的小方点打开，里面是海报
      MON.letters(ctx, f);
      MON.poster(b, f);
      const [dx, dy, ds] = MON.dotScreen(T.drop), t = E.ease.o5(E.prog(f, T.drop, T.drop + 20));
      const half = E.lerp(ds / 2, 1500, t), cx = E.lerp(dx, 960, t), cy = E.lerp(dy, 540, t);
      ctx.save(); ctx.beginPath(); ctx.rect(cx - half, cy - half, half * 2, half * 2); ctx.clip(); ctx.drawImage(LB, 0, 0); ctx.restore();
      ctx.strokeStyle = P.gold; ctx.lineWidth = 6; ctx.globalAlpha = 1 - t; ctx.strokeRect(cx - half, cy - half, half * 2, half * 2); ctx.globalAlpha = 1;
    }
    else if (f < T.flip) MON.poster(ctx, f);
    else if (f < T.dolly) MON.flipCard(ctx, f);
    else if (f < T.rack) MON.dolly(ctx, f);
    else if (f < T.checker) MON.rack(ctx, f);
    else if (f < T.checker + 36) {
      MON.rack(a, f); MON.covers(b, f);
      MON.checkerWipe(ctx, f, LA, LB, T.checker);
    }
    else if (f < T.merge) MON.covers(ctx, f);
    else { const cam = sceneF(ctx, f); coversIntoCell(ctx, f, cam); }

    SC.labels(ctx, f);
    signature(ctx, f);
    SC.post(ctx, f);
  }
  return { init, draw, blurBoost };
})();
