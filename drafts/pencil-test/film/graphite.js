// 石墨：一个很小的三维渲染器（有符号距离场 + 软阴影 + 环境光遮蔽），算出每个像素的明暗，再用“排线”画出来：
// 亮的地方只有一层 45° 的排线，越暗叠越多层（-45°、15°、75°），最暗处是揉开的石墨；轮廓线来自深度 / 物体的断开处。
// 排线是预先画好的几套“纸上的线”（每根都有手抖、两头轻中间重），一拍二轮换 → 线在沸腾；明暗每帧都算 → 镜头是丝滑的。
const GRAPHITE = (() => {
  const { clamp, lerp, smooth, rng, makeNoise, canvas } = HD;
  // ───── 向量
  const V = (x, y, z) => [x, y, z], add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len = a => Math.hypot(a[0], a[1], a[2]), norm = a => mul(a, 1 / (len(a) || 1)), cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  // ───── 基本形体（距离函数）。每个形体：{ t: 类型, p: 中心, ... , ry: 绕 Y 轴转, id }
  const sdBox = (x, y, z, b) => { const qx = Math.abs(x) - b[0], qy = Math.abs(y) - b[1], qz = Math.abs(z) - b[2]; return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0); };
  const sdCyl = (x, y, z, r, h) => { const dx = Math.hypot(x, z) - r, dy = Math.abs(y) - h; return Math.min(Math.max(dx, dy), 0) + Math.hypot(Math.max(dx, 0), Math.max(dy, 0)); };
  const sdCone = (x, y, z, r, h) => { const q = Math.hypot(x, z), k = r / h, d = (q - (h - y) * k) / Math.sqrt(1 + k * k); return Math.max(d, -y, y - h); };
  const sdTorus = (x, y, z, R, r) => Math.hypot(Math.hypot(x, z) - R, y) - r;
  function shapeDist(s, x, y, z) {
    let px = x - s.p[0], py = y - s.p[1], pz = z - s.p[2];
    if (s.ry) { const c = Math.cos(s.ry), n = Math.sin(s.ry), qx = c * px - n * pz, qz = n * px + c * pz; px = qx; pz = qz; }
    if (s.rx) { const c = Math.cos(s.rx), n = Math.sin(s.rx), qy = c * py - n * pz, qz = n * py + c * pz; py = qy; pz = qz; }
    if (s.rz) { const c = Math.cos(s.rz), n = Math.sin(s.rz), qx = c * px - n * py, qy = n * px + c * py; px = qx; py = qy; }
    switch (s.t) {
      case 'sphere': return Math.hypot(px, py, pz) - s.r;
      case 'box': return sdBox(px, py, pz, s.b) - (s.round || 0);
      case 'cyl': return sdCyl(px, py, pz, s.r, s.h);
      case 'cone': return sdCone(px, py, pz, s.r, s.h);
      case 'torus': return sdTorus(px, py, pz, s.R, s.r);
      case 'plane': return py;                                   // 地面：y = p.y
      case 'wall': return -pz;                                   // 背墙：z = p.z，朝 -z
      case 'city': { // 一整片楼：按格子重复的方块（每格高度不同），中间留一条街（x 方向第 0 列空着）
        const c = s.cell, ix = Math.round(px / c), iz = Math.round(pz / c), lx = px - ix * c, lz = pz - iz * c;
        if (Math.abs(ix) < 1) return Math.max(Math.abs(lx) - c * .5 + .3, 0) + .5;          // 街：没有楼，给一个保守的步长
        const hh = s.h0 + (s.h1 - s.h0) * (((Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453) % 1 + 1) % 1);
        return sdBox(lx, py - hh / 2, lz, [s.w, hh / 2, s.w]);
      }
      case 'cols': { // 柱廊：沿 z 重复的两排圆柱
        const c = s.gap, iz = Math.round(pz / c), lz = pz - iz * c, lx = Math.abs(px) - s.x;
        return sdCyl(lx, py - s.h, lz, s.r, s.h);
      }
      case 'beams': { // 屋顶：沿 z 重复的横梁（梁之间漏光 → 地上一条条光）
        const c = s.gap, iz = Math.round(pz / c), lz = pz - iz * c;
        return sdBox(px, py, lz, [s.w, s.t, s.d]);
      }
    }
    return 1e9;
  }
  function scene(S, x, y, z) { let d = 1e9, id = -1; for (let i = 0; i < S.shapes.length; i++) { const v = shapeDist(S.shapes[i], x, y, z); if (v < d) { d = v; id = i; } } return [d, id]; }
  const sdf = (S, x, y, z) => { let d = 1e9; for (const s of S.shapes) { const v = shapeDist(s, x, y, z); if (v < d) d = v; } return d; };
  function normal(S, p) { const e = .002; return norm([sdf(S, p[0] + e, p[1], p[2]) - sdf(S, p[0] - e, p[1], p[2]), sdf(S, p[0], p[1] + e, p[2]) - sdf(S, p[0], p[1] - e, p[2]), sdf(S, p[0], p[1], p[2] + e) - sdf(S, p[0], p[1], p[2] - e)]); }
  function softShadow(S, ro, rd, tmax, k) { let res = 1, t = .02; for (let i = 0; i < 40 && t < tmax; i++) { const h = sdf(S, ro[0] + rd[0] * t, ro[1] + rd[1] * t, ro[2] + rd[2] * t); if (h < .001) return 0; res = Math.min(res, k * h / t); t += clamp(h, .02, .5); } return clamp(res); }
  function ao(S, p, n) { let o = 0, w = 1; for (let i = 1; i <= 5; i++) { const h = .06 * i, d = sdf(S, p[0] + n[0] * h, p[1] + n[1] * h, p[2] + n[2] * h); o += (h - d) * w; w *= .6; } return clamp(1 - 2.2 * o); }
  // ───── 渲染明暗：返回 { L: Float32Array（0 黑 — 1 白）, D: 深度, I: 物体编号, w, h }
  function shade(S, cam, w, h) {
    const L = new Float32Array(w * h), D = new Float32Array(w * h), I = new Int16Array(w * h);
    const fwd = norm(sub(cam.to, cam.from)), right = norm(cross(fwd, [0, 1, 0])), up = cross(right, fwd), f = 1 / Math.tan((cam.fov || 40) * Math.PI / 360);
    const lt0 = S.light ? norm(S.light) : null, amb = S.amb ?? .18;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const u = (2 * (i + .5) / w - 1) * (w / h), v = 1 - 2 * (j + .5) / h, rd = norm(add(add(mul(right, u), mul(up, v)), mul(fwd, f)));
      let t = .01, id = -1, hit = false;
      for (let k = 0; k < 90; k++) { const p = add(cam.from, mul(rd, t)), [d, sid] = scene(S, p[0], p[1], p[2]); if (d < .0015 * t) { hit = true; id = sid; break; } t += Math.min(d * (S.step || .9), S.maxStep || 1e9); if (t > (S.far || 60)) break; }
      const k = j * w + i;
      if (!hit) { L[k] = S.sky ?? 1; D[k] = 1e9; I[k] = -1; continue; }
      const p = add(cam.from, mul(rd, t)), n = normal(S, p), sh = S.shapes[id];
      if (sh.emit) { L[k] = 1; D[k] = t; I[k] = id; continue; }
      // 平行光，或点光（有衰减：越远越暗 → 背景沉下去）
      let lt = lt0, att = 1, tmax = 20;
      if (S.lpos) { const dv = sub(S.lpos, p), dl = len(dv); lt = mul(dv, 1 / dl); att = 1 / (1 + (S.fall || .03) * dl * dl); tmax = dl; }
      const dif = Math.max(0, dot(n, lt)) * softShadow(S, add(p, mul(n, .004)), lt, tmax, S.soft || 10) * att * (S.lgain || 1);
      const occ = ao(S, p, n), alb = sh.alb ?? .9;
      let l = alb * (amb * occ + (1 - amb) * dif) + (S.rim || 0) * Math.pow(1 - Math.abs(dot(n, rd)), 3) * occ;
      if (S.fog) l = lerp(l, S.sky ?? 1, 1 - Math.exp(-t / S.fog));
      L[k] = clamp(l); D[k] = t; I[k] = id;
    }
    return { L, D, I, w, h };
  }
  // ───── 纸上的排线：一套 = 4 层（不同角度），每层一张透明画布，线是一根根画的
  function hatchSet(W, H, seed, gap) {
    const r = rng(seed), out = [];
    for (const [ang, g, wd] of [[-.78, gap, 1.25], [.78, gap * 1.05, 1.15], [.26, gap * .95, 1.1], [1.31, gap * .9, 1.05]]) {
      const c = canvas(W, H), x = c.getContext('2d'); x.lineCap = 'round';
      const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx, Lh = Math.hypot(W, H);
      for (let o = -Lh / 2; o < Lh / 2; o += g * (.75 + r() * .5)) {
        // 一根线不是一笔到底：分成几段，每段有自己的起止、手抖和轻重
        let s = -Lh / 2 + r() * 60;
        while (s < Lh / 2) {
          const segL = 140 + r() * 380, cx = W / 2 + nx * o + dx * (s + segL / 2), cy = H / 2 + ny * o + dy * (s + segL / 2), wob = (r() - .5) * 2.4, pr = .55 + r() * .45;
          const N = 8; x.beginPath();
          for (let q = 0; q <= N; q++) { const u = q / N - .5, px = cx + dx * u * segL + nx * (Math.sin(u * 3 + o) * wob), py = cy + dy * u * segL + ny * (Math.sin(u * 3 + o) * wob); q ? x.lineTo(px, py) : x.moveTo(px, py); }
          x.strokeStyle = `rgba(38,38,44,${.55 * pr})`; x.lineWidth = wd * (.7 + r() * .6); x.stroke();
          s += segL + 10 + r() * 40;
        }
      }
      out.push(c);
    }
    return out;
  }
  // ───── 把明暗画成铅笔：paper（底），返回合成好的画布
  const TONE = [[.88, .7], [.7, .5], [.5, .32], [.34, .16]];     // 每层：从这个亮度开始出现 → 到这个亮度画满
  function draw(ctx, R, sets, k, o = {}) {
    const W = ctx.canvas.width, H = ctx.canvas.height, { w, h, L, D, I } = R, reveal = o.reveal || (() => 1);
    const mask = draw.mask || (draw.mask = canvas(w, h)), mg = mask.getContext('2d'), im = mg.createImageData(w, h), md = im.data;
    const tmp = draw.tmp || (draw.tmp = canvas(W, H)), tg = tmp.getContext('2d');
    const gr = draw.gr || (draw.gr = canvas(W, H)), gg = gr.getContext('2d');
    gg.setTransform(1, 0, 0, 1, 0, 0); gg.clearRect(0, 0, W, H);
    const set = sets[k % sets.length];
    // 先用纸笔擦开的一层软灰（像用纸擦笔抹过）：明暗连续 → 形体是“真”的；排线叠在上面给质感
    for (let q = 0; q < w * h; q++) { const x = q % w, y = (q / w) | 0, v = Math.pow(1 - L[q], 1.7) * reveal(x / w, y / h, 0); md[q * 4] = 52; md[q * 4 + 1] = 52; md[q * 4 + 2] = 58; md[q * 4 + 3] = 255 * v * (o.soft ?? .62); }
    mg.putImageData(im, 0, 0); gg.imageSmoothingEnabled = true; gg.filter = 'blur(1.5px)'; gg.drawImage(mask, 0, 0, W, H); gg.filter = 'none';
    TONE.forEach(([a, b], li) => {
      for (let q = 0; q < w * h; q++) { const x = q % w, y = (q / w) | 0, v = smooth(a, b, L[q]) * reveal(x / w, y / h, li); md[q * 4 + 3] = 255 * v; }
      mg.putImageData(im, 0, 0);
      tg.globalCompositeOperation = 'source-over'; tg.clearRect(0, 0, W, H); tg.drawImage(set[li], 0, 0, W, H);
      tg.globalCompositeOperation = 'destination-in'; tg.imageSmoothingEnabled = true; tg.drawImage(mask, 0, 0, W, H);
      gg.drawImage(tmp, 0, 0);
    });
    // 最暗处：揉开的石墨（软的灰），让黑有“天鹅绒”的厚度
    for (let q = 0; q < w * h; q++) { const x = q % w, y = (q / w) | 0, v = smooth(.22, .03, L[q]) * reveal(x / w, y / h, 4); md[q * 4] = md[q * 4 + 1] = 40; md[q * 4 + 2] = 46; md[q * 4 + 3] = 210 * v; }
    mg.putImageData(im, 0, 0); gg.imageSmoothingEnabled = true; gg.drawImage(mask, 0, 0, W, H);
    // 轮廓：深度或物体编号断开的地方
    for (let q = 0; q < w * h; q++) {
      const x = q % w, y = (q / w) | 0; let e = 0;
      if (x > 0 && y > 0 && x < w - 1 && y < h - 1) { for (const nb of [q - 1, q + 1, q - w, q + w]) { if (I[nb] !== I[q]) e = 1; else if (D[q] < 1e8 && Math.abs(D[nb] - D[q]) > .06 * D[q]) e = Math.max(e, .8); } }
      md[q * 4] = md[q * 4 + 1] = 30; md[q * 4 + 2] = 34; md[q * 4 + 3] = 255 * e * .5 * reveal(x / w, y / h, 5);
    }
    mg.putImageData(im, 0, 0); gg.imageSmoothingEnabled = true; gg.drawImage(mask, 0, 0, W, H);
    // 纸纹：石墨只落在纸纹凸起上（颗粒）
    if (o.tooth) { gg.globalCompositeOperation = 'destination-in'; gg.fillStyle = gg.createPattern(o.tooth, 'repeat'); gg.fillRect(0, 0, W, H); gg.globalCompositeOperation = 'source-over'; }
    ctx.drawImage(gr, 0, 0);
  }
  return { V, shade, hatchSet, draw, norm, sub, add, mul };
})();
