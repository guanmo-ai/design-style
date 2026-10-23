/** 004 · Memphis —— 开场（积木一块块掉下来 → MEMPHIS）与 01 唱片 */
import React from 'react';
import {random} from 'remotion';
import {E, tween} from '../../../src/lib/anim';
import {C, CANDY} from '../tokens';
import {AT} from './timeline';
import {Blk, c01, Caption, circ, drop, Drop, half, Iris, n1, P, Pop, popS, rect, squig, Sweep, Tag, tri, Tube, Txt, beatPulse} from './ui';

/** 一把纸屑：从 (x, y) 炸开，带重力 */
export const Burst: React.FC<{f: number; t0: number; x: number; y: number; n?: number; seed?: string; power?: number}> = ({f, t0, x, y, n = 44, seed = 'b', power = 1}) => {
  const t = f - t0;
  if (t < 0 || t > 70) return null;
  const o = 1 - tween(f, t0 + 40, 30);
  return (
    <g opacity={o}>
      {Array.from({length: n}, (_, i) => {
        const a = random(`${seed}a${i}`) * Math.PI * 2;
        const v = (10 + random(`${seed}v${i}`) * 16) * power;
        const px = x + Math.cos(a) * v * t * Math.exp(-t / 40);
        const py = y + Math.sin(a) * v * t * Math.exp(-t / 40) + 0.09 * t * t;
        const c = CANDY[i % CANDY.length];
        const r = random(`${seed}r${i}`) * 360 + t * 9;
        const k = random(`${seed}k${i}`);
        const tr = `translate(${n1(px)} ${n1(py)}) rotate(${n1(r)})`;
        if (k < 0.4) return <rect key={i} x={-14} y={-4} width={28} height={8} fill={c} stroke={C.ink} strokeWidth={2} transform={tr} />;
        if (k < 0.7) return <circle key={i} r={8} fill={c} stroke={C.ink} strokeWidth={2} transform={tr} />;
        return <path key={i} d="M0 -11L10 8H-10Z" fill={c} stroke={C.ink} strokeWidth={2} transform={tr} />;
      })}
    </g>
  );
};

/** MEMPHIS：每个字母一种颜色，一个个掉下来、弹两下 */
export const Wordmark: React.FC<{f: number; t0: number; x: number; y: number; size: number; step?: number; rot?: number}> = ({f, t0, x, y, size, step = 4, rot = -5}) => {
  const L = 'MEMPHIS'.split('');
  const ys: number[] = [];
  const rs: number[] = [];
  L.forEach((_, i) => {
    const t = t0 + i * step;
    const d = drop(f, t, 12, -1100);
    const u = f - t - 12;
    const bounce = u > 0 ? -size * 0.16 * Math.exp(-u / 6) * Math.abs(Math.sin(u * 0.32)) : 0;
    ys.push(d.on ? d.dy + bounce : -3000);
    rs.push((i % 2 ? 7 : -6) + (u > 0 ? 10 * Math.exp(-u / 8) * Math.sin(u * 0.4) : 0));
  });
  const spans = (fill: (i: number) => string, dy = 0) =>
    L.map((ch, i) => (
      <tspan key={i} dy={n1(i ? ys[i] - ys[i - 1] : ys[0] + dy)} rotate={n1(rs[i])} fill={fill(i)}>
        {ch}
      </tspan>
    ));
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <text x={0} y={0} fontFamily="Fredoka" fontWeight={700} fontSize={size} textAnchor="middle" letterSpacing="0.02em" transform="translate(14 14)" stroke={C.ink} strokeWidth={10} strokeLinejoin="round">
        {spans(() => C.ink)}
      </text>
      <text x={0} y={0} fontFamily="Fredoka" fontWeight={700} fontSize={size} textAnchor="middle" letterSpacing="0.02em" stroke={C.ink} strokeWidth={10} strokeLinejoin="round" paintOrder="stroke">
        {spans((i) => [C.pink, C.yellow, C.teal, C.red, C.blue, C.yellow, C.lilac][i])}
      </text>
    </g>
  );
};

