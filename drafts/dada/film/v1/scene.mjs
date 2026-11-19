// 达达 · 场景：全片只有一批纸片，每一章是它们落成的另一张拼贴。
// 签名物理：纸片从空中“啪”地拍下来——抛物线落地（落地那一帧速度最大）、影子随高度变远变虚、落定后角度抖两下。
// 每一帧是帧号的纯函数：render(ctx, t)。时间轴 120 BPM，一拍 30 帧。
import { C, D, W, H, clamp, lerp, prog, eio, eo, hash, rng, createCanvas, makeScrap, strip, txt, tw, texture } from './kit.mjs';
import { S, HEAD } from './pool.mjs';

export const END = 1200, BEAT = 30;
const add = sc => { S[sc.id] = sc; return sc; };
add(strip('sign', '观默 @guanmo_ai', 40, 'Arch, Hei', C.INK, C.NEWS, 99, { padx: 26 }));
add(strip('r1', '01  每个字，换一种字体', 44, 'Anton, Hei', C.INK, C.NEWS, 101, { padx: 26 }));
add(strip('r2', '02  每张纸，歪 3—9°', 44, 'Anton, Hei', C.RED, C.NEWS, 102, { padx: 26 }));
add(strip('r3', '03  影子越远，纸越高', 44, 'Anton, Hei', C.OCHRE, C.INK, 103, { padx: 26 }));

// ———————————————————— 站点：每张纸片依次落到哪 ————————————————————
const ST = {}, ORDER = {};
let ordN = 0;
const P = (x, y, r = 0, s = 1, more = {}) => ({ x, y, r, s, fx: 1, z: 0, ...more });
const BG_IDS = ['kraft', 'circle', 'bar', 'news1', 'news2'];
function go(id, f, pose, o = {}) {
  if (!(id in ORDER)) ORDER[id] = ordN++;
  (ST[id] ??= []).push({ f, dur: 26, zmax: 150, turns: 0, spin: 0, top: !BG_IDS.includes(id), face: null, grp: null, thump: 0, quiet: false, layer: null, ...o, pose });
}
const last = id => ST[id][ST[id].length - 1].pose;
// 飞出画面：顺着“从画面中心到它现在的位置”的方向
function off(id, f, o = {}) {
  const p = last(id), k = ORDER[id];
  let ux = p.x - W / 2, uy = p.y - H / 2;
  const L = Math.hypot(ux, uy);
  if (L < 160) { const a = hash(k, 3) * 6.283; ux = Math.cos(a); uy = Math.sin(a); } else { ux /= L; uy /= L; }
  const far = 1350 + Math.max(S[id].w, S[id].h) * p.s * .6;
  go(id, f, P(W / 2 + ux * far, H / 2 + uy * far * .62, p.r + (hash(k, 5) - .5) * 160, p.s, { fx: p.fx }), { dur: 30, zmax: 240, turns: hash(k, 7) > .5 ? 1 : 0, quiet: true, ...o });
}
// 一排连在一起的纸片（报纸标题）
function line(ids, cx, cy, r, s) {
  const tot = ids.reduce((a, id) => a + S[id].w, 0), ca = Math.cos(r * D), sa = Math.sin(r * D);
  let acc = -tot / 2;
  return ids.map(id => { const d = (acc + S[id].w / 2) * s; acc += S[id].w; return P(cx + d * ca, cy + d * sa, r, s); });
}
const WORDS = HEAD.map((_, i) => 'w' + i), SQS = Array.from({ length: 12 }, (_, i) => 'q' + i), CARDS = ['D1', 'A1', 'D2', 'A2'];

