/**
 * 11:30–14:30 滚动：左边固定、右边滚；然后反过来——左边向下、右边向上。
 * 左半是 position: sticky 的一块（序号跟着右边滚到哪一段变）；右半三段文章往上滚，带惯性。
 * 第二段：两边反向滚动，正好是这支片子自己的翻页方式（但方向反了一次）。
 */
import React from 'react';
import {Img, staticFile} from 'remotion';
import {C} from '../tokens';
import {BELT, ChProps, EXPO, Page, RuleTag, Wheel, clamp, disp, mono, rgba, sc, tween} from './ui';
import type {SeamStyle} from './SplitScreen';

export const scrollSeam = (_f: number): SeamStyle => ({line: null, pillBg: C.blue, pillFg: C.paper});

const ROWS = [
  {img: 'citrus', n: '01', title: '左边不动', desc: 'position: sticky，把它钉在原地'},
  {img: 'cat', n: '02', title: '右边在滚', desc: '内容多长都行，滚的只是这一半'},
  {img: 'bread', n: '03', title: '各走各的', desc: '两边的速度和方向都可以不一样'},
];
const FLICK = [40, 78]; // 两次滚轮（局部帧）
const STEP = 700; // 每次滚过一段
const PHASE2 = 112; // 反向滚动开始
const ROW_H = 540;

const flick = (f: number) => FLICK.reduce((s, a) => s + tween(f, a, 26, 0, STEP, EXPO), 0);
const phase = (f: number) => BELT(clamp((f - PHASE2) / 26));

