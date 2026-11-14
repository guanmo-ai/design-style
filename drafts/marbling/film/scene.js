// scene.js — 湿拓 · 全片的动作表。stateAt(f) 是帧号的纯函数：返回这一帧水面上（和纸上）每个动作的有效参数、镜头、纸、工具。
// 时间轴在 timeline.js（90 BPM，一拍 40 帧）。
const C = MARBLE.ORDER.reduce((o, k, i) => (o[k] = i, o), {});
// 可复现的随机数
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const sine = t => 0.5 - 0.5 * Math.cos(Math.PI * clamp(t));   // 正弦缓动：峰值速度只有线性的 1.57 倍（inOut2 是 2 倍）
const code = cols => cols.reduce((s, c, k) => s + c * Math.pow(8, k % 7), 0);

// —— 动作构造器：每个返回 f => 12 个浮点（还没开始就返回 null）——
// 靶心：同一圆心在 t0, t0+Δ, … 连续滴 n 滴，每滴面积 a（r² 单位），面积在 T 帧里匀速流出（所以 r ∝ √t）
const bull = (x, y, a, cols, t0, dt = 6, T = 22, rim = 1.6) => f => {
  if (f < t0) return null; const tt = f - t0; let tot = 0;
  for (let k = 0; k < cols.length; k++) tot += a * clamp((tt - k * dt) / T);
  return [1, x, y, tot, cols.length, dt, T, tt, code(cols), rim, a, 0];
};
// 划线 / 耙 / 梳：方向 ang，齿距 s（0 = 单根），拖动 z，带动范围 λ，齿尖位置 tip(f)，从 a0 开始
const tine = (ang, n0, s, z, lam, tipF, t0, a0 = -2600, L0 = 500, L2 = 140) => f => f < t0 ? null : [2, Math.cos(ang), Math.sin(ang), n0, s, z, lam, tipF(f), a0, L0, L2, 0];
const vortex = (x, y, thF, R, t0) => f => f < t0 ? null : [3, x, y, thF(f), R * R, 0, 0, 0, 0, 0, 0, 0];

// —— 第一盘（片子开始前就滴好了，第 0 帧正在梳）——
const SET_A = (() => {
  const r = rng(11), ops = [], P = [C.cobalt, C.vermilion, C.turmeric, C.teal, C.pink, C.cream, C.ink];
  const seqs = [[C.cobalt, C.turmeric, C.vermilion, C.cream, C.teal, C.pink], [C.vermilion, C.cream, C.cobalt, C.turmeric, C.ink, C.teal],
    [C.teal, C.pink, C.cobalt, C.cream, C.vermilion, C.turmeric], [C.turmeric, C.cobalt, C.pink, C.teal, C.cream, C.vermilion]];
  const cs = [];
  for (let j = -3; j <= 3; j++) for (let i = -5; i <= 5; i++) {
    const x = i * 300 + (j & 1) * 150 + (r() - .5) * 90, y = j * 262 + (r() - .5) * 80;
    if (Math.abs(x) < 1500 && Math.abs(y) < 860) cs.push([x, y, r()]);
  }
  cs.sort((a, b) => a[2] - b[2]);
  cs.forEach(([x, y], k) => {
    const s = seqs[k % 4], off = Math.floor(r() * 6), n = 5 + (r() < .5 ? 1 : 0);
    const cols = Array.from({ length: n }, (_, m) => s[(m + off) % 6]);
    ops.push(bull(x, y, 6600 + r() * 2600, cols, -2000 + k * 8, 0, 1));
  });
  for (let k = 0; k < 16; k++) ops.push(bull((r() - .5) * 2800, (r() - .5) * 1600, 120 + r() * 320, [r() < .55 ? C.ink : C.turmeric], -1400 + k));
  return ops;
})();

const COMB_A = tine(0, 0, 26, 70, 7, f => TL.combA.x0 + TL.combA.v * f, -1e4);

