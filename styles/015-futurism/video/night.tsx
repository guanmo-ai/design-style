/**
 * 开场（−50—108）· 宣言 · 马里内蒂《未来主义宣言》1909：“一辆吼叫的汽车……比萨莫色雷斯的胜利女神更美。”
 *
 * 夜路（光影：车头灯、路灯、远处的窗）。片尾最后 50 帧（t − 1200）是这辆车从远处冲过来，所以第 0 帧就是最有冲击力的那一刻：
 *   −50—0  红色赛车从灭点冲过来（残影是“刚才更远的自己”，一层比一层小，拖回灭点）
 *   0      车头撕开横幅 FUTURISM（第 0 帧已经撞进去 0.6 帧）；0—8 慢动作（0.3×），8—24 追回（1.31×）
 *   0—15   急刹（匀减速，残影一层层收回车头），车头往下一点、弹回
 *   0—24   横幅上的字母被惯性甩向镜头，一个接一个“贴”在镜头前（最后一个落在 f25 = 第 1 拍）
 *   25     最后一个字母贴上镜头，车头灯亮一下，音乐进来；标题停住压窄（wdth 62）
 *   56—90  赛车起势、加速冲向镜头：车越来越大，字被它带起的风吹走；车身盖满画面
 *   90—108 盖满画面的橙色车身甩出左边，露出下一章（人行道）
 */
import React from 'react';
import {C} from '../tokens';
import {H, Rise, Txt, W, Word, layout, mixHex, wdthOf} from './kit';
import {clamp, ease, land, lerp, prog, springOf, vel} from './motion';

const VPX = 960;
const VPY = 520;
const F = 820;
const CAMH = 0.9; // 低机位：车更有气势
const f1 = (v: number) => v.toFixed(1);

/** 剧情时间：0—8 慢动作，8—24 追回，之后与画面时间相同 */
export const sceneT = (f: number) => {
  if (f <= 0) return f + 0.6; // 第 0 帧时车头已经撞进横幅 0.6 帧：封面上字母正要飞起来
  if (f <= 8) return 0.6 + 0.3 * f;
  if (f <= 24) return 3 + (21 / 16) * (f - 8);
  return f;
};

/* ───────── 镜头：f25 后慢慢往前推 ───────── */
const camZ = (t: number) => 0.7 * ease.inOut(prog(t, 25, 70));
const proj = (t: number, X: number, Y: number, Z: number) => {
  const z = Math.max(0.05, Z - camZ(t));
  const s = F / z;
  return {x: VPX + X * s, y: VPY + (CAMH - Y) * s, s};
};

/* ───────── 赛车 ───────── */
const ZB = 5.5; // 横幅的位置
const ZSTOP = 2.6;
const CARX = 0.25;
/** 车头的 Z（剧情时间 s） */
export const carZ = (s: number) => {
  if (s <= 0) return ZB - 1.0 * s; // 1 单位 / 帧 冲过来
  const T = (2 * (ZB - ZSTOP)) / 1.0; // 刹车用时（匀减速，从 1 单位 / 帧 到停）
  if (s < T) return ZB - (s - (0.5 * s * s) / T);
  if (s < 56) return ZSTOP;
  if (s < 60) return ZSTOP + 0.12 * ease.sine(prog(s, 56, 4)); // 起势：往后一坐
  return Math.max(0.12, ZSTOP + 0.12 - 0.5 * 0.0072 * (s - 60) * (s - 60)); // 匀加速冲向镜头
};
/** 车头的俯仰（度）：刹车往下栽、起步往后仰，过弹簧 */
const pitchOf = (t: number) => springOf((u) => clamp(-(carZ(sceneT(u + 0.5)) - 2 * carZ(sceneT(u)) + carZ(sceneT(u - 0.5))) * 40, -5, 5), t, 0.45, 0.55, 30, 0.5);

