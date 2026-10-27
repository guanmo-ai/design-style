/**
 * 013 · Art Deco —— 05 应用：同一家外滩爵士酒吧的网页与 App。
 * 整座楼缩进手机的拱窗当头图；网页从自己的中轴打开；每一屏只有一块实心金——那颗要你按的按钮。
 */
import React from 'react';
import {E, clamp, spr, tween} from '../../../src/lib/anim';
import {C, FONT} from '../tokens';
import {AT} from './timeline';
import {PHONE_AX} from './tower';
import {Diamond, G, RuleDiamond, T, TripleRect, mix, stepRect} from './ui';

const A = AT.apps;
/** 从自己的中轴往两边打开（scaleX），退场时合回中轴 */
const open = (f: number, at: number) => (f < at ? 0 : spr(f, at, {damping: 16, mass: 0.6, stiffness: 220}));
export const appsExit = (f: number) => 1 - tween(f, AT.words - 10, 14, 0, 1, E.in);
const Open: React.FC<{ax: number; k: number; children: React.ReactNode}> = ({ax, k, children}) =>
  k <= 0.001 ? null : <g transform={`translate(${ax} 0) scale(${k} 1) translate(${-ax} 0)`}>{children}</g>;

/** 按下：4 帧压下、停、6 帧弹回 */
const press = (f: number, at: number) => tween(f, at, 4) * (1 - tween(f, at + 10, 6));

// ───────── 网页 ─────────
const BX = 630; // 网页的中轴
const BW = {x: 130, y: 196, w: 1000, h: 690};

const Chevron: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g>
    {[0, 1, 2].map((i) => (
      <path key={i} d={`M${x - 46 * s} ${y + (i * 14 + 18) * s} L${x} ${y + i * 14 * s} L${x + 46 * s} ${y + (i * 14 + 18) * s}`} fill="none" stroke={G} strokeWidth={i === 0 ? 2.6 : 1.2} />
    ))}
  </g>
);
const Fan: React.FC<{x: number; y: number; r: number; sw?: number}> = ({x, y, r, sw = 1.4}) => (
  <g>
    <path d={`M${x - r} ${y} A${r} ${r} 0 0 1 ${x + r} ${y} Z`} fill="none" stroke={G} strokeWidth={sw * 1.6} />
    {Array.from({length: 7}, (_, k) => {
      const a = Math.PI + (Math.PI * (k + 1)) / 8;
      return <path key={k} d={`M${x} ${y} L${(x + r * Math.cos(a)).toFixed(1)} ${(y + r * Math.sin(a)).toFixed(1)}`} stroke={G} strokeWidth={sw} />;
    })}
    <path d={`M${x - r * 0.45} ${y} A${r * 0.45} ${r * 0.45} 0 0 1 ${x + r * 0.45} ${y}`} fill="none" stroke={G} strokeWidth={sw} />
  </g>
);
export const Zig: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g>
    {[0, 1, 2, 3].map((i) => {
      const hw = (52 - i * 12) * s;
      const h = 16 * s;
      return <rect key={i} x={x - hw} y={y - (i + 1) * h} width={2 * hw} height={h} fill="none" stroke={G} strokeWidth={i === 0 ? 2.4 : 1.3} />;
    })}
  </g>
);

/** 金色实心按钮：阶梯切角，两头 » « */
const GoldButton: React.FC<{cx: number; y: number; w: number; h: number; label: string; size: number; p?: number; s?: number}> = ({cx, y, w, h, label, size, p = 0, s = 8}) => {
  const k = 1 - 0.04 * p;
  return (
    <g transform={`translate(${cx} ${y + h / 2}) scale(${k}) translate(${-cx} ${-(y + h / 2)})`}>
      <path d={stepRect(cx - w / 2, y, w, h, s)} fill="url(#goldFill)" />
      <path d={stepRect(cx - w / 2 + 5, y + 5, w - 10, h - 10, s * 0.6)} fill="none" stroke={C.onyx} strokeWidth={1} opacity={0.5} />
      <T x={cx} y={y + h / 2 + size * 0.36} size={size} weight={700} fill={C.onyx} ls={0.16} anchor="middle">
        {label}
      </T>
      <T x={cx - w / 2 + 22} y={y + h / 2 + size * 0.36} size={size} weight={600} fill={C.onyx}>
        »
      </T>
      <T x={cx + w / 2 - 22} y={y + h / 2 + size * 0.36} size={size} weight={600} fill={C.onyx} anchor="end">
        «
      </T>
    </g>
  );
};

