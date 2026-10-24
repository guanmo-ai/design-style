/**
 * Design Style · 风格 007 · 极简主义 Minimalism —— 15 秒短片（1920×1080 · 60fps · 120 BPM）
 *
 * 不讲课，只做一件事：删。全片只有一个主角——一个橙色的点（全片唯一的彩色），
 * 它在每一幕里都是“最要紧的那一处”；每一幕最后剩下的那个形状，直接变成下一幕的起点（“减法接力”）。
 *   0.0–0.5s   噪音    150 个多余的东西（促销字、徽章、星星……前六期的全部字体）被删到只剩一个点
 *   0.5–2.0s   标题    一根发丝线从点向两边画出去；MINIMALISM / 极简主义 / Less is more.
 *   2.0–4.0s   负空间  线收短成台基，长出密斯的巴塞罗那德国馆（1929）平面；点走进去；平面立成轴测
 *   4.0–6.0s   删减    屋顶板转正成一台收音机——48 个按键旋钮贴纸，一个十六分音符删一个，删到 1 个
 *   6.0–8.0s   功能    剩下的每个形状都有理由（孔 / 圆 / 橙）；转一下旋钮，开机，孔跟着鼓点亮（拉姆斯）
 *   8.0–10.0s  重复    机身变成一个盒子 → 十个（贾德）；盒子跟着配乐一个一个亮，像音序器
 *  10.0–12.0s  今天    剩下的一个盒子变成手机：一个屏幕只做一件事；开关的圆点就是那个点
 *  12.0–13.0s  回顾    一条线上的四个年代，再一个个删掉
 *  13.0–15s   片尾    回到开场：一个点，一根线；少即是多。@guanmo_ai
 * 各幕见同目录 opening / space / radio / judd / today / finale，时间轴见 ../process/timeline.json
 */
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {E, tween} from '../../../src/lib/anim';
import {Grain} from '../../../src/lib/Grain';
import {C} from '../tokens';
import {AT, CHAPTERS, DURATION} from './timeline';
import {font} from './ui';
import {Opening} from './opening';
import {Space} from './space';
import {Radio} from './radio';
import {Judd} from './judd';
import {Today} from './today';
import {Finale} from './finale';

export const MINIMALISM_DURATION = DURATION;

let fontsLoaded = false;
const loadFonts = () => {
  if (fontsLoaded) return;
  fontsLoaded = true;
  const F = (family: string, file: string, weight: string, style = 'normal') =>
    loadFont({family, url: staticFile(`fonts/${file}`), weight, style, format: file.endsWith('.otf') ? 'opentype' : 'truetype'});
  F('Inter Display', 'InterDisplay-Thin.ttf', '100');
  F('Inter Display', 'InterDisplay-ExtraLight.ttf', '200');
  F('Inter Display', 'InterDisplay-Light.ttf', '300');
  F('Inter', 'Inter-Light.ttf', '300');
  F('Inter', 'Inter-Regular.ttf', '400');
  F('Inter', 'Inter-Medium.ttf', '500');
  F('Geist Mono', 'GeistMono-Regular.ttf', '400');
  F('Noto Sans SC', 'NotoSansSC-Light.otf', '300');
  F('Noto Sans SC', 'NotoSansSC-Regular.otf', '400');
  F('Noto Sans SC', 'NotoSansSC-Medium.otf', '500');
  F('Noto Sans SC', 'NotoSansSC-Black.otf', '900');
  // 开场的“噪音”：前六期用过的字体
  F('Bangers', 'Bangers-Regular.ttf', '400');
  F('Oswald', 'Oswald.ttf', '200 700');
  F('Fredoka', 'Fredoka.ttf', '300 700');
  F('Unbounded', 'Unbounded.ttf', '200 900');
  F('TeX Gyre Heros', 'TeXGyreHeros-Bold.otf', '700');
  F('Jost', 'Jost.ttf', '100 900');
  F('Instrument Serif', 'InstrumentSerif-Italic.ttf', '400', 'italic');
  F('Silkscreen', 'Silkscreen-Regular.ttf', '400');
};

/** 底部 HUD：左边片名，右边“章节号 / 总数 + 章节名”，中间一根进度发丝线 */
const Hud: React.FC<{f: number}> = ({f}) => {
  const o = tween(f, AT.space, 16) * (1 - tween(f, AT.recap, 12));
  if (o <= 0.001) return null;
  let k = 0;
  CHAPTERS.forEach(([, , at], j) => {
    if (f >= at) k = j;
  });
  const p = tween(f, CHAPTERS[k][2], 16, 0, 1, E.out);
  const prog = (f - AT.space) / (AT.recap - AT.space);
  return (
    <div style={{position: 'absolute', left: 120, right: 120, top: 990, height: 40, opacity: o}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 1, background: C.hair}} />
      <div style={{position: 'absolute', left: 0, top: 0, height: 1, width: `${Math.min(1, Math.max(0, prog)) * 100}%`, background: C.ink, opacity: 0.6}} />
      <div style={{position: 'absolute', left: 0, top: 18, display: 'flex', alignItems: 'baseline'}}>
        <span style={{...font('t400', 17, 0.02), color: C.ink}}>Minimalism</span>
        <span style={{...font('sc300', 16, 0.12), color: C.grey, marginLeft: 12}}>极简主义</span>
      </div>
      <div style={{position: 'absolute', right: 0, top: 18, display: 'flex', alignItems: 'baseline', opacity: 0.2 + 0.8 * p, transform: `translateY(${(1 - p) * 10}px)`}}>
        <span style={{...font('mono', 15, 0.12), color: C.greyDk, marginRight: 16}}>{`0${k + 1} / 0${CHAPTERS.length}`}</span>
        <span style={{...font('sc400', 17, 0.08), color: C.ink, marginRight: 12}}>{CHAPTERS[k][0]}</span>
        <span style={{...font('t300', 15, 0.02), color: C.grey}}>{CHAPTERS[k][1]}</span>
      </div>
    </div>
  );
};

/** 画面本身（运动模糊会把它在一帧之内渲染好几次） */
const Stage: React.FC = () => {
  const f = useCurrentFrame();
  const on = (a: number, b: number) => f >= a && f < b;
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 80% at 50% 46%, ${C.paperHi} 0%, ${C.paper} 62%, #E8E4DD 100%)`, overflow: 'hidden'}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        {on(0, 124) && <Opening f={f} />}
        {on(104, 242) && <Space f={f} />}
        {on(224, 482) && <Radio f={f} />}
        {on(480, 602) && <Judd f={f} />}
        {on(600, 706) && <Today f={f} />}
        {on(704, 900) && <Finale f={f} />}
      </svg>
      <Hud f={f} />
    </AbsoluteFill>
  );
};

export const Minimalism: React.FC<{music?: boolean; blur?: number}> = ({music = true, blur = 6}) => {
  loadFonts();
  return (
    <AbsoluteFill style={{background: C.paper}}>
      {blur > 1 ? (
        <CameraMotionBlur shutterAngle={180} samples={blur}>
          <Stage />
        </CameraMotionBlur>
      ) : (
        <Stage />
      )}
      <Grain opacity={0.035} />
      {music && <Audio src={staticFile('007-minimalism/music.wav')} />}
    </AbsoluteFill>
  );
};
