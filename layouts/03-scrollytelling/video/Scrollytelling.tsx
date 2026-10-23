/**
 * Design Style · 布局 03 · Scrollytelling 滚动叙事 —— 15 秒短片（1920×1080 · 60fps · 120 BPM）· v4
 *
 * 主角是一张真网页：../demo/index.html。视频里的浏览器 / 手机就是一个 iframe，每帧滚到 Y(f) 再让网页自己画。
 *   0.0–1.5s   开场     浏览器窗口从远处斜着飞进来，第 2 拍落定（左栏：滚动叙事 Scrollytelling）
 *   1.5–5.0s   ① 并排   四次滑动，四步依次越过触发线；舞台钉在左边不动，城市里的点一步一变
 *   5.0–7.5s   X 光     窗口斜过来，舞台层抬起（玻璃）、文字层留在下面、触发线变成光幕；倒着滚回去再滚回来
 *   7.5–9.25s  ② 覆盖   雪山铺满，三张卡片从上面滚过，天色一步一变
 *   9.25–11.5s ③ 逐帧   匀速滚完 2880px，手机转一圈、拆开再合上（72 张图）；镜头慢慢推近
 *   11.5–13.5s 手机     滚回 ① 第二步，窗口从 1440 拉窄到 390、变成手机；过 768px 那一拍，并排自己改成覆盖
 *   13.5–15s   片尾     电脑和手机并排，同一份网页一起滑到最后一步：风格塑造视觉，布局组织信息。
 * 时间线、滚动、镜头见 page.ts
 */
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {FONT} from '../tokens';
import {Device, Scrollbar} from './Device';
import {Web} from './Web';
import {Captions} from './captions';
import {
  inWhip, A, CROSS, DESK, DURATION, MORPH, Pose, STAGE_Z, boxOf, c01, deskPose2, deskScroll2, eo, lerp, mainPose, mainScroll, morphQ, project, speed, tf, xrayMix,
} from './page';

export const SCROLLY_DURATION = DURATION;

let fontsLoaded = false;
const loadFonts = () => {
  if (fontsLoaded) return;
  fontsLoaded = true;
  const F = (family: string, file: string, weight: string, style = 'normal') =>
    loadFont({family, url: staticFile(`fonts/${file}`), weight, style, format: file.endsWith('.otf') ? 'opentype' : 'truetype'});
  F('Inter Display', 'InterDisplay-Bold.ttf', '700');
  F('Inter', 'Inter-Regular.ttf', '400');
  F('Inter', 'Inter-Medium.ttf', '500');
  F('Geist Mono', 'GeistMono-Regular.ttf', '400');
  F('Geist Mono', 'GeistMono-Medium.ttf', '500');
  F('Geist Mono', 'GeistMono-SemiBold.ttf', '600');
  F('Instrument Serif', 'InstrumentSerif-Italic.ttf', '400', 'italic');
  F('Noto Sans SC', 'NotoSansSC-Regular.otf', '400');
  F('Noto Sans SC', 'NotoSansSC-Medium.otf', '500');
  F('Noto Sans SC', 'NotoSansSC-Bold.otf', '700');
  F('Noto Sans SC', 'NotoSansSC-Black.otf', '900');
};

const PINK = '#FF5C9A';
const BLUE = '#2997FF';
const mono = (size: number, color: string, w = 500): React.CSSProperties => ({font: `${w} ${size}px ${FONT.mono}`, color, letterSpacing: '0.06em', whiteSpace: 'nowrap'});

