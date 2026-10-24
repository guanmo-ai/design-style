/**
 * 008 · Risograph —— “印刷机”：全片所有画面都经过这里印出来
 *
 * 1. 纸：米白底 + 纤维纹理（浏览器里用确定性随机数生成，不用任何图片素材）
 * 2. 版（Plate）：一种油墨一张版。版里的东西一律用 currentColor 画，版本身决定是哪种墨；
 *    版和版之间用“正片叠底”（multiply）叠在一起——粉压在黄上就是朱红，这就是叠印
 * 3. 墨的质感：每张版盖一层遮罩——实地里有细小的漏白（墨没压到的地方）、轻微的深浅不匀和滚筒走纸的细条纹；
 *    浅色用“颗粒网”（随机分布的墨点，Riso 的 Grain Touch 模式）而不是透明度
 * 4. 套不准：每张版各自有一点偏移和旋转（reg）；每 4 帧“重新印一张”，颗粒和偏移都轻轻跳一下
 * 5. 网点：halftonePath 按灰度算出每个网点的半径（调幅网点），可以设网角
 */
import React from 'react';
import {random} from 'remotion';
import {C, DENSITY, INK, Ink, MOTION} from '../tokens';

/* ═══════════════ 纹理：在浏览器里算一次，做成 CSS 类 ═══════════════ */
const S = 512; // 纹理边长（无缝平铺）

const prng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** 可平铺的盒式模糊（横竖各一遍） */
const blur = (a: Float32Array, r: number) => {
  const tmp = new Float32Array(S * S);
  const n = 2 * r + 1;
  for (let y = 0; y < S; y++) {
    let acc = 0;
    for (let k = -r; k <= r; k++) acc += a[y * S + ((k + S) % S)];
    for (let x = 0; x < S; x++) {
      tmp[y * S + x] = acc / n;
      acc += a[y * S + ((x + r + 1) % S)] - a[y * S + ((x - r + S) % S)];
    }
  }
  const out = new Float32Array(S * S);
  for (let x = 0; x < S; x++) {
    let acc = 0;
    for (let k = -r; k <= r; k++) acc += tmp[((k + S) % S) * S + x];
    for (let y = 0; y < S; y++) {
      out[y * S + x] = acc / n;
      acc += tmp[((y + r + 1) % S) * S + x] - tmp[((y - r + S) % S) * S + x];
    }
  }
  return out;
};

const white = (seed: number) => {
  const r = prng(seed);
  const a = new Float32Array(S * S);
  for (let i = 0; i < a.length; i++) a[i] = r();
  return a;
};

/** 平滑的值噪声（g × g 个格点，余弦插值，可平铺），范围 0—1 */
const smooth = (seed: number, g: number) => {
  const r = prng(seed);
  const grid = Array.from({length: g * g}, () => r());
  const a = new Float32Array(S * S);
  const c = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;
  for (let y = 0; y < S; y++) {
    const gy = (y / S) * g;
    const y0 = Math.floor(gy);
    const ty = c(gy - y0);
    for (let x = 0; x < S; x++) {
      const gx = (x / S) * g;
      const x0 = Math.floor(gx);
      const tx = c(gx - x0);
      const v = (i: number, j: number) => grid[((j % g) * g + (i % g)) | 0];
      const top = v(x0, y0) * (1 - tx) + v(x0 + 1, y0) * tx;
      const bot = v(x0, y0 + 1) * (1 - tx) + v(x0 + 1, y0 + 1) * tx;
      a[y * S + x] = top * (1 - ty) + bot * ty;
    }
  }
  return a;
};

const quantile = (a: Float32Array, q: number) => {
  const s = Float32Array.from(a.filter((_, i) => i % 7 === 0)).sort();
  return s[Math.min(s.length - 1, Math.max(0, Math.floor(q * s.length)))];
};