/** f25 最后一个字母贴上镜头时，车头灯“亮”一下：光晕放大再收回 */
const flareAt = (t: number) => (t >= 25 && t < 50 ? Math.exp(-(t - 25) / 5) : 0);
const Car: React.FC<{t: number; s: number; k: number}> = ({t, s, k}) => {
  const Z = carZ(s);
  if (Z < 0.5) return null;
  const P = (X: number, Y: number, dz = 0) => proj(t, CARX + X, Y, Z + dz);
  const pc = pitchOf(t);
  const body = k ? C.cobalt : C.orange;
  const ink = k ? C.cobalt : C.ink;
  const o = P(0, 0.9);
  const tr = `rotate(${f1(pc * 0.4)} ${f1(o.x)} ${f1(P(0, 0).y)})`;
  const rect = (X0: number, Y0: number, X1: number, Y1: number, dz = 0) => {
    const a = P(X0, Y1, dz);
    const b = P(X1, Y0, dz);
    return {x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y};
  };
  const wheel = (X: number, dz: number) => {
    const r = rect(X - 0.12, 0, X + 0.12, 0.92, dz);
    return <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={r.w * 0.45} fill={ink} />;
  };
  const rad = rect(-0.34, 0.48, 0.34, 1.5);
  const gr = rect(-0.24, 0.62, 0.24, 1.36);
  const head = P(0.02, 1.86, 1.5);
  const hl = (X: number) => P(X, 1.04);
  return (
    <g transform={tr}>
      {wheel(-0.8, 2.4)}
      {wheel(0.8, 2.4)}
      {/* 车身：从车头往后收窄 */}
      <polygon points={[P(-0.55, 1.3, 0.2), P(0.55, 1.3, 0.2), P(0.75, 0.55, 2.6), P(-0.75, 0.55, 2.6)].map((p) => `${f1(p.x)},${f1(p.y)}`).join(' ')} fill={body} />
      {/* 车手：头、风镜、往后飘的围巾 */}
      {!k && (
        <g>
          <circle cx={f1(head.x)} cy={f1(head.y)} r={f1(0.26 * head.s)} fill={C.ink} />
          <circle cx={f1(head.x - 0.1 * head.s)} cy={f1(head.y - 0.02 * head.s)} r={f1(0.07 * head.s)} fill={C.paperHi} />
          <circle cx={f1(head.x + 0.1 * head.s)} cy={f1(head.y - 0.02 * head.s)} r={f1(0.07 * head.s)} fill={C.paperHi} />
        </g>
      )}
      <rect x={P(-0.9, 0.46).x} y={P(0, 0.46).y} width={P(0.9, 0.46).x - P(-0.9, 0.46).x} height={0.07 * o.s} fill={ink} />
      {wheel(-0.78, 0)}
      {wheel(0.78, 0)}
      <rect x={rad.x} y={rad.y} width={rad.w} height={rad.h} rx={rad.w * 0.28} fill={body} />
      {!k && (
        <g>
          <rect x={gr.x} y={gr.y} width={gr.w} height={gr.h} rx={gr.w * 0.12} fill={C.silver} />
          {[1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={gr.x + (gr.w * i) / 6 - 0.008 * o.s} y={gr.y + 0.04 * o.s} width={0.016 * o.s} height={gr.h - 0.08 * o.s} fill={C.ink} opacity={0.55} />
          ))}
          <circle cx={f1(o.x)} cy={f1(P(0, 1.0).y)} r={f1(0.13 * o.s)} fill={C.paperHi} />
          <text x={f1(o.x)} y={f1(P(0, 1.0).y + 0.05 * o.s)} fontFamily="'Archivo'" fontWeight={900} fontSize={f1(0.15 * o.s)} textAnchor="middle" fill={C.ink}>
            15
          </text>
        </g>
      )}
      {[-0.62, 0.62].map((X) => {
        const h = hl(X);
        const r = 0.17 * h.s;
        return (
          <g key={X}>
            <rect x={f1(h.x - 0.02 * h.s)} y={f1(h.y)} width={f1(0.04 * h.s)} height={f1(0.5 * h.s)} fill={ink} />
            {!k && <circle cx={f1(h.x)} cy={f1(h.y)} r={f1(r * (3.6 + 5 * flareAt(t)))} fill={C.paperHi} opacity={0.07 + 0.06 * flareAt(t)} />}
            {!k && <circle cx={f1(h.x)} cy={f1(h.y)} r={f1(r * (2.1 + 2 * flareAt(t)))} fill={C.paperHi} opacity={0.14 + 0.1 * flareAt(t)} />}
            <circle cx={f1(h.x)} cy={f1(h.y)} r={f1(r)} fill={k ? C.cobalt : C.paperHi} stroke={ink} strokeWidth={f1(0.035 * h.s)} />
          </g>
        );
      })}
    </g>
  );
};

