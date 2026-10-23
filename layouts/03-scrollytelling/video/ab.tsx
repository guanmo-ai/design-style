/**
 * 开场 · 01 定义 · 02 结构 —— 同一个 section（高 3240 = 三屏），里面一个 sticky 舞台：一台实时渲染的 3D 手机。
 *   开场（S = 0）：手机从暗处转过来，屏幕在拍点上亮起，身后升起 Scrollytelling
 *   01 定义：四行字从左边滚过触发线、逐字点亮；每过一行，手机变一步（挪到右边 → 拆开 → 芯片亮 → 合上）
 *   02 结构：页面倾斜成 X 光视角，看清“一段很高的区块，钉着一个舞台”；倒着滚，手机也倒着变
 */
import React from 'react';
import {FONT} from '../tokens';
import {Phone3D, PhoneState} from './Phone3D';
import {Cam, DEF_AT, DEF_LINE_Y, S, STAGE_Z, STEPS_Z, TRIGGER, VH, W, XRAY, c01, eio, eo, lerp, project, sec, span, stickyY, tf} from './page';
import {Abs, Eyebrow, Glow, GRAY, Grad, gradAt, Rise, Scrub, Section, Stage, WHITE} from './ui';

const AB = sec('AB');

/** 手机姿态：开场按帧，之后全部按 S */
export const phoneAB = (f: number, s: number): PhoneState => {
  // 开场：从背面转过来（帧驱动 = 页面加载动画）
  const e = eio(c01((f - 2) / 64));
  const hero: PhoneState = {
    x: 960,
    y: lerp(600, 548, eo((f - 2) / 70)),
    h: lerp(620, 670, eo((f - 2) / 80)),
    rx: lerp(-16, 7, e),
    ry: lerp(205, -62, e) + 6 * c01((f - 66) / 60),
    rz: lerp(8, 0, e),
    exposure: lerp(0.05, 1, tf(f, 0, 40)),
    screen: c01((f - 58) / 6),
  };
  const a = span(s, 0, DEF_AT[0]);
  const b = span(s, DEF_AT[0], DEF_AT[1]);
  const c = span(s, DEF_AT[1], DEF_AT[2]);
  const d = span(s, DEF_AT[2], DEF_AT[3]);
  let st: PhoneState = {
    ...hero,
    x: lerp(hero.x, 1370, a),
    y: lerp(hero.y, 540, a),
    h: lerp(hero.h, 760, a),
    rx: lerp(hero.rx!, 8, a),
    ry: lerp(hero.ry!, -24, a),
    rz: lerp(hero.rz!, 0, a),
  };
  st = {...st, h: lerp(st.h, 620, b), rx: lerp(st.rx!, 24, b), ry: lerp(st.ry!, -40, b), rz: lerp(st.rz!, -10, b), explode: b};
  st = {...st, hi: c, ry: st.ry! + 8 * c};
  st = {
    ...st,
    explode: (st.explode ?? 0) * (1 - d),
    hi: (st.hi ?? 0) * (1 - 0.6 * d),
    h: lerp(st.h, 800, d),
    rx: lerp(st.rx!, 3, d),
    ry: lerp(st.ry!, -12, d),
    rz: lerp(st.rz!, 0, d),
    sweep: d > 0.001 && d < 0.999 ? d : undefined,
  };
  return st;
};

const DEF_LINES = ['画面钉住，', '文字滚过。', '每过一条线，', '画面变一步。'];

