/**
 * 03 唱片 → 04 建筑 → 05 今天，一路接力：
 *   02 的蓝球被提起来、越飞越大、在空中翻面——背面就是唱片（03，黄纸）；封套从左边滑进来，BOP 三个字砸在封套上，
 *   粉色圆压在封套角上叠印。唱片往右滑出封套、提起来、再翻面——背面是黄色，飞上去当落日（04，粉纸）；
 *   山一层层升起来（近的走得快），楼板、玻璃盒子、屋顶落下，窗一盏盏亮。玻璃盒子提起来、翻面——背面是墨色的手机（05，蓝纸）；
 *   屏幕、封面、小唱片、ATOMIC、波形条一块块落进去，手按下播放键。
 */
import React from 'react';
import {C} from '../tokens';
import {GEO} from './geo';
import {carry, D2R, drop} from './kit';
import {ease, lerp, prog, wobble} from './motion';
import {Body, multiply, Piece, type Pose, Sheet} from './paper';
import {EAMES_COL, eamesBallPose, RELAY_BALL, Year, yearPose} from './spokes';
import {AT} from './timeline';

// ───────── 03 唱片 ─────────
const BALL_R = 47; // 接力那颗球（balls[10]）的半径
const REC = {x: 720, y: 540, s: 3.4}; // 唱片：钟心那块纸（r 96）× 3.4 = r 326
const REC_LAND = AT.record + 16;
const REC_SLIDE = AT.sheet4 - 30; // 往右滑出封套（22 帧，正弦缓动）
const REC_LIFT = AT.sheet4 - 8;
const SUN_POSE = {x: 560, y: 330, s: 2.4};
const SUN_LAND = AT.house + 16;

/** 唱片（及接力前后）这一刻：形状、颜色、姿态 */
export const recordState = (t: number): {p: Pose; kind: 'ball' | 'record' | 'sun'; air: boolean} | null => {
  const t0 = AT.sheet3 - 8;
  if (t < t0) return null;
  if (t < REC_LAND) {
    const from = eamesBallPose(RELAY_BALL, t0)!;
    const {p, back} = carry(t, t0, REC_LAND, {...from, s: 1}, {x: REC.x, y: REC.y, s: (REC.s * 96) / BALL_R}, {flip: true, hmax: 90});
    // 球的单位换成唱片（r 96）的单位
    return back ? {p: {...p, s: ((p.s ?? 1) * BALL_R) / 96}, kind: 'record', air: true} : {p, kind: 'ball', air: true};
  }
  const spin = (t - REC_LAND) * 2.4;
  const slideE = ease.sine(prog(t, REC_SLIDE, 22));
  const rest: Pose = {x: lerp(REC.x, 1130, slideE), y: REC.y, a: spin, h: 4, s: REC.s * (t < REC_LAND + 10 ? 1 - 0.04 * Math.max(0, 1 - (t - REC_LAND) / 6) : 1)};
  if (t < REC_LIFT) return {p: rest, kind: 'record', air: false};
  const from: Pose = {x: 1130, y: REC.y, a: (REC_LIFT - REC_LAND) * 2.4, h: 4, s: REC.s};
  const {p, back} = carry(t, REC_LIFT, SUN_LAND, from, {...SUN_POSE, a: 0}, {flip: true, hmax: 80});
  return {p, kind: back ? 'sun' : 'record', air: t < SUN_LAND};
};

const sleevePose = (t: number): Pose => ({x: lerp(-500, 470, ease.out(prog(t, AT.record + 16, 16))), y: 540, a: lerp(-6, 0, ease.out(prog(t, AT.record + 16, 16))), h: 6});
const bopPose = (i: number, t: number) => {
  const L = GEO.bop.letters[i];
  return drop(t, AT.record + 34 + 4 * i, 12, 160, 200 + L.x, 812 + L.y, (i - 1) * 14, (i - 1) * 3, 0, -80);
};
const dotPose = (t: number) => drop(t, AT.record + 48, 10, 90, 160, 230, 0, 0, 0, 0, 1.3);

