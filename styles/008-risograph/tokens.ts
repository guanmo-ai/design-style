// 008 · 孔版印刷 Risograph — 设计令牌（视频、图片、文档共用同一份）
// 油墨色是 Riso 官方专色在屏幕上的近似值（stencil.wiki / Pantone U 对照）；在纸上一律按“正片叠底”叠印
export const INK = {
  pink: '#FF48B0', // 荧光粉 Fluorescent Pink · Pantone 806 U：CMYK 印不出来的颜色
  teal: '#00838A', // 青绿 Teal · Pantone 321 U
  yellow: '#FFB511', // 芥末黄 Sunflower · Pantone 116 U
  black: '#000000', // 黑 Black
} as const;
export type Ink = keyof typeof INK;
export const INKS: Ink[] = ['pink', 'teal', 'yellow', 'black'];

/** 每种油墨的“墨量”：印在纸上的不透明度（黑墨偏薄，压在彩色上还能透出一点） */
export const DENSITY: Record<Ink, number> = {pink: 0.94, teal: 0.92, yellow: 0.95, black: 0.9};

export const INK_NAME: Record<Ink, [string, string, string]> = {
  pink: ['荧光粉', 'FLUO PINK', '806 U'],
  teal: ['青绿', 'TEAL', '321 U'],
  yellow: ['芥末黄', 'SUNFLOWER', '116 U'],
  black: ['黑', 'BLACK', 'BLACK U'],
};

/** 叠印出来的颜色：纸色 × 油墨色（逐通道相乘），由 riso.tsx 的 mixInks 算出，这里写死只为文档对照 */
export const OVERPRINT = {
  pinkYellow: '#F4300F', // 粉 × 黄 = 朱红
  tealYellow: '#00570A', // 青 × 黄 = 墨绿
  pinkTeal: '#002352', // 粉 × 青 = 藏蓝
  all: '#001906', // 三色 = 近黑
};

export const C = {
  paper: '#F3ECDB', // 米白道林纸（Natural，未涂布）：Riso 的墨只能“吃”进不涂布的纸
  paperShade: '#E7DEC9', // 纸的阴影 / 纸边
  master: '#DCE0DA', // 版纸（master）：一层薄膜 + 一层很薄的纤维纸
  drum: '#2B2B2E', // 滚筒的金属
  ink: '#1C1A17', // 黑墨印在米白纸上的样子（用于非叠印的说明文字）
  grey: '#8A8478', // 次要文字
  rule: 'rgba(28,26,23,0.14)', // 细线
  hot: '#FFE36E', // 热敏头发热点
};

/**
 * 版面：12 栏，栏宽 122、间距 24、左右边距 96（与 002 同一套栏）；上下留出裁切线和套准标记的位置
 * 套准标记在四角距边 48px；底部是印刷“版边信息条”（slug）
 */
export const GRID = {cols: 12, module: 122, gutter: 24, mx: 96, my: 96, slug: 1020, mark: 48};

/** 每拍 30 帧（120 BPM）；Riso 每分钟 120 张 = 每拍印一张 */
export const MOTION = {fps: 60, bpm: 120, beat: 30, ppm: 120, boil: 4};

export const FONT = {
  // Archivo（Omnibus-Type，OFL）：可变字重 100—900、字宽 62—125；标题用 900 / 100%，标签用 62% 的窄体
  display: "'Archivo', 'Helvetica Neue', Arial, 'Noto Sans SC', sans-serif",
  // Space Mono（Colophon，OFL）：印刷工单、版边信息
  mono: "'Space Mono', 'JetBrains Mono', ui-monospace, 'Noto Sans SC', monospace",
  sc: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
};
