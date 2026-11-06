// shapes.js — 第二版片子用的点云形状（都放在原点附近、大小约 6 个单位，方便互相变形）
// 每个形状返回 Float32Array，每点 10 个数：x y z r g b 世界尺寸 随机数 相位 类别
(function (G) {
  const { Cloud, mulberry } = G.PC;
  const len3 = (x, y, z) => Math.sqrt(x * x + y * y + z * z);
  const ell = (x, y, z, a, b, c) => { const k0 = len3(x / a, y / b, z / c), k1 = len3(x / (a * a), y / (b * b), z / (c * c)); return k0 * (k0 - 1) / k1; };
  const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
  const smax = (a, b, k) => -smin(-a, -b, k);
  const capsule = (x, y, z, ax, ay, az, bx, by, bz, r) => { const px = x - ax, py = y - ay, pz = z - az, qx = bx - ax, qy = by - ay, qz = bz - az;
    const h = Math.max(0, Math.min(1, (px * qx + py * qy + pz * qz) / (qx * qx + qy * qy + qz * qz))); return len3(px - qx * h, py - qy * h, pz - qz * h) - r; };
  const cone = (x, y, z, ax, ay, az, bx, by, bz, r1, r2) => { const px = x - ax, py = y - ay, pz = z - az, qx = bx - ax, qy = by - ay, qz = bz - az;
    const h = Math.max(0, Math.min(1, (px * qx + py * qy + pz * qz) / (qx * qx + qy * qy + qz * qz))); return len3(px - qx * h, py - qy * h, pz - qz * h) - (r1 + (r2 - r1) * h); };

  // —— 01 人头（《House of Cards》那种一行一行的扫描）——
  function sdHead(x, y, z) {
    const ax = Math.abs(x);
    let d = ell(x, y - 0.25, z + 0.05, 0.78, 0.95, 0.92);
    d = smin(d, ell(x, y + 0.42, z - 0.12, 0.6, 0.58, 0.72), 0.25);
    d = smin(d, ell(ax - 0.36, y + 0.02, z - 0.42, 0.3, 0.25, 0.3), 0.15);
    d = smin(d, ell(x, y + 0.86, z - 0.4, 0.27, 0.2, 0.25), 0.18);
    d = smin(d, capsule(x, y, z, 0, -0.7, -0.12, 0, -1.9, -0.18, 0.44), 0.22);
    d = smin(d, cone(x, y, z, 0, 0.14, 0.84, 0, -0.27, 1.04, 0.06, 0.12), 0.08);
    d = smin(d, ell(x, y - 0.28, z - 0.72, 0.52, 0.1, 0.17), 0.12);
    d = smax(d, -ell(ax - 0.3, y - 0.12, z - 0.86, 0.17, 0.11, 0.14), 0.06);
    d = smin(d, len3(ax - 0.3, y - 0.12, z - 0.73) - 0.12, 0.02);
    d = smin(d, ell(x, y + 0.47, z - 0.85, 0.22, 0.065, 0.085), 0.05);
    d = smin(d, ell(x, y + 0.585, z - 0.82, 0.19, 0.07, 0.085), 0.05);
    d = smax(d, -ell(x, y + 0.525, z - 0.93, 0.21, 0.013, 0.07), 0.01);
    d = smin(d, ell(ax - 0.8, y - 0.05, z + 0.05, 0.08, 0.26, 0.17), 0.08);
    return d;
  }
  function head(N, R) {
    const C = Cloud(N + 10), rows = 300, per = Math.ceil(N / rows), y0 = -1.85, y1 = 1.25, dy = (y1 - y0) / rows;
    const L = [-0.45, 0.35, 0.82], Ll = len3(...L); const Ln = L.map(v => v / Ll);
    for (let r = 0; r < rows && C.count < N; r++) {
      const y = y1 - r * dy;
      for (let k = 0; k < per && C.count < N; k++) {
        const th = (k + R() * 0.6) / per * 2 * Math.PI, dx = -Math.cos(th), dz = -Math.sin(th);
        let ox = -dx * 2.6, oz = -dz * 2.6, t = 0, hit = false, px = 0, pz = 0;
        for (let i = 0; i < 48; i++) { px = ox + dx * t; pz = oz + dz * t; const d = sdHead(px, y, pz); if (d < 0.003) { hit = true; break; } t += d * 0.9; if (t > 2.7) break; }
        if (!hit) continue;
        const e = 0.004, nx = sdHead(px + e, y, pz) - sdHead(px - e, y, pz), ny = sdHead(px, y + e, pz) - sdHead(px, y - e, pz), nz = sdHead(px, y, pz + e) - sdHead(px, y, pz - e);
        const nl = len3(nx, ny, nz) || 1; const lam = Math.max(0, (nx * Ln[0] + ny * Ln[1] + nz * Ln[2]) / nl), rim = Math.pow(1 - Math.max(0, nz / nl), 3);
        const b = 0.12 + 0.95 * lam + 0.35 * rim; const neck = y < -0.75 ? Math.max(0.25, 1 - (-0.75 - y) * 0.7) : 1;
        C.push(px, y, pz, 0.78 * b * neck, 0.95 * b * neck, 1.0 * b * neck, 0.006, R(), 0, 0);
      }
    }
    return C.data;
  }

  // —— 02 街道（64 线激光雷达：每一束固定仰角，绕一圈打出一圈圈“环”）——
  function street(N, R, S = 0.12) {
    const C = Cloud(N + 10), H = 1.8, lasers = 96, az = Math.ceil(N / lasers * 1.25);
    const boxes = [], cyls = [], spheres = [];
    // 两侧楼：z = ±10 起，每段 6—14 m，高 8—22 m，中间留巷子
    for (const side of [-1, 1]) { let x = -62; while (x < 62) { const w = 6 + R() * 8, h = 8 + R() * 14; boxes.push({ lo: [x, 0, side > 0 ? 10 : -10 - 8], hi: [x + w, h, side > 0 ? 18 : -10], win: true }); x += w + (R() < 0.25 ? 3 : 0.4); } }
    // 人行道（高 0.15）
    boxes.push({ lo: [-70, 0, 5], hi: [70, 0.15, 10] }, { lo: [-70, 0, -10], hi: [70, 0.15, -5] });
    // 车：路边停一排，路中间两辆
    const car = (x, z, dir) => { boxes.push({ lo: [x - 2.2, 0.25, z - 0.9], hi: [x + 2.2, 0.95, z + 0.9], car: 1 }, { lo: [x - 1.2 + dir * 0.2, 0.95, z - 0.8], hi: [x + 1.0 + dir * 0.2, 1.45, z + 0.8], car: 1 }); };
    for (let x = -50; x < 50; x += 6 + R() * 5) { if (Math.abs(x) < 4) continue; car(x, 3.9, 1); }
    for (let x = -46; x < 46; x += 7 + R() * 6) { if (Math.abs(x) < 4) continue; car(x, -3.9, -1); }
    car(9, -1.6, 1); car(-14, 1.6, -1);
    boxes.push({ lo: [20, 0.3, 0.2], hi: [31, 3.2, 2.8], bus: 1 });
    // 行人、树、路灯
    for (let k = 0; k < 26; k++) { const x = -40 + R() * 80, z = (R() < 0.5 ? -1 : 1) * (6 + R() * 3); cyls.push({ x, z, r: 0.25, y0: 0.15, y1: 1.75, kind: 'ped' }); }
    for (let x = -55; x < 55; x += 11) for (const sz of [-1, 1]) { cyls.push({ x, z: sz * 7.6, r: 0.18, y0: 0.15, y1: 3.2, kind: 'trunk' }); spheres.push({ c: [x, 4.6, sz * 7.6], r: 1.9 }); }
    for (let x = -60; x < 60; x += 15) for (const sz of [-1, 1]) cyls.push({ x: x + 5, z: sz * 5.5, r: 0.09, y0: 0.15, y1: 7, kind: 'pole' });
    const rayBox = (o, d, b) => { let t0 = 0, t1 = 1e9; for (let i = 0; i < 3; i++) { const inv = 1 / d[i]; let a = (b.lo[i] - o[i]) * inv, c = (b.hi[i] - o[i]) * inv; if (a > c) [a, c] = [c, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, c); if (t1 < t0) return null; } return t0 > 0 ? t0 : null; };
    const rayCyl = (o, d, c) => { const ox = o[0] - c.x, oz = o[2] - c.z, A = d[0] * d[0] + d[2] * d[2], B = 2 * (ox * d[0] + oz * d[2]), Cc = ox * ox + oz * oz - c.r * c.r, D = B * B - 4 * A * Cc; if (D < 0) return null; const t = (-B - Math.sqrt(D)) / (2 * A); if (t <= 0) return null; const y = o[1] + d[1] * t; return y >= c.y0 && y <= c.y1 ? t : null; };
    const raySph = (o, d, s) => { const ox = o[0] - s.c[0], oy = o[1] - s.c[1], oz = o[2] - s.c[2], b = ox * d[0] + oy * d[1] + oz * d[2], c = ox * ox + oy * oy + oz * oz - s.r * s.r, D = b * b - c; if (D < 0) return null; const t = -b - Math.sqrt(D); return t > 0 ? t : null; };
    const o = [0, H, 0];
    for (let li = 0; li < lasers && C.count < N; li++) {
      const el = (2 - 26.8 * Math.pow(li / (lasers - 1), 1.15)) * Math.PI / 180;
      for (let k = 0; k < az && C.count < N; k++) {
        const a = (k + R() * 0.3) / az * 2 * Math.PI, d = [Math.cos(el) * Math.cos(a), Math.sin(el), Math.cos(el) * Math.sin(a)];
        let best = d[1] < 0 ? -H / d[1] : 1e9, kind = 'ground', obj = null;
        for (const b of boxes) { const t = rayBox(o, d, b); if (t && t < best) { best = t; kind = b.car ? 'car' : b.bus ? 'bus' : b.win ? 'wall' : 'curb'; obj = b; } }
        for (const c of cyls) { const t = rayCyl(o, d, c); if (t && t < best) { best = t; kind = c.kind; } }
        for (const s of spheres) { const t = raySph(o, d, s); if (t && t < best && R() < 0.55) { best = t; kind = 'leaf'; } }
        if (best > 62) continue;
        const p = [o[0] + d[0] * best, o[1] + d[1] * best, o[2] + d[2] * best];
        if (kind === 'wall') { const wx = ((p[0] % 3) + 3) % 3, wy = p[1] % 3.2; if (p[1] > 1 && wx > 0.5 && wx < 2.5 && wy > 0.8 && wy < 2.4 && R() < 0.92) continue; }
        // 强度：车和人最亮，地面按入射角变暗，远处更暗
        let I = { ground: 0.35, curb: 0.5, wall: 0.55, car: 1.0, bus: 0.95, ped: 1.0, trunk: 0.5, leaf: 0.6, pole: 0.8 }[kind];
        I *= 0.55 + 0.45 * Math.exp(-best / 30);
        C.push(p[0] * S, p[1] * S - 1.0, p[2] * S, I, best / 62, { ground: 0, curb: 0.1, wall: 0.25, car: 1, bus: 1, ped: 1, trunk: 0.6, leaf: 0.6, pole: 0.8 }[kind], 0.004, R(), a / (2 * Math.PI), 0);
      }
    }
    // 颜色：按距离着色（turbo），车和人加亮
    const d = C.data, n = C.count, turbo = (x) => { x = Math.min(1, Math.max(0, x)); const r = 0.1357 + x * (4.6154 + x * (-42.6603 + x * (132.1311 + x * (-152.9424 + x * 59.2864)))), g = 0.0914 + x * (2.1942 + x * (4.843 + x * (-14.185 + x * (4.2773 + x * 2.8296)))), b = 0.1067 + x * (12.6419 + x * (-60.582 + x * (110.3628 + x * (-89.9031 + x * 27.3482)))); return [r, g, b]; };
    for (let i = 0; i < n; i++) { const o2 = i * 10, I = d[o2 + 3], dist = d[o2 + 4], hot = d[o2 + 5]; const c = turbo(0.95 - dist * 0.9);
      const w = hot > 0.9 ? 1.6 : 1.0; d[o2 + 3] = c[0] * I * w; d[o2 + 4] = c[1] * I * w; d[o2 + 5] = c[2] * I * w; }
    return d.subarray(0, n * 10);
  }

  // —— 04 颜料墙（Refik Anadol 那种“数据绘画”）：一面墙的点，颜色是一条条颜料带 ——
  function wall(N, R) {
    const C = Cloud(N + 10);
    const pal = [[0.01, 0.02, 0.12], [0.03, 0.12, 0.55], [0.1, 0.5, 1.0], [0.01, 0.02, 0.1], [1.0, 0.18, 0.55], [1.0, 0.6, 0.12], [0.02, 0.02, 0.08], [0.1, 0.95, 0.85], [1.0, 0.97, 0.9]];
    const band = (x, y) => { const v = Math.sin(x * 0.9 + Math.sin(y * 1.3) * 1.6) * 0.5 + Math.sin(y * 2.1 - x * 0.4) * 0.35 + Math.sin((x + y) * 3.1) * 0.15; return ((v * 1.6 + 1) / 2 % 1 + 1) % 1; };
    for (let i = 0; i < N; i++) {
      const x = (R() - 0.5) * 9.6, y = (R() - 0.5) * 5.4, z = (R() - 0.5) * 0.5 - 0.06 * x * x;
      const t = band(x, y) * (pal.length - 1), k = Math.floor(t), f = t - k, a = pal[k], b = pal[Math.min(pal.length - 1, k + 1)];
      const j = 0.85 + R() * 0.3;
      C.push(x, y, z, (a[0] + (b[0] - a[0]) * f) * j, (a[1] + (b[1] - a[1]) * f) * j, (a[2] + (b[2] - a[2]) * f) * j, 0.007, R(), 0, 0);
    }
    return C.data;
  }

  // —— 规则卡用的山地：一片网格点，高度是分形噪声 ——
  function terrain(N, R) {
    const C = Cloud(N + 10), n = Math.floor(Math.sqrt(N)), S = 10;
    const hgt = (x, z) => { let h = 0, a = 1, f = 0.25; for (let o = 0; o < 5; o++) { h += a * Math.sin(x * f * 1.7 + o * 1.3) * Math.cos(z * f * 1.9 - o * 0.7); a *= 0.5; f *= 2.05; } return 1.1 * h + 0.9 * Math.exp(-(x * x + z * z) / 8) * 1.6; };
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const x = (i / (n - 1) - 0.5) * S + (R() - 0.5) * 0.01, z = (j / (n - 1) - 0.5) * S + (R() - 0.5) * 0.01, y = hgt(x, z) - 1.2;
      const e = 0.02, nx = hgt(x - e, z) - hgt(x + e, z), nz = hgt(x, z - e) - hgt(x, z + e), sh = Math.max(0.15, (nx * -0.6 + 2 * e * 0.7 + nz * 0.4) / Math.sqrt(nx * nx + 4 * e * e + nz * nz) + 0.15);
      const snow = y > 0.6 ? 1 : 0, c = snow ? [0.92, 0.95, 1.0] : y > -0.4 ? [0.55, 0.5, 0.42] : [0.22, 0.42, 0.25];
      C.push(x, y, z, c[0] * sh, c[1] * sh, c[2] * sh, 0.009, R(), 0, 0);
    }
    while (C.count < N) { const x = (R() - 0.5) * S, z = (R() - 0.5) * S; C.push(x, hgt(x, z) - 1.2, z, 0.3, 0.3, 0.3, 0.009, R(), 0, 0); }
    return C.data;
  }


  // —— 01 斯坦福兔子（1994）：从真实网格上按面积均匀取点，再按“哪一次扫描看它最清楚”分成 10 组 ——
  const VIEWS = (() => { const v = []; for (let k = 0; k < 8; k++) { const a = k / 8 * 2 * Math.PI; v.push([Math.cos(a), 0.15, Math.sin(a)]); } v.push([0.2, 1, 0.1], [0.3, -0.6, 0.8]); return v.map(d => { const l = Math.hypot(...d); return d.map(x => x / l); }); })();
  function bunny(N, R, S = 3.4) {
    const B = window.BUNNY, raw = Uint8Array.from(atob(B.b64), c => c.charCodeAt(0)).buffer;
    const q = new Uint16Array(raw, 0, B.nv * 3), F = new Uint16Array(raw, B.nv * 6, B.nf * 3);
    const V = new Float32Array(B.nv * 3); for (let i = 0; i < B.nv * 3; i++) V[i] = q[i] / 65535;
    // 居中、放大：高约 3.2
    let lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; for (let i = 0; i < B.nv; i++) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], V[i * 3 + k]); hi[k] = Math.max(hi[k], V[i * 3 + k]); }
    const c = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
    for (let i = 0; i < B.nv; i++) for (let k = 0; k < 3; k++) V[i * 3 + k] = (V[i * 3 + k] - c[k]) * S;
    // 面积累计表
    const nf = B.nf, cum = new Float64Array(nf), nrm = new Float32Array(nf * 3); let tot = 0;
    for (let f = 0; f < nf; f++) { const a = F[f * 3] * 3, b = F[f * 3 + 1] * 3, d = F[f * 3 + 2] * 3;
      const ux = V[b] - V[a], uy = V[b + 1] - V[a + 1], uz = V[b + 2] - V[a + 2], vx = V[d] - V[a], vy = V[d + 1] - V[a + 1], vz = V[d + 2] - V[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, ar = Math.hypot(nx, ny, nz); tot += ar / 2; cum[f] = tot; nrm.set([nx / (ar || 1), ny / (ar || 1), nz / (ar || 1)], f * 3); }
    const C = Cloud(N + 10), L = [-0.5, 0.65, 0.57];
    for (let i = 0; i < N; i++) {
      const r = R() * tot; let lo2 = 0, hi2 = nf - 1; while (lo2 < hi2) { const m = (lo2 + hi2) >> 1; if (cum[m] < r) lo2 = m + 1; else hi2 = m; }
      const f = lo2, a = F[f * 3] * 3, b = F[f * 3 + 1] * 3, d = F[f * 3 + 2] * 3; let u = R(), v = R(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
      const x = V[a] + (V[b] - V[a]) * u + (V[d] - V[a]) * v, y = V[a + 1] + (V[b + 1] - V[a + 1]) * u + (V[d + 1] - V[a + 1]) * v, z = V[a + 2] + (V[b + 2] - V[a + 2]) * u + (V[d + 2] - V[a + 2]) * v;
      const n = [nrm[f * 3], nrm[f * 3 + 1], nrm[f * 3 + 2]];
      let g = 0, best = -9; VIEWS.forEach((w, k) => { const dd = n[0] * w[0] + n[1] * w[1] + n[2] * w[2] + (R() - 0.5) * 0.15; if (dd > best) { best = dd; g = k; } });
      const lam = Math.max(0, n[0] * L[0] + n[1] * L[1] + n[2] * L[2]), sh = 0.16 + 0.84 * lam + 0.25 * Math.pow(1 - Math.abs(n[2]), 3);
      C.push(x, y, z, 0.92 * sh, 0.95 * sh, 1.0 * sh, 0.0055, R(), g, 0);
    }
    return C.data;
  }

  // —— 立体标题：字有 1.8 的厚度；正面是暖色渐变，侧面按深度着色（turbo），下面一片点阵地面，空中飘着灰尘 ——
  function title3d(N, R, text = '点云', cy = 0) {
    const Wm = 2400, Hm = 900, cv = document.createElement('canvas'); cv.width = Wm; cv.height = Hm; const x = cv.getContext('2d');
    x.fillStyle = '#fff'; x.font = '900 760px NotoSC'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, Wm / 2, Hm / 2 + 30);
    const m = x.getImageData(0, 0, Wm, Hm).data, A = (px, py) => (px >= 0 && py >= 0 && px < Wm && py < Hm) ? m[((py | 0) * Wm + (px | 0)) * 4 + 3] / 255 : 0;
    const sc = 9.4 / Wm, Z = 0.9, C = Cloud(N + 10), L = [-0.55, 0.55, 0.62];
    const turbo = (t) => { t = Math.min(1, Math.max(0, t)); return [0.1357 + t * (4.6154 + t * (-42.6603 + t * (132.1311 + t * (-152.9424 + t * 59.2864)))), 0.0914 + t * (2.1942 + t * (4.843 + t * (-14.185 + t * (4.2773 + t * 2.8296)))), 0.1067 + t * (12.6419 + t * (-60.582 + t * (110.3628 + t * (-89.9031 + t * 27.3482))))]; };
    const grad = (u, v) => { const t = Math.min(1, Math.max(0, u * 0.75 + (1 - v) * 0.35)); const a = [1.0, 0.12, 0.45], b = [1.0, 0.45, 0.1], c = [1.0, 0.85, 0.3];
      return t < 0.5 ? a.map((q, i) => q + (b[i] - q) * t * 2) : b.map((q, i) => q + (c[i] - q) * (t - 0.5) * 2); };
    const nF = Math.floor(N * 0.38), nS = Math.floor(N * 0.31), nB = Math.floor(N * 0.03), nG = Math.floor(N * 0.14);
    const W = (px, py) => [(px - Wm / 2) * sc, cy - (py - Hm / 2) * sc];
    let n = 0;
    // 正面：一行一行的扫描线（行距 0.05），行与行之间亮度起伏，像激光一行行扫出来
    const rowH = 0.05 / sc, refl = [];
    while (n < nF) { const px = R() * Wm, py0 = R() * Hm, py = Math.round(py0 / rowH) * rowH + (R() - 0.5) * rowH * 0.18; if (A(px, py) < 0.5) continue;
      const [wx, wy] = W(px, py), g = grad(px / Wm, py / Hm), row = Math.round(py0 / rowH), j = (0.82 + 0.3 * ((row * 7919) % 13) / 13) * (0.9 + R() * 0.2);
      C.push(wx, wy, Z, g[0] * j, g[1] * j, g[2] * j, 0.0065, R(), 0, 0); if (R() < 0.3) refl.push([wx, wy, Z, g[0] * j, g[1] * j, g[2] * j]); n++; }
    n = 0;
    while (n < nS) { const px = R() * Wm, py = R() * Hm; const a = A(px, py); if (a < 0.5) continue;
      const gx = A(px + 3, py) - A(px - 3, py), gy = A(px, py + 3) - A(px, py - 3); if (Math.abs(gx) + Math.abs(gy) < 0.3) continue;
      const l = Math.hypot(gx, gy), nx = -gx / l, ny = gy / l; const z = (R() * 2 - 1) * Z, t = (Z - z) / (2 * Z), tc = turbo(0.95 - 0.8 * t), sh = 0.35 + 0.75 * Math.max(0, nx * L[0] + ny * L[1]);
      const [wx, wy] = W(px, py); C.push(wx, wy, z, tc[0] * sh, tc[1] * sh, tc[2] * sh, 0.006, R(), 0, 0); if (R() < 0.3) refl.push([wx, wy, z, tc[0] * sh, tc[1] * sh, tc[2] * sh]); n++; }
    n = 0;
    while (n < nB) { const px = R() * Wm, py = R() * Hm; if (A(px, py) < 0.5) continue; const [wx, wy] = W(px, py); C.push(wx, wy, -Z, 0.06, 0.08, 0.25, 0.006, R(), 0, 0); n++; }
    // 点阵地面：每 0.22 一个点，越远越暗
    const gy0 = cy - 2.55; n = 0;
    while (n < nG) { const gx = Math.round((R() - 0.5) * 30 / 0.22) * 0.22, gz = Math.round((R() * 18 - 12) / 0.22) * 0.22, d = Math.hypot(gx, gz - 1), f = Math.exp(-d / 6);
      const j = (R() - 0.5) * 0.012; C.push(gx + j, gy0, gz + j, 0.25 * f + 0.02, 0.85 * f + 0.03, 1.0 * f + 0.05, 0.007, R(), 0, 0); n++; }
    // 地上的倒影：字的点按地面翻下去，暗一些，越往下越淡
    const nR = Math.floor(N * 0.1);
    for (let i = 0; i < nR && refl.length; i++) { const q = refl[Math.floor(R() * refl.length)], d = q[1] - gy0, k = 0.5 * Math.exp(-d / 1.8);
      C.push(q[0] + (R() - 0.5) * 0.01, 2 * gy0 - q[1], q[2], q[3] * k, q[4] * k, q[5] * k, 0.006, R(), 0, 0); }
    // 灰尘
    while (C.count < N) { const dx = (R() - 0.5) * 22, dy = cy - 2.5 + R() * 7, dz = (R() - 0.5) * 16 - 2, b = 0.02 + 0.16 * Math.pow(R(), 4); C.push(dx, dy, dz, b * 0.8, b * 0.95, b, 0.005, R(), 0, 0); }
    return C.data;
  }

  G.SHAPES = { head, street, wall, terrain, sdHead, bunny, title3d, VIEWS };
})(window);
