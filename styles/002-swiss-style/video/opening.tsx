/**
 * 002 · Swiss Style —— 开场 0–5.6s（v4）
 *   0.0–0.5s  波     72 个模块沿对角线一闪而过；右上 9 个红模块留下，合成红方块（第 30 帧落地）
 *   0.5–2.0s  标题   Swiss / Style 逐字母升起，信息栏落在网格上
 *   2.0–3.7s  机器   同一组元素每拍重排一次：12 栏 = 2 × 6 = 3 × 4 = 4 × 3 = 6 × 2；
 *                    红色色块宽度 = 12 / n 栏，压在红上的字自动反白（套印）
 *   3.7–5.6s  甩镜   整版甩出画面，镜头沿 968px 的 Helvetica 一路滑过去，停在 a 上，a 变红，镜头扎进去
 * 机器层和字体层在同一个“世界”里，镜头只做水平移动；网格线固定在屏幕上，像取景框。
 */
import React from 'react';
import {E, tween} from '../../../src/lib/anim';
import {C, GRID} from '../tokens';
import {cw, cx, gr, rh, ry, sc, T} from './ui';
import {AT, R0, RED_A, TY} from './scenes';

type CSS = React.CSSProperties;
type P = {f: number};
const CAP = 0.729; // Heros Bold 大写高度（em）
const FIG = 0.724; // Heros Bold 数字高度（含过冲）
const CJK = 0.85;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const c01 = (t: number) => Math.min(1, Math.max(0, t));

/* ═══════════════ 波：0–34 ═══════════════ */
const RED_CELL = (i: number, j: number) => i >= 9 && j <= 2;
export const Wave: React.FC<P> = ({f}) => {
  const cells: React.ReactNode[] = [];
  for (let j = 0; j < GRID.rows; j++) {
    for (let i = 0; i < GRID.cols; i++) {
      const t0 = -9 + (i + j) * 1.7;
      const grow = tween(f, t0, 7, 0, 1, E.out);
      if (RED_CELL(i, j)) {
        if (f >= 30 || grow <= 0) continue;
        // 22–30：9 个红模块吞掉间距，合成 R0（每格 138）
        const m = tween(f, 22, 8, 0, 1, E.in);
        const S = R0.w / 3;
        const x = lerp(cx(i), R0.x + (i - 9) * S, m);
        const y = lerp(ry(j), R0.y + j * S, m);
        const s = lerp(GRID.module, S, m) * grow;
        const w = lerp(GRID.module, S, m);
        cells.push(<div key={`${i}-${j}`} style={{position: 'absolute', left: x + (w - s) / 2, top: y + (w - s) / 2, width: s + (m > 0.98 ? 0.6 : 0), height: s + (m > 0.98 ? 0.6 : 0), background: C.red}} />);
        continue;
      }
      const s = GRID.module * grow * (1 - tween(f, t0 + 7, 9, 0, 1, E.in));
      if (s < 0.5) continue;
      cells.push(<div key={`${i}-${j}`} style={{position: 'absolute', left: cx(i) + (GRID.module - s) / 2, top: ry(j) + (GRID.module - s) / 2, width: s, height: s, background: C.ink}} />);
    }
  }
  return <>{cells}</>;
};

