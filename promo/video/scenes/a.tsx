/** 第一组（每个两拍，把规则讲清楚）：包豪斯 → 瑞士国际主义 → 构成主义 → 孟菲斯 */
import React from 'react';
import {CX, CY, R, G, P, Rise, SceneProps, Svg, back, cl, ei, eio, eo, hash, lerp, pop, pulse, rng, seg, slap, useUid} from '../kit';

// ———————————————————— 001 包豪斯：圆 = 蓝（康定斯基 1923：三角黄、方红、圆蓝） ————————————————————
export const Bauhaus: React.FC<SceneProps> = ({t, len}) => {
  const c = {paper: '#F0E9DA', ink: '#161514', blue: '#1F4FA3', red: '#DB3A26', yellow: '#F2B419'};
  const out = back(seg(t, 1, 12), 2.2); // 三角和方从圆背后滑出来
  const b2 = t - 24;
  const turn = b2 < 0 ? 0 : back(seg(b2, 0, 11), 2.6);
  const flood = ei(seg(t, len - 9, 9), 2.4); // 红方块涨满全屏 → 接力给瑞士的红
  const GY = CY + R; // 三个形状都站在同一条线上
  const triX = lerp(CX, 420, out);
  const sqX = lerp(CX, 1500, out);
  const line = eo(seg(t, 2, 12), 4);
  const lab = (x: number, a: string, b: string, d: number) => (
    <g style={{fontFamily: '"JetBrains Mono"', fontWeight: 500}} fill={c.ink} textAnchor="middle">
      <Rise x={x} y={GY + 92} size={26} p={seg(b2, d, 9)} anchor="middle" w={400}>{a}</Rise>
      <Rise x={x} y={GY + 128} size={26} p={seg(b2, d + 2, 9)} anchor="middle" w={400} style={{opacity: 0.55}}>{b}</Rise>
    </g>
  );
  return (
    <Svg bg={c.paper}>
      <Rise x={96} y={268} size={176} p={seg(t, 3, 13)} style={{fontFamily: 'Jost', fontWeight: 700, letterSpacing: '-0.025em', fill: c.ink}}>bauhaus</Rise>
      {/* 构造线：每个形状一根中轴 */}
      {[triX, CX, sqX].map((x, i) => (
        <rect key={i} x={x - 1.5} y={GY + 34 - 520 * eo(seg(b2, i * 2, 12), 4)} width={3} height={520 * eo(seg(b2, i * 2, 12), 4)} fill={c.ink} opacity={0.28} />
      ))}
      <G x={triX} y={GY - 115} r={-24 * (1 - out) + 120 * turn} s={slap(b2, 0.12)}>
        <polygon points={P([[triX, GY - 346], [triX - 200, GY], [triX + 200, GY]])} fill={c.yellow} />
      </G>
      <G x={sqX} y={GY - 180} r={20 * (1 - out) + 90 * turn} s={slap(b2, 0.12)}>
        <rect x={sqX - 180} y={GY - 360} width={360} height={360} fill={c.red} />
      </G>
      <G s={pulse(t, len)}>
        <circle cx={CX} cy={CY} r={R} fill={c.blue} />
      </G>
      <rect x={CX - 864 * line} y={GY + 12} width={1728 * line} height={22} fill={c.ink} />
      {lab(420, 'triangle', 'yellow', 3)}
      {lab(CX, 'circle', 'blue', 5)}
      {lab(1500, 'square', 'red', 7)}
      {flood > 0 && (
        <G x={sqX} y={GY - 180} s={1 + 11 * flood} r={90 + 45 * flood}>
          <rect x={sqX - 180} y={GY - 360} width={360} height={360} fill="#E30613" />
        </G>
      )}
    </Svg>
  );
};

