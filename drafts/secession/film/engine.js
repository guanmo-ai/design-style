// 维也纳分离派 · 引擎：缓动、随机、金箔贴图与飘落、线条字母、纹样、镜头。全部是帧号的纯函数。
const ENG = (() => {
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (f, a, b) => clamp((f - a) / (b - a));
  const sm = t => t * t * (3 - 2 * t);
  const ease = { io: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, o3: t => 1 - Math.pow(1 - t, 3), o5: t => 1 - Math.pow(1 - t, 5),
    i3: t => t * t * t, oexp: t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t), iexp: t => t <= 0 ? 0 : Math.pow(2, 10 * t - 10),
    ioexp: t => t <= 0 ? 0 : t >= 1 ? 1 : t < .5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2 };
  // 弹簧：0→1，过冲约 5%（DESIGN_NOTES：落地弹簧过冲 5% 左右）
  const spring = (t, k = 1) => t <= 0 ? 0 : t >= 1.6 ? 1 : 1 - Math.exp(-6.2 * t * k) * Math.cos(9.5 * t * k);
  const rng = s => { let a = s >>> 0 || 1; return () => { a ^= a << 13; a >>>= 0; a ^= a >> 17; a ^= a << 5; a >>>= 0; return a / 4294967296; }; };
  const hash = (i, j = 0, k = 0) => { let h = (i * 374761393 + j * 668265263 + k * 2147483647) >>> 0; h = (h ^ (h >>> 13)) * 1274126177 >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const mixc = (a, b, t) => { const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)); const A = p(a), B = p(b);
    return '#' + A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, '0')).join(''); };

  const PAL = { ink: '#121110', paper: '#F2EDE2', bone: '#E4DCCB', gold: '#C99A2E', goldHi: '#F3D98A', goldLo: '#7A5514', bole: '#6E2A17', grey: '#9E968A' };

  // —— 金箔贴图：值噪声做起皱的高度场 → 法线 → 一盏斜上方的灯（漫反射 + 高光）————————————
  function valueNoise(W, H, cell, r) {
    const gw = Math.ceil(W / cell) + 2, gh = Math.ceil(H / cell) + 2, g = new Float32Array(gw * gh);
    for (let i = 0; i < g.length; i++) g[i] = r();
    const out = new Float32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const fx = x / cell, fy = y / cell, ix = Math.floor(fx), iy = Math.floor(fy), tx = sm(fx - ix), ty = sm(fy - iy);
      const a = g[iy * gw + ix], b = g[iy * gw + ix + 1], c = g[(iy + 1) * gw + ix], d = g[(iy + 1) * gw + ix + 1];
      out[y * W + x] = lerp(lerp(a, b, tx), lerp(c, d, tx), ty);
    }
    return out;
  }
  function leafTexture(seed, S = 224, tone = [201, 154, 46]) {
    const r = rng(seed * 977 + 13);
    const h = new Float32Array(S * S);
    [[56, .5], [26, .28], [11, .15], [5, .07]].forEach(([cell, amp], k) => {
      const n = valueNoise(S, S, cell * (k === 0 ? 1 : .9 + r() * .2), r);
      for (let i = 0; i < h.length; i++) h[i] += n[i] * amp;
    });
    // 几道浅浅的折痕（金箔贴上去时会起的细褶）
    for (let k = 0; k < 3; k++) {
      const a = r() * Math.PI, nx = Math.cos(a), ny = Math.sin(a), c = (r() - .5) * S * .8, w = 7 + r() * 8, d = .035 + r() * .03;
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const dist = (x - S / 2) * nx + (y - S / 2) * ny - c; h[y * S + x] += d * Math.exp(-dist * dist / (w * w)); }
    }
    const cv = document.createElement('canvas'); cv.width = cv.height = S;
    const cx = cv.getContext('2d'), im = cx.createImageData(S, S), D = im.data;
    const L = [-.52, -.6, .6], ln = Math.hypot(...L); L[0] /= ln; L[1] /= ln; L[2] /= ln;
    const Hh = [L[0], L[1], L[2] + 1], hn = Math.hypot(...Hh); Hh[0] /= hn; Hh[1] /= hn; Hh[2] /= hn;
    const k = 5.5, tint = .9 + r() * .2;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const i = y * S + x, xl = h[y * S + Math.max(0, x - 1)], xr = h[y * S + Math.min(S - 1, x + 1)], yu = h[Math.max(0, y - 1) * S + x], yd = h[Math.min(S - 1, y + 1) * S + x];
      let nx = -(xr - xl) * k, ny = -(yd - yu) * k, nz = 1; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
      const dif = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
      const spec = Math.pow(Math.max(0, nx * Hh[0] + ny * Hh[1] + nz * Hh[2]), 38);
      const v = .42 + .78 * dif;
      D[i * 4] = clamp(tone[0] * v * tint + spec * 235, 0, 255);
      D[i * 4 + 1] = clamp(tone[1] * v * tint + spec * 210, 0, 255);
      D[i * 4 + 2] = clamp(tone[2] * v * tint + spec * 150, 0, 255);
      D[i * 4 + 3] = 255;
    }
    cx.putImageData(im, 0, 0);
    // 边上暗一圈：箔片的边缘微微翘起、吃不到光
    const g = cx.createRadialGradient(S / 2, S / 2, S * .35, S / 2, S / 2, S * .75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(40,22,4,.35)');
    cx.fillStyle = g; cx.fillRect(0, 0, S, S);
    return cv;
  }
  const TONES = [[201, 154, 46], [210, 166, 56], [192, 143, 40], [221, 182, 80], [181, 134, 42], [207, 162, 53]];
  let LEAF = [], LEAF_BLUR = [];
  function initLeaves() {
    LEAF = TONES.flatMap((t, i) => [leafTexture(i * 2 + 1, 224, t), leafTexture(i * 2 + 2, 224, t)]);
    LEAF_BLUR = LEAF.map(tex => [4, 10, 20].map(b => { const S = tex.width, pad = b * 3, c = document.createElement('canvas'); c.width = c.height = S + pad * 2;
      const x = c.getContext('2d'); x.filter = `blur(${b}px)`; x.drawImage(tex, pad, pad); return { c, pad, S }; }));
  }

  // 一张金箔：中心 (x, y)，边长 s，平面内转 rot，绕两轴翻 ax / ay（弧度），glint 额外的闪光，blur 0..3 景深
  function leaf(ctx, k, x, y, s, rot = 0, ax = 0, ay = 0, o = {}) {
    const i = ((k % LEAF.length) + LEAF.length) % LEAF.length;
    const cx = Math.cos(ax), cy = Math.cos(ay);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.transform(cy, Math.sin(ay) * .18, Math.sin(ax) * .18, cx, 0, 0);
    ctx.globalAlpha = o.alpha ?? 1;
    const b = o.blur || 0;
    if (b > .05) {
      const lv = Math.min(2, Math.floor(b)), B = LEAF_BLUR[i][lv], sc = s / B.S;
      ctx.drawImage(B.c, -s / 2 - B.pad * sc, -s / 2 - B.pad * sc, B.c.width * sc, B.c.height * sc);
    } else ctx.drawImage(LEAF[i], -s / 2, -s / 2, s, s);
    // 翻面时的亮暗：朝向灯的一面亮，背对的一面暗；正好对着灯的那一刻闪一下
    const facing = Math.sin(ay) * -.6 + Math.sin(ax) * -.5;
    const glint = clamp((o.glint || 0) + Math.pow(clamp(facing * 1.4), 6) * .9);
    if (glint > .01) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (o.alpha ?? 1) * glint * .85; ctx.fillStyle = '#FFE9A8'; ctx.fillRect(-s / 2, -s / 2, s, s); }
    const dark = clamp(-facing * 1.2) * .45;
    if (dark > .01) { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = (o.alpha ?? 1) * dark; ctx.fillStyle = '#2a1803'; ctx.fillRect(-s / 2, -s / 2, s, s); }
    ctx.restore();
  }

  // 飘落：从 (x0, y0) 起飞，在第 land 帧落到 (x1, y1)。飞行时长 dur。返回这一帧的姿态。
  function fall(f, sp) {
    const t0 = sp.land - sp.dur, t = (f - t0) / sp.dur;
    if (t < 0) return null;
    if (t >= 1) { const a = f - sp.land; return { x: sp.x1, y: sp.y1, rot: sp.rot1 || 0, ax: 0, ay: 0, s: sp.s * (1 + .07 * Math.exp(-a / 3) * Math.cos(a * .9)), h: 0, landed: true, glint: Math.exp(-a / 7) * .9, age: a }; }
    const r = rng(sp.seed), ph = r() * 6.28, sw = sp.sway ?? 1;
    const fallT = ease.io(t) * .35 + t * .65;                     // 下落：前段慢、后段快
    const x = lerp(sp.x0, sp.x1, ease.o3(t)) + Math.sin(t * 9 + ph) * sp.s * .55 * sw * (1 - t);
    const y = lerp(sp.y0, sp.y1, fallT) - Math.abs(Math.sin(t * 9 + ph)) * sp.s * .12 * (1 - t);
    const flip = (1 - t);
    return { x, y, rot: lerp(sp.rot0 ?? (r() - .5) * 2.4, sp.rot1 || 0, ease.o3(t)), ax: Math.sin(t * 11 + ph) * 1.25 * flip, ay: Math.cos(t * 7 + ph * 1.3) * 1.1 * flip,
      s: sp.s * lerp(sp.big ?? 1.3, 1, ease.o3(t)), h: (1 - fallT), landed: false, glint: 0, age: f - t0 };
  }

  // —— 线条字母（与 secession.py 的 glyph_paths 一致）————————————————————————————————
  const WAIST = 2.4;
  function glyph(ch, x, y, u) {
    const t = u, L = x + t / 2, R = x + 3 * u - t / 2, T = y + t / 2, B = y + 7 * u - t / 2, r = (R - L) / 2, C = (L + R) / 2, m = y + WAIST * u;
    const A = (x2, y2, sw) => `A${r},${r} 0 0 ${sw} ${x2},${y2}`;
    const P = [], D = [];
    switch (ch) {
      case 'O': P.push(`M${L},${T + r}${A(R, T + r, 1)}V${B - r}${A(L, B - r, 1)}Z`); D.push([C, y + 3.5 * u, .34]); break;
      case 'C': P.push(`M${R},${T + r + u * .7}V${T + r}${A(L, T + r, 0)}V${B - r}${A(R, B - r, 0)}V${B - r - u * .7}`); break;
      case 'S': P.push(`M${R},${T + r + u * .6}V${T + r}${A(L, T + r, 0)}V${m - r}${A(C, m, 0)}${A(R, m + r, 1)}V${B - r}${A(L, B - r, 1)}V${B - r - u * .6}`); break;
      case 'E': P.push(`M${R},${T}H${L}V${B}H${R}`, `M${L},${m}H${R - u * .25}`); D.push([C + u * .15, m + u * 1.6, .3]); break;
      case 'N': P.push(`M${L},${B + t / 2}V${T + r}${A(R, T + r, 1)}V${B + t / 2}`); break;
      case 'I': P.push(`M${C},${T - t / 2}V${B + t / 2}`); break;
    }
    return { P, D };
  }
  const ADV = { I: 1, ' ': 2 }, OPEN = { E: .45, C: .4, S: .1 };
  // 一行字：返回每一笔（Path2D + 估算长度 + 所属字母序号）和小方点
  function wordStrokes(text, x, y, u) {
    const strokes = [], dots = []; let cx = x;
    [...text].forEach((ch, li) => {
      const g = ch === 'I' ? glyph('I', cx - u, y, u) : glyph(ch, cx, y, u);
      g.P.forEach(d => strokes.push({ p: new Path2D(d), len: pathLen(d), li }));
      g.D.forEach(([dx, dy, k]) => dots.push({ x: dx, y: dy, s: u * k * 2, li }));
      cx += ((ADV[ch] ?? 3) + 1 - (OPEN[ch] || 0)) * u;
    });
    return { strokes, dots, w: cx - x - u };
  }
  const SVGP = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  function pathLen(d) { SVGP.setAttribute('d', d); try { const L = SVGP.getTotalLength(); if (L > 0) return L; } catch (e) { } return pathLen0(d); }
  function pathLen0(d) {   // 粗估：把 M/H/V/A/L 的线段长度加起来（弧按半圆周的四分之一或一半算）
    let len = 0, px = 0, py = 0; const re = /([MLHVAZ])([^MLHVAZ]*)/g; let m, sx = 0, sy = 0;
    while ((m = re.exec(d))) { const c = m[1], v = m[2].trim().split(/[\s,]+/).filter(Boolean).map(Number);
      if (c === 'M') { px = v[0]; py = v[1]; sx = px; sy = py; } else if (c === 'L') { len += Math.hypot(v[0] - px, v[1] - py); px = v[0]; py = v[1]; }
      else if (c === 'H') { len += Math.abs(v[0] - px); px = v[0]; } else if (c === 'V') { len += Math.abs(v[0] - py); py = v[0]; }
      else if (c === 'A') { const ch = Math.hypot(v[5] - px, v[6] - py); len += ch > v[0] * 1.9 ? Math.PI * v[0] : Math.PI * v[0] / 2; px = v[5]; py = v[6]; }
      else if (c === 'Z') { len += Math.hypot(sx - px, sy - py); px = sx; py = sy; } }
    return len;
  }

  // —— 镜头：世界坐标 → 屏幕。cam = {x, y, z, rot} ——————————————————————————————————
  function camTo(ctx, cam, sh = [0, 0]) {
    const c = Math.cos(cam.rot || 0) * cam.z, s = Math.sin(cam.rot || 0) * cam.z;
    ctx.setTransform(c, s, -s, c, 960 + sh[0] - (c * cam.x - s * cam.y), 540 + sh[1] - (s * cam.x + c * cam.y));
  }
  const toScreen = (cam, x, y) => { const c = Math.cos(cam.rot || 0) * cam.z, s = Math.sin(cam.rot || 0) * cam.z, dx = x - cam.x, dy = y - cam.y; return [960 + c * dx - s * dy, 540 + s * dx + c * dy]; };

  // 关键帧插值：K = [[f, {x,y,z,rot}, 缓动名], ...]。缩放按对数插值（推拉匀速感）
  function keys(K, f) {
    if (f <= K[0][0]) return { ...K[0][1] };
    for (let i = 0; i < K.length - 1; i++) {
      const [fa, a] = K[i], [fb, b, e] = K[i + 1];
      if (f < fb) { const t = (ease[e || 'io'] || ease.io)((f - fa) / (fb - fa)), o = {};
        for (const k in b) o[k] = k === 'z' ? Math.exp(lerp(Math.log(a[k]), Math.log(b[k]), t)) : lerp(a[k] ?? 0, b[k], t); return o; }
    }
    return { ...K[K.length - 1][1] };
  }

  const IMG = {};
  function loadImages(names) {
    return Promise.all(names.map(n => new Promise((res, rej) => { const im = new Image(); im.onload = () => { IMG[n] = im; res(); }; im.onerror = rej; im.src = `assets/${n}.png`; })));
  }

  return { clamp, lerp, prog, sm, ease, spring, rng, hash, mixc, PAL, initLeaves, leaf, fall, wordStrokes, camTo, toScreen, keys, IMG, loadImages,
    get LEAF() { return LEAF; } };
})();