/* ═══════════════ 机器：同一组元素，五种版式 ═══════════════ */
const LAY_AT = [0, 120, 150, 180, 210];
type Box4 = [number, number, number, number]; // 栏, 行, 栏数, 行数
type El = [number, number, number]; // 栏, 大写顶部所在行, 字号
type Info = [number, number]; // 栏, 第一行基线
const L: {red: Box4; n: number; ds: number; sw: El; st: El; rule: [number, number, number]; i1: Info; i2: Info; i3: Info}[] = [
  {red: [9, 0, 3, 3], n: 0, ds: 0, sw: [0, 0, 368], st: [0, 2, 368], rule: [0, 5, 12], i1: [0, 916], i2: [5, 916], i3: [9, 904]},
  {red: [6, 0, 6, 6], n: 2, ds: 600, sw: [2, 0, 368], st: [3, 2, 368], rule: [0, 5, 12], i1: [0, 916], i2: [3, 916], i3: [6, 904]},
  {red: [4, 0, 4, 6], n: 3, ds: 600, sw: [0, 0, 168], st: [0, 1, 168], rule: [0, 2, 4], i1: [8, 162], i2: [8, 447], i3: [8, 727]},
  {red: [0, 3, 3, 3], n: 4, ds: 300, sw: [3, 0, 368], st: [3, 2, 368], rule: [3, 5, 9], i1: [3, 916], i2: [6, 916], i3: [9, 904]},
  {red: [10, 0, 2, 2], n: 6, ds: 150, sw: [0, 0, 168], st: [2, 1, 168], rule: [0, 3, 12], i1: [0, 624], i2: [4, 617], i3: [8, 605]},
];
/** 每拍重排：最快的一刻落在拍点上；d 为各元素的错峰（帧） */
const lay = (f: number, d: number, vals: number[]) => {
  let v = vals[0];
  for (let k = 1; k < vals.length; k++) {
    const p = tween(f, LAY_AT[k] - 9 + d, 16, 0, 1, E.inOut);
    if (p <= 0) break;
    v = lerp(vals[k - 1], vals[k], p);
  }
  return v;
};
const D = {red: 0, sw: 1, rule: 2, num: 2, st: 3, i1: 4, i2: 5, i3: 6};
const redBox = (f: number) => ({
  x: lay(f, D.red, L.map((l) => cx(l.red[0]))),
  y: lay(f, D.red, L.map((l) => ry(l.red[1]))),
  w: lay(f, D.red, L.map((l) => cw(l.red[2]))),
  h: lay(f, D.red, L.map((l) => rh(l.red[3]))),
});

