// ───────────────────────── painters: background-art vocabulary ─────────────────────────
const INK = '#3a2924';

function paintSky(g, w, h, stops, seed, strokes = 900) {
  const gr = g.createLinearGradient(0, 0, 0, h);
  stops.forEach(([o, c]) => gr.addColorStop(o, c));
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const r = RNG(seed);
  // long, flat gouache strokes following the gradient (visible brushwork, never a clean digital ramp)
  for (let i = 0; i < strokes; i++) {
    const y = r() * h, x = r() * w, u = y / h;
    const c = jit(stopsAt(stops, clamp(u + r.range(-0.03, 0.03))), r, 22);
    g.fillStyle = rgba(c, r.range(0.05, 0.2));
    const len = r.range(60, 380), th = r.range(2, 12);
    g.beginPath(); g.ellipse(x, y, len, th, r.range(-0.04, 0.04), 0, TAU); g.fill();
  }
}

// cel-shaded cumulus: every puff gets a hard-edged shadow / mid / lit / rim split, painted back to front
function cloudPuffs(r, x, y, w, h) {
  const P = [], n = Math.max(3, Math.round(w / (h * 0.2)));
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n, d = Math.sin(Math.PI * u), pr = h * (0.1 + 0.15 * d) * r.range(0.75, 1.25);
    P.push({ x: x - w / 2 + u * w + r.range(-0.3, 0.3) * (w / n), y: y - pr * 0.5, r: pr });
  }
  const m = Math.round(n * 2.2);
  for (let i = 0; i < m; i++) {
    const u = r.range(0.1, 0.9), d = Math.pow(Math.sin(Math.PI * u), 1.3);
    const pr = h * (0.08 + 0.16 * d) * r.range(0.7, 1.3);
    P.push({ x: x - w / 2 + u * w, y: y - pr * 0.45 - d * h * r.range(0.1, 0.85), r: pr });
  }
  P.sort((a, b) => a.y - b.y);
  return P;
}
function cumulus(g, o) {
  const r = RNG(o.seed);
  const P = o.puffs || cloudPuffs(r, o.x, o.y, o.w, o.h);
  const ry = o.ry || 0.86, lx = o.lx, ly = o.ly, rough = o.rough || 0.2;
  g.save();
  if (o.flat !== false) { g.beginPath(); g.rect(o.x - o.w * 2, o.y - o.h * 4, o.w * 4, o.h * 4); g.clip(); }
  for (const p of P) {
    const s = r() * 997;
    const k = clamp((o.y - p.y) / (o.h || 1));
    const sh = mixc(o.sh2 ? mixc(o.sh2, o.sh, k) : o.sh, o.mid, o.soft ?? 0.22);
    const B = new Path2D(); blob(B, p.x, p.y, p.r, p.r * ry, s, rough, 22);
    g.fillStyle = sh; g.fill(B);
    g.save(); g.clip(B);
    const ox = lx * p.r, oy = ly * p.r * ry, lo = o.litOff || 0.36;
    // two flat cel tones with a crisp, slightly ragged terminator
    const L = new Path2D(); blob(L, p.x + ox * lo, p.y + oy * lo, p.r * 1.02, p.r * ry * 1.0, s + 3, rough * 1.3, 22);
    g.fillStyle = o.lit; g.fill(L);
    if (o.rim) { const Rm = new Path2D(); blob(Rm, p.x + ox * 0.82, p.y + oy * 0.82, p.r * 0.62, p.r * ry * 0.5, s + 9, rough * 1.5, 16); g.fillStyle = o.rim; g.fill(Rm); }
    // gouache dabs: soften the terminator with the mid tone and give the paint tooth
    const nd = Math.min(260, p.r * 1.1);
    for (let i = 0; i < nd; i++) {
      const a = r() * TAU, d = Math.sqrt(r()) * p.r;
      const dx = p.x + Math.cos(a) * d, dy = p.y + Math.sin(a) * d * ry;
      const lit = (Math.cos(a) * lx + Math.sin(a) * ly) * (d / p.r);
      const c = Math.abs(lit + 0.05) < 0.22 ? o.mid : lit > 0.3 ? o.rim || o.lit : lit > -0.1 ? o.lit : sh;
      const sz = (p.r / 28 + 1.2) * r.range(0.7, 1.7);
      dab(g, dx, dy, sz * 1.9, sz * 0.75, r.range(-0.4, 0.4), rgba(jit(c, r, 14), r.range(0.15, 0.4)));
    }
    if (o.under) {
      const gr = g.createLinearGradient(0, p.y + p.r * ry * 0.1, 0, p.y + p.r * ry);
      gr.addColorStop(0, rgba(o.under, 0)); gr.addColorStop(1, rgba(o.under, 0.32));
      g.fillStyle = gr; g.fillRect(p.x - p.r * 1.3, p.y, p.r * 2.6, p.r * ry * 1.2);
    }
    g.restore();
  }
  g.restore();
}
function streak(g, o) {
  const r = RNG(o.seed), P = [], n = Math.max(4, Math.round(o.w / (o.h * 0.75)));
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n, d = Math.pow(Math.sin(Math.PI * u), 0.7);
    P.push({ x: o.x - o.w / 2 + u * o.w + r.range(-0.3, 0.3) * (o.w / n), y: o.y + r.range(-0.4, 0.4) * o.h + (o.tilt || 0) * (u - 0.5) * o.w, r: o.h * (0.9 + 1.4 * d) * r.range(0.6, 1.3) });
  }
  cumulus(g, { ...o, puffs: P, flat: false, ry: o.ry || 0.26, litOff: 0.3 });
}

