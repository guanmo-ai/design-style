// 003 · 构成主义 Constructivism — 设计令牌（视频、图片、文档共用同一份）
export const C = {
  paper: '#ECE4D2', // 旧纸：略黄的新闻纸，红和黑压上去才“印”得住
  ink: '#161412', // 印刷黑：带一点暖
  red: '#D3261C', // 构成红：偏橙的朱红，像廉价纸上的油墨
  grey: '#8F897D', // 网点灰：照片网点、次要文字
  light: '#F6F1E6', // 亮纸：只给“白圆”这类需要比纸更亮的形
  rule: 'rgba(22,20,18,0.10)', // 构造线（讲解时显示）
};

/**
 * 轴：全片只有两条轴。主轴从左下往右上 30°（屏幕坐标里是 −30°），副轴与它垂直（60°）。
 * 水平和竖直只留给读的东西（底栏、署名、正文），表现力全部交给斜线。
 */
export const AXIS = {main: -30, cross: 60};
const rad = (d: number) => (d * Math.PI) / 180;
/** 主轴方向（单位向量）与副轴方向 */
export const U = {x: Math.cos(rad(AXIS.main)), y: Math.sin(rad(AXIS.main))}; // (0.866, -0.5)
export const N = {x: Math.cos(rad(AXIS.cross)), y: Math.sin(rad(AXIS.cross))}; // (0.5, 0.866)

/** 节拍：144 BPM @ 60fps → 1 拍 = 25 帧；全片 36 拍 = 9 小节 */
export const BEAT = 25;

export const FONT = {
  // Oswald：压缩无衬线（OFL，带西里尔字母），替代 1920 年代手绘的“砖头字”
  cond: "'Oswald', 'Bebas Neue', 'Arial Narrow', 'Noto Sans SC', sans-serif",
  sc: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
};

/** 形状：楔形、圆、粗条；直角，不用圆角；粗条 = 字高的 1/4 */
export const SHAPE = {radius: 0, bar: 24, hair: 2, wedgeRatio: 0.24};
