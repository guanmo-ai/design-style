/** 008 · Risograph —— 时间轴（帧）。120 BPM，1 拍 = 30 帧；Riso 每分钟印 120 张 = 每拍一张 */
export const AT = {
  open: 0, // 开场：三张版飞进来，砸在一起（对版）→ 镜头钻进 O 的“孔”
  stencil: 120, // 01 孔版：热敏头在版纸上烧孔 → 油墨从孔里挤出来 → 揭开版纸，第一色
  passes: 240, // 02 分色：一种颜色过一遍机器——青、黄、黑三遍 → 四张版拆开
  overprint: 360, // 03 叠印：三种油墨叠出七种颜色
  zine: 480, // 04 小志：从试卷到小志，一张张出纸
  words: 600, // 五个词：专色 / 叠印 / 套不准 / 网点 / 颗粒，一拍一个
  end: 750, // 片尾
};
export const DURATION = 900;
export const WORD_AT = [600, 630, 660, 690, 720];
export const CHAPTERS: [string, string, number][] = [
  ['孔版', 'STENCIL', AT.stencil],
  ['分色', 'SEPARATION', AT.passes],
  ['叠印', 'OVERPRINT', AT.overprint],
  ['小志', 'ZINE', AT.zine],
];
/** 每拍一张：到第 f 帧为止印了几张（片尾正好 30 张 = 15 秒 × 120 张/分） */
export const sheets = (f: number) => Math.min(30, Math.floor(f / 30) + 1);