function cloudSea(g, o) {
  const r = RNG(o.seed);
  for (let k = 0; k < o.rows; k++) {
    const u = k / (o.rows - 1), y = lerp(o.y0, o.y1, Math.pow(u, 1.5)), pr = lerp(o.r0, o.r1, Math.pow(u, 1.35));
    const hz = Math.pow(1 - u, 1.2) * o.haze;
    const c = { sh: mixc(mixc(o.sh, o.mid, 0.35), o.hazeC, hz), mid: mixc(o.mid, o.hazeC, hz * 0.85), lit: mixc(o.lit, o.hazeC, hz * 0.55), rim: o.rim ? mixc(o.rim, o.hazeC, hz * 0.4) : null };
    g.fillStyle = c.sh; g.fillRect(0, y, o.w, o.y1 + o.r1 * 2 - y);
    // rolling banks: a few big swells built from overlapping flat lobes
    const P = []; let x = -pr * 2 * r();
    while (x < o.w + pr * 2) {
      const bankW = pr * r.range(3, 7), lift = pr * r.range(0.1, 0.9);
      for (let bx = 0; bx < bankW; bx += pr * r.range(0.45, 0.8)) {
        const d = Math.sin((bx / bankW) * Math.PI);
        P.push({ x: x + bx, y: y - lift * d + r.range(-0.15, 0.15) * pr, r: pr * (0.7 + 0.7 * d) * r.range(0.8, 1.2) });
      }
      x += bankW * r.range(0.7, 0.95);
    }
    P.sort((a, b) => a.y - b.y);
    cumulus(g, { puffs: P, seed: o.seed + k * 13, flat: false, ry: 0.42, rough: 0.16, litOff: 0.42, sh: c.sh, mid: c.mid, lit: c.lit, rim: c.rim, lx: o.lx, ly: o.ly, under: o.under });
    // mist settling into the troughs
    const mg = g.createLinearGradient(0, y - pr * 0.2, 0, y + pr * 0.6);
    mg.addColorStop(0, rgba(o.hazeC, 0)); mg.addColorStop(0.6, rgba(o.hazeC, 0.22 * (0.4 + hz))); mg.addColorStop(1, rgba(o.hazeC, 0));
    g.fillStyle = mg; g.fillRect(0, y - pr * 0.2, o.w, pr * 0.8);
  }
}
function peak(g, o) {
  const r = RNG(o.seed), pts = [];
  for (let x = o.cx - o.hw; x <= o.cx + o.hw; x += 5) {
    const u = (x - o.cx) / o.hw, prof = Math.pow(1 - Math.abs(u), o.pow || 1.35);
    const y = o.base - o.h * prof * (0.8 + 0.35 * fbm(x * 0.006, o.seed, o.seed)) - (fbm(x * 0.04, 2, o.seed) - 0.5) * 16 * prof;
    pts.push([x, y]);
  }
  const body = new Path2D(); body.moveTo(o.cx - o.hw, o.base + 60); pts.forEach((p) => body.lineTo(p[0], p[1])); body.lineTo(o.cx + o.hw, o.base + 60); body.closePath();
  g.fillStyle = o.sh; g.fill(body);
  g.save(); g.clip(body);
  // lit faces: jagged terminators running down from summits toward the light side
  let top = pts.reduce((a, b) => (b[1] < a[1] ? b : a));
  const side = o.lightSide || 1;
  const L = new Path2D(); L.moveTo(top[0], top[1] - 4);
  let x = top[0], y = top[1];
  while (y < o.base + 60) { y += r.range(10, 26); x += side * r.range(-4, 22) + (r() - 0.5) * 18; L.lineTo(x, y); }
  L.lineTo(o.cx + side * o.hw * 2, o.base + 60); L.lineTo(o.cx + side * o.hw * 2, top[1] - 10); L.closePath();
  g.fillStyle = o.lit; g.fill(L);
  // gullies / rock strokes
  for (let i = 0; i < o.hw * 0.25; i++) {
    const px = o.cx + r.range(-o.hw, o.hw) * 0.8, idx = Math.round((px - (o.cx - o.hw)) / 5), ty = pts[clamp(idx, 0, pts.length - 1)][1];
    const py = ty + r.range(4, 90), len = r.range(10, 40);
    g.strokeStyle = rgba(r() < 0.5 ? o.sh : o.lit, r.range(0.25, 0.55)); g.lineWidth = r.range(1, 3);
    g.beginPath(); g.moveTo(px, py); g.lineTo(px + side * len * 0.3, py + len); g.stroke();
  }
  const hz = g.createLinearGradient(0, o.base - o.h, 0, o.base + 20);
  hz.addColorStop(0, rgba(o.hz, 0)); hz.addColorStop(1, rgba(o.hz, o.hzA || 0.75));
  g.fillStyle = hz; g.fillRect(o.cx - o.hw, o.base - o.h - 10, o.hw * 2, o.h + 80);
  g.restore();
}

