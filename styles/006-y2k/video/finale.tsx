/** 006 · Y2K —— 06 今天（Liquid Glass）· 五条规则 · 片尾 */
import React from 'react';
import {E, spr, tween} from '../../../src/lib/anim';
import {C, F} from '../tokens';
import {AT} from './timeline';
import {HERO, Loader, bounce} from './opening';
import {BOUNCY, Chrome, Emoji, Head, Kicker, P, Pill, Ruler, Star, Svg, Txt, base, c01, inS, inT, lerp, n1, outT, reg} from './ui';

/* ─────────── 06 今天：2025，Liquid Glass ─────────── */
export const Today: React.FC<P> = ({f}) => {
  const T = AT.today;
  const kc = f < T + 4 ? 0 : spr(f, T + 4, {damping: 18, mass: 0.9, stiffness: 110});
  const cardX = lerp(1980, 1010, kc) + 40 * Math.sin((f - T) * 0.035) * kc; // 玻璃卡片滑进来，然后在铬字上慢慢漂
  const kb = inS(f, T + 24);
  const barY = lerp(1100, 826, kb);
  const kr = inS(f, T + 36, BOUNCY);
  const cfg = base({
    cam: [1330, -470, 1300],
    bevel: 22,
    envRot: 0.3 + (f - T) * 0.002,
    time: f / 60,
    texts: [{text: '2025', x: 1330, y: 640, size: 300, font: F.display, weight: 900, align: 'center', ls: -8}],
    wall: [
      [0.55, 0.75, 1.0, 0.85],
      [0.85, 1.0, 0.45, 0.55],
      [1.0, 0.7, 0.85, 0.55],
      [0.45, 0.9, 0.95, 0.6],
    ],
    panes: [
      [cardX, 300, 560, 380, 52, 34, 1],
      [1030, barY, 600, 96, 48, 26, 1],
      [1640 - 60 * kr, 160 + 60 * (1 - kr), 120 * kr + 1, 120 * kr + 1, 60 * kr, 22, kr > 0.02 ? 1 : 0],
    ],
    shadow: [0, 18, 0.45, 0],
  });
  return (
    <>
      <Chrome cfg={cfg} />
      <Svg>
        <Kicker f={f} t0={T - 8} n={6} src="APPLE WWDC · 09.06.2025" />
        <Head f={f} t0={T - 4} y={236} title="今天：玻璃又回来了。" lines={['2025 年苹果发布 Liquid Glass：', '半透明、会折射——Y2K 换了一种安静的说法。']} />
        <g opacity={inT(f, T + 30, 12)}>
          <Txt x={80} y={420} size={12} font="pixel" c={C.grey} ls={1.2}>THEN  →  NOW</Txt>
          {[
            ['果冻按钮', '玻璃按钮'],
            ['细条纹', '模糊 + 折射'],
            ['镀铬', '边缘高光'],
          ].map(([a, b], i) => {
            const k = inS(f, T + 34 + i * 6);
            return (
              <g key={a} opacity={c01(k * 1.5)} transform={`translate(${n1(-24 * (1 - k))} ${462 + i * 46})`}>
                <Txt x={80} y={0} size={20} w={500} c={C.grey}>{a}</Txt>
                <Txt x={210} y={0} size={20} w={500} c={C.grey}>→</Txt>
                <Txt x={250} y={0} size={20} w={700}>{b}</Txt>
              </g>
            );
          })}
        </g>
        {/* 玻璃上的内容：清晰、不折射（内容在玻璃之上） */}
        <g opacity={c01(kc * 1.4)}>
          <Txt x={cardX + 40} y={360} size={12} font="pixel" c={C.ink} ls={1.2}>LIQUID GLASS · 2025</Txt>
          <Txt x={cardX + 40} y={640} size={26} w={900}>透过玻璃，看见下面的铬。</Txt>
          <Txt x={cardX + 520} y={360} size={12} font="pixel" c={C.aqua} ls={1.2} anchor="end">◐ 25 YEARS</Txt>
        </g>
        {kb > 0.01 &&
          ['heart', 'face', 'sun', 'note', 'mail'].map((n, i) => (
            <g key={n} transform={`translate(${1080 + i * 110} ${n1(barY + 26)})`} opacity={i === 2 ? 1 : 0.75}>
              <Emoji name={n} x={0} y={0} s={3.6} />
            </g>
          ))}
        {kr > 0.05 && (
          <g transform={`translate(1640 220) scale(${kr.toFixed(3)})`}>
            <path d="M-16 0 H16 M0 -16 V16" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
          </g>
        )}
      </Svg>
    </>
  );
};

