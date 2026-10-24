/**
 * Design Style · 布局 03 · Card Stack 卡片层叠 —— 22 秒短片（1920×1080 · 60fps · 120 BPM）
 *
 * v6 全新视觉：四张竖版海报贯穿。不是 Wallet，不是白 UI。
 *   0.0–1.5s   01 砸进     四张刊从镜头里砸成一叠
 *   1.5–5.3s   02 刊·抽    抽走正在看的封面，下一本接手
 *   4.8–8.3s   03 层·提    压扁成图层板，后层穿过深度提到最前
 *   7.8–10.6s  04 样·压    扇开印刷样，选定一张，其余压回
 *  10.3–14.2s  05 拆解     沿 z 炸开，三条规则落在运动上
 *  13.8–17.8s  06 坏→好    八张杂刊在动 → 铺平 → 弹簧叠回
 *  17.8–22.0s  片尾        缩成图标 · 抽/提/压 · @guanmo_ai
 */
import React from 'react';
import {AbsoluteFill, Audio, interpolateColors, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {E, shake, tween} from '../../../src/lib/anim';
import {Grain} from '../../../src/lib/Grain';
import {C} from '../tokens';
import {ExtraFace, ID, PosterFace} from './faces';
import {BEATS, CAM_HITS, COLOR_DUR, DURATION, EXTRAS, LayoutName, SCENE, TRANS, camAt, cardState, extraState, familyOf, motionBlurPx, poseVel} from './layout';
import {Axis, CoverCaption, EndTitle, Hud, LayerCaption, LayerTicks, LightTable, PitCaption, ProofCaption, Rail, TeachCaption} from './stage';

export const CARDSTACK_DURATION = DURATION;

let fontsLoaded = false;
const loadFonts = () => {
  if (fontsLoaded) return;
  fontsLoaded = true;
  const F = (family: string, file: string, weight: string) =>
    loadFont({family, url: staticFile(`fonts/${file}`), weight, format: file.endsWith('.otf') ? 'opentype' : 'truetype'});
  F('TeX Gyre Heros', 'TeXGyreHeros-Regular.otf', '400');
  F('TeX Gyre Heros', 'TeXGyreHeros-Bold.otf', '700');
  F('Geist Mono', 'GeistMono-Regular.ttf', '400');
  F('Geist Mono', 'GeistMono-Medium.ttf', '500');
  F('Noto Sans SC', 'NotoSansSC-Regular.otf', '400');
  F('Noto Sans SC', 'NotoSansSC-Medium.otf', '500');
  F('Noto Sans SC', 'NotoSansSC-Bold.otf', '700');
  F('Noto Sans SC', 'NotoSansSC-Black.otf', '900');
};

type Theme = {top: string; bot: string; line: string; lw: number; sh: number; hi: number};
const posterTheme = (i: number): Theme => {
  const id = ID[i];
  const cream = i === 1;
  return {
    top: id.bg,
    bot: id.bg2,
    line: cream ? 'rgba(17,17,17,0.16)' : 'rgba(246,240,228,0.16)',
    lw: 1,
    sh: 1.15,
    hi: cream ? 0.04 : 0.12,
  };
};
const theme = (name: LayoutName, i: number): Theme => {
  const poster = posterTheme(i);
  switch (familyOf(name)) {
    case 'TEACH':
      return {top: C.cream, bot: C.bone, line: 'rgba(17,17,17,0.12)', lw: 1, sh: 0.55, hi: 0.06};
    case 'PIT':
      return name === 'FLAT'
        ? {top: C.cream, bot: C.cream, line: 'rgba(17,17,17,0.1)', lw: 1, sh: 0.08, hi: 0}
        : poster;
    default:
      return poster;
  }
};
const mixTheme = (a: Theme, b: Theme, p: number): Theme => {
  const c = (x: string, y: string) => interpolateColors(p, [0, 1], [x, y]);
  const n = (x: number, y: number) => x + (y - x) * p;
  return {top: c(a.top, b.top), bot: c(a.bot, b.bot), line: c(a.line, b.line), lw: n(a.lw, b.lw), sh: n(a.sh, b.sh), hi: n(a.hi, b.hi)};
};

const bgFamily = (name: LayoutName) => {
  switch (familyOf(name)) {
    case 'HOOK':
      return C.night;
    case 'COVER':
      return C.paper;
    case 'LAYER':
      return C.night;
    case 'PROOF':
      return C.sand;
    case 'TEACH':
      return C.teal;
    case 'PIT':
      return name === 'FLAT' ? '#D4CBB8' : C.bone;
    default:
      return C.night;
  }
};
const bgAt = (f: number) => {
  let cur = bgFamily('SLAM');
  let prev: LayoutName = 'SLAM';
  for (const t of TRANS) {
    if (f < t.at) break;
    cur = interpolateColors(tween(f, t.at + 2, COLOR_DUR + 4, 0, 1, E.inOut), [0, 1], [bgFamily(prev), bgFamily(t.to)]);
    prev = t.to;
  }
  return cur;
};

const Card: React.FC<{f: number; i: number}> = ({f, i}) => {
  const st = cardState(f, i);
  const th = mixTheme(theme(st.from, i), theme(st.to, i), st.pc);
  const {x, y, w, h, r, z, rot, sc, o, dim} = st.pose;
  if (o <= 0.001) return null;
  const blur = motionBlurPx(poseVel(f, i));
  const front = dim < 0.03;
  const shade = ID[i].bg === C.cream ? '17,17,17' : '12,12,14';
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: r,
        overflow: 'hidden',
        opacity: o,
        zIndex: 20 + Math.round(z),
        transform: `rotate(${rot}deg) scale(${sc})`,
        transformOrigin: '50% 80%',
        background: `linear-gradient(180deg, ${th.top}, ${th.bot})`,
        filter: `brightness(${1 - dim})${blur > 0.15 ? ` blur(${blur.toFixed(2)}px)` : ''}`,
        boxShadow: `inset 0 0 0 ${th.lw}px ${th.line}, inset 0 1px 0 rgba(255,255,255,${th.hi}), 0 2px 4px rgba(${shade},${0.05 * th.sh}), 0 ${front ? 22 : 10}px ${front ? 56 : 24}px rgba(${shade},${0.22 * th.sh * (1 - dim)})`,
      }}
    >
      <PosterFace f={f} i={i} from={st.from} to={st.to} />
    </div>
  );
};

