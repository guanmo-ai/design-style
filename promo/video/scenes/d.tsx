/** 第四组（一拍一个）：微缩景观 → 低多边形 → 字符画 → 生成艺术 */
import React from 'react';
import {CX, CY, Cv, FONT, G, P, R, Rise, SceneProps, Svg, back, cl, eo, hash, pop, pulse, rng, seg, useUid} from '../kit';

const mix = (a: string, b: string, k: number) => {
  const h = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const x = h(a), y = h(b);
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(',')})`;
};

// ———————————————————— 018 微缩景观：把世界切成一块底座，一块块搭出来，再用移轴把它变小 ————————————————————
export const Diorama: React.FC<SceneProps> = ({t, len}) => {
  const id = useUid();
  const c = {paper: '#F6EEDD', cream: '#FFF7EC', soil: ['#EED0A6', '#DDB48A', '#C99A72'], mint: '#7FCBA8', pink: '#F28AA6', peach: '#F7C9D3', lilac: '#CDB9F0', sky: '#7DB8E8', butter: '#F5C451', coral: '#F27D6A', ink: '#3B3552', shade: '#7A5C86'};
  const k = pulse(t, len, 0.24);
  // 平面斜轴测：平面不变形（所以底座还是那个正圆），高度竖直往上
  type B = {x: number; y: number; a: number; h: number; col: string; roof?: string; tree?: boolean};
  const items: B[] = [
    {x: 70, y: -140, a: 30, h: 190, col: c.sky},
    {x: -96, y: -112, a: 0, h: 0, col: '', tree: true},
    {x: -34, y: -40, a: 46, h: 236, col: c.cream, roof: c.coral},
    {x: -150, y: -8, a: 0, h: 0, col: '', tree: true},
    {x: 124, y: -26, a: 38, h: 112, col: c.lilac},
    {x: -112, y: 76, a: 40, h: 142, col: c.butter},
    {x: 64, y: 62, a: 54, h: 86, col: c.pink, roof: c.coral},
    {x: 150, y: 96, a: 0, h: 0, col: '', tree: true},
    {x: -20, y: 150, a: 0, h: 0, col: '', tree: true},
  ].sort((p, q) => p.y - q.y);
  const fall = (i: number) => {
    const x = t - (1 + i * 1.5);
    if (x < 0) return {dy: -9999, sy: 1};
    const p = Math.min(1, x / 4.5);
    const land = x - 4.5;
    return {dy: -420 * (1 - p * p), sy: land < 0 ? 1 + 0.12 * (1 - p) : 1 - 0.16 * Math.exp(-land / 2.6) * Math.cos(land * 1.1)};
  };
  const box = (b: B, i: number) => {
    const f = fall(i);
    if (f.dy < -9000) return null;
    const X = CX + b.x, Y = CY + b.y;
    const blur = b.y < -90 ? 2.4 : b.y > 110 ? 2 : 0; // 移轴：焦平面外发虚
    const inner = b.tree ? (
      <>
        <ellipse cx={X + 16} cy={Y + 10} rx={30} ry={15} fill={c.ink} opacity={0.16} />
        <rect x={X - 5} y={Y - 34} width={10} height={36} rx={4} fill="#B98A62" />
        <circle cx={X} cy={Y - 56} r={34} fill="#5FB58E" />
        <circle cx={X - 10} cy={Y - 66} r={20} fill="#8FDDB5" opacity={0.85} />
      </>
    ) : (
      <>
        <polygon points={P([[X - b.a, Y], [X, Y + b.a], [X + b.a * 1.9, Y + b.a * 0.45], [X + b.a * 0.9, Y - b.a * 0.55]])} fill={c.ink} opacity={0.15} />
        <polygon points={P([[X - b.a, Y - b.h], [X, Y - b.h + b.a], [X, Y + b.a], [X - b.a, Y]])} fill={mix(b.col, c.shade, 0.1)} />
        <polygon points={P([[X, Y - b.h + b.a], [X + b.a, Y - b.h], [X + b.a, Y], [X, Y + b.a]])} fill={mix(b.col, c.shade, 0.3)} />
        <polygon points={P([[X, Y - b.h - b.a], [X + b.a, Y - b.h], [X, Y - b.h + b.a], [X - b.a, Y - b.h]])} fill={mix(b.col, '#FFFFFF', 0.25)} />
        {b.roof && (
          <>
            <polygon points={P([[X - b.a, Y - b.h], [X, Y - b.h + b.a], [X, Y - b.h - b.a * 1.3]])} fill={mix(b.roof, c.shade, 0.08)} />
            <polygon points={P([[X, Y - b.h + b.a], [X + b.a, Y - b.h], [X, Y - b.h - b.a * 1.3]])} fill={mix(b.roof, c.shade, 0.32)} />
          </>
        )}
        {/* 窗 */}
        {b.h > 100 && [0.3, 0.55, 0.8].map((q) => <polygon key={q} points={P([[X - b.a * 0.7, Y - b.h * q + b.a * 0.3], [X - b.a * 0.3, Y - b.h * q + b.a * 0.7], [X - b.a * 0.3, Y - b.h * q + b.a * 0.7 + 18], [X - b.a * 0.7, Y - b.h * q + b.a * 0.3 + 18]])} fill={c.ink} opacity={0.32} />)}
      </>
    );
    return (
      <g key={i} filter={blur ? `url(#${id}b${blur > 2.2 ? 1 : 2})` : undefined}>
        <G x={X} y={Y + (b.tree ? 0 : b.a)} sx={2 - f.sy} sy={f.sy} dy={f.dy}>{inner}</G>
      </g>
    );
  };
  const tick = (i: number) => eo(seg(t, 4 + i * 0.6, 6), 3);
  return (
    <Svg bg={c.paper}>
      <defs>
        <filter id={id + 'b1'}><feGaussianBlur stdDeviation="2.6" /></filter>
        <filter id={id + 'b2'}><feGaussianBlur stdDeviation="2" /></filter>
        <filter id={id + 'b3'} x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="18" /></filter>
        <radialGradient id={id + 'g'} cx="40%" cy="35%" r="75%"><stop offset="0" stopColor="#A6E4C2" /><stop offset="1" stopColor="#6FBF9A" /></radialGradient>
        <clipPath id={id + 'c'}><circle cx={CX} cy={CY} r={R} /></clipPath>
      </defs>
      <Rise x={120} y={506} size={108} p={seg(t, 2, 10)} w={520} style={{fontFamily: FONT.sc, fontWeight: 900, fill: c.ink}}>微缩景观</Rise>
      <Rise x={126} y={570} size={34} p={seg(t, 5, 10)} w={520} style={{fontFamily: '"Inter Display"', fontWeight: 700, fill: c.ink, letterSpacing: '0.34em', opacity: 0.75}}>DIORAMA</Rise>
      <Rise x={126} y={628} size={24} p={seg(t, 8, 10)} w={520} style={{fontFamily: FONT.mono, fontWeight: 500, fill: c.ink, opacity: 0.6}}>tilt-shift · focus 0.56 · blur 2.0</Rise>
      {/* 比例尺 */}
      <g stroke={c.ink} strokeWidth={3} fill={c.ink}>
        <line x1={1560} x2={1560} y1={700 - 330 * tick(0)} y2={700} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => <line key={i} x1={1560} x2={1560 + (i % 3 === 0 ? 30 : 16) * tick(i)} y1={700 - i * 55} y2={700 - i * 55} />)}
        <text x={1604} y={548} fontSize={44} stroke="none" opacity={seg(t, 9, 4)} style={{fontFamily: '"Inter Display"', fontWeight: 700}}>1 : 87</text>
      </g>
      <ellipse cx={CX + 20} cy={CY + R + 74} rx={250} ry={34} fill={c.ink} opacity={0.3} filter={`url(#${id}b3)`} />
      <G s={k}>
        {c.soil.map((col, i) => <circle key={i} cx={CX} cy={CY + 54 - i * 18} r={R} fill={[c.soil[2], c.soil[1], c.soil[0]][i]} />)}
        <circle cx={CX} cy={CY} r={R} fill={`url(#${id}g)`} />
        <g clipPath={`url(#${id}c)`}>
          <path d={`M${CX - 260} ${CY + 40} C${CX - 100} ${CY - 10} ${CX + 40} ${CY + 140} ${CX + 260} ${CY + 60}`} stroke={c.cream} strokeWidth={34} fill="none" opacity={0.9} />
          <ellipse cx={CX + 20} cy={CY - 150} rx={150} ry={34} fill={c.sky} opacity={0.75} filter={`url(#${id}b1)`} />
        </g>
        {items.map(box)}
      </G>
    </Svg>
  );
};

