import {flipScale, Squeegee} from '../../../src/lib/motion/screen-print';
/** 005 · Pop Art —— 02 汤罐（沃霍尔 1962）· 03 网点（利希滕斯坦 1961—1963）· 04 丝网（沃霍尔《花》1964） */
import React from 'react';
import {random} from 'remotion';
import {E, tween} from '../../../src/lib/anim';
import {C, OBJ} from '../tokens';
import {AT} from './timeline';
import {Blk, Box, c01, Caption, circ, DotWipe, lerp, n1, P, popS, Txt} from './ui';

/* ─────────── 02 汤罐 ─────────── */
export const FLAVORS = [
  '番茄', '蘑菇', '洋葱', '芹菜', '豌豆', '黑豆', '蛤蜊', '牛肉',
  '鸡肉面', '蔬菜', '芦笋', '鸡汤', '胡椒', '玉米', '土豆', '南瓜',
  '牛尾', '火腿', '奶油', '米饭', '鸡肉', '扁豆', '甜菜', '虾仁',
  '海鲜', '菠菜', '番茄米', '杂菜', '牛肉面', '鸡肉饭', '素菜', '字母',
];
/** 一个汤罐：(0, 0) 是罐子中心；top = 上半截标签色，bot = 下半截，txt = 罐身上的字色 */
export const Can: React.FC<{top: string; bot: string; txt: string; name?: string; s?: number}> = ({top, bot, txt, name = '番茄', s = 1}) => (
  <g transform={`scale(${s})`}>
    <rect x={-52 + 8} y={-58 + 8} width={104} height={124} fill={C.ink} />
    <rect x={-52} y={-58} width={104} height={62} fill={top} stroke={C.ink} strokeWidth={4} />
    <rect x={-52} y={4} width={104} height={58} fill={bot} stroke={C.ink} strokeWidth={4} />
    <Txt x={0} y={-14} size={36} font="display" anchor="middle" c={txt === C.ink ? C.white : bot} stroke={1.6} ls={0.04}>SOUP</Txt>
    <circle cx={0} cy={4} r={11} fill={OBJ.gold} stroke={C.ink} strokeWidth={3} />
    <Txt x={0} y={42} size={name.length > 2 ? 17 : 20} anchor="middle" c={txt}>{name}</Txt>
    <path d="M-52 62Q0 76 52 62" fill="none" stroke={C.ink} strokeWidth={4} />
    <ellipse cx={0} cy={-58} rx={52} ry={10} fill="#D9D9D9" stroke={C.ink} strokeWidth={4} />
    <ellipse cx={0} cy={-58} rx={38} ry={6} fill="none" stroke="#9A9A9A" strokeWidth={2} />
  </g>
);
/** 换色之后的四套配色（不用蓝：蓝是这一幕的底色） */
const SETS: [string, string, string][] = [
  [C.red, C.white, C.red],
  [C.yellow, C.magenta, C.ink],
  [C.magenta, C.yellow, C.ink],
  [C.cyan, C.white, C.ink],
  [C.ink, C.yellow, C.ink],
];

export const Soup: React.FC<P> = ({f}) => {
  const T = AT.soup;
  return (
    <g>
      <rect width={1920} height={1080} fill={C.blue} />
      <rect width={1920} height={1080} fill="url(#dotBlue)" />
      {FLAVORS.map((name, i) => {
        const c = i % 8;
        const r = Math.floor(i / 8);
        const t0 = T + 10 + (c + r) * 3;
        const k = popS(f, t0, 22);
        if (k <= 0.001) return null;
        // 在拍点（270）上一列一列翻面换色：翻到一半（侧面）时换配色
        const ts = T + 60 + c * 2 + r;
        const u = f - ts;
        const flip = flipScale(u);
        const set = u < 5 ? SETS[0] : SETS[1 + ((c + r * 3) % 4)];
        return (
          <g key={i} transform={`translate(${260 + c * 200} ${410 + r * 150}) scale(${(1.08 * k * Math.max(0.04, flip)).toFixed(3)} ${(1.08 * k).toFixed(3)})`}>
            <Can top={set[0]} bot={set[1]} txt={set[2]} name={name} />
          </g>
        );
      })}
      <Caption f={f} t={T} n={2} title="汤罐" year="1962" name="安迪·沃霍尔 · 32 罐汤" sub="一罐一种口味 · 洛杉矶 Ferus 画廊" />
      <DotWipe f={f} t={AT.dots} c={C.white} dir="down" />
    </g>
  );
};

