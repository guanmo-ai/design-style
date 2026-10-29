/**
 * 开场 0—330（5.5 秒）：00 片头（Saul Bass《金臂人》，1955）→ 01 产品（George Nelson 球钟，1949）→ 片名
 *
 *   0—45     12 根彩色纸条按十六分音符从画外扎进番茄红的场（第 0 帧已落 5 根、正扎下第 6 根），每根落下都轻压一下、转角回正
 *   42—92    起势：纸条先往桌面一压，再一起提起来，绕着钟心旋进 12 根辐条；
 *            同时红场按对数缩成钟心——红边扫过的地方，彩色纸条翻成墨色。第 3 拍（90）全部落定
 *   80—146   11 颗球从画外抛进来，5 帧一颗：影子先离开球、落地时和球合上（影子 = 高度）
 *   118—190  一只剪纸的手把最后一颗红球送到 3 点，按下（第 5 拍）、松手、抽走；指针转两圈
 *   104—160  背景的太阳和腰果滑进来，重叠处叠印出橘色
 *   150—275  MID-CENTURY 一个个落下（三十二分音符），MODERN 十六分音符；O 最后、最高，第 9 拍落下
 *   285—330  6 点那颗球被碰掉，往下掉出画面 → 下一章
 *
 * 所有位置都是时间 t（帧，可为小数）的纯函数，运动模糊直接取过去的时刻。
 */
import React from 'react';
import {C} from '../tokens';
import {GEO} from './geo';
import {arc, bump, clamp, ease, lerp, near, prog, rnd, slap, spline, wobble} from './motion';
import {Body, bodyTf, multiply, Piece, Sheet, type Pose} from './paper';
import {AT, H, W} from './timeline';

export const CX = 600;
export const CY = 540;
const D2R = Math.PI / 180;

// ───────── 镜头（世界坐标的取景中心 + 缩放 + 转角）─────────
// 片头贴得很近（纸条又粗又大），纸条旋进钟里时一路拉远；手送球时推近；片名落下时拉开
const camX = spline([[-60, 620], [0, 615], [45, 605], [92, 700], [125, 760], [150, 742], [205, 960], [330, 960]]);
const camY = spline([[-60, 540], [92, 540], [205, 540], [330, 556]]);
const camS = spline([[-60, 1.8], [0, 1.74], [45, 1.64], [92, 1.1], [125, 1.06], [150, 1.12], [205, 1.0], [330, 1.0]]);
const camR = spline([[-60, -2], [0, -1.2], [45, -0.4], [92, 0], [330, 0]]);
/** 唯一的一次“咚”：O 落地时画面往下沉 7px 再回来（单向） */
const camBump = (t: number) => 7 * bump((t - AT.big) / 3.5);

export const cam = (t: number) => ({x: camX(t), y: camY(t) - camBump(t), s: camS(t), r: camR(t)});
export const camTransform = (t: number) => {
  const c = cam(t);
  return `translate(${W / 2} ${H / 2}) scale(${c.s.toFixed(5)}) rotate(${c.r.toFixed(4)}) translate(${(-c.x).toFixed(2)} ${(-c.y).toFixed(2)})`;
};
export const toScreen = (t: number, x: number, y: number) => {
  const c = cam(t);
  const a = c.r * D2R;
  const dx = x - c.x;
  const dy = y - c.y;
  return [W / 2 + c.s * (dx * Math.cos(a) - dy * Math.sin(a)), H / 2 + c.s * (dx * Math.sin(a) + dy * Math.cos(a))];
};

