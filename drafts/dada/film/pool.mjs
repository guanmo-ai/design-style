// 达达 · 这支片子里所有的纸片（全片只有这一批，每一章是它们落成的另一张拼贴）。
import { C, D, makeScrap, letter, strip, txt, tw, halftone, eyeLum, lipsLum, rng, Path2D, polyPath } from './kit.mjs';

export const S = {};
const add = sc => { S[sc.id] = sc; return sc; };

// —— 六张字母卡：每个字一种字体、一种纸。faces[1] 是规则 01 里翻过来换的另一种字体 ——
function card(id, ch, w, h, fonts, col, fill, seed, tear = 0) {
  const mk = ([font, size, dy = 0]) => letter(id, ch, w, h, size, font, col, fill, seed, tear, dy);
  const sc = mk(fonts[0]);
  sc.faces = fonts.map((f, i) => (i ? mk(f).face : sc.face));
  return add(sc);
}
card('D1', 'D', 236, 316, [['Abril', 300], ['Slab', 250]], C.NEWS, C.INK, 21);
card('A1', 'A', 210, 350, [['Anton', 330, 6], ['Rye', 250]], C.RED, C.NEWS, 22, 4);
card('D2', 'D', 240, 290, [['Rye', 250], ['Arch', 262]], C.INK, C.OCHRE, 23);
card('A2', 'A', 226, 300, [['Slab', 250], ['Abril', 300]], C.NEWS, C.RED, 24);
card('H1', '达', 290, 300, [['Hei', 250, -8]], C.INK, C.PINK, 25);
card('H2', '达', 280, 300, [['Ma', 270, -6]], C.NEWS, C.INK, 26, 5);
card('qm', '?', 190, 290, [['Abril', 300]], C.RED, C.NEWS, 27);
card('tag', '偶然', 262, 150, [['Song', 96, -4]], C.NEWS, C.RED, 42);

// —— 从画报上剪下来的“照片”：亮度函数现算的网点 ——
{ // 眼睛有五张脸：眼珠从最左到最右（像定格动画一样一格格看过去）
  const mk = g => makeScrap({ id: 'eye', w: 540, h: 340, fill: C.PHOTO, seed: 11, res: 2, paint: (x, w, h) => halftone(x, w, h, eyeLum(w, h, g), 10) });
  const sc = add(mk(0)); sc.faces = [-1, -.5, 0, .5, 1].map(g => (g ? mk(g).face : sc.face)); }
add(makeScrap({ id: 'lips', w: 410, h: 260, fill: C.PHOTO, seed: 12, res: 2, paint: (x, w, h) => halftone(x, w, h, lipsLum(w, h), 9) }));

// —— 齿轮、黑圆、红带 ——
function gearPath(R, n, spokes) {
  const p = new Path2D();
  for (let i = 0; i < n; i++) for (const [da, r] of [[-.27, .8], [-.2, 1], [.2, 1], [.27, .8]]) {
    const a = 6.2832 * i / n + da * 6.2832 / n * 1.6, X = R + Math.cos(a) * R * r, Y = R + Math.sin(a) * R * r;
    i || da !== -.27 ? p.lineTo(X, Y) : p.moveTo(X, Y);
  }
  p.closePath();
  const r1 = R * .26, r2 = R * .62;
  for (let i = 0; i < spokes; i++) {
    const a1 = 6.2832 * (i + .16) / spokes, a2 = 6.2832 * (i + .84) / spokes;
    p.moveTo(R + r1 * Math.cos(a1), R + r1 * Math.sin(a1)); p.arc(R, R, r1, a1, a2); p.arc(R, R, r2, a2, a1, true); p.closePath();
  }
  p.moveTo(R + R * .09, R); p.arc(R, R, R * .09, 0, 6.2832); p.closePath();
  return p;
}
add(makeScrap({ id: 'gearL', w: 380, h: 380, fill: C.INK, path: gearPath(190, 14, 6), rule: 'evenodd', pad: 4, back: false }));
add(makeScrap({ id: 'gearS', w: 196, h: 196, fill: C.RED, path: gearPath(98, 9, 5), rule: 'evenodd', pad: 4, back: false }));
{ const p = new Path2D(); p.arc(268, 268, 268, 0, 6.2832); add(makeScrap({ id: 'circle', w: 536, h: 536, fill: C.INK, path: p, pad: 4, back: false })); }
add(makeScrap({ id: 'bar', w: 1100, h: 116, fill: C.RED, seed: 31, k: .02 }));

