/** 第三组（一拍一个）：装饰艺术 → 液态玻璃 → 未来主义 → 中世纪现代 */
import React from 'react';
import {CX, CY, Cv, FONT, G, P, R, SceneProps, Svg, back, cl, eo, hash, lerp, pop, pulse, rng, seg, slap, useUid} from '../kit';

// ———————————————————— 013 装饰艺术：先立一条中轴，一切从中轴往两边同时长出来；金色只给线 ————————————————————
export const ArtDeco: React.FC<SceneProps> = ({t, len}) => {
  const id = useUid();
  const c = {onyx: '#0E0D0B', onyx2: '#1A1711', gold: '#C9A45A', lt: '#F2DC9C', dk: '#7E5E26', ivory: '#F1E7D2'};
  const au = `url(#${id})`;
  const open = back(seg(t, 0, 10), 1.3); // 从中轴打开，过冲约 5%
  const tower = [[110, 990], [110, 640], [150, 640], [150, 500], [190, 500], [190, 380], [215, 380], [215, 250], [245, 250], [245, 380], [270, 380], [270, 500], [310, 500], [310, 640], [350, 640], [350, 990]];
  const grow = eo(seg(t, 2, 13), 3);
  const side = (mirror: boolean) => (
    <g transform={mirror ? `translate(${CX * 2} 0) scale(-1 1)` : undefined}>
      <svg x={0} y={990 - 800 * grow} width={480} height={800 * grow} viewBox={`0 ${990 - 800 * grow} 480 ${800 * grow}`} overflow="hidden">
        {[[1, 4], [0.86, 1.6], [0.72, 1.6]].map(([s, w], i) => (
          <polyline key={i} points={P(tower.map(([x, y]) => [230 + (x - 230) * s, 990 + (y - 990) * (i ? s + 0.04 : 1)]))} fill="none" stroke={au} strokeWidth={w} />
        ))}
        {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={230} y1={250} x2={230 + (i - 2) * 36} y2={150 - Math.abs(i - 2) * -18} stroke={au} strokeWidth={1.6} />)}
      </svg>
    </g>
  );
  const serif = {fontFamily: FONT.serif, fontWeight: 300, fill: c.ivory, letterSpacing: '0.5em'} as const;
  const title = (x: number, a: string, zh: string, yr: string, d: number) => {
    const p = eo(seg(t, d, 10), 3);
    return (
      <g opacity={cl(p * 2)} transform={`translate(${(x < CX ? 1 : -1) * 40 * (1 - p)} 0)`} textAnchor="middle">
        <text x={x + 14} y={CY + 24} fontSize={112} fill={c.lt} style={{fontFamily: '"Poiret One"', letterSpacing: '0.24em'}}>{a}</text>
        <text x={x + 12} y={CY + 108} fontSize={40} style={serif}>{zh}</text>
        <text x={x + 5} y={CY + 180} fontSize={32} fill={c.gold} style={{fontFamily: '"Poiret One"', letterSpacing: '0.3em'}}>{yr}</text>
      </g>
    );
  };
  return (
    <Svg bg={c.onyx}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor={c.lt} /><stop offset="0.22" stopColor={c.gold} /><stop offset="0.4" stopColor={c.dk} /><stop offset="0.6" stopColor={c.lt} /><stop offset="0.8" stopColor={c.gold} /><stop offset="1" stopColor={c.dk} />
        </linearGradient>
        <linearGradient id={id + 'r'} x1="0" y1="0" x2="1920" y2="1080" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={c.dk} /><stop offset="0.35" stopColor={c.lt} /><stop offset="0.5" stopColor={c.gold} /><stop offset="0.65" stopColor={c.lt} /><stop offset="1" stopColor={c.dk} />
        </linearGradient>
        <clipPath id={id + 'c'}><circle cx={CX} cy={CY} r={R - 8} /></clipPath>
      </defs>
      <G sx={open} sy={1}>
        {/* 放射线：水平方向留给标题 */}
        {Array.from({length: 48}, (_, i) => {
          const a = (i / 48) * Math.PI * 2 + Math.PI / 48;
          if (Math.abs(Math.sin(a)) < 0.3) return null;
          const g2 = eo(seg(t, 1 + (i % 12) * 0.35, 11), 3);
          const r0 = R + 62, r1 = r0 + 1250 * g2;
          const thick = i % 2 === 0;
          return (
            <g key={i}>
              {thick && <polygon points={P([[CX + Math.cos(a) * r0, CY + Math.sin(a) * r0], [CX + Math.cos(a) * r1, CY + Math.sin(a) * r1], [CX + Math.cos(a + Math.PI / 24) * r1, CY + Math.sin(a + Math.PI / 24) * r1], [CX + Math.cos(a + Math.PI / 24) * r0, CY + Math.sin(a + Math.PI / 24) * r0]])} fill={c.gold} opacity={0.085} />}
              <line x1={CX + Math.cos(a) * r0} y1={CY + Math.sin(a) * r0} x2={CX + Math.cos(a) * r1} y2={CY + Math.sin(a) * r1} stroke={`url(#${id}r)`} strokeWidth={thick ? 3.2 : 1.4} />
            </g>
          );
        })}
        {[150, 930].map((y) => [0, 12, 24].map((o, i) => <line key={`${y}${i}`} x1={96} x2={1824} y1={y + (y < 500 ? o : -o)} y2={y + (y < 500 ? o : -o)} stroke={`url(#${id}r)`} strokeWidth={i ? 1.6 : 4} />))}
      </G>
      {side(false)}{side(true)}
      {title(545, 'ART', '装饰', '1925', 3)}{title(1375, 'DECO', '艺术', '1939', 3)}
      <G s={pulse(t, len, 0.26)}>
        <circle cx={CX} cy={CY} r={R + 32} fill={c.onyx} />
        {[[R + 4, 4], [R + 18, 1.6], [R + 30, 1.6]].map(([r, w], i) => <circle key={i} cx={CX} cy={CY} r={r} fill="none" stroke={`url(#${id}r)`} strokeWidth={w} />)}
        <circle cx={CX} cy={CY} r={R - 8} fill={c.onyx2} />
        {/* 圆里的扇形日出 */}
        <g clipPath={`url(#${id}c)`}>
          {Array.from({length: 13}, (_, i) => {
            const a = Math.PI + ((i + 0.5) / 13) * Math.PI;
            const g2 = eo(seg(t, 2 + Math.abs(i - 6) * 0.7, 9), 3);
            const o = [CX, CY + R * 0.62];
            return <line key={i} x1={o[0] + Math.cos(a) * 62} y1={o[1] + Math.sin(a) * 62} x2={o[0] + Math.cos(a) * (62 + 330 * g2)} y2={o[1] + Math.sin(a) * (62 + 330 * g2)} stroke={`url(#${id}r)`} strokeWidth={i % 2 ? 1.6 : 4} />;
          })}
          {[62, 46, 30].map((r, i) => <path key={i} d={`M${CX - r} ${CY + R * 0.62} a${r} ${r} 0 0 1 ${r * 2} 0`} fill={i === 2 ? c.gold : 'none'} stroke={`url(#${id}r)`} strokeWidth={i ? 1.6 : 4} />)}
          <line x1={CX - R} x2={CX + R} y1={CY + R * 0.62} y2={CY + R * 0.62} stroke={`url(#${id}r)`} strokeWidth={4} />
        </g>
      </G>
    </Svg>
  );
};

