/**
 * 014 · 液态玻璃 —— 第三版的剧本：任意时刻 t（帧，可为小数）画面里有什么
 *
 * 分镜见 STORYBOARD.md。玻璃写在“平面坐标”里，由镜头换算到屏幕：镜头跟着它走时，它在屏幕上稳住、世界从它底下滑过。
 */
import {ERAS, Material} from '../tokens';
import type {Device, GroupMat, Ripple, Shape} from './gl';
import {anticLand, ballistic, clamp, ease, follow, hermite, land, lerp, prog, thump, track, tw, wobble} from './motion';
import {BROWSER, BendState, Cam, ERA_LAND, ERA_X, MERGE_C, MergeState, PHONE, RULE_Y, UI_CAM} from './planes';

export const DURATION = 1200;
const W = 1920;
const H = 1080;

// ───────── 材质 ─────────
type M = Material & {k: number; opacity: number; height: number; caustic: number; alt: number};
const mk = (m: Partial<M>): M => ({
  bevel: 44, edge: 0.9, mag: 0.06, frost: 0, tint: [1, 1, 1, 0.04], chroma: 0.06, rim: 0.9, shadow: 0.22,
  gloss: 0, border: 0, k: 30, opacity: 1, height: 0.12, caustic: 1, alt: 0, ...m,
});
export const CLEAR = mk({});
const LABEL = mk({bevel: 26, edge: 0.8, mag: 0.03, frost: 7, tint: [1, 1, 1, 0.4], chroma: 0.05, caustic: 0.35, k: 26});
const MENU = mk({bevel: 36, edge: 0.8, mag: 0.03, frost: 10, tint: [1, 1, 1, 0.42], chroma: 0.05, caustic: 0.4});
const CAUSTIC = [0.35, 0.45, 0, 0.25, 1];
const ERA_M: M[] = ERAS.map((e, k) => mk({...e.m, caustic: CAUSTIC[k]}));
const HIDE = mk({opacity: 0});

const lerpM = (a: M, b: M, t: number): M => {
  const u = clamp(t);
  const o = {} as M;
  for (const key of Object.keys(a) as (keyof M)[]) {
    const va = a[key] as unknown;
    const vb = b[key] as unknown;
    if (Array.isArray(va)) (o[key] as unknown) = (va as number[]).map((x, i) => lerp(x, (vb as number[])[i], u));
    else (o[key] as unknown) = lerp(va as number, vb as number, u);
  }
  return o;
};

type S = {cx: number; cy: number; hw: number; hh: number; r: number; a2?: number; p2?: number; a3?: number; p3?: number};
const circ = (cx: number, cy: number, r: number, m: Partial<S> = {}): S => ({cx, cy, hw: r, hh: r, r, ...m});
const box = (cx: number, cy: number, hw: number, hh: number, r: number): S => ({cx, cy, hw, hh, r});
const lerpS = (a: S, b: S, u: number): S => ({
  cx: lerp(a.cx, b.cx, u), cy: lerp(a.cy, b.cy, u), hw: lerp(a.hw, b.hw, u), hh: lerp(a.hh, b.hh, u), r: lerp(a.r, b.r, u),
  a2: lerp(a.a2 ?? 0, b.a2 ?? 0, u), p2: lerp(a.p2 ?? 0, b.p2 ?? 0, u), a3: lerp(a.a3 ?? 0, b.a3 ?? 0, u), p3: lerp(a.p3 ?? 0, b.p3 ?? 0, u),
});

export type Label = {
  text: string; x: number; y: number; size: number; weight?: number; family?: string; align?: CanvasTextAlign;
  color?: string; alpha?: number; icon?: 'prev' | 'play' | 'more' | 'search' | 'plus' | 'home';
};

export type DeviceFrame = {
  kind: 'phone' | 'browser';
  dev: Device;
  scroll: number;
  shapes: Shape[];
  groups: GroupMat[];
  labels: Label[];
  ripples: Ripple[];
  light: [number, number];
};

export type Frame = {
  main: Cam;
  alt: Cam | null;
  shapes: Shape[];
  groups: GroupMat[];
  ripples: Ripple[];
  light: [number, number];
  labels: Label[];
  devices: DeviceFrame[];
  bend: BendState;
  merge: MergeState;
  rule: number;
  /** 这一帧屏幕上最快的东西（px/帧），决定运动模糊取几个子帧 */
  speed: number;
};

const toGroup = (m: M, cx: number, cy: number): GroupMat => ({
  bevel: m.bevel, edge: m.edge, mag: m.mag, frost: m.frost, tint: m.tint, chroma: m.chroma, rim: m.rim, shadow: m.shadow,
  gloss: m.gloss, border: m.border, k: m.k, opacity: m.opacity, cx, cy, height: m.height, caustic: m.caustic, alt: m.alt,
});

// ───────── 光 ─────────
const BASE_LIGHT: [number, number] = [-0.6, -0.8];
const rot = (v: [number, number], a: number): [number, number] => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
/** 01 章光源绕一整圈（f236—300），其余时间固定在左上 */
const lightAngle = (t: number) => Math.PI * 2 * tw(t, 236, 64, ease.inOut);

