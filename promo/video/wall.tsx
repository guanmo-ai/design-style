/** 画廊墙（同一个圆的 21 个样子 → 翻牌 → 仓库里真实的 21 部短片封面）+ 片尾（圆变成字标 Design.style 里的那个点） */
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {CX, CY, FONT, G, R, Rise, Svg, TL, back, cl, ei, eio, eo, lerp, pop, seg, slap} from './kit';
import {BRAND} from './hook';
import c001 from '../../styles/001-bauhaus/video/cover.jpg';
import c002 from '../../styles/002-swiss-style/video/cover.jpg';
import c003 from '../../styles/003-constructivism/video/cover.jpg';
import c004 from '../../styles/004-memphis/video/cover.jpg';
import c005 from '../../styles/005-pop-art/video/cover.jpg';
import c006 from '../../styles/006-y2k/video/cover.jpg';
import c008 from '../../styles/008-risograph/video/cover.jpg';
import c009 from '../../styles/009-neo-brutalism/video/cover.jpg';
import c013 from '../../styles/013-art-deco/video/cover.jpg';
import c014 from '../../styles/014-liquid-glass/video/cover.jpg';
import c015 from '../../styles/015-futurism/video/cover.jpg';
import c017 from '../../styles/017-mid-century-modern/video/cover.jpg';
import c018 from '../../styles/018-diorama/video/cover.jpg';
import c019 from '../../styles/019-low-poly/video/cover.jpg';
import c020 from '../../styles/020-ascii-art/video/cover.jpg';
import c021 from '../../styles/021-generative-art/video/cover.jpg';
import c022 from '../../styles/022-point-cloud/video/cover.jpg';
import c023 from '../../styles/023-liquid-chrome/video/cover.jpg';
import c024 from '../../styles/024-ink-wash/video/cover.jpg';
import l01 from '../../layouts/01-bento-grid/video/cover.jpg';
import l02 from '../../layouts/02-masonry/video/cover.jpg';

const COVERS = [c001, c002, c003, c004, c005, c006, c008, c009, c013, c014, c015, c017, c018, c019, c020, c021, c022, c023, c024, l01, l02] as unknown as string[];
export const WORK_IDS = [...TL.scenes.map((s) => s.id), 'bento', 'masonry'];

// —— 5 × 5 的墙：21 张单格 + 一张 2 × 2 的字标格 ——
const GAP = 16, TW = (1920 - 6 * GAP) / 5, TH = (TW * 9) / 16, OY = (1080 - (5 * TH + 6 * GAP)) / 2;
const cell = (r: number, c: number) => ({x: GAP + c * (TW + GAP), y: OY + GAP + r * (TH + GAP)});
const CELLS: {r: number; c: number; work: number}[] = [];
{
  const free: number[][] = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) if (!((r === 1 || r === 2) && (c === 1 || c === 2))) free.push([r, c]);
  // 水墨（第 19 部）放在字标格右边：镜头就是从它拉出来的
  const order = [0, 1, 2, 3, 4, 5, 6, 7, 8, 18, 9, 10, 11, 12, 13, 14, 15, 16, 17, 19, 20];
  free.forEach(([r, c], i) => CELLS.push({r, c, work: order[i]}));
}
const INK_CELL = CELLS.find((q) => q.work === 18)!;
const LOGO = {x: cell(1, 1).x, y: cell(1, 1).y, w: TW * 2 + GAP, h: TH * 2 + GAP};
const S0 = 1920 / TW, S1 = 1920 / LOGO.w;
const COLDRIFT = [300, -240, 180, 0, -280];