/** 墨的遮罩（alpha）：深浅不匀 × 漏白 × 走纸条纹；coverage < 1 时变成颗粒网（只有一部分像素有墨） */
const inkMask = (seed: number, coverage: number, heavy = false) => {
  const mott = smooth(seed + 1, 6);
  const mott2 = smooth(seed + 2, 24);
  const speck = blur(white(seed + 3), 1);
  const fine = white(seed + 4);
  const streak = new Float32Array(S);
  const rs = prng(seed + 5);
  let acc = 0;
  for (let y = 0; y < S; y++) {
    acc = acc * 0.82 + (rs() - 0.5) * 0.18;
    streak[y] = acc;
  }
  const voidQ = quantile(speck, heavy ? 0.9 : 0.968);
  const out = new Uint8ClampedArray(S * S * 4);
  let tintQ = 1;
  let tint: Float32Array | null = null;
  if (coverage < 0.999) {
    tint = blur(blur(white(seed + 6), 1), 1);
    for (let i = 0; i < tint.length; i++) tint[i] += (mott2[i] - 0.5) * 0.04;
    tintQ = quantile(tint, coverage);
  }
  const mAmp = heavy ? 0.34 : 0.15;
  for (let i = 0; i < S * S; i++) {
    const y = (i / S) | 0;
    let a = 1 - mAmp * (0.65 * mott[i] + 0.35 * mott2[i]) - (heavy ? 2.2 : 0.9) * Math.abs(streak[y]) * 0.25;
    if (speck[i] > voidQ) a = 0;
    if (fine[i] > (heavy ? 0.97 : 0.991)) a *= 0.15;
    if (tint && tint[i] > tintQ) a = 0;
    out[i * 4] = 255;
    out[i * 4 + 1] = 255;
    out[i * 4 + 2] = 255;
    out[i * 4 + 3] = Math.max(0, Math.min(255, a * 255));
  }
  return out;
};

/** 纸：纤维 + 一点点斑驳（用 multiply 盖在纸色上） */
const paperTex = (seed: number) => {
  const m = smooth(seed, 10);
  const n = white(seed + 1);
  const fib = blur(white(seed + 2), 2);
  const r = prng(seed + 3);
  const out = new Uint8ClampedArray(S * S * 4);
  const lines = new Float32Array(S * S);
  for (let k = 0; k < 420; k++) {
    let x = r() * S;
    let y = r() * S;
    let ang = r() * Math.PI * 2;
    const len = 6 + r() * 26;
    const dark = 0.05 + r() * 0.08;
    for (let s = 0; s < len; s++) {
      ang += (r() - 0.5) * 0.35;
      x += Math.cos(ang);
      y += Math.sin(ang);
      const i = ((((y | 0) % S) + S) % S) * S + ((((x | 0) % S) + S) % S);
      lines[i] = Math.max(lines[i], dark);
    }
  }
  for (let i = 0; i < S * S; i++) {
    const v = 1 - 0.035 * m[i] - 0.03 * (n[i] - 0.5) - 0.06 * (fib[i] - 0.5) - lines[i];
    const g = Math.max(0, Math.min(255, v * 255));
    out[i * 4] = g;
    out[i * 4 + 1] = g;
    out[i * 4 + 2] = Math.max(0, g - 3);
    out[i * 4 + 3] = 255;
  }
  return out;
};

const toUrl = (px: Uint8ClampedArray) => {
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(S, S);
  img.data.set(px);
  ctx.putImageData(img, 0, 0);
  return c.toDataURL('image/png');
};

