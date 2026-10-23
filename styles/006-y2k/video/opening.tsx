/** 006 · Y2K —— 00 开场（开机自检 → 铬字 Y2K）· 01 铬（天空 + 地平线 + 地面） */
import React from 'react';
import {E, spr, tween} from '../../../src/lib/anim';
import {C, F} from '../tokens';
import {AT} from './timeline';
import {BOUNCY, Callout, Chrome, Head, Kicker, P, Pill, Progress, Ruler, Star, Svg, Txt, base, c01, inS, inT, lerp, n1, outT, typed} from './ui';

/** 掉下来再弹两下（果冻球、泡泡共用）：返回 y */
export const bounce = (f: number, t0: number, y: number, from: number, fall = 16) => {
  const t = f - t0;
  if (t <= 0) return from;
  if (t < fall) return from + (y - from) * (t / fall) ** 2;
  const u = t - fall;
  return y - Math.abs(y - from) * 0.16 * Math.exp(-u / 9) * Math.abs(Math.sin((u * Math.PI) / 11));
};

/** 铬字 Y2K 的参数（开场和片尾共用一套，片尾“回到开头”） */
export const HERO = {text: 'Y2K', x: 960, y: 700, size: 520, font: F.display, weight: 900, align: 'center', ls: -16};
/** 进度条“正在连接到 2000 年…”（开场 0 → 99%，片尾 99 → 100%） */
export const Loader: React.FC<{f: number; t0: number; p: number; done?: boolean}> = ({f, t0, p, done}) => {
  const k = inT(f, t0, 16);
  return (
    <g opacity={k}>
      <Txt x={1290} y={902} size={15} w={500}>{done ? '已连接 · 欢迎来到 2000 年' : '正在连接到 2000 年…'}</Txt>
      <Progress x={1290} y={916} w={480} h={22} p={p} />
      <Txt x={1840} y={934} size={13} font="pixel" c={C.aqua} anchor="end">{`${Math.floor(p * 100)}%`}</Txt>
    </g>
  );
};