// —— 标题拼贴（第 0 帧 = 封面；片尾回到这里）——
const sqTitle = (() => {
  const r = rng(77), out = [];
  while (out.length < 12) {
    const x = 990 + r() * 880, y = 70 + r() * 960;
    if (Math.hypot(x - 1300, y - 440) < 300 || Math.hypot(x - 1590, y - 810) < 230 || Math.hypot(x - 1440, y - 96) < 120 || out.some(q => Math.hypot(q.x - x, q.y - y) < 130)) continue;
    out.push(P(x, y, (r() - .5) * 50, .36));
  }
  return out;
})();
const TITLE = {
  kraft: P(1440, 560, 4), news1: P(350, 905, -4), news2: P(1690, 190, 7), bar: P(1400, 650, -27), circle: P(1300, 470),
  gearL: P(1050, 800, 10), gearS: P(1236, 944, 4), eye: P(1300, 440, -5), lips: P(1590, 810, 9), qm: P(1770, 400, 14, .8), non: P(1090, 560, -82),
  D1: P(185, 262, -7), A1: P(396, 244, 5), D2: P(606, 276, -4), A2: P(816, 300, 8), H1: P(250, 590, 4), H2: P(540, 600, -6),
  year: P(250, 800, -3), slogan: P(450, 892, 2), names: P(400, 990, -1), tag: P(884, 648, 6), hand: P(1745, 610, 5, 1, { fx: -1 }),
};
const headTitle = line(WORDS, 1440, 96, -3, .62);
const TORDER = ['kraft', 'news1', 'news2', 'bar', 'circle', 'gearL', 'gearS', 'eye', 'lips', 'non', 'qm', ...SQS, ...WORDS, 'D1', 'A1', 'D2', 'A2', 'H1', 'H2', 'year', 'slogan', 'names', 'hand', 'tag'];
const titlePose = id => TITLE[id] ?? (id[0] === 'q' ? sqTitle[+id.slice(1)] : headTitle[+id.slice(1)]);
for (const id of TORDER) go(id, -1, titlePose(id), { quiet: true, grp: id[0] === 'w' ? 'head' : null });
// 第 0 帧有四样东西还在半空（封面上看得出“正在贴”），0.6 秒内依次拍下来
const enter = (id, f, dur, zmax, from, thump = 0) => Object.assign(ST[id][0], { f, dur, zmax, from, quiet: false, thump });
enter('A2', 7, 26, 190, P(880, 250, 26, 1.12), 1);
enter('tag', 16, 32, 210, P(1010, 560, 22, 1), 1);
enter('qm', 25, 36, 200, P(1860, 300, 40, .86), .6);
enter('hand', 36, 38, 120, P(2200, 560, 20, 1, { fx: -1 }));
go('w0', 53, P(headTitle[0].x - 16, headTitle[0].y + 76, -17, .62), { dur: 8, zmax: 8 });   // 第三剪：第一个词掉下来
// 不在标题里的：先停在画面外
for (const [id, p] of [['bagB', P(1060, 1500)], ['bagF', P(1060, 1500)], ['phone', P(1420, -700, -14)], ['ticket', P(2300, 200, 30)], ['row0', P(2300, 500, -20)], ['row1', P(2300, 600, 20)],
  ['row2', P(2300, 700, -15)], ['btn', P(2300, 900, 25)], ['r1', P(-600, 640, -20)], ['r2', P(-600, 770, 18)], ['r3', P(-600, 900, -16)], ['sign', P(2400, 1300, 30)]]) go(id, -1, p, { quiet: true });

// —— 01 剪：照片蒙太奇（90—330）——
const st = (i, n, a, b) => a + (b - a) * i / Math.max(1, n - 1);
['D1', 'A1', 'D2', 'A2', 'H1', 'H2', 'tag', 'year', 'slogan', 'names', ...SQS].forEach((id, i, a) => off(id, st(i, a.length, 92, 118), { dur: 30 - (i % 3) * 2 }));
line(WORDS, 960, -170, 2, .62).forEach((p, i) => go(WORDS[i], 100, p, { dur: 30, zmax: 120, quiet: true, grp: 'head' }));
const EYE1 = P(1070, 440, -4, 1.45);
go('kraft', 96, P(1080, 580, -3, .98), { dur: 30, zmax: 90 });
go('bar', 105, P(1080, 650, 24, .86), { dur: 30 });
go('circle', 120, P(1085, 480, 0, 1.06), { dur: 32, thump: 1 });
go('gearL', 127, P(800, 330, 40, .9), { dur: 34, spin: 1 });
go('gearS', 134, P(1380, 600, -30, .95), { dur: 34, spin: -1 });
go('non', 139, P(745, 720, -80), { dur: 30, turns: 1 });
go('qm', 143, P(1440, 250, 12, .9), { dur: 30, turns: 1 });
go('eye', 150, EYE1, { dur: 36, zmax: 230, thump: 1.4, cut: true });
go('lips', 165, P(1100, 800, 5, .8), { dur: 34, zmax: 180, turns: 1 });
go('hand', 180, P(1520, 815, -6, .9, { fx: -1 }), { dur: 30 });
export const CUT = { a: 195, b: 240, shift: 240 };   // 剪刀从左走到右；剪完那一拍，下半张错位

