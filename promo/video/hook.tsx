/** 开场（第 0 帧）+ 固定外框 */
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {CX, CY, FONT, G, R, Svg, TL, ei, hash, seg, slap} from './kit';

export const BRAND = {bg: '#f7f4ed', ink: '#352f2a', muted: '#786f65', accent: '#a34332', mark: '#ad4935', line: '#ded8cc', paper: '#fffdf8', seal: '#C8372D'};

export const Cursor: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s * 1.5})`}>
    <path d="M0 0 L0 23 L6.2 17.4 L10.4 27 L14.2 25.3 L10.1 15.9 L18 15.4 Z" fill="#111" stroke="#fff" strokeWidth={2.2} strokeLinejoin="round" />
  </g>
);

/**
 * 开场：第 0 帧就是全片最强的一张图——同一个圆被切成 21 片，每片是一种风格（背景也跟着切）。
 * 图是墙上那 21 张定格的原尺寸版，圆心和半径都一样，所以拼起来还是一个正圆。
 * 轮盘：砸下来时被打得飞转，慢慢停住；最后一拍越转越快，在拍点上切进包豪斯。
 */
const IDS = [...TL.scenes.map((s) => s.id), 'bento', 'masonry'];
const N = IDS.length, WD = 360 / N;
export const Hook: React.FC<{t: number}> = ({t}) => {
  const K = TL.hook;
  const w = Math.max(0, t - K.windup);
  const theta = -34 + 15 * 11 * (1 - Math.exp(-t / 11)) + 0.32 * t + (0.022 * Math.pow(w, 3.2)) / 3.2; // 度
  const s = slap(t, 0.36, 10) * (1 + 0.12 * ei(seg(t, K.windup, 96 - K.windup), 2.4)); // 最后一拍往里吸
  const pt = (deg: number, r: number) => [CX + Math.cos((deg * Math.PI) / 180) * r, CY + Math.sin((deg * Math.PI) / 180) * r];
  const out = (a: number) => 1 - ei(seg(t, a, 8), 2);
  const blk = (x: number, y: number, bw: number, bh: number, at: number, tilt: number, exit: number, child: React.ReactNode) => {
    if (t < at) return null;
    return (
      <G x={x} y={y} s={slap(t - at, 0.45, 6) * out(exit)} r={tilt}>
        <rect x={x - bw / 2} y={y - bh / 2} width={bw} height={bh} rx={16} fill="#141312" stroke="#F4F2EC" strokeWidth={5} />
        {child}
      </G>
    );
  };
  const zh = {fontFamily: FONT.sc, fontWeight: 900, fill: '#F4F2EC'} as const;
  const n2 = '×21'.slice(0, Math.max(0, Math.floor((t - K.line2) / 3) + 1));
  const n3 = '种样子'.slice(0, Math.max(0, Math.floor((t - K.line2 - 9) / 3) + 1));
  return (
    <AbsoluteFill style={{background: '#141312'}}>
      <AbsoluteFill style={{transform: `scale(${s})`, transformOrigin: `${CX}px ${CY}px`}}>
        {IDS.map((id, i) => {
          const a0 = theta + i * WD - 90, a1 = a0 + WD + 0.12;
          const p = [pt(a0, 1400), pt((a0 + a1) / 2, 1420), pt(a1, 1400)];
          return (
            <Img key={id} src={staticFile(`promo/tiles/full/${id}.jpg`)} style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, clipPath: `polygon(${CX}px ${CY}px, ${p.map((q) => `${q[0].toFixed(1)}px ${q[1].toFixed(1)}px`).join(', ')})`}} />
          );
        })}
        <Svg>
          {IDS.map((_, i) => {
            const q = pt(theta + i * WD - 90, 1400);
            return <line key={i} x1={CX} y1={CY} x2={q[0]} y2={q[1]} stroke="#F4F2EC" strokeWidth={4} />;
          })}
          <circle cx={CX} cy={CY} r={7} fill="#F4F2EC" />
          {/* 同一个圆：一圈线把 21 片箍在一起 */}
          <circle cx={CX} cy={CY} r={R + 2} fill="none" stroke="#F4F2EC" strokeWidth={5} />
        </Svg>
      </AbsoluteFill>
      <Svg>
        {'一个圆'.split('').map((ch, i) =>
          blk(236 + i * 168, 540, 152, 152, K.line1 + i * 4, [-3, 2, -2][i], 76 + i * 2, <text x={236 + i * 168} y={582} textAnchor="middle" fontSize={116} style={zh}>{ch}</text>),
        )}
        {blk(1486, 486, 396, 176, K.line2, 2, 80, <text x={1486} y={540} textAnchor="middle" fontSize={150} fill="#F4F2EC" style={{fontFamily: '"Inter Display"', fontWeight: 700, letterSpacing: '-0.03em'}}>{n2}</text>)}
        {blk(1486, 660, 396, 128, K.line2 + 9, -2, 82, <text x={1486} y={692} textAnchor="middle" fontSize={88} style={zh}>{n3}</text>)}
      </Svg>
    </AbsoluteFill>
  );
};

// ———————————————————— 固定外框 ————————————————————
const DARK = new Set(['artdeco', 'ascii', 'pointcloud', 'chrome', 'futurism']);
const GLYPH = 'abcdefghijklmnopqrstuvwxyz-_/';

export const Hud: React.FC<{f: number}> = ({f}) => {
  const S = TL.scenes;
  let i = -1;
  for (let k = 0; k < S.length; k++) if (f >= S[k].at) i = k;
  const sc = i >= 0 ? S[i] : null;
  const t = sc ? f - sc.at : f;
  const dark = sc ? DARK.has(sc.id) : false;
  const fg = dark ? '#F4F2EC' : '#141312', bg = dark ? '#141312' : '#F4F2EC';
  // 墙出现时外框退场
  const out = ei(seg(f, TL.wall.at, 9), 2);
  if (out >= 1) return null;
  const k = sc ? slap(t, 0.1, 6) : 1;
  const val = sc ? sc.id : '*';
  const shown = sc
    ? val.split('').map((ch, j) => (t > 1.5 + j * 0.55 ? ch : GLYPH[Math.floor(hash(j * 7.3 + Math.floor(f) * 1.7) * GLYPH.length)])).join('')
    : val;
  const code = `<Circle style="${shown}" />`;
  const typed = sc ? code : code.slice(0, Math.max(0, Math.floor(f - TL.hook.code)));
  const mono = {fontFamily: FONT.mono, fontWeight: 500} as const;
  const pill = (x: number, y: number, w: number, anchor: 'start' | 'end', child: React.ReactNode, dy = 0) => (
    <g transform={`translate(${x} ${y + dy})`}>
      <G x={anchor === 'start' ? 0 : 0} y={0} s={k}>
        <rect x={anchor === 'start' ? 0 : -w} y={-25} width={w} height={50} rx={8} fill={fg} stroke={bg} strokeOpacity={0.3} strokeWidth={1.5} />
        <text x={anchor === 'start' ? 20 : -20} y={8.5} textAnchor={anchor} fontSize={24} fill={bg} style={mono}>{child}</text>
      </G>
    </g>
  );
  const cw = 14.42; // Geist Mono 24px 的字宽
  const info = sc ? `${sc.zh} · ${sc.year}` : '';
  const infoW = sc ? 40 + [...info].reduce((a, ch) => a + (ch.charCodeAt(0) > 255 && ch !== '—' ? 24 : ch === '—' ? 24 : 13.4), 0) : 0;
  return (
    <Svg>
      <g transform={`translate(0 ${-110 * out})`}>
        {/* 左上：画廊的标 + 字标 */}
        <rect x={56} y={39} width={250} height={50} rx={8} fill={fg} stroke={bg} strokeOpacity={0.3} strokeWidth={1.5} />
        <g transform="translate(70 46) scale(0.9)">
          <circle cx={11} cy={12} r={8} fill={bg} />
          <path d="M24 4h13v16H24z" fill={bg} />
          <path d="m20 22 12 15H8z" fill={bg} />
        </g>
        <text x={116} y={74} fontSize={31} fill={bg} style={{fontFamily: FONT.brand, fontWeight: 500, letterSpacing: '-0.03em'}}>Design.style</text>
        {pill(1864, 64, 148, 'end', `${String(i + 1).padStart(2, '0')} / 21`)}
      </g>
      <g transform={`translate(0 ${110 * out})`}>
        {typed.length > 0 && pill(56, 1016, 40 + typed.length * cw, 'start', typed)}
        {sc && pill(1864, 1016, infoW, 'end', <tspan style={{fontFamily: FONT.sc, fontWeight: 700}}>{info}</tspan>)}
        {/* 21 颗进度点 */}
        {Array.from({length: 21}, (_, j) => (
          <circle key={j} cx={CX - 200 + j * 20} cy={1016} r={j === i ? 7 * k : 4} fill={fg} opacity={j <= i ? 1 : 0.28} />
        ))}
      </g>
    </Svg>
  );
};
