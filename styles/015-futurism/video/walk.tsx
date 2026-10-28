/**
 * 01 绘画 · 巴拉《拴着皮带的狗的动态》1912  +  02 雕塑 · 波丘尼《空间中连续性的独特形式》1913（84—301）
 *
 * 同一个世界、同一台镜头：
 *   84—118   镜头从 2.4 倍拉回 1 倍；开场留下的 I 变长、变细，成了狗绳
 *   100—124  狗一块块搭出来：身子落下 → 项圈 → 头 → 耳朵 → 尾巴 → 四条腿（落地带 5% 过冲）
 *   126—162  人和狗一起走（加速 12 帧 → 匀速 24 px/帧 → 刹车 12 帧）；镜头锁在狗身上跟拍
 *            残影在“镜头里”算：身子跟镜头一起走，几乎没有残影；腿摆得最快，扇开成巴拉画里的“多腿”
 *            刹车：步态相位冻结、摆幅归零，腿上的残影自己收拢；腿旁的标注实时数层数
 *   178—     狗绳脱手落地；人重新起步、越走越快，镜头拉远上摇到全身（02）
 *   245      定格：时间停住，残影不再褪——凝固成实心的“火焰”（颜色从钴蓝过渡到青铜色阶）
 *   248—260  雕塑被抬起；262 / 275 两块底座从两边滑进来刹停：TUMB · TUMB（每级 ÷ 1.5）
 *   285—301  第一个 TUMB 冲向镜头，T 的竖画撑满画面 → 下一章
 */
import React from 'react';
import {C} from '../tokens';
import {Echoes, H, W, Word, advOf, camT, echoCount, mixHex, wdthOf, zoomLerp} from './kit';
import {iRest, openProbe as openProbeRef} from './opening';
import {Dog, DogPose, DOG_CYCLE, FigPose, Figure, collarOf, dogPaw, joints} from './figure';
import {clamp, ease, follow, kin, land, lerp, path1, prog, thump, vel} from './motion';

export const G = 940; // 地面
const XD0 = 900;
const PW0 = 520;
const TF = 245; // 定格

/* ───────── 轨迹 ───────── */
const DOG_SEGS: [number, number][] = [[126, 2], [138, 0], [150, -2], [162, 0]];
export const dogX = (t: number) => kin(t, XD0, 0, DOG_SEGS);
export const walkerX = (t: number) => kin(Math.min(t, TF), PW0, 0, [...DOG_SEGS, [186, 1.4], [214, 0.7], [234, 0]]);
const walkerV = (t: number) => vel(walkerX, Math.min(t, TF - 0.5));

const BUILD = [100, 112, 106, 109, 113, 118, 119.5, 121, 122.5, 104]; // 身子 头 耳 尾 腿×4 …（索引见 figure.tsx），最后一项是项圈
const dogPose = (t: number): DogPose => {
  const x = dogX(t);
  const v = Math.abs(vel(dogX, t));
  const amp = 0.62 * clamp(v / 12);
  const phase = (2 * Math.PI * (x - XD0)) / DOG_CYCLE;
  const drop = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => land(t, BUILD[i], 16));
  drop[8] = land(t, BUILD[9], 14);
  return {x, y: G, phase, amp, drop, bob: 0};
};

/** 步态相位的起点：让定格那一刻正好是步子迈得最开的时候 */
const FIG_CYCLE = 1800;
const PHI0 = Math.PI / 2 - (2 * Math.PI * (kin(TF, PW0, 0, [...DOG_SEGS, [186, 1.4], [214, 0.7], [234, 0]]) - PW0)) / FIG_CYCLE;
const figPose = (t: number): FigPose => {
  const tt = Math.min(t, TF);
  const x = walkerX(tt);
  const v = walkerV(tt);
  const s = 0.1 + 0.6 * clamp(v / 24, 0, 2.1);
  return {x, ground: G, phase: PHI0 + (2 * Math.PI * (x - PW0)) / FIG_CYCLE, s, lean: 0.06 + 0.2 * clamp(v / 48)};
};

