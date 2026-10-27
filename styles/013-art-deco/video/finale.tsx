/**
 * 013 · Art Deco —— 海报（首帧 = 末帧）、电梯门、五条规则。
 * 海报就是电梯门：开场从中缝向两边打开，片尾从两边合上。
 */
import React from 'react';
import {E, clamp, spr, tween} from '../../../src/lib/anim';
import {C, FONT} from '../tokens';
import {AT} from './timeline';
import {REST, Scene} from './tower';
import {Zig} from './apps';
import {AX, Corner, Diamond, G, H, Pair, RuleDiamond, T, TripleRect, W, mix} from './ui';

export const BG_GLOW = mix(C.gold, C.onyx, 0.13);

export const Backdrop: React.FC<{id: string; center?: string}> = ({id, center = BG_GLOW}) => (
  <>
    <radialGradient id={id} cx={AX} cy={860} r={1050} gradientUnits="userSpaceOnUse">
      <stop offset="0" stopColor={center} />
      <stop offset="1" stopColor={C.onyx} />
    </radialGradient>
    <rect width={W} height={H} fill={`url(#${id})`} />
  </>
);

export const Frame: React.FC = () => (
  <>
    <TripleRect x={40} y={40} w={W - 80} h={H - 80} />
    {(
      [
        [92, 92, 1, 1],
        [W - 92, 92, -1, 1],
        [92, H - 92, 1, -1],
        [W - 92, H - 92, -1, -1],
      ] as const
    ).map(([x, y, sx, sy], i) => (
      <Corner key={i} x={x} y={y} sx={sx} sy={sy} />
    ))}
  </>
);

/** 海报：04 结束时的那座楼 + 左右镜像的标题 */
const PosterArt: React.FC = () => (
  <g>
    <Backdrop id="pbg" />
    <g transform={`translate(${REST.tx} ${REST.ty}) scale(${REST.s})`}>
      <Scene f={AT.apps - 1} bg={C.onyx} id="p" />
    </g>
    <Frame />
    <T x={AX} y={118} size={22} weight={500} fill={G} ls={0.42} anchor="middle">
      DESIGN STYLE · NO. 013
    </T>
    {(
      [
        [-1, 'ART', '装饰', '1925'],
        [1, 'DECO', '艺术', '1939'],
      ] as const
    ).map(([side, en, zh, yr]) => {
      const cx = AX + side * 620;
      return (
        <g key={side}>
          <T x={cx} y={520} size={140} family={FONT.display} fill={G} ls={0.06} anchor="middle">
            {en}
          </T>
          <RuleDiamond x1={cx - 170} x2={cx + 170} y={572} />
          <T x={cx} y={668} size={70} family={FONT.serif} weight={300} fill={C.ivory} ls={0.5} anchor="middle">
            {zh}
          </T>
          <T x={cx} y={806} size={44} weight={400} fill={G} ls={0.32} anchor="middle">
            {yr}
          </T>
        </g>
      );
    })}
    <T x={AX - 620} y={990} size={22} family={FONT.sc} weight={400} fill={C.smoke} ls={0.06} anchor="middle">
      Design Style 风格 013
    </T>
    <T x={AX + 620} y={990} size={22} weight={400} fill={C.smoke} ls={0.08} anchor="middle">
      @guanmo_ai
    </T>
  </g>
);

/** 门：0 = 合上（海报），1 = 完全打开 */
export const doors = (f: number) => {
  if (f < AT.lineage) return tween(f, 14, 54, 0, 1, E.inOut);
  return 1 - tween(f, AT.end + 10, 50, 0, 1, E.inOut);
};

export const Doors: React.FC<{f: number}> = ({f}) => {
  const o = doors(f);
  if (o >= 1) return null;
  // 中缝：开门前和合上那一下亮一道
  const glint = tween(f, 2, 10) * (1 - tween(f, 16, 18)) + tween(f, AT.end + 58, 3) * (1 - tween(f, AT.end + 62, 24));
  const dx = o * 1010;
  return (
    <g>
      <defs>
        <g id="posterArt">
          <PosterArt />
        </g>
        <clipPath id="doorL">
          <rect x={0} y={0} width={AX} height={H} />
        </clipPath>
        <clipPath id="doorR">
          <rect x={AX} y={0} width={AX} height={H} />
        </clipPath>
      </defs>
      {([-1, 1] as const).map((side) => (
        <g key={side} transform={`translate(${side * dx} 0)`}>
          <use href="#posterArt" clipPath={`url(#${side < 0 ? 'doorL' : 'doorR'})`} />
          {o > 0 && <path d={`M${AX + side * 1.5} 0 V${H}`} stroke={G} strokeWidth={3} />}
        </g>
      ))}
      {glint > 0.001 && (
        <g opacity={glint}>
          <rect x={AX - 30} y={0} width={60} height={H} fill="url(#seam)" />
          <path d={`M${AX} 0 V${H}`} stroke={C.goldLt} strokeWidth={3} />
        </g>
      )}
      <linearGradient id="seam" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={C.goldLt} stopOpacity={0} />
        <stop offset="0.5" stopColor={C.goldLt} stopOpacity={0.55} />
        <stop offset="1" stopColor={C.goldLt} stopOpacity={0} />
      </linearGradient>
    </g>
  );
};