/** 触发线（视口坐标）：越过它的那一帧闪一下 */
const TriggerLine: React.FC<{f: number; vw: number; vh: number; op: number; left: number}> = ({f, vw, vh, op, left}) => {
  if (op < 0.01) return null;
  let pulse = 0;
  for (const c of CROSS) pulse = Math.max(pulse, f >= c.f ? Math.exp(-(f - c.f) / 7) : 0);
  const y = vh / 2;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: vw, height: vh, opacity: op, transform: 'translateZ(2px)', pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left,
          top: y - 1 - 2 * pulse,
          width: vw - left,
          height: 2 + 4 * pulse,
          background: `repeating-linear-gradient(90deg, ${PINK} 0 14px, transparent 14px 22px)`,
          boxShadow: `0 0 ${10 + 30 * pulse}px rgba(255,92,154,${0.35 + 0.6 * pulse})`,
        }}
      />
      <div style={{position: 'absolute', left: -9, top: y - 7, width: 14, height: 14, borderRadius: 7, background: PINK, boxShadow: `0 0 ${12 + 24 * pulse}px ${PINK}`}} />
      <div style={{position: 'absolute', left, top: y + 14, ...mono(21, PINK), transform: `scale(${1 + 0.06 * pulse})`, transformOrigin: '0 50%'}}>触发线 · 视口 50%</div>
    </div>
  );
};

/** 窗口下面的尺寸线：舞台 7fr / 文字 5fr（视口坐标） */
const Dim: React.FC<{x0: number; x1: number; y: number; color: string; text: string; op: number}> = ({x0, x1, y, color, text, op}) =>
  op < 0.01 ? null : (
    <div style={{position: 'absolute', left: x0, top: y, width: x1 - x0, height: 40, opacity: op}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 9, height: 2, background: color}} />
      <div style={{position: 'absolute', left: 0, top: 0, width: 2, height: 20, background: color}} />
      <div style={{position: 'absolute', right: 0, top: 0, width: 2, height: 20, background: color}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 22, textAlign: 'center', ...mono(19, color)}}>{text}</div>
    </div>
  );

/** 屏幕坐标的小标签（X 光里用：不随 3D 变形，保持清楚） */
const Tag: React.FC<{x: number; y: number; color: string; children: React.ReactNode; op: number; align?: 'left' | 'right'}> = ({x, y, color, children, op, align = 'left'}) =>
  op < 0.01 ? null : (
    <div
      style={{
        position: 'absolute',
        left: align === 'left' ? x : undefined,
        right: align === 'right' ? 1920 - x : undefined,
        top: y,
        opacity: op,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexDirection: align === 'left' ? 'row' : 'row-reverse',
        ...mono(17, '#F5F5F7'),
      }}
    >
      <span style={{width: 10, height: 10, borderRadius: 2, background: color, boxShadow: `0 0 12px ${color}`}} />
      <span style={{padding: '6px 10px', borderRadius: 6, background: 'rgba(10,10,12,0.78)', border: `1px solid ${color}55`}}>{children}</span>
    </div>
  );

/** 背景：设备身后一团随段落换色的光 */
const BG_KEYS: [number, string][] = [
  [0, '139,61,255'],
  [300, '41,151,255'],
  [412, '120,170,255'],
  [514, '255,120,140'],
  [538, '255,46,126'],
  [700, '139,61,255'],
  [900, '139,61,255'],
];
const bgColor = (f: number) => {
  let i = 0;
  while (i < BG_KEYS.length - 2 && f >= BG_KEYS[i + 1][0]) i++;
  const [fa, ca] = BG_KEYS[i];
  const [fb, cb] = BG_KEYS[i + 1];
  const t = eo((f - fa) / Math.min(40, fb - fa));
  const a = ca.split(',').map(Number);
  const b = cb.split(',').map(Number);
  return a.map((v, k) => Math.round(lerp(v, b[k], t))).join(',');
};

