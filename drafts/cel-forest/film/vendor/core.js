// ───────────────────────── core: math, noise, color, canvas, brushes ─────────────────────────
const W = 1920, H = 1080, FPS = 24;
let DUR = 60; // each film sets its own length
let Q = 1; // render quality scale (1 = 1920×1080)
const CJK_FONT = '"Noto Serif SC","Source Han Serif SC","Songti SC","STSong","SimSun","Noto Sans SC","PingFang SC","Microsoft YaHei","WenQuanYi Zen Hei",serif';
const LATIN_FONT = '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif';

const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => ((t = clamp(t)), t * t * (3 - 2 * t));
const ease = (a, b, t) => smooth((t - a) / (b - a));
const easeIO = (t) => ((t = clamp(t)), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
const easeIn = (t) => Math.pow(clamp(t), 3);
const twos = (t) => Math.floor(t * 12 + 1e-6) / 12; // animate "on twos" like hand-drawn anime
const TAU = Math.PI * 2;

function hash(x, y, s) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul((s | 0) + 1013, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vnoise(x, y, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, s = 0, o = 4) {
  let v = 0, a = 0.5, f = 1, n = 0;
  for (let i = 0; i < o; i++) { v += a * vnoise(x * f, y * f, s + i * 31); n += a; f *= 2.03; a *= 0.5; }
  return v / n;
}
function RNG(seed) {
  let a = (seed * 2654435761) >>> 0;
  const f = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  f.range = (lo, hi) => lo + (hi - lo) * f();
  f.pick = (arr) => arr[Math.floor(f() * arr.length)];
  return f;
}

// ── color
const _hc = new Map();
function hex(c) {
  let v = _hc.get(c);
  if (!v) { const s = c.replace('#', ''); v = [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]; _hc.set(c, v); }
  return v;
}
const toHex = (r, g, b) => '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
function mixc(a, b, t) { const A = hex(a), B = hex(b); return toHex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)); }
function rgba(c, a) { const A = hex(c); return `rgba(${A[0]},${A[1]},${A[2]},${a})`; }
function jit(c, r, amt) { const A = hex(c), k = (r() - 0.5) * amt; return toHex(A[0] + k + (r() - 0.5) * amt * 0.5, A[1] + k + (r() - 0.5) * amt * 0.5, A[2] + k + (r() - 0.5) * amt * 0.5); }
function stopsAt(stops, u) {
  if (u <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) if (u <= stops[i][0]) return mixc(stops[i - 1][1], stops[i][1], (u - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]));
  return stops[stops.length - 1][1];
}

// ── canvases. Layers are authored in 1920-space units and stored at Q resolution.
function mk(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * Q)); c.height = Math.max(1, Math.round(h * Q));
  const g = c.getContext('2d');
  g.setTransform(Q, 0, 0, Q, 0, 0);
  c.w = w; c.h = h; c.g = g;
  return c;
}
// draw a viewport (sx,sy, zoom z) of a layer to the full frame
function view(ctx, L, sx, sy, z = 1) {
  const sw = W / z, sh = H / z;
  ctx.drawImage(L, sx * Q, sy * Q, sw * Q, sh * Q, 0, 0, W, H);
}
// set ctx transform so layer coordinates map to screen for viewport (sx,sy,z)
function camT(ctx, sx, sy, z = 1) { ctx.setTransform(Q * z, 0, 0, Q * z, -sx * Q * z, -sy * Q * z); }
const resetT = (ctx) => ctx.setTransform(Q, 0, 0, Q, 0, 0);

