// scenes.js — 毛绒全片的“导演”：有哪些形状（buildShapes）、每个零件每一帧在哪（poses）、每一帧的镜头 / 光 / 颜色（stateAt）。
// 每一帧都是帧号的纯函数，所以能并行渲、断了能接着渲。
const M = FUR.m4;
const SLOT = { ball: 0, g1: 1, g2: 2, saucer: 3, cup: 4, spoon: 5, body: 6, head: 7, muzzle: 8, earL: 9, earR: 10, armL: 11, armR: 12, legL: 13, legR: 14, hat: 15, heart: 16, knob: 17, d1: 18, d2: 19, d3: 20 };
const TONE = { pink: 0, tan: 1, tanLight: 2, bear: 3, muzzle: 4, lime: 5, heart: 6, knob: 7, dA: 8, dB: 9, dC: 10 };
const PAL = {
  pink: { root: '#7d0a3c', tip: '#ff4f97', len: 1, curl: 0.07, gloss: 1.0, droop: 0.22 },
  tan: { root: '#4a2a10', tip: '#dcae6e', len: 0.5, curl: 0.05, gloss: 1.3, droop: 0.3 },
  tanLight: { root: '#6b4a22', tip: '#f8e6c3', len: 0.62, curl: 0.05, gloss: 1.3, droop: 0.3 },
  bear: { root: '#5e3008', tip: '#f2a531', len: 0.9, curl: 0.12, gloss: 0.8, droop: 0.18 },
  muzzle: { root: '#a87a45', tip: '#ffeccc', len: 0.42, curl: 0.06, gloss: 0.6, droop: 0.1 },
  lime: { root: '#3f6a00', tip: '#c9ff45', len: 1.3, curl: 0.1, gloss: 1.1, droop: 0.42 },
  heart: { root: '#8a0f45', tip: '#ff5a9e', len: 0.5, curl: 0.06, gloss: 1.0, droop: 0.12 },
  heartOff: { root: '#8f8590', tip: '#efe6ea', len: 0.5, curl: 0.06, gloss: 0.6, droop: 0.12 },
  knob: { root: '#b9b0cc', tip: '#ffffff', len: 0.36, curl: 0.05, gloss: 0.7, droop: 0.1 },
  dA: { root: '#8a0f45', tip: '#ff5a9e', len: 0.3, curl: 0.05, gloss: 0.8, droop: 0.1 },
  dB: { root: '#a35a00', tip: '#ffc02e', len: 0.3, curl: 0.05, gloss: 0.8, droop: 0.1 },
  dC: { root: '#1a3fb0', tip: '#5c93ff', len: 0.3, curl: 0.05, gloss: 0.8, droop: 0.1 },
};
const BG = { blue: ['#2f58ff', '#1b36c9'], green: ['#12a67c', '#0a7d5c'], violet: ['#7b52ff', '#5632d4'], magenta: ['#ff4d94', '#d91f6c'], cream: ['#fff1e0', '#fff1e0'] };
// 界面一章：镜头正对一面墙，1 世界单位 = 296 像素
const UI = { eye: [0, 1.5, 9], at: [0, 1.5, 0], fov: 0.4, ppu: 1080 / (18 * Math.tan(0.2)) };
const px = (x, y) => [(x - 960) / UI.ppu, 1.5 + (540 - y) / UI.ppu];
const LAY = { phone: [620, 540, 480, 980], heart: px(620, 372), knobOff: px(712, 678), knobOn: px(778, 678), track: px(745, 678), dots: [px(540, 866), px(620, 866), px(700, 866)] };

