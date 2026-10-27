/**
 * 09:00–11:30 反差：明 / 暗 → 图 / 文 → 静 / 动。
 * 每一对反差，两半各穿一种风格去演：
 *   明暗：孔版印刷（米白纸、三色叠印、套不准）× Bento 暗色界面（发光、玻璃卡片）
 *   图文：孔版双色调照片 × 新粗野（黑框、硬阴影、贴纸）
 *   静动：瑞士（一个红点，一动不动）× 波普（爆炸框、集中线、拟声字，每拍一震）
 * 每次换一对，新的一对从中线向两边撕开；一次只选一对——三对都用，两边都在喊，反差就没了。
 */
import React from 'react';
import {Img, staticFile} from 'remotion';
import {ChProps, EXPO, Page, RuleTag, clamp, mono, popEase, sc, tween} from './ui';
import {BH, NC, NV, Neo, PC, Pop, RC, SW, neoFont, swiss} from './kit';
import {Paper, Plate, RegMark, jitter} from '../../../styles/008-risograph/video/riso';
import type {SeamStyle} from './SplitScreen';

export const T1 = 56; // 明暗 → 图文 的撕开起点（局部帧）
export const T2 = 98; // 图文 → 静动
const OPEN = 18;

export const contrastSeam = (_f: number): SeamStyle => ({line: null, pillBg: '#111111', pillFg: '#F5F4F0'});

// WCAG 对比度（相对亮度）
const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export const CONTRAST = (lum('#F1EDE4') + 0.05) / (lum('#0E0E10') + 0.05);

// ═══════════════ 明：孔版印刷 ═══════════════
const RisoLight: React.FC<{f: number; X: number}> = ({f, X}) => {
  const settle = (at: number) => 1 - tween(f, at, 16, 0, 1, EXPO);
  const reg = (ink: 'pink' | 'yellow' | 'black', dx: number, dy: number, at: number) => {
    const j = jitter(f, ink, 0.9);
    return {x: dx * settle(at) + j.x, y: dy * settle(at) + j.y, r: 0};
  };
  const circle = (cx: number, cy: number, r: number) => <div style={{position: 'absolute', left: cx - r, top: cy - r, width: 2 * r, height: 2 * r, borderRadius: '50%', background: 'currentColor'}} />;
  return (
    <Paper color={RC.paper} style={{width: X}}>
      <Plate ink="yellow" f={f} reg={reg('yellow', -40, 24, 0)} origin="480px 540px">
        {circle(380, 560, 300)}
      </Plate>
      <Plate ink="pink" f={f} reg={reg('pink', 50, -30, 4)} origin="480px 540px">
        {circle(580, 520, 290)}
      </Plate>
      <Plate ink="pink" f={f} reg={{...reg('pink', 14, 10, 12), x: 12 + reg('pink', 14, 10, 12).x}} origin="480px 540px">
        <div style={{position: 'absolute', left: 150, top: 140, width: 700, textAlign: 'center', ...sc(760, 900), lineHeight: 1, color: 'currentColor'}}>{'明'}</div>
      </Plate>
      <Plate ink="black" f={f} reg={reg('black', 0, 0, 8)} origin="480px 540px">
        <div style={{position: 'absolute', left: 150, top: 140, width: 700, textAlign: 'center', ...sc(760, 900), lineHeight: 1, color: 'currentColor'}}>{'明'}</div>
        <div style={{position: 'absolute', left: 96, top: 996, ...mono(20, 700, 0.1), color: 'currentColor'}}>{'LIGHT · MULTIPLY · PINK × YELLOW × BLACK'}</div>
      </Plate>
      <div style={{color: RC.ink}}>
        <RegMark x={60} y={60} />
        <RegMark x={X - 60} y={60} />
        <RegMark x={60} y={1020} />
        <RegMark x={X - 60} y={1020} />
      </div>
    </Paper>
  );
};