/* ─────────── 03 网点：从一颗点拉远到一整格漫画 ─────────── */
const tear = 'M0 -54C16 -24 36 -2 36 20A36 36 0 1 1 -36 20C-36 -2 -16 -24 0 -54Z';
const ALMOND = 'M1040 532Q1290 362 1545 516Q1290 660 1040 532Z';

export const Zoom: React.FC<P> = ({f}) => {
  const T = AT.dots;
  // 镜头：一开始放大 9 倍，只看得到几颗红点；拉远之后才看出是一张漫画的脸
  const p = tween(f, T, 44, 0, 1, E.inOut);
  const s = Math.pow(9, 1 - p);
  const FX = 1600;
  const FY = 830;
  const kB = popS(f, T + 46);
  const kL = popS(f, T + 54);
  const tk = popS(f, T + 50, 20);
  const ty = 600 + 330 * Math.pow(tween(f, T + 56, 32, 0, 1, (x) => x), 1.8);
  const blink = f > T + 70 && f < T + 76 ? 0.25 : 1;
  return (
    <g>
      <rect width={1920} height={1080} fill={C.paper} />
      <rect width={1920} height={1080} fill="url(#dotPaper)" />
      <g transform={`translate(${FX} ${FY}) scale(${s.toFixed(4)}) translate(${-FX} ${-FY})`}>
        <defs>
          <clipPath id="panel3">
            <rect x={740} y={110} width={1080} height={850} />
          </clipPath>
          <clipPath id="eye3">
            <path d={ALMOND} />
          </clipPath>
        </defs>
        <rect x={752} y={122} width={1080} height={850} fill={C.ink} />
        <g clipPath="url(#panel3)">
          <rect x={740} y={110} width={1080} height={850} fill={C.white} />
          <rect x={740} y={110} width={1080} height={850} fill="url(#skin)" />
          {/* 头发：一大块蓝，几根黑线 */}
          <path d="M740 110H1560C1450 170 1250 150 1080 230C930 300 860 430 740 500Z" fill={C.blue} stroke={C.ink} strokeWidth={10} />
          <path d="M1400 150C1250 180 1080 210 960 290M1200 140C1050 170 930 230 840 330M980 130C900 170 820 230 760 300" stroke={C.ink} strokeWidth={7} fill="none" strokeLinecap="round" />
          {/* 眉毛 */}
          <path d="M1050 372Q1290 262 1548 346" stroke={C.ink} strokeWidth={26} fill="none" strokeLinecap="round" />
          {/* 眼睛 */}
          <g transform={`translate(0 ${n1(524 * (1 - blink))}) scale(1 ${blink})`}>
            <path d={ALMOND} fill={C.white} />
            <g clipPath="url(#eye3)">
              <circle cx={1300} cy={515} r={108} fill={C.cyan} />
              <circle cx={1300} cy={515} r={108} fill="url(#skinBlue)" />
              <circle cx={1300} cy={515} r={50} fill={C.ink} />
              <circle cx={1338} cy={478} r={22} fill={C.white} />
              <circle cx={1264} cy={550} r={9} fill={C.white} />
            </g>
            <path d={ALMOND} fill="none" stroke={C.ink} strokeWidth={8} />
            <path d="M1030 536Q1290 352 1555 512" stroke={C.ink} strokeWidth={20} fill="none" strokeLinecap="round" />
            {[0, 1, 2, 3, 4].map((i) => {
              const x = 1395 + i * 34;
              const y = 432 + i * i * 4.2;
              return <path key={i} d={`M${x} ${n1(y)}q${10 + i * 6} -40 ${34 + i * 10} -${48 - i * 4}`} stroke={C.ink} strokeWidth={11} fill="none" strokeLinecap="round" />;
            })}
          </g>
          {/* 眼泪 */}
          {tk > 0.001 && (
            <g transform={`translate(1070 ${n1(ty)}) scale(${tk.toFixed(3)})`}>
              <path d={tear} fill={C.ink} transform="translate(7 7)" />
              <path d={tear} fill={C.cyan} stroke={C.ink} strokeWidth={6} />
              <path d="M-14 6Q-18 26 -4 40" stroke={C.white} strokeWidth={8} fill="none" strokeLinecap="round" />
            </g>
          )}
        </g>
        <rect x={740} y={110} width={1080} height={850} fill="none" stroke={C.ink} strokeWidth={12} />
      </g>
      {/* 对话框：画里的人自己发现了 */}
      <g transform="translate(1585 232) rotate(2)">
        {kB > 0.001 && (
          <g transform={`scale(${kB.toFixed(3)})`}>
            <path d="M-210 -62H190Q210 -62 210 -42V42Q210 62 190 62H-40L-120 118L-100 62H-190Q-210 62 -210 42V-42Q-210 -62 -190 -62Z" fill={C.ink} transform="translate(10 10)" />
            <path d="M-210 -62H190Q210 -62 210 -42V42Q210 62 190 62H-40L-120 118L-100 62H-190Q-210 62 -210 42V-42Q-210 -62 -190 -62Z" fill={C.white} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
            <Txt x={0} y={16} size={46} anchor="middle">原来……全是点？</Txt>
          </g>
        )}
      </g>
      {/* 放大镜：近看就是一颗颗红点 */}
      {kL > 0.001 && (
        <g transform={`translate(400 650) rotate(-8) scale(${kL.toFixed(3)})`}>
          <defs>
            <clipPath id="lens3">
              <circle r={170} />
            </clipPath>
          </defs>
          <path d="M120 120L250 250" stroke={C.ink} strokeWidth={56} strokeLinecap="round" transform="translate(10 10)" />
          <path d="M120 120L250 250" stroke={C.ink} strokeWidth={56} strokeLinecap="round" />
          <path d="M128 128L246 246" stroke={C.red} strokeWidth={36} strokeLinecap="round" />
          <circle r={186} fill={C.ink} transform="translate(12 12)" />
          <g clipPath="url(#lens3)">
            <rect x={-180} y={-180} width={360} height={360} fill={C.white} />
            {Array.from({length: 7}, (_, j) =>
              Array.from({length: 7}, (_, i) => <circle key={`${i}-${j}`} cx={-180 + i * 66 + (j % 2 ? 33 : 0)} cy={-180 + j * 57} r={22.4} fill={C.red} />),
            )}
          </g>
          <circle r={170} fill="none" stroke={C.ink} strokeWidth={22} />
          <circle r={170} fill="none" stroke={C.yellow} strokeWidth={10} />
          <path d="M-110 -70A130 130 0 0 1 -40 -126" stroke={C.white} strokeWidth={12} fill="none" strokeLinecap="round" opacity={0.85} />
        </g>
      )}
      <Caption f={f} t={T + 30} n={3} title="网点" year="1963" name="罗伊·利希滕斯坦 · 放大的漫画" sub="本戴点：靠点的大小画出深浅" />
      <DotWipe f={f} t={AT.screen} c={C.ink} dir="left" />
    </g>
  );
};

