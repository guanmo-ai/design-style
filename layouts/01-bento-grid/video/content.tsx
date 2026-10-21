/** 布局 01 · Bento Grid —— 每个场景里，七张卡片各自装的“一样菜” */
import React from 'react';
import {interpolate, interpolateColors, staticFile, Img} from 'remotion';
import {E, POP, spr, tween} from '../../../src/lib/anim';
import {ACCENT, C} from '../tokens';
import {BEAT, RULES_AT, SCENE} from './layout';
import {count, disp, gradText, mono, sc, Show, vis} from './ui';

type P = {f: number};
const cap = (color = C.t2): React.CSSProperties => ({left: 40, top: 36, ...sc(26, 500), color});
const BL = {left: 40, bottom: 34};

/* ---------------- 01 发布会：深色 · 一格一个卖点 ---------------- */
const KO = SCENE.KEY.out;
export const KeyContent: React.FC<P & {i: number}> = ({f, i}) => {
  const at = SCENE.KEY.in + [0, 0, 8, 4, 12, 16, 10][i];
  switch (i) {
    case 0:
      return (
        <>
          <Show f={f} at={12} out={KO} style={{left: 48, top: 44}}>
            <span style={{...disp(24, 500, 0), color: 'rgba(245,245,247,.62)'}}>Design Style</span>
            <span style={{...sc(24, 500, 0.04), color: C.t1, marginLeft: 12}}>布局</span>
            <span style={{...disp(24, 600, 0), color: C.t1, marginLeft: 6}}>01</span>
          </Show>
          <Show f={f} at={18} out={KO} dy={34} style={{left: 44, bottom: 46}}>
            <div style={{...disp(172, 600, -0.045), lineHeight: 0.86, marginLeft: -8, color: C.t1}}>Bento<br />Grid</div>
            <div style={{...sc(54, 700, 0.06), marginTop: 30, color: 'rgba(245,245,247,.92)'}}>便当盒布局</div>
          </Show>
        </>
      );
    case 1: {
      const d = interpolate(tween(f, at + 4, 40, 0, 1, E.out), [0, 1], [289, 58]);
      return (
        <>
          <Show f={f} at={at} out={KO} style={cap()}>续航</Show>
          <Show f={f} at={at} out={KO} dy={0} style={{right: 36, top: 34}}>
            <svg width={128} height={128} viewBox="0 0 112 112">
              <defs>
                <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor={C.orange} /><stop offset=".5" stopColor={C.pink} /><stop offset="1" stopColor={C.violet} />
                </linearGradient>
              </defs>
              <circle cx={56} cy={56} r={46} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={12} />
              <circle cx={56} cy={56} r={46} fill="none" stroke="url(#ring)" strokeWidth={12} strokeLinecap="round" strokeDasharray={289} strokeDashoffset={d} transform="rotate(-90 56 56)" />
            </svg>
          </Show>
          <Show f={f} at={at} out={KO} style={BL}>
            <span style={{...disp(132, 600, -0.05), lineHeight: 0.8, color: C.t1}}>{count(f, at, 40, 22)}</span>
            <span style={{...sc(34, 500), color: C.t1, marginLeft: 10}}>小时</span>
          </Show>
        </>
      );
    }
    case 2: {
      const dots = [
        'radial-gradient(circle at 32% 26%,#D3E4F2 0%,#7FA0BF 38%,#3F5B78 78%,#22344A 100%)',
        'radial-gradient(circle at 32% 26%,#75757C 0%,#2E2E33 40%,#151517 78%,#050506 100%)',
        'radial-gradient(circle at 32% 26%,#FFFFFF 0%,#E4E5EA 36%,#ABADB4 78%,#7E8088 100%)',
        'radial-gradient(circle at 32% 26%,#FFD3A6 0%,#F68A3C 38%,#C2500F 78%,#7A2C04 100%)',
      ];
      const o = 1 - tween(f, KO, 8);
      return (
        <>
          <Show f={f} at={at} out={KO} style={cap()}>配色</Show>
          <div style={{position: 'absolute', left: 0, right: 0, top: 120, display: 'grid', gridTemplateColumns: 'repeat(2,140px)', gap: '36px 40px', justifyContent: 'center', opacity: o}}>
            {dots.map((bg, k) => {
              const s = spr(f, at + 2 + k * 4, POP, 40);
              return <div key={k} style={{width: 140, height: 140, borderRadius: 70, background: bg, transform: `scale(${s})`, boxShadow: 'inset 0 2px 1px rgba(255,255,255,.35), inset 0 -10px 22px rgba(0,0,0,.35), 0 24px 40px rgba(0,0,0,.55)'}} />;
            })}
          </div>
          <Show f={f} at={at + 12} out={KO} style={BL}>
            <span style={{...disp(132, 600, -0.05), lineHeight: 0.8, color: C.t1}}>4</span>
            <span style={{...sc(34, 500), color: C.t1, marginLeft: 12}}>种</span>
          </Show>
        </>
      );
    }
    case 3:
      return (
        <>
          <Show f={f} at={at} out={KO} style={cap()}>图形性能</Show>
          <Show f={f} at={at + 4} out={KO} dy={30} style={BL}>
            <div style={{...disp(200, 600, -0.05), lineHeight: 0.74, marginLeft: -8, ...gradText}}>2×</div>
          </Show>
        </>
      );
    case 4:
      return (
        <>
          <Show f={f} at={at} out={KO} style={{left: 48, top: 58}}>
            <div style={{...sc(64, 900, 0.02), color: C.t1}}>苹果发布会最爱的排版。</div>
          </Show>
          <Show f={f} at={at + 6} out={KO} style={{left: 48, bottom: 52}}>
            <span style={{...sc(26, 400, 0.03), color: C.t2}}>大格放主角，小格放数据——这就是 </span>
            <span style={{...disp(26, 500, 0), color: C.t1}}>Bento Grid</span>
            <span style={{...sc(26, 400), color: C.t2}}>。</span>
          </Show>
        </>
      );
    case 5: {
      const k = spr(f, at + 10, {damping: 16, mass: 0.6, stiffness: 200}, 30);
      const o = vis(f, at, KO);
      return (
        <>
          <Show f={f} at={at} out={KO} style={cap()}>主动降噪</Show>
          <Show f={f} at={at + 12} out={KO} style={BL}><div style={{...sc(40, 700), color: C.t1}}>已开启</div></Show>
          <div style={{position: 'absolute', right: 40, bottom: 40, width: 150, height: 88, borderRadius: 44, background: 'rgba(255,255,255,.14)', opacity: o, overflow: 'hidden'}}>
            <div style={{position: 'absolute', inset: 0, background: ACCENT, opacity: k}} />
            <div style={{position: 'absolute', top: 8, left: 8 + 62 * k, width: 72, height: 72, borderRadius: 36, background: '#fff', boxShadow: '0 4px 10px rgba(0,0,0,.25)'}} />
          </div>
        </>
      );
    }
    case 6:
      return (
        <>
          <Show f={f} at={at} out={KO} style={cap()}>起售价</Show>
          <Show f={f} at={at} out={KO} style={BL}>
            <span style={{...disp(56, 500, 0), color: C.t1, marginRight: 4, verticalAlign: 4}}>¥</span>
            <span style={{...disp(96, 600, -0.05), color: C.t1}}>{count(f, at, 44, 5999)}</span>
          </Show>
        </>
      );
  }
  return null;
};