/* ───────── 镜头 ───────── */
const Z0 = 2.4;
type Cam = {cx: number; cy: number; z: number};
/** 开场的 I（屏幕坐标）落在狗绳上 y = 380 的那一点：反推镜头在 2.4 倍时的中心，让 I 原地不动地交接 */
const IREST = (() => {
  const r = iRest();
  const lp = {x: 1091.8, y: 380};
  const mid = (r.x0 + r.x1) / 2;
  return {
    cw: {x: lp.x - (mid - W / 2) / Z0, y: lp.y - (r.y0 - H / 2) / Z0},
    top: lp,
    bot: {x: lp.x, y: lp.y + (r.y1 - r.y0) / Z0},
    w: (r.x1 - r.x0) / Z0,
  };
})();
/** 跟拍锁在狗身上（像画家跟着狗一起走）：身子在画面里不动、没有残影，只有摆动的腿留下残影 */
const dogCam = (t: number): Cam => ({cx: dogX(t) + 60, cy: 540, z: 1});
const figCam = (t: number): Cam => ({cx: follow(walkerX, t, 12, 1) + 60, cy: G - 1080, z: 0.37 * zoomLerp(1, 1.1, ease.inOut(prog(t, 250, 40)))});
export const camAt = (t: number): Cam => {
  if (t < 118) {
    const e = ease.inOut(prog(t, 84, 34));
    const d = dogCam(t);
    return {cx: lerp(IREST.cw.x, d.cx, e), cy: lerp(IREST.cw.y, d.cy, e), z: zoomLerp(Z0, 1, e)};
  }
  if (t < 180) return dogCam(t);
  const e = ease.inOut(prog(t, 180, 40));
  const a = dogCam(t);
  const b = figCam(t);
  return {cx: lerp(a.cx, b.cx, e), cy: lerp(a.cy, b.cy, e), z: zoomLerp(a.z, b.z, e)};
};
const camStr = (c: Cam, dy = 0) => camT(c.cx, c.cy, c.z, 0, 0, dy);
const toScreen = (c: Cam, x: number, y: number) => ({x: (x - c.cx) * c.z + W / 2, y: (y - c.cy) * c.z + H / 2});
const shakeY = (t: number) => thump(t, 262, 10, 14) + thump(t, 275, 8, 14);

/* ───────── 狗绳：I → 绳 → 脱手落地 ───────── */
const hand = (t: number) => ({x: walkerX(Math.min(t, 178)) + 430, y: G - 1240});
const leash = (t: number) => {
  const p = dogPose(t);
  const [cx, cy] = collarOf(p);
  let top = hand(t);
  if (t > 178) {
    const d = t - 178;
    top = {x: top.x + 10 * d, y: Math.min(G - 20, top.y + 0.5 * 2.2 * d * d)};
  }
  const e = ease.inOut(prog(t, 86, 26));
  const a = {x: lerp(IREST.top.x, top.x, e), y: lerp(IREST.top.y, top.y, e)};
  const b = {x: lerp(IREST.bot.x, cx, e), y: lerp(IREST.bot.y, cy, e)};
  const swing = 70 * p.amp * Math.sin(p.phase * 0.5 + 0.7) * e;
  const sag = 40 * e;
  return {a, b, c: {x: (a.x + b.x) / 2 + swing + sag, y: (a.y + b.y) / 2}, w: lerp(IREST.w, 9, e)};
};
const Leash: React.FC<{t: number; fill: string}> = ({t, fill}) => {
  const L = leash(t);
  if (L.w > IREST.w - 1) {
    // 还是 I 的时候：一根实心的竖条（和字母 I 一模一样）
    return <polygon points={`${L.a.x - L.w / 2},${L.a.y} ${L.a.x + L.w / 2},${L.a.y} ${L.b.x + L.w / 2},${L.b.y} ${L.b.x - L.w / 2},${L.b.y}`} fill={fill} />;
  }
  return <path d={`M${L.a.x.toFixed(1)},${L.a.y.toFixed(1)} Q${L.c.x.toFixed(1)},${L.c.y.toFixed(1)} ${L.b.x.toFixed(1)},${L.b.y.toFixed(1)}`} stroke={fill} strokeWidth={L.w} fill="none" strokeLinecap="butt" />;
};

