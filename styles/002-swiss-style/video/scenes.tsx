/**
 * 002 · Swiss Style —— 场景 6–15s（海报、地铁、五个词、片尾）；0–6s 的开场见 opening.tsx
 * 每个场景自己管进场和退场；SwissStyle.tsx 按时间窗挂载。
 * 衔接靠“红色接力”：每一幕只有一个红色主角，它变形 / 放大 / 收缩，直接变成下一幕的红色主角。
 */
import React from 'react';
import {interpolate, interpolateColors} from 'remotion';
import {E, spr, tween} from '../../../src/lib/anim';
import {C, GRID} from '../tokens';
import {cw, cx, gr, rh, ry, sc, Show, T} from './ui';

type P = {f: number};
type Box = {x: number; y: number; w: number; h: number};
const CAP = 0.729; // Heros Bold 大写字母高度（em）
const FIG = 0.709; // Heros 数字高度（em）
const CJK = 0.85; // 汉字字面顶部距基线（em）
const BOTTOM = ry(GRID.rows - 1) + GRID.module; // 网格底边 966
const W = '#FFFFFF';
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mixBox = (a: Box, b: Box, t: number): Box => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t)});
const FULL: Box = {x: 0, y: 0, w: 1920, h: 1080};
/** 拍点上的一下“弹”：每拍开头为 1，随后指数衰减（1 拍 = 30 帧） */
const pulse = (f: number, dec = 6) => (f < 0 ? 0 : Math.exp(-(f - Math.floor(f / 30) * 30) / dec));

/** 章节起点（帧）——全部落在拍点上 */
export const AT = {grid: 120, type: 240, poster: 360, subway: 480, words: 600, end: 750};

/** 遮罩揭示：内容从自己的框底下升上来；out 之后再从框顶升出去 */
const Rise: React.FC<{f: number; at: number; top: number; h: number; out?: number; dur?: number; children: React.ReactNode}> = ({f, at, top, h, out = 1e9, dur = 16, children}) => {
  const p = tween(f, at, dur, 0, 1, E.out);
  const q = tween(f, out, 12, 0, 1, E.in);
  if (p <= 0.001 || q >= 0.999) return null;
  return (
    <div style={{position: 'absolute', left: 0, top, width: 1920, height: h, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: -top + (1 - p) * h - q * h, width: 1920, height: 1080}}>{children}</div>
    </div>
  );
};

/** 一根从左往右画出来的线；out 之后从左往右收掉 */
const Rule: React.FC<{f: number; at: number; x: number; y: number; w: number; t?: number; color?: string; dur?: number; out?: number}> = ({f, at, x, y, w, t = 2, color = C.ink, dur = 20, out = 1e9}) => {
  const p = tween(f, at, dur, 0, 1, E.out);
  const q = tween(f, out, 12, 0, 1, E.in);
  if (p <= 0 || q >= 1) return null;
  return <div style={{position: 'absolute', left: x + w * q, top: y, width: w * (p - q), height: t, background: color}} />;
};

/* ═══════════════════════ 共用：开场的红方块（开场本身见 opening.tsx） ═══════════════════════ */
export const R0: Box = {x: cx(9), y: ry(0), w: cw(3), h: rh(3)}; // 红方块：右上 3×3 模块
const DROP = {damping: 14, mass: 0.8, stiffness: 150}; // 约 13 帧落地
/* ═══════════════════════ 字体 → 海报：镜头扎进红色的 a（字体层见 opening.tsx） ═══════════════════════ */
export const TY = {S: 968, base: ry(4) + GRID.module}; // 字体层：大写高度 = 5 个模块（706），基线 820
export const RED_A = AT.type + 90; // 330：a 变红
/** 镜头推进：从 a 的笔画最粗处一路扎进去，红色铺满全屏，正好接上第一张红海报 */
export const ZOOM = {at: AT.type + 96, dur: 24, x: 1149, y: 700, max: 60}; // 焦点：a 的碗和竖笔相接处，笔画最粗（半径 76）
export const zoomScale = (f: number) => {
  if (f < RED_A || f >= AT.poster) return 1;
  const back = 1 - 0.02 * tween(f, RED_A, 6, 0, 1, E.out); // 扎进去之前先往后收一点
  const p = Math.min(1, Math.max(0, (f - ZOOM.at) / ZOOM.dur));
  return back * Math.exp(Math.log(ZOOM.max) * p * p);
};
/** 推进的同时把焦点摇到画面正中 */
export const zoomPan = (f: number) => {
  const p = f >= AT.poster ? 0 : tween(f, ZOOM.at, ZOOM.dur, 0, 1, E.inOut);
  return {x: (960 - ZOOM.x) * p, y: (540 - ZOOM.y) * p};
};