// —— 底纸：牛皮纸、两块报纸 ——
const WORDS = 'dada DADA non ! umba bruit zang ? nichts rien 0,50 hop hop tzim da-da BOUM oui/non etc. & § nr. 3 ja ja nein KRRR papier colle ciseaux hasard zufall heute morgen abend 1916 zurich berlin paris koln hannover new-york rire !!!'.split(' ');
function columns(x, x0, y0, w, lines, seed, size = 15) {
  const r = rng(seed), f = `${size}px Type`;
  for (let i = 0; i < lines; i++) {
    let s = '';
    while (tw(s, f) < w - 30) s += WORDS[Math.floor(r() * WORDS.length)] + ' ';
    txt(x, s.trim(), x0, y0 + i * size * 1.42, f, '#5b5446');
  }
}
add(makeScrap({ id: 'kraft', w: 880, h: 960, fill: C.KRAFT, seed: 1, tear: 7, back: false }));
add(makeScrap({ id: 'news1', w: 640, h: 300, fill: C.NEWS, seed: 2, tear: 5, paint: x => { columns(x, 30, 44, 270, 12, 2); columns(x, 336, 44, 270, 12, 3); } }));
add(makeScrap({ id: 'news2', w: 400, h: 300, fill: C.NEWS, seed: 4, tear: 5, paint: x => columns(x, 28, 42, 344, 11, 4) }));

// —— 指示手（老报纸广告里的 ☞），指向右；要指左就在姿态里给 fx: -1 ——
add(makeScrap({ id: 'hand', w: 330, h: 190, free: true, pad: 8, paint: (x, w, h) => {
  const L = 330, Hh = L * .4, sw = 7;
  x.translate(0, h / 2); x.lineJoin = 'round'; x.lineWidth = sw; x.strokeStyle = C.INK; x.fillStyle = C.NEWS;
  const rr = (X, Y, Wd, Ht, r) => { x.beginPath(); x.roundRect(X, Y, Wd, Ht, r); x.fill(); x.stroke(); };
  rr(L * .2, -Hh * .5, L * .4, Hh, Hh * .19);
  rr(L * .46, -Hh * .46, L * .53, Hh * .26, Hh * .13);
  for (let i = 0; i < 3; i++) rr(L * (.5 - i * .015), -Hh * .5 + Hh * (.3 + i * .225), L * (.25 - i * .02), Hh * .22, Hh * .11);
  x.save(); x.translate(L * .3, -Hh * .5); x.rotate(-8 * D); rr(0, -Hh * .12, L * .32, Hh * .22, Hh * .11); x.restore();
  x.fillStyle = C.INK; x.fillRect(0, -Hh * .56, L * .22, Hh * 1.12);
  x.fillStyle = C.NEWS; for (const k of [.07, .13]) x.fillRect(L * k, -Hh * .56, L * .022, Hh * 1.12);
} }));

// —— 字条 ——
add(strip('year', '1916 — 1924', 46, 'Type', C.INK, C.NEWS, 27));
add(strip('slogan', '剪下来，再贴歪一点', 50, 'Song', C.OCHRE, C.INK, 28));
add(strip('names', 'HÖCH · HAUSMANN · ARP · TZARA', 24, 'Arch', C.NEWS, C.INK, 29, { ls: 3 }));
add(strip('non', 'NON', 70, 'Anton', C.RED, C.NEWS, 33));

// —— 十二块方纸（偶然那一章的主角；后来变成界面上的小方块）——
const SQ = [C.RED, C.BLUE, C.INK, C.NEWS, C.PINK, C.PHOTO, C.NEWS, C.RED, C.PHOTO, C.INK, C.NEWS, C.BLUE];
SQ.forEach((fill, i) => add(makeScrap({ id: 'q' + i, w: 150, h: 150, fill, seed: 60 + i, tear: i % 3 === 1 ? 4 : 0, k: .05,
  paint: fill === C.PHOTO ? (x, w, h) => halftone(x, w, h, (X, Y) => .1 + .8 * Y / h, 10) : fill === C.NEWS ? x => columns(x, 12, 26, 150, 9, 80 + i, 12) : null })));

