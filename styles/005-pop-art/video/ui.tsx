/** 005 · Pop Art —— 网点、爆炸框、对话框、旁白框与转场（全片用 SVG：每一块都是“平涂原色 + 粗黑线 + 网点”） */
import React from 'react';
import {random} from 'remotion';
import {E, POP, spr, tween} from '../../../src/lib/anim';
import {C, DOT, F, LINE, SHADOW} from '../tokens';

export type P = {f: number};
export const W = 1920;
export const H = 1080;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const c01 = (t: number) => Math.min(1, Math.max(0, t));
export const n1 = (v: number) => v.toFixed(1);

/* ─────────── 形状（都以 (0,0) 为中心） ─────────── */
export const circ = (r: number, x = 0, y = 0) => `M${n1(x - r)} ${n1(y)}a${n1(r)} ${n1(r)} 0 1 0 ${n1(2 * r)} 0a${n1(r)} ${n1(r)} 0 1 0 ${n1(-2 * r)} 0Z`;
export const rect = (w: number, h: number, rx = 0) =>
  rx > 0
    ? `M${-w / 2 + rx} ${-h / 2}H${w / 2 - rx}Q${w / 2} ${-h / 2} ${w / 2} ${-h / 2 + rx}V${h / 2 - rx}Q${w / 2} ${h / 2} ${w / 2 - rx} ${h / 2}H${-w / 2 + rx}Q${-w / 2} ${h / 2} ${-w / 2} ${h / 2 - rx}V${-h / 2 + rx}Q${-w / 2} ${-h / 2} ${-w / 2 + rx} ${-h / 2}Z`
    : `M${-w / 2} ${-h / 2}H${w / 2}V${h / 2}H${-w / 2}Z`;
export const poly = (pts: [number, number][]) => 'M' + pts.map(([x, y]) => `${n1(x)} ${n1(y)}`).join('L') + 'Z';

/** 爆炸框：r1 = 尖角半径，r2 = 凹口半径，n = 尖角数；每个尖角长短随机（同一个 seed 永远一样） */
export const burstD = (r1: number, r2: number, n: number, rot = 0, seed = 'b') => {
  const pts: [number, number][] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i * Math.PI) / n;
    const r = i % 2 === 0 ? r1 * (0.82 + 0.36 * random(`${seed}${i}`)) : r2 * (0.92 + 0.16 * random(`${seed}q${i}`));
    pts.push([r * Math.cos(a), r * Math.sin(a)]);
  }
  return poly(pts);
};

/** 一块“平涂 + 粗黑线 + 硬投影”的形状 */
export const Blk: React.FC<{d: string; fill: string; sw?: number; sh?: number; pat?: string; po?: number; o?: number}> = ({d, fill, sw = LINE.outline, sh = SHADOW.dx, pat, po = 1, o}) => (
  <g opacity={o}>
    {sh > 0 && <path d={d} fill={C.ink} transform={`translate(${sh} ${sh})`} />}
    <path d={d} fill={fill} />
    {pat && <path d={d} fill={`url(#${pat})`} opacity={po} />}
    {sw > 0 && <path d={d} fill="none" stroke={C.ink} strokeWidth={sw} strokeLinejoin="round" />}
  </g>
);

/** 一片网点：六角排列，半径由 r(x, y) 决定（≤ 0 不画）；所有点合成一条 path，渲染快 */
export const dotsD = (x0: number, y0: number, w: number, h: number, pitch: number, r: (x: number, y: number) => number) => {
  let d = '';
  const dy = pitch * 0.866;
  let j = 0;
  for (let y = y0; y <= y0 + h + dy; y += dy, j++) {
    for (let x = x0 + (j % 2 ? pitch / 2 : 0); x <= x0 + w + pitch; x += pitch) {
      const rr = r(x, y);
      if (rr > 0.4) d += circ(rr, x, y);
    }
  }
  return d;
};
export const Dots: React.FC<{x?: number; y?: number; w: number; h: number; pitch?: number; r: (x: number, y: number) => number; c: string; o?: number}> = ({x = 0, y = 0, w, h, pitch = DOT.pitch, r, c, o}) => (
  <path d={dotsD(x, y, w, h, pitch, r)} fill={c} opacity={o} />
);