export const Scrollytelling: React.FC<{music?: boolean}> = ({music = true}) => {
  React.useState(loadFonts);
  const f = useCurrentFrame();
  const pose: Pose = mainPose(f);
  const {y, vw, vh} = mainScroll(f);
  const q = morphQ(f);
  const m = xrayMix(f);
  const v = speed(f);
  const box = boxOf(vw, vh, q);
  const P = (x: number, yy: number, z = 0) => project(pose, box.bw, box.bh, x + box.ox, yy + box.oy, z);
  // 竖向运动模糊：只给跨段的“快甩”（整页都在动）；章内滑动时舞台是钉住的，糊了就不对
  const blur = m > 0.001 || !inWhip(f) ? 0 : Math.min(26, Math.max(0, (v * pose.k - 60) * 0.16));
  const max = 12548;
  // 各段叠加物的透明度
  const sideOp = tf(f, 100, 20) * (1 - tf(f, 290, 12));
  const trigOp = Math.max(sideOp, tf(f, 426, 16) * (1 - tf(f, 521, 8)) * 0.75) * (1 - m);
  const snowOp = tf(f, 426, 16) * (1 - tf(f, 521, 8));
  const phoneOp = tf(f, 712, 20) * (1 - tf(f, 806, 12));
  const r0 = lerp(11, 46, q);
  const r1 = 46 * q;
  const glow = bgColor(f);
  const c = P(vw / 2, vh / 2);
  // 片尾第二台
  const p2 = deskPose2(f);
  const show2 = f >= 814;
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 980px 700px at ${c.x}px ${c.y + 40}px, rgba(${glow},0.20), rgba(${glow},0.05) 45%, rgba(0,0,0,0) 72%)`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 700px 600px at 240px 380px, rgba(255,255,255,0.035), rgba(0,0,0,0) 70%)'}} />
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id="vblur" x="0" y="-5%" width="100%" height="110%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={`0 ${blur.toFixed(2)}`} />
          </filter>
        </defs>
      </svg>

      {/* 片尾第二台：电脑（同一份网页，停在并排） */}
      <Device pose={p2} vw={DESK.vw} vh={DESK.vh} q={0}>
        <Web name="desk2" w={DESK.vw} h={DESK.vh} y={deskScroll2(f)} active={show2} style={{borderRadius: '0 0 11px 11px'}} />
      </Device>

      {/* 主设备 */}
      <Device pose={pose} vw={vw} vh={vh} q={q} bare={m}>
        {/* X 光：文字层（整段 section，留在原处，跟着滚动走） */}
        <div style={{position: 'absolute', left: 0, top: A.cityTop - y, width: DESK.vw, height: A.cityH, transformStyle: 'preserve-3d', visibility: m > 0.002 ? 'visible' : 'hidden'}}>
          <Web
            name="steps"
            w={DESK.vw}
            h={A.cityH}
            y={y}
            query="&layer=steps&vh=900"
            realScroll={A.cityTop}
            active={m > 0.002}
            style={{
              opacity: m,
              WebkitMaskImage: `linear-gradient(180deg, rgba(0,0,0,.42) ${y - A.cityTop - 1}px, #000 ${y - A.cityTop}px, #000 ${y - A.cityTop + 900}px, rgba(0,0,0,.42) ${y - A.cityTop + 901}px)`,
            }}
          />
          <div style={{position: 'absolute', inset: 0, border: '2px dashed rgba(245,245,247,0.28)', borderRadius: 4, opacity: m}} />
        </div>
        {m > 0.002 && (
          <>
            {/* 视口框（在文字层上） */}
            <div style={{position: 'absolute', left: -3, top: -3, width: vw + 6, height: vh + 6, border: '3px solid rgba(245,245,247,0.85)', borderRadius: 6, opacity: m, transform: 'translateZ(1px)'}} />
            {/* 触发光幕：从文字层立到舞台层 */}
            <div
              style={{
                position: 'absolute',
                left: -160,
                top: vh / 2,
                width: vw + 320,
                height: STAGE_Z * m,
                transformOrigin: '50% 0',
                transform: 'rotateX(90deg)',
                background: 'linear-gradient(180deg, rgba(255,92,154,0.55), rgba(255,92,154,0.10))',
                borderTop: `3px solid ${PINK}`,
                opacity: m,
              }}
            />
          </>
        )}
        {/* 网页本身（X 光里它就是“舞台层”：文字淡掉、底变成玻璃、抬起来） */}
        <Web
          name="main"
          w={vw}
          h={vh}
          y={y}
          vars={{'--steps-op': (1 - m).toFixed(3), '--page-bg': `rgba(0,0,0,${(1 - 0.82 * m).toFixed(3)})`, '--nav-op': (1 - m).toFixed(3)}}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            borderRadius: `${r1}px ${r1}px ${r0}px ${r0}px`,
            transform: m > 0.001 ? `translateZ(${STAGE_Z * m}px)` : undefined,
            background: m > 0.001 ? `rgba(14,22,44,${0.45 * m})` : undefined,
            boxShadow: m > 0.001 ? `0 0 0 ${3 * m}px ${BLUE}, 0 0 ${60 * m}px rgba(41,151,255,${0.45 * m})` : undefined,
            filter: blur > 0.6 ? 'url(#vblur)' : undefined,
          }}
        />
        {m < 0.999 && <Scrollbar vw={vw} vh={vh} y={y} max={f < MORPH.at ? max : 12194} act={c01(v / 10)} />}
        {/* ① 并排：触发线 + 舞台 / 文字两栏的尺寸线 */}
        <TriggerLine f={f} vw={vw} vh={vh} op={trigOp} left={(88 - (pose.cx - (box.bw * pose.k) / 2)) / pose.k} />
        {sideOp > 0.01 && (
          <div style={{position: 'absolute', left: 57.6, top: 0, width: 739.2, height: 900, border: `2px solid rgba(41,151,255,${0.25 + 0.5 * Math.exp(-Math.max(0, f - 104) / 16)})`, borderRadius: 8, opacity: sideOp}} />
        )}
        <Dim x0={57.6} x1={796.8} y={vh + 16} color={BLUE} text="舞台 7fr · sticky 钉住" op={sideOp} />
        <Dim x0={854.4} x1={1382.4} y={vh + 16} color="#F5F5F7" text="文字 5fr · 滚过触发线" op={sideOp} />
        {/* ② 覆盖：舞台铺满 */}
        <Dim x0={0} x1={vw} y={vh + 16} color={BLUE} text="舞台 100% · 铺满整屏，卡片浮在上面" op={snowOp} />
        {/* 手机：宽度读数 */}
        <Dim x0={0} x1={vw} y={vh + 2 * 13 + 10} color={PINK} text={`${vw}px`} op={phoneOp} />
      </Device>

      {/* X 光标签（屏幕坐标） */}
      {m > 0.05 &&
        (() => {
          const op = c01((m - 0.6) / 0.4) * (1 - tf(f, 372, 10));
          const a = P(vw, 0, STAGE_Z);
          const b = P(vw, vh / 2, 0);
          const d = P(vw, vh, 0);
          return (
            <>
              <Tag x={a.x + 18} y={a.y - 20} color={BLUE} op={op}>舞台 · position: sticky · 钉在视口里</Tag>
              <Tag x={b.x + 18} y={b.y - 18} color={PINK} op={op}>触发线 · 视口 50%</Tag>
              <Tag x={d.x + 18} y={d.y - 16} color="#F5F5F7" op={op}>视口 1440 × 900</Tag>
            </>
          );
        })()}

      {/* 片尾：两台设备下面各一行说明 */}
      {f >= 840 &&
        (() => {
          const op = tf(f, 846, 18);
          const b2 = boxOf(DESK.vw, DESK.vh, 0);
          const a = project(p2, b2.bw, b2.bh, b2.bw / 2, b2.bh, 0);
          const b = P(vw / 2, vh + box.bz, 0);
          const st = (x: number, yy: number): React.CSSProperties => ({position: 'absolute', left: x - 200, top: yy + 26 - 10 * (1 - op), width: 400, textAlign: 'center', opacity: op, ...mono(17, '#A1A1A6')});
          return (
            <>
              <div style={st(a.x, a.y)}>电脑 ≥ 768px · 并排</div>
              <div style={st(b.x, b.y)}>手机 &lt; 768px · 覆盖</div>
            </>
          );
        })()}

      <Captions f={f} />

      {/* 暗角 + 颗粒 */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 78% 72% at 50% 50%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.5) 100%)', pointerEvents: 'none'}} />
      {/* v5：去掉胶片颗粒——每帧都变的噪点会吃掉码率，让字发虚 */}
      {music && <Audio src={staticFile('03-scrollytelling/music.wav')} />}
    </AbsoluteFill>
  );
};
