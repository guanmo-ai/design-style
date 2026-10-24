/** 16 张异形卡的脸。身份色不换；世界只加小零件，不换皮成白 UI。 */
import React from 'react';
import {C} from '../tokens';
import {Family} from './layout';
import {gro, mono, sc} from './ui';

export const DECK = [
  {bg: C.red, bg2: '#C4161C', fg: C.cream, mark: '刊', en: '01', sub: 'VOL.03'},
  {bg: C.cream, bg2: '#E4D8C4', fg: C.ink, mark: '提', en: '02', sub: 'LIFT'},
  {bg: C.night, bg2: '#1A1A1E', fg: C.cream, mark: '压', en: '03', sub: 'PRESS'},
  {bg: C.teal, bg2: '#0F2C2C', fg: C.cream, mark: '叠', en: '04', sub: 'STACK'},
  {bg: C.sand, bg2: '#B5A384', fg: C.ink, mark: '甲', en: '05', sub: 'PROOF A'},
  {bg: C.rust, bg2: '#7A2E24', fg: C.cream, mark: '乙', en: '06', sub: 'PROOF B'},
  {bg: C.olive, bg2: '#2A331E', fg: C.cream, mark: '丙', en: '07', sub: 'LANE'},
  {bg: C.blush, bg2: '#C08E84', fg: C.ink, mark: '丁', en: '08', sub: 'MAIL'},
  {bg: C.coral, bg2: '#C45438', fg: C.cream, mark: 'A', en: '09', sub: 'SHOT 09'},
  {bg: C.slate, bg2: '#2A2E38', fg: C.cream, mark: 'B', en: '10', sub: 'SHOT 10'},
  {bg: C.mustard, bg2: '#A8883E', fg: C.ink, mark: 'C', en: '11', sub: 'CARD'},
  {bg: C.moss, bg2: '#1F362A', fg: C.cream, mark: 'D', en: '12', sub: 'FOLIO'},
  {bg: '#2B4C7E', bg2: '#1C3558', fg: C.cream, mark: '子', en: '13', sub: 'SET 子'},
  {bg: '#6B3FA0', bg2: '#4E2C78', fg: C.cream, mark: '丑', en: '14', sub: 'SET 丑'},
  {bg: '#C45C26', bg2: '#9A471C', fg: C.cream, mark: '寅', en: '15', sub: 'SET 寅'},
  {bg: '#1F6B6B', bg2: '#154B4B', fg: C.cream, mark: '卯', en: '16', sub: 'SET 卯'},
] as const;

const WORLD: Record<Family, string[]> = {
  OPEN: DECK.map((d) => d.sub),
  MAG: ['VOL', 'KAN', 'INK', 'LAY', '脊', '脊', '脊', '脊', '脊', '脊', '脊', '脊', '脊', '脊', '脊', '脊'],
  LAYER: I16('L'),
  PROOF: ['MK', 'CU', 'FE', 'CP', 'GF', 'MO', 'AR', 'NT', 'SK', 'BI', 'RH', 'VE', 'SA', 'TO', 'PL', 'OK'],
  BOARD: ['TO', 'TO', 'TO', 'TO', 'TO', 'TO', 'DO', 'DO', 'DO', 'DO', 'DO', 'OK', 'OK', 'OK', 'OK', 'OK'],
  ALBUM: ['9.12', '9.14', '10.01', '10.03', '10.08', '10.11', '10.18', '10.22', '11.02', '11.04', '11.09', '11.16', '11.20', '12.01', '12.08', '12.14'],
  NOTE: ['Mail', 'Cal', 'Pay', 'Map', 'Air', 'Bus', 'Git', 'Fig', 'Lin', 'Not', 'X', 'Sl', 'Tg', 'Dc', 'Ig', 'Yt'],
  PAY: ['8821', '4402', '1190', '7734', '2208', '5516', '9088', '3310', '6671', '1044', '2890', '7455', '0126', '3988', '5601', '8143'],
  FOLIO: ['P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'P08', 'P09', 'P10', 'P11', 'P12', 'P13', 'P14', 'P15', 'P16'],
  PIT: I16('!'),
  END: I16(''),
};

function I16(p: string) {
  return Array.from({length: 16}, (_, i) => `${p}${i + 1}`);
}

export const EXTRA_DECK = [
  {bg: C.sand, fg: C.ink, mark: '杂'},
  {bg: C.red, fg: C.cream, mark: '噪'},
  {bg: C.ink2, fg: C.cream, mark: '声'},
  {bg: C.teal, fg: C.cream, mark: '多'},
  {bg: C.mustard, fg: C.ink, mark: '乱'},
  {bg: C.coral, fg: C.cream, mark: '挤'},
  {bg: C.olive, fg: C.cream, mark: '叠'},
  {bg: C.slate, fg: C.cream, mark: '糊'},
] as const;

const Ornament: React.FC<{i: number; fg: string; w: number; h: number}> = ({i, fg, w, h}) => {
  const kind = i % 5;
  if (kind === 0) {
    return (
      <>
        {[0, 1, 2].map((k) => (
          <div key={k} style={{position: 'absolute', left: 12, right: 12, top: h * 0.62 + k * 10, height: 2, background: fg, opacity: 0.28}} />
        ))}
      </>
    );
  }
  if (kind === 1) {
    return <div style={{position: 'absolute', right: 12, top: 28, width: Math.min(54, w * 0.28), height: Math.min(54, w * 0.28), borderRadius: 999, border: `2px solid ${fg}`, opacity: 0.35}} />;
  }
  if (kind === 2) {
    return <div style={{position: 'absolute', left: -20, top: h * 0.55, width: w * 1.4, height: 18, background: fg, opacity: 0.16, transform: 'rotate(-18deg)'}} />;
  }
  if (kind === 3) {
    return (
      <div style={{position: 'absolute', right: 10, bottom: 28, display: 'grid', gridTemplateColumns: 'repeat(3,7px)', gap: 5, opacity: 0.35}}>
        {Array.from({length: 9}, (_, k) => (
          <div key={k} style={{width: 7, height: 7, borderRadius: 7, background: fg}} />
        ))}
      </div>
    );
  }
  return <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 14, background: fg, opacity: 0.22}} />;
};

