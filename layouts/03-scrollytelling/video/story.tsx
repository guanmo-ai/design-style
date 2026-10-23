/**
 * 03 · 2012 Snow Fall（覆盖式）· 04 · 2014—2018（并排式）· 05 · 苹果产品页（逐帧）
 */
import React from 'react';
import {FONT} from '../tokens';
import {Phone3D} from './Phone3D';
import {APPLE_RANGE, DATA_AT, SNOW_AT, TRIGGER, VH, W, c01, lerp, lin, sec, smooth, span, stickyY} from './page';
import {Abs, DIM, Eyebrow, GRAY, Glow, Grad, gradAt, Hairline, Scrub, Section, Stage, WHITE, mix} from './ui';

type P = {s: number; f: number; m: number};

/* 确定性随机数 */
const rng = (seed: number) => {
  let x = seed;
  return () => ((x = (x * 16807) % 2147483647) / 2147483647);
};

/* ───────────── 03 · Snow Fall ───────────── */
const C3 = sec('C');
/** 一条山脊：分形折线 */
const ridge = (seed: number, base: number, amp: number, rough: number, w = 2400) => {
  const r = rng(seed);
  let pts = [
    [0, base + (r() - 0.5) * amp],
    [w, base + (r() - 0.5) * amp],
  ];
  let a = amp;
  for (let it = 0; it < 7; it++) {
    const np: number[][] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      np.push([x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2 + (r() - 0.5) * a]);
    }
    np.push(pts[pts.length - 1]);
    pts = np;
    a *= rough;
  }
  return `M0,1400 ` + pts.map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`).join(' ') + ` L${w},1400 Z`;
};
const RIDGES = [
  {d: ridge(11, 520, 520, 0.6), top: '#aab6d6', mid: '#56689a', bot: '#26365f', par: 0.04, o: 0.55},
  {d: ridge(5, 640, 520, 0.62), top: '#e9eef8', mid: '#6d80ab', bot: '#1d2c52', par: 0.09, o: 0.95},
  {d: ridge(23, 780, 420, 0.6), top: '#f4f7fc', mid: '#5a6e9a', bot: '#111e3c', par: 0.16, o: 1},
  {d: ridge(41, 930, 300, 0.58), top: '#6f82aa', mid: '#1b2a4c', bot: '#070d1d', par: 0.27, o: 1},
];
const SNOW = (() => {
  const r = rng(77);
  return Array.from({length: 150}, (_, i) => {
    const z = i < 20 ? 3 : i < 70 ? 2 : 1; // 3 = 近处大颗虚焦
    return {x: r() * 2200 - 140, y: r() * 1300, z, sp: 0.6 + r() * 0.8, ph: r() * 6.28, r: z === 3 ? 18 + r() * 26 : z === 2 ? 3 + r() * 3 : 1.4 + r() * 1.6};
  });
})();

const SnowScene: React.FC<{s: number; f: number}> = ({s, f}) => {
  const local = s - C3.top; // 0 → 1620：滚过这一章
  return (
    <>
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #02060f 0%, #0a1830 34%, #1e3a66 55%, #6f86b0 70%, #d3b4c4 80%, #2a3c62 100%)'}} />
      <Glow x={1240} y={620} r={520} sx={1.8} color="rgba(255,214,226,0.32)" />
      <svg width={W} height={VH} viewBox={`0 0 ${W} ${VH}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          {RIDGES.map((r, i) => (
            <linearGradient key={i} id={`rg${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={r.top} />
              <stop offset="0.16" stopColor={r.mid} />
              <stop offset="0.45" stopColor={r.bot} />
              <stop offset="1" stopColor="#03060f" />
            </linearGradient>
          ))}
          <linearGradient id="fog" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b9c8e0" stopOpacity="0" />
            <stop offset="0.5" stopColor="#b9c8e0" stopOpacity="0.16" />
            <stop offset="1" stopColor="#b9c8e0" stopOpacity="0" />
          </linearGradient>
        </defs>
        {RIDGES.map((r, i) => (
          <g key={i} transform={`translate(${-240 - local * r.par * 0.3}, ${-local * r.par}) scale(1, 1)`} opacity={r.o}>
            <path d={r.d} fill={`url(#rg${i})`} />
            {i < 3 && <rect x={0} y={620 + i * 120} width={2600} height={160} fill="url(#fog)" opacity={0.7 - i * 0.15} />}
          </g>
        ))}
      </svg>
      {/* 雪：三层景深，近处的虚焦成光斑 */}
      {SNOW.map((p, i) => {
        const fall = ((p.y + f * p.sp * p.z * 1.4 - local * 0.25 * p.z) % 1300 + 1300) % 1300 - 110;
        const x = p.x + Math.sin(f * 0.03 + p.ph) * 18 * p.z;
        const o = p.z === 3 ? 0.16 : p.z === 2 ? 0.75 : 0.5;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - p.r,
              top: fall - p.r,
              width: p.r * 2,
              height: p.r * 2,
              borderRadius: '50%',
              opacity: o,
              background: p.z === 3 ? 'radial-gradient(closest-side, rgba(255,255,255,0.9), rgba(255,255,255,0.3) 60%, rgba(255,255,255,0))' : 'radial-gradient(closest-side, #fff 40%, rgba(255,255,255,0))',
            }}
          />
        );
      })}
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.5) 100%)'}} />
    </>
  );
};

