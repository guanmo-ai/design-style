/**
 * Design Style · 布局 03 · Card Stack v7 —— 22s · 1920×1080 · 60fps
 * 16 张卡贯穿。开场风暴同屏 16；8 种方案变形接力；14 种动效。
 */
import React from 'react';
import {AbsoluteFill, Audio, interpolateColors, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {E, shake, tween} from '../../../src/lib/anim';
import {Grain} from '../../../src/lib/Grain';
import {C} from '../tokens';
import {DECK, ExtraFace, EXTRA_DECK, Face} from './faces';
import {CAM_HITS, CARDS, COLOR_DUR, DURATION, EXTRAS, LayoutName, SCENE, TRANS, camAt, cardState, extraState, familyOf, motionBlurPx, poseVel} from './layout';
import {Count, EndTitle, Hud, PitMark} from './stage';

export const CARDSTACK_DURATION = DURATION;

let fontsLoaded = false;
const loadFonts = () => {
  if (fontsLoaded) return;
  fontsLoaded = true;
  const F = (family: string, file: string, weight: string) =>
    loadFont({family, url: staticFile(`fonts/${file}`), weight, format: file.endsWith('.otf') ? 'opentype' : 'truetype'});
  F('TeX Gyre Heros', 'TeXGyreHeros-Regular.otf', '400');
  F('TeX Gyre Heros', 'TeXGyreHeros-Bold.otf', '700');
  F('Geist Mono', 'GeistMono-Regular.ttf', '400');
  F('Geist Mono', 'GeistMono-Medium.ttf', '500');
  F('Noto Sans SC', 'NotoSansSC-Regular.otf', '400');
  F('Noto Sans SC', 'NotoSansSC-Medium.otf', '500');
  F('Noto Sans SC', 'NotoSansSC-Bold.otf', '700');
  F('Noto Sans SC', 'NotoSansSC-Black.otf', '900');
};

const bgFamily = (name: LayoutName) => {
  switch (familyOf(name)) {
    case 'OPEN':
      return C.night;
    case 'MAG':
      return C.paper;
    case 'LAYER':
      return C.night;
    case 'PROOF':
      return C.sand;
    case 'BOARD':
      return C.teal;
    case 'ALBUM':
      return C.bone;
    case 'NOTE':
      return '#1A1C20';
    case 'PAY':
      return '#1A1210';
    case 'FOLIO':
      return C.olive;
    case 'PIT':
      return name === 'FLAT' ? '#D4CBB8' : C.bone;
    default:
      return C.night;
  }
};

const bgAt = (f: number) => {
  let cur = bgFamily('STORM');
  let prev: LayoutName = 'STORM';
  for (const t of TRANS) {
    if (f < t.at) break;
    cur = interpolateColors(tween(f, t.at + 2, COLOR_DUR + 4, 0, 1, E.inOut), [0, 1], [bgFamily(prev), bgFamily(t.to)]);
    prev = t.to;
  }
  return cur;
};

const Card: React.FC<{f: number; i: number}> = ({f, i}) => {
  const st = cardState(f, i);
  const d = DECK[i];
  const {x, y, w, h, r, z, rot, sc, o, dim} = st.pose;
  if (o <= 0.001) return null;
  const blur = motionBlurPx(poseVel(f, i));
  const front = dim < 0.04;
  const cream = d.bg === C.cream || d.bg === C.sand || d.bg === C.blush || d.bg === C.mustard;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: r,
        overflow: 'hidden',
        opacity: o,
        zIndex: 20 + Math.round(z),
        transform: `rotate(${rot}deg) scale(${sc})`,
        transformOrigin: '50% 80%',
        background: `linear-gradient(180deg, ${d.bg}, ${d.bg2})`,
        filter: `brightness(${1 - dim})${blur > 0.15 ? ` blur(${blur.toFixed(2)}px)` : ''}`,
        boxShadow: `inset 0 0 0 1px ${cream ? 'rgba(17,17,17,0.12)' : 'rgba(246,240,228,0.12)'}, 0 ${front ? 16 : 6}px ${front ? 36 : 16}px rgba(12,12,14,${front ? 0.22 : 0.12})`,
      }}
    >
      <Face i={i} fam={familyOf(st.to)} w={w} h={h} />
    </div>
  );
};

const Extra: React.FC<{f: number; g: number}> = ({f, g}) => {
  const pose = extraState(f, g);
  if (!pose) return null;
  const e = EXTRA_DECK[g];
  return (
    <div
      style={{
        position: 'absolute',
        left: pose.x,
        top: pose.y,
        width: pose.w,
        height: pose.h,
        borderRadius: pose.r,
        overflow: 'hidden',
        opacity: pose.o,
        zIndex: 6 - g,
        transform: `rotate(${pose.rot}deg) scale(${pose.sc})`,
        background: e.bg,
        boxShadow: '0 8px 20px rgba(12,12,14,.16)',
      }}
    >
      <ExtraFace g={g} />
    </div>
  );
};

export const CardStack: React.FC<{music?: boolean}> = ({music = true}) => {
  React.useState(loadFonts);
  const f = useCurrentFrame();
  const cam = camAt(f);
  const kick = shake(f, CAM_HITS);
  return (
    <AbsoluteFill style={{background: bgAt(f), overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          transform: `translate(${cam.x + kick.x}px, ${cam.y + kick.y}px) scale(${cam.s})`,
          transformOrigin: `${cam.ox}px ${cam.oy}px`,
        }}
      >
        {Array.from({length: CARDS}, (_, i) => (
          <Card key={i} f={f} i={i} />
        ))}
        {Array.from({length: EXTRAS}, (_, g) => (
          <Extra key={`e${g}`} f={f} g={g} />
        ))}
      </AbsoluteFill>
      <AbsoluteFill style={{zIndex: 90, pointerEvents: 'none'}}>
        <Count f={f} />
        {f >= SCENE.PIT.in - 6 && f < SCENE.END.in && <PitMark f={f} />}
        {f >= SCENE.END.in - 4 && <EndTitle f={f} />}
        <Hud f={f} />
      </AbsoluteFill>
      <Grain opacity={0.04} />
      {music && <Audio src={staticFile('03-card-stack/music.wav')} />}
    </AbsoluteFill>
  );
};
