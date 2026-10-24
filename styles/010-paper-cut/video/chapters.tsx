/** 010 · 几何层叠 · 立体纸板 · 单色剪影 · 水彩毛边 · 字体剪纸 */
import React from 'react';
import {E, spr, tween} from '../../../src/lib/anim';
import {C, HILLS} from '../tokens';
import {AT} from './timeline';
import {W, World, n1, peelAt, phoneCam} from './layers';
import {EditorChrome, NoteCard, Phone, PhoneStatus, Tag, Txt} from './ui';

const peelLabel = (i: number): [string, string] => {
  if (i <= 1) return ['FAR', '远'];
  if (i <= 3) return ['MID', '中'];
  return ['NEAR', '近'];
};

export const Geo: React.FC<{f: number}> = ({f}) => {
  const card = spr(f, AT.geo + 28, {damping: 13, mass: 0.75, stiffness: 160}) * (1 - tween(f, AT.dio - 22, 18, 0, 1, E.in));
  const line = tween(f, AT.geo + 48, 20, 0, 1, E.out);
  return (
    <g>
      <World f={f} born={AT.geo - 6} />
      <NoteCard x={72} y={96} w={540} h={248} k={card} />
      {card > 0.05 && (
        <g opacity={card} transform={`translate(${72 + (1 - card) * 16} 96)`}>
          <Txt x={44} y={78} size={15} font="mono" c={C.grey} ls={2.2}>
            02  ·  COLOR BLOCKS
          </Txt>
          <Txt x={44} y={132} size={40} font="display" w={700} c={C.ink} ls={2.4}>
            STRATA
          </Txt>
          <Txt x={44} y={186} size={32} font="cn" w={700} c={C.navy}>
            几何色块层叠
          </Txt>
          <rect x={44} y={206} width={160 * line} height={2} fill={C.sun} />
          <Txt x={44} y={232} size={13} font="display" w={500} c={C.grey} ls={1.2}>
            far slow  ·  near fast
          </Txt>
        </g>
      )}
      <Tag f={f} t0={AT.geo + 10} x={72} y={1004} en="02  STRATA" zh="一层一色，远慢近快" dark />
    </g>
  );
};

export const Dio: React.FC<{f: number}> = ({f}) => {
  let active = 0;
  for (let i = 0; i < 6; i++) if (peelAt(f, i) > 0.35) active = i;
  return (
    <g>
      <rect width={W} height={H} fill={C.cream} />
      <EditorChrome f={f} active={active} />
      <g clipPath="url(#artboard)">
        <World f={f} mode="dio" born={AT.geo - 6} />
      </g>
      {Array.from({length: 6}, (_, i) => {
        const p = peelAt(f, i);
        if (p < 0.12) return null;
        const [en, zh] = peelLabel(i);
        const x = 160 + (i % 3) * 280;
        const y = 220 + Math.floor(i / 3) * 70;
        return (
          <g key={i} opacity={p}>
            <rect x={x} y={y} width={132} height={36} rx={8} fill={C.paper} />
            <rect x={x} y={y} width={8} height={36} rx={4} fill={HILLS[i]} />
            <Txt x={x + 18} y={y + 24} size={16} font="mono" c={C.ink}>
              {`L${6 - i}  ${en}  ${zh}`}
            </Txt>
          </g>
        );
      })}
      <Tag f={f} t0={AT.dio + 8} x={96} y={1004} en="03  DIORAMA" zh="立体纸板：侧光一转，影子就长" />
    </g>
  );
};

export const Sil: React.FC<{f: number}> = ({f}) => {
  const cut = spr(f, AT.sil, {damping: 12, mass: 0.7, stiffness: 150});
  const gap = spr(f, AT.sil + 48, {damping: 14, mass: 0.8, stiffness: 140}) * (1 - spr(f, AT.sil + 96, {damping: 11, mass: 0.65, stiffness: 190}));
  const g = 36 * gap;
  const bladeY = tween(f, AT.sil - 8, 18, -40, 1120, E.in);
  return (
    <g>
      <rect width={W} height={H} fill={C.cream} />
      <g clipPath="url(#silLeft)">
        <g transform={`translate(${n1(-g)} 0)`}>
          <World f={f} mode="monoInk" born={AT.geo - 6} />
        </g>
      </g>
      <g clipPath="url(#silRight)">
        <g transform={`translate(${n1(g)} 0)`}>
          <World f={f} mode="monoPaper" born={AT.geo - 6} />
        </g>
      </g>
      <rect x={n1(956 - g / 2)} y={0} width={n1(8 + g)} height={H} fill={C.folk} opacity={0.85 * cut} />
      <rect x={950} y={n1(bladeY)} width={20} height={80} rx={4} fill={C.paper} opacity={tween(f, AT.sil - 10, 16, 1, 0, E.in)} />
      <Tag f={f} t0={AT.sil + 8} x={72} y={96} en="04  SILHOUETTE" zh="单色剪影：一刀切成正负形" />
      <defs>
        <clipPath id="silLeft">
          <rect x={0} y={0} width={n1(960 - g / 2)} height={H} />
        </clipPath>
        <clipPath id="silRight">
          <rect x={n1(960 + g / 2)} y={0} width={n1(960 - g / 2)} height={H} />
        </clipPath>
      </defs>
    </g>
  );
};

