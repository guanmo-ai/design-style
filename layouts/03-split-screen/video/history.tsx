/**
 * 02:00–05:30 来历：四个年代，四个世界。
 * 每个年代是一整幅画面（两半各画一遍、被中线裁开），用那个年代自己的视觉语言：
 *   1927 构成主义（红色斜带 + 三联银幕的胶片）→ 1959 波普（网点 + 两格漫画 + 电话线）→
 *   2009 Aero 玻璃（桌面窗口真的贴到左半 / 右半）→ 2015 扁平（iPad 的 Split View，中缝可拖）
 * 年代之间的翻页是“反向传送带”：左半向上、右半向下，整个世界被中线劈开错位。
 */
import React from 'react';
import {Img, staticFile} from 'remotion';
import {BELT, ChProps, EXPO, clamp, popEase, tween} from './ui';
import {KC, Pop, PC} from './kit';
import {World2, World3} from './eras';
import type {SeamStyle} from './SplitScreen';

export const historySeam = (_f: number): SeamStyle => ({line: null, pillBg: '#111111', pillFg: '#F5F4F0'});

/** 每一站“到位”的局部帧；滚到下一站用 18 帧 */
export const STOP_AT = [0, 46, 92, 150];
const ROLL = 18;
export const rollP = (f: number, k: number) => BELT(clamp((f - (STOP_AT[k] - ROLL - 2)) / ROLL));
export const rIndex = (f: number) => [1, 2, 3].reduce((s, k) => s + rollP(f, k), 0);
/** 每个世界自己的动画时间：从它开始滚进来的前几帧起算 */
export const worldG = (f: number, k: number) => (k === 0 ? f + 24 : f - (STOP_AT[k] - ROLL - 6));

const W = 1920;
const H = 1080;
const AXIS = {x: Math.cos(Math.PI / 6), y: -Math.sin(Math.PI / 6)}; // 构成主义的主轴：从左下往右上 30°
const slideAlong = (dist: number, t: number) => `translate(${-AXIS.x * dist * (1 - t)} ${-AXIS.y * dist * (1 - t)})`;

