/** 004 · Memphis —— 05 纹样 · 06 今天 · 五条规则 · 片尾 · 底栏 */
import React from 'react';
import {E, tween} from '../../../src/lib/anim';
import {C, CANDY} from '../tokens';
import {AT, CHAPTERS} from './timeline';
import {Burst, Pile, Wordmark} from './opening';
import {beatPulse, Blk, Caption, circ, Drop, half, n1, out, P, Pop, popS, poly, rect, squig, Sweep, Tag, tri, Tube, Txt} from './ui';

/* ─────────── 05 纹样：Bacterio（索特萨斯，1978）和它的伙伴们 ─────────── */
const TILES: {name: string; fill: string; pat: string; rot: number}[] = [
  {name: '波浪线', fill: C.yellow, pat: 'squig', rot: -6},
  {name: '斑马纹', fill: C.white, pat: 'zebra', rot: 5},
  {name: '方格纸', fill: C.pink, pat: 'grid', rot: -3},
  {name: '圆点', fill: C.teal, pat: 'dots', rot: 7},
  {name: '纸屑', fill: C.white, pat: 'confetti', rot: -8},
  {name: '条纹', fill: C.blue, pat: 'zebraW', rot: 4},
];
export const Pattern: React.FC<P> = ({f}) => {
  const T = AT.pattern;
  const slab = popS(f, T + 6, 28);
  return (
    <g>
      <rect width={1920} height={1080} fill={C.paper} />
      <rect width={1920} height={1080} fill="url(#confetti)" opacity={0.5} />
      {/* 左下：一大块 Bacterio 塑料贴面 */}
      {slab > 0.001 && (
        <g transform={`translate(450 700) rotate(${n1(-4 - 10 * (1 - slab))}) scale(${slab.toFixed(3)})`}>
          <Blk d={rect(640, 440, 18)} fill={C.white} pat="bacterio" sh={14} sw={6} />
          <g transform="translate(-190 -230) rotate(-6)">
            <Tag x={0} y={0} w={300} h={64} fill={C.red}>
              <Txt x={0} y={14} size={36} font="display" w={700} anchor="middle" c={C.white}>BACTERIO</Txt>
            </Tag>
          </g>
          <g transform="translate(220 232) rotate(4)">
            <Tag x={0} y={0} w={240} h={56} fill={C.yellow}>
              <Txt x={0} y={11} size={30} font="mono" w={700} anchor="middle">1978</Txt>
            </Tag>
          </g>
        </g>
      )}
      {/* 右边：六块小样，十六分音符一块 */}
      {TILES.map((t, i) => {
        const x = 1060 + (i % 3) * 300;
        const y = 330 + Math.floor(i / 3) * 370;
        return (
          <Pop key={i} f={f} t0={T + 22 + i * 7.5} x={x} y={y} rot={t.rot} spin={i % 2 ? 40 : -40}>
            <Blk d={rect(240, 240, 14)} fill={t.fill} pat={t.pat} sh={10} />
            <g transform={`translate(0 152) rotate(${-t.rot * 0.6})`}>
              <Tag x={0} y={0} w={44 * t.name.length + 50} h={58} fill={C.white} sh={5}>
                <Txt x={0} y={13} size={36} anchor="middle">{t.name}</Txt>
              </Tag>
            </g>
          </Pop>
        );
      })}
      <Caption f={f} t={T} n={5} title="纹样" year="1978" name="Bacterio · 塑料贴面" sub="不要木纹，要图案：印在桌面上的“细菌”" c={C.lilac} />
      <Sweep f={f} t={AT.today} c={C.teal} dir="up" />
    </g>
  );
};

/* ─────────── 06 今天：又回到屏幕上 ─────────── */
const PX = 1200;
const PY = 560;
const star = (r1: number, r2: number, n: number) =>
  poly(Array.from({length: n * 2}, (_, i) => {
    const a = (Math.PI * i) / n - Math.PI / 2;
    const r = i % 2 ? r2 : r1;
    return [Math.cos(a) * r, Math.sin(a) * r] as [number, number];
  }));
