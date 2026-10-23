/** 006 · Y2K —— 02 果冻 · 03 Aqua · 04 表情 · 05 千年虫 */
import React from 'react';
import {random} from 'remotion';
import {E, spr, tween} from '../../../src/lib/anim';
import {C, F, FLAVORS} from '../tokens';
import {AT} from './timeline';
import {bounce} from './opening';
import {BOUNCY, Chrome, EMOJI, Emoji, GelButton, Head, Kicker, P, Pill, Progress, Star, Svg, Txt, Window, base, c01, emojiCells, inS, inT, lerp, n1, outT, throb, typed} from './ui';

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

/* ─────────── 02 果冻：1998 邦迪蓝 → 1999 五种口味 ─────────── */
export const ROW = {x0: 915, dx: 150, y: 560, r: 62};
export const Jelly: React.FC<P> = ({f}) => {
  const T = AT.jelly;
  const split = T + 54; // 第 2 拍后：大球缩回队首，五种口味掉下来
  const kS = f < split ? 0 : spr(f, split, {damping: 15, mass: 0.8, stiffness: 150});
  const bigIn = inS(f, T - 6, BOUNCY);
  const bx = lerp(1290, ROW.x0, kS);
  const by = lerp(500, ROW.y, kS) + 6 * Math.sin((f - T) * 0.08) * (1 - kS);
  const br = lerp(230, ROW.r, kS) * bigIn;
  const gels: any[] = [[bx, by, Math.max(1, br), 0.2, rgb(C.bondi), bigIn > 0.01 ? 1 : 0]];
  FLAVORS.forEach(([, , hex], i) => {
    const t0 = split + 8 + i * 5;
    const x = ROW.x0 + (i + 1) * ROW.dx;
    gels.push([x, bounce(f, t0, ROW.y, -120, 15), ROW.r, 0.4 + i, rgb(hex), f >= t0 ? 1 : 0]);
  });
  const cfg = base({cam: [1290, -380, 1200], time: f / 60, gels, shadow: [0, 26, 0.5, 0], bubbles: [[1760, 860 - (f - T) * 0.35, 26, 0.3, inT(f, T + 10, 20)]]});
  const lab = (i: number, en: string, cn: string, hex: string, t0: number) => {
    const k = inS(f, t0);
    const x = ROW.x0 + i * ROW.dx;
    return (
      <g key={en} opacity={c01(k * 1.5)} transform={`translate(0 ${n1(14 * (1 - k))})`}>
        <Txt x={x} y={ROW.y + 112} size={11} font="tech" anchor="middle" ls={1}>{en.toUpperCase()}</Txt>
        <Txt x={x} y={ROW.y + 138} size={17} w={700} anchor="middle">{cn}</Txt>
        <Txt x={x} y={ROW.y + 160} size={11} font="pixel" c={C.grey} anchor="middle" ls={1}>{hex}</Txt>
      </g>
    );
  };
  const bigLab = outT(f, split - 4, 10);
  return (
    <>
      <Svg>
        <Kicker f={f} t0={T - 8} n={2} src="APPLE iMAC G3 · 15.08.1998" />
        <Head f={f} t0={T - 4} y={236} title="果冻：看得见里面的塑料。" lines={['1998 年 iMac G3 用半透明的邦迪蓝外壳，', '电脑第一次像一颗糖。']} />
        <g opacity={inT(f, T + 20, 14)}>
          <Txt x={80} y={420} size={12} font="pixel" c={C.grey} ls={1.2}>MATERIAL  ·  TRANSLUCENT POLYCARBONATE</Txt>
          {[
            ['半透明', '透出后面的东西，越厚颜色越深'],
            ['高光', '左上角一块硬边的窗形高光'],
            ['焦散', '光穿过球体，在底部聚成一团亮色'],
          ].map(([a, b], i) => {
            const k = inS(f, T + 24 + i * 6);
            return (
              <g key={a} opacity={c01(k * 1.5)} transform={`translate(${n1(80 - 24 * (1 - k))} ${448 + i * 54})`}>
                <circle cx={12} cy={-6} r={10} fill="url(#gBondiS)" />
                <Txt x={36} y={0} size={20} w={700}>{a}</Txt>
                <Txt x={110} y={0} size={18} w={400} c={C.grey}>{b}</Txt>
              </g>
            );
          })}
        </g>
        <defs>
          <radialGradient id="gBondiS" cx="0.4" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#9BE8F6" />
            <stop offset="1" stopColor={C.bondi} />
          </radialGradient>
        </defs>
        {/* 地面线：果冻球落在上面 */}
        <line x1={840} y1={ROW.y + ROW.r + 1} x2={1740} y2={ROW.y + ROW.r + 1} stroke={C.ink} strokeOpacity={0.25 * inT(f, split, 14)} />
      </Svg>
      <Chrome cfg={cfg} />
      <Svg>
        <g opacity={bigLab * inT(f, T + 14, 12)}>
          <Txt x={1290} y={810} size={15} font="tech" anchor="middle" ls={2}>BONDI BLUE</Txt>
          <Txt x={1290} y={842} size={22} w={700} anchor="middle">邦迪蓝 · #0095B6 · 1998</Txt>
        </g>
        <g opacity={inT(f, split + 6, 12)}>
          <Txt x={840} y={420} size={12} font="pixel" c={C.aqua} ls={1.2}>{typed('MACWORLD SF · 05.01.1999 · FIVE FLAVORS', f, split + 6, 80)}</Txt>
          <Txt x={840} y={458} size={30} w={900}>1999 年 1 月：五种口味。</Txt>
        </g>
        {f >= split && lab(0, 'Bondi', '邦迪蓝', '#0095B6', split + 4)}
        {FLAVORS.map(([en, cn, hex], i) => lab(i + 1, en, cn, hex, split + 20 + i * 5))}
      </Svg>
    </>
  );
};

