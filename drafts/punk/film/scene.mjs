// 朋克复印机 · 场景。全片只有一种转场：复印机的灯管扫过去 = 复印一次。
// 一张“纸”（sheet）是：内容（画在页面坐标里，彩色）+ 怎么印（raw 原稿 / x 复印件）+ 纸色 + 复印参数 + 镜头。
// PASSES[k] 把 SHEETS[k] 变成 SHEETS[k+1]：灯管左边是新的一代，右边是上一代；刚扫过的墨约 5 帧后才“定”。
// 时间轴按拍写：B(拍) → 帧。配乐回来后只改 BPM 和 OFF。
import { createCanvas, W, H, D, P, clamp, lerp, prog, eio, eo, ei, sstep, settle, hash, rng, rgb, photo, halftone, chip, ransom, tape, staple, scrawl, xeroxPixel, NF, NM, Path2D } from './kit.mjs';

export const FPS = 60, BPM = +(process.env.BPM ?? 160), FPB = 3600 / BPM, OFF = +(process.env.OFF ?? 0);
export const B = b => OFF + b * FPB;
export const END = Math.round(B(50));
const PAD = 260;                                    // 灯管从画外 PAD 处起步，扫到画外 PAD 处
const EV = { scans: [], slaps: [], ticks: [], tapes: [], staples: [], marker: [], knob: [], whoosh: [], thunks: [], final: 0 };

// ———————————————————— 复印参数：第 g 代 ————————————————————
// k = log2(g)。代数越多：模糊越大（细线断、角变圆）、阈值越高（黑往外渗）、噪声越大（边起毛、出墨团）、墨点越多、整张越歪
export function gen(g, o = {}) {
  const k = Math.log2(Math.max(1, g));
  const kk = Math.pow(k, 1.6);              // 前几代变化小，十几代以后塌得快
  return { th: .5 + .012 * kk, soft: .05, n: .1 + .03 * k, nm: .1 + .02 * kk, nl: .03 + .025 * kk, speck: .0005 * (1 + 1.2 * kk), dens: 1, blur: .8 + 1.05 * kk,
    rot: k * .45 * (g % 2 ? 1 : -1) * (k > 0), dx: k * 4, dy: -k * 2.6, g, ...o };
}

// ———————————————————— 镜头 ————————————————————
const ID = { x: W / 2, y: H / 2, z: 1, r: 0 };
function applyCam(g, c, xf) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.translate(W / 2, H / 2); g.rotate(c.r * D); g.scale(c.z, c.z); g.translate(-c.x, -c.y);
  if (xf) { g.translate(W / 2, H / 2); g.rotate((xf.rot ?? 0) * D); g.translate(-W / 2 + (xf.dx ?? 0), -H / 2 + (xf.dy ?? 0)); }
}

// ———————————————————— 内容 ————————————————————
// 页面坐标 1920×1080。先烤成贴图（静态的），每帧按镜头贴上去。
const memo = new Map();
function baked(key, fn, s = 1) {
  if (memo.has(key)) return memo.get(key);
  const c = createCanvas(W * s, H * s), x = c.getContext('2d'); x.scale(s, s); fn(x); memo.set(key, c); return c;
}
const paperBg = (g, col = P.ORIG) => { g.fillStyle = col; g.fillRect(-W, -H, W * 3, H * 3); };

