// ───────────────────────── 《青苔电车》: art vocabulary for a hand-painted sunrise forest ─────────────────────────
DUR = 75;
const FILM_FONT = '"FilmSerif",' + CJK_FONT;
const MZ = {
  ink: '#2c2a2b',
  leaf: { dark: '#1f3d2b', mid: '#386431', light: '#6f9a3f', hi: '#bccd63' },
  leafSun: { dark: '#2c4c2c', mid: '#4f7d35', light: '#93b449', hi: '#e0dc7c' },
  leafFar: { dark: '#86a597', mid: '#9dbba5', light: '#bcd0ad', hi: '#dbe2bb' },
  leafMid: { dark: '#4f7a5c', mid: '#6c9566', light: '#98b778', hi: '#c9d595' },
  moss: { dark: '#3a6630', mid: '#6b973a', light: '#a6c255', hi: '#dfe08a' },
  mossDeep: { dark: '#2a4a2a', mid: '#4b7a33', light: '#86ab45', hi: '#c5cf6a' },
  bark: { dark: '#2b2a24', mid: '#463c2e', lit: '#76674a', moss: '#2f5530', mossLit: '#557f38' },
  barkMid: { dark: '#6e7a68', mid: '#8a937c', lit: '#aeb397', moss: '#7d9873', mossLit: '#a4b98a' },
  barkFar: { dark: '#a9b7a4', mid: '#bcc6b0', lit: '#d6dbc4', moss: '#adc0a2', mossLit: '#c8d4b2' },
  haze: '#eee6c8', mist: '#f7eed6', sun: '#fff2c8',
  flowers: ['#f6f3ea', '#f6f3ea', '#efe9ff', '#c9b8ef', '#fff7d6'],
};

// rhombic leaf dab: the basic unit of every bush, crown, moss bed
function qd(g, x, y, s, a, c) {
  const ca = Math.cos(a) * s, sa = Math.sin(a) * s;
  g.fillStyle = c; g.beginPath();
  g.moveTo(x - ca * 0.95 + sa * 0.35, y - sa * 0.95 - ca * 0.35);
  g.lineTo(x + ca * 0.25 + sa * 0.62, y + sa * 0.25 - ca * 0.62);
  g.lineTo(x + ca * 0.95 - sa * 0.3, y + sa * 0.95 + ca * 0.3);
  g.lineTo(x - ca * 0.2 - sa * 0.6, y - sa * 0.2 + ca * 0.6);
  g.fill();
}
// a clump of foliage: lighting + value noise, posterised into flat tones on a coarse grid and
// enlarged without smoothing, so the edges come out ragged and blocky like painted cel backgrounds
function dabClump(g, x, y, rx, ry, seed, P, o = {}) {
  const lx = o.lx ?? 0.55, ly = o.ly ?? -0.83, cs = o.cs ?? clamp((o.ds ?? rx / 22) * 0.62, 1.2, 5);
  const pad = 1.28, w = rx * 2 * pad, h = ry * 2 * pad, x0 = x - rx * pad, y0 = y - ry * pad;
  const cw = Math.max(2, Math.round(w / cs)), ch = Math.max(2, Math.round(h / cs));
  const c = document.createElement('canvas'); c.width = cw; c.height = ch;
  const cg = c.getContext('2d'), im = cg.createImageData(cw, ch), d = im.data;
  const deep = P.deep || mixc(P.dark, '#0e1a14', 0.35);
  const T = [hex(deep), hex(P.dark), hex(P.mid), hex(P.light), hex(P.hi)];
  const sc = o.leaf ?? 16, rough = o.rough ?? 0.55, bias = o.bias ?? 0, ss = seed * 0.37;
  for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) {
    const wx = x0 + (i + 0.5) * cs, wy = y0 + (j + 0.5) * cs, u = (wx - x) / rx, v = (wy - y) / ry;
    const n1 = fbm(wx / (sc * 2.2) + ss, wy / (sc * 2.2), seed, 3), n2 = vnoise(wx / (sc * 0.55), wy / (sc * 0.55), seed + 9);
    const f = 1 - (u * u + v * v) + (n1 - 0.5) * 2 * rough + (n2 - 0.5) * 0.25;
    if (f < 0) continue;
    const lit = (u * lx + v * ly) * 0.7 + (n1 - 0.5) * 1.3 + (n2 - 0.5) * 0.45 + Math.min(f, 0.4) * 0.35 + bias;
    const k = lit > 0.72 ? 4 : lit > 0.3 ? 3 : lit > -0.08 ? 2 : lit > -0.42 ? 1 : 0;
    const q = (j * cw + i) * 4, C = T[k]; d[q] = C[0]; d[q + 1] = C[1]; d[q + 2] = C[2]; d[q + 3] = 255;
  }
  cg.putImageData(im, 0, 0);
  g.save(); g.imageSmoothingEnabled = false; g.drawImage(c, x0, y0, cw * cs, ch * cs); g.restore();
}
// a tree crown: one mass + bulges, painted back to front
function crown(g, x, y, w, h, seed, P, o = {}) {
  const r = RNG(seed), parts = [];
  const n = o.n ?? 6;
  for (let i = 0; i < n; i++) {
    const u = r.range(-0.42, 0.42), up = 1 - Math.abs(u) * 1.4;
    parts.push([x + u * w, y - h * 0.18 - up * h * r.range(0.05, 0.32), w * r.range(0.2, 0.32), h * r.range(0.22, 0.34)]);
  }
  parts.push([x, y, w * 0.48, h * 0.4]);
  parts.sort((a, b) => a[1] - b[1]);
  dabClump(g, x, y - h * 0.08, w * 0.45, h * 0.42, seed + 1, P, { ...o, edge: 0.2 });
  parts.forEach((p, i) => dabClump(g, p[0], p[1], p[2], p[3], seed * 7 + i, P, o));
}

