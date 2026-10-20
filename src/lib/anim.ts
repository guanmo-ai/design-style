import {Easing, interpolate, interpolateColors, spring} from 'remotion';

export const FPS = 60;
export const BEAT = 30; // 120 BPM @ 60fps

export const E = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.55, 0, 0.9, 0.3),
  soft: Easing.bezier(0.33, 1, 0.68, 1),
};

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** 线性区间 + 缓动 */
export const tween = (
  f: number,
  start: number,
  dur: number,
  from = 0,
  to = 1,
  ease: (t: number) => number = E.out,
) =>
  interpolate(f, [start, start + dur], [from, to], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

export type SpringCfg = {damping?: number; mass?: number; stiffness?: number};
export const SNAP: SpringCfg = {damping: 11, mass: 0.7, stiffness: 170};
export const POP: SpringCfg = {damping: 8, mass: 0.5, stiffness: 220};
export const SMOOTH: SpringCfg = {damping: 20, mass: 0.9, stiffness: 120};

export const spr = (f: number, start: number, cfg: SpringCfg = SNAP, dur?: number) =>
  spring({frame: f - start, fps: FPS, config: cfg, durationInFrames: dur});

/**
 * 关键帧轨道：每个关键帧描述“从上一个值过渡到 v”的方式。
 * 用于让同一组几何体贯穿全片、在不同场景之间连续变形。
 */
export type Key = {
  f: number;
  v: number;
  d?: number; // 过渡时长（帧）
  e?: 'spring' | 'pop' | 'smooth' | 'out' | 'inOut' | 'in' | 'step';
};

export const track = (frame: number, keys: Key[]): number => {
  let v = keys[0].v;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (frame < k.f) break;
    const from = keys[i - 1].v;
    const d = k.d ?? 24;
    let p = 1;
    switch (k.e ?? 'spring') {
      case 'spring':
        p = spr(frame, k.f, SNAP, d);
        break;
      case 'pop':
        p = spr(frame, k.f, POP, d);
        break;
      case 'smooth':
        p = spr(frame, k.f, SMOOTH, d);
        break;
      case 'step':
        p = 1;
        break;
      default:
        p = tween(frame, k.f, d, 0, 1, E[k.e as 'out' | 'inOut' | 'in']);
    }
    v = from + (k.v - from) * p;
  }
  return v;
};

/** 颜色轨道：[帧, 颜色] 序列，相邻关键帧之间线性混色 */
export const colorTrack = (frame: number, keys: [number, string][]): string => {
  if (frame <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (frame <= keys[i][0]) {
      return interpolateColors(frame, [keys[i - 1][0], keys[i][0]], [keys[i - 1][1], keys[i][1]]);
    }
  }
  return keys[keys.length - 1][1];
};

/** 冲击镜头抖动：每个冲击点产生一段衰减正弦 */
export const shake = (frame: number, hits: [number, number][]) => {
  let x = 0;
  let y = 0;
  for (const [f0, amp] of hits) {
    const t = frame - f0;
    if (t < 0 || t > 40) continue;
    const decay = Math.exp(-t / 7);
    x += amp * decay * Math.sin(t * 1.9 + f0);
    y += amp * decay * Math.cos(t * 2.3 + f0 * 0.7);
  }
  return {x, y};
};
