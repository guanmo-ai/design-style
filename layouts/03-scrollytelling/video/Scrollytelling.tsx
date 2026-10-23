/**
 * Design Style · 布局 03 · Scrollytelling 滚动叙事 —— 15 秒短片（1920×1080 · 60fps · 120 BPM）· v3
 *
 * 全片就是“一次滚动”：整支片子是一张 17280px 高的网页，每一帧只有一个变量 scrollY = S(f)。
 *   0.0–1.5s   开场       3D 手机从暗处转过来，屏幕在拍点上亮起，身后升起 Scrollytelling
 *   1.5–3.5s   01 定义    手机钉在右边；四行字滚过触发线、逐字点亮，每过一行手机变一步
 *   3.5–5.75s  02 结构    页面倾斜成 X 光：很高的 section + 抬起来的 sticky 舞台 + 触发线；倒着滚一遍
 *   5.75–7.0s  03 2012    Snow Fall：雪山铺满，卡片从上面滚过（覆盖式）
 *   7.0–8.5s   04 数据    2014 Bostock → 2017 Scrollama → 2018 sticky：圆点随步骤变形（并排式）
 *   8.5–10s    05 苹果    逐帧：滚到哪，手机转到哪
 *   9.9–11.2s  06 四种排法 匀速慢滚，四块面板依次点亮（每块注明例子）
 *   11.2–14.1s 07 五条规则 钉住的清单：匀速滚（约 8px/帧），五条依次逐字点亮
 *   14.1–15s   片尾       滑到底，橡皮筋回弹
 * 滚动曲线与页面结构见 page.ts
 */
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {Grain} from '../../../src/lib/Grain';
import {MAX_S, PAGE_H, SECS, SecId, VH, W, c01, cam, camCss, S, speed, xrayMix} from './page';
import {SecAB, XrayOverlay, XrayPlane} from './ab';
import {SecC, SecD, SecE} from './story';
import {SecG, SecH, SecI, FinaleOverlay} from './finale';

export const SCROLLY_DURATION = 900;

let fontsLoaded = false;
const loadFonts = () => {
  if (fontsLoaded) return;
  fontsLoaded = true;
  const F = (family: string, file: string, weight: string, style = 'normal') =>
    loadFont({family, url: staticFile(`fonts/${file}`), weight, style, format: file.endsWith('.otf') ? 'opentype' : 'truetype'});
  F('Inter Display', 'InterDisplay-Medium.ttf', '500');
  F('Inter Display', 'InterDisplay-SemiBold.ttf', '600');
  F('Inter Display', 'InterDisplay-Bold.ttf', '700');
  F('Inter', 'Inter-Regular.ttf', '400');
  F('Inter', 'Inter-Medium.ttf', '500');
  F('Inter', 'Inter-SemiBold.ttf', '600');
  F('Geist Mono', 'GeistMono-Regular.ttf', '400');
  F('Geist Mono', 'GeistMono-Medium.ttf', '500');
  F('Geist Mono', 'GeistMono-SemiBold.ttf', '600');
  F('Instrument Serif', 'InstrumentSerif-Regular.ttf', '400');
  F('Instrument Serif', 'InstrumentSerif-Italic.ttf', '400', 'italic');
  F('Noto Sans SC', 'NotoSansSC-Regular.otf', '400');
  F('Noto Sans SC', 'NotoSansSC-Medium.otf', '500');
  F('Noto Sans SC', 'NotoSansSC-Bold.otf', '700');
  F('Noto Sans SC', 'NotoSansSC-Black.otf', '900');
};

type SecProps = {s: number; f: number; m: number};
const SEC_C: Record<SecId, React.FC<SecProps>> = {AB: SecAB, C: SecC, D: SecD, E: SecE, G: SecG, H: SecH, I: SecI};

/** 右边的滚动条（macOS 覆盖式）：长度 = 一屏 / 整页，动起来时变粗变亮 */
const Scrollbar: React.FC<{s: number; v: number; m: number}> = ({s, v, m}) => {
  const track = VH - 16;
  const len = Math.max(64, (track * VH) / PAGE_H);
  const over = s - MAX_S; // 橡皮筋：超出底部时滑块被压扁
  const p = c01(s / MAX_S);
  const h = len - Math.max(0, over) * 0.5;
  const top = 8 + (track - len) * p + (len - h);
  const act = c01(v / 8);
  const w = 6 + 3 * act;
  return (
    <div
      style={{
        position: 'absolute',
        right: 6,
        top,
        width: w,
        height: h,
        borderRadius: w / 2,
        background: `rgba(245,245,247,${0.22 + 0.5 * act})`,
        opacity: 1 - 0.7 * m,
      }}
    />
  );
};

export const Scrollytelling: React.FC<{music?: boolean}> = ({music = true}) => {
  React.useState(loadFonts);
  const f = useCurrentFrame();
  const s = S(f);
  const c = cam(f);
  const m = xrayMix(f);
  const v = speed(f);
  // 竖向运动模糊：只按滚动速度来（X 光视角里关掉）
  const blur = m > 0.01 ? 0 : Math.min(10, Math.max(0, (v - 16) * 0.075));
  // 这一帧能看见的 section（X 光视角时看得更多）
  const y0 = s - (m > 0 ? 3000 : 40);
  const y1 = s + VH + (m > 0 ? 3400 : 40);
  const vis = SECS.filter((x) => x.top < y1 && x.top + x.h > y0);
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id="vblur" x="0" y="-5%" width="100%" height="110%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={`0 ${blur.toFixed(2)}`} />
          </filter>
        </defs>
      </svg>
      <AbsoluteFill style={{filter: blur > 0.5 ? 'url(#vblur)' : undefined}}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: W,
            height: PAGE_H,
            transformOrigin: '0 0',
            transformStyle: 'preserve-3d',
            transform: m > 0.0005 ? camCss(c) : `translateY(${-s}px)`,
          }}
        >
          {vis.map((x) => {
            const Comp = SEC_C[x.id];
            return <Comp key={x.id} s={s} f={f} m={m} />;
          })}
          <XrayPlane s={s} m={m} />
        </div>
      </AbsoluteFill>
      <XrayOverlay f={f} s={s} c={c} m={m} />
      <FinaleOverlay f={f} s={s} />
      {/* 暗角 */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 70% at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none'}} />
      <Scrollbar s={s} v={v} m={m} />
      <Grain opacity={0.025} />
      {music && <Audio src={staticFile('03-scrollytelling/music.wav')} />}
    </AbsoluteFill>
  );
};
