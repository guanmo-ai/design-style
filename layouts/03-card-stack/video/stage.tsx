/** 取景框：每动一句因果。规则用画面证明，字幕只点破。 */
import React from 'react';
import {E, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {BEATS, DURATION, SCENE} from './layout';
import {gro, mono, Rise, RiseBox, sc, Show, Swap} from './ui';

const CHAPTERS: [string, number][] = [
  ['选片台', SCENE.HOOK.in],
  ['抽', SCENE.PULL.in],
  ['提', SCENE.LIFT.in],
  ['压', SCENE.PRESS.in],
  ['作品集', SCENE.FOLIO.in],
  ['看板', SCENE.BOARD.in],
  ['样张', SCENE.PROOF.in],
  ['3–4 张', SCENE.PIT.in],
];

type Line = {at: number; out: number; en: string; zh: string};

const LINES: Line[] = [
  {at: 8, out: 86, en: 'Six prints, none readable.', zh: '六张一样亮，一张都读不了'},
  {at: 92, out: 168, en: 'Keep 3–4. Read the top.', zh: '只留四张，读最上面'},
  {at: 176, out: 226, en: 'Pull the one you finished.', zh: '抽走已经看过的'},
  {at: 228, out: 324, en: 'The next sheet takes the job.', zh: '下一张接手交互面'},
  {at: 334, out: 396, en: 'A stack is front-to-back.', zh: '层叠是前后，不是平铺'},
  {at: 404, out: 528, en: 'Lift a buried sheet to read it.', zh: '后层提到最前，才轮到它'},
  {at: 536, out: 648, en: 'Fan to compare — not to focus all.', zh: '可以比较，还没有决定'},
  {at: 656, out: 732, en: 'Press the cover. The rest recede.', zh: '选定封面，其余压回'},
  {at: 742, out: 864, en: 'One cover decision at a time.', zh: '选封面：一次只定一张'},
  {at: 874, out: 1044, en: 'Moving a card = that card is in focus.', zh: '跨列：只处理这一张'},
  {at: 1054, out: 1164, en: 'Commit is a press.', zh: '定稿：压下去'},
  {at: 1172, out: 1204, en: 'Too many sheets is noise.', zh: '叠太多'},
  {at: 1208, out: 1238, en: '3–4. Hide the fifth.', zh: '3–4 张'},
];

const inkOn = (f: number) => {
  if (f < 90 || (f >= 330 && f < 510) || (f >= 870 && f < 1050) || f >= 1242) return C.cream;
  return C.ink;
};

export const Hud: React.FC<{f: number}> = ({f}) => {
  const o = tween(f, 16, 10) * (1 - tween(f, SCENE.END.in + 6, 12, 0, 1, E.in));
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
        <span style={{...gro(15, 700), color: C.red, marginRight: 10}}>{`${String(k + 1).padStart(2, '0')} / 08`}</span>
        <span style={{...sc(15, 500)}}>{CHAPTERS[k][0]}</span>
      </span>
    </div>
  );
};

export const Meaning: React.FC<{f: number}> = ({f}) => {
  const line = [...LINES].reverse().find((l) => f >= l.at && f < l.out);
  if (!line) return null;
  const color = inkOn(f);
  return (
    <Show f={f} at={line.at} out={line.out} style={{left: 48, top: 36, color, width: 820}}>
      <div style={{...mono(12), opacity: 0.62, marginBottom: 6}}>{line.en}</div>
      <div style={{...sc(28, 700, 0.02)}}>{line.zh}</div>
    </Show>
  );
};

export const EndTitle: React.FC<{f: number}> = ({f}) => {
  if (f < SCENE.END.in - 2) return null;
  return (
    <>
      <RiseBox f={f} at={SCENE.END.in} out={DURATION} h={78} style={{left: 56, top: 620}}>
        <div style={{...gro(72, 700, -0.05), color: C.cream}}>Card Stack</div>
      </RiseBox>
      <Show f={f} at={SCENE.END.in + 8} out={DURATION} style={{left: 58, top: 714, color: C.cream, display: 'flex', flexDirection: 'column', gap: 10}}>
        {['3–4 张，第五张是噪声', '同时只读一张', '换层用抽 / 提 / 压'].map((t) => (
          <span key={t} style={{...sc(22, 500)}}>{t}</span>
        ))}
      </Show>
      <Show f={f} at={SCENE.END.in + 18} out={DURATION} style={{left: 58, top: 840, color: C.red, ...gro(20, 700)}}>
        @guanmo_ai
      </Show>
    </>
  );
};

export const Verb: React.FC<{f: number}> = ({f}) => {
  const items: [number, number, string][] = [
    [BEATS.pull - 4, BEATS.land + 8, '抽'],
    [BEATS.lift - 4, BEATS.fan - 6, '提'],
    [BEATS.press - 4, SCENE.FOLIO.in, '压'],
  ];
  return (
    <>
      {items.map(([at, out, t]) => (
        <Show key={t} f={f} at={at} out={out} style={{right: 56, top: 36, color: C.red}}>
          <div style={{...gro(72, 700, -0.06)}}>{t}</div>
        </Show>
      ))}
    </>
  );
};

/** 压的前后对比：为什么这样更好 */
export const Contrast: React.FC<{f: number}> = ({f}) => {
  if (f < 648 || f >= 738) return null;
  return (
    <Show f={f} at={656} out={732} style={{left: 48, top: 980, color: inkOn(f)}}>
      <Swap f={f} at={666} h={28} a={<span style={{...sc(16, 500)}}>比较完了，还没决定</span>} b={<span style={{...sc(16, 700)}}>压下去 = 封面定了</span>} />
    </Show>
  );
};
