/** 03 Snow Fall（覆盖式）· 04 数据新闻（并排式）· 05 苹果产品页（逐帧）· 06 CSS 滚动驱动动画 */
import React from 'react';
import {random} from 'remotion';
import {C, FONT, gradCss} from '../tokens';
import {Device} from './Device';
import {APPLE_STEPS, DATA_STEPS, SNOW_STEPS, VH, c01, lerp, lin, sec, span} from './page';
import {At, Kicker, Mono, Section, Stage, TriggerLine, crossed, nearTrigger} from './ui';

const mod = (v: number, n: number) => ((v % n) + n) % n;

/* ───────────── 03 · 2012 Snow Fall ───────────── */
const SC = sec('C');
const ridge = (i: number) => {
  const pts: string[] = [];
  const base = [560, 650, 760, 900][i];
  const amp = [150, 170, 190, 120][i];
  for (let x = -320; x <= 2240; x += 16) {
    const u = x / 1920;
    const y =
      base -
      amp * (0.55 * Math.sin(u * (3.1 + i) + i * 1.7) + 0.3 * Math.sin(u * (7.3 + i * 2) + i) + 0.15 * Math.sin(u * 17 + i * 3)) -
      (random(`rg${i}-${x}`) - 0.5) * (10 + i * 4);
    pts.push(`${x},${y.toFixed(1)}`);
  }
  return `M-320,1200 L${pts.join(' L')} L2240,1200 Z`;
};
const RIDGES = [0, 1, 2, 3].map(ridge);
const RIDGE_COL = [
  ['#EEF2F5', '#B9C5D0'],
  ['#F4F6F8', '#94A3B2'],
  ['#FAFBFC', '#6E7D8C'],
  ['#FFFFFF', '#D9DEE3'],
];
// 雪崩路线：沿第三层山脊从山口往下
const ROUTE = 'M1215,470 C1180,540 1150,600 1090,660 S960,770 880,830';

const SnowCard: React.FC<{k: string; children: React.ReactNode; a: number}> = ({k, children, a}) => (
  <div
    style={{
      width: 600,
      boxSizing: 'border-box',
      padding: '38px 44px 42px',
      background: 'rgba(255,255,255,0.96)',
      borderRadius: 6,
      boxShadow: `0 30px 80px rgba(20,30,40,0.18), inset 0 0 0 ${1 + a}px rgba(29,29,31,${0.06 + 0.2 * a})`,
    }}
  >
    <div style={{fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 30, color: '#8A1C1C', marginBottom: 14}}>{k}</div>
    <div style={{fontFamily: FONT.sc, fontSize: 32, lineHeight: 1.62, color: C.ink}}>{children}</div>
  </div>
);

