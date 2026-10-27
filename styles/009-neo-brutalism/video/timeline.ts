/** 009 · Neo-Brutalism —— 时间轴（帧）。120 BPM，1 拍 = 30 帧；每一次“砸”和“按”都落在拍点或半拍上 */
export const AT = {
  open: 0, // 开场：一张没写 CSS 的网页，四行 CSS 一行一拍砸上去 → 按下标题 → 标题块撑满全屏
  border: 120, // 01 黑框：六个“默认样式”的组件，半拍一个被描上 6px 黑框，圆角归零
  shadow: 240, // 02 硬影：模糊 40 → 0，偏移 8 / 14 / 24，三张卡片砸下来叠住
  press: 360, // 03 按下：在一个记账 App 里按筹码、按条目、按“记一笔”
  lineage: 480, // 04 来历：1952 清水混凝土 → 2014 粗野主义网页 → 2021 新粗野主义界面
  words: 600, // 五个词：黑框 / 硬影 / 平涂 / 露结构 / 歪一点，一拍一张卡片叠上来
  end: 750, // 片尾：海报三块砸回来，全部阴影一起“按”一下
};
export const DURATION = 900;
export const BEAT = 30;
export const WORD_AT = [600, 630, 660, 690, 720];
export const CHAPTERS: [string, string, number][] = [
  ['黑框', 'BORDER', AT.border],
  ['硬影', 'SHADOW', AT.shadow],
  ['按下', 'PRESS', AT.press],
  ['来历', 'LINEAGE', AT.lineage],
];
