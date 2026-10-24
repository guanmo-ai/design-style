/** 010 · Paper Cut —— 01 编辑海报 · 02 App 插画 · 03 品牌片头 */
import React from 'react';
import {E, spr, tween} from '../../../src/lib/anim';
import {C, HILLS} from '../tokens';
import {AT} from './timeline';
import {H, W, World, n1, peelAt} from './layers';
import {EditorChrome, Phone, Tag, Txt} from './ui';

const peelLabel = (i: number): [string, string] => {
  if (i <= 1) return ['FAR', '远'];
  if (i <= 3) return ['MID', '中'];
  return ['NEAR', '近'];
};

export const Edit: React.FC<{f: number}> = ({f}) => {
  let active = 0;
  for (let i = 0; i < 6; i++) if (peelAt(f, i) > 0.35) active = i;
  return (
    <g>
      <rect width={W} height={H} fill={C.cream} />
      <g clipPath="url(#artboard)">
        <World f={f} />
      </g>
      <EditorChrome f={f} active={active} />
      {Array.from({length: 6}, (_, i) => {
        const p = peelAt(f, i);
        if (p < 0.15) return null;
        const [en, zh] = peelLabel(i);
        const x = 160 + (i % 3) * 280;
        const y = 220 + Math.floor(i / 3) * 70;
        return (
          <g key={i} opacity={p}>
            <rect x={x} y={y} width={132} height={36} rx={8} fill={C.paper} />
            <rect x={x} y={y} width={8} height={36} rx={4} fill={HILLS[i]} />
            <Txt x={x + 18} y={y + 24} size={16} font="mono" c={C.ink}>
              {`L${6 - i}  ${en}  ${zh}`}
            </Txt>
          </g>
        );
      })}
      <Tag f={f} t0={AT.edit + 8} x={96} y={1004} en="01  EDITORIAL" zh="编辑海报：层就是故事的分镜" />
    </g>
  );
};

export const App: React.FC<{f: number}> = ({f}) => {
  const k = spr(f, AT.app - 4, {damping: 14, mass: 0.8, stiffness: 140});
  const temp = spr(f, AT.app + 16, {damping: 11, mass: 0.6, stiffness: 180});
  const card = spr(f, AT.app + 88, {damping: 12, mass: 0.7, stiffness: 160});
  return (
    <g>
      <rect width={W} height={H} fill="#0A141C" />
      <g clipPath="url(#phoneScreen)">
        <World f={f} />
      </g>
      <Phone f={f} />
      <g opacity={k}>
        <Txt x={760} y={220} size={18} font="cn" w={500} c={C.paper} o={0.75}>
          今日天气
        </Txt>
        <g opacity={temp} transform={`translate(0 ${n1((1 - temp) * 20)})`}>
          <Txt x={760} y={320} size={92} font="display" w={600} c={C.paper}>
            18°
          </Txt>
          <Txt x={760} y={368} size={22} font="cn" w={500} c={C.paper} o={0.8}>
            晴  ·  层在跟着你的手指走
          </Txt>
        </g>
      </g>
      {card > 0.01 && (
        <g opacity={card} transform={`translate(${n1((1 - card) * 24)} 0)`}>
          <rect x={164} y={780} width={420} height={148} rx={22} fill={C.paper} filter="url(#shNear)" />
          <Txt x={192} y={836} size={14} font="mono" c={C.sun} ls={1.4}>
            APP ILLUSTRATION
          </Txt>
          <Txt x={192} y={882} size={28} font="cn" w={700} c={C.ink}>
            层叠插画
          </Txt>
          <rect x={1336} y={780} width={420} height={148} rx={22} fill={C.paper} filter="url(#shNear)" />
          <Txt x={1364} y={836} size={14} font="mono" c={C.sun} ls={1.4}>
            SCROLL PARALLAX
          </Txt>
          <Txt x={1364} y={882} size={28} font="cn" w={700} c={C.ink}>
            视差滚动
          </Txt>
        </g>
      )}
      <Tag f={f} t0={AT.app + 6} x={96} y={80} en="02  APP" zh="滑动时，近层走得更远" dark />
    </g>
  );
};

export const Brand: React.FC<{f: number}> = ({f}) => {
  const bar = tween(f, AT.brand - 8, 18, 0, 1, E.out);
  const word = spr(f, AT.brand + 28, {damping: 10, mass: 0.6, stiffness: 170});
  const sub = spr(f, AT.brand + 68, {damping: 14, mass: 0.8, stiffness: 140});
  return (
    <g>
      <World f={f} />
      <rect width={W} height={72 * bar} fill={C.sky} />
      <rect y={H - 72 * bar} width={W} height={72 * bar} fill={C.sky} />
      {word > 0.01 && (
        <g opacity={word} filter="url(#shNear)">
          <Txt x={960} y={500} size={148} font="display" w={800} c={C.paper} anchor="middle" ls={6}>
            PAPER
          </Txt>
          <rect x={620} y={528} width={680 * word} height={8} fill={C.sun} />
        </g>
      )}
      {sub > 0.01 && (
        <Txt x={960} y={620} size={40} font="cn" w={700} c={C.paper} anchor="middle" o={sub}>
          层移即故事
        </Txt>
      )}
      <Tag f={f} t0={AT.brand + 10} x={96} y={100} en="03  TITLE" zh="品牌片头：镜头穿过纸堆" dark />
    </g>
  );
};
