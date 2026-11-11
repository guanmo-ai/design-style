// 水粉背景 B：黄昏。太阳刚落到海平面下面，云从下面被照成金色和粉色，暗面是紫的；
// 近处全是剪影，只有一盏站牌的灯是暖的。和 A 用的是同一套画法，只换了光的方向和颜色。
SCENES.dusk = ctx => {
  const { W, H, rng, n1, n2, lerp, clamp, sstep, path, fill, ellipse, cr, thick, grain, TAU } = HD;
  const { hex, mix, css, ramp, brush, wash, lobes, lobeClip, paintLobes, grass, block, profile } = PT;
  const r = rng(9), HZ = 790, SUN = [470, HZ + 30];

  // ================= 天 =================
  const sky = ramp([[0, '#15174a'], [0.22, '#23307a'], [0.45, '#3b63a4'], [0.6, '#6f86c2'], [0.71, '#bf95c2'], [0.8, '#f0a68e'], [0.92, '#ffc884'], [1, '#ffe2a0']]);
  const skyAt = (x, y) => { const d = Math.hypot((x - SUN[0]) / 1.6, y - SUN[1]); let c = sky(clamp(y / HZ + (n2(x / 420, y / 200, 1) - 0.5) * 0.06 + 0.1 * Math.exp(-d / 320))); return mix(c, [255, 226, 150], 0.5 * Math.exp(-d / 210)); };
  ctx.fillStyle = '#23307a'; ctx.fillRect(0, 0, W, H);
  wash(ctx, { box: [-60, -60, W + 60, HZ + 40], size: 76, color: skyAt, dir: () => 0.03, len: 3.2, seed: 1, vary: 4, bristles: 4 });
  wash(ctx, { box: [-60, -60, W + 60, HZ + 40], size: 34, color: skyAt, dir: () => -0.03, len: 3, seed: 2, vary: 3.5, density: 0.8 });
  for (let i = 0; i < 110; i++) { const x = r() * W, y = Math.pow(r(), 1.6) * 380, s = 0.8 + r() * 1.6; ctx.fillStyle = `rgba(255,248,226,${0.5 + r() * 0.5})`; ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill(); }

  // ================= 云：光从左下来 =================
  const cloudRamp = ramp([[0, '#34346f'], [0.28, '#4d4788'], [0.44, '#77579a'], [0.55, '#c96f8c'], [0.7, '#f59a78'], [0.86, '#ffc37c'], [1, '#ffe9a8']]);
  function cloud(seeds, { floor, top, levels = 2, kids = 5, seed = 1, far = 0, ratio = [0.3, 0.68], bias = null }) { const ls = lobes(seeds, { levels, kids, seed, floor, ratio }); ctx.save(); lobeClip(ctx, ls, { floor, seed });
    paintLobes(ctx, ls, { ramp: cloudRamp, top: floor, base: top, L: [-0.62, 0.52, 0.42], seed, size: l => Math.max(5, l.R * 0.28), sphere: 0.62, noise: 0.07, bias, post: (c, x, y) => { const h = clamp((floor - y) / (floor - top)); c = far ? mix(c, skyAt(x, y), far) : c; return mix(c, skyAt(x, y), sstep(0.22, 0, h) * 0.85); } }); ctx.restore(); }
  cloud([[1330, 560, 230], [1090, 620, 170], [1570, 610, 190], [1360, 380, 200], [1230, 270, 150], [1470, 260, 160], [1350, 150, 130], [900, 660, 110], [1760, 650, 130], [1610, 420, 130]], { floor: 706, top: 10, seed: 5, bias: (x, y) => 0.14 * clamp((1250 - x) / 420, -1, 1) });
  cloud([[250, 470, 110], [90, 500, 90], [420, 500, 80], [560, 520, 56]], { floor: 610, top: 330, seed: 13, levels: 1, far: 0.15, bias: () => 0.12 });
  // 贴着海平面的几条长云：上面暗，下沿被照亮
  [[60, 640, 700, 16], [520, 700, 620, 12], [1100, 742, 760, 10], [-40, 746, 420, 9]].forEach(([x, y, w, h], i) => { wash(ctx, { box: [x, y - h, x + w, y + h], size: 11, color: (px, py) => { const e = Math.sin(clamp((px - x) / w) * Math.PI); if (Math.abs(py - y) > h * e * (0.6 + 0.5 * n1(px / 60, i))) return null; return py < y ? hex('#5a4a8c') : mix(hex('#ff9d6e'), hex('#ffd58c'), clamp(1 - Math.abs(px - SUN[0]) / 900)); }, dir: () => 0, len: 5, seed: 30 + i, vary: 6, density: 1.6, jit: 0.05 }); });

  // ================= 海、对岸 =================
  const sea = ramp([[0, '#ffd898'], [0.2, '#f0a987'], [0.55, '#6a7fae'], [1, '#2c3f78']]);
  wash(ctx, { box: [-20, HZ, W + 20, HZ + 110], size: 11, color: (x, y) => y < HZ ? null : mix(sea(clamp((y - HZ) / 90 + Math.abs(x - SUN[0]) / 2400 + (n2(x / 140, y / 8, 3) - 0.5) * 0.25)), [255, 232, 160], 0.5 * Math.exp(-Math.abs(x - SUN[0]) / 130)), dir: () => 0, len: 5, seed: 40, vary: 5, density: 1.7, jit: 0.04 });
  for (let i = 0; i < 160; i++) { const x = SUN[0] + (r() - 0.5) * (120 + r() * 700), y = HZ + 4 + r() * 80; brush(ctx, x, y, 0, 8 + r() * 30, 2.2, [255, 240, 190], r, { bristles: 1, alpha: 0.8, curve: 0 }); }
  const far = x => HZ + 4 - 40 * (0.6 * n1(x / 260, 4) + 0.3 * n1(x / 90, 7) + 0.55) * sstep(700, 1100, x);
  (() => { const top = []; for (let x = 680; x <= W + 20; x += 8) top.push([x, far(x)]); ctx.save(); path(ctx, top.concat([[W + 20, HZ + 60], [680, HZ + 60]])); ctx.clip(); wash(ctx, { box: [680, HZ - 70, W + 20, HZ + 60], size: 13, color: (x, y) => mix(hex('#4a4f8c'), hex('#2f356c'), clamp((y - far(x)) / 50)), dir: () => 0, len: 2.6, seed: 45, vary: 4, density: 1.5 }); ctx.restore(); })();
  // 对岸的灯
  for (let i = 0; i < 150; i++) { const x = 1000 + r() * 920, y = HZ + 6 - r() * 26 * sstep(900, 1300, x) + r() * 14; if (y < far(x) + 4) continue; ctx.fillStyle = css(r() < 0.8 ? [255, 214, 130] : [255, 250, 220], 0.6 + r() * 0.4); ctx.fillRect(x, y, 1.5 + r() * 2.5, 1.5 + r() * 2); }

  // ================= 近处的山坡（剪影）=================
  const fg = profile([[-20, 900], [300, 872], [700, 840], [1050, 836], [1400, 870], [1700, 850], [1940, 800]]);
  const LAMP = [760, 636];
  const lit = (x, y) => Math.exp(-(((x - LAMP[0]) / 300) ** 2 + ((y - 880) / 90) ** 2));
  const hillRamp = ramp([[0, '#0f1f33'], [0.5, '#17323d'], [1, '#234a45']]);
  const meadow = (x, y) => { const t = clamp((y - fg(x)) / 220); let c = hillRamp(clamp(0.75 - t * 0.7 + (n2(x / 200, y / 90, 5) - 0.5) * 0.5)); return mix(c, [214, 190, 92], lit(x, y) * 0.62); };
  wash(ctx, { box: [-20, 780, W + 20, H + 20], size: 24, color: (x, y) => y < fg(x) ? null : meadow(x, y), dir: (x) => Math.atan2(fg(x + 10) - fg(x - 10), 20), len: 2.4, seed: 51, vary: 5, density: 1.4 });

  // 右边压进来的一棵树（暗，朝落日的那面有一点金边）
  const treeSeeds = [[1800, 420, 190], [1640, 540, 130], [1900, 600, 170], [1720, 300, 130], [1900, 250, 150], [1560, 640, 80]];
  block(ctx, thick([[1850, 900], [1836, 760], [1810, 640]], [44, 32, 24]), '#12172e', { size: 9, seed: 55, dir: 1.5, vary: 4 });
  paintLobes(ctx, lobes(treeSeeds, { levels: 2, kids: 6, ratio: [0.34, 0.56], seed: 17, a0: -Math.PI * 1.5, a1: Math.PI * 0.5, out: 0.8 }), { ramp: ramp([[0, '#0d1430'], [0.6, '#152142'], [0.88, '#22305a'], [0.965, '#5d4f66'], [1, '#e0a070']]), top: 760, base: 60, L: [-0.75, 0.5, 0.25], seed: 17, size: l => clamp(l.R * 0.16, 6, 14), dabs: 'random', len: 1.7, vary: 5, sphere: 0.9, noise: 0.06 });

  // 电线杆，一路排到海边
  const poles = [[1180, 250], [1420, 170], [1580, 120]].map(([x, h]) => [x, fg(x) + 12, h]); ctx.lineCap = 'round';
  poles.forEach(([x, y, h], i) => { const w = 9 - i * 2.4; ctx.strokeStyle = '#141a33'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y - h); ctx.stroke(); ctx.lineWidth = w * 0.7; [[0.9, 0.2], [0.8, 0.15]].forEach(([k, s]) => { ctx.beginPath(); ctx.moveTo(x - h * s, y - h * k - 2); ctx.lineTo(x - 6 + h * s, y - h * k + 3); ctx.stroke(); });
    ctx.strokeStyle = '#f0a070'; ctx.lineWidth = Math.max(1, w * 0.22); ctx.beginPath(); ctx.moveTo(x - w * 0.36, y - 4); ctx.lineTo(x - 3 - w * 0.36, y - h); ctx.stroke(); });
  ctx.strokeStyle = 'rgba(20,26,51,0.9)'; [[0.9, -0.2], [0.9, 0.2], [0.8, -0.15], [0.8, 0.15]].forEach(([k, s]) => { const pts = [[-200, 250 + (0.9 - k) * 600 + s * 200]].concat(poles.map(([x, y, h]) => [x - 3 + h * s, y - h * k]), [[1700, 790]]); for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; ctx.lineWidth = Math.max(0.8, 2.6 - i * 0.6); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 60 - i * 16, b[0], b[1]); ctx.stroke(); } });

  // ================= 站牌、长椅、灯 =================
  (() => { const gy = fg(LAMP[0]) + 16, D = '#121830'; ctx.lineCap = 'round';
    // 光晕：一圈圈暖色的笔触
    [[110, 0.1], [64, 0.18], [34, 0.36]].forEach(([R, a], i) => wash(ctx, { box: [LAMP[0] - R, LAMP[1] - R, LAMP[0] + R, LAMP[1] + R], size: 18 + R * 0.08, color: (x, y) => Math.hypot(x - LAMP[0], y - LAMP[1]) < R * (0.85 + 0.3 * r()) ? [255, 214, 130] : null, dir: (x, y) => Math.atan2(y - LAMP[1], x - LAMP[0]) + 1.57, len: 2, seed: 60 + i, alpha: a, vary: 6 }));
    ctx.strokeStyle = D; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(LAMP[0] + 60, gy); ctx.lineTo(LAMP[0] + 58, LAMP[1] - 16); ctx.quadraticCurveTo(LAMP[0] + 56, LAMP[1] - 44, LAMP[0] + 10, LAMP[1] - 30); ctx.stroke();
    fill(ctx, [[LAMP[0] - 26, LAMP[1] - 20], [LAMP[0] + 30, LAMP[1] - 34], [LAMP[0] + 30, LAMP[1] - 22], [LAMP[0] - 22, LAMP[1] - 6]], D); ctx.fillStyle = '#fff3c4'; ctx.beginPath(); ctx.ellipse(LAMP[0], LAMP[1], 20, 11, -0.2, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(LAMP[0], LAMP[1], 10, 5, -0.2, 0, TAU); ctx.fill();
    // 站牌
    const sx = LAMP[0] - 150; ctx.strokeStyle = D; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(sx, gy + 4); ctx.lineTo(sx + 2, gy - 190); ctx.stroke(); ctx.fillStyle = D; ctx.beginPath(); ctx.arc(sx + 2, gy - 214, 34, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8b06a'; ctx.beginPath(); ctx.arc(sx + 2, gy - 214, 27, 0, TAU); ctx.fill(); ctx.fillStyle = '#c95a48'; ctx.fillRect(sx - 26, gy - 222, 56, 15); fill(ctx, [[sx - 22, gy - 170], [sx + 26, gy - 170], [sx + 26, gy - 110], [sx - 22, gy - 110]], D); fill(ctx, [[sx - 16, gy - 164], [sx + 20, gy - 164], [sx + 20, gy - 116], [sx - 16, gy - 116]], '#d9c9a0');
    // 长椅
    const bx = LAMP[0] - 80, by = gy - 4; ctx.strokeStyle = D; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(bx, by - 40); ctx.lineTo(bx + 170, by - 44); ctx.stroke(); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(bx, by - 78); ctx.lineTo(bx + 170, by - 82); ctx.moveTo(bx, by - 62); ctx.lineTo(bx + 170, by - 66); ctx.stroke(); [[10, 0], [160, -4]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.moveTo(bx + dx, by + dy + 4); ctx.lineTo(bx + dx, by + dy - 84); ctx.stroke(); });
    ctx.strokeStyle = '#f2c98a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(bx + 4, by - 44); ctx.lineTo(bx + 166, by - 48); ctx.moveTo(bx + 4, by - 82); ctx.lineTo(bx + 166, by - 86); ctx.stroke();
    // 坐着的人（背影）和猫
    const px = bx + 62, py = by - 44; fill(ctx, [[px - 24, py - 60], [px - 14, py - 70], [px + 14, py - 70], [px + 24, py - 60], [px + 27, py], [px - 26, py]], '#1b2140'); fill(ctx, [[px - 15, py - 86], [px + 15, py - 86], [px + 19, py - 46], [px + 6, py - 40], [px - 8, py - 42], [px - 19, py - 48]], '#141a33'); ctx.fillStyle = '#1b2140'; ctx.beginPath(); ctx.arc(px, py - 80, 15, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a2444'; ctx.beginPath(); ctx.ellipse(px, py - 92, 34, 9, -0.06, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(px, py - 99, 17, 11, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#ffd08a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(px, py - 93, 33, 8, -0.06, Math.PI * 1.02, Math.PI * 1.98); ctx.stroke(); ctx.beginPath(); ctx.moveTo(px + 19, py - 62); ctx.lineTo(px + 24, py - 6); ctx.stroke();
    const cx = bx + 124, cy = by - 48; ctx.fillStyle = '#1b2140'; ctx.beginPath(); ctx.ellipse(cx, cy - 14, 13, 16, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(cx, cy - 36, 11, 0, TAU); ctx.fill(); fill(ctx, [[cx - 10, cy - 40], [cx - 8, cy - 54], [cx - 1, cy - 44]], '#1b2140'); fill(ctx, [[cx + 1, cy - 44], [cx + 8, cy - 54], [cx + 10, cy - 40]], '#1b2140'); ctx.strokeStyle = '#1b2140'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx + 10, cy - 4); ctx.quadraticCurveTo(cx + 34, cy - 2, cx + 30, cy + 22); ctx.stroke();
    ctx.strokeStyle = '#ffd08a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, cy - 36, 10, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); })();

  // ================= 草：暗的，朝落日的尖上有一点金 =================
  grass(ctx, { box: [-20, 800, W + 20, H + 40], count: 120000, seed: 71, wind: -0.3, tip: 0.0, at: (x, y) => { const tp = fg(x); if (y < tp + 1) return null; const t = clamp((y - tp) / (H - tp)); return { c: meadow(x, y), len: 6 + 60 * Math.pow(t, 1.3) }; } });
  // 坡顶一排逆光的草尖
  ctx.lineCap = 'round'; for (let i = 0; i < 2600; i++) { const x = r() * W, y = fg(x) + 2 + r() * 10, L = 8 + r() * 20, k = clamp(1 - Math.abs(x - SUN[0]) / 1300); ctx.strokeStyle = css(mix([30, 60, 70], [255, 190, 110], 0.25 + 0.6 * k * r()), 0.9); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 2, y - L * 0.6, x - L * 0.3, y - L); ctx.stroke(); }
  // 小白花，只在灯光里看得清
  for (let i = 0; i < 900; i++) { const x = r() * W, y = fg(x) + 10 + Math.pow(r(), 0.8) * (H - fg(x)), l = lit(x, y), t = clamp((y - fg(x)) / 220), s = 1.4 + 3.4 * t; ctx.fillStyle = css(mix([70, 90, 130], [255, 244, 200], clamp(l * 1.5 + 0.08))); ctx.beginPath(); ctx.arc(x, y - s * 3, s, 0, TAU); ctx.fill(); }
  // 最前面两个角的高草
  grass(ctx, { box: [-20, 1060, W + 20, H + 70], count: 5200, seed: 81, wind: -0.3, tip: 0, at: (x, y) => { const e = Math.abs(x - W / 2) / (W / 2); if (r() > Math.pow(e, 2.2) + 0.04) return null; return { c: mix([14, 30, 48], [10, 22, 40], r()), len: 50 + 150 * e * e + r() * 40, thick: 0.035, maxW: 6 }; } });
  grain(ctx, { amount: 0.05, fiber: 0.05, blend: 'soft-light' });
};
