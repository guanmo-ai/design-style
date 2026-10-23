/** 005 · 波普艺术 Pop Art —— 设计令牌（视频、图片、网页共用同一份数值） */
export const C = {
  paper: '#FFF4DC', // 新闻纸：底色（漫画书便宜的纸，偏黄）
  ink: '#111111', // 黑：轮廓线、硬投影、拟声字的边
  yellow: '#FFD31A', // 原色黄：爆炸框、旁白框、大底色
  red: '#E62E2D', // 原色红：拟声字、网点、汤罐
  blue: '#1E5BC6', // 原色蓝：大底色、头发、天空
  pink: '#F7B5A8', // 本戴肤色：白底上的红点“看起来”就是这个颜色
  magenta: '#F0458E', // 沃霍尔荧光粉：丝网印刷的“错版色”
  cyan: '#4FB3E8', // 漫画天蓝：浅底色、眼泪
  white: '#FFFFFF',
};
/** 物件色：只给“实物”用（汉堡、汤罐的金色徽章），不当底色 */
export const OBJ = {bun: '#E39A45', meat: '#6B3420', leaf: '#3DAA4A', gold: '#E8B830'};
/** 原色轮换：相邻的两块永远不同色 */
export const PRIMARY = [C.red, C.yellow, C.blue, C.magenta, C.cyan];

export const F = {
  display: 'Bangers', // 漫画拟声字：标题（拉丁）
  cn: 'Noto Sans SC', // 思源黑体 Black：中文
  mono: 'JetBrains Mono', // 年份、时间码
};

/** 轮廓线与硬投影（1080p）：粗黑线 6px，投影往右下 12px，不模糊 */
export const LINE = {outline: 6, thin: 3};
export const SHADOW = {dx: 12, dy: 12};
/** 本戴点（Ben-Day dots）：六角排列，点距 24px，最大半径 = 点距 × 0.6 时正好连成一片 */
export const DOT = {pitch: 24, max: 0.6};
/** 节拍：120 BPM · 60fps → 1 拍 = 30 帧，八分音符 15 帧，十六分 7.5 帧 */
export const BPM = 120;
export const BEAT = 30;
