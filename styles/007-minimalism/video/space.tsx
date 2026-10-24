/**
 * 007 · Minimalism —— 01 负空间 2.0–4.0s（f104–240）
 *   1.73–2.0s  地平线收短成台基的前沿，镜头往上抬：线的上面长出一块台基（巴塞罗那德国馆，密斯 · 1929 的致敬平面）
 *   2.0–2.9s   八面墙按十六分音符一面一面画出来；两个水池；那个点一拍两步走进去（每一步一个马林巴音）
 *   2.9–3.5s   平面立起来变成轴测：墙长高，八根十字柱一根一根升起，屋顶板最后轻轻落下（第 7 拍）
 *   3.6–4.0s   交棒：除了屋顶板，什么都删掉；屋顶板转正，变成下一幕收音机的机身
 * 平面单位 U = 30px；台基 50 × 16 U；世界坐标的中心 (960, 540) 也是轴测旋转的中心。
 */
import React from 'react';
import {E, tween} from '../../../src/lib/anim';
import {C, DOT, LINE} from '../tokens';
import {Dot, lerp, n2, P, quad, Txt, vis} from './ui';
import {HANDOFF, openPush} from './opening';

export const U = 30;
const X0 = 210;
const Y0 = 300;
const wx = (u: number) => X0 + U * u;
const wy = (u: number) => Y0 + U * u;
const WALL_H = 3.1 * U;
const SLAB = 1.2 * U;
const ROOF_T = 12;
const WALL_T = 10;
export const OUT01 = 216; // 开始删
export const PASS01 = 224; // 屋顶板交给 02

/* ═══════════ 镜头：平面 → 轴测 ═══════════ */
type Cam = {th: number; k: number; zs: number; S: number; cy: number};
export const cam01 = (f: number): Cam => {
  const a = tween(f, 174, 34, 0, 1, E.inOut);
  const drift = tween(f, 190, 32, 0, 1, E.soft);
  return {
    th: ((-30 * a - 5 * drift) * Math.PI) / 180,
    k: lerp(1, 0.55, a),
    zs: tween(f, 178, 32, 0, 1, E.inOut),
    S: lerp(1, 0.9, a) + 0.03 * drift,
    cy: tween(f, 106, 54, 300, 560, E.inOut) + 34 * a,
  };
};
type V2 = [number, number];
const proj = (c: Cam, x: number, y: number, z = 0): V2 => {
  const dx = x - 960;
  const dy = y - 540;
  const cs = Math.cos(c.th);
  const sn = Math.sin(c.th);
  return [960 + (dx * cs - dy * sn) * c.S, c.cy + ((dx * sn + dy * cs) * c.k - z * c.zs) * c.S];
};
const depth = (c: Cam, x: number, y: number) => (x - 960) * Math.sin(c.th) + (y - 540) * Math.cos(c.th);

/* ═══════════ 体块：底面多边形 + 高度 → 看得见的几个面 ═══════════ */
type Look = {top: string; lit: string; dark: string; line?: string; sw?: number; o?: number};
const prism = (c: Cam, pts: V2[], z0: number, z1: number, look: Look, key: string) => {
  const out: React.ReactNode[] = [];
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const cyy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  const cs = Math.cos(c.th);
  const sn = Math.sin(c.th);
  const line = look.line ?? C.ink;
  const sw = look.sw ?? LINE.note;
  if (c.zs > 0.01 && z1 - z0 > 0.5) {
    pts.forEach((p, i) => {
      const q = pts[(i + 1) % pts.length];
      let nx = q[1] - p[1];
      let ny = -(q[0] - p[0]);
      const mx = (p[0] + q[0]) / 2 - cx;
      const my = (p[1] + q[1]) / 2 - cyy;
      if (nx * mx + ny * my < 0) {
        nx = -nx;
        ny = -ny;
      }
      const len = Math.hypot(nx, ny) || 1;
      const nyr = (nx * sn + ny * cs) / len;
      const nxr = (nx * cs - ny * sn) / len;
      if (nyr <= 0.01) return;
      out.push(
        <path
          key={`${key}-s${i}`}
          d={quad([proj(c, p[0], p[1], z0), proj(c, q[0], q[1], z0), proj(c, q[0], q[1], z1), proj(c, p[0], p[1], z1)])}
          fill={nxr < 0.2 ? look.lit : look.dark}
          stroke={line}
          strokeWidth={sw}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />,
      );
    });
  }
  out.push(<path key={`${key}-t`} d={quad(pts.map((p) => proj(c, p[0], p[1], z1)))} fill={look.top} stroke={line} strokeWidth={sw} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />);
  return <g key={key} opacity={look.o !== undefined && look.o < 1 ? n2(look.o) : undefined}>{out}</g>;
};
const rectPts = (x1: number, y1: number, x2: number, y2: number): V2[] => [
  [x1, y1],
  [x2, y1],
  [x2, y2],
  [x1, y2],
];

