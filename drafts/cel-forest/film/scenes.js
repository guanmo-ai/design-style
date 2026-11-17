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