// ───────── 00 片头：12 根纸条（也就是之后的 12 根辐条）─────────
type From = 'L' | 'R' | 'T' | 'B';
// 片头取景（s≈1.7）只看得到世界里 x 35—1165、y 222—858 这一块：纸条都排在这里，横竖错落
const BASS: {x: number; y: number; a: number; from: From}[] = [
  {x: 360, y: 350, a: 0, from: 'L'},
  {x: 820, y: 280, a: 90, from: 'T'},
  {x: 560, y: 420, a: 0, from: 'R'},
  {x: 960, y: 470, a: 180, from: 'R'},
  {x: 250, y: 600, a: 90, from: 'B'},
  {x: 700, y: 600, a: -90, from: 'T'},
  {x: 480, y: 760, a: 0, from: 'L'},
  {x: 900, y: 740, a: 180, from: 'R'},
  {x: 1110, y: 300, a: 90, from: 'T'},
  {x: 400, y: 520, a: 90, from: 'T'},
  {x: 1080, y: 700, a: -90, from: 'B'},
  {x: 640, y: 850, a: 0, from: 'R'},
];
const DIR: Record<From, [number, number]> = {L: [-1, 0], R: [1, 0], T: [0, -1], B: [0, 1]};
export const spokeAng = (i: number) => i * 30 - 90;
export const tipOf = (i: number) => ({x: CX + GEO.spokeLen[i] * Math.cos(spokeAng(i) * D2R), y: CY + GEO.spokeLen[i] * Math.sin(spokeAng(i) * D2R)});
/** 第 i 根扎下的时刻：十六分音符（7.5 帧）一根；第 0 帧正好是第 6 根 */
export const landA = (i: number) => -37.5 + 7.5 * i;
const ENTRY = 12;
const g0 = (i: number) => AT.gather + 0.75 * i;
const g1 = (i: number) => AT.gather + 32 + 0.75 * i;
/** 纸条的颜色（红场里）；红场缩走之后一律是墨色的辐条 */
const BAR_COL = [C.paper, C.sun, C.blue, C.turq, C.ink, C.paper, C.sun, C.blue, C.turq, C.ink, C.paper, C.sun];

export const barPose = (i: number, t: number): Pose | null => {
  const b = BASS[i];
  const la = landA(i);
  if (t < la - ENTRY) return null;
  // 每一次落地留下的转角回正和轻压，叠加到之后所有时刻（不会在阶段切换时跳）
  const settleA = wobble(t, la, 2.2, 16, 7) + wobble(t, g1(i), 1.6, 14, 8);
  const sl = slap(t, la, 0.035, 3) * slap(t, g1(i), 0.03, 3.5);
  if (t < la) {
    const e = ease.out(prog(t, la - ENTRY, ENTRY));
    const d = DIR[b.from];
    return {x: b.x + d[0] * 1300 * (1 - e), y: b.y + d[1] * 1300 * (1 - e), a: b.a, h: 4 + 44 * (1 - e), s: 1};
  }
  if (t < g0(i) - 8) return {x: b.x, y: b.y, a: b.a + settleA, h: 4, s: sl};
  if (t < g0(i)) {
    // 起势：先往桌面压一下
    const u = prog(t, g0(i) - 8, 8);
    return {x: b.x, y: b.y, a: b.a + settleA, h: 4 - 2.2 * arc(u), s: sl * (1 - 0.012 * arc(u))};
  }
  // 绕钟心旋进去：极坐标插值（半径和方位角一起走），纸条自己的角度跟着同一圈转
  const u = prog(t, g0(i), g1(i) - g0(i));
  const e = ease.inOut(u);
  const r0 = Math.hypot(b.x - CX, b.y - CY);
  const p0 = Math.atan2(b.y - CY, b.x - CX) / D2R;
  const th = spokeAng(i);
  let dp = (((th - p0) % 360) + 360) % 360;
  if (dp > 240) dp -= 360;
  const da = near(th, b.a + dp) - b.a;
  const rS = GEO.spokeLen[i] / 2;
  const r = r0 + (rS - r0) * e;
  const p = (p0 + dp * e) * D2R;
  return {x: CX + r * Math.cos(p), y: CY + r * Math.sin(p), a: b.a + da * e + settleA, h: 4 + 36 * Math.pow(arc(u), 0.85), s: sl};
};

// 红场 → 钟心：半径按对数从 1600 缩到 96（每帧缩同样的比例），正弦缓动——黑边扫过辐条用了约 15 帧，看得清；
// 落定时往外鼓 7% 再回来（单向）
const R0 = 1600;
export const DISC0 = 62;
export const DISC1 = AT.clock;
export const discR = (t: number) => {
  if (t < DISC0) return R0;
  const e = ease.sine(prog(t, DISC0, DISC1 - DISC0));
  return R0 * Math.pow(96 / R0, e) * (1 + 0.07 * bump((t - DISC1) / 4));
};
const discTf = (t: number) => `translate(${CX} ${CY}) scale(${(discR(t) / 96).toFixed(5)})`;

