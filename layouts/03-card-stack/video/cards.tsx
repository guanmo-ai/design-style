/** 布局 03 · Card Stack —— 四个世界里，同一叠 4 张卡各自装真实内容 */
import React from 'react';
import {E, POP, SMOOTH, spr, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {BEATS, RULES_AT, SCENE} from './layout';
import {count, disp, mono, sc, ui} from './ui';

type P = {f: number; i: number};
const cap = (c = C.ink2): React.CSSProperties => ({position: 'absolute', left: 28, top: 22, ...ui(13, 600), color: c, letterSpacing: '0.06em', textTransform: 'uppercase'});

const BARS = [32, 48, 28, 64, 40, 92, 44, 56];
const SPARK = [16, 22, 18, 30, 26, 38, 32, 46, 40, 54, 48, 62];
const PEOPLE = [
  {name: '林可', wait: '2h', role: 'Design', color: '#F59E8B'},
  {name: 'Jordan', wait: '5h', role: 'Review', color: '#93C5FD'},
  {name: '阿南', wait: '1d', role: 'Copy', color: '#A7F3D0'},
];

const Bars: React.FC<{accent: string; f: number; at: number; h?: number}> = ({accent, f, at, h = 78}) => (
  <div style={{position: 'absolute', left: 28, right: 28, bottom: 22, height: h, display: 'flex', alignItems: 'flex-end', gap: 8}}>
    {BARS.map((v, i) => {
      const p = spr(f, at + i * 3, POP, 26);
      return <div key={i} style={{flex: 1, height: v * (0.12 + 0.88 * p), borderRadius: 5, background: i === 5 ? accent : '#D9DEE7', transform: `scaleY(${0.2 + 0.8 * p})`, transformOrigin: 'bottom'}} />;
    })}
  </div>
);

const Spark: React.FC<{accent: string}> = ({accent}) => {
  const d = SPARK.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i / (SPARK.length - 1)) * 240} ${70 - v}`).join(' ');
  return (
    <svg width={248} height={78} viewBox="0 0 248 78" style={{position: 'absolute', right: 24, bottom: 18}}>
      <path d={d} fill="none" stroke={accent} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={248} cy={70 - SPARK[SPARK.length - 1]} r={4} fill={accent} />
    </svg>
  );
};

/* ---------------- 01 钩子：产品队列 ---------------- */
export const KeyFace: React.FC<P> = ({f, i}) => {
  const at = SCENE.KEY.in + i * 4;
  switch (i) {
    case 0:
      return (
        <>
          <div style={cap()}>Focus · P0</div>
          <div style={{position: 'absolute', left: 28, top: 48, ...sc(28, 700, 0.01), color: C.ink}}>本周只做这一件</div>
          <div style={{position: 'absolute', left: 28, top: 88, ...ui(15, 500), color: C.ink2}}>This week's bet · ship the layout film</div>
          <div style={{position: 'absolute', left: 28, top: 124, display: 'flex', gap: 10}}>
            {[['Priority', 'P0'], ['Owner', 'You'], ['Due', 'Fri']].map(([a, b]) => (
              <div key={a} style={{padding: '10px 14px', borderRadius: 12, background: a === 'Priority' ? C.accentSoft : C.chip, minWidth: 88}}>
                <div style={{...ui(11, 500), color: C.ink2}}>{a}</div>
                <div style={{...sc(20, 700), color: a === 'Priority' ? C.accent : C.ink, marginTop: 6}}>{b}</div>
              </div>
            ))}
          </div>
          <Bars accent={C.accent} f={f} at={at} />
        </>
      );
    case 1:
      return (
        <>
          <div style={cap()}>Inbox · 12 waiting</div>
          <div style={{position: 'absolute', left: 28, top: 48, ...sc(26, 700), color: C.ink}}>先回最先等的人</div>
          <div style={{position: 'absolute', left: 28, right: 28, top: 96, display: 'flex', flexDirection: 'column', gap: 8}}>
            {PEOPLE.map((p, k) => {
              const s = spr(f, at + 6 + k * 5, POP, 26);
              return (
                <div key={p.name} style={{display: 'flex', alignItems: 'center', height: 36, opacity: Math.min(1, s * 1.4), transform: `translateX(${(1 - s) * 28}px)`}}>
                  <div style={{width: 26, height: 26, borderRadius: 13, background: p.color, marginRight: 10}} />
                  <div>
                    <div style={{...sc(15, 600), color: C.ink}}>{p.name}</div>
                    <div style={{...ui(11, 500), color: C.ink3, marginTop: 3}}>{p.role}</div>
                  </div>
                  <span style={{...mono(12), color: C.ink3, marginLeft: 'auto'}}>{p.wait}</span>
                </div>
              );
            })}
          </div>
        </>
      );
    case 2:
      return (
        <>
          <div style={cap()}>Sprint · 8 / 14</div>
          <div style={{position: 'absolute', left: 28, top: 48, ...sc(26, 700), color: C.ink}}>这一周的进度</div>
          <div style={{position: 'absolute', left: 28, top: 100, ...disp(56, 600, -0.04), color: C.ink}}>{count(f, at, 36, 57)}%</div>
          <div style={{position: 'absolute', left: 28, right: 28, bottom: 36, height: 10, borderRadius: 5, background: '#E6EAF0', overflow: 'hidden'}}>
            <div style={{width: `${57 * spr(f, at + 8, SMOOTH, 32)}%`, height: '100%', background: C.accent, borderRadius: 5}} />
          </div>
          <div style={{position: 'absolute', right: 28, top: 112, textAlign: 'right'}}>
            <div style={{...mono(13), color: C.ink3}}>8 of 14</div>
            <div style={{...sc(14, 500), color: C.ink2, marginTop: 8}}>Due Friday</div>
          </div>
        </>
      );
    default:
      return (
        <>
          <div style={cap()}>Revenue</div>
          <div style={{position: 'absolute', left: 28, top: 48, ...sc(22, 700), color: C.ink}}>这周进账</div>
          <div style={{position: 'absolute', left: 28, top: 88, ...disp(44, 600, -0.04), color: C.ink}}>${count(f, at, 40, 48.2, 1)}k</div>
          <div style={{position: 'absolute', left: 28, top: 148, ...ui(14, 600), color: '#16A34A'}}>+12% MoM</div>
          <Spark accent={C.accent} />
        </>
      );
  }
};

/* ---------------- 02 iOS Wallet / 通知 / Sheet / 扫码 / 抽卡 ---------------- */
const Grabber = () => <div style={{position: 'absolute', left: '50%', top: 10, width: 42, height: 5, marginLeft: -21, borderRadius: 3, background: '#D1D5DB'}} />;

export const IosFace: React.FC<P> = ({f, i}) => {
  switch (i) {
    case 0:
      return (
        <>
          <Grabber />
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#1D4ED8,#1E3A8A)'}} />
          <div style={{position: 'absolute', left: 22, top: 28, ...ui(12, 600), color: 'rgba(255,255,255,.7)', letterSpacing: '0.14em'}}>UNITED</div>
          <div style={{position: 'absolute', left: 22, top: 56, display: 'flex', alignItems: 'baseline', gap: 16}}>
            <div>
              <div style={{...disp(44, 600, -0.04), color: '#fff'}}>SFO</div>
              <div style={{...ui(12, 500), color: 'rgba(255,255,255,.65)', marginTop: 6}}>San Francisco</div>
            </div>
            <div style={{...ui(12, 500), color: 'rgba(255,255,255,.5)'}}>— UA 838 —</div>
            <div>
              <div style={{...disp(44, 600, -0.04), color: '#fff'}}>NRT</div>
              <div style={{...ui(12, 500), color: 'rgba(255,255,255,.65)', marginTop: 6}}>Tokyo Narita</div>
            </div>
          </div>
          <div style={{position: 'absolute', left: 22, right: 22, top: 160, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10}}>
            {[['Gate', 'B12'], ['Seat', '14A'], ['Boards', '09:40']].map(([a, b], k) => {
              const s = spr(f, BEATS.gate + k * 4, POP, 28);
              return (
                <div key={a} style={{transform: `scale(${0.86 + 0.14 * s})`, opacity: Math.min(1, s * 1.4)}}>
                  <div style={{...ui(11, 500), color: 'rgba(255,255,255,.55)'}}>{a}</div>
                  <div style={{...disp(22, 600, -0.02), color: '#fff', marginTop: 6}}>{b}</div>
                </div>
              );
            })}
          </div>
          <div style={{position: 'absolute', left: 22, right: 22, bottom: 28, height: 56, borderRadius: 8, background: 'repeating-linear-gradient(90deg,#fff 0 2px, transparent 2px 6px)', overflow: 'hidden'}}>
            <div style={{position: 'absolute', left: 0, right: 0, top: 56 * spr(f, BEATS.zoom, SMOOTH, 20), height: 3, background: 'rgba(255,255,255,.95)', boxShadow: '0 0 12px rgba(255,255,255,.8)', opacity: tween(f, BEATS.zoom, 4, 0, 1) * (1 - tween(f, BEATS.zoom + 22, 8, 0, 1, E.inOut))}} />
          </div>
          <div style={{position: 'absolute', left: 22, bottom: 92, ...ui(12, 500), color: 'rgba(255,255,255,.7)'}}>{f >= BEATS.zoom + 16 ? 'Checked in · Gate B12' : 'Boarding Pass · Oct 24'}</div>
        </>
      );
    case 1:
      return (
        <>
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#111827,#374151)'}} />
          <div style={{position: 'absolute', left: 22, top: 28, ...ui(13, 600), color: 'rgba(255,255,255,.6)'}}>Apple Card</div>
          <div style={{position: 'absolute', left: 22, top: 72, width: 36, height: 28, borderRadius: 6, background: 'linear-gradient(135deg,#FDE68A,#F59E0B)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.5)'}} />
          <div style={{position: 'absolute', left: 22, top: 130, ...mono(18), color: 'rgba(255,255,255,.9)', letterSpacing: '0.12em'}}>•••• 4242</div>
          <div style={{position: 'absolute', left: 22, bottom: 36, ...ui(13, 500), color: 'rgba(255,255,255,.7)'}}>观默 · Daily Cash 2%</div>
          <div style={{position: 'absolute', right: 22, bottom: 36, ...disp(18, 600), color: '#fff'}}>Wallet</div>
        </>
      );
    case 2:
      return (
        <>
          <Grabber />
          <div style={{position: 'absolute', left: 20, top: 28, display: 'flex', alignItems: 'center', gap: 10}}>
            <div style={{width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(180deg,#5BF675,#0CBD2A)'}} />
            <div>
              <div style={{...sc(15, 700), color: C.ink}}>信息</div>
              <div style={{...ui(11, 500), color: C.ink3, marginTop: 3}}>现在</div>
            </div>
          </div>
          <div style={{position: 'absolute', left: 20, top: 78, right: 20, ...sc(18, 500), color: C.ink, lineHeight: 1.45, opacity: Math.min(1, spr(f, BEATS.note + 4, POP, 22) * 1.5)}}>
            {f >= BEATS.sheet - 8 ? '共享登机牌？点下面那层。' : '林可：设计稿发你了，顶层那张先看。'}
          </div>
          <div style={{position: 'absolute', left: 20, top: 150, ...ui(13, 500), color: C.ink3}}>iOS Notification Stack · 2 more below</div>
        </>
      );
    default:
      return (
        <>
          <Grabber />
          <div style={{position: 'absolute', left: 20, top: 32, ...sc(20, 700), color: C.ink}}>共享这张登机牌？</div>
          <div style={{position: 'absolute', left: 20, top: 68, ...ui(14, 500), color: C.ink2}}>Share Pass · Messages / Mail / Wallet</div>
          {['拷贝', '隔空投送', '取消'].map((t, k2) => {
            const s = spr(f, BEATS.sheet + 4 + k2 * 5, POP, 28);
            return (
              <div key={t} style={{position: 'absolute', left: 20, right: 20, top: 110 + k2 * 52, height: 44, borderRadius: 12, background: k2 === 2 ? C.chip : C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', ...sc(16, 600), color: k2 === 2 ? C.ink2 : C.accent, transform: `scale(${0.72 + 0.28 * s})`, opacity: Math.min(1, s * 1.5)}}>
                {t}
              </div>
            );
          })}
        </>
      );
  }
};

/* ---------------- 03 Stripe / Linear / 地图选点 ---------------- */
export const StripeFace: React.FC<P> = ({f, i}) => {
  const at = SCENE.STRIPE.in + i * 4;
  switch (i) {
    case 0:
      return (
        <>
          <div style={{position: 'absolute', left: 0, top: 0, right: 0, height: 4, background: C.stripe}} />
          <div style={{position: 'absolute', left: 24, top: 22, display: 'flex', alignItems: 'center', gap: 10}}>
            <span style={{...ui(12, 600), color: '#16A34A', background: '#DCFCE7', padding: '4px 8px', borderRadius: 999}}>Succeeded</span>
            <span style={{...mono(12), color: C.ink3}}>py_3Q8s2K</span>
          </div>
          <div style={{position: 'absolute', left: 24, top: 62, ...disp(48, 600, -0.045), color: C.ink}}>${count(f, 360, 40, 2480)}</div>
          <div style={{position: 'absolute', left: 24, top: 124, ...ui(14, 500), color: C.ink2}}>Visa ••4242 · Acme Labs · 2 min ago</div>
          <div style={{position: 'absolute', left: 24, right: 24, top: 168, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10}}>
            {[['Customer', 'Acme Labs'], ['Fee', '$72.00'], ['Net', '$2,408.00'], ['Country', 'US']].map(([a, b]) => (
              <div key={a} style={{padding: '12px 14px', borderRadius: 10, background: C.chip}}>
                <div style={{...ui(11, 500), color: C.ink3}}>{a}</div>
                <div style={{...ui(15, 600), color: C.ink, marginTop: 6}}>{b}</div>
              </div>
            ))}
          </div>
        </>
      );
    case 1:
      return (
        <>
          <div style={{position: 'absolute', left: 24, top: 20, ...ui(12, 600), color: C.ink3, letterSpacing: '0.08em'}}>LINEAR · ISSUE</div>
          <div style={{position: 'absolute', left: 24, top: 48, display: 'flex', alignItems: 'center', gap: 8}}>
            <span style={{...mono(13), color: C.accent}}>DES-184</span>
            <span style={{...ui(11, 600), color: '#B45309', background: '#FEF3C7', padding: '3px 7px', borderRadius: 6}}>In Progress</span>
          </div>
          <div style={{position: 'absolute', left: 24, top: 86, right: 24, ...sc(22, 700), color: C.ink, lineHeight: 1.3}}>Card Stack 成片重做：A-roll + B-roll</div>
          <div style={{position: 'absolute', left: 24, top: 160, display: 'flex', gap: 8}}>
            {['layout', 'motion', 'film'].map((t, k) => {
              const s = spr(f, BEATS.issue + 8 + k * 4, POP, 22);
              return (
                <span key={t} style={{...ui(12, 500), color: C.ink2, padding: '5px 9px', borderRadius: 8, background: C.chip, transform: `scale(${0.6 + 0.4 * s})`, opacity: Math.min(1, s * 1.5)}}>
                  {t}
                </span>
              );
            })}
          </div>
          <div style={{position: 'absolute', left: 24, bottom: 28, ...ui(13, 500), color: C.ink3}}>Assignee 观默 · Cycle 42 · 8 comments</div>
        </>
      );
    case 2:
      return (
        <>
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#E8F4EA,#C5D9C8)'}} />
          <svg width="100%" height="100%" viewBox="0 0 700 620" preserveAspectRatio="none" style={{position: 'absolute', inset: 0, opacity: 0.55}}>
            <path d="M40 420 C120 300 220 340 300 250 C380 160 460 220 660 120" fill="none" stroke="#64748B" strokeWidth="3" />
            <path d="M80 500 C200 440 280 480 400 380 C520 280 600 340 680 260" fill="none" stroke="#94A3B8" strokeWidth="2" />
          </svg>
          {(() => {
            const drop = spr(f, BEATS.map - 4, POP, 28);
            const pick = spr(f, BEATS.map + 12, POP, 22);
            return (
              <div style={{position: 'absolute', left: 48, top: 210 - (1 - drop) * 80, width: 22, height: 22, borderRadius: 11, background: C.accent, boxShadow: `0 0 0 ${6 + 10 * pick}px rgba(37,99,235,.28)`, transform: `scale(${0.2 + 0.8 * drop})`}} />
            );
          })()}
          <div style={{position: 'absolute', left: 24, bottom: 24, right: 24, padding: 16, borderRadius: 14, background: '#fff', boxShadow: '0 10px 24px rgba(15,23,42,.12)', opacity: Math.min(1, spr(f, BEATS.map, POP, 24) * 1.4), transform: `translateY(${(1 - spr(f, BEATS.map, POP, 26)) * 24}px)`}}>
            <div style={{...sc(16, 700), color: C.ink}}>选这个点</div>
            <div style={{...ui(13, 500), color: C.ink2, marginTop: 6}}>Folsom St · San Francisco · 0.3 km</div>
          </div>
        </>
      );
    default:
      return (
        <>
          <div style={{position: 'absolute', left: 24, top: 22, ...ui(12, 600), color: C.ink3}}>INVOICE · INV-1842</div>
          <div style={{position: 'absolute', left: 24, top: 52, ...sc(24, 700), color: C.ink}}>Q3 Design retainer</div>
          {[
            ['Storyboards', '$1,200'],
            ['Motion pass', '$880'],
            ['Master render', '$400'],
          ].map(([a, b], k) => {
            const s = spr(f, at + 8 + k * 6, POP, 24);
            return (
              <div key={a} style={{position: 'absolute', left: 24, right: 24, top: 110 + k * 42, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: 10, opacity: Math.min(1, s * 1.5), transform: `translateY(${(1 - s) * 16}px)`}}>
                <span style={{...ui(14, 500), color: C.ink2}}>{a}</span>
                <span style={{...mono(14), color: C.ink}}>{b}</span>
              </div>
            );
          })}
          <div style={{position: 'absolute', left: 24, bottom: 28, ...sc(18, 700), color: C.ink}}>Due Oct 31</div>
          <div style={{position: 'absolute', right: 24, bottom: 28, ...disp(28, 600, -0.03), color: C.ink}}>$2,480</div>
        </>
      );
  }
};

/* ---------------- 04 拆解：z-index 然后变成可带走的规则 ---------------- */
const ZINFO: [string, string, string][] = [
  ['z-index 40', 'FOCUS', 'lift 14 · rot −1.2°'],
  ['z-index 30', 'NEXT', 'offset 24 / 38'],
  ['z-index 20', 'WAIT', 'scale 0.964'],
  ['z-index 10', 'BACK', 'dim 33%'],
];
const TAKE: [string, string, string][] = [
  ['01 焦点', '一张在被读', '同一交互面 · 只处理顶卡'],
  ['02 露出', '24 × 38', '后层只暗示，不抢读'],
  ['03 退让', 'scale −1.8%', '每层压暗 11%'],
  ['04 张数', '3–4 张', '第五张是噪声'],
];
export const ExplodeFace: React.FC<P> = ({f, i}) => {
  const [z, role, rule] = ZINFO[i];
  const [k, t, d] = TAKE[i];
  const flip = spr(f, RULES_AT[i] ?? RULES_AT[0], POP, 22);
  return (
    <>
      <div style={{position: 'absolute', inset: 0, opacity: 1 - flip}}>
        <div style={{position: 'absolute', left: 28, top: 22, ...mono(13), color: C.accent}}>{z}</div>
        <div style={{position: 'absolute', left: 28, top: 52, ...disp(48, 600, -0.04), color: C.ink}}>{role}</div>
        <div style={{position: 'absolute', left: 28, top: 118, ...ui(16, 500), color: C.ink2}}>{rule}</div>
        <div style={{position: 'absolute', right: 28, bottom: 24, ...mono(12), color: C.ink3}}>{`slot ${i}`}</div>
      </div>
      <div style={{position: 'absolute', inset: 0, opacity: flip, transform: `translateY(${(1 - flip) * 16}px)`}}>
        <div style={{position: 'absolute', left: 28, top: 22, ...mono(13), color: C.accent}}>{k}</div>
        <div style={{position: 'absolute', left: 28, top: 52, ...disp(40, 600, -0.03), color: C.ink}}>{t}</div>
        <div style={{position: 'absolute', left: 28, top: 118, ...ui(16, 500), color: C.ink2}}>{d}</div>
      </div>
    </>
  );
};

export const PitFace: React.FC<{i: number; kind: 'crowd' | 'flat' | 'fix'}> = ({i, kind}) => {
  if (kind === 'crowd') {
    return (
      <div style={{position: 'absolute', inset: 0, padding: 24}}>
        <div style={{height: 12, width: 140, borderRadius: 6, background: '#E2E8F0'}} />
        <div style={{height: 18, width: 220 - i * 20, borderRadius: 8, background: '#EEF2F6', marginTop: 14}} />
        <div style={{position: 'absolute', left: 24, right: 24, bottom: 24, height: 64, borderRadius: 14, background: '#F1F5F9'}} />
      </div>
    );
  }
  if (kind === 'flat') {
    return (
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', ...sc(22, 600), color: C.ink3}}>
        {['第一张', '第二张', '第三张', '第四张'][i]}
      </div>
    );
  }
  return <KeyFace f={999} i={i} />;
};

export const GhostFace: React.FC<{g: number}> = ({g}) => (
  <div style={{position: 'absolute', inset: 0, background: '#F8FAFC'}}>
    <div style={{position: 'absolute', left: 28, top: 28, width: 160, height: 12, borderRadius: 6, background: '#E2E8F0'}} />
    <div style={{position: 'absolute', left: 28, top: 56, width: 280 - g * 28, height: 18, borderRadius: 8, background: '#EEF2F6'}} />
    <div style={{position: 'absolute', left: 28, right: 28, bottom: 28, height: 70, borderRadius: 14, background: '#F1F5F9'}} />
  </div>
);

export const EndFace: React.FC<{i: number}> = ({i}) => {
  const fills = [C.accent, '#93C5FD', '#CBD5E1', '#E2E8F0'];
  return <div style={{position: 'absolute', inset: 0, background: fills[i]}} />;
};
