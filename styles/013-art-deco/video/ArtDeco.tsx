/**
 * Design Style · 风格 013 · 装饰艺术 Art Deco —— 20 秒短片（1920×1080 · 60fps · 120 BPM 摇摆，不变速）
 *
 * 全片只有一条规矩：镜像。所有东西从中轴向左右同时长出来，退场时合回中轴；连字幕也从中轴劈成两半。
 * 一条金线接力到底：海报中缝 → 三线 → 画框 → 楼的中肋与尖顶 → 拱窗 → 手机头图 → 再合回海报。
 *   0.0–2.0s   开场    第一帧 = 海报；海报就是电梯门，中缝一亮，向两边打开，只剩一条金线
 *   2.0–5.0s   01 中轴  一线变三线（一粗两细，间距 = 粗 × 3）→ 三线向左右同时拉开，变成整片的画框
 *   5.0–8.0s   02 阶梯  台基、翼楼、主楼、收分、五层拱冠、尖顶一级级长高，镜头跟着往上摇
 *   8.0–10.0s  03 放射  镜头拉远；太阳藏在楼后，射线像折扇一样打开；拱窗两半在头顶合拢
 *  10.0–13.0s  04 来历  楼顶换三次：巴黎 1925 → 上海 1929（绿铜金字塔）→ 纽约 1930（克莱斯勒）
 *  13.0–16.0s  05 应用  整座楼缩进手机的拱窗当头图；网页从自己的中轴打开；各按一下那块唯一的金
 *  16.0–18.0s  五条规则 中间一块先开，再一对一对往两边开：中轴 / 阶梯 / 放射 / 三线 / 金线
 *  18.0–20.0s  片尾    电梯门从两边合上，中缝一亮，回到海报；最后一帧 = 第一帧
 */
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {E, colorTrack, spr, tween} from '../../../src/lib/anim';
import {C, FONT} from '../tokens';
import {Apps, PhoneBack, PhoneExit, PhoneFront} from './apps';
import {BG_GLOW, Backdrop, Doors, Frame, Words, doors} from './finale';
import {AT, CHAPTERS, CITY_AT, DURATION} from './timeline';
import {Scene, camera} from './tower';
import {AX, Corner, Diamond, G, GV, GoldDefs, H, Pair, T, W, loadFonts, mix, stepRect} from './ui';

export const ARTDECO_DURATION = DURATION;

// ───────── 01 中轴：一线变三线，再向两边拉开成画框 ─────────
const Axis: React.FC<{f: number}> = ({f}) => {
  const on = 1 - tween(f, AT.zig + 160, 30);
  if (on <= 0) return null;
  const sp = tween(f, AT.axis + 2, 16, 0, 1, E.out);
  const thin = 1 - tween(f, AT.zig + 40, 30);
  const ping = tween(f, AT.axis, 3) * (1 - tween(f, AT.axis + 4, 26));
  // 门开之后：一粒光顺着中轴从上落到下，正好在 01 的拍点上落地
  const drop = tween(f, 66, 54, 0, 1, E.in);
  const dropOn = f > 66 && f < AT.axis + 2;
  return (
    <g opacity={on}>
      <path d={`M${AX} 0 V${H}`} stroke={G} strokeWidth={GV.thick} />
      {sp > 0 &&
        [-1, 1].map((s) => <path key={s} d={`M${AX + s * GV.gap * sp} 0 V${H}`} stroke={G} strokeWidth={GV.thin} opacity={thin} />)}
      {dropOn && (
        <g>
          <rect x={AX - 3} y={-260 + drop * (H + 60)} width={6} height={260} fill="url(#drop)" />
          <Diamond x={AX} y={drop * (H + 60) - 60} r={9} fill={C.goldLt} />
        </g>
      )}
      {ping > 0 && <path d={`M${AX} 0 V${H}`} stroke={C.goldLt} strokeWidth={GV.thick + 4 * ping} opacity={ping} />}
    </g>
  );
};

