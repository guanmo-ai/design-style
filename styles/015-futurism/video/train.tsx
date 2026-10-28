/**
 * 05 机器 · 塞维里尼《郊区火车抵达巴黎》1915（496—612，黑底）
 *
 *   ≤502   火车以 70 px/帧 冲进来（残影很长）；502—552 匀减速刹停（a = −1.4）：残影一层层收回车身
 *   轮子按走过的距离转（θ = 距离 / 半径），连杆跟着曲柄走；轮子的残影是“转动 + 平移”的
 *   烟：每 4 帧从烟囱冒一团，冒出来就留在空气里——烟团的间距 = 速度 × 4 帧，刹车时越来越密
 *   TA：轮子每转一圈喊一声，字号和字宽 = 那一刻的速度（越来越小、越来越窄）；停下 PSSSH
 *   车头经过的地方，背景碎成塞维里尼的彩色棱面（落地带 5% 过冲）
 *   566—   停车后的一股蒸汽直直往上冲，镜头跟着它上摇，冲进天空（钴蓝）→ 下一章
 */
import React from 'react';
import {C} from '../tokens';
import {Echoes, ForceLines, W, Word, echoCount, mixHex, wdthOf} from './kit';
import {clamp, ease, follow, kin, land, lerp, prog, vel} from './motion';

const RAIL = 860;
const STOP = 552;
const FX1 = 1660;
export const trainX = (t: number) => kin(t, FX1 - 1750, 70, [[502, -1.4], [STOP, 0]]);
const trainV = (t: number) => vel(trainX, t);
const WHEELS = [
  {x: -760, r: 92},
  {x: -560, r: 92},
  {x: -360, r: 92},
  {x: -210, r: 54},
];

/* ───────── 镜头：停车后跟着蒸汽上摇进天空 ───────── */
const steamY = (t: number) => (t < 562 ? RAIL - 480 : RAIL - 480 - 0.5 * 2.6 * (t - 562) * (t - 562));
export const trainCam = (t: number) => {
  const e = ease.in(prog(t, 568, 34));
  return {cy: lerp(540, follow(steamY, t, 3, 1) - 40, e)};
};
const camStr = (t: number) => `translate(0 ${(540 - trainCam(t).cy).toFixed(2)})`;
export const SKY_Y = -200; // 这条线以上是天（钴蓝）

/* ───────── 火车 ───────── */
const f1 = (v: number) => v.toFixed(1);
const Loco: React.FC<{t: number; k: number}> = ({t, k}) => {
  const x = trainX(t);
  const d = x - (FX1 - 1750);
  const echo = k > 0;
  const body = echo ? C.orange : C.silver;
  const cab = echo ? C.orange : C.orange;
  const wheel = echo ? C.orange : C.paperHi;
  const ang = (r: number) => d / r;
  const pin = (w: (typeof WHEELS)[number]) => {
    const a = ang(w.r);
    return [x + w.x + Math.cos(a) * w.r * 0.55, RAIL - w.r - 6 + Math.sin(a) * w.r * 0.55];
  };
  const p0 = pin(WHEELS[0]);
  const p2 = pin(WHEELS[2]);
  return (
    <g>
      {/* 车身 */}
      <rect x={x - 1020} y={RAIL - 500} width={250} height={350} fill={cab} />
      {!echo && <rect x={x - 980} y={RAIL - 450} width={110} height={110} fill={C.ink} />}
      <rect x={x - 820} y={RAIL - 380} width={640} height={230} fill={body} />
      <circle cx={x - 180} cy={RAIL - 265} r={115} fill={echo ? body : mixHex(C.silver, C.paperHi, 0.5)} />
      <rect x={x - 330} y={RAIL - 500} width={70} height={130} fill={body} />
      <rect x={x - 346} y={RAIL - 520} width={102} height={30} fill={body} />
      <rect x={x - 1020} y={RAIL - 160} width={900} height={46} fill={echo ? body : mixHex(C.silver, C.ink, 0.35)} />
      <polygon points={`${f1(x - 140)},${RAIL - 150} ${f1(x + 10)},${RAIL - 6} ${f1(x - 140)},${RAIL - 6}`} fill={echo ? body : C.cobalt} />
      {/* 轮子：按走过的距离转 */}
      {WHEELS.map((w, i) => {
        const a = ang(w.r);
        const cx = x + w.x;
        const cy = RAIL - w.r - 6;
        return (
          <g key={i} stroke={wheel} fill="none">
            <circle cx={f1(cx)} cy={f1(cy)} r={w.r - 6} strokeWidth={12} />
            {[0, 1, 2, 3, 4, 5].map((j) => {
              const b = a + (j * Math.PI) / 3;
              return <line key={j} x1={f1(cx)} y1={f1(cy)} x2={f1(cx + Math.cos(b) * (w.r - 8))} y2={f1(cy + Math.sin(b) * (w.r - 8))} strokeWidth={6} />;
            })}
          </g>
        );
      })}
      {/* 连杆 */}
      <line x1={f1(p0[0])} y1={f1(p0[1])} x2={f1(p2[0])} y2={f1(p2[1])} stroke={echo ? body : C.orange} strokeWidth={16} strokeLinecap="round" />
    </g>
  );
};

