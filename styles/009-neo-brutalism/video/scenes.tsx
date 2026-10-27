/**
 * 2—10 秒 · 四章。全片的物理只有一条：阴影长度 = 离纸面的高度（z）。
 *   01 黑框（f120）黄底。画面是空的：一支笔先画框，颜色灌满、文字弹出、阴影落下——元素一个个从框里长出来，拼成一张注册表单 → 画布向左甩出去
 *   02 硬影（f270）纸底。模糊 40 → 0；卡片抬起来再落下；再摊开成五层阶梯（4 / 8 / 14 / 24 / 40）→ 最高那张蓝卡撑满全屏
 *   03 按下（f420）蓝底。二十颗按钮落下；点一下，按压像水波一样扩散；再从角上来一波；按一颗全部按下，颜色褪成混凝土
 *   04 来历（f570）同一面网格接着讲：1952 清水混凝土 → 2014 粗野主义网页（翻牌）→ 2021 新粗野主义（重新弹起来）；年份像里程表一样滚
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

// ───────── 01 黑框：先画框，元素从框里长出来 ─────────

/** 沿矩形周长（顺时针，从左上角起）走到 t 处的点 */
const onRect = (x: number, y: number, w: number, h: number, t: number) => {
  const L = 2 * (w + h);
  let d = (((t % 1) + 1) % 1) * L;
  if (d < w) return {x: x + d, y};
  d -= w;
  if (d < h) return {x: x + w, y: y + d};
  d -= h;
  if (d < w) return {x: x + w - d, y: y + h};
  d -= w;
  return {x, y: y + h - d};
};
const pillPath = (x: number, y: number, w: number, h: number, r: number) =>
  r <= 0
    ? `M${x} ${y} H${x + w} V${y + h} H${x} Z`
    : `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`;

const PANEL = {x: 800, y: 150, w: 1000, h: 830};
const px = (dx: number) => PANEL.x + dx;
const py = (dy: number) => PANEL.y + dy;
type Stroke = {key: string; t0: number; d: number; x: number; y: number; w: number; h: number; r: number};
const B = AT.border;
/** 笔画的顺序：表单外框 → 输入框 → 开关 → 三个复选框 → 按钮 */
const STROKES: Stroke[] = [
  {key: 'panel', t0: B + 8, d: 18, x: PANEL.x, y: PANEL.y, w: PANEL.w, h: PANEL.h, r: 0},
  {key: 'input', t0: B + 38, d: 12, x: px(50), y: py(180), w: 900, h: 110, r: 0},
  {key: 'toggle', t0: B + 58, d: 10, x: px(50), y: py(340), w: 190, h: 96, r: 48},
  ...[0, 1, 2].map((i) => ({key: `check${i}`, t0: B + 78 + i * 5, d: 5, x: px(50 + i * 300), y: py(490), w: 60, h: 60, r: 0})),
  {key: 'button', t0: B + 98, d: 12, x: px(50), y: py(630), w: 470, h: 130, r: 0},
];
const S = Object.fromEntries(STROKES.map((s) => [s.key, s])) as Record<string, Stroke>;
const done = (k: string) => S[k].t0 + S[k].d;
const CLICK = B + 124;

/** 颜色从左往右灌满一个刚画好的框 */
const Flood: React.FC<{f: number; at: number; color: string; d?: number}> = ({f, at, color, d = 6}) => {
  const k = tween(f, at, d, 0, 1, E.out);
  return <div style={{position: 'absolute', inset: 0, background: color, clipPath: `inset(0 ${(1 - k) * 100}% 0 0)`}} />;
};
/** 一个字一个字地弹出来 */
const PopText: React.FC<{f: number; at: number; text: string; style: CSS; step?: number}> = ({f, at, text, style, step = 1}) => (
  <span style={{display: 'inline-flex', whiteSpace: 'pre'}}>
    {text.split('').map((c0, i) => {
      const ch = c0 === ' ' ? '\u00A0' : c0;
      const t = at + i * step;
      const k = tween(f, t, 7, 0, 1, E.out);
      return (
        <span key={i} style={{...style, display: 'inline-block', opacity: f < t ? 0 : 1, transform: `translateY(${(1 - k) * 40}px) scale(${lerp(1.4, 1, k)})`}}>
          {ch}
        </span>
      );
    })}
  </span>
);

