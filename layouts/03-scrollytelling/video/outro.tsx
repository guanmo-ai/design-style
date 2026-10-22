/** 07 四种排法 · 08 五条规则（规则本身就是步骤）· 片尾 */
import React from 'react';
import {C, FONT, GRAD, gradCss} from '../tokens';
import {RULE_STEPS, TRIGGER, c01, lerp, sec, span} from './page';
import {At, Kicker, Mono, Section, Stage, StepCard, TriggerLine, crossed, nearTrigger} from './ui';

/* ───────────── 07 · 四种排法 ───────────── */
const SG = sec('G');
const LIGHT = [660, 675, 690, 705];
const MW = 790;
const MH = 240;

const Mini: React.FC<{kind: number; t: number}> = ({kind, t}) => {
  const m = t * 2.6;
  const thumb = 10 + c01(m / 260) * (MH - 70);
  let body: React.ReactNode = null;
  if (kind === 0) {
    const k = Math.max(0, Math.min(2, Math.floor((m + 50) / 90)));
    const H = [
      [60, 120, 90],
      [150, 70, 100],
      [90, 140, 180],
    ][k];
    body = (
      <>
        <div style={{position: 'absolute', left: 0, top: 0, width: 470, height: MH, background: '#F2F2F4'}} />
        {H.map((h, j) => (
          <div key={j} style={{position: 'absolute', left: 90 + j * 110, bottom: 28, width: 70, height: h, borderRadius: 8, background: j === k ? C.accent : '#C7C7CC'}} />
        ))}
        {[0, 1, 2].map((j) => {
          const y = 140 + j * 90 - m;
          const on = y < 120;
          return <div key={j} style={{position: 'absolute', left: 500, top: y, width: 250, height: 54, borderRadius: 10, background: on ? 'rgba(41,151,255,0.16)' : '#EDEDF0', boxShadow: on ? `inset 0 0 0 2px ${C.accent}` : 'none'}} />;
        })}
        <div style={{position: 'absolute', left: 486, right: 20, top: 119, borderTop: `2px dashed ${C.accent}`}} />
      </>
    );
  } else if (kind === 1) {
    body = (
      <>
        <svg width={MW} height={MH} style={{position: 'absolute', inset: 0}}>
          <rect width={MW} height={MH} fill="#D8E0E7" />
          <path d={`M0 ${MH} L180 ${70 + m * 0.05} L330 160 L470 60 L640 150 L${MW} 90 L${MW} ${MH} Z`} fill="#9AA8B6" />
          <path d={`M0 ${MH} L120 170 L300 110 L520 190 L${MW} 140 L${MW} ${MH} Z`} fill="#F4F6F8" />
        </svg>
        {[0, 1, 2].map((j) => (
          <div key={j} style={{position: 'absolute', left: 245, top: 250 + j * 120 - m * 1.25, width: 300, height: 74, borderRadius: 6, background: '#fff', boxShadow: '0 10px 24px rgba(0,0,0,0.15)'}}>
            <div style={{margin: '18px 22px 0', height: 10, borderRadius: 5, background: '#D1D1D6'}} />
            <div style={{margin: '12px 22px 0', width: 160, height: 10, borderRadius: 5, background: '#E5E5EA'}} />
          </div>
        ))}
      </>
    );
  } else if (kind === 2) {
    const a = (m * 2.2) % 360;
    const cs = Math.cos((a * Math.PI) / 180);
    body = (
      <>
        <div style={{position: 'absolute', inset: 0, background: '#0B0B0D'}} />
        <div
          style={{
            position: 'absolute',
            left: MW / 2 - 40,
            top: 40,
            width: 80,
            height: 160,
            borderRadius: 18,
            transform: `scaleX(${Math.max(0.06, Math.abs(cs))})`,
            background: cs > 0 ? gradCss(160) : 'linear-gradient(140deg, #6A6D75, #26282D)',
            boxShadow: '0 0 40px rgba(255,46,126,0.35)',
          }}
        />
        <div style={{position: 'absolute', left: 30, top: 24}}>
          <Mono size={20} color={C.t2}>
            frame {String(1 + Math.floor((a / 360) * 120)).padStart(3, '0')}
          </Mono>
        </div>
      </>
    );
  } else {
    body = (
      <>
        <div style={{position: 'absolute', inset: 0, background: '#F2F2F4'}} />
        {[0, 1, 2, 3, 4].map((j) => (
          <div key={j} style={{position: 'absolute', left: 40 + j * 300 - m * 2.2, top: 36, width: 270, height: 168, borderRadius: 16, background: [...GRAD, C.ink][j], opacity: 0.92}} />
        ))}
        <div style={{position: 'absolute', right: 34, bottom: 18}}>
          <Mono size={20} color={C.ink2}>
            ↓ 竖着滚 → 横着走
          </Mono>
        </div>
      </>
    );
  }
  return (
    <>
      {body}
      <div style={{position: 'absolute', right: 5, top: thumb, width: 5, height: 46, borderRadius: 3, background: kind === 2 ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)'}} />
    </>
  );
};

const PATTERNS: [string, string, string][] = [
  ['01', '并排 Side-by-side', '图钉一边，文字一边'],
  ['02', '覆盖 Overlay', '图铺满，卡片浮在上面滚'],
  ['03', '逐帧 Scrub', '滚到哪，就播到哪一帧'],
  ['04', '横移 Horizontal', '竖着滚，横着走'],
];

export const SecG: React.FC<{s: number; f: number}> = ({s, f}) => (
  <Section sec={SG}>
    <Stage sec={SG} s={s}>
      <div style={{position: 'absolute', left: 150, top: 82}}>
        <Kicker>07 · 四种排法</Kicker>
        <div style={{fontFamily: FONT.sc, fontWeight: 700, fontSize: 54, color: C.ink, marginTop: 14}}>同一副骨架，四种摆法</div>
      </div>
      {PATTERNS.map(([n, name, d], i) => {
        const l = c01((f - LIGHT[i]) / 12);
        const el = 1 - (1 - l) * (1 - l);
        const x = 150 + (i % 2) * (MW + 40);
        const y = 262 + Math.floor(i / 2) * 380;
        return (
          <div key={n} style={{position: 'absolute', left: x, top: y, width: MW, opacity: 0.35 + 0.65 * el, transform: `translateY(${(1 - el) * 16}px)`}}>
            <div
              style={{
                position: 'relative',
                width: MW,
                height: MH + 34,
                borderRadius: 18,
                overflow: 'hidden',
                background: '#fff',
                boxShadow: `0 18px 44px rgba(0,0,0,${0.04 + 0.08 * el}), inset 0 0 0 ${1 + 1.5 * el}px ${el > 0.5 ? 'rgba(41,151,255,0.7)' : '#D2D2D7'}`,
              }}
            >
              <div style={{height: 34, display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 16, background: '#F5F5F7', borderBottom: '1px solid #E0E0E5'}}>
                {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
                  <div key={c} style={{width: 11, height: 11, borderRadius: 6, background: c}} />
                ))}
              </div>
              <div style={{position: 'relative', height: MH, overflow: 'hidden'}}>
                <Mini kind={i} t={Math.max(0, f - LIGHT[i])} />
              </div>
            </div>
            <div style={{display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 18}}>
              <Mono size={24} color={C.accent}>
                {n}
              </Mono>
              <span style={{fontFamily: FONT.sc, fontWeight: 700, fontSize: 34, color: C.ink}}>{name}</span>
              <span style={{fontFamily: FONT.sc, fontSize: 26, color: C.ink2}}>{d}</span>
            </div>
          </div>
        );
      })}
    </Stage>
  </Section>
);

