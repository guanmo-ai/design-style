/**
 * 11:30–14:30 滚动：左边固定、右边滚；然后反过来——左边向下、右边向上。
 * 第一段：左半是新粗野（黑框 + 硬阴影的“钉住”的卡片，序号每变一次就像被按了一下），右半是孔版印刷的三篇文章往上滚（带惯性）。
 * 第二段：孟菲斯的糖果色积木从左半往下掉，构成主义的口号从右半往上冲——两边反向滚动。
 */
import React from 'react';
import {Img, staticFile} from 'remotion';
import {BELT, ChProps, EXPO, Page, RuleTag, Wheel, clamp, mono, popEase, sc, tween} from './ui';
import {BH, KC, MC, Mem, NC, NV, Neo, RC, neoFont} from './kit';
import {Paper, Plate} from '../../../styles/008-risograph/video/riso';
import type {SeamStyle} from './SplitScreen';

export const scrollSeam = (_f: number): SeamStyle => ({line: null, pillBg: '#111111', pillFg: '#F5F4F0'});

const ROWS = [
  {img: 'citrus', tint: '#FF48B0', n: '01', title: '左边不动', desc: 'position: sticky，把它钉在原地'},
  {img: 'cat', tint: '#00A0A8', n: '02', title: '右边在滚', desc: '内容多长都行，滚的只是这一半'},
  {img: 'bread', tint: '#FFB511', n: '03', title: '各走各的', desc: '两边的速度和方向都可以不一样'},
];
const FLICK = [40, 78]; // 两次滚轮（局部帧）
const STEP = 700; // 每次滚过一段
const PHASE2 = 112; // 反向滚动开始
const ROW_H = 540;

const flick = (f: number) => FLICK.reduce((s, a) => s + tween(f, a, 26, 0, STEP, EXPO), 0);
const phase = (f: number) => BELT(clamp((f - PHASE2) / 26));

/** 序号每过半格“按一下”：阴影压到 0 再弹回 */
const stamp = (f: number) => FLICK.reduce((s, a) => s + tween(f, a + 10, 4) * (1 - tween(f, a + 16, 8)), 0);

