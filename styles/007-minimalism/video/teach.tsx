/**
 * 007 · Minimalism —— 非极简讲解幕
 *   1.8–6.0s  示意：字重对比、测量线、留白填色闪退、网格显现、元素飞走、before→after
 *  18.4–21.0s 对照：App / Web / 确认三容器并排，箭头标注「同一套语言」
 * 这里故意不极简——对标 Swiss / Bento 的信息密度，用动效把「少即是多」讲清楚。
 */
import React from 'react';
import {E, POP, SNAP, SMOOTH, spr, tween} from '../../../src/lib/anim';
import {C, LINE} from '../tokens';
import {AT} from './timeline';
import {Dot, Hair, Leader, lerp, n2, P, Txt, vis, World, camTrack, Cam2} from './ui';
import {CENTER} from './opening';

export const W_AT = 120;
export const FLASH_AT = 150;
export const GRID_AT = 174;
export const BEFORE_AT = 198;
export const ARROW_AT = 216;
export const CUT_AT = 228;
export const AFTER_AT = 252;
export const SPLIT_AT = 276;
export const ACCENT_AT = 306;
export const TEACH_OUT = 336;

export const REC_IN = AT.recap;
export const REC_ARROWS = AT.recap + 30;
export const REC_PULSE = AT.recap + 60;
export const REC_OUT = AT.recap + 120;

const COLS = [240, 640, 1040, 1440, 1680];
const ROWS = [220, 400, 580, 760, 900];

export const camTeach = (f: number): Cam2 =>
  camTrack(f, [
    [AT.teach, {ox: 960, oy: 540, s: 1}],
    [W_AT + 8, {ox: 720, oy: 480, s: 1.08}],
    [FLASH_AT, {ox: 960, oy: 540, s: 1.02}],
    [BEFORE_AT, {ox: 1080, oy: 500, s: 1.1}],
    [SPLIT_AT, {ox: 960, oy: 520, s: 1.06}],
    [ACCENT_AT, {ox: 960, oy: 540, s: 1.16}],
    [AT.app - 4, {ox: 960, oy: 540, s: 1}],
  ]);

const Dim: React.FC<{p: number; x: number; y1: number; y2: number; lab: string}> = ({p, x, y1, y2, lab}) => {
  if (p <= 0.001) return null;
  const mid = (y1 + y2) / 2;
  return (
    <g opacity={n2(p)}>
      <Hair x1={x} y1={y1} x2={x} y2={lerp(y1, y2, p)} w={1} c={C.accent} />
      <line x1={x - 6} y1={y1} x2={x + 6} y2={y1} stroke={C.accent} strokeWidth={1} />
      <line x1={x - 6} y1={n2(lerp(y1, y2, p))} x2={x + 6} y2={n2(lerp(y1, y2, p))} stroke={C.accent} strokeWidth={1} />
      <Txt x={x + 12} y={mid + 5} k="mono" size={13} ls={0.08} c={C.accent}>
        {lab}
      </Txt>
    </g>
  );
};

const Weights: React.FC<P> = ({f}) => {
  const rows: [string, 'd100' | 't300' | 't500', number, string][] = [
    ['Aa  100', 'd100', 84, '标题越薄'],
    ['Aa  300', 't300', 36, '正文只此'],
    ['Aa  500', 't500', 18, '注释更小'],
  ];
  return (
    <g>
      {rows.map(([lab, k, sz, note], i) => {
        const at = W_AT + i * 8;
        const o = vis(f, at, FLASH_AT + 6, 8, 10);
        const dy = (1 - spr(f, at, POP, 16)) * 28;
        const y = 300 + i * 110;
        return (
          <g key={lab} opacity={n2(o)} transform={`translate(0 ${n2(dy)})`}>
            <Txt x={200} y={y} k={k} size={sz}>
              Aa
            </Txt>
            <Txt x={420} y={y} k="mono" size={16} ls={0.12} c={C.greyDk}>
              {lab}
            </Txt>
            <Txt x={420} y={y + 28} k="sc300" size={18} c={C.grey}>
              {note}
            </Txt>
            <Dim p={tween(f, at + 4, 10)} x={180} y1={y - sz * 0.78} y2={y + 6} lab={`${sz}`} />
          </g>
        );
      })}
    </g>
  );
};

