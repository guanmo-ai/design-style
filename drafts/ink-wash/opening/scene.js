// 水墨 · 开场 8 秒：写“水”→ 甩出一滴墨 → 落纸晕开 → 8 只小蝌蚪 → 搭成齐白石的虾 → 镜头拉远：倪瓒的一河两岸
(function () {
  const B = window.Brush, TL = window.TL;
  const W0 = 1920, H0 = 1080;
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const eio = x => { x = cl(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const eo3 = x => 1 - Math.pow(1 - cl(x), 3);
  const lerp = (a, b, u) => a + (b - a) * u;
  const INK = '20,20,19';

  // —— 纸 ——
  const paper = document.createElement('canvas');
  paper.width = W0; paper.height = H0;
  (() => {
    const x = paper.getContext('2d');
    x.fillStyle = '#F2EDE1'; x.fillRect(0, 0, W0, H0);
    const r = B.rng(7);
    for (let i = 0; i < 9000; i++) {
      const px = r() * W0, py = r() * H0, l = 6 + r() * 30, a = r() * .05;
      x.strokeStyle = `rgba(120,100,70,${a})`; x.lineWidth = .6;
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + l, py + (r() - .5) * 3); x.stroke();
    }
    const g = x.createRadialGradient(W0 / 2, H0 / 2, H0 * .3, W0 / 2, H0 / 2, H0 * .95);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(60,45,20,.10)');
    x.fillStyle = g; x.fillRect(0, 0, W0, H0);
  })();

  // —— 00 · “水”（世界坐标，字框 900，中心在原点）——
  const U = (x, y) => [(x - .5) * 900, (y - .5) * 900];
  const SHUI = [
    { t: TL.s1, def: { pts: [U(.52, .04), U(.53, .20), U(.53, .50), U(.52, .80), U(.51, .90), U(.42, .83)], w: [[0, .9], [.06, 1], [.15, .78], [.75, .72], [.86, .82], [.93, .6], [1, .06]], size: 112, tone: .95, dry: .45, seed: 11 } },
    { t: TL.s2, def: { pts: [U(.12, .34), U(.25, .31), U(.37, .30), U(.35, .38), U(.27, .53), U(.10, .74)], w: [[0, .7], [.06, .88], [.3, .55], [.42, .82], [.52, .74], [1, .05]], size: 82, tone: .92, dry: .55, seed: 12 } },
    { t: TL.s3, def: { pts: [U(.83, .20), U(.75, .30), U(.66, .40), U(.57, .47)], w: [[0, .85], [.1, .95], [1, .22]], size: 76, tone: .92, dry: .7, seed: 13 } },
    { t: TL.s4, def: { pts: [U(.58, .45), U(.68, .58), U(.78, .72), U(.88, .83), U(.97, .86)], w: [[0, .3], [.5, .75], [.8, 1.06], [.9, .9], [1, .04]], size: 108, tone: .94, dry: .6, seed: 14 } }
  ].map(s => ({ t: s.t, st: B.make(s.def) }));
  const strokeP = (s, t) => B.progress((t - s.t[0]) / s.t[1]);

  // —— 墨点飞溅 ——
  const drops = [];
  (() => {
    const r = B.rng(31);
    const s1 = SHUI[0].st;
    for (let i = 0; i < 22; i++) {           // 竖钩行笔时甩出去的（第 0 帧就在空中）
      const p = .15 + .4 * r(), hd = B.head(s1, p), side = r() < .5 ? -1 : 1, sp = 500 + 1400 * r();
      drops.push({ t0: TL.s1[0] + TL.s1[1] * (.18 + .3 * r()), x: hd.x + hd.nx * side * hd.w * .5, y: hd.y + hd.ny * side * hd.w * .5, vx: hd.nx * side * sp + (r() - .5) * 200, vy: hd.ny * side * sp + 400 * r(), k: 5 + 5 * r(), r: 3 + 11 * r() });
    }
    const s4 = SHUI[3].st, tip = B.head(s4, 1);
    for (let i = 0; i < 16; i++) {           // 捺出锋时往右喷出去的
      const a = -.25 + .5 * r(), sp = 500 + 1300 * r();
      drops.push({ t0: TL.s4[0] + TL.s4[1] * (.86 + .1 * r()), x: tip.x - 20, y: tip.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, k: 5 + 5 * r(), r: 1.5 + 6 * r() });
    }
    const L = [1520, 700];
    for (let i = 0; i < 14; i++) {           // 落纸时溅起的一圈，飞到墨团外面
      const a = r() * 6.283, sp = 1500 + 1500 * r();
      drops.push({ t0: TL.land, x: L[0], y: L[1], vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, k: 8 + 6 * r(), r: 2 + 6 * r() });
    }
  })();
  function drawDrops(ctx, t) {
    ctx.fillStyle = `rgba(${INK},.92)`;
    for (const d of drops) {
      const tau = t - d.t0;
      if (tau < 0) continue;
      const f = (1 - Math.exp(-d.k * tau)) / d.k;
      ctx.beginPath(); ctx.arc(d.x + d.vx * f, d.y + d.vy * f, d.r, 0, 6.283); ctx.fill();
    }
  }

  // —— 印章 ——
  function drawSeal(ctx, t) {
    const u = (t - TL.seal) / (7 / 60);
    if (u < 0) return;
    const s = 1.5 - .5 * eo3(u);
    ctx.save();
    ctx.translate(-330, -300);
    ctx.rotate(-.05);
    ctx.scale(s, s);
    ctx.fillStyle = '#C8372D';
    ctx.globalAlpha = .95;
    ctx.beginPath(); ctx.roundRect(-58, -58, 116, 116, 8); ctx.fill();
    ctx.fillStyle = '#F2EDE1';
    ctx.font = '900 86px "Noto Serif SC"';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('墨', 0, 6);
    const r = B.rng(5);
    ctx.fillStyle = 'rgba(242,237,225,.55)';
    for (let i = 0; i < 70; i++) { ctx.beginPath(); ctx.arc(-58 + 116 * r(), -58 + 116 * r(), .8 + 2.2 * r(), 0, 6.283); ctx.fill(); }
    ctx.restore();
  }

  // —— 甩出去的那滴墨 ——
  const TIP = B.head(SHUI[3].st, 1), LAND = [1520, 700];
  function dropPos(t) {
    const u = cl((t - TL.launch) / (TL.land - TL.launch));
    const e = u * u * (3 - 2 * u) * .25 + u * .75;
    return { x: lerp(TIP.x, LAND[0], e), y: lerp(TIP.y, LAND[1], e) - 300 * Math.sin(Math.PI * e), s: 1 + 1.3 * Math.sin(Math.PI * e) };
  }
  function drawFlyingDrop(ctx, t) {
    if (t < TL.launch || t >= TL.land) return;
    const p = dropPos(t);
    ctx.fillStyle = `rgba(${INK},.95)`;
    ctx.beginPath(); ctx.arc(p.x, p.y, 15 * p.s, 0, 6.283); ctx.fill();
  }

  // —— 落纸晕开 ——
  const nb = B.noise1(41), nb2 = B.noise1(42);
  function drawBloom(ctx, t) {
    const tau = t - TL.land;
    if (tau < 0) return;
    const R = 140 * (1 - Math.exp(-tau * 7)) + 12;
    const fade = (1 - .62 * cl((tau - .5) / 1.2)) * (1 - cl((t - TL.pull[0]) / .4));   // 墨被小蝌蚪带走；拉远前淡出
    if (fade <= 0) return;
    ctx.save();
    ctx.translate(LAND[0], LAND[1]);
    const shape = (k, amp) => {
      ctx.beginPath();
      for (let i = 0; i <= 140; i++) {
        const a = i / 140 * 6.283;
        const fing = Math.pow(Math.max(0, nb2(a * 9 + k) - .55) / .45, 2) * .55;      // 墨指：沿纸纤维钻出去
        const rr = R * (1 + amp * (nb(a * 1.6 + k) - .5) + .08 * (nb2(a * 7) - .5) + fing * cl(tau * 3));
        i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(rr, 0);
      }
    };
    // 外圈淡墨晕（水走得比墨远）
    ctx.fillStyle = `rgba(${INK},${.10 * fade})`;
    ctx.save(); ctx.scale(1.22, 1.18); shape(3, .3); ctx.fill(); ctx.restore();
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 1.25);
    g.addColorStop(0, `rgba(${INK},${.93 * fade})`);
    g.addColorStop(.55, `rgba(${INK},${.70 * fade})`);
    g.addColorStop(.76, `rgba(${INK},${.88 * fade})`);
    g.addColorStop(.86, `rgba(${INK},${.35 * fade})`);
    g.addColorStop(1, `rgba(${INK},0)`);
    ctx.fillStyle = g;
    shape(0, .24); ctx.fill();
    ctx.restore();
  }

  // —— 齐白石的虾（本地坐标，朝左）——
  const SHRIMP_O = [2330, 1330];
  const spine = [[40, 0], [105, 12], [160, 45], [195, 100], [205, 160]];
  const spSt = B.make({ pts: spine, size: 1, w: [[0, 1], [1, 1]] });
  function spAt(u) { const h = B.head(spSt, u); return { x: h.x, y: h.y, tx: h.ny, ty: -h.nx, nx: h.nx, ny: h.ny }; }
  const SH = [];   // { t0, dur, st }
  const add = (t0, dur, def) => { const st = B.make(def); SH.push({ t0, dur, st }); return st; };
  add(TL.head, .16, { pts: [[-70, -8], [-20, -6], [45, 2]], w: [[0, .12], [.25, .78], [.65, 1], [1, .72]], size: 76, tone: .30, dry: .12, seed: 51, bristles: 72 });
  add(TL.brain, .10, { pts: [[-10, -12], [12, -6], [30, 6]], w: [[0, .4], [.4, 1], [1, .15]], size: 14, tone: .96, dry: .2, seed: 52, bristles: 24 });
  add(TL.brain + .06, .07, { pts: [[-62, -12], [-112, -26]], w: [[0, 1], [1, .2]], size: 7, tone: .8, dry: .3, seed: 53, bristles: 12 });
  add(4.453, .05, { pts: [[-60, -22], [-80, -38]], w: [[0, .5], [1, 1]], size: 8, tone: .96, dry: .1, seed: 54, bristles: 12 });
  add(4.51, .05, { pts: [[-56, -15], [-78, -24]], w: [[0, .5], [1, 1]], size: 8, tone: .96, dry: .1, seed: 55, bristles: 12 });
  const SEG = [];
  for (let k = 0; k < 5; k++) {
    const u = .08 + k * .2, c = spAt(u), len = 50 - k * 4, wd = 60 - k * 6;
    const a = [c.x - c.tx * len * .5, c.y - c.ty * len * .5], b = [c.x + c.tx * len * .5, c.y + c.ty * len * .5], m = [c.x + c.nx * 7, c.y + c.ny * 7];
    SEG.push({ x: c.x, y: c.y });
    add(TL.segStart + k * TL.tadStep, .10, { pts: [a, m, b], w: [[0, .4], [.5, 1], [1, .38]], size: wd, tone: .24, dry: .14, seed: 60 + k, bristles: 72, wet: 1.4 });
  }
  const tailDefs = [[[205, 165], [192, 214]], [[208, 166], [212, 224]], [[212, 164], [238, 208]]];
  tailDefs.forEach((p, i) => {
    SEG.push({ x: p[0][0], y: p[0][1] + 18 });
    add(TL.segStart + (5 + i) * TL.tadStep, .09, { pts: p, w: [[0, .6], [.5, 1], [1, .4]], size: 28, tone: .26, dry: .14, seed: 70 + i, bristles: 40, wet: 1.4 });
  });
  for (let j = 0; j < 6; j++) add(TL.legs + j * .03, .05, { pts: [[60 + j * 26, 30 + j * 13], [44 + j * 24, 68 + j * 15]], w: [[0, 1], [1, .3]], size: 4.5, tone: .72, dry: .3, seed: 80 + j, bristles: 10 });
  const claw = (t0, pts, palm, p1, p2, s) => {
    add(t0, .20, { pts, w: [[0, 1], [.6, .8], [1, .6]], size: 8, tone: .86, dry: .2, seed: s, bristles: 16 });
    add(t0 + .17, .06, { pts: palm, w: [[0, .6], [.5, 1], [1, .7]], size: 20, tone: .82, dry: .3, seed: s + 1, bristles: 20 });
    add(t0 + .22, .04, { pts: p1, w: [[0, 1], [1, .2]], size: 6, tone: .9, dry: .2, seed: s + 2, bristles: 10 });
    add(t0 + .24, .04, { pts: p2, w: [[0, 1], [1, .2]], size: 6, tone: .9, dry: .2, seed: s + 3, bristles: 10 });
  };
  claw(TL.claw1, [[-40, 18], [-120, 48], [-200, 60], [-268, 42]], [[-268, 42], [-318, 28]], [[-318, 28], [-372, 8]], [[-316, 34], [-368, 46]], 90);
  claw(TL.claw2, [[-30, 26], [-100, 82], [-170, 112], [-232, 106]], [[-232, 106], [-282, 98]], [[-282, 98], [-334, 80]], [[-280, 104], [-330, 122]], 95);
  const feel = [
    [[-74, -24], [-170, -110], [-160, -210], [-20, -268], [230, -240]],
    [[-70, -18], [-210, -70], [-262, -150], [-190, -250]],
    [[-72, -20], [-160, -44], [-250, -30]],
    [[-70, -28], [-122, -140], [-62, -232], [90, -300]]
  ];
  feel.forEach((p, j) => add(TL.feelers + j * .035, .14, { pts: p, w: [[0, 1], [1, .25]], size: 3.4, tone: .92, dry: .12, seed: 100 + j, bristles: 8, wet: 0 }));
  function shrimpXform(ctx, t) {
    const u = cl((t - TL.flick) / .2);
    const back = 150 * eo3(u), rot = -.06 * Math.sin(Math.PI * u);
    ctx.translate(SHRIMP_O[0] + back, SHRIMP_O[1]);
    ctx.rotate(rot);
  }
  function drawShrimp(ctx, t) {
    if (t < TL.head) return;
    ctx.save();
    shrimpXform(ctx, t);
    for (const e of SH) if (t >= e.t0) B.draw(ctx, e.st, B.progress((t - e.t0) / e.dur));
    ctx.restore();
  }

  // —— 小蝌蚪 ——
  const TAD = [];
  for (let k = 0; k < TL.tadN; k++) {
    const ts = TL.land + k * TL.tadStep, ang = -1.1 + k * .31;
    const tgt = SEG[k], ta = TL.segStart + k * TL.tadStep;
    TAD.push({ k, ts, ang, ta, td: ta - .5, tgt: [SHRIMP_O[0] + tgt.x, SHRIMP_O[1] + tgt.y], off: [Math.cos(k * 2.4) * 70, Math.sin(k * 2.4) * 46] });
  }
  function leader(t) { const u = t - 2.75; return [1640 + 250 * u, 720 + 150 * u + 70 * Math.sin(u * 3.1)]; }
  function tadPos(d, t) {
    const tau = t - d.ts;
    const burst = [LAND[0] + Math.cos(d.ang) * 170 * (1 - Math.exp(-tau * 7)), LAND[1] + Math.sin(d.ang) * 150 * (1 - Math.exp(-tau * 7))];
    const L = leader(Math.max(t - d.k * .05, 2.75)), sch = [L[0] + d.off[0] - d.k * 26, L[1] + d.off[1]];
    const j = eio((tau - .35) / .5);
    let p = [lerp(burst[0], sch[0], j), lerp(burst[1], sch[1], j)];
    if (t > d.td) {
      const u = eio((t - d.td) / (d.ta - d.td));
      const Ls = leader(Math.max(d.td - d.k * .05, 2.75)), s0 = [Ls[0] + d.off[0] - d.k * 26, Ls[1] + d.off[1]];
      const ctrl = [lerp(s0[0], d.tgt[0], .5), Math.min(s0[1], d.tgt[1]) - 140];
      const a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u;
      p = [a * s0[0] + b * ctrl[0] + c * d.tgt[0], a * s0[1] + b * ctrl[1] + c * d.tgt[1]];
    }
    return p;
  }
  function drawTadpole(ctx, x, y, ang, ph, s) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
    const sq = 1 + .08 * Math.sin(ph * 2);
    // 尾巴：一笔，越往后越细越淡
    ctx.beginPath();
    const up = [], dn = [];
    for (let i = 0; i <= 18; i++) {
      const u = i / 18, tx = -12 - u * 78, ty = Math.sin(ph - u * 5) * u * 15, w = Math.pow(1 - u, 1.25) * 9;
      up.push([tx, ty - w]); dn.push([tx, ty + w]);
    }
    up.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    dn.reverse().forEach(p => ctx.lineTo(p[0], p[1]));
    ctx.closePath();
    const tg = ctx.createLinearGradient(-12, 0, -90, 0);
    tg.addColorStop(0, `rgba(${INK},.88)`); tg.addColorStop(1, `rgba(${INK},.25)`);
    ctx.fillStyle = tg; ctx.fill();
    // 头：一个墨点，中心浓、边缘晕开
    const g = ctx.createRadialGradient(2, -2, 2, 0, 0, 26);
    g.addColorStop(0, `rgba(${INK},.97)`); g.addColorStop(.72, `rgba(${INK},.9)`); g.addColorStop(.9, `rgba(${INK},.5)`); g.addColorStop(1, `rgba(${INK},0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, 24 * sq, 19 / sq, 0, 0, 6.283); ctx.fill();
    ctx.restore();
  }
  function drawTadpoles(ctx, t) {
    for (const d of TAD) {
      if (t < d.ts || t > d.ta + .09) continue;
      const p = tadPos(d, t), q = tadPos(d, t + .012), pr = tadPos(d, t - .012);
      const ang = Math.atan2(q[1] - pr[1], q[0] - pr[0]);
      const sp = Math.hypot(q[0] - pr[0], q[1] - pr[1]) / .024;
      const born = eo3((t - d.ts) / .12), die = 1 - cl((t - d.ta) / .09);
      drawTadpole(ctx, p[0], p[1], ang, t * (14 + sp * .02) + d.k * 1.7, (.4 + .6 * born * die) * 1.25);
    }
  }

  // —— 倪瓒 · 一河两岸（坐标按最后的画面倒推：题款左上，远山右上，河在中间，近岸左下）——
  const LS = [];
  const addL = (t0, dur, def) => LS.push({ t0, dur, st: B.make(def) });
  addL(TL.rock, .30, { pts: [[-1700, 2700], [-900, 2520], [0, 2480], [900, 2600]], w: [[0, .3], [.2, .9], [.8, 1], [1, .2]], size: 170, tone: .52, dry: 1.0, seed: 201 });
  addL(TL.rock + .117, .25, { pts: [[-1400, 2830], [-500, 2760], [500, 2810]], w: [[0, .3], [.5, 1], [1, .2]], size: 120, tone: .40, dry: 1.1, seed: 202 });
  addL(TL.rock + .2, .12, { pts: [[-700, 2560], [-560, 2650]], w: [[0, 1], [1, .3]], size: 50, tone: .75, dry: .9, seed: 203, bristles: 24 });
  addL(TL.rock + .26, .12, { pts: [[200, 2540], [330, 2610]], w: [[0, 1], [1, .3]], size: 44, tone: .7, dry: .9, seed: 204, bristles: 24 });
  [-1150, -880, -520, -150].forEach((x, i) => {
    const t0 = TL.trees + i * TL.tadStep;
    addL(t0, .18, { pts: [[x, 2560], [x - 24, 2120], [x + 14, 1700], [x - 8, 1300]], w: [[0, 1], [.7, .72], [1, .3]], size: 40, tone: .82, dry: .5, seed: 210 + i, bristles: 30 });
    addL(t0 + .1, .08, { pts: [[x + 4, 1720], [x + 70, 1640], [x + 130, 1580]], w: [[0, 1], [1, .3]], size: 13, tone: .8, dry: .4, seed: 220 + i, bristles: 12 });
    addL(t0 + .14, .08, { pts: [[x - 6, 1520], [x - 60, 1450], [x - 120, 1400]], w: [[0, 1], [1, .3]], size: 12, tone: .8, dry: .4, seed: 230 + i, bristles: 12 });
    const r = B.rng(300 + i);
    for (let k = 0; k < 16; k++) {
      const cx = x - 180 + 360 * r(), cy = 1230 + 440 * r();
      addL(TL.leaves + .32 * r(), .05, { pts: [[cx, cy], [cx + 46, cy + 8]], w: [[0, .7], [.5, 1], [1, .5]], size: 36, tone: .62 + .25 * r(), dry: .5, seed: 400 + i * 30 + k, bristles: 16 });
    }
  });
  addL(TL.spit, .2, { pts: [[2300, 880], [3000, 815]], w: [[0, .3], [.5, 1], [1, .2]], size: 70, tone: .34, dry: .8, seed: 503 });
  // 远山：淡墨山形从左往右扫出来，再沿山脊皴两笔干墨
  function makeRange(seed, x0, x1, base, peak, n) {
    const nz = B.noise1(seed), pts = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, env = Math.pow(Math.sin(Math.PI * u), .6);
      pts.push([lerp(x0, x1, u), base - peak * env * (.42 + .58 * nz(u * 5.3)) * (.86 + .14 * Math.sin(u * 19))]);
    }
    return { pts, x0, x1, base, peak };
  }
  const RANGES = [
    { R: makeRange(611, 2900, 6000, 800, 780, 90), t0: TL.mtn, dur: .55, tone: .30 },
    { R: makeRange(613, 2600, 4300, 850, 380, 50), t0: TL.mtn3, dur: .35, tone: .36 },
    { R: makeRange(612, 3500, 5900, 840, 430, 70), t0: TL.mtn2, dur: .45, tone: .48 }
  ];
  RANGES.forEach((g, j) => {
    const sub = g.R.pts.filter((_, i) => i % 6 === 0 && i > 3 && i < g.R.pts.length - 4).map(p => [p[0], p[1] + 30]);
    addL(g.t0 + .15, g.dur, { pts: sub, w: [[0, .3], [.3, 1], [.8, .8], [1, .2]], size: 80 - j * 15, tone: .45 + j * .08, dry: 1.3, seed: 620 + j });
  });
  function drawRange(ctx, R, prog, tone) {
    if (prog <= 0) return;
    ctx.save();
    ctx.beginPath(); ctx.rect(R.x0 - 50, R.base - R.peak * 1.3, (R.x1 - R.x0 + 100) * prog, R.peak * 1.7); ctx.clip();
    const g = ctx.createLinearGradient(0, R.base - R.peak, 0, R.base + 80);
    g.addColorStop(0, `rgba(${INK},${tone})`); g.addColorStop(.6, `rgba(${INK},${tone * .55})`); g.addColorStop(1, `rgba(${INK},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    R.pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.lineTo(R.x1, R.base + 80); ctx.lineTo(R.x0, R.base + 80); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function drawLandscape(ctx, t) {
    for (const g of RANGES) if (t >= g.t0) drawRange(ctx, g.R, B.progress((t - g.t0) / g.dur), g.tone);
    for (const e of LS) if (t >= e.t0) B.draw(ctx, e.st, B.progress((t - e.t0) / e.dur));
  }

  // —— 镜头：中心 + 对数缩放；关键帧之间 easeInOutCubic；落地只往下“咚”一下 ——
  const CK = [
    [0.00, 24, -170, 2.4, 'o'], [0.47, 0, 30, 1.0], [1.95, 40, 10, 1.07], [2.30, 1450, 690, 1.55], [2.62, 1500, 705, 1.42],
    [4.02, 2120, 1160, 1.28], [4.30, 2290, 1320, 1.52], [TL.pull[0], 2300, 1320, 1.66], [TL.pull[1], 1900, 1000, .23], [8.0, 1935, 990, .236]
  ];
  function camera(t) {
    let i = 0;
    while (i < CK.length - 2 && t > CK[i + 1][0]) i++;
    const a = CK[i], b = CK[i + 1], u = (a[4] === 'o' ? eo3 : eio)((t - a[0]) / (b[0] - a[0]));
    const z = Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), u));
    let cx = lerp(a[1], b[1], u), cy = lerp(a[2], b[2], u);
    // 跟着那滴墨走一点（飞行时）
    if (t > 1.95 && t < TL.land + .2) {
      const p = dropPos(Math.min(t, TL.land)), w = Math.sin(Math.PI * cl((t - 1.95) / (TL.land + .2 - 1.95))) * .45;
      cx = lerp(cx, p.x, w); cy = lerp(cy, p.y, w);
    }
    if (t > 2.5 && t < 4.3) {
      // 跟着小蝌蚪的重心走（取实际位置，不取领头路线）
      let sx = 0, sy = 0, n = 0;
      for (const d of TAD) { if (t < d.ts || t > d.ta) continue; const p = tadPos(d, t); sx += p[0]; sy += p[1]; n++; }
      if (n) { const w = .8 * Math.sin(Math.PI * cl((t - 2.5) / (4.3 - 2.5))); cx = lerp(cx, sx / n, w); cy = lerp(cy, sy / n, w); }
    }
    let dip = 0;
    for (const [ts, A] of [[TL.seal, 9], [TL.land, 14], [TL.flick, 7]]) if (t >= ts) dip += A * (1 - Math.exp(-(t - ts) * 90)) * Math.exp(-(t - ts) * 11);
    return { cx, cy, z, dip };
  }
  const toScreen = (c, x, y) => [(x - c.cx) * c.z + W0 / 2, (y - c.cy) * c.z + H0 / 2 + c.dip];

  function drawWorld(ctx, t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.drawImage(paper, 0, 0);
    const c = camera(t);
    ctx.setTransform(c.z, 0, 0, c.z, W0 / 2 - c.cx * c.z, H0 / 2 - c.cy * c.z + c.dip);
    drawBloom(ctx, t);
    drawLandscape(ctx, t);
    for (const s of SHUI) B.draw(ctx, s.st, strokeP(s, t));
    drawSeal(ctx, t);
    drawDrops(ctx, t);
    drawFlyingDrop(ctx, t);
    drawShrimp(ctx, t);
    drawTadpoles(ctx, t);
  }

  // —— 外框和读数（DOM）——
  const $ = id => document.getElementById(id);
  const CHAP = [
    [0, '00', '水墨', 'INK WASH', '一笔下去，起 · 行 · 收，粗细由笔速决定'],
    [TL.land, '01', '小蝌蚪找妈妈', '1960 · 上海美术电影制片厂', '中国第一部水墨动画：一个墨点是身体，一笔是尾巴'],
    [TL.head, '02', '虾', '齐白石 · 1940—50 年代', '淡墨一节一节压出来，焦墨点睛'],
    [TL.flick, '03', '容膝斋图', '倪瓒 · 1372', '一河两岸，中间什么都不画'],
    [TL.ui0, '04', '落到界面', '茶馆 App · 墨舍（虚构）', '按下是一滴墨，转场是墨晕满，确认是盖章'],
    [TL.rules0, '05', '五条规则', 'FIVE RULES', '每张卡用自己的方法演示自己']
  ];
  let curChap = -1;
  function label(id, show, x, y, html) {
    const e = $(id);
    e.style.opacity = show;
    if (show > 0) { e.style.transform = `translate(${x}px, ${y}px)`; if (html != null && e._h !== html) { e.innerHTML = html; e._h = html; } }
  }
  function overlay(t) {
    let ci = 0;
    for (let i = 0; i < CHAP.length; i++) if (t >= CHAP[i][0]) ci = i;
    const ch = CHAP[ci];
    if (ci !== curChap) {
      curChap = ci;
      $('cn').textContent = ch[1]; $('ct').textContent = ch[2]; $('cy').textContent = ch[3]; $('cs').textContent = ch[4];
      $('pg').textContent = `${ch[1]} / 05`;
    }
    const rise = ci === 0 ? 1 : eo3((t - ch[0]) / (16 / 60));
    for (const id of ['cn', 'ct', 'cy', 'cs']) $(id).style.transform = `translateY(${(1 - rise) * 110}%)`;
    const c = camera(t);
    // 00 · 笔速 → 粗细
    let shown = false;
    for (let i = 0; i < 4; i++) {
      const s = SHUI[i], tau = (t - s.t[0]) / s.t[1];
      if (tau > .05 && tau < 1.15) {
        const p = B.progress(Math.min(tau, 1)), p2 = B.progress(Math.min(tau + .03, 1)), v = (p2 - p) / .03;
        const h = B.head(s.st, p), sc = toScreen(c, h.x + 70, h.y - 40);
        label('rd', 1, sc[0], sc[1], `笔速 <b>${v.toFixed(2)}</b> · 粗 <b>${(h.w / s.st.maxW).toFixed(2)}</b>`);
        shown = true;
      }
    }
    if (!shown) label('rd', 0);
    // 01
    if (t > TL.land + .05 && t < TL.land + .9) { const sc = toScreen(c, LAND[0] + 150, LAND[1] - 110); label('r1', cl((t - TL.land) / .15), sc[0], sc[1], '落纸 · 0.3 秒晕开'); } else label('r1', 0);
    if (t > 2.95 && t < 4.0) { const L = leader(t - .2), sc = toScreen(c, L[0] - 60, L[1] - 150); label('r2', cl((t - 2.95) / .15) * (1 - cl((t - 3.85) / .15)), sc[0], sc[1], '8 只 · 每只 = 1 个墨点 + 1 笔'); } else label('r2', 0);
    // 02
    const sh = (x, y) => toScreen(c, SHRIMP_O[0] + x, SHRIMP_O[1] + y);
    const out02 = 1 - cl((t - TL.pull[0]) / .12);
    if (t > TL.brain + .05) { const p = sh(0, -150); label('r3', cl((t - TL.brain) / .12) * out02, p[0], p[1], '焦墨 <b>95%</b> · 点睛'); } else label('r3', 0);
    if (t > TL.segStart + .4) { const p = sh(250, 40); label('r4', cl((t - TL.segStart - .4) / .12) * out02, p[0], p[1], '淡墨 <b>36%</b> · 一节一笔'); } else label('r4', 0);
    if (t > TL.feelers + .1) { const p = sh(-120, -300); label('r5', cl((t - TL.feelers - .1) / .12) * out02, p[0], p[1], '须 · 一笔 <b>0.14 秒</b>'); } else label('r5', 0);
    // 03
    const box = $('lb');
    if (t > TL.liubai - .1) { const a = toScreen(c, 1300, 1050), b = toScreen(c, 3500, 1950); box.style.opacity = cl((t - TL.liubai + .1) / .15); box.style.left = a[0] + 'px'; box.style.top = a[1] + 'px'; box.style.width = (b[0] - a[0]) * eo3((t - TL.liubai + .1) / .25) + 'px'; box.style.height = (b[1] - a[1]) + 'px'; } else box.style.opacity = 0;
    if (t > TL.liubai) { const p = toScreen(c, 2300, 1560); label('r6', cl((t - TL.liubai) / .2), p[0], p[1], '留白 <b>64%</b>'); } else label('r6', 0);
    if (t > TL.pull[1] + .1) { const p = toScreen(c, -460, 560); label('r7', cl((t - TL.pull[1] - .1) / .2), p[0], p[1], '开头写的“水”= 题款'); } else label('r7', 0);
      if (t >= TL.ui0) {
      for (const id of ['rd', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7']) label(id, 0);
      $('lb').style.opacity = 0;
      const ui = t < TL.rules0 - .15;
      label('r8', ui && t > TL.rows + .3 ? 1 : 0, 250, 560, '列表 · 每行从遮罩里升起 <b>16 帧</b>');
      label('r9', ui && t > TL.tap ? 1 : 0, 1240, 520, '按下 = 一滴墨 · <b>0.3 秒</b>晕开');
      label('r10', ui && t > TL.wipeUI ? 1 : 0, 1240, 580, '转场 = 同一滴墨晕满 → 退到四角 · <b>900ms</b>');
      label('r11', ui && t > TL.seal2 ? 1 : 0, 250, 620, '确认 = 盖章 · <b>1.5 → 1</b> · 红色只给“确认”');
    } else for (const id of ['r8', 'r9', 'r10', 'r11']) label(id, 0);
    const endA = 1 - cl((t - TL.end0 + .1) / .15);
    document.querySelector('.frame').style.opacity = endA; $('pg').style.opacity = endA;
  }

  // ═══════════ 04 落到界面 · 05 五条规则 · 片尾（8 秒以后，屏幕坐标）═══════════
  const PH = { x: 745, y: 96, w: 430, h: 888, r: 60 }, SC = { x: 757, y: 108, w: 406, h: 864, r: 48 };
  const HR = { x: SC.x, y: SC.y, w: SC.w, h: 330 };
  let STILL = null, BOX = null;
  function ensureStill() {
    if (STILL) return;
    STILL = document.createElement('canvas'); STILL.width = W0; STILL.height = H0;
    drawWorld(STILL.getContext('2d'), TL.ui0 - .03);
    const c = camera(TL.ui0 - .03), a = toScreen(c, 1300, 1050), b = toScreen(c, 3500, 1950);
    BOX = { x: a[0], y: a[1], w: b[0] - a[0], h: b[1] - a[1] };
  }
  // 配图取景：从“留白”框平滑移到 “水” + 枯树 + 虾 那一块
  const HSRC = { x: 160, y: 170, w: 1300, h: 820 };
  function heroT(src) {
    src = src || HSRC;
    let w = HR.h * src.w / src.h, h = HR.h;
    if (w < HR.w) { w = HR.w; h = HR.w * src.h / src.w; }
    return { x: HR.x + HR.w / 2 - w / 2, y: HR.y + HR.h / 2 - h / 2, w, h };
  }
  function drawStillMapped(ctx, R, src) {
    src = src || HSRC;
    const s = R.w / src.w;
    ctx.save(); ctx.setTransform(s, 0, 0, s, R.x - src.x * s, R.y - src.y * s); ctx.drawImage(STILL, 0, 0); ctx.restore();
  }
  const NZ = {}; const nzf = k => NZ[k] || (NZ[k] = B.noise1(k));
  function blobPath(ctx, cx, cy, R, seed, begin = true) {
    const n1 = nzf(seed), n2 = nzf(seed + 1);
    if (begin) ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const a = i / 120 * 6.283, f = Math.pow(Math.max(0, n2(a * 9) - .55) / .45, 2) * .5;
      const rr = R * (1 + .22 * (n1(a * 1.6) - .5) + .07 * (n2(a * 7) - .5) + f);
      i ? ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : ctx.moveTo(cx + rr, cy);
    }
    ctx.closePath();
  }
  function inkBlob(ctx, cx, cy, R, a, seed) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.3);
    g.addColorStop(0, `rgba(${INK},${.95 * a})`); g.addColorStop(.6, `rgba(${INK},${.78 * a})`); g.addColorStop(.8, `rgba(${INK},${.92 * a})`); g.addColorStop(1, `rgba(${INK},0)`);
    ctx.fillStyle = g; blobPath(ctx, cx, cy, R, seed); ctx.fill();
  }
  function txt(ctx, s, x, y, font, col, align = 'left') { ctx.font = font; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x, y); }
  const riseK = (t, t0) => eo3((t - t0) / (16 / 60));
  function riseText(ctx, t, t0, s, x, y, font, col, h, align) {
    const r = riseK(t, t0); if (r <= 0) return;
    ctx.save(); ctx.beginPath(); ctx.rect(x - 2000 * (align === 'center' ? 1 : 0), y - h, 4000, h * 1.25); ctx.clip();
    txt(ctx, s, x, y + (1 - r) * h, font, col, align); ctx.restore();
  }
  function sealAt(ctx, t, t0, x, y, size, ch, rot = -.05) {
    const u = (t - t0) / (7 / 60); if (u < 0) return;
    const sc = 1.5 - .5 * eo3(u);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
    ctx.fillStyle = '#C8372D'; ctx.globalAlpha = .96; ctx.beginPath(); ctx.roundRect(-size / 2, -size / 2, size, size, size * .07); ctx.fill();
    ctx.fillStyle = '#F2EDE1'; ctx.font = `900 ${size * .74}px "Noto Serif SC"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch, 0, size * .05);
    const r = B.rng(9); ctx.fillStyle = 'rgba(242,237,225,.5)';
    for (let i = 0; i < 50; i++) { ctx.beginPath(); ctx.arc(-size / 2 + size * r(), -size / 2 + size * r(), .6 + size * .018 * r(), 0, 6.283); ctx.fill(); }
    ctx.restore();
  }
  function bezel(ctx) {
    ctx.fillStyle = '#121211'; ctx.beginPath(); ctx.roundRect(PH.x, PH.y, PH.w, PH.h, PH.r); ctx.roundRect(SC.x, SC.y, SC.w, SC.h, SC.r); ctx.fill('evenodd');
    ctx.beginPath(); ctx.roundRect(SC.x + SC.w / 2 - 62, SC.y + 12, 124, 34, 17); ctx.fill();
  }
  const ROWS = [['白毫银针', '福鼎 · 一泡 3 分钟', '¥68'], ['大红袍', '武夷 · 一泡 5 分钟', '¥88'], ['祁门红茶', '安徽 · 一泡 4 分钟', '¥58'], ['凤凰单丛', '潮州 · 一泡 4 分钟', '¥78']];
  const ROW_Y0 = HR.y + HR.h + 112, ROW_H = 86, TAP = [SC.x + 290, ROW_Y0 + ROW_H * 1.5];
  function rowText(ctx, row, y, dy, col, col2) {
    const x0 = SC.x + 28;
    txt(ctx, row[0], x0, y + 40 + dy, '900 25px "Noto Serif SC"', col);
    txt(ctx, row[1], x0, y + 66 + dy, '400 14px "Geist Mono"', col2);
    txt(ctx, row[2], SC.x + SC.w - 28, y + 48 + dy, '400 18px "Geist Mono"', col, 'right');
  }
  function listPage(ctx, t) {
    ctx.fillStyle = '#F2EDE1'; ctx.fillRect(SC.x, SC.y, SC.w, SC.h);
    ctx.save(); ctx.beginPath(); ctx.rect(HR.x, HR.y, HR.w, HR.h); ctx.clip(); drawStillMapped(ctx, heroT()); ctx.restore();
    const g = ctx.createLinearGradient(0, HR.y + HR.h - 90, 0, HR.y + HR.h); g.addColorStop(0, 'rgba(242,237,225,0)'); g.addColorStop(1, 'rgba(242,237,225,1)');
    ctx.fillStyle = g; ctx.fillRect(HR.x, HR.y + HR.h - 90, HR.w, 90);
    riseText(ctx, t, TL.rows, '墨舍 · 茶单 · 今日 12 款', SC.x + 28, HR.y + HR.h + 30, '400 14px "Geist Mono"', '#6B6B66', 22);
    riseText(ctx, t, TL.rows + .06, '一盏茶的时间', SC.x + 28, HR.y + HR.h + 80, '900 36px "Noto Serif SC"', '#141413', 44);
    ROWS.forEach((row, i) => {
      const y = ROW_Y0 + i * ROW_H, r = riseK(t, TL.rows + .14 + i * TL.beat / 2);
      if (r <= 0) return;
      ctx.save(); ctx.beginPath(); ctx.rect(SC.x, y, SC.w, ROW_H); ctx.clip();
      const dy = (1 - r) * ROW_H;
      rowText(ctx, row, y, dy, '#141413', '#6B6B66');
      if (i === 1 && t >= TL.tap) {
        const R = 30 + 190 * (1 - Math.exp(-(t - TL.tap) * 8));
        inkBlob(ctx, TAP[0], TAP[1], R, 1, 77);
        ctx.save(); blobPath(ctx, TAP[0], TAP[1], R * .92, 77); ctx.clip(); rowText(ctx, row, y, 0, '#F2EDE1', '#CFC8B8'); ctx.restore();
      }
      ctx.strokeStyle = 'rgba(20,20,19,.16)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(SC.x + 28, y + ROW_H - .5); ctx.lineTo(SC.x + SC.w - 28, y + ROW_H - .5); ctx.stroke();
      ctx.restore();
    });
  }
  function detailPage(ctx, t) {
    ctx.fillStyle = '#F2EDE1'; ctx.fillRect(SC.x, SC.y, SC.w, SC.h);
    ctx.save(); ctx.globalAlpha = .16; inkBlob(ctx, SC.x + 120, SC.y + SC.h - 300, 170, 1, 91); ctx.restore();
    const x0 = SC.x + 30, T0 = TL.detail + .08;
    riseText(ctx, t, T0, '武夷 · 岩茶 · 三泡', x0, SC.y + 112, '400 14px "Geist Mono"', '#6B6B66', 22);
    riseText(ctx, t, T0 + .05, '三泡', x0, SC.y + 178, '900 52px "Noto Serif SC"', '#141413', 62);
    ['岩骨花香。', '第一泡 5 秒出汤，', '第二泡 8 秒，', '第三泡 12 秒。'].forEach((l, i) => riseText(ctx, t, T0 + .1 + i * .04, l, x0, SC.y + 250 + i * 36, '400 19px "Noto Serif SC"', '#3a3a36', 30));
    const vr = riseK(t, T0);
    ctx.save(); ctx.beginPath(); ctx.rect(SC.x + SC.w - 150, SC.y + 70, 140, 460); ctx.clip();
    ['大', '红', '袍'].forEach((c, i) => txt(ctx, c, SC.x + SC.w - 82, SC.y + 190 + i * 128 + (1 - vr) * 400, '900 118px "Noto Serif SC"', '#141413', 'center'));
    ctx.restore();
    const by = SC.y + SC.h - 118;
    ctx.fillStyle = '#141413'; ctx.beginPath(); ctx.roundRect(x0, by, SC.w - 60, 68, 34); ctx.fill();
    txt(ctx, '预约一席 · ¥88', SC.x + SC.w / 2 + 20, by + 44, '900 22px "Noto Serif SC"', '#F2EDE1', 'center');
    ctx.strokeStyle = 'rgba(242,237,225,.5)'; ctx.lineWidth = 2; ctx.strokeRect(x0 + 26, by + 18, 32, 32);
    sealAt(ctx, t, TL.seal2, x0 + 42, by + 34, 34, '约', 0);
    sealAt(ctx, t, TL.seal2 + .04, SC.x + 120, SC.y + 520, 130, '约', -.08);
  }
  function finger(ctx, t, tt, x, y) {
    const a = cl((t - tt + .14) / .08) * (1 - cl((t - tt - .18) / .1));
    if (a <= 0) return;
    const press = t > tt ? .85 : 1;
    ctx.fillStyle = `rgba(20,20,19,${.22 * a})`; ctx.beginPath(); ctx.arc(x, y, 30 * press, 0, 6.283); ctx.fill();
    ctx.strokeStyle = `rgba(242,237,225,${.9 * a})`; ctx.lineWidth = 2; ctx.stroke();
  }
  function drawUI(ctx, t) {
    ensureStill();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(paper, 0, 0);
    const m = eio((t - TL.ui0) / (TL.rows - TL.ui0));
    if (m < 1) {
      const src = { x: lerp(BOX.x, HSRC.x, m), y: lerp(BOX.y, HSRC.y, m), w: lerp(BOX.w, HSRC.w, m), h: lerp(BOX.h, HSRC.h, m) };
      const T = heroT(src);
      drawStillMapped(ctx, { x: lerp(BOX.x, T.x, m), y: lerp(BOX.y, T.y, m), w: lerp(BOX.w, T.w, m), h: lerp(BOX.h, T.h, m) }, src);
      const S = { x: lerp(BOX.x, SC.x, m), y: lerp(BOX.y, SC.y, m), w: lerp(BOX.w, SC.w, m), h: lerp(BOX.h, SC.h, m), r: lerp(0, SC.r, m) };
      const by = lerp(BOX.y + BOX.h, HR.y + HR.h, m);
      ctx.fillStyle = `rgba(242,237,225,${m})`; ctx.fillRect(S.x, by, S.w, S.y + S.h - by);
      ctx.fillStyle = `rgba(242,237,225,${cl(m * 1.6)})`; ctx.beginPath(); ctx.rect(0, 0, W0, H0); ctx.roundRect(S.x, S.y, S.w, S.h, S.r); ctx.fill('evenodd');
      ctx.strokeStyle = '#121211'; ctx.lineWidth = 24 * m; ctx.beginPath(); ctx.roundRect(S.x - 6 * m, S.y - 6 * m, S.w + 12 * m, S.h + 12 * m, S.r + 6 * m); ctx.stroke();
      ctx.setLineDash([12, 9]); ctx.strokeStyle = `rgba(200,55,45,${1 - m})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(S.x, S.y, S.w, S.h, S.r); ctx.stroke(); ctx.setLineDash([]);
      return;
    }
    ctx.save(); ctx.beginPath(); ctx.roundRect(SC.x, SC.y, SC.w, SC.h, SC.r); ctx.clip();
    if (t < TL.detail) {
      listPage(ctx, t);
      if (t >= TL.wipeUI) {   // 同一滴墨晕满整屏
        const R = 200 + 900 * eio((t - TL.wipeUI) / (TL.detail - TL.wipeUI));
        inkBlob(ctx, TAP[0], TAP[1], R, 1, 77);
      }
    } else {
      detailPage(ctx, t);
      const rh = 1150 * eo3((t - TL.detail) / .42);   // 墨退到四角
      if (rh < 1100) { ctx.fillStyle = `rgb(${INK})`; ctx.beginPath(); ctx.rect(SC.x, SC.y, SC.w, SC.h); blobPath(ctx, TAP[0], TAP[1] - 60, rh, 131, false); ctx.fill('evenodd'); }
    }
    ctx.restore();
    bezel(ctx);
    finger(ctx, t, TL.tap, TAP[0], TAP[1]);
    finger(ctx, t, TL.seal2, SC.x + 72, SC.y + SC.h - 84);
  }

  // —— 05 五条规则：每张卡自己演示自己 ——
  const RULES = [
    ['墨分五色', '一种墨，五个层级——浓淡代替灰阶'],
    ['起 · 行 · 收', '粗细不是画出来的，是笔速决定的'],
    ['留白 ≥ 60%', '空着的地方，也是画的一部分'],
    ['朱砂只用一处', '红色 ≤ 3%：只给印章和最重要的按钮'],
    ['飞白不是错', '墨不够了就断开——这就是手感']
  ];
  const DABS = [.96, .72, .48, .28, .12].map((tone, k) => B.make({ pts: [[1040 + k * 160 - 70, 560], [1040 + k * 160 + 70, 552]], w: [[0, .7], [.2, 1], [.8, .9], [1, .3]], size: 130, tone, dry: .25, seed: 800 + k }));
  const DAB_N = [['浓', '#141413'], ['焦', '#4A4A46'], ['重', '#8A8A84'], ['淡', '#BDB9AF'], ['清', '#E2DDD0']];
  const ST2 = B.make({ pts: [[990, 470], [1220, 420], [1450, 520], [1800, 450]], w: [[0, .5], [.08, 1], [.42, .3], [.7, .95], [1, .05]], size: 130, tone: .95, dry: .45, seed: 701 });
  const ST5 = B.make({ pts: [[980, 560], [1280, 500], [1560, 570], [1820, 520]], w: [[0, .7], [.1, 1], [.8, .85], [1, .3]], size: 190, tone: .96, dry: 1.55, seed: 905, bristles: 80 });
  function cardBase(ctx, i) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(paper, 0, 0);
    txt(ctx, `规则 0${i + 1} / 05`, 140, 300, '400 20px "Geist Mono"', '#C8372D');
    txt(ctx, RULES[i][0], 134, 450, '900 116px "Noto Serif SC"', '#141413');
    txt(ctx, RULES[i][1], 140, 520, '400 32px "Noto Serif SC"', '#3a3a36');
    ctx.fillStyle = '#C8372D'; ctx.fillRect(140, 560, 80, 5);
  }
  function drawCard(ctx, i, lt) {
    cardBase(ctx, i);
    if (i === 0) {
      DABS.forEach((st, k) => {
        const p = B.progress((lt - .05 - k * .08) / .2); B.draw(ctx, st, p);
        if (p > .5) { txt(ctx, DAB_N[k][0], 1040 + k * 160, 700, '900 34px "Noto Serif SC"', '#141413', 'center'); txt(ctx, DAB_N[k][1], 1040 + k * 160, 732, '400 15px "Geist Mono"', '#6B6B66', 'center'); }
      });
    } else if (i === 1) {
      const p = B.progress((lt - .05) / .6); B.draw(ctx, ST2, p);
      const n = Math.floor(p * (ST2.N - 1));
      ctx.strokeStyle = '#C8372D'; ctx.lineWidth = 3; ctx.beginPath();
      for (let k = 0; k <= n; k++) { const x = 990 + 810 * k / (ST2.N - 1), y = 800 - 110 * ST2.W[k] / ST2.maxW; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(20,20,19,.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(990, 800); ctx.lineTo(1800, 800); ctx.stroke();
      txt(ctx, '粗细', 990, 670, '400 16px "Geist Mono"', '#C8372D');
      if (p > .4) txt(ctx, '行笔快 → 细', 1260, 830, '400 18px "Geist Mono"', '#141413');
      if (p > .8) txt(ctx, '收笔顿 → 粗 → 出锋', 1500, 860, '400 18px "Geist Mono"', '#141413');
    } else if (i === 2) {
      ensureStill();
      const F = { x: 1000, y: 260, w: 800, h: 450 };
      ctx.save(); ctx.beginPath(); ctx.rect(F.x, F.y, F.w, F.h); ctx.clip(); ctx.drawImage(STILL, F.x, F.y, F.w, F.h); ctx.restore();
      ctx.strokeStyle = 'rgba(20,20,19,.3)'; ctx.lineWidth = 1; ctx.strokeRect(F.x, F.y, F.w, F.h);
      const k = F.w / W0, gx = F.x + BOX.x * k, gy = F.y + BOX.y * k, gw = BOX.w * k, gh = BOX.h * k;
      const g = eo3((lt - .1) / .4);
      ctx.setLineDash([10, 7]); ctx.strokeStyle = '#C8372D'; ctx.lineWidth = 3; ctx.strokeRect(gx, gy, gw * g, gh); ctx.setLineDash([]);
      const pct = Math.round(64 * eo3((lt - .1) / .5));
      txt(ctx, `留白 ${pct}%`, F.x, F.y + F.h + 60, '900 46px "Noto Serif SC"', '#C8372D');
    } else if (i === 3) {
      const P = { x: 1120, y: 240, w: 560, h: 620 };
      ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(P.x + 14, P.y + 18, P.w, P.h);
      ctx.fillStyle = '#F7F2E6'; ctx.fillRect(P.x, P.y, P.w, P.h);
      ctx.strokeStyle = 'rgba(20,20,19,.25)'; ctx.strokeRect(P.x, P.y, P.w, P.h);
      ['容', '膝', '斋'].forEach((c, j) => txt(ctx, c, P.x + P.w - 90, P.y + 130 + j * 100, '900 86px "Noto Serif SC"', '#141413', 'center'));
      ctx.save(); ctx.globalAlpha = .5; inkBlob(ctx, P.x + 200, P.y + 420, 120, 1, 141); ctx.restore();
      sealAt(ctx, lt, .12, P.x + P.w - 90, P.y + 470, 76, '墨', -.05);
      if (lt > .25) { txt(ctx, '朱砂 2.6%', P.x, P.y + P.h + 56, '900 42px "Noto Serif SC"', '#C8372D'); txt(ctx, '其余 97.4% 都是墨和纸', P.x + 240, P.y + P.h + 52, '400 18px "Geist Mono"', '#6B6B66'); }
    } else {
      const p = B.progress((lt - .05) / .5); B.draw(ctx, ST5, p);
      if (p > .7) {
        const a = cl((p - .7) / .2);
        ctx.globalAlpha = a; ctx.strokeStyle = '#C8372D'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(1520, 760); ctx.lineTo(1610, 600); ctx.stroke();
        ctx.beginPath(); ctx.arc(1612, 572, 26, 0, 6.283); ctx.stroke();
        txt(ctx, '飞白 = 墨不够，断开了', 1380, 800, '400 20px "Geist Mono"', '#C8372D');
        ctx.globalAlpha = 1;
      }
    }
  }

  // —— 片尾：回到开场的构图 ——
  const END_T = [0, .3, .56, .74].map(d => TL.end0 + .12 + d), END_D = [.3, .26, .18, .3];
  function drawEnd(ctx, t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(paper, 0, 0);
    const k = .66;
    ctx.setTransform(k, 0, 0, k, 640, 560);
    SHUI.forEach((s, i) => B.draw(ctx, s.st, B.progress((t - END_T[i]) / END_D[i])));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    sealAt(ctx, t, TL.end0 + 1.2, 640 - 330 * k, 560 - 300 * k, 116 * k, '墨');
    riseText(ctx, t, TL.end0 + 1.35, '水墨', 1150, 560, '900 196px "Noto Serif SC"', '#141413', 210);
    riseText(ctx, t, TL.end0 + 1.5, 'I N K   W A S H', 1158, 630, '400 24px "Geist Mono"', '#3a3a36', 34);
    riseText(ctx, t, TL.end0 + 1.62, '一笔 · 一滴 · 留白', 1158, 700, '400 30px "Noto Serif SC"', '#3a3a36', 40);
    riseText(ctx, t, TL.end0 + 1.85, '观默', 1210, 830, '900 40px "Noto Serif SC"', '#141413', 50);
    sealAt(ctx, t, TL.end0 + 1.85, 1176, 816, 40, '观', 0);
  }

  // —— 场景切换：一笔大刷子扫过去换场 ——
  const WIPE = B.make({ pts: [[-300, 120], [2250, 60], [-300, 540], [2250, 500], [-300, 960], [2250, 1020]], w: [[0, 1], [1, 1]], size: 640, tone: 1, dry: .18, seed: 990, bristles: 80, wet: 0, color: '0,0,0' });
  const WB = () => [TL.rules0, TL.rules0 + TL.ruleStep, TL.rules0 + 2 * TL.ruleStep, TL.rules0 + 3 * TL.ruleStep, TL.rules0 + 4 * TL.ruleStep, TL.end0];
  const WD = .3;
  function drawScene(ctx, s, t) {
    const b = WB();
    if (s === 0) return drawUI(ctx, t);
    if (s <= 5) return drawCard(ctx, s - 1, Math.max(0, t - b[s - 1]));
    return drawEnd(ctx, t);
  }
  const mask = document.createElement('canvas'); mask.width = W0; mask.height = H0;
  const mctx = mask.getContext('2d');
  const nxt = document.createElement('canvas'); nxt.width = W0; nxt.height = H0;
  const nctx = nxt.getContext('2d');
  function scenePart2(ctx, t) {
    const b = WB();
    let s = 0; for (const x of b) if (t >= x) s++;
    for (let k = 0; k < b.length; k++) {
      const p = (t - (b[k] - WD / 2)) / WD;
      if (p > 0 && p < 1) {
        drawScene(ctx, k, t);
        drawScene(nctx, k + 1, t);
        mctx.setTransform(1, 0, 0, 1, 0, 0); mctx.globalCompositeOperation = 'source-over'; mctx.clearRect(0, 0, W0, H0);
        B.draw(mctx, WIPE, p); B.draw(mctx, WIPE, p);
        mctx.globalCompositeOperation = 'source-in'; mctx.globalAlpha = 1; mctx.drawImage(nxt, 0, 0);
        mctx.globalCompositeOperation = 'source-over';
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.drawImage(mask, 0, 0);
        // 刷子本身的墨：盖在交界处
        return;
      }
    }
    drawScene(ctx, s, t);
  }

  // —— 逐帧：5 个子帧做运动模糊 ——
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const off = document.createElement('canvas'); off.width = W0; off.height = H0;
  const octx = off.getContext('2d');
  const SHUT = .5 / 60;
  function camSpeed(t) {
    const a = camera(t - .004), b = camera(t + .004);
    return (Math.hypot(b.cx - a.cx, b.cy - a.cy) * b.z + Math.abs(Math.log(b.z / a.z)) * 1400) / .008 / 60;   // 像素 / 帧
  }
  window.frame = async f => {
    const t = f / 60;
    const SUB = camSpeed(t) > 18 ? 16 : 9;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let k = 0; k < SUB; k++) {
      const ts = t + (k / (SUB - 1) - .5) * SHUT;
      if (ts >= TL.ui0) scenePart2(octx, ts); else drawWorld(octx, ts);
      ctx.globalAlpha = 1 / (k + 1);
      ctx.drawImage(off, 0, 0);
    }
    ctx.globalAlpha = 1;
    overlay(t);
  };
  document.fonts.load('900 86px "Noto Serif SC"', '墨').then(() => document.fonts.ready).then(async () => { await window.frame(0); window.ready = true; });
})();
