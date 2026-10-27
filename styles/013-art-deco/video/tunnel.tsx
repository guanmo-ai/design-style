/**
 * 013 · Art Deco —— 01 三线：穿过一串三线拱门（像无线电城音乐厅一圈套一圈的金拱）。
 * 真正的纵深：每道门是一张放在 z 上的平面，屏幕缩放 = F / (z − 镜头 z)。每半拍有一道门从镜头边擦过去，
 * 擦过之前，光顺着它的三条线从中轴往两边跑一圈。最后停在一扇十二辐的玫瑰窗前——它就是下一章的万花筒。
 */
import React from 'react';
import {E, clamp, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {AT} from './timeline';
import {AX, Diamond, Flare, G, H, Streak, W, mirror, stepHalf} from './ui';

const F = 1000;
const CY = 540;
const V = 1000 / 30; // 每帧走多少 z：一拍 30 帧走两道门
/** 镜头 z：48—96 起步加速（海报推进），之后匀速；240—270 刹车，停在玫瑰窗前 */
export const camZ = (f: number) => {
  if (f < 48) return 0;
  if (f < 96) {
    const t = f - 48;
    return (V / 2) * (t * t) / 48;
  }
  const z96 = (V / 2) * 48;
  if (f < 240) return z96 + (f - 96) * V;
  const t = Math.min(f, 270) - 240;
  return z96 + 144 * V + V * t - (V / 60) * t * t;
};
const Z0 = camZ(120); // 第一道门在 f120 擦过镜头
const N = 11; // f120, 135 … 270：最后两道在刹车时框住玫瑰窗
const ROSE_Z = camZ(270) + F; // f270 时玫瑰窗正好铺满画面（缩放 1）

type Kind = 0 | 1 | 2;
/** 门（世界坐标，中心在 0,0）：0 阶梯切角框 · 1 拱门 · 2 阶梯门楣 */
const halfPath = (kind: Kind, i: number) => {
  const g = i * 16;
  if (kind === 0) return stepHalf(0, -495 + g, 880 - g, 990 - 2 * g, 26);
  if (kind === 1) {
    const hw = 700 - g;
    return `M0 ${-830 + g} A${hw} ${hw} 0 0 1 ${hw} ${-130} V${495 - g}`;
  }
  const x = 880 - g;
  return `M0 ${-495 + g} H${x - 420} V${-380 + g} H${x - 210} V${-265 + g} H${x} V${495 - g}`;
};
/** 每一道门在 z 上的位置 */
const portalZ = (i: number) => Z0 + i * 500;

const Portal: React.FC<{i: number; f: number; cz: number}> = ({i, f, cz}) => {
  const dist = portalZ(i) - cz;
  if (dist < 90 || dist > 6500) return null;
  const s = F / dist;
  const fog = clamp(1 - (dist - 1200) / 4800) * clamp((dist - 90) / 160);
  const kind = (i % 3) as Kind;
  // 门在 f = 120 + 15i 擦过镜头；之前 36 帧开始，光顺着三条线跑
  const pass = AT.tunnel + 30 + i * 15;
  const sp = tween(f, pass - 40, 22, 0, 1, E.out);
  const ws = [7, 2.6, 2.6];
  return (
    <g transform={`translate(${AX} ${CY}) scale(${s})`} opacity={fog}>
      {ws.map((sw, k) => (
        <g key={k}>
          <path d={halfPath(kind, k)} fill="none" stroke={G} strokeWidth={sw} />
          <path d={halfPath(kind, k)} fill="none" stroke={G} strokeWidth={sw} transform={mirror(0)} />
        </g>
      ))}
      {[1, -1].map((side) => (
        <Streak key={side} d={halfPath(kind, 0)} p={sp} w={5} len={0.18} tf={side < 0 ? mirror(0) : undefined} />
      ))}
      {/* 拱心石 + 门楣上的小扇 */}
      <Diamond x={0} y={kind === 1 ? -830 : -495} r={22} fill={C.goldLt} />
      {kind !== 2 && (
        <g opacity={0.9}>
          {Array.from({length: 9}, (_, k) => {
            const a = Math.PI + (Math.PI * (k + 0.5)) / 9;
            const y0 = kind === 1 ? -760 : -440;
            return <path key={k} d={`M0 ${y0} L${(90 * Math.cos(a)).toFixed(1)} ${(y0 + 90 * Math.sin(a)).toFixed(1)}`} stroke={G} strokeWidth={2} />;
          })}
        </g>
      )}
    </g>
  );
};

/** 玫瑰窗：三重圆 + 十二辐，最后铺满画面，交给万花筒 */
export const ROSE_R = 470;
export const Rose: React.FC<{s: number; op?: number}> = ({s, op = 1}) => (
  <g transform={`translate(${AX} ${CY}) scale(${s})`} opacity={op}>
    {[0, 1, 2].map((k) => (
      <circle key={k} r={ROSE_R - k * 14} fill="none" stroke={G} strokeWidth={k ? 2.4 : 6} />
    ))}
    <circle r={90} fill="none" stroke={G} strokeWidth={3} />
    {Array.from({length: 12}, (_, k) => {
      const a = (Math.PI * 2 * k) / 12 - Math.PI / 2;
      return <path key={k} d={`M${90 * Math.cos(a)} ${90 * Math.sin(a)} L${(ROSE_R - 28) * Math.cos(a)} ${(ROSE_R - 28) * Math.sin(a)}`} stroke={G} strokeWidth={2.4} />;
    })}
    <Diamond x={0} y={0} r={16} fill={C.goldLt} />
  </g>
);

export const Tunnel: React.FC<{f: number}> = ({f}) => {
  if (f < 44 || f > AT.kaleido + 2) return null;
  const cz = camZ(f);
  const roseS = F / (ROSE_Z - cz);
  // 尽头的光：越往里越亮
  const glow = tween(f, 60, 200, 0.25, 1, E.inOut);
  return (
    <g>
      <radialGradient id="tglow" cx={AX} cy={CY} r={700} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={C.goldDk} stopOpacity={0.55 * glow} />
        <stop offset="0.5" stopColor={C.goldDk} stopOpacity={0.12 * glow} />
        <stop offset="1" stopColor={C.onyx} stopOpacity={0} />
      </radialGradient>
      <rect width={W} height={H} fill="url(#tglow)" />
      <Rose s={roseS} op={clamp(roseS * 6)} />
      {Array.from({length: N}, (_, i) => N - 1 - i).map((i) => (
        <Portal key={i} i={i} f={f} cz={cz} />
      ))}
      <Flare x={AX} y={CY} k={tween(f, AT.kaleido - 8, 8) * 1.4} />
    </g>
  );
};
