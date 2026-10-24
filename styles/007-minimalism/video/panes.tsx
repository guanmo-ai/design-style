/**
 * 007 · 六改 3.0–12.2s —— 五种落地并行，镜头交棒
 *   裂成 5 窗：App / Web / Pay / 数据 / 海报
 *   每种 ≤1.8s，信息密；章重叠 12 帧
 */
import React from 'react';
import {E, POP, SNAP, SMOOTH, spr, tween} from '../../../src/lib/anim';
import {C, LINE} from '../tokens';
import {AT} from './timeline';
import {Box, Txt, mixBox, n2, P, lerp} from './ui';

export const PANES: Box[] = [
  {x: 100, y: 90, w: 500, h: 720, r: 56},
  {x: 640, y: 90, w: 760, h: 340, r: 12},
  {x: 1440, y: 90, w: 380, h: 340, r: 8},
  {x: 640, y: 470, w: 760, h: 420, r: 12},
  {x: 1440, y: 470, w: 380, h: 420, r: 8},
];

export const FULL: Box[] = [
  {x: 700, y: 72, w: 520, h: 800, r: 64},
  {x: 200, y: 80, w: 1520, h: 820, r: 14},
  {x: 620, y: 160, w: 680, h: 640, r: 8},
  {x: 360, y: 140, w: 1200, h: 700, r: 12},
  {x: 560, y: 80, w: 800, h: 800, r: 8},
];

export const APP_CUTS = [312, 330, 348, 366, 384];
export const APP_KEEP = 396;
export const WEB_CUTS = [420, 438, 456, 474];
export const WEB_KEEP = 492;
export const PAY_CUTS = [528, 546, 564, 582];
export const PAY_KEEP = 600;
export const DATA_CUTS = [636, 654, 672];
export const DATA_KEEP = 690;

const POST_ZOOM = 696;
const STARTS = [AT.app, AT.web, AT.pay, AT.data, POST_ZOOM];

const focus = (f: number) => {
  if (f >= AT.vs - 8) return -1;
  if (f >= POST_ZOOM) return 4;
  if (f >= AT.data) return 3;
  if (f >= AT.pay) return 2;
  if (f >= AT.web) return 1;
  if (f >= AT.app) return 0;
  return -1;
};

const bodyOf = (f: number, i: number): Box => {
  const small = PANES[i];
  const big = FULL[i];
  const k = focus(f);
  if (k === i) {
    const inn = spr(f, STARTS[i], SMOOTH, 18);
    return mixBox(small, big, inn);
  }
  if (k >= 0 && k !== i) {
    const hide = tween(f, [AT.app, AT.web, AT.pay, AT.data][k], 10, 0, 1, E.in);
    return {...small, y: small.y + 20 * hide};
  }
  return small;
};

const Scale: React.FC<{s: number; cx: number; cy: number; children: React.ReactNode}> = ({s, cx, cy, children}) =>
  s <= 0.02 ? null : (
    <g transform={s >= 0.995 ? undefined : `translate(${n2(cx)} ${n2(cy)}) scale(${n2(s)}) translate(${n2(-cx)} ${n2(-cy)})`} opacity={s < 0.4 ? n2(s / 0.4) : undefined}>
      {children}
    </g>
  );