const FrameBuild: React.FC<{f: number}> = ({f}) => {
  const t0 = AT.axis + 85;
  if (f < t0) return null;
  const q = tween(f, t0, 46, 0, 1, E.inOut);
  const st = tween(f, t0 + 47, 12, 0, 1, E.out);
  if (st >= 1) return <Frame />;
  const ws = [GV.thick, GV.thin, GV.thin];
  const start = [0, GV.gap, GV.gap];
  return (
    <g>
      {ws.map((sw, i) => {
        const d = 40 + i * GV.gap;
        const hw = start[i] + q * (AX - d - start[i]);
        return <path key={i} d={stepRect(AX - hw, d, 2 * hw, H - 2 * d, st * Math.max(0, 18 - d * 0.35 + 14))} fill="none" stroke={G} strokeWidth={sw} />;
      })}
    </g>
  );
};

/** 四个角花：上面一对先，下面一对后 */
const Corners: React.FC<{f: number}> = ({f}) => {
  const t0 = AT.axis + 135;
  if (f < t0 || f > AT.axis + 170) return null;
  const P = (at: number) => tween(f, at, 16);
  return (
    <>
      <Corner x={92} y={92} sx={1} sy={1} p={P(t0)} />
      <Corner x={W - 92} y={92} sx={-1} sy={1} p={P(t0)} />
      <Corner x={92} y={H - 92} sx={1} sy={-1} p={P(t0 + 8)} />
      <Corner x={W - 92} y={H - 92} sx={-1} sy={-1} p={P(t0 + 8)} />
    </>
  );
};

// ───────── 字幕：每一句都从中轴劈成两半 ─────────
const Captions: React.FC<{f: number}> = ({f}) => {
  const [c1, c2, c3] = CITY_AT;
  return (
    <>
      <Pair f={f} id="ca" at={AT.axis + 8} out={AT.axis + 78} big={['一线', '变三线']} sub={['一粗两细', '间距 ≈ 粗线 × 3']} gap={110} />
      <Pair f={f} id="cb" at={AT.axis + 116} out={AT.zig} big={['中轴', '对称']} sub={['先画一条中轴', '左右同时长出来']} />
      <Pair f={f} id="cc" at={AT.zig + 34} out={AT.sun - 8} big={['阶梯', '收分']} sub={['越往上越窄', '转角用阶梯，不用圆角']} />
      <Pair f={f} id="cd" at={AT.sun + 46} out={AT.lineage - 6} big={['放射', '光芒']} sub={['光源藏在主体后面', '射线要细、要稀']} />
      <Pair f={f} id="ce" at={c1 + 10} out={c2 - 8} big={['1925', '巴黎']} sub={['装饰艺术博览会', '风格由此得名']} fam={[FONT.display, FONT.serif]} />
      <Pair f={f} id="cf" at={c2 + 10} out={c3 - 8} big={['1929', '上海']} sub={['外滩 · 沙逊大厦', '绿铜金字塔顶']} fam={[FONT.display, FONT.serif]} />
      <Pair f={f} id="cg" at={c3 + 10} out={AT.apps - 4} big={['1930', '纽约']} sub={['克莱斯勒大厦', '五层拱冠 + 尖顶']} fam={[FONT.display, FONT.serif]} />
      <Pair f={f} id="ch" at={AT.apps + 96} out={AT.words - 10} big={['金只给线', '整屏只有一块实心金']} gap={40} y={1000} bigSize={44} bigLs={0.12} fam={[FONT.serif, FONT.sc]} />
    </>
  );
};

