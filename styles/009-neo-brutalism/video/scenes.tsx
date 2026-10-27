/**
 * 2—10 秒 · 四章。全片的物理只有一条：阴影长度 = 离纸面的高度（z）。
 *   01 黑框（f120）黄底。一支笔一笔画过去，依次把六个默认样式组件框起来——框一个，变一个 → 画布向左甩出去
 *   02 硬影（f240）纸底。模糊 40 → 0；卡片抬起来再落下；再摊开成五层阶梯（4 / 8 / 14 / 24 / 40）→ 最高那张蓝卡撑满全屏
 *   03 按下（f360）蓝底。二十颗按钮落下；点一下，按压像水波一样扩散；再从角上来一波；f450 全部一起按下，颜色褪成混凝土
 *   04 来历（f480）同一面网格接着讲：1952 清水混凝土 → 2014 粗野主义网页（翻牌）→ 2021 新粗野主义（重新弹起来）；年份像里程表一样滚
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {E, clamp, tween} from '../../../src/lib/anim';
import {C, V} from '../tokens';
import {AT} from './timeline';
import {Box, Burst, Cursor, Dots, GLIDE, Typed, WHIP, appear, disp, grot, land, lerp, mono, press, sc, serif, slam} from './ui';

type CSS = React.CSSProperties;

// ───────── 左栏 ─────────

/** 左栏：章节筹码滑进来 → 大字一个字一个字落下 → 代码打出来 → 一句话。out：整栏向左甩出去的进度 */
const Label: React.FC<{f: number; at: number; n: string; en: string; zh: string; code: string[]; note: string; chip?: string; out?: number}> = ({f, at, n, en, zh, code, note, chip = C.ink, out = 0}) => {
  const y = 170;
  const k1 = tween(f, at, 12, 0, 1, GLIDE);
  return (
    <div style={{position: 'absolute', inset: 0, transform: `translateX(${out * -1100}px)`}}>
      <div style={{position: 'absolute', left: 96, top: y, height: 50, padding: '0 18px', display: 'flex', alignItems: 'center', background: chip, color: chip === C.ink ? C.paper : C.ink, border: `4px solid ${C.ink}`, transform: `translateX(${(1 - k1) * -500}px)`, ...mono(24, 700, 0.06)}}>
        {`${n} / ${en}`}
      </div>
      <div style={{position: 'absolute', left: 90, top: y + 70, display: 'flex'}}>
        {zh.split('').map((ch, i) => {
          const t = at + 4 + i * 4;
          if (f < t) return null;
          const k = tween(f, t, 9, 0, 1, E.out);
          return (
            <span key={i} style={{display: 'inline-block', transform: `translateY(${(1 - k) * -120}px) scale(${lerp(1.5, 1, k)})`, opacity: clamp((f - t) / 3), ...sc(200, 900, 0.02), color: C.ink, textShadow: `${lerp(30, 8, k)}px ${lerp(30, 8, k)}px 0 ${chip === C.ink ? C.white : chip}`}}>
              {ch}
            </span>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 96, top: y + 322, ...mono(40, 700), color: C.ink}}>
        {code.map((line, i) => (
          <div key={i}>
            <Typed f={f} at={at + 12 + i * 6} text={line} cps={3.4} caret={i === code.length - 1} />
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: 96, top: y + 340 + code.length * 50 + 14, opacity: appear(f, at + 22), transform: `translateY(${(1 - appear(f, at + 22, 10)) * 20}px)`, ...sc(42, 900, 0.04), color: C.ink}}>{note}</div>
    </div>
  );
};

// ───────── 01 黑框：一支笔 ─────────

const COMP = ['button', 'input', 'card', 'toggle', 'checkbox', 'chip'];
const CELL = {x0: 760, y0: 190, w: 328, h: 360, gx: 40, gy: 40};
const PEN = (i: number) => AT.border + 10 + i * 15; // 第 i 个组件开始被画
const HIT = (i: number) => PEN(i) + 11; // 画完：变身
/** 每个组件的轮廓（相对格子）：[x, y, w, h, 圆角] */
const OUTLINE: Record<string, [number, number, number, number, number][]> = {
  button: [[34, 130, 260, 96, 0]],
  input: [[30, 136, 268, 90, 0]],
  card: [[34, 40, 260, 280, 0]],
  toggle: [[64, 130, 200, 100, 50]],
  checkbox: [0, 1, 2].map((i) => [40, 70 + i * 76, 48, 48, 0] as [number, number, number, number, number]),
  chip: [[20, 136, 288, 88, 44]],
};
const cellXY = (i: number) => ({x: CELL.x0 + (i % 3) * (CELL.w + CELL.gx), y: CELL.y0 + Math.floor(i / 3) * (CELL.h + CELL.gy)});
/** 沿矩形周长（顺时针，从左上角起）走到 t 处的点 */
const onRect = (x: number, y: number, w: number, h: number, t: number) => {
  const L = 2 * (w + h);
  let d = ((t % 1) + 1) % 1 * L;
  if (d < w) return {x: x + d, y};
  d -= w;
  if (d < h) return {x: x + w, y: y + d};
  d -= h;
  if (d < w) return {x: x + w - d, y: y + h};
  d -= w;
  return {x, y: y + h - d};
};

/** 一个组件的“前 / 后”。k = 0 为默认样式，1 为新粗野主义 */
const Component: React.FC<{kind: string; k: number; f: number}> = ({kind, k, f}) => {
  const soft = '0 12px 28px rgba(30,30,60,0.18)';
  const bw = k ? V.border : 0;
  const base: CSS = {position: 'absolute', boxSizing: 'border-box'};
  const sys: CSS = {fontFamily: 'Liberation Sans, Arial, sans-serif'};
  switch (kind) {
    case 'button':
      return (
        <div style={{...base, left: 34, top: 130, width: 260, height: 96, borderRadius: k ? 0 : 16, background: k ? C.pink : '#6C63FF', border: `${bw}px solid ${C.ink}`, boxShadow: k ? undefined : soft, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          {k ? <span style={{...grot(40, 700)}}>SIGN UP →</span> : <span style={{...sys, fontSize: 34, color: '#fff', fontWeight: 600}}>Sign up</span>}
        </div>
      );
    case 'input':
      return (
        <>
          <div style={{...base, left: 30, top: 96, ...(k ? mono(22, 700) : {...sys, fontSize: 22, color: '#9A9AA5'})}}>{k ? 'EMAIL' : 'Email address'}</div>
          <div style={{...base, left: 30, top: 136, width: 268, height: 90, borderRadius: k ? 0 : 14, background: C.white, border: k ? `${bw}px solid ${C.ink}` : '2px solid #E1E1E8', boxShadow: k ? undefined : '0 4px 12px rgba(30,30,60,0.08)', display: 'flex', alignItems: 'center', paddingLeft: 22}}>
            {k ? <span style={{...mono(26, 700)}}>you@site.com</span> : <span style={{...sys, fontSize: 28, color: '#B5B5BF'}}>you@site.com</span>}
          </div>
        </>
      );
    case 'card':
      return (
        <div style={{...base, left: 34, top: 40, width: 260, height: 280, borderRadius: k ? 0 : 22, background: C.white, border: `${bw}px solid ${C.ink}`, boxShadow: k ? undefined : soft, overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 0, top: 0, right: 0, height: 150, background: k ? C.blue : 'linear-gradient(135deg, #ECECF2, #D3D3DE)', borderBottom: k ? `${V.border}px solid ${C.ink}` : undefined}}>
            {k ? (
              <svg width="248" height="144" style={{position: 'absolute', left: 0, top: 0}}>
                <circle cx="190" cy="44" r="22" fill={C.yellow} stroke={C.ink} strokeWidth="5" />
                <path d="M-10 150 L80 60 L150 130 L190 96 L270 150 Z" fill={C.lime} stroke={C.ink} strokeWidth="5" strokeLinejoin="round" />
              </svg>
            ) : null}
          </div>
          {k ? (
            <>
              <div style={{position: 'absolute', left: 20, top: 172, ...grot(32, 700)}}>Hello, world</div>
              <div style={{position: 'absolute', left: 20, top: 218, ...mono(20, 400)}}>2 min read →</div>
            </>
          ) : (
            <>
              <div style={{position: 'absolute', left: 22, top: 180, width: 180, height: 18, borderRadius: 9, background: '#DADAE2'}} />
              <div style={{position: 'absolute', left: 22, top: 216, width: 130, height: 14, borderRadius: 7, background: '#E8E8EE'}} />
            </>
          )}
        </div>
      );
    case 'toggle': {
      const on = k ? tween(f, HIT(3) + 4, 8, 0, 1, E.out) : 0;
      return (
        <div style={{...base, left: 64, top: 130, width: 200, height: 100, borderRadius: 50, background: k ? C.lime : '#E3E3EA', border: `${bw}px solid ${C.ink}`, boxShadow: k ? undefined : 'inset 0 2px 6px rgba(0,0,0,0.12)'}}>
          <div style={{position: 'absolute', top: k ? 8 : 10, left: lerp(k ? 8 : 10, 106, on), width: k ? 72 : 80, height: k ? 72 : 80, borderRadius: 40, background: C.white, border: `${bw}px solid ${C.ink}`, boxShadow: k ? undefined : '0 4px 10px rgba(0,0,0,0.25)'}} />
        </div>
      );
    }
    case 'checkbox':
      return (
        <>
          {['Grid', 'Border', 'Shadow'].map((t, i) => (
            <div key={i} style={{...base, left: 40, top: 70 + i * 76, display: 'flex', alignItems: 'center', gap: 20}}>
              <div style={{width: 48, height: 48, boxSizing: 'border-box', borderRadius: k ? 0 : 10, border: k ? `5px solid ${C.ink}` : '2px solid #C9C9D3', background: k && i < 2 ? C.ink : C.white, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                {k && i < 2 ? <svg width="28" height="24"><path d="M3 12 L11 20 L25 4" fill="none" stroke={C.yellow} strokeWidth="6" /></svg> : null}
              </div>
              <span style={k ? grot(34, 700) : {...sys, fontSize: 30, color: '#8D8D99'}}>{t}</span>
            </div>
          ))}
        </>
      );
    default:
      return (
        <div style={{...base, left: 20, top: 136, width: 288, height: 88, borderRadius: 44, background: k ? C.white : '#EEEEF3', border: `${bw}px solid ${C.ink}`, boxShadow: k ? undefined : soft, display: 'flex', alignItems: 'center', gap: 16, paddingLeft: 12}}>
          <div style={{width: 60, height: 60, boxSizing: 'border-box', borderRadius: 30, background: k ? C.orange : '#C9C9D6', border: `${k ? 5 : 0}px solid ${C.ink}`}} />
          <span style={k ? grot(30, 700) : {...sys, fontSize: 28, color: '#6E6E7A'}}>@guanmo_ai</span>
        </div>
      );
  }
};

const pillPath = (x: number, y: number, w: number, h: number, r: number) =>
  r <= 0
    ? `M${x} ${y} H${x + w} V${y + h} H${x} Z`
    : `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`;

export const Borders: React.FC<{f: number; dx?: number}> = ({f, dx = 0}) => {
  const strokes: React.ReactNode[] = [];
  let pen: {x: number; y: number} | null = null;
  COMP.forEach((kind, i) => {
    const c = cellXY(i);
    const shapes = OUTLINE[kind];
    const t0 = PEN(i);
    const t1 = HIT(i);
    if (f >= t0 && f < t1) {
      const prog = (f - t0) / (t1 - t0);
      shapes.forEach(([x, y, w, h, r], j) => {
        const a = j / shapes.length;
        const q = clamp((prog - a) * shapes.length);
        if (q <= 0) return;
        strokes.push(<path key={`${i}-${j}`} d={pillPath(c.x + x, c.y + y, w, h, r)} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - q} fill="none" stroke={C.ink} strokeWidth={V.border} strokeLinejoin="miter" />);
        if (q < 1 || j === shapes.length - 1) pen = onRect(c.x + x, c.y + y, w, h, q);
      });
    }
    // 两个组件之间：笔尖飞到下一个的起点
    if (i < COMP.length - 1 && f >= t1 && f < PEN(i + 1)) {
      const [x0, y0] = shapes[0];
      const nx = cellXY(i + 1);
      const [x1, y1] = OUTLINE[COMP[i + 1]][0];
      const k = E.inOut(clamp((f - t1) / (PEN(i + 1) - t1)));
      pen = {x: lerp(c.x + x0, nx.x + x1, k), y: lerp(c.y + y0, nx.y + y1, k)};
    }
  });
  const penOn = f >= PEN(0) - 4 && f < HIT(COMP.length - 1) + 4;
  const p0 = cellXY(0);
  if (f < PEN(0)) pen = {x: lerp(1960, p0.x + 34, tween(f, PEN(0) - 10, 10, 0, 1, E.out)), y: lerp(1140, p0.y + 130, tween(f, PEN(0) - 10, 10, 0, 1, E.out))};
  return (
    <AbsoluteFill style={{background: C.yellow, transform: `translateX(${dx}px)`}}>
      <Dots opacity={0.14} />
      <Label f={f} at={AT.border} n="01" en="BORDER" zh="黑框" code={['border: 6px solid #000;', 'border-radius: 0;']} note="一笔描到底，圆角归零" />
      {COMP.map((kind, i) => {
        const {x, y} = cellXY(i);
        const hit = HIT(i);
        const k = f >= hit ? 1 : 0;
        const pop = f >= hit ? lerp(1.08, 1, tween(f, hit, 10, 0, 1, E.out)) : 1;
        return (
          <div key={kind} style={{position: 'absolute', left: x, top: y, width: CELL.w, height: CELL.h}}>
            <div style={{position: 'absolute', inset: 0, border: `2px dashed rgba(0,0,0,0.35)`, background: 'rgba(255,255,255,0.35)'}} />
            <div style={{position: 'absolute', inset: 0, transform: `scale(${pop})`}}>
              <Component kind={kind} k={k} f={f} />
            </div>
            <div style={{position: 'absolute', left: 12, bottom: 8, ...mono(24, 700), color: C.ink}}>
              {kind}
              <span style={{opacity: k ? 1 : 0.4}}>{k ? ' · 6px #000' : ' · default'}</span>
            </div>
          </div>
        );
      })}
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {strokes}
        {penOn && pen && (
          <g transform={`translate(${(pen as {x: number; y: number}).x} ${(pen as {x: number; y: number}).y})`}>
            <circle r={16} fill={C.ink} />
            <circle r={6} fill={C.yellow} />
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

// ───────── 02 硬影：抬起来、落下去、摊成阶梯 ─────────

const MAIN = {x: 760, y: 200, w: 560, h: 330};
const STAIR = [
  {fill: C.pink, z: 8},
  {fill: C.lime, z: 14},
  {fill: C.orange, z: 24},
  {fill: C.blue, z: 40},
];
const STEP = {x: 104, y: 118};

const Slider: React.FC<{x: number; y: number; label: string; v: number; max: number; hot?: boolean}> = ({x, y, label, v, max, hot}) => {
  const p = clamp(v / max);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 520}}>
      <div style={{display: 'flex', justifyContent: 'space-between', ...mono(30, 700)}}>
        <span>{label}</span>
        <span style={{background: hot ? C.yellow : 'transparent', padding: '0 8px'}}>{`${Math.round(v)}px`}</span>
      </div>
      <div style={{position: 'relative', marginTop: 14, height: 26, border: `4px solid ${C.ink}`, background: C.white}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${p * 100}%`, background: C.ink}} />
        <div style={{position: 'absolute', left: `calc(${p * 100}% - 22px)`, top: -16, width: 44, height: 50, boxSizing: 'border-box', background: C.pink, border: `4px solid ${C.ink}`, boxShadow: `4px 4px 0 ${C.ink}`}} />
      </div>
    </div>
  );
};

export const Shadows: React.FC<{f: number; dx?: number}> = ({f, dx = 0}) => {
  const a = AT.shadow;
  const blur = lerp(40, 0, tween(f, a + 2, 28, 0, 1, E.inOut));
  const soft = clamp(blur / 40);
  const k = 1 - soft;
  // 主卡片的高度：14 → 抬到 52 → 落回 14 → 阶梯摊开时退到 4
  let z = 14;
  if (f >= a + 32 && f < a + 60) z = lerp(14, 52, tween(f, a + 32, 16, 0, 1, GLIDE));
  if (f >= a + 60) z = land(f, a + 60, 14, 52);
  if (f >= a + 64) z = lerp(z, 4, tween(f, a + 64, 14, 0, 1, GLIDE));
  const off = lerp(0, 14, k);
  const softCss = soft > 0.001 ? `${off}px ${lerp(30, off, k)}px ${blur}px rgba(0,0,0,${lerp(0.3, 1, k)})` : undefined;
  const expand = tween(f, AT.press - 14, 14, 0, 1, WHIP);
  return (
    <AbsoluteFill style={{background: C.paper, transform: `translateX(${dx}px)`}}>
      <Dots />
      <Label f={f} at={a} n="02" en="SHADOW" zh="硬影" code={['box-shadow:', '  14px 14px 0 #000;']} note="模糊永远是 0" chip={C.yellow} />
      <Slider x={96} y={760} label="blur" v={blur} max={40} hot={blur < 0.5} />
      {f >= a + 74 && (
        <Box x={96} y={880} w={560} h={104} fill={C.yellow} shadow={10} z={land(f, a + 76, 10, 60)} rot={-2} scale={lerp(1.25, 1, tween(f, a + 74, 8, 0, 1, E.out))} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <span style={{...sc(54, 900)}}>层级 = 偏移量</span>
        </Box>
      )}
      {/* 主卡片 */}
      <Box x={MAIN.x} y={MAIN.y} w={MAIN.w} h={MAIN.h} fill={C.white} shadow={14} z={softCss ? undefined : z} softShadow={softCss}>
        <div style={{position: 'absolute', left: 38, top: 56, ...disp(84, 112), color: C.ink}}>SHADOW</div>
        <div style={{position: 'absolute', left: 42, top: 180, ...sc(42, 900), color: C.ink}}>阴影 = 偏移的黑块</div>
        <div style={{position: 'absolute', left: 42, top: 256, ...mono(28, 700), color: C.ink}}>{softCss ? `blur ${Math.round(blur)}px` : `z = ${Math.round(z)}px · blur 0`}</div>
      </Box>
      {/* 抬起来时的高度标注 */}
      {f >= a + 34 && f < a + 66 && (
        <div style={{position: 'absolute', left: MAIN.x + MAIN.w + 30, top: MAIN.y + MAIN.h - 40, opacity: appear(f, a + 34, 6) * (1 - tween(f, a + 60, 6)), background: C.ink, color: C.yellow, padding: '6px 16px', ...mono(40, 700)}}>
          {`↑ z ${Math.round(z)}px`}
        </div>
      )}
      {/* 阶梯 */}
      {STAIR.map((s, j0) => {
        const j = j0 + 1;
        const t = a + 64 + j0 * 5;
        if (f < t) return null;
        const m = tween(f, t, 14, 0, 1, GLIDE);
        const zz = f < t + 14 ? s.z + 30 : land(f, t + 14, s.z, s.z + 30);
        const last = j0 === STAIR.length - 1;
        const g = {x: lerp(MAIN.x, MAIN.x + j * STEP.x, m), y: lerp(MAIN.y, MAIN.y + j * STEP.y, m), w: MAIN.w, h: MAIN.h};
        const e = last ? expand : 0;
        const box = {x: lerp(g.x, -V.border, e), y: lerp(g.y, -V.border, e), w: lerp(g.w, 1920 + 2 * V.border, e), h: lerp(g.h, 1080 + 2 * V.border, e)};
        return (
          <Box key={j} x={box.x} y={box.y} w={box.w} h={box.h} fill={s.fill} shadow={s.z} z={zz * (1 - e)}>
            <div style={{position: 'absolute', left: 26, top: 22, opacity: 1 - e, ...mono(52, 700)}}>{`${s.z}px`}</div>
          </Box>
        );
      })}
    </AbsoluteFill>
  );
};

// ───────── 03 按下 + 04 来历：同一面网格 ─────────

const G = {x: 720, y: 190, w: 1104, h: 760, cols: 5, rows: 4};
const CW = G.w / G.cols;
const CH = G.h / G.rows;
const IN = 14; // 按钮在格子里的内缩
const CLICK1 = {at: AT.press + 36, c: 2, r: 1};
const CLICK2 = {at: AT.press + 66, c: 4, r: 3};
const ALL = AT.press + 90; // f450：按一颗，全部按下
const ERA = [
  {at: AT.lineage, year: '1952', zh: '清水混凝土', en: 'BÉTON BRUT', note: ['勒·柯布西耶 · 马赛公寓', '材料不粉饰，结构露在外面']},
  {at: AT.lineage + 40, year: '2014', zh: '粗野主义网页', en: 'BRUTALIST WEB', note: ['brutalistwebsites.com', '浏览器默认样式，原样上线']},
  {at: AT.lineage + 76, year: '2021', zh: '新粗野主义', en: 'NEO-BRUTALISM', note: ['Gumroad 等产品带进主流', '黑框、硬影、平涂——还好用']},
];

const WEB = ['index', 'about', 'work', 'blog', 'contact', '<table>', 'Times', 'links', 'raw', 'html', '1px', 'serif', 'home', 'news', 'faq', 'shop', 'zine', 'radio', 'tags', 'rss'];
const UI_BITS = ['¥', '★', '→', '62%', '9:41', 'OK', '+', '✓', 'NEW', '♪', '24px', '01', 'Aa', '#000', 'A+', '●', '↗', '?', 'GO', '∞'];
const LOGGIA = [C.orange, C.yellow, C.blue, C.lime];
const FILLS = [C.yellow, C.pink, C.lime, C.blue, C.orange, C.white];


/** 里程表：四位数各自滚到下一个年份（9 → 0 往上滚，不倒回去） */
const ODO = [
  [1, 9, 5, 2],
  [2, 10, 11, 4],
  [2, 10, 12, 11],
];
const Odometer: React.FC<{f: number; x: number; y: number}> = ({f, x, y}) => {
  const H = 200;
  return (
    <div style={{position: 'absolute', left: x, top: y, display: 'flex', gap: 4}}>
      {[0, 1, 2, 3].map((i) => {
        let v = ODO[0][i];
        for (let e = 1; e < ODO.length; e++) {
          const t = ERA[e].at + i * 2;
          if (f >= t) v += (ODO[e][i] - ODO[e - 1][i]) * tween(f, t, 14, 0, 1, GLIDE);
        }
        return (
          <div key={i} style={{width: 150, height: H, overflow: 'hidden', position: 'relative'}}>
            <div style={{position: 'absolute', left: 0, top: -v * H}}>
              {Array.from({length: 20}, (_, d) => (
                <div key={d} style={{height: H, display: 'flex', alignItems: 'center', ...disp(200, 112, 0), color: C.ink}}>
                  {d % 10}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const mix = (a: string, b: string, t: number) => (t <= 0 ? a : t >= 1 ? b : `color-mix(in srgb, ${b} ${t * 100}%, ${a})`);

export const Grid: React.FC<{f: number}> = ({f}) => {
  const a = AT.press;
  const drain = tween(f, ALL + 2, 18, 0, 1, E.inOut); // 按钮褪成混凝土
  const bgK = tween(f, ALL + 6, 20, 0, 1, E.inOut); // 蓝底 → 纸
  const wall = tween(f, ALL + 12, 16, 0, 1, E.inOut); // 墙面和窗洞出现（和褪色交叠）
  const web = tween(f, ERA[1].at, 10, 0, 1, E.out);
  const pop = tween(f, ERA[2].at, 12, 0, 1, E.out);
  const labelOut = tween(f, ALL + 8, 14, 0, 1, WHIP);
  // 光标：进场 → 点第一颗 → 点角上那颗 → 回到中间按下全部
  const cc = (c: number, r: number) => ({x: G.x + (c + 0.5) * CW, y: G.y + (r + 0.5) * CH});
  const P1 = cc(CLICK1.c, CLICK1.r);
  const P2 = cc(CLICK2.c, CLICK2.r);
  const P3 = cc(2, 2);
  let cur = {x: 1960, y: 1140};
  const seg = (t0: number, t1: number, A: {x: number; y: number}, B: {x: number; y: number}) => {
    if (f >= t0) {
      const k = tween(f, t0, t1 - t0, 0, 1, GLIDE);
      cur = {x: lerp(A.x, B.x, k), y: lerp(A.y, B.y, k)};
    }
  };
  seg(a + 22, CLICK1.at - 2, {x: 1960, y: 1140}, P1);
  seg(CLICK1.at + 8, CLICK2.at - 2, P1, P2);
  seg(CLICK2.at + 8, ALL - 2, P2, P3);
  const curP = Math.max(press(f, CLICK1.at, 3), press(f, CLICK2.at, 3), press(f, ALL, 99, false));
  const curO = 1 - tween(f, ALL + 10, 6);
  // 方形的水波
  const ring = (at: number, P: {x: number; y: number}) => {
    const t = (f - at) / 30;
    if (t < 0 || t > 1) return null;
    const s = 60 + 1400 * E.out(t);
    return <div style={{position: 'absolute', left: P.x - s / 2, top: P.y - s / 2, width: s, height: s, border: `8px solid ${C.ink}`, opacity: 0.6 * (1 - t) * (1 - t)}} />;
  };
  let era = 0;
  ERA.forEach((e, i) => {
    if (f >= e.at) era = i;
  });
  const lineageIn = tween(f, ALL + 24, 14, 0, 1, GLIDE);
  return (
    <AbsoluteFill style={{background: mix(C.blue, C.paper, bgK)}}>
      <Dots opacity={lerp(0.2, 0.16, bgK)} />
      {labelOut < 1 && (
        <Label f={f} at={a} n="03" en="PRESS" zh="按下" code={[':active {', '  translate: 14px 14px;', '  box-shadow: none;', '}']} note="位移 = 阴影，阴影 → 0" chip={C.yellow} out={labelOut} />
      )}
      {/* 04 来历的左栏 */}
      {lineageIn > 0 && (
        <div style={{position: 'absolute', inset: 0, transform: `translateX(${(1 - lineageIn) * -900}px)`}}>
          <div style={{position: 'absolute', left: 96, top: 170, height: 50, padding: '0 18px', display: 'flex', alignItems: 'center', background: C.ink, color: C.paper, ...mono(24, 700, 0.06)}}>04 / LINEAGE</div>
          <Odometer f={f} x={86} y={240} />
          {ERA.map((e, i) => {
            // 标题等里程表滚到一半再换
            const show = tween(f, e.at + 6, 10, 0, 1, E.out) * (i < ERA.length - 1 ? 1 - tween(f, ERA[i + 1].at + 2, 6) : 1);
            if (show <= 0.001 || (i === 0 && f < ALL + 24)) return null;
            return (
              <div key={i} style={{position: 'absolute', left: 96, top: 470, opacity: show, transform: `translateY(${(1 - show) * 30}px)`}}>
                <div style={{...sc(72, 900), color: C.ink}}>{e.zh}</div>
                <div style={{marginTop: 14, ...grot(32, 700, 0.06), color: C.ink}}>{e.en}</div>
                <div style={{marginTop: 30, ...sc(34, 700), lineHeight: 1.5, color: C.ink}}>
                  {e.note.map((n) => (
                    <div key={n}>{n}</div>
                  ))}
                </div>
              </div>
            );
          })}
          <div style={{position: 'absolute', left: 96, top: 900, display: 'flex', gap: 14}}>
            {ERA.map((e, i) => (
              <div key={i} style={{padding: '6px 14px', border: `4px solid ${C.ink}`, background: i === era ? C.yellow : i < era ? C.ink : C.white, color: i < era ? C.paper : C.ink, ...mono(26, 700)}}>{e.year}</div>
            ))}
          </div>
        </div>
      )}
      {/* 墙面：1952 */}
      <div style={{position: 'absolute', left: G.x, top: G.y, width: G.w, height: G.h, opacity: wall * (1 - web), background: C.concrete}}>
        <svg width={G.w} height={G.h} style={{position: 'absolute', inset: 0}}>
          <filter id="cnc">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="52" />
            <feColorMatrix values="0 0 0 0 0.25  0 0 0 0 0.24  0 0 0 0 0.22  0 0 0 0.55 0" />
          </filter>
          <rect width={G.w} height={G.h} filter="url(#cnc)" />
          {Array.from({length: 26}, (_, i) => (
            <line key={i} x1={0} x2={G.w} y1={i * 30 + 6} y2={i * 30 + 6} stroke="#00000018" strokeWidth={2} />
          ))}
        </svg>
      </div>
      {/* 2014：表格 */}
      <div style={{position: 'absolute', left: G.x, top: G.y, width: G.w, height: G.h, opacity: web * (1 - pop), background: C.white, border: `2px solid ${C.ink}`}} />
      {Array.from({length: G.cols * G.rows}, (_, n) => {
        const c = n % G.cols;
        const r = Math.floor(n / G.cols);
        const x = G.x + c * CW;
        const y = G.y + r * CH;
        const d = (c + r) * 2;
        const landAt = a + 2 + (c + r) * 2.2 + 12;
        const tB = f - ERA[1].at - d;
        const tC = f - ERA[2].at - d;
        // 2021：重新弹起来
        if (tC >= 0) {
          const z = land(f, ERA[2].at + d, 10, 0);
          return (
            <Box key={n} x={x + IN} y={y + IN} w={CW - 2 * IN} h={CH - 2 * IN} fill={FILLS[(c * 3 + r * 2) % FILLS.length]} shadow={10} z={Math.max(0, z)} rot={((c + r) % 3 === 0 ? 1.5 : 0) * clamp(tC / 10)} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <span style={{...grot(n % 4 === 0 ? 70 : 50, 700)}}>{UI_BITS[n]}</span>
            </Box>
          );
        }
        // 2014：翻牌成网页表格
        if (tB >= 0) {
          const sx = tB < 4 ? 1 - tB / 4 : clamp((tB - 4) / 4);
          if (tB < 4) {
            return <Window key={n} x={x} y={y} sx={sx} c={c} r={r} />;
          }
          return (
            <div key={n} style={{position: 'absolute', left: x, top: y, width: CW, height: CH, boxSizing: 'border-box', border: `1px solid ${C.ink}`, transform: `scaleX(${sx})`, padding: 14, background: C.white}}>
              <div style={{...serif(32, 700)}}>{WEB[n].startsWith('<') ? WEB[n] : WEB[n][0].toUpperCase() + WEB[n].slice(1)}</div>
              <div style={{...serif(24), color: C.link, textDecoration: 'underline', marginTop: 8}}>{WEB[(n + 7) % WEB.length]}</div>
              <div style={{...serif(24), color: C.link, textDecoration: 'underline'}}>{WEB[(n + 13) % WEB.length]}</div>
            </div>
          );
        }
        // 1952：按下去的按钮褪成混凝土，窗洞同时长出来（交叠，不留空白）
        if (wall >= 1) return <Window key={n} x={x} y={y} sx={1} c={c} r={r} />;
        // 03：按钮
        if (f < landAt - 12) return null;
        const m = tween(f, landAt - 12, 12, 0, 1, GLIDE);
        const dist1 = Math.hypot(c - CLICK1.c, r - CLICK1.r);
        const dist2 = Math.hypot(c - CLICK2.c, r - CLICK2.r);
        const p = Math.max(press(f, CLICK1.at + dist1 * 3, 3), press(f, CLICK2.at + dist2 * 3, 3), press(f, ALL + Math.hypot(c - 2, r - 2) * 1.2, 999, false));
        const z = (f < landAt ? 60 : land(f, landAt, 10, 60)) * (1 - p);
        const fill = mix(FILLS[(c * 3 + r * 2) % FILLS.length], C.concrete, drain);
        return (
          <div key={n} style={{position: 'absolute', inset: 0}}>
            {wall > 0 && (
              <div style={{position: 'absolute', inset: 0, opacity: wall}}>
                <Window x={x} y={y} sx={1} c={c} r={r} />
              </div>
            )}
            <div style={{position: 'absolute', inset: 0, opacity: 1 - wall}}>
            <Box x={x + IN} y={lerp(y + IN - 900, y + IN, m)} w={CW - 2 * IN} h={CH - 2 * IN} fill={fill} shadow={10} z={z} border={lerp(V.border, 0, drain)} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <span style={{...grot(n % 4 === 0 ? 70 : 50, 700), opacity: 1 - drain}}>{UI_BITS[n]}</span>
            </Box>
            </div>
          </div>
        );
      })}
      {ring(CLICK1.at, P1)}
      {ring(CLICK2.at, P2)}
      <Burst x={P1.x} y={P1.y} f={f} at={CLICK1.at} />
      <Burst x={P2.x} y={P2.y} f={f} at={CLICK2.at} />
      <Burst x={P3.x} y={P3.y} f={f} at={ALL} />
      {f >= a + 22 && curO > 0 && <Cursor x={cur.x} y={cur.y} p={curP} opacity={curO} />}
    </AbsoluteFill>
  );
};

/** 马赛公寓的一格：窗洞 + 阳台板 + 彩色侧墙 */
const Window: React.FC<{x: number; y: number; sx: number; c: number; r: number}> = ({x, y, sx, c, r}) => {
  const lg = (c * 7 + r * 3) % 5 < 2 ? LOGGIA[(c + r) % 4] : null;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: CW, height: CH, transform: `scaleX(${sx})`}}>
      <div style={{position: 'absolute', left: 18, top: 16, right: 18, bottom: 36, background: '#3B3934', boxShadow: 'inset 12px 12px 0 #2A2925'}} />
      {lg && <div style={{position: 'absolute', left: 18, top: 16, width: 36, bottom: 36, background: lg}} />}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 14, height: 22, background: C.concreteDark}} />
    </div>
  );
};
