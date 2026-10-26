/** 012 · 产品小世界：平台、磁贴、设备、柱状图——按帧一块块堆出来 */
import React from 'react';
import {SMOOTH, spr} from '../../../src/lib/anim';
import {C} from '../tokens';
import {AT} from './timeline';
import {BoxSpec, Mode, Pt} from './iso';
import {AxisLines, CardFace, FaceUI, IsoBoxes, IsoGrid, topFace} from './primitives';
import {mono} from './ui';

export type Cam = {origin: Pt; unit: number; yaw: number; mode: Mode};

const pop = (f: number, at: number, dur = 24) => spr(f, at, SMOOTH, dur);

type Spec = Omit<BoxSpec, 'appear'> & {at: number; dur?: number};

export const SPECS: Spec[] = [
  {id: 'plat', at: 516, x: -7.2, y: 0, z: -6.2, w: 14.4, h: 0.55, d: 12.4, color: C.sand, shadow: false},
  {id: 'tileA', at: 528, x: -5.6, y: 0.38, z: -4.6, w: 3.2, h: 0.28, d: 3.0, color: C.white},
  {id: 'path', at: 534, x: -6.6, y: 0.38, z: -0.25, w: 13.2, h: 0.08, d: 1.05, color: '#CBB892'},
  {id: 'tileB', at: 540, x: 0.6, y: 0.38, z: -4.8, w: 4.2, h: 0.28, d: 3.1, color: C.white},
  {id: 'tileC', at: 548, x: -2.4, y: 0.38, z: 1.4, w: 3.4, h: 0.28, d: 2.9, color: C.white},
  {id: 'step1', at: 556, x: -0.5, y: 0.48, z: -1.5, w: 1.2, h: 0.1, d: 1.2, color: C.cream},
  {id: 'step2', at: 560, x: 1.1, y: 0.48, z: -0.3, w: 1.2, h: 0.1, d: 1.2, color: C.cream},
  {id: 'step3', at: 564, x: 2.7, y: 0.48, z: 0.9, w: 1.2, h: 0.1, d: 1.2, color: C.cream},
  {id: 'bldgA', at: 568, x: -6.8, y: 0.38, z: -6.0, w: 2.2, h: 3.4, d: 2.0, color: C.slate},
  {id: 'bldgA2', at: 576, x: -6.5, y: 3.78, z: -5.7, w: 1.6, h: 0.7, d: 1.4, color: C.navy},
  {id: 'bldgC', at: 584, x: -2.35, y: 0.38, z: -6.1, w: 1.55, h: 1.85, d: 1.4, color: C.slate},
  {id: 'bldgD', at: 592, x: 3.2, y: 0.38, z: -6.15, w: 1.4, h: 2.2, d: 1.3, color: C.navy},
  {id: 'bldgB', at: 600, x: 5.2, y: 0.38, z: -5.8, w: 2.0, h: 2.6, d: 1.9, color: C.navy},
  {id: 'bldgBgold', at: 608, x: 5.4, y: 2.98, z: -5.6, w: 1.6, h: 0.22, d: 1.5, color: C.gold},
  {id: 'lapBase', at: 616, x: 3.45, y: 0.38, z: 1.65, w: 3.3, h: 0.18, d: 2.1, color: C.navy},
  {id: 'lapHinge', at: 622, x: 3.5, y: 0.56, z: 1.68, w: 3.2, h: 0.12, d: 0.2, color: C.slate},
  {id: 'lapScr', at: 628, x: 3.55, y: 0.68, z: 1.58, w: 3.1, h: 2.0, d: 0.14, color: C.navy},
  {id: 'bar0', at: 636, x: 1.0, y: 0.66, z: -4.4, w: 0.42, h: 0.85, d: 0.42, color: C.coral},
  {id: 'bar1', at: 642, x: 1.6, y: 0.66, z: -4.4, w: 0.42, h: 1.45, d: 0.42, color: C.gold},
  {id: 'bar2', at: 648, x: 2.2, y: 0.66, z: -4.4, w: 0.42, h: 1.1, d: 0.42, color: C.mint},
  {id: 'bar3', at: 654, x: 2.8, y: 0.66, z: -4.4, w: 0.42, h: 1.95, d: 0.42, color: C.indigo},
  {id: 'bar4', at: 660, x: 3.4, y: 0.66, z: -4.4, w: 0.42, h: 1.55, d: 0.42, color: C.sky},
  {id: 'kpi', at: 668, x: -5.1, y: 0.66, z: -4.1, w: 2.2, h: 1.7, d: 2.2, color: C.coral},
  {id: 'phone', at: 680, x: -6.25, y: 0.38, z: 1.9, w: 1.05, h: 2.15, d: 0.22, color: C.navy},
  {id: 'phoneScr', at: 686, x: -6.17, y: 0.55, z: 2.02, w: 0.9, h: 1.8, d: 0.06, color: C.sky},
  {id: 'av0', at: 694, x: -1.9, y: 0.66, z: 1.75, w: 0.72, h: 0.72, d: 0.72, color: C.rose},
  {id: 'av1', at: 700, x: -1.05, y: 0.66, z: 2.3, w: 0.72, h: 0.9, d: 0.72, color: C.mint},
  {id: 'av2', at: 706, x: -0.2, y: 0.66, z: 1.6, w: 0.72, h: 0.62, d: 0.72, color: C.gold},
  {id: 'pot', at: 714, x: 0.35, y: 0.38, z: 4.2, w: 0.7, h: 0.55, d: 0.7, color: C.coral},
  {id: 'stem', at: 720, x: 0.57, y: 0.93, z: 4.42, w: 0.22, h: 1.15, d: 0.22, color: C.green},
  {id: 'leaf1', at: 726, x: 0.2, y: 1.7, z: 4.1, w: 0.7, h: 0.18, d: 0.55, color: C.green},
  {id: 'leaf2', at: 732, x: 0.6, y: 1.95, z: 4.45, w: 0.55, h: 0.16, d: 0.7, color: C.mint},
  {id: 'p1', at: 740, x: -4.35, y: 0.38, z: 3.55, w: 0.42, h: 0.72, d: 0.42, color: C.indigo},
  {id: 'p1h', at: 746, x: -4.28, y: 1.1, z: 3.62, w: 0.28, h: 0.28, d: 0.28, color: C.rose},
  {id: 'p2', at: 752, x: 1.55, y: 0.38, z: 4.55, w: 0.4, h: 0.68, d: 0.4, color: C.navy},
  {id: 'p2h', at: 758, x: 1.62, y: 1.06, z: 4.62, w: 0.26, h: 0.26, d: 0.26, color: C.gold},
  {id: 'cup', at: 766, x: 5.55, y: 0.38, z: 3.2, w: 0.62, h: 0.58, d: 0.62, color: C.white},
  {id: 'cupTop', at: 772, x: 5.6, y: 0.96, z: 3.25, w: 0.52, h: 0.08, d: 0.52, color: C.sand},
  {id: 'crate', at: 780, x: 5.75, y: 0.38, z: 0.15, w: 1.15, h: 0.85, d: 1.05, color: C.gold},
  {id: 'treeP', at: 788, x: -7.0, y: 0.38, z: 4.35, w: 0.55, h: 0.45, d: 0.55, color: C.slate},
  {id: 'treeC', at: 794, x: -7.25, y: 0.83, z: 4.1, w: 1.05, h: 1.35, d: 1.05, color: C.green},
  {id: 'treeP2', at: 802, x: 6.3, y: 0.38, z: 4.45, w: 0.5, h: 0.4, d: 0.5, color: C.slate},
  {id: 'treeC2', at: 808, x: 6.05, y: 0.78, z: 4.2, w: 1.0, h: 1.15, d: 1.0, color: C.mint},
  {id: 'srv0', at: 816, x: -0.35, y: 0.38, z: -2.55, w: 1.25, h: 0.32, d: 1.05, color: C.navy},
  {id: 'srv1', at: 822, x: -0.35, y: 0.7, z: -2.55, w: 1.25, h: 0.32, d: 1.05, color: C.slate},
  {id: 'srv2', at: 828, x: -0.3, y: 1.02, z: -2.5, w: 1.15, h: 0.26, d: 0.95, color: C.indigo},
  {id: 'car', at: 836, x: -3.4, y: 0.38, z: 4.7, w: 1.55, h: 0.42, d: 0.78, color: C.coral},
  {id: 'carC', at: 842, x: -3.1, y: 0.8, z: 4.8, w: 0.85, h: 0.38, d: 0.58, color: C.navy},
  {id: 'pin', at: 850, x: 4.35, y: 3.2, z: -5.15, w: 0.28, h: 0.85, d: 0.28, color: C.coral},
  {id: 'mail', at: 858, x: 0.7, y: 0.48, z: -1.65, w: 1.2, h: 0.18, d: 0.8, color: C.white},
  {id: 'mail2', at: 864, x: 0.85, y: 0.66, z: -1.52, w: 0.9, h: 0.1, d: 0.55, color: C.coral},
  {id: 'win1', at: 872, x: -6.5, y: 1.4, z: -4.05, w: 0.55, h: 0.7, d: 0.12, color: C.sky},
  {id: 'win2', at: 878, x: -5.7, y: 1.4, z: -4.05, w: 0.55, h: 0.7, d: 0.12, color: C.sky},
  {id: 'win3', at: 884, x: -6.5, y: 2.3, z: -4.05, w: 0.55, h: 0.7, d: 0.12, color: C.gold},
  {id: 'flag', at: 892, x: -6.05, y: 4.48, z: -5.2, w: 0.16, h: 0.7, d: 0.16, color: C.ink},
  {id: 'flagC', at: 898, x: -6.05, y: 4.85, z: -5.05, w: 0.7, h: 0.35, d: 0.08, color: C.coral},
  {id: 'dock', at: 906, x: 3.75, y: 0.56, z: 3.55, w: 1.5, h: 0.16, d: 0.7, color: C.slate},
  {id: 'chip', at: 914, x: -5.55, y: 0.38, z: 0.35, w: 1.35, h: 0.5, d: 1.1, color: C.indigo},
  {id: 'book0', at: 922, x: 5.85, y: 1.23, z: 0.3, w: 0.85, h: 0.16, d: 0.7, color: C.coral},
  {id: 'book1', at: 928, x: 5.9, y: 1.39, z: 0.35, w: 0.75, h: 0.14, d: 0.6, color: C.mint},
  {id: 'lamp', at: 936, x: 2.15, y: 0.66, z: 2.05, w: 0.28, h: 1.15, d: 0.28, color: C.gold},
  {id: 'lampH', at: 942, x: 2.05, y: 1.81, z: 1.95, w: 0.48, h: 0.12, d: 0.48, color: C.cream},
  {id: 'note', at: 952, x: 1.15, y: 2.55, z: -1.05, w: 2.35, h: 0.14, d: 1.45, color: C.white},
  {id: 'dot', at: 968, x: 6.55, y: 3.2, z: -5.35, w: 0.35, h: 0.35, d: 0.35, color: C.mint},
  {id: 'boxS', at: 984, x: -3.85, y: 0.38, z: -1.55, w: 1.05, h: 0.7, d: 0.9, color: C.sky},
];

