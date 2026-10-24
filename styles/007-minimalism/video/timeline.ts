/** 007 · Minimalism —— 时间轴（帧）。120 BPM @ 60fps → 1 拍 = 30 帧 */
export const BEAT = 30;
export const S16 = 7.5;
export const AT = {
  open: 0, // 开场：噪音删到一个点，地平线，标题（4 拍）
  app: 120, // App：线长成手机；先删掉多余闹钟，再按、推页、拉 sheet、拨开关
  web: 600, // Web：极简手册站，滚动 / hover / 锚点
  pay: 930, // 确认支付 → 空状态（同一套语言换容器）
  end: 1140, // 片尾：回到那个点 · @guanmo_ai
};
export const DURATION = 1320; // 22.0s
export const CHAPTERS: [string, string, number][] = [
  ['App', 'Alarm', AT.app],
  ['Web', 'Docs', AT.web],
  ['确认', 'Pay', AT.pay],
];