export const Torn: React.FC<{f: number}> = ({f}) => {
  const k = spr(f, AT.torn - 4, {damping: 14, mass: 0.8, stiffness: 140});
  const temp = spr(f, AT.torn + 16, {damping: 11, mass: 0.6, stiffness: 180});
  const card = spr(f, AT.torn + 88, {damping: 12, mass: 0.7, stiffness: 160});
  return (
    <g>
      <rect width={W} height={H} fill="#1A1410" />
      <ellipse cx={320} cy={200} rx={280} ry={160} fill="#C9A28A" opacity={0.28} />
      <ellipse cx={1600} cy={860} rx={340} ry={180} fill="#8FA98C" opacity={0.22} />
      <Phone f={f} />
      <g clipPath="url(#phoneScreen)">
        <World f={f} cam={phoneCam(f)} born={AT.geo - 6} />
        <rect x={706} y={448} width={508} height={540} fill="url(#phoneScrim)" />
      </g>
      <PhoneStatus k={k} />
      <g opacity={k}>
        <Txt x={760} y={530} size={18} font="cn" w={500} c={C.paper} o={0.75}>
          今日天气
        </Txt>
        <g opacity={temp} transform={`translate(0 ${n1((1 - temp) * 20)})`}>
          <Txt x={760} y={628} size={84} font="display" w={600} c={C.paper}>
            18°
          </Txt>
          <Txt x={760} y={672} size={20} font="cn" w={500} c={C.paper} o={0.8}>
            晴  ·  同一座山，换一种纸
          </Txt>
        </g>
      </g>
      {card > 0.01 && (
        <g opacity={card} transform={`translate(${n1((1 - card) * 24)} 0)`}>
          <rect x={164} y={780} width={420} height={148} rx={22} fill="#F0E2D2" filter="url(#shNear)" />
          <Txt x={192} y={836} size={14} font="mono" c={C.sun} ls={1.4}>
            DECKLE EDGE
          </Txt>
          <Txt x={192} y={882} size={28} font="cn" w={700} c={C.ink}>
            毛边是撕出来的
          </Txt>
          <rect x={1336} y={780} width={420} height={148} rx={22} fill="#F0E2D2" filter="url(#shNear)" />
          <Txt x={1364} y={836} size={14} font="mono" c={C.sun} ls={1.4}>
            APP HERO
          </Txt>
          <Txt x={1364} y={882} size={28} font="cn" w={700} c={C.ink}>
            头图仍然是层叠
          </Txt>
        </g>
      )}
      <Tag f={f} t0={AT.torn + 6} x={96} y={80} en="05  TORN WASH" zh="水彩纸毛边：撕开，才见到产品" dark />
    </g>
  );
};

export const Type: React.FC<{f: number}> = ({f}) => {
  const word = spr(f, AT.type + 28, {damping: 10, mass: 0.6, stiffness: 170});
  const cut = spr(f, AT.type + 36, {damping: 11, mass: 0.55, stiffness: 190});
  const zi = spr(f, AT.type + 86, {damping: 12, mass: 0.7, stiffness: 160});
  const sub = spr(f, AT.type + 118, {damping: 14, mass: 0.8, stiffness: 140});
  return (
    <g>
      <rect width={W} height={H} fill={C.paper} />
      <World f={f} born={AT.geo - 6} dim={0.15} />
      <rect width={W} height={H} fill={C.paper} opacity={0.88} />
      <g opacity={cut} clipPath="url(#cutPAPER)" filter="url(#shNear)">
        <World f={f} born={AT.geo - 6} />
      </g>
      {word > 0.01 && (
        <text
          x={960}
          y={540}
          fontFamily="Jost"
          fontSize={200}
          fontWeight={800}
          fill="none"
          stroke={C.ink}
          strokeWidth={3 * (1 - cut)}
          textAnchor="middle"
          letterSpacing={10}
          opacity={word * (1 - cut * 0.85)}
        >
          PAPER
        </text>
      )}
      {zi > 0.01 && (
        <g opacity={zi} transform={`translate(0 ${n1((1 - zi) * 40)})`} filter="url(#shMid)">
          <rect x={820} y={620} width={280} height={200} rx={16} fill={C.folk} />
          <Txt x={960} y={760} size={120} font="cn" w={900} c={C.paper} anchor="middle">
            剪
          </Txt>
        </g>
      )}
      {sub > 0.01 && (
        <Txt x={960} y={880} size={28} font="cn" w={500} c={C.ink} anchor="middle" o={sub}>
          字不是写上去的，是从纸上剪下来的
        </Txt>
      )}
      <Tag f={f} t0={AT.type + 8} x={72} y={96} en="06  TYPE CUT" zh="字体剪纸：把字从纸堆里剪穿" />
      <defs>
        <clipPath id="cutPAPER">
          <text x={960} y={540} fontFamily="Jost" fontSize={200} fontWeight={800} textAnchor="middle" letterSpacing={10}>
            PAPER
          </text>
        </clipPath>
      </defs>
    </g>
  );
};