// —— 第二盘：片子里从第一滴开始滴 ——
const B = (() => {
  const r = rng(29), drops = [], ops = [];
  const c1 = [-420, -30];
  const cols1 = [C.cobalt, C.turmeric, C.vermilion, C.teal];
  TL.drop1.forEach((t, k) => drops.push({ f: t, x: c1[0], y: c1[1], a: 15000, col: cols1[k], first: k === 0 }));
  ops.push(bull(c1[0], c1[1], 15000, cols1, TL.drop1[0], TL.drop1[1] - TL.drop1[0], 26, 1.8));
  // 一圈推一圈：十一个靶心，铺满画面（后滴的把先滴的整个推扁）
  const spots = [[260, -300], [-80, 300], [700, 180], [-820, 330], [120, -40], [-700, -380], [820, -330], [420, 420], [-300, -360], [-950, -40], [980, 420]];
  const seqs = [[C.vermilion, C.cream, C.cobalt, C.turmeric], [C.teal, C.pink, C.cream, C.cobalt], [C.turmeric, C.vermilion, C.pink, C.cream],
    [C.cobalt, C.teal, C.turmeric, C.ink], [C.pink, C.cobalt, C.cream, C.vermilion], [C.cream, C.turmeric, C.teal, C.pink]];
  const n = spots.length, span = TL.rain[1] - TL.rain[0] - 30;
  spots.forEach(([x, y], k) => {
    const t0 = Math.round(TL.rain[0] + span * Math.pow(k / (n - 1), 0.85)), a = 15000 + r() * 6000, cols = seqs[k % seqs.length].slice(0, k % 3 === 2 ? 3 : 4);
    ops.push(bull(x + (r() - .5) * 60, y + (r() - .5) * 60, a, cols, t0, 5, 22, 1.6));
    cols.forEach((c, j) => drops.push({ f: t0 + j * 5, x, y, a, col: c }));
  });
  for (let k = 0; k < 10; k++) {   // 最后撒一把小点
    const t0 = TL.rain[1] - 22 + k * 2, x = (r() - .5) * 1800, y = (r() - .5) * 960, a = 300 + r() * 700, c = [C.ink, C.turmeric, C.pink, C.cream][k % 4];
    ops.push(bull(x, y, a, [c], t0, 1, 12, 1.2)); drops.push({ f: t0, x, y, a, col: c, small: true });
  }
  // 耙：三道，下、上、下（齿距 300，拖 150）
  const rk = TL.rake;
  const rakeTip = (f, [a, b], len = 1650) => -780 + len * sine(prog(f, a, b));
  ops.push(tine(Math.PI / 2, 0, 300, 150, 38, f => rakeTip(f, rk[0]), rk[0][0], -1500, 420, 160));
  ops.push(tine(-Math.PI / 2, 150, 300, 150, 38, f => rakeTip(f, rk[1]), rk[1][0], -1500, 420, 160));
  // 梳：从左到右，齿距 28
  const combTip = f => -1100 + 2350 * sine(prog(f, TL.comb[0], TL.comb[1]));
  ops.push(tine(0, 6, 28, 80, 7, combTip, TL.comb[0], -2600, 500, 140));
  // 卷：针沿一条弯路走过去，每到一处拉一个漩涡（正反交替）
  const cc = [[-600, 170], [-200, -140], [210, 140], [610, -110]], th = [2.3, -2.5, 2.4, -2.7].map(v => v * Math.PI);
  const curlTh = (k, f) => { const t0 = TL.curls[k]; let v = th[k] * ease.inOut3(prog(f, t0 - 10, t0 + 26)); if (k === 0) v += Math.sign(th[k]) * 0.6 * ease.inOut2(prog(f, t0 + 26, TL.dive[2])); return v; };
  cc.forEach(([x, y], k) => ops.push(vortex(x, y, f => curlTh(k, f), 175, TL.curls[k] - 10)));
  return { ops, drops, c1, cc, th, combTip, rakeTip };
})();

// —— 场景：两只盘子放在桌上，A 盘在原点（第 0 帧），B 盘在右边 3600 ——
const TRAY_A = [0, 0, 1150, 680], TRAY_B = [3600, 0, 1150, 680], TB = TRAY_B[0];
const DEG = Math.PI / 180, TOP = 90 * DEG;

