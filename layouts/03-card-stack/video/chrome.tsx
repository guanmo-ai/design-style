/** 布局 03 · Card Stack —— B-roll：手机、后台、深度轴、iOS 触点。字幕钉死在画布上。 */
import React from 'react';
import {E, POP, SNAP, SMOOTH, spr, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {BEATS, BROWSER, OVERLAP, PHONE, SCENE, T} from './layout';
import {RiseBox, Swap, disp, mono, sc, Show, ui} from './ui';

type P = {f: number};

export const PhoneBack: React.FC<P> = ({f}) => {
  const t0 = T('IOS') - 12;
  const p = spr(f, t0, SNAP, 32);
  const o = tween(f, t0, 12) * (1 - tween(f, T('STRIPE'), 14, 0, 1, E.inOut));
  if (o <= 0.001) return null;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o, transform: `translateY(${(1 - p) * 64}px) scale(${0.9 + 0.1 * p})`, transformOrigin: `${PHONE.x + PHONE.w / 2}px 540px`}}>
      <div style={{position: 'absolute', left: PHONE.x - 14, top: PHONE.y - 14, width: PHONE.w + 28, height: PHONE.h + 28, borderRadius: PHONE.r + 14, background: '#1A1A1C', boxShadow: 'inset 0 0 0 2px #3A3A3C, inset 0 0 0 5px #0C0C0D, 0 48px 120px rgba(0,0,0,.7)'}} />
      <div
        style={{
          position: 'absolute',
          left: PHONE.x,
          top: PHONE.y,
          width: PHONE.w,
          height: PHONE.h,
          borderRadius: PHONE.r,
          overflow: 'hidden',
          background: ['radial-gradient(70% 40% at 20% 18%, rgba(70,110,255,.9) 0%, rgba(70,110,255,0) 70%)', 'radial-gradient(60% 44% at 90% 60%, rgba(178,59,255,.85) 0%, rgba(178,59,255,0) 70%)', 'radial-gradient(80% 36% at 30% 100%, rgba(255,110,64,.8) 0%, rgba(255,110,64,0) 70%)', '#0B1030'].join(','),
        }}
      />
    </div>
  );
};

const phoneLabel = (f: number) => {
  if (f >= BEATS.wallet) return 'Wallet · 抽下一张';
  if (f >= BEATS.scan) return 'Wallet · 扫码';
  if (f >= BEATS.sheet) return 'Wallet · Sheet';
  if (f >= BEATS.note) return 'Wallet · 通知';
  return 'Wallet · 登机牌';
};

export const PhoneFront: React.FC<P> = ({f}) => {
  const o = tween(f, T('IOS') - 6, 12) * (1 - tween(f, T('STRIPE'), 14, 0, 1, E.inOut));
  if (o <= 0.001) return null;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: PHONE.x + 118, top: PHONE.y, width: 156, height: 28, background: '#000', borderRadius: '0 0 18px 18px'}} />
      <div style={{position: 'absolute', left: PHONE.x + 28, top: PHONE.y + 14, ...disp(16, 600, 0), color: '#fff'}}>9:41</div>
      <svg width={72} height={18} style={{position: 'absolute', left: PHONE.x + PHONE.w - 92, top: PHONE.y + 16}}>
        {[0, 1, 2, 3].map((k) => (
          <rect key={k} x={k * 5} y={10 - k * 2.4} width={3.2} height={4 + k * 2.4} rx={1} fill="#fff" />
        ))}
        <rect x={28} y={3} width={22} height={11} rx={3} fill="none" stroke="rgba(255,255,255,.5)" strokeWidth={1.2} />
        <rect x={30} y={5} width={15} height={7} rx={2} fill="#fff" />
      </svg>
      <div style={{position: 'absolute', left: PHONE.x + 28, top: PHONE.y + 56, ...sc(13, 500), color: 'rgba(255,255,255,.72)'}}>{phoneLabel(f)}</div>
      <div style={{position: 'absolute', left: PHONE.x + PHONE.w / 2 - 64, top: PHONE.y + PHONE.h - 22, width: 128, height: 5, borderRadius: 3, background: 'rgba(255,255,255,.45)'}} />
    </div>
  );
};