// ═══════════════ 世界 0 · 1927 构成主义 ═══════════════
const FRAMES = [
  {src: 'dunes', dx: -226},
  {src: 'lake', dx: 0},
  {src: 'ocean', dx: 226},
];
const World0: React.FC<{g: number; X: number}> = ({g, X}) => {
  const band = EXPO(clamp(g / 24));
  const bar = EXPO(clamp((g - 4) / 24));
  const year = tween(g, 8, 26, 0, 1, popEase);
  const ring = tween(g, 12, 18, 0, 1, popEase);
  const CX = (X + W) / 2;
  const CY = 560;
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
      <rect x={0} y={0} width={X} height={H} fill={KC.paper} />
      <rect x={X} y={0} width={W - X} height={H} fill={KC.ink} />
      {/* 主轴上的红色斜带和黑条：横跨中线 */}
      <g transform={slideAlong(1500, bar)}>
        <polygon points="-300,833 2200,-610 2200,-550 -300,893" fill={KC.ink} />
      </g>
      <g transform={slideAlong(1700, band)}>
        <polygon points="-300,933 2200,-510 2200,-320 -300,1123" fill={KC.red} />
      </g>
      {/* 圆：比纸更亮的“白圆” */}
      <g transform={`translate(1010 160) scale(${ring})`}>
        <circle r={118} fill={KC.light} stroke={KC.ink} strokeWidth={6} />
        <circle r={78} fill="none" stroke={KC.ink} strokeWidth={4} />
      </g>
      {/* 年份：沿着主轴往上冲 */}
      <g transform={slideAlong(800, year)}>
        <text transform="translate(150 650) rotate(-30)" fontFamily="'Oswald', sans-serif" fontWeight={700} fontSize={410} fill={KC.ink} letterSpacing="-6">
          1927
        </text>
      </g>
      <g transform={slideAlong(800, tween(g, 14, 24, 0, 1, EXPO))}>
        <text transform="translate(236 758) rotate(-30)" fontFamily="'Noto Sans SC', sans-serif" fontWeight={900} fontSize={104} fill={KC.light}>
          三联银幕
        </text>
      </g>
      <g opacity={tween(g, 24, 14)}>
        <text x={96} y={992} fontFamily="'Noto Sans SC', sans-serif" fontWeight={500} fontSize={34} fill={KC.ink}>
          《拿破仑》：三台放映机，三块银幕并排
        </text>
        <text x={96} y={1036} fontFamily="'Oswald', sans-serif" fontWeight={500} fontSize={24} letterSpacing="3" fill={KC.red}>
          ТРИ ЭКРАНА · POLYVISION · 1927
        </text>
      </g>
      {/* 右半：胶片。三个 4:3 的画面依次沿主轴飞进来，拼成 4:1 */}
      <g transform={slideAlong(500, EXPO(clamp((g - 6) / 22)))}>
        <rect x={CX - 360} y={CY - 150} width={720} height={300} fill="#26231F" />
        {Array.from({length: 15}).map((_, i) => (
          <React.Fragment key={i}>
            <rect x={CX - 346 + i * 48} y={CY - 140} width={22} height={16} rx={3} fill={KC.paper} />
            <rect x={CX - 346 + i * 48} y={CY + 124} width={22} height={16} rx={3} fill={KC.paper} />
          </React.Fragment>
        ))}
        <text x={CX - 346} y={CY + 190} fontFamily="'JetBrains Mono', monospace" fontWeight={700} fontSize={22} fill={KC.grey}>
          3 × 4:3 → 4 : 1
        </text>
      </g>
      {FRAMES.map((fr, i) => {
        const t = EXPO(clamp((g - (10 + (i === 1 ? 0 : 5))) / 20));
        return (
          <g key={i} transform={slideAlong(700, t)}>
            <foreignObject x={CX + fr.dx - 107} y={CY - 80} width={214} height={160}>
              <div style={{width: 214, height: 160, overflow: 'hidden', outline: `3px solid ${KC.paper}`}}>
                <Img src={staticFile(`02-masonry/photos/${fr.src}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.25) brightness(0.95)'}} />
              </div>
            </foreignObject>
          </g>
        );
      })}
    </svg>
  );
};

// ═══════════════ 世界 1 · 1959 波普 ═══════════════
const Face: React.FC<{hair: string; skin: string; lips?: boolean; flip?: boolean}> = ({hair, skin, lips, flip}) => (
  <g transform={flip ? 'scale(-1 1)' : undefined}>
    <path d="M-150 260 C-150 150 -80 120 0 120 C80 120 150 150 150 260Z" fill={PC.white} stroke={PC.ink} strokeWidth={7} />
    <rect x={-26} y={70} width={52} height={70} fill={skin} stroke={PC.ink} strokeWidth={7} />
    <path d="M-72 -20 C-72 -110 72 -110 72 -20 C72 50 40 96 0 96 C-40 96 -72 50 -72 -20Z" fill={skin} stroke={PC.ink} strokeWidth={7} />
    <path d="M-72 -20 C-72 -110 72 -110 72 -20 C72 50 40 96 0 96 C-40 96 -72 50 -72 -20Z" fill="url(#skin)" opacity={0.7} />
    <path d="M-84 -10 C-100 -130 90 -150 84 -10 C70 -60 40 -80 -10 -78 C-50 -76 -76 -50 -84 -10Z" fill={hair} stroke={PC.ink} strokeWidth={7} />
    <path d="M-46 -26 Q-30 -40 -12 -28M14 -28 Q30 -40 46 -26" stroke={PC.ink} strokeWidth={7} fill="none" strokeLinecap="round" />
    <circle cx={-28} cy={-14} r={8} fill={PC.ink} />
    <circle cx={30} cy={-14} r={8} fill={PC.ink} />
    {lips ? <path d="M-22 44 Q0 30 22 44 Q0 66 -22 44Z" fill={PC.red} stroke={PC.ink} strokeWidth={5} /> : <path d="M-18 46 Q0 58 18 46" stroke={PC.ink} strokeWidth={6} fill="none" strokeLinecap="round" />}
    <g transform="translate(70 24) rotate(-12)">
      <rect x={-14} y={-52} width={28} height={104} rx={14} fill={PC.ink} />
      <rect x={-6} y={-40} width={12} height={80} rx={6} fill="#555" />
    </g>
  </g>
);
const World1: React.FC<{g: number; X: number}> = ({g, X}) => {
  const CX = (X + W) / 2;
  const cord = tween(g, 26, 22, 0, 1, EXPO);
  const len = 900;
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
      <Pop.Patterns f={g} />
      <rect width={W} height={H} fill={PC.paper} />
      <rect width={W} height={H} fill="url(#dotPaper)" />
      {/* 左半：年份 + 标题 + 旁白框 */}
      <Pop.Slap f={g} t0={4} x={96} y={470} rot={-5}>
        <Pop.Txt x={0} y={0} size={400} font="display" c={PC.red} stroke={16} sh={22} ls={0.01}>{'1959'}</Pop.Txt>
      </Pop.Slap>
      <Pop.Box x={96} y={560} w={560} h={130} fill={PC.yellow} k={Pop.popS(g, 14)} rot={-3} sh={12}>
        <Pop.Txt x={280} y={90} size={90} font="cn" anchor="middle">{'电话分屏'}</Pop.Txt>
      </Pop.Box>
      <Pop.Box x={110} y={770} w={880} h={150} fill={PC.white} k={Pop.popS(g, 22)} rot={1.5} sh={10}>
        <Pop.Txt x={36} y={62} size={40} font="cn" w={700}>{'《枕边细语》：一通电话，'}</Pop.Txt>
        <Pop.Txt x={36} y={116} size={40} font="cn" w={700}>{'把两个人放在左右两半'}</Pop.Txt>
      </Pop.Box>
      {/* 右半：两格漫画，一条电话线穿过格间的白缝 */}
      <Pop.Slap f={g} t0={10} x={CX - 316} y={300} rot={-2}>
        <rect x={10} y={10} width={300} height={500} fill={PC.ink} />
        <rect width={300} height={500} fill={PC.blue} stroke={PC.ink} strokeWidth={8} />
        <rect width={300} height={500} fill="url(#skinBlue)" opacity={0.18} />
        <g transform="translate(150 262) scale(0.9)"><Face hair={PC.yellow} skin={PC.pink} lips /></g>
      </Pop.Slap>
      <Pop.Slap f={g} t0={16} x={CX + 20} y={290} rot={2}>
        <rect x={10} y={10} width={300} height={500} fill={PC.ink} />
        <rect width={300} height={500} fill={PC.cyan} stroke={PC.ink} strokeWidth={8} />
        <rect width={300} height={500} fill="url(#dotCyan)" opacity={0.5} />
        <g transform="translate(150 262) scale(0.9)"><Face hair={PC.ink} skin={PC.pink} flip /></g>
      </Pop.Slap>
      {/* 电话铃声：拟声字把左半的空白填满 */}
      {Pop.popS(g, 18) > 0.001 && (
        <g transform={`translate(${1040 + Pop.shake(g, 18, 10, 'ring')[0]} ${250 + Pop.shake(g, 18, 10, 'ring')[1]}) scale(${Pop.popS(g, 18)})`}>
          <Pop.Blk d={Pop.burstD(200, 130, 11, 0.2, 'ring')} fill={PC.yellow} sw={8} sh={14} />
          <Pop.Bang x={0} y={0} size={128} k={1} rot={-8}>RING!</Pop.Bang>
        </g>
      )}
      <path
        d={`M${CX - 138} 590 C${CX - 138} 740 ${CX - 50} 770 ${CX} 730 S${CX + 120} 690 ${CX + 138} 590`}
        fill="none"
        stroke={PC.ink}
        strokeWidth={16}
        strokeLinecap="round"
        strokeDasharray={`${len} ${len}`}
        strokeDashoffset={len * (1 - cord)}
      />
      <Pop.Bubble x={CX - 150} y={240} w={190} h={96} tx={40} ty={80} k={Pop.popS(g, 30)} rot={-4}>
        <Pop.Txt x={0} y={20} size={50} font="cn" anchor="middle">{'喂？'}</Pop.Txt>
      </Pop.Bubble>
      <Pop.Bubble x={CX + 190} y={240} w={190} h={96} tx={-40} ty={80} k={Pop.popS(g, 38)} rot={4}>
        <Pop.Txt x={0} y={20} size={50} font="cn" anchor="middle">{'喂！'}</Pop.Txt>
      </Pop.Bubble>
      <Pop.Box x={CX - 170} y={880} w={380} h={62} fill={PC.yellow} k={Pop.popS(g, 44)} rot={-1.5} sh={8}>
        <Pop.Txt x={190} y={44} size={30} font="cn" anchor="middle">{'1 通电话 = 2 个画面'}</Pop.Txt>
      </Pop.Box>
    </svg>
  );
};

const WORLDS: React.FC<{g: number; X: number}>[] = [World0, World1, World2, World3];

export const History: React.FC<ChProps> = (p) => {
  const {f, side, X} = p;
  const r = rIndex(f);
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: '#111'}}>
      {WORLDS.map((Wd, k) => {
        // 左半向上、右半向下：下一站从反方向进来
        const off = (side === 'L' ? k - r : r - k) * H;
        if (Math.abs(r - k) > 1.02) return null;
        return (
          <div key={k} style={{position: 'absolute', inset: 0, transform: `translateY(${off}px)`}}>
            <Wd g={worldG(f, k)} X={X} />
          </div>
        );
      })}
    </div>
  );
};
