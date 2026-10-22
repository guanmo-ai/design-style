/** 布局 02 · Masonry —— 卡片之外的东西：各章标题、算法演示、图钉墙的鼠标、手机、规则标注、浏览器窗口、片尾、章节栏 */
import React from 'react';
import {E, POP, spr, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {ALG_BASE, ALG_LAND, FEED, FLOW, HIT, ITEMS, LAYOUTS, PHONE, RIGHT, RULES_AT, SCENE, SCREEN, TRANS, WIN_BAR, WIN_H, WIN_W, WIN_Y, tileState, transTo} from './layout';
import {Kicker, mono, Pill, Rise, sc, serif, Show, ui} from './ui';

type P = {f: number};
const L = 96; // 左边距

/* ───────────── 01 什么是瀑布流 ───────────── */
export const KeyCaption: React.FC<P> = ({f}) => {
  const {in: a, out: o} = SCENE.KEY;
  return (
    <>
      <Show f={f} at={a - 4} out={o} style={{left: L, top: 226}}>
        <Kicker color={C.ink2}>Design Style · 布局 02</Kicker>
      </Show>
      <div style={{position: 'absolute', left: L - 6, top: 282}}>
        <Rise f={f} at={a - 2} out={o} text="Masonry" d={2} style={{...serif(212, -0.035), color: C.ink}} />
      </div>
      <Show f={f} at={a + 6} out={o} dy={24} style={{left: L, top: 522}}>
        <div style={{...sc(64, 900, 0.04), color: C.ink}}>瀑布流布局</div>
      </Show>
      <Show f={f} at={a + 12} out={o} style={{left: L, top: 630}}>
        <div style={{...sc(29, 500, 0.03), lineHeight: 1.65, color: C.ink2}}>
          <span style={{color: C.ink}}>列宽固定，高度跟着内容走；</span>
          <br />
          每一张，都落进当前最短的那一列。
        </div>
      </Show>
      <Show f={f} at={a + 18} out={o} style={{left: L, top: 790, display: 'flex', gap: 10}}>
        {['图片社区', '信息流', '作品集', '商品推荐'].map((t) => (
          <span key={t} style={{...sc(20, 500, 0.06), color: C.ink, padding: '10px 16px', borderRadius: 999, boxShadow: 'inset 0 0 0 1.5px rgba(20,20,20,.14)'}}>
            {t}
          </span>
        ))}
      </Show>
    </>
  );
};

/* ───────────── 02 名字：砌石墙 ───────────── */
export const StoneCaption: React.FC<P> = ({f}) => {
  const {in: a, out: o} = SCENE.STONE;
  const chip = (t: string, k: number) => (
    <span key={t} style={{...sc(21, 500, 0.06), color: '#EDE5D8', padding: '10px 16px', borderRadius: 999, background: 'rgba(237,229,216,.08)', boxShadow: 'inset 0 0 0 1px rgba(237,229,216,.14)', marginRight: k ? 0 : 10}}>
      {t}
    </span>
  );
  return (
    <>
      <Show f={f} at={a - 6} out={o} style={{left: L, top: 226}}>
        <Kicker color="#A89E90">名字的由来</Kicker>
      </Show>
      <Show f={f} at={a - 2} out={o} dy={26} style={{left: L - 4, top: 290}}>
        <div style={{...serif(150, -0.03, true), color: '#E9DFCF'}}>Masonry</div>
      </Show>
      <Show f={f} at={a + 4} out={o} dy={24} style={{left: L, top: 470}}>
        <div style={{...sc(84, 900, 0.04), color: '#F6F1E8'}}>砌石墙</div>
      </Show>
      <Show f={f} at={a + 10} out={o} style={{left: L, top: 596, width: 600}}>
        <div style={{...sc(26, 500, 0.03), lineHeight: 1.7, color: '#A89E90'}}>
          <span style={{color: '#EDE5D8'}}>大小不一的石块，一块挨一块码紧。</span>
          <br />
          中文叫“瀑布流”：内容从上往下，
          <br />
          像瀑布一样一直流下去。
        </div>
      </Show>
      <Show f={f} at={a + 16} out={o} style={{left: L, top: 790, display: 'flex'}}>
        {chip('石块 → 卡片', 0)}
        {chip('灰缝 → 间距', 1)}
      </Show>
    </>
  );
};

/* ───────────── 03 核心算法：最短列优先 ───────────── */
const CODE: [string, string][] = [
  ['heights = [0, 0, 0, 0]', ''],
  ['for card in cards:', ''],
  ['    i = argmin(heights)', '找最短的一列'],
  ['    place(card, column=i)', '放进去'],
  ['    heights[i] += card.h + gap', '这一列变高'],
];
const landedAt = (f: number) => ALG_LAND.filter((l) => f >= l).length;

export const AlgCaption: React.FC<P> = ({f}) => {
  const {in: a, out: o} = SCENE.ALG;
  // 代码高亮跟着第一张慢放的卡片走：比高度 → 放进去 → 变高
  let line = -1;
  for (let k = 0; k < 3; k++) {
    const l = ALG_LAND[k];
    if (f >= l - 26 && f < l - 14) line = 2;
    else if (f >= l - 14 && f < l) line = 3;
    else if (f >= l && f < l + 12) line = 4;
  }
  if (f >= ALG_LAND[3] - 10 && f < ALG_LAND[7] + 8) line = 1;
  return (
    <>
      <Show f={f} at={a - 6} out={o} style={{left: L, top: 160}}>
        <Kicker color={C.t2}>核心算法</Kicker>
      </Show>
      <Show f={f} at={a - 2} out={o} dy={26} style={{left: L, top: 218}}>
        <div style={{...sc(92, 900, 0.03), color: C.t1}}>最短列优先</div>
      </Show>
      <Show f={f} at={a + 4} out={o} style={{left: L, top: 346, width: 600}}>
        <div style={{...sc(26, 500, 0.03), lineHeight: 1.7, color: C.t2}}>
          <span style={{color: C.t1}}>下一张卡片，永远放进当前最短的那一列；</span>
          <br />
          一样短，就放最左边。
        </div>
      </Show>
      <Show f={f} at={a + 10} out={o} style={{left: L, top: 500, width: 600}}>
        <div style={{borderRadius: 20, background: '#141518', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.08)', padding: '22px 0'}}>
          {CODE.map(([code, note], k) => {
            const on = line === k;
            return (
              <div key={k} style={{position: 'relative', height: 44, display: 'flex', alignItems: 'center', padding: '0 26px'}}>
                <div style={{position: 'absolute', inset: '2px 0', background: on ? 'rgba(242,70,46,.14)' : 'transparent', boxShadow: on ? `inset 3px 0 0 ${C.accent}` : undefined}} />
                <span style={{position: 'relative', ...mono(20, 400), whiteSpace: 'pre', color: on ? '#FFFFFF' : 'rgba(244,242,238,.62)'}}>{code}</span>
                {note && <span style={{position: 'relative', marginLeft: 'auto', ...sc(17, 500, 0.04), color: on ? C.accent : 'rgba(244,242,238,.28)'}}>{note}</span>}
              </div>
            );
          })}
        </div>
      </Show>
    </>
  );
};

/** 每列底下的高度读数、下一张要落的位置（虚线框）、落地时的一圈红边 */
export const AlgOverlay: React.FC<P> = ({f}) => {
  const {in: a, out: o} = SCENE.ALG;
  const fade = tween(f, a + 6, 12) * (1 - tween(f, o + 4, 10)); // 等石墙退干净再出读数
  if (fade <= 0.001) return null;
  const k = landedAt(f);
  const prev = LAYOUTS[`ALG${Math.max(0, k - 1)}`].heights!;
  const cur = LAYOUTS[`ALG${k}`].heights!;
  const t = k > 0 ? tween(f, ALG_LAND[k - 1], 12, 0, 1, E.out) : 1;
  const hs = cur.map((h, c) => prev[c] + (h - prev[c]) * t);
  // 下一张（还没落地的）会去哪一列
  const next = k < ALG_LAND.length ? k : -1;
  const nextRect = next >= 0 ? LAYOUTS[`ALG${next + 1}`].rects[ALG_BASE + next]! : null;
  const min = Math.min(...cur);
  const shortest = cur.findIndex((h) => h === min);
  const ghostOn = next >= 0 && next < 3 ? tween(f, Math.max(ALG_LAND[next] - 30, a + 8), 8) * (1 - tween(f, ALG_LAND[next] - 2, 4)) : 0;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: fade}}>
      {/* 虚线框：最短那一列的下一个位置 */}
      {nextRect && ghostOn > 0.001 && (
        <div style={{position: 'absolute', left: nextRect.x, top: nextRect.y, width: nextRect.w, height: nextRect.h, borderRadius: 16, opacity: ghostOn, background: 'rgba(242,70,46,.08)', border: `2px dashed ${C.accent}`, boxSizing: 'border-box'}} />
      )}
      {/* 落地：一圈红边慢慢褪掉 */}
      {ALG_LAND.map((land, j) => {
        const fl = 1 - tween(f, land, 20, 0, 1, E.out);
        if (f < land || fl <= 0.001) return null;
        const r = LAYOUTS[`ALG${j + 1}`].rects[ALG_BASE + j]!;
        return <div key={j} style={{position: 'absolute', left: r.x - 3, top: r.y - 3, width: r.w + 6, height: r.h + 6, borderRadius: 19, boxShadow: `0 0 0 3px ${C.accent}`, opacity: fl}} />;
      })}
      {/* 高度读数：每列底边下面一颗胶囊，最短的那一列是红的 */}
      {hs.map((h, c) => {
        const x = RIGHT.x0 + c * (RIGHT.colW + RIGHT.gap) + RIGHT.colW / 2;
        const y = RIGHT.y0 + h - RIGHT.gap + 34;
        if (y > 1060) return null;
        const isMin = c === shortest && next >= 0;
        const pop = isMin && next < 3 ? spr(f, ALG_LAND[next] - 30, POP, 24) : 0;
        return (
          <div key={c} style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${1 + 0.12 * pop * (1 - tween(f, ALG_LAND[Math.max(0, next)] - 14, 10))})`, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 13px 9px', borderRadius: 999, background: isMin ? C.accent : 'rgba(255,255,255,.08)', boxShadow: isMin ? '0 6px 18px rgba(242,70,46,.35)' : 'inset 0 0 0 1px rgba(255,255,255,.1)', whiteSpace: 'nowrap'}}>
            {isMin && <span style={{...sc(16, 700, 0.06), color: '#fff'}}>最短</span>}
            <span style={{...mono(18, 500), color: isMin ? '#fff' : 'rgba(244,242,238,.7)'}}>{Math.round(h - RIGHT.gap)}</span>
          </div>
        );
      })}
    </div>
  );
};

/* ───────────── 04 走红 · 2010 Pinterest ───────────── */
export const PinCaption: React.FC<P> = ({f}) => {
  const {in: a, out: o} = SCENE.PIN;
  const steps: [string, string][] = [
    ['2009', 'jQuery Masonry 插件'],
    ['2010', 'Pinterest 上线'],
    ['2011 前后', '国内图片社区跟进'],
  ];
  return (
    <>
      <Show f={f} at={a - 8} out={o} style={{left: L, top: 196}}>
        <Kicker color={C.ink2}>走红 · 前因后果</Kicker>
      </Show>
      <Show f={f} at={a - 4} out={o} dy={26} style={{left: L - 6, top: 248}}>
        <div style={{...serif(200, -0.03), color: C.ink}}>2010</div>
      </Show>
      <Show f={f} at={a + 2} out={o} dy={22} style={{left: L, top: 470}}>
        <div style={{...sc(44, 700, 0.03), color: C.ink}}>Pinterest · 图钉墙</div>
      </Show>
      <Show f={f} at={a + 8} out={o} style={{left: L, top: 550, width: 560}}>
        <div style={{...sc(26, 500, 0.03), lineHeight: 1.7, color: C.ink2}}>
          <span style={{color: C.ink}}>把喜欢的图片“钉”到自己的墙上。</span>
          <br />
          一面看不到底的墙，让瀑布流火遍全网。
        </div>
      </Show>
      <Show f={f} at={a + 14} out={o} style={{left: L, top: 704, width: 560}}>
        <div style={{position: 'relative', height: 120}}>
          <div style={{position: 'absolute', left: 6, right: 30, top: 6, height: 2, background: 'rgba(20,20,20,.12)'}} />
          {steps.map(([y, t], k) => (
            <div key={y} style={{position: 'absolute', left: k * 196, top: 0}}>
              <div style={{width: 14, height: 14, borderRadius: 7, background: k === 1 ? C.accent : C.paper, boxShadow: k === 1 ? undefined : `inset 0 0 0 2px ${C.ink}`}} />
              <div style={{...ui(22, 600), color: k === 1 ? C.accent : C.ink, marginTop: 18}}>{y}</div>
              <div style={{...sc(17, 500, 0.03), color: C.ink2, marginTop: 10}}>{t}</div>
            </div>
          ))}
        </div>
      </Show>
    </>
  );
};

/** 图钉墙：鼠标移到一张图上，出现“保存”，点一下变成“已保存” */
export const PIN_HOVER = 7;
export const PIN_CLICK = 406;
export const PinHover: React.FC<P> = ({f}) => {
  const {in: a, out: o} = SCENE.PIN;
  if (f < a || f > o + 10) return null;
  const st = tileState(f, PIN_HOVER);
  const {x, y, w, h, r} = st.rect;
  const move = tween(f, a + 2, 26, 0, 1, E.inOut);
  const cx = 1560 + (x + w * 0.62 - 1560) * move;
  const cy = 1010 + (y + h * 0.58 - 1010) * move;
  const hov = tween(f, a + 20, 8) * (1 - tween(f, o, 8));
  const press = f >= PIN_CLICK - 2 && f < PIN_CLICK + 4 ? 0.9 : 1;
  const saved = f >= PIN_CLICK;
  const cur = 1 - tween(f, o + 2, 8);
  return (
    <>
      <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: r, background: 'rgba(0,0,0,.30)', opacity: hov, zIndex: 31}}>
        <div style={{position: 'absolute', right: 12, top: 12, transform: `scale(${press})`, ...sc(17, 700, 0.04), color: '#fff', background: saved ? '#111' : '#E60023', padding: '12px 16px', borderRadius: 999}}>{saved ? '已保存' : '保存'}</div>
        <div style={{position: 'absolute', left: 12, bottom: 12, ...sc(14, 500, 0.02), color: '#111', background: 'rgba(255,255,255,.92)', padding: '8px 12px', borderRadius: 999}}>tokyo.jp</div>
        {[0, 1].map((k) => (
          <div key={k} style={{position: 'absolute', right: 12 + k * 42, bottom: 12, width: 34, height: 34, borderRadius: 17, background: 'rgba(255,255,255,.92)'}} />
        ))}
      </div>
      {/* 鼠标指针 */}
      <svg width={34} height={40} viewBox="0 0 34 40" style={{position: 'absolute', left: cx, top: cy, opacity: cur, zIndex: 32, transform: `scale(${press})`, transformOrigin: '4px 3px', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,.3))'}}>
        <path d="M4 3 L4 31 L11 24.5 L16 36 L21 33.8 L16 22.5 L26 22.5 Z" fill="#111" stroke="#fff" strokeWidth={2.2} strokeLinejoin="round" />
      </svg>
    </>
  );
};

/* ───────────── 05 手机 · 双列 ───────────── */
const T_PHONE = transTo('PHONE').at;
const T_WIRE = transTo('WIRE').at;
const phoneIn = (f: number) => tween(f, T_PHONE - 4, 34, 0, 1, FLOW) * (1 - tween(f, T_WIRE, 30, 0, 1, FLOW));
const phoneX = (f: number) => (1 - tween(f, T_PHONE - 4, 34, 0, 1, FLOW)) * 420 + tween(f, T_WIRE, 30, 0, 1, FLOW) * 520;

export const PhoneBack: React.FC<P> = ({f}) => {
  const o = phoneIn(f);
  if (o <= 0.001) return null;
  const s = SCREEN;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: Math.min(1, o * 1.4), transform: `translateX(${phoneX(f)}px)`}}>
      <div style={{position: 'absolute', left: PHONE.x, top: PHONE.y, width: PHONE.w, height: PHONE.h, borderRadius: PHONE.r, background: '#0B0B0C', boxShadow: '0 40px 90px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.06)'}} />
      <div style={{position: 'absolute', left: s.x, top: s.y, width: s.w, height: s.h, borderRadius: s.r, background: '#F4F4F4', overflow: 'hidden'}}>
        {/* 状态栏 */}
        <div style={{position: 'absolute', left: 40, top: 20, ...ui(17, 600), color: '#111'}}>9:41</div>
        <svg width={78} height={14} style={{position: 'absolute', right: 30, top: 21}}>
          {[0, 1, 2, 3].map((k) => (
            <rect key={k} x={k * 5} y={10 - k * 3} width={3.4} height={4 + k * 3} rx={1} fill="#111" />
          ))}
          <path d="M30 6.5 a9 9 0 0 1 12 0 M32.6 9.3 a5 5 0 0 1 6.8 0" stroke="#111" strokeWidth={1.8} fill="none" strokeLinecap="round" />
          <circle cx={36} cy={12} r={1.4} fill="#111" />
          <rect x={50} y={1.5} width={23} height={11} rx={3.2} fill="none" stroke="#111" strokeOpacity={0.45} />
          <rect x={52} y={3.5} width={17} height={7} rx={1.6} fill="#111" />
          <rect x={74.5} y={5} width={1.6} height={4} rx={0.8} fill="#111" fillOpacity={0.45} />
        </svg>
        {/* 顶栏：关注 / 发现 / 附近 */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 54, height: 46, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 34}}>
          {['关注', '发现', '附近'].map((t) => (
            <div key={t} style={{position: 'relative', ...sc(18, t === '发现' ? 700 : 500, 0.04), color: t === '发现' ? '#111' : '#9A9A9A'}}>
              {t}
              {t === '发现' && <div style={{position: 'absolute', left: '50%', bottom: -10, width: 22, height: 3, borderRadius: 2, marginLeft: -11, background: '#FF2442'}} />}
            </div>
          ))}
        </div>
        <svg width={22} height={22} viewBox="0 0 24 24" style={{position: 'absolute', left: 20, top: 66}}>
          <path d="M4 7h16M4 12h16M4 17h16" stroke="#111" strokeWidth={2} strokeLinecap="round" />
        </svg>
        <svg width={22} height={22} viewBox="0 0 24 24" style={{position: 'absolute', right: 20, top: 66}}>
          <circle cx={11} cy={11} r={7} stroke="#111" strokeWidth={2} fill="none" />
          <path d="M16.5 16.5 L21 21" stroke="#111" strokeWidth={2} strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};

export const PhoneFront: React.FC<P> = ({f}) => {
  const o = phoneIn(f);
  if (o <= 0.001) return null;
  const s = SCREEN;
  const navTop = FEED.y + FEED.h;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: Math.min(1, o * 1.4), transform: `translateX(${phoneX(f)}px)`, pointerEvents: 'none'}}>
      {/* 底栏 */}
      <div style={{position: 'absolute', left: s.x, top: navTop, width: s.w, height: s.y + s.h - navTop, background: '#FFFFFF', boxShadow: '0 -1px 0 rgba(0,0,0,.06)'}}>
        <div style={{display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: 54}}>
          {['首页', '购物', '+', '消息', '我'].map((t) =>
            t === '+' ? (
              <div key={t} style={{width: 48, height: 34, borderRadius: 10, background: '#FF2442', display: 'flex', alignItems: 'center', justifyContent: 'center', ...ui(26, 400), color: '#fff', lineHeight: '34px'}}>+</div>
            ) : (
              <span key={t} style={{...sc(16, t === '首页' ? 700 : 500, 0.04), color: t === '首页' ? '#111' : '#9A9A9A'}}>{t}</span>
            ),
          )}
        </div>
        <div style={{position: 'absolute', left: '50%', bottom: 8, width: 136, height: 5, marginLeft: -68, borderRadius: 3, background: '#111'}} />
      </div>
      {/* 屏幕圆角外面的机身：用外扩阴影盖住被方形裁切的卡片角 */}
      <div style={{position: 'absolute', left: s.x, top: s.y, width: s.w, height: s.h, borderRadius: s.r, boxShadow: '0 0 0 14px #0B0B0C'}} />
      <div style={{position: 'absolute', left: PHONE.x, top: PHONE.y, width: PHONE.w, height: PHONE.h, borderRadius: PHONE.r, boxShadow: 'inset 0 0 0 2px #3A3A3E, inset 0 0 0 4px #0B0B0C, inset 0 0 0 5px rgba(255,255,255,.05)'}} />
      {/* 灵动岛 */}
      <div style={{position: 'absolute', left: s.x + s.w / 2 - 62, top: s.y + 12, width: 124, height: 36, borderRadius: 18, background: '#000'}} />
    </div>
  );
};

export const PhoneCaption: React.FC<P> = ({f}) => {
  const {in: a, out: o} = SCENE.PHONE;
  const chip = (t: string) => (
    <span key={t} style={{...sc(20, 500, 0.05), color: C.t1, padding: '10px 15px', borderRadius: 999, background: 'rgba(255,255,255,.07)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.1)'}}>{t}</span>
  );
  return (
    <>
      <Show f={f} at={a - 8} out={o} style={{left: L, top: 226}}>
        <Kicker color={C.t2}>手机上</Kicker>
      </Show>
      <Show f={f} at={a - 4} out={o} dy={26} style={{left: L, top: 284}}>
        <div style={{...sc(92, 900, 0.03), color: C.t1}}>双列信息流</div>
      </Show>
      <Show f={f} at={a + 2} out={o} style={{left: L, top: 414, width: 820}}>
        <div style={{...sc(27, 500, 0.03), lineHeight: 1.7, color: C.t2}}>
          <span style={{color: C.t1}}>屏幕窄了，就排两列。</span>
          <br />
          一屏同时露出四五篇，往上一划，
          <br />
          下一张永远在等你。
        </div>
      </Show>
      <Show f={f} at={a + 8} out={o} style={{left: L, top: 600, display: 'flex', gap: 10}}>
        {['2 列', '间距 8', '封面 + 标题 + 点赞'].map(chip)}
      </Show>
      <Show f={f} at={a + 12} out={o} style={{left: L, top: 690}}>
        <div style={{...sc(20, 500, 0.04), color: 'rgba(244,242,238,.42)'}}>小红书 · 淘宝“猜你喜欢” · Pinterest App</div>
      </Show>
    </>
  );
};

/* ───────────── 06 五条规则 ───────────── */
const RULES: [string, string][] = [
  ['列宽固定', '宽度统一，高度跟着内容走'],
  ['最短优先', '按顺序，每张放进最短的那一列'],
  ['统一间距', '横缝、竖缝一样宽，常用 8–24px'],
  ['保持比例', '图片按原始宽高比放，不裁切'],
  ['先占位', '先写好宽高再加载，页面不跳'],
];
const WO = SCENE.WIRE.out;

export const RulesPanel: React.FC<P> = ({f}) => (
  <>
    <Show f={f} at={SCENE.WIRE.in - 8} out={WO} style={{left: L, top: 100}}>
      <div style={{...serif(38, -0.01, true), color: C.t2}}>Masonry</div>
    </Show>
    <Show f={f} at={SCENE.WIRE.in - 4} out={WO} dy={26} style={{left: L, top: 152}}>
      <div style={{...sc(88, 900, 0.02), color: C.t1}}>五条规则</div>
    </Show>
    {RULES.map(([t, d], k) => (
      <Show key={t} f={f} at={RULES_AT[k]} out={WO} dy={22} style={{left: L, top: 344 + k * 124, display: 'grid', gridTemplateColumns: '64px 1fr'}}>
        <div style={{...mono(24), lineHeight: '40px', color: C.accent}}>{`0${k + 1}`}</div>
        <div>
          <div style={{...sc(36, 700, 0.03), lineHeight: '40px', color: C.t1}}>{t}</div>
          <div style={{...sc(22, 400, 0.03), lineHeight: 1.3, color: C.t2, marginTop: 12}}>{d}</div>
        </div>
      </Show>
    ))}
  </>
);

/** 规则 01：列网格从上往下铺开 */
export const ColumnLanes: React.FC<P> = ({f}) => {
  const o = 1 - tween(f, WO, 8);
  if (f < RULES_AT[0] - 2 || o <= 0) return null;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: o * (1 - 0.55 * tween(f, RULES_AT[1], 14))}}>
      {[0, 1, 2, 3].map((c) => {
        const sk = tween(f, RULES_AT[0] + c * 3, 30, 0, 1, E.inOut);
        return <rect key={c} x={RIGHT.x0 + c * (RIGHT.colW + RIGHT.gap)} y={0} width={RIGHT.colW} height={1080 * sk} fill="rgba(242,70,46,.085)" />;
      })}
    </svg>
  );
};

export const Annotations: React.FC<P> = ({f}) => {
  const R = LAYOUTS.WIRE.rects;
  const out = 1 - tween(f, WO, 8);
  if (f < RULES_AT[0] - 4 || out <= 0) return null;
  const cx = (i: number) => R[i]!.x + R[i]!.w / 2;
  const cy = (i: number) => R[i]!.y + 44; // 顺序点放在卡片上沿，不压住中间的宽高比
  // 规则 02：顺序线 1 → 8，在几列之间来回折
  const order = [0, 1, 2, 3, 4, 5, 6, 7];
  const d = order.map((i, k) => `${k ? 'L' : 'M'}${cx(i)} ${cy(i)}`).join(' ');
  const draw = tween(f, RULES_AT[1] + 2, 26, 0, 1, E.inOut);
  const o2 = tween(f, RULES_AT[1], 10) * (1 - 0.7 * tween(f, RULES_AT[2], 12));
  const o3 = tween(f, RULES_AT[2], 12);
  const g = RIGHT.gap;
  // 规则 03：找一对左右相邻、一对上下相邻的卡片标注间距
  const hGap = {x: R[0]!.x + R[0]!.w + g / 2, y: R[0]!.y + 200};
  const v = R[4]!; // 第 5 张在第 2 列，上面是第 2 张
  const vGap = {x: v.x + v.w / 2, y: v.y - g / 2};
  return (
    <>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, zIndex: 35, opacity: out}} fill="none">
        <path d={d} stroke={C.accent} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} opacity={o2} />
        <g stroke={C.accent} strokeWidth={2} opacity={o3}>
          <path d={`M${hGap.x - g / 2} ${hGap.y} H${hGap.x + g / 2} M${hGap.x - g / 2} ${hGap.y - 8} V${hGap.y + 8} M${hGap.x + g / 2} ${hGap.y - 8} V${hGap.y + 8}`} />
          <path d={`M${vGap.x} ${vGap.y - g / 2} V${vGap.y + g / 2} M${vGap.x - 8} ${vGap.y - g / 2} H${vGap.x + 8} M${vGap.x - 8} ${vGap.y + g / 2} H${vGap.x + 8}`} />
        </g>
      </svg>
      {order.map((i, k) => {
        const at = RULES_AT[1] + 2 + k * 3;
        const s = spr(f, at, POP, 24);
        const o = Math.min(1, s * 2) * (1 - 0.7 * tween(f, RULES_AT[2], 12)) * out;
        if (o <= 0.001) return null;
        return (
          <div key={i} style={{position: 'absolute', zIndex: 36, left: cx(i), top: cy(i), width: 40, height: 40, marginLeft: -20, marginTop: -20, borderRadius: 20, background: C.accent, transform: `scale(${0.5 + 0.5 * s})`, opacity: o, display: 'flex', alignItems: 'center', justifyContent: 'center', ...mono(18, 500), color: '#fff'}}>
            {k + 1}
          </div>
        );
      })}
      {[0, 1, 2, 3].map((c) => (
        <Pill key={c} f={f} at={RULES_AT[0] + 4 + c * 3} out={WO} x={RIGHT.x0 + c * (RIGHT.colW + g) + RIGHT.colW / 2} y={64}>
          {`w ${RIGHT.colW}`}
        </Pill>
      ))}
      <Pill f={f} at={RULES_AT[2]} out={WO} x={hGap.x} y={hGap.y - 34}>{`${g}`}</Pill>
      <Pill f={f} at={RULES_AT[2] + 4} out={WO} x={vGap.x + 44} y={vGap.y}>{`${g}`}</Pill>
      <Pill f={f} at={RULES_AT[3] + 4} out={WO} x={cx(0)} y={R[0]!.y + R[0]!.h - 40}>{`h = ${RIGHT.colW} × ${ITEMS[0].ratio} = ${R[0]!.h}`}</Pill>
      <Pill f={f} at={RULES_AT[4] + 6} out={WO} x={cx(2)} y={R[2]!.y + R[2]!.h - 40} color="#2B2C30">占位中…</Pill>
    </>
  );
};
/** 规则 04 之前，线框卡片里不显示宽高比 */
export const ratioGate = (f: number) => tween(f, RULES_AT[3], 14);

/* ───────────── 07 响应式 ───────────── */
const T5 = transTo('R5');
const T3 = transTo('R3');
const T2 = transTo('R2');
const T_END = transTo('END');
const winW = (f: number) => {
  const step = (t: typeof T5) => tween(f, t.at + 6, t.dur, 0, 1, FLOW);
  return WIN_W.R5 + (WIN_W.R3 - WIN_W.R5) * step(T3) + (WIN_W.R2 - WIN_W.R3) * step(T2);
};
const winOn = (f: number) => tween(f, T5.at, 22, 0, 1, E.out) * (1 - tween(f, T_END.at, 16, 0, 1, E.inOut));
const BP: [string, string, string][] = [
  ['≥ 1200px', '桌面', '5 列'],
  ['≥ 768px', '平板', '3 列'],
  ['< 768px', '手机', '2 列'],
];
const bpAt = (f: number) => (f >= T2.at + HIT ? 2 : f >= T3.at + HIT ? 1 : 0);

export const RespWindow: React.FC<P> = ({f}) => {
  const o = winOn(f);
  if (o <= 0.001) return null;
  const w = winW(f);
  const x = 1824 - w;
  const k = bpAt(f);
  const label = [`1440 px · 5 列`, `1024 px · 3 列`, `390 px · 2 列`][k];
  const pop = spr(f, [T5, T3, T2][k].at + HIT, POP, 24);
  return (
    <div style={{position: 'absolute', left: x, top: WIN_Y, width: w, height: WIN_H, opacity: o, transform: `scale(${0.97 + 0.03 * o})`, transformOrigin: '100% 50%', borderRadius: 18, background: '#FFFFFF', boxShadow: '0 1px 2px rgba(40,30,20,.06), 0 30px 80px rgba(40,30,20,.14), 0 0 0 1px rgba(20,20,20,.06)'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: WIN_BAR, borderBottom: '1px solid rgba(20,20,20,.07)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 8}}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
          <div key={c} style={{width: 13, height: 13, borderRadius: 7, background: c}} />
        ))}
        {w > 900 && <div style={{marginLeft: 24, ...mono(15, 400), color: C.ink2, background: '#F4F2EE', padding: '8px 14px', borderRadius: 8}}>guanmo-ai.github.io/design-style</div>}
        <div style={{marginLeft: 'auto', transform: `scale(${0.9 + 0.1 * pop})`, ...mono(15, 500), color: '#fff', background: C.ink, padding: '8px 12px', borderRadius: 8, whiteSpace: 'nowrap'}}>{label}</div>
      </div>
    </div>
  );
};

export const RespCaption: React.FC<P> = ({f}) => {
  const a = T3.at + 22; // 等窗口缩到一半以下再出字，免得压到窗口
  const o = SCENE.RESP.out;
  const k = bpAt(f);
  return (
    <>
      <Show f={f} at={a} out={o} style={{left: L, top: 226}}>
        <Kicker color={C.ink2}>响应式</Kicker>
      </Show>
      <Show f={f} at={a + 3} out={o} dy={26} style={{left: L, top: 284}}>
        <div style={{...sc(76, 900, 0.03), color: C.ink}}>列数跟着屏幕变</div>
      </Show>
      <Show f={f} at={a + 6} out={o} style={{left: L, top: 400, width: 560}}>
        {BP.map(([px, dev, n], j) => {
          const on = j === k;
          return (
            <div key={px} style={{display: 'flex', alignItems: 'center', height: 76, borderBottom: '1px solid rgba(20,20,20,.08)', opacity: on ? 1 : 0.42}}>
              <span style={{width: 18, height: 18, borderRadius: 9, background: on ? C.accent : 'transparent', boxShadow: on ? undefined : `inset 0 0 0 2px ${C.ink}`, marginRight: 20}} />
              <span style={{...mono(24, 500), color: C.ink, width: 170}}>{px}</span>
              <span style={{...sc(26, 500, 0.06), color: C.ink, width: 110}}>{dev}</span>
              <span style={{...sc(30, 900, 0.04), color: on ? C.accent : C.ink, marginLeft: 'auto'}}>{n}</span>
            </div>
          );
        })}
      </Show>
      <Show f={f} at={a + 10} out={o} style={{left: L, top: 664, width: 560}}>
        <div style={{...sc(24, 500, 0.03), lineHeight: 1.7, color: C.ink2}}>
          列宽大致不变，变的是列数；
          <br />
          卡片按同样的顺序，重新流一遍。
        </div>
      </Show>
    </>
  );
};

/* ───────────── 片尾 ───────────── */
export const EndTitle: React.FC<P> = ({f}) => {
  const at = SCENE.END.in;
  const o = 9999;
  const center: React.CSSProperties = {left: 0, right: 0, display: 'flex', justifyContent: 'center'};
  return (
    <>
      <div style={{position: 'absolute', ...center, top: 404}}>
        <Rise f={f} at={at - 4} out={o} text="Masonry" d={2} style={{...serif(150, -0.03), color: C.ink}} />
      </div>
      <Show f={f} at={at + 8} out={o} dy={24} style={{...center, top: 586}}>
        <div style={{...sc(46, 700, 0.12), color: C.ink}}>瀑布流布局</div>
      </Show>
      <Show f={f} at={at + 16} out={o} style={{...center, top: 690}}>
        <div style={{...sc(30, 500, 0.12), color: C.ink}}>风格塑造视觉，布局组织信息。</div>
      </Show>
      <Show f={f} at={at + 20} out={o} style={{...center, top: 752}}>
        <div style={{...sc(22, 400, 0.08), color: C.ink2}}>列宽固定 · 最短优先 · 统一间距 · 保持比例 · 先占位</div>
      </Show>
      <Show f={f} at={at + 26} out={o} style={{...center, top: 960, alignItems: 'baseline'}}>
        <span style={{...serif(26, 0, true), color: 'rgba(20,20,20,.5)'}}>Design Style</span>
        <span style={{...sc(22, 500, 0.04), color: 'rgba(20,20,20,.8)', marginLeft: 12}}>布局</span>
        <span style={{...ui(22, 600), color: 'rgba(20,20,20,.8)', marginLeft: 6}}>02</span>
        <span style={{...ui(22, 500), color: 'rgba(20,20,20,.5)', marginLeft: 28}}>@guanmo_ai</span>
        <span style={{...mono(20, 400), color: 'rgba(20,20,20,.5)', marginLeft: 28}}>github.com/guanmo-ai/design-style</span>
      </Show>
    </>
  );
};

/* ───────────── 底部章节栏 ───────────── */
const CHAPTERS: [string, string, boolean][] = [
  ['KEY', '什么是瀑布流', true],
  ['STONE', '名字的由来：砌石墙', false],
  ['ALG0', '核心算法：最短列优先', false],
  ['PIN', '走红 · 2010 Pinterest 图钉墙', true],
  ['PHONE', '手机上 · 双列信息流', false],
  ['WIRE', '五条规则', false],
  ['R5', '响应式：列数跟着屏幕变', true],
];
export const Hud: React.FC<P> = ({f}) => {
  const o = tween(f, 64, 16) * (1 - tween(f, T_END.at, 10));
  if (o <= 0.001) return null;
  const at = (name: string) => transTo(name as never).at + HIT - 6;
  let k = 0;
  CHAPTERS.forEach(([name], j) => {
    if (f >= at(name) || j === 0) k = j;
  });
  const p = tween(f, at(CHAPTERS[k][0]), 14, 0, 1, E.out);
  const light = CHAPTERS[k][2];
  const main = light ? 'rgba(20,20,20,.8)' : 'rgba(244,242,238,.8)';
  const dim = light ? 'rgba(20,20,20,.42)' : 'rgba(244,242,238,.4)';
  return (
    <div style={{position: 'absolute', left: 96, right: 96, top: 1020, height: 32, opacity: o, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <div style={{display: 'flex', alignItems: 'baseline'}}>
        <span style={{...serif(26, 0, true), color: main}}>Masonry</span>
        <span style={{...sc(18, 500, 0.06), color: dim, marginLeft: 12}}>瀑布流布局</span>
      </div>
      <div style={{display: 'flex', alignItems: 'baseline', opacity: 0.25 + 0.75 * p, transform: `translateY(${(1 - p) * 14}px)`}}>
        <span style={{...mono(18, 500), color: C.accent, marginRight: 14}}>{`0${k + 1} / 07`}</span>
        <span style={{...sc(19, 500, 0.04), color: main}}>{CHAPTERS[k][1]}</span>
      </div>
    </div>
  );
};
