/** 6 张真作品：选片台上的样片，不是抽象色块。 */
import React from 'react';
import {C} from '../tokens';
import {Family} from './layout';
import {gro, mono, sc} from './ui';

export const DECK = [
  {id: '04', title: 'Harbor', zh: '港口', lens: '85mm', expo: '1/250  f/2.8', iso: '200', stars: 3, task: '已看过', lane: 'TO'},
  {id: '11', title: 'Stairwell', zh: '楼梯', lens: '35mm', expo: '1/125  f/4', iso: '400', stars: 5, task: '定封面', lane: 'DO'},
  {id: '18', title: 'Night Bus', zh: '夜班车', lens: '50mm', expo: '1/60  f/1.8', iso: '800', stars: 4, task: '核对', lane: 'DO'},
  {id: '23', title: 'Glass', zh: '玻璃', lens: '85mm', expo: '1/200  f/2', iso: '250', stars: 3, task: '备选', lane: 'TO'},
  {id: '07', title: 'Market', zh: '早市', lens: '28mm', expo: '1/250  f/5.6', iso: '200', stars: 3, task: '修色', lane: 'OK'},
  {id: '31', title: 'Fog', zh: '雾', lens: '50mm', expo: '1/80  f/2.8', iso: '500', stars: 2, task: '归档', lane: 'OK'},
] as const;

export const EXTRA_DECK = [
  {bg: '#5C564C', fg: C.cream, mark: '废'},
  {bg: C.red, fg: C.cream, mark: '重'},
  {bg: C.sand, fg: C.ink, mark: '糊'},
  {bg: C.teal, fg: C.cream, mark: '多'},
] as const;

const Shot: React.FC<{i: number}> = ({i}) => {
  if (i === 0) {
    return (
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#1B2A38 0%,#2A4154 46%,#0C1418 47%,#070B0E 100%)'}}>
        <div style={{position: 'absolute', left: '64%', top: '20%', width: '14%', aspectRatio: '1', borderRadius: 999, background: '#E36A4A'}} />
        <div style={{position: 'absolute', left: '10%', right: '18%', top: '58%', height: 7, background: '#0A0A0C'}} />
        <div style={{position: 'absolute', left: '22%', top: '58%', width: '8%', height: '18%', background: '#151518'}} />
      </div>
    );
  }
  if (i === 1) {
    return (
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(160deg,#E8DFD0 0%,#C8B89A 40%,#8A7A62 100%)'}}>
        {[0, 1, 2, 3, 4].map((k) => (
          <div key={k} style={{position: 'absolute', left: `${8 + k * 14}%`, top: `${12 + k * 14}%`, width: `${70 - k * 8}%`, height: 10, background: k % 2 ? '#5C5346' : '#3A342C', transform: 'skewX(-28deg)'}} />
        ))}
        <div style={{position: 'absolute', right: '12%', top: '18%', width: 18, height: '54%', background: '#2A241C'}} />
      </div>
    );
  }
  if (i === 2) {
    return (
      <div style={{position: 'absolute', inset: 0, background: '#121214'}}>
        <div style={{position: 'absolute', left: '18%', top: '28%', right: '14%', height: '32%', display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 5}}>
          {Array.from({length: 10}, (_, k) => (
            <div key={k} style={{background: k === 3 ? '#E31C23' : '#C4A35A', opacity: 0.85}} />
          ))}
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: '18%', background: '#0A0A0C'}} />
      </div>
    );
  }
  if (i === 3) {
    return (
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#D4E2EA 0%,#A8BCC8 100%)'}}>
        <div style={{position: 'absolute', left: '18%', top: '10%', right: '18%', bottom: '10%', border: '3px solid rgba(246,240,228,0.7)'}} />
        <div style={{position: 'absolute', left: '49%', top: '10%', bottom: '10%', width: 3, background: 'rgba(246,240,228,0.7)'}} />
        <div style={{position: 'absolute', left: '18%', right: '18%', top: '49%', height: 3, background: 'rgba(246,240,228,0.7)'}} />
        <div style={{position: 'absolute', right: '22%', top: '16%', width: '20%', height: '20%', background: 'rgba(227,28,35,0.35)'}} />
      </div>
    );
  }
  if (i === 4) {
    return (
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#F2C9A0 0%,#C45C26 55%,#5A2418 100%)'}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: '22%', height: '16%', background: '#9A3B2F'}} />
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <div key={k} style={{position: 'absolute', left: `${10 + (k % 3) * 28}%`, top: `${48 + Math.floor(k / 3) * 18}%`, width: '12%', aspectRatio: '1', borderRadius: 999, background: ['#E31C23', '#C4A35A', '#2F4F3E', '#EDE6D6', '#163A3A', '#E36A4A'][k]}} />
        ))}
      </div>
    );
  }
  return (
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#C8CCCE 0%,#8A8E92 50%,#4A4E52 100%)'}}>
      <div style={{position: 'absolute', left: '42%', top: '38%', width: '8%', height: '28%', background: '#1A1A1E', opacity: 0.55}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: '62%', height: '20%', background: 'rgba(246,240,228,0.12)'}} />
    </div>
  );
};

