/**
 * 014 · 液态玻璃 —— 玻璃后面的内容（Canvas2D 逐帧画，交给着色器当贴图）
 *
 * 六页从左到右排成一排，每页 1920 宽；第 5 页 = 第 0 页。
 * 颜色全部在这里：玻璃本身无色。
 */
import {C, ERAS, FONT} from '../tokens';
import {ERA_AT} from './glass';
import {AT, PAGE} from './timeline';

type Ctx = CanvasRenderingContext2D;
type Blob = [number, number, number, string];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const tw = (f: number, a: number, d: number) => ease(clamp((f - a) / d));

/** 每页底下的几团颜色（页内坐标）。蓝色只放在右边玻璃底下，字压不到深色上 */
const BLOBS: Blob[][] = [
  [[220, 120, 760, C.orange], [980, 1000, 700, C.pink], [1560, 260, 620, C.blue], [1900, 1040, 600, C.mint]],
  [[240, 160, 640, C.orange], [1420, 500, 600, C.blue], [1780, 1060, 520, C.pink], [700, 1100, 520, C.mint]],
  [[200, 240, 640, C.pink], [1480, 240, 560, C.orange], [1380, 900, 560, C.blue], [760, 1080, 520, C.mint]],
  [[200, 200, 620, C.mint], [1440, 420, 680, C.pink], [1700, 1050, 520, C.violet], [700, 1100, 500, C.orange]],
  [[260, 260, 700, C.orange], [1320, 160, 640, C.blue], [1760, 1020, 600, C.mint], [760, 1060, 520, C.pink]],
];
const pageBlobs = (k: number) => BLOBS[((k % 5) + 5) % 5];

const font = (w: number, size: number, fam = FONT.sc) => `${w} ${size}px ${fam}`;

const text = (ctx: Ctx, s: string, x: number, y: number, size: number, w = 700, fam = FONT.sc, color: string = C.ink, align: CanvasTextAlign = 'left', ls = 0) => {
  ctx.font = font(w, size, fam);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  (ctx as unknown as {letterSpacing: string}).letterSpacing = `${ls}px`;
  ctx.fillText(s, x, y);
  (ctx as unknown as {letterSpacing: string}).letterSpacing = '0px';
};

const rr = (ctx: Ctx, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
};

// ───────── 底：彩色场 + 网格 ─────────
export const drawField = (ctx: Ctx, x0: number, f: number) => {
  ctx.fillStyle = '#EEEAF6';
  ctx.fillRect(x0 - 10, -10, PAGE + 20, 1100);
  const k0 = Math.floor(x0 / PAGE) - 1;
  for (let k = k0; k <= k0 + 3; k++) {
    pageBlobs(k).forEach(([bx, by, r, c], i) => {
      // 每团颜色绕一个小圈慢慢漂，周期 = 全片长度，首尾一致
      const ph = (f / 1200) * Math.PI * 2 + i * 1.7 + (((k % 5) + 5) % 5);
      const x = k * PAGE + bx + 40 * Math.cos(ph);
      const y = by + 40 * Math.sin(ph);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, c);
      g.addColorStop(0.55, c + 'AA');
      g.addColorStop(1, c + '00');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    });
  }
  // 网格：被玻璃弯过的直线最能看出“折射”
  ctx.strokeStyle = 'rgba(255,255,255,0.32)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const s = 60;
  for (let x = Math.floor(x0 / s) * s; x < x0 + PAGE + s; x += s) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1080);
  }
  for (let y = 0; y <= 1080; y += s) {
    ctx.moveTo(x0 - s, y);
    ctx.lineTo(x0 + PAGE + s, y);
  }
  ctx.stroke();
};

// ───────── 第 0 页：字墙 ─────────
const page0 = (ctx: Ctx) => {
  text(ctx, 'LIQUID', 58, 400, 372, 700, FONT.display, C.ink, 'left', -16);
  text(ctx, 'GLASS', 46, 772, 372, 700, FONT.display, C.ink, 'left', -16);
  text(ctx, 'DESIGN STYLE · 风格 014', 70, 96, 28, 500, FONT.mono, C.ink, 'left', 3);
  text(ctx, '2013—今天', 1850, 96, 28, 500, FONT.mono, C.ink, 'right', 3);
  text(ctx, 'REFRACTION = SLOPE OF THE EDGE', 70, 880, 30, 500, FONT.mono, C.ink, 'left', 2);
  text(ctx, '折射量 = 边缘的坡度', 70, 935, 40, 900, FONT.sc, C.ink);
  ctx.fillStyle = C.ink;
  for (let i = 0; i < 16; i++) ctx.fillRect(1640, 300 + i * 26, 70 + ((i * 37) % 120), 6);
};

