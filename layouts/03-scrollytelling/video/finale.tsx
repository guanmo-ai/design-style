/**
 * 06 · 四种排法 · 07 · 五条规则 · 片尾 —— 以及贴在视口上的触发线
 */
import React from 'react';
import {FONT} from '../tokens';
import {PATTERN_TH, RULE_AT, RULE_STEP, TRIGGER, VH, W, XRAY, c01, eo, lerp, lin, sec, smooth, span, stickyY, tf} from './page';
import {Abs, DIM, Eyebrow, GRAY, Glow, Grad, gradAt, Hairline, Rise, Section, Stage, WHITE, mix} from './ui';

type P = {s: number; f: number; m: number};

/* ───────────── 06 · 四种排法 ───────────── */
const G7 = sec('G');
const PATTERNS = [
  {n: '并排', e: 'Side-by-side', b: '图钉一边，文字一边', x: '例：数据新闻'},
  {n: '覆盖', e: 'Overlay', b: '图铺满，卡片浮在上面滚', x: '例：Snow Fall'},
  {n: '逐帧', e: 'Scrub', b: '滚到哪，就播到哪一帧', x: '例：苹果产品页'},
  {n: '横移', e: 'Horizontal', b: '竖着滚，横着走', x: '例：时间线、作品集'},
];
const Mini: React.FC<{i: number; a: number; q: number}> = ({i, a, q}) => {
  const line = (x: number, y: number, w: number, o = 1) => (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: 10, borderRadius: 5, background: mix('#2a2a2e', '#f5f5f7', a * o)}} />
  );
  const grad = `linear-gradient(135deg, ${gradAt(0)}, ${gradAt(0.4)}, ${gradAt(0.75)}, ${gradAt(1)})`;
  const box: React.CSSProperties = {position: 'absolute', borderRadius: 14, background: grad, opacity: 0.25 + 0.75 * a};
  if (i === 0)
    return (
      <>
        {line(0, 30 - q * 40, 90)}
        {line(0, 120 - q * 40, 110, 0.6)}
        {line(0, 210 - q * 40, 80, 0.4)}
        <div style={{...box, left: 140, top: 20, width: 140, height: 200}} />
      </>
    );
  if (i === 1)
    return (
      <>
        <div style={{...box, left: 0, top: 0, width: 280, height: 240}} />
        <div style={{position: 'absolute', left: 40, top: 150 - q * 110, width: 200, height: 70, borderRadius: 12, background: 'rgba(10,10,14,0.65)', border: '1px solid rgba(255,255,255,0.3)'}} />
      </>
    );
  if (i === 2)
    return (
      <>
        {Array.from({length: 6}, (_, k) => (
          <div key={k} style={{position: 'absolute', left: 8 + k * 46, top: 60, width: 34, height: 120, borderRadius: 8, border: `2px solid ${k <= q * 6 ? gradAt(k / 5) : '#2a2a2e'}`, transform: `perspective(200px) rotateY(${-60 + k * 24}deg)`, opacity: 0.4 + 0.6 * a}} />
        ))}
      </>
    );
  return (
    <div style={{position: 'absolute', left: 0, top: 50, width: 280, height: 140, overflow: 'hidden'}}>
      {Array.from({length: 5}, (_, k) => (
        <div key={k} style={{...box, left: 10 + k * 110 - q * 220, top: 0, width: 96, height: 140, opacity: (0.25 + 0.75 * a) * (0.5 + 0.1 * k)}} />
      ))}
    </div>
  );
};
export const SecG: React.FC<P> = ({s, f}) => {
  const tIn = c01((f - 596) / 20);
  return (
    <Section sec={G7}>
      <Stage sec={G7} s={s} clip={false}>
        <Abs x={150} y={92}>
          <Eyebrow n="06">四种排法</Eyebrow>
        </Abs>
        <Abs x={0} y={170} w={W} style={{textAlign: 'center', fontFamily: FONT.sc, fontWeight: 700, fontSize: 84, color: WHITE, letterSpacing: '-0.01em', opacity: tIn}}>
          同一副骨架，<Grad>四种摆法。</Grad>
        </Abs>
        <div style={{position: 'absolute', left: 0, top: 380, width: W, height: 560, perspective: 1800, display: 'flex', justifyContent: 'center', gap: 36}}>
          {PATTERNS.map((pt, i) => {
            const a = span(s, PATTERN_TH[i] - 90, PATTERN_TH[i] + 30);
            const q = lin(s, PATTERN_TH[i] - 60, PATTERN_TH[i] + 300);
            return (
              <div
                key={i}
                style={{
                  position: 'relative',
                  width: 370,
                  height: 500,
                  boxSizing: 'border-box',
                  borderRadius: 32,
                  padding: '44px 44px',
                  background: `linear-gradient(180deg, rgba(255,255,255,${0.05 + 0.05 * a}), rgba(255,255,255,0.015))`,
                  border: `1px solid rgba(255,255,255,${0.08 + 0.22 * a})`,
                  boxShadow: a > 0.01 ? `0 0 ${80 * a}px rgba(139,61,255,${0.25 * a}), inset 0 1px 0 rgba(255,255,255,${0.2 * a})` : undefined,
                  transform: `rotateY(${(1.5 - i) * 9}deg) translateY(${(1 - eo(c01((f - 598 - i * 4) / 22))) * 80}px)`,
                  opacity: c01((f - 598 - i * 4) / 16),
                }}
              >
                <div style={{position: 'relative', height: 250}}>
                  <Mini i={i} a={a} q={q} />
                </div>
                <div style={{fontFamily: FONT.sc, fontWeight: 700, fontSize: 52, color: mix('#3a3a3e', WHITE, a), marginTop: 26}}>{pt.n}</div>
                <div style={{fontFamily: FONT.text, fontWeight: 500, fontSize: 24, color: mix('#2c2c30', GRAY, a), marginTop: 6}}>
                  {pt.e} · {pt.b}
                </div>
                <div style={{fontFamily: FONT.sc, fontWeight: 500, fontSize: 22, color: mix('#2c2c30', '#5AB0FF', a), marginTop: 14}}>{pt.x}</div>
              </div>
            );
          })}
        </div>
      </Stage>
    </Section>
  );
};

