/** 004 · Memphis —— 积木、图案与小工具（全片用 SVG：每一块都是“糖果色 + 黑描边 + 硬投影”） */
import React from 'react';
import {random} from 'remotion';
import {E, POP, spr, tween} from '../../../src/lib/anim';
import {C, F, LINE, SHADOW, SQUASH} from '../tokens';

export type P = {f: number};
export const W = 1920;
export const H = 1080;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const c01 = (t: number) => Math.min(1, Math.max(0, t));
export const n1 = (v: number) => v.toFixed(1);
export const rad = (d: number) => (d * Math.PI) / 180;

/* ─────────── 形状（都以 (0,0) 为中心） ─────────── */
export const circ = (r: number) => `M${-r} 0a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
export const rect = (w: number, h: number, rx = 0) =>
  rx > 0
    ? `M${-w / 2 + rx} ${-h / 2}H${w / 2 - rx}Q${w / 2} ${-h / 2} ${w / 2} ${-h / 2 + rx}V${h / 2 - rx}Q${w / 2} ${h / 2} ${w / 2 - rx} ${h / 2}H${-w / 2 + rx}Q${-w / 2} ${h / 2} ${-w / 2} ${h / 2 - rx}V${-h / 2 + rx}Q${-w / 2} ${-h / 2} ${-w / 2 + rx} ${-h / 2}Z`
    : `M${-w / 2} ${-h / 2}H${w / 2}V${h / 2}H${-w / 2}Z`;
/** 三角形：底边在下，(0,0) 在外接矩形中心 */
export const tri = (w: number, h: number) => `M0 ${-h / 2}L${w / 2} ${h / 2}H${-w / 2}Z`;
/** 半圆：平边在下，(0,0) 在平边中点 */
export const half = (r: number) => `M${-r} 0A${r} ${r} 0 0 1 ${r} 0Z`;
export const poly = (pts: [number, number][]) => 'M' + pts.map(([x, y]) => `${n1(x)} ${n1(y)}`).join('L') + 'Z';
/** 波浪线：从 (x, y) 往右 w，振幅 amp，n 个波，相位 ph */
export const squig = (x: number, y: number, w: number, amp: number, n: number, ph = 0, step = 6) => {
  let d = '';
  for (let k = 0; k <= w; k += step) d += (k ? 'L' : 'M') + n1(x + k) + ' ' + n1(y + amp * Math.sin(ph + (2 * Math.PI * n * k) / w));
  return d;
};
/** 竖向波浪线 */
export const squigV = (x: number, y: number, h: number, amp: number, n: number, ph = 0, step = 6) => {
  let d = '';
  for (let k = 0; k <= h; k += step) d += (k ? 'L' : 'M') + n1(x + amp * Math.sin(ph + (2 * Math.PI * n * k) / h)) + ' ' + n1(y + k);
  return d;
};

/* ─────────── 一块积木：硬投影 + 糖果色 + 黑描边 ─────────── */
export const Blk: React.FC<{d: string; fill: string; sw?: number; sh?: number; pat?: string; o?: number}> = ({d, fill, sw = LINE.outline, sh = SHADOW.dx, pat, o}) => (
  <g opacity={o}>
    {sh > 0 && <path d={d} fill={C.ink} transform={`translate(${sh} ${sh})`} />}
    <path d={d} fill={fill} />
    {pat && <path d={d} fill={`url(#${pat})`} />}
    {sw > 0 && <path d={d} fill="none" stroke={C.ink} strokeWidth={sw} strokeLinejoin="round" />}
  </g>
);

/** 一根带描边的粗线（波浪线、管子）：先画投影，再画黑边，再画颜色 */
export const Tube: React.FC<{d: string; c: string; w: number; p?: number; sw?: number; sh?: number; cap?: 'round' | 'butt'}> = ({d, c, w, p = 1, sw = LINE.outline, sh = SHADOW.dx * 0.8, cap = 'round'}) => {
  if (p <= 0.001) return null;
  const dash = p < 0.999 ? {pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - p} : {};
  return (
    <g fill="none" strokeLinecap={cap} strokeLinejoin="round">
      {sh > 0 && <path d={d} stroke={C.ink} strokeWidth={w + sw * 2} transform={`translate(${sh} ${sh})`} {...dash} />}
      {sw > 0 && <path d={d} stroke={C.ink} strokeWidth={w + sw * 2} {...dash} />}
      <path d={d} stroke={c} strokeWidth={w} {...dash} />
    </g>
  );
};

