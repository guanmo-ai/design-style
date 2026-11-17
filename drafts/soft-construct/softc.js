// softc.js — 软构成的共用部分：色板、轴、把“海报像素坐标里画的平面图形”变成毛绒零件。风格图和片子共用。
// 依赖 kit/motion.js、kit/director.js、kit/shapes.js、fur/fur.js。
const SC = (() => {
  // 色板：构成主义的纸、黑、红 + 孟菲斯的糖果色。每种颜色是一对：根（深）→ 尖（这个颜色本身）
  const COL = { paper: '#F1E8D6', ink: '#161412', red: '#D3261C', pink: '#FF7EB6', yellow: '#FFD23F', teal: '#22C3B5', blue: '#2D4BFF', cream: '#FFF6E4' };
  const TONES = {
    red: { root: '#5e0703', tip: '#ee2e1e', len: 0.6, curl: 0.05, gloss: 0.9, droop: 0.12 },
    ink: { root: '#030303', tip: '#2a2522', len: 0.8, curl: 0.05, gloss: 1.0, droop: 0.1 },
    pink: { root: '#8c1a55', tip: '#ff9ccb', len: 1, curl: 0.07, gloss: 0.9, droop: 0.15 },
    yellow: { root: '#b87000', tip: '#ffe25e', len: 0.9, curl: 0.06, gloss: 0.9, droop: 0.12 },
    teal: { root: '#03483f', tip: '#4ff0dc', len: 0.8, curl: 0.06, gloss: 0.9, droop: 0.12 },
    blue: { root: '#0a1680', tip: '#6c86ff', len: 0.9, curl: 0.06, gloss: 0.9, droop: 0.12 },
    cream: { root: '#a8977a', tip: '#fffaf0', len: 0.8, curl: 0.05, gloss: 0.8, droop: 0.12 },
    shadow: { root: '#161412', tip: '#161412', len: 0, curl: 0, gloss: 0, droop: 0 },   // 孟菲斯的硬投影：只有“皮”，没有毛，平的
    // 没长毛之前的平面版本（速查卡的前两步、片子开头）：只有“皮”
    redF: { root: '#c0231a', tip: '#c0231a', len: 0 }, inkF: { root: '#161412', tip: '#161412', len: 0 }, pinkF: { root: '#e872a6', tip: '#e872a6', len: 0 },
  };
  const TI = {}; Object.keys(TONES).forEach((k, i) => TI[k] = i);
  // 轴：主轴 −30°（斜的是主角）、副轴 60°、信息 0°。屏幕坐标里 y 朝下，所以主轴方向是 (cos30, −sin30)
  const AX = { main: -30, cross: 60, U: [0.866, -0.5], N: [0.5, 0.866] };
  const at = (o, u, n = 0) => [o[0] + AX.U[0] * u + AX.N[0] * n, o[1] + AX.U[1] * u + AX.N[1] * n];   // 沿主轴走 u、沿法线走 n

  // 平面图形（在海报像素坐标里画）
  const path = {
    circle: (c, r) => ctx => { ctx.beginPath(); ctx.arc(c[0], c[1], r, 0, 6.2832); ctx.fill(); },
    // 楔子：底边中点 b，尖 a，底边半宽 w
    wedge: (b, a, w) => ctx => { const dx = a[0] - b[0], dy = a[1] - b[1], l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l;
      ctx.beginPath(); ctx.moveTo(b[0] + nx * w, b[1] + ny * w); ctx.lineTo(a[0], a[1]); ctx.lineTo(b[0] - nx * w, b[1] - ny * w); ctx.closePath(); ctx.fill(); },
    // 条：从 a 到 b，宽 w
    bar: (a, b, w) => ctx => { ctx.save(); ctx.lineWidth = w; ctx.lineCap = 'butt'; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); ctx.restore(); },
    // 孟菲斯的波浪线：沿 a→b，振幅 amp，n 个波
    squiggle: (a, b, amp, n, w) => ctx => { ctx.save(); ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#fff'; ctx.beginPath();
      const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l;
      for (let i = 0; i <= 160; i++) { const t = i / 160, s = Math.sin(t * n * 6.2832) * amp; ctx.lineTo(a[0] + dx * t + nx * s, a[1] + dy * t + ny * s); } ctx.stroke(); ctx.restore(); },
    text: (str, x, y, font, rot = 0) => ctx => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.font = font; ctx.textBaseline = 'alphabetic'; ctx.fillText(str, 0, 0); ctx.restore(); },
  };

  // 孟菲斯的图案染在毛里：返回 (海报像素 x, y) → 色号
  const dye = {
    solid: t => () => TI[t],
    zebra: (a, b, period, dir = [0.866, -0.5]) => (x, y) => (Math.floor((x * dir[0] + y * dir[1]) / period) & 1) ? TI[b] : TI[a],
    dots: (a, b, step, r, off = [0, 0]) => (x, y) => { const u = (x - off[0]) / step, v = (y - off[1]) / step, row = Math.round(v), uu = u + (row & 1) * 0.5;
      return Math.hypot(uu - Math.round(uu), v - Math.round(v)) * step < r ? TI[b] : TI[a]; },
  };

  // 把一组零件（各自一张平面图）变成同一批 N 根毛：先量面积，按面积分毛，最后一个零件吃掉零头
  // parts: [{ draw, dye, part, depth, edge, back, z }]；k 是遮罩相对海报像素的缩放（越小越快）
  function build(N, parts, { W, H, ppu, k = 0.6, seed = 3 } = {}) {
    const w = Math.round(W * k), h = Math.round(H * k), cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    const area = parts.map(p => { ctx.clearRect(0, 0, w, h); ctx.save(); ctx.scale(k, k); ctx.fillStyle = '#fff'; p.draw(ctx); ctx.restore();
      const d = ctx.getImageData(0, 0, w, h).data; let a = 0; for (let i = 3; i < d.length; i += 4) a += d[i]; return a / 255 * (p.density ?? 1); });
    const tot = area.reduce((a, b) => a + b, 0); let left = N;
    const list = parts.map((p, i) => {
      const n = i === parts.length - 1 ? left : Math.round(N * area[i] / tot); left -= n;
      const s = SHAPES.fromMask(n, (c) => { c.save(); c.scale(k, k); p.draw(c); c.restore(); },
        { w, h, scale: 1 / (ppu * k), depth: p.depth ?? 0.22, edge: (p.edge ?? 40) * k, back: p.back ?? 0.04, seed: seed + i * 7,
          partFn: () => p.part, toneFn: (x, y) => p.dye(x / k, y / k) });
      if (p.z) for (let j = 0; j < n; j++) s.pos[j * 3 + 2] += p.z;
      return s;
    });
    return SHAPES.merge(list, seed);
  }
  // 海报像素 → 墙上的世界坐标（镜头正对墙，看向原点）
  const cam = (W, H, fov = 0.4, d = 9) => { const ppu = H / (2 * d * Math.tan(fov / 2)); return { ppu, w: (x, y) => [(x - W / 2) / ppu, (H / 2 - y) / ppu], eye: [0, 0, d], at: [0, 0, 0], fov }; };
  // 沿屏幕方向 (dx, dy) 像素的位移矩阵
  const shift = (C, dx, dy) => M.T(dx / C.ppu, -dy / C.ppu, 0);
  // 以海报像素 p 为原点，沿方向 dir 压扁 s（垂直方向按体积补回来）——孟菲斯：以接触面为原点压扁
  const squashAt = (C, p, dir, s) => { const w = C.w(...p), a = Math.atan2(-dir[1], dir[0]), inv = 1 / Math.sqrt(Math.max(s, 0.05));
    return M.chain(M.T(w[0], w[1], 0), M.RZ(a), M.S(s, inv, 1), M.RZ(-a), M.T(-w[0], -w[1], 0)); };
  function tones(F) { Object.entries(TONES).forEach(([k, v]) => F.tone(TI[k], v)); }
  return { COL, TONES, TI, AX, at, path, dye, build, cam, shift, squashAt, tones };
})();
