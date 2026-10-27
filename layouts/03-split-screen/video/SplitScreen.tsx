/**
 * Design Style · 布局 03 · Split Screen 分屏布局 —— 20 秒短片（1920×1080 · 60fps · 120 BPM）
 *
 * 全片只有一个主角：中线。画面永远被它切成两半，每一半各自说话；左半向上、右半向下反向滚动，章节就是这样翻页的。
 *   0.0–2.5s    定义    中线画下来；“Split”被拉链拉合；一条中线，两种声音
 *   2.5–5.5s    来历    1927 三联银幕 → 1959 电话 → 2009 Aero Snap → 2015 Split View（左边年份滚轮、右边示意反向滚动）
 *   5.5–9.0s    比例    同一张落地页：50:50 → 62:38 → 70:30，文字重新折行、照片重新裁切；两边宽度实时标注
 *   9.0–11.5s   反差    明 / 暗 → 图 / 文 → 静 / 动：每次从中线向两边撕开，一次只选一对
 *   11.5–14.5s  滚动    左边固定、右边滚；再反向滚动——这支片子的转场就是它
 *   14.5–17.5s  响应式  浏览器从 1440 缩到 390；窄过 768 的一刻，整条中线转 90°，左右变上下
 *   17.5–20.0s  片尾    海报被横着切开，中线转回竖直；五个词乒乓般落到左右两边
 * 每一章的 f 是本章局部帧；时间轴见 timeline.ts，每章在同目录下一个文件里。
 */
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {clamp} from '../../../src/lib/anim';
import {C} from '../tokens';
import {CH, DURATION, POST, PRE} from './timeline';
import {xAt, thetaAt} from './tracks';
import {BELT, ChProps, Side, lerp, loadFonts, mono} from './ui';
import {Intro, introSeam} from './intro';
import {History, historySeam} from './history';
import {Ratio, ratioSeam} from './ratio';
import {Contrast, contrastSeam} from './contrast';
import {Scroll, scrollSeam} from './scroll';
import {Responsive, respSeam} from './responsive';
import {End, endSeam} from './end';

export const SPLIT_DURATION = DURATION;
const W = 1920;
const H = 1080;

export type SeamStyle = {line: string | null; pillBg: string; pillFg: string; pill?: boolean};
const REG: {Comp: React.FC<ChProps>; seam: (f: number) => SeamStyle}[] = [
  {Comp: Intro, seam: introSeam},
  {Comp: History, seam: historySeam},
  {Comp: Ratio, seam: ratioSeam},
  {Comp: Contrast, seam: contrastSeam},
  {Comp: Scroll, seam: scrollSeam},
  {Comp: Responsive, seam: respSeam},
  {Comp: End, seam: endSeam},
];

/** 当前帧该画哪一章、是不是正在换幕 */
const beltAt = (f: number) => {
  for (let k = 1; k < CH.length; k++) {
    const a = CH[k].at - PRE;
    if (f >= a && f < CH[k].at + POST) return {prev: k - 1, next: k, t: (f - a) / (PRE + POST)};
  }
  let cur = 0;
  CH.forEach((c, i) => {
    if (f >= c.at + POST || (i === 0 && f >= 0)) cur = i;
  });
  return {prev: cur, next: -1, t: 0};
};

const B = 6000;
const poly = (cx: number, cy: number, th: number, side: Side) => {
  const n = [Math.cos(th), Math.sin(th)];
  const d = [-Math.sin(th), Math.cos(th)];
  const s = side === 'L' ? -1 : 1;
  const P = (a: number, b: number) => `${(cx + d[0] * a + n[0] * b * s).toFixed(2)}px ${(cy + d[1] * a + n[1] * b * s).toFixed(2)}px`;
  return `polygon(${P(B, 0)}, ${P(-B, 0)}, ${P(-B, B)}, ${P(B, B)})`;
};

