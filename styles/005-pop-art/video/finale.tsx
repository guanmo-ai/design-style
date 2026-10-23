/** 005 · Pop Art —— 05 放大（奥登伯格 1962）· 06 今天 · 五条规则 · 片尾 · 底栏 */
import React from 'react';
import {random} from 'remotion';
import {E, tween} from '../../../src/lib/anim';
import {C, OBJ} from '../tokens';
import {AT, CHAPTERS} from './timeline';
import {Can} from './chapters';
import {Hero} from './opening';
import {Bang, beatPulse, Blk, Box, Bubble, BurstIris, burstD, c01, Caption, circ, Dots, DotWipe, Drop, n1, out, P, Pop, popS, rect, shake, Slap, tw, Txt} from './ui';

/* ─────────── 05 放大：一个比沙发还大的汉堡（软雕塑） ─────────── */
const BX = 1260;
const GY = 930;
const seeds = Array.from({length: 16}, (_, i) => ({
  x: -270 + (i % 8) * 76 + (Math.floor(i / 8) ? 38 : 0) + (random(`sx${i}`) - 0.5) * 20,
  y: -46 - Math.floor(i / 8) * 46 + (random(`sy${i}`) - 0.5) * 16 + Math.abs((i % 8) - 3.5) * 8,
  a: (random(`sa${i}`) - 0.5) * 70,
}));
const wave = (w: number, h: number, n: number) => {
  let d = `M${-w / 2} ${-h / 2}`;
  for (let i = 0; i <= n; i++) d += `Q${n1(-w / 2 + (i - 0.5) * (w / n))} ${n1(-h / 2 - 18)} ${n1(-w / 2 + i * (w / n))} ${-h / 2}`;
  d += `V${h / 2}`;
  for (let i = n; i >= 0; i--) d += `Q${n1(-w / 2 + (i + 0.5) * (w / n))} ${n1(h / 2 + 22)} ${n1(-w / 2 + i * (w / n))} ${h / 2}`;
  return d + 'Z';
};
const cheese = (() => {
  const w = 750;
  let d = `M${-w / 2} -13H${w / 2}V13`;
  const drips = [300, 190, 60, -80, -210, -320];
  drips.forEach((x, i) => {
    const L = 34 + (i % 3) * 22;
    d += `L${x + 30} 13L${x} ${13 + L}L${x - 30} 13`;
  });
  return d + `L${-w / 2} 13Z`;
})();

