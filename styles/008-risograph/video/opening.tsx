/**
 * 008 · Risograph —— 开场 0–4s
 *   0.0–0.5s  对版   粉 / 青 / 黄三张版从三边飞进来，砸在一起（套准）
 *   0.5–1.6s  标题   RISOGRAPH 逐字母升起，每只墨各自偏一点；孔版印刷落下
 *   1.6–2.0s  钻孔   镜头扎进字母 O 的“孔”——孔版印刷的孔
 * 商店海报的几何母题（圆、星、闪电、圆印）贯穿全片，见 ShopArt。
 */
import React from 'react';
import {E, spr, tween} from '../../../src/lib/anim';
import {C, GRID, INK_NAME, Ink} from '../tokens';
import {Plate, Reg, RegMark, addReg, jitter} from './riso';
import {AT} from './timeline';
import {ADV, CAP, CJK, Show, T, advances, c01, disp, lerp, mono, sc} from './ui';

type P = {f: number};
const TITLE = 'RISOGRAPH';
export const TS = 248; // 标题字号：字宽约 1608，左右各留 156
export const TLS = -0.02;
export const TITLE_BASE = 268;
const {xs: TX, w: TW} = advances(TITLE, TS, TLS);
export const TITLE_X = 960 - TW / 2;
/** O 的内孔中心：用来当镜头焦点（字体文件里 O 外框 45–788、内孔 271–562，单位 1/1000 em） */
export const HOLE = {
  x: TITLE_X + TX[3] + ((271 + 562) / 2000) * TS,
  y: TITLE_BASE - ((153 + 535) / 2000) * TS,
  r: ((562 - 271) / 2000) * TS,
};

/* ═══════════════ 商店海报：三张版的几何（对标主人选中的参考图） ═══════════════ */
const Dot: React.FC<{x: number; y: number; r: number}> = ({x, y, r}) => (
  <div style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', background: 'currentColor'}} />
);
const Box: React.FC<{x: number; y: number; w: number; h: number}> = ({x, y, w, h}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, background: 'currentColor'}} />
);
const Stamp: React.FC<{x: number; y: number; r: number; label: string; ring?: number}> = ({x, y, r, label, ring = 5}) => (
  <div style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2}}>
    <div style={{position: 'absolute', inset: 0, borderRadius: '50%', border: `${ring}px solid currentColor`}} />
    <div style={{position: 'absolute', inset: ring + 4, borderRadius: '50%', border: `${Math.max(1.5, ring * 0.35)}px solid currentColor`}} />
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', ...mono(Math.round(r * 0.28), 700, 0.08)}}>{label}</div>
  </div>
);
const Star: React.FC<{x: number; y: number; r: number}> = ({x, y, r}) => (
  <svg style={{position: 'absolute', left: x - r, top: y - r}} width={r * 2} height={r * 2} viewBox="-10 -10 20 20">
    <path d="M0 -10 L2.4 -3.2 H9.5 L3.6 1.2 L5.9 8.1 L0 4 L-5.9 8.1 L-3.6 1.2 L-9.5 -3.2 H-2.4 Z" fill="currentColor" />
  </svg>
);
const Bolt: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <svg style={{position: 'absolute', left: x, top: y}} width={s * 0.62} height={s} viewBox="0 0 62 100">
    <path d="M38 0 L8 48 H30 L18 100 L58 40 H34 Z" fill="currentColor" />
  </svg>
);
const Tri: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <svg style={{position: 'absolute', left: x, top: y}} width={s} height={s * 0.86} viewBox="0 0 100 86">
    <path d="M50 0 L100 86 H0 Z" fill="currentColor" />
  </svg>
);