const Record: React.FC<{p: Pose}> = ({p}) => {
  const s = (p.s ?? 1) * 96;
  return (
    <>
      <Piece d={GEO.disc} fill={C.ink} p={p} />
      <g transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${(p.a ?? 0).toFixed(2)}) scale(1 ${(p.sy ?? 1).toFixed(3)})`}>
        {[0.52, 0.64, 0.76, 0.88].map((k) => <circle key={k} r={s * k * (1 + 0.0032 * (p.h ?? 4))} fill="none" stroke="#3a3532" strokeWidth={2} />)}
      </g>
      <Body parts={[{d: GEO.discDot, fill: C.red}]} p={{...p, s: (p.s ?? 1) * 1.05}} />
      <Body parts={[{d: GEO.starS, fill: C.paper}]} p={{...p, x: p.x + Math.cos(((p.a ?? 0) - 30) * D2R) * s * 0.22, y: p.y + Math.sin(((p.a ?? 0) - 30) * D2R) * s * 0.22 * (p.sy ?? 1), s: (p.s ?? 1) * 0.5}} />
    </>
  );
};

const RecordPiece: React.FC<{st: NonNullable<ReturnType<typeof recordState>>}> = ({st}) =>
  st.kind === 'ball' ? <Piece d={GEO.balls[RELAY_BALL % 12]} fill={EAMES_COL[RELAY_BALL]} p={st.p} /> : st.kind === 'sun' ? <Piece d={GEO.disc} fill={C.sun} p={st.p} /> : <Record p={st.p} />;

export const Ch03: React.FC<{t: number; k: number}> = ({t, k}) => {
  const st = recordState(t);
  const sl = sleevePose(t);
  const dot = dotPose(t);
  return (
    <>
      {st && !st.air && st.kind === 'record' && <RecordPiece st={st} />}
      {t >= AT.record + 16 && <Piece d={GEO.sleeve} fill={C.turq} p={sl} />}
      {GEO.bop.letters.map((L, i) => {
        const p = bopPose(i, t);
        return p ? <Piece key={i} d={L.d} fill={C.ink} p={p} /> : null;
      })}
      {dot && (
        <>
          <Piece d={GEO.circleL} fill={C.pink} p={dot} />
          {/* 叠印：粉圆压在封套上的那一块 = 粉 × 绿松石 */}
          <clipPath id={`slv-${k}`}>
            <rect x={150} y={220} width={640} height={640} />
          </clipPath>
          <g clipPath={`url(#slv-${k})`}>
            <Body parts={[{d: GEO.circleL, fill: multiply(C.pink, C.turq)}]} p={dot} />
          </g>
        </>
      )}
      <Year g={GEO.y1956} t={t} t0={AT.record + 52} x={1300} y={1010} fill={C.ink} />
    </>
  );
};

// ───────── 04 建筑 · Case Study House #22 ─────────
const HX = 1240;
const hillFar = (t: number): Pose => ({x: 960 - 40 * prog(t, AT.house, 90), y: lerp(1500, 760, ease.out(prog(t, AT.house + 2, 26))), h: 4});
const hillNear = (t: number): Pose => ({x: 960 - 120 * prog(t, AT.house, 90), y: lerp(1650, 880, ease.out(prog(t, AT.house + 8, 26))), h: 6});
const BOX_LAND = AT.house + 38;
const BOX_LIFT = AT.sheet5 - 8;
const PHONE = {x: 960, y: 560};
const PHONE_LAND = AT.app + 14;
const winLand = (k: number) => AT.house + 46 + 3.125 * k;

export const boxState = (t: number): {p: Pose; back: boolean; air: boolean} | null => {
  const base = drop(t, BOX_LAND, 10, 90, HX, 600, -6, 0);
  if (!base) return null;
  if (t < BOX_LIFT) return {p: base, back: false, air: false};
  const {p, back} = carry(t, BOX_LIFT, PHONE_LAND, {x: HX, y: 600, a: 0, h: 4}, {x: PHONE.x, y: PHONE.y, a: 90, sx: 860 / 560, sy: 420 / 150}, {flip: true, hmax: 80});
  return {p, back, air: t < PHONE_LAND};
};

const housePiece = (t: number, land: number, x: number, y: number) => drop(t, land, 10, 90, x, y, -5, 0);