/** 点 Gate → 通知压下 → 上滑 Sheet → 按住条码 → 抽出下一张 */
export const IosTouch: React.FC<P> = ({f}) => {
  const ring = (at: number, x: number, y: number) => {
    const p = spr(f, at, POP, 22);
    const gone = tween(f, at + 16, 10, 0, 1, E.in);
    const o = Math.min(1, p) * (1 - gone);
    if (o <= 0.001) return null;
    const d = 18 + 22 * p;
    return <div style={{position: 'absolute', left: x - d / 2, top: y - d / 2, width: d, height: d, borderRadius: d, border: '2px solid rgba(255,255,255,.9)', background: 'rgba(255,255,255,.22)', opacity: o, transform: `scale(${0.55 + 0.45 * p})`}} />;
  };
  const swipe = (at: number, x: number, y0: number, y1: number) => {
    const p = spr(f, at, SMOOTH, 18);
    const o = tween(f, at, 6) * (1 - tween(f, at + 16, 8, 0, 1, E.in));
    if (o <= 0.001) return null;
    return <div style={{position: 'absolute', left: x - 14, top: y0 + (y1 - y0) * p - 14, width: 28, height: 28, borderRadius: 14, background: 'rgba(255,255,255,.85)', boxShadow: '0 0 0 6px rgba(255,255,255,.2)', opacity: o}} />;
  };
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 90}}>
      {ring(BEATS.gate, PHONE.x + 86, PHONE.y + 250)}
      {ring(BEATS.note + 2, PHONE.x + 196, PHONE.y + 80)}
      {swipe(BEATS.sheet - 8, PHONE.x + PHONE.w / 2, PHONE.y + 780, PHONE.y + 430)}
      {ring(BEATS.zoom, PHONE.x + 196, PHONE.y + 720)}
      {swipe(BEATS.wallet - 10, PHONE.x + 260, PHONE.y + 420, PHONE.y + 260)}
    </div>
  );
};

const ROWS: [string, string, string, string][] = [
  ['py_3Q8s2K', 'Acme Labs', '$2,480.00', 'Succeeded'],
  ['py_3Q7n1R', 'Northwind', '$180.00', 'Pending'],
  ['py_3Q6a9L', 'Globex', '$64.20', 'Refunded'],
  ['py_3Q5c2M', 'Initech', '$1,020.00', 'Succeeded'],
  ['py_3Q4b8P', 'Umbrella', '$310.50', 'Disputed'],
];

