/**
 * 012 · 规则 / 建造字幕 / 变体 / 片尾
 */
import React from 'react';
import {E, SMOOTH, spr, tween} from '../../../src/lib/anim';
import {C, VARIANT} from '../tokens';
import {Mode, Pt, lerp, lerpPt, mix, toScreen} from './iso';
import {AxisLines, IsoBoxes, IsoGrid} from './primitives';
import {AT, RULE} from './timeline';
import {Show, T, disp, mono, sc} from './ui';
import {MiniWorld, World, type Cam} from './world';

type P = {f: number; cam: Cam};

const Fade: React.FC<{f: number; out: number; dur?: number; children: React.ReactNode}> = ({f, out, dur = 16, children}) => {
  const o = 1 - tween(f, out, dur, 0, 1, E.soft);
  if (o <= 0.001) return null;
  return <div style={{position: 'absolute', inset: 0, opacity: o}}>{children}</div>;
};

const RuleTag: React.FC<{n: string; zh: string; en: string; f: number; at: number; out: number}> = ({n, zh, en, f, at, out}) => (
  <Show f={f} at={at} out={out} dy={14}>
    <T k="mono" x={80} y={86} size={15} style={{...mono(15, 500, 0.16), color: C.coral}}>
      {n}
    </T>
    <T k="sc" x={80} y={132} size={44} style={{...sc(44, 900, 0.04), color: C.ink}}>
      {zh}
    </T>
    <T k="mono" x={80} y={168} size={16} style={{...mono(15, 500, 0.12), color: C.muted}}>
      {en}
    </T>
  </Show>
);

const UnitCubes: React.FC<{f: number; cam: Cam}> = ({f, cam}) => {
  const t = spr(f, RULE.scale, SMOOTH, 28);
  const {origin, unit, yaw, mode} = cam;
  const s = 1.15;
  const boxes = [
    {id: 'ux', x: 1.4, y: 0, z: -s / 2, w: s, h: s, d: s, color: C.coral, appear: t},
    {id: 'uy', x: -s / 2, y: 1.5, z: -s / 2, w: s, h: s, d: s, color: C.mint, appear: spr(f, RULE.scale + 12, SMOOTH, 26)},
    {id: 'uz', x: -s / 2, y: 0, z: 1.4, w: s, h: s, d: s, color: C.indigo, appear: spr(f, RULE.scale + 24, SMOOTH, 26)},
  ];
  return (
    <>
      <IsoBoxes boxes={boxes} origin={origin} unit={unit} mode={mode} yaw={yaw} />
      <AxisLines origin={origin} unit={unit} mode={mode} yaw={yaw} len={4.8} labels={false} />
      <Show f={f} at={RULE.scale + 28} out={RULE.persp - 8} dy={8}>
        <T k="mono" x={960} y={980} size={20} align="center" style={{...mono(18, 500, 0.18), color: C.ink}}>
          1  :  1  :  1
        </T>
      </Show>
    </>
  );
};

