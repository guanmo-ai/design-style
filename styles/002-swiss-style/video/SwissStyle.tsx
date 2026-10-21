/**
 * Design Style · 风格 002 · 瑞士国际主义 Swiss Style —— 15 秒短片（1920×1080 · 60fps · 120 BPM）
 *
 * v4 · 不讲课，只把这种风格的每一面都做到最满。
 * 全片只用一张 12 栏 × 6 行的网格（模块 122 × 122、间距 24）、一种无衬线（TeX Gyre Heros，Helvetica 的开源替代）、
 * 一种彩色（瑞士红）。每一幕只有一个红色主角，换幕时它直接变成下一幕的红色主角（“红色接力”）：
 *   0.0–0.5s   波      72 个模块沿对角线闪过，右上 9 个红模块合成红方块
 *   0.5–2.0s   标题    Swiss / Style 逐字母升起，信息栏落在网格上
 *   2.0–3.7s   网格    同一组元素每拍重排：12 栏 = 2 × 6 = 3 × 4 = 4 × 3 = 6 × 2；压在红块上的字自动反白
 *   3.7–6.0s   字体    整版甩出画面，镜头沿 968px 的 Helvetica 滑过去；Neue Haas Grotesk → Helvetica；a 变红，镜头扎进去
 *   6.0–8.0s   海报    红色铺满全屏 → 收成第一张海报；点阵、同心圆两张跟着上
 *   8.0–10.0s  地铁    黑海报拉成 1970 年纽约地铁的标识带，第二块牌子滑进来
 *  10.0–12.5s  五个词  标识带铺满全屏；网格 / 无衬线 / 左对齐 / 不对称 / 客观，一拍一个
 *  12.5–15s   片尾    红方块落回右上角
 * 开场见 opening.tsx，其余场景见 scenes.tsx，网格与排版工具见 ui.tsx，时间轴见 ../process/timeline.json
 */
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {E, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {gr, GridLines, sc} from './ui';
import {AT, End, EXPAND, MORPH, P1_AT, Posters, Subway, Words, ZOOM, zoomPan, zoomScale} from './scenes';
import {camX, Flashes, Machine, TW, TypeLabels, TypeWorld, Wave} from './opening';

export const SWISS_DURATION = 900;

// 底部 HUD 的章节：[名字, 开始帧]
const CHAPTERS: [string, number][] = [
  ['网格', AT.grid],
  ['字体', AT.type],
  ['海报', AT.poster],
  ['纽约地铁', AT.subway],
];

let fontsLoaded = false;
const loadFonts = () => {
  if (fontsLoaded) return;
  fontsLoaded = true;
  const F = (family: string, file: string, weight: string) =>
    loadFont({family, url: staticFile(`fonts/${file}`), weight, format: file.endsWith('.otf') ? 'opentype' : 'truetype'});
  F('TeX Gyre Heros', 'TeXGyreHeros-Regular.otf', '400');
  F('TeX Gyre Heros', 'TeXGyreHeros-Bold.otf', '700');
  F('Noto Sans SC', 'NotoSansSC-Regular.otf', '400');
  F('Noto Sans SC', 'NotoSansSC-Medium.otf', '500');
  F('Noto Sans SC', 'NotoSansSC-Bold.otf', '700');
  F('Noto Sans SC', 'NotoSansSC-Black.otf', '900');
};

/** 底部 HUD：左边片名，右边“章节号 / 总数 + 章节名”；镜头扎进红色、五个词的时候让开 */
const Hud: React.FC<{f: number}> = ({f}) => {
  const o = tween(f, AT.grid, 14) * (1 - tween(f, ZOOM.at, 8) + tween(f, AT.poster + 20, 12)) * (1 - tween(f, EXPAND, 8));
  if (o <= 0.001) return null;
  let k = 0;
  CHAPTERS.forEach(([, at], j) => {
    if (f >= at) k = j;
  });
  const p = tween(f, CHAPTERS[k][1], 14, 0, 1, E.out);
  return (
    <div style={{position: 'absolute', left: 96, right: 96, top: 1022, height: 30, opacity: o, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
      <div style={{display: 'flex', alignItems: 'baseline'}}>
        <span style={{...gr(20, 700, -0.01), color: C.ink}}>Swiss Style</span>
        <span style={{...sc(18, 500, 0.06), color: C.grey, marginLeft: 12}}>瑞士国际主义</span>
      </div>
      <div style={{display: 'flex', alignItems: 'baseline', opacity: 0.25 + 0.75 * p, transform: `translateY(${(1 - p) * 14}px)`}}>
        <span style={{...gr(19, 700, 0), color: C.red, marginRight: 14}}>{`0${k + 1} / 0${CHAPTERS.length}`}</span>
        <span style={{...sc(19, 500, 0.04), color: C.ink}}>{CHAPTERS[k][0]}</span>
      </div>
    </div>
  );
};

/** 画面本身（运动模糊会把它在一帧之内渲染好几次） */
const Stage: React.FC = () => {
  const f = useCurrentFrame();
  const on = (a: number, b: number) => f >= a && f < b;
  const z = zoomScale(f);
  const pan = zoomPan(f);
  const cam = camX(f);
  // 甩镜太快（最快 320px/帧），6 次采样之间会有台阶：再叠一层只沿水平方向的模糊，把台阶抹平
  const whip = Math.max(0, (camX(f + 0.25) - camX(f - 0.25)) * 2) / 24;
  const whipId = `whip-${Math.round(f * 1000)}`;
  return (
    <AbsoluteFill style={{background: C.paper, overflow: 'hidden'}}>
      {/* 镜头层：波 → 标题 → 网格机器 →（甩镜）→ 字体；最后从这里扎进红色的 a */}
      <div style={{position: 'absolute', inset: 0, transform: z !== 1 ? `translate(${pan.x}px, ${pan.y}px) scale(${z})` : undefined, transformOrigin: `${ZOOM.x}px ${ZOOM.y}px`}}>
        <GridLines f={f} at={0} />
        {on(0, 34) && <Wave f={f} />}
        {whip > 0.5 && (
          <svg width={0} height={0} style={{position: 'absolute'}}>
            <filter id={whipId} x="-5%" y="0" width="110%" height="100%">
              <feGaussianBlur stdDeviation={`${whip} 0`} />
            </filter>
          </svg>
        )}
        <div style={{position: 'absolute', inset: 0, transform: cam ? `translateX(${-cam}px)` : undefined, filter: whip > 0.5 ? `url(#${whipId})` : undefined}}>
          {on(0, 246) && <Machine f={f} />}
          {on(222, AT.poster) && (
            <div style={{position: 'absolute', left: TW, top: 0, width: 1920, height: 1080}}>
              <TypeWorld f={f} />
            </div>
          )}
        </div>
        {on(0, 232) && <Flashes f={f} />}
        {on(240, AT.poster) && <TypeLabels f={f} />}
      </div>
      {on(P1_AT, MORPH + 24) && <Posters f={f} />}
      {on(MORPH, AT.words + 2) && <Subway f={f} />}
      {on(AT.words, AT.end + 12) && <Words f={f} />}
      {on(AT.end - 13, 1e9) && <End f={f} />}
      <Hud f={f} />
    </AbsoluteFill>
  );
};

export const SwissStyle: React.FC<{music?: boolean; blur?: number}> = ({music = true, blur = 6}) => {
  loadFonts();
  return (
    <AbsoluteFill style={{background: C.paper}}>
      {blur > 1 ? (
        <CameraMotionBlur shutterAngle={180} samples={blur}>
          <Stage />
        </CameraMotionBlur>
      ) : (
        <Stage />
      )}
      {music && <Audio src={staticFile('002-swiss-style/music.wav')} />}
    </AbsoluteFill>
  );
};
