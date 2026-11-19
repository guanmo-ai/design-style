// 达达 · 场景（第二版）：全片只有一批纸片，每一章是它们落成的另一张拼贴；每换一章，底下那张大纸被整张撕走，露出另一种颜色。
// 签名物理：纸片从空中“啪”地拍下来——抛物线落地（落地那一帧速度最大）、影子随高度变远变虚、落定后角度抖两下；
// 重的一下会震到桌上别的纸片（离得越远跳得越晚、越低），还会崩出几片纸屑。
// 每一帧是帧号的纯函数：render(ctx, t)。时间轴跟着配乐走：128.63 BPM，一拍 27.987 帧，第 0 拍在第 1.2 帧。
import { C, D, W, H, clamp, lerp, prog, eio, eo, hash, rng, mix, createCanvas, Path2D, strip, txt, tw, texture, halftone } from './kit.mjs';
import { S, HEAD } from './pool.mjs';

export const END = 1072, BEAT = 27.987, OFF = 1.2;
export const fb = b => OFF + b * BEAT;          // 第 b 拍在第几帧
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
  (ST[id] ??= []).push({ f, dur: 24, zmax: 150, turns: 0, spin: 0, top: !BG_IDS.includes(id), face: null, grp: null, thump: 0, quiet: false, layer: null, flutter: 0, ...o, pose });
}
const last = id => ST[id][ST[id].length - 1].pose;
// 飞出画面：顺着“从画面中心到它现在的位置”的方向
function off(id, f, o = {}) {
  const p = last(id), k = ORDER[id];
  let ux = p.x - W / 2, uy = p.y - H / 2;
  const L = Math.hypot(ux, uy);
  if (L < 160) { const a = hash(k, 3) * 6.283; ux = Math.cos(a); uy = Math.sin(a); } else { ux /= L; uy /= L; }
  const far = 1400 + Math.max(S[id].w, S[id].h) * p.s * .6;
  go(id, f, P(W / 2 + ux * far, H / 2 + uy * far * .64, p.r + (hash(k, 5) - .5) * 160, p.s, { fx: p.fx }), { dur: 26, zmax: 240, turns: hash(k, 7) > .5 ? 1 : 0, quiet: true, ...o });
}
function line(ids, cx, cy, r, s) {          // 一排连在一起的纸片（报纸标题）
  const tot = ids.reduce((a, id) => a + S[id].w, 0), ca = Math.cos(r * D), sa = Math.sin(r * D);
  let acc = -tot / 2;
  return ids.map(id => { const d = (acc + S[id].w / 2) * s; acc += S[id].w; return P(cx + d * ca, cy + d * sa, r, s); });
}
const st = (i, n, a, b) => a + (b - a) * i / Math.max(1, n - 1);
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
// 第 0 帧有四样东西还在半空（封面上看得出“正在贴”），0.7 秒内依次拍下来
const enter = (id, f, dur, zmax, from, thump = 0) => Object.assign(ST[id][0], { f, dur, zmax, from, quiet: false, thump });
enter('A2', 7, 26, 190, P(880, 250, 26, 1.12), 1);
enter('tag', 17, 32, 210, P(1010, 560, 22, 1), 1);
enter('qm', fb(1), 36, 200, P(1860, 300, 40, .86), .6);
enter('hand', fb(1.5), 38, 120, P(2200, 560, 20, 1, { fx: -1 }));
go('w0', fb(2) + 8, P(headTitle[0].x - 16, headTitle[0].y + 76, -17, .62), { dur: 8, zmax: 8 });   // 第三剪：第一个词掉下来
for (const [id, p] of [['bagB', P(1080, 1500)], ['bagF', P(1080, 1500)], ['phone', P(1420, -700, -14)], ['ticket', P(2300, 200, 30)], ['row0', P(2300, 500, -20)], ['row1', P(2300, 600, 20)],
  ['row2', P(2300, 700, -15)], ['btn', P(2300, 900, 25)], ['r1', P(-600, 640, -20)], ['r2', P(-600, 770, 18)], ['r3', P(-600, 900, -16)], ['sign', P(2400, 1300, 30)]]) go(id, -1, p, { quiet: true });

// —— 01 剪（第 4—10 拍，红纸）——
['D1', 'A1', 'D2', 'A2', 'H1', 'H2', 'tag', 'year', 'slogan', 'names', 'news1', 'news2', ...SQS].forEach((id, i, a) => off(id, st(i, a.length, 78, 102), { dur: 26 - (i % 3) * 2 }));
line(WORDS, 960, -200, 2, .62).forEach((p, i) => go(WORDS[i], 102, p, { dur: 28, zmax: 120, quiet: true }));
const EYE1 = P(1070, 440, -4, 1.45);
go('kraft', fb(4), P(1080, 580, -3, .98), { dur: 26, zmax: 90, thump: 1 });
go('bar', 120, P(1080, 650, 24, .86));
go('circle', 127, P(1085, 480, 0, 1.06), { thump: .7 });
go('gearL', 134, P(800, 330, 40, .9), { dur: 30, spin: 1 });
go('gearS', 139, P(1380, 600, -30, .95), { dur: 30, spin: -1 });
go('non', 144, P(745, 720, -80), { dur: 26, turns: 1 });
go('qm', 148, P(1440, 250, 12, .9), { dur: 26, turns: 1 });
go('eye', fb(5), EYE1, { dur: 34, zmax: 230, thump: 1.5, cut: true });
go('lips', fb(5.5), P(1100, 800, 5, .8), { dur: 30, zmax: 180, turns: 1 });
go('hand', 166, P(1520, 815, -6, .9, { fx: -1 }), { dur: 28 });
export const CUT = { a: fb(6), b: fb(7.5), shift: fb(8) };   // 剪刀从左走到右；下一拍，下半张错位