// ───────── 开场 / 片尾的那一滴 ─────────
export const HANG = {x: 1420, y: 560, r: 190};
const IMPACT = {x: 1400, y: 600};
/** 挂着时一直在抖：周期 30 / 20 帧，全片长度的整数倍，首尾一致 */
const hangModes = (t: number) => ({
  a2: 0.045 * Math.sin((2 * Math.PI * t) / 30),
  p2: 0.6 + 0.3 * Math.sin((2 * Math.PI * t) / 60),
  a3: 0.025 * Math.sin((2 * Math.PI * t) / 20 + 1),
  p3: 1.2,
});

// 溅出去的三颗小水珠：方向（弧度）、飞多远、半径
const SATS: [number, number, number][] = [
  [-2.45, 300, 48],
  [-0.75, 360, 36],
  [0.6, 280, 28],
];
const SPLAT = 30;
const SAT_LAND = 56;

// ───────── 镜头 ─────────
/** 平面 A：开场跟着镜片往右走，01 章推进穿过镜片；规则页之后往上摇回字墙 */
const lensBaseX = (t: number) => lerp(IMPACT.x, 1920 + 1400, tw(t, 100, 76, ease.inOut));
const camAx = (t: number) => follow((s) => (s < 96 ? 960 : lensBaseX(s) - 440), t, 5);

/** 01 章镜片在 Aa 上游走（放大镜），f262 停在正中准备穿过去 */
const wander = (t: number) => {
  const env = tw(t, 175, 20, ease.sine) * (1 - tw(t, 240, 22, ease.sine));
  return {
    x: 110 * Math.sin((2 * Math.PI * (t - 175)) / 120) * env,
    y: 20 * Math.sin((2 * Math.PI * (t - 175)) / 60) * env,
  };
};
const LENS = {hw: 400, hh: 280, r: 140};
const DIVE1 = {a: 266, b: 300, z: 2.6};
const DIVE2 = {a: 900, b: 936, z: 2.6};

/** 四跳各自的起跳帧与水平缓动：弧线跳 / 贴地滑（早走、匀）/ 高高跃起（晚走、快）/ 从高处落下（先冲后落） */
const TAKE = [ERA_LAND(0) + 18, ERA_LAND(1) + 8, ERA_LAND(2) + 21, ERA_LAND(3) + 12];
const HOP_EASE = [ease.inOut, ease.sine, ease.inOut5, (u: number) => ease.out(ease.sine(u))];
/** 平面 B：跟着跳跃的玻璃走（带滞后），再到融合、界面 */
const objX = (t: number) => {
  // 每个年代之间的一跳
  if (t < ERA_LAND(0)) return ERA_X(0);
  for (let k = 0; k < 4; k++) {
    const take = TAKE[k];
    if (t < take) return ERA_X(k);
    if (t < ERA_LAND(k + 1)) return lerp(ERA_X(k), ERA_X(k + 1), HOP_EASE[k](prog(t, take, ERA_LAND(k + 1) - take)));
  }
  return lerp(ERA_X(4), MERGE_C.x, tw(t, 516, 36, ease.inOut));
};
const camBx = (t: number) => {
  const target = (s: number) => (s < 690 ? objX(s) - lerp(190, 240, tw(s, 516, 36)) : lerp(MERGE_C.x - 240, UI_CAM, tw(s, 690, 44, ease.inOut)));
  return follow(target, t, 9);
};

// ───────── 设备的 3D ─────────
const project = (cx: number, cy: number, w: number, h: number, ry: number, rx: number, f = 2400): [number, number][] => {
  const pts: [number, number][] = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
  return pts.map(([x, y]) => {
    // 先绕 y 轴再绕 x 轴
    const X = x * Math.cos(ry);
    let Z = x * Math.sin(ry);
    const Y = y * Math.cos(rx) - Z * Math.sin(rx);
    Z = y * Math.sin(rx) + Z * Math.cos(rx);
    const s = f / (f + Z);
    return [cx + X * s, cy + Y * s];
  });
};
const deg = (d: number) => (d * Math.PI) / 180;