// ———————————————————— 002 瑞士国际主义：一张 12 × 6 网格、一种无衬线、一种红 ————————————————————
export const Swiss: React.FC<SceneProps> = ({t, len}) => {
  const id = useUid();
  const c = {paper: '#F5F4F0', ink: '#111111', red: '#E30613'};
  const MX = 96, MY = 114, MOD = 122, GUT = 24, STEP = MOD + GUT;
  const rr = lerp(1320, R, eo(seg(t, 0, 11), 4)); // 上一章涨满的红，收成一个圆
  const b2 = t - 24;
  const shift = STEP * eio(seg(b2, 0, 9));
  const rot = -30 * ei(seg(t, len - 11, 11), 2.4); // 把轴转 30° → 构成主义
  const font = {fontFamily: 'Heros', fontWeight: 700, letterSpacing: '-0.03em'} as const;
  const words = (fill: string) => (
    <g fill={fill}>
      <Rise x={MX + STEP} y={500} size={262} p={seg(t, 3, 13)} style={font}>Swiss</Rise>
      <Rise x={MX + STEP + shift} y={748} size={262} p={seg(t, 6, 13)} style={font}>Style</Rise>
    </g>
  );
  const X9 = MX + 9 * STEP;
  return (
    <Svg bg={c.paper}>
      <G r={rot}>
        <rect x={-800} y={-800} width={3520} height={2680} fill={c.paper} />
        {Array.from({length: 12}, (_, k) => {
          const h = 2400 * eo(seg(t, 2 + k * 0.7, 12), 3);
          return (
            <g key={k} fill={c.ink} opacity={0.13}>
              <rect x={MX + k * STEP} y={-600} width={1.5} height={h} />
              <rect x={MX + k * STEP + MOD} y={-600} width={1.5} height={h} />
            </g>
          );
        })}
        {Array.from({length: 7}, (_, k) => (
          <rect key={k} x={-600} y={MY + k * STEP - (k === 6 ? GUT : 0)} width={3200 * eo(seg(t, 4 + k, 12), 3)} height={1.5} fill={c.ink} opacity={0.13} />
        ))}
        {Array.from({length: 12}, (_, k) => (
          <text key={k} x={MX + k * STEP} y={MY - 14} fontSize={18} fill={c.ink} opacity={0.5 * seg(b2, k * 0.5, 4)} style={{fontFamily: 'Heros'}}>{k + 1}</text>
        ))}
        {words(c.ink)}
        <clipPath id={id}><circle cx={CX} cy={CY} r={rr} /></clipPath>
        <circle cx={CX} cy={CY} r={rr} fill={c.red} />
        <g clipPath={`url(#${id})`}>{words('#FFFFFF')}</g>
        {/* 右栏：对齐第 10 列 */}
        <rect x={X9} y={MY + 2 * STEP} width={(2 * STEP - GUT) * eo(seg(b2, 0, 10), 4)} height={3} fill={c.red} />
        {['Grid.', 'Grotesk.', 'Red.'].map((s, i) => (
          <Rise key={s} x={X9} y={MY + 2 * STEP + 70 + i * 58} size={50} p={seg(b2, 2 + i * 2, 10)} w={500} style={{...font, fill: c.ink}}>{s}</Rise>
        ))}
        <Rise x={X9} y={MY + 4 * STEP + 32} size={21} p={seg(b2, 9, 10)} w={500} style={{fontFamily: 'Heros', fill: c.ink, opacity: 0.6}}>12 col × 6 row · module 122 · gutter 24</Rise>
      </G>
    </Svg>
  );
};