/** 放射速度线：从半径 r0 往外长到 r1，p = 进度 */
export const Speed: React.FC<{cx: number; cy: number; r0: number; r1: number; n?: number; p?: number; w?: number; c?: string; seed?: string}> = ({cx, cy, r0, r1, n = 40, p = 1, w = 6, c = C.ink, seed = 's'}) => {
  if (p <= 0.001) return null;
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + random(`${seed}a${i}`) * 0.08;
    const a0 = r0 * (1 + random(`${seed}r${i}`) * 0.25);
    const a1 = lerp(a0, r1, p);
    const ww = w * (0.5 + random(`${seed}w${i}`));
    // 每根线是一条细长三角：根部细、外面粗（像漫画里的集中线）
    const nx = -Math.sin(a) * ww;
    const ny = Math.cos(a) * ww;
    d += `M${n1(cx + Math.cos(a) * a0)} ${n1(cy + Math.sin(a) * a0)}L${n1(cx + Math.cos(a) * a1 + nx)} ${n1(cy + Math.sin(a) * a1 + ny)}L${n1(cx + Math.cos(a) * a1 - nx)} ${n1(cy + Math.sin(a) * a1 - ny)}Z`;
  }
  return <path d={d} fill={c} />;
};

/* ─────────── 动作 ─────────── */
/** 弹出来：从 0 放大，过冲再回到 1 */
export const popS = (f: number, t0: number, d = 26) => (f < t0 ? 0 : spr(f, t0, POP, d));
export const Pop: React.FC<{f: number; t0: number; x: number; y: number; rot?: number; s?: number; spin?: number; children: React.ReactNode}> = ({f, t0, x, y, rot = 0, s = 1, spin = 0, children}) => {
  const k = popS(f, t0);
  if (k <= 0.001) return null;
  return <g transform={`translate(${n1(x)} ${n1(y)}) rotate(${n1(rot + spin * (1 - k))}) scale(${(k * s).toFixed(4)})`}>{children}</g>;
};
/** 拍上去：从 1.35 倍“啪”地落到 1（像把剪下来的纸拍在桌上） */
export const slapS = (f: number, t0: number) => (f < t0 ? 0 : 1 + 0.35 * (1 - tween(f, t0, 7, 0, 1, E.in)) - 0.04 * Math.exp(-(f - t0 - 7) / 4) * (f > t0 + 7 ? 1 : 0));
export const Slap: React.FC<{f: number; t0: number; x: number; y: number; rot?: number; s?: number; children: React.ReactNode}> = ({f, t0, x, y, rot = 0, s = 1, children}) => {
  if (f < t0) return null;
  const k = slapS(f, t0);
  const o = c01((f - t0) / 3);
  return <g opacity={o} transform={`translate(${n1(x)} ${n1(y)}) rotate(${n1(rot * (0.6 + 0.4 / k))}) scale(${(k * s).toFixed(4)})`}>{children}</g>;
};

/** 掉下来 → 落地压扁 → 回弹（软雕塑用更大的压扁） */
export const drop = (f: number, t0: number, fall = 12, from = -900, squash = 0.24) => {
  if (f < t0) return {dy: from, sx: 1, sy: 1, on: false};
  const t = f - t0;
  if (t < fall) {
    const p = t / fall;
    return {dy: from * (1 - p * p), sx: 0.92, sy: 1.1, on: true};
  }
  const u = t - fall;
  const s = Math.exp(-u / 8) * Math.cos(u * 0.38);
  return {dy: 0, sx: 1 + squash * s, sy: 1 - squash * s, on: true};
};
export const Drop: React.FC<{f: number; t0: number; x: number; y: number; hb: number; rot?: number; fall?: number; from?: number; squash?: number; s?: number; children: React.ReactNode}> = ({f, t0, x, y, hb, rot = 0, fall = 12, from = -900, squash = 0.24, s = 1, children}) => {
  const d = drop(f, t0, fall, from, squash);
  if (!d.on) return null;
  return (
    <g transform={`translate(${n1(x)} ${n1(y + d.dy + hb)}) rotate(${n1(rot)}) scale(${(d.sx * s).toFixed(4)} ${(d.sy * s).toFixed(4)}) translate(0 ${-hb})`}>{children}</g>
  );
};

