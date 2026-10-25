/**
 * 011 · 粘土原语：成对阴影、微鼓填充、英雄接力、镜头。
 * 光默认左上。按下时外影收、内凹加深——体积被掐进去，不是透明度闪一下。
 */
import React from 'react';
import {E, track, tween} from '../../../src/lib/anim';
import {C, TONE, Tone} from '../tokens';
import {AT} from './timeline';

export type CSS = React.CSSProperties;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

export type Light = {x: number; y: number};

export const clayShadow = (depth: number, press: number, light: Light): string => {
  const d = Math.max(0.12, depth * (1 - 0.58 * press));
  const ox = (-light.x * 16 + 3) * d;
  const oy = (18 - light.y * 10) * d;
  const blur = 10 + 28 * d;
  const ix = light.x * (7 + 6 * d);
  const iy = light.y * (7 + 6 * d);
  const hi = 0.74 + 0.08 * (1 - press);
  const lo = 0.26 + 0.22 * press;
  return [
    `${ox.toFixed(1)}px ${oy.toFixed(1)}px ${blur.toFixed(1)}px ${(2 * d).toFixed(1)}px rgba(148,164,186,${(0.4 * d).toFixed(3)})`,
    `${(ox * 0.35).toFixed(1)}px ${(oy * 0.4).toFixed(1)}px ${(blur * 0.42).toFixed(1)}px rgba(148,164,186,${(0.2 * d).toFixed(3)})`,
    `inset ${ix.toFixed(1)}px ${iy.toFixed(1)}px ${(10 + 8 * d).toFixed(1)}px rgba(255,255,255,${hi.toFixed(3)})`,
    `inset ${(-ix * 1.15).toFixed(1)}px ${(-iy * 1.15).toFixed(1)}px ${(12 + 9 * d).toFixed(1)}px rgba(130,146,168,${lo.toFixed(3)})`,
  ].join(', ');
};

export const clayFill = (tone: Tone, light: Light, press: number): string => {
  const t = TONE[tone];
  const px = 32 + light.x * 20;
  const py = 24 + light.y * 16;
  const mid = press > 0.01 ? mixHex(t.base, t.lo, press * 0.35) : t.base;
  return `radial-gradient(ellipse at ${px.toFixed(1)}% ${py.toFixed(1)}%, ${t.hi} 0%, ${mid} 58%, ${t.lo} 100%)`;
};

const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)] as const;
export const mixHex = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  const c = (i: number) => Math.round(lerp(A[i], B[i], t));
  return `rgb(${c(0)},${c(1)},${c(2)})`;
};

export const ClayShape: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  tone: Tone;
  depth?: number;
  press?: number;
  light?: Light;
  opacity?: number;
  rotate?: number;
  scale?: number;
  style?: CSS;
  children?: React.ReactNode;
}> = ({x, y, w, h, r, tone, depth = 1, press = 0, light = {x: -0.55, y: -0.65}, opacity = 1, rotate = 0, scale = 1, style, children}) => {
  const rad = Math.min(r, w / 2, h / 2);
  const sx = scale * (1 + press * 0.045);
  const sy = scale * (1 - press * 0.1);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: rad,
        background: clayFill(tone, light, press),
        boxShadow: clayShadow(depth, press, light),
        opacity,
        scale: `${sx} ${sy}`,
        rotate: rotate ? `${rotate}deg` : undefined,
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const ClaySphere: React.FC<{
  x: number;
  y: number;
  d: number;
  tone: Tone;
  depth?: number;
  light?: Light;
  opacity?: number;
  scale?: number;
  style?: CSS;
  children?: React.ReactNode;
}> = ({x, y, d, tone, depth = 1, light, opacity, scale, style, children}) => (
  <ClayShape x={x} y={y} w={d} h={d} r={d} tone={tone} depth={depth} light={light} opacity={opacity} scale={scale} style={style}>
    {children}
  </ClayShape>
);

const AMBIENT: {x: number; y: number; r: number; tone: Tone; ph: number}[] = [
  {x: -40, y: -60, r: 280, tone: 'mint', ph: 0.2},
  {x: 1580, y: -40, r: 320, tone: 'lavender', ph: 1.1},
  {x: -80, y: 820, r: 260, tone: 'sky', ph: 2.0},
  {x: 1640, y: 860, r: 240, tone: 'rose', ph: 2.8},
  {x: 820, y: -120, r: 200, tone: 'cream', ph: 0.6},
];

export const Paper: React.FC<{f: number; light?: Light}> = ({f, light = {x: -0.55, y: -0.65}}) => {
  const gx = 42 + light.x * 10;
  const gy = 32 + light.y * 10;
  return (
    <div style={{position: 'absolute', inset: 0, background: C.paper, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at ${gx}% ${gy}%, #F4F7FB 0%, ${C.paper} 48%, ${C.paperDeep} 100%)`,
        }}
      />
      {AMBIENT.map((b, i) => {
        const dx = Math.sin(f / 46 + b.ph) * 18;
        const dy = Math.cos(f / 54 + b.ph) * 14;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: b.x + dx,
              top: b.y + dy,
              width: b.r * 2,
              height: b.r * 2,
              borderRadius: '50%',
              background: TONE[b.tone].base,
              opacity: 0.16,
              filter: 'blur(28px)',
            }}
          />
        );
      })}
    </div>
  );
};

