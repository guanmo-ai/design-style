/**
 * 007 · Minimalism —— 分镜剧本（先于画面，全片只讲一件事）
 *
 *   少 = 删到只剩有用的
 *   Less, but better. · Weniger, aber besser.
 *
 * 八句，一句一幕。观众看完要能复述这八句，而不是「好像在动」。
 */
export const THESIS = {
  zh: '少 = 删到只剩有用的',
  en: 'Less, but better.',
  de: 'Weniger, aber besser.',
};

/** 过程分镜：每格一句原则 */
export const LINES = [
  '先看见多余的，才知道要删什么。',
  '每删一下，必须说清为什么。',
  '删完之后，网格、字重、留白才露出来。',
  '同一条原则进 App：列表删成一行、一主按钮。',
  '同一条原则进 Web：一栏标题、一个 CTA。',
  '同一条原则进确认：一金额、一按钮。',
  '花哨无焦点，极简有焦点。',
  '少 = 删到只剩有用的。',
] as const;

export type Beat = {
  id: 'pile' | 'cut' | 'bone' | 'app' | 'web' | 'pay' | 'vs' | 'poster' | 'end';
  at: number;
  dur: number;
  zh: string;
  line: string;
  en: string;
};

/** 24.0s · 1440 帧 · 120 BPM。每幕一句。片尾是定妆句的署名，不另占一句。 */
export const BEATS: Beat[] = [
  {id: 'pile', at: 0, dur: 132, zh: '堆满', line: LINES[0], en: 'See the excess first.'},
  {id: 'cut', at: 132, dur: 348, zh: '一次删一个', line: LINES[1], en: 'Cut with a reason.'},
  {id: 'bone', at: 480, dur: 180, zh: '留下骨架', line: LINES[2], en: 'The skeleton appears.'},
  {id: 'app', at: 660, dur: 132, zh: 'App', line: LINES[3], en: 'One row, one control.'},
  {id: 'web', at: 792, dur: 132, zh: 'Web', line: LINES[4], en: 'One column, one CTA.'},
  {id: 'pay', at: 924, dur: 132, zh: '确认', line: LINES[5], en: 'One amount, one button.'},
  {id: 'vs', at: 1056, dur: 120, zh: '坏例对照', line: LINES[6], en: 'Focus versus noise.'},
  {id: 'poster', at: 1176, dur: 108, zh: '定妆', line: LINES[7], en: 'Less, but better.'},
  {id: 'end', at: 1284, dur: 156, zh: '片尾', line: '@guanmo_ai', en: '@guanmo_ai'},
];

export type CutCat = 'promo' | 'color' | 'button' | 'deco' | 'last';

/** 五次有目的的删：先出「为什么」，再按类删，不是随机飞。 */
export const CUTS: {at: number; cat: CutCat; kicker: string; why: string; en: string}[] = [
  {at: 132, cat: 'promo', kicker: '01  删 促销', why: '不是功能，是噪音', en: 'NOISE, NOT FUNCTION'},
  {at: 204, cat: 'color', kicker: '02  删 第二色', why: '颜色只标一件事', en: 'ONE COLOR, ONE JOB'},
  {at: 276, cat: 'button', kicker: '03  删 重复入口', why: '一件事一个入口', en: 'ONE TASK, ONE DOOR'},
  {at: 348, cat: 'deco', kicker: '04  删 装饰', why: '好看但用不上', en: 'PRETTY IS NOT USEFUL'},
  {at: 420, cat: 'last', kicker: '05  删到一个点', why: '删到不能再删', en: 'STOP WHEN IT BREAKS'},
];

export const BONE = {
  grid: {at: 480, why: '对齐是看不见的秩序', en: 'ALIGN TO A GRID'},
  weight: {at: 540, why: '粗细差就是层级', en: 'WEIGHT IS HIERARCHY'},
  space: {at: 600, why: '空也是内容', en: 'EMPTY IS CONTENT'},
};

export const INTO = {
  app: {why: '列表只留此刻', en: 'ONE ROW, ONE CONTROL'},
  web: {why: '一页一件事', en: 'ONE COLUMN, ONE CTA'},
  pay: {why: '确认只问一次', en: 'ONE AMOUNT, ONE BUTTON'},
};
