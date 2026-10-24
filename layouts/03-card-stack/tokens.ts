// 布局 03 · Card Stack 卡片层叠 — 设计令牌（视频、图片、文档共用同一份）
export const C = {
  paper: '#F4F5F7', // 冷灰画布（iOS / Stripe 产品底）
  card: '#FFFFFF',
  ink: '#0F172A',
  ink2: '#64748B',
  ink3: '#94A3B8',
  line: 'rgba(15,23,42,0.08)',
  chip: '#F1F5F9',
  accent: '#2563EB', // 唯一强调色：产品蓝（焦点柱、规则编号、抬起）
  accentSoft: 'rgba(37,99,235,0.12)',
  dim: 'rgba(15,23,42,0.06)',
};

export const STACK = {
  count: 4,
  width: 760,
  height: 428,
  radius: 28,
  stepY: 28,
  stepX: 16,
  stepZ: 42,
  lift: 14,
  rotate: -1.2,
  dimPer: 0.1,
  blurPer: 0.65,
};

export const FONT = {
  display: "'Inter Display', 'Noto Sans SC', sans-serif",
  text: "'Inter', 'Noto Sans SC', sans-serif",
  mono: "'Geist Mono', 'SFMono-Regular', Menlo, monospace",
  sc: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
};
