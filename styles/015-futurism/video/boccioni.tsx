/**
 * 02 雕塑 · 波丘尼《空间中连续性的独特形式》1913（250—351）—— 夜里的美术馆
 *
 *   250      匹配剪辑：上一章那只鞋落地的位置，现在是一只铬银的脚；镜头从 2.6 倍拉回全身
 *   250—285  铬银的人在展厅里跑（镜头锁着他，墙上的画往后退），抛光的地板上有倒影；残影是钴蓝的
 *   285      第 12 拍：定格——时间停住，残影不再褪；顶上的聚光灯“啪”地亮起
 *   285—297  残影凝固成铬银的“火焰”（一层比一层浅，像抛光青铜上的一个个面）
 *   290—300  雕塑被抬起；300 / 312 两块底座从地板里顶上来刹停：TUMB · TUMB（每级 ÷ 1.5）
 *   325—351  第一个 TUMB 冲向镜头，T 的竖画撑满画面 → 下一章
 */
import React from 'react';
import {C} from '../tokens';
import {BOOT} from './balla';
import {Echoes, H, W, Word, advOf, echoCount, mixHex, wdthOf, zoomLerp} from './kit';
import {FigPose, joints, limb} from './figure';
import {anticLand, clamp, ease, land, lerp, path1, prog, thump, vel} from './motion';

const GM = 930; // 地板
const SC = 0.3; // 迈步者的缩放（FIG 是 2100 高）
const TF = 285; // 定格
const f1 = (v: number) => v.toFixed(1);
type P2 = [number, number];

/* ───────── 跑 ───────── */
const VR = 62; // FIG 单位 / 帧
const CYC = 2000;
const PX0 = 0;
const runX = (t: number) => PX0 + VR * (Math.min(t, TF) - 250);
/** 让定格正好落在步子最开的时候 */
const PHI0 = Math.PI / 2 - (2 * Math.PI * (runX(TF) - PX0)) / CYC;
const pose = (t: number): FigPose => {
  const x = runX(t);
  return {x, ground: 0, phase: PHI0 + (2 * Math.PI * (x - PX0)) / CYC, s: 1.32, lean: 0.24};
};

/* ───────── 镜头：锁着人；开头从脚上 2.6 倍拉回 ───────── */
const frontFootAt = (t: number) => {
  const J = joints(pose(t));
  return J.legs.reduce((a, l) => (l.toe[0] > a.toe[0] ? l : a));
};
/** 世界 → 屏幕：人（FIG 坐标）× SC，骨盆放在屏幕 x = 880，地板在 GM */
const base = (t: number) => ({x: 880 - runX(t) * SC, y: GM});
const pull = (t: number) => ease.inOut(prog(t, 250, 24));
const view = (t: number) => {
  const b = base(t);
  const f = frontFootAt(250);
  const fx = b.x + f.ankle[0] * SC + 30;
  const fy = b.y + f.ankle[1] * SC;
  const s = zoomLerp(BOOT.z, 1, pull(t));
  const u = 1 - pull(t);
  return {b, fx, fy, s, ox: (BOOT.x - fx) * u, oy: (BOOT.y - fy) * u};
};
/** FIG 坐标里的点 → 屏幕 */
const tr = (t: number) => {
  const v = view(t);
  return `translate(${f1(v.fx + v.ox)} ${f1(v.fy + v.oy)}) scale(${v.s.toFixed(4)}) translate(${f1(-v.fx)} ${f1(-v.fy)}) translate(${f1(v.b.x)} ${f1(v.b.y)}) scale(${SC})`;
};
const shake = (t: number) => thump(t, 300, 10, 14) + thump(t, 312, 7, 14);

