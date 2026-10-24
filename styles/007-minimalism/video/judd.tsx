/**
 * 007 · Minimalism —— 04 重复 8.0–10.0s（f480–600）
 *   8.0–9.1s   机身压成的那个盒子是第一个；其余九个一个十六分音符一个从墙里推出来（上行的马林巴），点一格一格往上跳
 *   9.25–9.9s  点往下跳回中间那一格，经过的盒子一个个被敲亮（下行的应答）；视点慢慢抬高，盒子的顶面变成底面
 *   9.75–10s   交棒：九个盒子缩回墙里，中间那一个留下来，变成下一幕的手机
 * 一点透视：每个盒子的正面是矩形，背面朝灭点缩 q 倍；盒高 = 间距（贾德的规矩）
 */
import React from 'react';
import {E, SNAP, spr, tween} from '../../../src/lib/anim';
import {C, LINE} from '../tokens';
import {juddFirst} from './radio';
import {Dot, lerp, n2, P, quad, Txt, vis} from './ui';

export const N = 10;
const UH = juddFirst.h;
const UW = juddFirst.w;
const UX = juddFirst.x;
const uy = (i: number) => juddFirst.y - i * UH * 2;
export const UNIT_TIMES = Array.from({length: N}, (_, i) => 480 + i * 7.5);
export const KEEP = 4; // 留下来变成手机的那一格
const DOWN_AT = 555;
/** 往下跳：9 → 4，一个十六分音符一格 */
export const DOWN_TIMES = Array.from({length: N - 1 - KEEP}, (_, i) => DOWN_AT + i * 7.5);
export const RETRACT = 585;
export const PHONE_AT = 600;

/** 灭点：视点从下往上慢慢抬，同时向右挪一点（像摄影机升降） */
const vp = (f: number) => {
  const t = tween(f, 478, 122, 0, 1, E.inOut);
  return {x: lerp(840, 1010, t), y: lerp(860, 300, t)};
};
const Q = 0.84;

type V2 = [number, number];
const toVP = (p: V2, v: {x: number; y: number}, q: number): V2 => [v.x + (p[0] - v.x) * q, v.y + (p[1] - v.y) * q];

/** 第 i 个盒子：从墙里推出来的进度 out（0 = 贴在墙上，1 = 推到位） */
const Unit: React.FC<{f: number; i: number; out: number; lit: number; q?: number}> = ({f, i, out, lit, q = Q}) => {
  const v = vp(f);
  const y0 = uy(i);
  const F: V2[] = [
    [UX, y0],
    [UX + UW, y0],
    [UX + UW, y0 + UH],
    [UX, y0 + UH],
  ];
  const B = F.map((p) => toVP(p, v, q));
  // 推出来：正面从背面的位置往前走
  const Fm = F.map((p, k) => [lerp(B[k][0], p[0], out), lerp(B[k][1], p[1], out)] as V2);
  const faces: React.ReactNode[] = [];
  const S = {stroke: C.ink, strokeWidth: LINE.note, strokeLinejoin: 'round' as const, vectorEffect: 'non-scaling-stroke' as const};
  // 顶面（盒子在视线以下）或底面（在视线以上）
  if (v.y < y0) faces.push(<path key="t" d={quad([B[0], B[1], Fm[1], Fm[0]])} fill={C.stone} {...S} />);
  if (v.y > y0 + UH) faces.push(<path key="b" d={quad([Fm[3], Fm[2], B[2], B[3]])} fill={C.grey} {...S} />);
  // 侧面：灭点在左边 → 看得见左侧面
  if (v.x < UX) faces.push(<path key="l" d={quad([B[0], Fm[0], Fm[3], B[3]])} fill={C.greyDk} {...S} />);
  if (v.x > UX + UW) faces.push(<path key="r" d={quad([Fm[1], B[1], B[2], Fm[2]])} fill={C.greyDk} {...S} />);
  const front = lit > 0.001 ? mix(C.ink, C.paperHi, lit) : C.ink;
  faces.push(<path key="f" d={quad(Fm)} fill={front} {...S} />);
  return <g>{faces}</g>;
};
/** 盒子投在墙上的影子（光从左上来）：背面 + 背面往右下挪一段，连成六边形 */
const Shadow: React.FC<{f: number; i: number; out: number}> = ({f, i, out}) => {
  const v = vp(f);
  const y0 = uy(i);
  const B = (
    [
      [UX, y0],
      [UX + UW, y0],
      [UX + UW, y0 + UH],
      [UX, y0 + UH],
    ] as V2[]
  ).map((p) => toVP(p, v, Q));
  const o: V2 = [26 * out, 30 * out];
  const add = (p: V2): V2 => [p[0] + o[0], p[1] + o[1]];
  const pts = [B[0], B[1], add(B[1]), add(B[2]), add(B[3]), B[3]];
  return <path d={'M' + pts.map(([x, y]) => `${n2(x)} ${n2(y)}`).join('L') + 'Z'} fill={C.ink} opacity={0.07} />;
};