// ———————————————————— 003 构成主义：全片只有两条轴（−30° / 60°），红楔子刺进白圆 ————————————————————
export const Constructivism: React.FC<SceneProps> = ({t, len}) => {
  const c = {paper: '#ECE4D2', ink: '#161412', red: '#D3261C', light: '#F6F1E6'};
  const U = [Math.cos(Math.PI / 6), -Math.sin(Math.PI / 6)]; // 主轴 −30°
  const N = [Math.sin(Math.PI / 6), Math.cos(Math.PI / 6)]; // 副轴 60°
  const on = (o: number[], a: number, b = 0) => [o[0] + U[0] * a + N[0] * b, o[1] + U[1] * a + N[1] * b];
  const C = [CX, CY];
  const rot = 12 * (1 - eo(seg(t, 0, 10), 3)); // 接住上一章转过来的轴
  // 楔子：第 6 帧刺中；16—24 帧往回抽（起势），24—28 帧再刺一次，更深
  const hit1 = 6, hit2 = 28;
  let d: number;
  if (t < hit1) d = 1200 * (1 - Math.pow(t / hit1, 2));
  else if (t < 15) d = -26 * Math.exp(-(t - hit1) / 3.5);
  else if (t < 24) d = 170 * eio(seg(t, 15, 9));
  else if (t < hit2) d = lerp(170, -150, ei(seg(t, 24, 4), 2));
  else d = -150 + 34 * (1 - Math.exp(-(t - hit2) / 4));
  const kick = (x: number, a: number) => (x < 0 ? 0 : a * Math.exp(-x / 4.5) * Math.cos(x * 1.05));
  const push = kick(t - hit1, 34) + kick(t - hit2, 46); // 圆沿主轴被顶出去再弹回
  const cc = on(C, push);
  const tip = on(C, -R * 0.42 - d);
  const L = 1700, HW = 215;
  const wedge = [tip, on(tip, -L, -HW), on(tip, -L, HW)];
  const B = on(C, -240 + 1500 * (1 - eo(seg(t, 0, 6), 3)));
  const field = [on(B, 0, -1900), on(B, 0, 1900), on(B, 3200, 1900), on(B, 3200, -1900)];
  const sh = kick(t - hit1, 9) + kick(t - hit2, 14);
  const burst = (x: number) => (x < 0 ? 0 : eo(x / 9, 4));
  const b1 = burst(t - hit1), b2 = burst(t - hit2);
  const bar = (o: number[], a: number, b: number, len2: number, th: number, fill: string, along = true) => {
    const p = on(o, a, b);
    const q = along ? [on(p, 0, -th / 2), on(p, len2, -th / 2), on(p, len2, th / 2), on(p, 0, th / 2)] : [on(p, -th / 2, 0), on(p, th / 2, 0), on(p, th / 2, len2), on(p, -th / 2, len2)];
    return <polygon points={P(q)} fill={fill} />;
  };
  const zh = {fontFamily: '"Noto Sans SC"', fontWeight: 900, fill: c.ink} as const;
  return (
    <Svg bg={c.paper}>
      <G r={rot} dx={U[0] * sh} dy={U[1] * sh}>
        <rect x={-800} y={-800} width={3520} height={2680} fill={c.paper} />
        <polygon points={P(field)} fill={c.ink} />
        <Rise x={92} y={296} size={164} p={seg(t, 2, 11)} w={520} style={zh}>构成</Rise>
        <Rise x={92} y={476} size={164} p={seg(t, 5, 11)} w={520} style={zh}>主义</Rise>
        {/* 纸面上的黑条（副轴） */}
        {bar(on(C, -620), 0, 250 - 120 * (1 - b1), 300 * b1, 24, c.ink, false)}
        {bar(on(C, -690), 0, 300 - 120 * (1 - b1), 190 * b1, 24, c.ink, false)}
        {/* 被撞出去的碎条（主轴） */}
        {[[-170, 150, 22], [-60, 260, 22], [70, 210, 22], [190, 120, 14]].map(([b, l, th], i) => bar(C, R + 70 + 40 * b1 + 90 * b2, b, l * (0.35 * b1 + 0.65 * b2 + 0.0001), th, c.light))}
        <G x={on(C, 560, -250)[0]} y={on(C, 560, -250)[1]} s={pop(t, hit1 + 2, 8)} r={-30}>
          <rect x={on(C, 560, -250)[0] - 34} y={on(C, 560, -250)[1] - 34} width={68} height={68} fill={c.red} />
        </G>
        <circle cx={cc[0]} cy={cc[1]} r={R * pulse(t, len, 0.22)} fill={c.light} />
        <polygon points={P(wedge)} fill={c.red} />
        <g transform={`translate(${on(tip, -560)[0]} ${on(tip, -560)[1]}) rotate(-30)`}>
          <text textAnchor="middle" y={22} fontSize={64} fill={c.light} style={{fontFamily: 'Oswald', fontWeight: 600, letterSpacing: '0.1em'}}>КОНСТРУКТИВИЗМ</text>
        </g>
        {t >= hit2 && (
          <G x={1500} y={880} s={slap(t - hit2, 0.5)}>
            <text x={1500} y={916} textAnchor="middle" fontSize={118} fill={c.light} style={{fontFamily: 'Oswald', fontWeight: 600, letterSpacing: '0.02em'}}>1917—1932</text>
          </G>
        )}
      </G>
    </Svg>
  );
};