const uiCam = (cx, cy, k) => { const w = px(cx, cy); return [[w[0], w[1], 9 / k], [w[0], w[1], 0], UI.fov]; };
function buildShapes(F) {
  const N = F.N;
  Object.entries(TONE).forEach(([k, i]) => F.tone(i, PAL[k]));
  // 毛球：把第 0 根毛转到正上方（“一根毛”那一章，镜头就停在它跟前）
  const ball = SHAPES.fromPrims(N, [{ type: 'ell', c: [0, 1, 0], r: [1, 1, 1], part: SLOT.ball, tone: TONE.pink }], { seed: 3 });
  { const n = [ball.nrm[0], ball.nrm[1], ball.nrm[2]], ax = [-n[2], 0, n[0]], al = Math.hypot(...ax) || 1, a = ax.map(v => v / al), c = n[1], s = al;
    const rot = v => { const d = a[0] * v[0] + a[1] * v[1] + a[2] * v[2], cr = [a[1] * v[2] - a[2] * v[1], a[2] * v[0] - a[0] * v[2], a[0] * v[1] - a[1] * v[0]];
      return [0, 1, 2].map(i => v[i] * c + cr[i] * s + a[i] * d * (1 - c)); };
    for (let i = 0; i < N; i++) { const p = rot([ball.pos[i * 3], ball.pos[i * 3 + 1] - 1, ball.pos[i * 3 + 2]]), q = rot([ball.nrm[i * 3], ball.nrm[i * 3 + 1], ball.nrm[i * 3 + 2]]);
      ball.pos.set([p[0], p[1] + 1, p[2]], i * 3); ball.nrm.set(q, i * 3); } }
  F.addShape('ball', ball);
  F.addShape('title', SHAPES.fromMask(N, (ctx, w, h) => { ctx.font = '372px ZCOOL'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('毛', 300, h / 2 + 12); ctx.fillText('绒', 728, h / 2 + 12); },
    { w: 1024, h: 512, scale: 0.0052, depth: 0.19, edge: 22, tone: TONE.pink, yoff: 1.4, partFn: x => x < 512 ? SLOT.g1 : SLOT.g2, seed: 5 }));
  const speck = (P, Nn, R) => R() < 0.28 ? TONE.tanLight : TONE.tan;
  F.addShape('cup', SHAPES.fromPrims(N, [
    { type: 'rev', c: [0, 0, 0], profile: [[0, 0.03], [0.85, 0.03], [1.5, 0.15], [1.58, 0.2], [1.48, 0.21], [0.9, 0.1], [0, 0.1]], part: SLOT.saucer, toneFn: speck, w: 0.8 },
    { type: 'rev', c: [0, 0, 0], profile: [[0, 0.2], [0.42, 0.2], [0.52, 0.28], [0.75, 0.9], [0.78, 1.0], [0.7, 0.97], [0.48, 0.4], [0, 0.34]], part: SLOT.cup, toneFn: speck },
    { type: 'cap', a: [0.74, 0.84, 0], b: [1.08, 0.8, 0], ra: 0.075, rb: 0.075, part: SLOT.cup, toneFn: speck },
    { type: 'cap', a: [1.08, 0.8, 0], b: [1.1, 0.5, 0], ra: 0.075, rb: 0.075, part: SLOT.cup, toneFn: speck },
    { type: 'cap', a: [1.1, 0.5, 0], b: [0.64, 0.42, 0], ra: 0.075, rb: 0.07, part: SLOT.cup, toneFn: speck },
    { type: 'ell', c: [-0.86, 0.27, 0.92], r: [0.27, 0.08, 0.19], rot: [0, 0.75, 0], part: SLOT.spoon, toneFn: speck, w: 1.3 },
    { type: 'cap', a: [-0.7, 0.26, 0.78], b: [0.25, 0.2, 1.25], ra: 0.055, rb: 0.07, part: SLOT.spoon, toneFn: speck, w: 1.3 },
  ], { seed: 7 }));
  const T = TONE.bear, MZ = TONE.muzzle;
  F.addShape('bear', SHAPES.fromPrims(N, [
    { type: 'ell', c: [0, 0.78, 0], r: [0.74, 0.8, 0.64], part: SLOT.body, toneFn: (P) => (P[2] > 0.3 && Math.hypot(P[0], P[1] - 0.72) < 0.4) ? MZ : T },
    { type: 'ell', c: [0, 1.88, 0.05], r: [0.68, 0.61, 0.6], part: SLOT.head, tone: T },
    { type: 'ell', c: [0, 1.72, 0.55], r: [0.31, 0.24, 0.25], part: SLOT.muzzle, tone: MZ, w: 1.4 },
    { type: 'ell', c: [-0.54, 2.38, 0.02], r: [0.25, 0.25, 0.14], part: SLOT.earL, toneFn: (P) => (P[2] > 0.08 && Math.hypot(P[0] + 0.54, P[1] - 2.38) < 0.15) ? MZ : T },
    { type: 'ell', c: [0.54, 2.38, 0.02], r: [0.25, 0.25, 0.14], part: SLOT.earR, toneFn: (P) => (P[2] > 0.08 && Math.hypot(P[0] - 0.54, P[1] - 2.38) < 0.15) ? MZ : T },
    { type: 'cap', a: [-0.6, 1.2, 0.08], b: [-1.04, 0.62, 0.34], ra: 0.25, rb: 0.21, part: SLOT.armL, tone: T },
    { type: 'cap', a: [0.6, 1.2, 0.08], b: [1.04, 0.62, 0.34], ra: 0.25, rb: 0.21, part: SLOT.armR, tone: T },
    { type: 'cap', a: [-0.38, 0.3, 0.3], b: [-0.66, 0.26, 0.98], ra: 0.28, rb: 0.27, part: SLOT.legL, toneFn: (P) => P[2] > 1.12 ? MZ : T },
    { type: 'cap', a: [0.38, 0.3, 0.3], b: [0.66, 0.26, 0.98], ra: 0.28, rb: 0.27, part: SLOT.legR, toneFn: (P) => P[2] > 1.12 ? MZ : T },
  ], { seed: 11 }));
  F.addShape('hat', SHAPES.fromPrims(N, [
    { type: 'rev', c: [0, 0, 0], profile: [[0, 1.36], [0.66, 1.34], [0.82, 1.28], [0.93, 0.56], [0.95, 0.54], [1.75, 0.11], [1.78, 0.16], [1.0, 0.6], [0.86, 1.35], [0.68, 1.43], [0, 1.45]], part: SLOT.hat, tone: TONE.lime }], { seed: 13 }));
  // 界面：一颗心 + 开关的钮 + 三颗加载的球，同一批毛分给它们
  const nH = Math.round(N * 0.58), nK = Math.round(N * 0.15), nD = N - nH - nK, L = LAY;
  const heart = SHAPES.fromMask(nH, (ctx, w, h) => { ctx.translate(w / 2, h / 2 + 14); ctx.scale(13.2, -13.2); ctx.beginPath();
    for (let i = 0; i <= 200; i++) { const t = i / 200 * 6.28318, x = 16 * Math.sin(t) ** 3, y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.fill(); }, { w: 512, h: 512, scale: 1.02 / 430, depth: 0.2, edge: 105, tone: TONE.heart, partFn: () => SLOT.heart, seed: 17, back: 0.08 });
  for (let i = 0; i < nH; i++) { heart.pos[i * 3] += L.heart[0]; heart.pos[i * 3 + 1] += L.heart[1]; }
  const knob = SHAPES.fromPrims(nK, [{ type: 'ell', c: [L.knobOff[0], L.knobOff[1], 0.06], r: [0.118, 0.118, 0.1], part: SLOT.knob, tone: TONE.knob }], { seed: 19 });
  const dots = SHAPES.fromPrims(nD, L.dots.map((d, i) => ({ type: 'ell', c: [d[0], d[1], 0.05], r: [0.09, 0.09, 0.085], part: SLOT.d1 + i, tone: TONE.dA + i })), { seed: 23 });
  F.addShape('ui', SHAPES.merge([heart, knob, dots], 29));
}

const about = (p, m) => M.chain(M.T(p[0], p[1], p[2]), m, M.T(-p[0], -p[1], -p[2]));
const ID = M.ident();
// 压扁（体积不变）：以 pivot 为“脚底”，高 ×sy，宽 ×1/√sy
const sq = (pivot, sy) => about(pivot, M.S(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy)));