export const worldBoxes = (f: number, amp = 1): BoxSpec[] =>
  SPECS.map((s) => {
    const t = pop(f, s.at, s.dur ?? 24);
    let h = s.h;
    if (s.id?.startsWith('bar')) {
      const pulse = 1 + 0.06 * Math.sin((f - s.at) / 18 + (s.x + s.z));
      h = s.h * pulse;
    }
    return {...s, h: h * amp, appear: t};
  });

export const World: React.FC<{f: number; cam: Cam; showGrid?: boolean; showAxes?: boolean; ui?: boolean}> = ({
  f,
  cam,
  showGrid = true,
  showAxes = false,
  ui = true,
}) => {
  const boxes = worldBoxes(f);
  const {origin, unit, yaw, mode} = cam;
  const gridOn = pop(f, AT.build, 36);
  const kpi = boxes.find((b) => b.id === 'kpi');
  const note = boxes.find((b) => b.id === 'note');
  const chip = boxes.find((b) => b.id === 'chip');
  const bob = 0.08 * Math.sin(f / 22);
  const noteBox = note ? {...note, y: note.y + bob} : null;
  const live = noteBox ? boxes.map((b) => (b.id === 'note' ? noteBox : b)) : boxes;

  return (
    <>
      {showGrid && <IsoGrid origin={origin} unit={unit} mode={mode} yaw={yaw} n={11} opacity={0.55} appear={gridOn} />}
      <IsoBoxes boxes={live} origin={origin} unit={unit} mode={mode} yaw={yaw} />
      {showAxes && <AxisLines origin={origin} unit={unit} mode={mode} yaw={yaw} len={6.5} />}
      {ui && kpi && (kpi.appear ?? 0) > 0.55 && (
        <FaceUI {...topFace(kpi, origin, unit, mode, yaw)} w={220} h={220} opacity={Math.min(1, ((kpi.appear ?? 0) - 0.55) / 0.35)}>
          <CardFace title="REVENUE" value="$24.8k" note="+12.4%" bar={0.7} />
        </FaceUI>
      )}
      {ui && chip && (chip.appear ?? 0) > 0.5 && (
        <FaceUI {...topFace(chip, origin, unit, mode, yaw)} w={160} h={130} opacity={Math.min(1, ((chip.appear ?? 0) - 0.45) / 0.4)}>
          <CardFace title="USERS" value="1,204" note="+3" bar={0.54} dark />
        </FaceUI>
      )}
      {ui && noteBox && (noteBox.appear ?? 0) > 0.45 && (
        <FaceUI {...topFace(noteBox, origin, unit, mode, yaw)} w={220} h={136} opacity={Math.min(1, ((noteBox.appear ?? 0) - 0.4) / 0.4)}>
          <div style={{width: '100%', height: '100%', background: C.white, padding: '12px 14px', boxSizing: 'border-box'}}>
            <div style={{...mono(11, 500, 0.14), color: C.muted}}>NOTIFY</div>
            <div style={{fontFamily: "'Noto Sans SC', sans-serif", fontSize: 18, fontWeight: 700, color: C.ink, marginTop: 8}}>新用户 +3</div>
            <div style={{...mono(11, 500, 0.06), color: C.mint, marginTop: 6}}>just now</div>
          </div>
        </FaceUI>
      )}
    </>
  );
};

export const MiniWorld: React.FC<{f: number; cam: Cam; label: string; sub: string; appear: number}> = ({f, cam, label, sub, appear}) => {
  if (appear <= 0.01) return null;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: appear, transform: `translateY(${(1 - appear) * 28}px)`}}>
      <World f={Math.max(f, 1020)} cam={cam} showGrid ui={cam.mode !== 'military'} />
      <div
        style={{
          position: 'absolute',
          left: cam.origin.x - 160,
          top: cam.origin.y + 210,
          width: 320,
          textAlign: 'center',
        }}
      >
        <div style={{...mono(13, 500, 0.14), color: C.ink}}>{label}</div>
        <div style={{fontFamily: "'Noto Sans SC', sans-serif", fontSize: 16, fontWeight: 700, color: C.muted, marginTop: 6}}>{sub}</div>
      </div>
    </div>
  );
};