/* ─────────── 动作 ─────────── */
/** 掉下来 → 落地压扁 → 回弹。返回位移和缩放（以落地点为原点缩放） */
export const drop = (f: number, t0: number, fall = 14, from = -900) => {
  if (f < t0) return {dy: from, sx: 1, sy: 1, on: false};
  const t = f - t0;
  if (t < fall) {
    const p = t / fall;
    return {dy: from * (1 - p * p), sx: 0.9, sy: 1.12, on: true};
  }
  const u = t - fall;
  const s = Math.exp(-u / 7) * Math.cos(u * 0.42);
  return {dy: 0, sx: 1 + SQUASH * s, sy: 1 - SQUASH * s, on: true};
};

/** 掉下来的一块：(x, y) 是中心，hb 是中心到底边的距离（压扁时底边不动） */
export const Drop: React.FC<{f: number; t0: number; x: number; y: number; hb: number; rot?: number; fall?: number; from?: number; s?: number; children: React.ReactNode}> = ({f, t0, x, y, hb, rot = 0, fall = 14, from = -900, s = 1, children}) => {
  const d = drop(f, t0, fall, from);
  if (!d.on) return null;
  return (
    <g transform={`translate(${n1(x)} ${n1(y + d.dy + hb)}) rotate(${n1(rot)}) scale(${(d.sx * s).toFixed(4)} ${(d.sy * s).toFixed(4)}) translate(0 ${-hb})`}>{children}</g>
  );
};

/** 弹出来：从 0 放大，过冲再回到 1 */
export const popS = (f: number, t0: number, d = 26) => (f < t0 ? 0 : spr(f, t0, POP, d));
export const Pop: React.FC<{f: number; t0: number; x: number; y: number; rot?: number; s?: number; spin?: number; children: React.ReactNode}> = ({f, t0, x, y, rot = 0, s = 1, spin = 0, children}) => {
  const k = popS(f, t0);
  if (k <= 0.001) return null;
  return <g transform={`translate(${n1(x)} ${n1(y)}) rotate(${n1(rot + spin * (1 - k))}) scale(${(k * s).toFixed(4)})`}>{children}</g>;
};

/** 每拍一次的小跳：拍点上压一下 */
export const beatPulse = (f: number, from: number, amt = 0.06) => {
  if (f < from) return 1;
  const u = (f - from) % 30;
  return 1 + amt * Math.exp(-u / 5) * Math.cos(u * 0.5);
};

/** 退场：t0 之后缩小消失 */
export const out = (f: number, t0: number, d = 10) => 1 - tween(f, t0, d, 0, 1, E.in);

/* ─────────── 文字 ─────────── */
export const Txt: React.FC<{
  x: number; y: number; size: number; font?: keyof typeof F; w?: number; c?: string; anchor?: 'start' | 'middle' | 'end';
  ls?: number; o?: number; rot?: number; stroke?: number; sh?: number; italic?: boolean; children: React.ReactNode;
}> = ({x, y, size, font = 'cn', w = 900, c = C.ink, anchor = 'start', ls = 0, o, rot = 0, stroke = 0, sh = 0, italic, children}) => {
  const common = {
    x: 0, y: 0, fontFamily: F[font], fontSize: size, fontWeight: w, textAnchor: anchor, letterSpacing: `${ls}em`,
    fontStyle: italic ? 'italic' : undefined,
  } as const;
  return (
    <g transform={`translate(${n1(x)} ${n1(y)}) rotate(${n1(rot)})`} opacity={o}>
      {sh > 0 && <text {...common} fill={C.ink} stroke={stroke ? C.ink : undefined} strokeWidth={stroke || undefined} strokeLinejoin="round" transform={`translate(${sh} ${sh})`}>{children}</text>}
      <text {...common} fill={c} stroke={stroke ? C.ink : undefined} strokeWidth={stroke || undefined} strokeLinejoin="round" paintOrder="stroke">{children}</text>
    </g>
  );
};

/** 一个贴纸标签：圆角矩形 + 黑描边 + 硬投影 + 文字 */
export const Tag: React.FC<{x: number; y: number; w: number; h: number; fill: string; rot?: number; children: React.ReactNode; sh?: number}> = ({x, y, w, h, fill, rot = 0, children, sh = 6}) => (
  <g transform={`translate(${n1(x)} ${n1(y)}) rotate(${rot})`}>
    <Blk d={rect(w, h, h / 2)} fill={fill} sw={4} sh={sh} />
    {children}
  </g>
);

