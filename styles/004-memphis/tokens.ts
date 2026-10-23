/** 004 · 孟菲斯 Memphis —— 设计令牌（视频、图片、网页共用同一份数值） */
export const C = {
  paper: '#FDF6EC', // 米白：底色（像塑料贴面的白）
  ink: '#111111', // 黑：描边、投影、图案（所有东西都有一圈黑）
  pink: '#FF7EB6', // 泡泡糖粉
  yellow: '#FFD23F', // 柠檬黄
  teal: '#22C3B5', // 薄荷青
  blue: '#2D4BFF', // 钴蓝
  red: '#FF5A36', // 番茄红
  lilac: '#B79CFF', // 淡紫
  white: '#FFFFFF',
};
/** 糖果色轮换顺序：相邻的两块永远不同色 */
export const CANDY = [C.pink, C.yellow, C.teal, C.blue, C.red, C.lilac];

export const F = {
  display: 'Fredoka', // 圆头几何无衬线：标题（拉丁）
  cn: 'Noto Sans SC', // 思源黑体 Heavy：中文
  mono: 'JetBrains Mono', // 年份、时间码
};

/** 描边与硬投影（1080p）：线 5px，投影往右下 10px，不模糊 */
export const LINE = {outline: 5, thin: 3};
export const SHADOW = {dx: 10, dy: 10};
/** 歪着放：所有东西都转一点，±6° / ±12° / ±18° */
export const TILT = [6, 12, 18];
/** 压扁回弹：落地时最多压扁 24% */
export const SQUASH = 0.24;
/** 节拍：120 BPM · 60fps → 1 拍 = 30 帧，八分音符 15 帧，十六分 7.5 帧 */
export const BPM = 120;
export const BEAT = 30;
