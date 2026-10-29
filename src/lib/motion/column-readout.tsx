import React from 'react';
import {E, POP, spr, tween} from '../anim';
export const createColumnReadout = ({accent, sc, mono}: {
  accent: string; sc: (size: number, weight: number, spacing: number) => React.CSSProperties;
  mono: (size: number, weight: number) => React.CSSProperties;
}) => {
  const ColumnReadout: React.FC<{f: number; hs: number[]; shortest: number; next: number;
    RIGHT: {x0: number; y0: number; colW: number; gap: number}; ALG_LAND: number[]}> = ({f, hs, shortest, next, RIGHT, ALG_LAND}) => (
    <>
      {hs.map((h, c) => {
        const x = RIGHT.x0 + c * (RIGHT.colW + RIGHT.gap) + RIGHT.colW / 2;
        const y = RIGHT.y0 + h - RIGHT.gap + 34;
        if (y > 1060) return null;
        const isMin = c === shortest && next >= 0;
        const pop = isMin && next < 3 ? spr(f, ALG_LAND[next] - 30, POP, 24) : 0;
        return (
          <div key={c} style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${1 + 0.12 * pop * (1 - tween(f, ALG_LAND[Math.max(0, next)] - 14, 10))})`, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 13px 9px', borderRadius: 999, background: isMin ? accent : 'rgba(255,255,255,.08)', boxShadow: isMin ? '0 6px 18px rgba(242,70,46,.35)' : 'inset 0 0 0 1px rgba(255,255,255,.1)', whiteSpace: 'nowrap'}}>
            {isMin && <span style={{...sc(16, 700, 0.06), color: '#fff'}}>最短</span>}
            <span style={{...mono(18, 500), color: isMin ? '#fff' : 'rgba(244,242,238,.7)'}}>{Math.round(h - RIGHT.gap)}</span>
          </div>
        );
      })}
    </>
  );
  return ColumnReadout;
};
