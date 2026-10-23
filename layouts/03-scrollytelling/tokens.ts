// 布局 03 · Scrollytelling 滚动叙事 — 设计令牌（视频、图片、文档共用同一份）
export const C = {
  night: '#000000', // 舞台黑（苹果产品页的底）
  panel: '#1C1C1E', // 深色卡片
  panel2: '#2C2C2E',
  t1: '#F5F5F7', // 深色底上的主文字
  t2: '#86868B', // 深色底上的次要文字
  t3: '#48484A',
  paper: '#F5F5F7', // 浅色章节
  ink: '#1D1D1F', // 浅色底上的主文字
  ink2: '#6E6E73',
  accent: '#2997FF', // 强调色：滚动条、步骤编号、“钉住”的舞台（视频 X 光）
  trigger: '#FF5C9A', // 视频里的触发线（视口 50%）
  stuck: '#30D158', // 只用来标“钉住”的舞台（结构图）
};

/** 主角设备的屏幕与标题渐变 */
export const GRAD = ['#FF7A2F', '#FF2E7E', '#8B3DFF', '#2997FF'];
export const gradCss = (deg = 90) => `linear-gradient(${deg}deg, ${GRAD[0]} 0%, ${GRAD[1]} 35%, ${GRAD[2]} 68%, ${GRAD[3]} 100%)`;

/** 结构：一段很高的 section，里面一个 sticky 舞台 + 若干步骤，触发线在视口 50% */
export const SCROLLY = {
  sectionHeight: '400vh', // 3 个步骤 + 1 屏收尾
  stage: {position: 'sticky', top: 0, height: '100vh'},
  stepGap: '100vh', // 一步一屏左右
  trigger: 0.5, // 触发线：视口高度的 50%
  sideBySide: {stage: '7fr', steps: '5fr', breakpoint: 768}, // ≥768 并排，<768 改成覆盖
};

export const FONT = {
  display: "'Inter Display', 'Noto Sans SC', sans-serif",
  text: "'Inter', 'Noto Sans SC', sans-serif",
  mono: "'Geist Mono', 'SFMono-Regular', Menlo, monospace",
  serif: "'Instrument Serif', 'Noto Serif SC', Georgia, serif", // 2012 Snow Fall 那一章
  sc: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
};
