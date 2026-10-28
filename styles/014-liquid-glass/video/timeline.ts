/**
 * 014 · 液态玻璃 —— 时间轴（帧）。120 BPM，1 拍 = 30 帧；全片不变速，20 秒 = 10 小节。
 *
 * 一镜到底：六页内容在世界里从左到右排成一排（每页 1920 宽），镜头一路往右走——
 * 停在每页时以 1.2 px/帧 慢慢漂，换章时甩过去。第 6 页就是第 1 页，所以最后一帧 = 第一帧。
 * 玻璃不跟着页面走：它在屏幕上，一直是同一滴，从头接力到尾；页面从它底下滑过去，折射就“活”了。
 */
export const AT = {
  open: 0, // 开场：字墙；一滴玻璃从 GLASS 上滚过去
  bend: 150, // 01 弯光：水滴撑成一块镜片；bevel 44 → 0 → 44，色散 0 → 6%
  eras: 390, // 02 二十五年：同一块玻璃换五次材质（Aqua / Aero / iOS 7 / Glassmorphism / Liquid Glass）
  merge: 630, // 03 融合：一滴分三滴；两滴靠近长出“颈”合成一块；第三滴长成菜单
  ui: 810, // 04 界面：手机播放页 + 网页，内容在下面滚，玻璃浮在上面，字自己换颜色
  end: 1080, // 片尾：所有玻璃收回成开场那一滴 + 那条胶囊
};
export const DURATION = 1200;
export const BEAT = 30;
export const DRIFT = 0.8; // 停留时镜头漂移速度（px/帧）
export const PAGE = 1920;

/** 每页停留的中点（帧）与停留区间；中点时这一页正好对齐屏幕 */
export const STOPS: {mid: number; from: number; to: number}[] = [
  {mid: 30, from: -70, to: 130}, // 0 开场（与第 5 页首尾相接）
  {mid: 270, from: 170, to: 370}, // 1 弯光
  {mid: 510, from: 410, to: 610}, // 2 二十五年
  {mid: 720, from: 650, to: 790}, // 3 融合
  {mid: 945, from: 830, to: 1060}, // 4 界面
  {mid: 1230, from: 1130, to: 1330}, // 5 = 第 0 页
];

const stopX = (k: number, f: number) => PAGE * k + DRIFT * (f - STOPS[k].mid);

/** 三次 Hermite：两端速度都等于漂移速度，甩镜进出没有顿挫 */
const hermite = (p0: number, p1: number, v0: number, v1: number, u: number) => {
  const u2 = u * u;
  const u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * v0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * v1;
};

/** 镜头 x（世界坐标里屏幕左边缘的位置） */
export const camX = (f: number): number => {
  const ff = ((f % DURATION) + DURATION) % DURATION;
  for (let k = 0; k < STOPS.length; k++) {
    const s = STOPS[k];
    if (ff >= s.from && ff <= s.to) return stopX(k, ff);
    if (ff < 0) continue;
    const n = STOPS[k + 1];
    if (n && ff > s.to && ff < n.from) {
      const d = n.from - s.to;
      const u = (ff - s.to) / d;
      return hermite(stopX(k, s.to), stopX(k + 1, n.from), DRIFT * d, DRIFT * d, u);
    }
  }
  return stopX(0, ff);
};

/** 镜头速度（px/帧），用来决定内容要不要加运动模糊 */
export const camV = (f: number) => camX(f + 0.5) - camX(f - 0.5);

/** 单向的“咚”：往下沉一下再回来，不来回颤 */
export const THUMPS: [number, number][] = [
  [588, 14], // 落到 2025 Liquid Glass
  [736, 12], // 两滴合成一块
];
export const thumpY = (f: number) => {
  let y = 0;
  for (const [at, amp] of THUMPS) {
    const u = (f - at) / 14;
    if (u > 0 && u < 1) y += amp * Math.sin(Math.PI * u) * (1 - u);
  }
  return y;
};
