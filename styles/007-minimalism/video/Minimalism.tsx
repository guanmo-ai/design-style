/**
 * Design Style · 风格 007 · 极简主义 Minimalism —— 24 秒短片（1920×1080 · 60fps · 120 BPM · 1440 帧）
 *
 *   0.0–1.8s   开场钩子
 *   1.8–6.0s   非极简讲解：字重 / 测量 / 留白闪 / 删走 / 网格 / 前后对比
 *   6.0–10.4s  极简产品 App
 *  10.4–15.0s  极简产品 Web
 *  15.0–18.4s  极简产品 确认
 *  18.4–21.0s  非极简讲解：三容器对照
 *  21.0–24.0s  片尾 @guanmo_ai
 */
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {E, tween} from '../../../src/lib/anim';
import {Grain} from '../../../src/lib/Grain';
import {C} from '../tokens';
import {AT, CHAPTERS, DURATION} from './timeline';
import {font} from './ui';
import {Opening} from './opening';
import {Recap, Teach} from './teach';
import {App} from './app';
import {Web} from './web';
import {Pay} from './pay';
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

const Hud: React.FC<{f: number}> = ({f}) => {
  const o = tween(f, AT.teach, 12) * (1 - tween(f, AT.end, 12));
  if (o <= 0.001) return null;
  let k = 0;
  CHAPTERS.forEach(([, , at], j) => {
    if (f >= at) k = j;
  });
  const p = tween(f, CHAPTERS[k][2], 16, 0, 1, E.out);
  const prog = (f - AT.teach) / (AT.end - AT.teach);
  return (
    <div style={{position: 'absolute', left: 120, right: 120, top: 990, height: 40, opacity: o}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 1, background: C.hair}} />
      <div style={{position: 'absolute', left: 0, top: 0, height: 1, width: `${Math.min(1, Math.max(0, prog)) * 100}%`, background: C.ink, opacity: 0.6}} />
      <div style={{position: 'absolute', left: 0, top: 18, display: 'flex', alignItems: 'baseline'}}>
        <span style={{...font('t400', 17, 0.02), color: C.ink}}>Minimalism</span>
        <span style={{...font('sc300', 16, 0.12), color: C.grey, marginLeft: 12}}>极简主义</span>
      </div>
      <div style={{position: 'absolute', right: 0, top: 18, display: 'flex', alignItems: 'baseline', opacity: 0.2 + 0.8 * p, transform: `translateY(${(1 - p) * 10}px)`}}>
        <span style={{...font('mono', 15, 0.12), color: C.greyDk, marginRight: 16}}>{`0${k + 1} / 0${CHAPTERS.length}`}</span>
        <span style={{...font('sc400', 17, 0.08), color: C.ink, marginRight: 12}}>{CHAPTERS[k][0]}</span>
        <span style={{...font('t300', 15, 0.02), color: C.grey}}>{CHAPTERS[k][1]}</span>
      </div>
    </div>
  );
};

const Stage: React.FC = () => {
  const f = useCurrentFrame();
  const on = (a: number, b: number) => f >= a && f < b;
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 80% at 50% 46%, ${C.paperHi} 0%, ${C.paper} 62%, #E8E4DD 100%)`, overflow: 'hidden'}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        {on(0, 120) && <Opening f={f} />}
        {on(104, 368) && <Teach f={f} />}
        {on(348, 640) && <App f={f} />}
        {on(608, 916) && <Web f={f} />}
        {on(884, 1120) && <Pay f={f} />}
        {on(1096, 1268) && <Recap f={f} />}
        {on(1260, DURATION) && <Finale f={f} />}
      </svg>
      <Hud f={f} />
    </AbsoluteFill>
  );
};

export const Minimalism: React.FC<{music?: boolean; blur?: number}> = ({music = true, blur = 6}) => {
  loadFonts();
  return (
    <AbsoluteFill style={{background: C.paper}}>
      {blur > 1 ? (
        <CameraMotionBlur shutterAngle={180} samples={blur}>
          <Stage />
        </CameraMotionBlur>
      ) : (
        <Stage />
      )}
      <Grain opacity={0.035} />
      {music && <Audio src={staticFile('007-minimalism/music.wav')} />}
    </AbsoluteFill>
  );
};
