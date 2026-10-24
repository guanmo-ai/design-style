/**
 * 007 · Minimalism —— 05 今天 10.0–12.0s（f600–720）
 *   10.0–10.5s  中间那个盒子立起来、长圆角，变成一部手机；屏幕亮起，一个闹钟界面
 *   10.5s       那个点跳进开关里：开关打开（全片唯一的“点击”）
 *   11.0–11.4s  一个十六分音符删一样：状态栏、标题、另外两个闹钟、加号——只剩 07:00 和那个开关
 *   11.4–12.0s  剩下的居中；左边：一个屏幕，只做一件事
 */
import React from 'react';
import {E, SMOOTH, SNAP, spr, tween} from '../../../src/lib/anim';
import {C, LINE} from '../tokens';
import {CAM_PHONE0, keepDot, keepFront, PHONE_AT} from './judd';
import {Box, camTrack, Dot, Letters, lerp, mixBox, n2, P, tw, Txt, vis, World} from './ui';

export const PHONE: Box = {x: 1060, y: 120, w: 400, h: 820, r: 64};
const SCR: Box = {x: PHONE.x + 12, y: PHONE.y + 12, w: PHONE.w - 24, h: PHONE.h - 24, r: 52};
export const TAP_AT = 630;
export const CUT05 = [660, 667.5, 675, 682.5];
const CENTER_AT = 684;
export const RECAP_AT = 704;

const SX = SCR.x + 30; // 屏幕里的左边距
const SR = SCR.x + SCR.w - 30;
const TIME = {size: 96, y: 420};
const TOG = {w: 64, h: 36, y: 386};
const togX = () => SR - TOG.w;
/** 开关圆点：关在左，开在右 */
export const knob = (on: number) => ({x: togX() + 18 + (TOG.w - 36) * on, y: TOG.y, r: 14});
const tapOn = (f: number) => spr(f, TAP_AT, SNAP, 14);
/** 删完以后，剩下的这一行往下挪到屏幕正中 */
const rowDY = (f: number) => tween(f, CENTER_AT, 22, 0, 150, E.inOut);

const del = (f: number, at: number) => 1 - tween(f, at, 6, 0, 1, E.in);
const Scale: React.FC<{s: number; cx: number; cy: number; children: React.ReactNode}> = ({s, cx, cy, children}) =>
  s <= 0.005 ? null : s >= 0.999 ? <>{children}</> : <g transform={`translate(${n2(cx)} ${n2(cy)}) scale(${n2(s * 1000) / 1000}) translate(${n2(-cx)} ${n2(-cy)})`} opacity={s < 0.5 ? n2(s / 0.5) : undefined}>{children}</g>;

const Toggle: React.FC<{y: number; on: number; grey?: boolean}> = ({y, on, grey}) => {
  const x = togX();
  const fillOn = on > 0.001;
  return (
    <g>
      <rect x={x} y={y - TOG.h / 2} width={TOG.w} height={TOG.h} rx={TOG.h / 2} fill={fillOn ? C.ink : 'none'} fillOpacity={fillOn ? n2(on) : undefined} stroke={grey ? C.stone : C.ink} strokeWidth={LINE.main} />
      {grey && <circle cx={x + 18} cy={y} r={14} fill={C.paperHi} stroke={C.stone} strokeWidth={LINE.main} />}
    </g>
  );
};