/* ═══════════ 平面：八面墙、两个水池、八根柱子、一块屋顶板 ═══════════ */
type Wall = {a: V2; b: V2; onyx?: boolean};
const WALLS: Wall[] = [
  {a: [4, 6], b: [16, 6]},
  {a: [10, 1], b: [28, 1]},
  {a: [24, 7.5], b: [31, 7.5], onyx: true},
  {a: [34.5, 3.5], b: [34.5, 9]},
  {a: [36, 12.5], b: [45, 12.5]},
  {a: [42, 1], b: [49, 1]},
  {a: [49, 1], b: [49, 9]},
  {a: [42, 1], b: [42, 7]},
];
/** 每面墙开始画的帧：第 4 拍起，一个十六分音符一面 */
export const WALL_TIMES = WALLS.map((_, i) => 120 + i * 7.5);
const COLS: V2[] = [22.5, 27.5, 32.5, 37.5].flatMap((x) => [5, 10].map((y) => [x, y] as V2));
/** 柱子升起：轴测立起来的时候，一根一根 */
export const COL_TIMES = COLS.map((_, i) => 182 + i * 2.5);
export const ROOF_LAND = 210;
const ROOF = {x1: 20, y1: 2.5, x2: 40, y2: 12.5};
const POOLS = [
  {x1: 2, y1: 8, x2: 17, y2: 15, at: 132},
  {x1: 43, y1: 2.2, x2: 48.4, y2: 8.2, at: 146},
];

/* ═══════════ 那个点走进去：九个落脚点，八步，一步一个十六分音符 ═══════════ */
const KNOTS: V2[] = [
  [25, 16],
  [25, 13],
  [21.5, 11],
  [21.5, 4.2],
  [30, 4.2],
  [33.6, 6.2],
  [33.6, 11],
  [36.5, 14.2],
  [41, 14.4],
];
export const STEP_AT = 140;
export const STEP = 7.5;
/** 每一步落脚的帧（配乐的马林巴音落在这里） */
export const STEP_TIMES = KNOTS.slice(1).map((_, i) => STEP_AT + (i + 1) * STEP);
const cr = (p0: number, p1: number, p2: number, p3: number, t: number) =>
  0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
const along = (s: number): V2 => {
  const n = KNOTS.length - 1;
  const i = Math.min(n - 1, Math.floor(s));
  const t = s - i;
  const k = (j: number) => KNOTS[Math.max(0, Math.min(n, j))];
  return [wx(cr(k(i - 1)[0], k(i)[0], k(i + 1)[0], k(i + 2)[0], t)), wy(cr(k(i - 1)[1], k(i)[1], k(i + 1)[1], k(i + 2)[1], t))];
};
/** 走到第几步（小数）：每一步都是“起步慢、落脚稳” */
const walkS = (f: number) => {
  const n = KNOTS.length - 1;
  const t = (f - STEP_AT) / STEP;
  if (t <= 0) return 0;
  if (t >= n) return n;
  const i = Math.floor(t);
  return i + tween(t - i, 0, 1, 0, 1, E.inOut);
};
const dotR01 = (f: number) => lerp(DOT.r, 13, tween(f, 110, 24, 0, 1, E.inOut));
/** 那个点在 f 帧的屏幕位置（交棒时 02 从这里接手） */
export const dot01 = (f: number) => {
  const c = cam01(f);
  const [x, y] = along(walkS(f));
  const [sx, sy] = proj(c, x, y, 0);
  const r = dotR01(f) * c.S;
  return {x: sx, y: sy - r * c.zs * 0.85, r};
};

