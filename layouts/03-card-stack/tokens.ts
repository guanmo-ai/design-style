// 布局 03 · Card Stack v8 — 6 张真作品。层叠 = 深度排序 + 只读一张 + 抽/提/压。
export const C = {
  paper: '#EDE6D6',
  cream: '#F6F0E4',
  ink: '#111111',
  ink2: '#5C564C',
  red: '#E31C23',
  teal: '#163A3A',
  sand: '#C8B89A',
  bone: '#E8DFD0',
  night: '#0C0C0E',
  rust: '#9A3B2F',
  olive: '#3D4A2C',
  blush: '#D4A59A',
  mustard: '#C4A35A',
  slate: '#3A3F4B',
  moss: '#2F4F3E',
  coral: '#E36A4A',
  t1: 'rgba(246,240,228,0.96)',
  t2: 'rgba(246,240,228,0.62)',
};

export const STACK = {
  count: 4,
  width: 360,
  height: 480,
  radius: 8,
  stepY: 18,
  stepX: 22,
  stepZ: 20,
  lift: 16,
  rotate: -1.4,
  dimPer: 0.08,
};

export const FONT = {
  display: "'TeX Gyre Heros', 'Helvetica Neue', Helvetica, 'Noto Sans SC', sans-serif",
  sc: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  mono: "'Geist Mono', 'SFMono-Regular', Menlo, monospace",
};
