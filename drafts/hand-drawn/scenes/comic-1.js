// 漫画墨线 A：仰拍，黑猫从两栋楼之间跃过月亮。
// 规则：粗细墨线 + 整块黑；颜色只有四种，过渡全靠网点；色版比墨版错开几个像素。
SCENES['comic-1'] = ctx => {
  const { W, H, rng, fill, path, ink, hatch, halftone, layer, tint, grain, ellipse, cr, lerp, clamp, n1 } = HD;
  const C = { paper: '#f4ecd8', ink: '#0c0a14', night: '#1a1450', violet: '#4a22a0', mag: '#ff3d8b', cyan: '#39d5ff', yel: '#ffe14a', org: '#ff8a1f' };
  const r = rng(7);
  const col = layer(), ik = layer(), cx = col.getContext('2d'), ix = ik.getContext('2d');
  const TILT = -0.11, PIV = [W / 2, H / 2];
  const tilt = x => { x.translate(PIV[0], PIV[1]); x.rotate(TILT); x.scale(1.16, 1.16); x.translate(-PIV[0], -PIV[1]); };
  cx.save(); ix.save(); tilt(cx); tilt(ix);

  // ---- 天：三层平涂，中间用网点过渡 ----
  cx.fillStyle = C.night; cx.fillRect(-300, -300, W + 600, H + 600);
  halftone(cx, (x, y) => clamp((y - 180) / 620), { pitch: 13, angle: 0.5, color: C.violet, box: [-200, -200, W + 400, H + 400], max: 0.78 });
  halftone(cx, (x, y) => clamp((y - 620) / 420), { pitch: 13, angle: 1.05, color: C.mag, box: [-200, 500, W + 400, H], max: 0.8 });
  // 星
  for (let i = 0; i < 70; i++) { const x = r() * (W + 300) - 150, y = r() * 520 - 120, s = 2 + r() * 5; cx.fillStyle = C.paper; if (r() < 0.25) { cx.fillRect(x - s * 2, y - 1, s * 4, 2.4); cx.fillRect(x - 1, y - s * 2, 2.4, s * 4); } else { cx.beginPath(); cx.arc(x, y, s * 0.5, 0, 7); cx.fill(); } }

  // ---- 月亮 ----
  const M = [1090, 470, 372];
  const moon = ellipse(M[0], M[1], M[2], M[2], 0, 90);
  fill(cx, ellipse(M[0], M[1], M[2] + 26, M[2] + 26, 0, 90), C.mag); halftone(cx, () => 0.55, { pitch: 9, color: C.night, clip: ellipse(M[0], M[1], M[2] + 26, M[2] + 26, 0, 90), box: [M[0] - 420, M[1] - 420, 840, 840] });
  fill(cx, moon, C.yel);
  halftone(cx, (x, y) => { const d = Math.hypot(x - (M[0] + 150), y - (M[1] - 130)) / (M[2] * 1.5); return clamp((d - 0.55) * 1.5); }, { pitch: 11, angle: 0.3, color: C.org, clip: moon, box: [M[0] - 400, M[1] - 400, 800, 800], max: 0.74 });
  ink(ix, moon, { w: 9, closed: true, amp: 2, seed: 3 });
  [[-150, -120, 62], [60, -210, 36], [170, 40, 84], [-60, 150, 48], [-240, 60, 30], [230, -150, 24]].forEach(([dx, dy, rr], i) => { const e = ellipse(M[0] + dx, M[1] + dy, rr, rr * 0.86, 0.3, 40);
    fill(cx, e, C.org); ink(ix, e.slice(4, 26), { w: 5, seed: 20 + i, amp: 1.5 }); hatch(ix, e, { angle: 0.9, gap: 8, w: 1.8, seed: 40 + i, keep: 0.5, inset: 0.5 }); });
  // 压在月亮上的云带
  [[420, 610, 900, 34, C.mag], [1150, 300, 720, 26, C.violet], [900, 760, 1100, 40, C.violet]].forEach(([x, y, w, h, c], i) => { const up = [], dn = []; for (let k = 0; k <= 24; k++) { const t = k / 24, e = Math.sin(t * Math.PI) ** 0.6; up.push([x + t * w, y - h * e * (0.7 + 0.3 * n1(k * 0.9, i))]); dn.push([x + t * w, y + h * 0.5 * e * (0.7 + 0.3 * n1(k * 0.7, i + 4))]); }
    const cl = up.concat(dn.reverse()); fill(cx, cl, c); halftone(cx, (xx, yy) => clamp((yy - y + h * 0.3) / h), { pitch: 8, color: C.night, clip: cl, box: [x, y - h, w, h * 2], angle: 0.8 }); ink(ix, up, { w: 4, seed: 60 + i, t0: 0.3, t1: 0.3 }); });

  // ---- 楼：竖线向头顶的消失点收 ----
  const VP = [1040, -1700], GY = 1500, D = 1500;
  const P = (x, h) => { const t = h / (h + D); return [x + (VP[0] - x) * t, GY + (VP[1] - GY) * t]; };
  function wall(x0, x1, h, { base = C.ink, lit = null, win = C.yel, cols = 5, rows = 16, p = 0.3, seed = 1, edge = 7, tone = null, toneC = C.violet } = {}) { const rr = rng(seed), q = [P(x0, 0), P(x0, h), P(x1, h), P(x1, 0)];
    fill(cx, q, base); if (tone) halftone(cx, tone, { pitch: 9, angle: 0.4, color: toneC, clip: q, box: [Math.min(q[0][0], q[1][0]) - 20, q[1][1] - 20, Math.abs(x1 - x0) + 240, GY - q[1][1]] });
    const hw = h / rows; for (let j = 1; j < rows; j++) for (let i = 0; i < cols; i++) { if (rr() > p) continue; const a = x0 + (x1 - x0) * (i + 0.2) / cols, b = x0 + (x1 - x0) * (i + 0.8) / cols, h0 = h - (j + 0.72) * hw, h1 = h - (j + 0.18) * hw; if (h0 < 0) continue;
      fill(cx, [P(a, h0), P(a, h1), P(b, h1), P(b, h0)], rr() < 0.82 ? win : (lit || C.cyan)); }
    ink(ix, [q[0], q[1]], { w: edge, seed: seed + 1, t0: 0.01, t1: 0.02, min: 0.5 }); ink(ix, [q[3], q[2]], { w: edge, seed: seed + 2, t0: 0.01, t1: 0.02, min: 0.5 }); ink(ix, [q[1], q[2]], { w: edge * 1.3, seed: seed + 3, t0: 0.03, t1: 0.03, min: 0.5 }); return q; }
  // 远处的楼群（紫，网点压暗）
  [[-150, 60, 880], [70, 250, 620], [300, 430, 760], [1560, 1700, 700], [1720, 1900, 940], [1930, 2120, 660], [470, 560, 500], [1440, 1540, 540]].forEach(([a, b, h], i) =>
    wall(a, b, h, { base: C.violet, win: C.mag, p: 0.22, cols: 4, rows: 18, seed: 100 + i, edge: 4, tone: (x, y) => 0.35 + 0.3 * n1(y / 200, i), toneC: C.night }));
  // 近处的楼（整块黑，窗是黄的）
  const LB = wall(-420, 330, 1260, { cols: 9, rows: 15, p: 0.34, seed: 11, edge: 10 });
  const LS = wall(330, 470, 1260, { base: C.night, cols: 2, rows: 15, p: 0.2, seed: 12, edge: 10, win: C.mag, tone: (x, y) => 0.5, toneC: C.ink });
  const RB = wall(1640, 2400, 1060, { cols: 9, rows: 13, p: 0.34, seed: 21, edge: 10 });
  const RS = wall(1500, 1640, 1060, { base: C.night, cols: 2, rows: 13, p: 0.2, seed: 22, edge: 10, win: C.cyan, tone: (x, y) => 0.5, toneC: C.ink });
  // 屋顶的东西：水塔、天线、招牌
  const top = (x, h, dy) => { const p = P(x, h); return [p[0], p[1] - dy]; };
  (() => { const a = top(40, 1260, 0), tk = [[a[0] - 60, a[1] - 150], [a[0] + 60, a[1] - 150], [a[0] + 66, a[1] - 46], [a[0] - 66, a[1] - 46]]; fill(ix, tk, C.ink); fill(ix, [[a[0] - 70, a[1] - 150], [a[0], a[1] - 196], [a[0] + 70, a[1] - 150]], C.ink);
    [-50, 0, 50].forEach((d, i) => ink(ix, [[a[0] + d, a[1] - 50], [a[0] + d * 1.2, a[1] + 4]], { w: 7, seed: i, min: 0.7 })); fill(cx, [[a[0] - 52, a[1] - 140], [a[0] - 30, a[1] - 140], [a[0] - 34, a[1] - 56], [a[0] - 56, a[1] - 56]], C.cyan);
    const b = top(250, 1260, 0); ink(ix, [b, [b[0] + 8, b[1] - 250]], { w: 7, seed: 4, t1: 0.6 }); [60, 110, 160].forEach((d, i) => ink(ix, [[b[0] - 34 + i * 8, b[1] - d], [b[0] + 40 - i * 8, b[1] - d - 6]], { w: 4, seed: 9 + i }));
    const c = top(1840, 1060, 0); ink(ix, [c, [c[0] - 6, c[1] - 200]], { w: 7, seed: 5, t1: 0.6 }); fill(ix, [[c[0] - 150, c[1] - 30], [c[0] - 60, c[1] - 30], [c[0] - 60, c[1] + 6], [c[0] - 150, c[1] + 6]], C.ink); })();
  // 竖招牌
  const sign = (x, y, w, h, bg, fg, txt, rot) => { cx.save(); cx.translate(x, y); cx.rotate(rot); cx.fillStyle = bg; cx.fillRect(0, 0, w, h); cx.fillStyle = fg; cx.font = `${w * 0.74}px NotoBlack`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; [...txt].forEach((ch, i) => cx.fillText(ch, w / 2, h * (i + 0.5) / txt.length + 3)); cx.restore();
    ix.save(); ix.translate(x, y); ix.rotate(rot); [[[0, 0], [w, 0]], [[w, 0], [w, h]], [[w, h], [0, h]], [[0, h], [0, 0]]].forEach((s, i) => ink(ix, s, { w: 8, seed: 70 + i, t0: 0.02, t1: 0.02, min: 0.6 })); ix.restore(); };
  sign(486, 640, 96, 330, C.mag, C.yel, '夜市场', 0.045); sign(1400, 560, 90, 250, C.cyan, C.ink, '鱼丸', -0.04);
  // 电线
  [[[470, 520], [900, 700], [1500, 610]], [[470, 590], [1000, 860], [1500, 700]]].forEach((w, i) => ink(ix, cr(w, false, 20), { w: 3.4, seed: 80 + i, t0: 0.01, t1: 0.01, min: 0.8, amp: 0.6 }));
  cx.restore(); ix.restore();

  // ---- 速度线：朝着猫收尖 ----
  const CT = { x: 1010, y: 452, s: 1.08, r: -0.2 }, dir = [Math.cos(CT.r), Math.sin(CT.r)], nrm = [-dir[1], dir[0]];
  for (let i = 0; i < 46; i++) { const off = (r() - 0.5) * 620, L = 260 + r() * 620, st = -560 - r() * 520 - Math.abs(off) * 0.25, a = [CT.x + dir[0] * st + nrm[0] * off, CT.y + dir[1] * st + nrm[1] * off], b = [a[0] + dir[0] * L, a[1] + dir[1] * L];
    ink(r() < 0.5 ? ix : cx, [a, b], { w: 3 + r() * 9, t0: 0.02, t1: 0.9, amp: 0.4, seed: 200 + i, color: r() < 0.55 ? C.paper : C.ink, min: 0.05 }); }

  // ---- 猫 ----
  const FUR = { furAmp: 13, back: [-Math.cos(CT.r), -Math.sin(CT.r)] }, cat = CAT.side('leap', CT, FUR);
  // 残影（青 / 洋红两个色版拖在后面）
  [[-58, 14, C.cyan, 0.9], [-28, 7, C.mag, 0.9]].forEach(([dx, dy, c, a]) => { const g = CAT.side('leap', { ...CT, x: CT.x + dx, y: CT.y + dy }, FUR); cx.save(); cx.globalAlpha = a; CAT.order(g).forEach(q => fill(cx, q, c)); cx.restore(); });
  FX.inkCat(ix, cat, { a: C.cyan, b: C.mag, body: C.ink });
  // 背上的排线、毛尖
  const sp = cat.spinePts; for (let i = 3; i < sp.length - 2; i += 2) { const p = sp[i], k = (r() - 0.5) * 20; ink(ix, [[p[0] + k, p[1] - 30 * CT.s], [p[0] + k - 26, p[1] - 4 * CT.s]], { w: 3, color: C.cyan, seed: 300 + i, t0: 0.05, t1: 0.8 }); }

  // ---- 合成：色版错位 + 墨版的青红边 ----
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(col, 5, 4);
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.75; ctx.drawImage(tint(ik, '#12c8ff'), -4, -1); ctx.drawImage(tint(ik, '#ff2e6e'), 4, 2); ctx.restore();
  ctx.drawImage(ik, 0, 0);

  // ---- 字 ----
  FX.sfx(ctx, '嗖', 150, 420, { size: 250, rot: -0.2, skew: -0.3, seed: 5 });
  FX.sfx(ctx, '——', 396, 372, { size: 150, rot: -0.2, skew: -0.3, seed: 6, gap: 0.7, grow: -0.14 });
  FX.caption(ctx, '午夜 00:00 · 第七街屋顶', 64, 58, { seed: 3 });
  FX.caption(ctx, '「就差这一跳。」', 1460, 950, { seed: 8, bg: C.paper, rot: 0.015, size: 38 });
  // 画格边
  ctx.strokeStyle = C.paper; ctx.lineWidth = 36; ctx.strokeRect(0, 0, W, H);
  [[[22, 22], [W - 22, 20]], [[W - 22, 20], [W - 20, H - 22]], [[W - 20, H - 22], [20, H - 20]], [[20, H - 20], [22, 22]]].forEach((s, i) => ink(ctx, s, { w: 9, seed: 400 + i, t0: 0.01, t1: 0.01, min: 0.7, amp: 1.5 }));
  grain(ctx, { amount: 0.1, fiber: 0.07 });
};
