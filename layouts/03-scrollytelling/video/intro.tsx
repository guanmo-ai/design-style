/** 开场 + 01 定义（同一个 sticky 舞台）+ 02 结构（镜头拉远的透视图） */
import React from 'react';
import {C, FONT, gradCss} from '../tokens';
import {Device} from './Device';
import {Cam, DEF_STEPS, TRIGGER, VH, W, c01, isStuck, lerp, sec, span, stickyY, toScreen} from './page';
import {At, Kicker, Mono, Section, Stage, StepCard, TriggerLine, crossed, nearTrigger} from './ui';

const AB = sec('AB');
const STAGE_BOX = {x: 900, y: 70, w: 960, h: 940}; // 01 定义里“舞台”那一栏

/** 设备状态 = f(scrollY)：倒着滚，就倒着变 */
export const deviceAB = (s: number) => {
  const p1 = span(s, 0, 360); // 转过来
  const p2 = span(s, 360, 720); // 立成等轴
  const p3 = span(s, 720, 1080); // 拆开
  const q1 = span(s, 1080, 1620); // 挪到右栏，合上
  const t2 = span(s, 2700 - 440, 2700 - 40); // 步骤 ②
  const t3 = span(s, 3240 - 440, 3240 - 40); // 步骤 ③
  let x = 960, y = 690, sc = 0.8, rx = 66, ry = -26, rz = 0, ex = 0;
  rx = lerp(rx, 0, p1); ry = lerp(ry, 0, p1); y = lerp(y, 655, p1);
  rx = lerp(rx, 55, p2); rz = lerp(rz, -38, p2); y = lerp(y, 520, p2); sc = lerp(sc, 0.9, p2);
  ex = lerp(ex, 1, p3); sc = lerp(sc, 0.74, p3); y = lerp(y, 560, p3);
  x = lerp(x, 1380, q1); ex = lerp(ex, 0, q1); rx = lerp(rx, 6, q1); rz = lerp(rz, 0, q1); ry = lerp(ry, -20, q1); sc = lerp(sc, 0.92, q1); y = lerp(y, 540, q1);
  rx = lerp(rx, 55, t2); rz = lerp(rz, -38, t2); ry = lerp(ry, 0, t2); sc = lerp(sc, 0.86, t2);
  ex = lerp(ex, 1, t3); sc = lerp(sc, 0.7, t3); y = lerp(y, 560, t3);
  return {x, y, scale: sc, rx, ry, rz, explode: ex, hi: t3, glow: 0.9 - 0.5 * q1 + 0.4 * t3};
};

const Opening: React.FC<{s: number; f: number}> = ({s, f}) => {
  const fade = 1 - span(s, 560, 940);
  const hint = 1 - span(s, 0, 160);
  if (fade <= 0) return null;
  return (
    <>
      <div style={{position: 'absolute', left: 0, right: 0, top: 70 - s * 0.16, textAlign: 'center', opacity: fade}}>
        <Kicker color={C.t2} size={22}>
          Design Style · 布局 03
        </Kicker>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 176,
            letterSpacing: -6,
            lineHeight: 1.05,
            marginTop: 18,
            backgroundImage: gradCss(90),
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            paddingBottom: 10,
          }}
        >
          Scrollytelling
        </div>
        <div style={{fontFamily: FONT.sc, fontWeight: 700, fontSize: 54, color: C.t1, letterSpacing: 14, marginTop: 2}}>滚动叙事</div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 952, textAlign: 'center', opacity: hint}}>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 16}}>
          <div style={{width: 26, height: 40, borderRadius: 13, boxShadow: `inset 0 0 0 2px ${C.t2}`, position: 'relative'}}>
            <div style={{position: 'absolute', left: 11, top: 8 + ((f % 30) / 30) * 8, width: 4, height: 8, borderRadius: 2, background: C.t1}} />
          </div>
          <Mono size={22} color={C.t2}>
            向下滚动
          </Mono>
        </div>
      </div>
    </>
  );
};

/** 步骤 ①：给舞台描一圈，标出它是钉住的 */
const StageOutline: React.FC<{o: number}> = ({o}) =>
  o <= 0.001 ? null : (
    <div
      style={{
        position: 'absolute',
        left: STAGE_BOX.x,
        top: STAGE_BOX.y,
        width: STAGE_BOX.w,
        height: STAGE_BOX.h,
        borderRadius: 36,
        boxShadow: `inset 0 0 0 2px rgba(48,209,88,${0.85 * o})`,
        background: `rgba(48,209,88,${0.045 * o})`,
        opacity: o,
        transform: `scale(${1.03 - 0.03 * o})`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 30,
          top: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '9px 18px 9px 14px',
          borderRadius: 999,
          background: 'rgba(48,209,88,0.14)',
        }}
      >
        <div style={{width: 12, height: 12, borderRadius: 6, background: C.stuck}} />
        <Mono size={21} color={C.stuck}>
          .stage &#123; position: sticky; top: 0 &#125;
        </Mono>
      </div>
    </div>
  );

