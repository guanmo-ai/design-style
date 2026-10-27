/**
 * 10—15 秒
 *   五个词（f600）一拍一张整屏卡片叠上来：黑框 / 硬影 / 平涂 / 露结构 / 歪一点。每张从不同方向砸进来，压住上一张
 *   片尾  （f750）整叠卡片掉下去；海报三块 NEO / BRUTAL / ISM 半拍一块砸回来，贴纸、署名；
 *                f870 光标按一下——所有阴影一起归零，再一起弹回来
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {E, clamp, shake, tween} from '../../../src/lib/anim';
import {C, V} from '../tokens';
import {AT, WORD_AT} from './timeline';
import {Box, Burst, Cursor, Dots, Star, disp, grot, lerp, mono, press, sc, slam, slamBig} from './ui';

type Word = {zh: string; en: string; code: string; fill: string; rot: number; from: [number, number]};
const WORDS: Word[] = [
  {zh: '黑框', en: 'BORDER', code: 'border: 6px solid #000;', fill: C.white, rot: -1.6, from: [-2200, 0]},
  {zh: '硬影', en: 'HARD SHADOW', code: 'box-shadow: 24px 24px 0 #000;', fill: C.pink, rot: 1.2, from: [0, -1300]},
  {zh: '平涂', en: 'FLAT COLOR', code: 'background: #B8F15A; /* no gradient */', fill: C.lime, rot: -0.8, from: [2200, 0]},
  {zh: '露结构', en: 'SHOW THE GRID', code: 'outline: 2px dashed; /* 网格画出来 */', fill: C.blue, rot: 1.6, from: [0, 1300]},
  {zh: '歪一点', en: 'TILT ONE THING', code: 'transform: rotate(-4deg);', fill: C.orange, rot: -3.2, from: [0, 0]},
];

const WordCard: React.FC<{f: number; i: number}> = ({f, i}) => {
  const w = WORDS[i];
  const at = WORD_AT[i];
  if (f < at - 12) return null;
  const k = slamBig(f, at - 12);
  const zoom = i === 4 ? lerp(2.4, 1, k) : 1;
  const dx = (1 - k) * w.from[0];
  const dy = (1 - k) * w.from[1];
  const border = i === 0 ? 22 : V.border;
  const shadow = i === 1 ? 44 : 24;
  return (
    <div style={{position: 'absolute', inset: 0, transform: `translate(${dx}px, ${dy}px) rotate(${w.rot}deg) scale(${zoom})`, opacity: i === 4 ? clamp((f - at + 12) / 3) : 1}}>
      <Box x={70} y={60} w={1780} h={960} fill={w.fill} border={border} shadow={shadow}>
        {i === 3 && (
          <svg width={1780} height={960} style={{position: 'absolute', left: -V.border, top: -V.border}}>
            {Array.from({length: 13}, (_, c) => (
              <line key={c} x1={96 + c * 132} x2={96 + c * 132} y1={0} y2={960} stroke={C.ink} strokeWidth={2} strokeDasharray="8 8" opacity={0.45} />
            ))}
            <rect x={330} y={196} width={1120} height={470} fill="none" stroke={C.orange} strokeWidth={5} strokeDasharray="16 10" />
            <rect x={410} y={256} width={960} height={350} fill="rgba(255,210,63,0.4)" stroke={C.ink} strokeWidth={3} strokeDasharray="6 6" />
          </svg>
        )}
        <div style={{position: 'absolute', left: 40, top: 34, padding: '6px 16px', background: C.ink, color: C.paper, ...mono(30, 700)}}>{`${i + 1} / 5`}</div>
        {i === 3 && (
          <>
            <div style={{position: 'absolute', left: 330, top: 150, ...mono(24, 700), background: C.orange, padding: '2px 10px', border: `3px solid ${C.ink}`}}>margin 80</div>
            <div style={{position: 'absolute', left: 1190, top: 580, ...mono(24, 700), background: C.yellow, padding: '2px 10px', border: `3px solid ${C.ink}`}}>padding 60</div>
          </>
        )}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: i === 3 ? 268 : 230,
            textAlign: 'center',
            ...sc(300, 900, 0.04),
            color: i === 1 ? C.white : C.ink,
            WebkitTextStroke: i === 1 ? `9px ${C.ink}` : undefined,
            paintOrder: 'stroke fill',
            textShadow: i === 1 ? `18px 18px 0 ${C.ink}` : undefined,
            transform: i === 4 ? 'rotate(-6deg)' : undefined,
          }}
        >
          {w.zh}
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', ...disp(72, 125, 0)}}>{w.en}</div>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 64, textAlign: 'center', ...mono(36, 700)}}>{w.code}</div>
        {i === 2 && (
          <div style={{position: 'absolute', right: 60, top: 40, display: 'flex', gap: 14}}>
            {[C.yellow, C.pink, C.lime, C.blue, C.orange].map((c) => (
              <div key={c} style={{width: 64, height: 64, boxSizing: 'border-box', background: c, border: `5px solid ${C.ink}`, boxShadow: `6px 6px 0 ${C.ink}`}} />
            ))}
          </div>
        )}
      </Box>
      {i === 4 && (
        <Star x={1690} y={190} r={120} fill={C.yellow} rot={lerp(-120, 14, clamp((f - at) / 10))} shadow={12}>
          <span style={{...disp(46, 112, 0), transform: 'rotate(0deg)'}}>RAW!</span>
        </Star>
      )}
    </div>
  );
};