/** 屋顶板顶面的四个角（世界坐标的 左上、右上、右下、左下 → 屏幕） */
export const roofCorners = (f: number): V2[] => {
  const c = cam01(f);
  const z = WALL_H + ROOF_T;
  return rectPts(wx(ROOF.x1), wy(ROOF.y1), wx(ROOF.x2), wy(ROOF.y2)).map((p) => proj(c, p[0], p[1], z));
};
const roofDrop = (f: number) => tween(f, 192, 18, 150, 0, E.inOut);

/* ═══════════ 画 ═══════════ */
export const Pavilion: React.FC<P & {dot?: boolean}> = ({f, dot = true}) => {
  const c = cam01(f);
  const fade = 1 - tween(f, OUT01, 12, 0, 1, E.inOut);
  const fl: V2 = [wx(0), wy(16)];
  const fr: V2 = [wx(50), wy(16)];
  const br: V2 = [wx(50), wy(0)];
  const bl: V2 = [wx(0), wy(0)];
  const P2 = (p: V2, z = 0) => proj(c, p[0], p[1], z);
  const mix = (a: V2, b: V2, t: number): V2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

  // 台基：先是线（地平线收短 → 两边往上长 → 后沿合拢），再填色
  const shrink = tween(f, 104, 16, 0, 1, E.inOut);
  const ps = tween(f, 108, 14, 0, 1, E.inOut);
  const pb = tween(f, 116, 12, 0, 1, E.inOut);
  const fillO = tween(f, 118, 18, 0, 1, E.out);
  const outline: React.ReactNode[] = [];
  if (fillO < 1) {
    const [y0] = [P2(fl)[1]];
    const half = 840 * openPush(HANDOFF);
    const xa = lerp(960 - half, P2(fl)[0], shrink);
    const xb = lerp(960 + half, P2(fr)[0], shrink);
    const seg = (a: V2, b: V2, k: string) => (
      <line key={k} x1={n2(a[0])} y1={n2(a[1])} x2={n2(b[0])} y2={n2(b[1])} stroke={C.ink} strokeWidth={LINE.main} opacity={0.85} />
    );
    outline.push(seg([xa, y0], [xb, y0], 'front'));
    if (ps > 0) {
      outline.push(seg(P2(fl), P2(mix(fl, bl, ps)), 'l'));
      outline.push(seg(P2(fr), P2(mix(fr, br, ps)), 'r'));
    }
    if (pb > 0) {
      const mid = mix(bl, br, 0.5);
      outline.push(seg(P2(bl), P2(mix(bl, mid, pb)), 'bl'));
      outline.push(seg(P2(br), P2(mix(br, mid, pb)), 'br'));
    }
  }

  const items: {d: number; el: React.ReactNode}[] = [];
  // 墙
  WALLS.forEach((w, i) => {
    const p = tween(f, WALL_TIMES[i], 12, 0, 1, E.out);
    if (p <= 0) return;
    const ax = wx(w.a[0]);
    const ay = wy(w.a[1]);
    const bx = lerp(ax, wx(w.b[0]), p);
    const by = lerp(ay, wy(w.b[1]), p);
    const h = WALL_T / 2;
    const pts = ay === by ? rectPts(Math.min(ax, bx) - h, ay - h, Math.max(ax, bx) + h, ay + h) : rectPts(ax - h, Math.min(ay, by) - h, ax + h, Math.max(ay, by) + h);
    const look: Look = w.onyx ? {top: C.greyDk, lit: C.stone, dark: C.grey} : {top: C.ink, lit: C.paperHi, dark: C.stone};
    items.push({d: depth(c, (ax + bx) / 2, (ay + by) / 2), el: prism(c, pts, 0, WALL_H, look, `w${i}`)});
  });
  // 柱子：立起来的时候一根一根升起
  COLS.forEach(([xu, yu], i) => {
    const p = tween(f, COL_TIMES[i], 14, 0, 1, E.out);
    if (p <= 0) return;
    const x = wx(xu);
    const y = wy(yu);
    const [bx, by] = proj(c, x, y, 0);
    const [tx, ty] = proj(c, x, y, WALL_H * p);
    const a = 7 * c.S;
    items.push({
      d: depth(c, x, y),
      el: (
        <g key={`c${i}`}>
          <line x1={n2(bx - a)} y1={n2(by)} x2={n2(bx + a)} y2={n2(by)} stroke={C.ink} strokeWidth={2} vectorEffect="non-scaling-stroke" />
          <line x1={n2(bx)} y1={n2(by - a * c.k)} x2={n2(bx)} y2={n2(by + a * c.k)} stroke={C.ink} strokeWidth={2} vectorEffect="non-scaling-stroke" />
          <line x1={n2(bx)} y1={n2(by)} x2={n2(tx)} y2={n2(ty)} stroke={C.ink} strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
        </g>
      ),
    });
  });
  // 那个点（只在交棒之前由这里画）
  const walk = along(walkS(f));
  if (dot && f < PASS01) {
    const d = dot01(f);
    items.push({d: depth(c, walk[0], walk[1]) + 2, el: <Dot key="dot" x={d.x} y={d.y} r={d.r} />});
  }
  items.sort((a, b) => a.d - b.d);

  // 走过的路：点状虚线
  const s = walkS(f);
  const trail: V2[] = [];
  for (let k = 0; k <= Math.ceil(s * 10); k++) trail.push(P2(along(Math.min(s, k / 10))));

  // 屋顶板：平面里是虚线框（在头顶上），立起来时变成实心的板，最后轻轻落下
  const solid = tween(f, 186, 14, 0, 1, E.out);
  const roofZ0 = WALL_H + roofDrop(f);
  const roofPts = rectPts(wx(ROOF.x1), wy(ROOF.y1), wx(ROOF.x2), wy(ROOF.y2));
  const roofIn = tween(f, 154, 14, 0, 1, E.out);
  const sideFade = 1 - tween(f, OUT01, 8, 0, 1, E.inOut);

  return (
    <g>
      {fillO > 0 && <g opacity={fade < 1 ? n2(fade) : undefined}>{prism(c, [fl, fr, br, bl], -SLAB, 0, {top: C.shade, lit: C.paperHi, dark: C.stone, line: C.ink, sw: LINE.main, o: fillO}, 'podium')}</g>}
      {outline}
      <g opacity={fade < 1 ? n2(fade) : undefined}>
        {/* 石材铺地的分缝：极淡，从左往右扫过去 */}
        {fillO > 0 && (
          <g stroke={C.ink} strokeWidth={0.75} opacity={0.12}>
            {Array.from({length: 24}, (_, i) => {
              const p = tween(f, 122 + i * 0.7, 12, 0, 1, E.out);
              if (p <= 0) return null;
              const a = P2([wx(2 + i * 2), wy(16)]);
              const b = P2([wx(2 + i * 2), wy(16 - 16 * p)]);
              return <line key={`gx${i}`} x1={n2(a[0])} y1={n2(a[1])} x2={n2(b[0])} y2={n2(b[1])} />;
            })}
            {Array.from({length: 7}, (_, j) => {
              const p = tween(f, 126 + j * 1.2, 16, 0, 1, E.out);
              if (p <= 0) return null;
              const a = P2([wx(0), wy(2 + j * 2)]);
              const b = P2([wx(50 * p), wy(2 + j * 2)]);
              return <line key={`gy${j}`} x1={n2(a[0])} y1={n2(a[1])} x2={n2(b[0])} y2={n2(b[1])} />;
            })}
          </g>
        )}
        {POOLS.map((pl, i) => {
          const p = tween(f, pl.at, 16, 0, 1, E.out);
          if (p <= 0) return null;
          const x2 = lerp(wx(pl.x1), wx(pl.x2), p);
          const pts = rectPts(wx(pl.x1), wy(pl.y1), x2, wy(pl.y2));
          const rows = Math.floor((pl.y2 - pl.y1) / 0.7);
          return (
            <g key={i}>
              <path d={quad(pts.map((q) => P2(q, -2)))} fill={C.stone} stroke={C.ink} strokeWidth={LINE.note} opacity={0.9} vectorEffect="non-scaling-stroke" />
              {/* 水面：几根错开的短线 */}
              <g stroke={C.paperHi} strokeWidth={1} opacity={0.75}>
                {Array.from({length: rows}, (_, k) => {
                  const yy = wy(pl.y1 + 0.55 + k * 0.7);
                  const off = (k % 3) * 0.9;
                  const xa = wx(pl.x1 + 0.6 + off);
                  const xb = Math.min(x2 - 8, wx(pl.x2 - 0.6 - (2 - (k % 3)) * 0.9));
                  if (xb <= xa) return null;
                  const a = P2([xa, yy], -2);
                  const b = P2([xb, yy], -2);
                  return <line key={k} x1={n2(a[0])} y1={n2(a[1])} x2={n2(b[0])} y2={n2(b[1])} />;
                })}
              </g>
            </g>
          );
        })}
        {trail.length > 1 && (
          <path
            d={'M' + trail.map(([x, y]) => `${n2(x)} ${n2(y)}`).join('L')}
            fill="none"
            stroke={C.greyDk}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray="0.1 10"
            opacity={0.7}
          />
        )}
        {items.map((it) => it.el)}
      </g>
      {/* 屋顶板 */}
      {roofIn > 0 && f < PASS01 && (
        <g>
          {solid < 1 && (
            <path
              d={quad(roofPts.map((q) => proj(c, q[0], q[1], WALL_H + ROOF_T)))}
              fill="none"
              stroke={C.ink}
              strokeWidth={LINE.note}
              strokeDasharray="10 7"
              opacity={n2(roofIn * (1 - solid) * 0.7)}
            />
          )}
          {solid > 0 && (
            <g opacity={solid < 1 ? n2(solid) : undefined}>
              <g opacity={sideFade < 1 ? n2(sideFade) : undefined}>{prism(c, roofPts, roofZ0, roofZ0 + ROOF_T, {top: 'none', lit: C.paperHi, dark: C.shade, line: C.ink, sw: LINE.note}, 'roof-s')}</g>
              <path d={quad(roofPts.map((q) => proj(c, q[0], q[1], roofZ0 + ROOF_T)))} fill={C.paperHi} stroke={C.ink} strokeWidth={LINE.main} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </g>
          )}
        </g>
      )}
    </g>
  );
};