const Browser: React.FC<{f: number}> = ({f}) => {
  const win = open(f, A + 60);
  const nav = [open(f, A + 76), open(f, A + 82)];
  const rays = tween(f, A + 78, 34, 0, 1, E.out);
  const title = [open(f, A + 86), open(f, A + 92)];
  const sub = open(f, A + 98);
  const cta = open(f, A + 102);
  const cards = [open(f, A + 112), open(f, A + 106), open(f, A + 112)];
  const {x, y, w, h} = BW;
  const bg = '#0B0A08';
  const R = 520;
  const wedge = mix(C.gold, bg, 0.08);
  const ray = mix(C.gold, bg, 0.4);
  return (
    <Open ax={BX} k={win}>
      <clipPath id="bwin">
        <rect x={x} y={y} width={w} height={h} rx={16} />
      </clipPath>
      <rect x={x} y={y} width={w} height={h} rx={16} fill={bg} />
      <g clipPath="url(#bwin)">
        {/* 放射：藏在标题后面 */}
        <g opacity={rays}>
          {Array.from({length: 22}, (_, i) => {
            const a = Math.PI + (Math.PI * i) / 22;
            const b = Math.PI + (Math.PI * (i + 1)) / 22;
            const m = Math.PI * 1.5;
            const A_ = m + (a - m) * rays;
            const B_ = m + (b - m) * rays;
            const ox = BX;
            const oy = 640;
            const P = (t: number) => `${(ox + R * Math.cos(t)).toFixed(1)} ${(oy + R * Math.sin(t)).toFixed(1)}`;
            return (
              <g key={i}>
                {i % 2 === 0 && <path d={`M${ox} ${oy} L${P(A_)} L${P(B_)} Z`} fill={wedge} />}
                <path d={`M${ox} ${oy} L${P(A_)}`} stroke={ray} strokeWidth={1.2} />
              </g>
            );
          })}
        </g>
        <rect x={x} y={y} width={w} height={46} fill={C.onyx2} />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={x + 26 + i * 22} cy={y + 23} r={6} fill={mix(C.smoke, C.onyx2, 0.5)} />
        ))}
        <rect x={BX - 150} y={y + 9} width={300} height={28} rx={14} fill="#050505" />
        <T x={BX} y={y + 29} size={16} weight={500} fill={C.smoke} ls={0.06} anchor="middle">
          goldenhour.sh
        </T>
      </g>
      <rect x={x} y={y} width={w} height={h} rx={16} fill="none" stroke={G} strokeWidth={2} />
      {/* 导航：中间的标志先出来，两边随后 */}
      <Open ax={BX} k={nav[0]}>
        <Fan x={BX - 168} y={287} r={18} sw={1.2} />
        <T x={BX + 12} y={286} size={30} family={FONT.display} fill={G} ls={0.06} anchor="middle">
          THE GOLDEN HOUR
        </T>
      </Open>
      <Open ax={BX} k={nav[1]}>
        <T x={x + 44} y={284} size={17} weight={500} fill={C.ivory} ls={0.24}>
          MENU    EVENTS
        </T>
        <T x={x + w - 44} y={284} size={17} weight={500} fill={C.ivory} ls={0.24} anchor="end">
          VISIT    RESERVE
        </T>
        <path d={`M${x + 40} 312 H${x + w - 40}`} stroke={G} strokeWidth={1.6} />
        <path d={`M${x + 40} 318 H${x + w - 40}`} stroke={G} strokeWidth={0.8} />
      </Open>
      <Open ax={BX} k={title[0]}>
        <T x={BX} y={420} size={76} family={FONT.display} fill={G} ls={0.08} anchor="middle">
          AN EVENING
        </T>
      </Open>
      <Open ax={BX} k={title[1]}>
        <T x={BX} y={500} size={76} family={FONT.display} fill={G} ls={0.08} anchor="middle">
          ON THE BUND
        </T>
      </Open>
      <Open ax={BX} k={sub}>
        <T x={BX} y={552} size={28} family={FONT.serif} weight={500} fill={C.ivory} ls={0.3} anchor="middle">
          外滩 · 每晚 21:30 开场
        </T>
      </Open>
      <Open ax={BX} k={cta}>
        <GoldButton cx={BX} y={578} w={330} h={58} label="订一张桌 · RESERVE" size={20} p={press(f, A + 132)} />
      </Open>
      {(['鸡尾酒', '现场爵士', '包厢'] as const).map((name, i) => {
        const cx = BX + (i - 1) * 310;
        const en = ['COCKTAILS', 'LIVE JAZZ', 'SALON'][i];
        return (
          <Open key={i} ax={cx} k={cards[i]}>
            <TripleRect x={cx - 140} y={668} w={280} h={186} s={10} k={0.5} />
            {i === 0 && <Chevron x={cx} y={700} s={0.8} />}
            {i === 1 && <Fan x={cx} y={744} r={42} />}
            {i === 2 && <Zig x={cx} y={746} s={0.9} />}
            <T x={cx} y={800} size={30} family={FONT.serif} weight={600} fill={C.ivory} ls={0.2} anchor="middle">
              {name}
            </T>
            <T x={cx} y={832} size={15} weight={500} fill={G} ls={0.3} anchor="middle">
              {en}
            </T>
          </Open>
        );
      })}
    </Open>
  );
};