// ═════════════════════════════════════════════════════════════════════
export const frameAt = (t: number): Frame => {
  const shapes: Shape[] = [];
  const mats: [M, number, number][] = [
    [HIDE, 0, 0],
    [HIDE, 0, 0],
    [HIDE, 0, 0],
    [HIDE, 0, 0],
  ];
  const labels: Label[] = [];
  const ripples: Ripple[] = [];
  const devices: DeviceFrame[] = [];
  const bendSt: BendState = {bevel: 44, chroma: 0.06};
  const mergeSt: MergeState = {gap: 140};
  let rule = -1;
  let main: Cam;
  let alt: Cam | null = null;
  const dy = thump(t, SPLAT, 12) + thump(t, ERA_LAND(4), 12);

  // ── 镜头 ──
  if (t < DIVE1.b) {
    let cx = camAx(t);
    let cy = 540;
    let z = 1 + 0.02 * tw(t, 0, 90, ease.sine);
    if (t > DIVE1.a) {
      const u = ease.inOut(prog(t, DIVE1.a, DIVE1.b - DIVE1.a));
      cx = lerp(cx, 1920 + 1400, ease.inOut(prog(t, DIVE1.a, 20)));
      z = Math.exp(lerp(Math.log(z), Math.log(DIVE1.z), u));
    }
    main = {plane: 'A', cx, cy: cy - dy / z, z};
  } else if (t < DIVE2.b) {
    let cx = camBx(t);
    let z = 1;
    let cy = 540;
    if (t > DIVE2.a) {
      const u = ease.inOut(prog(t, DIVE2.a, DIVE2.b - DIVE2.a));
      z = Math.exp(lerp(0, Math.log(DIVE2.z), u));
      // 往镜片中心推（镜片从手机里飞出来，停在屏幕中间偏左）
      const lc = lensB2(t);
      cx = lerp(cx, lc.x, ease.inOut(prog(t, DIVE2.a, 24)));
      cy = lerp(540, lc.y, ease.inOut(prog(t, DIVE2.a, 24)));
    }
    // 融合那几拍镜头推近 16%，去界面时再拉回来
    z *= 1 + 0.16 * tw(t, 548, 40) * (1 - tw(t, 684, 40));
    main = {plane: 'B', cx, cy: cy - dy / z, z};
  } else {
    // 规则页 → 往上摇回字墙
    const u = prog(t, 1068, 86);
    const cy = u <= 0 ? 1620 : u >= 1 ? 540 : hermite(1620, 540, 0, 0, u, 86);
    main = {plane: 'A', cx: 960, cy, z: 1};
  }
  const toScr = (cam: Cam, x: number, y: number) => ({x: (x - cam.cx) * cam.z + W / 2, y: (y - cam.cy) * cam.z + H / 2});
  const add = (cam: Cam, g: number, s: S) => {
    const p = toScr(cam, s.cx, s.cy);
    shapes.push({cx: p.x, cy: p.y, hw: s.hw * cam.z, hh: s.hh * cam.z, r: s.r * cam.z, group: g, a2: s.a2, p2: s.p2, a3: s.a3, p3: s.p3});
  };
  const setM = (cam: Cam, g: number, m: M, cx: number, cy: number) => {
    const p = toScr(cam, cx, cy);
    mats[g] = [{...m, bevel: m.bevel * cam.z, k: m.k * cam.z}, p.x, p.y];
  };

  // ═════════ 镜 1 · 落下（0—150）═════════
  if (t < 172) {
    const cam = main;
    let s: S;
    let H0 = 0.12;
    if (t < 12) {
      // 起势：往上一收
      const u = ease.out(prog(t, 0, 12));
      s = circ(HANG.x, HANG.y - 10 * u, HANG.r * (1 + 0.07 * u), hangModes(t));
      H0 = 1 + 0.18 * u;
    } else if (t < SPLAT) {
      // 加速落下：离墙越近越小，影子和光池向它收拢
      const u = prog(t, 12, SPLAT - 12);
      const g = u * u;
      const m = hangModes(t);
      s = circ(lerp(HANG.x, IMPACT.x, g), lerp(HANG.y - 10, IMPACT.y, g), lerp(HANG.r * 1.07, 118, g), {a2: m.a2 * (1 - u), p2: m.p2, a3: m.a3 * (1 - u), p3: m.p3});
      H0 = 1.18 * (1 - g);
    } else if (t < 96) {
      // 砸下去：一摊，抖
      const spread = ease.out5(prog(t, SPLAT, 9));
      const r = lerp(118, 196, spread) - 6 * land(t, SPLAT + 9, 20);
      s = circ(IMPACT.x, IMPACT.y, r, {
        a2: wobble(t, SPLAT, 0.16, 15, 16), p2: 0.4,
        a3: wobble(t, SPLAT + 2, 0.08, 11, 14, 0.5), p3: 1.1,
      });
      H0 = 0;
    } else {
      // 收成一块镜片、往右滑（先缩一下再撑开）
      const u = anticLand(t, 96, 8, 30, 0.06);
      const base = circ(IMPACT.x, IMPACT.y, 190);
      const lens = box(lensBaseX(t), lerp(IMPACT.y, 540, tw(t, 100, 50)), LENS.hw, LENS.hh, LENS.r);
      s = lerpS({...base, cx: lens.cx, cy: lens.cy}, lens, u);
      if (u < 0) s = {...s, hw: base.hw * (1 + u * 0.8), hh: base.hh * (1 + u * 0.8), r: base.r * (1 + u * 0.8)};
      H0 = lerp(0, 0.18, tw(t, 100, 30));
    }
    add(cam, 1, s);
    // 砸下去的那一下，光池猛地亮一下（焦散聚到最紧）
    const flash = t >= SPLAT ? 1.6 * Math.exp(-(t - SPLAT) / 7) : 0;
    setM(cam, 1, {...CLEAR, height: H0, k: 40, shadow: 0.3, caustic: 1 + flash}, s.cx, s.cy);

    // 溅出去的小水珠：先飞（自己一组，有自己的高度），落地后并回主组被拉回去
    if (t >= SPLAT && t < 100) {
      let flying = false;
      let hSat = 0;
      SATS.forEach(([ang, dist, r0], i) => {
        const dir = {x: Math.cos(ang), y: Math.sin(ang)};
        const u = prog(t, SPLAT + 1, SAT_LAND - SPLAT - 1);
        const out = 120 + dist * ease.out(u);
        let x = IMPACT.x + dir.x * out;
        let y = IMPACT.y + dir.y * out;
        let r = r0 * (0.6 + 0.4 * ease.out(prog(t, SPLAT, 6)));
        if (t < SAT_LAND) {
          flying = true;
          hSat = 0.9 * 4 * u * (1 - u);
          add(cam, 2, circ(x, y, r));
        } else {
          // 表面张力：被拉回去，长出颈，并进来
          const p = land(t, SAT_LAND + 4 + i * 3, 30);
          x = lerp(x, IMPACT.x + dir.x * 120, p);
          y = lerp(y, IMPACT.y + dir.y * 120, p);
          r = r * (1 - 0.35 * p) * (1 + wobble(t, SAT_LAND, 0.12, 10, 8));
          add(cam, 1, circ(x, y, r));
        }
      });
      if (flying) setM(cam, 2, {...CLEAR, height: hSat, bevel: 18}, IMPACT.x, IMPACT.y);
    }
    // 整面墙的涟漪
    const R = toScr(cam, IMPACT.x, IMPACT.y);
    if (t >= SPLAT) ripples.push({cx: R.x, cy: R.y, age: t - SPLAT, amp: 16 * cam.z, speed: 26 * cam.z, lambda: 96 * cam.z, decay: 40});
    if (t >= SPLAT + 4) ripples.push({cx: R.x, cy: R.y, age: t - SPLAT - 4, amp: 7 * cam.z, speed: 19 * cam.z, lambda: 58 * cam.z, decay: 30});
    if (t >= SAT_LAND) {
      const [ang, dist] = SATS[1];
      const p = toScr(cam, IMPACT.x + Math.cos(ang) * (120 + dist), IMPACT.y + Math.sin(ang) * (120 + dist));
      ripples.push({cx: p.x, cy: p.y, age: t - SAT_LAND, amp: 6 * cam.z, speed: 12 * cam.z, lambda: 40 * cam.z, decay: 20});
    }
  }

  // ═════════ 镜 2 · 弯光（150—300）═════════
  if (t >= 172 && t < DIVE1.b) {
    const cam = main;
    const w = wander(t);
    const s = box(1920 + 1400 + w.x, 540 + w.y, LENS.hw, LENS.hh, LENS.r);
    const flat = tw(t, 172, 24);
    const up = tw(t, 206, 40);
    const bevel = 44 * (1 - flat) + 44 * up;
    const chroma = 0.06 * (1 - flat) + 0.06 * tw(t, 246, 16);
    bendSt.bevel = bevel;
    bendSt.chroma = chroma;
    const altU = tw(t, 256, 20, ease.sine);
    const magDive = 1 - tw(t, DIVE1.a, 24);
    add(cam, 1, s);
    setM(cam, 1, {...CLEAR, bevel, chroma, mag: ((0.06 * bevel) / 44) * magDive, height: 0.18, alt: altU, caustic: 1 - altU}, s.cx, s.cy);
    if (altU > 0) {
      // 镜片里已经是平面 B 的开头：按镜头推进的倍数缩放，中心对着镜片中心
      const k = main.z / DIVE1.z;
      const lc = toScr(cam, s.cx, s.cy);
      alt = {plane: 'B', cx: camBx(DIVE1.b) - (lc.x - W / 2) / k, cy: 540 - (lc.y - H / 2) / k, z: k};
    }
  }

  // ═════════ 镜 3 · 二十五年（300—545）═════════
  if (t >= DIVE1.b && t < 552) {
    const cam = main;
    // 穿过来以后，盖满屏幕的镜片收回成 Aqua 按钮（落在 2001 上）
    let s: S;
    let m: M;
    let Hh = 0.12;
    if (t < ERA_LAND(0)) {
      const u = land(t, DIVE1.b, 30);
      const big = box(960 + 0, 540, (LENS.hw * DIVE1.z) / cam.z, (LENS.hh * DIVE1.z) / cam.z, (LENS.r * DIVE1.z) / cam.z);
      // 平面 B 的坐标：屏幕中心 = 镜头中心
      const bigW = {...big, cx: cam.cx, cy: cam.cy};
      const aqua = box(ERA_X(0), 640, 300, 72, 72);
      s = lerpS(bigW, aqua, u);
      m = lerpM({...CLEAR, mag: 0}, ERA_M[0], ease.inOut(prog(t, DIVE1.b + 6, 20)));
      Hh = lerp(0.18, 0.12, u);
    } else {
      const shapesK: S[] = [box(0, 560, 300, 72, 72), box(0, 560, 360, 236, 16), box(0, 560, 270, 290, 56), box(0, 560, 330, 210, 40), circ(0, 560, 170)];
      let k = 0;
      for (let i = 0; i < 4; i++) if (t >= TAKE[i]) k = i + 1;
      const take = TAKE[Math.max(0, k - 1)];
      if (k > 0 && t < ERA_LAND(k)) {
        // 空中：划弧线，边飞边换形状与材质
        const u = prog(t, take, ERA_LAND(k) - take);
        const e = ease.inOut(u);
        const arc = 4 * u * (1 - u);
        s = lerpS(shapesK[k - 1], shapesK[k], e);
        m = lerpM(ERA_M[k - 1], ERA_M[k], e);
        // 四跳各不相同：弧线跳 → 贴地滑（被速度拉长）→ 高高跃起（离镜头近、变大）→ 从高处落下
        if (k === 1) Hh = 0.12 + 0.85 * arc;
        else if (k === 2) {
          Hh = 0.12 + 0.08 * arc;
          s = {...s, hw: s.hw * (1 + 0.16 * Math.sin(Math.PI * u)), hh: s.hh * (1 - 0.1 * Math.sin(Math.PI * u))};
        } else if (k === 3) {
          Hh = 0.12 + 1.25 * arc;
          s = {...s, hw: s.hw * (1 + 0.2 * arc), hh: s.hh * (1 + 0.2 * arc), r: s.r * (1 + 0.2 * arc)};
        } else {
          Hh = 0.12 + 1.3 * Math.pow(1 - u, 1.6) * Math.min(1, u * 4);
          s = {...s, hw: s.hw * (1 + 0.25 * (1 - u) * Math.min(1, u * 4)), hh: s.hh * (1 + 0.25 * (1 - u) * Math.min(1, u * 4))};
        }
      } else {
        s = shapesK[k];
        m = ERA_M[k];
        // 起跳前压扁（起势）
        if (k < 4) {
          const pre = ease.sine(prog(t, TAKE[k] - 8, 8));
          s = {...s, hw: s.hw * (1 + 0.06 * pre), hh: s.hh * (1 - 0.12 * pre)};
        }
      }
      // 落地：压扁再回弹，液体抖两下
      const L = ERA_LAND(k);
      const sq = wobble(t, L, 0.1, 14, 9);
      s = {...s, hw: s.hw * (1 + sq), hh: s.hh * (1 - 1.2 * sq)};
      if (k === 4) {
        s = {...s, a2: wobble(t, L, 0.1, 13, 12), p2: 0, a3: wobble(t, L + 2, 0.05, 10, 10), p3: 0.7};
        // 去融合的地方：一段滑行
        Hh += 0.45 * Math.sin(Math.PI * prog(t, 516, 36));
      }
      s = {...s, cx: objX(t), cy: 640};
      eraLabels(labels, cam, toScr, t, k, s);
      // 只有液态玻璃落下时会让墙起涟漪（和开场呼应）
      if (t >= ERA_LAND(4)) {
        const rp = toScr(cam, ERA_X(4), 640);
        ripples.push({cx: rp.x, cy: rp.y, age: t - ERA_LAND(4), amp: 12, speed: 22, lambda: 82, decay: 34});
      }
    }
    add(cam, 1, s);
    setM(cam, 1, {...m, height: Hh}, s.cx, s.cy);
  }

  // ═════════ 镜 4 · 融合（548—690）═════════
  const C = MERGE_C;
  const R0 = 110;
  if (t >= 552 && t < 724) {
    const cam = main;
    const sp = land(t, 552, 26);
    const jp = land(t, 600, 30);
    const kk = lerp(64, 30, tw(t, 572, 24));
    const r0 = lerp(170, R0, sp);
    let l = circ(lerp(C.x, C.x - 330, sp), C.y, r0);
    let m0 = circ(C.x, C.y, r0);
    l = {...l, cx: lerp(l.cx, C.x - 118, jp), a2: wobble(t, 566, 0.12, 14, 12), p2: 0, a3: wobble(t, 630, 0.06, 12, 10), p3: 0.4};
    m0 = {...m0, cx: lerp(m0.cx, C.x - 12, jp), a2: wobble(t, 568, 0.1, 15, 12), p2: 1.4};
    if (t < 690) {
      add(cam, 1, l);
      add(cam, 1, m0);
      setM(cam, 1, {...CLEAR, k: kk, height: 0.12}, (l.cx + m0.cx) / 2, C.y);
      mergeSt.gap = m0.cx - l.cx - 2 * R0;
      const a = tw(t, 578, 12) ;
      const pl = toScr(cam, l.cx, l.cy);
      const pm = toScr(cam, m0.cx, m0.cy);
      labels.push({text: '', x: pl.x, y: pl.y, size: 58, icon: 'prev', color: '#0B0C10', alpha: a});
      labels.push({text: '', x: pm.x, y: pm.y, size: 58, icon: 'play', color: '#0B0C10', alpha: a});
    } else {
      // 合成的那块飞去手机，交给手机里的迷你播放条
      const u = tw(t, 690, 34, ease.inOut);
      const tgt = phonePlayerWorld(t);
      const pill = box(lerp((l.cx + m0.cx) / 2, tgt.x, u), lerp(C.y, tgt.y, u), lerp(R0 + 50, tgt.hw, u), lerp(R0, tgt.hh, u), lerp(R0, tgt.hh, u));
      add(cam, 1, pill);
      setM(cam, 1, {...lerpM(CLEAR, LABEL, u), opacity: 1 - tw(t, 716, 8)}, pill.cx, pill.cy);
    }
    // 第三滴：被点一下，长成菜单；再飞去浏览器的导航条
    if (t < 724) {
      const press = Math.sin(Math.PI * prog(t, 626, 10)) * 0.08;
      const gx = land(t, 636, 22);
      const gy = land(t, 642, 26);
      let rt = circ(lerp(C.x, C.x + 330, sp), C.y, lerp(170, R0, sp) * (1 - press), {a2: wobble(t, 566, 0.1, 13, 12), p2: 2.2});
      if (t >= 636) {
        rt = box(lerp(C.x + 330, C.x + 300, gx), lerp(C.y, C.y + 30, gx), lerp(R0, 250, gx), lerp(R0, 220, gy), lerp(R0, 44, gy));
      }
      let mm = lerpM(CLEAR, MENU, gx);
      if (t >= 690) {
        const u = tw(t, 690, 34, ease.inOut);
        // 菜单收进手机的标签栏那一行
        const tgt = phonePlayerWorld(t);
        rt = lerpS(rt, box(tgt.x, tgt.y + 70 * PHONE_W.scale, tgt.hw * 0.8, tgt.hh, tgt.hh), u);
        mm = {...lerpM(MENU, LABEL, u), opacity: 1 - tw(t, 716, 8)};
      }
      add(cam, 2, rt);
      setM(cam, 2, {...mm, k: 0, height: 0.14}, rt.cx, rt.cy);
      const pr = toScr(cam, rt.cx, rt.cy);
      labels.push({text: '', x: pr.x, y: pr.y, size: 58, icon: 'more', color: '#0B0C10', alpha: tw(t, 582, 12) * (1 - tw(t, 636, 6))});
      if (t >= 626) {
        const rp = toScr(cam, C.x + 330, C.y);
        ripples.push({cx: rp.x, cy: rp.y, age: t - 630, amp: 10, speed: 10, lambda: 44, decay: 22});
      }
      const b = tw(t, 650, 14) * (1 - tw(t, 690, 10));
      ['♥   收藏', '↗   分享', '+   加入歌单'].forEach((s, i) => {
        const p = toScr(cam, rt.cx - 196, rt.cy - 104 + i * 104);
        labels.push({text: s, x: p.x, y: p.y + 16, size: 46, weight: 900, color: '#0B0C10', alpha: b * tw(t, 652 + i * 4, 10)});
      });
    }
  }

  // ═════════ 镜 5 · 界面（690—900）═════════
  if (t >= 690 && t < DIVE2.b) {
    const cam = main;
    devices.push(phoneFrame(t, cam, toScr));
    if (t >= 770) devices.push(browserFrame(t, cam, toScr));
  }

  // ═════════ 镜 6 · 第二次穿过玻璃 → 五条规则（896—1064）═════════
  if (t >= 896 && t < DIVE2.b) {
    const cam = main;
    const lc = lensB2(t);
    const u = land(t, 896, 30);
    const p0 = phonePlayerWorld(t);
    const s = lerpS(box(p0.x, p0.y, p0.hw, p0.hh, p0.hh), box(lc.x, lc.y, 520, 300, 150), u);
    const altU = tw(t, 906, 18, ease.sine);
    add(cam, 1, s);
    setM(cam, 1, {...lerpM(LABEL, CLEAR, u), mag: 0.04 * (1 - tw(t, DIVE2.a, 24)), height: lerp(0.1, 0.6, u), alt: altU, caustic: 1 - altU}, s.cx, s.cy);
    if (altU > 0) {
      const k = main.z / DIVE2.z;
      const sc = toScr(cam, s.cx, s.cy);
      alt = {plane: 'A', cx: 960 - (sc.x - W / 2) / k, cy: 1620 - (sc.y - H / 2) / k, z: k};
    }
  }
  if (t >= DIVE2.b) {
    const cam = main;
    // 盖满屏幕的镜片收回成一条横的放大镜，落在第一条规则上，再一拍一条往下走
    // 每条停 21 帧，第 5 条也有足够时间（放大镜在 f1068 才离开）
    const row = (i: number) => 958 + 21 * i;
    let ri = 0;
    for (let i = 1; i < 5; i++) if (t >= row(i)) ri = i;
    const y = lerp(RULE_Y(Math.max(0, ri - 1)), RULE_Y(ri), ri === 0 ? 1 : land(t, row(ri), 16)) - 16;
    rule = t < 1068 ? ri : -1;
    const bar = box(960, y, 800, 84, 84);
    let s: S;
    let m: M = {...CLEAR, mag: 0.12, bevel: 22, height: 0.16};
    if (t < 962) {
      const u = land(t, DIVE2.b, 26);
      const big = box(960, 1620, (520 * DIVE2.z), (300 * DIVE2.z), 150 * DIVE2.z);
      s = lerpS(big, bar, u);
      m = {...m, mag: lerp(0, 0.12, u), bevel: lerp(44, 22, u)};
    } else if (t < 1068) {
      s = bar;
    } else {
      // 片尾：收成一滴，升起（影子和光池离它越来越远），回到右上挂着
      const u = land(t, 1068, 84);
      const hang = circ(HANG.x, HANG.y, HANG.r, hangModes(t));
      s = lerpS(bar, hang, u);
      s = {...s, cx: lerp(960, HANG.x, ease.inOut(prog(t, 1068, 84))), cy: lerp(RULE_Y(4) - 16, HANG.y, ease.inOut(prog(t, 1068, 84)))};
      m = {...CLEAR, mag: lerp(0.12, 0.06, u), bevel: lerp(22, 44, u), height: lerp(0.16, 1, ease.inOut(prog(t, 1072, 78)))};
    }
    add(cam, 1, s);
    setM(cam, 1, m, s.cx, s.cy);
  }

  // ── 光与速度 ──
  const light = rot(BASE_LIGHT, lightAngle(t));
  const groups = mats.map(([m, x, y]) => toGroup(m, x, y));
  return {main, alt, shapes, groups, ripples, light, labels, devices, bend: bendSt, merge: mergeSt, rule, speed: 0};
};