export const Words: React.FC<{f: number}> = ({f}) => {
  const fall = tween(f, AT.end - 8, 18, 0, 1, E.in);
  const sh = shake(f, WORD_AT.map((t) => [t, 14] as [number, number]));
  return (
    <AbsoluteFill style={{transform: `translate(${sh.x}px, ${sh.y + fall * 1400}px) rotate(${fall * 6}deg)`}}>
      {WORDS.map((_, i) => (
        <WordCard key={i} f={f} i={i} />
      ))}
    </AbsoluteFill>
  );
};

// ───────── 片尾 ─────────

const BLOCKS = [
  {text: 'NEO', x: 110, y: 96, w: 760, h: 270, fill: C.pink, rot: -3, at: AT.end + 6, from: [-1200, -500], size: 230, wdth: 112},
  {text: 'BRUTAL', x: 96, y: 400, w: 1728, h: 290, fill: C.yellow, rot: 0, at: AT.end + 21, from: [2200, 0], size: 300, wdth: 125},
  {text: 'ISM', x: 1230, y: 730, w: 590, h: 220, fill: C.lime, rot: 2.5, at: AT.end + 36, from: [0, 900], size: 176, wdth: 125},
];

export const End: React.FC<{f: number}> = ({f}) => {
  const a = AT.end;
  const pAll = press(f, a + 120, 10); // f870：所有阴影一起归零
  const sh = shake(f, [
    ...BLOCKS.map((b) => [b.at, 12] as [number, number]),
    [a + 120, 8],
  ]);
  const cur = tween(f, a + 98, 20, 0, 1, E.inOut);
  const bar = f >= a + 78 ? slam(f, a + 78) : 0;
  const zh = f >= a + 45 ? slam(f, a + 45) : 0;
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <Dots />
      <div style={{position: 'absolute', inset: 0, transform: `translate(${sh.x}px, ${sh.y}px)`}}>
        {BLOCKS.map((b) => {
          if (f < b.at - 12) return null;
          const k = slamBig(f, b.at - 12);
          return (
            <div key={b.text} style={{position: 'absolute', inset: 0, transform: `translate(${(1 - k) * b.from[0]}px, ${(1 - k) * b.from[1]}px)`}}>
              <Box x={b.x} y={b.y} w={b.w} h={b.h} fill={b.fill} shadow={V.shadow[1]} p={pAll} rot={b.rot} style={{display: 'flex', alignItems: 'center', paddingLeft: 40}}>
                <span style={{...disp(b.size, b.wdth, -0.03), marginTop: b.size * 0.04}}>{b.text}</span>
              </Box>
            </div>
          );
        })}
        {f >= a + 43 && (
          <div style={{position: 'absolute', left: 110, top: 742, transform: `scale(${lerp(1.4, 1, zh)})`, transformOrigin: 'left center', opacity: clamp((f - a - 45) / 3)}}>
            <div style={{...sc(118, 900, 0.04)}}>新粗野主义</div>
            <div style={{marginTop: 16, display: 'flex', alignItems: 'center', gap: 20, opacity: tween(f, a + 60, 8)}}>
              <span style={{...sc(44, 900)}}>不讨好，只诚实。</span>
              <span style={{...mono(24, 700), padding: '4px 12px', border: `4px solid ${C.ink}`, background: C.white}}>border 6 · shadow 14 · blur 0</span>
            </div>
          </div>
        )}
        {f >= a + 64 && (
          <Star x={1700} y={200} r={112} fill={C.orange} rot={lerp(-160, 12, slam(f, a + 64))} shadow={12}>
            <span style={{...disp(44, 112, 0)}}>RAW!</span>
          </Star>
        )}
      </div>
      {/* 底栏 */}
      <div style={{position: 'absolute', left: 0, right: 0, top: lerp(1080, 990, bar), height: 90, background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 96px'}}>
        <span style={{...grot(30, 700, 0.02), color: C.paper}}>
          Design Style <span style={{...sc(30, 700), color: C.yellow}}>风格 009</span>
        </span>
        <span style={{...mono(30, 700), color: C.yellow}}>@guanmo_ai</span>
        <span style={{...grot(30, 700, 0.02), color: C.paper}}>2021 → NOW</span>
      </div>
      {f >= a + 96 && <Cursor x={lerp(1960, 1240, cur)} y={lerp(1140, 560, cur)} p={pAll} opacity={1 - tween(f, a + 136, 8)} />}
      <Burst x={1240} y={560} f={f} at={a + 120} />
    </AbsoluteFill>
  );
};
