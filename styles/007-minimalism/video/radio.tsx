/**
 * 007 · Minimalism —— 02 删减 + 03 功能 4.0–8.0s（f224–480）
 *   3.73–4.0s  屋顶板转正成一台收音机的机身；那个点落到调频旋钮上，变成指针
 *   4.0–4.2s   “超级豪华 3000”：把手、天线、两翼喇叭、贴纸、VU 表、均衡器、磁带键……47 样东西一下子全冒出来
 *   4.4–5.25s  一个三十二分音符删一组，右边的大数字 48 → 1；最后两下慢下来：喇叭的纸盆一圈一圈拆掉，露出底下的孔
 *   6.0–6.7s   03：镜头推进格栅 → 摇到旋钮，引线一次只出一根（不再三根同时钉在那儿）
 *   6.7–7.0s   转一下旋钮（点跟着转）→ 开机：孔跟着鼓点亮，声波从格栅里出来
 *   7.3–8.0s   交棒：立刻压扁成一个盒子，镜头跟着推到盒子上（贾德）
 */
import React from 'react';
import {E, POP, spr, tween} from '../../../src/lib/anim';
import {C, LINE} from '../tokens';
import {AT} from './timeline';
import {Box, c01, Cam2, camTrack, Dot, lerp, mixBox, n2, P, quad, Txt, vis, World} from './ui';
import {dot01, PASS01, roofCorners} from './space';

export const BODY: Box = {x: 520, y: 330, w: 720, h: 420, r: 28};
export const DIAL = {x: 1112, y: 540, r: 100};
const DOT_RR = 64; // 指针到旋钮圆心的距离
const GRILLE = {x0: 596, y0: 432, pitch: 36, cols: 11, rows: 7, r: 6.5};
const CONE = {x: 776, y: 540};
export const ON_AT = 420; // 开机（03 的第 3 拍）
export const TURN_AT = 402;
export const OUT03 = 436; // 开机后立刻压扁，不再盯着注释看
export const JUDD_AT = 480;

/** 贾德接手时的镜头：钉在第一个盒子上（judd.tsx 从同一组数字起） */
export const CAM_JUDD0: Cam2 = {ox: 1160, oy: 880, s: 1.82};
/** 03：推进格栅 → 摇到旋钮 → 拉开看开机 → 推进压扁后的盒子 */
export const cam03 = (f: number): Cam2 => {
  const c = camTrack(f, [
    [360, {ox: 960, oy: 540, s: 1}],
    [372, {ox: 796, oy: 528, s: 1.58}],
    [388, {ox: 1112, oy: 548, s: 1.7}],
    [418, {ox: 1124, oy: 540, s: 1.48}],
    [434, {ox: 900, oy: 516, s: 1.16}],
    [480, CAM_JUDD0],
  ]);
  const d = 4 * (1 - tween(f, 458, 22, 0, 1, E.inOut));
  return {ox: c.ox + Math.sin(f * 0.045) * d, oy: c.oy + Math.cos(f * 0.031) * d * 0.65, s: c.s};
};

/** 旋钮指针的角度：开机前转 90°，每过一个凹槽停一下 */
const dialAngle = (f: number) => {
  const t = c01((f - TURN_AT) / 18);
  const steps = 6;
  const s = t * steps;
  const i = Math.floor(s);
  const frac = s - i;
  const k = t >= 1 ? steps : i + tween(frac, 0, 1, 0, 1, E.out);
  return -55 + (90 * k) / steps;
};
export const DETENTS = Array.from({length: 6}, (_, i) => TURN_AT + (i * 18) / 6);
const dotOnDial = (f: number) => {
  const a = (dialAngle(f) * Math.PI) / 180;
  return {x: DIAL.x + DOT_RR * Math.cos(a), y: DIAL.y + DOT_RR * Math.sin(a)};
};

