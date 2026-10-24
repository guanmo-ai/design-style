/**
 * 010 · Paper Cut —— 贯穿全片的同一座层叠风景。
 * 六层山 + 夜空 + 红日 + 松树剪影。层移的量按 PARA，远慢近快。
 */
import React from 'react';
import {E, spr, track, tween} from '../../../src/lib/anim';
import {C, HILLS, PARA, SHADOW, TREES} from '../tokens';
import {AT, DURATION, RULE_AT} from './timeline';

export const W = 1920;
export const H = 1080;
export const n1 = (v: number) => v.toFixed(1);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const c01 = (t: number) => Math.min(1, Math.max(0, t));

/** 远 → 近的山脊（左右各留 240，给视差用） */
export const HILL_D = [
  'M-240 392 C 40 328 280 468 560 392 S 980 318 1240 388 S 1620 468 1960 348 S 2160 328 2200 372 V1280 H-240 Z',
  'M-240 478 C 80 412 360 558 700 472 S 1120 408 1420 528 S 1800 428 2200 492 V1280 H-240 Z',
  'M-240 568 C 140 508 420 648 780 558 S 1200 508 1520 628 S 1880 538 2200 582 V1280 H-240 Z',
  'M-240 668 C 180 604 500 748 840 658 S 1260 618 1580 738 S 1920 648 2200 692 V1280 H-240 Z',
  'M-240 778 C 200 714 540 868 900 778 S 1320 728 1660 858 S 1980 778 2200 818 V1280 H-240 Z',
  'M-240 888 C 220 834 580 988 940 888 S 1380 848 1720 978 S 2000 888 2200 928 V1280 H-240 Z',
];

type Pine = {x: number; y: number; h: number; layer: number; kind: 'pine' | 'round'};
export const PINES: Pine[] = [
  {x: 168, y: 404, h: 118, layer: 0, kind: 'pine'},
  {x: 412, y: 428, h: 86, layer: 0, kind: 'pine'},
  {x: 980, y: 368, h: 132, layer: 0, kind: 'pine'},
  {x: 1488, y: 396, h: 96, layer: 0, kind: 'pine'},
  {x: 1888, y: 352, h: 108, layer: 0, kind: 'pine'},
  {x: 288, y: 498, h: 148, layer: 1, kind: 'pine'},
  {x: 720, y: 478, h: 110, layer: 1, kind: 'round'},
  {x: 1188, y: 508, h: 164, layer: 1, kind: 'pine'},
  {x: 1760, y: 468, h: 128, layer: 1, kind: 'pine'},
  {x: 92, y: 592, h: 96, layer: 2, kind: 'pine'},
  {x: 540, y: 572, h: 176, layer: 2, kind: 'pine'},
  {x: 1020, y: 584, h: 122, layer: 2, kind: 'round'},
  {x: 1540, y: 612, h: 154, layer: 2, kind: 'pine'},
  {x: 2040, y: 568, h: 108, layer: 2, kind: 'pine'},
  {x: 360, y: 678, h: 188, layer: 3, kind: 'pine'},
  {x: 860, y: 668, h: 140, layer: 3, kind: 'pine'},
  {x: 1340, y: 708, h: 168, layer: 3, kind: 'pine'},
  {x: 1860, y: 672, h: 126, layer: 3, kind: 'round'},
  {x: 180, y: 798, h: 112, layer: 4, kind: 'pine'},
  {x: 640, y: 788, h: 154, layer: 4, kind: 'pine'},
  {x: 1288, y: 808, h: 132, layer: 4, kind: 'pine'},
  {x: 1720, y: 838, h: 98, layer: 4, kind: 'round'},
  {x: 460, y: 908, h: 86, layer: 5, kind: 'pine'},
  {x: 1100, y: 898, h: 74, layer: 5, kind: 'pine'},
];

export const pineD = (x: number, y: number, h: number) => {
  const w = h * 0.58;
  const stem = h * 0.16;
  const t1 = y - h;
  const t2 = y - h * 0.62;
  const t3 = y - h * 0.28;
  return (
    `M${n1(x)} ${n1(t1)} L${n1(x + w * 0.42)} ${n1(t2)} L${n1(x - w * 0.42)} ${n1(t2)} Z` +
    `M${n1(x)} ${n1(t2 + 8)} L${n1(x + w * 0.62)} ${n1(t3)} L${n1(x - w * 0.62)} ${n1(t3)} Z` +
    `M${n1(x)} ${n1(t3 + 8)} L${n1(x + w * 0.78)} ${n1(y - stem)} L${n1(x - w * 0.78)} ${n1(y - stem)} Z` +
    `M${n1(x - 5)} ${n1(y - stem)} H${n1(x + 5)} V${n1(y)} H${n1(x - 5)} Z`
  );
};

