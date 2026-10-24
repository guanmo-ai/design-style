/** 007 · Minimalism —— 时间轴（帧）。120 BPM @ 60fps → 1 拍 = 30 帧；每次换幕都落在拍点上 */
export const BEAT = 30;
export const S16 = 7.5; // 十六分音符
export const AT = {
  open: 0, // 开场：噪音删到只剩一个点 → 标题（4 拍）
  space: 120, // 01 负空间：点走进密斯的自由平面，平面升成轴测（4 拍）
  subtract: 240, // 02 删减：48 个按键删到 1 个（4 拍）
  function: 360, // 03 功能：剩下的每个形状都有理由；开机，孔跟着出声（4 拍）
  repeat: 480, // 04 重复：一个盒子 → 十个（贾德）；盒子跟着配乐亮（4 拍）
  today: 600, // 05 今天：一个屏幕，一个开关（4 拍）
  recap: 720, // 回顾：一条线上的四个年代，再删到只剩一个点（2 拍）
  end: 780, // 片尾（4 拍）
};
export const DURATION = 900;
export const CHAPTERS: [string, string, number][] = [
  ['负空间', 'Negative space', AT.space],
  ['删减', 'Reduce', AT.subtract],
  ['形式追随功能', 'Form follows function', AT.function],
  ['重复', 'Repetition', AT.repeat],
  ['今天', 'Today', AT.today],
];
