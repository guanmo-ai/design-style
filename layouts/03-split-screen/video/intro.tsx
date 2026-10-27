/** 00:00–02:30 定义：中线画下来 → 钴蓝从中线铺开 → “Split”被拉链拉合 → 一条中线，两种声音 */
import React from 'react';
import {C} from '../tokens';
import {ChProps, Page, Rise, RuleTag, ZIP, EXPO, disp, mono, rgba, sc, tween} from './ui';
import type {SeamStyle} from './SplitScreen';

export const introSeam = (f: number): SeamStyle => ({line: rgba(C.paper, 1 - tween(f, 124, 12)), pillBg: C.paper, pillFg: C.ink});

const LETTERS = ['S', 'p', 'l', 'i', 't'];
const ZIP_AT = 24;
const ZIP_STAGGER = 3;
const ZIP_DUR = 40;
/** 拉链合上（最后一个字母对齐）的帧 */
export const ZIP_DONE = ZIP_AT + ZIP_STAGGER * 4 + 24;

export const Intro: React.FC<ChProps> = (p) => {
  const {f, side, X} = p;
  const L = side === 'L';
  const wipe = tween(f, 10, 24, 0, 1, EXPO);
  // 中线上跑过一束光：字母咬合的一瞬间
  const pulse = tween(f, ZIP_DONE - 6, 16, 0, 1, EXPO);
  return (
    <Page p={p} bg={C.ink} under={!L && <div style={{position: 'absolute', left: X, top: 0, width: (1920 - X) * wipe, height: 1080, background: C.blue}} />}>
      {/* 页眉 */}
      {L && <div style={{position: 'absolute', left: 96, top: 62, color: C.mute, ...mono(24, 400, 0.04)}}>{'Design Style · 布局 03'}</div>}
      {!L && (
        <div style={{position: 'absolute', right: 64, top: 56, color: C.paper, ...sc(26, 500, 0.06), opacity: tween(f, 30, 14)}}>{'每天一个设计风格'}</div>
      )}

      {/* “Split”：同一个词在两半各画一遍，左半从下往上、右半从上往下，逐字母咬合 */}
      <div style={{position: 'absolute', left: 84, top: 112, display: 'flex', color: L ? C.paper : C.ink, ...disp(560, 100, -0.045)}}>
        {LETTERS.map((ch, i) => {
          const z = ZIP(Math.min(1, Math.max(0, (f - (ZIP_AT + i * ZIP_STAGGER)) / ZIP_DUR)));
          const y = (L ? 1 : -1) * (1 - z) * 1500;
          return (
            <span key={i} style={{display: 'inline-block', transform: `translateY(${y}px)`}}>
              {ch}
            </span>
          );
        })}
      </div>

      {/* 左：中文标题 + 一句话 */}
      {L && (
        <>
          <div style={{position: 'absolute', left: 96, top: 700, display: 'flex', color: C.paper}}>
            {'分屏布局'.split('').map((ch, i) => (
              <Rise key={i} f={f} at={ZIP_DONE + 2 + i * 3} d={22} pad={26}>
                <span style={{...sc(176, 900, -0.01), lineHeight: 1.05}}>{ch}</span>
              </Rise>
            ))}
          </div>
          <Rise f={f} at={ZIP_DONE + 22} d={20} pad={10} style={{position: 'absolute', left: 100, top: 920}}>
            <span style={{color: C.peri, ...mono(30, 400, 0.02)}}>{'Split Screen · 一条中线，两种声音'}</span>
          </Rise>
          <div style={{position: 'absolute', left: 96, top: 1004}}>
            <RuleTag f={f} n={1} title="只有一条中线" fg={C.paper} sub={C.peri} at={ZIP_DONE + 34} />
          </div>
        </>
      )}

      {/* 右：第二种声音 */}
      {!L && (
        <div style={{position: 'absolute', left: X + 72, top: 690, color: C.paper}}>
          <Rise f={f} at={ZIP_DONE + 14} d={22} pad={14}>
            <div style={{...sc(66, 900)}}>{'左边说话，'}</div>
          </Rise>
          <Rise f={f} at={ZIP_DONE + 22} d={22} pad={14}>
            <div style={{...sc(66, 900), marginTop: 10}}>{'右边给证据。'}</div>
          </Rise>
        </div>
      )}

      {/* 咬合那一下：一束光顺着中线跑下去 */}
      {pulse > 0 && pulse < 1 && (
        <div style={{position: 'absolute', left: X - 3, top: -260 + pulse * 1600, width: 6, height: 260, background: `linear-gradient(180deg, ${rgba(C.paper, 0)}, ${C.paper})`}} />
      )}
    </Page>
  );
};