/** 一个词：逐字母从遮罩里升起；字号用 transform 缩放（基准 368，大写高度 = 2 个模块） */
const BS = 368;
const LH = 478;
const CAP_OFF = (LH - (1.125 + 0.307) * BS) / 2 + 1.125 * BS - CAP * BS; // 行框顶部 → 大写顶部
const Word: React.FC<{f: number; text: string; at: number; x: number; y: number; size: number; color: string}> = ({f, text, at, x, y, size, color}) => {
  const done = f > at + text.length * 2.5 + 18;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `scale(${size / BS})`, transformOrigin: '0 0'}}>
      <div style={{position: 'absolute', left: -0.032 * BS, top: -CAP_OFF, height: LH, overflow: done ? 'visible' : 'hidden', ...gr(BS, 700, -0.035), lineHeight: `${LH}px`, color}}>
        {text.split('').map((ch, i) => {
          const p = tween(f, at + i * 2.5, 16, 0, 1, E.out);
          return (
            <span key={i} style={{display: 'inline-block', transform: p < 1 ? `translateY(${(1 - p) * LH * 0.8}px)` : undefined}}>
              {ch}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const enter = (f: number, at: number): CSS => {
  const o = tween(f, at, 14, 0, 1, E.out);
  return {opacity: o, transform: `translateY(${(1 - tween(f, at, 22, 0, 1, E.out)) * 16}px)`};
};
const Anchor: React.FC<{x: number; y: number; style?: CSS; children: React.ReactNode}> = ({x, y, style, children}) => (
  <div style={{position: 'absolute', left: x, top: y, ...style}}>
    <div style={{position: 'absolute', left: 0, top: 0}}>{children}</div>
  </div>
);

const PARAS: [string, string][] = [
  ['01', 'Das Raster ist eine Hilfe, keine Garantie. — Josef Müller-Brockmann'],
  ['02', 'Neue Grafik. Zürich, 1958–1965.'],
  ['03', 'Emil Ruder: Typographie, 1967.'],
  ['04', 'Armin Hofmann, Basel.'],
  ['05', 'Max Bill, Konkrete Kunst.'],
  ['06', 'Ordnung, Klarheit, Objektivität.'],
];

/** 机器里所有“墨色”的元素；压在红色上的那一份用纸白再画一遍，裁到红块里 */
const Content: React.FC<{f: number; color: string; accent: string}> = ({f, color, accent}) => {
  const el = (k: 'sw' | 'st', d: number) => ({
    x: lay(f, d, L.map((l) => cx(l[k][0]))),
    y: lay(f, d, L.map((l) => ry(l[k][1]))),
    s: lay(f, d, L.map((l) => l[k][2])),
  });
  const sw = el('sw', D.sw);
  const st = el('st', D.st);
  const info = (k: 'i1' | 'i2' | 'i3', d: number) => ({x: lay(f, d, L.map((l) => cx(l[k][0]))), y: lay(f, d, L.map((l) => l[k][1]))});
  const i1 = info('i1', D.i1);
  const i2 = info('i2', D.i2);
  const i3 = info('i3', D.i3);
  const rx = lay(f, D.rule, L.map((l) => cx(l.rule[0])));
  const rY = lay(f, D.rule, L.map((l) => ry(l.rule[1])));
  const rw = lay(f, D.rule, L.map((l) => cw(l.rule[2]))) * tween(f, 64, 20, 0, 1, E.out);
  const ink = {color};
  return (
    <>
      <Word f={f} text="Swiss" at={36} x={sw.x} y={sw.y} size={sw.s} color={color} />
      <Word f={f} text="Style" at={50} x={st.x} y={st.y} size={st.s} color={color} />
      {rw > 0.5 && <div style={{position: 'absolute', left: rx, top: rY, width: rw, height: 3, background: color}} />}
      <Anchor x={i1.x} y={i1.y} style={enter(f, 68)}>
        <T k="sc" x={-2} y={0} size={56} style={{...sc(56, 900, 0.02), ...ink}}>瑞士国际主义</T>
        <T k="gr400" x={0} y={40} size={24} style={{...gr(24, 400, 0), ...ink}}>International Typographic Style</T>
      </Anchor>
      <Anchor x={i2.x} y={i2.y} style={enter(f, 74)}>
        <T x={-0.068 * 56} y={0} size={56} style={{...gr(56, 700, -0.02), ...ink}}>1950s—</T>
        <T k="gr400" x={0} y={40} size={24} style={{...gr(24, 400, 0), ...ink}}>Zürich · Basel</T>
      </Anchor>
      <Anchor x={i3.x} y={i3.y} style={enter(f, 82)}>
        <T k="sc" x={0} y={0} size={34} lh={52} style={{...sc(34, 700, 0.02), ...ink}}>
          包豪斯之后，
          <br />
          设计有了一张网格。
        </T>
      </Anchor>
      {/* 6 × 2：六栏正文 */}
      {f >= 200 &&
        PARAS.map(([n, t], g) => {
          const p = tween(f, 204 + g * 2, 16, 0, 1, E.out);
          if (p <= 0) return null;
          const top = ry(4) - 8;
          const h = rh(2) + 8;
          return (
            <div key={g} style={{position: 'absolute', left: cx(g * 2), top, width: cw(2), height: h, overflow: 'hidden'}}>
              <div style={{position: 'absolute', left: 0, top: (1 - p) * h, width: cw(2)}}>
                <T x={-0.068 * 18} y={8 + Math.round(0.709 * 18)} size={18} style={{...gr(18, 700, 0), color: accent}}>{n}</T>
                <T k="gr400" x={0} y={8 + 13 + 34} size={20} lh={28} style={{...gr(20, 400, 0), whiteSpace: 'normal', width: cw(2), ...ink}}>{t}</T>
              </div>
            </div>
          );
        })}
    </>
  );
};

/** 红块里的数字：几栏一组（旧数字往上走，新数字从下面上来），右下角对齐 */
const RedLabel: React.FC<{f: number; box: {w: number; h: number}}> = ({f, box}) => {
  let k = 0;
  for (let j = 1; j < L.length; j++) if (f >= LAY_AT[j] - 9 + D.num) k = j;
  if (k === 0) return null;
  const p = tween(f, LAY_AT[k] - 9 + D.num, 16, 0, 1, E.inOut);
  const digit = (j: number, dy: number) => {
    const s = L[j].ds;
    const x = box.w - 24 - 0.517 * s;
    const y = box.h - 24 + dy;
    return (
      <React.Fragment key={j}>
        <T x={box.w - 24 - 120} y={y - FIG * s - 18} size={22} style={{...gr(22, 700, 0), color: C.paper, width: 120, textAlign: 'right'}}>Spalten</T>
        <T x={x} y={y} size={s} style={{...gr(s, 700, 0), color: C.paper}}>{String(L[j].n)}</T>
      </React.Fragment>
    );
  };
  return (
    <>
      {k > 1 && p < 1 && digit(k - 1, -p * box.h)}
      {digit(k, (1 - p) * (FIG * L[k].ds + 80))}
    </>
  );
};

export const Machine: React.FC<P> = ({f}) => {
  const b = f >= 30 ? redBox(f) : null;
  // 红块贴着网格顶边时，裁切框往上多留 8px：i 的点、S 的过冲高出大写高度，不能露出一条黑边
  const lift = b ? 8 * Math.min(1, Math.max(0, (122 - b.y) / 8)) : 0;
  const clip = b ? `inset(${b.y - lift}px ${1920 - b.x - b.w}px ${1080 - b.y - b.h}px ${b.x}px)` : undefined;
  // 墨色那一份把（抬高后的）红块挖掉，纸白那一份只留红块里面：两份严丝合缝，不会叠出灰边
  const hole = b ? `path(evenodd, 'M-10 -10H1930V1090H-10Z M${b.x} ${b.y - lift}H${b.x + b.w}V${b.y + b.h}H${b.x}Z')` : undefined;
  return (
    <>
      {b && (
        <div style={{position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, background: C.red, overflow: 'hidden'}}>
          <RedLabel f={f} box={b} />
        </div>
      )}
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, clipPath: hole}}>
        <Content f={f} color={C.ink} accent={C.red} />
      </div>
      {b && (
        <>
          <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, clipPath: clip}}>
            <Content f={f} color={C.paper} accent={C.paper} />
          </div>
        </>
      )}
    </>
  );
};