// ═══════════════ 暗：Bento 界面 ═══════════════
const BentoDark: React.FC<{f: number; X: number}> = ({f, X}) => {
  const k = (at: number) => tween(f, at, 24, 0, 1, EXPO);
  const card: React.CSSProperties = {position: 'absolute', borderRadius: 40, background: '#121316', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.09)', overflow: 'hidden'};
  return (
    <div style={{position: 'absolute', left: X, top: 0, width: 1920 - X, height: 1080, background: '#0A0A0C', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 300, top: 420, width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.75), rgba(139,56,226,0.55) 45%, rgba(10,10,12,0) 70%)', filter: 'blur(40px)', opacity: 0.9 * k(4)}} />
      <div style={{...card, left: 64, top: 170, width: 832, height: 540, transform: `translateY(${(1 - k(0)) * 80}px)`, opacity: k(0)}}>
        <div style={{position: 'absolute', left: 36, top: 30, fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 500, color: '#8C8A86'}}>{'Dark mode'}</div>
        <div style={{position: 'absolute', left: 0, top: 60, width: '100%', textAlign: 'center', ...sc(560, 900), lineHeight: 1, color: '#F4F2EE', textShadow: '0 0 60px rgba(255,255,255,0.45), 0 0 140px rgba(190,120,255,0.55)'}}>{'暗'}</div>
      </div>
      <div style={{...card, left: 64, top: 760, width: 400, height: 170, transform: `translateY(${(1 - k(6)) * 80}px)`, opacity: k(6)}}>
        <div style={{position: 'absolute', left: 30, top: 26, fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 500, color: '#8C8A86'}}>{'对比度 · 墨 / 纸'}</div>
        <div style={{position: 'absolute', left: 30, top: 58, fontFamily: "'Space Grotesk', sans-serif", fontSize: 84, fontWeight: 600, letterSpacing: '-0.04em', background: 'linear-gradient(90deg, #FF3D81, #FF9A3D)', WebkitBackgroundClip: 'text', color: 'transparent'}}>{`${CONTRAST.toFixed(1)} : 1`}</div>
      </div>
      <div style={{...card, left: 496, top: 760, width: 400, height: 170, transform: `translateY(${(1 - k(10)) * 80}px)`, opacity: k(10)}}>
        <div style={{position: 'absolute', left: 30, top: 26, fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 500, color: '#8C8A86'}}>{'深色模式'}</div>
        <div style={{position: 'absolute', left: 30, top: 96, width: 112, height: 54, borderRadius: 27, background: 'linear-gradient(90deg, #FF3D81, #FF7A3D)'}}>
          <div style={{position: 'absolute', right: 6, top: 6, width: 42, height: 42, borderRadius: '50%', background: '#fff'}} />
        </div>
        <div style={{position: 'absolute', left: 162, top: 104, fontFamily: "'Noto Sans SC', sans-serif", fontSize: 30, fontWeight: 700, color: '#F4F2EE'}}>{'已开启'}</div>
      </div>
    </div>
  );
};

// ═══════════════ 图：孔版双色调照片 ═══════════════
const RisoPhoto: React.FC<{f: number; X: number}> = ({f, X}) => {
  const s = tween(f, T1, 40, 1.12, 1, EXPO);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: X, height: 1080, overflow: 'hidden', background: '#F3ECDB', isolation: 'isolate'}}>
      <Img src={staticFile('02-masonry/photos/cat.jpg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 40%', filter: 'grayscale(1) contrast(1.35) brightness(1.08)', transform: `scale(${s})`}} />
      <div style={{position: 'absolute', inset: 0, background: '#FF48B0', mixBlendMode: 'multiply', opacity: 0.92}} />
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,131,138,0) 40%, rgba(0,131,138,0.75))', mixBlendMode: 'multiply'}} />
    </div>
  );
};

