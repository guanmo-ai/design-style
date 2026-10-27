/**
 * 02:30–05:30 来历：一条线，一百年。
 * 左半（纸）：年份是四个数字滚轮，像里程表一样向上滚；右半（墨）：四幅示意图同时向下滚——全片的反向滚动在这里缩小再演一遍。
 *   1927 三联银幕 → 1959 电话分屏 → 2009 Aero Snap → 2015 Split View
 */
import React from 'react';
import {Img, staticFile} from 'remotion';
import {C} from '../tokens';
import {BELT, ChProps, Cursor, EXPO, Page, Rise, SLIDE, Wheel, clamp, disp, lerp, mono, popEase, rgba, sc, tween} from './ui';
import type {SeamStyle} from './SplitScreen';

export const historySeam = (_f: number): SeamStyle => ({line: C.blue, pillBg: C.blue, pillFg: C.paper});

/** 每一站“到位”的局部帧；前一站滚走用 18 帧 */
export const STOP_AT = [18, 52, 94, 136];
const ROLL = 18;
const YEARS = [
  {year: '1927', title: '三联银幕', desc: '《拿破仑》：三台放映机，三块银幕并排', tag: 'POLYVISION'},
  {year: '1959', title: '电话分屏', desc: '《枕边细语》：一通电话，把两个人放在左右两半', tag: 'PILLOW TALK'},
  {year: '2009', title: '窗口贴边', desc: 'Windows 7 Aero Snap：拖到屏幕边缘，自动占满一半', tag: 'AERO SNAP'},
  {year: '2015', title: '分屏视图', desc: 'iPad Split View 与 OS X El Capitan：两个 App，中缝可拖', tag: 'SPLIT VIEW'},
];
// 每个数字滚轮的累计位置（只往前滚）：千 / 百 / 十 / 个
const WHEELS = [
  [1, 1, 2, 2],
  [9, 9, 10, 10],
  [2, 5, 10, 11],
  [7, 9, 9, 15],
];

/** 第 k 站的滚动进度（k ≥ 1），带一点点逐位的错开 */
const rollP = (f: number, k: number, stagger = 0) => BELT(clamp((f - (STOP_AT[k] - ROLL - 2 + stagger)) / ROLL));
/** 整体“第几站”（小数）：右半的示意图、左半的标题跟着它滚 */
const rIndex = (f: number) => YEARS.reduce((s, _, k) => (k === 0 ? 0 : s + rollP(f, k)), 0);

const CX = 1553; // 右半的中心
const CY = 520;