const AppIn: React.FC<{f: number; b: Box}> = ({f, b}) => {
  const sx = b.x + 36;
  const sr = b.x + b.w - 36;
  const extras = [
    {t: '06:30', sub: '智能推荐', cut: APP_CUTS[0]},
    {t: '07:30', sub: '周末', cut: APP_CUTS[1]},
    {t: '08:15', sub: '每日站会', cut: APP_CUTS[2]},
    {t: '22:00', sub: '白噪', cut: APP_CUTS[3]},
  ];
  const chrome = 1 - tween(f, APP_CUTS[4], 10, 0, 1, E.in);
  const keep = spr(f, APP_KEEP, SNAP, 16);
  const tog = tween(f, APP_KEEP, 8);
  const y0 = b.y + 200;
  return (
    <g>
      <Txt x={sx} y={b.y + 40} k="t500" size={14}>
        9:41
      </Txt>
      <Txt x={sx} y={b.y + 96} k="sc500" size={28} ls={0.04} o={tween(f, AT.split + 8, 8)}>
        闹钟
      </Txt>
      <Txt x={sx} y={y0} k="d200" size={44}>
        07:00
      </Txt>
      <Txt x={sx} y={y0 + 24} k="sc300" size={14} c={C.grey}>
        工作日 · 起床
      </Txt>
      <line x1={sx} y1={y0 + 40} x2={sr} y2={y0 + 40} stroke={C.hair} strokeWidth={1} />
      <rect x={sr - 68} y={y0 - 34} width={68} height={36} rx={18} fill={tog > 0.2 ? C.ink : 'none'} stroke={C.ink} strokeWidth={LINE.main} />
      {tog > 0.2 && <circle cx={sr - 19} cy={y0 - 16} r={12} fill={C.accent} />}
      {extras.map((row, i) => {
        const s = 1 - spr(f, row.cut, POP, 14);
        const y = y0 + 70 + i * 70;
        return (
          <Scale key={row.t} s={s} cx={(sx + sr) / 2} cy={y}>
            <Txt x={sx} y={y} k="d200" size={36} c={C.grey}>
              {row.t}
            </Txt>
            <Txt x={sx} y={y + 22} k="sc300" size={13} c={C.grey}>
              {row.sub}
            </Txt>
            <rect x={sr - 68} y={y - 30} width={68} height={32} rx={16} fill="none" stroke={C.stone} strokeWidth={1.5} />
            <line x1={sx} y1={y + 36} x2={sr} y2={y + 36} stroke={C.hair} strokeWidth={1} />
          </Scale>
        );
      })}
      <g opacity={n2(chrome)}>
        <rect x={sx} y={b.y + b.h - 130} width={72} height={28} rx={14} fill={C.accent} />
        <Txt x={sx + 36} y={b.y + b.h - 110} k="t500" size={12} c={C.paper} anchor="middle">
          NEW
        </Txt>
        <rect x={sx + 86} y={b.y + b.h - 130} width={88} height={28} rx={14} fill={C.ink} />
        <Txt x={b.x + 80} y={b.y + b.h - 56} k="sc300" size={13} c={C.grey}>
          闹钟 · 世界钟 · 秒表
        </Txt>
      </g>
      <circle cx={(b.x + b.w / 2)} cy={b.y + b.h - 70} r={18} fill="none" stroke={C.ink} strokeWidth={1.5} opacity={n2(keep)} />
      <HairPlus x={b.x + b.w / 2} y={b.y + b.h - 70} o={keep} />
    </g>
  );
};

const HairPlus: React.FC<{x: number; y: number; o: number}> = ({x, y, o}) =>
  o < 0.02 ? null : (
    <g opacity={n2(o)} stroke={C.ink} strokeWidth={1.5}>
      <line x1={x - 7} y1={y} x2={x + 7} y2={y} />
      <line x1={x} y1={y - 7} x2={x} y2={y + 7} />
    </g>
  );

const WebIn: React.FC<{f: number; b: Box}> = ({f, b}) => {
  const nav = 1 - tween(f, WEB_CUTS[0], 10, 0, 1, E.in);
  const side = 1 - tween(f, WEB_CUTS[1], 10, 0, 1, E.in);
  const cards = 1 - tween(f, WEB_CUTS[2], 10, 0, 1, E.in);
  const extra = 1 - tween(f, WEB_CUTS[3], 10, 0, 1, E.in);
  const keep = spr(f, WEB_KEEP, SNAP, 16);
  const px = b.x + 28;
  const py = b.y + 28;
  return (
    <g>
      <rect x={b.x + 16} y={b.y + 16} width={120} height={10} rx={5} fill={C.stone} />
      <g opacity={n2(nav)}>
        <rect x={b.x} y={b.y + 40} width={b.w} height={36} fill={ROSE} />
        <Txt x={b.x + 24} y={b.y + 64} k="t500" size={13} c={C.paper}>
          SALE · 全站 50%
        </Txt>
        <Txt x={b.x + 220} y={b.y + 64} k="sc300" size={13} c={C.paper}>
          产品 · 定价 · 博客 · 招聘 · 登录
        </Txt>
      </g>
      <g opacity={n2(side)}>
        {['指南', 'API', '案例', '社区'].map((t, i) => (
          <rect key={t} x={px} y={py + 70 + i * 36} width={88} height={24} fill={C.shade} />
        ))}
      </g>
      <g opacity={n2(cards)}>
        {['更快', '更智能', '更安全'].map((t, i) => (
          <g key={t}>
            <rect x={px + 120 + i * 200} y={py + 70} width={180} height={90} fill={C.shade} />
            <Txt x={px + 136 + i * 200} y={py + 110} k="sc400" size={18}>
              {t}
            </Txt>
          </g>
        ))}
      </g>
      <Txt x={px + 120 * side} y={py + 240} k="d200" size={48 * (0.7 + 0.3 * keep)}>
        Less, but better.
      </Txt>
      <Txt x={px + 120 * side} y={py + 280} k="sc300" size={18} o={0.7 + 0.3 * keep}>
        一栏标题。一件事。
      </Txt>
      <rect x={px + 120 * side} y={py + 300} width={140} height={36} fill={C.ink} />
      <rect x={px + 120 * side} y={py + 334} width={140 * keep} height={3} fill={C.accent} />
      <g opacity={n2(extra)}>
        <rect x={px + 280} y={py + 300} width={100} height={36} fill={C.stone} />
      </g>
    </g>
  );
};