/** 开场那一堆积木（片尾会再用一次）：t = 第一块掉下来的帧 */
export const Pile: React.FC<{f: number; t: number; pulseFrom?: number}> = ({f, t, pulseFrom = 1e9}) => {
  const k = beatPulse(f, pulseFrom, 0.05);
  return (
    <g>
      <Pop f={f} t0={t + 30} x={330} y={330} rot={-12} spin={-40}>
        <Blk d={rect(230, 230)} fill={C.white} pat="grid" />
      </Pop>
      <Pop f={f} t0={t + 36} x={1580} y={250} rot={8} spin={30}>
        <Blk d={rect(330, 150)} fill={C.white} pat="zebra" />
      </Pop>
      <Drop f={f} t0={t} x={640} y={520} hb={230} s={k}>
        <Blk d={circ(230)} fill={C.pink} />
      </Drop>
      <Drop f={f} t0={t + 8} x={1250} y={370} hb={140} rot={-14}>
        <Blk d={tri(330, 280)} fill={C.yellow} />
      </Drop>
      <Drop f={f} t0={t + 15} x={1430} y={700} hb={90} rot={18}>
        <Blk d={rect(180, 180)} fill={C.teal} />
      </Drop>
      <Drop f={f} t0={t + 22} x={430} y={905} hb={0}>
        <Blk d={half(175)} fill={C.blue} />
      </Drop>
      <Pop f={f} t0={t + 40} x={1040} y={210} s={k}>
        <Blk d={circ(46)} fill={C.red} />
      </Pop>
      <Pop f={f} t0={t + 44} x={1700} y={560} rot={-20}>
        <Blk d={half(70)} fill={C.lilac} sh={6} />
      </Pop>
      <Tube d={squig(170, 940, 1580, 30, 6, f * 0.16)} c={C.teal} w={26} p={tween(f, t + 28, 30, 0, 1, E.inOut)} />
      <Tube d={squig(860, 300, 230, 16, 2, f * 0.2)} c={C.red} w={14} p={tween(f, t + 42, 18, 0, 1, E.inOut)} />
    </g>
  );
};

export const Opening: React.FC<P> = ({f}) => {
  const tag = popS(f, 80);
  return (
    <g>
      <rect width={1920} height={1080} fill={C.paper} />
      <rect width={1920} height={1080} fill="url(#confetti)" opacity={0.55 * tween(f, 0, 30)} />
      <Pile f={f} t={0} pulseFrom={90} />
      <Wordmark f={f} t0={50} x={960} y={610} size={250} />
      <Burst f={f} t0={76} x={960} y={540} seed="open" />
      {tag > 0.001 && (
        <g transform={`translate(960 760) rotate(-3) scale(${tag.toFixed(3)})`}>
          <Tag x={0} y={0} w={700} h={84} fill={C.yellow}>
            <Txt x={0} y={15} size={42} anchor="middle" ls={0.08}>孟菲斯 · 1980—1988 · 米兰</Txt>
          </Tag>
        </g>
      )}
      <Iris f={f} t={AT.record} c={C.pink} cx={640} cy={520} r0={230} dur={14} />
    </g>
  );
};

/* ─────────── 01 唱片 ─────────── */
const Note: React.FC<{x: number; y: number; s?: number; c: string}> = ({x, y, s = 1, c}) => (
  <g transform={`translate(${n1(x)} ${n1(y)}) scale(${s})`}>
    <path d="M14 -70V0" stroke={C.ink} strokeWidth={12} strokeLinecap="round" transform="translate(5 5)" />
    <ellipse cx={0} cy={4} rx={20} ry={15} fill={C.ink} transform="translate(6 6) rotate(-20)" />
    <path d="M14 -70V0" stroke={C.ink} strokeWidth={12} strokeLinecap="round" />
    <path d="M14 -70Q40 -60 38 -34" stroke={C.ink} strokeWidth={10} fill="none" strokeLinecap="round" />
    <ellipse cx={0} cy={4} rx={20} ry={15} fill={c} stroke={C.ink} strokeWidth={5} transform="rotate(-20)" />
  </g>
);

