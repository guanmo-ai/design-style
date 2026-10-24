/**
 * Design Style · 风格 008 · 孔版印刷 Risograph —— 15 秒短片（1920×1080 · 60fps · 120 BPM）
 *
 * 全片都是“印”出来的：每一种油墨一张版，版和版之间正片叠底；套不准、颗粒、网点都是这台机器自己的东西。
 *   0.0–2.0s   开场    三张版飞进来砸在一起 → RISOGRAPH 逐字母升起 → 镜头钻进 O 的孔
 *   2.0–4.0s   孔版    热敏头在版纸上烧孔，粉墨从孔里挤到纸上
 *   4.0–6.0s   分色    同构图再过青绿 / 芥末黄 / 黑三遍，四张版扇开
 *   6.0–8.0s   叠印    三圆相交，三种油墨叠出七种颜色
 *   8.0–10.0s  小志    纸一张张飞出来：教材 → 社刊 → 小志 → 画册
 *  10.0–12.5s  五个词  专色 / 叠印 / 套不准 / 网点 / 颗粒
 *  12.5–15.0s  片尾    商店海报落回，署名 @guanmo_ai
 */
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {E, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {Opening} from './opening';
import {Paper, Plate, TextureStyles, preloadTextures} from './riso';
import {End, Overprint, Passes, Stencil, Words, Zine} from './scenes';
import {AT, CHAPTERS, DURATION, sheets} from './timeline';
import {loadFonts, mono, sc} from './ui';

export const RISOGRAPH_DURATION = DURATION;

const Hud: React.FC<{f: number}> = ({f}) => {
  const hide = tween(f, 96, 16) * (1 - tween(f, AT.stencil + 8, 12)) + tween(f, AT.words - 4, 8) * (1 - tween(f, AT.end - 4, 10));
  const o = (1 - hide * 0.85) * tween(f, 18, 16, 0, 1, E.out) * (1 - tween(f, 880, 16));
  if (o <= 0.01) return null;
  let k = 0;
  CHAPTERS.forEach(([, , at], j) => {
    if (f >= at) k = j;
  });
  const p = tween(f, CHAPTERS[k][2], 14, 0, 1, E.out);
  return (
    <Plate ink="black" f={f} grain="solid" density={0.82} boil={false} style={{opacity: o, mixBlendMode: 'multiply'}}>
      <div style={{position: 'absolute', left: 80, right: 80, top: 36, height: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
        <div>
          <span style={{...mono(16, 700, 0.12)}}>RISOGRAPH</span>
          <span style={{...sc(16, 500, 0.08), marginLeft: 12}}>孔版印刷</span>
        </div>
        <div style={{opacity: 0.3 + 0.7 * p, transform: `translateY(${(1 - p) * 10}px)`}}>
          <span style={{...mono(16, 700, 0.08), marginRight: 12}}>{`0${k + 1} / 0${CHAPTERS.length}`}</span>
          <span style={{...sc(16, 700, 0.06)}}>{CHAPTERS[k][0]}</span>
        </div>
      </div>
      <div style={{position: 'absolute', left: 80, right: 80, top: 1044, height: 22, display: 'flex', justifyContent: 'space-between', ...mono(13, 400, 0.1)}}>
        <span>SHOP · RUN #047 · {String(sheets(f)).padStart(2, '0')} / 30</span>
        <span>120 ppm · 3-ink · grain</span>
      </div>
    </Plate>
  );
};

const Stage: React.FC = () => {
  const f = useCurrentFrame();
  const on = (a: number, b: number) => f >= a && f < b;
  return (
    <AbsoluteFill style={{background: C.paper, overflow: 'hidden'}}>
      <TextureStyles />
      <Paper>
        {on(0, AT.stencil + 6) && <Opening f={f} />}
        {on(AT.stencil - 2, AT.passes + 4) && <Stencil f={f} />}
        {on(AT.passes - 2, AT.overprint + 4) && <Passes f={f} />}
        {on(AT.overprint - 2, AT.zine + 4) && <Overprint f={f} />}
        {on(AT.zine - 2, AT.words + 2) && <Zine f={f} />}
        {on(AT.words - 4, AT.end + 8) && <Words f={f} />}
        {on(AT.end - 10, 1e9) && <End f={f} />}
        <Hud f={f} />
      </Paper>
    </AbsoluteFill>
  );
};

export const Risograph: React.FC<{music?: boolean; blur?: number}> = ({music = true, blur = 5}) => {
  const [ready] = useState(() => delayRender('risograph-assets'));
  useEffect(() => {
    Promise.all([loadFonts(), preloadTextures()]).then(() => continueRender(ready));
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
      {music && <Audio src={staticFile('008-risograph/music.wav')} />}
    </AbsoluteFill>
  );
};