/* ───────── 烟：每 4 帧冒一团，冒出来就不再跟车走 ───────── */
const PUFF_DT = 4;
const Puffs: React.FC<{t: number}> = ({t}) => {
  const out: React.ReactNode[] = [];
  for (let e = 470; e <= Math.min(t, 560); e += PUFF_DT) {
    const age = t - e;
    const x = trainX(e) - 295;
    const y = RAIL - 520 - 2.4 * age - 0.02 * age * age;
    const r = 22 + 5.5 * Math.pow(age, 0.7);
    const grow = clamp(age / 5);
    out.push(<circle key={e} cx={f1(x - 0.8 * age)} cy={f1(y)} r={f1(r * ease.out(grow))} fill={C.paperHi} />);
  }
  return <>{out}</>;
};

/* ───────── TA：轮子每转一圈一声 ───────── */
const TAS: {t: number; x: number; v: number}[] = (() => {
  const out: {t: number; x: number; v: number}[] = [];
  const C0 = Math.PI * 92; // 每半圈一声
  let next = 0;
  for (let t = 500; t < STOP; t += 0.05) {
    const d = trainX(t) - (FX1 - 1750);
    if (d >= next) {
      out.push({t, x: trainX(t), v: trainV(t)});
      next = (Math.floor(d / C0) + 1) * C0;
    }
  }
  return out.filter((a) => a.x > 420);
})();
const Tas: React.FC<{t: number}> = ({t}) => (
  <>
    {TAS.map((a, i) => {
      if (t < a.t) return null;
      const pop = land(t, a.t, 8);
      const size = 40 + 1.9 * a.v;
      return (
        <g key={i} transform={`translate(${f1(a.x - 260)} ${f1(RAIL - 560 - (t - a.t) * 0.8)}) scale(${f1(0.6 + 0.4 * pop)})`}>
          <Word text="TA" x={0} y={0} size={size} wdth={wdthOf(a.v)} fill={i % 2 ? C.orange : C.paperHi} anchor="middle" />
        </g>
      );
    })}
    {t >= STOP + 2 && (
      <g transform={`translate(${FX1 - 360} ${RAIL - 640}) scale(${f1(0.6 + 0.4 * land(t, STOP + 2, 10))})`}>
        <Word text="PSSSH" x={0} y={0} size={120} wdth={62} wght={800} fill={C.silver} anchor="middle" />
      </g>
    )}
  </>
);

