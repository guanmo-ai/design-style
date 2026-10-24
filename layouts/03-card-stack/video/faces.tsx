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
  return (
    <div style={{position: 'absolute', inset: 0, color: id.fg, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 18, background: i === 1 ? C.red : id.fg, opacity: i === 1 ? 1 : 0.22}} />
      <div style={{position: 'absolute', left: 36, top: 28, right: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
        <span style={{...mono(13), opacity: 0.7}}>{id.vol}.{id.no}</span>
        <span style={{...sc(15, 700, 0.12)}}>{id.tag}</span>
      </div>
      <div style={{position: 'absolute', left: 28, top: '16%', right: 16}}>
        <div style={{...gro(i === 2 ? 168 : 188, 700, -0.07), lineHeight: 0.82}}>{id.verb}</div>
      </div>
      <div style={{position: 'absolute', left: 36, top: '46%'}}>
        <div style={{...gro(28, 700, 0.08), opacity: 0.88}}>{id.en}</div>
        <div style={{width: 72, height: 4, background: i === 1 ? C.red : id.fg, marginTop: 10}} />
      </div>
      <div style={{position: 'absolute', left: 36, bottom: 36, right: 28}}>
        <div style={{...sc(16, 500, 0.08), opacity: 0.72}}>24.10.26</div>
        <div style={{...mono(12), opacity: 0.5, marginTop: 6}}>NO.{id.no}  ·  520 × 740</div>
      </div>
      <div style={{position: 'absolute', right: 22, top: 86, width: 10, height: 10, borderRadius: 10, background: i === 1 ? C.red : id.fg, opacity: 0.85}} />
    </div>
  );
};

export const LayerFace: React.FC<{f: number; i: number}> = ({f, i}) => {
  const id = ID[i];
  const named = LAYER_NAME[i];
  const on = i === 3 && f >= BEATS.mark;
  return (
    <div style={{position: 'absolute', inset: 0, background: id.bg, color: id.fg, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: '32%', background: i === 1 ? C.red : 'rgba(0,0,0,0.18)'}} />
      <Marks c={on ? C.red : id.fg} />
      {on && <div style={{position: 'absolute', inset: 6, border: `3px solid ${C.red}`, pointerEvents: 'none'}} />}
      <div style={{position: 'absolute', left: '38%', top: 22, right: 20, display: 'flex', justifyContent: 'space-between'}}>
        <span style={{...gro(56, 700, -0.05)}}>L{i + 1}</span>
        <span style={{...mono(14), opacity: 0.7}}>z {40 - i * 18}</span>
      </div>
      <div style={{position: 'absolute', left: '38%', top: 92}}>
        <div style={{...sc(32, 700)}}>{named}</div>
        <div style={{...mono(13), opacity: 0.7, marginTop: 8}}>{id.en}  ·  {id.vol}.{id.no}</div>
      </div>
      <div style={{position: 'absolute', left: 16, bottom: 20, width: '26%'}}>
        <div style={{...gro(72, 700, -0.06), opacity: 0.35}}>{id.verb}</div>
      </div>
      <div style={{position: 'absolute', left: '38%', bottom: 22, right: 24, display: 'flex', gap: 6}}>
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <div key={k} style={{flex: 1, height: 12, background: k <= i ? id.fg : 'rgba(246,240,228,0.2)'}} />
        ))}
      </div>
    </div>
  );
};

export const ProofFace: React.FC<{f: number; i: number}> = ({f, i}) => {
  const p = PAPER[i];
  const id = ID[i];
  const picked = i === 1 && f >= BEATS.pick;
  return (
    <div style={{position: 'absolute', inset: 0, background: id.bg, color: id.fg, overflow: 'hidden'}}>
      <Marks c={id.fg} s={16} />
      <div style={{position: 'absolute', left: 22, top: 28, right: 20}}>
        <div style={{...mono(12), opacity: 0.7}}>PROOF 0{i + 1}</div>
        <div style={{...gro(i === 1 ? 42 : 32, 700, -0.04), marginTop: 10}}>{p.name}</div>
        <div style={{...sc(16, 500), marginTop: 8, opacity: 0.8}}>{p.gsm} gsm</div>
      </div>
      <div style={{position: 'absolute', left: 22, top: '42%', ...gro(88, 700, -0.06), opacity: 0.28}}>{id.verb}</div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 48, height: 22, display: 'flex'}}>
        {p.cmyk.map((c) => (
          <div key={c} style={{flex: 1, background: c}} />
        ))}
      </div>
      <div style={{position: 'absolute', left: 22, bottom: 16, ...mono(12), opacity: 0.65}}>C M Y K  ·  套准</div>
      {picked && (
        <div style={{position: 'absolute', right: 16, top: 28, border: `2px solid ${C.red}`, background: C.red, color: C.cream, padding: '6px 8px', ...gro(16, 700, 0.06)}}>
          选定
        </div>
      )}
    </div>
  );
};

export const TeachFace: React.FC<{f: number; i: number}> = ({f, i}) => {
  const r = RULES[i];
  const id = ID[i];
  const hit = BEATS[['r1', 'r2', 'r3', 'r3'][i] as 'r1' | 'r2' | 'r3'] + (i === 3 ? 30 : 0);
  const pulse = spr(f, hit, POP, 22);
  return (
    <div style={{position: 'absolute', inset: 0, background: id.bg, color: id.fg, overflow: 'hidden', transform: `scale(${1 + 0.04 * pulse})`}}>
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 22, background: i === 1 ? C.red : id.fg, opacity: i === 1 ? 1 : 0.22}} />
      <div style={{position: 'absolute', left: 36, top: 20, ...gro(20, 700), color: i === 1 ? C.red : id.fg, opacity: 0.85}}>{r.n}</div>
      <div style={{position: 'absolute', left: 36, top: 56, right: 18}}>
        <div style={{...gro(i === 2 ? 40 : 52, 700, -0.04)}}>{r.t}</div>
        <div style={{...sc(18, 500), marginTop: 12, opacity: 0.75}}>{r.d}</div>
      </div>
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
