/**
 * 01 绘画 · 巴拉《拴着皮带的狗的动态》1912（92—252）—— 夜里的人行道，路灯下
 *
 *   92—112   上一章的橙色车身往左甩出去，镜头还在横摇、慢慢停下：太太和腊肠狗正走过来
 *   112—170  跟拍（低机位）：远处的楼慢、路灯中速、近处的护栏桩最快（三层视差）；走进路灯的光里
 *            腿摆得最快、残影最多（巴拉的“多腿”）；裙摆、鞋、狗绳也各自拖出几道
 *   170—176  狗突然刹住去闻路灯杆：腿上的残影一层层收拢，耳朵往前一甩再晃两下，尾巴摇得飞快
 *   176—186  太太还在走，狗绳一下绷直（抖两下）—— 狗被拽得往前滑
 *   186—214  狗小碎步追上去：腿的残影扇得最开
 *   214—250  镜头推近太太往前迈的那只鞋——落地的一刻，切到下一章同一个位置的一只铬银的脚（匹配剪辑）
 */
import React from 'react';
import {C} from '../tokens';
import {Echoes, H, W, echoCount, mixHex, wdthOf, zoomLerp} from './kit';
import {Dog, DogPose, DOG_CYCLE, collarOf, dogPaw} from './figure';
import {clamp, ease, follow, lerp, path1, prog, vel, wobble} from './motion';

const G = 870; // 人行道
const f1 = (v: number) => v.toFixed(1);
const DS = 0.82; // 狗的缩放

/* ───────── 轨迹 ───────── */
const V = 16; // 走路速度 px/帧
// 起点让近处那只鞋（j = 0）正好在 f250 落地：ladyX(250) = 7 × 一步的周期
export const ladyX = (t: number) => 120 + V * (t - 100);
/** 狗：跟着走 → 170 急刹 → 182 被拽（冲量）→ 小碎步追上 → 214 起回到原来的位置关系 */
export const dogX = (t: number) => {
  const base = ladyX(t) + 360;
  if (t < 170) return base;
  const stopX = ladyX(170) + 360 + (V * 6) / 2; // 6 帧刹停
  if (t < 176) return ladyX(170) + 360 + V * (t - 170) - (V / 12) * (t - 170) * (t - 170);
  if (t < 188) return stopX;
  // 被拽：以 30 px/帧 滑出去，再小碎步追上、冲到前面（离太太 560px），给最后推近的那只鞋让出画面
  if (t < 214) return path1(t, [[188, stopX, 30], [214, ladyX(214) + 560, V + 4]]);
  return ladyX(t) + 560 + 4 * (t - 214) + 0.3 * Math.max(0, t - 224) ** 2; // 推近时狗冲出画面右边
};
const dogV = (t: number) => vel(dogX, t);
const yanked = (t: number) => t >= 188 && t < 195;

const dogPose = (t: number): DogPose => {
  const x = dogX(t);
  const v = Math.abs(dogV(t));
  // 步态相位跟走过的距离；被拽着滑的那几帧腿是绷直的
  const amp = yanked(t) ? 0 : 0.7 * clamp(v / 12);
  const phase = (2 * Math.PI * x) / (DOG_CYCLE * 0.62);
  return {x, y: G, phase, amp, drop: [], bob: 0};
};
/** 刹车时耳朵往前甩（惯性），尾巴在闻的时候摇得飞快 */
const earKick = (t: number) => wobble(t, 172, 0.5, 9, 10);
const sniff = (t: number) => (t > 172 && t < 188 ? Math.sin(((t - 172) / 16) * Math.PI) : 0);

