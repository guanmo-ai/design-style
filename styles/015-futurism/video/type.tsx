/**
 * 03 文学 · 马里内蒂《Zang Tumb Tuuum》1914  +  04 建筑 · 圣伊利亚《新城市》1914（300—501）
 *
 * 一页书 = 一座城（同一个世界，地面 = TUUUM 的基线 y = 1000）：
 *   300—312  上一章冲向镜头的 TUMB 从 90 倍缩回书页（纵深的残影：越早越大，停下时收拢）
 *   313—325  ZANG 像子弹从左边打进来，匀减速砸停在 f325（第 13 拍）；橙色、最大
 *   331 / 337  TUMB 133 · tumb 89 从上面斜着落下：每级 ÷ 1.5（200 → 133 → 89）
 *   350—376  TU 落下，M 往右冲出去、一路刹车：每个 U 是 M 经过时留下的——U 的字宽 = M 当时的速度，
 *            所以 TUUUUUUM 越往后越窄：这个词把自己的减速记了下来
 *   372—388  其他字往上飞走；TUUUUUUM 停下压窄，一个字母接一个字母往上长高 → 塔
 *   404—442  退台块从天上落下、外挂电梯井长高、天桥横着滑进来（一块块搭）
 *   444—     电梯 1 起步上冲、到顶刹停（残影拉开 → 收拢），镜头跟上去；电梯 2 往下冲进地下的黑里，镜头跟下去 → 下一章
 */
import React from 'react';
import {C} from '../tokens';
import {Echoes, ForceLines, Rise, Txt, Word, advOf, camT, echoCount, mixHex, wdthOf, zoomLerp} from './kit';
import {anticLand, clamp, ease, follow, kin, leanOf, lerp, path1, prog, thump, vel} from './motion';

const GY = 1000; // 地面 = TUUUM 的基线

/* ───────── 镜头 ───────── */
type Cam = {cx: number; cy: number; z: number};
const CITY: Cam = {cx: 1080, cy: 600, z: 0.78};
export const typeCam = (t: number): Cam => {
  if (t < 372) return {cx: 960, cy: 540, z: 1};
  if (t < 444) {
    const e = ease.inOut(prog(t, 372, 34));
    return {cx: lerp(960, CITY.cx, e), cy: lerp(540, CITY.cy, e), z: zoomLerp(1, CITY.z, e)};
  }
  // 跟着电梯：先上（电梯 1），再下（电梯 2）
  const up = ease.inOut(prog(t, 444, 22));
  const down = ease.inOut(prog(t, 462, 22));
  const y1 = follow((u) => cabY(0, u), t, 5, 1);
  const y2 = follow((u) => cabY(1, u), t, 4, 1);
  const cy = lerp(lerp(CITY.cy, y1 + 120, up), y2, down);
  const cx = lerp(lerp(CITY.cx, SHAFTS[0].x, up * 0.5), SHAFTS[1].x, down * 0.7);
  return {cx, cy, z: zoomLerp(CITY.z, 1.45, Math.max(up, down))};
};
const camStr = (c: Cam, dy = 0) => camT(c.cx, c.cy, c.z, 0, 0, dy);
const shake = (t: number) => thump(t, 325, 14, 14) + thump(t, 410, 5, 12) + thump(t, 427, 5, 12);

