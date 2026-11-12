// 引擎：主线怎么长、梢头怎么卷、枝条怎么跟、镜头怎么走、字怎么出。每一帧都是帧号的纯函数。
const ENG = (() => {
  const { MASTER, M } = WORLD;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const sm = t => (t = clamp(t), t * t * (3 - 2 * t));
  const smr = (a, b, x) => sm((x - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
  // 欠阻尼弹簧的阶跃响应：0 → 1，过冲约 5%（ζ≈0.7），dur 帧内基本到位
  const spring = (t, zeta = .62, w = 9) => { t = Math.max(0, t); if (t <= 0) return 0; const wd = w * Math.sqrt(1 - zeta * zeta); return 1 - Math.exp(-zeta * w * t) * (Math.cos(wd * t) + zeta * w / wd * Math.sin(wd * t)); };
  const pop = (f, f0, dur = 26) => spring((f - f0) / dur * 1.0);
  // 颜色
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mixc = (a, b, t) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(t))).toString(16).padStart(2, '0')).join(''); };
  const rgba = (h, a) => { const c = hex(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
  // 随机（固定种子）
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  // —— 主线长到哪：单调三次插值（Fritsch–Carlson），位置和速度都连续 ——
  const K = TL.grow.map(([f, m, o]) => [f, M[m] + o]);
  const n = K.length, d = [], mm = [];
  for (let i = 0; i < n - 1; i++) d.push((K[i + 1][1] - K[i][1]) / (K[i + 1][0] - K[i][0]));
  for (let i = 0; i < n; i++) mm.push(i === 0 ? d[0] : i === n - 1 ? d[n - 2] : (d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { mm[i] = mm[i + 1] = 0; continue; }
    const a = mm[i] / d[i], b = mm[i + 1] / d[i], h = a * a + b * b;
    if (h > 9) { const t = 3 / Math.sqrt(h); mm[i] = t * a * d[i]; mm[i + 1] = t * b * d[i]; }
  }
  const Lend = MASTER[MASTER.length - 1].s;
  function L(f) {
    if (f <= K[0][0]) return K[0][1] + mm[0] * (f - K[0][0]);
    if (f >= K[n - 1][0]) return K[n - 1][1];
    let i = 0; while (K[i + 1][0] < f) i++;
    const h = K[i + 1][0] - K[i][0], t = (f - K[i][0]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * K[i][1] + (t3 - 2 * t2 + t) * h * mm[i] + (-2 * t3 + 3 * t2) * K[i + 1][1] + (t3 - t2) * h * mm[i + 1];
  }
  const V = f => (L(f + .5) - L(f - .5));
  // 主线经过弧长 s 的时刻（二分）
  function tpass(s) {
    let a = -400, b = TL.end + 200;
    if (s <= L(a)) return a;
    for (let k = 0; k < 40; k++) { const m = (a + b) / 2; if (L(m) < s) a = m; else b = m; }
    return (a + b) / 2;
  }
  // 速度过一根弹簧：梢头的卷曲量跟着它走——加速时卷紧、停下时冲过头再松开
  const KER = (() => { const w = 2 * Math.PI * 1.8 / 60, z = .32, wd = w * Math.sqrt(1 - z * z), k = []; let s = 0;
    for (let i = 0; i < 70; i++) { const v = Math.exp(-z * w * i) * Math.sin(wd * i + .9); k.push(v); s += v; } return k.map(v => v / s); })();
  const vfilt = (fn, f) => { let s = 0; for (let i = 0; i < KER.length; i++) s += KER[i] * fn(f - i); return s; };

  // —— 画出来的一段线：梢头像蕨菜一样卷着、往前长时一路松开；越靠梢头越细 ——
  const U = 240;
  function shapeTip(P, i0, sTip, v, dir, wmul = 1) {
    // P：点列（带 s）；返回从 i0 到梢头的点（梢头 U 以内重算）
    const out = [];
    const tip = PATH.at(P, sTip);
    const C = .062 * dir * v;           // v 是 0..1 的“正在长”的量（可以略负）
    let iU = tip.i; while (iU > 0 && sTip - P[iU].s < U) iU--;
    for (let i = i0; i <= Math.min(iU, tip.i); i++) out.push(P[i]);
    let base = out.length ? out[out.length - 1] : P[Math.max(0, iU)];
    let { x, y } = base;
    const pts = [];
    for (let i = Math.max(iU + 1, i0); i <= tip.i + 1; i++) pts.push(i <= tip.i ? P[i] : tip);
    let prev = base;
    for (const q of pts) {
      const dd = clamp((sTip - q.s) / U), ds = q.s - prev.s;
      const ex = C * U / 3 * Math.pow(1 - dd, 3);
      const th = q.th + ex;
      x += Math.cos(th) * ds; y += Math.sin(th) * ds;
      out.push({ x, y, th, s: q.s, w: q.w });
      prev = q;
    }
    // 越靠梢头越细（刚长出来的嫩梢），往后慢慢变粗
    for (const q of out) { const dd = sTip - q.s; q.wd = q.w * wmul * (.1 + .9 * Math.pow(smr(0, 300, dd), .6)); }
    return out;
  }
  // 往前看一段：线接下来往哪边拐（连续地取值，不会突然翻面）
  function curlDir(P, s) { const a = PATH.at(P, s), b = PATH.at(P, s + 260); return Math.tanh((b.th - a.th) * 1.6) || .4; }

  // 主线在第 f 帧：返回要画的点（只取镜头里看得见的那一段之后）
  function masterAt(f, sFrom = 0) {
    const sTip = clamp(L(f), 1, Lend);
    const grow = clamp(vfilt(V, f) / 26, -.25, 1.15) * (1 - smr(Lend - 400, Lend, sTip));
    const dir = curlDir(MASTER, sTip);
    const i0 = PATH.at(MASTER, sFrom).i;
    return { pts: shapeTip(MASTER, i0, sTip, grow, dir), sTip };
  }

  // —— 枝条：从主线上某一点长出去（或者从一个固定点），自己也是鞭线；风吹时曲率轻轻晃 ——
  function branchPts(B, f) {
    const t0 = B.t0, g = clamp((f - t0) / B.dur);
    if (g <= 0) return null;
    const ge = 1 - Math.pow(1 - g, 2.4);
    let x, y, th;
    if (B.anchor !== undefined) { const q = PATH.at(MASTER, B.anchor); x = q.x; y = q.y; th = q.th + B.ang * Math.PI / 180; }
    else { [x, y] = B.base; th = B.ang * Math.PI / 180; }
    const sway = (B.sway || 0) * Math.sin(f / 60 * 2 * Math.PI * (B.sf || .5) + (B.ph || 0)) * smr(t0, t0 + B.dur + 30, f);
    const k0 = PATH.whip(B.L, B.a, B.b, B.p, B.sign);
    const P = PATH.curve(x, y, th, B.L, u => k0(u) + sway * u * u / B.L * 2, B.w0, B.w1);
    const sTip = Math.max(2, B.L * ge);
    const gv = clamp((1 - g) * 2.4 * 1.3, 0, 1) * (g < 1 ? 1 : 0);
    return { pts: shapeTip(P, 0, sTip, gv * .8, Math.sign(B.sign) * .9), P, sTip, g };
  }

  // —— 镜头：关键帧（中心、缩放；或者“跟着梢头”）→ 再用高斯核磨平，速度连续 ——
  function camTarget(f) {
    const C = SCENES.CAM;
    let i = 0; while (i < C.length - 2 && C[i + 1][0] <= f) i++;
    const A = C[i], B = C[Math.min(i + 1, C.length - 1)];
    const t = B[0] === A[0] ? 0 : clamp((f - A[0]) / (B[0] - A[0]));
    const res = k => { if (k[1] === 'tip') { const q = PATH.at(MASTER, clamp(L(f + 22), 0, Lend)); return [q.x + k[3], q.y + k[4], k[2]]; } return [k[1], k[2], k[3]]; };
    const a = res(A), b = res(B), e = sm(t);
    return [lerp(a[0], b[0], e), lerp(a[1], b[1], e), Math.exp(lerp(Math.log(a[2]), Math.log(b[2]), e))];
  }
  const camCache = new Map();
  function cam(f) {
    const key = Math.round(f * 100);
    if (camCache.has(key)) return camCache.get(key);
    const sg = 16; let sx = 0, sy = 0, sz = 0, sw = 0;
    for (let k = -48; k <= 48; k += 2) {
      const w = Math.exp(-k * k / (2 * sg * sg)), q = camTarget(f + k);
      sx += q[0] * w; sy += q[1] * w; sz += Math.log(q[2]) * w; sw += w;
    }
    const r = [sx / sw, sy / sw, Math.exp(sz / sw)];
    camCache.set(key, r); return r;
  }

  // —— 文字：一行字从遮罩里升起；每出一个字登记一声 ——
  const cues = new Map();
  function cue(f0, nch, rate, kind) { const k = f0 + '|' + kind + '|' + nch; if (!cues.has(k)) cues.set(k, [f0, nch, rate, kind]); }
  function riseText(ctx, txt, x, y, f, f0, opt = {}) {
    const dur = opt.dur || 18, rate = opt.rate ?? 1.2;
    if (f < f0) return;
    cue(f0, [...txt].length, rate, opt.kind || 'text');
    ctx.save();
    ctx.font = opt.font; ctx.textAlign = opt.align || 'left'; ctx.textBaseline = 'alphabetic';
    const size = opt.size;
    const out = opt.out ? smr(opt.out, opt.out + 24, f) : 0;
    const chars = [...txt];
    let cx = x;
    const W = ctx.measureText(txt).width;
    if ((opt.align || 'left') === 'center') cx = x - W / 2;
    if (opt.align === 'right') cx = x - W;
    ctx.textAlign = 'left';
    ctx.beginPath(); ctx.rect(cx - size, y - size * 1.25, W + size * 2, size * 1.6); ctx.clip();
    for (let i = 0; i < chars.length; i++) {
      const p = easeOut((f - f0 - i * rate) / dur), q = 1 - easeOut((f - (opt.out || 1e9) - i * .6) / 20);
      if (p <= 0) { cx += ctx.measureText(chars[i]).width; continue; }
      ctx.globalAlpha = (opt.alpha ?? 1) * clamp(p * 1.6) * clamp(q);
      ctx.fillStyle = opt.color;
      ctx.fillText(chars[i], cx, y + (1 - p) * size * 1.1 - (1 - q) * size * 1.1);
      cx += ctx.measureText(chars[i]).width;
    }
    ctx.restore();
  }
  return { NIGHT: 0, clamp, sm, smr, lerp, easeOut, spring, pop, mixc, rgba, rng, L, V, tpass, masterAt, branchPts, cam, riseText, cue, cues, Lend, shapeTip, U };
})();