// ───────── 01 球钟：11 颗球抛进来，第 12 颗由手送 ─────────
const BALL_COL = [C.sun, C.turq, C.blue, C.red, C.pink, C.sun, C.ink, C.blue, C.red, C.turq, C.pink, C.blue];
export const BALL_ORDER = [0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11];
const FLIGHT = 16;
const BALL_STEP = 5;
export const ballLand = (i: number) => (i === 3 ? AT.place : AT.balls + BALL_STEP * BALL_ORDER.indexOf(i));

export const handPose = (t: number): Pose => {
  const tip = tipOf(3);
  const P = AT.place;
  const e = ease.out(prog(t, AT.hand, 26));
  let x = lerp(2350, tip.x, e);
  let y = lerp(250, tip.y, e);
  let a = lerp(-26, -10, e);
  let h = 34;
  if (t >= P - 6) h = 34 - 30 * ease.in2(prog(t, P - 6, 6));
  if (t >= P + 2) {
    const u = ease.out(prog(t, P + 2, 8));
    h = 4 + 28 * u;
    x += 26 * u;
  }
  if (t >= P + 9) {
    // 抽走：越来越快，出画后保持速度（不在画外急停）
    const d = t - P - 9;
    const u = d < 20 ? Math.pow(d / 20, 3) : 1 + (3 / 20) * (d - 20);
    x += 1750 * u;
    y -= 280 * u;
    a -= 16 * Math.min(1, u);
  }
  return {x, y, a, h};
};

export const ballPose = (i: number, t: number): Pose | null => {
  const tip = tipOf(i);
  const la = ballLand(i);
  if (i === 3) {
    if (t < AT.hand) return null;
    if (t < la) {
      const p = handPose(t);
      return {x: p.x, y: p.y, a: 0, h: p.h};
    }
    return {x: tip.x, y: tip.y, a: 0, h: 4, s: slap(t, la, 0.04, 4)};
  }
  if (t < la - FLIGHT) return null;
  if (t < la) {
    // 从画外沿径向抛进来：二次贝塞尔（带一点侧旋），高度越落越快
    const u = prog(t, la - FLIGHT, FLIGHT);
    const e = ease.out(u);
    const th = spokeAng(i) * D2R;
    const dx = Math.cos(th);
    const dy = Math.sin(th);
    const side = rnd(i, 3) > 0.5 ? 1 : -1;
    const p0 = {x: tip.x + dx * 1500 - dy * 260 * side, y: tip.y + dy * 1500 + dx * 260 * side};
    const p1 = {x: tip.x + dx * 520 + dy * 220 * side, y: tip.y + dy * 520 - dx * 220 * side};
    const q = 1 - e;
    return {
      x: q * q * p0.x + 2 * q * e * p1.x + e * e * tip.x,
      y: q * q * p0.y + 2 * q * e * p1.y + e * e * tip.y,
      a: -140 * q,
      h: 4 + 82 * (1 - u * u),
    };
  }
  let p: Pose = {x: tip.x, y: tip.y, a: 0, h: 4, s: slap(t, la, 0.045, 4)};
  if (i === 6 && t >= AT.tease) {
    // 片尾钩子：6 点的球被碰起来，晃一下，往下掉出画面
    const up = ease.out(prog(t, AT.tease, 10));
    const fall = ease.in(prog(t, AT.tease + 10, 30));
    p = {x: tip.x + 14 * up + 40 * fall, y: tip.y + 900 * fall, a: wobble(t, AT.tease, 9, 18, 14) + 80 * fall, h: 4 + 32 * up};
  }
  return p;
};

// 指针：10:10 落下，按下红球后转两圈
const SPIN = 40;
const minuteA = (t: number) => -30 + 720 * ease.inOut(prog(t, AT.spin, SPIN)) + wobble(t, AT.spin + SPIN, 3, 16, 9);
const hourA = (t: number) => -150 + 60 * ease.inOut(prog(t, AT.spin, SPIN)) + wobble(t, AT.spin + SPIN, 1.5, 16, 9);
const dropH = (t: number, t0: number, d = 10, from = 50, to = 6) => to + (from - to) * (1 - ease.in2(prog(t, t0, d)));