export const Ch04: React.FC<{t: number}> = ({t}) => {
  const st = recordState(t);
  const box = boxState(t);
  const set = 150 * ease.inOut(prog(t, SUN_LAND + 2, 64));
  const lit = (k: number) => t >= winLand(k);
  return (
    <>
      {st && !st.air && st.kind === 'sun' && <Piece d={GEO.disc} fill={C.sun} p={{...st.p, y: st.p.y + set, a: 0}} />}
      <Piece d={GEO.hillFar} fill={C.turq} p={hillFar(t)} />
      {[[1080, 780], [1380, 780]].map(([x, y], i) => {
        const p = housePiece(t, AT.house + 32, x, y);
        return p ? <Piece key={i} d={GEO.col} fill={C.paper} p={p} /> : null;
      })}
      <Piece d={GEO.hillNear} fill={C.ink} p={hillNear(t)} />
      {(() => {
        const p = housePiece(t, AT.house + 34, HX, 690);
        return p ? <Piece d={GEO.slab} fill={C.paper} p={p} /> : null;
      })()}
      {box && !box.air && (
        <Sheet p={box.p} parts={[{d: GEO.box, fill: C.ink}, ...GEO.wins.map((w, k) => ({d: w, fill: lit(k) ? C.sun : C.ink}))]} />
      )}
      {GEO.wins.map((w, k) => {
        if (!lit(k) || t >= winLand(k) + 10 || !box || box.air) return null;
        const u = prog(t, winLand(k), 10);
        return <Body key={k} parts={[{d: w, fill: C.sun}]} p={{...box.p, h: 4 + 40 * (1 - u * u)}} />;
      })}
      {(() => {
        const p = housePiece(t, AT.house + 42, HX, 512);
        return p ? <Piece d={GEO.slab} fill={C.paper} p={p} /> : null;
      })()}
      {t >= AT.house + 62 && <Piece d={GEO.starS} fill={C.paper} p={{x: 1560, y: 180, a: t * 0.6, h: 4 + 60 * (1 - ease.in2(prog(t, AT.house + 62, 9)))}} />}
      {t >= AT.house + 68 && <Piece d={GEO.starS} fill={C.paper} p={{x: 980, y: 140, a: -t * 0.5, h: 4 + 60 * (1 - ease.in2(prog(t, AT.house + 68, 9)))}} />}
      <Year g={GEO.y1960} t={t} t0={AT.house + 52} x={130} y={1010} fill={C.paper} />
    </>
  );
};

// ───────── 05 今天 · App ─────────
const ui = (t: number, land: number, x: number, y: number, s = 1) => drop(t, land, 10, 80, x, y, -6, 0, 0, -30, s);
const STRIPS = 16;
const stripLand = (k: number) => AT.app + 46 + 1.5 * k;
const stripH = (k: number) => 0.45 + 0.55 * Math.abs(Math.sin(k * 1.7) * 0.7 + Math.sin(k * 0.6) * 0.3);
const PLAY = {x: 960, y: 820};
const PRESS = AT.app + 75;
export const playPose = (t: number): Pose | null => {
  const p = ui(t, AT.app + 50, PLAY.x, PLAY.y);
  if (!p) return null;
  let h = 12;
  if (t >= PRESS - 4) h = lerp(12, 0, ease.in2(prog(t, PRESS - 4, 4)));
  if (t >= PRESS + 4) h = 12 + 6 * Math.sin(Math.PI * prog(t, PRESS + 4, 10)) * (1 - prog(t, PRESS + 4, 10)) + 0;
  return {...p, h: t < AT.app + 50 ? p.h : h};
};
export const appHand = (t: number): Pose | null => {
  if (t < AT.app + 54) return null;
  const e = ease.out(prog(t, AT.app + 54, 14));
  let x = lerp(2300, PLAY.x + 6, e);
  let y = lerp(1250, PLAY.y + 4, e);
  let h = 30;
  if (t >= PRESS - 4) h = lerp(30, 2, ease.in2(prog(t, PRESS - 4, 4)));
  if (t >= PRESS + 4) {
    const u = ease.in(prog(t, PRESS + 4, 16));
    h = 2 + 40 * ease.out(prog(t, PRESS + 4, 6));
    x += 1500 * u;
    y += 700 * u;
  }
  return {x, y, a: -38, h};
};

