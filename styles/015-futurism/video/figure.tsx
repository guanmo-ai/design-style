/**
 * 两个会走路的主角：巴拉的腊肠狗、波丘尼的迈步者。
 * 步态相位由“走过的距离”决定（φ = 2π · 距离 / 一个周期的步长）：停下时相位冻结、摆幅归零——
 * 所以腿上的残影在刹车时自己收拢，脚也不会在地上打滑。
 */
import React from 'react';
import {C} from '../tokens';
import {clamp} from './motion';

const f2 = (v: number) => v.toFixed(1);
type P2 = [number, number];
const rot = (x: number, y: number, a: number): P2 => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];

/** 从 a 到 b 的锥形肢体（宽 wa → wb，两端圆头） */
export const limb = (a: P2, b: P2, wa: number, wb: number) => {
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const nx = -Math.sin(ang);
  const ny = Math.cos(ang);
  const p = (q: P2, w: number, s: number): string => `${f2(q[0] + (nx * w * s) / 2)},${f2(q[1] + (ny * w * s) / 2)}`;
  return `M${p(a, wa, 1)} L${p(b, wb, 1)} A${f2(wb / 2)} ${f2(wb / 2)} 0 0 0 ${p(b, wb, -1)} L${p(a, wa, -1)} A${f2(wa / 2)} ${f2(wa / 2)} 0 0 0 ${p(a, wa, 1)}Z`;
};

/* ═══════════ 狗（局部坐标：脚掌所在地面 y = 0，朝右） ═══════════ */
export const DOG_CYCLE = 360; // 小跑一个周期走 360px
export type DogPose = {x: number; y: number; phase: number; amp: number; drop: number[]; bob: number};
const HIPS: [number, number, number][] = [
  // 髋 x、相位偏移、远 / 近（0 远 1 近）
  [-200, Math.PI, 0],
  [150, 0, 0],
  [-150, 0, 1],
  [195, Math.PI, 1],
];
export const LEG = 172;

/** 狗腿掌心（局部坐标），读数和标注用 */
export const dogPaw = (p: DogPose, i: number): P2 => {
  const [hx, off] = HIPS[i];
  const a = p.amp * Math.sin(p.phase + off);
  return [hx + Math.sin(a) * LEG, -172 + Math.cos(a) * LEG + p.bob];
};

/**
 * drop：每个零件的“搭建”进度（0 = 还没出现，1 = 就位；落地带弹簧，会略超 1）
 *   0 身子 · 1 头 · 2 耳朵 · 3 尾巴 · 4—7 四条腿 · 8 项圈
 */