/* ═══════════════════════ 03 海报：每张占 4 栏（560 × 852），内部再分 4 栏 ═══════════════════════ */
export const PW = cw(4); // 560
export const PH = rh(6); // 852
const PM = 32; // 海报边距
const pcx = (i: number) => PM + i * 127; // 海报 4 栏：栏宽 115，间距 12
const PIN = PW - PM; // 版心右边 528
const PB = PH - PM; // 版心底边 820
const slotX = (s: number) => cx(s * 4);

/** 海报槽位：海报从槽位下面升上来，out 之后从槽位底下沉下去 */
const Slot: React.FC<{f: number; s: number; at: number; out?: number; children: React.ReactNode}> = ({f, s, at, out = 1e9, children}) => {
  const p = tween(f, at, 18, 0, 1, E.out);
  const q = tween(f, out, 14, 0, 1, E.in);
  if (p <= 0.001 || q >= 0.999) return null;
  return (
    <div style={{position: 'absolute', left: slotX(s), top: ry(0), width: PW, height: PH, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: (1 - p) * PH + q * PH, width: PW, height: PH}}>{children}</div>
    </div>
  );
};

/** 一：红底巨字，断字换行（巴塞尔式） */
const PosterTypo: React.FC<{f: number; at: number}> = ({f, at}) => {
  const S = 180;
  return (
    <div style={{position: 'absolute', inset: 0, background: C.red}}>
      {['Typo-', 'gra-', 'fie'].map((w, i) => (
        <Rise key={w} f={f} at={at + 10 + i * 5} top={PM + i * 158 - 10} h={158} dur={16}>
          <T x={PM - 0.014 * S} y={PM + Math.round(CAP * S) + i * 158} size={S} style={{...gr(S, 700, -0.035), color: W}}>{w}</T>
        </Rise>
      ))}
      <Show f={f} at={at + 28} dy={10}>
        {['Ausstellung', 'Basel', '4.–28. Juni'].map((t, i) => (
          <T key={t} x={pcx(2)} y={PB - (2 - i) * 24} size={20} style={{...gr(20, 700, 0), color: C.ink}}>{t}</T>
        ))}
      </Show>
    </div>
  );
};

/** 二：白底点阵，圆从小到大（构成式），一个红点；成形后每拍一圈涟漪 */
const PosterDots: React.FC<{f: number; at: number}> = ({f, at}) => (
  <div style={{position: 'absolute', inset: 0, background: W, boxShadow: 'inset 0 0 0 1px rgba(17,17,17,0.1)'}}>
    {Array.from({length: 16}, (_, n) => {
      const i = n % 4;
      const j = Math.floor(n / 4);
      const d = 115 * (0.22 + 0.78 * ((i + j) / 6));
      const p = spr(f, at + 8 + (i + j) * 3, {damping: 12, mass: 0.6, stiffness: 190}, 30);
      const ripple = f > at + 26 ? 0.14 * pulse(f - (i + j) * 2, 6) : 0;
      const red = i === 1 && j === 2;
      return (
        <div key={n} style={{position: 'absolute', left: pcx(i) + 57.5 - d / 2, top: PM + j * 127 + 57.5 - d / 2, width: d, height: d, borderRadius: '50%', background: red ? C.red : C.ink, transform: `scale(${p * (1 + ripple)})`}} />
      );
    })}
    <Show f={f} at={at + 16} dy={20}>
      <T x={PM - 0.059 * 80} y={652} size={80} lh={84} style={{...gr(80, 700, -0.03), color: C.ink}}>
        konkrete
        <br />
        kunst
      </T>
    </Show>
    <Show f={f} at={at + 24} dy={10}>
      {['Zürich', 'Helmhaus', 'März 1960'].map((t, i) => (
        <T key={t} x={pcx(2)} y={736 - (2 - i) * 24} size={20} style={{...gr(20, 700, 0), color: C.ink}}>{t}</T>
      ))}
    </Show>
  </div>
);