/** 屏幕上的红线：先把栏线扫一遍（86–115），然后每次重排前画出这一版的分组线 */
export const Flashes: React.FC<P> = ({f}) => {
  const H = rh(GRID.rows);
  const out: React.ReactNode[] = [];
  if (f >= 84 && f < 118) {
    for (let i = 0; i < GRID.cols; i++) {
      const a = 86 + i * 1.5;
      const o = tween(f, a, 3, 0, 1, E.out) * (1 - tween(f, a + 3, 9, 0, 1, E.inOut));
      if (o <= 0.01) continue;
      [0, GRID.module - 1].forEach((dx) => out.push(<div key={`s${i}-${dx}`} style={{position: 'absolute', left: cx(i) + dx, top: GRID.my, width: 1, height: H, background: C.red, opacity: o}} />));
    }
  }
  L.forEach((l, k) => {
    if (k === 0) return;
    const at = LAY_AT[k];
    if (f < at - 10 || f > at + 18) return;
    const p = tween(f, at - 10, 10, 0, 1, E.out);
    const o = 1 - tween(f, at + 8, 8, 0, 1, E.inOut);
    const span = 12 / l.n;
    for (let g = 1; g < l.n; g++) {
      out.push(<div key={`g${k}-${g}`} style={{position: 'absolute', left: cx(g * span) - 13, top: GRID.my, width: 2, height: H * p, background: C.red, opacity: o}} />);
    }
  });
  return <>{out}</>;
};

/* ═══════════════ 甩镜 + 字体 ═══════════════ */
export const TW = 4757; // 字体层在世界里的位置
const cubicInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const sineInOut = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;
/** 222–242 一甩（1920px），232–312 沿着字慢慢滑过去（2837px），312 正好停在 a 上 */
export const camX = (f: number) => 1920 * cubicInOut(c01((f - 224) / 18)) + 2837 * sineInOut(c01((f - 232) / 80));