/* ───────── 铬银的人 ───────── */
const CHROME = {dark: mixHex(C.silver, C.ink, 0.62), mid: mixHex(C.silver, C.ink, 0.3), hi: mixHex(C.silver, C.paperHi, 0.5), spec: C.paperHi};
/** 一段有肌肉的肢体：前后两侧各鼓一点 */
const muscle = (a: P2, b: P2, wa: number, wb: number, front: number, back: number) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L;
  const ny = dx / L;
  const P = (u: number, side: number, w: number) => [a[0] + dx * u + nx * side * w, a[1] + dy * u + ny * side * w];
  const p = (q: number[]) => `${f1(q[0])},${f1(q[1])}`;
  const fw = (wa + wb) / 4;
  return `M${p(P(0, 1, wa / 2))} C${p(P(0.35, 1, wa / 2 + front))} ${p(P(0.7, 1, fw + front * 0.6))} ${p(P(1, 1, wb / 2))} L${p(P(1, -1, wb / 2))} C${p(P(0.7, -1, fw + back * 0.6))} ${p(P(0.35, -1, wa / 2 + back))} ${p(P(0, -1, wa / 2))} Z`;
};
/** 火焰：从 a 到 b 的后侧往后甩出一片尖形，长度 len */
const flame = (a: P2, b: P2, len: number, lift = 0.4) => {
  const mx = lerp(a[0], b[0], 0.45) - len;
  const my = lerp(a[1], b[1], 0.45) - len * lift;
  return `M${f1(a[0])},${f1(a[1])} Q${f1(mx + len * 0.4)},${f1(my + len * 0.05)} ${f1(mx)},${f1(my)} Q${f1(mx + len * 0.55)},${f1((my + b[1]) / 2 + len * 0.1)} ${f1(b[0])},${f1(b[1])} Z`;
};
const Runner: React.FC<{p: FigPose; tone?: string; flat?: boolean; light?: number}> = ({p, tone, flat, light = 0}) => {
  const J = joints(p);
  const dark = tone ?? CHROME.dark;
  const hi = flat ? dark : mixHex(CHROME.mid, CHROME.hi, light);
  const back = Math.sin(p.phase) > 0 ? 1 : 0;
  const leg = (j: number, far: boolean) => {
    const l = J.legs[j];
    const col = far && !flat ? mixHex(dark, C.ink, 0.35) : dark;
    const k: P2 = l.knee;
    const an: P2 = l.ankle;
    return (
      <g key={j}>
        <path d={flame([J.hip[0] - 40, J.hip[1] + 80], [k[0] - 50, k[1] + 10], 150 * p.s, 0.1)} fill={col} />
        <path d={flame([k[0] - 30, k[1] + 40], [an[0] - 20, an[1] - 30], 260 * p.s, 0.25)} fill={col} />
        <path d={muscle(J.hip, k, 270, 180, 60, 30)} fill={col} />
        <path d={muscle(k, an, 180, 86, 20, 70)} fill={col} />
        <path d={`M${f1(l.heel[0])},${f1(l.heel[1])} L${f1(an[0] - 34)},${f1(an[1] - 40)} L${f1(an[0] + 50)},${f1(an[1] - 16)} L${f1(l.toe[0] + 10)},${f1(l.toe[1] - 6)} L${f1(l.toe[0])},${f1(l.toe[1])} Z`} fill={col} />
        {!flat && !far && (
          <g fill={hi}>
            <path d={muscle([J.hip[0] + 30, J.hip[1] + 20], [k[0] + 24, k[1] - 16], 70, 46, 30, 0)} />
            <path d={muscle([k[0] + 22, k[1] + 10], [an[0] + 12, an[1] - 20], 50, 22, 8, 0)} />
          </g>
        )}
      </g>
    );
  };
  const sh = J.shoulder;
  const ch = J.chest;
  const hd = J.head;
  const wing = 200 + 200 * clamp(p.s - 0.6);
  return (
    <g>
      {leg(back, true)}
      {/* 背后往后掠的大片“火焰” + 躯干 */}
      <path d={flame([J.hip[0] - 80, J.hip[1] - 40], [sh[0] - 90, sh[1] + 60], 320 * p.s, 0.5)} fill={dark} />
      <path
        d={`M${f1(J.hip[0] - 150)},${f1(J.hip[1] + 40)} C${f1(ch[0] - 230)},${f1(ch[1] + 70)} ${f1(ch[0] - 170)},${f1(ch[1] - 90)} ${f1(sh[0] - 140)},${f1(sh[1] + 10)} L${f1(sh[0] - wing)},${f1(sh[1] - 60)} L${f1(sh[0] + 40)},${f1(sh[1] - 90)} C${f1(sh[0] + 190)},${f1(sh[1] - 30)} ${f1(ch[0] + 220)},${f1(ch[1] - 40)} ${f1(ch[0] + 170)},${f1(ch[1] + 90)} C${f1(J.hip[0] + 170)},${f1(J.hip[1] - 70)} ${f1(J.hip[0] + 150)},${f1(J.hip[1] + 20)} ${f1(J.hip[0] + 110)},${f1(J.hip[1] + 70)} Z`}
        fill={dark}
      />
      {!flat && <path d={muscle([ch[0] + 40, ch[1] + 90], [sh[0] + 70, sh[1] - 40], 90, 60, 50, 0)} fill={hi} />}
      <path d={limb(sh, J.neck, 140, 100)} fill={dark} />
      <ellipse cx={f1(hd[0])} cy={f1(hd[1])} rx={100} ry={118} fill={dark} transform={`rotate(${f1((p.lean * 180) / Math.PI + 14)} ${f1(hd[0])} ${f1(hd[1])})`} />
      {/* 头盔一样的十字冠：往后、往上各一片 */}
      <path d={`M${f1(hd[0] - 50)},${f1(hd[1] - 100)} L${f1(hd[0] - 260 - 80 * p.s)},${f1(hd[1] - 30)} L${f1(hd[0] - 70)},${f1(hd[1] + 30)} Z`} fill={dark} />
      <path d={`M${f1(hd[0] - 10)},${f1(hd[1] - 90)} L${f1(hd[0] - 70)},${f1(hd[1] - 230)} L${f1(hd[0] + 40)},${f1(hd[1] - 110)} Z`} fill={dark} />
      {!flat && <ellipse cx={f1(hd[0] + 30)} cy={f1(hd[1] - 30)} rx={30} ry={50} fill={hi} transform={`rotate(20 ${f1(hd[0] + 30)} ${f1(hd[1] - 30)})`} />}
      {leg(1 - back, false)}
    </g>
  );
};

