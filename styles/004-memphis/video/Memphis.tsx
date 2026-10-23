/**
 * Design Style · 风格 004 · 孟菲斯 Memphis —— 15 秒短片（1920×1080 · 60fps · 120 BPM）
 * 见 README 分镜；时间轴见 timeline.ts 与 ../process/timeline.json
 */
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {Grain} from '../../../src/lib/Grain';
import {C} from '../tokens';
import {AT, DURATION} from './timeline';
import {Patterns} from './ui';
import {Opening, Record} from './opening';
import {Carlton, First, Tahiti} from './chapters';
import {End, Hud, Pattern, Rules, Today} from './finale';

export const MEMPHIS_DURATION = DURATION;

let fontsLoaded = false;
const loadFonts = () => {
  if (fontsLoaded) return;
  fontsLoaded = true;
  loadFont({family: 'Fredoka', url: staticFile('fonts/Fredoka.ttf'), weight: '300 700', format: 'truetype'});
  loadFont({family: 'JetBrains Mono', url: staticFile('fonts/JetBrainsMono.ttf'), weight: '100 800', format: 'truetype'});
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
        <Patterns f={f} />
        {live(0, AT.record) && <Opening f={f} />}
        {live(AT.record, AT.carlton) && <Record f={f} />}
        {live(AT.carlton, AT.tahiti) && <Carlton f={f} />}
        {live(AT.tahiti, AT.first) && <Tahiti f={f} />}
        {live(AT.first, AT.pattern) && <First f={f} />}
        {live(AT.pattern, AT.today) && <Pattern f={f} />}
        {live(AT.today, AT.rules) && <Today f={f} />}
        {live(AT.rules, AT.end) && <Rules f={f} />}
        {live(AT.end, DURATION) && <End f={f} />}
        <Hud f={f} />
      </svg>
    </AbsoluteFill>
  );
};

export const Memphis: React.FC<{music?: boolean; blur?: number}> = ({music = true, blur = 5}) => {
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
      {music && <Audio src={staticFile('004-memphis/music.wav')} />}
    </AbsoluteFill>
  );
};
