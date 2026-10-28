/**
 * 剧本曲线：每一帧各个主角的位置 / 速度、右上角读数（v / wdth / 残影层数）、运动模糊取样数。
 *   node scripts/motion_curves.mjs styles/015-futurism/video/curves.ts out/curves-015.json
 *   python3 scripts/plot_probe.py out/curves-015.json out/curves-015.png
 * 用来查：跳变、死区、刹车是不是匀减速（速度曲线是直线）、残影层数是不是跟速度一起收拢。
 */
import {openProbe, titleX} from './opening';
import {dogX, walkerX} from './walk';
import {cabY, mX} from './type';
import {trainX} from './train';
import {camZ} from './sky';
import {cardX} from './rules';
import {probeAt, speedAt} from './scenes';
import {DURATION} from './timeline';

export {DURATION};
const v = (p: (t: number) => number, t: number) => p(t + 0.5) - p(t - 0.5);

export const probe = (f: number) => {
  const p = probeAt(f);
  return {
    hud_v: p ? Math.abs(p.v) : 0,
    hud_wdth: p ? p.wdth : 62,
    hud_n: p ? p.n : 0,
    blur_speed: speedAt(f),
    title_v: f < 130 ? v(titleX, f) : f > 1140 ? v(titleX, f - DURATION) : NaN,
    dog_v: f >= 100 && f < 200 ? v(dogX, f) : NaN,
    walker_v: f >= 120 && f < 300 ? v(walkerX, f) : NaN,
    M_v: f >= 340 && f < 400 ? v(mX, f) : NaN,
    cab_v: f >= 440 && f < 500 ? Math.max(Math.abs(v((u) => cabY(0, u), f)), Math.abs(v((u) => cabY(1, u), f))) : NaN,
    train_v: f >= 495 && f < 600 ? v(trainX, f) : NaN,
    dive_logz: f >= 600 && f < 705 ? Math.log(camZ(f)) * 10 : NaN,
    card_v: f >= 840 && f < 1200 ? Math.max(...[0, 1, 2, 3, 4, 5].map((i) => Math.abs(v((u) => cardX(i, u), f)))) : NaN,
    open_lean: f < 130 ? openProbe(f).lean : NaN,
  };
};