export const Burger: React.FC<P> = ({f}) => {
  const T = AT.burger;
  const u = f - (T + 60);
  const squish = u >= 0 ? 0.1 * Math.exp(-u / 9) * Math.cos(u * 0.42) : 0;
  const kP = popS(f, T + 48);
  const kH = popS(f, T + 54);
  const kW = popS(f, T + 62);
  const SQ = 0.34;
  return (
    <g>
      <rect width={1920} height={1080} fill={C.cyan} />
      <rect width={1920} height={1080} fill="url(#dotCyan)" opacity={0.6} />
      <rect y={GY} width={1920} height={150} fill={C.yellow} stroke={C.ink} strokeWidth={6} />
      <g transform={`translate(${BX} ${GY}) scale(${(1 + squish * 0.6).toFixed(4)} ${(1 - squish).toFixed(4)}) translate(${-BX} ${-GY})`}>
        <Drop f={f} t0={T + 4} x={BX} y={GY - 48} hb={48} squash={SQ} from={-1100}>
          <Blk d="M-350 -48H350Q350 48 300 48H-300Q-350 48 -350 -48Z" fill={OBJ.bun} />
        </Drop>
        <Drop f={f} t0={T + 11} x={BX} y={GY - 96 - 42} hb={42} squash={SQ} from={-1100}>
          <Blk d={rect(730, 84, 40)} fill={OBJ.meat} pat="dotInk" />
        </Drop>
        <Drop f={f} t0={T + 18} x={BX} y={GY - 180 - 13} hb={13} squash={SQ} from={-1100}>
          <Blk d={cheese} fill={C.yellow} sh={8} />
        </Drop>
        <Drop f={f} t0={T + 25} x={BX} y={GY - 206 - 17} hb={17} squash={SQ} from={-1100}>
          <Blk d={wave(770, 34, 9)} fill={OBJ.leaf} sh={8} />
        </Drop>
        <Drop f={f} t0={T + 32} x={BX} y={GY - 240 - 100} hb={100} squash={SQ} from={-1100}>
          <Blk d="M-355 100V40C-355 -62 -200 -100 0 -100C200 -100 355 -62 355 40V100Z" fill={OBJ.bun} />
          <path d="M-250 -40C-180 -80 -80 -88 10 -86" stroke={C.white} strokeWidth={14} fill="none" strokeLinecap="round" opacity={0.75} />
          {seeds.map((s, i) => (
            <ellipse key={i} cx={s.x} cy={s.y + 40} rx={14} ry={7} fill={C.white} stroke={C.ink} strokeWidth={3} transform={`rotate(${n1(s.a)} ${n1(s.x)} ${n1(s.y + 40)})`} />
          ))}
        </Drop>
      </g>
      {/* 1.7 米的人：比一比 */}
      {kP > 0.001 && (
        <g transform={`translate(700 ${GY}) scale(${kP.toFixed(3)}) translate(-700 ${-GY})`}>
          <g fill={C.white} stroke={C.ink} strokeWidth={6} strokeLinejoin="round">
            <path d="M650 930V700H690V930ZM710 930V700H750V930Z" fill={C.blue} />
            <path d="M640 470Q640 445 665 445H735Q760 445 760 470V710H640Z" fill={C.red} />
            <path d="M640 480L612 650M760 480L788 650" strokeWidth={22} strokeLinecap="round" stroke={C.ink} />
            <path d="M640 480L612 650M760 480L788 650" strokeWidth={10} strokeLinecap="round" stroke={C.pink} />
            <circle cx={700} cy={410} r={40} fill={C.pink} />
          </g>
        </g>
      )}
      {kH > 0.001 && (
        <g opacity={c01(kH)}>
          <path d="M575 372V928M560 390L575 368L590 390M560 910L575 932L590 910" stroke={C.ink} strokeWidth={5} fill="none" />
          <Box x={500} y={560} w={150} h={64} fill={C.white} k={kH} rot={-3}>
            <Txt x={75} y={46} size={40} font="display" anchor="middle" ls={0.03}>1.7 M</Txt>
          </Box>
        </g>
      )}
      {kW > 0.001 && (
        <g opacity={c01(kW)}>
          <path d="M890 452H1630M908 437L886 452L908 467M1612 437L1634 452L1612 467" stroke={C.ink} strokeWidth={5} fill="none" />
          <Box x={1185} y={392} w={160} h={64} fill={C.yellow} k={kW} rot={2}>
            <Txt x={80} y={46} size={40} font="display" anchor="middle" ls={0.03}>2.1 M</Txt>
          </Box>
        </g>
      )}
      <Caption f={f} t={T} n={5} title="放大" year="1962" name="克拉斯·奥登伯格 · 《地板汉堡》" sub="帆布里塞满泡沫：比沙发还大的汉堡" />
      <DotWipe f={f} t={AT.today} c={C.paper} dir="left" />
    </g>
  );
};

