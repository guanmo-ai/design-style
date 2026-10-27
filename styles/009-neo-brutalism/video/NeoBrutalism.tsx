/**
 * Design Style · 风格 009 · 新粗野主义 Neo-Brutalism —— 15 秒短片（1920×1080 · 60fps · 120 BPM）
 *
 * 全片只有一条物理：阴影长度 = 离纸面的高度 z。抬起来阴影变长，落下去缩回，按下去归零。
 *   0.0–2.0s   开场    第一帧 = 片尾海报（循环无缝）→ 一按就炸开 → 十三颗键帽浮上来、打字、一起按下 → 镜头钻进 O
 *   2.0–4.0s   01 黑框  一支笔一笔画过去，把六个默认组件依次框起来 → 画布向左甩
 *   4.0–6.0s   02 硬影  模糊 40 → 0；卡片抬起、落下；摊成五层阶梯 → 最高那张蓝卡撑满全屏
 *   6.0–8.0s   03 按下  二十颗按钮落下；按一下，按压像水波一样扩散；全部按下，褪成混凝土
 *   8.0–10.0s  04 来历  同一面网格：1952 清水混凝土 → 2014 粗野主义网页 → 2021 新粗野主义；年份里程表
 *  10.0–12.5s  五个词  黑框 / 硬影 / 平涂 / 露结构 / 歪一点
 *  12.5–15.0s  片尾    海报三块砸回来，所有阴影一起按一下；署名 @guanmo_ai
 */
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {E, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {Opening} from './opening';
import {Borders, Grid, Shadows} from './scenes';
import {End, Words} from './finale';
import {AT, CHAPTERS, DURATION} from './timeline';
import {WHIP, grot, loadFonts, mono, sc} from './ui';

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
        <span style={{...grot(26, 700, 0.04)}}>NEO-BRUTALISM</span>
        <span style={{...sc(26, 700, 0.06)}}>新粗野主义</span>
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
        <span style={{...mono(26, 700)}}>{`0${k + 1} / 0${CHAPTERS.length}`}</span>
        <span style={{...sc(26, 900, 0.06)}}>{CHAPTERS[k][0]}</span>
        <span style={{...grot(24, 700, 0.06)}}>{CHAPTERS[k][1]}</span>
      </div>
    </>
  );
};

const Stage: React.FC = () => {
  const f = useCurrentFrame();
  const on = (a: number, b: number) => f >= a && f < b;
  // 01 → 02：同一张画布向左甩过去
  const whip = tween(f, AT.shadow - 18, 18, 0, 1, WHIP);
  return (
    <AbsoluteFill style={{background: C.paper, overflow: 'hidden'}}>
      {/* 后画的盖在上面 */}
      {on(AT.shadow - 20, AT.press + 1) && <Shadows f={f} dx={(1 - whip) * 1920} />}
      {on(AT.border - 2, AT.shadow) && <Borders f={f} dx={-whip * 1920} />}
      {on(AT.press, AT.words + 14) && <Grid f={f} />}
      {on(0, AT.border) && <Opening f={f} />}
      {on(AT.end - 16, 1e9) && <End f={f} />}
      {on(AT.words - 14, AT.end + 20) && <Words f={f} />}
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
