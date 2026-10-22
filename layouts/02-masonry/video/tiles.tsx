/**
 * 布局 02 · Masonry —— 一张卡片在不同章节里的样子。
 * 同一张卡片只换“皮”：照片 / 砌石 / 深色编号 / 图钉墙 / 手机笔记 / 线框 / 骨架屏。
 * 每种皮是一组数值（theme），转场时数值之间插值，所以卡片是“慢慢变过去”的，不是切换。
 */
import React from 'react';
import {interpolateColors, staticFile} from 'remotion';
import {E, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {ITEMS, Item, META, RULES_AT, SCENE, State, ThemeName} from './layout';
import {mono, sc, serif, ui} from './ui';

type Th = {top: string; bot: string; line: string; lw: number; sh: number; photo: number; gray: number; stone: number; num: number; meta: number; text: number; ratio: number};
const Z = {line: 'rgba(0,0,0,0)', lw: 0, sh: 0, photo: 0, gray: 0, stone: 0, num: 0, meta: 0, text: 0, ratio: 0};

const TEXT_BG: Record<string, string> = {red: C.accent, quote: C.ink, palette: '#FFFFFF', note: C.sand};
const base = (it: Item) => (it.text ? TEXT_BG[it.text] : '#E4DFD6');

const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
};

export const theme = (name: ThemeName, i: number): Th => {
  const it = ITEMS[i];
  switch (name) {
    case 'KEY':
      return {...Z, top: base(it), bot: base(it), line: 'rgba(20,20,20,0.05)', lw: 1, sh: 1, photo: 1, text: 1};
    case 'STONE': // 砂岩：上亮下暗，每块石头颜色略有不同
      return {...Z, top: shade(it.stone, 1.06), bot: shade(it.stone, 0.84), stone: 1};
    case 'ALG': // 深色：照片压暗去色，只留编号
      return {...Z, top: '#1B1C1F', bot: '#151619', line: 'rgba(255,255,255,0.09)', lw: 1, photo: 0.26, gray: 1, num: 1, text: 0.26};
    case 'PIN':
      return {...Z, top: base(it), bot: base(it), photo: 1, text: 1};
    case 'PHONE':
      return {...Z, top: '#FFFFFF', bot: '#FFFFFF', photo: 1, text: 1, meta: 1};
    case 'WIRE':
      return {...Z, top: 'rgba(26,27,30,0.35)', bot: 'rgba(26,27,30,0.35)', line: 'rgba(255,255,255,0.26)', lw: 1.5, ratio: 1};
    case 'RESP':
      return {...Z, top: base(it), bot: base(it), photo: 1, text: 1};
    case 'END':
      return {...Z, top: i === 1 ? C.accent : C.ink, bot: i === 1 ? C.accent : C.ink};
  }
};
const mix = (a: Th, b: Th, p: number): Th => {
  const c = (x: string, y: string) => (x === y ? x : interpolateColors(p, [0, 1], [x, y]));
  const n = (x: number, y: number) => x + (y - x) * p;
  return {top: c(a.top, b.top), bot: c(a.bot, b.bot), line: c(a.line, b.line), lw: n(a.lw, b.lw), sh: n(a.sh, b.sh), photo: n(a.photo, b.photo), gray: n(a.gray, b.gray), stone: n(a.stone, b.stone), num: n(a.num, b.num), meta: n(a.meta, b.meta), text: n(a.text, b.text), ratio: n(a.ratio, b.ratio)};
};

// 砂岩的纹理：一张 feTurbulence 噪点图，所有石头共用
const STONE_TEX = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="7"/><feColorMatrix values="0 0 0 0 0.25  0 0 0 0 0.2  0 0 0 0 0.15  0 0 0 1.6 -0.55"/></filter><rect width="220" height="220" filter="url(#n)"/></svg>',
)}")`;
const STONE_BLOT = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><filter id="m"><feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.24  0 0 0 0 0.18  0 0 0 1.2 -0.45"/></filter><rect width="400" height="400" filter="url(#m)"/></svg>',
)}")`;