// ———————————————————— 004 孟菲斯：一块一色、描一圈黑边、再歪一点；落地压扁 0.24 再回弹 ————————————————————
export const Memphis: React.FC<SceneProps> = ({t, len}) => {
  const id = useUid();
  const c = {paper: '#FDF6EC', pink: '#FF7EB6', yellow: '#FFD23F', teal: '#22C3B5', blue: '#2D4BFF', red: '#FF5A36', lilac: '#B79CFF', ink: '#111111'};
  const b2 = t - 24;
  // 压扁：以底边为原点（站在地上，不陷进地里）
  const sq = (x: number, a: number) => (x < 0 ? 0 : a * Math.exp(-x / 3.4) * Math.cos(x * 0.82));
  const hop = b2 > 0 && b2 < 11 ? Math.sin((Math.PI * b2) / 11) : 0;
  const squash = sq(t, 0.24) + sq(b2 - 11, 0.2) - 0.1 * hop;
  const SH = 16;
  const pal = [c.pink, c.teal, c.blue, c.yellow, c.lilac, c.red, c.ink];
  const conf = React.useMemo(() => {
    const r = rng(404);
    return Array.from({length: 86}, (_, i) => ({x: r() * 1920, y: r() * 1080, a: r() * 360, k: Math.floor(r() * 3), col: pal[Math.floor(r() * 7)], d: r() * 9, i}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /** 一块积木：硬投影 + 黑描边，从 0 弹出来；到 b2 再跳一下 */
  const Block: React.FC<{x: number; y: number; at: number; tilt: number; children: (shadow: boolean) => React.ReactNode}> = ({x, y, at, tilt, children}) => {
    const s = pop(t, at, 9, 2.6);
    if (s <= 0) return null;
    const j = b2 > 0 ? 14 * Math.exp(-b2 / 5) * Math.sin(b2 * 0.9 + at) : 0;
    return (
      <G x={x} y={y} s={s} r={tilt + j}>
        <g transform="translate(10 10)">{children(true)}</g>
        {children(false)}
      </G>
    );
  };
  const st = (sh: boolean, fill: string) => ({fill: sh ? c.ink : fill, stroke: c.ink, strokeWidth: 6, strokeLinejoin: 'round' as const});
  const wave = (x0: number, y0: number, n: number, w: number, a: number) => {
    let dd = `M${x0} ${y0}`;
    for (let i = 0; i < n; i++) dd += ` q${w / 2} ${i % 2 ? a : -a} ${w} 0`;
    return dd;
  };
  const letters = 'MEMPHIS'.split('');
  const lc = [c.pink, c.yellow, c.teal, c.blue, c.red, c.lilac, c.yellow];
  const dots = ei(seg(t, len - 9, 9), 1.6); // 黄色网点长满 → 接力给波普
  return (
    <Svg bg={c.paper}>
      <defs>
        <pattern id={id} width={22} height={22} patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width={22} height={22} fill="#fff" /><rect width={11} height={22} fill={c.ink} />
        </pattern>
      </defs>
      {conf.map((q) => {
        const s = pop(t, q.d, 7);
        return (
          <g key={q.i} transform={`translate(${q.x} ${q.y}) rotate(${q.a + t * (q.i % 2 ? 0.6 : -0.6)}) scale(${s})`}>
            {q.k === 0 ? <rect x={-9} y={-2.5} width={18} height={5} fill={q.col} /> : q.k === 1 ? <polygon points="0,-8 8,6 -8,6" fill={q.col} /> : <path d="M-10 0 q5 -8 10 0 q5 8 10 0" stroke={q.col} strokeWidth={4} fill="none" />}
          </g>
        );
      })}
      <Block x={1440} y={290} at={3} tilt={12}>{(sh) => <polygon points="1440,160 1580,400 1300,400" {...st(sh, c.yellow)} />}</Block>
      <Block x={390} y={330} at={5} tilt={-18}>{(sh) => <path d="M250 330 a140 140 0 0 1 280 0 z" {...st(sh, c.blue)} />}</Block>
      <Block x={330} y={700} at={7} tilt={-6}>{(sh) => <rect x={205} y={620} width={250} height={160} {...st(sh, `url(#${id})`)} />}</Block>
      <Block x={1690} y={500} at={9} tilt={0}>{(sh) => <circle cx={1690} cy={500} r={58} {...st(sh, c.lilac)} />}</Block>
      <Block x={1500} y={150} at={10} tilt={18}>
        {(sh) => (
          <g>
            <rect x={1660} y={170} width={150} height={150} {...st(sh, '#fff')} />
            {!sh && [1, 2].map((k) => <g key={k} stroke={c.ink} strokeWidth={4}><line x1={1660 + k * 50} y1={170} x2={1660 + k * 50} y2={320} /><line x1={1660} y1={170 + k * 50} x2={1810} y2={170 + k * 50} /></g>)}
          </g>
        )}
      </Block>
      {/* 波浪线：先黑后色，沿路径画出来 */}
      {[[c.ink, 40, 8], [c.teal, 28, 0]].map(([col, w, off], i) => (
        <path key={i} d={wave(1280, 716, 5, 92, 70)} transform={`translate(${off} ${off})`} stroke={col as string} strokeWidth={w as number} strokeLinecap="round" strokeLinejoin="round" fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - eo(seg(t, 6, 14), 3)} />
      ))}
      {[[c.ink, 30, 7], [c.red, 18, 0]].map(([col, w, off], i) => (
        <polyline key={i} points="560,210 620,150 680,210 740,150 800,210 860,150" transform={`translate(${off} ${off})`} stroke={col as string} strokeWidth={w as number} strokeLinejoin="miter" fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - eo(seg(t, 8, 12), 3)} />
      ))}
      {/* 主角：糖果色 + 黑描边 + 硬投影 */}
      <G x={CX} y={CY + R} sx={(1 + squash * 0.62) * inh(t, len)} sy={(1 - squash) * inh(t, len)} dy={-110 * hop}>
        <circle cx={CX + SH} cy={CY + SH} r={R} fill={c.ink} />
        <circle cx={CX} cy={CY} r={R - 4} fill={c.pink} stroke={c.ink} strokeWidth={8} />
        <path d={`M${CX - 120} ${CY - 70} a150 150 0 0 1 90 -70`} stroke="#fff" strokeWidth={16} strokeLinecap="round" fill="none" />
      </G>
      {letters.map((ch, i) => {
        const s = pop(t, 10 + i * 1.5, 8, 2.8);
        const x = CX - 388 + [0, 138, 268, 404, 532, 628, 714][i];
        const wv = b2 > 0 ? -38 * Math.max(0, Math.sin((b2 - i * 1.2) * 0.42)) * Math.exp(-b2 / 16) : 0;
        const tx = {fontFamily: 'Fredoka', fontWeight: 700} as const;
        return (
          <G key={i} x={x} y={900} s={s} r={(hash(i) - 0.5) * 16} dy={wv}>
            <text x={x + 8} y={958} textAnchor="middle" fontSize={176} fill={c.ink} stroke={c.ink} strokeWidth={12} strokeLinejoin="round" style={tx}>{ch}</text>
            <text x={x} y={950} textAnchor="middle" fontSize={176} fill={lc[i]} stroke={c.ink} strokeWidth={12} strokeLinejoin="round" paintOrder="stroke" style={tx}>{ch}</text>
          </G>
        );
      })}
      {dots > 0 &&
        Array.from({length: 23 * 14}, (_, i) => {
          const col = i % 23, row = Math.floor(i / 23);
          const x = col * 90 + (row % 2 ? 45 : 0) - 30, y = row * 78 + 10;
          const dist = Math.hypot(x - CX, y - CY) / 1100;
          return <circle key={i} cx={x} cy={y} r={72 * cl(dots * 1.7 - dist * 0.7)} fill="#FFD31A" />;
        })}
    </Svg>
  );
};
const inh = (t: number, len: number) => 1 - 0.05 * ei(seg(t, len - 5, 5), 2);
