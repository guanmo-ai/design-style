/**
 * 14:30–17:30 响应式：同一页，从 1440 缩到 390。
 * 窄过 768 的一刻：左右两栏叠成上下，整条中线同时转 90°（左半 → 上半、右半 → 下半）。
 * 这一章的两半是孟菲斯（左 / 上）和构成主义（右 / 下）；窗口里的页面还是比例章那张：包豪斯的图 + 瑞士的字。
 * 窗口是同一个东西在两半各画一遍：边框颜色每半各一个，所以它横跨中线时颜色会翻过来。
 */
import React from 'react';
import {ChProps, EXPO, Page, RuleTag, SLIDE, BELT, clamp, lerp, mono, popEase, sc, tween} from './ui';
import {BH, KC, MC, Mem, SW, swiss} from './kit';
import type {SeamStyle} from './SplitScreen';

export const respSeam = (_f: number): SeamStyle => ({line: null, pillBg: '#111111', pillFg: '#F5F4F0'});

const A = {in: -8, shrink1: 36, hold: 70, shrink2: 74, stack: 76, rot: 100};
export const vwAt = (f: number) => (f < A.shrink1 ? 1440 : f < A.shrink2 ? lerp(1440, 768, SLIDE(clamp((f - A.shrink1) / 34))) : lerp(768, 390, SLIDE(clamp((f - A.shrink2) / 26))));
export const stackAt = (f: number) => BELT(clamp((f - A.stack) / 16));

const Dim: React.FC<{x0: number; x1: number; y: number; color: string; bg: string; label: string}> = ({x0, x1, y, color, bg, label}) => (
  <div style={{position: 'absolute', left: x0, top: y - 14, width: x1 - x0, height: 28}}>
    <div style={{position: 'absolute', left: 0, top: 13, width: '100%', height: 3, background: color}} />
    <div style={{position: 'absolute', left: 0, top: 0, width: 3, height: 28, background: color}} />
    <div style={{position: 'absolute', right: 0, top: 0, width: 3, height: 28, background: color}} />
    <div style={{position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', padding: '0 16px', background: bg, color, height: 28, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', ...mono(24, 700, 0.04)}}>{label}</div>
  </div>
);

/** 窗口里的“图”窗格：包豪斯的圆、方、三角，按窗格大小缩放 */
const ArtPane: React.FC<{w: number; h: number}> = ({w, h}) => {
  const u = Math.min(w, h);
  return (
    <div style={{position: 'absolute', inset: 0, background: BH.paper, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: w * 0.08, top: h * 0.24, width: u * 0.62, height: u * 0.62, borderRadius: '50%', background: BH.red}} />
      <div style={{position: 'absolute', left: w * 0.5, top: h * 0.12, width: u * 0.36, height: u * 0.36, background: BH.blue}} />
      <svg width={u * 0.46} height={u * 0.46} viewBox="0 0 100 100" style={{position: 'absolute', left: w * 0.46, top: h * 0.5}}>
        <polygon points="0,100 100,100 50,6" fill={BH.yellow} stroke={BH.ink} strokeWidth={4} strokeLinejoin="round" />
      </svg>
      <div style={{position: 'absolute', left: w * 0.08, bottom: h * 0.08, width: w * 0.7, height: Math.max(4, u * 0.03), background: BH.ink}} />
    </div>
  );
};

