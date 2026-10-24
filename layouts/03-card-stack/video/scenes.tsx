/** 布局 03 · Card Stack —— 章节字幕、拆解规则、测量、误区、片尾、HUD */
import React from 'react';
import {E, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {DURATION, HIT, LAYOUTS, PIT, RULES_AT, SCENE, TRANS} from './layout';
import {Kicker, Pill, Rise, Swap, Show, disp, gradText, mono, sc, ui} from './ui';

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
    </>
  );
};

const TEACH: {at: number; kicker: string; title: string; body: string}[] = [
  {at: 558, kicker: '问：这叠怎么构成的？', title: '拆开', body: '沿 z 轴拉开。看见深度，不是平铺。'},
  {at: 630, kicker: '带走这一句', title: '层叠', body: '深度排序 + 同一交互面。'},
  {at: 660, kicker: '01', title: '一张焦点', body: '同时被读的，永远只有最上面。'},
  {at: 690, kicker: '02', title: '后层暗示', body: '露出 24 × 38，不要把后层写满。'},
  {at: 720, kicker: '03', title: '后层要退', body: '缩小 1.8%，压暗 11%，不要抢。'},
  {at: 750, kicker: '04', title: '到四张停', body: '第五张开始，后面只是噪声。'},
  {at: 780, kicker: '换层', title: '抽 / 压 / 推', body: '不要瞬切。观众要能说出为什么动。'},
];

export const TeachCaption: React.FC<P> = ({f}) => {
  const {out} = SCENE.TEACH;
  let k = 0;
  TEACH.forEach((c, i) => {
    if (f >= c.at) k = i;
  });
  const cur = TEACH[k];
  const prev = TEACH[Math.max(0, k - 1)];
  return (
    <>
      <Show f={f} at={558} out={out} style={{left: L, top: 100}}>
        <Kicker color={C.t2} dot={C.pink}>{cur.kicker}</Kicker>
      </Show>
      <div style={{position: 'absolute', left: L, top: 150, width: 560}}>
        <Swap
          f={f}
          at={k === 0 ? 560 : cur.at}
          h={80}
          a={<div style={{...sc(52, 800, 0.02), color: C.t1}}>{k === 0 ? '拆开' : prev.title}</div>}
          b={<div style={{...sc(52, 800, 0.02), color: C.t1}}>{cur.title}</div>}
        />
      </div>
      <Show f={f} at={cur.at + 6} out={out} style={{left: L, top: 250, width: 480}}>
        <div style={{...sc(24, 400, 0.02), lineHeight: 1.6, color: C.t2}}>{cur.body}</div>
      </Show>
    </>
  );
};

