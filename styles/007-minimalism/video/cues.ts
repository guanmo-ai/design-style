/**
 * 007 · Minimalism —— 画面上每一个“会出声”的时刻（帧）。
 */
import {AT, DURATION} from './timeline';
import {CLUTTER_TIMES, HANDOFF, LAND} from './opening';
import {ACCENT_AT, AFTER_AT, ARROW_AT, BEFORE_AT, CUT_AT, FLASH_AT, GRID_AT, REC_ARROWS, REC_IN, REC_PULSE, SPLIT_AT, W_AT} from './teach';
import {HOOK_CUTS, PLUS_BACK, PLUS_TAP, PRESS_AT, PUSH_AT, SHEET_AT, SHEET_OUT, SHEET_TAP, SLIDE_AT, TOAST_AT, TOG_AT} from './app';
import {ANCHOR_AT, HASH_AT, HOVER_AT, HOVER_CTA, ROW_HOVER, SCROLL_AT} from './web';
import {DRAFT_AT, EMPTY_AT, FOLD_AT, PAY_OK, PAY_PRESS, PLUS_AT} from './pay';
import {END_AT} from './finale';

export const CUES = {
  fps: 60,
  bpm: 120,
  frames: DURATION,
  at: AT,
  opening: {clutter: CLUTTER_TIMES, land: LAND, handoff: HANDOFF},
  teach: {weights: W_AT, flash: FLASH_AT, grid: GRID_AT, before: BEFORE_AT, arrow: ARROW_AT, cut: CUT_AT, after: AFTER_AT, split: SPLIT_AT, accent: ACCENT_AT},
  app: {cuts: HOOK_CUTS, press: PRESS_AT, push: PUSH_AT, slide: SLIDE_AT, sheet: SHEET_AT, sheetTap: SHEET_TAP, sheetOut: SHEET_OUT, tog: TOG_AT, toast: TOAST_AT, plusBack: PLUS_BACK, plusTap: PLUS_TAP},
  web: {hover: HOVER_AT, cta: HOVER_CTA, scroll: SCROLL_AT, anchor: ANCHOR_AT, row: ROW_HOVER, hash: HASH_AT},
  pay: {press: PAY_PRESS, ok: PAY_OK, empty: EMPTY_AT, plus: PLUS_AT, draft: DRAFT_AT, fold: FOLD_AT},
  recap: {in: REC_IN, arrows: REC_ARROWS, pulse: REC_PULSE},
  finale: {end: END_AT},
};