/* ───────── 书页上的字 ───────── */
type Fly = {text: string; size: number; rot: number; x: number; y: number; at: number; d: number; from: [number, number]; fill: string};
const ZANG: Fly = {text: 'ZANG', size: 290, rot: -9, x: 100, y: 430, at: 325, d: 13, from: [-1150, 560], fill: C.orange};
const TUMB_A = {size: 200, rot: -4, x: 520, y: 650};
const FALLS: Fly[] = [
  {text: 'TUMB', size: 133, rot: 5, x: 1110, y: 770, at: 331, d: 8, from: [1500, -150], fill: C.ink},
  {text: 'tumb', size: 89, rot: -3, x: 1450, y: 850, at: 337, d: 7, from: [1760, -100], fill: C.ink},
];
/** 匀减速到停：起点 from、终点 (x, y)、用时 d 帧（Hermite 两端速度 2D/d → 0 正好是匀减速） */
const flyPos = (w: Fly, t: number) => {
  const a = w.at - w.d;
  const k = (p0: number, p1: number) => path1(t, [[a, p0, (2 * (p1 - p0)) / w.d], [w.at, p1, 0]]);
  return {x: k(w.from[0], w.x), y: k(w.from[1], w.y)};
};
/** 372 起：书页上的字往上飞走（匀加速，残影越拉越开） */
const blast = (t: number, i: number) => {
  const t0 = 374 + i * 2;
  if (t < t0) return {dx: 0, dy: 0};
  const d = t - t0;
  return {dx: -1.0 * d * d * (i % 2 ? -0.4 : 1), dy: -3.2 * d * d};
};
const FlyWord: React.FC<{w: Fly; t: number; k: number; i: number}> = ({w, t, k, i}) => {
  if (t < w.at - w.d) return null;
  const p = flyPos(w, t);
  const b = blast(t, i);
  const v = Math.hypot(vel((u) => flyPos(w, u).x + blast(u, i).dx, t), vel((u) => flyPos(w, u).y + blast(u, i).dy, t));
  return <Word text={w.text} x={p.x + b.dx} y={p.y + b.dy} size={w.size} rot={w.rot} wdth={wdthOf(v)} fill={k ? (w.fill === C.orange ? C.cobalt : C.orange) : w.fill} />;
};
const flyState = (w: Fly, i: number) => (u: number) => {
  const p = flyPos(w, u);
  const b = blast(u, i);
  return [p.x + b.dx, p.y + b.dy];
};

/** 接力来的 TUMB：从 90 倍缩回原位（以 T 的竖画中心为原点） */
/** 上一章那个 TUMB 的白色竖画盖满画面 = 这一页的纸；从 4 倍缩回原位 */
const tumbZoom = (t: number) => zoomLerp(4, 1, ease.out(prog(t, 300, 12)));
const TumbA: React.FC<{t: number; k: number}> = ({t, k}) => {
  const z = tumbZoom(t);
  if (k && z > 2.5) return null; // 太大的残影只会把画面糊成一片橙
  const b = blast(t, 1);
  const tw = (advOf('T', 62) / 2) * TUMB_A.size;
  const cx = TUMB_A.x + tw;
  const cy = TUMB_A.y - 0.343 * TUMB_A.size;
  return (
    <g transform={`translate(${(cx + b.dx).toFixed(1)} ${(cy + b.dy).toFixed(1)}) rotate(${TUMB_A.rot}) scale(${z.toFixed(4)}) translate(${-cx} ${-cy})`}>
      <Word text="TUMB" x={TUMB_A.x} y={TUMB_A.y} size={TUMB_A.size} wdth={62} fill={k ? C.orange : C.ink} />
    </g>
  );
};

/* ───────── TUUUUUUM：M 冲出去，U 是它留下的 ───────── */
const TS = 150;
const TU_X = 110;
const TU_AT = 348;
const M_GO = TU_AT;
const M_STOP = 378;
/** TUM 三个字母一起以 100 px/帧 飞进来；f348 T 和 U 撞停，M 带着同样的速度继续往前冲 */
const TUM_V = 100;
const tuX = (t: number) => (t < TU_AT ? TU_X + TUM_V * (t - TU_AT) : TU_X);
const U0 = TU_X + (advOf('T', 62) + advOf('U', 62) - 0.02) * TS;
const M_END = 1500;
/**
 * M 的左边：像受阻力一样指数减速 x = U0 + D(1 − e^(−t/τ))，速度和剩下的距离成正比——
 * 所以 M 经过的每个 U，字宽从 125 一路线性地缩到 62（最后几个挤成窄窄的一条）
 */
const M_V0 = TUM_V;
const M_TAU = (M_END - U0) / M_V0;
export const mX = (t: number) => {
  if (t < M_GO) return U0 + tuX(t) - TU_X;
  return U0 + (M_END - U0) * (1 - Math.exp(-(t - M_GO) / M_TAU));
};
/** U 的位置与字宽：M 经过 x 时的速度决定这个 U 有多宽 */
const US: {x: number; wd: number; t: number}[] = (() => {
  const out: {x: number; wd: number; t: number}[] = [];
  let x = U0;
  let t = M_GO;
  for (;;) {
    while (t < M_GO + 8 * M_TAU && mX(t) < x) t += 0.02;
    const wd = wdthOf(vel(mX, Math.max(t, M_GO + 0.5)));
    const w = (advOf('U', wd) - 0.01) * TS;
    if (x + w > M_END + 2) break;
    out.push({x, wd, t});
    x += w;
  }
  // 最后一段缝隙平均分给所有 U，M 正好接上
  const gap = M_END - x;
  return out.map((u, i) => ({...u, x: u.x + (gap * i) / out.length, wd: u.wd}));
})();

