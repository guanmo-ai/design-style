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

  G.SHAPES = { head, street, wall, terrain, sdHead };
})(window);