/* ─────────── 00 开场 ─────────── */
export const Opening: React.FC<P> = ({f}) => {
  const T = AT.open;
  // 铬字：从镜头前 3 倍大“砸”下来，第 1 拍落地
  const land = T + 30;
  const zin = f < land ? tween(f, T + 16, 14, 1.6, 1, E.in) : 1 + 0.035 * Math.exp(-(f - land) / 6) * Math.cos((f - land) * 0.55);
  const shk = f >= land && f < land + 14 ? Math.exp(-(f - land) / 4) * 7 * Math.sin((f - land) * 2.7) : 0;
  const hy = lerp(470, 520, tween(f, land, 90, 0, 1, E.inOut)); // 地平线（镜头高度）慢慢往下走：反光是“活”的
  const big = f < T + 44 ? 0 : 160 * spr(f, T + 44, {damping: 12, mass: 0.9, stiffness: 90});
  const g1 = bounce(f, T + 50, 246, -140);
  const g2 = bounce(f, T + 62, 156, -60, 14);
  const p = tween(f, T + 58, 50, 0, 0.99, E.inOut);
  const sec = f < T + 40 ? 57 : f < T + 90 ? 58 : 59;
  const tb = inT(f, T + 54, 20);
  const cfg = base({
    cam: [960, -hy, 1400],
    xf: [0, shk, zin],
    chromeO: f < T + 16 ? 0 : c01((f - T - 16) / 5),
    envRot: 0.1 + f * 0.0016,
    sweep: [lerp(-1.4, 1.6, tween(f, land + 2, 34, 0, 1, E.inOut)), f > land ? 1 : 0],
    expo: 1 + 0.5 * Math.exp(-Math.max(0, f - land) / 5) * (f >= land ? 1 : 0),
    time: f / 60,
    texts: [HERO],
    gels: [
      [232, g1, 92, 0.3, undefined, f >= T + 50 ? 1 : 0],
      [418, g2, 28, 1.1, undefined, f >= T + 62 ? 1 : 0],
    ].map((g) => (g[4] === undefined ? [g[0], g[1], g[2], g[3], [0, 0.62, 0.78], g[5]] : g)),
    bubbles: [
      [1596, 312 - f * 0.12, Math.max(1, big), 0.15, big > 2 ? 1 : 0],
      [196, 820 - f * 0.25, 40, 0.7, inT(f, T + 70, 20)],
      [1452, 870 - f * 0.4, 16, 0.4, inT(f, T + 80, 20)],
    ],
  });
  return (
    <>
      <Svg>
        <g opacity={outT(f, T + 16, 6)} fontFamily={F.pixel} fontSize={16} letterSpacing={4} fill={C.ink} textAnchor="middle">
          <text x={960} y={548}>{typed('STARTING UP', f, T, 80)}{Math.floor(f / 8) % 2 ? '_' : ' '}</text>
        </g>
        <g fontFamily={F.pixel} fontSize={12} letterSpacing={1.2} fill={C.grey}>
          <text x={80} y={128}>{typed(`BOOT  31.12.1999  23:59:${sec}`, f, T + 4, 90)}</text>
          <text x={80} y={148}>
            {typed('CHECKING DATES ............', f, T + 16, 50)}
            <tspan fill={C.aqua}>{f > T + 96 ? ' OK' : ''}</tspan>
          </text>
          <text x={1840} y={128} textAnchor="end">{typed('MEM 64MB OK · CRT 1024×768', f, T + 10, 80)}</text>
          <text x={1840} y={148} textAnchor="end" fill={C.aqua}>{typed('AQUA 10.0 · BONDI #0095B6', f, T + 22, 80)}</text>
        </g>
      </Svg>
      <Chrome cfg={cfg} />
      <Star f={f} t0={T + 40} x={720} y={222} R={30} />
      <Star f={f} t0={T + 46} x={1730} y={790} R={60} />
      <Svg>
        <Ruler x0={80} x1={1840} y={846} p={tween(f, T + 48, 36, 0, 1, E.inOut)} />
        <g opacity={tb} transform={`translate(0 ${n1(30 * (1 - inS(f, T + 54)))})`}>
          <Txt x={76} y={944} size={76} w={900} ls={-2}>千禧未来主义</Txt>
        </g>
        <g opacity={inT(f, T + 62, 16)}>
          <Txt x={640} y={902} size={15} font="tech" ls={2}>Y2K FUTURISM</Txt>
          <Txt x={640} y={934} size={18} w={500} c={C.grey}>未来，正在加载 —— 铬 · 果冻 · 半透明</Txt>
        </g>
        <Loader f={f} t0={T + 56} p={p} />
        <Pill x={1840} y={872} label="Y2K COMPLIANT ✓" fill={C.lime} c={C.ink} font="tech" size={11} anchor="end" k={inS(f, T + 100, BOUNCY)} />
      </Svg>
    </>
  );
};