export const SecC: React.FC<{s: number; f: number}> = ({s, f}) => {
  const p = lin(s, SC.top, SC.top + SC.h - VH);
  const dolly = span(s, 4860 - 480, 4860 - 40);
  const route = span(s, 5400 - 460, 5400 - 60);
  return (
    <Section sec={SC}>
      <Stage sec={SC} s={s}>
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #C9D3DC 0%, #E7ECEF 46%, #F4F1EA 100%)'}} />
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <defs>
            {RIDGE_COL.map(([a, b], i) => (
              <linearGradient key={i} id={`rc${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={a} />
                <stop offset="0.55" stopColor={b} />
                <stop offset="1" stopColor={b} />
              </linearGradient>
            ))}
          </defs>
          {RIDGES.map((d, i) => {
            const k = 1 + (p * 0.5 + dolly * 0.5) * (0.04 + 0.13 * i);
            const ty = (p * 0.6 + dolly * 0.4) * (20 + 60 * i);
            return (
              <g key={i} transform={`translate(960 1080) scale(${k}) translate(-960 ${-1080 + ty})`}>
                <path d={d} fill={`url(#rc${i})`} />
                {i === 2 && (
                  <>
                    <path d={ROUTE} fill="none" stroke="#C8102E" strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray={`${route} 1`} opacity={route > 0 ? 0.9 : 0} />
                    <circle cx={1215} cy={470} r={10} fill="#C8102E" opacity={c01(route * 4)} />
                    <text x={1240} y={462} fontFamily="Instrument Serif" fontStyle="italic" fontSize={34} fill="#5A1010" opacity={c01(route * 3)}>
                      Tunnel Creek
                    </text>
                  </>
                )}
              </g>
            );
          })}
          {Array.from({length: 120}, (_, i) => {
            const r1 = random(`sf${i}`);
            const r2 = random(`sg${i}`);
            const r3 = random(`sh${i}`);
            const x = mod(r1 * 2000 + f * (0.6 + r3) + Math.sin(f / 40 + i) * 12, 1960) - 20;
            const y = mod(r2 * 1100 + f * (1.4 + r3 * 2.2) - s * 0.35, 1100) - 10;
            return <circle key={i} cx={x} cy={y} r={1.6 + r3 * 3.4} fill="#fff" opacity={0.55 + 0.4 * r2} />;
          })}
        </svg>
        <div style={{position: 'absolute', left: 140, top: 120, opacity: 1 - 0.25 * route}}>
          <Mono size={20} color="#5B6670" style={{letterSpacing: 3}}>
            THE NEW YORK TIMES · 2012
          </Mono>
          <div style={{fontFamily: FONT.serif, fontSize: 210, lineHeight: 1, color: C.ink, letterSpacing: -3, marginTop: 12}}>Snow Fall</div>
          <div style={{fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 60, color: '#2F3A44', marginTop: 4}}>The Avalanche at Tunnel Creek</div>
          <div style={{marginTop: 18}}>
            <Mono size={20} color="#5B6670">
              By John Branch
            </Mono>
          </div>
        </div>
        <div style={{position: 'absolute', left: 140, bottom: 96}}>
          <Kicker color="#8A1C1C" size={20}>
            覆盖式 Overlay · 图铺满，文字浮在上面滚
          </Kicker>
        </div>
      </Stage>
      <At x={1200} y={SNOW_STEPS[0] - SC.top} center>
        <SnowCard k="December 2012" a={nearTrigger(SNOW_STEPS[0], s + 60)}>
          《纽约时报》发表长篇报道《Snow Fall》。
          <br />
          文字、照片、视频和动画，跟着阅读一起出现。
        </SnowCard>
      </At>
      <At x={1200} y={SNOW_STEPS[1] - SC.top} center>
        <SnowCard k="Pulitzer Prize, 2013" a={nearTrigger(SNOW_STEPS[1], s + 60)}>
          它拿下普利策特稿奖。
          <br />
          业内从此把这种做法叫 “to snowfall”。
        </SnowCard>
      </At>
    </Section>
  );
};

/* ───────────── 04 · 数据新闻：并排式 ───────────── */
const SD = sec('D');
const DOT_N = 48;
const BARS = [18, 13, 10, 7];
const DOT_COL = ['#FF6A4D', '#2E7CF6', '#FFC531', '#22A06B'];
const catOf = (i: number) => (i < 18 ? 0 : i < 31 ? 1 : i < 41 ? 2 : 3);
const DOTS = Array.from({length: DOT_N}, (_, i) => {
  const cat = catOf(i);
  const q = i - [0, 18, 31, 41][cat];
  const g = i; // 网格里按类别顺序排
  return {
    sc: {x: 190 + random(`dx${i}`) * 820, y: 380 + random(`dy${i}`) * 480},
    gr: {x: 300 + (g % 8) * 86, y: 440 + Math.floor(g / 8) * 80},
    bar: {x: 300 + cat * 200 + ((q % 3) - 1) * 46, y: 860 - Math.floor(q / 3) * 50},
    cat,
  };
});
const mixHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((k) => parseInt(a.slice(k, k + 2), 16));
  const pb = [1, 3, 5].map((k) => parseInt(b.slice(k, k + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
};

const DataCard: React.FC<{y: string; title: string; sub: React.ReactNode; a: number; on: boolean}> = ({y, title, sub, a, on}) => (
  <div
    style={{
      width: 600,
      boxSizing: 'border-box',
      padding: '34px 40px 38px',
      borderRadius: 26,
      background: '#FFFFFF',
      boxShadow: `0 20px 50px rgba(60,40,20,0.08), inset 0 0 0 ${1 + 1.5 * a}px rgba(41,151,255,${0.12 + 0.8 * a})`,
      opacity: 0.45 + 0.55 * Math.max(a, on ? 0.4 : 0),
    }}
  >
    <Mono size={22} color={C.accent}>
      {y}
    </Mono>
    <div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: 42, color: C.ink, marginTop: 10, lineHeight: 1.2}}>{title}</div>
    <div style={{fontFamily: FONT.sc, fontSize: 26, lineHeight: 1.6, color: C.ink2, marginTop: 14}}>{sub}</div>
  </div>
);

export const SecD: React.FC<{s: number; f: number}> = ({s}) => {
  const t1 = span(s, 7560 - 460, 7560 - 40);
  const t2 = span(s, 8100 - 460, 8100 - 40);
  return (
    <Section sec={SD}>
      <Stage sec={SD} s={s}>
        <div style={{position: 'absolute', left: 140, top: 120}}>
          <Kicker>2014—2018 · 数据新闻</Kicker>
          <div style={{fontFamily: FONT.sc, fontWeight: 700, fontSize: 56, color: C.ink, marginTop: 16}}>图钉在左边，文字从右边滚过</div>
        </div>
        <svg width={1120} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
          <g opacity={1 - t1}>
            <line x1={170} y1={360} x2={170} y2={880} stroke="#CFC6B8" strokeWidth={2} />
            <line x1={170} y1={880} x2={1030} y2={880} stroke="#CFC6B8" strokeWidth={2} />
          </g>
          <g opacity={t2}>
            <line x1={190} y1={892} x2={1010} y2={892} stroke="#CFC6B8" strokeWidth={2} />
            {BARS.map((n, j) => (
              <text key={j} x={300 + j * 200} y={860 - Math.ceil(n / 3) * 50 - 6} textAnchor="middle" fontFamily="Geist Mono" fontSize={26} fill={C.ink2}>
                {n}
              </text>
            ))}
          </g>
          {DOTS.map((d, i) => {
            const st = (i / DOT_N) * 0.35;
            const a = c01((t1 - st) / 0.65);
            const b = c01((t2 - (((d.cat * 7 + i) % DOT_N) / DOT_N) * 0.35) / 0.65);
            const ea = a * a * (3 - 2 * a);
            const eb = b * b * (3 - 2 * b);
            const x = lerp(lerp(d.sc.x, d.gr.x, ea), d.bar.x, eb);
            const y = lerp(lerp(d.sc.y, d.gr.y, ea), d.bar.y, eb) - Math.sin(Math.PI * eb) * 40;
            return <circle key={i} cx={x} cy={y} r={lerp(13, 19, ea)} fill={mixHex('#C9C1B4', DOT_COL[d.cat], ea)} />;
          })}
        </svg>
        <div style={{position: 'absolute', left: 140, top: 960}}>
          <Kicker color={C.ink2} size={20}>
            并排式 Side-by-side · 7fr 舞台 / 5fr 步骤
          </Kicker>
        </div>
      </Stage>
      <TriggerLine sec={SD} s={s} o={0.55} x0={1170} x1={1840} label={false} />
      <At x={1200} y={DATA_STEPS[0] - SD.top} center>
        <DataCard
          y="2014 · Mike Bostock"
          title="《How To Scroll》"
          sub="总结五条滚动规则：能倒着滚、反馈要即时、别劫持滚轮。"
          a={nearTrigger(DATA_STEPS[0], s)}
          on={crossed(DATA_STEPS[0], s)}
        />
      </At>
      <At x={1200} y={DATA_STEPS[1] - SD.top} center>
        <DataCard
          y="2017—2018 · The Pudding"
          title="Scrollama → sticky"
          sub="先做成工具库，再换成 position: sticky：图钉住，步骤过线就换图。"
          a={nearTrigger(DATA_STEPS[1], s)}
          on={crossed(DATA_STEPS[1], s)}
        />
      </At>
    </Section>
  );
};

/* ───────────── 05 · 苹果产品页：滚到哪一帧，画哪一帧 ───────────── */
const SE = sec('E');
export const SecE: React.FC<{s: number; f: number}> = ({s}) => {
  const p = lin(s, SE.top, SE.top + SE.h - VH);
  const q = span(s, SE.top, 10800);
  const ry = lerp(-200, 0, q) + 30 * c01((s - 10800) / 1080);
  const idx = 1 + Math.round(p * 119);
  return (
    <Section sec={SE}>
      <Stage sec={SE} s={s}>
        <Device x={960} y={565} scale={0.95} rx={8 - 4 * q} ry={ry} rz={0} glow={0.85} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 902, display: 'flex', justifyContent: 'center', gap: 6}}>
          {Array.from({length: 60}, (_, i) => {
            const on = i === Math.min(59, Math.floor((idx - 1) / 2));
            const past = i < (idx - 1) / 2;
            return <div key={i} style={{width: 6, height: on ? 34 : 18, marginTop: on ? 0 : 8, borderRadius: 3, background: on ? C.accent : past ? '#5A5A60' : '#2C2C2E'}} />;
          })}
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 950, textAlign: 'center'}}>
          <Mono size={26} color={C.t1}>
            img_{String(idx).padStart(3, '0')}.jpg
          </Mono>
          <Mono size={26} color={C.t3}>
            {'  '}/ 120
          </Mono>
        </div>
        <div style={{position: 'absolute', left: 140, top: 952}}>
          <Kicker color={C.t2} size={20}>
            2020 前后 · 苹果产品页
          </Kicker>
        </div>
        <div style={{position: 'absolute', right: 140, top: 952, textAlign: 'right'}}>
          <Kicker color={C.t2} size={20}>
            逐帧 Scrub · canvas 图片序列
          </Kicker>
        </div>
      </Stage>
      {['一屏，一句话。', '画面跟着滚动，一帧一帧转。'].map((t, i) => {
        const y = APPLE_STEPS[i] - s;
        const o = 1 - c01(Math.abs(y - 175) / 300);
        return (
          <At key={i} x={0} y={APPLE_STEPS[i] - SE.top} w={1920} center style={{textAlign: 'center', opacity: o}}>
            <div
              style={{
                fontFamily: FONT.sc,
                fontWeight: 700,
                fontSize: 92,
                letterSpacing: 2,
                backgroundImage: i === 1 ? gradCss(90) : undefined,
                WebkitBackgroundClip: i === 1 ? 'text' : undefined,
                backgroundClip: i === 1 ? 'text' : undefined,
                color: i === 1 ? 'transparent' : C.t1,
              }}
            >
              {t}
            </div>
          </At>
        );
      })}
    </Section>
  );
};