export const Borders: React.FC<{f: number; dx?: number}> = ({f, dx = 0}) => {
  // 笔尖：画到哪里；两笔之间飞过去；第一笔之前从右下角进来
  let pen: {x: number; y: number} | null = null;
  STROKES.forEach((s, i) => {
    if (f >= s.t0 && f < s.t0 + s.d) pen = onRect(s.x, s.y, s.w, s.h, (f - s.t0) / s.d);
    const n = STROKES[i + 1];
    if (n && f >= s.t0 + s.d && f < n.t0) {
      const k = E.inOut(clamp((f - s.t0 - s.d) / (n.t0 - s.t0 - s.d)));
      pen = {x: lerp(s.x, n.x, k), y: lerp(s.y, n.y, k)};
    }
  });
  const first = STROKES[0];
  if (f < first.t0) {
    const k = tween(f, B - 4, 12, 0, 1, GLIDE);
    pen = {x: lerp(1980, first.x, k), y: lerp(1140, first.y, k)};
  }
  const last = STROKES[STROKES.length - 1];
  const penO = 1 - tween(f, last.t0 + last.d, 6);
  const drawing = STROKES.filter((s) => f >= s.t0 && f < s.t0 + s.d);
  // 光标按“注册”
  const curK = tween(f, B + 112, 10, 0, 1, GLIDE);
  const btn = S.button;
  const target = {x: btn.x + btn.w * 0.72, y: btn.y + btn.h * 0.6};
  const cp = press(f, CLICK, 6);
  const on = (k: string) => f >= done(k);
  const knob = tween(f, done('toggle') + 10, 8, 0, 1, E.inOut);
  return (
    <AbsoluteFill style={{background: C.yellow, transform: `translateX(${dx}px)`}}>
      <Dots opacity={0.14} />
      <Label f={f} at={B} n="01" en="BORDER" zh="黑框" code={['border: 6px solid #000;', 'border-radius: 0;']} note="先有框，才有元素" />
      {/* 表单外框 */}
      {on('panel') && (
        <Box x={PANEL.x} y={PANEL.y} w={PANEL.w} h={PANEL.h} fill="transparent" shadow={14} z={land(f, done('panel') + 4, 14, 0)}>
          <Flood f={f} at={done('panel')} color={C.white} d={8} />
          <div style={{position: 'absolute', left: 50, top: 54}}>
            <PopText f={f} at={done('panel') + 6} text="JOIN THE CLUB" style={disp(76, 112, -0.02)} />
          </div>
          <div style={{position: 'absolute', right: 40, top: 30, opacity: appear(f, done('panel') + 10), ...mono(24, 700)}}>neo-brutal.form</div>
          <div style={{position: 'absolute', left: 50, top: 136, opacity: appear(f, done('panel') + 14), ...mono(26, 700)}}>EMAIL</div>
          <div style={{position: 'absolute', left: 290, top: 362, opacity: appear(f, done('toggle') + 2), ...sc(42, 900)}}>每周寄我一封小志</div>
          {['Grid', 'Border', 'Shadow'].map((t, i) => (
            <div key={t} style={{position: 'absolute', left: 130 + i * 300, top: 498, opacity: appear(f, done(`check${i}`)), ...grot(44, 700)}}>
              {t}
            </div>
          ))}
        </Box>
      )}
      {/* 输入框 */}
      {on('input') && (
        <Box x={S.input.x} y={S.input.y} w={S.input.w} h={S.input.h} fill="transparent" shadow={8} z={land(f, done('input') + 4, 8, 0)} style={{display: 'flex', alignItems: 'center', paddingLeft: 30}}>
          <Flood f={f} at={done('input')} color={C.white} />
          <span style={{position: 'relative', ...mono(44, 700)}}>
            <Typed f={f} at={done('input') + 4} text="you@site.com" cps={1.6} caret={f < CLICK} />
          </span>
        </Box>
      )}
      {/* 开关 */}
      {on('toggle') && (
        <Box x={S.toggle.x} y={S.toggle.y} w={S.toggle.w} h={S.toggle.h} fill="transparent" r={48} shadow={8} z={land(f, done('toggle') + 4, 8, 0)}>
          <Flood f={f} at={done('toggle') + 8} color={C.lime} />
          <div style={{position: 'absolute', top: 8, left: lerp(8, 102, knob), width: 68, height: 68, borderRadius: 34, boxSizing: 'border-box', background: C.white, border: `${V.border}px solid ${C.ink}`}} />
        </Box>
      )}
      {/* 复选框 */}
      {[0, 1, 2].map((i) => {
        const s = S[`check${i}`];
        if (!on(`check${i}`)) return null;
        const checked = i < 2 && f >= B + 94 + i * 4;
        return (
          <Box key={i} x={s.x} y={s.y} w={s.w} h={s.h} fill={checked ? C.ink : C.white} border={5} shadow={5} z={land(f, done(`check${i}`) + 2, 5, 0)} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            {checked && (
              <svg width="40" height="34" style={{transform: `scale(${lerp(1.6, 1, tween(f, B + 94 + i * 4, 6, 0, 1, E.out))})`}}>
                <path d="M4 17 L15 28 L36 5" fill="none" stroke={C.yellow} strokeWidth="7" />
              </svg>
            )}
          </Box>
        );
      })}
      {/* 按钮 */}
      {on('button') && (
        <Box x={btn.x} y={btn.y} w={btn.w} h={btn.h} fill="transparent" shadow={14} z={land(f, done('button') + 6, 14, 0) * (1 - cp)} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Flood f={f} at={done('button')} color={C.pink} />
          <span style={{position: 'relative'}}>
            <PopText f={f} at={done('button') + 3} text="注册 →" style={sc(60, 900)} step={2} />
          </span>
        </Box>
      )}
      {/* 按下之后：欢迎贴纸 */}
      {f >= CLICK + 4 && (
        <Box x={px(570)} y={py(610)} w={380} h={110} fill={C.lime} shadow={10} z={land(f, CLICK + 6, 10, 70)} rot={-5} scale={lerp(1.3, 1, tween(f, CLICK + 4, 8, 0, 1, E.out))} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <span style={{...sc(52, 900)}}>✓ 欢迎入伙</span>
        </Box>
      )}
      {/* 正在画的笔画 + 笔尖 */}
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {drawing.map((s) => (
          <path key={s.key} d={pillPath(s.x, s.y, s.w, s.h, s.r)} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - (f - s.t0) / s.d} fill="none" stroke={C.ink} strokeWidth={V.border} />
        ))}
        {pen && penO > 0 && (
          <g transform={`translate(${(pen as {x: number; y: number}).x} ${(pen as {x: number; y: number}).y})`} opacity={penO}>
            <circle r={18} fill={C.ink} />
            <circle r={7} fill={C.yellow} />
          </g>
        )}
      </svg>
      {f >= B + 108 && <Cursor x={lerp(1960, target.x, curK)} y={lerp(1140, target.y, curK)} p={cp} />}
      <Burst x={target.x} y={target.y} f={f} at={CLICK} />
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
  if (f >= a + 34 && f < a + 70) z = lerp(14, 52, tween(f, a + 34, 18, 0, 1, GLIDE));
  if (f >= a + 70) z = land(f, a + 70, 14, 52);
  if (f >= a + 78) z = lerp(z, 4, tween(f, a + 78, 16, 0, 1, GLIDE));
  const off = lerp(0, 14, k);
  const softCss = soft > 0.001 ? `${off}px ${lerp(30, off, k)}px ${blur}px rgba(0,0,0,${lerp(0.3, 1, k)})` : undefined;
  const expand = tween(f, AT.press - 14, 14, 0, 1, WHIP);
  return (
    <AbsoluteFill style={{background: C.paper, transform: `translateX(${dx}px)`}}>
      <Dots />
      <Label f={f} at={a} n="02" en="SHADOW" zh="硬影" code={['box-shadow:', '  14px 14px 0 #000;']} note="模糊永远是 0" chip={C.yellow} />
      <Slider x={96} y={760} label="blur" v={blur} max={40} hot={blur < 0.5} />
      {f >= a + 100 && (
        <Box x={96} y={880} w={560} h={104} fill={C.yellow} shadow={10} z={land(f, a + 102, 10, 60)} rot={-2} scale={lerp(1.25, 1, tween(f, a + 100, 8, 0, 1, E.out))} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
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
      {f >= a + 36 && f < a + 78 && (
        <div style={{position: 'absolute', left: MAIN.x + MAIN.w + 30, top: MAIN.y + MAIN.h - 40, opacity: appear(f, a + 36, 6) * (1 - tween(f, a + 70, 6)), background: C.ink, color: C.yellow, padding: '6px 16px', ...mono(40, 700)}}>
          {`↑ z ${Math.round(z)}px`}
        </div>
      )}
      {/* 阶梯 */}
      {STAIR.map((s, j0) => {
        const j = j0 + 1;
        const t = a + 80 + j0 * 6;
        if (f < t) return null;
        const m = tween(f, t, 16, 0, 1, GLIDE);
        const zz = f < t + 16 ? s.z + 30 : land(f, t + 16, s.z, s.z + 30);
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
const CLICK1 = {at: AT.press + 44, c: 2, r: 1};
const CLICK2 = {at: AT.press + 80, c: 4, r: 3};
const ALL = AT.press + 112; // 按一颗，全部按下
const ERA = [
  {at: AT.lineage, year: '1952', zh: '清水混凝土', en: 'BÉTON BRUT', note: ['勒·柯布西耶 · 马赛公寓', '材料不粉饰，结构露在外面']},
  {at: AT.lineage + 50, year: '2014', zh: '粗野主义网页', en: 'BRUTALIST WEB', note: ['brutalistwebsites.com', '浏览器默认样式，原样上线']},
  {at: AT.lineage + 96, year: '2021', zh: '新粗野主义', en: 'NEO-BRUTALISM', note: ['Gumroad 等产品带进主流', '黑框、硬影、平涂——还好用']},
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
