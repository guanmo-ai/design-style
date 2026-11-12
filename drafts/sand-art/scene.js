// 月夜海面：一整张沙画（原创构图）。drawScene(sand, {t}) —— 片子里 t 推进就是“正在画”。
function drawScene(S, o = {}) {
  const { fbm, smooth, rng } = SAND; const W = S.W, H = S.H; const R = rng(o.seed || 3);
  const HZ = o.hz || H * 0.6; const M = o.moon || [W * 0.615, H * 0.33, H * 0.14];
  // 天空：上厚下薄，手掌抹出来的弧形纹
  S.fill((x, y) => {
    const v = smooth(-0.1 * H, HZ, y); const arcs = 0.08 * Math.sin(Math.hypot(x - W * 0.4, y - H * 1.4) / 26 + fbm(x / 300, y / 300) * 6);
    const sky = 1.15 - 0.95 * Math.pow(v, 1.6) + arcs + (fbm(x / 140, y / 140) - 0.5) * 0.3;
    if (y < HZ) return sky;
    const sea = 1.05 - 0.55 * Math.exp(-(y - HZ) / (H * 0.05)) + (fbm(x / 90, y / 60) - 0.5) * 0.25; return sea;
  });
  // 月亮：一掌抹开光晕，再用指腹擦干净圆心
  const [mx, my, mr] = M;
  S.shape((x, y) => { const d = Math.hypot(x - mx, y - my); return d < mr * 2.4 ? 1 : 0; }, (x, y, h) => { const d = Math.hypot(x - mx, y - my); const halo = 0.12 + 0.88 * smooth(mr * 0.95, mr * 2.4, d); return Math.min(h, h * halo + 0.1 * (1 - halo)); });
  S.shape((x, y) => 1 - smooth(mr - 3, mr + 2, Math.hypot(x - mx, y - my)), (x, y) => 0.02 + 0.16 * Math.max(0, fbm(x / 38, y / 38) - 0.45) + 0.05 * smooth(mr * 0.6, mr, Math.hypot(x - mx + mr * 0.3, y - my + mr * 0.2)));
  // 远山：沙堆出来的剪影，山脊用指甲划一道亮线
  const ridge = (x) => HZ - (60 + 120 * Math.max(0, Math.sin(x / 210 + 0.6)) * Math.exp(-Math.pow((x - W * 0.17) / 420, 2)) + 90 * Math.exp(-Math.pow((x - W * 0.93) / 260, 2)) + 22 * fbm(x / 60, 1.7)) * (1 - 0.8 * smooth(W * 0.36, W * 0.47, x) * (1 - smooth(W * 0.74, W * 0.84, x)));
  S.shape((x, y) => smooth(ridge(x) - 1.5, ridge(x) + 1.5, y) * (y < HZ + 2 ? 1 : 0), () => 1.25);
  const rp = []; for (let x = 0; x <= W * 0.47; x += 14) rp.push([x, ridge(x) + 6]); S.finger(rp, { r: 2.2, ridge: 0.5, keep: 0.25 });
  const rp2 = []; for (let x = W * 0.76; x <= W; x += 14) rp2.push([x, ridge(x) + 6]); S.finger(rp2, { r: 2.2, ridge: 0.5, keep: 0.25 });
  // 地平线：一指拉过去
  S.finger([[0, HZ], [W * 0.5, HZ + 1], [W, HZ]], { r: 2.6, keep: 0.1, ridge: 0.6 });
  // 月光倒影：一条条横着的短擦，越近越宽、越碎
  for (let i = 0; i < 46; i++) {
    const u = i / 45; const y = HZ + 8 + Math.pow(u, 1.5) * (H - HZ - 10); const half = 18 + u * 170 * (0.5 + R());
    const x0 = mx - half * (0.4 + 0.6 * R()) + (R() - .5) * 40 * u, x1 = mx + half * (0.4 + 0.6 * R()) + (R() - .5) * 40 * u;
    if (R() < 0.12 + u * 0.2) continue;
    S.finger([[x0, y], [(x0 + x1) / 2, y + (R() - .5) * 3], [x1, y]], { r: 2 + u * 4.5, taper: true, keep: 0.05, ridge: 0.55 });
  }
  // 海浪：指甲划的细线，近处间距大、起伏大
  for (let k = 0; k < 22; k++) {
    const u = k / 21; const y0 = HZ + 14 + Math.pow(u, 1.7) * (H - HZ - 30); const A = 2 + u * 14; const f = 1 / (60 + u * 160);
    let x = -40 + R() * 100;
    while (x < W + 40) {
      const len = 80 + R() * (200 + u * 400); const pts = [];
      for (let xx = x; xx < x + len; xx += 12) pts.push([xx, y0 + A * Math.sin(xx * f + k * 1.7) + (R() - .5) * 2]);
      if (pts.length > 2 && Math.abs((x + len / 2) - mx) > 60 + u * 120) S.finger(pts, { r: 1.2 + u * 2.4, taper: true, keep: 0.15, ridge: 0.7 });
      x += len + 80 + R() * 260;
    }
  }
  // 船和人：倒在倒影里的一小撮沙
  const bx = o.boat ? o.boat[0] : mx - 120, by = o.boat ? o.boat[1] : HZ + 120;
  S.pour([[bx - 70, by - 6], [bx - 30, by + 10], [bx + 30, by + 10], [bx + 74, by - 8]], { r: 9, amt: 1.4 });
  S.pour([[bx - 60, by - 4], [bx + 64, by - 5]], { r: 6, amt: 1.4 });
  S.pour([[bx + 6, by - 8], [bx + 4, by - 46]], { r: 6, amt: 1.5 }); S.pour([[bx + 4, by - 56], [bx + 4, by - 54]], { r: 7.5, amt: 1.5 });
  S.pour([[bx + 4, by - 40], [bx + 34, by - 64], [bx + 70, by - 70]], { r: 2.2, amt: 1.3 }); // 竿
  S.pour([[bx - 46, by - 6], [bx - 52, by - 70]], { r: 2.5, amt: 1.3 }); // 桅
  S.pour([[bx - 50, by - 66], [bx - 10, by - 20], [bx - 50, by - 14]], { r: 3, amt: 1.1 });
  // 飞鸟：从月亮前面穿过——暗的剪影最显眼
  const birds = o.birds || [[mx - mr * 0.55, my - mr * 0.15, 1], [mx - mr * 0.1, my + mr * 0.25, 0.8], [mx + mr * 0.35, my - mr * 0.35, 0.9], [mx + mr * 0.8, my + mr * 0.05, 0.6], [mx + mr * 1.5, my - mr * 0.5, 0.55], [mx - mr * 1.3, my + mr * 0.6, 0.5]];
  for (const [x, y, s] of birds) { const w = 34 * s; S.pour([[x - w, y - w * 0.25], [x - w * 0.45, y - w * 0.42], [x, y + w * 0.05], [x + w * 0.45, y - w * 0.42], [x + w, y - w * 0.25]], { r: 3.4 * s + 1, amt: 1.5, taper: true }); }
  // 堆在角落还没用的沙（沙画师的“颜料盒”）——也正好托住文字
  if (o.piles) for (const [px, py, pr, pa] of o.piles) S.shape((x, y) => 1 - smooth(pr * 0.55, pr, Math.hypot((x - px) * 0.8, y - py) + (fbm(x / 40, y / 40) - 0.5) * pr * 0.35), (x, y, h) => Math.max(h, pa));
  // 近处卷起的一个浪头：正在画的这一笔（一指从左下拉起，卷进去）
  const t = o.t == null ? 0.84 : o.t; const cx = o.curl ? o.curl[0] : W * 0.24, cy = o.curl ? o.curl[1] : H * 0.82, sc = o.curlS || 1;
  const spiral = (R0, dy, turns) => { const p = [[cx - R0 - 220 * sc, cy + (120 + dy) * sc], [cx - R0 - 120 * sc, cy + (60 + dy * 0.6) * sc], [cx - R0 - 40 * sc, cy + 20 * sc]]; for (let a = 0.1; a < Math.PI * turns; a += 0.12) { const r = R0 * Math.exp(-a * 0.3); p.push([cx + Math.cos(Math.PI + a) * r, cy + Math.sin(Math.PI + a) * r]); } return p; };
  const curl = spiral(120 * sc, 0, 2.5);
  S.finger(spiral(170 * sc, 40, 1.4), { r: 3.5 * sc, keep: 0.05, ridge: 0.7, t: Math.min(1, t * 1.3), taper: true });
  S.finger(spiral(145 * sc, 20, 1.9), { r: 5.5 * sc, keep: 0.02, ridge: 0.75, t: Math.min(1, t * 1.15), taper: true });
  S.finger(curl, { r: 10 * sc, keep: 0.0, ridge: 0.85, t });
  const P = SAND.densify(curl, Math.max(1, 10 * sc * 0.35)); const tip = P[Math.max(0, Math.round(P.length * t) - 1)];
  return { tip, moon: M, hz: HZ };
}