// —— 02 偶然（330—570）：十二块方纸从上面掉下来，落在哪，就贴在哪 ——
['bar', 'circle', 'gearL', 'gearS', 'non', 'qm', 'eye', 'lips', 'hand'].forEach((id, i, a) => off(id, st(i, a.length, 334, 352), { dur: 28 }));
ST.eye[ST.eye.length - 1].cut = true;
go('kraft', 330, P(1090, 572, 2, 1.0), { dur: 26, zmax: 60, thump: 1 });
function scatter(seed) {
  const r = rng(seed), out = [];
  let guard = 0;
  while (out.length < 12 && guard++ < 20000) {
    const x = 735 + r() * 710, y = 200 + r() * 745;
    if (out.some(q => Math.hypot(q.x - x, q.y - y) < 158)) continue;
    out.push(P(x, y, (r() - .5) * 50, 1.18));
  }
  if (out.length < 12) throw new Error('方纸没排下');
  return out;
}
export const SEEDS = [7, 12], TOSS = 450;
const SC1 = scatter(SEEDS[0]), SC2 = scatter(SEEDS[1]);
SQS.forEach((id, i) => {
  const p = SC1[i], L = 345 + i * 7.5;
  go(id, L - 31, P(p.x + (hash(i, 1) - .5) * 300, -210, p.r + 140 * (hash(i, 2) - .5), 1.18), { dur: 0, zmax: 0, quiet: true });   // 悄悄挪到画面上方
  go(id, L, p, { dur: 30, zmax: 260, turns: 1 + (i % 2) });
  go(id, TOSS + 30 + i * 2.5, SC2[i], { dur: 30, zmax: 230, turns: 1, spin: i % 2 ? 1 : -1 });   // 一起抛起来，换一个种子再落一次
});

// —— 03 词（540—840）：剪开一条标题，放进袋子，摇一摇，按抽出的顺序贴 ——
SQS.forEach((id, i) => off(id, 540 + i * 1.5, { dur: 26 }));
off('kraft', 540, { dur: 28, turns: 0 });
const HEAD3 = line(WORDS, 1060, 310, 0, 1.2);
HEAD3.forEach((p, i) => go(WORDS[i], 540, p, { dur: 26, zmax: 120, grp: 'head', thump: i === 3 ? 1 : 0, quiet: i !== 3 }));
export const SNIPS = [555, 570, 585, 600, 615, 630];
WORDS.forEach((id, i) => {
  const L = (i < 6 ? SNIPS[i] : SNIPS[5]) + 7, p = HEAD3[i];
  go(id, L, P(p.x + (i - 3) * 9, p.y + 22 + hash(i, 9) * 26, (hash(i, 4) - .5) * 13, 1.2), { dur: 7, zmax: 26, grp: null });   // 剪下来的那一段往下一跳
});
go('bar', 638, P(1060, 452, -24, 1.28), { dur: 30, zmax: 40 });
go('circle', 642, P(1060, 452, 0, 1.78), { dur: 30, zmax: 60, thump: 1.2 });
go('bagB', 648, P(1060, 905, 0, 1), { dur: 22, zmax: 40, layer: 500, top: false, quiet: true });
go('bagF', 648, P(1060, 920, 0, 1), { dur: 22, zmax: 40, layer: 520, top: false, thump: 1 });
WORDS.forEach((id, i) => go(id, 654 + i * 3, P(1060 + (hash(i, 6) - .5) * 150, 895 + hash(i, 8) * 40, (hash(i, 3) - .5) * 80, .7), { dur: 20, zmax: 120, turns: 1, layer: 510, top: false, kind: 'in' }));
export const SHAKE = { f: 676, dur: 24 };
export const DRAW = [3, 2, 5, 0, 6, 1, 4];   // 抽出来的顺序：月亮 / 说 / 打折 / 明天的 / 出售 / 报纸 / 今晚
const POEM = [[3, 2, 5], [0, 6], [1, 4]];
const poemPose = {};
POEM.forEach((row, j) => { const ids = row.map(i => 'w' + i); line(ids, 1060 + (j - 1) * 40, 268 + j * 178, [-4, 3, -2.5][j], 1.55).forEach((p, k) => { poemPose[row[k]] = P(p.x + k * 14 - (row.length - 1) * 7, p.y + (hash(row[k], 2) - .5) * 14, p.r + (hash(row[k], 5) - .5) * 7, 1.55); }); });
DRAW.forEach((i, k) => go('w' + i, 722 + k * 7, poemPose[i], { dur: 22, zmax: 210, turns: 1, layer: 600 + k, kind: 'out' }));