export const Dog: React.FC<{p: DogPose; ink: string; far: string; part?: 'all' | 'legs' | 'body'}> = ({p, ink, far, part = 'all'}) => {
  const d = (i: number) => p.drop[i] ?? 1;
  const up = (i: number) => (1 - d(i)) * -260; // 落下：d 过冲到 1.05 时往下多走 13px，再回来
  const legs = (side: number) =>
    HIPS.map(([hx, off, s], i) => {
      if (s !== side || d(4 + i) <= 0.001) return null;
      const a = p.amp * Math.sin(p.phase + off);
      const L = LEG * clamp(d(4 + i), 0, 1.06);
      const hip: P2 = [hx, -172 + p.bob];
      const paw: P2 = [hx + Math.sin(a) * L, hip[1] + Math.cos(a) * L];
      return (
        <g key={i} fill={s ? ink : far}>
          <path d={limb(hip, paw, 46, 30)} />
          <ellipse cx={f2(paw[0] + 12)} cy={f2(paw[1] - 6)} rx={26} ry={13} transform={`rotate(${f2((-a * 180) / Math.PI)} ${f2(paw[0])} ${f2(paw[1])})`} />
        </g>
      );
    });
  const tailA = 0.35 * p.amp * 1.6 * Math.sin(p.phase * 2 + 0.6) - 0.5;
  const earA = 0.5 * p.amp * Math.sin(p.phase * 2 + 1.4);
  const [tx, ty] = rot(-110, 0, tailA);
  return (
    <g transform={`translate(${f2(p.x)} ${f2(p.y)})`}>
      {part !== 'body' && legs(0)}
      {part !== 'legs' && (
        <g transform={`translate(0 ${f2(p.bob)})`}>
          {d(3) > 0.001 && <path d={limb([-235, -215 + up(3)], [-235 + tx * clamp(d(3)), -215 + up(3) + ty * clamp(d(3))], 30, 12)} fill={ink} />}
          {d(0) > 0.001 && (
            <path
              transform={`translate(0 ${f2(up(0))})`}
              d="M-262,-205 C-262,-246 -228,-262 -188,-262 L168,-274 C214,-274 244,-244 244,-206 C244,-174 216,-154 180,-154 L-204,-146 C-240,-146 -262,-170 -262,-205 Z"
              fill={ink}
            />
          )}
          {d(1) > 0.001 && (
            <g transform={`translate(0 ${f2(up(1))})`}>
              <path d="M200,-236 L232,-318 C244,-352 296,-366 332,-344 L392,-306 C406,-296 400,-270 380,-268 L300,-258 L262,-196 Z" fill={ink} />
              <circle cx={312} cy={-322} r={8} fill={C.paper} />
            </g>
          )}
          {d(2) > 0.001 && (
            <path
              transform={`translate(0 ${f2(up(2))}) rotate(${f2((earA * 180) / Math.PI)} 270 -330)`}
              d="M262,-336 C246,-330 236,-300 240,-262 C244,-238 266,-236 274,-258 C282,-286 284,-318 276,-334 Z"
              fill={far}
            />
          )}
          {d(8) > 0.001 && <rect x={214} y={-292 + up(8)} width={26} height={70} rx={6} fill={C.orange} transform={`rotate(-22 227 ${f2(-257 + up(8))})`} />}
        </g>
      )}
      {part !== 'body' && legs(1)}
    </g>
  );
};
export const collarOf = (p: DogPose): P2 => [p.x + 232, p.y - 262 + p.bob];

/* ═══════════ 迈步者（世界坐标；骨盆 x = P，地面 y = G，朝右） ═══════════ */
export const FIG = {H: 2100, thigh: 515, shin: 517, foot: 290, ankle: 58};
export type FigPose = {x: number; ground: number; phase: number; s: number; lean: number};
type Joints = {hip: P2; legs: {knee: P2; ankle: P2; heel: P2; toe: P2}[]; neck: P2; head: P2; chest: P2; shoulder: P2};

export const joints = (p: FigPose): Joints => {
  const legsRaw = [0, 1].map((j) => {
    const ph = p.phase + j * Math.PI;
    const a = 0.5 * p.s * Math.sin(ph); // 髋角（正 = 往前）
    const b = p.s * (0.06 + 0.85 * Math.pow(Math.max(0, Math.cos(ph - 0.5)), 2)); // 膝弯
    const knee = rot(0, FIG.thigh, -a);
    const sh = rot(0, FIG.shin, -(a - b));
    const ankle: P2 = [knee[0] + sh[0], knee[1] + sh[1]];
    const fa = -0.55 * (a - b) * 0.6 + 0.25 * Math.max(0, Math.sin(ph + 2.4)) * p.s;
    const fd = rot(1, 0, -fa);
    const heel: P2 = [ankle[0] - fd[0] * 70, ankle[1] + FIG.ankle * 0.6 - fd[1] * 70];
    const toe: P2 = [ankle[0] + fd[0] * (FIG.foot - 70), ankle[1] + FIG.ankle - fd[1] * (FIG.foot - 70)];
    return {knee, ankle, heel, toe};
  });
  // 骨盆高度：让最低的那只脚刚好踩在地上
  const low = Math.max(...legsRaw.map((l) => Math.max(l.toe[1], l.heel[1])));
  const hip: P2 = [p.x, p.ground - low];
  const legs = legsRaw.map((l) => ({
    knee: [hip[0] + l.knee[0], hip[1] + l.knee[1]] as P2,
    ankle: [hip[0] + l.ankle[0], hip[1] + l.ankle[1]] as P2,
    heel: [hip[0] + l.heel[0], hip[1] + l.heel[1]] as P2,
    toe: [hip[0] + l.toe[0], hip[1] + l.toe[1]] as P2,
  }));
  const tl = rot(0, -640, p.lean);
  const chest: P2 = [hip[0] + tl[0] * 0.55, hip[1] + tl[1] * 0.55];
  const shoulder: P2 = [hip[0] + tl[0], hip[1] + tl[1]];
  const nk = rot(0, -150, p.lean * 1.3);
  const neck: P2 = [shoulder[0] + nk[0], shoulder[1] + nk[1]];
  const hd = rot(30, -130, p.lean * 1.4);
  return {hip, legs, chest, shoulder, neck, head: [neck[0] + hd[0], neck[1] + hd[1]]};
};

