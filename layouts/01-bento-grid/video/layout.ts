/**
 * 布局 01 · Bento Grid —— 七张卡片贯穿全片：同一组卡片在八种布局之间“重新排版”。
 * 每种布局 = 7 个矩形（画布坐标，1920×1080）。卡片编号在所有布局里一一对应。
 */
import {Easing} from 'remotion';

export type Rect = {x: number; y: number; w: number; h: number; r: number};
const R = (x: number, y: number, w: number, h: number, r = 32): Rect => ({x, y, w, h, r});

// 4 列网格：列宽 = (总宽 − 3 × 20) / 4
const cols = (x0: number, w: number) => {
  const cw = (w - 60) / 4;
  return {x: (i: number) => x0 + i * (cw + 20), w: (n: number) => n * cw + (n - 1) * 20};
};
const K = cols(96, 1728); // 发布会 / 起源 / 后台：左右各留 96
const Wf = cols(760, 1064); // 规则：网格挪到右侧
const Hm = cols(600, 1224); // 个人主页：左侧留给头像栏

export type LayoutName = 'HOOK' | 'KEY' | 'BENTO' | 'METRO' | 'IOS' | 'WIRE' | 'HOME' | 'DASH' | 'END';

const KEY: Rect[] = [
  R(K.x(0), 100, K.w(2), 620), // 0 主角 2×2
  R(K.x(2), 100, K.w(1), 300), // 1
  R(K.x(3), 100, K.w(1), 620), // 2 竖条 1×2
  R(K.x(2), 420, K.w(1), 300), // 3
  R(K.x(0), 740, K.w(2), 240), // 4 横条 2×1
  R(K.x(2), 740, K.w(1), 240), // 5
  R(K.x(3), 740, K.w(1), 240), // 6
];

const WIRE: Rect[] = [
  R(Wf.x(0), 100, Wf.w(2), 620),
  R(Wf.x(2), 100, Wf.w(1), 300),
  R(Wf.x(3), 100, Wf.w(1), 620),
  R(Wf.x(2), 420, Wf.w(1), 300),
  R(Wf.x(0), 740, Wf.w(2), 240),
  R(Wf.x(2), 740, Wf.w(1), 240),
  R(Wf.x(3), 740, Wf.w(1), 240),
];

// 后台：顶部留一行标题，三行等高
const DY = [196, 464, 732];
const DH = 248;

// 片尾：发布会布局整体缩成一个小图标
const END_S = 0.2;
const END_C = {x: 960, y: 318};
const shrink = (r: Rect): Rect => ({
  x: END_C.x + (r.x - 960) * END_S,
  y: END_C.y + (r.y - 540) * END_S,
  w: r.w * END_S,
  h: r.h * END_S,
  r: 8,
});

// 便当盒：和发布会布局同一种拓扑（2×2 主角 + 1×2 竖条 + 2×1 横条 + 4 个 1×1），整体缩进一个漆盒里
export const BOX = {x: 700, y: 110, w: 1124, h: 860, r: 40};
const BENTO: Rect[] = [
  R(728, 138, 524, 528, 18), // 0 白饭 + 梅干
  R(1272, 138, 252, 254, 18), // 1 玉子烧
  R(1544, 138, 252, 528, 18), // 2 烤三文鱼
  R(1272, 412, 252, 254, 18), // 3 西兰花
  R(728, 686, 524, 256, 18), // 4 炸鸡块
  R(1272, 686, 252, 256, 18), // 5 小番茄
  R(1544, 686, 252, 256, 18), // 6 腌萝卜
];

// Windows Phone / Windows 8 开始屏幕：一组同色系磁贴，一直排到屏幕外（原版直角、窄缝；本片圆角 24、缝 24）
// 和 02 便当、04 iOS 同一种章节版式：左边是年份和说明，磁贴墙放在右半边，斜着往右后方退进黑暗里
export const MU = 220;
export const MG = 24;
export const MR = 24;
export const MX0 = 920;
export const MY0 = 190;
export const mx = (c: number) => MX0 + c * (MU + MG);
export const my = (r: number) => MY0 + r * (MU + MG);
export const mw = (n: number) => n * MU + (n - 1) * MG;
const M = (c: number, r: number, w: number, h: number) => R(mx(c), my(r), mw(w), mw(h), MR);
const METRO: Rect[] = [M(0, 0, 2, 2), M(2, 0, 2, 1), M(2, 1, 1, 1), M(3, 1, 1, 1), M(0, 2, 2, 1), M(4, 0, 2, 2), M(2, 2, 2, 1)];

// iOS 14 桌面：手机屏幕 432×900，小组件 小 180 / 中 384×180，两个图标 76
export const PHONE = {x: 1180, y: 80, w: 432, h: 900, r: 64};
export const IX = [1204, 1408];
export const ICON_X = [1204, 1307, 1409, 1512];
export const ICON_Y = 762;
const IOS: Rect[] = [
  R(1204, 354, 384, 180, 40), // 0 中：照片
  R(1204, 150, 180, 180, 40), // 1 小：天气
  R(1408, 150, 180, 180, 40), // 2 小：日历
  R(1204, 558, 180, 180, 40), // 3 小：电池
  R(ICON_X[0], ICON_Y, 76, 76, 18), // 4 图标：信息
  R(1408, 558, 180, 180, 40), // 5 小：时钟
  R(ICON_X[1], ICON_Y, 76, 76, 18), // 6 图标：相机
];