export const StripeDesk: React.FC<P> = ({f}) => {
  const t0 = T('STRIPE') - 16;
  const o = tween(f, t0, 14) * (1 - tween(f, T('EXPLODE'), 14, 0, 1, E.inOut));
  if (o <= 0.001) return null;
  const p = spr(f, t0, SNAP, 32);
  const hi = spr(f, T('STRIPE') + 8, POP, 22) * (1 - spr(f, BEATS.issue - 8, SMOOTH, 16));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o, transform: `translateY(${(1 - p) * 48}px)`}}>
      <div style={{position: 'absolute', left: BROWSER.x, top: BROWSER.y, width: BROWSER.w, height: BROWSER.h, borderRadius: BROWSER.r, background: '#0B1B33', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.08), 0 40px 80px rgba(0,0,0,.35)', overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 44, background: '#071324', display: 'flex', alignItems: 'center', padding: '0 18px', gap: 8}}>
          {['#F87171', '#FBBF24', '#34D399'].map((c) => (
            <div key={c} style={{width: 10, height: 10, borderRadius: 5, background: c}} />
          ))}
          <div style={{marginLeft: 16, height: 24, borderRadius: 8, background: 'rgba(255,255,255,.06)', padding: '0 14px', display: 'flex', alignItems: 'center', ...mono(12), color: 'rgba(255,255,255,.55)'}}>dashboard.stripe.com / payments</div>
        </div>
        <div style={{position: 'absolute', left: 0, top: 44, width: 220, bottom: 0, borderRight: '1px solid rgba(255,255,255,.06)', padding: '22px 18px'}}>
          {['Home', 'Balances', 'Payments', 'Customers', 'Billing'].map((t, k) => (
            <div key={t} style={{height: 36, display: 'flex', alignItems: 'center', ...ui(14, k === 2 ? 600 : 500), color: k === 2 ? '#fff' : 'rgba(255,255,255,.5)'}}>
              {t}
            </div>
          ))}
        </div>
        <div style={{position: 'absolute', left: 236, top: 64, ...disp(22, 600, -0.02), color: '#fff'}}>Payments</div>
        <div style={{position: 'absolute', left: 236, top: 108, right: 760}}>
          <div style={{display: 'grid', gridTemplateColumns: '1.2fr 1fr .8fr .7fr', gap: 8, ...mono(11), color: 'rgba(255,255,255,.35)', marginBottom: 8}}>
            <span>ID</span><span>Customer</span><span>Amount</span><span>Status</span>
          </div>
          {ROWS.map(([id, name, amt, st], k) => {
            const row = spr(f, t0 + 10 + k * 4, POP, 22);
            return (
              <div key={id} style={{display: 'grid', gridTemplateColumns: '1.2fr 1fr .8fr .7fr', gap: 8, height: 36, alignItems: 'center', ...ui(13, 500), color: k === 0 ? '#fff' : 'rgba(255,255,255,.55)', background: k === 0 ? `rgba(99,91,255,${0.1 + 0.22 * hi})` : 'transparent', borderRadius: 8, padding: '0 8px', opacity: Math.min(1, row * 1.4), transform: `translateX(${(1 - row) * 24}px)`}}>
                <span style={mono(12)}>{id}</span>
                <span>{name}</span>
                <span>{amt}</span>
                <span>{st}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const ExplodeAxis: React.FC<P> = ({f}) => {
  const o = tween(f, SCENE.TEACH.in - OVERLAP, 12) * (1 - tween(f, SCENE.TEACH.out, 10, 0, 1, E.inOut));
  if (o <= 0.001) return null;
  const draw = spr(f, SCENE.TEACH.in, SMOOTH, 32);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: o}}>
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L10 5 L0 10 Z" fill="#FF2D6F" />
        </marker>
      </defs>
      <path d={`M680 820 L${680 + 820 * draw} ${820 - 620 * draw}`} stroke="#FF2D6F" strokeWidth={2} fill="none" markerEnd="url(#arr)" strokeDasharray="8 6" />
      <text x={1480} y={180} fill="#FF2D6F" style={{...mono(14)}}>depth +z</text>
    </svg>
  );
};

export const DepthTicks: React.FC<P> = ({f}) => {
  const labels: [number, number, string][] = [
    [720, 120, 'z 40'],
    [900, 300, 'z 30'],
    [1080, 480, 'z 20'],
    [1260, 660, 'z 10'],
  ];
  return (
    <>
      {labels.map(([x, y, t], k) => {
        const s = spr(f, SCENE.TEACH.in + 72 + k * 6, POP, 28);
        const o = Math.min(1, s * 2) * (1 - tween(f, SCENE.TEACH.out, 8));
        if (o <= 0.001) return null;
        return (
          <div key={t} style={{position: 'absolute', left: x, top: y, opacity: o, transform: `scale(${0.7 + 0.3 * s})`, background: C.pink, color: '#fff', ...mono(13), padding: '6px 8px', borderRadius: 7}}>
            {t}
          </div>
        );
      })}
    </>
  );
};

const IOS_COPY: {at: number; kicker: string; title: string; body: string; en: string}[] = [
  {at: 90, kicker: '同一叠飞进手机', title: 'Wallet', body: '去看产品里怎么用。\n登机牌压在最上面。', en: 'Same four cards · boarding pass on top'},
  {at: 120, kicker: '点 Gate', title: 'Gate', body: '兴趣点在 B12。\n镜头跟过去。', en: 'Tap Gate B12 · camera follows'},
  {at: 150, kicker: '系统打断', title: 'Notify', body: '新的一层从顶上压下来。\n旧的退暗——还是同一叠。', en: 'New layer covers · old layer dims'},
  {at: 210, kicker: '用户要分享', title: 'Sheet', body: '上推，操作层盖住票面。\n三个按钮只发生在最上层。', en: 'Share sheet · actions stay on top'},
  {at: 270, kicker: '做完就回去', title: 'Scan', body: 'Sheet 退下，票面回来。\n镜头扎进条码，Checked in。', en: 'Sheet down · barcode punch'},
  {at: 330, kicker: '抽最上面一张', title: 'Card', body: '顶卡让位，Apple Card\n弹到最前面。', en: 'Pull the top card · next comes forward'},
];

export const IosCaption: React.FC<P> = ({f}) => {
  const {out} = SCENE.IOS;
  let k = 0;
  IOS_COPY.forEach((c, i) => {
    if (f >= c.at) k = i;
  });
  const cur = IOS_COPY[k];
  const prev = IOS_COPY[Math.max(0, k - 1)];
  return (
    <>
      <Show f={f} at={90} out={out} style={{left: 88, top: 168}}>
        <div style={{...disp(22, 500, 0), color: C.t2}}>{cur.kicker}</div>
      </Show>
      <div style={{position: 'absolute', left: 88, top: 210, width: 560}}>
        <Swap
          f={f}
          at={k === 0 ? 92 : cur.at}
          h={110}
          a={<div style={{...disp(92, 600, -0.045), color: C.t1}}>{k === 0 ? 'iOS' : prev.title}</div>}
          b={<div style={{...disp(92, 600, -0.045), color: C.t1}}>{cur.title}</div>}
        />
      </div>
      <RiseBox f={f} at={cur.at + 6} out={out} h={140} style={{left: 92, top: 340, width: 560}}>
        <div style={{...sc(28, 500, 0.02), lineHeight: 1.55, color: C.t2, whiteSpace: 'pre-line'}}>{cur.body}</div>
      </RiseBox>
      <Show f={f} at={cur.at + 12} out={out} style={{left: 92, top: 560}}>
        <div style={{...ui(16, 500), color: C.t2}}>{cur.en}</div>
      </Show>
    </>
  );
};

export const StripeCaption: React.FC<P> = ({f}) => {
  const {in: a, out: o} = SCENE.STRIPE;
  const copy = f >= BEATS.map ? '选点也是一层盖一层 · 同一叠拓扑' : f >= BEATS.issue ? '队列：最紧急的挤到顶 · 同一交互面' : 'Stripe 抽屉滑入 · 拓扑不变，语境变';
  return (
    <Show f={f} at={a} out={o} style={{left: 320, top: 900}}>
      <div style={{...sc(18, 500, 0.04), color: 'rgba(255,255,255,.55)'}}>{copy}</div>
    </Show>
  );
};
