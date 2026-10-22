/**
 * 003 · Constructivism —— 02 大字 · 03 蒙太奇 · 04 塔（175–400 帧）
 * 每一章都是对一件代表作的“致敬”而不是复刻：只借它的构图原理，不搬原图。
 */
import React from 'react';
import {E, POP, shake, spr, tween} from '../../../src/lib/anim';
import {C, U} from '../tokens';
import {AT} from './timeline';
import {MOUTH} from './opening';
import {arcPath, bar, c01, cam, CAP, Credit, halftone, hull, lerp, mix, on, P, Poly, Pt, pt, pts, Scale, stamp, Tip, Txt, zoomIn} from './ui';

/* ═══════════════ 02 大字：罗德琴科《书》（1924） ═══════════════
 * 一个“喇叭”从嘴里沿 30° 喷出来，КНИГИ 五个字母一个比一个大 —— 字号就是音量。
 */
const TAN = Math.tan((13 * Math.PI) / 180); // 喇叭半张角 13°
const LET = 'КНИГИ';
const LD = [470, 611, 795, 1033, 1343]; // 每个字母离嘴的距离（每次 ×1.3）
export const LENS = pt(1040, 560); // 03 的镜头中心：02 的“嘴”最后长成它

export const Type: React.FC<P> = ({f}) => {
  const t0 = AT.type;
  const A = pt(MOUTH.x, MOUTH.y);
  const L = 2600 * tween(f, t0, 12, 0, 1, E.out);
  const at = (i: number) => t0 + i * 6.25; // 十六分音符一个字母
  const sh = shake(f, LET.split('').map((_, i) => [at(i) + 7, 3 + i * 1.6] as [number, number]));
  const z = 1 + 0.05 * tween(f, t0, 70, 0, 1, E.soft);
  // 收尾：嘴（黑圆）放大、移到画面中央，盖满 → 03 的镜头
  const ex = tween(f, AT.montage - 14, 14, 0, 1, E.in);
  const mc = mix(A, LENS, tween(f, AT.montage - 16, 16, 0, 1, E.inOut));
  const mr = lerp(MOUTH.r, 1300, ex);
  // 声波：每个八分音符从嘴里发出一道弧
  const waves = [];
  for (let k = 0; k < 6; k++) {
    const a = f - (t0 + k * 12.5);
    if (a < 0 || a >= 26) continue;
    waves.push(<path key={k} d={arcPath(A, 96 + a * 17, -30 - 11, -30 + 11)} stroke={C.light} strokeWidth={7} fill="none" opacity={1 - a / 26} />);
  }
  const s1 = stamp(f, t0 + 25, 1.4, 8);
  const s2 = stamp(f, t0 + 31.25, 1.4, 8);
  return (
    <g>
      <g transform={cam(A.x, A.y, z, 0, sh.x, sh.y)}>
        {/* 喇叭：上半红、下半黑 */}
        <Poly p={[A, on(A, L, -L * TAN), on(A, L, 0)]} fill={C.red} />
        <Poly p={[A, on(A, L, 0), on(A, L, L * TAN)]} fill={C.ink} />
        {waves}
        {LET.split('').map((ch, i) => {
          if (f < at(i)) return null;
          const p = tween(f, at(i), 9, 0, 1, E.out);
          const d = LD[i] * lerp(0.12, 1, p);
          const size = 0.4 * d;
          const b = on(A, d, (CAP * size) / 2);
          return (
            <Txt key={i} x={b.x} y={b.y} size={size} w={700} fill={C.light} rot={-30} anchor="middle">
              {ch}
            </Txt>
          );
        })}
        <circle cx={A.x} cy={A.y} r={MOUTH.r} fill={C.ink} />
      </g>
      {/* 右下：副标题（水平 = 要读的字） */}
      <Scale x={1824} y={760} s={s1.s} o={s1.o}>
        <Txt x={1824} y={780} size={84} w={700} anchor="end" ls={0.02}>ПО ВСЕМ ОТРАСЛЯМ</Txt>
      </Scale>
      <Scale x={1824} y={860} s={s2.s} o={s2.o}>
        <Txt x={1824} y={880} size={84} w={700} anchor="end" fill={C.red} ls={0.02}>ЗНАНИЯ</Txt>
      </Scale>
      <Txt x={1824} y={930} size={24} w={500} sc anchor="end" o={tween(f, t0 + 38, 8) * 0.75} ls={0.04}>
        “关于一切知识领域的书”
      </Txt>
      <Credit f={f} at={t0 + 4} out={AT.montage - 10} a="罗德琴科 · 《书》海报（致敬）" b="1924 · 列宁格勒国家出版社 · 照片：莉莉娅·布里克" />
      <Tip f={f} at={t0 + 12} out={AT.montage - 10} left x={96} y={250} a="字号 = 音量" b="五个字母沿斜线一个比一个大，画面在“喊”" />
      {f >= AT.montage - 16 && <circle cx={mc.x} cy={mc.y} r={mr} fill={C.ink} />}
    </g>
  );
};