function rrect(g, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

// irregular hand-cut blob (no perfect circles)
function blob(p, cx, cy, rx, ry, seed, rough = 0.12, n = 18) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const k = 1 + rough * (fbm(Math.cos(a) * 1.4 + seed * 7.13, Math.sin(a) * 1.4 + seed * 3.31, seed | 0, 3) - 0.5) * 2.2;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  const m = (i) => { const a = pts[(i + n) % n], b = pts[(i + 1 + n) % n]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
  const s = m(-1); p.moveTo(s[0], s[1]);
  for (let i = 0; i < n; i++) { const c = pts[i], e = m(i); p.quadraticCurveTo(c[0], c[1], e[0], e[1]); }
  p.closePath();
}

// ── hand-inked line: resampled polyline, slight wobble, pressure-varied width
function resample(pts, step = 5, wob = 0.6, seed = 1, closed = false) {
  const P = closed ? pts.concat([pts[0]]) : pts, out = [];
  let acc = 0;
  for (let i = 0; i < P.length - 1; i++) {
    const [x1, y1] = P[i], [x2, y2] = P[i + 1];
    const d = Math.hypot(x2 - x1, y2 - y1); if (d < 1e-6) continue;
    const nx = -(y2 - y1) / d, ny = (x2 - x1) / d;
    for (let s = 0; s < d; s += step) {
      const u = s / d, w = (vnoise((acc + s) * 0.02, seed, seed) - 0.5) * 2 * wob;
      out.push([lerp(x1, x2, u) + nx * w, lerp(y1, y2, u) + ny * w]);
    }
    acc += d;
  }
  out.push(P[P.length - 1]);
  return out;
}
function ink(g, pts, w = 2, col = '#3a2924', seed = 1, alpha = 1) {
  const n = pts.length; if (n < 2) return;
  g.save(); g.strokeStyle = col; g.globalAlpha = alpha; g.lineCap = 'round'; g.lineJoin = 'round';
  for (let i = 0; i < n - 1; i++) {
    const u = i / (n - 1);
    const taper = Math.min(1, u * 6, (1 - u) * 6) * 0.55 + 0.45;
    const pr = 0.55 + 0.75 * vnoise(i * 0.09, seed * 1.7, seed);
    g.lineWidth = Math.max(0.35, w * taper * pr);
    g.beginPath(); g.moveTo(pts[i][0], pts[i][1]); g.lineTo(pts[i + 1][0], pts[i + 1][1]); g.stroke();
  }
  g.restore();
}
function inkLine(g, x1, y1, x2, y2, w, col, seed, wob = 0.5) { ink(g, resample([[x1, y1], [x2, y2]], 4, wob, seed), w, col, seed); }
function rrPts(x, y, w, h, r, k = 6) {
  const out = [], c = [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]];
  for (const [cx, cy, a0] of c) for (let i = 0; i <= k; i++) { const a = a0 + (i / k) * (Math.PI / 2); out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  out.push(out[0]);
  return out;
}

// ── brushes
function dab(g, x, y, rx, ry, a, col) { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, Math.max(0.3, rx), Math.max(0.3, ry), a, 0, TAU); g.fill(); }
function blade(g, x, y, h, lean, w, c) {
  g.fillStyle = c; g.beginPath(); g.moveTo(x - w * 0.5, y);
  g.quadraticCurveTo(x + lean * 0.25 - w * 0.2, y - h * 0.55, x + lean, y - h);
  g.quadraticCurveTo(x + lean * 0.25 + w * 0.35, y - h * 0.5, x + w * 0.5, y);
  g.closePath(); g.fill();
}

// paper / gouache grain baked into every background so the paint has tooth
let PAPER = null;
function paperCanvas() {
  if (PAPER) return PAPER;
  const s = 512, c = document.createElement('canvas'); c.width = c.height = s;
  const g = c.getContext('2d'), im = g.createImageData(s, s), d = im.data, r = RNG(9);
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const lo = fbm(x / 26, y / 26, 5, 3), fi = r();
    const fib = vnoise(x / 3, y / 1.2, 8); // faint fibres
    const v = 128 + (lo - 0.5) * 70 + (fi - 0.5) * 46 + (fib - 0.5) * 24;
    const i = (y * s + x) * 4; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  return (PAPER = c);
}
function paperize(L, alpha = 0.32) {
  const m = document.createElement('canvas'); m.width = L.width; m.height = L.height;
  const mg = m.getContext('2d');
  mg.fillStyle = mg.createPattern(paperCanvas(), 'repeat'); mg.fillRect(0, 0, m.width, m.height);
  mg.globalCompositeOperation = 'destination-in'; mg.drawImage(L, 0, 0); // texture masked to the layer's own alpha
  const g = L.g; g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'soft-light'; g.globalAlpha = alpha; g.drawImage(m, 0, 0); g.restore();
}

const GLOW_CACHE = new Map();
function glowSprite(col) { // cached soft light sprite per colour (far cheaper than a gradient per call)
  let c = GLOW_CACHE.get(col);
  if (!c) {
    c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, rgba(col, 1)); gr.addColorStop(0.25, rgba(col, 0.45)); gr.addColorStop(0.6, rgba(col, 0.12)); gr.addColorStop(1, rgba(col, 0));
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256); GLOW_CACHE.set(col, c);
  }
  return c;
}
function glow(g, x, y, r, col, a = 1, mode = 'lighter') {
  if (a <= 0 || r <= 0) return;
  g.save(); g.globalCompositeOperation = mode; g.globalAlpha *= Math.min(1, a);
  g.drawImage(glowSprite(col), x - r, y - r, r * 2, r * 2); g.restore();
}
