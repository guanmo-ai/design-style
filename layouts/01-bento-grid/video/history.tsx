/**
 * 布局 01 · Bento Grid —— 起源三章：真的便当盒 → 2010 Windows Phone 动态磁贴 → 2020 iOS 14 小组件
 * 卡片内容（七张卡片各装什么）+ 卡片之外的“道具”（漆盒、开始屏幕、手机）。
 */
import React from 'react';
import {staticFile} from 'remotion';
import {E, POP, spr, tween} from '../../../src/lib/anim';
import {C} from '../tokens';
import {BOX, cardState, ICON_X, ICON_Y, MR, mw, mx, MX0, my, MY0, PHONE, SCENE, TRANS} from './layout';
import {disp, sc, Show} from './ui';

type P = {f: number};
type CSS = React.CSSProperties;
const SEL = "'Selawik', 'Noto Sans SC', sans-serif";
const seg = (size: number, w = 300): CSS => ({fontFamily: SEL, fontSize: size, fontWeight: w, lineHeight: 1});
const rng = (seed: number) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const T = (name: string) => TRANS.find((t) => t.to === name)!.at;

/** 内容整体弹出：缩放 + 淡入；退场淡出 */
const Pop: React.FC<{f: number; at: number; out: number; children: React.ReactNode; origin?: string}> = ({f, at, out, children, origin = '50% 60%'}) => {
  const s = spr(f, at, POP, 40);
  const o = Math.min(1, tween(f, at, 8, 0, 1)) * (1 - tween(f, out, 8, 0, 1, E.inOut));
  if (o <= 0.001) return null;
  return <div style={{position: 'absolute', inset: 0, opacity: o, transform: `scale(${0.78 + 0.22 * s})`, transformOrigin: origin}}>{children}</div>;
};

/* =====================================================================
 * 02 名字的由来：一只真的便当盒（和发布会布局是同一种拓扑）
 * ===================================================================== */
const BO = SCENE.BENTO.out;
const BENTO_ORDER = [0, 2, 1, 4, 3, 5, 6];

let RICE: {x: number; y: number; a: number; s: number}[] | null = null;
const rice = () => {
  if (RICE) return RICE;
  const r = rng(11);
  const out = [];
  for (let k = 0; k < 520; k++) out.push({x: 14 + r() * 496, y: 14 + r() * 500, a: r() * 180, s: 0.8 + r() * 0.45});
  return (RICE = out);
};

const Rice: React.FC = () => (
  <svg width={524} height={528}>
    <defs>
      <radialGradient id="bx-rsh" cx="50%" cy="46%" r="70%">
        <stop offset="0" stopColor="#fff" stopOpacity="0" />
        <stop offset=".7" stopColor="#A89B83" stopOpacity=".18" />
        <stop offset="1" stopColor="#6E604A" stopOpacity=".5" />
      </radialGradient>
      <radialGradient id="bx-ume" cx="36%" cy="32%" r="75%">
        <stop offset="0" stopColor="#F26478" />
        <stop offset=".55" stopColor="#C61F3A" />
        <stop offset="1" stopColor="#7E0E22" />
      </radialGradient>
      <clipPath id="bx-rc"><rect x={8} y={8} width={508} height={512} rx={12} /></clipPath>
    </defs>
    <g clipPath="url(#bx-rc)">
      <rect x={8} y={8} width={508} height={512} fill="#ECE6D9" />
      {rice().map((g, k) => (
        <ellipse key={k} cx={g.x} cy={g.y} rx={8.5 * g.s} ry={3.8 * g.s} transform={`rotate(${g.a} ${g.x} ${g.y})`} fill="#FCFAF5" stroke="#D9D0BE" strokeWidth={1} />
      ))}
      <rect x={8} y={8} width={508} height={512} fill="url(#bx-rsh)" />
    </g>
  </svg>
);

const Ume: React.FC<P> = ({f}) => {
  const s = spr(f, SCENE.BENTO.in + 10, POP, 40);
  const sesame = [[-120, -90, 20], [-60, 130, -30], [110, -120, 60], [150, 70, 10], [-150, 40, 80], [40, 160, -60], [90, 150, 30], [-30, -150, 0], [170, -30, 45], [-170, -150, -20]];
  return (
    <svg width={524} height={528} style={{position: 'absolute', inset: 0}}>
      <g transform={`translate(262 264) scale(${s})`}>
        <ellipse cx={4} cy={10} rx={58} ry={50} fill="#9E1229" opacity={0.18} />
        <circle r={54} fill="url(#bx-ume)" />
        <path d="M-30 -6 Q-10 -24 16 -16 M-20 18 Q6 8 30 20 M10 -40 Q22 -30 34 -34" stroke="#7E0E22" strokeWidth={3} fill="none" opacity={0.45} strokeLinecap="round" />
        <ellipse cx={-18} cy={-24} rx={16} ry={9} fill="#fff" opacity={0.42} transform="rotate(-25 -18 -24)" />
      </g>
      <g opacity={tween(f, SCENE.BENTO.in + 16, 10)}>
        {sesame.map(([x, y, a], k) => (
          <ellipse key={k} cx={262 + x} cy={264 + y} rx={4} ry={2} transform={`rotate(${a} ${262 + x} ${264 + y})`} fill="#26201C" />
        ))}
      </g>
    </svg>
  );
};

const Tamago: React.FC = () => (
  <svg width={252} height={254}>
    <ellipse cx={126} cy={196} rx={96} ry={14} fill="#000" opacity={0.25} />
    {[[-58, -5], [0, 0], [58, 5]].map(([dx, rot], k) => (
      <g key={k} transform={`translate(${126 + dx} 128) rotate(${rot})`}>
        <rect x={-34} y={-62} width={68} height={124} rx={22} fill="#F7C744" stroke="#D9921F" strokeWidth={3} />
        <rect x={-24} y={-49} width={48} height={98} rx={15} fill="none" stroke="#E7A532" strokeWidth={3} />
        <rect x={-14} y={-35} width={28} height={70} rx={9} fill="none" stroke="#E7A532" strokeWidth={3} />
        <path d="M-4 -22 V22" stroke="#E7A532" strokeWidth={3} strokeLinecap="round" />
        <ellipse cx={-16} cy={-40} rx={7} ry={14} fill="#FFF4BE" opacity={0.55} />
      </g>
    ))}
  </svg>
);

