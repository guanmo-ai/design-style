/**
 * 开场 0—96：海报在 1.5 秒里搭出来（第 0 帧辐条正从钟心炸开、太阳正在落）。
 * 片尾 836—900 用同一个函数取 t − 900，海报的前奏重新落下，接回第 0 帧。
 */
import React from 'react';
import {C} from '../tokens';
import {GEO} from './geo';
import {D2R, drop} from './kit';
import {ease, lerp, prog, rnd, wobble} from './motion';
import {Piece, type Pose} from './paper';
import {AT} from './timeline';

export const CX = 960;
export const CY = 318;
export const spokeAng = (i: number) => i * 30 - 90;
export const tipOf = (i: number) => ({x: CX + GEO.spokeLen[i] * Math.cos(spokeAng(i) * D2R), y: CY + GEO.spokeLen[i] * Math.sin(spokeAng(i) * D2R)});
const BALL_COL = [C.red, C.turq, C.blue, C.sun, C.pink, C.turq, C.ink, C.blue, C.red, C.turq, C.sun, C.blue];
const MOD_X = 180;
const MOD_BASE = 1012;
export const MOD_COL = [C.red, C.blue, C.sun, C.turq, C.pink, C.ink];
export const MOD_LAND = [37.5, AT.big, 43.75, 50, 56.25, 62.5];
const MID_X = 80;

export const sunPose = (t: number) => drop(t, 4, 26, 90, 1540, 300, -18, 0, 60, -40, 1.1);
export const beanPose = (t: number): Pose => {
  const e = ease.out(prog(t, -16, 34));
  return {x: lerp(-900, 330, e), y: 840, a: lerp(8, -12, e), h: 4, s: 1.25};
};
const discPose = (t: number) => drop(t, -4, 14, 80, CX, CY, 0, 0);
const dotPose = (t: number) => drop(t, 14, 9, 60, CX, CY, 0, 0);
export const ballPose = (i: number, t: number) => {
  const tip = tipOf(i);
  return drop(t, 2 + 2.5 * i, 11, 72, tip.x, tip.y, -30, 0, 26 * Math.cos(spokeAng(i) * D2R), 26 * Math.sin(spokeAng(i) * D2R));
};
export const minuteA = (t: number) => -30 + 360 * ease.inOut(prog(t, 48, 30)) + wobble(t, 78, 3, 16, 9);
const hourA = (t: number) => -150 + 30 * ease.inOut(prog(t, 48, 30));
export const midPose = (i: number, t: number) => {
  const L = GEO.mid.letters[i];
  return drop(t, 22 + 2 * i, 12, 60, MID_X + L.x, 190 + L.y, -40, (rnd(i, 7) - 0.5) * 5, -160, 120);
};
export const centuryPose = (i: number, t: number) => {
  const L = GEO.century.letters[i];
  return drop(t, 30 + 2 * i, 12, 60, MID_X + L.x, 322 + L.y, -40, (rnd(i + 9, 7) - 0.5) * 5, -160, 120);
};
export const modPose = (i: number, t: number) => {
  const L = GEO.modern.letters[i];
  const big = i === 1;
  return drop(t, MOD_LAND[i], big ? 16 : 12, big ? 220 : 150, MOD_X + L.x, MOD_BASE + L.y, (rnd(i, 4) - 0.5) * 30, (rnd(i, 7) - 0.5) * 4, 0, -80);
};
const pop = (t: number, t0: number) => 4 + 60 * (1 - ease.in2(prog(t, t0, 9)));

