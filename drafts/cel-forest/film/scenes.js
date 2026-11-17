// 手绘动画 v3 · 四个场景的分层（只在 bake 时运行）。每个函数返回 [{ name, c }]，c 是画布。
// 坐标：每个场景自己的“世界”，1920 宽为基准；film.html 里按深度做视差。
const SCENES = {};
const BAKE_S = 1.5;
// ① 夏 · 正午 · 稻田（第一轮候选封面那一张：积雨云、电线杆、稻田、前景草；水粉笔触重画）
SCENES.field = async () => {
  const L = GHIBLI.paintLayers(ANIME.renderLayers(BAKE_S).filter(l => l.key !== 'cel'), BAKE_S);
  return L.map(l => ({ name: l.key, c: l.canvas }));
};
const palMixL = (P, c, t) => ({ dark: mixc(P.dark, c, t), mid: mixc(P.mid, c, t), light: mixc(P.light, c, t), hi: mixc(P.hi, c, t) });
const sceneQ = q => { Q = q; };

// ② 林 · 午后（第二版那片分色的树林，拆成远 / 中 / 近三层 + 雾带）。世界 2300 × 1240
SCENES.forest = async () => {
  sceneQ(1.4);
  const LW = 2300, LH = 1240, FAR = mk(LW, LH), MID = mk(LW, LH), FRONT = mk(LW, LH);
  let g = FAR.g; const SUN = [1380, 230];
  paintSky(g, LW, LH, [[0, '#b9cdbd'], [0.2, '#ece2bd'], [0.36, '#fbe3b0'], [0.6, '#fbeccc'], [1, '#f6ead0']], 140, 900);
  glow(g, SUN[0], SUN[1], 760, '#fff4cc', 0.85, 'screen');
  [[1250, 120, 700, 20], [800, 210, 520, 16], [1700, 250, 420, 14], [400, 160, 500, 14]].forEach(([x, y, w, h], i) => streak(g, { x, y, w, h, seed: 141 + i, sh: '#c88c97', mid: '#e3a7a2', lit: '#f6d8c6', rim: '#fff6e6', lx: 0.15, ly: 0.98, soft: 0.05 }));
  const r = RNG(142);
  { const P = palMixL(MZ.leafFar, MZ.haze, 0.18);
    for (let x = -60; x < LW + 80; x += r.range(70, 120)) { if (x > 1100 && x < 1640 && r() < 0.8) continue; dabClump(g, x, r.range(200, 420), r.range(110, 190), r.range(90, 150), 400 + x, P, { cs: 2.4, leaf: 20 }); }
    for (let x = -60; x < LW + 80; x += r.range(60, 110)) dabClump(g, x, r.range(480, 640), r.range(120, 200), r.range(80, 130), 500 + x, palMixL(MZ.leafFar, MZ.haze, 0.05), { cs: 2.4, leaf: 20 });
    for (let x = -60; x < LW + 80; x += r.range(60, 110)) dabClump(g, x, r.range(680, 760), r.range(80, 140), r.range(40, 70), 600 + x, palMixL(MZ.leafMid, MZ.haze, 0.35), { cs: 2.4, leaf: 18 }); }
  for (let i = 0; i < 34; i++) { const x = r.range(0, LW), w = r.range(9, 22); trunk(g, { x, top: r.range(150, 420), bot: 790, w, seed: 150 + i, P: MZ.barkFar, moss: i % 3 === 0, flare: 0.1 }); }
  mistBand(g, 0, LW, 760, 70, MZ.mist, 0.75, 143);
  paperize(FAR, 0.3);
  g = MID.g;
  for (const [x, w, s] of [[440, 40, 1], [585, 30, 2], [1540, 44, 3], [1680, 32, 4], [1800, 50, 5], [880, 26, 6], [2150, 40, 7]]) trunk(g, { x, top: -20, bot: 830, w, seed: 170 + s, P: MZ.barkMid, flare: 0.3 });
  for (const [x, y, w, h] of [[300, 120, 460, 280], [700, 60, 420, 240], [1760, 110, 560, 300], [2080, 220, 320, 280]]) crown(g, x, y, w, h, 700 + x, palMixL(MZ.leafMid, MZ.haze, 0.15), { cs: 3, n: 7, leaf: 20 });
  mistBand(g, 0, LW, 820, 50, MZ.mist, 0.5, 144);
  const floor = new Path2D(); floor.rect(-20, 800, LW + 40, LH);
  const fg = g.createLinearGradient(0, 800, 0, LH); fg.addColorStop(0, '#b6bd6e'); fg.addColorStop(0.25, '#8fa94e'); fg.addColorStop(0.6, '#557f37'); fg.addColorStop(1, '#2c4a2a');
  g.fillStyle = fg; g.fill(floor);
  for (let i = 0; i < 40; i++) dab(g, r.range(500, 1800), r.range(820, 1000), r.range(60, 200), r.range(8, 22), 0, rgba('#e8dc8a', r.range(0.15, 0.3)));
  clover(g, RNG(145), 30000, (rr) => { const y = 800 + Math.pow(rr(), 1.3) * (LH - 800), k = 0.4 + (y - 800) / 260; return [rr.range(-20, LW + 20), y, k]; }, { dark: '#3d6a33', mid: '#5f8f3a', light: '#97b84c', hi: '#d5d77e' });
  grassArea(MID, { path: floor, bbox: [-20, 800, LW + 20, LH + 10], seed: 146, density: 0.45, hAt: (y) => 3 + Math.pow(clamp((y - 800) / 380), 1.5) * 70, litAt: (x, y) => clamp(0.85 - (y - 800) / 300 - Math.abs(x - 1150) / 2200), cols: { dark: '#2e5030', mid: '#558036', light: '#9dbb52', tip: '#e8dc8a' } });
  for (const [x, y, rx, ry] of [[250, 840, 160, 70], [520, 860, 120, 60], [1640, 850, 150, 66], [1930, 870, 170, 80], [700, 830, 80, 36], [1460, 826, 90, 36], [1160, 860, 210, 92]]) dabClump(g, x, y, rx, ry, 1000 + x, MZ.leafSun, { ds: 3.4 });
  starFlowers(g, RNG(148), 240, (rr) => [rr.range(0, LW), rr.range(840, LH), 0.6], 1);
  paperize(MID, 0.3);
  g = FRONT.g;
  for (const [x, w, s] of [[70, 150, 1], [330, 86, 2], [1990, 160, 3], [2230, 110, 4]]) { trunk(g, { x, top: -30, bot: LH + 10, w, seed: 180 + s, P: MZ.bark, ink: 2.2, roots: true, flare: 0.5, res: 0.4 }); dabClump(g, x + (s % 2 ? 60 : -60), LH - 40, 140, 70, 1100 + s, MZ.leaf, { ds: 4 }); }
  canopyTop(g, LW, 70, 140, 160, MZ.leaf, { nv: 70, v0: 60, v1: 300, skip: (x) => x > 1050 && x < 1560 && hash(x | 0, 3, 3) < 0.6 });
  for (const [x, y, w, h] of [[120, 60, 520, 300], [2090, 60, 560, 320], [520, 10, 360, 180], [1800, 0, 380, 180]]) crown(g, x, y, w, h, 1200 + x, MZ.leaf, { ds: 4, n: 7, lx: 0.4, ly: 0.9, bias: -0.15 });
  paperize(FRONT, 0.3);
  // 转场时扫过画面的一整片树冠：叶团只长在中间，四边都是碎的（不会有直边扫过屏幕）。世界 3000 × 1800
  const CAN = mk(3000, 1800); { const cg = CAN.g, rr = RNG(190);
    for (let y = 330; y < 1480; y += 64) for (let x = 330; x < 2680; x += rr.range(80, 130)) dabClump(cg, x, y + rr.range(-30, 30), rr.range(140, 230), rr.range(100, 160), 3000 + x + y * 7, y < 460 || y > 1360 || x < 460 || x > 2560 ? MZ.leaf : palMixL(MZ.leaf, '#0e1a14', 0.3), { ds: 4.4 });
    paperize(CAN, 0.3); }
  sceneQ(1);
  return [{ name: 'far', c: FAR }, { name: 'mid', c: MID }, { name: 'front', c: FRONT }, { name: 'canopy', c: CAN }];
};

