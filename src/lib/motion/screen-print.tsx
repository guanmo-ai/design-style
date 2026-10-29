import React from 'react';
const n1 = (v: number) => v.toFixed(1);
export const flipScale = (u: number, duration = 10) => u < 0 ? 1 : u < duration ? Math.abs(Math.cos((u / duration) * Math.PI)) : 1;
export const Squeegee: React.FC<{x: number; reverse: boolean; ink: string; color: string; handle: string; paper: string}> = ({x: sq, reverse: pass2, ink, color, handle, paper}) => (
        <g transform={`translate(${n1(sq)} 0) rotate(${pass2 ? 4 : -4} 0 640)`}>
          <rect x={pass2 ? -34 : 14} y={300} width={20} height={680} fill={pass2 ? ink : color} opacity={0.9} />
          <rect x={-22} y={290} width={30} height={700} rx={6} fill={handle} stroke={ink} strokeWidth={5} />
          <rect x={pass2 ? -32 : 8} y={296} width={12} height={688} fill="#3A3A3A" stroke={ink} strokeWidth={3} />
          <rect x={-40} y={600} width={66} height={80} rx={14} fill={paper} stroke={ink} strokeWidth={5} />
        </g>
);
