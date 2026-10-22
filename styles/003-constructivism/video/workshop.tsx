/**
 * 003 · Constructivism —— 05 纺织 · 06 舞台 · 07 书（400–625 帧）
 * 构成主义者把“艺术”搬进工厂、剧场和印刷厂：一块布、一座舞台、一本书。
 */
import React from 'react';
import {E, POP, SNAP, spr, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {AT} from './timeline';
import {bar, cam, Credit, lerp, mix, on, P, Poly, Pt, pt, Tip, Txt, zoomIn} from './ui';

const mod = (a: number, n: number) => ((a % n) + n) % n;

/** 06 舞台上的三只轮子；05 纺织结尾的三个圆就落在这里 */
export const WHEELS = [
  {c: pt(1000, 450), r: 170, fill: C.ink},
  {c: pt(1240, 330), r: 110, fill: C.red},
  {c: pt(760, 330), r: 130, fill: C.light},
];
const Disk: React.FC<{i: number; r: number}> = ({i, r}) => {
  const w = WHEELS[i];
  return <circle cx={w.c.x} cy={w.c.y} r={r} fill={w.fill} stroke={i === 2 ? C.ink : undefined} strokeWidth={i === 2 ? 10 : undefined} />;
};

/* ═══════════════ 05 纺织：波波娃 & 斯捷潘诺娃的印花布（1923—1924） ═══════════════
 * 一个 2×2 的“花回”铺满 −30° 的网格、沿主轴滑动；每个八分音符一道波，把所有花样转 90°。
 */
const T5 = 150;
const Motif: React.FC<{m: number; a: string; b: string}> = ({m, a, b}) => {
  const h = T5 / 2;
  switch (m) {
    case 0: // 四分之一圆
      return <path d={`M${-h} ${-h}H${h}A${2 * h} ${2 * h} 0 0 1 ${-h} ${h}Z`} fill={a} />;
    case 1: // 半圆 + 小方块
      return (
        <>
          <path d={`M${-h} ${h}A${h} ${h} 0 0 1 ${h} ${h}Z`} fill={a} />
          <rect x={-h * 0.25} y={-h * 0.8} width={h * 0.5} height={h * 0.5} fill={b} />
        </>
      );
    case 2: // 三道条纹
      return (
        <>
          {[0, 1, 2].map((k) => (
            <rect key={k} x={-h + (k * 2 * h) / 3 + h / 6} y={-h} width={h / 3} height={2 * h} fill={k === 1 ? b : a} />
          ))}
        </>
      );
    default: // 半块三角 + 小圆
      return (
        <>
          <polygon points={`${-h},${-h} ${h},${h} ${-h},${h}`} fill={a} />
          <circle cx={h * 0.42} cy={-h * 0.42} r={h * 0.3} fill={b} />
        </>
      );
  }
};
export const Textile: React.FC<P> = ({f}) => {
  const t0 = AT.textile;
  const t = f - t0;
  const ox = -t * 4.2;
  const waves = [t0 + 12.5, t0 + 25, t0 + 37.5, t0 + 50];
  const k0 = Math.floor(-ox / T5);
  const tiles = [];
  const shrinkAt = AT.stage - 19;
  for (let kk = -9; kk <= 9; kk++) {
    for (let j = -9; j <= 9; j++) {
      const k = kk + k0;
      const lx = k * T5 + ox;
      const ly = j * T5;
      if (Math.abs(lx) > 1250 || Math.abs(ly) > 1250) continue;
      let rot = mod(k + j, 4) * 90;
      waves.forEach((w, wi) => {
        const d = (((wi % 2 ? -lx : lx) + 1250) / 2500) * 12;
        rot += 90 * tween(f, w - 6 + d, 9, 0, 1, E.out);
      });
      const es = 1 - tween(f, shrinkAt + (Math.hypot(lx, ly) / 1250) * 7, 9, 0, 1, E.in);
      if (es <= 0.01) continue;
      const m = mod(k, 2) + 2 * mod(j, 2);
      const red = mod(k, 2) === mod(j, 2);
      tiles.push(
        <g key={`${k}_${j}`} transform={`translate(${lx.toFixed(1)} ${ly}) rotate(${rot.toFixed(2)}) scale(${es.toFixed(3)})`}>
          <Motif m={m} a={red ? C.red : C.ink} b={red ? C.ink : C.red} />
        </g>,
      );
    }
  }
  const dr = tween(f, AT.stage - 13, 13, 0, 1, E.out);
  const po = tween(f, t0 + 6, 8) * (1 - tween(f, shrinkAt, 6));
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill={C.paper} />
      <g transform={`translate(960 540) rotate(-30)`}>{tiles}</g>
      {dr > 0 && WHEELS.map((_, i) => <Disk key={i} i={i} r={WHEELS[i].r * dr} />)}
      {po > 0 && (
        <g opacity={po}>
          <rect x={68} y={68} width={680} height={150} fill={C.paper} />
          <rect x={1824 - 640 - 28} y={68} width={680} height={150} fill={C.paper} />
        </g>
      )}
      <Credit f={f} at={t0 + 6} out={shrinkAt} a="波波娃 & 斯捷潘诺娃 · 印花布（致敬）" b="1923—1924 · 第一国营印花厂：画家走进工厂" />
      <Tip f={f} at={t0 + 12} out={shrinkAt} a="图案 = 一个形 × 网格 × 重复" b="斜着铺满，每拍转 90°，就是一块会动的布" />
    </g>
  );
};