/** 每拍一次的小跳：拍点上鼓一下 */
export const beatPulse = (f: number, from: number, amt = 0.05) => {
  if (f < from) return 1;
  const u = (f - from) % 30;
  return 1 + amt * Math.exp(-u / 5) * Math.cos(u * 0.5);
};
/** 拍点上抖一下（爆炸框、拟声字） */
export const shake = (f: number, t0: number, amt = 10, seed = 'k') => {
  const u = f - t0;
  if (u < 0 || u > 18) return [0, 0];
  const e = Math.exp(-u / 5);
  return [(random(`${seed}x${Math.floor(u / 2)}`) - 0.5) * 2 * amt * e, (random(`${seed}y${Math.floor(u / 2)}`) - 0.5) * 2 * amt * e];
};

/** 退场：t0 之后缩小消失 */
export const out = (f: number, t0: number, d = 10) => 1 - tween(f, t0, d, 0, 1, E.in);

/* ─────────── 文字 ─────────── */
/** 估算字宽：中文一字一个字号；Bangers 窄，约 0.42；其他拉丁约 0.58 */
export const tw = (s: string, size: number, font: keyof typeof F = 'cn', ls = 0) =>
  [...s].reduce((a, ch) => a + (/[\u3000-\u9fff\uff00-\uffef“”…—·]/.test(ch) ? (ch === '·' ? (font === 'cn' ? 1 : 0.5) : 1) : ch === ' ' ? 0.3 : font === 'display' ? 0.45 : 0.6) * size + ls * size, 0);

export const Txt: React.FC<{
  x: number; y: number; size: number; font?: keyof typeof F; w?: number; c?: string; anchor?: 'start' | 'middle' | 'end';
  ls?: number; o?: number; rot?: number; stroke?: number; sh?: number; children: React.ReactNode;
}> = ({x, y, size, font = 'cn', w = 900, c = C.ink, anchor = 'start', ls = 0, o, rot = 0, stroke = 0, sh = 0, children}) => {
  const common = {x: 0, y: 0, fontFamily: F[font], fontSize: size, fontWeight: font === 'display' ? 400 : w, textAnchor: anchor, letterSpacing: `${ls}em`} as const;
  return (
    <g transform={`translate(${n1(x)} ${n1(y)}) rotate(${n1(rot)})`} opacity={o}>
      {sh > 0 && <text {...common} fill={C.ink} stroke={stroke ? C.ink : undefined} strokeWidth={stroke || undefined} strokeLinejoin="round" transform={`translate(${sh} ${sh})`}>{children}</text>}
      <text {...common} fill={c} stroke={stroke ? C.ink : undefined} strokeWidth={stroke || undefined} strokeLinejoin="round" paintOrder="stroke">{children}</text>
    </g>
  );
};

/** 拟声字：Bangers 大字，粗黑边 + 硬投影，往上斜（漫画里的 POW! BAM!） */
export const Bang: React.FC<{x: number; y: number; size: number; c?: string; rot?: number; k?: number; children: string}> = ({x, y, size, c = C.red, rot = -6, k = 1, children}) => (
  <g transform={`translate(${n1(x)} ${n1(y)}) rotate(${rot}) scale(${k.toFixed(4)})`}>
    <Txt x={0} y={size * 0.36} size={size} font="display" anchor="middle" c={c} stroke={size * 0.045} sh={size * 0.05} ls={0.02}>{children}</Txt>
  </g>
);

