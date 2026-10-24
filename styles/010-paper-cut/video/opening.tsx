/** 010 · 民俗红纸镂空：对折展开，窗花被一圈圈剪开 */
import React from 'react';
import {E, spr, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {AT} from './timeline';
import {n1} from './layers';
import {Tag, Txt} from './ui';

const RED = C.folk;
const WALL = C.wall;

type Hole = {k: 'petal' | 'coin' | 'dot' | 'fan'; x: number; y: number; r: number; rot: number; t: number};

const HOLES: Hole[] = [];
for (let i = 0; i < 12; i++) {
  const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
  HOLES.push({k: 'petal', x: Math.cos(a) * 318, y: Math.sin(a) * 318, r: 50, rot: (a * 180) / Math.PI + 90, t: 26 + i * 3});
}
for (let i = 0; i < 8; i++) {
  const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
  HOLES.push({k: 'coin', x: Math.cos(a) * 198, y: Math.sin(a) * 198, r: 34, rot: 0, t: 52 + i * 3});
}
for (let i = 0; i < 6; i++) {
  const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
  HOLES.push({k: 'petal', x: Math.cos(a) * 72, y: Math.sin(a) * 72, r: 34, rot: (a * 180) / Math.PI + 90, t: 78 + i * 2});
}
for (let i = 0; i < 16; i++) {
  const a = (i / 16) * Math.PI * 2;
  HOLES.push({k: 'dot', x: Math.cos(a) * 258, y: Math.sin(a) * 258, r: 9, rot: 0, t: 64 + (i % 8) * 2});
}
for (let i = 0; i < 4; i++) {
  const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
  HOLES.push({k: 'fan', x: Math.cos(a) * 140, y: Math.sin(a) * 140, r: 42, rot: (a * 180) / Math.PI, t: 88 + i * 3});
}

const petalD = (r: number) =>
  `M0 ${n1(-r)} C ${n1(r * 0.72)} ${n1(-r * 0.22)} ${n1(r * 0.46)} ${n1(r * 0.42)} 0 ${n1(r)} C ${n1(-r * 0.46)} ${n1(r * 0.42)} ${n1(-r * 0.72)} ${n1(-r * 0.22)} 0 ${n1(-r)} Z`;

const coinD = (r: number) => {
  const s = r * 0.38;
  return `M${n1(-r)} 0 a${n1(r)} ${n1(r)} 0 1 0 ${n1(2 * r)} 0 a${n1(r)} ${n1(r)} 0 1 0 ${n1(-2 * r)} 0 Z M${n1(-s)} ${n1(-s)} H${n1(s)} V${n1(s)} H${n1(-s)} Z`;
};

const fanD = (r: number) =>
  `M0 0 L${n1(r)} ${n1(-r * 0.28)} A${n1(r)} ${n1(r)} 0 0 1 ${n1(r)} ${n1(r * 0.28)} Z`;

const HoleShape: React.FC<{h: Hole; k: number}> = ({h, k}) => {
  if (k < 0.02) return null;
  const d = h.k === 'petal' ? petalD(h.r) : h.k === 'coin' ? coinD(h.r) : h.k === 'fan' ? fanD(h.r) : `M${n1(-h.r)} 0 a${n1(h.r)} ${n1(h.r)} 0 1 0 ${n1(2 * h.r)} 0 a${n1(h.r)} ${n1(h.r)} 0 1 0 ${n1(-2 * h.r)} 0 Z`;
  return (
    <path
      d={d}
      fill={WALL}
      fillRule="evenodd"
      transform={`translate(${n1(h.x)} ${n1(h.y)}) rotate(${n1(h.rot)}) scale(${k.toFixed(3)})`}
      opacity={0.25 + 0.75 * k}
    />
  );
};

export const Folk: React.FC<{f: number}> = ({f}) => {
  const unfold = spr(f, 8, {damping: 13, mass: 0.85, stiffness: 120});
  const disk = spr(f, 18, {damping: 12, mass: 0.7, stiffness: 160});
  const sway = Math.sin(f * 0.045) * 3.2;
  const spin = tween(f, 86, 90, 0, 11, E.inOut) + f * 0.035;
  const leftR = -82 * (1 - unfold);
  const rightR = 82 * (1 - unfold);
  return (
    <g>
      <rect width={1920} height={1080} fill={WALL} />
      <rect x={956} y={40} width={8} height={1000} rx={3} fill={RED} opacity={tween(f, 2, 12, 0, 0.55, E.out)} />
      <g transform={`translate(960 540) rotate(${n1(leftR)})`} opacity={0.35 + 0.65 * unfold}>
        <rect x={-520} y={-460} width={520} height={920} rx={28} fill={RED} filter="url(#shNear)" />
      </g>
      <g transform={`translate(960 540) rotate(${n1(rightR)})`} opacity={0.35 + 0.65 * unfold}>
        <rect x={0} y={-460} width={520} height={920} rx={28} fill={RED} filter="url(#shNear)" />
      </g>
      <g transform={`translate(960 508) rotate(${n1(spin + sway)}) scale(${disk.toFixed(3)})`} opacity={disk} filter="url(#shLift)">
        <circle r={412} fill={RED} />
        <circle r={388} fill="none" stroke={WALL} strokeWidth={6} opacity={0.35} />
        <circle r={6} fill={WALL} />
        {HOLES.map((h, i) => (
          <HoleShape key={i} h={h} k={spr(f, h.t, {damping: 10, mass: 0.55, stiffness: 220})} />
        ))}
      </g>
      <rect x={956} y={80} width={8} height={140} rx={4} fill={RED} opacity={disk} />
      <circle cx={960} cy={78} r={10} fill={RED} opacity={disk} />
      <Tag f={f} t0={22} x={72} y={96} en="01  FOLK CUT" zh="民俗红纸镂空：对折，再转开" />
      <g opacity={spr(f, 100, {damping: 14, mass: 0.8, stiffness: 140})}>
        <Txt x={72} y={980} size={18} font="mono" c={RED} ls={1.6}>
          FOLD  →  UNFOLD  →  PUNCH
        </Txt>
        <Txt x={72} y={1020} size={22} font="cn" w={500} c={C.ink} o={0.7}>
          窗花的骨架是中缝。运动也从中缝开始。
        </Txt>
      </g>
    </g>
  );
};
