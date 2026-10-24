/**
 * 008 · Risograph —— 2–15s（孔版、分色、叠印、小志、五个词、片尾）
 * 衔接靠“孔 / 版 / 纸”接力：开场钻进 O 的孔 → 热敏头在版上烧孔 → 油墨挤出来变成第一张印品
 * → 同构图再过三遍机器（分色）→ 三张版拆开再叠回去（叠印）→ 纸一张张飞出来变成小志
 * → 五个词各用自己的印法演示自己 → 片尾回到商店海报。
 */
import React from 'react';
import {E, spr, tween} from '../../../src/lib/anim';
import {C, INK, INK_NAME, INKS, Ink, OVERPRINT} from '../tokens';
import {ShopArt, TITLE_X, TS, TitleWord, flyReg} from './opening';
import {Plate, Reg, RegMark, addReg, halftonePath, jitter} from './riso';
import {AT, WORD_AT} from './timeline';
import {Show, T, c01, disp, lerp, mono, sc} from './ui';

type P = {f: number};

const Rise: React.FC<{f: number; at: number; top: number; h: number; out?: number; dur?: number; children: React.ReactNode}> = ({f, at, top, h, out = 1e9, dur = 16, children}) => {
  const p = tween(f, at, dur, 0, 1, E.out);
  const q = tween(f, out, 12, 0, 1, E.in);
  if (p <= 0.001 || q >= 0.999) return null;
  return (
    <div style={{position: 'absolute', left: 0, top, width: 1920, height: h, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: -top + (1 - p) * h - q * h, width: 1920, height: 1080}}>{children}</div>
    </div>
  );
};

/* ═══════════════════════ 01 孔版：热敏头烧孔 → 油墨挤出来 → 揭开版纸 ═══════════════════════ */
const HOLES = (() => {
  const out: [number, number, number][] = [];
  for (let j = 0; j < 18; j++) {
    for (let i = 0; i < 32; i++) {
      const x = 160 + i * 50 + ((j % 2) * 25);
      const y = 150 + j * 44;
      // 中间一个大“孔”字的区域更密
      const cx = (x - 960) / 520;
      const cy = (y - 500) / 280;
      const inO = cx * cx + cy * cy < 1;
      if (inO || (i + j) % 2 === 0) out.push([x, y, inO ? 8 : 3.6]);
    }
  }
  return out;
})();

