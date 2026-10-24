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

const Vignette = () => (
  <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 42%, transparent 42%, rgba(8,8,10,0.42) 100%)', pointerEvents: 'none'}} />
);

const Shot: React.FC<{i: number}> = ({i}) => {
  if (i === 0) {
    return (
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#243548 0%,#3A5368 38%,#1A2834 46%,#0B1014 47%,#141C22 70%,#07090B 100%)'}}>
        <div style={{position: 'absolute', left: '61%', top: '18%', width: '11%', aspectRatio: '1', borderRadius: 999, background: 'radial-gradient(circle at 40% 40%,#F0C27A,#E36A4A 55%,#9A3B2F)'}} />
        <div style={{position: 'absolute', left: '58%', top: '48%', width: '18%', height: '10%', background: 'radial-gradient(ellipse, rgba(227,106,74,0.35), transparent 70%)'}} />
        <div style={{position: 'absolute', left: '8%', right: '22%', top: '62%', height: 5, background: '#0A0A0C', transform: 'rotate(-1deg)'}} />
        <div style={{position: 'absolute', left: '20%', top: '61%', width: '7%', height: '16%', background: '#15181C'}} />
        <div style={{position: 'absolute', left: '36%', top: '64%', width: '4%', height: '9%', background: '#1A1E22'}} />
        <Vignette />
      </div>
    );
  }
  if (i === 1) {
    return (
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(155deg,#EDE4D4 0%,#C8B89A 36%,#8A7A62 78%,#3A3228 100%)'}}>
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <div key={k}>
            <div style={{position: 'absolute', left: `${6 + k * 12}%`, top: `${10 + k * 13}%`, width: `${78 - k * 7}%`, height: 14, background: k % 2 ? '#4A4338' : '#2E2922', transform: 'skewX(-26deg)', boxShadow: '0 8px 0 rgba(0,0,0,0.12)'}} />
          </div>
        ))}
        <div style={{position: 'absolute', right: '10%', top: '12%', width: 22, height: '62%', background: 'linear-gradient(180deg,#2A241C,#16130F)'}} />
        <div style={{position: 'absolute', left: '18%', top: '70%', width: '10%', height: '18%', background: 'rgba(17,17,17,0.28)'}} />
        <Vignette />
      </div>
    );
  }
  if (i === 2) {
    return (
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#1A1A1E 0%,#0C0C0E 100%)'}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: '58%', height: '42%', background: 'linear-gradient(180deg,#16181C,#07080A)'}} />
        <div style={{position: 'absolute', left: '12%', top: '22%', right: '10%', height: '38%', display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 4, padding: 6, background: '#0A0A0C'}}>
          {Array.from({length: 10}, (_, k) => (
            <div key={k} style={{background: k === 3 ? '#E31C23' : k === 7 ? '#C4A35A' : '#D7B56A', opacity: 0.55 + (k % 3) * 0.12}} />
          ))}
        </div>
        <div style={{position: 'absolute', left: '8%', right: '8%', bottom: '8%', height: 3, background: 'rgba(196,163,90,0.35)'}} />
        <Vignette />
      </div>
    );
  }
  if (i === 3) {
    return (
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#E4EEF3 0%,#9BB0BC 55%,#6A7E8A 100%)'}}>
        <div style={{position: 'absolute', inset: '8% 14%', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 5}}>
          <div style={{background: 'linear-gradient(160deg,#F6F0E4 0%,#C8D6DE 100%)'}} />
          <div style={{background: 'linear-gradient(200deg,#D4A59A 0%,#8A9AA4 100%)'}} />
          <div style={{background: 'linear-gradient(20deg,#A8BCC8,#6A7E8A)'}} />
          <div style={{background: 'linear-gradient(200deg,#F6F0E4,#B8C6CE)'}} />
        </div>
        <div style={{position: 'absolute', left: '14%', right: '14%', top: '49%', height: 4, background: 'rgba(246,240,228,0.55)'}} />
        <div style={{position: 'absolute', left: '49%', top: '8%', bottom: '8%', width: 4, background: 'rgba(246,240,228,0.55)'}} />
        <Vignette />
      </div>
    );
  }
  if (i === 4) {
    return (
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#F4D2B0 0%,#C45C26 48%,#5A2418 100%)'}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: '18%', height: '20%', background: 'linear-gradient(180deg,#B84332,#7A241C)'}} />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
          <div key={k} style={{position: 'absolute', left: `${8 + (k % 4) * 22}%`, top: `${46 + Math.floor(k / 4) * 20}%`, width: `${10 + (k % 3)}%`, aspectRatio: '1', borderRadius: 999, background: ['#E31C23', '#C4A35A', '#2F4F3E', '#EDE6D6', '#163A3A', '#E36A4A', '#9A3B2F', '#F6F0E4'][k], boxShadow: 'inset 0 -6px 10px rgba(0,0,0,0.2)'}} />
        ))}
        <Vignette />
      </div>
    );
  }
  return (
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#D5D8DA 0%,#9A9EA2 42%,#5A5E62 78%,#2A2E32 100%)'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: '58%', height: '30%', background: 'rgba(246,240,228,0.08)'}} />
      <div style={{position: 'absolute', left: '40%', top: '36%', width: '7%', height: '26%', background: '#1A1A1E', opacity: 0.45}} />
      <div style={{position: 'absolute', left: '48%', top: '42%', width: '3%', height: '12%', background: '#111', opacity: 0.35}} />
      <Vignette />
    </div>
  );
};