// ───────── 四幅示意图（局部时间 g，单位帧） ─────────
const Triptych: React.FC<{g: number}> = ({g}) => {
  const W = 200;
  const Hh = 150;
  const gap = 6;
  const open = tween(g, 8, 18, 0, 1, EXPO);
  const panes = [
    {src: 'dunes', dx: -(W + gap)},
    {src: 'lake', dx: 0},
    {src: 'ocean', dx: W + gap},
  ];
  const sx = tween(g, 0, 10, 0, 1, EXPO);
  return (
    <div style={{position: 'absolute', left: CX - W / 2, top: CY - Hh / 2, width: W, height: Hh}}>
      {/* 4:3 的单块银幕：虚线轮廓留在原地 */}
      <div style={{position: 'absolute', inset: -6, border: `2px dashed ${rgba(C.paper, 0.35)}`, opacity: open}} />
      {panes.map((p, i) => (
        <div key={i} style={{position: 'absolute', left: p.dx * open, top: 0, width: W, height: Hh, overflow: 'hidden', transform: `scale(${i === 1 ? 1 : 1}, ${sx})`, zIndex: i === 1 ? 2 : 1}}>
          <Img src={staticFile(`02-masonry/photos/${p.src}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.2) brightness(0.95)'}} />
        </div>
      ))}
      <div style={{position: 'absolute', left: -(W + gap) - 6, top: Hh + 40, width: 3 * W + 2 * gap + 12, textAlign: 'center', color: C.peri, ...mono(26, 700, 0.06), opacity: open}}>{'3 × 4:3  →  4 : 1'}</div>
      {/* 两条缝 */}
      {[-(W + gap) / 2 - 0.5, (W + gap) / 2 + 0.5].map((x, i) => (
        <div key={i} style={{position: 'absolute', left: W / 2 + x * open * 2 - 2, top: -22 * open, width: 4, height: Hh + 44 * open, background: C.blue, opacity: open, zIndex: 3}} />
      ))}
    </div>
  );
};

const Figure: React.FC<{x: number; y: number; w: number; fg: string; flip?: boolean; s: number}> = ({x, y, w, fg, flip, s}) => {
  const k = flip ? -1 : 1;
  return (
    <svg style={{position: 'absolute', left: x, top: y, overflow: 'visible', transform: `scale(${s})`, transformOrigin: `${w / 2}px 360px`}} width={w} height={360} viewBox={`0 0 ${w} 360`}>
      <circle cx={w / 2} cy={150} r={48} fill={fg} />
      <path d={`M ${w / 2 - 104} 360 C ${w / 2 - 104} 250 ${w / 2 - 66} 214 ${w / 2} 214 C ${w / 2 + 66} 214 ${w / 2 + 104} 250 ${w / 2 + 104} 360 Z`} fill={fg} />
      {/* 听筒 */}
      <g transform={`translate(${w / 2 + k * 62} 150) rotate(${k * -14})`}>
        <rect x={-13} y={-42} width={26} height={84} rx={13} fill={fg} stroke={flip ? C.blue : C.paper} strokeWidth={5} />
      </g>
    </svg>
  );
};
const Phone: React.FC<{g: number}> = ({g}) => {
  const pw = 280;
  const ph = 440;
  const x0 = CX - pw - 2;
  const y0 = CY - ph / 2;
  const a = tween(g, 0, 12, 0, 1, popEase);
  const cord = tween(g, 6, 22, 0, 1, EXPO);
  const len = 560;
  return (
    <>
      <div style={{position: 'absolute', left: x0, top: y0, width: pw, height: ph, background: C.paper, overflow: 'hidden', transform: `scaleY(${a})`}}>
        <Figure x={0} y={ph - 360} w={pw} fg={C.ink} s={1} />
      </div>
      <div style={{position: 'absolute', left: x0 + pw + 4, top: y0, width: pw, height: ph, background: C.blue, overflow: 'hidden', transform: `scaleY(${a})`}}>
        <Figure x={0} y={ph - 360} w={pw} fg={C.paper} flip s={1} />
      </div>
      {/* 电话线：从左边的听筒绕出去，穿过中缝，接到右边 */}
      <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', zIndex: 5}} width={1920} height={1080}>
        <path
          d={`M ${x0 + pw / 2 + 62} ${y0 + 270} C ${x0 + pw / 2 + 62} ${y0 + 400} ${CX - 40} ${y0 + 410} ${CX} ${y0 + 380} S ${CX + pw / 2 - 62} ${y0 + 340} ${CX + pw / 2 - 62} ${y0 + 272}`}
          fill="none"
          stroke={C.peri}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={`${len} ${len}`}
          strokeDashoffset={len * (1 - cord)}
        />
      </svg>
      <div style={{position: 'absolute', left: x0, top: y0 + ph + 34, width: pw * 2 + 4, textAlign: 'center', color: C.peri, ...mono(26, 700, 0.06), opacity: tween(g, 14, 10)}}>{'1 通电话 = 2 个画面'}</div>
    </>
  );
};

const Window: React.FC<{x: number; y: number; w: number; h: number; body: string; bar: string; line?: string}> = ({x, y, w, h, body, bar, line = C.ink}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, background: body, overflow: 'hidden', outline: `3px solid ${line}`}}>
    <div style={{height: 36, background: bar, display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px'}}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{width: 10, height: 10, borderRadius: '50%', background: body}} />
      ))}
    </div>
    <div style={{padding: 14, display: 'flex', flexDirection: 'column', gap: 10}}>
      {[0.9, 0.6, 0.78, 0.5].map((q, i) => (
        <div key={i} style={{height: 8, width: `${q * 100}%`, background: line, opacity: 0.35}} />
      ))}
    </div>
  </div>
);
const SW = 600;
const SH = 440;
const SX = CX - SW / 2;
const SY = CY - SH / 2;
const Snap: React.FC<{g: number}> = ({g}) => {
  // A：贴到左边；B：贴到右边
  const a1 = tween(g, 6, 8, 0, 1, SLIDE);
  const aSnap = tween(g, 14, 12, 0, 1, popEase);
  const b1 = tween(g, 19, 7, 0, 1, SLIDE);
  const bSnap = tween(g, 27, 12, 0, 1, popEase);
  const half = SW / 2 - 2;
  // 窗口 A
  const A = {x: lerp(lerp(SX + 150, SX, a1), SX, aSnap), y: lerp(SY + 70, SY, aSnap), w: lerp(260, half, aSnap), h: lerp(190, SH, aSnap)};
  const Bw = {x: lerp(lerp(SX + 240, SX + SW - 260, b1), SX + SW - half, bSnap), y: lerp(SY + 120, SY, bSnap), w: lerp(260, half, bSnap), h: lerp(190, SH, bSnap)};
  const ghostA = tween(g, 12, 3) * (1 - tween(g, 14, 3));
  const ghostB = tween(g, 25, 3) * (1 - tween(g, 27, 3));
  // 光标：落在 A 的标题栏 → 拖到左缘 → 去 B 的标题栏 → 拖到右缘
  const cx = g < 14 ? lerp(SX + 150 + 130, SX + 20, a1) : lerp(lerp(SX + 20, SX + 240 + 130, tween(g, 14, 6, 0, 1, SLIDE)), SX + SW - 20, b1);
  const cy = g < 14 ? lerp(SY + 70 + 18, SY + 18, a1) : lerp(SY + 18, SY + 120 + 18, tween(g, 14, 6, 0, 1, SLIDE));
  const press = (g >= 4 && g < 14 ? 1 : 0) + (g >= 19 && g < 27 ? 1 : 0);
  const ring = g >= 14 && g < 28 ? tween(g, 14, 12) : g >= 27 ? tween(g, 27, 12) : 0;
  return (
    <>
      <div style={{position: 'absolute', left: SX, top: SY, width: SW, height: SH, border: `3px solid ${C.paper}`, boxSizing: 'content-box', marginLeft: -3, marginTop: -3, opacity: tween(g, 0, 8)}} />
      <div style={{position: 'absolute', left: SX, top: SY, width: SW / 2 - 2, height: SH, background: rgba(C.paper, 0.18), opacity: ghostA}} />
      <div style={{position: 'absolute', left: SX + SW / 2 + 2, top: SY, width: SW / 2 - 2, height: SH, background: rgba(C.paper, 0.18), opacity: ghostB}} />
      <Window x={Bw.x} y={Bw.y} w={Bw.w} h={Bw.h} body={C.blue} bar={C.ink} line={C.paper} />
      <Window x={A.x} y={A.y} w={A.w} h={A.h} body={C.paper} bar={C.ink} />
      <Cursor x={cx} y={cy} press={press > 0 ? 1 : 0} ring={ring} scale={1} />
      <div style={{position: 'absolute', left: SX, top: SY + SH + 34, width: SW, textAlign: 'center', color: C.peri, ...mono(26, 700, 0.06), opacity: tween(g, 24, 10)}}>{'贴边 → 各占 50 %'}</div>
    </>
  );
};

const SplitView: React.FC<{g: number}> = ({g}) => {
  const r = 0.5 + 0.22 * ramp3(g);
  const handleX = SX + SW * r;
  const c = tween(g, 0, 10);
  const appear = tween(g, 0, 8);
  return (
    <>
      <div style={{position: 'absolute', left: SX, top: SY, width: SW, height: SH, opacity: appear, transform: `scaleY(${c})`}}>
        {/* 左：笔记 App */}
        <div style={{position: 'absolute', left: 0, top: 0, width: SW * r - 3, height: SH, background: C.paper, overflow: 'hidden'}}>
          <div style={{height: 34, background: C.ink}} />
          <div style={{padding: 16, display: 'flex', flexDirection: 'column', gap: 12}}>
            {[0.92, 0.7, 0.84, 0.55, 0.76, 0.6, 0.8].map((q, i) => (
              <div key={i} style={{height: 9, width: `${q * 100}%`, background: C.ink, opacity: 0.3}} />
            ))}
          </div>
        </div>
        {/* 右：浏览器 App */}
        <div style={{position: 'absolute', left: SW * r + 3, top: 0, width: SW * (1 - r) - 3, height: SH, background: C.blue, overflow: 'hidden'}}>
          <div style={{height: 34, background: C.ink}} />
          <Img src={staticFile('02-masonry/photos/stairs.jpg')} style={{width: SW * 0.5, height: SH - 34, objectFit: 'cover', objectPosition: '30% 50%'}} />
        </div>
        {/* 中缝上的把手 */}
        <div style={{position: 'absolute', left: SW * r - 7, top: SH / 2 - 36, width: 14, height: 72, borderRadius: 7, background: C.paper, outline: `3px solid ${C.ink}`, zIndex: 4}} />
      </div>
      <Cursor x={handleX} y={SY + SH / 2 + 8} press={g > 3 && g < 20 ? 1 : 0} ring={tween(g, 2, 10)} />
      <div style={{position: 'absolute', left: SX, top: SY + SH + 34, width: SW, textAlign: 'center', color: C.peri, ...mono(26, 700, 0.06), opacity: tween(g, 6, 10)}}>{`${Math.round(r * 100)} : ${100 - Math.round(r * 100)}  ·  中缝可拖`}</div>
    </>
  );
};
/** 0 → 1 → 0：把手往右拖，再回到中间 */
const ramp3 = (g: number) => {
  const up = SLIDE(clamp((g - 4) / 12));
  const dn = SLIDE(clamp((g - 24) / 10));
  return up * (1 - dn);
};

const DIAGRAMS = [Triptych, Phone, Snap, SplitView];

export const History: React.FC<ChProps> = (p) => {
  const {f, side} = p;
  const L = side === 'L';
  const r = rIndex(f);
  // 个位最先动，千位最后动（错开 0 / 2 / 3 / 4 帧）
  const wheelV = (j: number) => {
    let v = WHEELS[j][0];
    for (let k = 1; k < 4; k++) v += (WHEELS[j][k] - WHEELS[j][k - 1]) * rollP(f, k, [4, 3, 2, 0][j]);
    return v;
  };
  const SZ = 380;
  const cw = SZ * 0.66;
  return (
    <Page p={p} bg={L ? C.paper : C.ink}>
      {L && (
        <>
          <div style={{position: 'absolute', left: 96, top: 62, display: 'flex', alignItems: 'baseline', gap: 18}}>
            <Rise f={f} at={6} d={16} pad={8}>
              <span style={{...mono(22, 700, 0.14), color: C.grey}}>{'ORIGIN'}</span>
            </Rise>
            <Rise f={f} at={9} d={16} pad={8}>
              <span style={{...sc(30, 900), color: C.ink}}>{'一条线，一百年'}</span>
            </Rise>
          </div>
          {/* 年份：四个数字滚轮 */}
          <div style={{position: 'absolute', left: 96, top: 150, display: 'flex', color: C.ink, ...disp(SZ, 100, -0.02)}}>
            {[0, 1, 2, 3].map((j) => (
              <Wheel key={j} v={wheelV(j)} h={SZ * 1.02} style={{width: cw}} />
            ))}
          </div>
          {/* 标题 + 说明：跟着右边同一个进度向上滚 */}
          <div style={{position: 'absolute', left: 96, top: 590, width: 1010, height: 250, overflow: 'hidden'}}>
            <div style={{transform: `translateY(${-r * 250}px)`}}>
              {YEARS.map((y, k) => (
                <div key={k} style={{height: 250}}>
                  <div style={{...sc(96, 900, -0.01), color: C.ink, lineHeight: 1.1}}>{y.title}</div>
                  <div style={{...sc(38, 500), color: C.grey, marginTop: 14}}>{y.desc}</div>
                </div>
              ))}
            </div>
          </div>
          {/* 四站进度 */}
          <div style={{position: 'absolute', left: 96, top: 962, display: 'flex', gap: 12}}>
            {YEARS.map((_, k) => {
              const on = clamp(1 - Math.abs(r - k));
              return <div key={k} style={{width: 120, height: 10, background: rgba(C.ink, 0.16), position: 'relative'}}><div style={{position: 'absolute', inset: 0, background: C.blue, transform: `scaleX(${on})`, transformOrigin: 'left'}} /></div>;
            })}
          </div>
        </>
      )}
      {!L && (
        <>
          {YEARS.map((y, k) => {
            const off = (r - k) * 1080; // 右半向下：下一站从上方进来
            if (Math.abs(r - k) > 1.05) return null;
            const g = f - (STOP_AT[k] - ROLL - 4 + (k === 0 ? -12 : 0));
            const D = DIAGRAMS[k];
            return (
              <div key={k} style={{position: 'absolute', inset: 0, transform: `translateY(${off}px)`}}>
                <div style={{position: 'absolute', left: 1187 + 64, top: 62, color: C.peri, ...mono(24, 700, 0.14)}}>{y.tag}</div>
                <div style={{position: 'absolute', inset: 0, transform: `scale(1.18)`, transformOrigin: `${CX}px ${CY}px`}}>
                  <D g={g} />
                </div>
              </div>
            );
          })}
        </>
      )}
    </Page>
  );
};
