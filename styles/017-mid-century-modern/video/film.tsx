/**
 * 017 · 中世纪现代 —— 全片画面（照 003 / 004 的骨架：开场先搭海报，然后一章一件代表作、一张新彩纸当底）
 *
 *   0—96      开场：海报在 1.5 秒里搭出来（poster.tsx）
 *   96        换章 = 一整张彩纸从右边滑进来盖住桌面（kit.ts 的 SHEETS）
 *   114—196   01 片头 · Saul Bass《金臂人》1955（蓝纸）——辐条翻面拼成折线手臂（spokes.tsx）
 *   214—296   02 家具 · Eames 挂衣架 1953（绿松石纸）——手臂翻回墨色拼成钢丝折线，14 颗球落上去
 *   314—396   03 唱片 · Reid Miles / Blue Note 1956（黄纸）——蓝球放大翻面成唱片，封套、BOP、叠印（ch345.tsx）
 *   414—496   04 建筑 · Case Study House #22 1960（粉纸）——唱片翻成落日，山、楼板、玻璃盒子、窗
 *   514—616   05 今天 · App（蓝纸）——玻璃盒子翻面成手机，界面一块块落进去，手按下播放键
 *   650—826   五条规则（白纸，rules.tsx）
 *   826—900   卡片飞走，海报的前奏重新落下 → 接回第 0 帧
 *
 * 签名物理：影子 = 高度（paper.tsx）。所有位置都是时间 t 的纯函数；60 帧连续 + 运动模糊。
 */
import React from 'react';
import {C} from '../tokens';
import {Air345, Ch03, Ch04, Ch05, focus345, pts345} from './ch345';
import {GEO} from './geo';
import {camTransform, covered, IMPACTS, scrapPose, SCRAP_COLS, SHEET_DUR, SHEETS, sheetPose, toScreen} from './kit';
import {Body, Piece, type Pose, Shadow} from './paper';
import {Poster, posterFocus, posterPts} from './poster';
import {Rules, rulesFocus, rulesPts} from './rules';
import {AirSpokes, Ch01, Ch02, PosterSpokes, spokesFocus, spokesPts} from './spokes';
import {AT, DURATION, W} from './timeline';

export {camTransform};

const SheetIn: React.FC<{t: number; s: (typeof SHEETS)[number]}> = ({t, s}) => {
  if (t < s.t0) return null;
  const p = sheetPose(t, s);
  return (
    <>
      <Shadow parts={[{d: GEO.sheet, fill: s.fill}]} p={p} />
      <Body parts={[{d: GEO.sheet, fill: s.fill}]} p={{...p, h: 0}} />
    </>
  );
};

/** 重击溅起的碎片：落定的画在本章里（会被下一张纸盖住），还在空中的画在最上面 */
const Scraps: React.FC<{t: number; ch?: number; air: boolean}> = ({t, ch, air}) => (
  <>
    {IMPACTS.map((m, i) => {
      if (m.ch === undefined || (ch !== undefined && m.ch !== ch) || t < m.t) return null;
      const bg = m.ch === 0 || m.ch === 6 ? C.paper : SHEETS[m.ch - 1].fill;
      const cols = SCRAP_COLS.filter((c) => c !== bg);
      return Array.from({length: 12}, (_, j) => {
        const p = scrapPose(m, j, t);
        if (!p || ((p.h ?? 4) > 6) !== air) return null;
        return <Piece key={`${i}-${j}`} d={GEO.scraps[j % GEO.scraps.length]} fill={cols[(j + i) % cols.length]} p={p} />;
      });
    })}
  </>
);

/** 每一章画在它那张纸上、下一张纸下面；下一张纸盖满以后就不再画 */
const CHAPTERS: React.FC<{t: number; k: number}>[] = [
  ({t}) => <Poster t={t} spokes={<PosterSpokes t={t} />} />,
  ({t}) => <Ch01 t={t} />,
  ({t}) => <Ch02 t={t} />,
  ({t, k}) => <Ch03 t={t} k={k} />,
  ({t}) => <Ch04 t={t} />,
  ({t}) => <Ch05 t={t} />,
  ({t}) => <Rules t={t} />,
];

export const Film: React.FC<{t: number; k: number}> = ({t, k}) => {
  const outro = t >= AT.out + 34;
  return (
    <g transform={camTransform(t)}>
      {CHAPTERS.map((Ch, i) => {
        const next = SHEETS[i];
        const prev = SHEETS[i - 1];
        if (prev && t < prev.t0) return null;
        if (next && covered(t, next.t0)) return null;
        return (
          <React.Fragment key={i}>
            {prev && covered(t, prev.t0) && <rect x={-2000} y={-2000} width={6000} height={5000} fill={prev.fill} />}
            <Ch t={t} k={k} />
            <Scraps t={t} ch={i} air={false} />
            {next && <SheetIn t={t} s={next} />}
          </React.Fragment>
        );
      })}
      {outro && <Poster t={t - DURATION} spokes={<PosterSpokes t={t - DURATION} />} />}
      <AirSpokes t={t} />
      <Air345 t={t} />
      <Scraps t={t} air />
    </g>
  );
};

/** 外框用：这一刻最新的一张纸（屏幕坐标下的变换）、它和旧纸的颜色 */
export const sheetEdge = (t: number) => {
  for (let i = SHEETS.length - 1; i >= 0; i--) {
    const s = SHEETS[i];
    if (t >= s.t0) {
      const p = sheetPose(t, s);
      return {tf: `${camTransform(t)} translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${(p.a ?? 0).toFixed(2)})`, bg: s.fill, under: i ? SHEETS[i - 1].fill : C.paper, done: covered(t, s.t0)};
    }
  }
  return {tf: '', bg: C.paper, under: C.paper, done: true};
};

const allPts = (t: number, shift: number): (Pose | null)[] => [...posterPts(t + shift), ...spokesPts(t), ...pts345(t), ...rulesPts(t)];

/** 这一刻屏幕上最快的东西每帧走多少 px（决定运动模糊取几个子帧） */
export const filmSpeed = (t: number) => {
  const shift = t >= AT.out ? -DURATION : 0;
  const a = allPts(t - 0.5, shift);
  const b = allPts(t + 0.5, shift);
  let v = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const p = a[i];
    const q = b[i];
    if (!p || !q) continue;
    const [x0, y0] = toScreen(t - 0.5, p.x, p.y);
    const [x1, y1] = toScreen(t + 0.5, q.x, q.y);
    v = Math.max(v, Math.hypot(x1 - x0, y1 - y0));
  }
  for (const s of SHEETS) {
    const p = sheetPose(t - 0.5, s);
    const q = sheetPose(t + 0.5, s);
    v = Math.max(v, Math.hypot(q.x - p.x, q.y - p.y));
  }
  for (const m of IMPACTS) {
    if (m.ch === undefined || t < m.t || t > m.t + 24) continue;
    for (let j = 0; j < 12; j += 3) {
      const p = scrapPose(m, j, t - 0.5);
      const q = scrapPose(m, j, t + 0.5);
      if (p && q) v = Math.max(v, Math.hypot(q.x - p.x, q.y - p.y));
    }
  }
  return Math.min(80, v);
};

/** 左下 h 读数：这一刻在看哪一块纸 */
export const focusAt = (t: number): {p: Pose | null; fill: string} => {
  if (t < AT.lift) return posterFocus(t);
  if (t < AT.sheet3) return spokesFocus(t);
  if (t < AT.sheet6) return focus345(t);
  if (t < AT.out + 30) return rulesFocus(t);
  return posterFocus(t - DURATION);
};
