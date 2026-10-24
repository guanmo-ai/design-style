/** 010 · Paper Cut 剪纸层叠 —— 设计令牌（视频、图片、网页共用同一份数值） */
export const C = {
  sky: '#071820', // 夜空：最远的一张纸
  navy: '#0B2430', // 页眉、深色字
  sun: '#E23A2B', // 红日：全片唯一的暖色强调
  ink: '#142028', // 正文
  grey: '#5C6E72', // 次要文字、层号
  paper: '#F6F3EB', // 笔记本卡片、编辑器底
  cream: '#EDE8DC', // 近景纸边
  white: '#FFFDF8',
  mist: '#D7E8DC', // 最浅的一层山
};

/** 山层：远 → 近，一层一色（不要在同一层上做渐变） */
export const HILLS = ['#134A5C', '#1B6572', '#287E7C', '#3D9884', '#6BB894', '#B8DCC8'] as const;

/** 树上的纸比它所在的山略深一档，仍是平涂剪影 */
export const TREES = ['#0E3A48', '#164E58', '#1F6A68', '#2A8074', '#3A9A80', '#4A8A70'] as const;

export const F = {
  display: 'Jost', // 几何无衬线：PAPERCUTOUT 标题（Futura 的开源替代）
  cn: 'Noto Sans SC', // 思源黑体：中文
  mono: 'JetBrains Mono', // 层号、FAR / MID / NEAR
};

/** 层间阴影：越近越大。没有这道阴影，剪纸就变成贴纸 */
export const SHADOW = {
  color: '#06141C',
  far: {dy: 6, blur: 8, o: 0.28},
  mid: {dy: 12, blur: 12, o: 0.34},
  near: {dy: 20, blur: 16, o: 0.42},
};

/** 视差系数：远慢近快。层移即故事 */
export const PARA = [0.08, 0.16, 0.28, 0.42, 0.6, 0.82, 1.08];

/** 节拍：120 BPM · 60fps → 1 拍 = 30 帧 */
export const BPM = 120;
export const BEAT = 30;