export const SecAB: React.FC<{s: number; f: number; m: number}> = ({s, f, m}) => {
  const st = phoneAB(f, s);
  const lift = STAGE_Z * m; // X 光：舞台被抬起来
  const glowO = c01((f - 54) / 10) * (1 - 0.45 * c01((f - 66) / 30));
  const flash = Math.exp(-Math.max(0, f - 60) / 9) * c01((f - 58) / 3);
  const word = 'Scrollytelling';
  const heroOut = c01(s / 500);
  return (
    <Section sec={AB}>
      {/* 开场：身后的大字（普通文档流，会被滚走） */}
      <Abs x={0} y={0} w={W} h={VH} style={{opacity: 1 - heroOut * 0.3}}>
        <Abs x={0} y={84} w={W} style={{textAlign: 'center'}}>
          <Rise t={tf(f, 70, 18)}>
            <span style={{fontFamily: FONT.text, fontWeight: 600, fontSize: 24, letterSpacing: '0.32em', color: GRAY}}>DESIGN STYLE · 布局 03</span>
          </Rise>
        </Abs>
        <Abs x={0} y={520 - 150} w={W} style={{textAlign: 'center', fontFamily: FONT.display, fontWeight: 700, fontSize: 252, letterSpacing: '-0.05em', lineHeight: 1.1}}>
          {[...word].map((ch, i) => (
            <Rise key={i} t={tf(f, 60 + Math.abs(i - 6.5) * 1.3, 22)} dist={0.9}>
              <span style={{color: gradAt(i / (word.length - 1))}}>{ch}</span>
            </Rise>
          ))}
        </Abs>
        <Abs x={0} y={918} w={W} style={{textAlign: 'center', fontFamily: FONT.sc}}>
          <Rise t={tf(f, 74, 18)}>
            <span style={{fontWeight: 700, fontSize: 46, color: WHITE, letterSpacing: '0.06em'}}>滚动叙事</span>
          </Rise>
          <div style={{height: 14}} />
          <Rise t={tf(f, 78, 18)}>
            <span style={{fontWeight: 500, fontSize: 30, color: GRAY, letterSpacing: '0.04em'}}>你往下滚，它就往下讲。</span>
          </Rise>
        </Abs>
      </Abs>

      {/* 01 定义：左栏四行字（普通文档流），越过触发线逐字点亮；X 光里这一层浮起来一点 */}
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: AB.h, transform: m > 0.001 ? `translateZ(${STEPS_Z * m}px)` : undefined}}>
        <Abs x={170} y={DEF_LINE_Y[0] - 230}>
          <Eyebrow n="01">定义</Eyebrow>
        </Abs>
        {DEF_LINES.map((t, i) => (
          <Abs key={i} x={164} y={DEF_LINE_Y[i] - 62}>
            <Scrub text={t} y={DEF_LINE_Y[i]} s={s} size={112} gradFrom={i === 3 ? 0 : undefined} />
          </Abs>
        ))}
      </div>

      {/* sticky 舞台：手机 */}
      <Stage sec={AB} s={s} clip={false} style={{transform: `translateZ(${lift}px)`, transformStyle: 'preserve-3d'}}>
        <Glow x={st.x} y={st.y + 20} r={520} sx={0.8} color="rgba(255,46,126,0.30)" o={glowO * (1 - 0.5 * m)} />
        <Glow x={st.x - 120} y={st.y - 160} r={380} color="rgba(255,122,47,0.22)" o={glowO * (1 - 0.5 * m)} />
        <Glow x={st.x + 140} y={st.y + 220} r={420} color="rgba(41,151,255,0.24)" o={glowO * (1 - 0.5 * m)} />
        <Glow x={st.x} y={st.y} r={460} sx={0.75} color="rgba(255,190,220,0.22)" o={flash} />
        <Phone3D w={W} h={VH} st={st} ss={lerp(1.5, 0.6, m)} />
        {/* X 光：舞台是一块蓝色的玻璃板（几层错开的边 = 厚度） */}
        {m > 0.01 &&
          [0, 1, 2, 3].map((k) => (
            <div
              key={k}
              style={{
                position: 'absolute',
                inset: 0,
                border: `${k === 0 ? 8 : 4}px solid rgba(90,176,255,${(k === 0 ? 0.95 : 0.35 - k * 0.07) * m})`,
                borderRadius: 22,
                background: k === 0 ? `linear-gradient(135deg, rgba(41,151,255,${0.16 * m}), rgba(139,61,255,${0.06 * m}) 60%, rgba(41,151,255,${0.12 * m}))` : undefined,
                boxShadow: k === 0 ? `0 0 140px rgba(41,151,255,${0.5 * m}), inset 0 0 60px rgba(90,176,255,${0.25 * m})` : undefined,
                transform: `translateZ(${-k * 7}px)`,
              }}
            />
          ))}
      </Stage>
    </Section>
  );
};