const Stage: React.FC = () => {
  const f = useCurrentFrame();
  const X = xAt(f);
  const theta = thetaAt(f);
  const tn = theta / (Math.PI / 2);
  const cx = lerp(X, W / 2, tn);
  const cy = H / 2;
  const belt = beltAt(f);
  // 传送带方向沿着中线：竖线 → 上下，横线 → 左右。换幕发生时 θ 只会是 0 或 π/2
  const thM = thetaAt(belt.next >= 0 ? CH[belt.next].at : f);
  const d: [number, number] = [-Math.sin(thM), Math.cos(thM)];
  const S = thM > 0.78 ? W : H;
  const p = belt.next >= 0 ? BELT(belt.t) : 0;

  const sides: Side[] = ['L', 'R'];
  const ids = belt.next >= 0 ? [belt.prev, belt.next] : [belt.prev];
  const curIdx = belt.next >= 0 && p > 0.5 ? belt.next : belt.prev;
  const seam = REG[curIdx].seam(f - CH[curIdx].at);

  // 中线读数：左半占比
  const pct = lerp(X / W, 0.5, tn) * 100;
  const pillPos = {x: lerp(cx, 150, tn), y: lerp(150, cy, tn)};
  const lineGrow = clamp(f / 22);

  return (
    <AbsoluteFill style={{background: C.ink, overflow: 'hidden'}}>
      {sides.map((side) => {
        const v: [number, number] = side === 'L' ? [-d[0], -d[1]] : [d[0], d[1]];
        return (
          <div key={side} style={{position: 'absolute', inset: 0, clipPath: poly(cx, cy, theta, side)}}>
            {ids.map((i) => {
              const isNext = i === belt.next;
              const off = isNext ? p - 1 : p;
              const enter = isNext ? p : 1;
              const exit = !isNext && belt.next >= 0 ? p : 0;
              const Comp = REG[i].Comp;
              return (
                <div key={i} style={{position: 'absolute', inset: 0, transform: `translate(${v[0] * S * off}px, ${v[1] * S * off}px)`}}>
                  <Comp f={f - CH[i].at} side={side} X={X} theta={theta} enter={enter} exit={exit} dir={v} />
                </div>
              );
            })}
          </div>
        );
      })}
      {/* 中线与读数：不跟着传送带走，是全片唯一不动的东西 */}
      {seam.line && (
        <div style={{position: 'absolute', left: cx - 1.5, top: cy - B / 2, width: 3, height: B, background: seam.line, transform: `rotate(${theta}rad) scaleY(${lineGrow})`, transformOrigin: '50% 50%', clipPath: f < 22 ? `inset(${(0.5 - lineGrow / 2) * 100}% 0 ${(0.5 - lineGrow / 2) * 100}% 0)` : undefined}} />
      )}
      {seam.pill !== false && f > 14 && (
        <div style={{position: 'absolute', left: pillPos.x, top: pillPos.y, transform: `translate(-50%, -50%) scale(${clamp((f - 14) / 8)})`, height: 38, padding: '0 18px', display: 'flex', alignItems: 'center', background: seam.pillBg, color: seam.pillFg, ...mono(20, 700), whiteSpace: 'nowrap'}}>
          {`${pct.toFixed(1)} %`}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const SplitScreen: React.FC<{music?: boolean; blur?: number}> = ({music = true, blur = 10}) => {
  const [ready] = useState(() => delayRender('split-screen-fonts'));
  useEffect(() => {
    loadFonts().then(() => continueRender(ready));
  }, [ready]);
  return (
    <AbsoluteFill style={{background: C.ink}}>
      {blur > 1 ? (
        <CameraMotionBlur shutterAngle={140} samples={blur}>
          <Stage />
        </CameraMotionBlur>
      ) : (
        <Stage />
      )}
      {music && <Audio src={staticFile('03-split-screen/music.wav')} />}
    </AbsoluteFill>
  );
};