/** 图注：平面图的编号与比例尺 → 轴测图的编号；左上一句话 */
const Notes: React.FC<P> = ({f}) => {
  const c = cam01(f);
  const fy = proj(c, wx(0), wy(16))[1];
  const plan = vis(f, 140, 172, 12, 10);
  const axo = vis(f, 202, OUT01, 12, 10);
  const say = (at: number) => vis(f, at, OUT01 - 2, 16, 12);
  const sb = tween(f, 144, 16, 0, 1, E.out);
  const sx = 1710 - 300;
  return (
    <g>
      {plan > 0.001 && (
        <g opacity={plan < 1 ? n2(plan) : undefined}>
          <Txt x={210} y={fy + 48} k="mono" size={14} ls={0.18} c={C.greyDk}>
            FIG. 1 — PLAN · 1:250
          </Txt>
          <line x1={sx} y1={fy + 42} x2={n2(sx + 300 * sb)} y2={fy + 42} stroke={C.ink} strokeWidth={LINE.note} />
          {[0, 150, 300].map((d, i) => (
            <line key={i} x1={sx + d} y1={fy + 36} x2={sx + d} y2={fy + 48} stroke={C.ink} strokeWidth={LINE.note} opacity={sb > i / 2 ? 1 : 0} />
          ))}
          {['0', '5', '10 M'].map((t, i) => (
            <Txt key={t} x={sx + i * 150} y={fy + 70} k="mono" size={12} ls={0.1} c={C.greyDk} anchor={i === 2 ? 'end' : i === 1 ? 'middle' : 'start'} o={sb}>
              {t}
            </Txt>
          ))}
        </g>
      )}
      <Txt x={1800} y={900} k="mono" size={14} ls={0.18} c={C.greyDk} anchor="end" o={axo}>
        FIG. 2 — AXONOMETRIC
      </Txt>
      <Txt x={120} y={172} k="sc300" size={46} ls={0.08} o={say(150)}>
        八面墙，其余全是空间。
      </Txt>
      <Txt x={120} y={218} k="t300" size={24} ls={0.01} c={C.greyDk} o={say(158)}>
        Eight walls. The rest is space.
      </Txt>
      <Txt x={1800} y={150} k="mono" size={14} ls={0.18} c={C.greyDk} anchor="end" o={say(164)}>
        BARCELONA PAVILION · MIES VAN DER ROHE · 1929
      </Txt>
    </g>
  );
};

export const Space: React.FC<P> = ({f}) => (
  <g>
    <Pavilion f={f} />
    <Notes f={f} />
  </g>
);
