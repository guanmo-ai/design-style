/**
 * 010 · Paper Cut —— 贯穿全片的同一座层叠风景。
 * 六层山 + 夜空 + 红日 + 松树剪影。层移的量按 PARA，远慢近快。
 */
import React from 'react';
import {E, spr, track, tween} from '../../../src/lib/anim';
import {C, HILLS, PARA, SHADOW, TREES} from '../tokens';
import {AT, DURATION, TR} from './timeline';

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

/** 全片镜头：几何层叠之后，同一座山在海报、剪影、字洞、片尾之间连续变形 */
export const worldCam = (f: number) => {
  const x = track(f, [
    {f: AT.geo, v: 0},
    {f: AT.geo + 20, v: 18, d: 40, e: 'smooth'},
    {f: AT.geo + 80, v: -70, d: 70, e: 'smooth'},
    {f: AT.dio, v: 12, d: 26, e: 'spring'},
    {f: AT.sil, v: -20, d: 28, e: 'smooth'},
    {f: AT.sil + 80, v: 40, d: 50, e: 'smooth'},
    {f: AT.torn, v: 8, d: 24, e: 'smooth'},
    {f: AT.type, v: 0, d: 26, e: 'smooth'},
    {f: AT.take, v: 16, d: 30, e: 'smooth'},
    {f: DURATION, v: 28, d: 50, e: 'smooth'},
  ]);
  const y = track(f, [
    {f: AT.geo, v: 40},
    {f: AT.geo + 24, v: 0, d: 28, e: 'spring'},
    {f: AT.dio, v: -8, d: 24, e: 'spring'},
    {f: AT.sil, v: 10, d: 22, e: 'smooth'},
    {f: AT.torn, v: 8, d: 24, e: 'smooth'},
    {f: AT.type, v: 36, d: 28, e: 'smooth'},
    {f: AT.take, v: 4, d: 24, e: 'smooth'},
  ]);
  const s = track(f, [
    {f: AT.geo, v: 1.08},
    {f: AT.geo + 20, v: 1, d: 28, e: 'smooth'},
    {f: AT.dio, v: 0.78, d: 26, e: 'spring'},
    {f: AT.sil, v: 1.06, d: 28, e: 'smooth'},
    {f: AT.torn, v: 1.02, d: 24, e: 'smooth'},
    {f: AT.type, v: 1.28, d: 36, e: 'smooth'},
    {f: AT.type + 90, v: 1.48, d: 40, e: 'smooth'},
    {f: AT.take, v: 1, d: 28, e: 'spring'},
  ]);
  return {x, y, s};
};

export type Cam = {x: number; y: number; s: number; ox?: number};

/**
 * 手机头图镜头：只给 App 幕用。
 * 红日在世界右侧（x=1624），手机只裁中间 508px，所以 ox 先把取景拉到太阳那边，
 * 再靠 PARA 横滑 + 下探：近层走得更远。
 */
export const phoneCam = (f: number): Cam => {
  const x = track(f, [
    {f: AT.torn - TR, v: 12},
    {f: AT.torn, v: 28, d: 22, e: 'spring'},
    {f: AT.torn + 36, v: -150, d: 56, e: 'smooth'},
    {f: AT.torn + 140, v: 18, d: 50, e: 'smooth'},
  ]);
  const y = track(f, [
    {f: AT.torn - TR, v: -340},
    {f: AT.torn, v: -355, d: 22, e: 'spring'},
    {f: AT.torn + 48, v: -398, d: 50, e: 'smooth'},
    {f: AT.torn + 150, v: -368, d: 48, e: 'smooth'},
  ]);
  const s = track(f, [
    {f: AT.torn - TR, v: 0.56},
    {f: AT.torn, v: 0.58, d: 24, e: 'spring'},
    {f: AT.torn + 70, v: 0.64, d: 44, e: 'smooth'},
  ]);
  const ox = track(f, [
    {f: AT.torn - TR, v: -430},
    {f: AT.torn, v: -456, d: 24, e: 'spring'},
    {f: AT.torn + 48, v: -510, d: 50, e: 'smooth'},
    {f: AT.torn + 150, v: -460, d: 48, e: 'smooth'},
  ]);
  return {x, y, s, ox};
};

/** 立体纸板：揭起某一层。0 = 贴着，1 = 揭开 */
export const peelAt = (f: number, i: number) => {
  const up = spr(f, AT.dio + 8 + i * 12, {damping: 12, mass: 0.7, stiffness: 170});
  const down = spr(f, AT.dio + 108 + i * 6, {damping: 14, mass: 0.8, stiffness: 150});
  return c01(up * (1 - down * 0.72));
};