/* ───────── 路、路灯、远处的城 ───────── */
const LAMPS = Array.from({length: 22}, (_, i) => ({Z: 3 + i * 9, X: i % 2 ? 4.9 : -4.9}));
const SKY = Array.from({length: 30}, (_, i) => {
  const n = (i * 7919 + 17) % 101;
  return {x: -600 + i * 110 + (n % 40), w: 70 + (n % 60), h: 40 + ((n * 3) % 120), lit: n % 3};
});
const Road: React.FC<{t: number}> = ({t}) => {
  const q = (X: number, Y: number, Z: number) => proj(t, X, Y, Z);
  const poly = (pts: {x: number; y: number}[]) => pts.map((p) => `${f1(p.x)},${f1(p.y)}`).join(' ');
  const out: React.ReactNode[] = [];
  out.push(<rect key="sky" width={W} height={VPY + 1} fill={C.ink} />);
  out.push(<rect key="dusk" y={VPY - 120} width={W} height={121} fill={mixHex(C.ink, C.cobalt, 0.22)} />);
  out.push(<rect key="dusk2" y={VPY - 40} width={W} height={41} fill={mixHex(C.ink, C.cobalt, 0.4)} />);
  SKY.forEach((b, i) => {
    const sx = VPX + (b.x - VPX) * 0.8;
    out.push(<rect key={`b${i}`} x={sx} y={VPY - b.h * 0.6} width={b.w * 0.6} height={b.h * 0.6} fill={mixHex(C.ink, C.cobalt, 0.12)} />);
    if (b.lit) out.push(<rect key={`w${i}`} x={sx + 8} y={VPY - b.h * 0.6 + 8} width={4} height={4} fill={C.orange} opacity={0.8} />);
  });
  out.push(<rect key="ground" y={VPY} width={W} height={H - VPY} fill={mixHex(C.ink, C.silver, 0.06)} />);
  out.push(<polygon key="road" points={poly([q(-3.3, 0, 0.3), q(3.3, 0, 0.3), q(3.3, 0, 400), q(-3.3, 0, 400)])} fill={mixHex(C.ink, C.cobalt, 0.28)} />);
  for (const X of [-3.05, 2.95]) out.push(<polygon key={`e${X}`} points={poly([q(X, 0, 0.3), q(X + 0.1, 0, 0.3), q(X + 0.1, 0, 400), q(X, 0, 400)])} fill={C.paper} opacity={0.75} />);
  for (let z = 1; z < 200; z += 6) out.push(<polygon key={`d${z}`} points={poly([q(-0.06, 0, z), q(0.06, 0, z), q(0.06, 0, z + 2.6), q(-0.06, 0, z + 2.6)])} fill={C.orange} opacity={0.9} />);
  // 路灯：先画远的
  [...LAMPS].reverse().forEach((l, i) => {
    if (l.Z - camZ(t) < 0.6) return;
    const base = q(l.X, 0, l.Z);
    const top = q(l.X, 4.6, l.Z);
    const head = q(l.X * 0.84, 4.5, l.Z);
    const pool = [q(l.X * 0.8 - 2.2, 0, l.Z), q(l.X * 0.8 + 2.2, 0, l.Z)];
    out.push(
      <g key={`l${i}`}>
        <ellipse cx={f1((pool[0].x + pool[1].x) / 2)} cy={f1(base.y)} rx={f1((pool[1].x - pool[0].x) / 2)} ry={f1(Math.max(2, base.s * 0.5))} fill={C.paper} opacity={0.08} />
        <rect x={f1(top.x - 0.07 * top.s)} y={f1(top.y)} width={f1(0.14 * top.s)} height={f1(base.y - top.y)} fill={mixHex(C.ink, C.silver, 0.25)} />
        <circle cx={f1(head.x)} cy={f1(head.y)} r={f1(0.9 * head.s)} fill={C.paperHi} opacity={0.06} />
        <circle cx={f1(head.x)} cy={f1(head.y)} r={f1(0.2 * head.s)} fill={C.paperHi} />
      </g>,
    );
  });
  return <>{out}</>;
};

