/**
 * 007 · Minimalism —— 11.0–13.2s
 *   同一原则进 App：列表删成一行、一主按钮。不是交互旅游。
 */
import React from 'react';
import {E, POP, SNAP, SMOOTH, spr, tween} from '../../../src/lib/anim';
import {C, LINE} from '../tokens';
import {INTO} from './script';
import {AT} from './timeline';
import {Box, Cam2, Dot, Txt, Why, camTrack, lerp, mixBox, n2, P, vis} from './ui';

export const PHONE: Box = {x: 680, y: 68, w: 560, h: 944, r: 76};
export const WIN: Box = {x: 200, y: 72, w: 1520, h: 888, r: 16};
const SCR = (body: Box): Box => ({x: body.x + 14, y: body.y + 14, w: body.w - 28, h: body.h - 28, r: (body.r ?? 0) - 14});

export const APP_CUTS = [678, 696, 714, 732, 750];
export const APP_KEEP = 768;
export const WEB_GO = AT.web;

export const camApp = (f: number): Cam2 =>
  camTrack(f, [
    [AT.app, {ox: 960, oy: 540, s: 1.02}],
    [APP_CUTS[0], {ox: 960, oy: 500, s: 1.08}],
    [APP_KEEP, {ox: 960, oy: 470, s: 1.12}],
    [WEB_GO - 4, {ox: 960, oy: 540, s: 1.02}],
  ]);

const EXTRAS = [
  {t: '06:30', sub: '智能推荐 · 通勤', cut: APP_CUTS[0], y: 0},
  {t: '07:30', sub: '周末', cut: APP_CUTS[1], y: 1},
  {t: '08:15', sub: '每日站会', cut: APP_CUTS[2], y: 2},
  {t: '22:00', sub: '睡眠 · 白噪', cut: APP_CUTS[3], y: 3},
];

const Scale: React.FC<{s: number; cx: number; cy: number; children: React.ReactNode}> = ({s, cx, cy, children}) =>
  s <= 0.005 ? null : (
    <g transform={s >= 0.999 ? undefined : `translate(${n2(cx)} ${n2(cy)}) scale(${n2(s)}) translate(${n2(-cx)} ${n2(-cy)})`} opacity={s < 0.45 ? n2(s / 0.45) : undefined}>
      {children}
    </g>
  );

const Row: React.FC<{x: number; r: number; y: number; t: string; sub: string; s: number; on?: number; grey?: boolean}> = ({x, r, y, t, sub, s, on = 0, grey}) => (
  <Scale s={s} cx={(x + r) / 2} cy={y - 8}>
    <Txt x={x} y={y} k="d200" size={48} c={grey ? C.grey : C.ink}>
      {t}
    </Txt>
    <Txt x={x} y={y + 26} k="sc300" size={15} ls={0.06} c={C.grey}>
      {sub}
    </Txt>
    <rect x={r - 68} y={y - 36} width={68} height={36} rx={18} fill={on > 0.01 ? C.ink : 'none'} fillOpacity={on || undefined} stroke={grey ? C.stone : C.ink} strokeWidth={LINE.main} />
    {on > 0.01 && <circle cx={r - 19} cy={y - 18} r={13} fill={C.accent} />}
    {grey && <circle cx={r - 49} cy={y - 18} r={13} fill={C.paperHi} stroke={C.stone} strokeWidth={LINE.main} />}
    <line x1={x} y1={y + 44} x2={r} y2={y + 44} stroke={C.hair} strokeWidth={1} />
  </Scale>
);

