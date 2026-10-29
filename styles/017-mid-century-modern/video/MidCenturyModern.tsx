/**
 * 017 · 中世纪现代 Mid-Century Modern —— 短片（1920×1080 · 60fps · 120 BPM）
 *
 * 一条物理规则：每一块都是一张纸。纸离桌面 h px，影子往右下偏 (0.5h, h)、模糊 0.4h，纸放大 1 + 0.0032h；
 * 东西被提起来，影子就离开它；落下时影子和它合上，轻压一下。所有动作 60 帧连续（不抽帧），快的地方加运动模糊。
 * 分镜见 STORYBOARD.md，时间轴见 timeline.ts。
 *
 * 参数（草稿预览与正片共用一套代码）：
 *   step  一帧走几帧剧本时间（正片 1；草稿预览 30fps 合成里 = 2）
 *   blur  运动模糊最多几个子帧（正片 6；草稿 1 = 不做）：最快的东西每帧走 v px，取 2 + v/12 个子帧，快门半帧
 *   res   内部分辨率（正片 1；草稿 0.5）
 */
import React from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {motionBlurTimes} from '../../../src/lib/motion/sampling';
import {C} from '../tokens';
import {Hud} from './hud';
import {Opening, Subtitle} from './opening';
import {PaperDefs} from './paper';
import {sceneIndex, speedAt} from './scenes';
import {DURATION, H, W} from './timeline';

export const MIDCENTURYMODERN_DURATION = DURATION;
export type FilmProps = {music?: boolean; step?: number; blur?: number; res?: number};

let fontsP: Promise<unknown> | null = null;
const loadFonts = () => {
  if (fontsP) return fontsP;
  const L = (family: string, file: string, weight: string) =>
    loadFont({family, url: staticFile(`fonts/${file}`), weight, format: file.endsWith('.otf') ? 'opentype' : 'truetype'});
  fontsP = Promise.all([
    L('Jost', 'Jost.ttf', '100 900'),
    L('Noto Sans SC', 'NotoSansSC-Medium.otf', '500'),
    L('Noto Sans SC', 'NotoSansSC-Bold.otf', '700'),
    L('Noto Sans SC', 'NotoSansSC-Black.otf', '900'),
  ]);
  return fontsP;
};

/** 不动的纸纹：颗粒固定在画面上（不逐帧跳，丝滑） */
const PaperGrain: React.FC<{opacity: number}> = ({opacity}) => {
  const url = React.useMemo(() => {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d')!;
    const img = ctx.createImageData(size, size);
    let s = 17;
    for (let i = 0; i < size * size; i++) {
      s = (s * 16807) % 2147483647;
      const v = 150 + Math.floor((s / 2147483647) * 105);
      img.data[i * 4] = v;
      img.data[i * 4 + 1] = v;
      img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL('image/png');
  }, []);
  return <AbsoluteFill style={{backgroundImage: `url(${url})`, mixBlendMode: 'multiply', opacity, pointerEvents: 'none'}} />;
};

export const MidCenturyModern: React.FC<FilmProps> = ({music = true, step = 1, blur = 6, res = 1}) => {
  const f = useCurrentFrame() * step;
  const [handle] = React.useState(() => delayRender('mcm-fonts'));
  React.useEffect(() => {
    loadFonts().then(() => continueRender(handle));
  }, [handle]);
  const layers = motionBlurTimes(f, blur, speedAt, sceneIndex);
  return (
    <AbsoluteFill style={{background: C.paper, overflow: 'hidden'}}>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} data-resolution={res} style={{position: 'absolute', inset: 0}}>
        <PaperDefs />
        {layers.map((t, i) => (
          <g key={i} opacity={i === 0 ? undefined : 1 / (i + 1)}>
            <Opening t={t} k={i} />
          </g>
        ))}
        <Subtitle t={f} />
        <Hud t={f} />
      </svg>
      <PaperGrain opacity={0.06} />
      {music && <Audio src={staticFile('017-mid-century-modern/music.wav')} />}
    </AbsoluteFill>
  );
};