export const Record: React.FC<P> = ({f}) => {
  const T = AT.record;
  const spin = Math.max(0, f - T - 8) * 5.5;
  const kRec = popS(f, T + 6, 30);
  const arm = tween(f, T + 24, 16, -38, 0, E.out);
  const RX = 1100;
  const RY = 590;
  return (
    <g>
      <rect width={1920} height={1080} fill={C.pink} />
      <rect width={1920} height={1080} fill="url(#dotsW)" opacity={0.35} />
      <Drop f={f} t0={T} x={1180} y={600} hb={350} fall={10}>
        <Blk d={rect(940, 700, 40)} fill={C.teal} sh={16} />
        <Blk d={rect(120, 40, 20)} fill={C.yellow} sh={0} o={1} />
      </Drop>
      {kRec > 0.001 && (
        <g transform={`translate(${RX} ${RY}) scale(${kRec.toFixed(3)})`}>
          <circle r={300} fill={C.ink} transform="translate(14 14)" />
          <circle r={300} fill={C.ink} stroke={C.ink} strokeWidth={5} />
          {Array.from({length: 11}, (_, i) => (
            <circle key={i} r={128 + i * 15} fill="none" stroke="#3a3a3a" strokeWidth={2} />
          ))}
          <path d="M-220 -150A266 266 0 0 1 -60 -258" stroke={C.white} strokeWidth={10} fill="none" opacity={0.28} strokeLinecap="round" />
          <path d="M215 160A266 266 0 0 1 80 252" stroke={C.white} strokeWidth={8} fill="none" opacity={0.2} strokeLinecap="round" />
          <g transform={`rotate(${n1(spin)})`}>
            <circle r={108} fill={C.yellow} stroke={C.ink} strokeWidth={4} />
            <path id="labelArc" d="M-74 0A74 74 0 1 1 74 0A74 74 0 1 1 -74 0" fill="none" />
            <text fontFamily="Fredoka" fontWeight={700} fontSize={25} fill={C.ink} letterSpacing="0.08em">
              <textPath href="#labelArc">MEMPHIS BLUES AGAIN · 1966 ·</textPath>
            </text>
            <path d="M-108 0H108" stroke={C.red} strokeWidth={6} opacity={0} />
            <circle r={30} fill={C.red} stroke={C.ink} strokeWidth={4} />
            <circle r={8} fill={C.paper} />
          </g>
        </g>
      )}
      {/* 唱臂：从外面摆进来 */}
      {f >= T + 20 && (
        <g transform={`translate(1520 300) rotate(${n1(arm)})`}>
          <Tube d="M0 0L-40 170L-150 300" c={C.white} w={18} cap="round" />
          <g transform="translate(-150 300) rotate(30)">
            <Blk d={rect(56, 84, 8)} fill={C.red} sh={6} />
          </g>
          <Blk d={circ(48)} fill={C.lilac} />
          <Blk d={circ(16)} fill={C.yellow} sh={0} />
        </g>
      )}
      {[0, 1, 2].map((i) => {
        const t0 = T + 34 + i * 12;
        if (f < t0) return null;
        const u = f - t0;
        const k = popS(f, t0);
        return (
          <g key={i} opacity={c01(1 - (u - 40) / 14)}>
            <Note x={640 - i * 150 + Math.sin(u * 0.15 + i) * 18} y={520 + i * 80 - u * 2.6} s={k * (1.2 - i * 0.15)} c={[C.yellow, C.teal, C.blue][i]} />
          </g>
        );
      })}
      <Caption f={f} t={T} n={1} title="唱片" year="1980" name="Memphis Blues Again" sub="名字来自唱片上的一首歌（鲍勃·迪伦）" c={C.yellow} />
      <Sweep f={f} t={AT.carlton} c={C.lilac} dir="right" />
    </g>
  );
};
