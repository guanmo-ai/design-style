import React from 'react';
import {random} from 'remotion';
import {tween} from '../anim';
const n1 = (v: number) => v.toFixed(1);
export const createBurst = ({colors: CANDY, ink}: {colors: readonly string[]; ink: string}) => {
const Burst: React.FC<{f: number; t0: number; x: number; y: number; n?: number; seed?: string; power?: number}> = ({f, t0, x, y, n = 44, seed = 'b', power = 1}) => {
  const t = f - t0;
  if (t < 0 || t > 70) return null;
  const o = 1 - tween(f, t0 + 40, 30);
  return (
    <g opacity={o}>
      {Array.from({length: n}, (_, i) => {
        const a = random(`${seed}a${i}`) * Math.PI * 2;
        const v = (10 + random(`${seed}v${i}`) * 16) * power;
        const px = x + Math.cos(a) * v * t * Math.exp(-t / 40);
        const py = y + Math.sin(a) * v * t * Math.exp(-t / 40) + 0.09 * t * t;
        const c = CANDY[i % CANDY.length];
        const r = random(`${seed}r${i}`) * 360 + t * 9;
        const k = random(`${seed}k${i}`);
        const tr = `translate(${n1(px)} ${n1(py)}) rotate(${n1(r)})`;
        if (k < 0.4) return <rect key={i} x={-14} y={-4} width={28} height={8} fill={c} stroke={ink} strokeWidth={2} transform={tr} />;
        if (k < 0.7) return <circle key={i} r={8} fill={c} stroke={ink} strokeWidth={2} transform={tr} />;
        return <path key={i} d="M0 -11L10 8H-10Z" fill={c} stroke={ink} strokeWidth={2} transform={tr} />;
      })}
    </g>
  );
};

return Burst;
};
