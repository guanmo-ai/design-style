/**
 * 011 · 4–24s：圆角 / 双阴影 / 软色挤捏 / 产品 / 片尾。
 * 换幕靠同一颗蜜桃粘土接力，不硬切。片尾对标 008 End：中英标题 + 带走句 + 底栏三件套。
 */
import React from 'react';
import {E, SMOOTH, spr, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {ClayShape, ClaySphere, heroOf, lerp} from './clay';
import {AT} from './timeline';
import {Show, T, disp, mono, sc} from './ui';

type P = {f: number};

const Fade: React.FC<{f: number; out: number; dur?: number; children: React.ReactNode}> = ({f, out, dur = 16, children}) => {
  const o = 1 - tween(f, out, dur, 0, 1, E.soft);
  if (o <= 0.001) return null;
  return <div style={{position: 'absolute', inset: 0, opacity: o}}>{children}</div>;
};

/* ═══════════════ 01 圆角：尖的对照被捏走，四角依次变胖 ═══════════════ */
const CORNER_AT = [270, 300, 330, 360];

export const Corners: React.FC<P> = ({f}) => {
  const h = heroOf(f);
  const badge = spr(f, 258, SMOOTH, 22);
  return (
    <Fade f={f} out={AT.shadows - 8} dur={18}>
      {/* 尖角“别这样”：一张发硬的薄卡，被掐扁收走 */}
      {(() => {
        const enter = spr(f, 252, SMOOTH, 24);
        const crush = spr(f, 390, {damping: 10, mass: 0.7, stiffness: 170}, 28);
        if (enter <= 0.01) return null;
        const w = lerp(220, 40, crush);
        const ht = lerp(280, 16, crush);
        return (
          <ClayShape
            x={lerp(-40, 72, enter)}
            y={400}
            w={w}
            h={ht}
            r={lerp(6, 20, crush)}
            tone="cream"
            depth={0.45}
            press={crush}
            opacity={1 - crush * 0.15}
            rotate={lerp(-8, 12, crush)}
          >
            <div style={{padding: 22, opacity: 1 - crush, ...mono(13, 600, 0.1), color: C.muted}}>R 8</div>
          </ClayShape>
        );
      })()}
      {CORNER_AT.map((at, i) => {
        const p = spr(f, at, SMOOTH, 18);
        if (p <= 0.01) return null;
        const inset = 18;
        const left = i % 2 === 0 ? h.x + inset : h.x + h.w - inset - 28;
        const top = i < 2 ? h.y + inset : h.y + h.h - inset - 28;
        return <ClaySphere key={i} x={left} y={top} d={36} tone={i % 2 ? 'mint' : 'lavender'} depth={0.9} opacity={p * (1 - tween(f, AT.shadows - 20, 16))} />;
      })}
      {badge > 0.01 && (
        <ClayShape x={80} y={920} w={220} h={72} r={36} tone="mint" depth={0.85} scale={0.7 + 0.3 * badge} opacity={badge * (1 - tween(f, AT.shadows - 16, 14))}>
          <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', ...mono(22, 600, 0.08), color: C.ink}}>
            R {Math.round(h.r)}
          </div>
        </ClayShape>
      )}
    </Fade>
  );
};

/* ═══════════════ 02 阴影：光球绕一圈，扁平卡被体积吞掉 ═══════════════ */
export const Shadows: React.FC<P> = ({f}) => {
  const h = heroOf(f);
  const orb = spr(f, AT.shadows + 4, SMOOTH, 24);
  if (f < AT.shadows - 10) return null;
  const cx = h.x + h.w / 2 + h.light.x * 340;
  const cy = h.y + h.h / 2 + h.light.y * 240;
  const flatIn = spr(f, 600, SMOOTH, 22);
  const flatOut = spr(f, 680, SMOOTH, 26);
  return (
    <Fade f={f} out={AT.pastel - 8} dur={18}>
      {orb > 0.01 && (
        <ClaySphere x={cx - 48} y={cy - 48} d={96} tone="cream" depth={1.2} light={h.light} opacity={orb} />
      )}
      {flatIn > 0.01 && flatOut < 0.98 && (
        <div
          style={{
            position: 'absolute',
            left: lerp(1920, 1480, flatIn) + flatOut * 80,
            top: 780,
            width: 360,
            height: 160,
            borderRadius: 16,
            background: '#F4F6F8',
            boxShadow: '0 10px 24px rgba(40,50,70,0.18)',
            opacity: (1 - flatOut) * flatIn,
            transform: `rotate(${lerp(6, -10, flatOut)}deg) scaleY(${1 - flatOut * 0.7})`,
          }}
        >
          <div style={{padding: 22, ...mono(13, 500, 0.08), color: C.muted}}>flat drop-shadow</div>
        </div>
      )}
    </Fade>
  );
};

/* ═══════════════ 03 软色：四团粘土揉进来，再三下挤捏 ═══════════════ */
const LUMPS: {tone: 'mint' | 'lavender' | 'rose' | 'sky'; x: number; y: number; at: number}[] = [
  {tone: 'mint', x: 120, y: 160, at: 728},
  {tone: 'lavender', x: 1560, y: 140, at: 742},
  {tone: 'rose', x: 140, y: 760, at: 756},
  {tone: 'sky', x: 1540, y: 780, at: 770},
];

export const Pastel: React.FC<P> = ({f}) => {
  const out = tween(f, AT.product - 16, 18, 0, 1, E.soft);
  return (
    <Fade f={f} out={AT.product - 6} dur={16}>
      {LUMPS.map((L, i) => {
        const p = spr(f, L.at, SMOOTH, 26);
        if (p <= 0.01) return null;
        const park = spr(f, 820, SMOOTH, 28);
        const px = lerp(L.x, 280 + i * 360, park);
        const py = lerp(L.y, 860, park);
        const d = lerp(170, 96, park);
        return <ClaySphere key={L.tone} x={px} y={py} d={d} tone={L.tone} depth={0.95} scale={0.4 + 0.6 * p} opacity={(0.2 + 0.8 * p) * (1 - out)} />;
      })}
    </Fade>
  );
};

/* ═══════════════ 04 产品：PINCH 焦点应用，开关 / 滑杆 / 卡片层叠 ═══════════════ */
const SESSIONS = [
  {title: 'Deep work', time: '25:00', tone: 'peach' as const},
  {title: 'Walk', time: '12:00', tone: 'mint' as const},
  {title: 'Sleep', time: '45:00', tone: 'lavender' as const},
];

export const Product: React.FC<P> = ({f}) => {
  const t0 = AT.product;
  const rise = spr(f, t0 - 8, SMOOTH, 36);
  const leave = tween(f, AT.end - 6, 20, 0, 1, E.soft);
  if (rise <= 0.01 || leave >= 0.99) return null;
  const x = lerp(720, 1040, rise) + leave * 80;
  const y = lerp(40, 70, rise);
  const on = spr(f, t0 + 30, SMOOTH, 22);
  const slide = tween(f, t0 + 150, 50, 0.18, 0.72, E.inOut);
  const stack = spr(f, t0 + 90, SMOOTH, 28);
  const flip = spr(f, t0 + 210, SMOOTH, 24);
  const knob = 0.18 + (slide - 0.18) * (1 - flip) + 0.72 * flip;
  const focus = flip < 0.5;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: 1 - leave}}>
      <Show f={f} at={t0 + 8} out={AT.end - 4} dy={18}>
        <T x={96} y={240} size={28} style={{...mono(16, 600, 0.12), color: C.muted}}>
          04  PRODUCT
        </T>
        <T k="sc" x={96} y={340} size={64} style={{...sc(64, 900, 0.04), color: C.ink}}>
          捏进界面
        </T>
        <T k="sc" x={96} y={418} size={24} style={{...sc(24, 500, 0.02), color: C.muted}}>
          开关、滑杆、层叠。
        </T>
      </Show>
      <ClayShape x={x} y={y} w={500} h={940} r={72} tone="sky" depth={1.05} scale={0.86 + 0.14 * rise}>
        <div style={{position: 'absolute', left: 22, top: 22, right: 22, bottom: 22, borderRadius: 56, background: 'linear-gradient(180deg, #F4F7FB, #E4EAF2)', overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 28, top: 28, display: 'flex', alignItems: 'center', gap: 14}}>
            <div style={{position: 'relative', width: 44, height: 44, flex: '0 0 44px'}}>
              <ClaySphere x={0} y={0} d={44} tone="peach" depth={0.8} />
            </div>
            <span style={{...disp(26, 600, 0.04), color: C.ink}}>PINCH</span>
          </div>
          <div style={{position: 'absolute', right: 32, top: 38, ...mono(16, 500, 0.06), color: C.muted}}>9:41</div>
          {/* 开关：滑块跟 Focus→Break，不跟入场弹簧跑到右边 */}
          <ClayShape x={36} y={468} w={400} h={72} r={36} tone={focus ? 'mint' : 'lavender'} depth={0.7} press={0.08}>
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 36px', ...sc(18, 500, 0.02), color: C.ink, opacity: 0.28}}>
              <span>Focus</span>
              <span>Break</span>
            </div>
            <div
              style={{
                position: 'absolute',
                left: 8 + flip * 196,
                top: 8,
                width: 188,
                height: 56,
                borderRadius: 28,
                background: clayChip(focus ? '#D6F0E0' : '#E8DEF6'),
                boxShadow: 'inset 4px 5px 8px rgba(255,255,255,0.7), inset -3px -4px 8px rgba(130,146,168,0.22)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.2 + 0.8 * on,
                scale: 0.86 + 0.14 * on,
                ...sc(22, 700, 0.04),
                color: C.ink,
              }}
            >
              {focus ? 'Focus' : 'Break'}
            </div>
          </ClayShape>
          {/* 滑杆 */}
          <div style={{position: 'absolute', left: 44, top: 560, width: 384, height: 16, borderRadius: 8, background: '#D5DDE6', boxShadow: 'inset 2px 2px 4px rgba(130,146,168,0.28), inset -2px -2px 4px rgba(255,255,255,0.7)'}}>
            <ClaySphere x={knob * 360 - 6} y={-14} d={44} tone="peach" depth={0.95} />
          </div>
          {SESSIONS.map((s, i) => {
            const p = spr(f, t0 + 90 + i * 8, SMOOTH, 22);
            if (p <= 0.01) return null;
            return (
              <ClayShape
                key={s.title}
                x={36 + i * 12}
                y={628 + i * 86}
                w={400 - i * 18}
                h={78}
                r={28}
                tone={s.tone}
                depth={0.75 - i * 0.08}
                opacity={p * stack}
                style={{zIndex: 3 - i}}
              >
                <div style={{padding: '16px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <span style={{...sc(22, 700, 0.02), color: C.ink}}>{s.title}</span>
                  <span style={{...mono(18, 500, 0.04), color: C.ink}}>{s.time}</span>
                </div>
              </ClayShape>
            );
          })}
        </div>
      </ClayShape>
    </div>
  );
};

