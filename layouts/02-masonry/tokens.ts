// 布局 02 · Masonry 瀑布流布局 — 设计令牌（视频、图片、文档共用同一份）
export const C = {
  paper: '#F2EFE9', // 暖白画布（画廊墙）
  card: '#FFFFFF', // 浅色卡片
  ink: '#141414', // 主文字 / 深色卡片
  ink2: '#6F6A62', // 次要文字（暖灰）
  line: 'rgba(20,20,20,0.08)', // 浅色描边
  night: '#0D0E10', // 深色画布（算法 / 规则）
  nightCard: '#17181B',
  t1: '#F4F2EE', // 深色底上的主文字
  t2: '#8C8A86', // 深色底上的次要文字
  accent: '#F2462E', // 唯一强调色：朱红（最短的那一列、规则编号、标注）
  sand: '#E9E2D3', // 沙色便签
  mortar: '#2B2621', // 砌石墙的灰缝
};

/** 网格：列宽固定 · 高度 = 列宽 × 宽高比 · 横竖间距相同 */
export const GRID = {gap: 20, radius: 20, cols: {desktop: 5, tablet: 3, phone: 2}, phoneGap: 8, phoneRadius: 10};

/** 只用这几种宽高比（高 ÷ 宽）：图片按原比例放，不裁切 */
export const RATIOS = {'2:3': 1.5, '3:4': 4 / 3, '4:5': 1.25, '1:1': 1, '4:3': 0.75, '3:2': 2 / 3, '16:9': 0.5625};

export const FONT = {
  serif: "'Instrument Serif', 'Noto Sans SC', serif",
  display: "'Inter Display', 'Noto Sans SC', sans-serif",
  text: "'Inter', 'Noto Sans SC', sans-serif",
  mono: "'Geist Mono', 'SFMono-Regular', Menlo, monospace",
  sc: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
};