/* ─────────── 04 丝网：一层颜色一张网版，黑版故意不对准 ─────────── */
const TILES = [
  {x: 840, y: 318, bg: C.magenta, fl: C.yellow},
  {x: 1314, y: 318, bg: C.yellow, fl: C.red},
  {x: 840, y: 642, bg: C.cyan, fl: C.magenta},
  {x: 1314, y: 642, bg: C.red, fl: C.cyan},
];
const TW = 450;
const TH = 300;
const FLW: [number, number, number][] = [
  [-100, -12, 1],
  [118, 30, 0.78],
];
const petals = (cx: number, cy: number, s: number) =>
  [0, 1, 2, 3].map((i) => {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    return circ(56 * s, cx + Math.cos(a) * 48 * s, cy + Math.sin(a) * 48 * s);
  });
/** 黑版：草、花瓣轮廓、花心（相对颜色版错开 (12, -8)） */
const grass = (() => {
  let d = '';
  for (let i = 0; i < 60; i++) {
    const x = random(`g${i}`) * TW;
    const h = 30 + random(`gh${i}`) * 70;
    const lean = (random(`gl${i}`) - 0.5) * 40;
    d += `M${n1(x - 5)} ${TH}Q${n1(x + lean * 0.5)} ${n1(TH - h * 0.6)} ${n1(x + lean)} ${n1(TH - h)}Q${n1(x + lean * 0.3 + 4)} ${n1(TH - h * 0.5)} ${n1(x + 6)} ${TH}Z`;
  }
  for (let i = 0; i < 26; i++) {
    const x = random(`gt${i}`) * TW;
    const y = random(`gy${i}`) * TH * 0.5;
    d += `M${n1(x)} ${n1(y)}q12 -18 30 -10q-14 4 -30 10Z`;
  }
  return d;
})();

