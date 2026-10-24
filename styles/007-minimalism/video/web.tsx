/**
 * 007 · Minimalism —— Web 10.4–15.0s（极简产品）
 *   hover 下划线 → CTA hover → 滚动 → 锚点。同一屏不晾 >0.8s。
 */
import React from 'react';
import {E, POP, SMOOTH, spr, tween} from '../../../src/lib/anim';
import {C, LINE} from '../tokens';
import {AT} from './timeline';
import {Cam2, camTrack, Dot, Hair, lerp, Letters, n2, P, Txt, vis, World} from './ui';
import {PHONE} from './app';

export const HOVER_AT = 648;
export const HOVER_CTA = 672;
export const SCROLL_AT = 690;
export const ANCHOR_AT = 822;
export const ROW_HOVER = 846;
export const HASH_AT = 870;
export const PAY_GO = AT.pay;

export const WIN = {x: 200, y: 72, w: 1520, h: 888, r: 16};

export const camWeb = (f: number): Cam2 =>
  camTrack(f, [
    [AT.web, {ox: 960, oy: 540, s: 1.02}],
    [HOVER_AT, {ox: 1180, oy: 420, s: 1.1}],
    [HOVER_CTA, {ox: 780, oy: 560, s: 1.12}],
    [SCROLL_AT, {ox: 960, oy: 520, s: 1.04}],
    [ANCHOR_AT, {ox: 860, oy: 580, s: 1.12}],
    [ROW_HOVER, {ox: 780, oy: 620, s: 1.16}],
    [HASH_AT, {ox: 960, oy: 200, s: 1.2}],
    [PAY_GO - 4, {ox: 960, oy: 540, s: 1.04}],
  ]);
const BAR = 52;
const PAGE = {x: WIN.x, y: WIN.y + BAR, w: WIN.w, h: WIN.h - BAR};
const COLS = [0.08, 0.36, 0.64, 0.92].map((t) => PAGE.x + PAGE.w * t);

const Browser: React.FC<{s: number; hash: number}> = ({s, hash}) => (
  <g transform={`translate(960 540) scale(${n2(s)}) translate(-960 -540)`}>
    <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} rx={WIN.r} fill={C.paperHi} stroke={C.ink} strokeWidth={LINE.main} />
    <rect x={WIN.x} y={WIN.y} width={WIN.w} height={BAR} rx={WIN.r} fill={C.shade} />
    <rect x={WIN.x} y={WIN.y + 28} width={WIN.w} height={BAR - 28} fill={C.shade} />
    {[0, 1, 2].map((i) => (
      <circle key={i} cx={WIN.x + 28 + i * 18} cy={WIN.y + 26} r={5} fill={i === 0 ? C.ink : C.stone} />
    ))}
    <rect x={WIN.x + 360} y={WIN.y + 16} width={800} height={22} rx={11} fill={C.paperHi} />
    <text x={WIN.x + 760} y={WIN.y + 32} textAnchor="middle" fill={C.greyDk} style={{fontFamily: "'Geist Mono'", fontSize: 13, letterSpacing: '0.12em'}}>
      {hash > 0.5 ? 'less.is / handbook#01' : 'less.is / handbook'}
    </text>
    {hash > 0.01 && <rect x={WIN.x + 360} y={WIN.y + 16} width={800} height={22} rx={11} fill={C.accent} opacity={n2(0.16 * hash * (1 - Math.max(0, hash - 0.45)))} />}
  </g>
);

const Nav: React.FC<P> = ({f}) => {
  const items: [string, number][] = [
    ['原则', 0],
    ['组件', 90],
    ['关于', 180],
  ];
  const hx = PAGE.x + 72;
  const hy = PAGE.y + 48;
  const hover = tween(f, HOVER_AT, 14, 0, 1, E.out);
  return (
    <g>
      <Txt x={hx} y={hy} k="t400" size={16} ls={0.08} o={tween(f, AT.web + 6, 10)}>
        LESS
      </Txt>
      {items.map(([lab, dx]) => (
        <Txt key={lab} x={PAGE.x + PAGE.w - 280 + dx} y={hy} k="sc300" size={16} ls={0.1} o={tween(f, AT.web + 10, 10)}>
          {lab}
        </Txt>
      ))}
      <Hair x1={PAGE.x + PAGE.w - 280} y1={hy + 10} x2={PAGE.x + PAGE.w - 280 + 48} y2={hy + 10} p={hover} />
    </g>
  );
};