/* ───────────── 06 · 2023 CSS 滚动驱动动画 ───────────── */
const SF = sec('F');
type Tok = [string, string];
const P = C.t2;
const SEL = '#F5F5F7';
const PROP = '#7CC4FF';
const VAL = '#FFB86B';
const FN = '#FF7AB6';
const CODE: Tok[][] = [
  [['.stage', SEL], ['  { ', P], ['position', PROP], [': ', P], ['sticky', VAL], ['; ', P], ['top', PROP], [': ', P], ['0', VAL], ['; }', P]],
  [],
  [['.device', SEL], [' {', P]],
  [['  animation', PROP], [': ', P], ['spin linear both', VAL], [';', P]],
  [['  animation-timeline', PROP], [': ', P], ['scroll()', FN], [';', P]],
  [['}', P]],
  [],
  [['.step', SEL], [' {', P]],
  [['  animation', PROP], [': ', P], ['fade-in linear both', VAL], [';', P]],
  [['  animation-timeline', PROP], [': ', P], ['view()', FN], [';', P]],
  [['  animation-range', PROP], [': ', P], ['entry 0% cover 40%', VAL], [';', P]],
  [['}', P]],
];
const LH = 42;

export const SecF: React.FC<{s: number; f: number}> = ({s}) => {
  const p = lin(s, SF.top, SF.top + SF.h - VH);
  const pillY = SF.top + 1450 - s;
  const pq = c01((VH - pillY) / 380);
  const hiDev = c01((s - SF.top + 60) / 120) * (1 - 0.6 * pq);
  return (
    <Section sec={SF}>
      <Stage sec={SF} s={s}>
        <div style={{position: 'absolute', left: 0, top: 0, height: 6, width: 1920 * p, backgroundImage: gradCss(90)}} />
        <div style={{position: 'absolute', left: 140, top: 104}}>
          <Kicker>2023 · CSS 滚动驱动动画</Kicker>
          <div style={{fontFamily: FONT.sc, fontWeight: 700, fontSize: 62, color: C.t1, marginTop: 16}}>不写 JS，也能跟着滚动走</div>
        </div>
        <div style={{position: 'absolute', left: 140, top: 290, width: 900, padding: '34px 0', borderRadius: 24, background: '#16161A', boxShadow: 'inset 0 0 0 1px #26262B'}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 34 + 2 * LH - 4, height: LH * 4 + 8, background: `rgba(41,151,255,${0.13 * hiDev})`, boxShadow: `inset 3px 0 0 rgba(41,151,255,${hiDev})`}} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 34 + 7 * LH - 4, height: LH * 5 + 8, background: `rgba(41,151,255,${0.13 * pq})`, boxShadow: `inset 3px 0 0 rgba(41,151,255,${pq})`}} />
          {CODE.map((line, i) => (
            <div key={i} style={{position: 'relative', height: LH, paddingLeft: 40, fontFamily: FONT.mono, fontSize: 27, lineHeight: `${LH}px`, whiteSpace: 'pre'}}>
              {line.map(([t, c], j) => (
                <span key={j} style={{color: c}}>
                  {t}
                </span>
              ))}
            </div>
          ))}
        </div>
        <div style={{position: 'absolute', left: 140, top: 930}}>
          <Mono size={22} color={C.t2}>
            Chrome 115（2023）· Safari 26（2025）· Firefox 159（2026）
          </Mono>
        </div>
        <Device x={1460} y={470} scale={0.72} rx={12} ry={-30 + 360 * span(s, SF.top, SF.top + 540)} rz={0} glow={0.7} />
        <div style={{position: 'absolute', left: 1160, width: 600, top: 760, textAlign: 'center'}}>
          <Mono size={22} color={C.t2}>
            .device → scroll()
          </Mono>
        </div>
      </Stage>
      <At x={1160} y={1450 - 40} w={600}>
        <div
          style={{
            opacity: pq,
            transform: `translateY(${(1 - pq) * 40}px)`,
            padding: '22px 30px',
            borderRadius: 20,
            background: C.panel,
            boxShadow: `inset 0 0 0 1.5px rgba(41,151,255,${0.3 + 0.6 * pq})`,
            display: 'flex',
            gap: 16,
            alignItems: 'center',
          }}
        >
          <Mono size={24} color={C.t1}>
            .step
          </Mono>
          <span style={{fontFamily: FONT.sc, fontSize: 26, color: C.t2}}>进入视口就淡入</span>
          <Mono size={24} color={FN}>
            view()
          </Mono>
        </div>
      </At>
    </Section>
  );
};
