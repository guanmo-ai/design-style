// 布局 01 · Bento Grid 便当盒布局 — 设计令牌（视频、图片、文档共用同一份）
export const C = {
  black: '#000000',
  card: '#161618', // 深色卡片（上）
  cardLow: '#0F0F11', // 深色卡片（下）
  line: 'rgba(255,255,255,0.07)', // 1px 描边
  t1: '#F5F5F7', // 主文字
  t2: '#86868B', // 次要文字
  light: '#F2F2F4', // 浅色背景
  ink: '#1D1D1F', // 浅色主题主文字
  orange: '#FF8A1F',
  pink: '#FF2D6F',
  violet: '#A63DFF',
  indigo: '#7B83FF', // 后台主题强调色
  green: '#4CC38A',
};

/** 唯一的强调色：橙 → 粉 → 紫，全片只用在少数几个地方 */
export const ACCENT = `linear-gradient(120deg, ${C.orange} 0%, ${C.pink} 48%, ${C.violet} 100%)`;

/** 网格：4 列 · 间距 20 · 圆角 32 · 内边距 40 */
export const GRID = {gap: 20, radius: 32, pad: 40, margin: [96, 100] as const};

export const FONT = {
  display: "'Inter Display', 'Noto Sans SC', sans-serif",
  text: "'Inter', 'Noto Sans SC', sans-serif",
  mono: "'Geist Mono', 'SFMono-Regular', Menlo, monospace",
  sc: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
};