/* ─────────── 03 Aqua：2000 年 1 月，Mac OS X ─────────── */
const DOCK = ['heart', 'face', 'phone', 'sun', 'spark', 'mail', 'note'];
export const Aqua: React.FC<P> = ({f}) => {
  const T = AT.aqua;
  const wx = 880;
  const wy = 130;
  const ww = 960;
  const wh = 620;
  // 窗口从程序坞里“吸”出来：横向先到位，纵向晚一点（神灯效果的简化版）
  const sx = f < T + 2 ? 0.04 : spr(f, T + 2, {damping: 17, mass: 0.7, stiffness: 160});
  const sy = f < T + 6 ? 0.02 : spr(f, T + 6, {damping: 15, mass: 0.7, stiffness: 140});
  const ox = 1260;
  const oy = 930;
  const cx = lerp(ox, wx + ww / 2, sy);
  const cy = lerp(oy, wy + wh / 2, sy);
  const kT = inS(f, T + 4);
  const cfg = base({
    bevel: 15,
    smooth: 1.8,
    cam: [420, -290, 1100],
    xf: [lerp(-560, 0, kT), 0, 1],
    envRot: 0.2 + (f - T) * 0.003,
    sweep: [lerp(-1.4, 1.6, tween(f, T + 30, 30, 0, 1, E.inOut)), 1],
    time: f / 60,
    texts: [{text: 'Aqua', x: 76, y: 366, size: 196, font: F.display, weight: 900, align: 'left', ls: 2}],
    gels: [[792, bounce(f, T + 40, 772, 1200, 16), 50, 0.6, [0, 0.62, 0.78], f >= T + 40 ? 1 : 0]],
    bubbles: [
      [640, 880 - (f - T) * 0.5, 76, 0.35, inT(f, T + 20, 20)],
      [118, 940 - (f - T) * 0.6, 20, 0.8, inT(f, T + 30, 20)],
      [836, 250 - (f - T) * 0.2, 18, 0.5, inT(f, T + 36, 20)],
    ],
  });
  const glow = f > T + 40 ? throb(f - T - 40, 60) : 0;
  const prog = tween(f, T + 30, 84, 0.22, 0.86, E.inOut);
  const chk = (t0: number) => (f < t0 ? 0 : spr(f, t0, BOUNCY));
  const c1 = chk(T + 70);
  const c2 = chk(T + 84);
  const wave = lerp(-200, 1900, tween(f, T + 60, 46, 0, 1, E.inOut)); // 程序坞放大镜：一阵“鼠标划过”
  const dw = DOCK.length * 96 + 40;
  const dx = 960 - dw / 2 + 300;
  return (
    <>
      <Svg>
        <Kicker f={f} t0={T - 8} n={3} src="MACWORLD SF · 05.01.2000" />
      </Svg>
      <Chrome cfg={cfg} />
      <Star f={f} t0={T + 26} x={760} y={168} R={30} />
      <Svg>
        <Head f={f} t0={T + 14} y={470} title="2000 年 1 月，旧金山。" lines={['苹果放出 Mac OS X 的新界面 Aqua：', '每个按钮都是一颗会反光的果冻。']} />
        <g transform="translate(80 600)">
          <Pill x={0} y={0} label="细条纹" fill={C.ink} k={inS(f, T + 34, BOUNCY)} />
          <Pill x={124} y={0} label="果冻按钮" fill={C.aqua} k={inS(f, T + 38, BOUNCY)} />
          <Pill x={264} y={0} label="红黄绿" fill={C.lime} c={C.ink} k={inS(f, T + 42, BOUNCY)} />
        </g>
        {sx > 0.03 && (
          <g transform={`translate(${n1(cx)} ${n1(cy)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${-(wx + ww / 2)} ${-(wy + wh / 2)})`} opacity={c01(sx * 3)}>
            <Window x={wx} y={wy} w={ww} h={wh} title="千禧.app — Aqua">
              <g opacity={inT(f, T + 22, 14)}>
                <Txt x={wx + 40} y={wy + 112} size={31} font="latin" w={600} ls={-0.4}>“We made the buttons on the screen look so good</Txt>
                <Txt x={wx + 52} y={wy + 154} size={31} font="latin" w={600} ls={-0.4}>you’ll want to lick them.”</Txt>
                <Txt x={wx + 52} y={wy + 190} size={16} font="latin" w={500} c={C.grey}>— Steve Jobs, Fortune, January 2000</Txt>
              </g>
              <g opacity={inT(f, T + 28, 10)}>
                <GelButton x={wx + 70} y={wy + 286} w={150} h={48} label="取消" blue={false} />
                <GelButton x={wx + 270} y={wy + 250} w={420} h={120} label="继续" glow={glow} />
              </g>
              <g transform={`translate(${wx + 48} ${wy + 440})`} opacity={inT(f, T + 30, 10)}>
                <Txt x={0} y={0} size={12} font="pixel" c={C.grey} ls={1}>{`COPYING  Y2K.MOV  ·  ${Math.round(prog * 1440)} KB / 1.44 MB`}</Txt>
                <Progress x={0} y={16} w={820} h={26} p={prog} />
              </g>
              <g transform={`translate(${wx + 48} ${wy + 520})`} opacity={inT(f, T + 34, 10)}>
                <circle cx={12} cy={18} r={12} fill="url(#gBlue)" stroke="#1144A8" />
                <circle cx={12} cy={18} r={4.5} fill="#FFF" />
                <ellipse cx={12} cy={12} rx={8} ry={4.5} fill="url(#gHi)" />
                <Txt x={34} y={25} size={18}>细条纹背景</Txt>
                <rect x={196} y={6} width={24} height={24} rx={6} fill={c1 > 0.5 ? 'url(#gBlue)' : 'url(#gWhite)'} stroke={c1 > 0.5 ? '#1144A8' : '#9AA3B5'} />
                {c1 > 0 && <path d="M202 18 l5 5 l9 -11" stroke="#FFF" strokeWidth={3} fill="none" strokeLinecap="round" strokeDasharray={30} strokeDashoffset={n1(30 * (1 - c01(c1)))} />}
                <Txt x={232} y={25} size={18}>半透明菜单</Txt>
                <rect x={392} y={6} width={24} height={24} rx={6} fill={c2 > 0.5 ? 'url(#gBlue)' : 'url(#gWhite)'} stroke={c2 > 0.5 ? '#1144A8' : '#9AA3B5'} />
                {c2 > 0 && <path d="M398 18 l5 5 l9 -11" stroke="#FFF" strokeWidth={3} fill="none" strokeLinecap="round" strokeDasharray={30} strokeDashoffset={n1(30 * (1 - c01(c2)))} />}
                <Txt x={428} y={25} size={18}>红黄绿三颗</Txt>
                <rect x={600} y={0} width={220} height={36} rx={8} fill="url(#gWhite)" stroke="#9AA3B5" />
                <Txt x={616} y={25} size={18}>2000 年 1 月</Txt>
                <rect x={780} y={2} width={38} height={32} rx={7} fill="url(#gBlue)" />
                <path d="M792 14 l7 -6 l7 6 M792 22 l7 6 l7 -6" stroke="#FFF" strokeWidth={2.4} fill="none" />
              </g>
              <g transform={`translate(${wx + ww - 30} ${wy + 60})`}>
                <rect width={18} height={wh - 80} rx={9} fill="url(#gTrack)" stroke="#A4ACBB" />
                <rect x={1.5} y={n1(40 + 60 * prog)} width={15} height={170} rx={7.5} fill="url(#gBlue)" />
                <rect x={4} y={n1(44 + 60 * prog)} width={10} height={60} rx={5} fill="url(#gHi)" />
              </g>
            </Window>
          </g>
        )}
        {/* 程序坞：图标依次弹出，然后一阵放大镜划过 */}
        <g opacity={inT(f, T, 10)}>
          <rect x={dx} y={880} width={dw} height={96} rx={20} fill="#FFFFFF" opacity={0.45} stroke="#FFFFFF" strokeOpacity={0.9} />
        </g>
        {DOCK.map((n, i) => {
          const x0 = dx + 28 + i * 96;
          const k = inS(f, T + 6 + i * 3, BOUNCY);
          const mag = 1 + 0.42 * Math.exp(-(((x0 + 36 - wave) / 110) ** 2));
          const s = k * mag;
          if (s < 0.01) return null;
          return (
            <g key={n} transform={`translate(${x0 + 36} 964) scale(${s.toFixed(4)}) translate(-36 -72)`}>
              <rect width={72} height={72} rx={17} fill="url(#gWhite)" stroke="#AEB6C4" />
              <ellipse cx={36} cy={18} rx={28} ry={13} fill="#FFF" opacity={0.8} />
              <Emoji name={n} x={16} y={16} s={3.33} />
            </g>
          );
        })}
        <circle cx={dx + 28 + 3 * 96 + 36} cy={986} r={3.5} fill={C.ink} opacity={inT(f, T + 20, 8)} />
      </Svg>
    </>
  );
};

