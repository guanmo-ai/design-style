/** 005 · Pop Art —— 开场（网点长出来 → 爆炸框“砰”）与 01 拼贴；片尾复用同一个爆炸框 */
import React from 'react';
import {E, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {AT} from './timeline';
import {Bang, beatPulse, Blk, Box, BurstIris, burstD, c01, Caption, circ, Dots, DotWipe, lerp, n1, P, popS, rect, shake, Slap, Speed, tw, Txt} from './ui';

export const HX = 960;
export const HY = 460;

/** 主视觉：黄底 + 红网点（从中间往外变小）+ 集中线 + 爆炸框 + POP!；t = 网点开始长的帧 */
export const Hero: React.FC<{f: number; t: number; grown?: boolean}> = ({f, t, grown}) => {
  const front = grown ? 1e4 : lerp(-300, 2300, tween(f, t + 2, 40, 0, 1, E.inOut));
  const kB = popS(f, t + 58, 30);
  const kT = popS(f, t + 61, 30);
  const pulse = beatPulse(f, t + 90, 0.035);
  const [sx, sy] = shake(f, t + 60, 14, `h${t}`);
  return (
    <g>
      <rect width={1920} height={1080} fill={C.yellow} />
      <Dots w={1920} h={1080} pitch={32} c={C.red} r={(x, y) => c01((front - x) / 260) * Math.max(0, 13 - 0.0098 * Math.hypot(x - HX, y - HY))} />
      <Speed cx={HX} cy={HY} r0={330} r1={1500} n={46} w={10} p={grown ? 1 : tween(f, t + 38, 20, 0, 1, E.out)} seed="hero" />
      {kB > 0.001 && (
        <g transform={`translate(${n1(HX + sx)} ${n1(HY + sy)}) scale(${(kB * pulse).toFixed(4)})`}>
          <Blk d={burstD(400, 240, 13, 0.1, 'heroA')} fill={C.white} sw={8} sh={18} />
          <path d={burstD(280, 175, 13, 0.34, 'heroB')} fill={C.yellow} />
          <Bang x={0} y={0} size={270} k={kT} rot={-8}>POP!</Bang>
        </g>
      )}
    </g>
  );
};

export const Opening: React.FC<P> = ({f}) => {
  const k = popS(f, 78);
  const cn = '波普艺术 · 1956—1970 · 伦敦 → 纽约';
  const wcn = tw(cn, 44) + 56;
  const wen = 210;
  const x0 = 960 - (wcn + wen) / 2;
  return (
    <g>
      <Hero f={f} t={0} />
      {k > 0.001 && (
        <g transform={`translate(960 900) rotate(-2) scale(${k.toFixed(3)}) translate(-960 -900)`}>
          <Box x={x0} y={858} w={wen + wcn} h={92} fill={C.white} />
          <rect x={x0} y={858} width={wen} height={92} fill={C.red} stroke={C.ink} strokeWidth={5} />
          <Txt x={x0 + wen / 2} y={927} size={66} font="display" anchor="middle" c={C.white} stroke={2.5} ls={0.04}>POP ART</Txt>
          <Txt x={x0 + wen + 28} y={920} size={44}>{cn}</Txt>
        </g>
      )}
      <BurstIris f={f} t={AT.collage} c={C.paper} cx={HX} cy={HY} r0={400} dur={16} />
    </g>
  );
};

/* ─────────── 01 拼贴：汉密尔顿 1956 ─────────── */
/** 剪下来的一块纸：白边 + 硬投影（拼贴画里每一样东西都是从杂志上剪的） */
const Cut: React.FC<{d: string; fill: string; pat?: string; po?: number}> = ({d, fill, pat, po}) => (
  <g strokeLinejoin="round">
    <path d={d} fill={C.ink} stroke={C.ink} strokeWidth={22} transform="translate(10 10)" />
    <path d={d} fill={C.white} stroke={C.ink} strokeWidth={22} />
    <path d={d} fill={C.white} stroke={C.white} strokeWidth={14} />
    <path d={d} fill={fill} />
    {pat && <path d={d} fill={`url(#${pat})`} opacity={po} />}
  </g>
);

export const Collage: React.FC<P> = ({f}) => {
  const T = AT.collage;
  // 棒棒糖：从右边滑进来，落定在拍点上（180），然后晃两下
  const lp = tween(f, T + 46, 14, 0, 1, E.out);
  const wob = f > T + 60 ? 9 * Math.exp(-(f - T - 60) / 10) * Math.sin((f - T - 60) * 0.45) : 0;
  return (
    <g>
      <rect width={1920} height={1080} fill={C.paper} />
      <rect width={1920} height={1080} fill="url(#dotPaper)" />
      {/* 房间：墙 + 地板（两块大纸） */}
      <Slap f={f} t0={T + 2} x={1295} y={420} rot={-1.5}>
        <Cut d={rect(1060, 600)} fill={C.blue} pat="dotBlue" />
      </Slap>
      <Slap f={f} t0={T + 6} x={1295} y={830} rot={1}>
        <Cut d={rect(1090, 250)} fill={C.red} pat="dotRed" />
      </Slap>
      {/* 墙上挂的漫画 */}
      <Slap f={f} t0={T + 12} x={1000} y={330} rot={-5}>
        <Cut d={rect(300, 230)} fill={C.yellow} pat="dotYellow" />
        <path d={burstD(70, 44, 10, 0.2, 'wall')} fill={C.white} stroke={C.ink} strokeWidth={4} transform="translate(-62 26)" />
        <Txt x={-62} y={42} size={44} font="display" anchor="middle" c={C.red} stroke={2}>WOW</Txt>
        <path d={`${rect(140, 66, 22)}`} transform="translate(64 -54)" fill={C.white} stroke={C.ink} strokeWidth={4} />
        <Txt x={64} y={-42} size={32} anchor="middle">哇！</Txt>
      </Slap>
      {/* 电视机 */}
      <Slap f={f} t0={T + 20} x={1035} y={760} rot={3}>
        <path d="M-60 -150L-10 -112M70 -160L20 -112" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
        <Cut d={rect(330, 240, 26)} fill={C.magenta} />
        <rect x={-140} y={-96} width={210} height={170} rx={30} fill={C.cyan} stroke={C.ink} strokeWidth={5} />
        <Dots x={-140} y={-96} w={210} h={170} pitch={14} c={C.blue} r={(x, y) => Math.max(0, 5.2 - 0.05 * Math.hypot(x + 35, y + 10))} />
        <path d={circ(38, -35, -10)} fill={C.pink} stroke={C.ink} strokeWidth={4} />
        <circle cx={118} cy={-50} r={16} fill={C.yellow} stroke={C.ink} strokeWidth={4} />
        <circle cx={118} cy={4} r={16} fill={C.yellow} stroke={C.ink} strokeWidth={4} />
      </Slap>
      {/* 沙发 */}
      <Slap f={f} t0={T + 28} x={1620} y={800} rot={-2}>
        <Cut d="M-200 -10V-120Q-200 -150 -170 -150H170Q200 -150 200 -120V-10H220Q240 -10 240 10V80H-240V10Q-240 -10 -220 -10Z" fill={C.yellow} pat="dotYellow" />
        <path d={rect(170, 112, 22)} transform="translate(-88 -78)" fill={C.white} stroke={C.ink} strokeWidth={5} />
        <path d={rect(170, 112, 22)} transform="translate(88 -78)" fill={C.white} stroke={C.ink} strokeWidth={5} />
        <path d="M-196 -6H196V36H-196Z" fill={C.white} stroke={C.ink} strokeWidth={5} />
        <path d="M-200 80V116M200 80V116" stroke={C.ink} strokeWidth={14} strokeLinecap="round" />
      </Slap>
      {/* 一罐火腿 */}
      <Slap f={f} t0={T + 36} x={1330} y={812} rot={6}>
        <Cut d={rect(150, 104, 16)} fill={C.cyan} />
        <rect x={-75} y={-18} width={150} height={40} fill={C.white} stroke={C.ink} strokeWidth={4} />
        <Txt x={0} y={13} size={30} anchor="middle" c={C.red}>火腿</Txt>
      </Slap>
      {/* 巨大的棒棒糖：上面写着 POP */}
      {f >= T + 46 && (
        <g transform={`translate(${n1(lerp(2350, 1450, lp))} 330) rotate(${n1(-16 + 40 * (1 - lp) + wob)})`}>
          <path d="M0 0L60 470" stroke={C.ink} strokeWidth={36} strokeLinecap="round" transform="translate(10 10)" />
          <path d="M0 0L60 470" stroke={C.ink} strokeWidth={36} strokeLinecap="round" />
          <path d="M0 0L60 470" stroke={C.white} strokeWidth={24} strokeLinecap="round" />
          <Cut d={circ(160)} fill={C.red} />
          <path d={circ(122)} fill="none" stroke={C.white} strokeWidth={6} strokeDasharray="22 16" />
          <Txt x={0} y={52} size={150} font="display" anchor="middle" c={C.white} stroke={4} ls={0.02}>POP</Txt>
        </g>
      )}
      {/* 杂志上剪下来的标题 */}
      <Slap f={f} t0={T + 66} x={1295} y={952} rot={-1.5}>
        <Cut d={rect(760, 64)} fill={C.white} />
        <Txt x={0} y={12} size={32} anchor="middle">是什么让今天的家如此不同、如此吸引人？</Txt>
      </Slap>
      <Caption f={f} t={T} n={1} title="拼贴" year="1956" name="理查德·汉密尔顿 · 拼贴画" sub="展览「这就是明天」· 伦敦" />
      <DotWipe f={f} t={AT.soup} c={C.blue} dir="right" />
    </g>
  );
};