// ───────── 年代按钮上的字 ─────────
const eraLabels = (labels: Label[], cam: Cam, toScr: (c: Cam, x: number, y: number) => {x: number; y: number}, t: number, k: number, s: S) => {
  const a = tw(t, ERA_LAND(k) - 2, 10) * (k < 4 ? 1 - tw(t, TAKE[k], 6) : 1);
  const p = toScr(cam, s.cx, s.cy);
  const x0 = p.x - s.hw * cam.z;
  const y0 = p.y - s.hh * cam.z;
  if (k === 0) labels.push({text: '确定', x: p.x, y: p.y + 15, size: 42, weight: 900, align: 'center', color: '#FFFFFF', alpha: a});
  if (k === 1) {
    labels.push({text: 'Windows Vista', x: x0 + 28, y: y0 + 46, size: 28, weight: 700, family: "'Inter'", color: '#0B0C10', alpha: a});
    labels.push({text: '—   ▢   ✕', x: p.x + s.hw - 28, y: y0 + 46, size: 26, weight: 700, align: 'right', color: '#0B0C10', alpha: a});
  }
  if (k === 2) labels.push({text: '控制中心', x: x0 + 40, y: y0 + 70, size: 36, weight: 900, color: '#0B0C10', alpha: a});
  if (k === 3) {
    labels.push({text: 'Glassmorphism', x: x0 + 40, y: y0 + 70, size: 36, weight: 700, family: "'Inter Display'", color: '#FFFFFF', alpha: a});
    labels.push({text: '$ 4,280.00', x: x0 + 40, y: p.y + s.hh - 48, size: 64, weight: 700, family: "'Inter Display'", color: '#FFFFFF', alpha: a});
  }
};

