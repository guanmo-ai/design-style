/**
 * 007 · Minimalism —— App 2.0–10.0s（f104–600）
 *   地平线长成一部手机；先把多余的闹钟、徽章、第二按钮删到只剩一行；
 *   按压缩放 → 推到响铃页 → sheet 拉起「稍后」→ 拨开那个橙点开关。
 */
import React from 'react';
import {E, SNAP, SMOOTH, spr, tween} from '../../../src/lib/anim';
import {C, LINE} from '../tokens';
import {AT} from './timeline';
import {Box, Cam2, camTrack, Dot, Letters, lerp, mixBox, n2, P, Txt, vis, World} from './ui';
import {CENTER, HANDOFF} from './opening';

export const PHONE: Box = {x: 680, y: 68, w: 560, h: 944, r: 76};
const SCR: Box = {x: PHONE.x + 14, y: PHONE.y + 14, w: PHONE.w - 28, h: PHONE.h - 28, r: 62};
const LINE_BOX: Box = {x: 120, y: 532, w: 1680, h: 16, r: 0};
const WIN_BOX: Box = {x: 200, y: 72, w: 1520, h: 888, r: 16};

export const camApp = (f: number): Cam2 =>
  camTrack(f, [
    [HANDOFF, {ox: 960, oy: 540, s: 1}],
    [200, {ox: 960, oy: 500, s: 1.05}],
    [PRESS_AT, {ox: 920, oy: 420, s: 1.14}],
    [PUSH_AT + 24, {ox: 960, oy: 470, s: 1.08}],
    [SHEET_AT + 8, {ox: 960, oy: 610, s: 1.16}],
    [TOG_AT, {ox: 1004, oy: 392, s: 1.2}],
    [WEB_GO - 4, {ox: 960, oy: 540, s: 1.02}],
  ]);

export const HOOK_CUTS = [156, 163.5, 171, 178.5, 186];
export const PRESS_AT = 258;
export const PUSH_AT = 270;
export const SHEET_AT = 372;
export const SHEET_TAP = 414;
export const SHEET_OUT = 438;
export const TOG_AT = 504;
export const WEB_GO = AT.web;

const SX = SCR.x + 36;
const SR = SCR.x + SCR.w - 36;
const TOG = {w: 68, h: 38, y: 392};
const togX = () => SR - TOG.w;
export const knob = (on: number) => ({x: togX() + 19 + (TOG.w - 38) * on, y: TOG.y});

const Scale: React.FC<{s: number; cx: number; cy: number; children: React.ReactNode}> = ({s, cx, cy, children}) =>
  s <= 0.005 ? null : s >= 0.999 ? <>{children}</> : (
    <g transform={`translate(${n2(cx)} ${n2(cy)}) scale(${n2(s)}) translate(${n2(-cx)} ${n2(-cy)})`} opacity={s < 0.45 ? n2(s / 0.45) : undefined}>
      {children}
    </g>
  );

const pressAmt = (f: number, at: number) => {
  const down = tween(f, at, 5, 0, 1, E.in);
  const up = tween(f, at + 5, 9, 0, 1, E.out);
  return down * (1 - up);
};

const PhoneChrome: React.FC<{body: Box}> = ({body}) => (
  <g>
    <rect x={n2(body.x)} y={n2(body.y)} width={n2(body.w)} height={n2(body.h)} rx={n2(body.r ?? 0)} fill={C.ink} />
  </g>
);

const Status: React.FC<{x: number; y: number; w: number; o?: number}> = ({x, y, w, o = 1}) =>
  o <= 0.001 ? null : (
    <g opacity={o < 1 ? n2(o) : undefined}>
      <Txt x={x} y={y + 18} k="t500" size={15}>
        9:41
      </Txt>
      <rect x={x + w - 28} y={y + 8} width={24} height={12} rx={3} fill="none" stroke={C.ink} strokeWidth={1.2} />
      <rect x={x + w - 26} y={y + 10} width={16} height={8} rx={1.5} fill={C.ink} />
    </g>
  );

type Extra = {t: string; sub: string; cut: number; y: number};
const EXTRAS: Extra[] = [
  {t: '06:30', sub: '智能推荐 · 通勤', cut: HOOK_CUTS[0], y: 520},
  {t: '07:30', sub: '周末', cut: HOOK_CUTS[1], y: 620},
  {t: '08:15', sub: '每日站会', cut: HOOK_CUTS[2], y: 720},
  {t: '22:00', sub: '睡眠 · 助眠白噪', cut: HOOK_CUTS[3], y: 820},
];