/* ───────── 展厅 ───────── */
const PAINTINGS = Array.from({length: 7}, (_, i) => ({x: -900 + i * 620, w: 300 + (i % 3) * 60, h: 220 + (i % 2) * 60, kind: i % 4}));
const spot = (t: number) => (t < TF ? 0 : land(t, TF, 8));
const Hall: React.FC<{t: number}> = ({t}) => {
  const v = view(t);
  const wall = `translate(${f1(v.fx + v.ox)} ${f1(v.fy + v.oy)}) scale(${(1 + (v.s - 1) * 0.6).toFixed(4)}) translate(${f1(-v.fx)} ${f1(-v.fy)}) translate(${f1(-runX(t) * SC * 0.55)} 0)`;
  const sp = spot(t);
  return (
    <g>
      <rect width={W} height={H} fill={mixHex(C.ink, C.cobalt, 0.06)} />
      <g transform={wall}>
        {PAINTINGS.map((p, i) => (
          <g key={i}>
            <rect x={p.x} y={300 - p.h / 2} width={p.w} height={p.h} fill={mixHex(C.ink, C.paper, 0.06)} stroke={mixHex(C.ink, C.silver, 0.4)} strokeWidth={6} />
            <polygon points={`${p.x + 30},${300 + p.h / 2 - 30} ${p.x + p.w - 30},${300 - p.h / 4} ${p.x + 30},${300 - p.h / 2 + 30}`} fill={p.kind % 2 ? C.orange : C.cobalt} opacity={0.5} />
            <ellipse cx={p.x + p.w / 2} cy={300 - p.h / 2 - 24} rx={p.w * 0.45} ry={14} fill={C.paper} opacity={0.08} />
          </g>
        ))}
      </g>
      <rect y={GM} width={W} height={H - GM} fill={mixHex(C.ink, C.silver, 0.08)} />
      <rect y={GM} width={W} height={4} fill={mixHex(C.ink, C.silver, 0.25)} />
      {/* 聚光灯：定格那一下亮起 */}
      {sp > 0.01 && (
        <g opacity={clamp(sp)}>
          <polygon points={`${880 - 60},0 ${880 + 60},0 ${880 + 520},${GM} ${880 - 520},${GM}`} fill={C.paperHi} opacity={0.1} />
          <ellipse cx={880} cy={GM + 30} rx={560 * Math.min(1.05, sp)} ry={60} fill={C.paperHi} opacity={0.22} />
        </g>
      )}
    </g>
  );
};

