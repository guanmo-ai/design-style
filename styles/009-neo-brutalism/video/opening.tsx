/**
 * 0—2 秒 · 开场。第一帧就是片尾那张海报（推特自动循环播放时首尾无缝）
 *   f0     海报：NEO / BRUTAL / ISM
 *   f10    光标一按——所有阴影一起归零
 *   f16    海报炸开，露出底下一张没写 CSS 的网页（Times 标题、蓝色下划线链接、灰按钮）
 *   f30    border: 6px solid #000      → 黑框“盖章”一样砸下来
 *   f45    box-shadow: 14px 14px 0     → 硬阴影弹出来
 *   f60    background: #FFD23F         → 黄色从左刷过去
 *   f75    font: 900 Archivo           → 标题换成宽体，整页一起变成新粗野主义
 *   f96    光标按下标题（位移 = 阴影，阴影归零）
 *   f101   被按下的标题块撑满全屏 → 01 黑框的黄色底
 * 每一行 CSS 是一枚黑底大字的“代码条”，在拍点前从右边砸进来，生效时闪黄。
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {E, clamp, tween} from '../../../src/lib/anim';
import {C, V} from '../tokens';
import {POSTER_PRESS, Poster} from './finale';
import {Box, Burst, Cursor, disp, grot, lerp, mono, press, sc, serif, slam, slamBig, thud} from './ui';

const LINES: [string, number][] = [
  // 代码，生效的帧
  ['border: 6px solid #000;', 30],
  ['box-shadow: 14px 14px 0 #000;', 45],
  ['background: #FFD23F;', 60],
  ['font: 900 125% Archivo;', 75],
];

const PRE = {x: 80, y: 270, w: 960, h: 190};
const POST = {x: 210, y: 250, w: 1500, h: 240};

/** 右边一列代码条：拍点前 9 帧从画外砸进来，生效时闪黄，换字体后一起退场 */
const CodeChips: React.FC<{f: number}> = ({f}) => {
  const out = tween(f, 76, 8, 0, 1, E.in);
  if (out >= 1 || f < 20) return null;
  return (
    <div style={{position: 'absolute', inset: 0, transform: `translateX(${out * 1100}px)`}}>
      <div style={{position: 'absolute', left: 1080, top: 222, opacity: clamp((f - 20) / 4), ...mono(28, 700), color: C.ink}}>style.css · h1 {'{'}</div>
      {LINES.map(([text, fire], i) => {
        if (f < fire - 9) return null;
        const k = slamBig(f, fire - 9);
        // 生效：先整块变黄 6 帧（阶跃，不渐变），再回到黑底黄字
        const flash = f >= fire && f < fire + 6;
        const live = f >= fire;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 1080 + (1 - k) * 900,
              top: 272 + i * 112,
              height: 88,
              padding: '0 26px',
              display: 'flex',
              alignItems: 'center',
              background: flash ? C.yellow : C.ink,
              color: flash ? C.ink : live ? C.yellow : C.paper,
              border: `4px solid ${C.ink}`,
              boxShadow: `8px 8px 0 ${C.ink}`,
              ...mono(40, 700),
            }}
          >
            {text}
          </div>
        );
      })}
    </div>
  );
};

