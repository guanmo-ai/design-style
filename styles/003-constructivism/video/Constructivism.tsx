/**
 * Design Style · 风格 003 · 构成主义 Constructivism —— 15 秒短片（1920×1080 · 60fps · 144 BPM）
 * 见 README §9 分镜；时间轴见 timeline.ts 与 ../process/timeline.json
 */
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {Grain} from '../../../src/lib/Grain';
import {C} from '../tokens';
import {AT, DURATION} from './timeline';
import {Opening} from './opening';
import {Montage, Tower, Type} from './chapters';
import {Book, Stage as StageSet, Textile} from './workshop';
import {End, Hud, Words} from './finale';

export const CONSTRUCTIVISM_DURATION = DURATION;

let fontsLoaded = false;
const loadFonts = () => {
  if (fontsLoaded) return;
  fontsLoaded = true;
  loadFont({family: 'Oswald', url: staticFile('fonts/Oswald.ttf'), weight: '200 700', format: 'truetype'});
  const F = (file: string, weight: string) => loadFont({family: 'Noto Sans SC', url: staticFile(`fonts/${file}`), weight, format: 'opentype'});
  F('NotoSansSC-Medium.otf', '500');
  F('NotoSansSC-Bold.otf', '700');
  F('NotoSansSC-Black.otf', '900');
};

const Stage: React.FC = () => {
  const f = useCurrentFrame();
  const live = (a: number, b: number) => f >= a && f < b;
  return (
    <AbsoluteFill style={{background: C.paper, overflow: 'hidden'}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        {live(0, AT.type + 12) && <Opening f={f} />}
        {live(AT.type, AT.montage) && <Type f={f} />}
        {live(AT.montage, AT.tower) && <Montage f={f} />}
        {live(AT.tower, AT.textile) && <Tower f={f} />}
        {live(AT.textile, AT.stage) && <Textile f={f} />}
        {live(AT.stage, AT.book) && <StageSet f={f} />}
        {live(AT.book, AT.words) && <Book f={f} />}
        {live(AT.words, AT.end) && <Words f={f} />}
        {live(AT.end, DURATION) && <End f={f} />}
        <Hud f={f} />
      </svg>
    </AbsoluteFill>
  );
};

export const Constructivism: React.FC<{music?: boolean; blur?: number}> = ({music = true, blur = 5}) => {
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
      <Grain opacity={0.06} />
      {music && <Audio src={staticFile('003-constructivism/music.wav')} />}
    </AbsoluteFill>
  );
};
