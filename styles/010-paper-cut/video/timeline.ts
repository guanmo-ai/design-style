/** 010 · Paper Cut —— 时间轴（帧）。120 BPM，1 拍 = 30 帧；20 秒 = 40 拍 = 1200 帧 */
export const AT = {
  open: 0, // 00 开场：层从后往前叠上，红日弹出（5 拍）
  edit: 150, // 01 编辑海报：图层面板 + 揭开 FAR / MID / NEAR（6 拍）
  app: 330, // 02 App 插画：风景收进手机，滑动视差（6 拍）
  brand: 510, // 03 品牌片头：镜头穿过层，大字被剪出来（6 拍）
  rules: 690, // 04 五条规则（8 拍）
  pits: 930, // 05 常见坑（5 拍）
  end: 1080, // 片尾 @guanmo_ai（4 拍）
};
export const DURATION = 1200;
/** 下一幕提前 TR 帧盖上来，正好在拍点上盖满 */
export const TR = 20;
export const RULE_AT = [708, 750, 792, 834, 876];
export const PIT_AT = [948, 990, 1032];
export const CHAPTERS: [string, number][] = [
  ['开场', AT.open],
  ['编辑海报', AT.edit],
  ['App 插画', AT.app],
  ['品牌片头', AT.brand],
  ['五条规则', AT.rules],
  ['常见坑', AT.pits],
];
