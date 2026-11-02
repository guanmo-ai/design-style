/**
 * 同一批 12 根纸条一路接力：
 *   海报里是球钟的辐条（墨）→ 01 Bass：弹起来、翻面（背面白），拼成《金臂人》的折线手臂 + 四周的纸条 →
 *   02 Eames：再翻回墨色、变细，拼成挂衣架的两排钢丝折线；14 颗彩球落到折线的顶点上。
 */
import React from 'react';
import {C} from '../tokens';
import {GEO} from './geo';
import {carry, covered, D2R, drop} from './kit';
import {ease, lerp, prog, rnd, wobble} from './motion';
import {Piece, type Pose} from './paper';
import {CX, CY, spokeAng} from './poster';
import {AT} from './timeline';

// ───────── 海报：辐条从钟心炸开 ─────────
const spokeOut = (i: number) => -5 + 0.9 * i;
const onClock = (i: number, t: number): Pose | null => {
  const st = spokeOut(i);
  if (t < st - 2) return null;
  const L = GEO.spokeLen[i];
  const e = ease.out(prog(t, st, 10));
  const r = lerp(L * 0.12, L / 2, e);
  const th = spokeAng(i) * D2R;
  return {x: CX + r * Math.cos(th), y: CY + r * Math.sin(th), a: spokeAng(i) + wobble(t, st + 10, 2, 14, 7), h: 4 + 14 * (1 - e)};
};

// ───────── 01 Bass：折线手臂 7 节 + 四周 5 根 ─────────
const ARM: [number, number][] = [[230, 1160], [470, 850], [410, 795], [760, 560], [700, 500], [1040, 330], [990, 280], [1360, 120]];
const BASS_BARS = [
  {x: 1380, y: 640, a: 0, sx: 1.5},
  {x: 1640, y: 470, a: 90, sx: 1.6},
  {x: 340, y: 300, a: 0, sx: 1.4},
  {x: 1500, y: 700, a: 0, sx: 1.9},
  {x: 1150, y: 880, a: 90, sx: 1.2},
];
const bassLand = (i: number) => (i < 7 ? AT.bass + 6 + 1.6 * i : AT.bass + 17 + 6.25 * (i - 7));
const bassTarget = (i: number): Pose => {
  if (i < 7) {
    const [x0, y0] = ARM[i];
    const [x1, y1] = ARM[i + 1];
    return {x: (x0 + x1) / 2, y: (y0 + y1) / 2, a: Math.atan2(y1 - y0, x1 - x0) / D2R, sx: (Math.hypot(x1 - x0, y1 - y0) + 30) / GEO.spokeLen[i], h: 4};
  }
  const b = BASS_BARS[i - 7];
  return {x: b.x, y: b.y, a: b.a, sx: b.sx, h: 4};
};

// ───────── 02 Eames：两排钢丝折线（各 6 节）+ 14 颗球 ─────────
const vtx = (r: number, k: number) => ({x: 420 + 180 * k, y: (r === 0 ? 400 : 650) + (k % 2 ? 70 : -70)});
const wireLand = (i: number) => AT.eames + 8 + 1.2 * i;
const wireTarget = (i: number): Pose => {
  const r = Math.floor(i / 6);
  const k = i % 6;
  const a = vtx(r, k);
  const b = vtx(r, k + 1);
  return {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, a: Math.atan2(b.y - a.y, b.x - a.x) / D2R, sx: (Math.hypot(b.x - a.x, b.y - a.y) + 18) / GEO.spokeLen[i], sy: 0.55, h: 4};
};
export const EAMES_COL = [C.red, C.sun, C.pink, C.blue, C.ink, C.paper, C.sun, C.red, C.sun, C.pink, C.blue, C.ink, C.paper, C.red];
/** 02 → 03 接力的那颗蓝球 */
export const RELAY_BALL = 10;
export const eamesBallPose = (j: number, t: number) => {
  const r = Math.floor(j / 7);
  const v = vtx(r, j % 7);
  return drop(t, AT.eames + 22 + 2.5 * j, 11, 90, v.x, v.y, -40, 0, 0, -30);
};

const lift1 = (i: number) => AT.lift + 0.5 * i;
const lift2 = (i: number) => AT.sheet2 - 6 + 0.6 * i;

