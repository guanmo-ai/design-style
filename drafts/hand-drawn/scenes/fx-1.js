// 手绘特效 A：落地。主角只有一个动作，周围全是手画的特效：身后的火、脚下的冲击星和冲击圈、两边滚开的灰、身上的电。
// 全部平涂，每种特效两三层颜色；形状有手抖，没有渐变、没有模糊。
SCENES['fx-1'] = ctx => {
  const { W, H, rng, fill, path, paths, ellipse, cr, ink, wob, grain, lerp, TAU, crayon, stroke } = HD, { fire, smoke, bolt, star, ringArcs, PAL, tongue } = FX2D;
  const C = { sky: ['#17143a', '#2f1b5e', '#7a2a72', '#e0527a', '#ff9a5c'], far: '#241a52', roof: '#120f26', roof2: '#1e1a3c', cream: '#fff3d6', ink: '#0f0d1a' };
  const r = rng(5);
  // ---- 天：五条平涂的色带，边是手抖的 ----
  ctx.fillStyle = C.sky[0]; ctx.fillRect(0, 0, W, H);
  [[300, 1], [520, 2], [690, 3], [800, 4]].forEach(([y, i]) => { const top = wob(cr([[-40, y + 30], [400, y - 20], [900, y + 26], [1400, y - 16], [1960, y + 20]], false, 12), 5, 160, i * 7); fill(ctx, top.concat([[1960, H], [-40, H]]), C.sky[i]); });
  // 太阳和远处的楼
  fill(ctx, wob(ellipse(1500, 800, 210, 210, 0, 60), 2, 80, 3, true), '#ffd27a'); fill(ctx, wob(ellipse(1500, 800, 150, 150, 0, 50), 2, 80, 4, true), '#fff3d6');
  let x = -30; while (x < W + 40) { const w = 60 + r() * 130, h = 90 + r() * 260; fill(ctx, wob([[x, 900], [x, 880 - h], [x + w, 880 - h + (r() - 0.5) * 12], [x + w, 900]], 2, 90, x | 0, true), C.far); if (r() < 0.7) for (let k = 0; k < 4; k++) { const wx = x + 10 + r() * (w - 26), wy = 880 - h + 16 + r() * (h - 50); fill(ctx, [[wx, wy], [wx + 10, wy], [wx + 10, wy + 14], [wx, wy + 14]], r() < 0.5 ? '#ff9a5c' : '#e0527a'); } x += w * (0.7 + r() * 0.5); }
  // ---- 屋顶 ----
  const GY = 892; fill(ctx, wob([[-40, GY], [W + 40, GY - 6], [W + 40, H + 40], [-40, H + 40]], 2, 200, 9, true), C.roof); fill(ctx, wob([[-40, GY], [W + 40, GY - 6], [W + 40, GY + 20], [-40, GY + 26]], 2, 200, 10, true), C.roof2);

  const G = [1150, GY - 2];          // 前爪落点
  const dir = -0.93;                  // 来的方向（左上）
  // ---- 身后的火：一条彗星尾巴 ----
  const TRAIL = { base: [0, -10, 150, 60], t: [[0, 0, 96, 900, 30, 70, 0], [-90, 0, 66, 600, -110, 46, 1.2], [92, 0, 70, 680, 120, -50, 2], [-150, 0, 40, 330, -120, 24, 0.5], [150, 0, 40, 360, 130, -22, 2.6],
    [-60, -640, 26, 150, -50, 16, 0, 1], [170, -700, 22, 130, 60, -14, 1, 1], [40, -930, 20, 120, 20, 12, 2, 1], [-170, -420, 16, 90, -60, 10, 0, 1], [250, -470, 14, 80, 60, -8, 1, 1]] };
  fire(ctx, 850, 590, 1, 0, { seed: 7, rot: dir, frame: TRAIL });
  // 速度线
  for (let i = 0; i < 26; i++) { const o = (r() - 0.5) * 520, st = 240 + r() * 760, L = 120 + r() * 380, c = Math.cos(dir - Math.PI / 2), s = Math.sin(dir - Math.PI / 2), a = [G[0] - 180 + c * st - s * o, G[1] - 260 + s * st + c * o]; ink(ctx, [[a[0] + c * L, a[1] + s * L], a], { w: 3 + r() * 7, t0: 0.02, t1: 0.9, amp: 0.4, seed: 100 + i, color: i % 3 ? C.cream : '#ffe14a', min: 0.04 }); }

  // ---- 冲击圈（贴在屋顶上）----
  ringArcs(ctx, G[0], GY + 60, 760, 92, 16, '#ff9a5c', 21, [[0.52, 0.66], [0.7, 0.8], [0.86, 0.98], [0.02, 0.12], [0.2, 0.3], [0.36, 0.47]]);
  ringArcs(ctx, G[0], GY + 46, 520, 62, 22, C.cream, 25);
  // ---- 冲击星：三层 ----
  fill(ctx, star(G[0], G[1], 190, 520, 22, 31, 1.25, 0.72), '#ff4b2b');
  fill(ctx, star(G[0], G[1], 150, 400, 20, 33, 1.25, 0.72), '#ff9a1f');
  fill(ctx, star(G[0], G[1], 110, 290, 18, 35, 1.25, 0.72), '#ffe14a');
  fill(ctx, star(G[0], G[1], 70, 170, 16, 37, 1.25, 0.72), '#fff8dc');
  // ---- 两边滚开的灰 ----
  const dust = ['#e9c7b4', '#b07f92', '#fff1e4'];
  smoke(ctx, 330, GY + 14, 0.62, 1, { seed: 41, pal: dust, flip: -1, rot: -0.15 }); smoke(ctx, 610, GY + 20, 0.9, 2, { seed: 43, pal: dust, rot: -0.5 });
  smoke(ctx, 1640, GY + 20, 0.95, 2, { seed: 45, pal: dust, rot: 0.55, flip: -1 }); smoke(ctx, 1850, GY + 14, 0.6, 1, { seed: 47, pal: dust, rot: 0.2 });
  // 飞起来的瓦片
  for (let i = 0; i < 20; i++) { const a = -Math.PI * (0.08 + r() * 0.84), d = 300 + r() * 520, cx = G[0] + Math.cos(a) * d * 1.3, cy = G[1] + Math.sin(a) * d * 0.72, sz = 10 + r() * 30, rot = r() * 6, n = 3 + (r() * 2 | 0), ch = []; for (let k = 0; k < n; k++) ch.push([cx + Math.cos(rot + k / n * TAU) * sz * (0.7 + r() * 0.5), cy + Math.sin(rot + k / n * TAU) * sz * (0.7 + r() * 0.5)]);
    if (cx < 980 && cy < 660) continue; fill(ctx, ch, C.roof); fill(ctx, ch.map((p, k) => k === 0 ? p : [lerp(ch[0][0], p[0], 0.5), lerp(ch[0][1], p[1], 0.5)]), '#4a3f7a'); }

  // ---- 猫：平涂两层，下面一道暖光 ----
  const T = { x: 1000, y: 742, s: 1.0, r: 0 }, cat = CAT.side('land', T, { furAmp: 12, back: [-0.7, -0.7] });
  FX.inkCat(ctx, cat, { a: '#4a3f8a', b: '#ffb347', da: [10, 16], db: [-5, -9], body: C.ink, farC: '#221c40', dots: false });
  // ---- 身上的电 ----
  bolt(ctx, [800, 360], [470, 520], 1, { seed: 9, w: 14 }); bolt(ctx, [980, 560], [1240, 300], 2, { seed: 3, w: 24, branches: 4 }); bolt(ctx, [1290, 770], [1600, 640], 1, { seed: 12, w: 16 }); bolt(ctx, [900, 600], [760, 800], 3, { seed: 15, w: 16 });
  // 火星
  for (let i = 0; i < 40; i++) { const a = -r() * Math.PI, d = 220 + r() * 620, px = G[0] + Math.cos(a) * d * 1.3, py = G[1] + Math.sin(a) * d * 0.8, sz = 3 + r() * 7; if (px > 680 && px < 1320 && py > 500 && py < 830) continue; fill(ctx, [[px, py - sz * 2], [px + sz, py], [px, py + sz * 2], [px - sz, py]], ['#ffe14a', '#fff8dc', '#ff9a1f'][i % 3]); }
  // 铅笔的帧号（特效表里的第 7 张）
  crayon(ctx, c => { c.fillStyle = '#fff3d6'; c.font = '700 44px Caveat'; c.fillText('FX-01  #7  落地 / 爆', 60, 1040); }, { press: 0.9, seed: 3 });
  grain(ctx, { amount: 0.09, fiber: 0.06 });
};