const ROSE = '#E11D48';

const PayIn: React.FC<{f: number; b: Box}> = ({f, b}) => {
  const fee = 1 - tween(f, PAY_CUTS[0], 10, 0, 1, E.in);
  const code = 1 - tween(f, PAY_CUTS[1], 10, 0, 1, E.in);
  const legal = 1 - tween(f, PAY_CUTS[2], 10, 0, 1, E.in);
  const extra = 1 - tween(f, PAY_CUTS[3], 10, 0, 1, E.in);
  const keep = spr(f, PAY_KEEP, SNAP, 16);
  const cx = b.x + b.w / 2;
  return (
    <g>
      <Txt x={b.x + 24} y={b.y + 36} k="mono" size={12} ls={0.14} c={C.grey}>
        CONFIRM
      </Txt>
      <Txt x={cx} y={b.y + 200} k="d100" size={72} anchor="middle">
        ¥12
      </Txt>
      <Txt x={cx} y={b.y + 236} k="sc300" size={16} c={C.grey} anchor="middle" o={0.8}>
        设计手册 · 单次
      </Txt>
      <Scale s={fee} cx={cx} cy={b.y + 280}>
        <Txt x={cx} y={b.y + 280} k="sc300" size={15} c={C.grey} anchor="middle">
          手续费 ¥2 · 税费 ¥1
        </Txt>
      </Scale>
      <Scale s={code} cx={cx} cy={b.y + 320}>
        <rect x={cx - 90} y={b.y + 300} width={180} height={32} fill={C.shade} />
        <Txt x={cx} y={b.y + 322} k="t400" size={13} c={C.grey} anchor="middle">
          兑换码
        </Txt>
      </Scale>
      <Scale s={legal} cx={cx} cy={b.y + 380}>
        <Txt x={cx} y={b.y + 380} k="sc300" size={12} c={C.grey} anchor="middle">
          同意条款 · 订阅通讯 · 分享
        </Txt>
      </Scale>
      <rect x={b.x + 32} y={b.y + b.h - 72} width={b.w - 64} height={44} fill={C.ink} />
      <rect x={b.x + 32} y={b.y + b.h - 30} width={(b.w - 64) * keep} height={3} fill={C.accent} />
      <Txt x={cx} y={b.y + b.h - 42} k="sc400" size={16} c={C.paper} anchor="middle">
        确认支付
      </Txt>
      <g opacity={n2(extra)}>
        <rect x={b.x + 32} y={b.y + b.h - 124} width={(b.w - 64) / 2 - 8} height={36} fill={C.stone} />
      </g>
    </g>
  );
};

const DataIn: React.FC<{f: number; b: Box}> = ({f, b}) => {
  const fold = spr(f, DATA_CUTS[0], SNAP, 18);
  const mid = spr(f, DATA_CUTS[1], SNAP, 16);
  const spark = spr(f, DATA_CUTS[2], SNAP, 16);
  const keep = spr(f, DATA_KEEP, POP, 16);
  const cols = 4;
  const gap = 16;
  const cw = (b.w - 48 - gap * (cols - 1)) / cols;
  const ch = 110;
  return (
    <g>
      <Txt x={b.x + 24} y={b.y + 36} k="mono" size={12} ls={0.14} c={C.grey}>
        METRICS
      </Txt>
      {Array.from({length: 8}, (_, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const x = b.x + 24 + c * (cw + gap);
        const y = b.y + 64 + r * (ch + gap);
        const s = 1 - fold * (i === 0 ? 0 : 1);
        const dx = lerp(0, b.x + 24 - x, mid);
        const dy = lerp(0, b.y + 64 - y, mid);
        return (
          <Scale key={i} s={s} cx={x + cw / 2} cy={y + ch / 2}>
            <g transform={`translate(${n2(dx)} ${n2(dy)})`}>
              <rect x={x} y={y} width={cw} height={ch} fill={C.shade} />
              <rect x={x + 12} y={y + ch - 28} width={cw * (0.3 + (i % 5) * 0.12)} height={8} fill={i === 0 ? C.accent : C.grey} />
              <Txt x={x + 12} y={y + 36} k="d200" size={22}>
                {['47', '12', '3.1', '88', '5', '19', '2.0', '64'][i]}
              </Txt>
            </g>
          </Scale>
        );
      })}
      <g opacity={n2(keep)}>
        <Txt x={b.x + 48} y={b.y + 280} k="d100" size={96}>
          1
        </Txt>
        <Txt x={b.x + 48} y={b.y + 330} k="sc300" size={20}>
          有用的那一个数
        </Txt>
      </g>
      <g opacity={n2(spark)}>
        <polyline
          points={`${b.x + 280},${b.y + 300} ${b.x + 320},${b.y + 260} ${b.x + 360},${b.y + 280} ${b.x + 420},${b.y + 220} ${b.x + 480},${b.y + 240}`}
          fill="none"
          stroke={C.ink}
          strokeWidth={1.5}
        />
        <circle cx={b.x + 480} cy={b.y + 240} r={6} fill={C.accent} />
      </g>
    </g>
  );
};

