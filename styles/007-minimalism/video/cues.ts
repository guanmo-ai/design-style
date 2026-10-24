/**
 * 007 · Minimalism —— 画面上每一个“会出声”的时刻（帧）。
 */
import {CUTS} from './script';
import {AT, DURATION} from './timeline';
import {CLUTTER_TIMES, HANDOFF, LAND} from './opening';
import {GRID_AT, SPACE_AT, WEIGHT_AT} from './bone';
import {APP_CUTS, APP_KEEP} from './app';
import {WEB_CUTS, WEB_KEEP} from './web';
import {PAY_CUTS, PAY_KEEP} from './pay';
import {VS_LABEL, VS_SPLIT} from './vs';
import {END_AT, POSTER_AT} from './finale';

export const CUES = {
  fps: 60,
  bpm: 120,
  frames: DURATION,
  at: AT,
  pile: {start: AT.pile, cut: AT.cut},
  opening: {clutter: CLUTTER_TIMES, land: LAND, handoff: HANDOFF},
  cut: {hits: CUTS.map((c) => c.at), clutter: CLUTTER_TIMES},
  bone: {grid: GRID_AT, weight: WEIGHT_AT, space: SPACE_AT},
  app: {cuts: APP_CUTS, keep: APP_KEEP},
  web: {cuts: WEB_CUTS, keep: WEB_KEEP},
  pay: {cuts: PAY_CUTS, keep: PAY_KEEP},
  vs: {at: AT.vs, split: VS_SPLIT, label: VS_LABEL},
  poster: {at: POSTER_AT},
  finale: {end: END_AT},
};