// —— 04 今天（840—1080）：同一批纸落进手机；三条规则，每条自己演示自己 ——
off('bagB', 846, { dur: 20, top: false, layer: 500 }); off('bagF', 846, { dur: 20, top: false, layer: 520 }); off('circle', 850, { dur: 28 }); off('bar', 848, { dur: 28 });
line(WORDS, 960, -170, -2, .62).forEach((p, i) => go(WORDS[i], 852 + i, p, { dur: 26, zmax: 160, quiet: true, turns: 1 }));
go('phone', 846, P(1430, 560, 2, 1), { dur: 24, zmax: 200, thump: 1.4 });
go('ticket', 856, P(1432, 300, -3, 1), { dur: 24, turns: 1 });
go('row0', 866, P(1430, 500, 2, 1), { dur: 22 }); go('row1', 874, P(1434, 584, -2, 1), { dur: 22 }); go('row2', 882, P(1428, 668, 1.5, 1), { dur: 22 });
go('btn', 892, P(1430, 820, -2, 1), { dur: 24, turns: 1 });
go('hand', 902, P(1752, 826, 3, .84, { fx: -1 }), { dur: 30 });
const CX = [185, 415, 645, 875], CY = 462, CS = .95;
CARDS.forEach((id, i) => go(id, 850 + i * 8, P(CX[i], CY, 0, CS), { dur: 28, turns: 1 }));
export const RULES = [900, 960, 1020];
go('r1', RULES[0], P(506, 716, -2, 1), { dur: 22, thump: 1 });
CARDS.forEach((id, i) => go(id, RULES[0] + 12 + i * 8, P(CX[i], CY, 0, CS), { dur: 16, zmax: 110, turns: 1, face: 1 }));          // 规则 01：翻过来，换了一种字体
go('r2', RULES[1], P(486, 818, 1.5, 1), { dur: 22, thump: 1 });
export const TILT = [-9, 6, -4, 8];
CARDS.forEach((id, i) => go(id, RULES[1] + 8 + i * 7, P(CX[i], CY + [6, -8, 10, -4][i], TILT[i], CS), { dur: 10, zmax: 46, face: 1 }));  // 规则 02：每张歪一个角度
go('r3', RULES[2], P(498, 920, -1.5, 1), { dur: 22, thump: 1 });
export const LIFT = 130;
CARDS.forEach((id, i) => {
  go(id, RULES[2] + 10 + i * 2, P(CX[i], CY + [6, -8, 10, -4][i], TILT[i], CS, { z: LIFT }), { dur: 12, zmax: 0, face: 1, quiet: true });   // 规则 03：抬起来，影子就远了
  go(id, RULES[2] + 42 + i * 3, P(CX[i], CY + [6, -8, 10, -4][i], TILT[i] * .6, CS), { dur: 7, zmax: 0, face: 1, thump: i === 0 ? .8 : 0 });
});

// —— 片尾（1080—1200）：全部飞回标题那张拼贴，最后署名拍下来 ——
['phone', 'ticket', 'row0', 'row1', 'row2', 'btn', 'r1', 'r2', 'r3'].forEach((id, i) => off(id, 1096 + i * 2, { dur: 26 }));
const BACK = ['kraft', 'bar', 'circle', 'gearL', 'gearS', 'eye', 'lips', 'non', 'qm', ...SQS, 'D1', 'A1', 'D2', 'A2', 'H1', 'H2', 'year', 'slogan', 'names'];
BACK.forEach((id, i) => {
  const L = Math.round(st(i, BACK.length, 1094, 1146)), p = titlePose(id);
  if (id === 'kraft' || id === 'circle') go(id, L - 31, P(p.x + 300, -700, 30, p.s), { dur: 0, zmax: 0, quiet: true });
  go(id, L, p, { dur: 30, zmax: 200, turns: 'D1A1D2A2H1H2'.includes(id) || id[0] === 'q' ? 1 : 0, face: 0, thump: id === 'eye' ? 1 : 0 });
});
headTitle.forEach((p, i) => go(WORDS[i], 1118, p, { dur: 28, zmax: 140, grp: 'head', quiet: i !== 0 }));
go('hand', 1140, TITLE.hand, { dur: 30 });
go('tag', 1150, TITLE.tag, { dur: 30, zmax: 210, turns: 1, thump: 1 });
go('sign', 1170, P(1640, 1004, -3, 1.15), { dur: 26, zmax: 220, turns: 1, thump: 1.6, layer: 900 });

for (const id in ST) { const a = ST[id]; for (let i = 1; i < a.length; i++) if (a[i].f - a[i].dur < a[i - 1].f - 1e-6 && a[i - 1].f > 0) throw new Error(`${id}: 第 ${i} 站在上一站落地（${a[i - 1].f}）之前就出发了（${a[i].f - a[i].dur}）`); }

