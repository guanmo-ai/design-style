/**
 * 05:30–09:00 比例：同一张落地页，50:50 → 62:38 → 70:30。
 * 左半是包豪斯（圆、方、三角：有的贴左、有的按比例、有的贴着中线），右半是瑞士（Helvetica 大标题 + 红块，真实折行）；
 * 两边宽度实时标注，底部的 CSS 跟着变。
 * 用的是真实的盒子和真实的折行（不是图片切换）：中线一动，所有东西都是现算出来的。
 */
import React from 'react';
import {C} from '../tokens';
import {AT} from './timeline';
import {xAt} from './tracks';
import {BELT, ChProps, Cursor, EXPO, Page, Rise, RuleTag, clamp, lerp, mono, popEase, rgba, sc, tween} from './ui';
import {BH, SW, bauhaus, swiss} from './kit';
import type {SeamStyle} from './SplitScreen';

export const ratioSeam = (_f: number): SeamStyle => ({line: null, pillBg: BH.ink, pillFg: BH.paper});

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

/** 左半：包豪斯的构成。三种定位方式：贴左（圆）、按比例（方块）、贴着中线（三角）——响应式布局的三种“锚” */
const Art: React.FC<{X: number; f: number}> = ({X, f}) => {
  const k = (at: number) => tween(f, at, 22, 0, 1, EXPO);
  const sqX = X * 0.46;
  const triR = X - 70;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: X, height: 800, overflow: 'hidden', background: BH.paper}}>
      {/* 圆：贴左 */}
      <div style={{position: 'absolute', left: 96, top: 250, width: 520, height: 520, borderRadius: '50%', background: BH.red, transform: `scale(${k(-6)}) rotate(${(1 - k(-6)) * -90}deg)`}} />
      {/* 方：按比例（x = 46% 的左半宽度） */}
      <div style={{position: 'absolute', left: sqX, top: 190, width: 330, height: 330, background: BH.blue, transform: `scale(${k(0)}) rotate(${(1 - k(0)) * 90}deg)`}} />
      {/* 黑线与黑圆环 */}
      <div style={{position: 'absolute', left: 96, top: 770, width: X - 96 - 70, height: 14, background: BH.ink, transform: `scaleX(${k(4)})`, transformOrigin: 'left'}} />
      <div style={{position: 'absolute', left: sqX - 60, top: 470, width: 220, height: 220, borderRadius: '50%', border: `10px solid ${BH.ink}`, transform: `scale(${k(8)})`}} />
      {/* 三角：贴着中线（右边缘 = 中线 − 70）；中线往右挪它就跟着往右 */}
      <svg width={420} height={420} viewBox="0 0 420 420" style={{position: 'absolute', left: triR - 420, top: 360, transform: `scale(${k(10)})`, transformOrigin: 'bottom right'}}>
        <polygon points="0,420 420,420 210,40" fill={BH.yellow} stroke={BH.ink} strokeWidth={8} strokeLinejoin="round" />
      </svg>
      <div style={{position: 'absolute', left: 96, top: 196, color: BH.ink, ...bauhaus(22, 700, 0.14)}}>{'FORM FOLLOWS FUNCTION'}</div>
    </div>
  );
};

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
    <Page p={p} bg={L ? BH.paper : SW.paper}>
      {L && (
        <>
          <Art X={lw} f={f} />
          <div style={{position: 'absolute', left: 0, top: 800, width: lw, height: 280, background: BH.paper}} />
          <div style={{position: 'absolute', left: 96, top: 62}}>
            <RuleTag f={f} n={2} title="比例要有意思" fg={BH.ink} sub={BH.gray} at={-6} />
          </div>
          <Dim x0={48} x1={X - 48} y={150} color={BH.ink} bg={BH.yellow} label={`${Math.round(lw)} px`} k={dimK} />
          {/* 用途：随比例滚动 */}
          <div style={{position: 'absolute', left: 96, top: 826}}>
            <Roll index={idx} h={150} style={{width: 900}}>
              {STATES.map((s, i) => (
                <div key={i}>
                  <div style={{...sc(76, 900, -0.01), color: BH.ink, lineHeight: 1.05}}>{s.name}</div>
                  <div style={{...sc(34, 500), color: BH.gray, marginTop: 6}}>{s.use}</div>
                </div>
              ))}
            </Roll>
          </div>
        </>
      )}
      {!L && (
        <>
          {/* 瑞士：栏线随宽度重排 */}
          {Array.from({length: 6}).map((_, i) => (
            <div key={i} style={{position: 'absolute', left: X + pad + (i * (textW + 24)) / 6, top: 0, width: textW / 6 - 24, height: 1080, borderLeft: `1px solid ${SW.rule}`, borderRight: `1px solid ${SW.rule}`}} />
          ))}
          <Dim x0={X + 48} x1={1872} y={150} color={SW.red} bg={SW.paper} label={`${Math.round(rw)} px`} k={dimK} />
          <div style={{position: 'absolute', left: X + pad, top: 236, width: textW, color: SW.ink}}>
            <Rise f={f} at={-4} d={20} pad={8}>
              <div style={{...swiss(24, 700, 0.02), color: SW.red}}>{'● Swiss Style'}</div>
            </Rise>
            <div style={{width: 150 * tween(f, -2, 20, 0, 1, EXPO), height: 12, background: SW.red, marginTop: 22}} />
            <Rise f={f} at={0} d={24} pad={22} style={{marginTop: 30}}>
              <div style={{...swiss(120, 700, -0.055), lineHeight: 0.96}}>{'Less is more.'}</div>
            </Rise>
            <Rise f={f} at={6} d={24} pad={10} style={{marginTop: 34}}>
              <div style={{...sc(34, 500), lineHeight: 1.5, color: SW.ink}}>{'一半讲故事，一半给证据。中线在哪里，重点就在哪里。'}</div>
            </Rise>
            <Rise f={f} at={12} d={22} pad={10} style={{marginTop: 40}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
                <div style={{width: 84, height: 84, background: SW.red, color: SW.paper, ...swiss(52, 400, 0), display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{'→'}</div>
                <div style={{...sc(30, 700)}}>{'了解更多'}</div>
              </div>
            </Rise>
          </div>
        </>
      )}

      {/* 把手 + 光标：中线上最醒目的一个点 */}
      <div style={{position: 'absolute', left: X - 34, top: 540 - 34, width: 68, height: 68, borderRadius: '50%', background: BH.paper, border: `5px solid ${BH.ink}`, transform: `scale(${pop * (dragging ? 1.12 : 1)})`, zIndex: 20}}>
        <svg width={58} height={58} viewBox="0 0 58 58" style={{position: 'absolute', left: 0, top: 0}}>
          <path d="M16 29 L26 21 L26 26 L32 26 L32 21 L42 29 L32 37 L32 32 L26 32 L26 37 Z" fill={BH.ink} />
        </svg>
      </div>
      {pop > 0.5 && <Cursor x={X + 14} y={560} press={dragging ? 1 : 0} ring={Math.max(ringT(T1 - 6) * (f < T1 + 20 ? 1 : 0), ringT(T2 - 6) * (f >= T2 - 6 && f < T2 + 20 ? 1 : 0))} ringColor={BH.ink} fill={BH.paper} stroke={BH.ink} />}

      {/* 代码：跨过中线的一块墨色标签，值随比例滚动 */}
      <div style={{position: 'absolute', left: X - 380, top: 962, width: 760, height: 78, background: BH.ink, color: BH.paper, transform: `scaleX(${chipK})`, overflow: 'hidden', zIndex: 15}}>
        <div style={{position: 'absolute', left: 28, top: 0, height: 78, display: 'flex', alignItems: 'center', ...mono(26, 400)}}>
          <span style={{color: BH.yellow}}>{'grid-template-columns: '}</span>
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
