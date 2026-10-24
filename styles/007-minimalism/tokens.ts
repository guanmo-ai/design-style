// 007 · 极简主义 Minimalism — 设计令牌（视频、图片、文档共用同一份）
export const C = {
  paper: '#EFECE6', // 暖纸白：底色，比纯白暖一点、暗一点，大面积看也不刺眼
  paperHi: '#F6F4EF', // 亮面：物件正面、屋顶板、手机屏幕
  shade: '#E3DFD8', // 纸的阴面：台基、墙的亮面
  stone: '#CFCAC1', // 石色：水池、墙的暗面
  grey: '#8F8C86', // 中性灰：灰圆（旋钮）、次要文字
  greyDk: '#5F5C57', // 深灰：说明文字
  ink: '#1C1B19', // 墨：正文、细线、贾德盒子的正面
  accent: '#F27A1A', // 信号橙：全片唯一的彩色，只给“最要紧的一处”——那个点
  hair: 'rgba(28,27,25,0.16)', // 发丝线
};

/** 面积比例：纸 80% · 灰 12% · 墨 7.5% · 橙 ≤ 0.5% */
export const AREA = {paper: 0.8, grey: 0.12, ink: 0.075, accent: 0.005};

export const FONT = {
  // Inter Display 的细字重（100 / 200 / 300）：大字用细、用疏，和瑞士风格的粗、紧正好相反
  display: "'Inter Display', 'Inter', 'Noto Sans SC', sans-serif",
  text: "'Inter', 'Noto Sans SC', sans-serif",
  mono: "'Geist Mono', 'JetBrains Mono', monospace", // 注释、尺寸、年份：像工程图上的标注
  sc: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif", // 中文用 300 / 400
};

/** 版式：左右边距 120，上下边距 96；一根横贯画面的发丝线（地平线）在 y = 540 */
export const LAYOUT = {w: 1920, h: 1080, mx: 120, my: 96, horizon: 540, hud: 1012};

/** 线：发丝线 1.5px（主线）/ 1px（标注）；墙 10px；圆角只给手机和收音机机身 */
export const LINE = {main: 1.5, note: 1, wall: 10};

/** 那个点：开场半径 16；它在每一幕里变成那一幕“最要紧的一处” */
export const DOT = {r: 16};
