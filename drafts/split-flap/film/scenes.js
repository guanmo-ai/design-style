// 整片的“目标画面” + 镜头 + 标注。112.5 BPM：一拍 32 帧，一张牌 4 帧（三十二分音符）。
const BEAT = 32;
const TL = {
  end: 960,
  A0: -150, vA: 0.4,          // 开场的波：起跑 = A0 + (列 + 0.55 × 行) / vA；第 0 帧波正扫到画面中间
  ballIn: 44, impact: 96,     // 球从顶上掉进来，第 96 帧砸到底边（第 3 拍）
  kB: 0.9,                    // 涟漪：延迟 = 距离 × 0.9 帧/格（15 ms/格）
  C0: 236,                    // 出发大屏一列列刷出来
  push0: 330, push1: 440,     // 镜头连续推到一块牌跟前
  ticks: [448, 480, 512, 544, 576],   // 倒计时，一拍一张
  pull0: 596, pull1: 724,     // 再连续拉回去
  E0: 600,                    // 大屏整体上移一行
  F0: 712, vF: 1.6,           // 结尾的波再扫一遍（从左往右，比开场快）
  lastLand: 928,              // 最后一块牌（“默”）单独落定
};
const { COLS, ROWS, N, F: FL, ID, BL, YEL, RED, cx, cy, hash } = WALL;
const at = (c, r) => r * COLS + c;

// —— 画面 ——
const TITLE = new Int16Array(N), NOISE = new Int16Array(N), BOARD1 = new Int16Array(N), BOARD2 = new Int16Array(N), FINAL = new Int16Array(N);
let FOCUS = 0, MO = 0, GUAN = 0, ZCELL = 0;
function text(arr, c, r, s) { for (let i = 0; i < s.length; i++) if (c + i < COLS) arr[at(c + i, r)] = s[i] === '#' ? RED : s[i] === '*' ? YEL : ID(s[i]); }
function rows(arr, list) {
  for (const [r, time, dest, gate, lamp, rem] of list) {
    text(arr, 4, r, time); text(arr, 12, r, dest); text(arr, 32, r, gate); if (lamp) text(arr, 38, r, lamp); text(arr, 40, r, rem);
  }
}
function buildImages() {
  const g1 = WALL.pixelGlyph('翻', 26, 22, '500', 0.5), g2 = WALL.pixelGlyph('牌', 26, 22, '500', 0.5);
  for (let r = 0; r < 22; r++) for (let c = 0; c < 26; c++) { if (g1[r][c]) TITLE[at(3 + c, 1 + r)] = YEL; if (g2[r][c]) TITLE[at(31 + c, 1 + r)] = YEL; }
  FINAL.set(TITLE);
  text(FINAL, 23, 24, 'SPLIT-FLAP  观默');
  MO = at(36, 24); GUAN = at(35, 24);
  // 上一幅画面的残留：一墙靠近牌堆末尾的字母（离空白和黄只差几张）
  for (let id = 0; id < N; id++) NOISE[id] = 33 + Math.floor(hash(id, 3) * 10);
  const FL1 = [['16:05', 'ZURICH', 'A12', '*', 'BOARDING'], ['16:20', 'TOKYO', 'B07', '', 'ON TIME'], ['16:35', 'NEW YORK', 'C21', '#', 'DELAYED'],
    ['16:50', 'LISBON', 'A03', '', 'ON TIME'], ['17:05', 'REYKJAVIK', 'D14', '', 'GO TO GATE'], ['17:20', 'VALPARAISO', 'B11', '', 'ON TIME'],
    ['17:35', 'OSAKA', 'C02', '', 'ON TIME'], ['17:50', 'MARRAKESH', 'A09', '#', 'DELAYED'], ['18:05', 'QUITO', 'D02', '', 'ON TIME'], ['18:20', 'HELSINKI', 'B15', '', 'ON TIME']];
  const RW = [3, 5, 7, 9, 11, 13, 19, 21, 23];
  text(BOARD1, 4, 1, 'DEPARTURES'); text(BOARD1, 32, 1, 'GATE'); text(BOARD1, 40, 1, 'REMARKS');
  rows(BOARD1, RW.map((r, i) => [r, ...FL1[i]]));
  text(BOARD1, 4, 16, 'GATE A12 CLOSES IN'); text(BOARD1, 40, 16, '00:05');
  FOCUS = at(44, 16); ZCELL = at(12, 3);
  text(BOARD2, 4, 1, 'DEPARTURES'); text(BOARD2, 32, 1, 'GATE'); text(BOARD2, 40, 1, 'REMARKS');
  const FL2 = FL1.slice(1); FL2[0] = ['16:20', 'TOKYO', 'B07', '*', 'BOARDING'];
  rows(BOARD2, RW.map((r, i) => [r, ...FL2[i]]));
  text(BOARD2, 4, 16, 'ZURICH A12'); text(BOARD2, 40, 16, 'DEPARTED');
}