const AX = cx(0) - 0.026 * TY.S + 0.702 * TY.S; // a 的位置（和 v3 的 Aa 一样，镜头扎进去的焦点不变）
const LINE_L = 1940 - TW; // 从 H 左边一点开始（甩镜之前不能露出来）
const LINE_R = cx(9) - 24;
const METRICS: [number, string, string][] = [
  [ry(0), 'Versalhöhe', '大写高度'],
  [TY.base - 0.54 * TY.S, 'x-Höhe', 'x 字高'],
  [TY.base, 'Grundlinie', '基线'],
];
export const TypeWorld: React.FC<P> = ({f}) => {
  const {S, base} = TY;
  const st = {...gr(S, 700, -0.02), color: C.ink};
  return (
    <>
      {METRICS.map(([y, de, zh], i) => (
        <React.Fragment key={i}>
          <div style={{position: 'absolute', left: LINE_L, top: Math.round(y) - 1, width: LINE_R - LINE_L, height: 2, background: C.red}} />
          <T x={cx(9)} y={Math.round(y) + 7} size={20} style={{...gr(20, 700, 0), color: C.red}}>
            {de}
            <span style={{...sc(18, 400, 0.04), color: C.grey, marginLeft: 12}}>{zh}</span>
          </T>
        </React.Fragment>
      ))}
      <div style={{position: 'absolute', left: AX - 5000, width: 5000, top: base - (S - (1.125 + 0.307) * S) / 2 - 1.125 * S, fontSize: S, lineHeight: `${S}px`, textAlign: 'right', ...st}}>Helvetic</div>
      <T x={AX} y={base} size={S} style={{...st, color: f >= RED_A ? C.red : C.ink}}>a</T>
    </>
  );
};

/** 竖着换内容：旧的往上走，新的从下面上来（遮罩里） */
const Swap: React.FC<{f: number; at: number; top: number; h: number; a: React.ReactNode; b: React.ReactNode}> = ({f, at, top, h, a, b}) => {
  const t = tween(f, at - 6, 14, 0, 1, E.inOut);
  return (
    <div style={{position: 'absolute', left: 0, top, width: 1920, height: h, overflow: 'hidden'}}>
      {t < 1 && <div style={{position: 'absolute', left: 0, top: -top - t * h, width: 1920, height: 1080}}>{a}</div>}
      {t > 0 && <div style={{position: 'absolute', left: 0, top: -top + (1 - t) * h, width: 1920, height: 1080}}>{b}</div>}
    </div>
  );
};

/** 基线下面的说明栏（固定在屏幕上，和开场标题的信息栏同一个位置） */
export const TypeLabels: React.FC<P> = ({f}) => {
  const R = AT.type + 60; // 300：改名
  const B = 916;
  const o = tween(f, 246, 14, 0, 1, E.out);
  if (o <= 0.001) return null;
  const dy = (1 - tween(f, 246, 22, 0, 1, E.out)) * 16;
  const big = (x: number, s: string, color: string = C.ink) => (
    <T x={x - 0.068 * 56} y={B} size={56} style={{...gr(56, 700, -0.02), color}}>{s}</T>
  );
  const small = (x: number, s: React.ReactNode, k: 'gr400' | 'sc' = 'gr400') => (
    <T k={k} x={x} y={956} size={24} style={k === 'sc' ? {...sc(22, 400, 0.04), color: C.ink} : {...gr(24, 400, 0), color: C.ink}}>{s}</T>
  );
  const zh = (l1: string, l2: string) => (
    <T k="sc" x={cx(9)} y={904} size={34} lh={52} style={{...sc(34, 700, 0.02), color: C.ink}}>
      {l1}
      <br />
      {l2}
    </T>
  );
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o, transform: `translateY(${dy}px)`}}>
      <Swap f={f} at={R} top={860} h={70} a={big(cx(0), 'Neue Haas Grotesk')} b={big(cx(0), 'Helvetica')} />
      {small(cx(0), 'Max Miedinger · Eduard Hoffmann')}
      <Swap f={f} at={R + 2} top={860} h={70} a={big(cx(5), '1957', C.red)} b={big(cx(5), '1960', C.red)} />
      <Swap f={f} at={R + 4} top={934} h={34} a={small(cx(5), 'Haas’sche Schriftgiesserei')} b={small(cx(5), 'D. Stempel AG · Linotype')} />
      <Swap f={f} at={R + 6} top={860} h={110} a={zh('瑞士人做的', '无衬线字体。')} b={zh('这个名字在拉丁语里', '就是「瑞士的」。')} />
    </div>
  );
};