/* ───────── 雕塑：定格后的残影 ───────── */
const SOLID = (k: number) => mixHex(C.ink, C.silver, 0.12 + 0.13 * k);
const lift = (t: number) => -260 * (t < 248 ? 0 : t < 252 ? -0.04 * ease.sine(prog(t, 248, 4)) : -0.04 + 1.04 * land(t, 252, 12));
const footBox = (k: number) => {
  const J = joints(figPose(TF - 3 * k));
  return J;
};
const PLINTH = (() => {
  const J = footBox(0);
  const rear = J.legs.reduce((a, l) => (l.heel[0] < a.heel[0] ? l : a));
  const front = J.legs.reduce((a, l) => (l.toe[0] > a.toe[0] ? l : a));
  return [
    {x0: rear.heel[0] - 120, x1: rear.toe[0] + 60, at: 262, from: -1},
    {x0: front.heel[0] - 60, x1: front.toe[0] + 120, at: 275, from: 1},
  ];
})();
const plinthX = (i: number, t: number) => {
  const p = PLINTH[i];
  return path1(t, [
    [p.at - 11, p.x0 + p.from * 2200, -p.from * 75],
    [p.at, p.x0, 0],
  ]);
};
const Plinth: React.FC<{i: number; t: number; k: number}> = ({i, t, k}) => {
  const p = PLINTH[i];
  if (t < p.at - 11) return null;
  const x = plinthX(i, t);
  const w = p.x1 - p.x0;
  return <rect x={x} y={G - 260} width={w} height={262} fill={k ? C.orange : C.ink} />;
};

