/** 010 · Paper Cut —— 五条规则 · 常见坑 · 片尾 @guanmo_ai */
import React from 'react';
import {E, spr, tween} from '../../../src/lib/anim';
import {C, HILLS} from '../tokens';
import {AT, PIT_AT, RULE_AT} from './timeline';
import {World, WorldMode, n1} from './layers';
import {Txt} from './ui';

const RULES: {en: string; zh: string; tip: string}[] = [
  {en: '01  ONE COLOR', zh: '一层一色', tip: '一张纸只涂一种颜色，深浅靠叠层，不靠渐变'},
  {en: '02  SHADOW = DEPTH', zh: '阴影即深度', tip: '层与层之间那道软影，才是“纸”而不是贴纸'},
  {en: '03  SILHOUETTE', zh: '剪影不描细节', tip: '形状是剪出来的。内部细节用挖洞或再叠一层'},
  {en: '04  FAR SLOW / NEAR FAST', zh: '远慢近快', tip: '层移的量不同，深度自己会长出来——这就是故事'},
  {en: '05  FAMILY + SUN', zh: '限色家族，一点红日', tip: '三到六阶同类色，只留一个暖色当强调'},
];

const PITS: {wrong: string; right: string; mode: WorldMode}[] = [
  {wrong: '没阴影 = 贴纸', right: '加上层间阴影', mode: 'flat'},
  {wrong: '同速平移 = 没有层', right: '远慢近快', mode: 'lock'},
  {wrong: '一层上画渐变 = 印刷', right: '一层一色', mode: 'grade'},
];

const Card: React.FC<{f: number; t0: number; i: number}> = ({f, t0, i}) => {
  const k = spr(f, t0, {damping: 11, mass: 0.65, stiffness: 180});
  if (k <= 0.001) return null;
  const r = RULES[i];
  const x = 72 + (i % 5) * 368;
  return (
    <g opacity={k} transform={`translate(${n1(x)} ${n1(868 + (1 - k) * 28)})`} filter="url(#shMid)">
      <rect width={348} height={148} rx={16} fill={C.paper} />
      <rect width={348} height={8} rx={4} fill={HILLS[Math.min(i, 5)]} />
      <Txt x={20} y={48} size={12} font="mono" c={C.sun} ls={1.2}>
        {r.en}
      </Txt>
      <Txt x={20} y={88} size={28} font="cn" w={900} c={C.ink}>
        {r.zh}
      </Txt>
    </g>
  );
};

export const Rules: React.FC<{f: number}> = ({f}) => {
  let idx = 0;
  RULE_AT.forEach((t, i) => {
    if (f >= t) idx = i;
  });
  const r = RULES[idx];
  const k = spr(f, RULE_AT[idx], {damping: 12, mass: 0.7, stiffness: 160});
  return (
    <g>
      <World f={f} />
      <rect x={72} y={88} width={720} height={168} rx={20} fill={C.paper} opacity={k} filter="url(#shNear)" />
      <g opacity={k}>
        <Txt x={96} y={140} size={14} font="mono" c={C.sun} ls={1.6}>
          {r.en}
        </Txt>
        <Txt x={96} y={198} size={48} font="cn" w={900} c={C.ink}>
          {r.zh}
        </Txt>
        <Txt x={96} y={236} size={18} font="cn" w={500} c={C.grey}>
          {r.tip}
        </Txt>
      </g>
      {RULES.map((_, i) => (
        <Card key={i} f={f} t0={RULE_AT[i]} i={i} />
      ))}
    </g>
  );
};

export const Pits: React.FC<{f: number}> = ({f}) => {
  let idx = 0;
  PIT_AT.forEach((t, i) => {
    if (f >= t) idx = i;
  });
  const pit = PITS[idx];
  const t0 = PIT_AT[idx];
  const wrong = f < t0 + 22;
  const flip = spr(f, t0 + 22, {damping: 12, mass: 0.7, stiffness: 180});
  return (
    <g>
      <World f={f} mode={wrong ? pit.mode : 'full'} />
      <rect x={72} y={88} width={560} height={150} rx={20} fill={C.paper} filter="url(#shNear)" />
      <Txt x={96} y={136} size={14} font="mono" c={C.sun} ls={1.6}>
        {wrong ? 'PITFALL' : 'FIX'}
      </Txt>
      <Txt x={96} y={198} size={36} font="cn" w={900} c={C.ink}>
        {wrong ? pit.wrong : pit.right}
      </Txt>
      <g opacity={flip}>
        <rect x={1488} y={96} width={360} height={64} rx={14} fill={C.sun} />
        <Txt x={1668} y={138} size={24} font="cn" w={700} c={C.paper} anchor="middle">
          改对了
        </Txt>
      </g>
    </g>
  );
};

export const End: React.FC<{f: number}> = ({f}) => {
  const k = spr(f, AT.end + 8, {damping: 12, mass: 0.7, stiffness: 160});
  const handle = spr(f, AT.end + 48, {damping: 14, mass: 0.8, stiffness: 140});
  const pulse = 1 + 0.04 * Math.sin((f - AT.end) * 0.18);
  return (
    <g>
      <World f={f} />
      <g opacity={k} transform={`scale(${pulse.toFixed(4)})`} style={{transformOrigin: '960px 420px'}}>
        <Txt x={960} y={400} size={64} font="cn" w={900} c={C.paper} anchor="middle">
          层移即故事
        </Txt>
        <Txt x={960} y={458} size={20} font="display" w={500} c={C.paper} anchor="middle" ls={3} o={0.75}>
          LAYER MOTION IS THE STORY
        </Txt>
      </g>
      <g opacity={handle} transform={`translate(0 ${n1((1 - handle) * 18)})`}>
        <rect x={760} y={880} width={400} height={72} rx={18} fill={C.paper} filter="url(#shNear)" />
        <Txt x={960} y={926} size={26} font="display" w={600} c={C.ink} anchor="middle" ls={1.2}>
          @guanmo_ai
        </Txt>
      </g>
    </g>
  );
};

export const GrainNote: React.FC = () => null;