/** 一张版上的形状。ink 决定印哪些（粉印圆印和左团，青印闪电和右上，黄印大圆和三角） */
export const ShopArt: React.FC<{ink: Ink}> = ({ink}) => {
  if (ink === 'pink') {
    return (
      <>
        <Dot x={322} y={222} r={118} />
        <Dot x={430} y={430} r={28} />
        <Dot x={500} y={430} r={28} />
        <Dot x={465} y={490} r={28} />
        <Stamp x={148} y={188} r={52} label="PROOF" />
        <Stamp x={168} y={868} r={48} label="PASS" />
        <Box x={210} y={620} w={86} h={86} />
        <Star x={268} y={740} r={36} />
        <Dot x={1680} y={210} r={22} />
      </>
    );
  }
  if (ink === 'teal') {
    return (
      <>
        <Dot x={322} y={222} r={118} />
        <Box x={1380} y={168} w={360} h={248} />
        <Bolt x={1468} y={176} s={210} />
        <Stamp x={1610} y={210} r={42} label="色刷" ring={4} />
        <Stamp x={1688} y={820} r={58} label="RISOLO" />
        <Dot x={1760} y={430} r={36} />
        <Box x={220} y={560} w={200} h={120} />
      </>
    );
  }
  if (ink === 'yellow') {
    return (
      <>
        <Dot x={760} y={560} r={210} />
        <Tri x={900} y={168} s={70} />
        <Dot x={1480} y={560} r={196} />
        <Dot x={1760} y={430} r={36} />
        <Box x={1380} y={168} w={360} h={248} />
        <Dot x={310} y={210} r={40} />
      </>
    );
  }
  return (
    <>
      <T x={TITLE_X} y={TITLE_BASE} size={TS} style={{...disp(TS, 900, 100, TLS), color: 'currentColor'}}>
        {TITLE}
      </T>
      <T k="sc" x={960} y={TITLE_BASE + 72} size={42} align="center" style={{...sc(42, 900, 0.12), color: 'currentColor'}}>
        孔版印刷
      </T>
    </>
  );
};

/** 开场三张版的飞入：从大套不准收到只剩几毫米 */
const FLY: Record<Exclude<Ink, 'black'>, {from: Reg; to: Reg}> = {
  pink: {from: {x: -220, y: 70, r: -6.5}, to: {x: -4, y: 2, r: -0.35}},
  teal: {from: {x: 160, y: -180, r: 5.5}, to: {x: 5, y: -3, r: 0.4}},
  yellow: {from: {x: 40, y: 210, r: 4.2}, to: {x: 3, y: 4, r: 0.25}},
};
export const flyReg = (f: number, ink: Exclude<Ink, 'black'>): Reg => {
  const p = spr(f, 8, {damping: 13, mass: 0.75, stiffness: 160}, 28);
  const a = FLY[ink];
  return {x: lerp(a.from.x, a.to.x, p), y: lerp(a.from.y, a.to.y, p), r: lerp(a.from.r ?? 0, a.to.r ?? 0, p)};
};

/* ═══════════════ 标题：三只墨各印一遍，字母逐个升起 ═══════════════ */
const TITLE_INK: Ink[] = ['pink', 'teal', 'yellow'];
const TITLE_OFF: Record<Ink, [number, number]> = {pink: [-7, 2.4], teal: [7.5, -3.2], yellow: [1.2, 5.5], black: [0, 0]};

export const TitleWord: React.FC<{f: number; at?: number; size?: number; x?: number; y?: number; out?: number}> = ({f, at = 32, size = TS, x = TITLE_X, y = TITLE_BASE, out = 1e9}) => {
  const fade = 1 - tween(f, out, 10, 0, 1, E.in);
  if (f < at - 4 || fade <= 0.001) return null;
  const {xs} = advances(TITLE, size, TLS);
  return (
    <>
      {TITLE_INK.map((ink) => (
        <Plate key={ink} ink={ink} f={f} reg={{x: TITLE_OFF[ink][0], y: TITLE_OFF[ink][1]}} origin={`${x}px ${y}px`} style={{opacity: fade}}>
          {TITLE.split('').map((ch, i) => {
            const p = tween(f, at + i * 2.2, 14, 0, 1, E.out);
            if (p <= 0.001) return null;
            return (
              <div
                key={ch + i}
                style={{
                  position: 'absolute',
                  left: x + xs[i],
                  top: y - CAP * size,
                  height: size * 1.2,
                  overflow: 'hidden',
                  ...disp(size, 900, 100, TLS),
                  lineHeight: `${size}px`,
                  transform: `translateY(${(1 - p) * size * 0.85}px)`,
                }}
              >
                {ch}
              </div>
            );
          })}
        </Plate>
      ))}
    </>
  );
};

