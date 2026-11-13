// 光绘 · 场景：所有光源的轨迹、快门 T、镜头。全部是时间的纯函数（初始化时按固定种子算好，之后只查表）。
// 世界单位：米。地面 y = 0（水面，会倒映）。时间 t = 帧号 / 60 秒，可以是负的（第 0 帧之前快门就开了）。
// 一条轨迹 = 一串等时间间隔的样本（位置、功率、颜色、宽度）。画面 = 快门窗口 [t − T, t] 里所有样本连成的带子加起来。
const SCENE = (() => {
  const FPS = 60, sec = f => f / FPS;
  const QS = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new Map();
  const SPARK_P = +(QS.get('sp') || 0.09), WOOL0_P = +(QS.get('wp') || 0.03), SPARK_RATE = +(QS.get('sr') || 170), MAIN_W = +(QS.get('lw') || 0.022), MAIN_P = +(QS.get('lp') || 0.8);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const prog = (x, a, b) => clamp((x - a) / (b - a), 0, 1);
  const sstep = k => k * k * (3 - 2 * k);
  const s5 = k => k * k * k * (k * (k * 6 - 15) + 10);
  const cosE = k => 0.5 - 0.5 * Math.cos(Math.PI * k);
  const v3 = (x, y, z) => [x, y, z];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const mix3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  const len = a => Math.hypot(a[0], a[1], a[2]);
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  // —— 颜色 ——（芯是暖白，外圈一层青：两层光）
  const WARM = [1.0, 0.82, 0.62], CYAN = 0, ORANGE = 1, SAME = 2;
  function hsv(h, s, v) { h = ((h % 360) + 360) % 360 / 60; const c = v * s, x = c * (1 - Math.abs(h % 2 - 1)), m = v - c; const r = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.floor(h) % 6]; return [r[0] + m, r[1] + m, r[2] + m]; }

  // —— 笔画（字框 0—1，x 向右 y 向上）——
  const GUANG = [ // 光
    [[0.50, 0.97], [0.50, 0.80], [0.50, 0.62]],
    [[0.20, 0.88], [0.26, 0.78], [0.33, 0.68]],
    [[0.82, 0.89], [0.76, 0.78], [0.67, 0.67]],
    [[0.06, 0.57], [0.50, 0.585], [0.94, 0.57]],
    [[0.38, 0.57], [0.37, 0.40], [0.29, 0.22], [0.08, 0.04]],
    [[0.62, 0.57], [0.62, 0.30], [0.63, 0.10], [0.70, 0.05], [0.90, 0.05], [0.95, 0.17]],
  ];
  const HUI = [ // 绘
    [[0.22, 0.97], [0.15, 0.85], [0.08, 0.73], [0.27, 0.73]],
    [[0.30, 0.83], [0.18, 0.64], [0.05, 0.45], [0.33, 0.49]],
    [[0.04, 0.15], [0.20, 0.22], [0.36, 0.31]],
    [[0.70, 0.98], [0.56, 0.82], [0.40, 0.68]],
    [[0.70, 0.98], [0.84, 0.83], [1.00, 0.70]],
    [[0.56, 0.71], [0.71, 0.715], [0.86, 0.71]],
    [[0.44, 0.53], [0.71, 0.54], [0.98, 0.53]],
    [[0.68, 0.53], [0.59, 0.37], [0.49, 0.18], [0.70, 0.19], [0.93, 0.21]],
    [[0.80, 0.37], [0.87, 0.27], [0.96, 0.12]],
  ];
  const GUAN = [ // 观（签名，小）
    [[0.04, 0.84], [0.40, 0.86], [0.24, 0.45], [0.06, 0.12]],
    [[0.12, 0.62], [0.30, 0.36], [0.46, 0.10]],
    [[0.54, 0.92], [0.54, 0.40]],
    [[0.54, 0.92], [0.92, 0.92], [0.92, 0.42]],
    [[0.70, 0.78], [0.69, 0.45], [0.52, 0.06]],
    [[0.78, 0.60], [0.78, 0.14], [0.98, 0.12], [1.0, 0.26]],
  ];
  const MO = [ // 默
    [[0.06, 0.94], [0.06, 0.56]], [[0.06, 0.94], [0.56, 0.94], [0.56, 0.56]],
    [[0.18, 0.84], [0.25, 0.70]], [[0.44, 0.84], [0.37, 0.70]], [[0.31, 0.97], [0.31, 0.30]],
    [[0.06, 0.56], [0.56, 0.56]], [[0.10, 0.44], [0.52, 0.44]], [[0.02, 0.30], [0.60, 0.33]],
    [[0.10, 0.18], [0.04, 0.04]], [[0.23, 0.18], [0.25, 0.04]], [[0.37, 0.18], [0.41, 0.04]], [[0.51, 0.18], [0.59, 0.04]],
    [[0.64, 0.64], [0.98, 0.68]], [[0.83, 0.97], [0.81, 0.55], [0.64, 0.04]], [[0.83, 0.50], [1.0, 0.04]], [[0.90, 0.94], [0.96, 0.82]],
  ];

  // Catmull-Rom 平滑 + 按弧长取点
  function spline(pts, n = 24) {
    const out = [];
    const P = i => pts[clamp(i, 0, pts.length - 1)];
    for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < n; k++) {
      const t = k / n, a = P(i - 1), b = P(i), c = P(i + 1), d = P(i + 2);
      const t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(j => 0.5 * (2 * b[j] + (-a[j] + c[j]) * t + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * t2 + (-a[j] + 3 * b[j] - 3 * c[j] + d[j]) * t3)));
    }
    out.push(pts[pts.length - 1].slice());
    const L = [0];
    for (let i = 1; i < out.length; i++) L.push(L[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
    const total = L[L.length - 1];
    return { total, at(s) { s = clamp(s, 0, 1) * total; let lo = 0, hi = L.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m] <= s) lo = m; else hi = m; } const k = (s - L[lo]) / Math.max(1e-9, L[hi] - L[lo]); return [lerp(out[lo][0], out[hi][0], k), lerp(out[lo][1], out[hi][1], k)]; } };
  }

  // —— 主光点的一生：一串“段”，每段给出 [t0, t1, pos(t), power(t), color(t)] ——
  const segs = [];
  const push = (d, pos, pow = () => 1, col = () => null) => { const t0 = segs.length ? segs[segs.length - 1].t1 : 0; segs.push({ t0, t1: t0 + d, d, pos, pow, col }); };

  // 写字：一笔 = 起笔停一下（亮点）→ 走（慢—快—慢）→ 收笔停一下；笔与笔之间光被挡住（功率 0）
  const BOX = 1.5, Y0 = 0.55;
  const charAt = (pts, x0, y0, s) => pts.map(p => v3(x0 + p[0] * s, y0 + p[1] * s, 0));
  function writeStrokes(strokes, { speed = 2.6, d0 = 0.05, d1 = 0.07, travel = 0.11, connect = 0, z = 0 }) {
    let prev = null;
    strokes.forEach((st, i) => {
      const sp = spline(st.map(p => [p[0], p[1]]));
      const P = s => { const q = sp.at(s); return v3(q[0], q[1], z); };
      const a = P(0);
      if (prev) { const p0 = prev; push(travel, t => mix3(p0, a, cosE(t)), () => connect); }
      push(d0, () => a);
      const dur = 0.06 + Math.pow(sp.total, 0.75) / speed;
      push(dur, t => P(s5(t)));
      const b = P(1);
      push(i === strokes.length - 1 ? 0.0001 : d1, () => b);
      prev = b;
    });
    return prev;
  }
  const toWorld = (strokes, x0, y0, s) => strokes.map(st => st.map(p => [x0 + p[0] * s, y0 + p[1] * s]));
  const WRITE = [...toWorld(GUANG, -1.62, Y0, BOX), ...toWorld(HUI, 0.12, Y0, BOX)];
  const tWrite0 = 0;
  const lastDot = writeStrokes(WRITE, { speed: 4.6, d0: 0.04, d1: 0.05, travel: 0.09 });
  const iWriteEnd = segs.length;
  // 第 0 帧时光点正在写倒数第二笔（“云”的撇折）的一半：把整串段平移，让那一刻落在 t = 0
  // （最后一笔是第 15 笔，它的“走”段是倒数第二段；倒数第二笔的“走”段在它前面 4 段）
  const strokeMid = segs[iWriteEnd - 6];
  const SHIFT = -(strokeMid.t0 + strokeMid.d * 0.45);
  const T_SHUTTER = tWrite0 + SHIFT - 0.06;           // 快门打开的时刻（约 −4.6 s）

  // 落定的点：停住 = 过曝亮点
  const tDotEnd = sec(TL.swish) - SHIFT;
  push(tDotEnd - segs[segs.length - 1].t1, () => lastDot);
  // 甩过去 = 细线：从“绘”右下一路甩到“光”左下，从字下面掠过
  const swA = lastDot, swB = v3(-1.85, 0.30, 0.15);
  const swish = spline([[swA[0], swA[1]], [1.2, 0.36], [0, 0.28], [-1.3, 0.32], [swB[0], swB[1]]]);
  push(sec(TL.close1 - TL.swish) - 0.05, t => { const q = swish.at(s5(t)); return v3(q[0], q[1], 0.15 * t); });
  // 收快门的时候光点慢慢画一个小圈（被吃掉的光一路追到它身上）
  const loopC = v3(swB[0], swB[1] + 0.30, 0.15);
  push(sec(TL.closed1 - TL.close1) + 0.05, t => { const a = Math.PI * (-0.5 + 2.2 * s5(t)); const r = 0.30 * (1 - 0.25 * t); return add(loopC, v3(r * Math.cos(a), r * Math.sin(a) + 0.30 - r, 0)); });
  // 带着一截短尾巴甩到光球的位置（中途打一个螺旋）
  const ORB = v3(-4.3, 1.3, 0.3), ORB_R = 0.85;
  const fromLoop = segs[segs.length - 1].pos(1);
  push(sec(TL.orb - TL.closed1), t => {
    const e = s5(t), base = mix3(fromLoop, ORB, e);
    const sw = Math.sin(Math.PI * e) * 0.75, a = 2 * Math.PI * 2.5 * e;
    return add(base, v3(0, sw * Math.sin(a) * 0.7 + Math.sin(Math.PI * e) * 0.35, sw * Math.cos(a) * 0.5));
  });
  // 光球：光点拴在绳上转圈（4.2 圈/秒），圈所在的竖直平面再绕竖轴转（0.5 圈/秒）
  const ORB_SPIN = 4.2, ORB_AXIS = 0.5, tOrb0 = () => sec(TL.orb) - SHIFT;
  const orbPos = (tt, r) => { const ph = 2 * Math.PI * ORB_SPIN * tt, th = 2 * Math.PI * ORB_AXIS * tt; return add(ORB, v3(r * Math.cos(ph) * Math.cos(th), r * Math.sin(ph), r * Math.cos(ph) * Math.sin(th))); };
  const orbColor = tt => hsv(185 + 120 * (0.5 - 0.5 * Math.cos(2 * Math.PI * tt / 2.4)), 0.85, 1);
  {
    const D = sec(TL.orbOut + 18 - TL.orb), t0 = segs[segs.length - 1].t1;
    push(D, t => { const tt = t * D, r = ORB_R * s5(prog(tt, 0, 0.30)) * (1 - s5(prog(tt, D - 0.30, D))); return orbPos(tt, r); },
      () => 1.45, t => orbColor(t * D));
  }
  // 甩到光棒的起点
  const STICK = { x0: -3.05, x1: 3.05, y0: 0.07, y1: 0.47, z: 1.25, n: 48 };
  const stickStart = v3(STICK.x0, (STICK.y0 + STICK.y1) / 2, STICK.z);
  {
    const a = segs[segs.length - 1].pos(1);
    push(sec(TL.stick - TL.orbOut - 18), t => { const e = s5(t); return add(mix3(a, stickStart, e), v3(0, Math.sin(Math.PI * e) * 0.5, Math.sin(Math.PI * e) * 0.6)); });
  }
  const tStick0 = segs[segs.length - 1].t1;           // 光点在这里拉长成光棒
  const STICK_GROW = 0.20, STICK_SWEEP0 = 0.24, STICK_SWEEP1 = sec(TL.stickEnd - 12 - TL.stick), STICK_D = sec(TL.stickEnd - TL.stick);
  // 光棒横扫：x(τ)，τ 是进光棒段的秒数；两头 0.18 秒加速 / 减速，中间匀速
  function stickX(tau) {
    const a = STICK_SWEEP0, b = STICK_SWEEP1, r = 0.18, L = b - a;
    const u = clamp((tau - a) / L, 0, 1), rr = r / L;
    // 梯形速度：积分得到位置（归一化）
    const vmax = 1 / (1 - rr);
    let s;
    if (u < rr) s = 0.5 * vmax * u * u / rr; else if (u > 1 - rr) { const w = 1 - u; s = 1 - 0.5 * vmax * w * w / rr; } else s = 0.5 * vmax * rr + vmax * (u - rr);
    return lerp(STICK.x0, STICK.x1, s);
  }
  push(STICK_D, t => { const tau = t * STICK_D; return v3(stickX(tau), stickStart[1], STICK.z); }, () => 0.0);   // 光棒段里主光点自己不发光（光都在棒上）
  // 甩到钢丝棉的位置
  const WOOL = v3(4.3, 1.45, 0.25), WOOL_R = 0.9, WOOL_SPIN = 2.1;
  {
    const a = v3(STICK.x1, stickStart[1], STICK.z);
    push(sec(TL.wool - TL.stickEnd), t => { const e = s5(t); return add(mix3(a, WOOL, e), v3(0, Math.sin(Math.PI * e) * 0.45, Math.sin(Math.PI * e) * 0.5)); }, t => sstep(prog(t, 0.0, 0.25)));
  }
  const tWool0 = segs[segs.length - 1].t1;
  const WOOL_D = sec(TL.woolEnd - TL.wool);
  const woolR = tau => WOOL_R * s5(prog(tau, 0, 0.22)) * (1 - 0.0 * tau);
  const woolPos = tau => { const a = 2 * Math.PI * WOOL_SPIN * tau - Math.PI / 2, r = woolR(tau); return add(WOOL, v3(r * Math.cos(a), r * Math.sin(a), r * 0.18 * Math.sin(a))); };
  const woolHeat = tau => sstep(prog(tau, 0.0, 0.18)) * (1 - sstep(prog(tau, WOOL_D - 0.5, WOOL_D)));
  push(WOOL_D, t => woolPos(t * WOOL_D), t => 0.3 * woolHeat(t * WOOL_D), t => mix3([1, 0.9, 0.7], [1.0, 0.55, 0.2], sstep(prog(t * WOOL_D, 0.05, 0.3))));
  // 收尾：钢丝棉烧完，剩一颗小光点飘到右下角写“观默”（一笔连写，笔间的连线也亮着，很淡）
  const SIGN = { x0: 2.75, y0: 0.12, s: 0.30, z: 2.2 };
  const signStrokes = [...toWorld(GUAN, SIGN.x0, SIGN.y0, SIGN.s), ...toWorld(MO, SIGN.x0 + SIGN.s * 1.12, SIGN.y0, SIGN.s)];
  const signStart = v3(signStrokes[0][0][0], signStrokes[0][0][1], SIGN.z);
  {
    const a = woolPos(WOOL_D);
    push(sec(TL.sign - TL.woolEnd), t => { const e = s5(t); return add(mix3(a, signStart, e), v3(0, Math.sin(Math.PI * e) * 0.3, 0)); }, t => 0.35);
  }
  const iSign0 = segs.length;
  writeStrokes(signStrokes, { speed: 2.4, d0: 0.012, d1: 0.016, travel: 0.03, connect: 0.18, z: SIGN.z });
  const iSign1 = segs.length;
  { // 签名要在 TL.sign → TL.signEnd 之间写完：按比例压缩
    const t0 = segs[iSign0].t0, k = sec(TL.signEnd - TL.sign) / (segs[iSign1 - 1].t1 - t0);
    for (let i = iSign0; i < iSign1; i++) { segs[i].d *= k; segs[i].t0 = i === iSign0 ? t0 : segs[i - 1].t1; segs[i].t1 = segs[i].t0 + segs[i].d; }
  }
  const signEnd = signStrokes[signStrokes.length - 1].slice(-1)[0];
  push(30, () => v3(signEnd[0], signEnd[1], SIGN.z));
  // 平移到绝对时间
  for (const s of segs) { s.t0 += SHIFT; s.t1 += SHIFT; }
  const iSegAt = t => { let lo = 0, hi = segs.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (segs[m].t0 <= t) lo = m; else hi = m - 1; } return lo; };
  function light(t) { const s = segs[iSegAt(t)], k = clamp((t - s.t0) / s.d, 0, 1); return { p: s.pos(k), w: s.pow(k), c: s.col(k), i: iSegAt(t) }; }
  const T_STICK0 = tStick0 + SHIFT, T_WOOL0 = tWool0 + SHIFT, T_SIGN0 = segs[iSign0].t0, T_SIGN1 = segs[iSign1 - 1].t1;
  const T_FINAL = sec(TL.final);                       // 快门合上：之后不再有光

  // —— 快门 T(f)：几段“开着累加”的窗口之间，用对数插值平滑地收 / 放 ——
  const open0 = t => t - T_SHUTTER;                    // 第一次曝光：从 −4.6 s 开始一直开着
  const openFrom = (f0, base) => { const s0 = sec(f0); return t => Math.max(base, t - s0 + base); };
  const c = v => () => v;
  // [这一段从第几帧起是“纯”的, 到第几帧, T(t)]；两段之间（上一段结束 → 这一段开始）在对数里平滑过渡
  const K = [
    [0, TL.close1, open0],
    [TL.closed1 - 30, TL.orb - 20, c(0.4)],
    [TL.orb, TL.orbOut, openFrom(TL.orb, 0.24)],
    [TL.stick - 6, TL.stick, c(0.2)],
    [TL.stick, TL.stickEnd + 4, openFrom(TL.stick, 0.2)],
    [TL.wool - 6, TL.wool, c(0.24)],
    [TL.wool, TL.woolEnd, openFrom(TL.wool, 0.24)],
    [TL.opened, 1e9, open0],
  ];
  function shutterT(f) {
    f = Math.min(f, TL.final);
    const t = sec(f);
    for (let i = 0; i < K.length; i++) {
      const [a, b, fn] = K[i];
      if (f < a) { const [, pb, pfn] = K[i - 1]; const k = s5(prog(f, pb, a)); return Math.exp(lerp(Math.log(pfn(t)), Math.log(fn(t)), k)); }
      if (f <= b) return fn(t);
    }
  }

  // —— 镜头 ——（几段重叠的缓动叠起来，速度连续）
  const CAM0 = { p: v3(0, 0.36, 4.3), tg: v3(0, 0.20, 0), fov: 54 };
  const MOVES = [
    [0, 230, { p: v3(0.05, 0.34, 3.95), tg: v3(-0.1, 0.20, 0) }],
    [150, 300, { p: v3(-3.0, 0.8, 3.3), tg: v3(-3.9, 1.2, 0.3), fov: 47 }],
    [280, 470, { p: v3(-6.0, 0.95, 3.35), tg: v3(-4.3, 1.25, 0.3) }],
    [420, 540, { p: v3(-2.75, 0.75, 3.6), tg: v3(-2.4, 0.55, 0.6), fov: 46 }],
    [480, 650, { p: v3(0.9, 0.95, 6.1), tg: v3(0.5, 0.75, 0.4), fov: 46 }],
    [606, 724, { p: v3(2.3, 0.5, 5.6), tg: v3(4.0, 1.3, 0.2), fov: 50 }],
    [690, 800, { p: v3(3.0, 0.4, 5.0), tg: v3(4.2, 1.2, 0.2) }],
    [776, 890, { p: v3(0, 0.95, 7.3), tg: v3(0, 0.95, 0), fov: 47 }],
    [880, 1100, { p: v3(0, 0.93, 6.8), tg: v3(0, 0.96, 0) }],
  ];
  function camera(f) {
    let p = CAM0.p.slice(), tg = CAM0.tg.slice(), fov = CAM0.fov;
    const cur = { p: CAM0.p, tg: CAM0.tg, fov: CAM0.fov };
    for (const [a, b, m] of MOVES) {
      const k = cosE(prog(f, a, b));
      if (m.p) { p = add(p, mul(sub(m.p, cur.p), k)); cur.p = m.p; }
      if (m.tg) { tg = add(tg, mul(sub(m.tg, cur.tg), k)); cur.tg = m.tg; }
      if (m.fov) { fov += (m.fov - cur.fov) * k; cur.fov = m.fov; }
    }
    // 收快门那一下镜头轻轻“咚”
    const kk = f - TL.final; if (kk >= 0) fov *= 1 - 0.018 * Math.exp(-kk / 9) * Math.sin(Math.min(Math.PI, kk / 4));
    return { p, tg, fov };
  }

  // —— 把所有轨迹变成样本 ——
  // 每个样本 12 个数：x y z t | 功率 宽度 轨迹号 外圈色 | r g b 0
  const tracks = [];   // { a, b, t0, t1, group }
  const data = [];
  let trackNo = 0;
  function sampleTrack(t0, t1, dt, fn, group) {
    const a = data.length / 12, id = trackNo++;
    const n = Math.max(1, Math.ceil((t1 - t0) / dt));
    for (let k = 0; k <= n; k++) {
      const t = Math.min(t1, t0 + k * dt), s = fn(t);
      if (!s) continue;
      data.push(s.p[0], s.p[1], s.p[2], t, s.w, s.width, id, s.halo, s.c[0], s.c[1], s.c[2], 0);
    }
    const b = data.length / 12;
    tracks.push({ a, b, t0, t1, group });
  }
  const tEnd = T_FINAL;
  // 主光点：480 Hz
  sampleTrack(T_SHUTTER, tEnd, 1 / 480, t => { const L = light(t); const inStick = t >= T_STICK0 && t < T_STICK0 + STICK_D; const kw = sstep(prog(t, sec(TL.orb) - 0.6, sec(TL.orb)));   // 写字那一段更粗更亮（封面上要读得出字），到光球之前平滑地回到正常
    return { p: L.p, w: inStick ? 0 : L.w * MAIN_P * lerp(1.5, 1, kw), width: t > T_SIGN0 - 0.8 ? 0.008 : (t < T_STICK0 ? MAIN_W * lerp(1.36, 1, kw) : 0.016), halo: L.c ? SAME : CYAN, c: L.c || WARM }; }, 'main');
  // 光棒：48 颗 LED，每颗显示 “LIGHT PAINTING” 位图的一列（位图由页面画好传进来）
  let stickBitmap = null;
  function buildStick(bm) {
    stickBitmap = bm;
    const { n } = STICK;
    for (let r = 0; r < n; r++) {
      const y = lerp(STICK.y0, STICK.y1, r / (n - 1));
      sampleTrack(T_STICK0, T_STICK0 + STICK_D, 1 / 720, t => {
        const tau = t - T_STICK0;
        const grow = s5(prog(tau, 0, STICK_GROW)) * (1 - s5(prog(tau, STICK_D - 0.2, STICK_D)));
        const yc = stickStart[1], yy = lerp(yc, y, grow);
        const x = stickX(tau);
        const u = (x - STICK.x0) / (STICK.x1 - STICK.x0);
        const sweeping = tau > STICK_SWEEP0 - 0.02 && tau < STICK_SWEEP1 + 0.02;
        const on = sweeping ? bm.at(u, r / (n - 1)) : 0;
        const hue = lerp(318, 178, u);
        return { p: v3(x, yy, STICK.z), w: 0.55 * on, width: 0.0042, halo: SAME, c: hsv(hue, 0.62, 1) };
      }, 'stick');
    }
  }
  // 火星：出生在钢丝棉上，沿切线飞出去，走抛物线，落地弹起来（e = 0.45），慢慢冷下来（2700 K → 暗红）
  const G = 9.8, E_BOUNCE = 0.45;
  function spark(tb, p0, v0, life, p0w, group) {
    // 先把整条轨迹按 1/60 秒模拟成解析分段（每段是抛物线），再取样
    const pieces = [];
    let p = p0.slice(), v = v0.slice(), t = tb, rest = false;
    while (t < tb + life && pieces.length < 6) {
      if (rest) { pieces.push({ t, p: p.slice(), v: v.slice(), slide: true }); break; }
      const a = -G / 2, b = v[1], c = p[1];
      const disc = b * b - 4 * a * c;
      const tau = disc > 0 ? (-b - Math.sqrt(disc)) / (2 * a) : 1e9;
      pieces.push({ t, p: p.slice(), v: v.slice() });
      if (!(tau > 1e-4)) break;
      t += tau;
      p = [p[0] + v[0] * tau, 0, p[2] + v[2] * tau];
      const vy = v[1] - G * tau;
      v = [v[0] * 0.62, -vy * E_BOUNCE, v[2] * 0.62];
      if (v[1] < 0.35) rest = true;
    }
    const at = tt => {
      let q = pieces[0];
      for (const pc of pieces) if (pc.t <= tt) q = pc;
      const d = tt - q.t;
      if (q.slide) { const k = (1 - Math.exp(-3.5 * d)) / 3.5; return [q.p[0] + q.v[0] * k, 0, q.p[2] + q.v[2] * k]; }
      return [q.p[0] + q.v[0] * d, Math.max(0, q.p[1] + q.v[1] * d - G / 2 * d * d), q.p[2] + q.v[2] * d];
    };
    sampleTrack(tb, tb + life, 1 / 60, tt => {
      const age = clamp((tt - tb) / life, 0, 1), heat = Math.pow(1 - age, 1.6) * sstep(prog(tt - tb, 0, 0.03));
      const col = age < 0.35 ? mix3([1, 0.86, 0.6], [1, 0.52, 0.16], age / 0.35) : mix3([1, 0.52, 0.16], [0.75, 0.16, 0.03], (age - 0.35) / 0.65);
      return { p: at(tt), w: p0w * heat, width: 0.0045, halo: ORANGE, c: col };
    }, group);
  }
  // 第 0 帧那一圈：字后面的钢丝棉
  const WOOL0 = v3(0, 1.5, -2.7), WOOL0_R = 1.3, WOOL0_SPIN = 1.7;
  const WOOL0_END = sec(TL.close1 + 40);               // 收快门的时候它也烧完了
  const wool0Pos = t => { const a = 2 * Math.PI * WOOL0_SPIN * t; return add(WOOL0, v3(WOOL0_R * Math.cos(a), WOOL0_R * Math.sin(a), 0)); };
  const wool0Heat = t => 1 - sstep(prog(t, WOOL0_END - 0.6, WOOL0_END));
  sampleTrack(T_SHUTTER, WOOL0_END, 1 / 480, t => ({ p: wool0Pos(t), w: WOOL0_P * wool0Heat(t), width: 0.012, halo: ORANGE, c: [1, 0.62, 0.25] }), 'wool0');
  {
    const rate = SPARK_RATE;
    for (let t = T_SHUTTER - 1.0; t < WOOL0_END; t += 1 / rate) {
      const h = t < T_SHUTTER ? 1 : wool0Heat(t);
      if (rnd() > h) continue;
      const a = 2 * Math.PI * WOOL0_SPIN * t, sp = 2 * Math.PI * WOOL0_SPIN * WOOL0_R;
      const tan = v3(-Math.sin(a), Math.cos(a), 0), out = v3(Math.cos(a), Math.sin(a), 0);
      const k = 0.35 + 0.6 * rnd();
      const v = add(add(mul(tan, sp * k), mul(out, 2.4 * (rnd() - 0.4))), v3((rnd() - 0.5) * 1.6, (rnd() - 0.5) * 1.6, (rnd() - 0.5) * 2.6));
      spark(t, wool0Pos(t), v, 0.55 + 1.0 * rnd() * rnd() + 0.25 * rnd(), SPARK_P * (0.4 + 0.6 * rnd()), 'spark0');
    }
  }
  // 高潮的钢丝棉
  {
    const rate = 620;
    for (let tau = 0.06; tau < WOOL_D - 0.2; tau += 1 / rate) {
      const h = woolHeat(tau) * sstep(prog(tau, 0.08, 0.35));
      if (rnd() > h) continue;
      const t = T_WOOL0 + tau;
      const a = 2 * Math.PI * WOOL_SPIN * tau - Math.PI / 2, r = woolR(tau), sp = 2 * Math.PI * WOOL_SPIN * r;
      const tan = v3(-Math.sin(a), Math.cos(a), 0.18 * Math.cos(a)), out = v3(Math.cos(a), Math.sin(a), 0);
      const k = 0.55 + 0.45 * rnd();
      const v = add(add(mul(tan, sp * k), mul(out, 1.6 * rnd())), v3((rnd() - 0.5) * 1.6, (rnd() - 0.5) * 1.6, (rnd() - 0.5) * 3.2));
      spark(t, woolPos(tau), v, 0.5 + 1.1 * rnd() * rnd() + 0.3 * rnd(), 0.5 * SPARK_P * (0.4 + 0.6 * rnd()), 'spark1');
    }
  }

  // 每一帧要画哪些样本：返回 [起, 止) 的区间（着色器里再按时间精确裁）
  function ranges(t, T) {
    const lo = t - T, out = [];
    let cur = null;
    for (const tr of tracks) {
      if (tr.t1 < lo || tr.t0 > t) continue;
      if (cur && tr.a - cur[1] < 64) cur[1] = tr.b; else { cur = [tr.a, tr.b]; out.push(cur); }
    }
    return out;
  }
  // 光点自己（亮、大、一直在动）：这一帧要额外画的“灯头”
  function heads(t) {
    if (t >= T_FINAL) return [];
    const out = [], L = light(t);
    const inStick = t >= T_STICK0 && t < T_STICK0 + STICK_D;
    if (inStick) {
      const tau = t - T_STICK0, grow = s5(prog(tau, 0, STICK_GROW)) * (1 - s5(prog(tau, STICK_D - 0.2, STICK_D)));
      const x = stickX(tau), u = (x - STICK.x0) / (STICK.x1 - STICK.x0);
      for (let r = 0; r < STICK.n; r += 1) {
        const y = lerp(stickStart[1], lerp(STICK.y0, STICK.y1, r / (STICK.n - 1)), grow);
        const on = stickBitmap ? stickBitmap.at(u, r / (STICK.n - 1)) : 0;
        out.push({ p: v3(x, y, STICK.z), e: 0.0035 + 0.006 * on, width: 0.006, halo: SAME, c: hsv(lerp(318, 178, u), 0.4, 1) });
      }
      out.push({ p: v3(x, stickStart[1], STICK.z), e: 0.05 * (1 - grow) + 0.004, width: 0.03, halo: CYAN, c: WARM });
    } else if (t >= T_WOOL0 && t < T_WOOL0 + WOOL_D) {
      out.push({ p: L.p, e: 0.03 * woolHeat(t - T_WOOL0) + 0.01, width: 0.035, halo: ORANGE, c: [1, 0.8, 0.5] });
    } else {
      const small = t > T_SIGN0 - 0.8;
      out.push({ p: L.p, e: small ? 0.018 : 0.05, width: small ? 0.02 : 0.034, halo: L.c ? SAME : CYAN, c: L.c || WARM });
    }
    if (t < WOOL0_END) out.push({ p: wool0Pos(t), e: 0.03 * wool0Heat(t), width: 0.05, halo: ORANGE, c: [1, 0.75, 0.4] });
    return out;
  }
  // 光点当前的速度（米/秒），给配乐的“呼”用
  function speed(t) { const a = light(t - 1 / 120).p, b = light(t + 1 / 120).p; return len(sub(b, a)) * 60; }

  return {
    FPS, sec, data, tracks, ranges, heads, light, speed, shutterT, camera, buildStick, T_SHUTTER, T_FINAL, T_STICK0, T_WOOL0, T_SIGN0, T_SIGN1,
    SHIFT, ORB, ORB_R, WOOL, WOOL0, STICK, SIGN, lastDot, swish, BOX, Y0, woolPos, wool0Pos, stickX, sparks: tracks.filter(t => t.group[0] === 's').length,
  };
})();