const heart = 'M0 34C-60 -6 -70 -56 -36 -66C-18 -71 -6 -60 0 -46C6 -60 18 -71 36 -66C70 -56 60 -6 0 34Z';
export const Today: React.FC<P> = ({f}) => {
  const T = AT.today;
  const ui = (i: number) => popS(f, T + 16 + i * 5);
  const scroll = -tween(f, T + 58, 24, 0, 150, E.inOut);
  const S = (i: number, x: number, y: number, el: React.ReactNode, rot = 0) => {
    const k = ui(i);
    if (k <= 0.001) return null;
    return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k.toFixed(3)})`}>{el}</g>;
  };
  const labels: [string, string, number][] = [
    ['插画', C.pink, -5],
    ['贴纸', C.yellow, 4],
    ['App 界面', C.lilac, -3],
  ];
  return (
    <g>
      <rect width={1920} height={1080} fill={C.teal} />
      <rect width={1920} height={1080} fill="url(#dotsW)" opacity={0.22} />
      {/* 手机 */}
      <Drop f={f} t0={T + 2} x={PX} y={PY} hb={430} rot={4} fall={12} from={-1200}>
        <Blk d={rect(450, 860, 60)} fill={C.ink} sh={16} sw={0} />
        <defs>
          <clipPath id="m-screen">
            <path d={rect(406, 812, 40)} />
          </clipPath>
        </defs>
        <path d={rect(406, 812, 40)} fill={C.paper} />
        <g clipPath="url(#m-screen)">
          <g transform={`translate(0 ${n1(scroll)})`}>
            <rect x={-210} y={-420} width={420} height={170} fill={C.pink} />
            <path d={squig(-210, -250, 420, 10, 5, f * 0.2)} stroke={C.ink} strokeWidth={6} fill="none" />
            {S(0, -170, -300, <Txt x={0} y={0} size={70} font="display" w={700} c={C.white} stroke={9}>Hello!</Txt>)}
            {S(1, 0, -60, (
              <g>
                <Blk d={rect(340, 270, 22)} fill={C.yellow} sh={8} />
                <Blk d={circ(54)} fill={C.teal} sh={6} sw={4} />
                <g transform="translate(-90 -50)"><Blk d={circ(30)} fill={C.red} sh={5} sw={4} /></g>
                <g transform="translate(86 20) rotate(14)"><Blk d={tri(110, 96)} fill={C.blue} sh={6} sw={4} /></g>
                <g transform="translate(-70 90)"><Blk d={half(56)} fill={C.pink} sh={5} sw={4} /></g>
                <Tube d={squig(10, 92, 130, 9, 2, f * 0.25)} c={C.lilac} w={9} sw={3} sh={4} />
              </g>
            ), -2)}
            {S(2, -95, 140, (
              <Tag x={0} y={0} w={170} h={54} fill={C.lilac} sh={4}>
                <Txt x={0} y={11} size={30} font="display" w={600} anchor="middle">#memphis</Txt>
              </Tag>
            ), -4)}
            {S(3, 100, 140, (
              <Tag x={0} y={0} w={150} h={54} fill={C.teal} sh={4}>
                <Txt x={0} y={11} size={30} font="display" w={600} anchor="middle">#80s</Txt>
              </Tag>
            ), 5)}
            {S(4, 0, 260, (
              <Tag x={0} y={0} w={300} h={86} fill={C.yellow} sh={7}>
                <Txt x={0} y={18} size={50} font="display" w={700} anchor="middle">GO!</Txt>
              </Tag>
            ))}
            {S(5, 0, 470, (
              <g>
                <Blk d={rect(340, 220, 22)} fill={C.white} pat="zebra" sh={8} />
                <g transform="translate(60 -10)"><Blk d={circ(60)} fill={C.red} sh={6} sw={4} /></g>
              </g>
            ), 3)}
          </g>
        </g>
        <path d={rect(130, 26, 13)} fill={C.ink} transform="translate(0 -380)" />
      </Drop>
      {/* 左边：三张贴纸，一拍一张 */}
      {labels.map(([s, c, r], i) => (
        <Pop key={i} f={f} t0={T + 30 + i * 8} x={470 + (i % 2) * 50} y={560 + i * 130} rot={r} spin={i % 2 ? 30 : -30}>
          <Tag x={0} y={0} w={60 + s.length * 50} h={92} fill={c}>
            <Txt x={0} y={18} size={52} anchor="middle">{s}</Txt>
          </Tag>
        </Pop>
      ))}
      {/* 右边：NEW! 和一颗心 */}
      <Pop f={f} t0={T + 40} x={1580} y={270} rot={12} spin={120}>
        <g transform={`rotate(${n1((f - T) * 0.8)})`}>
          <Blk d={star(120, 88, 12)} fill={C.red} />
        </g>
        <Txt x={0} y={18} size={56} font="display" w={700} c={C.white} anchor="middle" stroke={8}>NEW!</Txt>
      </Pop>
      <Pop f={f} t0={T + 48} x={1630} y={700} rot={-10} s={beatPulse(f, T + 60, 0.12)}>
        <Blk d={heart} fill={C.pink} />
        <path d="M-30 -44Q-38 -30 -30 -16" stroke={C.white} strokeWidth={8} fill="none" strokeLinecap="round" />
      </Pop>
      <Pop f={f} t0={T + 52} x={1700} y={600} rot={8}>
        <Tag x={0} y={0} w={100} h={50} fill={C.white} sh={4}>
          <Txt x={0} y={11} size={30} font="display" w={700} anchor="middle">99+</Txt>
        </Tag>
      </Pop>
      <Caption f={f} t={T} n={6} title="今天" year="2010s" name="Memphis Revival" sub="又回来了：插画、贴纸、App 界面" c={C.yellow} />
      <Sweep f={f} t={AT.rules} c={C.paper} dir="down" pat="confetti" />
    </g>
  );
};

/* ─────────── 五条规则：五张卡片，八分音符一张，砸成一排 ─────────── */
const RULES: {cn: string; en: string; sub: string; c: string}[] = [
  {cn: '积木', en: 'SHAPES', sub: '一块一色', c: C.pink},
  {cn: '撞色', en: 'CLASH', sub: '糖果色 + 黑', c: C.yellow},
  {cn: '纹样', en: 'PATTERN', sub: '图案代替质感', c: C.teal},
  {cn: '歪着放', en: 'TILT', sub: '转一点，别对齐', c: C.lilac},
  {cn: '黑描边', en: 'OUTLINE', sub: '线 + 硬投影', c: C.red},
];
export const ruleT = (i: number) => AT.rules + 10 + i * 15;
const Demo: React.FC<{i: number; f: number; t: number}> = ({i, f, t}) => {
  const d = f - t;
  if (i === 0)
    return (
      <g>
        <Drop f={f} t0={t + 8} x={-78} y={-2} hb={42} from={-260} fall={9}><Blk d={circ(42)} fill={C.teal} sh={6} sw={4} /></Drop>
        <Drop f={f} t0={t + 14} x={10} y={0} hb={40} from={-260} fall={9}><Blk d={tri(92, 80)} fill={C.yellow} sh={6} sw={4} /></Drop>
        <Drop f={f} t0={t + 20} x={84} y={5} hb={35} from={-260} fall={9} rot={10}><Blk d={rect(68, 70)} fill={C.blue} sh={6} sw={4} /></Drop>
      </g>
    );
  if (i === 1) {
    const shift = Math.max(0, Math.floor((f - t - 20) / 15));
    return (
      <g>
        {[0, 1, 2, 3, 4, 5].map((j) => (
          <Pop key={j} f={f} t0={t + 8 + j * 2} x={-76 + (j % 3) * 76} y={-80 + Math.floor(j / 3) * 76} rot={j % 2 ? 6 : -6}>
            <Blk d={rect(62, 62, 6)} fill={CANDY[(j + shift) % 6]} sh={5} sw={4} />
          </Pop>
        ))}
      </g>
    );
  }
  if (i === 2)
    return (
      <g>
        {(['zebra', 'dots', 'squig', 'grid'] as const).map((p, j) => (
          <Pop key={j} f={f} t0={t + 8 + j * 3} x={-56 + (j % 2) * 112} y={-96 + Math.floor(j / 2) * 98} rot={j % 3 ? 4 : -5}>
            <Blk d={rect(98, 86, 8)} fill={[C.white, C.yellow, C.pink, C.white][j]} pat={p} sh={5} sw={4} />
          </Pop>
        ))}
      </g>
    );
  if (i === 3)
    return (
      <g>
        {[-15, 11, -7].map((r, j) => {
          const w = d > 14 + j * 4 ? r + 4 * Math.sin((d - 14 - j * 4) * 0.21) : r;
          return (
            <Pop key={j} f={f} t0={t + 8 + j * 4} x={j === 1 ? 16 : -10} y={-150 + j * 64} rot={w}>
              <Blk d={rect(190, 46, 8)} fill={[C.pink, C.teal, C.yellow][j]} sh={6} sw={4} />
            </Pop>
          );
        })}
      </g>
    );
  // i === 4：先有颜色，再画黑线，最后投影滑出来
  const k = popS(f, t + 6);
  const line = tween(f, t + 14, 14, 0, 1, E.inOut);
  const sh = tween(f, t + 26, 12, 0, 16, E.out);
  if (k <= 0.001) return null;
  return (
    <g transform={`translate(0 -84) scale(${k.toFixed(3)})`}>
      <path d={circ(74)} fill={C.ink} transform={`translate(${n1(sh)} ${n1(sh)})`} />
      <path d={circ(74)} fill={C.lilac} />
      <path d={circ(74)} fill="none" stroke={C.ink} strokeWidth={7} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - line} />
    </g>
  );
};
export const Rules: React.FC<P> = ({f}) => {
  const T = AT.rules;
  const kt = popS(f, T + 4);
  return (
    <g>
      <rect width={1920} height={1080} fill={C.paper} />
      <rect width={1920} height={1080} fill="url(#confetti)" opacity={0.5} />
      {kt > 0.001 && (
        <g transform={`translate(960 190) rotate(-2) scale(${kt.toFixed(3)})`}>
          <Txt x={0} y={0} size={96} anchor="middle" sh={6} c={C.ink}>五条规则</Txt>
          <Tube d={squig(-210, 44, 420, 10, 4, f * 0.2)} c={C.pink} w={12} sw={3} sh={4} p={tween(f, T + 8, 16)} />
        </g>
      )}
      {RULES.map((r, i) => {
        const t = ruleT(i);
        const x = 240 + i * 360;
        const rot = i % 2 ? 3 : -3;
        const k = f >= T + 120 ? beatPulse(f, T + 120 + 0, 0.03) : 1;
        return (
          <Drop key={i} f={f} t0={t} x={x} y={620} hb={300} rot={rot} fall={13} from={-1200} s={k}>
            <defs>
              <clipPath id={`m-rule-${i}`}>
                <path d={rect(262, 252, 18)} transform="translate(0 -84)" />
              </clipPath>
            </defs>
            <Blk d={rect(320, 600, 28)} fill={r.c} sh={14} sw={6} />
            <path d={rect(262, 252, 18)} transform="translate(0 -84)" fill={C.white} stroke={C.ink} strokeWidth={4} />
            <g clipPath={`url(#m-rule-${i})`}>
              <g transform="translate(0 -84)">
                <rect x={-131} y={88} width={262} height={40} fill={C.paper} />
              </g>
              <Demo i={i} f={f} t={t} />
            </g>
            <path d="M-131 4H131" stroke={C.ink} strokeWidth={4} />
            <g transform="translate(-124 -262) rotate(-10)">
              <Blk d={circ(40)} fill={C.white} sh={5} sw={4} />
              <Txt x={0} y={14} size={40} font="display" w={700} anchor="middle">{`0${i + 1}`}</Txt>
            </g>
            <Txt x={0} y={124} size={68} anchor="middle">{r.cn}</Txt>
            <Txt x={0} y={182} size={38} font="display" w={700} anchor="middle" ls={0.06}>{r.en}</Txt>
            <Txt x={0} y={240} size={30} w={700} anchor="middle">{r.sub}</Txt>
          </Drop>
        );
      })}
      <Sweep f={f} t={AT.end} c={C.paper} dir="right" pat="confetti" />
    </g>
  );
};