// ———————————————————— 一张纸片在第 t 帧的姿态 ————————————————————
function poseAt(id, t) {
  const a = ST[id];
  let i = 0;
  for (let k = 0; k < a.length; k++) if (a[k].f - a[k].dur <= t) i = k;
  const s = a[i], B = s.pose, base = ORDER[id];
  const lay = s.layer ?? base;
  if (t >= s.f) {                                  // 落定：角度抖两下，压一下再回弹
    const u = t - s.f, live = s.f > 0 && s.zmax + Math.abs(B.z - (a[i - 1]?.pose.z ?? 0)) > 0;
    const k = hash(base, i) > .5 ? 1 : -1, amp = live ? Math.min(4.2, 1.6 + s.zmax / 80) : 0;
    return { x: B.x, y: B.y, r: B.r + k * amp * Math.exp(-u / 5) * Math.cos(u * .85 + .4), s: B.s * (1 - (live ? .04 : 0) * Math.exp(-u / 3)), fx: B.fx, z: B.z, cos: 1, face: s.face, lay, grp: s.grp, st: s, fly: false };
  }
  const A = i ? a[i - 1].pose : (s.from ?? B), p = clamp((t - (s.f - s.dur)) / Math.max(s.dur, 1e-6)), e = eio(p);
  const ang = 6.2832 * s.turns * e, z = lerp(A.z, B.z, e) + s.zmax * 4 * p * (1 - p);
  const prevFace = i ? a[i - 1].face : s.face;
  return { x: lerp(A.x, B.x, e), y: lerp(A.y, B.y, e), r: lerp(A.r, B.r + 360 * s.spin, e) - (s.spin ? 360 * s.spin * (e === 1 ? 1 : 0) : 0), s: lerp(A.s, B.s, e), fx: B.fx, z, cos: Math.cos(ang),
    face: p < .5 ? prevFace : s.face, lay: s.top && z > 14 ? lay + 1000 + z * .001 : lay, grp: z < 1 ? s.grp : null, st: s, fly: true };
}

// ———————————————————— 剪刀 ————————————————————
const SCK = [  // [帧, 刀尖 x, y, 角度, 大小]。刀尖朝右 = 180°；相邻两帧的关键帧 = 在画面外瞬移
  [0, 1238, 78, 135, 1.1], [52, 1238, 78, 135, 1.1], [86, 2300, -200, 150, 1.1], [149, 2300, -200, 150, 1.1],
  [150, -420, 640, 176, 1.5], [178, 420, 500, 176, 1.5], [CUT.a, 679 - 26, 467 + 2, 176, 1.5], [CUT.b, 1461 + 44, 413 - 3, 176, 1.5], [272, 2500, 260, 158, 1.5], [499, 2500, 260, 158, 1.5],
  [500, 200, 1400, 90, 1.3], ...SNIPS.map((f, i) => [f, HEAD3[i].x + S['w' + i].w * .6, 310 - 34, 90, 1.3]), [664, 1960, 1500, 60, 1.3], [1200, 1960, 1500, 60, 1.3]];
export const SNAPS = [15, 30, 45, ...Array.from({ length: 6 }, (_, i) => CUT.a + 7.5 + i * 7.5), ...SNIPS];
function scissorsAt(t) {
  let i = 0;
  while (i < SCK.length - 2 && SCK[i + 1][0] <= t) i++;
  const a = SCK[i], b = SCK[i + 1], e = b[0] - a[0] <= 1 ? 0 : eio(prog(t, a[0], b[0])), hop = SNIPS.includes(a[0]) && SNIPS.includes(b[0]);
  let open = .55;
  for (const f of SNAPS) { const u = t - f; if (u > -7 && u <= 0) open = Math.min(open, 1 * Math.pow(-u / 7, .6)); else if (u > 0 && u < 6) open = Math.min(open, u / 6 * .55); if (u > -13 && u <= -7) open = Math.max(open, lerp(.55, 1, (u + 13) / 6)); }
  return { x: lerp(a[1], b[1], e), y: lerp(a[2], b[2], e) + (hop ? 150 * Math.sin(Math.PI * e) : 0), r: lerp(a[3], b[3], e), s: lerp(a[4], b[4], e), open };
}
function drawScissors(x, o, shadow) {
  const blade = sg => { x.beginPath(); x.moveTo(0, 0); x.lineTo(-186, -13 * sg * 0); x.lineTo(-170, 14 * sg); x.lineTo(-10, 16 * sg); x.closePath(); x.fill(); };
  x.save(); x.translate(o.x + (shadow ? 14 : 0), o.y + (shadow ? 24 : 0)); x.rotate(o.r * D); x.scale(o.s, o.s); x.translate(170, 0);   // 原点在刀尖，轴在后面 170
  x.fillStyle = shadow ? 'rgba(35,21,3,.26)' : C.INK; x.strokeStyle = x.fillStyle; x.lineCap = 'round';
  for (const sg of [1, -1]) {
    x.save(); x.rotate(sg * o.open * 17 * D);
    x.beginPath(); x.moveTo(-174, 0); x.lineTo(8, -sg * 15); x.lineTo(14, sg * 4); x.closePath(); x.fill();
    x.lineWidth = 13; x.beginPath(); x.moveTo(6, -sg * 4); x.lineTo(56, -sg * 34); x.stroke();
    x.lineWidth = 12; x.beginPath(); x.ellipse(84, -sg * 50, 31, 22, -sg * 28 * D, 0, 6.2832); x.stroke();
    x.restore();
  }
  if (!shadow) { x.fillStyle = C.PAPER; x.beginPath(); x.arc(0, 0, 5.5, 0, 6.2832); x.fill(); }
  x.restore();
}