const Flash: React.FC<P> = ({f}) => {
  const boxes: [number, number, number, number, string][] = [
    [200, 220, 720, 200, C.accent],
    [980, 220, 720, 200, C.stone],
    [200, 480, 720, 320, C.shade],
    [980, 480, 720, 320, C.accent],
  ];
  return (
    <g>
      {boxes.map(([x, y, w, h, c], i) => {
        const inn = tween(f, FLASH_AT + i * 5, 8, 0, 1, E.out);
        const out = tween(f, FLASH_AT + 28 + i * 3, 10, 0, 1, E.in);
        const p = inn * (1 - out);
        if (p <= 0.001) return null;
        return <rect key={i} x={x} y={y} width={w} height={h} fill={c} opacity={n2(0.22 * p)} />;
      })}
      <Txt x={200} y={196} k="mono" size={14} ls={0.16} c={C.accent} o={vis(f, FLASH_AT, GRID_AT, 6, 8)}>
        留白也是材料 · 填一下再退
      </Txt>
    </g>
  );
};

const Grid: React.FC<P> = ({f}) => {
  const o = vis(f, GRID_AT, BEFORE_AT + 8, 10, 10);
  if (o <= 0.001) return null;
  return (
    <g opacity={n2(0.55 * o)}>
      {COLS.map((x, i) => (
        <Hair key={`c${x}`} x1={x} y1={180} x2={x} y2={lerp(180, 900, tween(f, GRID_AT + i * 3, 12))} />
      ))}
      {ROWS.map((y, i) => (
        <Hair key={`r${y}`} x1={200} y1={y} x2={lerp(200, 1720, tween(f, GRID_AT + 6 + i * 2, 10))} y2={y} />
      ))}
      <Txt x={200} y={168} k="mono" size={14} ls={0.16} c={C.greyDk}>
        4 × 4 · 只在讲解里出现
      </Txt>
    </g>
  );
};

type Junk = {t: string; x: number; y: number; rot: number};
const JUNK: Junk[] = [
  {t: 'SALE', x: 520, y: 340, rot: -8},
  {t: 'NEW!', x: 860, y: 300, rot: 6},
  {t: '限时', x: 1200, y: 360, rot: -4},
  {t: 'VIP', x: 640, y: 520, rot: 10},
  {t: '!!!', x: 980, y: 500, rot: -12},
  {t: '50%', x: 1320, y: 540, rot: 5},
  {t: 'HOT', x: 560, y: 700, rot: 8},
  {t: '点击', x: 1100, y: 720, rot: -6},
];

const JunkCloud: React.FC<P> = ({f}) => {
  return (
    <g>
      {JUNK.map((j, i) => {
        const inn = spr(f, BEFORE_AT + i * 2, POP, 14);
        const cut = spr(f, CUT_AT + i * 2, SNAP, 16);
        if (inn <= 0.01 && f < BEFORE_AT) return null;
        const fly = cut;
        const x = j.x + (i % 2 === 0 ? -1 : 1) * 420 * fly;
        const y = j.y - 80 * fly;
        const s = inn * (1 - fly);
        if (s <= 0.01) return null;
        return (
          <g key={j.t} transform={`translate(${n2(x)} ${n2(y)}) rotate(${n2(j.rot * (1 - fly))}) scale(${n2(s)})`} opacity={n2(1 - fly)}>
            <rect x={-70} y={-28} width={140} height={52} rx={6} fill={C.ink} />
            <Txt x={0} y={8} k="t500" size={22} c={C.paperHi} anchor="middle">
              {j.t}
            </Txt>
          </g>
        );
      })}
    </g>
  );
};

const Arrows: React.FC<P> = ({f}) => {
  const o = vis(f, ARROW_AT, AFTER_AT, 8, 8);
  if (o <= 0.001) return null;
  const p = spr(f, ARROW_AT, POP, 16);
  return (
    <g opacity={n2(o)}>
      <Leader x={860} y={500} kx={1040} ky={240} ex={1180} p={p} c={C.accent} />
      <Txt x={1190} y={246} k="sc400" size={28} ls={0.08} c={C.accent} o={p}>
        删
      </Txt>
      <Leader x={640} y={520} kx={400} ky={240} ex={280} p={p} c={C.ink} />
      <Txt x={200} y={246} k="mono" size={16} ls={0.12} o={p}>
        BEFORE
      </Txt>
    </g>
  );
};

const AfterDot: React.FC<P> = ({f}) => {
  const o = vis(f, AFTER_AT, SPLIT_AT + 8, 8, 8);
  if (o <= 0.001) return null;
  const s = spr(f, AFTER_AT, POP, 18);
  return (
    <g opacity={n2(o)}>
      <rect x={560} y={260} width={800} height={560} rx={8} fill="none" stroke={C.ink} strokeWidth={LINE.main} opacity={s} />
      <Dot x={960} y={540} r={16 * s} />
      <Txt x={960} y={820} k="sc300" size={32} ls={0.12} anchor="middle" o={s}>
        AFTER · 只剩一处
      </Txt>
    </g>
  );
};