const Hero: React.FC<P> = ({f}) => {
  const o = (at: number) => tween(f, at, 14, 0, 1, E.out);
  return (
    <g>
      <Letters text="少即是多" x={COLS[0]} y={PAGE.y + 280} k="d100" size={108} ls={0.18} fx={(i) => ({o: o(AT.web + 8 + i * 2), dy: (1 - o(AT.web + 8 + i * 2)) * 24})} />
      <Txt x={COLS[0]} y={PAGE.y + 348} k="t300" size={28} o={o(AT.web + 18)}>
        Less is more.
      </Txt>
      <Txt x={COLS[0]} y={PAGE.y + 430} k="sc300" size={22} ls={0.08} c={C.greyDk} o={o(AT.web + 24)}>
        一个屏幕，只做一件事。手册只有三条原则。
      </Txt>
      <Txt x={COLS[0]} y={PAGE.y + 520} k="sc400" size={20} ls={0.12} o={o(HOVER_CTA - 6)}>
        阅读手册
      </Txt>
      <Hair x1={COLS[0]} y1={PAGE.y + 536} x2={COLS[0] + 88} y2={PAGE.y + 536} p={tween(f, HOVER_CTA, 10, 0, 1, E.out)} c={C.accent} />
    </g>
  );
};

const Principles: React.FC<P> = ({f}) => {
  const rows: [string, string][] = [
    ['01', '先删，再排。'],
    ['02', '字重就是层级。'],
    ['03', '颜色只标一件事。'],
  ];
  return (
    <g>
      <Txt x={COLS[0]} y={PAGE.y + 780} k="mono" size={14} ls={0.18} c={C.greyDk} o={tween(f, SCROLL_AT + 8, 10)}>
        PRINCIPLES
      </Txt>
      {rows.map(([n, t], i) => {
        const y = PAGE.y + 860 + i * 88;
        const lift = tween(f, ANCHOR_AT + 12 + i * 6, 10) * (i === 0 ? 1 : 0.35);
        const hover = i === 0 ? tween(f, ROW_HOVER, 12, 0, 1, E.out) : 0;
        const mark = i === 0 ? tween(f, HASH_AT, 10, 0, 1, E.out) : 0;
        return (
          <g key={n} transform={`translate(0 ${n2(-6 * lift)})`}>
            {hover > 0.01 && <rect x={COLS[0] - 16} y={y - 40} width={n2((PAGE.w - 120) * hover)} height={72} rx={8} fill={C.accent} opacity={n2(0.08 * hover * (1 - mark * 0.4))} />}
            <Txt x={COLS[0]} y={y} k="mono" size={16} ls={0.14} c={C.grey}>
              {n}
            </Txt>
            <Txt x={COLS[0] + 80} y={y} k="sc300" size={36} ls={0.06}>
              {t}
            </Txt>
            <Hair x1={COLS[0] + 80} y1={y + 10} x2={COLS[0] + 80 + 220} y2={y + 10} p={hover} c={C.accent} />
            <line x1={COLS[0]} y1={y + 28} x2={PAGE.x + PAGE.w - 80} y2={y + 28} stroke={C.hair} strokeWidth={1} />
          </g>
        );
      })}
    </g>
  );
};

const Grid: React.FC<{o: number}> = ({o}) =>
  o <= 0.001 ? null : (
    <g opacity={n2(0.35 * o)}>
      {COLS.map((x) => (
        <line key={x} x1={x} y1={PAGE.y + 80} x2={x} y2={PAGE.y + PAGE.h - 24} stroke={C.ink} strokeWidth={LINE.note} />
      ))}
    </g>
  );