// grass that grows out of a region. Blades spawn inside `path` (in layer coords) but are not clipped,
// so their tips break the silhouette like real background art.
function grassArea(L, o) {
  const g = L.g, r = RNG(o.seed), [x0, y0, x1, y1] = o.bbox;
  const inside = (x, y) => g.isPointInPath(o.path, x * Q, y * Q);
  let y = y0;
  while (y < y1) {
    const h = o.hAt(y), step = Math.max(1.1, h * 0.07);
    const n = Math.round(((x1 - x0) / Math.max(1.4, h * 0.11)) * (o.density || 1));
    for (let i = 0; i < n; i++) {
      const x = r.range(x0, x1), yy = y + r.range(0, step);
      if (!inside(x, yy)) continue;
      const hh = h * r.range(0.55, 1.35), lit = clamp(o.litAt(x, yy) + r.range(-0.18, 0.18));
      const patch = fbm(x * 0.006, yy * 0.012, o.seed, 3);
      const C = o.cols;
      let c = mixc(C.dark, C.mid, clamp(patch * 1.6 - 0.2));
      c = mixc(c, C.light, clamp(lit * 1.2 - 0.1));
      if (lit > 0.72 && r() < 0.6) c = mixc(c, C.tip, r.range(0.3, 0.9));
      blade(g, x, yy, hh, (o.lean || 0) * hh + r.range(-0.4, 0.4) * hh, Math.max(0.8, hh * r.range(0.06, 0.11)), jit(c, r, 14));
    }
    y += step;
  }
}
function flowers(g, r, n, area, cols, size) {
  for (let i = 0; i < n; i++) {
    const p = area(r); if (!p) continue;
    const [x, y, s] = p, c = r.pick(cols), sz = size * s;
    for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU + r(); dab(g, x + Math.cos(a) * sz * 0.8, y + Math.sin(a) * sz * 0.5, sz * 0.7, sz * 0.45, a, c); }
    dab(g, x, y, sz * 0.35, sz * 0.3, 0, '#f2c44f');
  }
}

