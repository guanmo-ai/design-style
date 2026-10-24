/**
 * 四张竖版海报的脸：刊 / 层 / 样。不是 Wallet，不是白 UI。
 */
import React from 'react';
import {POP, spr} from '../../../src/lib/anim';
import {C} from '../tokens';
import {BEATS, familyOf, LayoutName} from './layout';
import {gro, mono, sc} from './ui';

type CSS = React.CSSProperties;

export const ID = [
  {bg: C.red, bg2: '#C4161C', fg: C.cream, verb: '抽', en: 'PULL', no: '03', vol: 'KAN', tag: '刊'},
  {bg: C.cream, bg2: '#E4D8C4', fg: C.ink, verb: '提', en: 'LIFT', no: '12', vol: 'VOL', tag: '册'},
  {bg: C.night, bg2: '#1A1A1E', fg: C.cream, verb: '压', en: 'PRESS', no: '08', vol: 'INK', tag: '墨'},
  {bg: C.teal, bg2: '#0F2C2C', fg: C.cream, verb: '叠', en: 'STACK', no: '04', vol: 'LAY', tag: '层'},
] as const;

const LAYER_NAME = ['封面', '正文', '专色', '印张'] as const;
const PAPER = [
  {name: 'MUNKEN', gsm: '150', cmyk: ['#2A6F9E', '#C43B7A', '#E0B833', '#111111']},
  {name: 'CURIOUS', gsm: '120', cmyk: ['#1F6B6B', '#E31C23', '#E8C36A', '#1A1A1E']},
  {name: 'FEDRIGONI', gsm: '170', cmyk: ['#163A3A', '#C4161C', '#C8B89A', '#0C0C0E']},
  {name: 'COLORPLAN', gsm: '135', cmyk: ['#3D5A4C', '#E35A3B', '#F0D48A', '#222']},
] as const;
const RULES = [
  {n: '01', t: '3–4', d: '第五张是噪声'},
  {n: '02', t: '一张', d: '同时只读最前'},
  {n: '03', t: '抽 / 提 / 压', d: '换层用身体'},
  {n: '04', t: '24 × 30', d: '后层只暗示'},
] as const;
export const EXTRA_FACE = [
  {bg: C.sand, fg: C.ink, t: '杂'},
  {bg: C.red, fg: C.cream, t: '刊'},
  {bg: C.ink2, fg: C.cream, t: '噪'},
  {bg: C.teal, fg: C.cream, t: '声'},
] as const;

const Pop: React.FC<{f: number; at: number; children: React.ReactNode; style?: CSS; dy?: number}> = ({f, at, children, style, dy = 14}) => {
  const p = spr(f, at, POP, 26);
  if (p <= 0.02) return null;
  return (
    <div style={{opacity: Math.min(1, p * 1.35), transform: `translateY(${(1 - p) * dy}px)`, ...style}}>
      {children}
    </div>
  );
};

const Marks: React.FC<{c: string; s?: number}> = ({c, s = 14}) => {
  const corner = (style: CSS) => (
    <div style={{position: 'absolute', width: s, height: s, pointerEvents: 'none', ...style}}>
      <div style={{position: 'absolute', background: c, width: s, height: 1, top: s / 2, left: 0}} />
      <div style={{position: 'absolute', background: c, width: 1, height: s, left: s / 2, top: 0}} />
    </div>
  );
  return (
    <>
      {corner({left: 8, top: 8})}
      {corner({right: 8, top: 8})}
      {corner({left: 8, bottom: 8})}
      {corner({right: 8, bottom: 8})}
    </>
  );
};

