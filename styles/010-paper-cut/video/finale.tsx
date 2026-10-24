/**
 * 010 · 片尾：对标 008 Risograph `End` 骨架，剪纸语言。
 * 窗花落回（Swiss 红方块回位）+ 门笺纸层同时落下（008 商店海报）→
 * 中英镂空字 → 一句带走的话 → 底栏三件套。
 * 禁止空墙收束，禁止盖章替代信息幕，禁止圆角字幕卡。
 */
import React from 'react';
import {POP, SMOOTH, spr} from '../../../src/lib/anim';
import {C} from '../tokens';
import {AT} from './timeline';
import {W, n1} from './layers';
import {FolkFlower} from './opening';
import {Txt} from './ui';

const EN: {ch: string; x: number}[] = [
  {ch: 'P', x: 668},
  {ch: 'A', x: 746},
  {ch: 'P', x: 824},
  {ch: 'E', x: 898},
  {ch: 'R', x: 974},
  {ch: 'C', x: 1108},
  {ch: 'U', x: 1186},
  {ch: 'T', x: 1260},
];

const sheetD = (x: number, y: number, w: number, h: number, seed: number) => {
  const top = 26;
  const n = 18;
  const step = w / n;
  let d = `M${n1(x)} ${n1(y + top)}`;
  for (let i = 0; i < n; i++) {
    const x1 = x + (i + 1) * step;
    const mid = x + i * step + step / 2;
    const dip = 10 + ((i + seed) % 3) * 3;
    d += ` Q${n1(mid)} ${n1(y - dip)} ${n1(x1)} ${n1(y + top)}`;
  }
  for (let i = 0; i <= 10; i++) {
    const yy = y + top + ((h - top - 20) * i) / 10;
    const jag = 8 * Math.sin(i * 1.7 + seed);
    d += ` L${n1(x + w + jag)} ${n1(yy)}`;
  }
  d += ` L${n1(x + w * 0.72)} ${n1(y + h + 18)} L${n1(x + w * 0.5)} ${n1(y + h - 8)} L${n1(x + w * 0.28)} ${n1(y + h + 18)}`;
  for (let i = 10; i >= 0; i--) {
    const yy = y + top + ((h - top - 20) * i) / 10;
    const jag = 8 * Math.sin(i * 1.4 + seed + 2);
    d += ` L${n1(x - jag)} ${n1(yy)}`;
  }
  return `${d} Z`;
};

const coinD = (r: number) => {
  const s = r * 0.34;
  return `M${n1(-r)} 0 a${n1(r)} ${n1(r)} 0 1 0 ${n1(2 * r)} 0 a${n1(r)} ${n1(r)} 0 1 0 ${n1(-2 * r)} 0 Z M${n1(-s)} ${n1(-s)} H${n1(s)} V${n1(s)} H${n1(-s)} Z`;
};

const LACE = Array.from({length: 15}, (_, i) => ({
  x: 318 + i * 92,
  y: 378,
  r: i % 3 === 1 ? 16 : 12,
}));

const SIDE: {x: number; y: number; r: number}[] = [
  {x: 278, y: 500, r: 18},
  {x: 278, y: 620, r: 14},
  {x: 278, y: 740, r: 18},
  {x: 1642, y: 500, r: 18},
  {x: 1642, y: 620, r: 14},
  {x: 1642, y: 740, r: 18},
];

export const Take: React.FC<{f: number}> = ({f}) => {
  const t0 = AT.take;
  const t = f - t0;
  const land = spr(f, t0 - 16, SMOOTH, 40);
  const rise = (1 - land) * 78;
  const yFlower = 168 + (1 - land) * 28;
  const scale = 0.36 + 0.14 * land;
  const spin = 4 + t * 0.05;
  const sway = Math.sin(t * 0.04) * 2.2;
  const en0 = t0 + 8;
  const zh = spr(f, t0 + 36, POP, 28);
  const line = spr(f, t0 + 54, POP, 28);
  const foot = spr(f, t0 + 70, POP, 28);
  if (land < 0.02) {
    return <rect width={W} height={1080} fill={C.wall} />;
  }
  const sx = 240;
  const sy = 348;
  const sw = 1440;
  const sh = 620;
  return (
    <g>
      <rect width={W} height={1080} fill={C.wall} />
      <g transform={`translate(0 ${n1(rise)})`} opacity={Math.min(1, land * 1.6)}>
        <rect x={956} y={0} width={8} height={n1(Math.max(16, yFlower - 206 * scale))} rx={3} fill={C.folk} />
        <circle cx={960} cy={16} r={9} fill={C.folk} />
        <g transform={`translate(960 ${n1(yFlower + sway)})`}>
          <FolkFlower f={f} scale={scale} spin={spin} punchAt={1} compact={1} />
        </g>
        <path d={sheetD(sx + 28, sy + 24, sw, sh, 2)} fill={C.cream} filter="url(#shNear)" />
        <path d={sheetD(sx + 14, sy + 12, sw, sh, 1)} fill={C.paper} filter="url(#shMid)" />
        <path d={sheetD(sx, sy, sw, sh, 0)} fill={C.folk} filter="url(#shLift)" />
        {LACE.map((h) => (
          <path key={`lace${h.x}`} d={coinD(h.r)} fill={C.wall} fillRule="evenodd" transform={`translate(${n1(h.x)} ${n1(h.y)})`} />
        ))}
        {SIDE.map((h) => (
          <path key={`side${h.x}${h.y}`} d={coinD(h.r)} fill={C.wall} fillRule="evenodd" transform={`translate(${n1(h.x)} ${n1(h.y)})`} />
        ))}
        {EN.map((g, i) => {
          const k = spr(f, en0 + i * 3, POP, 28);
          if (k < 0.02) return null;
          return (
            <text
              key={`${g.ch}${i}`}
              x={g.x}
              y={n1(548 + (1 - k) * 20)}
              fontFamily="Jost"
              fontSize={92}
              fontWeight={800}
              textAnchor="middle"
              fill={C.wall}
              opacity={Math.min(1, k)}
            >
              {g.ch}
            </text>
          );
        })}
        {zh > 0.02 && (
          <text
            x={960}
            y={n1(642 + (1 - zh) * 12)}
            fontFamily="Noto Sans SC"
            fontSize={40}
            fontWeight={900}
            textAnchor="middle"
            fill={C.wall}
            opacity={Math.min(1, zh)}
          >
            剪纸层叠
          </text>
        )}
        {line > 0.02 && (
          <g opacity={Math.min(1, line)} transform={`translate(0 ${n1((1 - line) * 12)})`}>
            <Txt x={960} y={734} size={34} font="cn" w={700} c={C.paper} anchor="middle">
              一层一色，影子落在下一张上。
            </Txt>
          </g>
        )}
        {foot > 0.02 && (
          <g opacity={Math.min(1, foot)} transform={`translate(0 ${n1((1 - foot) * 10)})`}>
            <rect x={320} y={868} width={1280} height={3} fill={C.wall} />
            <Txt x={340} y={922} size={22} font="mono" w={700} c={C.paper} ls={1.2}>
              DESIGN STYLE  010
            </Txt>
            <Txt x={960} y={922} size={22} font="mono" w={700} c={C.paper} anchor="middle" ls={1.1}>
              @guanmo_ai
            </Txt>
            <Txt x={1580} y={922} size={18} font="mono" w={500} c={C.paper} anchor="end" ls={0.5}>
              github.com/guanmo-ai/design-style
            </Txt>
          </g>
        )}
      </g>
    </g>
  );
};