// ③ 云海 · 黄昏（新）：同一套“一堆球 → 模糊高度场 → 法线 → 两色”的积雨云，换成低处的太阳从右边照：亮面蜜桃、影子紫。世界 2400 × 1350
SCENES.clouds = async () => {
  sceneQ(BAKE_S);
  const LW = 2400, LH = 1350, S = BAKE_S, SUN = [1620, 820];
  const lay = () => { const c = HD.canvas(LW * S, LH * S), g = c.getContext('2d'); g.scale(S, S); return [c, g]; };
  const SKY = mk(LW, LH); let g = SKY.g;
  const ST = [[0, '#1d2a64'], [0.2, '#373c86'], [0.4, '#7c5aa0'], [0.52, '#c4709c'], [0.6, '#ee8f7c'], [0.66, '#fab27a'], [0.72, '#ffd79c'], [1, '#ffe9c0']];
  paintSky(g, LW, LH, ST, 301, 1400);
  glow(g, SUN[0], SUN[1], 1200, '#ffb46a', 0.75, 'screen'); glow(g, SUN[0], SUN[1], 420, '#fff0c8', 0.95, 'screen');
  g.fillStyle = '#fff8e4'; g.beginPath(); g.arc(SUN[0], SUN[1], 56, 0, TAU); g.fill();
  stars(g, LW, LH * 0.34, 260, 302, (y) => clamp(1 - y / (LH * 0.3)) * 0.8, 0.03);
  paperize(SKY, 0.25);
  const C = { lit0: '#ffc89a', lit1: '#fff1d6', warm: '#ffb877', rimC: '#e7a0b6', bandC: '#f29a8a', shadowTop: '#a983b6', shadowBot: '#5f548f', light: [.8, .02, .55], Wmax: LW, x1: LW };
  const [TOW, tg] = lay();
  ANIME.drawCloud(tg, S, ANIME.cloudSpheres([{ x: 420, base: 900, top: 110, hw: 360, lean: .04, z0: 0 }, { x: 760, base: 900, top: 430, hw: 230, lean: -.03, z0: 140 }, { x: 160, base: 900, top: 380, hw: 220, z0: 80 }], 31), { ...C, base: 900, top: 110, x0: 0, x1: 1150, y0: 0, haze: '#f6b49c', hazeH: 260, nseed: 31 });
  ANIME.drawCloud(tg, S, ANIME.cloudSpheres([{ x: 2040, base: 900, top: 240, hw: 300, lean: -.04, z0: 0 }, { x: 2290, base: 900, top: 470, hw: 220, z0: 120 }, { x: 1800, base: 900, top: 560, hw: 170, z0: 160 }], 32), { ...C, base: 900, top: 240, x0: 1450, x1: LW, y0: 120, haze: '#f6b49c', hazeH: 260, nseed: 32 });
  ANIME.drawCloud(tg, S, ANIME.cloudSpheres([{ x: 1180, base: 880, top: 640, hw: 150, z0: 0 }, { x: 1320, base: 880, top: 700, hw: 110, z0: 40 }], 33), { ...C, base: 880, top: 640, x0: 950, x1: 1500, y0: 520, haze: '#f6b49c', hazeH: 120, nseed: 33 });
  // 云海：一排排低矮的积云，越近越大、雾越少
  const sea = (g, rows, seed) => { const r = RNG(seed); for (const [base, hw, ht, hz] of rows) { const T = []; g.save(); const fg = g.createLinearGradient(0, base - ht * .35, 0, base + 160); fg.addColorStop(0, '#f2b29e'); fg.addColorStop(1, '#c48fae'); g.fillStyle = fg; g.fillRect(-10, base - ht * .35, LW + 20, LH); g.restore();
    for (let x = -hw; x < LW + hw; x += hw * r.range(.55, .85)) T.push({ x, base, top: base - ht * r.range(.7, 1.2), hw: hw * r.range(.8, 1.2), z0: r.range(0, 60) });
    ANIME.drawCloud(g, S, ANIME.cloudSpheres(T, seed + base), { ...C, light: [.45, -.7, .6], shadowTop: '#c08fb4', shadowBot: '#8a6aa6', base, top: base - ht * 1.3, x0: 0, x1: LW, y0: base - ht * 1.6, haze: '#f3b29c', hazeH: ht * hz, nseed: seed + base }); } };
  const [SEA1, s1] = lay(); sea(s1, [[930, 90, 50, 2.6], [970, 120, 70, 2.2], [1020, 150, 90, 1.8]], 341);
  const [SEA2, s2] = lay(); sea(s2, [[1090, 210, 120, 1.5], [1200, 280, 160, 1.2], [1350, 360, 210, 1]], 351);
  const P = GHIBLI.paintLayers([{ key: 'clouds', canvas: TOW }, { key: 'clouds', canvas: SEA1 }, { key: 'clouds', canvas: SEA2 }], S);
  // 往下扎时扫过画面的云团：一摞云海，底边用一圈圆裁成云的下沿（上下两条边都是碎的）。世界 2400 × 2400，不过笔触（扫得很快）
  const WISP = HD.canvas(LW * S, 2400 * S), wg = WISP.getContext('2d'); wg.scale(S, S);
  sea(wg, [[1000, 300, 520, .5], [1250, 340, 560, .5], [1500, 360, 600, .5], [1750, 380, 620, .5], [2050, 400, 640, .5]], 361);
  { const m = HD.canvas(LW * S, 2400 * S), mg = m.getContext('2d'), rr = RNG(362); mg.scale(S, S); mg.fillStyle = '#000'; mg.fillRect(0, 0, LW, 1900);
    for (let x = -100; x < LW + 100; x += rr.range(90, 160)) { const r0 = rr.range(110, 230); mg.beginPath(); mg.arc(x, 1900 + rr.range(-40, 120), r0, 0, TAU); mg.fill(); }
    wg.save(); wg.setTransform(1, 0, 0, 1, 0, 0); wg.globalCompositeOperation = 'destination-in'; wg.drawImage(m, 0, 0); wg.restore(); }
  // 分色：和树林、夜景同一套“5 个平色”（按亮度落到 6 级色阶上，边缘保留硬边），再压一层纸纹
  const RAMP = ['#4f4682', '#7a5f9e', '#b585a8', '#eaa49a', '#ffcfa2', '#fff0d4'].map(hex), TH = [.3, .42, .55, .68, .82];
  const poster = c => { const g2 = c.getContext('2d'), im = g2.getImageData(0, 0, c.width, c.height), d = im.data;
    for (let i = 0; i < d.length; i += 4) { if (!d[i + 3]) continue; const L = (d[i] * .3 + d[i + 1] * .55 + d[i + 2] * .15) / 255; let k = 0; while (k < 5 && L > TH[k]) k++; const C = RAMP[k]; d[i] = C[0]; d[i + 1] = C[1]; d[i + 2] = C[2]; d[i + 3] = d[i + 3] > 110 ? 255 : 0; }
    g2.putImageData(im, 0, 0); c.g = g2; paperize(c, .3); return c; };
  P.forEach(l => poster(l.canvas));
  sceneQ(1);
  return [{ name: 'sky', c: SKY }, { name: 'towers', c: P[0].canvas }, { name: 'sea1', c: P[1].canvas }, { name: 'sea2', c: P[2].canvas }, { name: 'wisp', c: WISP }];
};