const Extra: React.FC<{f: number; g: number}> = ({f, g}) => {
  const pose = extraState(f, g);
  if (!pose) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: pose.x,
        top: pose.y,
        width: pose.w,
        height: pose.h,
        borderRadius: pose.r,
        overflow: 'hidden',
        opacity: pose.o,
        zIndex: 8 - g,
        transform: `rotate(${pose.rot}deg) scale(${pose.sc})`,
        background: EXTRA_FACE_BG[g],
        filter: `brightness(${1 - pose.dim})`,
        boxShadow: '0 10px 28px rgba(12,12,14,.18)',
      }}
    >
      <ExtraFace g={g} />
    </div>
  );
};

const EXTRA_FACE_BG = [C.sand, C.red, C.ink2, C.teal];

export const CardStack: React.FC<{music?: boolean}> = ({music = true}) => {
  React.useState(loadFonts);
  const f = useCurrentFrame();
  const cam = camAt(f);
  const kick = shake(f, CAM_HITS);
  return (
    <AbsoluteFill style={{background: bgAt(f), overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          transform: `translate(${cam.x + kick.x}px, ${cam.y + kick.y}px) scale(${cam.s})`,
          transformOrigin: `${cam.ox}px ${cam.oy}px`,
        }}
      >
        {f >= SCENE.PROOF.in - 12 && f < SCENE.TEACH.in + 8 && <LightTable f={f} />}
        {f >= BEATS.explode - 8 && f < BEATS.noise && <Axis f={f} />}
        {Array.from({length: 4}, (_, i) => (
          <Card key={i} f={f} i={i} />
        ))}
        {Array.from({length: EXTRAS}, (_, g) => (
          <Extra key={`e${g}`} f={f} g={g} />
        ))}
        <AbsoluteFill style={{zIndex: 80}}>
          {f >= SCENE.LAYER.in - 6 && f < SCENE.PROOF.in && <LayerTicks f={f} />}
        </AbsoluteFill>
      </AbsoluteFill>
      <AbsoluteFill style={{zIndex: 90, pointerEvents: 'none'}}>
        <Rail f={f} />
        {f >= SCENE.COVER.in - 6 && f < SCENE.LAYER.out - 10 && <CoverCaption f={f} />}
        {f >= SCENE.LAYER.in - 4 && f < SCENE.PROOF.out - 8 && <LayerCaption f={f} />}
        {f >= SCENE.PROOF.in - 4 && f < SCENE.TEACH.out - 20 && <ProofCaption f={f} />}
        {f >= SCENE.TEACH.in - 4 && f < SCENE.PIT.in + 8 && <TeachCaption f={f} />}
        {f >= SCENE.PIT.in - 8 && f < SCENE.END.in && <PitCaption f={f} />}
        {f >= SCENE.END.in - 8 && <EndTitle f={f} />}
        <Hud f={f} />
      </AbsoluteFill>
      <Grain opacity={0.045} />
      {music && <Audio src={staticFile('03-card-stack/music.wav')} />}
    </AbsoluteFill>
  );
};