const clayChip = (c: string) => `radial-gradient(ellipse at 30% 28%, #fff 0%, ${c} 70%)`;

/* ═══════════════ 片尾：粘土信息幕，不是字幕卡 ═══════════════ */
export const End: React.FC<P> = ({f}) => {
  const t0 = AT.end;
  const land = spr(f, t0 - 14, SMOOTH, 40);
  if (land <= 0.01) return null;
  const h = heroOf(f);
  const dots = (
    [
      [160, 80, 'mint'],
      [1680, 90, 'lavender'],
      [140, 900, 'rose'],
      [1700, 880, 'sky'],
    ] as const
  ).map(([x, y, tone], i) => {
    const p = spr(f, t0 + 6 + i * 5, SMOOTH, 22);
    return <ClaySphere key={tone} x={x} y={y} d={88} tone={tone} depth={0.9} opacity={p} />;
  });
  return (
    <>
      {dots}
      <div style={{position: 'absolute', left: h.x, top: h.y, width: h.w, height: h.h, pointerEvents: 'none'}}>
        <Show f={f} at={t0 + 16} dy={18}>
          <T x={h.w / 2} y={210} size={96} align="center" style={{...disp(96, 700, -0.035), color: C.ink}}>
            Claymorphism
          </T>
        </Show>
        <Show f={f} at={t0 + 28} dy={14}>
          <T k="sc" x={h.w / 2} y={300} size={40} align="center" style={{...sc(40, 700, 0.16), color: C.ink}}>
            粘土拟态
          </T>
        </Show>
        <Show f={f} at={t0 + 52} dy={16}>
          <T k="sc" x={h.w / 2} y={470} size={42} align="center" style={{...sc(42, 700, 0.04), color: C.ink}}>
            先捏体积，再画界面。
          </T>
        </Show>
        <Show f={f} at={t0 + 76} dy={10}>
          <ClayShape x={80} y={h.h - 150} w={h.w - 160} h={88} r={44} tone="cream" depth={0.75} light={h.light}>
            <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px'}}>
              <span style={{...mono(18, 600, 0.1), color: C.ink}}>DESIGN STYLE  011</span>
              <span style={{...mono(18, 600, 0.1), color: C.ink}}>@guanmo_ai</span>
              <span style={{...mono(16, 500, 0.06), color: C.muted}}>github.com/guanmo-ai/design-style</span>
            </div>
          </ClayShape>
        </Show>
      </div>
    </>
  );
};