// posterised value-noise mask: flat colour islands (wear, rust, moss, dust)
function noiseMask(x0, y0, w, h, o) {
  const res = o.res ?? 0.5, cw = Math.max(2, Math.round(w * Q * res)), ch = Math.max(2, Math.round(h * Q * res));
  const c = document.createElement('canvas'); c.width = cw; c.height = ch;
  const g = c.getContext('2d'), im = g.createImageData(cw, ch), d = im.data, cols = o.bands.map((b) => hex(b.c));
  const sx = o.sx ?? 40, sy = o.sy ?? o.sx ?? 40, oct = o.oct ?? 3, seed = o.seed ?? 1, k = 1 / (Q * res);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const ux = x0 + x * k, uy = y0 + y * k;
    let n = fbm(ux / sx, uy / sy, seed, oct);
    if (o.shape) n += o.shape(ux, uy);
    for (let b = 0; b < o.bands.length; b++) {
      const B = o.bands[b];
      if (n >= B.lo && n < (B.hi ?? 9)) { const i = (y * cw + x) * 4, C = cols[b]; d[i] = C[0]; d[i + 1] = C[1]; d[i + 2] = C[2]; d[i + 3] = 255 * (B.a ?? 1); break; }
    }
  }
  g.putImageData(im, 0, 0);
  return c;
}
function patches(g, clipPath, x, y, w, h, o) {
  const m = noiseMask(x, y, w, h, o);
  g.save(); if (clipPath) g.clip(clipPath); g.imageSmoothingEnabled = true; g.drawImage(m, x, y, w, h); g.restore();
}