export type Hero = {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  tone: Tone;
  press: number;
  depth: number;
  light: Light;
};

const PRESS_HITS = [30, 870, 900, 930];

const pressAt = (f: number) => {
  let p = 0;
  for (const hit of PRESS_HITS) {
    const t = f - hit;
    if (t < 0 || t > 28) continue;
    const v = t < 5 ? t / 5 : Math.exp(-(t - 5) / 7);
    p = Math.max(p, v);
  }
  return clamp01(p);
};

export const heroOf = (f: number): Hero => {
  const x = track(f, [
    {f: 0, v: 760},
    {f: 8, v: 740, d: 20, e: 'smooth'},
    {f: 30, v: 610, d: 16, e: 'pop'},
    {f: 236, v: 360, d: 30, e: 'smooth'},
    {f: 700, v: 380, d: 22, e: 'smooth'},
    {f: 760, v: 610, d: 30, e: 'smooth'},
    {f: 948, v: 1072, d: 36, e: 'smooth'},
    {f: 1192, v: 210, d: 38, e: 'smooth'},
  ]);
  const y = track(f, [
    {f: 0, v: -300},
    {f: 8, v: 292, d: 22, e: 'smooth'},
    {f: 30, v: 400, d: 16, e: 'pop'},
    {f: 236, v: 188, d: 30, e: 'smooth'},
    {f: 700, v: 198, d: 22, e: 'smooth'},
    {f: 760, v: 400, d: 30, e: 'smooth'},
    {f: 948, v: 292, d: 36, e: 'smooth'},
    {f: 1192, v: 128, d: 38, e: 'smooth'},
  ]);
  const w = track(f, [
    {f: 0, v: 400},
    {f: 8, v: 440, d: 18, e: 'smooth'},
    {f: 30, v: 700, d: 16, e: 'pop'},
    {f: 236, v: 1200, d: 32, e: 'smooth'},
    {f: 700, v: 1160, d: 22, e: 'smooth'},
    {f: 760, v: 700, d: 30, e: 'smooth'},
    {f: 948, v: 436, d: 36, e: 'smooth'},
    {f: 1192, v: 1500, d: 38, e: 'smooth'},
  ]);
  const h = track(f, [
    {f: 0, v: 540},
    {f: 8, v: 370, d: 18, e: 'smooth'},
    {f: 30, v: 220, d: 16, e: 'pop'},
    {f: 236, v: 640, d: 32, e: 'smooth'},
    {f: 700, v: 620, d: 22, e: 'smooth'},
    {f: 760, v: 220, d: 30, e: 'smooth'},
    {f: 948, v: 188, d: 36, e: 'smooth'},
    {f: 1192, v: 820, d: 38, e: 'smooth'},
  ]);
  const r = track(f, [
    {f: 0, v: 200},
    {f: 8, v: 168, d: 16, e: 'smooth'},
    {f: 30, v: 110, d: 16, e: 'pop'},
    {f: 244, v: 12, d: 20, e: 'inOut'},
    {f: 270, v: 22, d: 16, e: 'smooth'},
    {f: 300, v: 34, d: 16, e: 'smooth'},
    {f: 330, v: 46, d: 16, e: 'smooth'},
    {f: 360, v: 56, d: 18, e: 'smooth'},
    {f: 760, v: 110, d: 28, e: 'smooth'},
    {f: 948, v: 94, d: 28, e: 'smooth'},
    {f: 1192, v: 72, d: 32, e: 'smooth'},
  ]);
  let light: Light = {x: -0.55, y: -0.65};
  if (f >= AT.shadows - 6 && f < AT.pastel + 24) {
    const a = (f - AT.shadows) / 36;
    light = {x: Math.cos(a + 3.7), y: Math.sin(a + 3.7)};
  } else if (f >= AT.end) {
    const a = (f - AT.end) / 52;
    light = {x: -0.55 + Math.sin(a) * 0.18, y: -0.65 + Math.cos(a) * 0.12};
  }
  const breathe = 0.92 + 0.08 * Math.sin(f / 17);
  return {
    x,
    y,
    w,
    h,
    r,
    tone: 'peach',
    press: pressAt(f),
    depth: breathe,
    light,
  };
};