/* ─────────── 五条规则 ─────────── */
export const RULES: [string, string, string][] = [
  ['铬 = 天空 + 地平线 + 地面', '不是灰色渐变：上蓝、中白、下暗，', '亮暗在地平线处突然断开。'],
  ['果冻 = 半透明 + 高光 + 焦散', '左上一块硬边高光，底部聚一团亮色；', '越厚的地方颜色越深。'],
  ['底要有“技术感”', '2px 细条纹、80px 网格、', '刻度尺和套准标记。'],
  ['像素字 + 宽体字', '读数用像素字，标题用宽体几何字，', '中文用粗黑体。'],
  ['大面积银，一点荧光绿', '银灰占八成，Aqua 蓝点题，', '荧光绿只留给“通过”。'],
];
const CW = 320;
const CG = 32;
const CX = (i: number) => 96 + i * (CW + CG);
const CY = 300;
const CH = 560;
export const ruleT = (i: number) => AT.rules + 10 + i * 16;
export const Rules: React.FC<P> = ({f}) => {
  const k = RULES.map((_, i) => inS(f, ruleT(i)));
  const cfg = base({
    cam: [256, -420, 900],
    bevel: 10,
    smooth: 1.4,
    shadowBlur: 10,
    shadow: [0, 12, 0.5, 0],
    envRot: 0.3 + (f - AT.rules) * 0.004,
    chromeO: c01(k[0] * 1.5),
    xf: [0, 60 * (1 - k[0]), 1],
    time: f / 60,
    texts: [{text: 'Cr', x: 256, y: 524, size: 190, font: F.display, weight: 900, align: 'center', ls: -4}],
    gels: [[CX(1) + CW / 2, 452 + 60 * (1 - k[1]), 92, 0.6, [0.9, 0.2, 0.43], c01(k[1] * 1.5)]],
  });
  return (
    <>
      <Svg>
        <g opacity={inT(f, AT.rules - 8, 12)}>
          <Txt x={96} y={150} size={15} font="tech" c={C.aqua} ls={2}>5 RULES</Txt>
          <Txt x={96} y={222} size={54} w={900}>Y2K 的五条规则</Txt>
          <Txt x={1824} y={222} size={14} font="pixel" c={C.grey} ls={1.2} anchor="end">CHEATSHEET  ·  1997 — 2004</Txt>
        </g>
        {RULES.map(([t, a, b], i) => {
          const x = CX(i);
          const kk = k[i];
          if (kk <= 0.001) return null;
          return (
            <g key={t} opacity={c01(kk * 1.5)} transform={`translate(0 ${n1(60 * (1 - kk))})`}>
              <rect x={x} y={CY + 16} width={CW} height={CH} rx={28} fill={C.ink} opacity={0.14} filter="url(#soft14)" />
              <rect x={x} y={CY} width={CW} height={CH} rx={28} fill="#FFFFFF" opacity={0.72} stroke="#FFFFFF" strokeWidth={2} />
              <rect x={x + 16} y={CY + 4} width={CW - 32} height={60} rx={24} fill="url(#gHi)" opacity={0.6} />
              <Txt x={x + 28} y={CY + 46} size={14} font="tech" c={C.aqua} ls={2}>{`0${i + 1}`}</Txt>
              <Txt x={x + 28} y={CY + 380} size={24} w={900}>{t}</Txt>
              <Txt x={x + 28} y={CY + 420} size={16} w={400} c={C.grey}>{a}</Txt>
              <Txt x={x + 28} y={CY + 446} size={16} w={400} c={C.grey}>{b}</Txt>
            </g>
          );
        })}
      </Svg>
      <Chrome cfg={cfg} />
      <Svg>
        {/* 03 技术底 */}
        {k[2] > 0.001 && (
          <g opacity={c01(k[2] * 1.5)} transform={`translate(0 ${n1(60 * (1 - k[2]))})`}>
            <rect x={CX(2) + 28} y={CY + 70} width={CW - 56} height={230} rx={14} fill="url(#pin)" stroke="#A4ACBB" />
            <path d={(() => {
              let d = '';
              for (let x = CX(2) + 48; x < CX(2) + CW - 28; x += 40) d += `M${x} ${CY + 70}V${CY + 300}`;
              for (let y = CY + 90; y < CY + 300; y += 40) d += `M${CX(2) + 28} ${y}H${CX(2) + CW - 28}`;
              return d;
            })()} stroke={C.ink} strokeOpacity={0.12} />
            <Ruler x0={CX(2) + 48} x1={CX(2) + CW - 48} y={CY + 280} />
            {reg(CX(2) + 60, CY + 102)}
            {reg(CX(2) + CW - 60, CY + 102)}
          </g>
        )}
        {/* 04 字 */}
        {k[3] > 0.001 && (
          <g opacity={c01(k[3] * 1.5)} transform={`translate(0 ${n1(60 * (1 - k[3]))})`}>
            <Txt x={CX(3) + 28} y={CY + 170} size={76} font="tech">Aa</Txt>
            <Txt x={CX(3) + 196} y={CY + 170} size={64} font="pixel" c={C.aqua}>Aa</Txt>
            <Txt x={CX(3) + 28} y={CY + 280} size={84} w={900}>千禧</Txt>
            <Txt x={CX(3) + 30} y={CY + 194} size={10} font="pixel" c={C.grey} ls={1}>MICHROMA</Txt>
            <Txt x={CX(3) + 198} y={CY + 194} size={10} font="pixel" c={C.grey} ls={1}>SILKSCREEN</Txt>
            <Txt x={CX(3) + 30} y={CY + 306} size={10} font="pixel" c={C.grey} ls={1}>NOTO SANS SC · BLACK</Txt>
          </g>
        )}
        {/* 05 配色比例 */}
        {k[4] > 0.001 && (
          <g opacity={c01(k[4] * 1.5)} transform={`translate(0 ${n1(60 * (1 - k[4]))})`}>
            {(
              [
                [0.8, 'url(#gTitle)', '银 80%'],
                [0.15, 'url(#gBlue)', '蓝 15%'],
                [0.05, 'url(#gLime)', '绿 5%'],
              ] as const
            ).reduce(
              (acc, [w, fill, l]) => {
                const x0 = acc.x;
                const ww = (CW - 56) * w * c01(kk(k[4]));
                acc.els.push(<rect key={l} x={n1(x0)} y={CY + 90} width={n1(Math.max(0, ww - 4))} height={170} rx={12} fill={fill} stroke="#9AA3B5" strokeOpacity={0.5} />);
                acc.els.push(
                  <Txt key={l + 't'} x={x0 + 6} y={CY + 290} size={12} font="pixel" c={C.grey} ls={0.5}>{w >= 0.15 ? l : ''}</Txt>,
                );
                acc.x += ww;
                return acc;
              },
              {x: CX(4) + 28, els: [] as React.ReactNode[]},
            ).els}
            <circle cx={CX(4) + CW - 40} cy={CY + 290 - 4} r={6} fill={C.lime} stroke={C.ink} strokeOpacity={0.3} />
          </g>
        )}
      </Svg>
    </>
  );
};
const kk = (v: number) => v;

