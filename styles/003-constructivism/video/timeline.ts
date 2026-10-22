/** 003 · Constructivism —— 时间轴（帧）。144 BPM，1 拍 = 25 帧；所有换幕都落在拍点上 */
export const AT = {
  open: 0, // 开场：红楔子刺进白圆（4 拍）
  diag: 100, // 01 斜线（3 拍）
  type: 175, // 02 大字
  montage: 250, // 03 蒙太奇
  tower: 325, // 04 塔
  textile: 400, // 05 纺织
  stage: 475, // 06 舞台
  book: 550, // 07 书
  words: 625, // 五个词（5 拍）
  end: 750, // 片尾（6 拍）
};
export const DURATION = 900;
export const CHAPTERS: [string, number][] = [
  ['斜线', AT.diag],
  ['大字', AT.type],
  ['蒙太奇', AT.montage],
  ['塔', AT.tower],
  ['纺织', AT.textile],
  ['舞台', AT.stage],
  ['书', AT.book],
];
