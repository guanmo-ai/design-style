/**
 * 007 · Minimalism —— 画面上每一个“会出声”的时刻（帧）。
 * audio/export_cues.mjs 把它打包成 audio/cues.json，make_music.py 读这份 JSON 来对位，画面一改、配乐自动跟着改。
 */
import {AT, DURATION} from './timeline';
import {CLUTTER_TIMES, HANDOFF, LAND} from './opening';
import {COL_TIMES, OUT01, PASS01, ROOF_LAND, STEP_TIMES, WALL_TIMES} from './space';
import {CUT_TIMES, DETENTS, JUDD_AT, LAST_CUT, LAST_RING, ON_AT, OUT03, TURN_AT} from './radio';
import {DOWN_TIMES, PHONE_AT, RETRACT, UNIT_TIMES} from './judd';
import {CUT05, RECAP_AT, TAP_AT} from './today';
import {END_AT, ERA_CUTS} from './finale';

export const CUES = {
  fps: 60,
  bpm: 120,
  frames: DURATION,
  at: AT,
  opening: {clutter: CLUTTER_TIMES, land: LAND, handoff: HANDOFF},
  space: {walls: WALL_TIMES, steps: STEP_TIMES, columns: COL_TIMES, roofLand: ROOF_LAND, out: OUT01, pass: PASS01},
  radio: {cuts: CUT_TIMES, lastRing: LAST_RING, lastCut: LAST_CUT, turn: TURN_AT, detents: DETENTS, on: ON_AT, out: OUT03, judd: JUDD_AT},
  judd: {units: UNIT_TIMES, down: DOWN_TIMES, retract: RETRACT, phone: PHONE_AT},
  today: {tap: TAP_AT, cuts: CUT05, recap: RECAP_AT},
  finale: {eraCuts: ERA_CUTS, end: END_AT},
};