// —— 02 偶然（第 10—16 拍，赭黄纸）：十二块方纸飘下来，落在哪，就贴在哪；换个种子再来一次 ——
['bar', 'circle', 'gearL', 'gearS', 'non', 'qm', 'eye', 'lips', 'hand', 'kraft'].forEach((id, i, a) => off(id, st(i, a.length, 270, 288), { dur: 26 }));
ST.eye[ST.eye.length - 1].cut = true;
function scatter(seed) {
  const r = rng(seed), out = [];
  let guard = 0;
  while (out.length < 12 && guard++ < 40000) {
    const x = 700 + r() * 1080, y = 190 + r() * 760;
    if (out.some(q => Math.hypot(q.x - x, q.y - y) < 212)) continue;
    out.push(P(x, y, (r() - .5) * 50, 1.3));
  }
  if (out.length < 12) throw new Error('方纸没排下');
  return out;
}
export const SEEDS = [7, 12], TOSS = fb(13);
const SC1 = scatter(SEEDS[0]), SC2 = scatter(SEEDS[1]);
SQS.forEach((id, i) => {
  const p = SC1[i], L = 292 + i * 5.8;
  go(id, L - 29, P(p.x + (hash(i, 1) - .5) * 260, -230, p.r + 140 * (hash(i, 2) - .5), 1.3), { dur: 0, zmax: 0, quiet: true });   // 悄悄挪到画面上方
  go(id, L, p, { dur: 28, zmax: 250, turns: 1 + (i % 2), flutter: 1 });
  go(id, fb(14) + i * 2, SC2[i], { dur: 28, zmax: 250, turns: 1, spin: i % 2 ? 1 : -1 });   // 一起抛起来，换一个种子再落一次
  off(id, 440 + i * 1.3, { dur: 24 });
});

// —— 03 词（第 16—24 拍，黑纸）：鼓停的两拍剪标题、放进袋子；鼓回来那一下，词一个个蹦出来贴成诗 ——
const HEAD3 = line(WORDS, 1080, 300, 0, 1.2);
HEAD3.forEach((p, i) => go(WORDS[i], fb(16.25), p, { dur: 24, zmax: 120, grp: 'head', thump: i === 3 ? 1 : 0, quiet: i !== 3 }));
export const SNIPS = [0, 1, 2, 3, 4, 5].map(k => fb(16.75 + k * .25));
WORDS.forEach((id, i) => {
  const p = HEAD3[i];
  go(id, SNIPS[Math.min(i, 5)] + 6, P(p.x + (i - 3) * 9, p.y + 22 + hash(i, 9) * 26, (hash(i, 4) - .5) * 13, 1.2), { dur: 6, zmax: 26 });   // 剪下来的那一段往下一跳
});
go('bagB', fb(18), P(1080, 905, 0, 1), { dur: 20, zmax: 40, layer: 500, top: false, quiet: true });
go('bagF', fb(18), P(1080, 920, 0, 1), { dur: 20, zmax: 40, layer: 520, top: false, thump: .8 });
WORDS.forEach((id, i) => go(id, 518 + i * 2, P(1080 + (hash(i, 6) - .5) * 150, 895 + hash(i, 8) * 40, (hash(i, 3) - .5) * 80, .7), { dur: 14, zmax: 120, turns: 1, layer: 510, top: false, kind: 'in' }));
export const SHAKE = { f: fb(19), dur: 26 };
export const DRAW = [3, 2, 5, 0, 6, 1, 4];   // 抽出来的顺序：月亮 / 说 / 打折 / 明天的 / 出售 / 报纸 / 今晚
const POEM = [[3, 2, 5], [0, 6], [1, 4]];
const poemPose = {};
POEM.forEach((row, j) => { const ids = row.map(i => 'w' + i); line(ids, 1080 + (j - 1) * 40, 262 + j * 178, [-4, 3, -2.5][j], 1.55).forEach((p, k) => { poemPose[row[k]] = P(p.x + k * 14 - (row.length - 1) * 7, p.y + (hash(row[k], 2) - .5) * 14, p.r + (hash(row[k], 5) - .5) * 7, 1.55); }); });
go('bar', fb(20), P(1080, 452, -22, 1.5), { dur: 22, zmax: 60, thump: 1.4 });
DRAW.forEach((i, k) => go('w' + i, fb(20) + k * 10.5, poemPose[i], { dur: 20, zmax: 230, turns: 1, layer: 600 + k, kind: 'out', thump: k === 0 ? .6 : 0 }));

