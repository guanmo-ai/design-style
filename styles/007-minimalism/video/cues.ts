/**
 * 007 · 六改 —— 每一个会出声的帧
 */
import {BITS} from './opening';
import {APP_CUTS, APP_KEEP, DATA_CUTS, DATA_KEEP, PAY_CUTS, PAY_KEEP, WEB_CUTS, WEB_KEEP} from './panes';
import {GRID_AT, SPACE_AT, WEIGHT_AT} from './bone';
import {VS_BOOM, VS_SUCK, VS_SPLIT} from './vs';
import {END_AT, POSTER_AT} from './finale';
import {AT, DURATION} from './timeline';

export const CUES = {
  fps: 60,
  bpm: 120,
  frames: DURATION,
  at: AT,
  blast: {lands: BITS.map((b) => b.in), shouts: BITS.map((b) => b.shout), snap: 108},
  split: {at: AT.split},
  app: {cuts: APP_CUTS, keep: APP_KEEP},
  web: {cuts: WEB_CUTS, keep: WEB_KEEP},
  pay: {cuts: PAY_CUTS, keep: PAY_KEEP},
  data: {cuts: DATA_CUTS, keep: DATA_KEEP},
  vs: {at: AT.vs, split: VS_SPLIT, boom: VS_BOOM, suck: VS_SUCK},
  bone: {grid: GRID_AT, weight: WEIGHT_AT, space: SPACE_AT},
  hold: {at: POSTER_AT},
  poster: {at: POSTER_AT},
  finale: {end: END_AT},
};
