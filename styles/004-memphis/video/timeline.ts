/** 004 · Memphis —— 时间轴（帧）。120 BPM，1 拍 = 30 帧；每章 3 拍，换幕都落在拍点上 */
export const AT = {
  open: 0, // 开场：积木一块块掉下来 → MEMPHIS（4 拍）
  record: 120, // 01 唱片：1980，名字的来历
  carlton: 210, // 02 书架：Carlton（1981）
  tahiti: 300, // 03 台灯：Tahiti（1981）
  first: 390, // 04 椅子：First（1983）
  pattern: 480, // 05 纹样：Bacterio 和它的伙伴们
  today: 570, // 06 今天：回到屏幕上
  rules: 660, // 五条规则（5 拍）
  end: 810, // 片尾（3 拍）
};
export const DURATION = 900;
export const CHAPTERS: [string, number][] = [
  ['唱片', AT.record],
  ['书架', AT.carlton],
  ['台灯', AT.tahiti],
  ['椅子', AT.first],
  ['纹样', AT.pattern],
  ['今天', AT.today],
];
