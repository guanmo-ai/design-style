/**
 * Design Style · 布局 03 · Card Stack 卡片层叠 —— 21 秒短片（1920×1080 · 60fps · 120 BPM）
 *
 * 全片只有 4 张卡片。同一叠在产品世界之间 SNAP 过冲变形，六幕不停：
 *   0.0–1.5s  01 钩子     四张卡 POP 进层叠，顶卡再抬
 *   1.5–6.5s  02 iOS      登机牌 → 通知 → Sheet → 扫码 → 抽卡
 *   6.5–10.5s 03 后台     Stripe 抽屉 · Linear 详情 · 地图选点
 *  10.5–15.0s 04 拆解     炸开 z 轴 + 四条可带走规则
 *  15.0–18.0s 05 坏→好    鬼卡乱叠 → 铺平 → 弹簧叠回
 *  18.0–21.0s 片尾        收成图标 · 三句规则 · @guanmo_ai
 */
import React from 'react';
import {AbsoluteFill, Audio, interpolateColors, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {E, shake, tween} from '../../../src/lib/anim';
import {Grain} from '../../../src/lib/Grain';
import {C} from '../tokens';
import {EndFace, ExplodeFace, GhostFace, IosFace, KeyFace, PitFace, StripeFace} from './cards';
import {DepthTicks, ExplodeAxis, IosCaption, IosTouch, PhoneBack, PhoneFront, StripeCaption, StripeDesk} from './chrome';
import {CAM_HITS, COLOR_DUR, DURATION, GHOSTS, LayoutName, OVERLAP, PIT, RULES_AT, SCENE, TRANS, camAt, cardState, familyOf, ghostState, motionBlurPx, poseVel} from './layout';
import {Annotations, EndTitle, Hud, KeyCaption, PitCaption, TeachCaption} from './scenes';

export const CARDSTACK_DURATION = DURATION;

let fontsLoaded = false;
const loadFonts = () => {
  if (fontsLoaded) return;
  fontsLoaded = true;
  const F = (family: string, file: string, weight: string) =>
    loadFont({family, url: staticFile(`fonts/${file}`), weight, format: file.endsWith('.otf') ? 'opentype' : 'truetype'});
  F('Inter Display', 'InterDisplay-Medium.ttf', '500');
  F('Inter Display', 'InterDisplay-SemiBold.ttf', '600');
  F('Inter Display', 'InterDisplay-Bold.ttf', '700');
  F('Inter', 'Inter-Regular.ttf', '400');
  F('Inter', 'Inter-Medium.ttf', '500');
  F('Inter', 'Inter-SemiBold.ttf', '600');
  F('Geist Mono', 'GeistMono-Regular.ttf', '400');
  F('Geist Mono', 'GeistMono-Medium.ttf', '500');
  F('Noto Sans SC', 'NotoSansSC-Regular.otf', '400');
  F('Noto Sans SC', 'NotoSansSC-Medium.otf', '500');
  F('Noto Sans SC', 'NotoSansSC-Bold.otf', '700');
  F('Noto Sans SC', 'NotoSansSC-Black.otf', '900');
};

type Theme = {top: string; bot: string; line: string; lw: number; sh: number; hi: number};
const WHITE: Theme = {top: '#FFFFFF', bot: '#FFFFFF', line: 'rgba(15,23,42,0.08)', lw: 1, sh: 1, hi: 0.08};
const theme = (name: LayoutName): Theme => {
  switch (familyOf(name)) {
    case 'IOS':
      return {top: '#FFFFFF', bot: '#F3F4F6', line: 'rgba(0,0,0,0.06)', lw: 1, sh: 1.2, hi: 0.12};
    case 'STRIPE':
      return {top: '#FFFFFF', bot: '#F8FAFC', line: 'rgba(99,91,255,0.12)', lw: 1, sh: 1.1, hi: 0.06};
    case 'TEACH':
      return {top: 'rgba(255,255,255,0.96)', bot: 'rgba(248,250,252,0.96)', line: 'rgba(37,99,235,0.18)', lw: 1.2, sh: 0.6, hi: 0.1};
    case 'PIT':
      return name === 'FLAT'
        ? {top: '#FFFFFF', bot: '#FFFFFF', line: 'rgba(15,23,42,0.12)', lw: 1, sh: 0.15, hi: 0}
        : {top: '#F8FAFC', bot: '#F1F5F9', line: 'rgba(15,23,42,0.06)', lw: 1, sh: 0.4, hi: 0};
    case 'END':
      return {top: '#1C1C1E', bot: '#18181A', line: 'rgba(255,255,255,0.06)', lw: 1, sh: 0, hi: 0};
    default:
      return WHITE;
  }
};
const mixTheme = (a: Theme, b: Theme, p: number): Theme => {
  const c = (x: string, y: string) => interpolateColors(p, [0, 1], [x, y]);
  const n = (x: number, y: number) => x + (y - x) * p;
  return {top: c(a.top, b.top), bot: c(a.bot, b.bot), line: c(a.line, b.line), lw: n(a.lw, b.lw), sh: n(a.sh, b.sh), hi: n(a.hi, b.hi)};
};

const bgFamily = (name: LayoutName) => {
  switch (familyOf(name)) {
    case 'IOS':
      return '#000000';
    case 'STRIPE':
      return C.stripeBg;
    case 'TEACH':
      return C.navy;
    case 'PIT':
      return '#E8E4DC';
    case 'END':
      return '#0B0B0D';
    default:
      return C.paper;
  }
};
const bgAt = (f: number) => {
  let cur = bgFamily('HOOK');
  let prev: LayoutName = 'HOOK';
  for (const t of TRANS) {
    if (f < t.at) break;
    cur = interpolateColors(tween(f, t.at + 2, COLOR_DUR + 4, 0, 1, E.inOut), [0, 1], [bgFamily(prev), bgFamily(t.to)]);
    prev = t.to;
  }
  return cur;
};

const Face: React.FC<{f: number; i: number; from: LayoutName; to: LayoutName}> = ({f, i, from, to}) => {
  const pitKind = f >= PIT.fix ? 'fix' : f >= PIT.flat ? 'flat' : 'crowd';
  return (
    <>
      {(from === 'HOOK' || from === 'KEY' || from === 'KEY_UP' || to === 'HOOK' || to === 'KEY' || to === 'KEY_UP') && f < 110 && <KeyFace f={f} i={i} />}
      {(familyOf(from) === 'IOS' || familyOf(to) === 'IOS') && f >= 70 && f < 370 && <IosFace f={f} i={i} />}
      {(familyOf(from) === 'STRIPE' || familyOf(to) === 'STRIPE') && f >= 348 && f < 640 && <StripeFace f={f} i={i} />}
      {(familyOf(from) === 'TEACH' || familyOf(to) === 'TEACH') && f >= 538 && f < 910 && <ExplodeFace f={f} i={i} />}
      {f >= PIT.crowd - OVERLAP && f < PIT.end && <PitFace i={i} kind={pitKind} />}
      {f >= PIT.end - 8 && <EndFace i={i} />}
    </>
  );
};

const Card: React.FC<{f: number; i: number}> = ({f, i}) => {
  const st = cardState(f, i);
  const th = mixTheme(theme(st.from), theme(st.to), st.pc);
  const {x, y, w, h, r, z, rot, sc, o, dim} = st.pose;
  if (o <= 0.001) return null;
  const blur = motionBlurPx(poseVel(f, i));
  const front = dim < 0.03;
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
        boxShadow: `inset 0 0 0 ${th.lw}px ${th.line}, inset 0 1px 0 rgba(255,255,255,${th.hi}), 0 2px 4px rgba(15,23,42,${0.04 * th.sh}), 0 ${front ? 18 : 10}px ${front ? 48 : 24}px rgba(15,23,42,${0.12 * th.sh * (1 - dim)})`,
      }}
    >
      <Face f={f} i={i} from={st.from} to={st.to} />
    </div>
  );
};

