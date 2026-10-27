/**
 * 013 · Art Deco —— 03 阶梯：夜里的天际线。
 * 三层纵深（远 z 2600 · 中 1700 · 近 1150）+ 主楼（z 1000）。楼从外往里成对升起，主楼最后、落在拍点上；
 * 四道探照灯两两镜像交叉扫；镜头贴着主楼外墙一路上升（窗户成排掠过，年份从 1925 数到 1939），
 * 到楼顶拱冠一层层亮起、尖顶射出、探照灯汇到尖顶上；然后猛地拉远，整片天际线进画。
 */
import React from 'react';
import {random} from 'remotion';
import {E, spr, tween} from '../../../src/lib/anim';
import {C, FONT} from '../tokens';
import {AT} from './timeline';
import {RISE} from './tower';
import {AX, Diamond, Flare, G, H, Plaque, Streak, T, W, flareK, mix} from './ui';

const F = 1000;
const GROUND = 260;
const C0 = AT.city;

// ───────── 镜头 ─────────
export const cityCam = (f: number) => {
  const push = tween(f, C0 + 110, 40, 0, 1, E.inOut);
  const up = tween(f, C0 + 110, 96, 0, 1, E.inOut);
  const back = tween(f, C0 + 238, 46, 0, 1, E.inOut);
  const z = 380 * push + (-1500 - 380) * back;
  const y = -1800 * up + (-890 + 1800) * back;
  return {y, z};
};
const proj = (cam: {y: number; z: number}, z: number) => {
  const s = F / (z - cam.z);
  return {s, tf: `translate(${AX} ${540 - cam.y * s}) scale(${s})`};
};

// ───────── 楼 ─────────
type Crown = 'arc' | 'step' | 'pyr' | 'spire';
type Bld = {x: number; hw: number; h: number; crown: Crown; seed: string; at: number};

/** 一排窗户合成一条 path：一栋楼只有两个元素，几千扇窗也不慢 */
const windows = (b: Bld, x0: number, x1: number, y0: number, y1: number, f: number, q: number) => {
  let on = '';
  let dim = '';
  const cw = q === 2 ? 22 : 34;
  const rh = q === 2 ? 30 : 44;
  const ww = q === 2 ? 9 : 12;
  const wh = q === 2 ? 14 : 18;
  for (let y = y1 - rh; y > y0 + 10; y -= rh) {
    for (let x = x0 + 14; x < x1 - 14 - ww; x += cw) {
      const r = random(`${b.seed}${x}|${y}`);
      if (r < 0.52) continue;
      // 楼落稳以后，窗户一盏一盏亮起来
      const t = b.at + 18 + random(`${b.seed}t${x}|${y}`) * 60;
      if (f < t) continue;
      const rect = `M${x.toFixed(0)} ${y.toFixed(0)}h${ww}v${wh}h${-ww}Z`;
      if (r > 0.82) on += rect;
      else dim += rect;
    }
  }
  return {on, dim};
};

const Tower: React.FC<{b: Bld; f: number; q: number; tint: string}> = ({b, f, q, tint}) => {
  const g = f < b.at ? 0 : spr(f, b.at, RISE);
  if (g <= 0) return null;
  const tiers = [1, 0.78, 0.58, 0.42].map((k, i) => ({hw: b.hw * k, top: GROUND - b.h * [0.6, 0.8, 0.92, 1][i]}));
  const sw = q === 2 ? 3 : q === 1 ? 2.4 : 2;
  const fill = q === 0 ? tint : 'url(#shaft)';
  const out: React.ReactNode[] = [];
  let base = GROUND;
  tiers.forEach((t, i) => {
    out.push(<rect key={`t${i}`} x={b.x - t.hw} y={t.top} width={2 * t.hw} height={base - t.top} fill={fill} stroke={G} strokeWidth={sw} opacity={q === 0 ? 0.9 : 1} />);
    if (q > 0) {
      out.push(<path key={`c${i}`} d={`M${b.x} ${t.top + 12} V${base}`} stroke={G} strokeWidth={sw * 0.6} opacity={0.6} />);
      const w = windows(b, b.x - t.hw, b.x + t.hw, t.top, base, f, q);
      out.push(<path key={`wo${i}`} d={w.on} fill={C.goldLt} opacity={0.9} />);
      out.push(<path key={`wd${i}`} d={w.dim} fill={C.gold} opacity={0.38} />);
    }
    base = t.top;
  });
  const top = tiers[3].top;
  const hw = tiers[3].hw;
  if (b.crown === 'arc') {
    [0, 1, 2].forEach((i) => {
      const r = hw * (0.9 - i * 0.25);
      const y = top - i * hw * 0.3;
      out.push(<path key={`a${i}`} d={`M${b.x - r} ${y} A${r} ${r} 0 0 1 ${b.x + r} ${y} Z`} fill={fill} stroke={G} strokeWidth={sw} />);
    });
    out.push(<path key="sp" d={`M${b.x - 3} ${top - hw} L${b.x} ${top - hw * 2.4} L${b.x + 3} ${top - hw} Z`} fill={G} />);
  } else if (b.crown === 'step') {
    [0, 1, 2].forEach((i) => {
      const w = hw * (0.75 - i * 0.22);
      const y = top - (i + 1) * hw * 0.32;
      out.push(<rect key={`s${i}`} x={b.x - w} y={y} width={2 * w} height={hw * 0.32} fill={fill} stroke={G} strokeWidth={sw} />);
    });
  } else if (b.crown === 'pyr') {
    out.push(<path key="p" d={`M${b.x - hw} ${top} L${b.x} ${top - hw * 1.7} L${b.x + hw} ${top} Z`} fill={q === 0 ? mix(C.emerald, C.onyx, 0.5) : C.emerald} stroke={G} strokeWidth={sw} />);
  } else {
    out.push(<path key="n" d={`M${b.x - hw * 0.35} ${top} L${b.x} ${top - hw * 3} L${b.x + hw * 0.35} ${top} Z`} fill={G} />);
  }
  return <g transform={`translate(0 ${(1 - g) * (b.h * 1.2 + 80)})`}>{out}</g>;
};