/* ---------------- 05 规则：线框 + 尺寸标签 ---------------- */
const WO = SCENE.WIRE.out;
const SIZES: [string, string][] = [['2×2', '主角'], ['1×1', '续航'], ['1×2', '配色'], ['1×1', '性能'], ['2×1', '一句话'], ['1×1', '降噪'], ['1×1', '价格']];
export const WireContent: React.FC<P & {i: number}> = ({f, i}) => {
  const at = RULES_AT[0] + [0, 2, 6, 4, 8, 10, 12][i];
  const grow = i === 0 ? tween(f, RULES_AT[1], 24, 0, 1, E.out) : 0;
  return (
    <Show f={f} at={at} out={WO} dy={12} style={{inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{...mono(36 + 36 * grow), color: C.t1, letterSpacing: '-0.01em'}}>{SIZES[i][0]}</div>
      <div style={{...sc(22 + 6 * grow, 400 + 100 * grow, 0.06), marginTop: 14 + 6 * grow, color: interpolateColors(grow, [0, 1], [C.t2, C.t1])}}>{SIZES[i][1]}</div>
    </Show>
  );
};

/* ---------------- 06 个人主页：浅色 · 一张卡片只放一样东西 ----------------
 * 苹果式的浅色便当：白卡片、几乎没有阴影；每张卡片同一套排版——左上角灰色小标题、一个大主角、最多一行说明。
 * 颜色只有三种来源：墨黑（X、正在播放）、海报自己的米色、品牌渐变（贡献格子、“每天一个设计风格”、播放进度）。 */
const HO = SCENE.HOME.out;
const HOME_ORDER = [3, 1, 2, 4, 0, 6, 5];
const HI = '#1D1D1F';
const H2 = '#86868B';
const HC = 30; // 贡献格子的列数
let contrib: number[] | null = null;
const contribLevels = () => {
  if (contrib) return contrib;
  let seed = 7;
  const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const out: number[] = [];
  for (let c = 0; c < HC; c++)
    for (let d = 0; d < 7; d++) {
      const v = r() * (0.3 + (c / HC) * 0.95);
      let L = v > 0.92 ? 4 : v > 0.72 ? 3 : v > 0.52 ? 2 : v > 0.36 ? 1 : 0;
      if (c >= HC - 2) L = c === HC - 1 && d > 4 ? -1 : r() > 0.4 ? 4 : 3; // 最近两周：每天都在更新（-1 = 还没到的日子）
      out.push(L);
    }
  return (contrib = out);
};
/** 品牌渐变上的某一点（0 = 橙，1 = 紫） */
const accentAt = (t: number) => interpolateColors(t, [0, 0.48, 1], [C.orange, C.pink, C.violet]);
const LV_A = [0, 0.28, 0.5, 0.75, 1];
const hcap = (color = H2): React.CSSProperties => ({left: 32, top: 30, ...sc(20, 500, 0.04), color});
const HBL = {left: 32, bottom: 30};
const hero = (size = 150): React.CSSProperties => ({...disp(size, 600, -0.055), lineHeight: 0.76});
const GITHUB = 'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z';
const XLOGO = 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z';
const wave = (() => {
  let seed = 11;
  const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({length: 46}, (_, k) => 0.3 + 0.7 * Math.abs(Math.sin(k * 0.55)) * (0.55 + 0.45 * r()));
})();
const tc = (s: number) => `0:${String(Math.floor(s)).padStart(2, '0')}`;
const Arrow: React.FC<{color: string; size?: number}> = ({color, size = 16}) => (
  <svg width={size} height={size} viewBox="0 0 16 16"><path d="M4 12 L12 4 M5.5 4 H12 V10.5" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export const HomeContent: React.FC<P & {i: number}> = ({f, i}) => {
  const at = SCENE.HOME.in + HOME_ORDER[i] * 3;
  switch (i) {
    case 4: {
      // GitHub：仓库名 + 贡献格子。格子按列从左往右亮起，颜色沿品牌渐变走，越近越满
      const lv = contribLevels();
      const o = 1 - tween(f, HO, 8);
      const pulse = 0.5 + 0.5 * Math.cos(((f - at) / BEAT) * Math.PI * 2);
      return (
        <>
          <Show f={f} at={at} out={HO} style={{left: 32, top: 28, display: 'flex', alignItems: 'center'}}>
            <svg width={30} height={30} viewBox="0 0 16 16"><path d={GITHUB} fill={HI} /></svg>
            <span style={{...disp(24, 600, -0.005), color: HI, marginLeft: 14}}>guanmo-ai/design-style</span>
          </Show>
          <Show f={f} at={at + 4} out={HO} style={{right: 32, top: 34, display: 'flex', alignItems: 'center'}}>
            <i style={{position: 'relative', width: 8, height: 8, borderRadius: 4, background: C.pink, marginRight: 10, boxShadow: `0 0 0 ${2 + 4 * pulse}px rgba(255,45,111,${0.22 * (1 - pulse)})`}} />
            <span style={{...sc(20, 500, 0.04), color: HI}}>每天更新</span>
          </Show>
          <div style={{position: 'absolute', left: 32, right: 32, bottom: 32, display: 'grid', gridTemplateColumns: `repeat(${HC},1fr)`, gridTemplateRows: 'repeat(7,16px)', gridAutoFlow: 'column', gap: 4, opacity: o}}>
            {lv.map((L, k) => {
              const c = Math.floor(k / 7);
              const s = tween(f, at + 6 + c * 0.9, 12, 0, 1, E.out);
              if (L < 0) return <i key={k} />;
              const bg = L === 0 ? '#EFEFF2' : accentAt(c / (HC - 1));
              return (
                <i key={k} style={{borderRadius: 4, background: '#EFEFF2', opacity: s, transform: `scale(${0.4 + 0.6 * s})`, position: 'relative', overflow: 'hidden'}}>
                  {L > 0 && <i style={{position: 'absolute', inset: 0, background: bg, opacity: LV_A[L]}} />}
                </i>
              );
            })}
          </div>
        </>
      );
    }
    case 1:
      return (
        <>
          <Show f={f} at={at} out={HO} style={{left: 32, top: 32}}>
            <svg width={40} height={40} viewBox="0 0 24 24"><path d={XLOGO} fill="#fff" /></svg>
          </Show>
          <Show f={f} at={at + 6} out={HO} style={{right: 28, top: 30}}>
            <div style={{background: '#fff', color: HI, ...sc(20, 500, 0.04), padding: '11px 20px', borderRadius: 999}}>关注</div>
          </Show>
          <Show f={f} at={at + 2} out={HO} style={HBL}>
            <div style={{...disp(30, 600, -0.01), color: '#fff'}}>@guanmo_ai</div>
          </Show>
        </>
      );
    case 2:
      // 已发布：一个大数字，下面一行说明是哪两期
      return (
        <>
          <Show f={f} at={at} out={HO} style={hcap()}>已发布</Show>
          <Show f={f} at={at} out={HO} dy={24} style={{left: 26, bottom: 76, display: 'flex', alignItems: 'baseline'}}>
            <span style={{...hero(), color: HI}}>{count(f, at, 30, 2)}</span>
            <span style={{...sc(28, 500), color: HI, marginLeft: 10}}>期</span>
          </Show>
          <Show f={f} at={at + 4} out={HO} style={HBL}>
            <span style={{...sc(20, 500, 0.04), color: H2}}>风格 001 · 布局 01</span>
          </Show>
        </>
      );
    case 0: {
      // 海报按宽度放满，底边贴着卡片底；上面多出来的一截用海报自己的米色接上，看起来就是一整张
      const o = vis(f, at, HO);
      const z = 1.05 - 0.05 * tween(f, at, 66, 0, 1, E.out);
      const ph = Math.round((958 * 602) / 1160);
      return (
        <>
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: ph, opacity: o, transform: `scale(${z})`, transformOrigin: '50% 100%'}}>
            <Img src={staticFile('01-bento-grid/poster-001.png')} style={{width: '100%', height: '100%', display: 'block'}} />
          </div>
          <Show f={f} at={at + 6} out={HO} style={{left: 24, top: 22}}>
            <div style={{display: 'flex', alignItems: 'center', ...sc(20, 500, 0.04), color: HI, background: 'rgba(255,255,255,.72)', padding: '11px 18px', borderRadius: 999, boxShadow: '0 0 0 1px rgba(0,0,0,.04)'}}>
              <span style={{...disp(20, 600, 0)}}>风格 001</span>
              <span style={{width: 3, height: 3, borderRadius: 2, background: H2, margin: '0 10px'}} />
              <span>包豪斯</span>
            </div>
          </Show>
          <Show f={f} at={at + 8} out={HO} style={{right: 24, top: 22}}>
            <div style={{width: 44, height: 44, borderRadius: 22, background: HI, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Arrow color="#fff" />
            </div>
          </Show>
        </>
      );
    }
    case 3: {
      const s = spr(f, at + 6, POP, 30);
      return (
        <>
          <Show f={f} at={at} out={HO} style={hcap()}>每期短片</Show>
          <div style={{position: 'absolute', right: 26, top: 22, width: 44, height: 44, borderRadius: 22, background: '#F2F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: Math.min(1, s * 1.5) * (1 - tween(f, HO, 8)), transform: `scale(${0.7 + 0.3 * s})`}}>
            <svg width={16} height={16} viewBox="0 0 16 16"><path d="M5 3.2 L12.6 8 L5 12.8 Z" fill={HI} /></svg>
          </div>
          <Show f={f} at={at} out={HO} dy={24} style={{left: 26, bottom: 76, display: 'flex', alignItems: 'baseline'}}>
            <span style={{...hero(), color: HI}}>{count(f, at, 36, 15)}</span>
            <span style={{...sc(28, 500), color: HI, marginLeft: 10}}>秒</span>
          </Show>
          <Show f={f} at={at + 4} out={HO} style={HBL}>
            <span style={{...sc(20, 500, 0.04), color: H2}}>60 帧 · 原创配乐</span>
          </Show>
        </>
      );
    }
    case 6: {
      // 品牌渐变卡片：渐变上面再飘两团光，像一块会呼吸的玻璃
      const a = (f - SCENE.HOME.in) / 60;
      const o = vis(f, at - 6, HO);
      return (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: o,
              background: [
                `radial-gradient(60% 55% at ${24 + 10 * Math.sin(a * 1.7)}% ${18 + 8 * Math.cos(a * 1.3)}%, rgba(255,255,255,.34), rgba(255,255,255,0) 70%)`,
                `radial-gradient(70% 70% at ${86 - 8 * Math.cos(a * 1.4)}% ${92 - 6 * Math.sin(a)}%, rgba(110,40,255,.55), rgba(110,40,255,0) 70%)`,
              ].join(','),
            }}
          />
          <Show f={f} at={at} out={HO} style={{left: 32, top: 30}}>
            <span style={{...disp(20, 600, -0.005), color: 'rgba(255,255,255,.88)'}}>Design Style</span>
          </Show>
          <Show f={f} at={at + 2} out={HO} dy={22} style={HBL}>
            <div style={{...sc(40, 700, 0.04), lineHeight: 1.24, color: '#fff'}}>每天一个<br />设计风格</div>
          </Show>
        </>
      );
    }
    case 5: {
      // 正在播放：就是这支短片自己的配乐，进度条和时间跟着真实帧数走
      const sec = f / 60;
      const prog = f / 900;
      const beat = Math.exp(-((f % BEAT) / BEAT) * 3.2);
      const o = vis(f, at + 6, HO);
      return (
        <>
          <Show f={f} at={at} out={HO} dy={12} style={{left: 32, top: 32}}>
            <div style={{width: 216, height: 216, borderRadius: 18, background: 'linear-gradient(180deg, #2C2C2E, #1C1C1E)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.06)', position: 'relative', overflow: 'hidden'}}>
              {/* 封面：一个便当盒布局的小图标 */}
              {[
                [28, 28, 98, 98, 1],
                [134, 28, 54, 45, 0],
                [134, 81, 54, 45, 0],
                [28, 134, 45, 54, 0],
                [81, 134, 45, 54, 0],
                [134, 134, 54, 54, 0],
              ].map(([x, y, w, h, a], k) => (
                <div key={k} style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 10, background: a ? ACCENT : 'rgba(255,255,255,.14)'}} />
              ))}
            </div>
          </Show>
          <Show f={f} at={at + 3} out={HO} style={{left: 280, top: 34}}>
            <div style={{...sc(20, 500, 0.04), color: '#8E8E93'}}>正在播放</div>
            <div style={{...disp(40, 600, -0.02), color: '#F5F5F7', marginTop: 16}}>Bento Grid</div>
            <div style={{...sc(20, 400, 0.04), color: '#8E8E93', marginTop: 12}}>布局 01 配乐 · 150 BPM</div>
          </Show>
          <div style={{position: 'absolute', left: 280, right: 32, top: 170, height: 44, display: 'flex', alignItems: 'center', gap: 3, opacity: o}}>
            {wave.map((v, k) => {
              const t = k / wave.length;
              const played = t < prog;
              const h = 6 + 38 * v * (played ? 0.62 + 0.38 * beat : 0.5);
              return <i key={k} style={{flex: 1, height: h, borderRadius: 2, background: played ? accentAt(t / Math.max(prog, 0.01)) : 'rgba(255,255,255,.16)'}} />;
            })}
          </div>
          <div style={{position: 'absolute', left: 280, right: 32, top: 230, display: 'flex', justifyContent: 'space-between', opacity: o, ...mono(17, 400), color: '#8E8E93'}}>
            <span>{tc(sec)}</span>
            <span>0:15</span>
          </div>
        </>
      );
    }
  }
  return null;
};