// ———————————————————— 014 液态玻璃：玻璃不发光，只把后面的东西弯过来（折射量 = 边缘的坡度） ————————————————————
type Sdf = (x: number, y: number) => [number, number, number]; // 到边缘的内距离、内法线
const refract = (g: CanvasRenderingContext2D, x0: number, y0: number, w: number, h: number, sdf: Sdf, bevel: number, B: number, mag: number, cx: number, cy: number) => {
  const M = Math.ceil(B * 1.2 + 4);
  const sx0 = Math.max(0, x0 - M), sy0 = Math.max(0, y0 - M), sw = Math.min(1920, x0 + w + M) - sx0, sh = Math.min(1080, y0 + h + M) - sy0;
  const src = g.getImageData(sx0, sy0, sw, sh), out = g.getImageData(x0, y0, w, h);
  const S = src.data, O = out.data;
  const samp = (x: number, y: number, ch: number) => {
    x = cl(x - sx0, 0, sw - 1.001); y = cl(y - sy0, 0, sh - 1.001);
    const xi = x | 0, yi = y | 0, fx = x - xi, fy = y - yi, i = (yi * sw + xi) * 4 + ch;
    return (S[i] * (1 - fx) + S[i + 4] * fx) * (1 - fy) + (S[i + sw * 4] * (1 - fx) + S[i + sw * 4 + 4] * fx) * fy;
  };
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const px = x0 + i + 0.5, py = y0 + j + 0.5;
      const [d, nx, ny] = sdf(px, py);
      if (d < 0) continue;
      const e = Math.pow(cl(1 - d / bevel), 2.4);
      const o = (j * w + i) * 4;
      const aa = cl(d); // 边缘 1px 抗锯齿
      for (let ch = 0; ch < 3; ch++) {
        const k = B * e * (1 + (ch - 1) * 0.1); // 色散：三个通道弯得不一样多
        const v = samp(px + nx * k - (px - cx) * mag, py + ny * k - (py - cy) * mag, ch) * 0.95 + 255 * 0.05;
        O[o + ch] = O[o + ch] * (1 - aa) + v * aa;
      }
    }
  g.putImageData(out, x0, y0);
};
export const Glass: React.FC<SceneProps> = ({t, len}) => {
  const id = useUid();
  const Rr = R * pulse(t, len, 0.26);
  const wob = 1 + 0.7 * Math.exp(-t / 4) * Math.cos(t * 0.9);
  const dockY = lerp(1130, 872, back(seg(t, 3, 10), 1.6));
  const DW = 560, DH = 92;
  const draw = (g: CanvasRenderingContext2D) => {
    const lg = g.createLinearGradient(0, 0, 1920, 1080);
    lg.addColorStop(0, '#FF5A1F'); lg.addColorStop(0.3, '#FF2E7E'); lg.addColorStop(0.62, '#2E4BFF'); lg.addColorStop(1, '#2BD9A0');
    g.fillStyle = lg; g.fillRect(0, 0, 1920, 1080);
    const blob = (x: number, y: number, r: number, col: string) => {
      const rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, col); rg.addColorStop(1, col.slice(0, 7) + '00');
      g.fillStyle = rg; g.fillRect(0, 0, 1920, 1080);
    };
    blob(300 + t * 6, 900, 700, '#8B5CFFcc'); blob(1500 - t * 5, 180, 620, '#FF5A1Fbb'); blob(1750, 950, 520, '#2BD9A0dd');
    g.strokeStyle = 'rgba(255,255,255,0.16)'; g.lineWidth = 1.5; g.beginPath();
    for (let x = 0; x <= 1920; x += 48) { g.moveTo(x, 0); g.lineTo(x, 1080); }
    for (let y = 12; y <= 1080; y += 48) { g.moveTo(0, y); g.lineTo(1920, y); }
    g.stroke();
    g.fillStyle = '#0B0C10'; g.font = '700 318px "Inter Display"'; g.letterSpacing = '-14px';
    const drift = 70 - t * 6.5;
    g.fillText('LIQUID', 250 + drift, 500); g.fillText('GLASS', 610 - drift, 790);
    g.letterSpacing = '0px';
    // 投影
    g.save(); g.filter = 'blur(26px)'; g.fillStyle = 'rgba(8,10,40,0.33)';
    g.beginPath(); g.ellipse(CX, CY + 34, Rr * 0.98, Rr * 0.98, 0, 0, 7); g.fill();
    g.beginPath(); g.roundRect(CX - DW / 2, dockY - DH / 2 + 18, DW, DH, DH / 2); g.fill(); g.restore();
    // 圆形透镜
    const circ: Sdf = (x, y) => { const dx = x - CX, dy = y - CY, l = Math.hypot(dx, dy) || 1; return [Rr - l, -dx / l, -dy / l]; };
    const q = Math.ceil(Rr) + 2;
    refract(g, CX - q, CY - q, q * 2, q * 2, circ, Rr * 0.5, 120 * wob, 0.08, CX, CY);
    // 胶囊：落到界面里就是一条标签栏
    if (dockY < 1090) {
      const hw = DW / 2 - DH / 2;
      const caps: Sdf = (x, y) => { const ax = cl(x - CX, -hw, hw), dx = x - CX - ax, dy = y - dockY, l = Math.hypot(dx, dy) || 1; return [DH / 2 - l, -dx / l, -dy / l]; };
      const y0 = Math.round(dockY - DH / 2 - 2);
      if (y0 + DH + 4 <= 1080) refract(g, CX - DW / 2 - 2, y0, DW + 4, DH + 4, caps, 30, 46, 0.04, CX, dockY);
    }
  };
  return (
    <>
      <Cv draw={draw} dep={t} />
      <Svg>
        <defs>
          <linearGradient id={id + 'rim'} x1="0.15" y1="0.05" x2="0.85" y2="0.95"><stop offset="0" stopColor="#fff" stopOpacity="0.95" /><stop offset="0.4" stopColor="#fff" stopOpacity="0.08" /><stop offset="0.7" stopColor="#fff" stopOpacity="0.05" /><stop offset="1" stopColor="#fff" stopOpacity="0.6" /></linearGradient>
          <radialGradient id={id + 'hi'} cx="30%" cy="22%" r="60%"><stop offset="0" stopColor="#fff" stopOpacity="0.42" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
          <filter id={id + 'b'} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7" /></filter>
        </defs>
        <circle cx={CX} cy={CY} r={Rr - 1.5} fill={`url(#${id}hi)`} stroke={`url(#${id}rim)`} strokeWidth={3.5} />
        <path d={`M${CX - Rr * 0.74} ${CY - Rr * 0.42} A${Rr * 0.85} ${Rr * 0.85} 0 0 1 ${CX - Rr * 0.1} ${CY - Rr * 0.84}`} stroke="#fff" strokeWidth={9} strokeLinecap="round" fill="none" opacity={0.8} filter={`url(#${id}b)`} />
        <path d={`M${CX + Rr * 0.5} ${CY + Rr * 0.72} A${Rr * 0.88} ${Rr * 0.88} 0 0 0 ${CX + Rr * 0.8} ${CY + Rr * 0.36}`} stroke="#fff" strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.55} filter={`url(#${id}b)`} />
        <g transform={`translate(0 ${dockY})`}>
          <rect x={CX - DW / 2 + 1.5} y={-DH / 2 + 1.5} width={DW - 3} height={DH - 3} rx={DH / 2} fill="rgba(255,255,255,0.06)" stroke={`url(#${id}rim)`} strokeWidth={3} />
          {[0, 1, 2, 3].map((i) => {
            const x = CX - 195 + i * 130;
            return i === 1 ? <rect key={i} x={x - 52} y={-32} width={104} height={64} rx={32} fill="#fff" opacity={0.9} /> : <circle key={i} cx={x} cy={0} r={15} fill="#fff" opacity={0.92} />;
          })}
          <circle cx={CX - 65} cy={0} r={15} fill="#2E4BFF" />
        </g>
      </Svg>
    </>
  );
};