const DEF_CARDS: [string, string, React.ReactNode][] = [
  ['1', '画面钉在原地', <Mono size={24} color={C.stuck}>position: sticky; top: 0</Mono>],
  ['2', '文字从旁边滚过', '步骤留在普通文档流里，照常往上走'],
  ['3', '每过一条线，画面变一步', '步骤越过视口 50% 的触发线，舞台换一个状态'],
];

export const SecAB: React.FC<{s: number; f: number}> = ({s, f}) => {
  const d = deviceAB(s);
  const outline = span(s, 2160 - 440, 2160 - 40);
  const trig = span(s, 1500, 1900) * (1 - span(s, 3300, 3700));
  return (
    <Section sec={AB}>
      <Stage sec={AB} s={s}>
        <StageOutline o={outline} />
        <Device {...d} />
        <Opening s={s} f={f} />
      </Stage>
      {/* 01 定义：普通文档流 */}
      <At x={140} y={1860}>
        <Kicker>01 · 定义</Kicker>
        <div style={{fontFamily: FONT.sc, fontWeight: 900, fontSize: 128, color: C.t1, letterSpacing: 4, lineHeight: 1.12, marginTop: 18}}>滚动叙事</div>
        <div style={{fontFamily: FONT.sc, fontWeight: 500, fontSize: 44, lineHeight: 1.45, color: C.t2, marginTop: 22}}>
          画面钉住，文字滚过：
          <br />
          <span style={{color: C.t1}}>你往下滚，它就往下讲。</span>
        </div>
        <div style={{marginTop: 26}}>
          <Mono size={24} color={C.t3}>
            scroll + storytelling
          </Mono>
        </div>
      </At>
      {DEF_CARDS.map(([n, t, sub], i) => (
        <At key={n} x={140} y={DEF_STEPS[i] - AB.top} center>
          <StepCard n={n} title={t} sub={sub} a={nearTrigger(DEF_STEPS[i], s)} on={crossed(DEF_STEPS[i], s)} w={640} />
        </At>
      ))}
      <TriggerLine sec={AB} s={s} o={trig} x0={90} x1={1840} />
    </Section>
  );
};

/* ───────────── 02 结构：镜头拉远，看见整段 section ───────────── */
const Row: React.FC<{sw: React.ReactNode; code: string; desc: string; o: number}> = ({sw, code, desc, o}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 22, opacity: o, transform: `translateX(${(1 - o) * 30}px)`, marginBottom: 26}}>
    <div style={{width: 46, display: 'flex', justifyContent: 'center'}}>{sw}</div>
    <div style={{width: 440, whiteSpace: 'nowrap'}}>
      <Mono size={25} color={C.t1}>
        {code}
      </Mono>
    </div>
    <div style={{fontFamily: FONT.sc, fontSize: 25, color: C.t2, whiteSpace: 'nowrap'}}>{desc}</div>
  </div>
);

const status = (f: number) => {
  if (f < 240) return ['往下滚', C.t1];
  if (f < 266) return ['倒着滚 · 画面也倒着变', C.accent];
  if (f < 300) return ['再滚一遍 · 位置决定画面', C.t1];
  return ['滚到底 · 舞台松开', C.t2];
};

