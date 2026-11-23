// 朋克复印机 · 场景（第三版）。
// 一章一个复印机 / zine 自己的动作，换章的转场一次一种、不重复（见 TRANSITIONS，启动时检查）：
//   封面 —扫描→ 复印件 —甩进来盖住→ 01 阈值 —墨淹没、裂成网点→ 02 网点 —钻进一颗点、从笔画里退出来→ 03 代数（出纸口一张张吐出来）
//   —撕开→ 演出海报 —订书枪订上、镜头退到墙上→ 04 纸色 → 片名拍上、订上署名
// 时间轴按拍写：B(拍) → 帧。配乐《Dynamic Motion》实测 126.56 BPM，第 0 拍在 0.392 秒；每 4 拍一个重拍（第 0、4、8… 拍）。
// 曲子的结构：第 14—15 拍鼓退下去，第 16 拍全乐队砸回来（全曲最响），第 28 拍一记重音、之后降一档，第 36 拍收掉，余音到 19 秒。
import { createCanvas, W, H, D, P, clamp, lerp, prog, eio, eo, ei, sstep, settle, hash, rng, rgb, mixHex, photo, halftone, chip, ransom, tape, staple, scrawl, xeroxPixel, NF, NM, Path2D } from './kit.mjs';

export const FPS = 60, BPM = +(process.env.BPM ?? 126.56), FPB = 3600 / BPM, OFF = +(process.env.OFF ?? 23.52);
export const B = b => OFF + b * FPB;
export const END = +(process.env.END ?? 1140);          // 19 秒：第 36 拍（17.46 秒）收掉，余音到 19 秒
const PAD = 260;                                         // 封面那一遍扫描：灯管从画外 PAD 处起步

// 换章的转场：一次一种。加新的之前先看这张表
export const TRANSITIONS = [
  ['封面', '扫描', '灯管扫过，左边变成复印件'],
  ['封面 → 01 阈值', '甩进来盖住', '一张灰照片从右边甩进来，转着落定，盖住封面'],
  ['01 阈值 → 02 网点', '墨淹没，裂成网点', '阈值拧到头，黑从暗处漫满全屏；再从亮处裂开成一颗颗网点'],
  ['02 网点 → 03 代数', '钻进一颗点', '镜头钻进一颗网点；黑屏其实是一个笔画的内部，退出来是 zine 内页'],
  ['03 代数 → 演出海报', '撕开', '第 64 代被从中间撕成两半甩出去，露出下面的海报'],
  ['演出海报 → 04 纸色', '订上墙、拉远', '订书枪四下把海报订住，镜头退出去，原来是墙上的一张'],
];
{ const k = TRANSITIONS.map(x => x[1]); if (new Set(k).size !== k.length) throw new Error('同一支片子里转场重复了：' + k.join(' / ')); }

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
// 片名海报：底版（朋克 / 复印机 / 两行字 / 1976）+ 一排剪贴字 PUNK XEROX，字母一个个拍上去
const TL = [['P', { font: 'Anton', fg: '#fff', bg: P.INK, rot: -5 }], ['U', { font: 'Abril', bg: '#fff', rot: 4 }], ['N', { font: 'Slab', bg: '#fff', rot: -3 }], ['K', { font: 'Arch', fg: '#fff', bg: P.INK, rot: 6 }],
  [' ', {}], ['X', { font: 'Bang', bg: '#fff', rot: -4 }], ['E', { font: 'Rye', fg: '#fff', bg: P.INK, rot: 3 }], ['R', { font: 'Arch', bg: '#fff', rot: -2 }], ['O', { font: 'Abril', fg: '#fff', bg: P.INK, rot: 5 }], ['X', { font: 'Anton', bg: '#fff', rot: -3 }]];
