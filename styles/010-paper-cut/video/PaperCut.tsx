/**
 * Design Style · 风格 010 · Paper Cut —— 24 秒剪纸博览（1920×1080 · 60fps · 120 BPM）
 * 六种剪纸：民俗镂空 → 几何层叠 → 立体纸板 → 单色剪影 → 水彩毛边 → 字体剪纸 → 带走三句
 * 交棒只用纸的招式：展开 / 撕开 / 揭层 / 刀切 / 毛边 / 折页。分镜见 timeline.ts
 */
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {Grain} from '../../../src/lib/Grain';
import {C, HILLS} from '../tokens';
import {AT, DURATION, TR} from './timeline';
import {H, LayerFilters, W} from './layers';
import {Hud, WipeKind, wipeD} from './ui';
import {Folk} from './opening';
import {Dio, Geo, Sil, Torn, Type} from './chapters';
import {Take} from './finale';

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

type Scene = {at: number; end: number; C: React.FC<{f: number}>; wipe?: WipeKind; fill?: string};
const SCENES: Scene[] = [
  {at: AT.folk, end: AT.geo, C: Folk},
  {at: AT.geo, end: AT.dio, C: Geo, wipe: 'tear', fill: C.folk},
  {at: AT.dio, end: AT.sil, C: Dio, wipe: 'wave', fill: C.cream},
  {at: AT.sil, end: AT.torn, C: Sil, wipe: 'blade', fill: C.paper},
  {at: AT.torn, end: AT.type, C: Torn, wipe: 'tear', fill: '#F0E2D2'},
  {at: AT.type, end: AT.take, C: Type, wipe: 'wave', fill: C.paper},
  {at: AT.take, end: DURATION, C: Take, wipe: 'fold', fill: C.wall},
];

const ease = (p: number) => (p < 1 ? 1 - (1 - p) ** 2.4 : 1);

const Stage: React.FC = () => {
  const f = useCurrentFrame();
  const live = SCENES.filter((s) => f >= s.at - (s.wipe ? TR : 0) && f < s.end);
  return (
    <AbsoluteFill style={{background: C.wall, overflow: 'hidden'}}>
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
          const wiping = Boolean(s.wipe) && p < 1;
          return (
            <g key={s.at}>
              {wiping && s.wipe && (
                <clipPath id={`wipe${s.at}`}>
                  <path d={wipeD(s.wipe, p, s.at)} />
                </clipPath>
              )}
              <g clipPath={wiping ? `url(#wipe${s.at})` : undefined}>
                <s.C f={f} />
              </g>
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
    <AbsoluteFill style={{background: C.wall}}>
      {ok && <Stage />}
      <Grain opacity={0.04} />
      {music && <Audio src={staticFile('010-paper-cut/music.wav')} />}
    </AbsoluteFill>
  );
};