/** 手机本身（回顾里会把它缩小成一个小图标，所以单独导出） */
export const Phone: React.FC<{f: number; dot?: boolean; id?: string}> = ({f, dot = true, id = 'scr05'}) => {
  const m = spr(f, PHONE_AT, SMOOTH, 30);
  const k = keepFront();
  const body = mixBox({...k, r: 0}, PHONE, m);
  // 屏幕跟着机身走（内缩 12），从中线往上下打开，始终不透明：墨色机身里亮起一块纸白，不经过灰
  const scr = tween(f, PHONE_AT + 8, 18, 0, 1, E.out);
  const inset = 12 * Math.min(1, body.w / PHONE.w + 0.2);
  const sw = Math.max(0, body.w - 2 * inset);
  const shFull = Math.max(0, body.h - 2 * inset);
  const sh = shFull * scr;
  const sy = body.y + inset + (shFull - sh) / 2;
  const sr = Math.min(SCR.r ?? 0, sw / 2, sh / 2);
  const ui = (at: number) => tween(f, at, 12, 0, 1, E.out);
  const dy = rowDY(f);
  const on = tapOn(f);
  const row = (y: number, t: string, sub: string, at: number, cut: number) => {
    const s = del(f, cut) * ui(at);
    return (
      <Scale s={s} cx={(SX + SR) / 2} cy={y - 20}>
        <Txt x={SX - 2} y={y} k="d200" size={60} c={C.grey}>
          {t}
        </Txt>
        <Txt x={SX} y={y + 32} k="sc300" size={18} ls={0.08} c={C.grey}>
          {sub}
        </Txt>
        <Toggle y={y - 22} on={0} grey />
        <line x1={SX} y1={y + 62} x2={SR} y2={y + 62} stroke={C.hair} strokeWidth={1} />
      </Scale>
    );
  };
  return (
    <g>
      <rect x={n2(body.x)} y={n2(body.y)} width={n2(body.w)} height={n2(body.h)} rx={n2(body.r ?? 0)} fill={C.ink} />
      {scr > 0.001 && sh > 0.5 && (
        <g>
          <defs>
            <clipPath id={id}>
              <rect x={n2(body.x + inset)} y={n2(sy)} width={n2(sw)} height={n2(sh)} rx={n2(sr)} />
            </clipPath>
          </defs>
          <rect x={n2(body.x + inset)} y={n2(sy)} width={n2(sw)} height={n2(sh)} rx={n2(sr)} fill={C.paperHi} />
          <g clipPath={scr < 1 || m < 0.999 ? `url(#${id})` : undefined}>
          {/* 状态栏 + 标题 */}
          <Scale s={del(f, CUT05[0]) * ui(620)} cx={(SX + SR) / 2} cy={190}>
            <Txt x={SX} y={176} k="t500" size={16}>
              9:41
            </Txt>
            <rect x={SR - 26} y={164} width={24} height={12} rx={3} fill="none" stroke={C.ink} strokeWidth={1.2} />
            <rect x={SR - 24} y={166} width={16} height={8} rx={1.5} fill={C.ink} />
            <rect x={SR - 1} y={168} width={2} height={4} fill={C.ink} />
            <Txt x={SX} y={262} k="sc500" size={36} ls={0.04}>
              闹钟
            </Txt>
            <line x1={SX} y1={300} x2={SR} y2={300} stroke={C.hair} strokeWidth={1} />
          </Scale>
          {/* 第一行：07:00 和开关（开关的圆点就是那个点） */}
          <g transform={dy ? `translate(0 ${n2(dy)})` : undefined} opacity={n2(ui(624))}>
            <Letters text="07:00" x={SX - 4} y={TIME.y} k="d100" size={TIME.size} fx={(i) => ({o: tween(f, 624 + i * 1.5, 12), dy: (1 - tween(f, 624 + i * 1.5, 14, 0, 1, E.out)) * 18})} />
            <Txt x={SX} y={TIME.y + 36} k="sc300" size={20} ls={0.1} c={C.greyDk} o={ui(630)}>
              工作日 · 起床
            </Txt>
            <Toggle y={TOG.y} on={on} />
            {!dot && <circle cx={knob(1).x} cy={TOG.y} r={14} fill={C.paperHi} />}
            <line x1={SX} y1={490} x2={SR} y2={490} stroke={C.hair} strokeWidth={1} opacity={n2(del(f, CUT05[1]))} />
          </g>
          {row(580, '07:30', '周末', 628, CUT05[1])}
          {row(730, '08:00', '每天', 632, CUT05[2])}
          <Scale s={del(f, CUT05[3]) * ui(636)} cx={(SX + SR) / 2} cy={870}>
            <circle cx={(SX + SR) / 2} cy={870} r={28} fill="none" stroke={C.ink} strokeWidth={LINE.main} />
            <path d={`M${(SX + SR) / 2 - 10} 870H${(SX + SR) / 2 + 10}M${(SX + SR) / 2} 860V880`} stroke={C.ink} strokeWidth={LINE.main} />
          </Scale>
          </g>
        </g>
      )}
    </g>
  );
};

