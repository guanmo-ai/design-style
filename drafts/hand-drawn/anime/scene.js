// 日式手绘动画 · 背景美术：夏天、积雨云、电线杆、风吹过稻田、飞走的草帽。
// 每一层画在自己的透明画布上（和动画摄影台一样分层），封面把它们叠起来，分层图把它们拉开。
const ANIME = (() => {
  const { rng, makeNoise, fbm, clamp, lerp, smooth, mix, css, ramp, canvas } = HD;
  const W = 1920, H = 1080, HOR = 770, VPX = 1000, F = 900, CAMH = 1.6;
  const proj = (X, Y, Z) => [VPX + X * F / Z, HOR - (Y - CAMH) * F / Z];
  const SUN = [-0.62, -0.78]; // 光从左上来

  function layer(S) { const c = canvas(W * S, H * S), g = c.getContext('2d'); g.scale(S, S); g.lineCap = g.lineJoin = 'round'; return [c, g]; }

  // ───────── 天 ─────────
  function sky(g, S) {
    const n = makeNoise(11), im = g.getImageData(0, 0, W * S, H * S), d = im.data, w = W * S, h = H * S;
    const stops = [[0, '#1648a6'], [.28, '#2a6cc9'], [.55, '#5ea3e0'], [.8, '#a9d9f0'], [.93, '#d6f0f5'], [1, '#e9f6f2']];
    for (let y = 0; y < h; y++) {
      const t = (y / S) / HOR;
      for (let x = 0; x < w; x++) {
        const X = x / S, Y = y / S;
        // 画笔横刷留下的深浅（低频）+ 一点水彩的颗粒
        const brush = fbm(n, X * .0016, Y * .006, 4) * .045 + n(X * .02, Y * .05) * .008;
        const sunGlow = Math.exp(-(((X + 200) ** 2) + ((Y + 160) ** 2)) / (2 * 720 ** 2));
        const c = ramp(stops, t + brush * .6 - sunGlow * .12);
        const k = (y * w + x) * 4;
        d[k] = c[0] + sunGlow * 40; d[k + 1] = c[1] + sunGlow * 34; d[k + 2] = c[2] + sunGlow * 18; d[k + 3] = 255;
      }
    }
    g.putImageData(im, 0, 0);
    // 高空的卷云：几笔干刷
    const r = rng(5);
    g.save();
    g.filter = `blur(${2.5 * S}px)`;
    for (let i = 0; i < 18; i++) {
      const x0 = 200 + r() * 800, y0 = 90 + r() * 150 + i * 4, L = 220 + r() * 380, a = -.12 + r() * .06;
      g.strokeStyle = `rgba(255,255,255,${.06 + r() * .1})`; g.lineWidth = 4 + r() * 10;
      g.beginPath(); g.moveTo(x0, y0);
      g.bezierCurveTo(x0 + L * .3, y0 + L * a - 10 * r(), x0 + L * .7, y0 + L * a * 1.4, x0 + L, y0 + L * a * 2 + 8);
      g.stroke();
    }
    g.restore();
  }

  // ───────── 云：一堆球（大球上长中球，中球上长小包），逐像素找最前面那颗球 → 法线 → 分成亮 / 影两色 ─────────
  function cloudSpheres(towers, seed) {
    const r = rng(seed), out = [];
    const L3 = [-.5, -.72, .48];
    for (const T of towers) {
      const { x, base, top, hw, z0 = 0 } = T, ht = base - top;
      // 第 0 层：骨架大球，一摞往上收
      const big = [];
      for (let y = base - hw * .35; y > top + hw * .25; y -= hw * (.32 + r() * .12)) {
        const h = (base - y) / ht, wd = hw * (1 - h * .45);
        const n = Math.max(1, Math.round(wd / (hw * .42)));
        for (let i = 0; i < n; i++) {
          const u = n === 1 ? 0 : (i / (n - 1) - .5) * 2;
          big.push({ x: x + u * wd * .62 + (r() - .5) * hw * .15 + (T.lean || 0) * (base - y), y, z: z0 + (r() - .5) * 40, r: wd * (.48 + r() * .14) });
        }
      }
      big.push({ x: x + (T.lean || 0) * ht * .8, y: top + hw * .35, z: z0, r: hw * .42 });
      // 第 1、2 层：从球面上往外长，越往上、越朝光越多
      const grow = (P, n, rmin, rmax, depth) => {
        for (const p of P) {
          const kids = [];
          for (let k = 0; k < n; k++) {
            let th = r() * Math.PI * 2, ph = Math.PI / 2 - r() * .75;
            let dx = Math.sin(ph) * Math.cos(th), dy = Math.sin(ph) * Math.sin(th), dz = Math.cos(ph);
            dy = dy * .8 - .35; // 偏向上长
            const m = Math.hypot(dx, dy, dz); dx /= m; dy /= m; dz /= m;
            const rr = p.r * (rmin + r() * (rmax - rmin));
            const c = { x: p.x + dx * p.r * .86, y: p.y + dy * p.r * .86, z: p.z + dz * p.r * .86, r: rr };
            if (c.y + c.r * .2 > base) continue;
            kids.push(c);
          }
          out.push(...kids);
          if (depth > 0) grow(kids, Math.round(n * .55), rmin, rmax, depth - 1);
        }
      };
      out.push(...big);
      grow(big, 9, .3, .48, 1);
    }
    return out;
  }
  function drawCloud(g, S, sph, o) {
    const { base, top, x0 = 0, x1 = W, y0 = 0, shadowTop = '#a9b6e4', shadowBot = '#7380bf', haze = '#cfe9f3', hazeH = 240, nseed = 3,
      lit0 = '#e4eaf8', lit1 = '#ffffff', warm = '#fff3dc', rimC = '#c9dcf6', bandC = '#c8c4e4', light = [-.62, -.68, .34], Wmax = W } = o;
    const n = makeNoise(nseed);
    const bx0 = Math.max(0, Math.floor(x0 * S)), bx1 = Math.min(Wmax * S, Math.ceil(x1 * S)), by0 = Math.max(0, Math.floor(y0 * S)), by1 = Math.ceil(base * S);
    const bw = bx1 - bx0, bh = by1 - by0;
    const Z = new Float32Array(bw * bh).fill(-1e9), Z2 = new Float32Array(bw * bh).fill(-1e9), ID = new Int32Array(bw * bh).fill(-1);
    sph.forEach((p, id) => {
      const cx = p.x * S - bx0, cy = p.y * S - by0, R = p.r * S;
      const xa = Math.max(0, Math.floor(cx - R)), xb = Math.min(bw - 1, Math.ceil(cx + R)), ya = Math.max(0, Math.floor(cy - R)), yb = Math.min(bh - 1, Math.ceil(cy + R));
      for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) {
        const dx = x - cx, dy = y - cy, q = R * R - dx * dx - dy * dy;
        if (q <= 0) continue;
        const z = p.z * S + Math.sqrt(q), k = y * bw + x;
        if (z > Z[k]) { Z2[k] = Z[k]; Z[k] = z; ID[k] = id; } else if (z > Z2[k]) Z2[k] = z;
      }
    });
    // 高度场：最前面那颗球的 z；空白处给 0。模糊后求梯度 = 大形体的法线
    const Hf = new Float32Array(bw * bh);
    for (let i = 0; i < Hf.length; i++) Hf[i] = ID[i] < 0 ? 0 : Z[i];
    const blur = (A, rad) => {
      const T = new Float32Array(A.length), cl = (v, m) => v < 0 ? 0 : v >= m ? m - 1 : v, inv = 1 / (2 * rad + 1);
      for (let y = 0; y < bh; y++) { const o = y * bw; let acc = 0; for (let i = -rad; i <= rad; i++) acc += A[o + cl(i, bw)]; for (let x = 0; x < bw; x++) { T[o + x] = acc * inv; acc += A[o + cl(x + rad + 1, bw)] - A[o + cl(x - rad, bw)]; } }
      for (let x = 0; x < bw; x++) { let acc = 0; for (let i = -rad; i <= rad; i++) acc += T[cl(i, bh) * bw + x]; for (let y = 0; y < bh; y++) { A[y * bw + x] = acc * inv; acc += T[cl(y + rad + 1, bh) * bw + x] - T[cl(y - rad, bh) * bw + x]; } }
    };
    const Hb = Hf.slice(), Hs = Hf.slice();
    const R1 = Math.round(24 * S), R2 = Math.round(7 * S);
    blur(Hb, R1); blur(Hb, R1); blur(Hs, R2); blur(Hs, R2);
    const im = g.createImageData(bw, bh), d = im.data;
    const L = [...light], Lm = Math.hypot(...L); L[0] /= Lm; L[1] /= Lm; L[2] /= Lm;
    for (let y = 1; y < bh - 1; y++) for (let x = 1; x < bw - 1; x++) {
      const k = y * bw + x, id = ID[k]; if (id < 0) continue;
      const p = sph[id], X = (x + bx0) / S, Y = (y + by0) / S;
      // 大形体法线（模糊高度场）+ 一点小包的起伏
      let gx = (Hb[k + 1] - Hb[k - 1]) * .5 / S, gy = (Hb[k + bw] - Hb[k - bw]) * .5 / S;
      gx += (Hs[k + 1] - Hs[k - 1]) * .5 / S * 1.1; gy += (Hs[k + bw] - Hs[k - bw]) * .5 / S * 1.1;
      let nx = -gx * 2.4, ny = -gy * 2.4, nz = .8; const m = Math.hypot(nx, ny, nz); nx /= m; ny /= m; nz /= m;
      let ndl = nx * L[0] + ny * L[1] + nz * L[2];
      const h = clamp((base - Y) / (base - top));
      ndl += fbm(n, X * .03, Y * .03, 2) * .02 - Math.pow(1 - h, 1.6) * .4 + .05;
      const lit = smooth(.15, .23, ndl);
      const sh = mix(shadowBot, shadowTop, Math.pow(h, .8));
      const li = mix(mix(lit0, lit1, smooth(.21, .6, ndl)), warm, (1 - h) * .3 + .1);
      let c = mix(sh, li, lit);
      // 影里背光的轮廓：一圈天光；亮面和影之间：一道偏暖的二影
      const rim = Math.pow(1 - nz, 2.2) * (1 - lit) * .55;
      c = mix(c, rimC, rim);
      const band = smooth(.1, .16, ndl) * (1 - lit);
      c = mix(c, bandC, band * .55);
      const edge = clamp((Z[k] / S - p.z) / 1.2);
      c = mix(c, haze, smooth(base - hazeH, base, Y) * .9);
      const j = k * 4; d[j] = c[0]; d[j + 1] = c[1]; d[j + 2] = c[2]; d[j + 3] = 255 * Math.min(1, edge);
    }
    const tmp = canvas(bw, bh); tmp.getContext('2d').putImageData(im, 0, 0);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(tmp, bx0, by0); g.restore();
  }
  function clouds(g, S) {
    const towers = [
      { x: 1420, base: 770, top: 170, hw: 330, lean: .03, z0: 0 },
      { x: 1110, base: 770, top: 360, hw: 250, lean: -.05, z0: 120 },
      { x: 1720, base: 770, top: 260, hw: 260, lean: .06, z0: 60 },
      { x: 1960, base: 770, top: 420, hw: 240, z0: 160 },
      { x: 930, base: 770, top: 560, hw: 170, z0: 220 },
    ];
    drawCloud(g, S, cloudSpheres(towers, 12), { base: 770, top: 170, x0: 560, y0: 0 });
    drawCloud(g, S, cloudSpheres([{ x: 330, base: 742, top: 600, hw: 150, z0: 0 }, { x: 520, base: 742, top: 650, hw: 100, z0: 50 }], 4), { base: 742, top: 600, x0: 80, x1: 720, y0: 480, shadowTop: '#bcc7e6', shadowBot: '#98a5d0', hazeH: 110, nseed: 8 });
  }

  // ───────── 远山、林子、小村 ─────────
  function mountains(g, S) {
    const n = makeNoise(21), r = rng(4);
    // 最远的山：淡蓝，几乎化进天里
    g.fillStyle = '#a9c9e2'; g.beginPath(); g.moveTo(0, HOR + 10);
    for (let x = 0; x <= W; x += 4) g.lineTo(x, 718 + fbm(n, x * .0025, 1, 4) * 42 + (x < 700 ? (700 - x) * .02 : 0));
    g.lineTo(W, HOR + 10); g.fill();
    // 近一点的山：蓝绿，上沿是一棵棵树冠
    const ridge = x => 742 + fbm(n, x * .004 + 9, 3, 4) * 26 + Math.max(0, (x - 1300) * .012);
    const grd = g.createLinearGradient(0, 720, 0, HOR);
    grd.addColorStop(0, '#6f9eac'); grd.addColorStop(1, '#7fb0b2');
    g.fillStyle = grd; g.beginPath(); g.moveTo(0, HOR + 10);
    for (let x = 0; x <= W; x += 3) g.lineTo(x, ridge(x));
    g.lineTo(W, HOR + 10); g.fill();
    for (let x = 0; x < W; x += 5 + r() * 6) {
      const y = ridge(x), rr = 4 + r() * 6;
      g.fillStyle = css(mix('#5f909e', '#6f9fa8', r())); g.beginPath(); g.arc(x, y + rr * .4, rr, 0, 7); g.fill();
      g.fillStyle = 'rgba(190,225,215,.35)'; g.beginPath(); g.arc(x - rr * .3, y + rr * .1, rr * .55, 0, 7); g.fill();
    }
    // 镇守之森：地平线上一团深绿的树
    const grove = (cx, cy, wd, ht, seed) => {
      const q = rng(seed);
      for (let i = 0; i < 90; i++) {
        const u = q() * 2 - 1, hh = (1 - u * u) * ht * (.6 + q() * .5), x = cx + u * wd, y = cy - q() * hh, rr = 7 + q() * 11;
        g.fillStyle = css(mix('#2f6a4f', '#3e7d57', q())); g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill();
      }
      for (let i = 0; i < 60; i++) {
        const u = q() * 2 - 1, hh = (1 - u * u) * ht * .9, x = cx + u * wd * .95, y = cy - hh * (.4 + q() * .6), rr = 4 + q() * 7;
        g.fillStyle = `rgba(150,200,120,${.35 + q() * .35})`; g.beginPath(); g.arc(x - rr * .4, y - rr * .4, rr * .7, 0, 7); g.fill();
      }
    };
    grove(1560, 778, 120, 46, 2); grove(1730, 776, 70, 30, 6); grove(560, 778, 90, 28, 8);
    // 几间瓦房：白墙、蓝灰的瓦，屋脊上一道亮
    const house = (x, y, w, h, flip) => {
      g.fillStyle = '#e9ecea'; g.fillRect(x, y - h, w, h);
      g.fillStyle = '#b9c3c4'; g.fillRect(x + (flip ? 0 : w * .62), y - h, w * .38, h);
      g.fillStyle = '#4b5d73'; g.beginPath(); g.moveTo(x - 5, y - h + 1); g.lineTo(x + w * .2, y - h - h * .7); g.lineTo(x + w * .8, y - h - h * .7); g.lineTo(x + w + 5, y - h + 1); g.fill();
      g.strokeStyle = '#9fb3c6'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x + w * .2, y - h - h * .7); g.lineTo(x + w * .8, y - h - h * .7); g.stroke();
      g.fillStyle = '#3a4752'; g.fillRect(x + w * .22, y - h * .55, w * .12, h * .4);
    };
    house(1468, 784, 34, 12); house(1508, 786, 26, 10, 1); house(1630, 782, 30, 11); house(1452, 790, 22, 8, 1);
  }

  // ───────── 稻田、小路、风 ─────────
  function field(g, S) {
    const n = makeNoise(31), n2 = makeNoise(37), w = W * S, h = H * S;
    const im = g.getImageData(0, 0, w, h), d = im.data;
    for (let y = Math.floor((HOR - 2) * S); y < h; y++) {
      const Y = y / S, z = CAMH * F / Math.max(.5, Y - HOR);
      for (let x = 0; x < w; x++) {
        const X = x / S, wx = (X - VPX) * z / F;
        // 风：一块块偏黄的亮从左往右滑过稻田（在地面坐标里拉长）
        const wind = smooth(.05, .45, fbm(n, wx * .05 - z * .004, z * .045, 4) + .05 * n2(X * .01, Y * .01));
        const near = clamp((Y - HOR) / (H - HOR));
        const base = mix(mix('#9fcd78', '#5aa646', Math.pow(near, .55)), '#3f8a3b', Math.pow(near, 2) * .6);
        let c = mix(base, mix('#d8ee8a', '#b8de6a', near), wind * .62);
        const tex = n2(X * .3, Y * .9) * .04 * near;
        const haze = Math.exp(-(Y - HOR) / 22) * .55;
        c = mix(c, '#cfe7e6', haze);
        const k = (y * w + x) * 4, a = clamp((Y - HOR + 2) / 2);
        d[k] = c[0] * (1 + tex); d[k + 1] = c[1] * (1 + tex); d[k + 2] = c[2] * (1 + tex); d[k + 3] = 255 * a;
      }
    }
    g.putImageData(im, 0, 0);
    // 田埂：等深的横线 + 往灭点收的竖线
    g.save();
    for (let i = 0; i < 18; i++) {
      const z = 5 * Math.pow(1.28, i), y = HOR + CAMH * F / z, wd = Math.max(.6, 26 / z);
      g.strokeStyle = `rgba(214,214,150,${.55 - i * .02})`; g.lineWidth = wd;
      g.beginPath(); g.moveTo(0, y + (W / 2 - VPX) * .0); g.lineTo(W, y); g.stroke();
      g.strokeStyle = `rgba(60,110,50,${.25})`; g.lineWidth = wd * .5; g.beginPath(); g.moveTo(0, y + wd * .8); g.lineTo(W, y + wd * .8); g.stroke();
    }
    for (let X = -60; X <= 60; X += 7.5) {
      if (X > -6.5 && X < -1) continue;
      const [x1, y1] = proj(X, 0, 4.2), [x2, y2] = proj(X, 0, 400);
      g.strokeStyle = 'rgba(214,214,150,.45)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    }
    g.restore();
    // 一丛丛稻子：越近越长、越分得开
    const r = rng(17);
    for (let i = 0; i < 52000; i++) {
      const yy = HOR + Math.pow(r(), 1.6) * (H - HOR + 30), near = (yy - HOR) / (H - HOR);
      const x = r() * W, L = 2 + near * near * 34 * (.6 + r() * .6);
      const z = CAMH * F / Math.max(.5, yy - HOR), wx = (x - VPX) * z / F;
      if (wx > -5.2 && wx < -1.4 && z < 300) continue; // 小路上不长
      const wind = fbm(n, wx * .05 - z * .004, z * .045, 3);
      const lean = 4 + wind * 10 + near * 6;
      const lit = r() < .5;
      g.strokeStyle = lit ? css(mix('#cbe68a', '#9fd06a', r()), .55 + near * .3) : css(mix('#3f8a3b', '#2f6f34', r()), .45 + near * .4);
      g.lineWidth = .6 + near * 2.2;
      g.beginPath(); g.moveTo(x, yy); g.quadraticCurveTo(x + lean * .3, yy - L * .6, x + lean * near, yy - L); g.stroke();
    }
    // 小路
    const road = [];
    for (let i = 0; i <= 60; i++) { const z = 4.3 * Math.pow(1.11, i); road.push([z, -3.2 + Math.sin(z * .05) * 1.6]); }
    g.beginPath();
    road.forEach(([z, c], i) => { const [x, y] = proj(c - 1.5, 0, z); i ? g.lineTo(x, y) : g.moveTo(x, y); });
    road.slice().reverse().forEach(([z, c]) => { const [x, y] = proj(c + 1.5, 0, z); g.lineTo(x, y); });
    const rgd = g.createLinearGradient(0, HOR, 0, H);
    rgd.addColorStop(0, '#e4ddc6'); rgd.addColorStop(.4, '#ddd0ae'); rgd.addColorStop(1, '#cdbb92');
    g.fillStyle = rgd; g.fill();
    // 车辙 + 中间一条草
    for (const [o, col, wd] of [[-.8, 'rgba(160,135,95,.35)', 1], [.8, 'rgba(160,135,95,.35)', 1], [0, 'rgba(110,160,70,.7)', .45]]) {
      g.beginPath(); road.forEach(([z, c], i) => { const [x, y] = proj(c + o, 0, z); i ? g.lineTo(x, y) : g.moveTo(x, y); });
      g.strokeStyle = col; g.lineWidth = 1; g.stroke();
      
    }
    // 路边的草压过路沿
    for (let i = 0; i < 2600; i++) {
      const j = Math.floor(Math.pow(r(), 1.5) * 55), [z, c] = road[j], side = r() < .5 ? -1 : 1;
      const [x, y] = proj(c + side * (1.5 + (r() - .3) * .3), 0, z), s = F / z;
      g.strokeStyle = r() < .5 ? 'rgba(80,140,60,.8)' : 'rgba(170,210,110,.8)'; g.lineWidth = .4 + s * .012;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .3) * s * .08, y - s * (.05 + r() * .12)); g.stroke();
    }
  }

  // ───────── 电线杆和电线（真的按透视投出来，线有下垂） ─────────
  const POLES = [11, 23, 34, 46, 58, 70, 82, 94, 106].map(z => ({ X: -8.3, z }));
  function poles(g, S) {
    const PH = 9.6, arms = [PH - .5, PH - 1.25];
    const wiresOf = p => arms.flatMap((ay, ai) => (ai ? [-.55, .55] : [-.85, 0, .85]).map(dx => [p.X + dx, ay - (ai ? .05 : 0) + .12, p.z]));
    // 电线：先画（被杆子压住）
    const all = [{ X: -8.3, z: 1.2 }, ...POLES];
    for (let i = 0; i < all.length - 1; i++) {
      const A = wiresOf(all[i]), B = wiresOf(all[i + 1]);
      A.forEach((a, k) => {
        const b = B[k], sag = .55 + k * .04;
        g.beginPath();
        for (let s = 0; s <= 1.0001; s += .02) {
          const X = lerp(a[0], b[0], s), Y = lerp(a[1], b[1], s) - sag * 4 * s * (1 - s), Z = lerp(a[2], b[2], s);
          const [x, y] = proj(X, Y, Z); s ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        const near = 1 / ((a[2] + b[2]) / 2);
        g.strokeStyle = `rgba(38,44,58,${clamp(.5 + near * 3)})`; g.lineWidth = clamp(1.6 * near * 9, .6, 3.2); g.stroke();
      });
    }
    // 杆子
    for (const p of POLES.slice().reverse()) {
      const s = F / p.z, [xb, yb] = proj(p.X, 0, p.z), [, yt] = proj(p.X, PH, p.z), wd = .26 * s;
      const pg = g.createLinearGradient(xb - wd / 2, 0, xb + wd / 2, 0);
      pg.addColorStop(0, '#8e877c'); pg.addColorStop(.22, '#6d655c'); pg.addColorStop(.3, '#4a4642'); pg.addColorStop(1, '#2f2e33');
      g.fillStyle = pg; g.beginPath(); g.moveTo(xb - wd / 2, yb); g.lineTo(xb - wd * .38, yt); g.lineTo(xb + wd * .38, yt); g.lineTo(xb + wd / 2, yb); g.fill();
      // 横担 + 瓷瓶
      arms.forEach((ay, ai) => {
        const [, ya] = proj(p.X, ay, p.z), half = (ai ? .75 : 1.05) * s, th = .11 * s;
        g.fillStyle = '#34333a'; g.fillRect(xb - half, ya, half * 2, th);
        g.fillStyle = 'rgba(160,150,140,.8)'; g.fillRect(xb - half, ya, half * 2, th * .28);
        (ai ? [-.55, .55] : [-.85, 0, .85]).forEach(dx => {
          const xi = xb + dx * s, r0 = .07 * s;
          g.fillStyle = '#d9dde3'; g.beginPath(); g.ellipse(xi, ya - r0 * .7, r0 * .8, r0, 0, 0, 7); g.fill();
          g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(xi - r0 * .3, ya - r0 * .9, r0 * .25, r0 * .5, 0, 0, 7); g.fill();
          g.fillStyle = '#8c95a3'; g.beginPath(); g.ellipse(xi + r0 * .35, ya - r0 * .5, r0 * .3, r0 * .55, 0, 0, 7); g.fill();
        });
      });
      // 最近那根：一个变压器桶 + 脚钉
      if (p.z < 11) {
        const [, yv] = proj(p.X, PH - 2.6, p.z), cw = .5 * s, ch = .78 * s, cx = xb + wd * .5 + cw * .55;
        const tg = g.createLinearGradient(cx - cw / 2, 0, cx + cw / 2, 0);
        tg.addColorStop(0, '#c8ccd2'); tg.addColorStop(.25, '#9ca3ad'); tg.addColorStop(1, '#4e5560');
        g.fillStyle = tg; g.fillRect(cx - cw / 2, yv, cw, ch);
        g.fillStyle = '#6a717c'; g.beginPath(); g.ellipse(cx, yv, cw / 2, cw * .14, 0, 0, 7); g.fill();
        g.fillStyle = '#e8ebef'; g.fillRect(cx - cw / 2, yv + ch * .3, cw * .12, ch * .5);
        g.strokeStyle = '#2f2e33'; g.lineWidth = .05 * s; g.beginPath(); g.moveTo(xb, yv + ch * .2); g.lineTo(cx - cw / 2, yv + ch * .2); g.moveTo(xb, yv + ch * .8); g.lineTo(cx - cw / 2, yv + ch * .8); g.stroke();
        for (let k = 0; k < 9; k++) { const [, yk] = proj(p.X, 2 + k * .62, p.z), sd = k % 2 ? 1 : -1; g.fillStyle = '#2c2b30'; g.fillRect(xb + sd * wd * .45 - (sd < 0 ? .16 * s : 0), yk, .16 * s, .035 * s); }
        // 黄黑的护套
        const [, y1] = proj(p.X, 1.9, p.z), [, y0] = proj(p.X, .2, p.z);
        g.save(); g.beginPath(); g.rect(xb - wd * .52, y1, wd * 1.04, y0 - y1); g.clip();
        g.fillStyle = '#e8c33a'; g.fillRect(xb - wd, y1, wd * 2, y0 - y1);
        g.fillStyle = '#25242a'; for (let yy = y1 - wd * 2; yy < y0; yy += wd * .9) { g.beginPath(); g.moveTo(xb - wd, yy); g.lineTo(xb + wd, yy - wd * .6); g.lineTo(xb + wd, yy - wd * .15); g.lineTo(xb - wd, yy + wd * .45); g.fill(); }
        const sh = g.createLinearGradient(xb - wd / 2, 0, xb + wd / 2, 0); sh.addColorStop(0, 'rgba(255,255,255,.25)'); sh.addColorStop(.3, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.45)');
        g.fillStyle = sh; g.fillRect(xb - wd, y1, wd * 2, y0 - y1); g.restore();
      }
    }
  }

  // ───────── 前景：狗尾草和长草（压暗，压住画面下沿） ─────────
  function fg(g, S) {
    const r = rng(41);
    const blade = (x, y, L, bend, wd, col, hi) => {
      const tx = x + bend, ty = y - L, cx = x + bend * .2, cy = y - L * .55;
      g.fillStyle = col; g.beginPath(); g.moveTo(x - wd, y); g.quadraticCurveTo(cx - wd * .6, cy, tx, ty); g.quadraticCurveTo(cx + wd * .6, cy, x + wd, y); g.fill();
      if (hi) { g.strokeStyle = hi; g.lineWidth = Math.max(1, wd * .35); g.beginPath(); g.moveTo(x - wd * .7, y - L * .15); g.quadraticCurveTo(cx - wd * .45, cy, tx, ty); g.stroke(); }
    };
    // 底下一层压暗的草，左右两侧更高
    const shade = g.createLinearGradient(0, 860, 0, H);
    shade.addColorStop(0, 'rgba(24,60,36,0)'); shade.addColorStop(.55, 'rgba(24,60,36,.78)'); shade.addColorStop(1, 'rgba(16,44,28,.96)');
    g.fillStyle = shade; g.fillRect(0, 860, W, 230);
    for (let i = 0; i < 900; i++) {
      const x = r() * W, side = Math.min(x, W - x) / (W / 2), L = (60 + r() * 140) * (1.6 - side * .9) + (x < 760 ? 70 : 0);
      blade(x, H + 10, L, 20 + r() * 60, 3 + r() * 6, css(mix('#163d27', '#26593a', r())), r() < .35 ? 'rgba(120,180,90,.55)' : null);
    }
    // 狗尾草：逆光，毛茸茸的穗子边上一圈亮
    const fox = (x, y, L, bend, sz) => {
      const pts = []; for (let s = 0; s <= 1; s += .02) pts.push([x + bend * s * s, y - L * s]);
      g.strokeStyle = '#3d6b35'; g.lineWidth = 2.2; g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.stroke();
      g.strokeStyle = 'rgba(200,230,140,.6)'; g.lineWidth = .8; g.stroke();
      const top = pts.slice(-18);
      for (let k = 0; k < 520; k++) {
        const j = Math.floor(r() * top.length), [a, b] = top[j], u = j / top.length;
        const ang = -Math.PI / 2 + (r() - .5) * 2.6 + bend * .002, len = sz * (.5 + r() * .7) * Math.sin(Math.PI * (.12 + u * .8));
        const ex = a + Math.cos(ang) * len, ey = b + Math.sin(ang) * len * .9;
        g.strokeStyle = r() < .55 ? `rgba(240,248,200,${.5 + r() * .4})` : `rgba(122,150,70,${.6 + r() * .3})`; g.lineWidth = .7 + r() * .6;
        g.beginPath(); g.moveTo(a, b); g.lineTo(ex, ey); g.stroke();
      }
      const [a, b] = top[Math.floor(top.length * .55)];
      const glow = g.createRadialGradient(a, b, 0, a, b, sz * 2.2); glow.addColorStop(0, 'rgba(255,250,210,.28)'); glow.addColorStop(1, 'rgba(255,250,210,0)');
      g.fillStyle = glow; g.beginPath(); g.arc(a, b, sz * 2.2, 0, 7); g.fill();
    };
    [[1700, 1090, 330, 90, 26], [1780, 1090, 410, 130, 30], [1615, 1090, 250, 70, 22], [1860, 1090, 300, 60, 24], [120, 1090, 300, 110, 24], [60, 1090, 380, 150, 28]].forEach(a => fox(...a));
    for (let i = 0; i < 120; i++) {
      const right = r() < .6, x = right ? 1500 + r() * 440 : r() * 420, L = 140 + r() * 340;
      blade(x, H + 10, L, 40 + r() * 120, 4 + r() * 7, css(mix('#1d4a2c', '#2f6a3c', r())), r() < .6 ? css(mix('#8fc760', '#c9e98a', r()), .85) : null);
    }
  }

  // ───────── 赛璐璐层：草帽（色线 + 一层影 + 一点高光）、燕子 ─────────
  function cel(g, S, o = {}) {
    const { x = 830, y = 268, rot = -.3, sc = .95 } = o;
    const LINE = '#5b3b22';
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc);
    // 丝带的两条尾巴：被风往后拖，正反面换颜色
    const tail = (ox, oy, len, amp, ph, wd) => {
      const P = []; for (let s = 0; s <= 1; s += .02) { const xx = ox - len * s, yy = oy + Math.sin(s * 5.2 + ph) * amp * s + s * 26; P.push([xx, yy, wd * (1 - s * .55) * (.55 + .45 * Math.abs(Math.cos(s * 5.2 + ph)))]); }
      for (let i = 0; i < P.length - 1; i++) {
        const [a, b, w0] = P[i], [c2, d2, w1] = P[i + 1], front = Math.cos((i / P.length) * 5.2 + ph) > 0;
        g.fillStyle = front ? '#e0483a' : '#a92f2e';
        g.beginPath(); g.moveTo(a, b - w0 / 2); g.lineTo(c2, d2 - w1 / 2); g.lineTo(c2, d2 + w1 / 2); g.lineTo(a, b + w0 / 2); g.closePath(); g.fill();
      }
      g.strokeStyle = LINE; g.lineWidth = 2;
      g.beginPath(); P.forEach(([a, b, w], i) => i ? g.lineTo(a, b - w / 2) : g.moveTo(a, b - w / 2)); g.stroke();
      g.beginPath(); P.forEach(([a, b, w], i) => i ? g.lineTo(a, b + w / 2) : g.moveTo(a, b + w / 2)); g.stroke();
      const [ex, ey, ew] = P[P.length - 1]; g.beginPath(); g.moveTo(ex, ey - ew / 2); g.lineTo(ex - 10, ey); g.lineTo(ex, ey + ew / 2); g.stroke();
    };
    tail(-40, -18, 230, 26, .4, 22); tail(-46, -8, 190, 30, 2.2, 18);
    // 帽檐（从斜下方看：能看到底面）
    g.fillStyle = '#f1d38e'; g.beginPath(); g.ellipse(0, 0, 142, 56, 0, 0, 7); g.fill();
    // 一层影：帽檐底下、离光远的那半边
    g.save(); g.beginPath(); g.ellipse(0, 0, 142, 56, 0, 0, 7); g.clip();
    g.fillStyle = '#c99b55'; g.beginPath(); g.ellipse(18, 16, 132, 44, 0, 0, 7); g.fill();
    g.fillStyle = '#b5853f'; g.beginPath(); g.ellipse(10, -6, 70, 26, 0, 0, 7); g.fill(); // 帽冠在帽檐上投的影
    // 编织纹：同心圆的细线
    g.strokeStyle = 'rgba(140,100,40,.35)'; g.lineWidth = 1;
    for (let k = 1; k < 9; k++) { g.beginPath(); g.ellipse(0, 0, 70 + k * 9, 26 + k * 3.7, 0, 0, 7); g.stroke(); }
    g.restore();
    g.strokeStyle = LINE; g.lineWidth = 2.6; g.beginPath(); g.ellipse(0, 0, 142, 56, 0, 0, 7); g.stroke();
    // 帽冠
    g.beginPath(); g.moveTo(-66, -8); g.bezierCurveTo(-70, -78, 66, -82, 64, -8); g.ellipse(0, -8, 65, 24, 0, 0, Math.PI); g.closePath();
    g.fillStyle = '#f5da98'; g.fill();
    g.save(); g.clip(); g.fillStyle = '#d4a65e'; g.beginPath(); g.moveTo(20, -90); g.bezierCurveTo(46, -60, 52, -30, 40, 20); g.lineTo(90, 20); g.lineTo(90, -90); g.fill();
    // 高光：一条硬边的白
    g.fillStyle = 'rgba(255,252,236,.95)'; g.beginPath(); g.moveTo(-40, -52); g.bezierCurveTo(-30, -66, -6, -70, 8, -66); g.bezierCurveTo(-8, -62, -26, -56, -34, -44); g.closePath(); g.fill();
    g.restore();
    // 丝带
    g.save(); g.beginPath(); g.moveTo(-66, -8); g.bezierCurveTo(-70, -78, 66, -82, 64, -8); g.ellipse(0, -8, 65, 24, 0, 0, Math.PI); g.closePath(); g.clip();
    g.fillStyle = '#e0483a'; g.beginPath(); g.ellipse(0, -10, 70, 26, 0, 0, Math.PI); g.lineTo(-70, -30); g.ellipse(0, -30, 70, 24, Math.PI, Math.PI, 0, true); g.closePath(); g.fill();
    g.fillStyle = '#a92f2e'; g.fillRect(30, -60, 60, 60);
    g.restore();
    g.strokeStyle = LINE; g.lineWidth = 2.6;
    g.beginPath(); g.moveTo(-66, -8); g.bezierCurveTo(-70, -78, 66, -82, 64, -8); g.stroke();
    g.beginPath(); g.ellipse(0, -8, 65, 24, 0, .05, Math.PI - .05); g.stroke();
    g.lineWidth = 1.8; g.beginPath(); g.ellipse(0, -30, 67, 22, 0, .15, Math.PI - .15); g.stroke();
    // 蝴蝶结
    g.fillStyle = '#e0483a'; g.beginPath(); g.moveTo(-52, -22); g.quadraticCurveTo(-84, -48, -78, -14); g.quadraticCurveTo(-74, 2, -52, -14); g.fill(); g.lineWidth = 2; g.stroke();
    g.fillStyle = '#a92f2e'; g.beginPath(); g.ellipse(-54, -18, 8, 9, 0, 0, 7); g.fill(); g.stroke();
    g.restore();
    // 燕子
    const bird = (bx, by, s, a) => {
      g.save(); g.translate(bx, by); g.rotate(a); g.scale(s, s); g.fillStyle = '#1f2a44';
      g.beginPath(); g.moveTo(-20, 0); g.quadraticCurveTo(-8, -10, 0, -2); g.quadraticCurveTo(8, -12, 24, -4); g.quadraticCurveTo(8, -4, 2, 4); g.lineTo(-4, 14); g.lineTo(-3, 4); g.quadraticCurveTo(-10, -2, -20, 0); g.fill(); g.restore();
    };
    bird(1060, 470, 1.0, -.1); bird(1118, 500, .75, .12); bird(1010, 528, .6, -.2);
  }

  // ───────── 叠起来 + 光 ─────────
  function finish(main, S) {
    const g = main.getContext('2d'), w = main.width, h = main.height;
    // 泛光：亮的地方往外晕一点
    const b = canvas(w / 4, h / 4), bg = b.getContext('2d');
    bg.filter = 'brightness(1.0) contrast(2.2) blur(6px)'; bg.drawImage(main, 0, 0, b.width, b.height);
    g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .16; g.drawImage(b, 0, 0, w, h); g.restore();
    g.save(); g.scale(S, S);
    // 左上角的太阳：暖光 + 一串淡淡的光斑
    let rg = g.createRadialGradient(-80, -60, 0, -80, -60, 900);
    rg.addColorStop(0, 'rgba(255,250,225,.95)'); rg.addColorStop(.18, 'rgba(255,245,215,.45)'); rg.addColorStop(.6, 'rgba(255,240,210,.0)');
    g.globalCompositeOperation = 'screen'; g.fillStyle = rg; g.fillRect(0, 0, W, H);
    // 光柱
    g.globalCompositeOperation = 'screen';
    const r = rng(77);
    for (let i = 0; i < 7; i++) {
      const a = .5 + i * .085 + r() * .03, wd = .015 + r() * .03;
      const lg = g.createLinearGradient(-80, -60, -80 + Math.cos(a) * 1500, -60 + Math.sin(a) * 1500);
      lg.addColorStop(0, `rgba(255,250,230,${.10 + r() * .08})`); lg.addColorStop(1, 'rgba(255,250,230,0)');
      g.fillStyle = lg; g.beginPath(); g.moveTo(-80, -60); g.lineTo(-80 + Math.cos(a - wd) * 1800, -60 + Math.sin(a - wd) * 1800); g.lineTo(-80 + Math.cos(a + wd) * 1800, -60 + Math.sin(a + wd) * 1800); g.fill();
    }
    [[.22, 26, .10], [.36, 14, .14], [.52, 60, .05], [.7, 20, .10], [.82, 34, .06]].forEach(([t, rr, al]) => {
      const x = lerp(-80, 1500, t), y = lerp(-60, 1000, t);
      const fg2 = g.createRadialGradient(x, y, 0, x, y, rr); fg2.addColorStop(0, `rgba(200,240,255,${al})`); fg2.addColorStop(.8, `rgba(200,240,255,${al * .6})`); fg2.addColorStop(1, 'rgba(200,240,255,0)');
      g.fillStyle = fg2; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill();
    });
    g.globalCompositeOperation = 'source-over';
    // 暗角
    rg = g.createRadialGradient(W * .55, H * .45, H * .45, W * .55, H * .45, H * 1.15);
    rg.addColorStop(0, 'rgba(10,30,60,0)'); rg.addColorStop(1, 'rgba(10,30,60,.28)');
    g.fillStyle = rg; g.fillRect(0, 0, W, H);
    g.restore();
    HD.grain(g, 7, 3);
  }

  const LAYERS = [
    { key: 'sky', name: '天 SKY', fn: sky, speed: '×0.05', opaque: true },
    { key: 'clouds', name: '云 CLOUD', fn: clouds, speed: '×0.15' },
    { key: 'mountains', name: '远景 FAR BG', fn: mountains, speed: '×0.3' },
    { key: 'field', name: '中景 BG', fn: field, speed: '×0.6' },
    { key: 'poles', name: '电线杆 BOOK', fn: poles, speed: '×1.0' },
    { key: 'cel', name: '赛璐璐 A-CEL', fn: cel, speed: '1 拍 2', },
    { key: 'fg', name: '前景 FG BOOK', fn: fg, speed: '×1.6' },
  ];
  function renderLayers(S) {
    return LAYERS.map(L => { const [c, g] = layer(S); L.fn(g, S); return { ...L, canvas: c }; });
  }
  return { W, H, layer, renderLayers, finish, LAYERS, cloudSpheres, drawCloud };
})();