function ballPose(f) {
  let x = 0, y = 0, sy = 1, rz = 0;
  if (f < 120) {
    if (f < TL.hit) { y = 0.6 * (1 - f / TL.hit); sy = 1.1; }                 // 匀速砸下来（第 0 帧之前也在落，所以第 0 帧毛就是往上甩的）
    else if (f < 16) sy = 1 - 0.36 * Math.sin(Math.PI * (f - TL.hit) / 8);
    else if (f < 40) { const t = (f - 16) / 24; y = 0.55 * Math.sin(Math.PI * t); sy = 1 + 0.07 * Math.cos(Math.PI * t) ** 2; }
    else if (f < 46) sy = 1 - 0.14 * Math.sin(Math.PI * (f - 40) / 6);
    else if (f < 52) sy = 1 - 0.24 * ease.out2((f - 46) / 6);
    else { const t = prog(f, 52, 70); y = 0.5 * ease.out3(t); sy = lerp(0.76, 1, ease.out3(t)) + 0.16 * Math.sin(Math.PI * t); }
  } else if (f < 512) {
    if (f >= TL.shake) { const t = f - TL.shake; rz = 0.3 * Math.sin(6.28318 * t / 11) * Math.exp(-t / 8); sy = squash(f, TL.shake, 0.12, 4); }
  } else if (f < 1000) {
    TL.rules.forEach((c, k) => { if (f >= c && f < c + 45) sy = squash(f, c, 0.2, 4, 3.4, 0.32); });
    const c4 = TL.rules[3]; if (f >= c4 + 2 && f < c4 + 45) { const env = prog(f, c4 + 2, c4 + 6) * (f < c4 + 38 ? 1 : 0); x = 0.42 * Math.sin(6.28318 * (f - c4 - 2) / 14) * env; }
  } else {
    if (f < TL.drop2) y = f < 1052 ? 0.8 : 0.8 * (1 - ((f - 1052) / (TL.drop2 - 1052)) ** 2);
    else if (f < 1074) sy = squash(f, TL.drop2, 0.3, 4, 3.4, 0.3);
    else if (f < 1080) sy = 1 - 0.24 * ease.out2((f - 1074) / 6);
    else { const t = prog(f, 1080, 1098); y = 0.5 * ease.out3(t); sy = lerp(0.76, 1, ease.out3(t)) + 0.16 * Math.sin(Math.PI * t); }
  }
  return M.chain(M.T(x, y, 0), sq([0, 0, 0], sy), about([0, 1, 0], M.RZ(rz)));
}
function glyphPose(f, i) {
  const f0 = (f < 600 ? TL.glyphs : TL.glyphs2)[i], p = pop(f, f0, 3.0, 0.3), c = [i ? 1.19 : -1.1, 1.4, 0];
  const bob = 0.03 * Math.sin(f / 19 + i * 1.7);
  return M.chain(M.T(0, bob, 0), about(c, M.chain(M.RZ((i ? -1 : 1) * 0.16 * (1 - p)), M.S(lerp(0.5, 1, p)))));
}
// 一个零件“啵”地弹出来：从 pivot 那一点长到原大（过冲），顺便从上面掉下来一点
const popIn = (f, f0, pivot, drop = 0) => { const p = pop(f, f0, 3.4, 0.36); return M.chain(M.T(0, drop * (1 - Math.min(1, prog(f, f0, f0 + 7)) ** 2), 0), about(pivot, M.S(Math.max(0.002, p)))); };