const Ghost: React.FC<{f: number; g: number}> = ({f, g}) => {
  const pose = ghostState(f, g);
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
        background: '#F8FAFC',
        filter: `brightness(${1 - pose.dim})`,
        boxShadow: '0 8px 20px rgba(15,23,42,.08)',
      }}
    >
      <GhostFace g={g} />
    </div>
  );
};

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
        {f >= 70 && f < 380 && <PhoneBack f={f} />}
        {f >= 330 && f < 580 && <StripeDesk f={f} />}
        {f >= 538 && f < 900 && <ExplodeAxis f={f} />}
        {Array.from({length: 4}, (_, i) => (
          <Card key={i} f={f} i={i} />
        ))}
        {Array.from({length: GHOSTS}, (_, g) => (
          <Ghost key={`g${g}`} f={f} g={g} />
        ))}
        <AbsoluteFill style={{zIndex: 80}}>
          {f >= 70 && f < 380 && <PhoneFront f={f} />}
          {f >= 90 && f < 360 && <IosTouch f={f} />}
          {f >= 630 && f < 900 && <DepthTicks f={f} />}
          {f >= RULES_AT[0] - 4 && f < SCENE.TEACH.out && <Annotations f={f} />}
        </AbsoluteFill>
      </AbsoluteFill>
      <AbsoluteFill style={{zIndex: 90, pointerEvents: 'none'}}>
        {f >= SCENE.KEY.in - 8 && f < SCENE.KEY.out + 12 && <KeyCaption f={f} />}
        {f >= SCENE.IOS.in - 8 && f < SCENE.IOS.out + 10 && <IosCaption f={f} />}
        {f >= SCENE.STRIPE.in - 8 && f < SCENE.STRIPE.out + 10 && <StripeCaption f={f} />}
        {f >= SCENE.TEACH.in - 8 && f < SCENE.TEACH.out + 10 && <TeachCaption f={f} />}
        {f >= SCENE.PIT.in - 8 && f < SCENE.PIT.out + 8 && <PitCaption f={f} />}
        {f >= SCENE.END.in - 8 && <EndTitle f={f} />}
        <Hud f={f} />
      </AbsoluteFill>
      <Grain opacity={0.03} />
      {music && <Audio src={staticFile('03-card-stack/music.wav')} />}
    </AbsoluteFill>
  );
};