export const Responsive: React.FC<ChProps> = (p) => {
  const {f, side} = p;
  const L = side === 'L';
  const fg = L ? '#111111' : KC.paper; // 本半的前景色
  const vw = vwAt(f);
  const st = stackAt(f);
  const open = tween(f, A.in, 20, 0, 1, EXPO);
  const ww = vw * 0.78;
  const wh = lerp(720, 860, st);
  const bw = 8;
  const rad = lerp(8, 44, st);
  const bar = lerp(48, 0, st);
  const wx = 960 - ww / 2;
  const wy = 540 - wh / 2;
  const cx0 = wx + bw;
  const cy0 = wy + bw + bar;
  const cw = ww - 2 * bw;
  const ch = wh - 2 * bw - bar;
  // 两个窗格：图（包豪斯）与字（瑞士）。并排 → 叠放，字去上面
  const art = {x: cx0, y: lerp(cy0, cy0 + ch / 2, st), w: lerp(cw / 2, cw, st), h: lerp(ch, ch / 2, st)};
  const txt = {x: lerp(cx0 + cw / 2, cx0, st), y: cy0, w: lerp(cw / 2, cw, st), h: lerp(ch, ch / 2, st)};
  const fs = clamp(vw * 0.05, 30, 78);
  const udIn = tween(f, 122, 20, 0, 1, EXPO);
  const lrOut = 1 - tween(f, 72, 14);
  return (
    <Page p={p} bg={L ? MC.paper : KC.ink}>
      {/* 两半的风格：孟菲斯（左 / 上）与构成主义（右 / 下） */}
      {L ? (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
          <Mem.Patterns f={f} />
          <rect width={1920} height={1080} fill="url(#confetti)" />
          <g transform={`translate(${lrOut * 0 + 150} 520) rotate(-10)`} opacity={lrOut * tween(f, -4, 14)}>
            <Mem.Blk d={Mem.circ(180)} fill={MC.pink} />
          </g>
          <g opacity={lrOut * tween(f, -4, 14)}>
            <Mem.Txt x={200} y={640} size={400} font="cn" anchor="middle" c={MC.yellow} stroke={10} sh={14}>{'左'}</Mem.Txt>
          </g>
          <g opacity={udIn} transform={`translate(0 ${(1 - udIn) * -60})`}>
            <Mem.Txt x={480} y={450} size={440} font="cn" anchor="middle" c={MC.yellow} stroke={10} sh={14}>{'上'}</Mem.Txt>
          </g>
        </svg>
      ) : (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
          <polygon points="1100,1080 1920,640 1920,880 1500,1080" fill={KC.red} />
          <polygon points="1300,1080 1920,760 1920,800 1360,1080" fill={KC.paper} opacity={0.9} />
          <g opacity={lrOut * tween(f, -4, 14)}>
            <text x={1720} y={650} textAnchor="middle" fontFamily="'Noto Sans SC', sans-serif" fontWeight={900} fontSize={400} fill={KC.paper}>{'右'}</text>
          </g>
          <g opacity={udIn} transform={`translate(0 ${(1 - udIn) * 60})`}>
            <text x={1440} y={930} textAnchor="middle" fontFamily="'Noto Sans SC', sans-serif" fontWeight={900} fontSize={440} fill={KC.paper} stroke={KC.red} strokeWidth={8} paintOrder="stroke">{'下'}</text>
          </g>
        </svg>
      )}

      {/* 规则角标 */}
      {L && (
        <div style={{position: 'absolute', left: 78, top: 50, padding: '12px 18px', background: '#F5F4F0', border: '4px solid #111', boxShadow: '6px 6px 0 #111'}}>
          <RuleTag f={f} n={5} title="手机上叠成上下" fg="#111" sub="#6B675E" at={-6} />
        </div>
      )}

      {/* 视口读数 */}
      <div style={{opacity: open}}>
        <Dim x0={wx} x1={wx + ww} y={wy - 46} color={fg} bg={L ? MC.paper : KC.ink} label={`${Math.round(vw)} px`} />
      </div>

      {/* 窗口：边框颜色每半各一个 */}
      <div style={{position: 'absolute', left: wx, top: wy, width: ww, height: wh, borderRadius: rad, border: `${bw}px solid ${fg}`, boxSizing: 'border-box', overflow: 'hidden', background: fg, opacity: open, transform: `scale(${lerp(0.94, 1, open)})`}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: '100%', height: bar, background: fg, display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 16, overflow: 'hidden'}}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{width: 12, height: 12, borderRadius: '50%', background: L ? MC.paper : KC.ink}} />
          ))}
          <div style={{marginLeft: 16, height: 22, width: ww * 0.4, background: L ? 'rgba(253,246,236,0.3)' : 'rgba(22,20,18,0.3)', borderRadius: 11}} />
        </div>
      </div>
      {/* 窗格 */}
      <div style={{position: 'absolute', left: art.x, top: art.y, width: art.w, height: art.h, overflow: 'hidden', opacity: open}}>
        <ArtPane w={art.w} h={art.h} />
      </div>
      <div style={{position: 'absolute', left: txt.x, top: txt.y, width: txt.w, height: txt.h, background: SW.paper, overflow: 'hidden', opacity: open}}>
        <div style={{position: 'absolute', left: '9%', top: '8%', width: '82%', color: SW.ink}}>
          <div style={{width: fs * 1.2, height: Math.max(6, fs * 0.1), background: SW.red}} />
          <div style={{...swiss(fs, 700, -0.055), lineHeight: 0.96, marginTop: fs * 0.3}}>{'Less is more.'}</div>
          <div style={{marginTop: fs * 0.4, display: 'flex', flexDirection: 'column', gap: fs * 0.14}}>
            {[0.95, 0.8, 0.88].map((q, i) => (
              <div key={i} style={{height: Math.max(6, fs * 0.13), width: `${q * 100}%`, background: SW.ink, opacity: 0.2}} />
            ))}
          </div>
          <div style={{marginTop: fs * 0.4, width: fs * 0.9, height: fs * 0.9, background: SW.red, color: SW.paper, ...swiss(fs * 0.55, 400, 0), display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{'→'}</div>
        </div>
      </div>
      {/* 顶栏：手机时是刘海 */}
      <div style={{position: 'absolute', left: 960 - 46, top: wy + bw + 10, width: 92, height: 22, borderRadius: 11, background: fg, opacity: st * open, zIndex: 3}} />

      {/* 阅读顺序：①文字（上，在孟菲斯那一半）②图（下，在构成主义那一半）——贴在手机两侧，不压住内容 */}
      {L && (
        <div style={{position: 'absolute', left: wx + ww + 28, top: 330, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', background: MC.yellow, border: '4px solid #111', boxShadow: '6px 6px 0 #111', color: '#111', ...sc(30, 900), opacity: tween(f, 134, 10), transform: `scale(${tween(f, 134, 10, 0.6, 1, popEase)}) rotate(-3deg)`, transformOrigin: 'left center', zIndex: 6}}>
          <span>{'① 先读文字'}</span>
        </div>
      )}
      {!L && (
        <div style={{position: 'absolute', left: wx - 28 - 220, top: 690, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: 220, padding: '10px 18px', background: KC.red, border: `4px solid ${KC.paper}`, color: KC.paper, ...sc(30, 900), opacity: tween(f, 140, 10), transform: `scale(${tween(f, 140, 10, 0.6, 1, popEase)}) rotate(2deg)`, transformOrigin: 'right center', zIndex: 6}}>
          <span>{'② 再看图'}</span>
        </div>
      )}

      {/* @media：跨过中线的药丸（出现在窄过 768 的一刻） */}
      <div style={{position: 'absolute', left: 960 - 330, top: 968, width: 660, height: 72, background: '#161514', color: BH.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scaleX(${tween(f, A.hold + 6, 14, 0, 1, EXPO)})`, ...mono(28, 700), zIndex: 30}}>
        {'@media (max-width: 767px)'}
      </div>
    </Page>
  );
};