function leaf(g, x, y, s, a, c) { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, s, s * 0.55, a, 0, TAU); g.fill(); }
function foliage(g, x, y, rad, seed, P, lx = 0.6, ly = -0.8, sq = 0.82) {
  const r = RNG(seed);
  const B = new Path2D(); blob(B, x, y, rad, rad * sq, seed, 0.3, 22);
  g.fillStyle = P.dark; g.fill(B);
  g.save(); g.clip(B);
  const M = new Path2D(); blob(M, x + lx * rad * 0.25, y + ly * rad * 0.25, rad * 0.9, rad * sq * 0.85, seed + 2, 0.35, 20);
  g.fillStyle = P.mid; g.fill(M);
  const Lt = new Path2D(); blob(Lt, x + lx * rad * 0.55, y + ly * rad * 0.55, rad * 0.62, rad * sq * 0.55, seed + 5, 0.4, 18);
  g.fillStyle = P.light; g.fill(Lt);
  const n = Math.min(900, rad * rad * 0.05 + 30);
  for (let i = 0; i < n; i++) {
    const a = r() * TAU, d = Math.sqrt(r()) * rad, px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * sq;
    const l = (Math.cos(a) * lx + Math.sin(a) * ly) * (d / rad) + r.range(-0.35, 0.35);
    const c = l > 0.55 ? P.hi : l > 0.2 ? P.light : l > -0.15 ? P.mid : P.dark;
    leaf(g, px, py, r.range(2, 5.5) * Math.max(0.6, rad / 70), r() * TAU, rgba(jit(c, r, 16), r.range(0.55, 1)));
  }
  g.restore();
  // broken leafy edge
  for (let i = 0; i < rad * 0.9; i++) {
    const a = r() * TAU, d = rad * r.range(0.92, 1.1), px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * sq;
    const l = Math.cos(a) * lx + Math.sin(a) * ly;
    leaf(g, px, py, r.range(2, 5) * Math.max(0.6, rad / 70), r() * TAU, jit(l > 0.4 ? P.light : l > -0.1 ? P.mid : P.dark, r, 12));
  }
}

// one wind-bent tree, reused on-model across shots
const TREE_DAY = { bark: '#6b4f3a', barkSh: '#3f2e2a', barkLit: '#c99a6a', dark: '#2f4a33', mid: '#4f7a3e', light: '#8fb04f', hi: '#e4d37c' };
const TREE_NIGHT = { bark: '#3b3446', barkSh: '#221e30', barkLit: '#6f7aa8', dark: '#141c33', mid: '#22304e', light: '#38507a', hi: '#6f8cc0' };
function drawTree(g, x, gy, s, P, lx = 0.7, ly = -0.7) {
  g.save(); g.translate(x, gy); g.scale(s, s);
  const r = RNG(404);
  // trunk: leaning S-curve
  const trunk = [[0, 0], [8, -80], [30, -170], [70, -250], [120, -310]];
  const T = new Path2D(); const wAt = (i) => 26 - i * 4.5;
  T.moveTo(-30, 6);
  trunk.forEach((p, i) => T.lineTo(p[0] - wAt(i), p[1]));
  for (let i = trunk.length - 1; i >= 0; i--) T.lineTo(trunk[i][0] + wAt(i), trunk[i][1] + 6);
  T.lineTo(34, 6); T.closePath();
  g.fillStyle = P.bark; g.fill(T);
  g.save(); g.clip(T); g.fillStyle = P.barkSh;
  g.beginPath(); g.moveTo(-40, 10); trunk.forEach((p, i) => g.lineTo(p[0] - wAt(i) * 0.1, p[1])); g.lineTo(-60, -320); g.closePath(); g.fill();
  g.fillStyle = rgba(P.barkLit, 0.7);
  g.beginPath(); trunk.forEach((p, i) => g.lineTo(p[0] + wAt(i) * 0.55, p[1])); for (let i = trunk.length - 1; i >= 0; i--) g.lineTo(trunk[i][0] + wAt(i) + 2, trunk[i][1]); g.fill();
  for (let i = 0; i < 40; i++) { const t = r(), yy = -t * 300, xx = lerp(0, 110, t * t) + r.range(-12, 12); g.strokeStyle = rgba(P.barkSh, 0.5); g.lineWidth = r.range(1, 2.5); g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + r.range(-3, 3), yy - r.range(6, 18)); g.stroke(); }
  g.restore();
  ink(g, resample(trunk.map((p, i) => [p[0] - wAt(i), p[1]]).concat([[-30, 6]]).reverse(), 5, 0.6, 3), 3.2, INK, 3);
  ink(g, resample(trunk.map((p, i) => [p[0] + wAt(i), p[1] + 6]), 5, 0.6, 4), 2.6, INK, 4);
  // branches
  const br = [[[40, -200], [-30, -270], [-70, -300]], [[70, -250], [140, -280], [200, -270]], [[100, -295], [90, -360], [60, -400]]];
  g.strokeStyle = P.bark; g.lineCap = 'round';
  br.forEach((b, i) => { g.lineWidth = 9 - i * 2; g.beginPath(); g.moveTo(...b[0]); g.quadraticCurveTo(...b[1], ...b[2]); g.stroke(); ink(g, resample(b, 6, 0.5, 9 + i), 1.6, INK, 9 + i); });
  // crown clumps, back to front
  const cl = [[-70, -320, 70], [40, -400, 95], [170, -300, 70], [-10, -360, 80], [110, -350, 100], [200, -350, 60], [60, -310, 70]];
  cl.forEach(([cx, cy, rr], i) => foliage(g, cx, cy, rr, 50 + i * 7, P, lx, ly));
  g.restore();
}

