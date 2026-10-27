/**
 * 0—2 秒 · 开场：一张没写 CSS 的网页
 *   f0     浏览器默认样式：Times 标题、蓝色下划线链接、灰按钮；右边是空的 style.css
 *   f30    border: 6px solid #000      → 黑框“盖章”一样砸下来
 *   f60    box-shadow: 14px 14px 0     → 硬阴影弹出来
 *   f75    background: #FFD23F         → 黄色从左刷过去
 *   f90    font: 900 Archivo           → 标题换成宽体；整页一起变成新粗野主义，编辑器退场
 *   f102   光标按下标题（位移 = 阴影，阴影归零）
 *   f107   被按下的标题块撑满全屏 → 01 黑框的黄色底
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {E, clamp, shake, tween} from '../../../src/lib/anim';
import {C, V} from '../tokens';
import {Box, Burst, Cursor, Dots, Typed, disp, grot, lerp, mono, press, sc, serif, slam} from './ui';

const LINES: [string, number, number][] = [
  // 文本，开始打字，生效
  ['  border: 6px solid #000;', 12, 30],
  ['  box-shadow: 14px 14px 0 #000;', 38, 60],
  ['  background: #FFD23F;', 64, 75],
  ['  font: 900 125% Archivo;', 78, 90],
];

const PRE = {x: 112, y: 190, w: 880, h: 176};
const POST = {x: 210, y: 250, w: 1500, h: 240};

const Editor: React.FC<{f: number}> = ({f}) => {
  const out = tween(f, 82, 12, 0, 1, E.in);
  if (out >= 1) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 1060 + out * 1000,
        top: 190,
        width: 770,
        height: 600,
        background: '#FAFAFA',
        border: '1px solid #C8C8C8',
        borderRadius: 6,
        boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
        overflow: 'hidden',
      }}
    >
      <div style={{height: 52, borderBottom: '1px solid #DDD', display: 'flex', alignItems: 'center', paddingLeft: 24, gap: 10, background: '#F0F0F0'}}>
        {['#E0E0E0', '#E0E0E0', '#E0E0E0'].map((c, i) => (
          <div key={i} style={{width: 14, height: 14, borderRadius: 7, background: c}} />
        ))}
        <span style={{...mono(20, 400), color: '#777', marginLeft: 16}}>style.css</span>
      </div>
      <div style={{padding: '30px 34px', ...mono(32, 700), color: C.ink}}>
        <div style={{color: '#888'}}>{f >= 4 ? 'h1 {' : ''}</div>
        {LINES.map(([text, at, fire], i) => {
          const flash = clamp(1 - (f - fire) / 14) * (f >= fire ? 1 : 0);
          return (
            <div key={i} style={{background: `rgba(255,210,63,${flash})`, margin: '0 -34px', padding: '0 34px', minHeight: 44}}>
              <Typed f={f} at={at} text={text} cps={2.4} caret={f < fire + 6 && f < (LINES[i + 1]?.[1] ?? 1e9)} />
            </div>
          );
        })}
        <div style={{color: '#888'}}>{f >= 90 ? '}' : ''}</div>
      </div>
    </div>
  );
};

export const Opening: React.FC<{f: number}> = ({f}) => {
  const sh = shake(f, [
    [30, 10],
    [60, 8],
    [90, 16],
    [102, 7],
  ]);
  // 标题块：盖章 → 阴影 → 刷黄 → 换字体时变大挪到中间
  const stamp = f >= 30 ? 1 : 0;
  const stampScale = f >= 30 ? lerp(1.18, 1, tween(f, 30, 7, 0, 1, E.out)) : 1;
  const shadowK = f >= 60 ? slam(f, 60) : 0;
  const fillK = tween(f, 75, 8, 0, 1, E.inOut);
  const grow = f >= 90 ? slam(f, 90) : 0;
  const pr = press(f, 102, 99, false);
  const expand = tween(f, 107, 11, 0, 1, E.in);
  const g = {
    x: lerp(PRE.x, POST.x, grow),
    y: lerp(PRE.y, POST.y, grow),
    w: lerp(PRE.w, POST.w, grow),
    h: lerp(PRE.h, POST.h, grow),
  };
  const box = {
    x: lerp(g.x, -V.border, expand),
    y: lerp(g.y, -V.border, expand),
    w: lerp(g.w, 1920 + 2 * V.border, expand),
    h: lerp(g.h, 1080 + 2 * V.border, expand),
  };
  const page = tween(f, 90, 10, 0, 1, E.out); // 网页底色：白 → 纸
  const oldOut = 1 - tween(f, 90, 5, 0, 1, E.out);
  const newIn = tween(f, 90, 4, 0, 1, E.out);
  const textOut = 1 - tween(f, 107, 6, 0, 1, E.out);
  // 其他默认元素
  const preOut = 1 - tween(f, 90, 6, 0, 1, E.in);
  const pop = (at: number) => (f >= at ? slam(f, at) : 0);
  const cur = tween(f, 92, 10, 0, 1, E.inOut);
  return (
    <AbsoluteFill style={{background: page >= 1 ? C.paper : `color-mix(in srgb, ${C.paper} ${page * 100}%, #FFFFFF)`}}>
      <Dots opacity={0.16 * page} />
      <div style={{position: 'absolute', inset: 0, transform: `translate(${sh.x}px, ${sh.y}px)`}}>
        {/* 默认样式的网页 */}
        {preOut > 0 && (
          <div style={{opacity: preOut}}>
            <div style={{position: 'absolute', left: PRE.x + 4, top: 430, ...serif(46), color: C.ink}}>This page has no CSS yet.</div>
            <div style={{position: 'absolute', left: PRE.x + 4, top: 510, ...serif(46), color: C.link, textDecoration: 'underline'}}>Read more</div>
            <div
              style={{
                position: 'absolute',
                left: PRE.x + 2,
                top: 600,
                padding: '10px 30px',
                background: 'linear-gradient(#FDFDFD, #E3E3E3)',
                border: '1px solid #8F8F8F',
                borderRadius: 4,
                fontFamily: 'Arial, Liberation Sans, sans-serif',
                fontSize: 36,
                color: C.ink,
              }}
            >
              Submit
            </div>
          </div>
        )}
        {/* 新粗野主义的网页 */}
        {f >= 92 && (
          <>
            <div style={{position: 'absolute', left: 960, top: 640, transform: `translate(-50%, 0) scale(${lerp(1.3, 1, pop(92))})`, opacity: clamp((f - 92) / 3), ...sc(96, 900, 0.04), color: C.ink}}>
              新粗野主义
            </div>
            <Box x={520} y={820} w={360} h={104} fill={C.pink} shadow={14} p={0} scale={lerp(0, 1, pop(96))} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <span style={{...sc(40, 900)}}>按下去 →</span>
            </Box>
            <Box x={930} y={820} w={470} h={104} fill={C.lime} shadow={14} r={52} scale={lerp(0, 1, pop(100))} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <span style={{...grot(38, 700)}}>2021 → NOW</span>
            </Box>
          </>
        )}
        {/* 标题块 */}
        <Box
          x={box.x}
          y={box.y}
          w={box.w}
          h={box.h}
          fill={fillK > 0 ? C.yellow : 'transparent'}
          border={stamp ? V.border : 0}
          shadow={14 * shadowK * (1 - expand)}
          p={pr * (1 - expand)}
          scale={stampScale}
          style={{
            background: fillK >= 1 ? C.yellow : `linear-gradient(90deg, ${C.yellow} ${fillK * 100}%, transparent ${fillK * 100}%)`,
            borderColor: stamp ? C.ink : 'transparent',
          }}
        >
          <div style={{position: 'absolute', left: 40, top: 24, opacity: oldOut, ...serif(116, 700), color: C.ink}}>Neo-Brutalism</div>
          {f >= 90 && (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) scale(${lerp(0.62, 1, grow)})`,
                opacity: newIn * textOut,
                ...disp(140, 112),
                color: C.ink,
              }}
            >
              NEO-BRUTALISM
            </div>
          )}
        </Box>
        <Editor f={f} />
      </div>
      {f >= 92 && f < 110 && <Cursor x={lerp(1780, 1420, cur)} y={lerp(1100, 430, cur)} p={pr} />}
      <Burst x={1420} y={430} f={f} at={102} />
    </AbsoluteFill>
  );
};