/* ───────────── 08 · 五条规则 ───────────── */
const SH = sec('H');
const RULES: [string, string, string][] = [
  ['1', '钉住舞台，不劫持滚动', '用 position: sticky；滚多快、停在哪，读者说了算'],
  ['2', '一步只变一件事', '一张卡片，对应舞台上的一个变化'],
  ['3', '触发线放在视口中间', '步骤越过 50% 那条线，才换状态'],
  ['4', '能倒着滚', '状态 = f(滚动位置)，往回滚就往回变'],
  ['5', '手机上叠起来，尊重减少动态', '窄屏改成覆盖式；prefers-reduced-motion 直接给终态'],
];

const vis = (i: number, s: number) => {
  const d = Math.abs(s + TRIGGER - RULE_STEPS[i]);
  return 1 - c01((d - 150) / 150);
};

const RuleVisual: React.FC<{i: number; s: number; f: number; o: number}> = ({i, s, f, o}) => {
  if (o <= 0.001) return null;
  const box: React.CSSProperties = {position: 'absolute', inset: 0, opacity: o, transform: `scale(${0.96 + 0.04 * o})`};
  const t = f;
  if (i === 0)
    return (
      <div style={box}>
        <div style={{position: 'absolute', left: 60, top: 60, width: 320, height: 420, borderRadius: 22, boxShadow: 'inset 0 0 0 2px #3A3A3C', overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 24, top: 24, width: 150, height: 372, borderRadius: 14, background: 'rgba(48,209,88,0.18)', boxShadow: `inset 0 0 0 2px ${C.stuck}`}} />
          {[0, 1, 2, 3, 4, 5].map((j) => (
            <div key={j} style={{position: 'absolute', left: 196, top: ((j * 110 - t * 3) % 660 + 660) % 660 - 80, width: 100, height: 70, borderRadius: 10, background: '#2C2C2E'}} />
          ))}
        </div>
        <div style={{position: 'absolute', left: 60, top: 500}}>
          <Mono size={26} color={C.stuck}>
            ✓ position: sticky
          </Mono>
        </div>
        <div style={{position: 'absolute', left: 440, top: 60, width: 320, height: 420, borderRadius: 22, boxShadow: 'inset 0 0 0 2px #3A3A3C', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{width: 90, height: 140, borderRadius: 45, boxShadow: `inset 0 0 0 3px ${C.t3}`, position: 'relative'}}>
            <div style={{position: 'absolute', left: 41, top: 26, width: 8, height: 26, borderRadius: 4, background: C.t3}} />
          </div>
          <div style={{position: 'absolute', width: 260, height: 4, borderRadius: 2, background: '#FF453A', transform: 'rotate(-35deg)'}} />
        </div>
        <div style={{position: 'absolute', left: 440, top: 500}}>
          <Mono size={26} color="#FF453A">
            ✗ 劫持滚轮
          </Mono>
        </div>
      </div>
    );
  if (i === 1) {
    const g = span(s, RULE_STEPS[1] - TRIGGER - 380, RULE_STEPS[1] - TRIGGER - 20);
    return (
      <div style={box}>
        {[160, 240, 120, 200, 170].map((h, j) => {
          const hh = j === 2 ? lerp(h, 360, g) : h;
          return <div key={j} style={{position: 'absolute', left: 90 + j * 130, top: 470 - hh, width: 90, height: hh, borderRadius: 12, background: j === 2 ? C.accent : '#3A3A3C'}} />;
        })}
        <div style={{position: 'absolute', left: 90, top: 500}}>
          <Mono size={26} color={C.t2}>
            1 张卡片 → 1 个变化
          </Mono>
        </div>
      </div>
    );
  }
  if (i === 2) {
    const y = ((t * 4) % 520) - 60;
    const on = y + 40 < 240;
    return (
      <div style={box}>
        <div style={{position: 'absolute', left: 200, top: 30, width: 420, height: 480, borderRadius: 22, boxShadow: 'inset 0 0 0 2px #3A3A3C', overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 110, top: y, width: 200, height: 80, borderRadius: 12, background: on ? 'rgba(41,151,255,0.25)' : '#2C2C2E', boxShadow: on ? `inset 0 0 0 2px ${C.accent}` : 'none'}} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 239, borderTop: `3px dashed ${C.accent}`}} />
        </div>
        <div style={{position: 'absolute', left: 640, top: 252}}>
          <Mono size={30} color={C.accent}>
            50%
          </Mono>
        </div>
      </div>
    );
  }
  if (i === 3) {
    const k = c01((s - 16740) / (18900 - 16740));
    const state = RULE_STEPS.filter((y) => crossed(y, s)).length;
    return (
      <div style={box}>
        <div style={{position: 'absolute', left: 90, top: 70, fontFamily: FONT.mono, fontSize: 56, color: C.t1}}>
          state = <span style={{color: C.accent}}>f</span>(scrollY)
        </div>
        <div style={{position: 'absolute', left: 90, top: 250, width: 640, height: 8, borderRadius: 4, background: '#2C2C2E'}}>
          <div style={{position: 'absolute', left: 0, top: 0, height: 8, width: 640 * k, borderRadius: 4, background: C.accent}} />
          <div style={{position: 'absolute', left: 640 * k - 18, top: -14, width: 36, height: 36, borderRadius: 18, background: C.t1}} />
        </div>
        <div style={{position: 'absolute', left: 90, top: 320, display: 'flex', gap: 18}}>
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} style={{width: 110, height: 110, borderRadius: 20, background: n <= state ? C.accent : '#1C1C1E', color: n <= state ? '#fff' : C.t3, fontFamily: FONT.mono, fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              {n}
            </div>
          ))}
        </div>
        <div style={{position: 'absolute', left: 90, top: 470}}>
          <Mono size={26} color={C.t2}>
            往回滚 → 往回变
          </Mono>
        </div>
      </div>
    );
  }
  return (
    <div style={box}>
      <div style={{position: 'absolute', left: 110, top: 20, width: 250, height: 500, borderRadius: 44, boxShadow: 'inset 0 0 0 3px #48484A', overflow: 'hidden', background: '#0B0B0D'}}>
        <div style={{position: 'absolute', inset: 0, backgroundImage: gradCss(160), opacity: 0.85}} />
        {[0, 1].map((j) => (
          <div key={j} style={{position: 'absolute', left: 24, right: 24, top: 300 + j * 150 - ((t * 2) % 150), height: 100, borderRadius: 14, background: 'rgba(255,255,255,0.92)'}} />
        ))}
      </div>
      <div style={{position: 'absolute', left: 420, top: 120, width: 360}}>
        <Mono size={24} color={C.t2}>
          @media (max-width: 768px)
        </Mono>
        <div style={{fontFamily: FONT.sc, fontSize: 32, color: C.t1, marginTop: 8, marginBottom: 46}}>并排 → 覆盖</div>
        <Mono size={24} color={C.t2}>
          prefers-reduced-motion
        </Mono>
        <div style={{fontFamily: FONT.sc, fontSize: 32, color: C.t1, marginTop: 8}}>不播动画，直接给终态</div>
      </div>
    </div>
  );
};

