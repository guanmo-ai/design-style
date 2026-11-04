/**
 * 外框：左上章节标题（编号 · 领域 / 作者 · 作品 · 年份 / 这一章教什么），左下 h 读数（一块小纸 + 它的影子，数字实时变），
 * 右上期号。红场缩回钟心时，红边扫过外框，字也跟着反转（和纸条同一个遮罩）。
 */
import React from 'react';
import {C, FONT, PAPER} from '../tokens';
import {ease, prog} from './motion';
import {focusAt, sheetEdge} from './film';
import {GEO} from './geo';
import {AT, H, W} from './timeline';

type Credit = {n: string; field: string; who: string; work: string; year: string; trick: string; at: number; to: number};
const CREDITS: Credit[] = [
  {n: '01', field: '片头', who: 'Saul Bass', work: '《金臂人》片头', year: '1955', trick: '纸条拼成一条折线手臂', at: AT.bass + 4, to: AT.sheet2 + 6},
  {n: '02', field: '家具', who: 'Charles & Ray Eames', work: 'Hang-It-All 挂衣架', year: '1953', trick: '钢丝折线 + 14 颗彩球', at: AT.eames + 4, to: AT.sheet3 + 6},
  {n: '03', field: '唱片', who: 'Reid Miles', work: 'Blue Note 封套', year: '1956—', trick: '大字出血，两层油墨叠印', at: AT.record + 4, to: AT.sheet4 + 6},
  {n: '04', field: '建筑', who: 'Pierre Koenig', work: 'Case Study House #22', year: '1960', trick: '玻璃盒子悬在崖边：越近的纸层走得越快', at: AT.house + 4, to: AT.sheet5 + 6},
  {n: '05', field: '今天', who: '爵士电台', work: 'App', year: '2026', trick: '按钮 = 一张纸：按下去，影子收紧', at: AT.app + 4, to: AT.sheet6 + 6},
];

/** 一行字从遮罩里升起、再沉下去 */
const Line: React.FC<{x: number; y: number; size: number; t: number; at: number; to: number; children: React.ReactNode; color: string; family?: string; weight?: number; ls?: number}> = ({
  x, y, size, t, at, to, children, color, family = FONT.sc, weight = 700, ls = 0,
}) => {
  if (t < at || t > to + 14) return null;
  const up = ease.out(prog(t, at, 16));
  const down = ease.in(prog(t, to, 14));
  const off = (1 - up) * size * 1.3 - down * size * 1.3;
  return (
    <svg x={x} y={y - size * 1.1} width={1200} height={size * 1.45} overflow="hidden">
      <text x={0} y={size * 1.1 + off} fontFamily={family} fontWeight={weight} fontSize={size} fill={color} letterSpacing={ls}>
        {children}
      </text>
    </svg>
  );
};

const Frame: React.FC<{t: number; ink: string; soft: string; accent: string}> = ({t, ink, soft, accent}) => {
  const f = focusAt(t);
  const h = Math.max(0, f.p?.h ?? 4);
  const sq = 30;
  const gx = 72;
  const gy = 1010;
  const lift = h * 0.55;
  return (
    <g>
      {CREDITS.map((c, i) => (
        <g key={i}>
          <Line x={72} y={88} size={20} t={t} at={c.at} to={c.to} color={accent} family={FONT.sans} weight={700} ls={3}>{`${c.n} · ${c.field}`}</Line>
          <Line x={72} y={130} size={32} t={t} at={c.at + 3} to={c.to} color={ink}>{`${c.who} ${c.work} · ${c.year}`}</Line>
          <Line x={72} y={166} size={20} t={t} at={c.at + 6} to={c.to} color={soft} weight={500}>{c.trick}</Line>
        </g>
      ))}
      {t >= AT.sheet1 && t < AT.out + 30 && <text x={W - 72} y={88} textAnchor="end" fontFamily={FONT.sans} fontWeight={700} fontSize={18} letterSpacing={4} fill={ink}>MID-CENTURY MODERN · 017</text>}

      {/* 左下：影子 = 高度（读数） */}
      <g>
        {/* 俯视的一小块纸：影子跟着同一个公式走（按 0.55 缩小） */}
        <g opacity={PAPER.opacity(h)} filter={`url(#pb${Math.min(60, Math.round(h * 0.55))})`}>
          <rect x={gx + 0.5 * lift} y={gy - sq + lift} width={sq} height={sq} fill={C.shadow} />
        </g>
        <rect x={gx} y={gy - sq} width={sq} height={sq} fill={f.fill} transform={`translate(${gx + sq / 2} ${gy - sq / 2}) scale(${1 + PAPER.persp * h}) translate(${-gx - sq / 2} ${-gy + sq / 2})`} />
        <text x={gx + 64} y={gy - 4} fontFamily={FONT.sans} fontWeight={600} fontSize={30} fill={ink}>{`h = ${h.toFixed(0)}`}</text>
        <text x={gx + 184} y={gy - 6} fontFamily={FONT.sc} fontWeight={500} fontSize={18} fill={soft}>{`影子 (${(0.5 * h).toFixed(1)}, ${h.toFixed(0)}) · 模糊 ${(0.4 * h).toFixed(1)}`}</text>
      </g>
    </g>
  );
};

const LIGHT = {ink: C.ink, soft: C.mute, accent: C.red};
const DARK = {ink: C.paper, soft: '#E6EEFF', accent: C.sun};
const tone = (bg: string) => (bg === C.paper ? LIGHT : DARK);

/** 换章时，新纸扫过外框：纸盖住的地方按新纸的颜色写字，其余按旧纸 */
export const Hud: React.FC<{t: number}> = ({t}) => {
  const s = sheetEdge(t);
  const right = tone(s.bg);
  const left = tone(s.under);
  if (s.done || right === left) return <Frame t={t} {...right} />;
  return (
    <>
      <defs>
        <clipPath id="hud-sheet"><path d={GEO.sheet} transform={s.tf} /></clipPath>
        <mask id="hud-rest" maskUnits="userSpaceOnUse" x={-10} y={-10} width={W + 20} height={H + 20}>
          <rect x={-10} y={-10} width={W + 20} height={H + 20} fill="#fff" />
          <path d={GEO.sheet} transform={s.tf} fill="#000" />
        </mask>
      </defs>
      <g mask="url(#hud-rest)"><Frame t={t} {...left} /></g>
      <g clipPath="url(#hud-sheet)"><Frame t={t} {...right} /></g>
    </>
  );
};