// ───────── 手机 ─────────
const PH = {x: PHONE_AX - 200, y: 118, w: 400, h: 824};

/** 手机的机身与屏幕底：画在整座楼的后面 */
export const PhoneBack: React.FC<{f: number}> = ({f}) => {
  const p = tween(f, A + 18, 40, 0, 1, E.inOut);
  const bg = tween(f, A + 30, 22);
  if (p <= 0 && bg <= 0) return null;
  const {x, y, w, h} = PH;
  // 机身从顶部中点开始，两边同时往下画，在底部中点合拢
  const half = `M${PHONE_AX} ${y} H${x + w - 58} A58 58 0 0 1 ${x + w} ${y + 58} V${y + h - 58} A58 58 0 0 1 ${x + w - 58} ${y + h} H${PHONE_AX}`;
  return (
    <g>
      <rect x={x + 12} y={y + 12} width={w - 24} height={h - 24} rx={46} fill={C.onyx} opacity={bg} />
      {[-1, 1].map((side) => (
        <path key={side} d={half} transform={`translate(${PHONE_AX} 0) scale(${side} 1) translate(${-PHONE_AX} 0)`} fill="none" stroke={G} strokeWidth={3} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
      ))}
    </g>
  );
};

const Ripple: React.FC<{f: number; at: number; x: number; y: number}> = ({f, at, x, y}) => {
  const t = tween(f, at, 26, 0, 1, E.out);
  if (f < at || t >= 1) return null;
  return (
    <g>
      <circle cx={x} cy={y} r={14 + 46 * t} fill="none" stroke={C.ivory} strokeWidth={3 * (1 - t)} opacity={1 - t} />
      <circle cx={x} cy={y} r={20} fill={C.ivory} opacity={0.35 * (1 - tween(f, at + 6, 10))} />
    </g>
  );
};

