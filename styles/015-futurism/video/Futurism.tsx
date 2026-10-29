/**
 * 015 · 未来主义 Futurism —— 20 秒短片（1920×1080 · 60fps · 144 BPM）
 *
 * 全片一条物理规则：动的东西留下它刚才的样子。残影由真实轨迹生成（第 k 层 = k·Δt 前，Δt = 3 帧，不透明度 0.6^k），
 * 所以刹车时自己收拢、加速时自己拉开、停下一层不剩；字宽 = 速度（Archivo wdth 62 → 125）。
 * 分镜见 STORYBOARD.md，时间轴见 timeline.ts，每章一个文件（scenes.ts 里登记）。
 *
 * 参数（草稿预览与正片共用一套代码）：
 *   step  一帧走几帧剧本时间（正片 1；草稿预览 30fps 合成里 = 2）
 *   blur  运动模糊最多几个子帧（正片 6；草稿 1 = 不做）：按这一帧最快的东西决定取几个，快门半帧
 *   res   内部分辨率（正片 1；草稿 0.5：颗粒贴图按它缩小，画面本身靠 --scale=0.5 以半分辨率栅格化）
 */
import {motionBlurTimes} from '../../../src/lib/motion/sampling';
import React from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {Grain} from '../../../src/lib/Grain';
import {C} from '../tokens';
import {Hud} from './hud';
import {H, W} from './kit';
import {bgAt, darkAt, probeAt, sceneIndex, SCENES, speedAt} from './scenes';
import {DURATION} from './timeline';

export const FUTURISM_DURATION = DURATION;

let fontsP: Promise<unknown> | null = null;
const loadFonts = () => {
  if (fontsP) return fontsP;
  const L = (family: string, file: string, weight: string, stretch?: string) =>
    loadFont({family, url: staticFile(`fonts/${file}`), weight, stretch, format: file.endsWith('.otf') ? 'opentype' : 'truetype'});
  fontsP = Promise.all([
    L('Archivo', 'Archivo.ttf', '100 900', '62% 125%'),
    L('Space Mono', 'SpaceMono-Regular.ttf', '400'),
    L('Space Mono', 'SpaceMono-Bold.ttf', '700'),
    L('Noto Sans SC', 'NotoSansSC-Medium.otf', '500'),
    L('Noto Sans SC', 'NotoSansSC-Bold.otf', '700'),
    L('Noto Sans SC', 'NotoSansSC-Black.otf', '900'),
  ]);
  return fontsP;
};

/** 某一时刻的整个画面（不含外框）：背景 + 这一刻还活着的各段 */
const Stage: React.FC<{t: number}> = ({t}) => (
  <>
    <rect width={W} height={H} fill={bgAt(t)} />
    {SCENES.map((s, i) => (t >= s.from && t < s.to ? <s.C key={i} t={t - (s.shift ?? 0)} /> : null))}
  </>
);

export const Futurism: React.FC<{music?: boolean; blur?: number; step?: number; res?: number}> = ({music = true, blur = 6, step = 1, res = 1}) => {
  const f = useCurrentFrame() * step;
  const [handle] = React.useState(() => delayRender('futurism-fonts'));
  React.useEffect(() => {
    loadFonts().then(() => continueRender(handle));
  }, [handle]);
  // 运动模糊：快门半帧；最快的东西每帧走 v px，就取 2 + v/12 个子帧（最多 blur 个）；子帧不跨过换段的那一刻
  const layers = motionBlurTimes(f, blur, speedAt, sceneIndex);
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
        {layers.map((t, i) => (
          <g key={i} opacity={i === 0 ? undefined : 1 / (i + 1)}>
            <Stage t={t} />
          </g>
        ))}
        <Hud t={f} probe={probeAt(f)} dark={darkAt(f)} />
      </svg>
      <Grain opacity={0.05 * Math.max(0.5, res)} />
      {music && <Audio src={staticFile('015-futurism/music.wav')} />}
    </AbsoluteFill>
  );
};