/* ─────────── 图案（<pattern>，可以滚动） ─────────── */
const bacterio = (() => {
  // 细菌纹：一块 120×120 的砖，里面撒十几条短短的、弯来弯去的“小虫”
  const out: string[] = [];
  for (let i = 0; i < 16; i++) {
    const x = random(`bx${i}`) * 120;
    const y = random(`by${i}`) * 120;
    const a = random(`ba${i}`) * Math.PI * 2;
    const L = 10 + random(`bl${i}`) * 14;
    let d = `M${n1(x)} ${n1(y)}`;
    let px = x;
    let py = y;
    let ang = a;
    for (let k = 0; k < 4; k++) {
      ang += (random(`bk${i}-${k}`) - 0.5) * 2.2;
      const qx = px + Math.cos(ang) * L * 0.5;
      const qy = py + Math.sin(ang) * L * 0.5;
      px = qx + Math.cos(ang + 0.8) * L * 0.5;
      py = qy + Math.sin(ang + 0.8) * L * 0.5;
      d += `Q${n1(qx)} ${n1(qy)} ${n1(px)} ${n1(py)}`;
    }
    out.push(d);
  }
  return out;
})();
const confettiBits = (() => {
  const cols = [C.ink, C.ink, C.blue, C.red, C.teal, C.pink];
  return Array.from({length: 22}, (_, i) => ({
    x: random(`cx${i}`) * 260,
    y: random(`cy${i}`) * 260,
    a: random(`ca${i}`) * 180,
    t: random(`ct${i}`),
    c: cols[Math.floor(random(`cc${i}`) * cols.length)],
  }));
})();
export const Confetti: React.FC<{x0?: number; y0?: number; o?: number}> = ({x0 = 0, y0 = 0, o}) => (
  <g opacity={o}>
    {confettiBits.map((b, i) => {
      const x = x0 + b.x;
      const y = y0 + b.y;
      const tr = `rotate(${b.a.toFixed(0)} ${n1(x)} ${n1(y)})`;
      if (b.t < 0.4) return <rect key={i} x={x - 9} y={y - 2.5} width={18} height={5} fill={b.c} transform={tr} />;
      if (b.t < 0.7) return <circle key={i} cx={x} cy={y} r={4} fill={b.c} />;
      return <path key={i} d={`M${n1(x)} ${n1(y - 7)}L${n1(x + 7)} ${n1(y + 5)}L${n1(x - 7)} ${n1(y + 5)}Z`} fill="none" stroke={b.c} strokeWidth={2.5} transform={tr} />;
    })}
  </g>
);

/** 所有图案：id 固定，滚动用 patternTransform；scroll 是滚动的像素（每帧一点） */
export const Patterns: React.FC<{f: number}> = ({f}) => {
  const s = f * 0.6;
  return (
    <defs>
      <pattern id="zebra" width={28} height={28} patternUnits="userSpaceOnUse" patternTransform={`rotate(30) translate(${n1(s)} 0)`}>
        <rect width={14} height={28} fill={C.ink} />
      </pattern>
      <pattern id="zebraW" width={28} height={28} patternUnits="userSpaceOnUse" patternTransform={`rotate(-30) translate(${n1(-s)} 0)`}>
        <rect width={14} height={28} fill={C.white} />
      </pattern>
      <pattern id="grid" width={32} height={32} patternUnits="userSpaceOnUse" patternTransform={`translate(${n1(s * 0.5)} ${n1(s * 0.5)})`}>
        <path d="M0 0H32M0 0V32" stroke={C.ink} strokeWidth={3} fill="none" />
      </pattern>
      <pattern id="dots" width={34} height={34} patternUnits="userSpaceOnUse" patternTransform={`translate(${n1(-s)} 0)`}>
        <circle cx={8.5} cy={8.5} r={5} fill={C.ink} />
        <circle cx={25.5} cy={25.5} r={5} fill={C.ink} />
      </pattern>
      <pattern id="dotsW" width={30} height={30} patternUnits="userSpaceOnUse" patternTransform={`translate(${n1(s)} 0)`}>
        <circle cx={7.5} cy={7.5} r={4} fill={C.white} />
        <circle cx={22.5} cy={22.5} r={4} fill={C.white} />
      </pattern>
      <pattern id="squig" width={80} height={40} patternUnits="userSpaceOnUse" patternTransform={`translate(${n1(s)} 0)`}>
        <path d="M0 20Q20 4 40 20T80 20" stroke={C.ink} strokeWidth={6} fill="none" />
      </pattern>
      <pattern id="bacterio" width={120} height={120} patternUnits="userSpaceOnUse" patternTransform={`translate(${n1(-s * 0.5)} ${n1(s * 0.3)})`}>
        {bacterio.map((d, i) => (
          <path key={i} d={d} stroke={C.ink} strokeWidth={4.5} fill="none" strokeLinecap="round" />
        ))}
      </pattern>
      <pattern id="confetti" width={260} height={260} patternUnits="userSpaceOnUse" patternTransform={`translate(${n1(s * 0.4)} ${n1(-s * 0.2)})`}>
        <Confetti />
      </pattern>
    </defs>
  );
};

