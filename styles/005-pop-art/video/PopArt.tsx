/**
 * Design Style · 风格 005 · 波普艺术 Pop Art —— 18 秒短片（1920×1080 · 60fps · 100 BPM）
 * 见 README 分镜；时间轴见 timeline.ts 与 ../process/timeline.json
 */
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {Grain} from '../../../src/lib/Grain';
import {C} from '../tokens';
import {AT, DURATION, LENGTH, STRETCH} from './timeline';
import {Patterns} from './ui';
import {Collage, Opening} from './opening';
import {Screen, Soup, Zoom} from './chapters';
import {Burger, End, Hud, Rules, Today} from './finale';

export const POPART_DURATION = LENGTH;

let fontsLoaded = false;
const loadFonts = () => {
  if (fontsLoaded) return;
  fontsLoaded = true;
  loadFont({family: 'Bangers', url: staticFile('fonts/Bangers-Regular.ttf'), weight: '400', format: 'truetype'});
  loadFont({family: 'JetBrains Mono', url: staticFile('fonts/JetBrainsMono.ttf'), weight: '100 800', format: 'truetype'});
  const F = (file: string, weight: string) => loadFont({family: 'Noto Sans SC', url: staticFile(`fonts/${file}`), weight, format: 'opentype'});
  F('NotoSansSC-Medium.otf', '500');
  F('NotoSansSC-Bold.otf', '700');
  F('NotoSansSC-Black.otf', '900');
};

const Stage: React.FC = () => {
  // 所有场景按“剧本帧”写；成片帧 ÷ STRETCH = 剧本帧（小数帧也能算，动作因此平滑地慢下来）
  const f = useCurrentFrame() / STRETCH;
  const live = (a: number, b: number) => f >= a && f < b;
  return (
    <AbsoluteFill style={{background: C.paper, overflow: 'hidden'}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        <Patterns f={f} />
        {live(0, AT.collage) && <Opening f={f} />}
        {live(AT.collage, AT.soup) && <Collage f={f} />}
        {live(AT.soup, AT.dots) && <Soup f={f} />}
        {live(AT.dots, AT.screen) && <Zoom f={f} />}
        {live(AT.screen, AT.burger) && <Screen f={f} />}
        {live(AT.burger, AT.today) && <Burger f={f} />}
        {live(AT.today, AT.rules) && <Today f={f} />}
        {live(AT.rules, AT.end) && <Rules f={f} />}
        {live(AT.end, DURATION) && <End f={f} />}
        <Hud f={f} />
      </svg>
    </AbsoluteFill>
  );
};

export const PopArt: React.FC<{music?: boolean; blur?: number}> = ({music = true, blur = 5}) => {
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
      <Grain opacity={0.04} />
      {music && <Audio src={staticFile('005-pop-art/music.wav')} />}
    </AbsoluteFill>
  );
};