/* ───────── 定格后：残影凝固 + 抬起 + 底座 ───────── */
const SOLID = (k: number) => mixHex(CHROME.dark, C.silver, 0.1 + 0.11 * k);
const LIFT = 120; // 屏幕 px
const lift = (t: number) => -LIFT * (t < 290 ? 0 : clamp(anticLand(t, 290, 4, 12, 0.05), -0.1, 1.06));
const PLINTH = (() => {
  const J = joints(pose(TF));
  const rear = J.legs.reduce((a, l) => (l.heel[0] < a.heel[0] ? l : a));
  const front = J.legs.reduce((a, l) => (l.toe[0] > a.toe[0] ? l : a));
  const b = base(TF);
  const X = (x: number) => b.x + x * SC;
  return [
    {x0: X(rear.heel[0]) - 30, x1: X(rear.toe[0]) + 20, at: 300},
    {x0: X(front.heel[0]) - 20, x1: X(front.toe[0]) + 40, at: 312},
  ];
})();
/** 底座从地板里顶上来：减速顶到位（顶面 = 抬起后的脚底） */
const plinthTop = (i: number, t: number) => {
  const p = PLINTH[i];
  return path1(t, [[p.at - 8, GM + 10, -40], [p.at, GM - LIFT, 0]]);
};
const Plinth: React.FC<{i: number; t: number; k: number}> = ({i, t, k}) => {
  const p = PLINTH[i];
  if (t < p.at - 8) return null;
  const y = Math.max(GM - LIFT, plinthTop(i, t));
  return (
    <g>
      <rect x={p.x0} y={y} width={p.x1 - p.x0} height={GM - y} fill={k ? C.cobalt : mixHex(C.ink, C.silver, 0.22)} />
      {!k && <rect x={p.x0} y={y} width={p.x1 - p.x0} height={6} fill={C.silver} opacity={0.7} />}
    </g>
  );
};

/* ───────── TUMB ───────── */
const TUMBS = [
  {at: 300, size: 210, rot: -8, end: {x: 210, y: 560}},
  {at: 312, size: 140, rot: 7, end: {x: 1480, y: 470}},
];
const tumbPos = (i: number, t: number) => {
  const T = TUMBS[i];
  const p = PLINTH[i];
  const sx = i === 0 ? p.x0 : p.x1;
  return {x: path1(t, [[T.at, sx, (i ? 1 : -1) * 70], [T.at + 16, T.end.x, 0]]), y: path1(t, [[T.at, GM - LIFT, -60], [T.at + 16, T.end.y, 0]])};
};
export const TUMB_ZOOM = (t: number) => zoomLerp(1, 90, ease.in(prog(t, 331, 13))); // 344 起白色竖画盖满画面 = 下一章的纸
const Tumb: React.FC<{i: number; t: number; k: number}> = ({i, t, k}) => {
  const T = TUMBS[i];
  if (t < T.at) return null;
  const p = tumbPos(i, t);
  const v = Math.hypot(vel((u) => tumbPos(i, u).x, t), vel((u) => tumbPos(i, u).y, t));
  const z = i === 0 ? TUMB_ZOOM(t) : 1;
  if (k && z > 2.5) return null;
  const wd = wdthOf(v);
  const tW = (advOf('T', wd) / 2) * T.size;
  return (
    <g transform={`translate(${f1(p.x)} ${f1(p.y)}) rotate(${T.rot}) scale(${z.toFixed(4)}) translate(${f1(-tW)} ${f1(0.343 * T.size)})`}>
      <Word text="TUMB" x={0} y={0} size={T.size} wdth={wd} fill={k ? C.orange : C.paperHi} />
    </g>
  );
};

