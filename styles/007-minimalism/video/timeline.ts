/** 007 · Minimalism —— 时间轴（帧）。120 BPM @ 60fps → 1 拍 = 30 帧 · 24.0s */
export const BEAT = 30;
export const S16 = 7.5;
export const AT = {
  open: 0, // 开场钩子：噪音删到一个点（~1.8s）
  teach: 108, // 非极简讲解：字重 / 测量 / 留白闪 / 删走 / 网格 / 前后对比
  app: 360, // 极简产品 · App：按、推、拉、拨，同一屏不晾 >0.8s
  web: 624, // 极简产品 · Web：hover、滚动、锚点
  pay: 900, // 极简产品 · 确认 → 空状态
  recap: 1104, // 非极简讲解：三容器对照
  end: 1260, // 片尾 · @guanmo_ai
};
export const DURATION = 1440; // 24.0s
export const CHAPTERS: [string, string, number][] = [
  ['示意', 'How', AT.teach],
  ['App', 'Alarm', AT.app],
  ['Web', 'Docs', AT.web],
  ['确认', 'Pay', AT.pay],
  ['对照', 'Same', AT.recap],
];