function pole(g, x, gy, h, s, P) { // wooden telegraph pole; returns crossbar wire anchors
  const w = 7 * s, top = gy - h;
  g.fillStyle = P.wood; g.beginPath(); g.moveTo(x - w, gy); g.lineTo(x - w * 0.6, top); g.lineTo(x + w * 0.6, top); g.lineTo(x + w, gy); g.fill();
  g.fillStyle = P.woodLit; g.beginPath(); g.moveTo(x + w * 0.1, gy); g.lineTo(x + w * 0.1, top); g.lineTo(x + w * 0.6, top); g.lineTo(x + w, gy); g.fill();
  const cb = top + 18 * s, cw = 46 * s;
  g.fillStyle = P.wood; g.fillRect(x - cw, cb - 3 * s, cw * 2, 6 * s);
  const anchors = [];
  for (const k of [-0.85, -0.35, 0.35, 0.85]) { const ax = x + k * cw; dab(g, ax, cb - 5 * s, 2.6 * s, 3.4 * s, 0, P.insul); anchors.push([ax, cb - 7 * s]); }
  if (s > 0.25) { inkLine(g, x - w, gy, x - w * 0.6, top, Math.max(0.6, 1.4 * s), INK, x | 0, 0.3); inkLine(g, x - cw, cb + 3 * s, x + cw, cb + 3 * s, Math.max(0.5, 1.1 * s), INK, (x | 0) + 1, 0.3); }
  return anchors;
}
function wire(g, a, b, sag, col, w = 1) {
  g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(a[0], a[1]);
  g.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + sag * 2, b[0], b[1]); g.stroke();
}

