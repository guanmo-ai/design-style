/**
 * 007 · Minimalism —— 8.0–11.0s 留下骨架
 *   网格 / 字重 / 留白测量。讲解可以华丽，箭头指向原则。
 */
import React from 'react';
import {E, POP, SNAP, SMOOTH, spr, tween} from '../../../src/lib/anim';
import {C, DOT, LINE} from '../tokens';
import {BONE} from './script';
import {AT} from './timeline';
import {Cam2, Dot, Hair, Leader, Txt, World, camTrack, lerp, n2, P, vis, Why} from './ui';

export const GRID_AT = BONE.grid.at;
export const WEIGHT_AT = BONE.weight.at;
export const SPACE_AT = BONE.space.at;

const COLS = [240, 560, 880, 1200, 1520, 1680];
const ROWS = [200, 360, 540, 720, 860];

export const camBone = (f: number): Cam2 =>
  camTrack(f, [
    [AT.bone, {ox: 960, oy: 540, s: 1.18}],
    [GRID_AT + 20, {ox: 960, oy: 500, s: 1.04}],
    [WEIGHT_AT, {ox: 780, oy: 480, s: 1.1}],
    [SPACE_AT, {ox: 1180, oy: 540, s: 1.12}],
    [AT.app - 4, {ox: 960, oy: 540, s: 1}],
  ]);

const Grid: React.FC<P> = ({f}) => {
  const inn = tween(f, GRID_AT, 22, 0, 1, E.out);
  const out = 1 - tween(f, AT.app - 18, 16, 0, 1, E.inOut);
  if (inn * out <= 0.001) return null;
  return (
    <g opacity={n2(inn * out)}>
      {COLS.map((x, i) => (
        <Hair key={`c${x}`} x1={x} y1={ROWS[0]} x2={x} y2={ROWS[ROWS.length - 1]} p={tween(f, GRID_AT + i * 3, 14)} c={C.ink} o={0.22} />
      ))}
      {ROWS.map((y, i) => (
        <Hair key={`r${y}`} x1={COLS[0]} y1={y} x2={COLS[COLS.length - 1]} y2={y} p={tween(f, GRID_AT + 4 + i * 3, 14)} c={C.ink} o={0.22} />
      ))}
      {COLS.map((x) =>
        ROWS.map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r={2.2} fill={C.ink} opacity={0.28 * tween(f, GRID_AT + 10, 12)} />),
      )}
    </g>
  );
};

const Dim: React.FC<{p: number; x: number; y1: number; y2: number; lab: string}> = ({p, x, y1, y2, lab}) => {
  if (p <= 0.001) return null;
  return (
    <g opacity={n2(p)}>
      <Hair x1={x} y1={y1} x2={x} y2={lerp(y1, y2, p)} w={1} c={C.accent} />
      <line x1={x - 6} y1={y1} x2={x + 6} y2={y1} stroke={C.accent} strokeWidth={1} />
      <line x1={x - 6} y1={n2(lerp(y1, y2, p))} x2={x + 6} y2={n2(lerp(y1, y2, p))} stroke={C.accent} strokeWidth={1} />
      <Txt x={x + 12} y={(y1 + y2) / 2 + 5} k="mono" size={13} ls={0.08} c={C.accent}>
        {lab}
      </Txt>
    </g>
  );
};

const Weights: React.FC<P> = ({f}) => {
  const rows: [string, 'd100' | 't300' | 't500', number, string][] = [
    ['100', 'd100', 96, '标题越薄'],
    ['300', 't300', 36, '正文只此'],
    ['500', 't500', 18, '注释更小'],
  ];
  return (
    <g>
      {rows.map(([lab, k, sz, note], i) => {
        const at = WEIGHT_AT + i * 8;
        const o = vis(f, at, SPACE_AT + 8, 8, 10);
        const dy = (1 - spr(f, at, POP, 16)) * 26;
        const y = ROWS[1] + i * 110;
        return (
          <g key={lab} opacity={n2(o)} transform={`translate(0 ${n2(dy)})`}>
            <Txt x={COLS[1] + 16} y={y} k={k} size={sz}>
              Aa
            </Txt>
            <Txt x={COLS[2] + 20} y={y} k="mono" size={16} ls={0.12} c={C.greyDk}>
              {lab}
            </Txt>
            <Txt x={COLS[2] + 20} y={y + 28} k="sc300" size={18} c={C.grey}>
              {note}
            </Txt>
            <Hair x1={COLS[1]} y1={y + 16} x2={COLS[1] + 8} y2={y + 16} o={o} />
          </g>
        );
      })}
    </g>
  );
};

const Space: React.FC<P> = ({f}) => {
  const p = vis(f, SPACE_AT, AT.app - 12, 10, 12);
  if (p <= 0.001) return null;
  const x1 = COLS[3];
  const x2 = COLS[4];
  const y1 = ROWS[2];
  const y2 = ROWS[3];
  const grow = spr(f, SPACE_AT, SMOOTH, 20);
  return (
    <g opacity={n2(p)}>
      <rect x={x1} y={y1} width={(x2 - x1) * grow} height={(y2 - y1) * grow} fill={C.accent} opacity={0.1} />
      <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill="none" stroke={C.accent} strokeWidth={LINE.main} />
      <Leader x={(x1 + x2) / 2} y={y1} kx={(x1 + x2) / 2 + 40} ky={y1 - 48} ex={x2 + 80} p={tween(f, SPACE_AT + 6, 12)} c={C.accent} />
      <Txt x={x2 + 88} y={y1 - 44} k="sc300" size={20} c={C.accent}>
        这一格是空的
      </Txt>
      <Dim p={tween(f, SPACE_AT + 10, 12)} x={x2 + 16} y1={y1} y2={y2} lab="180" />
    </g>
  );
};

const Caption: React.FC<P> = ({f}) => {
  const items = [BONE.grid, BONE.weight, BONE.space];
  let cur = items[0];
  let i = 0;
  items.forEach((b, k) => {
    if (f >= b.at) {
      cur = b;
      i = k;
    }
  });
  const next = items[i + 1];
  const o = vis(f, cur.at, next ? next.at - 2 : AT.app - 8, 8, 8);
  const dy = (1 - spr(f, cur.at, POP, 16)) * 16;
  return (
    <g transform={`translate(0 ${n2(dy)})`}>
      <Why o={o} kicker={`骨架  0${i + 1}`} line={cur.why} en={cur.en} />
    </g>
  );
};

export const Bone: React.FC<P> = ({f}) => {
  if (f < AT.bone - 4 || f >= AT.app) return null;
  const leave = tween(f, AT.app - 16, 16, 0, 1, E.inOut);
  const cell = spr(f, AT.app - 22, SNAP, 22);
  return (
    <g opacity={n2(1 - leave * 0.15)}>
      <World c={camBone(f)}>
        <Grid f={f} />
        <Weights f={f} />
        <Space f={f} />
        <Dot x={960} y={540} r={DOT.r * (1 - cell * 0.35)} />
        {cell > 0.02 && (
          <rect
            x={n2(lerp(960 - 8, 680, cell))}
            y={n2(lerp(540 - 8, 68, cell))}
            width={n2(lerp(16, 560, cell))}
            height={n2(lerp(16, 944, cell))}
            rx={n2(lerp(16, 76, cell))}
            fill={C.ink}
            opacity={n2(cell)}
          />
        )}
      </World>
      <Caption f={f} />
    </g>
  );
};