/* ─────────── 片尾：回到 Y2K，进度 100% ─────────── */
export const End: React.FC<P> = ({f}) => {
  const T = AT.end;
  const k = f < T - 4 ? 0 : spr(f, T - 4, {damping: 16, mass: 0.8, stiffness: 120});
  const done = T + 44;
  const p = tween(f, T + 20, 24, 0.99, 1, E.inOut);
  const g1 = bounce(f, T + 10, 246, -140);
  const cfg = base({
    cam: [960, -lerp(560, 500, tween(f, T, 110, 0, 1, E.inOut)), 1400],
    xf: [0, 0, lerp(0.86, 1, k)],
    envRot: 0.3 + (f - T) * 0.002,
    sweep: [lerp(-1.4, 1.6, tween(f, done, 34, 0, 1, E.inOut)), f >= done ? 1.1 : 0],
    expo: 1 + 0.35 * (f >= done ? Math.exp(-(f - done) / 8) : 0),
    time: f / 60,
    texts: [HERO],
    gels: [
      [232, g1, 92, 0.3, [0, 0.62, 0.78], f >= T + 10 ? 1 : 0],
      [418, bounce(f, T + 20, 156, -60, 14), 28, 1.1, [0.78, 0.96, 0.24], f >= T + 20 ? 1 : 0],
    ],
    bubbles: [
      [1596, 312 - (f - T) * 0.15, 160 * inS(f, T + 6) + 1, 0.15, f >= T + 6 ? 1 : 0],
      [196, 820 - (f - T) * 0.25, 40, 0.7, inT(f, T + 24, 20)],
    ],
  });
  return (
    <>
      <Chrome cfg={cfg} />
      <Star f={f} t0={T + 16} x={720} y={222} R={30} />
      <Star f={f} t0={T + 22} x={1730} y={790} R={60} />
      <Star f={f} t0={done + 6} x={1180} y={300} R={22} />
      <Svg>
        <g fontFamily={F.pixel} fontSize={12} letterSpacing={1.2} fill={C.grey} opacity={inT(f, T, 10)}>
          <text x={80} y={128}>BOOT  01.01.2000  00:00:00</text>
          <text x={80} y={148}>
            CHECKING DATES ............<tspan fill={C.aqua}> OK</tspan>
          </text>
          <text x={1840} y={128} textAnchor="end">ALL SYSTEMS NOMINAL</text>
          <text x={1840} y={148} textAnchor="end" fill={C.aqua}>{f >= done ? 'SYSTEM READY ✓' : 'LOADING ...'}</text>
        </g>
        <Ruler x0={80} x1={1840} y={846} />
        <g opacity={inT(f, T + 4, 14)} transform={`translate(0 ${n1(24 * (1 - inS(f, T + 4)))})`}>
          <Txt x={76} y={944} size={76} w={900} ls={-2}>千禧未来主义</Txt>
        </g>
        <g opacity={inT(f, T + 10, 14)}>
          <Txt x={640} y={902} size={15} font="tech" ls={2}>Y2K FUTURISM · 1997 — 2004</Txt>
          <Txt x={640} y={934} size={18} w={f >= done ? 700 : 500} c={f >= done ? C.ink : C.grey}>{f >= done ? '未来，已经加载完成。' : '未来，正在加载 —— 铬 · 果冻 · 半透明'}</Txt>
        </g>
        <Loader f={f} t0={T} p={p} done={f >= done} />
        <Pill x={1840} y={872} label={f >= done ? 'SYSTEM READY ✓' : 'Y2K COMPLIANT ✓'} fill={C.lime} c={C.ink} font="tech" size={11} anchor="end" k={f >= done ? 0.9 + 0.1 * spr(f, done, BOUNCY) : inS(f, T + 8)} />
      </Svg>
    </>
  );
};