// sign: "终点站"
function drawSign(g, x, gy, s, P) {
  g.save(); g.translate(x, gy); g.scale(s, s);
  const r = RNG(818);
  for (const px of [-78, 78]) {
    g.fillStyle = P.post; g.fillRect(px - 7, -250, 14, 250);
    g.fillStyle = P.postLit; g.fillRect(px - 7, -250, 5, 250);
    ink(g, resample([[px - 7, 0], [px - 7, -250]], 6, 0.4, px), 1.8, INK, 5);
    ink(g, resample([[px + 7, -250], [px + 7, 0]], 6, 0.4, px + 3), 1.4, INK, 6);
  }
  const bw = 210, bh = 92, by = -262;
  g.fillStyle = P.boardSh; rrect(g, -bw / 2 + 4, by + 5, bw, bh, 5); g.fill();
  g.fillStyle = P.board; rrect(g, -bw / 2, by, bw, bh, 5); g.fill();
  g.save(); rrect(g, -bw / 2, by, bw, bh, 5); g.clip();
  g.fillStyle = P.boardSh; g.beginPath(); g.moveTo(-bw / 2, by + bh * 0.7); g.lineTo(bw / 2, by + bh * 0.55); g.lineTo(bw / 2, by + bh); g.lineTo(-bw / 2, by + bh); g.fill();
  for (let i = 0; i < 70; i++) dab(g, r.range(-bw / 2, bw / 2), r.range(by, by + bh), r.range(1, 5), r.range(0.5, 2), r(), rgba(r() < 0.5 ? P.rust : P.boardSh, r.range(0.15, 0.4)));
  g.fillStyle = P.text; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `600 44px ${CJK_FONT}`; g.fillText('终点站', 0, by + 38);
  g.font = `500 14px ${LATIN_FONT}`; g.fillText('L A S T   S T O P', 0, by + 74);
  g.restore();
  ink(g, resample(rrPts(-bw / 2, by, bw, bh, 5), 6, 0.6, 12), 2.2, INK, 12);
  g.restore();
}
// iron lamp post; returns glass rect in layer coords for the live glow
function drawLamp(g, x, gy, s, P) {
  g.save(); g.translate(x, gy); g.scale(s, s);
  g.fillStyle = P.iron; g.beginPath(); g.moveTo(-18, 0); g.lineTo(-9, -40); g.lineTo(-6, -470); g.lineTo(6, -470); g.lineTo(9, -40); g.lineTo(18, 0); g.fill();
  g.fillStyle = P.ironLit; g.fillRect(-6, -470, 4, 430);
  g.fillStyle = P.iron; g.fillRect(-12, -478, 24, 10);
  // lantern
  g.fillStyle = P.iron; g.beginPath(); g.moveTo(-26, -480); g.lineTo(26, -480); g.lineTo(20, -490); g.lineTo(-20, -490); g.fill();
  g.fillStyle = P.glass; g.fillRect(-20, -556, 40, 66);
  g.fillStyle = P.iron; g.fillRect(-22, -560, 44, 6); g.fillRect(-2, -556, 4, 66); g.fillRect(-22, -494, 44, 5);
  g.beginPath(); g.moveTo(-32, -560); g.quadraticCurveTo(0, -600, 32, -560); g.fill();
  g.fillStyle = P.ironLit; g.beginPath(); g.moveTo(4, -566); g.quadraticCurveTo(14, -580, 28, -562); g.lineTo(20, -561); g.fill();
  dab(g, 0, -598, 5, 7, 0, P.iron);
  ink(g, resample([[-18, 0], [-9, -40], [-6, -470]], 6, 0.3, 21), 1.8, INK, 21);
  ink(g, resample([[6, -470], [9, -40], [18, 0]], 6, 0.3, 22), 1.4, INK, 22);
  ink(g, resample([[-32, -560], [0, -588], [32, -560], [-32, -560]], 5, 0.4, 23), 1.6, INK, 23);
  ink(g, resample(rrPts(-20, -556, 40, 66, 1), 5, 0.3, 24), 1.4, INK, 24);
  g.restore();
  return { x: x - 20 * s, y: gy - 556 * s, w: 40 * s, h: 66 * s, cx: x, cy: gy - 523 * s, s };
}
function lampLight(ctx, G, on, warm = '#ffd27a') {
  if (on <= 0) return;
  ctx.save();
  ctx.globalAlpha = on;
  const gr = ctx.createLinearGradient(0, G.y, 0, G.y + G.h);
  gr.addColorStop(0, '#fff6d8'); gr.addColorStop(1, '#ffc65e');
  ctx.fillStyle = gr; ctx.fillRect(G.x + 1, G.y + 1, G.w - 2, G.h - 2);
  ctx.fillStyle = 'rgba(80,50,30,.55)'; ctx.fillRect(G.cx - 2 * G.s, G.y, 4 * G.s, G.h);
  ctx.restore();
  glow(ctx, G.cx, G.cy, 260 * G.s, warm, 0.55 * on);
  glow(ctx, G.cx, G.cy, 70 * G.s, '#fff3cf', 0.7 * on);
}

