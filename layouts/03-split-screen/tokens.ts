// 布局 03 · Split Screen 分屏布局 — 设计令牌（视频、图片、文档共用同一份）
// 只有三个颜色：墨、纸、钴蓝。一条中线，两边各说各的。
export const C = {
  ink: '#0E0E10', // 左半（或暗面）：墨黑
  paper: '#F1EDE4', // 另一半（或亮面）：暖纸色
  blue: '#2B35FF', // 第二种声音：钴蓝
  peri: '#8E95FF', // 墨色上的浅钴蓝（对比度 ≥ 6）：小标签、编号
  grey: '#6B675E', // 纸上的次要文字（对比度 4.9）
  mute: '#8A877F', // 墨上的次要文字（对比度 5.6）
};

/** 分屏：黄金分割 61.8% 是默认的中线，另外两个常用比例 50 / 70 */
export const SPLIT = {golden: 0.618, even: 0.5, main: 0.7, w: 1920, h: 1080};
export const RATIO = {even: [50, 50], golden: [62, 38], main: [70, 30]} as const;

export const FONT = {
  // Archivo（Omnibus-Type，OFL）：900 字重，wdth 62—125，标题与巨字
  display: "'Archivo', 'Arial Black', 'Noto Sans SC', sans-serif",
  // Space Mono（Colophon，OFL）：标注、代码、读数
  mono: "'Space Mono', 'JetBrains Mono', ui-monospace, 'Noto Sans SC', monospace",
  // Noto Sans SC（OFL）：中文
  sc: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
};

/** 动效：120 BPM，1 拍 = 30 帧；全片 40 拍 = 1200 帧（20 秒） */
export const MOTION = {fps: 60, bpm: 120, beat: 30, size: [1920, 1080] as const, durationFrames: 1200};
