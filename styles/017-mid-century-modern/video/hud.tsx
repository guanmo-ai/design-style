/**
 * 外框：左上章节标题（编号 · 领域 / 作者 · 作品 · 年份 / 这一章教什么），左下 h 读数（一块小纸 + 它的影子，数字实时变），
 * 右上期号。黑场缩回钟心时，黑边扫过外框，字也跟着黑白反转（和纸条同一个遮罩）。
 */
import React from 'react';
import {C, FONT, PAPER} from '../tokens';
import {ease, prog} from './motion';
import {discScreenTf, focusAt} from './opening';
import {GEO} from './geo';
import {AT, W} from './timeline';

type Credit = {n: string; field: string; who: string; work: string; year: string; trick: string; at: number; to: number};
const CREDITS: Credit[] = [
  {n: '00', field: '片头', who: 'Saul Bass', work: '《金臂人》片头', year: '1955', trick: '白纸条一根根扎进黑场', at: -30, to: 104},
  {n: '01', field: '产品', who: 'George Nelson', work: '球钟', year: '1949', trick: '12 根辐条、12 颗球，一颗颗放上去', at: 140, to: 296},
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

const Frame: React.FC<{t: number; ink: string; soft: string}> = ({t, ink, soft}) => {
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
          <Line x={72} y={88} size={20} t={t} at={c.at} to={c.to} color={C.red} family={FONT.sans} weight={700} ls={3}>{`${c.n} · ${c.field}`}</Line>
          <Line x={72} y={130} size={32} t={t} at={c.at + 3} to={c.to} color={ink}>{`${c.who} ${c.work} · ${c.year}`}</Line>
          <Line x={72} y={166} size={20} t={t} at={c.at + 6} to={c.to} color={soft} weight={500}>{c.trick}</Line>
        </g>
      ))}
      <text x={W - 72} y={88} textAnchor="end" fontFamily={FONT.sans} fontWeight={700} fontSize={18} letterSpacing={4} fill={ink}>MID-CENTURY MODERN · 017</text>

      {/* 左下：影子 = 高度（读数） */}
      <g opacity={t > AT.tease + 30 ? 1 - prog(t, AT.tease + 30, 15) : 1}>
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

export const Hud: React.FC<{t: number}> = ({t}) => {
  // 黑场盖住的地方用白字，其余用墨字；黑场缩回时，黑边扫过外框
  const dark = t < 126;
  if (!dark) return <Frame t={t} ink={C.ink} soft={C.mute} />;
  return (
    <>
      <defs>
        <clipPath id="hud-in">
          <path d={GEO.disc} transform={discScreenTf(t)} />
        </clipPath>
      </defs>
      <g clipPath="url(#hud-in)"><Frame t={t} ink={C.paper} soft="#B9AE9E" /></g>
      <g>
        <mask id="hud-out" maskUnits="userSpaceOnUse" x={-3000} y={-3000} width={9000} height={9000}>
          <rect x={-3000} y={-3000} width={9000} height={9000} fill="#fff" />
          <path d={GEO.disc} transform={discScreenTf(t)} fill="#000" />
        </mask>
        <g mask="url(#hud-out)"><Frame t={t} ink={C.ink} soft={C.mute} /></g>
      </g>
    </>
  );
};
