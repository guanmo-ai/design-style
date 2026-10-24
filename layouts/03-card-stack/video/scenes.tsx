/** 布局 03 · Card Stack —— 卡片之外：各章标题、规则、测量、误区、片尾、章节栏 */
import React from 'react';
import {E, POP, spr, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {CARD_H, CARD_W, HIT, RULES_AT, SCENE, focusIndex, originAt} from './layout';
import {Kicker, Rise, Show, mono, sc, ui} from './ui';

type P = {f: number};
const L = 88;

export const KeyCaption: React.FC<P> = ({f}) => {
  const {in: a, out: o} = SCENE.KEY;
  return (
    <>
      <Show f={f} at={a} out={o} style={{left: L, top: 214}}>
        <Kicker>Design Style · 布局 03</Kicker>
      </Show>
      <div style={{position: 'absolute', left: L - 4, top: 268}}>
        <Rise f={f} at={a + 2} out={o} text="Card Stack" d={2} style={{...sc(92, 900, -0.04), color: C.ink, fontFamily: "'Inter Display', 'Noto Sans SC', sans-serif"}} />
      </div>
      <Show f={f} at={a + 10} out={o} dy={20} style={{left: L, top: 394}}>
        <div style={{...sc(52, 700, 0.04), color: C.ink}}>卡片层叠</div>
      </Show>
      <Show f={f} at={a + 16} out={o} style={{left: L, top: 478, width: 520}}>
        <div style={{...sc(26, 500, 0.02), lineHeight: 1.65, color: C.ink2}}>
          <span style={{color: C.ink}}>3–4 张圆角卡片叠在一起，</span>
          <br />
          同一时刻只有最上面那张在被读。
        </div>
      </Show>
      <Show f={f} at={a + 22} out={o} style={{left: L, top: 612, display: 'flex', gap: 10}}>
        {['任务队列', '底部弹层', '正在看的一张'].map((t) => (
          <span key={t} style={{...sc(18, 500, 0.04), color: C.ink, padding: '10px 14px', borderRadius: 999, background: C.card, boxShadow: 'inset 0 0 0 1px rgba(15,23,42,.08)'}}>
            {t}
          </span>
        ))}
      </Show>
    </>
  );
};

export const FocusCaption: React.FC<P> = ({f}) => {
  const {in: a, out: o} = SCENE.FOCUS;
  const rows: [string, string][] = [
    ['抬起 14px', '焦点离开平面，像被拿起来'],
    ['微旋 −1.2°', '告诉眼睛：这是一层，不是一张'],
    ['后层压暗', '每往后一层，大约暗 8%'],
  ];
  return (
    <>
      <Show f={f} at={a} out={o} style={{left: L, top: 214}}>
        <Kicker>焦点原则</Kicker>
      </Show>
      <Show f={f} at={a + 2} out={o} dy={22} style={{left: L, top: 270}}>
        <div style={{...sc(64, 900, 0.02), color: C.ink}}>一次只看一张</div>
      </Show>
      <Show f={f} at={a + 8} out={o} style={{left: L, top: 368, width: 540}}>
        <div style={{...sc(24, 500, 0.02), lineHeight: 1.7, color: C.ink2}}>
          <span style={{color: C.ink}}>层叠不是装饰，是注意力。</span>
          <br />
          后面的卡片在，只为说明“还有下一张”。
        </div>
      </Show>
      {rows.map(([t, d], k) => (
        <Show key={t} f={f} at={a + 16 + k * 10} out={o} dy={14} style={{left: L, top: 520 + k * 86, display: 'flex', alignItems: 'baseline', gap: 18}}>
          <span style={{...mono(16), color: C.accent, width: 28}}>{`0${k + 1}`}</span>
          <div>
            <div style={{...sc(26, 700, 0.02), color: C.ink}}>{t}</div>
            <div style={{...sc(18, 400, 0.02), color: C.ink2, marginTop: 10}}>{d}</div>
          </div>
        </Show>
      ))}
    </>
  );
};

export const CycleCaption: React.FC<P> = ({f}) => {
  const {in: a, out: o} = SCENE.CYCLE;
  const n = focusIndex(f);
  const names = ['Focusus', 'Inbox', 'Sprint', 'Revenue'];
  return (
    <>
      <Show f={f} at={a} out={o} style={{left: L, top: 214}}>
        <Kicker>像真产品那样换页</Kicker>
      </Show>
      <Show f={f} at={a + 2} out={o} dy={22} style={{left: L, top: 270}}>
        <div style={{...sc(60, 900, 0.02), color: C.ink}}>滑走，下一张顶上</div>
      </Show>
      <Show f={f} at={a + 8} out={o} style={{left: L, top: 368, width: 540}}>
        <div style={{...sc(24, 500, 0.02), lineHeight: 1.7, color: C.ink2}}>
          <span style={{color: C.ink}}>前一张沿一条弧线离开，</span>
          <br />
          后面的用弹簧递补——不要溶解，不要硬切。
        </div>
      </Show>
      <Show f={f} at={a + 16} out={o} style={{left: L, top: 520}}>
        <div style={{...ui(15, 500), color: C.ink3, letterSpacing: '0.08em', textTransform: 'uppercase'}}>Now in focus</div>
        <div style={{...sc(44, 800, 0.01), color: C.ink, marginTop: 14}}>{names[n]}</div>
        <div style={{...sc(20, 400, 0.02), color: C.ink2, marginTop: 12}}>iOS sheet · Stripe drawer · Linear queue</div>
      </Show>
    </>
  );
};

const USES: [string, string, (f: number) => boolean][] = [
  ['iOS sheet', '从底下抬起的那一层', (f) => f < HIT.STRIPE],
  ['Stripe dashboard', '详情叠在列表前面', (f) => f >= HIT.STRIPE],
  ['任务队列', '一次处理一张，其余待命', () => false],
];

export const WhenCaption: React.FC<P> = ({f}) => {
  const {in: a, out: o} = SCENE.WHEN;
  return (
    <>
      <Show f={f} at={a} out={o} style={{left: L, top: 214}}>
        <Kicker>什么时候用</Kicker>
      </Show>
      <Show f={f} at={a + 2} out={o} dy={22} style={{left: L, top: 270}}>
        <div style={{...sc(56, 900, 0.02), color: C.ink}}>要排队，不要平铺</div>
      </Show>
      <Show f={f} at={a + 8} out={o} style={{left: L, top: 360, width: 540}}>
        {USES.map(([t, d, litOf]) => {
          const lit = litOf(f);
          return (
            <div key={t} style={{display: 'flex', alignItems: 'center', height: 78, borderBottom: '1px solid rgba(15,23,42,.08)', opacity: lit ? 1 : 0.42}}>
              <span style={{width: 16, height: 16, borderRadius: 8, background: lit ? C.accent : 'transparent', boxShadow: lit ? undefined : `inset 0 0 0 1.5px ${C.ink}`, marginRight: 18}} />
              <div>
                <div style={{...ui(22, 650), color: C.ink}}>{t}</div>
                <div style={{...sc(16, 400, 0.02), color: C.ink2, marginTop: 8}}>{d}</div>
              </div>
            </div>
          );
        })}
      </Show>
      <Show f={f} at={a + 14} out={o} style={{left: L, top: 640, width: 520}}>
        <div style={{...sc(20, 400, 0.02), lineHeight: 1.65, color: C.ink2}}>
          不适合：要比对的表格、超过 5 个同等重要的模块、
          <br />
          需要一眼看完全部的仪表盘。
        </div>
      </Show>
    </>
  );
};

const RULES: [string, string][] = [
  ['只叠 3–4 张', '第五张开始，后面就只是噪声'],
  ['一张焦点', '同时被读的，永远只有最上面'],
  ['轻轻抬起', '8–16px，不要飞出屏幕'],
  ['微旋 1–2°', '让层叠能被眼睛感觉到'],
  ['后层压暗', '每层 8–12%，可加 0.5px 景深'],
];

export const RulesPanel: React.FC<P> = ({f}) => (
  <>
    <Show f={f} at={SCENE.RULES.in} out={SCENE.RULES.out} style={{left: L, top: 120}}>
      <Kicker>五条规则</Kicker>
    </Show>
    <Show f={f} at={SCENE.RULES.in + 2} out={SCENE.RULES.out} dy={20} style={{left: L, top: 174}}>
      <div style={{...sc(52, 900, 0.02), color: C.ink}}>叠得像产品</div>
    </Show>
    {RULES.map(([t, d], k) => (
      <Show key={t} f={f} at={RULES_AT[k]} out={SCENE.RULES.out} dy={16} style={{left: L, top: 268 + k * 96, display: 'grid', gridTemplateColumns: '56px 1fr', width: 560}}>
        <div style={{...mono(20), lineHeight: '36px', color: C.accent}}>{`0${k + 1}`}</div>
        <div>
          <div style={{...sc(28, 700, 0.02), color: C.ink, lineHeight: '36px'}}>{t}</div>
          <div style={{...sc(18, 400, 0.02), color: C.ink2, marginTop: 8}}>{d}</div>
        </div>
      </Show>
    ))}
  </>
);

export const Annotations: React.FC<P> = ({f}) => {
  if (f < RULES_AT[0] - 4 || f > SCENE.RULES.out) return null;
  const {x, y} = originAt(f);
  const out = 1 - tween(f, SCENE.RULES.out, 10);
  const o = (at: number) => tween(f, at, 12) * out;
  const pill = (at: number, px: number, py: number, label: string) => {
    const s = spr(f, at, POP, 26);
    const op = Math.min(1, s * 2) * o(at);
    if (op <= 0.001) return null;
    return (
      <div style={{position: 'absolute', left: px, top: py, transform: `translate(-50%,-50%) scale(${0.65 + 0.35 * s})`, opacity: op, background: C.accent, color: '#fff', ...mono(15), padding: '7px 10px', borderRadius: 8, whiteSpace: 'nowrap', zIndex: 40}}>
        {label}
      </div>
    );
  };
  return (
    <>
      {pill(RULES_AT[0], x + CARD_W / 2 - 20, y - CARD_H / 2 - 28, '4 sheets')}
      {pill(RULES_AT[1], x - 8, y - 18, 'focus')}
      {pill(RULES_AT[2], x - CARD_W / 2 + 70, y - CARD_H / 2 - 8, 'lift 14')}
      {pill(RULES_AT[3], x + CARD_W / 2 - 40, y - CARD_H / 2 + 36, '−1.2°')}
      {pill(RULES_AT[4], x + 40, y + CARD_H / 2 + 8, 'dim 8% / layer')}
    </>
  );
};

export const PitCaption: React.FC<P> = ({f}) => {
  const {in: a, out: o} = SCENE.PIT;
  const crowd = f < HIT.PIT_FLAT;
  return (
    <>
      <Show f={f} at={a} out={o} style={{left: L, top: 120}}>
        <Kicker>常见坑</Kicker>
      </Show>
      <Show f={f} at={a + 2} out={o} dy={20} style={{left: L, top: 174}}>
        <div style={{...sc(52, 900, 0.02), color: C.ink}}>{crowd ? '叠太多' : '没有焦点'}</div>
      </Show>
      <Show f={f} at={a + 8} out={o} style={{left: L, top: 258, width: 560}}>
        <div style={{...sc(24, 500, 0.02), lineHeight: 1.7, color: C.ink2}}>
          {crowd ? (
            <>
              <span style={{color: C.ink}}>超过 4 张，后面只是噪声。</span>
              <br />
              人眼数不清第五张以后的层。
            </>
          ) : (
            <>
              <span style={{color: C.ink}}>不抬、不旋、不压暗，</span>
              <br />
              就只是一沓打印纸，不是界面。
            </>
          )}
        </div>
      </Show>
    </>
  );
};

export const EndTitle: React.FC<P> = ({f}) => {
  const at = SCENE.END.in;
  const center: React.CSSProperties = {left: 0, right: 0, display: 'flex', justifyContent: 'center'};
  return (
    <>
      <div style={{position: 'absolute', ...center, top: 560}}>
        <Rise f={f} at={at} out={9999} text="Card Stack" d={2} style={{...sc(72, 800, -0.04), color: C.ink, fontFamily: "'Inter Display', 'Noto Sans SC', sans-serif"}} />
      </div>
      <Show f={f} at={at + 10} out={9999} dy={18} style={{...center, top: 658}}>
        <div style={{...sc(36, 700, 0.08), color: C.ink}}>卡片层叠</div>
      </Show>
      <Show f={f} at={at + 18} out={9999} style={{...center, top: 720}}>
        <div style={{...sc(24, 500, 0.06), color: C.ink2}}>一次只看一张 · 3–4 张 · 轻抬 · 微旋 · 后层压暗</div>
      </Show>
      <Show f={f} at={at + 26} out={9999} style={{...center, top: 980, alignItems: 'baseline'}}>
        <span style={{...ui(20, 500), color: 'rgba(15,23,42,.45)'}}>Design Style</span>
        <span style={{...sc(20, 500, 0.04), color: 'rgba(15,23,42,.7)', marginLeft: 12}}>布局</span>
        <span style={{...ui(20, 600), color: 'rgba(15,23,42,.7)', marginLeft: 6}}>03</span>
        <span style={{...ui(20, 500), color: 'rgba(15,23,42,.45)', marginLeft: 28}}>@guanmo_ai</span>
        <span style={{...mono(16, 400), color: 'rgba(15,23,42,.4)', marginLeft: 28}}>github.com/guanmo-ai/design-style</span>
      </Show>
    </>
  );
};

const CHAPTERS: [string, string, number][] = [
  ['KEY', '什么是卡片层叠', HIT.LAND],
  ['FOCUS', '一次只看一张', HIT.FOCUS],
  ['CYCLE', '像产品那样换页', HIT.CYCLE1],
  ['WHEN', '什么时候用', HIT.IOS],
  ['RULES', '五条规则', HIT.RULES],
  ['PIT', '常见坑', HIT.PIT_CROWD],
];

export const Hud: React.FC<P> = ({f}) => {
  const o = tween(f, 50, 16) * (1 - tween(f, HIT.END, 12));
  if (o <= 0.001) return null;
  let k = 0;
  CHAPTERS.forEach(([, , at], j) => {
    if (f >= at - 6) k = j;
  });
  const p = tween(f, CHAPTERS[k][2], 14, 0, 1, E.out);
  return (
    <div style={{position: 'absolute', left: 88, right: 88, top: 1024, height: 28, opacity: o, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <div style={{display: 'flex', alignItems: 'baseline'}}>
        <span style={{...ui(22, 600), color: C.ink}}>Card Stack</span>
        <span style={{...sc(16, 500, 0.06), color: C.ink2, marginLeft: 12}}>卡片层叠</span>
      </div>
      <div style={{display: 'flex', alignItems: 'baseline', opacity: 0.3 + 0.7 * p, transform: `translateY(${(1 - p) * 12}px)`}}>
        <span style={{...mono(16, 500), color: C.accent, marginRight: 12}}>{`0${k + 1} / 06`}</span>
        <span style={{...sc(17, 500, 0.03), color: C.ink}}>{CHAPTERS[k][1]}</span>
      </div>
    </div>
  );
};