/* ───────── 太太：只画到膝盖以下（巴拉的画也是） ───────── */
const LC = 360; // 一步的周期长度
export const foot = (t: number, j: number) => {
  const d = ladyX(t);
  const q = d / LC + j / 2;
  const n = Math.floor(q);
  const fr = q - n;
  const plant = (m: number) => (m - j / 2) * LC + LC / 4;
  if (fr < 0.5) return {x: plant(n), lift: 0, ang: 0};
  const u = (fr - 0.5) / 0.5;
  return {x: lerp(plant(n), plant(n + 1), ease.sine(u)), lift: 46 * Math.sin(Math.PI * u), ang: -14 * Math.sin(Math.PI * u)};
};
const Lady: React.FC<{t: number; k: number}> = ({t, k}) => {
  const x = ladyX(t);
  const ink = k ? C.orange : C.ink;
  const skirt = k ? C.orange : mixHex(C.ink, C.cobalt, 0.26);
  const sway = 22 * Math.sin((2 * Math.PI * x) / LC);
  const hem = G - 120;
  const pts: string[] = [];
  for (let i = 0; i <= 10; i++) {
    const u = i / 10;
    const hx = x - 175 + u * 350 + sway * (1 - Math.abs(u - 0.5));
    const hy = hem + 10 * Math.sin(u * Math.PI * 4 + x / 30);
    pts.push(`${f1(hx)},${f1(hy)}`);
  }
  return (
    <g>
      {[1, 0].map((j) => {
        const fp = foot(t, j);
        const fy = G - fp.lift;
        return (
          <g key={j} transform={`rotate(${f1(fp.ang)} ${f1(fp.x)} ${f1(fy)})`} fill={j ? (k ? C.orange : mixHex(C.ink, C.paper, 0.25)) : ink}>
            <rect x={fp.x - 26} y={hem - 20} width={52} height={fy - hem} />
            <path d={`M${f1(fp.x - 34)},${f1(fy)} L${f1(fp.x - 30)},${f1(fy - 44)} L${f1(fp.x + 30)},${f1(fy - 34)} C${f1(fp.x + 64)},${f1(fy - 26)} ${f1(fp.x + 84)},${f1(fy - 12)} ${f1(fp.x + 88)},${f1(fy)} Z`} />
            <rect x={fp.x - 34} y={fy - 4} width={26} height={8} />
          </g>
        );
      })}
      {/* 推近那只鞋时，裙摆和狗绳的残影先收掉，别糊在画面中间 */}
      {(k === 0 || pushU(t) < 0.05) && <polygon points={[`${f1(x - 105)},-40`, `${f1(x + 105)},-40`, ...pts.reverse()].join(' ')} fill={skirt} />}
    </g>
  );
};
const hand = (t: number) => ({x: ladyX(t) + 120, y: -60});

/* ───────── 狗绳 ───────── */
const leash = (t: number) => {
  const p = dogPose(t);
  const [cx, cy] = collarOf({...p, x: p.x / DS, y: G / DS}).map((v) => v * DS);
  const a = hand(t);
  const b = {x: cx + (p.x - p.x * DS) * 0 , y: cy};
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const slack = clamp((1080 - dist) / 260); // 越近越松
  const twang = t > 186 ? wobble(t, 187, 30, 6, 7) : 0;
  const swing = 50 * p.amp * Math.sin(p.phase * 0.5 + 0.7);
  return {a, b, c: {x: (a.x + b.x) / 2 + swing + 80 * slack + twang, y: (a.y + b.y) / 2 + 60 * slack}};
};

/* ───────── 镜头：跟着狗；开头还带着上一章的横摇 ───────── */
const camX = (t: number) => follow(dogX, t, 5, 1) - 700 + (t < 112 ? path1(t, [[92, 1500, -120], [112, 0, 0]]) : 0);
/** 214 起推近太太前面那只鞋，250 落地 */
const PUSH = 214;
const pushU = (t: number) => ease.inOut(prog(t, PUSH, 36));
export const BOOT = {x: 960, y: 760, z: 2.6}; // 匹配剪辑：鞋在屏幕上的位置与放大倍数
const frontFoot = () => 0; // 近处那只（黑色）
const Z_BASE = 1.3; // 低机位、近一点：狗和鞋都更大
const ANCHOR = {x: 760, y: G};
export const camT = (t: number) => {
  const cx = camX(t);
  const u = pushU(t);
  const fp = foot(250, frontFoot());
  const fx = fp.x + 30 - cx;
  const fy = G - 20;
  return {
    tx: -cx,
    s: zoomLerp(Z_BASE, BOOT.z, u),
    ax: lerp(ANCHOR.x, fx, u),
    ay: lerp(ANCHOR.y, fy, u),
    ox: lerp(0, BOOT.x - fx, u),
    oy: lerp(0, BOOT.y - fy, u),
  };
};
/** 世界 → 屏幕：先横移（镜头跟拍），再以锚点放大（推近时锚点从狗移到那只鞋，并把鞋送到 BOOT） */
const world = (t: number) => {
  const c = camT(t);
  return `translate(${f1(c.ax + c.ox)} ${f1(c.ay + c.oy)}) scale(${c.s.toFixed(4)}) translate(${f1(-c.ax)} ${f1(-c.ay)}) translate(${f1(c.tx)} 0)`;
};