// ④ 夜 · 终点站（新）：银河、远山上的小镇灯火、站牌、路灯、电线杆、夜里的树；草是蓝的。世界 2300 × 1294
SCENES.night = async () => {
  sceneQ(1.4);
  const LW = 2300, LH = 1294, SKY = mk(LW, LH), FAR = mk(LW, LH), MID = mk(LW, LH), FG = mk(LW, LH);
  const HOR = 860;
  let g = SKY.g;
  paintSky(g, LW, LH, [[0, '#070e2a'], [0.3, '#0f1d4a'], [0.55, '#1f3470'], [0.66, '#3a4f8c'], [0.72, '#6a6fa6'], [0.8, '#8f7fae'], [1, '#2a3060']], 401, 1200);
  stars(g, LW, HOR, 1400, 402, (y) => clamp(1.15 - y / HOR), 0.025);
  milkyWay(g, LW, LH, 403, 300, 900, 1900, -100, 230, 1);
  glow(g, 1150, HOR, 900, '#9a86c8', 0.35, 'screen');
  moon(g, 1880, 210, 46, '#fff4d6', '#0f1d4a');
  paperize(SKY, 0.22);
  // 远山 + 小镇灯火
  g = FAR.g;
  peak(g, { cx: 520, hw: 760, h: 230, base: HOR + 10, seed: 411, sh: '#1a2350', lit: '#2c3a72', hz: '#5a5f96', hzA: 0.55, lightSide: 1 });
  peak(g, { cx: 1650, hw: 900, h: 300, base: HOR + 20, seed: 412, sh: '#151d45', lit: '#26336a', hz: '#5a5f96', hzA: 0.55, lightSide: -1 });
  peak(g, { cx: 1050, hw: 700, h: 140, base: HOR + 40, seed: 413, sh: '#111839', lit: '#1d2858', hz: '#4a5088', hzA: 0.4 });
  { const rr = RNG(414); for (let i = 0; i < 90; i++) { const x = rr.range(760, 1500), y = HOR + rr.range(-10, 34); const c = rr() < 0.7 ? '#ffd27a' : '#ffefc0'; dab(g, x, y, rr.range(1, 2.4), rr.range(1, 2.2), 0, c); glow(g, x, y, rr.range(6, 16), c, 0.35, 'lighter'); } }
  paperize(FAR, 0.25);
  // 中景：草地、土路、树、电线杆、站牌、路灯
  g = MID.g;
  const ground = new Path2D(); ground.moveTo(-20, HOR + 30); for (let x = -20; x <= LW + 20; x += 40) ground.lineTo(x, HOR + 30 - Math.sin(x / 520) * 18 - fbm(x * 0.004, 7, 9) * 26); ground.lineTo(LW + 20, LH + 20); ground.lineTo(-20, LH + 20); ground.closePath();
  const gg = g.createLinearGradient(0, HOR, 0, LH); gg.addColorStop(0, '#2b3f62'); gg.addColorStop(0.3, '#1c3048'); gg.addColorStop(1, '#0c1626');
  g.fillStyle = gg; g.fill(ground);
  // 土路：从近处弯到远处
  g.fillStyle = '#4a4f70'; g.beginPath(); g.moveTo(900, LH + 20); g.bezierCurveTo(1000, 1120, 1180, 1000, 1200, HOR + 40); g.lineTo(1232, HOR + 40); g.bezierCurveTo(1260, 1000, 1350, 1120, 1600, LH + 20); g.closePath(); g.fill();
  grassArea(MID, { path: ground, bbox: [-20, HOR, LW + 20, LH + 10], seed: 421, density: 0.5, hAt: (y) => 3 + Math.pow(clamp((y - HOR) / 420), 1.4) * 60, litAt: (x, y) => clamp(0.55 - Math.hypot(x - 1500, y - 1040) / 700), cols: { dark: '#0e1c2c', mid: '#1d3550', light: '#3f6488', tip: '#8fb0d0' } });
  drawTree(g, 420, HOR + 70, 1.35, TREE_NIGHT, -0.6, -0.7);
  const PP = { wood: '#2a2638', woodLit: '#4a4a70', insul: '#aab4d8' };
  const A = pole(g, 1880, HOR + 120, 520, 1.1, PP), B = pole(g, 2260, HOR + 60, 420, 0.85, PP), C0 = pole(g, 820, HOR + 20, 240, 0.5, PP);
  for (let k = 0; k < 4; k++) { wire(g, A[k], B[k], 30, 'rgba(20,20,40,.85)', 1.6); wire(g, C0[k], A[k], 60, 'rgba(20,20,40,.7)', 1.2); }
  drawSign(g, 1480, HOR + 210, 1.25, { post: '#3a4060', postLit: '#6a72a0', board: '#2f6aa8', boardSh: '#1f4a7a', rust: '#8a5a40', text: '#f4f0e0' });
  const lamp = drawLamp(g, 1700, HOR + 230, 1.0, { iron: '#1e2236', ironLit: '#4a5078', glass: '#3a3f5a' });
  paperize(MID, 0.25);
  // 前景：大叶子的草和狗尾草（两侧）
  g = FG.g;
  const rr = RNG(431);
  for (let i = 0; i < 520; i++) { const side = rr() < 0.5, x = side ? rr.range(-40, 520) : rr.range(1780, LW + 40), h = rr.range(90, 330); blade(g, x, LH + 10, h, rr.range(-0.35, 0.35) * h, Math.max(3, h * 0.06), jit(rr.pick(['#0a1422', '#0f1c30', '#16263e', '#1d3150']), rr, 10)); }
  for (let i = 0; i < 26; i++) { const side = rr() < 0.5, x = side ? rr.range(40, 420) : rr.range(1850, 2240), h = rr.range(200, 380), lean = rr.range(-0.2, 0.25) * h; g.strokeStyle = '#1d3150'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x, LH); g.quadraticCurveTo(x + lean * 0.3, LH - h * 0.6, x + lean, LH - h); g.stroke(); for (let k = 0; k < 18; k++) dab(g, x + lean + rr.range(-5, 5), LH - h + k * 3.4, 6, 3, 1.2, rgba('#5a7aa8', 0.7)); }
  paperize(FG, 0.2);
  sceneQ(1);
  return [{ name: 'sky', c: SKY }, { name: 'far', c: FAR }, { name: 'mid', c: MID, meta: { lamp } }, { name: 'fg', c: FG }];
};