/** 遮罩种类：solid 实地；t25…t75 颗粒网（墨点覆盖率）；heavy 粗颗粒（“颗粒”那一张卡用） */
export const GRAINS = {solid: 1, t15: 0.15, t30: 0.3, t50: 0.5, t70: 0.7, heavy: 1} as const;
export type Grain = keyof typeof GRAINS;
let css: string | null = null;
let urls: string[] = [];
export const textureCss = () => {
  if (css !== null) return css;
  const rules: string[] = [];
  urls = [];
  (Object.keys(GRAINS) as Grain[]).forEach((g, k) => {
    const u = toUrl(inkMask(1000 + k * 97, GRAINS[g], g === 'heavy'));
    urls.push(u);
    rules.push(`.rg-${g}{-webkit-mask-image:url(${u});mask-image:url(${u});-webkit-mask-size:${S}px ${S}px;mask-size:${S}px ${S}px;}`);
  });
  const p = toUrl(paperTex(77));
  urls.push(p);
  rules.push(`.rg-paper{background-image:url(${p});background-size:${S}px ${S}px;}`);
  css = rules.join('\n');
  return css;
};
/** 等纹理图片解码完再开始截图（否则第一帧会看到没有颗粒的“干净”色块） */
export const preloadTextures = () => {
  textureCss();
  return Promise.all(
    urls.map(
      (u) =>
        new Promise<void>((res) => {
          const im = new Image();
          im.onload = () => res();
          im.onerror = () => res();
          im.src = u;
        }),
    ),
  );
};
export const TextureStyles: React.FC = () => <style>{textureCss()}</style>;

/* ═══════════════ 纸 ═══════════════ */
export const Paper: React.FC<{color?: string; children?: React.ReactNode; style?: React.CSSProperties}> = ({color = C.paper, children, style}) => (
  <div style={{position: 'absolute', inset: 0, background: color, isolation: 'isolate', overflow: 'hidden', ...style}}>
    <div className="rg-paper" style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity: 0.55}} />
    {children}
  </div>
);

/* ═══════════════ 套准：每“印一张”（4 帧）跳一下 ═══════════════ */
export type Reg = {x: number; y: number; r?: number};
export const ZERO: Reg = {x: 0, y: 0, r: 0};
const INK_I: Record<Ink, number> = {pink: 0, teal: 1, yellow: 2, black: 3};
export const boilStep = (f: number) => Math.floor(f / MOTION.boil);
/** 每张纸上的随机抖动（±amp 像素） */
export const jitter = (f: number, ink: Ink, amp = 0.6): Reg => {
  const s = boilStep(f);
  return {x: (random(`jx-${ink}-${s}`) - 0.5) * 2 * amp, y: (random(`jy-${ink}-${s}`) - 0.5) * 2 * amp, r: 0};
};
export const addReg = (a: Reg, b: Reg): Reg => ({x: a.x + b.x, y: a.y + b.y, r: (a.r ?? 0) + (b.r ?? 0)});

