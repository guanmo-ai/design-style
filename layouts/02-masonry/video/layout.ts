import {createLayoutFlow, masonry as sharedMasonry, type FlowState, type Placed, type Spec} from '../../../src/lib/motion/layout-flow';
/**
 * 布局 02 · Masonry —— 同一批 26 张卡片贯穿全片。
 * 每一种“排法”都不是手摆的：都由同一个瀑布流算法 masonry() 现场算出来（列数、列宽、间距不同而已）。
 * 卡片编号 = 源顺序，在所有排法里一一对应，所以每次转场都是“同一批卡片重新流一遍”。
 */
import {Easing} from 'remotion';

export type Rect = {x: number; y: number; w: number; h: number; r: number};

export type TextCard = 'red' | 'quote' | 'palette' | 'note';
export type Item = {
  ratio: number; // 高 ÷ 宽（只用 RATIOS 里的几种）
  label: string; // 宽高比标签
  src?: string; // public/02-masonry/photos/*.jpg
  pos?: string; // background-position（同一张照片换个比例时选取的位置）
  text?: TextCard;
  title: string; // 手机双列里的笔记标题
  author: string;
  likes: string;
  stone: string; // 砌石墙那一章的石色
};

const P = (src: string, label: string, ratio: number, title: string, author: string, likes: string, stone: string, pos = '50% 50%'): Item => ({src, label, ratio, title, author, likes, stone, pos});
const T = (text: TextCard, label: string, ratio: number, title: string, author: string, likes: string, stone: string): Item => ({text, label, ratio, title, author, likes, stone});

// 比例：2:3 = 1.5 · 3:4 = 1.333 · 4:5 = 1.25 · 1:1 · 4:3 = 0.75 · 3:2 = 0.667 · 16:9 = 0.5625
export const ITEMS: Item[] = [
  P('tulips', '2:3', 1.5, '周末给自己买了一束郁金香', '小满', '2.4万', '#CFC3AE', '50% 60%'),
  T('red', '1:1', 1, '瀑布流到底是怎么排的？', '观默', '1.2万', '#B9AC96'),
  P('stairs', '3:4', 4 / 3, '圣托里尼的白色台阶', '阿岛', '8,412', '#D9CFBD'),
  P('bread', '1:1', 1, '第一次烤出会裂口的欧包', '面包日记', '3,106', '#BDAE95'),
  P('poster-swiss', '4:5', 1.25, '瑞士风格：一张网格排到底', '观默', '6,580', '#C8BBA4'),
  P('lake', '16:9', 0.5625, '清晨五点的湖', 'Neo', '1.1万', '#AFA28C'),
  P('cat', '4:3', 0.75, '晒太阳的橘猫，一下午没动', '橘子', '5.2万', '#D3C6B0', '45% 55%'),
  P('tokyo', '2:3', 1.5, '东京的傍晚，自动售货机', '夜行', '9,027', '#B3A68F'),
  P('cup', '4:5', 1.25, '手捏的第一只杯子', '陶土', '2,318', '#D6CCB9', '55% 60%'),
  P('poster-bauhaus', '4:5', 1.25, '包豪斯：把好看变成规则', '观默', '7,941', '#C2B49C'),
  P('dunes', '16:9', 0.5625, '沙漠里的日落', '远方', '1.8万', '#CBBDA4'),
  P('monstera', '3:4', 4 / 3, '龟背竹的影子', '植物系', '4,477', '#B7AA93'),
  T('quote', '4:3', 0.75, '少，但是更好', '读书笔记', '6,203', '#D0C4AE'),
  P('citrus', '1:1', 1, '夏天的颜色', '柑橘', '3,690', '#C5B7A0'),
  P('nook', '2:3', 1.5, '把客厅一角改成阅读角', '慢慢', '1.5万', '#D8CEBB', '45% 50%'),
  P('ocean', '3:2', 2 / 3, '从上往下看海', '浪', '7,135', '#BAAE98', '40% 50%'),
  P('poster-bento', '4:5', 1.25, '便当盒布局：一格一事', '观默', '5,866', '#CDBFA8'),
  P('cover-bento', '16:9', 0.5625, '15 秒看懂便当盒布局', '观默', '2,904', '#B5A88F'),
  T('palette', '1:1', 1, '这期的配色', '观默', '1,977', '#D4C8B3'),
  P('lake', '3:4', 4 / 3, '雾散之前', 'Neo', '4,021', '#C0B39C', '82% 50%'),
  P('cover-swiss', '16:9', 0.5625, '15 秒看懂瑞士风格', '观默', '3,380', '#CFC2AC'),
  P('cover-bauhaus', '16:9', 0.5625, '15 秒看懂包豪斯', '观默', '4,512', '#B8AB94'),
  P('ocean', '2:3', 1.5, '浪花的纹理', '浪', '2,760', '#D2C5AF', '72% 50%'),
  P('dunes', '4:5', 1.25, '风吹出来的线', '远方', '3,955', '#BFB19A', '38% 50%'),
  T('note', '4:5', 1.25, '瀑布流 ≠ 便当盒', '观默', '8,866', '#C9BCA5'),
  P('nook', '1:1', 1, '纸灯', '慢慢', '1,433', '#D5CAB6', '55% 52%'),
];
export const N = ITEMS.length;

