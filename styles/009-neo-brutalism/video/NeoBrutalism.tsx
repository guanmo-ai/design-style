/**
 * Design Style · 风格 009 · 新粗野主义 Neo-Brutalism —— 15 秒短片（1920×1080 · 60fps · 120 BPM）
 *
 * 全片是一叠“卡片”：每一章都是一张带黑框和硬阴影的卡片，换章 = 上一张被推走、被按下、或下一张砸上来。
 *   0.0–2.0s   开场    没写 CSS 的网页 → 四行 CSS 一拍一行砸上去 → 按下标题，标题块撑满全屏
 *   2.0–4.0s   01 黑框  六个默认样式的组件，半拍一个描上 6px 黑框
 *   4.0–6.0s   02 硬影  模糊 40 → 0；偏移 8 / 24 / 14；三张卡片砸下来
 *   6.0–8.0s   03 按下  在记账 App 里按筹码、按条目、按“记一笔”
 *   8.0–10.0s  04 来历  1952 清水混凝土 → 2014 粗野主义网页 → 2021 新粗野主义界面
 *  10.0–12.5s  五个词  黑框 / 硬影 / 平涂 / 露结构 / 歪一点
 *  12.5–15.0s  片尾    海报三块砸回来，所有阴影一起按一下；署名 @guanmo_ai
 */
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {E, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {Opening} from './opening';
import {Borders, Lineage, Press, Shadows} from './scenes';
import {End, Words} from './finale';
import {AT, CHAPTERS, DURATION} from './timeline';
import {grot, loadFonts, mono, sc} from './ui';

export const NEOBRUTAL_DURATION = DURATION;

/** 顶部两枚“筹码”：左边风格名，右边章节；开场、五个词、片尾让开 */
const Hud: React.FC<{f: number}> = ({f}) => {
  const on = tween(f, AT.border + 6, 10) * (1 - tween(f, AT.words - 8, 6));
  if (on <= 0.01) return null;
  let k = 0;
  CHAPTERS.forEach(([, , at], j) => {
    if (f >= at - 2) k = j;
  });
  const flip = tween(f, CHAPTERS[k][2] - 2, 8, 0, 1, E.out);
  const y = (1 - on) * -90;
  return (
    <>
      <div style={{position: 'absolute', left: 96, top: 40 + y, height: 52, padding: '0 22px', display: 'flex', alignItems: 'center', gap: 14, background: C.ink, color: C.yellow, border: `4px solid ${C.ink}`}}>
        <span style={{...grot(22, 700, 0.04)}}>NEO-BRUTALISM</span>
        <span style={{...sc(22, 700, 0.06)}}>新粗野主义</span>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 96,
          top: 40 + y,
          height: 52,
          padding: '0 22px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: C.white,
          border: `4px solid ${C.ink}`,
          boxShadow: `6px 6px 0 ${C.ink}`,
          transform: `translateY(${(1 - flip) * -8}px)`,
        }}
      >
        <span style={{...mono(22, 700)}}>{`0${k + 1} / 0${CHAPTERS.length}`}</span>
        <span style={{...sc(22, 900, 0.06)}}>{CHAPTERS[k][0]}</span>
        <span style={{...grot(20, 700, 0.06)}}>{CHAPTERS[k][1]}</span>
      </div>
    </>
  );
};

const Stage: React.FC = () => {
  const f = useCurrentFrame();
  const on = (a: number, b: number) => f >= a && f < b;
  return (
    <AbsoluteFill style={{background: C.paper, overflow: 'hidden'}}>
      {/* 后画的盖在上面：换章时下一章先在底下铺好，或者从外面砸进来 */}
      {on(AT.lineage - 20, AT.words + 14) && <Lineage f={f} />}
      {on(AT.shadow - 20, AT.press + 2) && <Shadows f={f} />}
      {on(AT.press - 16, AT.lineage) && <Press f={f} />}
      {on(AT.border - 2, AT.shadow) && <Borders f={f} />}
      {on(0, AT.border) && <Opening f={f} />}
      {on(AT.end - 16, 1e9) && <End f={f} />}
      {on(AT.words - 8, AT.end + 20) && <Words f={f} />}
      <Hud f={f} />
    </AbsoluteFill>
  );
};

// 运动模糊：快门 120°、8 次采样。新粗野主义要的是硬边——模糊只用来抹平最快的砸和推，不能拖出残影
export const NeoBrutalism: React.FC<{music?: boolean; blur?: number}> = ({music = true, blur = 8}) => {
  const [ready] = useState(() => delayRender('neo-brutalism-fonts'));
  useEffect(() => {
    loadFonts().then(() => continueRender(ready));
  }, [ready]);
  return (
    <AbsoluteFill style={{background: C.paper}}>
      {blur > 1 ? (
        <CameraMotionBlur shutterAngle={120} samples={blur}>
          <Stage />
        </CameraMotionBlur>
      ) : (
        <Stage />
      )}
      {music && <Audio src={staticFile('009-neo-brutalism/music.wav')} />}
    </AbsoluteFill>
  );
};