/** 方框（旁白框 / 标签）：左上角在 (x, y)，平涂 + 粗黑线 + 硬投影 */
export const Box: React.FC<{x: number; y: number; w: number; h: number; fill: string; k?: number; rot?: number; sh?: number; sw?: number; children?: React.ReactNode}> = ({x, y, w, h, fill, k = 1, rot = 0, sh = 8, sw = 5, children}) => {
  if (k <= 0.001) return null;
  return (
    <g transform={`translate(${n1(x)} ${n1(y)}) rotate(${rot}) scale(${k.toFixed(4)})`}>
      <rect x={sh} y={sh} width={w} height={h} fill={C.ink} />
      <rect width={w} height={h} fill={fill} stroke={C.ink} strokeWidth={sw} strokeLinejoin="round" />
      {children}
    </g>
  );
};

/** 对话框：圆角框 + 尖尾巴，一条完整的轮廓；(x, y) 是框中心，尾巴尖在 (tx, ty)（相对中心，ty > 0 尾巴朝下） */
export const bubbleD = (w: number, h: number, tx: number, ty: number, r = 28) => {
  const L = -w / 2;
  const R = w / 2;
  const T = -h / 2;
  const B = h / 2;
  const cx = Math.max(L + r + 40, Math.min(R - r - 40, tx * 0.5));
  const b0 = n1(cx - 30);
  const b1 = n1(cx + 30);
  const tip = `L${n1(tx)} ${n1(ty)}`;
  const top = ty < 0 ? `H${b0}${tip}L${b1} ${T}` : '';
  const bot = ty >= 0 ? `H${b1}${tip}L${b0} ${B}` : '';
  return `M${L + r} ${T}${top}H${R - r}Q${R} ${T} ${R} ${T + r}V${B - r}Q${R} ${B} ${R - r} ${B}${bot}H${L + r}Q${L} ${B} ${L} ${B - r}V${T + r}Q${L} ${T} ${L + r} ${T}Z`;
};
export const Bubble: React.FC<{x: number; y: number; w: number; h: number; tx: number; ty: number; k?: number; fill?: string; sh?: number; rot?: number; children?: React.ReactNode}> = ({x, y, w, h, tx, ty, k = 1, fill = C.white, sh = 10, rot = 0, children}) => {
  if (k <= 0.001) return null;
  return (
    <g transform={`translate(${n1(x)} ${n1(y)}) rotate(${rot}) scale(${k.toFixed(4)})`}>
      <Blk d={bubbleD(w, h, tx, ty)} fill={fill} sh={sh} />
      {children}
    </g>
  );
};

/* ─────────── 图案（<pattern>，可以滚动） ─────────── */
/** 六角网点砖：一块砖里两颗点，铺出来就是六角排列 */
const DotPat: React.FC<{id: string; pitch: number; r: number; c: string; tf?: string}> = ({id, pitch, r, c, tf}) => (
  <pattern id={id} width={pitch} height={pitch * 1.732} patternUnits="userSpaceOnUse" patternTransform={tf}>
    <circle cx={pitch / 4} cy={pitch * 0.433} r={r} fill={c} />
    <circle cx={(pitch * 3) / 4} cy={pitch * 1.299} r={r} fill={c} />
  </pattern>
);
export const Patterns: React.FC<{f: number}> = ({f}) => {
  const s = n1(f * 0.4);
  return (
    <defs>
      <DotPat id="dotPaper" pitch={26} r={3.2} c="#F0DDB0" />
      <DotPat id="dotYellow" pitch={30} r={5} c="#F2B705" tf={`translate(${s} 0)`} />
      <DotPat id="dotBlue" pitch={34} r={7} c="#3C78E0" tf={`translate(${s} 0)`} />
      <DotPat id="dotCyan" pitch={34} r={6.5} c={C.white} tf={`translate(${s} 0)`} />
      <DotPat id="dotRed" pitch={34} r={8} c="#C41F22" tf={`translate(-${s} 0)`} />
      <DotPat id="dotInk" pitch={30} r={4} c="#2A2A2A" tf={`translate(${s} 0)`} />
      <DotPat id="dotPink" pitch={28} r={4.5} c="#F6C9BE" />
      <DotPat id="skin" pitch={22} r={5.6} c={C.red} />
      <DotPat id="skinBlue" pitch={22} r={6.5} c={C.blue} />
      <pattern id="hatch" width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width={4} height={14} fill={C.ink} />
      </pattern>
    </defs>
  );
};

