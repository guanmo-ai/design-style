// 马克笔墨迹渲染器（片子用）。每一帧是帧号的纯函数：INK.draw(ctx, stroke, f, cam) 画出第 f 帧时这一笔的样子。
//
// 签名物理：**墨量 = 笔头停留的时间。** 扁头沿路径按“时间”盖章（不是按距离）：走得慢的地方章盖得密 → 深、积墨；
// 走得快的地方稀 → 浅、露出纤维纹；落笔前停一下 → 起笔一团墨，停得越久越大越深。
// 扁头的角度在纸上是固定的（φ），所以笔宽 = 扁头在走向法线上的投影：横着走宽、竖着走窄——不是写进去的公式，是盖章盖出来的。
// 一笔先画进遮罩（同一笔自己重叠不会变深），上色后用 multiply 叠到纸上：两笔重叠才深一档。
// 墨落下以后还在动：刚落的墨更湿（深一点、有一道反光），十几帧里往外渗开一点、反光退掉。
const INK = (() => {
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // —— 路径：Catmull-Rom 加密，带弧长 ——
  function dense(pts, step = 3, linear = false) {
    const out = [];
    if (linear) for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step)); for (let j = 0; j < n; j++) out.push([a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n]); }
    else for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      const L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]); const n = Math.max(1, Math.ceil(L / step));
      for (let j = 0; j < n; j++) {
        const t = j / n, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    out.push(pts[pts.length - 1].slice());
    let s = 0; const P = out.map((p, i) => { if (i) s += Math.hypot(p[0] - out[i - 1][0], p[1] - out[i - 1][1]); return { x: p[0], y: p[1], s }; });
    for (let i = 0; i < P.length; i++) { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)]; P[i].th = Math.atan2(b.y - a.y, b.x - a.x); }
    return P;
  }
  function at(P, s) {
    if (s <= 0) return P[0]; const L = P[P.length - 1].s; if (s >= L) return P[P.length - 1];
    let lo = 0, hi = P.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (P[m].s < s) lo = m; else hi = m; }
    const a = P[lo], b = P[hi], t = (s - a.s) / ((b.s - a.s) || 1);
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, th: Math.atan2(b.y - a.y, b.x - a.x), s };
  }

  // —— 速度曲线：u ∈ [0,1] → 走过的比例 E(u)，以及速度 E'(u) ——
  // press：两头慢中间快（起笔、收笔都积墨）；flick：起笔慢、越走越快、边走边抬笔（收尾甩细）；even：匀速
  const PROF = {
    press: { E: u => u - 0.8 * Math.sin(2 * Math.PI * u) / (2 * Math.PI), V: u => 1 - 0.8 * Math.cos(2 * Math.PI * u) },
    flick: { E: u => 0.35 * u + 0.65 * (1 - Math.cos(Math.PI * u / 2)), V: u => 0.35 + 0.65 * Math.PI / 2 * Math.sin(Math.PI * u / 2) },
    even: { E: u => u, V: () => 1 },
  };

  // —— 扁头的纤维：沿笔宽方向的透明度起伏（盖章盖出来就是顺着走向的细纹），两边略深（湿边） ——
  const NIB = (() => {
    const c = document.createElement('canvas'); c.width = 160; c.height = 24; const x = c.getContext('2d'); const R = rng(9);
    const img = x.createImageData(160, 24); let n = 0.6, m = 0.6;
    for (let i = 0; i < 160; i++) {
      n += (R() - 0.5) * 0.35; n = clamp(n, 0.25, 1); m = 0.8 * m + 0.2 * n;
      const u = i / 159, edge = Math.min(u, 1 - u);
      let a = 0.42 + 0.58 * m; if (R() < 0.08) a *= 0.35;                      // 偶尔一根干的纤维
      a *= clamp(edge * 110); a = Math.min(1, a * (1 + 0.9 * Math.exp(-edge * 70)));    // 边缘柔一点、湿边深一点
      for (let j = 0; j < 24; j++) { const v = Math.min(j, 23 - j) / 1.5; const k = (i * 24 + j) * 4; img.data[k] = img.data[k + 1] = img.data[k + 2] = 0; img.data[k + 3] = 255 * a * clamp(v); }
    }
    x.putImageData(img, 0, 0); return c;
  })();

  // 遮罩画布（屏幕空间）
  let MASK = null, mctx = null;
  function mask(W, H) { if (!MASK) { MASK = document.createElement('canvas'); MASK.width = W; MASK.height = H; mctx = MASK.getContext('2d'); } return mctx; }

  const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
  const apply = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];

  // —— 一笔在第 f 帧画到哪 ——
  // S: {P(dense), t0, dur, prof, dwell(落笔前停几帧)}
  function progress(S, f) {
    const L = S.P[S.P.length - 1].s, pr = PROF[S.prof || 'press'];
    const tStart = S.t0 + (S.dwell || 0);
    if (f < S.t0) return null;
    if (f < tStart) return { s: 0, u: 0, L, pr, tStart, down: true };
    const u = clamp((f - tStart) / S.dur);
    return { s: L * pr.E(u), u, L, pr, tStart, down: u < 1 };
  }
  // 弧长 s 处是哪一帧画到的（反解 E）
  function timeAt(S, s, pr, L, tStart) { let lo = 0, hi = 1; const g = s / L; for (let k = 0; k < 18; k++) { const m = (lo + hi) / 2; if (pr.E(m) < g) lo = m; else hi = m; } return tStart + S.dur * (lo + hi) / 2; }
  // 笔头在第 f 帧的位置与速度（纸面坐标）——给笔的动画用
  function tip(S, f) {
    const g = progress(S, f); if (!g) return null;
    const q = at(S.P, g.s); const v = g.u < 1 && f >= g.tStart ? g.L * g.pr.V(g.u) / S.dur : 0;
    return { x: q.x, y: q.y, th: q.th, vx: Math.cos(q.th) * v, vy: Math.sin(q.th) * v, down: g.down };
  }

  // —— 画一笔马克笔 ——
  // S: {P, w 笔宽, th 扁头厚, nib 扁头角(弧度), color, alpha, t0, dur, prof, dwell, clip(Path2D,纸面), G(f)→组变换, seed, taper}
  // cam: 纸面 → 屏幕的矩阵 [a b c d e f]
  function draw(ctx, S, f, cam, opt = {}) {
    const g = progress(S, f); if (!g) return;
    const M = S.G ? mul(cam, S.G(f)) : cam;
    const P = S.P, L = g.L, w = S.w, th = S.th || w * 0.3, nib = S.nib ?? 0.6;
    const W = ctx.canvas.width, H = ctx.canvas.height, m = mask(W, H);
    // 屏幕上的包围盒
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const pad = (w + 30);
    for (let i = 0; i < P.length; i += 6) { const q = P[i]; if (q.s > g.s + 6) break; const [X, Y] = apply(M, q.x, q.y); x0 = Math.min(x0, X); y0 = Math.min(y0, Y); x1 = Math.max(x1, X); y1 = Math.max(y1, Y); }
    { const q = at(P, g.s); const [X, Y] = apply(M, q.x, q.y); x0 = Math.min(x0, X); y0 = Math.min(y0, Y); x1 = Math.max(x1, X); y1 = Math.max(y1, Y); }
    const sc = Math.hypot(M[0], M[1]); const pp = pad * sc;
    x0 = Math.max(0, Math.floor(x0 - pp)); y0 = Math.max(0, Math.floor(y0 - pp)); x1 = Math.min(W, Math.ceil(x1 + pp)); y1 = Math.min(H, Math.ceil(y1 + pp));
    if (x1 <= x0 || y1 <= y0) return;
    m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'source-over'; m.clearRect(x0, y0, x1 - x0, y1 - y0);
    m.save(); m.beginPath(); m.rect(x0, y0, x1 - x0, y1 - y0); m.clip();
    const cn = Math.cos(nib), sn = Math.sin(nib);
    const R = rng(S.seed || 1);
    const taper = S.taper ?? (S.prof === 'flick' ? 0.75 : 0.15);
    // 1) 落笔停顿：起笔一团墨，停得越久越大越深（墨往纸里渗）
    const dwellF = Math.min(f, g.tStart) - S.t0;
    if (dwellF > 0 || (S.dwell || 0) > 0) {
      const d = Math.max(0, dwellF) + 1.5, q = P[0];
      const grow = 1 + 0.10 * Math.sqrt(d) + (f > g.tStart ? 0.05 * (1 - Math.exp(-(f - g.tStart) / 10)) : 0);
      const a = 1 - Math.exp(-0.18 * d);
      // 一团圆的墨：停顿越久，往外渗得越大
      m.setTransform(M[0], M[1], M[2], M[3], M[4], M[5]); m.globalAlpha = clamp(a * 0.85); m.fillStyle = '#000';
      const rr = (th * 0.6 + w * 0.08) * (1 + 0.3 * Math.sqrt(d)); m.beginPath(); m.ellipse(q.x, q.y, w * 0.42 * grow * (1 + 0.04 * Math.sqrt(d)), rr, nib + Math.PI / 2 * 0, 0, Math.PI * 2); m.fill();
      const k = Math.max(3, Math.round(d));
      for (let i = 0; i < k; i++) {
        const T = mul(M, [cn, sn, -sn, cn, q.x, q.y]);
        m.setTransform(T[0], T[1], T[2], T[3], T[4], T[5]); m.globalAlpha = clamp(a / k * 2.2);
        m.drawImage(NIB, -w * grow / 2, -th * grow / 2 * (1 + 0.02 * d), w * grow, th * grow * (1 + 0.02 * d));
      }
    }
    // 2) 沿路径按时间盖章：每一段的墨量 ∝ 停留时间（= 段长 / 速度）
    const ds = Math.max(1.2, th / 5);
    const vMean = L / S.dur;
    for (let s = 0; s <= g.s; s += ds) {
      const q = at(P, s);
      const uu = clamp(s / L);
      const tLaid = timeAt(S, s, g.pr, L, g.tStart), age = Math.max(0, f - tLaid);
      // 这一点的速度（反解 u 再取 V）
      const v = Math.max(0.05, vMean * g.pr.V((tLaid - g.tStart) / S.dur));
      const cover = 1 - Math.exp(-(S.dens ?? 0.92) * Math.pow(vMean / v, 0.9) * ds / th);   // 这一章的透明度：中速时整笔约 0.8，慢处趋近 1
      const wet = 1 + 0.22 * Math.exp(-age / 12);
      // 抬笔：收尾时扁头只有一角还在纸上
      const lift = taper > 0 ? 1 - taper * Math.pow(clamp((uu - 0.72) / 0.28), 1.6) : 1;
      const spread = 1 + 0.05 * (1 - Math.exp(-age / 9));
      const jit = (R() - 0.5) * 0.6;
      const T = mul(M, [cn, sn, -sn, cn, q.x + jit * sn, q.y - jit * cn]);
      m.setTransform(T[0], T[1], T[2], T[3], T[4], T[5]);
      m.globalAlpha = clamp(cover * wet * (0.55 + 0.45 * lift));
      const lw = w * lift * spread, lt = th * (0.6 + 0.4 * lift) * spread;
      m.drawImage(NIB, -lw / 2 + (1 - lift) * w * 0.3, -lt / 2, lw, lt);
    }
    // 3) 上色
    m.restore(); m.setTransform(1, 0, 0, 1, 0, 0); m.globalAlpha = 1; m.globalCompositeOperation = 'source-in';
    m.fillStyle = S.color; m.fillRect(x0, y0, x1 - x0, y1 - y0); m.globalCompositeOperation = 'source-over';
    ctx.save();
    if (S.clip) { const C = S.clipG ? mul(cam, S.clipG(f)) : M; ctx.setTransform(C[0], C[1], C[2], C[3], C[4], C[5]); ctx.clip(S.clip, S.clipRule || 'nonzero'); ctx.setTransform(1, 0, 0, 1, 0, 0); }
    ctx.globalCompositeOperation = S.mode || 'multiply'; ctx.globalAlpha = (S.alpha ?? 0.8) * (opt.alpha ?? 1);
    ctx.drawImage(MASK, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
    // 4) 湿的反光：刚落下的那一截有一道亮线，十几帧退掉
    if (!opt.noSheen && S.sheen !== 0) {
      ctx.setTransform(M[0], M[1], M[2], M[3], M[4], M[5]); ctx.globalCompositeOperation = 'screen'; ctx.lineCap = 'round';
      const segs = 14, span = Math.min(g.s, vMean * 16);
      for (let k = 0; k < segs; k++) {
        const sa = g.s - span * (k + 1) / segs, sb = g.s - span * k / segs; if (sb <= 0) break;
        const qa = at(P, Math.max(0, sa)), qb = at(P, sb);
        const age = Math.max(0, f - timeAt(S, (sa + sb) / 2, g.pr, L, g.tStart));
        const al = 0.32 * Math.exp(-age / 5) * (S.sheen ?? 1); if (al < 0.01) continue;
        const off = th * 0.25;
        ctx.strokeStyle = `rgba(255,255,255,${al})`; ctx.lineWidth = Math.max(1, w * 0.12);
        ctx.beginPath(); ctx.moveTo(qa.x - Math.sin(qa.th) * w * 0.18 + off, qa.y + Math.cos(qa.th) * w * 0.18); ctx.lineTo(qb.x - Math.sin(qb.th) * w * 0.18 + off, qb.y + Math.cos(qb.th) * w * 0.18); ctx.stroke();
      }
    }
    ctx.restore();
  }

  // —— 细线（针管笔 / 铅笔 / 白笔）：画到哪就是哪；粗细随速度（慢 = 粗一点），两头收尖 ——
  // S: {P, w, color, alpha, t0, dur, prof, kind:'liner'|'pencil'|'white', G, seed}
  function line(ctx, S, f, cam, opt = {}) {
    const g = progress(S, f); if (!g) return;
    const M = S.G ? mul(cam, S.G(f)) : cam;
    const P = S.P, L = g.L; if (g.s <= 0.5) return;
    ctx.save(); ctx.setTransform(M[0], M[1], M[2], M[3], M[4], M[5]);
    if (S.clip) ctx.clip(S.clip);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = S.kind === 'white' ? 'source-over' : (S.mode || 'multiply');
    const R = rng(S.seed || 3);
    const passes = S.kind === 'pencil' ? 2 : 1;
    const step = Math.max(2, L / 160);
    if (S.kind === 'pencil' || (S.alpha ?? 1) < 1) {   // 半透明的线一次画成一条，不然接头处会一点点叠深
      for (let p = 0; p < passes; p++) {
        const ox = (R() - .5) * 2.2, oy = (R() - .5) * 2.2;
        ctx.strokeStyle = S.color; ctx.lineWidth = S.w * (p ? 0.8 : 1); ctx.globalAlpha = (S.alpha ?? 1) * (opt.alpha ?? 1) * (p ? 0.55 : 1);
        ctx.beginPath(); ctx.moveTo(P[0].x + ox, P[0].y + oy);
        for (let s = step; s <= g.s + 1e-6; s += step) { const q = at(P, Math.min(s, g.s)); ctx.lineTo(q.x + ox + (R() - .5) * .8, q.y + oy + (R() - .5) * .8); }
        const q = at(P, g.s); ctx.lineTo(q.x + ox, q.y + oy); ctx.stroke();
      }
      ctx.restore(); return;
    }
    for (let p = 0; p < passes; p++) {
      const ox = (R() - .5) * (S.kind === 'pencil' ? 2.2 : 0), oy = (R() - .5) * (S.kind === 'pencil' ? 2.2 : 0);
      ctx.strokeStyle = S.color;
      let prev = at(P, 0);
      for (let s = step; s <= g.s + 1e-6; s += step) {
        const q = at(P, Math.min(s, g.s)); const u = s / L;
        const end = Math.min(1, u * L / 14, (L - s) / 14 + 0.25, 1);
        const tl = timeAt(S, s, g.pr, L, g.tStart), age = Math.max(0, f - tl);
        const v = g.pr.V((tl - g.tStart) / S.dur);
        const wv = (S.w) * (0.75 + 0.35 / Math.max(0.4, v)) * Math.max(0.3, end) * (S.kind === 'white' ? 1 + 0.6 * Math.exp(-age / 4) : 1);
        ctx.globalAlpha = (S.alpha ?? 1) * (opt.alpha ?? 1) * (S.kind === 'pencil' ? (0.55 + 0.45 * R()) * (p ? 0.6 : 1) : 1);
        ctx.lineWidth = wv;
        ctx.beginPath(); ctx.moveTo(prev.x + ox, prev.y + oy); ctx.lineTo(q.x + ox, q.y + oy); ctx.stroke();
        prev = q;
      }
    }
    ctx.restore();
  }

  return { dense, at, PROF, progress, tip, draw, line, rng, mul, apply, clamp, NIB };
})();
