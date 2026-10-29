/**
 * 剧本曲线：每一帧各个主角的速度、右上角读数（v / wdth / 残影层数）、运动模糊取样数。
 *   node scripts/motion_curves.mjs styles/015-futurism/video/curves.ts out/curves-015.json
 *   python3 scripts/plot_probe.py out/curves-015.json out/curves-015.png
 * 用来查：跳变、死区、刹车是不是匀减速（速度曲线是直线）、残影层数是不是跟速度一起收拢。
 */
import {carZ, sceneT} from './night';
import {dogX, ladyX} from './balla';
import {cabY, mX} from './type';
import {trainX} from './train';
import {camZ} from './sky';
import {cardX} from './rules';
import {probeAt, speedAt} from './scenes';
import {DURATION, SHIFT} from './timeline';
import {probeChannels} from '../../../src/lib/motion/sampling';

export {DURATION};
const v = (p: (t: number) => number, t: number) => p(t + 0.5) - p(t - 0.5);
const S = SHIFT;

export const probe = (f: number) => {
  const p = probeAt(f);
  const g = f > DURATION / 2 ? f - DURATION : f; // 片尾接开头
  return probeChannels(f, {
    hud_v: {value: () => p ? Math.abs(p.v) : 0},
    hud_wdth: {value: () => p ? p.wdth : 62},
    hud_n: {value: () => p ? p.n : 0},
    blur_speed: {value: () => speedAt(f)},
    car_z: {value: () => g > -60 && g < 95 ? carZ(sceneT(g)) : NaN},
    scene_time: {value: () => g > -60 && g < 40 ? sceneT(g) - g : NaN},
    dog_v: {value: () => f >= 100 && f < 250 ? v(dogX, f) : NaN},
    lady_v: {value: () => f >= 100 && f < 250 ? v(ladyX, f) : NaN},
    M_v: {value: () => f >= 340 + S && f < 400 + S ? v(mX, f - S) : NaN},
    cab_v: {value: () => f >= 440 + S && f < 500 + S ? Math.max(Math.abs(v((u) => cabY(0, u), f - S)), Math.abs(v((u) => cabY(1, u), f - S))) : NaN},
    train_v: {value: () => f >= 495 + S && f < 600 + S ? v(trainX, f - S) : NaN},
    dive_logz: {value: () => f >= 600 + S && f < 705 + S ? Math.log(camZ(f - S)) * 10 : NaN},
    card_v: {value: () => f >= 840 && f < 1190 ? Math.max(...[0, 1, 2, 3, 4, 5].map((i) => Math.abs(v((u) => cardX(i, u), f)))) : NaN},
  });
};