/** 三：黑底同心圆弧，一圈红；圆弧边画边转，像一张唱片 */
const ARC_C = {x: PIN, y: PM}; // 圆心：版心右上角
const RINGS = [
  [69, 11, 90, 180],
  [104, 20, 96, 180],
  [138, 8, 90, 164],
  [171, 24, 104, 180],
  [206, 9, 90, 172],
  [242, 17, 90, 180], // 红
  [277, 6, 112, 180],
  [311, 22, 90, 158],
  [346, 9, 98, 180],
  [381, 15, 90, 170],
  [415, 6, 120, 180],
  [448, 19, 90, 150],
] as const;
const SPIN = [0.5, -0.32, 0.62, -0.45, 0.36, -0.58, 0.44, -0.3, 0.26, -0.4, 0.34, -0.22]; // 每圈的转速（度 / 帧）
const RED_RING = 5;
const arcPath = (r: number, a0: number, a1: number) => {
  const pt = (a: number) => [ARC_C.x + r * Math.cos((a * Math.PI) / 180), ARC_C.y + r * Math.sin((a * Math.PI) / 180)];
  const [x0, y0] = pt(a0);
  const [x1, y1] = pt(a1);
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
};
const PT = {size: 80, l1: 736, l2: PB}; // 标题两行基线
const INFO = ['Zürich', '12. März 1958', '20.15 Uhr'];

const PosterArcs: React.FC<{f: number; at: number}> = ({f, at}) => {
  const draw = tween(f, at + 4, 40, 0, 1, E.inOut);
  return (
    <div style={{position: 'absolute', inset: 0, background: C.night}}>
      <svg width={PW} height={PH} style={{position: 'absolute', inset: 0}}>
        {RINGS.map(([r, w, a0, a1], i) => {
          const len = ((a1 - a0) * Math.PI * r) / 180;
          const p = Math.min(1, Math.max(0, draw * 1.6 - i * 0.05));
          const rot = (f - at) * SPIN[i];
          return (
            <path key={i} d={arcPath(r, a0, a1)} transform={`rotate(${rot.toFixed(3)} ${ARC_C.x} ${ARC_C.y})`} fill="none" stroke={i === RED_RING ? C.red : C.paper} strokeWidth={w} strokeDasharray={`${len} ${len}`} strokeDashoffset={len * (1 - p)} />
          );
        })}
      </svg>
      <Show f={f} at={at + 16} dy={20}>
        <T x={PM - 0.068 * PT.size} y={PT.l1} size={PT.size} lh={84} style={{...gr(PT.size, 700, -0.03), color: C.paper}}>
          Neue
          <br />
          Musik
        </T>
      </Show>
      <Show f={f} at={at + 24} dy={10}>
        {INFO.map((t, i) => (
          <T key={t} x={pcx(2)} y={PT.l2 - (INFO.length - 1 - i) * 24} size={20} style={{...gr(20, 700, 0), color: C.paper}}>{t}</T>
        ))}
      </Show>
    </div>
  );
};

const S0: Box = {x: slotX(0), y: ry(0), w: PW, h: PH};
const P3: Box = {x: slotX(2), y: ry(0), w: PW, h: PH};
const BAND: Box = {x: 0, y: ry(0), w: 1920, h: rh(2)}; // 地铁标识带：第三张海报会拉成这个形状
export const MORPH = AT.subway - 10; // 470：黑海报开始拉成标识带
export const P1_AT = AT.poster - 2; // 358：全屏的红接管画面
/** 第一张海报：从全屏的红收缩进第一个槽位 */
export const p1Box = (f: number) => mixBox(FULL, S0, tween(f, AT.poster, 26, 0, 1, E.out));