export const CoverFace: React.FC<{f: number; i: number}> = ({f, i}) => {
  const id = ID[i];
  const verbAt = [BEATS.cover, BEATS.land2, BEATS.land3, BEATS.front][i];
  return (
    <div style={{position: 'absolute', inset: 0, color: id.fg, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 18, background: i === 1 ? C.red : id.fg, opacity: i === 1 ? 1 : 0.18}} />
      <Pop f={f} at={8 + i * 4} style={{position: 'absolute', left: 36, top: 28, right: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
        <span style={{...mono(13), opacity: 0.7}}>{id.vol}.{id.no}</span>
        <span style={{...sc(15, 700, 0.12)}}>{id.tag}</span>
      </Pop>
      <Pop f={f} at={verbAt - 8} dy={28} style={{position: 'absolute', left: 28, top: '18%', right: 16}}>
        <div style={{...gro(i === 2 ? 168 : 188, 700, -0.07), lineHeight: 0.82}}>{id.verb}</div>
      </Pop>
      <Pop f={f} at={verbAt + 4} style={{position: 'absolute', left: 36, top: '48%'}}>
        <div style={{...gro(28, 700, 0.08), opacity: 0.88}}>{id.en}</div>
        <div style={{width: 72, height: 4, background: i === 1 ? C.red : id.fg, marginTop: 10}} />
      </Pop>
      <Pop f={f} at={36 + i * 5} style={{position: 'absolute', left: 36, bottom: 36, right: 28}}>
        <div style={{...sc(16, 500, 0.08), opacity: 0.72}}>24.10.26</div>
        <div style={{...mono(12), opacity: 0.5, marginTop: 6}}>NO.{id.no}  ·  520 × 740</div>
      </Pop>
      <div style={{position: 'absolute', right: 22, top: 86, width: 10, height: 10, borderRadius: 10, background: i === 1 ? C.red : id.fg, opacity: 0.85}} />
    </div>
  );
};

export const LayerFace: React.FC<{f: number; i: number}> = ({f, i}) => {
  const id = ID[i];
  const named = LAYER_NAME[i];
  const on = i === 3 && f >= BEATS.mark;
  return (
    <div style={{position: 'absolute', inset: 0, background: C.cream, color: C.ink, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 16, background: id.bg}} />
      <Marks c={on ? C.red : 'rgba(17,17,17,0.28)'} />
      {on && <div style={{position: 'absolute', inset: 6, border: `2px solid ${C.red}`, pointerEvents: 'none'}} />}
      <Pop f={f} at={BEATS.layer + i * 4} style={{position: 'absolute', left: 36, top: 18, right: 20, display: 'flex', justifyContent: 'space-between'}}>
        <span style={{...gro(42, 700, -0.04)}}>L{i + 1}</span>
        <span style={{...mono(14), color: C.ink2}}>z {40 - i * 18}</span>
      </Pop>
      <Pop f={f} at={BEATS.layer + 8 + i * 4} style={{position: 'absolute', left: 36, top: 72}}>
        <div style={{...sc(28, 700)}}>{named}</div>
        <div style={{...mono(13), color: C.ink2, marginTop: 6}}>{id.en}  ·  {id.vol}.{id.no}</div>
      </Pop>
      <div style={{position: 'absolute', left: 36, bottom: 22, right: 24, display: 'flex', gap: 6}}>
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <div key={k} style={{flex: 1, height: 10, background: k <= i ? id.bg : 'rgba(17,17,17,0.08)'}} />
        ))}
      </div>
    </div>
  );
};

export const ProofFace: React.FC<{f: number; i: number}> = ({f, i}) => {
  const p = PAPER[i];
  const picked = i === 1 && f >= BEATS.pick;
  return (
    <div style={{position: 'absolute', inset: 0, background: C.cream, color: C.ink, overflow: 'hidden'}}>
      <Marks c={C.ink} s={16} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 18, background: ID[i].bg}} />
      <Pop f={f} at={BEATS.fan + i * 3} style={{position: 'absolute', left: 24, top: 36, right: 20}}>
        <div style={{...mono(12), color: C.ink2}}>PROOF 0{i + 1}</div>
        <div style={{...gro(i === 1 ? 36 : 28, 700, -0.03), marginTop: 8}}>{p.name}</div>
        <div style={{...sc(16, 500), marginTop: 6}}>{p.gsm} gsm</div>
      </Pop>
      <div style={{position: 'absolute', left: 24, bottom: 56, right: 20, display: 'flex', height: 18}}>
        {p.cmyk.map((c) => (
          <div key={c} style={{flex: 1, background: c}} />
        ))}
      </div>
      <Pop f={f} at={BEATS.fan + 10} style={{position: 'absolute', left: 24, bottom: 22, ...mono(12), color: C.ink2}}>
        C M Y K  ·  套准
      </Pop>
      {picked && (
        <Pop f={f} at={BEATS.pick} style={{position: 'absolute', right: 16, top: 44, border: `2px solid ${C.red}`, color: C.red, padding: '6px 8px', ...gro(16, 700, 0.06)}}>
          选定
        </Pop>
      )}
    </div>
  );
};