// ———————————————————— 画一张纸片 ————————————————————
const LIGHT = [.5, .86];   // 光从左上来：影子往右下
function xform(x, it, dx = 0, dy = 0) { x.translate(it.x + dx, it.y + dy); x.rotate(it.r * D); x.scale(it.s * it.fx * it.cos * (1 + it.z * .0011), it.s * (1 + it.z * .0011)); }
function drawShadow(x, it) {
  const sc = it.sc, zn = clamp(it.z / 170), d = 5 + it.z * .62, a = (.5 - .22 * zn) * Math.min(1, Math.abs(it.cos) * 3 + .25);
  x.save(); xform(x, it, LIGHT[0] * d, LIGHT[1] * d);
  const X = -sc.w / 2 - sc.sp, Y = -sc.h / 2 - sc.sp, Wd = sc.w + 2 * sc.sp, Ht = sc.h + 2 * sc.sp;
  if (zn < 1) { x.globalAlpha = a * (1 - zn); x.drawImage(sc.sh[0], X, Y, Wd, Ht); }
  if (zn > 0) { x.globalAlpha = a * zn; x.drawImage(sc.sh[1], X, Y, Wd, Ht); }
  x.restore();
}
function img(x, sc, im) { x.drawImage(im, -sc.w / 2 - sc.pad, -sc.h / 2 - sc.pad, sc.w + 2 * sc.pad, sc.h + 2 * sc.pad); }
function drawFace(x, it, t) {
  const sc = it.sc, back = it.cos < 0 && sc.back;
  const im = back ? sc.back : (sc.faces && it.face != null ? sc.faces[it.face] : sc.face);
  x.save(); xform(x, it);
  if (it.id === 'eye' && it.st.cut && t > CUT.a) {          // 01：被剪开的那张照片
    const cp = prog(t, CUT.a, CUT.b), u = t - CUT.shift;
    const k = u > 0 ? 1 - Math.exp(-u / 3.2) * Math.cos(u * .8) : 0;       // 错位：弹簧到位（略过冲）
    const w = sc.w, h = sc.h, pd = sc.pad;
    x.save(); x.beginPath(); x.rect(-w / 2 - pd, -h / 2 - pd, w + 2 * pd, h / 2 + pd); x.clip(); x.rotate(-1.2 * D * k); img(x, sc, im); x.restore();
    x.save(); x.translate(w * CUTK * k, 9 * k); x.beginPath(); x.rect(-w / 2 - pd, 0, w + 2 * pd, h / 2 + pd); x.clip(); img(x, sc, im); x.restore();
    if (k < .02) { x.strokeStyle = 'rgba(22,19,15,.9)'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(-w / 2 - 2, 0); x.lineTo(-w / 2 + (w + 4) * cp, 0); x.stroke(); }
  } else img(x, sc, im);
  const dark = Math.sqrt(1 - it.cos * it.cos) * .34 + (back ? .05 : 0);         // 翻到侧面时暗一点
  if (dark > .01) { x.globalAlpha = dark; img(x, sc, sc.sil); }
  x.restore();
}
export const CUTK = .12;

// ———————————————————— 底纸、镜头、外框 ————————————————————
const BG = createCanvas(W + 240, H + 160);
{ const x = BG.getContext('2d'); x.fillStyle = C.PAPER; x.fillRect(0, 0, BG.width, BG.height); texture(x, 0, 0, BG.width, BG.height, 1.1);
  const g = x.createRadialGradient(BG.width / 2, BG.height / 2, 500, BG.width / 2, BG.height / 2, 1250); g.addColorStop(0, 'rgba(60,40,10,0)'); g.addColorStop(1, 'rgba(60,40,10,.16)'); x.fillStyle = g; x.fillRect(0, 0, BG.width, BG.height); }
export const CH = [0, 90, 330, 540, 840, 1080, END];
export const THUMPS = [];
for (const id in ST) for (const s of ST[id]) if (s.thump && s.f > 0) THUMPS.push([s.f, s.thump]);
THUMPS.push([CUT.shift, 1]);
function camera(t) {
  let i = 0; while (i < CH.length - 2 && CH[i + 1] <= t) i++;
  const u = prog(t, CH[i], CH[i + 1]), w = i === CH.length - 2 ? u : (u < .86 ? u / .86 : 1 - eio((u - .86) / .14));
  let dy = 0; for (const [f, k] of THUMPS) { const q = t - f; if (q >= 0 && q < 26) dy += 7 * k * Math.exp(-q / 4.5) * Math.cos(q * .5); }
  return { z: Math.exp(lerp(Math.log(1.012), Math.log(1.046), w)), x: 7 * Math.sin(t / 150), y: dy + 4 * Math.sin(t / 110 + 1) };
}

