/**
 * 013 · Art Deco —— 海报（首帧 = 末帧）。
 * 开场：光顺着画框从中轴往两边跑一圈 → 楼沉进地面、射线收拢 → 镜头推进拱窗（拱窗里就是隧道）。
 * 片尾：中轴落下 → ART / DECO 一笔一笔画出来 → 画框从中轴拉开 → 拱窗合拢、射线打开、楼重新长高 → 光跑一圈 → 停在第一帧。
 */
import React from 'react';
import {E, clamp, tween} from '../../../src/lib/anim';
import {C, FONT} from '../tokens';
import {AT} from './timeline';
import {FULL, SPIRE_TIP, Scene, SceneState, SceneStreaks, archInterior, growState} from './tower';
import {AX, Corner, Flare, G, GV, H, RuleDiamond, Streak, T, W, flareK, mirror, mix, stepHalf, stepRect} from './ui';

export const BG_GLOW = mix(C.gold, C.onyx, 0.13);
/** 海报里那座楼的镜头 */
export const REST = {s: 0.8, tx: 960, ty: 955};
export const SPIRE_XY = {x: REST.tx, y: REST.ty + SPIRE_TIP * REST.s};
/** 拱窗中心（镜头推进的目标点） */
export const ARCH_C = {x: 960, y: REST.ty - 470 * REST.s};

export const Backdrop: React.FC<{id: string; center?: string; op?: number}> = ({id, center = BG_GLOW, op = 1}) => (
  <g opacity={op}>
    <radialGradient id={id} cx={AX} cy={860} r={1050} gradientUnits="userSpaceOnUse">
      <stop offset="0" stopColor={center} />
      <stop offset="1" stopColor={C.onyx} />
    </radialGradient>
    <rect width={W} height={H} fill={`url(#${id})`} />
  </g>
);

type PS = {
  scene: SceneState;
  frame: number; // 画框：0 = 中轴上一条线，1 = 拉到画面边上
  steps: number; // 画框转角切出阶梯
  corners: number;
  draw: number; // ART / DECO 描边
  fill: number; // ART / DECO 填金
  sub: number; // 装饰 / 艺术、细线、年份
  top: number;
  credit: number;
  axis: number; // 中轴那一条线（只在片尾出现）
};
export const POSTER_FULL: PS = {scene: FULL, frame: 1, steps: 1, corners: 1, draw: 1, fill: 1, sub: 1, top: 1, credit: 1, axis: 0};

/** 画框：三条线（粗线在外），从中轴上的一条线向两边拉开，落定后转角切出阶梯 */
const frameD = (i: number, q: number, st: number) => {
  const d = 40 + i * GV.gap;
  const start = [0, GV.gap, GV.gap][i];
  const hw = start + q * (AX - d - start);
  return stepRect(AX - hw, d, 2 * hw, H - 2 * d, st * Math.max(0, 18 - i * GV.gap * 0.35));
};
export const frameHalf = (i: number) => {
  const d = 40 + i * GV.gap;
  return stepHalf(AX, d, AX - d, H - 2 * d, 18 - i * GV.gap * 0.35);
};
export const FrameStreaks: React.FC<{p: number}> = ({p}) => (
  <g>
    {[0, 1, 2].map((i) => (
      <g key={i}>
        <Streak d={frameHalf(i)} p={p - i * 0.03} w={i === 0 ? 3.4 : 1.8} len={0.08} />
        <Streak d={frameHalf(i)} p={p - i * 0.03} w={i === 0 ? 3.4 : 1.8} len={0.08} tf={mirror(AX)} />
      </g>
    ))}
  </g>
);

const CORNERS: [number, number, number, number][] = [
  [92, 92, 1, 1],
  [W - 92, 92, -1, 1],
  [92, H - 92, 1, -1],
  [W - 92, H - 92, -1, -1],
];