/** 一根纸条这一刻的样子：在哪一层（钟上 / 01 / 02 / 空中）、露出哪一面 */
export const spokeState = (i: number, t: number): {p: Pose; back: boolean; layer: 'poster' | 'bass' | 'eames' | 'air'} | null => {
  const c = onClock(i, t);
  if (!c) return null;
  if (t < lift1(i)) return {p: c, back: false, layer: 'poster'};
  const b = bassLand(i);
  if (t < b) {
    const {p, back} = carry(t, lift1(i), b, onClock(i, lift1(i))!, bassTarget(i), {flip: true, hmax: 70, swing: 220 * (rnd(i, 5) - 0.5), seed: rnd(i, 6) * 6.28});
    return {p, back, layer: 'air'};
  }
  if (t < lift2(i)) {
    const {p} = carry(t, lift1(i), b, onClock(i, lift1(i))!, bassTarget(i), {flip: true});
    return {p, back: true, layer: 'bass'};
  }
  const w = wireLand(i);
  const from = carry(lift2(i), lift1(i), b, onClock(i, lift1(i))!, bassTarget(i), {flip: true}).p;
  const {p, back} = carry(t, lift2(i), w, {...from, sy: 1}, wireTarget(i), {flip: true, hmax: 60, swing: 160 * (rnd(i, 8) - 0.5), seed: rnd(i, 9) * 6.28});
  return {p, back: !back, layer: t < w ? 'air' : 'eames'};
};

const SpokeLayer: React.FC<{t: number; layer: string}> = ({t, layer}) => (
  <>
    {Array.from({length: 12}, (_, i) => {
      const s = spokeState(i, t);
      if (!s || s.layer !== layer) return null;
      return <Piece key={i} d={GEO.spokes[i]} fill={s.back ? C.paper : C.ink} p={s.p} />;
    })}
  </>
);
export const PosterSpokes: React.FC<{t: number}> = ({t}) => <SpokeLayer t={t} layer="poster" />;
export const AirSpokes: React.FC<{t: number}> = ({t}) => <SpokeLayer t={t} layer="air" />;

// ───────── 年份大字（每章一个，手剪，十六分音符拍下去） ─────────
type Letters = {letters: readonly {d: string; x: number; y: number}[]};
export const yearPose = (g: Letters, i: number, t: number, t0: number, x: number, y: number) => {
  const L = g.letters[i];
  return drop(t, t0 + 4 * i, 10, 140, x + L.x, y + L.y, (rnd(i + x, 3) - 0.5) * 30, (rnd(i + x, 8) - 0.5) * 5, 0, -60);
};
export const Year: React.FC<{g: Letters; t: number; t0: number; x: number; y: number; fill: string}> = ({g, t, t0, x, y, fill}) => (
  <>
    {g.letters.map((L, i) => {
      const p = yearPose(g, i, t, t0, x, y);
      return p ? <Piece key={i} d={L.d} fill={fill} p={p} /> : null;
    })}
  </>
);

export const Ch01: React.FC<{t: number}> = ({t}) => (
  <>
    <SpokeLayer t={t} layer="bass" />
    <Year g={GEO.y1955} t={t} t0={AT.bass + 44} x={1280} y={1010} fill={C.paper} />
  </>
);

export const Ch02: React.FC<{t: number}> = ({t}) => (
  <>
    <SpokeLayer t={t} layer="eames" />
    {EAMES_COL.map((col, j) => {
      if (j === RELAY_BALL && t >= AT.sheet3 - 8) return null;
      const p = eamesBallPose(j, t);
      return p ? <Piece key={j} d={GEO.balls[j % 12]} fill={col} p={p} /> : null;
    })}
    <Year g={GEO.y1953} t={t} t0={AT.eames + 58} x={1320} y={1010} fill={C.paper} />
  </>
);

export const spokesPts = (t: number): (Pose | null)[] => {
  const out: (Pose | null)[] = [];
  for (let i = 0; i < 12; i++) {
    const s = spokeState(i, t);
    out.push(s?.p ?? null);
    if (s) {
      const a = (s.p.a ?? 0) * D2R;
      const L = (GEO.spokeLen[i] / 2) * (s.p.sx ?? 1);
      out.push({x: s.p.x + L * Math.cos(a), y: s.p.y + L * Math.sin(a)});
    }
  }
  for (let j = 0; j < 14; j++) out.push(eamesBallPose(j, t));
  for (let i = 0; i < 4; i++) {
    out.push(yearPose(GEO.y1955, i, t, AT.bass + 44, 1280, 1010));
    out.push(yearPose(GEO.y1953, i, t, AT.eames + 58, 1320, 1010));
  }
  return out;
};

export const spokesFocus = (t: number): {p: Pose | null; fill: string} => {
  if (t < AT.eames) {
    const s = spokeState(3, t);
    return {p: s?.p ?? null, fill: s?.back ? C.paper : C.ink};
  }
  if (t < AT.eames + 20) {
    const s = spokeState(5, t);
    return {p: s?.p ?? null, fill: s?.back ? C.paper : C.ink};
  }
  const j = Math.max(0, Math.min(13, Math.floor((t - AT.eames - 22 + 11) / 2.5)));
  return {p: eamesBallPose(j, t), fill: EAMES_COL[j]};
};

export const isCovered = covered;