// ───────── 片名 ─────────
const TX = 1030;
const MID_BASE = 470;
const MOD_BASE = 760;
const MOD_COL = [C.red, C.blue, C.sun, C.turq, C.pink, C.ink];
const MOD_LAND = [216, AT.big, 223.5, 231, 238.5, 246];
const midLand = (i: number) => AT.title + 2 + 3.75 * i;

const letterPose = (cx: number, cy: number, land: number, seed: number, t: number, flight = 16, hmax = 72): Pose | null => {
  if (t < land - flight) return null;
  const tilt = (rnd(seed, 7) - 0.5) * 5;
  const settle = wobble(t, land, 2.4, 16, 8);
  if (t >= land) return {x: cx, y: cy, a: tilt + settle, h: 4, s: slap(t, land, 0.04, 3.5)};
  const u = prog(t, land - flight, flight);
  const e = ease.out(u);
  const sx = cx + (rnd(seed, 1) - 0.5) * 520;
  const sy = 1350 + rnd(seed, 2) * 250;
  const mx = (sx + cx) / 2 + (rnd(seed, 3) - 0.5) * 300;
  const my = cy + 240;
  const q = 1 - e;
  return {
    x: q * q * sx + 2 * q * e * mx + e * e * cx,
    y: q * q * sy + 2 * q * e * my + e * e * cy,
    a: tilt + (rnd(seed, 4) - 0.5) * 120 * q,
    h: 4 + hmax * (1 - u * u),
  };
};
export const midPose = (i: number, t: number) => {
  const L = GEO.midCentury.letters[i];
  return letterPose(TX + L.x, MID_BASE + L.y, midLand(i), 100 + i, t);
};
export const modPose = (i: number, t: number) => {
  const L = GEO.modern.letters[i];
  return i === 1
    ? letterPose(TX + L.x, MOD_BASE + L.y, MOD_LAND[i], 200 + i, t, 30, 130)
    : letterPose(TX + L.x, MOD_BASE + L.y, MOD_LAND[i], 200 + i, t);
};

// 背景纸：太阳从上滑下、腰果从左滑进（贴着桌面滑，h = 4）
const sunPose = (t: number): Pose => {
  const e = ease.out(prog(t, 104, 48));
  return {x: 905, y: lerp(-420, 300, e), a: lerp(-24, 0, e), h: 4};
};
const beanPose = (t: number): Pose => {
  const e = ease.out(prog(t, 110, 50));
  return {x: lerp(-760, 330, e), y: 800, a: lerp(10, -14, e), h: 4};
};

/** 这一刻屏幕上最快的东西每帧走多少 px（决定运动模糊取几个子帧） */
export const openingSpeed = (t: number) => {
  const pts = (u: number) => {
    const out: number[][] = [];
    const add = (p: Pose | null, ext = 0) => {
      if (!p) return;
      out.push(toScreen(u, p.x, p.y));
      if (ext) {
        const a = (p.a ?? 0) * D2R;
        out.push(toScreen(u, p.x + ext * Math.cos(a), p.y + ext * Math.sin(a)));
      }
    };
    for (let i = 0; i < 12; i++) {
      add(barPose(i, u), GEO.spokeLen[i] / 2);
      add(ballPose(i, u));
    }
    add(handPose(u));
    for (let i = 0; i < 11; i++) add(midPose(i, u));
    for (let i = 0; i < 6; i++) add(modPose(i, u));
    add(sunPose(u));
    add(beanPose(u));
    if (u > AT.clock) {
      out.push(toScreen(u, CX + 236 * Math.cos(minuteA(u) * D2R), CY + 236 * Math.sin(minuteA(u) * D2R)));
    }
    out.push(toScreen(u, 0, 0), toScreen(u, W, H));
    return out;
  };
  const a = pts(t - 0.5);
  const b = pts(t + 0.5);
  let v = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) v = Math.max(v, Math.hypot(b[i][0] - a[i][0], b[i][1] - a[i][1]));
  const dR = Math.abs(discR(t + 0.5) - discR(t - 0.5)) * cam(t).s;
  return Math.min(80, Math.max(v, t > DISC0 && t < DISC1 + 6 ? dR : 0));
};

