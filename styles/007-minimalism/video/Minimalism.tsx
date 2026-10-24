/**
 * Design Style · 风格 007 · 极简主义 Minimalism —— 22 秒短片（1920×1080 · 60fps · 120 BPM · 1320 帧）
 *
 * 不讲收音机史。只看极简在真实产品里长什么样、怎么丝滑动。
 *   0.0–2.0s   开场    噪音删到一个点；MINIMALISM / 极简主义
 *   2.0–10.0s  App     线长成手机；删掉多余闹钟；按压缩放 → 推页 → sheet → 拨橙点开关
 *  10.0–15.5s  Web     极简手册站：大标题、细线栏；hover / 滚动 / 锚点
 *  15.5–19.0s  确认    一张纸：一个金额、一个按钮；做完了就空着
 *  19.0–22.0s  片尾    回到那个点；少即是多。@guanmo_ai
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
  const o = tween(f, AT.app, 16) * (1 - tween(f, AT.end, 12));
  if (o <= 0.001) return null;
  let k = 0;
  CHAPTERS.forEach(([, , at], j) => {
    if (f >= at) k = j;
  });
  const p = tween(f, CHAPTERS[k][2], 16, 0, 1, E.out);
  const prog = (f - AT.app) / (AT.end - AT.app);
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
        {on(0, 124) && <Opening f={f} />}
        {on(104, 612) && <App f={f} />}
        {on(592, 942) && <Web f={f} />}
        {on(922, 1152) && <Pay f={f} />}
        {on(1140, DURATION) && <Finale f={f} />}
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
