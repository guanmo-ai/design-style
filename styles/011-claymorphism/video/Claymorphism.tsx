/**
 * Design Style · 风格 011 · Claymorphism 粘土拟态 —— 24 秒短片（1920×1080 · 60fps · 120 BPM）
 *
 * 一招：胖圆角 + 内外成对阴影 = 捏出来的体积。全片同一颗蜜桃粘土接力：
 *   0.0–4.0s   开场    面团落下，第一拍掐成按钮；CLAY 四块字母弹出
 *   4.0–8.0s   圆角    按钮胀成卡片，四角依次变胖；尖卡被捏走
 *   8.0–12.0s  阴影    光球绕卡片，内高光对外阴影；扁平卡被体积吞掉
 *  12.0–16.0s  软色    四团 pastel 揉进来，三下挤捏
 *  16.0–20.0s  产品    同一颗按钮落进 PINCH 焦点应用：开关 / 滑杆 / 层叠
 *  20.0–24.0s  片尾    粘土信息幕：Claymorphism / 粘土拟态 / 带走句 / 底栏
 */
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {C} from '../tokens';
import {HeroClay, Paper, camOf, heroOf} from './clay';
import {Opening} from './opening';
import {Corners, End, HeroFace, Pastel, Product, Shadows} from './scenes';
import {AT, DURATION} from './timeline';
import {Hud, loadFonts} from './ui';

export const CLAYMORPHISM_DURATION = DURATION;

const Stage: React.FC = () => {
  const f = useCurrentFrame();
  const on = (a: number, b: number) => f >= a && f < b;
  const cam = camOf(f);
  const light = heroOf(f).light;
  return (
    <AbsoluteFill style={{background: C.paper, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          scale: cam.scale,
          translate: `${cam.x}px ${cam.y}px`,
        }}
      >
        <Paper f={f} light={light} />
        {on(0, AT.corners + 8) && <Opening f={f} />}
        {on(AT.pastel - 8, AT.product + 10) && <Pastel f={f} />}
        {on(AT.product - 12, AT.end + 8) && <Product f={f} />}
        <HeroClay f={f} />
        <HeroFace f={f} />
        {on(AT.corners - 8, AT.shadows + 12) && <Corners f={f} />}
        {on(AT.shadows - 10, AT.pastel + 12) && <Shadows f={f} />}
        {on(AT.end - 16, 1e9) && <End f={f} />}
      </div>
      <Hud f={f} />
    </AbsoluteFill>
  );
};

export const Claymorphism: React.FC<{music?: boolean; blur?: number}> = ({music = true, blur = 4}) => {
  const [ready] = useState(() => delayRender('claymorphism-assets'));
  useEffect(() => {
    loadFonts().then(() => continueRender(ready));
  }, [ready]);
  return (
    <AbsoluteFill style={{background: C.paper}}>
      {blur > 1 ? (
        <CameraMotionBlur shutterAngle={180} samples={blur}>
          <Stage />
        </CameraMotionBlur>
      ) : (
        <Stage />
      )}
      {music && <Audio src={staticFile('011-claymorphism/music.wav')} />}
    </AbsoluteFill>
  );
};