/** “这一刻在看哪一块纸”：给左下角的 h 读数用 */
export const focusAt = (t: number): {p: Pose | null; fill: string} => {
  if (t < AT.gather - 8) {
    let k = 0;
    for (let i = 0; i < 12; i++) if (landA(i) - ENTRY <= t) k = i;
    return {p: barPose(k, t), fill: BAR_COL[k]};
  }
  if (t < AT.balls - FLIGHT + 2) return {p: barPose(6, t), fill: BAR_COL[6]};
  if (t < AT.hand + 10) {
    const j = clamp(Math.floor((t - AT.balls + FLIGHT) / BALL_STEP), 0, 10);
    return {p: ballPose(BALL_ORDER[j], t), fill: BALL_COL[BALL_ORDER[j]]};
  }
  if (t < AT.title) return {p: ballPose(3, t), fill: C.red};
  if (t < AT.tease) {
    if (t >= MOD_LAND[5] && t < AT.big + 6) return {p: modPose(1, t), fill: C.blue};
    if (t >= MOD_LAND[0] - 16) {
      const order = [0, 2, 3, 4, 5];
      let k = 0;
      for (const i of order) if (MOD_LAND[i] - 16 <= t) k = i;
      return {p: modPose(k, t), fill: MOD_COL[k]};
    }
    const i = clamp(Math.floor((t - AT.title - 2 + 16) / 3.75), 0, 10);
    return {p: midPose(i, t), fill: C.ink};
  }
  return {p: ballPose(6, t), fill: C.ink};
};

// ───────── 画面 ─────────
const Bars: React.FC<{t: number; fill?: string}> = ({t, fill}) => {
  const items = BASS.map((_, i) => ({i, p: barPose(i, t)})).filter((x) => x.p) as {i: number; p: Pose}[];
  items.sort((a, b) => (a.p.h ?? 4) - (b.p.h ?? 4));
  return (
    <>
      {items.map(({i, p}) => <Piece key={i} d={GEO.spokes[i]} fill={fill ?? BAR_COL[i]} p={p} />)}
    </>
  );
};

