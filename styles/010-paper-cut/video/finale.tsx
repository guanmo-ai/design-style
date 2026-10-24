/**
 * 010 · 片尾：窗花收点盖章。
 * 学 Swiss：开场同一朵窗花回来，不是换一张字幕卡。
 * 学 Bento：整朵缩成一点再落成印章，像七张卡缩回图标。
 * 学两者：元素一个个 POP，过冲砸拍，章重叠 32 帧。
 */
import React from 'react';
import {E, POP, shake, spr, tween} from '../../../src/lib/anim';
import {C, HILLS} from '../tokens';
import {AT} from './timeline';
import {W, n1} from './layers';
import {FolkFlower} from './opening';

const STACK = [
  {fill: HILLS[1], rot: -7.5, dx: -22, dy: 16},
  {fill: HILLS[4], rot: 5.5, dx: 14, dy: 7},
  {fill: C.paper, rot: -1.2, dx: 0, dy: 0},
] as const;

const SLIPS = [
  {a: '对折是民俗剪纸的骨架', b: '旋转展开就是它的入场', rot: -3.2},
  {a: '一层一色，影子落在下一张上', b: '没有影子就只是贴纸', rot: 1.4},
  {a: '换一种剪纸', b: '就换一种纸的运动', rot: 2.8},
] as const;

const tornTop = (w: number, seed: number) => {
  let d = `M0 18`;
  for (let i = 0; i <= 14; i++) {
    const x = (w / 14) * i;
    const y = 10 + 9 * Math.sin(i * 1.7 + seed) + 5 * Math.sin(i * 0.6 + seed * 2);
    d += ` L${n1(x)} ${n1(y)}`;
  }
  d += ` L${w} 18 L${w} 148`;
  for (let i = 14; i >= 0; i--) {
    const x = (w / 14) * i;
    const y = 148 + 7 * Math.sin(i * 2.1 + seed + 1);
    d += ` L${n1(x)} ${n1(y)}`;
  }
  return `${d} Z`;
};

export const Take: React.FC<{f: number}> = ({f}) => {
  const t0 = AT.take;
  const t = f - t0;
  const hit = shake(f, [[t0 + 60, 16]]);
  const enter = spr(f, t0 - 22, POP, 32);
  const shrink = tween(f, t0, 52, 0, 1, E.in);
  const slam = spr(f, t0 + 52, POP, 28);
  const scale = (1.18 - 1.1 * shrink) * (1 - slam) + slam * 0.72;
  const spin = 24 + t * 2.4 + shrink * 380 + slam * 18;
  const idle = slam * Math.sin(t * 0.045) * 2.2;
  const punchAt = t0 + 62;
  const zi = spr(f, t0 + 112, POP, 28);
  const handle = spr(f, t0 + 142, POP, 28);

  return (
    <g transform={`translate(${n1(hit.x)} ${n1(hit.y)})`}>
      <rect width={W} height={1080} fill={C.wall} />
      {STACK.map((s, i) => {
        const k = spr(f, t0 + 2 + i * 4, POP, 28);
        if (k < 0.02) return null;
        return (
          <g
            key={i}
            opacity={Math.min(1, k)}
            transform={`translate(960 ${n1(428 + (1 - k) * 70)}) rotate(${n1(s.rot)}) translate(${n1(-270 + s.dx)} ${n1(-176 + s.dy)})`}
            filter="url(#shNear)"
          >
            <rect width={540} height={352} rx={10} fill={s.fill} />
          </g>
        );
      })}
      {enter > 0.02 && (
        <g transform={`translate(960 ${n1(388 + idle)})`} opacity={Math.min(1, enter)}>
          <FolkFlower f={f} scale={scale} spin={spin} punchAt={slam > 0.35 ? punchAt : false} compact={0.55} />
        </g>
      )}
      {slam > 0.4 && (
        <g opacity={slam}>
          <rect x={956} y={0} width={8} height={n1(Math.max(8, 388 - 412 * scale))} rx={3} fill={C.folk} />
          <circle cx={960} cy={16} r={9} fill={C.folk} />
        </g>
      )}
      {zi > 0.02 && (
        <text
          x={960}
          y={n1(408 + idle)}
          fontFamily="Noto Sans SC"
          fontSize={100}
          fontWeight={900}
          textAnchor="middle"
          fill={C.wall}
          opacity={Math.min(1, zi)}
          transform={`translate(960 ${n1(388 + idle)}) scale(${zi.toFixed(3)}) translate(-960 ${n1(-388 - idle)})`}
        >
          剪
        </text>
      )}
      {handle > 0.02 && (
        <g
          opacity={Math.min(1, handle)}
          transform={`translate(960 ${n1(718 + (1 - handle) * 24 + idle)})`}
          filter="url(#shMid)"
        >
          <rect x={-200} y={-28} width={400} height={56} rx={6} fill={C.folk} mask="url(#handleCut)" />
        </g>
      )}
      {SLIPS.map((s, i) => {
        const k = spr(f, t0 + 172 + i * 30, POP, 28);
        if (k < 0.02) return null;
        const flutter = Math.sin(t * 0.07 + i * 1.3) * 3.4;
        const x = 140 + i * 560;
        return (
          <g
            key={i}
            opacity={Math.min(1, k)}
            transform={`translate(${n1(x + flutter)} ${n1(760 + (1 - k) * -72)}) rotate(${n1(s.rot + flutter * 0.2)})`}
            filter="url(#shMid)"
          >
            <path d={tornTop(480, i * 2.2)} fill={C.folk} mask={`url(#slip${i})`} />
            <circle cx={36} cy={22} r={7} fill={C.wall} />
            <circle cx={444} cy={22} r={7} fill={C.wall} />
          </g>
        );
      })}
      <defs>
        <mask id="handleCut" maskUnits="userSpaceOnUse" x="-200" y="-28" width="400" height="56">
          <rect x="-200" y="-28" width="400" height="56" rx="6" fill="white" />
          <text x="0" y="10" fontFamily="Jost" fontSize="26" fontWeight="600" textAnchor="middle" fill="black" letterSpacing="1.4">
            @guanmo_ai
          </text>
        </mask>
        {SLIPS.map((s, i) => (
          <mask key={i} id={`slip${i}`} maskUnits="userSpaceOnUse" x="0" y="0" width="480" height="160">
            <rect width="480" height="160" fill="white" />
            <text x="240" y="78" fontFamily="Noto Sans SC" fontSize="24" fontWeight="700" textAnchor="middle" fill="black">
              {s.a}
            </text>
            <text x="240" y="112" fontFamily="Noto Sans SC" fontSize="22" fontWeight="500" textAnchor="middle" fill="black">
              {s.b}
            </text>
          </mask>
        ))}
      </defs>
    </g>
  );
};