/* ─────────── 06 今天：波普住进了手机 ─────────── */
export const Today: React.FC<P> = ({f}) => {
  const T = AT.today;
  const PX = 1250;
  const PY = 560;
  const kN = tween(f, T + 44, 10, 0, 1, E.out);
  const [jx, jy] = shake(f, T + 30, 8, 'pow');
  const tags: [string, string, number, number, number][] = [
    ['表情包', C.red, 150, 470, -4],
    ['漫画滤镜', C.yellow, 230, 610, 3],
    ['联名包装', C.cyan, 140, 750, -2],
  ];
  return (
    <g>
      <rect width={1920} height={1080} fill={C.paper} />
      <rect width={1920} height={1080} fill="url(#dotPink)" />
      <Drop f={f} t0={T + 2} x={PX} y={PY} hb={400} squash={0.1} from={-1200}>
        <Blk d={rect(430, 800, 60)} fill={C.ink} sh={16} />
        <rect x={-195} y={-380} width={390} height={760} rx={44} fill={C.white} />
        <rect x={-195} y={-380} width={390} height={760} rx={44} fill="url(#dotPaper)" />
        <rect x={-60} y={-372} width={120} height={26} rx={13} fill={C.ink} />
        <rect x={-195} y={-340} width={390} height={78} fill={C.yellow} stroke={C.ink} strokeWidth={5} />
        <Txt x={0} y={-290} size={30} anchor="middle">周末吃啥？（3）</Txt>
        <Bubble x={-40} y={-190} w={270} h={84} tx={-90} ty={70} k={popS(f, T + 16)} sh={6}>
          <Txt x={0} y={11} size={32} anchor="middle">去哪儿吃？</Txt>
        </Bubble>
        <Bubble x={50} y={-70} w={220} h={84} tx={80} ty={70} k={popS(f, T + 23)} fill={C.yellow} sh={6}>
          <Txt x={0} y={11} size={34} anchor="middle">汉堡！</Txt>
        </Bubble>
        <Pop f={f} t0={T + 30} x={-50 + jx} y={90 + jy} rot={-8}>
          <Blk d={burstD(118, 78, 12, 0.2, 'pow')} fill={C.white} sh={8} sw={5} />
          <Bang x={0} y={0} size={74} c={C.red} rot={0}>POW!</Bang>
        </Pop>
        <Pop f={f} t0={T + 37} x={60} y={262} rot={4}>
          <Blk d={rect(270, 170, 10)} fill={C.yellow} sh={8} sw={5} />
          <Dots x={-135} y={-85} w={270} h={170} pitch={13} c={C.red} r={(x, y) => Math.max(0, 5.6 - 0.032 * Math.hypot(x + 40, y + 30))} />
          <path d="M-70 40V20C-70 -16 -40 -28 0 -28C40 -28 70 -16 70 20V40Z" fill={OBJ.bun} stroke={C.ink} strokeWidth={4} />
          <rect x={-74} y={40} width={148} height={18} rx={8} fill={OBJ.meat} stroke={C.ink} strokeWidth={4} />
          <rect x={-135} y={-85} width={270} height={170} rx={10} fill="none" stroke={C.ink} strokeWidth={5} />
        </Pop>
        {kN > 0.001 && (
          <g transform={`translate(0 ${n1(-470 + 170 * kN)})`} opacity={c01(kN * 2)}>
            <rect x={-176} y={-40} width={360} height={84} rx={20} fill={C.ink} transform="translate(6 6)" />
            <rect x={-180} y={-44} width={360} height={84} rx={20} fill={C.white} stroke={C.ink} strokeWidth={5} />
            <circle cx={-136} cy={-2} r={22} fill={C.red} stroke={C.ink} strokeWidth={4} />
            <Txt x={-136} y={8} size={26} anchor="middle" c={C.white}>!</Txt>
            <Txt x={-100} y={-8} size={22}>叮咚</Txt>
            <Txt x={-100} y={24} size={22} w={500}>你的联名款汉堡已出餐</Txt>
          </g>
        )}
      </Drop>
      {tags.map(([s, c, x, y, r], i) => (
        <Slap key={i} f={f} t0={T + 56 + i * 7} x={x + (tw(s, 56) + 60) / 2} y={y + 45} rot={r}>
          <Box x={-(tw(s, 56) + 60) / 2} y={-45} w={tw(s, 56) + 60} h={96} fill={c} sh={10} sw={6}>
            <Txt x={30} y={68} size={56} c={c === C.red ? C.white : C.ink}>{s}</Txt>
          </Box>
        </Slap>
      ))}
      <Pop f={f} t0={T + 40} x={1640} y={300} rot={8}>
        <Box x={-120} y={-40} w={240} h={80} fill={C.magenta} sh={8}>
          <Txt x={120} y={54} size={36} anchor="middle" c={C.white}>点赞 10万+</Txt>
        </Box>
      </Pop>
      <Pop f={f} t0={T + 50} x={1680} y={760} rot={-10}>
        <Blk d={burstD(120, 80, 11, 0.3, 'wow')} fill={C.yellow} sh={10} />
        <Bang x={0} y={0} size={78} c={C.red} rot={0}>WOW!</Bang>
      </Pop>
      <Caption f={f} t={T} n={6} title="今天" year="NOW" name="表情包、漫画滤镜、联名包装" sub="波普变成了每个人手机里的日常" />
      <DotWipe f={f} t={AT.rules} c={C.red} dir="up" />
    </g>
  );
};

