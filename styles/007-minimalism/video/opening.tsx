/**
 * 007 · Minimalism —— 0.0–8.0s
 *   0.0–2.2  堆满：噪音 / 控件 / 装饰挤满屏。每件东西抢一次注意，不删。
 *   2.2–8.0  一次删一个：先出「为什么」，再按类、按顺序删。
 */
import React from 'react';
import {random} from 'remotion';
import {E, POP, SNAP, spr, tween} from '../../../src/lib/anim';
import {C, DOT, LAYOUT} from '../tokens';
import {CUTS, LINES, type CutCat} from './script';
import {AT} from './timeline';
import {Dot, Hair, lerp, n2, P, Ripple, Txt, vis, Why} from './ui';

export const CENTER = {x: 960, y: LAYOUT.horizon};
export const LAND = 432; // MORE! 收成橙点
export const HANDOFF = AT.bone;
export const openPush = (f: number) => 1 + 0.02 * tween(f, LAND, 40, 0, 1, E.soft);

type Kind = 'word' | 'burst' | 'ring' | 'star' | 'arrow' | 'swash' | 'box' | 'stripes' | 'barcode' | 'ribbon' | 'dots' | 'badge' | 'close' | 'slider' | 'check' | 'progress' | 'chip';
type Item = {
  kind: Kind;
  cat: Exclude<CutCat, 'last'>;
  x: number;
  y: number;
  rot: number;
  s: number;
  text: string;
  fam: string;
  wt: number;
  it: boolean;
  col: string;
  t: number;
  shout: number;
  gx: number;
  gy: number;
};

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
  ['VIP', 'Fredoka', 700],
  ['BEST', 'Fredoka', 700],
  ['超值', 'Noto Sans SC', 900],
  ['必买', 'Noto Sans SC', 900],
  ['Click here', 'Instrument Serif', 400, true],
  ['MEGA', 'Unbounded', 900],
  ['PLUS+', 'Jost', 800],
  ['PRO MAX', 'Jost', 800],
  ['LOADING…', 'Silkscreen', 400],
  ['GIFT', 'Fredoka', 700],
  ['SUPER', 'Bangers', 400],
  ['TOP 10', 'Oswald', 700],
  ['抢', 'Noto Sans SC', 900],
  ['ULTRA', 'TeX Gyre Heros', 700],
  ['More!', 'Jost', 800],
  ['马上', 'Noto Sans SC', 900],
];
const INK_COLS = [C.ink, C.ink, C.greyDk, C.grey, '#B4B0A8'];
const ALT_COLS = ['#C23B2E', '#2A6B7C', '#3D5A99', '#C4A35A'];
const CATS: Exclude<CutCat, 'last'>[] = ['promo', 'color', 'button', 'deco'];
const KIND_BY_CAT: Record<Exclude<CutCat, 'last'>, Kind[]> = {
  promo: ['word', 'word', 'ribbon', 'chip'],
  color: ['burst', 'badge', 'ring', 'box', 'word'],
  button: ['box', 'close', 'badge', 'check', 'slider'],
  deco: ['star', 'arrow', 'swash', 'stripes', 'barcode', 'dots', 'progress'],
};

const snap = (v: number, pitch: number, origin: number) => origin + Math.round((v - origin) / pitch) * pitch;