export const camOf = (f: number) => {
  const punch = f < 30 ? lerp(1.02, 1.0, clamp01(f / 30)) : tween(f, 30, 18, 1.12, 1, E.out);
  const push = (at: number, dur: number, amt: number) => tween(f, at, dur, 0, amt, E.inOut);
  const scale = punch + push(AT.corners, 200, 0.045) + push(AT.shadows, 200, 0.03) + push(AT.product, 180, 0.05) + push(AT.end, 200, 0.028);
  const x = Math.sin(f / 70) * 6 + tween(f, AT.product, 40, 0, -18, E.soft);
  const y = Math.cos(f / 82) * 4;
  return {scale, x, y};
};

export const HeroClay: React.FC<{f: number; children?: React.ReactNode}> = ({f, children}) => {
  const h = heroOf(f);
  return (
    <ClayShape
      x={h.x}
      y={h.y}
      w={h.w}
      h={h.h}
      r={h.r}
      tone={h.tone}
      depth={h.depth}
      press={h.press}
      light={h.light}
    >
      {children}
    </ClayShape>
  );
};

type Crumb = {a: number; v: number; s: number; tone: Tone};
const CRUMBS: Crumb[] = [
  {a: 0.2, v: 9.2, s: 18, tone: 'peach'},
  {a: 0.7, v: 11.4, s: 14, tone: 'mint'},
  {a: 1.3, v: 8.6, s: 16, tone: 'lavender'},
  {a: 1.9, v: 12.1, s: 12, tone: 'rose'},
  {a: 2.4, v: 9.8, s: 15, tone: 'sky'},
  {a: 3.0, v: 10.6, s: 13, tone: 'cream'},
  {a: 3.6, v: 8.1, s: 17, tone: 'peach'},
  {a: 4.2, v: 11.8, s: 11, tone: 'mint'},
  {a: 4.8, v: 9.4, s: 14, tone: 'lavender'},
  {a: 5.3, v: 12.8, s: 12, tone: 'rose'},
  {a: 0.95, v: 7.4, s: 10, tone: 'sky'},
  {a: 2.7, v: 13.2, s: 11, tone: 'cream'},
  {a: 5.8, v: 8.8, s: 13, tone: 'peach'},
  {a: 1.55, v: 10.2, s: 15, tone: 'mint'},
];

export const Crumbs: React.FC<{f: number; t0: number; x: number; y: number}> = ({f, t0, x, y}) => {
  const t = f - t0;
  if (t < 0 || t > 64) return null;
  const fade = 1 - tween(f, t0 + 36, 28, 0, 1, E.soft);
  return (
    <>
      {CRUMBS.map((c, i) => {
        const px = x + Math.cos(c.a) * c.v * t * Math.exp(-t / 38);
        const py = y + Math.sin(c.a) * c.v * t * Math.exp(-t / 38) + 0.07 * t * t;
        const s = c.s * (1 - t / 90);
        return <ClaySphere key={i} x={px - s / 2} y={py - s / 2} d={s} tone={c.tone} depth={0.7} opacity={fade} />;
      })}
    </>
  );
};
