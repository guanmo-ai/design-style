/** 006 · Y2K —— 时间轴（帧）。120 BPM，1 拍 = 30 帧，不放慢；每章 4 拍，换幕都落在拍点上 */
export const AT = {
  open: 0, // 00 开场：开机自检 → 铬字 Y2K（4 拍）
  chrome: 120, // 01 铬：天空 + 地平线 + 地面
  jelly: 240, // 02 果冻：1998 邦迪蓝 → 1999 五种口味
  aqua: 360, // 03 Aqua：2000 年 1 月，Mac OS X
  emoji: 480, // 04 表情：1999，12×12 像素
  bug: 600, // 05 千年虫：23:59:59 → 00:00:00
  today: 720, // 06 今天：2025 Liquid Glass
  rules: 840, // 五条规则（4 拍）
  end: 960, // 片尾（4 拍）
};
export const DURATION = 1080; // 18 秒
/** 转场长度：下一幕提前 TR 帧开始盖上来，正好在拍点上盖满 */
export const TR = 14;
export const CHAPTERS: [string, number][] = [
  ['开场', AT.open],
  ['铬', AT.chrome],
  ['果冻', AT.jelly],
  ['Aqua', AT.aqua],
  ['表情', AT.emoji],
  ['千年虫', AT.bug],
  ['今天', AT.today],
];