/* ───────── 布景 ───────── */
const FACADE = Array.from({length: 16}, (_, i) => {
  const n = (i * 7919 + 3) % 97;
  return {x: i * 420 - 600, w: 380 + (n % 60), h: 420 + (n % 5) * 70, win: n};
});
const LAMP_X = [1150, 2470, 3800];
const Backdrop: React.FC<{t: number}> = ({t}) => {
  const cx = camX(t);
  const c = camT(t);
  const far = `translate(${f1(-cx * 0.25)} 0)`;
  return (
    <g>
      <rect width={W} height={H} fill={C.ink} />
      <g transform={`translate(${f1(c.ax + c.ox * 0.3)} ${f1(c.ay + c.oy * 0.3)}) scale(${(1 + (c.s - 1) * 0.3).toFixed(4)}) translate(${f1(-c.ax)} ${f1(-c.ay)}) ${far}`}>
        {FACADE.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={G - 60 - b.h} width={b.w} height={b.h + 60} fill={mixHex(C.ink, C.cobalt, 0.07 + (i % 3) * 0.025)} />
            {Array.from({length: 12}, (_, j) => {
              const lit = (b.win + j * 13) % 7 === 0;
              return lit ? <rect key={j} x={b.x + 40 + (j % 4) * 86} y={G - b.h + 10 + Math.floor(j / 4) * 110} width={34} height={54} fill={C.orange} opacity={0.55} /> : null;
            })}
          </g>
        ))}
      </g>
    </g>
  );
};
const Street: React.FC<{t: number}> = ({t}) => (
  <g transform={world(t)}>
    <rect x={camX(t) - 2000} y={G} width={8000} height={600} fill={mixHex(C.ink, C.silver, 0.14)} />
    <rect x={camX(t) - 2000} y={G + 60} width={8000} height={10} fill={mixHex(C.ink, C.silver, 0.3)} />
    {LAMP_X.map((x) => (
      <g key={x}>
        <ellipse cx={x + 90} cy={G + 16} rx={360} ry={40} fill={C.paper} opacity={0.34} />
        <ellipse cx={x + 90} cy={G + 12} rx={220} ry={22} fill={C.paperHi} opacity={0.3} />
        <rect x={x - 12} y={170} width={24} height={G - 170} fill={mixHex(C.ink, C.silver, 0.35)} />
        <rect x={x - 12} y={170} width={110} height={16} fill={mixHex(C.ink, C.silver, 0.35)} />
        <circle cx={x + 90} cy={196} r={70} fill={C.paperHi} opacity={0.08} />
        <circle cx={x + 90} cy={196} r={22} fill={C.paperHi} />
      </g>
    ))}
  </g>
);
/** 路灯的光锥（画在人物上面：光把人照亮） */
const Light: React.FC<{t: number}> = ({t}) => (
  <g transform={world(t)}>
    {LAMP_X.map((x) => (
      <polygon key={x} points={`${x + 70},196 ${x + 110},196 ${x + 450},${G + 14} ${x - 270},${G + 14}`} fill={C.paperHi} opacity={0.11} />
    ))}
  </g>
);
/** 前景的护栏桩：比人走得快（视差 1.6），黑剪影从镜头前扫过 */
const Front: React.FC<{t: number}> = ({t}) => {
  if (pushU(t) > 0.3) return null;
  const cx = camX(t) * 1.6;
  const out: React.ReactNode[] = [];
  for (let x = Math.floor((cx - 400) / 980) * 980; x < cx + W + 400; x += 980) {
    out.push(<rect key={x} x={f1(x - cx)} y={G - 120} width={86} height={400} rx={18} fill={'#0B0907'} />);
  }
  return <>{out}</>;
};