export const TeachFace: React.FC<{f: number; i: number}> = ({f, i}) => {
  const r = RULES[i];
  const at = BEATS[['r1', 'r2', 'r3', 'r3'][i] as 'r1' | 'r2' | 'r3'] + (i === 3 ? 30 : 0);
  return (
    <div style={{position: 'absolute', inset: 0, background: C.cream, color: C.ink, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 14, background: ID[i].bg}} />
      <Pop f={f} at={BEATS.explode + i * 5} style={{position: 'absolute', left: 28, top: 18}}>
        <div style={{...gro(22, 700), color: C.red}}>{r.n}</div>
      </Pop>
      <Pop f={f} at={at} dy={20} style={{position: 'absolute', left: 28, top: 52, right: 18}}>
        <div style={{...gro(i === 2 ? 36 : 48, 700, -0.04)}}>{r.t}</div>
        <div style={{...sc(18, 500), marginTop: 10, color: C.ink2}}>{r.d}</div>
      </Pop>
    </div>
  );
};

export const PitFace: React.FC<{f: number; i: number; kind: 'noise' | 'flat' | 'fix'}> = ({f, i, kind}) => {
  if (kind === 'fix') return <CoverFace f={f} i={i} />;
  if (kind === 'flat') {
    return (
      <div style={{position: 'absolute', inset: 0, background: C.cream, color: C.ink2, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 24, top: 24, ...gro(28, 700)}}>同一平面</div>
        <div style={{position: 'absolute', left: 24, top: 64, ...sc(16)}}>不抬 · 不旋 · 不压暗</div>
        <div style={{position: 'absolute', left: 24, bottom: 24, ...mono(13)}}>0{i + 1} / 04  ·  失去焦点</div>
      </div>
    );
  }
  const id = ID[i];
  return (
    <div style={{position: 'absolute', inset: 0, background: id.bg, color: id.fg, overflow: 'hidden', transform: `rotate(${i % 2 ? 2 : -3}deg)`}}>
      <div style={{position: 'absolute', left: 16, top: 16, ...gro(64, 700)}}>{id.verb}</div>
      <div style={{position: 'absolute', left: 16, bottom: 16, ...sc(18)}}>第{i + 5}张</div>
    </div>
  );
};

export const ExtraFace: React.FC<{g: number}> = ({g}) => {
  const e = EXTRA_FACE[g];
  return (
    <div style={{position: 'absolute', inset: 0, background: e.bg, color: e.fg, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 20, top: 18, ...gro(72, 700, -0.05)}}>{e.t}</div>
      <div style={{position: 'absolute', left: 22, bottom: 18, ...mono(13), opacity: 0.7}}>EXTRA 0{g + 5}</div>
    </div>
  );
};

export const EndFace: React.FC<{i: number}> = ({i}) => {
  const id = ID[i];
  return (
    <div style={{position: 'absolute', inset: 0, background: id.bg}}>
      <div style={{position: 'absolute', inset: '18% 16%', background: id.fg, opacity: 0.92}} />
    </div>
  );
};

export const PosterFace: React.FC<{f: number; i: number; from: LayoutName; to: LayoutName}> = ({f, i, from, to}) => {
  const a = familyOf(from);
  const b = familyOf(to);
  const on = (fam: ReturnType<typeof familyOf>, inn: number, out: number) =>
    (a === fam || b === fam) && f >= inn && f < out;
  const pitKind = f >= BEATS.fix ? 'fix' : f >= BEATS.flat ? 'flat' : 'noise';
  return (
    <>
      {(on('HOOK', 0, 110) || on('COVER', 70, 300)) && <CoverFace f={f} i={i} />}
      {on('LAYER', 270, 520) && <LayerFace f={f} i={i} />}
      {on('PROOF', 450, 660) && <ProofFace f={f} i={i} />}
      {on('TEACH', 600, 860) && <TeachFace f={f} i={i} />}
      {f >= BEATS.noise - 12 && f < BEATS.end && <PitFace f={f} i={i} kind={pitKind} />}
      {f >= BEATS.end - 10 && <EndFace i={i} />}
    </>
  );
};