/* ---------------- 07 产品后台：深色 · Linear 式 ---------------- */
const DO = SCENE.DASH.out;
const DASH_ORDER = [0, 1, 2, 3, 5, 6, 4];
const dt1 = '#F7F8F8';
const dt2 = '#8A8F98';
const dcap = (): React.CSSProperties => ({left: 40, top: 36, ...sc(24, 500), color: dt2});

// 收入曲线：30 个点，整体上扬
const REV = Array.from({length: 31}, (_, k) => 0.22 + 0.55 * (k / 30) ** 1.4 + 0.07 * Math.sin(k * 1.3) + 0.04 * Math.sin(k * 3.1 + 1));
const revPath = (w: number, h: number, close: boolean) => {
  const pts = REV.map((v, k) => [(k / 30) * w, h - v * h] as const);
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let k = 1; k < pts.length; k++) {
    const [x0, y0] = pts[k - 1];
    const [x1, y1] = pts[k];
    const mx = (x0 + x1) / 2;
    d += ` C ${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`;
  }
  return close ? `${d} L ${w} ${h} L 0 ${h} Z` : d;
};

export const DashContent: React.FC<P & {i: number}> = ({f, i}) => {
  const at = SCENE.DASH.in + DASH_ORDER[i] * 3;
  const stat = (label: string, value: React.ReactNode) => (
    <>
      <Show f={f} at={at} out={DO} style={dcap()}>{label}</Show>
      <Show f={f} at={at} out={DO} dy={20} style={BL}>{value}</Show>
    </>
  );
  const big = (s: string, unit?: string) => (
    <>
      <span style={{...disp(88, 600, -0.045), color: dt1}}>{s}</span>
      {unit && <span style={{...sc(28, 500), color: dt2, marginLeft: 10}}>{unit}</span>}
    </>
  );
  switch (i) {
    case 0: {
      const W = 854;
      const H = 270;
      const reveal = tween(f, at + 6, 54, 0, 1, E.inOut);
      const o = 1 - tween(f, DO, 8);
      const last = REV[30];
      return (
        <>
          <Show f={f} at={at} out={DO} style={dcap()}>收入 · 本月</Show>
          <Show f={f} at={at} out={DO} dy={20} style={{left: 40, top: 92}}>
            <span style={{...disp(56, 500, 0), color: dt1, marginRight: 6, verticalAlign: 6}}>¥</span>
            <span style={{...disp(112, 600, -0.05), color: dt1}}>{count(f, at, 50, 1284300)}</span>
          </Show>
          <Show f={f} at={at + 10} out={DO} style={{right: 40, top: 32}}>
            <div style={{...disp(24, 600, 0), color: C.green, background: 'rgba(76,195,138,.12)', padding: '10px 16px', borderRadius: 999}}>+12.4%</div>
          </Show>
          <svg width={W} height={H} style={{position: 'absolute', left: 0, bottom: 0, opacity: o}}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={C.indigo} stopOpacity={0.38} />
                <stop offset="1" stopColor={C.indigo} stopOpacity={0} />
              </linearGradient>
              <clipPath id="revClip"><rect x={0} y={0} width={W * reveal} height={H} /></clipPath>
            </defs>
            <g clipPath="url(#revClip)">
              <path d={revPath(W, H - 20, true)} transform="translate(0 20)" fill="url(#rev)" />
              <path d={revPath(W, H - 20, false)} transform="translate(0 20)" fill="none" stroke="#9AA0FF" strokeWidth={3} />
            </g>
            {reveal > 0.98 && (
              <g transform={`translate(${W - 3} ${20 + (H - 20) - last * (H - 20)})`} opacity={tween(f, at + 58, 10)}>
                <circle r={16} fill={C.indigo} opacity={0.25} />
                <circle r={7} fill="#fff" />
              </g>
            )}
          </svg>
        </>
      );
    }
    case 1:
      return stat('活跃用户', big(count(f, at, 40, 8214)));
    case 2:
      return stat('转化率', big(`${count(f, at, 40, 3.8, 1)}%`));
    case 3:
      return stat('可用性', big('99.98%'));
    case 6:
      return stat('新订单', big(count(f, at, 40, 326), '今日'));
    case 4: {
      const segs: [string, number, string][] = [['搜索', 42, C.indigo], ['社交', 28, '#B18CFF'], ['直接', 18, '#4B5068'], ['邮件', 12, '#2C2F3A']];
      const g = tween(f, at + 4, 40, 0, 1, E.out);
      const o = 1 - tween(f, DO, 8);
      let acc = 0;
      return (
        <>
          <Show f={f} at={at} out={DO} style={dcap()}>流量来源</Show>
          <div style={{position: 'absolute', left: 40, right: 40, top: 96, height: 14, opacity: o, display: 'flex', gap: 4}}>
            {segs.map(([n, v, c]) => <div key={n} style={{width: `${v * g}%`, background: c, borderRadius: 7}} />)}
          </div>
          <div style={{position: 'absolute', left: 40, right: 40, bottom: 34, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)'}}>
            {segs.map(([n, v, c], k) => {
              acc += 1;
              return (
                <Show key={n} f={f} at={at + 6 + k * 3} out={DO} style={{position: 'relative'}}>
                  <div style={{...disp(52, 600, -0.04), color: dt1}}>{v}%</div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 12}}>
                    <i style={{width: 10, height: 10, borderRadius: 5, background: c === '#2C2F3A' ? '#5A5F73' : c}} />
                    <span style={{...sc(22, 400), color: dt2}}>{n}</span>
                  </div>
                </Show>
              );
            })}
          </div>
        </>
      );
    }
    case 5: {
      const bars = [0.42, 0.55, 0.48, 0.66, 0.6, 0.78, 1];
      const o = 1 - tween(f, DO, 8);
      return (
        <>
          <Show f={f} at={at} out={DO} style={dcap()}>本周订单</Show>
          <Show f={f} at={at} out={DO} dy={20} style={BL}>{big(count(f, at, 40, 2148))}</Show>
          <div style={{position: 'absolute', right: 40, bottom: 36, width: 360, height: 150, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', opacity: o}}>
            {bars.map((b, k) => {
              const s = tween(f, at + 6 + k * 3, 30, 0, 1, E.out);
              return <div key={k} style={{width: 36, height: 150 * b * s, borderRadius: 8, background: k === 6 ? `linear-gradient(180deg, #A9AEFF, ${C.indigo})` : 'rgba(255,255,255,.1)'}} />;
            })}
          </div>
        </>
      );
    }
  }
  return null;
};