/* ═══════════════ 镜头：扎进 O 的孔 ═══════════════ */
export const ZOOM = {at: 96, dur: 24, max: 36};
export const zoomScale = (f: number) => {
  if (f < ZOOM.at - 8) return 1;
  if (f >= AT.stencil) return ZOOM.max;
  const back = 1 - 0.025 * tween(f, ZOOM.at - 8, 6, 0, 1, E.out);
  const p = c01((f - ZOOM.at) / ZOOM.dur);
  return back * Math.exp(Math.log(ZOOM.max) * p * p);
};
export const zoomPan = (f: number) => {
  const p = f >= AT.stencil ? 1 : tween(f, ZOOM.at, ZOOM.dur, 0, 1, E.inOut);
  return {x: (960 - HOLE.x) * p, y: (540 - HOLE.y) * p};
};

/* ═══════════════ 开场 ═══════════════ */
const SLAM = 30;
export const Opening: React.FC<P> = ({f}) => {
  const z = zoomScale(f);
  const pan = zoomPan(f);
  const hit = f >= SLAM && f < SLAM + 14 ? Math.exp(-(f - SLAM) / 5) : 0;
  const shakeX = hit * 7 * Math.sin(f * 2.1);
  const shakeY = hit * 5 * Math.cos(f * 1.7);
  return (
    <div style={{position: 'absolute', inset: 0, transform: z !== 1 ? `translate(${pan.x + shakeX}px, ${pan.y + shakeY}px) scale(${z})` : `translate(${shakeX}px, ${shakeY}px)`, transformOrigin: `${HOLE.x}px ${HOLE.y}px`}}>
      {(['pink', 'teal', 'yellow'] as const).map((ink) => (
        <Plate key={ink} ink={ink} f={f} reg={addReg(flyReg(f, ink), jitter(f, ink, 0.45))} origin="960px 540px">
          <ShopArt ink={ink} />
        </Plate>
      ))}
      <TitleWord f={f} at={34} />
      <Plate ink="black" f={f} grain="solid" density={0.86} reg={jitter(f, 'black', 0.3)}>
        <Show f={f} at={58} out={ZOOM.at + 4} dy={12}>
          <T k="sc" x={960} y={TITLE_BASE + 74} size={40} align="center" style={{...sc(40, 900, 0.16), color: 'currentColor'}}>
            孔版印刷
          </T>
        </Show>
        <Show f={f} at={70} out={ZOOM.at + 2} dy={8}>
          <T k="mono" x={GRID.mx} y={980} size={16} style={{...mono(15, 700, 0.1), color: 'currentColor'}}>
            SHOP · RUN #047 · {INK_NAME.pink[1]} / {INK_NAME.teal[1]} / {INK_NAME.yellow[1]}
          </T>
          <T k="mono" x={1920 - GRID.mx} y={980} size={16} align="right" style={{...mono(15, 400, 0.08), color: 'currentColor'}}>
            misreg · grain · 3-ink
          </T>
        </Show>
      </Plate>
      {/* 四角套准靶：粉青黄各印一遍，砸在一起时才对上 */}
      {(['pink', 'teal', 'yellow'] as const).map((ink) => (
        <Plate key={'m' + ink} ink={ink} f={f} reg={addReg(flyReg(f, ink), jitter(f, ink, 0.4))}>
          <RegMark x={GRID.mark} y={GRID.mark} />
          <RegMark x={1920 - GRID.mark} y={GRID.mark} />
          <RegMark x={GRID.mark} y={1080 - GRID.mark} />
          <RegMark x={1920 - GRID.mark} y={1080 - GRID.mark} />
        </Plate>
      ))}
      {/* 钻进孔的时候，孔里先露出下一幕的热敏头亮线 */}
      {f >= ZOOM.at && (
        <div
          style={{
            position: 'absolute',
            left: HOLE.x - HOLE.r,
            top: HOLE.y - HOLE.r,
            width: HOLE.r * 2,
            height: HOLE.r * 2,
            borderRadius: '50%',
            background: C.master,
            boxShadow: `inset 0 0 0 ${2 / z}px ${C.hot}`,
            opacity: tween(f, ZOOM.at + 4, 10),
          }}
        />
      )}
    </div>
  );
};