// ═══════════════ 第二段：孟菲斯往下掉 ═══════════════
const MemphisFall: React.FC<{f: number; X: number}> = ({f, X}) => {
  const t = Math.max(0, f - PHASE2);
  const per = 300;
  const items = [
    {d: Mem.circ(90), fill: MC.pink},
    {d: Mem.tri(190, 170), fill: MC.yellow},
    {d: Mem.rect(170, 170, 0), fill: MC.teal},
    {d: Mem.half(100), fill: MC.blue},
    {d: Mem.rect(200, 110, 55), fill: MC.red},
    {d: Mem.circ(70), fill: MC.lilac},
  ];
  return (
    <svg width={X} height={1080} viewBox={`0 0 ${X} 1080`} style={{position: 'absolute', left: 0, top: 0}}>
      <Mem.Patterns f={f} />
      <rect width={X} height={1080} fill={MC.paper} />
      <rect width={X} height={1080} fill="url(#confetti)" />
      {Array.from({length: 7}).map((_, i) => {
        const y = ((t * 8 + i * per) % (per * 7)) - per;
        const it = items[i % items.length];
        const x = i % 2 === 0 ? 220 : 520;
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${(i * 37 + t * 1.2) % 360})`}>
            <Mem.Blk d={it.d} fill={it.fill} />
          </g>
        );
      })}
      <Mem.Txt x={X / 2} y={560} size={300} font="cn" anchor="middle" c={MC.yellow} stroke={10} sh={14}>{'向下'}</Mem.Txt>
      <Mem.Txt x={72} y={106} size={26} font="mono" w={700} c={MC.ink}>{'REVERSE · 反向 ↓'}</Mem.Txt>
    </svg>
  );
};

// ═══════════════ 第二段：构成主义往上冲 ═══════════════
const ConstructivistRise: React.FC<{f: number; X: number}> = ({f, X}) => {
  const t = Math.max(0, f - PHASE2);
  const per = 330;
  const W = 1920 - X;
  return (
    <svg width={W} height={1080} viewBox={`${X} 0 ${W} 1080`} style={{position: 'absolute', left: X, top: 0}}>
      <rect x={X} width={W} height={1080} fill={KC.paper} />
      <polygon points={`${X},880 ${X + W},180 ${X + W},380 ${X},1080`} fill={KC.red} />
      <polygon points={`${X},780 ${X + W},80 ${X + W},130 ${X},830`} fill={KC.ink} />
      {Array.from({length: 7}).map((_, i) => {
        const y = 1080 + per - (((t * 9 + i * per) % (per * 7)) + per) + per;
        return (
          <text key={i} x={X + 90 + (i % 2) * 120} y={y} fontFamily="'Noto Sans SC', sans-serif" fontWeight={900} fontSize={250} fill={i % 2 === 0 ? KC.ink : KC.light} stroke={i % 2 === 0 ? 'none' : KC.ink} strokeWidth={6}>
            {'向上'}
          </text>
        );
      })}
      <text x={X + W - 64} y={104} textAnchor="end" fontFamily="'Oswald', sans-serif" fontWeight={600} fontSize={30} letterSpacing={4} fill={KC.red}>
        {'ВВЕРХ · 本片的转场，反了一次'}
      </text>
    </svg>
  );
};

export const Scroll: React.FC<ChProps> = (p) => {
  const {f, side, X} = p;
  const L = side === 'L';
  const s = flick(f);
  const ph = phase(f);
  const idx = Math.min(2, s / STEP); // 小数：当前滚到第几段
  const rightW = 1920 - X;
  // 第二段：左半向下、右半向上，各送出 1080
  const leftOut = ph * 1080; // 左边的固定块向下离开
  const rightOut = -ph * 1080; // 右边的文章向上离开
  const z = NV.shadow[1] * (1 - stamp(f));
  return (
    <Page p={p} bg={L ? NC.yellow : RC.paper}>
      {L && (
        <>
          {/* 第一段：新粗野——钉住的一块 */}
          <div style={{position: 'absolute', inset: 0, transform: `translateY(${leftOut}px)`}}>
            <Neo.Dots opacity={0.22} />
            <div style={{position: 'absolute', left: 56, top: 50, padding: '12px 18px', background: NC.white, border: `${NV.border}px solid ${NC.ink}`, boxShadow: `8px 8px 0 ${NC.ink}`}}>
              <RuleTag f={f} n={4} title="一边固定，一边滚" fg={NC.ink} sub="#5C5850" at={-6} />
            </div>
            <Neo.Box x={56} y={170} w={621} h={520} fill={NC.white} z={z} border={NV.border}>
              <div style={{position: 'absolute', left: 30, top: 28, padding: '8px 16px', background: NC.ink, color: NC.yellow, ...neoFont(26, 700, 0.06)}}>{'PINNED · 固定'}</div>
              <div style={{position: 'absolute', left: 14, top: 100, display: 'flex', color: NC.ink, ...neoFont(380, 700, -0.05)}}>
                <Wheel v={0} h={400} style={{width: 220}} />
                <Wheel v={1 + idx} h={400} style={{width: 220}} />
              </div>
            </Neo.Box>
            <div style={{position: 'absolute', left: 56, top: 730, display: 'flex', gap: 14}}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{width: 120, height: 36, background: Math.abs(idx - i) < 0.5 ? NC.pink : NC.white, border: `${NV.border}px solid ${NC.ink}`, boxShadow: Math.abs(idx - i) < 0.5 ? `6px 6px 0 ${NC.ink}` : 'none'}} />
              ))}
            </div>
            <Neo.Box x={56} y={808} w={621} h={210} fill={NC.white} z={8} border={NV.border}>
              <div style={{position: 'absolute', left: 30, top: 22, color: NC.ink, ...mono(28, 700), lineHeight: 1.45}}>{'.left {\n  position: sticky;\n  top: 0; height: 100svh;\n}'}</div>
            </Neo.Box>
          </div>
          {/* 第二段：孟菲斯，往下掉 */}
          {ph > 0.001 && (
            <div style={{position: 'absolute', left: 0, top: 0, width: X, height: 1080, overflow: 'hidden', transform: `translateY(${(ph - 1) * 1080}px)`}}>
              <MemphisFall f={f} X={X} />
            </div>
          )}
        </>
      )}
      {!L && (
        <>
          {/* 第一段：孔版印刷的三篇文章，往上滚 */}
          <div style={{position: 'absolute', inset: 0, transform: `translateY(${rightOut}px)`}}>
            <Paper color={RC.paper} style={{left: X, width: rightW}}>
              {ROWS.map((r, i) => {
                const top = 250 + i * (ROW_H + 160) - s;
                if (top > 1100 || top < -ROW_H - 40) return null;
                return (
                  <div key={i} style={{position: 'absolute', left: 76, top, width: rightW - 152, height: ROW_H, isolation: 'isolate'}}>
                    <div style={{position: 'absolute', left: 0, top: 0, width: ROW_H, height: ROW_H, overflow: 'hidden', background: '#F3ECDB', isolation: 'isolate'}}>
                      <Img src={staticFile(`02-masonry/photos/${r.img}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.4) brightness(1.1)'}} />
                      <div style={{position: 'absolute', inset: 0, background: r.tint, mixBlendMode: 'multiply'}} />
                    </div>
                    <div style={{position: 'absolute', left: -8, top: -8, padding: '8px 16px', background: '#FF48B0', color: '#F3ECDB', mixBlendMode: 'multiply', ...mono(26, 700)}}>{r.n}</div>
                    <div style={{position: 'absolute', left: ROW_H + 56, top: 150, color: '#1C1A17'}}>
                      <div style={{...sc(82, 900, -0.01), lineHeight: 1.1}}>{r.title}</div>
                      <div style={{...sc(34, 500), marginTop: 16, lineHeight: 1.5, width: 400}}>{r.desc}</div>
                    </div>
                  </div>
                );
              })}
              {/* 滚动条：青色油墨 */}
              <div style={{position: 'absolute', right: 26, top: 120, width: 10, height: 840, background: 'rgba(28,26,23,0.12)'}}>
                <div style={{position: 'absolute', left: 0, top: (s / (STEP * 2)) * 520, width: 10, height: 300, background: RC.paperShade === '' ? '#00838A' : '#00838A'}} />
              </div>
            </Paper>
            <div style={{position: 'absolute', right: 64, top: 62, color: '#1C1A17', ...mono(22, 700, 0.14)}}>{'SCROLLS ▴ 滚动'}</div>
          </div>
          {/* 第二段：构成主义，往上冲 */}
          {ph > 0.001 && (
            <div style={{position: 'absolute', left: X, top: 0, width: rightW, height: 1080, overflow: 'hidden', transform: `translateY(${(1 - ph) * 1080}px)`}}>
              <div style={{position: 'absolute', left: -X, top: 0, width: 1920, height: 1080}}>
                <ConstructivistRise f={f} X={X} />
              </div>
            </div>
          )}
        </>
      )}
      {/* 第二段的说明：跨过中线的一块药丸 */}
      <div style={{position: 'absolute', left: X - 300, top: 968, width: 600, height: 72, background: '#161514', color: BH.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scaleX(${tween(f, PHASE2 + 22, 14, 0, 1, EXPO)})`, ...sc(32, 900), zIndex: 30}}>
        {'也可以反过来：左 ↓　右 ↑'}
      </div>
    </Page>
  );
};