/** 一点透视两盒 → 等距两盒：远处从缩小回到等大，灭点线收回 */
const PerspMorph: React.FC<{f: number; cam: Cam}> = ({f, cam}) => {
  // 先停在透视里让人看清近大远小，再收回成平行
  const t = spr(f, RULE.persp + 42, SMOOTH, 48);
  const {origin, unit, yaw} = cam;
  const vp: Pt = {x: origin.x + 8, y: origin.y - 300};
  const boxPts = (ox: number, oz: number, s: number, farness: number) => {
    const corners = [
      {x: ox, y: 0, z: oz},
      {x: ox + s, y: 0, z: oz},
      {x: ox + s, y: s, z: oz},
      {x: ox, y: s, z: oz},
      {x: ox, y: 0, z: oz + s},
      {x: ox + s, y: 0, z: oz + s},
      {x: ox + s, y: s, z: oz + s},
      {x: ox, y: s, z: oz + s},
    ];
    const iso = corners.map((c) => toScreen(c, origin, unit, 'iso', yaw));
    return iso.map((p, i) => {
      const local = (corners[i].z - oz) / s;
      return lerpPt(p, vp, (1 - t) * (0.05 + 0.46 * farness + 0.16 * local));
    });
  };
  const s = 2.05;
  const far = boxPts(-1.2, -3.45, s, 1); // 远离镜头（小 x+z）
  const near = boxPts(-1.2, 1.55, s, 0);
  const face = (pts: Pt[], idx: number[], fill: string) => (
    <polygon
      points={idx.map((i) => `${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`).join(' ')}
      fill={fill}
      stroke="rgba(27,36,48,0.22)"
      strokeWidth={1}
      strokeLinejoin="round"
    />
  );
  const paint = (pts: Pt[]) => (
    <>
      {face(pts, [0, 1, 5, 4], mix(C.cream, '#FFFFFF', 0.08))}
      {face(pts, [1, 5, 6, 2], mix(C.coral, '#1B2430', 0.12))}
      {face(pts, [4, 5, 6, 7], mix(C.indigo, '#1B2430', 0.28))}
      {face(pts, [3, 2, 6, 7], mix(C.cream, '#FFFFFF', 0.22))}
    </>
  );
  const rays = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `M${vp.x.toFixed(1)},${vp.y.toFixed(1)} L${far[i].x.toFixed(1)},${far[i].y.toFixed(1)}`);
  const farLabel = far[2];
  const nearLabel = near[1];
  return (
    <>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <path d={rays.join(' ')} fill="none" stroke={C.coral} strokeWidth={1.15} strokeDasharray="5 7" opacity={(1 - t) * 0.5} />
        <circle cx={vp.x} cy={vp.y} r={7} fill={C.coral} opacity={0.2 + (1 - t) * 0.8} />
        <circle cx={vp.x} cy={vp.y} r={14} fill="none" stroke={C.coral} strokeWidth={1.5} opacity={(1 - t) * 0.7} />
        {paint(far)}
        {paint(near)}
      </svg>
      <div style={{position: 'absolute', left: vp.x - 40, top: vp.y - 36, width: 80, textAlign: 'center', opacity: (1 - t) * 0.95}}>
        <span style={{...mono(13, 500, 0.14), color: C.coral}}>VP</span>
      </div>
      <div style={{position: 'absolute', left: farLabel.x + 8, top: farLabel.y - 36, opacity: 0.35 + 0.65 * (1 - t)}}>
        <span style={{...mono(13, 500, 0.12), color: C.muted}}>FAR</span>
      </div>
      <div style={{position: 'absolute', left: nearLabel.x + 12, top: nearLabel.y + 10, opacity: 0.55}}>
        <span style={{...mono(13, 500, 0.12), color: C.ink}}>NEAR</span>
      </div>
      <Show f={f} at={RULE.persp} out={RULE.persp + 48} dy={10}>
        <T k="sc" x={80} y={980} size={28} style={{...sc(28, 700, 0.04), color: C.muted}}>
          近大远小
        </T>
      </Show>
      <Show f={f} at={RULE.persp + 52} out={AT.build - 8} dy={10}>
        <T k="sc" x={80} y={980} size={28} style={{...sc(28, 700, 0.04), color: C.ink}}>
          没有灭点。远处一样大。
        </T>
      </Show>
    </>
  );
};