// —— 蛋：浸在 B 盘里，从它下面包上来的就是那一圈膜 ——
const EGG = { a: 230, b: 300, dip: [-560, 0], deep: -120 };   // 浸在推进去的那一处（全盘最花的地方：用 JS 版倒查搜出来的）
function eggAt(f) {
  const [f0, f1, f2, f3, f4] = TL.dip;
  let y;
  if (f < f1) y = lerp(1900, EGG.b, ease.in2(prog(f, f0 - 20, f1)));            // 落下来，越落越快
  else if (f < f2) y = lerp(EGG.b, EGG.deep, ease.out3(prog(f, f1, f2)));               // 碰到水面，减速沉下去
  else if (f < f3) y = EGG.deep - 6 * Math.sin(Math.PI * prog(f, f2, f3));              // 在最深处轻轻一沉
  else y = lerp(EGG.deep, 560, ease.inOut3(prog(f, f3, f4))) + 10 * Math.sin((f - f4) / 40 * Math.PI) * prog(f, f4, f4 + 30);   // 提起来，悬在半空轻轻浮
  const spin = 1.6 * Math.pow(prog(f, f3 + 10, 1080), 1.4) * 4.2;                  // 提起来以后开始转
  return { x: TB + EGG.dip[0], z: EGG.dip[1], y, spin, show: f >= f0 - 20 };
}
// 浸：沉下去吃掉的膜面积（r² 单位）A = 2a·(b − y)，水线截面 H = a²(1 − (y/b)²)；提起来以后洞留着
function sinkOp(f) {
  const [f0, f1, f2] = TL.dip; if (f < f1) return null;
  const yy = Math.max(eggAt(Math.min(f, f2)).y, EGG.deep), A = 2 * EGG.a * (EGG.b - yy);
  const Hs = EGG.a * EGG.a * Math.max(0, 1 - Math.pow(clamp(eggAt(f).y, -EGG.b, EGG.b) / EGG.b, 2)), Hmax = EGG.a * EGG.a * (1 - Math.pow(EGG.deep / EGG.b, 2));
  const H = f < f2 ? Hs : Hmax;
  return [4, EGG.dip[0], EGG.dip[1], A, H, 0, 0, 0, 0, 0, 0, 0];
}