// —— 球：重力 + 落地压扁，三次弹跳后滚出右边 ——
const BALL_R = 3.3, FLOOR = cy(ROWS - 1) - 0.6 + BALL_R;
const g = 2 * (21 - FLOOR) / ((TL.impact - TL.ballIn) ** 2);
const HOPS = (() => { const h = [[TL.impact, g * (TL.impact - TL.ballIn)]]; for (const e of [0.62, 0.5, 0.4]) { const [t, v] = h[h.length - 1]; h.push([t + 2 * v * e / g, v * e]); } return h; })();
function ball(f) {
  if (f < TL.ballIn) return null;
  let x = -1.5, y, sq = 0;
  if (f < TL.impact) y = 21 - 0.5 * g * (f - TL.ballIn) ** 2;
  else {
    x += 0.21 * (f - TL.impact);
    let i = 0; while (i + 1 < HOPS.length && f >= HOPS[i + 1][0]) i++;
    const [t0, v0] = HOPS[i], e = i < 3 ? [0.62, 0.5, 0.4][i] : 0;
    const v = v0 * e, dt = f - t0;
    y = i < 3 ? FLOOR + v * dt - 0.5 * g * dt * dt : FLOOR;
    for (const [th, vh] of HOPS) { const d = f - th; if (d > -2 && d < 5) sq = Math.max(sq, (vh / 1.5) * 0.32 * Math.exp(-((d - 0.5) ** 2) / 4)); }
  }
  if (x - BALL_R > cx(COLS - 1) + 1) return null;
  return { x, y: y - sq * BALL_R * 0.5, rx: BALL_R * (1 + sq), ry: BALL_R * (1 - sq) };
}
const IMPACT = [-1.5, FLOOR - BALL_R];

const sA = id => TL.A0 + (id % COLS + 0.55 * ((id / COLS) | 0)) / TL.vA;
const sB = id => TL.impact + Math.hypot(cx(id % COLS) - IMPACT[0], cy((id / COLS) | 0) - IMPACT[1]) * TL.kB;
const sC = id => TL.C0 + (id % COLS) * 0.9 + ((id / COLS) | 0) * 0.5;
const sE = id => TL.E0 + ((id / COLS) | 0) * 3 + (id % COLS) * 0.4;
const sF = id => {
  if (id === MO) return TL.lastLand - 42 * FL;         // “默”在牌堆最后：从空白出发要翻过整副 42 张
  if (id === GUAN) return TL.lastLand - 14 - 41 * FL;
  return TL.F0 + (id % COLS + 0.55 * ((id / COLS) | 0)) / TL.vF;
};
const BALLF = [];   // 每帧的球（整数帧）
function target(id, f) {
  let T = f < sA(id) ? NOISE[id] : TITLE[id];
  if (TITLE[id] && f >= sB(id)) T = BL;
  const b = BALLF[f];
  if (b && f < TL.C0) { const dx = (cx(id % COLS) - b.x) / b.rx, dy = (cy((id / COLS) | 0) - b.y) / b.ry; if (dx * dx + dy * dy < 1) T = YEL; }
  if (f >= sC(id)) T = BOARD1[id];
  if (id === FOCUS) TL.ticks.forEach((t, i) => { if (f >= t) T = ID('43210'[i]); });
  if (f >= sE(id)) T = BOARD2[id];
  if (f >= sF(id)) T = FINAL[id];
  return T;
}
function buildFilm() {
  buildImages();
  for (let f = -300; f < TL.end + 200; f++) BALLF[f] = ball(f);
  WALL.build(target, -300, TL.end + 200);
}

