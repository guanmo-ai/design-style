/**
 * 013 · Art Deco —— 主角：中轴上的一座楼（局部坐标：中轴 x = 0，台基顶 y = 0，往上为负）。
 * 02 一级级长高 → 03 太阳藏在楼后、射线像折扇打开、拱窗合拢 → 04 楼顶换三座城 → 05 整座楼缩进手机的拱窗。
 * 海报（首帧 / 末帧）就是 04 结束时的这一帧。
 */
import React from 'react';
import {E, clamp, spr, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {AT, CITY_AT} from './timeline';
import {Diamond, G, mix} from './ui';

/** 长出来：一次约 5% 的过冲再停住 */
const RISE = {damping: 15, mass: 0.6, stiffness: 230};
export const rise = (f: number, at: number) => (f < at ? 0 : spr(f, at, RISE));

// ───────── 镜头 ─────────
/** 屏幕坐标 = (tx + s·x, ty + s·y) */
export const camera = (f: number) => {
  // 02：近景，跟着楼往上摇
  let s = 1.2;
  let tx = 960;
  let ty = 920 + 410 * tween(f, 392, 72, 0, 1, E.inOut);
  // 03：拉远，整座楼和拱窗进画
  const back = tween(f, AT.sun, 60, 0, 1, E.inOut);
  s += (0.8 - 1.2) * back;
  ty += (955 - 1330) * back;
  // 05：整座楼缩进手机的拱窗
  const shrink = tween(f, AT.apps, 56, 0, 1, E.inOut);
  s += (0.32 - 0.8) * shrink;
  tx += (PHONE_AX - 960) * shrink;
  ty += (PHONE_BASE - 955) * shrink;
  return {s, tx, ty};
};
export const PHONE_AX = 1500;
export const PHONE_BASE = 452;
/** 海报 / 04 的镜头 */
export const REST = {s: 0.8, tx: 960, ty: 955};

// ───────── 尺寸 ─────────
const PLINTH = [330, 365, 400]; // 台基三级，往下越宽
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
const ARCH = {hw: 470, side: 380};
const SUN = {x: 0, y: -40};
const RAYS = 11; // 每边

/** 一块从底边长高的体块 */
const Block: React.FC<{hw: number; top: number; base: number; g: number; sw?: number; children?: React.ReactNode}> = ({hw, top, base, g, sw = 2.2, children}) => {
  if (g <= 0) return null;
  return (
    <g transform={`translate(0 ${base}) scale(1 ${g}) translate(0 ${-base})`}>
      <rect x={-hw} y={top} width={2 * hw} height={base - top} fill="url(#shaft)" stroke={G} strokeWidth={sw} />
      {children}
    </g>
  );
};

/** 三根一组的竖肋 */
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

// ───────── 三座城的楼顶 ─────────
type City = 'ny' | 'paris' | 'sh';

const archPath = (hw: number, b: number, extra: number) => `M${-hw} ${b} V${b - extra} A${hw} ${hw} 0 0 1 ${hw} ${b - extra} V${b} Z`;

/** 纽约 1930：克莱斯勒式五层拱冠 + 三角窗 + 尖顶。arcs = 每层的生长，spire = 尖顶 0–1 */
const CrownNY: React.FC<{arcs: number[]; spire: number}> = ({arcs, spire}) => {
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

/** 巴黎 1925：装饰艺术博览会的塔门——三级收分 + 顶上一把扇 */
const CrownParis: React.FC<{g: number}> = ({g}) => {
  const steps: [number, number, number][] = [
    [58, CROWN_BASE, -622],
    [42, -622, -660],
    [28, -660, -694],
  ];
  return (
    <g>
      {steps.map(([hw, b, t], i) => (
        <Block key={i} hw={hw} top={t} base={b} g={clamp(g * 3 - i)} sw={2}>
          <path d={`M${-hw + 8} ${t + 8} H${hw - 8}`} stroke={G} strokeWidth={1} />
        </Block>
      ))}
      {g > 0.66 && (
        <g transform={`translate(0 -694) scale(${(g - 0.66) / 0.34}) translate(0 694)`}>
          <path d="M-70 -694 A70 70 0 0 1 70 -694 Z" fill={C.onyx} stroke={G} strokeWidth={2.4} />
          {Array.from({length: 9}, (_, k) => {
            const a = Math.PI + (Math.PI * (k + 1)) / 10;
            return <path key={k} d={`M0 -694 L${(70 * Math.cos(a)).toFixed(1)} ${(-694 + 70 * Math.sin(a)).toFixed(1)}`} stroke={G} strokeWidth={1.4} />;
          })}
          <path d="M-34 -694 A34 34 0 0 1 34 -694" fill="none" stroke={G} strokeWidth={1.4} />
          <Diamond x={0} y={-786} r={9} />
          <path d="M0 -764 V-777" stroke={G} strokeWidth={2} />
        </g>
      )}
    </g>
  );
};

/** 上海 1929：外滩沙逊大厦（今和平饭店北楼）——绿铜金字塔顶 */
const CrownShanghai: React.FC<{g: number}> = ({g}) => {
  const base = CROWN_BASE - 26;
  const apex = -780;
  const pg = clamp(g * 1.6 - 0.6);
  return (
    <g>
      <Block hw={86} top={base} base={CROWN_BASE} g={clamp(g * 2.5)} sw={2}>
        <path d={`M-78 ${base + 8} H78`} stroke={G} strokeWidth={1} />
      </Block>
      {pg > 0 && (
        <g transform={`translate(0 ${base}) scale(1 ${pg}) translate(0 ${-base})`}>
          <path d={`M-76 ${base} L0 ${apex} L76 ${base} Z`} fill={C.emerald} stroke={G} strokeWidth={2.4} />
          {[-38, 0, 38].map((x) => (
            <path key={x} d={`M${x} ${base} L${x * 0.15} ${apex + 30}`} stroke={G} strokeWidth={x === 0 ? 1.6 : 1} opacity={0.8} />
          ))}
          {[0.32, 0.62].map((k) => {
            const y = base + (apex - base) * k;
            const hw = 76 * (1 - k);
            return <path key={k} d={`M${-hw} ${y} H${hw}`} stroke={G} strokeWidth={1} />;
          })}
          <path d={`M0 ${apex} V${apex - 30}`} stroke={G} strokeWidth={2} />
          <Diamond x={0} y={apex - 38} r={8} />
        </g>
      )}
    </g>
  );
};

const CrownOf: React.FC<{c: City; g: number}> = ({c, g}) => {
  if (c === 'paris') return <CrownParis g={g} />;
  if (c === 'sh') return <CrownShanghai g={g} />;
  return <CrownNY arcs={[0, 1, 2, 3, 4].map((i) => clamp(g * 2.2 - i * 0.3))} spire={clamp(g * 2.2 - 1.2)} />;
};

/** 楼顶：02 一层层长出来；04 每次换城，旧的缩回楼里、新的再长出来 */
const Crown: React.FC<{f: number}> = ({f}) => {
  const order: City[] = ['ny', 'paris', 'sh', 'ny'];
  let idx = 0;
  CITY_AT.forEach((t) => {
    if (f >= t) idx++;
  });
  if (idx === 0) {
    const arcs = [0, 1, 2, 3, 4].map((i) => rise(f, AT.zig + 105 + i * 7));
    return <CrownNY arcs={arcs} spire={tween(f, AT.zig + 140, 16, 0, 1, E.out)} />;
  }
  const t = CITY_AT[idx - 1];
  const out = tween(f, t, 10, 1, 0, E.in);
  const g = rise(f, t + 8);
  return (
    <g>
      {out > 0 && (
        <g transform={`translate(0 ${CROWN_BASE}) scale(1 ${out}) translate(0 ${-CROWN_BASE})`}>
          <CrownOf c={order[idx - 1]} g={1} />
        </g>
      )}
      <CrownOf c={order[idx]} g={g} />
    </g>
  );
};

// ───────── 放射 + 拱窗 ─────────
/** 射线：像折扇一样从竖直往两边打开；光源藏在楼后 */
const Rays: React.FC<{f: number; bg: string}> = ({f, bg}) => {
  const t0 = AT.sun + 30;
  const R = 1200;
  const wedge = mix(C.gold, bg, 0.1);
  const ray = mix(C.gold, bg, 0.55);
  const ang = (i: number) => {
    const g = f < t0 + i * 2.4 ? 0 : spr(f, t0 + i * 2.4, {damping: 14, mass: 0.7, stiffness: 120});
    return (Math.PI / 2) * ((i + 0.5) / RAYS) * g * 0.98 + 0.012;
  };
  const P = (side: number, a: number) => `${(SUN.x + side * R * Math.sin(a)).toFixed(1)} ${(SUN.y - R * Math.cos(a)).toFixed(1)}`;
  const vis = tween(f, t0 - 6, 10);
  if (vis <= 0) return null;
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
  return <g opacity={vis}>{out}</g>;
};

const archInterior = `M${-ARCH.hw} 0 V${-ARCH.side} A${ARCH.hw} ${ARCH.hw} 0 0 1 ${ARCH.hw} ${-ARCH.side} V0 Z`;

/** 拱窗三线：两半从底边同时往上画，在中轴顶上合拢 */
const ArchLines: React.FC<{p: number}> = ({p}) => {
  if (p <= 0) return null;
  const ws = [4, 1.6, 1.6];
  return (
    <g>
      {ws.map((sw, i) => {
        const hw = ARCH.hw + 26 - i * 12;
        const d = `M${hw} 0 V${-ARCH.side} A${hw} ${hw} 0 0 0 0 ${-ARCH.side - hw}`;
        return [-1, 1].map((side) => (
          <path key={`${i}${side}`} d={d} transform={`scale(${side} 1)`} fill="none" stroke={G} strokeWidth={sw} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
        ));
      })}
      <Diamond x={0} y={-ARCH.side - ARCH.hw - 26} r={12 * clamp(p * 6 - 5)} />
    </g>
  );
};

/** 一整座：拱窗里的射线 + 光 + 楼 + 台基 */
export const Scene: React.FC<{f: number; bg: string; id?: string}> = ({f, bg, id = 's'}) => {
  const z = AT.zig;
  const plinth = PLINTH.map((_, i) => rise(f, z + i * 6));
  const wings = [rise(f, z + 18), rise(f, z + 30)];
  const shaft = rise(f, z + 45);
  const setb = [rise(f, z + 75), rise(f, z + 90)];
  const chevron = tween(f, z + 60, 20);
  const glow = tween(f, AT.sun + 14, 40);
  const archP = tween(f, AT.sun + 62, 46, 0, 1, E.inOut);
  const sunCore = mix(C.gold, bg, 0.34);
  return (
    <g>
      <clipPath id={`${id}arch`}>
        <path d={archInterior} />
      </clipPath>
      <radialGradient id={`${id}sun`} cx={SUN.x} cy={SUN.y} r={720} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={sunCore} />
        <stop offset="0.45" stopColor={mix(C.gold, bg, 0.12)} />
        <stop offset="1" stopColor={bg} />
      </radialGradient>
      <g clipPath={`url(#${id}arch)`}>
        {glow > 0 && <rect x={-ARCH.hw} y={-ARCH.side - ARCH.hw} width={ARCH.hw * 2} height={ARCH.side + ARCH.hw} fill={`url(#${id}sun)`} opacity={glow} />}
        <Rays f={f} bg={bg} />
      </g>
      <ArchLines p={archP} />
      {/* 楼：外翼 → 内翼 → 主楼 → 收分 → 楼顶 */}
      {WINGS.map(([hw, top], i) => (
        <Block key={i} hw={hw} top={top} base={0} g={wings[i]}>
          <Ribs hw={hw} top={top} base={0} />
        </Block>
      ))}
      <Block hw={SHAFT.hw} top={SHAFT.top} base={0} g={shaft} sw={2.6}>
        {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((k) => (
          <path key={k} d={`M${k * 25} ${SHAFT.top + 70} V0`} stroke={G} strokeWidth={k === 0 ? 3 : 1} opacity={k === 0 ? 1 : 0.55} />
        ))}
        {[0, 1, 2].map((row) => {
          const y = SHAFT.top + 26 + row * 14;
          const n = 10;
          const pts = Array.from({length: n + 1}, (_, i) => `${-SHAFT.hw + (i * 2 * SHAFT.hw) / n},${y + (i % 2 ? 12 : 0)}`).join(' ');
          return <polyline key={row} points={pts} fill="none" stroke={G} strokeWidth={row === 0 ? 2.2 : 1.1} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - chevron} />;
        })}
      </Block>
      {SETBACKS.map(([hw, top, h], i) => (
        <Block key={i} hw={hw} top={top} base={top + h} g={setb[i]}>
          <path d={`M${-hw + 10} ${top + 10} H${hw - 10}`} stroke={G} strokeWidth={1.2} />
        </Block>
      ))}
      <Crown f={f} />
      {/* 台基：三级，往两边伸出来 */}
      {PLINTH.map((hw, i) =>
        plinth[i] > 0 ? (
          <rect key={i} x={-hw * plinth[i]} y={i * 14} width={2 * hw * plinth[i]} height={14} fill={C.onyx} stroke={G} strokeWidth={1.8} />
        ) : null,
      )}
    </g>
  );
};