/* ───────── 横幅与被甩出去的字母 ───────── */
const TITLE = 'FUTURISM';
const BANNER_SIZE = (0.75 * F) / ZB / 0.686; // 横幅上的字：大写高 0.75 单位
const TS = 230;
const TY = 290;
const LAND = (i: number) => 11.5 + 1.65 * i; // 剧情时间：第 i 个字母贴到镜头前
const bannerLayout = layout(TITLE, BANNER_SIZE, 92, 900, 0.02);
const titleLayout = layout(TITLE, TS, 62, 900, -0.01);
const SPIN = [-38, 24, -16, 30, -26, 18, -34, 22];
/** 第 i 个字母在剧情时间 s 的屏幕位置、字号、旋转 */
const letterAt = (t: number, s: number, i: number) => {
  const b = proj(0, 0, 2.95, ZB);
  const bx = b.x - bannerLayout.width / 2 + bannerLayout.xs[i];
  const by = b.y + 0.62 * BANNER_SIZE;
  const tx = VPX - titleLayout.width / 2 + titleLayout.xs[i];
  if (s <= 0) return {x: bx, y: by, size: BANNER_SIZE, rot: 0, flip: 1, sy: 1, wd: 92};
  const u = clamp(s / LAND(i));
  const e = ease.out5(u);
  const bump = Math.sin(Math.PI * u); // 飞到最靠近镜头的那一刻（中途最大）
  // 往两边散开、往上抛，离镜头越近越大（最大约 2.2 倍）
  const spread = (i - 3.5) * 120 * bump;
  const size = lerp(BANNER_SIZE, TS, e) * (1 + 1.2 * bump);
  const v = (1 - u) * 80;
  const landed = s > LAND(i);
  const after = landed ? land(s, LAND(i), 12) : 0;
  // 翻滚：绕竖轴翻一圈（scaleX = cos），落地前翻正
  const ramp = clamp(u / 0.14); // 刚离开横幅时还没开始翻（封面上的字读得出来）
  const flip = Math.cos(Math.PI * (1 - e) * (1 - u) * ramp * (i % 2 ? 1 : -1));
  return {
    x: lerp(bx, tx, e) + spread,
    y: lerp(by, TY, e) + 150 * bump, // 朝镜头飞：往画面下方、往大里走
    size,
    rot: SPIN[i] * 1.6 * (1 - e) * ramp,
    flip: Math.abs(flip) < 0.08 ? 0.08 * Math.sign(flip || 1) : flip,
    sy: landed ? 1 - 0.12 * (1 - after) : 1, // 贴上镜头那一下压扁一点
    wd: wdthOf(v),
  };
};
/** f66 起：赛车冲过来带起的风把字吹走（从中间往两边） */
const blow = (t: number, i: number) => {
  const t0 = 66 + Math.abs(i - 3.5) * 1.6;
  if (t < t0) return {dx: 0, dy: 0, rot: 0};
  const d = t - t0;
  const dir = i < 4 ? -1 : 1;
  return {dx: dir * 1.4 * d * d, dy: -0.9 * d * d, rot: dir * 1.2 * d * d};
};
const Letters: React.FC<{t: number; s: number; k: number}> = ({t, s, k}) => (
  <>
    {[...TITLE].map((ch, i) => {
      if (s <= 0) return null;
      const p = letterAt(t, s, i);
      const b = blow(t, i);
      const w = blow(t + 0.5, i);
      const v = Math.hypot(w.dx - b.dx, w.dy - b.dy) * 2;
      return (
        <g key={i} transform={`translate(${f1(p.x + b.dx)} ${f1(p.y + b.dy)}) rotate(${f1(p.rot + b.rot)}) scale(${p.flip.toFixed(3)} ${p.sy.toFixed(3)})`}>
          <Word text={ch} x={0} y={0} size={p.size} wdth={t > 66 ? wdthOf(v) : p.wd} fill={k ? C.orange : mixHex(C.ink, C.paperHi, clamp(s / (LAND(i) * 0.22)))} />
        </g>
      );
    })}
  </>
);
const Banner: React.FC<{t: number; s: number}> = ({t, s}) => {
  const L = proj(t, -4.6, 3.1, ZB);
  const R = proj(t, 4.6, 3.1, ZB);
  const bot = proj(t, 0, 1.85, ZB);
  const pl = proj(t, -4.7, 0, ZB);
  // 撕开的两半往下甩，再掉出画面
  const tear = s <= 0 ? 0 : ease.in(clamp(s / 7));
  const drop = s > 6 ? 0.5 * 5 * (s - 6) * (s - 6) : 0;
  const half = (side: number) => {
    const ang = side * -88 * tear;
    const px = side < 0 ? L.x : R.x;
    const w = (R.x - L.x) / 2;
    return (
      <g key={side} transform={`translate(0 ${f1(drop)}) rotate(${f1(ang)} ${f1(px)} ${f1(L.y)})`}>
        <rect x={side < 0 ? L.x : R.x - w} y={L.y} width={w} height={bot.y - L.y} fill={C.paper} />
        <rect x={side < 0 ? L.x : R.x - w} y={L.y} width={w} height={0.08 * L.s} fill={C.orange} />
        <rect x={side < 0 ? L.x : R.x - w} y={bot.y - 0.08 * L.s} width={w} height={0.08 * L.s} fill={C.orange} />
      </g>
    );
  };
  return (
    <g>
      <rect x={pl.x - 0.06 * pl.s} y={L.y} width={0.12 * pl.s} height={pl.y - L.y} fill={mixHex(C.ink, C.silver, 0.35)} />
      <rect x={proj(t, 4.7, 0, ZB).x - 0.06 * pl.s} y={L.y} width={0.12 * pl.s} height={pl.y - L.y} fill={mixHex(C.ink, C.silver, 0.35)} />
      {half(-1)}
      {half(1)}
      {s <= 0 &&
        [...TITLE].map((ch, i) => {
          const p = letterAt(t, 0, i);
          return <Word key={i} text={ch} x={p.x} y={p.y} size={BANNER_SIZE} wdth={92} fill={C.ink} />;
        })}
    </g>
  );
};

