/** 010 · 几何层叠 · 立体纸板 · 单色剪影 · 水彩毛边 · 字体剪纸 */
import React from 'react';
import {E, spr, tween} from '../../../src/lib/anim';
import {C, HILLS} from '../tokens';
import {AT} from './timeline';
import {H, W, World, n1, peelAt, phoneCam} from './layers';
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

const deckleLeft = (f: number, w: number) => {
  const wob = Math.sin(f * 0.038);
  let d = `M0 0 H${n1(w + wob * 14)}`;
  for (let i = 0; i <= 22; i++) {
    const y = (H / 22) * i;
    const jag = 26 * Math.sin(i * 1.65 + f * 0.028) + 16 * Math.sin(i * 0.62 + 1.1);
    d += ` L${n1(w - 28 + jag + wob * 8)} ${n1(y)}`;
  }
  return `${d} L0 ${H} Z`;
};

const deckleRight = (f: number, inset: number) => {
  const wob = Math.sin(f * 0.034 + 1.2);
  let d = `M${W} 0 H${n1(W - inset + wob * 10)}`;
  for (let i = 0; i <= 18; i++) {
    const y = (H / 18) * i;
    const jag = 22 * Math.sin(i * 1.4 + f * 0.03) + 14 * Math.sin(i * 0.55);
    d += ` L${n1(W - inset + 18 + jag + wob * 7)} ${n1(y)}`;
  }
  return `${d} L${W} ${H} Z`;
};

export const Torn: React.FC<{f: number}> = ({f}) => {
  const k = spr(f, AT.torn - 4, {damping: 14, mass: 0.8, stiffness: 140});
  const temp = spr(f, AT.torn + 16, {damping: 11, mass: 0.6, stiffness: 180});
  const card = spr(f, AT.torn + 88, {damping: 12, mass: 0.7, stiffness: 160});
  const sheet = spr(f, AT.torn - 10, {damping: 13, mass: 0.85, stiffness: 130});
  return (
    <g>
      <rect width={W} height={H} fill="#1A1410" />
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
      <g opacity={sheet} filter="url(#shNear)">
        <path d={deckleLeft(f, 428)} fill="#E8D4C4" />
        <path d={deckleLeft(f - 4, 392)} fill="#F3E3D4" opacity={0.92} />
        <ellipse cx={150} cy={220} rx={160} ry={110} fill="#C9A28A" opacity={0.38} />
        <ellipse cx={240} cy={620} rx={130} ry={160} fill="#8FA98C" opacity={0.28} />
        <ellipse cx={90} cy={880} rx={140} ry={90} fill="#D9B48A" opacity={0.32} />
        <path d={deckleRight(f, 268)} fill="#E8D4C4" />
        <ellipse cx={1780} cy={260} rx={120} ry={90} fill="#C9A28A" opacity={0.34} />
        <ellipse cx={1820} cy={820} rx={140} ry={120} fill="#8FA98C" opacity={0.26} />
      </g>
      {card > 0.01 && (
        <g opacity={card} transform={`translate(${n1((1 - card) * 24)} 0)`}>
          <rect x={48} y={780} width={360} height={148} rx={22} fill="#F3E3D4" filter="url(#shNear)" />
          <Txt x={76} y={836} size={14} font="mono" c={C.sun} ls={1.4}>
            DECKLE EDGE
          </Txt>
          <Txt x={76} y={882} size={26} font="cn" w={700} c={C.ink}>
            毛边是撕出来的
          </Txt>
          <rect x={1512} y={780} width={360} height={148} rx={22} fill="#F3E3D4" filter="url(#shNear)" />
          <Txt x={1540} y={836} size={14} font="mono" c={C.sun} ls={1.4}>
            APP HERO
          </Txt>
          <Txt x={1540} y={882} size={26} font="cn" w={700} c={C.ink}>
            头图仍然是层叠
          </Txt>
        </g>
      )}
      <Tag f={f} t0={AT.torn + 6} x={96} y={80} en="05  TORN WASH" zh="水彩纸毛边：撕开，才见到产品" />
    </g>
  );
};