export const Annotations: React.FC<P> = ({f}) => {
  if (f < RULES_AT[0] - 4 || f > SCENE.TEACH.out) return null;
  const s = LAYOUTS.RULE;
  const out = SCENE.TEACH.out;
  return (
    <>
      <svg width={1920} height={1080} fill="none" stroke="#FF2D6F" style={{position: 'absolute', inset: 0, opacity: 1 - tween(f, out, 8)}}>
        <g opacity={tween(f, RULES_AT[2], 14)} strokeWidth={2}>
          <path d={`M${s[0].x} ${s[0].y + 24} H${s[0].x - 20} M${s[1].x} ${s[1].y + 24} H${s[1].x - 20}`} />
          <path d={`M${s[0].x - 20} ${s[0].y + 24} V${s[1].y + 24}`} />
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
  const phase = f < PIT.flat ? 0 : f < PIT.fix ? 1 : 2;
  const titles = ['叠太多', '没有焦点', '这样就对了'];
  const ens = ['Too many layers', 'No focus', '3–4 · lift · dim'];
  const bodies = [
    '超过 4 张，后面只是噪声。人眼数不清第五张以后的层。',
    '不抬、不旋、不压暗，就只是一沓打印纸，不是界面。',
    '坏 → 好：收回来，顶卡重新成为唯一可读的一层。',
  ];
  const swapAt = phase === 0 ? a : phase === 1 ? PIT.flat : PIT.fix;
  return (
    <>
      <Show f={f} at={a} out={o} style={{left: L, top: 88}}>
        <Kicker color={C.ink2} dot={phase === 2 ? C.accent : C.pink}>
          常见坑 · Bad → Good
        </Kicker>
      </Show>
      <div style={{position: 'absolute', left: L, top: 136, width: 640}}>
        <Swap
          f={f}
          at={swapAt}
          h={72}
          a={<div style={{...sc(52, 800, 0.02), color: C.ink}}>{titles[Math.max(0, phase - 1)]}</div>}
          b={<div style={{...sc(52, 800, 0.02), color: C.ink}}>{titles[phase]}</div>}
        />
      </div>
      <Show f={f} at={a + 6} out={o} style={{left: L, top: 216}}>
        <div style={{...disp(20, 500, 0), color: C.ink2}}>{ens[phase]}</div>
      </Show>
      <Show f={f} at={a + 10} out={o} style={{left: L, top: 260, width: 560}}>
        <div style={{...sc(22, 400, 0.02), lineHeight: 1.65, color: C.ink2}}>{bodies[phase]}</div>
      </Show>
    </>
  );
};

export const EndTitle: React.FC<P> = ({f}) => {
  const at = SCENE.END.in;
  const center: React.CSSProperties = {left: 0, right: 0, display: 'flex', justifyContent: 'center'};
  const lines = [
    {at: at + 36, t: '层叠 = 深度排序 + 同一交互面'},
    {at: at + 72, t: '3–4 张，第五张是噪声'},
    {at: at + 108, t: '换层用抽 / 压 / 推，不要瞬切'},
  ];
  return (
    <>
      <div style={{position: 'absolute', ...center, top: 400}}>
        <Rise f={f} at={at + 18} out={9999} text="Card Stack" d={2} style={{...disp(88, 600, -0.045), color: C.t1}} />
      </div>
      <Show f={f} at={at + 28} out={9999} dy={16} style={{...center, top: 512}}>
        <div style={{...sc(36, 700, 0.08), color: 'rgba(245,245,247,.92)'}}>卡片层叠</div>
      </Show>
      {lines.map((line, i) => (
        <Show key={line.t} f={f} at={line.at} out={9999} dy={12} style={{...center, top: 572 + i * 36}}>
          <div style={{...sc(20, 500, 0.03), color: 'rgba(245,245,247,.7)'}}>{line.t}</div>
        </Show>
      ))}
      <Show f={f} at={at + 102} out={9999} style={{...center, top: 960, alignItems: 'baseline'}}>
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
  ['IOS', 'iOS · 通知 / Sheet / 抽卡', false],
  ['STRIPE', '后台 · Stripe / Linear / 地图', false],
  ['EXPLODE', '拆解 · 深度轴', false],
  ['CROWD', '坏 → 好', true],
  ['END', '定妆 · @guanmo_ai', false],
];

export const Hud: React.FC<P> = ({f}) => {
  const o = tween(f, 36, 14) * (1 - tween(f, 1236, 16));
  if (o <= 0.001) return null;
  const at = (name: string) => {
    const t = TRANS.find((x) => x.to === name);
    return (t?.at ?? 18) + HIT - 6;
  };
  const starts = CHAPTERS.map(([name]) => at(name));
  let k = 0;
  starts.forEach((s, j) => {
    if (f >= s) k = j;
  });
  const p = tween(f, starts[k], 14, 0, 1, E.out);
  const nxt = starts[k + 1] ?? DURATION;
  const light = CHAPTERS[k][2] || (f >= PIT.fix && f < PIT.end);
  const paper = f < at('IOS') || (f >= SCENE.PIT.in && f < SCENE.END.in);
  const main = paper ? 'rgba(15,23,42,.78)' : light ? 'rgba(29,29,31,.78)' : 'rgba(245,245,247,.78)';
  const dim = paper ? 'rgba(15,23,42,.42)' : light ? 'rgba(29,29,31,.42)' : 'rgba(245,245,247,.4)';
  return (
    <div style={{position: 'absolute', left: 88, right: 88, top: 1022, height: 30, opacity: o, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <div style={{display: 'flex', alignItems: 'baseline'}}>
        <span style={{...disp(20, 600, -0.01), color: main}}>Card Stack</span>
        <span style={{...sc(16, 500, 0.06), color: dim, marginLeft: 12}}>卡片层叠</span>
      </div>
      <div style={{display: 'flex', alignItems: 'baseline', opacity: 0.25 + 0.75 * p, transform: `translateY(${(1 - p) * 14}px)`}}>
        <span style={{...mono(16, 500), ...gradText, marginRight: 12}}>{`0${k + 1} / 06`}</span>
        <span style={{...sc(17, 500, 0.03), color: main}}>{CHAPTERS[k][1]}</span>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: -8, height: 2, background: paper ? 'rgba(15,23,42,.08)' : 'rgba(255,255,255,.1)', overflow: 'hidden'}}>
        <div style={{width: `${Math.min(100, Math.max(0, ((f - starts[k]) / Math.max(1, nxt - starts[k])) * 100))}%`, height: '100%', background: C.pink, opacity: 0.85}} />
      </div>
    </div>
  );
};