// railway in screen-space perspective along a centreline C(u) -> [x,y], gauge(u) in px, flatten = ground foreshortening
function paintTrack(g, C, gauge, flatten, P, seed, u0 = 0, u1 = 1) {
  const r = RNG(seed), N = 600, pts = [];
  for (let i = 0; i <= N; i++) { const u = lerp(u0, u1, i / N), p = C(u); pts.push({ u, x: p[0], y: p[1], gw: gauge(u) }); }
  const perp = (i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N, i + 1)];
    let tx = b.x - a.x, ty = (b.y - a.y) / flatten; const d = Math.hypot(tx, ty) || 1; tx /= d; ty /= d;
    return [-ty, tx * flatten];
  };
  // ballast bed
  const L = [], R = [];
  pts.forEach((p, i) => { const [nx, ny] = perp(i); L.push([p.x + nx * p.gw * 0.95, p.y + ny * p.gw * 0.95]); R.push([p.x - nx * p.gw * 0.95, p.y - ny * p.gw * 0.95]); });
  const bed = new Path2D(); bed.moveTo(...L[0]); L.forEach((q) => bed.lineTo(...q)); R.reverse().forEach((q) => bed.lineTo(...q)); bed.closePath();
  g.fillStyle = P.ballast; g.fill(bed);
  g.save(); g.clip(bed);
  for (let i = 0; i < 2600; i++) { const p = pts[Math.floor(r() * N)], [nx, ny] = perp(Math.floor(r() * N)); const o = r.range(-1, 1) * p.gw; dab(g, p.x + nx * o, p.y + ny * o, p.gw * 0.04 + 0.6, p.gw * 0.025 + 0.4, r(), rgba(r() < 0.5 ? P.ballastLit : P.ballastSh, r.range(0.3, 0.7))); }
  g.restore();
  // sleepers by arc length scaled with gauge
  let acc = 0;
  for (let i = 1; i <= N; i++) {
    const p = pts[i], q = pts[i - 1]; acc += Math.hypot(p.x - q.x, (p.y - q.y) / flatten);
    if (acc < p.gw * 0.62) continue; acc = 0;
    const [nx, ny] = perp(i), hw = p.gw * 0.78, th = Math.max(1, p.gw * 0.13);
    let tx = p.x - q.x, ty = p.y - q.y; const d = Math.hypot(tx, ty) || 1; tx /= d; ty /= d;
    g.fillStyle = P.sleeper; g.beginPath();
    g.moveTo(p.x + nx * hw - tx * th, p.y + ny * hw - ty * th); g.lineTo(p.x + nx * hw + tx * th, p.y + ny * hw + ty * th);
    g.lineTo(p.x - nx * hw + tx * th, p.y - ny * hw + ty * th); g.lineTo(p.x - nx * hw - tx * th, p.y - ny * hw - ty * th); g.fill();
    g.fillStyle = rgba(P.sleeperLit, 0.6); g.beginPath();
    g.moveTo(p.x + nx * hw - tx * th, p.y + ny * hw - ty * th); g.lineTo(p.x - nx * hw - tx * th, p.y - ny * hw - ty * th);
    g.lineTo(p.x - nx * hw - tx * th * 0.2, p.y - ny * hw - ty * th * 0.2); g.lineTo(p.x + nx * hw - tx * th * 0.2, p.y + ny * hw - ty * th * 0.2); g.fill();
  }
  // rails
  for (const side of [1, -1]) {
    const rp = pts.map((p, i) => { const [nx, ny] = perp(i); return [p.x + side * nx * p.gw * 0.5, p.y + side * ny * p.gw * 0.5, p.gw]; });
    for (let i = 0; i < N; i++) {
      const a = rp[i], b = rp[i + 1];
      g.strokeStyle = P.rail; g.lineWidth = Math.max(0.8, a[2] * 0.075); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
      g.strokeStyle = P.railLit; g.lineWidth = Math.max(0.5, a[2] * 0.03); g.beginPath(); g.moveTo(a[0], a[1] - a[2] * 0.025); g.lineTo(b[0], b[1] - a[2] * 0.025); g.stroke();
    }
  }
  return pts;
}

