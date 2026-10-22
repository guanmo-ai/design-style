/**
 * 003 · Constructivism —— 五个词（625–750）· 片尾（750–900）· 底栏 HUD
 * 五个词一拍一个，每个词换一种“底”：红 / 红黑斜分 / 黑 / 网点 / 纸；换词用斜切（沿副轴扫过）。
 * 片尾用开场同一个构图再刺一次：首尾呼应。
 */
import React from 'react';
import {E, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {AT, CHAPTERS} from './timeline';
import {Opening} from './opening';
import {bar, c01, halftone, lerp, on, P, Poly, Pt, pt, pts, Scale, stamp, Txt} from './ui';

const O = pt(960, 540);
/** 一个向下推进的半平面：n < thr 的部分（thr 从 −960 推到 960 盖满全屏） */
const sweep = (p: number): Pt[] => bar(on(O, 0, lerp(-980, 980, p) - 3000), -30, 6000, 6000);

const WORDS = [
  {zh: '斜线', en: 'DIAGONAL', line: '主轴倾斜 30°，画面就开始动'},
  {zh: '红与黑', en: 'RED & BLACK', line: '两种墨加纸色，就够了'},
  {zh: '组装', en: 'CONSTRUCTION', line: '像搭脚手架一样拼，接缝露在外面'},
  {zh: '蒙太奇', en: 'PHOTOMONTAGE', line: '照片转网点，剪开再斜着拼'},
  {zh: '大字', en: 'LOUD TYPE', line: '字号就是音量'},
];
let DOTS = '';
const dots = () =>
  DOTS ||
  (DOTS = halftone(-40, -40, 2000, 1160, 22, (x, y) => {
    const d = Math.hypot(x - 1380, y - 300) / 620; // 一个大圆形的“光斑”
    const g = c01((x - y * 0.6) / 1500); // 斜向渐变
    const t = 0.12 + 0.62 * g + 0.3 * c01(1 - d);
    return x < 760 && y > 820 ? t * 0.25 : t; // 左下留给说明文字
  }));

/** 字面中心落在 c：汉字 Black 的字面中心约在基线上方 0.40 em */
const cy = (size: number) => size * 0.4;

const Word: React.FC<{i: number; u: number}> = ({i, u}) => {
  const w = WORDS[i];
  const light = i === 0 || i === 1 || i === 2;
  const ink = light ? C.light : C.ink;
  let body: React.ReactNode = null;
  if (i === 0) {
    const st = stamp(u, 0, 1.45, 8);
    const g = tween(u, 0, 9, 0, 1, E.out);
    const b = on(O, 0, cy(380));
    body = (
      <>
        <rect x={0} y={0} width={1920} height={1080} fill={C.red} />
        <Poly p={bar(on(O, lerp(-1600, 0, g), 250), -30, 2600, 16)} fill={C.light} />
        <Scale x={O.x} y={O.y} s={st.s} o={st.o}>
          <Txt x={b.x} y={b.y} size={380} w={900} sc anchor="middle" rot={-30} fill={C.ink} ls={-0.02}>斜线</Txt>
        </Scale>
      </>
    );
  }
  if (i === 1) {
    const chars = ['红', '与', '黑'];
    const fills = [C.red, C.light, C.ink];
    body = (
      <>
        <rect x={0} y={0} width={1920} height={1080} fill={C.red} />
        <Poly p={sweep(0.5)} fill={C.ink} />
        {chars.map((ch, k) => {
          const st = stamp(u, k * 3.125, 1.5, 7);
          // 三个字沿斜分线错开：红落在黑里、黑落在红里、与骑在分界线上
          const x = 960 + (k - 1) * 360;
          const y = 540 + (k - 1) * 66;
          return (
            <Scale key={k} x={x} y={y} s={st.s} o={st.o}>
              <Txt x={x} y={y + cy(300)} size={300} w={900} sc anchor="middle" fill={fills[k]}>{ch}</Txt>
            </Scale>
          );
        })}
      </>
    );
  }
  if (i === 2) {
    const offs = [640, -520, 420, -720];
    body = (
      <>
        <rect x={0} y={0} width={1920} height={1080} fill={C.ink} />
        <defs>
          {offs.map((_, k) => (
            <clipPath key={k} id={`asm-${k}`}>
              <polygon points={pts(bar(on(O, 0, (k - 1.5) * 110), -30, 4000, 112))} />
            </clipPath>
          ))}
        </defs>
        {offs.map((o, k) => {
          const p = tween(u, k * 1.6, 11, 0, 1, E.out);
          const d = on(pt(0, 0), o * (1 - p), 0);
          return (
            <g key={k} clipPath={`url(#asm-${k})`}>
              <g transform={`translate(${d.x} ${d.y})`}>
                <Txt x={960} y={540 + cy(380)} size={380} w={900} sc anchor="middle" fill={C.light}>组装</Txt>
              </g>
            </g>
          );
        })}
        {[0, 1, 2].map((k) => {
          const p = tween(u, 9 + k * 2, 6, 0, 1, E.out);
          const c = on(O, (k - 1) * 380, 0);
          return p > 0 ? <rect key={k} x={c.x - 12 * p} y={c.y - 12 * p} width={24 * p} height={24 * p} fill={C.red} /> : null;
        })}
      </>
    );
  }
  if (i === 3) {
    const st = stamp(u, 0, 1.4, 8);
    const g = tween(u, 0, 10, 0, 1, E.out);
    const sh = on(pt(0, 0), -u * 3, 0);
    body = (
      <>
        <rect x={0} y={0} width={1920} height={1080} fill={C.paper} />
        <path d={dots()} fill={C.ink} transform={`translate(${sh.x} ${sh.y})`} />
        <Poly p={bar(on(O, lerp(900, 0, g), 0), -30, 1240, 300)} fill={C.red} />
        <Scale x={O.x} y={O.y} s={st.s} o={st.o}>
          <Txt x={960} y={540 + cy(250)} size={250} w={900} sc anchor="middle" fill={C.light}>蒙太奇</Txt>
        </Scale>
      </>
    );
  }
  if (i === 4) {
    const s = lerp(0.72, 1, tween(u, 0, 10, 0, 1, E.out)) * (1 + u * 0.0025);
    body = (
      <>
        <rect x={0} y={0} width={1920} height={1080} fill={C.paper} />
        <Scale x={O.x} y={O.y} s={s}>
          <Txt x={960} y={540 + cy(1150)} size={1150} w={900} sc anchor="middle" fill={C.red} ls={-0.04}>大字</Txt>
        </Scale>
      </>
    );
  }
  const lo = tween(u, 3, 6);
  return (
    <g>
      {body}
      <g opacity={lo}>
        <rect x={96} y={96} width={56} height={8} fill={i === 4 ? C.ink : i === 0 ? C.ink : C.red} />
        <Txt x={96} y={150} size={30} w={700} sc fill={ink}>{`规则 ${i + 1} / 5`}</Txt>
        <Txt x={96} y={968} size={40} w={600} fill={ink} ls={0.14}>{w.en}</Txt>
        <Txt x={96} y={1012} size={28} w={700} sc fill={ink} o={0.85}>{w.line}</Txt>
      </g>
    </g>
  );
};

export const Words: React.FC<P> = ({f}) => {
  const i = Math.min(4, Math.floor((f - AT.words) / 25));
  const u = f - (AT.words + i * 25);
  const nx = i + 1;
  const p = nx < 5 ? tween(f, AT.words + nx * 25 - 7, 7, 0, 1, E.in) : 0;
  return (
    <g>
      <Word i={i} u={u} />
      {p > 0 && (
        <g>
          <defs>
            <clipPath id={`wipe-${nx}`}>
              <polygon points={pts(sweep(p))} />
            </clipPath>
          </defs>
          <g clipPath={`url(#wipe-${nx})`}>
            <Word i={nx} u={-1} />
          </g>
        </g>
      )}
    </g>
  );
};

/** 片尾：开场的构图（LH）再刺一次，口号 + 署名；之后缓慢推近，停住 */
export const End: React.FC<P> = ({f}) => {
  const t = f - AT.end;
  const drift = 0.035 * tween(f, AT.end + 95, 55, 0, 1, E.soft);
  return <Opening f={Math.min(t, 99)} end drift={drift} />;
};

/* ═══════════════ 底栏 HUD（01–07） ═══════════════ */
export const Hud: React.FC<P> = ({f}) => {
  const a = AT.diag;
  const b = AT.words;
  if (f < a - 2 || f >= b) return null;
  const inK = tween(f, a - 2, 12, 0, 1, E.out);
  const outK = tween(f, b - 8, 8, 0, 1, E.in);
  const dy = (1 - inK) * 80 + outK * 80;
  let k = 0;
  CHAPTERS.forEach(([, s], i) => {
    if (f >= s) k = i;
  });
  const [name, s0] = CHAPTERS[k];
  const st = stamp(f, s0, 1.35, 7);
  const dark = f >= AT.tower && f < AT.textile;
  const lw = 318;
  const rw = 112 + name.length * 24 + 24;
  return (
    <g transform={`translate(0 ${dy})`}>
      <rect x={96} y={994} width={lw} height={44} fill={dark ? C.paper : C.ink} />
      <Txt x={112} y={1024} size={22} w={700} sc fill={dark ? C.ink : C.paper}>构成主义</Txt>
      <Txt x={210} y={1024} size={20} w={500} ls={0.12} fill={dark ? C.ink : C.paper}>CONSTRUCTIVISM</Txt>
      <rect x={1824 - rw} y={994} width={rw} height={44} fill={C.red} />
      <Scale x={1824 - rw / 2} y={1016} s={st.s} o={k === 0 ? 1 : Math.max(0.35, st.o)}>
        <Txt x={1824 - rw + 16} y={1026} size={26} w={700} fill={C.light} ls={0.04}>{`0${k + 1} / 07`}</Txt>
        <Txt x={1824 - 16} y={1025} size={22} w={700} sc fill={C.light} anchor="end">{name}</Txt>
      </Scale>
    </g>
  );
};
