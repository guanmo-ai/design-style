/** 012 · 等距零件：地面网格、轴、体积、贴在面上的 UI */
import React from 'react';
import {C} from '../tokens';
import {BoxSpec, Face, Mode, Pt, V3, boxFaces, faceMatrix, poly, toScreen} from './iso';
import {mono, sc} from './ui';

export const Faces: React.FC<{faces: Face[]; stroke?: string; sw?: number}> = ({faces, stroke, sw = 0.8}) => {
  const sorted = [...faces].sort((a, b) => a.depth - b.depth);
  return (
    <>
      {sorted.map((f) => (
        <polygon
          key={f.key}
          points={poly(f.pts)}
          fill={f.fill}
          stroke={f.kind === 'shadow' ? 'none' : stroke}
          strokeWidth={f.kind === 'shadow' ? 0 : sw}
          strokeLinejoin="round"
        />
      ))}
    </>
  );
};

export const IsoBoxes: React.FC<{
  boxes: BoxSpec[];
  origin: Pt;
  unit: number;
  mode: Mode;
  yaw: number;
  stroke?: string;
}> = ({boxes, origin, unit, mode, yaw, stroke}) => {
  const isGround = (b: BoxSpec) => {
    const h = b.h * (b.appear ?? 1);
    return b.y < 0.2 || h < 0.35;
  };
  const ground = boxes.filter(isGround);
  const rest = boxes.filter((b) => !isGround(b));
  const mk = (list: BoxSpec[]) => {
    const faces: Face[] = [];
    for (const b of list) faces.push(...boxFaces(b, origin, unit, mode, yaw));
    return faces;
  };
  const sw = stroke ?? (mode === 'product' ? 'none' : 'rgba(27,36,48,0.18)');
  const width = mode === 'product' ? 0 : 0.7;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <Faces faces={mk(ground)} stroke={sw} sw={width} />
      <Faces faces={mk(rest)} stroke={sw} sw={width} />
    </svg>
  );
};

/** 无限钻石网格（只画视野附近） */
export const IsoGrid: React.FC<{
  origin: Pt;
  unit: number;
  mode: Mode;
  yaw: number;
  n?: number;
  opacity?: number;
  appear?: number;
}> = ({origin, unit, mode, yaw, n = 10, opacity = 1, appear = 1}) => {
  if (appear <= 0.001) return null;
  const lines: string[] = [];
  const P = (x: number, z: number) => toScreen({x, y: 0, z}, origin, unit, mode, yaw);
  const lim = n;
  for (let i = -lim; i <= lim; i++) {
    const a = P(-lim, i);
    const b = P(lim, i);
    const c = P(i, -lim);
    const d = P(i, lim);
    lines.push(`M${a.x.toFixed(1)},${a.y.toFixed(1)} L${b.x.toFixed(1)},${b.y.toFixed(1)}`);
    lines.push(`M${c.x.toFixed(1)},${c.y.toFixed(1)} L${d.x.toFixed(1)},${d.y.toFixed(1)}`);
  }
  const drawn = Math.max(0, Math.min(1, appear));
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: opacity * drawn}}>
      <path
        d={lines.join(' ')}
        fill="none"
        stroke={C.line}
        strokeWidth={1}
        pathLength={1}
        strokeDasharray={drawn >= 0.998 ? undefined : `${drawn} ${1 - drawn}`}
      />
    </svg>
  );
};

export const AxisLines: React.FC<{
  origin: Pt;
  unit: number;
  mode: Mode;
  yaw: number;
  len?: number;
  px?: number;
  py?: number;
  pz?: number;
  labels?: boolean;
}> = ({origin, unit, mode, yaw, len = 5.5, px = 1, py = 1, pz = 1, labels = true}) => {
  const O = toScreen({x: 0, y: 0, z: 0}, origin, unit, mode, yaw);
  const X = toScreen({x: len * px, y: 0, z: 0}, origin, unit, mode, yaw);
  const Y = toScreen({x: 0, y: len * py, z: 0}, origin, unit, mode, yaw);
  const Z = toScreen({x: 0, y: 0, z: len * pz}, origin, unit, mode, yaw);
  const arrow = (from: Pt, to: Pt, color: string, label: string, sub: string) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const L = Math.hypot(dx, dy) || 1;
    const ux = dx / L;
    const uy = dy / L;
    const s = 14;
    const tip = `${to.x},${to.y}`;
    const a = `${to.x - ux * s + uy * 7},${to.y - uy * s - ux * 7}`;
    const b = `${to.x - ux * s - uy * 7},${to.y - uy * s + ux * 7}`;
    return (
      <g>
        <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={color} strokeWidth={3.2} strokeLinecap="round" />
        <polygon points={`${tip} ${a} ${b}`} fill={color} />
        {labels && L > 40 && (
          <g>
            <text x={to.x + ux * 22} y={to.y + uy * 22} fill={color} fontFamily="Geist Mono, monospace" fontSize={18} fontWeight={500} letterSpacing="0.08em">
              {label}
            </text>
            <text x={to.x + ux * 22} y={to.y + uy * 22 + 22} fill={C.muted} fontFamily="Noto Sans SC, sans-serif" fontSize={14} fontWeight={500}>
              {sub}
            </text>
          </g>
        )}
      </g>
    );
  };
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <circle cx={O.x} cy={O.y} r={5} fill={C.ink} />
      {px > 0.02 && arrow(O, X, C.coral, 'X', '30°')}
      {py > 0.02 && arrow(O, Y, C.mint, 'Y', 'UP')}
      {pz > 0.02 && arrow(O, Z, C.indigo, 'Z', '30°')}
    </svg>
  );
};

export const FaceUI: React.FC<{p0: Pt; px: Pt; pz: Pt; w: number; h: number; opacity?: number; children: React.ReactNode}> = ({
  p0,
  px,
  pz,
  w,
  h,
  opacity = 1,
  children,
}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: w,
      height: h,
      transform: faceMatrix(p0, px, pz, w, h),
      transformOrigin: '0 0',
      opacity,
      overflow: 'hidden',
      pointerEvents: 'none',
    }}
  >
    {children}
  </div>
);

export const topFace = (b: BoxSpec, origin: Pt, unit: number, mode: Mode, yaw: number) => {
  const h = Math.max(0.02, b.h * (b.appear ?? 1));
  const P = (px: number, py: number, pz: number) => toScreen({x: px, y: py, z: pz}, origin, unit, mode, yaw);
  return {
    p0: P(b.x, b.y + h, b.z),
    px: P(b.x + b.w, b.y + h, b.z),
    pz: P(b.x, b.y + h, b.z + b.d),
  };
};

export const CardFace: React.FC<{title: string; value: string; note?: string; bar?: number; dark?: boolean}> = ({title, value, note, bar = 0.62, dark}) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: dark ? C.navy : C.white,
      color: dark ? C.white : C.ink,
      padding: '10% 9%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}
  >
    <div style={{...mono(11, 500, 0.14), opacity: 0.55}}>{title}</div>
    <div style={{...sc(28, 900, -0.02), letterSpacing: '-0.04em'}}>{value}</div>
    <div>
      <div style={{height: 5, background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(27,36,48,0.08)', borderRadius: 2, overflow: 'hidden'}}>
        <div style={{width: `${bar * 100}%`, height: '100%', background: C.coral}} />
      </div>
      {note && <div style={{...mono(10, 500, 0.08), marginTop: 6, color: C.mint}}>{note}</div>}
    </div>
  </div>
);

export const v3 = (x: number, y: number, z: number): V3 => ({x, y, z});