/** 左边一个大数字：×1 → ×10（和 02 的 48 → 1 正好相反）；九个缩回墙里时又一路减回 ×1 */
const Count: React.FC<P> = ({f}) => {
  const o = vis(f, 482, PHONE_AT - 2, 10, 8);
  if (o <= 0.001) return null;
  let n = 1;
  for (let i = 1; i < N; i++) {
    if (f >= UNIT_TIMES[i] && !(f >= RETRACT + Math.abs(i - KEEP) * 1.5 + 6)) n++;
  }
  return (
    <g opacity={o < 1 ? n2(o) : undefined}>
      <Txt x={112} y={700} k="d100" size={230} ls={-0.02}>
        {`×${n}`}
      </Txt>
      <Txt x={120} y={756} k="sc300" size={26} ls={0.12} c={C.greyDk}>
        {n > 1 ? '个一模一样的盒子' : '个盒子'}
      </Txt>
    </g>
  );
};
const mix = (a: string, b: string, t: number) => {
  const h = (s: string) => [1, 3, 5].map((k) => parseInt(s.slice(k, k + 2), 16));
  const A = h(a);
  const B = h(b);
  return `rgb(${A.map((v, k) => Math.round(lerp(v, B[k], t))).join(',')})`;
};

/** 点：上行时站在最新的那一格；下行时一格一格跳回第 KEEP 格 */
const dotJudd = (f: number) => {
  const cx = UX + UW / 2;
  const cy = (i: number) => uy(i) + UH / 2;
  let i0 = 0;
  let i1 = 0;
  let t = 1;
  if (f < DOWN_AT - 4) {
    // 上行：盒子一推出来，点就跳上去
    const k = Math.min(N - 1, Math.max(0, Math.floor((f - 480) / 7.5)));
    i0 = Math.max(0, k - 1);
    i1 = k;
    t = k === 0 ? 1 : tween(f, UNIT_TIMES[k], 6, 0, 1, E.out);
  } else {
    // 下行：提前 4 帧起跳，正好落在十六分音符上
    const k = Math.min(DOWN_TIMES.length, Math.floor((f - (DOWN_AT - 4)) / 7.5) + 1);
    i0 = N - k;
    i1 = N - 1 - k;
    t = tween(f, DOWN_TIMES[k - 1] - 4, 4, 0, 1, E.inOut);
  }
  const y = lerp(cy(i0), cy(i1), t) - Math.sin(Math.PI * t) * 26;
  return {x: cx, y};
};
export {dotJudd};

/** 盒高 = 间距：右边一根标尺 */
const Ruler: React.FC<P> = ({f}) => {
  const o = vis(f, 520, RETRACT - 6, 16, 10);
  if (o <= 0.001) return null;
  const x = UX + UW + 64;
  const top = uy(N - 1);
  const bot = uy(0) + UH;
  const p = tween(f, 520, 30, 0, 1, E.out);
  return (
    <g opacity={o < 1 ? n2(o) : undefined}>
      <line x1={x} y1={bot} x2={x} y2={n2(lerp(bot, top, p))} stroke={C.ink} strokeWidth={LINE.note} />
      {Array.from({length: N * 2}, (_, k) => {
        const y = bot - k * UH;
        if (y < lerp(bot, top, p) - 0.5) return null;
        return <line key={k} x1={x - 6} y1={y} x2={x + 6} y2={y} stroke={C.ink} strokeWidth={LINE.note} />;
      })}
      <line x1={x - 6} y1={top} x2={x + 6} y2={top} stroke={C.ink} strokeWidth={LINE.note} opacity={p >= 1 ? 1 : 0} />
      <Txt x={x + 22} y={uy(KEEP) + 6} k="mono" size={14} ls={0.16} c={C.greyDk} o={tween(f, 540, 12)}>
        H = GAP
      </Txt>
      <Txt x={x + 22} y={uy(KEEP) + 30} k="sc300" size={18} ls={0.1} c={C.greyDk} o={tween(f, 544, 12)}>
        盒高 = 间距
      </Txt>
      <Txt x={x + 22} y={uy(N - 1) + UH} k="mono" size={14} ls={0.16} c={C.greyDk} o={tween(f, 546, 12)}>
        × 10
      </Txt>
    </g>
  );
};

