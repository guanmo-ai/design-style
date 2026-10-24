/**
 * 007 · Minimalism —— 开场 0–2s
 *   0.00–0.47s  噪音    满屏 150 个“多余的东西”：促销字、徽章、星星、箭头、条形码……字体是前六期用过的全部字体；
 *                       它们从最远处开始一个个被删掉，越删越快，全部吸向画面中心
 *   0.48s       一个点  最后一个徽章缩成一个橙色的点（全片唯一的彩色第一次出现），一圈涟漪
 *   0.55–1.8s   标题    一根发丝线从点向两边画出去（地平线）；MINIMALISM 逐字母吸进来；极简主义；Less is more.
 *   1.7–2.0s    交棒    标题删掉；地平线收短，成为下一幕台基的前沿
 */
import React from 'react';
import {random} from 'remotion';
import {E, POP, spr, tween} from '../../../src/lib/anim';
import {C, DOT, LAYOUT} from '../tokens';
import {Dot, Hair, Letters, lerp, n2, P, Ripple, Txt, vis} from './ui';

export const CENTER = {x: 960, y: LAYOUT.horizon};
export const LAND = 30; // 第 1 拍：只剩一个点
export const HANDOFF = 104; // 之后地平线和点交给 01

/* ═══════════ 噪音：150 个多余的东西 ═══════════ */
type Kind = 'word' | 'burst' | 'ring' | 'star' | 'arrow' | 'swash' | 'box' | 'stripes' | 'barcode' | 'ribbon' | 'dots' | 'badge' | 'close';
type Item = {kind: Kind; x: number; y: number; rot: number; s: number; text: string; fam: string; wt: number; it: boolean; col: string; t: number};

// 字体：前六期用过的全部字体——瑞士的 Heros、包豪斯的 Jost、构成主义的 Oswald、孟菲斯的 Fredoka、波普的 Bangers、千禧的 Unbounded / Silkscreen
const WORDS: [string, string, number, boolean?][] = [
  ['SALE', 'Bangers', 400],
  ['NEW!', 'Bangers', 400],
  ['限时特惠', 'Noto Sans SC', 900],
  ['BUY NOW', 'Oswald', 700],
  ['FREE', 'Unbounded', 900],
  ['50% OFF', 'Oswald', 700],
  ['爆款', 'Noto Sans SC', 900],
  ['HOT', 'Bangers', 400],
  ['WOW!', 'Bangers', 400],
  ['点击这里', 'Noto Sans SC', 900],
  ['LIMITED', 'Unbounded', 900],
  ['!!!', 'Bangers', 400],
  ['#1', 'Oswald', 700],
  ['100%', 'Unbounded', 900],
  ['VIP', 'Fredoka', 700],
  ['BEST', 'Fredoka', 700],
  ['超值', 'Noto Sans SC', 900],
  ['必买', 'Noto Sans SC', 900],
  ['Click here', 'Instrument Serif', 400, true],
  ['Deluxe', 'Instrument Serif', 400, true],
  ['MEGA', 'Unbounded', 900],
  ['PLUS+', 'Jost', 800],
  ['PRO MAX', 'Jost', 800],
  ['LOADING…', 'Silkscreen', 400],
  ['×2', 'Oswald', 700],
  ['NEW', 'Silkscreen', 400],
  ['今日', 'Noto Sans SC', 900],
  ['¥9.9', 'Oswald', 700],
  ['GIFT', 'Fredoka', 700],
  ['3D', 'Unbounded', 900],
  ['SUPER', 'Bangers', 400],
  ['Premium', 'Instrument Serif', 400, true],
  ['TOP 10', 'Oswald', 700],
  ['抢', 'Noto Sans SC', 900],
  ['OK!', 'Fredoka', 700],
  ['ULTRA', 'TeX Gyre Heros', 700],
  ['★★★★★', 'TeX Gyre Heros', 700],
  ['More!', 'Jost', 800],
  ['马上', 'Noto Sans SC', 900],
  ['+++', 'Bangers', 400],
];
const COLS = [C.ink, C.ink, C.greyDk, C.grey, '#B4B0A8'];
const KINDS: Kind[] = ['word', 'word', 'word', 'word', 'burst', 'ring', 'star', 'arrow', 'swash', 'box', 'stripes', 'barcode', 'ribbon', 'dots', 'badge', 'close'];