// ③' 黎明 · 云海（和树林、夜景同一套 vibe-vedio 画风：平涂的分色云、硬边的亮面、山顶露出云海）。世界 2400 × 1350
SCENES.dawn = async () => {
  sceneQ(1.4);
  const LW = 2400, LH = 1350, SKY = mk(LW, LH), FAR = mk(LW, LH), SEA1 = mk(LW, LH), SEA2 = mk(LW, LH), WISP = mk(LW, 2400);
  const SUN = [1560, 800];
  let g = SKY.g;
  paintSky(g, LW, LH, [[0, '#14245a'], [0.25, '#2f3f86'], [0.45, '#6b5aa0'], [0.58, '#c9739a'], [0.66, '#f39a7a'], [0.72, '#ffc98a'], [0.78, '#ffe6b0'], [1, '#fff1d0']], 501, 1400);
  stars(g, LW, LH * 0.4, 400, 502, (y) => clamp(1 - y / (LH * 0.36)), 0.03);
  glow(g, SUN[0], SUN[1], 1100, '#ffb06a', 0.7, 'screen'); glow(g, SUN[0], SUN[1], 360, '#fff2cc', 0.95, 'screen');
  g.fillStyle = '#fff7e2'; g.beginPath(); g.arc(SUN[0], SUN[1], 54, 0, TAU); g.fill();
  [[600, 520, 900, 16], [1800, 560, 700, 14], [1200, 470, 600, 12], [300, 430, 520, 12], [2100, 450, 500, 11]].forEach(([x, y, w, h], i) => streak(g, { x, y, w, h, seed: 511 + i, sh: '#9a6aa0', mid: '#e48c98', lit: '#ffc596', rim: '#fff0cf', lx: 0.5, ly: 0.85, soft: 0.1 }));
  paperize(SKY, 0.22);
  // 远山：几座尖峰露出云海，朝太阳的一面被染成粉橙
  g = FAR.g;
  peak(g, { cx: 520, hw: 520, h: 420, base: 900, seed: 521, sh: '#3d3f7e', lit: '#e7a0a0', hz: '#f2b6a6', hzA: 0.7, lightSide: 1 });
  peak(g, { cx: 1180, hw: 380, h: 260, base: 900, seed: 522, sh: '#4a4a8a', lit: '#f0b0a0', hz: '#f2b6a6', hzA: 0.75, lightSide: 1 });
  peak(g, { cx: 2000, hw: 560, h: 470, base: 900, seed: 523, sh: '#38386f', lit: '#e09a9c', hz: '#f2b6a6', hzA: 0.7, lightSide: -1 });
  paperize(FAR, 0.25);
  const seaC = { sh: '#7a62a0', mid: '#d38ba0', lit: '#ffc8a2', rim: '#fff1d6', hazeC: '#f4b8a4', under: '#5a4a86', lx: 0.55, ly: -0.8 };
  cloudSea(SEA1.g, { ...seaC, w: LW, y0: 860, y1: 1000, r0: 30, r1: 60, rows: 5, haze: 0.85, seed: 531 });
  cloudSea(SEA2.g, { ...seaC, w: LW, y0: 1020, y1: 1300, r0: 80, r1: 170, rows: 4, haze: 0.25, seed: 532 });
  paperize(SEA1, 0.25); paperize(SEA2, 0.3);
  // 转场用的云团：一摞云海，底边是一圈圆（上下两条边都碎）
  cloudSea(WISP.g, { ...seaC, w: LW, y0: 700, y1: 1900, r0: 160, r1: 260, rows: 5, haze: 0.1, seed: 541 });
  { const m = document.createElement('canvas'); m.width = WISP.width; m.height = WISP.height; const mg = m.getContext('2d'), rr = RNG(542); mg.scale(1.4, 1.4); mg.fillStyle = '#000'; mg.fillRect(0, 0, LW, 1950);
    for (let x = -100; x < LW + 100; x += rr.range(90, 160)) { mg.beginPath(); mg.arc(x, 1950 + rr.range(-40, 120), rr.range(110, 230), 0, TAU); mg.fill(); }
    const wg = WISP.g; wg.save(); wg.setTransform(1, 0, 0, 1, 0, 0); wg.globalCompositeOperation = 'destination-in'; wg.drawImage(m, 0, 0); wg.restore(); }
  sceneQ(1);
  return [{ name: 'sky', c: SKY }, { name: 'far', c: FAR }, { name: 'sea1', c: SEA1 }, { name: 'sea2', c: SEA2 }, { name: 'wisp', c: WISP }];
};

