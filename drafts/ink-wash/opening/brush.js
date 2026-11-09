// 水墨 · 笔刷引擎（Canvas 2D，无贴图）
// 一笔 = 一条样条骨架 + 一条粗细曲线 + 一束笔毛（默认 56 根）。
// 每根笔毛有自己的墨量，越往后墨越少，墨量低于阈值就断开 → 飞白；边缘笔毛再画一层宽而淡的湿晕。
// 起—行—收：progress(τ) 先慢（按下顿住）、再快（行笔）、最后减速（提笔出锋）。
(function (G) {
  function rng(seed) {
    let s = (seed * 2654435761) >>> 0 || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  function noise1(seed) {
    const r = rng(seed), tab = new Float32Array(256);
    for (let i = 0; i < 256; i++) tab[i] = r();
    return x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return tab[i & 255] * (1 - u) + tab[(i + 1) & 255] * u; };
  }
  // Catmull-Rom 过控制点 → 按弧长重采样 n 个点
  function spline(pts, n) {
    const raw = [];
    const P = [pts[0], ...pts, pts[pts.length - 1]];
    for (let i = 1; i < P.length - 2; i++) {
      const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
      for (let k = 0; k < 24; k++) {
        const t = k / 24, t2 = t * t, t3 = t2 * t;
        const f = j => .5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3);
        raw.push([f(0), f(1)]);
      }
    }
    raw.push(pts[pts.length - 1]);
    const L = [0];
    for (let i = 1; i < raw.length; i++) L.push(L[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]));
    const total = L[L.length - 1] || 1, out = new Float32Array(n * 2);
    let j = 0;
    for (let i = 0; i < n; i++) {
      const d = total * i / (n - 1);
      while (j < L.length - 2 && L[j + 1] < d) j++;
      const seg = (L[j + 1] - L[j]) || 1, f = (d - L[j]) / seg;
      out[i * 2] = raw[j][0] + (raw[j + 1][0] - raw[j][0]) * f;
      out[i * 2 + 1] = raw[j][1] + (raw[j + 1][1] - raw[j][1]) * f;
    }
    return { P: out, total };
  }
  function profile(keys) {
    return s => {
      if (s <= keys[0][0]) return keys[0][1];
      for (let i = 1; i < keys.length; i++) if (s <= keys[i][0]) {
        const a = keys[i - 1], b = keys[i], f = (s - a[0]) / (b[0] - a[0]), u = f * f * (3 - 2 * f);
        return a[1] + (b[1] - a[1]) * u;
      }
      return keys[keys.length - 1][1];
    };
  }
  // def: { pts, w:[[s,w]…], size, tone, dry, seed, bristles, color, wet }
  function make(def) {
    const N = 220;
    const { P, total } = spline(def.pts, N);
    const NX = new Float32Array(N), NY = new Float32Array(N), W = new Float32Array(N);
    const wf = profile(def.w || [[0, .8], [.1, 1], [.85, .8], [1, .1]]);
    let maxW = 0;
    for (let i = 0; i < N; i++) {
      const a = Math.max(0, i - 2), b = Math.min(N - 1, i + 2);
      let dx = P[b * 2] - P[a * 2], dy = P[b * 2 + 1] - P[a * 2 + 1];
      const l = Math.hypot(dx, dy) || 1;
      NX[i] = -dy / l; NY[i] = dx / l;
      W[i] = wf(i / (N - 1)) * def.size;
      maxW = Math.max(maxW, W[i]);
    }
    const B = def.bristles || 56, r = rng(def.seed || 1), br = [];
    for (let b = 0; b < B; b++) {
      const o = (b / (B - 1)) * 2 - 1 + (r() - .5) * .04;
      br.push({ o, cap: .75 + .55 * r(), nz: noise1((def.seed || 1) * 97 + b), a: .55 + .45 * r() * (1 - .5 * Math.abs(o)) });
    }
    return { P, NX, NY, W, N, total, br, maxW, lw: maxW / B * 3.0, tone: def.tone == null ? .92 : def.tone, dry: def.dry == null ? .5 : def.dry,
      color: def.color || '20,20,19', wet: def.wet == null ? 1 : def.wet };
  }
  // 起—行—收
  function progress(tau) {
    if (tau <= 0) return 0;
    if (tau >= 1) return 1;
    if (tau < .14) return .05 * Math.pow(tau / .14, 2);
    if (tau < .80) { const u = (tau - .14) / .66; return .05 + .85 * (.5 - .5 * Math.cos(Math.PI * u)); }
    const u = (tau - .80) / .20; return .90 + .10 * (1 - Math.pow(1 - u, 3));
  }
  function head(st, p) {
    const i = Math.max(0, Math.min(st.N - 1, Math.round(p * (st.N - 1))));
    return { x: st.P[i * 2], y: st.P[i * 2 + 1], w: st.W[i], nx: st.NX[i], ny: st.NY[i] };
  }
  // 画到进度 p（0–1）
  function draw(ctx, st, p, alpha = 1) {
    if (p <= 0) return;
    const iEnd = Math.max(1, Math.min(st.N - 1, Math.floor(p * (st.N - 1))));
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // 湿晕：边缘笔毛，宽而淡
    if (st.wet > 0) {
      ctx.strokeStyle = `rgba(${st.color},1)`;
      ctx.lineWidth = st.lw * 3.2;
      ctx.globalAlpha = .045 * st.tone * alpha * st.wet;
      for (const b of st.br) {
        if (Math.abs(b.o) < .72) continue;
        ctx.beginPath();
        for (let i = 0; i <= iEnd; i++) {
          const s = i / (st.N - 1), h = st.W[i] * .5 * b.o * 1.06;
          const x = st.P[i * 2] + st.NX[i] * h, y = st.P[i * 2 + 1] + st.NY[i] * h;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
    }
    ctx.lineWidth = st.lw;
    ctx.strokeStyle = `rgba(${st.color},1)`;
    for (const b of st.br) {
      ctx.globalAlpha = st.tone * b.a * alpha;
      ctx.beginPath();
      let pen = false;
      for (let i = 0; i <= iEnd; i++) {
        const s = i / (st.N - 1);
        const ink = b.cap - s * st.dry * 1.3 + .4 * (b.nz(s * 14) - .5);
        if (ink < .14) { pen = false; continue; }
        const h = st.W[i] * .5 * b.o;
        const x = st.P[i * 2] + st.NX[i] * h, y = st.P[i * 2 + 1] + st.NY[i] * h;
        if (!pen) { ctx.moveTo(x, y); pen = true; } else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  G.Brush = { make, draw, progress, head, rng, noise1 };
})(window);