/* ═══════════════ 版 ═══════════════ */
type PlateProps = {
  ink: Ink;
  f: number;
  reg?: Reg;
  grain?: Grain;
  density?: number;
  /** 旋转 / 缩放的中心（版的局部坐标） */
  origin?: string;
  style?: React.CSSProperties;
  seed?: number;
  boil?: boolean;
  children?: React.ReactNode;
};
/** 一张版：里面的东西用 currentColor 画；整张版用 multiply 叠到下面的纸和墨上 */
export const Plate: React.FC<PlateProps> = ({ink, f, reg = ZERO, grain = 'solid', density, origin = '960px 540px', style, seed = 0, boil = true, children}) => {
  const s = boil ? boilStep(f) : 0;
  const k = INK_I[ink] * 131 + seed * 17;
  const mx = Math.floor(random(`mx-${k}-${s}`) * 512);
  const my = Math.floor(random(`my-${k}-${s}`) * 512);
  const t = reg.r ? ` rotate(${reg.r}deg)` : '';
  return (
    <div
      className={`rg-${grain}`}
      style={{
        position: 'absolute',
        inset: 0,
        color: INK[ink],
        mixBlendMode: 'multiply',
        opacity: density ?? DENSITY[ink],
        transform: reg.x || reg.y || reg.r ? `translate(${reg.x}px, ${reg.y}px)${t}` : undefined,
        transformOrigin: origin,
        WebkitMaskPosition: `${mx}px ${my}px`,
        maskPosition: `${mx}px ${my}px`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** 同一份内容按几种墨各印一遍（每种墨各自的套准偏移） */
export const Plates: React.FC<{f: number; inks: Ink[]; reg?: (ink: Ink) => Reg; grain?: Grain; origin?: string; children: (ink: Ink) => React.ReactNode}> = ({f, inks, reg, grain, origin, children}) => (
  <>
    {inks.map((ink) => (
      <Plate key={ink} ink={ink} f={f} reg={reg ? reg(ink) : ZERO} grain={grain} origin={origin}>
        {children(ink)}
      </Plate>
    ))}
  </>
);

/* ═══════════════ 叠印的颜色（给标签和图例用） ═══════════════ */
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
export const mixInks = (inks: Ink[], paper = C.paper) => {
  const p = hex(paper);
  const out = p.map((v, ch) => inks.reduce((acc, ink) => acc * (1 - DENSITY[ink] * (1 - hex(INK[ink])[ch])), v));
  return '#' + out.map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
};

/* ═══════════════ 网点（调幅）：灰度 → 每个网点的半径 ═══════════════ */
export const dotR = (t: number, pitch: number) => (t <= 0.004 ? 0 : pitch * Math.sqrt(t / Math.PI) * (1 + 0.28 * t * t * t));
export const halftonePath = (x0: number, y0: number, w: number, h: number, pitch: number, angle: number, tone: (x: number, y: number) => number) => {
  const a = (angle * Math.PI) / 180;
  const ux = Math.cos(a);
  const uy = Math.sin(a);
  const cx0 = x0 + w / 2;
  const cy0 = y0 + h / 2;
  const R = Math.hypot(w, h) / 2 + pitch;
  const n = Math.ceil(R / pitch);
  let d = '';
  for (let j = -n; j <= n; j++) {
    for (let i = -n; i <= n; i++) {
      const px = cx0 + (i * ux - j * uy) * pitch;
      const py = cy0 + (i * uy + j * ux) * pitch;
      if (px < x0 - pitch || px > x0 + w + pitch || py < y0 - pitch || py > y0 + h + pitch) continue;
      const t = tone(px, py);
      const r = dotR(Math.min(1, t), pitch);
      if (r < 0.35) continue;
      d += `M${(px - r).toFixed(1)} ${py.toFixed(1)}a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(2 * r).toFixed(2)} 0a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(-2 * r).toFixed(2)} 0`;
    }
  }
  return d;
};

/* ═══════════════ 套准标记（四角的十字靶） ═══════════════ */
export const RegMark: React.FC<{x: number; y: number; s?: number; w?: number}> = ({x, y, s = 1, w = 2}) => (
  <svg style={{position: 'absolute', left: x - 30 * s, top: y - 30 * s, overflow: 'visible'}} width={60 * s} height={60 * s} viewBox="-30 -30 60 60">
    <circle r={13} fill="none" stroke="currentColor" strokeWidth={w / s} />
    <circle r={5} fill="currentColor" />
    <path d="M-27 0H27M0 -27V27" stroke="currentColor" strokeWidth={w / s} />
  </svg>
);

/** 裁切线：角上两短线（不碰到画面） */
export const CropMarks: React.FC<{x: number; y: number; w: number; h: number; len?: number; gap?: number; t?: number}> = ({x, y, w, h, len = 26, gap = 10, t = 1.5}) => {
  const L = (l: number, tp: number, ww: number, hh: number, k: string) => <div key={k} style={{position: 'absolute', left: l, top: tp, width: ww, height: hh, background: 'currentColor'}} />;
  return (
    <>
      {L(x - gap - len, y, len, t, 'a')}
      {L(x, y - gap - len, t, len, 'b')}
      {L(x + w + gap, y, len, t, 'c')}
      {L(x + w - t, y - gap - len, t, len, 'd')}
      {L(x - gap - len, y + h - t, len, t, 'e')}
      {L(x, y + h + gap, t, len, 'f')}
      {L(x + w + gap, y + h - t, len, t, 'g')}
      {L(x + w - t, y + h + gap, t, len, 'h')}
    </>
  );
};