/* ─────────── 转场 ─────────── */
/** 网点转场：下一章的底色以网点的形式长出来，越长越大，最后连成一片（像印刷时油墨越压越重） */
export const DotWipe: React.FC<{f: number; t: number; c: string; dir?: 'right' | 'left' | 'down' | 'up' | 'radial'; dur?: number; pitch?: number; cx?: number; cy?: number}> = ({
  f, t, c, dir = 'right', dur = 16, pitch = 72, cx = 960, cy = 540,
}) => {
  if (f < t - dur || f >= t) return null;
  const p = tween(f, t - dur, dur, 0, 1, E.inOut);
  const band = 0.45;
  const pos = (x: number, y: number) =>
    dir === 'right' ? x / W : dir === 'left' ? 1 - x / W : dir === 'down' ? y / H : dir === 'up' ? 1 - y / H : Math.hypot(x - cx, y - cy) / 1250;
  const d = dotsD(-pitch, -pitch, W + pitch * 2, H + pitch * 2, pitch, (x, y) => c01((p * (1 + band) - pos(x, y) * 0.999) / band) * pitch * 0.62);
  return (
    <g>
      <path d={d} fill={C.ink} transform="translate(8 8)" opacity={p < 0.9 ? 1 : 0} />
      <path d={d} fill={c} />
    </g>
  );
};

/** 爆炸框转场：一个爆炸框从 (cx, cy) 长满全屏 */
export const BurstIris: React.FC<{f: number; t: number; c: string; cx?: number; cy?: number; dur?: number; r0?: number; seed?: string}> = ({f, t, c, cx = 960, cy = 540, dur = 14, r0 = 0, seed = 'iris'}) => {
  if (f < t - dur || f >= t) return null;
  const r = lerp(r0, 2600, tween(f, t - dur, dur, 0, 1, E.in));
  const d = burstD(r, r * 0.72, 14, f * 0.01, seed);
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <path d={d} fill={C.ink} transform="translate(16 16)" />
      <path d={d} fill={c} stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
    </g>
  );
};

/* ─────────── 每章的旁白框（漫画里左上角那块黄框：“与此同时……”） ─────────── */
export const Caption: React.FC<{f: number; t: number; n: number; title: string; year: string; name: string; sub: string; yc?: string}> = ({f, t, n, title, year, name, sub, yc = C.red}) => {
  const k1 = popS(f, t + 6);
  const k2 = popS(f, t + 12);
  const k3 = popS(f, t + 18);
  const o = out(f, t + 84, 6);
  if (k1 <= 0.001 || o <= 0.001) return null;
  const w1 = 150 + tw(title, 72);
  const w2 = Math.max(tw(name, 34), tw(sub, 27)) + 56;
  return (
    <g opacity={o}>
      <Box x={90} y={86} w={w1} h={104} fill={C.yellow} k={k1} rot={-1}>
        <Txt x={28} y={80} size={78} font="display" c={C.red} stroke={3}>{`0${n}`}</Txt>
        <Txt x={118} y={77} size={72}>{title}</Txt>
      </Box>
      <g transform={`translate(${90 + w1 + 34} 98) rotate(-5)`}>
        <Box x={0} y={0} w={tw(year, 58, 'display', 0.04) + 44} h={78} fill={yc} k={k2}>
          <Txt x={22} y={62} size={58} font="display" c={C.white} ls={0.04} stroke={2}>{year}</Txt>
        </Box>
      </g>
      <Box x={120} y={206} w={w2} h={110} fill={C.white} k={k3} rot={0}>
        <Txt x={28} y={47} size={34} w={900}>{name}</Txt>
        <Txt x={28} y={90} size={27} w={500}>{sub}</Txt>
      </Box>
    </g>
  );
};
