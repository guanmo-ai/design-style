/**
 * 2—10 秒 · 四章。每一章是一张整屏的“卡片”：
 *   01 黑框（f120）黄底。六个默认样式组件，半拍一个描上 6px 黑框、圆角归零 → 整张卡片向左推走
 *   02 硬影（f240）纸底。模糊 40 → 0，偏移 8 / 24 / 14；三张卡片砸下来 → 蓝色的下一章从上面砸下来盖住
 *   03 按下（f360）蓝底。记账 App：按筹码、按条目、按“记一笔”，新条目弹进来；再按左边的大按钮 → 卡片向上抽走
 *   04 来历（f480）纸底。同一面网格：1952 清水混凝土 → 2014 粗野主义网页 → 2021 新粗野主义界面
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {E, clamp, spr, tween} from '../../../src/lib/anim';
import {C, V} from '../tokens';
import {AT} from './timeline';
import {Box, Burst, Cursor, Dots, Typed, appear, disp, grot, lerp, mono, press, sc, serif, slam, thud} from './ui';

type CSS = React.CSSProperties;

// ───────── 章节卡片与左栏 ─────────

/** 整屏卡片：静止时边框藏在画外；移动时黑边和 24px 硬阴影露出来 */
const Card: React.FC<{f: number; bg: string; dx?: number; dy?: number; dots?: number; children: React.ReactNode}> = ({bg, dx = 0, dy = 0, dots = 0.16, children}) => (
  <div
    style={{
      position: 'absolute',
      left: -V.border,
      top: -V.border,
      width: 1920 + 2 * V.border,
      height: 1080 + 2 * V.border,
      background: bg,
      border: `${V.border}px solid ${C.ink}`,
      boxShadow: dx || dy ? `24px 24px 0 ${C.ink}` : undefined,
      transform: `translate(${dx}px, ${dy}px)`,
      overflow: 'hidden',
    }}
  >
    <Dots opacity={dots} />
    <div style={{position: 'absolute', left: V.border, top: V.border, width: 1920, height: 1080}}>{children}</div>
  </div>
);