const ITEMS: Item[] = (() => {
  const out: Item[] = [];
  const cols = 13;
  const rows = 8;
  const cw = 1920 / cols;
  const ch = 1080 / rows;
  let n = 0;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const per = random(`per-${i}-${j}`) < 0.42 ? 2 : 1;
      for (let k = 0; k < per; k++) {
        const r = (s: string) => random(`${s}-${n}`);
        const x = (i + 0.16 + 0.68 * r('x')) * cw;
        const y = (j + 0.16 + 0.62 * r('y')) * ch;
        if (y > 860) continue;
        if (Math.hypot(x - 1180, y - 360) < 90) continue;
        const cat = CATS[n % 4];
        const kinds = KIND_BY_CAT[cat];
        const kind = kinds[Math.floor(r('k') * kinds.length)];
        const w = WORDS[Math.floor(r('w') * WORDS.length)];
        out.push({
          kind,
          cat,
          x,
          y,
          rot: (r('r') - 0.5) * 26,
          s: 0.68 + 0.7 * r('s'),
          text: w[0],
          fam: w[1],
          wt: w[2],
          it: !!w[3],
          col: cat === 'color' ? ALT_COLS[Math.floor(r('c') * ALT_COLS.length)] : INK_COLS[Math.floor(r('c') * INK_COLS.length)],
          t: 0,
          shout: 10 + ((n * 9) % 108),
          gx: snap(x, 148, 180),
          gy: snap(y, 128, 160),
        });
        n++;
      }
    }
  }
  const byCat: Record<string, Item[]> = {promo: [], color: [], button: [], deco: []};
  for (const it of out) byCat[it.cat].push(it);
  for (const cat of CATS) {
    const cut = CUTS.find((c) => c.cat === cat)!;
    const list = byCat[cat].sort((a, b) => a.y - b.y || a.x - b.x);
    const span = 56;
    list.forEach((it, i) => {
      it.t = cut.at + 10 + (i * span) / Math.max(1, list.length - 1);
    });
  }
  return out;
})();

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

const ItemShape: React.FC<{it: Item; f: number}> = ({it, f}) => {
  const word = (size: number, col = it.col) => (
    <text x={0} y={size * 0.36} textAnchor="middle" fill={col} style={{fontFamily: `'${it.fam}'`, fontWeight: it.wt, fontStyle: it.it ? 'italic' : undefined, fontSize: size}}>
      {it.text}
    </text>
  );
  const fill = tween(f, 8 + (it.shout % 20), 90, 0.12, 0.86, E.out);
  switch (it.kind) {
    case 'word':
      return word(it.text.length > 5 ? 44 : 66);
    case 'burst':
      return (
        <>
          <path d={burstPath(64, 14)} fill={it.col} />
          <text x={0} y={12} textAnchor="middle" fill={C.paper} style={{fontFamily: "'Bangers'", fontSize: 32}}>
            {it.text.length > 5 ? 'NEW' : it.text}
          </text>
        </>
      );
    case 'ring':
      return (
        <>
          <circle r={50} fill="none" stroke={it.col} strokeWidth={6} />
          <circle r={38} fill="none" stroke={it.col} strokeWidth={2} strokeDasharray="4 6" />
          {word(24)}
        </>
      );
    case 'star':
      return <path d={STAR} fill={it.col} transform="scale(1.35)" />;
    case 'arrow':
      return <path d="M-70 -14H20V-36L74 0L20 36V14H-70Z" fill={it.col} />;
    case 'swash':
      return <path d="M-90 10C-50 -24 -10 30 30 0S90 -10 100 -20" fill="none" stroke={it.col} strokeWidth={9} strokeLinecap="round" />;
    case 'box':
      return (
        <>
          <rect x={-72} y={-30} width={144} height={60} fill={C.ink} transform="translate(6 6)" opacity={0.28} />
          <rect x={-72} y={-30} width={144} height={60} fill={it.col === C.ink ? C.ink : C.paper} stroke={C.ink} strokeWidth={3} />
          <text x={0} y={10} textAnchor="middle" fill={it.col === C.ink ? C.paper : C.ink} style={{fontFamily: `'${it.fam}'`, fontWeight: it.wt, fontSize: 28}}>
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
          {Array.from({length: 16}, (_, k) => (
            <rect key={k} x={-56 + k * 7} y={-26} width={1 + ((k * 7) % 5)} height={52} fill={it.col} />
          ))}
        </g>
      );
    case 'ribbon':
      return (
        <>
          <path d="M-90 -22H90L76 0L90 22H-90L-76 0Z" fill={it.col} />
          <text x={0} y={8} textAnchor="middle" fill={C.paper} style={{fontFamily: "'Oswald'", fontWeight: 700, fontSize: 24}}>
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
          <circle r={34} fill={it.col} />
          <text x={0} y={10} textAnchor="middle" fill={C.paper} style={{fontFamily: "'Unbounded'", fontWeight: 900, fontSize: 22}}>
            99+
          </text>
        </>
      );
    case 'close':
      return (
        <>
          <rect x={-26} y={-26} width={52} height={52} rx={8} fill="none" stroke={it.col} strokeWidth={5} />
          <path d="M-12 -12L12 12M12 -12L-12 12" stroke={it.col} strokeWidth={5} strokeLinecap="round" />
        </>
      );
    case 'slider':
      return (
        <>
          <rect x={-70} y={-8} width={140} height={16} rx={8} fill={C.stone} />
          <rect x={-70} y={-8} width={140 * fill} height={16} rx={8} fill={it.col} />
          <circle cx={-70 + 140 * fill} cy={0} r={14} fill={C.paperHi} stroke={it.col} strokeWidth={3} />
        </>
      );
    case 'check':
      return (
        <>
          <rect x={-22} y={-22} width={44} height={44} rx={6} fill={C.paperHi} stroke={it.col} strokeWidth={4} />
          <path d="M-10 2L-2 12L14 -10" fill="none" stroke={it.col} strokeWidth={5} strokeLinecap="round" opacity={fill} />
        </>
      );
    case 'progress':
      return (
        <>
          <rect x={-80} y={-10} width={160} height={20} rx={4} fill={C.stone} />
          <rect x={-80} y={-10} width={160 * fill} height={20} rx={4} fill={it.col} />
        </>
      );
    case 'chip':
      return (
        <>
          <rect x={-58} y={-22} width={116} height={44} rx={22} fill={it.col} />
          <text x={0} y={8} textAnchor="middle" fill={C.paper} style={{fontFamily: `'${it.fam}'`, fontWeight: 700, fontSize: 20}}>
            {it.text.slice(0, 6)}
          </text>
        </>
      );
  }
};