// tall trunk with bark strokes, moss islands and a jagged inked edge
function trunk(g, o) {
  const r = RNG(o.seed), P = o.P, N = 40, L = [], R = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, y = lerp(o.top, o.bot, u), w = o.w * (1 + (o.flare ?? 0.35) * Math.pow(u, 6)) * (0.92 + 0.08 * (1 - u));
    const cx = o.x + (o.lean ?? 0) * (u - 1) * (o.bot - o.top) + (fbm(u * 3, o.seed, 4) - 0.5) * o.w * 0.4;
    L.push([cx - w / 2 + (vnoise(u * 40, 1, o.seed) - 0.5) * 2.4, y]); R.push([cx + w / 2 + (vnoise(u * 40, 2, o.seed) - 0.5) * 2.4, y]);
  }
  if (o.roots) { L[N][0] -= o.w * 0.5; R[N][0] += o.w * 0.5; }
  const T = new Path2D(); T.moveTo(...L[0]); L.forEach((p) => T.lineTo(...p)); R.slice().reverse().forEach((p) => T.lineTo(...p)); T.closePath();
  g.fillStyle = P.dark; g.fill(T);
  g.save(); g.clip(T);
  // lit side (sun on the right)
  g.fillStyle = P.mid; g.beginPath(); R.forEach((p, i) => (i ? g.lineTo(p[0] - o.w * 0.42, p[1]) : g.moveTo(p[0] - o.w * 0.42, p[1]))); R.slice().reverse().forEach((p) => g.lineTo(p[0] + 2, p[1])); g.fill();
  g.fillStyle = P.lit; g.beginPath(); R.forEach((p, i) => (i ? g.lineTo(p[0] - o.w * 0.13, p[1]) : g.moveTo(p[0] - o.w * 0.13, p[1]))); R.slice().reverse().forEach((p) => g.lineTo(p[0] + 2, p[1])); g.fill();
  for (let i = 0; i < (o.bot - o.top) * o.w * 0.012; i++) { // bark fissures
    const u = r(), y = lerp(o.top, o.bot, u), xi = Math.round(u * N), xl = L[xi][0], xr = R[xi][0], x = lerp(xl, xr, r());
    g.strokeStyle = rgba(r() < 0.6 ? P.dark : P.lit, r.range(0.35, 0.8)); g.lineWidth = r.range(0.8, 2.2);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + r.range(-2, 2), y + r.range(6, 26)); g.stroke();
  }
  if (o.moss !== false) {
    const minX = Math.min(...L.map((p) => p[0])) - 4, maxX = Math.max(...R.map((p) => p[0])) + 4;
    patches(g, T, minX, o.top, maxX - minX, o.bot - o.top, { sx: Math.min(30, o.w * 0.22), sy: Math.min(80, o.w * 0.6), seed: o.seed + 3, bands: [{ lo: 0.6, hi: 0.68, c: P.moss }, { lo: 0.68, c: P.mossLit }], res: o.res ?? 0.5 });
  }
  g.restore();
  if (o.ink) { ink(g, L.map((p) => [p[0], p[1]]), o.ink, MZ.ink, o.seed, 0.9); ink(g, R.map((p) => [p[0], p[1]]), o.ink * 0.8, MZ.ink, o.seed + 1, 0.8); }
  return { L, R };
}
// hanging vine: a strand of leaf dabs
function vine(g, x, y, len, seed, P, s = 1, sway = 0) {
  const r = RNG(seed);
  g.strokeStyle = P.dark; g.lineWidth = 1.2 * s; g.beginPath(); g.moveTo(x, y);
  const pts = [];
  for (let d = 0; d <= len; d += 5 * s) { const u = d / len, px = x + Math.sin(u * 3 + seed) * 6 * s + sway * u * u * len * 0.15, py = y + d; pts.push([px, py]); g.lineTo(px, py); }
  g.stroke();
  pts.forEach(([px, py], i) => {
    const u = i / pts.length, k = (1 - u * 0.6) * s, side = i % 2 ? 1 : -1;
    const c = r() < 0.35 ? P.light : r() < 0.6 ? P.mid : r() < 0.85 ? P.dark : P.hi;
    qd(g, px + side * 4 * k, py, r.range(3.5, 6.5) * k, side * 0.9 + r.range(-0.4, 0.4) + Math.PI / 2, c);
    if (r() < 0.5) qd(g, px - side * 3 * k, py + 2, r.range(3, 5) * k, -side * 0.9 + Math.PI / 2, r() < 0.5 ? P.mid : P.dark);
  });
}
// band of canopy across the top of a frame, with vines spilling down
function canopyTop(g, w, y, h, seed, P, o = {}) {
  const r = RNG(seed);
  g.fillStyle = P.dark; g.fillRect(-20, -20, w + 40, y + 20);
  for (let x = -60; x < w + 80; x += r.range(70, 140)) dabClump(g, x, y + r.range(-h * 0.25, h * 0.35), r.range(70, 150), r.range(40, 80), seed + x, P, { lx: 0.3, ly: 0.95, bias: -0.25, ds: o.ds ?? 4.2 });
  if (o.vines !== false) for (let i = 0; i < (o.nv ?? w / 26); i++) { const x = r.range(-20, w + 20); if (o.skip && o.skip(x)) continue; vine(g, x, y + r.range(-10, h * 0.5), r.range(o.v0 ?? 60, o.v1 ?? 260), seed * 13 + i, P, o.vs ?? 1); }
}
function mistBand(g, x0, x1, y, h, col, a, seed) {
  const r = RNG(seed);
  const gr = g.createLinearGradient(0, y - h, 0, y + h); gr.addColorStop(0, rgba(col, 0)); gr.addColorStop(0.5, rgba(col, a)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.fillRect(x0, y - h, x1 - x0, h * 2);
  for (let i = 0; i < (x1 - x0) / 18; i++) { const x = r.range(x0, x1), yy = y + r.range(-h, h) * 0.6; dab(g, x, yy, r.range(60, 200), r.range(10, 26), r.range(-0.05, 0.05), rgba(col, a * r.range(0.06, 0.2))); }
}
function clover(g, r, n, area, P, s = 1) {
  for (let i = 0; i < n; i++) { const p = area(r); if (!p) continue; const [x, y, k] = p, c = r() < 0.5 ? P.mid : r() < 0.7 ? P.light : r() < 0.9 ? P.dark : P.hi; qd(g, x, y, r.range(2.5, 6) * k * s, r.range(-0.4, 0.4), c); }
}
function starFlowers(g, r, n, area, s = 1) {
  for (let i = 0; i < n; i++) {
    const p = area(r); if (!p) continue; const [x, y, k] = p, c = r.pick(MZ.flowers), sz = r.range(2, 3.6) * k * s;
    g.strokeStyle = rgba('#3f6b35', 0.9); g.lineWidth = Math.max(0.6, 0.8 * k * s); g.beginPath(); g.moveTo(x, y); g.lineTo(x + r.range(-2, 2) * k, y + 10 * k * s); g.stroke();
    for (let j = 0; j < 5; j++) { const a = (j / 5) * TAU + r(); qd(g, x + Math.cos(a) * sz * 0.85, y + Math.sin(a) * sz * 0.85, sz * 0.75, a, c); }
    dab(g, x, y, sz * 0.32, sz * 0.32, 0, '#f0c24c');
  }
}
function grassClump(g, x, y, h, n, seed, cols, lean = 0) {
  const r = RNG(seed);
  for (let i = 0; i < n; i++) { const hh = h * r.range(0.4, 1.1), bx = x + r.range(-h * 0.25, h * 0.25); blade(g, bx, y, hh, (r.range(-0.35, 0.35) + lean) * hh, Math.max(1.2, hh * 0.07), r.pick(cols)); }
}
// two-tone posterised dust (for the ground giving way)
function dustTexture(w, h, seed) {
  const L = mk(w, h);
  const m = noiseMask(0, 0, w, h, { sx: 70, sy: 46, seed, oct: 4, res: 0.5, shape: (x, y) => { const u = (x / w - 0.5) * 2, v = (y / h - 0.92) * 1.15; return 0.55 * (1 - Math.pow(u * u + v * v, 0.8)) - 0.3; },
    bands: [{ lo: 0.3, hi: 0.47, c: '#a58f80' }, { lo: 0.47, hi: 0.56, c: '#c4ae98' }, { lo: 0.56, c: '#ead6b8' }] });
  L.g.imageSmoothingEnabled = true; L.g.drawImage(m, 0, 0, w, h);
  return L;
}
// warm sunbeams, live
function beams(ctx, x, y, list, a, col = '#fff0c0') {
  if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (const [ang, w, len, k] of list) {
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    const gr = ctx.createLinearGradient(x, y, x + dx * len, y + dy * len);
    gr.addColorStop(0, rgba(col, 0.0)); gr.addColorStop(0.15, rgba(col, 0.32 * a * k)); gr.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = gr; ctx.beginPath();
    ctx.moveTo(x + nx * w * 0.15, y + ny * w * 0.15); ctx.lineTo(x + dx * len + nx * w, y + dy * len + ny * w);
    ctx.lineTo(x + dx * len - nx * w, y + dy * len - ny * w); ctx.lineTo(x - nx * w * 0.15, y - ny * w * 0.15); ctx.fill();
  }
  ctx.restore();
}

// the little blue bird (on-model in every shot)
const BIRD = { body: '#3f7cc6', bodySh: '#2d5c9c', wing: '#2b5596', wingHi: '#6aa0dc', belly: '#f5f1e6', bellySh: '#cfd2d8', cheek: '#e2733f', beak: '#3a2a22', eye: '#1c1a1f', ink: '#1e2433' };
function blueBird(ctx, x, y, s, o = {}) {
  // o: flip (face left), flap (0..1 wing phase, null = folded), head (tilt radians), hop (squash)
  ctx.save(); ctx.translate(x, y); ctx.scale(o.flip ? -s : s, s); ctx.rotate(o.tilt || 0);
  const sq = o.hop ? 1 - o.hop * 0.12 : 1; ctx.scale(1 / sq, sq);
  const B = BIRD;
  // tail
  ctx.fillStyle = B.wing; ctx.beginPath(); ctx.moveTo(-14, -6); ctx.lineTo(-34, -14); ctx.lineTo(-33, -6); ctx.lineTo(-14, 2); ctx.fill();
  ctx.strokeStyle = B.ink; ctx.lineWidth = 1.1; ctx.stroke();
  // legs
  if (o.flap == null) { ctx.strokeStyle = '#4a3a34'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-2, 8); ctx.lineTo(-3, 15); ctx.moveTo(4, 8); ctx.lineTo(4, 15); ctx.stroke(); }
  // far wing when flying
  if (o.flap != null) { const f = Math.sin(o.flap * TAU); ctx.fillStyle = B.bodySh; ctx.beginPath(); ctx.moveTo(-4, -10); ctx.quadraticCurveTo(-12, -24 - 18 * f, 2, -36 * f - 6); ctx.quadraticCurveTo(6, -18, 6, -10); ctx.fill(); }
  // body
  ctx.fillStyle = B.body; ctx.beginPath(); ctx.ellipse(0, -2, 17, 13, -0.15, 0, TAU); ctx.fill();
  ctx.fillStyle = B.belly; ctx.beginPath(); ctx.ellipse(3, 3, 12, 8.5, -0.2, 0, TAU); ctx.fill();
  ctx.fillStyle = B.bellySh; ctx.beginPath(); ctx.ellipse(1, 7, 9, 3.5, -0.2, 0, TAU); ctx.fill();
  // head
  ctx.save(); ctx.translate(10, -10); ctx.rotate(o.head || 0);
  ctx.fillStyle = B.body; ctx.beginPath(); ctx.arc(0, 0, 9.5, 0, TAU); ctx.fill();
  ctx.fillStyle = B.belly; ctx.beginPath(); ctx.ellipse(4, 4, 6, 4.2, 0.3, 0, TAU); ctx.fill();
  ctx.fillStyle = B.cheek; ctx.beginPath(); ctx.arc(3, 5.5, 2.6, 0, TAU); ctx.fill();
  ctx.fillStyle = B.beak; ctx.beginPath(); ctx.moveTo(8, -1); ctx.lineTo(15, 1); ctx.lineTo(8, 3); ctx.fill();
  ctx.fillStyle = B.eye; ctx.beginPath(); ctx.arc(4.5, -1.5, o.blink ? 0.6 : 2.1, 0, TAU); ctx.fill();
  if (!o.blink) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(5.2, -2.3, 0.7, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = B.ink; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(0, 0, 9.5, -2.6, 1.2); ctx.stroke();
  ctx.restore();
  // near wing
  ctx.fillStyle = B.wing;
  if (o.flap == null) { ctx.beginPath(); ctx.moveTo(-12, -8); ctx.quadraticCurveTo(2, -14, 8, -4); ctx.quadraticCurveTo(-2, 6, -18, -2); ctx.fill(); ctx.strokeStyle = B.wingHi; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-10, -5); ctx.quadraticCurveTo(-2, -8, 4, -3); ctx.stroke(); }
  else { const f = Math.sin(o.flap * TAU); ctx.beginPath(); ctx.moveTo(-6, -6); ctx.quadraticCurveTo(-18, -20 - 22 * f, -4, -40 * f - 2); ctx.quadraticCurveTo(10, -18 * f, 8, -4); ctx.fill(); ctx.strokeStyle = B.ink; ctx.lineWidth = 1; ctx.stroke(); }
  ctx.strokeStyle = B.ink; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(0, -2, 17, 13, -0.15, 0.3, 3.3); ctx.stroke();
  ctx.restore();
}