export const App: React.FC<P> = ({f}) => {
  if (f < AT.app - 4 || f >= AT.web) return null;
  const enter = spr(f, AT.app, SMOOTH, 24);
  const leave = tween(f, AT.web - 16, 16, 0, 1, E.inOut);
  const body = mixBox(PHONE, WIN, leave);
  const scr = SCR(body);
  const sx = scr.x + 36;
  const sr = scr.x + scr.w - 36;
  const chrome = 1 - tween(f, APP_CUTS[4], 12, 0, 1, E.in);
  const keep = spr(f, APP_KEEP, SNAP, 18);
  const o = enter * (1 - leave * 0.2);
  const togOn = tween(f, APP_KEEP, 10);
  return (
    <g opacity={n2(o)}>
      <rect x={n2(body.x)} y={n2(body.y)} width={n2(body.w)} height={n2(body.h)} rx={n2(body.r ?? 0)} fill={C.ink} />
      <rect x={n2(scr.x)} y={n2(scr.y)} width={n2(scr.w)} height={n2(scr.h)} rx={n2(scr.r ?? 0)} fill={C.paperHi} />
      <Txt x={sx} y={scr.y + 36} k="t500" size={15}>
        9:41
      </Txt>
      <rect x={sr - 24} y={scr.y + 22} width={22} height={12} rx={3} fill="none" stroke={C.ink} strokeWidth={1.2} />
      <rect x={sr - 22} y={scr.y + 24} width={14} height={8} rx={1.5} fill={C.ink} />
      <Txt x={sx} y={scr.y + 96} k="sc500" size={30} ls={0.04} o={tween(f, AT.app + 8, 10)}>
        闹钟
      </Txt>
      <g transform={`translate(0 ${n2((1 - keep) * 8)})`}>
        <Row x={sx} r={sr} y={scr.y + 250} t="07:00" sub="工作日 · 起床" s={tween(f, AT.app + 10, 10)} on={togOn} />
      </g>
      {EXTRAS.map((e) => {
        const s = (1 - tween(f, e.cut, 10, 0, 1, E.in)) * tween(f, AT.app + 12 + e.y * 2, 8);
        return <Row key={e.t} x={sx} r={sr} y={scr.y + 360 + e.y * 96} t={e.t} sub={e.sub} s={s} grey />;
      })}
      <g opacity={n2(chrome * tween(f, AT.app + 16, 8))}>
        <rect x={sx} y={scr.y + 760} width={110} height={36} rx={18} fill="#C23B2E" />
        <Txt x={sx + 55} y={scr.y + 784} k="sc400" size={13} c={C.paper} anchor="middle">
          NEW
        </Txt>
        <rect x={sx + 122} y={scr.y + 760} width={110} height={36} rx={18} fill={C.ink} />
        <Txt x={sx + 177} y={scr.y + 784} k="sc400" size={13} c={C.paper} anchor="middle">
          全部关闭
        </Txt>
        {['闹钟', '世界钟', '秒表', '计时'].map((lab, i) => (
          <Txt key={lab} x={sx + i * 110} y={scr.y + scr.h - 36} k="sc300" size={14} c={i === 0 ? C.ink : C.grey}>
            {lab}
          </Txt>
        ))}
      </g>
      <g opacity={n2(tween(f, APP_KEEP, 10))}>
        <circle cx={(sx + sr) / 2} cy={scr.y + scr.h - 56} r={26} fill="none" stroke={C.ink} strokeWidth={LINE.main} />
        <line x1={(sx + sr) / 2 - 9} y1={scr.y + scr.h - 56} x2={(sx + sr) / 2 + 9} y2={scr.y + scr.h - 56} stroke={C.ink} strokeWidth={1.5} />
        <line x1={(sx + sr) / 2} y1={scr.y + scr.h - 65} x2={(sx + sr) / 2} y2={scr.y + scr.h - 47} stroke={C.ink} strokeWidth={1.5} />
      </g>
      {togOn > 0.2 && <Dot x={sr - 19} y={scr.y + 232} r={0} />}
      <Why o={vis(f, AT.app + 6, AT.web - 8, 10, 8)} kicker="进产品  App" line={INTO.app.why} en={INTO.app.en} />
    </g>
  );
};
