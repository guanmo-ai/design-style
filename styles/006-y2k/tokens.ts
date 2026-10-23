/** 006 · 千禧未来主义 Y2K Futurism —— 设计令牌（视频、图片、网页共用同一份数值） */
export const C = {
  ink: '#0A1633', // 深海军蓝：正文、细线（Y2K 不用纯黑，黑里带一点蓝）
  grey: '#5E6880', // 蓝灰：次要文字、刻度
  silver: '#C9CED8', // 银：大面积的金属感底色、标题栏
  paperTop: '#EEF0F4', // 底色上端（铝的亮面）
  paperBottom: '#D9DEE6', // 底色下端
  white: '#FFFFFF', // 细条纹的亮条、高光
  aqua: '#1E6FF0', // Aqua 蓝：默认按钮、进度条、当前选中
  aquaDeep: '#0D58D6', // Aqua 蓝的下半截（果冻按钮中线下面那一段）
  aquaLight: '#7DC0FF', // Aqua 蓝的底部反光（焦散）
  bondi: '#0095B6', // 邦迪蓝：1998 iMac G3 的半透明外壳
  lime: '#C8F53C', // 荧光绿：一点就够（“已通过”“COMPLIANT”）
  red: '#E0443A', // 红黄绿：窗口左上角三颗
  yellow: '#F2B53A',
  green: '#4DBA3F',
};
/** 1999 年 1 月 iMac G3 五种口味（近似色，按半透明外壳在白底上的观感取值） */
export const FLAVORS: [string, string, string][] = [
  ['Blueberry', '蓝莓', '#1D7FD0'],
  ['Strawberry', '草莓', '#E5336F'],
  ['Tangerine', '橘子', '#F5891F'],
  ['Grape', '葡萄', '#7442A8'],
  ['Lime', '青柠', '#6CC13A'],
];
export const F = {
  display: "'Unbounded'", // 宽体几何黑体：铬字（拉丁、数字）
  tech: "'Michroma'", // 宽体科技字：标签、页眉
  pixel: "'Silkscreen'", // 像素字：系统信息、读数
  cn: "'Noto Sans SC'", // 思源黑体：中文
  latin: "'Inter'", // 英文引文（Aqua 时代的系统字 Lucida Grande 不开源，用 Inter 代替）
};
/** 铬的“影棚环境”（线性 RGB，可以 > 1 表示比白还亮的灯）：天空 → 地平线 → 地面 */
export const ENV = {
  skyTop: [0.04, 0.16, 0.62],
  skyMid: [0.45, 0.62, 0.95],
  skyHor: [1.35, 1.38, 1.45],
  floorHor: [0.015, 0.018, 0.025],
  floorBot: [0.2, 0.22, 0.27],
};
/** 同一套环境压成 sRGB 色标（给 CSS / SVG / 设计软件里的“假铬”渐变用） */
export const CHROME_STOPS: [number, string][] = [
  [0, '#2A4FB8'], // 天空顶
  [0.32, '#9DB6EE'], // 天空
  [0.49, '#FFFFFF'], // 地平线（最亮）
  [0.51, '#1A2236'], // 地平线下一像素就变暗：这条“断层”就是铬
  [0.75, '#3B4458'], // 地面
  [1, '#A9B3C6'], // 地面远处的反光
];
/** 材质参数（1080p 设计稿像素） */
export const MAT = {
  bevel: 26, // 倒角半径：字号 520 时 26px（约字号的 5%）
  smooth: 2.4, // 倒角抹圆
  shadow: [0, 20, 0.55], // 投影：往下 20px，浓度 0.55，模糊 16px
  gelHighlight: 0.46, // 果冻按钮：高光占上半截高度的 46%
  stripe: 4, // 细条纹：4px 一个周期（2px 白 + 2px 透明）
  grid: 80, // 技术网格：80px
};
/** 节拍：120 BPM · 60fps → 1 拍 = 30 帧 */
export const BPM = 120;
export const BEAT = 30;
