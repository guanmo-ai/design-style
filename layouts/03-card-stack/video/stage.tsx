/** 取景框：小字 HUD，不用大字干晾。规则用 16→4 的画面教。 */
import React from 'react';
import {E, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {BEATS, DURATION, SCENE} from './layout';
import {gro, mono, Rise, RiseBox, sc, Show} from './ui';

const CHAPTERS: [string, number][] = [
  ['风暴 16', SCENE.OPEN.in],
  ['刊 · 抽', SCENE.MAG.in],
  ['层 · 提', SCENE.LAYER.in],
  ['样 · 扇', SCENE.PROOF.in],
  ['看板', SCENE.BOARD.in],
  ['相册 · 洗', SCENE.ALBUM.in],
  ['通知 · 压', SCENE.NOTE.in],
  ['支付 · 抽', SCENE.PAY.in],
  ['作品集', SCENE.FOLIO.in],
  ['16 → 4', SCENE.PIT.in],
];

const inkOn = (f: number) => {
  if (f < 162 || (f >= 282 && f < 402) || (f >= 522 && f < 642) || (f >= 762 && f < 882) || f >= 1242) return C.cream;
  return C.ink;
};

export const Hud: React.FC<{f: number}> = ({f}) => {
  const o = tween(f, 20, 10) * (1 - tween(f, SCENE.END.in + 8, 12, 0, 1, E.in));
  if (o <= 0.001) return null;
  let k = 0;
  CHAPTERS.forEach(([, at], j) => {
    if (f >= at) k = j;
  });
  const color = inkOn(f);
  return (
    <div style={{position: 'absolute', left: 48, right: 48, top: 1028, height: 28, opacity: o, display: 'flex', justifyContent: 'space-between', color}}>
      <span style={{...gro(16, 700)}}>Card Stack</span>
      <span>
        <span style={{...gro(15, 700), color: C.red, marginRight: 10}}>{`${String(k + 1).padStart(2, '0')} / 10`}</span>
        <span style={{...sc(15, 500)}}>{CHAPTERS[k][0]}</span>
      </span>
    </div>
  );
};

export const Count: React.FC<{f: number}> = ({f}) => {
  const n = f >= BEATS.fix ? 4 : f >= BEATS.noise ? 24 : 16;
  const o = tween(f, 12, 8) * (1 - tween(f, SCENE.END.in, 10));
  if (o <= 0.001) return null;
  return (
    <div style={{position: 'absolute', left: 48, top: 36, opacity: o, color: inkOn(f), ...mono(13)}}>
      {n} on screen
    </div>
  );
};

export const EndTitle: React.FC<{f: number}> = ({f}) => {
  if (f < SCENE.END.in - 2) return null;
  return (
    <>
      <RiseBox f={f} at={SCENE.END.in} out={DURATION} h={70} style={{left: 56, top: 760}}>
        <div style={{...gro(64, 700, -0.05), color: C.cream}}>Card Stack</div>
      </RiseBox>
      <Show f={f} at={SCENE.END.in + 8} out={DURATION} style={{left: 58, top: 838, color: C.cream, display: 'flex', gap: 22}}>
        {['3–4 张', '只读一张', '抽提压扇洗'].map((t) => (
          <span key={t} style={{...sc(16, 500)}}>{t}</span>
        ))}
      </Show>
      <Show f={f} at={SCENE.END.in + 18} out={DURATION} style={{left: 58, top: 878, color: C.red, ...gro(18, 700)}}>
        @guanmo_ai
      </Show>
    </>
  );
};

export const PitMark: React.FC<{f: number}> = ({f}) => (
  <>
    <Show f={f} at={BEATS.noise - 8} out={BEATS.flat - 2} style={{left: 48, top: 64, color: C.ink}}>
      <Rise f={f} at={BEATS.noise - 4} out={BEATS.flat - 2} text="叠太多" style={{...gro(36, 700, -0.04)}} />
    </Show>
    <Show f={f} at={BEATS.flat - 2} out={1192} style={{left: 48, top: 64, color: C.ink}}>
      <Rise f={f} at={BEATS.flat} out={1192} text="铺平" style={{...gro(36, 700, -0.04)}} />
    </Show>
    <Show f={f} at={1192} out={SCENE.END.in} style={{left: 48, top: 64, color: C.ink}}>
      <Rise f={f} at={1194} out={SCENE.END.in} text="3–4 张" style={{...gro(36, 700, -0.04)}} />
    </Show>
  </>
);