export const Opening: React.FC<{t: number; k: number}> = ({t, k}) => {
  const R = discR(t);
  const inverting = t >= DISC0 && t < DISC1 + 2;
  const clipIn = `inv-in-${k}`;
  const maskOut = `inv-out-${k}`;
  const handP = handPose(t);
  const balls = Array.from({length: 12}, (_, i) => ({i, p: ballPose(i, t)})).filter((x) => x.p) as {i: number; p: Pose}[];
  balls.sort((a, b) => (a.p.h ?? 4) - (b.p.h ?? 4));
  const showClock = t >= AT.clock - 4;
  return (
    <g transform={camTransform(t)}>
      <rect x={-2000} y={-2000} width={W + 4000} height={H + 4000} fill={C.paper} />
      {/* 背景纸：太阳 + 腰果（叠印） */}
      {t >= 104 && <Piece d={GEO.sun} fill={C.sun} p={sunPose(t)} />}
      {t >= 110 && (
        <>
          <Piece d={GEO.bean} fill={C.pink} p={beanPose(t)} />
          {/* 叠印：腰果压在太阳上的那一块 = 粉 × 黄 */}
          <clipPath id={`sun-${k}`}>
            <path d={GEO.sun} transform={bodyTf(sunPose(t))} />
          </clipPath>
          <g clipPath={`url(#sun-${k})`}>
            <Body parts={[{d: GEO.bean, fill: multiply(C.sun, C.pink)}]} p={beanPose(t)} />
          </g>
        </>
      )}
      {t >= 124 && <Piece d={GEO.star} fill={C.blue} p={{x: 1760, y: 930, a: 12 + wobble(t, 138, 6, 18, 10), h: dropH(t, 124, 14, 70, 4)}} />}
      {t >= 132 && <Piece d={GEO.starS} fill={C.red} p={{x: 1690, y: 990, a: -10 + wobble(t, 146, 8, 16, 10), h: dropH(t, 132, 14, 70, 4)}} />}

      {/* 红场 / 钟心 */}
      {R > 300 ? <path d={GEO.disc} transform={discTf(t)} fill={C.red} /> : <Piece d={GEO.disc} fill={C.red} p={{x: CX, y: CY, s: R / 96, h: 4}} />}
      {inverting && (
        <defs>
          <clipPath id={clipIn}>
            <path d={GEO.disc} transform={discTf(t)} />
          </clipPath>
          <mask id={maskOut} maskUnits="userSpaceOnUse" x={-3000} y={-3000} width={9000} height={9000}>
            <rect x={-3000} y={-3000} width={9000} height={9000} fill="#fff" />
            <path d={GEO.disc} transform={discTf(t)} fill="#000" />
          </mask>
        </defs>
      )}
      {t < DISC0 && <Bars t={t} />}
      {inverting && (
        <>
          <g clipPath={`url(#${clipIn})`}><Bars t={t} /></g>
          <g mask={`url(#${maskOut})`}><Bars t={t} fill={C.ink} /></g>
        </>
      )}
      {t >= DISC1 + 2 && <Bars t={t} fill={C.ink} />}

      {/* 球 */}
      {balls.filter((b) => (b.p.h ?? 4) < 8).map(({i, p}) => <Piece key={i} d={GEO.balls[i]} fill={BALL_COL[i]} p={p} />)}

      {/* 钟心盖在辐条上（红场里看不见，缩到 96 时正好接上） */}
      {t >= DISC0 - 4 && <Body parts={[{d: GEO.disc, fill: C.red}]} p={{x: CX, y: CY, s: R > 110 ? 1 : R / 96, h: 0}} />}
      {showClock && (
        <>
          <Piece d={GEO.hour} fill={C.paper} p={{x: CX, y: CY, a: hourA(t), h: dropH(t, AT.clock - 4, 10, 46, 6)}} />
          <Piece d={GEO.minute} fill={C.paper} p={{x: CX, y: CY, a: minuteA(t), h: dropH(t, AT.clock, 10, 50, 7)}} />
          <Piece d={GEO.discDot} fill={C.sun} p={{x: CX, y: CY, h: dropH(t, AT.clock + 3, 9, 56, 8), s: slap(t, AT.clock + 12, 0.06, 3)}} />
        </>
      )}

      {/* 空中的球（在钟上面飞） */}
      {balls.filter((b) => (b.p.h ?? 4) >= 8).map(({i, p}) => <Piece key={i} d={GEO.balls[i]} fill={BALL_COL[i]} p={p} />)}

      {/* 片名 */}
      {GEO.midCentury.letters.map((L, i) => {
        const p = midPose(i, t);
        return p ? <Piece key={`m${i}`} d={L.d} fill={C.ink} p={p} /> : null;
      })}
      {GEO.modern.letters.map((L, i) => {
        const p = modPose(i, t);
        return p ? <Piece key={`n${i}`} d={L.d} fill={MOD_COL[i]} p={p} /> : null;
      })}

      {/* 手（最上层） */}
      {t >= AT.hand && t < AT.place + 50 && (
        <Sheet
          p={handP}
          parts={[
            {d: GEO.hand.sleeve, fill: C.blue},
            {d: GEO.hand.palm, fill: C.ink},
            {d: GEO.hand.cuff, fill: C.paper},
          ]}
        />
      )}
      {t >= AT.hand && t < AT.place && <Body parts={[{d: GEO.balls[3], fill: C.red}]} p={handP} />}
    </g>
  );
};

/** 片名下的小字：印在桌上，按行从遮罩里升起（16 帧 ease-out） */
export const Subtitle: React.FC<{t: number}> = ({t}) => {
  if (t < AT.big + 4) return null;
  const e = ease.out(prog(t, AT.big + 4, 18));
  return (
    <g transform={camTransform(t)}>
      <svg x={TX + 6} y={MOD_BASE + 22} width={820} height={48} overflow="hidden">
        <g transform={`translate(0 ${(1 - e) * 48})`}>
          <text x={0} y={36} fontFamily="'Noto Sans SC', sans-serif" fontWeight={900} fontSize={34} fill={C.ink} letterSpacing={10}>中世纪现代</text>
          <text x={250} y={34} fontFamily="'Jost', sans-serif" fontWeight={600} fontSize={22} fill={C.mute} letterSpacing={5}>1945 — 1965</text>
        </g>
      </svg>
    </g>
  );
};

/** 黑场在屏幕上的形状（给外框做黑白反转用） */
export const discScreenTf = (t: number) => `${camTransform(t)} ${discTf(t)}`;