/* ─────────── 换幕：下一章的底色带着波浪边扫过来 ─────────── */
/** t = 换幕的拍点；在 [t - dur, t] 里扫满全屏；dir = 方向 */
export const Sweep: React.FC<{f: number; t: number; c: string; dir?: 'right' | 'left' | 'down' | 'up'; dur?: number; pat?: string}> = ({f, t, c, dir = 'right', dur = 14, pat}) => {
  if (f < t - dur || f >= t) return null;
  const p = tween(f, t - dur, dur, 0, 1, E.in);
  const horiz = dir === 'right' || dir === 'left';
  const span = horiz ? W : H;
  const other = horiz ? H : W;
  const edge = lerp(-140, span + 140, p); // 波浪边的位置（沿扫的方向）
  const amp = 46;
  // 先在“往右扫”的坐标里画，再旋转 / 翻转到目标方向
  let d = `M-3000 -200L${n1(edge)} -200`;
  for (let k = -200; k <= other + 200; k += 12) d += `L${n1(edge + amp * Math.sin(k / 70 + f * 0.25))} ${k}`;
  d += `L-3000 ${other + 200}Z`;
  const tf =
    dir === 'right' ? '' : dir === 'left' ? `translate(${W} 0) scale(-1 1)` : dir === 'down' ? `translate(${W} 0) rotate(90)` : `translate(0 ${H}) rotate(-90)`;
  return (
    <g transform={tf}>
      <path d={d} fill={C.ink} transform="translate(16 0)" />
      <path d={d} fill={c} />
      {pat && <path d={d} fill={`url(#${pat})`} opacity={0.5} />}
      <path d={d} fill="none" stroke={C.ink} strokeWidth={6} />
    </g>
  );
};

/** 圆形转场：从 (cx, cy) 长出一个圆盖满全屏 */
export const Iris: React.FC<{f: number; t: number; c: string; cx: number; cy: number; dur?: number; r0?: number}> = ({f, t, c, cx, cy, dur = 14, r0 = 0}) => {
  if (f < t - dur || f >= t) return null;
  const r = lerp(r0, 2300, tween(f, t - dur, dur, 0, 1, E.in));
  return (
    <g>
      <circle cx={cx + 14} cy={cy + 14} r={r} fill={C.ink} />
      <circle cx={cx} cy={cy} r={r} fill={c} stroke={C.ink} strokeWidth={6} />
    </g>
  );
};

/* ─────────── 每章的标题贴纸 ─────────── */
export const Caption: React.FC<{f: number; t: number; n: number; title: string; year: string; name: string; sub: string; c: string; dark?: boolean}> = ({f, t, n, title, year, name, sub, c, dark}) => {
  const k1 = popS(f, t + 8);
  const k2 = popS(f, t + 14);
  const k3 = popS(f, t + 20);
  const o = out(f, t + 82, 8);
  if (k1 <= 0.001 || o <= 0.001) return null;
  const ink = dark ? C.white : C.ink;
  return (
    <g opacity={o}>
      <g transform={`translate(140 170) rotate(${-8 + 8 * k1}) scale(${k1.toFixed(3)})`}>
        <Blk d={circ(52)} fill={c} />
        <Txt x={0} y={20} size={56} font="display" w={700} anchor="middle">{`0${n}`}</Txt>
      </g>
      <g transform={`translate(214 196) scale(${k2.toFixed(3)})`}>
        <Txt x={0} y={0} size={86} c={ink}>{title}</Txt>
      </g>
      <g transform={`translate(${214 + title.length * 86 + 30} 168) rotate(-6) scale(${k2.toFixed(3)})`}>
        <Tag x={74} y={0} w={148} h={56} fill={C.white}>
          <Txt x={0} y={13} size={36} font="display" w={700} anchor="middle">{year}</Txt>
        </Tag>
      </g>
      <g transform={`translate(96 ${262}) scale(${k3.toFixed(3)})`} opacity={k3 > 0 ? 1 : 0}>
        <Txt x={0} y={0} size={40} font="display" w={700} c={ink}>{name}</Txt>
        <Txt x={0} y={58} size={32} w={700} c={ink}>{sub}</Txt>
      </g>
    </g>
  );
};