// —— 04 今天（第 24—32 拍，蓝纸）：同一批纸落进手机；三条规则各占两拍，每条自己演示自己 ——
WORDS.forEach((id, i) => off(id, 668 + i, { dur: 22, top: true, layer: null }));
off('bagB', 668, { dur: 20, top: false, layer: 500 }); off('bagF', 668, { dur: 20, top: false, layer: 520 }); off('bar', 670, { dur: 24 });
go('phone', fb(24.5), P(1430, 560, 2, 1), { dur: 20, zmax: 200, thump: 1.4 });
go('ticket', 690, P(1432, 300, -3, 1), { dur: 22, turns: 1 });
go('row0', 698, P(1430, 500, 2, 1), { dur: 20 }); go('row1', 704, P(1434, 584, -2, 1), { dur: 20 }); go('row2', 710, P(1428, 668, 1.5, 1), { dur: 20 });
go('btn', 718, P(1430, 820, -2, 1), { dur: 22, turns: 1 });
go('hand', 728, P(1752, 826, 3, .84, { fx: -1 }), { dur: 26 });
const CX = [185, 415, 645, 875], CY = 462, CS = .95, CDY = [6, -8, 10, -4];
CARDS.forEach((id, i) => go(id, 684 + i * 6, P(CX[i], CY, 0, CS), { dur: 26, turns: 1 }));
export const RULES = [fb(26), fb(28), fb(30)];
go('r1', RULES[0], P(506, 716, -2, 1), { dur: 20, thump: 1 });
CARDS.forEach((id, i) => go(id, RULES[0] + 10 + i * 6, P(CX[i], CY, 0, CS), { dur: 14, zmax: 110, turns: 1, face: 1 }));               // 规则 01：翻过来，换了一种字体
go('r2', RULES[1], P(486, 818, 1.5, 1), { dur: 20, thump: 1 });
export const TILT = [-9, 6, -4, 8];
CARDS.forEach((id, i) => go(id, RULES[1] + 6 + i * 5, P(CX[i], CY + CDY[i], TILT[i], CS), { dur: 9, zmax: 46, face: 1 }));              // 规则 02：每张歪一个角度
go('r3', RULES[2], P(498, 920, -1.5, 1), { dur: 20, thump: 1 });
export const LIFT = 130;
CARDS.forEach((id, i) => {
  go(id, RULES[2] + 8 + i * 2, P(CX[i], CY + CDY[i], TILT[i], CS, { z: LIFT }), { dur: 12, zmax: 0, face: 1, quiet: true });             // 规则 03：抬起来，影子就远了
  go(id, fb(31.5) + i * 2, P(CX[i], CY + CDY[i], TILT[i] * .6, CS), { dur: 6, zmax: 0, face: 1, thump: i === 0 ? .9 : 0 });
});

// —— 片尾（第 32 拍—完）：全部飞回标题那张拼贴；第 34 拍“达达”砸下来，最后一击署名拍下来 ——
['phone', 'ticket', 'row0', 'row1', 'row2', 'btn', 'r1', 'r2', 'r3', 'hand'].forEach((id, i) => off(id, 908 + i * 2, { dur: 24 }));
const BACK = ['kraft', 'news1', 'news2', 'bar', 'circle', 'gearL', 'gearS', 'eye', 'lips', 'non', 'qm', ...SQS, 'year', 'slogan', 'names'];
BACK.forEach((id, i) => {
  const L = Math.round(st(i, BACK.length, 912, 946)), p = titlePose(id);
  if (id === 'kraft' || id === 'circle') go(id, L - 29, P(p.x + 300, -760, 30, p.s), { dur: 0, zmax: 0, quiet: true });
  go(id, L, p, { dur: 28, zmax: 200, turns: id[0] === 'q' ? 1 : 0, face: null, thump: id === 'kraft' ? .8 : 0 });
});
CARDS.forEach((id, i) => go(id, 926 + i * 6, TITLE[id], { dur: 28, zmax: 200, turns: 1, face: 0 }));
go('H1', fb(34), TITLE.H1, { dur: 30, zmax: 250, turns: 1, thump: 1.5 });
go('H2', fb(34) + 5, TITLE.H2, { dur: 30, zmax: 250, turns: 1, thump: .8 });
headTitle.forEach((p, i) => go(WORDS[i], 950, p, { dur: 26, zmax: 140, grp: 'head', quiet: i !== 0 }));
go('hand', fb(35), TITLE.hand, { dur: 28 });
go('tag', fb(35), TITLE.tag, { dur: 28, zmax: 210, turns: 1, thump: .8 });
export const FINAL = 1012;                                         // 配乐最后一击（实测 23.418 秒 = 片子第 1012 帧）；之后停在封面上，等余音收完
go('sign', FINAL, P(1566, 994, -3, 1.15), { dur: 24, zmax: 230, turns: 1, thump: 1.7, layer: 900 });

for (const id in ST) { const a = ST[id]; for (let i = 1; i < a.length; i++) if (a[i].f - a[i].dur < a[i - 1].f - 1e-6 && a[i - 1].f > 0) throw new Error(`${id}: 第 ${i} 站在上一站落地（${a[i - 1].f.toFixed(1)}）之前就出发了（${(a[i].f - a[i].dur).toFixed(1)}）`); }