/* ─────────── 04 表情：1999，12×12 个像素 ─────────── */
export const EmojiCh: React.FC<P> = ({f}) => {
  const T = AT.emoji;
  const G = {x: 1180, y: 150, s: 44};
  const cells = emojiCells('heart');
  const nOn = Math.floor(Math.max(0, f - T - 8) * 2.2); // 一帧亮两个多像素
  const count = Math.min(176, Math.floor(tween(f, T + 10, 70, 0, 176, E.inOut)));
  const n3 = String(count).padStart(3, '0');
  const kG = inT(f, T - 10, 16);
  const zoom = f < T + 64 ? 1 : lerp(1, 0.32, spr(f, T + 64, {damping: 18, mass: 0.8, stiffness: 120}));
  const gx = G.x + 264;
  const gy = G.y + 264;
  const tgx = lerp(gx, 1180 + 36, f < T + 64 ? 0 : spr(f, T + 64, {damping: 18, mass: 0.8, stiffness: 120}));
  const tgy = lerp(gy, 770 + 36, f < T + 64 ? 0 : spr(f, T + 64, {damping: 18, mass: 0.8, stiffness: 120}));
  const cfg = base({
    w: 760,
    h: 300,
    bevel: 12,
    smooth: 1.6,
    shadowBlur: 10,
    shadow: [0, 12, 0.5, 0],
    cam: [380, -120, 900],
    envRot: 0.3 + (f - T) * 0.004,
    sweep: [lerp(-1.4, 1.6, tween(f, T + 80, 26, 0, 1, E.inOut)), count >= 176 ? 1 : 0],
    texts: [{text: n3, x: 4, y: 230, size: 240, font: F.display, weight: 900, align: 'left', ls: -6}],
    xf: [0, 0, 1],
  });
  let grid = '';
  for (let i = 0; i <= 12; i++) grid += `M${G.x + i * G.s} ${G.y}V${G.y + 12 * G.s}M${G.x} ${G.y + i * G.s}H${G.x + 12 * G.s}`;
  return (
    <>
      <Svg>
        <Kicker f={f} t0={T - 8} n={4} src="NTT DOCOMO i-MODE · 1999" />
        <Head f={f} t0={T - 4} y={236} title="表情：12×12 个像素。" lines={['1999 年，栗田穣崇为日本 i-mode 手机', '画了 176 个表情；2016 年被 MoMA 收藏。']} />
        <g opacity={inT(f, T + 30, 12)}>
          <Txt x={80} y={420} size={12} font="pixel" c={C.grey} ls={1.2}>ORIGINAL SET  ·  12 × 12 PX  ·  1-BIT</Txt>
        </g>
        <g opacity={inT(f, T + 40, 14)}>
          <Txt x={84} y={728} size={22} w={700}>个表情 · 一个像素也不能多</Txt>
          <Txt x={84} y={760} size={15} w={400} c={C.grey}>画面里的 7 个表情为本片原创，向原作致敬，不是原版。</Txt>
        </g>
      </Svg>
      <Chrome cfg={cfg} style={{left: 70, top: 440}} />
      <Svg>
        {/* 12×12 网格 + 一颗心逐像素点亮（每个像素都是一颗小果冻） */}
        <g transform={`translate(${n1(tgx)} ${n1(tgy)}) scale(${zoom.toFixed(4)}) translate(${-gx} ${-gy})`} opacity={kG}>
          <rect x={G.x - 16} y={G.y - 16} width={12 * G.s + 32} height={12 * G.s + 32} rx={28} fill="#FFFFFF" opacity={0.55} stroke="#FFFFFF" />
          <path d={grid} stroke={C.ink} strokeOpacity={0.12} strokeWidth={1} fill="none" />
          {cells.slice(0, nOn).map(([i, j], q) => {
            const t = q / 2.2 + T + 8;
            const k = f < t ? 0 : spr(f, t, BOUNCY);
            const x = G.x + i * G.s + G.s / 2;
            const y = G.y + j * G.s + G.s / 2;
            return (
              <g key={q} transform={`translate(${x} ${y}) scale(${k.toFixed(3)})`}>
                <rect x={-G.s / 2 + 2} y={-G.s / 2 + 2} width={G.s - 4} height={G.s - 4} rx={9} fill={EMOJI.heart[0]} />
                <rect x={-G.s / 2 + 6} y={-G.s / 2 + 4} width={G.s - 12} height={(G.s - 4) * 0.42} rx={6} fill="#FFFFFF" opacity={0.55} />
              </g>
            );
          })}
          <Txt x={G.x} y={G.y + 12 * G.s + 46} size={12} font="pixel" c={C.grey} ls={1} o={1 - c01((1 - zoom) * 4)}>{`PIXEL ${String(Math.min(nOn, cells.length)).padStart(2, '0')} / 144`}</Txt>
        </g>
        {/* 缩小后：一排原创表情 */}
        {['face', 'phone', 'sun', 'spark', 'mail', 'note'].map((n, i) => {
          const k = inS(f, T + 72 + i * 4, BOUNCY);
          if (k < 0.01) return null;
          const x = 1180 + (i + 1) * 92;
          return (
            <g key={n} transform={`translate(${x + 36} 806) scale(${k.toFixed(4)}) translate(-36 -36)`}>
              <rect width={72} height={72} rx={17} fill="url(#gWhite)" stroke="#AEB6C4" />
              <ellipse cx={36} cy={18} rx={28} ry={13} fill="#FFF" opacity={0.8} />
              <Emoji name={n} x={16} y={16} s={3.33} />
            </g>
          );
        })}
      </Svg>
    </>
  );
};
export {EmojiCh as Emoji};

