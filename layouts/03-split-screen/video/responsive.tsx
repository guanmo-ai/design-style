/**
 * 14:30–17:30 响应式：同一页，从 1440 缩到 390。
 * 窄过 768 的一刻：左右两栏叠成上下，整条中线同时转 90°（左半 → 上半，右半 → 下半）。
 * 窗口是同一个东西在两半各画一遍：边框颜色每半各一个，所以它横跨中线时颜色会翻过来。
 */
import React from 'react';
import {C} from '../tokens';
import {BELT, ChProps, EXPO, Page, Rise, RuleTag, SLIDE, clamp, disp, lerp, mono, popEase, rgba, sc, tween} from './ui';
import type {SeamStyle} from './SplitScreen';

export const respSeam = (_f: number): SeamStyle => ({line: null, pillBg: C.blue, pillFg: C.paper});

const A = {in: -8, shrink1: 36, hold: 70, shrink2: 74, stack: 76, rot: 100};
export const vwAt = (f: number) => (f < A.shrink1 ? 1440 : f < A.shrink2 ? lerp(1440, 768, SLIDE(clamp((f - A.shrink1) / 34))) : lerp(768, 390, SLIDE(clamp((f - A.shrink2) / 26))));
export const stackAt = (f: number) => BELT(clamp((f - A.stack) / 16));

const Dim: React.FC<{x0: number; x1: number; y: number; color: string; bg: string; label: string}> = ({x0, x1, y, color, bg, label}) => (
  <div style={{position: 'absolute', left: x0, top: y - 14, width: x1 - x0, height: 28}}>
    <div style={{position: 'absolute', left: 0, top: 13, width: '100%', height: 2, background: color}} />
    <div style={{position: 'absolute', left: 0, top: 0, width: 2, height: 28, background: color}} />
    <div style={{position: 'absolute', right: 0, top: 0, width: 2, height: 28, background: color}} />
    <div style={{position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', padding: '0 16px', background: bg, color, height: 28, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', ...mono(24, 700, 0.04)}}>{label}</div>
  </div>
);