/* ═══════════════ 03 蒙太奇：斯坦伯格兄弟《持摄影机的人》（1929） ═══════════════
 * 黑屏缩成镜头 → 一只“网点照片”的眼睛分三条切进来 → 红色镜圈、字环、胶片转起来 → 钻进瞳孔。
 */
const eyeTone = (x: number, y: number) => {
  const W2 = 290;
  const k = c01(1 - (x / W2) ** 2);
  const top = x * x < W2 * W2 ? -128 * Math.pow(k, 0.72) - 4 : 0;
  const bot = x * x < W2 * W2 ? 104 * Math.pow(k, 0.95) : 0;
  const inside = x * x < W2 * W2 && y > top && y < bot;
  if (inside) {
    if (y - top < 15) return 1; // 上眼睑的睫毛线
    const dx = x + 4;
    const dy = y + 4;
    const d = Math.hypot(dx, dy);
    if (Math.hypot(x + 34, y + 40) < 19) return 0; // 高光
    if (d < 44) return 1; // 瞳孔
    if (d < 104) {
      const a = Math.atan2(dy, dx);
      const ring = d > 90 ? 0.35 : 0;
      return 0.42 + 0.22 * Math.sin(a * 23 + d * 0.08) * ((d - 44) / 60) + ring;
    }
    return 0.05 + 0.32 * Math.pow(Math.abs(x) / W2, 3) + (bot - y < 10 ? 0.25 : 0);
  }
  // 眼外：皮肤、眼窝、眉毛
  let t = 0.14;
  const crease = -128 * Math.pow(k, 0.5) - 52;
  if (x * x < (W2 + 40) ** 2) {
    if (y < top && y > crease) t = 0.26 + 0.18 * c01((y - crease) / 60);
    if (Math.abs(y - crease) < 7) t = 0.55;
    if (y > bot && y < bot + 70) t = 0.28 - 0.14 * ((y - bot) / 70);
  }
  const brow = -232 + 0.00095 * (x - 30) * (x - 30);
  const bw = 40 * c01(1 - Math.abs(x - 30) / 360);
  if (Math.abs(y - brow) < bw / 2) t = 0.82;
  return t;
};
let EYE = '';
const eyePath = () => EYE || (EYE = halftone(-330, -330, 660, 660, 10, eyeTone));
const SLICES: [number, number][] = [
  [-330, -70],
  [-70, 46],
  [46, 330],
];
const PUPIL = pt(LENS.x - 5.46, LENS.y - 1.46); // 瞳孔中心 (−4, −4) 旋转 −30° 后的位置
const RING_TEXT = 'ЧЕЛОВЕК С КИНОАППАРАТОМ · 1929 · ';

