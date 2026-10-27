/** 中线的位置与角度：全片只有这两条轨道（全局帧）。章节只读，不改 */
import {clamp} from '../../../src/lib/anim';
import {AT, PRE} from './timeline';
import {SLIDE} from './ui';

const W = 1920;
type Key = [number, number, number]; // [起点帧, 目标值, 时长]
const run = (f: number, v0: number, keys: Key[], ease: (t: number) => number) => {
  let from = v0;
  let v = v0;
  for (const [at, to, dur] of keys) {
    if (f < at) break;
    v = from + (to - from) * ease(clamp((f - at) / dur));
    from = to;
  }
  return v;
};
export const GOLD = W * 0.618;
const X_KEYS: Key[] = [
  [AT.ratio - PRE, 960, 30], // 进入比例章：62 → 50
  [AT.ratio + 54, GOLD, 26], // 50 → 62
  [AT.ratio + 110, W * 0.7, 26], // 62 → 70
  [AT.contrast - PRE, 960, 30], // 反差章：对半
  [AT.scroll - PRE, W * 0.382, 30], // 滚动章：左窄右宽（38:62）
  [AT.resp - PRE, 960, 30], // 响应式：对半
  [AT.end - PRE, GOLD, 30], // 片尾：回到 61.8
];
export const xAt = (f: number) => run(f, GOLD, X_KEYS, SLIDE);
// 响应式章里，窗口窄过 768 的一刻整条中线转 90°；进片尾后再转回竖直
const THETA_KEYS: Key[] = [
  [AT.resp + 100, Math.PI / 2, 30],
  [AT.end + 14, 0, 40],
];
export const thetaAt = (f: number) => run(f, 0, THETA_KEYS, SLIDE);