const TLB = { x: 70, y: 620, size: 200, shadow: 5, gap: 4 };
const TLX = (() => { const g = createCanvas(8, 8).getContext('2d'); let cx = TLB.x; return TL.map(([ch, o]) => { g.font = `${TLB.size}px ${o.font ?? 'Hei'}`; const w = g.measureText(ch).width + 2 * TLB.size * .12, x = cx + w / 2; cx += w + TLB.gap; return x; }); })();
const STAMP = TL.map(([ch], i) => i).filter(i => TL[i][0] !== ' ');                 // 要拍的 9 个字母
const stampBeat = k => TITLE.b + .75 + k * .25;                                     // 片名落定后，每 1/4 拍一个
function titleLetter(g, i, o2 = {}) { const [ch, o] = TL[i]; chip(g, ch, TLX[i], TLB.y + (o.dy ?? 0), { size: TLB.size, shadow: TLB.shadow, ...o, ...o2 }); }
function titleSheet(g, n = TL.length) {
  paperBg(g, '#fff');
  g.font = '330px Hei'; g.fillStyle = P.INK; g.textAlign = 'left'; g.fillText('朋克', 70, 360);
  chip(g, '复印机', 1270, 250, { font: 'HY', size: 230, fg: '#fff', bg: P.INK, rot: -3, pad: 26 });
  for (let k = 0; k < n; k++) titleLetter(g, STAMP[k] ?? k);
  g.font = '64px Hei'; g.fillStyle = P.INK; g.textAlign = 'left'; g.fillText('复印一次，糊一层。', 76, 900);
  g.font = '34px Arch'; g.fillText('NO FUTURE? NO PROBLEM. MAKE A ZINE.', 76, 990);
  g.save(); g.translate(1640, 780); g.rotate(-8 * D); g.font = '130px Mark'; g.fillStyle = P.INK; g.textAlign = 'center'; g.fillText('1976', 0, 0); g.restore();
}
const TITLE_TEX = n => xeroxTexture('title-' + n, g => titleSheet(g, n), gen(1), P.PINK);
const toPaper = c => (c === '#fff' ? P.PINK : c);                                     // 复印出来白的地方就是纸色
function titleOver(t) {                                                              // 正在落下的那个字母（落地后换成印好的贴图）
  return g => { STAMP.forEach((i, k) => { const u = t - B(stampBeat(k)); if (u < -5 || u >= 0) return;
    const a = eo((u + 5) / 5), [, o] = TL[i];
    g.save(); g.translate(TLX[i], TLB.y); g.scale(lerp(1.9, 1, a), lerp(1.9, 1, a)); g.translate(-TLX[i], -TLB.y); g.globalAlpha = clamp((u + 5) / 2);
    titleLetter(g, i, { fg: toPaper(o.fg ?? P.INK), bg: o.bg ? toPaper(o.bg) : undefined, rot: (o.rot ?? 0) + 14 * (1 - a), shadow: 5 + 30 * (1 - a) }); g.restore(); }); };
}
const titleN = t => STAMP.filter((i, k) => t >= B(stampBeat(k))).length;

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
  [27.5, P.YELLOW, 'fly-yellow', -280, -360, -5, .8, flyer],
  [28, P.WHITE, 'fly-white', 2230, -300, 4, .8, flyer],
  [28.5, P.GREEN, 'fly-green', -230, 1430, 3, .8, flyer],
  [29, P.PINK, 'zine-pink', 2180, 1420, -4, .8, zinePage],
];
const TITLE = { b: 31, cx: 990, cy: 570, rot: -3, s: 1.06 };
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
function slapSheet(g, tex, cx, cy, rot, s, u, staples, over) {
  if (u < -12) return;
  const a = u < 0 ? eo((u + 12) / 12) : 1, sc = s * (u < 0 ? lerp(1.5, 1, a) : 1 + .03 * Math.exp(-u / 4) * Math.cos(u * .8)), lift = u < 0 ? 1 - a : 0;
  const rr = rot + (u < 0 ? 12 * (1 - a) : 2.5 * Math.exp(-u / 5) * Math.cos(u * .7));
  const ox = cx - 960, oy = cy - 540, ol = Math.hypot(ox, oy) || 1, fly = 2600 * (1 - a) * (1 - a);     // 从画外、离中心更远的方向飞进来
  g.save(); g.translate(cx + ox / ol * fly, cy + oy / ol * fly); g.rotate(rr * D); g.scale(sc, sc);
  const sh = 10 + 60 * lift;
  g.save(); g.translate(sh * .4, sh * .8); g.fillStyle = `rgba(0,0,0,${.45 - .2 * lift})`; g.filter = `blur(${6 + sh * .4}px)`; g.fillRect(-W / 2, -H / 2, W, H); g.restore();
  g.drawImage(tex, -W / 2, -H / 2);
  if (over) { g.save(); g.translate(-W / 2, -H / 2); over(g); g.restore(); }
  for (const [sx, sy, sa, su] of staples) if (u >= su) { const k = u - su; staple(g, sx - W / 2, sy - H / 2, sa, 2.2 * (k < 3 ? lerp(1.25, 1, k / 3) : 1)); }
  g.restore();
}
const FLICK = [['fly-yellow', P.YELLOW], ['fly-white', P.WHITE], ['fly-green', P.GREEN], ['fly-pink', P.PINK]];
const CORNER = [[70, 66, -8, 4], [W - 70, 66, 6, 7], [70, H - 66, 4, 10], [W - 70, H - 66, -6, 13]];
function wallAt(t) {
  return g => {
    wallBg(g);
    let fk = -1; T.flick.forEach((b, i) => { if (t >= B(b)) fk = i; });             // 同一张海报按拍换纸：黄 → 白 → 绿 → 粉
    const ftex = fk < 0 || fk === 3 ? FLY() : xeroxTexture(FLICK[fk][0], flyer, gen(1), FLICK[fk][1]), fu = fk < 0 ? 99 : t - B(T.flick[fk]);
    slapSheet(g, ftex, W / 2, H / 2, 0, 1 + .025 * Math.exp(-fu / 4) * (fk >= 0), 999, CORNER.map(([a, b, c, d]) => [a, b, c, -1]),
      fu < 10 ? x => { x.save(); x.globalCompositeOperation = 'screen'; x.fillStyle = `rgba(225,255,236,${.7 * Math.exp(-fu / 2.5)})`; x.fillRect(0, 0, W, H); x.restore(); } : null);   // 换纸那一下复印机的光闪一下
    for (const [b, col, key, cx, cy, rot, s, dr] of WALL) slapSheet(g, xeroxTexture(key, dr, gen(key === 'zine-pink' ? 3 : 1), col), cx, cy, rot, s, t - B(b), CORNER);
    slapSheet(g, TITLE_TEX(titleN(t)), TITLE.cx, TITLE.cy, TITLE.rot, TITLE.s, t - B(TITLE.b), CORNER, titleOver(t));
  };
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
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.fillStyle = sh.bg ?? (sh.paper === P.ORIG ? P.ORIG : '#fff'); cx.fillRect(0, 0, W, H);
    applyCam(cx, cam, sh.mode === 'x' ? q : null);
    const draw = sh.draw(cam, t);
    const isTex = typeof draw !== 'function';
    if (isTex) cx.drawImage(draw, 0, 0); else draw(cx, cam);
    cx.setTransform(1, 0, 0, 1, 0, 0);
    let src;
    if (sh.mode === 'x') {
      const bx = BC[li].getContext('2d'); bx.setTransform(1, 0, 0, 1, 0, 0); bx.drawImage(CC[li], 0, 0); bx.filter = `blur(${Math.min(q.blur * cam.z, 24).toFixed(2)}px)`; bx.drawImage(CC[li], 0, 0); bx.filter = 'none';
      src = bx.getImageData(L.x0, 0, L.x1 - L.x0, H).data;
    } else src = cx.getImageData(L.x0, 0, L.x1 - L.x0, H).data;
    const pr = rgb(typeof sh.paper === 'function' ? sh.paper(t) : sh.paper), w = L.x1 - L.x0;
    const qq = sh.mode === 'x' ? { ...q, sh: (q.g ?? 1) * 7919 * 13, shm: (q.g ?? 1) * 104729 } : null;
    const mx = qq && qq.mix != null ? qq.mix : 1;
    const dev = new Float32Array(w); for (let x = 0; x < w; x++) { const a = L.age ? L.age(L.x0 + x) : 999; dev[x] = a < 60 ? 1 - .6 * Math.exp(-Math.max(a, 0) / 5) : 1; }
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < w; x++) {
        const s = (y * w + x) * 4, i = y * W + x + L.x0, o = i * 4;
        const tex = sh.notex ? 1 : .955 + .045 * NM[i] - .02 * NF[i];
        if (qq) {
          const Lm = (src[s] * .3 + src[s + 1] * .59 + src[s + 2] * .11) / 255;
          const ink = xeroxPixel(src, null, i, Lm, qq) * dev[x];
          od[o] = (pr[0] * tex) * (1 - ink) + INK[0] * ink; od[o + 1] = (pr[1] * tex) * (1 - ink) + INK[1] * ink; od[o + 2] = (pr[2] * tex) * (1 - ink) + INK[2] * ink;
          if (mx < 1) { od[o] = lerp(src[s] * tex, od[o], mx); od[o + 1] = lerp(src[s + 1] * tex, od[o + 1], mx); od[o + 2] = lerp(src[s + 2] * tex, od[o + 2], mx); }   // 还没压平：原来的灰照片
        } else { od[o] = src[s] * tex; od[o + 1] = src[s + 1] * tex; od[o + 2] = src[s + 2] * tex; }
        od[o + 3] = 255;
      }
    }
  });
  OX.putImageData(OIM, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(OUT, 0, 0);
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
// 03 代数的计数章：大号数字，每吐一张就盖一次（放大 1.4 倍落下，带一点转）
function bigGen(ctx, g, pop, land) {
  const tilt = (hash(Math.round(land)) - .5) * 6, s = 1 + .4 * pop;
  ctx.save(); ctx.translate(W - 70, 58); ctx.rotate((tilt + 8 * pop) * D); ctx.scale(s, s);
  ctx.font = '150px Anton'; const n = String(g), nw = ctx.measureText(n).width, w = nw + 190, h = 176;
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(-w + 6, 8, w, h); ctx.fillStyle = '#141414'; ctx.fillRect(-w, 0, w, h);
  ctx.fillStyle = '#F4F4F0'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic'; ctx.fillText(n, -86, 156);
  ctx.font = '50px Hei'; ctx.textAlign = 'left'; ctx.fillText('代', -76, 152); ctx.fillText('第', -w + 22, 72);
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
// ———————————————————— 时间点（拍） ————————————————————
const T = {
  scan: [-1.6, 1.5], tape: [0, .5], sticker: 1, marker: [1.25, 2], pin: 2.5,
  toss: [3.25, 4], crush: [4.5, 5],
  knob: [[5.25, 6, .17], [6.25, 7, .84], [7.2, 7.8, .5]],
  flood: [8, 8.6], crack: [8.65, 9.75], turn: [10, 12.5, 45, 15], htZoom: [9.5, 13.25],
  dive: [13, 14.5], out: [14.5, 16], tray: [16, 16.75],
  ejects: [[17, 2], [17.5, 3], [18, 4], [18.5, 6], [19, 8], [19.5, 12], [20, 16], [20.5, 24], [20.75, 32], [21, 48], [21.25, 64]],
  tear: [22.5, 23, 24], staples: [24, 24.25, 24.5, 24.75],
  wall: 24.85, flick: [25, 25.5, 26, 26.5], pull: [25, 27], push: [31, 35.5], final: 36,
  hits: [[4, .028], [8, .022], [16, .045], [24, .03], [28, .035], [36, .05]],     // 镜头往里“咚”一下（单向）：拍、幅度
  ghost: [5, 6, 7, 10, 11, 12, 13],                                              // 复印机走纸打滑：这几拍整张叠一层错位的影子
};
const knob = t => { let v = .5; for (const [a, b, to] of T.knob) v = lerp(v, to, eio(prog(t, B(a), B(b)))); return v; };
const sinceBeat = (t, a, b) => { const k = Math.floor((t - OFF) / FPB); return k >= a && k < b ? t - B(k) : 999; };

// ———————————————————— 镜头 ————————————————————
function camCover(t) { const u = prog(t, B(-1), B(4.5)), v = eio(prog(t, B(2), B(4))); return { x: lerp(960, 1010, u) + 160 * v, y: lerp(540, 520, u) - 20 * v, z: 1.02 + .05 * eio(u) + .12 * v, r: lerp(-.6, .5, u) - 1.2 * v }; }
function camPhoto(t) { const u = prog(t, B(3.25), B(8.6)); return { x: lerp(960, 920, eio(u)), y: lerp(540, 480, eio(u)), z: lerp(1.0, 1.1, eio(u)), r: lerp(.5, -.6, u) }; }
// 网点：最后钻进哪一颗（网角转到 15° 之后、亮度约 0.72 的那颗）
let PC = null;
function pcenter() {
  if (PC) return PC;
  const ph = photo(), a = T.turn[3] * D, ca = Math.cos(a), sa = Math.sin(a), pitch = 14; let best = null;
  for (let iu = -40; iu < 200; iu++) for (let iv = -120; iv < 120; iv++) {
    const u = iu * pitch, v = iv * pitch, x = u * ca - v * sa, y = u * sa + v * ca;
    if (x < 600 || x > 860 || y < 400 || y > 600) continue;
    const l = Math.pow(ph.lum(x, y), .55), sc = Math.abs(l - .6); if (!best || sc < best.sc) best = { x, y, sc, l };
  }
  PC = best; return PC;
}
function camHT(t) {
  const pc = pcenter(), u = eio(prog(t, B(T.htZoom[0]), B(T.htZoom[1]))), dv = prog(t, B(T.dive[0]), B(T.dive[1]));
  const z = Math.exp(lerp(0, Math.log(2), u) + Math.log(320) * ei(dv));
  return { x: lerp(960, pc.x, u), y: lerp(540, pc.y, u), z, r: lerp(-.6, .4, u) * (1 - dv) };
}
// zine：从一个笔画的里面退出来
let SP = null;
export function strokePoint() {        // 黑得最“深”的一点（离白最远）：镜头从这里退出来
  if (SP) return SP;
  const s = 1, w = W / s, h = H / s, c = createCanvas(w, h), x = c.getContext('2d'); x.scale(1 / s, 1 / s); zinePage(x);
  const d = x.getImageData(0, 0, w, h).data, dist = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) dist[i] = d[i * 4] < 70 ? 1e6 : 0;
  for (let y = 0; y < h; y++) for (let X = 0; X < w; X++) { const i = y * w + X; if (!dist[i]) continue; dist[i] = Math.min(dist[i], X ? dist[i - 1] + 1 : 0, y ? dist[i - w] + 1 : 0); }
  for (let y = h - 1; y >= 0; y--) for (let X = w - 1; X >= 0; X--) { const i = y * w + X; if (!dist[i]) continue; dist[i] = Math.min(dist[i], X < w - 1 ? dist[i + 1] + 1 : 0, y < h - 1 ? dist[i + w] + 1 : 0); }
  let bi = 0; for (let i = 0; i < w * h; i++) if ((i % w) * s < 1080 && dist[i] > dist[bi]) bi = i;     // 只在左边的大字里找（照片卡缩小看是黑的，放大是点）
  SP = { x: (bi % w) * s + s / 2, y: Math.floor(bi / w) * s + s / 2, r: dist[bi] * s }; return SP;
}
const ZOUT = 40;
export function camOut(t) {
  // 绕笔画里那一点缩小：它在屏幕上离中心的距离 = 原本的距离 × z^-0.5，z 很大时几乎还在正中，退到 1 倍时回到原位
  const sp = strokePoint(), u = prog(t, B(T.out[0]), B(T.out[1])), z = Math.exp(Math.log(ZOUT) * (1 - eio(u))), w = Math.pow(z, -.5);
  return { x: sp.x - (sp.x - 960) * w / z, y: sp.y - (sp.y - 540) * w / z, z, r: 0 };
}
function camPile(t) {
  const a = eio(prog(t, B(T.tray[0]), B(T.tray[1]))), b = eio(prog(t, B(T.tear[0]), B(T.tear[2]))), drift = prog(t, B(T.tray[1]), B(T.tear[0]));
  const z = lerp(lerp(1, .84, a), 1, b);
  return { x: lerp(960 + lerp(0, 40, drift) * (1 - b), 960, 0), y: 540 + lerp(0, -24, drift) * (1 - b), z, r: lerp(0, lerp(-.8, .6, drift), a) * (1 - b) };
}
function camWall(t) {
  const a = eio(prog(t, B(T.pull[0]), B(T.pull[1]))), b = eio(prog(t, B(T.push[0]), B(T.push[1]))), c = prog(t, B(T.push[1]), END);
  const z = Math.exp(lerp(0, Math.log(.36), a)) * Math.exp(lerp(0, Math.log(2.25), b)) * (1 + .03 * c);
  return { x: lerp(lerp(960, 980, a), TITLE.cx + 20, b), y: lerp(lerp(540, 560, a), TITLE.cy + 90, b), z, r: lerp(0, -1.4, a) + lerp(0, 1.0, b) + .3 * c };
}

// ———————————————————— 各章的纸 ————————————————————
const SHEET = {
  coverRaw: { mode: 'raw', paper: P.ORIG, q: () => null, draw: () => coverBase, cam: camCover },
  coverX: { mode: 'x', paper: P.PINK, q: () => gen(1), draw: () => coverBase, cam: camCover },
  photo: { mode: 'x', bg: '#fff', cam: camPhoto,
    paper: t => mixHex('#EFEDE6', P.YELLOW, eio(prog(t, B(T.crush[0]), B(T.crush[1])))),
    q: t => { const c = eio(prog(t, B(T.crush[0]), B(T.crush[1]))), fl = ei(prog(t, B(T.flood[0]), B(T.flood[1])));
      return { ...gen(1), th: lerp(knob(t), 1.16, fl), soft: lerp(.5, .05, c), mix: c, nm: .16, n: .12 }; },
    draw: (cam, t) => g => {     // 照片 + 一束扫过去的追光：黑白的边界跟着光走
      g.drawImage(photo().canvas, 0, 0);
      const k = eo(prog(t, B(T.crush[0]), B(5.2))), u = prog(t, B(T.crush[0]), B(T.flood[1])), lx = lerp(200, 1750, eio(u)), ly = lerp(220, 460, u);
      if (k > 0) { g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(lx, ly, 20, lx, ly, 560); gr.addColorStop(0, `rgba(125,125,125,${k})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(-W, -H, 3 * W, 3 * H); g.restore(); }
    } },
  ht: { mode: 'x', paper: P.GREEN, cam: camHT, q: () => ({ ...gen(1), th: .5, rot: 0, dx: 0, dy: 0 }),
    draw: (cam, t) => g => {
      paperBg(g, '#fff');
      const ang = lerp(T.turn[2], T.turn[3], eio(prog(t, B(T.turn[0]), B(T.turn[1])))), ex = 1.3 * (1 - eo(prog(t, B(T.crack[0]), B(T.crack[1]))));
      const su = sinceBeat(t, 10, 13), pulse = t < B(T.dive[0]) ? .16 * Math.min(1, su / 2.5) * Math.exp(-su / 6) : 0;   // 2.5 帧胀起来，再慢慢缩回
      const hw = W / 2 / cam.z + 30, hh = H / 2 / cam.z + 30, r = Math.hypot(hw, hh);
      halftone(g, { pitch: 14, angle: ang, gain: 1 + pulse, extra: ex, ink: '#000', lum: HTLUM, box: [cam.x - r, cam.y - r, cam.x + r, cam.y + r] });
    } },
  zineLive: { mode: 'x', paper: P.WHITE, cam: camOut, q: () => gen(1), draw: () => zinePage },
};
const HTLUM = (x, y) => Math.pow(photo().lum(x, y), .55);     // 网点那章提亮一点，话筒看得清
const lay = (sheet, x0 = 0, x1 = W, age = null) => ({ sheet, x0, x1, age });

// ———————————————————— 03 代数：出纸口一张张吐出来，叠成一摞 ————————————————————
const ZT = g => xeroxTexture('zine-' + g, zinePage, gen(g), P.WHITE);
const POSE = T.ejects.map(([b, g], i) => { const r = rng(40 + i); return { b, g, dx: (r() - .5) * 36, dy: (r() - .5) * 30, rot: (r() - .5) * 3.2 }; });
const TRAY = () => baked('tray', x => {
  const gr = x.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 1300); gr.addColorStop(0, '#34322f'); gr.addColorStop(1, '#151413'); x.fillStyle = gr; x.fillRect(0, 0, W, H);
  const r = rng(9); for (let i = 0; i < 1800; i++) { x.fillStyle = `rgba(255,255,255,${r() * .035})`; x.fillRect(r() * W, r() * H, 1 + r() * 3, 1 + r() * 3); }
  x.strokeStyle = 'rgba(255,255,255,.06)'; x.lineWidth = 3; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(0, 140 + i * 160); x.lineTo(W, 140 + i * 160); x.stroke(); }
});
function sheetShadow(g, k = 1) { g.save(); g.translate(8 * k, 14 * k); g.fillStyle = 'rgba(0,0,0,.5)'; g.filter = `blur(${12 * k}px)`; g.fillRect(-W / 2, -H / 2, W, H); g.restore(); }
function ejected(g, tex, p, u) {          // u：落地后的帧数（< 0 还在出纸口飞）
  const a = u < 0 ? clamp((u + 14) / 14) : 1, k = u > 0 ? Math.exp(-u / 5) : 0, e = (1 - a) * (1 - a);   // 14 帧滑进来，越滑越慢
  const x = p.dx + 1900 * e, y = p.dy - 50 * e, rot = p.rot + 6 * e + 1.6 * k * Math.sin(u * .8);
  g.save(); g.translate(W / 2 + x, H / 2 + y); g.rotate(rot * D); sheetShadow(g, 1 + .8 * (1 - a)); g.drawImage(tex, -W / 2, -H / 2); g.restore();
}
// 撕开：沿一条锯齿线把纸撕成两半，先从上往下裂开（绕底部张开），再甩出去
const TEAR = (() => { const r = rng(64), pts = []; for (let i = 0; i <= 24; i++) pts.push([970 + Math.sin(i * .9) * 30 + (r() - .5) * 46, -6 + i * (H + 12) / 24]); return pts; })();
function tornHalf(g, tex, side, u, p) {
  const open = eo(clamp(u / .35)), fly = ei(clamp((u - .2) / .8)), pin = TEAR[TEAR.length - 1];
  g.save(); g.translate(W / 2 + p.dx, H / 2 + p.dy); g.rotate(p.rot * D); g.translate(-W / 2, -H / 2);
  g.translate(side * 1500 * fly, (side < 0 ? 380 : -300) * fly);
  g.translate(pin[0], pin[1]); g.rotate(side * (5 * open + 16 * fly) * D); g.translate(-pin[0], -pin[1]);
  const path = new Path2D(); if (side < 0) { path.moveTo(-20, -20); TEAR.forEach(q => path.lineTo(...q)); path.lineTo(-20, H + 20); } else { path.moveTo(W + 20, -20); TEAR.forEach(q => path.lineTo(...q)); path.lineTo(W + 20, H + 20); } path.closePath();
  g.save(); g.translate(10, 16); g.fillStyle = 'rgba(0,0,0,.45)'; g.filter = 'blur(14px)'; g.fill(path); g.restore();
  g.save(); g.clip(path); g.drawImage(tex, 0, 0); g.restore();
  g.save(); g.strokeStyle = '#FBF8F0'; g.lineWidth = 7; g.lineJoin = 'round'; g.beginPath(); TEAR.forEach((q, i) => (i ? g.lineTo(q[0] + side * 3, q[1]) : g.moveTo(q[0] + side * 3, q[1]))); g.stroke(); g.restore();
  g.restore();
}
function pileScene(ctx, t) {
  const cam = camPile(t); applyCam(ctx, ID); ctx.drawImage(TRAY(), 0, 0);
  applyCam(ctx, cam);
  const tearing = t >= B(T.tear[1]);
  if (t >= B(T.tear[0])) { ctx.save(); ctx.translate(W / 2, H / 2); sheetShadow(ctx); ctx.drawImage(FLY(), -W / 2, -H / 2); ctx.restore(); }
  let last = -1; POSE.forEach((p, i) => { if (t >= B(p.b)) last = i; });
  const base = { dx: 0, dy: 0, rot: 0 };
  if (!tearing) {
    if (last < 2) { ctx.save(); ctx.translate(W / 2, H / 2); ctx.drawImage(ZT(1), -W / 2, -H / 2); ctx.restore(); }
    for (let i = Math.max(0, last - 2); i < POSE.length; i++) { const u = t - B(POSE[i].b); if (u < -14) break; ejected(ctx, ZT(POSE[i].g), POSE[i], u); }
  } else {
    const p = POSE[POSE.length - 1], u = prog(t, B(T.tear[1]), B(T.tear[2]));
    tornHalf(ctx, ZT(p.g), -1, u, p); tornHalf(ctx, ZT(p.g), 1, u, p);
  }
  if (t >= B(T.tear[0]) && !tearing) { // 撕之前一拍：两手一捏，纸往中间拱一下（起势）
    const k = Math.sin(Math.PI * prog(t, B(T.tear[0]), B(T.tear[1]))); applyCam(ctx, cam); ctx.save(); ctx.globalAlpha = .18 * k; ctx.fillStyle = '#000'; ctx.fillRect(950, 0, 40, H); ctx.restore();
  }
  void base;
}

// ———————————————————— 封面上后贴上去的东西 ————————————————————
function safetyPin(g, u) {          // 别针：拍下来、转着落定。u = 落地后的帧数
  if (u < -7) return;
  const a = u < 0 ? eo((u + 7) / 7) : 1, s = u < 0 ? lerp(1.6, 1, a) : 1 + .05 * Math.exp(-u / 4) * Math.cos(u * .9), rot = -32 + (u < 0 ? 40 * (1 - a) : 7 * Math.exp(-u / 5) * Math.cos(u * .7));
  g.save(); g.globalAlpha = clamp((u + 7) / 3); g.translate(1230, 610); g.rotate(rot * D); g.scale(s, s);
  const L = 440, sh = 8 + 30 * (1 - a), R = 22, hx = L / 2 - 64;
  const wire = x => {
    x.lineCap = 'round'; x.lineJoin = 'round'; x.lineWidth = 12;
    x.beginPath(); x.arc(-L / 2, 0, R, -Math.PI * .55, Math.PI * 1.3); x.stroke();                 // 一端绕一圈
    x.beginPath(); x.moveTo(-L / 2 + R * .3, -R); x.lineTo(hx + 10, -16); x.stroke();                 // 上面那根
    x.beginPath(); x.moveTo(-L / 2 + R * .3, R); x.lineTo(hx + 30, 6); x.stroke();                    // 下面那根，针尖扣进扣头
  };
  const cap = x => { x.beginPath(); x.moveTo(hx, -30); x.lineTo(hx + 56, -30); x.quadraticCurveTo(hx + 78, -30, hx + 78, -8); x.lineTo(hx + 78, 14); x.quadraticCurveTo(hx + 78, 30, hx + 56, 30); x.lineTo(hx, 30); x.closePath(); };
  g.save(); g.translate(sh * .5, sh); g.strokeStyle = 'rgba(0,0,0,.35)'; g.fillStyle = 'rgba(0,0,0,.35)'; g.filter = `blur(${4 + sh * .4}px)`; wire(g); cap(g); g.fill(); g.restore();
  const gr = g.createLinearGradient(0, -34, 0, 34); gr.addColorStop(0, '#f4f5f7'); gr.addColorStop(.45, '#7d828a'); gr.addColorStop(.7, '#c9ccd1'); gr.addColorStop(1, '#5e6269');
  g.strokeStyle = gr; wire(g);
  g.fillStyle = gr; cap(g); g.fill(); g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 2; g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(hx + 6, -22); g.lineTo(hx + 54, -22); g.stroke();
  g.restore();
}
function coverFresh(ctx, t) {
  applyCam(ctx, camCover(t));
  itemTape(ctx, eo(prog(t, B(T.tape[0]), B(T.tape[1]))));
  itemSticker(ctx, t - B(T.sticker));
  itemMarker(ctx, prog(t, B(T.marker[0]), B(T.marker[1])));
  safetyPin(ctx, t - B(T.pin));
}
function tossedPhoto(ctx, t) {      // 灰照片甩进来：转着从右边飞进来，落定后抖两下
  const u = prog(t, B(T.toss[0]), B(T.toss[1])); if (u <= 0) return;
  const e = u < 1 ? eo(u) : 1, k = t - B(T.toss[1]);
  const x = lerp(W * 1.15, 0, e) + (k > 0 ? -12 * Math.exp(-k / 5) * Math.sin(k * .6) : 0), y = lerp(-140, 0, e), r = lerp(16, 0, e) + (k > 0 ? 1.2 * Math.exp(-k / 5) * Math.sin(k * .7) : 0);
  applyCam(ctx, camPhoto(t));
  ctx.save(); ctx.translate(x + W / 2, y + H / 2); ctx.rotate(r * D); ctx.translate(-W / 2, -H / 2);
  ctx.save(); ctx.translate(-26, 18); ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.filter = 'blur(22px)'; ctx.fillRect(0, 0, W + 60, H); ctx.restore();
  ctx.fillStyle = '#f3f1ea'; ctx.fillRect(-16, -16, W + 32, H + 32); ctx.drawImage(photo().canvas, 0, 0); ctx.restore();
}

// ———————————————————— 一帧 ————————————————————
function prewarm() { FLY(); for (const [b, col, key, , , , , dr] of WALL) xeroxTexture(key, dr, gen(key === 'zine-pink' ? 3 : 1), col); for (let n = 0; n <= STAMP.length; n++) TITLE_TEX(n); for (const p of POSE) ZT(p.g); ZT(1); }
export function render(ctx, t) {
  if (t >= B(T.out[0])) prewarm();
  if (t < B(T.crush[0])) {                                            // 封面：扫描（转场 1）+ 后贴的东西 + 甩进来的照片（转场 2）
    const s0 = B(T.scan[0]), dur = T.scan[1] * FPB, v = (W + 2 * PAD) / dur, xb = -PAD + (t - s0) * v;
    const age = x => t - (s0 + (x + PAD) / v), cut = clamp(Math.ceil(xb), 0, W);
    compose(ctx, xb < W ? [lay(SHEET.coverX, 0, cut, age), lay(SHEET.coverRaw, cut, W)] : [lay(SHEET.coverX, 0, W, age)], t);
    coverFresh(ctx, t);
    if (xb < W + 480) drawBar(ctx, xb, v);
    tossedPhoto(ctx, t);
  } else if (t < B(T.flood[1])) compose(ctx, [lay(SHEET.photo)], t);    // 01 阈值（到头时整屏淹黑）
  else if (t < B(T.out[0])) compose(ctx, [lay(SHEET.ht)], t);           // 转场 3 的后半：从黑里裂成网点；02 网点；转场 4 的前半：钻进去
  else if (t < B(T.tray[0])) compose(ctx, [lay(SHEET.zineLive)], t);    // 转场 4 的后半：从笔画里退出来
  else if (t < B(T.wall)) pileScene(ctx, t);                          // 03 代数 + 转场 5：撕开
  else { applyCam(ctx, camWall(t)); wallAt(t)(ctx); }                  // 转场 6：订上墙、拉远；04 纸色；片尾
  if (t >= B(T.staples[0]) - 2 && t < B(T.wall)) {                     // 订书枪：四个角
    applyCam(ctx, ID);
    CORNER.forEach(([x, y, a], i) => { const k = t - B(T.staples[i]); if (k >= 0) staple(ctx, x, y, a, 2.2 * (k < 3 ? lerp(1.25, 1, k / 3) : 1)); });
  }
  post(ctx, t);
  hud(ctx, t);
}

// ———————————————————— 打在拍上的两个后期动作 ————————————————————
// 重拍：整个画面往里“咚”一下，2 帧顶上去、再慢慢回来（单向，不来回颤）
// 走纸打滑：这一拍整张叠一层错位的影子（darken：只留更黑的墨，纸色不变），3.5 帧衰减
const PK = createCanvas(W, H), PKX = PK.getContext('2d');
function post(ctx, t) {
  let z = 1, ga = 0;
  for (const [b, a] of T.hits) { const u = t - B(b); if (u >= 0 && u < 60) z += a * (u < 2 ? u / 2 : Math.exp(-(u - 2) / 8)); }
  for (const b of T.ghost) { const u = t - B(b); if (u >= 0 && u < 16) ga = Math.max(ga, Math.exp(-u / 3.5)); }
  if (z < 1.0005 && ga < .01) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0); PKX.setTransform(1, 0, 0, 1, 0, 0); PKX.drawImage(ctx.canvas, 0, 0);
  if (z >= 1.0005) { ctx.drawImage(PK, W / 2 - W * z / 2, H / 2 - H * z / 2, W * z, H * z); if (ga >= .01) PKX.drawImage(ctx.canvas, 0, 0); }
  if (ga >= .01) { ctx.save(); ctx.globalCompositeOperation = 'darken'; ctx.globalAlpha = .6 * ga; ctx.drawImage(PK, 6 + 16 * ga, -3 - 9 * ga); ctx.restore(); }
}

// ———————————————————— 屏幕上的字 ————————————————————
function hud(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // 代数计数：封面和 03 代数
  let g = 0;
  if (t < B(T.toss[1])) g = 1;
  else if (t >= B(T.out[1]) && t < B(T.tear[0])) { g = 1; for (const p of POSE) if (t >= B(p.b)) g = p.g; }
  if (g) {
    let land = -1e9; if (t >= B(T.tray[0])) for (const p of POSE) if (t >= B(p.b)) land = B(p.b);
    const pop = Math.exp(-(t - land) / 5) * (t >= land);
    if (t >= B(T.tray[0])) bigGen(ctx, g, pop, land);
    else { ctx.save(); ctx.translate(W - 64, 52); ctx.scale(1 + .18 * pop, 1 + .18 * pop); ctx.translate(-(W - 64), -52); counter(ctx, g, t); ctx.restore(); }
  }
  readout(ctx, ['扫描 ▶ 原稿 → 第 1 代'], 60, 980, -99, t, { size: 28, out: B(.9) });
  // 01 阈值
  dymo(ctx, '01 阈值 THRESHOLD', 60, 46, B(4.6), t, { out: B(7.85) });
  slip(ctx, '灰色不存在', 330, 820, B(5.25), t, { size: 96, out: B(7.75), rot: -3 });
  slip(ctx, '只剩黑和纸', 300, 950, B(5.75), t, { size: 66, fg: '#fff', bg: P.INK, out: B(7.8), rot: 2, seed: 7 });
  if (t > B(4.9) && t < B(7.95) + 14) {
    const v = knob(t), out = eio(prog(t, B(7.85), B(7.85) + 14)), a = eo(prog(t, B(4.9), B(4.9) + 10));
    ctx.save(); ctx.translate(1500 + out * 700, 880 + (1 - a) * 30); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(4, 6, 380, 150); ctx.fillStyle = '#141414'; ctx.fillRect(0, 0, 380, 150);
    ctx.fillStyle = '#F4F4F0'; ctx.font = '28px Hei'; ctx.fillText('阈值', 24, 46); ctx.font = '84px Mono'; ctx.textAlign = 'right'; ctx.fillText(v.toFixed(2), 356, 88);
    ctx.fillStyle = '#555'; ctx.fillRect(24, 112, 332, 8); ctx.fillStyle = P.YELLOW; ctx.fillRect(24, 112, 332 * v, 8); ctx.beginPath(); ctx.arc(24 + 332 * v, 116, 14, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // 02 网点
  dymo(ctx, '02 网点 HALFTONE', 60, 46, B(9.75), t, { out: B(12.85) });
  slip(ctx, '照片 = 一排排的点', 420, 830, B(10.25), t, { size: 88, out: B(12.75), rot: -2, seed: 9 });
  slip(ctx, '网角一转，图案就变', 400, 958, B(11), t, { size: 62, fg: '#fff', bg: P.INK, out: B(12.8), rot: 2, seed: 2 });
  if (t > B(10)) { const ang = lerp(T.turn[2], T.turn[3], eio(prog(t, B(T.turn[0]), B(T.turn[1]))));
    readout(ctx, [`网角 ${ang.toFixed(0).padStart(2, ' ')}°`, '点距 14 · 随鼓点胀缩'], 1420, 880, B(10), t, { size: 40, out: B(12.85) }); }
  // 03 代数
  dymo(ctx, '03 代数 GENERATIONS', 60, 46, B(16.35), t, { out: B(22.4) });
  slip(ctx, '复印一次，糊一层', 520, 852, B(17.25), t, { size: 92, out: B(22.3), rot: -2, seed: 5 });
  slip(ctx, '3 代以内最好看', 420, 975, B(19.75), t, { size: 66, fg: '#fff', bg: P.INK, out: B(22.35), rot: 1.5, seed: 8 });
  // 04 纸色
  dymo(ctx, '04 纸色 PAPER', 60, 46, B(25.6), t, { out: B(30.85) });
  slip(ctx, '颜色在纸上，墨只有黑', 620, 975, B(29.5), t, { size: 80, out: B(30.75), rot: -1.5, seed: 6 });
  SWATCH.forEach(([b, col, s], i) => {
    if (t < B(b)) return; const out = eio(prog(t, B(30.85), B(30.85) + 14)), a = eo(prog(t, B(b), B(b) + 8));
    ctx.save(); ctx.translate(1460 + out * 600, 150 + i * 92); ctx.globalAlpha = a; ctx.translate((1 - a) * 60, 0);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(4, 6, 400, 72); ctx.fillStyle = '#141414'; ctx.fillRect(0, 0, 400, 72);
    ctx.fillStyle = col; ctx.fillRect(12, 12, 48, 48); ctx.strokeStyle = '#F4F4F0'; ctx.lineWidth = 2; ctx.strokeRect(12, 12, 48, 48);
    ctx.fillStyle = '#F4F4F0'; ctx.font = '30px Hei'; ctx.textBaseline = 'middle'; ctx.fillText(s, 76, 38); ctx.restore();
  });
  // 署名：最后一个重拍订上
  const F0 = B(T.final) - 18;
  if (t > F0) {
    const u = t - B(T.final), s = u < 0 ? lerp(1.3, 1, eo(clamp((u + 18) / 18))) : 1 + .05 * Math.exp(-u / 4) * Math.cos(u * .9);
    ctx.save(); ctx.translate(W - 640, H - 170); ctx.rotate(-2.5 * D); ctx.scale(s, s); ctx.globalAlpha = clamp((u + 18) / 5);
    dymo(ctx, '观默 @guanmo_ai', 0, 0, F0, t, { size: 54, rot: 0, rate: 1.2 });
    ctx.font = '54px Hei'; const lw = ctx.measureText('观默 @guanmo_ai').width + 54 * .9;
    if (u >= 0) { const k = clamp(u / 3); staple(ctx, 16, 40, 88, 1.6 * lerp(1.3, 1, k)); staple(ctx, lw - 16, 40, 92, 1.6 * lerp(1.3, 1, k)); }
    ctx.restore();
  }
}
const SWATCH = [[27, P.PINK, '荧光粉 #FF3E9A'], [27.5, P.YELLOW, '柠檬黄 #FFE21A'], [28, P.WHITE, '复印白 #F1EEE4'], [28.5, P.GREEN, '荧光绿 #7BE86A'], [29, P.INK, '墨 #121012']];

// ———————————————————— 给声音用 ————————————————————
export function events() {
  const ev = { fps: FPS, bpm: BPM, off: OFF, end: END, scans: [{ f: B(T.scan[0]), dur: T.scan[1] * FPB }],
    tape: [B(T.tape[0]), B(T.tape[1])], sticker: B(T.sticker), pin: B(T.pin), marker: [B(T.marker[0]), B(T.marker[1])], photo: B(T.toss[0]), photoLand: B(T.toss[1]),
    crush: B(T.crush[0]), knob: T.knob.map(([a, b]) => [B(a), B(b)]), flood: [B(T.flood[0]), B(T.flood[1])], crack: [B(T.crack[0]), B(T.crack[1])],
    dive: [B(T.dive[0]), B(T.dive[1])], out: [B(T.out[0]), B(T.out[1])], ejects: POSE.map(p => B(p.b)), tear: [B(T.tear[1]), B(T.tear[2])],
    staples: [...T.staples.map(B), ...WALL.flatMap(([b]) => CORNER.map(c => B(b) + c[3])), ...CORNER.map(c => B(TITLE.b) + c[3]), B(T.final), B(T.final) + 2],
    slaps: [...WALL.map(([b]) => B(b)), B(TITLE.b)], stamps: STAMP.map((i, k) => B(stampBeat(k))), flicks: T.flick.map(B), hits: T.hits.map(([b, a]) => [B(b), a]), ghosts: T.ghost.map(B), text: [], final: B(T.final), transitions: TRANSITIONS };
  const dy = (s, f0, rate = 2.2) => { for (let i = 0; i < Array.from(s).length; i++) ev.text.push({ f: f0 + i * rate, k: 'key' }); };
  const sl = f => ev.text.push({ f, k: 'slip' });
  dy('01 阈值 THRESHOLD', B(4.6)); sl(B(5.25)); sl(B(5.75));
  dy('02 网点 HALFTONE', B(9.75)); sl(B(10.25)); sl(B(11)); ev.text.push({ f: B(10), k: 'tick' });
  dy('03 代数 GENERATIONS', B(16.35)); sl(B(17.25)); sl(B(19.75));
  dy('04 纸色 PAPER', B(25.6)); sl(B(29.5));
  for (const [b] of SWATCH) ev.text.push({ f: B(b), k: 'tick' });
  dy('观默 @guanmo_ai', B(T.final) - 18, 1.2);
  ev.text.push({ f: 0, k: 'tick' }); ev.text.push({ f: B(4.9), k: 'tick' });
  return ev;
}

// 每帧用几个子帧做运动模糊：镜头推得快的地方多拿几帧，免得叠影
export function subAt(f) {
  const inB = (a, b) => f >= B(a) && f < B(b);
  if (inB(T.dive[0] + .6, T.out[1] - .4)) return 9;                                                   // 钻进一颗点、从笔画里退出来
  if (T.ejects.some(([b]) => f >= B(b) - 15 && f < B(b) + 2) || inB(T.tear[1], T.tear[2]) || inB(T.toss[0] - .1, T.toss[1] + .1)) return 6;   // 出纸、撕开、甩照片
  if (WALL.some(([b]) => f >= B(b) - 13 && f < B(b) + 1) || (f >= B(TITLE.b) - 13 && f < B(TITLE.b) + 1)) return 6;   // 飞上墙
  return 3;
}
