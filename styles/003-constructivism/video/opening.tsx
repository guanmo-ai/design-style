/**
 * 003 · Constructivism —— 开场 + 01 斜线（0–175 帧）
 *   0–25    黑场从右边推进来，白圆弹出，红楔子沿 30° 主轴加速刺进白圆（第 25 帧 = 第 1 拍，重击）
 *   25–50   碎片炸开，又一块块“组装”回构图；西里尔字母沿楔子打出来
 *   50–100  构成主义 / CONSTRUCTIVISM / 1917—1932 一拍一拍盖章
 *   100–175 01 斜线：同一组元素每拍换一次角度 —— 0°（静止）→ 30°（运动）→ 30° + 60°（两条轴）
 *   160–180 楔子穿过白圆飞出画面，其余元素沿主轴撤走；白圆缩成下一幕的“嘴”
 * 首尾呼应：片尾（finale.tsx）用同一个构图 H 再刺一次。
 */
import React from 'react';
import {E, shake, SNAP, spr, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {AT} from './timeline';
import {add, bar, c01, CAP, dir, lerp, on, P, Poly, Pt, pt, Scale, stamp, Txt, wedge} from './ui';

/* ═══════════════ 一组元素的四种排法 ═══════════════ */
type Bar = [number, number, number, number, number]; // 中心 x, y, 角度, 长, 宽
export type Lay = {
  field: [number, number, number]; // 黑场边线上的一点 + 边线角度（0 = 竖直）
  circle: [number, number, number];
  wedge: [number, number, number, number, number]; // 尖端 x, y, 指向角, 长, 底边半宽
  title: [number, number, number, number]; // 基线起点 x, y, 角度, 字号
  sub: [number, number, number];
  years: [number, number, number, number]; // 右端 x, y（rot ≠ 0 时为起点）, 角度, 字号
  bars: Bar[];
  info: number; // 信息栏是否可见
};
const BAR_FILL = [C.ink, C.red, C.light, C.ink, C.red];

// H：开场与片尾的构图（30° 主轴，标题水平）
export const LH: Lay = {
  field: [1000, 540, -30],
  circle: [1329, 350, 230],
  wedge: [1294.4, 370, -30, 1500, 190],
  title: [88, 272, 0, 200],
  sub: [98, 560, 0],
  years: [1824, 860, 0, 120],
  bars: [
    [720, 470, -30, 250, 22],
    [1180, 92, -30, 60, 60],
    [1150, 770, -30, 22, 240],
    [884, 352, -30, 8, 300],
    [330, 650, -30, 120, 22],
  ],
  info: 1,
};
// 0°：所有东西水平、居中 —— 静止
const L0: Lay = {
  field: [1000, 540, 0],
  circle: [1440, 670, 215],
  wedge: [1225, 670, 0, 1100, 105],
  title: [88, 272, 0, 200],
  sub: [98, 560, 0],
  years: [1824, 340, 0, 110],
  bars: [
    [1000 - 125 - 60, 880, 0, 250, 22],
    [1160, 430, 0, 60, 60],
    [1100, 670, 0, 22, 240],
    [930, 300, 0, 8, 260],
    [600, 880, 0, 120, 22],
  ],
  info: 0,
};
// 30°：所有东西倒向主轴 —— 运动
const L30: Lay = {
  ...LH,
  bars: LH.bars.map((b, i) => (i === 0 ? [248, 295, -30, 250, 22] : i === 4 ? [834, 470, -30, 120, 22] : b)) as Bar[],
  title: [170, 560, -30, 170],
  sub: [343, 778, -30],
  info: 0,
};
// 30° + 60°：加一条垂直的副轴 —— 张力
const LX: Lay = {
  ...L30,
  years: [1800, 1000, 60, 120],
  bars: [
    [760, 1000, 60, 520, 30],
    [1250, 100, -30, 60, 60],
    [1500, 822, -30, 300, 22],
    [884, 352, -30, 8, 300],
    [834, 470, 60, 120, 22],
  ],
};
const LAYS = [LH, L0, L30, LX];
// 三下换排法按“附点八分”走（每 3 个十六分音符 = 18.75 帧），比整拍更急，LX 留够时间看清
const LAY_AT = [0, AT.diag, AT.diag + 18.75, AT.diag + 37.5];
export const ANGLE_LABEL: [string, string][] = [
  ['0°', '水平 · 静止'],
  ['30°', '倾斜 · 运动'],
  ['30° + 60°', '两条轴 · 张力'],
];

/** 每拍换一次排法：最快的一刻落在拍点上；d 为各元素的错峰（帧） */
const lay = (f: number, d: number, get: (l: Lay) => number) => {
  let v = get(LAYS[0]);
  for (let k = 1; k < LAYS.length; k++) {
    const p = tween(f, LAY_AT[k] - 7 + d, 14, 0, 1, E.inOut);
    if (p <= 0) break;
    v = lerp(get(LAYS[k - 1]), get(LAYS[k]), p);
  }
  return v;
};

/* ═══════════════ 镜头 ═══════════════ */
export const HITS: [number, number][] = [
  [25, 22],
  [50, 7],
  [56, 5],
  [75, 8],
];
const camera = (f: number) => {
  const roll = lerp(-7, 0, tween(f, 0, 26, 0, 1, E.out));
  const punch = f >= 25 ? 0.035 * Math.exp(-(f - 25) / 6) : 0;
  const z = lerp(1.14, 1, tween(f, 0, 34, 0, 1, E.out)) + punch;
  const s = shake(f, HITS);
  return {roll, z, x: s.x, y: s.y};
};

/* ═══════════════ 撤场（160–180）：楔子穿过白圆飞走，其余沿主轴撤，白圆缩成“嘴” ═══════════════ */
export const EXIT = AT.type - 15; // 160
export const MOUTH = {x: 236, y: 872, r: 64}; // 02 大字：喇叭的尖端
const exitK = (f: number, d: number) => tween(f, EXIT + d, 14, 0, 1, E.in);

/** 楔子：开场刺入（2–25），落地回弹，换排法，最后穿过白圆飞走 */
const wedgePts = (f: number): Pt[] => {
  const g = (k: number) => lay(f, 0, (l) => l.wedge[k]);
  const ang = g(2);
  let tip = pt(g(0), g(1));
  const d = dir(ang);
  const thrust = 1 - tween(f, 0, 25, 0, 1, E.in); // 加速刺入
  const recoil = f >= 25 ? -34 * Math.exp(-(f - 25) / 5) * Math.sin(((f - 25) / 16) * Math.PI + 0.4) : 0;
  const away = exitK(f, 0) * 2600;
  tip = add(tip, d, -thrust * 1500 + recoil + away);
  return wedge(tip, ang, g(3), g(4));
};

/** 碎片：第 25 帧从尖端炸开，弹到各自的位置（构图里的小条、小方块） */
const BURST = [
  [-0.6, 210],
  [0.9, -260],
  [-1.4, 170],
  [1.2, 240],
  [-0.4, -200],
];
const barPts = (f: number, i: number): {p: Pt[]; o: number} => {
  const g = (k: number) => lay(f, 2 + i, (l) => l.bars[i][k]);
  const k = spr(f, 25 + i * 1.2, SNAP, 40);
  const tip = {x: LH.wedge[0], y: LH.wedge[1]};
  const final = pt(g(0), g(1));
  const c = {x: lerp(tip.x, final.x, k), y: lerp(tip.y, final.y, k)};
  const ang = g(2) + (1 - k) * BURST[i][1];
  const s = Math.min(1, k * 1.4);
  const e = exitK(f, 2 + i);
  const cc = on(c, e * (1400 + i * 260), e * BURST[i][0] * 200);
  return {p: bar(cc, ang, g(3) * s, g(4) * s), o: f < 25 ? 0 : 1};
};

/** 额外的小碎片：只炸开、飞出画面 */
const Debris: React.FC<P> = ({f}) => {
  if (f < 25 || f > 70) return null;
  const t = f - 25;
  return (
    <>
      {Array.from({length: 14}, (_, i) => {
        const a = -30 + (i - 7) * 23 + (i % 2) * 180;
        const sp = 26 + (i * 37) % 23;
        const dist = sp * t * Math.exp(-t / 30);
        const c = add({x: LH.wedge[0], y: LH.wedge[1]}, dir(a), dist);
        const s = (10 + (i * 13) % 16) * (1 - c01((t - 20) / 22));
        if (s <= 0.5) return null;
        return <Poly key={i} p={bar(c, a + t * (i % 2 ? 9 : -7), s * (i % 3 === 0 ? 3 : 1), s)} fill={i % 3 === 1 ? C.red : i % 3 === 2 ? C.light : C.ink} />;
      })}
    </>
  );
};

/** 角度标签：01 斜线时出现在右上角 */
const AngleLabel: React.FC<P> = ({f}) => {
  if (f < AT.diag - 6 || f > EXIT + 8) return null;
  const o = tween(f, AT.diag - 6, 6) * (1 - tween(f, EXIT, 8));
  let k = 0;
  for (let i = 1; i < 3; i++) if (f >= LAY_AT[i + 1] - 2) k = i;
  const st = stamp(f, LAY_AT[k + 1] - 2, 1.35, 8);
  const [num, desc] = ANGLE_LABEL[k];
  return (
    <g opacity={o}>
      <Scale x={1824} y={160} s={st.s} o={k === 0 ? 1 : st.o}>
        <Txt x={1824} y={160} size={84} w={700} fill={C.red} anchor="end">{num}</Txt>
      </Scale>
      <Txt x={1824} y={206} size={28} w={700} sc fill={C.paper} anchor="end" ls={0.06}>{desc}</Txt>
    </g>
  );
};

/** 0–180 帧：开场 + 01 斜线（一个连续的“世界”） */
export const Opening: React.FC<P & {end?: boolean; drift?: number}> = ({f, end, drift = 0}) => {
  const cam = camera(f);
  cam.z *= 1 + drift;
  // 黑场
  const fx = lay(f, 1, (l) => l.field[0]);
  const fy = lay(f, 1, (l) => l.field[1]);
  const fr = lay(f, 1, (l) => l.field[2]);
  const slideIn = (1 - tween(f, 0, 16, 0, 1, E.out)) * 1500 + exitK(f, 1) * 2400;
  const fd = dir(fr); // 黑场朝向（边线的法向）
  const fe = {x: fx + fd.x * slideIn, y: fy + fd.y * slideIn};
  // 白圆：弹出 → 换排法 → 缩成“嘴”
  const pop = spr(f, 5, {damping: 10, mass: 0.6, stiffness: 190}, 30);
  const m = tween(f, EXIT, 18, 0, 1, E.inOut);
  const ccx = lerp(lay(f, 1, (l) => l.circle[0]), MOUTH.x, m);
  const ccy = lerp(lay(f, 1, (l) => l.circle[1]), MOUTH.y, m);
  const cr = lerp(lay(f, 1, (l) => l.circle[2]) * pop, MOUTH.r, m);
  // 标题
  const tx = lay(f, 3, (l) => l.title[0]);
  const ty = lay(f, 3, (l) => l.title[1]);
  const trot = lay(f, 3, (l) => l.title[2]);
  const ts = lay(f, 3, (l) => l.title[3]);
  const s1 = stamp(f, 50, 1.6, 8);
  const s2 = stamp(f, 56, 1.6, 8);
  const tOut = exitK(f, 3);
  const tpos = on(pt(tx, ty), -tOut * 1800, 0);
  const sx = lay(f, 4, (l) => l.sub[0]);
  const sy = lay(f, 4, (l) => l.sub[1]);
  const sr = lay(f, 4, (l) => l.sub[2]);
  const spos = on(pt(sx, sy), -exitK(f, 4) * 1800, 0);
  const SUB = 'CONSTRUCTIVISM';
  const subN = Math.floor(c01((f - 62) / 12) * SUB.length);
  // 年份
  const yx = lay(f, 5, (l) => l.years[0]);
  const yy = lay(f, 5, (l) => l.years[1]);
  const yr = lay(f, 5, (l) => l.years[2]);
  const ys = lay(f, 5, (l) => l.years[3]);
  const yst = stamp(f, 75, 1.5, 8);
  const ypos = on(pt(yx, yy), exitK(f, 5) * 1800, 0);
  const info = lay(f, 6, (l) => l.info);
  // 西里尔字母：沿楔子中轴，从宽的一端往尖端打字
  const w = wedgePts(f);
  const wd = {x: w[0].x - (w[1].x + w[2].x) / 2, y: w[0].y - (w[1].y + w[2].y) / 2};
  const wl = Math.hypot(wd.x, wd.y);
  const wa = (Math.atan2(wd.y, wd.x) * 180) / Math.PI;
  const CYR = 'КОНСТРУКТИВИЗМ';
  const cyrN = Math.floor(c01((f - 28) / 18) * CYR.length);
  const cs = 64;
  const cyrStart = add(add(w[0], {x: wd.x / wl, y: wd.y / wl}, -(560 + wl * 0.3)), {x: -wd.y / wl, y: wd.x / wl}, (CAP * cs) / 2);
  return (
    <g transform={`translate(${960 + cam.x} ${540 + cam.y}) rotate(${cam.roll}) scale(${cam.z}) translate(-960 -540)`}>
      <rect x={-2000} y={-2000} width={6000} height={5000} fill={C.paper} />
      <rect x={fe.x} y={fe.y - 4000} width={8000} height={8000} fill={C.ink} transform={`rotate(${fr} ${fe.x} ${fe.y})`} />
      {cr > 0.5 && <circle cx={ccx} cy={ccy} r={cr} fill={m > 0 ? interpolate3(m) : C.light} />}
      {LH.bars.map((_, i) => {
        const b = barPts(f, i);
        return <Poly key={i} p={b.p} fill={BAR_FILL[i]} o={b.o} />;
      })}
      <Poly p={w} fill={C.red} />
      {cyrN > 0 && (
        <Txt x={cyrStart.x} y={cyrStart.y} size={cs} w={700} ls={0.06} fill={C.light} rot={wa}>
          {CYR.slice(0, cyrN)}
        </Txt>
      )}
      <Debris f={f} />
      {/* 标题：两下盖章 */}
      <g transform={`rotate(${trot} ${tpos.x} ${tpos.y})`}>
        <Scale x={tpos.x + ts} y={tpos.y - ts * 0.4} s={s1.s} o={s1.o}>
          <Txt x={tpos.x} y={tpos.y} size={ts} w={900} sc ls={-0.03}>构成</Txt>
        </Scale>
        <Scale x={tpos.x + ts} y={tpos.y + ts * 0.64} s={s2.s} o={s2.o}>
          <Txt x={tpos.x} y={tpos.y + ts * 1.04} size={ts} w={900} sc ls={-0.03}>主义</Txt>
        </Scale>
      </g>
      {subN > 0 && (
        <Txt x={spos.x} y={spos.y} size={52} w={500} ls={0.16} rot={sr}>
          {SUB.slice(0, subN)}
        </Txt>
      )}
      <Scale x={ypos.x - 260} y={ypos.y - 50} s={yst.s} o={yst.o}>
        <Txt x={ypos.x} y={ypos.y} size={ys} w={700} fill={C.light} anchor="end" rot={yr} ls={0.01}>
          1917—1932
        </Txt>
      </Scale>
      {end ? (
        <>
          {/* 片尾：口号 + 署名（都落在黑场里） */}
          <Txt x={1824} y={936} size={36} w={700} sc fill={C.paper} anchor="end" ls={0.02} o={tween(f, 81, 6)}>
            一条斜线，一块红，一个大声的字。
          </Txt>
          <Txt x={1824} y={984} size={22} w={500} sc fill={C.paper} anchor="end" ls={0.04} o={tween(f, 90, 8) * 0.8}>
            Design Style · 风格 003 · @guanmo_ai
          </Txt>
          <Txt x={1824} y={1016} size={22} w={500} fill={C.paper} anchor="end" ls={0.06} o={tween(f, 94, 8) * 0.6}>
            github.com/guanmo-ai/design-style
          </Txt>
        </>
      ) : (
        <>
          <Txt x={1824} y={918} size={30} w={700} sc fill={C.paper} anchor="end" ls={0.04} o={info * tween(f, 81, 6)}>
            莫斯科 · 彼得格勒
          </Txt>
          <Txt x={1824} y={958} size={24} w={500} sc fill={C.paper} anchor="end" ls={0.04} o={info * tween(f, 87, 6) * 0.75}>
            艺术家放下画笔，像工程师一样组装画面
          </Txt>
        </>
      )}
      {!end && <AngleLabel f={f} />}
    </g>
  );
};

// 白圆 → 黑色的“嘴”
const interpolate3 = (m: number) => {
  const a = [0xf6, 0xf1, 0xe6];
  const b = [0x16, 0x14, 0x12];
  const k = c01(m * 1.6);
  return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], k))).join(',')})`;
};