export const Rules: React.FC<P> = ({f, cam}) => {
  const k = f >= RULE.persp ? 2 : f >= RULE.scale ? 1 : 0;
  return (
    <Fade f={f} out={AT.build - 6} dur={18}>
      <IsoGrid origin={cam.origin} unit={cam.unit} mode={cam.mode} yaw={cam.yaw} n={8} opacity={0.28} appear={1} />
      {k === 0 && (
        <>
          <AxisLines origin={cam.origin} unit={cam.unit} mode={cam.mode} yaw={cam.yaw} len={6.8} />
          <IsoBoxes
            boxes={[{id: 'o', x: -0.35, y: 0, z: -0.35, w: 0.7, h: 0.7, d: 0.7, color: C.ink, appear: spr(f, RULE.axes + 8, SMOOTH, 22)}]}
            origin={cam.origin}
            unit={cam.unit}
            mode={cam.mode}
            yaw={cam.yaw}
          />
          <Show f={f} at={RULE.axes + 28} out={RULE.scale - 6} dy={8}>
            <T k="mono" x={960} y={980} size={18} align="center" style={{...mono(17, 500, 0.16), color: C.ink}}>
              120°  BETWEEN AXES
            </T>
            <T k="mono" x={1840} y={980} size={14} align="right" style={{...mono(13, 400, 0.08), color: C.muted}}>
              x′ = (x − z) cos 30°
            </T>
          </Show>
        </>
      )}
      {k === 1 && <UnitCubes f={f} cam={cam} />}
      {k === 2 && <PerspMorph f={f} cam={cam} />}
      {k === 0 && <RuleTag n="01  AXES" zh="先锁轴角" en="30°  /  30°  ·  TRUE ISO" f={f} at={RULE.axes} out={RULE.scale - 4} />}
      {k === 1 && <RuleTag n="02  SCALE" zh="三轴等比例" en="EQUAL UNIT  ·  NO STRETCH" f={f} at={RULE.scale} out={RULE.persp - 4} />}
      {k === 2 && <RuleTag n="03  PARALLEL" zh="无近大远小" en="NO FORESHORTENING" f={f} at={RULE.persp} out={AT.build - 6} />}
    </Fade>
  );
};

export const BuildCaption: React.FC<{f: number}> = ({f}) => (
  <>
    <Show f={f} at={AT.build + 8} out={AT.build + 90} dy={12}>
      <T k="sc" x={80} y={120} size={40} style={{...sc(40, 900, 0.04), color: C.ink}}>
        再堆体积
      </T>
      <T k="mono" x={80} y={158} size={15} style={{...mono(14, 500, 0.14), color: C.muted}}>
        STACK THE VOLUME
      </T>
    </Show>
    <Show f={f} at={700} out={820} dy={10}>
      <T k="sc" x={80} y={980} size={26} style={{...sc(26, 700, 0.03), color: C.ink}}>
        仪表、设备、通知——全部是盒子。
      </T>
    </Show>
    <Show f={f} at={860} out={1008} dy={10}>
      <T k="sc" x={80} y={980} size={26} style={{...sc(26, 700, 0.03), color: C.ink}}>
        深度来自叠压，不是灭点。
      </T>
    </Show>
  </>
);

export const Variants: React.FC<P> = ({f, cam}) => {
  const enter = spr(f, AT.variants, SMOOTH, 36);
  const split = spr(f, AT.variants + 18, SMOOTH, 40);
  const modes: Mode[] = ['iso', 'military', 'product'];
  const labels = [VARIANT.iso, VARIANT.military, VARIANT.product];
  const xs = [360, 960, 1560];
  return (
    <Fade f={f} out={AT.end - 8} dur={18}>
      <IsoGrid origin={{x: 960, y: 640}} unit={36} mode="iso" yaw={cam.yaw * 0.4} n={12} opacity={0.18} appear={enter} />
      {modes.map((mode, i) => {
        const ox = lerp(cam.origin.x, xs[i], split);
        const oy = lerp(cam.origin.y, 500, split);
        const unit = lerp(cam.unit, 22, split);
        const a = enter * (0.7 + 0.3 * spr(f, AT.variants + 10 + i * 10, SMOOTH, 24));
        return (
          <MiniWorld
            key={mode}
            f={f}
            appear={a}
            cam={{origin: {x: ox, y: oy}, unit, yaw: cam.yaw * 0.5 + (i - 1) * 0.04, mode}}
            label={labels[i].en}
            sub={labels[i].zh}
          />
        );
      })}
    </Fade>
  );
};

