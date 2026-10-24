/** 布局 03 · Card Stack —— 章节字幕、规则、测量、误区、片尾、HUD */
import React from 'react';
import {E, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {HIT, LAYOUTS, PIT, RULES_AT, SCENE, TRANS} from './layout';
import {Kicker, Pill, Rise, Show, disp, gradText, mono, sc, ui} from './ui';

type P = {f: number};
const L = 88;

export const KeyCaption: React.FC<P> = ({f}) => {
  const {in: a, out: o} = SCENE.KEY;
  return (
    <>
      <Show f={f} at={a} out={o} style={{left: L, top: 168}}>
        <Kicker>Design Style · 布局 03</Kicker>
      </Show>
      <div style={{position: 'absolute', left: L - 4, top: 214}}>
        <Rise f={f} at={a + 2} out={o} text="Card Stack" d={2} style={{...disp(88, 600, -0.045), color: C.ink}} />
      </div>
      <Show f={f} at={a + 10} out={o} dy={18} style={{left: L, top: 330}}>
        <div style={{...sc(44, 700, 0.04), color: C.ink}}>卡片层叠</div>
      </Show>
      <Show f={f} at={a + 16} out={o} style={{left: L, top: 404, width: 520}}>
        <div style={{...sc(24, 500, 0.02), lineHeight: 1.65, color: C.ink2}}>
          <span style={{color: C.ink}}>3–4 张圆角卡片叠在一起，</span>
          <br />
          同一时刻只有最上面那张在被读。
        </div>
      </Show>
      <Show f={f} at={a + 22} out={o} style={{left: L, top: 540, display: 'flex', gap: 8, flexWrap: 'wrap', width: 520}}>
        {['任务队列', '底部弹层', '焦点 = 顶卡'].map((t) => (
          <span key={t} style={{...sc(16, 500, 0.04), color: C.ink, padding: '9px 12px', borderRadius: 999, background: C.card, boxShadow: 'inset 0 0 0 1px rgba(15,23,42,.08)'}}>
            {t}
          </span>
        ))}
      </Show>
    </>
  );
};

export const ExplodeCaption: React.FC<P> = ({f}) => {
  const {in: a, out: o} = SCENE.EXPLODE;
  const rows: [string, string][] = [
    ['offset', '后层向左上露出 24 × 38'],
    ['scale', '每层缩小约 1.8%'],
    ['opacity / dim', '每层压暗 8–12%'],
    ['blur', '可选 0.4–0.6px，不是雾'],
  ];
  return (
    <>
      <Show f={f} at={a} out={o} style={{left: L, top: 120}}>
        <Kicker color={C.t2} dot={C.pink}>结构拆解</Kicker>
      </Show>
      <Show f={f} at={a + 2} out={o} dy={20} style={{left: L, top: 166}}>
        <div style={{...sc(48, 800, 0.02), color: C.t1}}>侧视深度轴</div>
      </Show>
      {rows.map(([t, d], k) => (
        <Show key={t} f={f} at={a + 10 + k * 8} out={o} dy={12} style={{left: L, top: 250 + k * 72, width: 420}}>
          <div style={{...mono(13), color: C.pink}}>{t}</div>
          <div style={{...sc(22, 500, 0.02), color: C.t1, marginTop: 8}}>{d}</div>
        </Show>
      ))}
    </>
  );
};

const RULES: [string, string, string][] = [
  ['只叠 3–4 张', '3–4 sheets only', '第五张开始，后面只是噪声'],
  ['一张焦点', 'One in focus', '同时被读的，永远只有最上面'],
  ['轻轻抬起', 'Lift 8–16px', '焦点离开平面，不要飞出屏幕'],
  ['微旋 1–2°', 'Rotate 1–2°', '让层叠能被眼睛感觉到'],
  ['后层压暗', 'Dim 8–12%', '每层暗一档，可加 0.5px 景深'],
];

export const RulesPanel: React.FC<P> = ({f}) => (
  <>
    <Show f={f} at={SCENE.WIRE.in} out={SCENE.WIRE.out} style={{left: L, top: 100}}>
      <Kicker color={C.t2} dot={C.pink}>五条规则 · Five rules</Kicker>
    </Show>
    <Show f={f} at={SCENE.WIRE.in + 2} out={SCENE.WIRE.out} dy={18} style={{left: L, top: 148}}>
      <div style={{...sc(52, 800, 0.02), color: C.t1}}>叠得像产品</div>
    </Show>
    {RULES.map(([t, en, d], k) => (
      <Show key={t} f={f} at={RULES_AT[k]} out={SCENE.WIRE.out} dy={16} style={{left: L, top: 250 + k * 118, display: 'grid', gridTemplateColumns: '56px 1fr', width: 560}}>
        <div style={{...mono(20), lineHeight: '36px', ...gradText}}>{`0${k + 1}`}</div>
        <div>
          <div style={{...sc(28, 700, 0.02), color: C.t1, lineHeight: '36px'}}>{t}</div>
          <div style={{...disp(16, 500, 0), color: 'rgba(245,245,247,.45)', marginTop: 8}}>{en}</div>
          <div style={{...sc(16, 400, 0.02), color: C.t2, marginTop: 8}}>{d}</div>
        </div>
      </Show>
    ))}
  </>
);

export const Annotations: React.FC<P> = ({f}) => {
  if (f < RULES_AT[0] - 4 || f > SCENE.WIRE.out) return null;
  const s = LAYOUTS.WIRE;
  const out = SCENE.WIRE.out;
  return (
    <>
      <svg width={1920} height={1080} fill="none" stroke="#FF2D6F" style={{position: 'absolute', inset: 0, opacity: 1 - tween(f, out, 8)}}>
        <g opacity={tween(f, RULES_AT[2], 14)} strokeWidth={2}>
          <path d={`M${s[0].x} ${s[0].y + 20} H${s[0].x - 16} M${s[1].x} ${s[1].y + 20} H${s[1].x - 16}`} />
          <path d={`M${s[0].x - 16} ${s[0].y + 20} V${s[1].y + 20}`} />
        </g>
        <g opacity={tween(f, RULES_AT[3], 14)} strokeWidth={2}>
          <path d={`M${s[0].x + s[0].w + 8} ${s[0].y} V${s[0].y + 40}`} />
        </g>
      </svg>
      <Pill f={f} at={RULES_AT[0]} out={out} x={s[0].x + s[0].w - 20} y={s[0].y - 18}>
        4 sheets
      </Pill>
      <Pill f={f} at={RULES_AT[1]} out={out} x={s[0].x + 40} y={s[0].y + 20}>
        focus
      </Pill>
      <Pill f={f} at={RULES_AT[2]} out={out} x={s[0].x - 36} y={(s[0].y + s[1].y) / 2 + 20}>
        38
      </Pill>
      <Pill f={f} at={RULES_AT[3]} out={out} x={s[0].x + s[0].w + 36} y={s[0].y + 8}>
        −1.2°
      </Pill>
      <Pill f={f} at={RULES_AT[4]} out={out} x={s[3].x + 80} y={s[3].y + s[3].h + 16}>
        dim 11%
      </Pill>
    </>
  );
};

export const PitCaption: React.FC<P> = ({f}) => {
  const {in: a, out: o} = SCENE.PIT;
  const phase = f < PIT.flat ? 'crowd' : f < PIT.fix ? 'flat' : 'fix';
  const title = phase === 'crowd' ? '叠太多' : phase === 'flat' ? '没有焦点' : '这样就对了';
  const en = phase === 'crowd' ? 'Too many layers' : phase === 'flat' ? 'No focus' : '3–4 · lift · dim';
  const body =
    phase === 'crowd'
      ? '超过 4 张，后面只是噪声。人眼数不清第五张以后的层。'
      : phase === 'flat'
        ? '不抬、不旋、不压暗，就只是一沓打印纸，不是界面。'
        : '坏 → 好：收回来，顶卡重新成为唯一可读的一层。';
  return (
    <>
      <Show f={f} at={a} out={o} style={{left: L, top: 88}}>
        <Kicker color={C.ink2} dot={phase === 'fix' ? C.accent : C.pink}>
          常见坑 · Bad → Good
        </Kicker>
      </Show>
      <Show f={f} at={a + 2} out={o} dy={18} style={{left: L, top: 136}}>
        <div style={{...sc(52, 800, 0.02), color: C.ink}}>{title}</div>
      </Show>
      <Show f={f} at={a + 6} out={o} style={{left: L, top: 206}}>
        <div style={{...disp(20, 500, 0), color: C.ink2}}>{en}</div>
      </Show>
      <Show f={f} at={a + 10} out={o} style={{left: L, top: 250, width: 560}}>
        <div style={{...sc(22, 400, 0.02), lineHeight: 1.65, color: C.ink2}}>{body}</div>
      </Show>
    </>
  );
};

export const EndTitle: React.FC<P> = ({f}) => {
  const at = SCENE.END.in;
  const center: React.CSSProperties = {left: 0, right: 0, display: 'flex', justifyContent: 'center'};
  return (
    <>
      <div style={{position: 'absolute', ...center, top: 430}}>
        <Rise f={f} at={at} out={9999} text="Card Stack" d={2} style={{...disp(96, 600, -0.045), color: C.t1}} />
      </div>
      <Show f={f} at={at + 8} out={9999} dy={16} style={{...center, top: 550}}>
        <div style={{...sc(40, 700, 0.08), color: 'rgba(245,245,247,.92)'}}>卡片层叠</div>
      </Show>
      <Show f={f} at={at + 16} out={9999} style={{...center, top: 620}}>
        <div style={{...sc(22, 400, 0.04), color: C.t2}}>一次只看一张 · 3–4 张 · 轻抬 · 微旋 · 后层压暗</div>
      </Show>
      <Show f={f} at={at + 22} out={9999} style={{...center, top: 960, alignItems: 'baseline'}}>
        <span style={{...ui(20, 500), color: 'rgba(245,245,247,.45)'}}>Design Style</span>
        <span style={{...sc(20, 500, 0.04), color: 'rgba(245,245,247,.8)', marginLeft: 12}}>布局</span>
        <span style={{...ui(20, 600), color: 'rgba(245,245,247,.8)', marginLeft: 6}}>03</span>
        <span style={{...ui(20, 500), color: 'rgba(245,245,247,.45)', marginLeft: 28}}>@guanmo_ai</span>
        <span style={{...mono(16, 400), color: 'rgba(245,245,247,.4)', marginLeft: 28}}>github.com/guanmo-ai/design-style</span>
      </Show>
    </>
  );
};

const CHAPTERS: [string, string, boolean][] = [
  ['KEY', '钩子 · 层叠 = 焦点', false],
  ['IOS', 'A-roll · iOS Wallet / Sheet', false],
  ['STRIPE', 'B-roll · Stripe / Linear / 地图', false],
  ['DECK', '隐喻 · 扑克 / 名片 / 档案', false],
  ['EXPLODE', '拆解 · 深度轴与 z-index', false],
  ['WIRE', '五条规则', false],
  ['CROWD', '常见坑 · 坏 → 好', true],
];

export const Hud: React.FC<P> = ({f}) => {
  const o = tween(f, 56, 16) * (1 - tween(f, TRANS[TRANS.length - 1].at, 10));
  if (o <= 0.001) return null;
  const at = (name: string) => {
    const t = TRANS.find((x) => x.to === name);
    return (t?.at ?? 48) + HIT - 6;
  };
  let k = 0;
  CHAPTERS.forEach(([name], j) => {
    if (f >= at(name) || j === 0) k = j;
  });
  const p = tween(f, at(CHAPTERS[k][0]), 14, 0, 1, E.out);
  const light = CHAPTERS[k][2] || (f >= PIT.fix && f < PIT.end);
  const paper = f < Tish('IOS') || (f >= PIT.fix && f < PIT.end);
  const main = paper ? 'rgba(15,23,42,.78)' : light ? 'rgba(29,29,31,.78)' : 'rgba(245,245,247,.78)';
  const dim = paper ? 'rgba(15,23,42,.42)' : light ? 'rgba(29,29,31,.42)' : 'rgba(245,245,247,.4)';
  return (
    <div style={{position: 'absolute', left: 88, right: 88, top: 1022, height: 30, opacity: o, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <div style={{display: 'flex', alignItems: 'baseline'}}>
        <span style={{...disp(20, 600, -0.01), color: main}}>Card Stack</span>
        <span style={{...sc(16, 500, 0.06), color: dim, marginLeft: 12}}>卡片层叠</span>
      </div>
      <div style={{display: 'flex', alignItems: 'baseline', opacity: 0.25 + 0.75 * p, transform: `translateY(${(1 - p) * 14}px)`}}>
        <span style={{...mono(16, 500), ...gradText, marginRight: 12}}>{`0${Math.min(k + 1, 7)} / 07`}</span>
        <span style={{...sc(17, 500, 0.03), color: main}}>{CHAPTERS[k][1]}</span>
      </div>
    </div>
  );
};

const Tish = (name: string) => TRANS.find((t) => t.to === name)!.at;