const SnowCard: React.FC<{y: number; s: number; k: string; t: string; b: string}> = ({y, s, k, t, b}) => {
  const near = 1 - c01(Math.abs(y - (s + TRIGGER)) / 520);
  return (
    <Abs
      x={150}
      y={y - 150}
      w={780}
      style={{
        boxSizing: 'border-box',
        padding: '44px 52px 48px',
        borderRadius: 34,
        background: 'rgba(12,22,44,0.42)',
        backdropFilter: 'blur(28px) saturate(1.4)',
        border: '1px solid rgba(255,255,255,0.22)',
        boxShadow: '0 40px 120px rgba(0,0,0,0.35)',
        opacity: 0.55 + 0.45 * near,
      }}
    >
      <div style={{fontFamily: FONT.text, fontWeight: 600, fontSize: 22, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.7)'}}>{k}</div>
      <div style={{fontFamily: FONT.sc, fontWeight: 700, fontSize: 54, color: '#fff', marginTop: 18, lineHeight: 1.2}}>{t}</div>
      <div style={{fontFamily: FONT.sc, fontWeight: 500, fontSize: 28, color: 'rgba(255,255,255,0.72)', marginTop: 16, lineHeight: 1.5}}>{b}</div>
    </Abs>
  );
};

export const SecC: React.FC<P> = ({s, f}) => {
  const local = s - C3.top;
  const titleO = 1 - span(local, 120, 700);
  const tIn = c01((f - 330) / 24);
  return (
    <Section sec={C3}>
      <Stage sec={C3} s={s}>
        <SnowScene s={s} f={f} />
        <Abs x={0} y={250 - local * 0.35} w={W} style={{textAlign: 'center', opacity: titleO * tIn, color: '#fff'}}>
          <div style={{fontFamily: FONT.text, fontWeight: 600, fontSize: 24, letterSpacing: '0.42em', opacity: 0.8}}>THE NEW YORK TIMES · 2012</div>
          <div style={{fontFamily: FONT.serif, fontSize: 300, lineHeight: 1, marginTop: 20, letterSpacing: '-0.02em', textShadow: '0 10px 80px rgba(10,20,50,0.5)'}}>Snow Fall</div>
          <div style={{fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 54, marginTop: 6, opacity: 0.9}}>The Avalanche at Tunnel Creek</div>
        </Abs>
        <Abs x={150} y={92} style={{opacity: tIn}}>
          <Eyebrow n="03" color="rgba(255,255,255,0.75)">
            覆盖式 · 2012 Snow Fall
          </Eyebrow>
        </Abs>
      </Stage>
      <SnowCard y={SNOW_AT[0] + TRIGGER - C3.top} s={local} k="12 / 20 / 2012" t="照片、视频铺满全屏，" b="文字从上面滚过。《纽约时报》这篇长报道，让滚动本身成了讲故事的方法。" />
      <SnowCard y={SNOW_AT[1] + TRIGGER - C3.top} s={local} k="PULITZER PRIZE · 2013" t="第二年，获普利策特稿奖。" b="新闻编辑部从此多了一个动词：to snowfall。" />
    </Section>
  );
};

/* ───────────── 04 · 2014—2018（并排式）───────────── */
const D4 = sec('D');
const N_DOTS = 144;
const DOTS = (() => {
  const r = rng(9);
  return Array.from({length: N_DOTS}, (_, i) => ({sx: r(), sy: r(), j: r()}));
})();
/** 每一步的圆点布局：散点 → 网格 → 柱状 → 圆环（舞台坐标） */
const layout = (k: number, i: number) => {
  const cx = 1390;
  const cy = 540;
  const d = DOTS[i];
  if (k === 0) return {x: cx - 420 + d.sx * 840, y: cy - 360 + d.sy * 720, r: 5 + d.j * 6};
  if (k === 1) {
    const c = i % 12;
    const rr = Math.floor(i / 12);
    return {x: cx - 330 + c * 60, y: cy - 330 + rr * 60, r: 9};
  }
  if (k === 2) {
    const heights = [5, 9, 7, 13, 10, 16, 12, 19, 15, 22, 16];
    let n = i;
    let col = 0;
    while (col < heights.length - 1 && n >= heights[col]) n -= heights[col++];
    return {x: cx - 360 + col * 72, y: cy + 330 - n * 34, r: 10};
  }
  const a = (i / N_DOTS) * Math.PI * 2 - Math.PI / 2;
  const ring = i % 3;
  const R = 200 + ring * 70;
  return {x: cx + Math.cos(a + ring * 0.07) * R, y: cy + Math.sin(a + ring * 0.07) * R, r: 7 + ring * 2};
};
const DATA_STEPS = [
  {y: '2014', t: 'Mike Bostock《How To Scroll》', b: '“宁可滚动，不要点击；滚动要能倒回去。”'},
  {y: '2017', t: 'Scrollama', b: '用 IntersectionObserver 判断：哪一步过了线。'},
  {y: '2018', t: 'position: sticky', b: '舞台不再用 JS 固定，交给 CSS 钉住。'},
];

export const SecD: React.FC<P> = ({s}) => {
  const stops = [DATA_AT[0] - 540, ...DATA_AT];
  let k = 0;
  let t = 0;
  for (let i = 0; i < 3; i++) if (s >= stops[i]) [k, t] = [i, smooth(c01((s - stops[i]) / (stops[i + 1] - stops[i])))];
  if (s >= stops[3]) [k, t] = [2, 1];
  const local = s - D4.top;
  return (
    <Section sec={D4}>
      <Stage sec={D4} s={s} clip={false}>
        <Glow x={1390} y={540} r={560} color="rgba(139,61,255,0.20)" />
        <Glow x={1390} y={600} r={380} color="rgba(41,151,255,0.16)" />
        {DOTS.map((_, i) => {
          const a = layout(k, i);
          const b = layout(k + 1, i);
          // 每个点错开一点出发，形成“流”
          const ti = c01(t * 1.5 - (i / N_DOTS) * 0.5);
          const e = smooth(ti);
          const x = lerp(a.x, b.x, e);
          const y = lerp(a.y, b.y, e);
          const r = lerp(a.r, b.r, e);
          const col = gradAt(((i % 12) / 11) * 0.5 + (Math.floor(i / 12) / 11) * 0.5);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x - r * 2.2,
                top: y - r * 2.2,
                width: r * 4.4,
                height: r * 4.4,
                borderRadius: '50%',
                background: `radial-gradient(closest-side, #fff 0%, ${col} 32%, ${col.replace('rgb', 'rgba').replace(')', ',0.25)')} 52%, rgba(0,0,0,0) 100%)`,
              }}
            />
          );
        })}
        <Hairline y={TRIGGER} o={0.22} w={900} x={60} />
        <Abs x={150} y={92}>
          <Eyebrow n="04">并排式 · 2014—2018 数据新闻</Eyebrow>
        </Abs>
      </Stage>
      {DATA_STEPS.map((d, i) => {
        const y = DATA_AT[i] + TRIGGER - D4.top;
        const near = 1 - c01(Math.abs(y - (local + TRIGGER)) / 300);
        const gone = c01((local + TRIGGER - y - 160) / 220);
        return (
          <Abs key={i} x={150} y={y - 150} w={820} style={{opacity: 1 - gone}}>
            <Scrub text={d.y} y={y + D4.top - 80} s={s} size={150} font={FONT.display} gradFrom={0} range={260} style={{letterSpacing: '-0.04em'}} />
            <div style={{fontFamily: FONT.sc, fontWeight: 700, fontSize: 46, color: mix(DIM, WHITE, near), marginTop: 6}}>{d.t}</div>
            <div style={{fontFamily: FONT.sc, fontWeight: 500, fontSize: 28, color: mix('#1e1e21', GRAY, near), marginTop: 12}}>{d.b}</div>
          </Abs>
        );
      })}
    </Section>
  );
};

