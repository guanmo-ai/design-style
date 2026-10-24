/**
 * 007 · Minimalism —— 13.2–15.4s
 *   同一原则进 Web：一栏标题 + 一个 CTA。
 */
import React from 'react';
import {E, SNAP, SMOOTH, spr, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {AT} from './timeline';
import {PHONE, WIN} from './app';
import {Box, Cam2, Txt, camTrack, mixBox, n2, P} from './ui';

export const WEB_CUTS = [828, 846, 864, 882];
export const WEB_KEEP = 900;
export const PAY_GO = AT.pay;

export const camWeb = (f: number): Cam2 =>
  camTrack(f, [
    [AT.web, {ox: 960, oy: 540, s: 1.02}],
    [WEB_CUTS[0], {ox: 960, oy: 500, s: 1.06}],
    [WEB_KEEP, {ox: 960, oy: 480, s: 1.1}],
    [PAY_GO - 4, {ox: 960, oy: 540, s: 1.02}],
  ]);

const PAGE: Box = {x: 248, y: 156, w: 1424, h: 760, r: 0};

export const Web: React.FC<P> = ({f}) => {
  if (f < AT.web - 4 || f >= AT.pay) return null;
  const enter = spr(f, AT.web, SMOOTH, 22);
  const leave = tween(f, AT.pay - 16, 16, 0, 1, E.inOut);
  const body = mixBox(PHONE, WIN, enter);
  const o = Math.min(1, enter + 0.15) * (1 - leave * 0.15);
  const nav = 1 - tween(f, WEB_CUTS[0], 12, 0, 1, E.in);
  const side = 1 - tween(f, WEB_CUTS[1], 12, 0, 1, E.in);
  const cards = 1 - tween(f, WEB_CUTS[2], 12, 0, 1, E.in);
  const extraCta = 1 - tween(f, WEB_CUTS[3], 12, 0, 1, E.in);
  const keep = spr(f, WEB_KEEP, SNAP, 18);
  const px = PAGE.x;
  const py = PAGE.y;
  return (
    <g opacity={n2(o)}>
      <rect x={n2(body.x)} y={n2(body.y)} width={n2(body.w)} height={n2(body.h)} rx={n2(body.r ?? 0)} fill={C.ink} />
      <rect x={n2(body.x + 10)} y={n2(body.y + 10)} width={n2(body.w - 20)} height={n2(body.h - 20)} rx={8} fill={C.paperHi} />
      <rect x={n2(body.x + 22)} y={n2(body.y + 22)} width={n2(body.w - 44)} height={28} rx={8} fill={C.shade} />
      <Txt x={body.x + 36} y={body.y + 42} k="mono" size={13} ls={0.08} c={C.greyDk}>
        docs.minimal
      </Txt>
      <g transform={`translate(${n2(px)} ${n2(py)})`}>
        <g opacity={n2(nav)}>
          <rect x={0} y={0} width={1424} height={56} fill="#C23B2E" />
          <Txt x={20} y={36} k="t500" size={16} c={C.paper}>
            SALE · 全站 50%
          </Txt>
          {['产品', '定价', '博客', '招聘', '登录', '更多'].map((lab, i) => (
            <Txt key={lab} x={420 + i * 140} y={36} k="sc300" size={16} c={C.paper}>
              {lab}
            </Txt>
          ))}
        </g>
        <g opacity={n2(side)} transform="translate(0 72)">
          {['指南', 'API', '案例', '更新', '社区'].map((lab, i) => (
            <g key={lab}>
              <rect x={0} y={i * 52} width={220} height={44} fill={C.shade} />
              <Txt x={16} y={i * 52 + 28} k="sc300" size={16} c={C.greyDk}>
                {lab}
              </Txt>
            </g>
          ))}
        </g>
        <g opacity={n2(cards)} transform="translate(248 80)">
          {['更快', '更智能', '更安全'].map((lab, i) => (
            <g key={lab} transform={`translate(${i * 360} 0)`}>
              <rect x={0} y={0} width={330} height={200} fill={C.shade} />
              <Txt x={20} y={50} k="sc500" size={24}>
                {lab}
              </Txt>
              <Txt x={20} y={86} k="sc300" size={15} c={C.grey}>
                三张卡片，三句空话。
              </Txt>
              <rect x={20} y={140} width={88} height={28} rx={4} fill={['#2A6B7C', '#3D5A99', '#C4A35A'][i]} />
            </g>
          ))}
        </g>
        <g transform={`translate(${n2(248 * (1 - keep))} ${n2(320 - keep * 80)})`}>
          <Txt x={0} y={0} k="d200" size={72} o={tween(f, AT.web + 8, 12)}>
            Less, but better.
          </Txt>
          <Txt x={0} y={56} k="sc300" size={24} c={C.greyDk} o={tween(f, AT.web + 14, 10)}>
            一栏标题。一件事。
          </Txt>
          <g opacity={n2(extraCta)}>
            <rect x={0} y={96} width={160} height={44} rx={4} fill={C.stone} />
            <Txt x={80} y={124} k="sc400" size={16} anchor="middle">
              了解更多
            </Txt>
          </g>
          <g opacity={n2(tween(f, WEB_KEEP - 4, 10))} transform={`translate(0 ${n2(extraCta > 0.2 ? 160 : 100)})`}>
            <rect x={0} y={0} width={200} height={52} rx={2} fill={C.ink} />
            <line x1={0} y1={52} x2={200} y2={52} stroke={C.accent} strokeWidth={3} />
            <Txt x={100} y={34} k="sc400" size={18} c={C.paper} anchor="middle">
              开始使用
            </Txt>
          </g>
        </g>
      </g>
    </g>
  );
};
