/**
 * Design Style · 布局 02 · Masonry 瀑布流 —— 15 秒短片（1920×1080 · 60fps · ≈128.6 BPM）
 *
 * 全片 26 张卡片，在 13 种布局之间“流动”。七个章节：
 *   0.0–2.1s  01 定义     卡片像雨点落进 6 列，再流到右半边：列宽固定，高度随内容
 *   2.1–3.5s  02 名字     同一套算法砌成一面石墙：Masonry = 砌石
 *   3.5–5.8s  03 算法     只留 8 张，一张一张往里放：永远放进当前最矮的一列
 *   5.8–7.2s  04 2010     Pinterest 图钉墙：悬停、保存
 *   7.2–8.6s  05 双列     飞进手机：双列信息流，手指一划
 *   8.6–11.3s 06 规则     线框 + 五条规则 + 测量标注 + 骨架屏
 *  11.3–12.9s 07 响应式   浏览器窗口 5 → 3 → 2 列
 *  12.9–15s  片尾        收成一个小图标
 * 布局与时间轴见 layout.ts；卡片见 tiles.tsx；卡片之外的元素见 scenes.tsx
 */
import React from 'react';
import {AbsoluteFill, Audio, interpolateColors, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {E, tween} from '../../../src/lib/anim';
import {Grain} from '../../../src/lib/Grain';
import {COLOR_DUR, ITEMS, SCENE, ThemeName, TRANS, themeOf, tileState} from './layout';
import {Tile} from './tiles';
import {
  AlgCaption,
  AlgOverlay,
  Annotations,
  ColumnLanes,
  EndTitle,
  Hud,
  KeyCaption,
  PhoneBack,
  PhoneCaption,
  PhoneFront,
  PinCaption,
  PinHover,
  RespCaption,
  RespWindow,
  RulesPanel,
  StoneCaption,
} from './scenes';

export const MASONRY_DURATION = 900;

let fontsLoaded = false;
const loadFonts = () => {
  if (fontsLoaded) return;
  fontsLoaded = true;
  const F = (family: string, file: string, weight: string, style = 'normal') =>
    loadFont({family, url: staticFile(`fonts/${file}`), weight, style, format: file.endsWith('.otf') ? 'opentype' : 'truetype'});
  F('Instrument Serif', 'InstrumentSerif-Regular.ttf', '400');
  F('Instrument Serif', 'InstrumentSerif-Italic.ttf', '400', 'italic');
  F('Inter Display', 'InterDisplay-Medium.ttf', '500');
  F('Inter Display', 'InterDisplay-SemiBold.ttf', '600');
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

// 每章的底色
const BG: Record<ThemeName, string> = {
  KEY: '#F2EFE9',
  STONE: '#1D1915',
  ALG: '#0D0E10',
  PIN: '#FFFFFF',
  PHONE: '#0E0E10',
  WIRE: '#0D0E10',
  RESP: '#F2EFE9',
  END: '#F2EFE9',
};
// 每章上下边缘要不要“雾”掉（卡片从画面边缘流出去时，不让它被硬切）
const FADE: Record<ThemeName, [number, number]> = {
  KEY: [0.6, 1],
  STONE: [1, 1],
  ALG: [0, 1],
  PIN: [1, 1],
  PHONE: [0, 0],
  WIRE: [0, 1],
  RESP: [0, 0],
  END: [0, 0],
};

/** 按转场把每章的值混起来（只在“章节变了”的转场上混） */
const mixAt = <T,>(f: number, pick: (t: ThemeName) => T, mix: (a: T, b: T, p: number) => T): T => {
  let prev: ThemeName = 'KEY';
  let cur = pick(prev);
  for (const t of TRANS) {
    if (f < t.at) break;
    const nt = themeOf(t.to);
    if (nt === prev) continue;
    cur = mix(cur, pick(nt), tween(f, t.at + 4, COLOR_DUR + 10, 0, 1, E.inOut));
    prev = nt;
  }
  return cur;
};
const bgAt = (f: number) => mixAt(f, (t) => BG[t], (a, b, p) => interpolateColors(p, [0, 1], [a, b]));
const fadeAt = (f: number) => mixAt(f, (t) => FADE[t], (a, b, p) => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p] as [number, number]);

/** 把 bgAt 给出的颜色换成指定透明度 */
const alpha = (c: string, a: number) => {
  const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (m) return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${a})`;
  const h = c.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${a})`;
};

const Fades: React.FC<{f: number; bg: string}> = ({f, bg}) => {
  const [top, bot] = fadeAt(f);
  return (
    <>
      {top > 0.01 && <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 120, background: `linear-gradient(180deg, ${alpha(bg, top)}, ${alpha(bg, 0)})`}} />}
      {bot > 0.01 && <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 170, background: `linear-gradient(0deg, ${alpha(bg, bot)}, ${alpha(bg, bot * 0.6)} 35%, ${alpha(bg, 0)})`}} />}
    </>
  );
};

const on = (f: number, s: {in: number; out: number}, pre = 24, post = 16) => f >= s.in - pre && f < s.out + post;

export const Masonry: React.FC<{music?: boolean}> = ({music = true}) => {
  React.useState(loadFonts);
  const f = useCurrentFrame();
  const bg = bgAt(f);
  // 镜头：开场从 1.035 退到 1.0，之后极慢地推近
  const cam = 1.035 - 0.035 * tween(f, 0, 90, 0, 1, E.out) + 0.01 * (f / 900);
  return (
    <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${cam})`, transformOrigin: '1180px 540px'}}>
        {on(f, SCENE.PHONE, 30, 20) && <PhoneBack f={f} />}
        {f >= 680 && f < 800 && <RespWindow f={f} />}
        {on(f, SCENE.WIRE) && <ColumnLanes f={f} />}
        <AbsoluteFill>
          {ITEMS.map((_, i) => (
            <Tile key={i} f={f} i={i} st={tileState(f, i)} />
          ))}
        </AbsoluteFill>
        <AbsoluteFill style={{zIndex: 60}}>
          {on(f, SCENE.ALG) && <AlgOverlay f={f} />}
          {on(f, SCENE.PIN) && <PinHover f={f} />}
          {on(f, SCENE.PHONE, 30, 20) && <PhoneFront f={f} />}
          {on(f, SCENE.WIRE) && <Annotations f={f} />}
          <Fades f={f} bg={bg} />
        </AbsoluteFill>
      </AbsoluteFill>
      <AbsoluteFill style={{zIndex: 80}}>
        {f < SCENE.KEY.out + 16 && <KeyCaption f={f} />}
        {on(f, SCENE.STONE) && <StoneCaption f={f} />}
        {on(f, SCENE.ALG) && <AlgCaption f={f} />}
        {on(f, SCENE.PIN) && <PinCaption f={f} />}
        {on(f, SCENE.PHONE) && <PhoneCaption f={f} />}
        {on(f, SCENE.WIRE) && <RulesPanel f={f} />}
        {on(f, SCENE.RESP) && <RespCaption f={f} />}
        {f >= SCENE.END.in - 20 && <EndTitle f={f} />}
        <Hud f={f} />
      </AbsoluteFill>
      <Grain opacity={0.04} />
      {music && <Audio src={staticFile('02-masonry/music.wav')} />}
    </AbsoluteFill>
  );
};