/* ═══════════ 47 样多余的东西 ═══════════ */
type Item = {id: string; cx: number; cy: number; t: number; el: React.ReactNode};
const OSW = {fontFamily: "'Oswald'", fontWeight: 700} as const;
const BANG = {fontFamily: "'Bangers'"} as const;
const burst = (cx: number, cy: number, R: number, n: number, inner = 0.78) => {
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2;
    const r = i % 2 ? R * inner : R;
    d += `${i ? 'L' : 'M'}${n2(cx + Math.cos(a) * r)} ${n2(cy + Math.sin(a) * r)}`;
  }
  return d + 'Z';
};
const SLOT0 = 262;
const SLOT = 3.75; // 三十二分音符
const slot = (k: number, j = 0) => SLOT0 + k * SLOT + j * 0.9;
/** 删除的时刻：前 15 组按三十二分音符，最后两下放慢到八分音符 */
export const LAST_RING = 322.5;
export const LAST_CUT = 330;

const ITEMS: Item[] = (() => {
  const L: Item[] = [];
  const add = (id: string, cx: number, cy: number, t: number, el: React.ReactNode) => L.push({id, cx, cy, t, el});
  // 0 把手、天线
  add('handle', 880, 290, slot(0), <path d="M604 330V302Q604 264 642 264H1118Q1156 264 1156 302V330" fill="none" stroke={C.ink} strokeWidth={12} strokeLinecap="round" />);
  add(
    'antenna',
    1290,
    220,
    slot(0, 1),
    <g>
      <line x1={1196} y1={330} x2={1392} y2={112} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
      <line x1={1196} y1={330} x2={1300} y2={214} stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
      <circle cx={1392} cy={112} r={8} fill={C.ink} />
    </g>,
  );
  // 1–2 两翼：喇叭箱、高音、低音
  [
    {s: -1, x: 392},
    {s: 1, x: 1240},
  ].forEach(({s, x}, k) => {
    const cx = x + 64;
    add(`tw${k}`, cx, 466, slot(1 + k), (
      <g>
        <circle cx={cx} cy={466} r={38} fill={C.paperHi} stroke={C.ink} strokeWidth={2} />
        <circle cx={cx} cy={466} r={22} fill={C.stone} stroke={C.ink} strokeWidth={1} />
        <circle cx={cx} cy={466} r={8} fill={C.ink} />
      </g>
    ));
    add(`wf${k}`, cx, 610, slot(1 + k, 1), (
      <g>
        <circle cx={cx} cy={610} r={46} fill={C.paperHi} stroke={C.ink} strokeWidth={2} />
        <circle cx={cx} cy={610} r={32} fill="none" stroke={C.ink} strokeWidth={5} />
        <circle cx={cx} cy={610} r={14} fill={C.ink} />
      </g>
    ));
    add(`wing${k}`, cx, 540, slot(1 + k, 2), (
      <g>
        <rect x={x} y={380} width={128} height={320} rx={24} fill={C.shade} stroke={C.ink} strokeWidth={LINE.main} />
        <line x1={s < 0 ? x + 128 : x} y1={392} x2={s < 0 ? x + 128 : x} y2={688} stroke={C.ink} strokeWidth={3} />
      </g>
    ));
  });
  // 3 贴纸
  add('hifi', 590, 642, slot(3), (
    <g transform="rotate(-12 590 642)">
      <path d={burst(590, 642, 46, 16)} fill={C.ink} />
      <text x={590} y={651} textAnchor="middle" fill={C.paperHi} style={{...BANG, fontSize: 26}}>
        HI-FI
      </text>
    </g>
  ));
  add('new', 900, 448, slot(3, 1), (
    <g transform="rotate(14 900 448)">
      <circle cx={900} cy={448} r={30} fill={C.ink} />
      <text x={900} y={456} textAnchor="middle" fill={C.paperHi} style={{...BANG, fontSize: 22}}>
        NEW!
      </text>
    </g>
  ));
  add('3d', 1304, 404, slot(3, 2), (
    <g transform="rotate(10 1304 404)">
      <rect x={1252} y={388} width={104} height={32} fill={C.paperHi} stroke={C.ink} strokeWidth={2} />
      <text x={1304} y={411} textAnchor="middle" fill={C.ink} style={{...OSW, fontSize: 18, letterSpacing: '0.08em'}}>
        3D SOUND
      </text>
    </g>
  ));
  // 4 低音炮按钮、铭牌
  add('mega', 1120, 708, slot(4), (
    <g>
      <rect x={1028} y={690} width={184} height={36} rx={18} fill={C.ink} />
      <text x={1120} y={716} textAnchor="middle" fill={C.paperHi} style={{...BANG, fontSize: 24, letterSpacing: '0.06em'}}>
        MEGA BASS
      </text>
    </g>
  ));
  add('brand', 681, 369, slot(4, 1), (
    <g>
      <rect x={556} y={350} width={250} height={38} rx={4} fill={C.ink} />
      <text x={681} y={377} textAnchor="middle" fill={C.paperHi} style={{...OSW, fontSize: 21, letterSpacing: '0.12em'}}>
        SUPER DELUXE 3000
      </text>
    </g>
  ));
  // 5 VU 表
  [1010, 1112].forEach((x, k) =>
    add(`vu${k}`, x + 45, 376, slot(5, k), (
      <g>
        <rect x={x} y={348} width={90} height={56} rx={4} fill={C.paperHi} stroke={C.ink} strokeWidth={1.5} />
        <path d={`M${x + 16} 392A34 34 0 0 1 ${x + 74} 392`} fill="none" stroke={C.ink} strokeWidth={1} />
        {Array.from({length: 7}, (_, i) => {
          const a = Math.PI * (1.15 + (0.7 * i) / 6);
          return <line key={i} x1={n2(x + 45 + Math.cos(a) * 30)} y1={n2(398 + Math.sin(a) * 30)} x2={n2(x + 45 + Math.cos(a) * 36)} y2={n2(398 + Math.sin(a) * 36)} stroke={C.ink} strokeWidth={1} />;
        })}
        <line x1={x + 45} y1={398} x2={x + 45 + (k ? 18 : -10)} y2={364} stroke={C.ink} strokeWidth={2} />
      </g>
    )),
  );
  // 6 镀铬条
  add('chrome0', 880, 419, slot(6), <rect x={540} y={414} width={680} height={6} fill={C.stone} stroke={C.ink} strokeWidth={0.75} />);
  add('chrome1', 880, 428, slot(6, 1), <line x1={540} y1={428} x2={1220} y2={428} stroke={C.ink} strokeWidth={1.5} />);
  // 7 指示灯按钮 ×4
  Array.from({length: 4}, (_, i) =>
    add(`led${i}`, 838 + i * 36, 368, slot(7, i), <rect x={827 + i * 36} y={360} width={22} height={16} rx={3} fill={i % 2 ? C.greyDk : C.ink} />),
  );
  // 8 均衡器推子 ×6
  const lv = [0.3, 0.65, 0.45, 0.8, 0.5, 0.25];
  Array.from({length: 6}, (_, i) => {
    const x = 846 + i * 26;
    add(`eq${i}`, x, 700, slot(8, i), (
      <g>
        <line x1={x} y1={666} x2={x} y2={734} stroke={C.ink} strokeWidth={1.5} />
        <rect x={x - 9} y={n2(666 + lv[i] * 60)} width={18} height={9} rx={2} fill={C.ink} />
      </g>
    ));
  });
  // 9 磁带键 ×6
  Array.from({length: 6}, (_, i) => {
    const x = 556 + i * 42;
    add(`key${i}`, x + 18, 698, slot(9, i), (
      <g>
        <rect x={x} y={678} width={36} height={40} rx={3} fill={C.shade} stroke={C.ink} strokeWidth={1.5} />
        <line x1={x + 4} y1={688} x2={x + 32} y2={688} stroke={C.ink} strokeWidth={1} />
        <circle cx={x + 18} cy={704} r={4} fill={i === 1 ? C.ink : 'none'} stroke={C.ink} strokeWidth={1} />
      </g>
    ));
  });
  // 10 喇叭的四颗螺丝
  [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].forEach(([sx, sy], i) => {
    const x = CONE.x + sx * 118;
    const y = CONE.y + sy * 118;
    add(`bolt${i}`, x, y, slot(10, i), (
      <g>
        <circle cx={x} cy={y} r={7} fill={C.paperHi} stroke={C.ink} strokeWidth={1.5} />
        <path d={`M${x - 4} ${y}H${x + 4}M${x} ${y - 4}V${y + 4}`} stroke={C.ink} strokeWidth={1.2} />
      </g>
    ));
  });
  // 11 刻度盘上的四个频率
  ['88', '96', '104', '108'].forEach((t, i) => {
    const a = (Math.PI * (200 + i * 46)) / 180;
    const x = DIAL.x + Math.cos(a) * 80;
    const y = DIAL.y + Math.sin(a) * 80;
    add(`fq${i}`, x, y, slot(11, i), (
      <text x={n2(x)} y={n2(y + 5)} textAnchor="middle" fill={C.paperHi} style={{fontFamily: "'Geist Mono'", fontSize: 14}}>
        {t}
      </text>
    ));
  });
  // 12 刻度圈
  add('ticks', DIAL.x, DIAL.y, slot(12), (
    <g stroke={C.ink}>
      {Array.from({length: 48}, (_, i) => {
        const a = (i / 48) * Math.PI * 2;
        const r1 = i % 4 ? 110 : 106;
        return <line key={i} x1={n2(DIAL.x + Math.cos(a) * r1)} y1={n2(DIAL.y + Math.sin(a) * r1)} x2={n2(DIAL.x + Math.cos(a) * 118)} y2={n2(DIAL.y + Math.sin(a) * 118)} strokeWidth={i % 4 ? 1 : 2} />;
      })}
    </g>
  ));
  // 13–16 喇叭纸盆：一圈一圈拆，最后两下慢下来
  add('cone150', CONE.x, CONE.y, slot(13), <circle cx={CONE.x} cy={CONE.y} r={150} fill={C.shade} stroke={C.ink} strokeWidth={3} />);
  add('cone128', CONE.x, CONE.y, slot(14), <circle cx={CONE.x} cy={CONE.y} r={128} fill={C.paperHi} stroke={C.ink} strokeWidth={1} />);
  add('cone100', CONE.x, CONE.y, LAST_RING, <circle cx={CONE.x} cy={CONE.y} r={100} fill={C.paperHi} stroke={C.ink} strokeWidth={6} />);
  add('cone64', CONE.x, CONE.y, LAST_CUT, <circle cx={CONE.x} cy={CONE.y} r={64} fill={C.stone} stroke={C.ink} strokeWidth={1.5} />);
  add('cone30', CONE.x, CONE.y, LAST_CUT + 0.9, <circle cx={CONE.x} cy={CONE.y} r={30} fill={C.ink} />);
  return L;
})();
/** 配乐脚本用：每一样东西被删掉的帧 */
export const CUT_TIMES = ITEMS.map((it) => it.t);
const TOTAL = ITEMS.length + 1; // + 剩下的那个旋钮
const POP_IN = 240;
const maxD = Math.max(...ITEMS.map((it) => Math.hypot(it.cx - 880, it.cy - 540)));
const popAt = (it: Item) => POP_IN - 1 + 10 * (Math.hypot(it.cx - 880, it.cy - 540) / maxD);
// 画的顺序：大的在下面
const DRAW_ORDER = ['wing0', 'wing1', 'cone150', 'cone128', 'cone100', 'cone64', 'cone30'];
const SORTED = [...ITEMS].sort((a, b) => {
  const ia = DRAW_ORDER.indexOf(a.id);
  const ib = DRAW_ORDER.indexOf(b.id);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
});