const ITEMS: Item[] = (() => {
  const out: Item[] = [];
  const cols = 13;
  const rows = 8;
  const cw = 1920 / cols;
  const ch = 1080 / rows;
  let n = 0;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const per = random(`per-${i}-${j}`) < 0.45 ? 2 : 1;
      for (let k = 0; k < per; k++) {
        const r = (s: string) => random(`${s}-${n}`);
        const x = (i + 0.15 + 0.7 * r('x')) * cw;
        const y = (j + 0.15 + 0.7 * r('y')) * ch;
        if (Math.hypot(x - CENTER.x, (y - CENTER.y) * 1.3) < 110) continue; // 中心留给最后一个徽章
        const kind = KINDS[Math.floor(r('k') * KINDS.length)];
        const w = WORDS[Math.floor(r('w') * WORDS.length)];
        const d = Math.hypot(x - CENTER.x, (y - CENTER.y) * 1.55) / 1180;
        out.push({
          kind,
          x,
          y,
          rot: (r('r') - 0.5) * 30,
          s: 0.7 + 0.75 * r('s'),
          text: w[0],
          fam: w[1],
          wt: w[2],
          it: !!w[3],
          col: COLS[Math.floor(r('c') * COLS.length)],
          // 从最远处开始删，越删越快（越靠近中心越密）
          t: 3 + 23 * (1 - Math.min(1, d)) ** 0.9 + (r('t') - 0.5) * 2,
        });
        n++;
      }
    }
  }
  return out;
})();
/** 配乐脚本用：每一个东西被删掉的帧（导出成 JSON 由 make_music.py 读取） */
export const CLUTTER_TIMES = ITEMS.map((it) => Math.round(it.t * 10) / 10);

const burstPath = (R: number, n: number, inner = 0.74) => {
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 ? R * inner : R;
    d += `${i ? 'L' : 'M'}${n2(Math.cos(a) * r)} ${n2(Math.sin(a) * r)}`;
  }
  return d + 'Z';
};
const STAR = burstPath(34, 5, 0.42);

