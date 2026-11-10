/** 第二组（一拍一个）：波普 → Y2K → 孔版印刷 → 新粗野主义 */
import React from 'react';
import {CX, CY, FONT, G, P, R, SceneProps, Svg, back, cl, eo, hash, lerp, pop, pulse, rng, seg, slap, useUid} from '../kit';
import {Cursor} from '../hook';

// ———————————————————— 005 波普：网点代替渐变、粗黑线圈住每块颜色 ————————————————————
export const PopArt: React.FC<SceneProps> = ({t, len}) => {
  const id = useUid();
  const c = {yellow: '#FFD31A', red: '#E62E2D', blue: '#1E5BC6', ink: '#111111'};
  const dr = 9.6 * eo(seg(t, 0, 9), 3);
  const spikes = React.useMemo(() => {
    const r = rng(505);
    return Array.from({length: 36}, (_, i) => {
      const a = (i / 36) * Math.PI * 2;
      const rad = i % 2 ? 300 + r() * 20 : 430 + r() * 130;
      return [CX + Math.cos(a) * rad, CY + Math.sin(a) * rad];
    });
  }, []);
  const k = pulse(t, len, 0.34);
  const hexDots = (r: number) => (
    <>
      <circle cx={0} cy={0} r={r} /><circle cx={30} cy={0} r={r} /><circle cx={15} cy={26} r={r} /><circle cx={0} cy={52} r={r} /><circle cx={30} cy={52} r={r} />
    </>
  );
  const tx = {fontFamily: 'Bangers'} as const;
  const ps = t < 2 ? 0 : slap(t - 2, 0.7, 7);
  return (
    <Svg bg={c.yellow}>
      <defs>
        <pattern id={id + 'd'} width={30} height={52} patternUnits="userSpaceOnUse" patternTransform="rotate(15)"><g fill={c.red}>{hexDots(dr)}</g></pattern>
        <pattern id={id + 's'} width={30} height={52} patternUnits="userSpaceOnUse" patternTransform="scale(0.62) rotate(15)"><g fill={c.ink}>{hexDots(8.5)}</g></pattern>
        <radialGradient id={id + 'g'} cx="30%" cy="28%" r="85%"><stop offset="0.45" stopColor="#000" /><stop offset="1" stopColor="#fff" /></radialGradient>
        <mask id={id + 'm'}><circle cx={CX} cy={CY} r={R} fill={`url(#${id}g)`} /></mask>
      </defs>
      {/* 放射的色带 + 网点 */}
      <G r={t * 0.5}>
        {Array.from({length: 14}, (_, i) => {
          const a0 = (i / 14) * Math.PI * 2, a1 = a0 + Math.PI / 14;
          return <polygon key={i} points={P([[CX, CY], [CX + Math.cos(a0) * 1500, CY + Math.sin(a0) * 1500], [CX + Math.cos(a1) * 1500, CY + Math.sin(a1) * 1500]])} fill="#FFB700" />;
        })}
      </G>
      <rect width={1920} height={1080} fill={`url(#${id}d)`} />
      <G s={slap(t, 0.42, 8)} r={-8 + t * 0.35}>
        <polygon points={P(spikes)} transform="translate(16 16)" fill={c.ink} stroke={c.ink} strokeWidth={10} strokeLinejoin="miter" />
        <polygon points={P(spikes)} fill="#fff" stroke={c.ink} strokeWidth={10} strokeLinejoin="miter" />
      </G>
      <G s={k}>
        <circle cx={CX + 12} cy={CY + 12} r={R} fill={c.ink} />
        <circle cx={CX} cy={CY} r={R} fill={c.red} />
        <rect x={CX - R} y={CY - R} width={R * 2} height={R * 2} fill={`url(#${id}s)`} mask={`url(#${id}m)`} opacity={0.85} />
        <circle cx={CX} cy={CY} r={R} fill="none" stroke={c.ink} strokeWidth={9} />
        <ellipse cx={CX - 92} cy={CY - 96} rx={50} ry={26} transform={`rotate(-38 ${CX - 92} ${CY - 96})`} fill="#fff" stroke={c.ink} strokeWidth={6} />
      </G>
      {ps > 0 && (
        <G x={470} y={800} s={ps} r={-10}>
          <text x={482} y={892} textAnchor="middle" fontSize={330} fill={c.ink} stroke={c.ink} strokeWidth={22} strokeLinejoin="round" style={tx}>POP!</text>
          <text x={470} y={880} textAnchor="middle" fontSize={330} fill={c.yellow} stroke={c.ink} strokeWidth={22} strokeLinejoin="round" paintOrder="stroke" style={tx}>POP!</text>
        </G>
      )}
      <G x={1500} y={760} s={pop(t, 6, 8, 2.6)} r={5}>
        <rect x={1312} y={712} width={400} height={104} fill={c.ink} transform="translate(10 10)" />
        <rect x={1312} y={712} width={400} height={104} fill="#fff" stroke={c.ink} strokeWidth={6} />
        <text x={1512} y={784} textAnchor="middle" fontSize={54} fill={c.ink} style={{fontFamily: FONT.sc, fontWeight: 900}}>网点 = 颜色</text>
      </G>
    </Svg>
  );
};