function poses(f) {
  const P = new Array(21).fill(ID), G = new Array(21).fill(1);
  P[SLOT.ball] = ballPose(f); P[SLOT.g1] = glyphPose(f, 0); P[SLOT.g2] = glyphPose(f, 1);
  G[SLOT.g1] = G[SLOT.g2] = f < 600 ? 1 - prog(f, TL.bald[0], TL.bald[0] + 8) : 1;
  G[SLOT.ball] = (f >= TL.bald[0] && f < 300) ? pop(f, TL.oneGrow, 3.0, 0.3) : 1;
  // 02 皮毛早餐：碟、杯、勺依次落下；之后转台一直慢转，第 285 帧“啪”地转四分之一圈
  const spinT = prog(f, TL.cupSpin, TL.cupSpin + 16), spin = (f - TL.cup) * 0.004 + 1.57 * (f < TL.cupSpin ? 0 : spring((f - TL.cupSpin) / 60, 2.4, 0.42)) - 0.5;
  const turn = M.RY(spin);
  [[SLOT.saucer, [0, 0.1, 0], 0.9], [SLOT.cup, [0, 0.3, 0], 1.3], [SLOT.spoon, [-0.3, 0.25, 1.0], 1.1]].forEach(([s, pv, dr], k) => { P[s] = M.mul(turn, popIn(f, TL.cupPops[k], pv, dr)); });
  // 03 泰迪熊：九个零件按十六分音符“啵”出来；之后歪头、招手
  const nod = f < TL.nod ? 0 : 0.2 * Math.sin(6.28318 * (f - TL.nod) / 30) * Math.exp(-(f - TL.nod) / 40);
  const headM = about([0, 1.35, 0], M.RZ(nod)), wave = f < TL.nod ? 0 : -0.9 * spring((f - TL.nod) / 60, 2.2, 0.4) + 0.25 * Math.sin(6.28318 * (f - TL.nod) / 10) * (f - TL.nod > 8 ? 1 : 0);
  const piv = { body: [0, 0.4, 0], head: [0, 1.5, 0], muzzle: [0, 1.72, 0.4], earL: [-0.45, 2.2, 0], earR: [0.45, 2.2, 0], armL: [-0.6, 1.2, 0.08], armR: [0.6, 1.2, 0.08], legL: [-0.38, 0.3, 0.3], legR: [0.38, 0.3, 0.3] };
  Object.keys(piv).forEach((k, i) => { let m = popIn(f, TL.bearPops[i], piv[k]);
    if (k === 'head' || k === 'muzzle' || k === 'earL' || k === 'earR') m = M.mul(headM, m);
    if (k === 'armR') m = M.mul(about(piv.armR, M.RZ(-wave)), m);
    P[SLOT[k]] = m; });
  // 04 渔夫帽：歪着悬在空中；第 472 帧抛起来转一整圈
  { const t = f - TL.hatToss, tossY = t < 0 ? 0 : 0.55 * Math.sin(Math.PI * clamp(t / 30)), rot = t < 0 ? 0 : 6.28318 * spring(t / 60, 1.5, 0.55);          // 像抛煎饼一样翻一整圈
    const pin = pop(f, TL.hat - 2, 3.0, 0.4);
    P[SLOT.hat] = M.chain(M.T(0, 0.55 + tossY + 0.04 * Math.sin(f / 17), 0), about([0, 0.7, 0], M.chain(M.RX(0.42 + rot), M.RZ(-0.12), M.RY(f * 0.006))), M.S(lerp(0.6, 1, pin))); }
  // 06 界面：心被按一下、钮滑过去、三颗球轮流跳
  { const L = LAY, hs = squash(f, TL.tapHeart, 0.24, 5, 3.6, 0.26);
    P[SLOT.heart] = about([L.heart[0], L.heart[1], 0], M.S(hs * (0.6 + 0.4 * pop(f, TL.ui + 6, 3, 0.4)), hs * (0.6 + 0.4 * pop(f, TL.ui + 6, 3, 0.4)), 1));
    const k = f < TL.toggle ? 0 : spring((f - TL.toggle) / 60, 3.2, 0.42);
    P[SLOT.knob] = M.chain(M.T((L.knobOn[0] - L.knobOff[0]) * k, 0, 0), about([L.knobOff[0], L.knobOff[1], 0], M.S(pop(f, TL.ui + 14, 3, 0.4) * squash(f, TL.toggle - 4, 0.14, 4))));
    L.dots.forEach((d, i) => { let y = 0; for (const s of [TL.dots[i], TL.dots[i + 3]]) { const t = (f - s) / 22; if (t > 0 && t < 1) y = 0.2 * Math.sin(Math.PI * t); }
      const sy2 = Math.min(squash(f, TL.dots[i] + 22, 0.25, 3, 4, 0.3), squash(f, TL.dots[i + 3] + 22, 0.25, 3, 4, 0.3));
      P[SLOT.d1 + i] = M.chain(M.T(0, y, 0), sq([d[0], d[1] - 0.09, 0.05], sy2), about([d[0], d[1], 0.05], M.S(pop(f, TL.ui + 20 + i * 4, 3, 0.4)))); }); }
  return { P, G };
}

