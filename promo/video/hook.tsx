/** 开场（第 0 帧）+ 固定外框。开场是设计工具里刚画出来的一个圆：默认灰 #D9D9D9，还没有任何风格。 */
import React from 'react';
import {CX, CY, FONT, G, R, Rise, Svg, TL, back, cl, ei, eio, eo, hash, lerp, seg, slap} from './kit';

export const BRAND = {bg: '#f7f4ed', ink: '#352f2a', muted: '#786f65', accent: '#a34332', mark: '#ad4935', line: '#ded8cc', paper: '#fffdf8', seal: '#C8372D'};
const SEL = '#0D99FF';

export const Cursor: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s * 1.5})`}>
    <path d="M0 0 L0 23 L6.2 17.4 L10.4 27 L14.2 25.3 L10.1 15.9 L18 15.4 Z" fill="#111" stroke="#fff" strokeWidth={2.2} strokeLinejoin="round" />
  </g>
);

export const Hook: React.FC<{t: number}> = ({t}) => {
  const K = TL.hook;
  const wind = seg(t, K.windup, 96 - K.windup);
  const s = slap(t, 0.5, 9) * (1 - 0.14 * ei(wind, 2.2)); // 砸下来；最后一拍蓄力
  const box = eo(seg(t, 4, 8), 4) * (1 - ei(seg(t, 84, 8), 2));
  const br = R * s * lerp(1.3, 1, eo(seg(t, 4, 8), 4));
  const n21 = Math.max(1, Math.round(21 * eo(seg(t, K.line2, 16), 2)));
  const outP = (a: number) => 1 - ei(seg(t, a, 10), 3); // 文字沉回遮罩
  const zh = {fontFamily: FONT.sc, fontWeight: 900, fill: BRAND.ink} as const;
  // 光标：先停在选框右下角，再去点左下角的 style
  const mv = eio(seg(t, 58, 24));
  const cx = lerp(CX + R + 14, 486, mv), cy = lerp(CY + R + 14, 1006, mv) - 60 * Math.sin(Math.PI * mv);
  const click = 1 - 0.22 * Math.sin(Math.PI * seg(t, 88, 7));
  return (
    <Svg bg={BRAND.bg}>
      <defs>
        <pattern id="hookgrid" width={48} height={48} patternUnits="userSpaceOnUse">
          <circle cx={24} cy={24} r={1.6} fill={BRAND.line} />
        </pattern>
      </defs>
      <rect width={1920} height={1080} fill="url(#hookgrid)" />
      {'一个圆'.split('').map((ch, i) => (
        <Rise key={i} x={132 + i * 164} y={596} size={164} w={200} p={seg(t, K.line1 + i * 4, 9) * outP(76 + i)} style={zh}>{ch}</Rise>
      ))}
      <Rise x={1268} y={572} size={200} w={640} p={seg(t, K.line2, 10) * outP(78)} style={{fontFamily: '"Inter Display"', fontWeight: 700, fill: BRAND.ink, letterSpacing: '-0.04em'}}>
        ×{String(n21).padStart(2, '0')}
      </Rise>
      <Rise x={1272} y={668} size={66} w={640} p={seg(t, K.line2 + 6, 10) * outP(80)} style={{...zh, fontWeight: 700}}>种风格与布局</Rise>
      <G s={s}>
        <circle cx={CX} cy={CY} r={R} fill="#D9D9D9" />
      </G>
      {box > 0.01 && (
        <g opacity={cl(box * 3)}>
          <rect x={CX - br} y={CY - br} width={br * 2} height={br * 2} fill="none" stroke={SEL} strokeWidth={2.5} />
          {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b], i) => (
            <rect key={i} x={CX + a * br - 7} y={CY + b * br - 7} width={14} height={14} fill="#fff" stroke={SEL} strokeWidth={2.5} />
          ))}
          <g transform={`translate(${CX} ${CY + br + 34})`}>
            <rect x={-62} y={-17} width={124} height={34} rx={6} fill={SEL} />
            <text textAnchor="middle" y={7} fontSize={21} fill="#fff" style={{fontFamily: FONT.ui, fontWeight: 600}}>420 × 420</text>
          </g>
        </g>
      )}
      <Cursor x={cx} y={cy} s={click * back(seg(t, 2, 8))} />
    </Svg>
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
  const val = sc ? sc.id : 'none';
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
