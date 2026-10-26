// 012 · 等距 Isometric — 设计令牌（视频、图片、文档共用同一份）
// 轴色贯穿全片：右行 X 陶土、上行 Y 青绿、左深 Z 靛蓝。体积的顶面亮、右面中、左面暗。

export const C = {
  stage: '#E8EEF4', // 冷灰棚：产品等距插画常用的“空气”
  paper: '#F4F1EA', // 暖纸：片尾与风格图
  ink: '#1B2430',
  muted: '#6B7380',
  faint: 'rgba(27,36,48,0.10)',
  line: 'rgba(27,36,48,0.16)',
  white: '#FFFBFA',
  cream: '#F1E4D0',
  sand: '#E4D2B4',
  coral: '#E85D4C', // 主角色 = X 轴
  mint: '#1FAE9B', // Y 轴
  indigo: '#3D5C9E', // Z 轴
  gold: '#E0B15A',
  rose: '#E8A4A8',
  slate: '#5C6B7A',
  navy: '#243447',
  green: '#5BAA72',
  sky: '#7EB3E0',
  shadow: 'rgba(27,36,48,0.18)',
} as const;

/** 三轴身份：锁角之后才堆体积 */
export const AXIS = {
  x: {deg: 30, color: C.coral, name: 'X', zh: '宽'},
  y: {deg: 90, color: C.mint, name: 'Y', zh: '高'},
  z: {deg: 150, color: C.indigo, name: 'Z', zh: '深'},
} as const;

export const GRID = {cols: 12, module: 122, gutter: 24, mx: 96, my: 96};

export const MOTION = {fps: 60, bpm: 120, beat: 30, size: [1920, 1080] as const, durationFrames: 1440};

export const FONT = {
  display: "'Inter Display', 'Inter', 'Helvetica Neue', Arial, 'Noto Sans SC', sans-serif",
  body: "'Inter', 'Helvetica Neue', Arial, 'Noto Sans SC', sans-serif",
  mono: "'Geist Mono', ui-monospace, 'Noto Sans SC', monospace",
  sc: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
};

/** 三种常用变体：真等距 / 2:1 斜二测 / 产品柔阴影（仍是平行投影） */
export const VARIANT = {
  iso: {zh: '经典等距', en: 'CLASSIC  30° / 30°', note: '三轴等长，夹角 120°'},
  military: {zh: '斜二测 2:1', en: 'DIMETRIC  2:1', note: '钻石更扁，游戏与军事地图常用'},
  product: {zh: '产品等距', en: 'PRODUCT  SOFT SHADE', note: '平行投影 + 顶亮侧暗'},
} as const;