const Clutter: React.FC<P> = ({f}) => (
  <g>
    {SORTED.map((it) => {
      const sIn = spr(f, popAt(it), POP, 22);
      const p = tween(f, it.t, 5, 0, 1, E.in);
      const s = sIn * (1 - p);
      if (s <= 0.005) return null;
      return (
        <g key={it.id} transform={`translate(${n2(it.cx)} ${n2(it.cy)}) scale(${n2(s * 1000) / 1000}) translate(${n2(-it.cx)} ${n2(-it.cy)})`} opacity={p > 0.5 ? n2((1 - p) / 0.5) : undefined}>
          {it.el}
        </g>
      );
    })}
  </g>
);

/* ═══════════ 机身、孔、旋钮 ═══════════ */
const Body: React.FC<P> = ({f}) => {
  if (f < POP_IN) {
    // 屋顶板（交棒时冻结在 PASS01 的样子）四个角 → 机身四个角
    const from = roofCorners(PASS01);
    const t = tween(f, PASS01, POP_IN - PASS01, 0, 1, E.inOut);
    const to: [number, number][] = [
      [BODY.x, BODY.y],
      [BODY.x + BODY.w, BODY.y],
      [BODY.x + BODY.w, BODY.y + BODY.h],
      [BODY.x, BODY.y + BODY.h],
    ];
    const pts = from.map((p, i) => [lerp(p[0], to[i][0], t), lerp(p[1], to[i][1], t)] as [number, number]);
    return <path d={quad(pts)} fill={C.paperHi} stroke={C.ink} strokeWidth={LINE.main} strokeLinejoin="round" />;
  }
  const r = (BODY.r ?? 0) * spr(f, POP_IN, POP, 20);
  const b = f < OUT03 + 4 ? BODY : mixBox(BODY, juddFirst, tween(f, OUT03 + 4, JUDD_AT - OUT03 - 4, 0, 1, E.inOut));
  const rr = f < OUT03 + 4 ? r : lerp(r, 0, tween(f, OUT03 + 4, 14, 0, 1, E.inOut));
  const fill = f < OUT03 + 4 ? C.paperHi : mixColor(tween(f, OUT03 + 10, 18, 0, 1, E.inOut));
  return <rect x={n2(b.x)} y={n2(b.y)} width={n2(b.w)} height={n2(b.h)} rx={n2(rr)} fill={fill} stroke={C.ink} strokeWidth={LINE.main} />;
};
/** 机身压扁后的样子 = 贾德的第一个盒子（judd.tsx 从 JUDD_AT 起接手） */
export const juddFirst: Box = {x: 1070, y: 860, w: 180, h: 40, r: 0};
const mixColor = (t: number) => {
  const a = [0xf6, 0xf4, 0xef];
  const b = [0x1c, 0x1b, 0x19];
  return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t))).join(',')})`;
};

/** 鼓点包络：开机后每拍一下重的，反拍轻一点（和配乐的底鼓一致） */
const kick = (f: number) => {
  if (f < ON_AT) return 0;
  const t = (f - ON_AT) % 30;
  const t8 = (f - ON_AT + 15) % 30;
  return Math.exp(-t / 6) + 0.35 * Math.exp(-t8 / 4);
};

/** 格栅：一直在纸盆底下（被盖住的地方看不见）；开机后，声音从中心一圈一圈往外推 */
const Grille: React.FC<P> = ({f}) => (
  <g>
    {Array.from({length: GRILLE.rows}, (_, j) =>
      Array.from({length: GRILLE.cols}, (_, i) => {
        const x = GRILLE.x0 + i * GRILLE.pitch;
        const y = GRILLE.y0 + j * GRILLE.pitch;
        const d = Math.hypot(x - CONE.x, y - CONE.y) / 200;
        const s = spr(f, POP_IN + d * 4, POP, 20) * (1 - tween(f, OUT03 + 2 + (i + j) * 0.6, 6, 0, 1, E.in));
        if (s <= 0.01) return null;
        const r = GRILLE.r * s * (1 + 0.42 * kick(f - d * 6));
        return <circle key={`${i}-${j}`} cx={x} cy={y} r={n2(r)} fill={C.ink} />;
      }),
    )}
  </g>
);

const Dial: React.FC<P> = ({f}) => {
  const s = f < POP_IN ? 0 : spr(f, POP_IN - 2, POP, 20) * (1 - tween(f, OUT03 + 6, 8, 0, 1, E.in));
  if (s <= 0.01) return null;
  const a = (dialAngle(f) * Math.PI) / 180;
  return (
    <g transform={`translate(${DIAL.x} ${DIAL.y}) scale(${n2(s * 1000) / 1000}) translate(${-DIAL.x} ${-DIAL.y})`}>
      <circle cx={DIAL.x} cy={DIAL.y} r={DIAL.r} fill={C.grey} />
      <circle cx={DIAL.x} cy={DIAL.y} r={DIAL.r - 14} fill="none" stroke={C.paperHi} strokeWidth={1} opacity={0.35} />
      {/* 指针的轨道：一根很淡的短弧 */}
      <line x1={n2(DIAL.x + Math.cos(a) * 30)} y1={n2(DIAL.y + Math.sin(a) * 30)} x2={n2(DIAL.x + Math.cos(a) * 46)} y2={n2(DIAL.y + Math.sin(a) * 46)} stroke={C.paperHi} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
    </g>
  );
};

/** 声波：开机后立刻从格栅里推两圈，跟着镜头走，不在那儿停着 */
const Waves: React.FC<P> = ({f}) => (
  <g>
    {[ON_AT, ON_AT + 8].map((at) =>
      [0, 5].map((d) => {
        const p = tween(f, at + d, 28, 0, 1, E.out);
        if (p <= 0 || p >= 1) return null;
        const r = lerp(160, 340, p);
        return <circle key={`${at}-${d}`} cx={CONE.x} cy={CONE.y} r={n2(r)} fill="none" stroke={C.ink} strokeWidth={LINE.note} opacity={n2(0.32 * (1 - p))} />;
      }),
    )}
  </g>
);

/** 删完以后的收音机（回顾里缩成小图用） */
export const RadioStatic: React.FC = () => (
  <g>
    <rect x={BODY.x} y={BODY.y} width={BODY.w} height={BODY.h} rx={BODY.r} fill={C.paperHi} stroke={C.ink} strokeWidth={LINE.main} vectorEffect="non-scaling-stroke" />
    {Array.from({length: GRILLE.rows * GRILLE.cols}, (_, k) => (
      <circle key={k} cx={GRILLE.x0 + (k % GRILLE.cols) * GRILLE.pitch} cy={GRILLE.y0 + Math.floor(k / GRILLE.cols) * GRILLE.pitch} r={GRILLE.r * 1.25} fill={C.ink} />
    ))}
    <circle cx={DIAL.x} cy={DIAL.y} r={DIAL.r} fill={C.grey} />
  </g>
);

/* ═══════════ 那个点：从德国馆走出来 → 旋钮指针 → 跟着机身压扁跳上第一个盒子 ═══════════ */
export const dotRadio = (f: number) => {
  const end = dotOnDial(f);
  if (f < POP_IN) {
    const a = dot01(PASS01);
    const t = tween(f, PASS01, POP_IN - PASS01, 0, 1, E.inOut);
    // 走一段弧线，不走直线
    const x = lerp(a.x, end.x, t);
    const y = lerp(a.y, end.y, t) - Math.sin(Math.PI * t) * 90;
    return {x, y, r: lerp(a.r, 13, t)};
  }
  return {x: end.x, y: end.y, r: 13};
};

/* ═══════════ 计数器：48 → 1 ═══════════ */
const Counter: React.FC<P> = ({f}) => {
  const left = TOTAL - ITEMS.filter((it) => f >= it.t + 2).length;
  const o = vis(f, 246, 350, 10, 10);
  if (o <= 0.001) return null;
  // 最近一次变化后的 3 帧里，数字从下面轻轻顶上来
  const last = Math.max(0, ...ITEMS.filter((it) => f >= it.t + 2).map((it) => it.t + 2));
  const bump = last ? 1 - tween(f, last, 4, 0, 1, E.out) : 0;
  const one = left === 1;
  return (
    <g opacity={o < 1 ? n2(o) : undefined}>
      <Txt x={1800} y={n2(624 + bump * 10)} k="d100" size={230} anchor="end" ls={-0.02}>
        {String(left)}
      </Txt>
      <Txt x={1800} y={676} k="sc300" size={26} ls={0.12} c={C.greyDk} anchor="end" o={one ? 0 : 1}>
        样东西
      </Txt>
      <Txt x={1800} y={676} k="sc300" size={26} ls={0.12} c={C.ink} anchor="end" o={one ? tween(f, LAST_CUT + 2, 10) : 0}>
        个旋钮
      </Txt>
      <Txt x={1800} y={404} k="mono" size={14} ls={0.18} c={C.greyDk} anchor="end">
        {one ? 'ONE CONTROL' : 'SUPER DELUXE 3000'}
      </Txt>
    </g>
  );
};

/* ═══════════ 图注：03 不再钉三条引线，镜头自己讲孔 / 圆 / 橙 ═══════════ */
const Captions: React.FC<P> = ({f}) => {
  const s2 = (at: number) => vis(f, at, AT.function - 4, 14, 10);
  const s3 = (at: number) => vis(f, at, 384, 8, 8);
  return (
    <g>
      <Txt x={120} y={172} k="sc300" size={46} ls={0.08} o={s2(300)}>
        删到不能再删。
      </Txt>
      <Txt x={120} y={218} k="t300" size={24} ls={0.01} c={C.greyDk} o={s2(308)}>
        Good design is as little design as possible.
      </Txt>
      <Txt x={1800} y={150} k="mono" size={14} ls={0.18} c={C.greyDk} anchor="end" o={s2(314)}>
        DIETER RAMS · TEN PRINCIPLES · No. 10
      </Txt>
      <Txt x={120} y={172} k="d200" size={48} ls={0.01} o={s3(362)}>
        Weniger, aber besser.
      </Txt>
      <Txt x={120} y={214} k="sc300" size={22} ls={0.1} c={C.greyDk} o={s3(368)}>
        少，但更好。—— 迪特 · 拉姆斯
      </Txt>
      <Txt x={1800} y={150} k="mono" size={14} ls={0.18} c={C.greyDk} anchor="end" o={s3(370)}>
        AFTER BRAUN · 1958
      </Txt>
    </g>
  );
};

export const Radio: React.FC<P> = ({f}) => {
  const d = dotRadio(f);
  const toJudd = tween(f, OUT03 + 4, JUDD_AT - OUT03 - 4, 0, 1, E.inOut);
  const jx = juddFirst.x + juddFirst.w / 2;
  const jy = juddFirst.y + juddFirst.h / 2;
  const dx = lerp(d.x, jx, toJudd);
  const dy = lerp(d.y, jy, toJudd) - Math.sin(Math.PI * toJudd) * 80;
  const cam = f >= 360 ? cam03(f) : {ox: 960, oy: 540, s: 1};
  return (
    <g>
      <World c={cam}>
        <Body f={f} />
        {f >= POP_IN - 4 && f < OUT03 + 16 && <Grille f={f} />}
        {f >= POP_IN - 4 && f < LAST_CUT + 8 && <Clutter f={f} />}
        <Dial f={f} />
        {f >= ON_AT && f < OUT03 + 8 && <Waves f={f} />}
        {f < JUDD_AT && <Dot x={dx} y={dy} r={lerp(d.r, 11, toJudd)} />}
      </World>
      <Counter f={f} />
      <Captions f={f} />
    </g>
  );
};
