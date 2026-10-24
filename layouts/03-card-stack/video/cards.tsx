/** 布局 03 · Card Stack —— 四个世界里，同一叠 4 张卡各自装真实内容 */
import React from 'react';
import {E, POP, spr, tween} from '../../../src/lib/anim';
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
    {BARS.map((v, i) => (
      <div key={i} style={{flex: 1, height: v * (0.18 + 0.82 * tween(f, at + i * 3, 18, 0, 1, E.out)), borderRadius: 5, background: i === 5 ? accent : '#D9DEE7'}} />
    ))}
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

/* ---------------- 01 定义：产品队列 A-roll ---------------- */
export const KeyFace: React.FC<P> = ({f, i}) => {
  const at = SCENE.KEY.in + i * 4;
  switch (i) {
    case 0:
      return (
        <>
          <div style={cap()}>Focusus · P0</div>
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
            {PEOPLE.map((p) => (
              <div key={p.name} style={{display: 'flex', alignItems: 'center', height: 36}}>
                <div style={{width: 26, height: 26, borderRadius: 13, background: p.color, marginRight: 10}} />
                <div>
                  <div style={{...sc(15, 600), color: C.ink}}>{p.name}</div>
                  <div style={{...ui(11, 500), color: C.ink3, marginTop: 3}}>{p.role}</div>
                </div>
                <span style={{...mono(12), color: C.ink3, marginLeft: 'auto'}}>{p.wait}</span>
              </div>
            ))}
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
            <div style={{width: '57%', height: '100%', background: C.accent, borderRadius: 5}} />
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

/* ---------------- 02 iOS Wallet / sheet / 通知 ---------------- */
const Grabber = () => <div style={{position: 'absolute', left: '50%', top: 10, width: 42, height: 5, marginLeft: -21, borderRadius: 3, background: '#D1D5DB'}} />;

export const IosFace: React.FC<P> = ({f, i}) => {
  const at = SCENE.IOS.in + i * 5;
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
              const s = spr(f, SCENE.IOS.in + 6 + k * 4, POP, 28);
              return (
                <div key={a} style={{transform: `scale(${0.86 + 0.14 * s})`, opacity: Math.min(1, s * 1.4)}}>
                  <div style={{...ui(11, 500), color: 'rgba(255,255,255,.55)'}}>{a}</div>
                  <div style={{...disp(22, 600, -0.02), color: '#fff', marginTop: 6}}>{b}</div>
                </div>
              );
            })}
          </div>
          <div style={{position: 'absolute', left: 22, right: 22, bottom: 28, height: 56, borderRadius: 8, background: 'repeating-linear-gradient(90deg,#fff 0 2px, transparent 2px 6px)', overflow: 'hidden'}}>
            <div style={{position: 'absolute', left: 0, right: 0, top: ((f * 2.4) % 56), height: 3, background: 'rgba(255,255,255,.95)', boxShadow: '0 0 12px rgba(255,255,255,.8)'}} />
          </div>
          <div style={{position: 'absolute', left: 22, bottom: 92, ...ui(12, 500), color: 'rgba(255,255,255,.7)'}}>Boarding Pass · Oct 24</div>
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
          <div style={{position: 'absolute', left: 20, top: 78, right: 20, ...sc(18, 500), color: C.ink, lineHeight: 1.45}}>林可：设计稿发你了，顶层那张先看。</div>
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
            const s = spr(f, BEATS.sheet + 6 + k2 * 5, POP, 28);
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
          <div style={{position: 'absolute', left: 24, top: 62, ...disp(48, 600, -0.045), color: C.ink}}>${count(f, at, 36, 2480)}</div>
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
            {['layout', 'motion', 'film'].map((t) => (
              <span key={t} style={{...ui(12, 500), color: C.ink2, padding: '5px 9px', borderRadius: 8, background: C.chip}}>{t}</span>
            ))}
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
          <div style={{position: 'absolute', left: 48, top: 210, width: 22, height: 22, borderRadius: 11, background: C.accent, boxShadow: `0 0 0 ${8 + 6 * (0.5 + 0.5 * Math.sin(f / 8))}px rgba(37,99,235,.28)`, transform: `scale(${1 + 0.12 * Math.sin(f / 9)})`}} />
          <div style={{position: 'absolute', left: 24, bottom: 24, right: 24, padding: 16, borderRadius: 14, background: '#fff', boxShadow: '0 10px 24px rgba(15,23,42,.12)'}}>
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
          ].map(([a, b], k) => (
            <div key={a} style={{position: 'absolute', left: 24, right: 24, top: 110 + k * 42, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: 10}}>
              <span style={{...ui(14, 500), color: C.ink2}}>{a}</span>
              <span style={{...mono(14), color: C.ink}}>{b}</span>
            </div>
          ))}
          <div style={{position: 'absolute', left: 24, bottom: 28, ...sc(18, 700), color: C.ink}}>Due Oct 31</div>
          <div style={{position: 'absolute', right: 24, bottom: 28, ...disp(28, 600, -0.03), color: C.ink}}>$2,480</div>
        </>
      );
  }
};

