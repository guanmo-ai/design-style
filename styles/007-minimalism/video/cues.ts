/**
 * 007 · Minimalism —— 画面上每一个“会出声”的时刻（帧）。
 */
import {AT, DURATION} from './timeline';
import {CLUTTER_TIMES, HANDOFF, LAND} from './opening';
import {HOOK_CUTS, PRESS_AT, PUSH_AT, SHEET_AT, SHEET_OUT, SHEET_TAP, TOG_AT} from './app';
import {ANCHOR_AT, HOVER_AT, SCROLL_AT} from './web';
import {EMPTY_AT, PAY_OK, PAY_PRESS} from './pay';
import {END_AT} from './finale';

export const CUES = {
  fps: 60,
  bpm: 120,
  frames: DURATION,
  at: AT,
  opening: {clutter: CLUTTER_TIMES, land: LAND, handoff: HANDOFF},
  app: {cuts: HOOK_CUTS, press: PRESS_AT, push: PUSH_AT, sheet: SHEET_AT, sheetTap: SHEET_TAP, sheetOut: SHEET_OUT, tog: TOG_AT},
  web: {hover: HOVER_AT, scroll: SCROLL_AT, anchor: ANCHOR_AT},
  pay: {press: PAY_PRESS, ok: PAY_OK, empty: EMPTY_AT},
  finale: {end: END_AT},
};