// 打字机：每 rate 帧落定一个字；登记给配乐（一字一声）
export const CUES = [];
const cueSeen = new Set();
function typed(x, s, X, Y, font, col, t, f0, rate = 1.4, kind = 'type') {
  const chars = [...s], key = f0 + '|' + s;
  if (!cueSeen.has(key)) { cueSeen.add(key); CUES.push([f0, chars.filter(c => c !== ' ').length, rate, kind]); }
  const n = Math.floor((t - f0) / rate);
  if (n <= 0) return;
  txt(x, chars.slice(0, n).join(''), X, Y, font, col);
  if (n < chars.length) { const wd = tw(chars.slice(0, n).join(''), font); x.fillStyle = C.RED; x.fillRect(X + wd + 3, Y - parseInt(font.match(/(\d+)px/)[1]) * .82, 5, parseInt(font.match(/(\d+)px/)[1]) * .96); }
}
// 一条拍上去的纸条（外框和标注都用它）：从 1.5 倍压到 1，离场往左甩出去
function slap(x, t, f0, f1, cx, cy, w, h, rot, fill, draw) {
  if (t < f0 - 5 || t > f1 + 16) return;
  const u = t - f0, k = u < 0 ? 1 + .5 * Math.pow(-u / 5, 1.4) : 1 - .035 * Math.exp(-u / 3), q = Math.max(0, t - f1), dx = -q * q * 9;
  const wob = u >= 0 ? 2.4 * Math.exp(-u / 5) * Math.cos(u * .85) : 0, d = 5 + (k - 1) * 150;
  x.save(); x.translate(cx + dx, cy); x.rotate((rot + wob) * D); x.scale(k, k);
  x.fillStyle = `rgba(35,21,3,${.36 - (k - 1) * .3})`; x.fillRect(-w / 2 + LIGHT[0] * d, -h / 2 + LIGHT[1] * d, w, h);
  x.fillStyle = fill; x.fillRect(-w / 2, -h / 2, w, h);
  if (u >= 0) draw(-w / 2, -h / 2);
  x.restore();
}
const HUD = [
  { f0: 122, f1: 316, n: '01', t: '剪 CUT', s: 'Hannah Höch · 照片蒙太奇 · 1919' },
  { f0: 332, f1: 526, n: '02', t: '偶然 CHANCE', s: 'Jean Arp · 按偶然的法则排列 · 1916—17' },
  { f0: 542, f1: 826, n: '03', t: '词 WORDS', s: 'Tristan Tzara · 做一首达达诗 · 1920' },
  { f0: 842, f1: 1070, n: '04', t: '今天 TODAY', s: '三条规则，拿走就能用' }];
const NF = '700 34px Type, Sans';
const NOTES = [   // [出现, 离场, 左 x, y, 角度, 文字, 底色, 字色]
  [246, 318, 70, 520, -2, '切口错位 12%', C.NEWS, C.INK], [258, 318, 70, 610, 1.5, '比例故意不对', C.INK, C.NEWS], [270, 318, 70, 700, -1, '眼 ×1.45   嘴 ×0.8', C.NEWS, C.INK],
  [350, 446, 70, 430, -2, 'seed 07', C.RED, C.NEWS], [366, 524, 70, 610, 1.5, 'x, y = random()', C.NEWS, C.INK], [390, 524, 70, 700, -1, '角度 = ±25°', C.NEWS, C.INK], [414, 524, 70, 790, 1, '落在哪，贴在哪', C.INK, C.NEWS],
  [456, 524, 70, 430, 2, 'seed 12', C.RED, C.NEWS],
  [556, 822, 70, 470, -2, '① 剪开标题', C.NEWS, C.INK], [650, 822, 70, 560, 1.5, '② 放进袋子，摇', C.NEWS, C.INK], [722, 826, 70, 650, -1, '③ 按抽出的顺序贴', C.INK, C.NEWS]];

