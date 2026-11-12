// 水彩渲染器：颜料跟着水走。
// 一片颜色 = 几十层略有不同的变形多边形（水边每一层都流得不一样）→ 边缘软、不规则；
// 水干的时候颜料被带到边上 → 湿边更深（咖啡环）；颜料颗粒沉进纸纹的凹处 → 颗粒感；
// 后加的水把颜料推开 → 回流花（中间浅、边缘一圈花椰菜一样的深线）。
// 颜色叠加按透射：out = 纸 × col^(浓度)，所以叠色（glazing）天然变深、变饱和。
(function () {
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  function fbm(x, y, o = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; } return s; }
  function gauss(R) { let u = 0, v = 0; while (u === 0) u = R(); v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };

  // 多边形变形：每条边的中点按高斯偏移（偏移量 ∝ 边长 × 这个点的“湿度”）
  function deform(poly, depth, R, amt) {
    let P = poly.map(p => [p[0], p[1], p[2] == null ? 0.5 + R() * 0.8 : p[2]]);
    for (let d = 0; d < depth; d++) {
      const out = [];
      for (let i = 0; i < P.length; i++) {
        const a = P[i], b = P[(i + 1) % P.length]; out.push(a);
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]); const v = (a[2] + b[2]) / 2;
        out.push([(a[0] + b[0]) / 2 + gauss(R) * L * amt * v, (a[1] + b[1]) / 2 + gauss(R) * L * amt * v, Math.max(0.05, v * (0.8 + 0.4 * R()))]);
      }
      P = out;
    }
    return P;
  }

  class Paper {
    constructor(ctx, W, H, o = {}) {
      this.ctx = ctx; this.W = W; this.H = H; this.seed = o.seed || 1;
      this.tex = new Float32Array(W * H); // 纸纹高度 0..1（冷压纸）
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) this.tex[y * W + x] = 0.55 * fbm(x / 5.5, y / 5.5, 3) + 0.3 * fbm(x / 18, y / 18, 2) + 0.15 * hash(x, y);
      const base = hex(o.color || '#f7f3ea');
      this.buf = new Float32Array(W * H * 3);
      for (let i = 0; i < W * H; i++) { const t = this.tex[i]; const sh = 0.97 + 0.06 * (t - 0.5); for (let c = 0; c < 3; c++) this.buf[i * 3 + c] = base[c] * sh; }
      this.c = document.createElement('canvas'); this.c.width = W; this.c.height = H; this.g = this.c.getContext('2d', { willReadFrequently: true });
      this.b = document.createElement('canvas'); this.b.width = W; this.b.height = H; this.gb = this.b.getContext('2d', { willReadFrequently: true });
    }
    // 一片水彩
    // polys: 一个或几个多边形；o: {color, layers, alpha, depth, amt, blur 湿画晕开, edge 湿边, gran 颗粒, strength, bloom:[[x,y,r,amt]], seed, mask(x,y)->0..1}
    wash(polys, o = {}) {
      const { W, H, g, gb } = this; const R = rng(o.seed || 7);
      const layers = o.layers || 40, alpha = o.alpha || 0.045, amt = o.amt == null ? 0.9 : o.amt;
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.filter = 'none'; g.clearRect(0, 0, W, H); g.fillStyle = '#000';
      const bases = polys.map(p => deform(p, o.baseDepth == null ? 3 : o.baseDepth, R, (o.baseAmt || 0.35) * amt));
      for (let l = 0; l < layers; l++) {
        g.globalAlpha = alpha;
        for (const b of bases) { const P = deform(b, o.depth || 3, R, 0.32 * amt); g.beginPath(); P.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill(); }
      }
      if (o.blur) { gb.setTransform(1, 0, 0, 1, 0, 0); gb.clearRect(0, 0, W, H); gb.filter = `blur(${o.blur}px)`; gb.drawImage(this.c, 0, 0); gb.filter = 'none'; g.globalAlpha = 1; g.clearRect(0, 0, W, H); g.drawImage(this.b, 0, 0); }
      const A = g.getImageData(0, 0, W, H).data;
      gb.setTransform(1, 0, 0, 1, 0, 0); gb.clearRect(0, 0, W, H); gb.filter = `blur(${o.edgeR || 7}px)`; gb.drawImage(this.c, 0, 0); gb.filter = 'none';
      const B = gb.getImageData(0, 0, W, H).data;
      const col = hex(o.color || '#3a6fd8'), edge = o.edge == null ? 2.2 : o.edge, gran = o.gran == null ? 0.9 : o.gran, k = o.strength || 2.2;
      const blooms = o.bloom || [];
      const buf = this.buf, tex = this.tex;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x; const a = A[i * 4 + 3] / 255; if (a < 0.003) continue;
        const bl = B[i * 4 + 3] / 255;
        let d = a + edge * Math.max(0, a - bl) * (0.6 + 0.8 * a); // 湿边
        d *= 1 + gran * (0.5 - tex[i]) * (0.6 + 0.6 * a);       // 颜料沉进纸纹凹处
        for (const [bx, by, br, ba] of blooms) {                // 回流花
          const dd = Math.hypot(x - bx, y - by) + (fbm(x / 26, y / 26, 4) - 0.5) * br * 0.7 + (fbm(x / 7, y / 7, 2) - 0.5) * br * 0.12;
          if (dd < br * 1.12) { const inside = dd < br ? 1 : 0; const rim = Math.exp(-Math.pow((dd - br) / (br * 0.035 + 1.2), 2)); d *= (inside ? (1 - ba * (0.75 - 0.25 * dd / br)) : 1) + rim * ba * 1.3; }
        }
        if (o.mask) d *= o.mask(x, y);
        if (d <= 0) continue;
        for (let c = 0; c < 3; c++) buf[i * 3 + c] *= Math.pow(col[c], d * k);
      }
    }
    // 甩点：笔杆一敲，大小点溅出去
    splatter(cx, cy, R0, n, o = {}) {
      const R = rng(o.seed || 3); const polys = [];
      for (let i = 0; i < n; i++) { const a = R() * Math.PI * 2, r = R0 * Math.pow(R(), 0.6); const s = (o.size || 6) * Math.pow(R(), 2.5) + 1; const x = cx + Math.cos(a) * r * (o.sx || 1), y = cy + Math.sin(a) * r * (o.sy || 1); const p = []; for (let k = 0; k < 8; k++) { const t = k / 8 * Math.PI * 2; p.push([x + Math.cos(t) * s, y + Math.sin(t) * s]); } polys.push(p); }
      this.wash(polys, { color: o.color, layers: 6, alpha: 0.4, amt: 0.4, depth: 1, baseDepth: 1, edge: 1.5, gran: 0.3, seed: o.seed, strength: o.strength || 0.9 });
    }
    // 垂流：画板一斜，颜料往下流成一道，尾巴积一颗珠
    drip(x, y, len, w, o = {}) {
      const R = rng(o.seed || 9); const p = []; const n = 20; let xx = x;
      const left = [], right = [];
      for (let i = 0; i <= n; i++) { const t = i / n; xx += (R() - 0.5) * 1.6; const ww = w * (1.4 - 0.9 * Math.sqrt(t)) * (0.85 + 0.3 * R()); left.push([xx - ww / 2, y + t * len]); right.push([xx + ww / 2, y + t * len]); }
      const bead = []; for (let k = 0; k <= 12; k++) { const t = Math.PI - k / 12 * Math.PI; bead.push([xx + Math.cos(t) * w * 0.5, y + len + Math.sin(t) * w * 0.55]); }
      this.wash([[...left, ...bead, ...right.reverse()]], { color: o.color, layers: 12, alpha: 0.07, amt: 0.12, depth: 2, baseDepth: 1, edge: 2.5, gran: 0.6, seed: o.seed, strength: o.strength || 0.8, blur: 1.5 });
    }
    flush() {
      const { W, H, buf } = this; const img = this.ctx.createImageData(W, H); const D = img.data;
      for (let i = 0; i < W * H; i++) { D[i * 4] = Math.min(255, buf[i * 3] * 255); D[i * 4 + 1] = Math.min(255, buf[i * 3 + 1] * 255); D[i * 4 + 2] = Math.min(255, buf[i * 3 + 2] * 255); D[i * 4 + 3] = 255; }
      this.ctx.putImageData(img, 0, 0);
    }
  }
  // 常用形状
  function ellipse(cx, cy, rx, ry, rot = 0, n = 12) { const p = []; for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2; const x = Math.cos(t) * rx, y = Math.sin(t) * ry; p.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]); } return p; }
  // 花瓣：根部窄、头部宽、顶上一个小凹
  function petal(cx, cy, len, wid, rot, notch = 0.1, r0 = 0) {
    const pts = []; const N = 14;
    for (let i = 0; i <= N; i++) { const u = i / N; const hw = wid * 0.5 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.75)), 0.8); pts.push([r0 + len * u, -hw]); }
    pts.push([r0 + len * (1 - notch), 0]);
    for (let i = N; i >= 0; i--) { const u = i / N; const hw = wid * 0.5 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.75)), 0.8); pts.push([r0 + len * u, hw]); }
    return pts.map(([x, y]) => [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
  }
  window.WC = { Paper, rng, fbm, hex, ellipse, petal, deform };
})();
