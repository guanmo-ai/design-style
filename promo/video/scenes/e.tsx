/** 第五组：点云（一拍）→ 液态金属（一拍）→ 水墨（两拍，全片唯一一次留白） */
import React from 'react';
import {CX, CY, Cv, FONT, G, R, Rise, SceneProps, Svg, cl, ei, eio, eo, hash, lerp, pulse, rng, seg, useUid} from '../kit';

// ———————————————————— 022 点云：世界不是面，是带颜色的点 ————————————————————
const turbo = (x: number) => {
  x = cl(x);
  const x2 = x * x, x3 = x2 * x, x4 = x2 * x2, x5 = x4 * x;
  const r = 0.13572138 + 4.6153926 * x - 42.66032258 * x2 + 132.13108234 * x3 - 152.94239396 * x4 + 59.28637943 * x5;
  const g = 0.09140261 + 2.19418839 * x + 4.84296658 * x2 - 14.18503333 * x3 + 4.27729857 * x4 + 2.82956604 * x5;
  const b = 0.1066733 + 12.64194608 * x - 60.58204836 * x2 + 110.36276771 * x3 - 89.90310912 * x4 + 27.34824973 * x5;
  return [cl(r) * 255, cl(g) * 255, cl(b) * 255];
};
const PTS = (() => {
  const N = 9000, r = rng(2222), out = new Float32Array(N * 7);
  for (let i = 0; i < N; i++) {
    const y = 1 - (2 * (i + 0.5)) / N, rad = Math.sqrt(1 - y * y), a = i * 2.39996323;
    const sh = 1 + (r() - 0.5) * 0.035; // 激光测距的噪声
    out.set([Math.cos(a) * rad * sh, y * sh, Math.sin(a) * rad * sh, (r() - 0.5) * 2, (r() - 0.5) * 2, (r() - 0.5) * 2, r()], i * 7);
  }
  return {N, d: out};
})();
export const PointCloud: React.FC<SceneProps> = ({t, len}) => {
  const k = pulse(t, len, 0.24);
  const scan = lerp(-1.2, 1.2, seg(t, 1, len - 3));
  const draw = (g: CanvasRenderingContext2D) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080);
    const ya = 0.4 + t * 0.05, xa = 0.32, cy = Math.cos(ya), sy = Math.sin(ya), cx = Math.cos(xa), sx = Math.sin(xa);
    const D = 4.2, Rr = R * k;
    const proj = (x: number, y: number, z: number) => {
      const x1 = x * cy + z * sy, z1 = -x * sy + z * cy, y1 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
      const s = D / (D - z2);
      return [CX + x1 * Rr * s, CY + y1 * Rr * s, z2, s];
    };
    // 地面网格的点（透视）
    for (let i = -16; i <= 16; i++)
      for (let j = -9; j <= 9; j++) {
        const p = proj(i * 0.42, 1.32, j * 0.42 + 0.3);
        const a = cl(0.75 - Math.hypot(i, j * 1.4) / 20) * cl(t / 5);
        if (a <= 0) continue;
        g.fillStyle = `rgba(111,243,255,${a * 0.75})`;
        g.fillRect(p[0] - p[3], p[1] - p[3] * 0.6, p[3] * 2.2, p[3] * 1.4);
      }
    const order: number[][] = [];
    for (let i = 0; i < PTS.N; i++) {
      const o = i * 7, d = PTS.d;
      // 从散开的位置聚回来
      const q = 1 - eo(seg(t, -5 + d[o + 6] * 7, 12), 3);
      const x = d[o] + d[o + 3] * 3.4 * q, y = d[o + 1] + d[o + 4] * 3.4 * q, z = d[o + 2] + d[o + 5] * 3.4 * q;
      const p = proj(x, y, z);
      order.push([p[2], p[0], p[1], p[3], d[o + 1], d[o + 6]]);
    }
    order.sort((a, b) => a[0] - b[0]);
    for (const [z, x, y, s, wy, rnd] of order) {
      const dy = wy - scan;
      let col: number[], size = 2.1 * s * (0.75 + rnd * 0.6);
      if (Math.abs(dy) < 0.035) { col = [200, 255, 255]; size *= 2.1; } // 扫描线发光
      else if (dy > 0) col = [226, 238, 242].map((v) => v * (0.55 + 0.45 * rnd)); // 还没扫到：只有位置
      else col = turbo(0.08 + 0.86 * (wy + 1) / 2); // 扫过了：按高度上色
      const a = cl(0.42 + (z + 1) * 0.36);
      g.fillStyle = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${a})`;
      g.fillRect(x - size / 2, y - size / 2, size, size);
    }
    // 扫描面：一圈发光的线
    const rr = Math.sqrt(Math.max(0, 1 - scan * scan));
    if (rr > 0) {
      g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(111,243,255,0.9)'; g.shadowColor = '#6ff3ff'; g.shadowBlur = 26; g.lineWidth = 2.5; g.beginPath();
      for (let i = 0; i <= 90; i++) { const a = (i / 90) * 6.2832, p = proj(Math.cos(a) * rr * 1.02, scan, Math.sin(a) * rr * 1.02); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }
      g.stroke(); g.restore();
    }
  };
  const mono = {fontFamily: FONT.mono, fontWeight: 500} as const;
  const sy2 = CY + scan * R * 0.95;
  return (
    <>
      <Cv draw={draw} dep={t} />
      <Svg>
        <Rise x={120} y={506} size={128} p={seg(t, 1, 9)} w={520} style={{fontFamily: FONT.sc, fontWeight: 900, fill: '#ecf4f6'}}>点云</Rise>
        <Rise x={126} y={566} size={32} p={seg(t, 4, 9)} w={520} style={{...mono, fill: '#6ff3ff', letterSpacing: '0.3em'}}>POINT CLOUD</Rise>
        <Rise x={126} y={622} size={24} p={seg(t, 7, 9)} w={520} style={{...mono, fill: '#9aa6ad'}}>9,000 pts · size = w · f / z</Rise>
        {Math.abs(scan) < 1.05 && (
          <g opacity={0.95}>
            <line x1={CX + R + 40} x2={1500} y1={sy2} y2={sy2} stroke="#6ff3ff" strokeWidth={1.5} strokeDasharray="4 6" />
            <text x={1516} y={sy2 + 8} fontSize={24} fill="#6ff3ff" style={mono}>scan y = {(-scan * 2.1).toFixed(2)} m</text>
          </g>
        )}
      </Svg>
    </>
  );
};

// ———————————————————— 023 液态金属：它自己没有颜色，颜色全是它照到的世界 ————————————————————
export const Chrome: React.FC<SceneProps> = ({t, len}) => {
  const id = useUid();
  const k = pulse(t, len, 0.24);
  const draw = (g: CanvasRenderingContext2D, cv: HTMLCanvasElement) => {
    g.fillStyle = '#020306'; g.fillRect(0, 0, 1920, 1080);
    const glow = (x: number, y: number, r: number, col: string) => {
      const rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg; g.fillRect(0, 0, 1920, 1080);
    };
    glow(CX - 260, CY - 40, 620, 'rgba(255,79,163,0.34)'); glow(CX + 330, CY + 40, 560, 'rgba(80,120,255,0.3)');
    // 顶光光柱
    const beam = g.createLinearGradient(0, 0, 0, 900);
    beam.addColorStop(0, 'rgba(232,240,255,0.2)'); beam.addColorStop(1, 'rgba(232,240,255,0)');
    g.fillStyle = beam; g.beginPath(); g.moveTo(CX - 90, 0); g.lineTo(CX + 90, 0); g.lineTo(CX + 420, 900); g.lineTo(CX - 420, 900); g.fill();
    // 湿地面
    const fl = g.createLinearGradient(0, CY + R + 20, 0, 1080);
    fl.addColorStop(0, 'rgba(10,11,16,0.2)'); fl.addColorStop(1, 'rgba(2,3,6,0.96)');
    g.fillStyle = fl; g.fillRect(0, CY + R + 24, 1920, 600);
    glow(CX, CY + R + 60, 520, 'rgba(255,79,163,0.2)');
    // 球：每个像素求法线 → 反射方向 → 查环境（手写的摄影棚：一条粉灯、一条蓝灯、一块顶光柔光箱、地平线）
    const Rr = R * k, q = Math.ceil(Rr) + 2, S = q * 2;
    const img = g.getImageData(CX - q, CY - q, S, S), O = img.data;
    const phi = 0.5 + t * 0.085, cp = Math.cos(phi), sp = Math.sin(phi);
    const sm = (a: number, b: number, x: number) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
    for (let j = 0; j < S; j++)
      for (let i = 0; i < S; i++) {
        let nx = (i + 0.5 - q) / Rr, ny = (j + 0.5 - q) / Rr;
        const r2 = nx * nx + ny * ny;
        if (r2 >= 1) continue;
        let nz = Math.sqrt(1 - r2);
        // 液体：表面有缓慢的波
        const w = 0.085 * Math.sin(ny * 7 + nx * 3 + t * 0.55) + 0.05 * Math.sin(nx * 11 - t * 0.4);
        nx += w * nz; ny += w * 0.6 * nz;
        const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
        const rx0 = 2 * nz * nx, ry = 2 * nz * ny, rz0 = 2 * nz * nz - 1;
        const rx = rx0 * cp + rz0 * sp, rz = -rx0 * sp + rz0 * cp;
        const az = Math.atan2(rx, rz), el = Math.asin(cl(ry, -1, 1));
        let cr = 6, cg = 7, cb = 12;
        const up = sm(0.1, -0.9, ry);
        cr += 62 * up; cg += 72 * up; cb += 108 * up;
        const strip = (a0: number, wd: number) => { let d = Math.abs(az - a0); if (d > Math.PI) d = 2 * Math.PI - d; return sm(wd, wd * 0.55, d) * sm(0.55, 0.35, el) * sm(-1.25, -0.95, el); };
        const pk = strip(-1.15, 0.5), bl = strip(1.5, 0.44), wt = strip(2.75, 0.3) + strip(0.2, 0.16);
        cr += 255 * pk * 1.25 + 90 * bl + 250 * wt; cg += 70 * pk + 140 * bl * 1.2 + 250 * wt; cb += 165 * pk + 255 * bl * 1.3 + 255 * wt;
        const top = sm(-0.5, -0.82, ry) * sm(0.95, 0.5, Math.abs(rx));
        cr += 236 * top; cg += 242 * top; cb += 255 * top;
        const hz = Math.exp(-Math.pow((ry - 0.06) / 0.045, 2));
        cr += 255 * hz * 0.75; cg += 150 * hz * 0.75; cb += 190 * hz * 0.75;
        if (ry > 0.1) { const fd = sm(0.1, 0.9, ry); cr = cr * (1 - fd * 0.75) + 40 * fd * (1 - ry); cg *= 1 - fd * 0.8; cb = cb * (1 - fd * 0.78) + 22 * fd * (1 - ry); }
        const fres = Math.pow(1 - nz, 3);
        cr += 205 * fres * 0.8; cg += 150 * fres * 0.6; cb += 220 * fres * 0.8;
        const aa = cl((1 - Math.sqrt(r2)) * Rr);
        const o = (j * S + i) * 4;
        O[o] = O[o] * (1 - aa) + Math.min(255, cr) * aa; O[o + 1] = O[o + 1] * (1 - aa) + Math.min(255, cg) * aa; O[o + 2] = O[o + 2] * (1 - aa) + Math.min(255, cb) * aa;
      }
    g.putImageData(img, CX - q, CY - q);
    // 地面倒影
    g.save(); g.globalAlpha = 0.34; g.filter = 'blur(7px)';
    g.translate(0, 2 * (CY + Rr + 16)); g.scale(1, -1);
    g.drawImage(cv, CX - q, CY - q, S, S, CX - q, CY - q, S, S); g.restore();
    const fade = g.createLinearGradient(0, CY + R + 30, 0, CY + R + 300);
    fade.addColorStop(0, 'rgba(2,3,6,0)'); fade.addColorStop(1, 'rgba(2,3,6,1)');
    g.fillStyle = fade; g.fillRect(0, CY + R + 30, 1920, 520);
  };
  const drops = [[-2.5, 150, 22], [-0.7, 190, 16], [0.4, 120, 26], [2.2, 170, 14], [3.6, 130, 18], [1.3, 210, 10]];
  return (
    <>
      <Cv draw={draw} dep={t} />
      <Svg>
        <defs>
          <radialGradient id={id} cx="36%" cy="30%" r="70%"><stop offset="0" stopColor="#fff" /><stop offset="0.25" stopColor="#c9d6ea" /><stop offset="0.55" stopColor="#1a1c28" /><stop offset="0.85" stopColor="#ff4fa3" /><stop offset="1" stopColor="#ffd0ea" /></radialGradient>
          <linearGradient id={id + 't'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="0.45" stopColor="#c9d6ea" /><stop offset="0.5" stopColor="#3a3f55" /><stop offset="0.78" stopColor="#ff4fa3" /><stop offset="1" stopColor="#ffe3f2" /></linearGradient>
        </defs>
        {/* 溅出去又落回来的小珠 */}
        {drops.map(([a, dist, r], i) => {
          const p = Math.sin(Math.PI * seg(t, 0, 19 + i));
          const d = R * k - 8 + dist * p;
          return p > 0.02 ? <circle key={i} cx={CX + Math.cos(a) * d} cy={CY + Math.sin(a) * d + 40 * p * p} r={r * (0.5 + 0.5 * p)} fill={`url(#${id})`} /> : null;
        })}
        <Rise x={116} y={520} size={124} p={seg(t, 1, 9)} w={560} style={{fontFamily: 'Huangyou', fill: `url(#${id}t)`}}>液态金属</Rise>
        <Rise x={124} y={580} size={28} p={seg(t, 4, 9)} w={560} style={{fontFamily: 'Unbounded', fontWeight: 600, fill: '#ff4fa3', letterSpacing: '0.2em'}}>LIQUID CHROME</Rise>
        <Rise x={124} y={634} size={24} p={seg(t, 7, 9)} w={560} style={{fontFamily: FONT.mono, fontWeight: 500, fill: '#9aa3b5'}}>color = reflect(view, normal)</Rise>
      </Svg>
    </>
  );
};