// ⑤ 正午 · 山坡上的大树（和夜景、树林同一套分色平涂）：蓝天、横的流云、远山、一棵大树、花坡、电线杆一路远去。世界 2400 × 1350
SCENES.hill = async () => {
  sceneQ(1.4);
  const LW = 2400, LH = 1350, SKY = mk(LW, LH), FAR = mk(LW, LH), MID = mk(LW, LH), FG = mk(LW, LH);
  const HOR = 760;
  let g = SKY.g;
  paintSky(g, LW, LH, [[0, '#2a64b8'], [0.3, '#4a8fd6'], [0.55, '#8cc4ec'], [0.7, '#c6e4f2'], [1, '#eef6f2']], 601, 1400);
  glow(g, 300, 120, 900, '#fff6dc', 0.55, 'screen');
  [[700, 200, 900, 22], [1700, 150, 1000, 26], [1200, 320, 700, 18], [400, 380, 600, 16], [2100, 360, 640, 18], [1500, 470, 800, 14]].forEach(([x, y, w, h], i) => streak(g, { x, y, w, h, seed: 611 + i, sh: '#8fb0d8', mid: '#c4dcf0', lit: '#ffffff', rim: '#ffffff', lx: -0.3, ly: -0.95, soft: 0.1 }));
  cumulus(g, { x: 560, y: 700, w: 760, h: 300, seed: 620, sh: '#9cb6dc', mid: '#d4e4f4', lit: '#ffffff', rim: '#ffffff', lx: -0.4, ly: -0.9, flat: false });
  cumulus(g, { x: 1980, y: 690, w: 620, h: 240, seed: 621, sh: '#9cb6dc', mid: '#d4e4f4', lit: '#ffffff', rim: '#ffffff', lx: -0.4, ly: -0.9, flat: false });
  paperize(SKY, 0.22);
  g = FAR.g;
  peak(g, { cx: 500, hw: 900, h: 160, base: HOR + 20, seed: 631, sh: '#6e98b8', lit: '#9cc0d6', hz: '#c6e4f2', hzA: 0.7, lightSide: -1 });
  peak(g, { cx: 1800, hw: 1000, h: 200, base: HOR + 30, seed: 632, sh: '#6a92b0', lit: '#98bcd2', hz: '#c6e4f2', hzA: 0.7, lightSide: -1 });
  { const rr = RNG(633); for (let x = -40; x < LW + 40; x += rr.range(50, 90)) dabClump(g, x, HOR + 10 + rr.range(-6, 10), rr.range(60, 110), rr.range(26, 44), 640 + x, { dark: '#4f7a6a', mid: '#6c9a78', light: '#9cc08a', hi: '#cfdc9e' }, { cs: 2.4, leaf: 18 }); }
  paperize(FAR, 0.25);
  // 中景：一面山坡（从右下鼓起来），坡顶一棵大树，电线杆沿坡一路远去，花
  g = MID.g;
  const hill = new Path2D(); hill.moveTo(-20, HOR + 40); for (let x = -20; x <= LW + 20; x += 30) hill.lineTo(x, HOR + 40 - Math.max(0, Math.sin((x - 900) / 1700 * Math.PI)) * 220 - fbm(x * 0.004, 3, 6) * 20); hill.lineTo(LW + 20, LH + 20); hill.lineTo(-20, LH + 20); hill.closePath();
  const hg = g.createLinearGradient(0, HOR - 200, 0, LH); hg.addColorStop(0, '#9cc75a'); hg.addColorStop(0.35, '#6faa44'); hg.addColorStop(1, '#3f7a34'); g.fillStyle = hg; g.fill(hill);
  clover(g, RNG(651), 26000, (rr) => { const x = rr.range(-20, LW + 20), y = rr.range(HOR - 120, LH); return g.isPointInPath(hill, x * Q, y * Q) ? [x, y, 0.4 + (y - HOR + 120) / 300] : null; }, { dark: '#3f7a34', mid: '#5f9a3e', light: '#97c454', hi: '#d8e488' });
  grassArea(MID, { path: hill, bbox: [-20, HOR - 240, LW + 20, LH + 10], seed: 652, density: 0.4, hAt: (y) => 3 + Math.pow(clamp((y - HOR + 200) / 600), 1.4) * 60, litAt: (x, y) => clamp(0.9 - (y - HOR) / 500), cols: { dark: '#2f5a2a', mid: '#5a9038', light: '#a6cc5a', tip: '#eee08a' } });
  starFlowers(g, RNG(653), 600, (rr) => { const x = rr.range(0, LW), y = rr.range(HOR - 100, LH); return g.isPointInPath(hill, x * Q, y * Q) ? [x, y, 0.5 + (y - HOR) / 260] : null; }, 1);
  flowers(g, RNG(654), 260, (rr) => { const x = rr.range(0, LW), y = rr.range(HOR, LH); return g.isPointInPath(hill, x * Q, y * Q) ? [x, y, 0.6 + (y - HOR) / 220] : null; }, ['#f6d24a', '#f6f3ea', '#e98ab0', '#b9a2ee'], 5);
  const PP = { wood: '#6a5340', woodLit: '#a88a62', insul: '#e8eef4' };
  const poles = [[260, HOR + 300, 560, 1.3], [700, HOR + 120, 330, .8], [1000, HOR + 30, 200, .5], [1180, HOR - 10, 130, .34]].map(([x, gy, h, s]) => pole(g, x, gy, h, s, PP));
  for (let i = 0; i < poles.length - 1; i++) for (let k = 0; k < 4; k++) wire(g, poles[i][k], poles[i + 1][k], 26 - i * 6, 'rgba(40,40,50,.8)', 1.6 - i * .3);
  drawTree(g, 1640, 612, 1.4, TREE_DAY, -0.6, -0.8);
  paperize(MID, 0.25);
  g = FG.g;
  const rr = RNG(661);
  for (let i = 0; i < 520; i++) { const side = rr() < 0.55, x = side ? rr.range(-40, 640) : rr.range(1900, LW + 40), h = rr.range(90, 330); blade(g, x, LH + 10, h, rr.range(-0.35, 0.35) * h, Math.max(3, h * 0.06), jit(rr.pick(['#2c5a2c', '#3f7a34', '#5a9a3e', '#7cb64a']), rr, 12)); }
  flowers(g, RNG(662), 60, (r2) => { const side = r2() < 0.55, x = side ? r2.range(0, 600) : r2.range(1900, LW); return [x, LH - r2.range(20, 240), 2.2]; }, ['#f6d24a', '#ffffff', '#e98ab0'], 5);
  paperize(FG, 0.2);
  sceneQ(1);
  return [{ name: 'sky', c: SKY }, { name: 'far', c: FAR }, { name: 'mid', c: MID }, { name: 'fg', c: FG }];
};