// 弹簧滤波：零件的“软 / 硬”姿态 = 它过去 60 帧的姿态 ⊗ 弹簧的冲激响应
const KS = FUR.springKernel(2.6, 0.22, 60, 60), KH = FUR.springKernel(4.6, 0.3, 60, 60);
function setParts(F, f) {
  const now = poses(f), soft = now.P.map(() => new Float32Array(16)), stiff = now.P.map(() => new Float32Array(16));
  for (let k = 0; k < 60; k++) { const p = k === 0 ? now.P : poses(f - k - 0.5).P, a = KS[k], b = KH[k];
    for (let s = 0; s < p.length; s++) { const m = p[s], so = soft[s], st = stiff[s]; for (let i = 0; i < 16; i++) { so[i] += m[i] * a; st[i] += m[i] * b; } } }
  now.P.forEach((m, s) => F.setPart(s, m, soft[s], stiff[s], now.G[s], 1));
  return now;
}

const MORPHS = [[TL.burst[0], TL.burst[1], 'ball', 'title', 0.55], [TL.bald[0], TL.bald[1], 'title', 'ball', 0.25], [TL.cupMorph[0], TL.cupMorph[1], 'ball', 'cup', 0.6],
  [TL.bearMorph[0], TL.bearMorph[1], 'cup', 'bear', 0.45], [TL.hatMorph[0], TL.hatMorph[1], 'bear', 'hat', 0.6], [510, 534, 'hat', 'ball', 0.5],
  [TL.uiMorph[0], TL.uiMorph[1], 'ball', 'ui', 0.5], [TL.outMorph[0], TL.outMorph[1], 'ui', 'ball', 0.5], [TL.burst2[0], TL.burst2[1], 'ball', 'title', 0.55]];