// ———————————————————— 019 低多边形：一个面，一个颜色 ————————————————————
const ICO = (() => {
  const f = (1 + Math.sqrt(5)) / 2;
  let V: number[][] = [[-1, f, 0], [1, f, 0], [-1, -f, 0], [1, -f, 0], [0, -1, f], [0, 1, f], [0, -1, -f], [0, 1, -f], [f, 0, -1], [f, 0, 1], [-f, 0, -1], [-f, 0, 1]];
  let F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  const nrm = (v: number[]) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
  V = V.map(nrm);
  const cache = new Map<string, number>();
  const mid = (a: number, b: number) => {
    const key = a < b ? `${a}_${b}` : `${b}_${a}`;
    if (!cache.has(key)) { V.push(nrm([V[a][0] + V[b][0], V[a][1] + V[b][1], V[a][2] + V[b][2]])); cache.set(key, V.length - 1); }
    return cache.get(key)!;
  };
  const F2: number[][] = [];
  for (const [a, b, c2] of F) { const ab = mid(a, b), bc = mid(b, c2), ca = mid(c2, a); F2.push([a, ab, ca], [b, bc, ab], [c2, ca, bc], [ab, bc, ca]); }
  F = F2;
  // 顶点往里外挪一点：像一颗有起伏的小星球
  const r = rng(1919);
  V = V.map((v) => { const k = 0.93 + r() * 0.14; return [v[0] * k, v[1] * k, v[2] * k]; });
  return {V, F};
})();
export const LowPoly: React.FC<SceneProps> = ({t, len}) => {
  const c = {paper: '#FBF4E6', red: '#EE6B57', yellow: '#F4C54F', green: '#4DAF72', lgreen: '#9ED7A8', sky: '#8CC8EE', sea: '#7DB8E8', pink: '#F49DB6', lilac: '#C9A6EC', peri: '#8F9DEA', blue: '#2F5FD8', ink: '#3B3552', shade: '#7A5C86'};
  const land = [c.green, c.lgreen, c.yellow, c.green, c.lgreen, c.red], seaC = [c.sea, c.sky, c.peri, c.blue];
  const ya = 0.5 + t * 0.045, xa = -0.38;
  const rot = (v: number[]) => {
    const x = v[0] * Math.cos(ya) + v[2] * Math.sin(ya), z = -v[0] * Math.sin(ya) + v[2] * Math.cos(ya);
    return [x, v[1] * Math.cos(xa) - z * Math.sin(xa), v[1] * Math.sin(xa) + z * Math.cos(xa)];
  };
  const Vr = ICO.V.map(rot);
  const L = [-0.5, -0.68, 0.54];
  const Rr = R * 1.02;
  const faces = ICO.F.map((f, i) => {
    const [a, b, d] = f.map((j) => Vr[j]);
    const n = [(b[1] - a[1]) * (d[2] - a[2]) - (b[2] - a[2]) * (d[1] - a[1]), (b[2] - a[2]) * (d[0] - a[0]) - (b[0] - a[0]) * (d[2] - a[2]), (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0])];
    const l = Math.hypot(n[0], n[1], n[2]) || 1;
    const o = ICO.F[i].map((j) => ICO.V[j]);
    const cy0 = (o[0][1] + o[1][1] + o[2][1]) / 3, cx0 = (o[0][0] + o[1][0] + o[2][0]) / 3, cz0 = (o[0][2] + o[1][2] + o[2][2]) / 3;
    const isLand = Math.sin(cx0 * 2.6 + 1) + Math.sin(cz0 * 3.1) + cy0 * 0.6 > 0.25;
    const base = Math.abs(cy0) > 0.8 ? '#FFFFFF' : isLand ? land[i % land.length] : seaC[i % seaC.length];
    const ndl = (n[0] * L[0] + n[1] * L[1] + n[2] * L[2]) / l;
    return {p: [a, b, d], nz: n[2] / l, cz: (a[2] + b[2] + d[2]) / 3, cy: (a[1] + b[1] + d[1]) / 3, col: mix(base.length === 7 ? base : '#FFFFFF', c.shade, ndl > 0.45 ? 0 : ndl > 0 ? 0.12 : 0.3), i};
  }).filter((f) => f.nz > 0).sort((p, q) => p.cz - q.cz);
  const k = pulse(t, len, 0.24);
  const ridge = (x0: number, w: number, seed: number, cols: string[]) => {
    const r = rng(seed), n = 7;
    const tops = Array.from({length: n + 1}, (_, i) => [x0 + (w * i) / n, 1080 - (70 + r() * 250 * Math.sin((Math.PI * (i + 0.3)) / (n + 0.6)))]);
    const g2 = back(seg(t, 2, 11), 1.4);
    return (
      <g transform={`translate(0 1080) scale(1 ${g2}) translate(0 -1080)`}>
        {tops.slice(0, -1).map((p, i) => {
          const q = tops[i + 1];
          return (
            <g key={i}>
              <polygon points={P([[p[0], 1080], p, q])} fill={mix(cols[i % cols.length], c.shade, q[1] > p[1] ? 0 : 0.26)} />
              <polygon points={P([[p[0], 1080], q, [q[0], 1080]])} fill={mix(cols[(i + 1) % cols.length], c.shade, 0.12)} />
            </g>
          );
        })}
      </g>
    );
  };
  // 从纸上翻起来的三角面：绕一条边翻 180°
  const flip = (ax: number, ay: number, bx: number, by: number, hgt: number, col: string, at: number) => {
    const th = Math.PI * back(seg(t, at, 12), 1.3);
    const mx = (ax + bx) / 2, my = (ay + by) / 2, ex = (by - ay), ey = -(bx - ax), el = Math.hypot(ex, ey);
    const q = Math.cos(th);
    const apex = [mx - (ex / el) * hgt * q, my - (ey / el) * hgt * q - Math.sin(th) * hgt * 0.35];
    return <polygon points={P([[ax, ay], [bx, by], apex])} fill={q > 0 ? mix(c.paper, c.shade, 0.14) : col} />;
  };
  return (
    <Svg bg={c.paper}>
      {ridge(-40, 760, 7, [c.lilac, c.peri, c.pink])}
      {ridge(1180, 800, 12, [c.lgreen, c.green, c.yellow])}
      <Rise x={120} y={330} size={108} p={seg(t, 2, 10)} w={520} style={{fontFamily: FONT.sc, fontWeight: 900, fill: c.ink}}>低多边形</Rise>
      <Rise x={126} y={394} size={34} p={seg(t, 5, 10)} w={520} style={{fontFamily: '"Inter Display"', fontWeight: 700, fill: c.ink, letterSpacing: '0.34em', opacity: 0.75}}>LOW POLY</Rise>
      <Rise x={126} y={452} size={24} p={seg(t, 8, 10)} w={520} style={{fontFamily: FONT.mono, fontWeight: 500, fill: c.ink, opacity: 0.6}}>80 faces · 3 bands · no gradients</Rise>
      {flip(1380, 420, 1520, 380, 150, c.pink, 3)}
      {flip(1560, 520, 1700, 600, 140, c.yellow, 6)}
      {flip(1400, 640, 1500, 560, 120, c.sky, 9)}
      <ellipse cx={CX + 30} cy={CY + R + 70} rx={210 * k} ry={26} fill={c.shade} opacity={0.26} />
      <G s={k}>
        {faces.map((f) => {
          const g2 = pop(t, (1 - (f.cy + 1) / 2) * 7, 8, 2.2);
          if (g2 <= 0) return null;
          const m = [(f.p[0][0] + f.p[1][0] + f.p[2][0]) / 3, (f.p[0][1] + f.p[1][1] + f.p[2][1]) / 3];
          return <polygon key={f.i} points={P(f.p.map((v) => [CX + (m[0] + (v[0] - m[0]) * g2) * Rr, CY + (m[1] + (v[1] - m[1]) * g2) * Rr]))} fill={f.col} stroke={f.col} strokeWidth={1} strokeLinejoin="round" />;
        })}
      </G>
    </Svg>
  );
};