// ───────── 楼层指示盘：每一章是一层 ─────────
const Dial: React.FC<{f: number}> = ({f}) => {
  const v = tween(f, AT.axis - 24, 18) * (1 - tween(f, AT.words - 10, 12));
  if (v <= 0.001) return null;
  let k = 0;
  CHAPTERS.forEach(([, , at], j) => {
    if (f >= at) k = j;
  });
  const cx = AX;
  const cy = 146;
  const ang = (j: number) => Math.PI + (Math.PI * (j + 0.5)) / 5;
  const prev = k === 0 ? ang(0) - 0.5 : ang(k - 1);
  const at = CHAPTERS[k][2];
  const a = prev + (ang(k) - prev) * (f < at ? 0 : spr(f, at, {damping: 9, mass: 0.6, stiffness: 160}));
  const sw = 1 - tween(f, at - 6, 6) * (1 - tween(f, at, 10));
  return (
    <g opacity={v}>
      <path d={`M${cx - 58} ${cy} A58 58 0 0 1 ${cx + 58} ${cy} Z`} fill={C.onyx} stroke={G} strokeWidth={3} />
      <path d={`M${cx - 48} ${cy} A48 48 0 0 1 ${cx + 48} ${cy}`} fill="none" stroke={G} strokeWidth={1.2} />
      {[0, 1, 2, 3, 4].map((j) => (
        <T key={j} x={cx + 36 * Math.cos(ang(j))} y={cy + 36 * Math.sin(ang(j)) + 5} size={14} weight={600} fill={j === k ? C.goldLt : C.smoke} anchor="middle">
          {j + 1}
        </T>
      ))}
      <path d={`M${cx} ${cy} L${cx + 50 * Math.cos(a)} ${cy + 50 * Math.sin(a)}`} stroke={C.goldLt} strokeWidth={3} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={6} fill={G} />
      <g opacity={sw}>
        <T x={cx - 90} y={cy - 8} size={26} weight={500} fill={G} ls={0.3} anchor="end">
          {`FLOOR 0${k + 1}`}
        </T>
        <T x={cx + 90} y={cy - 8} size={28} family={FONT.serif} weight={600} fill={C.ivory} ls={0.2}>
          {CHAPTERS[k][0]}
        </T>
        <T x={cx + 90 + 28 * 2 + 28 * 0.6 + 14} y={cy - 8} size={22} weight={500} fill={C.smoke} ls={0.24}>
          {CHAPTERS[k][1]}
        </T>
      </g>
    </g>
  );
};

const Stage: React.FC = () => {
  const f = useCurrentFrame();
  const [, c2, c3] = CITY_AT;
  const emer = mix(C.emerald, C.onyx, 0.5);
  const center = colorTrack(f, [
    [c2, BG_GLOW],
    [c2 + 18, emer],
    [c3 - 4, emer],
    [c3 + 16, BG_GLOW],
  ]);
  const sceneBg = colorTrack(f, [
    [c2, C.onyx],
    [c2 + 18, mix(C.emerald, C.onyx, 0.3)],
    [c3 - 4, mix(C.emerald, C.onyx, 0.3)],
    [c3 + 16, C.onyx],
  ]);
  const cam = camera(f);
  const live = doors(f) > 0;
  const sceneOn = f >= AT.zig - 1 && f < AT.words + 6;
  const scene = sceneOn && (
    <g transform={`translate(${cam.tx} ${cam.ty}) scale(${cam.s})`}>
      <Scene f={f} bg={sceneBg} />
    </g>
  );
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
      <defs>
        <GoldDefs f={f} />
        <linearGradient id="drop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.goldLt} stopOpacity={0} />
          <stop offset="1" stopColor={C.goldLt} stopOpacity={0.9} />
        </linearGradient>
      </defs>
      {live && (
        <>
          <Backdrop id="bg" center={center} />
          <Axis f={f} />
          {f >= AT.apps && f < AT.words + 6 ? (
            <>
              <Apps f={f} />
              <PhoneExit f={f}>
                <PhoneBack f={f} />
                {scene}
                <PhoneFront f={f} />
              </PhoneExit>
            </>
          ) : (
            scene
          )}
          <FrameBuild f={f} />
          <Corners f={f} />
          <Captions f={f} />
          <Words f={f} />
          <Dial f={f} />
        </>
      )}
      <Doors f={f} />
    </svg>
  );
};

// 运动模糊：快门 120°。装饰艺术要的是“精密”——模糊只抹平门、镜头和打开的那一下
export const ArtDeco: React.FC<{music?: boolean; blur?: number}> = ({music = true, blur = 6}) => {
  const [ready] = useState(() => delayRender('art-deco-fonts'));
  useEffect(() => {
    loadFonts().then(() => continueRender(ready));
  }, [ready]);
  return (
    <AbsoluteFill style={{background: C.onyx}}>
      {blur > 1 ? (
        <CameraMotionBlur shutterAngle={120} samples={blur}>
          <Stage />
        </CameraMotionBlur>
      ) : (
        <Stage />
      )}
      {music && <Audio src={staticFile('013-art-deco/music.wav')} />}
    </AbsoluteFill>
  );
};