export const Posters: React.FC<P> = ({f}) => {
  const P = AT.poster;
  const OUT = AT.subway - 14; // 466
  const m = tween(f, MORPH, 20, 0, 1, E.inOut);
  const b1 = p1Box(f);
  const q1 = tween(f, OUT, 14, 0, 1, E.in);
  return (
    <>
      {q1 < 0.999 && (
        <div style={{position: 'absolute', left: b1.x, top: b1.y, width: b1.w, height: b1.h, overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 0, top: q1 * b1.h, width: b1.w, height: b1.h}}>
            <PosterTypo f={f} at={P} />
          </div>
        </div>
      )}
      <Slot f={f} s={1} at={P + 30} out={OUT + 4}>
        <PosterDots f={f} at={P + 30} />
      </Slot>
      {m <= 0 ? (
        <Slot f={f} s={2} at={P + 60}>
          <PosterArcs f={f} at={P + 60} />
        </Slot>
      ) : (
        (() => {
          const b = mixBox(P3, BAND, m);
          return (
            <div style={{position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, overflow: 'hidden', background: interpolateColors(m, [0, 1], [C.night, '#000000'])}}>
              <div style={{position: 'absolute', left: 0, top: 0, width: PW, height: PH, opacity: 1 - tween(f, MORPH, 8)}}>
                <PosterArcs f={f} at={P + 60} />
              </div>
            </div>
          );
        })()
      )}
    </>
  );
};

/* ═══════════════════════ 04 纽约地铁：黑海报拉成 1970 年的地铁标识带，第二块牌子从右边滑进来 ═══════════════════════ */
const MTA = {red: '#EE352E', purple: '#B933AD', green: '#00933C'};
export const EXPAND = AT.words - 16; // 584：第一条标识带铺满全屏，变成下一幕的黑底
const B2X = cx(3); // 第二块牌子的左边

const Bullet: React.FC<{f: number; at: number; n: string; color: string; x: number; y: number}> = ({f, at, n, color, x, y}) => {
  const p = spr(f, at, {damping: 12, mass: 0.6, stiffness: 200}, 30);
  if (p <= 0.001) return null;
  const d = GRID.module;
  return (
    <div style={{position: 'absolute', left: x, top: y - d / 2, width: d, height: d, borderRadius: '50%', background: color, transform: `scale(${p})`}}>
      <T x={0} y={d / 2 + (CAP * 80) / 2} size={80} style={{...gr(80, 700, 0), color: W, width: d, textAlign: 'center'}}>{n}</T>
    </div>
  );
};

/** 一块标识牌的内容（页面坐标）：顶部白线 + 线路圆标 + 站名 */
const SignContent: React.FC<{f: number; at: number; box: Box; bullets: [string, string][]; x0: number; name: React.ReactNode; sub: string; size: number}> = ({f, at, box, bullets, x0, name, sub, size}) => {
  const mid = box.y + 18 + (box.h - 18) / 2;
  return (
    <>
      <Rule f={f} at={at} x={box.x} y={box.y + 14} w={box.w} t={4} color={W} dur={22} />
      {bullets.map(([n, c], i) => (
        <Bullet key={n} f={f} at={at + 2 + i * 4} n={n} color={c} x={cx(x0 + i)} y={mid} />
      ))}
      <Rise f={f} at={at + 10} top={box.y + 20} h={box.h - 20}>
        <T x={cx(x0 + bullets.length) - 0.014 * size} y={box.y + 150} size={size} style={{...gr(size, 700, -0.005), color: W}}>{name}</T>
        <T k="gr400" x={cx(x0 + bullets.length) - 0.02 * 46} y={box.y + 216} size={46} style={{...gr(46, 400, 0), color: W}}>{sub}</T>
      </Rise>
    </>
  );
};