/* ─────────── 五条规则 ─────────── */
export const RULES = [
  {cn: '网点', en: 'DOTS', a: '用点的大小', b: '代替渐变和阴影'},
  {cn: '黑线', en: 'OUTLINE', a: '粗黑轮廓线', b: '把每块颜色圈起来'},
  {cn: '原色', en: 'PRIMARY', a: '红黄蓝 + 黑白', b: '平涂，不混色'},
  {cn: '重复', en: 'REPEAT', a: '同一个东西', b: '排成方阵、换色复制'},
  {cn: '拟声字', en: 'BANG!', a: '字要大声：', b: '爆炸框、对话框'},
];
export const ruleT = (i: number) => AT.rules + 16 + i * 15;
const CW = 324;
const CH = 610;
const star = (() => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? 46 : 105;
    pts.push(`${n1(Math.cos(a) * r)} ${n1(Math.sin(a) * r + 8)}`);
  }
  return 'M' + pts.join('L') + 'Z';
})();

const Demo: React.FC<{i: number; f: number; t0: number}> = ({i, f, t0}) => {
  const u = f - t0;
  if (i === 0) {
    const g = tween(u, 0, 30, 0, 1, E.out);
    return <Dots x={-130} y={-130} w={260} h={260} pitch={22} c={C.red} r={(x) => g * 9.5 * c01(1 - (x + 130) / 280)} />;
  }
  if (i === 1) {
    const p = tween(u, 2, 26, 0, 1, E.inOut);
    const sh = tween(u, 28, 8);
    return (
      <g>
        <path d={star} fill={C.ink} transform={`translate(${n1(10 * sh)} ${n1(10 * sh)})`} opacity={sh} />
        <path d={star} fill={C.yellow} />
        <path d={star} fill="none" stroke={C.ink} strokeWidth={12} strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
      </g>
    );
  }
  if (i === 2) {
    const cols = [C.red, C.yellow, C.blue];
    return (
      <g>
        {cols.map((c, j) => {
          const h = 190 * tween(u, j * 6, 14, 0, 1, E.out);
          return <rect key={j} x={-120 + j * 82} y={70 - h} width={76} height={h} fill={c} stroke={C.ink} strokeWidth={5} />;
        })}
        <rect x={-120} y={78} width={240} height={46} fill={C.ink} opacity={tween(u, 20, 8)} />
        <rect x={-120} y={78} width={118} height={46} fill={C.white} stroke={C.ink} strokeWidth={5} opacity={tween(u, 24, 8)} />
      </g>
    );
  }
  if (i === 3) {
    const sets: [string, string, string][] = [
      [C.red, C.white, C.red],
      [C.yellow, C.magenta, C.ink],
      [C.cyan, C.white, C.ink],
      [C.magenta, C.yellow, C.ink],
    ];
    return (
      <g>
        {sets.map((s, j) => {
          const k = popS(f, t0 + j * 5, 22);
          if (k <= 0.001) return null;
          return (
            <g key={j} transform={`translate(${(j % 2 ? 62 : -62)} ${Math.floor(j / 2) ? 66 : -60}) scale(${(k * 0.88).toFixed(3)})`}>
              <Can top={s[0]} bot={s[1]} txt={s[2]} name={['番茄', '蘑菇', '洋葱', '豌豆'][j]} />
            </g>
          );
        })}
      </g>
    );
  }
  const k = popS(f, t0, 26) * beatPulse(f, t0 + 30, 0.08);
  const [sx, sy] = shake(f, t0 + 2, 9, 'bang');
  return (
    <g transform={`translate(${n1(sx)} ${n1(sy)}) scale(${k.toFixed(3)})`}>
      <path d={burstD(124, 80, 12, 0.15, 'rule5')} fill={C.white} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      <path d={burstD(84, 56, 12, 0.4, 'rule5b')} fill={C.yellow} />
      <Bang x={0} y={0} size={86} rot={-8}>BANG!</Bang>
    </g>
  );
};