/* ───────── 残影的状态（屏幕坐标） ───────── */
const legState = (u: number) => {
  const p = dogPose(u);
  const cx = camX(u);
  return [0, 1, 2, 3].flatMap((i) => {
    const q = dogPaw(p, i);
    return [(p.x / DS + q[0]) * DS - cx, (G / DS + q[1]) * DS];
  });
};
const bodyState = (u: number) => [dogX(u) - camX(u)];
const ladyState = (u: number) => [0, 1].flatMap((j) => [foot(u, j).x - camX(u), foot(u, j).lift]);

const RIM = mixHex(C.paperHi, C.orange, 0.25);
const DogAt: React.FC<{t: number; k: number}> = ({t, k}) => {
  const p = dogPose(t);
  const ink = k ? C.orange : C.ink;
  const far = k ? C.orange : mixHex(C.ink, C.paper, 0.3);
  const ear = earKick(t);
  const sn = sniff(t);
  return (
    <g transform={`translate(${f1(p.x)} ${G}) scale(${DS}) rotate(${f1(sn * 6)} 300 -200) translate(${f1(-p.x)} ${-G})`}>
      {/* 轮廓光：同一个剪影往右上挪 3px 垫在下面，背上亮一道边 */}
      {!k && (
        <g transform="translate(3 -4)" opacity={0.75}>
          <Dog p={p} ink={RIM} far={RIM} earBias={ear + sn * 0.4} tailRate={t > 170 && t < 192 ? 3.2 : 1} t={t} />
        </g>
      )}
      <Dog p={p} ink={ink} far={far} earBias={ear + sn * 0.4} tailRate={t > 170 && t < 192 ? 3.2 : 1} t={t} />
    </g>
  );
};

export const Balla: React.FC<{t: number}> = ({t}) => {
  const w = (u: number) => world(u);
  return (
    <g>
      <Backdrop t={t} />
      <Street t={t} />
      <Echoes t={t} state={ladyState} render={(u, k) => <g transform={w(u)}><Lady t={u} k={k} /></g>} />
      <Echoes
        t={t}
        eps={1}
        state={(u) => {
          const L = leash(u);
          return [L.c.x - camX(u), L.c.y, L.b.x - camX(u)];
        }}
        render={(u, k) => {
          if (k && pushU(t) > 0.05) return null;
          const L = leash(u);
          return (
            <g transform={w(u)}>
              <path d={`M${f1(L.a.x)},${f1(L.a.y)} Q${f1(L.c.x)},${f1(L.c.y)} ${f1(L.b.x)},${f1(L.b.y)}`} stroke={k ? C.orange : C.paperHi} strokeWidth={6} fill="none" opacity={k ? 1 : 0.85} />
            </g>
          );
        }}
      />
      <Echoes t={t} eps={1} state={(u) => [...legState(u), ...bodyState(u), earKick(u) * 40, sniff(u) * 20]} render={(u, k) => (k && pushU(t) > 0.15 ? null : <g transform={w(u)}><DogAt t={u} k={k} /></g>)} />
      <Light t={t} />
      <Front t={t} />
    </g>
  );
};

export const ballaProbe = (t: number) => {
  if (t < 108) return null;
  const s = legState(t);
  const s1 = legState(t - 1);
  let v = 0;
  for (let i = 0; i < s.length; i += 2) v = Math.max(v, Math.hypot(s[i] - s1[i], s[i + 1] - s1[i + 1]));
  return {v, wdth: wdthOf(v), n: echoCount(t, legState, 4)};
};
export const ballaSpeed = (t: number) => Math.max(ballaProbe(t)?.v ?? 0, Math.abs(vel(camX, t)) * 1.6, t < 112 ? 60 : 0);
export const ballaEcho = (t: number) => echoCount(t, bodyState, 6);