/** 一层楼：左右成对，从外往里升起 */
const layer = (n: number, xs: number[], hws: number[], hs: number[], crowns: Crown[], t0: number, step: number, tag: string): Bld[] => {
  const out: Bld[] = [];
  xs.forEach((x, i) => {
    const at = t0 + (xs.length - 1 - i) * step;
    [-1, 1].forEach((side) => out.push({x: side * x, hw: hws[i], h: hs[i], crown: crowns[i % crowns.length], seed: `${tag}${i}${side}`, at}));
  });
  void n;
  return out;
};
const FAR = layer(0, [380, 900, 1450, 2050, 2700, 3400], [120, 150, 110, 160, 130, 150], [900, 700, 1050, 760, 950, 700], ['pyr', 'arc', 'step', 'spire'], C0 + 2, 3, 'f');
const MID = layer(1, [520, 1050, 1600, 2250, 2900], [140, 170, 130, 160, 150], [1150, 850, 1000, 780, 900], ['step', 'spire', 'arc', 'pyr'], C0 + 14, 4, 'm');
const NEAR = layer(2, [470, 880, 1400, 2000], [160, 140, 170, 150], [1250, 900, 1050, 800], ['arc', 'step', 'pyr'], C0 + 30, 5, 'n');

// ───────── 主楼 ─────────
const HERO = {
  tiers: [
    {hw: 240, top: -700},
    {hw: 185, top: -1250},
    {hw: 135, top: -1560},
    {hw: 100, top: -1700},
  ],
  at: C0 + 60,
};
const crownArcs = [0, 1, 2, 3, 4].map((i) => ({hw: 92 - i * 16, b: -1700 - i * 50}));
const CROWN_TOP = crownArcs[4].b - 18 - crownArcs[4].hw;
const SPIRE_TOP = -2120;
const arcHalf = (i: number) => {
  const {hw, b} = crownArcs[i];
  return `M0 ${b - 18 - hw} A${hw} ${hw} 0 0 1 ${hw} ${b - 18} V${b}`;
};
const CR = C0 + 206; // 拱冠开始亮

