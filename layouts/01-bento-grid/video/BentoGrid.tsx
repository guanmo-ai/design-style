/**
 * Design Style · 布局 01 · Bento Grid 便当盒布局 —— 15 秒短片（1920×1080 · 60fps · 150 BPM）
 *
 * 全片只有 7 张卡片。它们在八种布局之间“重新排版”，七个章节：
 *   0.0–2.6s  01 发布会   一张大卡片裂成发布会式的便当盒（苹果发布会最爱的排版）
 *   2.6–4.2s  02 名字     同一种拓扑缩进一只漆盒：白饭梅干、玉子烧、三文鱼……格子 = 卡片，一样菜 = 一个信息
 *   4.2–5.8s  03 2010     一种主题色的磁贴墙斜着退进黑暗里：Windows Phone / Windows 8 的动态磁贴
 *   5.8–7.4s  04 2020     飞进手机：iOS 14 小组件（小 / 中 / 大）
 *   7.4–9.8s  05 规则     卡片变成线框，五条规则逐条出现，同时打上测量标注
 *   9.8–11.4s 06 个人主页  浅色，bento.me 式：一张卡片只放一样东西
 *  11.4–13.0s 07 产品后台  深色，Linear 式
 *  13.0–15s  片尾         七张卡片缩回一个小图标
 * 布局与时间轴见 layout.ts；卡片内容见 content.tsx（发布会 / 规则 / 主页 / 后台）与 history.tsx（便当 / 磁贴 / 小组件）；
 * 卡片之外的元素见 overlays.tsx
 */
import React from 'react';
import {AbsoluteFill, Audio, interpolateColors, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {E, tween} from '../../../src/lib/anim';
import {ACCENT} from '../tokens';
import {cardState, COLOR_DUR, LayoutName, RULES_AT, SCENE, TRANS} from './layout';
import {DashContent, HomeContent, KeyContent, WireContent} from './content';
import {BentoBox, BentoCaption, BentoFood, IosCaption, IosContent, METRO_FILL, METRO_ORIGIN, MetroCaption, MetroChrome, MetroContent, metroTilt, PhoneBack, PhoneFront} from './history';
import {Annotations, ColumnFills, DashHeader, EndTitle, Hud, Profile, RulesPanel} from './overlays';

export const BENTO_DURATION = 900;
const T_METRO = TRANS.find((t) => t.to === 'METRO')!.at;

// 字体只在本合成真正挂载时加载
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
  F('Geist Mono', 'GeistMono-Regular.ttf', '400');
  F('Geist Mono', 'GeistMono-Medium.ttf', '500');
  F('Selawik', 'Selawik-Light.ttf', '300');
  F('Selawik', 'Selawik.ttf', '400');
  F('Noto Sans SC', 'NotoSansSC-Regular.otf', '400');
  F('Noto Sans SC', 'NotoSansSC-Medium.otf', '500');
  F('Noto Sans SC', 'NotoSansSC-Bold.otf', '700');
  F('Noto Sans SC', 'NotoSansSC-Black.otf', '900');
};