/** 372 起：字母往上长成塔（以基线为原点纵向拉伸），一个接一个 */
const TOWER = [5.2, 4.1, 6.3, 3.6, 5.6, 4.6, 7.0, 3.9, 6.0, 4.8, 5.4, 6.6];
const growOf = (i: number, t: number) => 1 + (TOWER[i % TOWER.length] - 1) * anticLand(t, 384 + i * 1.4, 5, 20, 0.05);
/** 长高的同时，电梯井的位置拉开一道缝（缝后面的字母整体右移） */
const GAPS = [2, 5, 8];
const GAP_W = 96;
const gapOpen = (t: number) => ease.inOut(prog(t, 388, 16));
const shiftOf = (i: number, t: number) => GAPS.filter((g) => i > g).length * GAP_W * gapOpen(t);

const Tuuum: React.FC<{t: number; k: number}> = ({t, k}) => {
  if (t < TU_AT - 22) return null;
  const ink = k ? C.orange : C.ink;
  const out: React.ReactNode[] = [];
  const tx = tuX(t);
  const tl = leanOf(tuX, t);
  out.push(<Word key="T" text="T" x={tx + shiftOf(0, t)} y={GY} size={TS} wdth={62} sy={growOf(0, t)} fill={ink} lean={tl} />);
  out.push(<Word key="U0" text="U" x={tx + (advOf('T', 62) - 0.01) * TS + shiftOf(1, t)} y={GY} size={TS} wdth={62} sy={growOf(1, t)} fill={ink} lean={tl} />);
  if (k === 0) {
    US.forEach((u, i) => {
      if (mX(t) < u.x + 20) return;
      const pop = clamp((t - u.t) / 3);
      out.push(<Word key={`u${i}`} text="U" x={u.x + shiftOf(i + 2, t)} y={GY} size={TS} wdth={u.wd} sy={(0.4 + 0.6 * pop) * growOf(i + 2, t)} fill={C.ink} />);
    });
  }
  const mx = mX(t);
  out.push(<Word key="M" text="M" x={mx + shiftOf(US.length + 2, t)} y={GY} size={TS} wdth={wdthOf(vel(mX, t))} sy={growOf(US.length + 2, t)} fill={ink} lean={leanOf(mX, t)} />);
  return <>{out}</>;
};

/** 每个字母（塔）的左右边界与高度（世界坐标），给城市搭建用 */
const towers = () => {
  const xs: {x0: number; x1: number; h: number}[] = [];
  const add = (x: number, ch: string, wd: number, i: number) => {
    const sh = GAPS.filter((g) => i > g).length * GAP_W;
    xs.push({x0: x + sh + 0.04 * TS, x1: x + sh + (advOf(ch, wd) - 0.04) * TS, h: 0.686 * TS * TOWER[i % TOWER.length]});
  };
  add(TU_X, 'T', 62, 0);
  add(TU_X + (advOf('T', 62) - 0.01) * TS, 'U', 62, 1);
  US.forEach((u, i) => add(u.x, 'U', u.wd, i + 2));
  add(M_END, 'M', 62, US.length + 2);
  return xs;
};
const TW = towers();