export const XrayOverlay: React.FC<{f: number; s: number; c: Cam; m: number}> = ({f, s, c, m}) => {
  const P = (x: number, y: number) => toScreen(c, x, y);
  const pg0 = P(0, AB.top);
  const pg1 = P(W, AB.top + AB.h);
  const v0 = P(0, s);
  const v1 = P(W, s + VH);
  const sy = stickyY(AB, s);
  const stuck = isStuck(AB, s) && s > AB.top + 1;
  const g0 = P(STAGE_BOX.x, sy + STAGE_BOX.y);
  const g1 = P(STAGE_BOX.x + STAGE_BOX.w, sy + STAGE_BOX.y + STAGE_BOX.h);
  const ty = P(0, s + TRIGGER).y;
  const gc = stuck ? C.stuck : C.t2;
  const steps = DEF_STEPS.filter((y) => crossed(y, s)).length;
  const [st, stc] = status(f);
  const pane = (k: number) => c01((m - 0.35 - k * 0.1) / 0.35);
  const bx = pg1.x + 30;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: Math.min(1, m * 1.4)}}>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <path
          d={`M${pg0.x} ${pg0.y}H${pg1.x}V${pg1.y}H${pg0.x}Z M${v0.x} ${v0.y}V${v1.y}H${v1.x}V${v0.y}Z`}
          fill="rgba(6,6,8,0.55)"
          fillRule="evenodd"
        />
        <rect x={pg0.x} y={pg0.y} width={pg1.x - pg0.x} height={pg1.y - pg0.y} fill="none" stroke="#5A5A60" strokeWidth={1.5} />
        <rect x={g0.x} y={g0.y} width={g1.x - g0.x} height={g1.y - g0.y} rx={8} fill={stuck ? 'rgba(48,209,88,0.16)' : 'rgba(134,134,139,0.12)'} stroke={gc} strokeWidth={2.5} />
        <rect x={v0.x - 2} y={v0.y} width={v1.x - v0.x + 4} height={v1.y - v0.y} rx={4} fill="none" stroke={C.accent} strokeWidth={3} />
        <line x1={v0.x - 30} x2={v1.x + 12} y1={ty} y2={ty} stroke={C.accent} strokeWidth={2} strokeDasharray="7 6" />
        {/* section 的高度 */}
        <line x1={bx} x2={bx} y1={pg0.y} y2={pg1.y} stroke="#8E8E93" strokeWidth={1.5} />
        <line x1={bx - 8} x2={bx + 8} y1={pg0.y} y2={pg0.y} stroke="#8E8E93" strokeWidth={1.5} />
        <line x1={bx - 8} x2={bx + 8} y1={pg1.y} y2={pg1.y} stroke="#8E8E93" strokeWidth={1.5} />
        {DEF_STEPS.map((y, i) => {
          const p = P(140 + 640, y);
          const on = crossed(y, s);
          return <circle key={i} cx={p.x + 10} cy={p.y} r={5} fill={on ? C.accent : 'none'} stroke={C.accent} strokeWidth={2} />;
        })}
      </svg>
      <div style={{position: 'absolute', left: bx + 12, top: (pg0.y + pg1.y) / 2 - 14}}>
        <Mono size={20} color="#8E8E93">
          400vh
        </Mono>
      </div>
      <div style={{position: 'absolute', left: v0.x - 128, width: 100, textAlign: 'right', top: v0.y - 2}}>
        <Mono size={18} color={C.accent}>
          视口 100vh
        </Mono>
      </div>
      <div style={{position: 'absolute', left: v0.x - 96, width: 60, textAlign: 'right', top: ty - 12}}>
        <Mono size={18} color={C.accent}>
          50%
        </Mono>
      </div>
      {/* 右侧说明 */}
      <div style={{position: 'absolute', left: 990, top: 120, width: 860}}>
        <div style={{opacity: pane(0)}}>
          <Kicker>02 · 结构</Kicker>
          <div style={{fontFamily: FONT.sc, fontWeight: 700, fontSize: 58, lineHeight: 1.3, color: C.t1, marginTop: 18, marginBottom: 48}}>
            一段很高的 section，
            <br />
            里面钉着一个舞台。
          </div>
        </div>
        <Row o={pane(1)} sw={<div style={{width: 28, height: 40, boxShadow: 'inset 0 0 0 2px #8E8E93'}} />} code="section { height: 400vh }" desc="留出滚动的路" />
        <Row o={pane(1.5)} sw={<div style={{width: 34, height: 26, borderRadius: 4, background: 'rgba(48,209,88,0.2)', boxShadow: `inset 0 0 0 2px ${C.stuck}`}} />} code=".stage { position: sticky }" desc="钉在视口里" />
        <Row o={pane(2)} sw={<div style={{width: 12, height: 12, borderRadius: 6, background: C.accent}} />} code=".step × 3" desc="普通文档流，照常滚过" />
        <Row o={pane(2.5)} sw={<div style={{width: 38, height: 0, borderTop: `2px dashed ${C.accent}`}} />} code="触发线 · 视口 50%" desc="步骤过线，舞台换一步" />
        <div
          style={{
            marginTop: 34,
            padding: '26px 34px',
            borderRadius: 24,
            background: C.panel,
            display: 'flex',
            alignItems: 'baseline',
            gap: 40,
            opacity: pane(3),
            width: 860,
            whiteSpace: 'nowrap',
            boxSizing: 'border-box',
          }}
        >
          <div>
            <Mono size={20} color={C.t2}>
              scrollY
            </Mono>
            <div style={{fontFamily: FONT.mono, fontSize: 54, color: C.t1, fontVariantNumeric: 'tabular-nums', width: 210}}>{Math.round(s)}</div>
          </div>
          <div>
            <Mono size={20} color={C.t2}>
              step
            </Mono>
            <div style={{fontFamily: FONT.mono, fontSize: 54, color: C.accent}}>{steps} / 3</div>
          </div>
          <div style={{fontFamily: FONT.sc, fontWeight: 500, fontSize: 28, color: stc, alignSelf: 'center'}}>{st}</div>
        </div>
      </div>
    </div>
  );
};