// —— 一条报纸标题，会被剪成七个词（查拉那一章）。k = 0：切口是直的，没剪开之前拼在一起看不出缝 ——
export const HEAD = ['明天的', '报纸', '说', '月亮', '今晚', '打折', '出售'];
export const WSIZE = 64, WF = `900 ${WSIZE}px Song`;
HEAD.forEach((s, i) => {
  const w = Math.ceil(tw(s, WF) + 34), h = 104;
  const sc = add(makeScrap({ id: 'w' + i, w, h, fill: i % 2 ? '#EFE7D4' : C.NEWS, seed: 90 + i, k: 0, bleed: true, pad: 4,
    paint: x => { txt(x, s, 17, h / 2 + WSIZE * .35, WF, C.INK); x.fillStyle = '#8c8372'; x.fillRect(0, 5, w, 2); x.fillRect(0, h - 7, w, 2); } }));
  sc.word = s;
});

// —— 纸袋（前后两片，词掉进中间）——
const zig = (w, h, n, d, y0 = 0) => { const p = [[0, y0]]; for (let i = 0; i < n; i++) p.push([(i + .5) * w / n, y0 + d], [(i + 1) * w / n, y0]); p.push([w - 26, h], [26, h]); return polyPath(p); };
add(makeScrap({ id: 'bagB', w: 430, h: 330, fill: '#A98556', path: zig(430, 330, 12, 16), pad: 4, back: false }));
add(makeScrap({ id: 'bagF', w: 430, h: 300, fill: C.KRAFT, path: zig(430, 300, 12, 16), pad: 4, back: false,
  paint: (x, w, h) => { txt(x, 'TZARA', w / 2, 150, '84px Anton', '#7a5a30', 'center', 6); txt(x, '1920', w / 2, 214, '44px Type', '#7a5a30', 'center', 4); } }));

// —— 今天：手机（先有容器，纸片再落进去）和几张界面纸条 ——
add(makeScrap({ id: 'phone', w: 440, h: 900, free: true, pad: 8, paint: (x, w, h) => {
  x.fillStyle = C.INK; x.beginPath(); x.roundRect(0, 0, w, h, 62); x.fill();
  x.fillStyle = C.PAPER; x.beginPath(); x.roundRect(14, 14, w - 28, h - 28, 48); x.fill();
  x.fillStyle = C.INK; x.beginPath(); x.roundRect(w / 2 - 56, 26, 112, 28, 14); x.fill();
  txt(x, '21:07', 42, 50, '19px Arch', C.INK); txt(x, '100%', w - 42, 50, '19px Arch', C.INK, 'right');
} }));
add(makeScrap({ id: 'ticket', w: 372, h: 230, fill: C.RED, seed: 70, tear: 3, paint: (x, w, h) => {
  txt(x, 'ADMIT', 196, 150, '44px Anton', C.NEWS, 'left', 2); txt(x, 'ONE', 196, 208, '58px Abril', C.INK);
  txt(x, 'TONIGHT · NR. 000316', 20, 38, '19px Type', C.NEWS, 'left', 1);
  x.strokeStyle = C.NEWS; x.lineWidth = 3; x.setLineDash([3, 9]); x.beginPath(); x.moveTo(14, 54); x.lineTo(w - 14, 54); x.stroke();
} }));
add(strip('btn', 'GET TICKETS', 30, 'Arch', C.INK, C.NEWS, 56, { ls: 1, padx: 44, hk: 2.1 }));
[['row0', '20:00  UMBA UMBA', C.NEWS, C.INK], ['row1', '21:30  KRRR KOLLEKTIV', C.OCHRE, C.INK], ['row2', '23:00  HAT TRICK', C.INK, C.NEWS]].forEach(([id, s, fill, col], i) =>
  add(strip(id, s, 27, 'Anton', fill, col, 80 + i, { ls: 1, padx: 18, hk: 2.2, tear: i === 1 ? 3 : 0 })));
