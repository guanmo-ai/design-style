/**
 * 外框：左上章节标题（编号 · 领域 / 作者 · 作品 · 年份 / 这一章教什么），左下 h 读数（一块小纸 + 它的影子，数字实时变），
 * 右上期号。红场缩回钟心时，红边扫过外框，字也跟着反转（和纸条同一个遮罩）。
 */
import React from 'react';
import {C, FONT, PAPER} from '../tokens';
import {ease, prog} from './motion';
import {focusAt, sheetEdge} from './film';
import {AT, H, W} from './timeline';

type Credit = {n: string; field: string; who: string; work: string; year: string; trick: string; at: number; to: number};
const CREDITS: Credit[] = [
  {n: '01', field: '片头', who: 'Saul Bass', work: '《金臂人》片头', year: '1955', trick: '纸条拼成一条折线手臂', at: AT.bass + 4, to: AT.sheet2 + 6},
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
      {t >= AT.sheet1 && <text x={W - 72} y={88} textAnchor="end" fontFamily={FONT.sans} fontWeight={700} fontSize={18} letterSpacing={4} fill={ink}>MID-CENTURY MODERN · 017</text>}

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

/** 换章时，新纸的边缘扫过外框：边缘右边按新纸的颜色写字，左边按旧纸 */
export const Hud: React.FC<{t: number}> = ({t}) => {
  const s = sheetEdge(t);
  const right = tone(s.bg);
  const left = tone(s.under);
  if (s.x <= 0 || right === left) return <Frame t={t} {...right} />;
  return (
    <>
      <defs>
        <clipPath id="hud-l"><rect x={-10} y={-10} width={Math.max(0, s.x + 10)} height={H + 20} /></clipPath>
        <clipPath id="hud-r"><rect x={s.x} y={-10} width={W + 20} height={H + 20} /></clipPath>
      </defs>
      <g clipPath="url(#hud-l)"><Frame t={t} {...left} /></g>
      <g clipPath="url(#hud-r)"><Frame t={t} {...right} /></g>
    </>
  );
};