const Row: React.FC<{y: number; t: string; sub: string; s: number; on?: number; grey?: boolean}> = ({y, t, sub, s, on = 0, grey}) => (
  <Scale s={s} cx={(SX + SR) / 2} cy={y - 10}>
    <Txt x={SX - 2} y={y} k="d200" size={56} c={grey ? C.grey : C.ink}>
      {t}
    </Txt>
    <Txt x={SX} y={y + 28} k="sc300" size={16} ls={0.08} c={C.grey}>
      {sub}
    </Txt>
    <rect x={togX()} y={y - 40} width={TOG.w} height={TOG.h} rx={TOG.h / 2} fill={on > 0.01 ? C.ink : 'none'} fillOpacity={on > 0.01 ? n2(on) : undefined} stroke={grey ? C.stone : C.ink} strokeWidth={LINE.main} />
    {grey && <circle cx={togX() + 19} cy={y - 21} r={15} fill={C.paperHi} stroke={C.stone} strokeWidth={LINE.main} />}
    <line x1={SX} y1={y + 52} x2={SR} y2={y + 52} stroke={C.hair} strokeWidth={1} />
  </Scale>
);

const List: React.FC<P & {push: number}> = ({f, push}) => {
  const ui = (at: number) => tween(f, at, 12, 0, 1, E.out);
  const press = pressAmt(f, PRESS_AT);
  const mainS = 1 - 0.055 * press;
  const on = spr(f, TOG_AT, SNAP, 16);
  return (
    <g transform={`translate(${n2(-SCR.w * push)} 0)`} opacity={n2(1 - push * 0.15)}>
      <Status x={SX} y={SCR.y + 18} w={SCR.w - 72} o={ui(128)} />
      <Txt x={SX} y={SCR.y + 118} k="sc500" size={34} ls={0.04} o={ui(132)}>
        闹钟
      </Txt>
      <line x1={SX} y1={SCR.y + 148} x2={SR} y2={SCR.y + 148} stroke={C.hair} strokeWidth={1} />
      <g transform={`translate(${n2((SX + SR) / 2)} ${TOG.y}) scale(${n2(mainS)}) translate(${n2(-(SX + SR) / 2)} ${-TOG.y})`}>
        <Letters text="07:00" x={SX - 4} y={TOG.y + 28} k="d100" size={92} fx={(i) => ({o: tween(f, 138 + i * 1.4, 12), dy: (1 - tween(f, 138 + i * 1.4, 14, 0, 1, E.out)) * 16})} />
        <Txt x={SX} y={TOG.y + 62} k="sc300" size={18} ls={0.1} c={C.greyDk} o={ui(150)}>
          工作日 · 起床
        </Txt>
        <rect x={togX()} y={TOG.y - TOG.h / 2} width={TOG.w} height={TOG.h} rx={TOG.h / 2} fill={on > 0.01 ? C.ink : 'none'} fillOpacity={on > 0.01 ? n2(on) : undefined} stroke={C.ink} strokeWidth={LINE.main} />
        <line x1={SX} y1={TOG.y + 86} x2={SR} y2={TOG.y + 86} stroke={C.hair} strokeWidth={1} />
      </g>
      {EXTRAS.map((e) => (
        <Row key={e.t} y={e.y} t={e.t} sub={e.sub} s={(1 - tween(f, e.cut, 6, 0, 1, E.in)) * ui(142)} grey />
      ))}
      <Scale s={(1 - tween(f, HOOK_CUTS[4], 6, 0, 1, E.in)) * ui(160)} cx={(SX + SR) / 2} cy={900}>
        <circle cx={(SX + SR) / 2} cy={900} r={26} fill="none" stroke={C.ink} strokeWidth={LINE.main} />
        <path d={`M${(SX + SR) / 2 - 9} 900H${(SX + SR) / 2 + 9}M${(SX + SR) / 2} 891V909`} stroke={C.ink} strokeWidth={LINE.main} />
      </Scale>
      {/* 删完以后只留一个加号，再淡掉——列表只做一件事 */}
      <Scale s={tween(f, 196, 14) * (1 - tween(f, 248, 10, 0, 1, E.in))} cx={(SX + SR) / 2} cy={820}>
        <circle cx={(SX + SR) / 2} cy={820} r={28} fill="none" stroke={C.ink} strokeWidth={LINE.main} />
        <path d={`M${(SX + SR) / 2 - 10} 820H${(SX + SR) / 2 + 10}M${(SX + SR) / 2} 810V830`} stroke={C.ink} strokeWidth={LINE.main} />
      </Scale>
    </g>
  );
};

