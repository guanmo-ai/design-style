/**
 * 014 · 液态玻璃 —— 玻璃后面的世界（Canvas2D，按镜头画；t 是帧号，可以是小数）
 *
 * 两个平面：
 *   A  字墙（0—1920 × 0—1080）· 弯光（1920—3840 × 0—1080）· 五条规则（0—1920 × 1080—2160，在字墙正下方）
 *   B  二十五年的时间尺（x 0—4300）· 融合的专辑墙（x 4300—5300）· 界面区的背景（x 6000—8000）
 * 第一次穿过玻璃从 A 到 B，第二次从 B 回到 A 的规则页；片尾镜头从规则页往上摇回字墙。
 * 还有两块设备屏幕（手机 420×900、浏览器 1000×640），由 3D 贴图放进画面。
 */
import {C, ERAS, FONT} from '../tokens';
import {clamp, ease, prog} from './motion';

type Ctx = CanvasRenderingContext2D;
export type Cam = {plane: 'A' | 'B'; cx: number; cy: number; z: number};
type Blob = [number, number, number, string];

const LS = (ctx: Ctx, v: number) => ((ctx as unknown as {letterSpacing: string}).letterSpacing = `${v}px`);

export const text = (ctx: Ctx, s: string, x: number, y: number, size: number, w = 700, fam = FONT.sc, color: string = C.ink, align: CanvasTextAlign = 'left', ls = 0) => {
  ctx.font = `${w} ${size}px ${fam}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  LS(ctx, ls);
  ctx.fillText(s, x, y);
  LS(ctx, 0);
};

/** 字幕：一行字从遮罩里升上来（16 帧，ease-out）；out 之后再往上退出去 */
export const rise = (ctx: Ctx, s: string, x: number, y: number, size: number, t: number, t0: number, w = 900, fam = FONT.sc, color: string = C.ink, align: CanvasTextAlign = 'left', ls = 0, out = 1e9) => {
  const u = ease.out5(prog(t, t0, 18));
  const v = ease.in(prog(t, out, 12));
  if (u <= 0 || v >= 1) return;
  ctx.save();
  ctx.font = `${w} ${size}px ${fam}`;
  LS(ctx, ls);
  const m = ctx.measureText(s);
  const wdt = m.width + 20;
  const x0 = align === 'center' ? x - wdt / 2 : align === 'right' ? x - wdt : x - 10;
  ctx.beginPath();
  ctx.rect(x0, y - size * 1.08, wdt + 20, size * 1.38);
  ctx.clip();
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(s, x, y + (1 - u) * size * 1.2 - v * size * 1.2);
  ctx.restore();
  LS(ctx, 0);
};

const rr = (ctx: Ctx, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
};

// ───────── 彩色场 ─────────
const BLOBS: Record<'A' | 'B', Blob[]> = {
  A: [
    // 字墙
    [220, 120, 760, C.orange], [980, 1000, 700, C.pink], [1560, 260, 620, C.blue], [1900, 1040, 600, C.mint],
    // 弯光
    [2160, 160, 640, C.orange], [3340, 500, 600, C.blue], [3700, 1060, 520, C.pink], [2620, 1100, 520, C.mint],
    // 规则页
    [200, 1300, 700, C.mint], [1500, 1350, 650, C.orange], [1700, 2000, 640, C.pink], [500, 2100, 600, C.violet],
  ],
  B: [
    [300, 200, 700, C.pink], [1100, 900, 620, C.blue], [1800, 160, 640, C.orange], [2500, 950, 620, C.mint],
    [3200, 180, 640, C.violet], [3900, 900, 640, C.orange], [4600, 220, 700, C.pink], [5300, 980, 620, C.blue],
    [6200, 200, 760, C.orange], [6900, 1000, 700, C.mint], [7500, 260, 700, C.blue], [8100, 900, 640, C.pink],
  ],
};

const field = (ctx: Ctx, cam: Cam, t: number, vw: number, vh: number) => {
  const x0 = cam.cx - vw / 2 / cam.z;
  const y0 = cam.cy - vh / 2 / cam.z;
  const x1 = cam.cx + vw / 2 / cam.z;
  const y1 = cam.cy + vh / 2 / cam.z;
  ctx.fillStyle = '#EEEAF6';
  ctx.fillRect(x0 - 10, y0 - 10, x1 - x0 + 20, y1 - y0 + 20);
  BLOBS[cam.plane].forEach(([bx, by, r, c], i) => {
    // 每团颜色绕小圈慢慢漂，周期 = 全片，首尾一致
    const ph = (t / 1200) * Math.PI * 2 + i * 1.7;
    const x = bx + 40 * Math.cos(ph);
    const y = by + 40 * Math.sin(ph);
    if (x + r < x0 || x - r > x1 || y + r < y0 || y - r > y1) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, c);
    g.addColorStop(0.55, c + 'AA');
    g.addColorStop(1, c + '00');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  });
  ctx.strokeStyle = 'rgba(255,255,255,0.34)';
  ctx.lineWidth = 1.5 / Math.max(cam.z, 0.5);
  ctx.beginPath();
  const s = 60;
  for (let x = Math.floor(x0 / s) * s; x < x1 + s; x += s) {
    ctx.moveTo(x, y0 - s);
    ctx.lineTo(x, y1 + s);
  }
  for (let y = Math.floor(y0 / s) * s; y < y1 + s; y += s) {
    ctx.moveTo(x0 - s, y);
    ctx.lineTo(x1 + s, y);
  }
  ctx.stroke();
};

// ───────── 平面 A ─────────
const wall = (ctx: Ctx) => {
  text(ctx, 'LIQUID', 58, 400, 372, 700, FONT.display, C.ink, 'left', -16);
  text(ctx, 'GLASS', 46, 772, 372, 700, FONT.display, C.ink, 'left', -16);
  text(ctx, 'DESIGN STYLE · 风格 014', 70, 96, 28, 500, FONT.mono, C.ink, 'left', 3);
  text(ctx, '2013—今天', 1850, 96, 28, 500, FONT.mono, C.ink, 'right', 3);
  text(ctx, 'REFRACTION = SLOPE OF THE EDGE', 70, 900, 30, 500, FONT.mono, C.ink, 'left', 2);
  text(ctx, '液态玻璃：玻璃不发光，只弯光', 70, 960, 44, 900);
  ctx.fillStyle = C.ink;
  for (let i = 0; i < 16; i++) ctx.fillRect(1700, 300 + i * 26, 70 + ((i * 37) % 120), 6);
};

export type BendState = {bevel: number; chroma: number};

const bend = (ctx: Ctx, t: number, st: BendState) => {
  ctx.save();
  ctx.translate(1920, 0);
  rise(ctx, '01  ·  弯光', 120, 190, 32, t, 168, 500, FONT.mono, C.ink, 'left', 3);
  rise(ctx, '玻璃不发光，', 116, 320, 104, t, 174);
  rise(ctx, '只弯光。', 116, 440, 104, t, 180);
  rise(ctx, '折射量 = 边缘的坡度', 120, 530, 52, t, 190);
  const a = ease.out(prog(t, 198, 12));
  ctx.globalAlpha = a;
  text(ctx, `bevel   ${st.bevel.toFixed(0).padStart(2, ' ')} px`, 120, 630, 44, 500, FONT.mono);
  text(ctx, `chroma  ${(st.chroma * 100).toFixed(0)} %`, 120, 690, 44, 500, FONT.mono);
  // 截面：厚度（黑）与位移（橙）
  const x = 120, y = 750, w = 760, h = 230;
  ctx.fillStyle = 'rgba(255,255,255,0.86)';
  rr(ctx, x, y, w, h, 28);
  ctx.fill();
  const b = st.bevel;
  const frac = Math.max(0.0001, (b / 44) * 0.3);
  const thick: [number, number][] = [];
  const disp: [number, number][] = [];
  for (let i = 0; i <= 200; i++) {
    const u = i / 200;
    const d = Math.min(u, 1 - u) * 2;
    const tt = Math.max(0, 1 - d / frac);
    const hh = b < 0.5 ? 1 : Math.sqrt(Math.max(0, 1 - tt * tt));
    thick.push([x + 40 + u * (w - 80), y + 120 - hh * 70]);
    disp.push([x + 40 + u * (w - 80), y + 196 - Math.pow(tt, 2.4) * 56 * (b > 0.5 ? 1 : 0)]);
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
  ctx.globalAlpha = 1;
  // 右：标本
  ctx.save();
  ctx.globalAlpha = 0.55;
  for (let i = 0; i < 16; i++) {
    text(ctx, 'REFRACTION = SLOPE · 折射量 = 坡度 · ', 980 + ((i * 53) % 90) - 60, 250 + i * 40, 24, 500, FONT.mono, C.ink, 'left', 1);
  }
  ctx.restore();
  text(ctx, 'Aa', 1010, 800, 540, 700, FONT.display, C.ink, 'left', -20);
  ctx.restore();
};

export const RULES = [
  ['只弯光', 'Bend, don’t blur', '中间是平的；只有边缘那一圈按坡度弯'],
  ['厚度 = 层级', 'Depth', '列表 12px · 按钮 26px · 浮层 44px'],
  ['只放在控件层', 'Controls only', '内容铺满，玻璃浮在上面；不叠玻璃'],
  ['靠近就融合', 'Merge', '间距 < 24px 用 smooth-min 合成一块'],
  ['字要自适应', 'Adapt', '后面亮用黑字，后面暗用白字，≥ 4.5 : 1'],
];
export const RULE_Y = (i: number) => 1080 + 300 + 156 * i;

const rules = (ctx: Ctx, t: number, active: number) => {
  rise(ctx, '五条规则', 260, 1080 + 170, 46, t, 904, 900, FONT.sc, C.ink, 'left', 4);
  rise(ctx, 'FIVE RULES', 1660, 1080 + 170, 28, t, 908, 500, FONT.mono, C.ink, 'right', 4);
  RULES.forEach(([zh, en, note], i) => {
    const y = RULE_Y(i);
    const on = Math.abs(active - i) < 0.5;
    const t0 = 908 + i * 3;
    rise(ctx, `0${i + 1}`, 260, y + 20, 40, t, t0, 500, FONT.mono, on ? C.ink : 'rgba(11,12,16,0.55)');
    rise(ctx, zh, 360, y + 26, 84, t, t0 + 2, 900, FONT.sc, on ? C.ink : 'rgba(11,12,16,0.55)');
    rise(ctx, en, 1660, y + 2, 28, t, t0 + 4, 500, FONT.mono, on ? C.ink : 'rgba(11,12,16,0.45)', 'right', 2);
    rise(ctx, note, 1660, y + 44, 30, t, t0 + 6, 700, FONT.sc, on ? C.ink : 'rgba(11,12,16,0.45)', 'right');
  });
};

// ───────── 平面 B ─────────
export const ERA_X = (k: number) => 900 + 700 * k;
export const ERA_LAND = (k: number) => 330 + 45 * k;
export const MERGE_C = {x: 5200, y: 640};
export const UI_CAM = 7000;

const eras = (ctx: Ctx, t: number, x0: number, x1: number) => {
  // 物体后面的一条彩带：圆、条纹、字——看得出模糊与折射的区别
  const cols = [C.orange, C.blue, C.mint, C.pink, C.violet, C.ink];
  for (let i = Math.floor((x0 - 200) / 220); i < (x1 + 200) / 220 && i * 220 < 3760; i++) {
    if (i < 0) continue;
    const x = i * 220;
    ctx.fillStyle = cols[i % 6];
    ctx.beginPath();
    ctx.arc(x + 80, 570 + (i % 2) * 170, 58, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, ['Aa', 'GLASS', 'Aa', 'LIGHT', 'Aa', 'LENS'][i % 6], x + 150, 690 + (i % 2) * 40 - 20, 64, 700, FONT.display, C.ink, 'left', -2);
  }
  // 时间尺
  ctx.fillStyle = C.ink;
  ctx.fillRect(Math.max(0, x0 - 50), 918, Math.min(3900, x1 + 50) - Math.max(0, x0 - 50), 4);
  for (let x = Math.floor(Math.max(0, x0) / 70) * 70; x < Math.min(3900, x1 + 70); x += 70) ctx.fillRect(x, 906, 3, 12);
  ERAS.forEach((e, k) => {
    const ex = ERA_X(k);
    if (ex < x0 - 1200 || ex > x1 + 400) return;
    ctx.fillRect(ex - 2, 886, 5, 34);
    text(ctx, e.year, ex, 972, 34, 500, FONT.mono, C.ink, 'center', 2);
    const L = ERA_LAND(k);
    rise(ctx, e.year, ex - 900, 300, 190, t, L - 6, 700, FONT.display, C.ink, 'left', -8);
    rise(ctx, e.name, ex - 896, 376, 64, t, L + 2, 700, FONT.display, C.ink, 'left', -2);
    rise(ctx, e.zh, ex - 892, 424, 36, t, L + 5, 700);
    const a = ease.out(prog(t, L + 8, 12));
    if (a > 0) {
      ctx.save();
      ctx.globalAlpha = a;
      ctx.font = `700 34px ${FONT.sc}`;
      const nw = ctx.measureText(e.note).width + 64;
      ctx.fillStyle = C.ink;
      rr(ctx, ex - 896, 448 + (1 - a) * 20, nw, 66, 33);
      ctx.fill();
      text(ctx, e.note, ex - 864, 493 + (1 - a) * 20, 32, 700, FONT.sc, C.white);
      ctx.restore();
    }
  });
  rise(ctx, '02  ·  二十五年，同一块玻璃', 900 - 896, 92, 32, t, 312, 500, FONT.mono, C.ink, 'left', 3);
};

export type MergeState = {gap: number};

const merge = (ctx: Ctx, t: number, st: MergeState) => {
  // 专辑墙：三列，慢慢往上走
  const off = (t - 540) * 1.4;
  const pal = [C.orange, C.blue, C.pink, C.mint, C.violet, C.ink];
  const words = ['BLUE', 'HOUR', 'GLASS', 'DROP', 'LENS', 'LIGHT'];
  for (let r = -1; r < 5; r++) {
    for (let c = 0; c < 4; c++) {
      const x = MERGE_C.x - 360 + c * 290;
      const y = 140 + r * 290 - (((off % 290) + 290) % 290);
      const i = (r + Math.floor(off / 290) + 60) * 4 + c;
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
  const X = MERGE_C.x - 977;
  rise(ctx, '03  ·  融合', X, 190, 32, t, 556, 500, FONT.mono, C.ink, 'left', 3);
  rise(ctx, '靠近就融合。', X - 4, 320, 104, t, 560);
  rise(ctx, 'smooth-min  k = 24', X, 410, 44, t, 568, 500, FONT.mono);
  if (t > 572) text(ctx, `gap  ${Math.max(0, st.gap).toFixed(0).padStart(3, ' ')} px${st.gap < 1 ? '  → 一块' : ''}`, X, 480, 44, 500, FONT.mono);
  rise(ctx, '按一下，', X - 4, 640, 88, t, 630);
  rise(ctx, '长成菜单。', X - 4, 745, 88, t, 636);
  rise(ctx, '形状连续地变，不是换一张图', X, 820, 36, t, 646, 700);
};

const uiBackdrop = (ctx: Ctx, t: number) => {
  rise(ctx, '04  ·  只放在控件层：内容在下面滚，玻璃浮在上面', UI_CAM - 960 + 100, 92, 40, t, 732);
  rise(ctx, '字自己换颜色：后面亮 → 黑字，后面暗 → 白字', UI_CAM - 960 + 900, 1036, 38, t, 840);
};

/** 画一个平面在镜头下的样子（ctx 未变换；画布尺寸 vw × vh） */
export const drawPlane = (ctx: Ctx, cam: Cam, t: number, st: {bend: BendState; merge: MergeState; rule: number}, vw = 1920, vh = 1080, px = 1) => {
  // px：画布像素 / 逻辑像素（草稿预览用 0.5）
  ctx.setTransform(cam.z * px, 0, 0, cam.z * px, px * (vw / 2 - cam.cx * cam.z), px * (vh / 2 - cam.cy * cam.z));
  field(ctx, cam, t, vw, vh);
  const x0 = cam.cx - vw / 2 / cam.z;
  const x1 = cam.cx + vw / 2 / cam.z;
  const y0 = cam.cy - vh / 2 / cam.z;
  const y1 = cam.cy + vh / 2 / cam.z;
  if (cam.plane === 'A') {
    if (x0 < 1920 && y0 < 1080) wall(ctx);
    if (x1 > 1920 && y0 < 1080) bend(ctx, t, st.bend);
    if (y1 > 1080 && x0 < 1920) rules(ctx, t, st.rule);
  } else {
    if (x0 < 4400) eras(ctx, t, x0, x1);
    if (x1 > 3600 && x0 < 5600) merge(ctx, t, st.merge);
    if (x1 > 6000) uiBackdrop(ctx, t);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};

// ───────── 设备屏幕 ─────────
export const PHONE = {w: 420, h: 900};
export const BROWSER = {w: 1000, h: 640};

export const drawPhone = (ctx: Ctx, t: number, scroll: number) => {
  const {w, h} = PHONE;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, w, h);
  const y0 = 70 - scroll;
  const g = ctx.createLinearGradient(0, y0, w, y0 + 420);
  g.addColorStop(0, C.orange);
  g.addColorStop(0.5, C.pink);
  g.addColorStop(1, C.blue);
  ctx.fillStyle = g;
  rr(ctx, 22, y0, w - 44, 380, 28);
  ctx.fill();
  text(ctx, 'BLUE', 40, y0 + 190, 124, 700, FONT.display, C.ink, 'left', -6);
  text(ctx, 'HOUR', 40, y0 + 312, 124, 700, FONT.display, C.ink, 'left', -6);
  text(ctx, 'Blue Hour', 24, y0 + 448, 38, 700, FONT.display);
  text(ctx, 'Glass Choir · 2025', 24, y0 + 488, 24, 500, FONT.text, C.mute);
  const rows = ['弯成你的样子', '光在玻璃里转弯', '靠近就融成一块', '后面亮就写黑字', '后面暗就写白字', '只放在控件层', '中间是平的', '边上才弯'];
  rows.forEach((s, i) => {
    const y = y0 + 540 + i * 92;
    ctx.fillStyle = [C.blue, C.ink, C.mint, C.orange, C.ink, C.pink, C.violet, C.ink][i];
    rr(ctx, 22, y, 68, 68, 14);
    ctx.fill();
    text(ctx, s, 108, y + 32, 27, 900);
    text(ctx, `0${i + 1} · 3:${String((12 + i * 7) % 60).padStart(2, '0')}`, 108, y + 60, 21, 500, FONT.mono, C.mute);
  });
  // 一大块深色：滚到标签栏底下，字会自己变白
  ctx.fillStyle = C.ink;
  rr(ctx, 22, y0 + 1290, w - 44, 520, 28);
  ctx.fill();
  text(ctx, '后面暗 → 白字', 50, y0 + 1380, 38, 900, FONT.sc, C.white);
  // 状态栏（内容滚到它底下时被纸色挡住）
  const sg = ctx.createLinearGradient(0, 0, 0, 64);
  sg.addColorStop(0, C.paper);
  sg.addColorStop(0.75, C.paper);
  sg.addColorStop(1, C.paper + '00');
  ctx.fillStyle = sg;
  ctx.fillRect(0, 0, w, 64);
  text(ctx, '9:41', 34, 40, 22, 700, FONT.text, C.ink);
  void t;
};

export const drawBrowser = (ctx: Ctx, t: number, scroll: number) => {
  const {w, h} = BROWSER;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, w, h);
  const wy = 52 - scroll;
  const hg = ctx.createLinearGradient(0, wy, w, wy + 520);
  hg.addColorStop(0, C.mint);
  hg.addColorStop(0.5, C.blue);
  hg.addColorStop(1, C.violet);
  ctx.fillStyle = hg;
  ctx.fillRect(0, wy, w, 540);
  text(ctx, 'Liquid', 56, wy + 280, 190, 700, FONT.display, C.ink, 'left', -8);
  text(ctx, 'Glass', 56, wy + 452, 190, 700, FONT.display, C.white, 'left', -8);
  text(ctx, '内容铺满整屏，玻璃只做浮在上面的控件。', 56, wy + 620, 32, 900);
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = [C.orange, C.pink, C.ink][i];
    rr(ctx, 56 + i * 304, wy + 680, 276, 290, 22);
    ctx.fill();
    text(ctx, ['弯光', '融合', '自适应'][i], 78 + i * 304, wy + 930, 42, 900, FONT.sc, i === 2 ? C.white : C.ink);
  }
  ctx.fillStyle = C.ink;
  ctx.fillRect(0, wy + 1040, w, 500);
  text(ctx, 'bevel 26 · frost 6 · tint 36%', 56, wy + 1140, 40, 500, FONT.mono, C.white);
  // 标题栏
  ctx.fillStyle = '#E3E1DB';
  ctx.fillRect(0, 0, w, 44);
  ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(26 + i * 24, 22, 7, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = '#FFFFFF';
  rr(ctx, 320, 10, 360, 24, 12);
  ctx.fill();
  text(ctx, 'liquid.glass', 500, 28, 16, 500, FONT.mono, C.mute, 'center');
  void t;
  void clamp;
};