// —— 镜头：全景 ↔ 一块牌跟前，连续推拉（距离按等比走）——
const FOV = 30 * Math.PI / 180;
const ss = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
const s5 = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * x * (x * (6 * x - 15) + 10);
const nrm = a => { const l = Math.hypot(...a); return a.map(v => v / l); };
function camAt(t) {
  const fx = cx(FOCUS % COLS), fy = cy((FOCUS / COLS) | 0);
  // 全景：开场斜着看一面墙（有纵深），慢慢转正；结尾从另一侧转正、慢慢推近
  let wDir, D0, W0;
  if (t < TL.pull0) { const a = ss((t + 40) / (TL.push0 + 40)); wDir = nrm([0.10 * (1 - a), -0.05 * (1 - a), 1]); D0 = 62 - 0.5 * a; W0 = [-0.4 * (1 - a), 0, 0]; }
  else { const a = ss((t - TL.pull1 + 60) / (TL.end - TL.pull1 + 60)); wDir = nrm([0.1 * (1 - a), 0.05 * (1 - a), 1]); D0 = 61.2 - 1.4 * a; W0 = [0, 0, 0]; }
  const closeT = [fx + 0.05, fy - 0.06, 0.02];
  const o = ss((t - TL.push1) / (TL.pull0 - TL.push1));          // 特写里慢慢绕
  const closeDir = nrm([0.42 - 0.62 * o, 0.30 - 0.06 * o, 0.86]);
  const closeD = 3.5 - 0.35 * o;
  let p;
  if (t < TL.push1) p = s5((t - TL.push0) / (TL.push1 - TL.push0));
  else if (t < TL.pull0) p = 1;
  else p = 1 - s5((t - TL.pull0) / (TL.pull1 - TL.pull0));
  const dist = Math.exp(Math.log(D0) + (Math.log(closeD) - Math.log(D0)) * p);
  const w = Math.max(0, Math.min(1, (D0 - dist) / (D0 - closeD)));
  const tg = W0.map((v, i) => v + (closeT[i] - v) * w);
  const dir = nrm(wDir.map((v, i) => v + (closeDir[i] - v) * Math.pow(w, 1.6)));
  const k = t - TL.lastLand, dip = k > 0 ? -0.22 * (k / 4) * Math.exp(1 - k / 4) : 0;   // 最后一块落定：镜头往下“咚”一下（单向）
  tg[1] += dip;
  return { eye: tg.map((v, i) => v + dir[i] * dist), target: tg, fov: FOV, up: [0, 1, 0], w };
}
const LAMP = [cy(0) + 9, 14, 42, 1.35];
// 最后一块落定，顶上那排灯闪一下再回落
const lampAt = t => { const k = t - TL.lastLand; return k < 0 ? LAMP : [LAMP[0], LAMP[1], LAMP[2], LAMP[3] * (1 + 0.45 * Math.exp(-k / 14) * Math.min(1, k / 1.5))]; };   // 灯的 y、z、衰减距离、强度

// —— 标注：小号等宽字 + 一根线，钉在正在发生的那块牌上 ——
const fpos = () => [cx(FOCUS % COLS), cy((FOCUS / COLS) | 0)];
const D = FLAP.DIM;
const ANN = [
  { a: 8, b: 92, text: '1 张 = 4 帧 = 67 ms', p: () => [cx(41), cy(9), 0], off: [60, -150] },
  { a: 24, b: 100, text: '到站 = 起跑 + 张数 × 67 ms', p: () => [cx(47), cy(17), 0], off: [40, 120] },
  { a: TL.impact + 6, b: 240, text: '延迟 = 距离 × k（15 ms / 格）', p: () => [IMPACT[0], IMPACT[1] + 1, 0], off: [-520, -260] },
  { a: 178, b: 292, text: '黄 → 空白：要翻过 0—9、A—Z，42 张', p: f => { const b = BALLF[Math.min(f, 290)] || BALLF[290]; return [b ? b.x - 8 : 20, cy(18), 0]; }, off: [-160, -380] },
  { a: 340, b: 432, text: 'Z 要先翻过 A—Y：26 张 = 1.7 s', p: () => [cx(12), cy(3), 0], off: [60, 110] },
  { a: TL.ticks[0] + 4, b: 540, text: '重力：θ ∝ t²，先慢后快（不是 ease-out）', p: () => { const [x, y] = fpos(); return [x - D.w / 2, y + 0.35, 0.3]; }, off: [-560, -170] },
  { a: TL.ticks[1] + 4, b: 572, text: '撞到挡片，回弹 4%，2 帧', p: () => { const [x, y] = fpos(); return [x + D.w / 2, y - D.hh, 0.03]; }, off: [90, 120] },
  { a: TL.ticks[2] + 4, b: 596, text: '影子压在下半张上', p: () => { const [x, y] = fpos(); return [x - 0.2, y - 0.25, 0.03]; }, off: [-520, 170] },
  { a: TL.ticks[3] + 4, b: 600, text: '中缝 2 px · 铰链在缝里', p: () => { const [x, y] = fpos(); return [x + D.w / 2 + 0.02, y, 0.02]; }, off: [110, -120] },
  { a: TL.E0 + 40, b: 724, text: '只能往前翻：牌堆的顺序决定路过什么', p: () => [cx(20), cy(9), 0], off: [80, -130] },
  { a: 772, b: 906, text: '“默”在牌堆最后一张：要翻过整副，2.8 s', p: () => [cx(36), cy(24), 0], off: [150, -90] },
];