// ———————————————————— 020 字符画：没有像素，只有字；先乱码，再落定 ————————————————————
const RAMP = '.,-~:;=!*#$@';
const JUNK = '01<>/\\[]{}#%&+=?';
export const Ascii: React.FC<SceneProps> = ({t, len}) => {
  const c = {bg: '#06060A', ink: '#FFF6DA', orange: '#FF6A1A', gold: '#FFC530', dim: '#8E91B8', mute: '#3A3E5E'};
  const k = pulse(t, len, 0.24);
  const CWd = 9.6, CH = 15.5, COLS = 62, ROWS = 40;
  const draw = (g: CanvasRenderingContext2D) => {
    g.fillStyle = c.bg; g.fillRect(0, 0, 1920, 1080);
    g.textBaseline = 'top';
    // 字雨
    g.font = '500 20px "JetBrains Mono"';
    for (let i = 0; i < 46; i++) {
      const x = 30 + hash(i * 3.7) * 1860, sp = 9 + hash(i * 9.1) * 16, y0 = ((hash(i * 5.3) * 1300 + t * sp) % 1300) - 150;
      for (let j = 0; j < 11; j++) {
        g.fillStyle = j === 0 ? c.dim : c.mute; g.globalAlpha = j === 0 ? 0.9 : 0.75 * (1 - j / 11);
        g.fillText(JUNK[Math.floor(hash(i * 13 + j * 7 + Math.floor(t / 3 + j)) * JUNK.length)], x, y0 - j * 24);
      }
    }
    g.globalAlpha = 1;
    // 甜甜圈：正对镜头时外轮廓就是那个圆
    const A = 0.5 * eo(seg(t, 0, 14), 2), Bn = 0.3 * Math.sin(t * 0.13); // 先正对镜头（就是那个圆），再仰起来一点
    const la = -2.3 + t * 0.15, Lx = Math.cos(la) * 0.62, Ly = Math.sin(la) * 0.62; // 光绕着它转
    const zb = new Float32Array(COLS * ROWS).fill(-1e9), lum = new Float32Array(COLS * ROWS);
    const R1 = 0.31, R2 = 0.69, S = R * k;
    const cA = Math.cos(A), sA = Math.sin(A), cB = Math.cos(Bn), sB = Math.sin(Bn);
    for (let th = 0; th < 6.283; th += 0.07)
      for (let ph = 0; ph < 6.283; ph += 0.02) {
        const ct = Math.cos(th), st = Math.sin(th), cp = Math.cos(ph), sp = Math.sin(ph);
        let x = (R2 + R1 * ct) * cp, y = (R2 + R1 * ct) * sp, z = R1 * st;
        let nx = ct * cp, ny = ct * sp, nz = st;
        let y2 = y * cA - z * sA, z2 = y * sA + z * cA; y = y2; z = z2;
        y2 = ny * cA - nz * sA; z2 = ny * sA + nz * cA; ny = y2; nz = z2;
        let x2 = x * cB + z * sB; z2 = -x * sB + z * cB; x = x2; z = z2;
        x2 = nx * cB + nz * sB; z2 = -nx * sB + nz * cB; nx = x2; nz = z2;
        const col = Math.floor(COLS / 2 + (x * S) / CWd), row = Math.floor(ROWS / 2 + (y * S) / CH);
        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) continue;
        const idx = row * COLS + col;
        if (z > zb[idx]) { zb[idx] = z; lum[idx] = nx * Lx + ny * Ly + nz * 0.5; }
      }
    g.font = '800 16px "JetBrains Mono"'; g.shadowColor = '#FF6A1A'; g.shadowBlur = 7;
    const X0 = CX - (COLS / 2) * CWd, Y0 = CY - (ROWS / 2) * CH;
    for (let r = 0; r < ROWS; r++)
      for (let q = 0; q < COLS; q++) {
        const idx = r * COLS + q;
        if (zb[idx] < -1e8) continue;
        const dist = Math.hypot(q - COLS / 2, (r - ROWS / 2) * 1.6) / 31;
        const settled = t > 2 + dist * 6 + hash(idx) * 5;
        const l = cl(lum[idx] * 0.8 + 0.34);
        if (settled) {
          g.fillStyle = l > 0.8 ? c.ink : l > 0.48 ? c.gold : l > 0.18 ? c.orange : '#A8440F';
          g.fillText(RAMP[Math.min(11, Math.floor(l * 12))], X0 + q * CWd, Y0 + r * CH);
        } else {
          g.fillStyle = hash(idx + Math.floor(t) * 3) > 0.5 ? c.dim : c.orange;
          g.fillText(JUNK[Math.floor(hash(idx * 1.3 + Math.floor(t) * 7.7) * JUNK.length)], X0 + q * CWd, Y0 + r * CH);
        }
      }
    g.shadowBlur = 0;
  };
  const dec = (s: string, at: number) => s.split('').map((ch, i) => (t > at + i * 0.38 ? ch : JUNK[Math.floor(hash(i * 3.1 + Math.floor(t) * 5.3) * JUNK.length)])).join('');
  const mono = {fontFamily: FONT.jb, fontWeight: 700} as const;
  return (
    <>
      <Cv draw={draw} dep={t} />
      <Svg>
        <Rise x={120} y={500} size={128} p={seg(t, 1, 9)} w={560} style={{fontFamily: FONT.sc, fontWeight: 900, fill: c.ink}}>字符画</Rise>
        <text x={124} y={572} fontSize={50} fill={c.orange} style={mono}>{dec('ASCII ART', 3)}</text>
        <text x={124} y={640} fontSize={36} fill={c.gold} style={mono}>{dec(RAMP, 6)}</text>
        <g fill={c.dim} style={{...mono, fontWeight: 500}} fontSize={26}>
          <text x={1330} y={500}><tspan fill={c.orange}>$</tspan> {dec('render circle --ascii', 4)}</text>
          <text x={1330} y={544}>{dec('cols 62 · rows 40 · 12 glyphs', 6)}</text>
          <text x={1330} y={588} fill={c.ink}>{dec('luma → char', 9)}{Math.floor(t / 6) % 2 ? '█' : ''}</text>
        </g>
      </Svg>
    </>
  );
};