// subtitles: quiet, centred, lower third
function caption(ctx, text, a, y = 930) {
  if (a <= 0 || !text) return;
  ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `500 40px ${FILM_FONT}`;
  const chars = [...text], sp = 46, put = () => chars.forEach((c, i) => ctx.fillText(c, W / 2 + (i - (chars.length - 1) / 2) * sp, y));
  ctx.shadowColor = 'rgba(28,24,18,.9)'; ctx.shadowBlur = 22; ctx.fillStyle = 'rgba(40,32,24,.35)'; put();
  ctx.shadowBlur = 6; ctx.shadowColor = 'rgba(28,24,18,.8)'; ctx.fillStyle = '#fbf5e6'; put();
  ctx.restore();
}
function capWindow(t, t0, t1, f = 0.7) { return ease(t0, t0 + f, t) * (1 - ease(t1 - f, t1, t)); }

function butterfly(ctx, x, y, s, ph, col = '#fbf6ea') {
  const f = Math.abs(Math.sin(ph)), w = 7 * s;
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.ellipse(-w * 0.55 * f, -2 * s, w * f + 0.6, w * 0.8, -0.4, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(w * 0.55 * f, -2 * s, w * f + 0.6, w * 0.8, 0.4, 0, TAU); ctx.fill();
  ctx.fillStyle = mixc(col, '#c9b88a', 0.5); ctx.beginPath(); ctx.ellipse(-w * 0.4 * f, 3 * s, w * 0.6 * f + 0.4, w * 0.5, -0.6, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(w * 0.4 * f, 3 * s, w * 0.6 * f + 0.4, w * 0.5, 0.6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3a3330'; ctx.fillRect(-0.7 * s, -5 * s, 1.4 * s, 9 * s);
  ctx.restore();
}
function butterflies(ctx, t, seed, n, x0, x1, y0, y1) {
  const r = RNG(seed), tt = twos(t);
  for (let i = 0; i < n; i++) { const cx = r.range(x0, x1), cy = r.range(y0, y1), A = r.range(60, 160), ph = r() * TAU, sp = r.range(0.25, 0.5); butterfly(ctx, cx + Math.sin(tt * sp + ph) * A + Math.sin(tt * 1.7 + i) * 18, cy + Math.cos(tt * sp * 1.3 + ph) * A * 0.4 + Math.sin(tt * 2.3 + i) * 10, 1.3, t * 16 + i * 2, i % 2 ? '#fbf6ea' : '#f6e9a8'); }
}
function feather(ctx, x, y, s, a) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s);
  ctx.fillStyle = BIRD.body; ctx.beginPath(); ctx.moveTo(0, -18); ctx.quadraticCurveTo(7, -6, 4, 12); ctx.quadraticCurveTo(0, 16, -3, 12); ctx.quadraticCurveTo(-7, -6, 0, -18); ctx.fill();
  ctx.fillStyle = BIRD.wingHi; ctx.beginPath(); ctx.moveTo(0, -16); ctx.quadraticCurveTo(4, -6, 2, 8); ctx.lineTo(0, 8); ctx.fill();
  ctx.strokeStyle = '#2a3a5a'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(0, 20); ctx.stroke();
  ctx.restore();
}