const PaperWord: React.FC<{x?: number; y?: number; size?: number; fill?: string; ls?: number; stroke?: string; sw?: number}> = ({
  x = 960,
  y = 488,
  size = 248,
  fill = '#000',
  ls = 10,
  stroke,
  sw,
}) => (
  <text
    x={x}
    y={y}
    fontFamily="Jost"
    fontSize={size}
    fontWeight={800}
    fill={fill}
    stroke={stroke}
    strokeWidth={sw}
    textAnchor="middle"
    letterSpacing={ls}
  >
    PAPER
  </text>
);

const SHEETS: {dx: number; dy: number; fill: string; ox: number}[] = [
  {dx: -20, dy: 16, fill: HILLS[1], ox: -11},
  {dx: -9, dy: 7, fill: HILLS[4], ox: -5},
  {dx: 0, dy: 0, fill: C.paper, ox: 0},
];

const SCRAPS: {x: number; y: number; vx: number; rot: number; w: number; h: number; at: number}[] = [
  {x: 430, y: 360, vx: -1.6, rot: -24, w: 30, h: 18, at: 8},
  {x: 520, y: 410, vx: 1.1, rot: 16, w: 22, h: 16, at: 10},
  {x: 680, y: 340, vx: -0.8, rot: 28, w: 26, h: 14, at: 16},
  {x: 760, y: 430, vx: 1.4, rot: -12, w: 20, h: 18, at: 18},
  {x: 900, y: 350, vx: -1.2, rot: 20, w: 28, h: 15, at: 24},
  {x: 980, y: 440, vx: 0.9, rot: -30, w: 18, h: 20, at: 26},
  {x: 1120, y: 360, vx: 1.5, rot: 14, w: 24, h: 16, at: 32},
  {x: 1200, y: 420, vx: -1.0, rot: -18, w: 22, h: 14, at: 34},
  {x: 1360, y: 370, vx: 1.2, rot: 26, w: 26, h: 17, at: 40},
  {x: 1460, y: 430, vx: -0.7, rot: -22, w: 20, h: 15, at: 42},
];

const UnderCut: React.FC<{f: number}> = ({f}) => {
  const drift = (f - AT.type) * 0.42;
  return (
    <g>
      <rect width={W} height={H} fill={C.sky} />
      <circle cx={n1(1388 + drift)} cy={318} r={78} fill={C.sun} />
      <path
        d={rayDType(1388 + drift, 318, 92, 148, 14)}
        fill={C.sun}
        opacity={0.9}
        transform={`rotate(${n1(f * 0.09)} ${n1(1388 + drift)} 318)`}
      />
      {HILLS.map((c, i) => (
        <rect key={i} x={-20} y={n1(300 + i * 86 + Math.sin(f * 0.018 + i) * 7)} width={W + 40} height={110} fill={c} />
      ))}
    </g>
  );
};

const rayDType = (cx: number, cy: number, r0: number, r1: number, n: number) => {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = ((i + 0.5) * 360) / n;
    const rad = (a * Math.PI) / 180;
    const x0 = cx + Math.cos(rad) * r0;
    const y0 = cy + Math.sin(rad) * r0;
    const x1 = cx + Math.cos(rad) * r1;
    const y1 = cy + Math.sin(rad) * r1;
    const w = 6 + (i % 3) * 2;
    const nx = -Math.sin(rad) * w;
    const ny = Math.cos(rad) * w;
    d += `M${n1(x0 + nx)} ${n1(y0 + ny)} L${n1(x1)} ${n1(y1)} L${n1(x0 - nx)} ${n1(y0 - ny)} Z`;
  }
  return d;
};