/* ───────────── 07 · 五条规则：一张钉住的清单，匀速滚，逐条点亮（本身就是一个并排式滚动叙事）───────────── */
const H8 = sec('H');
const RULES = [
  ['钉住舞台，不劫持滚动。', 'position: sticky；滚多快、停在哪，读者说了算。'],
  ['一步，只变一件事。', '一段文字，对应舞台上的一个变化。'],
  ['触发线，放在视口中间。', '越过 50% 那条线，才换下一步。'],
  ['能倒着滚。', '状态 = f(scrollY)：往回滚，就往回变。'],
  ['手机上，叠起来。', '窄屏改成覆盖式；减少动态时直接给终态。'],
];
export const SecH: React.FC<P> = ({s}) => {
  const p = (s - RULE_AT[0]) / RULE_STEP; // 0 → 5：第 i 条在 p ∈ [i, i+1] 里点亮
  const k = Math.min(4.999, Math.max(0, p));
  const n = Math.floor(k);
  const roll = n + (n < 4 ? smooth(c01((k - n - 0.86) / 0.14)) : 0); // 大号数字：快点亮完时滚到下一位（最后一条停住）
  const tIn = span(s, H8.top - 500, H8.top);
  return (
    <Section sec={H8}>
      <Stage sec={H8} s={s}>
        <Glow x={430} y={560} r={560} color="rgba(139,61,255,0.18)" />
        <Glow x={360} y={700} r={360} color="rgba(255,46,126,0.10)" />
        <Abs x={150} y={92}>
          <Eyebrow n="07">五条规则</Eyebrow>
        </Abs>
        {/* 左：钉住的大号数字（滚动驱动的“里程表”） */}
        <div style={{position: 'absolute', left: 110, top: 290, width: 640, height: 500, overflow: 'hidden', WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 18%, #000 82%, transparent 100%)'}}>
          {RULES.map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                top: 10 + (i - roll) * 480,
                fontFamily: FONT.display,
                fontWeight: 700,
                fontSize: 440,
                lineHeight: 1,
                letterSpacing: '-0.06em',
              }}
            >
              <Grad deg={160}>{String(i + 1).padStart(2, '0')}</Grad>
            </div>
          ))}
        </div>
        {/* 右：五条规则，越往下越晚点亮 */}
        <div style={{position: 'absolute', left: 820, top: 196 - 36 * c01(p / 5), opacity: tIn}}>
          {RULES.map(([t, b], i) => {
            const q = c01(p - i);
            const cur = c01(1 - Math.abs(p - i - 0.5) * 1.6);
            const chars = [...t];
            return (
              <div key={i} style={{position: 'relative', height: 150}}>
                <div style={{position: 'absolute', left: -40, top: 12, width: 4, height: 64, borderRadius: 2, background: gradAt(i / 4), opacity: 0.15 + 0.85 * cur}} />
                <div style={{fontFamily: FONT.sc, fontWeight: 700, fontSize: 64, lineHeight: 1.12, letterSpacing: '-0.01em', whiteSpace: 'nowrap'}}>
                  {chars.map((ch, j) => (
                    <span key={j} style={{color: mix(DIM, WHITE, c01(q * (chars.length + 3) - j))}}>
                      {ch}
                    </span>
                  ))}
                </div>
                <div style={{fontFamily: FONT.sc, fontWeight: 500, fontSize: 28, color: mix('#1c1c1f', GRAY, c01(q * 1.6 - 0.4)), marginTop: 10, whiteSpace: 'nowrap'}}>{b}</div>
              </div>
            );
          })}
        </div>
      </Stage>
    </Section>
  );
};

