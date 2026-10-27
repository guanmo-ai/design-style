// 009 · 新粗野主义 Neo-Brutalism — 设计令牌（视频、图片、文档共用同一份）
// 整个风格只有一个秘密：阴影 = 同形黑块向右下偏移，模糊永远是 0。
export const C = {
  ink: '#000000', // 描边、阴影、正文：只用纯黑，不用灰
  paper: '#FFF6E5', // 底：暖白，像没刷漆的纸板
  white: '#FFFFFF', // 卡片
  yellow: '#FFD23F', // 主色：最重要的一块
  pink: '#FF8FD6', // 按下 / 选中
  lime: '#B8F15A', // 成功 / 第三层
  blue: '#7AA2FF', // 信息 / 背景
  orange: '#FF7A45', // 贴纸 / 警告
  concrete: '#A39E93', // 1952 年的清水混凝土
  concreteDark: '#6E6A62',
  link: '#0000EE', // 浏览器默认链接蓝（2014 年的粗野主义网页）
  grey: '#5C5850', // 次要文字：在纸底上 6.6:1，过 AA
};
export type Fill = 'yellow' | 'pink' | 'lime' | 'blue' | 'orange' | 'white';
export const FILLS: Fill[] = ['yellow', 'pink', 'lime', 'blue', 'orange'];

/** 界面尺度（1x）：描边 3–4，阴影 4 / 8，按下位移 = 阴影偏移 */
export const UI = {border: 4, shadow: [4, 8], press: 'translate(var(--shadow), var(--shadow))', radius: [0, 8, 999]};

/** 视频尺度（1920×1080）：在 1x 的基础上放大 1.5 */
export const V = {border: 6, shadow: [8, 14, 24], radius: 0, dot: 30};

/** 版面：12 栏，栏宽 122、间距 24、左右边距 96（与 002 / 008 同一套栏） */
export const GRID = {cols: 12, module: 122, gutter: 24, mx: 96, my: 96};

/** 120 BPM：每拍 30 帧。按下 6 帧（100ms）线性，不弹；砸下来允许一次过冲 */
export const MOTION = {fps: 60, bpm: 120, beat: 30, press: 6, slam: 12};

export const FONT = {
  // Archivo（Omnibus-Type，OFL）：900 / 字宽 125 的宽体，做“砸下来”的标题
  display: "'Archivo', 'Arial Black', 'Noto Sans SC', sans-serif",
  // Space Grotesk（Florian Karsten，OFL）：界面文字与数字
  grotesk: "'Space Grotesk', 'Archivo', 'Noto Sans SC', sans-serif",
  // Space Mono（Colophon，OFL）：CSS 代码、令牌
  mono: "'Space Mono', 'JetBrains Mono', ui-monospace, 'Noto Sans SC', monospace",
  sc: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  // 2014 年的“没写 CSS 的网页”：浏览器默认字体
  browser: "'Tinos', 'Times New Roman', serif", // Tinos：与 Times New Roman 等宽度的开源替代（Apache 2.0）
};