export const roundTreeD = (x: number, y: number, h: number) => {
  const r = h * 0.34;
  const cy = y - h * 0.55;
  return (
    `M${n1(x - 4)} ${n1(y - h * 0.28)} H${n1(x + 4)} V${n1(y)} H${n1(x - 4)} Z` +
    `M${n1(x - r)} ${n1(cy)} a${n1(r)} ${n1(r * 0.92)} 0 1 0 ${n1(2 * r)} 0 a${n1(r)} ${n1(r * 0.92)} 0 1 0 ${n1(-2 * r)} 0 Z`
  );
};

const rayD = (cx: number, cy: number, r0: number, r1: number, n: number) => {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = ((i + 0.5) * 360) / n;
    const rad = (a * Math.PI) / 180;
    const x0 = cx + Math.cos(rad) * r0;
    const y0 = cy + Math.sin(rad) * r0;
    const x1 = cx + Math.cos(rad) * r1;
    const y1 = cy + Math.sin(rad) * r1;
    const w = 7 + (i % 3) * 2;
    const nx = -Math.sin(rad) * w;
    const ny = Math.cos(rad) * w;
    d += `M${n1(x0 + nx)} ${n1(y0 + ny)} L${n1(x1)} ${n1(y1)} L${n1(x0 - nx)} ${n1(y0 - ny)} Z`;
  }
  return d;
};

export const SUN = {x: 1624, y: 196, r: 86};

export const LayerFilters: React.FC = () => (
  <defs>
    <filter id="shFar" x="-8%" y="-8%" width="116%" height="124%">
      <feDropShadow dx="0" dy={SHADOW.far.dy} stdDeviation={SHADOW.far.blur / 2} floodColor={SHADOW.color} floodOpacity={SHADOW.far.o} />
    </filter>
    <filter id="shMid" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy={SHADOW.mid.dy} stdDeviation={SHADOW.mid.blur / 2} floodColor={SHADOW.color} floodOpacity={SHADOW.mid.o} />
    </filter>
    <filter id="shNear" x="-12%" y="-12%" width="124%" height="136%">
      <feDropShadow dx="0" dy={SHADOW.near.dy} stdDeviation={SHADOW.near.blur / 2} floodColor={SHADOW.color} floodOpacity={SHADOW.near.o} />
    </filter>
    <filter id="shLift" x="-16%" y="-20%" width="132%" height="150%">
      <feDropShadow dx="0" dy="28" stdDeviation="14" floodColor={SHADOW.color} floodOpacity="0.48" />
    </filter>
    <filter id="fiber" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.7 0.08" numOctaves="2" seed="10" result="n" />
      <feColorMatrix in="n" type="luminanceToAlpha" />
    </filter>
  </defs>
);

const shFor = (i: number, lift: number) => (lift > 0.2 ? 'url(#shLift)' : i < 2 ? 'url(#shFar)' : i < 4 ? 'url(#shMid)' : 'url(#shNear)');

/** 全片镜头：同一座山在编辑器、手机、片头、规则之间连续变形 */
export const worldCam = (f: number) => {
  const x = track(f, [
    {f: 0, v: 0},
    {f: 40, v: 8, d: 50, e: 'smooth'},
    {f: 110, v: 36, d: 60, e: 'smooth'},
    {f: AT.edit, v: -8, d: 22, e: 'spring'},
    {f: AT.app, v: 18, d: 26, e: 'spring'},
    {f: AT.brand, v: 0, d: 24, e: 'smooth'},
    {f: RULE_AT[3] - 6, v: 0, d: 16, e: 'smooth'},
    {f: RULE_AT[3] + 10, v: -210, d: 28, e: 'smooth'},
    {f: RULE_AT[3] + 36, v: 210, d: 30, e: 'smooth'},
    {f: RULE_AT[4], v: 0, d: 24, e: 'smooth'},
    {f: AT.pits, v: 12, d: 20, e: 'smooth'},
    {f: AT.end, v: 20, d: 22, e: 'smooth'},
    {f: DURATION, v: 28, d: 40, e: 'smooth'},
  ]);
  const y = track(f, [
    {f: 0, v: 70},
    {f: 48, v: 0, d: 36, e: 'spring'},
    {f: AT.edit, v: -8, d: 22, e: 'spring'},
    {f: AT.app, v: 8, d: 26, e: 'spring'},
    {f: AT.app + 50, v: 36, d: 40, e: 'smooth'},
    {f: AT.app + 130, v: -8, d: 50, e: 'smooth'},
    {f: AT.brand, v: 40, d: 26, e: 'smooth'},
    {f: AT.rules, v: 0, d: 22, e: 'smooth'},
    {f: AT.end, v: 6, d: 22, e: 'smooth'},
  ]);
  const s = track(f, [
    {f: 0, v: 1.1},
    {f: 44, v: 1, d: 32, e: 'smooth'},
    {f: AT.edit, v: 0.78, d: 24, e: 'spring'},
    {f: AT.app, v: 0.52, d: 28, e: 'spring'},
    {f: AT.brand, v: 1.42, d: 36, e: 'smooth'},
    {f: AT.brand + 90, v: 1.62, d: 40, e: 'smooth'},
    {f: AT.rules, v: 1, d: 26, e: 'spring'},
    {f: AT.pits, v: 0.96, d: 20, e: 'smooth'},
    {f: AT.end, v: 1.02, d: 24, e: 'smooth'},
  ]);
  return {x, y, s};
};

