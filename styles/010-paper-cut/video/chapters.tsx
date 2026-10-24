/** 010 · 几何层叠 · 立体纸板 · 单色剪影 · 水彩毛边 · 字体剪纸 */
import React from 'react';
import {E, POP, spr, tween} from '../../../src/lib/anim';
import {C, HILLS, TREES} from '../tokens';
import {AT} from './timeline';
import {H, W, World, n1, peelAt, phoneCam} from './layers';
import {EditorChrome, NoteCard, Phone, PhoneStatus, Tag, Txt} from './ui';

const peelLabel = (i: number): [string, string] => {
  if (i <= 1) return ['FAR', '远'];
  if (i <= 3) return ['MID', '中'];
  return ['NEAR', '近'];
};

export const Geo: React.FC<{f: number}> = ({f}) => {
  const card = spr(f, AT.geo + 34, POP, 28) * (1 - tween(f, AT.dio - 22, 18, 0, 1, E.in));
  const line = spr(f, AT.geo + 50, POP, 24);
  const bits: {at: number; node: React.ReactNode}[] = [
    {at: AT.geo + 38, node: <Txt x={44} y={78} size={15} font="mono" c={C.grey} ls={2.2}>02  ·  COLOR BLOCKS</Txt>},
    {at: AT.geo + 42, node: <Txt x={44} y={132} size={40} font="display" w={700} c={C.ink} ls={2.4}>STRATA</Txt>},
    {at: AT.geo + 46, node: <Txt x={44} y={186} size={32} font="cn" w={700} c={C.navy}>几何色块层叠</Txt>},
    {at: AT.geo + 50, node: <rect x={44} y={206} width={160 * Math.min(1, line)} height={2} fill={C.sun} />},
    {at: AT.geo + 54, node: <Txt x={44} y={232} size={13} font="display" w={500} c={C.grey} ls={1.2}>far slow  ·  near fast</Txt>},
  ];
  return (
    <g>
      <World f={f} born={AT.geo} />
      <NoteCard x={72} y={96} w={540} h={248} k={card} />
      {card > 0.05 &&
        bits.map((b, i) => {
          const k = spr(f, b.at, POP, 28);
          if (k < 0.02) return null;
          return (
            <g key={i} opacity={Math.min(1, k)} transform={`translate(${72 + (1 - k) * 20} 96)`}>
              {b.node}
            </g>
          );
        })}
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
        <World f={f} mode="dio" born={AT.geo} />
      </g>
      {Array.from({length: 6}, (_, i) => {
        const p = peelAt(f, i);
        if (p < 0.08) return null;
        const [en, zh] = peelLabel(i);
        const x = 160 + (i % 3) * 280;
        const y = 220 + Math.floor(i / 3) * 70;
        return (
          <g key={i} opacity={Math.min(1, p)} transform={`translate(${n1((1 - p) * 16)} 0)`}>
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
  const cut = spr(f, AT.sil, POP, 28);
  const leftIn = spr(f, AT.sil - 2, POP, 28);
  const rightIn = spr(f, AT.sil + 2, POP, 28);
  const gap = spr(f, AT.sil + 52, POP, 28) * (1 - spr(f, AT.sil + 88, POP, 28));
  const g = 40 * gap;
  const bladeY = tween(f, AT.sil - 24, 28, -40, 1120, E.in);
  return (
    <g>
      <rect width={W} height={H} fill={C.cream} />
      <g clipPath="url(#silLeft)">
        <g transform={`translate(${n1(-g + (1 - leftIn) * -80)} 0)`}>
          <World f={f} mode="monoInk" born={AT.sil + 2} />
        </g>
      </g>
      <g clipPath="url(#silRight)">
        <g transform={`translate(${n1(g + (1 - rightIn) * 80)} 0)`}>
          <World f={f} mode="monoPaper" born={AT.sil + 18} />
        </g>
      </g>
      <rect x={n1(956 - g / 2)} y={0} width={n1(8 + g)} height={H} fill={C.folk} opacity={0.85 * Math.min(1, cut)} />
      <rect x={950} y={n1(bladeY)} width={20} height={80} rx={4} fill={C.paper} opacity={tween(f, AT.sil - 26, 28, 1, 0, E.in)} />
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
  const left = spr(f, AT.torn - 20, POP, 28);
  const right = spr(f, AT.torn + 6, POP, 28);
  const weather = spr(f, AT.torn + 12, POP, 28);
  const temp = spr(f, AT.torn + 22, POP, 28);
  const line = spr(f, AT.torn + 26, POP, 28);
  const cardL = spr(f, AT.torn + 88, POP, 28);
  const cardR = spr(f, AT.torn + 92, POP, 28);
  const stain = (i: number) => spr(f, AT.torn - 12 + i * 4, POP, 24);
  return (
    <g>
      <rect width={W} height={H} fill="#1A1410" />
      <Phone f={f} />
      <g clipPath="url(#phoneScreen)">
        <World f={f} cam={phoneCam(f)} born={AT.geo} />
        <rect x={706} y={448} width={508} height={540} fill="url(#phoneScrim)" />
      </g>
      <PhoneStatus k={spr(f, AT.torn + 8, POP, 28)} />
      <g opacity={Math.min(1, weather)} transform={`translate(0 ${n1((1 - weather) * 16)})`}>
        <Txt x={760} y={530} size={18} font="cn" w={500} c={C.paper} o={0.75}>
          今日天气
        </Txt>
      </g>
      <g opacity={Math.min(1, temp)} transform={`translate(0 ${n1((1 - temp) * 22)})`}>
        <Txt x={760} y={628} size={84} font="display" w={600} c={C.paper}>
          18°
        </Txt>
      </g>
      <g opacity={Math.min(1, line)} transform={`translate(0 ${n1((1 - line) * 14)})`}>
        <Txt x={760} y={672} size={20} font="cn" w={500} c={C.paper} o={0.8}>
          晴  ·  同一座山，换一种纸
        </Txt>
      </g>
      <g opacity={Math.min(1, left)} transform={`translate(${n1((1 - left) * -40)} 0)`} filter="url(#shNear)">
        <path d={deckleLeft(f, 428)} fill="#E8D4C4" />
        <path d={deckleLeft(f - 4, 392)} fill="#F3E3D4" opacity={0.92} />
        <ellipse cx={150} cy={220} rx={160} ry={110} fill="#C9A28A" opacity={0.38 * stain(0)} />
        <ellipse cx={240} cy={620} rx={130} ry={160} fill="#8FA98C" opacity={0.28 * stain(1)} />
        <ellipse cx={90} cy={880} rx={140} ry={90} fill="#D9B48A" opacity={0.32 * stain(2)} />
      </g>
      <g opacity={Math.min(1, right)} transform={`translate(${n1((1 - right) * 40)} 0)`} filter="url(#shNear)">
        <path d={deckleRight(f, 268)} fill="#E8D4C4" />
        <ellipse cx={1780} cy={260} rx={120} ry={90} fill="#C9A28A" opacity={0.34} />
        <ellipse cx={1820} cy={820} rx={140} ry={120} fill="#8FA98C" opacity={0.26} />
      </g>
      {cardL > 0.01 && (
        <g opacity={Math.min(1, cardL)} transform={`translate(${n1((1 - cardL) * -24)} 0)`}>
          <rect x={48} y={780} width={360} height={148} rx={22} fill="#F3E3D4" filter="url(#shNear)" />
          <Txt x={76} y={836} size={14} font="mono" c={C.sun} ls={1.4}>
            DECKLE EDGE
          </Txt>
          <Txt x={76} y={882} size={26} font="cn" w={700} c={C.ink}>
            毛边是撕出来的
          </Txt>
        </g>
      )}
      {cardR > 0.01 && (
        <g opacity={Math.min(1, cardR)} transform={`translate(${n1((1 - cardR) * 24)} 0)`}>
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
  const sunX = 980 + drift;
  const sunY = 398;
  const wave = (y0: number, amp: number, seed: number) => {
    const y = y0 + Math.sin(f * 0.02 + seed) * 8;
    return `M-40 ${n1(y)} C 220 ${n1(y - amp)} 520 ${n1(y + amp)} 820 ${n1(y)} S 1280 ${n1(y - amp)} 1580 ${n1(y + amp * 0.6)} S 1960 ${n1(y)} 2000 ${n1(y + 6)} V1280 H-40 Z`;
  };
  return (
    <g>
      <rect width={W} height={H} fill={C.sky} />
      <circle cx={n1(sunX)} cy={sunY} r={86} fill={C.sun} />
      <path
        d={rayDType(sunX, sunY, 100, 158, 14)}
        fill={C.sun}
        opacity={0.92}
        transform={`rotate(${n1(f * 0.09)} ${n1(sunX)} ${sunY})`}
      />
      <path d={wave(428, 26, 0)} fill={HILLS[2]} />
      <path d={wave(476, 20, 1.2)} fill={HILLS[4]} />
      <path d={wave(518, 16, 2.1)} fill={C.mist} />
      {[480, 700, 1320, 1500].map((x, i) => (
        <path
          key={x}
          d={`M${x} ${n1(400 + Math.sin(f * 0.02 + i) * 4)} L${x + 16} ${n1(448)} L${x - 16} ${n1(448)} Z`}
          fill={TREES[2]}
        />
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

const GLYPHS = [
  {ch: 'P', x: 604},
  {ch: 'A', x: 782},
  {ch: 'P', x: 960},
  {ch: 'E', x: 1128},
  {ch: 'R', x: 1296},
];

export const Type: React.FC<{f: number}> = ({f}) => {
  const word = spr(f, AT.type + 18, POP, 28);
  const bladeX = tween(f, AT.type + 28, 56, 180, 1760, E.out);
  const cutting = f >= AT.type + 28 && f < AT.type + 90;
  const leave = 1 - tween(f, AT.take - 32, 28, 0, 1, E.in);
  const zi = spr(f, AT.type + 86, POP, 28) * leave;
  const punchZi = spr(f, AT.type + 94, POP, 28);
  const sub = spr(f, AT.type + 124, POP, 28) * leave;
  return (
    <g>
      <rect width={W} height={H} fill={C.wall} />
      <UnderCut f={f} />
      {SHEETS.map((s, i) => {
        const enter = spr(f, AT.type + 2 + i * 4, POP, 28);
        if (enter < 0.02) return null;
        return (
          <rect
            key={`s${i}`}
            x={n1(s.dx)}
            y={n1(s.dy + (1 - enter) * 70)}
            width={W}
            height={H}
            fill={s.fill}
            opacity={Math.min(1, enter)}
            filter="url(#shNear)"
          />
        );
      })}
      {GLYPHS.map((g, i) => {
        const k = spr(f, AT.type + 32 + i * 4, POP, 28);
        if (k < 0.02) return null;
        return (
          <g
            key={`g${i}`}
            clipPath={`url(#gly${i})`}
            transform={`translate(${g.x} 400) scale(${k.toFixed(3)}) translate(${-g.x} -400)`}
            filter="url(#shLift)"
          >
            <UnderCut f={f} />
          </g>
        );
      })}
      {word > 0.01 && (
        <g opacity={word * (1 - tween(f, AT.type + 32, 40, 0, 1, E.out))}>
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
          <rect x={820} y={620} width={280} height={200} rx={18} fill={C.sky} />
          <circle cx={960} cy={718} r={36} fill={C.sun} />
          <rect x={820} y={752} width={280} height={68} fill={HILLS[4]} />
          <rect x={820} y={620} width={280} height={200} rx={18} fill={C.folk} mask="url(#ziSheet)" />
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
        {SHEETS.map((s, i) => (
          <mask key={i} id={`punch${i}`} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
            <rect width={W} height={H} fill="white" />
            <PaperWord x={960 + s.ox} fill="#000" />
          </mask>
        ))}
        {GLYPHS.map((g, i) => (
          <clipPath key={i} id={`gly${i}`}>
            <text x={g.x} y={488} fontFamily="Jost" fontSize={248} fontWeight={800} textAnchor="middle">
              {g.ch}
            </text>
          </clipPath>
        ))}
        <mask id="ziSheet" maskUnits="userSpaceOnUse" x="820" y="620" width="280" height="200">
          <rect x="820" y="620" width="280" height="200" rx="18" fill="white" />
          <text x="960" y="760" fontFamily="Noto Sans SC" fontSize="132" fontWeight="900" textAnchor="middle" fill="black">
            剪
          </text>
        </mask>
      </defs>
    </g>
  );
};