// 封面上的照片卡：一张从杂志上剪下来的网点照片，四角贴胶带
function photoCard(g, cx, cy, w, h, rot, pitch = 8) {
  g.save(); g.translate(cx, cy); g.rotate(rot * D);
  g.save(); g.translate(6, 10); g.fillStyle = 'rgba(0,0,0,.3)'; g.filter = 'blur(7px)'; g.fillRect(-w / 2, -h / 2, w, h); g.restore();
  g.fillStyle = '#ECE8DE'; g.fillRect(-w / 2, -h / 2, w, h);
  g.save(); g.beginPath(); g.rect(-w / 2 + 14, -h / 2 + 14, w - 28, h - 28); g.clip();
  g.translate(-w / 2 + 14, -h / 2 + 14); const s = (w - 28) / 1300; g.scale(s, s); g.translate(-260, -40);
  halftone(g, { pitch: pitch / s, ink: '#1a1a1a', box: [260, 40, 260 + 1300, 40 + 1300 * (h - 28) / (w - 28)] });
  g.restore();
  tape(g, -w / 2 + 20, -h / 2 + 6, 150, 46, -38, 1, 'rgba(242,214,75,.75)', 5);
  tape(g, w / 2 - 20, h / 2 - 6, 150, 46, -38, 1, 'rgba(242,214,75,.75)', 6);
  g.restore();
}
function coverBase(g) {
  paperBg(g);
  chip(g, '朋', 300, 320, { font: 'Hei', size: 380, bg: '#fff', rot: -4, shadow: 9, seed: 3 });
  chip(g, '克', 720, 350, { font: 'HY', size: 410, rot: 3 });
  ransom(g, [['P', { font: 'Anton', fg: '#fff', bg: P.INK, rot: -5 }], ['U', { font: 'Abril', bg: '#fff', rot: 4, dy: 10 }], ['N', { font: 'Slab', bg: '#FFE21A', rot: -3, dy: -6 }],
    ['K', { font: 'Arch', fg: '#fff', bg: P.INK, rot: 6, dy: 8 }]], 70, 790, { size: 170, shadow: 6, gap: 4 });
  g.save(); g.translate(960, 610); g.rotate(-8 * D); g.font = '160px Bang'; g.fillStyle = P.INK; g.textAlign = 'center'; g.fillText('XEROX', 0, 0);
  g.font = '100px Arch'; g.fillText('★', -270, -14); g.restore();
  photoCard(g, 1500, 400, 600, 450, 4);
  g.font = '30px Type'; g.fillStyle = '#1b1b1b'; g.textAlign = 'left';
  ['a zine is a cheap little magazine.', 'cut it. paste it. copy it.'].forEach((s, i) => g.fillText(s, 1180, 770 + i * 40));
  g.font = '30px HeiB'; g.fillText('剪下来，贴上去，复印。', 1180, 852);
  g.save(); g.translate(560, 960); g.rotate(-3 * D); g.font = '66px Cang'; g.fillStyle = '#1b1b1b'; g.fillText('剪刀 + 胶水 + 复印机', 0, 0); g.restore();
  g.font = '28px Arch'; g.fillStyle = P.INK; g.fillText('NO FUTURE? NO PROBLEM. MAKE A ZINE.', 70, 1050);
}
// 封面后贴上去的三样（u：0..1 动画进度；1 = 贴好了）
const TAPE1 = { x: 1230, y: 96, w: 700, h: 96, rot: -2 };
function itemTape(g, u) {
  tape(g, TAPE1.x, TAPE1.y, TAPE1.w, TAPE1.h, TAPE1.rot, u, 'rgba(255,226,26,.9)', 9);
  if (u <= 0) return;
  g.save(); g.translate(TAPE1.x, TAPE1.y); g.rotate(TAPE1.rot * D); g.beginPath(); g.rect(-TAPE1.w / 2, -60, TAPE1.w * u, 120); g.clip();
  g.font = '58px Hei'; g.fillStyle = P.INK; g.textAlign = 'center'; g.fillText('复印一次，糊一层', 0, 20); g.restore();
}
function itemSticker(g, u) {         // u = 落地后的帧数（<0 还没来）
  if (u < -6) return;
  g.save(); g.globalAlpha = clamp((u + 6) / 4);
  const s = u < 0 ? lerp(1.5, 1, eo((u + 6) / 6)) : 1 + .05 * Math.exp(-u / 4) * Math.cos(u * .9), rot = 14 - 22 * settle(u + 6, 5);
  g.save(); g.translate(1100, 300); g.rotate(rot * D); g.scale(s, s);
  const sh = u < 0 ? 26 * (1 - eo((u + 6) / 6)) + 6 : 6;
  g.save(); g.translate(sh * .5, sh); g.fillStyle = 'rgba(0,0,0,.3)'; g.filter = `blur(${sh * .7}px)`; g.beginPath(); g.arc(0, 0, 112, 0, Math.PI * 2); g.fill(); g.restore();
  const p = new Path2D(); for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2, r = i % 2 ? 98 : 118; i ? p.lineTo(Math.cos(a) * r, Math.sin(a) * r) : p.moveTo(Math.cos(a) * r, Math.sin(a) * r); } p.closePath();
  g.fillStyle = P.INK; g.fill(p); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '56px Hei'; g.fillText('第1期', 0, 12); g.font = '22px Mono'; g.fillText('NO.01', 0, 50);
  g.restore(); g.restore();
}
const ARROW = [[1560, 960], [1640, 930], [1700, 860], [1720, 760], [1712, 668], [1680, 700], [1712, 668], [1738, 706]];
function itemMarker(g, u) {
  if (u <= 0) return;
  const a = clamp(u / .55), b = clamp((u - .55) / .45);
  g.save(); g.translate(1250, 1000); g.rotate(-6 * D); g.beginPath(); g.rect(-20, -140, 300 * a + 1, 200); g.clip();
  g.font = '120px Mark'; g.fillStyle = P.RED; g.textAlign = 'left'; g.fillText('1976', 0, 0); g.restore();
  scrawl(g, ARROW, b, P.RED, 12);
}
// 01 阈值：一张灰照片铺满。照片本身就是内容
function photoFull(g) { g.drawImage(photo().canvas, 0, 0); }

// 02 网点：以 PC 为中心放大 s 倍（复印机的放大键）
let PC = null;
function pcenter() {      // 找一个半灰的网点当“最后吞掉画面”的那颗
  if (PC) return PC;
  const ph = photo(), c = Math.SQRT1_2, pitch = 14; let best = null;
  for (let iu = 20; iu < 140; iu++) for (let iv = -60; iv < 30; iv++) {
    const u = iu * pitch, v = iv * pitch, x = (u - v) * c, y = (u + v) * c;
    if (x < 640 || x > 820 || y < 420 || y > 560) continue;
    const l = ph.lum(x, y), sc = Math.abs(l - .72);
    if (!best || sc < best.sc) best = { x, y, sc, l };
  }
  PC = best; return PC;
}
function htLayer(s, wob, gain, seed) {
  return (g, cam) => {
    paperBg(g, '#fff');
    const pc = pcenter();
    g.save(); g.translate(pc.x, pc.y); g.scale(s, s); g.translate(-pc.x, -pc.y);
    const z = cam.z * s, hw = W / 2 / z + 40, hh = H / 2 / z + 40, cx = pc.x + (cam.x - pc.x) / s, cy = pc.y + (cam.y - pc.y) / s;
    halftone(g, { pitch: 14, wob, gain, seed, ink: '#000', box: [cx - hw * 1.2, cy - hh * 1.2, cx + hw * 1.2, cy + hh * 1.2] });
    g.restore();
  };
}

// 03 代数：一张 zine 内页
function zinePage(g) {
  paperBg(g, '#fff');
  ransom(g, [['N', { font: 'Anton', fg: '#fff', bg: P.INK, rot: -4 }], ['O', { font: 'Abril', bg: '#fff', rot: 3 }], [' ', {}], ['F', { font: 'Frak', bg: '#fff', rot: -2 }],
    ['U', { font: 'Slab', fg: '#fff', bg: P.INK, rot: 5 }], ['T', { font: 'Rye', bg: '#fff', rot: -5 }], ['U', { font: 'Arch', bg: '#fff', rot: 2 }], ['R', { font: 'Bang', fg: '#fff', bg: P.INK, rot: -3 }], ['E', { font: 'Abril', bg: '#fff', rot: 4 }]],
  70, 175, { size: 130, shadow: 5, gap: 2 });
  g.font = '250px HY'; g.fillStyle = P.INK; g.textAlign = 'left'; g.fillText('没有未来', 64, 520);
  chip(g, '但有复印机。', 400, 650, { font: 'Hei', size: 84, fg: '#fff', bg: P.INK, rot: -2 });
  g.strokeStyle = P.INK; g.lineWidth = 1.6;
  for (let i = 0; i < 2; i++) { g.beginPath(); g.moveTo(70, 735 + i * 7); g.lineTo(1040, 735 + i * 7); g.stroke(); }
  g.font = '26px Type'; g.fillStyle = '#1b1b1b';
  ['no money, no label, no permission.', 'one copy shop. one stapler. one night.', 'print 50. hand them out at the door.', 'if it gets blurry, that is the point.']
    .forEach((s, i) => g.fillText(s, 70, 790 + i * 36));
  g.font = '26px HeiB'; ['没钱，没厂牌，不用谁批准。', '一家复印店，一把订书枪，一个晚上。', '印五十张，门口发完。', '糊了？糊才对。'].forEach((s, i) => g.fillText(s, 600, 790 + i * 36));
  photoCard(g, 1480, 430, 720, 560, -2, 10);
  g.font = '150px Arch'; g.fillStyle = P.INK; g.fillText('07', 1650, 1030);
  g.font = '24px Mono'; g.fillText('ZINE · 第 7 页', 1180, 1000);
}

