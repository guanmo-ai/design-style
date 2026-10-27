/**
 * Design Style · 风格 013 · 装饰艺术 Art Deco —— 20 秒短片（1920×1080 · 60fps · 120 BPM 摇摆，不变速）
 *
 * 规矩只有一条：镜像——所有东西沿中轴左右对称地出现、运动、消失。金是光：高光顺着金线跑，落点上亮一颗星芒。
 * 一镜到底，没有一次淡入淡出式的换场：
 *   0.0–1.5s   开场    第一帧 = 海报；光顺着画框从中轴往两边跑；楼沉进地面、射线收拢；镜头推进拱窗
 *   1.5–4.5s   01 三线  穿过一串三线拱门（每半拍擦过一道，真纵深），停在一扇十二辐玫瑰窗前
 *   4.5–8.0s   02 放射  玫瑰窗变成十二瓣万花筒：扇、人字、菱形往外流，每拍一次脉冲；射线射出；塌成地平线上的太阳
 *   8.0–13.0s  03 阶梯  夜景天际线三层纵深升起，探照灯成对交叉；镜头贴着主楼一路上升，1925 → 1939；
 *                      拱冠一层层亮起、尖顶射出、探照灯汇到尖顶；猛地拉远
 *  13.0–16.0s  五条规则 五块牌子从纵深里翻转着飞到面前，母题自己动起来；然后一起冲向镜头
 *  16.0–20.0s  片尾    中轴落下，ART / DECO 一笔一笔画出来，画框从中轴拉开，楼重新长高，光跑一圈——停在第一帧
 */
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Freeze, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {C} from '../tokens';
import {AT, DURATION} from './timeline';
import {Ending, Opening} from './poster';
import {Tunnel} from './tunnel';
import {Kaleido} from './kaleido';
import {City} from './city';
import {Rules} from './rules';
import {GoldDefs, H, Plaque, W, loadFonts} from './ui';

export const ARTDECO_DURATION = DURATION;

const Stage: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
      <defs>
        <GoldDefs />
      </defs>
      <rect width={W} height={H} fill={C.onyx} />
      <Tunnel f={f} />
      <Opening f={f} />
      <Kaleido f={f} />
      <City f={f} />
      <Rules f={f} />
      <Ending f={f} />
      <Plaque f={f} at={AT.tunnel + 16} out={AT.tunnel + 88} title="一线变三线" sub="一粗两细，间距 ≈ 粗线 × 3" />
      <Plaque f={f} at={AT.tunnel + 94} out={AT.kaleido - 6} title="阶梯切角" sub="转角用两级台阶，不用圆角" />
      <Plaque f={f} at={AT.title + 20} out={AT.title + 104} title="金只给线" sub="大面积用黑托住，整屏只有一块实心金" />
    </svg>
  );
};

/**
 * 运动模糊：快门 180°，8 次采样，取平均。
 * 不用 @remotion/motion-blur 的 CameraMotionBlur：它把每个采样以 1/n 不透明度 plus-lighter 相加，
 * 每一层都要先量化到 8 位，深色渐变会被量化成 8 级一档的色带，还偏绿。
 * 这里改成普通叠加、第 k 层不透明度 1/k（逐层求平均）：结果同样是平均值，但不动的地方逐像素不变。
 */
const Blur: React.FC<{samples: number; shutter: number; children: React.ReactNode}> = ({samples, shutter, children}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {Array.from({length: samples}, (_, i) => {
        const t = Math.max(0, f - shutter * (1 - i / (samples - 1)));
        return (
          <AbsoluteFill key={i} style={{opacity: 1 / (i + 1)}}>
            <Freeze frame={t}>{children}</Freeze>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

export const ArtDeco: React.FC<{music?: boolean; blur?: number}> = ({music = true, blur = 8}) => {
  const [ready] = useState(() => delayRender('art-deco-fonts'));
  useEffect(() => {
    loadFonts().then(() => continueRender(ready));
  }, [ready]);
  return (
    <AbsoluteFill style={{background: C.onyx}}>
      {blur > 1 ? (
        <Blur samples={blur} shutter={0.5}>
          <Stage />
        </Blur>
      ) : (
        <Stage />
      )}
      {music && <Audio src={staticFile('013-art-deco/music.wav')} />}
    </AbsoluteFill>
  );
};