export const Scroll: React.FC<ChProps> = (p) => {
  const {f, side, X} = p;
  const L = side === 'L';
  const s = flick(f);
  const ph = phase(f);
  const idx = Math.min(2, s / STEP); // 小数：当前滚到第几段
  const rightW = 1920 - X;
  // 第二段：左半向下、右半向上，各送出 1080
  const leftOut = ph * 1080; // 左边的固定块向下离开
  const rightOut = -ph * 1080; // 右边的文章向上离开
  const t2 = Math.max(0, f - PHASE2);
  return (
    <Page p={p} bg={L ? C.ink : C.paper}>
      {L && (
        <>
          {/* 第一段：固定的一块 */}
          <div style={{position: 'absolute', inset: 0, transform: `translateY(${leftOut}px)`}}>
            <div style={{position: 'absolute', left: 72, top: 62}}>
              <RuleTag f={f} n={4} title="一边固定，一边滚" fg={C.paper} sub={C.peri} />
            </div>
            <div style={{position: 'absolute', left: 64, top: 170, display: 'flex', color: C.paper, ...disp(420, 100, -0.02)}}>
              <Wheel v={0} h={430} style={{width: 280}} />
              <Wheel v={1 + idx} h={430} style={{width: 280}} />
            </div>
            <div style={{position: 'absolute', left: 72, top: 640, display: 'flex', gap: 10}}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{width: 112, height: 10, background: rgba(C.paper, 0.2), position: 'relative'}}>
                  <div style={{position: 'absolute', inset: 0, background: C.blue, transform: `scaleX(${clamp(1 - Math.abs(idx - i))})`, transformOrigin: 'left'}} />
                </div>
              ))}
            </div>
            <div style={{position: 'absolute', left: 72, top: 700, color: C.paper, ...mono(30, 700, 0.1), opacity: tween(f, 14, 14)}}>{'PINNED ▾ 固定'}</div>
            <div style={{position: 'absolute', left: 72, top: 790, color: C.peri, ...mono(28, 400), lineHeight: 1.5, opacity: tween(f, 20, 14)}}>
              {'.left {\n  position: sticky;\n  top: 0;\n  height: 100svh;\n}'}
            </div>
          </div>
          {/* 第二段：向下滚的一列字 */}
          {ph > 0.001 && (
            <div style={{position: 'absolute', left: 0, top: 0, width: X, height: 1080, overflow: 'hidden', transform: `translateY(${(ph - 1) * 1080}px)`}}>
              {Array.from({length: 8}).map((_, i) => {
                const per = 300;
                const y = ((t2 * 7 + i * per) % (per * 7)) - per;
                return (
                  <div key={i} style={{position: 'absolute', left: 72, top: y, color: i % 2 === 0 ? C.paper : C.blue, ...sc(250, 900), lineHeight: 1, whiteSpace: 'nowrap'}}>
                    {'向下'}
                  </div>
                );
              })}
              <div style={{position: 'absolute', left: 72, top: 62, color: C.peri, ...mono(24, 700, 0.14)}}>{'REVERSE · 反向'}</div>
            </div>
          )}
        </>
      )}
      {!L && (
        <>
          {/* 第一段：滚动的三段文章 */}
          <div style={{position: 'absolute', inset: 0, transform: `translateY(${rightOut}px)`}}>
            {ROWS.map((r, i) => {
              const top = 250 + i * (ROW_H + 160) - s;
              if (top > 1100 || top < -ROW_H - 40) return null;
              return (
                <div key={i} style={{position: 'absolute', left: X + 76, top, width: rightW - 152, height: ROW_H, display: 'flex', gap: 56, alignItems: 'center'}}>
                  <div style={{position: 'relative', width: ROW_H, height: ROW_H, flexShrink: 0}}>
                    <Img src={staticFile(`02-masonry/photos/${r.img}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    <div style={{position: 'absolute', left: 0, top: 0, padding: '8px 16px', background: C.blue, color: C.paper, ...mono(26, 700)}}>{r.n}</div>
                  </div>
                  <div>
                    <div style={{...sc(82, 900, -0.01), color: C.ink, lineHeight: 1.1}}>{r.title}</div>
                    <div style={{...sc(34, 500), color: C.grey, marginTop: 16, lineHeight: 1.5}}>{r.desc}</div>
                  </div>
                </div>
              );
            })}
            {/* 滚动条 */}
            <div style={{position: 'absolute', right: 26, top: 120, width: 8, height: 840, background: rgba(C.ink, 0.1)}}>
              <div style={{position: 'absolute', left: 0, top: (s / (STEP * 2)) * 520, width: 8, height: 300, background: C.blue}} />
            </div>
            <div style={{position: 'absolute', right: 64, top: 62, color: C.grey, ...mono(22, 700, 0.14)}}>{'SCROLLS ▴ 滚动'}</div>
          </div>
          {/* 第二段：向上滚的一列字 */}
          {ph > 0.001 && (
            <div style={{position: 'absolute', left: X, top: 0, width: rightW, height: 1080, overflow: 'hidden', transform: `translateY(${(1 - ph) * 1080}px)`}}>
              {Array.from({length: 8}).map((_, i) => {
                const per = 300;
                const y = 2100 - (((t2 * 7 + i * per) % (per * 7)) + per);
                return (
                  <div key={i} style={{position: 'absolute', left: 72, top: y - 1080 + 1080, color: i % 2 === 0 ? C.ink : C.blue, ...sc(250, 900), lineHeight: 1, whiteSpace: 'nowrap'}}>
                    {'向上'}
                  </div>
                );
              })}
              <div style={{position: 'absolute', right: 64, top: 62, color: C.grey, ...mono(22, 700, 0.14)}}>{'本片的转场，反了一次'}</div>
            </div>
          )}
        </>
      )}
      {/* 第二段的说明：跨过中线的一块药丸 */}
      <div style={{position: 'absolute', left: X - 300, top: 968, width: 600, height: 72, background: C.blue, color: C.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scaleX(${tween(f, PHASE2 + 22, 14, 0, 1, EXPO)})`, ...sc(32, 900), zIndex: 30}}>
        {'也可以反过来：左 ↓　右 ↑'}
      </div>
    </Page>
  );
};