/** 海报（不含辐条：辐条由 spokes.tsx 管，因为它们要一路接力到 02） */
export const Poster: React.FC<{t: number; spokes: React.ReactNode}> = ({t, spokes}) => {
  const sun = sunPose(t);
  const disc = discPose(t);
  const dot = dotPose(t);
  const balls = Array.from({length: 12}, (_, i) => ({i, p: ballPose(i, t)}));
  const e = ease.out(prog(t, 64, 16));
  const e2 = ease.out(prog(t, 70, 16));
  return (
    <>
      <rect x={-2000} y={-2000} width={6000} height={5000} fill={C.paper} />
      {sun && <Piece d={GEO.sun} fill={C.sun} p={sun} />}
      <Piece d={GEO.bean} fill={C.pink} p={beanPose(t)} />
      {t >= 70 && <Piece d={GEO.star} fill={C.blue} p={{x: 1790, y: 700, a: 10 + t * 0.4, h: pop(t, 70)}} />}
      {t >= 76 && <Piece d={GEO.starS} fill={C.red} p={{x: 1730, y: 780, a: -t * 0.6, h: pop(t, 76)}} />}
      {t >= 74 && <Piece d={GEO.starS} fill={C.turq} p={{x: 640, y: 120, a: t * 0.5, h: pop(t, 74)}} />}
      {spokes}
      {balls.filter((b) => b.p && (b.p.h ?? 4) < 10).map(({i, p}) => <Piece key={i} d={GEO.balls[i]} fill={BALL_COL[i]} p={p!} />)}
      {disc && <Piece d={GEO.disc} fill={C.ink} p={disc} />}
      {t >= 38 && <Piece d={GEO.hour} fill={C.paper} p={{x: CX, y: CY, a: hourA(t), h: 4 + 50 * (1 - ease.in2(prog(t, 38, 8)))}} />}
      {t >= 42 && <Piece d={GEO.minute} fill={C.paper} p={{x: CX, y: CY, a: minuteA(t), h: 5 + 50 * (1 - ease.in2(prog(t, 42, 8)))}} />}
      {dot && <Piece d={GEO.discDot} fill={C.sun} p={dot} />}
      {balls.filter((b) => b.p && (b.p.h ?? 4) >= 10).map(({i, p}) => <Piece key={i} d={GEO.balls[i]} fill={BALL_COL[i]} p={p!} />)}
      {GEO.mid.letters.map((L, i) => {
        const p = midPose(i, t);
        return p ? <Piece key={`a${i}`} d={L.d} fill={C.ink} p={p} /> : null;
      })}
      {GEO.century.letters.map((L, i) => {
        const p = centuryPose(i, t);
        return p ? <Piece key={`b${i}`} d={L.d} fill={C.ink} p={p} /> : null;
      })}
      {GEO.modern.letters.map((L, i) => {
        const p = modPose(i, t);
        return p ? <Piece key={`c${i}`} d={L.d} fill={MOD_COL[i]} p={p} /> : null;
      })}
      {t >= 64 && (
        <g>
          <svg x={1300} y={150} width={540} height={60} overflow="hidden">
            <text x={540} y={46 + (1 - e) * 60} textAnchor="end" fontFamily="'Noto Sans SC', sans-serif" fontWeight={900} fontSize={44} fill={C.ink} letterSpacing={14}>中世纪现代</text>
          </svg>
          <svg x={1300} y={212} width={540} height={40} overflow="hidden">
            <text x={540} y={28 + (1 - e2) * 40} textAnchor="end" fontFamily="'Jost', sans-serif" fontWeight={600} fontSize={22} fill={C.ink} letterSpacing={6}>1945 — 1965 · NO. 017</text>
          </svg>
        </g>
      )}
    </>
  );
};

export const posterPts = (t: number): (Pose | null)[] => {
  const out: (Pose | null)[] = [sunPose(t), beanPose(t)];
  for (let i = 0; i < 12; i++) out.push(ballPose(i, t));
  for (let i = 0; i < 4; i++) out.push(midPose(i, t));
  for (let i = 0; i < 7; i++) out.push(centuryPose(i, t));
  for (let i = 0; i < 6; i++) out.push(modPose(i, t));
  out.push({x: CX + 236 * Math.cos(minuteA(t) * D2R), y: CY + 236 * Math.sin(minuteA(t) * D2R)});
  return out;
};

export const posterFocus = (t: number): {p: Pose | null; fill: string} => {
  if (t < 2) return {p: sunPose(t), fill: C.sun};
  if (t < 34) {
    const i = Math.max(0, Math.min(11, Math.floor((t - 2 + 11) / 2.5)));
    return {p: ballPose(i, t), fill: BALL_COL[i]};
  }
  let k = 0;
  for (const i of [0, 2, 3, 4, 5]) if (MOD_LAND[i] - 12 <= t) k = i;
  if (t >= MOD_LAND[5]) k = 1;
  return {p: modPose(k, t), fill: MOD_COL[k]};
};