// ———————————————————— 006 Y2K：铬、果冻和半透明塑料 ————————————————————
export const Y2K: React.FC<SceneProps> = ({t, len}) => {
  const id = useUid();
  const ink = '#0A1633';
  const k = pulse(t, len, 0.3);
  const th = -0.9 + t * 0.19;
  const ob = [CX + Math.cos(th) * 430, CY + Math.sin(th) * 112];
  const front = Math.sin(th) > 0;
  const bubble = (
    <g transform={`translate(${ob[0]} ${ob[1]})`}>
      <circle r={34} fill={`url(#${id}gel)`} stroke="#fff" strokeOpacity={0.7} strokeWidth={2} />
      <ellipse cx={-6} cy={-13} rx={18} ry={10} fill="#fff" opacity={0.85} />
    </g>
  );
  const star = (x: number, y: number, s: number, r: number) => (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d="M0 -60 Q4 -4 60 0 Q4 4 0 60 Q-4 4 -60 0 Q-4 -4 0 -60Z" fill="#fff" />
      <circle r={16} fill="#fff" opacity={0.6} />
    </g>
  );
  const segs = Math.floor(cl(t / (len - 3)) * 14);
  return (
    <Svg bg="#E6EAF0">
      <defs>
        <linearGradient id={id + 'bg'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F4F6FA" /><stop offset="1" stopColor="#CBD3E0" /></linearGradient>
        <linearGradient id={id + 'chr'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2A4FB8" /><stop offset="0.32" stopColor="#9DB6EE" /><stop offset="0.49" stopColor="#FFFFFF" /><stop offset="0.51" stopColor="#1A2236" /><stop offset="0.75" stopColor="#3B4458" /><stop offset="1" stopColor="#A9B3C6" />
        </linearGradient>
        <radialGradient id={id + 'gel'} cx="50%" cy="34%" r="72%"><stop offset="0" stopColor="#8FCBFF" /><stop offset="0.55" stopColor="#1E6FF0" /><stop offset="1" stopColor="#0A47B8" /></radialGradient>
        <radialGradient id={id + 'glow'} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#B9F0FF" stopOpacity="0.95" /><stop offset="1" stopColor="#7DC0FF" stopOpacity="0" /></radialGradient>
        <linearGradient id={id + 'hi'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.98" /><stop offset="1" stopColor="#fff" stopOpacity="0.12" /></linearGradient>
        <filter id={id + 'bl'} x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="16" /></filter>
        <pattern id={id + 'grid'} width={80} height={80} patternUnits="userSpaceOnUse"><path d="M80 0H0V80" fill="none" stroke="#fff" strokeWidth={2.5} /></pattern>
      </defs>
      <rect width={1920} height={1080} fill={`url(#${id}bg)`} />
      <rect width={1920} height={1080} fill={`url(#${id}grid)`} opacity={0.75} />
      {/* 铬字 */}
      <G x={470} y={800} s={slap(t, 0.2, 8)}>
        <text x={96} y={902} fontSize={270} fill={ink} opacity={0.22} transform="translate(0 16)" style={{fontFamily: 'Unbounded', fontWeight: 900, letterSpacing: '-0.02em'}}>Y2K</text>
        <text x={96} y={902} fontSize={270} fill={`url(#${id}chr)`} stroke="#fff" strokeWidth={5} paintOrder="stroke" style={{fontFamily: 'Unbounded', fontWeight: 900, letterSpacing: '-0.02em'}}>Y2K</text>
      </G>
      <ellipse cx={CX} cy={CY + R + 78} rx={230 * k} ry={30} fill={ink} opacity={0.4} filter={`url(#${id}bl)`} />
      <g transform={`rotate(-14 ${CX} ${CY})`}>
        <ellipse cx={CX} cy={CY} rx={430} ry={112} fill="none" stroke={`url(#${id}chr)`} strokeWidth={7} />
        {!front && bubble}
      </g>
      <G s={k}>
        <circle cx={CX} cy={CY} r={R + 4} fill="none" stroke={`url(#${id}chr)`} strokeWidth={30} />
        <circle cx={CX} cy={CY} r={R - 10} fill={`url(#${id}gel)`} />
        <ellipse cx={CX} cy={CY + R * 0.5} rx={R * 0.7} ry={R * 0.4} fill={`url(#${id}glow)`} />
        <ellipse cx={CX} cy={CY - R * 0.45} rx={R * 0.7} ry={R * 0.36} fill={`url(#${id}hi)`} />
      </G>
      <g transform={`rotate(-14 ${CX} ${CY})`}>
        <path d={`M${CX - 430} ${CY} A430 112 0 0 0 ${CX + 430} ${CY}`} fill="none" stroke={`url(#${id}chr)`} strokeWidth={7} />
        {front && bubble}
      </g>
      {star(CX - 150, CY - 160, pop(t, 3, 7, 3) * (1 + 0.15 * Math.sin(t * 0.7)), t * 4)}
      {star(1480, 250, pop(t, 6, 7, 3) * 0.55, -t * 5)}
      {star(360, 330, pop(t, 9, 7, 3) * 0.4, t * 6)}
      {/* 像素字读数：未来，正在加载 */}
      <g style={{fontFamily: 'Silkscreen'}} fill={ink}>
        <text x={1290} y={786} fontSize={34}>LOADING 2000…</text>
        <rect x={1290} y={808} width={510} height={44} rx={6} fill="#fff" stroke={ink} strokeWidth={3} />
        {Array.from({length: segs}, (_, i) => <rect key={i} x={1299 + i * 35.2} y={817} width={28} height={26} rx={3} fill="#1E6FF0" />)}
        <text x={1800} y={900} fontSize={30} textAnchor="end">{Math.min(99, Math.round((segs / 14) * 99))}%</text>
      </g>
    </Svg>
  );
};

// ———————————————————— 008 孔版印刷：三张版砸在一起，正片叠底，套不准是这台机器的口音 ————————————————————
export const Riso: React.FC<SceneProps> = ({t, len}) => {
  const id = useUid();
  const c = {paper: '#F3ECDB', pink: '#FF48B0', teal: '#00838A', yellow: '#FFB511', black: '#000000'};
  const boil = (n: number) => [(hash(Math.floor(t / 4) * 3.1 + n) - 0.5) * 5, (hash(Math.floor(t / 4) * 5.7 + n * 2) - 0.5) * 5];
  const slide = (a: number, d = 8) => 1 - eo(seg(t, a, d), 4);
  const m = {mixBlendMode: 'multiply'} as const;
  const [px, py] = boil(1), [tx, ty] = boil(2), [yx, yy] = boil(3);
  const specks = React.useMemo(() => {
    const r = rng(808);
    return Array.from({length: 150}, () => [r() * 240, r() * 240, 0.6 + r() * 2.2]);
  }, []);
  const word = (fill: string, dx: number, dy: number) => (
    <text x={CX + dx} y={296 + dy} textAnchor="middle" fontSize={236} fill={fill} style={{fontFamily: 'Archivo', fontWeight: 900, fontVariationSettings: '"wdth" 68', letterSpacing: '-0.01em', ...m}}>RISOGRAPH</text>
  );
  const mark = (x: number, y: number) => (
    <g transform={`translate(${x} ${y})`} stroke={c.black} strokeWidth={2.5} fill="none">
      <circle r={16} /><line x1={-28} x2={28} /><line y1={-28} y2={28} />
    </g>
  );
  return (
    <Svg bg={c.paper}>
      <defs>
        <pattern id={id} width={240} height={240} patternUnits="userSpaceOnUse">
          {specks.map((s, i) => <circle key={i} cx={s[0]} cy={s[1]} r={s[2]} fill={c.paper} />)}
        </pattern>
      </defs>
      {/* 青版：从右边砸进来 */}
      <g style={m} transform={`translate(${tx + 1500 * slide(1)} ${ty})`}>
        <rect x={1290} y={600} width={420} height={250} fill={c.teal} />
        <rect x={210} y={560} width={300} height={170} fill={c.teal} />
      </g>
      {/* 黄版：同一个圆，从上面砸下来，没对准（偏 30 × 20） */}
      <g style={m} transform={`translate(${yx + 30} ${yy + 20 - 1000 * slide(0, 9)})`}>
        <circle cx={CX} cy={CY} r={R} fill={c.yellow} />
        <circle cx={1500} cy={640} r={118} fill={c.yellow} />
        <rect x={150} y={640} width={220} height={220} fill={c.yellow} />
      </g>
      {/* 粉版：主角 */}
      <g style={m} transform={`translate(${px} ${py})`}>
        <G s={pulse(t, len, 0.3)}><circle cx={CX} cy={CY} r={R} fill={c.pink} /></G>
        <G x={1590} y={790} s={pop(t, 5, 8)}><circle cx={1590} cy={790} r={84} fill={c.pink} /></G>
        {[[330, 420], [404, 470], [316, 506]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={30 * pop(t, 6 + i * 2, 7)} fill={c.pink} />)}
      </g>
      <rect width={1920} height={1080} fill={`url(#${id})`} opacity={0.6} />
      {/* 黑版 + 套歪的粉、青 */}
      <G x={CX} y={220} s={t < 3 ? 0 : slap(t - 3, 0.35, 7)}>
        {word(c.pink, -11 - px, 8)}
        {word(c.teal, 9 + tx, -7)}
        {word(c.black, 0, 0)}
      </G>
      {mark(150, 540)}{mark(1770, 540)}
      {[c.pink, c.teal, c.yellow, c.black].map((col, i) => <rect key={i} x={96 + i * 54} y={880} width={46} height={46} fill={col} style={m} opacity={seg(t, 4 + i * 2, 2)} />)}
      <text x={96} y={962} fontSize={22} fill={c.black} opacity={seg(t, 10, 3)} style={{fontFamily: FONT.mono, fontWeight: 500}}>806U · 321U · 116U · K</text>
    </Svg>
  );
};

// ———————————————————— 009 新粗野主义：黑框描到底，阴影是一块偏移的黑；按下去 = 滑到阴影的位置 ————————————————————
export const NeoBrutal: React.FC<SceneProps> = ({t, len}) => {
  const id = useUid();
  const c = {ink: '#000000', yellow: '#FFD23F', pink: '#FF8FD6', lime: '#B8F15A', blue: '#7AA2FF', orange: '#FF7A45', white: '#FFFFFF'};
  const SH = 26;
  const press = cl((t - 15) / 5) ; // 6 帧线性：滑到阴影的位置
  const d = SH * press;
  const box = (x: number, y: number, w: number, h: number, fill: string, at: number, label: React.ReactNode, sh = 14) => {
    const p = cl((t - at) / 5);
    if (p <= 0) return null;
    const off = (1 - p) * -46;
    return (
      <g transform={`translate(${off} ${off})`}>
        <rect x={x + sh * p} y={y + sh * p} width={w} height={h} fill={c.ink} />
        <rect x={x} y={y} width={w} height={h} fill={fill} stroke={c.ink} strokeWidth={6} />
        {label}
      </g>
    );
  };
  const big = (x: number, y: number, s: string) => (
    <text x={x} y={y} fontSize={128} fill={c.ink} style={{fontFamily: 'Archivo', fontWeight: 900, fontVariationSettings: '"wdth" 125', letterSpacing: '-0.02em'}}>{s}</text>
  );
  const mono = {fontFamily: FONT.mono, fontWeight: 600} as const;
  const cm = back(seg(t, 6, 9), 1.2);
  const star = Array.from({length: 24}, (_, i) => {
    const a = (i / 24) * Math.PI * 2, r = i % 2 ? 84 : 120;
    return [1600 + Math.cos(a) * r, 250 + Math.sin(a) * r];
  });
  return (
    <Svg bg={c.yellow}>
      <defs>
        <pattern id={id} width={30} height={30} patternUnits="userSpaceOnUse"><circle cx={15} cy={15} r={2.2} fill={c.ink} opacity={0.22} /></pattern>
      </defs>
      <rect width={1920} height={1080} fill={`url(#${id})`} />
      {box(96, 150, 408, 168, c.lime, 1, big(122, 282, 'NEO'))}
      {box(96, 730, 706, 168, c.white, 3, big(122, 862, 'BRUTAL'))}
      {box(1410, 730, 392, 168, c.blue, 5, big(1438, 862, 'ISM'))}
      {box(1262, 456, 548, 142, c.white, 8, (
        <g fill={c.ink} style={mono} fontSize={27}>
          <text x={1288} y={512}>border: 8px solid #000;</text>
          <text x={1288} y={560}>box-shadow: 26px 26px 0 #000;</text>
        </g>
      ), 10)}
      <G x={1600} y={250} s={pop(t, 7, 7, 2.4)} r={12 + t * 1.2}>
        <polygon points={P(star)} transform="translate(8 8)" fill={c.ink} />
        <polygon points={P(star)} fill={c.orange} stroke={c.ink} strokeWidth={6} strokeLinejoin="round" />
        <text x={1600} y={266} textAnchor="middle" fontSize={50} fill={c.ink} style={{fontFamily: 'Archivo', fontWeight: 900}}>RAW!</text>
      </G>
      <G s={slap(t, 0.3, 6) * (1 - 0.05 * seg(t, len - 4, 4))}>
        <circle cx={CX + SH} cy={CY + SH} r={R} fill={c.ink} />
        <circle cx={CX + d} cy={CY + d} r={R - 4} fill={c.pink} stroke={c.ink} strokeWidth={8} />
      </G>
      <Cursor x={lerp(1250, CX + 70, cm) + d} y={lerp(980, CY + 60, cm) + d} s={1.5 - 0.25 * press} />
    </Svg>
  );
};