// 04 演出海报：今晚不睡
function flyer(g) {
  paperBg(g, '#fff');
  ransom(g, [['B', { font: 'Anton', fg: '#fff', bg: P.INK, rot: -3 }], ['A', { font: 'Abril', bg: '#fff', rot: 4 }], ['S', { font: 'Slab', bg: '#fff', rot: -4 }], ['E', { font: 'Frak', fg: '#fff', bg: P.INK, rot: 3 }],
    ['M', { font: 'Arch', bg: '#fff', rot: -2 }], ['E', { font: 'Rye', bg: '#fff', rot: 5 }], ['N', { font: 'Bang', fg: '#fff', bg: P.INK, rot: -4 }], ['T', { font: 'Anton', bg: '#fff', rot: 3 }]], 64, 112, { size: 92, shadow: 4, gap: 2 });
  g.font = '64px Hei'; g.fillStyle = P.INK; g.textAlign = 'left'; g.fillText('地下室', 880, 140);
  g.font = '300px Hei'; g.fillText('今晚', 56, 500);
  g.fillText('不', 56, 820); chip(g, '睡', 506, 712, { font: 'Hei', size: 300, fg: '#fff', bg: P.INK, rot: 4, pad: 22 });
  g.save(); g.translate(1450, 470); g.rotate(3 * D);
  g.fillStyle = '#ECE8DE'; g.fillRect(-370, -290, 740, 580); g.beginPath(); g.rect(-356, -276, 712, 552); g.clip();
  g.translate(-356, -276); const s = 712 / 1920; g.scale(s, s); halftone(g, { pitch: 11 / s, ink: '#111', box: [0, 0, W, H] }); g.restore();
  g.font = '40px Mono'; g.fillStyle = P.INK; g.fillText('FRI 12.06 · 21:00 — LATE', 64, 940);
  g.font = '44px Hei'; g.fillText('三支乐队 · 一台复印机', 64, 1012);
  chip(g, '买票 ¥10', 1480, 900, { font: 'Hei', size: 92, fg: '#fff', bg: P.INK, rot: -4 });
  g.font = '28px Type'; g.fillText('door 21:00 / bring a friend / no future', 1150, 1030);
}
// 片名海报
function titleSheet(g) {
  paperBg(g, '#fff');
  g.font = '330px Hei'; g.fillStyle = P.INK; g.textAlign = 'left'; g.fillText('朋克', 70, 360);
  chip(g, '复印机', 1270, 250, { font: 'HY', size: 230, fg: '#fff', bg: P.INK, rot: -3, pad: 26 });
  ransom(g, [['P', { font: 'Anton', fg: '#fff', bg: P.INK, rot: -5 }], ['U', { font: 'Abril', bg: '#fff', rot: 4 }], ['N', { font: 'Slab', bg: '#fff', rot: -3 }], ['K', { font: 'Arch', fg: '#fff', bg: P.INK, rot: 6 }],
    [' ', {}], ['X', { font: 'Bang', bg: '#fff', rot: -4 }], ['E', { font: 'Rye', fg: '#fff', bg: P.INK, rot: 3 }], ['R', { font: 'Arch', bg: '#fff', rot: -2 }], ['O', { font: 'Abril', fg: '#fff', bg: P.INK, rot: 5 }], ['X', { font: 'Anton', bg: '#fff', rot: -3 }]],
  70, 620, { size: 200, shadow: 5, gap: 4 });
  g.font = '64px Hei'; g.fillText('复印一次，糊一层。', 76, 900);
  g.font = '34px Arch'; g.fillText('NO FUTURE? NO PROBLEM. MAKE A ZINE.', 76, 990);
  g.save(); g.translate(1640, 780); g.rotate(-8 * D); g.font = '130px Mark'; g.fillStyle = P.INK; g.textAlign = 'center'; g.fillText('1976', 0, 0); g.restore();
}

// ———————————————————— 复印成贴图（墙上的海报用；与现场渲染同一条管线，换过去像素一致） ————————————————————
const xtex = new Map();
function xeroxTexture(key, draw, q, paper) {
  if (xtex.has(key)) return xtex.get(key);
  const c = createCanvas(W, H), x = c.getContext('2d');
  compose(x, [{ sheet: { key, mode: 'x', paper, q: () => q, draw: () => draw, cam: () => ID }, x0: 0, x1: W, age: null }], 0);
  xtex.set(key, c); return c;
}
const FLY = () => xeroxTexture('fly-pink', flyer, gen(1), P.PINK);