const Ringing: React.FC<P & {push: number}> = ({f, push}) => {
  const o = tween(f, PUSH_AT + 4, 16);
  if (o <= 0.001 && push <= 0.01) return null;
  const slide = spr(f, SHEET_TAP + 2, SMOOTH, 20);
  return (
    <g transform={`translate(${n2(SCR.w * (1 - push))} 0)`} opacity={n2(o)}>
      <Status x={SX} y={SCR.y + 18} w={SCR.w - 72} />
      <Txt x={(SX + SR) / 2} y={SCR.y + 132} k="mono" size={13} ls={0.18} c={C.grey} anchor="middle">
        MON · 26 OCT
      </Txt>
      <Letters text="07:00" x={(SX + SR) / 2 - 148} y={SCR.y + 320} k="d100" size={120} fx={(i) => ({o: tween(f, PUSH_AT + 8 + i * 1.2, 12)})} />
      <Txt x={(SX + SR) / 2} y={SCR.y + 368} k="sc300" size={20} ls={0.12} c={C.greyDk} anchor="middle" o={tween(f, PUSH_AT + 16, 12)}>
        起床
      </Txt>
      {/* 滑动停止：一根发丝线，橙点从左滑到右 */}
      <g opacity={n2(tween(f, 318, 14) * (1 - tween(f, SHEET_AT, 10, 0, 1, E.in)))}>
        <line x1={SX} y1={780} x2={SR} y2={780} stroke={C.ink} strokeWidth={LINE.main} />
        <circle cx={n2(lerp(SX + 18, SR - 18, slide))} cy={780} r={18} fill={C.accent} />
        <Txt x={(SX + SR) / 2} y={824} k="sc300" size={16} ls={0.1} anchor="middle">
          滑动停止
        </Txt>
      </g>
    </g>
  );
};

const Sheet: React.FC<P> = ({f}) => {
  const up = spr(f, SHEET_AT, {damping: 16, stiffness: 170, mass: 0.85}, 30);
  const down = tween(f, SHEET_OUT, 16, 0, 1, E.in);
  const p = up * (1 - down);
  if (p <= 0.01) return null;
  const y0 = SCR.y + SCR.h;
  const y = lerp(y0, SCR.y + 420, p);
  const tap = pressAmt(f, SHEET_TAP);
  const pick = spr(f, SHEET_TAP, SNAP, 14);
  return (
    <g>
      <rect x={SCR.x} y={SCR.y} width={SCR.w} height={SCR.h} rx={SCR.r} fill={C.ink} opacity={n2(0.18 * p)} />
      <rect x={SCR.x} y={n2(y)} width={SCR.w} height={n2(SCR.y + SCR.h - y + 40)} rx={36} fill={C.paperHi} />
      <rect x={(SX + SR) / 2 - 22} y={n2(y + 16)} width={44} height={5} rx={2.5} fill={C.stone} />
      <Txt x={SX} y={n2(y + 72)} k="sc400" size={22} ls={0.06}>
        稍后提醒
      </Txt>
      {['5 分钟', '10 分钟', '15 分钟'].map((lab, i) => {
        const yy = y + 130 + i * 72;
        const chosen = i === 1 ? pick : 0;
        const s = 1 - 0.05 * (i === 1 ? tap : 0);
        return (
          <g key={lab} transform={`translate(${(SX + SR) / 2} ${n2(yy)}) scale(${n2(s)}) translate(${n2(-(SX + SR) / 2)} ${n2(-yy)})`}>
            <rect x={SX} y={n2(yy - 28)} width={SR - SX} height={56} rx={16} fill={chosen > 0.2 ? C.ink : 'none'} fillOpacity={chosen > 0.2 ? n2(chosen) : undefined} stroke={C.ink} strokeWidth={LINE.main} />
            <Txt x={(SX + SR) / 2} y={n2(yy + 6)} k="sc300" size={20} ls={0.08} c={chosen > 0.4 ? C.paperHi : C.ink} anchor="middle">
              {lab}
            </Txt>
          </g>
        );
      })}
    </g>
  );
};