/* ───────── TUMB ───────── */
const TUMBS = [
  {at: 262, size: 210, rot: -8, dx: -1},
  {at: 275, size: 140, rot: 7, dx: 1},
];
const tumbPos = (i: number, t: number) => {
  const T = TUMBS[i];
  const p = PLINTH[i];
  const c = camAt(Math.max(T.at, Math.min(t, 300)));
  const src = toScreen(c, i === 0 ? p.x0 : p.x1, G - 260);
  const end = i === 0 ? {x: 170, y: 560} : {x: 1440, y: 430};
  const x = path1(t, [
    [T.at, src.x, T.dx * 70],
    [T.at + 16, end.x, 0],
  ]);
  const y = path1(t, [
    [T.at, src.y, -60],
    [T.at + 16, end.y, 0],
  ]);
  return {x, y};
};
/** 第一个 TUMB 冲向镜头：以 T 的竖画中心为原点，指数放大到 90 倍 */
export const TUMB_ZOOM = (t: number) => zoomLerp(1, 90, ease.in(prog(t, 284, 13)));
const Tumb: React.FC<{i: number; t: number; k: number}> = ({i, t, k}) => {
  const T = TUMBS[i];
  if (t < T.at) return null;
  const p = tumbPos(i, t);
  const v = Math.hypot(vel((u) => tumbPos(i, u).x, t), vel((u) => tumbPos(i, u).y, t));
  const z = i === 0 ? TUMB_ZOOM(t) : 1;
  const wd = wdthOf(v);
  const tW = (advOf('T', wd) / 2) * T.size; // T 的竖画中心（T 左右对称）
  return (
    <g transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${T.rot}) scale(${z.toFixed(4)}) translate(${-tW} ${(0.343 * T.size).toFixed(1)})`}>
      <Word text="TUMB" x={0} y={0} size={T.size} wdth={wd} fill={k ? C.orange : C.ink} />
    </g>
  );
};

/* ───────── 画面 ───────── */
const Ground: React.FC<{c: Cam}> = ({c}) => {
  const x0 = c.cx - W / 2 / c.z - 300;
  const x1 = c.cx + W / 2 / c.z + 300;
  const ticks: number[] = [];
  for (let x = Math.floor(x0 / 260) * 260; x < x1; x += 260) ticks.push(x);
  return (
    <g>
      <rect x={x0} y={G} width={x1 - x0} height={3000} fill={mixHex(C.paper, C.silver, 0.45)} />
      <rect x={x0} y={G - 3} width={x1 - x0} height={6} fill={C.ink} />
      {ticks.map((x) => (
        <rect key={x} x={x} y={G + 30} width={8} height={110} fill={C.ink} opacity={0.35} />
      ))}
    </g>
  );
};

/** 腿旁的实时标注：残影层数（腿 vs 身子） */
const Tags: React.FC<{t: number}> = ({t}) => {
  if (t < 132 || t > 186) return null;
  const c = camAt(t);
  const p = dogPose(t);
  const legs = echoCount(t, legState, 6);
  const body = echoCount(t, bodyState, 6);
  const pa = toScreen(c, p.x + 270, G - 60);
  const pb = toScreen(c, p.x - 200, G - 340);
  const o = clamp((t - 132) / 4) * clamp((186 - t) / 4);
  return (
    <g fontFamily="'Space Mono', monospace" fontWeight={700} fontSize={26} opacity={o}>
      <rect x={pa.x - 8} y={pa.y - 30} width={210} height={42} fill={C.ink} />
      <text x={pa.x + 4} y={pa.y} fill={C.paper}>
        腿 · <tspan fill={C.orange}>{legs}</tspan> 层
      </text>
      <rect x={pb.x - 8} y={pb.y - 30} width={240} height={42} fill={C.ink} />
      <text x={pb.x + 4} y={pb.y} fill={C.paper}>
        身子 · <tspan fill={C.orange}>{body}</tspan> 层
      </text>
    </g>
  );
};

/* 残影的状态向量（屏幕坐标：残影是在镜头里看到的“刚才”） */
const legState = (u: number) => {
  const c = camAt(u);
  const p = dogPose(u);
  return [0, 1, 2, 3].flatMap((i) => {
    const q = dogPaw(p, i);
    const s = toScreen(c, p.x + q[0], p.y + q[1]);
    return [s.x, s.y];
  });
};
const bodyState = (u: number) => {
  const c = camAt(u);
  const p = dogPose(u);
  const s = toScreen(c, p.x, p.y + p.bob - (1 - Math.min(1, p.drop[0])) * 260);
  return [s.x, s.y];
};
const dogState = (u: number) => [...legState(u), ...bodyState(u), ...dogPose(u).drop.map((d) => d * 300)];
const figState = (u: number) => {
  const c = camAt(u);
  const J = joints(figPose(u));
  return [...J.legs.flatMap((l) => [toScreen(c, l.ankle[0], l.ankle[1]).x, toScreen(c, l.ankle[0], l.ankle[1]).y]), toScreen(c, J.hip[0], J.hip[1]).x];
};
const leashState = (u: number) => {
  const c = camAt(u);
  const L = leash(u);
  const s = toScreen(c, L.c.x, L.c.y);
  const b = toScreen(c, L.b.x, L.b.y);
  return [s.x, s.y, b.x, b.y];
};

const FAR_DOG = mixHex(C.ink, C.paper, 0.32);
/** 01 里狗是主角：人只是背景里的灰腿；02 起人变成主角（转黑） */
const walkerInk = (t: number) => mixHex(C.ink, C.paper, 0.5 * (1 - ease.inOut(prog(t, 186, 30))));
const walkerEcho = (t: number) => mixHex(C.silver, C.cobalt, ease.inOut(prog(t, 186, 30)));

export const Walk: React.FC<{t: number}> = ({t}) => {
  const c = camAt(t);
  const dy = shakeY(t);
  const frozen = t >= TF;
  const solid = ease.inOut(prog(t, TF, 12));
  const ly = lift(t);
  return (
    <g>
      <g transform={camStr(c, dy)}>
        <Ground c={c} />
      </g>
      {/* 迈步者（钴蓝残影）：定格前在镜头里取样；定格后残影钉在世界里，跟着雕塑一起被镜头看 */}
      {!frozen && (
        <Echoes
          t={t}
          state={figState}
          render={(u, k) => (
            <g transform={camStr(camAt(u), dy)}>
              <Figure p={figPose(u)} ink={k ? walkerEcho(u) : walkerInk(u)} far={k ? walkerEcho(u) : mixHex(walkerInk(u), C.paper, 0.3)} />
            </g>
          )}
        />
      )}
      {frozen && (
        <g transform={camStr(c, dy)}>
          <g transform={`translate(0 ${ly.toFixed(1)})`}>
            {[6, 5, 4, 3, 2, 1, 0].map((k) => {
              const u = TF - 3 * k;
              const cu = camAt(u);
              const cf = camAt(TF);
              // 定格那一刻在屏幕上的位置 → 换回世界坐标（镜头之后还在动，雕塑要钉在世界里）
              const m = `translate(${cf.cx.toFixed(2)} ${cf.cy.toFixed(2)}) scale(${(1 / cf.z).toFixed(5)}) scale(${cu.z.toFixed(5)}) translate(${(-cu.cx).toFixed(2)} ${(-cu.cy).toFixed(2)})`;
              const col = k ? mixHex(C.cobalt, SOLID(k), solid) : C.ink;
              return (
                <g key={k} transform={m} opacity={k ? lerp(Math.pow(0.6, k), 1, solid) : undefined}>
                  <Figure p={figPose(u)} ink={col} far={k ? col : FAR_DOG} />
                </g>
              );
            })}
          </g>
        </g>
      )}
      {/* 狗绳（橙色残影 = 巴拉画里一根绳摆出的好几道弧） */}
      {t < 240 && (
        <Echoes
          t={t}
          state={leashState}
          eps={1}
          render={(u, k) => (
            <g transform={camStr(camAt(u), dy)}>
              <Leash t={u} fill={k ? C.orange : C.ink} />
            </g>
          )}
        />
      )}
      {t >= 100 && t < 240 && (
        <Echoes
          t={t}
          state={dogState}
          eps={1}
          render={(u, k) => (
            <g transform={camStr(camAt(u), dy)}>
              <Dog p={dogPose(u)} ink={k ? C.orange : C.ink} far={k ? C.orange : FAR_DOG} />
            </g>
          )}
        />
      )}
      {[0, 1].map((i) => (
        <Echoes
          key={i}
          t={t}
          state={(u) => [plinthX(i, u) * c.z]}
          render={(u, k) => (
            <g transform={camStr(c, dy)}>
              <Plinth i={i} t={u} k={k} />
            </g>
          )}
        />
      ))}
      <Tags t={t} />
      {[1, 0].map((i) => (
        <Echoes key={i} t={t} state={(u) => [tumbPos(i, u).x, tumbPos(i, u).y, (i === 0 ? TUMB_ZOOM(u) : 1) * 40]} render={(u, k) => <Tumb i={i} t={u} k={k} />} />
      ))}
      {t >= 296 && <rect width={W} height={H} fill={C.ink} opacity={clamp((t - 296) / 3)} />}
    </g>
  );
};

export const walkProbe = (t: number) => {
  if (t < 118) return openProbeRef(t);
  if (t < 186) {
    const s = legState(t);
    const s1 = legState(t - 1);
    let v = 0;
    for (let i = 0; i < s.length; i += 2) v = Math.max(v, Math.hypot(s[i] - s1[i], s[i + 1] - s1[i + 1]));
    return {v, wdth: wdthOf(v), n: echoCount(t, legState, 3)};
  }
  const s = figState(t);
  const s1 = figState(t - 1);
  let v = 0;
  for (let i = 0; i < 4; i += 2) v = Math.max(v, Math.hypot(s[i] - s1[i], s[i + 1] - s1[i + 1]));
  if (t >= TF) v = 0;
  return {v, wdth: wdthOf(v), n: t >= TF ? 6 : echoCount(t, figState, 3)};
};
export const walkSpeed = (t: number) => walkProbe(t).v;

/** 开场在 I 交接之后跟着这台镜头一起拉远（开场的屏幕坐标 = 镜头在 2.4 倍时的画面）：标题缩小、飞走，不再压在狗身上 */
export const openCam = (t: number) => {
  if (t <= 84) return undefined;
  const a = camAt(84);
  const b = camAt(t);
  const k = b.z / a.z;
  return `translate(${W / 2} ${H / 2}) scale(${k.toFixed(5)}) translate(${(-W / 2 + (a.cx - b.cx) * a.z).toFixed(2)} ${(-H / 2 + (a.cy - b.cy) * a.z).toFixed(2)})`;
};
