/**
 * 各段登记：活着的时间窗 [from, to)、画面组件、读数（右上角 v / wdth / n）、最快的屏幕速度（决定运动模糊取几个子帧）。
 * 相邻两段在接力时会同时活着几帧（上一段的东西变成下一段的主角）。
 */
import React from 'react';
import {C} from '../tokens';
import type {Probe} from './hud';
import {Opening, openProbe} from './opening';
import {Walk, openCam, walkProbe, walkSpeed} from './walk';
import {Type, typeProbe, typeSpeed} from './type';
import {Train, trainProbe, trainSpeed} from './train';
import {Sky, skyProbe, skySpeed} from './sky';
import {Today, todayProbe, todaySpeed} from './today';
import {Rules, rulesProbe, rulesSpeed} from './rules';

const OpeningLive: React.FC<{t: number}> = ({t}) => React.createElement(Opening, {t, cam: openCam(t)});
import {AT, DURATION} from './timeline';

export type Scene = {
  from: number;
  to: number;
  C: React.FC<{t: number}>;
  shift?: number; // 组件拿到的是 t − shift（片尾复用开场：shift = 1200）
  probe?: (t: number) => Probe;
  speed?: (t: number) => number;
  bg?: string;
  dark?: boolean;
};

export const SCENES: Scene[] = [
  {from: -80, to: AT.dog + 30, C: OpeningLive, probe: openProbe, speed: (t) => Math.abs(openProbe(t).v)},
  {from: 84, to: AT.words + 1, C: Walk, probe: walkProbe, speed: walkSpeed},
  {from: AT.words, to: AT.train + 1, C: Type, probe: typeProbe, speed: typeSpeed},
  {from: AT.train, to: AT.sky + 1, C: Train, probe: trainProbe, speed: trainSpeed, bg: C.ink, dark: true},
  {from: AT.sky - 2, to: AT.today + 6, C: Sky, probe: skyProbe, speed: skySpeed, bg: C.cobalt, dark: true},
  {from: AT.today - 2, to: AT.rules + 60, C: Today, probe: todayProbe, speed: todaySpeed},
  {from: AT.rules, to: DURATION - 12, C: Rules, probe: rulesProbe, speed: rulesSpeed},
  {from: DURATION - 60, to: DURATION + 1, C: Opening, shift: DURATION, probe: (t) => openProbe(t - DURATION), speed: (t) => Math.abs(openProbe(t - DURATION).v)},
];

/** 读数 / 背景 / 运动模糊跟着“主段”走：这一刻最后开始的那一段 */
export const sceneIndex = (t: number) => {
  let k = 0;
  for (let i = 0; i < SCENES.length; i++) if (t >= SCENES[i].from && t < SCENES[i].to) k = i;
  return k;
};
export const probeAt = (t: number): Probe | null => {
  const s = SCENES[sceneIndex(t)];
  return s.probe ? s.probe(t) : null;
};
export const speedAt = (t: number) => {
  let v = 0;
  for (const s of SCENES) if (t >= s.from && t < s.to && s.speed) v = Math.max(v, s.speed(t));
  return v;
};
export const bgAt = (t: number) => SCENES[sceneIndex(t)].bg ?? C.paper;
export const darkAt = (t: number) => !!SCENES[sceneIndex(t)].dark;