/** 迈步者：躯干前倾、没有手臂（波丘尼的雕塑没有手臂），肩上一片往后掠的“翼”随速度张开 */
export const Figure: React.FC<{p: FigPose; ink: string; far: string; only?: 'legs'}> = ({p, ink, far, only}) => {
  const J = joints(p);
  const leg = (j: number, fill: string) => {
    const l = J.legs[j];
    return (
      <g key={j} fill={fill}>
        <path d={limb(J.hip, l.knee, 250, 170)} />
        <path d={limb(l.knee, l.ankle, 170, 84)} />
        {/* 大腿后面往后鼓的一块 */}
        <path d={`M${f2(J.hip[0] - 60)},${f2(J.hip[1] + 60)} Q${f2((J.hip[0] + l.knee[0]) / 2 - 170 - p.s * 60)},${f2((J.hip[1] + l.knee[1]) / 2 + 40)} ${f2(l.knee[0] - 40)},${f2(l.knee[1] + 10)} Z`} />
        <path d={`M${f2(l.heel[0])},${f2(l.heel[1])} L${f2(l.ankle[0] - 20)},${f2(l.ankle[1] - 30)} L${f2(l.ankle[0] + 40)},${f2(l.ankle[1] - 10)} L${f2(l.toe[0])},${f2(l.toe[1] - 10)} L${f2(l.toe[0])},${f2(l.toe[1])} Z`} />
        {/* 小腿后面的“火焰”：往后掠，长度随速度 */}
        <path d={`M${f2(l.knee[0] - 20)},${f2(l.knee[1] + 40)} Q${f2(l.knee[0] - 200 - p.s * 140)},${f2((l.knee[1] + l.ankle[1]) / 2 - 40)} ${f2(l.ankle[0] - 30)},${f2(l.ankle[1] - 40)} Z`} />
      </g>
    );
  };
  // 远腿：相位偏后的那条
  const back = Math.sin(p.phase) > 0 ? 1 : 0;
  if (only === 'legs') return <>{[leg(back, far), leg(1 - back, ink)]}</>;
  const wing = 140 + 160 * clamp(p.s - 0.6);
  const sh = J.shoulder;
  const ch = J.chest;
  return (
    <g>
      {leg(back, far)}
      <path
        d={`M${f2(J.hip[0] - 120)},${f2(J.hip[1] + 40)} C${f2(ch[0] - 190)},${f2(ch[1] + 60)} ${f2(ch[0] - 150)},${f2(ch[1] - 80)} ${f2(sh[0] - 120)},${f2(sh[1] + 10)} L${f2(sh[0] - wing)},${f2(sh[1] - 40)} L${f2(sh[0] + 30)},${f2(sh[1] - 70)} C${f2(sh[0] + 150)},${f2(sh[1] - 20)} ${f2(ch[0] + 170)},${f2(ch[1] - 40)} ${f2(ch[0] + 130)},${f2(ch[1] + 80)} C${f2(J.hip[0] + 140)},${f2(J.hip[1] - 60)} ${f2(J.hip[0] + 120)},${f2(J.hip[1] + 20)} ${f2(J.hip[0] + 90)},${f2(J.hip[1] + 60)} Z`}
        fill={ink}
      />
      <path d={limb(sh, J.neck, 120, 90)} fill={ink} />
      <ellipse cx={f2(J.head[0])} cy={f2(J.head[1])} rx={92} ry={112} fill={ink} transform={`rotate(${f2((p.lean * 180) / Math.PI + 12)} ${f2(J.head[0])} ${f2(J.head[1])})`} />
      {/* 头盔一样往后掠的冠 */}
      <path d={`M${f2(J.head[0] - 40)},${f2(J.head[1] - 100)} L${f2(J.head[0] - 190 - 60 * p.s)},${f2(J.head[1] - 40)} L${f2(J.head[0] - 60)},${f2(J.head[1] + 20)} Z`} fill={ink} />
      {leg(1 - back, ink)}
    </g>
  );
};
