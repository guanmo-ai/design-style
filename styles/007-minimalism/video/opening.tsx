/**
 * 007 · 六改开场 0–3.0s —— 必须炸
 *   ≥16 可辨元素同时在动：控件 / 色块 / 字重 / 装饰 / 坏例碎片
 *   spring 过冲落拍，每件只喊一次，然后 snap zoom 扎进噪音
 *   3.0s 裂成五窗（见 panes.tsx）
 */
import React from 'react';
import {E, POP, SNAP, shake, spr, tween} from '../../../src/lib/anim';
import {C, DOT, LAYOUT} from '../tokens';
import {AT} from './timeline';
import {Dot, Hair, Txt, lerp, n2, P} from './ui';

export const CENTER = {x: 960, y: LAYOUT.horizon};
export const LAND = AT.split;
export const HANDOFF = AT.bone;
export const openPush = (_f: number) => 1;

const BLUE = '#1D4ED8';
const ROSE = '#E11D48';
const GOLD = '#D4A017';

export type BitKind = 'badge' | 'burst' | 'slider' | 'bar' | 'btn' | 'star' | 'arrow' | 'tab' | 'card' | 'code' | 'spin' | 'check' | 'chip' | 'price' | 'dots' | 'tog' | 'stamp' | 'note';

export type Bit = {
  kind: BitKind;
  x: number;
  y: number;
  rot: number;
  label: string;
  fill: string;
  ink?: string;
  in: number;
  shout: number;
  pane: 0 | 1 | 2 | 3 | 4;
};

/** 18 件。坐标是落点；入场从外侧过冲进来。 */
export const BITS: Bit[] = [
  {kind: 'badge', x: 220, y: 160, rot: -12, label: '超值', fill: BLUE, ink: '#fff', in: 0, shout: 18, pane: 1},
  {kind: 'burst', x: 980, y: 300, rot: 8, label: 'MORE!', fill: C.ink, ink: '#fff', in: 2, shout: 22, pane: 4},
  {kind: 'price', x: 1480, y: 180, rot: 6, label: '99+', fill: ROSE, ink: '#fff', in: 3, shout: 26, pane: 2},
  {kind: 'btn', x: 560, y: 200, rot: -4, label: 'BUY NOW', fill: C.ink, ink: '#fff', in: 4, shout: 30, pane: 1},
  {kind: 'slider', x: 320, y: 420, rot: 0, label: '', fill: GOLD, in: 5, shout: 34, pane: 0},
  {kind: 'bar', x: 1240, y: 140, rot: 0, label: '', fill: BLUE, in: 6, shout: 38, pane: 3},
  {kind: 'star', x: 170, y: 620, rot: 20, label: '', fill: GOLD, in: 7, shout: 42, pane: 4},
  {kind: 'arrow', x: 1680, y: 420, rot: 0, label: '', fill: C.ink, in: 8, shout: 46, pane: 1},
  {kind: 'tab', x: 720, y: 520, rot: 0, label: 'HOT', fill: ROSE, ink: '#fff', in: 9, shout: 50, pane: 0},
  {kind: 'card', x: 1180, y: 560, rot: -6, label: 'CARD', fill: C.paperHi, in: 10, shout: 54, pane: 3},
  {kind: 'chip', x: 430, y: 720, rot: 8, label: 'NEW', fill: ROSE, ink: '#fff', in: 11, shout: 58, pane: 0},
  {kind: 'code', x: 1540, y: 700, rot: 4, label: '', fill: C.ink, in: 12, shout: 62, pane: 2},
  {kind: 'check', x: 860, y: 780, rot: 0, label: 'VIP', fill: C.ink, in: 13, shout: 66, pane: 2},
  {kind: 'tog', x: 1640, y: 240, rot: 0, label: '', fill: BLUE, in: 14, shout: 70, pane: 0},
  {kind: 'stamp', x: 250, y: 860, rot: -16, label: 'SALE', fill: GOLD, ink: C.ink, in: 15, shout: 74, pane: 1},
  {kind: 'dots', x: 1060, y: 860, rot: 0, label: '', fill: C.grey, in: 16, shout: 78, pane: 3},
  {kind: 'note', x: 640, y: 360, rot: 10, label: 'ULTRA', fill: BLUE, ink: '#fff', in: 17, shout: 82, pane: 4},
  {kind: 'spin', x: 1380, y: 380, rot: 0, label: '', fill: C.ink, in: 18, shout: 86, pane: 3},
];

export const CLUTTER_TIMES = BITS.map((b) => b.shout);

const PANE_C = [
  {x: 350, y: 450},
  {x: 1020, y: 260},
  {x: 1630, y: 260},
  {x: 1020, y: 680},
  {x: 1630, y: 680},
];