/**
 * 瀑布流算法：按源顺序，一张一张放进“当前最短的那一列”（一样短时放最左边）。
 * 返回每张卡片的矩形（count 之后的卡片还没放：null）和每列的高度。
 */
export type {Placed, Spec} from '../../../src/lib/motion/layout-flow';
export const masonry = (spec: Spec): Placed => sharedMasonry(ITEMS, spec);

export type Name = 'EMPTY' | 'RAIN' | 'KEY' | 'STONE' | `ALG${number}` | 'PIN' | 'PHONE' | 'WIRE' | 'R5' | 'R3' | 'R2' | 'END';
export type ThemeName = 'KEY' | 'STONE' | 'ALG' | 'PIN' | 'PHONE' | 'WIRE' | 'RESP' | 'END';
export const themeOf = (n: Name): ThemeName => {
  if (n === 'RAIN' || n === 'KEY' || n === 'EMPTY') return 'KEY';
  if (n.startsWith('ALG')) return 'ALG';
  if (n === 'R5' || n === 'R3' || n === 'R2') return 'RESP';
  return n as ThemeName;
};

const BIG: Rect = {x: -3000, y: -3000, w: 9000, h: 9000, r: 0};
type Layout = {rects: (Rect | null)[]; clip: Rect; spec?: Spec; heights?: number[]};
const L = (spec: Spec, clip: Rect = BIG): Layout => {
  const m = masonry(spec);
  return {rects: m.rects, clip, spec, heights: m.heights};
};

// —— 几何 ——
// 右半边 4 列：开场定义 / 算法 / 规则共用（列宽 251，间距 20），所以这三章里同一张卡片落在同一个位置
export const RIGHT = {x0: 760, y0: 100, cols: 4, colW: 251, gap: 20, r: 20};
// 手机：机身 432×900，屏幕内缩 12；信息流两列，列宽 192，间距 8，卡片 = 封面 + 78px 的标题栏
export const PHONE = {x: 1180, y: 74, w: 432, h: 900, r: 64};
export const SCREEN = {x: 1192, y: 86, w: 408, h: 876, r: 52};
export const FEED = {x: 1192, y: 186, w: 408, h: 700, r: 0};
export const META = 78;
// 浏览器窗口：右边贴住 1824，宽度 1728 → 1080 → 560，列数 5 → 3 → 2
export const WIN_Y = 92;
export const WIN_H = 880;
export const WIN_BAR = 48;
export const WIN_W = {R5: 1728, R3: 1080, R2: 560} as const;
const winSpec = (w: number, cols: number): Spec => {
  const pad = 24;
  const gap = 16;
  return {x0: 1824 - w + pad, y0: WIN_Y + WIN_BAR + pad, cols, colW: (w - 2 * pad - (cols - 1) * gap) / cols, gap, r: 14};
};
const winClip = (w: number): Rect => ({x: 1824 - w, y: WIN_Y + WIN_BAR, w, h: WIN_H - WIN_BAR, r: 0});

export const ALG_BASE = 8; // 算法一章：先摆好前 8 张，再一张一张往里放
export const ALG_STEPS = 8; // 3 张慢放（带“比高度”的过程）+ 5 张连放

const ALG: Record<string, Layout> = {};
for (let k = 0; k <= ALG_STEPS; k++) ALG[`ALG${k}`] = L({...RIGHT, r: 16, count: ALG_BASE + k});

// 片尾图标：前 9 张缩成一个 3 列的小瀑布流
export const ICON = {x0: 912, y0: 236, cols: 3, colW: 28, gap: 6, r: 6, count: 9};

export const LAYOUTS: Record<string, Layout> = {
  EMPTY: {rects: ITEMS.map(() => null), clip: BIG},
  RAIN: L({x0: 96, y0: 100, cols: 6, colW: (1728 - 100) / 6, gap: 20, r: 20}),
  KEY: L(RIGHT),
  STONE: L({x0: 760, y0: -36, cols: 5, colW: (1064 - 56) / 5, gap: 14, r: 12}),
  ...ALG,
  PIN: L({x0: 720, y0: -40, cols: 5, colW: (1104 - 64) / 5, gap: 16, r: 16}),
  PHONE: L({x0: FEED.x + 8, y0: FEED.y + 6, cols: 2, colW: 192, gap: 8, r: 10, extra: META}, FEED),
  WIRE: L(RIGHT),
  R5: L(winSpec(WIN_W.R5, 5), winClip(WIN_W.R5)),
  R3: L(winSpec(WIN_W.R3, 3), winClip(WIN_W.R3)),
  R2: L(winSpec(WIN_W.R2, 2), winClip(WIN_W.R2)),
  END: L(ICON),
};