const Caption: React.FC<{i: number}> = ({i}) => {
  const d = DECK[i];
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: '24%', background: C.cream, color: C.ink, padding: '10px 12px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
        <span style={{...gro(22, 700, -0.04)}}>{d.title}</span>
        <span style={{...mono(11), opacity: 0.5}}>{d.id}</span>
      </div>
      <div style={{...sc(13, 500), marginTop: 3}}>{d.zh}</div>
      <div style={{...mono(10), opacity: 0.55, marginTop: 6, display: 'flex', justifyContent: 'space-between'}}>
        <span>{d.lens}  ·  {d.expo}</span>
        <span style={{color: C.red}}>{'★'.repeat(d.stars)}</span>
      </div>
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

export const Face: React.FC<{i: number; fam: Family; w: number; h: number; front: boolean}> = ({i, fam, w, h, front}) => {
  const d = DECK[i];
  const thin = w < 100;
  const showMeta = front && w > 220 && h > 240;

  if (thin) {
    return (
      <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
        <Shot i={i} />
      </div>
    );
  }

  if (fam === 'BOARD') {
    return (
      <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: C.cream, color: C.ink, display: 'flex'}}>
        <div style={{width: Math.min(168, w * 0.34), position: 'relative', flex: '0 0 auto'}}>
          <Shot i={i} />
        </div>
        <div style={{flex: 1, padding: '18px 20px', minWidth: 0}}>
          <div style={{...mono(11), color: C.red, marginBottom: 8}}>{d.lane}</div>
          <div style={{...gro(30, 700, -0.04)}}>{d.task}</div>
          <div style={{...sc(16, 500), marginTop: 10, opacity: 0.7}}>{d.title}  ·  {d.zh}</div>
          <div style={{...mono(11), marginTop: 12, opacity: 0.45}}>{d.lens}  ·  ISO {d.iso}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: C.ink}}>
      <div style={{position: 'absolute', inset: 0, bottom: showMeta ? '24%' : 0}}>
        <Shot i={i} />
      </div>
      {showMeta ? <Caption i={i} /> : null}
      {(fam === 'PROOF' || fam === 'PRESS') && showMeta ? <Crop fg={C.cream} /> : null}
      {fam === 'FOLIO' && showMeta ? (
        <div style={{position: 'absolute', left: 10, top: 10, background: C.red, color: C.cream, ...mono(11), padding: '4px 7px'}}>
          {i === 1 ? 'COVER' : `P.${d.id}`}
        </div>
      ) : null}
      {fam === 'PROOF' && i === 1 && showMeta ? (
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