const shoutScale = (f: number, at: number) => {
  const p = tween(f, at, 10, 0, 1, E.out);
  if (p <= 0 || p >= 1) return 1;
  return 1 + 0.22 * Math.sin(p * Math.PI);
};

const BitDraw: React.FC<{b: Bit; s: number}> = ({b, s}) => {
  const k = b.kind;
  if (k === 'badge' || k === 'chip' || k === 'note' || k === 'stamp' || k === 'price' || k === 'tab') {
    const w = k === 'price' ? 120 : k === 'note' ? 150 : k === 'stamp' ? 130 : 108;
    const h = k === 'stamp' ? 108 : 44;
    const r = k === 'stamp' || k === 'badge' ? 22 : 8;
    return (
      <g>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={r} fill={b.fill} />
        <text x={0} y={7} textAnchor="middle" fill={b.ink ?? C.ink} style={{fontFamily: "'Inter'", fontWeight: 700, fontSize: 20 * s}}>
          {b.label}
        </text>
      </g>
    );
  }
  if (k === 'burst') {
    return (
      <g>
        <polygon
          points="-90,-18 -28,-18 -40,-80 0,-24 40,-80 28,-18 90,-18 32,8 58,70 0,28 -58,70 -32,8"
          fill={b.fill}
        />
        <text x={0} y={8} textAnchor="middle" fill="#fff" style={{fontFamily: "'Inter'", fontWeight: 800, fontSize: 22}}>
          {b.label}
        </text>
      </g>
    );
  }
  if (k === 'btn') {
    return (
      <g>
        <rect x={-80} y={-22} width={160} height={44} fill={b.fill} />
        <rect x={-80} y={20} width={160} height={4} fill={C.accent} />
        <text x={0} y={8} textAnchor="middle" fill="#fff" style={{fontFamily: "'Inter'", fontWeight: 600, fontSize: 16, letterSpacing: '0.08em'}}>
          {b.label}
        </text>
      </g>
    );
  }
  if (k === 'slider') {
    return (
      <g>
        <line x1={-90} y1={0} x2={90} y2={0} stroke={C.stone} strokeWidth={6} strokeLinecap="round" />
        <line x1={-90} y1={0} x2={20} y2={0} stroke={b.fill} strokeWidth={6} strokeLinecap="round" />
        <circle cx={20} cy={0} r={14} fill={C.ink} />
      </g>
    );
  }
  if (k === 'bar') {
    return (
      <g>
        <rect x={-100} y={-8} width={200} height={16} rx={3} fill={C.stone} />
        <rect x={-100} y={-8} width={140} height={16} rx={3} fill={b.fill} />
      </g>
    );
  }
  if (k === 'star') {
    return <polygon points="0,-22 6,-6 22,-6 10,4 14,20 0,10 -14,20 -10,4 -22,-6 -6,-6" fill={b.fill} />;
  }
  if (k === 'arrow') {
    return (
      <g stroke={b.fill} strokeWidth={3} fill="none">
        <line x1={-70} y1={0} x2={50} y2={0} />
        <polyline points="30,-16 56,0 30,16" />
      </g>
    );
  }
  if (k === 'card') {
    return (
      <g>
        <rect x={-70} y={-48} width={140} height={96} rx={8} fill={b.fill} stroke={C.ink} strokeWidth={1.5} />
        <rect x={-50} y={-20} width={40} height={12} fill={BLUE} />
        <rect x={4} y={-20} width={40} height={12} fill={GOLD} />
        <rect x={-50} y={8} width={100} height={8} fill={C.stone} />
      </g>
    );
  }
  if (k === 'code') {
    return (
      <g stroke={C.ink} strokeWidth={2}>
        {Array.from({length: 8}, (_, i) => (
          <line key={i} x1={-40 + i * 10} y1={-24} x2={-40 + i * 10} y2={24} strokeWidth={i % 3 === 0 ? 4 : 2} />
        ))}
      </g>
    );
  }
  if (k === 'spin') {
    return (
      <g>
        <circle r={22} fill="none" stroke={C.stone} strokeWidth={4} />
        <path d="M0-22 A22 22 0 0 1 22 0" fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
      </g>
    );
  }
  if (k === 'check') {
    return (
      <g>
        <rect x={-70} y={-16} width={32} height={32} fill="none" stroke={C.ink} strokeWidth={2} />
        <polyline points="-62,0 -56,8 -46,-8" fill="none" stroke={C.ink} strokeWidth={2} />
        <text x={-28} y={8} fill={C.ink} style={{fontFamily: "'Inter'", fontWeight: 600, fontSize: 18}}>
          {b.label}
        </text>
      </g>
    );
  }
  if (k === 'tog') {
    return (
      <g>
        <rect x={-36} y={-16} width={72} height={32} rx={16} fill={C.ink} />
        <circle cx={18} cy={0} r={12} fill={C.accent} />
      </g>
    );
  }
  return (
    <g>
      {[-24, 0, 24].map((x) => (
        <circle key={x} cx={x} cy={0} r={6} fill={b.fill} />
      ))}
    </g>
  );
};

