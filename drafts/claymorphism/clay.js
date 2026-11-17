// clay.js — 黏土风的核心：把任何平面形状“捏”成哑光黏土（纯 CPU，每个像素是参数的纯函数）
// 原理：形状 → 距离场 → 圆截面高度（像搓出来的泥条）→ 加上手捏的起伏、指纹凹坑、压字
//       → 用高度算法线 → 哑光打光（包裹漫反射 + 彩色阴影 + 一点点蜡感）→ 软投影叠到下面的东西上。
// 黏土和充气、毛绒的区别：按下去的坑留着，不回弹。所以“凹坑”是一等公民（dents）。
(function (G) {
  const INF = 1e20;

  // ---------- 小工具 ----------
  function hash(x, y) { let h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1); h = Math.imul(h ^ (h >>> 15), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
  }
  function fbm(x, y, o = 4) { let s = 0, a = .5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= .5; } return s; }
  const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  function hex(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }

  // Felzenszwalb 一维平方距离变换
  function edt1(f, n, d, v, z) {
    let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
    for (let q = 1; q < n; q++) {
      let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
      k++; v[k] = q; z[k] = s; z[k + 1] = INF;
    }
    k = 0;
    for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
  }
  // 到“外面”的距离（里面的像素才有值）
  function edt(inside, w, h) {
    const g = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) g[i] = inside[i] ? INF : 0;
    const n = Math.max(w, h), f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
    for (let x = 0; x < w; x++) { for (let y = 0; y < h; y++) f[y] = g[y * w + x]; edt1(f, h, d, v, z); for (let y = 0; y < h; y++) g[y * w + x] = d[y]; }
    for (let y = 0; y < h; y++) { for (let x = 0; x < w; x++) f[x] = g[y * w + x]; edt1(f, w, d, v, z); for (let x = 0; x < w; x++) g[y * w + x] = Math.sqrt(d[x]); }
    return g;
  }
  // 三次盒式模糊 ≈ 高斯
  function blur(a, w, h, r) {
    r = Math.max(1, Math.round(r));
    const t = new Float32Array(w * h);
    for (let pass = 0; pass < 3; pass++) {
      for (let y = 0; y < h; y++) {
        let s = 0; const o = y * w;
        for (let x = -r; x <= r; x++) s += a[o + clamp(x, 0, w - 1)];
        for (let x = 0; x < w; x++) { t[o + x] = s / (2 * r + 1); s += a[o + Math.min(x + r + 1, w - 1)] - a[o + Math.max(x - r, 0)]; }
      }
      for (let x = 0; x < w; x++) {
        let s = 0;
        for (let y = -r; y <= r; y++) s += t[clamp(y, 0, h - 1) * w + x];
        for (let y = 0; y < h; y++) { a[y * w + x] = s / (2 * r + 1); s += t[Math.min(y + r + 1, h - 1) * w + x] - t[Math.max(y - r, 0) * w + x]; }
      }
    }
    return a;
  }

  function maskOf(draw, W, H, bb) {
    const c = new OffscreenCanvas(bb.w, bb.h), x = c.getContext('2d');
    x.translate(-bb.x, -bb.y); x.fillStyle = '#fff'; x.strokeStyle = '#fff'; draw(x);
    const im = x.getImageData(0, 0, bb.w, bb.h).data, m = new Uint8Array(bb.w * bb.h);
    for (let i = 0; i < m.length; i++) m[i] = im[i * 4 + 3] > 127 ? 1 : 0;
    return m;
  }
  function bboxOf(draw, W, H, pad) {
    const c = new OffscreenCanvas(W, H), x = c.getContext('2d'); x.fillStyle = '#fff'; x.strokeStyle = '#fff'; draw(x);
    const im = x.getImageData(0, 0, W, H).data;
    let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (let y = 0; y < H; y += 2) for (let xx = 0; xx < W; xx += 2) if (im[(y * W + xx) * 4 + 3] > 0) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W, x1 + pad); y1 = Math.min(H, y1 + pad);
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  // ---------- 主函数 ----------
  // objs: [{ draw(ctx), color:'#hex', R:截面半径, lift:离地高度(影子), dents:[{x,y,rx,ry,ang,depth,print}], deboss:{draw, depth, r}, lump }]
  // 所有坐标都是画布像素。返回 ImageData。
  function render(W, H, bgDraw, objs, opt = {}) {
    const S = opt.scale || 1;
    const L = norm3(opt.light || [-.55, -.75, .62]);
    const out = new Float32Array(W * H * 3);
    // 背景：一块哑光的泥板（很轻的颗粒）
    const bgc = new OffscreenCanvas(W, H), bx = bgc.getContext('2d'); bgDraw(bx);
    const bim = bx.getImageData(0, 0, W, H).data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, g = 1 + fbm(x / (3 * S), y / (3 * S), 2) * .012 + fbm(x / (90 * S), y / (90 * S), 3) * .018;
      out[i * 3] = bim[i * 4] / 255 * g; out[i * 3 + 1] = bim[i * 4 + 1] / 255 * g; out[i * 3 + 2] = bim[i * 4 + 2] / 255 * g;
    }
    const shTint = hex(opt.shadow || '#6B4FA0');
    let seed = 0;
    for (const o of objs) {
      seed += 17.3;
      const R = o.R * S, pad = Math.round(R * 4 + 60 * S);
      const bb = bboxOf(o.draw, W, H, pad);
      if (bb.w <= 0) continue;
      const w = bb.w, h = bb.h, m = maskOf(o.draw, W, H, bb);
      const d = edt(m, w, h);
      // 手捏的不平：边缘轻微啃进去一点，表面低频起伏
      const hgt = new Float32Array(w * h), cov = new Float32Array(w * h);
      const lump = o.lump ?? 1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x; if (!m[i]) continue;
        const gx = (x + bb.x) / S, gy = (y + bb.y) / S;
        const dd = d[i] - (fbm(gx / 38 + seed, gy / 38, 3) * .5 + .5) * 2.2 * S * lump;
        cov[i] = clamp(dd + .5, 0, 1);
        if (dd <= 0) continue;
        const t = Math.min(dd / R, 1);
        let hh = R * Math.sqrt(1 - (1 - t) * (1 - t));                      // 圆截面
        hh += R * .22 * (1 - Math.exp(-dd / (2.5 * R)));                      // 粗的地方再鼓一点
        hgt[i] = hh; continue;
        hh += R * .07 * lump * fbm(gx / 60 + seed, gy / 60 - seed, 4) * t;   // 手捏的起伏
        hh += .35 * S * fbm(gx / 1.6, gy / 1.6, 2) * t;                       // 哑光的细颗粒
        hgt[i] = hh;
      }
      // 中轴折痕抹圆（泥是捏出来的，不会有尖棱），再加手捏起伏和颗粒
      { const keep = new Float32Array(hgt); blur(hgt, w, h, R * .22 + S);
        for (let i = 0; i < w * h; i++) { if (!m[i] || cov[i] <= 0) { hgt[i] = 0; continue; }
          const t = Math.min(keep[i] / R, 1), y = (i / w) | 0, x = i - y * w, gx = (x + bb.x) / S, gy = (y + bb.y) / S;
          hgt[i] = Math.min(hgt[i], keep[i] + R * .05) * .85 + keep[i] * .15;
          hgt[i] += R * .07 * lump * fbm(gx / 60 + seed, gy / 60 - seed, 4) * t + .35 * S * fbm(gx / 1.6, gy / 1.6, 2) * t; } }
      // 压进去的字（凹字）
      if (o.deboss) {
        const dm = maskOf(o.deboss.draw, W, H, bb), dd2 = edt(dm, w, h), rr = (o.deboss.r || 4) * S, dep = (o.deboss.depth || 6) * S;
        for (let i = 0; i < w * h; i++) if (dm[i] && m[i]) hgt[i] -= dep * sstep(0, rr, dd2[i]);
      }
      // 手指按出来的坑：碗形 + 挤出来的一圈边 + 指纹纹路
      for (const k of o.dents || []) {
        const ca = Math.cos(k.ang || 0), sa = Math.sin(k.ang || 0), rx = k.rx * S, ry = k.ry * S, D = k.depth * S;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const i = y * w + x; if (!m[i]) continue;
          const px = x + bb.x - k.x * S, py = y + bb.y - k.y * S;
          const u = (px * ca + py * sa) / rx, v = (-px * sa + py * ca) / ry, r = Math.sqrt(u * u + v * v);
          if (r > 1.6) continue;
          let dh = 0;
          if (r < 1) dh -= D * (1 - r * r) * (1 - r * r);
          dh += D * .28 * Math.exp(-(((r - 1.04) / .16) ** 2));
          if (k.print && r < 1) {
            // 指纹：围着一个偏心的核绕圈，再用噪声扭一扭
            const cu = u + .18, cv = v - .1;
            const rr2 = Math.sqrt(cu * cu * 1.15 + cv * cv) * rx / S + fbm(u * 3 + seed, v * 3, 2) * 3.2;
            const ridge = Math.sin(rr2 * 2 * Math.PI / (k.period || 4.2));
            dh += ridge * .55 * S * (1 - r * r) * sstep(.02, .25, r);
          }
          hgt[i] += dh;
        }
      }
      // 影子：先投到下面已经画好的东西上（软的远影 + 贴地的接触阴影）
      const lift = (o.lift ?? 1) * R;
      const sh1 = new Float32Array(w * h), sh2 = new Float32Array(w * h);
      for (let i = 0; i < w * h; i++) { sh1[i] = cov[i]; sh2[i] = cov[i]; }
      blur(sh1, w, h, R * .9 + lift * .35); blur(sh2, w, h, R * .28);
      const ox = Math.round(lift * .32 - L[0] * R * .4), oy = Math.round(lift * .62 + R * .3);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const X = x + bb.x, Y = y + bb.y; if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
        const sx = x - ox, sy = y - oy;
        const s1 = (sx >= 0 && sy >= 0 && sx < w && sy < h) ? sh1[sy * w + sx] : 0;
        const s = clamp(s1 * .42 + sh2[y * w + x] * .3, 0, .75), j = (Y * W + X) * 3;
        for (let c = 0; c < 3; c++) out[j + c] *= 1 - s * (1 - shTint[c] * .9);
      }
      // 打光
      const base = hex(o.color), deep = base.map((c, ci) => Math.pow(c, 1.9) * .82 + (ci === 2 ? .05 : 0)), hi = base.map(c => c + (1 - c) * .35);
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const i = y * w + x; const a = cov[i]; if (a <= 0) continue;
        const dx = (hgt[i + 1] - hgt[i - 1]) * .5, dy = (hgt[i + w] - hgt[i - w]) * .5;
        let nx = -dx, ny = -dy, nz = 1; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
        const nd = nx * L[0] + ny * L[1] + nz * L[2];
        const dif = clamp((nd + .45) / 1.45, 0, 1);                           // 包裹漫反射：泥是透一点光的
        const sky = nz * .5 + .5;
        // 半程向量的宽高光：哑光，只有一点蜡感
        let hx = L[0], hy = L[1], hz = L[2] + 1; const hl = Math.hypot(hx, hy, hz); hx /= hl; hy /= hl; hz /= hl;
        const spec = Math.pow(clamp(nx * hx + ny * hy + nz * hz, 0, 1), 14) * .1;
        const rim = Math.pow(clamp(1 - nz, 0, 1), 3) * clamp(nx * .6 + ny * .8, 0, 1) * .22;  // 右下的反光（地面回弹）
        const j = ((y + bb.y) * W + x + bb.x) * 3;
        for (let c = 0; c < 3; c++) {
          const k = dif * dif * (3 - 2 * dif);
          let col = deep[c] + (base[c] - deep[c]) * Math.min(1, k * 1.35);
          col += (hi[c] - col) * Math.max(0, k - .74) * 1.6;
          col *= .86 + .14 * sky;
          col += spec + rim * base[c];
          out[j + c] = out[j + c] * (1 - a) + col * a;
        }
      }
    }
    const img = new ImageData(W, H);
    for (let i = 0; i < W * H; i++) {
      const n = (hash(i % W, (i / W) | 0) - .5) * 3 / 255;
      for (let c = 0; c < 3; c++) img.data[i * 4 + c] = clamp(Math.pow(clamp(out[i * 3 + c] + n, 0, 1), 1) * 255, 0, 255);
      img.data[i * 4 + 3] = 255;
    }
    return img;
  }
  function norm3(v) { const l = Math.hypot(...v); return v.map(x => x / l); }
  G.Clay = { render };
})(window);