const aligned = (f: number) => {
  let n = 0;
  for (const c of CUTS) if (c.cat !== 'last' && f >= c.at + 8) n += 1;
  return n / 4;
};

const Clutter: React.FC<P> = ({f}) => {
  const align = aligned(f);
  const alignP = spr(f, AT.cut, SNAP, 28) * align;
  return (
    <g>
      {ITEMS.map((it, i) => {
        const gone = tween(f, it.t, 10, 0, 1, E.in);
        if (gone >= 0.999) return null;
        const shout = f < AT.cut ? spr(f, it.shout, POP, 16) : 0;
        const peak = Math.sin(Math.min(1, shout) * Math.PI);
        const marked = CUTS.find((c) => c.cat === it.cat && f >= c.at && f < it.t + 2);
        const jx = f < AT.cut ? (random(`jx${i}-${Math.floor(f / 2)}`) - 0.5) * 4 : 0;
        const jy = f < AT.cut ? (random(`jy${i}-${Math.floor(f / 2)}`) - 0.5) * 4 : 0;
        const x = lerp(it.x, it.gx, alignP) + jx + (it.x - CENTER.x) * 0.35 * gone;
        const y = lerp(it.y, it.gy, alignP) + jy + (it.y - CENTER.y) * 0.28 * gone;
        const rot = lerp(it.rot, 0, alignP) + gone * (it.x > 960 ? 12 : -12);
        const sc = it.s * (1 + 0.2 * peak) * (1 - gone);
        return (
          <g key={i} transform={`translate(${n2(x)} ${n2(y)}) rotate(${n2(rot)}) scale(${n2(sc)})`} opacity={gone > 0.55 ? n2((1 - gone) / 0.45) : undefined}>
            <ItemShape it={it} f={f} />
            {marked && <line x1={-70} y1={0} x2={70 * tween(f, marked.at, 8)} y2={0} stroke={C.ink} strokeWidth={4} />}
          </g>
        );
      })}
    </g>
  );
};