/** 左栏：章节筹码 → 大字 → 代码 → 一句话，逐个砸进来 */
const Label: React.FC<{f: number; at: number; n: string; en: string; zh: string; code: string[]; note: string; chip?: string; y?: number}> = ({f, at, n, en, zh, code, note, chip = C.ink, y = 170}) => {
  const k1 = f >= at + 2 ? slam(f, at + 2) : 0;
  const k2 = f >= at + 6 ? slam(f, at + 6) : 0;
  return (
    <>
      <div style={{position: 'absolute', left: 96, top: y, height: 50, padding: '0 18px', display: 'flex', alignItems: 'center', background: chip, color: chip === C.ink ? C.paper : C.ink, border: `4px solid ${C.ink}`, transform: `translateX(${(1 - k1) * -400}px)`, ...mono(24, 700, 0.06)}}>
        {`${n} / ${en}`}
      </div>
      <div style={{position: 'absolute', left: 90, top: y + 70, transform: `scale(${lerp(1.5, 1, k2)})`, transformOrigin: 'left center', opacity: clamp((f - at - 6) / 3), ...sc(200, 900, 0.02), color: C.ink}}>{zh}</div>
      <div style={{position: 'absolute', left: 96, top: y + 322, ...mono(40, 700), color: C.ink}}>
        {code.map((line, i) => (
          <div key={i}>
            <Typed f={f} at={at + 10 + i * 6} text={line} cps={3.2} caret={i === code.length - 1} />
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: 96, top: y + 340 + code.length * 50 + 14, opacity: appear(f, at + 18), ...sc(42, 900, 0.04), color: C.ink}}>{note}</div>
    </>
  );
};

// ───────── 01 黑框 ─────────

const COMP = ['button', 'input', 'card', 'toggle', 'checkbox', 'chip'];
const CELL = {x0: 760, y0: 190, w: 328, h: 360, gx: 40, gy: 40};
const HIT = (i: number) => AT.border + 12 + i * 15;

/** 一个组件的“前 / 后”。k = 0 为默认样式，1 为新粗野主义 */
const Component: React.FC<{kind: string; k: number; f: number}> = ({kind, k, f}) => {
  const soft = '0 12px 28px rgba(30,30,60,0.18)';
  const bw = k ? V.border : 0;
  const base: CSS = {position: 'absolute', boxSizing: 'border-box'};
  const sys: CSS = {fontFamily: 'Liberation Sans, Arial, sans-serif'};
  switch (kind) {
    case 'button':
      return (
        <div style={{...base, left: 34, top: 130, width: 260, height: 96, borderRadius: k ? 0 : 16, background: k ? C.pink : '#6C63FF', border: `${bw}px solid ${C.ink}`, boxShadow: k ? undefined : soft, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          {k ? <span style={{...grot(40, 700)}}>SIGN UP →</span> : <span style={{...sys, fontSize: 34, color: '#fff', fontWeight: 600}}>Sign up</span>}
        </div>
      );
    case 'input':
      return (
        <>
          <div style={{...base, left: 30, top: 96, ...(k ? mono(22, 700) : {...sys, fontSize: 22, color: '#9A9AA5'})}}>{k ? 'EMAIL' : 'Email address'}</div>
          <div style={{...base, left: 30, top: 136, width: 268, height: 90, borderRadius: k ? 0 : 14, background: C.white, border: k ? `${bw}px solid ${C.ink}` : '2px solid #E1E1E8', boxShadow: k ? undefined : '0 4px 12px rgba(30,30,60,0.08)', display: 'flex', alignItems: 'center', paddingLeft: 22}}>
            {k ? <span style={{...mono(26, 700)}}>you@site.com</span> : <span style={{...sys, fontSize: 28, color: '#B5B5BF'}}>you@site.com</span>}
          </div>
        </>
      );
    case 'card':
      return (
        <div style={{...base, left: 34, top: 40, width: 260, height: 280, borderRadius: k ? 0 : 22, background: C.white, border: `${bw}px solid ${C.ink}`, boxShadow: k ? undefined : soft, overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 0, top: 0, right: 0, height: 150, background: k ? C.blue : 'linear-gradient(135deg, #ECECF2, #D3D3DE)', borderBottom: k ? `${V.border}px solid ${C.ink}` : undefined}}>
            {k ? (
              <svg width="248" height="144" style={{position: 'absolute', left: 0, top: 0}}>
                <circle cx="190" cy="44" r="22" fill={C.yellow} stroke={C.ink} strokeWidth="5" />
                <path d="M-10 150 L80 60 L150 130 L190 96 L270 150 Z" fill={C.lime} stroke={C.ink} strokeWidth="5" strokeLinejoin="round" />
              </svg>
            ) : null}
          </div>
          {k ? (
            <>
              <div style={{position: 'absolute', left: 20, top: 172, ...grot(32, 700)}}>Hello, world</div>
              <div style={{position: 'absolute', left: 20, top: 218, ...mono(20, 400)}}>2 min read →</div>
            </>
          ) : (
            <>
              <div style={{position: 'absolute', left: 22, top: 180, width: 180, height: 18, borderRadius: 9, background: '#DADAE2'}} />
              <div style={{position: 'absolute', left: 22, top: 216, width: 130, height: 14, borderRadius: 7, background: '#E8E8EE'}} />
            </>
          )}
        </div>
      );
    case 'toggle': {
      const on = k ? tween(f, HIT(3) + 4, 8, 0, 1, E.out) : 0;
      return (
        <div style={{...base, left: 64, top: 130, width: 200, height: 100, borderRadius: 50, background: k ? C.lime : '#E3E3EA', border: `${bw}px solid ${C.ink}`, boxShadow: k ? undefined : 'inset 0 2px 6px rgba(0,0,0,0.12)'}}>
          <div style={{position: 'absolute', top: k ? 8 : 10, left: lerp(k ? 8 : 10, 106, on), width: k ? 72 : 80, height: k ? 72 : 80, borderRadius: 40, background: C.white, border: `${bw}px solid ${C.ink}`, boxShadow: k ? undefined : '0 4px 10px rgba(0,0,0,0.25)'}} />
        </div>
      );
    }
    case 'checkbox':
      return (
        <>
          {['Grid', 'Border', 'Shadow'].map((t, i) => (
            <div key={i} style={{...base, left: 40, top: 70 + i * 76, display: 'flex', alignItems: 'center', gap: 20}}>
              <div style={{width: 48, height: 48, boxSizing: 'border-box', borderRadius: k ? 0 : 10, border: k ? `5px solid ${C.ink}` : '2px solid #C9C9D3', background: k && i < 2 ? C.ink : C.white, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                {k && i < 2 ? <svg width="28" height="24"><path d="M3 12 L11 20 L25 4" fill="none" stroke={C.yellow} strokeWidth="6" /></svg> : null}
              </div>
              <span style={k ? grot(34, 700) : {...sys, fontSize: 30, color: '#8D8D99'}}>{t}</span>
            </div>
          ))}
        </>
      );
    default:
      return (
        <div style={{...base, left: 20, top: 136, width: 288, height: 88, borderRadius: 44, background: k ? C.white : '#EEEEF3', border: `${bw}px solid ${C.ink}`, boxShadow: k ? undefined : soft, display: 'flex', alignItems: 'center', gap: 16, paddingLeft: 12}}>
          <div style={{width: 60, height: 60, boxSizing: 'border-box', borderRadius: 30, background: k ? C.orange : '#C9C9D6', border: `${k ? 5 : 0}px solid ${C.ink}`}} />
          <span style={k ? grot(30, 700) : {...sys, fontSize: 28, color: '#6E6E7A'}}>@guanmo_ai</span>
        </div>
      );
  }
};

export const Borders: React.FC<{f: number}> = ({f}) => {
  const out = tween(f, AT.shadow - 15, 15, 0, 1, E.in);
  return (
    <Card f={f} bg={C.yellow} dx={out * -2000} dots={0.14}>
      <Label f={f} at={AT.border} n="01" en="BORDER" zh="黑框" code={['border: 6px solid #000;', 'border-radius: 0;']} note="每个元素都描到底" />
      {COMP.map((kind, i) => {
        const c = i % 3;
        const r = Math.floor(i / 3);
        const x = CELL.x0 + c * (CELL.w + CELL.gx);
        const y = CELL.y0 + r * (CELL.h + CELL.gy);
        const hit = HIT(i);
        const k = f >= hit ? 1 : 0;
        const stamp = f >= hit ? lerp(1.14, 1, tween(f, hit, 8, 0, 1, E.out)) : 1;
        const flash = f >= hit ? clamp(1 - (f - hit) / 10) : 0;
        return (
          <div key={kind} style={{position: 'absolute', left: x, top: y, width: CELL.w, height: CELL.h}}>
            <div style={{position: 'absolute', inset: 0, border: `2px dashed rgba(0,0,0,${0.35 + 0.4 * flash})`, background: `rgba(255,255,255,${0.35 + 0.4 * flash})`}} />
            <div style={{position: 'absolute', inset: 0, transform: `scale(${stamp})`}}>
              <Component kind={kind} k={k} f={f} />
            </div>
            <div style={{position: 'absolute', left: 12, bottom: 8, ...mono(24, 700), color: C.ink}}>
              {kind}
              <span style={{opacity: k ? 1 : 0.4}}>{k ? ' · 6px #000' : ' · default'}</span>
            </div>
          </div>
        );
      })}
    </Card>
  );
};

// ───────── 02 硬影 ─────────

const Slider: React.FC<{x: number; y: number; label: string; v: number; max: number; unit?: string; hot?: boolean}> = ({x, y, label, v, max, unit = 'px', hot}) => {
  const W = 470;
  const p = clamp(v / max);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: W}}>
      <div style={{display: 'flex', justifyContent: 'space-between', ...mono(26, 700)}}>
        <span>{label}</span>
        <span style={{background: hot ? C.yellow : 'transparent', padding: '0 8px'}}>{`${Math.round(v)}${unit}`}</span>
      </div>
      <div style={{position: 'relative', marginTop: 14, height: 24, border: `4px solid ${C.ink}`, background: C.white}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${p * 100}%`, background: C.ink}} />
        <div style={{position: 'absolute', left: `calc(${p * 100}% - 20px)`, top: -16, width: 40, height: 48, boxSizing: 'border-box', background: C.pink, border: `4px solid ${C.ink}`, boxShadow: `4px 4px 0 ${C.ink}`}} />
      </div>
    </div>
  );
};

// 层级 = 偏移量：越“高”的卡片阴影越长
const DROPS = [
  {x: 1590, y: 150, w: 260, h: 190, rot: 5, fill: C.pink, at: 318, text: '4px', s: 4},
  {x: 1610, y: 770, w: 230, h: 200, rot: -4, fill: C.lime, at: 326, text: '8px', s: 8},
  {x: 830, y: 780, w: 600, h: 170, rot: -2, fill: C.blue, at: 334, text: '层级 = 偏移量', s: 14},
];

export const Shadows: React.FC<{f: number}> = ({f}) => {
  const a = AT.shadow;
  const blur = lerp(40, 0, tween(f, a + 6, 26, 0, 1, E.inOut));
  const soft = clamp(blur / 40);
  // 偏移：跟着模糊一起长到 14，再按半拍跳 8 → 24 → 14
  let off = lerp(0, 14, 1 - soft);
  const steps: [number, number, number][] = [
    [a + 45, 14, 8],
    [a + 60, 8, 24],
    [a + 75, 24, 14],
  ];
  for (const [at, from, to] of steps) if (f >= at) off = lerp(from, to, spr(f, at, {damping: 12, mass: 0.5, stiffness: 300}));
  const k = 1 - soft;
  const shadowCss = `${off}px ${lerp(30, off, k)}px ${blur}px rgba(0,0,0,${lerp(0.3, 1, k)})`;
  const snap = f >= a + 32 ? clamp(1 - (f - a - 32) / 12) : 0;
  const sh = {x: 0, y: thud(f, [
    [318, 5],
    [326, 5],
    [334, 7],
  ])};
  const card = {x: 820, y: 260, w: 700, h: 420};
  return (
    <Card f={f} bg={C.paper}>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${sh.x}px, ${sh.y}px)`}}>
        <Label f={f} at={a} n="02" en="SHADOW" zh="硬影" code={['box-shadow:', '  14px 14px 0 #000;']} note="模糊永远是 0" chip={C.yellow} />
        <Slider x={96} y={760} label="blur" v={blur} max={40} hot={blur < 0.5} />
        <Slider x={96} y={880} label="offset" v={off} max={24} hot={f >= a + 45} />
        {/* 主卡片 */}
        <div
          style={{
            position: 'absolute',
            left: card.x,
            top: card.y,
            width: card.w,
            height: card.h,
            boxSizing: 'border-box',
            background: C.white,
            border: `${V.border}px solid ${C.ink}`,
            boxShadow: shadowCss,
            transform: `scale(${1 + 0.04 * snap})`,
          }}
        >
          <div style={{position: 'absolute', left: 44, top: 64, ...disp(104, 112), color: C.ink}}>SHADOW</div>
          <div style={{position: 'absolute', left: 48, top: 214, ...sc(46, 900), color: C.ink}}>阴影 = 偏移的黑块</div>
          <div style={{position: 'absolute', left: 48, top: 300, ...mono(26, 700), color: C.ink}}>{`x = y = ${Math.round(off)}px · blur ${Math.round(blur)}`}</div>
        </div>
        {/* 偏移的尺寸标注 */}
        {f >= a + 40 && (
          <div style={{position: 'absolute', left: card.x + card.w, top: card.y + card.h, opacity: appear(f, a + 40, 6)}}>
            <svg width={160} height={160} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
              <path d={`M0 ${off + 30} H${off} M0 ${off + 22} V${off + 38} M${off} ${off + 22} V${off + 38}`} stroke={C.ink} strokeWidth="4" fill="none" />
            </svg>
            <div style={{position: 'absolute', left: off + 18, top: off + 14, background: C.yellow, border: `4px solid ${C.ink}`, padding: '4px 12px', ...mono(34, 700)}}>{`${Math.round(off)}px`}</div>
          </div>
        )}
        {/* 砸下来的三张 */}
        {DROPS.map((d, i) => {
          if (f < d.at - 10) return null;
          const k2 = slam(f, d.at - 8);
          return (
            <Box key={i} x={d.x} y={lerp(-700, d.y, k2)} w={d.w} h={d.h} fill={d.fill} shadow={d.s} rot={d.rot} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <span style={i === 2 ? sc(48, 900) : mono(64, 700)}>{d.text}</span>
            </Box>
          );
        })}
      </div>
    </Card>
  );
};

// ───────── 03 按下 ─────────

const PH = {x: 1150, y: 132, w: 540, sx: 1168, sy: 150};
const CHIP = (i: number) => ({x: PH.sx + 28 + i * 112, y: PH.sy + 330, w: 100, h: 52});
const ITEM = 94;
const ITEM_Y = (i: number) => PH.sy + 410 + i * ITEM;
const BTN = {x: PH.sx + 28, y: PH.sy + 712, w: 448, h: 76};
const BIG = {x: 96, y: 830, w: 520, h: 150};

/** 光标路径：[帧, x, y]，帧之间 inOut */
const PATH: [number, number, number][] = [
  [AT.press + 2, 1960, 1140],
  [AT.press + 24, CHIP(1).x + 56, CHIP(1).y + 30],
  [AT.press + 32, CHIP(1).x + 56, CHIP(1).y + 30],
  [AT.press + 42, PH.sx + 300, ITEM_Y(0) + 46],
  [AT.press + 48, PH.sx + 300, ITEM_Y(0) + 46],
  [AT.press + 58, BTN.x + 300, BTN.y + 42],
  [AT.press + 76, BTN.x + 300, BTN.y + 42],
  [AT.press + 88, BIG.x + 380, BIG.y + 80],
];
const along = (f: number) => {
  if (f <= PATH[0][0]) return {x: PATH[0][1], y: PATH[0][2]};
  for (let i = 1; i < PATH.length; i++) {
    const [f1, x1, y1] = PATH[i];
    const [f0, x0, y0] = PATH[i - 1];
    if (f <= f1) {
      const t = E.inOut(clamp((f - f0) / (f1 - f0)));
      return {x: lerp(x0, x1, t), y: lerp(y0, y1, t)};
    }
  }
  const last = PATH[PATH.length - 1];
  return {x: last[1], y: last[2]};
};

const ICON: Record<string, string> = {
  cup: 'M-13 -7 H9 V7 A7 7 0 0 1 2 14 H-6 A7 7 0 0 1 -13 7 Z M9 -2 H13 A5 5 0 0 1 13 8 H9',
  train: 'M-12 -14 H12 V7 H-12 Z M-12 -2 H12 M-7 14 L-4 7 M7 14 L4 7',
  bowl: 'M-15 -1 H15 A15 15 0 0 1 -15 -1 Z M-5 -4 L9 -17 M1 -4 L14 -15',
  tea: 'M-10 -12 H10 L7 14 H-7 Z M-10 -5 H10 M2 -12 L6 -20',
};

const Item: React.FC<{y: number; icon: string; name: string; when: string; amt: string; col: string; p?: number; scale?: number}> = ({y, icon, name, when, amt, col, p = 0, scale = 1}) => (
  <Box x={PH.sx + 28} y={y} w={448} h={80} fill={C.white} border={4} shadow={6} p={p} scale={scale}>
    <div style={{position: 'absolute', left: 14, top: 10, width: 54, height: 54, boxSizing: 'border-box', background: col, border: `4px solid ${C.ink}`}}>
      <svg width="46" height="46" style={{position: 'absolute', left: 0, top: 0}}>
        <path d={ICON[icon]} transform="translate(23 23)" fill="none" stroke={C.ink} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
    <div style={{position: 'absolute', left: 88, top: 12, ...sc(26, 700)}}>{name}</div>
    <div style={{position: 'absolute', left: 88, top: 48, ...mono(17, 400), opacity: 0.65}}>{when}</div>
    <div style={{position: 'absolute', right: 18, top: 20, ...grot(34, 700)}}>{amt}</div>
  </Box>
);

export const Press: React.FC<{f: number}> = ({f}) => {
  const a = AT.press;
  const enter = tween(f, a - 14, 14, 0, 1, E.in);
  const exit = tween(f, AT.lineage - 14, 14, 0, 1, E.in);
  const sh = {x: 0, y: thud(f, [[a, 12]])};
  const chipP = press(f, a + 30, 99, false);
  const itemP = press(f, a + 45, 4);
  const btnP = press(f, a + 60, 8);
  const bigP1 = press(f, a + 90, 4);
  const bigP2 = press(f, a + 105, 99, false);
  const added = f >= a + 72 ? slam(f, a + 72) : 0;
  const balance = f >= a + 74 ? Math.round(lerp(3280, 3262, clamp((f - a - 74) / 10))) : 3280;
  const cur = along(f);
  const curP = Math.max(chipP * (f < a + 40 ? 1 : 0), itemP, btnP, bigP1, bigP2);
  const items = [
    {icon: 'cup', name: '咖啡', when: '今天 08:12', amt: '−32', col: C.pink},
    {icon: 'train', name: '地铁', when: '今天 08:40', amt: '−4', col: C.lime},
    {icon: 'bowl', name: '午饭', when: '昨天 12:30', amt: '−46', col: C.orange},
  ];
  return (
    <div style={{position: 'absolute', inset: 0, transform: `translateY(${(1 - enter) * -1150 - exit * 1200}px)`}}>
      <Card f={f} bg={C.blue} dy={enter < 1 || exit > 0 ? 1 : 0} dots={0.2}>
        <div style={{position: 'absolute', inset: 0, transform: `translate(${sh.x}px, ${sh.y}px)`}}>
          <Label f={f} at={a} n="03" en="PRESS" zh="按下" code={[':active {', '  translate: 14px 14px;', '  box-shadow: none;', '}']} note="位移 = 阴影，阴影 → 0" chip={C.yellow} />
          <Box x={BIG.x} y={BIG.y} w={BIG.w} h={BIG.h} fill={f >= a + 90 ? C.pink : C.yellow} shadow={14} p={Math.max(bigP1, bigP2)} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <span style={{...sc(64, 900)}}>{f >= a + 90 ? '按下去 ✓' : '按我 →'}</span>
          </Box>
          {/* 手机 */}
          <div style={{position: 'absolute', left: PH.x + 14, top: PH.y + 14, width: PH.w, height: 1100, borderRadius: 64, background: C.ink}} />
          <div style={{position: 'absolute', left: PH.x, top: PH.y, width: PH.w, height: 1100, borderRadius: 64, background: C.ink}} />
          <div style={{position: 'absolute', left: PH.sx, top: PH.sy, width: 504, height: 1100, borderRadius: 48, background: C.paper, overflow: 'hidden'}}>
            <div style={{position: 'absolute', left: 34, top: 26, ...mono(20, 700)}}>9:41</div>
            <div style={{position: 'absolute', left: 30, top: 74, ...sc(42, 900)}}>十月</div>
            <div style={{position: 'absolute', left: 124, top: 90, ...mono(22, 700)}}>/ 2026</div>
          </div>
          <Box x={PH.sx + 410} y={PH.sy + 66} w={60} h={60} fill={C.white} border={4} shadow={5} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <span style={{...grot(44, 700)}}>+</span>
          </Box>
          <Box x={PH.sx + 28} y={PH.sy + 140} w={448} h={164} fill={C.yellow} shadow={10}>
            <div style={{position: 'absolute', left: 22, top: 18, ...mono(20, 700)}}>BALANCE · 本月可用</div>
            <div style={{position: 'absolute', left: 20, top: 52, ...grot(72, 700, -0.04)}}>{`¥${balance.toLocaleString('en-US')}`}</div>
            <div style={{position: 'absolute', left: 22, right: 22, top: 120, height: 24, boxSizing: 'border-box', border: `4px solid ${C.ink}`, background: C.white}}>
              <div style={{width: `${62 + 0.6 * clamp((f - a - 74) / 10)}%`, height: '100%', background: C.ink}} />
            </div>
          </Box>
          {['全部', '餐饮', '交通', '订阅'].map((t, i) => {
            const c = CHIP(i);
            const active = i === 1 ? chipP > 0.5 : i === 0 ? chipP <= 0.5 : false;
            const fill = active ? C.ink : [C.white, C.pink, C.lime, C.white][i];
            return (
              <Box key={t} x={c.x} y={c.y} w={c.w} h={c.h} fill={fill} border={4} shadow={active ? 0 : 5} p={i === 1 ? chipP : 0} r={26} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <span style={{...sc(22, 700), color: active ? C.paper : C.ink}}>{t}</span>
              </Box>
            );
          })}
          {/* 列表：新条目弹进来，下面的往下挤，最后一条被裁掉 */}
          <div style={{position: 'absolute', left: 0, top: ITEM_Y(0) - 10, width: 1920, height: 3 * ITEM + 6, overflow: 'hidden'}}>
            <div style={{position: 'absolute', left: 0, top: -(ITEM_Y(0) - 10), width: 1920, height: 1080}}>
              {f >= a + 70 && <Item y={ITEM_Y(0)} icon="tea" name="奶茶" when="刚刚" amt="−18" col={C.blue} scale={lerp(0.2, 1, added)} />}
              {items.map((it, i) => (
                <Item key={it.name} y={ITEM_Y(i) + ITEM * added} {...it} p={i === 0 ? itemP : 0} />
              ))}
            </div>
          </div>
          <Box x={BTN.x} y={BTN.y} w={BTN.w} h={BTN.h} fill={C.pink} shadow={10} p={btnP} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <span style={{...sc(34, 900)}}>+ 记一笔</span>
          </Box>
          <Burst x={CHIP(1).x + 56} y={CHIP(1).y + 30} f={f} at={a + 30} r0={20} />
          <Burst x={BTN.x + 300} y={BTN.y + 42} f={f} at={a + 60} />
          <Burst x={BIG.x + 380} y={BIG.y + 80} f={f} at={a + 90} />
          <Burst x={BIG.x + 380} y={BIG.y + 80} f={f} at={a + 105} />
          {f >= a + 2 && <Cursor x={cur.x} y={cur.y} p={curP} />}
        </div>
      </Card>
    </div>
  );
};

// ───────── 04 来历 ─────────

const G = {x: 700, y: 170, w: 1124, h: 780, cols: 5, rows: 4, gap: 0};
const ERA = [
  {at: AT.lineage, year: '1952', zh: '清水混凝土', en: 'BÉTON BRUT', note: ['勒·柯布西耶 · 马赛公寓', '材料不粉饰，结构露在外面']},
  {at: AT.lineage + 40, year: '2014', zh: '粗野主义网页', en: 'BRUTALIST WEB', note: ['brutalistwebsites.com', '浏览器默认样式，原样上线']},
  {at: AT.lineage + 76, year: '2021', zh: '新粗野主义', en: 'NEO-BRUTALISM', note: ['Gumroad 等产品带进主流', '黑框、硬影、平涂——还好用']},
];
const WEB = ['index', 'about', 'work', 'blog', 'contact', '<table>', 'Times', 'links', 'raw', 'html', '1px', 'serif', 'home', 'news', 'faq', 'shop', 'zine', 'radio', 'tags', 'rss'];
const UI_BITS = ['¥', '★', '→', '62%', '9:41', 'OK', '+', '✓', 'NEW', '♪', '24px', '01', 'Aa', '#000', 'A+', '●', '↗', '?', 'GO', '∞'];
const LOGGIA = [C.orange, C.yellow, C.blue, C.lime];
const FILLS = [C.yellow, C.pink, C.lime, C.blue, C.orange, C.white];

export const Lineage: React.FC<{f: number}> = ({f}) => {
  const a = AT.lineage;
  const rise = f >= a - 2 ? slam(f, a - 2) : 0;
  let era = 0;
  ERA.forEach((e, i) => {
    if (f >= e.at) era = i;
  });
  const cw = G.w / G.cols;
  const ch = G.h / G.rows;
  const concrete = 1 - tween(f, ERA[1].at, 10, 0, 1, E.out);
  const sh = {x: 0, y: 0};
  return (
    <Card f={f} bg={C.paper}>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${sh.x}px, ${sh.y}px)`}}>
        <div style={{position: 'absolute', left: 96, top: 170, height: 50, padding: '0 18px', display: 'flex', alignItems: 'center', background: C.ink, color: C.paper, ...mono(24, 700, 0.06)}}>04 / LINEAGE</div>
        {ERA.map((e, i) => {
          if (i !== era) return null;
          const k = slam(f, e.at);
          return (
            <div key={i} style={{position: 'absolute', left: 90, top: 250, transform: `translateY(${(1 - k) * 60}px)`, opacity: clamp((f - e.at) / 4)}}>
              <div style={{...disp(200, 112), color: C.ink}}>{e.year}</div>
              <div style={{marginTop: 20, ...sc(64, 900), color: C.ink}}>{e.zh}</div>
              <div style={{marginTop: 14, ...grot(30, 700, 0.06), color: C.ink}}>{e.en}</div>
              <div style={{marginTop: 34, ...sc(34, 700), lineHeight: 1.5, color: C.ink}}>
                {e.note.map((n) => (
                  <div key={n}>{n}</div>
                ))}
              </div>
            </div>
          );
        })}
        {/* 时间刻度 */}
        <div style={{position: 'absolute', left: 96, top: 900, display: 'flex', gap: 14}}>
          {ERA.map((e, i) => (
            <div key={i} style={{padding: '6px 14px', border: `4px solid ${C.ink}`, background: i === era ? C.yellow : i < era ? C.ink : C.white, color: i < era ? C.paper : C.ink, ...mono(22, 700)}}>{e.year}</div>
          ))}
        </div>
        {/* 同一面网格 */}
        <div style={{position: 'absolute', left: G.x, top: G.y + (1 - rise) * 900, width: G.w, height: G.h}}>
          {/* 混凝土本体 */}
          <div style={{position: 'absolute', inset: 0, opacity: concrete, background: C.concrete}}>
            <svg width={G.w} height={G.h} style={{position: 'absolute', inset: 0}}>
              <filter id="cnc">
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="52" />
                <feColorMatrix values="0 0 0 0 0.25  0 0 0 0 0.24  0 0 0 0 0.22  0 0 0 0.55 0" />
              </filter>
              <rect width={G.w} height={G.h} filter="url(#cnc)" />
              {Array.from({length: 26}, (_, i) => (
                <line key={i} x1={0} x2={G.w} y1={i * 30 + 6} y2={i * 30 + 6} stroke="#00000018" strokeWidth={2} />
              ))}
            </svg>
          </div>
          <div style={{position: 'absolute', inset: 0, background: C.white, border: `2px solid ${C.ink}`, opacity: (1 - concrete) * (1 - tween(f, ERA[2].at, 12, 0, 1, E.out))}} />
          {Array.from({length: G.cols * G.rows}, (_, n) => {
            const c = n % G.cols;
            const r = Math.floor(n / G.cols);
            const x = c * cw;
            const y = r * ch;
            const d = (c + r) * 2;
            const tB = f - ERA[1].at - d;
            const tC = f - ERA[2].at - d;
            const toC = tC >= 0 ? slam(f, ERA[2].at + d) : 0;
            const phase = tC >= 0 ? 2 : tB >= 4 ? 1 : 0;
            // 翻牌：4 帧压扁，4 帧展开
            const sy = phase === 0 ? 1 - clamp(tB / 4) : phase === 1 ? clamp((tB - 4) / 4) : 1;
            if (phase === 0) {
              // 窗洞 + 阳台板 + 彩色侧墙（马赛公寓的 polychromy）
              const lg = (c * 7 + r * 3) % 5 < 2 ? LOGGIA[(c + r) % 4] : null;
              return (
                <div key={n} style={{position: 'absolute', left: x, top: y, width: cw, height: ch, transform: `scaleY(${sy})`}}>
                  <div style={{position: 'absolute', left: 18, top: 16, right: 18, bottom: 34, background: '#3B3934', boxShadow: 'inset 10px 10px 0 #2A2925'}} />
                  {lg && <div style={{position: 'absolute', left: 18, top: 16, width: 34, bottom: 34, background: lg}} />}
                  <div style={{position: 'absolute', left: 0, right: 0, bottom: 14, height: 20, background: C.concreteDark}} />
                </div>
              );
            }
            if (phase === 1) {
              return (
                <div key={n} style={{position: 'absolute', left: x, top: y, width: cw, height: ch, boxSizing: 'border-box', border: `1px solid ${C.ink}`, transform: `scaleY(${sy})`, padding: 14}}>
                  <div style={{...serif(30, 700)}}>{WEB[n].startsWith('<') ? WEB[n] : WEB[n][0].toUpperCase() + WEB[n].slice(1)}</div>
                  <div style={{...serif(22), color: C.link, textDecoration: 'underline', marginTop: 8}}>{WEB[(n + 7) % WEB.length]}</div>
                  <div style={{...serif(22), color: C.link, textDecoration: 'underline'}}>{WEB[(n + 13) % WEB.length]}</div>
                </div>
              );
            }
            const inset = lerp(0, 12, toC);
            return (
              <Box
                key={n}
                x={x + inset}
                y={y + inset}
                w={cw - 2 * inset}
                h={ch - 2 * inset}
                fill={FILLS[(c * 3 + r * 2) % FILLS.length]}
                border={lerp(1, V.border, Math.min(1, toC))}
                shadow={10 * toC}
                rot={((c + r) % 3 === 0 ? 1.5 : 0) * toC}
                style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}
              >
                <span style={{...grot(n % 4 === 0 ? 70 : 48, 700)}}>{UI_BITS[n]}</span>
              </Box>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