export const Screen: React.FC<P> = ({f}) => {
  const T = AT.screen;
  const p1 = tween(f, T + 8, 26, 0, 1, E.inOut);
  const p2 = tween(f, T + 40, 26, 0, 1, E.inOut);
  const X0 = 800;
  const X1 = 1800;
  const sx1 = lerp(X0, X1, p1);
  const sx2 = lerp(X1, X0, p2);
  const pass2 = f >= T + 40;
  const sq = pass2 ? sx2 : sx1;
  const showSq = (f >= T + 6 && f < T + 36) || (f >= T + 38 && f < T + 68);
  const k1 = popS(f, T + 8);
  const k2 = popS(f, T + 40);
  const kN = popS(f, T + 70);
  return (
    <g>
      <rect width={1920} height={1080} fill={C.ink} />
      <rect width={1920} height={1080} fill="url(#dotInk)" />
      <defs>
        <clipPath id="pass1">
          <rect x={0} y={0} width={Math.max(0, sx1)} height={1080} />
        </clipPath>
        <clipPath id="pass2">
          <rect x={pass2 ? sx2 : 1920} y={0} width={1920} height={1080} />
        </clipPath>
      </defs>
      {/* 空白的纸 */}
      {TILES.map((t, i) => (
        <g key={i}>
          <rect x={t.x + 10} y={t.y + 10} width={TW} height={TH} fill="#000" opacity={0.6} />
          <rect x={t.x} y={t.y} width={TW} height={TH} fill={C.white} />
        </g>
      ))}
      {/* 第 1 遍：颜色版 */}
      <g clipPath="url(#pass1)">
        {TILES.map((t, i) => (
          <g key={i}>
            <rect x={t.x} y={t.y} width={TW} height={TH} fill={t.bg} />
            {FLW.map(([fx, fy, s], j) => petals(t.x + TW / 2 + fx, t.y + TH / 2 + fy, s).map((d, q) => <path key={`${j}${q}`} d={d} fill={t.fl} />))}
          </g>
        ))}
      </g>
      {/* 第 2 遍：黑版（错开一点点） */}
      <g clipPath="url(#pass2)">
        {TILES.map((t, i) => (
          <g key={i}>
            <svg x={t.x} y={t.y} width={TW} height={TH} overflow="hidden">
              <g transform="translate(12 -8)">
                <path d={grass} fill={C.ink} />
                <mask id={`fl${i}`}>
                  <rect x={-40} y={-40} width={TW + 80} height={TH + 80} fill="#000" />
                  {FLW.map(([fx, fy, s], j) => petals(TW / 2 + fx, TH / 2 + fy, s).map((d, q) => <path key={`${j}${q}`} d={d} fill="none" stroke="#fff" strokeWidth={14} />))}
                  {FLW.map(([fx, fy, s], j) => petals(TW / 2 + fx, TH / 2 + fy, s).map((d, q) => <path key={`b${j}${q}`} d={d} fill="#000" />))}
                </mask>
                <rect x={-40} y={-40} width={TW + 80} height={TH + 80} fill={C.ink} mask={`url(#fl${i})`} />
                {FLW.map(([fx, fy, s], j) => (
                  <g key={j}>
                    {[0, 1, 2, 3].map((q) => {
                      const a = Math.PI / 4 + (q * Math.PI) / 2;
                      const cx = TW / 2 + fx;
                      const cy = TH / 2 + fy;
                      return <path key={q} d={`M${n1(cx + Math.cos(a) * 22 * s)} ${n1(cy + Math.sin(a) * 22 * s)}L${n1(cx + Math.cos(a) * 62 * s)} ${n1(cy + Math.sin(a) * 62 * s)}`} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />;
                    })}
                    <circle cx={TW / 2 + fx} cy={TH / 2 + fy} r={22 * s} fill={C.ink} />
                  </g>
                ))}
              </g>
            </svg>
          </g>
        ))}
      </g>
      {TILES.map((t, i) => (
        <rect key={i} x={t.x} y={t.y} width={TW} height={TH} fill="none" stroke={C.ink} strokeWidth={6} />
      ))}
      {/* 刮板 */}
      {showSq && (
        <Squeegee x={sq} reverse={pass2} ink={C.ink} color={C.magenta} handle={OBJ.bun} paper={C.white} />
      )}
      <Box x={110} y={430} w={500} h={84} fill={C.magenta} k={k1} rot={-2}>
        <Txt x={28} y={57} size={40}>第 1 遍 · 颜色版</Txt>
      </Box>
      <Box x={110} y={548} w={500} h={84} fill={C.white} k={k2} rot={1.5}>
        <Txt x={28} y={57} size={40}>第 2 遍 · 黑版</Txt>
      </Box>
      <Box x={140} y={666} w={540} h={74} fill={C.yellow} k={kN} rot={-1}>
        <Txt x={26} y={50} size={32}>黑版故意错开 → 印刷的“手感”</Txt>
      </Box>
      <Caption f={f} t={T} n={4} title="丝网" year="1964" name="安迪·沃霍尔 · 《花》" sub="一层颜色一张网版，一刮一张" yc={C.magenta} />
      <DotWipe f={f} t={AT.burger} c={C.cyan} dir="radial" cx={1300} cy={640} />
    </g>
  );
};