/* ───────── 合起来 ───────── */
export const OPEN_END = 108;
/** 车身盖满画面之后，这块橙色往左甩出去（下一章从右边进来） */
export const plateX = (t: number) => (t < 92 ? 0 : -0.5 * 38 * (t - 92) * (t - 92));
export const Night: React.FC<{t: number}> = ({t}) => {
  const s = sceneT(t);
  const Z = carZ(s);
  const cover = Z < 0.62 || t >= 86;
  // 残影：在剧情时间里取样（慢动作时拖得一样长，像定格的照片）
  const echo = (render: (u: number, k: number) => React.ReactNode, same: (u: number) => number[]) => {
    const out: React.ReactNode[] = [];
    const s0 = same(s);
    for (let k = 6; k >= 1; k--) {
      const u = s - 3 * k;
      const v = same(u);
      if (Math.max(...v.map((x, i) => Math.abs(x - s0[i]))) < 0.6) continue;
      out.push(
        <g key={k} opacity={Math.pow(0.6, k)}>
          {render(u, k)}
        </g>,
      );
    }
    out.push(<g key={0}>{render(s, 0)}</g>);
    return out;
  };
  const tx = plateX(t);
  return (
    <g>
      {!cover ? (
        <g transform={`translate(${f1(Math.min(0, tx) * 0.35)} 0)`}>
          <Road t={t} />
          {t < 30 && <Banner t={t} s={s} />}
          {echo((u, k) => <Car t={t} s={u} k={k} />, (u) => [proj(t, 0, 1, carZ(u)).s])}
          {/* 车头灯打在路上的两道光 */}
          {Z > 0.6 && (
            <polygon
              points={[proj(t, CARX - 0.62, 1.0, Z), proj(t, CARX + 0.62, 1.0, Z), proj(t, CARX + 1.8, 0, Math.max(0.4, Z - 5)), proj(t, CARX - 1.8, 0, Math.max(0.4, Z - 5))].map((p) => `${f1(p.x)},${f1(p.y)}`).join(' ')}
              fill={C.paperHi}
              opacity={0.07}
            />
          )}
          {t < 92 && echo((u, k) => <Letters t={t - (s - u)} s={u} k={k} />, (u) => [...TITLE].map((_, i) => letterAt(t, u, i).x + blow(t - (s - u), i).dx))}
          <Rise t={t} at={38} box={[110, 712, 820, 150]} out={82} dOut={8}>
            <Txt x={120} y={830} size={124} fill={C.paperHi} ls={0.04}>
              未来主义
            </Txt>
          </Rise>
          <Rise t={t} at={46} box={[110, 860, 1000, 60]} out={84} dOut={8}>
            <Txt x={124} y={902} size={34} w={700} fill={C.paperHi}>
              动的东西，留下它刚才的样子。
            </Txt>
          </Rise>
        </g>
      ) : null}
      {cover && tx > -W - 400 && (
        <g>
          {/* 车身盖满画面 → 往左甩出去：橙色板的残影 = 一道道往右拖的色带 */}
          {[6, 5, 4, 3, 2, 1].map((k) => {
            const x = plateX(t - 3 * k);
            return x === tx ? null : <rect key={k} x={f1(x)} y={0} width={W} height={H} fill={C.orange} opacity={Math.pow(0.6, k)} />;
          })}
          <rect x={f1(tx)} y={0} width={W} height={H} fill={C.orange} />
        </g>
      )}

    </g>
  );
};

export const nightProbe = (t: number) => {
  if (t < 66 || t > 90) return null;
  const v = Math.abs(vel((u) => blow(u, 0).dx, t));
  return {v, wdth: wdthOf(v), n: t > 66 ? 6 : 0};
};
export const nightSpeed = (t: number) => {
  const s = sceneT(t);
  if (t >= 86) return Math.abs(plateX(t + 0.5) - plateX(t - 0.5));
  const z0 = carZ(s - 0.5);
  const z1 = carZ(s + 0.5);
  // 封面那几帧（−2—3）不做运动模糊：第 0 帧要清楚
  if (t > -2 && t < 3) return 0;
  return clamp(Math.abs(F / Math.max(0.3, z1) - F / Math.max(0.3, z0)) * 0.8, 0, 60) + (t > 0 && t < 25 ? 30 : 0);
};