// ───────── 五条规则 ─────────
const WD = AT.words;
const RULES: [string, string][] = [
  ['中轴', 'AXIS'],
  ['阶梯', 'ZIGGURAT'],
  ['放射', 'SUNBURST'],
  ['三线', 'TRIPLE LINE'],
  ['金线', 'GOLD LINE'],
];
/** 从中间那块开始，往两边一对一对地打开；退场时外面的先合上 */
const ORDER = [2, 1, 0, 1, 2];

const Motif: React.FC<{i: number; cx: number; cy: number}> = ({i, cx, cy}) => {
  if (i === 0)
    return (
      <g>
        <path d={`M${cx} ${cy - 92} V${cy + 92}`} stroke={G} strokeWidth={5} />
        {[-1, 1].map((s) => (
          <path key={s} d={`M${cx + s * 16} ${cy - 92} V${cy + 92}`} stroke={G} strokeWidth={1.8} />
        ))}
        {[-1, 1].map((s) => (
          <path key={s} d={`M${cx + s * 34} ${cy - 30} L${cx + s * 74} ${cy} L${cx + s * 34} ${cy + 30}`} fill="none" stroke={G} strokeWidth={2} transform={`translate(${cx} ${cy}) scale(-1 1) translate(${-cx} ${-cy})`} />
        ))}
        <Diamond x={cx} y={cy} r={14} />
      </g>
    );
  if (i === 1) return <Zig x={cx} y={cy + 72} s={1.6} />;
  if (i === 2) {
    const R = 100;
    return (
      <g>
        {Array.from({length: 13}, (_, k) => {
          const a = Math.PI + (Math.PI * (k + 0.5)) / 13;
          return <path key={k} d={`M${cx} ${cy + 60} L${(cx + R * Math.cos(a)).toFixed(1)} ${(cy + 60 + R * Math.sin(a)).toFixed(1)}`} stroke={G} strokeWidth={1.4} />;
        })}
        <path d={`M${cx - 38} ${cy + 60} A38 38 0 0 1 ${cx + 38} ${cy + 60} Z`} fill="url(#goldFill)" />
        <path d={`M${cx - 110} ${cy + 60} H${cx + 110}`} stroke={G} strokeWidth={2} />
      </g>
    );
  }
  if (i === 3) return <TripleRect x={cx - 74} y={cy - 84} w={148} h={168} s={12} k={0.9} />;
  return (
    <g>
      {[0, 1, 2, 3].map((k) => (
        <path key={k} d={`M${cx - 80} ${cy - 30 + k * 26} L${cx} ${cy - 62 + k * 26} L${cx + 80} ${cy - 30 + k * 26}`} fill="none" stroke={G} strokeWidth={k === 0 ? 4 : 1.6} />
      ))}
      <path d={`M${cx - 80} ${cy + 74} H${cx + 80}`} stroke={G} strokeWidth={1.6} />
    </g>
  );
};

export const Words: React.FC<{f: number}> = ({f}) => {
  if (f < WD - 4 || f > AT.end + 30) return null;
  return (
    <g>
      <Pair f={f} id="wh" at={WD} out={AT.end - 6} big={['五条规则', 'FIVE RULES']} gap={36} y={232} bigSize={60} bigLs={0.24} fam={[FONT.serif, FONT.geo]} />
      {RULES.map(([zh, en], i) => {
        const cx = AX + (i - 2) * 312;
        const at = WD + 6 + ORDER[i] * 24;
        const out = AT.end + 2 + (2 - ORDER[i]) * 6;
        const k = (f < at ? 0 : spr(f, at, {damping: 15, mass: 0.6, stiffness: 220})) * (1 - tween(f, out, 10, 0, 1, E.in));
        if (k <= 0.001) return null;
        const lab = clamp(tween(f, at + 8, 16)) * (1 - tween(f, out - 4, 10));
        return (
          <g key={i} transform={`translate(${cx} 0) scale(${k} 1) translate(${-cx} 0)`}>
            <path d={`M${cx - 125} 320 H${cx + 125} V610 H${cx - 125} Z`} fill={mix(C.gold, C.onyx, 0.05)} />
            <TripleRect x={cx - 125} y={320} w={250} h={290} s={12} k={0.6} />
            <Motif i={i} cx={cx} cy={465} />
            <g opacity={lab}>
              <T x={cx} y={706} size={64} family={FONT.serif} weight={600} fill={G} ls={0.2} anchor="middle">
                {zh}
              </T>
              <T x={cx} y={752} size={22} weight={500} fill={C.smoke} ls={0.3} anchor="middle">
                {en}
              </T>
            </g>
          </g>
        );
      })}
    </g>
  );
};