// ═══════════════ 文：新粗野的卡片 ═══════════════
const NeoText: React.FC<{f: number; X: number}> = ({f, X}) => {
  const g = f - T1;
  const z = Neo.land(g, 8, NV.shadow[1], 90);
  const press = tween(g, 30, 4) * (1 - tween(g, 38, 6));
  return (
    <div style={{position: 'absolute', left: X, top: 0, width: 1920 - X, height: 1080, background: NC.yellow, overflow: 'hidden'}}>
      <Neo.Dots opacity={0.2} />
      <Neo.Box x={70} y={190} w={820} h={560} fill={NC.white} z={z} border={NV.border} style={{padding: '42px 48px'}}>
        <div style={{...neoFont(24, 700, 0.04), color: NC.grey, marginBottom: 26}}>{'neo-brutal.txt'}</div>
        {['一个字，', '就能把话', '说出声。'].map((t, i) => (
          <div key={i} style={{fontFamily: "'Noto Sans SC', sans-serif", fontWeight: 900, fontSize: 112, lineHeight: 1.12, color: NC.ink}}>
            {t}
          </div>
        ))}
      </Neo.Box>
      <Neo.Star x={820} y={200} r={88} fill={NC.pink} rot={14} shadow={8}>
        <div style={{...neoFont(40, 700, 0), color: NC.ink, transform: 'rotate(-6deg)'}}>{'TYPE!'}</div>
      </Neo.Star>
      <Neo.Box x={120} y={810} w={300} h={96} fill={NC.pink} p={press} shadow={NV.shadow[1]} border={NV.border} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{fontFamily: "'Noto Sans SC', sans-serif", fontWeight: 900, fontSize: 38, color: NC.ink}}>{'图文 → 文'}</div>
      </Neo.Box>
    </div>
  );
};

// ═══════════════ 静：瑞士 ═══════════════
const SwissStill: React.FC<{X: number}> = ({X}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: X, height: 1080, background: SW.paper, overflow: 'hidden'}}>
    {Array.from({length: 7}).map((_, i) => (
      <div key={i} style={{position: 'absolute', left: 96 + i * 146, top: 0, width: 1, height: 1080, background: SW.rule}} />
    ))}
    <div style={{position: 'absolute', left: X - 340, top: 150, width: 160, height: 160, borderRadius: '50%', background: SW.red}} />
    <div style={{position: 'absolute', left: 96, top: 600, ...swiss(250, 700, -0.06), color: SW.ink}}>{'Still'}</div>
    <div style={{position: 'absolute', left: 100, top: 880, width: 120, height: 8, background: SW.red}} />
    <div style={{position: 'absolute', left: 100, top: 912, ...swiss(30, 400, 0), color: SW.ink}}>
      {'静 · 一切都不动'}
      <span style={{color: SW.grey}}>{'  ·  0 px/s'}</span>
    </div>
  </div>
);

// ═══════════════ 动：波普 ═══════════════
const PopMotion: React.FC<{f: number; X: number}> = ({f, X}) => {
  const g = f - T2;
  const cx = X + (1920 - X) / 2;
  const pulse = Pop.beatPulse(g, 4, 0.07);
  const [sx, sy] = Pop.shake(g % 30, 0, 12, `m${Math.floor(g / 30)}`);
  return (
    <div style={{position: 'absolute', left: X, top: 0, width: 1920 - X, height: 1080, background: PC.yellow, overflow: 'hidden'}}>
      <svg width={1920} height={1080} style={{position: 'absolute', left: -X, top: 0}}>
        <Pop.Patterns f={g} />
        <Pop.Dots x={X} y={0} w={1920 - X} h={1080} pitch={30} r={(x, y) => Math.max(0, ((x - X) / (1920 - X)) * 12 + (y / 1080) * 22 - 12)} c={PC.red} o={0.9} />
        <g transform={`translate(${cx} 520) rotate(${g * 1.1}) translate(${-cx} -520)`}>
          <Pop.Speed cx={cx} cy={520} r0={330} r1={1300} n={34} p={1} w={11} seed="motion" />
        </g>
        <g transform={`translate(${cx + sx} ${520 + sy}) scale(${pulse})`}>
          <Pop.Blk d={Pop.burstD(400, 280, 13, g * 0.012, 'motion')} fill={PC.white} sw={9} sh={18} />
          <Pop.Bang x={0} y={0} size={210} k={1} rot={-8}>BAM!</Pop.Bang>
        </g>
        <Pop.Box x={X + 140} y={900} w={420} h={80} fill={PC.white} k={Pop.popS(g, 10)} rot={-2} sh={10}>
          <Pop.Txt x={210} y={56} size={40} font="cn" anchor="middle">{'动 · 每一拍都在震'}</Pop.Txt>
        </Pop.Box>
      </svg>
    </div>
  );
};