/** 字体剪纸：近层向两边让开 */
export const partX = (f: number, i: number) => {
  const k = tween(f, AT.type + 80, 70, 0, 1, E.inOut) * (1 - tween(f, AT.take - 28, 24, 0, 1, E.inOut));
  const dir = i % 2 === 0 ? -1 : 1;
  return k * dir * (40 + i * 70);
};

export type WorldMode = 'full' | 'flat' | 'dio' | 'monoInk' | 'monoPaper';

export const World: React.FC<{f: number; mode?: WorldMode; dim?: number; cam?: Cam; born?: number}> = ({
  f,
  mode = 'full',
  dim = 0,
  cam: given,
  born = AT.geo,
}) => {
  const cam = given ?? worldCam(f);
  const enter = (i: number) => spr(f, born + 4 + i * 10, {damping: 11, mass: 0.65, stiffness: 180});
  const sunK = mode.startsWith('mono') ? 0 : spr(f, born + 24, {damping: 8, mass: 0.5, stiffness: 220});
  const raySpin = f * 0.08;
  const shade = mode === 'flat' ? 0 : 1;
  const lock = 1;
  const dio = mode === 'dio';
  const light = dio ? tween(f, AT.dio, 90, -38, 52, E.inOut) : 90;
  const rad = (light * Math.PI) / 180;
  const sky = mode === 'monoInk' ? C.paper : mode === 'monoPaper' ? C.ink : C.sky;
  return (
    <g>
      <rect width={W} height={H} fill={sky} />
      {dio && (
        <defs>
          {HILL_D.map((_, i) => (
            <filter key={i} id={`shDio${i}`} x="-20%" y="-20%" width="140%" height="160%">
              <feDropShadow
                dx={n1(Math.cos(rad) * (10 + i * 7))}
                dy={n1(8 + Math.sin(rad) * (12 + i * 8))}
                stdDeviation={n1(6 + i * 2.2)}
                floodColor={SHADOW.color}
                floodOpacity={0.28 + i * 0.05}
              />
            </filter>
          ))}
        </defs>
      )}
      <g transform={`translate(960 540) scale(${cam.s.toFixed(4)}) translate(${n1(-960 + (cam.ox ?? 0))} ${n1(-540 + cam.y)})`}>
        <g
          opacity={sunK}
          transform={`translate(${n1(cam.x * PARA[0] * lock)} ${n1(Math.sin(f * 0.02) * 3)}) translate(${SUN.x} ${SUN.y}) scale(${Math.max(sunK, 0.001).toFixed(4)}) translate(${-SUN.x} ${-SUN.y})`}
        >
          <path d={rayD(SUN.x, SUN.y, 102, 168, 16)} fill={C.sun} opacity={0.92} transform={`rotate(${n1(raySpin)} ${SUN.x} ${SUN.y})`} />
          <circle cx={SUN.x} cy={SUN.y} r={SUN.r} fill={C.sun} filter={shade ? 'url(#shFar)' : undefined} />
        </g>
        {HILL_D.map((d, i) => {
          const k = enter(i);
          const peel = mode === 'full' || dio ? peelAt(f, i) : 0;
          const stair = tween(f, born + 8 + i * 8, 22, 1, 0, E.out);
          const idleX = Math.sin(f * 0.016 + i * 0.7) * (8 + i * 6);
          const idleY = Math.cos(f * 0.012 + i * 0.45) * (3 + i * 2);
          const px = cam.x * PARA[i + 1] * lock + partX(f, i) + idleX + stair * (i - 2.5) * 36;
          const py = -peel * (40 + i * 10) + (1 - k) * (90 + i * 20) + idleY;
          const fill = mode === 'monoInk' ? C.ink : mode === 'monoPaper' ? C.paper : HILLS[i];
          const tree = mode === 'monoInk' ? '#0A1014' : mode === 'monoPaper' ? C.cream : TREES[i];
          const filt = !shade ? undefined : dio ? `url(#shDio${i})` : shFor(i, peel);
          return (
            <g key={i} transform={`translate(${n1(px)} ${n1(py)})`} opacity={k} filter={filt}>
              <path d={d} fill={fill} />
              {PINES.filter((p) => p.layer === i).map((p, j) => {
                const tk = spr(f, born + 36 + i * 8 + j * 3, {damping: 9, mass: 0.55, stiffness: 200});
                if (tk < 0.01) return null;
                return (
                  <path
                    key={j}
                    d={p.kind === 'pine' ? pineD(p.x, p.y, p.h) : roundTreeD(p.x, p.y, p.h)}
                    fill={tree}
                    transform={`translate(${n1(p.x)} ${n1(p.y)}) scale(${tk.toFixed(3)}) translate(${n1(-p.x)} ${n1(-p.y)})`}
                  />
                );
              })}
            </g>
          );
        })}
      </g>
      {dim > 0.001 && <rect width={W} height={H} fill={sky} opacity={dim * 0.45} />}
    </g>
  );
};