// ───────── 第 1 页：弯光 ─────────
const page1 = (ctx: Ctx, f: number, ro: Record<string, number>) => {
  text(ctx, '01  ·  弯光', 120, 190, 32, 500, FONT.mono, C.ink, 'left', 3);
  text(ctx, '玻璃不发光，', 116, 320, 104, 900);
  text(ctx, '只弯光。', 116, 440, 104, 900);
  text(ctx, '折射量 = 边缘的坡度', 120, 530, 52, 900, FONT.sc, C.ink);
  const b = ro.bevel ?? 44;
  const ch = ro.chroma ?? 0.06;
  text(ctx, `bevel   ${b.toFixed(0).padStart(2, ' ')} px`, 120, 630, 44, 500, FONT.mono);
  text(ctx, `chroma  ${(ch * 100).toFixed(0)} %`, 120, 690, 44, 500, FONT.mono);
  // 截面图：厚度（黑）与位移（橙）
  const x = 120, y = 750, w = 760, h = 230;
  ctx.fillStyle = 'rgba(255,255,255,0.86)';
  rr(ctx, x, y, w, h, 28);
  ctx.fill();
  const frac = Math.max(0.0001, (b / 44) * 0.3);
  const thick: [number, number][] = [];
  const disp: [number, number][] = [];
  for (let i = 0; i <= 200; i++) {
    const u = i / 200;
    const d = Math.min(u, 1 - u) * 2;
    const t = Math.max(0, 1 - d / frac);
    const hh = b < 0.5 ? 1 : Math.sqrt(Math.max(0, 1 - t * t));
    thick.push([x + 40 + u * (w - 80), y + 120 - hh * 70]);
    disp.push([x + 40 + u * (w - 80), y + 196 - Math.pow(t, 2.4) * 56 * (b > 0.5 ? 1 : 0)]);
  }
  for (const [pts, col] of [[thick, C.ink], [disp, C.orange]] as const) {
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.strokeStyle = col;
    ctx.lineWidth = 5;
    ctx.stroke();
  }
  text(ctx, '截面', x + 40, y + 36, 26, 700);
  text(ctx, '位移', x + w / 2, y + 176, 26, 700, FONT.sc, C.orange, 'center');
  // 右：标本（镜片底下）
  ctx.save();
  ctx.globalAlpha = 0.55;
  for (let i = 0; i < 16; i++) {
    text(ctx, 'REFRACTION = SLOPE · 折射量 = 坡度 · ', 980 + ((i * 53) % 90) - 60, 250 + i * 40, 24, 500, FONT.mono, C.ink, 'left', 1);
  }
  ctx.restore();
  text(ctx, 'Aa', 1010, 800, 540, 700, FONT.display, C.ink, 'left', -20);
  void f;
};

// ───────── 第 2 页：二十五年 ─────────
const page2 = (ctx: Ctx, f: number, ro: Record<string, number>) => {
  const era = ro.era ?? 0;
  text(ctx, '02  ·  二十五年，同一块玻璃', 120, 190, 32, 500, FONT.mono, C.ink, 'left', 3);
  // 年份：旧的往上滚走，新的从下面滚上来
  ctx.save();
  ctx.beginPath();
  ctx.rect(100, 230, 900, 260);
  ctx.clip();
  for (let k = 0; k < ERAS.length; k++) {
    const p = tw(f, ERA_AT[k] - 10, 16);
    const q = k + 1 < ERAS.length ? tw(f, ERA_AT[k + 1] - 10, 16) : 0;
    const yy = 450 + (1 - p) * 260 - q * 260;
    if (p > 0 && q < 1) text(ctx, ERAS[k].year, 110, yy, 260, 700, FONT.display, C.ink, 'left', -10);
  }
  ctx.restore();
  const e = ERAS[era];
  const a = clamp((f - ERA_AT[era] + 4) / 10);
  ctx.globalAlpha = a;
  text(ctx, e.name, 120, 590, 84, 700, FONT.display, C.ink, 'left', -2);
  text(ctx, e.zh, 124, 650, 40, 700);
  ctx.font = font(500, 36, FONT.mono);
  const nw = ctx.measureText(e.note).width + 120;
  ctx.fillStyle = C.ink;
  rr(ctx, 120, 690, nw, 74, 37);
  ctx.fill();
  text(ctx, e.note, 150, 740, 34, 700, FONT.sc, C.white);
  ctx.globalAlpha = 1;
  // 底部：五个年份的进度
  ERAS.forEach((x, k) => {
    const cx = 140 + k * 170;
    ctx.fillStyle = k <= era ? C.ink : 'rgba(11,12,16,0.25)';
    ctx.beginPath();
    ctx.arc(cx, 880, k === era ? 14 : 9, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, x.year, cx, 940, 28, 500, FONT.mono, k === era ? C.ink : 'rgba(11,12,16,0.45)', 'center');
  });
  ctx.fillStyle = 'rgba(11,12,16,0.25)';
  ctx.fillRect(140, 878, 680, 4);
  // 右：一直往上滚的内容，看得出模糊与折射的区别
  const off = ((f - AT.eras) * 2.4) % 300;
  const cols = [C.orange, C.blue, C.mint, C.pink, C.ink];
  for (let i = -2; i < 8; i++) {
    const y = 150 + i * 150 - off + 150;
    const c = cols[(i + 20) % 5];
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(1180 + (i % 2) * 420, y, 64, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, ['AQUA', 'AERO', 'iOS 7', 'GLASS', 'LIQUID'][(i + 20) % 5], 1290 - (i % 2) * 40, y + 22, 64, 700, FONT.display, C.ink, 'left', -2);
  }
};

