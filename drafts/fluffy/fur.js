// 毛绒渲染器（Canvas 2D，不用 WebGL）：把任意形状“种”上几万根毛。图和片子共用这一份。
// 做法：形状 → 模糊成一个鼓起来的高度场 → 每根毛的方向 = 表面法线（边缘往外炸）+ 梳理方向（顶上顺着躺）
//       → 颜色 = 法线对着光的程度；根暗、尖亮；按高度从低到高一层层画（低的先画，被高的盖住）。
// 交互都是对“每根毛”的一个函数：grow 长出来多少、groove 被手指划开、wind 被风压弯。
(function () {
  const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const mix = (a, b, k) => a + (b - a) * k;
  const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let x = a; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; };
  const h2 = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const vnoise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy); return mix(mix(h2(xi, yi), h2(xi + 1, yi), ux), mix(h2(xi, yi + 1), h2(xi + 1, yi + 1), ux), uy); };
  const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const css = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
  const mixc = (a, b, k) => [mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k)];
  const distSeg = (px, py, a, b) => { const vx = b[0] - a[0], vy = b[1] - a[1], t = cl(((px - a[0]) * vx + (py - a[1]) * vy) / (vx * vx + vy * vy || 1)); const qx = a[0] + vx * t, qy = a[1] + vy * t; return [Math.hypot(px - qx, py - qy), qx, qy]; };

  /**
   * 在 ctx 上画一个毛绒形状。坐标都是 CSS 像素，k = 画布倍率。
   * o.draw(g)     用白色把形状画出来（g 已按 k 缩放）
   * o.box         [x, y, w, h] 形状的大致范围（会自动外扩）
   * o.color       毛色；o.shade 暗部色；o.tip 毛尖色（不给就自动算）
   * o.len         毛长；o.puff 鼓起来的半径；o.density 每平方像素几根
   * o.comb        [dx, dy] 梳理方向；o.curl 卷曲；o.clump 成簇
   * o.grow(x,y)   0..1 这里的毛长出来多少；o.grooves [{pts, r}] 手指划过的沟；o.wind(x,y) → [dx, dy]
   */
  function shape(ctx, k, o) {
    const L = (o.len ?? 34) * k, PUFF = (o.puff ?? 30) * k, pad = Math.ceil(L * 1.6 + PUFF);
    const bx = Math.max(0, Math.floor(o.box[0] * k - pad)), by = Math.max(0, Math.floor(o.box[1] * k - pad));
    const bw = Math.min(ctx.canvas.width - bx, Math.ceil(o.box[2] * k + pad * 2)), bh = Math.min(ctx.canvas.height - by, Math.ceil(o.box[3] * k + pad * 2));
    const mk = (f) => { const c = document.createElement('canvas'); c.width = bw; c.height = bh; const g = c.getContext('2d', {willReadFrequently: true}); f(g, c); return c; };
    const mask = mk((g) => { g.translate(-bx, -by); g.scale(k, k); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; o.draw(g); });
    const blur = (r) => mk((g) => { g.filter = `blur(${r}px)`; g.drawImage(mask, 0, 0); }).getContext('2d').getImageData(0, 0, bw, bh).data;
    const M = mask.getContext('2d').getImageData(0, 0, bw, bh).data, Hs = blur(PUFF * 0.5), Hb = blur(PUFF * 1.5);
    const A = (D, x, y) => D[((y | 0) * bw + (x | 0)) * 4 + 3] / 255;
    const U = (x, y) => cl((A(Hs, cl(x, 0, bw - 1), cl(y, 0, bh - 1)) - 0.5) * 2);
    const base = hex(o.color), shade = o.shade ? hex(o.shade) : base.map((v, i) => v * [0.42, 0.26, 0.5][i]), tip = o.tip ? hex(o.tip) : mixc(base, [255, 250, 240], 0.62);
    const LD = [-0.42, -0.62, 0.66];
    const comb = o.comb ?? [0.25, 1], curl = o.curl ?? 0.9, seed = o.seed ?? 1, r = rng(seed * 7919 + 13);
    // —— 影子 ——
    if (o.shadow !== false) {
      const sh = o.shadowColor ?? 'rgba(30,14,80,1)';
      for (const [dx, dy, bl, al] of [[26, 46, 34, 0.3], [8, 16, 10, 0.34]]) {
        ctx.save(); ctx.globalAlpha = al; ctx.filter = `blur(${bl * k}px)`;
        const t = mk((g) => { g.drawImage(mask, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = sh; g.fillRect(0, 0, bw, bh); });
        ctx.drawImage(t, bx + dx * k, by + dy * k); ctx.restore();
      }
    }
    // —— 底：鼓起来的“皮”，毛缝里露出来的就是它 ——
    const skin = mk((g) => {
      const im = g.createImageData(bw, bh), O = im.data;
      for (let y = 1; y < bh - 1; y++) for (let x = 1; x < bw - 1; x++) {
        const a = M[(y * bw + x) * 4 + 3]; if (!a) continue;
        const gx = U(x + 2, y) - U(x - 2, y), gy = U(x, y + 2) - U(x, y - 2), u = U(x, y);
        let nx = -gx * 9, ny = -gy * 9, nz = 0.35 + u; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
        const dif = cl(nx * LD[0] + ny * LD[1] + nz * LD[2]);
        // 还没长毛的地方是一块光滑的“皮”（更亮、带一点高光）；长了毛的地方是毛缝里的暗底
        const bald = o.grow ? 1 - cl(o.grow((x + bx) / k, (y + by) / k) * 2.2) : 0;
        let c = mixc(shade, base, 0.1 + 0.62 * dif);
        if (bald > 0) { const sp = Math.pow(cl(nx * -0.3 + ny * -0.5 + nz * 0.8), 18); c = mixc(c, mixc(mixc(shade, base, 0.35 + 0.65 * dif), [255, 255, 255], 0.1 + 0.2 * dif + 0.5 * sp), bald); }
        const i = (y * bw + x) * 4;
        O[i] = c[0]; O[i + 1] = c[1]; O[i + 2] = c[2]; O[i + 3] = a;
      }
      g.putImageData(im, 0, 0);
    });
    ctx.drawImage(skin, bx, by);
    // —— 毛 ——
    const NL = 14, NS = 12, layers = Array.from({length: NL}, () => Array.from({length: NS * 3}, () => []));
    const n = Math.floor(bw * bh * (o.density ?? 0.11) / (k * k) * k * 1.25), cs = (o.clump ?? 15) * k;
    let count = 0;
    for (let i = 0; i < n; i++) {
      const x = r() * bw, y = r() * bh;
      if (M[((y | 0) * bw + (x | 0)) * 4 + 3] < 128) { r(); r(); r(); continue; }
      const X = (x + bx) / k, Y = (y + by) / k; // CSS 坐标
      let grow = o.grow ? cl(o.grow(X, Y)) : 1;
      const r1 = r(), r2 = r(), r3 = r();
      if (grow < 0.04) continue;
      const u = U(x, y), thick = cl((A(Hb, x, y) - 0.42) * 2.6);
      const gx = U(x + 3, y) - U(x - 3, y), gy = U(x, y + 3) - U(x, y - 3);
      let nx = -gx * 7, ny = -gy * 7, nz = 0.3 + u * 1.1; let l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
      // 梳理方向：大方向 + 低频噪声（一缕一缕的）
      const na = (vnoise(X * 0.006 + seed, Y * 0.006) - 0.5) * 2.6 * curl + (vnoise(X * 0.03, Y * 0.03 + seed) - 0.5) * 1.1 * curl;
      let fx = comb[0] * Math.cos(na) - comb[1] * Math.sin(na), fy = comb[0] * Math.sin(na) + comb[1] * Math.cos(na);
      let vx = nx * 1.25 + fx * (0.3 + 0.7 * nz), vy = ny * 1.25 + fy * (0.3 + 0.7 * nz);
      let len = L * (0.5 + 0.5 * thick) * (0.7 + 0.6 * r1) * grow, dark = 0;
      if (o.wind) { const w = o.wind(X, Y); vx += w[0]; vy += w[1]; }
      if (o.grooves) for (const gr of o.grooves) {
        let best = 1e9, qx = 0, qy = 0;
        for (let j = 0; j < gr.pts.length - 1; j++) { const d = distSeg(X, Y, gr.pts[j], gr.pts[j + 1]); if (d[0] < best) { best = d[0]; qx = d[1]; qy = d[2]; } }
        const q = best / gr.r;
        if (q < 1.6) {
          const px = (X - qx) / (best || 1), py = (Y - qy) / (best || 1), w = q < 1 ? 1 - q * q : 0;
          const jit = (r1 - 0.5) * 1.1; // 别倒得太整齐
          vx = mix(vx, px * 1.5 - py * jit, w * 0.85); vy = mix(vy, py * 1.5 + px * jit, w * 0.85);
          len *= q < 1 ? 0.42 + 0.58 * q : 1 + 0.25 * Math.exp(-Math.pow((q - 1.15) / 0.2, 2)); // 沟里压扁，沟沿堆起来
          dark += 0.5 * w - 0.22 * Math.exp(-Math.pow((q - 1.15) / 0.22, 2));
        }
      }
      // 成簇：同一簇的毛尖往簇心靠
      const cxi = Math.floor(x / cs), cyi = Math.floor(y / cs), ccx = (cxi + 0.5 + (h2(cxi, cyi + seed) - 0.5) * 0.8) * cs, ccy = (cyi + 0.5 + (h2(cxi + 9, cyi) - 0.5) * 0.8) * cs;
      const vl = Math.hypot(vx, vy) || 1, plen = len * cl(0.35 + 0.65 * vl / 1.6, 0.3, 1.25);
      let tx = x + (vx / vl) * plen, ty = y + (vy / vl) * plen + plen * 0.16;
      const cp = 0.3 * cl(len / (L * 0.8)) * cl(len / (L * 0.8)); // 短毛不成簇（不然会看出格子）
      tx = mix(tx, ccx + (vx / vl) * plen, cp); ty = mix(ty, ccy + (vy / vl) * plen + plen * 0.16, cp);
      const sag = plen * 0.22 * (r2 - 0.35), mx = (x + tx) / 2 - (vy / vl) * sag, my = (y + ty) / 2 + (vx / vl) * sag + plen * 0.07;
      const dif = cl(nx * LD[0] + ny * LD[1] + nz * LD[2]);
      const rim = cl(1 - nz * 1.25) * cl((nx * LD[0] + ny * LD[1]) * 1.6 + 0.2); // 逆光的边：毛尖透亮
      const s = cl(0.12 + 0.78 * dif + 0.35 * rim + (r3 - 0.5) * 0.2 - dark - 0.16 * (1 - thick));
      const li = Math.min(NL - 1, Math.floor(cl(u * 0.82 + r2 * 0.18) * NL)), si = Math.min(NS - 1, Math.floor(s * NS));
      const q1x = mix(mix(x, mx, 0.4), mix(mx, tx, 0.4), 0.4), q1y = mix(mix(y, my, 0.4), mix(my, ty, 0.4), 0.4);
      const q2x = mix(mix(x, mx, 0.74), mix(mx, tx, 0.74), 0.74), q2y = mix(mix(y, my, 0.74), mix(my, ty, 0.74), 0.74);
      const B = layers[li];
      B[si * 3].push(x, y, q1x, q1y); B[si * 3 + 1].push(q1x, q1y, q2x, q2y); B[si * 3 + 2].push(q2x, q2y, tx, ty);
      count++;
    }
    ctx.save(); ctx.translate(bx, by); ctx.lineCap = 'round';
    const wd = (o.width ?? 2.1) * k;
    for (let li = 0; li < NL; li++) for (let si = 0; si < NS; si++) for (let sg = 0; sg < 3; sg++) {
      const P = layers[li][si * 3 + sg]; if (!P.length) continue;
      const s = (si + 0.5) / NS;
      let c = mixc(shade, base, cl(s * 1.7)); if (s > 0.55) c = mixc(c, tip, (s - 0.55) / 0.45 * 0.75);
      c = sg === 0 ? mixc(c, shade, 0.55) : sg === 2 ? mixc(c, tip, 0.2 + 0.3 * s) : c;
      ctx.strokeStyle = css(c); ctx.lineWidth = wd * [1.15, 0.9, 0.55][sg]; ctx.beginPath();
      for (let i = 0; i < P.length; i += 4) { ctx.moveTo(P[i], P[i + 1]); ctx.lineTo(P[i + 2], P[i + 3]); }
      ctx.stroke();
    }
    ctx.restore();
    return count;
  }
  window.Fur = {shape, rng, vnoise, cl, mix};
})();