/* ---------------- 04 历史隐喻：名片 / 扑克 / 档案袋 / 索引卡 ---------------- */
const Suit: React.FC<{kind: 'S' | 'H' | 'C' | 'D'; size?: number}> = ({kind, size = 28}) => {
  const fill = kind === 'H' || kind === 'D' ? '#DC2626' : '#111827';
  const d =
    kind === 'S'
      ? 'M14 2 C8 10 2 14 2 20 C2 25 6 28 10 28 C12 28 13 27 14 25 C15 27 16 28 18 28 C22 28 26 25 26 20 C26 14 20 10 14 2 Z M11 28 Q14 34 14 38 Q14 34 17 28'
      : kind === 'H'
        ? 'M14 26 C4 16 2 12 2 8 C2 4 5 2 8 2 C11 2 13 4 14 7 C15 4 17 2 20 2 C23 2 26 4 26 8 C26 12 24 16 14 26 Z'
        : kind === 'D'
          ? 'M14 2 L26 14 L14 26 L2 14 Z'
          : 'M14 2 C10 8 8 12 8 16 C4 16 2 19 2 22 C2 25 5 27 8 26 C8 30 12 34 14 38 C16 34 20 30 20 26 C23 27 26 25 26 22 C26 19 24 16 20 16 C20 12 18 8 14 2 Z';
  return (
    <svg width={size} height={size} viewBox="0 0 28 40">
      <path d={d} fill={fill} />
    </svg>
  );
};