export const Subway: React.FC<P> = ({f}) => {
  const t0 = AT.subway;
  const e = tween(f, EXPAND, 16, 0, 1, E.inOut);
  const b = mixBox(BAND, FULL, e);
  const fade = 1 - tween(f, EXPAND, 8);
  const p2 = tween(f, t0 + 30, 22, 0, 1, E.out);
  const B2: Box = {x: B2X, y: ry(2), w: 1920 - B2X, h: rh(2)};
  return (
    <>
      {/* 左：年份 + 名字 + 署名 */}
      <Rise f={f} at={t0 + 40} top={ry(2) - 10} h={130}>
        <T x={cx(0) - 0.068 * 150} y={ry(2) + Math.round(FIG * 150)} size={150} style={{...gr(150, 700, -0.03), color: C.ink}}>1970</T>
      </Rise>
      <Show f={f} at={t0 + 46} dy={14}>
        <T k="sc" x={cx(0) - 2} y={ry(3) + Math.round(CJK * 44)} size={44} style={{...sc(44, 700, 0.02), color: C.ink}}>纽约地铁标识</T>
      </Show>
      <Show f={f} at={t0 + 52} dy={10}>
        <T k="gr400" x={cx(0)} y={BOTTOM - 34} size={24} style={{...gr(24, 400, 0), color: C.ink}}>Massimo Vignelli · Bob Noorda</T>
        <T k="gr400" x={cx(0)} y={BOTTOM - 4} size={24} style={{...gr(24, 400, 0), color: C.grey}}>Unimark International</T>
      </Show>
      {/* 第二块牌子：从右边整块滑进来 */}
      {p2 > 0.001 && (
        <div style={{position: 'absolute', left: B2.x, top: B2.y, width: B2.w, height: B2.h, overflow: 'hidden', transform: `translateX(${(1 - p2) * B2.w}px)`, background: '#000000'}}>
          <div style={{position: 'absolute', left: -B2.x, top: -B2.y, width: 1920, height: 1080}}>
            <SignContent f={f} at={t0 + 38} box={B2} x0={4} size={100}
              bullets={[['4', MTA.green], ['5', MTA.green], ['6', MTA.green]]} name="Grand Central" sub="Downtown & Brooklyn" />
          </div>
        </div>
      )}
      {/* 第一块牌子（第三张海报拉成的），最后铺满全屏 */}
      {f >= MORPH + 20 && (
        <div style={{position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, overflow: 'hidden', background: '#000000'}}>
          <div style={{position: 'absolute', left: -b.x, top: -b.y, width: 1920, height: 1080, opacity: fade}}>
            <SignContent f={f} at={t0 + 10} box={BAND} x0={0} size={112}
              bullets={[['1', MTA.red], ['2', MTA.red], ['3', MTA.red], ['7', MTA.purple]]}
              name={<>Times Sq<span style={{margin: '0 0.03em'}}>–</span>42 St</>} sub="Uptown & The Bronx" />
          </div>
        </div>
      )}
    </>
  );
};

/* ═══════════════════════ 05 五个词：一拍一个，底色在拍点上翻；每个词自己演示自己 ═══════════════════════ */
export const WORD_AT = [600, 630, 660, 690, 720];
export const WORD_BG = ['#000000', C.red, C.paper, C.ink, C.paper];

/** 一层网格线，刷得更快（用在深色底上） */
const FastGrid: React.FC<{f: number; at: number; color: string}> = ({f, at, color}) => {
  const H = rh(GRID.rows);
  return (
    <>
      {Array.from({length: GRID.cols}, (_, i) => {
        const p = tween(f, at + i, 12, 0, 1, E.out);
        return [0, GRID.module].map((dx) => <div key={`c${i}-${dx}`} style={{position: 'absolute', left: cx(i) + dx - (dx ? 1 : 0), top: GRID.my, width: 1, height: H * p, background: color}} />);
      })}
      {Array.from({length: GRID.rows}, (_, j) => {
        const p = tween(f, at + 4 + j, 14, 0, 1, E.out);
        return [0, GRID.module].map((dy) => <div key={`r${j}-${dy}`} style={{position: 'absolute', left: GRID.mx, top: ry(j) + dy - (dy ? 1 : 0), width: cw(GRID.cols) * p, height: 1, background: color}} />);
      })}
    </>
  );
};