// 镜头关键帧：[帧, 眼睛, 看向, 视角]；两帧之间“看向”线性走，眼睛到目标的距离按等比走（推拉的速度才均匀）
const CAM = [[0, [0, 1.75, 5.7], [0, 1.62, 0], 0.55], [14, [0, 1.5, 5.9], [0, 1.25, 0], 0.55], [40, [0, 1.5, 6.4], [0, 1.2, 0], 0.55], [52, [0, 1.5, 6.4], [0, 1.2, 0], 0.55], [92, [0, 1.5, 7.5], [0, 1.4, 0], 0.55], [120, [0, 1.5, 7.1], [0, 1.4, 0], 0.55],
  [148, [0.05, 2.1, 0.66], [0, 2.075, 0], 0.55], [165, [0.02, 2.1, 0.7], [0, 2.075, 0], 0.55], [208, [0, 1.25, 5.6], [0, 1.05, 0], 0.55], [217, [0, 1.25, 5.6], [0, 1.05, 0], 0.55],
  [252, [0, 2.7, 5.5], [0, 0.55, 0], 0.55], [322, [0.7, 2.3, 5.1], [0, 0.55, 0], 0.55], [348, [0, 1.45, 7.5], [0, 1.22, 0], 0.55], [427, [0, 1.4, 6.7], [0, 1.22, 0], 0.55],
  [460, [0, 1.95, 7.3], [0, 1.4, 0], 0.55], [510, [0, 1.85, 6.9], [0, 1.4, 0], 0.55], [536, [-1.45, 1.25, 6.5], [-1.45, 1.05, 0], 0.55], [744, [-1.45, 1.25, 6.3], [-1.45, 1.05, 0], 0.55],
  [772, ...uiCam(720, 400, 1.5)], [884, ...uiCam(720, 400, 1.5)], [900, ...uiCam(720, 620, 1.5)], [944, ...uiCam(720, 620, 1.5)], [960, ...uiCam(720, 730, 1.5)], [1014, ...uiCam(720, 730, 1.5)], [1050, [0, 1.35, 5.4], [0, 1.1, 0], 0.55], [1080, [0, 1.4, 5.7], [0, 1.15, 0], 0.55], [1116, [0, 1.5, 7.5], [0, 1.4, 0], 0.55], [1200, [0, 1.5, 7.0], [0, 1.4, 0], 0.55]];
function camAt(f) {
  let i = 0; while (i + 2 < CAM.length && f >= CAM[i + 1][0]) i++;
  const a = CAM[i], b = CAM[i + 1], t = ease.inOut3(prog(f, a[0], b[0]));
  const at = lerp3(a[2], b[2], t), da = [0, 1, 2].map(k => a[1][k] - a[2][k]), db = [0, 1, 2].map(k => b[1][k] - b[2][k]);
  const la = Math.hypot(...da), lb = Math.hypot(...db), dir = lerp3(da.map(v => v / la), db.map(v => v / lb), t), dl = Math.hypot(...dir), dist = la * Math.pow(lb / la, t);
  return { eye: [0, 1, 2].map(k => at[k] + dir[k] / dl * dist), at, fov: lerp(a[3], b[3], t) };
}
// 背景色接力：[帧, 颜色名]，在换章的那次变形里渐变过去
const BGS = [[0, 'blue'], [TL.cupMorph[0], 'green'], [TL.bearMorph[0], 'violet'], [TL.hatMorph[0], 'magenta'], [510, 'blue'], [TL.rules[1], 'violet'], [TL.rules[2], 'green'], [TL.rules[3], 'blue'], [TL.rules[4], 'violet'], [TL.uiMorph[0], 'cream'], [TL.outMorph[0], 'blue']];
const hexMix = (a, b, t) => { const A = FUR.srgb(a), B = FUR.srgb(b); return '#' + [0, 1, 2].map(k => Math.round(255 * Math.pow(lerp(A[k], B[k], t), 1 / 2.2)).toString(16).padStart(2, '0')).join(''); };
function bgAt(f) {
  let i = 0; while (i + 1 < BGS.length && f >= BGS[i + 1][0]) i++;
  const cur = BG[BGS[i][1]], prev = BG[BGS[Math.max(0, i - 1)][1]], inRule = BGS[i][0] >= TL.rules[1] && BGS[i][0] <= TL.rules[4];
  const t = ease.inOut2(prog(f, BGS[i][0], BGS[i][0] + (inRule ? 5 : 26)));
  return [hexMix(prev[0], cur[0], t), hexMix(prev[1], cur[1], t)];
}
const palMix = (a, b, t) => ({ root: hexMix(a.root, b.root, t), tip: hexMix(a.tip, b.tip, t), len: lerp(a.len, b.len, t), curl: lerp(a.curl, b.curl, t), gloss: lerp(a.gloss, b.gloss, t), droop: lerp(a.droop, b.droop, t) });
const xf = (m, p) => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];