// ———————————————————— 015 未来主义：把速度画出来——残影、力线、越快越宽的字 ————————————————————
export const Futurism: React.FC<SceneProps> = ({t, len}) => {
  const c = {paper: '#EDE5D3', ink: '#16130F', orange: '#F2501C', cobalt: '#1F3FD0', silver: '#B9BDC3'};
  const p = seg(t, 0, 17);
  const v = 36 * Math.pow(1 - p, 2) + 1.4; // 像素 / 帧：急刹
  const D = (36 * 17 * (1 - Math.pow(1 - p, 3))) / 3 + 1.4 * t;
  const lean = -17 * Math.exp(-t / 5.5) * Math.cos(t * 0.42);
  const lines = React.useMemo(() => {
    const r = rng(1509);
    return Array.from({length: 34}, () => ({y: 110 + r() * 860, l: 160 + r() * 760, w: 2 + r() * r() * 14, s: 0.5 + r() * 1.6, x: r() * 2800, col: [c.paper, c.cobalt, c.orange, c.silver, c.paper][Math.floor(r() * 5)]}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const A = [1, 0.6, 0.36, 0.216, 0.13, 0.078, 0.047];
  const wd = 62 + 63 * Math.pow(Math.min(1, v / 30), 0.8);
  const word = (s: string, x: number, y: number, size: number, at: number, col: string) =>
    t >= at ? (
      <G x={x} y={y} s={slap(t - at, 0.5, 6)}>
        <text x={x} y={y} fontSize={size} fill={col} transform={`rotate(-11 ${x} ${y}) skewX(-16)`} style={{fontFamily: 'Archivo', fontWeight: 900, fontVariationSettings: `"wdth" ${wd}`}}>{s}</text>
      </G>
    ) : null;
  return (
    <Svg bg={c.ink}>
      <polygon points="0,850 1920,690 1920,1080 0,1080" fill={c.cobalt} />
      {lines.map((q, i) => {
        const x = ((((q.x - D * q.s * 3.2) % 2800) + 2800) % 2800) - 500;
        const stretch = 0.25 + v / 30;
        return <rect key={i} x={x} y={q.y} width={q.l * stretch} height={q.w} fill={q.col} opacity={0.2 + 0.7 * hash(i)} transform={`skewX(-20)`} style={{transformOrigin: `${x}px ${q.y}px`}} />;
      })}
      {word('ZANG', 1290, 330, 210, 2, c.orange)}
      {word('TUMB', 1470, 462, 140, 6, c.paper)}
      {word('TUMB', 1610, 556, 92, 10, c.silver)}
      {/* 力线：指向运动方向的楔形，长度 = 速度 */}
      {[-28, -14, 0, 14, 28].map((a, i) => {
        const L = Math.max(0, 26 * (v - 4));
        const rad = (a * Math.PI) / 180, r0 = R + 26;
        const o = [CX + Math.cos(rad) * r0, CY + Math.sin(rad) * r0];
        return <polygon key={i} points={P([[o[0], o[1] - 9], [o[0] + Math.cos(rad) * L, o[1] + Math.sin(rad) * L], [o[0], o[1] + 9]])} fill={i % 2 ? c.paper : c.silver} />;
      })}
      {/* 残影：6 个，间隔 3 帧，朝运动的反方向 */}
      {[6, 5, 4, 3, 2, 1, 0].map((k) => (
        <g key={k} transform={`translate(${-k * v * 3} 0)`} opacity={A[k]}>
          <G x={CX} y={CY + R} s={pulse(t, len, 0.26)}>
            <g transform={`translate(${CX} ${CY + R}) skewX(${lean}) translate(${-CX} ${-(CY + R)})`}>
              <circle cx={CX} cy={CY} r={R} fill={k ? (k % 2 ? c.orange : c.paper) : c.orange} />
              {k === 0 && <circle cx={CX} cy={CY} r={R * 0.52} fill="none" stroke={c.ink} strokeWidth={18} strokeDasharray="42 30" transform={`rotate(${D * 0.9} ${CX} ${CY})`} />}
              {k === 0 && <circle cx={CX} cy={CY} r={26} fill={c.ink} />}
            </g>
          </G>
        </g>
      ))}
      <text x={92} y={952} fontSize={196} fill={c.paper} transform={`skewX(${-6 - v * 0.5})`} style={{fontFamily: 'Archivo', fontWeight: 900, fontVariationSettings: `"wdth" ${wd}`, letterSpacing: '-0.02em', transformOrigin: '92px 952px'}}>FUTURISM</text>
    </Svg>
  );
};

// ———————————————————— 017 中世纪现代：剪刀代替尺子——剪纸、星芒钟、回旋镖 ————————————————————
export const MidCentury: React.FC<SceneProps> = ({t, len}) => {
  const id = useUid();
  const c = {paper: '#FBF3E3', red: '#F2542D', sun: '#FFC62E', pink: '#F57AA8', turq: '#1FB3A6', blue: '#2F6BD8', ink: '#1E1B19', shadow: '#3A1C0C'};
  const blobPts = (cx: number, cy: number, r: number, seed: number, n = 72, amp = 0.012) =>
    Array.from({length: n}, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      const k = 1 + amp * (Math.sin(a * 5 + seed) + 0.6 * Math.sin(a * 11 + seed * 2.3));
      return [cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k];
    });
  const sh = `url(#${id})`;
  /** 一张剪纸：纸 + 落在桌面上的影子 */
  const Paper: React.FC<{d?: string; pts?: number[][]; fill: string; h?: number}> = ({d, pts, fill, h = 8}) => (
    <>
      {d ? <path d={d} fill={c.shadow} opacity={0.26} transform={`translate(${h * 0.5} ${h})`} filter={sh} /> : <polygon points={P(pts!)} fill={c.shadow} opacity={0.26} transform={`translate(${h * 0.5} ${h})`} filter={sh} />}
      {d ? <path d={d} fill={fill} /> : <polygon points={P(pts!)} fill={fill} />}
    </>
  );
  const balls = [c.red, c.turq, c.pink, c.blue, c.ink, c.red, c.turq, c.pink, c.blue, c.ink, c.red, c.turq];
  const slideIn = (a: number, dx: number, dy: number) => {
    const p = 1 - eo(seg(t, a, 10), 4);
    return `translate(${dx * p} ${dy * p})`;
  };
  const letters = 'MODERN'.split('');
  const lc = [c.red, c.blue, c.sun, c.turq, c.pink, c.ink];
  const aster = (x: number, y: number, s: number, at: number) => (
    <g transform={`translate(${x} ${y}) rotate(${t * 2 + at * 20}) scale(${pop(t, at, 8, 3) * s})`} stroke={c.ink} strokeWidth={5} strokeLinecap="round">
      {[0, 45, 90, 135].map((a) => <line key={a} x1={-40} x2={40} transform={`rotate(${a})`} />)}
    </g>
  );
  return (
    <Svg bg={c.paper}>
      <defs><filter id={id} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" /></filter></defs>
      <g transform={slideIn(0, -700, 300)}><g transform="rotate(-8 330 740)"><Paper d="M120 640 C120 520 300 500 360 600 C420 700 560 690 600 780 C640 880 520 960 400 900 C300 850 250 820 180 800 C130 780 120 720 120 640Z" fill={c.turq} h={12} /></g></g>
      <g transform={slideIn(2, 700, -300)}><Paper d="M1380 170 C1500 90 1720 120 1790 260 C1850 390 1740 480 1640 440 C1560 410 1560 320 1470 320 C1380 320 1320 240 1380 170Z" fill={c.pink} h={12} /></g>
      <text x={96} y={236} fontSize={96} fill={c.ink} opacity={seg(t, 3, 3)} style={{fontFamily: 'Anton', letterSpacing: '0.02em'}}>MID-CENTURY</text>
      {/* 星芒钟：辐条一根根长出来，末端一颗彩球 */}
      <G r={t * 0.5}>
        {balls.map((col, i) => {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
          const g2 = pop(t, 1 + i * 0.8, 8, 2.4);
          const r0 = R + 14, r1 = r0 + (i % 2 ? 66 : 112) * g2;
          const bx = CX + Math.cos(a) * (r1 + 20), by = CY + Math.sin(a) * (r1 + 20);
          return (
            <g key={i}>
              <line x1={CX + Math.cos(a) * r0} y1={CY + Math.sin(a) * r0} x2={CX + Math.cos(a) * r1} y2={CY + Math.sin(a) * r1} stroke={c.ink} strokeWidth={7} strokeLinecap="round" />
              <circle cx={bx + 3} cy={by + 6} r={25 * g2} fill={c.shadow} opacity={0.24} filter={sh} />
              <circle cx={bx} cy={by} r={25 * g2} fill={col} />
            </g>
          );
        })}
      </G>
      <G s={pulse(t, len, 0.26)}>
        <Paper pts={blobPts(CX, CY, R, 1.7)} fill={c.sun} h={14} />
        <rect x={CX - 9} y={CY - 150} width={18} height={166} rx={9} fill={c.ink} transform={`rotate(${40 + t * 7} ${CX} ${CY})`} />
        <rect x={CX - 12} y={CY - 104} width={24} height={120} rx={12} fill={c.ink} transform={`rotate(${-70 + t * 0.6} ${CX} ${CY})`} />
        <circle cx={CX} cy={CY} r={20} fill={c.red} />
      </G>
      {aster(330, 420, 1, 5)}{aster(520, 300, 0.6, 8)}{aster(1700, 580, 0.7, 11)}
      {letters.map((ch, i) => {
        const p = eo(seg(t, 4 + i * 1.6, 8), 4);
        if (p <= 0) return null;
        const x = 1300 + i * 100;
        const tilt = (hash(i * 3.3) - 0.5) * 8;
        return (
          <g key={i} transform={`translate(0 ${-420 * (1 - p)}) rotate(${tilt + 20 * (1 - p)} ${x} 850)`} style={{fontFamily: 'Anton'}} textAnchor="middle" fontSize={212}>
            <text x={x + 5} y={960} fill={c.shadow} opacity={0.26} filter={sh}>{ch}</text>
            <text x={x} y={950} fill={lc[i]}>{ch}</text>
          </g>
        );
      })}
    </Svg>
  );
};
export const _c = [lerp, back];