export const Stencil: React.FC<P> = ({f}) => {
  const t0 = AT.stencil;
  const scan = tween(f, t0, 50, 0, 1, E.inOut); // 热敏头从左扫到右
  const flood = tween(f, t0 + 48, 28, 0, 1, E.out); // 粉墨从孔里涌出来
  const peel = tween(f, t0 + 78, 36, 0, 1, E.inOut); // 揭开版纸
  const headX = 80 + scan * 1760;
  return (
    <>
      {/* 版纸底 */}
      <div style={{position: 'absolute', inset: 0, background: C.master, transform: `translateY(${-peel * 1080}px) rotate(${-peel * 4}deg)`, transformOrigin: '50% 0%'}}>
        <div style={{position: 'absolute', inset: 24, border: `2px dashed ${C.grey}`, opacity: 0.45}} />
        <Plate ink="black" f={f} grain="solid" density={0.72} boil={false}>
          <T k="mono" x={80} y={72} size={22} style={{...mono(20, 700, 0.14), color: 'currentColor'}}>
            MASTER · THERMAL HEAD · 300 dpi
          </T>
          <T k="sc" x={80} y={118} size={28} style={{...sc(28, 700, 0.08), color: 'currentColor'}}>
            制版：在薄膜上烧掉微孔
          </T>
        </Plate>
        {/* 已经烧开的孔 */}
        {HOLES.map(([x, y, r], i) => {
          const burned = x < headX - 20;
          if (!burned) return null;
          const grow = spr(f, t0 + (x / 1920) * 48, {damping: 14, mass: 0.5, stiffness: 220}, 16);
          const R = r * grow;
          return <div key={i} style={{position: 'absolute', left: x - R, top: y - R, width: R * 2, height: R * 2, borderRadius: '50%', background: '#1a1814'}} />;
        })}
        {/* 热敏头 */}
        <div style={{position: 'absolute', left: headX - 10, top: 80, width: 20, height: 920, background: `linear-gradient(90deg, transparent, ${C.hot}, transparent)`, opacity: 0.95 * (1 - flood), boxShadow: `0 0 28px ${C.hot}`}} />
        <div style={{position: 'absolute', left: headX - 36, top: 40, width: 72, height: 28, background: C.drum, color: C.hot, ...mono(11, 700, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 1 - flood}}>
          HEAD
        </div>
      </div>
      {/* 粉墨从孔里挤到纸上 */}
      <Plate ink="pink" f={f} grain="solid" reg={jitter(f, 'pink', 0.5)} style={{clipPath: `inset(0 ${((1 - flood) * 100).toFixed(2)}% 0 0)`}}>
        <div style={{position: 'absolute', left: 960 - 280, top: 220, width: 560, height: 560, borderRadius: '50%', background: 'currentColor'}} />
        {HOLES.filter(([, , r]) => r > 6).slice(0, 40).map(([x, y], i) => (
          <div key={i} style={{position: 'absolute', left: x - 18, top: y - 18, width: 36, height: 36, borderRadius: '50%', background: 'currentColor', transform: `scale(${0.4 + 0.6 * flood})`}} />
        ))}
      </Plate>
      <Plate ink="black" f={f} grain="solid" density={0.86}>
        <Show f={f} at={t0 + 8} out={t0 + 78} dy={14}>
          <T x={80} y={1000} size={72} style={{...disp(72, 900, 80, -0.02), color: 'currentColor'}}>
            01  孔
          </T>
        </Show>
        <Show f={f} at={t0 + 86} dy={16}>
          <T k="sc" x={80} y={980} size={36} style={{...sc(36, 700, 0.06), color: 'currentColor'}}>
            油墨从孔里挤到纸上。
          </T>
        </Show>
      </Plate>
    </>
  );
};

/* ═══════════════════════ 02 分色：同构图过三遍机器，再把四张版拆开 ═══════════════════════ */
const PASS: {at: number; ink: Ink; label: string}[] = [
  {at: 240, ink: 'teal', label: '2nd PASS · TEAL'},
  {at: 270, ink: 'yellow', label: '3rd PASS · SUNFLOWER'},
  {at: 300, ink: 'black', label: '4th PASS · BLACK'},
];
const SPLIT = 318; // 四张版扇开
const splitReg = (f: number, ink: Ink): Reg => {
  const p = tween(f, SPLIT, 22, 0, 1, E.inOut);
  const fan: Record<Ink, Reg> = {
    pink: {x: -220, y: -70, r: -7},
    teal: {x: -70, y: 30, r: -2},
    yellow: {x: 80, y: -20, r: 2.5},
    black: {x: 230, y: 60, r: 6},
  };
  const a = fan[ink];
  return {x: a.x * p, y: a.y * p, r: (a.r ?? 0) * p};
};

export const Passes: React.FC<P> = ({f}) => {
  const t0 = AT.passes;
  // 粉已经在上一幕印上；这里接着印青、黄、黑
  const live: Ink[] = ['pink'];
  for (const p of PASS) if (f >= p.at) live.push(p.ink);
  const feed = PASS.reduce((acc, p) => acc + (f >= p.at && f < p.at + 16 ? tween(f, p.at, 10, 1, 0, E.out) : 0), 0);
  return (
    <>
      {/* 进纸：每过一色，整张纸从右边抽一下 */}
      <div style={{position: 'absolute', inset: 0, transform: `translateX(${feed * 80}px)`}}>
        {INKS.map((ink) => {
          if (!live.includes(ink) && f < SPLIT) return null;
          const enter = ink === 'pink' ? 1 : tween(f, PASS.find((p) => p.ink === ink)!.at, 12, 0, 1, E.out);
          const reg = addReg(splitReg(f, ink), jitter(f, ink, 0.55));
          return (
            <Plate key={ink} ink={ink} f={f} reg={reg} grain={ink === 'black' ? 't70' : 'solid'} style={{opacity: enter}}>
              <ShopArt ink={ink} />
              {ink === 'black' && (
                <>
                  <T x={TITLE_X} y={268} size={TS} style={{...disp(TS, 900, 100, -0.02), color: 'currentColor'}}>
                    RISOGRAPH
                  </T>
                  <T k="sc" x={960} y={342} size={40} align="center" style={{...sc(40, 900, 0.14), color: 'currentColor'}}>
                    孔版印刷
                  </T>
                </>
              )}
            </Plate>
          );
        })}
      </div>
      {PASS.map((p) => (
        <Plate key={p.label} ink={p.ink} f={f} grain="solid">
          <Show f={f} at={p.at} out={p.at + 26} dy={10}>
            <T k="mono" x={80} y={80} size={22} style={{...mono(20, 700, 0.12), color: 'currentColor'}}>
              {p.label}
            </T>
          </Show>
        </Plate>
      ))}
      <Plate ink="black" f={f} grain="solid" density={0.86}>
        <Show f={f} at={SPLIT + 4} out={AT.overprint - 6} dy={12}>
          <T k="sc" x={80} y={980} size={36} style={{...sc(36, 700, 0.05), color: 'currentColor'}}>
            一种颜色，过一遍机器。
          </T>
        </Show>
      </Plate>
    </>
  );
};

/* ═══════════════════════ 03 叠印：三圆相交，一种墨一种颜色，交叠处是乘出来的 ═══════════════════════ */
const VENN = [
  {ink: 'pink' as Ink, x: 760, y: 500, r: 250},
  {ink: 'teal' as Ink, x: 1040, y: 500, r: 250},
  {ink: 'yellow' as Ink, x: 900, y: 720, r: 250},
];
const MIXES: {inks: Ink[]; label: string; x: number; y: number; hex: string}[] = [
  {inks: ['pink'], label: '荧光粉', x: 620, y: 400, hex: INK.pink},
  {inks: ['teal'], label: '青绿', x: 1180, y: 400, hex: INK.teal},
  {inks: ['yellow'], label: '芥末黄', x: 900, y: 880, hex: INK.yellow},
  {inks: ['pink', 'teal'], label: '藏蓝', x: 900, y: 430, hex: OVERPRINT.pinkTeal},
  {inks: ['pink', 'yellow'], label: '朱红', x: 700, y: 700, hex: OVERPRINT.pinkYellow},
  {inks: ['teal', 'yellow'], label: '墨绿', x: 1100, y: 700, hex: OVERPRINT.tealYellow},
  {inks: ['pink', 'teal', 'yellow'], label: '近黑', x: 900, y: 620, hex: OVERPRINT.all},
];

export const Overprint: React.FC<P> = ({f}) => {
  const t0 = AT.overprint;
  const stack = tween(f, t0, 28, 0, 1, E.out);
  // 从分色的扇开位置收回来
  const close = 1 - tween(f, t0, 20, 0, 1, E.inOut);
  return (
    <>
      {VENN.map((c, i) => {
        const p = tween(f, t0 + i * 8, 22, 0, 1, E.out);
        const drift = Math.sin((f - t0) / 18 + i) * 6;
        const reg: Reg = {x: (i - 1) * 180 * close + drift, y: (i === 2 ? 80 : -20) * close, r: (i - 1) * 3 * close};
        return (
          <Plate key={c.ink} ink={c.ink} f={f} reg={addReg(reg, jitter(f, c.ink, 0.7))} origin={`${c.x}px ${c.y}px`}>
            <div
              style={{
                position: 'absolute',
                left: c.x - c.r,
                top: c.y - c.r,
                width: c.r * 2,
                height: c.r * 2,
                borderRadius: '50%',
                background: 'currentColor',
                transform: `scale(${0.2 + 0.8 * p * stack})`,
              }}
            />
          </Plate>
        );
      })}
      <Plate ink="black" f={f} grain="solid" density={0.88}>
        <Rise f={f} at={t0 + 6} top={56} h={90}>
          <T x={80} y={120} size={72} style={{...disp(72, 900, 80, -0.03), color: 'currentColor'}}>
            03  叠印
          </T>
        </Rise>
        {MIXES.map((m, i) => (
          <Show key={m.label} f={f} at={t0 + 28 + i * 6} dy={8}>
            <T k="sc" x={m.x} y={m.y} size={22} align="center" style={{...sc(22, 700, 0.04), color: 'currentColor'}}>
              {m.label}
            </T>
          </Show>
        ))}
        <Show f={f} at={t0 + 70} dy={10}>
          <T k="sc" x={80} y={980} size={32} style={{...sc(32, 700, 0.04), color: 'currentColor'}}>
            三种油墨，叠出七种颜色。
          </T>
        </Show>
      </Plate>
    </>
  );
};

/* ═══════════════════════ 04 小志：纸一张张飞出来，从讲义变成独立出版 ═══════════════════════ */
const PAGES: {title: string; sub: string; ink: Ink}[] = [
  {title: '教材', sub: 'SCHOOL · 1984', ink: 'teal'},
  {title: '社刊', sub: 'CLUB · 1996', ink: 'pink'},
  {title: '小志', sub: 'ZINE · 2011', ink: 'yellow'},
  {title: '画册', sub: 'ART BOOK · TODAY', ink: 'pink'},
];
export const Zine: React.FC<P> = ({f}) => {
  const t0 = AT.zine;
  return (
    <>
      {PAGES.map((p, i) => {
        const at = t0 + 8 + i * 24;
        const enter = spr(f, at, {damping: 12, mass: 0.7, stiffness: 170}, 24);
        if (enter <= 0.001 || f < at) return null;
        const x = 220 + i * 380;
        const y = 200 + (i % 2) * 40;
        const rot = lerp(-18, 3, enter) + (i - 1.5) * 3;
        return (
          <div key={p.title} style={{position: 'absolute', left: x, top: y, width: 340, height: 460, transform: `translate(${(1 - enter) * 420}px, ${(1 - enter) * 80}px) rotate(${rot}deg)`, transformOrigin: '50% 100%'}}>
            <div style={{position: 'absolute', inset: 0, background: C.paper, boxShadow: '0 18px 40px rgba(40,30,10,0.18)'}} />
            <Plate ink={p.ink} f={f} grain="solid" style={{position: 'absolute', inset: 0}} origin="50% 50%">
              <div style={{position: 'absolute', left: 28, top: 28, width: 284, height: 200, background: 'currentColor'}} />
              <DotLike x={80} y={320} r={36} />
              <DotLike x={170} y={300} r={52} />
            </Plate>
            <Plate ink="black" f={f} grain="solid" density={0.9} style={{position: 'absolute', inset: 0}}>
              <T k="sc" x={28} y={400} size={40} style={{...sc(40, 900, 0.02), color: 'currentColor'}}>
                {p.title}
              </T>
              <T k="mono" x={28} y={430} size={14} style={{...mono(13, 700, 0.08), color: 'currentColor'}}>
                {p.sub}
              </T>
            </Plate>
          </div>
        );
      })}
      <Plate ink="black" f={f} grain="solid" density={0.88}>
        <Rise f={f} at={t0 + 4} top={40} h={80}>
          <T x={80} y={100} size={64} style={{...disp(64, 900, 80, -0.03), color: 'currentColor'}}>
            04  小志
          </T>
        </Rise>
        <Show f={f} at={t0 + 90} dy={12}>
          <T k="sc" x={80} y={980} size={32} style={{...sc(32, 700, 0.04), color: 'currentColor'}}>
            从办公室到独立出版。
          </T>
        </Show>
      </Plate>
    </>
  );
};
const DotLike: React.FC<{x: number; y: number; r: number}> = ({x, y, r}) => (
  <div style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', background: 'currentColor'}} />
);

/* ═══════════════════════ 05 五个词：每个词用自己的印法演示自己 ═══════════════════════ */
const Card: React.FC<{f: number; k: number; paper?: string; children: React.ReactNode}> = ({f, k, paper = C.paper, children}) => {
  const a = WORD_AT[k];
  const p = k === 0 ? 1 : tween(f, a - 10, 10, 0, 1, E.inOut);
  const fromRight = k % 2 === 0;
  const c = ((1 - p) * 100).toFixed(3);
  const clip = fromRight ? `inset(0 0 0 ${c}%)` : `inset(${c}% 0 0 0)`;
  return (
    <div style={{position: 'absolute', inset: 0, clipPath: clip, background: paper, overflow: 'hidden'}}>
      {children}
    </div>
  );
};

const Zh: React.FC<{top: number; size: number; children: React.ReactNode}> = ({top, size, children}) => (
  <T k="sc" x={80} y={top} size={size} style={{...sc(size, 900, 0), color: 'currentColor'}}>
    {children}
  </T>
);

export const Words: React.FC<P> = ({f}) => {
  const k0 = WORD_AT.findIndex((a, i) => f >= (i ? a - 10 : a) && f < (WORD_AT[i + 1] ?? AT.end + 8));
  if (k0 < 0) return null;
  const a = WORD_AT[k0];
  return (
    <Card f={f} k={k0}>
      {k0 === 0 && (
        <>
          {(['pink', 'teal', 'yellow'] as Ink[]).map((ink, i) => (
            <Plate key={ink} ink={ink} f={f} reg={{x: (i - 1) * 14, y: 0}}>
              <div style={{position: 'absolute', left: 1100 + i * 30, top: 180, width: 220, height: 700, borderRadius: 110, background: 'currentColor'}} />
            </Plate>
          ))}
          <Plate ink="black" f={f} grain="solid">
            <Rise f={f} at={a} top={200} h={280}>
              <Zh top={420} size={220}>
                专色
              </Zh>
            </Rise>
            <Show f={f} at={a + 6} dy={10}>
              <T k="mono" x={80} y={520} size={28} style={{...mono(26, 700, 0.12), color: 'currentColor'}}>
                SPOT COLOR · NOT CMYK
              </T>
            </Show>
          </Plate>
        </>
      )}
      {k0 === 1 && (
        <>
          {VENN.map((c) => (
            <Plate key={c.ink} ink={c.ink} f={f} reg={jitter(f, c.ink, 0.8)}>
              <div style={{position: 'absolute', left: c.x - 200, top: c.y - 280, width: 400, height: 400, borderRadius: '50%', background: 'currentColor'}} />
            </Plate>
          ))}
          <Plate ink="black" f={f} grain="solid">
            <Rise f={f} at={a - 2} top={140} h={240}>
              <Zh top={320} size={200}>
                叠印
              </Zh>
            </Rise>
            <Show f={f} at={a + 4} dy={8}>
              <T k="mono" x={80} y={400} size={24} style={{...mono(22, 700, 0.1), color: 'currentColor'}}>
                MULTIPLY · PINK × TEAL × YELLOW
              </T>
            </Show>
          </Plate>
        </>
      )}
      {k0 === 2 && (
        <>
          {(['pink', 'teal', 'yellow'] as Ink[]).map((ink, i) => (
            <Plate key={ink} ink={ink} f={f} reg={{x: (i - 1) * 28, y: (i - 1) * -16, r: (i - 1) * 1.6}}>
              <T x={80} y={520} size={200} style={{...disp(200, 900, 90, -0.04), color: 'currentColor'}}>
                RISO
              </T>
            </Plate>
          ))}
          <Plate ink="black" f={f} grain="solid">
            <Rise f={f} at={a} top={160} h={160}>
              <Zh top={280} size={180}>
                套不准
              </Zh>
            </Rise>
            <Show f={f} at={a + 4} dy={8}>
              <T k="mono" x={80} y={720} size={22} style={{...mono(20, 700, 0.1), color: 'currentColor'}}>
                MISREGISTRATION · FEATURE, NOT BUG
              </T>
            </Show>
          </Plate>
        </>
      )}
      {k0 === 3 && (
        <>
          <Plate ink="pink" f={f}>
            <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
              <path
                d={halftonePath(80, 160, 1760, 760, 28, 15, (x, y) => {
                  const t = c01((f - a) / 22);
                  const u = (x - 200) / 1500;
                  const v = (y - 200) / 700;
                  return Math.min(1, t * (0.15 + 0.85 * (1 - Math.hypot(u - 0.45, v - 0.4))));
                })}
                fill="currentColor"
              />
            </svg>
          </Plate>
          <Plate ink="black" f={f} grain="solid">
            <Rise f={f} at={a} top={200} h={220}>
              <Zh top={380} size={200}>
                网点
              </Zh>
            </Rise>
            <Show f={f} at={a + 4} dy={8}>
              <T k="mono" x={80} y={460} size={22} style={{...mono(20, 700, 0.1), color: 'currentColor'}}>
                HALFTONE · AMPLITUDE MODULATED
              </T>
            </Show>
          </Plate>
        </>
      )}
      {k0 === 4 && (
        <>
          <Plate ink="teal" f={f} grain="heavy">
            <div style={{position: 'absolute', inset: 80, background: 'currentColor'}} />
          </Plate>
          <Plate ink="pink" f={f} grain="heavy" reg={{x: 8, y: -6}}>
            <div style={{position: 'absolute', left: 900, top: 80, width: 900, height: 920, background: 'currentColor'}} />
          </Plate>
          <Plate ink="black" f={f} grain="solid">
            <Rise f={f} at={a - 2} out={AT.end - 10} top={220} h={240}>
              <Zh top={420} size={200}>
                颗粒
              </Zh>
            </Rise>
            <Show f={f} at={a + 2} out={AT.end - 12} dy={8}>
              <T k="mono" x={80} y={500} size={22} style={{...mono(20, 700, 0.1), color: 'currentColor'}}>
                GRAIN TOUCH · NOT A CLEAN VECTOR
              </T>
            </Show>
          </Plate>
        </>
      )}
    </Card>
  );
};

/* ═══════════════════════ 片尾：商店海报落回，署名 @guanmo_ai ═══════════════════════ */
export const End: React.FC<P> = ({f}) => {
  const t0 = AT.end;
  const land = spr(f, t0 - 8, {damping: 13, mass: 0.8, stiffness: 150}, 28);
  return (
    <>
      {(['pink', 'teal', 'yellow'] as const).map((ink) => (
        <Plate key={ink} ink={ink} f={f} reg={addReg({x: flyReg(t0 + 20, ink).x * (1 - land), y: flyReg(t0 + 20, ink).y * (1 - land), r: (flyReg(t0 + 20, ink).r ?? 0) * (1 - land)}, jitter(f, ink, 0.45))}>
          <ShopArt ink={ink} />
          <RegMark x={48} y={48} />
          <RegMark x={1872} y={48} />
          <RegMark x={48} y={1032} />
          <RegMark x={1872} y={1032} />
        </Plate>
      ))}
      <TitleWord f={f} at={t0 + 2} />
      <Plate ink="black" f={f} grain="solid" density={0.88}>
        <Show f={f} at={t0 + 16} dy={12}>
          <T k="sc" x={960} y={342} size={40} align="center" style={{...sc(40, 900, 0.16), color: 'currentColor'}}>
            孔版印刷
          </T>
        </Show>
        <Show f={f} at={t0 + 28} dy={14}>
          <T k="sc" x={960} y={780} size={36} align="center" style={{...sc(36, 700, 0.06), color: 'currentColor'}}>
            三种油墨，一张会呼吸的纸。
          </T>
        </Show>
        <Show f={f} at={t0 + 42} dy={10}>
          <T k="mono" x={80} y={980} size={22} style={{...mono(20, 700, 0.08), color: 'currentColor'}}>
            DESIGN STYLE  008
          </T>
          <T k="mono" x={960} y={980} size={22} align="center" style={{...mono(20, 700, 0.1), color: 'currentColor'}}>
            @guanmo_ai
          </T>
          <T k="mono" x={1840} y={980} size={18} align="right" style={{...mono(16, 400, 0.06), color: 'currentColor'}}>
            github.com/guanmo-ai/design-style
          </T>
        </Show>
      </Plate>
    </>
  );
};

