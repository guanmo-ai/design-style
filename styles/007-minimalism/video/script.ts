/**
 * 007 · Minimalism —— 六改高密度分镜（先于画面）
 *
 *   少 = 删到只剩有用的
 *   Less, but better.
 *
 * 不是五改换皮。五改是「堆满 → 慢删 6 秒 → 干产品框」。
 * 六改学 Swiss 红色接力 + Bento 七卡八局：同屏先炸，五种落地并行，
 * 每 1–1.2 秒换一种动效语法。原则用画面教，不用大字卡干晾。
 *
 * 对照标杆（开场密度 / 方案种类 / 动效种类）：
 *   Swiss 15s：开场 72 格同时闪 · 5 种版式重排 · 波/重排/甩镜/套印/扎镜头/铺满
 *   Bento 15s：7 卡同屏 · 8 种布局 · stagger 落拍 / POP / 镜头交棒 / 主题换皮
 *   本片 24s：开场 ≥16 可辨元素同时在动 · 5 种落地 · ≥8 种动效语法
 */
export const THESIS = {
  zh: '少 = 删到只剩有用的',
  en: 'Less, but better.',
  de: 'Weniger, aber besser.',
};

export type Cell = {
  id: 'blast' | 'split' | 'app' | 'web' | 'pay' | 'data' | 'vs' | 'bone' | 'hold' | 'end';
  at: number;
  dur: number;
  zh: string;
  line: string;
  en: string;
  /** 同屏可辨元素数（峰值） */
  n: number;
  /** 这一格的动效招式 */
  move: string;
};

/** 10 格。每格：同屏元素数 + 动效招式 + 设计原则。 */
export const CELLS: Cell[] = [
  {
    id: 'blast',
    at: 0,
    dur: 180,
    zh: '开场炸',
    line: '先看见多余的，才知道要删什么。',
    en: 'See the excess first.',
    n: 16,
    move: '18 件 spring 过冲落拍 + 错峰喊一声 + snap zoom 扎进噪音',
  },
  {
    id: 'split',
    at: 180,
    dur: 120,
    zh: '五种落地',
    line: '同一条原则，五种方案同时摊开。',
    en: 'One rule, five landings.',
    n: 21,
    move: '碎片变形接力裂成 5 窗（App/Web/Pay/数据/海报）· Bento 裂卡',
  },
  {
    id: 'app',
    at: 300,
    dur: 108,
    zh: 'App',
    line: '列表只留此刻：一行、一开关。',
    en: 'One row, one control.',
    n: 12,
    move: '镜头 snap 进手机 · 行 stagger 下落拍 · 开关 POP',
  },
  {
    id: 'web',
    at: 408,
    dur: 108,
    zh: 'Web',
    line: '一页一件事：一栏标题、一个 CTA。',
    en: 'One column, one CTA.',
    n: 14,
    move: '横幅/侧栏/空卡折叠收起 · CTA 底边一笔橙',
  },
  {
    id: 'pay',
    at: 516,
    dur: 108,
    zh: '确认',
    line: '确认只问一次：一金额、一按钮。',
    en: 'One amount, one button.',
    n: 9,
    move: '费用/兑换码/条款吸进金额 · 按钮 bang',
  },
  {
    id: 'data',
    at: 624,
    dur: 108,
    zh: '数据卡',
    line: '数字也要少：一张卡、一个数。',
    en: 'One card, one number.',
    n: 10,
    move: '八张火花卡对齐网格再折成一个 KPI',
  },
  {
    id: 'vs',
    at: 732,
    dur: 120,
    zh: '坏例炸开',
    line: '花哨无焦点，极简有焦点。',
    en: 'Focus versus noise.',
    n: 18,
    move: '坏例碎片炸开 → 真空吸进橙点',
  },
  {
    id: 'bone',
    at: 852,
    dur: 156,
    zh: '骨架',
    line: '网格、字重、留白，才是删完之后剩下的。',
    en: 'Grid, weight, space.',
    n: 15,
    move: '栏线扫描 · 字重对切 · 空格测量 · 五方案贴回格子',
  },
  {
    id: 'hold',
    at: 1008,
    dur: 180,
    zh: '定妆',
    line: '少 = 删到只剩有用的。',
    en: 'Less, but better.',
    n: 8,
    move: '印刷海报构图定住：清单 + 47/1 + 虚线圆落到橙点',
  },
  {
    id: 'end',
    at: 1188,
    dur: 252,
    zh: '片尾',
    line: '@guanmo_ai',
    en: '@guanmo_ai',
    n: 5,
    move: '少即是多逐字升起 · 橙点涟漪 · 署名落拍',
  },
];

export const BEATS = CELLS;

export const LINES = CELLS.map((c) => c.line);

/** 开场 18 件：控件 / 色块 / 字重 / 装饰 / 坏例碎片。每件只喊一次。 */
export const BLAST_N = 18;

/** 五种落地方案（并行展示，不是一条直线删完） */
export const SCHEMES = ['App 列表', 'Web hero', '支付确认', '数据卡', '海报定妆'] as const;

/** 动效语法（每 1–1.2s 换一种，禁止长时间同一 pose） */
export const MOVES = [
  'spring 过冲落拍',
  '错峰喊 / stagger',
  'snap zoom',
  '裂卡变形接力',
  '行下落拍',
  '折叠收起',
  '真空吸入',
  '对齐网格',
  '字重对切',
  '色相只留一点橙',
  '坏例炸开再吸回',
  '逐字升起',
] as const;
