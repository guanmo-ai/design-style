/**
 * 05:30–09:00 比例：同一张落地页，50:50 → 62:38 → 70:30。
 * 左半是一幅会“长出新东西”的海报，右半是会重新折行的文字；两边宽度实时标注，底部的 CSS 跟着变。
 * 用的是真实的盒子和真实的折行（不是图片切换）：中线一动，所有东西都是现算出来的。
 */
import React from 'react';
import {C} from '../tokens';
import {AT} from './timeline';
import {xAt} from './tracks';
import {BELT, ChProps, Cursor, EXPO, Page, Rise, RuleTag, clamp, disp, lerp, mono, popEase, rgba, sc, tween} from './ui';
import type {SeamStyle} from './SplitScreen';

export const ratioSeam = (_f: number): SeamStyle => ({line: null, pillBg: C.ink, pillFg: C.paper});

const STATES = [
  {fr: '1fr 1fr', name: '对等', use: '对比 · 登录页 · 双语页'},
  {fr: '1.618fr 1fr', name: '主次', use: '产品首屏 · 品牌页 · 作品集'},
  {fr: '7fr 3fr', name: '内容 + 侧栏', use: '后台 · 文档 · 阅读器'},
];
// 状态切换的局部帧（与 tracks.ts 的 X 轨道同步）
export const T1 = 54;
export const T2 = 110;
const sIndex = (f: number) => BELT(clamp((f - (T1 + 4)) / 18)) + BELT(clamp((f - (T2 + 4)) / 18));

/** 竖向滚一格：多个条目叠在一起，index 是小数 */
const Roll: React.FC<{index: number; h: number; children: React.ReactNode[]; style?: React.CSSProperties}> = ({index, h, children, style}) => (
  <div style={{height: h, overflow: 'hidden', ...style}}>
    <div style={{transform: `translateY(${-index * h}px)`}}>
      {children.map((c, i) => (
        <div key={i} style={{height: h}}>
          {c}
        </div>
      ))}
    </div>
  </div>
);

/** 水平标注线：两端竖线 + 居中读数 */
const Dim: React.FC<{x0: number; x1: number; y: number; color: string; bg: string; label: string; k: number}> = ({x0, x1, y, color, bg, label, k}) => {
  const w = (x1 - x0) * k;
  return (
    <div style={{position: 'absolute', left: x0, top: y - 14, width: w, height: 28, overflow: 'visible'}}>
      <div style={{position: 'absolute', left: 0, top: 13, width: '100%', height: 2, background: color}} />
      <div style={{position: 'absolute', left: 0, top: 0, width: 2, height: 28, background: color}} />
      <div style={{position: 'absolute', right: 0, top: 0, width: 2, height: 28, background: color}} />
      <div style={{position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', padding: '0 14px', background: bg, color, height: 28, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', opacity: k > 0.6 ? 1 : 0, ...mono(22, 700, 0.04)}}>{label}</div>
    </div>
  );
};

/** 左半的海报：从左边起算的固定坐标——中线往右挪，右边的东西才“长出来” */
const Art: React.FC<{X: number}> = ({X}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: X, height: 800, overflow: 'hidden', background: C.paper}}>
    {/* 方格底纹 */}
    {Array.from({length: 16}).map((_, i) => (
      <div key={i} style={{position: 'absolute', left: i * 90, top: 0, width: 2, height: 800, background: rgba(C.ink, 0.07)}} />
    ))}
    {Array.from({length: 9}).map((_, i) => (
      <div key={i} style={{position: 'absolute', left: 0, top: i * 90, width: 2000, height: 2, background: rgba(C.ink, 0.07)}} />
    ))}
    <div style={{position: 'absolute', left: 140, top: 250, width: 640, height: 640, borderRadius: '50%', background: C.blue}} />
    <div style={{position: 'absolute', left: 520, top: 470, width: 760, height: 760, borderRadius: '50%', background: C.ink}} />
    <div style={{position: 'absolute', left: 240, top: 350, width: 440, height: 440, borderRadius: '50%', border: `3px solid ${C.paper}`}} />
    {[
      [1040, 420, 96],
      [1166, 250, 96],
      [1292, 360, 96],
    ].map(([x, y, w], i) => (
      <div key={i} style={{position: 'absolute', left: x, top: y, width: w, height: 800 - y, background: i === 1 ? C.blue : C.ink}} />
    ))}
    <div style={{position: 'absolute', left: 96, top: 196, color: C.ink, ...mono(22, 700, 0.14)}}>{'FIG. 01 — 圆、圆、三根柱子'}</div>
  </div>
);

