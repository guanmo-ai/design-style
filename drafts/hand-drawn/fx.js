// 各种画法共用的小件：漫画里的猫、拟声字、对话框。
const FX = (() => {
  const { paths, fill, ink, cr, rng, hatch } = HD;
  // 漫画墨线的猫：整块黑 + 两道边缘光（a 来自上方，b 来自下方）+ 背上一片网点
  function inkCat(ctx, c, { a = '#39d5ff', b = '#ff3d8b', da = [5, 8], db = [-3, -6], body = '#0c0a14', farC = '#1a1450', eye = '#ffe14a', seed = 1, dots = true } = {}) { const s = c.scale, r = rng(seed);
    CAT.groups(c).forEach((g, gi) => { const base = CAT.far[gi] ? farC : body; ctx.save(); paths(ctx, g); ctx.fillStyle = base; ctx.fill(); ctx.clip();
      if (!CAT.far[gi]) { if (a) { ctx.fillStyle = a; ctx.fill(); paths(ctx, g, da[0] * s, da[1] * s); ctx.fillStyle = b || base; ctx.fill(); ctx.clip(); }
        if (b) { paths(ctx, g, db[0] * s, db[1] * s); ctx.fillStyle = base; ctx.fill(); }
        if (dots && a && gi === 3) { const l = HD.layer(x => { HD.halftone(x, () => 0.34, { pitch: 8 * s, angle: 0.6, color: a }); x.globalCompositeOperation = 'destination-out'; paths(x, g, 16 * s, 34 * s); x.fill(); }); ctx.drawImage(l, 0, 0); } }
      else if (b) { ctx.fillStyle = b; ctx.fill(); paths(ctx, g, db[0] * s * 0.8, db[1] * s * 0.8); ctx.fillStyle = base; ctx.fill(); }
      ctx.restore(); });
    [c.hn, c.fn].forEach(l => l.claws.forEach(k => fill(ctx, k, '#f6efe0')));
    fill(ctx, c.earIn, b || a || '#ff3d8b'); fill(ctx, c.eye, eye); fill(ctx, c.pupil, body); fill(ctx, c.glint, '#fff'); fill(ctx, c.nose, b || '#ff3d8b');
    ink(ctx, c.eye.slice(0, Math.floor(c.eye.length * 0.55)), { w: 5 * s, color: body, seed, t0: 0.1, t1: 0.2 });
    c.whisk.forEach((w, i) => ink(ctx, w, { w: 3.4 * s, color: '#f6efe0', seed: seed + i, t0: 0.05, t1: 0.7 })); }
  // 拟声字：粗描边 + 错位的影子
  function sfx(ctx, text, x, y, { size = 200, font = 'NotoBlack', fillc = '#ffe14a', line = '#0c0a14', shadow = '#ff3d8b', rot = -0.1, skew = -0.25, lw = 0.09, gap = 0.82, seed = 1, grow = 0.12 } = {}) { const r = rng(seed);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.transform(1, 0, skew, 1, 0, 0); ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'miter'; ctx.miterLimit = 3; let cx = 0;
    [...text].forEach((ch, i) => { const sz = size * (1 + i * grow); ctx.font = `${sz}px ${font}`; const w = ctx.measureText(ch).width, dy = (r() - 0.5) * size * 0.12, rr = (r() - 0.5) * 0.12;
      ctx.save(); ctx.translate(cx, dy); ctx.rotate(rr); if (shadow) { ctx.fillStyle = shadow; ctx.strokeStyle = shadow; ctx.lineWidth = sz * lw; ctx.strokeText(ch, sz * 0.05, sz * 0.06); ctx.fillText(ch, sz * 0.05, sz * 0.06); }
      ctx.strokeStyle = line; ctx.lineWidth = sz * lw; ctx.strokeText(ch, 0, 0); ctx.fillStyle = fillc; ctx.fillText(ch, 0, 0); ctx.restore(); cx += w * gap; });
    ctx.restore(); }
  // 旁白框
  function caption(ctx, text, x, y, { size = 34, font = 'NotoBold', bg = '#ffe14a', fg = '#0c0a14', pad = 16, rot = -0.02, seed = 1 } = {}) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.font = `${size}px ${font}`; const w = ctx.measureText(text).width + pad * 2, h = size + pad * 1.5;
    const box = [[0, 0], [w, 0], [w, h], [0, h]]; fill(ctx, box.map(p => [p[0] + 7, p[1] + 7]), fg); fill(ctx, box, bg);
    [[0, 1], [1, 2], [2, 3], [3, 0]].forEach(([i, j], k) => ink(ctx, [box[i], box[j]], { w: 5, seed: seed + k, t0: 0.02, t1: 0.02, amp: 1.2, color: fg, min: 0.6 }));
    ctx.fillStyle = fg; ctx.textBaseline = 'middle'; ctx.fillText(text, pad, h / 2 + 2); ctx.restore(); }
  // ---------- 速写本乱线 ----------
  const { crayon, stroke, wob, zigzag, waxFill, waxLine, path } = HD;
  // 一组多边形当一个形状：乱线填色 + 只留外轮廓的蜡笔线（描两遍，第二遍故意不重合）
  function waxShape(ctx, polys, { fillc = null, line = '#fff', lw = 9, seed = 1, press = 0.7, gap = 12, w = 13, angle = -0.6, over = 6, passes = 2, linePress = 0.7, shift = [0, 0], twice = true } = {}) {
    if (fillc) polys.forEach((pl, i) => waxFill(ctx, pl.map(p => [p[0] + shift[0], p[1] + shift[1]]), { color: fillc, w, gap, angle: angle + i * 0.23, over, press, seed: seed + i * 3, passes }));
    if (line) { const wp = polys.map((pl, i) => wob(pl, 2.6, 70, seed + i, true)), wp2 = polys.map((pl, i) => wob(pl, 4.5, 50, seed + 40 + i, true));
      const draw = (set, k) => x => { set.forEach(pl => stroke(x, pl, lw * 2 * k, line, true)); x.globalCompositeOperation = 'destination-out'; paths(x, set); x.fill(); x.globalCompositeOperation = 'source-over'; };
      crayon(ctx, draw(wp, 1), { press: linePress, seed }); crayon(ctx, draw(wp, 0.55), { press: 0.95, seed: seed + 1 }); if (twice) crayon(ctx, draw(wp2, 0.5), { press: linePress * 0.9, seed: seed + 2 }); } }
  // 用乱线画的边缘光：只落在形状朝着光的那一条边上
  function waxRim(ctx, polys, { color = '#ffd84a', d = [10, 16], angle = 0.9, gap = 9, w = 6, seed = 1, press = 0.8, over = 0 } = {}) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; polys.forEach(pl => pl.forEach(p => { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }));
    const zs = zigzag([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], { angle, gap, over, seed });
    crayon(ctx, x => { x.save(); paths(x, polys); x.clip(); zs.forEach((z, i) => stroke(x, wob(z, 2, 30, seed + i), w, color)); x.restore(); x.globalCompositeOperation = 'destination-out'; paths(x, polys, d[0], d[1]); x.fill(); x.globalCompositeOperation = 'source-over'; }, { press, seed }); }
  // 一把蜡笔线（一次合成）
  function waxLines(ctx, lines, { w = 8, color = '#fff', press = 0.7, seed = 1, amp = 2.5, wave = 50 } = {}) { const ws = lines.map((l, i) => wob(l, amp, wave, seed + i));
    crayon(ctx, x => ws.forEach(l => stroke(x, l, w, color)), { press: press * 0.75, seed }); crayon(ctx, x => ws.forEach(l => stroke(x, l, w * 0.5, color)), { press: Math.min(0.97, press * 1.25), seed: seed + 1 }); }
  // 马克笔：等粗、实心、手抖
  function marker(ctx, pts, { w = 5, color = '#fff', seed = 1, amp = 1.6, closed = false } = {}) { stroke(ctx, wob(pts, amp, 45, seed, closed), w, color, closed); }
  // 蜡笔写的字
  function waxText(ctx, text, x, y, { font = 'KuaiLe', size = 48, color = '#fff', rot = 0, outline = 0, press = 0.88, seed = 1, align = 'left', line2 = null } = {}) { crayon(ctx, c => { c.translate(x, y); c.rotate(rot); c.font = `${size}px ${font}`; c.textAlign = align; c.textBaseline = 'middle'; c.lineJoin = 'round';
    if (outline) { c.strokeStyle = color; c.lineWidth = outline; c.strokeText(text, 0, 0); if (line2) { c.strokeStyle = line2; c.lineWidth = outline * 0.3; c.strokeText(text, -2, -3); } } else { c.fillStyle = color; c.fillText(text, 0, 0); } c.setTransform(1, 0, 0, 1, 0, 0); }, { press, seed }); }
  // 蜡笔画的侧面猫
  function waxCat(ctx, c, { body = '#06070f', far = '#141230', line = '#8f9cff', eye = '#b6f24a', rims = [], seed = 1 } = {}) {
    CAT.groups(c).forEach((g, gi) => { waxShape(ctx, g, { fillc: CAT.far[gi] ? far : body, line, lw: 7, seed: seed + gi * 9, press: 0.93, gap: 10, w: 15, passes: 2, angle: -0.4 + gi * 0.3 }); if (!CAT.far[gi]) rims.forEach((rm, k) => waxRim(ctx, g, { ...rm, seed: seed + gi * 13 + k })); });
    waxFill(ctx, c.earIn, { color: '#ff5fa2', w: 7, gap: 6, angle: 1, over: 2, press: 0.8, seed: seed + 70 });
    const ex = c.eye.reduce((a, p) => a + p[0], 0) / c.eye.length, ey = c.eye.reduce((a, p) => a + p[1], 0) / c.eye.length, e = HD.ellipse(ex, ey, 30 * c.scale, 27 * c.scale, 0, 24);
    waxFill(ctx, e, { color: eye, w: 9, gap: 5, angle: 0.5, over: 2, press: 0.95, seed: seed + 71, passes: 2 }); fill(ctx, wob(HD.ellipse(ex + 5, ey, 11 * c.scale, 19 * c.scale, 0.1, 20), 1.5, 20, seed, true), '#06070f'); marker(ctx, e, { w: 4.5, color: '#06070f', seed: seed + 72, closed: true }); fill(ctx, HD.ellipse(ex - 6, ey - 9, 6, 5, 0, 10), '#fbf7ea');
    waxLines(ctx, c.whisk, { w: 4.5, color: '#fbf7ea', press: 0.85, seed: seed + 75, amp: 2.5, wave: 80 }); }
  return { inkCat, sfx, caption, waxShape, waxRim, waxLines, marker, waxText, waxCat };
})();
