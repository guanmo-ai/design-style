/**
 * 015 · 未来主义 Futurism —— 设计令牌（视频、图片、tokens.css / tokens.json 共用同一组数）
 * 一条物理规则：动的东西留下它刚才的样子。第 k 层残影 = k·Δt 前的位置与姿态，不透明度 0.6^k；字宽 = 速度。
 */
export const C = {
  paper: '#EDE5D3', // 纸 50%
  ink: '#16130F', // 炭 25%
  orange: '#F2501C', // 速度橙 12%：残影、力线、最响的拟声字
  cobalt: '#1F3FD0', // 钴蓝 8%：第二组残影、天空
  silver: '#B9BDC3', // 铬银 5%：机器、金属
  mute: '#776F62', // 说明文字
  paperHi: '#F7F2E6', // 黑底上的字
} as const;

export const FONT = {
  display: "'Archivo', 'Noto Sans SC', sans-serif", // 可变字体：wght 100—900 · wdth 62—125
  mono: "'Space Mono', monospace",
  sc: "'Noto Sans SC', sans-serif",
} as const;

/** 残影 */
export const ECHO = {
  n: 6, // 层数（固定；停下时全部收进本体，所以看起来是 0 层）
  dt: 3, // Δt：相邻两层隔 3 帧 = 1/20 秒（60fps）
  alpha: 0.6, // 第 k 层不透明度 0.6^k → 1 · .6 · .36 · .22 · .13 · .08 · .05
} as const;

/** 字宽 = 速度：wdth = 62 + 63 · min(1, v / vmax)^0.8 */
export const WDTH = {min: 62, max: 125, vmax: 60 /* px/帧 */, gamma: 0.8} as const;

/** 力线：最多 6 条，长度 ∝ 速度，尖端收向运动前方 */
export const FORCE = {max: 6, lenPerSpeed: 26, minSpeed: 4} as const;

/** 拟声：每远一级（或轻一级）字号 ÷ 1.5 */
export const ONOMA = {ratio: 1.5, sizes: [300, 200, 133, 89]} as const;

/** 144 BPM：1 拍 = 25 帧（60fps） */
export const BPM = 144;
export const BEAT = 25;

export const wdthOf = (v: number) => WDTH.min + (WDTH.max - WDTH.min) * Math.pow(Math.min(1, Math.abs(v) / WDTH.vmax), WDTH.gamma);