/** 一对状态的一半：k = 第几对，L = 左半 */
const Half: React.FC<{k: number; L: boolean; f: number; X: number}> = ({k, L, f, X}) => {
  if (k === 0) return L ? <RisoLight f={f} X={X} /> : <BentoDark f={f} X={X} />;
  if (k === 1) return L ? <RisoPhoto f={f} X={X} /> : <NeoText f={f} X={X} />;
  return L ? <SwissStill X={X} /> : <PopMotion f={f} X={X} />;
};

export const Contrast: React.FC<ChProps> = (p) => {
  const {f, side, X} = p;
  const L = side === 'L';
  const k = f >= T2 ? 2 : f >= T1 ? 1 : 0;
  const prev = Math.max(0, k - 1);
  const t0 = k === 2 ? T2 : T1;
  const t = k === 0 ? 1 : tween(f, t0, OPEN, 0, 1, EXPO);
  // 新的一对从中线向两边撕开
  const inset = L ? `inset(0 0 0 ${X * (1 - t)}px)` : `inset(0 ${(1920 - X) * (1 - t)}px 0 0)`;
  const front = L ? X * (1 - t) : X + (1920 - X) * t;
  const edgeColor = k === 1 ? NC.pink : PC.red;
  const names = ['明暗', '图文', '静动'];
  return (
    <Page p={p} bg={L ? RC.paper : '#0A0A0C'}>
      {/* 旧的一对在底下，新的一对从中线撕开 */}
      <Half k={k === 0 ? 0 : prev} L={L} f={f} X={X} />
      {k > 0 && (
        <div style={{position: 'absolute', inset: 0, clipPath: inset}}>
          <Half k={k} L={L} f={f} X={X} />
        </div>
      )}
      {k > 0 && t < 1 && <div style={{position: 'absolute', left: front - 6, top: 0, width: 12, height: 1080, background: '#111111'}}><div style={{position: 'absolute', left: 3, top: 0, width: 6, height: 1080, background: edgeColor}} /></div>}

      {/* 规则角标：放在一块纸色底上，照片上也看得清 */}
      {L && (
        <div style={{position: 'absolute', left: 78, top: 50, padding: '12px 18px', background: '#F5F4F0', border: '4px solid #111', boxShadow: '6px 6px 0 #111'}}>
          <RuleTag f={f} n={3} title="两边要有反差" fg="#111" sub="#6B675E" at={-6} />
        </div>
      )}
      {!L && (
        <div style={{position: 'absolute', right: 64, top: 62, padding: '10px 16px', background: '#F5F4F0', border: '4px solid #111', ...mono(22, 700, 0.14), color: '#111', opacity: tween(f, 0, 12)}}>{'一次只选一对'}</div>
      )}

      {/* 三对的进度：跨过中线的一条药丸（包豪斯黄 + 黑） */}
      <div style={{position: 'absolute', left: X - 260, top: 968, width: 520, height: 72, background: '#161514', border: '4px solid #161514', display: 'flex', zIndex: 20, transform: `scaleX(${tween(f, 14, 12, 0, 1, EXPO)})`}}>
        {names.map((n, i) => (
          <div key={i} style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: i === k ? BH.yellow : 'transparent', color: i === k ? '#161514' : '#F5F4F0', ...sc(32, 900)}}>
            {n}
          </div>
        ))}
      </div>
    </Page>
  );
};
