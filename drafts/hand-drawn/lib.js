// 手绘笔触基础库（Canvas 2D）：墨线、网点、排线、蜡笔颗粒、乱线填色、纸纹。
// 所有随机都带种子：同一个种子画出同一张图；动起来时换种子就是“重描”。
const HD = (() => {
  const W = 1920, H = 1080;
  const TAU = Math.PI * 2;
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  function n1(x, seed = 0) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return (hash(i + seed * 57.31) * (1 - u) + hash(i + 1 + seed * 57.31) * u) * 2 - 1; }
  const h2 = (i, j, s) => hash(i * 1.7 + j * 131.3 + s * 71.9);
  function n2(x, y, seed = 0) { const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    return (h2(i, j, seed) * (1 - u) + h2(i + 1, j, seed) * u) * (1 - v) + (h2(i, j + 1, seed) * (1 - u) + h2(i + 1, j + 1, seed) * u) * v; }
  const lerp = (a, b, t) => a + (b - a) * t, clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

  // ---------- 折线 ----------
  // Catmull-Rom 加密
  function cr(pts, closed = false, seg = 14) {
    const n = pts.length, out = [], P = i => closed ? pts[(i % n + n) % n] : pts[clamp(i, 0, n - 1)];
    const m = closed ? n : n - 1;
    for (let i = 0; i < m; i++) { const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      for (let k = 0; k < seg; k++) { const t = k / seg, t2 = t * t, t3 = t2 * t;
        out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } }
    if (!closed) out.push(pts[n - 1].slice()); return out; }
  function len(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
  function resample(pts, step = 4, closed = false) {
    const src = closed ? pts.concat([pts[0]]) : pts, out = [src[0].slice()]; let acc = 0;
    for (let i = 1; i < src.length; i++) { let a = src[i - 1], b = src[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d < 1e-6) continue;
      while (acc + d >= step) { const t = (step - acc) / d; a = [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]; out.push(a); d = Math.hypot(b[0] - a[0], b[1] - a[1]); acc = 0; }
      acc += d; }
    if (!closed) out.push(src[src.length - 1].slice()); return out; }
  function normals(pts, closed = false) { const n = pts.length; return pts.map((p, i) => { const a = closed ? pts[(i - 1 + n) % n] : pts[Math.max(0, i - 1)], b = closed ? pts[(i + 1) % n] : pts[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; }); }
  // 手抖：沿法线按低频噪声偏移
  function wob(pts, amp = 2, wave = 60, seed = 1, closed = false) { const p = resample(pts, 4, closed), nr = normals(p, closed), L = p.length * 4;
    return p.map((q, i) => { let s = i * 4; let d = n1(s / wave, seed) * 0.7 + n1(s / (wave * 0.31), seed + 9) * 0.3;
      if (closed) { const e = sstep(0, wave, Math.min(s, L - s)); d *= e; }
      return [q[0] + nr[i][0] * d * amp, q[1] + nr[i][1] * d * amp]; }); }
  function path(ctx, pts, closed = true) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); if (closed) ctx.closePath(); }
  function fill(ctx, pts, color) { path(ctx, pts); ctx.fillStyle = color; ctx.fill(); }
  // 粗线 → 轮廓多边形（两头圆）
  function thick(spine, radii, seg = 10) { const p = resample(cr(spine, false, seg), 5), n = p.length, nr = normals(p);
    const R = i => { const t = i / (n - 1) * (radii.length - 1), k = Math.min(radii.length - 2, Math.floor(t)), f = t - k, u = f * f * (3 - 2 * f); return lerp(radii[k], radii[k + 1], u); };
    const L = [], Rt = []; for (let i = 0; i < n; i++) { const r = R(i); L.push([p[i][0] + nr[i][0] * r, p[i][1] + nr[i][1] * r]); Rt.push([p[i][0] - nr[i][0] * r, p[i][1] - nr[i][1] * r]); }
    const cap = (c, nrm, r, flip) => { const a0 = Math.atan2(nrm[1], nrm[0]), o = []; for (let k = 1; k < 8; k++) { const a = a0 + (flip ? 1 : -1) * Math.PI * k / 8; o.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]); } return o; };
    return L.concat(cap(p[n - 1], nr[n - 1], R(n - 1), false), Rt.reverse(), cap(p[0], [-nr[0][0], -nr[0][1]], R(0), false)); }
  function ellipse(cx, cy, rx, ry, rot = 0, n = 40) { const o = [], c = Math.cos(rot), s = Math.sin(rot); for (let i = 0; i < n; i++) { const a = i / n * TAU, x = Math.cos(a) * rx, y = Math.sin(a) * ry; o.push([cx + x * c - y * s, cy + x * s + y * c]); } return o; }
  const xf = (pts, { x = 0, y = 0, s = 1, r = 0, fx = 1 } = {}) => { const c = Math.cos(r), sn = Math.sin(r); return pts.map(p => { const px = p[0] * s * fx, py = p[1] * s; return [x + px * c - py * sn, y + px * sn + py * c]; }); };

  // 统一多边形的绕向（几个多边形放进同一条路径做并集时要一致）
  function norm(poly) { let a = 0; for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; a += p[0] * q[1] - q[0] * p[1]; } return a < 0 ? poly.slice().reverse() : poly; }
  function paths(ctx, polys, dx = 0, dy = 0) { ctx.beginPath(); polys.forEach(pl => { pl = norm(pl); ctx.moveTo(pl[0][0] + dx, pl[0][1] + dy); for (let i = 1; i < pl.length; i++) ctx.lineTo(pl[i][0] + dx, pl[i][1] + dy); ctx.closePath(); }); }
  // ---------- 墨线：有粗细的带子 ----------
  // w 最粗处的宽度；t0 / t1 起笔收笔的渐细长度（占全长比例）；amp 手抖
  function ink(ctx, pts, { w = 6, t0 = 0.15, t1 = 0.3, amp = 1.5, wave = 70, seed = 1, color = '#111', closed = false, press = 0.35, min = 0.12 } = {}) {
    const p = wob(pts, amp, wave, seed, closed), n = p.length, nr = normals(p, closed), L = [], R = [];
    for (let i = 0; i < n; i++) { const t = i / (n - 1); let k = closed ? 1 : Math.min(sstep(0, t0, t) * (1 - min) + min, sstep(0, t1, 1 - t) * (1 - min) + min);
      k *= 1 + n1(i * 4 / (wave * 1.3), seed + 3) * press; const r = w * 0.5 * k; L.push([p[i][0] + nr[i][0] * r, p[i][1] + nr[i][1] * r]); R.push([p[i][0] - nr[i][0] * r, p[i][1] - nr[i][1] * r]); }
    ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]); for (let i = 1; i < n; i++) ctx.lineTo(L[i][0], L[i][1]); for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); }
  const line = (ctx, a, b, o) => ink(ctx, [a, b], o);

  // ---------- 多边形 × 扫描线：排线 / 乱线填色 ----------
  function scan(poly, angle, gap, seed = 1, jit = 0.25) { const c = Math.cos(-angle), s = Math.sin(-angle), q = poly.map(p => [p[0] * c - p[1] * s, p[0] * s + p[1] * c]);
    let y0 = Infinity, y1 = -Infinity; q.forEach(p => { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
    const rows = [], r = rng(seed); for (let y = y0 + gap * 0.5; y < y1; y += gap * (1 + (r() - 0.5) * 2 * jit)) { const xs = [];
      for (let i = 0; i < q.length; i++) { const a = q[i], b = q[(i + 1) % q.length]; if ((a[1] <= y) !== (b[1] <= y)) xs.push(a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
      xs.sort((a, b) => a - b); for (let k = 0; k + 1 < xs.length; k += 2) rows.push([xs[k], xs[k + 1], y]); }
    const c2 = Math.cos(angle), s2 = Math.sin(angle), back = (x, y) => [x * c2 - y * s2, x * s2 + y * c2];
    return rows.map(([a, b, y]) => [back(a, y), back(b, y)]); }
  // 排线：一组平行的短墨线
  function hatch(ctx, poly, { angle = -0.7, gap = 9, w = 2.2, seed = 1, color = '#111', inset = 0, amp = 1, keep = 1 } = {}) { const r = rng(seed + 5);
    scan(poly, angle, gap, seed).forEach(([a, b], i) => { if (r() > keep) return; const d = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d < 6) return; const e = inset * r() * d;
      const t = e / d; ink(ctx, [[lerp(a[0], b[0], t * r()), lerp(a[1], b[1], t * r())], [lerp(b[0], a[0], t), lerp(b[1], a[1], t)]], { w: w * (0.7 + r() * 0.6), t0: 0.1, t1: 0.5, amp, seed: seed + i, color }); }); }
  // 乱线：一笔来回涂，线头冲出边（over）或者没涂到边（负数）
  function zigzag(poly, { angle = -0.5, gap = 14, over = 8, seed = 1, jit = 0.35 } = {}) { const r = rng(seed + 11), rows = scan(poly, angle, gap, seed, jit), out = []; let cur = [], flip = false, last = null;
    rows.forEach(([a, b]) => { const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / d, uy = (b[1] - a[1]) / d, o0 = over * (r() * 1.6 - 0.5), o1 = over * (r() * 1.6 - 0.5);
      let A = [a[0] - ux * o0, a[1] - uy * o0], B = [b[0] + ux * o1, b[1] + uy * o1]; if (flip) [A, B] = [B, A];
      if (last && Math.hypot(A[0] - last[0], A[1] - last[1]) > gap * 6) { out.push(cur); cur = []; }
      cur.push(A, B); last = B; flip = !flip; });
    if (cur.length) out.push(cur); return out; }

  // ---------- 图层 ----------
  function layer(fn, w = W, h = H) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); if (fn) fn(x, c); return c; }
  function tint(src, color) { return layer(x => { x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, src.width, src.height); }, src.width, src.height); }
  // 纸的颗粒（蜡笔涂不满的地方）：density 越大涂得越实
  const toothCache = {};
  function tooth(density, seed = 1) { const key = density.toFixed(2) + '_' + seed; if (toothCache[key]) return toothCache[key];
    const c = layer(), x = c.getContext('2d'), im = x.createImageData(W, H), d = im.data, r = rng(seed * 977 + 13); const hw = W >> 1, hh = (H >> 1) + 1, lo = new Float32Array((hw + 1) * (hh + 1)); for (let i = 0; i < lo.length; i++) lo[i] = r();
    const th = 1 - density; for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) { const gx = xx / 2, gy = y / 2, i = gx | 0, j = gy | 0, fx = gx - i, fy = gy - j, a = lo[j * (hw + 1) + i], b = lo[j * (hw + 1) + i + 1], cc = lo[(j + 1) * (hw + 1) + i], dd = lo[(j + 1) * (hw + 1) + i + 1];
      const v = (lerp(lerp(a, b, fx), lerp(cc, dd, fx), fy) * 0.62 + r() * 0.38) * 0.82 + n2(xx / 37, y / 23, seed) * 0.18; d[(y * W + xx) * 4 + 3] = clamp((v - th) * 9 + 0.5) * 255; }
    x.putImageData(im, 0, 0); return toothCache[key] = c; }
  // 蜡笔 / 油画棒：draw(x) 里随便画实心的东西，出来是带颗粒的一层
  function crayon(ctx, draw, { press = 0.6, seed = 1, alpha = 1, blend = 'source-over' } = {}) { const l = layer(x => { draw(x); x.globalCompositeOperation = 'destination-in'; x.drawImage(tooth(press, seed), 0, 0); });
    ctx.save(); ctx.globalAlpha = alpha; ctx.globalCompositeOperation = blend; ctx.drawImage(l, 0, 0); ctx.restore(); }
  // 一根蜡笔线（等粗、圆头、边上虚）
  function stroke(x, pts, w, color, closed = false) { x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = color; x.lineWidth = w; path(x, pts, closed); x.stroke(); }
  function waxLine(ctx, pts, { w = 10, color = '#fff', press = 0.6, seed = 1, amp = 2, wave = 50, closed = false, twice = false } = {}) { const p = wob(pts, amp, wave, seed, closed), p2 = twice ? wob(pts, amp * 1.6, wave * 0.8, seed + 31, closed) : null;
    crayon(ctx, x => { stroke(x, p, w, color, closed); if (p2) stroke(x, p2, w * 0.8, color, closed); }, { press: press * 0.72, seed });
    crayon(ctx, x => { stroke(x, p, w * 0.55, color, closed); if (p2) stroke(x, p2, w * 0.4, color, closed); }, { press: Math.min(0.97, press * 1.25), seed: seed + 1 }); }
  // 乱线填色
  function waxFill(ctx, poly, { color = '#fff', w = 12, gap = 13, angle = -0.6, over = 10, press = 0.55, seed = 1, amp = 2.5, passes = 1 } = {}) {
    for (let k = 0; k < passes; k++) { const zs = zigzag(poly, { angle: angle + k * 0.5, gap: gap * (1 + k * 0.3), over, seed: seed + k * 7 });
      crayon(ctx, x => zs.forEach((z, i) => stroke(x, wob(z, amp, 40, seed + i + k * 3), w, color)), { press: press * 0.8, seed: seed + k });
      crayon(ctx, x => zs.forEach((z, i) => stroke(x, wob(z, amp, 40, seed + i + k * 3), w * 0.5, color)), { press: Math.min(0.97, press * 1.3), seed: seed + k + 5 }); } }

  // ---------- 网点 ----------
  // tone(x,y) → 0..1（点占格子的比例）；clip 可选多边形
  function halftone(ctx, tone, { pitch = 10, angle = 0.26, color = '#111', clip = null, box = [0, 0, W, H], max = 0.72, shape = 'dot' } = {}) { ctx.save(); if (clip) { path(ctx, clip); ctx.clip(); }
    const c = Math.cos(angle), s = Math.sin(angle), [bx, by, bw, bh] = box, cx = bx + bw / 2, cy = by + bh / 2, R = Math.hypot(bw, bh) / 2 + pitch; ctx.fillStyle = color; ctx.beginPath();
    for (let v = -R; v <= R; v += pitch) for (let u = -R; u <= R; u += pitch) { const x = cx + u * c - v * s, y = cy + u * s + v * c; if (x < bx - pitch || x > bx + bw + pitch || y < by - pitch || y > by + bh + pitch) continue;
      const t = clamp(tone(x, y)); if (t < 0.02) continue; const r = pitch * max * Math.sqrt(t); ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }
    ctx.fill(); ctx.restore(); }

  // ---------- 纸纹 ----------
  function grain(ctx, { amount = 0.08, seed = 3, blend = 'overlay', fiber = 0.06 } = {}) { const r = rng(seed), c = layer(x => { const im = x.createImageData(W, H), d = im.data; for (let i = 0; i < W * H; i++) { const v = r() * 255; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; } x.putImageData(im, 0, 0); });
    ctx.save(); ctx.globalCompositeOperation = blend; ctx.globalAlpha = amount; ctx.drawImage(c, 0, 0);
    if (fiber) { const lo = layer(x => { const im = x.createImageData(240, 135), d = im.data; for (let i = 0; i < 240 * 135; i++) { const v = r() * 255; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; } x.putImageData(im, 0, 0); }, 240, 135);
      ctx.globalAlpha = fiber; ctx.imageSmoothingEnabled = true; ctx.drawImage(lo, 0, 0, W, H); }
    ctx.restore(); }

  return { norm, paths, W, H, TAU, rng, n1, n2, lerp, clamp, sstep, cr, len, resample, normals, wob, path, fill, thick, ellipse, xf, ink, line, scan, hatch, zigzag, layer, tint, tooth, crayon, stroke, waxLine, waxFill, halftone, grain };
})();