export const dotWeb = (f: number) => {
  const cta = {x: COLS[0] + 88, y: PAGE.y + 536};
  const nav = {x: PAGE.x + PAGE.w - 256, y: PAGE.y + 48};
  const row = {x: COLS[0] + 40, y: PAGE.y + 860};
  const t0 = tween(f, AT.web, 18, 0, 1, E.inOut);
  const tH = tween(f, HOVER_AT - 6, 12, 0, 1, E.inOut);
  const tC = tween(f, HOVER_CTA - 6, 12, 0, 1, E.inOut);
  const tA = tween(f, ANCHOR_AT - 6, 14, 0, 1, E.inOut);
  const tR = tween(f, ROW_HOVER - 6, 12, 0, 1, E.inOut);
  const tHash = tween(f, HASH_AT - 6, 12, 0, 1, E.inOut);
  const bar = {x: WIN.x + 760, y: WIN.y + 28};
  let x = lerp(PHONE.x + PHONE.w / 2, nav.x, t0);
  let y = lerp(PHONE.y + 392, nav.y, t0);
  x = lerp(x, cta.x, tC);
  y = lerp(y, cta.y, tC);
  x = lerp(x, row.x, tA);
  y = lerp(y, row.y, tA);
  x = lerp(x, nav.x, tH * (1 - tC));
  y = lerp(y, nav.y, tH * (1 - tC));
  x = lerp(x, row.x + 80, tR * (1 - tHash));
  y = lerp(y, row.y, tR * (1 - tHash));
  x = lerp(x, bar.x, tHash);
  y = lerp(y, bar.y, tHash);
  return {x, y, r: 13};
};

const Pill: React.FC<{f: number; at: number; t: string}> = ({f, at, t}) => {
  const o = vis(f, at, at + 24, 5, 7);
  if (o <= 0.001) return null;
  const s = 0.84 + 0.16 * spr(f, at, POP, 12);
  return (
    <g transform={`translate(140 236) scale(${n2(s)})`} opacity={n2(o)}>
      <rect x={0} y={-22} width={t.length * 15 + 20} height={30} rx={4} fill={C.ink} />
      <Txt x={10} y={0} k="mono" size={13} ls={0.08} c={C.paperHi}>
        {t}
      </Txt>
    </g>
  );
};

const Captions: React.FC<P> = ({f}) => (
  <g>
    <Txt x={120} y={168} k="sc300" size={32} ls={0.06} o={vis(f, AT.web + 6, HOVER_CTA, 8, 6)}>
      网页也只留标题和一条线。
    </Txt>
    <Txt x={1800} y={150} k="mono" size={14} ls={0.16} c={C.greyDk} anchor="end" o={vis(f, AT.web + 6, PAY_GO - 8, 10, 8)}>
      极简产品 · HTML
    </Txt>
    <Pill f={f} at={HOVER_AT} t="HOVER" />
    <Pill f={f} at={HOVER_CTA} t="CTA" />
    <Pill f={f} at={SCROLL_AT} t="SCROLL" />
    <Pill f={f} at={ANCHOR_AT} t="ANCHOR" />
    <Pill f={f} at={ROW_HOVER} t="ROW" />
    <Pill f={f} at={HASH_AT} t="HASH" />
  </g>
);

export const Web: React.FC<P> = ({f}) => {
  const enter = spr(f, AT.web, SMOOTH, 28);
  const leave = tween(f, PAY_GO - 16, 16, 0, 1, E.inOut);
  const s = lerp(0.78, 1, enter) * (1 - 0.12 * leave);
  const scroll = tween(f, SCROLL_AT, 90, 0, 420, E.inOut) + tween(f, ANCHOR_AT, 22, 0, 200, E.out);
  const d = dotWeb(f);
  const pageO = tween(f, AT.web + 6, 10) * (1 - leave);
  const hash = tween(f, HASH_AT, 10, 0, 1, E.out);
  if (enter <= 0.01 && f < AT.web) return null;
  return (
    <g opacity={n2((0.2 + 0.8 * enter) * (1 - leave))}>
      <World c={camWeb(f)}>
        <Browser s={s} hash={hash} />
        <g transform={`translate(960 540) scale(${n2(s)}) translate(-960 -540)`}>
          <defs>
            <clipPath id="web-page">
              <rect x={PAGE.x} y={PAGE.y} width={PAGE.w} height={PAGE.h} />
            </clipPath>
          </defs>
          <g clipPath="url(#web-page)" opacity={n2(pageO)}>
            <g transform={`translate(0 ${n2(-scroll)})`}>
              <Grid o={tween(f, AT.web + 10, 14)} />
              <Nav f={f} />
              <Hero f={f} />
              <Principles f={f} />
              {f < PAY_GO && <Dot x={d.x} y={d.y} r={d.r} />}
            </g>
          </g>
        </g>
      </World>
      <Captions f={f} />
    </g>
  );
};