export const Montage: React.FC<P> = ({f}) => {
  const t0 = AT.montage;
  const O = LENS;
  const rOut = lerp(1300, 360, tween(f, t0, 13, 0, 1, E.out));
  const rIn = 302 * tween(f, t0 + 2, 12, 0, 1, E.out);
  const ring = spr(f, t0 + 9, POP, 30);
  const strip = tween(f, t0 + 13, 16, 0, 1, E.out);
  const zp = tween(f, AT.tower - 18, 18, 0, 1, E.in);
  const zs = zoomIn(zp, 34);
  const spin = (f - t0) * 0.55;
  const sh = shake(f, [
    [t0 + 4, 5],
    [t0 + 8, 5],
    [t0 + 12, 7],
  ]);
  // 胶片：沿主轴穿过镜头下方，一直往前走
  const sc = on(O, -2400 * (1 - strip), 330);
  const roll = ((f - t0) * 7) % 190;
  const holes: string[] = [];
  for (let x = -2000; x < 2000; x += 38) {
    const xx = x - (roll % 38);
    holes.push(`M${xx} -76h16v12h-16zM${xx} 64h16v12h-16z`);
  }
  const frames = [];
  for (let k = -11; k < 11; k++) {
    const x = k * 190 - roll + 95;
    frames.push(<rect key={k} x={x - 72} y={-52} width={144} height={104} fill={k % 4 === 0 ? C.red : C.grey} opacity={k % 4 === 0 ? 1 : 0.55} />);
  }
  const ticks: string[] = [];
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const r1 = 448;
    const r2 = i % 6 === 0 ? 480 : 464;
    ticks.push(`M${(Math.cos(a) * r1).toFixed(1)} ${(Math.sin(a) * r1).toFixed(1)}L${(Math.cos(a) * r2).toFixed(1)} ${(Math.sin(a) * r2).toFixed(1)}`);
  }
  const RT = 386;
  return (
    <g>
      <g transform={`${cam(PUPIL.x, PUPIL.y, zs)} translate(${sh.x} ${sh.y})`}>
        {strip > 0 && (
          <g transform={`translate(${sc.x} ${sc.y}) rotate(-30)`}>
            <rect x={-2000} y={-86} width={4000} height={172} fill={C.ink} />
            {frames}
            <path d={holes.join('')} fill={C.paper} />
          </g>
        )}
        {ring > 0.01 && (
          <g transform={`translate(${O.x} ${O.y}) rotate(${spin}) scale(${ring})`}>
            <circle r={400} fill="none" stroke={C.red} strokeWidth={80} />
            <path d={ticks.join('')} stroke={C.ink} strokeWidth={4} />
          </g>
        )}
        <circle cx={O.x} cy={O.y} r={rOut} fill={C.ink} />
        {rIn > 1 && (
          <g>
            <defs>
              <clipPath id="lens3">
                <circle cx={O.x} cy={O.y} r={rIn} />
              </clipPath>
              {SLICES.map(([y0, y1], i) => (
                <clipPath id={`slice3-${i}`} key={i}>
                  <rect x={-1200} y={y0} width={2400} height={y1 - y0} />
                </clipPath>
              ))}
            </defs>
            <g clipPath="url(#lens3)">
              <circle cx={O.x} cy={O.y} r={rIn} fill={C.light} />
              <g transform={`translate(${O.x} ${O.y}) rotate(-30) scale(${lerp(1.25, 1, tween(f, t0, 16, 0, 1, E.out))})`}>
                {SLICES.map((_, i) => {
                  const off = (i % 2 ? -1 : 1) * 720 * (1 - tween(f, t0 + i * 4, 10, 0, 1, E.out));
                  return (
                    <g key={i} clipPath={`url(#slice3-${i})`}>
                      <g transform={`translate(${off} 0)`}>
                        <circle cx={-4} cy={-4} r={44} fill={C.ink} />
                        <path d={eyePath()} fill={C.ink} />
                      </g>
                    </g>
                  );
                })}
              </g>
            </g>
          </g>
        )}
        {ring > 0.01 && (
          <g transform={`translate(${O.x} ${O.y}) rotate(${-spin * 0.7}) scale(${ring})`}>
            <defs>
              <path id="ring3" d={`M${-RT} 0A${RT} ${RT} 0 1 1 ${RT} 0A${RT} ${RT} 0 1 1 ${-RT} 0`} />
            </defs>
            <text fontFamily="Oswald" fontWeight={500} fontSize={38} fill={C.light} letterSpacing={6}>
              <textPath href="#ring3" textLength={2 * Math.PI * RT * 0.985} lengthAdjust="spacing">
                {RING_TEXT.repeat(3)}
              </textPath>
            </text>
          </g>
        )}
      </g>
      <Credit f={f} at={t0 + 14} out={AT.tower - 18} a="斯坦伯格兄弟 · 《持摄影机的人》（致敬）" b="1929 · 维尔托夫的纪录片 · 照片 + 几何 = 蒙太奇" />
      <Tip f={f} at={t0 + 20} out={AT.tower - 18} a="照片也能“组装”" b="转成网点 → 剪成几条 → 斜着拼回去" />
      {f >= AT.tower - 5 && <rect x={0} y={0} width={1920} height={1080} fill={C.ink} opacity={tween(f, AT.tower - 5, 5)} />}
    </g>
  );
};