const WorldBits: React.FC<{fam: Family; i: number; fg: string; w: number; h: number}> = ({fam, i, fg, w, h}) => {
  if (fam === 'MAG' && w > 80) {
    return (
      <div style={{position: 'absolute', left: 12, right: 12, bottom: 28, display: 'flex', gap: 3, height: 18, alignItems: 'flex-end'}}>
        {Array.from({length: 18}, (_, k) => (
          <div key={k} style={{width: 3, height: 6 + ((i + k) % 5) * 3, background: fg, opacity: 0.35}} />
        ))}
      </div>
    );
  }
  if (fam === 'PROOF') {
    const s = 10;
    const b = `1px solid ${fg}`;
    return (
      <>
        <div style={{position: 'absolute', left: 6, top: 6, width: s, height: s, borderLeft: b, borderTop: b, opacity: 0.45}} />
        <div style={{position: 'absolute', right: 6, top: 6, width: s, height: s, borderRight: b, borderTop: b, opacity: 0.45}} />
        <div style={{position: 'absolute', left: 6, bottom: 6, width: s, height: s, borderLeft: b, borderBottom: b, opacity: 0.45}} />
        <div style={{position: 'absolute', right: 6, bottom: 6, width: s, height: s, borderRight: b, borderBottom: b, opacity: 0.45}} />
      </>
    );
  }
  if (fam === 'PAY' && w > 120 && h > 140) {
    return (
      <>
        <div style={{position: 'absolute', left: 16, top: 44, width: 36, height: 28, borderRadius: 5, background: fg, opacity: 0.28}} />
        <div style={{position: 'absolute', left: 16, bottom: 36, ...mono(14), opacity: 0.55}}>{'••••'}</div>
      </>
    );
  }
  if (fam === 'ALBUM' && h > 160) {
    return <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 28, background: fg, opacity: 0.14}} />;
  }
  if (fam === 'BOARD' && w > 160) {
    const col = i < 6 ? C.red : i < 11 ? C.mustard : C.moss;
    return <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 8, background: col}} />;
  }
  return null;
};

export const Face: React.FC<{i: number; fam: Family; w: number; h: number}> = ({i, fam, w, h}) => {
  const d = DECK[i];
  const tag = WORLD[fam][i];
  const thin = w < 80;
  const short = h < 120;
  const big = thin ? 18 : short ? Math.min(36, h * 0.42) : w < 140 ? 28 : w < 220 ? 42 : w < 360 ? 64 : 88;
  if (thin) {
    return (
      <div style={{position: 'absolute', inset: 0, color: d.fg, overflow: 'hidden'}}>
        <div style={{position: 'absolute', inset: 8, writingMode: 'vertical-rl', ...gro(18, 700, -0.04)}}>{d.mark}</div>
        <div style={{position: 'absolute', left: 6, bottom: 8, ...mono(9), opacity: 0.65}}>{d.en}</div>
      </div>
    );
  }
  if (short) {
    return (
      <div style={{position: 'absolute', inset: 0, color: d.fg, overflow: 'hidden', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12}}>
        <div style={{...gro(big, 700, -0.05), flex: '0 0 auto'}}>{d.mark}</div>
        <div style={{flex: 1, minWidth: 0}}>
          <div style={{...mono(11), opacity: 0.6}}>{d.en}</div>
          {tag ? <div style={{...sc(14, 700, 0.04), opacity: 0.85, marginTop: 2}}>{tag}</div> : null}
        </div>
        <WorldBits fam={fam} i={i} fg={d.fg} w={w} h={h} />
      </div>
    );
  }
  return (
    <div style={{position: 'absolute', inset: 0, color: d.fg, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 10, background: d.fg, opacity: 0.18}} />
      <div style={{position: 'absolute', left: 12, top: 10, ...mono(Math.max(9, w * 0.042)), opacity: 0.7}}>{d.en}</div>
      <div style={{position: 'absolute', right: 12, top: 10, ...mono(Math.max(9, w * 0.036)), opacity: 0.5}}>{d.sub}</div>
      <div style={{position: 'absolute', left: 10, top: '22%', right: 8, ...gro(big, 700, -0.06), lineHeight: 0.85}}>{d.mark}</div>
      {tag ? <div style={{position: 'absolute', left: 12, bottom: 10, ...sc(Math.max(10, w * 0.048), 700, 0.06), opacity: 0.8}}>{tag}</div> : null}
      <Ornament i={i} fg={d.fg} w={w} h={h} />
      <WorldBits fam={fam} i={i} fg={d.fg} w={w} h={h} />
    </div>
  );
};

export const ExtraFace: React.FC<{g: number}> = ({g}) => {
  const e = EXTRA_DECK[g];
  return (
    <div style={{position: 'absolute', inset: 0, background: e.bg, color: e.fg, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 14, top: 12, ...gro(48, 700)}}>{e.mark}</div>
      <div style={{position: 'absolute', left: 16, bottom: 14, ...mono(13), opacity: 0.7}}>{`X${g + 1}`}</div>
    </div>
  );
};