export const LAYOUTS: Record<LayoutName, Rect[]> = {
  HOOK: Array.from({length: 7}, () => R(300, 190, 1320, 700, 40)),
  KEY,
  BENTO,
  METRO,
  IOS,
  WIRE,
  HOME: [
    R(Hm.x(0), 400, Hm.w(2), 580, 28), // 主角挪到左下：最新作品
    R(Hm.x(2), 100, Hm.w(1), 280, 28),
    R(Hm.x(3), 100, Hm.w(1), 280, 28),
    R(Hm.x(2), 400, Hm.w(1), 280, 28),
    R(Hm.x(0), 100, Hm.w(2), 280, 28), // 横条挪到顶上：GitHub
    R(Hm.x(2), 700, Hm.w(2), 280, 28),
    R(Hm.x(3), 400, Hm.w(1), 280, 28),
  ],
  DASH: [
    R(K.x(2), DY[0], K.w(2), DH * 2 + 20, 24), // 主角挪到右上：收入
    R(K.x(0), DY[0], K.w(1), DH, 24),
    R(K.x(1), DY[0], K.w(1), DH, 24),
    R(K.x(0), DY[1], K.w(1), DH, 24),
    R(K.x(0), DY[2], K.w(2), DH, 24),
    R(K.x(2), DY[2], K.w(2), DH, 24),
    R(K.x(1), DY[1], K.w(1), DH, 24),
  ],
  END: KEY.map(shrink),
};

/** 150 BPM：1 拍 = 24 帧 */
export const BEAT = 24;

export type Trans = {at: number; to: LayoutName; dur: number; stagger: number; order: number[]};
export const TRANS: Trans[] = [
  {at: 48, to: 'KEY', dur: 46, stagger: 3, order: [0, 1, 3, 2, 4, 5, 6]},
  {at: 156, to: 'BENTO', dur: 34, stagger: 2, order: [0, 1, 3, 2, 4, 5, 6]},
  {at: 252, to: 'METRO', dur: 34, stagger: 2, order: [0, 4, 1, 2, 6, 3, 5]},
  {at: 348, to: 'IOS', dur: 38, stagger: 2, order: [5, 2, 1, 0, 3, 6, 4]},
  {at: 444, to: 'WIRE', dur: 36, stagger: 2, order: [0, 1, 3, 4, 5, 2, 6]},
  {at: 588, to: 'HOME', dur: 36, stagger: 3, order: [4, 1, 2, 0, 3, 6, 5]},
  {at: 684, to: 'DASH', dur: 36, stagger: 3, order: [0, 1, 2, 3, 6, 4, 5]},
  {at: 780, to: 'END', dur: 44, stagger: 2, order: [0, 1, 2, 3, 4, 5, 6]},
];
/** 每次重排移动最快的一刻（at + 12）正好落在拍点上：168 / 264 / 360 / 456 / 600 / 696 / 792 */
export const HIT = 12;

// 场景（内容出现 / 消失的时间窗）
export const SCENE = {
  KEY: {in: 80, out: 146},
  BENTO: {in: 174, out: 242},
  METRO: {in: 268, out: 338},
  IOS: {in: 366, out: 434},
  WIRE: {in: 460, out: 576},
  HOME: {in: 606, out: 672},
  DASH: {in: 702, out: 768},
  END: {in: 812, out: 9999},
};
export const RULES_AT = [468, 486, 504, 522, 540]; // 五条规则，附点八分（18 帧）一条，都落在十六分音符网格上

/** 卡片重排的缓动：起步稍慢、前段最快、长长地落定，像发布会的版面切换 */
export const REFLOW = Easing.bezier(0.6, 0, 0.12, 1);

export const COLOR_DUR = 11;
const COLOR = Easing.bezier(0.45, 0, 0.55, 1);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  w: lerp(a.w, b.w, t),
  h: lerp(a.h, b.h, t),
  r: lerp(a.r, b.r, t),
});

/** 第 i 张卡片在第 f 帧：处在哪两种布局之间、走到了多少 */
export const cardState = (f: number, i: number) => {
  let from: LayoutName = 'HOOK';
  let to: LayoutName = 'HOOK';
  let p = 1;
  let pc = 1;
  for (const t of TRANS) {
    const start = t.at + t.order.indexOf(i) * t.stagger;
    if (f < t.at) break;
    from = to;
    to = t.to;
    const x = Math.min(1, Math.max(0, (f - start) / t.dur));
    p = REFLOW(x);
    // 颜色（深 ↔ 浅、实心 ↔ 线框）换得比位置快：避免中途出现发灰的半透明卡片
    pc = COLOR(Math.min(1, Math.max(0, (f - start) / COLOR_DUR)));
  }
  if (from === to) p = pc = 1;
  return {from, to, p, pc, rect: lerpRect(LAYOUTS[from][i], LAYOUTS[to][i], p)};
};