const WEIGHTS: {t: string; k: 'd100' | 'd300' | 't500'; size: number; x: number; y: number; at: number}[] = [
  {t: 'Aa', k: 'd100', size: 96, x: 180, y: 980, at: 36},
  {t: 'Aa', k: 'd300', size: 56, x: 400, y: 980, at: 48},
  {t: 'Aa', k: 't500', size: 28, x: 600, y: 980, at: 60},
];

export const Blast: React.FC<P> = ({f}) => {
  if (f >= AT.split + 28) return null;
  const fly = spr(f, AT.split, SNAP, 22);
  const zoom = 1 + 0.14 * tween(f, 108, 16, 0, 1, E.inOut) * (1 - tween(f, 156, 20, 0, 1, E.inOut));
  const sh = shake(f, [
    [0, 7],
    [30, 5],
    [108, 10],
    [120, 8],
  ]);
  const nOn = BITS.filter((b) => f >= b.in).length + WEIGHTS.filter((w) => f >= w.at).length;
  return (
    <g transform={`translate(${n2(sh.x)} ${n2(sh.y)}) translate(960 540) scale(${n2(zoom)}) translate(-960 -540)`}>
      {Array.from({length: 24}, (_, i) => {
        const t0 = i * 1.5;
        const g = tween(f, t0, 5, 0, 1, E.out) * (1 - tween(f, t0 + 8, 8, 0, 1, E.in));
        if (g < 0.03) return null;
        const col = i % 8;
        const row = Math.floor(i / 8);
        return (
          <rect
            key={`fl${i}`}
            x={n2(140 + col * 220)}
            y={n2(90 + row * 300)}
            width={n2(34 * g)}
            height={n2(34 * g)}
            fill={i % 7 === 0 ? C.accent : C.ink}
            opacity={n2(0.22 * g * (1 - fly))}
          />
        );
      })}
      {BITS.map((b, i) => {
        const inn = spr(f, b.in, POP, 16);
        if (inn <= 0.01) return null;
        const dest = PANE_C[b.pane];
        const floatX = Math.sin((f + i * 13) * 0.09) * 8 * inn * (1 - fly);
        const floatY = Math.cos((f + i * 11) * 0.07) * 6 * inn * (1 - fly);
        const pulse = f > 24 && f < AT.split ? 1 + 0.07 * Math.sin((f / 7.5) * Math.PI * 2 + i * 0.45) : 1;
        const x = lerp(b.x + (b.x - 960) * 0.55 * (1 - inn) + floatX, dest.x, fly);
        const y = lerp(b.y + (b.y - 540) * 0.4 * (1 - inn) + floatY, dest.y, fly);
        const sc = inn * shoutScale(f, b.shout) * pulse * (1 - 0.55 * fly);
        const rot = b.rot * (1 - fly) + (b.pane - 2) * 8 * fly;
        const spin = b.kind === 'spin' ? f * 14 : 0;
        return (
          <g key={i} transform={`translate(${n2(x)} ${n2(y)}) rotate(${n2(rot + spin)}) scale(${n2(sc)})`} opacity={n2(1 - 0.35 * fly)}>
            <BitDraw b={b} s={1} />
          </g>
        );
      })}
      {WEIGHTS.map((w) => {
        const s = spr(f, w.at, POP, 14) * (1 - fly);
        if (s < 0.02) return null;
        return (
          <Txt key={w.at} x={w.x} y={w.y} k={w.k} size={w.size} o={s}>
            {w.t}
          </Txt>
        );
      })}
      <Txt x={120} y={88} k="mono" size={14} ls={0.16} c={C.greyDk} o={tween(f, 8, 10) * (1 - fly)}>
        {`${String(Math.min(nOn + (f < 70 ? 8 : 0), 24)).padStart(2, '0')}  ELEMENTS MOVING`}
      </Txt>
      <Hair x1={120} y1={102} x2={120 + 220 * tween(f, 8, 20)} y2={102} c={C.accent} w={2} />
      {f >= 108 && f < AT.split + 4 && <Dot x={960} y={540} r={DOT.r * spr(f, 108, POP, 14) * (1 - tween(f, AT.split - 8, 8))} />}
    </g>
  );
};

export const Opening = Blast;