export const DeckFace: React.FC<P> = ({f, i}) => {
  switch (i) {
    case 0:
      return (
        <>
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#FAF6EE,#F3E6C8)'}} />
          <div style={{position: 'absolute', left: 20, top: 22, width: 44, height: 44, borderRadius: 22, background: 'linear-gradient(135deg,#FF8A3D,#A63DFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', ...sc(20, 700), color: '#fff'}}>观</div>
          <div style={{position: 'absolute', left: 20, top: 84, ...sc(28, 800), color: '#1C1917'}}>观默</div>
          <div style={{position: 'absolute', left: 20, top: 124, ...ui(13, 500), color: '#78716C'}}>@guanmo_ai</div>
          <div style={{position: 'absolute', left: 20, top: 168, right: 20, ...sc(15, 500), color: '#44403C', lineHeight: 1.5}}>设计 × AI。每天拆一个风格，做成短片和规范。</div>
          <div style={{position: 'absolute', left: 20, bottom: 28, ...mono(11), color: '#A8A29E'}}>BUSINESS CARD · 2013 隐喻</div>
        </>
      );
    case 1:
      return (
        <>
          <div style={{position: 'absolute', inset: 8, borderRadius: 12, boxShadow: 'inset 0 0 0 2px #111827', transform: `rotateY(${16 * Math.sin(f / 14)}deg)`}} />
          <div style={{position: 'absolute', left: 18, top: 16, ...disp(42, 700, -0.04), color: '#111827'}}>A</div>
          <div style={{position: 'absolute', left: 20, top: 62}}>
            <Suit kind="S" size={26} />
          </div>
          <div style={{position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)'}}>
            <Suit kind="S" size={72} />
          </div>
          <div style={{position: 'absolute', right: 18, bottom: 16, transform: 'rotate(180deg)', ...disp(42, 700, -0.04), color: '#111827'}}>A</div>
        </>
      );
    case 2:
      return (
        <>
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#E8C37A,#C5964A)'}} />
          <div style={{position: 'absolute', left: 0, top: 0, right: 0, height: 36, background: 'linear-gradient(180deg,#D6A24E,#C08A32)'}} />
          <div style={{position: 'absolute', left: 18, top: 8, ...ui(12, 700), color: '#44403C', letterSpacing: '0.12em'}}>PROJECTS</div>
          <div style={{position: 'absolute', left: 18, top: 64, ...sc(20, 700), color: '#292524'}}>档案袋</div>
          <div style={{position: 'absolute', left: 18, top: 100, right: 18, ...ui(13, 500), color: '#57534E', lineHeight: 1.5}}>Folder stack · 一次只抽出最上面那份。</div>
          {['L01 Bento', 'L02 Masonry', 'L03 Card Stack'].map((t, k) => (
            <div key={t} style={{position: 'absolute', left: 18, right: 18, top: 168 + k * 40, height: 32, borderRadius: 6, background: 'rgba(255,255,255,.35)', display: 'flex', alignItems: 'center', padding: '0 10px', ...ui(13, 500), color: '#44403C'}}>
              {t}
            </div>
          ))}
        </>
      );
    default:
      return (
        <>
          <div style={{position: 'absolute', inset: 0, background: '#FFFBEB'}} />
          <div style={{position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #FDE68A 28px)', opacity: 0.7}} />
          <div style={{position: 'absolute', left: 20, top: 24, ...sc(16, 600), color: '#92400E'}}>规则备忘</div>
          <div style={{position: 'absolute', left: 20, top: 64, right: 16, ...sc(18, 500), color: '#78350F', lineHeight: 1.7}}>
            3–4 张
            <br />
            只读顶卡
            <br />
            轻抬 8–16
          </div>
          <div style={{position: 'absolute', left: 20, bottom: 24, ...mono(11), color: '#B45309'}}>INDEX CARD</div>
        </>
      );
  }
};

/* ---------------- 05 爆炸：z-index + 结构数字 ---------------- */
const ZINFO: [string, string, string][] = [
  ['z-index 40', 'FOCUS', 'lift 14 · rot −1.2°'],
  ['z-index 30', 'NEXT', 'offset 24 / 38'],
  ['z-index 20', 'WAIT', 'scale 0.964'],
  ['z-index 10', 'BACK', 'dim 33%'],
];
export const ExplodeFace: React.FC<P> = ({i}) => {
  const [z, role, rule] = ZINFO[i];
  return (
    <>
      <div style={{position: 'absolute', left: 28, top: 22, ...mono(13), color: C.accent}}>{z}</div>
      <div style={{position: 'absolute', left: 28, top: 52, ...disp(48, 600, -0.04), color: C.ink}}>{role}</div>
      <div style={{position: 'absolute', left: 28, top: 118, ...ui(16, 500), color: C.ink2}}>{rule}</div>
      <div style={{position: 'absolute', right: 28, bottom: 24, ...mono(12), color: C.ink3}}>{`slot ${i}`}</div>
    </>
  );
};

/* ---------------- 06 线框：每张卡一个可测量参数 ---------------- */
const WIRE: [string, string, string][] = [
  ['01  FOCUS', '一张焦点', 'only the top sheet is read'],
  ['02  OFFSET', '24 × 38', 'peek up-left per layer'],
  ['03  SCALE', '0.982', '−1.8% per layer'],
  ['04  DIM', '11%', 'brightness per layer'],
];
export const WireFace: React.FC<P> = ({f, i}) => {
  const at = RULES_AT[i] ?? RULES_AT[0];
  const [k, t, d] = WIRE[i];
  const o = tween(f, at, 12);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(245,245,247,.92)'}}>
      <div style={{...mono(14), color: 'rgba(245,245,247,.5)', letterSpacing: '0.08em'}}>{k}</div>
      <div style={{...disp(i === 0 ? 52 : 40, 600, -0.03), marginTop: 14}}>{t}</div>
      <div style={{...ui(14, 500), color: 'rgba(245,245,247,.55)', marginTop: 12}}>{d}</div>
    </div>
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