/* ───────── 塞维里尼的棱面：车头经过时碎出来 ───────── */
const SHARDS = (() => {
  const cols = [C.cobalt, mixHex(C.ink, C.cobalt, 0.55), mixHex(C.ink, C.orange, 0.55), mixHex(C.ink, C.silver, 0.3), mixHex(C.ink, C.cobalt, 0.8)];
  const out: {pts: [number, number][]; at: number; fill: string; cx: number; cy: number}[] = [];
  for (let i = 0; i < 16; i++) {
    const cx = 80 + i * 118 + ((i * 37) % 50);
    const up = i % 2 === 0;
    const h = 260 + ((i * 71) % 280);
    const w = 180 + ((i * 53) % 160);
    const y0 = up ? RAIL - 120 : RAIL - 180 - h * 0.4;
    const pts: [number, number][] = up
      ? [
          [cx - w / 2, y0],
          [cx + w * 0.7, y0 - 40],
          [cx + w * 0.1, y0 - h],
        ]
      : [
          [cx - w * 0.6, y0 - h * 0.5],
          [cx + w * 0.6, y0 - h * 0.9],
          [cx + w * 0.3, y0 + 40],
        ];
    let at = 0;
    for (let t = 495; t < 600; t += 0.5) if (trainX(t) >= cx) { at = t; break; }
    out.push({pts, at: at || 1e9, fill: cols[i % cols.length], cx, cy: y0 - h / 2});
  }
  return out;
})();
const Shards: React.FC<{t: number}> = ({t}) => (
  <>
    {SHARDS.map((s, i) => {
      const g = land(t, s.at + 1, 14);
      if (g <= 0.001) return null;
      return (
        <polygon
          key={i}
          points={s.pts.map((p) => `${f1(s.cx + (p[0] - s.cx) * g)},${f1(s.cy + (p[1] - s.cy) * g)}`).join(' ')}
          fill={s.fill}
          transform={`rotate(${f1((1 - Math.min(1, g)) * -25)} ${f1(s.cx)} ${f1(s.cy)})`}
        />
      );
    })}
  </>
);

export const Train: React.FC<{t: number}> = ({t}) => {
  const v = trainV(t);
  return (
    <g transform={camStr(t)}>
      <rect x={-200} y={-3000} width={W + 400} height={3000 + SKY_Y} fill={C.cobalt} />
      <Shards t={t} />
      <rect x={-200} y={RAIL} width={W + 400} height={14} fill={C.silver} />
      {Array.from({length: 26}, (_, i) => (
        <rect key={i} x={i * 80 - 40} y={RAIL + 22} width={44} height={14} fill={mixHex(C.ink, C.silver, 0.4)} />
      ))}
      <Puffs t={t} />
      <ForceLines front={{x: trainX(t) + 20, y: RAIL - 260}} dir={0} v={v} spec={[{off: -260, w: 90, fill: C.orange}, {off: -60, w: 40, fill: C.paperHi}, {off: 120, w: 70, fill: C.cobalt}]} kLen={14} gap={-10} />
      <Echoes t={t} state={(u) => [trainX(u)]} render={(u, k) => <Loco t={u} k={k} />} />
      <Tas t={t} />
      {/* 停车后往上冲的那股蒸汽：镜头跟着它进天空 */}
      {t >= 562 && <circle cx={FX1 - 300} cy={steamY(t)} r={60 + 2.4 * (t - 562)} fill={C.paperHi} />}
    </g>
  );
};

export const trainProbe = (t: number) => {
  if (t >= 566) {
    const v = Math.abs(vel(steamY, t));
    return {v, wdth: wdthOf(v), n: echoCount(t, (u) => [steamY(u)], 3)};
  }
  const v = trainV(t);
  return {v, wdth: wdthOf(v), n: echoCount(t, (u) => [trainX(u)], 3)};
};
export const trainSpeed = (t: number) => Math.max(Math.abs(trainV(t)), Math.abs(vel((u) => trainCam(u).cy, t)));