type Theme = {top: string; bot: string; line: string; lw: number; sh: number; hi: number; glow: number; accent: number; dep: number};
const DARK: Theme = {top: '#161618', bot: '#0F0F11', line: 'rgba(255,255,255,0.07)', lw: 1, sh: 0, hi: 0.07, glow: 0, accent: 0, dep: 0};
const FLAT = {line: 'rgba(0,0,0,0)', lw: 0, sh: 0, hi: 0, glow: 0, accent: 0, dep: 0};
const IOS_FILL: [string, string][] = [['#FF8A5C', '#7A3CFF'], ['#5AA0F5', '#2F6BD8'], ['#FFFFFF', '#FFFFFF'], ['#1C1C1E', '#1C1C1E'], ['#5BF675', '#0CBD2A'], ['#FFFFFF', '#FFFFFF'], ['#E5E5EA', '#AEAEB2']];
const theme = (name: LayoutName, i: number): Theme => {
  switch (name) {
    case 'HOOK':
    case 'KEY':
      return i === 0 ? {...DARK, top: '#0B0B0D', bot: '#0B0B0D', glow: 1} : DARK;
    case 'BENTO': // 朱漆格子：凹进去的深度
      return {...FLAT, top: '#8E211B', bot: '#68140F', dep: 1};
    case 'METRO': // 同一种钴蓝的几档深浅；不发光，只留上沿一根细高光
      return {...FLAT, top: METRO_FILL[i][0], bot: METRO_FILL[i][1], hi: 0.14, line: 'rgba(255,255,255,0.05)', lw: 1};
    case 'IOS':
      return {...FLAT, top: IOS_FILL[i][0], bot: IOS_FILL[i][1], sh: 0.8};
    case 'WIRE':
      return {top: 'rgba(24,24,26,0.3)', bot: 'rgba(24,24,26,0.3)', line: 'rgba(255,255,255,0.24)', lw: 1.5, sh: 0, hi: 0, glow: 0, accent: 0, dep: 0};
    case 'HOME': {
      // 白卡片为主、阴影几乎看不见；X 和“正在播放”是黑的，“每天一个设计风格”用品牌渐变，海报卡片的底色接海报自己的米色
      const white: Theme = {top: '#FFFFFF', bot: '#FFFFFF', line: 'rgba(0,0,0,0.035)', lw: 1, sh: 0.45, hi: 0, glow: 0, accent: 0, dep: 0};
      if (i === 0) return {...white, top: '#F0E9DA', bot: '#F0E9DA'};
      if (i === 1) return {...white, top: '#111112', bot: '#000000', line: 'rgba(255,255,255,0.05)', hi: 0.08, sh: 0.6};
      if (i === 5) return {...white, top: '#1C1C1E', bot: '#121214', line: 'rgba(255,255,255,0.05)', hi: 0.07, sh: 0.6};
      if (i === 6) return {...white, top: '#FF2D6F', bot: '#A63DFF', line: 'rgba(0,0,0,0)', accent: 1};
      return white;
    }
    case 'DASH':
      return {top: '#121315', bot: '#0C0D0E', line: 'rgba(255,255,255,0.075)', lw: 1, sh: 0, hi: 0.05, glow: 0, accent: 0, dep: 0};
    case 'END':
      return {top: '#1C1C1E', bot: '#18181A', line: 'rgba(255,255,255,0.06)', lw: 1, sh: 0, hi: 0, glow: 0, accent: i === 0 ? 1 : 0, dep: 0};
  }
};
const mixTheme = (a: Theme, b: Theme, p: number): Theme => {
  const c = (x: string, y: string) => interpolateColors(p, [0, 1], [x, y]);
  const n = (x: number, y: number) => x + (y - x) * p;
  return {top: c(a.top, b.top), bot: c(a.bot, b.bot), line: c(a.line, b.line), lw: n(a.lw, b.lw), sh: n(a.sh, b.sh), hi: n(a.hi, b.hi), glow: n(a.glow, b.glow), accent: n(a.accent, b.accent), dep: n(a.dep, b.dep)};
};

const BG: Record<LayoutName, string> = {HOOK: '#000000', KEY: '#000000', BENTO: '#0A0706', METRO: '#000000', IOS: '#000000', WIRE: '#000000', HOME: '#F5F5F7', DASH: '#08090A', END: '#000000'};
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

/** 主角卡里的光：三团径向渐变叠在右下角，缓慢漂移（不用 blur 滤镜，渲染快） */
const Glow: React.FC<{f: number; o: number}> = ({f, o}) => {
  if (o <= 0.001) return null;
  const a = Math.sin(f / 70) * 3;
  const b = Math.cos(f / 90) * 3;
  const blob = (w: number, h: number, x: number, y: number, rgb: string, k: number) =>
    `radial-gradient(${w}% ${h}% at ${x}% ${y}%, rgba(${rgb},${k}) 0%, rgba(${rgb},${k * 0.55}) 35%, rgba(${rgb},${k * 0.18}) 65%, rgba(${rgb},0) 100%)`;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: o,
        background: [
          blob(55, 60, 70 + a, 112 + b, '255,120,40', 0.95),
          blob(55, 70, 92 - b, 92 + a, '255,45,111', 0.85),
          blob(50, 80, 110 + a, 52 - b, '166,61,255', 0.85),
          blob(40, 50, 104, 18, '61,91,255', 0.35),
        ].join(','),
      }}
    />
  );
};