export const Wall: React.FC<{f: number}> = ({f}) => {
  const K = TL.wall;
  const t = f - K.at;
  // 拉远（对数插值：每帧缩小同样的倍数），再朝字标格推进去
  const pull = back(seg(t, 0, 30), 0.9);
  const push = ei(seg(f, K.push[0], K.push[1] - K.push[0]), 2.6);
  const ic = cell(INK_CELL.r, INK_CELL.c);
  const from = [ic.x + TW / 2, ic.y + TH / 2], mid = [960, 540], to = [LOGO.x + LOGO.w / 2, LOGO.y + LOGO.h / 2];
  const S = Math.exp(lerp(Math.log(S0), 0, pull)) * Math.exp(Math.log(S1) * push);
  const pp = eo(seg(t, 0, 26), 3);
  const wx = lerp(lerp(from[0], mid[0], pp), to[0], push), wy = lerp(lerp(from[1], mid[1], pp), to[1], push);
  const drift = 1 - eo(seg(t, 0, 30), 3);
  const rad = 12 * seg(t, 0, 8) * (1 - push);
  const dmax = Math.max(...CELLS.map((q) => Math.hypot(q.c - INK_CELL.c, q.r - INK_CELL.r)));
  return (
    <AbsoluteFill style={{background: BRAND.bg, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '0 0', transform: `translate(${960 - wx * S}px, ${540 - wy * S}px) scale(${S})`}}>
        {CELLS.map((q, i) => {
          const p = cell(q.r, q.c);
          const isInk = q.work === 18;
          const d = Math.hypot(q.c - INK_CELL.c, q.r - INK_CELL.r);
          const inS = isInk ? 1 : lerp(0.78, 1, pop(t, d * 1.1, 11, 1.6));
          const fl = back(seg(f, K.flip[0] + (d / dmax) * (K.flip[1] - K.flip[0] - 15), 15), 1.25);
          const lift = Math.sin(Math.PI * cl(fl));
          const id = WORK_IDS[q.work];
          // 只有正在翻的牌才走 3D（每张牌自己的透视）；没在翻的都是平面，软件渲染才跑得动
          const deg = 180 * fl, flipping = fl > 0.002 && Math.abs(fl - 1) > 0.002, showBack = deg >= 90;
          const tf = flipping ? `perspective(1500px) translateZ(${90 * lift}px) rotateY(${showBack ? deg - 180 : deg}deg) scale(${inS})` : `scale(${inS})`;
          return (
            <div key={i} style={{position: 'absolute', left: p.x, top: p.y + COLDRIFT[q.c] * drift, width: TW, height: TH, transform: tf, zIndex: flipping ? 5 : 1, borderRadius: rad, overflow: 'hidden', boxShadow: `0 ${6 + 30 * lift}px ${16 + 50 * lift}px rgba(53,47,42,${0.16 + 0.14 * lift})`}}>
              {showBack ? (
                <Img src={COVERS[q.work]} style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}} />
              ) : isInk ? (
                <Img src={staticFile('promo/tiles/ink-full.jpg')} style={{width: '100%', height: '100%', display: 'block', transform: `scale(${lerp(1.035, 1, eo(seg(t, 0, 24), 2))})`}} />
              ) : (
                <Img src={staticFile(`promo/tiles/${id}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}} />
              )}
            </div>
          );
        })}
        {/* 字标格：里面就是片尾那一屏 */}
        <div style={{position: 'absolute', left: LOGO.x, top: LOGO.y + COLDRIFT[1] * drift * 0.5, width: LOGO.w, height: LOGO.h, borderRadius: rad * 1.6, overflow: 'hidden', boxShadow: `0 10px 30px rgba(53,47,42,${0.16 * (1 - push)})`, transform: `scale(${lerp(0.78, 1, pop(t, 1, 11, 1.6))})`}}>
          <div style={{width: 1920, height: 1080, transformOrigin: '0 0', transform: `scale(${LOGO.w / 1920})`}}>
            <End te={f - TL.end.at} />
          </div>
        </div>
      </div>
      {/* 字幕：落在翻牌那一下 */}
      {(() => {
        const a = K.flip[0] + 4, s = f < a ? 0 : slap(f - a, 0.35, 7) * (1 - ei(seg(f, K.push[0] - 2, 9), 2));
        return s > 0.01 ? (
          <Svg>
            <G x={CX} y={946} s={s}>
              <rect x={CX - 420} y={900} width={840} height={92} rx={46} fill="#141312" />
              <text x={CX} y={961} textAnchor="middle" fontSize={44} fill="#F4F2EC" style={{fontFamily: FONT.sc, fontWeight: 900, letterSpacing: '0.02em'}}>
                19 种风格 + 2 种布局 <tspan fill="#FFC62E">·</tspan> 全部开源
              </text>
            </G>
          </Svg>
        ) : null;
      })()}
    </AbsoluteFill>
  );
};

// —— 片尾 ——
// Newsreader 500 · 250px · 字距 −8px 时两个词的实际宽度（量出来的）
const W1 = 744, W2 = 505;
const CHIPS = ['15 秒短片', '4 张风格图', '规则指南', 'Design Tokens', 'AI 提示词', '全部源码'];
const chipW = (s: string) => 80 + [...s].reduce((a, ch) => a + (ch.charCodeAt(0) > 255 ? 36 : ch === ' ' ? 10 : 20.5), 0);

export const End: React.FC<{te: number}> = ({te}) => {
  const w1 = W1, w2 = W2;
  const GAPD = 92, DR = 31, BASE = 428;
  const left = 960 - (w1 + GAPD + w2) / 2, dx = left + w1 + GAPD / 2 - 6, dy = BASE - DR - 2;
  // 主角：从画面正中的大圆，缩成字标里的那个点
  const mv = eio(seg(te, 1, 12));
  const cr = lerp(150, DR, mv) * (te < 0 ? 1 : slap(te, 0.3, 8)) * (1 + 0.5 * Math.sin(Math.PI * seg(te, 10, 9)) * 0.5);
  const cx = lerp(960, dx, mv), cy = lerp(540, dy, mv) - 60 * Math.sin(Math.PI * mv);
  const wp = eo(seg(te, 5, 15), 4); // 两个词从点的背后滑出来
  const word = {fontFamily: FONT.brand, fontWeight: 500, fill: BRAND.ink, letterSpacing: '-8px'} as const;
  const seal = te - (TL.end.seal - TL.end.at);
  const widths = CHIPS.map(chipW), total = widths.reduce((a, b) => a + b, 0) + 14 * 5;
  let x0 = 960 - total / 2;
  const dip = seal >= 0 ? 5 * Math.exp(-seal / 4) : 0;
  return (
    <Svg bg={BRAND.bg}>
      <g transform={`translate(0 ${dip})`}>
        {te >= 0 && (
          <>
            <svg x={0} y={BASE - 260} width={dx - GAPD / 2 + 14} height={360} overflow="hidden">
              <text x={left + (w1 + 80) * (1 - wp)} y={260} fontSize={250} style={word}>Design</text>
            </svg>
            <svg x={dx + GAPD / 2 - 14} y={BASE - 260} width={1920} height={360} overflow="hidden">
              <text x={14 + 6 - (w2 + 80) * (1 - wp)} y={260} fontSize={250} style={word}>style</text>
            </svg>
            <Rise x={960} y={548} size={52} p={seg(te, 12, 12)} anchor="middle" w={1400} style={{fontFamily: FONT.sc, fontWeight: 500, fill: BRAND.muted, letterSpacing: '0.06em'}}>设计参考库 · 给人看，也给 AI 用</Rise>
            {CHIPS.map((s, i) => {
              const w = widths[i], x = x0;
              x0 += w + 14;
              const k = pop(te, TL.end.chips[i] - TL.end.at, 9, 2.4);
              if (k <= 0) return null;
              return (
                <G key={i} x={x + w / 2} y={690} s={k}>
                  <rect x={x} y={648} width={w} height={84} rx={42} fill={BRAND.paper} stroke={BRAND.ink} strokeWidth={2.5} />
                  <circle cx={x + 38} cy={690} r={10} fill={BRAND.accent} />
                  <text x={x + 60} y={703} fontSize={36} fill={BRAND.ink} style={{fontFamily: FONT.sc, fontWeight: 700}}>{s}</text>
                </G>
              );
            })}
            <Rise x={960} y={850} size={46} p={seg(te, 16, 12)} anchor="middle" w={1400} style={{fontFamily: FONT.mono, fontWeight: 500, fill: BRAND.ink}}>github.com/guanmo-ai/design-style</Rise>
            <Rise x={960} y={908} size={30} p={seg(te, 20, 12)} anchor="middle" w={1400} style={{fontFamily: FONT.mono, fontWeight: 500, fill: BRAND.muted}}>@guanmo_ai</Rise>
          </>
        )}
        <circle cx={cx} cy={cy} r={cr} fill={BRAND.accent} />
        {/* 署名：最后一个动作，盖章 */}
        {seal >= 0 && (
          <G x={1640} y={856} s={lerp(1.6, 1, eo(seal / 7, 3))} r={-4}>
            <rect x={1592} y={782} width={96} height={148} rx={9} fill={BRAND.seal} opacity={0.96} />
            <text x={1640} y={848} textAnchor="middle" fontSize={62} fill={BRAND.bg} style={{fontFamily: FONT.serif, fontWeight: 900}}>观</text>
            <text x={1640} y={912} textAnchor="middle" fontSize={62} fill={BRAND.bg} style={{fontFamily: FONT.serif, fontWeight: 900}}>默</text>
          </G>
        )}
      </g>
    </Svg>
  );
};

// —— 两种布局的“圆”（只出现在墙上） ——
export const Bento: React.FC = () => {
  const card = (x: number, y: number, w: number, h: number, child?: React.ReactNode, fill = '#161618') => (
    <g><rect x={x} y={y} width={w} height={h} rx={32} fill={fill} stroke="rgba(255,255,255,0.07)" strokeWidth={2} />{child}</g>
  );
  const t = {fontFamily: '"Inter Display"', fontWeight: 600, letterSpacing: '-0.045em'} as const;
  return (
    <Svg bg="#000">
      <defs><linearGradient id="bentog" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FF8A1F" /><stop offset="0.5" stopColor="#FF2D6F" /><stop offset="1" stopColor="#A63DFF" /></linearGradient></defs>
      {card(96, 130, 420, 400, <><text x={136} y={236} fontSize={96} fill="#F5F5F7" style={t}>Bento</text><text x={136} y={330} fontSize={96} fill="#F5F5F7" style={t}>Grid</text><text x={138} y={470} fontSize={40} fill="#86868B" style={{fontFamily: FONT.sc, fontWeight: 700}}>便当盒布局</text></>)}
      {card(96, 550, 420, 400, <><text x={136} y={730} fontSize={150} fill="url(#bentog)" style={t}>2×</text><text x={138} y={890} fontSize={38} fill="#86868B" style={{fontFamily: FONT.sc, fontWeight: 700}}>大小不一，一格一事</text></>)}
      {card(536, 130, 848, 820, <circle cx={CX} cy={CY} r={R} fill="url(#bentog)" />, '#0F0F11')}
      {card(1404, 130, 420, 260, <text x={1444} y={300} fontSize={110} fill="#F5F5F7" style={t}>4 col</text>)}
      {card(1404, 410, 200, 260, <circle cx={1504} cy={540} r={52} fill="#F5F5F7" />)}
      {card(1624, 410, 200, 260, <rect x={1672} y={488} width={104} height={104} rx={26} fill="#FF2D6F" />)}
      {card(1404, 690, 420, 260, <text x={1444} y={860} fontSize={110} fill="#F5F5F7" style={t}>r = 32</text>)}
    </Svg>
  );
};
export const Masonry: React.FC = () => {
  const cols = [[210, 330, 260, 300], [300, 240, 380, 200], [150, 448, 250, 300], [260, 330, 220, 320], [340, 220, 300, 280]];
  const fills = ['#E9E2D3', '#D8CDB8', '#C7B8A0', '#F2462E', '#141414', '#B9C4B1', '#E3C9A8'];
  const CWm = (1920 - 192 - 80) / 5;
  let k = 0;
  return (
    <Svg bg="#F2EFE9">
      {cols.map((hs, c) => {
        let y = -60 - c * 37;
        return hs.map((h, i) => {
          const x = 96 + c * (CWm + 20), yy = y;
          y += h + 20;
          const hero = c === 2 && i === 1;
          k++;
          return (
            <g key={`${c}${i}`}>
              <rect x={x} y={yy} width={CWm} height={h} rx={20} fill="#FFFFFF" />
              <rect x={x + 12} y={yy + 12} width={CWm - 24} height={h - (hero ? 24 : 78)} rx={12} fill={hero ? '#141414' : fills[k % 7]} />
              {hero ? <circle cx={x + CWm / 2} cy={yy + h / 2} r={132} fill="#F2462E" /> : <><rect x={x + 16} y={yy + h - 52} width={CWm * 0.55} height={12} rx={6} fill="#141414" /><rect x={x + 16} y={yy + h - 30} width={CWm * 0.34} height={10} rx={5} fill="#6F6A62" opacity={0.6} /></>}
            </g>
          );
        });
      })}
      <rect x={96} y={820} width={560} height={170} rx={20} fill="#F2EFE9" />
      <text x={120} y={930} fontSize={130} fill="#141414" style={{fontFamily: '"Instrument Serif"'}}>Masonry</text>
      <text x={124} y={980} fontSize={36} fill="#6F6A62" style={{fontFamily: FONT.sc, fontWeight: 700}}>瀑布流布局 · 落进最短的那一列</text>
    </Svg>
  );
};