/** 文字卡片：都画在 251 宽的画板上，再按卡片宽度等比缩放 */
const ART_W = 251;
const TextArt: React.FC<{it: Item}> = ({it}) => {
  const h = ART_W * it.ratio;
  const box: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: ART_W, height: h};
  switch (it.text) {
    case 'red':
      return (
        <div style={box}>
          <div style={{position: 'absolute', left: 20, top: 20, ...mono(13), color: 'rgba(255,255,255,.75)'}}>布局 02</div>
          <div style={{position: 'absolute', right: 18, top: 16, ...serif(30, 0, true), color: 'rgba(255,255,255,.9)'}}>↓</div>
          <div style={{position: 'absolute', left: 20, bottom: 86, ...serif(34, -0.01, true), color: '#fff'}}>Waterfall</div>
          <div style={{position: 'absolute', left: 18, bottom: 20, ...sc(58, 900, 0.02), color: '#fff'}}>瀑布流</div>
        </div>
      );
    case 'quote':
      return (
        <div style={box}>
          <div style={{position: 'absolute', left: 22, top: 26, ...serif(34, -0.01, true), lineHeight: 1.05, color: C.t1}}>
            “Less,
            <br />
            but better.”
          </div>
          <div style={{position: 'absolute', left: 22, bottom: 22, ...mono(12, 400), color: C.t2}}>— Dieter Rams</div>
        </div>
      );
    case 'palette': {
      const sw: [string, string, string][] = [
        [C.paper, '纸', '#F2EFE9'],
        [C.ink, '墨', '#141414'],
        [C.accent, '朱', '#F2462E'],
        [C.sand, '沙', '#E9E2D3'],
      ];
      return (
        <div style={box}>
          <div style={{position: 'absolute', left: 20, top: 20, ...serif(30, -0.01), color: C.ink}}>Palette</div>
          {sw.map(([c, n, hex], k) => (
            <div key={hex} style={{position: 'absolute', left: 20, right: 20, top: 74 + k * 40, height: 32, display: 'flex', alignItems: 'center'}}>
              <div style={{width: 32, height: 32, borderRadius: 16, background: c, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.08)'}} />
              <span style={{...sc(14, 500), color: C.ink, marginLeft: 12}}>{n}</span>
              <span style={{...mono(12, 400), color: C.ink2, marginLeft: 'auto'}}>{hex}</span>
            </div>
          ))}
        </div>
      );
    }
    case 'note':
      return (
        <div style={box}>
          <div style={{position: 'absolute', left: 22, top: 26, ...sc(40, 900, 0.02), color: C.ink}}>瀑布流</div>
          <div style={{position: 'absolute', left: 20, top: 74, ...serif(64, 0), color: C.accent}}>≠</div>
          <div style={{position: 'absolute', left: 22, top: 146, ...sc(40, 900, 0.02), color: C.ink}}>便当盒</div>
          {/* 两个小图示：只对齐列 / 行列都对齐 */}
          <svg width={207} height={60} style={{position: 'absolute', left: 22, top: 206}}>
            {[[0, 0, 30], [0, 34, 24], [34, 0, 18], [34, 22, 36], [68, 0, 40], [68, 44, 14]].map(([x, y, h], k) => (
              <rect key={k} x={x} y={y} width={30} height={h} rx={4} fill={k === 3 ? C.accent : C.ink} opacity={k === 3 ? 1 : 0.85} />
            ))}
            {[[118, 0, 64, 28], [186, 0, 30, 28], [118, 32, 30, 28], [152, 32, 64, 28]].map(([x, y, w, h], k) => (
              <rect key={k} x={x - 10} y={y} width={w - 4} height={h} rx={4} fill="none" stroke={C.ink} strokeWidth={1.6} opacity={0.55} />
            ))}
          </svg>
          <div style={{position: 'absolute', left: 22, bottom: 20, ...sc(14, 500, 0.04), color: C.ink2}}>只对齐列，不对齐行</div>
        </div>
      );
    default:
      return null;
  }
};