/* ───────── 城市的零件 ───────── */
// 退台块：落在几座塔顶上，一层比一层窄
const STEPS = [2, 4, 6, 8, 10].filter((i) => i < TW.length).flatMap((i, n) => {
  const tw = TW[i];
  const top = GY - tw.h;
  return [0, 1].map((j) => ({x0: tw.x0 - 30 + j * 28, x1: tw.x1 + 30 - j * 28, y1: top - j * 46, at: 404 + n * 5 + j * 2.5}));
});
const stepY = (s: (typeof STEPS)[number], t: number) => {
  // 自由落体：落到 at 时刻，下落 0.5·g·d²（残影：越往后越开 = 在加速）
  const d = s.at - t;
  return d > 0 ? -2.4 * d * d : 0;
};
// 电梯井：长在两座塔之间，比塔高
export const SHAFTS = GAPS.filter((i) => i + 1 < TW.length).map((i, n) => {
  const a = TW[i];
  const b = TW[i + 1];
  return {x: (a.x1 + b.x0) / 2, h: Math.max(a.h, b.h) + 220, at: 410 + n * 4, a, b};
});
const shaftH = (s: (typeof SHAFTS)[number], t: number) => s.h * clamp(anticLand(t, s.at, 4, 16, 0.06) * 1.0, 0, 1.06);
// 天桥：从井横着滑到塔
const BRIDGES = SHAFTS.flatMap((s, n) => [0.42, 0.72].map((f, j) => ({y: GY - Math.min(s.a.h, s.b.h) * f - 11, x0: s.a.x1 - 8, x1: s.b.x0 + 8, at: 428 + n * 3 + j * 2, dir: j ? 1 : -1})));
const bridgeDx = (b: (typeof BRIDGES)[number], t: number) => path1(t, [[b.at - 9, b.dir * 700, (-b.dir * 2 * 700) / 9], [b.at, 0, 0]]);
// 电梯：0 往上冲、1 往下冲进地下、2 往上到一半
const CABS: [number, number][][] = [
  [[444, -4.4], [456, 4.4], [468, 0]],
  [[462, 3.4], [502, 0]],
  [[450, -3.0], [460, 3.0], [470, 0]],
];
export const cabY = (i: number, t: number) => {
  const s = SHAFTS[i];
  if (i === 1) return kin(t, GY - s.h + 60, 0, CABS[1]);
  return kin(t, GY - 40, 0, CABS[i]);
};

// 背后的大体量：三座退台式的楼（铬银），从地面往上长出来
const MASS = [
  {x: 60, w: 520, h: 640, at: 398},
  {x: 760, w: 640, h: 820, at: 402},
  {x: 1560, w: 560, h: 700, at: 406},
];
const City: React.FC<{t: number; c: Cam; dy: number}> = ({t, c, dy}) => {
  if (t < 396) return null;
  return (
    <g transform={camStr(c, dy)}>
      {MASS.map((m, i) => {
        const g = clamp(anticLand(t, m.at, 4, 18, 0.05), 0, 1.06);
        if (g <= 0.001) return null;
        return (
          <g key={i} transform={`translate(0 ${GY}) scale(1 ${g.toFixed(4)}) translate(0 ${-GY})`} fill={mixHex(C.silver, C.paper, 0.15)}>
            {[0, 1, 2, 3].map((j) => (
              <rect key={j} x={m.x + j * 60} y={GY - m.h * 0.55 - j * m.h * 0.15} width={m.w - j * 120} height={m.h} />
            ))}
          </g>
        );
      })}
      {SHAFTS.map((s, i) => {
        const h = shaftH(s, t);
        if (h < 1) return null;
        return (
          <g key={i}>
            <rect x={s.x - 36} y={GY - h} width={72} height={h + 1400} fill={C.ink} />
            <rect x={s.x - 10} y={GY - h + 24} width={20} height={h + 1380} fill={mixHex(C.ink, C.silver, 0.5)} />
          </g>
        );
      })}
    </g>
  );
};

const Steps: React.FC<{t: number; c: Cam; dy: number; k: number}> = ({t, c, dy, k}) => (
  <g transform={camStr(c, dy)}>
    {STEPS.map((s, i) => (t < s.at - 12 ? null : <rect key={i} x={s.x0} y={s.y1 - 46 + stepY(s, t)} width={s.x1 - s.x0} height={46} fill={k ? C.orange : i % 3 === 1 ? C.cobalt : C.ink} />))}
  </g>
);
const Bridges: React.FC<{t: number; c: Cam; dy: number; k: number}> = ({t, c, dy, k}) => (
  <g transform={camStr(c, dy)}>
    {BRIDGES.map((b, i) => (t < b.at - 9 ? null : <rect key={i} x={b.x0 + bridgeDx(b, t)} y={b.y} width={b.x1 - b.x0} height={22} fill={k ? C.orange : C.ink} />))}
  </g>
);
const Cab: React.FC<{i: number; t: number; c: Cam; dy: number; k: number}> = ({i, t, c, dy, k}) => {
  const s = SHAFTS[i];
  if (t < s.at + 10) return null;
  return (
    <g transform={camStr(c, dy)}>
      <rect x={s.x - 46} y={cabY(i, t) - 66} width={92} height={132} fill={C.orange} />
      {!k && <rect x={s.x - 30} y={cabY(i, t) - 46} width={60} height={46} fill={C.paperHi} />}
    </g>
  );
};

