// shapes.js — 把形状变成 N 个毛根（位置 + 法线 + 零件号 + 色号）。每个形状都正好用完同一批 N 根毛。
// fromPrims：椭球 / 胶囊 / 旋转体拼出来的东西（熊、茶杯、帽子）；fromMask：把任意平面图形（字、心形、图标）“充气”成鼓起来的枕头。
const SHAPES = (() => {
  const mk = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const rotY = (v, a) => { const c = Math.cos(a), s = Math.sin(a); return [c * v[0] + s * v[2], v[1], -s * v[0] + c * v[2]]; };
  const rotZ = (v, a) => { const c = Math.cos(a), s = Math.sin(a); return [c * v[0] - s * v[1], s * v[0] + c * v[1], v[2]]; };
  const rotX = (v, a) => { const c = Math.cos(a), s = Math.sin(a); return [v[0], c * v[1] - s * v[2], s * v[1] + c * v[2]]; };
  const rot = (v, e) => e ? rotY(rotX(rotZ(v, e[2] || 0), e[0] || 0), e[1] || 0) : v;
  const unrot = (v, e) => e ? rotZ(rotX(rotY(v, -(e[1] || 0)), -(e[0] || 0)), -(e[2] || 0)) : v;

  function area(p) {
    if (p.type === 'ell') { const [a, b, c] = p.r, q = 1.6075; return 4 * Math.PI * Math.pow((Math.pow(a * b, q) + Math.pow(a * c, q) + Math.pow(b * c, q)) / 3, 1 / q); }
    if (p.type === 'cap') { const l = Math.hypot(p.b[0] - p.a[0], p.b[1] - p.a[1], p.b[2] - p.a[2]); return Math.PI * (p.ra + p.rb) * l + 2 * Math.PI * (p.ra * p.ra + p.rb * p.rb); }
    if (p.type === 'rev') { let s = 0; for (let i = 0; i + 1 < p.profile.length; i++) { const [r0, y0] = p.profile[i], [r1, y1] = p.profile[i + 1]; s += Math.PI * (r0 + r1) * Math.hypot(r1 - r0, y1 - y0); } return s; }
    return 0;
  }
  function inside(p, x, m = 0.0) {
    if (p.type === 'ell') { const v = unrot([x[0] - p.c[0], x[1] - p.c[1], x[2] - p.c[2]], p.rot); const q = (v[0] / (p.r[0] - m)) ** 2 + (v[1] / (p.r[1] - m)) ** 2 + (v[2] / (p.r[2] - m)) ** 2; return q < 1; }
    if (p.type === 'cap') { const ab = [p.b[0] - p.a[0], p.b[1] - p.a[1], p.b[2] - p.a[2]], ax = [x[0] - p.a[0], x[1] - p.a[1], x[2] - p.a[2]];
      const t = Math.max(0, Math.min(1, (ax[0] * ab[0] + ax[1] * ab[1] + ax[2] * ab[2]) / (ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2)));
      return Math.hypot(ax[0] - ab[0] * t, ax[1] - ab[1] * t, ax[2] - ab[2] * t) < p.ra + (p.rb - p.ra) * t - m; }
    return false;
  }
  function sample(p, R) {
    if (p.type === 'ell') {
      const [a, b, c] = p.r, wmax = Math.max(a * b, b * c, a * c);
      for (;;) { const z = 2 * R() - 1, ph = 6.28318 * R(), s = Math.sqrt(1 - z * z), u = [s * Math.cos(ph), z, s * Math.sin(ph)];
        const w = a * b * c * Math.hypot(u[0] / a, u[1] / b, u[2] / c);
        if (R() * wmax > w) continue;
        const n = [u[0] / a, u[1] / b, u[2] / c], nl = Math.hypot(...n);
        const P = rot([u[0] * a, u[1] * b, u[2] * c], p.rot), Nn = rot(n.map(v => v / nl), p.rot);
        return [[P[0] + p.c[0], P[1] + p.c[1], P[2] + p.c[2]], Nn]; }
    }
    if (p.type === 'cap') {
      const ab = [p.b[0] - p.a[0], p.b[1] - p.a[1], p.b[2] - p.a[2]], l = Math.hypot(...ab), d = ab.map(v => v / l);
      let e1 = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]; const dp = e1[0] * d[0] + e1[1] * d[1] + e1[2] * d[2];
      e1 = e1.map((v, i) => v - d[i] * dp); const el = Math.hypot(...e1); e1 = e1.map(v => v / el);
      const e2 = [d[1] * e1[2] - d[2] * e1[1], d[2] * e1[0] - d[0] * e1[2], d[0] * e1[1] - d[1] * e1[0]];
      const As = Math.PI * (p.ra + p.rb) * l, Aa = 2 * Math.PI * p.ra ** 2, Ab = 2 * Math.PI * p.rb ** 2, u = R() * (As + Aa + Ab);
      const ph = 6.28318 * R(), cs = Math.cos(ph), sn = Math.sin(ph), rad = [0, 1, 2].map(i => e1[i] * cs + e2[i] * sn);
      if (u < As) { let t; for (;;) { t = R(); if (R() * Math.max(p.ra, p.rb) <= p.ra + (p.rb - p.ra) * t) break; }
        const r = p.ra + (p.rb - p.ra) * t; return [[0, 1, 2].map(i => p.a[i] + ab[i] * t + rad[i] * r), rad]; }
      const end = u < As + Aa ? 0 : 1, r = end ? p.rb : p.ra, c = end ? p.b : p.a, sg = end ? 1 : -1, z = R(), s = Math.sqrt(1 - z * z);
      const n = [0, 1, 2].map(i => rad[i] * s + d[i] * z * sg); return [[0, 1, 2].map(i => c[i] + n[i] * r), n];
    }
    if (p.type === 'rev') {
      if (!p._cum) { p._cum = []; let s = 0; for (let i = 0; i + 1 < p.profile.length; i++) { const [r0, y0] = p.profile[i], [r1, y1] = p.profile[i + 1]; s += (r0 + r1) * Math.hypot(r1 - r0, y1 - y0); p._cum.push(s); } }
      const u = R() * p._cum[p._cum.length - 1]; let i = 0; while (p._cum[i] < u) i++;
      const [r0, y0] = p.profile[i], [r1, y1] = p.profile[i + 1]; let t; for (;;) { t = R(); if (R() * Math.max(r0, r1) <= r0 + (r1 - r0) * t) break; }
      const r = r0 + (r1 - r0) * t, y = y0 + (y1 - y0) * t, sl = Math.hypot(r1 - r0, y1 - y0) || 1, nr = (y1 - y0) / sl, ny = -(r1 - r0) / sl, ph = 6.28318 * R();
      const P = rot([r * Math.cos(ph), y, r * Math.sin(ph)], p.rot), Nn = rot([nr * Math.cos(ph), ny, nr * Math.sin(ph)], p.rot);
      return [[P[0] + p.c[0], P[1] + p.c[1], P[2] + p.c[2]], Nn];
    }
  }
  function shuffle(N, s, R) {
    const idx = new Uint32Array(N); for (let i = 0; i < N; i++) idx[i] = i;
    for (let i = N - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)), t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    const o = { pos: new Float32Array(N * 3), nrm: new Float32Array(N * 3), part: new Float32Array(N), tone: new Float32Array(N) };
    for (let i = 0; i < N; i++) { const k = idx[i]; for (let c = 0; c < 3; c++) { o.pos[i * 3 + c] = s.pos[k * 3 + c]; o.nrm[i * 3 + c] = s.nrm[k * 3 + c]; } o.part[i] = s.part[k]; o.tone[i] = s.tone[k]; }
    return o;
  }

  // prims: [{ type, …, part, tone | toneFn(P, N, R), w: 密度倍数, hide: 不参与互相剔除 }]
  function fromPrims(N, prims, { seed = 1 } = {}) {
    const R = mk(seed), s = { pos: new Float32Array(N * 3), nrm: new Float32Array(N * 3), part: new Float32Array(N), tone: new Float32Array(N) };
    const A = prims.map(p => area(p) * (p.w ?? 1)), tot = A.reduce((a, b) => a + b, 0);
    let i = 0;
    prims.forEach((p, k) => {
      const n = k === prims.length - 1 ? N - i : Math.round(N * A[k] / tot);
      for (let j = 0; j < n && i < N; j++) {
        let P, Nn, tries = 0;
        for (;;) { [P, Nn] = sample(p, R); if (++tries > 30 || !prims.some(q => q !== p && !q.nocull && inside(q, P, 0.004))) break; }
        s.pos.set(P, i * 3); s.nrm.set(Nn, i * 3); s.part[i] = p.part ?? 0; s.tone[i] = p.toneFn ? p.toneFn(P, Nn, R) : (p.tone ?? 0); i++;
      }
    });
    return shuffle(N, s, R);
  }

  // 充气的平面图形：draw(ctx, w, h) 用白色画出形状；edge = 鼓起来的边有多宽（像素）；depth = 最鼓处的厚度（世界单位）
  function fromMask(N, draw, { w = 1024, h = 512, scale = 0.004, depth = 0.25, edge = 40, seed = 2, tone = 0, toneFn, partFn, back = 0.22, yoff = 0 } = {}) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d', { willReadFrequently: true }); ctx.fillStyle = '#fff'; draw(ctx, w, h);
    const img = ctx.getImageData(0, 0, w, h).data, al = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) al[i] = img[i * 4 + 3];
    const sdf = GLK.sdfFromAlpha(al, w, h), H = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) { const t = Math.max(0, Math.min(1, -sdf[i] / edge)); H[i] = depth * Math.sqrt(1 - (1 - t) * (1 - t)); }
    GLK.blurField(H, w, h, 2.0);
    const R = mk(seed), s = { pos: new Float32Array(N * 3), nrm: new Float32Array(N * 3), part: new Float32Array(N), tone: new Float32Array(N) };
    const at = (x, y) => H[Math.max(0, Math.min(h - 1, y)) * w + Math.max(0, Math.min(w - 1, x))];
    const bil = (x, y) => { const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
      return (at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx) * (1 - fy) + (at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx) * fy; };
    const WMAX = 4.5;
    for (let i = 0; i < N;) {
      const x = R() * (w - 2) + 1, y = R() * (h - 2) + 1;
      if (sdf[Math.floor(y) * w + Math.floor(x)] > 0.5) continue;
      const gx = (bil(x + 1.5, y) - bil(x - 1.5, y)) / (3 * scale), gy = (bil(x, y + 1.5) - bil(x, y - 1.5)) / (3 * scale);
      const wt = Math.sqrt(1 + gx * gx + gy * gy);
      if (R() * WMAX > Math.min(wt, WMAX)) continue;
      const sg = R() < back ? -1 : 1, z = bil(x, y) * sg;
      const P = [(x - w / 2) * scale, (h / 2 - y) * scale + yoff, z], n = [-gx, gy, sg], nl = Math.hypot(...n);
      s.pos.set(P, i * 3); s.nrm.set(n.map(v => v / nl), i * 3);
      s.part[i] = partFn ? partFn(x, y, P) : 0; s.tone[i] = toneFn ? toneFn(x, y, P, R) : tone; i++;
    }
    return shuffle(N, s, R);
  }
  // 把几个形状拼成一个（毛数相加），再洗一次牌
  function merge(list, seed = 1) {
    const N = list.reduce((a, s) => a + s.part.length, 0), o = { pos: new Float32Array(N * 3), nrm: new Float32Array(N * 3), part: new Float32Array(N), tone: new Float32Array(N) };
    let k = 0; for (const s of list) { o.pos.set(s.pos, k * 3); o.nrm.set(s.nrm, k * 3); o.part.set(s.part, k); o.tone.set(s.tone, k); k += s.part.length; }
    return shuffle(N, o, mk(seed));
  }
  return { fromPrims, fromMask, merge, mk };
})();
