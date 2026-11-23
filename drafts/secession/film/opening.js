// 开场（第 0—357 帧）：方板像一张纸平放在暗室的桌上。镜头从正上方（= 封面构图）摇臂下降到低角度，
// 绕着树冠慢慢转；金箔是 3D 的薄片，翻着落下来，高光随视角和光的方向在箔片之间流动。
// 世界坐标：方板平面 z = 0（x 向右、y 向下，和方板坐标一致），z 朝上。
const OPEN = (() => {
  const E = ENG, P = E.PAL, G = GEOM, I = E.IMG, T = TL;
  const FOC = 1600;
  const v = { add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; } };

  // —— 镜头：目标点 (x, y)，z = FOC / 距离，俯仰 pitch（0 = 正上方往下看），方位 yaw ——————————
  const K = [
    [0, { x: -30, y: 440, z: 1, pitch: 0, yaw: 0 }],
    [26, { x: -22, y: 438, z: 1.015, pitch: 0, yaw: 0 }, 'io'],
    [150, { x: 438, y: 452, z: 2.9, pitch: .98, yaw: -.16 }, 'io'],
    [320, { x: 452, y: 410, z: 3.25, pitch: .86, yaw: .2 }, 'sm'],
    [T.bass, { x: 468, y: 350, z: 3.7, pitch: 0, yaw: 0 }, 'io'],
  ];
  function camera(f) {
    const k = E.keys(K, f), D = FOC / k.z, th = k.pitch, ph = k.yaw;
    const h = [Math.sin(ph), Math.cos(ph), 0];
    const Tg = [k.x, k.y, 0];
    const Pc = [k.x + D * Math.sin(th) * h[0], k.y + D * Math.sin(th) * h[1], D * Math.cos(th)];
    const F = v.norm(v.sub(Tg, Pc)), R = [Math.cos(ph), -Math.sin(ph), 0], U = v.cross(R, F);
    return { P: Pc, F, R, U, D, k };
  }
  const proj = (c, Q) => { const d = v.sub(Q, c.P), zc = v.dot(d, c.F); if (zc < 1) return null; return [960 + FOC * v.dot(d, c.R) / zc, 540 + FOC * v.dot(d, c.U) / zc, zc]; };
  function unproj(c, sx, sy) {
    const dir = v.add(c.F, v.add(v.mul(c.R, (sx - 960) / FOC), v.mul(c.U, (sy - 540) / FOC)));
    if (dir[2] >= -1e-5) return null;
    return v.add(c.P, v.mul(dir, -c.P[2] / dir[2]));
  }
  // 光：从左上方斜照，方位角慢慢转；第 280—335 帧有一道擦金的光扫过
  function light(f) {
    const az = (215 + 70 * E.sm(E.prog(f, 0, T.bass)) + 50 * E.ease.io(E.prog(f, 280, 335))) * Math.PI / 180, el = 38 * Math.PI / 180;
    return v.norm([Math.cos(az) * Math.cos(el), Math.sin(az) * Math.cos(el), Math.sin(el)]);
  }

  // —— 桌面贴图（静态，加载时画一次）————————————————————————————————————————————
  const TX0 = -960, TY0 = -160, TW = 1920, TH = 1200, TRES = 2;
  const HX0 = G.BX, HY0 = G.BY, HS = G.BS, HRES = 6;
  let TEX, HI, GG;
  function goldGrad(ctx, x, y, w, h) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, P.goldHi); g.addColorStop(.38, P.gold); g.addColorStop(.62, '#B88422'); g.addColorStop(1, P.goldHi); return g;
  }
  function init() {
    TEX = document.createElement('canvas'); TEX.width = TW * TRES; TEX.height = TH * TRES;
    let x = TEX.getContext('2d');
    x.fillStyle = P.ink; x.fillRect(0, 0, TEX.width, TEX.height);
    x.setTransform(TRES, 0, 0, TRES, -TX0 * TRES, -TY0 * TRES);
    x.drawImage(I.title, -886, 0, G.TW, G.TH);
    const sh = document.createElement('canvas'); sh.width = sh.height = 300; const sx = sh.getContext('2d'); sx.filter = 'blur(26px)'; sx.fillStyle = '#000'; sx.fillRect(60, 60, 180, 180);
    x.globalAlpha = .7; x.drawImage(sh, -150, -90, 1180, 1180); x.globalAlpha = 1;
    x.drawImage(I.panel, 0, 0, G.PS, G.PS);
    // 黑方块那一块再画一张 6 倍分辨率的（镜头贴近时用）
    HI = document.createElement('canvas'); HI.width = HI.height = HS * HRES;
    x = HI.getContext('2d'); x.setTransform(HRES, 0, 0, HRES, -HX0 * HRES, -HY0 * HRES);
    x.fillStyle = P.ink; x.fillRect(HX0, HY0, HS, HS);
    x.globalAlpha = .7; x.strokeStyle = P.gold; x.lineWidth = 2; x.strokeRect(HX0 + 14, HY0 + 14, HS - 28, HS - 28); x.globalAlpha = 1;
    x.fillStyle = goldGrad(x, HX0, HY0, HS, HS);
    x.fillRect(HX0 + 40, G.BASE, HS - 80, 6);
    x.fillRect(G.CX - 7, G.CROWN_Y, 14, G.BASE - G.CROWN_Y);
    for (const side of [-1, 1]) for (const [dx, rr, hh] of [[.335, 26, 122], [.435, 19, 82]]) {
      const tx = G.CX + side * HS * dx;
      x.fillStyle = goldGrad(x, tx - rr, G.BASE - hh - 2 * rr, 2 * rr, hh + 2 * rr);
      x.fillRect(tx - 3.5, G.BASE - hh, 7, hh);
      x.save(); x.beginPath(); x.arc(tx, G.BASE - hh - rr + 4, rr, 0, Math.PI * 2); x.clip();
      x.drawImage(E.LEAF[(side + 1) * 2 + (dx > .4 ? 1 : 0)], tx - rr, G.BASE - hh - 2 * rr + 4, 2 * rr, 2 * rr); x.restore();
    }
  }

  // 按屏幕横条把一张平铺在 z = 0 的贴图画上去（每条用一次仿射近似透视）
  function stripPass(ctx, c, tex, ox, oy, res, poly) {
    let yTop = 0;
    if (Math.abs(c.U[2]) > 1e-6) yTop = Math.max(0, 540 - FOC * c.F[2] / c.U[2] + 3);
    if (c.F[2] > -1e-6 && c.U[2] >= 0) return;
    const nearH = yTop + 260;
    for (let y0 = Math.floor(yTop); y0 < 1080;) {
      const hgt = y0 < nearH ? 2 : 5, ym = y0 + hgt / 2;
      const W0 = unproj(c, 960, ym); if (!W0) { y0 += hgt; continue; }
      const A = proj(c, W0), Bx = proj(c, [W0[0] + 1, W0[1], 0]), By = proj(c, [W0[0], W0[1] + 1, 0]);
      if (!A || !Bx || !By) { y0 += hgt; continue; }
      const a = [Bx[0] - A[0], Bx[1] - A[1]], b = [By[0] - A[0], By[1] - A[1]];
      ctx.save();
      ctx.beginPath(); ctx.rect(0, y0, 1920, hgt + .6); ctx.clip();
      if (poly) { ctx.beginPath(); poly.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.clip(); }
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.setTransform(a[0] / res, a[1] / res, b[0] / res, b[1] / res, A[0] + a[0] * (ox - W0[0]) + b[0] * (oy - W0[1]), A[1] + a[1] * (ox - W0[0]) + b[1] * (oy - W0[1]));
      ctx.drawImage(tex, 0, 0);
      ctx.restore();
      y0 += hgt;
    }
  }

  // —— 3D 金箔 ——————————————————————————————————————————————————————————
  const rot = (rx, ry, rz) => { const [cx, sx, cy, sy, cz, sz] = [Math.cos(rx), Math.sin(rx), Math.cos(ry), Math.sin(ry), Math.cos(rz), Math.sin(rz)];
    return p => { let [x, y, z] = p; [y, z] = [y * cx - z * sx, y * sx + z * cx]; [x, z] = [x * cy + z * sy, -x * sy + z * cy]; [x, y] = [x * cz - y * sz, x * sz + y * cz]; return [x, y, z]; }; };
  // 一张方形薄片：中心 C、边长 s、旋转 R；带光照、景深
  function sheet(ctx, c, k, C, s, R, L, o = {}) {
    const h = s / 2, p00 = proj(c, v.add(C, R([-h, -h, 0]))), p10 = proj(c, v.add(C, R([h, -h, 0]))), p01 = proj(c, v.add(C, R([-h, h, 0])));
    if (!p00 || !p10 || !p01) return;
    const n = R([0, 0, 1]), V = v.norm(v.sub(c.P, C));
    const nn = v.dot(n, V) < 0 ? v.mul(n, -1) : n;                    // 背面朝镜头时用背面的法线
    const H = v.norm(v.add(L, V));
    const dif = Math.max(0, v.dot(nn, L)), spec = Math.pow(Math.max(0, v.dot(nn, H)), o.shine || 70);
    const tex = E.LEAF[((k % 12) + 12) % 12], S = tex.width;
    ctx.save();
    ctx.setTransform((p10[0] - p00[0]) / S, (p10[1] - p00[1]) / S, (p01[0] - p00[0]) / S, (p01[1] - p00[1]) / S, p00[0], p00[1]);
    if (o.flat) { ctx.fillStyle = o.flat; ctx.fillRect(0, 0, S, S); ctx.restore(); return; }
    ctx.globalAlpha = o.alpha ?? 1;
    const b = o.blur || 0;
    if (b > .15) { const B = E.LEAF_BLUR[((k % 12) + 12) % 12][Math.min(2, Math.floor(b))]; ctx.drawImage(B.c, -B.pad, -B.pad); }
    else ctx.drawImage(tex, 0, 0);
    if (o.base !== false) {
      ctx.globalAlpha = (o.alpha ?? 1) * (1 - (.3 + .7 * dif)) * .72; ctx.fillStyle = '#1c1003'; ctx.fillRect(0, 0, S, S);
      const g = Math.min(.62, spec * .7 + (o.glint || 0) * .7);
      if (g > .01) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (o.alpha ?? 1) * g; ctx.fillStyle = '#E8B45A'; ctx.fillRect(0, 0, S, S); }
    }
    ctx.restore();
  }

  // 树冠里每一格：微微不平（各自歪一点点），所以转镜头时一格一格地亮
  const TS = SC.TS;
  const CT = SC.TILES.map(t => ({ t, tilt: rot((E.hash(t.i, t.j, 1) - .5) * .16, (E.hash(t.i, t.j, 2) - .5) * .16, 0) }));
  // 飘落：从桌面上方三四百个单位翻滚着落下
  const FL = SC.LEAVES.map((l, n) => { const r = E.rng(n * 41 + 9); return { l, x0: l.x1 + (r() - .5) * 160, y0: l.y1 - 40 - r() * 140, z0: 300 + r() * 220,
    ax: 1.6 + r() * 1.4, ay: 1.2 + r() * 1.2, ph: r() * 6.28, rz0: (r() - .5) * 2.4, sw: 30 + r() * 40 }; });
  function flyPose(fl, f) {
    const l = fl.l, t = (f - (l.land - l.dur)) / l.dur;
    if (t < 0 || t >= 1) return null;
    const fall = E.ease.io(t) * .35 + t * .65, fade = 1 - t;
    const x = E.lerp(fl.x0, l.x1, E.ease.o3(t)) + Math.sin(t * 8 + fl.ph) * fl.sw * fade;
    const y = E.lerp(fl.y0, l.y1, E.ease.o3(t)) + Math.cos(t * 6 + fl.ph) * fl.sw * .5 * fade;
    const z = Math.max(.5, fl.z0 * (1 - fall));
    const R = rot(Math.sin(t * 9 + fl.ph) * fl.ax * fade, Math.cos(t * 7 + fl.ph * 1.3) * fl.ay * fade, fl.rz0 * (1 - E.ease.o3(t)));
    return { C: [x, y, z], R };
  }

  // —— 字：金，原来是方的。—————————————————————————————————————————————————————
  const BIG = '金，原来是方的。', SMALL = '克里姆特的金箔，一片 8 × 8 厘米，一片一片贴上去。', TAG = 'BLATTGOLD  ·  8 × 8 CM';
  const TT0 = 150, TT1 = 338;
  const NOTEXT = new URLSearchParams(location.search).has('notext');   // ?notext：这一段不放字
  if (!NOTEXT) { [...BIG].forEach((ch, i) => { if (!/[，。]/.test(ch)) SC.ev(TT0 + 10 + i * 4, 'type', .6); }); SC.ev(TT0 + 48, 'swish', .35); }
  function type(ctx, f) {
    if (NOTEXT || f < TT0 - 20 || f > TT1 + 2) return;
    const out = E.clamp((TT1 - f) / 14), inn = E.sm(E.prog(f, TT0 - 20, TT0 + 10));
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.textBaseline = 'alphabetic';
    // 深色渐变垫底（淡入淡出），让字落在暗处
    const g = ctx.createLinearGradient(0, 600, 0, 1080); g.addColorStop(0, 'rgba(8,7,6,0)'); g.addColorStop(1, `rgba(8,7,6,${.8 * out * inn})`);
    ctx.fillStyle = g; ctx.fillRect(0, 600, 1920, 480);
    if (f >= TT0) {
      const tag = E.ease.o5(E.prog(f, TT0, TT0 + 26));
      ctx.globalAlpha = out; ctx.fillStyle = P.gold; ctx.fillRect(120, 790, 140 * tag, 2);
      ctx.font = '500 22px Jost'; ctx.letterSpacing = `${5 + 6 * (1 - tag)}px`; ctx.globalAlpha = tag * out * .9;
      ctx.fillText(TAG, 120, 832); ctx.letterSpacing = '0px';
      // 大字：一个字一个字从虚到实
      ctx.font = '700 104px Song'; let x = 112;
      [...BIG].forEach((ch, i) => {
        const t = E.clamp((f - (TT0 + 10 + i * 4)) / 16), e = E.ease.o3(t), w = ctx.measureText(ch).width + (/[，。]/.test(ch) ? -10 : 4);
        if (t > 0) { ctx.globalAlpha = e * out; ctx.filter = t < 1 ? `blur(${(1 - e) * 10}px)` : 'none';
          ctx.fillStyle = i >= 4 && i <= 6 ? P.goldHi : P.paper; ctx.fillText(ch, x + (1 - e) * 22, 948); ctx.filter = 'none'; }
        x += w;
      });
      // 小字：整行滑出来
      const s2 = E.ease.o5(E.prog(f, TT0 + 48, TT0 + 72));
      ctx.font = '500 32px Song'; ctx.letterSpacing = '2px'; ctx.globalAlpha = s2 * out * .82; ctx.fillStyle = P.bone;
      ctx.fillText(SMALL, 120 - (1 - s2) * 30, 1012); ctx.letterSpacing = '0px';
    }
    ctx.restore();
  }

  function draw(ctx, f) {
    const c = camera(f), L = light(f);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0b0a09'; ctx.fillRect(0, 0, 1920, 1080);
    stripPass(ctx, c, TEX, TX0, TY0, TRES);
    // 镜头贴近时，黑方块用高分辨率的贴图再画一遍
    if (c.k.z > 1.25) {
      const corners = [[HX0, HY0], [HX0 + HS, HY0], [HX0 + HS, HY0 + HS], [HX0, HY0 + HS]].map(p => proj(c, [p[0], p[1], 0]));
      if (corners.every(Boolean)) stripPass(ctx, c, HI, HX0, HY0, HRES, corners);
    }
    // 树冠：底漆 + 一格格金箔
    const circ = Array.from({ length: 72 }, (_, i) => proj(c, [SC.CX + Math.cos(i / 72 * 6.283) * SC.R, SC.CY + Math.sin(i / 72 * 6.283) * SC.R, 0]));
    if (circ.every(Boolean)) {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.beginPath(); circ.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
      ctx.fillStyle = P.bole; ctx.fill(); ctx.clip();
      for (const { t, tilt } of CT) {
        const l = t.leaf; if (l && f < l.land) continue;
        const age = l ? f - l.land : 999;
        const z = l && age < 10 ? Math.max(0, 3 * Math.exp(-age / 2.5) * Math.cos(age * 1.2)) : 0;
        sheet(ctx, c, 0, [t.x, t.y, 0], TS * 1.07, tilt, L, { flat: '#3a2306' });      // 先垫一层暗的，箔片之间露出缝
        sheet(ctx, c, t.k, [t.x, t.y, z + .02], TS - 1.1, tilt, L, { glint: l ? Math.exp(-age / 7) * .9 : 0 });
      }
      ctx.restore();
    }
    // 空中的金箔：先画影子（顺着光投在桌面上），再从远到近画箔片
    const fly = FL.map(fl => ({ fl, q: flyPose(fl, f) })).filter(o => o.q);
    const focus = c.D;
    for (const { q } of fly) {
      const h = q.C[2], s = TS * (1 + h / 300);
      const S0 = v.sub(q.C, v.mul(L, h / L[2]));
      const a = proj(c, [S0[0] - s / 2, S0[1] - s / 2, 0]), b = proj(c, [S0[0] + s / 2, S0[1] - s / 2, 0]), d = proj(c, [S0[0] - s / 2, S0[1] + s / 2, 0]);
      if (!a || !b || !d) continue;
      ctx.save(); ctx.setTransform((b[0] - a[0]) / 80, (b[1] - a[1]) / 80, (d[0] - a[0]) / 80, (d[1] - a[1]) / 80, a[0], a[1]);
      ctx.globalAlpha = .5 * Math.exp(-h / 220); ctx.drawImage(SC.SHADOW, -40, -40, 160, 160); ctx.restore();
    }
    fly.map(o => ({ ...o, zc: v.dot(v.sub(o.q.C, c.P), c.F) })).sort((a, b) => b.zc - a.zc).forEach(({ fl, q, zc }) => {
      const blur = E.clamp(Math.abs(zc - focus) / focus * 3.2 - .25, 0, 2.6);
      sheet(ctx, c, fl.l.k, q.C, TS, q.R, L, { blur });
    });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // 远处淡进黑暗
    const fog = E.clamp((c.k.pitch - .2) / .6);
    if (fog > 0) { const g = ctx.createLinearGradient(0, 0, 0, 700); g.addColorStop(0, `rgba(8,7,6,${.94 * fog})`); g.addColorStop(.55, `rgba(8,7,6,${.45 * fog})`); g.addColorStop(1, 'rgba(8,7,6,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 700); }
    SC.ambient(ctx, f, 1 - E.prog(f, 60, 140) * .5);
    SC.frameLines(ctx, 1 - E.prog(f, 26, 80));
    type(ctx, f);
  }
  return { init, draw };
})();
