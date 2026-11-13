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

// —— 镜头：关键帧之间用三次 Hermite（切线 = 两边邻居的斜率），位置和速度都连续；缩放按对数走 ——
const CURL_R = 120, SHEET = [960, 540], WPAPER = 1920;
const FINAL_X = WPAPER + Math.PI * CURL_R;
// 第一张纸从左上角斜着盖、斜着揭
const ND = (() => { const l = Math.hypot(1, 0.55); return [1 / l, 0.55 / l]; })(), S0D = -(SHEET[0] * ND[0] + SHEET[1] * ND[1]), WD = -2 * S0D;
const DIVE = [-564, -24];          // 用 JS 版的倒查在全盘找出来的：96×54 px 的窗里颜色变化最多的一处
const CAMK = [
  [-60, -20, 5, 1.06, -0.035], [0, 0, 0, 1.08, -0.03], [60, 70, 8, 1.05, -0.02], [128, 0, 0, 1.0, 0], [180, -390, -30, 1.45, 0.02],
  [212, -380, -32, 1.5, 0.025], [320, -110, -5, 1.12, 0.01], [400, 0, 0, 1.0, 0], [520, 0, 0, 1.03, 0.0], [620, 60, 0, 1.12, -0.03],
  [700, DIVE[0] - 80, DIVE[1] + 20, 1.3, -0.05], [TL.dive[1], DIVE[0], DIVE[1], 21, -0.42], [TL.dive[2], 0, 0, 1.0, 0], [886, 0, 0, 1.0, 0],
  [TL.peel2[1], FINAL_X, 0, 0.93, 0], [1000, FINAL_X + 10, 0, 0.9, 0],
];
function camAt(f) {
  const K = CAMK, val = k => [K[k][1], K[k][2], Math.log(K[k][3]), K[k][4]];
  let i = 0; while (i < K.length - 2 && f > K[i + 1][0]) i++;
  const t0 = K[i][0], t1 = K[i + 1][0], u = clamp((f - t0) / (t1 - t0)), h = t1 - t0;
  const p0 = val(i), p1 = val(i + 1);
  const tan = k => { const a = Math.max(0, k - 1), b = Math.min(K.length - 1, k + 1); const va = val(a), vb = val(b); return va.map((v, j) => (vb[j] - v) / (K[b][0] - K[a][0])); };
  let m0 = tan(i), m1 = tan(i + 1);
  // 推进 ×20 的顶点和每段的起止：速度为 0 的关键帧（停一下再走）
  const still = [TL.dive[1], TL.dive[2], 886];
  if (still.includes(K[i][0])) m0 = m0.map(() => 0);
  if (still.includes(K[i + 1][0])) m1 = m1.map(() => 0);
  if (K[i][0] === TL.peel2[1]) m0 = m0.map((v, j) => j === 2 ? v : 0);      // 纸落定：停住，只剩一点点推近
  if (K[i + 1][0] === TL.peel2[1]) m1 = m1.map((v, j) => j === 2 ? v : 0);
  const u2 = u * u, u3 = u2 * u, h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
  const v = p0.map((a, j) => h00 * a + h10 * h * m0[j] + h01 * p1[j] + h11 * h * m1[j]);
  return [v[0], v[1], Math.exp(v[2]), v[3]];
}
// 水面坐标 → 屏幕像素（左上原点）
function toScreen(cam, x, y) { const c = Math.cos(-cam[3]), s = Math.sin(-cam[3]), dx = (x - cam[0]) * cam[2], dy = (y - cam[1]) * cam[2]; return [960 + c * dx - s * dy, 540 + s * dx + c * dy]; }

function stateAt(f) {
  const cam = camAt(f);
  const st = { cam, ops0: [], ops1: [], rip: [], sheet: [SHEET[0], SHEET[1], 0, 0], paper: [0, 0, 0, 0], curl: [1, 0, -1e5, CURL_R], f };
  const A = [...SET_A, COMB_A];
  if (f < TL.peel1[0]) st.ops0 = A.map(o => o(f)).filter(Boolean);
  else if (f < TL.lay2[0] + 31) st.ops0 = B.ops.map(o => o(f)).filter(Boolean);
  const printA = () => A.map(o => o(TL.lay1[1])).filter(Boolean), printB = () => B.ops.map(o => o(TL.lay2[0])).filter(Boolean);
  // 第一张纸
  if (f >= TL.lay1[0] && f < TL.peel1[0]) {
    const q = (WD + 300) * ease.inOut2(prog(f, TL.lay1[0], TL.lay1[1]));
    st.paper = [1, S0D, q, 0.8 * prog(f, TL.lay1[0] + 8, TL.lay1[1] + 4)]; st.curl = [ND[0], ND[1], 0, CURL_R];
    st.ops1 = [];
  }
  if (f >= TL.peel1[0] && f < 300) {
    st.ops1 = printA();
    const p = (WD + Math.PI * CURL_R + 60) * sine(prog(f, TL.peel1[0], TL.peel1[1]));
    if (f < TL.peel1[1] + 2) { st.paper = [2, S0D, 0, 0.8]; st.curl = [ND[0], ND[1], p, CURL_R]; }
    st.sheet[2] = 0.06 * (1 - prog(f, TL.peel1[1] - 20, 260));      // 揭完的水里，残一点点颜色，慢慢散掉
    if (st.sheet[2] <= 0) st.ops1 = [];
  }
  // 最后一张纸
  if (f >= TL.lay2[0] && f < TL.peel2[0]) {
    const q = (WPAPER + 260) * ease.inOut2(prog(f, TL.lay2[0], TL.lay2[1]));
    st.paper = [1, -SHEET[0], q, 0.8 * prog(f, TL.lay2[0] + 6, TL.lay2[1] + 4)]; st.curl = [1, 0, 0, CURL_R];
  }
  if (f >= TL.peel2[0]) {
    st.ops0 = []; st.ops1 = printB();
    const p = (WPAPER + Math.PI * CURL_R) * ease.inOut2(prog(f, TL.peel2[0], TL.peel2[1]));
    st.paper = [2, -SHEET[0], 0, 0.8]; st.curl = [1, 0, p, CURL_R];
    st.sheet[2] = 0.05;
    // 成品上的签条（纸坐标：翻过来是镜像，所以按最终位置反算）
    const xs = FINAL_X + 0, ys = 150, pf = WPAPER + Math.PI * CURL_R;
    const sig = 2 * pf - Math.PI * CURL_R - (xs + SHEET[0]);
    const k = prog(f, TL.label - 8, TL.label), lift = 1 - ease.out3(k);
    st.lab2 = [sig - SHEET[0], ys, -360 * (1 + 0.25 * lift), 160 * (1 + 0.25 * lift)];
    st.lab3 = [0.025, f >= TL.label - 8 ? Math.min(1, k * 3) : 0, lift * 12, 1];
  }
  // 第 0 帧的签条：贴在水面上，纸盖过去就被带走
  st.lab = [-500, 235, 300, 152]; st.lab1 = [-0.04, f < TL.peel1[0] ? 1 : 0, 0, 0];
  // 涟漪：最近的几滴
  st.rip = B.drops.filter(d => f >= d.f && f < d.f + 80).slice(-8).map(d => [d.x, d.y, f - d.f, Math.sqrt(d.a) * 0.6]);
  return st;
}
