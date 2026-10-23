/** 005 · Pop Art —— 时间轴（帧）。剧本按 120 BPM 写，1 拍 = 30 帧（成片放慢 1.2 倍后是 100 BPM，1 拍 = 36 帧）；每章 3 拍，换幕都落在拍点上 */
export const AT = {
  open: 0, // 开场：网点长出来 → 爆炸框“砰”（4 拍）
  collage: 120, // 01 拼贴：1956，伦敦
  soup: 210, // 02 汤罐：1962，32 罐
  dots: 300, // 03 网点：1961—1963，放大的漫画
  screen: 390, // 04 丝网：1964，一刮一张
  burger: 480, // 05 放大：1962，软雕塑
  today: 570, // 06 今天：回到手机里
  rules: 660, // 五条规则（5 拍）
  end: 810, // 片尾（3 拍）
};
export const DURATION = 900; // 时间轴长度（“剧本帧”）
/** 放慢 1.2 倍：剧本帧 × 1.2 = 成片帧（15 秒 → 18 秒，120 BPM → 100 BPM），动画和配乐一起放慢 */
export const STRETCH = 1.2;
export const LENGTH = Math.round(DURATION * STRETCH); // 1080 帧 = 18 秒
export const CHAPTERS: [string, number][] = [
  ['拼贴', AT.collage],
  ['汤罐', AT.soup],
  ['网点', AT.dots],
  ['丝网', AT.screen],
  ['放大', AT.burger],
  ['今天', AT.today],
];