export const Rules: React.FC<P> = ({f}) => {
  const T = AT.rules;
  const kH = popS(f, T + 4);
  return (
    <g>
      <rect width={1920} height={1080} fill={C.red} />
      <rect width={1920} height={1080} fill="url(#dotRed)" />
      <Box x={90} y={86} w={340} h={104} fill={C.yellow} k={kH} rot={-1}>
        <Txt x={28} y={77} size={72}>五条规则</Txt>
      </Box>
      <g transform="translate(470 98) rotate(-5)">
        <Box x={0} y={0} w={240} h={78} fill={C.white} k={popS(f, T + 9)}>
          <Txt x={22} y={62} size={58} font="display" c={C.red} stroke={2} ls={0.04}>5 RULES</Txt>
        </Box>
      </g>
      {RULES.map((r, i) => {
        const t0 = ruleT(i);
        const cx = 232 + i * 364;
        return (
          <Slap key={i} f={f} t0={t0} x={cx} y={600} rot={i % 2 ? 2 : -2}>
            <Box x={-CW / 2} y={-CH / 2} w={CW} h={CH} fill={C.white} sh={14} sw={6}>
              <circle cx={56} cy={62} r={36} fill={C.red} stroke={C.ink} strokeWidth={5} />
              <Txt x={56} y={80} size={50} font="display" anchor="middle" c={C.white} stroke={1.5}>{`0${i + 1}`}</Txt>
              <Txt x={108} y={84} size={r.cn.length > 2 ? 46 : 54}>{r.cn}</Txt>
              <Txt x={28} y={148} size={44} font="display" c={C.blue} ls={0.05}>{r.en}</Txt>
              <rect x={32} y={176} width={260} height={260} fill={C.paper} stroke={C.ink} strokeWidth={5} />
              <svg x={32} y={176} width={260} height={260} viewBox="-130 -130 260 260" overflow="hidden">
                <Demo i={i} f={f} t0={t0 + 6} />
              </svg>
              <rect x={32} y={176} width={260} height={260} fill="none" stroke={C.ink} strokeWidth={5} />
              <Txt x={30} y={500} size={30} w={900}>{r.a}</Txt>
              <Txt x={30} y={548} size={30} w={900}>{r.b}</Txt>
            </Box>
          </Slap>
        );
      })}
      <BurstIris f={f} t={AT.end} c={C.yellow} dur={16} seed="endIris" />
    </g>
  );
};

/* ─────────── 片尾 ─────────── */
export const End: React.FC<P> = ({f}) => {
  const T = AT.end;
  const kS = popS(f, T + 30);
  const kM = popS(f, T + 42);
  return (
    <g>
      <Hero f={f} t={T - 58} grown />
      <Bubble x={960} y={890} w={860} h={124} tx={-120} ty={-118} k={kS} rot={-1.5}>
        <Txt x={0} y={20} size={60} anchor="middle">普通的东西，也能上墙。</Txt>
      </Bubble>
      <g transform="translate(90 86) rotate(-2)">
        <Box x={0} y={0} w={tw('波普艺术 · 1956—1970', 36) + 56} h={70} fill={C.white} k={kM}>
          <Txt x={28} y={50} size={36}>波普艺术 · 1956—1970</Txt>
        </Box>
      </g>
    </g>
  );
};

/* ─────────── 底栏：左边风格名，右边当前章节（漫画的旁白框） ─────────── */
export const Hud: React.FC<P> = ({f}) => {
  const a = AT.collage;
  const b = AT.end;
  if (f < a + 4 || f >= b) return null;
  const k = popS(f, a + 4) * out(f, b - 10, 10);
  if (k <= 0.001) return null;
  let label = '';
  let s0 = a;
  if (f >= AT.rules) {
    const i = RULES.reduce((n, _, j) => (f >= ruleT(j) ? j : n), 0);
    label = `规则 0${i + 1} / 05 · ${RULES[i].cn}`;
    s0 = i ? ruleT(i) : AT.rules;
  } else {
    let i = 0;
    CHAPTERS.forEach(([, s], j) => {
      if (f >= s) i = j;
    });
    label = `0${i + 1} / 06 · ${CHAPTERS[i][0]}`;
    s0 = CHAPTERS[i][1];
  }
  const kr = 0.7 + 0.3 * popS(f, s0 + 2);
  const rw = tw(label, 28) + 48;
  return (
    <g>
      <g transform={`translate(80 996) scale(${k.toFixed(3)})`}>
        <Box x={0} y={0} w={318} h={54} fill={C.yellow} sh={6} sw={4}>
          <Txt x={20} y={38} size={28}>波普艺术</Txt>
          <Txt x={150} y={41} size={38} font="display" c={C.red} stroke={1.2} ls={0.05}>POP ART</Txt>
        </Box>
      </g>
      <g transform={`translate(${1840 - rw} 996) scale(${(k * kr).toFixed(3)})`}>
        <Box x={0} y={0} w={rw} h={54} fill={C.white} sh={6} sw={4}>
          <Txt x={24} y={38} size={28}>{label}</Txt>
        </Box>
      </g>
    </g>
  );
};
