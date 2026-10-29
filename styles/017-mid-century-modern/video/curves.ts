/**
 * 剧本曲线：每一帧主角的速度、高度与运动模糊取样数。查跳变、死区、过冲。
 *   node scripts/motion_curves.mjs styles/017-mid-century-modern/video/curves.ts out/curves-017.json
 *   python3 scripts/plot_probe.py out/curves-017.json out/curves-017.png
 */
import {probeChannels} from '../../../src/lib/motion/sampling';
import {ballPose, barPose, cam, discR, handPose, midPose, modPose} from './opening';
import {speedAt} from './scenes';
import {DURATION} from './timeline';

export {DURATION};
const v = (p: (t: number) => {x: number; y: number} | null, t: number) => {
  const a = p(t - 0.5);
  const b = p(t + 0.5);
  return a && b ? Math.hypot(b.x - a.x, b.y - a.y) : NaN;
};

export const probe = (f: number) => probeChannels(f, {
  blur_speed: {value: () => speedAt(f)},
  cam_s: {value: () => cam(f).s * 100},
  cam_x: {value: () => cam(f).x / 10},
  disc_r: {value: () => discR(f) / 10, to: 140},
  bar2_v: {value: () => v((t) => barPose(2, t), f), to: 130},
  bar2_h: {value: () => barPose(2, f)?.h ?? NaN, to: 130},
  ball7_v: {value: () => v((t) => ballPose(7, t), f), from: 120, to: 220},
  ball7_h: {value: () => ballPose(7, f)?.h ?? NaN, from: 120, to: 220},
  hand_v: {value: () => v(handPose, f), from: 186, to: 290},
  hand_h: {value: () => handPose(f).h ?? NaN, from: 186, to: 290},
  M_h: {value: () => midPose(0, f)?.h ?? NaN, from: 260, to: 320},
  O_h: {value: () => modPose(1, f)?.h ?? NaN, from: 340, to: 410},
}, );
