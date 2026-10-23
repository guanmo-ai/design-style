/** 004 · Memphis —— 02 书架 Carlton · 03 台灯 Tahiti · 04 椅子 First（都是按原作手法重新画的“致敬”，不是测绘图） */
import React from 'react';
import {E, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {AT} from './timeline';
import {Blk, Caption, circ, Drop, Iris, n1, P, Pop, popS, poly, rect, Sweep, Tag, tri, Tube, Txt} from './ui';

/* ─────────── 02 书架：Carlton（索特萨斯，1981） ─────────── */
const CX = 1230; // 书架中轴
const K = 1.6; // 局部单位 → 像素
const Y0 = 980 - 470 * K; // 柱顶
const sy = (ly: number) => Y0 + ly * K;
/** 一块矩形零件：局部坐标 (x0..x1, y0..y1) */
const Part: React.FC<{f: number; t0: number; x0: number; x1: number; y0: number; y1: number; fill: string; pat?: string; fall?: number}> = ({f, t0, x0, x1, y0, y1, fill, pat, fall = 10}) => {
  const w = (x1 - x0) * K;
  const h = (y1 - y0) * K;
  return (
    <Drop f={f} t0={t0} x={CX + ((x0 + x1) / 2) * K} y={sy((y0 + y1) / 2)} hb={h / 2} fall={fall} from={-1000}>
      <Blk d={rect(w, h)} fill={fill} pat={pat} sh={8} />
    </Drop>
  );
};
/** 一对斜着伸出去的隔板（左右对称地弹出来） */
const Arms: React.FC<{f: number; t0: number; y: number; dx: number; dy: number; th: number; fill: string; wave?: number}> = ({f, t0, y, dx, dy, th, fill, wave = 0}) => {
  const k = popS(f, t0, 24);
  if (k <= 0.001) return null;
  const arm = (s: 1 | -1) => (
    <g transform={`translate(${CX + s * 12 * K} ${sy(y)}) rotate(${n1(s * wave)}) scale(${(s * k).toFixed(3)} ${k.toFixed(3)})`}>
      <Blk d={poly([[0, 0], [dx * K, dy * K], [dx * K, (dy + th) * K], [0, th * K]])} fill={fill} sh={8} />
    </g>
  );
  return (
    <>
      {arm(-1)}
      {arm(1)}
    </>
  );
};

export const Carlton: React.FC<P> = ({f}) => {
  const T = AT.carlton;
  const wave = f > T + 64 ? 9 * Math.sin((f - T - 64) * 0.28) * Math.exp(-(f - T - 64) / 30) : 0;
  const books = [C.yellow, C.red, C.white, C.teal, C.pink];
  return (
    <g>
      <rect width={1920} height={1080} fill={C.lilac} />
      <rect width={1920} height={1080} fill="url(#confetti)" opacity={0.35} />
      <Part f={f} t0={T + 2} x0={-118} x1={118} y0={420} y1={470} fill={C.ink} />
      {f >= T + 12 && (
        <g transform={`translate(${CX} ${sy(445)})`}>
          {[-80, -40, 0, 40, 80].map((x, i) => (
            <circle key={i} cx={x * K} cy={0} r={7} fill={C.white} opacity={popS(f, T + 12 + i * 2)} />
          ))}
        </g>
      )}
      <Part f={f} t0={T + 8} x0={-12} x1={12} y0={0} y1={420} fill={C.red} fall={9} />
      <Arms f={f} t0={T + 16} y={260} dx={-100} dy={80} th={18} fill={C.teal} />
      <Part f={f} t0={T + 22} x0={-132} x1={132} y0={216} y1={234} fill={C.pink} />
      <Part f={f} t0={T + 27} x0={-132} x1={-114} y0={126} y1={216} fill={C.teal} />
      <Part f={f} t0={T + 30} x0={114} x1={132} y0={126} y1={216} fill={C.teal} />
      <Part f={f} t0={T + 34} x0={-132} x1={132} y0={108} y1={126} fill={C.blue} />
      <Arms f={f} t0={T + 40} y={20} dx={-120} dy={-80} th={18} fill={C.yellow} wave={wave} />
      <Pop f={f} t0={T + 46} x={CX} y={sy(-22)} spin={60}>
        <Blk d={tri(30 * K, 44 * K)} fill={C.teal} sh={6} />
      </Pop>
      {books.map((c, i) => {
        const bx = -100 + i * 26 + (i > 2 ? 40 : 0);
        const h = 60 + ((i * 17) % 28);
        return (
          <Drop key={i} f={f} t0={T + 52 + i * 3} x={CX + (bx + 10) * K} y={sy(216 - h / 2)} hb={(h / 2) * K} rot={i === 4 ? 14 : 0} fall={8} from={-500}>
            <Blk d={rect(18 * K, h * K)} fill={c} sh={0} sw={4} />
          </Drop>
        );
      })}
      <Pop f={f} t0={T + 60} x={1660} y={830} rot={8}>
        <Tag x={0} y={0} w={400} h={70} fill={C.yellow}>
          <Txt x={0} y={13} size={34} anchor="middle">首展 1981.9 · 55 件</Txt>
        </Tag>
      </Pop>
      <Caption f={f} t={T} n={2} title="书架" year="1981" name="Carlton · Ettore Sottsass" sub="隔板全是斜的，像一个举着手的小人" c={C.yellow} />
      <Sweep f={f} t={AT.tahiti} c={C.blue} dir="down" />
    </g>
  );
};

/* ─────────── 03 台灯：Tahiti（索特萨斯，1981） ─────────── */
const LX = 1150;
const PIV: [number, number] = [LX, 470]; // 灯头的转轴（立柱顶）
export const tahitiTip = (f: number): [number, number] => {
  const a = (headRot(f) * Math.PI) / 180;
  return [PIV[0] + Math.cos(a) * 250 - Math.sin(a) * 6, PIV[1] + Math.sin(a) * 250 + Math.cos(a) * 6];
};
const headRot = (f: number) => {
  const T = AT.tahiti;
  const nod = tween(f, T + 40, 14, -18, 22, E.out);
  const bob = f > T + 54 ? 5 * Math.sin((f - T - 54) * ((2 * Math.PI) / 15)) : 0;
  return nod + bob;
};
export const Tahiti: React.FC<P> = ({f}) => {
  const T = AT.tahiti;
  const on = f >= T + 46;
  const kHead = popS(f, T + 30, 24);
  const a = headRot(f);
  const [tx, ty] = tahitiTip(f);
  const beam = tween(f, T + 46, 6);
  return (
    <g>
      <rect width={1920} height={1080} fill={C.blue} />
      <rect width={1920} height={1080} fill="url(#dotsW)" opacity={0.18} />
      {on && (
        <g transform={`translate(${n1(tx)} ${n1(ty)}) scale(${(0.2 + 0.8 * beam).toFixed(3)}) translate(${n1(-tx)} ${n1(-ty)})`}>
          <path d={`M${n1(tx)} ${n1(ty)}L${n1(tx + 360)} 965L${n1(tx - 140)} 965Z`} fill={C.yellow} />
          <path d={`M${n1(tx)} ${n1(ty)}L${n1(tx + 360)} 965M${n1(tx)} ${n1(ty)}L${n1(tx - 140)} 965`} stroke={C.ink} strokeWidth={5} />
          <ellipse cx={tx + 110} cy={968} rx={260} ry={22} fill={C.white} opacity={0.5} />
        </g>
      )}
      <rect x={0} y={962} width={1920} height={6} fill={C.ink} opacity={tween(f, T + 2, 10)} />
      <Drop f={f} t0={T + 2} x={LX} y={905} hb={60} fall={10}>
        <Blk d={rect(330, 120)} fill={C.white} pat="bacterio" />
      </Drop>
      <Drop f={f} t0={T + 10} x={LX - 40} y={795} hb={50} fall={9}>
        <Blk d={rect(150, 100)} fill={C.pink} />
      </Drop>
      <Drop f={f} t0={T + 18} x={LX} y={608} hb={140} fall={9}>
        <Blk d={rect(44, 280)} fill={C.yellow} />
      </Drop>
      {kHead > 0.001 && (
        <g transform={`translate(${PIV[0]} ${PIV[1]}) rotate(${n1(a)}) scale(${kHead.toFixed(3)})`}>
          <Blk d={poly([[-30, -40], [250, -14], [250, 26], [-30, 40]])} fill={C.red} />
          <Blk d={circ(26)} fill={C.teal} sh={5} />
          <circle cx={250} cy={6} r={on ? 20 : 12} fill={on ? C.white : C.paper} stroke={C.ink} strokeWidth={4} />
        </g>
      )}
      {on && (
        <g transform={`translate(${n1(tx)} ${n1(ty)})`} opacity={1 - tween(f, T + 46, 20)}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => (
            <path key={d} d="M36 0H70" stroke={C.yellow} strokeWidth={8} strokeLinecap="round" transform={`rotate(${d})`} />
          ))}
        </g>
      )}
      <Pop f={f} t0={T + 52} x={1560} y={300} rot={-8}>
        <Tag x={0} y={0} w={200} h={70} fill={C.yellow}>
          <Txt x={0} y={14} size={38} font="display" w={700} anchor="middle">CLICK!</Txt>
        </Tag>
      </Pop>
      <Caption f={f} t={T} n={3} title="台灯" year="1981" name="Tahiti · Ettore Sottsass" sub="一盏像小鸭子的台灯，会点头" c={C.pink} dark />
      <Iris f={f} t={AT.first} c={C.yellow} cx={tx} cy={ty} r0={20} dur={12} />
    </g>
  );
};