/* ═══════════════ 04 塔：塔特林《第三国际纪念塔》模型（1919—1920） ═══════════════
 * 黑底上画一座斜着的螺旋钢架：两条螺旋线 + 直母线 + 圆环，从塔基往上“画”出来；
 * 里面三个红色体块各转各的：立方体一年一圈、棱锥一个月一圈、圆柱一天一圈（原设计）。
 */
const TB = pt(1250, 990); // 塔基
const TS = {x: -0.5, y: -0.866}; // 塔的脊线 = 副轴反方向（斜向左上）
const TL = 1000;
const R0 = 330;
const rz = (z: number) => R0 * (1 - 0.7 * (z / TL));
/** 塔的局部坐标 (r, θ, z) → 屏幕；横截面圆在屏幕上是沿主轴拉长、沿脊线压扁（0.3）的椭圆 */
const tp = (r: number, th: number, z: number): Pt => {
  const zz = z + r * Math.sin(th) * 0.3;
  return {x: TB.x + TS.x * zz + U.x * r * Math.cos(th), y: TB.y + TS.y * zz + U.y * r * Math.cos(th)};
};
const VOL = [
  {name: '立方体', speed: '一年转一圈', z: 230, rev: 0.16},
  {name: '棱锥', speed: '一个月转一圈', z: 540, rev: 0.55},
  {name: '圆柱', speed: '一天转一圈', z: 775, rev: 2.0},
];
export const Tower: React.FC<P> = ({f}) => {
  const t0 = AT.tower;
  const t = f - t0;
  const spin = t * 0.01;
  const zmax = TL * tween(f, t0, 28, 0, 1, E.inOut);
  const zmax2 = TL * tween(f, t0 + 6, 26, 0, 1, E.inOut);
  const back: string[] = [];
  const front: string[] = [];
  const seg = (a: Pt, b: Pt, fr: boolean) => (fr ? front : back).push(`M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${b.x.toFixed(1)} ${b.y.toFixed(1)}`);
  // 两条螺旋
  for (const ph of [0, Math.PI]) {
    const n = 180;
    for (let i = 0; i < n; i++) {
      const z1 = (i / n) * TL;
      const z2 = ((i + 1) / n) * TL;
      if (z1 >= zmax) break;
      const zb = Math.min(z2, zmax);
      const th = (z: number) => (Math.PI * 2 * 3 * z) / TL + ph + spin;
      seg(tp(rz(z1), th(z1), z1), tp(rz(zb), th(zb), zb), Math.sin(th((z1 + zb) / 2)) < 0);
    }
  }
  // 直母线（8 条）
  for (let k = 0; k < 8; k++) {
    const th = (k / 8) * Math.PI * 2 + spin;
    if (zmax2 > 1) seg(tp(rz(0), th, 0), tp(rz(zmax2), th, zmax2), Math.sin(th) < 0);
  }
  // 圆环
  for (const zr of [0, 380, 760]) {
    if (zmax < zr) continue;
    const p = tween(f, t0 + (zr / TL) * 28, 8, 0, 1, E.out);
    for (let i = 0; i < 48; i++) {
      const a1 = (i / 48) * Math.PI * 2;
      const a2 = ((i + 1) / 48) * Math.PI * 2;
      if (a1 > p * Math.PI * 2) break;
      seg(tp(rz(zr), a1 + spin, zr), tp(rz(zr), a2 + spin, zr), Math.sin((a1 + a2) / 2 + spin) < 0);
    }
  }
  // 脊梁：一根直的斜梁，伸出塔顶
  const mastTop = tp(0, 0, TL + 140);
  const mastP = tween(f, t0 + 2, 30, 0, 1, E.inOut);
  const mast = mix(tp(0, 0, -60), mastTop, mastP);
  // 体块
  const vols = VOL.map((v, i) => {
    const s = spr(f, t0 + 26 + i * 6.25, POP, 30);
    const a = ((t * v.rev) / 75) * Math.PI * 2;
    let ps: Pt[] = [];
    let edges: [Pt, Pt][] = [];
    if (i === 0) {
      const h = 105 * s;
      const r = 105 * Math.SQRT2 * s;
      const bot = [0, 1, 2, 3].map((k) => tp(r, a + Math.PI / 4 + (k * Math.PI) / 2, v.z - h));
      const top = [0, 1, 2, 3].map((k) => tp(r, a + Math.PI / 4 + (k * Math.PI) / 2, v.z + h));
      ps = [...bot, ...top];
      edges = [0, 1, 2, 3].flatMap((k) => [
        [bot[k], bot[(k + 1) % 4]],
        [top[k], top[(k + 1) % 4]],
        [bot[k], top[k]],
      ]) as [Pt, Pt][];
    } else if (i === 1) {
      const r = 92 * Math.SQRT2 * s;
      const base = [0, 1, 2, 3].map((k) => tp(r, a + (k * Math.PI) / 2, v.z - 100 * s));
      const apex = tp(0, 0, v.z + 110 * s);
      ps = [...base, apex];
      edges = [0, 1, 2, 3].flatMap((k) => [
        [base[k], base[(k + 1) % 4]],
        [base[k], apex],
      ]) as [Pt, Pt][];
    } else {
      const r = 70 * s;
      const ring = (z: number) => Array.from({length: 28}, (_, k) => tp(r, (k / 28) * Math.PI * 2, z));
      ps = [...ring(v.z - 70 * s), ...ring(v.z + 70 * s)];
      edges = [0, 1, 2, 3]
        .map((k) => a + (k * Math.PI) / 2)
        .filter((th) => Math.sin(th) < 0)
        .map((th) => [tp(r, th, v.z - 70 * s), tp(r, th, v.z + 70 * s)] as [Pt, Pt]);
    }
    return {s, ps, edges, c: tp(0, 0, v.z)};
  });
  const z = lerp(1.32, 1, tween(f, t0, 42, 0, 1, E.out));
  const rot = lerp(5, 0, tween(f, t0, 42, 0, 1, E.out));
  // 收尾：纸色斜条一条条盖上来（388–400）
  const wipe = [];
  for (let k = -6; k <= 6; k++) {
    const p = tween(f, AT.textile - 13 + (k + 6) * 0.7, 8, 0, 1, E.inOut);
    if (p > 0) wipe.push(<Poly key={k} p={bar(on(pt(960, 540), 0, k * 200), -30, 4400, 202 * p)} fill={C.paper} />);
  }
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill={C.ink} />
      <g transform={cam(1000, 640, z, rot)}>
        <path d={back.join('')} stroke="#5E584E" strokeWidth={2.5} fill="none" />
        {vols.map((v, i) =>
          v.s > 0.01 ? (
            <g key={i}>
              <Poly p={hull(v.ps)} fill={C.red} />
              <path d={v.edges.map(([a, b]) => `M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${b.x.toFixed(1)} ${b.y.toFixed(1)}`).join('')} stroke="#7E120B" strokeWidth={2.5} fill="none" />
            </g>
          ) : null,
        )}
        <line x1={tp(0, 0, -60).x} y1={tp(0, 0, -60).y} x2={mast.x} y2={mast.y} stroke={C.paper} strokeWidth={7} />
        <path d={front.join('')} stroke={C.paper} strokeWidth={5.5} fill="none" strokeLinecap="round" />
        {/* 标签：水平的字 + 红色引线 */}
        {vols.map((v, i) => {
          const o = tween(f, t0 + 30 + i * 6.25, 8);
          if (o <= 0) return null;
          const lx = 1470;
          const p = tween(f, t0 + 30 + i * 6.25, 12, 0, 1, E.out);
          return (
            <g key={i} opacity={o}>
              <line x1={v.c.x} y1={v.c.y} x2={lerp(v.c.x, lx - 16, p)} y2={v.c.y} stroke={C.red} strokeWidth={3} />
              <rect x={v.c.x - 7} y={v.c.y - 7} width={14} height={14} fill={C.paper} />
              <Txt x={lx} y={v.c.y + 4} size={34} w={900} sc fill={C.paper}>{VOL[i].name}</Txt>
              <Txt x={lx} y={v.c.y + 42} size={24} w={500} sc fill={C.paper} o={0.7}>{VOL[i].speed}</Txt>
            </g>
          );
        })}
      </g>
      <Credit f={f} at={t0 + 8} out={AT.textile - 14} dark a="塔特林 · 第三国际纪念塔（模型，致敬）" b="1919—1920 · 计划高约 400 米，从未建成" />
      <Tip f={f} at={t0 + 16} out={AT.textile - 14} dark a="结构就是装饰" b="钢架、螺旋、会转的体块，全部露在外面" />
      {wipe}
    </g>
  );
};
