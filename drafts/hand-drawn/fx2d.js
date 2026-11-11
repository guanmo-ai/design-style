// 手绘特效（2D FX）的形状：火、烟、水花、电、冲击。每种都按“起 → 胀 → 爆 → 断 → 散”五张关键帧来画，
// k = 0..4 是第几张。全是平涂色块：两三层颜色，没有渐变；边缘有一点手抖。
const FX2D = (() => {
  const { thick, ellipse, fill, paths, path, wob, rng, layer, cr, lerp, TAU, xf } = HD;
  const PAL = { fire: ['#ff4b2b', '#ff9a1f', '#ffe14a', '#fff8dc'], smoke: ['#b9b3d9', '#7f78a8', '#ece8fa'], water: ['#4fc3f7', '#1c6fd1', '#effcff'], bolt: ['#7b5cff', '#4be0ff', '#ffffff'] };
  const W = (pl, seed, amp = 1.6) => wob(pl, amp, 34, seed, true);
  // 一条火舌 / 水柱：中线是 S 形，根粗尖细；float = 1 时是脱开的一滴（两头都收）
  function tongue([bx, by, w, h, lean, bend, ph, float = 0, bead = 0], k = 1, hk = 1) { const n = 9, sp = [], rad = [];
    for (let i = 0; i <= n; i++) { const u = i / n; sp.push([bx + lean * u * u * hk + bend * Math.sin(u * Math.PI * 1.5 + ph) * u * hk, by - h * u * hk]);
      let r = w * k * Math.pow(1 - u, 0.8) * (1 + 0.2 * Math.sin(u * 5 + ph * 2)); if (float) r = w * k * Math.sin(Math.PI * Math.pow(u, 0.6)) * 0.9; if (bead && u > 0.8) r = Math.max(r, bead * k * Math.sin((u - 0.8) / 0.2 * Math.PI * 0.75 + 0.5)); rad.push(Math.max(0.8, r)); }
    return thick(sp, rad, 4); }

  // ---------------- 火 ----------------
  const FIRE = [
    { base: [0, -8, 46, 22], t: [[0, 0, 26, 70, 6, 6, 0], [-22, 0, 16, 40, -16, 4, 1], [22, 0, 16, 46, 16, -4, 2]] },
    { base: [0, -14, 118, 50], t: [[0, 0, 70, 150, 10, 14, 0], [-64, 0, 54, 110, -34, 12, 1.2], [62, 0, 54, 120, 36, -12, 2], [-118, 0, 34, 66, -40, 8, 0.5], [116, 0, 34, 70, 40, -8, 2.6]] },
    { base: [0, -12, 124, 46], t: [[0, 0, 64, 262, 24, 34, 0], [-60, 0, 48, 176, -54, 24, 1.2], [58, 0, 50, 196, 58, -26, 2], [-108, 0, 30, 104, -62, 14, 0.5], [104, 0, 30, 112, 64, -12, 2.6], [-34, -262, 15, 54, -22, 8, 0, 1], [74, -226, 11, 38, 24, -6, 1, 1]] },
    { base: [0, -6, 70, 22], t: [[6, -46, 46, 210, 30, 34, 0.4, 1], [-58, -30, 34, 130, -60, 22, 1.5, 1], [66, -40, 34, 150, 62, -24, 2.3, 1], [0, 0, 40, 60, -6, 6, 1], [-70, -196, 13, 46, -26, 8, 0, 1], [100, -220, 11, 40, 26, -6, 1, 1], [20, -290, 12, 44, 10, 6, 2, 1]], holes: [[-10, -60, 26, 18], [40, -110, 16, 22]] },
    { base: null, t: [[10, -130, 20, 90, 26, 16, 0.4, 1], [-62, -110, 14, 60, -40, 10, 1.5, 1], [70, -150, 13, 56, 40, -10, 2.3, 1], [-20, -250, 9, 36, -10, 6, 0, 1]], embers: [[-90, -220], [40, -290], [110, -250], [-40, -320], [0, -40], [-50, -30], [60, -60]] },
  ];
  function fire(ctx, x, y, s, k, { seed = 1, pal = PAL.fire, rot = 0, frame = null } = {}) { const f = frame || FIRE[k], T = { x, y, s, r: rot };
    const l = layer(c => { [1, 0.7, 0.44, 0.22].forEach((kk, li) => { const hk = 0.3 + 0.7 * kk + (li ? 0.06 : 0); c.fillStyle = pal[li]; const polys = f.t.filter(t => !(t[7] && li > 2)).map((t, i) => W(xf(tongue(t, kk, hk), T), seed + i + li * 10, 1.4 * s));
        if (f.base) polys.push(W(xf(ellipse(f.base[0], f.base[1] + (1 - kk) * 6, f.base[2] * (0.25 + 0.75 * kk), f.base[3] * kk), T), seed + 50 + li, 1.4 * s)); paths(c, polys); c.fill(); });
      if (f.holes) { c.globalCompositeOperation = 'destination-out'; f.holes.forEach(([hx, hy, rx, ry], i) => fill(c, W(xf(ellipse(hx, hy, rx, ry, 0.4), T), seed + 80 + i, 1.2), '#000')); c.globalCompositeOperation = 'source-over'; }
      (f.embers || []).forEach(([ex, ey], i) => fill(c, xf(ellipse(ex, ey, 5 + (i % 3) * 2, 5 + (i % 3) * 2, 0, 10), T), pal[1 + (i % 2)])); });
    ctx.drawImage(l, 0, 0); }

  // ---------------- 烟 ----------------
  // 一团烟 = 一串圆，每个圆自己带一道月牙形的暗面；断开时从里面被“吃”出洞
  const SMOKE = [
    { c: [[0, -30, 34], [-26, -14, 24], [26, -16, 26], [4, -58, 22]] },
    { c: [[0, -36, 52], [-52, -22, 40], [52, -26, 42], [-18, -92, 46], [34, -100, 40], [0, -148, 34], [-84, -4, 24], [86, -6, 26]] },
    { c: [[0, -40, 60], [-70, -30, 52], [72, -34, 54], [-128, -12, 34], [130, -14, 36], [-30, -120, 62], [50, -130, 58], [-96, -120, 40], [112, -118, 40], [6, -210, 56], [-56, -214, 40], [66, -220, 38], [10, -276, 34]] },
    { c: [[-80, -40, 44], [-126, -20, 28], [-40, -110, 50], [-100, -130, 34], [70, -50, 46], [122, -30, 28], [60, -140, 50], [116, -150, 32], [0, -236, 50], [-56, -250, 34], [58, -256, 34], [6, -306, 30]], holes: [[0, -70, 30, 44], [8, -168, 26, 30], [-74, -84, 16, 16], [96, -96, 16, 18], [-20, -240, 14, 16]] },
    { c: [[-110, -80, 30], [-60, -190, 34], [90, -110, 30], [70, -250, 32], [-10, -320, 26], [130, -30, 16], [-140, -20, 14]], holes: [[-102, -74, 22, 22], [-52, -182, 25, 26], [84, -102, 22, 23], [64, -242, 24, 24], [-6, -314, 19, 19]] },
  ];
  function smoke(ctx, x, y, s, k, { seed = 1, pal = PAL.smoke, rot = 0, flip = 1 } = {}) { const f = SMOKE[k], T = { x, y, s, r: rot, fx: flip }, cs = f.c.slice().sort((a, b) => a[1] - b[1]);
    const l = layer(c => { cs.forEach(([cx, cy, r], i) => { const o = W(xf(ellipse(cx, cy, r, r * 0.96, 0, 30), T), seed + i, 1.5 * s); c.save(); path(c, o); c.fillStyle = pal[1]; c.fill(); c.clip(); fill(c, xf(ellipse(cx - r * 0.2, cy - r * 0.26, r, r * 0.96, 0, 30), T), pal[0]); if (r > 30 && i % 2 === 0) fill(c, xf(ellipse(cx - r * 0.42, cy - r * 0.5, r * 0.3, r * 0.2, -0.6, 14), T), pal[2]); c.restore(); });
      if (f.holes) { c.globalCompositeOperation = 'destination-out'; f.holes.forEach(([hx, hy, rx, ry], i) => fill(c, W(xf(ellipse(hx, hy, rx, ry, 0.3), T), seed + 80 + i, 1.4), '#000')); } });
    ctx.drawImage(l, 0, 0); }

  // ---------------- 水花 ----------------
  const SPLASH = [
    { ring: [0, 0, 70, 16], t: [[0, 0, 30, 34, 0, 0, 0]] },
    { ring: [0, 0, 120, 26], t: [[-70, 0, 26, 90, -34, 6, 0, 0, 13], [-28, 0, 26, 120, -12, 4, 1, 0, 14], [24, 0, 26, 126, 12, -4, 2, 0, 14], [68, 0, 26, 96, 36, -6, 0.5, 0, 13], [0, 0, 80, 60, 0, 0, 0]] },
    { ring: [0, 0, 150, 30], t: [[-96, 0, 24, 150, -70, 10, 0, 0, 15], [-44, 0, 24, 210, -30, 8, 1, 0, 16], [0, 0, 20, 300, 4, 10, 0.3, 0, 18], [44, 0, 24, 220, 32, -8, 2, 0, 16], [94, 0, 24, 160, 72, -10, 0.5, 0, 15], [0, 0, 104, 70, 0, 0, 0]], drops: [[-200, -180, 12], [-96, -280, 14], [6, -350, 13], [104, -300, 14], [204, -200, 12], [-150, -250, 8], [156, -264, 8], [60, -380, 7]] },
    { ring: [0, 0, 190, 36], t: [[-110, 0, 22, 70, -60, 6, 0, 0, 0], [0, 0, 18, 150, 0, 8, 0.3, 0, 14], [108, 0, 22, 76, 60, -6, 0.5, 0, 0], [0, 0, 100, 34, 0, 0, 0]], drops: [[-250, -130, 13], [-130, -230, 14], [-40, -300, 11], [50, -330, 13], [140, -240, 14], [256, -140, 13], [-190, -60, 9], [196, -70, 9], [0, -210, 10], [-80, -150, 8], [90, -160, 8]], long: 1 },
    { ring: [0, 0, 230, 40], ring2: [0, 0, 130, 22], t: [], drops: [[-270, -30, 10], [-150, -60, 8], [150, -70, 8], [274, -34, 10], [0, -40, 12], [-60, -14, 7], [70, -18, 7]], long: 1 },
  ];
  function splash(ctx, x, y, s, k, { seed = 1, pal = PAL.water } = {}) { const f = SPLASH[k], T = { x, y, s };
    const l = layer(c => { const ring = (rg, w) => { const [rx0, ry0, rx, ry] = rg; c.strokeStyle = pal[0]; c.lineWidth = w * s; path(c, W(xf(ellipse(rx0, ry0, rx, ry, 0, 50), T), seed + 3, 1.2)); c.stroke(); };
      ring(f.ring, 12); if (f.ring2) ring(f.ring2, 8);
      c.save(); c.beginPath(); c.rect(0, 0, 1920, y + 5 * s); c.clip();
      [[1, pal[0]], [0.52, pal[2]]].forEach(([kk, col], li) => { const polys = f.t.map((t, i) => W(xf(tongue(li ? [t[0] - t[2] * 0.14, t[1], t[2], t[3] * 0.94, t[4], t[5], t[6], t[7], t[8]] : t, kk, 1), T), seed + i + li * 9, 1.3 * s)); if (polys.length) { paths(c, polys); c.fillStyle = col; c.fill(); } });
      // 暗面：每根水柱的右边一条
      c.restore(); c.save(); c.beginPath(); c.rect(0, 0, 1920, y + 5 * s); c.clip(); c.globalCompositeOperation = 'source-atop'; f.t.filter(t => t[2] < 60).forEach((t, i) => fill(c, xf(tongue([t[0] + t[2] * 0.62, t[1], t[2] * 0.5, t[3] * 0.9, t[4], t[5], t[6], t[7], (t[8] || 0) * 0.5], 0.7, 1), T), pal[1])); c.restore();
      (f.drops || []).forEach(([dx, dy, r], i) => { const a = Math.atan2(dy + 120, dx) + Math.PI / 2, o = f.long ? xf(xf(tongue([0, r, r, r * 3.4, 0, 0, 0, 1], 1, 1), { r: a + (f.long ? Math.PI : 0) }), { x: dx, y: dy }) : ellipse(dx, dy, r, r * 1.1, 0, 16);
        fill(c, W(xf(o, T), seed + 40 + i, 0.8), pal[0]); fill(c, xf(ellipse(dx - r * 0.25, dy - r * 0.25 + (f.long ? r * 1.2 : 0), r * 0.32, r * 0.28, 0, 10), T), pal[2]); }); });
    ctx.drawImage(l, 0, 0); }

  // ---------------- 电 ----------------
  function jag(a, b, n, amp, r) { let p = [a, b]; for (let k = 0; k < n; k++) { const q = [p[0]]; for (let i = 1; i < p.length; i++) { const u = p[i - 1], v = p[i], dx = v[0] - u[0], dy = v[1] - u[1], l = Math.hypot(dx, dy) || 1, o = (r() - 0.5) * amp; q.push([(u[0] + v[0]) / 2 - dy / l * o, (u[1] + v[1]) / 2 + dx / l * o], v); } p = q; amp *= 0.55; } return p; }
  function ribbon(c, p, w, col, taper = 1) { const n = p.length, L = [], R = []; for (let i = 0; i < n; i++) { const a = p[Math.max(0, i - 1)], b = p[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, t = i / (n - 1), r = w * 0.5 * (1 - taper * t * 0.85) * (0.7 + 0.6 * ((i * 7) % 3) / 2); L.push([p[i][0] - dy / l * r, p[i][1] + dx / l * r]); R.push([p[i][0] + dy / l * r, p[i][1] - dx / l * r]); } fill(c, L.concat(R.reverse()), col); }
  // 一道电：a → b；k = 0 先导（细，只到一半）/ 1 击中（最粗，带分叉和两头的光团）/ 2 残留（细、换一条路）/ 3 断成几截 / 4 只剩火星
  function bolt(ctx, a, b, k, { seed = 1, pal = PAL.bolt, w = 26, branches = 3 } = {}) { const r = rng(seed + [0, 31, 77, 77, 77][k]), d = Math.hypot(b[0] - a[0], b[1] - a[1]), main = jag(a, b, 4, d * 0.34, r), ws = [0.3, 0.5, 1, 0.36, 0][k] * w;
    const br = []; for (let i = 0; i < branches; i++) { const j = 2 + ((r() * (main.length - 5)) | 0), p = main[j], ang = Math.atan2(b[1] - a[1], b[0] - a[0]) + (r() - 0.5) * 2.2, len = d * (0.18 + r() * 0.26); br.push(jag(p, [p[0] + Math.cos(ang) * len, p[1] + Math.sin(ang) * len], 3, len * 0.4, r)); }
    const l = layer(c => { const draw = (wk, col) => { if (k === 0) ribbon(c, main.slice(0, (main.length * 0.5) | 0), ws * wk, col); else if (k === 1 || k === 2) { ribbon(c, main, ws * wk, col, 0.5); br.slice(0, k === 2 ? 9 : 1).forEach(q => ribbon(c, q, ws * wk * 0.5, col)); } else if (k === 3) { for (let i = 1; i < main.length - 3; i += 5) ribbon(c, main.slice(i, i + 3), ws * wk, col, 0.9); } };
      if (k === 2) [a, b].forEach((p, i) => { const st = []; for (let j = 0; j < 16; j++) { const an = j / 16 * TAU, R = (j % 2 ? 0.5 : 1.2 + r() * 0.9) * w * (i ? 1.9 : 1.1); st.push([p[0] + Math.cos(an) * R, p[1] + Math.sin(an) * R]); } fill(c, st, pal[0]); fill(c, st.map(q => [lerp(p[0], q[0], 0.62), lerp(p[1], q[1], 0.62)]), pal[1]); fill(c, st.map(q => [lerp(p[0], q[0], 0.3), lerp(p[1], q[1], 0.3)]), pal[2]); });
      draw(2.3, pal[0]); draw(1.35, pal[1]); draw(0.5, pal[2]);
      if (k >= 3) for (let i = 0; i < (k === 3 ? 7 : 9); i++) { const p = main[(r() * main.length) | 0], o = [(r() - 0.5) * d * 0.3, (r() - 0.5) * d * 0.3], sz = 3 + r() * (k === 3 ? 6 : 4); fill(c, [[p[0] + o[0], p[1] + o[1] - sz * 2], [p[0] + o[0] + sz, p[1] + o[1]], [p[0] + o[0], p[1] + o[1] + sz * 2], [p[0] + o[0] - sz, p[1] + o[1]]], pal[i % 2 ? 1 : 2]); } });
    ctx.drawImage(l, 0, 0); }

  // ---------------- 冲击 ----------------
  // 锯齿星：n 个尖，长短不齐
  function star(x, y, R0, R1, n, seed, sx = 1, sy = 1) { const r = rng(seed), o = []; for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU + (r() - 0.5) * 0.1, R = i % 2 ? R0 * (0.8 + r() * 0.3) : R1 * (0.5 + r() * 0.9); o.push([x + Math.cos(a) * R * sx, y + Math.sin(a) * R * sy]); } return o; }
  // 一圈冲击波：断开的几段弧，中间粗两头尖
  function ringArcs(ctx, x, y, rx, ry, w, col, seed, segs = [[0.03, 0.2], [0.27, 0.47], [0.53, 0.72], [0.78, 0.97]]) { const e = ellipse(x, y, rx, ry, 0, 120); segs.forEach(([a, b], i) => HD.ink(ctx, e.slice((a * 120) | 0, (b * 120) | 0), { w, color: col, seed: seed + i, t0: 0.35, t1: 0.35, amp: 1, min: 0.05 })); }
  return { PAL, tongue, fire, smoke, splash, bolt, jag, ribbon, star, ringArcs };
})();
