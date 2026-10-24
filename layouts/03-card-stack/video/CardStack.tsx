/**
 * Design Style · 布局 03 · Card Stack 卡片层叠 —— 22 秒短片（1920×1080 · 60fps · 120 BPM）
 *
 * 全片只有 4 张卡片。它们在九种世界之间变形，七个章节：
 *   0.0–2.5s  01 钩子     四张卡弹进层叠：顶卡可读、后层压暗
 *   2.5–5.5s  02 iOS      飞进手机：Wallet 登机牌 / 卡 / 通知 / Sheet
 *   5.5–8.5s  03 后台     Stripe 支付抽屉 · Linear 详情 · 地图选点
 *   8.5–11.5s 04 隐喻     名片 / 扑克 / 档案袋 / 索引卡
 *  11.5–14.5s 05 拆解     爆炸视图 + 深度轴 + z-index
 *  14.5–18.0s 06 规则     线框 + 五条中英规则 + 测量
 *  18.0–20.0s 07 常见坑   叠太多 → 没有焦点 → 弹回正确
 *  20.0–22.0s 片尾        收成小图标 · @guanmo_ai
 */
import React from 'react';
import {AbsoluteFill, Audio, interpolateColors, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {E, tween} from '../../../src/lib/anim';
import {Grain} from '../../../src/lib/Grain';
import {C} from '../tokens';
import {DeckFace, EndFace, ExplodeFace, GhostFace, IosFace, KeyFace, PitFace, StripeFace, WireFace} from './cards';
import {DeckCaption, DepthTicks, ExplodeAxis, Felt, IosCaption, PhoneBack, PhoneFront, StripeCaption, StripeDesk} from './chrome';
import {COLOR_DUR, DURATION, GHOSTS, LayoutName, PIT, RULES_AT, SCENE, TRANS, camAt, cardState, familyOf, ghostState, poseLive} from './layout';
import {Annotations, EndTitle, ExplodeCaption, Hud, KeyCaption, PitCaption, RulesPanel} from './scenes';

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
const theme = (name: LayoutName, i: number): Theme => {
  switch (name) {
    case 'HOOK':
    case 'KEY':
    case 'FIX':
      return WHITE;
    case 'IOS':
    case 'NOTE':
    case 'SHEET':
    case 'WALLET':
      return {top: '#FFFFFF', bot: '#F3F4F6', line: 'rgba(0,0,0,0.06)', lw: 1, sh: 1.2, hi: 0.12};
    case 'STRIPE':
    case 'ISSUE':
      return {top: '#FFFFFF', bot: '#F8FAFC', line: 'rgba(99,91,255,0.12)', lw: 1, sh: 1.1, hi: 0.06};
    case 'DECK':
      return i === 1 ? {top: '#FFFBFF', bot: '#F4F0E8', line: 'rgba(17,24,39,0.16)', lw: 1.5, sh: 0.8, hi: 0.2} : {top: '#FAF6EE', bot: '#F3E6C8', line: 'rgba(68,64,60,0.12)', lw: 1, sh: 0.7, hi: 0.1};
    case 'EXPLODE':
      return {top: 'rgba(255,255,255,0.96)', bot: 'rgba(248,250,252,0.96)', line: 'rgba(37,99,235,0.18)', lw: 1.2, sh: 0.6, hi: 0.1};
    case 'WIRE':
      return {top: 'rgba(40,40,46,0.62)', bot: 'rgba(22,22,26,0.62)', line: 'rgba(255,255,255,0.5)', lw: 1.8, sh: 0, hi: 0.08};
    case 'CROWD':
      return {top: '#F8FAFC', bot: '#F1F5F9', line: 'rgba(15,23,42,0.06)', lw: 1, sh: 0.4, hi: 0};
    case 'FLAT':
      return {top: '#FFFFFF', bot: '#FFFFFF', line: 'rgba(15,23,42,0.12)', lw: 1, sh: 0.15, hi: 0};
    case 'END':
      return {top: '#1C1C1E', bot: '#18181A', line: 'rgba(255,255,255,0.06)', lw: 1, sh: 0, hi: 0};
  }
};
const mixTheme = (a: Theme, b: Theme, p: number): Theme => {
  const c = (x: string, y: string) => interpolateColors(p, [0, 1], [x, y]);
  const n = (x: number, y: number) => x + (y - x) * p;
  return {top: c(a.top, b.top), bot: c(a.bot, b.bot), line: c(a.line, b.line), lw: n(a.lw, b.lw), sh: n(a.sh, b.sh), hi: n(a.hi, b.hi)};
};

const BG: Record<LayoutName, string> = {
  HOOK: C.paper,
  KEY: C.paper,
  IOS: '#000000',
  NOTE: '#000000',
  SHEET: '#000000',
  WALLET: '#000000',
  STRIPE: C.stripeBg,
  ISSUE: C.stripeBg,
  DECK: C.felt,
  EXPLODE: C.navy,
  WIRE: '#050508',
  CROWD: '#E8E4DC',
  FLAT: '#E8E4DC',
  FIX: C.paper,
  END: '#0B0B0D',
};
const bgAt = (f: number) => {
  let cur = BG.HOOK;
  let prev: LayoutName = 'HOOK';
  for (const t of TRANS) {
    if (f < t.at) break;
    cur = interpolateColors(tween(f, t.at + 2, COLOR_DUR + 4, 0, 1, E.inOut), [0, 1], [BG[prev], BG[t.to]]);
    prev = t.to;
  }
  return cur;
};

const Face: React.FC<{f: number; i: number; from: LayoutName; to: LayoutName}> = ({f, i, from, to}) => {
  const win = (s: {in: number; out: number}) => f >= s.in - 28 && f < s.out + 12;
  const pitKind = f >= PIT.fix ? 'fix' : f >= PIT.flat ? 'flat' : 'crowd';
  return (
    <>
      {(from === 'HOOK' || from === 'KEY' || to === 'HOOK' || to === 'KEY') && f < 175 && <KeyFace f={f} i={i} />}
      {(familyOf(from) === 'IOS' || familyOf(to) === 'IOS' || win(SCENE.IOS)) && f >= 145 && f < 340 && <IosFace f={f} i={i} />}
      {(familyOf(from) === 'STRIPE' || familyOf(to) === 'STRIPE' || win(SCENE.STRIPE)) && f >= 320 && f < 520 && <StripeFace f={f} i={i} />}
      {win(SCENE.DECK) && <DeckFace f={f} i={i} />}
      {win(SCENE.EXPLODE) && <ExplodeFace f={f} i={i} />}
      {win(SCENE.WIRE) && <WireFace f={f} i={i} />}
      {f >= PIT.crowd - 8 && f < PIT.end && <PitFace i={i} kind={pitKind} />}
      {f >= PIT.end - 4 && <EndFace i={i} />}
    </>
  );
};

const Card: React.FC<{f: number; i: number}> = ({f, i}) => {
  const st = cardState(f, i);
  const th = mixTheme(theme(st.from, i), theme(st.to, i), st.pc);
  const {x, y, w, h, r, z, rot, sc, o, dim} = poseLive(f, i, st.pose);
  if (o <= 0.001) return null;
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
        filter: `brightness(${1 - dim})`,
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
        transform: `rotate(${pose.rot}deg)`,
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
  return (
    <AbsoluteFill style={{background: bgAt(f), overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${cam.x}px, ${cam.y}px) rotate(${cam.r}deg) scale(${cam.s})`, transformOrigin: `${cam.ox}px ${cam.oy}px`}}>
        {f >= 150 && f < 345 && <PhoneBack f={f} />}
        {f >= 330 && f < 525 && <StripeDesk f={f} />}
        {f >= 510 && f < 705 && <Felt f={f} />}
        {f >= 690 && f < 880 && <ExplodeAxis f={f} />}
        {Array.from({length: 4}, (_, i) => (
          <Card key={i} f={f} i={i} />
        ))}
        {Array.from({length: GHOSTS}, (_, g) => (
          <Ghost key={`g${g}`} f={f} g={g} />
        ))}
        <AbsoluteFill style={{zIndex: 80}}>
          {f >= 150 && f < 345 && <PhoneFront f={f} />}
          {f >= SCENE.KEY.in - 8 && f < SCENE.KEY.out + 10 && <KeyCaption f={f} />}
          {f >= SCENE.IOS.in - 8 && f < SCENE.IOS.out + 10 && <IosCaption f={f} />}
          {f >= SCENE.STRIPE.in - 8 && f < SCENE.STRIPE.out + 10 && <StripeCaption f={f} />}
          {f >= SCENE.DECK.in - 8 && f < SCENE.DECK.out + 10 && <DeckCaption f={f} />}
          {f >= SCENE.EXPLODE.in - 8 && f < SCENE.EXPLODE.out + 10 && <ExplodeCaption f={f} />}
          {f >= 690 && f < 880 && <DepthTicks f={f} />}
          {f >= SCENE.WIRE.in - 8 && f < SCENE.WIRE.out + 10 && <RulesPanel f={f} />}
          {f >= RULES_AT[0] - 4 && f < SCENE.WIRE.out + 8 && <Annotations f={f} />}
          {f >= SCENE.PIT.in - 8 && f < SCENE.PIT.out + 8 && <PitCaption f={f} />}
          {f >= SCENE.END.in - 8 && <EndTitle f={f} />}
          <Hud f={f} />
        </AbsoluteFill>
      </AbsoluteFill>
      <Grain opacity={0.03} />
      {music && <Audio src={staticFile('03-card-stack/music.wav')} />}
    </AbsoluteFill>
  );
};