export const SecH: React.FC<{s: number; f: number}> = ({s, f}) => {
  const n = RULE_STEPS.filter((y) => crossed(y, s)).length;
  return (
    <Section sec={SH}>
      <Stage sec={SH} s={s}>
        <div style={{position: 'absolute', left: 964, top: 92}}>
          <Kicker>08 · 五条规则</Kicker>
        </div>
        <div style={{position: 'absolute', left: 960, top: 150, width: 840, height: 780, borderRadius: 36, background: '#0E0E10', boxShadow: 'inset 0 0 0 1.5px #2C2C2E'}}>
          <div style={{position: 'absolute', left: 40, top: 34, display: 'flex', gap: 12}}>
            {[0, 1, 2, 3, 4].map((j) => (
              <div key={j} style={{width: 54, height: 8, borderRadius: 4, background: j < n ? C.accent : '#2C2C2E'}} />
            ))}
          </div>
          <div style={{position: 'absolute', left: 0, top: 160, width: 840, height: 600}}>
            {RULES.map((_, i) => (
              <RuleVisual key={i} i={i} s={s} f={f} o={vis(i, s)} />
            ))}
          </div>
          <div style={{position: 'absolute', right: 40, top: 26}}>
            <Mono size={22} color={C.t2}>
              {String(Math.max(1, n)).padStart(2, '0')} / 05
            </Mono>
          </div>
        </div>
      </Stage>
      {RULES.map(([k, t, sub], i) => (
        <At key={k} x={140} y={RULE_STEPS[i] - SH.top} center>
          <StepCard n={k} title={t} sub={sub} a={nearTrigger(RULE_STEPS[i], s, 300)} on={crossed(RULE_STEPS[i], s)} w={720} />
        </At>
      ))}
      <TriggerLine sec={SH} s={s} o={0.5} x0={90} x1={900} label={false} />
    </Section>
  );
};