// 手的影子：灯箱在下面，手在沙上 —— 观众看到的是一只暗的、边缘发虚的手
function handShadow(ctx, tip, ang = -0.75, s = 1) {
  ctx.save(); ctx.translate(tip[0], tip[1]); ctx.rotate(ang); ctx.scale(s, s);
  ctx.filter = 'blur(10px)'; ctx.fillStyle = 'rgba(14,7,3,.9)';
  const cap = (x, y, l, w) => { ctx.beginPath(); ctx.moveTo(x, y - w / 2); ctx.lineTo(x + l, y - w / 2); ctx.arc(x + l, y, w / 2, -Math.PI / 2, Math.PI / 2); ctx.lineTo(x, y + w / 2); ctx.arc(x, y, w / 2, Math.PI / 2, Math.PI * 1.5); ctx.fill(); };
  cap(8, 0, 300, 40);          // 食指
  cap(70, 46, 260, 44);        // 中指（弯着）
  cap(120, 88, 220, 42);       // 无名指
  cap(170, 124, 180, 38);      // 小指
  cap(210, -40, 160, 50);      // 拇指
  ctx.beginPath(); ctx.ellipse(380, 60, 200, 150, 0, 0, Math.PI * 2); ctx.fill(); // 手掌
  ctx.restore();
}
// 光晕：亮处往外溢一点（灯箱 + 镜头）
function bloom(ctx, W, H, amt = 0.45) {
  const c = document.createElement('canvas'); c.width = W / 6 | 0; c.height = H / 6 | 0; const g = c.getContext('2d');
  g.filter = 'blur(6px) brightness(1.1)'; g.drawImage(ctx.canvas, 0, 0, c.width, c.height);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = amt; ctx.drawImage(c, 0, 0, W, H); ctx.restore();
}