const Fillet: React.FC<{x: number; y: number; rot: number}> = ({x, y, rot}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot} 110 75)`}>
    <path d="M18 44 Q24 12 70 12 L188 22 Q222 26 220 64 L212 124 Q206 150 176 148 L40 140 Q12 136 14 106 Z" fill="url(#bx-salmon)" />
    <path d="M14 106 Q12 136 40 140 L176 148 Q206 150 212 124" fill="none" stroke="#B4513A" strokeWidth={12} strokeLinecap="round" opacity={0.9} />
    {[52, 92, 132, 172].map((sx) => (
      <path key={sx} d={`M${sx} 18 Q${sx + 22} 70 ${sx - 4} 140`} fill="none" stroke="#FFE4D4" strokeWidth={5} strokeLinecap="round" opacity={0.9} />
    ))}
    <ellipse cx={70} cy={40} rx={30} ry={10} fill="#fff" opacity={0.22} />
  </g>
);

const Salmon: React.FC = () => (
  <svg width={252} height={528}>
    <defs>
      <linearGradient id="bx-salmon" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FF9F72" />
        <stop offset="1" stopColor="#EE7547" />
      </linearGradient>
    </defs>
    <Fillet x={14} y={24} rot={-4} />
    <Fillet x={18} y={178} rot={3} />
    {/* 绿色“草”隔片：便当里的经典细节 */}
    <polygon points={Array.from({length: 13}, (_, k) => `${10 + k * 19.4},${k % 2 ? 352 : 390}`).join(' ') + ' 243,398 10,398'} fill="#2FA055" />
    <g transform="translate(126 492)">
      <path d="M-82 0 A82 82 0 0 1 82 0 Z" fill="#FBE45A" />
      <path d="M-82 0 A82 82 0 0 1 82 0" fill="none" stroke="#E7BA14" strokeWidth={10} />
      {[30, 60, 90, 120, 150].map((a) => (
        <path key={a} d={`M0 -6 L${Math.cos((a * Math.PI) / 180) * -68} ${-Math.sin((a * Math.PI) / 180) * 68}`} stroke="#FFF7C2" strokeWidth={4} strokeLinecap="round" />
      ))}
    </g>
  </svg>
);

const Floret: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => (
  <g transform={`translate(${x} ${y}) scale(${[1, 0.9, 1.05][k]})`}>
    <path d="M-12 18 L-16 66 Q0 74 16 66 L12 18 Z" fill="#A8CC66" />
    {[[0, 0, 34], [-30, 10, 24], [30, 10, 24], [-18, -24, 23], [18, -24, 23], [0, 22, 22]].map(([cx, cy, r], j) => (
      <circle key={j} cx={cx} cy={cy} r={r} fill="#3D8B40" stroke="#2C6C30" strokeWidth={2} />
    ))}
    {[[-8, -10], [14, -2], [-22, 4], [4, 12], [20, -22], [-14, -28]].map(([cx, cy], j) => (
      <circle key={`h${j}`} cx={cx} cy={cy} r={4} fill="#62B556" />
    ))}
  </g>
);
const Broccoli: React.FC = () => (
  <svg width={252} height={254}>
    <Floret x={76} y={104} k={0} />
    <Floret x={178} y={96} k={1} />
    <Floret x={128} y={160} k={2} />
  </svg>
);

const Karaage: React.FC = () => {
  const blob = (cx: number, cy: number, r: number, seed: number) => {
    const g = rng(seed);
    const pts = Array.from({length: 16}, (_, k) => {
      const a = (k / 16) * Math.PI * 2;
      const rr = r * (0.9 + g() * 0.18);
      return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.86];
    });
    const d = pts.map((p, k) => {
      const n = pts[(k + 1) % pts.length];
      return `${k === 0 ? `M${(p[0] + n[0]) / 2} ${(p[1] + n[1]) / 2}` : ''} Q${n[0]} ${n[1]} ${(n[0] + pts[(k + 2) % pts.length][0]) / 2} ${(n[1] + pts[(k + 2) % pts.length][1]) / 2}`;
    });
    const sp = rng(seed + 5);
    return (
      <g key={seed}>
        <ellipse cx={cx + 4} cy={cy + r * 0.8} rx={r} ry={10} fill="#000" opacity={0.18} />
        <path d={d.join(' ')} fill="url(#bx-kara)" stroke="#8E4A16" strokeWidth={2} />
        {Array.from({length: 14}, (_, k) => (
          <circle key={k} cx={cx + (sp() - 0.5) * r * 1.3} cy={cy + (sp() - 0.6) * r * 1.1} r={2 + sp() * 3.5} fill="#F6C27A" opacity={0.75} />
        ))}
      </g>
    );
  };
  return (
    <svg width={524} height={256}>
      <defs>
        <radialGradient id="bx-kara" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#ECA24A" />
          <stop offset=".6" stopColor="#C77425" />
          <stop offset="1" stopColor="#97511A" />
        </radialGradient>
      </defs>
      <path d="M18 150 Q40 70 120 60 Q160 30 220 56 Q280 26 340 58 Q410 36 456 76 Q512 100 500 170 Q470 226 380 214 Q300 236 220 214 Q120 236 60 210 Q8 196 18 150 Z" fill="#86C95A" />
      <path d="M40 160 Q200 120 480 150 M120 70 Q160 130 150 200 M300 50 Q320 130 290 210" stroke="#B9E394" strokeWidth={4} fill="none" opacity={0.8} />
      {blob(118, 132, 66, 3)}
      {blob(236, 118, 62, 9)}
      {blob(350, 136, 66, 17)}
      {blob(452, 116, 52, 23)}
    </svg>
  );
};

const Tomato: React.FC = () => (
  <svg width={252} height={256}>
    <defs>
      <radialGradient id="bx-tom" cx="36%" cy="32%" r="75%">
        <stop offset="0" stopColor="#FF7A63" />
        <stop offset=".55" stopColor="#E0301F" />
        <stop offset="1" stopColor="#A4150D" />
      </radialGradient>
    </defs>
    {[[80, 158, 56], [174, 150, 52], [128, 86, 50]].map(([cx, cy, r], k) => (
      <g key={k}>
        <circle cx={cx} cy={cy} r={r} fill="url(#bx-tom)" />
        <ellipse cx={cx - r * 0.35} cy={cy - r * 0.38} rx={r * 0.26} ry={r * 0.15} fill="#fff" opacity={0.55} transform={`rotate(-30 ${cx - r * 0.35} ${cy - r * 0.38})`} />
        <polygon
          points={Array.from({length: 10}, (_, j) => {
            const a = (j / 10) * Math.PI * 2 - Math.PI / 2;
            const rr = j % 2 ? 6 : 17;
            return `${cx + Math.cos(a) * rr},${cy - r + 8 + Math.sin(a) * rr}`;
          }).join(' ')}
          fill="#3C8D3F"
        />
      </g>
    ))}
  </svg>
);

const Takuan: React.FC = () => (
  <svg width={252} height={256}>
    {[[-60, -16], [-20, -6], [20, 6], [60, 16]].map(([dx, rot], k) => (
      <g key={k} transform={`translate(${126 + dx} 180) rotate(${rot})`}>
        <path d="M-62 0 A62 62 0 0 1 62 0 Z" fill="#F6D84A" stroke="#E2B51E" strokeWidth={3} />
        <path d="M-46 0 A46 46 0 0 1 46 0" fill="none" stroke="#EDC635" strokeWidth={3} />
        <path d="M-24 0 A24 24 0 0 1 24 0" fill="none" stroke="#EDC635" strokeWidth={2} opacity={0.8} />
      </g>
    ))}
  </svg>
);

export const BentoFood: React.FC<P & {i: number}> = ({f, i}) => {
  const at = SCENE.BENTO.in + BENTO_ORDER[i] * 4;
  const food = [<Rice key="r" />, <Tamago key="t" />, <Salmon key="s" />, <Broccoli key="b" />, <Karaage key="k" />, <Tomato key="to" />, <Takuan key="ta" />][i];
  return (
    <>
      <Pop f={f} at={at} out={BO}>{food}</Pop>
      {i === 0 && (
        <Pop f={f} at={at} out={BO}>
          <Ume f={f} />
        </Pop>
      )}
    </>
  );
};

/** 漆盒：卡片之间的缝，就是盒子的隔板 */
export const BentoBox: React.FC<P> = ({f}) => {
  const t0 = T('BENTO');
  const o = tween(f, t0 + 4, 20, 0, 1, E.out) * (1 - tween(f, T('METRO'), 10, 0, 1, E.inOut));
  if (o <= 0.001) return null;
  const s = 0.96 + 0.04 * tween(f, t0, 34, 0, 1, E.out);
  return (
    <>
      <div style={{position: 'absolute', inset: 0, opacity: o * 0.9, background: 'radial-gradient(48% 60% at 66% 52%, rgba(120,60,30,.22), rgba(0,0,0,0) 70%)'}} />
      <div
        style={{
          position: 'absolute',
          left: BOX.x,
          top: BOX.y,
          width: BOX.w,
          height: BOX.h,
          borderRadius: BOX.r,
          opacity: o,
          transform: `scale(${s})`,
          background: 'linear-gradient(150deg, #2E1C17 0%, #140C0A 46%, #1E120F 100%)',
          boxShadow: '0 50px 100px rgba(0,0,0,.65), inset 0 1px 0 rgba(255,255,255,.14), inset 0 0 0 1px rgba(255,255,255,.05)',
        }}
      >
        <div style={{position: 'absolute', inset: 0, borderRadius: BOX.r, background: 'linear-gradient(115deg, rgba(255,255,255,.07) 0%, rgba(255,255,255,0) 30%)'}} />
      </div>
    </>
  );
};

export const BentoCaption: React.FC<P> = ({f}) => {
  const a = SCENE.BENTO.in - 8;
  const chip = (txt: string) => (
    <div style={{...sc(26, 500, 0.04), color: C.t1, padding: '13px 22px', borderRadius: 999, background: 'rgba(255,255,255,.07)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.1)', marginRight: 14}}>{txt}</div>
  );
  return (
    <>
      <Show f={f} at={a} out={BO} style={{left: 96, top: 196}}>
        <div style={{...sc(26, 500, 0.06), color: C.t2}}>名字的由来</div>
      </Show>
      <Show f={f} at={a + 2} out={BO} dy={30} style={{left: 90, top: 246}}>
        <div style={{...sc(176, 900, 0.02), color: C.t1}}>便当</div>
      </Show>
      <Show f={f} at={a + 6} out={BO} style={{left: 96, top: 456}}>
        <div style={{...disp(40, 500, -0.01), color: 'rgba(245,245,247,.7)'}}>Bento · 弁当</div>
      </Show>
      <Show f={f} at={a + 10} out={BO} style={{left: 96, top: 540}}>
        <div style={{...sc(30, 400, 0.03), lineHeight: 1.65, color: 'rgba(245,245,247,.8)'}}>
          一个盒子，分成大小不一的格子；
          <br />
          主菜占大格，小菜占小格，
          <br />
          每格只装一样菜。
        </div>
      </Show>
      <Show f={f} at={a + 18} out={BO} style={{left: 96, top: 770, display: 'flex'}}>
        {chip('格子 → 卡片')}
        {chip('一样菜 → 一个信息')}
      </Show>
    </>
  );
};

/* =====================================================================
 * 03 2010 Windows Phone 7 → 2012 Windows 8：动态磁贴
 * 发布会式的“产品镜头”：左边是年份和一句话说明（和 02、04 同一种版式），右边一整面磁贴墙
 * 斜着往右后方退进黑暗里，镜头沿着墙慢慢横移。一种主题色（钴蓝）的几档深浅，只有“照片”“音乐”两块是图；
 * 字是主角：细体大数字 + 左下角的小名字。整面墙共用一套光：左上一盏主光、一道扫光，越远越暗。
 * ===================================================================== */
const MI = SCENE.METRO.in;
const MO = SCENE.METRO.out;
const W = '#FFFFFF';
const DIM = 'rgba(255,255,255,.7)';
const mixHex = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
  const [x, y] = [p(a), p(b)];
  return '#' + x.map((v, k) => Math.round(v + (y[k] - v) * t).toString(16).padStart(2, '0')).join('');
};
/** 磁贴底色：[上, 下]，上沿只比下沿亮一点点 */
const tone = (hex: string): [string, string] => [mixHex(hex, W, 0.06), hex];
export const METRO_FILL: [string, string][] = ['#0E2A80', '#2D6BFF', '#1B3FAE', '#2458F0', '#1A3A9E', '#081A55', '#14307F'].map(tone);
const label: CSS = {position: 'absolute', left: 20, bottom: 16, ...sc(19, 400, 0.04), color: 'rgba(255,255,255,.94)'};

/** 整面墙共用的光：渐变画在墙的坐标里，每块磁贴各自裁出自己那一块，所以光是连贯的。盖在内容上面（远处的字也一起暗下去） */
const LW = 3800;
const LH = 1200;
const FOG = '0,4,22';
const wallLight = (f: number, x: number, y: number): CSS => {
  const s = tween(f, MI - 4, 72, 18, 104, E.inOut); // 一道很宽、很淡的扫光，从近处扫向远处
  return {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    backgroundImage: [
      `linear-gradient(104deg, rgba(255,255,255,0) ${s - 9}%, rgba(255,255,255,.075) ${s}%, rgba(255,255,255,0) ${s + 9}%)`,
      `radial-gradient(1200px 820px at ${MX0 + 60}px ${MY0 - 40}px, rgba(255,255,255,.13), rgba(255,255,255,0) 72%)`,
      `linear-gradient(90deg, rgba(${FOG},0) ${MX0 + 420}px, rgba(${FOG},.38) ${MX0 + 1080}px, rgba(${FOG},.72) ${MX0 + 1640}px, rgba(${FOG},.9) ${MX0 + 2100}px)`,
      `linear-gradient(180deg, rgba(${FOG},0) ${MY0 + 300}px, rgba(${FOG},.22) ${MY0 + 760}px)`,
    ].join(','),
    backgroundSize: `${LW}px ${LH}px`,
    backgroundPosition: `${-x}px ${-y}px`,
    backgroundRepeat: 'no-repeat',
  };
};

/** 镜头：墙以自己的左边为轴转向右后方（近大远小，远处一直排到画外），像一扇门慢慢打开：角度 36° → 28°；
 *  进 iOS 之前摆正，卡片平着飞进手机。只作用在磁贴和开始屏幕上，左边的字和底栏不动 */
export const METRO_ORIGIN = `${MX0}px ${MY0 + 354}px`;
export const metroTilt = (f: number) => {
  const a = tween(f, T('METRO') - 2, 40, 0, 1, E.out) * (1 - tween(f, T('IOS') - 6, 34, 0, 1, E.inOut));
  if (a <= 0.0005) return undefined;
  const th = 36 - 8 * tween(f, T('METRO') + 6, 100, 0, 1, E.inOut);
  return `perspective(1400px) rotateY(${th * a}deg)`;
};

/** 磁贴内容从右侧滑入（Metro 的“翻页”手感） */
const Slide: React.FC<{f: number; at: number; out: number; style?: CSS; children: React.ReactNode}> = ({f, at, out, style, children}) => {
  const o = tween(f, at, 12, 0, 1) * (1 - tween(f, out, 8, 0, 1, E.inOut));
  if (o <= 0.001) return null;
  const x = (1 - tween(f, at, 24, 0, 1, E.out)) * 36;
  return <div style={{position: 'absolute', inset: 0, opacity: o, transform: `translateX(${x}px)`, ...style}}>{children}</div>;
};

/** 细线图标：100×100 的格子里画，线宽按显示尺寸换算成 ~1.8px */
const Glyph: React.FC<{d: string; size: number; x: number; y: number; fill?: string}> = ({d, size, x, y, fill}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{position: 'absolute', left: x, top: y}}>
    <path d={d} fill={fill ?? 'none'} stroke={W} strokeWidth={(1.8 * 100) / size} strokeLinejoin="round" strokeLinecap="round" />
  </svg>
);
const G = {
  mail: 'M8 22 H92 V80 H8 Z M8 22 L50 54 L92 22',
  bubble: 'M10 14 H90 V68 H42 L20 88 V68 H10 Z',
  sun: 'M50 32 A18 18 0 1 1 49.9 32 Z M50 6 V18 M50 82 V94 M6 50 H18 M82 50 H94 M19 19 L27 27 M73 73 L81 81 M81 19 L73 27 M27 73 L19 81',
  ring: 'M50 4 A46 46 0 1 1 49.9 4 Z',
  play: 'M41 32 L70 50 L41 68 Z',
  camera: 'M8 30 H30 L38 18 H62 L70 30 H92 V82 H8 Z M50 38 A17 17 0 1 1 49.9 38 Z',
  gear: 'M50 34 A16 16 0 1 1 49.9 34 Z M50 8 V20 M50 80 V92 M8 50 H20 M80 50 H92 M20 20 L29 29 M71 71 L80 80 M80 20 L71 29 M29 71 L20 80',
  pad: 'M14 34 Q14 24 26 24 H74 Q86 24 86 34 L92 70 Q94 82 82 82 Q74 82 68 70 H32 Q26 82 18 82 Q6 82 8 70 Z M30 40 V58 M21 49 H39 M66 44 V45 M74 52 V53',
  bag: 'M16 32 H84 L78 90 H22 Z M36 32 V24 Q36 10 50 10 Q64 10 64 24 V32',
  globe: 'M50 6 A44 44 0 1 1 49.9 6 Z M6 50 H94 M50 6 Q22 50 50 94 Q78 50 50 6',
  pin: 'M50 92 Q20 58 20 38 A30 30 0 1 1 80 38 Q80 58 50 92 Z M50 26 A12 12 0 1 1 49.9 26 Z',
};

/* ---------- 照片：第 001 期的包豪斯海报，压成钴蓝双色调（到了 06 个人主页，同一张卡片换回原色） ---------- */
const PK = 464 / 610;
const Photo: React.FC<P> = ({f}) => {
  const z = 1.1 - 0.1 * tween(f, MI - 6, 80, 0, 1, (t) => t);
  return (
    <>
      <svg width={464} height={464} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id="duo" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0 0 0 1 0" />
            <feComponentTransfer>
              <feFuncR type="table" tableValues="0.016 0.07 0.13 0.5" />
              <feFuncG type="table" tableValues="0.05 0.17 0.33 0.65" />
              <feFuncB type="table" tableValues="0.2 0.5 0.9 1" />
            </feComponentTransfer>
          </filter>
        </defs>
        <g transform={`translate(232 232) scale(${z}) translate(-232 -232)`}>
          {/* 只取海报中间的几何部分（半个圆、竖线、红方块），避开海报上的字 */}
          <image href={staticFile('01-bento-grid/poster-001.png')} x={-420 * PK} y={-140 * PK} width={1160 * PK} height={958 * PK} filter="url(#duo)" />
        </g>
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 110, background: 'linear-gradient(180deg, rgba(3,10,40,0), rgba(3,10,40,.5))'}} />
    </>
  );
};

/* ---------- 音乐：一张黑胶唱片，标签在转，反光不动 ---------- */
const Disc: React.FC<P> = ({f}) => {
  const D = 380;
  const rot = (f - MI) * 2.4;
  return (
    <>
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(120% 100% at 85% 0%, #2458F0 0%, #0E2A8A 50%, #06144A 100%)'}} />
      <div
        style={{
          position: 'absolute',
          left: 332 - D / 2,
          top: 150 - D / 2,
          width: D,
          height: D,
          borderRadius: '50%',
          background: [
            'conic-gradient(from 300deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,.13) 22deg, rgba(255,255,255,0) 50deg, rgba(255,255,255,0) 180deg, rgba(255,255,255,.08) 202deg, rgba(255,255,255,0) 230deg)',
            'repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,.035) 0px, rgba(255,255,255,.035) 1px, rgba(0,0,0,0) 1.5px, rgba(0,0,0,0) 5px)',
            'radial-gradient(circle at 50% 50%, #0C1D5E 0%, #030A2C 70%)',
          ].join(','),
          boxShadow: '0 24px 60px rgba(0,4,24,.55), inset 0 0 0 1px rgba(255,255,255,.06)',
        }}
      >
        <div style={{position: 'absolute', left: D / 2 - 66, top: D / 2 - 66, width: 132, height: 132, borderRadius: '50%', background: 'linear-gradient(140deg, #9DBAFF 0%, #3A72FF 55%, #1E4FE0 100%)', transform: `rotate(${rot}deg)`}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 26, textAlign: 'center', ...seg(15, 400), letterSpacing: '0.2em', color: 'rgba(255,255,255,.9)'}}>BENTO GRID</div>
          <div style={{position: 'absolute', left: 61, top: 61, width: 10, height: 10, borderRadius: 5, background: '#030A2C'}} />
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 26, textAlign: 'center', ...seg(13, 400), letterSpacing: '0.16em', color: 'rgba(255,255,255,.7)'}}>LAYOUT 01</div>
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 250, background: 'linear-gradient(180deg, rgba(4,12,50,0), rgba(4,12,50,.82) 62%)'}} />
    </>
  );
};

export const MetroContent: React.FC<P & {i: number}> = ({f, i}) => {
  const at = MI + [0, 2, 4, 6, 3, 5, 7][i] * 3;
  const {x, y} = cardState(f, i).rect;
  const lo = tween(f, MI - 10, 18) * (1 - tween(f, MO, 8, 0, 1, E.inOut));
  const light = lo > 0.001 && <div style={{...wallLight(f, x, y), opacity: lo}} />;
  const body = (() => {
    switch (i) {
      case 0:
        return (
          <Slide f={f} at={at} out={MO}>
            <Photo f={f} />
            <div style={label}>照片</div>
          </Slide>
        );
      case 1: {
        // 动态磁贴：内容整块向上翻，露出下一条日程
        const p = tween(f, MI + 30, 20, 0, 1, E.inOut);
        const panel = (title: string, sub: string, time: string) => (
          <div style={{position: 'relative', height: 220}}>
            <div style={{position: 'absolute', left: 22, top: 22, ...sc(28, 500, 0.02), color: W}}>{title}</div>
            <div style={{position: 'absolute', left: 22, top: 64, ...sc(18, 400, 0.04), color: DIM}}>{sub}</div>
            <div style={{position: 'absolute', left: 22, top: 94, ...seg(20, 400), color: DIM}}>{time}</div>
          </div>
        );
        return (
          <Slide f={f} at={at} out={MO} style={{overflow: 'hidden'}}>
            <div style={{transform: `translateY(${-220 * p}px)`}}>
              {panel('设计评审', '会议室 B', '14:00 – 15:00')}
              {panel('布局 01 发布', 'Design Style', '20:00')}
            </div>
            <div style={label}>日历</div>
            <div style={{position: 'absolute', right: 22, bottom: 14, textAlign: 'right'}}>
              <div style={{...seg(96, 300), letterSpacing: '-0.02em', color: W}}>24</div>
              <div style={{...sc(18, 400, 0.06), color: DIM, marginTop: 4}}>周二</div>
            </div>
          </Slide>
        );
      }
      case 2:
        return (
          <Slide f={f} at={at} out={MO}>
            <Glyph d={G.mail} size={50} x={22} y={30} />
            <div style={{position: 'absolute', right: 22, top: 18, ...seg(76, 300), color: W}}>12</div>
            <div style={label}>邮件</div>
          </Slide>
        );
      case 3:
        return (
          <Slide f={f} at={at} out={MO}>
            <div style={{position: 'absolute', left: 18, top: 18, ...seg(80, 300), letterSpacing: '-0.02em', color: W}}>23°</div>
            <Glyph d={G.sun} size={40} x={160} y={28} />
            <div style={{position: 'absolute', left: 22, top: 116, ...sc(18, 400, 0.04), color: DIM}}>上海  晴</div>
            <div style={label}>天气</div>
          </Slide>
        );
      case 4:
        return (
          <Slide f={f} at={at} out={MO}>
            <Glyph d={G.bubble} size={52} x={24} y={30} />
            <div style={{position: 'absolute', left: 92, top: 18, ...seg(76, 300), color: W}}>3</div>
            <div style={{position: 'absolute', right: 22, bottom: 16, textAlign: 'right'}}>
              <div style={{...sc(24, 500), color: W}}>观默</div>
              <div style={{...sc(18, 400, 0.04), color: DIM, marginTop: 10}}>明天见</div>
            </div>
            <div style={label}>消息</div>
          </Slide>
        );
      case 5: {
        const prog = tween(f, at, 90, 0.18, 0.6, (t) => t);
        return (
          <Slide f={f} at={at} out={MO}>
            <Disc f={f} />
            <div style={{position: 'absolute', left: 22, top: 300, ...seg(46, 300), letterSpacing: '-0.01em', color: W}}>Bento Grid</div>
            <div style={{position: 'absolute', left: 24, top: 356, ...sc(18, 400, 0.04), color: DIM}}>Design Style · 布局 01</div>
            <div style={{position: 'absolute', left: 24, right: 24, top: 396, height: 3, borderRadius: 2, background: 'rgba(255,255,255,.22)'}}>
              <div style={{width: `${prog * 100}%`, height: '100%', borderRadius: 2, background: W}} />
            </div>
            <div style={label}>音乐</div>
          </Slide>
        );
      }
      case 6:
        return (
          <Slide f={f} at={at} out={MO}>
            <Glyph d={G.ring} size={60} x={24} y={26} />
            <Glyph d={G.play} size={60} x={26} y={26} fill={W} />
            <div style={{position: 'absolute', left: 104, top: 32}}>
              <div style={{...sc(24, 500), color: W}}>15 秒短片</div>
              <div style={{...sc(18, 400, 0.04), color: DIM, marginTop: 12}}>今天 · 便当盒布局</div>
            </div>
            <div style={{position: 'absolute', right: 22, bottom: 12, ...seg(64, 300), color: W}}>0:15</div>
            <div style={label}>视频</div>
          </Slide>
        );
    }
    return null;
  })();
  return (
    <>
      {body}
      {light}
    </>
  );
};

/** 开始屏幕的其余部分：标题、屏幕外还排着的磁贴（转进来时像翻牌一样一块块立起来） */
const STATIC_TILES: [number, number, number, number, string, string, string][] = [
  [4, 2, 1, 1, '#1D46C2', '相机', G.camera],
  [5, 2, 1, 1, '#112A70', '设置', G.gear],
  [6, 0, 2, 1, '#1A3A9E', '游戏', G.pad],
  [6, 1, 1, 1, '#2458F0', '商店', G.bag],
  [7, 1, 1, 1, '#14307F', '地图', G.pin],
  [6, 2, 2, 1, '#1B3FAE', '浏览器', G.globe],
  [8, 0, 1, 1, '#112A70', '', ''],
  [8, 1, 2, 2, '#1A3A9E', '', ''],
  [9, 0, 2, 1, '#14307F', '', ''],
  [10, 1, 1, 1, '#2458F0', '', ''],
  [10, 2, 1, 1, '#112A70', '', ''],
];
export const MetroChrome: React.FC<P> = ({f}) => {
  const t0 = T('METRO');
  const out = MO;
  return (
    <>
      <Show f={f} at={t0 + 12} out={out} dy={0} style={{left: mx(0) + 2, top: my(0) - 82}}>
        <span style={{...sc(46, 400, 0.04), color: 'rgba(255,255,255,.92)'}}>开始</span>
      </Show>
      {STATIC_TILES.map(([c, r, w, h, col, name, glyph], k) => {
        const at = t0 + 14 + c * 3 + r * 2;
        const p = tween(f, at, 24, 0, 1, E.out);
        const o = tween(f, at, 8) * (1 - tween(f, out, 8, 0, 1, E.inOut));
        if (o <= 0.001) return null;
        const tw = mw(w);
        const th = mw(h);
        const [top, bot] = tone(col);
        const gs = w === 1 ? 52 : 60;
        return (
          <div
            key={k}
            style={{
              position: 'absolute',
              left: mx(c),
              top: my(r),
              width: tw,
              height: th,
              borderRadius: MR,
              overflow: 'hidden',
              background: `linear-gradient(180deg, ${top}, ${bot})`,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,.14), inset 0 0 0 1px rgba(255,255,255,.05)',
              opacity: o,
              transform: `perspective(1600px) rotateY(${(1 - p) * -60}deg)`,
              transformOrigin: 'left center',
            }}
          >
            {glyph && <Glyph d={glyph} size={gs} x={(tw - gs) / 2} y={(th - gs) / 2 - 10} />}
            {name && <div style={label}>{name}</div>}
            <div style={wallLight(f, mx(c), my(r))} />
          </div>
        );
      })}
    </>
  );
};

/** 左边的字：和 02、04 同一种版式（年份 → 名字 → 一句话 → 一张小图） */
export const MetroCaption: React.FC<P> = ({f}) => {
  const a = MI - 6; // 比 04 晚 4 帧：等磁贴先从标题旁边让开
  const node = (x: number, year: string, name: string, dev: string, d: number) => (
    <Show f={f} at={a + 14 + d} out={MO} dy={12} style={{left: x, top: 0}}>
      <div style={{...seg(34, 400), letterSpacing: '-0.01em', color: C.t1}}>{year}</div>
      <div style={{...seg(22, 400), letterSpacing: '0.01em', color: 'rgba(245,245,247,.62)', marginTop: 34}}>{name}</div>
      <div style={{...sc(20, 400, 0.06), color: 'rgba(245,245,247,.42)', marginTop: 10}}>{dev}</div>
    </Show>
  );
  const line = tween(f, a + 16, 26, 0, 1, E.out);
  return (
    <>
      <Show f={f} at={a} out={MO} dy={30} style={{left: 150, top: 200}}>
        <div style={{...disp(176, 600, -0.05), color: C.t1}}>2010</div>
      </Show>
      <Show f={f} at={a + 4} out={MO} style={{left: 156, top: 410}}>
        <div style={{...sc(48, 700, 0.03), color: C.t1}}>Windows Phone · 动态磁贴</div>
      </Show>
      <Show f={f} at={a + 8} out={MO} style={{left: 156, top: 496}}>
        <div style={{...sc(30, 400, 0.03), lineHeight: 1.65, color: 'rgba(245,245,247,.75)'}}>
          大小不一的磁贴拼满开始屏幕，
          <br />
          每一块都会翻面，实时显示内容。
        </div>
      </Show>
      {/* 小时间线：2010 手机 → 2012 电脑 */}
      <div style={{position: 'absolute', left: 158, top: 684, width: 440, height: 140, opacity: 1 - tween(f, MO, 8, 0, 1, E.inOut)}}>
        <div style={{position: 'absolute', left: 4, top: 48, width: 300 * line, height: 1, background: 'rgba(245,245,247,.28)'}} />
        {[0, 300].map((x, k) => (
          <div key={k} style={{position: 'absolute', left: x, top: 44, width: 9, height: 9, borderRadius: 5, background: k ? '#2D6BFF' : C.t1, transform: `scale(${spr(f, a + 16 + k * 8, POP, 30)})`}} />
        ))}
        <div style={{position: 'absolute', inset: 0}}>
          {node(0, '2010', 'Windows Phone 7', '手机', 0)}
          {node(300, '2012', 'Windows 8', '搬上电脑', 8)}
        </div>
      </div>
    </>
  );
};

/* =====================================================================
 * 04 2020 iOS 14：桌面小组件（小 / 中 / 大）
 * ===================================================================== */
const IO = SCENE.IOS.out;
const IOS_ORDER = [2, 0, 1, 3, 5, 4, 6];
const tx = (size: number, w = 600, color = '#fff'): CSS => ({...sc(size, w, 0), color});

const Sunset: React.FC<P> = ({f}) => {
  const z = 1.04 + 0.04 * tween(f, SCENE.IOS.in, 90, 0, 1, (t) => t);
  return (
    <svg width={384} height={180} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="ios-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#35278C" />
          <stop offset=".42" stopColor="#B4479F" />
          <stop offset=".7" stopColor="#FF7A57" />
          <stop offset=".78" stopColor="#FFC06E" />
        </linearGradient>
        <linearGradient id="ios-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4B2D7F" />
          <stop offset="1" stopColor="#170F3C" />
        </linearGradient>
        <radialGradient id="ios-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFE3A6" stopOpacity=".9" />
          <stop offset="1" stopColor="#FFB070" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g transform={`translate(192 90) scale(${z}) translate(-192 -90)`}>
        <rect width={384} height={140} fill="url(#ios-sky)" />
        <circle cx={262} cy={134} r={90} fill="url(#ios-glow)" />
        <circle cx={262} cy={134} r={36} fill="#FFE9B8" />
        <rect y={134} width={384} height={60} fill="url(#ios-sea)" />
        {[0, 1, 2, 3, 4].map((k) => (
          <rect key={k} x={262 - (34 - k * 6)} y={142 + k * 7} width={(34 - k * 6) * 2} height={3} rx={1.5} fill="#FFD59A" opacity={0.75 - k * 0.12} />
        ))}
      </g>
    </svg>
  );
};

const Ring: React.FC<{cx: number; cy: number; v: number; p: number; glyph: React.ReactNode}> = ({cx, cy, v, p, glyph}) => {
  const r = 27;
  const L = 2 * Math.PI * r;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#3A3A3C" strokeWidth={6} />
      {v > 0 && <circle cx={cx} cy={cy} r={r} fill="none" stroke="#34C759" strokeWidth={6} strokeLinecap="round" strokeDasharray={`${L * v * p} ${L}`} transform={`rotate(-90 ${cx} ${cy})`} />}
      <g transform={`translate(${cx} ${cy})`}>{glyph}</g>
    </g>
  );
};

export const IosContent: React.FC<P & {i: number}> = ({f, i}) => {
  const at = SCENE.IOS.in + IOS_ORDER[i] * 3;
  switch (i) {
    case 0:
      return (
        <Pop f={f} at={at} out={IO} origin="50% 50%">
          <Sunset f={f} />
          <div style={{position: 'absolute', left: 18, bottom: 16}}>
            <div style={{...tx(13, 600, 'rgba(255,255,255,.82)')}}>回忆 · 去年今天</div>
            <div style={{...tx(19, 700), marginTop: 7}}>海边的日落</div>
          </div>
        </Pop>
      );
    case 1:
      return (
        <Pop f={f} at={at} out={IO} origin="50% 50%">
          <div style={{position: 'absolute', left: 16, top: 16, ...tx(16, 600)}}>上海</div>
          <div style={{position: 'absolute', left: 14, top: 40, ...disp(54, 500, -0.02), color: '#fff'}}>23°</div>
          <svg width={22} height={22} style={{position: 'absolute', left: 16, top: 110}}>
            <circle cx={11} cy={11} r={8} fill="#FFD60A" />
          </svg>
          <div style={{position: 'absolute', left: 16, top: 136, ...tx(14, 600)}}>晴</div>
          <div style={{position: 'absolute', left: 16, top: 156, ...tx(12, 500, 'rgba(255,255,255,.88)')}}>最高 26° 最低 18°</div>
        </Pop>
      );
    case 2:
      return (
        <Pop f={f} at={at} out={IO} origin="50% 50%">
          <div style={{position: 'absolute', left: 16, top: 16, ...tx(14, 700, '#FF3B30')}}>星期二</div>
          <div style={{position: 'absolute', left: 14, top: 36, ...disp(58, 500, -0.02), color: '#1D1D1F'}}>24</div>
          <div style={{position: 'absolute', left: 16, top: 112, width: 4, height: 50, borderRadius: 2, background: '#FF3B30'}} />
          <div style={{position: 'absolute', left: 28, top: 114, ...tx(14, 600, '#1D1D1F')}}>设计评审</div>
          <div style={{position: 'absolute', left: 28, top: 138, ...tx(12, 500, '#8E8E93')}}>14:00 – 15:00</div>
        </Pop>
      );
    case 3: {
      const p = tween(f, at + 4, 36, 0, 1, E.out);
      const dev = (w: number, h: number, r: number) => <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={r} fill="#fff" />;
      return (
        <Pop f={f} at={at} out={IO} origin="50% 50%">
          <svg width={180} height={180} style={{position: 'absolute', inset: 0}}>
            <Ring cx={53} cy={53} v={0.82} p={p} glyph={dev(12, 21, 3)} />
            <Ring cx={127} cy={53} v={0.64} p={p} glyph={<><circle cx={-5} cy={0} r={4} fill="#fff" /><circle cx={5} cy={0} r={4} fill="#fff" /></>} />
            <Ring cx={53} cy={127} v={0.45} p={p} glyph={dev(14, 16, 4)} />
            <Ring cx={127} cy={127} v={0} p={p} glyph={null} />
          </svg>
        </Pop>
      );
    }
    case 5: {
      const hr = (9 + 41 / 60) * 30;
      const mn = 41 * 6;
      const secAng = 18 * 6 + Math.floor((f - SCENE.IOS.in) / 60) * 6;
      return (
        <Pop f={f} at={at} out={IO} origin="50% 50%">
          <svg width={180} height={180} style={{position: 'absolute', inset: 0}}>
            <g transform="translate(90 90)">
              {Array.from({length: 60}, (_, k) => (
                <line key={k} x1={0} y1={-76} x2={0} y2={k % 5 ? -72 : -68} stroke={k % 5 ? '#C7C7CC' : '#1D1D1F'} strokeWidth={k % 5 ? 1 : 2} transform={`rotate(${k * 6})`} />
              ))}
              {[['12', 0, -50], ['3', 52, 6], ['6', 0, 60], ['9', -52, 6]].map(([t, x, y]) => (
                <text key={t as string} x={x as number} y={y as number} textAnchor="middle" style={{...disp(20, 600, 0), fill: '#1D1D1F'}}>{t}</text>
              ))}
              <line x1={0} y1={8} x2={0} y2={-36} stroke="#1D1D1F" strokeWidth={6} strokeLinecap="round" transform={`rotate(${hr})`} />
              <line x1={0} y1={10} x2={0} y2={-58} stroke="#1D1D1F" strokeWidth={4} strokeLinecap="round" transform={`rotate(${mn})`} />
              <line x1={0} y1={14} x2={0} y2={-64} stroke="#FF9500" strokeWidth={2} strokeLinecap="round" transform={`rotate(${secAng})`} />
              <circle r={4} fill="#FF9500" />
            </g>
          </svg>
        </Pop>
      );
    }
    case 4:
      return (
        <Pop f={f} at={at} out={IO} origin="50% 50%">
          <svg width={76} height={76} style={{position: 'absolute', inset: 0}}>
            <ellipse cx={38} cy={36} rx={23} ry={19} fill="#fff" />
            <path d="M22 46 Q20 56 14 58 Q26 58 32 52 Z" fill="#fff" />
          </svg>
        </Pop>
      );
    case 6:
      return (
        <Pop f={f} at={at} out={IO} origin="50% 50%">
          <svg width={76} height={76} style={{position: 'absolute', inset: 0}}>
            <rect x={14} y={24} width={48} height={34} rx={8} fill="#2C2C2E" />
            <rect x={28} y={19} width={20} height={8} rx={3} fill="#2C2C2E" />
            <circle cx={38} cy={41} r={11} fill="#8E8E93" />
            <circle cx={38} cy={41} r={7} fill="#1C1C1E" />
          </svg>
        </Pop>
      );
  }
  return null;
};

/** 手机机身 + 壁纸（在卡片下面） */
export const PhoneBack: React.FC<P> = ({f}) => {
  const t0 = T('IOS');
  const p = tween(f, t0, 30, 0, 1, E.out);
  const o = tween(f, t0, 14) * (1 - tween(f, T('WIRE'), 10, 0, 1, E.inOut));
  if (o <= 0.001) return null;
  const tf = `translateY(${(1 - p) * 60}px) scale(${0.94 + 0.06 * p})`;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o, transform: tf, transformOrigin: '1396px 530px'}}>
      <div style={{position: 'absolute', left: PHONE.x - 14, top: PHONE.y - 14, width: PHONE.w + 28, height: PHONE.h + 28, borderRadius: PHONE.r + 14, background: '#1A1A1C', boxShadow: 'inset 0 0 0 2px #3A3A3C, inset 0 0 0 5px #0C0C0D, 0 50px 120px rgba(0,0,0,.7)'}} />
      <div
        style={{
          position: 'absolute',
          left: PHONE.x,
          top: PHONE.y,
          width: PHONE.w,
          height: PHONE.h,
          borderRadius: PHONE.r,
          overflow: 'hidden',
          background: [
            'radial-gradient(70% 38% at 18% 16%, rgba(70,110,255,.95) 0%, rgba(70,110,255,0) 70%)',
            'radial-gradient(60% 45% at 92% 52%, rgba(178,59,255,.9) 0%, rgba(178,59,255,0) 70%)',
            'radial-gradient(80% 40% at 24% 96%, rgba(255,110,64,.9) 0%, rgba(255,110,64,0) 70%)',
            '#0B1030',
          ].join(','),
        }}
      />
    </div>
  );
};

/** 状态栏、刘海、图标标签、Dock（在卡片上面） */
export const PhoneFront: React.FC<P> = ({f}) => {
  const t0 = T('IOS');
  const o = tween(f, t0 + 10, 14) * (1 - tween(f, T('WIRE'), 10, 0, 1, E.inOut));
  if (o <= 0.001) return null;
  const icon = (x: number, y: number, s: number, bg: string, glyph: React.ReactNode, at: number) => {
    const k = spr(f, at, POP, 40);
    return (
      <div style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: s * 0.235, background: bg, transform: `scale(${k})`, overflow: 'hidden'}}>
        <svg width={s} height={s} viewBox="0 0 76 76" style={{position: 'absolute', inset: 0}}>{glyph}</svg>
      </div>
    );
  };
  const labels = ['信息', '相机', '设置', '音乐'];
  const dockX = (k: number) => 1194 + 33 + k * 92;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o}}>
      <div style={{position: 'absolute', left: 1311, top: PHONE.y, width: 170, height: 32, background: '#000', borderRadius: '0 0 20px 20px'}} />
      <div style={{position: 'absolute', left: 1228, top: 92, ...disp(18, 600, 0), color: '#fff'}}>9:41</div>
      <svg width={80} height={20} style={{position: 'absolute', left: 1508, top: 92}}>
        {[0, 1, 2, 3].map((k) => <rect key={k} x={k * 5} y={12 - k * 3} width={3.5} height={4 + k * 3} rx={1} fill="#fff" />)}
        <path d="M30 8 Q38 2 46 8 M33 11 Q38 7 43 11" stroke="#fff" strokeWidth={2} fill="none" strokeLinecap="round" />
        <circle cx={38} cy={14} r={1.8} fill="#fff" />
        <rect x={52} y={3} width={24} height={12} rx={3.5} fill="none" stroke="rgba(255,255,255,.5)" strokeWidth={1.2} />
        <rect x={54} y={5} width={17} height={8} rx={2} fill="#fff" />
      </svg>
      {icon(ICON_X[2], ICON_Y, 76, 'linear-gradient(180deg,#D8D8DD,#8E8E93)', (
        <>
          <circle cx={38} cy={38} r={20} fill="none" stroke="#3A3A3C" strokeWidth={8} strokeDasharray="5 3.4" />
          <circle cx={38} cy={38} r={11} fill="none" stroke="#3A3A3C" strokeWidth={4} />
        </>
      ), SCENE.IOS.in + 8)}
      {icon(ICON_X[3], ICON_Y, 76, 'linear-gradient(180deg,#FF6482,#FA233B)', (
        <path d="M30 52 V24 L52 19 V46 M30 52 A6 5 0 1 1 29.9 52 M52 46 A6 5 0 1 1 51.9 46" stroke="#fff" strokeWidth={4} fill="#fff" strokeLinejoin="round" />
      ), SCENE.IOS.in + 11)}
      {labels.map((t, k) => (
        <div key={t} style={{position: 'absolute', left: ICON_X[k] - 10, width: 96, top: ICON_Y + 84, textAlign: 'center', ...sc(13, 500, 0), color: '#fff', opacity: tween(f, SCENE.IOS.in + 6 + k * 3, 10)}}>{t}</div>
      ))}
      <div style={{position: 'absolute', left: 1383, top: 866, display: 'flex', gap: 8}}>
        <div style={{width: 7, height: 7, borderRadius: 4, background: '#fff'}} />
        <div style={{width: 7, height: 7, borderRadius: 4, background: 'rgba(255,255,255,.4)'}} />
      </div>
      <div style={{position: 'absolute', left: 1194, top: 884, width: 404, height: 84, borderRadius: 32, background: 'rgba(255,255,255,.2)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.14)'}} />
      {icon(dockX(0), 895, 62, 'linear-gradient(180deg,#5BF675,#0CBD2A)', <path d="M26 20 Q20 22 20 30 Q24 46 46 56 Q54 56 56 50 L50 42 L44 45 Q36 40 31 32 L34 26 Z" fill="#fff" />, SCENE.IOS.in + 14)}
      {icon(dockX(1), 895, 62, 'linear-gradient(180deg,#5AC8FA,#007AFF)', (
        <>
          <circle cx={38} cy={38} r={24} fill="none" stroke="#fff" strokeWidth={3} />
          <path d="M48 28 L42 42 L28 48 L34 34 Z" fill="#fff" />
        </>
      ), SCENE.IOS.in + 16)}
      {icon(dockX(2), 895, 62, 'linear-gradient(180deg,#5FB0FF,#1E6FFF)', <path d="M16 24 H60 V54 H16 Z M16 24 L38 42 L60 24" stroke="#fff" strokeWidth={3.5} fill="none" strokeLinejoin="round" />, SCENE.IOS.in + 18)}
      {icon(dockX(3), 895, 62, 'linear-gradient(180deg,#FFD24C,#FF9F0A)', <path d="M22 26 H54 M22 38 H54 M22 50 H42" stroke="#fff" strokeWidth={4} strokeLinecap="round" />, SCENE.IOS.in + 20)}
    </div>
  );
};

export const IosCaption: React.FC<P> = ({f}) => {
  const a = SCENE.IOS.in - 10;
  const mini = (cols: number, rows: number, name: string, x: number) => (
    <g transform={`translate(${x} 0)`}>
      {Array.from({length: 16}, (_, k) => {
        const c = k % 4;
        const r = Math.floor(k / 4);
        return <rect key={k} x={c * 22} y={r * 22} width={16} height={16} rx={5} fill="rgba(255,255,255,.12)" />;
      })}
      <rect x={-1} y={-1} width={cols * 22 - 4} height={rows * 22 - 4} rx={9} fill="#fff" />
      <text x={41} y={124} textAnchor="middle" style={{...sc(22, 500, 0.04), fill: 'rgba(245,245,247,.8)'}}>{name}</text>
    </g>
  );
  return (
    <>
      <Show f={f} at={a} out={IO} dy={30} style={{left: 150, top: 200}}>
        <div style={{...disp(176, 600, -0.05), color: C.t1}}>2020</div>
      </Show>
      <Show f={f} at={a + 4} out={IO} style={{left: 156, top: 410}}>
        <div style={{...sc(48, 700, 0.03), color: C.t1}}>iOS 14 · 桌面小组件</div>
      </Show>
      <Show f={f} at={a + 8} out={IO} style={{left: 156, top: 496}}>
        <div style={{...sc(30, 400, 0.03), lineHeight: 1.65, color: 'rgba(245,245,247,.75)'}}>
          小、中、大三种尺寸，
          <br />
          和图标一起拼进同一张网格。
        </div>
      </Show>
      <Show f={f} at={a + 14} out={IO} style={{left: 158, top: 680}}>
        <svg width={420} height={140}>
          {mini(2, 2, '小', 0)}
          {mini(4, 2, '中', 140)}
          {mini(4, 4, '大', 280)}
        </svg>
      </Show>
    </>
  );
};