const Split: React.FC<P> = ({f}) => {
  const p = spr(f, SPLIT_AT, SMOOTH, 22);
  const o = vis(f, SPLIT_AT, TEACH_OUT, 8, 10);
  if (o <= 0.001) return null;
  const wipe = tween(f, SPLIT_AT, 16, 0, 1, E.inOut);
  return (
    <g opacity={n2(o)}>
      <g transform={`translate(${n2((1 - p) * -80)} 0)`}>
        <rect x={140} y={220} width={760} height={640} rx={12} fill={C.paperHi} stroke={C.ink} strokeWidth={LINE.main} />
        <Txt x={180} y={280} k="mono" size={14} ls={0.14} c={C.greyDk}>
          BEFORE
        </Txt>
        {['SALE', 'VIP', '限时特惠', '点击这里', '50% OFF'].map((t, i) => (
          <Txt key={t} x={200 + (i % 2) * 280} y={360 + Math.floor(i / 2) * 90} k="t500" size={28}>
            {t}
          </Txt>
        ))}
      </g>
      <g transform={`translate(${n2((1 - p) * 80)} 0)`}>
        <rect x={1020} y={220} width={760} height={640} rx={12} fill={C.paperHi} stroke={C.ink} strokeWidth={LINE.main} />
        <Txt x={1060} y={280} k="mono" size={14} ls={0.14} c={C.greyDk}>
          AFTER
        </Txt>
        <Dot x={1400} y={540} r={16} />
        <Txt x={1400} y={780} k="sc300" size={28} ls={0.1} anchor="middle">
          少即是多
        </Txt>
      </g>
      <rect x={n2(952)} y={220} width={n2(16 * wipe)} height={640} fill={C.ink} />
    </g>
  );
};

const AccentCall: React.FC<P> = ({f}) => {
  const o = vis(f, ACCENT_AT, TEACH_OUT + 8, 8, 10);
  if (o <= 0.001) return null;
  const s = spr(f, ACCENT_AT, POP, 16);
  return (
    <g opacity={n2(o)}>
      <circle cx={960} cy={540} r={n2(48 * s)} fill="none" stroke={C.accent} strokeWidth={2} />
      <circle cx={960} cy={540} r={n2(72 * s)} fill="none" stroke={C.accent} strokeWidth={1} opacity={0.4} />
      <Leader x={1008} y={520} kx={1220} ky={360} ex={1480} p={s} c={C.accent} />
      <Txt x={1230} y={356} k="sc400" size={28} ls={0.08} c={C.accent} o={s}>
        一处强调
      </Txt>
      <Txt x={1230} y={396} k="t300" size={20} c={C.greyDk} o={s}>
        第二种颜色一出现，层级就塌。
      </Txt>
    </g>
  );
};

export const dotTeach = (f: number) => {
  const t0 = tween(f, AT.teach, 16, 0, 1, E.inOut);
  const tA = tween(f, AFTER_AT, 14, 0, 1, E.inOut);
  const tS = tween(f, SPLIT_AT, 16, 0, 1, E.inOut);
  const tC = tween(f, ACCENT_AT, 12, 0, 1, E.inOut);
  const tOut = tween(f, TEACH_OUT, 18, 0, 1, E.inOut);
  let x = lerp(CENTER.x, 200, t0 * (1 - tA));
  let y = lerp(CENTER.y, 300, t0 * (1 - tA));
  x = lerp(x, 960, tA);
  y = lerp(y, 540, tA);
  x = lerp(x, 1400, tS * (1 - tC));
  y = lerp(y, 540, tS * (1 - tC));
  x = lerp(x, 960, Math.max(tC, tOut));
  y = lerp(y, 540, Math.max(tC, tOut));
  return {x, y, r: 16};
};

const Captions: React.FC<P> = ({f}) => (
  <g>
    <Txt x={120} y={132} k="mono" size={16} ls={0.16} c={C.greyDk} o={vis(f, AT.teach, TEACH_OUT, 8, 8)}>
      讲解 · 这里不必极简
    </Txt>
    <Txt x={120} y={172} k="sc300" size={36} ls={0.06} o={vis(f, 112, W_AT + 20, 8, 8)}>
      先看它怎么少。
    </Txt>
    <Txt x={120} y={172} k="sc300" size={36} ls={0.06} o={vis(f, FLASH_AT, GRID_AT + 8, 8, 8)}>
      空，要能指回主体。
    </Txt>
    <Txt x={120} y={172} k="sc300" size={36} ls={0.06} o={vis(f, BEFORE_AT, AFTER_AT, 8, 8)}>
      删到不能再删。
    </Txt>
    <Txt x={120} y={172} k="sc300" size={36} ls={0.06} o={vis(f, SPLIT_AT, TEACH_OUT, 8, 8)}>
      同一句话，左右对照。
    </Txt>
  </g>
);