// ———————————————————— 021 生成艺术：不画画，写规则——流线绕过一个圆（势流） ————————————————————
const FLOW = (() => {
  const a = R + 30, r = rng(2121);
  const pal = ['#161616', '#FF6A1A', '#FF2D8A', '#2346E0', '#FFC530', '#161616', '#2346E0', '#FF6A1A'];
  const out: {d: string; w: number; col: string; delay: number}[] = [];
  let y0 = -560;
  while (y0 < 560) {
    const w = [6, 10, 16, 26, 10, 6, 16, 40][Math.floor(r() * 8)];
    y0 += w / 2 + 4;
    if (Math.abs(y0) > 9) {
      let x = -1100, y = y0;
      let d = `M${(CX + x).toFixed(1)} ${(CY + y).toFixed(1)}`;
      for (let i = 0; i < 190 && x < 1100; i++) {
        const rr = x * x + y * y, r4 = rr * rr;
        let u = 1 - (a * a * (x * x - y * y)) / r4, v = (-2 * a * a * x * y) / r4;
        v += 0.1 * Math.sin(x * 0.006 + y0 * 0.02); // 一点扰动，别太像教科书
        const l = Math.hypot(u, v) || 1;
        x += (u / l) * 12; y += (v / l) * 12;
        d += `L${(CX + x).toFixed(1)} ${(CY + y).toFixed(1)}`;
      }
      out.push({d, w: Math.abs(y0) < 60 ? Math.min(w, 16) : w, col: pal[Math.floor(r() * pal.length)], delay: r() * 7});
    }
    y0 += w / 2 + 5;
  }
  return out;
})();
export const Generative: React.FC<SceneProps> = ({t, len}) => {
  const c = {bg: '#F3EEE2', ink: '#161616', orange: '#FF6A1A'};
  const card = pop(t, 6, 9, 2);
  return (
    <Svg bg={c.bg}>
      {FLOW.map((f, i) => (
        <path key={i} d={f.d} fill="none" stroke={f.col} strokeWidth={f.w} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - eo(seg(t, f.delay * 0.6, 15), 2.4)} />
      ))}
      <G s={pulse(t, len, 0.26)}>
        <circle cx={CX} cy={CY} r={R} fill={c.ink} />
        <circle cx={CX} cy={CY} r={R - 24} fill="none" stroke={c.bg} strokeWidth={3} strokeDasharray="2 12" strokeLinecap="round" transform={`rotate(${t * 2} ${CX} ${CY})`} />
      </G>
      <G x={330} y={250} s={card} r={-3}>
        <rect x={104} y={160} width={470} height={196} fill={c.ink} transform="translate(10 10)" />
        <rect x={104} y={160} width={470} height={196} fill={c.bg} stroke={c.ink} strokeWidth={5} />
        <text x={132} y={240} fontSize={68} fill={c.ink} style={{fontFamily: FONT.sc, fontWeight: 900}}>生成艺术</text>
        <text x={134} y={284} fontSize={28} fill={c.orange} style={{fontFamily: 'Archivo', fontWeight: 800, letterSpacing: '0.04em'}}>GENERATIVE ART</text>
        <text x={134} y={328} fontSize={22} fill={c.ink} style={{fontFamily: FONT.jb, fontWeight: 500}}>seed 0021 · {FLOW.length} lines · ψ = U(r − a²/r)sinθ</text>
      </G>
    </Svg>
  );
};