/* ───────────── 02 结构：X 光视角里，贴在页面平面上的图层（视口框、触发线、暗场）───────────── */
export const XrayPlane: React.FC<{s: number; m: number}> = ({s, m}) => {
  if (m <= 0.001) return null;
  const top = s;
  const ext = 700;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: 1, transformStyle: 'preserve-3d', pointerEvents: 'none'}}>
      {/* section：一块很高的磨砂板 + 左边的 vh 刻度 */}
      <div
        style={{
          position: 'absolute',
          left: -16,
          top: -16,
          width: W + 32,
          height: AB.h + 32,
          border: `6px solid rgba(255,255,255,${0.3 * m})`,
          borderRadius: 26,
          background: `rgba(255,255,255,${0.025 * m})`,
        }}
      />
      {[0, 1, 2, 3].map((k) => (
        <React.Fragment key={k}>
          <div style={{position: 'absolute', left: -120, top: k * VH - 2, width: 90, height: 4, background: `rgba(255,255,255,${0.5 * m})`}} />
          <div style={{position: 'absolute', left: -560, top: k * VH - 44, width: 420, textAlign: 'right', fontFamily: FONT.mono, fontSize: 72, color: `rgba(255,255,255,${0.55 * m})`}}>{k * 100}vh</div>
        </React.Fragment>
      ))}
      <div style={{position: 'absolute', left: -75, top: 0, width: 4, height: AB.h, background: `rgba(255,255,255,${0.22 * m})`}} />
      {/* 视口外的暗场 */}
      <div style={{position: 'absolute', left: -ext, top: top - 3200, width: W + 2 * ext, height: 3200, background: `rgba(0,0,0,${0.62 * m})`}} />
      <div style={{position: 'absolute', left: -ext, top: top + VH, width: W + 2 * ext, height: 3200, background: `rgba(0,0,0,${0.62 * m})`}} />
      {/* 视口 */}
      <div
        style={{
          position: 'absolute',
          left: -10,
          top: top - 10,
          width: W + 20,
          height: VH + 20,
          border: `12px solid rgba(255,255,255,${0.95 * m})`,
          borderRadius: 30,
          boxShadow: `0 0 90px rgba(255,255,255,${0.35 * m})`,
          transform: 'translateZ(2px)',
        }}
      />
      {/* 触发线：一道竖起来的光幕（文字层、舞台层都从它中间穿过） */}
      <div
        style={{
          position: 'absolute',
          left: -ext * 0.6,
          top: top + TRIGGER,
          width: W + ext * 1.2,
          height: STAGE_Z + 60,
          transformOrigin: '50% 0',
          transform: 'rotateX(90deg)',
          background: `linear-gradient(180deg, rgba(255,46,126,${0.32 * m}) 0%, rgba(255,46,126,${0.1 * m}) 55%, rgba(255,46,126,0) 100%)`,
        }}
      />
      {/* 触发线：激光 */}
      <div
        style={{
          position: 'absolute',
          left: -ext,
          top: top + TRIGGER - 5,
          width: W + 2 * ext,
          height: 10,
          background: `linear-gradient(90deg, rgba(255,46,126,0) 0%, rgba(255,46,126,${m}) 18%, rgba(255,140,180,${m}) 50%, rgba(255,46,126,${m}) 82%, rgba(255,46,126,0) 100%)`,
          boxShadow: `0 0 60px 14px rgba(255,46,126,${0.5 * m})`,
          transform: 'translateZ(4px)',
        }}
      />
    </div>
  );
};

/* ───────────── 02 结构：屏幕空间的标注（位置用 project() 从页面坐标算出来）───────────── */
const Label: React.FC<{x: number; y: number; ax: number; ay: number; t: string; sub: string; o: number; color?: string; align?: 'left' | 'right'}> = ({
  x,
  y,
  ax,
  ay,
  t,
  sub,
  o,
  color = WHITE,
  align = 'left',
}) => {
  const dx = x - ax;
  const dy = y - ay;
  const len = Math.hypot(dx, dy);
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (
    <>
      <div style={{position: 'absolute', left: ax, top: ay, width: len * o, height: 1.5, background: color, opacity: 0.7 * o, transformOrigin: '0 50%', transform: `rotate(${ang}deg)`}} />
      <div style={{position: 'absolute', left: ax - 6, top: ay - 6, width: 12, height: 12, borderRadius: 6, background: color, opacity: o, boxShadow: `0 0 16px ${color}`}} />
      <div
        style={{
          position: 'absolute',
          left: align === 'left' ? x + 14 : undefined,
          right: align === 'right' ? W - x + 14 : undefined,
          top: y - 26,
          opacity: o,
          textAlign: align,
          whiteSpace: 'nowrap',
        }}
      >
        <div style={{fontFamily: FONT.mono, fontWeight: 500, fontSize: 30, color}}>{t}</div>
        <div style={{fontFamily: FONT.sc, fontWeight: 500, fontSize: 22, color: GRAY, marginTop: 6}}>{sub}</div>
      </div>
    </>
  );
};

