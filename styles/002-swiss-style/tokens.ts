// 002 · 瑞士国际主义 Swiss Style — 设计令牌（视频、图片、文档共用同一份）
export const C = {
  paper: '#F5F4F0', // 纸白：比纯白略暖，屏幕上不刺眼
  ink: '#111111', // 黑
  red: '#E30613', // 瑞士红：全片唯一的彩色
  grey: '#7A7A78', // 次要文字
  rule: 'rgba(17,17,17,0.09)', // 网格线
  build: 'rgba(227,6,19,0.7)', // 结构线（标注网格时用）
  night: '#0F0F0F', // 海报黑底
};

/**
 * 网格：12 栏 × 6 行，栏宽 = 行高 = 122，间距 24（模块是正方形）
 * 左右边距 96，上下边距 114；基线 12
 */
export const GRID = {cols: 12, rows: 6, module: 122, gutter: 24, mx: 96, my: 114, baseline: 12};

export const FONT = {
  // TeX Gyre Heros：Helvetica 的开源替代（GUST Font License）
  grotesk: "'TeX Gyre Heros', 'Helvetica Neue', Helvetica, Arial, 'Noto Sans SC', sans-serif",
  condensed: "'TeX Gyre Heros Cn', 'TeX Gyre Heros', 'Noto Sans SC', sans-serif",
  sc: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
};