/** 英雄身上随幕切换的字：开场 PINCH，产品段 25:00 */
export const HeroFace: React.FC<P> = ({f}) => {
  const h = heroOf(f);
  if (f >= 32 && f < 210) {
    const o = tween(f, 32, 14, 0, 1, E.soft) * (1 - tween(f, 210, 22, 0, 1, E.soft));
    return (
      <div style={{position: 'absolute', left: h.x, top: h.y, width: h.w, height: h.h, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: o, pointerEvents: 'none'}}>
        <span style={{...disp(54, 600, 0.08), color: C.ink}}>PINCH</span>
      </div>
    );
  }
  if (f >= AT.corners + 8 && f < AT.shadows - 6) {
    const o = tween(f, AT.corners + 8, 16, 0, 1, E.soft) * (1 - tween(f, AT.shadows - 18, 14, 0, 1, E.soft));
    return (
      <div style={{position: 'absolute', left: h.x, top: h.y, width: h.w, height: h.h, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: o, pointerEvents: 'none'}}>
        <span style={{...disp(120, 700, -0.04), color: C.ink}}>{Math.round(h.r)}</span>
        <span style={{...sc(28, 500, 0.12), color: C.ink, marginTop: 8}}>圆角</span>
      </div>
    );
  }
  if (f >= AT.product - 4 && f < AT.end - 8) {
    const o = tween(f, AT.product + 6, 16, 0, 1, E.soft) * (1 - tween(f, AT.end - 18, 14, 0, 1, E.soft));
    const t = Math.max(0, 25 * 60 - Math.floor((f - AT.product) / 60) * 3);
    const mm = String(Math.floor(t / 60)).padStart(2, '0');
    const ss = String(t % 60).padStart(2, '0');
    return (
      <div style={{position: 'absolute', left: h.x, top: h.y, width: h.w, height: h.h, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: o, pointerEvents: 'none'}}>
        <span style={{...disp(56, 700, -0.02), color: C.ink}}>{mm}:{ss}</span>
        <span style={{...sc(18, 500, 0.08), color: C.ink, marginTop: 6}}>Deep work</span>
      </div>
    );
  }
  return null;
};