export const Type: React.FC<{f: number}> = ({f}) => {
  const stack = spr(f, AT.type + 2, {damping: 12, mass: 0.7, stiffness: 160});
  const word = spr(f, AT.type + 18, {damping: 10, mass: 0.6, stiffness: 170});
  const bladeX = tween(f, AT.type + 28, 48, 180, 1760, E.inOut);
  const cutting = f >= AT.type + 28 && f < AT.type + 86;
  const zi = spr(f, AT.type + 86, {damping: 12, mass: 0.7, stiffness: 160});
  const punchZi = spr(f, AT.type + 102, {damping: 11, mass: 0.55, stiffness: 190});
  const sub = spr(f, AT.type + 124, {damping: 14, mass: 0.8, stiffness: 140});
  return (
    <g>
      <rect width={W} height={H} fill={C.wall} />
      <UnderCut f={f} />
      <g opacity={stack}>
        <g clipPath="url(#typeUncut)">
          {SHEETS.map((s, i) => {
            const enter = spr(f, AT.type + 2 + i * 5, {damping: 12, mass: 0.7, stiffness: 170});
            return (
              <rect
                key={`s${i}`}
                x={n1(s.dx)}
                y={n1(s.dy + (1 - enter) * 70)}
                width={W}
                height={H}
                fill={s.fill}
                filter="url(#shMid)"
                opacity={enter}
              />
            );
          })}
        </g>
        <g clipPath="url(#typeCut)">
          {SHEETS.map((s, i) => {
            const enter = spr(f, AT.type + 2 + i * 5, {damping: 12, mass: 0.7, stiffness: 170});
            return (
              <g key={`p${i}`} mask={`url(#punch${i})`} opacity={enter} filter="url(#shNear)">
                <rect x={n1(s.dx)} y={n1(s.dy)} width={W} height={H} fill={s.fill} />
              </g>
            );
          })}
        </g>
      </g>
      {word > 0.01 && (
        <g opacity={word * (1 - tween(f, AT.type + 28, 48, 0, 1, E.out))}>
          <PaperWord fill="none" stroke={C.ink} sw={3} />
        </g>
      )}
      {cutting && (
        <g transform={`translate(${n1(bladeX)} 250)`} filter="url(#shLift)">
          <rect x={-7} y={0} width={14} height={280} rx={4} fill={C.paper} />
          <rect x={-16} y={268} width={32} height={52} rx={8} fill={C.folk} />
        </g>
      )}
      {SCRAPS.map((s, i) => {
        const age = f - (AT.type + 28 + s.at);
        if (age < 0 || age > 90) return null;
        const py = s.y + age * 3.6 + age * age * 0.07;
        const px = s.x + s.vx * age;
        const r = s.rot + age * 2.8;
        return (
          <rect
            key={i}
            x={n1(-s.w / 2)}
            y={n1(-s.h / 2)}
            width={s.w}
            height={s.h}
            fill={C.paper}
            transform={`translate(${n1(px)} ${n1(py)}) rotate(${n1(r)})`}
            opacity={Math.max(0, 1 - age / 88)}
            filter="url(#shFar)"
          />
        );
      })}
      {zi > 0.01 && (
        <g opacity={zi} transform={`translate(0 ${n1((1 - zi) * 36)})`} filter="url(#shLift)">
          <rect x={820} y={620} width={280} height={200} rx={18} fill={C.folk} />
          {punchZi > 0.02 && (
            <g opacity={punchZi} clipPath="url(#ziGlyph)">
              <rect x={820} y={620} width={280} height={200} fill={C.sky} />
              <circle cx={960} cy={700} r={26} fill={C.sun} />
              <rect x={820} y={748} width={280} height={72} fill={HILLS[2]} />
            </g>
          )}
          {punchZi < 0.96 && (
            <Txt x={960} y={760} size={120} font="cn" w={900} c={C.paper} anchor="middle" o={1 - punchZi}>
              剪
            </Txt>
          )}
        </g>
      )}
      {sub > 0.01 && (
        <Txt x={960} y={900} size={28} font="cn" w={500} c={C.ink} anchor="middle" o={sub}>
          字不是写上去的，是从纸上剪下来的
        </Txt>
      )}
      <Tag f={f} t0={AT.type + 8} x={72} y={96} en="06  TYPE CUT" zh="字体剪纸：把字从纸堆里剪穿" />
      <defs>
        <clipPath id="typeCut">
          <rect x={0} y={0} width={n1(bladeX)} height={H} />
        </clipPath>
        <clipPath id="typeUncut">
          <rect x={n1(bladeX)} y={0} width={n1(W - bladeX + 8)} height={H} />
        </clipPath>
        {SHEETS.map((s, i) => (
          <mask key={i} id={`punch${i}`} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
            <rect width={W} height={H} fill="white" />
            <PaperWord x={960 + s.ox} fill="#000" />
          </mask>
        ))}
        <clipPath id="ziGlyph">
          <text x="960" y="760" fontFamily="Noto Sans SC" fontSize="132" fontWeight="900" textAnchor="middle">
            剪
          </text>
        </clipPath>
      </defs>
    </g>
  );
};
