/**
 * Design Style · 布局 03 · Card Stack 卡片层叠 —— 18 秒短片（1920×1080 · 60fps · 120 BPM）
 *
 * 全片 4 张卡片，同一叠从进场走到收束：
 *   0.0–2.0s  01 定义     四张卡从下方弹进层叠：3–4 张，一张焦点
 *   2.0–4.0s  02 焦点     顶卡轻抬、微旋，后层压暗 + 景深
 *   4.0–7.0s  03 换页     两次产品式切换：顶卡沿弧线离开，其余弹簧递补
 *   7.0–10.0s 04 何时用   同一叠换皮：任务队列 → iOS sheet → Stripe
 *  10.0–13.5s 05 规则     线框 + 五条规则 + 测量
 *  13.5–16.0s 06 常见坑   先叠太多，再铺平没有焦点，再弹回正确
 *  16.0–18.0s 片尾        收成小图标 · @guanmo_ai
 */
import React from 'react';
import {AbsoluteFill, Audio, interpolateColors, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {E, tween} from '../../../src/lib/anim';
import {Grain} from '../../../src/lib/Grain';
import {C} from '../tokens';
import {CardFace, GhostFace, Sheet} from './cards';
import {DURATION, GHOSTS, HIT, N, SCENE, ghostPose, originAt, poseAt, skinAt} from './layout';
import {Annotations, CycleCaption, EndTitle, FocusCaption, Hud, KeyCaption, PitCaption, RulesPanel, WhenCaption} from './scenes';

export const CARDSTACK_DURATION = DURATION;

let fontsLoaded = false;
const loadFonts = () => {
  if (fontsLoaded) return;
  fontsLoaded = true;
  const F = (family: string, file: string, weight: string) =>
    loadFont({family, url: staticFile(`fonts/${file}`), weight, format: file.endsWith('.otf') ? 'opentype' : 'truetype'});
  F('Inter Display', 'InterDisplay-Medium.ttf', '500');
  F('Inter Display', 'InterDisplay-SemiBold.ttf', '600');
  F('Inter Display', 'InterDisplay-Bold.ttf', '700');
  F('Inter', 'Inter-Regular.ttf', '400');
  F('Inter', 'Inter-Medium.ttf', '500');
  F('Inter', 'Inter-SemiBold.ttf', '600');
  F('Geist Mono', 'GeistMono-Regular.ttf', '400');
  F('Geist Mono', 'GeistMono-Medium.ttf', '500');
  F('Noto Sans SC', 'NotoSansSC-Regular.otf', '400');
  F('Noto Sans SC', 'NotoSansSC-Medium.otf', '500');
  F('Noto Sans SC', 'NotoSansSC-Bold.otf', '700');
  F('Noto Sans SC', 'NotoSansSC-Black.otf', '900');
};

const bgAt = (f: number) => {
  const paper = C.paper;
  const mist = '#EEF0F3';
  const a = tween(f, HIT.RULES - 8, 20, 0, 1, E.inOut);
  const b = tween(f, HIT.RESTORE, 24, 0, 1, E.inOut);
  return interpolateColors(a * (1 - b * 0.85), [0, 1], [paper, mist]);
};

const on = (f: number, s: {in: number; out: number}, pre = 8, post = 12) => f >= s.in - pre && f < s.out + post;

export const CardStack: React.FC<{music?: boolean}> = ({music = true}) => {
  React.useState(loadFonts);
  const f = useCurrentFrame();
  const origin = originAt(f);
  const skin = skinAt(f);
  const cam = 1.028 - 0.028 * tween(f, 0, 90, 0, 1, E.out) + 0.008 * (f / DURATION);
  const tiltX = 1.6;
  const tiltY = Math.sin(f / 70) * 1.4;
  return (
    <AbsoluteFill style={{background: bgAt(f), overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${cam})`, transformOrigin: '960px 520px'}}>
        <div
          style={{
            position: 'absolute',
            left: origin.x,
            top: origin.y,
            width: 0,
            height: 0,
            perspective: 1600,
            perspectiveOrigin: '50% 40%',
            transformStyle: 'preserve-3d',
            transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
          }}
        >
          {Array.from({length: N}, (_, i) => {
            const pose = poseAt(f, i);
            return (
              <Sheet key={i} pose={pose} z={40 - pose.slot} skin={skin}>
                <CardFace f={f} i={i} o={1} />
              </Sheet>
            );
          })}
          {Array.from({length: GHOSTS}, (_, g) => {
            const pose = ghostPose(f, g);
            if (!pose) return null;
            return (
              <Sheet key={`g${g}`} pose={pose} z={10 - g} skin="pit">
                <GhostFace g={g} />
              </Sheet>
            );
          })}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{zIndex: 80}}>
        {on(f, SCENE.KEY) && <KeyCaption f={f} />}
        {on(f, SCENE.FOCUS) && <FocusCaption f={f} />}
        {on(f, SCENE.CYCLE) && <CycleCaption f={f} />}
        {on(f, SCENE.WHEN) && <WhenCaption f={f} />}
        {on(f, SCENE.RULES) && <RulesPanel f={f} />}
        {on(f, SCENE.RULES) && <Annotations f={f} />}
        {on(f, SCENE.PIT) && <PitCaption f={f} />}
        {f >= SCENE.END.in - 8 && <EndTitle f={f} />}
        <Hud f={f} />
      </AbsoluteFill>
      <Grain opacity={0.028} />
      {music && <Audio src={staticFile('03-card-stack/music.wav')} />}
    </AbsoluteFill>
  );
};