const LAST = {x: 1180, y: 360};

const LastBadge: React.FC<P> = ({f}) => {
  if (f >= LAND + 2) return null;
  const to = spr(f, CUTS[4].at + 8, SNAP, 22);
  const shrink = tween(f, LAND - 14, 14, 0, 1, E.in);
  const x = lerp(LAST.x, CENTER.x, to);
  const y = lerp(LAST.y, CENTER.y, to);
  const s = lerp(1.15, 0.12, shrink);
  const spin = tween(f, LAND - 14, 14, 0, 120, E.in);
  return (
    <g transform={`translate(${n2(x)} ${n2(y)}) rotate(${n2(-8 + spin)}) scale(${n2(s)})`}>
      <path d={burstPath(132, 18)} fill={C.ink} />
      {s > 0.45 && (
        <text x={0} y={26} textAnchor="middle" fill={C.paper} style={{fontFamily: "'Bangers'", fontSize: 78}}>
          MORE!
        </text>
      )}
    </g>
  );
};

const Remain: React.FC<P> = ({f}) => {
  const left = ITEMS.filter((it) => f < it.t).length + (f < LAND ? 1 : 0);
  const o = vis(f, 16, LAND + 20, 10, 12);
  return (
    <g opacity={n2(o)}>
      <Txt x={1800} y={132} k="mono" size={15} ls={0.14} c={C.greyDk} anchor="end">
        {`LEFT  ${String(left).padStart(3, '0')}`}
      </Txt>
    </g>
  );
};

const Caption: React.FC<P> = ({f}) => {
  if (f < 14) return null;
  if (f < AT.cut) {
    return <Why o={vis(f, 16, AT.cut - 4, 12, 8)} kicker="00  堆满" line={LINES[0]} en="SEE THE EXCESS FIRST" />;
  }
  let cur = CUTS[0];
  for (const c of CUTS) if (f >= c.at) cur = c;
  const next = CUTS.find((c) => c.at > cur.at);
  const o = vis(f, cur.at, next ? next.at - 2 : HANDOFF - 8, 8, 8);
  const dy = (1 - spr(f, cur.at, POP, 16)) * 18;
  return (
    <g transform={`translate(0 ${n2(dy)})`}>
      <Why o={o} kicker={cur.kicker} line={cur.why} en={cur.en} />
    </g>
  );
};

export const Opening: React.FC<P> = ({f}) => {
  const r = f < LAND - 1 ? 0 : DOT.r * spr(f, LAND - 1, POP, 28);
  const hp = tween(f, LAND + 4, 22, 0, 1, E.inOut);
  const push = openPush(f);
  return (
    <g>
      {f < LAND + 2 && <Clutter f={f} />}
      {f < LAND + 2 && <LastBadge f={f} />}
      <g transform={push > 1 ? `translate(${CENTER.x} ${CENTER.y}) scale(${n2(push)}) translate(${-CENTER.x} ${-CENTER.y})` : undefined}>
        {f >= LAND - 1 && f < HANDOFF + 8 && (
          <>
            <Hair x1={120} y1={CENTER.y} x2={1800} y2={CENTER.y} p={hp} from="center" c={C.ink} o={0.85} />
            <Ripple f={f} at={LAND} x={CENTER.x} y={CENTER.y} r0={DOT.r} r1={240} dur={44} />
            <Ripple f={f} at={LAND + 8} x={CENTER.x} y={CENTER.y} r0={DOT.r} r1={140} dur={36} />
            <Dot x={CENTER.x} y={CENTER.y} r={r / push} />
          </>
        )}
      </g>
      <Remain f={f} />
      <Txt x={120} y={132} k="mono" size={15} ls={0.16} c={C.greyDk} o={vis(f, 10, HANDOFF - 6)}>
        DESIGN STYLE · 007
      </Txt>
      <Caption f={f} />
    </g>
  );
};