const ItemShape: React.FC<{it: Item}> = ({it}) => {
  const word = (size: number, col = it.col) => (
    <text x={0} y={size * 0.36} textAnchor="middle" fill={col} style={{fontFamily: `'${it.fam}'`, fontWeight: it.wt, fontStyle: it.it ? 'italic' : undefined, fontSize: size}}>
      {it.text}
    </text>
  );
  switch (it.kind) {
    case 'word':
      return word(it.text.length > 5 ? 46 : 70);
    case 'burst':
      return (
        <>
          <path d={burstPath(70, 14)} fill={it.col} />
          <text x={0} y={12} textAnchor="middle" fill={C.paper} style={{fontFamily: "'Bangers'", fontSize: 36}}>
            {it.text.length > 5 ? 'NEW' : it.text}
          </text>
        </>
      );
    case 'ring':
      return (
        <>
          <circle r={56} fill="none" stroke={it.col} strokeWidth={6} />
          <circle r={44} fill="none" stroke={it.col} strokeWidth={2} strokeDasharray="4 6" />
          {word(28)}
        </>
      );
    case 'star':
      return <path d={STAR} fill={it.col} transform="scale(1.4)" />;
    case 'arrow':
      return <path d="M-70 -14H20V-36L74 0L20 36V14H-70Z" fill={it.col} />;
    case 'swash':
      return <path d="M-90 10C-50 -24 -10 30 30 0S90 -10 100 -20" fill="none" stroke={it.col} strokeWidth={9} strokeLinecap="round" />;
    case 'box':
      return (
        <>
          <rect x={-78} y={-34} width={156} height={68} fill={C.ink} transform="translate(8 8)" opacity={0.35} />
          <rect x={-78} y={-34} width={156} height={68} fill={it.col === C.ink ? C.ink : C.paper} stroke={C.ink} strokeWidth={3} />
          <text x={0} y={12} textAnchor="middle" fill={it.col === C.ink ? C.paper : C.ink} style={{fontFamily: `'${it.fam}'`, fontWeight: it.wt, fontSize: 32}}>
            {it.text.slice(0, 7)}
          </text>
        </>
      );
    case 'stripes':
      return (
        <g>
          {Array.from({length: 7}, (_, k) => (
            <path key={k} d={`M${-70 + k * 22} 40L${-40 + k * 22} -40`} stroke={it.col} strokeWidth={7} />
          ))}
        </g>
      );
    case 'barcode':
      return (
        <g>
          {Array.from({length: 18}, (_, k) => (
            <rect key={k} x={-60 + k * 7} y={-30} width={1 + ((k * 7) % 5)} height={60} fill={it.col} />
          ))}
        </g>
      );
    case 'ribbon':
      return (
        <>
          <path d="M-96 -24H96L80 0L96 24H-96L-80 0Z" fill={it.col} />
          <text x={0} y={10} textAnchor="middle" fill={C.paper} style={{fontFamily: "'Oswald'", fontWeight: 700, fontSize: 28}}>
            {it.text.slice(0, 8)}
          </text>
        </>
      );
    case 'dots':
      return (
        <g>
          {Array.from({length: 16}, (_, k) => (
            <circle key={k} cx={-36 + (k % 4) * 24} cy={-36 + Math.floor(k / 4) * 24} r={3 + (k % 4) * 2} fill={it.col} />
          ))}
        </g>
      );
    case 'badge':
      return (
        <>
          <circle r={38} fill={C.ink} />
          <text x={0} y={11} textAnchor="middle" fill={C.paper} style={{fontFamily: "'Unbounded'", fontWeight: 900, fontSize: 26}}>
            99+
          </text>
        </>
      );
    case 'close':
      return (
        <>
          <rect x={-30} y={-30} width={60} height={60} rx={8} fill="none" stroke={it.col} strokeWidth={5} />
          <path d="M-14 -14L14 14M14 -14L-14 14" stroke={it.col} strokeWidth={6} strokeLinecap="round" />
        </>
      );
  }
};

const Clutter: React.FC<P> = ({f}) => (
  <g>
    {ITEMS.map((it, i) => {
      const p = tween(f, it.t, 6, 0, 1, E.in);
      if (p >= 0.999) return null;
      // 被删之前一直在抖：两帧换一次位置，像噪音
      const step = Math.floor(f / 2);
      const jx = (random(`jx${i}-${step}`) - 0.5) * 5 * (1 - p);
      const jy = (random(`jy${i}-${step}`) - 0.5) * 5 * (1 - p);
      const x = lerp(it.x, CENTER.x, 0.32 * p) + jx;
      const y = lerp(it.y, CENTER.y, 0.32 * p) + jy;
      return (
        <g key={i} transform={`translate(${n2(x)} ${n2(y)}) rotate(${n2(it.rot)}) scale(${n2(it.s * (1 - p))})`} opacity={p > 0.6 ? n2((1 - p) / 0.4) : undefined}>
          <ItemShape it={it} />
        </g>
      );
    })}
    {/* 最后一个：正中间的徽章，缩成那个点 */}
    {f < LAND + 1 &&
      (() => {
        const s = 1 - tween(f, 20, 10, 0, 1, E.in) * 0.9;
        const spin = tween(f, 18, 12, 0, 140, E.in);
        return (
          <g transform={`translate(${CENTER.x} ${CENTER.y}) rotate(${n2(-8 + spin)}) scale(${n2(s)})`}>
            <path d={burstPath(150, 18)} fill={C.ink} />
            {s > 0.5 && (
              <text x={0} y={30} textAnchor="middle" fill={C.paper} style={{fontFamily: "'Bangers'", fontSize: 92}}>
                MORE!
              </text>
            )}
          </g>
        );
      })()}
  </g>
);