const Stars: React.FC<{n: number; color: string}> = ({n, color}) => (
  <span style={{letterSpacing: '0.12em'}}>{'★'.repeat(n)}{'☆'.repeat(Math.max(0, 5 - n)).slice(0, Math.max(0, 5 - n))}</span>
);

const Caption: React.FC<{i: number; compact?: boolean}> = ({i, compact}) => {
  const d = DECK[i];
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: compact ? '28%' : '24%', background: C.cream, color: C.ink, padding: compact ? '6px 8px' : '10px 12px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
        <span style={{...gro(compact ? 16 : 22, 700, -0.04)}}>{d.title}</span>
        <span style={{...mono(compact ? 9 : 11), opacity: 0.55}}>{d.id}</span>
      </div>
      <div style={{...sc(compact ? 11 : 13, 500), marginTop: 3}}>{d.zh}</div>
      {!compact ? (
        <div style={{...mono(10), opacity: 0.55, marginTop: 6, display: 'flex', justifyContent: 'space-between'}}>
          <span>{d.lens}  ·  {d.expo}</span>
          <span style={{color: C.red}}><Stars n={d.stars} color={C.red} /></span>
        </div>
      ) : null}
    </div>
  );
};

const Crop: React.FC<{fg?: string}> = ({fg = C.ink}) => {
  const s = 11;
  const b = `1.5px solid ${fg}`;
  return (
    <>
      <div style={{position: 'absolute', left: 6, top: 6, width: s, height: s, borderLeft: b, borderTop: b, opacity: 0.5}} />
      <div style={{position: 'absolute', right: 6, top: 6, width: s, height: s, borderRight: b, borderTop: b, opacity: 0.5}} />
      <div style={{position: 'absolute', left: 6, bottom: 6, width: s, height: s, borderLeft: b, borderBottom: b, opacity: 0.5}} />
      <div style={{position: 'absolute', right: 6, bottom: 6, width: s, height: s, borderRight: b, borderBottom: b, opacity: 0.5}} />
    </>
  );
};

export const Face: React.FC<{i: number; fam: Family; w: number; h: number}> = ({i, fam, w, h}) => {
  const d = DECK[i];
  const thin = w < 90;
  const short = h < 160;
  const wide = w > h * 1.35;

  if (thin) {
    return (
      <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
        <Shot i={i} />
        <div style={{position: 'absolute', inset: 6, writingMode: 'vertical-rl', color: C.cream, mixBlendMode: 'difference', ...gro(16, 700)}}>{d.zh}</div>
      </div>
    );
  }

  if (fam === 'BOARD' || wide) {
    return (
      <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: C.cream, color: C.ink, display: 'flex'}}>
        <div style={{width: Math.min(160, w * 0.36), position: 'relative', flex: '0 0 auto'}}>
          <Shot i={i} />
        </div>
        <div style={{flex: 1, padding: '16px 18px', minWidth: 0}}>
          <div style={{...mono(11), color: C.red, marginBottom: 6}}>{d.lane}</div>
          <div style={{...gro(28, 700, -0.04)}}>{d.task}</div>
          <div style={{...sc(16, 500), marginTop: 8, opacity: 0.7}}>{d.title}  ·  {d.zh}</div>
          <div style={{...mono(11), marginTop: 10, opacity: 0.5}}>{d.lens}</div>
        </div>
      </div>
    );
  }

  if (short) {
    return (
      <div style={{position: 'absolute', inset: 0, overflow: 'hidden', display: 'flex'}}>
        <div style={{width: 120, position: 'relative'}}><Shot i={i} /></div>
        <div style={{flex: 1, background: C.cream, color: C.ink, padding: '10px 14px'}}>
          <div style={{...gro(22, 700)}}>{d.title}</div>
          <div style={{...sc(13, 500), marginTop: 4}}>{d.zh}  ·  {d.lens}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: C.ink}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: '24%'}}>
        <Shot i={i} />
      </div>
      <Caption i={i} />
      {fam === 'PROOF' || fam === 'PRESS' ? <Crop fg={C.cream} /> : null}
      {fam === 'FOLIO' ? (
        <div style={{position: 'absolute', left: 10, top: 10, background: C.red, color: C.cream, ...mono(11), padding: '4px 7px'}}>
          {i === 1 ? 'COVER' : `P.${d.id}`}
        </div>
      ) : null}
      {fam === 'PROOF' && i === 1 ? (
        <div style={{position: 'absolute', right: 12, top: 12, ...mono(12), color: C.cream, background: C.red, padding: '4px 7px'}}>GRADE A</div>
      ) : null}
    </div>
  );
};

export const ExtraFace: React.FC<{g: number}> = ({g}) => {
  const e = EXTRA_DECK[g];
  return (
    <div style={{position: 'absolute', inset: 0, background: e.bg, color: e.fg, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 14, top: 12, ...gro(40, 700)}}>{e.mark}</div>
      <div style={{position: 'absolute', left: 14, bottom: 12, ...sc(14, 500), opacity: 0.7}}>不该出现</div>
    </div>
  );
};