// ───────── 设备：手机 ─────────
const PHONE_W = {x: UI_CAM - 400, y: 580, scale: 0.98};
const BROWSER_W = {x: UI_CAM + 380, y: 560, scale: 0.94};

const phonePose = (t: number) => {
  const inU = land(t, 690, 42);
  const ry = lerp(deg(58), deg(16), inU) + lerp(0, deg(-24), tw(t, 735, 165, ease.sine));
  const dx = lerp(760, 0, inU);
  return {ry, rx: deg(5), dx, alpha: tw(t, 690, 10)};
};
const phoneScroll = (t: number) =>
  track(t, [[740, 0], [790, 540, ease.out5], [832, 540], [858, 140, ease.inOut], [870, 140], [900, 980, ease.inOut]]);
const phoneMin = (t: number) => clamp(land(t, 770, 22) - land(t, 834, 22), 0, 1);

/** 迷你播放条在“平面 B 坐标”里的位置（菜单飞过去、第二次穿过时从这里起飞） */
function phonePlayerWorld(t: number) {
  const pose = phonePose(Math.max(t, 735));
  const sc = PHONE_W.scale;
  const lx = 210 - 210;
  const ly = 790 - 450;
  return {x: PHONE_W.x + pose.dx + lx * sc * Math.cos(pose.ry), y: PHONE_W.y + ly * sc, hw: 190 * sc * Math.cos(pose.ry), hh: 34 * sc};
}
/** 第二次穿过：镜片从手机里飞出来要停的地方（平面 B） */
function lensB2(t: number) {
  void t;
  return {x: UI_CAM - 120, y: 560};
}