/* ═══════════════ 06 舞台：波波娃《宽宏大量的绿帽子》舞台（1922） ═══════════════
 * 三只轮子先转起来，梁、斜坡、支撑、梯子、平台按十六分音符一根根“装”上去，螺栓（红点）落在接头上。
 */
type Beam = [Pt, Pt, number, string, number]; // 起点, 终点, 粗细, 颜色, 出现时刻（相对本章）
const LAD = pt(1300, 400);
const BEAMS: Beam[] = [
  [pt(120, 900), pt(1800, 900), 18, C.ink, 0],
  [pt(760, 900), pt(760, 330), 24, C.ink, 6.25],
  [pt(1240, 900), pt(1240, 330), 24, C.ink, 9.4],
  [pt(690, 330), pt(1310, 330), 24, C.ink, 12.5],
  [pt(200, 900), on(pt(200, 900), 650, 0), 30, C.red, 18.75],
  [pt(400, 900), pt(400, 900 - 200 * 0.5774), 10, C.ink, 22],
  [pt(600, 900), pt(600, 900 - 400 * 0.5774), 10, C.ink, 25],
  [pt(760, 900), on(pt(760, 900), 554, 0), 12, C.ink, 28.1],
  [pt(760, 520), on(pt(760, 520), 0, 436), 12, C.ink, 31.25],
  [pt(1240, 640), pt(1720, 640), 18, C.ink, 34.4],
  [pt(1680, 640), pt(1680, 900), 10, C.ink, 36],
  [on(LAD, -26, 0), on(LAD, -26, 520), 10, C.ink, 37.5],
  [on(LAD, 26, 0), on(LAD, 26, 520), 10, C.ink, 39],
];
const BOLTS: [Pt, number][] = [
  [pt(760, 900), 10],
  [pt(1240, 900), 13],
  [pt(760, 575), 22],
  [on(pt(760, 900), 554, 0), 31],
  [pt(1240, 640), 36],
  [pt(1680, 900), 38],
];
const Wheel: React.FC<{i: number; a: number; k: number; o: number}> = ({i, a, k, o}) => {
  const w = WHEELS[i];
  const spokes = i === 0 ? 4 : i === 1 ? 3 : 6;
  const sw = i === 0 ? 16 : i === 1 ? 10 : 6;
  const sc = i === 0 ? C.light : C.ink;
  return (
    <g transform={`translate(${w.c.x} ${w.c.y}) rotate(${a.toFixed(2)})`}>
      {i === 1 &&
        Array.from({length: 12}, (_, j) => (
          <rect key={j} x={-11} y={-w.r - 18} width={22} height={24} fill={C.red} transform={`rotate(${j * 30})`} />
        ))}
      <circle r={w.r} fill={w.fill} stroke={i === 2 ? C.ink : undefined} strokeWidth={i === 2 ? 10 : undefined} />
      <g opacity={o}>
        {Array.from({length: spokes}, (_, j) => (
          <rect key={j} x={0} y={-sw / 2} width={(w.r - (i === 2 ? 5 : 14)) * k} height={sw} fill={sc} transform={`rotate(${(j * 360) / spokes})`} />
        ))}
        <circle r={(i === 0 ? 26 : 16) * k} fill={sc} />
        {i === 0 && <circle r={9 * k} fill={C.red} />}
      </g>
    </g>
  );
};
export const Stage: React.FC<P> = ({f}) => {
  const t0 = AT.stage;
  const t = f - t0;
  const W2 = WHEELS[1].c;
  const zp = tween(f, AT.book - 14, 14, 0, 1, E.in);
  const zs = zoomIn(zp, 16) * lerp(1, 1.03, tween(f, t0, 60, 0, 1, E.soft));
  const spokeK = spr(f, t0, POP, 24);
  const spokeO = 1 - tween(f, AT.book - 14, 7);
  const rungs = [];
  for (let n = 30, idx = 0; n < 520; n += 44, idx++) {
    const p = spr(f, t0 + 41 + idx * 0.9, SNAP, 20);
    if (p <= 0.01) continue;
    rungs.push(<Poly key={n} p={bar(on(LAD, 0, n), -30, 52 * Math.min(p, 1.1), 8)} fill={C.ink} />);
  }
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill={C.paper} />
      <g transform={cam(W2.x, W2.y, zs)}>
        {BEAMS.map(([a, b, w, c, at], i) => {
          const p = Math.min(1.05, spr(f, t0 + at, SNAP, 24));
          if (p <= 0.01) return null;
          const e = mix(a, b, p);
          const len = Math.hypot(e.x - a.x, e.y - a.y);
          const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
          return <Poly key={i} p={bar(mix(a, e, 0.5), ang, len + w * 0.0, w)} fill={c} />;
        })}
        {rungs}
        {BOLTS.map(([p, at], i) => {
          const s = spr(f, t0 + at, POP, 20);
          return s > 0.01 ? <rect key={i} x={p.x - 11 * s} y={p.y - 11 * s} width={22 * s} height={22 * s} fill={C.red} /> : null;
        })}
        <Wheel i={2} a={-t * 3.1} k={spokeK} o={spokeO} />
        <Wheel i={0} a={t * 2.4} k={spokeK} o={spokeO} />
        <Wheel i={1} a={-t * 3.7} k={spokeK} o={spokeO} />
      </g>
      <Credit f={f} at={t0 + 4} out={AT.book - 14} a="波波娃 · 《宽宏大量的绿帽子》舞台（致敬）" b="1922 · 梅耶荷德剧院 · 第一座构成主义舞台" />
      <Tip f={f} at={t0 + 10} out={AT.book - 14} a="组装：接缝要看得见" b="梁、梯、轮子各自成形，再用螺栓接起来" />
      {f >= AT.book - 4 && <rect x={0} y={0} width={1920} height={1080} fill={C.red} opacity={tween(f, AT.book - 4, 4)} />}
    </g>
  );
};

