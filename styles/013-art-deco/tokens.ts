// 013 · 装饰艺术 Art Deco — 设计令牌（视频、图片、文档共用同一份）
// 整个风格只有一条规矩：先立一条中轴，所有东西从中轴向左右同时长出来；金色是材质，只给线。
export const C = {
  onyx: '#0E0D0B', // 底 60%：黑曜，带一点暖
  onyx2: '#1A1711', // 体块的亮面
  gold: '#C9A45A', // 鎏金 10%：线、大字、唯一的按钮
  goldLt: '#F2DC9C', // 金的高光
  goldDk: '#7E5E26', // 金的暗部
  ivory: '#F1E7D2', // 象牙 25%：正文、纸
  emerald: '#0E4A3C', // 孔雀绿：第二底色（上海的绿铜屋顶）
  lacquer: '#9E2B25', // 漆红 5%：点缀
  smoke: '#A89F8C', // 次要文字：在黑曜上 7.4:1
};

/** 金是材质不是颜色：一条斜向多段渐变，亮—暗—亮，细线上也看得出反光 */
export const GOLD_STOPS: [number, string][] = [
  [0, C.goldLt],
  [0.22, C.gold],
  [0.4, C.goldDk],
  [0.6, C.goldLt],
  [0.8, C.gold],
  [1, C.goldDk],
];

/** 一线变三线：一粗两细，间距 ≈ 粗线 × 3。界面（1x）与视频（1920×1080）两套尺度 */
export const LINE = {
  ui: {thick: 1.8, thin: 0.8, gap: 5},
  video: {thick: 4, thin: 1.6, gap: 12},
};

/** 阶梯切角：两级台阶，不用圆角 */
export const STEP = {ui: 6, video: 18, levels: 2};

/** 版面：中轴 x = 960；画框内缩 40，三条线依次往里 12 */
export const FRAME = {inset: 40, axis: 960};

/** 120 BPM 摇摆：每拍 30 帧，反拍落在 2/3 拍（20 帧）上 */
export const MOTION = {fps: 60, bpm: 120, beat: 30, swing: 20};

export const FONT = {
  // Poiret One（Denis Masharov，OFL）：细线几何大写，1920 年代海报字
  display: "'Poiret One', 'Jost', sans-serif",
  // Jost（indestructible type*，OFL）：Futura 1927 的开源替代，标签与数字
  geo: "'Jost', 'Futura', 'Noto Sans SC', sans-serif",
  // Noto Serif SC：中文细宋做标题，宽字距
  serif: "'Noto Serif SC', 'Songti SC', serif",
  // Noto Sans SC：说明文字，手机上要看得清
  sc: "'Noto Sans SC', 'PingFang SC', sans-serif",
};