const phoneFrame = (t: number, cam: Cam, toScr: (c: Cam, x: number, y: number) => {x: number; y: number}): DeviceFrame => {
  const pose = phonePose(t);
  const c = toScr(cam, PHONE_W.x + pose.dx, PHONE_W.y);
  const sc = PHONE_W.scale * cam.z;
  const out = tw(t, DIVE2.a - 4, 24);
  const dev: Device = {
    corners: project(c.x, c.y, PHONE.w * sc, PHONE.h * sc, pose.ry + out * deg(30), pose.rx),
    size: [PHONE.w, PHONE.h],
    radius: 56,
    bezel: 14,
    bezelColor: [0.04, 0.045, 0.06],
    sheen: 0.9 - pose.ry * 2.2,
    sheenAmt: 0.55,
    alpha: pose.alpha * (1 - out),
  };
  const scroll = phoneScroll(t);
  const mn = phoneMin(t);
  // 标签栏 + 搜索 + 迷你播放条：一组，靠近就融合；往下滚时标签栏缩成一颗小胶囊、播放条落进同一行
  const tab = box(lerp(150, 58, mn), 852, lerp(128, 34, mn), 34, 34);
  const search = circ(370, 852, 34);
  const player = box(lerp(210, 212, mn), lerp(782, 852, mn), lerp(188, 112, mn), 34, 34);
  const shapes: Shape[] = [];
  const pIn = tw(t, 716, 10);
  for (const s of [tab, search]) shapes.push({...s, group: 0, cx: s.cx, cy: s.cy, hw: s.hw * tw(t, 726, 14, ease.out5), hh: s.hh * tw(t, 726, 14, ease.out5), r: s.r});
  shapes.push({...player, group: 0, hw: player.hw * (0.6 + 0.4 * pIn), hh: player.hh});
  const light = rot(BASE_LIGHT, pose.ry * 1.4);
  const g: GroupMat = toGroup({...LABEL, k: 22, height: 0.1, caustic: 0.3, opacity: pIn}, 210, 820);
  const labels: Label[] = [];
  const la = tw(t, 734, 12);
  ['首页', '新发现', '资料库'].forEach((s, i) =>
    labels.push({text: s, x: 70 + i * 82, y: 861, size: 22, weight: i === 0 ? 900 : 700, align: 'center', color: 'auto', alpha: la * (1 - tw(mn, 0, 0.4)) * (i === 0 ? 1 : 0.75)}),
  );
  labels.push({text: '', x: 58, y: 852, size: 30, icon: 'home', color: 'auto', alpha: la * tw(mn, 0.5, 0.5)});
  labels.push({text: '', x: 370, y: 852, size: 28, icon: 'search', color: 'auto', alpha: la});
  labels.push({text: 'Blue Hour', x: player.cx - player.hw + 26, y: player.cy + 9, size: 25, weight: 900, family: "'Inter Display'", color: 'auto', alpha: pIn * la});
  labels.push({text: '', x: player.cx + player.hw - 34, y: player.cy, size: 28, icon: 'play', color: 'auto', alpha: pIn * la});
  return {kind: 'phone', dev, scroll, shapes, groups: [g], labels, ripples: [], light};
};