/* ───────────── 05 · 苹果产品页：逐帧（滚到哪，手机转到哪）───────────── */
const E5 = sec('E');
export const SecE: React.FC<P> = ({s, f}) => {
  const p = lin(s, APPLE_RANGE[0], APPLE_RANGE[1]);
  const fr = Math.round(1 + 119 * p);
  const ry = -28 + 360 * smooth(p) * 0.15 + 360 * p * 0.85;
  const st = stickyY(E5, s);
  const on1 = span(s, E5.top - 300, E5.top);
  const on2 = span(s, APPLE_RANGE[0] + 300, APPLE_RANGE[0] + 720);
  const hue = (ry % 360) / 360;
  const vis = s > E5.top - VH - 200 && s < E5.top + E5.h + 200;
  return (
    <Section sec={E5}>
      <Stage sec={E5} s={s} clip={false}>
        <div style={{position: 'absolute', left: 120, top: 170, fontFamily: FONT.sc, fontWeight: 900, fontSize: 230, letterSpacing: '-0.03em', color: mix('#141416', WHITE, on1)}}>
          滚到哪，
        </div>
        <div style={{position: 'absolute', right: 120, top: 640, fontFamily: FONT.sc, fontWeight: 900, fontSize: 230, letterSpacing: '-0.03em'}}>
          <span style={{color: mix('#141416', WHITE, on2)}}>播到哪。</span>
        </div>
        <Glow x={960} y={560} r={520} sx={0.7} color={`rgba(${hue < 0.5 ? '255,46,126' : '41,151,255'},0.28)`} />
        <Glow x={960} y={560} r={360} sx={0.6} color="rgba(255,122,47,0.16)" />
        {vis && <Phone3D w={W} h={VH} st={{x: 960, y: 560, h: 900, rx: 8 - 6 * Math.sin(p * Math.PI), ry, rz: 0, sweep: (p * 3) % 1}} />}
        <Abs x={150} y={92}>
          <Eyebrow n="05">逐帧 · 苹果产品页</Eyebrow>
        </Abs>
        <Abs x={1480} y={980} w={300} style={{textAlign: 'right'}}>
          <div style={{fontFamily: FONT.mono, fontSize: 26, color: GRAY, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.08em'}}>
            <span style={{color: WHITE}}>{String(fr).padStart(3, '0')}</span> / 120
          </div>
          <div style={{marginTop: 14, height: 2, background: '#2a2a2d', borderRadius: 1}}>
            <div style={{width: `${p * 100}%`, height: 2, background: gradAt(p), borderRadius: 1}} />
          </div>
        </Abs>
      </Stage>
      <div style={{display: 'none'}}>{st}</div>
    </Section>
  );
};
export {Grad};
