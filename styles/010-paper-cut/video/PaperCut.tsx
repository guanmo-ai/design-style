/**
 * Design Style · 风格 010 · Paper Cut 剪纸层叠 —— 20 秒短片（1920×1080 · 60fps · 120 BPM）
 * 同一座层叠风景贯穿全片：开场叠层 → 编辑海报 → App 插画 → 品牌片头 → 五条规则 → 常见坑 → @guanmo_ai
 * 层移即故事。时间轴见 timeline.ts 与 ../process/timeline.json
 */
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {Grain} from '../../../src/lib/Grain';
import {C, HILLS} from '../tokens';
import {AT, DURATION, TR} from './timeline';
import {H, LayerFilters, W} from './layers';
import {Hud, PaperWipe, waveD} from './ui';
import {Opening} from './opening';
import {App, Brand, Edit} from './chapters';
import {End, Pits, Rules} from './finale';

export const PAPERCUT_DURATION = DURATION;

let fontsP: Promise<unknown> | null = null;
const loadFonts = () => {
  if (fontsP) return fontsP;
  const L = (family: string, file: string, weight: string, format: 'truetype' | 'opentype' = 'truetype') =>
    loadFont({family, url: staticFile(`fonts/${file}`), weight, format});
  fontsP = Promise.all([
    L('Jost', 'Jost.ttf', '100 900'),
    L('JetBrains Mono', 'JetBrainsMono.ttf', '100 800'),
    L('Noto Sans SC', 'NotoSansSC-Regular.otf', '400', 'opentype'),
    L('Noto Sans SC', 'NotoSansSC-Medium.otf', '500', 'opentype'),
    L('Noto Sans SC', 'NotoSansSC-Bold.otf', '700', 'opentype'),
    L('Noto Sans SC', 'NotoSansSC-Black.otf', '900', 'opentype'),
  ]);
  return fontsP;
};

type Scene = {at: number; end: number; C: React.FC<{f: number}>; wipe?: boolean};
const SCENES: Scene[] = [
  {at: AT.open, end: AT.edit, C: Opening},
  {at: AT.edit, end: AT.app, C: Edit, wipe: true},
  {at: AT.app, end: AT.brand, C: App, wipe: true},
  {at: AT.brand, end: AT.rules, C: Brand, wipe: true},
  {at: AT.rules, end: AT.pits, C: Rules, wipe: true},
  {at: AT.pits, end: AT.end, C: Pits, wipe: true},
  {at: AT.end, end: DURATION, C: End, wipe: true},
];

const ease = (p: number) => (p < 1 ? 1 - (1 - p) ** 2.4 : 1);

const Stage: React.FC = () => {
  const f = useCurrentFrame();
  const live = SCENES.filter((s) => f >= s.at - (s.wipe ? TR : 0) && f < s.end);
  return (
    <AbsoluteFill style={{background: C.sky, overflow: 'hidden'}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
        <LayerFilters />
        <defs>
          {HILLS.map((c, i) => (
            <linearGradient key={i} id={`grade${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={i < 3 ? '#7EC8E8' : '#C8E86A'} />
              <stop offset="1" stopColor={c} />
            </linearGradient>
          ))}
          <clipPath id="artboard">
            <rect x={80} y={168} width={1320} height={800} rx={14} />
          </clipPath>
          <clipPath id="phoneScreen">
            <rect x={706} y={94} width={508} height={892} rx={36} />
          </clipPath>
          <linearGradient id="phoneScrim" x1="0" y1="448" x2="0" y2="720" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#0A141C" stopOpacity="0" />
            <stop offset="0.22" stopColor="#0A141C" stopOpacity="0.72" />
            <stop offset="0.5" stopColor="#0A141C" stopOpacity="1" />
          </linearGradient>
        </defs>
        {live.map((s) => {
          const raw = s.wipe && f < s.at ? (f - (s.at - TR)) / TR : 1;
          const p = ease(raw);
          const wiping = s.wipe && p < 1;
          return (
            <g key={s.at}>
              {wiping && (
                <clipPath id={`wipe${s.at}`}>
                  <path d={waveD(p, s.at)} />
                </clipPath>
              )}
              <g clipPath={wiping ? `url(#wipe${s.at})` : undefined}>
                <s.C f={f} />
              </g>
              {s.wipe && f < s.at && <PaperWipe p={p} />}
            </g>
          );
        })}
      </svg>
      <Hud f={f} />
    </AbsoluteFill>
  );
};

export const PaperCut: React.FC<{music?: boolean}> = ({music = true}) => {
  const [handle] = useState(() => delayRender('010：等字体'));
  const [ok, setOk] = useState(false);
  useEffect(() => {
    loadFonts()
      .then(() => setOk(true))
      .catch((e) => console.error(e))
      .finally(() => continueRender(handle));
  }, [handle]);
  return (
    <AbsoluteFill style={{background: C.sky}}>
      {ok && <Stage />}
      <Grain opacity={0.035} />
      {music && <Audio src={staticFile('010-paper-cut/music.wav')} />}
    </AbsoluteFill>
  );
};