const PostIn: React.FC<{f: number; b: Box}> = ({f, b}) => {
  const inn = tween(f, AT.split + 10, 14);
  const drop = spr(f, AT.split + 40, POP, 18);
  const pitch = Math.min(28, (b.w - 48) / 6);
  const x0 = b.x + b.w / 2 - 2.5 * pitch;
  const y0 = b.y + 80;
  return (
    <g opacity={n2(inn)}>
      <Txt x={b.x + 24} y={b.y + 48} k="d100" size={56}>
        少
      </Txt>
      {Array.from({length: 8}, (_, j) =>
        Array.from({length: 6}, (_, i) => {
          if (i === 4 && j === 6) return null;
          return <circle key={`${i}-${j}`} cx={x0 + i * pitch} cy={y0 + j * pitch} r={7} fill="none" stroke="rgba(28,27,25,0.28)" strokeWidth={1} strokeDasharray="2 3" />;
        }),
      )}
      <circle cx={x0 + 4 * pitch} cy={lerp(y0 + 6 * pitch, b.y + b.h - 36, drop)} r={7} fill={C.accent} />
    </g>
  );
};

const LABEL = ['APP', 'WEB', 'PAY', 'DATA', 'POST'];

export const Panes: React.FC<P> = ({f}) => {
  if (f < AT.split - 10 || f >= AT.vs) return null;
  const crack = spr(f, AT.split, SNAP, 20);
  const k = focus(f);
  return (
    <g>
      {PANES.map((p, i) => {
        const body = bodyOf(f, i);
        const enter = crack;
        const dim = k >= 0 && k !== i ? 0.18 + 0.1 * (1 - tween(f, AT.app, 8)) : 1;
        const leave = tween(f, AT.vs - 14, 14, 0, 1, E.in);
        if (enter * (1 - leave) < 0.02) return null;
        const ox = lerp(960 - p.w / 2, body.x, enter);
        const oy = lerp(540 - p.h / 2, body.y, enter);
        const box = {x: ox, y: oy, w: body.w, h: body.h, r: body.r};
        const crackRot = (i - 2) * 6 * (1 - enter);
        return (
          <g key={i} opacity={n2(enter * dim * (1 - leave))} transform={crackRot ? `rotate(${n2(crackRot)} 960 540)` : undefined}>
            <rect x={n2(box.x)} y={n2(box.y)} width={n2(box.w)} height={n2(box.h)} rx={n2(box.r ?? 0)} fill={C.ink} />
            <rect x={n2(box.x + 10)} y={n2(box.y + 10)} width={n2(box.w - 20)} height={n2(box.h - 20)} rx={n2((box.r ?? 0) - 8)} fill={C.paperHi} />
            <Txt x={box.x + 24} y={box.y + 22} k="mono" size={11} ls={0.16} c={C.grey} o={k === i ? 0.35 : 0.7}>
              {LABEL[i]}
            </Txt>
            <clipPath id={`p${i}`}>
              <rect x={n2(box.x + 10)} y={n2(box.y + 10)} width={n2(box.w - 20)} height={n2(box.h - 20)} rx={n2((box.r ?? 0) - 8)} />
            </clipPath>
            <g clipPath={`url(#p${i})`}>
              {i === 0 && <AppIn f={f} b={{...box, x: box.x + 10, y: box.y + 10, w: box.w - 20, h: box.h - 20}} />}
              {i === 1 && <WebIn f={f} b={{...box, x: box.x + 10, y: box.y + 10, w: box.w - 20, h: box.h - 20}} />}
              {i === 2 && <PayIn f={f} b={{...box, x: box.x + 10, y: box.y + 10, w: box.w - 20, h: box.h - 20}} />}
              {i === 3 && <DataIn f={f} b={{...box, x: box.x + 10, y: box.y + 10, w: box.w - 20, h: box.h - 20}} />}
              {i === 4 && <PostIn f={f} b={{...box, x: box.x + 10, y: box.y + 10, w: box.w - 20, h: box.h - 20}} />}
            </g>
          </g>
        );
      })}
    </g>
  );
};