export const Teach: React.FC<P> = ({f}) => {
  const leave = tween(f, AT.app - 16, 16, 0, 1, E.inOut);
  const d = dotTeach(f);
  if (f < AT.teach - 4 || f >= AT.app) return null;
  return (
    <g opacity={n2(1 - leave)}>
      <World c={camTeach(f)}>
        <Hair x1={120} y1={540} x2={1800} y2={540} p={tween(f, AT.teach, 12) * (1 - tween(f, W_AT, 10))} from="center" o={0.7} />
        {f < FLASH_AT + 20 && <Weights f={f} />}
        {f >= FLASH_AT - 2 && f < GRID_AT + 36 && <Flash f={f} />}
        {f >= GRID_AT - 2 && f < BEFORE_AT + 20 && <Grid f={f} />}
        {f >= BEFORE_AT - 2 && f < AFTER_AT + 8 && <JunkCloud f={f} />}
        {f >= ARROW_AT - 2 && f < AFTER_AT + 4 && <Arrows f={f} />}
        {f >= AFTER_AT - 2 && f < SPLIT_AT + 12 && <AfterDot f={f} />}
        {f >= SPLIT_AT - 2 && f < ACCENT_AT + 8 && <Split f={f} />}
        {f >= ACCENT_AT - 2 && <AccentCall f={f} />}
        <Dot x={d.x} y={d.y} r={d.r} />
      </World>
      <Captions f={f} />
    </g>
  );
};

const MINI: {x: number; y: number; w: number; h: number; r: number; lab: string; sub: string}[] = [
  {x: 160, y: 220, w: 480, h: 640, r: 48, lab: 'APP', sub: '按 · 推 · 拉 · 拨'},
  {x: 720, y: 260, w: 480, h: 560, r: 16, lab: 'HTML', sub: 'hover · 滚 · 锚点'},
  {x: 1280, y: 240, w: 480, h: 600, r: 28, lab: '确认', sub: '一键 · 空着'},
];

export const Recap: React.FC<P> = ({f}) => {
  if (f < AT.recap - 4 || f >= AT.end) return null;
  const inn = spr(f, AT.recap, SMOOTH, 24);
  const out = tween(f, REC_OUT, 20, 0, 1, E.in);
  const arrows = spr(f, REC_ARROWS, POP, 16);
  const pulse = spr(f, REC_PULSE, SNAP, 14);
  const collapse = tween(f, REC_OUT - 8, 28, 0, 1, E.inOut);
  return (
    <g opacity={n2((0.15 + 0.85 * inn) * (1 - out))}>
      <Txt x={120} y={132} k="mono" size={16} ls={0.16} c={C.greyDk} o={inn}>
        讲解 · 三容器，一套语言
      </Txt>
      <Txt x={120} y={176} k="sc300" size={36} ls={0.06} o={vis(f, AT.recap + 6, REC_OUT - 4, 8, 8)}>
        换容器，不换规则。
      </Txt>
      {MINI.map((m, i) => {
        const s = spr(f, AT.recap + i * 6, POP, 18);
        const x = lerp(m.x, 720, collapse);
        const y = lerp(m.y, 260, collapse);
        const o = 1 - collapse * 0.85;
        return (
          <g key={m.lab} transform={`translate(${n2(x)} ${n2(y)}) scale(${n2(0.72 + 0.28 * s)})`} opacity={n2(o * s)}>
            <rect width={m.w} height={m.h} rx={m.r} fill={C.paperHi} stroke={C.ink} strokeWidth={LINE.main} />
            <Txt x={36} y={56} k="mono" size={16} ls={0.14} c={C.greyDk}>
              {m.lab}
            </Txt>
            <Txt x={36} y={120} k="sc300" size={28} ls={0.06}>
              {m.sub}
            </Txt>
            <Dot x={m.w - 56} y={80} r={11 + 3 * pulse} />
          </g>
        );
      })}
      <g opacity={n2(arrows * (1 - collapse))}>
        <Hair x1={640} y1={540} x2={720} y2={540} p={arrows} c={C.accent} />
        <Hair x1={1200} y1={540} x2={1280} y2={540} p={arrows} c={C.accent} />
        <Txt x={960} y={200} k="sc400" size={28} ls={0.1} c={C.accent} anchor="middle">
          同一套语言
        </Txt>
      </g>
      {collapse > 0.2 && <Dot x={960} y={540} r={lerp(11, 16, collapse)} />}
    </g>
  );
};