/** 一张词卡：新底色在拍点前 10 帧开始擦进来（单数从下往上，双数从右往左），内容一直缓缓推近 */
const Card: React.FC<{f: number; k: number; children: React.ReactNode}> = ({f, k, children}) => {
  const a = WORD_AT[k];
  const p = k === 0 ? 1 : tween(f, a - 10, 10, 0, 1, E.inOut);
  const fromRight = k % 2 === 0;
  const c = ((1 - p) * 100).toFixed(3);
  const clip = fromRight ? `inset(0 0 0 ${c}%)` : `inset(${c}% 0 0 0)`;
  const sh = (1 - p) * 240;
  const drift = 1 + 0.04 * Math.min(1, Math.max(0, (f - a + 10) / 50));
  return (
    <div style={{position: 'absolute', inset: 0, clipPath: clip, background: WORD_BG[k], overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${fromRight ? sh : 0}px, ${fromRight ? 0 : sh}px) scale(${drift})`, transformOrigin: `${cx(0)}px 540px`}}>{children}</div>
    </div>
  );
};

const Zh: React.FC<{x?: number; top: number; size: number; color: string; children: React.ReactNode}> = ({x = cx(0), top, size, color, children}) => (
  <T k="sc" x={x - 0.02 * size} y={top + CJK * size} size={size} style={{...sc(size, 900, 0), color}}>{children}</T>
);

const CARDS: ((f: number, a: number) => React.ReactNode)[] = [
  // 网格：黑底白线，词卡在 4 行 × 8 栏里，一个红模块
  (f, a) => (
    <>
      <FastGrid f={f} at={a - 4} color="rgba(255,255,255,0.2)" />
      <Rise f={f} at={a} top={ry(1) - 20} h={rh(4) + 70} dur={14}>
        <Zh top={ry(1)} size={560} color={W}>网格</Zh>
      </Rise>
      <Show f={f} at={a + 4} dy={12}>
        <T x={cx(9) - 0.07 * 48} y={ry(0) + Math.round(CAP * 48)} size={48} style={{...gr(48, 700, -0.02), color: W}}>Raster</T>
        <T k="gr400" x={cx(9)} y={ry(0) + 82} size={28} style={{...gr(28, 400, 0), color: 'rgba(255,255,255,0.6)'}}>12 × 6</T>
      </Show>
      <div style={{position: 'absolute', left: cx(10), top: ry(4), width: GRID.module, height: GRID.module, background: C.red, transform: `scale(${spr(f, a + 6, {damping: 12, mass: 0.6, stiffness: 200}, 30)})`}} />
    </>
  ),
  // 无衬线：红底白字，上面是拉丁字母的无衬线
  (f, a) => (
    <>
      <Rise f={f} at={a - 6} top={ry(0) - 12} h={176}>
        <T x={cx(0) - 0.03 * 200} y={ry(0) + Math.round(CAP * 200)} size={200} style={{...gr(200, 700, -0.035), color: W}}>Grotesk</T>
      </Rise>
      <Rise f={f} at={a - 4} top={ry(3) - 20} h={rh(3) + 60} dur={14}>
        <Zh top={ry(3)} size={400} color={W}>无衬线</Zh>
      </Rise>
      <Show f={f} at={a} dy={12}>
        <T k="gr400" x={cx(9)} y={ry(0) + 26} size={36} style={{...gr(36, 400, 0), color: W}}>Sans-serif</T>
        <T k="gr400" x={cx(9)} y={ry(0) + 70} size={24} style={{...gr(24, 400, 0), color: 'rgba(255,255,255,0.75)'}}>Akzidenz · Univers · Helvetica</T>
      </Show>
    </>
  ),
  // 左对齐：一根红色的左边线，几行字从右边飞回来贴齐，右边自然参差
  (f, a) => (
    <>
      <div style={{position: 'absolute', left: cx(0) - 30, top: ry(0), width: 6, height: (BOTTOM - ry(0)) * tween(f, a - 6, 18, 0, 1, E.out), background: C.red}} />
      <Rise f={f} at={a - 6} top={ry(0) - 16} h={rh(2) + 30} dur={14}>
        <Zh top={ry(0)} size={300} color={C.ink}>左对齐</Zh>
      </Rise>
      {['linksbündig,', 'Flattersatz,', 'Klarheit.'].map((w, i) => {
        const dx = (1 - tween(f, a - 2 + i * 3, 16, 0, 1, E.out)) * 1200;
        return (
          <div key={w} style={{position: 'absolute', inset: 0, transform: `translateX(${dx}px)`}}>
            <T x={cx(0) - 0.02 * 104} y={ry(3 + i) + Math.round(CAP * 104)} size={104} style={{...gr(104, 700, -0.03), color: C.ink}}>{w}</T>
          </div>
        );
      })}
    </>
  ),
  // 不对称：一个出血的红圆压在右上，字缩在左下
  (f, a) => {
    const p = spr(f, a - 6, {damping: 13, mass: 0.7, stiffness: 160}, 40);
    const d = 1000;
    return (
      <>
        <div style={{position: 'absolute', left: cx(10) + 61 - d / 2, top: ry(1) + 61 - d / 2, width: d, height: d, borderRadius: '50%', background: C.red, transform: `scale(${p})`}} />
        <Rise f={f} at={a - 2} top={ry(4) - 20} h={rh(2) + 70} dur={14}>
          <Zh top={ry(4)} size={250} color={W}>不对称</Zh>
        </Rise>
        <Show f={f} at={a + 2} dy={12}>
          <T x={cx(0) - 0.07 * 48} y={ry(0) + Math.round(CAP * 48)} size={48} style={{...gr(48, 700, -0.02), color: W}}>Asymmetrie</T>
        </Show>
      </>
    );
  },
  // 客观：前面四个都很大声，这一个安安静静
  (f, a) => (
    <>
      <Rise f={f} at={a - 4} out={AT.end - 12} top={ry(1) - 16} h={rh(2) + 20} dur={14}>
        <Zh top={ry(1)} size={200} color={C.ink}>客观</Zh>
      </Rise>
      <Show f={f} at={a} out={AT.end - 16} dy={12}>
        <T x={cx(0) - 0.07 * 44} y={ry(3) + Math.round(CAP * 44)} size={44} style={{...gr(44, 700, -0.02), color: C.grey}}>Sachlichkeit</T>
      </Show>
    </>
  ),
];

export const Words: React.FC<P> = ({f}) => (
  <>
    {WORD_AT.map((a, k) => {
      const next = WORD_AT[k + 1] ?? 1e9;
      if (f < (k ? a - 10 : a) || f >= next + 1) return null;
      return (
        <Card key={k} f={f} k={k}>
          {CARDS[k](f, a)}
        </Card>
      );
    })}
  </>
);

/* ═══════════════════════ 片尾：红方块落回右上角，版式和开场一样落在网格上 ═══════════════════════ */
export const End: React.FC<P> = ({f}) => {
  const t0 = AT.end;
  const drop = spr(f, t0 - 13, DROP, 40); // 第 750 帧落地
  const sqY = interpolate(drop, [0, 1], [-rh(3) - 40, R0.y]);
  const S = 167; // 大写高度 = 1 个模块
  return (
    <>
      <div style={{position: 'absolute', left: R0.x, top: sqY, width: R0.w, height: R0.h, background: C.red}} />
      <Rise f={f} at={t0 + 4} top={ry(0) - 8} h={rh(1) + 16 + 0.22 * S}>
        <T x={cx(0) - 0.032 * S} y={ry(0) + Math.round(CAP * S)} size={S} style={{...gr(S, 700, -0.03), color: C.ink}}>Swiss Style</T>
      </Rise>
      <Show f={f} at={t0 + 10} dy={16}>
        <T k="sc" x={cx(0) - 3} y={ry(1) + 24 + Math.round(CJK * 72)} size={72} style={{...sc(72, 900, 0.04), color: C.ink}}>瑞士国际主义</T>
      </Show>
      <Show f={f} at={t0 + 18} dy={14}>
        <T k="sc" x={cx(0) - 1} y={ry(3) + Math.round(CJK * 48)} size={48} style={{...sc(48, 700, 0.03), color: C.ink}}>
          一张网格，一种字体，<span style={{color: C.red}}>一种红。</span>
        </T>
      </Show>
      <Rule f={f} at={t0 + 26} x={cx(0)} y={ry(5)} w={cw(12)} t={3} />
      <Show f={f} at={t0 + 32} dy={12}>
        <T x={cx(0)} y={916} size={30} style={{...gr(30, 700, -0.01), color: C.ink}}>
          Design Style<span style={{...sc(26, 500, 0.04), marginLeft: 14}}>风格</span>
          <span style={{marginLeft: 8}}>002</span>
        </T>
        <T k="gr400" x={cx(5)} y={916} size={30} style={{...gr(30, 400, 0), color: C.ink}}>@guanmo_ai</T>
        <T k="gr400" x={cx(9)} y={916} size={24} style={{...gr(24, 400, 0), color: C.grey}}>github.com/guanmo-ai/design-style</T>
      </Show>
    </>
  );
};
