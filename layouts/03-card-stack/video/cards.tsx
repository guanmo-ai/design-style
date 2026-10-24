/** 布局 03 · Card Stack —— 一张卡片的“皮”：仪表盘 / iOS sheet / Stripe / 线框 / 误区 */
import React from 'react';
import {interpolateColors} from 'remotion';
import {C} from '../tokens';
import {CARD_H, CARD_R, CARD_W, CARDS, CardDef, Skin, skinAt} from './layout';
import {mono, sc, ui} from './ui';

const BARS = [28, 40, 24, 56, 32, 78, 36];
const SPARK = [18, 22, 19, 28, 26, 34, 31, 42, 38, 48, 44, 56];
const PEOPLE = [
  {name: '林可', wait: '2h', color: '#F59E8B'},
  {name: 'Jordan', wait: '5h', color: '#93C5FD'},
  {name: '阿南', wait: '1d', color: '#A7F3D0'},
];
const Chip: React.FC<{label: string; value: string; accent?: boolean}> = ({label, value, accent}) => (
  <div style={{flex: 1, height: 86, borderRadius: 18, background: accent ? C.accentSoft : C.chip, padding: '16px 20px'}}>
    <div style={{...ui(13, 500), color: C.ink2, letterSpacing: '0.04em'}}>{label}</div>
    <div style={{...sc(28, 700, 0.01), color: accent ? C.accent : C.ink, marginTop: 10}}>{value}</div>
  </div>
);

const Bars: React.FC<{accent: string}> = ({accent}) => (
  <div style={{position: 'absolute', left: 36, right: 36, bottom: 28, height: 88, display: 'flex', alignItems: 'flex-end', gap: 14}}>
    {BARS.map((h, i) => (
      <div key={i} style={{flex: 1, height: h, borderRadius: 6, background: i === 5 ? accent : '#D9DEE7'}} />
    ))}
  </div>
);

const People: React.FC = () => (
  <div style={{position: 'absolute', left: 36, right: 36, bottom: 28, display: 'flex', flexDirection: 'column', gap: 10}}>
    {PEOPLE.map((p) => (
      <div key={p.name} style={{display: 'flex', alignItems: 'center', height: 28}}>
        <div style={{width: 22, height: 22, borderRadius: 11, background: p.color, marginRight: 12}} />
        <span style={{...sc(16, 500), color: C.ink}}>{p.name}</span>
        <span style={{...mono(13), color: C.ink3, marginLeft: 'auto'}}>{p.wait}</span>
      </div>
    ))}
  </div>
);

const Progress: React.FC<{accent: string}> = ({accent}) => (
  <div style={{position: 'absolute', left: 36, right: 36, bottom: 36}}>
    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 14}}>
      <span style={{...sc(15, 500), color: C.ink2}}>This week</span>
      <span style={{...mono(15), color: C.ink}}>57%</span>
    </div>
    <div style={{height: 12, borderRadius: 6, background: '#E6EAF0', overflow: 'hidden'}}>
      <div style={{width: '57%', height: '100%', borderRadius: 6, background: accent}} />
    </div>
  </div>
);