/* ─────────── 01 铬：同一个字，从“灰色渐变”到“装进一片风景” ─────────── */
export const GLYPH = {text: '铬', x: 1330, y: 836, size: 640, font: F.cn, weight: 900, align: 'center'};
export const ChromeCh: React.FC<P> = ({f}) => {
  const T = AT.chrome;
  const on = T + 30; // 第 2 拍：灰 → 铬
  const wipe = tween(f, on, 22, 0, 1, E.inOut); // 环境贴图从上往下“刷”上去
  // 地平线 = 镜头高度：平的面上，地平线正好落在 y = −cam.y
  const hy = f < T + 66 ? 560 : f < T + 92 ? lerp(560, 400, tween(f, T + 66, 26, 0, 1, E.inOut)) : lerp(400, 610, tween(f, T + 92, 24, 0, 1, E.inOut));
  const k0 = inS(f, T + 2);
  const cfg = base({
    cam: [1330, -hy, 1300],
    bevel: 24,
    envRot: 0.25 + (f - T) * 0.002,
    sweep: [lerp(-1.4, 1.6, tween(f, on + 18, 30, 0, 1, E.inOut)), 0.9],
    time: f / 60,
    texts: [GLYPH],
    xf: [0, 0, 0.94 + 0.06 * k0 + 0.012 * tween(f, T, 120, 0, 1, E.inOut)],
    bubbles: [[1760, 300 - (f - T) * 0.3, 34, 0.55, inT(f, T + 40, 20)]],
  });
  const band = (y: number, h: number, fill: string, label: string, sub: string, i: number) => {
    const k = inS(f, T + 42 + i * 6);
    return (
      <g opacity={c01(k * 1.5)} transform={`translate(${n1(-30 * (1 - k))} 0)`}>
        <rect x={80} y={y} width={56} height={h} fill={fill} stroke={C.ink} strokeOpacity={0.25} />
        <Txt x={152} y={y + h / 2 + 2} size={18} w={700}>{label}</Txt>
        <Txt x={152} y={y + h / 2 + 22} size={11} font="pixel" c={C.grey} ls={1}>{sub}</Txt>
      </g>
    );
  };
  const flatO = 1 - tween(f, on + 6, 16, 0, 1);
  return (
    <>
      <Svg>
        <Kicker f={f} t0={T + 4} n={1} src="CHROME · ENVIRONMENT MAP" />
        <Head f={f} t0={T + 8} y={236} title="铬，是一张弯曲的风景。" lines={['上半反射天空，中间一条地平线，', '下半反射地面——亮暗在地平线处突然断开。']} />
        {/* 灰色渐变（错误示范）：同一个字先“假装”金属 */}
        <g opacity={flatO} transform={`translate(1330 ${GLYPH.y}) scale(${(0.94 + 0.06 * k0).toFixed(4)}) translate(-1330 ${-GLYPH.y})`}>
          <text x={GLYPH.x} y={GLYPH.y} fontFamily={F.cn} fontWeight={900} fontSize={640} textAnchor="middle" fill="url(#gTrack)" stroke="#9AA3B5" strokeWidth={2}>铬</text>
        </g>
        {/* 环境：三段色带（就是铬里映出来的东西） */}
        <g>
          <Txt x={80} y={420} size={12} font="pixel" c={C.grey} ls={1.2} o={inT(f, T + 38, 12)}>ENVIRONMENT  ·  STUDIO HDRI</Txt>
          {band(440, 120, 'url(#skyB)', '天空 SKY', 'HDR 1.4 · #2A4FB8 → #FFFFFF', 0)}
          {band(560, 8, '#FFFFFF', '', '', 1)}
          {band(568, 120, 'url(#floorB)', '地面 FLOOR', '#1A2236 → #A9B3C6', 2)}
          <g opacity={inT(f, T + 54, 12)}>
            <line x1={70} y1={564} x2={146} y2={564} stroke={C.aqua} strokeWidth={2} />
            <Txt x={152} y={570} size={18} w={700} c={C.aqua}>地平线 HORIZON</Txt>
          </g>
        </g>
        <defs>
          <linearGradient id="skyB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2A4FB8" />
            <stop offset="0.6" stopColor="#9DB6EE" />
            <stop offset="1" stopColor="#FFFFFF" />
          </linearGradient>
          <linearGradient id="floorB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1A2236" />
            <stop offset="0.6" stopColor="#3B4458" />
            <stop offset="1" stopColor="#A9B3C6" />
          </linearGradient>
        </defs>
        <g opacity={flatO * inT(f, T + 14, 10)}>
          <Pill x={1010} y={164} label="✗  灰色渐变：像塑料" fill={C.white} c={C.grey} size={18} />
        </g>
        <g opacity={inT(f, on + 14, 10)}>
          <Pill x={1010} y={164} label="✓  环境反射：才是铬" fill={C.ink} c={C.white} size={18} />
        </g>
      </Svg>
      <Chrome cfg={cfg} style={{clipPath: wipe < 1 ? `inset(0 0 ${n1((1 - wipe) * 100)}% 0)` : undefined}} />
      <Svg>
        {wipe > 0 && wipe < 1 && <rect x={900} y={n1(wipe * 1080 - 2)} width={900} height={4} fill="#FFFFFF" />}
        {/* 标注：跟着地平线走 */}
        <Callout f={f} t0={on + 22} x={1250} y={hy - 120} x2={1700} y2={232} label="天空" sub="SKY · 朝上的面" anchor="start" />
        <Callout f={f} t0={on + 28} x={1420} y={hy} x2={1700} y2={hy - 14} label="地平线" sub="HORIZON · 最亮的一条" anchor="start" c={C.aqua} />
        <Callout f={f} t0={on + 34} x={1300} y={Math.min(860, hy + 140)} x2={1700} y2={880} label="地面" sub="FLOOR · 朝下的面" anchor="start" />
        <g opacity={inT(f, T + 66, 10) * outT(f, T + 112, 8)}>
          <Txt x={80} y={760} size={12} font="pixel" c={C.aqua} ls={1.2}>{`CAMERA Y = ${Math.round(hy)} PX`}</Txt>
          <Txt x={80} y={790} size={18} w={500} c={C.ink}>镜头一动，地平线就在字上滑过去。</Txt>
        </g>
      </Svg>
    </>
  );
};
