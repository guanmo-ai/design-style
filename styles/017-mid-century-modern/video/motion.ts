/**
 * 017 · 动作基本件。全片“丝滑”的三条底线：
 *   1) 每个量都是时间的纯函数，速度连续（缓动两端导数为 0，或从画外以速度进来）；
 *   2) 镜头走单调三次样条（Fritsch–Carlson），关键帧之间不过冲、不折线；
 *   3) 落地只给一次轻压（slap，单向，不来回抖）+ 很小的转角回正。
 */
export {clamp, ease, lerp, prog, tw, wobble} from '../../../src/lib/motion/kinematics';
import {clamp} from '../../../src/lib/motion/kinematics';

/** 单向的鼓包：u<0 为 0，u=1 到顶（=1），之后平滑回落，不过零 */
export const bump = (u: number) => (u <= 0 ? 0 : u * Math.exp(1 - u));

/** 纸片落地时的轻压：缩到 1 − k 再回到 1（不回弹过 1） */
export const slap = (t: number, t0: number, k = 0.03, d = 4) => 1 - k * bump((t - t0) / d);

/** 平滑的 0→1→0 弧线（抛物线的光滑版） */
export const arc = (u: number) => Math.sin(Math.PI * clamp(u));

/** 单调三次样条：keys = [[t, v], …]，两端速度为 0 */
export const spline = (keys: [number, number][]) => {
  const n = keys.length;
  const xs = keys.map((k) => k[0]);
  const ys = keys.map((k) => k[1]);
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = new Array<number>(n).fill(0);
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      m[i] = k * a * d[i];
      m[i + 1] = k * b * d[i];
    }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const u = (x - xs[i]) / h;
    const u2 = u * u;
    const u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * h * m[i + 1];
  };
};

/** 角度插值：沿 delta 走（delta 由调用方决定方向） */
export const angLerp = (a0: number, delta: number, e: number) => a0 + delta * e;

/** 把 a 规整到 (ref − 180, ref + 180] */
export const near = (a: number, ref: number) => {
  let x = a;
  while (x - ref > 180) x -= 360;
  while (x - ref <= -180) x += 360;
  return x;
};

/** 确定性伪随机（0—1） */
export const rnd = (i: number, salt = 0) => {
  const s = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
