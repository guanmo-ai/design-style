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
export const DURATION = 1170; // 源帧（19.5 秒）；成片见 OUT_DURATION
export const BEAT = 30;
export const WORD_AT = [0, 1, 2, 3, 4].map((i) => AT.words + i * 30);
export const CHAPTERS: [string, string, number][] = [
  ['黑框', 'BORDER', AT.border],
  ['硬影', 'SHADOW', AT.shadow],
  ['按下', 'PRESS', AT.press],
  ['来历', 'LINEAGE', AT.lineage],
  ['应用', 'IN USE', AT.apps],
];

/**
 * 成片时间 → 源时间（上面所有帧号都是“源帧”）。信息最密的 01 黑框放慢 ×1.2：150 → 180 帧，正好多 1 拍，
 * 后面的章节仍然落在拍点上；成片 1170 → 1200 帧（20 秒）。配乐的节奏声部全程 120 BPM 不变速
 */
export const WARP: [number, number, number][] = [
  // [源起点, 源终点, 放慢倍数]
  [0, AT.border, 1],
  [AT.border, AT.shadow, 1.2],
  [AT.shadow, DURATION, 1],
];
export const OUT_DURATION = Math.round(WARP.reduce((n, [a, b, k]) => n + (b - a) * k, 0)); // 1200
export const toSource = (o: number) => {
  let o0 = 0;
  for (const [a, b, k] of WARP) {
    const len = (b - a) * k;
    if (o < o0 + len) return a + (o - o0) / k;
    o0 += len;
  }
  return DURATION - 1 + (o - (OUT_DURATION - 1));
};