export const End: React.FC<P> = ({f, cam}) => {
  const t0 = AT.end;
  const land = spr(f, t0 - 12, SMOOTH, 40);
  const cube = {
    id: 'end',
    x: -1.1,
    y: 0,
    z: -1.1,
    w: 2.2,
    h: 1.7,
    d: 2.2,
    color: C.coral,
    appear: land,
  };
  return (
    <>
      <div style={{position: 'absolute', inset: 0, background: C.paper, opacity: tween(f, t0 - 10, 22, 0, 1, E.soft)}} />
      <IsoGrid origin={cam.origin} unit={cam.unit} mode="iso" yaw={cam.yaw} n={8} opacity={0.2} appear={land} />
      <AxisLines origin={cam.origin} unit={cam.unit} mode="iso" yaw={cam.yaw} len={5.4} labels={false} />
      <IsoBoxes boxes={[cube]} origin={cam.origin} unit={cam.unit} mode="iso" yaw={cam.yaw} />
      <Show f={f} at={t0 + 4} dy={18}>
        <T x={960} y={168} size={76} align="center" style={{...disp(76, 700, -0.05), color: C.ink}}>
          ISOMETRIC
        </T>
      </Show>
      <Show f={f} at={t0 + 12} dy={12}>
        <T k="sc" x={960} y={222} size={28} align="center" style={{...sc(28, 700, 0.2), color: C.muted}}>
          等距
        </T>
      </Show>
      <Show f={f} at={t0 + 20} dy={14}>
        <T k="sc" x={960} y={800} size={36} align="center" style={{...sc(36, 700, 0.06), color: C.ink}}>
          先锁轴角，再堆体积。
        </T>
      </Show>
      <Show f={f} at={t0 + 28} dy={10}>
        <T k="mono" x={960} y={848} size={16} align="center" style={{...mono(15, 500, 0.12), color: C.muted}}>
          LOCK THE AXES, THEN STACK THE VOLUME.
        </T>
      </Show>
      <Show f={f} at={t0 + 36} dy={8}>
        <div style={{position: 'absolute', left: 80, right: 80, top: 932, height: 1, background: C.ink, opacity: 0.12}} />
        <T k="mono" x={80} y={980} size={22} style={{...mono(20, 700, 0.08), color: C.ink}}>
          DESIGN STYLE  012
        </T>
        <T k="mono" x={960} y={980} size={22} align="center" style={{...mono(20, 700, 0.1), color: C.ink}}>
          @guanmo_ai
        </T>
        <T k="mono" x={1840} y={980} size={18} align="right" style={{...mono(16, 400, 0.06), color: C.muted}}>
          github.com/guanmo-ai/design-style
        </T>
      </Show>
    </>
  );
};

export const Drafting: React.FC<{f: number}> = ({f}) => {
  const o = 0.5 + 0.5 * Math.sin(f / 90);
  return (
    <div style={{position: 'absolute', inset: 0, background: C.stage}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.55), transparent 55%)`,
          opacity: 0.9,
        }}
      />
      <div style={{position: 'absolute', left: 48, top: 36, width: 12, height: 12, borderLeft: `2px solid ${C.line}`, borderTop: `2px solid ${C.line}`, opacity: 0.7 + 0.2 * o}} />
      <div style={{position: 'absolute', right: 48, top: 36, width: 12, height: 12, borderRight: `2px solid ${C.line}`, borderTop: `2px solid ${C.line}`, opacity: 0.7}} />
      <div style={{position: 'absolute', left: 48, bottom: 36, width: 12, height: 12, borderLeft: `2px solid ${C.line}`, borderBottom: `2px solid ${C.line}`, opacity: 0.7}} />
      <div style={{position: 'absolute', right: 48, bottom: 36, width: 12, height: 12, borderRight: `2px solid ${C.line}`, borderBottom: `2px solid ${C.line}`, opacity: 0.7}} />
    </div>
  );
};
