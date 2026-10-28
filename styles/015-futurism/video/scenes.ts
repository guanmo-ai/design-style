/**
 * 各段登记：活着的时间窗 [from, to)、画面组件、读数（右上角 v / wdth / n）、最快的屏幕速度（决定运动模糊取几个子帧）。
 * 相邻两段在接力时会同时活着几帧（上一段的东西变成下一段的主角）。
 */
import React from 'react';
import {C} from '../tokens';
import type {Probe} from './hud';
import {Night, nightProbe, nightSpeed} from './night';
import {Balla, ballaProbe, ballaSpeed} from './balla';
import {Boccioni, bocProbe, bocSpeed} from './boccioni';
import {Type, typeProbe, typeSpeed} from './type';
import {Train, trainProbe, trainSpeed} from './train';
import {Sky, skyProbe, skySpeed} from './sky';
import {Today, todayProbe, todaySpeed} from './today';
import {Rules, rulesProbe, rulesSpeed} from './rules';

import {AT, DURATION, SHIFT} from './timeline';

export type Scene = {
  from: number;
  to: number;
  C: React.FC<{t: number}>;
  shift?: number; // 组件拿到的是 t − shift（片尾复用开场：shift = 1200）
  probe?: (t: number) => Probe | null;
  speed?: (t: number) => number;
  bg?: string;
  dark?: boolean;
};

/** 沿用第一版剧本的段：组件、读数、速度都按 t − SHIFT 取 */
const late = (sc: Omit<Scene, 'shift'>): Scene => ({
  ...sc,
  from: sc.from + SHIFT,
  to: sc.to + SHIFT,
  shift: SHIFT,
  probe: sc.probe ? (t: number) => sc.probe!(t - SHIFT) : undefined,
  speed: sc.speed ? (t: number) => sc.speed!(t - SHIFT) : undefined,
});

export const SCENES: Scene[] = [
  // 巴拉画在开场前面：开场最后那块橙色车身要盖在它上面、往左甩出去
  {from: 92, to: 252, C: Balla, probe: ballaProbe, speed: ballaSpeed, bg: C.ink, dark: true},
  {from: -60, to: 112, C: Night, probe: nightProbe, speed: nightSpeed, bg: C.ink, dark: true},
  {from: AT.sculpt, to: AT.words, C: Boccioni, probe: bocProbe, speed: bocSpeed, bg: C.ink, dark: true},
  late({from: 300, to: 501, C: Type, probe: typeProbe, speed: typeSpeed}),
  late({from: 500, to: 601, C: Train, probe: trainProbe, speed: trainSpeed, bg: C.ink, dark: true}),
  late({from: 598, to: 706, C: Sky, probe: skyProbe, speed: skySpeed, bg: C.cobalt, dark: true}),
  {from: AT.today - 2, to: AT.rules + 60, C: Today, probe: todayProbe, speed: todaySpeed},
  // 片尾：夜路先在片尾卡后面出现，卡起势冲走后露出来（所以画在规则卡之前）
  {from: DURATION - 60, to: DURATION + 1, C: Night, shift: DURATION, probe: () => null, speed: (t) => nightSpeed(t - DURATION), bg: C.ink, dark: true},
  {from: AT.rules, to: DURATION - 12, C: Rules, probe: rulesProbe, speed: rulesSpeed},
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
