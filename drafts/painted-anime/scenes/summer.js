// 水粉背景 A：夏天的山坡。深蓝的天、一朵顶到画框的积雨云、风里的草、红屋顶、一棵大树、远处的海和小镇。
// 光从左上来：云、树、房子的亮面都朝左上，影子落在右下。全是原创的景，没有照搬任何一部片子的镜头或角色。
SCENES.summer = ctx => {
  const { W, H, rng, n1, n2, lerp, clamp, sstep, path, fill, ellipse, cr, thick, wob, grain, TAU } = HD;
  const { hex, mix, css, ramp, brush, wash, lobes, lobeClip, paintLobes, grass, block, profile } = PT;
  const r = rng(3), HZ = 672;

  // ================= 天 =================
  const sky = ramp([[0, '#1b58bd'], [0.3, '#2f78d4'], [0.62, '#69aee8'], [0.86, '#a6d6f2'], [1, '#cdeaf6']]);
  const skyAt = (x, y) => sky(clamp(y / HZ + (n2(x / 420, y / 210, 1) - 0.5) * 0.07));
  const g = ctx.createLinearGradient(0, 0, 0, HZ); [0, 0.3, 0.62, 0.86, 1].forEach(t => g.addColorStop(t, css(sky(t)))); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  wash(ctx, { box: [-60, -60, W + 60, HZ + 40], size: 78, color: skyAt, dir: () => 0.04, len: 3.2, seed: 1, vary: 5, bristles: 4 });
  wash(ctx, { box: [-60, -60, W + 60, HZ + 40], size: 36, color: skyAt, dir: () => -0.03, len: 3, seed: 2, vary: 4, bristles: 3, density: 0.7 });

  // ================= 云 =================
  const cloudRamp = ramp([[0, '#6784bd'], [0.3, '#8aa2d1'], [0.44, '#adc0e1'], [0.53, '#dce4f1'], [0.72, '#f6f5ef'], [1, '#fffdf3']]);
  function cloud(seeds, { floor, top, levels = 2, kids = 5, seed = 1, haze = 0, size = l => Math.max(5, l.R * 0.28), ratio = [0.4, 0.6], bias = null }) { const ls = lobes(seeds, { levels, kids, seed, floor, ratio }); ctx.save(); lobeClip(ctx, ls, { floor, seed });
    const hz = sky(0.92), post = (c, x, y) => { const h = clamp((y - top) / (floor - top)); if (haze) c = mix(c, hz, haze * (0.5 + 0.5 * h)); return mix(c, skyAt(x, y), sstep(0.8, 1, h) * 0.9); };
    paintLobes(ctx, ls, { ramp: cloudRamp, top, base: floor, seed, size, post, sphere: 0.66, noise: 0.07, bias });
    ctx.restore(); }
  // 地平线上的一排小云
  for (let i = 0; i < 9; i++) { const x = 60 + i * 230 + r() * 120, R = 34 + r() * 40; cloud([[x, HZ - 26, R], [x + R * 1.1, HZ - 18, R * 0.7], [x - R * 1.0, HZ - 14, R * 0.6]], { floor: HZ - 4, top: HZ - 150, levels: 1, kids: 4, seed: 40 + i, haze: 0.55, size: l => Math.max(4, l.R * 0.3) }); }
  // 左边、树后面的一朵
  cloud([[250, 300, 120], [90, 330, 100], [420, 320, 96], [560, 344, 70], [-30, 350, 80]], { floor: 372, top: 120, seed: 11, haze: 0.12 });
  // 主角：顶到画框的积雨云
  cloud([[1290, 540, 220], [1060, 590, 160], [1520, 580, 180], [1320, 370, 200], [1190, 270, 150], [1430, 250, 160], [1310, 150, 130], [880, 624, 104], [1700, 610, 130], [1560, 400, 130], [1090, 420, 120]], { floor: 656, top: 10, levels: 2, kids: 5, seed: 5, haze: 0.06, ratio: [0.28, 0.7], bias: (x, y) => 0.15 * clamp((1280 - x) / 420, -1, 1) + 0.05 });
  // ================= 远山、海 =================
  const ridge = (base, amp, sc, seed, x0, x1) => x => base - amp * (0.6 * n1(x / sc, seed) + 0.3 * n1(x / (sc * 0.37), seed + 3) + 0.5) * (1 - sstep(x0, x1, x));
  const far1 = ridge(HZ + 2, 60, 300, 4, 700, 1250), far2 = ridge(HZ + 4, 44, 210, 8, 520, 980);
  const band = (f, c0, c1, x0, x1, seed, yb = HZ + 8) => { const top = []; for (let x = x0; x <= x1; x += 8) top.push([x, f(x)]); ctx.save(); path(ctx, top.concat([[x1, yb], [x0, yb]])); ctx.fillStyle = css(hex(c0)); ctx.fill(); ctx.clip();
    wash(ctx, { box: [x0, HZ - 120, x1, yb], size: 14, color: (x, y) => mix(hex(c0), hex(c1), clamp((y - f(x)) / 60) + (n2(x / 50, y / 30, seed) - 0.5) * 0.4), dir: (x) => Math.atan2(f(x + 10) - f(x - 10), 20), len: 2.6, seed, vary: 5 }); ctx.restore(); };
  band(far1, '#6f9bd2', '#9cc3e6', -20, 1260, 81); band(far2, '#4f86b4', '#7fb0cf', -20, 990, 83);
  band(x => HZ - 4 - 26 * Math.max(0, Math.sin((x - 1560) / 300 * Math.PI)) * (0.7 + 0.3 * n1(x / 40, 5)), '#7ba6d6', '#a8cde9', 1560, 1860, 85, HZ + 2);
  // 海
  const sea = ramp([[0, '#5aa0dc'], [0.25, '#3c82cb'], [1, '#2a66b4']]);
  wash(ctx, { box: [-20, HZ, W + 20, HZ + 80], size: 12, color: (x, y) => y < HZ - 1 ? null : sea(clamp((y - HZ) / 60) + (n2(x / 160, y / 9, 3) - 0.5) * 0.25), dir: () => 0, len: 5, seed: 90, vary: 5, density: 1.6, jit: 0.04 });
  for (let i = 0; i < 150; i++) { const x = 900 + r() * 1000, y = HZ + 4 + r() * 46; brush(ctx, x, y, 0, 8 + r() * 26, 2.2, [236, 246, 252], r, { bristles: 1, alpha: 0.75, curve: 0 }); }

  // ================= 中景：田、小镇 =================
  const mid = profile([[-20, 652], [250, 640], [520, 668], [800, 700], [1100, 716], [1400, 706], [1700, 722], [1940, 714]]);
  const fieldC = ['#8fc873', '#a9d67c', '#74b36f', '#c2de86', '#63a56c', '#9bcd6c'].map(hex);
  const midAt = (x, y) => { if (y < mid(x)) return null; const u = (x + (y - 650) * 2.2) / 150, v = (y - 650) / 26 + Math.sin(x / 300) * 0.8, id = Math.floor(u) * 7 + Math.floor(v) * 13, k = Math.abs(Math.sin(id * 12.9898) * 43758.5453) % 1; let c = fieldC[(k * 6) | 0]; c = mix(c, hex('#a9d2e4'), 0.22 * (1 - clamp((y - 650) / 160))); return mix(c, [60, 120, 90], 0.3 * sstep(0.55, 0.7, n2((x + y) / 380, y / 160, 9))); };
  wash(ctx, { box: [-20, 620, W + 20, 960], size: 16, color: midAt, dir: () => -0.05, len: 2.6, seed: 95, vary: 6, density: 1.4 });
  // 田埂上的小树丛
  const bushRamp = ramp([[0, '#1f5142'], [0.4, '#2f7248'], [0.62, '#55994c'], [0.85, '#8cc45a'], [1, '#c4e07a']]);
  for (let i = 0; i < 70; i++) { const x = r() * W, y = mid(x) + 6 + r() * 120, R = 7 + r() * 13 + (y - 650) * 0.04; if (x > 1150 && x < 1700 && y < mid(x) + 60 && r() < 0.6) continue; paintLobes(ctx, lobes([[x, y, R], [x + R, y + 2, R * 0.7]], { levels: 1, kids: 3, seed: 200 + i }), { ramp: bushRamp, top: y - R * 2, base: y + R, seed: 200 + i, size: l => Math.max(3, l.R * 0.4), dabs: 'random', vary: 8, post: c => mix(c, hex('#9cc7dc'), 0.18) }); }
  // 小镇：一把小房子，红的蓝的屋顶
  const roofs = ['#c95f48', '#d27a52', '#4f79b0', '#b94f44', '#8a93a8', '#d9925c'];
  for (let i = 0; i < 46; i++) { const x = 1120 + r() * 620, y = mid(x) + 10 + Math.pow(r(), 1.4) * 64, s = 9 + (y - mid(x)) * 0.18 + r() * 5, hh = s * 0.75;
    fill(ctx, [[x, y - hh], [x + s * 1.15, y - hh], [x + s * 1.15, y], [x, y]], '#f3ecdc'); fill(ctx, [[x + s * 1.15, y - hh], [x + s * 1.6, y - hh - s * 0.12], [x + s * 1.6, y - s * 0.1], [x + s * 1.15, y]], '#a9b4cc');
    fill(ctx, [[x - s * 0.12, y - hh], [x + s * 1.27, y - hh], [x + s * 1.5, y - hh - s * 0.55], [x + s * 0.25, y - hh - s * 0.55]], roofs[i % 6]); fill(ctx, [[x + s * 1.15, y - hh], [x + s * 1.6, y - hh - s * 0.12], [x + s * 1.5, y - hh - s * 0.55]], '#8f9bb8');
    if (s > 13) fill(ctx, [[x + s * 0.3, y - hh * 0.7], [x + s * 0.55, y - hh * 0.7], [x + s * 0.55, y - hh * 0.3], [x + s * 0.3, y - hh * 0.3]], '#4a5f86'); }

  // ================= 近景：山坡 =================
  const fg = profile([[-20, 640], [200, 592], [430, 566], [700, 612], [1000, 700], [1350, 792], [1700, 872], [1940, 922]]);
  const mrp = ramp([[0, '#2a6a47'], [0.3, '#3f8f48'], [0.55, '#6cb44a'], [0.78, '#a2d355'], [1, '#d6ea78']]);
  const shadowAt = (x, y) => sstep(0.5, 0.6, n2((x + y * 1.7) / 620 + 0.4, y / 250, 9));
  const meadow = (x, y) => { const top = fg(x), t = clamp((y - top) / (H - top)); let L = 0.74 + 0.3 * (n2(x / 240, y / 120, 5) - 0.5) - 0.3 * t; const sl = (fg(x + 20) - fg(x - 20)) / 40; L += clamp(-sl * 0.5, -0.1, 0.14) * (1 - t);
    let c = mrp(clamp(L)); const sh = shadowAt(x, y); if (sh > 0) c = mix(c, [34, 100, 84], sh * 0.6); return c; };
  wash(ctx, { box: [-20, 540, W + 20, H + 20], size: 26, color: (x, y) => y < fg(x) ? null : meadow(x, y), dir: (x) => Math.atan2(fg(x + 10) - fg(x - 10), 20), len: 2.4, seed: 101, vary: 7, density: 1.3 });

  // 小路
  const pathPoly = thick([[604, 612], [700, 650], [860, 706], [1010, 790], [1090, 900], [1010, 1000], [900, 1100]], [5, 8, 13, 24, 44, 66, 84], 12), P2 = new Path2D(); pathPoly.forEach((p, i) => i ? P2.lineTo(p[0], p[1]) : P2.moveTo(p[0], p[1])); P2.closePath();
  ctx.save(); ctx.clip(P2); wash(ctx, { box: [560, 600, 1200, H + 20], size: 14, color: (x, y) => { const t = clamp((y - 600) / 480); let c = mix(hex('#e9d6a4'), hex('#d2b983'), n2(x / 40, y / 22, 3)); c = mix(c, hex('#f4e8c0'), 0.3 * (1 - t)); return mix(c, [150, 140, 120], shadowAt(x, y) * 0.45); }, dir: (x, y) => 0.5, len: 2.6, seed: 105, vary: 7, density: 1.5 }); ctx.restore();

  // ---- 大树的影子 ----
  wash(ctx, { box: [250, 570, 700, 700], size: 16, color: (x, y) => { const d = ((x - 450) / 190) ** 2 + ((y - (fg(x) + 40)) / 20) ** 2; return d < 1 && y > fg(x) + 2 ? mix(meadow(x, y), [28, 86, 70], 0.5 * (1 - d * d)) : null; }, dir: () => 0.1, len: 2.6, seed: 107, vary: 5, density: 1.5 });

  // ---- 房子 ----
  (() => { const X = 540, Y = 616;
    block(ctx, [[X, Y - 62], [X + 132, Y - 62], [X + 132, Y], [X, Y]], '#f7f0de', { size: 9, seed: 111, dir: 1.57, vary: 5 });            // 亮面
    block(ctx, [[X + 132, Y - 62], [X + 190, Y - 70], [X + 190, Y - 12], [X + 132, Y]], '#aab6d2', { size: 9, seed: 112, dir: 1.57, vary: 5 }); // 暗面
    block(ctx, [[X + 132, Y - 62], [X + 161, Y - 112], [X + 190, Y - 70]], '#b9c3db', { size: 8, seed: 113, dir: 1.57 });
    block(ctx, [[X - 10, Y - 58], [X + 138, Y - 58], [X + 165, Y - 114], [X + 20, Y - 114]], '#cf5a3f', { size: 8, seed: 114, dir: -1.1, vary: 12 });        // 屋顶
    fill(ctx, [[X + 138, Y - 58], [X + 165, Y - 114], [X + 161, Y - 114], [X + 132, Y - 62]], '#8c3a33'); fill(ctx, [[X + 161, Y - 112], [X + 165, Y - 114], [X + 196, Y - 68], [X + 190, Y - 70]], '#8c3a33');
    fill(ctx, [[X, Y - 62], [X + 132, Y - 62], [X + 132, Y - 54], [X, Y - 54]], '#c5cbe0');                                             // 檐下的影子
    block(ctx, [[X + 62, Y - 132], [X + 80, Y - 132], [X + 80, Y - 100], [X + 62, Y - 100]], '#e9dcc4', { size: 6, seed: 115 }); fill(ctx, [[X + 80, Y - 132], [X + 88, Y - 134], [X + 88, Y - 104], [X + 80, Y - 100]], '#a59c9a'); fill(ctx, [[X + 58, Y - 138], [X + 90, Y - 140], [X + 90, Y - 132], [X + 58, Y - 130]], '#b44d3a');
    [[16, 22], [92, 22]].forEach(([dx, w]) => { fill(ctx, [[X + dx - 2, Y - 46], [X + dx + w + 2, Y - 46], [X + dx + w + 2, Y - 16], [X + dx - 2, Y - 16]], '#fffaf0'); fill(ctx, [[X + dx, Y - 44], [X + dx + w, Y - 44], [X + dx + w, Y - 18], [X + dx, Y - 18]], '#3e5f93'); fill(ctx, [[X + dx, Y - 44], [X + dx + w, Y - 44], [X + dx + w * 0.3, Y - 18], [X + dx, Y - 18]], '#6f97c8'); ctx.fillStyle = '#fffaf0'; ctx.fillRect(X + dx + w / 2 - 1, Y - 44, 2, 26); });
    fill(ctx, [[X + 56, Y - 42], [X + 76, Y - 42], [X + 76, Y], [X + 56, Y]], '#3f7f86'); fill(ctx, [[X + 150, Y - 46], [X + 170, Y - 49], [X + 170, Y - 24], [X + 150, Y - 20]], '#2f4a78');
    // 房子的影子
    wash(ctx, { box: [X + 120, Y - 14, X + 330, Y + 30], size: 12, color: (x, y) => (y > fg(x) + 2 && y < Y + 22 - (x - X - 190) * 0.02 && x > X + 130 + (Y + 20 - y) * 1.2 && x < X + 300 - (y - Y) * 2) ? mix(meadow(x, y), [28, 86, 70], 0.7) : null, dir: () => 0.1, len: 2.4, seed: 117, density: 1.6 }); })();

  // ---- 大树 ----
  const treeRamp = ramp([[0, '#123a34'], [0.28, '#1d5139'], [0.46, '#2f7440'], [0.6, '#539a45'], [0.76, '#86c24f'], [1, '#d0e67c']]);
  block(ctx, thick([[322, 626], [312, 540], [300, 470], [292, 400]], [34, 24, 19, 15]), '#4a3428', { size: 8, seed: 121, dir: 1.5, vary: 8 });
  block(ctx, thick([[302, 618], [298, 540], [288, 470]], [12, 9, 7]), '#7a5a40', { size: 6, seed: 122, dir: 1.5, vary: 8 });
  [[[300, 470], [240, 420], [200, 390]], [[296, 450], [350, 400], [400, 380]]].forEach((b, i) => block(ctx, thick(b, [10, 7, 4]), '#3f2c24', { size: 5, seed: 123 + i }));
  const treeSeeds = [[300, 350, 132], [168, 392, 100], [440, 380, 108], [296, 246, 100], [112, 340, 72], [506, 310, 80], [214, 262, 80], [404, 256, 80], [60, 402, 54], [560, 388, 58], [300, 170, 62]];
  // 先铺一层暗的（树冠里面），再画一团团受光的叶簇
  paintLobes(ctx, treeSeeds.map(([x, y, R]) => ({ x, y: y + 14, R: R * 0.96, lv: 0 })), { ramp: ramp([[0, '#0f3330'], [0.6, '#1a4a37'], [1, '#27633d']]), top: 90, base: 520, seed: 6, size: l => clamp(l.R * 0.16, 7, 15), dabs: 'random', len: 1.7, vary: 8, sphere: 0.5, noise: 0.1 });
  const treeL = lobes(treeSeeds.map(([x, y, R]) => [x, y, R * 0.8]), { levels: 2, kids: 5, ratio: [0.4, 0.58], seed: 7, a0: -Math.PI * 1.2, a1: Math.PI * 0.2, out: 0.8 }).filter(l => l.lv > 0);
  paintLobes(ctx, treeL, { ramp: treeRamp, top: 60, base: 520, seed: 7, size: l => clamp(l.R * 0.17, 5, 12), dabs: 'random', len: 1.7, vary: 9, sphere: 0.86, noise: 0.1, order: 'level', L: [-0.55, -0.75, 0.35] });
  // 最亮的叶尖：只在每团的左上沿
  treeL.filter(l => l.lv === 2).forEach(l => { for (let i = 0; i < 5; i++) { const a = -Math.PI * (0.55 + r() * 0.45), d = l.R * (0.55 + r() * 0.4); brush(ctx, l.x + Math.cos(a) * d, l.y + Math.sin(a) * d, r() * 3.14, 8 + r() * 6, 5, hex(r() < 0.5 ? '#e2f08e' : '#bfe068'), r, { bristles: 2, vary: 8 }); } });

  // ---- 电线杆 ----
  const poles = [[880, 150], [1230, 200], [1630, 262]].map(([x, h]) => [x, fg(x) + 14, h]);
  ctx.lineCap = 'round'; poles.forEach(([x, y, h], i) => { const w = 4 + i * 2.2; ctx.strokeStyle = '#4a3e3c'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 3, y - h); ctx.stroke(); ctx.strokeStyle = '#8f7f6c'; ctx.lineWidth = w * 0.35; ctx.beginPath(); ctx.moveTo(x - w * 0.25, y); ctx.lineTo(x + 3 - w * 0.25, y - h); ctx.stroke();
    ctx.strokeStyle = '#4a3e3c'; ctx.lineWidth = w * 0.7; [[0.9, 0.2], [0.8, 0.15]].forEach(([k, s]) => { ctx.beginPath(); ctx.moveTo(x - h * s, y - h * k + 2); ctx.lineTo(x + 6 + h * s, y - h * k - 3); ctx.stroke(); }); });
  ctx.strokeStyle = 'rgba(52,44,50,0.85)'; [[0.9, -0.2], [0.9, 0.2], [0.8, -0.15], [0.8, 0.15]].forEach(([k, s]) => { const pts = [[640, 566 - (k - 0.8) * 100]].concat(poles.map(([x, y, h]) => [x + 3 + h * s, y - h * k]), [[2100, 620 - (k - 0.8) * 500]]); for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; ctx.lineWidth = 1 + i * 0.5; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 26 + i * 14, b[0], b[1]); ctx.stroke(); } });

  // ================= 草 =================
  const top0 = 566;
  grass(ctx, { box: [-20, 566, W + 20, H + 30], count: 130000, seed: 131, wind: 0.42, at: (x, y) => { const tp = fg(x); if (y < tp + 1) return null; const t = clamp((y - tp) / (H - tp)); if (ctx.isPointInPath(P2, x, y) && r() < 0.93) return null; return { c: meadow(x, y), len: 4 + 50 * Math.pow(t, 1.4) }; } });
  // 野花：远处是点，近处有花瓣
  for (let i = 0; i < 2600; i++) { const x = r() * W, tp = fg(x), y = tp + 6 + Math.pow(r(), 0.8) * (H - tp); if (n2(x / 150, y / 70, 21) < 0.52 || ctx.isPointInPath(P2, x, y)) continue; const t = clamp((y - tp) / (H - tp)), s = 1.2 + 7 * Math.pow(t, 1.5), col = [[255, 255, 250], [255, 232, 110], [250, 250, 245], [246, 170, 190]][(r() * 4) | 0], sh = shadowAt(x, y);
    ctx.fillStyle = css(mix(col, [120, 150, 190], sh * 0.45)); if (s < 3.2) { ctx.beginPath(); ctx.arc(x, y - s * 3, s, 0, TAU); ctx.fill(); } else { for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + r(); ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * s * 0.8, y - s * 3 + Math.sin(a) * s * 0.6, s * 0.62, s * 0.4, a, 0, TAU); ctx.fill(); } ctx.fillStyle = '#f2b632'; ctx.beginPath(); ctx.arc(x, y - s * 3, s * 0.42, 0, TAU); ctx.fill(); } }

  // ================= 人和猫（很小，只有背影）=================
  (() => { const X = 968, Y = 790, k = 1.0; ctx.lineCap = 'round';
    ctx.fillStyle = 'rgba(40,90,80,0.55)'; ctx.beginPath(); ctx.ellipse(X + 34, Y + 2, 40, 7, 0.08, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#e9b993'; ctx.lineWidth = 6; [[-6, 0], [6, 2]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.moveTo(X + dx, Y - 40); ctx.lineTo(X + dx, Y + dy); ctx.stroke(); });
    fill(ctx, [[X - 15, Y - 98], [X + 14, Y - 98], [X + 34, Y - 40], [X + 44, Y - 34], [X - 20, Y - 36]], '#fbf8f0'); fill(ctx, [[X + 4, Y - 98], [X + 14, Y - 98], [X + 34, Y - 40], [X + 44, Y - 34], [X + 14, Y - 36]], '#b7c5e2');
    ctx.strokeStyle = '#e9b993'; ctx.lineWidth = 5.5; ctx.beginPath(); ctx.moveTo(X - 13, Y - 92); ctx.lineTo(X - 22, Y - 60); ctx.stroke(); ctx.beginPath(); ctx.moveTo(X + 12, Y - 92); ctx.lineTo(X + 24, Y - 112); ctx.lineTo(X + 12, Y - 124); ctx.stroke();
    ctx.fillStyle = '#e9b993'; ctx.beginPath(); ctx.arc(X, Y - 110, 11, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#3b2a25'; ctx.lineWidth = 4; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(X - 8 + i * 2, Y - 114); ctx.quadraticCurveTo(X + 8 + i * 2, Y - 100 + i, X + 20 + i * 3.4, Y - 96 + i * 2.6 - (i % 3) * 5); ctx.stroke(); }
    ctx.fillStyle = '#e7c46e'; ctx.beginPath(); ctx.ellipse(X + 1, Y - 119, 26, 8, -0.1, 0, TAU); ctx.fill(); ctx.fillStyle = '#f3d98e'; ctx.beginPath(); ctx.ellipse(X, Y - 125, 13, 9, -0.1, 0, TAU); ctx.fill(); ctx.strokeStyle = '#c8473c'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(X - 13, Y - 121); ctx.quadraticCurveTo(X, Y - 117, X + 13, Y - 123); ctx.stroke(); ctx.beginPath(); ctx.moveTo(X + 12, Y - 122); ctx.quadraticCurveTo(X + 26, Y - 118, X + 36, Y - 108); ctx.stroke();
    // 猫
    const cx = X - 46, cy = Y + 4; ctx.fillStyle = '#e08f3e'; ctx.beginPath(); ctx.ellipse(cx, cy - 12, 10, 13, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(cx + 1, cy - 30, 8.5, 0, TAU); ctx.fill(); fill(ctx, [[cx - 7, cy - 34], [cx - 5, cy - 44], [cx, cy - 36]], '#e08f3e'); fill(ctx, [[cx + 2, cy - 36], [cx + 8, cy - 44], [cx + 9, cy - 33]], '#e08f3e');
    ctx.strokeStyle = '#e08f3e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx - 8, cy - 2); ctx.quadraticCurveTo(cx - 24, cy - 2, cx - 20, cy - 20); ctx.stroke(); ctx.fillStyle = '#f6c98a'; ctx.beginPath(); ctx.ellipse(cx - 3, cy - 14, 4, 8, 0, 0, TAU); ctx.fill(); })();

  // ================= 最前面：两个角上压暗的高草，几朵大一点的花 =================
  [[90, 1010, 12], [190, 1040, 10], [1790, 1016, 13], [1870, 1050, 10], [1700, 1056, 9]].forEach(([x, y, s]) => { ctx.strokeStyle = '#2c7044'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 6, H + 10); ctx.quadraticCurveTo(x - 10, y + 50, x, y); ctx.stroke(); ctx.fillStyle = '#fffdf6'; for (let k = 0; k < 9; k++) { const a = k / 9 * TAU; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * s, y + Math.sin(a) * s * 0.8, s * 0.62, s * 0.3, a, 0, TAU); ctx.fill(); } ctx.fillStyle = '#f0b22e'; ctx.beginPath(); ctx.ellipse(x, y, s * 0.42, s * 0.36, 0, 0, TAU); ctx.fill(); });
  grass(ctx, { box: [-20, 1060, W + 20, H + 70], count: 5200, seed: 141, wind: 0.36, at: (x, y) => { const e = Math.abs(x - W / 2) / (W / 2); if (r() > Math.pow(e, 2.2) + 0.04) return null; return { c: mix([52, 128, 62], [26, 88, 60], r()), len: 50 + 150 * e * e + r() * 40, thick: 0.035, maxW: 6 }; } });
  grain(ctx, { amount: 0.05, fiber: 0.05, blend: 'soft-light' });
};