/* ───────────── 片尾 ───────────── */
const SI = sec('I');
export const SecI: React.FC<{s: number; f: number}> = ({f}) => {
  const a = c01((f - 846) / 20);
  const e = 1 - (1 - a) * (1 - a);
  return (
    <Section sec={SI}>
      <div style={{position: 'absolute', left: 960 - 170, top: 200, width: 340, height: 250, borderRadius: 30, boxShadow: `inset 0 0 0 3px ${C.t1}`, overflow: 'hidden', transform: `scale(${0.92 + 0.08 * e})`}}>
        <div style={{position: 'absolute', left: 30, top: 32, width: 130, height: 186, borderRadius: 14, background: gradCss(150)}} />
        {[0, 1, 2, 3, 4].map((j) => (
          <div key={j} style={{position: 'absolute', left: 186, top: ((j * 70 - f * 1.6) % 350 + 350) % 350 - 40, width: 124, height: 40, borderRadius: 10, background: '#3A3A3C'}} />
        ))}
        <div style={{position: 'absolute', left: 172, right: 12, top: 124, borderTop: `3px dashed ${C.accent}`}} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 540, textAlign: 'center'}}>
        <div style={{fontFamily: FONT.sc, fontWeight: 700, fontSize: 66, color: C.t1, letterSpacing: 2}}>风格塑造视觉，布局组织信息。</div>
        <div style={{fontFamily: FONT.display, fontWeight: 500, fontSize: 34, color: C.t2, marginTop: 28}}>
          布局 03 · 滚动叙事 <span style={{color: C.t1}}>Scrollytelling</span>
        </div>
      </div>
    </Section>
  );
};