export const Opening: React.FC<{f: number}> = ({f}) => {
  // 开场：海报 → 按下 → 炸开
  const hookP = press(f, 10, 99, false);
  const ex = tween(f, 16, 10, 0, 1, E.in);
  const cur1 = tween(f, 1, 8, 0, 1, E.out);
  // 网页
  const stamp = f >= 30 ? 1 : 0;
  const stampScale = f >= 30 ? lerp(1.14, 1, tween(f, 30, 6, 0, 1, E.out)) : 1;
  const shadowK = f >= 45 ? slam(f, 45) : 0;
  const fillK = tween(f, 60, 7, 0, 1, E.inOut);
  const grow = f >= 75 ? slam(f, 75) : 0;
  const pr = press(f, 96, 99, false);
  const expand = tween(f, 101, 11, 0, 1, E.in);
  const g = {x: lerp(PRE.x, POST.x, grow), y: lerp(PRE.y, POST.y, grow), w: lerp(PRE.w, POST.w, grow), h: lerp(PRE.h, POST.h, grow)};
  const box = {
    x: lerp(g.x, -V.border, expand),
    y: lerp(g.y, -V.border, expand),
    w: lerp(g.w, 1920 + 2 * V.border, expand),
    h: lerp(g.h, 1080 + 2 * V.border, expand),
  };
  const page = tween(f, 75, 8, 0, 1, E.out); // 底色：白 → 纸
  const oldOut = 1 - tween(f, 75, 4, 0, 1, E.out);
  const newIn = tween(f, 75, 4, 0, 1, E.out);
  const textOut = 1 - tween(f, 101, 6, 0, 1, E.out);
  const preOut = 1 - tween(f, 75, 6, 0, 1, E.in);
  const pop = (at: number) => (f >= at ? slam(f, at) : 0);
  const cur2 = tween(f, 86, 10, 0, 1, E.inOut);
  const dy = thud(f, [
    [30, 6],
    [75, 10],
  ]);
  return (
    <AbsoluteFill style={{background: page >= 1 ? C.paper : `color-mix(in srgb, ${C.paper} ${page * 100}%, #FFFFFF)`}}>
      <div style={{position: 'absolute', inset: 0, backgroundImage: `radial-gradient(${C.ink} 1.8px, transparent 2.2px)`, backgroundSize: '30px 30px', backgroundPosition: '15px 15px', opacity: 0.16 * page}} />
      <div style={{position: 'absolute', inset: 0, transform: `translateY(${dy}px)`}}>
        {/* 默认样式的网页 */}
        {preOut > 0 && (
          <div style={{opacity: preOut}}>
            <div style={{position: 'absolute', left: PRE.x + 4, top: 520, ...serif(54), color: C.ink}}>This page has no CSS yet.</div>
            <div style={{position: 'absolute', left: PRE.x + 4, top: 610, ...serif(54), color: C.link, textDecoration: 'underline'}}>Read more</div>
            <div
              style={{
                position: 'absolute',
                left: PRE.x + 4,
                top: 710,
                padding: '12px 36px',
                background: 'linear-gradient(#FDFDFD, #E3E3E3)',
                border: '1px solid #8F8F8F',
                borderRadius: 4,
                fontFamily: 'Arial, Liberation Sans, sans-serif',
                fontSize: 42,
                color: C.ink,
              }}
            >
              Submit
            </div>
          </div>
        )}
        {/* 新粗野主义的网页 */}
        {f >= 78 && (
          <>
            <div style={{position: 'absolute', left: 960, top: 640, transform: `translate(-50%, 0) scale(${lerp(1.3, 1, pop(78))})`, opacity: clamp((f - 78) / 3), ...sc(104, 900, 0.04), color: C.ink}}>
              新粗野主义
            </div>
            <Box x={500} y={820} w={380} h={110} fill={C.pink} shadow={14} scale={lerp(0, 1, pop(82))} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <span style={{...sc(44, 900)}}>按下去 →</span>
            </Box>
            <Box x={930} y={820} w={490} h={110} fill={C.lime} shadow={14} r={55} scale={lerp(0, 1, pop(86))} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <span style={{...grot(42, 700)}}>2021 → NOW</span>
            </Box>
          </>
        )}
        {/* 标题块 */}
        {f >= 14 && (
          <Box
            x={box.x}
            y={box.y}
            w={box.w}
            h={box.h}
            fill="transparent"
            border={stamp ? V.border : 0}
            shadow={14 * shadowK * (1 - expand)}
            p={pr * (1 - expand)}
            scale={stampScale}
            style={{background: fillK >= 1 ? C.yellow : `linear-gradient(90deg, ${C.yellow} ${fillK * 100}%, transparent ${fillK * 100}%)`}}
          >
            <div style={{position: 'absolute', left: 40, top: 24, opacity: oldOut, ...serif(128, 700), color: C.ink}}>Neo-Brutalism</div>
            {f >= 75 && (
              <div style={{position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%, -50%) scale(${lerp(0.62, 1, grow)})`, opacity: newIn * textOut, ...disp(140, 112), color: C.ink}}>
                NEO-BRUTALISM
              </div>
            )}
          </Box>
        )}
        <CodeChips f={f} />
      </div>
      {/* 第一帧的海报：按下 → 炸开；炸开时底色立刻让开，露出底下的网页 */}
      {ex < 1 && <Poster p={hookP} ex={ex} bg={1 - clamp(ex * 4)} />}
      {f >= 1 && f < 20 && <Cursor x={lerp(1960, POSTER_PRESS.x, cur1)} y={lerp(1140, POSTER_PRESS.y, cur1)} p={hookP} opacity={1 - tween(f, 15, 4)} />}
      <Burst x={POSTER_PRESS.x} y={POSTER_PRESS.y} f={f} at={10} />
      {f >= 86 && f < 104 && <Cursor x={lerp(1780, 1420, cur2)} y={lerp(1100, 430, cur2)} p={pr} />}
      <Burst x={1420} y={430} f={f} at={96} />
    </AbsoluteFill>
  );
};