// ───────── 第 3 页：融合 ─────────
const page3 = (ctx: Ctx, f: number, ro: Record<string, number>) => {
  text(ctx, '03  ·  融合', 120, 190, 32, 500, FONT.mono, C.ink, 'left', 3);
  text(ctx, '靠近就融合。', 116, 320, 104, 900);
  text(ctx, 'smooth-min  k = 24', 120, 410, 44, 500, FONT.mono);
  const g = ro.gap ?? 64;
  text(ctx, `gap  ${Math.max(0, g).toFixed(0).padStart(2, ' ')} px${g < 1 ? '  → 一块' : ''}`, 120, 480, 44, 500, FONT.mono);
  const a = tw(f, 760, 18);
  ctx.globalAlpha = a;
  text(ctx, '按一下，', 116, 640, 88, 900);
  text(ctx, '按钮长成菜单。', 116, 745, 88, 900);
  text(ctx, '形状是连续变的，不是换一张图', 120, 820, 36, 700, FONT.sc, C.ink);
  ctx.globalAlpha = 1;
  // 右：一面专辑墙，慢慢往上走
  const off = (f - AT.merge) * 1.6;
  const pal = [C.orange, C.blue, C.pink, C.mint, C.violet, C.ink];
  const words = ['BLUE', 'HOUR', 'GLASS', 'DROP', 'LENS', 'LIGHT'];
  for (let r = -1; r < 5; r++) {
    for (let c = 0; c < 3; c++) {
      const x = 1060 + c * 290;
      const y = 120 + r * 290 - (off % 290);
      const i = (r + Math.floor(off / 290) + 60) * 3 + c;
      ctx.fillStyle = pal[i % 6];
      rr(ctx, x, y, 230, 230, 24);
      ctx.fill();
      text(ctx, words[(i * 7) % 6], x + 20, y + 206, 54, 700, FONT.display, i % 6 === 5 ? C.white : C.ink, 'left', -1);
      ctx.fillStyle = i % 6 === 5 ? C.orange : C.white;
      ctx.beginPath();
      ctx.arc(x + 172, y + 60, 30, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};

// ───────── 第 4 页：落到界面（手机 + 网页） ─────────
const page4 = (ctx: Ctx, f: number) => {
  text(ctx, '04  ·  只放在控件层：内容在下面滚，玻璃浮在上面', 260, 92, 40, 900);
  const sc = Math.max(0, f - AT.ui) * 3.2;
  // 手机
  const px = 260, py = 130, pw = 440, ph = 880;
  ctx.fillStyle = C.ink;
  rr(ctx, px - 14, py - 14, pw + 28, ph + 28, 76);
  ctx.fill();
  ctx.save();
  rr(ctx, px, py, pw, ph, 62);
  ctx.clip();
  ctx.fillStyle = C.paper;
  ctx.fillRect(px, py, pw, ph);
  const y0 = py + 60 - sc;
  // 封面
  const g = ctx.createLinearGradient(px, y0, px + pw, y0 + 440);
  g.addColorStop(0, C.orange);
  g.addColorStop(0.5, C.pink);
  g.addColorStop(1, C.blue);
  ctx.fillStyle = g;
  rr(ctx, px + 24, y0, pw - 48, 400, 28);
  ctx.fill();
  text(ctx, 'BLUE', px + 44, y0 + 200, 132, 700, FONT.display, C.ink, 'left', -6);
  text(ctx, 'HOUR', px + 44, y0 + 330, 132, 700, FONT.display, C.ink, 'left', -6);
  text(ctx, 'Blue Hour', px + 26, y0 + 470, 40, 700, FONT.display);
  text(ctx, 'Glass Choir · 2025', px + 26, y0 + 512, 26, 500, FONT.text, C.mute);
  const rows = ['弯成你的样子', '光在玻璃里转弯', '靠近就融成一块', '后面亮就写黑字', '后面暗就写白字', '只放在控件层', '中间是平的', '边上才弯'];
  rows.forEach((s, i) => {
    const y = y0 + 570 + i * 96;
    const c = [C.blue, C.ink, C.mint, C.orange, C.ink, C.pink, C.violet, C.ink][i];
    ctx.fillStyle = c;
    rr(ctx, px + 24, y, 72, 72, 14);
    ctx.fill();
    text(ctx, s, px + 116, y + 34, 28, 900);
    text(ctx, `0${i + 1} · 3:${(12 + i * 7) % 60}`.padEnd(8, '0'), px + 116, y + 64, 22, 500, FONT.mono, C.mute);
  });
  // 一大块深色：滚到标签栏底下时，字会自己变白
  ctx.fillStyle = C.ink;
  rr(ctx, px + 24, y0 + 1350, pw - 48, 420, 28);
  ctx.fill();
  text(ctx, '后面暗 → 白字', px + 50, y0 + 1440, 40, 900, FONT.sc, C.white);
  ctx.restore();
  // 浏览器
  const bx = 820, by = 150, bw = 1020, bh = 790;
  ctx.fillStyle = 'rgba(11,12,16,0.18)';
  rr(ctx, bx + 6, by + 18, bw, bh, 26);
  ctx.fill();
  ctx.save();
  rr(ctx, bx, by, bw, bh, 22);
  ctx.clip();
  ctx.fillStyle = C.paper;
  ctx.fillRect(bx, by, bw, bh);
  const wy = by + 64 - sc * 1.15;
  const hg = ctx.createLinearGradient(bx, wy, bx + bw, wy + 520);
  hg.addColorStop(0, C.mint);
  hg.addColorStop(0.5, C.blue);
  hg.addColorStop(1, C.violet);
  ctx.fillStyle = hg;
  ctx.fillRect(bx, wy, bw, 560);
  text(ctx, 'Liquid', bx + 60, wy + 290, 200, 700, FONT.display, C.ink, 'left', -8);
  text(ctx, 'Glass', bx + 60, wy + 470, 200, 700, FONT.display, C.white, 'left', -8);
  text(ctx, '内容铺满整屏，玻璃只做浮在上面的控件。', bx + 60, wy + 640, 34, 900);
  for (let i = 0; i < 3; i++) {
    const c = [C.orange, C.pink, C.ink][i];
    ctx.fillStyle = c;
    rr(ctx, bx + 60 + i * 310, wy + 700, 280, 300, 22);
    ctx.fill();
    text(ctx, ['弯光', '融合', '自适应'][i], bx + 84 + i * 310, wy + 960, 44, 900, FONT.sc, i === 2 ? C.white : C.ink);
  }
  ctx.fillStyle = C.ink;
  ctx.fillRect(bx, wy + 1060, bw, 500);
  text(ctx, 'bevel 26 · frost 3 · tint 30%', bx + 60, wy + 1160, 44, 500, FONT.mono, C.white);
  ctx.restore();
  // 浏览器标题栏
  ctx.fillStyle = '#E3E1DB';
  ctx.save();
  rr(ctx, bx, by, bw, 52, 22);
  ctx.clip();
  ctx.fillRect(bx, by, bw, 52);
  ctx.restore();
  ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(bx + 30 + i * 26, by + 26, 8, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = '#FFFFFF';
  rr(ctx, bx + 330, by + 12, 360, 28, 14);
  ctx.fill();
  text(ctx, 'liquid.glass', bx + 510, by + 33, 18, 500, FONT.mono, C.mute, 'center');
  // 第二条说明：字跟着后面的亮度换颜色
  const a = tw(f, AT.ui + 120, 20);
  ctx.globalAlpha = a;
  text(ctx, '字自己换颜色：后面亮 → 黑字，后面暗 → 白字', 820, 1022, 38, 900);
  ctx.globalAlpha = 1;
};

/** 画世界里 [x0, x0 + 1920) 这一段（ctx 已经平移到世界坐标） */
export const drawWorld = (ctx: Ctx, x0: number, f: number, ro: Record<string, number>) => {
  drawField(ctx, x0, f);
  const k0 = Math.floor(x0 / PAGE);
  for (let k = k0; k <= k0 + 1; k++) {
    ctx.save();
    ctx.translate(k * PAGE, 0);
    const kk = ((k % 5) + 5) % 5;
    if (kk === 0) page0(ctx);
    else if (kk === 1) page1(ctx, f, ro);
    else if (kk === 2) page2(ctx, f, ro);
    else if (kk === 3) page3(ctx, f, ro);
    else page4(ctx, f);
    ctx.restore();
  }
};
