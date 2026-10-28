/**
 * 开场（0—100）· 片尾最后 50 帧也用它（t − 1200），所以最后一帧 = 第 0 帧。
 *
 *   −∞—25  FUTURISM 一路匀减速（a = 1.0 px/帧²）进场：残影是真实轨迹，越靠近本体越密 = 正在刹车；
 *          字宽跟速度走（104 → 62）；倾角 ∝ 减速度（往前栽），f25 停死，倾角过二阶弹簧弹回（过冲 ≈ 5%）
 *          字母像车厢一样一节晚 1 帧：刹车时后面的字挤上来，起步时前面的字先走
 *   6 帧后  未来主义沿同一条轨迹跟着停（钴蓝残影）
 *   44—60  一句话、宣言出处从遮罩里升起
 *   75—    起势（往后退 24px，8 帧）→ 匀加速 a = 3 冲出右边，字越跑越宽、残影越拉越开；只有 I 被留下（下一章的狗绳）
 */
import React from 'react';
import {C} from '../tokens';
import {Echoes, ForceLines, ForceSpec, Rise, Txt, W, Word, echoCount, layout, wdthOf} from './kit';
import {acc, clamp, ease, prog, springOf, thump, vel} from './motion';

export const TITLE = 'FUTURISM';
export const TS = 250; // 字号
export const TY = 520; // 基线
const A = 1.0; // 刹车减速度
const T1 = 25; // 停下
const X1 = 960; // 停下时的中线
const LAUNCH = 75;
const GO = LAUNCH + 8;
const AG = 3; // 起步加速度
const DELAY = 1; // 每节车厢晚 1 帧
export const I_INDEX = 5;
export const I_HANDOFF = 84;

/** 标题中线 x(t) */
export const titleX = (t: number) => {
  if (t < T1) return X1 - (A / 2) * (T1 - t) * (T1 - t);
  if (t < LAUNCH) return X1;
  if (t < GO) return X1 - 24 * ease.sine(prog(t, LAUNCH, 8));
  return X1 - 24 + (AG / 2) * (t - GO) * (t - GO);
};
export const titleV = (t: number) => vel(titleX, t);
/** 惯性前倾（度）：倾角 = −κ·加速度，过弹簧；软限幅 ±14° */
export const leanOf = (x: (t: number) => number, t: number, k = 7, lim = 14, omega = 0.42) => {
  const raw = springOf((u) => -k * clamp(acc(x, u), -4, 4), t, omega, 0.69, 40, 0.5);
  return lim * Math.tanh(raw / lim);
};

const letterT = (t: number, i: number) => t - DELAY * (TITLE.length - 1 - i);

/** 第 i 个字母在 t 时刻的左边位置、字宽、倾角 */
const letterAt = (t: number, i: number) => {
  const ti = letterT(t, i);
  const wd = wdthOf(titleV(ti));
  const L = layout(TITLE, TS, wd, 900, -0.01);
  return {x: titleX(ti) - L.width / 2 + L.xs[i], wd, lean: leanOf(titleX, ti)};
};

/** I 停在原处时的竖条（屏幕坐标）：狗绳从这里接过去 */
export const iRest = () => {
  const L = layout(TITLE, TS, 62, 900, -0.01);
  const left = X1 - L.width / 2 + L.xs[I_INDEX];
  return {x0: left + 0.04 * TS, x1: left + 0.223 * TS, y0: TY - 0.688 * TS, y1: TY};
};

const FORCE: ForceSpec[] = [
  {off: -330, w: 170, fill: C.orange},
  {off: -150, w: 56, fill: C.ink},
  {off: 30, w: 130, fill: C.cobalt},
  {off: 190, w: 44, fill: C.ink, len: 0.9},
  {off: 330, w: 150, fill: C.orange, len: 0.8},
];

const Title: React.FC<{t: number; k: number}> = ({t, k}) => (
  <>
    {[...TITLE].map((ch, i) => {
      if (i === I_INDEX && t >= LAUNCH && k > 0) return null; // I 不动了，不画它的残影
      if (i === I_INDEX && t >= I_HANDOFF) return null; // 交给下一章：I 变成狗绳（walk.tsx）
      const ti = i === I_INDEX && t >= LAUNCH ? LAUNCH : t;
      const p = letterAt(ti, i);
      return <Word key={i} text={ch} x={p.x} y={TY} size={TS} wdth={p.wd} lean={p.lean} fill={k ? C.orange : C.ink} />;
    })}
  </>
);

/** 未来主义：同一条轨迹晚 6 帧（中文没有字宽轴：速度只让它横向拉宽，停下回到正常字宽） */
const zhX = (t: number) => titleX(t - 6);
const ZH: React.FC<{t: number; k: number}> = ({t, k}) => {
  const v = Math.abs(vel(zhX, t));
  const sx = 1 + 0.32 * Math.min(1, v / 40);
  return (
    <Txt x={zhX(t)} y={700} size={132} anchor="middle" fill={k ? C.cobalt : C.ink} ls={0.04} sx={sx} lean={leanOf(zhX, t) * 0.8}>
      未来主义
    </Txt>
  );
};

export const Opening: React.FC<{t: number; cam?: string}> = ({t, cam}) => {
  const v = titleV(t);
  const wd = wdthOf(v);
  const L = layout(TITLE, TS, wd, 900, -0.01);
  const dy = thump(t, T1, 12, 14);
  const vz = vel(zhX, t);
  return (
    <g transform={`${cam ?? ''} translate(0 ${dy.toFixed(2)})`}>
      <ForceLines front={{x: titleX(t) + L.width / 2, y: TY - 86}} dir={0} v={v} spec={FORCE} spread={1} gap={20} />
      <ForceLines front={{x: zhX(t) + 300, y: 652}} dir={0} v={vz} spec={[{off: -60, w: 40, fill: C.cobalt}, {off: 70, w: 30, fill: C.ink}]} spread={1.4} gap={30} kLen={18} />
      <Echoes t={t} state={(u) => [zhX(u)]} render={(u, k) => <ZH t={u} k={k} />} />
      <Echoes t={t} state={(u) => [titleX(u)]} render={(u, k) => <Title t={u} k={k} />} />
      <Rise t={t} at={44} box={[0, 742, W, 70]} out={LAUNCH + 4}>
        <Txt x={960} y={792} size={46} anchor="middle">
          动的东西，留下它刚才的样子。
        </Txt>
      </Rise>
      <Rise t={t} at={52} box={[0, 818, W, 50]} out={LAUNCH + 6}>
        <Txt x={960} y={852} size={24} fam="mono" w={700} anchor="middle" fill={C.mute} ls={0.08}>
          1909.2.20 · LE FIGARO · MANIFESTE DU FUTURISME
        </Txt>
      </Rise>
    </g>
  );
};

export const openProbe = (t: number) => {
  const v = titleV(t);
  return {x: titleX(t), v, wdth: wdthOf(v), lean: leanOf(titleX, t), n: echoCount(t, (u) => [titleX(u)]), acc: acc(titleX, t)};
};
