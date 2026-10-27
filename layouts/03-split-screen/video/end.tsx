/**
 * 17:30–20:00 片尾：海报被横着切开 → 中线转回竖直 → 五个词。
 * 进片尾时中线还是横的（上半 = 墨底 + 纸色字，下半 = 钴蓝底 + 墨色字），所以“Split”被横着劈成两半、颜色上下翻转；
 * 中线转回竖直的 40 帧里，海报一点点“正”过来。最后一帧是开场的海报，多了五个词。
 */
import React from 'react';
import {C} from '../tokens';
import {ChProps, EXPO, Page, Rise, disp, mono, rgba, sc, tween} from './ui';
import type {SeamStyle} from './SplitScreen';

export const endSeam = (_f: number): SeamStyle => ({line: C.paper, pillBg: C.paper, pillFg: C.ink});

const LETTERS = ['S', 'p', 'l', 'i', 't'];
const WORDS = ['一条中线', '比例', '反差', '固定与滚动', '上下叠'];
const WORD_AT = 62;
const WORD_STEP = 14;

export const End: React.FC<ChProps> = (p) => {
  const {f, side, X} = p;
  const L = side === 'L';
  const pulse = tween(f, 96, 16, 0, 1, EXPO);
  return (
    <Page p={p} bg={L ? C.ink : C.blue}>
      {L && <div style={{position: 'absolute', left: 96, top: 62, color: C.mute, ...mono(24, 400, 0.04)}}>{'Design Style · 布局 03'}</div>}
      {!L && (
        <div style={{position: 'absolute', right: 64, top: 56, color: C.paper, textAlign: 'right'}}>
          <div style={{...sc(26, 500, 0.06)}}>{'每天一个设计风格'}</div>
          <div style={{...mono(20, 400, 0.04), marginTop: 10, opacity: tween(f, WORD_AT + 5 * WORD_STEP, 14) * 0.75}}>{'@guanmo_ai · github.com/guanmo-ai/design-style'}</div>
        </div>
      )}

      {/* 同一个词，两半各画一遍：墨底纸字 / 蓝底墨字 */}
      <div style={{position: 'absolute', left: 84, top: 112, display: 'flex', color: L ? C.paper : C.ink, ...disp(560, 100, -0.045)}}>
        {LETTERS.map((ch, i) => (
          <span key={i} style={{display: 'inline-block'}}>
            {ch}
          </span>
        ))}
      </div>

      {L && (
        <>
          <div style={{position: 'absolute', left: 96, top: 700, display: 'flex', color: C.paper, ...sc(176, 900, -0.01), lineHeight: 1.05}}>{'分屏布局'}</div>
          <div style={{position: 'absolute', left: 100, top: 920, color: C.peri, ...mono(30, 400, 0.02)}}>{'Split Screen · 一条中线，两种声音'}</div>
        </>
      )}
      {!L && (
        <div style={{position: 'absolute', left: X + 72, top: 690, color: C.paper}}>
          <div style={{...sc(66, 900)}}>{'左边说话，'}</div>
          <div style={{...sc(66, 900), marginTop: 10}}>{'右边给证据。'}</div>
        </div>
      )}

      {/* 五个词：横跨中线，一句话读完（两半同色） */}
      <div style={{position: 'absolute', left: 0, top: 982, width: 1920, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 36, color: C.paper}}>
        {WORDS.map((w, i) => (
          <React.Fragment key={i}>
            <Rise f={f} at={WORD_AT + i * WORD_STEP} d={18} pad={14}>
              <div style={{display: 'flex', alignItems: 'baseline', gap: 14}}>
                <span style={{...mono(22, 700, 0.1), color: C.peri}}>{`0${i + 1}`}</span>
                <span style={{...sc(44, 900)}}>{w}</span>
              </div>
            </Rise>
            {i < WORDS.length - 1 && <span style={{...sc(34, 400), color: rgba(C.paper, 0.4), opacity: tween(f, WORD_AT + i * WORD_STEP + 10, 8)}}>{'·'}</span>}
          </React.Fragment>
        ))}
      </div>
      {pulse > 0 && pulse < 1 && <div style={{position: 'absolute', left: X - 3, top: -260 + pulse * 1600, width: 6, height: 260, background: `linear-gradient(180deg, ${rgba(C.paper, 0)}, ${C.paper})`}} />}
    </Page>
  );
};