/** 那个点：从盒子跳进开关，跟着开关滑过去 */
export const dotToday = (f: number) => {
  const a = keepDot();
  const off = knob(0);
  const onP = knob(1);
  const t = tween(f, PHONE_AT + 6, 18, 0, 1, E.inOut);
  const x0 = lerp(a.x, off.x, t);
  const y0 = lerp(a.y, off.y, t) - Math.sin(Math.PI * t) * 110;
  const on = tapOn(f);
  return {x: lerp(x0, onP.x, on), y: y0 + rowDY(f), r: lerp(11, 14, t)};
};

const cam05 = (f: number) => {
  const phone = {ox: PHONE.x + PHONE.w / 2, oy: PHONE.y + PHONE.h / 2, s: 1.14};
  const c = camTrack(f, [
    [PHONE_AT, CAM_PHONE0],
    [PHONE_AT + 28, phone],
    [RECAP_AT, {ox: 960, oy: 540, s: 1}],
  ]);
  const d = 3.2 * (1 - tween(f, RECAP_AT - 18, 18, 0, 1, E.inOut));
  return {ox: c.ox + Math.sin(f * 0.04) * d, oy: c.oy + Math.cos(f * 0.029) * d * 0.6, s: c.s};
};

const Captions: React.FC<P> = ({f}) => {
  const s = (at: number) => vis(f, at, RECAP_AT - 8, 12, 8);
  const fx = (at: number) => (i: number) => {
    const p = tween(f, at + i * 2, 14, 0, 1, E.out);
    const q = tween(f, RECAP_AT - 4, 8, 0, 1, E.in);
    return {o: p * (1 - q), dy: (1 - p) * 20};
  };
  return (
    <g>
      <Letters text="一个屏幕，" x={118} y={470} k="sc300" size={64} ls={0.1} fx={fx(640)} />
      <Letters text="只做一件事。" x={118} y={562} k="sc300" size={64} ls={0.1} fx={fx(652)} />
      <Txt x={120} y={630} k="t300" size={28} ls={0.01} c={C.greyDk} o={s(664)}>
        One screen, one job.
      </Txt>
      <Txt x={120} y={690} k="mono" size={14} ls={0.18} c={C.greyDk} o={s(670)}>
        {'FLAT UI · 2013 — TODAY'}
      </Txt>
      {/* 一根细线把这句话连到那个开关上 */}
      {(() => {
        const p = tween(f, 694, 12, 0, 1, E.out) * (1 - tween(f, RECAP_AT - 4, 6, 0, 1, E.in));
        if (p <= 0.001) return null;
        const y = knob(1).y + rowDY(f);
        const x0 = 120 + tw('只做一件事。', 'sc300', 64, 0.1) + 40;
        const x1 = PHONE.x - 28;
        return <line x1={n2(x0)} y1={n2(y)} x2={n2(lerp(x0, x1, p))} y2={n2(y)} stroke={C.ink} strokeWidth={LINE.note} strokeDasharray="2 6" />;
      })()}
    </g>
  );
};

export const Today: React.FC<P> = ({f}) => {
  const d = dotToday(f);
  return (
    <g>
      <World c={cam05(f)}>
        <Phone f={f} />
        {f < RECAP_AT && <Dot x={d.x} y={d.y} r={d.r} />}
      </World>
      <Captions f={f} />
    </g>
  );
};