// night sky
function stars(g, w, h, n, seed, fade, big = 0.02) {
  const r = RNG(seed);
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = Math.pow(r(), 1.3) * h, a = fade(y) * r.range(0.3, 1);
    if (a <= 0.02) continue;
    const s = r() < big ? r.range(1.6, 2.6) : r.range(0.5, 1.3);
    const c = r() < 0.2 ? '#ffe2b8' : r() < 0.3 ? '#cfe0ff' : '#ffffff';
    dab(g, x, y, s, s, 0, rgba(c, a));
    if (s > 1.7) { g.strokeStyle = rgba(c, a * 0.5); g.lineWidth = 0.7; g.beginPath(); g.moveTo(x - s * 4, y); g.lineTo(x + s * 4, y); g.moveTo(x, y - s * 4); g.lineTo(x, y + s * 4); g.stroke(); glow(g, x, y, s * 7, c, a * 0.35, 'source-over'); }
  }
}
function milkyWay(g, w, h, seed, x0, y0, x1, y1, width, a = 1) {
  const r = RNG(seed), dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 1400; i++) { // soft nebulous dabs
    const u = r(), o = (fbm(u * 6, 1, seed) - 0.5) * width * 0.9 + r.range(-1, 1) * width * 0.6 * (r() < 0.5 ? r() : 1);
    const x = x0 + dx * u + nx * o, y = y0 + dy * u + ny * o, s = r.range(10, 46) * (1 - Math.abs(o) / width);
    if (s < 2) continue;
    dab(g, x, y, s * 1.8, s, Math.atan2(dy, dx) + r.range(-0.3, 0.3), rgba(r() < 0.3 ? '#8a7fc8' : r() < 0.5 ? '#c7a8d6' : '#9fb4e0', 0.025 * a));
  }
  for (let i = 0; i < 4200; i++) { // dense star dust
    const u = r(), o = r.range(-1, 1) * r.range(0, 1) * width;
    const x = x0 + dx * u + nx * o + (fbm(u * 6, 1, seed) - 0.5) * width * 0.9 * nx, y = y0 + dy * u + ny * o + (fbm(u * 6, 1, seed) - 0.5) * width * 0.9 * ny;
    dab(g, x, y, r.range(0.4, 1.1), r.range(0.4, 1.1), 0, rgba('#ffffff', r.range(0.15, 0.7) * a));
  }
  g.restore();
  g.save(); // dust lanes
  for (let i = 0; i < 160; i++) {
    const u = r(), o = (fbm(u * 6 + 3, 1, seed) - 0.5) * width * 0.6;
    dab(g, x0 + dx * u + nx * o, y0 + dy * u + ny * o, r.range(20, 70), r.range(6, 18), Math.atan2(dy, dx) + r.range(-0.4, 0.4), rgba('#0b1230', 0.12 * a));
  }
  g.restore();
}
function moon(g, x, y, rad, col, skyC) {
  glow(g, x, y, rad * 6, '#cfd8ff', 0.25, 'lighter');
  g.fillStyle = col; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill();
  g.fillStyle = skyC; g.beginPath(); g.arc(x - rad * 0.42, y - rad * 0.18, rad * 0.92, 0, TAU); g.fill();
}

function bird(ctx, x, y, s, ph, col) {
  const f = Math.sin(ph) * 0.8;
  ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, 1.6 * s); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 9 * s, y - 5 * s * f); ctx.quadraticCurveTo(x - 4 * s, y - 3 * s * f - 2 * s, x, y);
  ctx.quadraticCurveTo(x + 4 * s, y - 3 * s * f - 2 * s, x + 9 * s, y - 5 * s * f); ctx.stroke();
}
function seed(ctx, x, y, s, a) { // dandelion fluff
  ctx.strokeStyle = `rgba(255,250,235,${a})`; ctx.lineWidth = Math.max(0.5, 0.7 * s);
  ctx.beginPath(); for (let k = 0; k < 7; k++) { const an = (k / 7) * TAU; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(an) * 4 * s, y + Math.sin(an) * 4 * s - 1.5 * s); } ctx.stroke();
  dab(ctx, x, y, 1.1 * s, 1.1 * s, 0, `rgba(255,248,230,${a})`);
}
// swaying foreground tufts (animated on twos)
function liveGrass(ctx, t, o) {
  const r = RNG(o.seed), tt = twos(t);
  for (let i = 0; i < o.n; i++) {
    const x = r.range(o.x0, o.x1), by = o.y + r.range(-o.dy || 0, o.dy || 0), h = r.range(o.h0, o.h1), ph = r() * TAU;
    const c = jit(r.pick(o.cols), r, 14), w = Math.max(1.5, h * r.range(0.05, 0.085));
    const gust = o.gust ? o.gust(tt, x) : 0;
    const sway = (Math.sin(tt * 1.6 + ph + x * 0.003) * 0.55 + Math.sin(tt * 0.7 + x * 0.0017) * 0.45) * h * 0.13 * (o.wind || 1) + gust * h;
    blade(ctx, x, by, h, r.range(-0.25, 0.3) * h + sway, w, c);
  }
}