const Captions: React.FC<P> = ({f}) => {
  const s = (at: number) => vis(f, at, RETRACT + 4, 14, 10);
  return (
    <g>
      <Txt x={120} y={172} k="sc300" size={46} ls={0.08} o={s(506)}>
        同一个形状，重复十次。
      </Txt>
      <Txt x={120} y={218} k="t300" size={24} ls={0.01} c={C.greyDk} o={s(514)}>
        What you see is what you see. — Frank Stella
      </Txt>
      <Txt x={1800} y={150} k="mono" size={14} ls={0.18} c={C.greyDk} anchor="end" o={s(520)}>
        AFTER DONALD JUDD · STACK · 1967
      </Txt>
    </g>
  );
};

/** 十个盒子都推到位的样子（回顾里缩成小图用） */
export const JuddStatic: React.FC = () => (
  <g>
    {Array.from({length: N}, (_, i) => (
      <Unit key={i} f={560} i={i} out={1} lit={0} />
    ))}
  </g>
);

/** 中间那一格在 f 帧的正面（today.tsx 从 PHONE_AT 起接手） */
export const keepFront = () => ({x: UX, y: uy(KEEP), w: UW, h: UH});
export const keepDot = () => ({x: UX + UW / 2, y: uy(KEEP) + UH / 2});

export const Judd: React.FC<P> = ({f}) => {
  // 下行时，点落到哪一格，哪一格就亮一下
  const litAt = (i: number) => {
    const hit = (t: number, k: number) => (f >= t ? k * Math.exp(-(f - t) / 7) : 0);
    let l = 0;
    DOWN_TIMES.forEach((t, k) => {
      if (N - 2 - k === i) l = Math.max(l, hit(t, 1));
    });
    if (i > 0) l = Math.max(l, hit(UNIT_TIMES[i] + 5, 0.55));
    return l;
  };
  const d = dotJudd(f);
  const outOf = (i: number) => {
    let out = i === 0 ? tween(f, 480, 14, 0, 1, E.out) : spr(f, UNIT_TIMES[i], SNAP, 22);
    if (i !== KEEP) out *= 1 - tween(f, RETRACT + Math.abs(i - KEEP) * 1.5, 10, 0, 1, E.in);
    return out;
  };
  return (
    <g>
      <Count f={f} />
      <Ruler f={f} />
      {Array.from({length: N}, (_, i) => {
        const out = outOf(i);
        if (out <= 0.01 || (f >= PHONE_AT && i === KEEP)) return null;
        return <Shadow key={`s${i}`} f={f} i={i} out={out} />;
      })}
      {Array.from({length: N}, (_, i) => {
        if (f >= PHONE_AT && i === KEEP) return null;
        let out = i === 0 ? 1 : spr(f, UNIT_TIMES[i], SNAP, 22);
        if (i !== KEEP) out *= 1 - tween(f, RETRACT + Math.abs(i - KEEP) * 1.5, 10, 0, 1, E.in);
        if (out <= 0.01) return null;
        // 第一个盒子是收音机压成的：正面已经在那儿，只是厚度从 0 长出来
        const q = i === 0 ? lerp(1, Q, tween(f, 480, 14, 0, 1, E.out)) : Q;
        return <Unit key={i} f={f} i={i} out={out} lit={litAt(i)} q={q} />;
      })}
      {f < PHONE_AT && <Dot x={d.x} y={d.y} r={11} />}
      <Captions f={f} />
    </g>
  );
};
