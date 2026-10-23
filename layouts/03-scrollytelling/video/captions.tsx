/** 左栏的字：每一段一块（排法名 + 一句话 + 出处），底下是“五条规则”清单，演到哪条亮哪条 */
import React from 'react';
import {Img, staticFile} from 'remotion';
import {C, FONT, gradCss} from '../tokens';
import {A, BREAK_AT, c01, eo5, mainScroll, viewport} from './page';

const X = 88;
const COLW = 500;
const grad: React.CSSProperties = {background: gradCss(90), WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'};

/** 一行字：从下面浮上来、去模糊；离场时往上淡出 */
const Line: React.FC<{f: number; at: number; out: number; i: number; y: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  f,
  at,
  out,
  i,
  y,
  children,
  style,
}) => {
  const tin = eo5((f - at - i * 4) / 26);
  const tout = c01((f - out) / 12);
  const op = tin * (1 - tout);
  if (op <= 0.001) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: X,
        top: y,
        width: COLW,
        opacity: op,
        transform: `translateY(${(1 - tin) * 34 - tout * 18}px)`,
        filter: tin < 0.98 ? `blur(${(1 - tin) * 9}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

type Blk = {at: number; out: number; eyebrow: string; title: string; serif: string; desc: string; src?: string};
const BLOCKS: Blk[] = [
  {at: -8, out: 86, eyebrow: 'DESIGN STYLE · 布局 03', title: '滚动叙事', serif: 'Scrollytelling', desc: '画面钉住，文字滚过。\n下面是一张真网页，直接滚给你看。'},
  {at: 92, out: 296, eyebrow: '排法 01 / 03', title: '并排', serif: 'Side-by-side', desc: '舞台钉在左边，\n文字一步一步从右边滚过。', src: '数据新闻 · 2014 Bostock · 2017 Scrollama'},
  {at: 304, out: 410, eyebrow: '拆开看 · X 光', title: '两层', serif: 'Sticky stage', desc: '上层：舞台 position: sticky，钉在视口里。\n下层：步骤一张张滚过触发线。', src: '倒着滚，画面就倒着变。'},
  {at: 414, out: 521, eyebrow: '排法 02 / 03', title: '覆盖', serif: 'Overlay', desc: '照片铺满整屏，\n卡片浮在上面滚过。', src: '长篇特稿 · 2012《纽约时报》Snow Fall'},
  {at: 527, out: 674, eyebrow: '排法 03 / 03', title: '逐帧', serif: 'Scrub', desc: '不按步骤，按进度：\n滚到哪，就画第几张图。', src: '产品页 · 苹果 AirPods Pro、iPhone'},
  {at: 694, out: 806, eyebrow: '同一份 HTML', title: '手机', serif: 'Responsive', desc: '窗口窄过 768px，并排自动改成覆盖：\n舞台铺满，卡片叠在上面。'},
];

const Block: React.FC<{f: number; b: Blk}> = ({f, b}) => (
  <>
    <Line f={f} at={b.at} out={b.out} i={0} y={150} style={{font: `500 15px ${FONT.mono}`, letterSpacing: '0.14em', color: C.t2}}>
      {b.eyebrow}
    </Line>
    <Line f={f} at={b.at} out={b.out} i={1} y={184} style={{font: `900 124px/1.1 ${FONT.sc}`, letterSpacing: '-0.02em', color: C.t1}}>
      {b.title}
    </Line>
    <Line f={f} at={b.at} out={b.out} i={2} y={330} style={{font: `italic 400 56px/1.1 ${FONT.serif}`}}>
      <span style={{...grad, paddingRight: 8}}>{b.serif}</span>
    </Line>
    <Line f={f} at={b.at} out={b.out} i={3} y={424} style={{font: `400 23px/1.6 ${FONT.sc}`, color: C.t2, whiteSpace: 'pre-line'}}>
      {b.desc}
    </Line>
    {b.src && (
      <Line f={f} at={b.at} out={b.out} i={4} y={520} style={{font: `500 15px/1.7 ${FONT.mono}`, color: '#6E6E73', whiteSpace: 'pre-line'}}>
        {b.src}
      </Line>
    )}
  </>
);

/** 五条规则：演到哪条亮哪条 */
export const RULES: {n: string; t: string; at: number}[] = [
  {n: '01', t: '钉住舞台，不劫持滚动', at: 110},
  {n: '02', t: '一步只变一件事', at: 160},
  {n: '03', t: '触发线放在视口中间', at: 214},
  {n: '04', t: '能倒着滚', at: 330},
  {n: '05', t: '手机上叠起来', at: BREAK_AT},
];
const Rules: React.FC<{f: number}> = ({f}) => {
  const tin = eo5((f - 96) / 26);
  const tout = c01((f - 806) / 14);
  if (tin * (1 - tout) < 0.001) return null;
  return (
    <div style={{position: 'absolute', left: X, top: 784, width: COLW, opacity: tin * (1 - tout), transform: `translateY(${(1 - tin) * 24}px)`}}>
      <div style={{font: `500 13px ${FONT.mono}`, letterSpacing: '0.16em', color: '#5A5A5F', marginBottom: 14}}>五条规则 · FIVE RULES</div>
      {RULES.map((r) => {
        const on = c01((f - r.at) / 10);
        const flash = Math.max(0, 1 - Math.abs(f - r.at - 6) / 14);
        return (
          <div key={r.n} style={{display: 'flex', alignItems: 'baseline', gap: 16, height: 38}}>
            <span style={{font: `600 16px ${FONT.mono}`, width: 26, ...(on > 0.5 ? grad : {color: '#3A3A3E'})}}>{r.n}</span>
            <span
              style={{
                font: `500 21px ${FONT.sc}`,
                color: `rgba(245,245,247,${0.22 + 0.78 * on})`,
                textShadow: flash > 0 ? `0 0 ${18 * flash}px rgba(255,92,154,${0.8 * flash})` : undefined,
                transform: `translateX(${(1 - on) * -6}px)`,
              }}
            >
              {r.t}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/** ③ 逐帧：72 张图里的 24 张缩略图 + 当前是第几张（和网页里的 canvas 同一个公式） */
const Thumbs: React.FC<{f: number}> = ({f}) => {
  const tin = eo5((f - 540) / 26);
  const tout = c01((f - 674) / 12);
  if (tin * (1 - tout) < 0.001) return null;
  const {y} = mainScroll(f);
  const p = c01((y - A.spin0) / (A.spin1 - A.spin0));
  const fi = Math.round(p * 71);
  return (
    <div style={{position: 'absolute', left: X, top: 590, opacity: tin * (1 - tout), transform: `translateY(${(1 - tin) * 24}px)`}}>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(12, 34px)', gap: 5}}>
        {Array.from({length: 24}, (_, i) => {
          const idx = i * 3;
          const on = Math.abs(fi - idx) <= 1;
          const past = idx <= fi;
          return (
            <div key={i} style={{width: 34, height: 42, borderRadius: 4, overflow: 'hidden', background: '#111', boxShadow: on ? '0 0 0 2px #FF2E7E, 0 0 16px rgba(255,46,126,.6)' : '0 0 0 1px rgba(255,255,255,.08)', opacity: past ? 1 : 0.35}}>
              <Img src={staticFile(`03-scrollytelling/demo/spin/${String(idx).padStart(3, '0')}.webp`)} style={{width: 34, height: 42, objectFit: 'cover', display: 'block'}} />
            </div>
          );
        })}
      </div>
      <div style={{marginTop: 16, font: `500 17px ${FONT.mono}`, color: C.t2}}>
        进度 <b style={{color: C.t1, fontWeight: 500}}>{p.toFixed(2)}</b> → 第 <b style={{...grad, fontWeight: 600}}>{String(fi + 1).padStart(2, '0')}</b> / 72 张
      </div>
    </div>
  );
};

/** 手机：视口宽度读数 + 两条 @media 规则，过断点那一拍切换 */
const Breakpoint: React.FC<{f: number}> = ({f}) => {
  const tin = eo5((f - 706) / 26);
  const tout = c01((f - 806) / 12);
  if (tin * (1 - tout) < 0.001) return null;
  const v = viewport(f);
  const after = f >= BREAK_AT;
  const flash = Math.max(0, 1 - Math.abs(f - BREAK_AT - 2) / 16);
  const row = (on: boolean, a: string, b: string) => (
    <div style={{display: 'flex', gap: 14, alignItems: 'baseline', height: 34, opacity: on ? 1 : 0.32}}>
      <span style={{font: `500 16px ${FONT.mono}`, color: on ? '#FF5C9A' : C.t2, width: 170}}>{a}</span>
      <span style={{font: `500 20px ${FONT.sc}`, color: C.t1}}>{b}</span>
    </div>
  );
  return (
    <div style={{position: 'absolute', left: X, top: 548, opacity: tin * (1 - tout), transform: `translateY(${(1 - tin) * 24}px)`}}>
      <div style={{font: `500 15px ${FONT.mono}`, letterSpacing: '0.12em', color: '#6E6E73'}}>视口 VIEWPORT</div>
      <div style={{font: `600 52px ${FONT.mono}`, color: C.t1, marginTop: 6, fontVariantNumeric: 'tabular-nums', textShadow: flash > 0 ? `0 0 ${30 * flash}px rgba(255,92,154,${flash})` : undefined}}>
        {v.vw} <span style={{color: '#5A5A5F'}}>×</span> {v.vh}
      </div>
      <div style={{marginTop: 18}}>
        {row(!after, '≥ 768px', '并排：舞台 7 : 文字 5')}
        {row(after, '< 768px', '覆盖：舞台铺满，卡片叠上')}
      </div>
    </div>
  );
};

/** 片尾 */
const End: React.FC<{f: number}> = ({f}) => (
  <>
    <Line f={f} at={822} out={999} i={0} y={250} style={{font: `500 15px ${FONT.mono}`, letterSpacing: '0.14em', color: C.t2}}>
      DESIGN STYLE · 布局 03
    </Line>
    <Line f={f} at={822} out={999} i={1} y={284} style={{font: `900 124px/1.1 ${FONT.sc}`, color: C.t1, letterSpacing: '-0.02em'}}>
      滚动叙事
    </Line>
    <Line f={f} at={822} out={999} i={2} y={430} style={{font: `italic 400 56px/1.1 ${FONT.serif}`}}>
      <span style={{...grad, paddingRight: 8}}>Scrollytelling</span>
    </Line>
    <Line f={f} at={846} out={999} i={0} y={560} style={{font: `700 34px/1.5 ${FONT.sc}`, color: C.t1}}>
      风格塑造视觉，
      <br />
      <span style={grad}>布局组织信息。</span>
    </Line>
    <Line f={f} at={858} out={999} i={0} y={700} style={{font: `500 15px ${FONT.mono}`, color: '#6E6E73'}}>
      同一份 HTML · 电脑并排 · 手机覆盖
    </Line>
  </>
);

export const Captions: React.FC<{f: number}> = ({f}) => (
  <>
    {BLOCKS.map((b, i) => (f >= b.at - 2 && f <= b.out + 14 ? <Block key={i} f={f} b={b} /> : null))}
    <Rules f={f} />
    <Thumbs f={f} />
    <Breakpoint f={f} />
    {f >= 818 && <End f={f} />}
  </>
);
