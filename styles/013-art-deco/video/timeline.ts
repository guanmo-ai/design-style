/** 013 · Art Deco —— 时间轴（帧）。120 BPM 摇摆，1 拍 = 30 帧；全片不变速，20 秒 = 10 小节 */
export const AT = {
  open: 0, // 开场：海报就是电梯门，从中缝向两边打开，只剩一条金线
  axis: 120, // 01 中轴：一线变三线 → 三线向左右同时拉开，变成画框
  zig: 300, // 02 阶梯：摩天楼从中轴一级级长高，镜头跟着往上摇
  sun: 480, // 03 放射：镜头拉远，太阳藏在楼后，射线像折扇一样打开
  lineage: 600, // 04 来历：楼顶换三次——巴黎 1925 → 上海 1929 → 纽约 1930
  apps: 780, // 05 应用：整座楼缩进手机的拱窗；网页从自己的中轴打开
  words: 960, // 五条规则：五块牌子从中间往两边依次打开
  end: 1080, // 片尾：电梯门合上，回到海报（最后一帧 = 第一帧）
};
export const DURATION = 1200;
export const BEAT = 30;
/** 04 来历：每 60 帧换一座城 */
export const CITY_AT = [AT.lineage, AT.lineage + 60, AT.lineage + 120];
export const CHAPTERS: [string, string, number][] = [
  ['中轴', 'AXIS', AT.axis],
  ['阶梯', 'ZIGGURAT', AT.zig],
  ['放射', 'SUNBURST', AT.sun],
  ['来历', '1925—1939', AT.lineage],
  ['应用', 'IN USE', AT.apps],
];
/** 金色高光扫过的时刻（每次扫过一整个周期，首尾相位一致） */
export const SWEEPS = [6, 452, 560, 735, 900, 1146];