const Spark: React.FC<{accent: string}> = ({accent}) => {
  const d = SPARK.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i / (SPARK.length - 1)) * 688} ${70 - v}`).join(' ');
  return (
    <svg width={688} height={80} viewBox="0 0 688 80" style={{position: 'absolute', left: 36, bottom: 28}}>
      <path d={d} fill="none" stroke={accent} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={688} cy={70 - SPARK[SPARK.length - 1]} r={5} fill={accent} />
    </svg>
  );
};

const Face: React.FC<{it: CardDef; skin: Skin}> = ({it, skin}) => {
  const accent = skin === 'stripe' ? '#635BFF' : C.accent;
  const wire = skin === 'wire';
  const ios = skin === 'ios';
  const pit = skin === 'pit';
  const ink = wire ? 'rgba(15,23,42,0.45)' : C.ink;
  const ink2 = wire ? 'rgba(15,23,42,0.32)' : C.ink2;
  return (
    <div style={{position: 'absolute', inset: 0, color: ink}}>
      {ios && <div style={{position: 'absolute', left: '50%', top: 14, width: 48, height: 5, marginLeft: -24, borderRadius: 3, background: '#D1D5DB'}} />}
      {skin === 'stripe' && <div style={{position: 'absolute', left: 0, top: 0, right: 0, height: 4, background: accent}} />}
      <div style={{position: 'absolute', left: 36, top: ios ? 36 : 28, display: 'flex', alignItems: 'center', gap: 12}}>
        <div style={{width: 12, height: 12, borderRadius: 6, background: wire ? 'transparent' : accent, boxShadow: wire ? `inset 0 0 0 1.5px ${accent}` : undefined}} />
        <span style={{...ui(15, 600), color: ink2, letterSpacing: '0.01em'}}>{it.titleEn}</span>
        <span style={{...mono(12), color: C.ink3, marginLeft: 8}}>{it.kicker}</span>
      </div>
      <div style={{position: 'absolute', left: 36, top: ios ? 68 : 58, ...sc(28, 700, 0.01), color: ink}}>{it.title}</div>
      <div style={{position: 'absolute', left: 36, top: ios ? 108 : 98, ...ui(16, 500), color: ink2}}>{it.sub}</div>
      <div style={{position: 'absolute', left: 36, right: 36, top: 142, height: 1, background: wire ? 'transparent' : C.line, boxShadow: wire ? `inset 0 0 0 1px ${C.line}` : undefined}} />
      <div style={{position: 'absolute', left: 36, right: 36, top: 162, display: 'flex', gap: 12}}>
        <Chip label={it.aLabel} value={it.a} accent={!wire && !pit} />
        <Chip label={it.bLabel} value={it.b} />
      </div>
      {it.kind === 'bars' && <Bars accent={accent} />}
      {it.kind === 'people' && <People />}
      {it.kind === 'progress' && <Progress accent={accent} />}
      {it.kind === 'spark' && <Spark accent={accent} />}
      {wire && (
        <div style={{position: 'absolute', inset: 0, boxShadow: `inset 0 0 0 1.5px ${C.accent}`, borderRadius: CARD_R, pointerEvents: 'none'}} />
      )}
    </div>
  );
};

export const CardFace: React.FC<{f: number; i: number; o: number}> = ({f, i, o}) => {
  const it = CARDS[i];
  const skin = skinAt(f);
  if (skin === 'icon') {
    const fills = [C.accent, '#93C5FD', '#CBD5E1', '#E2E8F0'];
    return <div style={{position: 'absolute', inset: 0, background: fills[i], opacity: o}} />;
  }
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o}}>
      <Face it={it} skin={skin} />
    </div>
  );
};

export const GhostFace: React.FC<{g: number}> = ({g}) => (
  <div style={{position: 'absolute', inset: 0, background: C.card}}>
    <div style={{position: 'absolute', left: 36, top: 36, width: 180, height: 14, borderRadius: 7, background: '#E8EDF3'}} />
    <div style={{position: 'absolute', left: 36, top: 68, width: 320 - g * 24, height: 22, borderRadius: 8, background: '#EEF2F6'}} />
    <div style={{position: 'absolute', left: 36, right: 36, bottom: 36, height: 72, borderRadius: 16, background: '#F1F5F9'}} />
  </div>
);

export const cardShadow = (dim: number, front: boolean, skin: Skin) => {
  const a = (1 - dim) * (skin === 'pit' ? 1.4 : 1);
  const y1 = front ? 18 : 10;
  const y2 = front ? 48 : 24;
  const c = interpolateColors(dim, [0, 1], ['rgba(15,23,42,0.10)', 'rgba(15,23,42,0.04)']);
  return `0 1px 2px rgba(15,23,42,${0.04 * a}), 0 ${y1}px ${y2}px ${c}`;
};

export const Sheet: React.FC<{
  pose: {x: number; y: number; z: number; rot: number; sc: number; o: number; dim: number; blur: number};
  z: number;
  skin: Skin;
  children: React.ReactNode;
}> = ({pose, z, skin, children}) => {
  if (pose.o <= 0.001) return null;
  const r = skin === 'icon' ? 10 : skin === 'pit' ? 16 : CARD_R;
  return (
    <div
      style={{
        position: 'absolute',
        left: -CARD_W / 2,
        top: -CARD_H / 2,
        width: CARD_W,
        height: CARD_H,
        borderRadius: r,
        overflow: 'hidden',
        zIndex: z,
        opacity: pose.o,
        background: C.card,
        transform: `translate3d(${pose.x}px, ${pose.y}px, ${pose.z}px) rotateZ(${pose.rot}deg) scale(${pose.sc})`,
        filter: pose.blur > 0.05 ? `brightness(${1 - pose.dim}) blur(${pose.blur}px)` : `brightness(${1 - pose.dim})`,
        boxShadow: `${cardShadow(pose.dim, pose.dim < 0.02, skin)}, inset 0 0 0 1px rgba(15,23,42,${0.05 + pose.dim * 0.04})`,
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  );
};
