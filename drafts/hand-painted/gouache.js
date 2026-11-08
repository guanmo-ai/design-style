// gouache.js — 吉卜力式背景的“形状画法”（Canvas 2D，无素材）
// 对着《龙猫》的剧照看出来的规律：
//   · 树 = 一团团硬边平涂色块：先铺最深的大团，再叠中间色的小团、亮色的更小团，边缘是一簇簇叶子的扇贝形
//   · 草 = 一根根设计过的细长叶片，平涂；暗的在底下，亮的在上面
//   · 云 = 边缘柔、里面几块清楚的蓝灰色块；底平，顶上一个个小鼓包
//   · 远处 = 空气透视，越远越蓝越浅；整张画只用二十几管颜料
(function (G) {
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const hex = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255), (n >> 8 & 255), (n & 255)]; };
  const toHex = c => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
  const jit = (c, R, amt) => { const A = hex(c); const k = 1 + (R() - .5) * amt; return toHex(A.map(v => v * k)); };

  // —— 扇贝形（叶簇 / 云边）：沿一圈取点，每两点之间往外鼓一个弧 ——
  function scallop(R, cx, cy, rx, ry, leaf, opt = {}) {
    const per = Math.PI * (rx + ry), n = Math.max(opt.min || 7, Math.round(per / leaf));
    const ph = R() * 6.28, ph2 = R() * 6.28, wob = opt.wob ?? .12;
    const P = [];
    for (let i = 0; i < n; i++) {
      const a = (i + (R() - .5) * .6) / n * Math.PI * 2;
      const w = 1 + wob * Math.sin(3 * a + ph) + wob * .6 * Math.sin(5 * a + ph2) + (R() - .5) * (opt.rough ?? .1);
      P.push([cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w]);
    }
    const p = new Path2D(); p.moveTo(P[0][0], P[0][1]);
    for (let i = 0; i < n; i++) {
      const A = P[i], B = P[(i + 1) % n];
      const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy) || 1;
      let nx = dy / len, ny = -dx / len; if ((mx - cx) * nx + (my - cy) * ny < 0) { nx = -nx; ny = -ny; }
      const b = len * ((opt.bulge ?? .38) + (opt.bulgeVar ?? .3) * R());
      // 叶尖：偶尔把弧收成一个小尖
      if (opt.tips && R() < opt.tips) { p.lineTo(mx + nx * b * 1.25, my + ny * b * 1.25); p.lineTo(B[0], B[1]); }
      else p.quadraticCurveTo(mx + nx * b, my + ny * b, B[0], B[1]);
    }
    p.closePath(); return p;
  }

  // —— 一棵树：一团团从后往前画，每团自己 深 → 中 → 亮 → 高光 ——
  // T = { clumps:[[x,y,r,z]], pal:[d0..d4], L:[lx,ly](指向光), center:[x,y], R:冠半径, leaf: 叶簇大小系数 }
  function tree(ctx, R, T) {
    const L = T.L, pal = T.pal, lf = T.leaf || .2;
    const cl = T.clumps.slice().sort((a, b) => (a[3] ?? a[1]) - (b[3] ?? b[1]));
    for (const [x, y, r] of cl) {
      const vx = (x - T.center[0]) / T.R, vy = (y - T.center[1]) / T.R;
      const s = Math.max(-1, Math.min(1, vx * L[0] + vy * L[1] + .15));      // 这一团朝不朝光
      const deep = Math.min(1, Math.hypot(vx, vy));                          // 越靠外越亮
      const base = s < -.25 ? pal[0] : mix(pal[0], pal[1], .5 + .5 * deep);
      const bp = scallop(R, x, y, r * (.92 + .16 * R()), r * (.78 + .14 * R()), r * lf * 1.3, { tips: .25, wob: .14, rough: .1 });
      if (r > 30) paintFill(ctx, R, bp, base, [x - r, y - r, 2 * r, 2 * r], { n: 10, len: r * .4, alpha: .12, thin: .3, angVar: 3, light: .08, dark: .2 });
      else { ctx.fillStyle = base; ctx.fill(bp); }
      if (s < -.55 || G.GOUACHE.flat) continue;
      ctx.fillStyle = s < 0 ? pal[1] : jit(pal[2], R, .06);
      const m = r * (.66 + .1 * R());
      ctx.fill(scallop(R, x + L[0] * r * .26, y + L[1] * r * .26, m, m * .88, r * lf, { tips: .3 }));
      if (s < .05) continue;
      ctx.fillStyle = jit(pal[3], R, .08);
      const k = 1 + Math.floor(R() * 2.2);
      for (let j = 0; j < k; j++) {
        const q = r * (.3 + .14 * R()), a = Math.atan2(L[1], L[0]) + (R() - .5) * 1.4;
        ctx.fill(scallop(R, x + Math.cos(a) * r * .46, y + Math.sin(a) * r * .46, q, q * .86, r * lf * .7, { tips: .35 }));
      }
      if (s > .35 && R() < .8) {
        ctx.fillStyle = pal[4];
        for (let j = 0; j < 2; j++) { const q = r * (.1 + .07 * R()), a = Math.atan2(L[1], L[0]) + (R() - .5) * 1.1; ctx.fill(scallop(R, x + Math.cos(a) * r * .68, y + Math.sin(a) * r * .66, q, q * .8, r * lf * .45, { tips: .4 })); }
      }
    }
  }
  // 自动给一个树冠排叶团：外圈一圈 + 里面几团，越往上越小
  function crownClumps(R, cx, cy, w, h, n = 22, size = .22) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = R() * Math.PI * 2, d = Math.sqrt(R());
      const x = cx + Math.cos(a) * w * .5 * d, y = cy + Math.sin(a) * h * .5 * d;
      const r = Math.min(w, h) * size * (.7 + .6 * R()) * (1 - .25 * (cy - y) / h);
      out.push([x, y, r, y + (R() - .5) * h * .2 + (d < .5 ? -h : 0) * .1]);
    }
    return out;
  }

  // —— 草：一根根细长的叶片 ——
  function blade(ctx, x, y, h, w, bend, col) {
    const tx = x + bend * h, ty = y - h * (1 - .35 * bend * bend);
    const cx = x + bend * h * .12, cy = y - h * .62;
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(x - w * .5, y);
    ctx.quadraticCurveTo(cx - w * .35, cy, tx, ty);
    ctx.quadraticCurveTo(cx + w * .35, cy, x + w * .5, y);
    ctx.closePath(); ctx.fill();
  }
  // 宽叶（百合叶、芒草叶）：带一点 S 形
  function leafBlade(ctx, x, y, h, w, bend, col, flip = 1) {
    const tx = x + bend * h, ty = y - h * (1 - .3 * bend * bend);
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y);
    ctx.bezierCurveTo(x - w * flip, y - h * .35, tx - w * .8 * flip, ty + h * .3, tx, ty);
    ctx.bezierCurveTo(tx + w * .2 * flip, ty + h * .35, x + w * .5 * flip, y - h * .3, x + w * .3 * flip, y);
    ctx.closePath(); ctx.fill();
  }
  // 一簇草：从一个点散开 5~9 片叶
  function tuft(ctx, R, x, y, h, w, cols, wind = .3) {
    const n = 5 + Math.floor(R() * 5);
    for (let i = 0; i < n; i++) {
      const t = (i / (n - 1) - .5);
      const bend = t * .9 + wind * (.5 + R() * .6);
      blade(ctx, x + t * w * 2, y, h * (.55 + .5 * R()) * (1 - Math.abs(t) * .5), w * (.7 + .6 * R()), bend, cols[Math.min(cols.length - 1, Math.floor(R() * cols.length * (.6 + .5 * (1 - Math.abs(t)))))]);
    }
  }
  // 一片草丛：从后往前，暗 → 亮；band(x,y) 给出这一处被风吹亮的程度
  function meadow(ctx, R, o) {
    const { x0, x1, yTop, yBot, n, hmin, hmax, pal, wind = .35, wmin = 2, wmax = 6 } = o;
    const items = [];
    for (let i = 0; i < n; i++) { const t = Math.pow(R(), .7); items.push([x0 + (x1 - x0) * R(), yTop(0) + 0, t]); }
    const pts = [];
    for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * R(); const yt = yTop(x); const y = yt + (yBot - yt) * Math.pow(R(), 1.3); pts.push([x, y]); }
    pts.sort((a, b) => a[1] - b[1]);
    for (const [x, y] of pts) {
      const yt = yTop(x), t = (y - yt) / Math.max(1, yBot - yt);
      const h = (hmin + (hmax - hmin) * (.4 + .6 * R())) * (.55 + .7 * t);
      const lit = R() < (o.litFrac ?? .3) * (1 - t * .5);
      const k = lit ? 3 + Math.floor(R() * 2) : Math.floor(R() * 3);
      const col = jit(pal[Math.min(pal.length - 1, k)], R, .1);
      const bend = wind * (.4 + .9 * R()) + (R() - .5) * .3;
      blade(ctx, x, y, h, wmin + (wmax - wmin) * R() * (.5 + t), bend, col);
    }
  }

  // —— 云 ——
  // 积云的圆：平的底 + 越往上越窄 + 菜花边
  function cloudCircles(R, { x, base, w, h, bud = 2, lean = 0, tower = .6 }) {
    const C = [];
    const nb = Math.max(4, Math.round(w / 70));
    for (let i = 0; i < nb; i++) { const t = (i + .5) / nb; const r = w / nb * (.62 + .3 * R()); C.push([x - w / 2 + t * w + (R() - .5) * 16, base - r * .45, r]); }
    const N = Math.round(10 + w / 45);
    for (let i = 0; i < N; i++) {
      const t = Math.pow(R(), 1.05);
      const hw = w / 2 * Math.pow(1 - Math.pow(t, 1.2 + tower), .7) * (.45 + .5 * R());
      const r = Math.max(14, (w * .15) * (1 - .55 * t) * (.7 + .5 * R()));
      C.push([x + (R() * 2 - 1) * hw * .82 + lean * t * h, base - r * .55 - t * (h - r * 1.1), r]);
    }
    let out = C.slice(), last = C;
    for (let pass = 0; pass < bud; pass++) {
      const add = [];
      for (const [cx, cy, r] of last) {
        if (r < 12) continue;
        const n = 3 + Math.floor(R() * 4);
        for (let j = 0; j < n; j++) { const a = -Math.PI * (.04 + .92 * R()); const rr = r * (.3 + .17 * R()); add.push([cx + Math.cos(a) * (r - rr * .62), cy + Math.sin(a) * (r - rr * .62), rr]); }
      }
      out = out.concat(add); last = add;
    }
    return out;
  }
  function circlesPath(C, k = 1, dx = 0, dy = 0) { const p = new Path2D(); for (const [x, y, r] of C) { p.moveTo(x + dx + r * k, y + dy); p.arc(x + dx, y + dy, r * k, 0, Math.PI * 2); } return p; }
  // 画一朵云到 ctx：P = { sh, mid, lit, hi, base }，L = 指向光
  function cloud(ctx, R, C, P, o = {}) {
    const L = o.L || [-.5, -.86], sc = o.scale || 1;
    const W = ctx.canvas.width, H = ctx.canvas.height;
    const off = document.createElement('canvas'); off.width = W; off.height = H;
    const c = off.getContext('2d'); c.setTransform(ctx.getTransform());
    const top = Math.min(...C.map(q => q[1] - q[2])), bot = Math.max(...C.map(q => q[1] + q[2]));
    const hgt = bot - top;
    // ① 整朵：亮面色，边缘软（纸是湿的）
    c.filter = `blur(${(o.edge ?? 1.3) * sc}px)`; c.fillStyle = P.lit; c.fill(circlesPath(C));
    c.globalCompositeOperation = 'source-atop';
    if (G.GOUACHE.flat) { c.globalCompositeOperation = 'source-over'; c.filter = 'none'; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(off, 0, 0); ctx.restore(); return; }
    // ② 背光那半边 + 下半部：一大片中间色，湿边晕开
    c.filter = `blur(${10 * sc}px)`; c.fillStyle = P.mid;
    { const p = new Path2D(); for (const [x, y, r] of C) { const lo = (y - top) / hgt; if (lo < .3 && R() < .7) continue; const k = .55 + .3 * R(); const ox = -L[0] * r * (.35 + .3 * R()), oy = -L[1] * r * (.35 + .3 * R()); p.moveTo(x + ox + r * k, y + oy); p.arc(x + ox, y + oy, r * k, 0, 6.2832); } c.fill(p); }
    // ③ 阴影：鼓包之间的缝、底部——一块块蓝灰，边缘软
    c.filter = `blur(${11 * sc}px)`; c.fillStyle = P.sh;
    { const p = new Path2D(); for (const [x, y, r] of C) { const lo = (y - top) / hgt; if (lo < .5 || r < 30 || R() < .55) continue; const k = .55 + .3 * R(); const ox = -L[0] * r * .55, oy = -L[1] * r * .55; p.moveTo(x + ox + r * k, y + oy); p.arc(x + ox, y + oy, r * k, 0, 6.2832); } c.fill(p); }
    // ④ 底：平、最暗
    c.filter = `blur(${4 * sc}px)`;
    const g = c.createLinearGradient(0, bot, 0, bot - hgt * .28); g.addColorStop(0, P.base); g.addColorStop(1, P.base + '00');
    c.fillStyle = g; c.fillRect(-1e4, top - 10, 2e4, hgt + 20);
    // ⑤ 受光的上沿再提一点（大块、糊）
    c.filter = `blur(${5 * sc}px)`; c.fillStyle = P.hi; c.globalAlpha = .7;
    { const p = new Path2D(); for (const [x, y, r] of C) { if ((y - top) / hgt > .5 || R() < .5) continue; const k = .45; p.moveTo(x + L[0] * r * .4 + r * k, y + L[1] * r * .4); p.arc(x + L[0] * r * .4, y + L[1] * r * .4, r * k, 0, 6.2832); } c.fill(p); }
    c.globalAlpha = 1; c.filter = 'none';
    // ⑥ 纸上的颗粒：亮面里一点点不匀
    mottle(c, R, [Math.min(...C.map(q => q[0] - q[2])), top, Math.max(...C.map(q => q[0] + q[2])) - Math.min(...C.map(q => q[0] - q[2])), hgt], [P.sh, P.hi], { n: Math.round(hgt * .5), len: hgt * .05, alpha: .07, thin: .7, angVar: 3 });
    c.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = o.alpha ?? 1; ctx.drawImage(off, 0, 0); ctx.restore();
  }

  // —— 笔触：在一块区域里抹一些半透明的长条，深浅各半（水粉平涂里的“不匀”）——
  function mottle(ctx, R, box, cols, o = {}) {
    if (G.GOUACHE && G.GOUACHE.flat) return;
    const [x0, y0, w, h] = box, n = o.n || 40, len = o.len || 30;
    ctx.save();
    for (let i = 0; i < n; i++) {
      ctx.globalAlpha = (o.alpha || .08) * (.5 + R());
      ctx.fillStyle = cols[i % cols.length];
      const x = x0 + R() * w, y = y0 + R() * h, l = len * (.5 + R()), t = l * (o.thin || .18) * (.6 + .8 * R());
      ctx.beginPath(); ctx.ellipse(x, y, l, t, (o.ang || 0) + (R() - .5) * (o.angVar ?? .4), 0, 7); ctx.fill();
    }
    ctx.restore();
  }
  // 平涂一块：先平铺，再在形状里面抹笔触
  function paintFill(ctx, R, path, col, box, o = {}) {
    ctx.fillStyle = col; ctx.fill(path);
    ctx.save(); ctx.clip(path);
    mottle(ctx, R, box, [mix(col, '#ffffff', o.light ?? .12), mix(col, '#000000', o.dark ?? .12)], o);
    ctx.restore();
  }

  // —— 一条起伏的天际线（远山 / 树林）：顶上是一个个小树冠鼓包 ——
  function ridgePath(R, x0, x1, yOf, bump, bottom) {
    const p = new Path2D(); p.moveTo(x0, bottom); p.lineTo(x0, yOf(x0));
    let x = x0;
    while (x < x1) { const w = bump * (.6 + .9 * R()); const nx = Math.min(x1, x + w); const y0 = yOf(x), y1 = yOf(nx); p.quadraticCurveTo((x + nx) / 2, Math.min(y0, y1) - w * (.35 + .4 * R()), nx, y1); x = nx; }
    p.lineTo(x1, bottom); p.closePath(); return p;
  }

  // —— 胶片颗粒 + 纸 ——
  function grainCanvas(R, n = 256) {
    const c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d'); const im = x.createImageData(n, n);
    for (let i = 0; i < n * n; i++) { const v = 128 + (R() - .5) * 120; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
    x.putImageData(im, 0, 0); return c;
  }
  function finish(ctx, R, W, H, o = {}) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const g = grainCanvas(R);
    ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = o.grain ?? .1; ctx.fillStyle = ctx.createPattern(g, 'repeat'); ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // 冷暖：亮部暖一点、暗部青一点（胶片印出来的样子）
    ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = o.grade ?? .18;
    const gr = ctx.createLinearGradient(0, 0, ctx.canvas.width * .4, ctx.canvas.height);
    gr.addColorStop(0, '#ffe7b8'); gr.addColorStop(1, '#3d6f80'); ctx.fillStyle = gr; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    // 暗角
    const v = ctx.createRadialGradient(ctx.canvas.width / 2, ctx.canvas.height * .55, ctx.canvas.height * .4, ctx.canvas.width / 2, ctx.canvas.height * .55, ctx.canvas.height * 1.15);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(10,20,30,${o.vignette ?? .22})`); ctx.fillStyle = v; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
  }

  G.GOUACHE = { tuft, mottle, paintFill, rng, hex, toHex, mix, jit, scallop, tree, crownClumps, blade, leafBlade, meadow, cloudCircles, circlesPath, cloud, ridgePath, finish };
})(window);