// 这一帧交给渲染器的全部参数
function stateAt(F, f) {
  const ps = setParts(F, f), P = ps.P, cam = camAt(f), bg = bgAt(f);
  let mi = -1; MORPHS.forEach((m, i) => { if (f >= m[0]) mi = i; });
  const s = { t: f / 60, ...cam, bg, len: 0.15, width: 0.007, wind: [1, 0.15, 0.2, 0.1], occ: [], beads: [], push: [], base: 0.03, f };
  if (mi < 0) s.A = 'ball';
  else { const m = MORPHS[mi], D = m[1] - m[0]; s.A = m[2]; s.B = m[3]; s.arc = m[4]; s.spread = 0.6; s.mix = prog(f, m[0], m[1]); s.settle = Math.max(0, f - m[1]) / D * 1.6; }
  if (s.mix > 0 && s.mix < 1 && s.B !== 'ball') s.base = 0;               // 飞在半路的毛不带“皮”
  const shape = s.mix === undefined || s.mix >= 1 ? (s.B || s.A) : null, ballC = xf(P[SLOT.ball], [0, 1, 0]);
  const inBall = shape === 'ball' || (mi >= 0 && MORPHS[mi][2] === 'ball' && s.mix < 0.4);
  if (inBall) s.occ.push([...ballC, 0.98]);
  if (shape === 'cup') s.occ.push([0, 0.55, 0, 0.72], [0, -0.75, 0, 1.3]);
  if (shape === 'bear') { s.occ.push([...xf(P[SLOT.head], [0, 1.88, 0.05]), 0.6], [0, 0.78, 0, 0.7], [-0.52, 0.28, 0.65, 0.3], [0.52, 0.28, 0.65, 0.3], [...xf(P[SLOT.armR], [0.82, 0.9, 0.2]), 0.24], [-0.82, 0.9, 0.2, 0.24]);
    const e = pop(f, TL.eyes, 4, 0.4), hm = P[SLOT.head];
    if (f >= TL.eyes) s.beads.push([...xf(hm, [-0.25, 2.0, 0.6]), 0.07 * e, 0.02, 0.015, 0.012, 1], [...xf(hm, [0.25, 2.0, 0.6]), 0.07 * e, 0.02, 0.015, 0.012, 1], [...xf(hm, [0, 1.83, 0.8]), 0.095 * e, 0.05, 0.02, 0.012, 1]); }
  if (shape === 'hat') s.occ.push([...xf(P[SLOT.hat], [0, 0.8, 0]), 0.95]);
  // 01 一根毛：只画前 count 根；“皮”一直在
  if (f >= TL.bald[0] && f < TL.cupMorph[0]) { let c = f < TL.oneGrow ? 0 : 1; TL.counts.forEach((cf, i) => { if (f >= cf) c = Math.min(F.N, 8 ** (i + 1) * (i === 5 ? 2 : 1)); });
    const last = TL.counts[5]; if (f >= last) c = Math.round(lerp(8 ** 5 * 8, F.N, ease.out3(prog(f, last, last + 5))));
    s.count = c; s.countShown = c; const solo = 1 - prog(f, TL.counts[0], TL.counts[2]);       // 只有一根的时候：站直、画粗一点，看得清
    s.frizz = lerp(0.4, 0.06, solo); s.clump = lerp(0.55, 0.05, solo); s.width = lerp(0.007, 0.012, solo); s.wind = [1, 0, 0.2, lerp(0.1, 0.16, solo)]; s.grav = [0, -1 + solo, 0]; }
  if (shape === 'cup' || (mi >= 0 && MORPHS[mi][3] === 'cup')) { s.len = 0.15; s.clumpSize = 0.09; }
  // 05 五条规则：每张卡前 16 帧是“关”，之后“打开”
  const ri = TL.rules.findIndex(c => f >= c && f < c + 45);
  if (ri >= 0 && f < TL.uiMorph[0]) { const on = ease.inOut2(prog(f, TL.rules[ri] + TL.ruleOn, TL.rules[ri] + TL.ruleOn + 7)); s.rule = ri; s.ruleOn = on;
    if (ri === 0) { F.tone(TONE.pink, palMix({ ...PAL.pink, root: '#e23a82', tip: '#e23a82' }, PAL.pink, on)); s.deep = lerp(1, 0.3, on); }
    if (ri === 1) { F.tone(TONE.pink, palMix({ ...PAL.pink, curl: 0, droop: 0 }, PAL.pink, on)); s.vary = on; s.frizz = 0.4 * on; s.clump = 0.55 * on; }
    if (ri === 2) { s.rimCol = [4.2 * on, 3.9 * on, 4.6 * on]; s.keyCol = [2.3, 2.15, 1.95].map(v => v * lerp(0.75, 0.3, on)); s.rim = [-0.6 * Math.cos(f / 14), 0.4, -0.8]; s.amb = [0.22, 0.22, 0.3]; }
    if (ri === 3) s.spring = 1.5 * on;
    if (ri === 4) { const c = TL.rules[4]; for (let k = 0; k < 4; k++) { const t = prog(f - k * 3.5, c + 6, c + 40), e = ease.inOut2(t), x = lerp(-0.8, 0.8, e), y = 1.05 + 0.32 * Math.sin(e * 6.28318);
        const z = Math.sqrt(Math.max(0.05, 1.25 - x * x - (y - 1) ** 2)); if (t > 0 && t < 1 || k === 0) s.push.push([x, y, z, [0.42, 0.36, 0.3, 0.22][k] * Math.min(1, prog(f, c + 3, c + 9)) * (1 - prog(f, c + 40, c + 45))]); } }
  } else if (f >= 505 && f < TL.uiMorph[1]) F.tone(TONE.pink, PAL.pink);
  // 06 界面：墙 + 开关的轨道画在背景里；心被点之前是灰的
  if (shape === 'ui' || (mi >= 0 && (MORPHS[mi][3] === 'ui' || MORPHS[mi][2] === 'ui'))) {
    const inUI = MORPHS[mi][3] === 'ui' ? ease.inOut2(prog(f, TL.uiMorph[0], TL.uiMorph[1])) : 1 - ease.inOut2(prog(f, TL.outMorph[0], TL.outMorph[0] + 14));
    // 地面 → 墙：亮度、光、暗角、影子全部按 inUI 渐变；只有“换成一面墙”这件事在 0.92 才切，那时两边已经一样了
    const onWall = inUI > 0.92; s.wallMix = inUI; if (onWall) s.wall = -0.02;
    s.key = lerp3([0.45, 0.8, 0.5], [0.35, 0.75, 0.9], inUI); s.keyCol = lerp3([2.3, 2.15, 1.95], [2.0, 1.95, 1.9], inUI); s.amb = lerp3([0.3, 0.3, 0.36], [0.42, 0.4, 0.42], inUI);
    s.vignette = lerp(0.3, 0.05, inUI); s.spot = [0.5, 0.55, 0.35 * (1 - inUI)]; s.shadow = onWall ? prog(inUI, 0.92, 1) : 1 - inUI;
    const like = ease.out3(prog(f, TL.tapHeart + 3, TL.tapHeart + 12)); F.tone(TONE.heart, palMix(PAL.heartOff, PAL.heart, like));
    const on = f < TL.toggle ? 0 : ease.out3(prog(f, TL.toggle, TL.toggle + 12));
    s.pill = [LAY.track[0], LAY.track[1], 0.26, 0.142]; s.pillCol = hexMix('#d9cfd6', '#34d27b', on); s.pillOn = onWall ? prog(f, TL.ui + 10, TL.ui + 22) * prog(inUI, 0.92, 1) : 0;
    s.occ.push([LAY.heart[0], LAY.heart[1] - 0.02, 0.1, 0.36 * pop(f, TL.ui + 6, 3, 0.4)], [...xf(P[SLOT.knob], [LAY.knobOff[0], LAY.knobOff[1], 0.06]), 0.13],
      ...LAY.dots.map((d, i) => [...xf(P[SLOT.d1 + i], [d[0], d[1], 0.05]), 0.1]));
    s.len = 0.15; s.width = 0.004; s.base = 0.014; s.clumpSize = 0.05; s.wind = [1, 0, 0, 0.04];
    if (f >= TL.tapHeart - 2 && f < TL.tapHeart + 8) s.push.push([LAY.heart[0], LAY.heart[1], 0.3, 0.3 * Math.sin(Math.PI * prog(f, TL.tapHeart - 2, TL.tapHeart + 8))]);
  }
  s.fade = 1 - prog(f, TL.end - 14, TL.end - 1) ** 2;                    // 第 0 帧就是封面，不淡入
  return s;
}
