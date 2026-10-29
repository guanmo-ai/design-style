import {Easing} from 'remotion';
export type Rect = {x: number; y: number; w: number; h: number; r: number};
export type Placed = {rects: (Rect | null)[]; heights: number[]; col: number[]};
export type Spec = {x0: number; y0: number; cols: number; colW: number; gap: number; r: number; extra?: number; count?: number};
export const masonry = (ITEMS: readonly {ratio: number}[], {x0, y0, cols, colW, gap, r, extra = 0, count = ITEMS.length}: Spec): Placed => {
  const heights = Array(cols).fill(0);
  const rects: (Rect | null)[] = [];
  const col: number[] = [];
  ITEMS.forEach((it, i) => {
    if (i >= count) {
      rects.push(null);
      col.push(-1);
      return;
    }
    let c = 0;
    for (let k = 1; k < cols; k++) if (heights[k] < heights[c] - 0.5) c = k;
    const h = Math.round(colW * it.ratio + extra);
    rects.push({x: x0 + c * (colW + gap), y: y0 + heights[c], w: colW, h, r});
    col.push(c);
    heights[c] += h + gap;
  });
  return {rects, heights, col};
};

export const FLOW = Easing.bezier(0.62, 0, 0.1, 1);
/** 落下：先加速（重力），在 70% 处落地，再轻轻弹一下 */
export const dropEase = (t: number) => {
  if (t <= 0) return 0;
  if (t < 0.7) return (t / 0.7) ** 2;
  if (t >= 1) return 1;
  const u = (t - 0.7) / 0.3;
  return 1 - 0.045 * Math.sin(Math.PI * u) * (1 - u * 0.3);
};

export type Layout = {rects: (Rect | null)[]; clip: Rect; heights?: number[]};
export type FlowTransition<N extends string> = {at: number; to: N; dur: number; stagger: number; order: 'index' | 'x' | 'y'; ease: 'flow' | 'drop'; clipIn?: number};
export type FlowState<N extends string, T extends string> = {rect: Rect; o: number; clip: Rect; from: T; to: T; pc: number; p: number; name: N};
export const createLayoutFlow = <Name extends string, ThemeName extends string>({
  layouts: LAYOUTS, transitions: TRANS, itemCount, themeOf, drift, bounds: BIG,
  emptyRect = {x: 960, y: -400, w: 100, h: 100, r: 20}, emptyName, emptyTheme,
  colorDuration: COLOR_DUR = 12, colorEase: COLOR = Easing.bezier(0.45, 0, 0.55, 1),
}: {
  layouts: Record<string, Layout>; transitions: FlowTransition<Name>[]; itemCount: number;
  themeOf: (name: Name) => ThemeName; drift: (name: Name, frame: number) => number;
  bounds: Rect; emptyRect?: Rect; emptyName: Name; emptyTheme: ThemeName;
  colorDuration?: number; colorEase?: (x: number) => number;
}) => {
  type Trans = FlowTransition<Name>;
  type State = FlowState<Name, ThemeName>;
const rankOf = (t: Trans): number[] => {
  const rects = LAYOUTS[t.to].rects;
  const idx = Array.from({length: itemCount}, (_, i) => i);
  const key = (i: number) => {
    const r = rects[i];
    if (t.order === 'index' || !r) return i;
    return t.order === 'x' ? r.x * 10 + r.y * 0.01 : r.y * 10 + r.x * 0.01;
  };
  const sorted = [...idx].sort((a, b) => key(a) - key(b));
  const rank: number[] = [];
  sorted.forEach((i, k) => (rank[i] = k));
  return rank;
};
const RANKS = TRANS.map(rankOf);

const same = (a: Rect | null, b: Rect | null) => (!a && !b) || (!!a && !!b && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h && a.r === b.r);
const prevName = (k: number): Name => (k === 0 ? emptyName : TRANS[k - 1].to);
// 这次转场有没有动到第 i 张（位置、可见性或主题变了）
const AFFECTS = TRANS.map((t, k) => Array.from({length: itemCount}, (_, i) => !same(LAYOUTS[prevName(k)].rects[i], LAYOUTS[t.to].rects[i]) || themeOf(prevName(k)) !== themeOf(t.to)));

const startOf = (k: number, i: number) => TRANS[k].at + RANKS[k][i] * TRANS[k].stagger;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t), r: lerp(a.r, b.r, t)});

const target = (n: Name, i: number, f: number): Rect | null => {
  const r = LAYOUTS[n].rects[i];
  return r ? {...r, y: r.y + drift(n, f)} : null;
};

/** 第 i 张卡片在第 f 帧的状态（只看前 upto 次转场）；转场被打断时，从“当时所在的位置”接着走 */
const stateAt = (f: number, i: number, upto: number): State => {
  let k = -1;
  for (let j = upto - 1; j >= 0; j--) {
    if (AFFECTS[j][i] && f >= startOf(j, i)) {
      k = j;
      break;
    }
  }
  if (k < 0) return {rect: emptyRect, o: 0, clip: BIG, from: emptyTheme, to: emptyTheme, pc: 1, p: 1, name: emptyName};
  const t = TRANS[k];
  const s = startOf(k, i);
  const prev = stateAt(s, i, k);
  const x = Math.min(1, Math.max(0, (f - s) / t.dur));
  const p = t.ease === 'drop' ? dropEase(x) : FLOW(x);
  const pc = COLOR(Math.min(1, Math.max(0, (f - s) / COLOR_DUR)));
  const to = target(t.to, i, f);
  let a = prev.rect;
  let b = to ?? {...prev.rect, y: prev.rect.y - 70};
  let oa = prev.o;
  let ob = to ? 1 : 0;
  if (to && prev.o < 0.01) {
    // 从无到有：落下（从画面上方掉进来）或淡入（从下方浮上来）
    a = t.ease === 'drop' ? {...to, y: -to.h - 80} : {...to, y: to.y + 70};
    oa = t.ease === 'drop' ? 1 : 0;
  }
  const po = t.ease === 'drop' ? 1 : Math.min(1, Math.max(0, (f - s) / (t.dur * 0.5)));
  return {
    rect: lerpRect(a, b, p),
    o: lerp(oa, ob, po),
    clip: lerpRect(prev.clip, LAYOUTS[t.to].clip, t.clipIn ? Math.min(1, (f - t.at) / t.clipIn) : Math.min(1, p * 1.6)), // 裁切框比卡片先到位：卡片像倒进屏幕里
    from: themeOf(prev.name),
    to: themeOf(t.to),
    pc,
    p,
    name: t.to,
  };
};

const tileState = (f: number, i: number) => stateAt(f, i, TRANS.length);
return {tileState, startOf};
};