export const Type: React.FC<{t: number}> = ({t}) => {
  const c = typeCam(t);
  const dy = shake(t);
  const v = vel(mX, t);
  return (
    <g>
      {/* 地下：黑（下一章的底色） */}
      <g transform={camStr(c, dy)}>
        <rect x={-4000} y={GY} width={12000} height={6000} fill={C.ink} />
      </g>
      <City t={t} c={c} dy={dy} />
      <Echoes t={t} state={(u) => STEPS.map((s) => stepY(s, u) * c.z)} render={(u, k) => <Steps t={u} c={c} dy={dy} k={k} />} />
      <Echoes t={t} state={(u) => BRIDGES.map((b) => bridgeDx(b, u) * c.z)} render={(u, k) => <Bridges t={u} c={c} dy={dy} k={k} />} />
      {[0, 1, 2].map((i) => (
        <Echoes key={i} t={t} state={(u) => [cabY(i, u) * c.z]} render={(u, k) => <Cab i={i} t={u} c={c} dy={dy} k={k} />} />
      ))}
      <g transform={camStr(c, dy)}>
        {t < M_STOP + 8 && <ForceLines front={{x: mX(t) + 120, y: GY - 52}} dir={0} v={v} spec={[{off: -40, w: 18, fill: C.orange}, {off: 30, w: 12, fill: C.ink}]} spread={0.6} gap={6} kLen={5} />}
        <Echoes t={t} state={(u) => [mX(u), tuX(u), growOf(3, u) * 50]} render={(u, k) => <Tuuum t={u} k={k} />} />
        {t < 400 && (
          <>
            {t < 330 && <ForceLines front={{x: flyPos(ZANG, t).x + 1100, y: ZANG.y - 200}} dir={-0.16} v={vel((u) => flyPos(ZANG, u).x, t)} spec={[{off: -200, w: 120, fill: C.orange}, {off: 0, w: 40, fill: C.ink}, {off: 160, w: 90, fill: C.cobalt}]} kLen={6} />}
            <Echoes t={t} state={flyState(ZANG, 0)} render={(u, k) => <FlyWord w={ZANG} t={u} k={k} i={0} />} />
            <Echoes t={t} state={(u) => [tumbZoom(u) * 10, blast(u, 1).dy]} render={(u, k) => <TumbA t={u} k={k} />} />
            {FALLS.map((w, i) => (
              <Echoes key={i} t={t} state={flyState(w, i + 2)} render={(u, k) => <FlyWord w={w} t={u} k={k} i={i + 2} />} />
            ))}
            <Rise t={t} at={340} box={[1000, 190, 840, 50]} out={372} dOut={8}>
              <Txt x={1820} y={228} size={28} fam="mono" w={700} anchor="end" ls={0.06}>
                ADRIANOPOLI · OTTOBRE 1912
              </Txt>
            </Rise>
            <Rise t={t} at={345} box={[1000, 244, 840, 46]} out={373} dOut={8}>
              <Txt x={1820} y={278} size={26} fam="mono" w={700} anchor="end" ls={0.06} fill={C.orange}>
                PAROLE IN LIBERTÀ
              </Txt>
            </Rise>
          </>
        )}
      </g>
    </g>
  );
};

/* ───────── 读数 ───────── */
const zangState = flyState(ZANG, 0);
export const typeProbe = (t: number) => {
  if (t < 330) {
    const v = Math.hypot(vel((u) => zangState(u)[0], t), vel((u) => zangState(u)[1], t));
    return {v, wdth: wdthOf(v), n: echoCount(t, zangState, 3)};
  }
  if (t < 440) {
    const v = vel(mX, t);
    return {v, wdth: wdthOf(v), n: echoCount(t, (u) => [mX(u)], 3)};
  }
  const i = t < 466 ? 0 : 1;
  const v = Math.abs(vel((u) => cabY(i, u), t));
  return {v, wdth: wdthOf(v), n: echoCount(t, (u) => [cabY(i, u)], 3)};
};
export const typeSpeed = (t: number) => {
  const p = typeProbe(t);
  const c1 = typeCam(t + 0.5);
  const c0 = typeCam(t - 0.5);
  return Math.max(Math.abs(p.v) * typeCam(t).z, Math.abs(c1.cy - c0.cy) * c1.z, t < 310 ? 30 : 0);
};