// —— 镜头：[帧, 注视点 x, z, 缩放, 滚转/朝向, 俯仰, 注视点高度]。关键帧之间用三次 Hermite（切线 = 两边邻居的斜率）；缩放按对数走 ——
const DIVE = [TB - 564, -24];          // 用 JS 版的倒查在 B 盘里找出来的：96×54 px 的窗里颜色变化最多的一处
const EX = TB + EGG.dip[0], EZ = EGG.dip[1];
const CAMK = [
  [-60, -60, -20, 1.06, -0.035, TOP, 0], [0, 0, 0, 1.08, -0.03, TOP, 0], [TL.tilt[0], 40, 5, 1.05, -0.02, 86 * DEG, 0],
  [TL.tilt[1], 260, -120, 0.82, 0.05, 27 * DEG, 0],
  [TL.whip[1], TB - 360, -40, 1.0, 0.22, 24 * DEG, 0],
  [200, TB - 420, -30, 1.3, 0.24, 25 * DEG, 0], [262, TB - 360, -20, 1.38, 0.3, 22 * DEG, 0],
  [340, TB - 80, 0, 0.88, 0.14, 32 * DEG, 0], [TL.rise[1], TB, 0, 1.0, 0, TOP, 0],
  [560, TB, 0, 1.03, 0.0, TOP, 0], [640, TB + 60, 0, 1.12, -0.03, TOP, 0],
  [710, DIVE[0] - 80, DIVE[1] + 20, 1.3, -0.05, TOP, 0], [TL.dive[1], DIVE[0], DIVE[1], 21, -0.42, TOP, 0],
  [TL.dive[2], EX - 40, EZ - 40, 0.82, 0.55, 34 * DEG, 160], [884, EX, EZ, 0.95, 0.62, 28 * DEG, 80],
  [TL.dip[4], EX, EZ, 1.0, 0.8, 13 * DEG, 520], [1080, EX, EZ, 1.1, 1.25, 7 * DEG, 560], [1140, EX, EZ, 1.12, 1.4, 6 * DEG, 560],
];
function camAt(f) {
  const K = CAMK, val = k => [K[k][1], K[k][2], Math.log(K[k][3]), K[k][4], K[k][5], K[k][6]];
  let i = 0; while (i < K.length - 2 && f > K[i + 1][0]) i++;
  const t0 = K[i][0], t1 = K[i + 1][0], u = clamp((f - t0) / (t1 - t0)), h = t1 - t0;
  const p0 = val(i), p1 = val(i + 1);
  const tan = k => { const a = Math.max(0, k - 1), b = Math.min(K.length - 1, k + 1); const va = val(a), vb = val(b); return va.map((v, j) => (vb[j] - v) / (K[b][0] - K[a][0])); };
  let m0 = tan(i), m1 = tan(i + 1);
  const still = [TL.dive[1]];                 // 推进 ×21 的顶点停一下
  if (still.includes(K[i][0])) m0 = m0.map(() => 0);
  if (still.includes(K[i + 1][0])) m1 = m1.map(() => 0);
  const u2 = u * u, u3 = u2 * u, h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
  const v = p0.map((a, j) => h00 * a + h10 * h * m0[j] + h01 * p1[j] + h11 * h * m1[j]);
  return [v[0], v[1], Math.exp(v[2]), v[3], v[4], v[5]];
}
// 镜头在屏幕上走得多快（像素 / 帧，粗估）：快的帧开运动模糊
function camSpeed(f) {
  const a = camAt(f - 0.5), b = camAt(f + 0.5);
  return Math.hypot(b[0] - a[0], b[1] - a[1]) * a[2] + Math.abs(Math.log(b[2] / a[2])) * 900 + (Math.abs(b[3] - a[3]) + Math.abs(b[4] - a[4])) * 1500;
}
// 世界点（x, z 是桌面坐标，h 是高度）→ 屏幕像素
function toScreen(cam, x, z, h = 0) { return MARBLE.project(cam, x, z, h); }

function stateAt(f) {
  const cam = camAt(f), sp = camSpeed(f);
  const st = { cam, trayA: TRAY_A, trayB: TRAY_B, f, speed: sp };
  if (sp > 45) { const n = Math.min(5, Math.ceil(sp / 22)); st.cams = Array.from({ length: n }, (_, k) => camAt(f - 0.25 + 0.5 * (k + 0.5) / n)); }
  st.ops1 = [...SET_A, COMB_A].map(o => o(f)).filter(Boolean);
  st.ops0 = B.ops.map(o => o(f)).filter(Boolean);
  const sk = sinkOp(f); if (sk) st.ops0.push(sk);
  const e = eggAt(f);
  if (e.show) {
    st.ops2 = B.ops.map(o => o(TL.dip[1])).filter(Boolean);
    st.egg = [e.x, e.y, e.z, e.spin]; st.egg2 = [EGG.a, EGG.b, -EGG.deep, 1];
    st.egg3 = [EGG.dip[0], EGG.dip[1], f > TL.dip[3] ? 1 - 0.4 * prog(f, TL.dip[4], 1080) : 0, 0];
  }
  // 第 0 帧的签条：漂在 A 盘上
  st.lab = [-500, 235, 300, 152]; st.lab1 = [-0.04, 1, 0, 0];
  // 涟漪：最近的几滴 + 蛋提起来时滴回去的水
  st.rip = [...B.drops, ...DRIPS].filter(d => f >= d.f && f < d.f + 80).sort((p, q) => p.f - q.f).slice(-8).map(d => [d.x, d.y, f - d.f, Math.sqrt(d.a) * 0.6]);
  return st;
}
// 蛋提起来时从底上滴回盘里的几滴水（B 盘局部坐标）
const DRIPS = [0, 1, 2, 3, 4].map(k => ({ f: TL.dip[3] + 26 + k * 9 + (k * k) % 5, x: EGG.dip[0] + [-20, 30, 5, -35, 18][k], y: EGG.dip[1] + [10, -15, 25, 0, -30][k], a: 120 + 40 * k, drip: true }));
