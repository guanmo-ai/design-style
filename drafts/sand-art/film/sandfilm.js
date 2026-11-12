// 沙画片子的引擎：一盘沙（厚度图）+ 一串手法（时间轴上的操作）。每一帧 = 帧号的纯函数。
// 唯一的物理：沙守恒——擦掉的沙不会消失，被推到两边（沙脊）和指尖 / 掌缘前面（越推越大的一堆）。
// 沙脊刚堆起来又窄又高，SETTLE 帧内塌宽：动作停了，沙还在动。
// 用法：const E = SANDFILM.engine(W, H, ops); E.at(f) → 这一帧的沙（Field），E.fx(f) → 正在落 / 滚的沙粒。
(function () {
  const SETTLE = 12, LIVE = 70; // 沙脊塌宽的时间常数；动作结束多少帧后算“定了”（进快照）
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  function fbm(x, y, o = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; } return s; }
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  // 缓动：手的速度——起手慢、中间快、收手慢（速度连续）
  const ease = { io: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, o: t => 1 - Math.pow(1 - t, 3), i: t => t * t * t, io2: t => t * t * (3 - 2 * t), lin: t => t };

  // 掌纹：沿掌宽方向的一维噪声（查表，掌推的时候每个格子都要查）
  const STREAK = new Float32Array(16384); for (let i = 0; i < 16384; i++) STREAK[i] = fbm((i - 8192) / 4 / 9, 3.7, 3);
  function densify(pts, step) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      const L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]); const n = Math.max(1, Math.ceil(L / step));
      for (let j = 0; j < n; j++) { const t = j / n, t2 = t * t, t3 = t2 * t; const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3); out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]); }
    }
    out.push(pts[pts.length - 1]);
    // 等距重采样（手的速度由缓动决定，不由控制点疏密决定）
    const L = [0]; for (let i = 1; i < out.length; i++) L.push(L[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
    const tot = L[L.length - 1], n = Math.max(2, Math.ceil(tot / step)), res = []; let j = 0;
    for (let i = 0; i <= n; i++) { const s = tot * i / n; while (j < L.length - 2 && L[j + 1] < s) j++; const k = (s - L[j]) / Math.max(1e-6, L[j + 1] - L[j]); res.push([out[j][0] + (out[j + 1][0] - out[j][0]) * k, out[j][1] + (out[j + 1][1] - out[j][1]) * k]); }
    return res;
  }

  class Field {
    constructor(W, H, r) { this.W = W; this.H = H; this.r = r; this.w = Math.round(W * r); this.h = Math.round(H * r); this.d = new Float32Array(this.w * this.h); }
    copyFrom(o) { this.d.set(o.d); return this; }
    clone() { return new Field(this.W, this.H, this.r).copyFrom(this); }
    fill(fn) { const { w, h, d, r } = this; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) d[y * w + x] = Math.max(0, fn(x / r, y / r, d[y * w + x])); }
    area(cx, cy, R, f) { const { w, h, r } = this; const x0 = Math.max(0, Math.floor((cx - R) * r)), x1 = Math.min(w - 1, Math.ceil((cx + R) * r)), y0 = Math.max(0, Math.floor((cy - R) * r)), y1 = Math.min(h - 1, Math.ceil((cy + R) * r)); for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const px = x / r, py = y / r; const dd = Math.hypot(px - cx, py - cy); if (dd <= R) f(y * w + x, dd, px, py); } }
    sample(px, py) { const { w, h, d, r } = this; const x = clamp(px * r, 0, w - 1.001), y = clamp(py * r, 0, h - 1.001); const xi = x | 0, yi = y | 0, xf = x - xi, yf = y - yi; const i = yi * w + xi; return d[i] * (1 - xf) * (1 - yf) + d[i + 1] * xf * (1 - yf) + d[i + w] * (1 - xf) * yf + d[i + w + 1] * xf * yf; }
    // 把 amt 的沙按高斯堆在 (cx,cy) 一圈 / 一团里（守恒：总量 = amt）
    deposit(cx, cy, sig, amt, shape, Rmax) {
      if (amt <= 0) return; const R = Rmax || sig * 2.6; let ws = 0; const L = [];
      this.area(cx, cy, R, (j, dd, px, py) => { const wv = shape ? shape(px, py, dd) : Math.exp(-dd * dd / (2 * sig * sig)); if (wv > 1e-4) { L.push(j, wv); ws += wv; } });
      if (ws <= 0) return; const k = amt / ws * (this.r * this.r) * 0 + amt / ws; // 每格加的量（格子单位）
      for (let i = 0; i < L.length; i += 2) this.d[L[i]] += k * L[i + 1];
    }
  }

  // —— 三种手法 ——
  // 手指 / 手掌：o = {pts, r 半径, keep 留多少沙, side 推到两边的比例, front 推到前面的比例, taper, step, soft 边缘软硬}
  // t = 画到哪（0..1，已缓动），age(i) = 第 i 个点被划过之后过了几帧
  function push(F, o, t, ageAt) {
    const P = o._P || (o._P = densify(o.pts, Math.max(1.5, o.r * (o.stepK || 0.32))));
    const n = Math.round((P.length - 1) * t) + 1; if (t <= 0) return null;
    const keep = o.keep == null ? 0.02 : o.keep, side = o.side == null ? 0.75 : o.side, frontK = o.front == null ? 0.35 : o.front;
    const Lp = o.lp || o.r * 6; const step = Math.hypot(P[1][0] - P[0][0], P[1][1] - P[0][1]) || 1;
    let frontAmt = 0; const cellA = 1;
    for (let i = 0; i < n; i++) {
      const [cx, cy] = P[i]; const tp = o.taper ? (0.45 + 0.55 * Math.min(1, i / (P.length * 0.12 + 1), (P.length - 1 - i) / (P.length * 0.15 + 1))) : 1;
      const R = o.r * tp; let moved = 0;
      const soft = o.soft == null ? 0.55 : o.soft;
      const ovl = step / (2 * R * (1 - 0.5 * (o.soft == null ? 0.55 : o.soft)));  // 一个点被几次盖到 → 每次只拿走一部分，总共留下 keep
      let nx = 0, ny = 0; if (o.streak) { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)]; const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; nx = -(b[1] - a[1]) / l; ny = (b[0] - a[0]) / l; }
      F.area(cx, cy, R, (j, dd, px, py) => { const f = 1 - smooth(R * soft, R, dd); const kp0 = o.streak ? clamp(keep * (0.2 + 1.6 * STREAK[(((px - cx) * nx + (py - cy) * ny) * 4 + 8192 | 0) & 16383]), 0, 0.95) : keep; const kp = kp0 > 0 ? Math.pow(kp0, ovl) : 0; const take = F.d[j] * f * (1 - kp); F.d[j] -= take; moved += take; });
      // 离指尖越近，越多的沙还推在前面（手指一抬，这一堆就留在笔画末端）
      const fromTip = (n - 1 - i) * step; const fk = frontK * clamp(1 - fromTip / Lp);
      frontAmt += moved * fk;
      const sideAmt = moved * (1 - fk);  // 守恒：推走的 = 两边 + 前面，一粒不少（side 只决定沙脊的软硬）
      // 沙脊：刚堆起来窄而高，SETTLE 帧内塌宽（总量不变）
      const age = ageAt(i, n, P.length); const spread = 1 + 0.9 * (1 - Math.exp(-age / SETTLE));
      const rc = R * 1.15, sg = R * (0.22 + (1 - side) * 0.5) * spread;
      F.deposit(cx, cy, 0, sideAmt, (px, py, dd) => (dd < R * 0.85 ? 0 : Math.exp(-Math.pow((dd - rc - sg * 0.6) / sg, 2))), rc + sg * 3.2);
    }
    // 前面那一堆：月牙形，在指尖前 1.2R
    const i = n - 1, a = P[Math.max(0, i - 2)], b = P[Math.min(P.length - 1, i + 1 === P.length ? i : i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const tip = P[i], R = o.r, fx = tip[0] + dx * R * 1.15, fy = tip[1] + dy * R * 1.15;
    F.deposit(fx, fy, R * (o.moundR || 0.9), frontAmt, (px, py) => { const u = (px - fx) * dx + (py - fy) * dy, v = -(px - fx) * dy + (py - fy) * dx; const su = R * (o.moundU || 0.28), sv = R * (o.moundV || 0.75); const uu = u + (v * v) / (R * 4) * (o.curve || 0); return Math.exp(-uu * uu / (2 * su * su) - v * v / (2 * sv * sv)) * (uu > -R * 0.6 ? 1 : 0); });
    return { tip, dir: [dx, dy], n, N: P.length };
  }
  // 倒沙：沿路径落一线沙（max 叠加），返回正在落的位置（给沙粒特效用）
  function pour(F, o, t) {
    const P = o._P || (o._P = densify(o.pts, Math.max(1, o.r * 0.4))); const n = Math.round((P.length - 1) * t) + 1; if (t <= 0) return null;
    const amt = o.amt == null ? 1.4 : o.amt;
    for (let i = 0; i < n; i++) { const tp = o.taper ? Math.min(1, i / (P.length * 0.3 + 1), (P.length - i) / (P.length * 0.3 + 1)) * 0.7 + 0.3 : 1; const R = o.r * tp; F.area(P[i][0], P[i][1], R, (j, dd) => { const f = 1 - smooth(R * 0.4, R, dd); F.d[j] = Math.max(F.d[j], amt * f + F.d[j] * (1 - f)); }); }
    return { tip: P[n - 1] };
  }
  // 慢慢“长”出一片形状（掌侧抹亮 / 撒暗）：d → target，按 t 混
  function morph(F, o, t) { const { w, h, d, r } = F; const tt = t; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const px = x / r, py = y / r; const m = o.mask(px, py, tt); if (m > 0) { const j = y * w + x; d[j] += (o.target(px, py, d[j]) - d[j]) * m; } } }

  // —— 时间轴引擎 ——
  // op = {f0, f1, kind:'push'|'pour'|'morph'|'base', ease, ...}
  function engine(W, H, ops, base, res = 0.5) {
    ops.forEach((o, i) => { o.i = i; o.ease = o.ease || 'io'; });
    const snaps = new Map(); // k → Field（前 k 个操作都定了）
    const settled = (o) => o.f1 + LIVE;
    function apply(F, o, f, fx) {
      const dur = Math.max(1, o.f1 - o.f0); const t = o.kind === 'base' ? 1 : ease[o.ease](clamp((f - o.f0) / dur));
      if (o.kind === 'push') {
        const ageAt = (i, n, N) => { if (f >= 1e8) return 1e4; const ti = i / Math.max(1, N - 1); /* 第 i 点被划过时的进度 */ const back = (t - ti) * dur; return Math.max(0, back) + Math.max(0, f - o.f1); };
        const r = push(F, o, t, ageAt); if (fx && r && f < o.f1 + 6) fx.push({ kind: 'tip', op: o, x: r.tip[0], y: r.tip[1], dir: r.dir, k: 1 - clamp((f - o.f1) / 6), t });
      } else if (o.kind === 'pour') { const r = pour(F, o, t); if (fx && r && f < o.f1 + 14) fx.push({ kind: 'pour', op: o, x: r.tip[0], y: r.tip[1], k: f <= o.f1 ? 1 : 1 - (f - o.f1) / 14, f }); }
      else if (o.kind === 'morph') { morph(F, o, t); if (fx && o.fx && t > 0 && t < 1) for (const p of o.fx(t, f)) fx.push(Object.assign({ kind: 'pour', op: o, k: 1, f }, p)); }
      else if (o.kind === 'fn') { const r = o.fn(F, t, f); if (fx && r && t > 0 && t < 1) for (const p of r) fx.push(Object.assign({ kind: 'pour', op: o, k: 1, f }, p)); }
    }
    function snapshot(k) {
      if (k === 0) { if (!snaps.has(0)) { const F = new Field(W, H, res); base(F); snaps.set(0, F); } return snaps.get(0); }
      if (snaps.has(k)) return snaps.get(k);
      let j = k - 1; while (j > 0 && !snaps.has(j)) j--;
      const F = snapshot(j).clone(); for (let i = j; i < k; i++) apply(F, ops[i], 1e9, null);
      snaps.set(k, F); if (snaps.size > 40) { const first = [...snaps.keys()].filter(x => x !== 0)[0]; snaps.delete(first); }
      return F;
    }
    const work = new Field(W, H, res);
    function at(f) {
      let k = 0; while (k < ops.length && settled(ops[k]) <= f) k++;
      work.copyFrom(snapshot(k)); const fx = [];
      for (let i = k; i < ops.length; i++) { const o = ops[i]; if (o.f0 > f) continue; apply(work, o, f, fx); }
      return { F: work, fx };
    }
    return { at, Field };
  }

  // —— 渲染：灯箱 × 透射；查表 + 静态光图，一帧几十毫秒 ——
  function renderer(ctx, W, H, o = {}) {
    const k = o.k || 2.6, tint = o.tint || [0.8, 1.12, 1.75], sand = [42, 24, 12];
    const N = 2048, TMAX = 4; const LUT = [new Float32Array(N), new Float32Array(N), new Float32Array(N)];
    for (let c = 0; c < 3; c++) for (let i = 0; i < N; i++) { const th = i / (N - 1) * TMAX; let T = Math.exp(-k * th * tint[c]); T = T * T * (3 - 2 * T) * 0.6 + T * 0.4; LUT[c][i] = T; }
    const grain = new Float32Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) grain[y * W + x] = 0.62 + 0.5 * hash(x, y) + 0.35 * (hash(x >> 1, y >> 1) - 0.5);
    const lightAt = o.light || ((x, y, f) => { const dx = (x - W * 0.5) / W, dy = (y - H * 0.55) / H; const v = Math.exp(-(dx * dx * 1.6 + dy * dy * 2.4) * 2.2); return [255 * (0.9 + 0.1 * v), 244 * (0.82 + 0.18 * v), 214 * (0.7 + 0.3 * v)]; });
    const L = new Float32Array(W * H * 3); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const l = lightAt(x, y); const i = (y * W + x) * 3; L[i] = l[0]; L[i + 1] = l[1]; L[i + 2] = l[2]; }
    const img = ctx.createImageData(W, H); const D = img.data; for (let i = 3; i < D.length; i += 4) D[i] = 255;
    const sm = document.createElement('canvas'); sm.width = W / 6 | 0; sm.height = H / 6 | 0; const g = sm.getContext('2d');
    return function draw(F, f, opt = {}) {
      const breathe = opt.light == null ? 1 : opt.light; const r = F.r, fw = F.w, fd = F.d;
      for (let y = 0; y < H; y++) {
        const fy = Math.min(F.h - 1.001, y * r), yi = fy | 0, yf = fy - yi;
        for (let x = 0; x < W; x++) {
          const fx = Math.min(fw - 1.001, x * r), xi = fx | 0, xf = fx - xi, j = yi * fw + xi;
          const hh = fd[j] * (1 - xf) * (1 - yf) + fd[j + 1] * xf * (1 - yf) + fd[j + fw] * (1 - xf) * yf + fd[j + fw + 1] * xf * yf;
          const p = y * W + x; const th = hh * grain[p]; const q = Math.min(N - 1, (th / TMAX * (N - 1)) | 0);
          const i4 = p * 4, i3 = p * 3;
          const T0 = LUT[0][q], T1 = LUT[1][q], T2 = LUT[2][q];
          D[i4] = L[i3] * breathe * T0 + sand[0] * (1 - T0) * 0.25; D[i4 + 1] = L[i3 + 1] * breathe * T1 + sand[1] * (1 - T1) * 0.25; D[i4 + 2] = L[i3 + 2] * breathe * T2 + sand[2] * (1 - T2) * 0.25;
        }
      }
      ctx.putImageData(img, 0, 0);
      // 泛光：亮处往外溢
      g.filter = 'blur(6px) brightness(1.1)'; g.drawImage(ctx.canvas, 0, 0, sm.width, sm.height);
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = opt.bloom == null ? 0.38 : opt.bloom; ctx.drawImage(sm, 0, 0, W, H); ctx.restore();
    };
  }
  // 透光公式（给 HUD 用：三档沙厚 → 颜色）
  function colorOf(h, o = {}) { const k = o.k || 2.6, tint = [0.8, 1.12, 1.75], Lc = [255, 244 * 0.95, 214 * 0.9]; return tint.map((t, c) => { let T = Math.exp(-k * h * t); T = T * T * (3 - 2 * T) * 0.6 + T * 0.4; return Math.round(Lc[c] * T + [42, 24, 12][c] * (1 - T) * 0.25); }); }

  // 沙粒：正在落的沙溅开、指尖前滚动的沙粒（确定性：种子 + 帧号）
  function grains(ctx, fx, f) {
    ctx.save();
    for (const e of fx) {
      const R = rng(e.op.i * 977 + 13);
      if (e.kind === 'pour') {
        // 一股细沙从上面落下：落点周围一圈溅开的沙粒，越往外越稀
        const n = Math.round(90 * e.k);
        for (let i = 0; i < n; i++) { const a = R() * 6.283, sp = 6 + R() * 40, life = 10 + R() * 14; const ph = ((f * 1.0 + R() * life) % life) / life; const rr = sp * Math.sqrt(ph) * (e.op.r / 8 + 0.6); const x = e.x + Math.cos(a) * rr, y = e.y + Math.sin(a) * rr * 0.9; ctx.fillStyle = `rgba(24,12,4,${(0.85 * (1 - ph) * e.k).toFixed(3)})`; const s = 1 + R() * 1.6; ctx.fillRect(x, y, s, s); }
      } else if (e.kind === 'tip') {
        // 指尖前面滚动的几粒沙
        const n = Math.round(Math.min(30, e.op.r * 1.6) * e.k); const [dx, dy] = e.dir;
        for (let i = 0; i < n; i++) { const u = 1.0 + R() * 1.1, v = (R() - .5) * 2.2; const jit = hash(i + 7, f) - .5; const x = e.x + (dx * u - dy * v) * e.op.r + jit * 2, y = e.y + (dy * u + dx * v) * e.op.r + (hash(f, i) - .5) * 2; ctx.fillStyle = `rgba(30,15,5,${(0.75 * e.k).toFixed(3)})`; const s = 1 + R() * 1.4; ctx.fillRect(x, y, s, s); }
      }
    }
    ctx.restore();
  }

  window.SANDFILM_push = (F, o) => push(F, o, 1, () => 1e4);
  window.SANDFILM_pour = (F, o) => pour(F, o, 1);
  window.SANDFILM_morph = (F, mask, target) => morph(F, { mask: (x, y) => mask(x, y), target }, 1);
  window.SANDFILM = { engine, renderer, grains, colorOf, densify, fbm, smooth, clamp, rng, ease, Field };
})();
