// 沙画渲染器：沙是一张“厚度图”h(x,y)，灯箱从下往上透光——透过来的光 = 灯 × e^(−k·h)。
// 沙薄的地方透出琥珀色，厚的地方近黑；手指划开时，被推开的沙堆在两边 → 亮线旁边总有一道更暗的沙脊。
(function () {
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  function fbm(x, y, o = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; } return s; }

  class Sand {
    constructor(W, H, res = 0.5) { this.W = W; this.H = H; this.r = res; this.w = Math.round(W * res); this.h = Math.round(H * res); this.d = new Float32Array(this.w * this.h); }
    // 铺沙：base + 起伏
    fill(fn) { const { w, h, d, r } = this; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) d[y * w + x] = Math.max(0, fn(x / r, y / r, d[y * w + x])); }
    // 对一个圆形区域做操作（坐标是输出像素）
    _area(cx, cy, R, f) { const { w, h, d, r } = this; const x0 = Math.max(0, Math.floor((cx - R) * r)), x1 = Math.min(w - 1, Math.ceil((cx + R) * r)), y0 = Math.max(0, Math.floor((cy - R) * r)), y1 = Math.min(h - 1, Math.ceil((cy + R) * r)); for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const px = x / r, py = y / r; const dd = Math.hypot(px - cx, py - cy); if (dd <= R) f(y * w + x, dd, px, py); } }
    // 手指划过：中间推空，推开的沙堆在两侧（沙脊）
    finger(pts, o = {}) {
      const rad = o.r || 6, keep = o.keep == null ? 0.02 : o.keep, ridge = o.ridge == null ? 0.7 : o.ridge, step = Math.max(1, rad * 0.35);
      const P = densify(pts, step); const n = Math.max(2, Math.round(P.length * (o.t == null ? 1 : o.t)));
      for (let i = 0; i < n; i++) {
        const [cx, cy] = P[i]; const k = o.taper ? Math.min(1, i / (n * 0.15 + 1), (n - i) / (n * 0.2 + 1)) * 0.6 + 0.4 : 1; const R = rad * k;
        let moved = 0;
        this._area(cx, cy, R, (j, dd) => { const f = 1 - smooth(R * 0.55, R, dd); const take = this.d[j] * f * (1 - keep); this.d[j] -= take; moved += take; });
        const Rr = R * 2.1; let wsum = 0; const ws = [];
        this._area(cx, cy, Rr, (j, dd) => { if (dd < R * 0.9) return; const wv = Math.exp(-Math.pow((dd - R * 1.25) / (R * 0.35), 2)); ws.push([j, wv]); wsum += wv; });
        if (wsum > 0) for (const [j, wv] of ws) this.d[j] += moved * ridge * wv / wsum;
      }
    }
    // 掌侧一抹：大面积、柔和地把沙推薄（渐变的来源）
    palm(cx, cy, R, amt = 0.6, soft = 0.6) { this._area(cx, cy, R, (j, dd) => { const f = 1 - smooth(R * (1 - soft), R, dd); this.d[j] *= 1 - amt * f; }); }
    // 撒沙：一把沙撒下去，中间厚、边缘一粒一粒
    sprinkle(cx, cy, R, amt = 0.5, seed = 1) { const g = rng(seed); this._area(cx, cy, R, (j, dd) => { const f = Math.exp(-Math.pow(dd / (R * 0.5), 2)); if (g() < 0.35 + f) this.d[j] += amt * f * (0.4 + g()); }); }
    // 形状遮罩：fn(x,y) → 0..1，target 为要设成的厚度
    shape(fn, target, mix = 1) { const { w, h, d, r } = this; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const m = fn(x / r, y / r); if (m > 0) { const j = y * w + x; d[j] = d[j] + (target(x / r, y / r, d[j]) - d[j]) * m * mix; } } }
    // 用沙“画”：沿路径倒一道细沙（暗线、鸟、船都是倒出来的）
    pour(pts, o = {}) { const rad = o.r || 4, amt = o.amt == null ? 0.8 : o.amt; const P = densify(pts, Math.max(1, rad * 0.4)); const n = Math.max(2, Math.round(P.length * (o.t == null ? 1 : o.t))); for (let i = 0; i < n; i++) { const tp = o.taper ? Math.min(1, i / (n * 0.3 + 1), (n - i) / (n * 0.3 + 1)) : 1; const R = rad * (0.3 + 0.7 * tp); this._area(P[i][0], P[i][1], R, (j, dd) => { const f = 1 - smooth(R * 0.4, R, dd); this.d[j] = Math.max(this.d[j], amt * f + this.d[j] * (1 - f)); }); } }
    // 用手指“写字”：字形里的沙推空，推出去的沙堆在笔画两边
    text(str, font, x, y, o = {}) {
      const { W, H } = this; const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
      g.font = font; g.textAlign = o.align || 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = '#000'; g.fillText(str, x, y);
      const b = document.createElement('canvas'); b.width = W; b.height = H; const gb = b.getContext('2d'); gb.filter = `blur(${o.blur || 5}px)`; gb.drawImage(c, 0, 0);
      const A = g.getImageData(0, 0, W, H).data, B = gb.getImageData(0, 0, W, H).data; const { w, h, d, r } = this;
      for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { const px = Math.min(W - 1, Math.round(xx / r)), py = Math.min(H - 1, Math.round(yy / r)); const i = (py * W + px) * 4 + 3; const m = A[i] / 255, bl = B[i] / 255; const j = yy * w + xx; d[j] = d[j] * (1 - m * (o.depth || 0.96)) + Math.max(0, bl - m) * (o.ridge == null ? 1.2 : o.ridge); }
    }
    sample(px, py) { const { w, h, d, r } = this; const x = Math.min(w - 1.001, Math.max(0, px * r)), y = Math.min(h - 1.001, Math.max(0, py * r)); const xi = x | 0, yi = y | 0, xf = x - xi, yf = y - yi; const i = yi * w + xi; return d[i] * (1 - xf) * (1 - yf) + d[i + 1] * xf * (1 - yf) + d[i + w] * (1 - xf) * yf + d[i + w + 1] * xf * yf; }
    // 渲染：灯箱光 × 透射率；沙粒噪声让薄沙“一粒一粒”
    render(ctx, o = {}) {
      const { W, H } = this; const img = ctx.createImageData(W, H); const D = img.data;
      const k = o.k || 2.6, tint = o.tint || [0.8, 1.12, 1.75], light = o.light || ((x, y) => { const dx = (x - W * 0.5) / W, dy = (y - H * 0.55) / H; const v = Math.exp(-(dx * dx * 1.6 + dy * dy * 2.4) * 2.2); return [255 * (0.9 + 0.1 * v), 244 * (0.82 + 0.18 * v), 214 * (0.7 + 0.3 * v)]; });
      const sand = o.sand || [42, 24, 12];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const hh = this.sample(x, y);
        const g = hash(x, y), g2 = hash(x >> 1, y >> 1); // 单粒 + 小团
        const grain = 0.62 + 0.5 * g + 0.35 * (g2 - 0.5);
        const th = hh * grain;
        const L = light(x, y); const i = (y * W + x) * 4;
        for (let c = 0; c < 3; c++) { let T = Math.exp(-k * th * tint[c]); T = T * T * (3 - 2 * T) * 0.6 + T * 0.4; D[i + c] = L[c] * T + sand[c] * (1 - T) * 0.25; }
        D[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    }
  }
  function smooth(a, b, x) { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function densify(pts, step) {
    // Catmull-Rom
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      const L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]); const n = Math.max(1, Math.ceil(L / step));
      for (let j = 0; j < n; j++) { const t = j / n, t2 = t * t, t3 = t2 * t; const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3); out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]); }
    }
    out.push(pts[pts.length - 1]); return out;
  }
  window.SAND = { Sand, rng, fbm, vnoise, smooth, densify };
})();