const avatar = (s: string) => {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${h}, 45%, 62%)`;
};

/** 手机笔记卡片下面那一条：标题 + 作者 + 点赞 */
const Meta: React.FC<{it: Item; o: number}> = ({it, o}) => (
  <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: META, opacity: o, padding: '9px 9px 0', boxSizing: 'border-box'}}>
    <div style={{...sc(15, 500, 0.01), lineHeight: '21px', color: '#222', height: 42, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>{it.title}</div>
    <div style={{display: 'flex', alignItems: 'center', marginTop: 5}}>
      <div style={{width: 18, height: 18, borderRadius: 9, background: avatar(it.author)}} />
      <span style={{...sc(12, 400), color: '#8A8A8A', marginLeft: 6}}>{it.author}</span>
      <svg width={14} height={14} viewBox="0 0 24 24" style={{marginLeft: 'auto'}}>
        <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.6 0 5.6 3.5 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" fill="none" stroke="#8A8A8A" strokeWidth={2} />
      </svg>
      <span style={{...ui(12, 400), color: '#8A8A8A', marginLeft: 3}}>{it.likes}</span>
    </div>
  </div>
);

/** 骨架屏（规则 05：先占位，再加载）的总开关 */
const skeleton = (f: number) => tween(f, RULES_AT[4] - 2, 10, 0, 1, E.out);

export const Tile: React.FC<{f: number; i: number; st: State}> = ({f, i, st}) => {
  const it = ITEMS[i];
  const th = mix(theme(st.from, i), theme(st.to, i), st.pc);
  const {x, y, w, h, r} = st.rect;
  if (st.o <= 0.003) return null;
  // 把章节的裁切框（手机屏幕 / 浏览器窗口）换算成这张卡片自己的 inset
  const cl = st.clip;
  const it0 = Math.max(0, cl.y - y);
  const ir = Math.max(0, x + w - (cl.x + cl.w));
  const ib = Math.max(0, y + h - (cl.y + cl.h));
  const il = Math.max(0, cl.x - x);
  if (it0 >= h || ib >= h || il >= w || ir >= w || it0 + ib >= h) return null;
  if (y > 1100 || y + h < -20 || x > 1940 || x + w < -20) return null;
  const clip = it0 || ir || ib || il ? `inset(${it0}px ${ir}px ${ib}px ${il}px)` : undefined;
  const imgH = h - META * th.meta;
  const s = w / ART_W;
  const skel = st.to === 'WIRE' || st.from === 'WIRE' ? skeleton(f) * (st.to === 'WIRE' ? 1 : 1 - st.pc) : 0;
  const shimmer = ((f * 9 + i * 37) % 900) - 300;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: r,
        overflow: 'hidden',
        opacity: st.o,
        zIndex: st.p < 0.999 ? 20 + i : i,
        clipPath: clip,
        background: `linear-gradient(180deg, ${th.top}, ${th.bot})`,
        boxShadow: `inset 0 0 0 ${th.lw}px ${th.line}, 0 1px 2px rgba(40,30,20,${0.05 * th.sh}), 0 10px 28px rgba(40,30,20,${0.08 * th.sh})`,
      }}
    >
      {th.stone > 0.003 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: th.stone,
            backgroundImage: `${STONE_TEX}, ${STONE_BLOT}, radial-gradient(120% 90% at 30% 10%, rgba(255,250,240,.22), rgba(255,250,240,0) 60%)`,
            backgroundSize: '220px 220px, 400px 400px, 100% 100%',
            backgroundPosition: `${-x * 0.7}px ${-y * 0.7}px, ${-x}px ${-y}px, 0 0`,
            boxShadow: 'inset 0 2px 0 rgba(255,248,235,.28), inset 0 -10px 18px rgba(30,20,10,.28), inset 8px 0 14px rgba(255,248,235,.06)',
            borderRadius: r,
          }}
        />
      )}
      {it.src && th.photo > 0.003 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: w,
            height: imgH,
            opacity: th.photo,
            backgroundImage: `url(${staticFile(`02-masonry/photos/${it.src}.jpg`)})`,
            backgroundSize: 'cover',
            backgroundPosition: it.pos,
            filter: th.gray > 0.01 ? `grayscale(${th.gray})` : undefined,
            borderRadius: th.meta > 0.01 ? `${r}px ${r}px 0 0` : undefined,
          }}
        />
      )}
      {it.text && th.text > 0.003 && (
        <div style={{position: 'absolute', left: 0, top: 0, width: w, height: imgH, overflow: 'hidden', opacity: th.text, background: TEXT_BG[it.text], filter: th.gray > 0.01 ? `grayscale(${th.gray})` : undefined}}>
          <div style={{position: 'absolute', left: 0, top: 0, transform: `scale(${s})`, transformOrigin: '0 0'}}>
            <TextArt it={it} />
          </div>
        </div>
      )}
      {th.meta > 0.003 && <Meta it={it} o={th.meta} />}
      {th.num > 0.003 && (
        <div style={{position: 'absolute', left: 16, top: 14, opacity: th.num, ...mono(22, 500), color: C.t1}}>{String(i + 1).padStart(2, '0')}</div>
      )}
      {th.ratio > 0.003 && (
        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: th.ratio * tween(f, RULES_AT[3], 14) * (1 - skel)}}>
          <div style={{...mono(24, 500), color: 'rgba(244,242,238,.82)'}}>{it.label}</div>
          <div style={{...mono(14, 400), color: 'rgba(244,242,238,.34)', marginTop: 10}}>{String(i + 1).padStart(2, '0')}</div>
        </div>
      )}
      {skel > 0.003 && (
        <div style={{position: 'absolute', inset: 0, opacity: skel, background: `linear-gradient(105deg, rgba(255,255,255,0) ${shimmer}px, rgba(255,255,255,.09) ${shimmer + 90}px, rgba(255,255,255,0) ${shimmer + 180}px), #222326`}}>
          <div style={{position: 'absolute', left: 16, bottom: 16, width: w * 0.42, height: 10, borderRadius: 5, background: 'rgba(255,255,255,.07)'}} />
        </div>
      )}
    </div>
  );
};

/** 算法一章是否在场（给外部判断用） */
export const inAlg = (f: number) => f >= SCENE.ALG.in - 20 && f < SCENE.ALG.out + 20;
