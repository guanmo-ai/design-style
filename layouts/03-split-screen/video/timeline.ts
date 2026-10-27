/**
 * 布局 03 · Split Screen —— 时间轴（帧）。120 BPM，1 拍 = 30 帧，全片 40 拍 = 1200 帧（20 秒）。
 * 章节之间用“反向传送带”换幕：中线不动，左半向上、右半向下同时滑走（最快的一刻 = 章节起点 = 拍点）。
 * 每章的 f 都是“本章局部帧”：f = 0 正好落在拍点上；传送带从 −PRE 开始、到 POST 结束。
 */
export const BEAT = 30;
export const DURATION = 1200;

/** 传送带：章节起点前 PRE 帧开始滑，起点后 POST 帧落定（共 PRE + POST = 30 帧，一拍）；落定（p ≥ 0.98）正好在章节起点 = 拍点 */
export const PRE = 24;
export const POST = 6;

export const CH = [
  {id: 'intro', at: 0, beats: 5, label: '定义', en: 'Definition', rule: 1},
  {id: 'history', at: 150, beats: 6, label: '来历', en: 'Origin', rule: 0},
  {id: 'ratio', at: 330, beats: 7, label: '比例', en: 'Ratio', rule: 2},
  {id: 'contrast', at: 540, beats: 5, label: '反差', en: 'Contrast', rule: 3},
  {id: 'scroll', at: 690, beats: 6, label: '滚动', en: 'Scroll', rule: 4},
  {id: 'resp', at: 870, beats: 6, label: '响应式', en: 'Responsive', rule: 5},
  {id: 'end', at: 1050, beats: 5, label: '片尾', en: 'End', rule: 0},
] as const;
export type ChId = (typeof CH)[number]['id'];
export const AT = Object.fromEntries(CH.map((c) => [c.id, c.at])) as Record<ChId, number>;
