// 014 · 液态玻璃 Liquid Glass — 设计令牌（视频、图片、文档共用同一份）
// 整个风格只有一条物理规则：玻璃不发光，只把后面的东西弯过来——折射量 = 边缘的坡度。
// 玻璃本身无色，画面的颜色全部来自玻璃后面的内容。
export const C = {
  ink: '#0B0C10', // 字与深色内容
  paper: '#F3F2EE', // 浅底
  mute: '#6B6E78', // 次要文字：在纸上 4.5:1
  orange: '#FF5A1F', // 内容色（玻璃后面）
  pink: '#FF2E7E',
  blue: '#2E4BFF',
  mint: '#2BD9A0',
  violet: '#8B5CFF',
  white: '#FFFFFF',
};

/**
 * 一块玻璃的材质参数（视频里的着色器、图里的 SVG 滤镜、网页里的 CSS 共用这些数）
 *   bevel  边缘那一圈坡的宽度（px）：越宽越“厚”
 *   edge   边缘最大位移 = bevel × edge
 *   mag    中间整体放大
 *   frost  磨砂（模糊半径 px）；液态玻璃本身为 0，压字的浮层给一点
 *   tint   一层极淡的底色（白，0—1）
 *   chroma R/G/B 弯曲量的差：色散
 *   rim    边缘高光强度；shadow 投影强度
 */
export type Material = {
  bevel: number;
  edge: number;
  mag: number;
  frost: number;
  tint: [number, number, number, number];
  chroma: number;
  rim: number;
  shadow: number;
  gloss: number; // 2001 Aqua 的“果冻”上半截高光
  border: number; // 2020 Glassmorphism 的 1px 白边
};

const base: Material = {bevel: 44, edge: 0.9, mag: 0.06, frost: 0, tint: [1, 1, 1, 0.05], chroma: 0.06, rim: 0.9, shadow: 0.2, gloss: 0, border: 0};

/** 厚度 = 层级：越靠上越厚 */
export const THICKNESS = {
  thin: {...base, bevel: 12, mag: 0.03} as Material, // 列表行、标签
  regular: {...base, bevel: 26, mag: 0.04} as Material, // 按钮、导航栏
  thick: {...base, bevel: 44} as Material, // 浮层、播放器
};

/** 二十五年的“玻璃”：同一块东西，只换材质参数 */
export const ERAS: {year: string; name: string; zh: string; note: string; m: Material}[] = [
  {year: '2001', name: 'Aqua', zh: 'Mac OS X', note: '果冻高光 · 不模糊', m: {...base, bevel: 0, edge: 0, mag: 0, chroma: 0, tint: [0.2, 0.52, 1, 0.62], gloss: 0.9, rim: 0.45, shadow: 0.28}},
  {year: '2007', name: 'Aero', zh: 'Windows Vista', note: '模糊 6px · 白边 · 斜向反光', m: {...base, bevel: 0, edge: 0, mag: 0, chroma: 0, frost: 6, tint: [0.75, 0.85, 1, 0.22], gloss: 0.25, border: 0.7, rim: 0.3}},
  {year: '2013', name: 'iOS 7', zh: '控制中心', note: '模糊 24px · 无边 · 无高光', m: {...base, bevel: 0, edge: 0, mag: 0, chroma: 0, frost: 24, tint: [1, 1, 1, 0.38], rim: 0, shadow: 0}},
  {year: '2020', name: 'Glassmorphism', zh: 'Dribbble', note: '模糊 14px · 1px 白边 · 15% 白', m: {...base, bevel: 0, edge: 0, mag: 0, chroma: 0, frost: 14, tint: [1, 1, 1, 0.16], border: 1, rim: 0.2, shadow: 0.22}},
  {year: '2025', name: 'Liquid Glass', zh: 'iOS 26', note: '不模糊 · 只折射 · 色散 6%', m: {...base}},
];

/** 靠近就融合：间距小于 merge 时用 smooth-min 合成一块 */
export const MERGE = {gap: 24, k: 24};

/** 光从左上方来（−37°），所有玻璃同一个光源 */
export const LIGHT = {x: -0.6, y: -0.8};

/** 120 BPM：每拍 30 帧；全片不变速 */
export const MOTION = {fps: 60, bpm: 120, beat: 30};

export const FONT = {
  // Inter Display（rsms，OFL）：SF Pro 的开源替代，标题
  display: "'Inter Display', 'Inter', 'Noto Sans SC', sans-serif",
  text: "'Inter', 'Noto Sans SC', sans-serif",
  // Geist Mono（Vercel，OFL）：参数读数
  mono: "'Geist Mono', 'JetBrains Mono', monospace",
  sc: "'Noto Sans SC', 'PingFang SC', sans-serif",
};
