// 水粉背景的画法：整张画是一笔一笔铺出来的。每一笔 = 几根并排的鬃毛线，颜色略有出入。
// 大形状用 wash（按颜色函数铺满一块区域），云和树用 lobes（一堆球，每个球自己有亮面和暗面），草用 grass（一根根）。
const PT = (() => {
  const { rng, n1, n2, lerp, clamp, sstep, path, ellipse, wob, TAU } = HD;
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const C = c => typeof c === 'string' ? hex(c) : c;
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const css = (c, a = 1) => `rgba(${Math.max(0, Math.min(255, c[0])) | 0},${Math.max(0, Math.min(255, c[1])) | 0},${Math.max(0, Math.min(255, c[2])) | 0},${a})`;
  // 色阶：[[位置, 颜色], …]；位置靠得近 = 明暗交界线硬（水粉的“块面”）
  function ramp(stops) { const s = stops.map(([t, c]) => [t, C(c)]); return v => { if (v <= s[0][0]) return s[0][1]; for (let i = 1; i < s.length; i++) if (v <= s[i][0]) return mix(s[i - 1][1], s[i][1], (v - s[i - 1][0]) / (s[i][0] - s[i - 1][0])); return s[s.length - 1][1]; }; }
  // 一笔
  function brush(ctx, x, y, ang, len, w, col, r, { bristles = 3, vary = 9, alpha = 1, curve = 0.18 } = {}) { const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx; ctx.lineCap = 'round';
    for (let b = 0; b < bristles; b++) { const o = bristles > 1 ? (b / (bristles - 1) - 0.5) * w * 0.72 : 0, v = (r() - 0.5) * 2 * vary, l = len * (0.75 + 0.5 * r()), sh = (r() - 0.5) * len * 0.3, cv = (r() - 0.5) * 2 * curve * l;
      const ax = x + nx * o + dx * (sh - l / 2), ay = y + ny * o + dy * (sh - l / 2), bx = ax + dx * l, by = ay + dy * l;
      ctx.strokeStyle = css([col[0] + v, col[1] + v, col[2] + v * 0.8], alpha); ctx.lineWidth = Math.max(1, w / bristles * 1.55); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo((ax + bx) / 2 + nx * cv, (ay + by) / 2 + ny * cv, bx, by); ctx.stroke(); } }
  // 铺色：color(x,y) 返回 [r,g,b] 或 null（不画）；dir(x,y) 返回笔的方向
  function wash(ctx, { box, size = 30, color, dir = () => 0, len = 2.4, density = 1, seed = 1, bristles = 3, vary = 9, alpha = 1, jit = 0.35, curve = 0.18, sizeAt = null }) { const r = rng(seed), [x0, y0, x1, y1] = box, st = size * 0.55 / Math.sqrt(density), pts = [];
    for (let y = y0; y <= y1; y += st) for (let x = x0; x <= x1; x += st) pts.push([x + (r() - 0.5) * st * 1.4, y + (r() - 0.5) * st * 1.4]);
    for (let i = pts.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0, t = pts[i]; pts[i] = pts[j]; pts[j] = t; }
    pts.forEach(([x, y]) => { const c = color(x, y); if (!c) return; const s = sizeAt ? sizeAt(x, y) : size; brush(ctx, x, y, dir(x, y) + (r() - 0.5) * 2 * jit, s * len, s, c, r, { bristles, vary, alpha, curve }); }); }
  // 一堆球：从几个大球开始，每个球在朝上的那半边再长小球
  function lobes(seeds, { levels = 2, kids = 5, ratio = [0.42, 0.62], a0 = -Math.PI * 1.05, a1 = Math.PI * 0.05, seed = 1, out = 0.72, floor = Infinity } = {}) { const r = rng(seed), all = seeds.map(([x, y, R]) => ({ x, y, R, lv: 0 })); let cur = all.slice();
    for (let lv = 1; lv <= levels; lv++) { const nx = []; cur.forEach(p => { const n = Math.max(2, Math.round(kids * (0.6 + r() * 0.8))); for (let i = 0; i < n; i++) { const a = lerp(a0, a1, (i + r()) / n), R = p.R * lerp(ratio[0], ratio[1], r()), c = { x: p.x + Math.cos(a) * p.R * out, y: p.y + Math.sin(a) * p.R * out, R, lv }; if (c.y + R * 0.5 > floor) continue; nx.push(c); all.push(c); } }); cur = nx; }
    return all; }
  function lobeClip(ctx, ls, { floor = Infinity, seed = 1, amp = 0.035 } = {}) { ctx.beginPath(); ls.forEach((l, i) => { const e = wob(ellipse(l.x, l.y, l.R, l.R, 0, Math.max(16, (l.R * 0.5) | 0)), l.R * amp, l.R * 0.5, seed + i, true); ctx.moveTo(e[0][0], e[0][1]); for (let k = 1; k < e.length; k++) ctx.lineTo(e[k][0], e[k][1]); ctx.closePath(); }); ctx.clip(); if (floor < Infinity) { ctx.beginPath(); ctx.rect(-100, -2000, 4000, 2000 + floor); ctx.clip(); } }
  // 给每个球画明暗：v = 球面受光 × a + 整体上亮下暗 × (1−a) + 噪声
  function paintLobes(ctx, ls, { ramp: rp, L = [-0.5, -0.7, 0.5], top, base, sphere = 0.68, size = l => l.R * 0.3, seed = 1, noise = 0.08, dabs = 'tangent', len = 2.2, bristles = 3, vary = 6, post = null, order = 'level', bias = null } = {}) { const r = rng(seed), ll = Math.hypot(...L), Lx = L[0] / ll, Ly = L[1] / ll, Lz = L[2] / ll;
    const list = ls.slice().sort((a, b) => order === 'y' ? (a.y + a.R) - (b.y + b.R) : (a.lv - b.lv) || (b.y - a.y));
    list.forEach((l, li) => { const s = Math.max(3, size(l)), st = s * 0.5, pts = []; for (let y = l.y - l.R; y <= l.y + l.R; y += st) for (let x = l.x - l.R; x <= l.x + l.R; x += st) { const px = x + (r() - 0.5) * st * 1.4, py = y + (r() - 0.5) * st * 1.4, nx = (px - l.x) / l.R, ny = (py - l.y) / l.R, d2 = nx * nx + ny * ny; if (d2 > 1) continue; pts.push([px, py, nx, ny, Math.sqrt(1 - d2)]); }
      for (let i = pts.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0, t = pts[i]; pts[i] = pts[j]; pts[j] = t; }
      pts.forEach(([px, py, nx, ny, nz]) => { const lam = nx * Lx + ny * Ly + nz * Lz, h = clamp((py - top) / (base - top)); let v = (0.5 + 0.5 * lam) * sphere + (1 - h) * (1 - sphere) + (n2(px / 90, py / 90, seed) - 0.5) * 2 * noise + (r() - 0.5) * noise; if (bias) v += bias(px, py); let c = rp(clamp(v)); if (post) c = post(c, px, py, v);
        const ang = dabs === 'tangent' ? Math.atan2(ny, nx) + Math.PI / 2 : r() * Math.PI; brush(ctx, px, py, ang + (r() - 0.5) * 0.7, s * len, s, c, r, { bristles, vary }); }); }); }
  // 草：从远到近一根根画。at(x,y) 返回 { c: 颜色, len: 长度 } 或 null
  function grass(ctx, { box, count, at, wind = 0.35, seed = 1, tip = 0.22 }) { const r = rng(seed), [x0, y0, x1, y1] = box, bl = []; for (let i = 0; i < count; i++) { const u = r(), y = lerp(y0, y1, Math.pow(u, 0.75)), x = lerp(x0, x1, r()); bl.push([x, y]); } bl.sort((a, b) => a[1] - b[1]); ctx.lineCap = 'round';
    bl.forEach(([x, y]) => { const g = at(x, y); if (!g) return; const L = g.len * (0.55 + r() * 0.9), lean = (wind + (r() - 0.5) * 0.7) * L, v = (r() - 0.5) * 26, c = [g.c[0] + v, g.c[1] + v * 1.1, g.c[2] + v * 0.6], w = clamp(L * (g.thick || 0.05), 1, g.maxW || 4.5);
      ctx.strokeStyle = css(c); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + lean * 0.25, y - L * 0.6, x + lean, y - L); ctx.stroke();
      if (r() < 0.55) { const t = mix(c, [236, 240, 150], tip + r() * 0.2); ctx.strokeStyle = css(t); ctx.lineWidth = Math.max(1, w * 0.7); ctx.beginPath(); ctx.moveTo(x + lean * 0.42, y - L * 0.62); ctx.quadraticCurveTo(x + lean * 0.7, y - L * 0.86, x + lean, y - L); ctx.stroke(); } }); }
  // 平涂一个多边形，再在里面扫几笔（让色块不是死平的）
  function block(ctx, poly, col, { size = 10, seed = 1, dir = 0, vary = 7, density = 1 } = {}) { col = C(col); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; poly.forEach(p => { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
    ctx.save(); path(ctx, poly); ctx.fillStyle = css(col); ctx.fill(); ctx.clip(); wash(ctx, { box: [x0, y0, x1, y1], size, color: () => col, dir: () => dir, seed, vary, density }); ctx.restore(); }
  // 折线 → y = f(x)
  function profile(pts) { const p = HD.cr(pts, false, 16); return x => { if (x <= p[0][0]) return p[0][1]; for (let i = 1; i < p.length; i++) if (x <= p[i][0]) { const a = p[i - 1], b = p[i]; return a[1] + (b[1] - a[1]) * (x - a[0]) / Math.max(1e-6, b[0] - a[0]); } return p[p.length - 1][1]; }; }
  return { hex, C, mix, css, ramp, brush, wash, lobes, lobeClip, paintLobes, grass, block, profile };
})();
