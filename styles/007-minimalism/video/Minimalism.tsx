/**
 * Design Style · 风格 007 · 极简主义 Minimalism —— 24 秒短片（1920×1080 · 60fps · 120 BPM · 1440 帧）
 *
 *   全片只讲一件事：少 = 删到只剩有用的
 *   0.0–2.2   堆满
 *   2.2–8.0   一次删一个（每删一句为什么）
 *   8.0–11.0  留下骨架
 *  11.0–17.6  同一原则进 App / Web / 确认
 *  17.6–19.6  坏例对照
 *  19.6–21.4  定妆
 *  21.4–24.0  片尾 @guanmo_ai
 */
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {E, tween} from '../../../src/lib/anim';
import {Grain} from '../../../src/lib/Grain';
import {C} from '../tokens';
import {BEATS} from './script';
import {AT, DURATION} from './timeline';
import {font} from './ui';
import {Opening} from './opening';
import {Bone} from './bone';
import {App} from './app';
import {Web} from './web';
import {Pay} from './pay';
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

const Hud: React.FC<{f: number}> = ({f}) => {
  const o = tween(f, 18, 12) * (1 - tween(f, AT.end, 12));
  if (o <= 0.001) return null;
  let k = 0;
  BEATS.forEach((b, j) => {
    if (f >= b.at && b.id !== 'end') k = j;
  });
  const beat = BEATS[k];
  const p = tween(f, beat.at, 14, 0, 1, E.out);
  const prog = f / AT.end;
  return (
    <div style={{position: 'absolute', left: 120, right: 120, top: 1000, height: 40, opacity: o}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 1, background: C.hair}} />
      <div style={{position: 'absolute', left: 0, top: 0, height: 1, width: `${Math.min(1, Math.max(0, prog)) * 100}%`, background: C.ink, opacity: 0.55}} />
      <div style={{position: 'absolute', left: 0, top: 16, display: 'flex', alignItems: 'baseline'}}>
        <span style={{...font('mono', 14, 0.14), color: C.greyDk}}>{`0${Math.min(k + 1, 8)} / 08`}</span>
        <span style={{...font('sc400', 16, 0.06), color: C.ink, marginLeft: 14}}>{beat.line}</span>
      </div>
      <div style={{position: 'absolute', right: 0, top: 16, display: 'flex', alignItems: 'baseline', opacity: 0.25 + 0.75 * p, transform: `translateY(${(1 - p) * 8}px)`}}>
        <span style={{...font('t300', 15, 0.02), color: C.grey}}>{beat.en}</span>
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
        {on(0, AT.bone + 8) && <Opening f={f} />}
        {on(AT.bone - 12, AT.app) && <Bone f={f} />}
        {on(AT.app - 12, AT.web) && <App f={f} />}
        {on(AT.web - 12, AT.pay) && <Web f={f} />}
        {on(AT.pay - 12, AT.vs) && <Pay f={f} />}
        {on(AT.vs - 8, AT.poster) && <Versus f={f} />}
        {on(AT.poster - 8, DURATION) && <Finale f={f} />}
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
