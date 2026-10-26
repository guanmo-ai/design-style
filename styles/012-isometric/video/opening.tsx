/**
 * 012 · 开场 0–3.5s
 * 扁平卡片 → 锁上 30° 三轴 → 弹出体积 → ISOMETRIC 落下
 */
import React from 'react';
import {E, SMOOTH, spr, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {Mode, Pt, lerp, lerpPt, toScreen} from './iso';
import {AxisLines, CardFace, FaceUI, IsoBoxes, IsoGrid} from './primitives';
import {AT} from './timeline';
import {Show, T, disp, mono, sc} from './ui';
import type {Cam} from './world';

type P = {f: number; cam: Cam};

const ORTHO: Pt[] = [
  {x: 750, y: 355},
  {x: 1170, y: 355},
  {x: 1170, y: 645},
  {x: 750, y: 645},
];

export const Opening: React.FC<P> = ({f, cam}) => {
  const snap = spr(f, 118, SMOOTH, 32);
  const extr = spr(f, 148, SMOOTH, 36);
  const pull = spr(f, 186, SMOOTH, 40);
  const fade = 1 - tween(f, AT.rules - 10, 18, 0, 1, E.soft);
  const {origin, unit, yaw, mode} = cam;

  const hero = {x: -1.1, y: 0, z: -1.1, w: 2.2, h: 1.7 * extr, d: 2.2, color: C.coral, appear: 1, id: 'hero'};
  const isoTop = [
    toScreen({x: hero.x, y: hero.h, z: hero.z}, origin, unit, mode, yaw),
    toScreen({x: hero.x + hero.w, y: hero.h, z: hero.z}, origin, unit, mode, yaw),
    toScreen({x: hero.x + hero.w, y: hero.h, z: hero.z + hero.d}, origin, unit, mode, yaw),
    toScreen({x: hero.x, y: hero.h, z: hero.z + hero.d}, origin, unit, mode, yaw),
  ];
  const t = snap;
  const quad = ORTHO.map((p, i) => lerpPt(p, isoTop[i], t));
  const cardO = tween(f, 10, 22, 0, 1, E.soft) * (1 - tween(f, AT.rules - 18, 16, 0, 1, E.soft));

  const p0 = quad[0];
  const px = quad[1];
  const pzLerp = lerpPt(quad[3], isoTop[3], t);

  return (
    <div style={{position: 'absolute', inset: 0, opacity: fade}}>
      <IsoGrid origin={origin} unit={unit} mode={mode} yaw={yaw} n={9} opacity={0.22 + 0.35 * pull} appear={tween(f, 8, 40, 0, 1, E.soft)} />
      <AxisLines
        origin={origin}
        unit={unit}
        mode={mode}
        yaw={yaw}
        len={6.2}
        px={tween(f, 48, 22, 0, 1, E.soft)}
        py={tween(f, 84, 22, 0, 1, E.soft)}
        pz={tween(f, 66, 22, 0, 1, E.soft)}
        labels={f > 90 && f < AT.rules + 20}
      />
      {extr > 0.04 && (
        <IsoBoxes
          boxes={[{...hero, h: 1.7, appear: extr, shadow: true}]}
          origin={origin}
          unit={unit}
          mode={mode}
          yaw={yaw}
        />
      )}
      {cardO > 0.01 && extr < 0.98 && (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: cardO * (1 - extr * 0.85)}}>
          <polygon
            points={quad.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
            fill={C.white}
            stroke="rgba(27,36,48,0.14)"
            strokeWidth={1.2}
          />
        </svg>
      )}
      {cardO > 0.05 && (
        <FaceUI p0={p0} px={px} pz={pzLerp} w={420} h={290} opacity={cardO * (1 - extr)}>
          <CardFace title="FLAT CARD" value="$24.8k" note="→ ISOMETRIC" bar={0.58} />
        </FaceUI>
      )}
      <Show f={f} at={168} out={AT.rules - 8} dy={22}>
        <T x={960} y={168} size={72} align="center" style={{...disp(72, 700, -0.05), color: C.ink}}>
          ISOMETRIC
        </T>
      </Show>
      <Show f={f} at={184} out={AT.rules - 6} dy={16}>
        <T k="sc" x={960} y={218} size={28} align="center" style={{...sc(28, 700, 0.18), color: C.muted}}>
          等距
        </T>
      </Show>
      <Show f={f} at={22} out={108} dy={10}>
        <T k="sc" x={80} y={980} size={26} style={{...sc(26, 700, 0.04), color: C.ink}}>
          扁平卡片
        </T>
      </Show>
      <Show f={f} at={100} out={160} dy={10}>
        <T k="mono" x={80} y={80} size={16} style={{...mono(15, 500, 0.14), color: C.coral}}>
          LOCK  30° / 30°
        </T>
        <T k="sc" x={80} y={980} size={26} style={{...sc(26, 700, 0.04), color: C.ink}}>
          锁上三轴
        </T>
      </Show>
      <Show f={f} at={148} out={AT.rules - 10} dy={10}>
        <T k="sc" x={80} y={980} size={26} style={{...sc(26, 700, 0.04), color: C.ink}}>
          弹出体积
        </T>
      </Show>
    </div>
  );
};

export const camOf = (f: number): Cam => {
  const driftX = Math.sin(f / 92) * 10;
  const driftY = Math.cos(f / 104) * 6;
  const yawDrift = Math.sin(f / 86) * 0.014;
  const zoomDrift = Math.sin(f / 118) * 0.01;
  const mode: Mode = 'iso';

  let ox = 960 + driftX;
  let oy = 500 + driftY;
  let unit = 78 * (1 + zoomDrift);
  let yaw = -0.08 + yawDrift;

  const pull = spr(f, 186, SMOOTH, 50);
  oy = lerp(oy, 600 + driftY, pull);
  unit = lerp(unit, 70 * (1 + zoomDrift), pull);
  yaw = lerp(yaw, 0.04 + yawDrift, pull);

  const build = spr(f, 510, SMOOTH, 80);
  oy = lerp(oy, 655 + driftY, build);
  ox = lerp(ox, 915 + driftX, build);
  unit = lerp(unit, 52 * (1 + zoomDrift), build);
  yaw = lerp(yaw, 0.2 + yawDrift + tween(f, 510, 490, 0, 0.22, E.soft), build);

  const vari = spr(f, 1020, SMOOTH, 50);
  unit = lerp(unit, 28 * (1 + zoomDrift), vari);
  oy = lerp(oy, 500 + driftY, vari);
  ox = lerp(ox, 960 + driftX * 0.4, vari);
  yaw = lerp(yaw, 0.06 + yawDrift, vari);

  const end = spr(f, 1260, SMOOTH, 48);
  unit = lerp(unit, 52 * (1 + zoomDrift), end);
  oy = lerp(oy, 540 + driftY, end);
  yaw = lerp(yaw, 0.05 + yawDrift, end);

  return {origin: {x: ox, y: oy}, unit, yaw, mode};
};
