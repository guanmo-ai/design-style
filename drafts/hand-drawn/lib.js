// 手绘三联的共用小工具：随机数、噪声、颜色、纸纹 / 颗粒
const HD = (() => {
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  // 2D simplex
  const grad = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
  function makeNoise(seed) {
    const r = rng(seed), p = new Uint8Array(512), q = [...Array(256).keys()];
    for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [q[i], q[j]] = [q[j], q[i]]; }
    for (let i = 0; i < 512; i++) p[i] = q[i & 255];
    const F = .5 * (Math.sqrt(3) - 1), G = (3 - Math.sqrt(3)) / 6;
    return (x, y) => {
      const s = (x + y) * F, i = Math.floor(x + s), j = Math.floor(y + s), t = (i + j) * G;
      const x0 = x - (i - t), y0 = y - (j - t), i1 = x0 > y0 ? 1 : 0, j1 = 1 - i1;
      const x1 = x0 - i1 + G, y1 = y0 - j1 + G, x2 = x0 - 1 + 2 * G, y2 = y0 - 1 + 2 * G;
      const ii = i & 255, jj = j & 255; let n = 0;
      let t0 = .5 - x0 * x0 - y0 * y0; if (t0 > 0) { const g = grad[p[ii + p[jj]] & 7]; t0 *= t0; n += t0 * t0 * (g[0] * x0 + g[1] * y0); }
      let t1 = .5 - x1 * x1 - y1 * y1; if (t1 > 0) { const g = grad[p[ii + i1 + p[jj + j1]] & 7]; t1 *= t1; n += t1 * t1 * (g[0] * x1 + g[1] * y1); }
      let t2 = .5 - x2 * x2 - y2 * y2; if (t2 > 0) { const g = grad[p[ii + 1 + p[jj + 1]] & 7]; t2 *= t2; n += t2 * t2 * (g[0] * x2 + g[1] * y2); }
      return 70 * n;
    };
  }
  function fbm(n, x, y, oct = 5, lac = 2, gain = .5) { let a = 1, f = 1, s = 0, norm = 0; for (let i = 0; i < oct; i++) { s += a * n(x * f, y * f); norm += a; a *= gain; f *= lac; } return s / norm; }
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, t) => { const A = typeof a === 'string' ? hex(a) : a, B = typeof b === 'string' ? hex(b) : b; return [lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)]; };
  const css = (c, al = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${al})`;
  function ramp(stops, t) { // stops: [[t, '#hex'], ...]
    t = clamp(t); for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) { const [t0, c0] = stops[i - 1], [t1, c1] = stops[i]; return mix(c0, c1, (t - t0) / (t1 - t0 || 1)); }
    return hex(stops[stops.length - 1][1]);
  }
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  // 整张图加颗粒（胶片 / 纸），amp 0—255
  function grain(ctx, amp = 8, seed = 1, mono = true) {
    const { width: w, height: h } = ctx.canvas, im = ctx.getImageData(0, 0, w, h), d = im.data, r = rng(seed);
    for (let i = 0; i < d.length; i += 4) { const g = (r() + r() - 1) * amp; if (mono) { d[i] += g; d[i + 1] += g; d[i + 2] += g; } else { d[i] += (r() - .5) * amp * 2; d[i + 1] += (r() - .5) * amp * 2; d[i + 2] += (r() - .5) * amp * 2; } }
    ctx.putImageData(im, 0, 0);
  }
  return { rng, makeNoise, fbm, clamp, lerp, smooth, hex, mix, css, ramp, canvas, grain };
})();