export const Responsive: React.FC<ChProps> = (p) => {
  const {f, side} = p;
  const L = side === 'L';
  const fg = L ? C.ink : C.paper; // 本半的前景色
  const bg = L ? C.paper : C.ink;
  const vw = vwAt(f);
  const st = stackAt(f);
  const open = tween(f, A.in, 20, 0, 1, EXPO);
  const ww = vw * 0.78;
  const wh = lerp(720, 860, st);
  const bw = 8;
  const rad = lerp(8, 44, st);
  const bar = lerp(48, 0, st);
  const wx = 960 - ww / 2;
  const wy = 540 - wh / 2;
  const cx0 = wx + bw;
  const cy0 = wy + bw + bar;
  const cw = ww - 2 * bw;
  const ch = wh - 2 * bw - bar;
  // 两个窗格：艺术（蓝）与文字（纸）。并排 → 叠放，文字去上面
  const art = {x: lerp(cx0, cx0, st), y: lerp(cy0, cy0 + ch / 2, st), w: lerp(cw / 2, cw, st), h: lerp(ch, ch / 2, st)};
  const txt = {x: lerp(cx0 + cw / 2, cx0, st), y: lerp(cy0, cy0, st), w: lerp(cw / 2, cw, st), h: lerp(ch, ch / 2, st)};
  const fs = clamp(vw * 0.046, 30, 70);
      // 左右 → 上下 的大字
  const lrOut = 1 - tween(f, 72, 14);
  const udIn = tween(f, 122, 20, 0, 1, EXPO);
  return (
    <Page p={p} bg={bg}>
      {/* 规则角标 + 读数 */}
      {L && (
        <div style={{position: 'absolute', left: 96, top: 62}}>
          <RuleTag f={f} n={5} title="手机上叠成上下" fg={C.ink} sub={C.grey} at={-6} />
        </div>
      )}
      {/* 大字：左 | 右 → 上 / 下 */}
      <div style={{position: 'absolute', left: L ? 40 : 1920 - 40 - 380, top: 250, width: 380, textAlign: 'center', color: fg, ...sc(380, 900), lineHeight: 1, opacity: lrOut * tween(f, -4, 14)}}>{L ? '左' : '右'}</div>
      <div style={{position: 'absolute', left: L ? 330 : 1920 - 330 - 460, top: L ? 70 : 560, width: 460, textAlign: 'center', color: fg, ...sc(440, 900), lineHeight: 1, opacity: udIn, transform: `translateY(${(1 - udIn) * (L ? -60 : 60)}px)`}}>{L ? '上' : '下'}</div>

      {/* 视口读数 */}
      <div style={{opacity: open}}>
        <Dim x0={wx} x1={wx + ww} y={wy - 46} color={fg} bg={bg} label={`${Math.round(vw)} px`} />
      </div>

      {/* 窗口：边框颜色每半各一个 */}
      <div style={{position: 'absolute', left: wx, top: wy, width: ww, height: wh, borderRadius: rad, border: `${bw}px solid ${fg}`, boxSizing: 'border-box', overflow: 'hidden', background: bg, opacity: open, transform: `scale(${lerp(0.94, 1, open)})`}}>
        {/* 浏览器顶栏 */}
        <div style={{position: 'absolute', left: 0, top: 0, width: '100%', height: bar, background: fg, display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 16, overflow: 'hidden'}}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{width: 12, height: 12, borderRadius: '50%', background: bg}} />
          ))}
          <div style={{marginLeft: 16, height: 22, width: ww * 0.4, background: rgba(bg === C.paper ? C.paper : C.ink, 0.25), borderRadius: 11}} />
        </div>
      </div>
      {/* 窗格 */}
      <div style={{position: 'absolute', left: art.x, top: art.y, width: art.w, height: art.h, background: C.blue, overflow: 'hidden', opacity: open}}>
        <div style={{position: 'absolute', left: '12%', top: '16%', width: '58%', aspectRatio: '1', borderRadius: '50%', background: C.paper}} />
        <div style={{position: 'absolute', left: '40%', top: '46%', width: '58%', aspectRatio: '1', borderRadius: '50%', background: C.ink}} />
      </div>
      <div style={{position: 'absolute', left: txt.x, top: txt.y, width: txt.w, height: txt.h, background: C.paper, overflow: 'hidden', opacity: open}}>
        <div style={{position: 'absolute', left: '9%', top: '8%', width: '82%'}}>
          <div style={{color: C.ink, ...disp(fs, 100, -0.035), lineHeight: 0.98}}>{'Less, but better.'}</div>
          <div style={{marginTop: fs * 0.35, display: 'flex', flexDirection: 'column', gap: fs * 0.14}}>
            {[0.95, 0.8, 0.88].map((q, i) => (
              <div key={i} style={{height: Math.max(6, fs * 0.13), width: `${q * 100}%`, background: C.ink, opacity: 0.22}} />
            ))}
          </div>
          <div style={{marginTop: fs * 0.4, display: 'inline-block', padding: `${fs * 0.2}px ${fs * 0.4}px`, background: C.blue, color: C.paper, ...sc(Math.max(14, fs * 0.36), 900)}}>{'了解更多 →'}</div>
        </div>
      </div>
      {/* 顶栏：手机时是刘海 */}
      <div style={{position: 'absolute', left: 960 - 46, top: wy + bw + 10, width: 92, height: 22, borderRadius: 11, background: fg, opacity: st * open, zIndex: 3}} />

      {/* 阅读顺序：①文字（上，在纸色半边）②图（下，在墨色半边）——贴在手机两侧，不压住内容 */}
      {L && (
        <div style={{position: 'absolute', left: wx + ww + 28, top: 330, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', background: C.blue, color: C.paper, ...sc(30, 900), opacity: tween(f, 134, 10), transform: `scale(${tween(f, 134, 10, 0.6, 1, popEase)})`, transformOrigin: 'left center', zIndex: 6}}>
          <span>{'① 先读文字'}</span>
        </div>
      )}
      {!L && (
        <div style={{position: 'absolute', left: wx - 28 - 220, top: 690, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: 220, padding: '10px 18px', background: C.paper, color: C.blue, ...sc(30, 900), opacity: tween(f, 140, 10), transform: `scale(${tween(f, 140, 10, 0.6, 1, popEase)})`, transformOrigin: 'right center', zIndex: 6}}>
          <span>{'② 再看图'}</span>
        </div>
      )}

      {/* @media：跨过中线的药丸（出现在窄过 768 的一刻） */}
      <div style={{position: 'absolute', left: 960 - 330, top: 968, width: 660, height: 72, background: C.blue, color: C.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scaleX(${tween(f, A.hold + 6, 14, 0, 1, EXPO)})`, ...mono(28, 700), zIndex: 30}}>
        {'@media (max-width: 767px)'}
      </div>
    </Page>
  );
};
