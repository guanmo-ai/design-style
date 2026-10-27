/**
 * 013 · Art Deco —— 海报上的那座楼（局部坐标：中轴 x = 0，台基顶 y = 0，往上为负）。
 * 所有生长都由一个 SceneState 驱动：开场“收起来”、片尾“长回去”用的是同一套几何。
 */
import React from 'react';
import {E, clamp, spr, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {Diamond, G, Streak, mix, mirror} from './ui';

/** 长出来：一次约 5% 的过冲再停住 */
export const RISE = {damping: 15, mass: 0.6, stiffness: 230};
export const rise = (f: number, at: number) => (f < at ? 0 : spr(f, at, RISE));

export type SceneState = {
  plinth: number[];
  wings: number[];
  shaft: number;
  setb: number[];
  chevron: number;
  arcs: number[];
  spire: number;
  rays: number; // 0 = 收拢在中轴，1 = 完全打开
  glow: number;
  arch: number;
  sink: number; // 0 = 立着，1 = 整座楼沉进地面
};
export const FULL: SceneState = {plinth: [1, 1, 1], wings: [1, 1], shaft: 1, setb: [1, 1], chevron: 1, arcs: [1, 1, 1, 1, 1], spire: 1, rays: 1, glow: 1, arch: 1, sink: 0};

/** 片尾：整座楼按 02 的顺序重新长一遍（压缩到 1 秒） */
export const growState = (f: number, t: number): SceneState => ({
  plinth: [0, 1, 2].map((i) => rise(f, t + i * 3)),
  wings: [rise(f, t + 8), rise(f, t + 13)],
  shaft: rise(f, t + 18),
  setb: [rise(f, t + 26), rise(f, t + 31)],
  chevron: tween(f, t + 24, 16),
  arcs: [0, 1, 2, 3, 4].map((i) => rise(f, t + 36 + i * 4)),
  spire: tween(f, t + 56, 12, 0, 1, E.out),
  rays: tween(f, t - 6, 50, 0, 1, E.out),
  glow: tween(f, t, 40),
  arch: tween(f, t - 24, 40, 0, 1, E.inOut),
  sink: 0,
});

// ───────── 尺寸 ─────────
const PLINTH = [330, 365, 400];
const WINGS: [number, number][] = [
  [270, -190],
  [205, -315],
];
const SHAFT = {hw: 125, top: -480};
const SETBACKS: [number, number, number][] = [
  [96, -535, 55],
  [72, -580, 45],
];
const CROWN_BASE = -580;
export const ARCH = {hw: 470, side: 380};
const SUN = {x: 0, y: -40};
const RAYS = 11;
export const SPIRE_TIP = -960;

const Block: React.FC<{hw: number; top: number; base: number; g: number; sw?: number; children?: React.ReactNode}> = ({hw, top, base, g, sw = 2.2, children}) => {
  if (g <= 0) return null;
  return (
    <g transform={`translate(0 ${base}) scale(1 ${g}) translate(0 ${-base})`}>
      <rect x={-hw} y={top} width={2 * hw} height={base - top} fill="url(#shaft)" stroke={G} strokeWidth={sw} />
      {children}
    </g>
  );
};

const Ribs: React.FC<{hw: number; top: number; base: number}> = ({hw, top, base}) => (
  <>
    {[-1, 1].map((side) =>
      [0, 1, 2].map((k) => {
        const x = side * (hw - 22 - k * 9);
        return <path key={`${side}${k}`} d={`M${x} ${top + 18} V${base}`} stroke={G} strokeWidth={k === 0 ? 1.8 : 1} opacity={0.75} />;
      }),
    )}
  </>
);

const archPath = (hw: number, b: number, extra: number) => `M${-hw} ${b} V${b - extra} A${hw} ${hw} 0 0 1 ${hw} ${b - extra} V${b} Z`;

/** 克莱斯勒式五层拱冠 + 三角窗 + 尖顶 */
const Crown: React.FC<{arcs: number[]; spire: number}> = ({arcs, spire}) => {
  const crowns = [0, 1, 2, 3, 4].map((i) => ({hw: 58 - i * 10, b: CROWN_BASE - i * 34}));
  const top = crowns[4].b - 13 - crowns[4].hw;
  return (
    <g>
      {spire > 0 && <path d={`M-6 ${top + 8} L0 ${top + 8 - 215 * spire} L6 ${top + 8} Z`} fill={G} />}
      {[...crowns.keys()].reverse().map((i) => {
        const {hw, b} = crowns[i];
        const g = arcs[i];
        if (g <= 0) return null;
        return (
          <g key={i} transform={`translate(0 ${b}) scale(${0.6 + 0.4 * g} ${g}) translate(0 ${-b})`}>
            <path d={archPath(hw, b, 13)} fill="url(#shaft)" stroke={G} strokeWidth={2.4} />
            <path d={`M${-hw + 8} ${b - 13} A${hw - 8} ${hw - 8} 0 0 1 ${hw - 8} ${b - 13}`} fill="none" stroke={G} strokeWidth={1} />
            {hw > 30 &&
              [0, 1, 2, 3, 4].map((k) => {
                const a = Math.PI + (Math.PI * (k + 0.5)) / 5;
                const r0 = hw - 26;
                const r1 = hw - 12;
                const da = 0.18;
                const P = (r: number, t: number) => `${(r * Math.cos(t)).toFixed(1)} ${(b - 13 + r * Math.sin(t)).toFixed(1)}`;
                return <path key={k} d={`M${P(r1, a)} L${P(r0, a - da)} L${P(r0, a + da)} Z`} fill={C.goldLt} />;
              })}
          </g>
        );
      })}
    </g>
  );
};

/** 射线：像折扇一样从竖直往两边打开；外圈的最后打开、最先收拢 */
const Rays: React.FC<{r: number; bg: string}> = ({r, bg}) => {
  if (r <= 0) return null;
  const R = 1200;
  const wedge = mix(C.gold, bg, 0.1);
  const ray = mix(C.gold, bg, 0.55);
  const ang = (i: number) => {
    const g = E.out(clamp(r * 1.7 - (i / RAYS) * 0.7));
    return (Math.PI / 2) * ((i + 0.5) / RAYS) * g * 0.98 + 0.012;
  };
  const P = (side: number, a: number) => `${(SUN.x + side * R * Math.sin(a)).toFixed(1)} ${(SUN.y - R * Math.cos(a)).toFixed(1)}`;
  const out: React.ReactNode[] = [];
  [-1, 1].forEach((side) => {
    for (let i = 0; i < RAYS; i++) {
      const a = ang(i);
      if (i % 2 === 0) {
        const b = i + 1 < RAYS ? ang(i + 1) : Math.PI / 2;
        out.push(<path key={`w${side}${i}`} d={`M${SUN.x} ${SUN.y} L${P(side, a)} L${P(side, b)} Z`} fill={wedge} />);
      }
      out.push(<path key={`r${side}${i}`} d={`M${SUN.x} ${SUN.y} L${P(side, a)}`} stroke={ray} strokeWidth={1.6} />);
    }
  });
  return <g opacity={clamp(r * 4)}>{out}</g>;
};

export const archInterior = `M${-ARCH.hw} 0 V${-ARCH.side} A${ARCH.hw} ${ARCH.hw} 0 0 1 ${ARCH.hw} ${-ARCH.side} V0 Z`;
/** 拱窗的三条线（右半边，从底边往上画到中轴顶点） */
export const archHalf = (i: number) => {
  const hw = ARCH.hw + 26 - i * 12;
  return `M${hw} 0 V${-ARCH.side} A${hw} ${hw} 0 0 0 0 ${-ARCH.side - hw}`;
};
const ArchLines: React.FC<{p: number}> = ({p}) => {
  if (p <= 0) return null;
  const ws = [4, 1.6, 1.6];
  return (
    <g>
      {ws.map((sw, i) =>
        [-1, 1].map((side) => (
          <path key={`${i}${side}`} d={archHalf(i)} transform={`scale(${side} 1)`} fill="none" stroke={G} strokeWidth={sw} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
        )),
      )}
      <Diamond x={0} y={-ARCH.side - ARCH.hw - 26} r={12 * clamp(p * 6 - 5)} />
    </g>
  );
};

/** 光顺着拱窗和楼的中肋往上跑（左右同时） */
export const SceneStreaks: React.FC<{p: number}> = ({p}) => (
  <g>
    {[0, 1, 2].map((i) => (
      <g key={i}>
        <Streak d={archHalf(i)} p={p - i * 0.04} w={i === 0 ? 3 : 1.6} />
        <Streak d={archHalf(i)} p={p - i * 0.04} w={i === 0 ? 3 : 1.6} tf={mirror(0)} />
      </g>
    ))}
    <Streak d={`M0 0 V${SPIRE_TIP}`} p={p * 1.1 - 0.1} w={3} len={0.2} />
  </g>
);

/** 一整座：拱窗里的射线 + 光 + 楼 + 台基 */
export const Scene: React.FC<{st: SceneState; bg: string; id?: string}> = ({st, bg, id = 's'}) => {
  const sunCore = mix(C.gold, bg, 0.34);
  const sinkY = st.sink * 1000;
  return (
    <g>
      <clipPath id={`${id}arch`}>
        <path d={archInterior} />
      </clipPath>
      <clipPath id={`${id}ground`}>
        <rect x={-2000} y={-3000} width={4000} height={3042} />
      </clipPath>
      <radialGradient id={`${id}sun`} cx={SUN.x} cy={SUN.y} r={720} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={sunCore} />
        <stop offset="0.45" stopColor={mix(C.gold, bg, 0.12)} />
        <stop offset="1" stopColor={bg} />
      </radialGradient>
      <g clipPath={`url(#${id}arch)`}>
        {st.glow > 0 && <rect x={-ARCH.hw} y={-ARCH.side - ARCH.hw} width={ARCH.hw * 2} height={ARCH.side + ARCH.hw} fill={`url(#${id}sun)`} opacity={st.glow} />}
        <Rays r={st.rays} bg={bg} />
      </g>
      <ArchLines p={st.arch} />
      <g clipPath={`url(#${id}ground)`}>
        <g transform={`translate(0 ${sinkY})`}>
          {WINGS.map(([hw, top], i) => (
            <Block key={i} hw={hw} top={top} base={0} g={st.wings[i]}>
              <Ribs hw={hw} top={top} base={0} />
            </Block>
          ))}
          <Block hw={SHAFT.hw} top={SHAFT.top} base={0} g={st.shaft} sw={2.6}>
            {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((k) => (
              <path key={k} d={`M${k * 25} ${SHAFT.top + 70} V0`} stroke={G} strokeWidth={k === 0 ? 3 : 1} opacity={k === 0 ? 1 : 0.55} />
            ))}
            {[0, 1, 2].map((row) => {
              const y = SHAFT.top + 26 + row * 14;
              const n = 10;
              const pts = Array.from({length: n + 1}, (_, i) => `${-SHAFT.hw + (i * 2 * SHAFT.hw) / n},${y + (i % 2 ? 12 : 0)}`).join(' ');
              return <polyline key={row} points={pts} fill="none" stroke={G} strokeWidth={row === 0 ? 2.2 : 1.1} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - st.chevron} />;
            })}
          </Block>
          {SETBACKS.map(([hw, top, h], i) => (
            <Block key={i} hw={hw} top={top} base={top + h} g={st.setb[i]}>
              <path d={`M${-hw + 10} ${top + 10} H${hw - 10}`} stroke={G} strokeWidth={1.2} />
            </Block>
          ))}
          <Crown arcs={st.arcs} spire={st.spire} />
        </g>
      </g>
      {PLINTH.map((hw, i) =>
        st.plinth[i] > 0 ? <rect key={i} x={-hw * st.plinth[i]} y={i * 14} width={2 * hw * st.plinth[i]} height={14} fill={C.onyx} stroke={G} strokeWidth={1.8} /> : null,
      )}
    </g>
  );
};