// 重的落地：[帧, 多重, x, y, 谁]
export const THUMPS = [];
for (const id in ST) for (const s of ST[id]) if (s.thump && s.f > 0) THUMPS.push([s.f, s.thump, s.pose.x, s.pose.y, id]);
THUMPS.push([CUT.shift, 1.1, EYE1.x, EYE1.y + 120, 'eye']);
THUMPS.sort((a, b) => a[0] - b[0]);

// ———————————————————— 一张纸片在第 t 帧的姿态 ————————————————————
function poseAt(id, t) {
  const a = ST[id];
  let i = 0;
  for (let k = 0; k < a.length; k++) if (a[k].f - a[k].dur <= t) i = k;
  const s = a[i], B = s.pose, base = ORDER[id];
  const lay = s.layer ?? base;
  if (t >= s.f) {                                  // 落定：角度抖两下，压一下再回弹
    const u = t - s.f, live = s.f > 0 && s.zmax + Math.abs(B.z - (a[i - 1]?.pose.z ?? 0)) > 0;
    const k = hash(base, i) > .5 ? 1 : -1, amp = live ? Math.min(4.6, 1.8 + s.zmax / 70) : 0;
    return { x: B.x, y: B.y, r: B.r + k * amp * Math.exp(-u / 5) * Math.cos(u * .85 + .4), s: B.s * (1 - (live ? .05 : 0) * Math.exp(-u / 3)), fx: B.fx, z: B.z, cos: 1, face: s.face, lay, grp: s.grp, st: s, fly: false };
  }
  const A = i ? a[i - 1].pose : (s.from ?? B), p = clamp((t - (s.f - s.dur)) / Math.max(s.dur, 1e-6)), e = eio(p);
  const ang = 6.2832 * s.turns * e, z = lerp(A.z, B.z, e) + s.zmax * 4 * p * (1 - p);
  const prevFace = i ? a[i - 1].face : s.face, fl = s.flutter * (1 - p);
  return { x: lerp(A.x, B.x, e) + fl * 70 * Math.sin(p * 8 + base), y: lerp(A.y, B.y, e), r: lerp(A.r, B.r + 360 * s.spin, e) + fl * 16 * Math.sin(p * 10 + base * 2), s: lerp(A.s, B.s, e), fx: B.fx, z, cos: Math.cos(ang),
    face: p < .5 ? prevFace : s.face, lay: s.top && z > 14 ? lay + 1000 + z * .001 : lay, grp: z < 1 ? s.grp : null, st: s, fly: true };
}

// ———————————————————— 剪刀 ————————————————————
const SCK = [  // [帧, 刀尖 x, y, 角度, 大小]。刀尖朝右 = 180°；相邻两帧的关键帧 = 在画面外瞬移
  [0, 1238, 78, 135, 1.1], [62, 1238, 78, 135, 1.1], [90, 2300, -200, 150, 1.1], [129, 2300, -200, 150, 1.1],
  [130, -420, 640, 176, 1.5], [154, 420, 500, 176, 1.5], [CUT.a, 679 - 26, 467 + 2, 176, 1.5], [CUT.b, 1461 + 44, 413 - 3, 176, 1.5], [240, 2500, 260, 158, 1.5], [451, 2500, 260, 158, 1.5],
  [452, 200, 1400, 90, 1.3], ...SNIPS.map((f, i) => [f, HEAD3[i].x + S['w' + i].w * .6, 300 - 34, 90, 1.3]), [534, 1960, 1500, 60, 1.3], [951, 1960, 1500, 60, 1.3],
  [952, 2300, -200, 150, 1.1], [990, 1238, 78, 135, 1.1], [END, 1238, 78, 135, 1.1]];
export const SNAPS = [fb(1), fb(1.5), fb(2), ...Array.from({ length: 6 }, (_, i) => CUT.a + 4 + i * 7), ...SNIPS, FINAL];
function scissorsAt(t) {
  let i = 0;
  while (i < SCK.length - 2 && SCK[i + 1][0] <= t) i++;
  const a = SCK[i], b = SCK[i + 1], e = b[0] - a[0] <= 1 ? 0 : eio(prog(t, a[0], b[0])), hop = SNIPS.includes(a[0]) && SNIPS.includes(b[0]);
  let open = .55;
  for (const f of SNAPS) { const u = t - f; if (u > -5 && u <= 0) open = Math.min(open, Math.pow(-u / 5, .6)); else if (u > 0 && u < 5) open = Math.min(open, u / 5 * .55); if (u > -10 && u <= -5) open = Math.max(open, lerp(.55, 1, (u + 10) / 5)); }
  return { x: lerp(a[1], b[1], e), y: lerp(a[2], b[2], e) + (hop ? 120 * Math.sin(Math.PI * e) : 0), r: lerp(a[3], b[3], e), s: lerp(a[4], b[4], e), open };
}
function drawScissors(x, o, shadow, col, rim) {
  x.save(); x.translate(o.x + (shadow ? 14 : 0), o.y + (shadow ? 24 : 0)); x.rotate(o.r * D); x.scale(o.s, o.s); x.translate(170, 0);   // 原点在刀尖，轴在后面 170
  x.lineCap = 'round'; x.lineJoin = 'round';
  for (const [c, ex] of shadow ? [['rgba(35,21,3,.26)', 0]] : [[rim, 8], [col, 0]]) {
    x.fillStyle = c; x.strokeStyle = c;
    for (const sg of [1, -1]) {
      x.save(); x.rotate(sg * o.open * 17 * D);
      x.beginPath(); x.moveTo(-174, 0); x.lineTo(8, -sg * 15); x.lineTo(14, sg * 4); x.closePath(); x.fill(); if (ex) { x.lineWidth = ex; x.stroke(); }
      x.lineWidth = 13 + ex; x.beginPath(); x.moveTo(6, -sg * 4); x.lineTo(56, -sg * 34); x.stroke();
      x.lineWidth = 12 + ex; x.beginPath(); x.ellipse(84, -sg * 50, 31, 22, -sg * 28 * D, 0, 6.2832); x.stroke();
      x.restore();
    }
  }
  if (!shadow) { x.fillStyle = C.RED; x.beginPath(); x.arc(0, 0, 5.5, 0, 6.2832); x.fill(); }
  x.restore();
}

