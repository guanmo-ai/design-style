/**
 * Design Style 宣传片 ——「同一个圆 × 21 种设计风格」· 15 秒 · 1920×1080 · 60fps · 150 BPM（一拍 24 帧）
 * 时间轴见 ../timeline.json（画面与配乐共用）；分镜见 ../README.md
 */
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from '../../src/lib/Grain';
import {CX, CY, SceneProps, TL, cl, loadFonts} from './kit';
import {Hook, Hud} from './hook';
import {Bauhaus, Constructivism, Memphis, Swiss} from './scenes/a';
import {NeoBrutal, PopArt, Riso, Y2K} from './scenes/b';
import {ArtDeco, Futurism, Glass, MidCentury} from './scenes/c';
import {Ascii, Diorama, Generative, LowPoly} from './scenes/d';
import {Chrome, Ink, PointCloud} from './scenes/e';
import {Bento, End, Masonry, Wall} from './wall';

export const PROMO_DURATION = TL.duration;

export const SCENES: Record<string, React.FC<SceneProps>> = {
  bauhaus: Bauhaus,
  swiss: Swiss,
  constructivism: Constructivism,
  memphis: Memphis,
  popart: PopArt,
  y2k: Y2K,
  riso: Riso,
  neobrutal: NeoBrutal,
  artdeco: ArtDeco,
  glass: Glass,
  futurism: Futurism,
  midcentury: MidCentury,
  diorama: Diorama,
  lowpoly: LowPoly,
  ascii: Ascii,
  generative: Generative,
  pointcloud: PointCloud,
  chrome: Chrome,
  ink: Ink,
};

/** 当前帧属于哪一段、这一段从哪一帧开始（运动模糊的子帧不跨过硬切） */
const sectionStart = (f: number) => {
  let s = 0;
  for (const sc of TL.scenes) if (f >= sc.at) s = sc.at;
  if (f >= TL.wall.at) s = TL.wall.at;
  return s;
};

export const Stage: React.FC<{f: number; only?: string}> = ({f, only}) => {
  if (only) {
    // 只出某一个风格的静帧：给墙上的 21 张小图用（见 ../make_tiles.mjs）
    if (only === 'bento') return <Bento />;
    if (only === 'masonry') return <Masonry />;
    const sc = TL.scenes.find((x) => x.id === only)!;
    const C = SCENES[only];
    return C ? <C t={f} len={sc?.len ?? 24} /> : null;
  }
  if (f < TL.scenes[0].at) return <Hook t={f} />;
  if (f < TL.wall.at) {
    const sc = [...TL.scenes].reverse().find((x) => f >= x.at)!;
    const C = SCENES[sc.id];
    const t = f - sc.at;
    const push = 1 + 0.035 * cl(t / sc.len); // 每个镜头都在慢慢往里推
    return (
      <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: `${CX}px ${CY}px`}}>
        {C ? <C t={t} len={sc.len} /> : null}
      </AbsoluteFill>
    );
  }
  if (f < TL.end.at) return <Wall f={f} />;
  return (
    <AbsoluteFill style={{transform: `scale(${1 + 0.02 * Math.exp(-(f - TL.end.at) / 3)})`}}>
      <End te={f - TL.end.at} />
    </AbsoluteFill>
  );
};

export const Promo: React.FC<{music?: boolean; blur?: number; shutter?: number; hud?: boolean; only?: string}> = ({music = true, blur = 8, shutter = 0.75, hud = true, only}) => {
  loadFonts();
  const f = useCurrentFrame();
  const s0 = only ? -1e9 : sectionStart(f);
  const n = Math.max(1, blur);
  return (
    <AbsoluteFill style={{background: '#f7f4ed', overflow: 'hidden'}}>
      {Array.from({length: n}, (_, k) => (
        <AbsoluteFill key={k} style={{opacity: 1 / (k + 1)}}>
          <Stage f={Math.max(s0, f - (k * shutter) / n)} only={only} />
        </AbsoluteFill>
      ))}
      {hud && !only && <Hud f={f} />}
      <Grain opacity={0.035} />
      {music && !only && <Audio src={staticFile('promo/music.wav')} />}
    </AbsoluteFill>
  );
};