/** 约 128.6 BPM：1 拍 = 28 帧，十六分音符 = 7 帧，全片 32 拍 = 896 帧 */
export const BEAT = 28;
/** 每次重排移动最快的一刻 = 转场开始 + 12 帧，落在拍点上 */
export const HIT = 12;

export type Ease = 'flow' | 'drop';
export type Trans = {at: number; to: Name; dur: number; stagger: number; order: 'index' | 'x' | 'y'; ease: Ease; clipIn?: number};
const tr = (at: number, to: Name, dur: number, stagger: number, order: Trans['order'] = 'index', ease: Ease = 'flow'): Trans => ({at, to, dur, stagger, order, ease});

// 算法一章：卡片落地的帧（3 张慢放各占一拍，5 张连放每 7 帧一张）
export const ALG_LAND = [252, 280, 308, 315, 322, 329, 336, 343];
const DROP = (land: number, k: number): Trans => {
  const dur = k < 3 ? 20 : 14;
  return tr(Math.round(land - dur * 0.7), `ALG${k + 1}` as Name, dur, 0, 'index', 'drop');
};

export const TRANS: Trans[] = [
  tr(0, 'RAIN', 24, 1, 'index', 'drop'), // 开场：卡片像雨点一样落进 6 列
  tr(44, 'KEY', 40, 0.7, 'index'), // 第 56 帧：整面墙流到右半边，让出标题
  tr(128, 'STONE', 36, 0.6, 'y'), // 140：变成砌石墙
  tr(212, 'ALG0', 36, 0.6, 'index'), // 224：只留前 8 张，进入算法
  ...ALG_LAND.map(DROP),
  tr(352, 'PIN', 38, 0.6, 'x'), // 364：Pinterest 图钉墙
  tr(436, 'PHONE', 40, 0.7, 'index'), // 448：飞进手机，变成双列
  tr(520, 'WIRE', 38, 0.6, 'index'), // 532：线框，五条规则
  {...tr(688, 'R5', 38, 0.5, 'index'), clipIn: 6}, // 700：浏览器窗口 5 列（窗口先出现，卡片在窗口里流）
  tr(716, 'R3', 32, 0.5, 'index'), // 728：窗口变窄 → 3 列
  tr(744, 'R2', 32, 0.5, 'index'), // 756：再变窄 → 2 列
  tr(772, 'END', 44, 0.8, 'index'), // 784：收成一个小图标
];

export const SCENE = {
  KEY: {in: 62, out: 122},
  STONE: {in: 146, out: 206},
  ALG: {in: 230, out: 342},
  PIN: {in: 370, out: 426},
  PHONE: {in: 454, out: 510},
  WIRE: {in: 538, out: 680},
  RESP: {in: 700, out: 776},
  END: {in: 796, out: 9999},
};
// 五条规则：从第 546 帧起，每拍一条（落在八分音符上）
export const RULES_AT = [546, 574, 602, 630, 658];

/** 位置缓动：起步稍慢、前段最快、长长地落定（像水流进槽里） */
export {FLOW, dropEase} from '../../../src/lib/motion/layout-flow';
export const COLOR_DUR = 12;
const COLOR = Easing.bezier(0.45, 0, 0.55, 1);

/** 每章自己的“滚动”：开场墙慢慢上移，Pinterest 慢慢上移，手机里手指往上一划 */
const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const easeOut = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - (1 - x) ** 3);
export const drift = (n: Name, f: number): number => {
  switch (n) {
    case 'KEY':
      return -150 * ease((f - 56) / 110);
    case 'PIN':
      return -50 * ease((f - 360) / 110);
    case 'PHONE':
      return -420 * easeOut((f - 468) / 52);
    default:
      return 0;
  }
};

export type State = FlowState<Name, ThemeName>;
export const {tileState, startOf} = createLayoutFlow<Name, ThemeName>({
  layouts: LAYOUTS, transitions: TRANS, itemCount: N, themeOf, drift, bounds: BIG,
  emptyName: 'EMPTY', emptyTheme: 'KEY', colorDuration: COLOR_DUR, colorEase: COLOR,
});

export const transTo = (n: Name) => TRANS.find((t) => t.to === n)!;