/* ─────────── 05 千年虫：23:59:59 → 00:00:00 ─────────── */
export const Bug: React.FC<P> = ({f}) => {
  const T = AT.bug;
  const mid = T + 90; // 第 4 拍：零点
  const sec = f < T + 30 ? '57' : f < T + 60 ? '58' : '59';
  const clock = f < mid ? `23:59:${sec}` : '00:00:00';
  const tick = [T, T + 30, T + 60, mid].reduce((a, t) => (f >= t ? t : a), T);
  const bump = 1 + 0.025 * Math.exp(-(f - tick) / 5) * Math.cos((f - tick) * 0.6);
  const flash = f >= mid ? Math.exp(-(f - mid) / 6) : 0;
  const cfg = base({
    w: 1920,
    h: 420,
    bevel: 18,
    smooth: 2,
    cam: [960, -150, 1300],
    xf: [0, 0, bump],
    envRot: 0.15 + (f - T) * 0.002,
    sweep: [lerp(-1.4, 1.6, tween(f, mid, 26, 0, 1, E.inOut)), f >= mid ? 1.2 : 0],
    expo: 1 + 1.6 * flash,
    time: f / 60,
    texts: [{text: clock, x: 960, y: 300, size: 236, font: F.display, weight: 900, align: 'center', ls: -4}],
  });
  // 日期：1999 → 故障成 1900 → 修好成 2000
  const glitch = f >= mid && f < mid + 14;
  const fixed = f >= mid + 14;
  const date = f < mid ? '31.12.1999' : glitch ? '01.01.1900' : '01.01.2000';
  const gj = (s: string) => (glitch ? (random(`${s}${Math.floor(f / 2)}`) - 0.5) * 24 : 0);
  return (
    <>
      <Svg>
        <Kicker f={f} t0={T - 8} n={5} src="MILLENNIUM BUG · 31.12.1999" />
        <Head f={f} t0={T - 4} y={236} title="千年虫：只存了两位数的年份。" lines={['老程序把 1999 记成“99”，零点一过变成“00”——可能被读成 1900 年。']} />
      </Svg>
      <Chrome cfg={cfg} style={{top: 330}} />
      <Svg>
        <g transform="translate(960 790)">
          {glitch && (
            <>
              <Txt x={gj('r')} y={0} size={64} font="pixel" anchor="middle" c="#FF2E88" o={0.8}>{date}</Txt>
              <Txt x={gj('b')} y={4} size={64} font="pixel" anchor="middle" c={C.aqua} o={0.8}>{date}</Txt>
            </>
          )}
          <Txt x={gj('k')} y={0} size={64} font="pixel" anchor="middle" c={glitch ? C.red : C.ink} o={inT(f, T + 10, 10)}>{date + (glitch ? ' ?' : '')}</Txt>
        </g>
        <g opacity={inT(f, T + 14, 12)}>
          <Txt x={960} y={850} size={14} font="pixel" anchor="middle" c={C.grey} ls={1.4}>{fixed ? 'DATE CHECK  ·  4-DIGIT YEAR' : 'DATE CHECK  ·  2-DIGIT YEAR'}</Txt>
        </g>
        <Pill x={960 - 110} y={872} label="Y2K COMPLIANT ✓" fill={C.lime} c={C.ink} font="tech" size={13} k={fixed ? spr(f, mid + 14, BOUNCY) : 0} />
        <g opacity={inT(f, mid + 20, 12)}>
          <Txt x={1840} y={206} size={22} w={700} anchor="end" c={C.ink}>Y2K = Year 2 Kilo（2 千年）</Txt>
          <Txt x={1840} y={236} size={16} w={400} anchor="end" c={C.grey}>这个风格的名字，就从这只“虫”来。</Txt>
        </g>
        {flash > 0.01 && <rect width={1920} height={1080} fill="#FFFFFF" opacity={flash * 0.55} />}
      </Svg>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2 + 0.4;
        const k = f < mid ? 0 : tween(f, mid, 26, 0, 1, E.out);
        const r = 260 + 420 * k;
        return <Star key={i} f={f} t0={mid + i} x={960 + Math.cos(a) * r} y={560 + Math.sin(a) * r * 0.55} R={18 + (i % 3) * 10} spin={2} />;
      })}
    </>
  );
};