export const dotApp = (f: number) => {
  const on = spr(f, TOG_AT, SNAP, 16);
  const k = knob(on);
  const press = {x: SX + 80, y: TOG.y};
  const sheetBtn = {x: (SX + SR) / 2, y: SCR.y + 420 + 202};
  if (f < 200) return {x: CENTER.x, y: CENTER.y, r: 16};
  const toList = tween(f, 200, 28, 0, 1, E.inOut);
  const toPress = tween(f, PRESS_AT - 10, 12, 0, 1, E.inOut);
  const toSheet = tween(f, SHEET_AT + 8, 16, 0, 1, E.inOut);
  const toTap = tween(f, SHEET_TAP - 8, 10, 0, 1, E.inOut);
  const back = tween(f, SHEET_OUT, 18, 0, 1, E.inOut);
  let x = lerp(CENTER.x, k.x, toList);
  let y = lerp(CENTER.y, k.y, toList);
  x = lerp(x, press.x, toPress * (1 - toSheet));
  y = lerp(y, press.y, toPress * (1 - toSheet));
  x = lerp(x, sheetBtn.x, toSheet * (1 - back));
  y = lerp(y, sheetBtn.y, toSheet * (1 - back));
  x = lerp(x, k.x, Math.max(back, tween(f, TOG_AT - 12, 14, 0, 1, E.inOut)));
  y = lerp(y, k.y, Math.max(back, tween(f, TOG_AT - 12, 14, 0, 1, E.inOut)));
  const r = lerp(16, 15, toList);
  return {x, y, r};
};

const Captions: React.FC<P> = ({f}) => (
  <g>
    <Txt x={120} y={172} k="sc300" size={40} ls={0.08} o={vis(f, 210, 250, 10, 8)}>
      一个屏幕，只做一件事。
    </Txt>
    <Txt x={120} y={172} k="sc300" size={40} ls={0.08} o={vis(f, 280, 360, 10, 8)}>
      按下去，再推一页。
    </Txt>
    <Txt x={120} y={172} k="sc300" size={40} ls={0.08} o={vis(f, 380, 500, 10, 8)}>
      从底下拉起一张纸。
    </Txt>
    <Txt x={120} y={172} k="sc300" size={40} ls={0.08} o={vis(f, 510, 590, 10, 8)}>
      颜色只给开着的那一处。
    </Txt>
    <Txt x={1800} y={150} k="mono" size={14} ls={0.16} c={C.greyDk} anchor="end" o={vis(f, 220, 590, 12, 10)}>
      APP UI · ALARM
    </Txt>
  </g>
);

export const App: React.FC<P> = ({f}) => {
  const grow = spr(f, HANDOFF, SMOOTH, 34);
  const leave = tween(f, WEB_GO - 18, 18, 0, 1, E.inOut);
  const body = mixBox(mixBox(LINE_BOX, PHONE, grow), WIN_BOX, leave);
  const inset = 14 * Math.min(1, body.w / PHONE.w + 0.15);
  const sw = Math.max(0, body.w - 2 * inset);
  const sh = Math.max(0, body.h - 2 * inset);
  const scr = tween(f, HANDOFF + 10, 18, 0, 1, E.out) * (1 - leave);
  const shOpen = sh * Math.max(scr, 0.001);
  const sy = body.y + inset + (sh - shOpen) / 2;
  const sr = Math.min(SCR.r ?? 0, sw / 2, shOpen / 2);
  const push = spr(f, PUSH_AT, SMOOTH, 28) * (1 - tween(f, SHEET_OUT + 4, 20, 0, 1, E.inOut));
  const d = dotApp(f);
  return (
    <g opacity={n2(1 - leave * 0.92)}>
      <World c={camApp(f)}>
        <PhoneChrome body={body} />
        {scr > 0.001 && shOpen > 1 && (
          <g>
            <defs>
              <clipPath id="app-scr">
                <rect x={n2(body.x + inset)} y={n2(sy)} width={n2(sw)} height={n2(shOpen)} rx={n2(sr)} />
              </clipPath>
            </defs>
            <rect x={n2(body.x + inset)} y={n2(sy)} width={n2(sw)} height={n2(shOpen)} rx={n2(sr)} fill={C.paperHi} />
            <g clipPath="url(#app-scr)">
              {f < SHEET_OUT + 24 && <List f={f} push={push} />}
              {f >= PUSH_AT && f < SHEET_OUT + 24 && <Ringing f={f} push={push} />}
              {f >= SHEET_AT - 2 && f < SHEET_OUT + 18 && <Sheet f={f} />}
              {f < WEB_GO && <Dot x={d.x} y={d.y} r={d.r} />}
            </g>
          </g>
        )}
      </World>
      <Captions f={f} />
    </g>
  );
};