const Hero: React.FC<{f: number}> = ({f}) => {
  const g = f < HERO.at ? 0 : spr(f, HERO.at, {damping: 17, mass: 0.7, stiffness: 200});
  if (g <= 0) return null;
  const b: Bld = {x: 0, hw: 240, h: 2000, crown: 'arc', seed: 'hero', at: HERO.at};
  const out: React.ReactNode[] = [];
  let base = GROUND;
  HERO.tiers.forEach((t, i) => {
    out.push(<rect key={`t${i}`} x={-t.hw} y={t.top} width={2 * t.hw} height={base - t.top} fill="url(#shaft)" stroke={G} strokeWidth={4} />);
    // 竖肋：三根一组，贴着两边
    [-1, 1].forEach((side) =>
      [0, 1, 2].forEach((k) => out.push(<path key={`r${i}${side}${k}`} d={`M${side * (t.hw - 16 - k * 8)} ${t.top + 20} V${base}`} stroke={G} strokeWidth={k ? 1.2 : 2.4} opacity={0.8} />)),
    );
    out.push(<path key={`ax${i}`} d={`M0 ${t.top + 20} V${base}`} stroke={G} strokeWidth={3.2} />);
    // 每一级顶上一圈人字纹
    const n = Math.round((t.hw * 2) / 40);
    const pts = Array.from({length: n + 1}, (_, k) => `${-t.hw + (k * 2 * t.hw) / n},${t.top + 22 + (k % 2 ? 14 : 0)}`).join(' ');
    out.push(<polyline key={`ch${i}`} points={pts} fill="none" stroke={G} strokeWidth={2.4} />);
    const w = windows(b, -t.hw + 30, t.hw - 30, t.top + 40, base, f, 2);
    out.push(<path key={`wo${i}`} d={w.on} fill={C.goldLt} opacity={0.92} />);
    out.push(<path key={`wd${i}`} d={w.dim} fill={C.gold} opacity={0.38} />);
    base = t.top;
  });
  // 拱冠：一层层亮起来
  const spire = tween(f, CR + 12, 14, 0, 1, E.out);
  out.push(<path key="spire" d={`M-7 ${CROWN_TOP + 10} L0 ${CROWN_TOP + 10 + (SPIRE_TOP - CROWN_TOP - 10) * spire} L7 ${CROWN_TOP + 10} Z`} fill={G} />);
  [4, 3, 2, 1, 0].forEach((i) => {
    const {hw, b: y} = crownArcs[i];
    const lit = tween(f, CR + i * 3, 10);
    out.push(
      <g key={`cr${i}`}>
        <path d={`M${-hw} ${y} V${y - 18} A${hw} ${hw} 0 0 1 ${hw} ${y - 18} V${y} Z`} fill="url(#shaft)" stroke={G} strokeWidth={3.4} />
        {[0, 1, 2, 3, 4].map((k) => {
          const a = Math.PI + (Math.PI * (k + 0.5)) / 5;
          const r0 = hw * 0.55;
          const r1 = hw * 0.82;
          const Pp = (r: number, t: number) => `${(r * Math.cos(t)).toFixed(1)} ${(y - 18 + r * Math.sin(t)).toFixed(1)}`;
          return <path key={k} d={`M${Pp(r1, a)} L${Pp(r0, a - 0.17)} L${Pp(r0, a + 0.17)} Z`} fill={mix(C.goldLt, C.onyx2, 0.25 + 0.75 * lit)} />;
        })}
        <Streak d={arcHalf(i)} p={tween(f, CR + i * 3, 16)} w={3} len={0.3} />
        <Streak d={arcHalf(i)} p={tween(f, CR + i * 3, 16)} w={3} len={0.3} tf="scale(-1 1)" />
      </g>,
    );
  });
  out.push(<Diamond key="kd" x={0} y={CROWN_TOP + 4} r={10} fill={C.goldLt} />);
  return <g transform={`translate(0 ${(1 - g) * 2500})`}>{out}</g>;
};

// ───────── 探照灯 ─────────
const Beam: React.FC<{x: number; y: number; ang: number; op: number; len: number}> = ({x, y, ang, op, len}) => (
  <g transform={`translate(${x} ${y}) rotate(${ang})`} opacity={op}>
    <path d={`M-6 0 L-130 ${-len} L130 ${-len} L6 0 Z`} fill="url(#beam)" />
    <path d={`M0 0 L0 ${-len}`} stroke="url(#beamCore)" strokeWidth={3} />
  </g>
);

const YearDial: React.FC<{f: number}> = ({f}) => {
  const v = tween(f, C0 + 116, 14) * (1 - tween(f, C0 + 204, 10));
  if (v <= 0) return null;
  const p = tween(f, C0 + 120, 80, 0, 1, E.inOut);
  const year = Math.round(1925 + 14 * p);
  const city = year < 1929 ? '巴黎 · 博览会' : year < 1930 ? '上海 · 外滩' : year < 1939 ? '纽约 · 摩天楼' : '纽约 · 世博会';
  const a = Math.PI + Math.PI * (0.06 + 0.88 * p);
  const cx = AX;
  const cy = 200;
  return (
    <g opacity={v}>
      <path d={`M${cx - 120} ${cy} A120 120 0 0 1 ${cx + 120} ${cy} Z`} fill={C.onyx} stroke={G} strokeWidth={4} />
      <path d={`M${cx - 104} ${cy} A104 104 0 0 1 ${cx + 104} ${cy}`} fill="none" stroke={G} strokeWidth={1.4} />
      {Array.from({length: 15}, (_, k) => {
        const t = Math.PI + Math.PI * (0.06 + (0.88 * k) / 14);
        const r0 = k % 5 === 0 ? 80 : 90;
        return <path key={k} d={`M${cx + r0 * Math.cos(t)} ${cy + r0 * Math.sin(t)} L${cx + 100 * Math.cos(t)} ${cy + 100 * Math.sin(t)}`} stroke={G} strokeWidth={k % 5 === 0 ? 2.4 : 1.2} />;
      })}
      <path d={`M${cx} ${cy} L${cx + 96 * Math.cos(a)} ${cy + 96 * Math.sin(a)}`} stroke={C.goldLt} strokeWidth={4} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={9} fill={G} />
      <rect x={cx - 170} y={cy + 8} width={340} height={120} fill={C.onyx} />
      <T x={cx} y={cy + 76} size={68} family={FONT.display} fill={G} ls={0.12} anchor="middle">
        {String(year)}
      </T>
      <T x={cx} y={cy + 116} size={30} family={FONT.serif} weight={600} fill={C.ivory} ls={0.2} anchor="middle">
        {city}
      </T>
    </g>
  );
};