/* ─────────── 片尾：积木再砸一次，MEMPHIS，口号 ─────────── */
export const End: React.FC<P> = ({f}) => {
  const T = AT.end;
  const kS = popS(f, T + 46);
  const kN = popS(f, T + 56);
  return (
    <g>
      <rect width={1920} height={1080} fill={C.paper} />
      <rect width={1920} height={1080} fill="url(#confetti)" opacity={0.55} />
      <Pile f={f} t={T} pulseFrom={T + 60} />
      <Wordmark f={f} t0={T + 20} x={960} y={540} size={240} step={3} />
      <Burst f={f} t0={T + 42} x={960} y={480} seed="end" n={50} />
      {kS > 0.001 && (
        <g transform={`translate(960 690) rotate(-2) scale(${kS.toFixed(3)})`}>
          <Tag x={0} y={0} w={880} h={104} fill={C.white} sh={8}>
            <Txt x={0} y={20} size={56} anchor="middle">让普通的东西，看起来“好玩”</Txt>
          </Tag>
        </g>
      )}
      {kN > 0.001 && (
        <g transform={`translate(960 806) rotate(1.5) scale(${kN.toFixed(3)})`}>
          <Tag x={0} y={0} w={660} h={62} fill={C.yellow} sh={5}>
            <Txt x={0} y={12} size={32} w={700} anchor="middle">每天一个设计风格 · 004 · 孟菲斯</Txt>
          </Tag>
        </g>
      )}
    </g>
  );
};