/** 编辑海报：揭起某一层。0 = 贴着，1 = 揭开 */
export const peelAt = (f: number, i: number) => {
  const up = spr(f, AT.edit + 16 + i * 16, {damping: 12, mass: 0.7, stiffness: 170});
  const down = spr(f, AT.edit + 118 + i * 6, {damping: 14, mass: 0.8, stiffness: 150});
  return c01(up * (1 - down));
};

/** 品牌片头：近层向两边让开 */
export const partX = (f: number, i: number) => {
  const k = tween(f, AT.brand + 8, 70, 0, 1, E.inOut) * (1 - tween(f, AT.brand + 130, 28, 0, 1, E.inOut));
  const dir = i % 2 === 0 ? -1 : 1;
  return k * dir * (40 + i * 70);
};

export type WorldMode = 'full' | 'flat' | 'lock' | 'grade';

export const World: React.FC<{f: number; mode?: WorldMode; dim?: number}> = ({f, mode = 'full', dim = 0}) => {
  const cam = worldCam(f);
  const enter = (i: number) => spr(f, 6 + i * 12, {damping: 11, mass: 0.65, stiffness: 180});
  const sunK = spr(f, 34, {damping: 8, mass: 0.5, stiffness: 220});
  const raySpin = f * 0.08;
  const shade = mode === 'flat' ? 0 : 1;
  const lock = mode === 'lock' ? 0 : 1;
  const grade = mode === 'grade' ? 1 : 0;
  return (
    <g>
      <rect width={W} height={H} fill={C.sky} />
      <g transform={`translate(960 540) scale(${cam.s.toFixed(4)}) translate(-960 ${n1(-540 + cam.y)})`}>
        {/* 红日：比山远一档 */}
        <g
          opacity={sunK}
          transform={`translate(${n1(cam.x * PARA[0] * lock)} ${n1(Math.sin(f * 0.02) * 3)}) translate(${SUN.x} ${SUN.y}) scale(${sunK.toFixed(4)}) translate(${-SUN.x} ${-SUN.y})`}
        >
          <path d={rayD(SUN.x, SUN.y, 102, 168, 16)} fill={C.sun} opacity={0.92} transform={`rotate(${n1(raySpin)} ${SUN.x} ${SUN.y})`} />
          <circle cx={SUN.x} cy={SUN.y} r={SUN.r} fill={C.sun} filter={shade ? 'url(#shFar)' : undefined} />
        </g>
        {HILL_D.map((d, i) => {
          const k = enter(i);
          const peel = peelAt(f, i);
          const idleX = Math.sin(f * 0.013 + i * 0.7) * (6 + i * 5) * lock;
          const idleY = Math.cos(f * 0.01 + i * 0.45) * (2 + i * 1.6);
          const px = cam.x * PARA[i + 1] * lock + partX(f, i) + idleX;
          const py = -peel * (36 + i * 6) + (1 - k) * (80 + i * 18) + idleY;
          const fill = grade ? `url(#grade${i})` : HILLS[i];
          return (
            <g key={i} transform={`translate(${n1(px)} ${n1(py)})`} opacity={k} filter={shade ? shFor(i, peel) : undefined}>
              <path d={d} fill={fill} />
              {PINES.filter((p) => p.layer === i).map((p, j) => {
                const tk = spr(f, 46 + i * 10 + j * 3, {damping: 9, mass: 0.55, stiffness: 200});
                if (tk < 0.01) return null;
                return (
                  <path
                    key={j}
                    d={p.kind === 'pine' ? pineD(p.x, p.y, p.h) : roundTreeD(p.x, p.y, p.h)}
                    fill={TREES[i]}
                    transform={`translate(${n1(p.x)} ${n1(p.y)}) scale(${tk.toFixed(3)}) translate(${n1(-p.x)} ${n1(-p.y)})`}
                  />
                );
              })}
            </g>
          );
        })}
      </g>
      {dim > 0.001 && <rect width={W} height={H} fill={C.sky} opacity={dim * 0.45} />}
    </g>
  );
};