/** 手机界面：画在楼的前面 */
export const PhoneFront: React.FC<{f: number}> = ({f}) => {
  const items = [A + 46, A + 52, A + 56, A + 62, A + 68, A + 74, A + 80].map((t) => open(f, t));
  if (items[0] <= 0) return null;
  const cx = PHONE_AX;
  const sel = tween(f, A + 144, 6);
  const tapRes = A + 162;
  const days: [string, string][] = [
    ['THU', '06'],
    ['FRI', '07'],
    ['SAT', '08'],
    ['SUN', '09'],
  ];
  return (
    <g>
      <g opacity={items[0]}>
        <T x={PH.x + 44} y={PH.y + 50} size={20} weight={600} fill={C.ivory}>
          21:29
        </T>
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={PH.x + PH.w - 84 + i * 14} cy={PH.y + 43} r={5} fill={C.ivory} />
        ))}
        <rect x={PH.x + PH.w - 44} y={PH.y + 37} width={6} height={12} fill={C.ivory} />
      </g>
      <Open ax={cx} k={items[0]}>
        <T x={cx} y={512} size={38} family={FONT.display} fill={G} ls={0.06} anchor="middle">
          THE GOLDEN HOUR
        </T>
      </Open>
      <Open ax={cx} k={items[1]}>
        <T x={cx} y={548} size={22} family={FONT.serif} weight={500} fill={C.ivory} ls={0.34} anchor="middle">
          外滩 · 爵士之夜
        </T>
        <RuleDiamond x1={cx - 140} x2={cx + 140} y={576} sw={1.2} />
      </Open>
      {days.map(([d, n], i) => {
        const x = cx + (i - 1.5) * 86;
        const on = i === 1 ? sel : 0;
        return (
          <Open key={i} ax={x} k={items[i === 1 || i === 2 ? 2 : 3]}>
            <path d={stepRect(x - 37, 598, 74, 80, 6)} fill={on > 0 ? mix(C.gold, C.onyx, 0.16 * on) : 'none'} stroke={on > 0.5 ? G : mix(C.smoke, C.onyx, 0.7)} strokeWidth={1.4 + 1.4 * on} />
            <T x={x} y={624} size={14} weight={600} fill={on > 0.5 ? C.gold : C.smoke} ls={0.24} anchor="middle">
              {d}
            </T>
            <T x={x} y={662} size={32} weight={400} fill={on > 0.5 ? C.goldLt : C.ivory} anchor="middle">
              {n}
            </T>
          </Open>
        );
      })}
      <Open ax={cx} k={items[4]}>
        <TripleRect x={cx - 172} y={694} w={344} h={98} s={8} k={0.4} />
        <T x={cx - 146} y={728} size={14} weight={600} fill={C.gold} ls={0.2}>
          LE QUARTET · 四重奏
        </T>
        <T x={cx - 146} y={770} size={23} family={FONT.sc} weight={700} fill={C.ivory}>
          吧台 12A · 两位
        </T>
        <T x={cx + 148} y={772} size={30} weight={500} fill={C.goldLt} anchor="end">
          ¥388
        </T>
      </Open>
      <Open ax={cx} k={items[5]}>
        <GoldButton cx={cx} y={806} w={344} h={54} label="预订 · RESERVE" size={18} p={press(f, tapRes)} s={7} />
      </Open>
      <Open ax={cx} k={items[6]}>
        <path d={`M${PH.x + 14} 878 H${PH.x + PH.w - 14}`} stroke={G} strokeWidth={1} />
        <path d={`M${cx - 132} 916 L${cx - 120} 904 L${cx - 108} 916 V926 H${cx - 132} Z`} fill="none" stroke={C.ivory} strokeWidth={2} />
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${cx - 54} ${906 + i * 8} H${cx - 30}`} stroke={C.smoke} strokeWidth={2} />
        ))}
        <Diamond x={cx + 42} y={914} r={11} fill="none" />
        <path d={`M${cx + 42} 903 L${cx + 53} 914 L${cx + 42} 925 L${cx + 31} 914 Z`} fill="none" stroke={C.smoke} strokeWidth={2} />
        <path d={`M${cx + 108} 926 V914 A12 12 0 0 1 ${cx + 132} 914 V926`} fill="none" stroke={C.smoke} strokeWidth={2} />
      </Open>
      <Ripple f={f} at={A + 144} x={cx - 43} y={640} />
      <Ripple f={f} at={tapRes} x={cx + 40} y={833} />
    </g>
  );
};

/** 网页的光标：从右下角滑进来，按一下“订一张桌” */
const Cursor: React.FC<{f: number}> = ({f}) => {
  const t = tween(f, A + 108, 24, 0, 1, E.inOut);
  if (t <= 0) return null;
  const x = 1060 + (BX + 70 - 1060) * t;
  const y = 980 + (612 - 980) * t;
  const k = 1 - 0.12 * press(f, A + 132);
  return (
    <g transform={`translate(${x} ${y}) scale(${k * 1.5})`} opacity={1 - tween(f, AT.words - 14, 8)}>
      <path d="M0 0 L0 26 L7 20 L12 31 L17 29 L12 18 L21 18 Z" fill={C.ivory} stroke={C.onyx} strokeWidth={1.6} strokeLinejoin="round" />
    </g>
  );
};

export const Apps: React.FC<{f: number}> = ({f}) => {
  const k = appsExit(f);
  return (
    <g>
      <Open ax={BX} k={k}>
        <Browser f={f} />
        <Cursor f={f} />
      </Open>
    </g>
  );
};

/** 05 退场：手机和楼一起合回手机的中轴 */
export const PhoneExit: React.FC<{f: number; children: React.ReactNode}> = ({f, children}) => (
  <Open ax={PHONE_AX} k={clamp(appsExit(f))}>{children}</Open>
);
