/**
 * 纸片：影子 = 高度。离桌面 h px → 影子往右下偏 (0.5h, h)、模糊 0.4h、浓度 0.3 − 0.004h；纸本身放大 1 + 0.0032h。
 * 几块纸属于同一张（手 = 袖子 + 手掌 + 袖口）时影子合成一块再模糊，重叠处不会叠深。
 */
import React from 'react';
import {C, PAPER} from '../tokens';

/** sx / sy：只沿纸条长边 / 短边缩放（sy 为负 = 翻到背面） */
export type Pose = {x: number; y: number; a?: number; s?: number; h?: number; sx?: number; sy?: number};
export type Part = {d: string; fill: string};

const MAXH = 120;

/** 每个整数高度一个模糊滤镜（0.4 px 一档，肉眼分不出台阶） */
export const PaperDefs: React.FC = () => (
  <defs>
    {Array.from({length: MAXH + 1}, (_, h) => (
      <filter key={h} id={`pb${h}`} x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation={PAPER.blur * h} />
      </filter>
    ))}
  </defs>
);

export const tf = (x: number, y: number, a: number, s: number, sx = 1, sy = 1) =>
  `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${a.toFixed(3)}) scale(${(s * sx).toFixed(4)} ${(s * sy).toFixed(4)})`;

export const Shadow: React.FC<{parts: Part[]; p: Pose}> = ({parts, p}) => {
  const h = Math.max(0, p.h ?? PAPER.rest);
  if (h < 0.5) return null;
  const s = p.s ?? 1;
  return (
    <g opacity={PAPER.opacity(h)} filter={`url(#pb${Math.min(MAXH, Math.round(h))})`}>
      <g transform={tf(p.x + PAPER.dx * h, p.y + PAPER.dy * h, p.a ?? 0, s, p.sx, p.sy)}>
        {parts.map((q, i) => <path key={i} d={q.d} fill={C.shadow} />)}
      </g>
    </g>
  );
};

export const Body: React.FC<{parts: Part[]; p: Pose; style?: React.CSSProperties}> = ({parts, p, style}) => {
  const h = Math.max(0, p.h ?? PAPER.rest);
  const s = (p.s ?? 1) * (1 + PAPER.persp * h);
  return (
    <g transform={tf(p.x, p.y, p.a ?? 0, s, p.sx, p.sy)} style={style}>
      {parts.map((q, i) => <path key={i} d={q.d} fill={q.fill} />)}
    </g>
  );
};

/** 一张纸：先影子后纸 */
export const Piece: React.FC<{d: string; fill: string; p: Pose; style?: React.CSSProperties}> = ({d, fill, p, style}) => {
  const parts = [{d, fill}];
  return (
    <>
      <Shadow parts={parts} p={p} />
      <Body parts={parts} p={p} style={style} />
    </>
  );
};

/** 多块拼成的一张纸（影子只算一次） */
export const Sheet: React.FC<{parts: Part[]; p: Pose}> = ({parts, p}) => (
  <>
    <Shadow parts={parts} p={p} />
    <Body parts={parts} p={p} />
  </>
);

/** Body 用的同一个变换（给裁切路径用） */
export const bodyTf = (p: Pose) => tf(p.x, p.y, p.a ?? 0, (p.s ?? 1) * (1 + PAPER.persp * Math.max(0, p.h ?? PAPER.rest)), p.sx, p.sy);

/** 叠印色：两种油墨逐通道相乘 */
export const multiply = (a: string, b: string) => {
  const ch = (c: string, i: number) => parseInt(c.slice(1 + 2 * i, 3 + 2 * i), 16);
  return '#' + [0, 1, 2].map((i) => Math.round((ch(a, i) * ch(b, i)) / 255).toString(16).padStart(2, '0')).join('');
};