export const City: React.FC<{f: number}> = ({f}) => {
  if (f < C0 - 2 || f > AT.rules + 30) return null;
  const cam = cityCam(f);
  const L = (z: number) => proj(cam, z);
  const far = L(2600);
  const mid = L(1700);
  const near = L(1150);
  const hero = L(1000);
  const spire = {x: AX, y: 540 + (SPIRE_TOP - cam.y) * hero.s};
  // 探照灯：两对，左右镜像；最后汇到尖顶
  const beamOp = tween(f, C0 + 40, 30) * 0.9;
  const conv = tween(f, CR + 4, 30, 0, 1, E.inOut);
  const beams: React.ReactNode[] = [];
  [
    {x: 640, sw: 16, ph: 0.0, w: 0.055},
    {x: 1350, sw: 34, ph: 1.3, w: 0.047},
  ].forEach((b, i) => {
    const bx = b.x * mid.s;
    const by = 540 + (GROUND - cam.y) * mid.s;
    [-1, 1].forEach((side) => {
      const sweep = side * (b.sw + 14 * Math.sin(b.w * (f - C0) + b.ph));
      const x = AX + side * bx;
      const toSpire = (Math.atan2(spire.x - x, by - spire.y) * 180) / Math.PI;
      const ang = sweep + (toSpire - sweep) * conv;
      beams.push(<Beam key={`${i}${side}`} x={x} y={by} ang={ang} op={beamOp} len={2600} />);
    });
  });
  const dim = tween(f, AT.rules, 18) * 0.78;
  return (
    <g>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#060607" />
          <stop offset="0.5" stopColor={mix(C.gold, C.onyx, 0.16)} />
          <stop offset="1" stopColor={C.onyx} />
        </linearGradient>
        <linearGradient id="beam" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={C.goldLt} stopOpacity={0.34} />
          <stop offset="0.6" stopColor={C.goldLt} stopOpacity={0.08} />
          <stop offset="1" stopColor={C.goldLt} stopOpacity={0} />
        </linearGradient>
        <linearGradient id="beamCore" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#FFF6DC" stopOpacity={0.8} />
          <stop offset="1" stopColor="#FFF6DC" stopOpacity={0} />
        </linearGradient>
        <clipPath id="ground">
          <rect x={-6000} y={-9000} width={12000} height={9000 + GROUND} />
        </clipPath>
      </defs>
      <rect x={0} y={0} width={W} height={540} fill="url(#sky)" />
      <circle cx={AX} cy={540} r={170} fill="url(#sunDisc)" />
      <rect x={0} y={540} width={W} height={H - 540} fill={C.onyx} />
      <path d={`M0 540 H${W}`} stroke={G} strokeWidth={2} opacity={0.7} />
      <g transform={far.tf} clipPath="url(#ground)">
        {FAR.map((b) => (
          <Tower key={b.seed} b={b} f={f} q={0} tint={mix(C.emerald, C.onyx, 0.35)} />
        ))}
      </g>
      {beams}
      <g transform={mid.tf} clipPath="url(#ground)">
        {MID.map((b) => (
          <Tower key={b.seed} b={b} f={f} q={1} tint={C.onyx2} />
        ))}
      </g>
      <g transform={near.tf} clipPath="url(#ground)">
        {NEAR.map((b) => (
          <Tower key={b.seed} b={b} f={f} q={2} tint={C.onyx2} />
        ))}
      </g>
      <g transform={hero.tf} clipPath="url(#ground)">
        <Hero f={f} />
      </g>
      <Flare x={spire.x} y={spire.y} k={flareK(f, CR + 26, 50) * 1.3} />
      <Flare x={AX} y={540 + (GROUND - cam.y) * hero.s} k={flareK(f, HERO.at + 14, 30) * 0.8} />
      {dim > 0 && <rect width={W} height={H} fill={C.onyx} opacity={dim} />}
      <YearDial f={f} />
      <Plaque f={f} at={C0 + 66} out={C0 + 132} title="阶梯收分" sub="越往上越窄，转角用台阶" />
      <Plaque f={f} at={C0 + 138} out={C0 + 206} title="来历" sub="巴黎 1925 → 上海 → 纽约 1939" />
      <Plaque f={f} at={C0 + 212} out={AT.rules + 6} title="中轴对称" sub="尖顶永远落在正中" />
    </g>
  );
};
