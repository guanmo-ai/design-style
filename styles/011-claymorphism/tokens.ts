// 011 · Claymorphism 粘土拟态 — 设计令牌（视频、图片、文档共用同一份）
// 一招：胖圆角 + 内外成对阴影 = 捏出来的体积。控件不是画的，是捏出来的。

export const C = {
  paper: '#E7EDF4', // 冷灰蓝底：粘土拟态的“工作台”，比纯白软，比新拟态暖一点
  paperDeep: '#D8E0EA',
  ink: '#2C3340', // 软黑，不用纯黑——粘土上的字也是按进去的
  muted: '#7C8796',
  line: 'rgba(44,51,64,0.10)',
  shadow: 'rgba(148,164,186,0.42)',
  highlight: 'rgba(255,255,255,0.82)',
  peach: '#F3B89A',
  mint: '#A8D4B8',
  lavender: '#C4B4E0',
  rose: '#E8A8B6',
  sky: '#A8C4E0',
  cream: '#F0EBE3',
} as const;

/** 每块粘土的高光 / 本体 / 暗部：径向渐变做出微鼓的体积 */
export const TONE = {
  peach: {base: '#F3B89A', hi: '#FFE4D2', lo: '#DFA17F'},
  mint: {base: '#A8D4B8', hi: '#D6F0E0', lo: '#7FB896'},
  lavender: {base: '#C4B4E0', hi: '#E8DEF6', lo: '#9E8CC4'},
  rose: {base: '#E8A8B6', hi: '#F8D6DE', lo: '#C87E90'},
  sky: {base: '#A8C4E0', hi: '#D6E6F4', lo: '#7FA3C4'},
  cream: {base: '#F0EBE3', hi: '#FFF8F0', lo: '#D4CDBE'},
  paper: {base: '#E7EDF4', hi: '#F6F8FB', lo: '#C9D3DE'},
} as const;
export type Tone = keyof typeof TONE;

export const TONES: Tone[] = ['peach', 'mint', 'lavender', 'rose', 'sky', 'cream'];

export const GRID = {cols: 12, rows: 6, module: 122, gutter: 24, mx: 96, my: 96};

/** 120 BPM · 1 拍 = 30 帧；粘土的弹簧比瑞士的“啪”更面、更有质量 */
export const MOTION = {
  fps: 60,
  bpm: 120,
  beat: 30,
  duration: 1440, // 24.0s
  clay: {damping: 16, mass: 1.12, stiffness: 92},
  squish: {damping: 10, mass: 0.72, stiffness: 190},
};

export const FONT = {
  display: "'Fredoka', 'Nunito', 'Noto Sans SC', sans-serif",
  sc: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  mono: "'JetBrains Mono', 'Geist Mono', ui-monospace, monospace",
};

/** 粘土控件的默认半径：按钮趋近半高，卡片 ≥ 48，不要用 8–16 的“App 默认圆角” */
export const RADIUS = {button: 0.5, card: 56, phone: 72, chip: 28, knob: 0.5} as const;
