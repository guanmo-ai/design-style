/** 页面里的通用零件：section 外壳、sticky 舞台、步骤卡片、触发线 */
import React from 'react';
import {C, FONT} from '../tokens';
import {Sec, TRIGGER, VH, W, c01, stickyY} from './page';

/** 一个 section：页面里一块绝对定位的长条，坐标系 = section 内部 y */
export const Section: React.FC<{sec: Sec; children: React.ReactNode}> = ({sec, children}) => (
  <div style={{position: 'absolute', left: 0, top: sec.top, width: W, height: sec.h, background: sec.bg, overflow: 'hidden'}}>
    {children}
  </div>
);

/** sticky 舞台：y = clamp(scrollY, section 顶, section 底 − 一屏)，和浏览器同一条公式 */
export const Stage: React.FC<{sec: Sec; s: number; children: React.ReactNode; style?: React.CSSProperties}> = ({sec, s, children, style}) => (
  <div style={{position: 'absolute', left: 0, top: stickyY(sec, s) - sec.top, width: W, height: VH, ...style}}>{children}</div>
);

/** 普通文档流里的一块：给 section 内 y（中心或顶部） */
export const At: React.FC<{x: number; y: number; w?: number; children: React.ReactNode; style?: React.CSSProperties; center?: boolean}> = ({
  x,
  y,
  w,
  children,
  style,
  center,
}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, transform: center ? 'translateY(-50%)' : undefined, ...style}}>{children}</div>
);

/** 步骤离触发线有多近：1 = 正在线上 */
export const nearTrigger = (pageCenter: number, s: number, range = 430) => 1 - c01(Math.abs(pageCenter - (s + TRIGGER)) / range);
/** 步骤是否已越过触发线（中心在线以上） */
export const crossed = (pageCenter: number, s: number) => pageCenter <= s + TRIGGER + 60;

export const Mono: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties}> = ({
  children,
  size = 22,
  color = C.t2,
  style,
}) => <span style={{fontFamily: FONT.mono, fontSize: size, color, letterSpacing: 0, ...style}}>{children}</span>;

/** 深色步骤卡片 */
export const StepCard: React.FC<{
  n: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
  a: number; // 离触发线的接近度
  on: boolean; // 已过线
  w?: number;
  dark?: boolean;
}> = ({n, title, sub, a, on, w = 660, dark = true}) => {
  const bg = dark ? C.panel : '#FFFFFF';
  const fg = dark ? C.t1 : C.ink;
  const fg2 = dark ? C.t2 : C.ink2;
  return (
    <div
      style={{
        width: w,
        boxSizing: 'border-box',
        padding: '34px 40px 36px',
        borderRadius: 28,
        background: bg,
        boxShadow: dark
          ? `inset 0 0 0 ${1.5 + 1.5 * a}px rgba(41,151,255,${0.15 + 0.75 * a})`
          : `0 24px 60px rgba(0,0,0,0.10), inset 0 0 0 ${1 + 1.5 * a}px rgba(41,151,255,${0.1 + 0.8 * a})`,
        opacity: 0.38 + 0.62 * Math.max(a, on ? 0.35 : 0),
        transform: `scale(${0.97 + 0.03 * a})`,
        transformOrigin: 'left center',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 18, marginBottom: 14}}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            background: on ? C.accent : 'transparent',
            boxShadow: on ? 'none' : `inset 0 0 0 2px ${C.accent}`,
            color: on ? '#fff' : C.accent,
            fontFamily: FONT.mono,
            fontWeight: 500,
            fontSize: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {n}
        </div>
      </div>
      <div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 46, lineHeight: 1.18, color: fg, letterSpacing: -0.5}}>{title}</div>
      {sub && <div style={{fontFamily: FONT.text, fontSize: 25, lineHeight: 1.5, color: fg2, marginTop: 14}}>{sub}</div>}
    </div>
  );
};

/** 触发线：画在页面坐标 y = scrollY + 50%，所以平时它钉在屏幕中间 */
export const TriggerLine: React.FC<{sec: Sec; s: number; o: number; x0?: number; x1?: number; label?: boolean; color?: string}> = ({
  sec,
  s,
  o,
  x0 = 80,
  x1 = 1840,
  label = true,
  color = C.accent,
}) => {
  if (o <= 0.001) return null;
  const y = s + TRIGGER - sec.top;
  return (
    <div style={{position: 'absolute', left: x0, top: y - 1, width: x1 - x0, height: 2, opacity: o, zIndex: 30}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `repeating-linear-gradient(90deg, ${color} 0 14px, rgba(0,0,0,0) 14px 24px)`,
          opacity: 0.85,
        }}
      />
      <div style={{position: 'absolute', left: -14, top: -7, width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: `12px solid ${color}`}} />
      {label && (
        <div style={{position: 'absolute', left: 0, top: -40}}>
          <Mono size={20} color={color}>
            触发线 · 50%
          </Mono>
        </div>
      )}
    </div>
  );
};

/** 小标签（章节眉题） */
export const Kicker: React.FC<{children: React.ReactNode; color?: string; size?: number}> = ({children, color = C.accent, size = 22}) => (
  <div style={{fontFamily: FONT.mono, fontSize: size, fontWeight: 500, color, letterSpacing: 1.5, textTransform: 'uppercase'}}>{children}</div>
);