/* ─────────── 底栏：左边风格名，右边第几章 ─────────── */
export const Hud: React.FC<P> = ({f}) => {
  const a = AT.record;
  const b = AT.end;
  if (f < a + 4 || f >= b) return null;
  const k = popS(f, a + 4) * out(f, b - 10, 10);
  if (k <= 0.001) return null;
  let label = '';
  let s0 = a;
  if (f >= AT.rules) {
    const i = RULES.reduce((n, _, j) => (f >= ruleT(j) + 13 ? j : n), 0);
    label = `规则 0${i + 1} / 05 · ${RULES[i].cn}`;
    s0 = i ? ruleT(i) + 13 : AT.rules;
  } else {
    let i = 0;
    CHAPTERS.forEach(([, s], j) => {
      if (f >= s) i = j;
    });
    label = `0${i + 1} / 06 · ${CHAPTERS[i][0]}`;
    s0 = CHAPTERS[i][1];
  }
  const kr = 0.7 + 0.3 * popS(f, s0 + 2);
  const rw = 60 + label.length * 26;
  return (
    <g>
      <g transform={`translate(${80 + 170} 1020) scale(${k.toFixed(3)}) rotate(-2)`}>
        <Tag x={0} y={0} w={340} h={56} fill={C.white} sh={5}>
          <Txt x={-140} y={11} size={28} w={900}>孟菲斯</Txt>
          <Txt x={-40} y={11} size={28} font="display" w={700} ls={0.08}>MEMPHIS</Txt>
        </Tag>
      </g>
      <g transform={`translate(${1840 - rw / 2} 1020) scale(${(k * kr).toFixed(3)}) rotate(2)`}>
        <Tag x={0} y={0} w={rw} h={56} fill={C.yellow} sh={5}>
          <Txt x={0} y={11} size={28} w={900} anchor="middle">{label}</Txt>
        </Tag>
      </g>
    </g>
  );
};