/* ───────────── 片尾 ───────────── */
const I9 = sec('I');
export const SecI: React.FC<P> = ({f}) => {
  return (
    <Section sec={I9}>
      <Glow x={960} y={500} r={700} sx={1.4} color="rgba(139,61,255,0.14)" />
      <Abs x={0} y={300} w={W} style={{textAlign: 'center', fontFamily: FONT.sc, fontWeight: 700, fontSize: 132, lineHeight: 1.22, letterSpacing: '-0.01em'}}>
        <Rise t={tf(f, 848, 22)}>
          <span style={{color: WHITE}}>风格塑造视觉，</span>
        </Rise>
        <br />
        <Rise t={tf(f, 856, 22)}>
          <Grad>布局组织信息。</Grad>
        </Rise>
      </Abs>
      <Abs x={0} y={780} w={W} style={{textAlign: 'center'}}>
        <Rise t={tf(f, 866, 20)}>
          <span style={{fontFamily: FONT.text, fontWeight: 600, fontSize: 24, letterSpacing: '0.28em', color: GRAY}}>DESIGN STYLE · 布局 03 · 滚动叙事 SCROLLYTELLING</span>
        </Rise>
      </Abs>
    </Section>
  );
};

/** 贴在视口上的东西：01 定义里的触发线（第一行字要过线时才画出来，并标明它是什么）、片尾的回呼 */
export const FinaleOverlay: React.FC<{s: number; f: number}> = ({f}) => {
  const draw = tf(f, 100, 18, (t) => 1 - Math.pow(1 - t, 4));
  const o = 0.42 * c01((XRAY.in + 4 - f) / 10);
  const lab = c01((f - 110) / 10) * c01((XRAY.in + 2 - f) / 8);
  const end = tf(f, 872, 24);
  return (
    <>
      {f > 99 && f < XRAY.in + 20 && (
        <>
          <Hairline y={TRIGGER} o={o} draw={draw} x={110} w={900} color="255,92,154" />
          <div style={{position: 'absolute', left: 1020, top: TRIGGER - 14, fontFamily: FONT.mono, fontSize: 22, color: '#FF5C9A', opacity: lab, whiteSpace: 'nowrap'}}>
            触发线 · 50%
          </div>
        </>
      )}
      {f > 860 && <Hairline y={890} o={0.45 * end} draw={end} w={760} x={580} />}
    </>
  );
};
export {DIM, stickyY};
