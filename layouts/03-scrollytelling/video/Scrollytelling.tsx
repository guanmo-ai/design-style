/**
 * Design Style · 布局 03 · Scrollytelling 滚动叙事 —— 15 秒短片（1920×1080 · 60fps · 120 BPM）
 *
 * 全片就是“一次滚动”：整支片子是一张 21060px 高的网页，每一帧只有一个变量 scrollY = S(f)。
 *   0.0–1.5s   开场       设备转过来 → 立起来 → 拆开（三下滑动）
 *   1.5–3.5s   01 定义    舞台挪到右栏，三个步骤从左边滚过、依次过线
 *   3.5–5.5s   02 结构    镜头拉远：一段 400vh 的 section + 钉住的舞台 + 触发线；倒着滚一遍
 *   5.5–7.0s   03 2012    Snow Fall：覆盖式
 *   7.0–8.5s   04 数据    Bostock《How To Scroll》→ Scrollama → position: sticky：并排式
 *   8.5–10s    05 苹果    逐帧：滚到哪一帧，画哪一帧
 *   10–10.8s   06 CSS     animation-timeline: scroll() / view()
 *   10.8–12s   07 四种排法
 *   12–14s     08 五条规则（规则本身就是步骤；规则 04 倒着滚一下）
 *   14–15s     片尾       滑到底，橡皮筋回弹
 * 滚动曲线与页面结构见 page.ts
 */
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {Grain} from '../../../src/lib/Grain';
import {C, FONT} from '../tokens';
import {MAX_S, PAGE_H, SECS, SecId, VH, W, c01, cam, chapterAt, S, speed, xrayMix} from './page';
import {SecAB, XrayOverlay} from './intro';
import {SecC, SecD, SecE, SecF} from './history';
import {SecG, SecH, SecI} from './outro';

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
  F('Instrument Serif', 'InstrumentSerif-Regular.ttf', '400');
  F('Instrument Serif', 'InstrumentSerif-Italic.ttf', '400', 'italic');
  F('Noto Sans SC', 'NotoSansSC-Regular.otf', '400');
  F('Noto Sans SC', 'NotoSansSC-Medium.otf', '500');
  F('Noto Sans SC', 'NotoSansSC-Bold.otf', '700');
  F('Noto Sans SC', 'NotoSansSC-Black.otf', '900');
};

const SEC_C: Record<SecId, React.FC<{s: number; f: number}>> = {AB: SecAB, C: SecC, D: SecD, E: SecE, F: SecF, G: SecG, H: SecH, I: SecI};

const darkAt = (y: number) => (SECS.find((x) => y >= x.top && y < x.top + x.h) ?? SECS[SECS.length - 1]).dark;

/** 右边的滚动条：长度 = 一屏 / 整页，动起来时变粗变亮 */
const Scrollbar: React.FC<{s: number; v: number; m: number}> = ({s, v, m}) => {
  const track = VH - 16;
  const len = Math.max(64, (track * VH) / PAGE_H);
  const over = s - MAX_S; // 橡皮筋：超出底部时滑块被压扁
  const p = c01(s / MAX_S);
  const h = len - Math.max(0, over) * 0.5;
  const top = 8 + (track - len) * p + (len - h);
  const act = c01(v / 8);
  const dark = darkAt(s + 40);
  const w = 7 + 4 * act;
  return (
    <div
      style={{
        position: 'absolute',
        right: 5,
        top,
        width: w,
        height: h,
        borderRadius: w / 2,
        background: dark ? `rgba(245,245,247,${0.4 + 0.45 * act})` : `rgba(29,29,31,${0.35 + 0.4 * act})`,
        opacity: 1 - 0.6 * m,
      }}
    />
  );
};

const Hud: React.FC<{f: number; s: number}> = ({f, s}) => {
  const ch = chapterAt(f);
  const dark = darkAt(s + VH - 30);
  const col = dark ? C.t2 : C.ink2;
  const o = c01(f / 12) * (1 - c01((f - 838) / 12));
  return (
    <div style={{position: 'absolute', left: 64, right: 64, bottom: 30, display: 'flex', justifyContent: 'space-between', opacity: o}}>
      <span style={{fontFamily: FONT.mono, fontSize: 19, color: col, letterSpacing: 1}}>Scrollytelling · 滚动叙事</span>
      <span style={{fontFamily: FONT.mono, fontSize: 19, color: col, letterSpacing: 1}}>
        {ch} <span style={{opacity: 0.6}}>· scrollY {String(Math.round(Math.max(0, s))).padStart(5, '0')}</span>
      </span>
    </div>
  );
};

export const Scrollytelling: React.FC<{music?: boolean}> = ({music = true}) => {
  React.useState(loadFonts);
  const f = useCurrentFrame();
  const s = S(f);
  const c = cam(f);
  const m = xrayMix(f);
  const v = speed(f);
  // 竖向运动模糊：只按滚动速度来（镜头拉远时关掉）
  const blur = m > 0.01 ? 0 : Math.min(9, Math.max(0, (v - 14) * 0.07));
  const y0 = c.py - c.qy / c.k;
  const y1 = c.py + (VH - c.qy) / c.k;
  const vis = SECS.filter((x) => x.top < y1 + 20 && x.top + x.h > y0 - 20);
  return (
    <AbsoluteFill style={{background: '#101013', overflow: 'hidden'}}>
      {m > 0 && (
        <AbsoluteFill
          style={{
            opacity: m,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.09) 1.4px, rgba(0,0,0,0) 1.6px)',
            backgroundSize: '28px 28px',
          }}
        />
      )}
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id="vblur" x="0" y="-5%" width="100%" height="110%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={`0 ${blur.toFixed(2)}`} />
          </filter>
        </defs>
      </svg>
      <AbsoluteFill style={{filter: blur > 0.5 ? 'url(#vblur)' : undefined}}>
        <AbsoluteFill style={{overflow: 'hidden'}}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: W,
              height: PAGE_H,
              transformOrigin: '0 0',
              transform: `translate(${c.qx - c.px * c.k}px, ${c.qy - c.py * c.k}px) scale(${c.k})`,
            }}
          >
            {vis.map((x) => {
              const Comp = SEC_C[x.id];
              return <Comp key={x.id} s={s} f={f} />;
            })}
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
      {m > 0 && <XrayOverlay f={f} s={s} c={c} m={m} />}
      <Hud f={f} s={s} />
      <Scrollbar s={s} v={v} m={m} />
      <Grain opacity={0.03} />
      {music && <Audio src={staticFile('03-scrollytelling/music.wav')} />}
    </AbsoluteFill>
  );
};