/* ═══════════════ 07 书：利西茨基《为了声音》（1923）/《关于两个方块》 ═══════════════
 * 从一整片红（左页）拉开成一本摊开的书；书边是“指引索引”（这里标的是本片 7 章）；
 * 翻两页，最后一页上的红方块飞向镜头，盖满画面 → 五个词。
 */
const PW = 560;
const PH = 760;
const X0 = 400;
const Y0 = 200;
const SPINE = X0 + PW;
const SQ = {x: 330, y: 250, s: 190}; // 最后一页上的红方块（页内坐标）
const Page: React.FC<{k: string; flying?: boolean}> = ({k, flying}) => {
  const bg = <rect width={PW} height={PH} fill={k === 'L0' ? C.red : C.paper} />;
  let body: React.ReactNode = null;
  if (k === 'R0')
    body = (
      <>
        <Txt x={48} y={250} size={220} w={700}>ДЛЯ</Txt>
        <Txt x={48} y={400} size={136} w={700}>ГОЛОСА</Txt>
        <Poly p={bar(pt(300, 520), -30, 560, 34)} fill={C.red} />
        <circle cx={440} cy={640} r={64} fill={C.red} />
        <Txt x={48} y={716} size={18} w={500} sc o={0.7}>为了声音 · 马雅可夫斯基 诗 · 利西茨基 设计</Txt>
      </>
    );
  if (k === 'L1')
    body = (
      <>
        <Poly p={bar(pt(270, 330), -30, 250, 250)} fill={C.ink} />
        <circle cx={440} cy={160} r={46} fill={C.red} />
        <Poly p={bar(pt(300, 560), -30, 520, 8)} fill={C.red} />
        <Txt x={60} y={690} size={58} w={700} rot={-30}>МАЯКОВСКИЙ</Txt>
      </>
    );
  if (k === 'R1')
    body = (
      <>
        <circle cx={540} cy={330} r={250} fill={C.red} />
        <Poly p={bar(pt(240, 560), -30, 420, 26)} fill={C.ink} />
        <Poly p={bar(pt(280, 616), -30, 300, 12)} fill={C.ink} />
        <Txt x={40} y={720} size={110} w={700}>ГОЛОС</Txt>
      </>
    );
  if (k === 'L2')
    body = (
      <>
        <Txt x={48} y={200} size={150} w={700}>ПРО</Txt>
        <Txt x={36} y={640} size={470} w={700} fill={C.red}>2</Txt>
        <Txt x={48} y={720} size={70} w={700}>КВАДРАТА</Txt>
      </>
    );
  if (k === 'R2') {
    const sq = bar(pt(SQ.x, SQ.y), -30, SQ.s, SQ.s);
    body = (
      <>
        <rect x={165} y={445} width={230} height={230} fill={C.ink} />
        <line x1={on(pt(SQ.x, SQ.y), 120, 0).x} y1={on(pt(SQ.x, SQ.y), 120, 0).y} x2={on(pt(SQ.x, SQ.y), 420, 0).x} y2={on(pt(SQ.x, SQ.y), 420, 0).y} stroke={C.ink} strokeWidth={3} strokeDasharray="14 10" />
        {flying ? <polygon points={sq.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={C.ink} strokeWidth={3} strokeDasharray="10 8" /> : <Poly p={sq} fill={C.red} />}
        <Txt x={48} y={716} size={18} w={500} sc o={0.7}>关于两个方块 · 1922</Txt>
      </>
    );
  }
  return (
    <g clipPath="url(#page7)">
      {bg}
      {body}
    </g>
  );
};
export const Book: React.FC<P> = ({f}) => {
  const t0 = AT.book;
  const p = tween(f, t0, 18, 0, 1, E.inOut);
  const s = zoomIn(1 - p, 4.6);
  const rot = lerp(-30, 0, p);
  const c = mix(pt(X0 + PW / 2, Y0 + PH / 2), pt(960, 540), p);
  const f1 = 180 * tween(f, t0 + 19, 14, 0, 1, E.inOut);
  const f2 = 180 * tween(f, t0 + 33, 14, 0, 1, E.inOut);
  let n = 0;
  let phi = 0;
  if (f1 >= 180) n = 1;
  if (f2 >= 180) n = 2;
  if (f1 > 0 && f1 < 180) phi = f1;
  if (f2 > 0 && f2 < 180) phi = f2;
  const flipping = phi > 0;
  const fly = tween(f, t0 + 60, 13, 0, 1, E.in);
  const cos = Math.cos((phi * Math.PI) / 180);
  const sqW = {x: SPINE + SQ.x, y: Y0 + SQ.y};
  const sqC = mix(sqW, pt(960, 540), fly);
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill={C.paper} />
      <defs>
        <clipPath id="page7">
          <rect width={PW} height={PH} />
        </clipPath>
      </defs>
      <g transform={`translate(960 540) rotate(${rot}) scale(${s}) translate(${-c.x} ${-c.y})`}>
        <rect x={X0 - 16} y={Y0 - 16} width={PW * 2 + 32} height={PH + 32} fill={C.ink} />
        {/* 指引索引：书边的台阶状标签（本片的 7 章） */}
        {Array.from({length: 7}, (_, i) => (
          <g key={i}>
            <rect x={SPINE + PW + 16} y={Y0 + 6 + i * 106} width={34 + i * 3} height={96} fill={i === 6 ? C.red : C.ink} />
            <Txt x={SPINE + PW + 33 + i * 1.5} y={Y0 + 62 + i * 106} size={22} w={600} fill={C.paper} anchor="middle">{`0${i + 1}`}</Txt>
          </g>
        ))}
        <g transform={`translate(${X0} ${Y0})`}>
          <Page k={`L${n}`} />
        </g>
        <g transform={`translate(${SPINE} ${Y0})`}>
          <Page k={`R${flipping ? n + 1 : n}`} flying={fly > 0} />
          {flipping && <rect width={PW} height={PH} fill={C.ink} opacity={0.18 * Math.sin((phi * Math.PI) / 180)} />}
        </g>
        {flipping && (
          <g transform={`translate(${SPINE} ${Y0}) scale(${cos.toFixed(4)} 1)`}>
            {cos >= 0 ? (
              <Page k={`R${n}`} />
            ) : (
              <g transform={`translate(${PW} 0) scale(-1 1)`}>
                <Page k={`L${n + 1}`} />
              </g>
            )}
            <rect width={PW} height={PH} fill={C.ink} opacity={0.3 * (1 - Math.abs(cos))} />
          </g>
        )}
        <rect x={SPINE - 2} y={Y0} width={4} height={PH} fill={C.ink} opacity={0.5} />
      </g>
      <Credit f={f} at={t0 + 16} out={t0 + 58} a="利西茨基 · 《为了声音》（致敬）" b="1923 · 马雅可夫斯基诗集 · 书边做了指引索引" />
      <Tip f={f} at={t0 + 22} out={t0 + 58} a="书也是组装出来的" b="字、粗条、方块是同一种材料" />
      {fly > 0 && <Poly p={bar(sqC, -30, SQ.s * zoomIn(fly, 13), SQ.s * zoomIn(fly, 13))} fill={C.red} />}
      {f === t0 && <rect x={0} y={0} width={1920} height={1080} fill={C.red} />}
    </g>
  );
};
