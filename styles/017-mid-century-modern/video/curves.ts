/**
 * 剧本曲线：每一帧主角的速度、高度与运动模糊取样数。查跳变、死区、过冲。
 *   node scripts/motion_curves.mjs styles/017-mid-century-modern/video/curves.ts out/curves-017.json
 *   python3 scripts/plot_probe.py out/curves-017.json out/curves-017.png
 */
import {probeChannels} from '../../../src/lib/motion/sampling';
import {cam} from './kit';
import {modPose} from './poster';
import {spokeState} from './spokes';
import {boxState, recordState} from './ch345';
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
  spoke3_v: {value: () => v((t) => spokeState(3, t)?.p, f), to: 300},
  spoke3_h: {value: () => spokeState(3, f)?.p.h ?? NaN, to: 300},
  record_v: {value: () => v((t) => recordState(t)?.p, f), from: 280, to: 440},
  box_v: {value: () => v((t) => boxState(t)?.p, f), from: 440, to: 540},
  O_h: {value: () => modPose(1, f)?.h ?? NaN, from: 40, to: 100},
});
