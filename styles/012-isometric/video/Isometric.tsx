/**
 * Design Style · 风格 012 · 等距 Isometric —— 24 秒短片（1920×1080 · 60fps · 120 BPM）
 *
 * 先锁轴角，再堆体积。
 *   0.0–3.5s   开场     扁平卡片锁上 30° 三轴，弹出体积
 *   3.5–8.5s   规则     锁轴角 / 等比例 / 无透视
 *   8.5–17.0s  建造     一块块堆出产品小世界（仪表、设备、通知）
 *  17.0–21.0s  变体     经典等距 / 军事斜二测 / 产品柔阴影
 *  21.0–24.0s  片尾     标题 + 口诀 + DESIGN STYLE 012 · @guanmo_ai · github
 */
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {E, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {Opening, camOf} from './opening';
import {BuildCaption, Drafting, End, Rules, Variants} from './scenes';
import {AT, CHAPTERS, DURATION, RULE} from './timeline';
import {loadFonts, mono, sc} from './ui';
import {World} from './world';

export const ISOMETRIC_DURATION = DURATION;

const FOOT: [number, string][] = [
  [0, 'FLAT CARD  →  LOCK 30° / 30°'],
  [RULE.axes, 'TRUE ISO  ·  120° BETWEEN AXES'],
  [RULE.scale, 'EQUAL UNIT  ·  1 : 1 : 1'],
  [RULE.persp, 'PARALLEL  ·  NO VANISHING POINT'],
  [AT.build, 'STACK THE VOLUME  ·  DEPTH BY OVERLAP'],
  [AT.variants, 'CLASSIC  ·  2:1 DIMETRIC  ·  PRODUCT'],
];

const Hud: React.FC<{f: number}> = ({f}) => {
  const o = tween(f, 16, 18, 0, 1, E.out) * (1 - tween(f, AT.end - 14, 14, 0, 1, E.soft));
  if (o <= 0.02) return null;
  let k = 0;
  CHAPTERS.forEach(([, , at], j) => {
    if (f >= at) k = j;
  });
  const p = tween(f, CHAPTERS[k][2], 14, 0, 1, E.out);
  let foot = FOOT[0][1];
  for (const [at, label] of FOOT) if (f >= at) foot = label;
  return (
    <>
      <div style={{position: 'absolute', left: 80, right: 80, top: 36, height: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', opacity: o}}>
        <div>
          <span style={{...mono(15, 500, 0.14), color: C.ink}}>ISOMETRIC</span>
          <span style={{...sc(16, 500, 0.08), color: C.muted, marginLeft: 12}}>等距</span>
        </div>
        <div style={{opacity: 0.3 + 0.7 * p, transform: `translateY(${(1 - p) * 10}px)`}}>
          <span style={{...mono(15, 500, 0.1), color: C.coral, marginRight: 12}}>{`0${k + 1} / 0${CHAPTERS.length}`}</span>
          <span style={{...sc(16, 700, 0.04), color: C.ink}}>{CHAPTERS[k][0]}</span>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 80,
          right: 80,
          top: 1044,
          height: 22,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          opacity: o * 0.9,
        }}
      >
        <span style={{...mono(13, 500, 0.1), color: C.ink}}>{foot}</span>
        <span>
          <span style={{...mono(12, 500, 0.1), color: C.coral}}>X 宽</span>
          <span style={{...mono(12, 500, 0.1), color: C.mint, marginLeft: 16}}>Y 高</span>
          <span style={{...mono(12, 500, 0.1), color: C.indigo, marginLeft: 16}}>Z 深</span>
        </span>
      </div>
    </>
  );
};

const Stage: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camOf(f);
  const on = (a: number, b: number) => f >= a && f < b;
  const buildOut = 1 - tween(f, AT.variants - 8, 18, 0, 1, E.soft);
  return (
    <AbsoluteFill style={{background: C.stage, overflow: 'hidden'}}>
      <Drafting f={f} />
      {on(0, AT.rules + 16) && <Opening f={f} cam={cam} />}
      {on(AT.rules - 6, AT.build + 10) && <Rules f={f} cam={cam} />}
      {on(AT.build - 10, AT.variants + 8) && buildOut > 0.01 && (
        <div style={{position: 'absolute', inset: 0, opacity: buildOut}}>
          <World f={f} cam={cam} showGrid showAxes={f < AT.build + 72} ui />
          <BuildCaption f={f} />
        </div>
      )}
      {on(AT.variants - 8, AT.end + 8) && <Variants f={f} cam={cam} />}
      {on(AT.end - 16, 1e9) && <End f={f} cam={cam} />}
      <Hud f={f} />
    </AbsoluteFill>
  );
};

export const Isometric: React.FC<{music?: boolean; blur?: number}> = ({music = true, blur = 5}) => {
  const [ready] = useState(() => delayRender('isometric-fonts'));
  useEffect(() => {
    loadFonts().then(() => continueRender(ready));
  }, [ready]);
  return (
    <AbsoluteFill style={{background: C.stage}}>
      {blur > 1 ? (
        <CameraMotionBlur shutterAngle={180} samples={blur}>
          <Stage />
        </CameraMotionBlur>
      ) : (
        <Stage />
      )}
      {music && <Audio src={staticFile('012-isometric/music.wav')} />}
    </AbsoluteFill>
  );
};
