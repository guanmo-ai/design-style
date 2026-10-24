/** 010 · Paper Cut —— 公共零件：页眉页脚、编辑器、手机、标签、揭纸转场 */
import React from 'react';
import {E, POP, spr, tween} from '../../../src/lib/anim';
import {C, F, HILLS} from '../tokens';
import {AT, CHAPTERS, DURATION, TR} from './timeline';
import {H, LayerFilters, W, c01, n1} from './layers';

export type P = {f: number};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const Txt: React.FC<{
  x: number;
  y: number;
  size: number;
  font?: 'display' | 'cn' | 'mono';
  w?: number;
  c?: string;
  anchor?: 'start' | 'middle' | 'end';
  ls?: number;
  o?: number;
  children: React.ReactNode;
}> = ({x, y, size, font = 'cn', w = 500, c = C.ink, anchor = 'start', ls = 0, o, children}) => (
  <text
    x={n1(x)}
    y={n1(y)}
    fontFamily={F[font]}
    fontSize={size}
    fontWeight={font === 'mono' ? 500 : w}
    fill={c}
    textAnchor={anchor}
    letterSpacing={ls}
    opacity={o}
  >
    {children}
  </text>
);

export const Defs: React.FC = () => (
  <svg width={0} height={0} style={{position: 'absolute'}}>
    <LayerFilters />
    <defs>
      {HILLS.map((c, i) => (
        <linearGradient key={i} id={`grade${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={i < 3 ? '#7EC8E8' : '#C8E86A'} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
      ))}
    </defs>
  </svg>
);

export const Hud: React.FC<P> = ({f}) => {
  const o = tween(f, 18, 16) * (1 - tween(f, DURATION - 56, 36));
  if (o <= 0.001) return null;
  let k = 0;
  CHAPTERS.forEach(([, at], j) => {
    if (f >= at) k = j;
  });
  const p = tween(f, CHAPTERS[k][1], 14, 0, 1, E.out);
  const light = f < AT.geo || f >= AT.dio;
  const ink = light ? C.ink : C.paper;
  const mut = light ? C.grey : 'rgba(246,243,235,0.55)';
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <g opacity={o}>
        <Txt x={72} y={52} size={15} font="display" w={600} c={ink} ls={2.4}>
          DESIGN STYLE  /  N°010
        </Txt>
        <Txt x={1848} y={52} size={15} font="cn" w={500} c={mut} anchor="end">
          剪纸博览
        </Txt>
        <rect x={72} y={1036} width={1776} height={3} rx={1.5} fill={ink} opacity={0.12} />
        <rect x={72} y={1036} width={1776 * (f / DURATION)} height={3} rx={1.5} fill={C.sun} />
        <g opacity={0.3 + 0.7 * p} transform={`translate(0 ${n1((1 - p) * 10)})`}>
          <Txt x={72} y={1024} size={18} font="mono" c={C.sun}>
            {`0${k + 1} / 0${CHAPTERS.length}`}
          </Txt>
          <Txt x={1848} y={1024} size={20} font="cn" w={700} c={ink} anchor="end">
            {CHAPTERS[k][0]}
          </Txt>
        </g>
      </g>
    </svg>
  );
};

/** 笔记本卡片（开场 / 海报上的标签） */
export const NoteCard: React.FC<{x: number; y: number; w: number; h: number; k: number}> = ({x, y, w, h, k}) => {
  if (k <= 0.001) return null;
  const holes = 7;
  return (
    <g transform={`translate(${n1(x)} ${n1(y + (1 - k) * 28)}) scale(${(0.92 + 0.08 * k).toFixed(3)})`} opacity={k} filter="url(#shNear)">
      <rect width={w} height={h} rx={18} fill={C.paper} />
      <rect x={-14} y={18} width={28} height={h - 36} rx={12} fill={C.paper} />
      {Array.from({length: holes}, (_, i) => {
        const cy = 36 + i * ((h - 52) / (holes - 1));
        return <circle key={i} cx={0} cy={cy} r={6} fill={C.sky} />;
      })}
    </g>
  );
};

/** 编辑海报的画板 + 图层面板 */
export const EditorChrome: React.FC<P & {active: number}> = ({f, active}) => {
  const shell = spr(f, AT.dio - 28, POP, 28) * (1 - tween(f, AT.sil - 18, 22, 0, 1, E.in));
  const bar = spr(f, AT.dio - 24, POP, 28);
  const board = spr(f, AT.dio - 20, POP, 28);
  const panel = spr(f, AT.dio - 16, POP, 28);
  if (shell <= 0.001) return null;
  const rows = ['L6  远山 FAR', 'L5  岭', 'L4  中景 MID', 'L3  树', 'L2  近山', 'L1  前景 NEAR'];
  return (
    <g>
      <g opacity={Math.min(1, shell)} transform={`translate(0 ${n1((1 - shell) * 28)})`} filter="url(#shNear)">
        <rect x={48} y={78} width={1824} height={924} rx={22} fill={C.paper} />
      </g>
      <g opacity={Math.min(1, bar)} transform={`translate(0 ${n1((1 - bar) * 12)})`}>
        <rect x={64} y={94} width={1788} height={52} rx={12} fill={C.cream} />
        <Txt x={86} y={128} size={20} font="cn" w={700} c={C.ink}>
          编辑海报
        </Txt>
        <Txt x={186} y={128} size={13} font="mono" c={C.grey} ls={1}>
          POSTER  ·  1920×1080  ·  6 SHEETS
        </Txt>
      </g>
      <rect x={80} y={168} width={1320} height={800} rx={14} fill="none" stroke={C.cream} strokeWidth={2} opacity={Math.min(1, board)} />
      <g opacity={Math.min(1, panel)} transform={`translate(${n1(1448 + (1 - panel) * 40)} 168)`}>
        <rect width={388} height={800} rx={14} fill={C.cream} />
        <Txt x={24} y={42} size={16} font="cn" w={700} c={C.ink}>
          图层
        </Txt>
        <Txt x={364} y={42} size={12} font="mono" c={C.grey} anchor="end">
          LAYERS
        </Txt>
        {rows.map((row, i) => {
          const rk = spr(f, AT.dio - 12 + i * 4, POP, 28);
          if (rk < 0.02) return null;
          const on = active === i;
          return (
            <g key={i} opacity={Math.min(1, rk)} transform={`translate(${n1(16 + (1 - rk) * 18)} ${n1(64 + i * 88)})`}>
              <rect width={356} height={76} rx={12} fill={on ? C.white : 'transparent'} stroke={on ? HILLS[i] : 'rgba(20,32,40,0.08)'} strokeWidth={on ? 2 : 1} />
              <rect x={14} y={22} width={32} height={32} rx={6} fill={HILLS[i]} />
              <Txt x={58} y={46} size={18} font="cn" w={on ? 700 : 500} c={C.ink}>
                {row}
              </Txt>
            </g>
          );
        })}
      </g>
    </g>
  );
};

export const Phone: React.FC<P> = ({f}) => {
  const k = spr(f, AT.torn + 2, POP, 28) * (1 - tween(f, AT.type - 16, 20, 0, 1, E.in));
  if (k <= 0.001) return null;
  return (
    <g opacity={Math.min(1, k)} transform={`translate(0 ${n1((1 - k) * 36)})`} filter="url(#shNear)">
      <rect x={690} y={78} width={540} height={924} rx={48} fill="#1A2228" />
    </g>
  );
};

/** 刘海和时钟画在风景上面，避免被头图裁掉 */
export const PhoneStatus: React.FC<{k?: number}> = ({k = 1}) => {
  if (k <= 0.001) return null;
  return (
    <g opacity={k}>
      <rect x={910} y={106} width={100} height={18} rx={9} fill="#0A1218" />
      <Txt x={734} y={156} size={14} font="mono" c={C.paper} o={0.7}>
        09:41
      </Txt>
    </g>
  );
};

export const Tag: React.FC<{f: number; t0: number; x: number; y: number; en: string; zh: string; dark?: boolean}> = ({f, t0, x, y, en, zh, dark}) => {
  const k = spr(f, t0, POP, 28);
  if (k <= 0.001) return null;
  return (
    <g opacity={k} transform={`translate(${n1(x)} ${n1(y + (1 - k) * 16)})`}>
      <Txt x={0} y={0} size={13} font="mono" c={C.sun} ls={1.6}>
        {en}
      </Txt>
      <Txt x={0} y={28} size={28} font="cn" w={900} c={dark ? C.paper : C.ink}>
        {zh}
      </Txt>
    </g>
  );
};

/** 揭纸：波形边缘从下往上 */
export const waveD = (p: number, seed: number) => {
  const y = H * (1 - c01(p));
  let d = `M0 ${H} L0 ${n1(y)}`;
  for (let i = 0; i <= 16; i++) {
    const x = (W / 16) * i;
    const amp = 28 * Math.sin(p * Math.PI) * (i % 2 === 0 ? 1 : -0.7);
    d += ` L${n1(x)} ${n1(y + amp + Math.sin(i * 1.3 + seed) * 10)}`;
  }
  return `${d} L${W} ${H} Z`;
};

/** 撕开：毛边从左往右 */
export const tearD = (p: number, seed: number) => {
  const t = c01(p);
  const x = W * t;
  let d = `M0 0 H${n1(x)}`;
  for (let i = 0; i <= 28; i++) {
    const y = (H / 28) * i;
    const jag = 14 * Math.sin(i * 2.4 + seed) + 32 * Math.sin(i * 0.55 + seed * 0.4) * Math.sin(t * Math.PI);
    d += ` L${n1(x + jag)} ${n1(y)}`;
  }
  return `${d} L0 ${H} Z`;
};

/** 刀锋：从中缝向外劈开 */
export const bladeD = (p: number) => {
  const w = 16 + (W - 16) * c01(p);
  const x0 = 960 - w / 2;
  return `M${n1(x0)} 0 H${n1(x0 + w)} V${H} H${n1(x0)} Z`;
};

/** 折页：从右上盖过来 */
export const foldD = (p: number) => {
  const t = c01(p);
  const x = W * (1 - t);
  const dip = 70 * Math.sin(t * Math.PI);
  return `M${n1(x - dip)} 0 H${W} V${H} H${n1(x + dip * 0.4)} Z`;
};

export type WipeKind = 'wave' | 'tear' | 'blade' | 'fold';
export const wipeD = (kind: WipeKind, p: number, seed: number) => {
  if (kind === 'tear') return tearD(p, seed);
  if (kind === 'blade') return bladeD(p);
  if (kind === 'fold') return foldD(p);
  return waveD(p, seed);
};

export const PaperWipe: React.FC<{p: number; fill?: string}> = ({p, fill = C.paper}) => {
  if (p <= 0 || p >= 1) return null;
  const y = H * (1 - p);
  return (
    <rect x={0} y={y - 8} width={W} height={16} fill={fill} opacity={0.35 + 0.4 * Math.sin(p * Math.PI)} />
  );
};