// ⑥ 树林追逐用的前景树干条：很宽的透明画布，几根深色的近景树干（带苔藓、墨线），镜头横移时整条快速扫过。世界 4200 × 1240
SCENES.trunks = async () => {
  sceneQ(1.2);
  const LW = 4200, LH = 1240, T = mk(LW, LH), g = T.g;
  for (const [x, w, s] of [[300, 170, 1], [1150, 120, 2], [1900, 210, 3], [2750, 140, 4], [3500, 190, 5]]) {
    trunk(g, { x, top: -40, bot: LH + 20, w, seed: 900 + s, P: MZ.bark, ink: 2.4, roots: true, flare: 0.6, res: 0.4, moss: true });
    dabClump(g, x + (s % 2 ? 80 : -80), LH - 60, 170, 80, 950 + s, MZ.leaf, { ds: 4 });
    vine(g, x + 30, -20, 300 + s * 60, 960 + s, MZ.moss, 1.4);
  }
  paperize(T, 0.3);
  sceneQ(1);
  return [{ name: 'strip', c: T }];
};

// ⑦ 树杈特写：蓝天、远处虚掉的云，一根大树枝从左下伸进来分成两叉，上面和右边是一团团分色的叶子（帽子最后落在叉里）。世界 1920 × 1080
SCENES.branch = async () => {
  sceneQ(1.6);
  const LW = 1920, LH = 1080, SKY = mk(LW, LH), BR = mk(LW, LH), LV = mk(LW, LH);
  let g = SKY.g;
  paintSky(g, LW, LH, [[0, '#2a64b8'], [0.45, '#5a9ede'], [0.8, '#9ccdee'], [1, '#c6e4f2']], 701, 900);
  cumulus(g, { x: 500, y: 980, w: 900, h: 380, seed: 702, sh: '#9cb6dc', mid: '#d4e4f4', lit: '#ffffff', rim: '#ffffff', lx: -0.4, ly: -0.9, flat: false });
  cumulus(g, { x: 1600, y: 1000, w: 700, h: 300, seed: 703, sh: '#9cb6dc', mid: '#d4e4f4', lit: '#ffffff', rim: '#ffffff', lx: -0.4, ly: -0.9, flat: false });
  paperize(SKY, 0.2);
  // 树枝：从左下伸进来，在 (1020, 600) 分叉
  g = BR.g;
  const limb = (pts, w0, w1, seed) => { const P = new Path2D(), L = [], R = []; for (let i = 0; i < pts.length; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], m = Math.hypot(tx, ty) || 1, w = lerp(w0, w1, i / (pts.length - 1)); L.push([pts[i][0] - ty / m * w, pts[i][1] + tx / m * w]); R.push([pts[i][0] + ty / m * w, pts[i][1] - tx / m * w]); }
    P.moveTo(...L[0]); L.forEach(p => P.lineTo(...p)); for (let i = R.length - 1; i >= 0; i--) P.lineTo(...R[i]); P.closePath();
    g.fillStyle = '#6b4f3a'; g.fill(P); g.save(); g.clip(P); g.fillStyle = '#4a3428'; g.beginPath(); R.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); for (let i = R.length - 1; i >= 0; i--) g.lineTo(pts[i][0] + (R[i][0] - pts[i][0]) * .1, pts[i][1] + (R[i][1] - pts[i][1]) * .1); g.fill();
    g.fillStyle = rgba('#c99a6a', .8); g.beginPath(); L.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); for (let i = L.length - 1; i >= 0; i--) g.lineTo(pts[i][0] + (L[i][0] - pts[i][0]) * .45, pts[i][1] + (L[i][1] - pts[i][1]) * .45); g.fill();
    const r = RNG(seed); for (let i = 0; i < 60; i++) { const k = Math.floor(r() * (pts.length - 1)), u = r(), x = lerp(pts[k][0], pts[k + 1][0], u), y = lerp(pts[k][1], pts[k + 1][1], u); g.strokeStyle = rgba('#3a2a22', .5); g.lineWidth = r.range(1.5, 3); g.beginPath(); g.moveTo(x, y); g.lineTo(x + r.range(-8, 8), y + r.range(-14, 14)); g.stroke(); }
    patches(g, P, 0, 0, LW, LH, { sx: 50, sy: 30, seed: seed + 1, oct: 3, bands: [{ lo: 0.6, hi: 0.68, c: '#557f38' }, { lo: 0.68, c: '#86ab45' }] });
    g.restore(); ink(g, resample(L, 8, 0.6, seed + 2), 2.4, INK, seed + 2); ink(g, resample(R, 8, 0.6, seed + 3), 2.4, INK, seed + 3); };
  limb([[-60, 1180], [300, 980], [700, 760], [1020, 610]], 120, 70, 711);
  limb([[1000, 625], [1180, 470], [1330, 300], [1420, 120], [1470, -60]], 70, 34, 712);
  limb([[1010, 615], [1250, 590], [1520, 520], [1800, 470], [2000, 450]], 62, 26, 713);
  mossBed(g, [[640, 770, 120, 30], [920, 640, 90, 24], [1240, 586, 80, 20]], 714, 1.6);
  paperize(BR, 0.25);
  // 叶子：上面、右边、左上一团团（分色）
  g = LV.g;
  for (const [x, y, w, h, s] of [[300, 40, 700, 360, 1], [1500, -20, 900, 420, 2], [1820, 300, 420, 360, 3], [900, -60, 520, 260, 4], [1700, 640, 380, 300, 5]]) crown(g, x, y, w, h, 720 + s * 31, MZ.leafSun, { ds: 5, n: 7, lx: -0.4, ly: -0.85 });
  paperize(LV, 0.25);
  sceneQ(1);
  return [{ name: 'sky', c: SKY }, { name: 'limb', c: BR }, { name: 'leaves', c: LV }];
};