// ———————————————————— 024 水墨：一笔 · 一滴 · 留白 ————————————————————
let paperTex: HTMLCanvasElement | null = null;
const paper = () => {
  if (paperTex) return paperTex;
  const c = document.createElement('canvas'); c.width = 1920; c.height = 1080;
  const g = c.getContext('2d')!, r = rng(2424);
  g.fillStyle = '#F2EDE1'; g.fillRect(0, 0, 1920, 1080);
  for (let i = 0; i < 2600; i++) { // 纸的纤维
    const x = r() * 1920, y = r() * 1080, a = r() * 6.28, l = 6 + r() * 26;
    g.strokeStyle = r() > 0.5 ? 'rgba(120,105,80,0.07)' : 'rgba(255,255,255,0.35)'; g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  return (paperTex = c);
};
let wetCv: HTMLCanvasElement | null = null;
const wet = () => {
  if (!wetCv) { wetCv = document.createElement('canvas'); wetCv.width = 640; wetCv.height = 640; }
  return wetCv;
};
const n1 = (x: number) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash(i) * (1 - u) + hash(i + 1) * u; };
export const Ink: React.FC<SceneProps & {drop?: number; seal?: number}> = ({t, drop = 24, seal = 36}) => {
  const INK = '20,20,19';
  const sm = eio(seg(t, 0.5, 33)); // 起笔慢、行笔快、收笔慢
  const draw = (g: CanvasRenderingContext2D) => {
    g.drawImage(paper(), 0, 0);
    // 远山：两层淡墨，慢慢洇出来
    const hill = (y0: number, amp: number, seed: number, a: number) => {
      g.save(); g.filter = 'blur(9px)'; g.fillStyle = `rgba(${INK},${a * eo(seg(t, 4, 40), 2)})`; g.beginPath(); g.moveTo(-40, 1100);
      for (let x = -40; x <= 800; x += 20) g.lineTo(x, y0 - amp * (n1(x * 0.006 + seed) * 0.7 + n1(x * 0.019 + seed * 3) * 0.3) * cl(1.15 - x / 760));
      g.lineTo(800, 1100); g.fill(); g.restore();
    };
    hill(930, 210, 3.3, 0.1); hill(990, 150, 8.1, 0.17);
    // 圆相：一笔。26 根笔毛，越往后越干（飞白）
    const A0 = (-208 * Math.PI) / 180, SW = (336 * Math.PI) / 180, RC = R - 26;
    const wid = (s: number) => 58 * (0.52 + 0.48 * Math.sin(Math.PI * Math.pow(s, 0.62))) * (1 - 0.42 * s * s * s);
    const pt = (s: number, o: number) => { const a = A0 + SW * s, rr = RC + o * wid(s) * 0.5 + 5 * Math.sin(s * 9); return [CX + Math.cos(a) * rr, CY + Math.sin(a) * rr]; };
    const N = 170, upto = Math.floor(sm * N);
    if (upto > 0) {
      // 湿墨的洇边
      // （先不带滤镜画到离屏画布，再整张模糊一次：逐段带滤镜画会慢几十倍）
      const off = wet(), h = off.getContext('2d')!;
      h.clearRect(0, 0, 640, 640); h.strokeStyle = `rgb(${INK})`; h.lineCap = 'round';
      for (let i = 0; i < upto; i += 3) { const s = i / N, a = pt(s, 0), b = pt(Math.min(1, (i + 3) / N), 0); h.lineWidth = wid(s) * (1.1 - 0.5 * s); h.beginPath(); h.moveTo(a[0] - CX + 320, a[1] - CY + 320); h.lineTo(b[0] - CX + 320, b[1] - CY + 320); h.stroke(); }
      g.save(); g.filter = 'blur(8px)'; g.globalAlpha = 0.3; g.drawImage(off, CX - 320, CY - 320); g.restore();
      g.lineCap = 'round';
      for (let bri = 0; bri < 30; bri++) {
        const o = (bri / 29) * 2 - 1;
        for (let i = 0; i < upto; i++) {
          const s = i / N, dry = cl((s - 0.42) / 0.58);
          const nz = n1(bri * 7.3 + s * 46) * 0.7 + n1(bri * 3.1 + s * 140) * 0.3;
          if (nz < dry * 1.02 - 0.16 * (1 - Math.abs(o))) continue; // 干笔：断开
          const a = pt(s, o), b = pt((i + 1.25) / N, o);
          g.strokeStyle = `rgba(${INK},${0.5 + 0.42 * nz - 0.2 * dry})`;
          g.lineWidth = (wid(s) / 30) * 1.9;
          g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
        }
      }
      // 起笔的墨团 + 溅点
      const st = pt(0, 0), bl = eo(seg(t, 0, 8), 3);
      g.fillStyle = `rgba(${INK},0.9)`; g.beginPath();
      for (let i = 0; i <= 40; i++) { const a = (i / 40) * 6.283, rr = 30 * bl * (0.82 + 0.3 * n1(i * 0.9 + 5)); i ? g.lineTo(st[0] + Math.cos(a) * rr, st[1] + Math.sin(a) * rr) : g.moveTo(st[0] + Math.cos(a) * rr, st[1] + Math.sin(a) * rr); }
      g.fill();
      for (let i = 0; i < 9; i++) { const a = 2.4 + hash(i * 3.1) * 2.2, d = (40 + hash(i * 7.7) * 90) * eo(seg(t, 0, 9), 3); g.beginPath(); g.arc(st[0] + Math.cos(a) * d, st[1] + Math.sin(a) * d, 1.5 + hash(i) * 5, 0, 7); g.fill(); }
    }
    // 一滴：落进圆心，洇开，带水线
    const dp = t - drop;
    if (dp > 0) {
      const rr = 84 * eo(seg(dp, 0, 22), 3), al = 1 - 0.35 * seg(dp, 6, 18);
      g.save(); g.filter = 'blur(2.5px)';
      const rg = g.createRadialGradient(CX, CY, 0, CX, CY, rr * 1.12);
      rg.addColorStop(0, `rgba(${INK},${0.5 * al})`); rg.addColorStop(0.72, `rgba(${INK},${0.2 * al})`); rg.addColorStop(0.92, `rgba(${INK},${0.42 * al})`); rg.addColorStop(1, `rgba(${INK},0)`);
      g.fillStyle = rg; g.beginPath();
      for (let i = 0; i <= 60; i++) { const a = (i / 60) * 6.283, q = rr * (0.92 + 0.2 * n1(i * 0.42 + 11) + 0.06 * n1(i * 1.9)); i ? g.lineTo(CX + Math.cos(a) * q, CY + Math.sin(a) * q) : g.moveTo(CX + Math.cos(a) * q, CY + Math.sin(a) * q); }
      g.fill(); g.restore();
      g.fillStyle = `rgba(${INK},${0.8 * al})`; g.beginPath(); g.arc(CX, CY, 13 * eo(seg(dp, 0, 5), 2), 0, 7); g.fill();
      for (let i = 0; i < 2; i++) { const q = seg(dp, i * 5, 20); if (q > 0 && q < 1) { g.strokeStyle = `rgba(${INK},${0.3 * (1 - q)})`; g.lineWidth = 1.6; g.beginPath(); g.arc(CX, CY, 30 + 150 * eo(q, 2), 0, 7); g.stroke(); } }
    } else if (dp > -7) { // 落下来的那一滴
      g.fillStyle = `rgba(${INK},0.85)`; g.beginPath(); g.ellipse(CX, CY - 300 * ei(-dp / 7, 1.6), 5, 11, 0, 0, 7); g.fill();
    }
  };
  const serif = {fontFamily: FONT.serif, fontWeight: 900, fill: '#141413'} as const;
  const sp = t - seal;
  const ch = (s: string, y: number, at: number) => {
    const p = eo(seg(t, at, 14), 2);
    return <text x={1500} y={y} textAnchor="middle" fontSize={168} opacity={p} style={{...serif, filter: p < 1 ? `blur(${(1 - p) * 9}px)` : undefined}}>{s}</text>;
  };
  return (
    <>
      <Cv draw={draw} dep={t} />
      <Svg>
        {ch('水', 470, 6)}{ch('墨', 660, 12)}
        <text x={1500} y={742} textAnchor="middle" fontSize={24} fill="#3a3a36" opacity={seg(t, 20, 8)} style={{fontFamily: FONT.mono, letterSpacing: '0.5em'}}>INK WASH</text>
        <text x={1500} y={796} textAnchor="middle" fontSize={30} fill="#3a3a36" opacity={seg(t, 24, 8)} style={{fontFamily: FONT.serif, fontWeight: 400, letterSpacing: '0.1em'}}>一笔 · 一滴 · 留白</text>
        {sp >= 0 && (
          <G x={1640} y={420} s={lerp(1.5, 1, eo(sp / 7, 3))} r={-3}>
            <rect x={1596} y={376} width={88} height={88} rx={7} fill="#C8372D" opacity={0.96} />
            <text x={1640} y={445} textAnchor="middle" fontSize={64} fill="#F2EDE1" style={{fontFamily: FONT.serif, fontWeight: 900}}>墨</text>
          </G>
        )}
      </Svg>
    </>
  );
};