/* ───────── 残影状态（屏幕坐标） ───────── */
const figState = (u: number) => {
  const p = pose(u);
  const J = joints({...p, x: 0});
  return J.legs.flatMap((l) => [l.ankle[0] * SC, l.ankle[1] * SC]);
};

export const Boccioni: React.FC<{t: number}> = ({t}) => {
  const dy = shake(t);
  const frozen = t >= TF;
  const solid = ease.inOut(prog(t, TF, 12));
  const ly = lift(t);
  const sp = spot(t);
  const draw = (u: number, k: number, refl: boolean) => {
    const tone = k ? (frozen ? mixHex(C.cobalt, SOLID(k), solid) : C.cobalt) : undefined;
    // 镜头锁着人：残影只取“刚才的姿势”，身子留在原地（不然拉镜头时整个人会糊成一片）
    const cur = Math.min(t, TF);
    return <Runner p={{...pose(u), x: runX(cur)}} tone={tone} flat={k > 0} light={0.25 + 0.75 * sp} />;
  };
  const layer = (refl: boolean) => {
    const flip = refl ? `translate(0 ${2 * GM}) scale(1 -1)` : '';
    if (!frozen) {
      return (
        <g transform={flip} opacity={refl ? 0.16 : 1}>
          <Echoes t={t} state={figState} render={(u, k) => <g transform={tr(t)}>{draw(u, k, refl)}</g>} />
        </g>
      );
    }
    // 定格：残影停在定格那一刻的样子（镜头也停了），跟着雕塑一起被抬起
    return (
      <g transform={`${flip} translate(0 ${f1(refl ? -ly : ly)})`} opacity={refl ? 0.16 : 1}>
        {[6, 5, 4, 3, 2, 1, 0].map((k) => {
          const u = TF - 3 * k;
          return (
            <g key={k} transform={tr(TF)} opacity={k ? lerp(Math.pow(0.6, k), 1, solid) : undefined}>
              {draw(u, k, refl)}
            </g>
          );
        })}
      </g>
    );
  };
  return (
    <g transform={`translate(0 ${f1(dy)})`}>
      <Hall t={t} />
      {layer(true)}
      {[0, 1].map((i) => (
        <Echoes key={i} t={t} state={(u) => [plinthTop(i, u)]} render={(u, k) => <Plinth i={i} t={u} k={k} />} />
      ))}
      {layer(false)}
      {[1, 0].map((i) => (
        <Echoes key={i} t={t} state={(u) => [tumbPos(i, u).x, tumbPos(i, u).y, (i === 0 ? TUMB_ZOOM(u) : 1) * 40]} render={(u, k) => <Tumb i={i} t={u} k={k} />} />
      ))}
    </g>
  );
};

export const bocProbe = (t: number) => {
  if (t >= TF) return {v: 0, wdth: 62, n: 6};
  const s = figState(t);
  const s1 = figState(t - 1);
  const v = Math.max(Math.hypot(s[0] - s1[0], s[1] - s1[1]), Math.hypot(s[2] - s1[2], s[3] - s1[3]));
  return {v, wdth: wdthOf(v), n: echoCount(t, figState, 3)};
};
export const bocSpeed = (t: number) => Math.max(t < TF ? bocProbe(t).v : 0, t > 256 && t < 272 ? 30 : 0, t > 333 ? 60 : 0, Math.abs(vel((u) => tumbPos(0, u).x, t)));