// ———————————————————— 画一张纸片 ————————————————————
const LIGHT = [.5, .86];   // 光从左上来：影子往右下
export const CUTK = .12;
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
  if (it.id === 'eye' && it.st.cut && t > CUT.a) {          // 01：被剪开的那张照片，错位一直留到它飞走
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

// ———————————————————— 底下那张大纸：每章一种颜色，换章时整张撕走 ————————————————————
const BW = W + 400, BH = H + 300, BX = -200, BY = -150;
function sheet(fill, deco) {
  const c = createCanvas(BW, BH), x = c.getContext('2d');
  x.fillStyle = fill; x.fillRect(0, 0, BW, BH);
  if (deco) deco(x);
  texture(x, 0, 0, BW, BH, 1.1);
  return c;
}
const crosses = (x, col, step = 150) => { x.strokeStyle = col; x.lineWidth = 3; for (let X = 90; X < BW; X += step) for (let Y = 80; Y < BH; Y += step) { x.beginPath(); x.moveTo(X - 9, Y); x.lineTo(X + 9, Y); x.moveTo(X, Y - 9); x.lineTo(X, Y + 9); x.stroke(); } };
const big = (x, s, col) => txt(x, s, 150, BH - 190, '1050px Anton', col);
const SHEETS = [
  sheet(C.PAPER, x => crosses(x, 'rgba(120,96,60,.16)', 180)),
  sheet('#D32B1F', x => { halftone(x, BW, BH, (X, Y) => clamp(1.05 - Math.hypot(X - 150, Y - BH + 100) / 1500), 36, 45, '#B31E15'); big(x, '01', '#BE2319'); }),
  sheet('#DDAA2C', x => { crosses(x, '#C4931D'); big(x, '02', '#CD9B22'); }),
  sheet('#191612', x => { x.fillStyle = '#231F19'; const r = rng(31); for (let Y = 70; Y < BH; Y += 34) { let X = 60; while (X < BW) { const w = 40 + r() * 190; x.fillRect(X, Y, w, 12); X += w + 16; } } big(x, '03', '#2B261F'); }),
  sheet('#2F4E8C', x => { x.strokeStyle = 'rgba(255,255,255,.085)'; x.lineWidth = 2; for (let X = 40; X < BW; X += 80) { x.beginPath(); x.moveTo(X, 0); x.lineTo(X, BH); x.stroke(); } for (let Y = 30; Y < BH; Y += 80) { x.beginPath(); x.moveTo(0, Y); x.lineTo(BW, Y); x.stroke(); } big(x, '04', '#294680'); }),
];
function tearPath(dir, seed) {
  const r = rng(seed), p = new Path2D(), j = () => 30 + r() * 30 + (r() > .8 ? 26 : 0), V = dir === 'R' || dir === 'L', n = Math.ceil(((V ? BH : BW) + 40) / 22), pts = [];
  for (let i = 0; i <= n; i++) { const q = -20 + i * 22, d = j(); pts.push(dir === 'R' ? [d, q] : dir === 'L' ? [BW - d, q] : dir === 'D' ? [q, d] : [q, BH - d]); }
  const far = dir === 'R' ? [[BW + 20, BH + 20], [BW + 20, -20]] : dir === 'L' ? [[-20, BH + 20], [-20, -20]] : dir === 'D' ? [[BW + 20, BH + 20], [-20, BH + 20]] : [[BW + 20, -20], [-20, -20]];
  [...pts, ...far].forEach(([X, Y], i) => (i ? p.lineTo(X, Y) : p.moveTo(X, Y))); p.closePath();
  return p;
}
export const TEARS = [[90, 'R', 0, 1], [268, 'D', 1, 2], [437, 'L', 2, 3], [661, 'U', 3, 4], [885, 'R', 4, 0]].map(([f, dir, from, to], i) => ({ f, dur: 24, dir, from, to, path: tearPath(dir, 40 + i) }));
const VEC = { R: [1, 0], L: [-1, 0], D: [0, 1], U: [0, -1] };
function background(x, t) {
  const bx = BX + 12 * Math.sin(t / 170), by = BY + 8 * Math.cos(t / 130);
  let cur = 0, tr = null;
  for (const T of TEARS) if (t >= T.f) { cur = T.to; tr = t < T.f + T.dur ? T : null; }
  x.drawImage(SHEETS[cur], bx, by);
  if (!tr) return;
  const p = (t - tr.f) / tr.dur, e = Math.pow(p, 1.8), [vx, vy] = VEC[tr.dir], dist = (vx ? BW : BH) + 80;
  x.save(); x.translate(bx + vx * dist * e, by + vy * dist * e);
  x.save(); x.translate(14, 22); x.filter = 'blur(12px)'; x.fillStyle = 'rgba(20,10,0,.5)'; x.fill(tr.path); x.restore();   // 被撕起来的那张纸投在下面的影子
  x.strokeStyle = '#FBF8F0'; x.lineWidth = 7; x.lineJoin = 'round'; x.stroke(tr.path);                                          // 撕口的白纤维
  x.clip(tr.path); x.drawImage(SHEETS[tr.from], 0, 0);
  x.restore();
}

// ———————————————————— 镜头 ————————————————————
export const CH = [0, fb(4), fb(10), fb(16), fb(24), fb(32), END];
const ROT = [0, -1.1, .9, -.7, 1.1, 0];
function camera(t) {
  let i = 0; while (i < CH.length - 2 && CH[i + 1] <= t) i++;
  const u = prog(t, CH[i], CH[i + 1]), w = i === CH.length - 2 ? u : (u < .86 ? u / .86 : 1 - eio((u - .86) / .14));
  let dy = 0; for (const [f, k] of THUMPS) { const q = t - f; if (q >= 0 && q < 26) dy += 8 * k * Math.exp(-q / 4.5) * Math.cos(q * .5); }
  let rot = ROT[0]; for (let k = 1; k < ROT.length; k++) rot += (ROT[k] - ROT[k - 1]) * eio(prog(t, CH[k] - 16, CH[k] + 10));
  const b = (t - OFF) / BEAT, bi = Math.floor(b), drums = (bi >= 4 && bi < 16) || (bi >= 20 && bi < 34);
  const kick = drums ? .011 * Math.exp(-(b - bi) * BEAT / 4.5) : 0;                                 // 有鼓的段落，每一拍镜头往里顶一下
  return { z: Math.exp(lerp(Math.log(1.012), Math.log(1.05), w)) * (1 + kick), x: 7 * Math.sin(t / 150), y: dy + 4 * Math.sin(t / 110 + 1), r: rot + .35 * Math.sin(t / 95) };
}

// ———————————————————— 外框和标注 ————————————————————
export const CUES = [];
const cueSeen = new Set();
function typed(x, s, X, Y, font, col, t, f0, rate = 1.1, kind = 'type') {      // 打字机：每 rate 帧落定一个字；登记给配乐（一字一声）
  const chars = [...s], key = f0 + '|' + s;
  if (!cueSeen.has(key)) { cueSeen.add(key); CUES.push([+f0.toFixed(2), chars.filter(c => c !== ' ').length, rate, kind]); }
  const n = Math.floor((t - f0) / rate);
  if (n <= 0) return;
  txt(x, chars.slice(0, n).join(''), X, Y, font, col);
  if (n < chars.length) { const px = parseInt(font.match(/(\d+)px/)[1]), wd = tw(chars.slice(0, n).join(''), font); x.fillStyle = C.RED; x.fillRect(X + wd + 3, Y - px * .82, 5, px * .96); }
}
// 一条拍上去的纸条：从 1.5 倍压到 1，离场往左甩出去
function slap(x, t, f0, f1, cx, cy, w, h, rot, fill, draw) {
  if (t < f0 - 5 || t > f1 + 16) return;
  const u = t - f0, k = u < 0 ? 1 + .5 * Math.pow(-u / 5, 1.4) : 1 - .035 * Math.exp(-u / 3), q = Math.max(0, t - f1), dx = -q * q * 9;
  const wob = u >= 0 ? 2.4 * Math.exp(-u / 5) * Math.cos(u * .85) : 0, d = 5 + (k - 1) * 150;
  x.save(); x.translate(cx + dx, cy); x.rotate((rot + wob) * D); x.scale(k, k);
  x.fillStyle = `rgba(20,12,2,${.4 - (k - 1) * .3})`; x.fillRect(-w / 2 + LIGHT[0] * d, -h / 2 + LIGHT[1] * d, w, h);
  x.fillStyle = fill; x.fillRect(-w / 2, -h / 2, w, h);
  if (u >= 0) draw(-w / 2, -h / 2);
  x.restore();
}
const HUD = [
  { f0: 118, f1: 262, n: '01', t: '剪 CUT', s: 'Hannah Höch · 照片蒙太奇 · 1919', box: C.INK, sub: C.OCHRE, subc: C.INK },
  { f0: 286, f1: 430, n: '02', t: '偶然 CHANCE', s: 'Jean Arp · 按偶然的法则排列 · 1916—17', box: C.INK, sub: C.INK, subc: C.NEWS },
  { f0: 453, f1: 656, n: '03', t: '词 WORDS', s: 'Tristan Tzara · 做一首达达诗 · 1920', box: C.RED, sub: C.OCHRE, subc: C.INK },
  { f0: 678, f1: 884, n: '04', t: '今天 TODAY', s: '三条规则，拿走就能用', box: C.INK, sub: C.OCHRE, subc: C.INK }];
const NF = '700 42px Type, Sans';
const NOTES = [   // [出现, 离场, 左 x, y, 角度, 文字, 底色, 字色]
  [fb(8), 264, 70, 520, -2, '切口错位 12%', C.NEWS, C.INK], [fb(8.6), 264, 70, 610, 1.5, '比例故意不对', C.INK, C.NEWS],
  [292, 362, 70, 430, -2, 'seed 07', C.RED, C.NEWS], [308, 428, 70, 610, 1.5, 'x, y = random()', C.NEWS, C.INK], [328, 428, 70, 700, -1, '角度 = ±25°', C.NEWS, C.INK], [348, 428, 70, 790, 1, '落在哪，贴在哪', C.INK, C.NEWS],
  [fb(13) + 3, 428, 70, 430, 2, 'seed 12', C.RED, C.NEWS],
  [fb(16.75), 654, 70, 470, -2, '① 剪开标题', C.NEWS, C.INK], [fb(18.25), 654, 70, 560, 1.5, '② 放进袋子，摇', C.NEWS, C.INK], [fb(20) + 4, 654, 70, 650, -1, '③ 按抽出的顺序贴', C.OCHRE, C.INK]];
function hud(x, t) {
  for (const h of HUD) {
    slap(x, t, h.f0, h.f1, 70 + 46, 96, 92, 92, -3, h.box, (X, Y) => txt(x, h.n, X + 46, Y + 68, '58px Anton', C.NEWS, 'center'));
    const w1 = tw(h.t, '900 50px Arch, Hei') + 44;
    slap(x, t, h.f0 + 3, h.f1 + 2, 172 + w1 / 2, 86, w1, 76, 1.5, C.NEWS, (X, Y) => typed(x, h.t, X + 22, Y + 56, '900 50px Arch, Hei', C.INK, t, h.f0 + 3, 1.3, 'title'));
    const w2 = tw(h.s, '700 30px Type, Sans') + 36;
    slap(x, t, h.f0 + 9, h.f1 + 4, 76 + w2 / 2, 178, w2, 54, -1, h.sub, (X, Y) => typed(x, h.s, X + 18, Y + 38, '700 30px Type, Sans', h.subc, t, h.f0 + 9, .9, 'small'));
    slap(x, t, h.f0 + 6, h.f1 + 6, W - 150, 84, 190, 66, 2, h.box, (X, Y) => { txt(x, h.n, X + 20, Y + 49, '44px Anton', h.box === C.RED ? C.INK : C.OCHRE); txt(x, '/ 04', X + 84, Y + 49, '44px Anton', C.NEWS); });
  }
  for (const [f0, f1, X0, Y0, r, s, fill, col] of NOTES) { const w = tw(s, NF) + 40; slap(x, t, f0, f1, X0 + w / 2, Y0, w, 74, r, fill, (X, Y) => typed(x, s, X + 20, Y + 52, NF, col, t, f0, 1)); }
  CARDS.forEach((id, i) => {      // 规则 02：每张卡片头上标它歪了几度
    const f0 = RULES[1] + 6 + i * 5;
    slap(x, t, f0, RULES[2] + 2, CX[i], 258, 104, 54, TILT[i] * .5, C.RED, (X, Y) => txt(x, (TILT[i] > 0 ? '+' : '−') + Math.abs(TILT[i]) + '°', X + 52, Y + 39, '34px Anton', C.NEWS, 'center'));
  });
  slap(x, t, RULES[2] + 12, 888, 700, 200, 420, 58, -1.5, C.NEWS, (X, Y) => typed(x, `离纸 ${LIFT}px · 影子 ${Math.round(5 + LIFT * .62)}px`, X + 18, Y + 41, '700 30px Type, Sans', C.INK, t, RULES[2] + 12, .9));
}

// ———————————————————— 纸屑：重的一下崩出来几片 ————————————————————
const BITS = [C.RED, C.NEWS, C.OCHRE, C.INK, C.PINK, C.NEWS];
function confetti(x, t) {
  for (let n = 0; n < THUMPS.length; n++) {
    const [f, k, X0, Y0] = THUMPS[n], u = t - f;
    if (u < 0 || u > 30 || k < .8) continue;
    const cnt = Math.round(7 * k);
    for (let j = 0; j < cnt; j++) {
      const a = hash(n, j) * 6.283, v = (9 + 13 * hash(j, n + 3)) * k, damp = (1 - Math.exp(-u / 9)) * 9, R = 70 + 60 * hash(n + 1, j);
      const px = X0 + Math.cos(a) * (R + v * damp), py = Y0 + Math.sin(a) * (R * .6 + v * damp * .7) + .05 * u * u, al = clamp(1.6 - u / 18), sz = 7 + 9 * hash(j + 5, n);
      x.save(); x.globalAlpha = al; x.translate(px, py); x.rotate(a + u * (.25 + .3 * hash(j, n + 9)) * (j % 2 ? 1 : -1)); x.scale(Math.cos(u * .5 + j), 1);
      x.fillStyle = BITS[(n + j) % BITS.length]; x.fillRect(-sz, -sz * .45, sz * 2, sz * .9); x.restore();
    }
  }
}

// ———————————————————— 一帧 ————————————————————
export function render(x, t, o = {}) {
  const cam = camera(t);
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.translate(W / 2 + cam.x, H / 2 + cam.y); x.rotate(cam.r * D); x.scale(cam.z, cam.z); x.translate(-W / 2, -H / 2);
  background(x, t);
  const scz = scissorsAt(t), list = [];
  for (const id in ST) {
    const it = poseAt(id, t); it.id = id; it.sc = S[id];
    if (id === 'bagB' || id === 'bagF') { const u = t - SHAKE.f; if (u > 0 && u < SHAKE.dur + 14) { const e = u < SHAKE.dur ? Math.sin(Math.PI * u / SHAKE.dur) : 0, d = Math.exp(-Math.max(0, u - SHAKE.dur) / 4); it.r += 12 * e * Math.sin(u * .62) * d; it.y += -30 * e * Math.abs(Math.sin(u * .62)); it.x += 18 * e * Math.sin(u * .62 + 1); } }
    if (it.st.kind === 'in' && !it.fly) { const u = t - SHAKE.f; if (u > 0 && u < SHAKE.dur) { const e = Math.sin(Math.PI * u / SHAKE.dur); it.y += -64 * e * Math.abs(Math.sin(u * .62 + hash(ORDER[id], 1) * 2)); it.r += 60 * e * Math.sin(u * .4 + ORDER[id]); it.x += 30 * e * Math.sin(u * .62 + ORDER[id]); } }
    if (id === 'hand' && !it.fly) for (const f of [70, 200, 748, 803, 862]) { const u = t - f; if (u > 0 && u < 14) it.x += it.fx * 26 * Math.sin(Math.PI * u / 14); }   // 手指点一下
    if (id === 'eye' && it.st.cut && !it.fly) {                                                       // 眼珠一格格跟着剪刀看过去，剪完那一下看回正中
      const g = clamp((scissorsAt(Math.round(t)).x - it.x) / (it.sc.w * it.s * .55), -1, 1) * (1 - prog(t, CUT.shift - 2, CUT.shift + 3));
      it.face = Math.round((g + 1) * 2);
    }
    if (!it.fly) for (const [f, k, X0, Y0, who] of THUMPS) {                                          // 桌子震一下：别的纸片跟着跳
      if (who === id) continue;
      const dist = Math.hypot(it.x - X0, it.y - Y0), u = t - f - dist / 95;
      if (u > 0 && u < 12) { const h = 22 * k * Math.exp(-dist / 800) * Math.sin(Math.PI * u / 12) / (1 + it.sc.w * it.sc.h * it.s * it.s / 3e5); it.z += h; it.r += h * .09 * (hash(ORDER[id], 11) > .5 ? 1 : -1); }
    }
    if (it.x < -760 || it.x > W + 760 || it.y < -660 || it.y > H + 660) continue;
    list.push(it);
  }
  list.sort((a, b) => a.lay - b.lay || ORDER[a.id] - ORDER[b.id]);
  for (let i = 0; i < list.length;) {
    let j = i + 1;
    if (list[i].grp) while (j < list.length && list[j].grp === list[i].grp) j++;
    for (let k = i; k < j; k++) drawShadow(x, list[k]);
    for (let k = i; k < j; k++) drawFace(x, list[k], t);
    i = j;
  }
  confetti(x, t);
  const dark = t > 449 && t < 673;
  drawScissors(x, scz, true); drawScissors(x, scz, false, dark ? '#EDE5D2' : C.INK, dark ? C.INK : '#F3ECDD');
  if (!o.noHud) { x.setTransform(1, 0, 0, 1, 0, cam.y * .6); hud(x, t); }   // 外框不跟镜头缩放，免得被裁掉
}

// 给配乐的事件：每张纸片落地的帧、多重、偏左还是偏右
export function events() {
  const land = [];
  for (const id in ST) for (const s of ST[id]) if (s.f > 0 && !s.quiet) land.push({ f: +s.f.toFixed(2), id, w: +(Math.sqrt(S[id].w * S[id].h) * s.pose.s / 300).toFixed(2), pan: +clamp((s.pose.x - W / 2) / (W / 2), -1, 1).toFixed(2), thump: s.thump, kind: s.kind ?? null });
  land.sort((a, b) => a.f - b.f);
  const tmp = createCanvas(W, H).getContext('2d');
  for (let f = 0; f < END; f++) hud(tmp, f);
  return { end: END, beat: BEAT, off: OFF, chapters: CH, land, snaps: SNAPS, cut: CUT, shake: SHAKE, rules: RULES, toss: TOSS, liftoff: 76, tears: TEARS.map(T => [T.f, T.dur]), final: FINAL, cues: CUES.slice().sort((a, b) => a[0] - b[0]) };
}
