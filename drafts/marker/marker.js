// 马克笔渲染器：酒精马克笔是透明的——一笔是一层，叠一层就深一档；起笔、收笔积墨；扁头扫出平行的纤维纹；快笔收尾会“甩”细。
// 每一笔都是纯函数：stroke(ctx, 路径, 参数)。片子里只要把 t 传进来截路径长度，就是“正在画”的那一笔。
(function () {
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // Catmull-Rom 加密成折线
  function dense(pts, step = 4) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      const L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]); const n = Math.max(2, Math.ceil(L / step));
      for (let j = 0; j < n; j++) {
        const t = j / n, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  function normals(P) {
    return P.map((p, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)]; const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; });
  }
  function cut(P, t) { if (t >= 1) return P; const n = Math.max(2, Math.round(P.length * t)); return P.slice(0, n); }

  let buf = null, bctx = null;
  function scratch(w, h) {
    if (!buf || buf.width < w || buf.height < h) { buf = document.createElement('canvas'); buf.width = Math.max(w, buf ? buf.width : 0); buf.height = Math.max(h, buf ? buf.height : 0); bctx = buf.getContext('2d'); }
    return bctx;
  }

  // 一笔马克笔
  // o: {w 笔宽, color, alpha, seed, nib 扁头角度(弧度, null=跟着走向), taper 收尾甩细 0..1, pool 积墨, t 画到哪, clip Path2D, streak 纤维纹强度}
  function stroke(ctx, pts, o = {}) {
    const w = o.w || 40, color = o.color || '#888', alpha = o.alpha == null ? 0.55 : o.alpha, R = rng(o.seed || 1);
    const taper = o.taper == null ? 0.5 : o.taper, pool = o.pool == null ? 0.5 : o.pool, streak = o.streak == null ? 0.35 : o.streak;
    let P = cut(dense(pts, 3), o.t == null ? 1 : o.t); if (P.length < 2) return;
    const N = normals(P);
    // 扁头：笔宽在“笔头方向”和走向的夹角上投影
    const nibW = (i) => { if (o.nib == null) return w; const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)]; const ang = Math.atan2(b[1] - a[1], b[0] - a[0]); return w * (0.25 + 0.75 * Math.abs(Math.sin(ang - o.nib))); };
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of P) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
    const pad = w + 8; x0 = Math.floor(x0 - pad); y0 = Math.floor(y0 - pad); x1 = Math.ceil(x1 + pad); y1 = Math.ceil(y1 + pad);
    const bw = x1 - x0, bh = y1 - y0; const s = scratch(bw, bh);
    s.setTransform(1, 0, 0, 1, 0, 0); s.globalCompositeOperation = 'source-over'; s.clearRect(0, 0, bw, bh); s.globalAlpha = 1;
    s.translate(-x0, -y0); s.lineCap = 'round'; s.lineJoin = 'round';
    // 1) 形状：扁头扫过的面积（边上的纤维先离纸 → 两头圆、略短）
    const K = Math.max(8, Math.round(w / 2.2));
    const total = P.length, step = 3;
    const line = (u, a, b, lw) => { s.lineWidth = lw; s.beginPath(); for (let i = a; i < b && i < total; i++) { const ww = nibW(i); const x = P[i][0] + N[i][0] * u * ww, y = P[i][1] + N[i][1] * u * ww; if (i === a) s.moveTo(x, y); else s.lineTo(x, y); } s.stroke(); };
    const span = [];
    for (let k = 0; k < K; k++) {
      const u = (k + 0.5) / K - 0.5, edge = Math.abs(u) * 2;
      const rnd = (1 - Math.sqrt(Math.max(0, 1 - edge * edge)));
      const endPx = w * 0.5 * rnd * (0.9 + 0.2 * R()) + taper * w * 1.4 * edge * edge * R();
      const startPx = w * 0.45 * rnd * (0.9 + 0.2 * R());
      const a = Math.min(total - 2, Math.round(startPx / step)), b = Math.max(a + 2, total - Math.round(endPx / step));
      span.push([u, a, b]);
    }
    s.globalAlpha = 1; s.strokeStyle = '#000';
    for (const [u, a, b] of span) line(u, a, b, (w / K) * 2.2);
    // 2) 墨不是满的：整体退一点，再顺着笔走向擦出几道细纤维纹
    s.globalCompositeOperation = 'destination-out';
    s.globalAlpha = 0.2; s.fillRect(x0, y0, bw, bh);
    for (const [u, a, b] of span) { if (R() < 0.55) { s.globalAlpha = streak * (0.15 + 0.5 * R()); line(u + (R() - .5) / K, a, b, (w / K) * (0.5 + R())); } }
    // 3) 湿边 + 起笔收笔积墨：墨在边上和停顿处多渗一点
    s.globalCompositeOperation = 'source-over';
    s.globalAlpha = 0.35; const e0 = span[0], e1 = span[span.length - 1]; line(e0[0] + 0.3 / K, e0[1], e0[2], w / K * 1.2); line(e1[0] - 0.3 / K, e1[1], e1[2], w / K * 1.2);
    if (pool > 0) {
      const ends = [[Math.min(total - 1, Math.round(w * 0.32 / step)), 1]]; if (o.t == null || o.t >= 1) ends.push([Math.max(0, total - 1 - Math.round(w * 0.32 / step)), 0.55]);
      for (const [i, k] of ends) {
        const ww = nibW(i); s.globalAlpha = pool * 0.7 * k; s.beginPath();
        const ang = Math.atan2(N[i][1], N[i][0]);
        s.ellipse(P[i][0], P[i][1], ww * 0.46, ww * 0.16, ang, 0, Math.PI * 2); s.fillStyle = '#000'; s.fill();
      }
    }
    // 上色：遮罩 → 颜色
    s.setTransform(1, 0, 0, 1, 0, 0); s.globalAlpha = 1; s.globalCompositeOperation = 'source-in'; s.fillStyle = color; s.fillRect(0, 0, bw, bh);
    ctx.save(); if (o.clip) ctx.clip(o.clip);
    ctx.globalCompositeOperation = o.mode || 'multiply'; ctx.globalAlpha = alpha;
    ctx.drawImage(buf, 0, 0, bw, bh, x0, y0, bw, bh); ctx.restore();
  }

  // 铅笔 / 色铅笔结构线：多描一两遍、两头出头
  function pencil(ctx, pts, o = {}) {
    const R = rng(o.seed || 7), passes = o.passes || 2, over = o.over == null ? 14 : o.over;
    ctx.save(); ctx.strokeStyle = o.color || 'rgba(70,120,200,.5)'; ctx.lineWidth = o.w || 1.2; ctx.lineCap = 'round'; ctx.globalCompositeOperation = o.mode || 'multiply';
    for (let p = 0; p < passes; p++) {
      let P = dense(pts, 6);
      if (over) { const a = P[0], b = P[1], c = P[P.length - 1], d = P[P.length - 2]; const e1 = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, e2 = Math.hypot(c[0] - d[0], c[1] - d[1]) || 1; const k1 = over * (0.4 + R()), k2 = over * (0.4 + R()); P = [[a[0] + (a[0] - b[0]) / e1 * k1, a[1] + (a[1] - b[1]) / e1 * k1], ...P, [c[0] + (c[0] - d[0]) / e2 * k2, c[1] + (c[1] - d[1]) / e2 * k2]]; }
      ctx.globalAlpha = (o.alpha || 1) * (0.55 + 0.45 * R());
      ctx.beginPath(); const j = o.jit == null ? 1.6 : o.jit; const ox = (R() - .5) * j * 2, oy = (R() - .5) * j * 2;
      P.forEach((q, i) => { const x = q[0] + ox + (R() - .5) * j * .4, y = q[1] + oy + (R() - .5) * j * .4; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
    }
    ctx.restore();
  }
  function ellipsePts(cx, cy, rx, ry, a0 = 0, a1 = Math.PI * 2, n = 48, rot = 0) {
    const out = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; const x = Math.cos(a) * rx, y = Math.sin(a) * ry; out.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]); } return out;
  }

  // 针管笔线：粗细随压力（这里按 y 方向——下面重、上面轻，像设计师的习惯）
  function liner(ctx, pts, o = {}) {
    const P = dense(pts, 2), R = rng(o.seed || 3); const w0 = o.w || 2.2, heavy = o.heavy || 0;
    ctx.save(); ctx.strokeStyle = o.color || '#15161a'; ctx.lineCap = 'round'; ctx.globalAlpha = o.alpha || 1; ctx.globalCompositeOperation = o.mode || 'source-over';
    for (let i = 1; i < P.length; i++) {
      const t = i / P.length; const taper = Math.min(1, t * 8, (1 - t) * 8);
      ctx.lineWidth = Math.max(0.4, w0 * (0.55 + 0.45 * taper) * (1 + heavy * (o.heavyFn ? o.heavyFn(P[i]) : 0)));
      ctx.beginPath(); ctx.moveTo(P[i - 1][0], P[i - 1][1]); ctx.lineTo(P[i][0], P[i][1]); ctx.stroke();
    }
    ctx.restore();
  }

  // 纸：马克笔纸偏冷白，有一点纤维和颗粒
  function paper(ctx, W, H, o = {}) {
    ctx.save(); ctx.fillStyle = o.color || '#f5f3ee'; ctx.fillRect(0, 0, W, H);
    const R = rng(o.seed || 11); const img = ctx.getImageData(0, 0, W, H); const d = img.data;
    for (let i = 0; i < d.length; i += 4) { const n = (R() - 0.5) * (o.grain || 7); d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    ctx.putImageData(img, 0, 0);
    ctx.globalAlpha = 0.05; ctx.strokeStyle = '#8a8478';
    for (let i = 0; i < (o.fibers || 900); i++) { const x = R() * W, y = R() * H, a = R() * Math.PI, l = 4 + R() * 14; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke(); }
    ctx.restore();
  }

  // 一组平行的“铺色”笔触：设计师铺大面积就是这样一笔挨一笔，留一点缝
  function hatch(ctx, o) {
    // o: {x0,y0,x1,y1 范围, ang 走向, gap, w, color, alpha, clip, seed, bow 弧度, jitter, skip(i,u) 留白}
    const R = rng(o.seed || 5); const ang = o.ang || 0; const dx = Math.cos(ang), dy = Math.sin(ang); const nx = -dy, ny = dx;
    const cx = (o.x0 + o.x1) / 2, cy = (o.y0 + o.y1) / 2; const span = Math.hypot(o.x1 - o.x0, o.y1 - o.y0);
    const gap = o.gap || o.w * 0.8; const n = Math.ceil(span / gap);
    for (let i = 0; i <= n; i++) {
      const off = -span / 2 + i * gap + (R() - .5) * (o.jitter || 4);
      const u = i / n;
      if (o.skip && o.skip(i, u)) continue;
      const L = span * (0.5 + 0.5 * (o.len || 1)); const bow = (o.bow || 0) * (R() * 0.6 + 0.7);
      const px = cx + nx * off, py = cy + ny * off;
      const a = [px - dx * L / 2, py - dy * L / 2], b = [px + dx * L / 2, py + dy * L / 2], m = [(a[0] + b[0]) / 2 + nx * bow, (a[1] + b[1]) / 2 + ny * bow];
      stroke(ctx, [a, m, b], { w: o.w, color: o.color, alpha: o.alpha, clip: o.clip, seed: (o.seed || 5) * 131 + i, taper: o.taper == null ? 0.6 : o.taper, pool: o.pool == null ? 0.35 : o.pool, streak: o.streak, nib: o.nib });
    }
  }

  window.MK = { rng, dense, stroke, pencil, liner, paper, hatch, ellipsePts };
})();