export const PosterArt: React.FC<{ps?: PS; id?: string}> = ({ps = POSTER_FULL, id = 'p'}) => (
  <g>
    <Backdrop id={`${id}bg`} />
    <g transform={`translate(${REST.tx} ${REST.ty}) scale(${REST.s})`}>
      <Scene st={ps.scene} bg={C.onyx} id={id} />
    </g>
    {ps.axis > 0 && <path d={`M${AX} 0 V${H}`} stroke={G} strokeWidth={GV.thick} opacity={ps.axis} />}
    {ps.frame > 0 &&
      [GV.thick, GV.thin, GV.thin].map((sw, i) => <path key={i} d={frameD(i, ps.frame, ps.steps)} fill="none" stroke={G} strokeWidth={sw} />)}
    {CORNERS.map(([x, y, sx, sy], i) => (
      <Corner key={i} x={x} y={y} sx={sx} sy={sy} p={clamp(ps.corners * 2 - (i < 2 ? 0 : 1))} />
    ))}
    <g opacity={ps.top}>
      <T x={AX} y={118} size={22} weight={500} fill={G} ls={0.42} anchor="middle">
        DESIGN STYLE · NO. 013
      </T>
    </g>
    {(
      [
        [-1, 'ART', '装饰', '1925'],
        [1, 'DECO', '艺术', '1939'],
      ] as const
    ).map(([side, en, zh, yr]) => {
      const cx = AX + side * 620;
      const sub = ps.sub;
      return (
        <g key={side}>
          {ps.draw > 0 && (
            <text x={cx} y={520} fontFamily={FONT.display} fontSize={140} letterSpacing="0.06em" textAnchor="middle" fill="none" stroke={C.goldLt} strokeWidth={1.6} strokeDasharray="700 700" strokeDashoffset={700 * (1 - ps.draw)} opacity={1 - ps.fill}>
              {en}
            </text>
          )}
          {ps.fill > 0 && (
            <T x={cx} y={520} size={140} family={FONT.display} fill={G} ls={0.06} anchor="middle" op={ps.fill}>
              {en}
            </T>
          )}
          <RuleDiamond x1={cx - 170} x2={cx + 170} y={572} p={sub} />
          <g opacity={sub} transform={`translate(${cx} 0) scale(${0.6 + 0.4 * sub} 1) translate(${-cx} 0)`}>
            <T x={cx} y={668} size={70} family={FONT.serif} weight={300} fill={C.ivory} ls={0.5} anchor="middle">
              {zh}
            </T>
            <T x={cx} y={806} size={44} weight={400} fill={G} ls={0.32} anchor="middle">
              {yr}
            </T>
          </g>
        </g>
      );
    })}
    <g opacity={ps.credit}>
      <T x={AX - 620} y={990} size={22} family={FONT.sc} weight={400} fill={C.smoke} ls={0.06} anchor="middle">
        Design Style 风格 013
      </T>
      <T x={AX + 620} y={990} size={22} weight={400} fill={C.smoke} ls={0.08} anchor="middle">
        @guanmo_ai
      </T>
    </g>
  </g>
);

// ───────── 开场 ─────────
/** 推进：0 → 1，海报绕拱窗中心放大，拱窗变成整个画面 */
export const dolly = (f: number) => tween(f, 48, 46, 0, 1, E.in);

export const Opening: React.FC<{f: number}> = ({f}) => {
  if (f >= 96) return null;
  const fold = tween(f, 26, 30, 0, 1, E.inOut);
  const scene: SceneState = {...FULL, rays: 1 - fold, glow: 1 - fold, sink: tween(f, 28, 26, 0, 1, E.in)};
  const ps: PS = {...POSTER_FULL, scene};
  const k = dolly(f);
  const s = 1 + 9 * k * k;
  const hole = tween(f, 44, 10);
  return (
    <g>
      <mask id="posterHole" maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
        <rect width={W} height={H} fill="#fff" />
        <g transform={`translate(${REST.tx} ${REST.ty}) scale(${REST.s})`}>
          <path d={archInterior} fill="#000" opacity={hole} />
        </g>
      </mask>
      <g transform={`translate(${ARCH_C.x} ${ARCH_C.y}) scale(${s}) translate(${-ARCH_C.x} ${-ARCH_C.y})`} opacity={1 - tween(f, 84, 10)}>
        {/* 遮罩会让 Chromium 换一种光栅化方式：用不到时不挂，第一帧才和最后一帧逐像素一致 */}
        <g mask={hole > 0 ? 'url(#posterHole)' : undefined}>
          <PosterArt ps={ps} id="po" />
        </g>
        <FrameStreaks p={tween(f, 2, 34, 0, 1, E.inOut)} />
        <Flare x={SPIRE_XY.x} y={SPIRE_XY.y} k={flareK(f, 4, 26) * 0.9} />
      </g>
    </g>
  );
};

// ───────── 片尾：海报重新长回去 ─────────
const T0 = AT.title;
export const endState = (f: number): PS => ({
  scene: growState(f, T0 + 50),
  axis: tween(f, T0, 14, 0, 1, E.out) * (1 - tween(f, T0 + 60, 20)),
  draw: tween(f, T0 + 6, 34, 0, 1, E.inOut),
  fill: tween(f, T0 + 34, 18),
  frame: tween(f, T0 + 22, 40, 0, 1, E.inOut),
  steps: tween(f, T0 + 62, 10),
  corners: tween(f, T0 + 70, 20),
  sub: tween(f, T0 + 40, 24, 0, 1, E.out),
  top: tween(f, T0 + 84, 16),
  credit: tween(f, T0 + 96, 16),
});

export const Ending: React.FC<{f: number}> = ({f}) => {
  if (f < T0 - 6) return null;
  const st = f >= DONE ? POSTER_FULL : endState(f);
  const sp = tween(f, T0 + 128, 44, 0, 1, E.inOut);
  return (
    <g opacity={tween(f, T0 - 6, 10)}>
      <PosterArt ps={st} id="pe" />
      {sp > 0 && sp < 1 && (
        <>
          <FrameStreaks p={sp} />
          <g transform={`translate(${REST.tx} ${REST.ty}) scale(${REST.s})`}>
            <SceneStreaks p={sp} />
          </g>
        </>
      )}
      <Flare x={SPIRE_XY.x} y={SPIRE_XY.y} k={flareK(f, T0 + 158, 22)} />
    </g>
  );
};
/** 之后完全静止 = 第一帧 */
const DONE = AT.title + 186;
