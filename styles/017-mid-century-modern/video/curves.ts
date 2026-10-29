/**
 * 剧本曲线：每一帧主角的速度、高度与运动模糊取样数。查跳变、死区、过冲。
 *   node scripts/motion_curves.mjs styles/017-mid-century-modern/video/curves.ts out/curves-017.json
 *   python3 scripts/plot_probe.py out/curves-017.json out/curves-017.png
 */
import {probeChannels} from '../../../src/lib/motion/sampling';
import {cam, modPose, spokePose} from './film';
import {speedAt} from './scenes';
import {DURATION} from './timeline';

export {DURATION};
const v = (p: (t: number) => {x: number; y: number} | null | undefined, t: number) => {
  const a = p(t - 0.5);
  const b = p(t + 0.5);
  return a && b ? Math.hypot(b.x - a.x, b.y - a.y) : NaN;
};

export const probe = (f: number) => probeChannels(f, {
  blur_speed: {value: () => speedAt(f)},
  cam_s: {value: () => cam(f).s * 100},
  spoke3_v: {value: () => v((t) => spokePose(3, t)?.p, f), to: 220},
  spoke3_h: {value: () => spokePose(3, f)?.p.h ?? NaN, to: 220},
  O_h: {value: () => modPose(1, f)?.h ?? NaN, from: 40, to: 100},
});
