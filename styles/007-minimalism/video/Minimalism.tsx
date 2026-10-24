/**
 * Design Style · 风格 007 · 极简主义 —— 六改 24s
 *
 *   少 = 删到只剩有用的
 *   视觉 / 设计 / 动效 三个一起。不是五改换皮。
 *
 *   0.0–3.0   开场炸：≥16 元素 spring 落拍
 *   3.0–5.0   裂成五种落地
 *   5.0–12.2  App / Web / Pay / 数据 交棒（各 ≤1.8s）
 *  12.2–14.2  坏例炸开再吸回
 *  14.2–16.8  骨架：栏线 / 字重 / 留白
 *  16.8–19.8  定妆
 *  19.8–24.0  片尾 @guanmo_ai
 */
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {E, tween} from '../../../src/lib/anim';
import {Grain} from '../../../src/lib/Grain';
import {C} from '../tokens';
import {CELLS} from './script';
import {AT, DURATION} from './timeline';
import {Cam2, World, camTrack, font} from './ui';
import {Blast} from './opening';
import {Panes} from './panes';
import {Bone} from './bone';
import {Versus} from './vs';
import {Finale} from './finale';

export const MINIMALISM_DURATION = DURATION;

let fontsLoaded = false;
const loadFonts = () => {
  if (fontsLoaded) return;
  fontsLoaded = true;
  const F = (family: string, file: string, weight: string, style = 'normal') =>
    loadFont({family, url: staticFile(`fonts/${file}`), weight, style, format: file.endsWith('.otf') ? 'opentype' : 'truetype'});
  F('Inter Display', 'InterDisplay-Thin.ttf', '100');
  F('Inter Display', 'InterDisplay-ExtraLight.ttf', '200');
  F('Inter Display', 'InterDisplay-Light.ttf', '300');
  F('Inter', 'Inter-Light.ttf', '300');
  F('Inter', 'Inter-Regular.ttf', '400');
  F('Inter', 'Inter-Medium.ttf', '500');
  F('Geist Mono', 'GeistMono-Regular.ttf', '400');
  F('Noto Sans SC', 'NotoSansSC-Light.otf', '300');
  F('Noto Sans SC', 'NotoSansSC-Regular.otf', '400');
  F('Noto Sans SC', 'NotoSansSC-Medium.otf', '500');
  F('Noto Sans SC', 'NotoSansSC-Black.otf', '900');
  F('Bangers', 'Bangers-Regular.ttf', '400');
  F('Oswald', 'Oswald.ttf', '200 700');
  F('Fredoka', 'Fredoka.ttf', '300 700');
  F('Unbounded', 'Unbounded.ttf', '200 900');
  F('TeX Gyre Heros', 'TeXGyreHeros-Bold.otf', '700');
  F('Jost', 'Jost.ttf', '100 900');
  F('Instrument Serif', 'InstrumentSerif-Italic.ttf', '400', 'italic');
  F('Silkscreen', 'Silkscreen-Regular.ttf', '400');
};

const camAt = (f: number): Cam2 =>
  camTrack(f, [
    [0, {ox: 960, oy: 540, s: 1.1}],
    [20, {ox: 960, oy: 540, s: 1}],
    [108, {ox: 960, oy: 480, s: 1.18}],
    [168, {ox: 960, oy: 540, s: 1}],
    [AT.split + 10, {ox: 960, oy: 540, s: 1}],
    [AT.app - 6, {ox: 960, oy: 540, s: 1}],
    [AT.app, {ox: 350, oy: 450, s: 1.62}],
    [AT.web - 6, {ox: 350, oy: 450, s: 1.62}],
    [AT.web, {ox: 1020, oy: 300, s: 1.5}],
    [AT.pay - 6, {ox: 1020, oy: 300, s: 1.5}],
    [AT.pay, {ox: 1630, oy: 280, s: 1.88}],
    [AT.data - 6, {ox: 1630, oy: 280, s: 1.88}],
    [AT.data, {ox: 1020, oy: 680, s: 1.55}],
    [690, {ox: 1020, oy: 680, s: 1.55}],
    [696, {ox: 1630, oy: 680, s: 1.8}],
    [AT.vs - 8, {ox: 1630, oy: 680, s: 1.8}],
    [AT.vs, {ox: 960, oy: 540, s: 1}],
    [AT.bone, {ox: 960, oy: 520, s: 1.06}],
    [AT.hold, {ox: 960, oy: 540, s: 1}],
  ]);

const Hud: React.FC<{f: number}> = ({f}) => {
  const o = tween(f, 10, 8) * (1 - tween(f, AT.end, 10));
  if (o <= 0.001) return null;
  let k = 0;
  CELLS.forEach((b, j) => {
    if (f >= b.at && b.id !== 'end') k = j;
  });
  const beat = f >= 696 && f < AT.vs ? {...CELLS.find((b) => b.id === 'hold')!, zh: '海报', en: 'One poster.', n: 8, at: 696} : CELLS[k];
  const p = tween(f, beat.at, 10, 0, 1, E.out);
  return (
    <div style={{position: 'absolute', left: 120, right: 120, top: 1010, height: 36, opacity: o, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 1, background: C.hair}} />
      <div style={{position: 'absolute', left: 0, top: 0, height: 1, width: `${Math.min(1, f / AT.end) * 100}%`, background: C.ink, opacity: 0.5}} />
      <div style={{position: 'absolute', left: 0, top: 12, display: 'flex', alignItems: 'baseline'}}>
        <span style={{...font('mono', 13, 0.14), color: C.greyDk}}>{`${String(Math.min(k + 1, 9)).padStart(2, '0')} / 09`}</span>
        <span style={{...font('sc400', 15, 0.04), color: C.ink, marginLeft: 12}}>{beat.zh}</span>
        <span style={{...font('mono', 12, 0.08), color: C.grey, marginLeft: 12}}>{`${beat.n}  EL`}</span>
      </div>
      <div style={{position: 'absolute', right: 0, top: 12, opacity: 0.3 + 0.7 * p, transform: `translateY(${(1 - p) * 6}px)`}}>
        <span style={{...font('t300', 14), color: C.grey}}>{beat.en}</span>
      </div>
    </div>
  );
};

const Stage: React.FC<{hud?: boolean}> = ({hud = true}) => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 80% at 50% 46%, ${C.paperHi} 0%, ${C.paper} 62%, #E8E4DD 100%)`, overflow: 'hidden'}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        <World c={cam}>
          {f < AT.split + 28 && <Blast f={f} />}
          {f >= AT.split - 10 && f < AT.vs && <Panes f={f} />}
          {f >= AT.vs - 6 && f < AT.bone && <Versus f={f} />}
          {f >= AT.bone - 8 && f < AT.hold && <Bone f={f} />}
        </World>
        {f >= AT.hold - 4 && <Finale f={f} />}
      </svg>
      {hud !== false && <Hud f={f} />}
    </AbsoluteFill>
  );
};

export const Minimalism: React.FC<{music?: boolean; blur?: number; hud?: boolean}> = ({music = true, blur = 6, hud = true}) => {
  loadFonts();
  return (
    <AbsoluteFill style={{background: C.paper}}>
      {blur > 1 ? (
        <CameraMotionBlur shutterAngle={180} samples={blur}>
          <Stage hud={hud} />
        </CameraMotionBlur>
      ) : (
        <Stage hud={hud} />
      )}
      <Grain opacity={0.035} />
      {music && <Audio src={staticFile('007-minimalism/music.wav')} />}
    </AbsoluteFill>
  );
};