const Card: React.FC<{f: number; i: number}> = ({f, i}) => {
  const st = cardState(f, i);
  const th = mixTheme(theme(st.from, i), theme(st.to, i), st.pc);
  const {x, y, w, h, r} = st.rect;
  // 开场：主角卡淡入 + 轻微放大；其余 6 张藏在它下面，第 48 帧一起“裂开”
  const enter = i === 0 ? tween(f, 0, 26, 0, 1, E.out) : f < TRANS[0].at ? 0 : 1;
  const sc = i === 0 ? 0.94 + 0.06 * tween(f, 0, 56, 0, 1, E.out) : 1;
  const glow = i === 0 ? th.glow * (f < 80 ? tween(f, 8, 70, 0, 1, E.inOut) : 1) : 0;
  const win = (s: {in: number; out: number}) => f >= s.in - 30 && f < s.out + 10;
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
        opacity: enter,
        transform: `scale(${sc})`,
        zIndex: i === 0 ? 10 : i,
        background: `linear-gradient(180deg, ${th.top}, ${th.bot})`,
        boxShadow: `inset 0 0 0 ${th.lw}px ${th.line}, inset 0 1px 0 rgba(255,255,255,${th.hi}), inset 0 12px 24px rgba(0,0,0,${0.55 * th.dep}), inset 0 -1px 0 rgba(255,190,170,${0.12 * th.dep}), 0 2px 4px rgba(0,0,0,${0.03 * th.sh}), 0 10px 30px rgba(0,0,0,${0.06 * th.sh})`,
      }}
    >
      {i === 0 && <Glow f={f} o={glow} />}
      {th.accent > 0.001 && <div style={{position: 'absolute', inset: 0, background: ACCENT, opacity: th.accent}} />}
      {f < SCENE.KEY.out + 10 && <KeyContent f={f} i={i} />}
      {win(SCENE.BENTO) && <BentoFood f={f} i={i} />}
      {win(SCENE.METRO) && <MetroContent f={f} i={i} />}
      {win(SCENE.IOS) && <IosContent f={f} i={i} />}
      {win(SCENE.WIRE) && <WireContent f={f} i={i} />}
      {win(SCENE.HOME) && <HomeContent f={f} i={i} />}
      {win(SCENE.DASH) && <DashContent f={f} i={i} />}
    </div>
  );
};

export const BentoGrid: React.FC<{music?: boolean}> = ({music = true}) => {
  React.useState(loadFonts);
  const f = useCurrentFrame();
  // 镜头：开场从 1.04 缓缓退到 1.0，之后整片极慢地推近；03 Metro 的磁贴墙另有自己的 3D 镜头（metroTilt）
  const cam = 1.04 - 0.04 * tween(f, 0, 100, 0, 1, E.out) + 0.012 * (f / 900);
  const tilt = metroTilt(f);
  const tiltStyle = tilt ? {transform: tilt, transformOrigin: METRO_ORIGIN} : undefined;
  return (
    <AbsoluteFill style={{background: bgAt(f), overflow: 'hidden'}}>
      {f >= T_METRO && f < 360 && (
        <AbsoluteFill style={{opacity: tween(f, T_METRO, 30) * (1 - tween(f, SCENE.METRO.out, 16)), background: 'radial-gradient(46% 62% at 60% 50%, rgba(18,48,160,.30), rgba(8,20,80,.10) 55%, rgba(0,0,0,0) 80%)'}} />
      )}
      <AbsoluteFill style={{transform: `scale(${cam})`, transformOrigin: '960px 540px'}}>
        {f >= 150 && f < 264 && <BentoBox f={f} />}
        {f >= 344 && f < 460 && <PhoneBack f={f} />}
        {f >= RULES_AT[4] - 4 && f < SCENE.WIRE.out + 12 && <ColumnFills f={f} />}
        <AbsoluteFill style={tiltStyle}>
          {Array.from({length: 7}, (_, i) => (
            <Card key={i} f={f} i={i} />
          ))}
        </AbsoluteFill>
        {f >= 252 && f < 352 && (
          <AbsoluteFill style={{zIndex: 19, ...tiltStyle}}>
            <MetroChrome f={f} />
          </AbsoluteFill>
        )}
        <AbsoluteFill style={{zIndex: 20}}>
          {f >= 156 && f < 256 && <BentoCaption f={f} />}
          {f >= 252 && f < 352 && <MetroCaption f={f} />}
          {f >= 344 && f < 460 && <PhoneFront f={f} />}
          {f >= 344 && f < 448 && <IosCaption f={f} />}
          {f >= 444 && f < 590 && <RulesPanel f={f} />}
          {f >= RULES_AT[1] - 4 && f < 590 && <Annotations f={f} />}
          {f >= 588 && f < 684 && <Profile f={f} />}
          {f >= 684 && f < 780 && <DashHeader f={f} />}
          {f >= 800 && <EndTitle f={f} />}
          <Hud f={f} />
        </AbsoluteFill>
      </AbsoluteFill>
      {music && <Audio src={staticFile('01-bento-grid/music.wav')} />}
    </AbsoluteFill>
  );
};