function hud(x, t) {
  for (const h of HUD) {
    slap(x, t, h.f0, h.f1, 70 + 46, 96, 92, 92, -3, C.INK, (X, Y) => txt(x, h.n, X + 46, Y + 68, '58px Anton', C.NEWS, 'center'));
    const w1 = tw(h.t, '900 50px Arch, Hei') + 44;
    slap(x, t, h.f0 + 4, h.f1 + 2, 172 + w1 / 2, 86, w1, 76, 1.5, C.NEWS, (X, Y) => typed(x, h.t, X + 22, Y + 56, '900 50px Arch, Hei', C.INK, t, h.f0 + 4, 1.6, 'title'));
    const w2 = tw(h.s, '700 30px Type, Sans') + 36;
    slap(x, t, h.f0 + 12, h.f1 + 4, 76 + w2 / 2, 178, w2, 54, -1, C.OCHRE, (X, Y) => typed(x, h.s, X + 18, Y + 38, '700 30px Type, Sans', C.INK, t, h.f0 + 12, 1.1, 'small'));
    slap(x, t, h.f0 + 8, h.f1 + 6, W - 150, 84, 190, 66, 2, C.INK, (X, Y) => { txt(x, h.n, X + 20, Y + 49, '44px Anton', C.OCHRE); txt(x, '/ 04', X + 84, Y + 49, '44px Anton', C.NEWS); });
  }
  for (const [f0, f1, X0, Y0, r, s, fill, col] of NOTES) { const w = tw(s, NF) + 40; slap(x, t, f0, f1, X0 + w / 2, Y0, w, 62, r, fill, (X, Y) => typed(x, s, X + 20, Y + 43, NF, col, t, f0, 1.3)); }
  // 规则 02：每张卡片头上标它歪了几度；规则 03：标抬起来的高度
  CARDS.forEach((id, i) => {
    const f0 = RULES[1] + 8 + i * 7;
    slap(x, t, f0, 1016, CX[i], 258, 104, 54, TILT[i] * .5, C.RED, (X, Y) => txt(x, (TILT[i] > 0 ? '+' : '−') + Math.abs(TILT[i]) + '°', X + 52, Y + 39, '34px Anton', C.NEWS, 'center'));
  });
  slap(x, t, RULES[2] + 16, 1072, 530, 256, 420, 58, -1.5, C.NEWS, (X, Y) => typed(x, `离纸 ${LIFT}px · 影子 ${Math.round(5 + LIFT * .62)}px`, X + 18, Y + 41, '700 30px Type, Sans', C.INK, t, RULES[2] + 16, 1.2));
}

// ———————————————————— 一帧 ————————————————————
export function render(x, t, o = {}) {
  const cam = camera(t);
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.translate(W / 2 + cam.x, H / 2 + cam.y); x.scale(cam.z, cam.z); x.translate(-W / 2, -H / 2);
  x.drawImage(BG, -120, -80);
  const list = [];
  for (const id in ST) {
    const it = poseAt(id, t); it.id = id; it.sc = S[id];
    if (id === 'bagB' || id === 'bagF') { const u = t - SHAKE.f; if (u > 0 && u < SHAKE.dur + 14) { const e = u < SHAKE.dur ? Math.sin(Math.PI * u / SHAKE.dur) : 0, d = Math.exp(-Math.max(0, u - SHAKE.dur) / 4); it.r += 11 * e * Math.sin(u * .59) * d; it.y += -26 * e * Math.abs(Math.sin(u * .59)); it.x += 16 * e * Math.sin(u * .59 + 1); } }
    if (it.st.kind === 'in' && !it.fly) { const u = t - SHAKE.f; if (u > 0 && u < SHAKE.dur) { const e = Math.sin(Math.PI * u / SHAKE.dur); it.y += -60 * e * Math.abs(Math.sin(u * .59 + hash(ORDER[id], 1) * 2)); it.r += 60 * e * Math.sin(u * .4 + ORDER[id]); it.x += 30 * e * Math.sin(u * .59 + ORDER[id]); } }
    if (id === 'hand' && !it.fly) for (const f of [80, 205, 930, 990, 1050]) { const u = t - f; if (u > 0 && u < 16) it.x += it.fx * 24 * Math.sin(Math.PI * u / 16); }   // 手指点一下
    if (it.x < -700 || it.x > W + 700 || it.y < -600 || it.y > H + 600) continue;
    list.push(it);
  }
  list.sort((a, b) => a.lay - b.lay || ORDER[a.id] - ORDER[b.id]);
  const sc = scissorsAt(t);
  for (let i = 0; i < list.length;) {
    let j = i + 1;
    if (list[i].grp) while (j < list.length && list[j].grp === list[i].grp) j++;
    for (let k = i; k < j; k++) drawShadow(x, list[k]);
    for (let k = i; k < j; k++) drawFace(x, list[k], t);
    i = j;
  }
  drawScissors(x, sc, true); drawScissors(x, sc, false);
  if (!o.noHud) hud(x, t);
}

// 给配乐的事件：每张纸片落地的帧、多重、偏左还是偏右
export function events() {
  const land = [];
  for (const id in ST) for (const s of ST[id]) if (s.f > 0 && !s.quiet) land.push({ f: +s.f.toFixed(2), id, w: +(Math.sqrt(S[id].w * S[id].h) * s.pose.s / 300).toFixed(2), pan: +clamp((s.pose.x - W / 2) / (W / 2), -1, 1).toFixed(2), thump: s.thump, kind: s.kind ?? null });
  land.sort((a, b) => a.f - b.f);
  const tmp = createCanvas(W, H).getContext('2d');
  for (let f = 0; f < END; f++) hud(tmp, f);
  return { end: END, beat: BEAT, chapters: CH, land, snaps: SNAPS, cut: CUT, shake: SHAKE, rules: RULES, toss: TOSS, liftoff: 62, cues: CUES.slice().sort((a, b) => a[0] - b[0]) };
}