// ———————————————————— 墙 ————————————————————
const WALL = [ // 墙上后来拍上去的复印件：[拍, 纸色, 名字, cx, cy, 旋转, 缩放, 内容]
  [40, P.YELLOW, 'fly-yellow', -280, -360, -5, .8, flyer],
  [41, P.WHITE, 'fly-white', 2230, -300, 4, .8, flyer],
  [42, P.GREEN, 'fly-green', -230, 1430, 3, .8, flyer],
  [43, P.PINK, 'zine-pink', 2180, 1420, -4, .8, zinePage],
];
const TITLE = { b: 44, cx: 990, cy: 570, rot: -3, s: 1.06 };
const OLD = (() => { const r = rng(77), o = []; for (let i = 0; i < 46; i++) o.push({ x: -2000 + r() * 6000, y: -1300 + r() * 3600, w: 300 + r() * 700, h: 200 + r() * 500, rot: (r() - .5) * 20, c: ['#d9d3c4', '#e8c3d0', '#ece1a0', '#c9d9bf', '#efece4'][Math.floor(r() * 5)], s: r() }); return o; })();
function wallBg(g) {
  g.fillStyle = '#3e3c39'; g.fillRect(-2600, -1800, 7200, 4800);
  for (const o of OLD) {                     // 撕剩下的旧海报
    g.save(); g.translate(o.x, o.y); g.rotate(o.rot * D);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-o.w / 2 + 5, -o.h / 2 + 8, o.w, o.h);
    g.fillStyle = o.c; g.beginPath(); const r = rng(Math.floor(o.s * 1e6));
    g.moveTo(-o.w / 2, -o.h / 2); for (let i = 0; i <= 10; i++) g.lineTo(-o.w / 2 + o.w * i / 10, -o.h / 2 + (r() - .3) * 30);
    for (let i = 0; i <= 8; i++) g.lineTo(o.w / 2 - r() * 40 * (i % 2), -o.h / 2 + o.h * i / 8);
    for (let i = 10; i >= 0; i--) g.lineTo(-o.w / 2 + o.w * i / 10, o.h / 2 - r() * 60);
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(20,20,20,.75)'; for (let k = 0; k < 4; k++) g.fillRect(-o.w / 2 + 30 + r() * (o.w - 120), -o.h / 2 + 30 + r() * (o.h - 90), 40 + r() * 200, 14 + r() * 40);
    staple(g, -o.w / 2 + 30, -o.h / 2 + 30, r() * 30, 1.2, '#6d6f73');
    g.restore();
  }
  const bk = baked('wallnoise', x => { const r = rng(5); for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${r() < .5 ? '0,0,0' : '255,255,255'},${.05 + r() * .08})`; x.fillRect(r() * W, r() * H, 2 + r() * 8, 2 + r() * 8); } });
  g.drawImage(bk, -2600, -1800, 7200, 4800);
}
// 一张贴到墙上的纸：u = 落地后的帧数（<0 还在飞）
function slapSheet(g, tex, cx, cy, rot, s, u, staples) {
  if (u < -12) return;
  const a = u < 0 ? eo((u + 12) / 12) : 1, sc = s * (u < 0 ? lerp(1.5, 1, a) : 1 + .03 * Math.exp(-u / 4) * Math.cos(u * .8)), lift = u < 0 ? 1 - a : 0;
  const rr = rot + (u < 0 ? 12 * (1 - a) : 2.5 * Math.exp(-u / 5) * Math.cos(u * .7));
  const ox = cx - 960, oy = cy - 540, ol = Math.hypot(ox, oy) || 1, fly = 2600 * (1 - a) * (1 - a);     // 从画外、离中心更远的方向飞进来
  g.save(); g.translate(cx + ox / ol * fly, cy + oy / ol * fly); g.rotate(rr * D); g.scale(sc, sc);
  const sh = 10 + 60 * lift;
  g.save(); g.translate(sh * .4, sh * .8); g.fillStyle = `rgba(0,0,0,${.45 - .2 * lift})`; g.filter = `blur(${6 + sh * .4}px)`; g.fillRect(-W / 2, -H / 2, W, H); g.restore();
  g.drawImage(tex, -W / 2, -H / 2);
  for (const [sx, sy, sa, su] of staples) if (u >= su) { const k = u - su; staple(g, sx - W / 2, sy - H / 2, sa, 2.2 * (k < 3 ? lerp(1.25, 1, k / 3) : 1)); }
  g.restore();
}
const CORNER = [[70, 66, -8, 4], [W - 70, 66, 6, 7], [70, H - 66, 4, 10], [W - 70, H - 66, -6, 13]];
function wallAt(t) {
  return g => {
    wallBg(g);
    slapSheet(g, FLY(), W / 2, H / 2, 0, 1, 999, CORNER.map(([a, b, c, d]) => [a, b, c, -1]));
    for (const [b, col, key, cx, cy, rot, s, dr] of WALL) slapSheet(g, xeroxTexture(key, dr, gen(b === 43 ? 3 : 1), col), cx, cy, rot, s, t - B(b), CORNER);
    slapSheet(g, xeroxTexture('title', titleSheet, gen(1), P.PINK), TITLE.cx, TITLE.cy, TITLE.rot, TITLE.s, t - B(TITLE.b), CORNER);
  };
}

// ———————————————————— 镜头曲线 ————————————————————
function camCover(t) { const u = prog(t, B(-1), B(8.2)); return { x: lerp(960, 1010, u), y: lerp(540, 520, u), z: 1.02 + .05 * eio(u), r: lerp(-.6, .4, u) }; }
function camPhoto(t) { const u = prog(t, B(7), B(16)); return { x: lerp(960, 900, eio(u)), y: lerp(540, 470, eio(u)), z: lerp(1.0, 1.09, eio(u)), r: lerp(.5, -.5, u) }; }
function camHT(t) {   // 网点：每次放大之间也慢慢推；最后钻进一颗点
  const pc = pcenter(), u = prog(t, B(15.5), B(22.4));
  const dive = prog(t, B(22.3), B(24.1)), dz = Math.exp(Math.log(30) * ei(dive) + .2 * dive);
  const z0 = lerp(1, 1.18, u);
  return { x: lerp(lerp(960, pc.x, eio(u)), pc.x, dive), y: lerp(lerp(540, pc.y, eio(u)), pc.y, dive), z: z0 * dz, r: lerp(-.4, .3, u) };
}
function camZine(t) { const u = prog(t, B(24), B(36.4)); return { x: 960, y: 540, z: lerp(1.0, 1.05, u), r: lerp(.3, -.3, u) }; }
function camFlyer(t) { const u = prog(t, B(35.5), B(39)); return { x: 960, y: 540, z: lerp(1.0, 1.0, u), r: 0 }; }
function camWall(t) {
  const a = eio(prog(t, B(39), B(42.2))), b = eio(prog(t, B(46.4), B(50.6)));
  const z = Math.exp(lerp(0, Math.log(.36), a)) * Math.exp(lerp(0, Math.log(2.25), b));
  return { x: lerp(lerp(960, 980, a), TITLE.cx + 20, b), y: lerp(lerp(540, 560, a), TITLE.cy + 90, b), z, r: lerp(0, -1.4, a) + lerp(0, 1.0, b) };
}

// ———————————————————— 纸和扫描 ————————————————————
const knob = t => { // 01 阈值的旋钮
  let v = .5; v = lerp(v, .17, eio(prog(t, B(10), B(11.6)))); v = lerp(v, .84, eio(prog(t, B(11.7), B(13.3)))); v = lerp(v, .5, eio(prog(t, B(13.4), B(14.8)))); return v;
};
const S = (key, mode, paper, q, draw, cam) => ({ key, mode, paper, q: typeof q === 'function' ? q : () => q, draw, cam });
const GENS = [2, 3, 4, 6, 8, 12, 16, 24, 32, 64];
const ZOOMS = [1, 2, 4, 8];
export const SHEETS = [
  S('cover-raw', 'raw', P.ORIG, null, () => coverBase, camCover),
  S('cover-1', 'x', P.PINK, gen(1), () => coverBase, camCover),
  S('cover-2', 'x', P.PINK, gen(2), () => g => { coverBase(g); itemTape(g, 1); itemSticker(g, 99); itemMarker(g, 1); }, camCover),
  S('photo', 'x', P.YELLOW, t => ({ ...gen(1), th: knob(t), nm: .16, n: .12 }), () => photoFull, camPhoto),
  ...ZOOMS.map((z, i) => S('ht-' + z, 'x', P.GREEN, { ...gen(1 + i), rot: 0, dx: 0, dy: 0, blur: .8 + i * .5, th: .5 + i * .02 }, cam => htLayer(z, i * .18, 1 + i * .04, i), camHT)),
  S('zine-1', 'x', P.WHITE, gen(1), () => zinePage, camZine),
  ...GENS.map(g => S('zine-' + g, 'x', P.WHITE, gen(g), () => zinePage, camZine)),
  S('fly-1', 'x', P.PINK, gen(1), () => flyer, camFlyer),
  { ...S('wall', 'raw', P.ORIG, null, (cam, t) => wallAt(t), camWall), notex: true },
  S('wall-x', 'x', P.PINK, { ...gen(1), th: .36, n: .08, nm: .07, nl: .02, speck: .0004, blur: .6 }, () => wallAt(B(46)), camWall),
];
// 每一遍扫描：[开始拍, 用几拍]；d = 0 表示不扫，直接换（同一张纸换个画法，像素一致）
export const PASSES = [[-1.1, 2], [5.75, 1.5], [8.1, 1.6], [15.6, 1.5], [17.4, 1.3], [19.2, 1.3], [21.0, 1.3], [24.0, 1.5],
  ...GENS.map((g, i) => [26 + i, .85]), [36, 1.3], [39, 0], [45, 1.7]];
if (PASSES.length !== SHEETS.length - 1) throw new Error('PASSES 和 SHEETS 对不上');
const passT = k => { const [b, d] = PASSES[k], t0 = B(b), dur = d * FPB; return { t0, dur, v: (W + 2 * PAD) / Math.max(dur, 1e-6), d }; };

// 现在屏幕上是哪一张（或者哪两张、灯管在哪）
function sheetAt(t) {
  let k = 0; while (k < PASSES.length && B(PASSES[k][0]) <= t) k++;
  if (k === 0) return { layers: [{ sheet: SHEETS[0], x0: 0, x1: W, age: null }], xb: null };
  const p = passT(k - 1), xb = p.d ? -PAD + (t - p.t0) * p.v : W + PAD;
  const age = p.d ? (x => t - (p.t0 + (x + PAD) / p.v)) : null;
  if (xb >= W + 480 || !p.d) return { layers: [{ sheet: SHEETS[k], x0: 0, x1: W, age }], xb: null, k, p };
  return { layers: [{ sheet: SHEETS[k], x0: 0, x1: clamp(Math.ceil(xb), 0, W), age }, { sheet: SHEETS[k - 1], x0: clamp(Math.ceil(xb), 0, W), x1: W, age: null }], xb, k, p };
}

// ———————————————————— 合成：内容 → 模糊 → 每个像素过一遍复印 ————————————————————
const CC = [createCanvas(W, H), createCanvas(W, H)], BC = [createCanvas(W, H), createCanvas(W, H)];
const OUT = createCanvas(W, H), OX = OUT.getContext('2d'), OIM = OX.createImageData(W, H);
const INK = rgb(P.INK);
function compose(ctx, layers, t) {
  const od = OIM.data;
  layers.forEach((L, li) => {
    if (L.x1 <= L.x0) return;
    const sh = L.sheet, cam = sh.cam(t), q = sh.q(t), cx = CC[li].getContext('2d');
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.fillStyle = sh.paper === P.ORIG ? P.ORIG : '#fff'; cx.fillRect(0, 0, W, H);
    applyCam(cx, cam, sh.mode === 'x' ? q : null);
    const draw = sh.draw(cam, t);
    const isTex = typeof draw !== 'function';
    if (isTex) cx.drawImage(draw, 0, 0); else draw(cx, cam);
    cx.setTransform(1, 0, 0, 1, 0, 0);
    let src;
    if (sh.mode === 'x') {
      const bx = BC[li].getContext('2d'); bx.setTransform(1, 0, 0, 1, 0, 0); bx.filter = `blur(${(q.blur * cam.z).toFixed(2)}px)`; bx.drawImage(CC[li], 0, 0); bx.filter = 'none';
      src = bx.getImageData(L.x0, 0, L.x1 - L.x0, H).data;
    } else src = cx.getImageData(L.x0, 0, L.x1 - L.x0, H).data;
    const pr = rgb(sh.paper), w = L.x1 - L.x0;
    const qq = sh.mode === 'x' ? { ...q, sh: (q.g ?? 1) * 7919 * 13, shm: (q.g ?? 1) * 104729 } : null;
    const dev = new Float32Array(w); for (let x = 0; x < w; x++) { const a = L.age ? L.age(L.x0 + x) : 999; dev[x] = a < 60 ? 1 - .6 * Math.exp(-Math.max(a, 0) / 5) : 1; }
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < w; x++) {
        const s = (y * w + x) * 4, i = y * W + x + L.x0, o = i * 4;
        const tex = sh.notex ? 1 : .955 + .045 * NM[i] - .02 * NF[i];
        if (qq) {
          const Lm = (src[s] * .3 + src[s + 1] * .59 + src[s + 2] * .11) / 255;
          const ink = xeroxPixel(src, null, i, Lm, qq) * dev[x];
          od[o] = (pr[0] * tex) * (1 - ink) + INK[0] * ink; od[o + 1] = (pr[1] * tex) * (1 - ink) + INK[1] * ink; od[o + 2] = (pr[2] * tex) * (1 - ink) + INK[2] * ink;
        } else { od[o] = src[s] * tex; od[o + 1] = src[s + 1] * tex; od[o + 2] = src[s + 2] * tex; }
        od[o + 3] = 255;
      }
    }
  });
  OX.putImageData(OIM, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(OUT, 0, 0);
}

// ———————————————————— 新贴上去的东西（彩色、带影子；被哪一遍扫描压平） ————————————————————
// [出现的帧, 被第几遍扫描压平（null = 不压）, 画法(g, t), 用哪个镜头]
const FRESH = [
  [B(1.5), 1, (g, t) => itemTape(g, eo(prog(t, B(1.5), B(2.4)))), camCover],
  [B(3) - 6, 1, (g, t) => itemSticker(g, t - B(3)), camCover],
  [B(4), 1, (g, t) => itemMarker(g, prog(t, B(4), B(5.2))), camCover],
  [B(6.8), 2, (g, t) => { // 一张灰照片从右边滑进来，铺满
    const u = prog(t, B(6.8), B(8.0)), e = u < 1 ? eo(u) : 1, k = t - B(8.0);
    const x = lerp(W * 1.08, 0, e) + (k > 0 ? -10 * Math.exp(-k / 5) * Math.sin(k * .6) : 0), r = lerp(7, 0, e);
    g.save(); g.translate(x + W / 2, H / 2); g.rotate(r * D); g.translate(-W / 2, -H / 2);
    g.save(); g.translate(-22, 10); g.fillStyle = 'rgba(0,0,0,.5)'; g.filter = 'blur(20px)'; g.fillRect(0, 0, W + 60, H); g.restore();
    g.fillStyle = '#f3f1ea'; g.fillRect(-14, -14, W + 28, H + 28); g.drawImage(photo().canvas, 0, 0); g.restore();
  }, camPhoto],
  ...CORNER.map(([x, y, a, d], i) => [B(37.6) + i * FPB * .5 - 3, null, (g, t) => { const k = t - (B(37.6) + i * FPB * .5); if (k < -3) return; staple(g, x, y, a, 2.2 * (k < 3 ? lerp(1.25, 1, clamp(k / 3)) : 1)); }, camFlyer]),
];
function drawFresh(ctx, t, st) {
  for (const [f0, burn, draw, cam] of FRESH) {
    if (t < f0) continue;
    if (burn != null && st.k !== undefined) {
      if (st.k > burn + 1) continue;
      if (st.k === burn + 1 && st.xb == null) continue;
    }
    if (burn != null && st.k === undefined) { /* 第一遍扫之前 */ }
    if (st.k != null && st.k > 22 && cam === camFlyer) continue;            // 墙上那一段，钉子画在墙里
    ctx.save();
    if (burn != null && st.k === burn + 1 && st.xb != null) { ctx.beginPath(); ctx.rect(st.xb, 0, W, H); ctx.clip(); }
    applyCam(ctx, cam(t)); draw(ctx, t); ctx.restore();
  }
}

// ———————————————————— 灯管 ————————————————————
function drawBar(ctx, xb, v) {
  const fade = clamp((xb + PAD) / 160) * clamp((W + 470 - xb) / 200);   // 进场、出场都慢慢亮 / 灭
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = fade;
  ctx.globalCompositeOperation = 'screen';
  const tr = ctx.createLinearGradient(xb - 420, 0, xb, 0); tr.addColorStop(0, 'rgba(210,255,230,0)'); tr.addColorStop(.7, 'rgba(210,255,230,.10)'); tr.addColorStop(1, 'rgba(225,255,238,.45)');
  ctx.fillStyle = tr; ctx.fillRect(xb - 420, 0, 420, H);
  const ld = ctx.createLinearGradient(xb, 0, xb + 160, 0); ld.addColorStop(0, 'rgba(225,255,238,.5)'); ld.addColorStop(1, 'rgba(210,255,230,0)');
  ctx.fillStyle = ld; ctx.fillRect(xb, 0, 160, H);
  ctx.fillStyle = 'rgba(230,255,240,.05)'; ctx.fillRect(0, 0, W, H);
  ctx.filter = 'blur(10px)'; ctx.fillStyle = 'rgba(235,255,244,.95)'; ctx.fillRect(xb - 16, 0, 32, H); ctx.filter = 'none';
  ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(xb - 3, 0, 6, H);
  ctx.restore();
}

// ———————————————————— 屏幕上的字（HUD） ————————————————————
// 标签机打出来的黑胶条：一个字一个字出来
function dymo(ctx, text, x, y, f0, t, o = {}) {
  const size = o.size ?? 38, n = Array.from(text).length, rate = o.rate ?? 2.2, shown = clamp(Math.floor((t - f0) / rate) + 1, 0, n);
  if (t < f0) return;
  const out = o.out != null ? eio(prog(t, o.out, o.out + 14)) : 0;
  ctx.save(); ctx.translate(x - out * 900, y); ctx.rotate((o.rot ?? -1.2) * D);
  ctx.font = `${size}px ${o.font ?? 'Hei'}`;
  const full = ctx.measureText(text).width, part = ctx.measureText(Array.from(text).slice(0, shown).join('')).width, h = size * 1.5, pad = size * .45;
  const w = part + pad * 2;
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(4, 6, w, h);
  ctx.fillStyle = o.bg ?? '#141414'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(0, 2, w, 3);
  ctx.fillStyle = o.fg ?? '#F4F4F0'; ctx.textBaseline = 'middle';
  ctx.fillText(Array.from(text).slice(0, shown).join(''), pad, h / 2 + 2);
  ctx.restore();
}
// 一张剪下来的字条“啪”地贴上：从 1.35 倍落到 1，带个小过冲
function slip(ctx, text, x, y, f0, t, o = {}) {
  if (t < f0 - 6) return;
  const u = t - f0, a = u < 0 ? eo((u + 6) / 6) : 1, s = u < 0 ? lerp(1.35, 1, a) : 1 + .04 * Math.exp(-u / 4) * Math.cos(u * .9);
  const out = o.out != null ? eio(prog(t, o.out, o.out + 14)) : 0;
  ctx.save(); ctx.translate(x - out * 1400, y); ctx.rotate(((o.rot ?? -2) + (u < 0 ? 6 * (1 - a) : 0)) * D); ctx.scale(s, s); ctx.globalAlpha = clamp((u + 6) / 3);
  chip(ctx, text, 0, 0, { font: o.font ?? 'Hei', size: o.size ?? 72, fg: o.fg ?? P.INK, bg: o.bg ?? '#fff', shadow: 6 + 20 * (1 - a), seed: o.seed ?? 4 });
  ctx.restore();
}
function counter(ctx, g, t, x = W - 64, y = 52) {
  ctx.save(); ctx.translate(x, y);
  ctx.font = '22px Mono'; const lab = 'GEN'; ctx.font = '50px Hei'; const s = `第 ${g} 代`, w = ctx.measureText(s).width + 40;
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(-w + 4, 6, w, 76);
  ctx.fillStyle = '#141414'; ctx.fillRect(-w, 0, w, 76);
  ctx.fillStyle = '#F4F4F0'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(s, -20, 40);
  ctx.restore();
}
function readout(ctx, lines, x, y, f0, t, o = {}) {        // 复印机面板：等宽小字
  if (t < f0 || (o.out != null && t > o.out + 14)) return;
  const out = o.out != null ? eio(prog(t, o.out, o.out + 14)) : 0, a = eo(prog(t, f0, f0 + 10));
  ctx.save(); ctx.translate(x + out * (x < W / 2 ? -1400 : 1400), y + (1 - a) * 30); ctx.globalAlpha = a;
  ctx.font = `${o.size ?? 30}px Mono`; const w = Math.max(...lines.map(s => ctx.measureText(s).width)) + 44, lh = (o.size ?? 30) * 1.45;
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(4, 6, w, lines.length * lh + 26);
  ctx.fillStyle = '#141414'; ctx.fillRect(0, 0, w, lines.length * lh + 26);
  ctx.fillStyle = '#F4F4F0'; ctx.textBaseline = 'top'; lines.forEach((s, i) => ctx.fillText(s, 22, 14 + i * lh));
  ctx.restore();
}
function curGen(t) {
  let k = 0; while (k < PASSES.length && B(PASSES[k][0]) + PASSES[k][1] * FPB * .5 <= t) k++;
  if (k <= 2) return k <= 1 ? 1 : 2;
  if (k <= 3) return 1;                // 新照片，第 1 代
  if (k <= 7) return k - 2;            // 网点每放大一次 +1
  if (k === 8) return 1;
  if (k <= 18) return GENS[k - 9];
  return 1;
}
function hud(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = curGen(t);
  if (t < B(44.2)) {
    const pop = (() => { let k = 0; while (k < PASSES.length && B(PASSES[k][0]) + PASSES[k][1] * FPB * .5 <= t) k++; if (!k) return 0; const f = B(PASSES[k - 1][0]) + PASSES[k - 1][1] * FPB * .5; return Math.exp(-(t - f) / 5) * (t >= f); })();
    ctx.save(); ctx.translate(W - 64, 52); ctx.scale(1 + .12 * pop, 1 + .12 * pop); ctx.translate(-(W - 64), -52); counter(ctx, g, t); ctx.restore();
  }
  // 01 阈值
  dymo(ctx, '01 阈值 THRESHOLD', 60, 46, B(9.2), t, { out: B(15.4) });
  slip(ctx, '灰色不存在', 330, 820, B(10), t, { size: 96, out: B(15.2), rot: -3 });
  slip(ctx, '只剩黑和纸', 300, 950, B(10.5), t, { size: 66, fg: '#fff', bg: P.INK, out: B(15.25), rot: 2, seed: 7 });
  if (t > B(9.6) && t < B(15.6) + 14) {
    const v = knob(t), out = eio(prog(t, B(15.3), B(15.3) + 14)), a = eo(prog(t, B(9.6), B(9.6) + 10));
    ctx.save(); ctx.translate(1500 + out * 700, 880 + (1 - a) * 30); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(4, 6, 380, 150); ctx.fillStyle = '#141414'; ctx.fillRect(0, 0, 380, 150);
    ctx.fillStyle = '#F4F4F0'; ctx.font = '28px Hei'; ctx.fillText('阈值', 24, 46); ctx.font = '84px Mono'; ctx.textAlign = 'right'; ctx.fillText(v.toFixed(2), 356, 88);
    ctx.fillStyle = '#555'; ctx.fillRect(24, 112, 332, 8); ctx.fillStyle = P.YELLOW; ctx.fillRect(24, 112, 332 * v, 8); ctx.beginPath(); ctx.arc(24 + 332 * v, 116, 14, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // 02 网点
  dymo(ctx, '02 网点 HALFTONE', 60, 46, B(16.3), t, { out: B(23.0) });
  slip(ctx, '放大复印', 300, 830, B(17.6), t, { size: 96, out: B(22.6), rot: -2, seed: 9 });
  slip(ctx, '点就变成了图形', 360, 958, B(18.1), t, { size: 64, fg: '#fff', bg: P.INK, out: B(22.65), rot: 2, seed: 2 });
  {
    let z = 100; for (let i = 1; i < ZOOMS.length; i++) if (t >= B(PASSES[3 + i][0]) + PASSES[3 + i][1] * FPB * .5) z = ZOOMS[i] * 100;
    if (t > B(16.6)) readout(ctx, [`放大 ${String(z).padStart(4, ' ')}%`, '网角 45° · 点距 14'], 1430, 880, B(16.6), t, { size: 40, out: B(22.7) });
  }
  // 03 代数
  dymo(ctx, '03 代数 GENERATIONS', 60, 46, B(25), t, { out: B(36.2) });
  slip(ctx, '复印一次，糊一层', 520, 852, B(27), t, { size: 92, out: B(35.8), rot: -2, seed: 5 });
  slip(ctx, '3 代以内最好看', 420, 975, B(31), t, { size: 66, fg: '#fff', bg: P.INK, out: B(35.85), rot: 1.5, seed: 8 });
  // 04 纸色
  dymo(ctx, '04 纸色 PAPER', 60, 46, B(37), t, { out: B(44) });
  slip(ctx, '颜色在纸上，墨只有黑', 620, 975, B(40.6), t, { size: 80, out: B(43.8), rot: -1.5, seed: 6 });
  const sw = [[39.6, P.PINK, '荧光粉 #FF3E9A'], [40.4, P.YELLOW, '柠檬黄 #FFE21A'], [41.4, P.WHITE, '复印白 #F1EEE4'], [42.4, P.GREEN, '荧光绿 #7BE86A'], [43.2, P.INK, '墨 #121012']];
  sw.forEach(([b, col, s], i) => {
    if (t < B(b)) return; const out = eio(prog(t, B(44), B(44) + 14)), a = eo(prog(t, B(b), B(b) + 8));
    ctx.save(); ctx.translate(1460 + out * 600, 150 + i * 92); ctx.globalAlpha = a; ctx.translate((1 - a) * 60, 0);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(4, 6, 400, 72); ctx.fillStyle = '#141414'; ctx.fillRect(0, 0, 400, 72);
    ctx.fillStyle = col; ctx.fillRect(12, 12, 48, 48); ctx.strokeStyle = '#F4F4F0'; ctx.lineWidth = 2; ctx.strokeRect(12, 12, 48, 48);
    ctx.fillStyle = '#F4F4F0'; ctx.font = '30px Hei'; ctx.textBaseline = 'middle'; ctx.fillText(s, 76, 38); ctx.restore();
  });
  // 封面：扫描面板
  readout(ctx, ['扫描 ▶ 原稿 → 第 1 代'], 60, 980, -99, t, { size: 28, out: B(1.2) });
  // 署名
  if (t > B(47.6)) {
    const u = t - B(48);
    const s = u < 0 ? lerp(1.3, 1, eo(clamp((u + 24) / 24))) : 1 + .05 * Math.exp(-u / 4) * Math.cos(u * .9);
    ctx.save(); ctx.translate(W - 640, H - 170); ctx.rotate(-2.5 * D); ctx.scale(s, s); ctx.globalAlpha = clamp((u + 24) / 6);
    dymo(ctx, '观默 @guanmo_ai', 0, 0, B(47.6), t, { size: 54, rot: 0, rate: 1.6 });
    ctx.font = '54px Hei'; const lw = ctx.measureText('观默 @guanmo_ai').width + 54 * .9;
    if (u >= 0) { const k = clamp(u / 3); staple(ctx, 16, 40, 88, 1.6 * lerp(1.3, 1, k)); staple(ctx, lw - 16, 40, 92, 1.6 * lerp(1.3, 1, k)); }
    ctx.restore();
  }
}

// ———————————————————— 一帧 ————————————————————
function prewarm() {   // 墙上的复印件先印好（不能在合成的中途再合成）
  FLY(); for (const [b, col, key, , , , , dr] of WALL) xeroxTexture(key, dr, gen(b === 43 ? 3 : 1), col); xeroxTexture('title', titleSheet, gen(1), P.PINK);
}
export function render(ctx, t) {
  if (t > B(38)) prewarm();
  const st = sheetAt(t);
  compose(ctx, st.layers, t);
  drawFresh(ctx, t, st);
  if (st.xb != null) drawBar(ctx, st.xb, st.p.v);
  // 最后一击：整张往下“咚”一下（只在画面上加一层很轻的压暗）
  hud(ctx, t);
}

// ———————————————————— 给声音用 ————————————————————
export function events() {
  const ev = { fps: FPS, bpm: BPM, off: OFF, end: END, scans: PASSES.filter(p => p[1] > 0).map(([b, d]) => ({ f: B(b), dur: d * FPB })),
    tape: [B(1.5), B(2.4)], sticker: B(3), marker: [B(4), B(5.2)], photo: B(6.8), photoLand: B(8),
    knob: [[B(10), B(11.6)], [B(11.7), B(13.3)], [B(13.4), B(14.8)]], dive: [B(22.3), B(24.1)],
    staples: [...CORNER.map((c, i) => B(37.6) + i * FPB * .5), ...WALL.flatMap(([b]) => CORNER.map(c => B(b) + c[3])), ...CORNER.map(c => B(TITLE.b) + c[3]), B(48), B(48) + 2],
    slaps: [...WALL.map(([b]) => B(b)), B(TITLE.b)],
    text: [], final: B(48) };
  const dy = (s, f0, rate = 2.2) => { for (let i = 0; i < Array.from(s).length; i++) ev.text.push({ f: f0 + i * rate, k: 'key' }); };
  const sl = f => ev.text.push({ f, k: 'slip' });
  dy('01 阈值 THRESHOLD', B(9.2)); sl(B(10)); sl(B(10.5));
  dy('02 网点 HALFTONE', B(16.3)); sl(B(17.6)); sl(B(18.1));
  dy('03 代数 GENERATIONS', B(25)); sl(B(27)); sl(B(31));
  dy('04 纸色 PAPER', B(37)); sl(B(40.6));
  for (const b of [39.6, 40.4, 41.4, 42.4, 43.2]) ev.text.push({ f: B(b), k: 'tick' });
  dy('观默 @guanmo_ai', B(47.6), 1.6);
  for (let i = 0; i < 4; i++) ev.text.push({ f: B(PASSES[3 + i][0]) + PASSES[3 + i][1] * FPB * .5, k: 'tick' });
  ev.text.push({ f: 0, k: 'tick' });
  return ev;
}
