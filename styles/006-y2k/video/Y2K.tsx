/**
 * Design Style · 风格 006 · 千禧未来主义 Y2K Futurism —— 18 秒短片（1920×1080 · 60fps · 120 BPM）
 * 见 README 分镜；时间轴见 timeline.ts 与 ../process/timeline.json
 * 铬、果冻、泡泡、玻璃：material.js（WebGL2 着色器，逐帧实时算反射 / 折射）；其余是 SVG
 */
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {Grain} from '../../../src/lib/Grain';
import {C} from '../tokens';
import {AT, DURATION, TR} from './timeline';
import {Background, Defs, Hud, Svg, Wipe, WipeEdge, wipeClip} from './ui';
import {ChromeCh, Opening} from './opening';
import {Aqua, Bug, Emoji, Jelly} from './chapters';
import {End, Rules, Today} from './finale';

export const Y2K_DURATION = DURATION;

let fontsP: Promise<unknown> | null = null;
const loadFonts = () => {
  if (fontsP) return fontsP;
  const L = (family: string, file: string, weight: string, format: 'truetype' | 'opentype' = 'truetype') => loadFont({family, url: staticFile(`fonts/${file}`), weight, format});
  fontsP = Promise.all([
    L('Unbounded', 'Unbounded.ttf', '200 900'),
    L('Michroma', 'Michroma-Regular.ttf', '400'),
    L('Silkscreen', 'Silkscreen-Regular.ttf', '400'),
    L('Inter', 'Inter-Medium.ttf', '500'),
    L('Inter', 'Inter-SemiBold.ttf', '600'),
    L('Noto Sans SC', 'NotoSansSC-Regular.otf', '400', 'opentype'),
    L('Noto Sans SC', 'NotoSansSC-Medium.otf', '500', 'opentype'),
    L('Noto Sans SC', 'NotoSansSC-Bold.otf', '700', 'opentype'),
    L('Noto Sans SC', 'NotoSansSC-Black.otf', '900', 'opentype'),
  ]);
  return fontsP;
};

type Scene = {at: number; end: number; C: React.FC<{f: number}>; wipe?: Wipe};
const SCENES: Scene[] = [
  {at: AT.open, end: AT.chrome, C: Opening},
  {at: AT.chrome, end: AT.jelly, C: ChromeCh, wipe: {kind: 'bubble', x: 1596, y: 300}},
  {at: AT.jelly, end: AT.aqua, C: Jelly, wipe: {kind: 'horizon'}},
  {at: AT.aqua, end: AT.emoji, C: Aqua, wipe: {kind: 'gel', x: 1665, y: 560}},
  {at: AT.emoji, end: AT.bug, C: Emoji, wipe: {kind: 'pixel'}},
  {at: AT.bug, end: AT.today, C: Bug, wipe: {kind: 'glitch'}},
  {at: AT.today, end: AT.rules, C: Today, wipe: {kind: 'glass'}},
  {at: AT.rules, end: AT.end, C: Rules, wipe: {kind: 'bubble', x: 960, y: 560}},
  {at: AT.end, end: DURATION, C: End, wipe: {kind: 'pixel'}},
];
const ease = (p: number) => (p < 1 ? 1 - (1 - p) ** 2.2 : 1); // 先快后慢地盖满

const Stage: React.FC = () => {
  const f = useCurrentFrame();
  const live = SCENES.filter((s) => f >= s.at - (s.wipe ? TR : 0) && f < s.end);
  return (
    <AbsoluteFill style={{background: C.paperTop, overflow: 'hidden'}}>
      <Svg>
        <Defs f={f} />
      </Svg>
      {live.map((s) => {
        const p = s.wipe && f < s.at ? (f - (s.at - TR)) / TR : 1;
        const clip = s.wipe ? wipeClip(s.wipe, ease(p), `w${s.at}`) : undefined;
        const jit = s.wipe?.kind === 'glitch' && p < 1 ? Math.round(Math.sin(f * 7.3) * 18 * (1 - p)) : 0;
        return (
          <AbsoluteFill key={s.at} style={{clipPath: clip, transform: jit ? `translate(${jit}px,0)` : undefined}}>
            <Svg>
              <Background />
            </Svg>
            <s.C f={f} />
          </AbsoluteFill>
        );
      })}
      <Svg>
        {live.map((s) => s.wipe && f < s.at && <WipeEdge key={s.at} w={s.wipe} p={ease((f - (s.at - TR)) / TR)} />)}
        <Hud f={f} />
      </Svg>
    </AbsoluteFill>
  );
};

export const Y2K: React.FC<{music?: boolean}> = ({music = true}) => {
  const [handle] = useState(() => delayRender('006：等字体'));
  const [ok, setOk] = useState(false);
  useEffect(() => {
    loadFonts()
      .then(() => setOk(true))
      .catch((e) => console.error(e))
      .finally(() => continueRender(handle));
  }, [handle]);
  return (
    <AbsoluteFill style={{background: C.paperTop}}>
      {ok && <Stage />}
      <Grain opacity={0.03} />
      {music && <Audio src={staticFile('006-y2k/music.wav')} />}
    </AbsoluteFill>
  );
};
