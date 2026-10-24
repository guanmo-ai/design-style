/**
 * 007 · 六改 12.2–14.2s —— 坏例炸开再吸回
 *   左边 12 片噪音炸开；右边一金额一按钮
 *   然后碎片真空吸进橙点
 */
import React from 'react';
import {E, POP, SNAP, spr, tween} from '../../../src/lib/anim';
import {C, DOT} from '../tokens';
import {AT} from './timeline';
import {Dot, Hair, Txt, lerp, n2, P} from './ui';

export const VS_SPLIT = AT.vs + 8;
export const VS_BOOM = AT.vs + 14;
export const VS_SUCK = AT.vs + 56;
export const VS_LABEL = AT.vs + 12;

const SHARD = [
  {x: 240, y: 220, w: 90, h: 36, c: '#1D4ED8', t: 'HOT'},
  {x: 380, y: 180, w: 70, h: 70, c: '#E11D48', t: '50'},
  {x: 200, y: 320, w: 120, h: 28, c: '#D4A017', t: 'VIP'},
  {x: 420, y: 300, w: 48, h: 48, c: C.ink, t: ''},
  {x: 160, y: 420, w: 160, h: 20, c: '#1D4ED8', t: ''},
  {x: 360, y: 440, w: 80, h: 80, c: '#E11D48', t: ''},
  {x: 220, y: 540, w: 100, h: 32, c: C.ink, t: '抢'},
  {x: 400, y: 560, w: 56, h: 18, c: '#D4A017', t: ''},
  {x: 180, y: 640, w: 140, h: 40, c: C.ink, t: 'NEW'},
  {x: 360, y: 680, w: 90, h: 24, c: '#1D4ED8', t: ''},
  {x: 260, y: 760, w: 70, h: 70, c: '#E11D48', t: ''},
  {x: 420, y: 800, w: 50, h: 16, c: '#D4A017', t: ''},
];

export const Versus: React.FC<P> = ({f}) => {
  if (f < AT.vs - 6 || f >= AT.bone) return null;
  const inn = spr(f, AT.vs, SNAP, 16);
  const boom = spr(f, VS_BOOM, POP, 18);
  const suck = spr(f, VS_SUCK, SNAP, 22);
  const leave = tween(f, AT.bone - 12, 12, 0, 1, E.in);
  const o = inn * (1 - leave);
  const mid = 960;
  return (
    <g opacity={n2(o)}>
      <Hair x1={mid} y1={120} x2={mid} y2={960} p={tween(f, VS_SPLIT, 10)} />
      <Txt x={200} y={120} k="sc400" size={18} c={C.grey} o={tween(f, VS_LABEL, 8)}>
        无焦点
      </Txt>
      <Txt x={1720} y={120} k="sc400" size={18} anchor="end" o={tween(f, VS_LABEL, 8)}>
        有焦点
      </Txt>
      {SHARD.map((s, i) => {
        const ang = (i / SHARD.length) * Math.PI * 2;
        const ox = Math.cos(ang) * 80 * boom;
        const oy = Math.sin(ang) * 60 * boom;
        const tx = lerp(s.x + ox, 1480, suck);
        const ty = lerp(s.y + oy, 540, suck);
        const sc = (1 + 0.25 * boom) * (1 - 0.92 * suck);
        return (
          <g key={i} transform={`translate(${n2(tx)} ${n2(ty)}) rotate(${n2((i * 17 - 30) * boom * (1 - suck))}) scale(${n2(sc)})`} opacity={n2(1 - 0.2 * suck)}>
            <rect x={-s.w / 2} y={-s.h / 2} width={s.w} height={s.h} fill={s.c} />
            {s.t ? (
              <text x={0} y={5} textAnchor="middle" fill="#fff" style={{fontFamily: "'Inter'", fontWeight: 700, fontSize: 14}}>
                {s.t}
              </text>
            ) : null}
          </g>
        );
      })}
      <rect x={1240} y={220} width={520} height={620} fill={C.paperHi} stroke={C.ink} strokeWidth={1} opacity={n2(tween(f, VS_SPLIT, 10))} />
      <Txt x={1500} y={360} k="d200" size={36} anchor="middle" o={tween(f, VS_SPLIT + 6, 8)}>
        Less, but better.
      </Txt>
      <Txt x={1500} y={480} k="d100" size={72} anchor="middle" o={tween(f, VS_SPLIT + 10, 8)}>
        ¥12
      </Txt>
      <rect x={1320} y={720} width={360} height={48} fill={C.ink} opacity={n2(tween(f, VS_SPLIT + 14, 8))} />
      <rect x={1320} y={766} width={360 * spr(f, VS_SUCK, SNAP, 14)} height={3} fill={C.accent} />
      <Txt x={1500} y={752} k="sc400" size={16} c={C.paper} anchor="middle" o={tween(f, VS_SPLIT + 16, 8)}>
        确认支付
      </Txt>
      <Dot x={1480} y={540} r={DOT.r * suck} />
    </g>
  );
};