export const Ch05: React.FC<{t: number}> = ({t}) => {
  const box = boxState(t);
  const phoneOn = box && !box.air;
  const screen = ui(t, AT.app + 22, PHONE.x, PHONE.y);
  const cover = ui(t, AT.app + 28, 960, 395);
  const rec = ui(t, AT.app + 34, 960, 395, 1.15);
  const play = playPose(t);
  return (
    <>
      {phoneOn && <Piece d={GEO.phone} fill={C.ink} p={{...box!.p, a: wobble(t, PHONE_LAND, 2, 16, 8), sx: 1, sy: 1}} />}
      {screen && <Piece d={GEO.screen} fill={C.paper} p={screen} />}
      {cover && <Piece d={GEO.cover} fill={C.sun} p={cover} />}
      {rec && <Record p={{...rec, a: (t - AT.app) * 3}} />}
      {GEO.atomic.letters.map((L, i) => {
        const p = ui(t, AT.app + 40 + 1.5 * i, 810 + L.x, 640 + L.y);
        return p ? <Piece key={i} d={L.d} fill={C.ink} p={p} /> : null;
      })}
      {Array.from({length: STRIPS}, (_, k) => {
        const land = stripLand(k);
        if (t < land - 8) return null;
        const u = prog(t, land - 8, 8);
        const p: Pose = {x: 810 + 20 * k, y: 722, sy: stripH(k), h: t < land ? 4 + 26 * (1 - u) : 4, s: 1};
        return <Piece key={k} d={GEO.strip} fill={k < 10 ? C.ink : '#D9CDB8'} p={p} />;
      })}
      {play && <Piece d={GEO.play} fill={C.red} p={play} />}
      {play && <Body parts={[{d: GEO.tri, fill: C.paper}]} p={{...play, x: play.x + 4}} />}
      <Year g={GEO.y2026} t={t} t0={AT.app + 56} x={120} y={1010} fill={C.paper} />
    </>
  );
};

/** 空中的接力（在所有纸上面）：唱片 / 落日 / 玻璃盒子 / 手 */
export const Air345: React.FC<{t: number}> = ({t}) => {
  const st = recordState(t);
  const box = boxState(t);
  const hand = appHand(t);
  return (
    <>
      {st && st.air && <RecordPiece st={st} />}
      {box && box.air && (
        <Sheet p={box.p} parts={box.back ? [{d: GEO.box, fill: C.ink}] : [{d: GEO.box, fill: C.ink}, ...GEO.wins.map((w) => ({d: w, fill: C.sun}))]} />
      )}
      {hand && (
        <Sheet p={hand} parts={[{d: GEO.hand.sleeve, fill: C.turq}, {d: GEO.hand.palm, fill: C.ink}, {d: GEO.hand.cuff, fill: C.paper}]} />
      )}
    </>
  );
};

export const pts345 = (t: number): (Pose | null)[] => {
  const out: (Pose | null)[] = [recordState(t)?.p ?? null, boxState(t)?.p ?? null, appHand(t), playPose(t), hillFar(t), hillNear(t), sleevePose(t)];
  const st = recordState(t);
  if (st) {
    const s = (st.p.s ?? 1) * 96;
    const a = (st.p.a ?? 0) * D2R;
    out.push({x: st.p.x + s * Math.cos(a), y: st.p.y + s * Math.sin(a)});
  }
  for (let i = 0; i < 3; i++) out.push(bopPose(i, t));
  for (let i = 0; i < 4; i++) {
    out.push(yearPose(GEO.y1956, i, t, AT.record + 52, 1300, 1010));
    out.push(yearPose(GEO.y1960, i, t, AT.house + 52, 130, 1010));
    out.push(yearPose(GEO.y2026, i, t, AT.app + 56, 120, 1010));
  }
  return out;
};

export const focus345 = (t: number): {p: Pose | null; fill: string} => {
  if (t < AT.house + 20) {
    const st = recordState(t);
    return {p: st?.p ?? null, fill: st?.kind === 'ball' ? C.blue : st?.kind === 'sun' ? C.sun : C.ink};
  }
  if (t < AT.app + 20) {
    const b = boxState(t);
    return {p: b?.p ?? null, fill: C.ink};
  }
  return {p: playPose(t), fill: C.red};
};
