/**
 * 00:00–02:00 定义：同一个词，两个世界。
 * 左半是瑞士国际主义（白纸、Helvetica、一块红），右半是波普艺术（黄底、网点、爆炸框、拟声字）。
 * 中线先画下来，两个世界从中线向两边撕开；“Spli”像瑞士海报那样精确地升起，“t”像漫画那样从天上砸下来——压扁、回弹、爆炸。
 */
import React from 'react';
import {ChProps, EXPO, Page, Rise, ZIP, mono, popEase, rgba, sc, tween} from './ui';
import {Pop, PC, SW, swiss} from './kit';
import type {SeamStyle} from './SplitScreen';

export const introSeam = (f: number): SeamStyle => ({line: rgba('#111111', 1 - tween(f, 100, 10)), width: 6, pillBg: '#111111', pillFg: '#F5F4F0'});

const LETTERS = ['S', 'p', 'l', 'i'];
const ZIP_AT = 26;
const ZIP_STAGGER = 3;
const ZIP_DUR = 38;
/** “t”落地的帧：也是咬合的一刻 */
export const T_LAND = 60;
const T_FALL = 10;

/** 海报：开场和片尾共用。end = 片尾版（所有动画已完成；中文标题缩小，让位给五个词；去掉对话框） */
export const Poster: React.FC<{p: ChProps; f: number; end?: boolean}> = ({p, f, end}) => {
  const {side, X} = p;
  const L = side === 'L';
  // 两个世界从中线向两边撕开
  const open = tween(f, 6, 22, 0, 1, EXPO);
  const clip = L ? `inset(0 0 0 ${X * (1 - open)}px)` : `inset(0 ${(1920 - X) * (1 - open)}px 0 0)`;
  const land = f - T_LAND;
  const [sx, sy] = Pop.shake(f, T_LAND, 14, 'intro');
  const burstK = Pop.popS(f, T_LAND);
  return (
    <div style={{position: 'absolute', inset: 0, background: '#111111'}}>
      <div style={{position: 'absolute', inset: 0, clipPath: clip}}>
        {L ? (
          <Page p={p} bg={SW.paper}>
            {/* 瑞士：12 栏网格 + 一块红 + 反白的字 */}
            {Array.from({length: 12}).map((_, i) => (
              <div key={i} style={{position: 'absolute', left: 96 + i * 146, top: 0, width: 122, height: 1080, borderLeft: `1px solid ${SW.rule}`, borderRight: `1px solid ${SW.rule}`}} />
            ))}
            <div style={{position: 'absolute', left: 690, top: 96, width: 1187 - 690, height: 620, background: SW.red, transform: `scaleY(${tween(f, 14, 20, 0, 1, EXPO)})`, transformOrigin: 'top'}} />
            <div style={{position: 'absolute', left: 84, top: 92, display: 'flex', ...swiss(540, 700, -0.05)}}>
              {LETTERS.map((ch, i) => {
                const z = ZIP(Math.min(1, Math.max(0, (f - (ZIP_AT + i * ZIP_STAGGER)) / ZIP_DUR)));
                // 压在红上的字自动反白（l、i）
                const onRed = i >= 2;
                return (
                  <span key={i} style={{display: 'inline-block', transform: `translateY(${(1 - z) * 1500}px)`, color: onRed ? SW.paper : SW.ink}}>
                    {ch}
                  </span>
                );
              })}
            </div>
            {/* 瑞士的页眉、标题与说明 */}
            <div style={{position: 'absolute', left: 96, top: 54, ...swiss(22, 400, 0), color: SW.ink}}>
              <span style={{color: SW.red}}>●</span>
              {'  Design Style · 布局 03'}
            </div>
            <div style={{position: 'absolute', left: 96, top: end ? 790 : 770, display: 'flex', color: SW.ink}}>
              {'分屏布局'.split('').map((ch, i) => (
                <Rise key={i} f={f} at={T_LAND + 4 + i * 3} d={20} pad={22}>
                  <span style={{...sc(end ? 120 : 172, 900, -0.02), lineHeight: 1.05}}>{ch}</span>
                </Rise>
              ))}
            </div>
            <div style={{position: 'absolute', left: 100, top: end ? 936 : 958, width: 160, height: 8, background: SW.red, transform: `scaleX(${tween(f, T_LAND + 18, 14, 0, 1, EXPO)})`, transformOrigin: 'left'}} />
            <Rise f={f} at={T_LAND + 20} d={18} pad={8} style={{position: 'absolute', left: 100, top: end ? 962 : 984}}>
              <span style={{...swiss(30, 400, 0), color: SW.ink}}>
                {'Split Screen'}
                <span style={{color: SW.grey}}>{'  ·  一条中线，两种声音'}</span>
              </span>
            </Rise>
          </Page>
        ) : (
          <Page p={p} bg={PC.yellow}>
            <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
              <Pop.Patterns f={f} />
              {/* 网点：右下角最重，像印刷时油墨越压越重 */}
              <Pop.Dots x={X} y={0} w={1920 - X} h={1080} pitch={30} r={(x, y) => Math.max(0, ((x - X) / (1920 - X)) * 12 + (y / 1080) * 22 - 12)} c={PC.red} o={0.9} />
              <g transform={`translate(${sx} ${sy})`}>
                {/* 爆炸框：在“t”落地的一刻炸开 */}
                <Pop.Pop f={f} t0={T_LAND} x={1553} y={500} rot={-8} spin={20}>
                  <Pop.Blk d={Pop.burstD(500, 360, 13, 0, 'intro')} fill={PC.white} sw={9} sh={18} />
                </Pop.Pop>
                <Pop.Speed cx={1553} cy={500} r0={560} r1={1250} n={30} p={tween(f, T_LAND, 14, 0, 1, EXPO)} w={9} seed="intro" />
                {/* “t”：从天上砸下来，压扁，回弹 */}
                <Pop.Drop f={f} t0={T_LAND - T_FALL} x={1553} y={850} hb={0} fall={T_FALL} from={-1300} squash={0.2}>
                  <Pop.Txt x={0} y={0} size={780} font="display" anchor="middle" c={PC.red} stroke={18} sh={26} ls={0}>
                    {'t'}
                  </Pop.Txt>
                </Pop.Drop>
              </g>
              {/* 波普的旁白框 */}
              <Pop.Box x={1920 - 64 - 330} y={40} w={330} h={62} fill={PC.white} k={Pop.popS(f, 16)} rot={2}>
                <Pop.Txt x={165} y={42} size={28} font="cn" anchor="middle">{'每天一个设计风格'}</Pop.Txt>
              </Pop.Box>
              {/* 对话框：左边说话，右边给证据 */}
              {!end && (
                <Pop.Bubble x={1553} y={930} w={620} h={170} tx={-150} ty={-130} k={Pop.popS(f, T_LAND + 18)} rot={-3}>
                  <Pop.Txt x={0} y={-6} size={50} font="cn" anchor="middle">{'左边说话，'}</Pop.Txt>
                  <Pop.Txt x={0} y={52} size={50} font="cn" anchor="middle">{'右边给证据！'}</Pop.Txt>
                </Pop.Bubble>
              )}
            </svg>
          </Page>
        )}
      </div>
    </div>
  );
};

export const Intro: React.FC<ChProps> = (p) => <Poster p={p} f={p.f} />;