export const XrayOverlay: React.FC<{f: number; s: number; c: Cam; m: number}> = ({f, s, c, m}) => {
  if (m <= 0.001) return null;
  const o = (a: number) => c01((f - a) / 14) * c01((XRAY.out + 6 - f) / 10);
  const lift = STAGE_Z * m;
  const st = stickyY(AB, s);
  const pSec = project(c, -16, -16);
  const pStage = project(c, W, st, lift);
  const pVp = project(c, W + 10, s + VH, 2);
  const pTr = project(c, -560, s + TRIGGER, 4);
  // 舞台四角到视口四角的竖线：舞台“钉”在视口上
  const pins = [
    [0, 0],
    [W, 0],
    [0, VH],
    [W, VH],
  ].map(([x, y]) => [project(c, x, s + y, 2), project(c, x, st + y, lift)]);
  const pinO = c01((f - 214) / 14) * c01((XRAY.out + 4 - f) / 10);
  const pSteps = project(c, 164 + 112 * 6.2, DEF_LINE_Y[3], STEPS_Z * m);
  const status = f < 240 ? '往下滚' : f < 270 ? '倒着滚 · 手机也倒着变' : f < 300 ? '再滚一遍 · 位置决定画面' : '滚到底 · 舞台松开';
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <svg width={W} height={VH} style={{position: 'absolute', inset: 0}}>
        {pins.map(([a, b], i) => (
          <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#5AB0FF" strokeWidth={2} strokeDasharray="6 7" opacity={0.85 * pinO} />
        ))}
      </svg>
      <Label x={pSteps.x + 60} y={pSteps.y + 50} ax={pSteps.x} ay={pSteps.y} t="steps" sub="步骤 · 跟着页面滚" o={o(240)} />
      <Label x={pSec.x - 30} y={pSec.y + 56} ax={pSec.x} ay={pSec.y} t="<section>" sub="高 300vh · 三屏" o={o(222)} align="right" />
      <Label x={pStage.x + 70} y={pStage.y - 40} ax={pStage.x} ay={pStage.y} t="position: sticky" sub="舞台 · 钉在视口顶" o={o(228)} color="#5AB0FF" />
      <Label x={pVp.x + 80} y={pVp.y + 30} ax={pVp.x} ay={pVp.y} t="viewport" sub="视口 · 100vh" o={o(232)} />
      <Label x={pTr.x - 24} y={pTr.y - 76} ax={pTr.x} ay={pTr.y} t="trigger · 50%" sub="触发线" o={o(236)} color="#FF5C9A" align="right" />
      {/* 标题 */}
      <div style={{position: 'absolute', left: 120, top: 120, opacity: c01((f - 226) / 12) * c01((XRAY.out + 10 - f) / 12)}}>
        <Eyebrow n="02">结构</Eyebrow>
        <div style={{fontFamily: FONT.sc, fontWeight: 700, fontSize: 76, lineHeight: 1.18, color: WHITE, marginTop: 30, letterSpacing: '-0.01em'}}>
          一段很高的区块，
          <br />
          <Grad>钉着一个舞台。</Grad>
        </div>
      </div>
      {/* scrollY 读数 */}
      <div style={{position: 'absolute', left: 124, bottom: 110, opacity: c01((f - 224) / 12) * c01((XRAY.out + 10 - f) / 12)}}>
        <div style={{fontFamily: FONT.mono, fontSize: 24, color: GRAY, letterSpacing: '0.08em'}}>scrollY</div>
        <div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: 120, color: WHITE, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1.05}}>
          {Math.round(s).toLocaleString('en-US')}
        </div>
        <div style={{fontFamily: FONT.sc, fontWeight: 500, fontSize: 28, color: f >= 240 && f < 270 ? '#FF5C9A' : GRAY, marginTop: 8}}>{status}</div>
      </div>
    </div>
  );
};
export {S};