export const Ratio: React.FC<ChProps> = (p) => {
  const {f, side, X} = p;
  const L = side === 'L';
  const idx = sIndex(f);
  const lw = X;
  const rw = 1920 - X;
  const pad = 72;
  const textW = rw - pad * 2;
  // 光标：中线在动的时候按住把手
  const dragging = Math.abs(xAt(AT.ratio + f) - xAt(AT.ratio + f - 1)) > 0.05 && f > 30;
  const pop = tween(f, 4, 14, 0, 1, popEase);
  const dimK = tween(f, 2, 22, 0, 1, EXPO);
  const chipK = tween(f, 6, 14, 0, 1, EXPO);
  const ringT = (at: number) => tween(f, at, 14);
  return (
    <Page p={p} bg={L ? C.paper : C.blue}>
      {L && (
        <>
          <Art X={lw} />
          <div style={{position: 'absolute', left: 0, top: 800, width: lw, height: 280, background: C.paper}} />
          <div style={{position: 'absolute', left: 96, top: 62}}>
            <RuleTag f={f} n={2} title="比例要有意思" fg={C.ink} sub={C.grey} at={-6} />
          </div>
          <Dim x0={48} x1={X - 48} y={150} color={C.ink} bg={C.paper} label={`${Math.round(lw)} px`} k={dimK} />
          {/* 用途：随比例滚动 */}
          <div style={{position: 'absolute', left: 96, top: 826}}>
            <Roll index={idx} h={150} style={{width: 900}}>
              {STATES.map((s, i) => (
                <div key={i}>
                  <div style={{...sc(76, 900, -0.01), color: C.ink, lineHeight: 1.05}}>{s.name}</div>
                  <div style={{...sc(34, 500), color: C.grey, marginTop: 6}}>{s.use}</div>
                </div>
              ))}
            </Roll>
          </div>
        </>
      )}
      {!L && (
        <>
          <Dim x0={X + 48} x1={1872} y={150} color={C.paper} bg={C.blue} label={`${Math.round(rw)} px`} k={dimK} />
          <div style={{position: 'absolute', left: X + pad, top: 236, width: textW, color: C.paper}}>
            <Rise f={f} at={-4} d={20} pad={8}>
              <div style={{...mono(24, 700, 0.14), color: rgba(C.paper, 0.78)}}>{'NEW · SPLIT / 2026'}</div>
            </Rise>
            <Rise f={f} at={0} d={24} pad={20} style={{marginTop: 26}}>
              <div style={{...disp(100, 100, -0.035), lineHeight: 0.98}}>{'Less, but better.'}</div>
            </Rise>
            <Rise f={f} at={6} d={24} pad={10} style={{marginTop: 36}}>
              <div style={{...sc(34, 500), lineHeight: 1.5, color: rgba(C.paper, 0.9)}}>{'一半讲故事，一半给证据。中线在哪里，重点就在哪里。'}</div>
            </Rise>
            <Rise f={f} at={12} d={22} pad={10} style={{marginTop: 44}}>
              <div style={{display: 'inline-block', padding: '20px 34px', background: C.paper, color: C.ink, ...sc(30, 900)}}>{'了解更多 →'}</div>
            </Rise>
          </div>
        </>
      )}

      {/* 把手 + 光标：中线上最醒目的一个点 */}
      <div style={{position: 'absolute', left: X - 34, top: 540 - 34, width: 68, height: 68, borderRadius: '50%', background: C.paper, border: `5px solid ${C.ink}`, transform: `scale(${pop * (dragging ? 1.12 : 1)})`, zIndex: 20}}>
        <svg width={58} height={58} viewBox="0 0 58 58" style={{position: 'absolute', left: 0, top: 0}}>
          <path d="M16 29 L26 21 L26 26 L32 26 L32 21 L42 29 L32 37 L32 32 L26 32 L26 37 Z" fill={C.ink} />
        </svg>
      </div>
      {pop > 0.5 && <Cursor x={X + 14} y={560} press={dragging ? 1 : 0} ring={Math.max(ringT(T1 - 6) * (f < T1 + 20 ? 1 : 0), ringT(T2 - 6) * (f >= T2 - 6 && f < T2 + 20 ? 1 : 0))} ringColor={C.ink} fill={C.paper} stroke={C.ink} />}

      {/* 代码：跨过中线的一块墨色标签，值随比例滚动 */}
      <div style={{position: 'absolute', left: X - 380, top: 962, width: 760, height: 78, background: C.ink, color: C.paper, transform: `scaleX(${chipK})`, overflow: 'hidden', zIndex: 15}}>
        <div style={{position: 'absolute', left: 28, top: 0, height: 78, display: 'flex', alignItems: 'center', ...mono(26, 400)}}>
          <span style={{color: C.peri}}>{'grid-template-columns: '}</span>
        </div>
        <div style={{position: 'absolute', left: 28 + 23 * 0.6 * 26 + 6, top: 0}}>
          <Roll index={idx} h={78}>
            {STATES.map((s, i) => (
              <div key={i} style={{height: 78, display: 'flex', alignItems: 'center', ...mono(26, 700)}}>{`${s.fr};`}</div>
            ))}
          </Roll>
        </div>
      </div>
    </Page>
  );
};