const browserFrame = (t: number, cam: Cam, toScr: (c: Cam, x: number, y: number) => {x: number; y: number}): DeviceFrame => {
  const inU = land(t, 770, 40);
  const ry = lerp(deg(-50), deg(-14), inU) + lerp(0, deg(8), tw(t, 810, 90, ease.sine));
  const dx = lerp(520, 0, inU);
  const c = toScr(cam, BROWSER_W.x + dx, BROWSER_W.y);
  const sc = BROWSER_W.scale * cam.z;
  const out = tw(t, DIVE2.a - 6, 24);
  const dev: Device = {
    corners: project(c.x, c.y, BROWSER.w * sc, BROWSER.h * sc, ry - out * deg(30), deg(4)),
    size: [BROWSER.w, BROWSER.h],
    radius: 22,
    bezel: 0,
    bezelColor: [0.9, 0.9, 0.9],
    sheen: 1.1 + ry * 2.0,
    sheenAmt: 0.35,
    alpha: tw(t, 770, 10) * (1 - out),
  };
  const scroll = track(t, [[800, 0], [900, 420, ease.inOut]]);
  const navIn = tw(t, 788, 14);
  const nav = box(500, 84, 300, 30, 30);
  const cta = circ(920, 570, 40);
  const press = Math.sin(Math.PI * prog(t, 856, 10)) * 0.1;
  const shapes: Shape[] = [
    {...nav, group: 0, hw: nav.hw * (0.5 + 0.5 * navIn)},
    {...cta, group: 1, hw: cta.hw * (1 - press) * tw(t, 790, 14, ease.out5), hh: cta.hh * (1 - press) * tw(t, 790, 14, ease.out5), r: cta.r * (1 - press)},
  ];
  const light = rot(BASE_LIGHT, ry * 1.4);
  const groups = [toGroup({...LABEL, k: 0, height: 0.1, caustic: 0.3}, nav.cx, nav.cy), toGroup({...CLEAR, bevel: 26, height: 0.12}, cta.cx, cta.cy)];
  const la = tw(t, 784, 12);
  const labels: Label[] = ['作品', '关于', '订阅'].map((s, i) => ({text: s, x: 300 + i * 200, y: 94, size: 24, weight: 900, align: 'center' as CanvasTextAlign, color: 'auto', alpha: la}));
  labels.push({text: '', x: 920, y: 570, size: 34, icon: 'plus', color: 'auto', alpha: la});
  const ripples: Ripple[] = t >= 860 ? [{cx: 920, cy: 570, age: t - 860, amp: 9, speed: 16, lambda: 52, decay: 26}] : [];
  return {kind: 'browser', dev, scroll, shapes, groups, labels, ripples, light};
};

/** 估计这一帧屏幕上最快的东西：镜头速度 + 玻璃的位移（取前后各半帧） */
export const speedAt = (t: number) => {
  const a = frameAt(t - 0.5);
  const b = frameAt(t + 0.5);
  // 穿过玻璃的那一帧镜头换了平面：坐标不连续，但画面是连续的，不算速度（否则会把两个世界糊在一起）
  if (a.main.plane !== b.main.plane) return 0;
  const cam = Math.hypot((b.main.cx - a.main.cx) * b.main.z, (b.main.cy - a.main.cy) * b.main.z) + Math.abs(b.main.z - a.main.z) * 900;
  let g = 0;
  const n = Math.min(a.shapes.length, b.shapes.length);
  for (let i = 0; i < n; i++) g = Math.max(g, Math.hypot(b.shapes[i].cx - a.shapes[i].cx, b.shapes[i].cy - a.shapes[i].cy) + Math.abs(b.shapes[i].hw - a.shapes[i].hw));
  return Math.max(cam, g);
};
