// summer.js — 封面那张画：乡下的夏天（构图、透视、颜料都在这里定）
// 世界坐标 = 1920×1080 的设计稿；view 决定取景（手机竖屏就裁其中一块）
(function (G) {
  const { rng, mix, jit, scallop, tree, crownClumps, blade, leafBlade, meadow, cloudCircles, cloud, ridgePath, finish, mottle, paintFill, tuft } = GOUACHE;

  const PALS = {
    noon: {
      sky: ['#14609f', '#1f7fc0', '#4f9fd4', '#a4cfe0'], cl: { sh: '#a3aec6', base: '#95a0bc', mid: '#d3dbe2', lit: '#f1f3ee', hi: '#fffdf4' },
      far: ['#5f86b4', '#8eaec8'], fo: ['#24484a', '#2f5f53', '#4c7f5c', '#79a466'],
      tree: ['#0f2c2a', '#1b4639', '#2f6545', '#568e4c', '#97bf68'],
      pad: ['#6b8f3f', '#7f9e45', '#93ad52', '#a9b65e'], padFar: '#93ab9c', haze: '#b9d3cf', levee: '#4b7a37', wind: '#cfe39a',
      road: '#d6c79f', roadS: '#b0a07a', bank: ['#16301f', '#22462c', '#335f37', '#4f8441', '#7fae54', '#b3cf74'],
      pole: '#5e554d', wire: 'rgba(40,40,44,.75)', lily: ['#f39c2e', '#d0701a'], white: '#f4f1e2', yellow: '#f2cf3a',
      L: [-.55, -.83], grade: .16,
    },
    gold: {
      sky: ['#2b4f8f', '#4f78b6', '#93a9c4', '#f2d6a2'], cl: { sh: '#56679a', base: '#3d4c7c', mid: '#8b8fae', lit: '#f6d9a6', hi: '#fff3d2' },
      far: ['#3d4f78', '#6f7a96'], fo: ['#1b2c38', '#243b40', '#3f5a47', '#7a8a52'],
      tree: ['#0d1f24', '#18343a', '#2c5040', '#5e7d44', '#c2b36a'],
      pad: ['#4c7a3a', '#6c8f40', '#93a650', '#c4bf6a'], padFar: '#7f8a84', haze: '#d9c7a6', levee: '#3d5a32', wind: '#e8d58a',
      road: '#d8b98a', roadS: '#9a8064', bank: ['#101f1a', '#1a3324', '#294a2c', '#4a6e36', '#93a24c', '#d6c46c'],
      pole: '#3e3734', wire: 'rgba(30,26,30,.8)', lily: ['#f39a30', '#c2601a'], white: '#f2e8cf', yellow: '#f2c83a',
      L: [.75, -.5], grade: .22,
    },
    morning: {
      sky: ['#3d6fb4', '#6c9bd0', '#b4c8de', '#f2dcd6'], cl: { sh: '#b3add0', base: '#9a95bf', mid: '#ece0e4', lit: '#fff4ee', hi: '#fffbf6' },
      far: ['#8794c0', '#b6b9d4'], fo: ['#2c4a52', '#3c605a', '#5c8466', '#8eaa78'],
      tree: ['#16343a', '#234c48', '#3b6c50', '#6c9858', '#b6cc84'],
      pad: ['#6a9c52', '#87b25e', '#a5c470', '#c4d690'], padFar: '#a6b6b6', haze: '#d6d4d8', levee: '#567c45', wind: '#e2ecbc',
      road: '#ddd0b6', roadS: '#b8a88e', bank: ['#1a3228', '#284a36', '#3b6442', '#5c8a4e', '#8fb46a', '#c2d690'],
      pole: '#6a6058', wire: 'rgba(50,50,60,.7)', lily: ['#f4a040', '#d27a2a'], white: '#f6f2ea', yellow: '#f2d65a',
      L: [-.75, -.4], grade: .14,
    },
  };

  // 透视：相机在河堤上，高 6 m
  const CAM = { yh: 600, vpx: 1060, f: 1100, hc: 6 };
  const gp = (X, Z, Y = 0) => [CAM.vpx + X * CAM.f / Z, CAM.yh + CAM.f * (CAM.hc - Y) / Z];
  const roadX = Z => -14 + 36 * Math.sin(Z / 260) + Z * .03;

  function lily(ctx, R, x, y, s, pal, ang = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * Math.PI * 2 + (k % 2) * .25, l = k % 2 ? 15 : 18;
      ctx.save(); ctx.rotate(a); ctx.fillStyle = k % 2 ? pal.lily[1] : pal.lily[0];
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(l * .45, -6, l, -1.5); ctx.quadraticCurveTo(l * .5, 5, 0, 0); ctx.fill();
      ctx.strokeStyle = pal.lily[1]; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(l * .7, -.5); ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = '#7a3a12'; for (let k = 0; k < 5; k++) { const a = k / 5 * 6.28; ctx.beginPath(); ctx.arc(Math.cos(a) * 6, Math.sin(a) * 6 - 2, 1.1, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  function umbel(ctx, R, x, y, s, col) {
    ctx.fillStyle = col;
    for (let k = 0; k < 26; k++) { const a = R() * Math.PI, d = Math.sqrt(R()) * 12 * s; ctx.beginPath(); ctx.arc(x + Math.cos(a) * d * 1.3, y - Math.sin(a) * d * .55, (1 + R() * 1.3) * s, 0, 7); ctx.fill(); }
  }
  function stem(ctx, x0, y0, x1, y1, col, w = 1.6) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 + (x1 - x0) * .2, (y0 + y1) / 2, x1, y1); ctx.stroke(); }

  // ctx：已经设置好像素比；view = [x, y, w, h]（世界坐标里取哪一块）
  function paint(ctx, CW, CH, o = {}) {
    const P = Object.assign({}, PALS[o.pal || 'noon']);
    const R = rng(o.seed || 7);
    const view = o.view || [0, 0, 1920, 1080];
    const sc = CW / view[2];
    ctx.save();
    ctx.setTransform(sc * (o.dpr || 1), 0, 0, sc * (o.dpr || 1), -view[0] * sc * (o.dpr || 1), -view[1] * sc * (o.dpr || 1));
    const L = P.L, yh = CAM.yh;
    // ① 天空：钴蓝 → 天蓝 → 地平线发白，横着刷几笔
    const g = ctx.createLinearGradient(0, 0, 0, yh + 20);
    g.addColorStop(0, P.sky[0]); g.addColorStop(.45, P.sky[1]); g.addColorStop(.8, P.sky[2]); g.addColorStop(1, P.sky[3]);
    ctx.fillStyle = g; ctx.fillRect(-10, -10, 1940, yh + 40);
    mottle(ctx, R, [0, 0, 1920, yh], [mix(P.sky[1], '#ffffff', .2), mix(P.sky[0], '#000000', .15)], { n: 260, len: 120, alpha: .07, thin: .06, ang: .03, angVar: .08 });
    // ② 云：远处一排扁云，左上一朵小积云，中间一座积乱云
    const clouds = o.clouds || [
      { x: 1190, base: 520, w: 860, h: 470, bud: 2, lean: -.04, tower: .9 },
      { x: 330, base: 230, w: 300, h: 90, bud: 2, tower: .2 },
      { x: 640, base: 330, w: 220, h: 70, bud: 2, tower: .2 },
      { x: 90, base: 470, w: 260, h: 60, bud: 1, tower: .1 },
    ];
    const lowP = Object.assign({}, P.cl, { sh: mix(P.cl.sh, P.sky[2], .4), base: mix(P.cl.base, P.sky[2], .4) });
    for (let i = 0; i < 9; i++) { const C = cloudCircles(R, { x: 60 + i * 230 + R() * 60, base: yh - 34 - R() * 22, w: 160 + R() * 120, h: 24 + R() * 18, bud: 1, tower: .05 }); cloud(ctx, R, C, lowP, { L, scale: sc * (o.dpr || 1), alpha: .9 }); }
    for (const c of clouds) cloud(ctx, R, cloudCircles(R, c), P.cl, { L, scale: sc * (o.dpr || 1) });
    // ③ 远山：最蓝最浅
    const farY = x => yh - 46 - 40 * Math.exp(-Math.pow((x - 420) / 260, 2)) - 26 * Math.exp(-Math.pow((x - 1500) / 300, 2)) - 10 * Math.sin(x * .01);
    ctx.fillStyle = P.far[1]; ctx.fill(ridgePath(R, -20, 1940, farY, 14, yh + 30));
    ctx.fillStyle = mix(P.far[0], P.far[1], .35); ctx.fill(ridgePath(R, -20, 1940, x => farY(x) + 18 + 8 * Math.sin(x * .02), 12, yh + 30));
    // ④ 远处的树林：左边一片坡、右边一长条
    const foL = x => yh - 92 * Math.pow(Math.max(0, 1 - x / 760), 1.3) - 8;
    const foR = x => yh - 20 - 8 * Math.sin(x * .03);
    for (const [x0, x1, f] of [[-20, 780, foL], [1240, 1940, foR]]) {
      ctx.fillStyle = P.fo[1]; ctx.fill(ridgePath(R, x0, x1, f, 22, yh + 40));
      // 树林的受光：沿着天际线往下一点，一排小亮团
      ctx.fillStyle = P.fo[2];
      for (let x = x0 + 10; x < x1; x += 16 + R() * 18) { const y = f(x) + 6 + R() * 10; ctx.fill(scallop(R, x + L[0] * 4, y + L[1] * 2, 9 + R() * 8, 7 + R() * 6, 6, { tips: .2 })); }
      ctx.fillStyle = P.fo[3];
      for (let x = x0 + 10; x < x1; x += 30 + R() * 30) { if (R() < .5) continue; const y = f(x) + 2 + R() * 6; ctx.fill(scallop(R, x + L[0] * 6, y, 5 + R() * 5, 4 + R() * 3, 4)); }
      ctx.fillStyle = P.fo[0]; ctx.fillRect(x0, yh - 4, x1 - x0, 50);
    }
    // ⑤ 稻田：透视的田块，越远越蓝越浅；田埂是深一点的细线
    ctx.fillStyle = mix(P.pad[1], P.padFar, .5); ctx.fillRect(-10, yh - 2, 1940, 600);
    const zs = [32]; while (zs[zs.length - 1] < 2400) zs.push(zs[zs.length - 1] * 1.22 + 6);
    for (let k = zs.length - 2; k >= 0; k--) {
      const Z0 = zs[k], Z1 = zs[k + 1], haze = Math.min(1, Math.pow((Z0 - 30) / 900, .6));
      const cw = 26 + R() * 10, off = R() * cw;
      for (let X = -1400 + off, X1; X < 1400; X = X1) {
        X1 = X + cw * (.7 + .6 * R());
        const a = gp(X, Z0), b = gp(X1, Z0), c = gp(X1, Z1), d = gp(X, Z1);
        let col = P.pad[Math.floor(R() * 3) + (R() < .15 ? 1 : 0)] || P.pad[2];
        if (Z0 > 90 && Z0 < 700 && R() < .07) col = mix(P.sky[2], P.cl.mid, .4);   // 刚灌了水的田，映着天
        col = mix(col, P.padFar, haze * .85);
        const fp = new Path2D(); fp.moveTo(...a); fp.lineTo(...b); fp.lineTo(...c); fp.lineTo(...d); fp.closePath();
        if (Z0 < 160) paintFill(ctx, R, fp, col, [Math.min(a[0], d[0]), d[1], Math.abs(b[0] - a[0]) + 40, a[1] - d[1]], { n: 6, len: Math.abs(b[0] - a[0]) * .3, thin: .08, alpha: .12, light: .15, dark: .1 }); else { ctx.fillStyle = col; ctx.fill(fp); }
        ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...c); ctx.lineTo(...d); ctx.closePath();
        ctx.strokeStyle = mix(P.levee, P.padFar, haze * .7); ctx.lineWidth = Math.max(.4, 26 / Z0); ctx.stroke();
        // 近处的稻子：一行行往消失点收
        if (Z0 < 70) { ctx.strokeStyle = mix(col, P.levee, .35); ctx.lineWidth = Math.max(.5, 8 / Z0); for (let xx = X + .6; xx < X1; xx += .9) { const p0 = gp(xx, Z0), p1 = gp(xx, Z1); ctx.beginPath(); ctx.moveTo(...p0); ctx.lineTo(...p1); ctx.stroke(); } }
      }
    }
    // 风吹过稻田：一道道软的浅色
    ctx.save(); ctx.filter = `blur(${6 * sc * (o.dpr || 1)}px)`; ctx.fillStyle = P.wind;
    for (let i = 0; i < 14; i++) { const Z = 40 + Math.pow(R(), 1.6) * 500, X = -500 + R() * 1000; const [x, y] = gp(X, Z); ctx.globalAlpha = .25 + .2 * R(); ctx.beginPath(); ctx.ellipse(x, y, 2400 / Z * (1 + R()), 160 / Z, -.05, 0, 7); ctx.fill(); }
    ctx.restore(); ctx.globalAlpha = 1;
    // 田之间的一排排灌木（中景的“厚度”）
    for (const [sxa, sxb, Z] of [[60, 640, 150], [1180, 1560, 230], [260, 900, 420], [1120, 1760, 720], [0, 420, 900]]) {
      const Xa = (sxa - CAM.vpx) * Z / CAM.f, Xb = (sxb - CAM.vpx) * Z / CAM.f;
      const [xa, y] = gp(Xa, Z), [xb] = gp(Xb, Z); const hh = 2600 / Z;
      const fade = Math.min(.6, Z / 1200);
      ctx.fillStyle = mix(P.fo[0], P.padFar, fade); ctx.fill(ridgePath(R, xa, xb, x => y - hh * (.7 + .3 * Math.sin(x * .05)), hh * 1.3, y + hh * .25));
      ctx.fillStyle = mix(P.fo[2], P.padFar, fade); for (let x = xa + hh; x < xb - hh; x += hh * 1.2) { if (R() < .35) continue; ctx.fill(scallop(R, x - hh * .2, y - hh * .9, hh * .7, hh * .45, hh * .35)); }
      ctx.fillStyle = mix(P.fo[3], P.padFar, fade); for (let x = xa + hh; x < xb - hh; x += hh * 2.2) { if (R() < .5) continue; ctx.fill(scallop(R, x - hh * .4, y - hh * 1.15, hh * .35, hh * .22, hh * .2)); }
    }
    // 中景左边：一户农家，瓦屋顶，屋后一片竹林和大树
    { const [hx, hy] = gp(-46, 200), s = .62;
      for (const [dx, w, h] of [[-46, 70, 64], [-10, 44, 40], [40, 56, 46]]) { const T = { clumps: crownClumps(R, hx + dx, hy - h * .55, w, h, 10, .3), pal: P.tree.map(c => mix(c, P.padFar, .22)), L: [-.3, -.95], center: [hx + dx, hy - h * .6], R: w * .5, leaf: .24 }; tree(ctx, R, T); }
      ctx.save(); ctx.translate(hx, hy); ctx.scale(s, s);
      ctx.fillStyle = '#e9e1cc'; ctx.fillRect(-34, -14, 56, 14); ctx.fillStyle = '#cfc6ae'; ctx.fillRect(22, -12, 18, 12);
      ctx.fillStyle = '#4a3f38'; for (let i = 0; i < 4; i++) ctx.fillRect(-30 + i * 13, -11, 6, 8);
      ctx.fillStyle = '#4c5866'; ctx.beginPath(); ctx.moveTo(-42, -13); ctx.lineTo(-26, -30); ctx.lineTo(14, -30); ctx.lineTo(30, -13); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#6d7a88'; ctx.beginPath(); ctx.moveTo(-42, -13); ctx.lineTo(-26, -30); ctx.lineTo(-18, -30); ctx.lineTo(-33, -13); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#39434e'; ctx.fillRect(-28, -31, 44, 2.5);
      ctx.fillStyle = '#5b636d'; ctx.beginPath(); ctx.moveTo(18, -11); ctx.lineTo(30, -21); ctx.lineTo(44, -11); ctx.closePath(); ctx.fill();
      ctx.restore(); }
    // 田里的小树林岛
    for (const [X, Z, s] of [[-260, 300, 1], [300, 520, .8], [-60, 900, .7]]) {
      const [x, y] = gp(X, Z), r = s * 2200 / Z * 6;
      ctx.fillStyle = mix(P.fo[0], P.padFar, Math.min(.6, Z / 1500)); ctx.beginPath(); ctx.ellipse(x, y, r * 1.2, r * .14, 0, 0, 7); ctx.fill();
      const T = { clumps: crownClumps(R, x, y - r * .5, r * 2.2, r * 1.1, 9, .3), pal: P.tree.map(c => mix(c, P.padFar, Math.min(.65, Z / 1300))), L, center: [x, y - r * .5], R: r * 1.1, leaf: .22 };
      tree(ctx, R, T);
    }
    // ⑥ 田里的小路 + 一排电线杆
    { ctx.fillStyle = P.road; ctx.beginPath(); const pts = []; for (let Z = 40; Z < 1800; Z *= 1.08) pts.push([Z, gp(roadX(Z) - 2, Z), gp(roadX(Z) + 2, Z)]);
      ctx.moveTo(...pts[0][1]); for (const p of pts) ctx.lineTo(...p[1]); for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(...pts[i][2]); ctx.closePath(); ctx.fill(); }
    const poles = []; for (let Z = 60; Z < 1500; Z += 46) poles.push([roadX(Z) + 3.5, Z]);
    // ⑦ 河堤（前景）：上沿一条弧，往下是深色的草
    const bankY = x => 790 + 40 * Math.pow((x - 1100) / 1100, 2) - 30 * Math.exp(-Math.pow((x - 300) / 300, 2));
    { const p = new Path2D(); p.moveTo(-20, 1100); for (let x = -20; x <= 1940; x += 20) p.lineTo(x, bankY(x)); p.lineTo(1940, 1100); p.closePath();
      ctx.fillStyle = P.bank[2]; ctx.fill(p);
      const gb = ctx.createLinearGradient(0, 800, 0, 1080); gb.addColorStop(0, P.bank[2] + '00'); gb.addColorStop(1, P.bank[0]); ctx.fillStyle = gb; ctx.fill(p); }
    // 电线杆（画在堤上的草之前，远的被近的草挡住）
    for (let i = poles.length - 1; i >= 0; i--) {
      const [X, Z] = poles[i]; const [x, yb] = gp(X, Z), [, yt] = gp(X, Z, 10);
      const w = Math.max(1, .28 * CAM.f / Z);
      ctx.fillStyle = mix(P.pole, P.padFar, Math.min(.7, Z / 1300)); ctx.fillRect(x - w / 2, yt, w, yb - yt);
      const [, ya] = gp(X, Z, 9.2), aw = 1.6 * CAM.f / Z; ctx.fillRect(x - aw / 2, ya, aw, Math.max(.8, .12 * CAM.f / Z));
    }
    ctx.strokeStyle = P.wire; ctx.lineCap = 'round';
    for (const k of [-.5, .5]) { ctx.beginPath(); for (let i = 0; i < poles.length - 1; i++) { const [X0, Z0] = poles[i], [X1, Z1] = poles[i + 1]; for (let t = 0; t <= 16; t++) { const u = t / 16, p = gp(X0 + (X1 - X0) * u + k * 1.4, Z0 + (Z1 - Z0) * u, 9.3 - 1.2 * 4 * u * (1 - u)); (i === 0 && t === 0) ? ctx.moveTo(...p) : ctx.lineTo(...p); } } ctx.lineWidth = Math.max(.6, 1.3 * sc); ctx.stroke(); }
    // ⑧ 大树（右边）：树干先画，叶团压上去
    const TX = 1690, TY = 820;
    { ctx.fillStyle = P.tree[0];
      const limb = (pts, w0, w1) => { const n = 24, Lp = [], Rp = []; const B = t => { const u = 1 - t; return [0, 1].map(k => u * u * u * pts[0][k] + 3 * u * u * t * pts[1][k] + 3 * u * t * t * pts[2][k] + t * t * t * pts[3][k]); };
        for (let i = 0; i <= n; i++) { const t = i / n, p = B(t), q = B(Math.min(1, t + .01)), p0 = B(Math.max(0, t - .01)); let dx = q[0] - p0[0], dy = q[1] - p0[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; const w = (w0 + (w1 - w0) * t) / 2; Lp.push([p[0] - dy * w, p[1] + dx * w]); Rp.push([p[0] + dy * w, p[1] - dx * w]); }
        ctx.beginPath(); Lp.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); for (let i = Rp.length - 1; i >= 0; i--) ctx.lineTo(...Rp[i]); ctx.closePath(); ctx.fill(); };
      ctx.fillStyle = mix(P.tree[0], '#5a4a3a', .45);
      limb([[TX, TY + 10], [TX - 6, TY - 120], [TX - 30, TY - 220], [TX - 40, TY - 320]], 78, 44);
      limb([[TX - 36, TY - 300], [TX - 110, TY - 380], [TX - 200, TY - 430], [TX - 300, TY - 470]], 34, 8);
      limb([[TX - 40, TY - 310], [TX - 10, TY - 420], [TX + 60, TY - 500], [TX + 160, TY - 560]], 30, 8);
      limb([[TX - 44, TY - 316], [TX - 80, TY - 440], [TX - 60, TY - 560], [TX - 90, TY - 660]], 26, 6);
      // 树干的受光：左边一条亮
      ctx.fillStyle = 'rgba(200,180,140,.28)'; ctx.beginPath(); ctx.moveTo(TX - 36, TY); ctx.quadraticCurveTo(TX - 46, TY - 160, TX - 66, TY - 300); ctx.lineTo(TX - 56, TY - 300); ctx.quadraticCurveTo(TX - 34, TY - 160, TX - 26, TY); ctx.fill();
    }
    const crown = [];
    const M = [[-.3, .06, .2], [-.1, -.18, .24], [.18, -.26, .22], [.34, -.02, .22], [.04, .1, .26], [-.34, .32, .15], [-.12, .34, .17], [.18, .3, .2], [.4, .3, .16], [0, -.44, .15], [.3, -.46, .13]];
    const CX = 1690, CY = 380, CWd = 700, CHt = 520;
    for (const [dx, dy, r] of M) for (const c of crownClumps(R, CX + dx * CWd, CY + dy * CHt, r * 2 * CWd, r * 1.7 * CWd, 6, .28)) crown.push(c);
    tree(ctx, R, { clumps: crown, pal: P.tree, L: [L[0] * .5, -.87], center: [CX - 60, CY - 80], R: CWd * .5, leaf: .22 });
    // 叶子缝里透出来的天（只在树冠外沿那一圈）
    for (let i = 0; i < 8; i++) { const a = -Math.PI * (.2 + .6 * R()), d = .7 + .15 * R(); const x = CX - 40 + Math.cos(a) * CWd * .5 * d, y = CY - 40 + Math.sin(a) * CHt * .52 * d; if (x > 1900) continue; ctx.fillStyle = mix(P.sky[1], P.sky[2], (y / 600)); ctx.fill(scallop(R, x, y, 5 + R() * 8, 4 + R() * 6, 4)); }
    // 几根露出来的枝
    ctx.strokeStyle = mix(P.tree[0], '#3a3028', .5); ctx.lineCap = 'round';
    for (const [x0, y0, x1, y1, w] of [[1520, 430, 1440, 380, 7], [1600, 390, 1560, 300, 6], [1700, 420, 1780, 360, 6]]) { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2 + 10, (y0 + y1) / 2 - 10, x1, y1); ctx.stroke(); }
    // 树荫落在河堤上
    ctx.fillStyle = 'rgba(10,30,30,.32)'; ctx.beginPath(); ctx.ellipse(TX - 10, TY + 6, 260, 26, -.02, 0, 7); ctx.fill();
    // ⑨ 河堤上的土路：从左下斜着上来
    { const p = new Path2D(); p.moveTo(380, 1100); p.bezierCurveTo(560, 960, 760, 870, 1000, bankY(1000) + 4); p.lineTo(1120, bankY(1120) + 4); p.bezierCurveTo(880, 900, 720, 990, 640, 1100); p.closePath();
      ctx.fillStyle = P.road; ctx.fill(p);
      ctx.save(); ctx.clip(p); ctx.fillStyle = P.roadS; for (let i = 0; i < 40; i++) { ctx.globalAlpha = .4; ctx.beginPath(); ctx.ellipse(400 + R() * 700, 860 + R() * 240, 6 + R() * 22, 1.5 + R() * 3, -.4, 0, 7); ctx.fill(); }
      ctx.globalAlpha = .35; ctx.fillStyle = 'rgba(30,50,40,1)'; ctx.beginPath(); ctx.ellipse(1150, 890, 380, 40, -.25, 0, 7); ctx.fill(); ctx.restore(); ctx.globalAlpha = 1; }
    // ⑩ 堤上的草（从后往前）
    // 堤：先铺密密的一层（远处亮、近处暗），再撒一些被太阳照亮的草簇
    meadow(ctx, R, { x0: -20, x1: 1940, yTop: x => bankY(x) - 2, yBot: 1110, n: 9000, hmin: 8, hmax: 34, pal: [P.bank[1], P.bank[2], P.bank[3], P.bank[4], P.bank[5]], wind: .34, litFrac: .28, wmin: 2.2, wmax: 5.5 });
    { const pts = []; for (let i = 0; i < 160; i++) { const x = -20 + R() * 1960, yt = bankY(x); pts.push([x, yt + (1100 - yt) * Math.pow(R(), 1.2)]); }
      pts.sort((a, b) => a[1] - b[1]);
      for (const [x, y] of pts) { const t = (y - 780) / 300; tuft(ctx, R, x, y, (20 + 30 * R()) * (.6 + .9 * t), 3 + 3 * t, [P.bank[3], P.bank[4], P.bank[5]].map(c => jit(c, R, .08)), .34); } }
    // 路上的草：别盖住路
    // ⑪ 前景：左边一大丛高草 + 百合 + 白花；右下一丛
    const bigTuft = (x0, x1, yb, hmax, n, lilies) => {
      ctx.fillStyle = P.bank[0]; ctx.beginPath(); ctx.moveTo(x0, 1100); ctx.quadraticCurveTo((x0 + x1) / 2, yb - hmax * .5, x1, 1100); ctx.fill();
      for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * R(), y = 1100 + 10; const h = hmax * (.4 + .7 * R()); const k = R(); const col = k < .45 ? P.bank[1] : k < .75 ? P.bank[2] : k < .92 ? P.bank[3] : P.bank[4]; if (R() < .3) leafBlade(ctx, x, y, h * .6, 10 + R() * 8, .2 + R() * .5, jit(col, R, .1), R() < .5 ? 1 : -1); else blade(ctx, x, y, h, 3 + R() * 6, .15 + R() * .5, jit(col, R, .1)); }
      for (let i = 0; i < n * .25; i++) { const x = x0 + (x1 - x0) * R(); blade(ctx, x, 1110, hmax * (.5 + .6 * R()), 2 + R() * 3, .25 + R() * .4, jit(R() < .6 ? P.bank[4] : P.bank[5], R, .08)); }
      for (const [lx, ly, s] of lilies) { stem(ctx, lx - 20, 1100, lx, ly + 6, P.bank[2], 2.2); lily(ctx, R, lx, ly, s, P, (R() - .5) * .6); }
    };
    bigTuft(-60, 560, 1080, 380, 220, [[150, 790, 1.4], [260, 860, 1.2], [90, 900, 1.1], [380, 930, 1]]);
    for (const [x, y] of [[40, 760], [320, 800], [470, 860]]) { stem(ctx, x - 10, 1100, x, y + 4, P.bank[3], 1.4); umbel(ctx, R, x, y, 1.2, P.white); }
    bigTuft(1500, 1980, 1100, 210, 120, [[1700, 960, 1.1]]);
    for (let i = 0; i < 14; i++) { const x = 1540 + R() * 360, y = 930 + R() * 120; ctx.fillStyle = P.yellow; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x + (R() - .5) * 10, y + (R() - .5) * 8, 2.4, 0, 7); ctx.fill(); } }
    ctx.restore();
    finish(ctx, R, CW, CH, { grade: P.grade, grain: o.grain ?? .09, vignette: o.vignette ?? .2 });
    return { gp, P, bankY, CAM };
  }
  G.SUMMER = { paint, PALS, gp, CAM };
})(window);
