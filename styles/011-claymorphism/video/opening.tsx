/**
 * 011 · 开场 0–4s：面团落下，第一拍掐成按钮。CLAY 四块字母是粘土，不是字幕。
 */
import React from 'react';
import {E, spr, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {ClayShape, Crumbs} from './clay';
import {AT} from './timeline';
import {Show, T, disp, sc} from './ui';

type P = {f: number};

const Finger: React.FC<{f: number; side: 'L' | 'R'}> = ({f, side}) => {
  const enter = spr(f, 10, {damping: 14, mass: 1.0, stiffness: 110}, 22);
  const exit = tween(f, 48, 28, 0, 1, E.soft);
  if (enter <= 0.01 || exit >= 0.99) return null;
  const left = side === 'L';
  const x0 = left ? -280 : 1920;
  const x1 = left ? 430 : 1280;
  const x = x0 + (x1 - x0) * enter + (left ? -1 : 1) * exit * 360;
  const y = 430 + Math.sin((f / 18) + (left ? 0 : 1)) * 6;
  return (
    <ClayShape
      x={x}
      y={y}
      w={220}
      h={160}
      r={80}
      tone={left ? 'mint' : 'lavender'}
      depth={0.95}
      rotate={left ? -18 : 18}
      opacity={1 - exit * 0.15}
    />
  );
};

const LETTERS: {ch: string; tone: 'peach' | 'mint' | 'lavender' | 'rose'; at: number}[] = [
  {ch: 'C', tone: 'peach', at: 48},
  {ch: 'L', tone: 'mint', at: 60},
  {ch: 'A', tone: 'lavender', at: 72},
  {ch: 'Y', tone: 'rose', at: 84},
];

export const ClayLetters: React.FC<P> = ({f}) => {
  const out = tween(f, AT.corners - 18, 20, 0, 1, E.soft);
  if (out >= 0.99) return null;
  return (
    <>
      {LETTERS.map((L, i) => {
        const p = spr(f, L.at, {damping: 11, mass: 0.8, stiffness: 160}, 22);
        if (p <= 0.01) return null;
        const x = 430 + i * 268;
        const y = 96 + (1 - p) * 80 - out * 40;
        return (
          <ClayShape key={L.ch} x={x} y={y} w={236} h={196} r={52} tone={L.tone} depth={0.95} scale={0.72 + 0.28 * p} opacity={1 - out} press={(1 - p) * 0.15}>
            <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', ...disp(128, 700, -0.04), color: C.ink}}>
              {L.ch}
            </div>
          </ClayShape>
        );
      })}
    </>
  );
};

export const Opening: React.FC<P> = ({f}) => {
  return (
    <>
      <Finger f={f} side="L" />
      <Finger f={f} side="R" />
      <Crumbs f={f} t0={30} x={960} y={510} />
      <ClayLetters f={f} />
      <Show f={f} at={118} out={AT.corners - 8} dy={14}>
        <T k="sc" x={960} y={348} size={36} align="center" style={{...sc(36, 700, 0.18), color: C.ink}}>
          粘土拟态
        </T>
      </Show>
    </>
  );
};
