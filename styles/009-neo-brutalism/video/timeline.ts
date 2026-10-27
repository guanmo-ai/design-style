/** 009 · Neo-Brutalism —— 时间轴（帧）。120 BPM，1 拍 = 30 帧；每一次落地和按下都落在拍点或半拍上 */
export const AT = {
  open: 0, // 开场：海报炸成十三颗键帽 → 打字 → 一起按下 → 钻进 O
  border: 120, // 01 黑框：一支笔先画框，元素一个个从框里长出来，拼成一张注册表单
  shadow: 270, // 02 硬影：模糊 40 → 0；卡片抬起、落下；摊成五层阶梯
  press: 420, // 03 按下：二十颗按钮落下，按压像水波一样扩散；全部按下，褪成混凝土
  lineage: 570, // 04 来历：同一面网格：1952 清水混凝土 → 2014 粗野主义网页 → 2021 新粗野主义
  apps: 720, // 05 应用：网页落地页 + 手机 App，一层层落进来
  words: 900, // 五个词：黑框 / 硬影 / 平涂 / 露结构 / 歪一点，一拍一张卡片叠上来
  end: 1050, // 片尾：海报三块从高处落下，全部阴影一起按一下 → 回到第一帧
};
export const DURATION = 1170; // 19.5 秒
export const BEAT = 30;
export const WORD_AT = [0, 1, 2, 3, 4].map((i) => AT.words + i * 30);
export const CHAPTERS: [string, string, number][] = [
  ['黑框', 'BORDER', AT.border],
  ['硬影', 'SHADOW', AT.shadow],
  ['按下', 'PRESS', AT.press],
  ['来历', 'LINEAGE', AT.lineage],
  ['应用', 'IN USE', AT.apps],
];