/* ─────────── 04 椅子：First（德卢基，1983） ─────────── */
const FX = 1190;
export const First: React.FC<P> = ({f}) => {
  const T = AT.first;
  const legs = tween(f, T + 2, 12, 0, 1, E.out);
  const ring = tween(f, T + 18, 16, 0, 1, E.inOut);
  const rock = f > T + 58 ? 4 * Math.sin((f - T - 58) * ((2 * Math.PI) / 30)) : 0;
  return (
    <g>
      <rect width={1920} height={1080} fill={C.yellow} />
      <rect width={1920} height={1080} fill="url(#confetti)" opacity={0.35} />
      <rect x={0} y={958} width={1920} height={6} fill={C.ink} />
      <g transform={`rotate(${n1(rock)} ${FX} 960)`}>
        {[
          [FX - 150, FX - 175],
          [FX + 150, FX + 175],
          [FX - 70, FX - 85],
          [FX + 70, FX + 85],
        ].map(([x0, x1], i) => (
          <Tube key={i} d={`M${x0} 960L${x1 + (x0 - x1) * (1 - legs)} ${n1(960 - 250 * legs)}`} c={C.ink} w={14} sw={0} sh={8} />
        ))}
        <Tube d={`M${FX - 190} 560A190 190 0 1 1 ${FX + 190} 560A190 190 0 1 1 ${FX - 190} 560`} c={C.ink} w={22} sw={0} sh={10} p={ring} />
        <Drop f={f} t0={T + 10} x={FX} y={712} hb={26} fall={9}>
          <Blk d={`M-200 0A200 34 0 1 0 200 0A200 34 0 1 0 -200 0Z`} fill={C.teal} />
        </Drop>
        <Drop f={f} t0={T + 34} x={FX} y={290} hb={100} fall={10}>
          <Blk d={circ(100)} fill={C.blue} />
        </Drop>
        {[0, 1].map((i) => (
          <Drop key={i} f={f} t0={T + 42 + i * 6} x={FX + (i ? 196 : -196)} y={560} hb={42} fall={9}>
            <Blk d={circ(42)} fill={i ? C.pink : C.red} sh={7} />
            <circle cx={-14} cy={-14} r={10} fill={C.white} opacity={0.7} />
          </Drop>
        ))}
      </g>
      <Pop f={f} t0={T + 48} x={1620} y={440} rot={10}>
        <Tag x={0} y={0} w={170} h={64} fill={C.white}>
          <Txt x={0} y={14} size={36} font="display" w={700} anchor="middle">BOING</Txt>
        </Tag>
      </Pop>
      <Caption f={f} t={T} n={4} title="椅子" year="1983" name="First · Michele De Lucchi" sub="一个圆盘、一个圆环、两个球" c={C.teal} />
      <Sweep f={f} t={AT.pattern} c={C.paper} dir="left" pat="confetti" />
    </g>
  );
};