/* ═══════════ 一个点 + 标题 ═══════════ */
/** 点的半径：第 29 帧弹出来，落在第 30 帧（第 1 拍） */
export const openDotR = (f: number) => (f < LAND - 1 ? 0 : DOT.r * spr(f, LAND - 1, POP, 30));

const HZ = LAYOUT.horizon;
const L = LAYOUT.mx;
const R = 1920 - LAYOUT.mx;
/** 地平线从点向两边画出去（34–60） */
export const horizonP = (f: number) => tween(f, 34, 26, 0, 1, E.inOut);
/** 标题段镜头慢推（线、点、字一起），交棒时 01 从这个宽度开始收 */
export const openPush = (f: number) => 1 + 0.024 * tween(f, 40, 64, 0, 1, E.soft);

const Title: React.FC<P> = ({f}) => {
  const out = 98;
  // 标题一个字母一个字母“吸”进来：从右边疏的位置收到最终字距
  const inFx = (at: number, gap: number, spread: number) => (i: number, n: number) => {
    const p = tween(f, at + i * gap, 22, 0, 1, E.out);
    const q = tween(f, out + (n - 1 - i) * 1.2, 8, 0, 1, E.in);
    return {o: p * (1 - q), dx: (1 - p) * (i + 1) * spread - q * 30};
  };
  return (
    <g>
      <Letters text="MINIMALISM" x={L - 4} y={HZ - 48} k="d200" size={84} ls={0.32} fx={inFx(44, 2.2, 16)} />
      <Letters text="极简主义" x={L - 2} y={HZ + 76} k="sc300" size={40} ls={0.6} c={C.ink} fx={inFx(54, 3, 10)} />
      <Txt x={R} y={HZ + 72} k="t300" size={36} anchor="end" o={vis(f, 62, out + 4)}>
        Less is more.
      </Txt>
      <Txt x={R} y={HZ - 52} k="mono" size={16} ls={0.16} c={C.greyDk} anchor="end" o={vis(f, 70, out + 2)}>
        LUDWIG MIES VAN DER ROHE
      </Txt>
    </g>
  );
};

/** 四角：期号、年代、四个名字（像片头字幕） */
const Corners: React.FC<P> = ({f}) => {
  const o = (at: number) => vis(f, at, 100);
  return (
    <g>
      <Txt x={L} y={132} k="mono" size={16} ls={0.18} c={C.greyDk} o={o(36)}>
        DESIGN STYLE · 007
      </Txt>
      <Txt x={R} y={132} k="mono" size={16} ls={0.18} c={C.greyDk} anchor="end" o={o(40)}>
        1929 — TODAY
      </Txt>
      <Txt x={L} y={968} k="mono" size={15} ls={0.24} c={C.grey} o={o(76)}>
        MIES · RAMS · JUDD · REICH · NOW
      </Txt>
      <Txt x={R} y={968} k="mono" size={15} ls={0.24} c={C.grey} anchor="end" o={o(80)}>
        @GUANMO_AI
      </Txt>
    </g>
  );
};

export const Opening: React.FC<P> = ({f}) => {
  const r = openDotR(f);
  const hp = horizonP(f);
  const push = openPush(f);
  return (
    <g>
      {f < LAND + 2 && <Clutter f={f} />}
      <g transform={push > 1 ? `translate(${CENTER.x} ${HZ}) scale(${n2(push * 1000) / 1000}) translate(${-CENTER.x} ${-HZ})` : undefined}>
        {f < HANDOFF && (
          <>
            <Hair x1={L} y1={HZ} x2={R} y2={HZ} p={hp} from="center" c={C.ink} o={0.85} />
            <Ripple f={f} at={LAND} x={CENTER.x} y={HZ} r0={DOT.r} r1={260} dur={46} />
            <Ripple f={f} at={LAND + 8} x={CENTER.x} y={HZ} r0={DOT.r} r1={150} dur={40} />
            <Dot x={CENTER.x} y={HZ} r={r / push} />
          </>
        )}
        {f >= 40 && f < 120 && <Title f={f} />}
      </g>
      {f < 114 && <Corners f={f} />}
    </g>
  );
};
