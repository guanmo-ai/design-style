// 超扁平候选图共用：金箔底、琳派的云、带脸的小花、大眼睛的麻薯角色、贴纸描边字。
// 全部是 Canvas 2D 平涂 + 粗黑线；填色比线偏 3px（丝网印刷的套色偏移），没有一处渐变阴影。
export function rng(seed = 1) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
export const INK = '#1A1410';
export const PAL = ['#FF4FA3', '#19C3F0', '#9BE14A', '#FF8A1F', '#8B5CF6', '#FF3B3B', '#FFD21F', '#FFFFFF', '#FF9EC9', '#3D6BFF'];
const MIS = [3, 2];   // 套色偏移

// 金箔：一格一格贴上去，每格亮度不同、有接缝和皱纹，再压一道斜着的反光
export function goldLeaf(x, W, H, { tile = 176, seed = 3, sheen = 0.5, base = ['#B8892F', '#E9C978'] } = {}) {
  const r = rng(seed);
  x.fillStyle = base[0]; x.fillRect(0, 0, W, H);
  for (let ty = -1; ty * tile < H + tile; ty++) for (let tx = -1; tx * tile < W + tile; tx++) {
    const ox = tx * tile + (ty % 2 ? tile * 0.07 : 0) + (r() - .5) * 6, oy = ty * tile + (r() - .5) * 6;
    const k = r();
    const g = x.createLinearGradient(ox, oy, ox + tile, oy + tile);
    const c1 = mix(base[0], base[1], 0.45 + k * 0.45), c2 = mix(base[0], base[1], 0.35 + k * 0.5);
    g.addColorStop(0, c1); g.addColorStop(1, c2); x.fillStyle = g; x.fillRect(ox, oy, tile + 4, tile + 4);
    x.strokeStyle = 'rgba(120,80,20,.28)'; x.lineWidth = 2; x.strokeRect(ox + 1, oy + 1, tile + 2, tile + 2);
    for (let c = 0; c < 4; c++) {   // 皱纹
      x.strokeStyle = r() < .5 ? 'rgba(255,240,190,.32)' : 'rgba(110,70,15,.22)'; x.lineWidth = 1 + r() * 1.5;
      x.beginPath(); let px = ox + r() * tile, py = oy + r() * tile; x.moveTo(px, py);
      for (let s = 0; s < 4; s++) { px += (r() - .5) * 40; py += (r() - .5) * 40; x.lineTo(px, py); } x.stroke();
    }
  }
  const sh = x.createLinearGradient(0, 0, W, H * 0.6);
  sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(.42, `rgba(255,246,210,${sheen * .55})`); sh.addColorStop(.5, `rgba(255,250,225,${sheen * .75})`); sh.addColorStop(.6, `rgba(255,246,210,${sheen * .3})`); sh.addColorStop(1, 'rgba(80,50,10,.18)');
  x.fillStyle = sh; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) { x.fillStyle = r() < .6 ? 'rgba(255,240,180,.55)' : 'rgba(120,80,20,.35)'; const s = 1 + r() * 3; x.fillRect(r() * W, r() * H, s, s); }   // 砂子（金粉）
}
function mix(a, b, t) { const pa = hex(a), pb = hex(b); return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`; }
function hex(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }

// 一个“先描线、再偏移着填色”的形状
export function blob(x, path, fill, lw) {
  x.save(); x.lineJoin = 'round'; x.lineCap = 'round';
  x.strokeStyle = INK; x.lineWidth = lw * 2; path(); x.stroke();
  x.translate(...MIS); x.fillStyle = fill; path(); x.fill(); x.restore();
}
const circ = (x, cx, cy, r) => () => { x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); };
const oval = (x, cx, cy, rx, ry, rot = 0) => () => { x.beginPath(); x.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2); };

// 琳派的云：一串大小不一的圆连成一条带，浅金填色 + 细线，里面撒金粉
export function cloud(x, cx, cy, len, h, seed = 1, { fill = '#F7E4A6', line = '#8A6420' } = {}) {
  const r = rng(seed), lobes = [];
  for (let t = 0; t <= 1.0001; t += 0.07) lobes.push([cx - len / 2 + t * len, cy + (r() - .5) * h * 0.25, h * (0.35 + r() * 0.3)]);
  const path = () => { x.beginPath(); for (const [a, b, rr] of lobes) { x.moveTo(a + rr, b); x.arc(a, b, rr, 0, Math.PI * 2); } };
  x.save(); x.strokeStyle = line; x.lineWidth = 8; path(); x.stroke(); x.fillStyle = fill; path(); x.fill();
  x.globalCompositeOperation = 'source-atop';
  x.restore();
  x.save(); path(); x.clip(); for (let i = 0; i < len * h / 900; i++) { x.fillStyle = r() < .5 ? 'rgba(200,150,50,.45)' : 'rgba(255,255,240,.7)'; const s = 2 + r() * 4; x.fillRect(cx - len / 2 - h + r() * (len + 2 * h), cy - h + r() * 2 * h, s, s); }
  x.restore();
}

// 带脸的小花：六片圆瓣 + 花心的脸
export function flower(x, cx, cy, R, petal, { core = '#FFE14D', face = 0, rot = 0, n = 6 } = {}) {
  const lw = Math.max(3, R * 0.055);
  const path = () => { x.beginPath(); for (let i = 0; i < n; i++) { const a = rot + i / n * Math.PI * 2; const px = cx + Math.cos(a) * R * 0.6, py = cy + Math.sin(a) * R * 0.6; x.moveTo(px + R * 0.44, py); x.arc(px, py, R * 0.44, 0, Math.PI * 2); } };
  blob(x, path, petal, lw);
  blob(x, circ(x, cx, cy, R * 0.47), core, lw);
  faceAt(x, cx + MIS[0] * .5, cy + MIS[1] * .5, R * 0.47, face);
}
export function faceAt(x, cx, cy, r, type = 0) {
  x.save(); x.fillStyle = INK; x.strokeStyle = INK; x.lineCap = 'round'; x.lineWidth = Math.max(2.5, r * 0.09);
  const ex = r * 0.36, ey = -r * 0.1;
  if (type === 1) {   // 眯眼笑 ^ ^
    for (const s of [-1, 1]) { x.beginPath(); x.arc(cx + s * ex, cy + ey + r * 0.06, r * 0.14, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); }
  } else {
    for (const s of [-1, 1]) { x.beginPath(); x.ellipse(cx + s * ex, cy + ey, r * 0.1, r * 0.15, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(cx + s * ex - r * 0.03, cy + ey - r * 0.06, r * 0.04, 0, Math.PI * 2); x.fill(); x.fillStyle = INK; }
  }
  x.beginPath(); x.arc(cx, cy + r * 0.12, r * 0.2, Math.PI * 0.15, Math.PI * 0.85); x.stroke();
  x.fillStyle = 'rgba(255,90,140,.55)'; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(cx + s * r * 0.58, cy + r * 0.12, r * 0.14, r * 0.08, 0, 0, Math.PI * 2); x.fill(); }
  x.restore();
}

// 大眼睛：深色底 + 三层平涂的虹膜（不用渐变，一层一层叠）+ 两颗高光
export function animeEye(x, cx, cy, rx, ry, { iris = ['#1B1F5E', '#2E4BD8', '#3FA9F5', '#A8F0FF'], flip = 1 } = {}) {
  const lw = rx * 0.07;
  blob(x, oval(x, cx, cy, rx, ry), '#FFFFFF', lw);
  x.save(); x.translate(...MIS); x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.clip();
  const ir = [rx * 0.86, ry * 0.92];
  iris.forEach((c, i) => { x.fillStyle = c; x.beginPath(); const t = i / iris.length; x.ellipse(cx, cy + ry * 0.12 + t * ry * 0.38, ir[0] * (1 - t * 0.28), ir[1] * (1 - t * 0.42), 0, 0, Math.PI * 2); x.fill(); });
  x.fillStyle = '#0B0B1E'; x.beginPath(); x.ellipse(cx, cy + ry * 0.05, rx * 0.34, ry * 0.4, 0, 0, Math.PI * 2); x.fill();
  // 上眼睑的阴影条（平的）
  x.fillStyle = 'rgba(11,11,30,.55)'; x.beginPath(); x.ellipse(cx, cy - ry * 0.95, rx * 1.2, ry * 0.45, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#FFFFFF';
  x.beginPath(); x.ellipse(cx - flip * rx * 0.34, cy - ry * 0.32, rx * 0.3, ry * 0.25, -0.4 * flip, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.arc(cx + flip * rx * 0.36, cy + ry * 0.42, rx * 0.12, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.arc(cx + flip * rx * 0.05, cy + ry * 0.62, rx * 0.06, 0, Math.PI * 2); x.fill();
  x.restore();
  x.save(); x.strokeStyle = INK; x.lineWidth = lw * 2.4; x.lineCap = 'round';
  x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, Math.PI * 1.08, Math.PI * 1.92); x.stroke();   // 上眼线加粗
  for (let i = 0; i < 3; i++) { const a = Math.PI * (flip > 0 ? 1.12 + i * 0.07 : 1.88 - i * 0.07); const px = cx + Math.cos(a) * rx, py = cy + Math.sin(a) * ry; x.beginPath(); x.moveTo(px, py); x.lineTo(px - flip * rx * (0.3 - i * 0.06), py - ry * (0.14 + i * 0.07)); x.stroke(); }
  x.restore();
}

// 麻薯：一团白色的软角色，两只大眼睛、头顶一片芽
export function mochi(x, cx, cy, w, { body = '#FFF3EE', iris } = {}) {
  const h = w * 0.82, lw = w * 0.012;
  // 头顶的芽
  x.save(); x.strokeStyle = INK; x.lineWidth = lw * 2.2; x.lineCap = 'round'; x.beginPath(); x.moveTo(cx, cy - h * 0.29); x.quadraticCurveTo(cx + w * 0.02, cy - h * 0.38, cx - w * 0.005, cy - h * 0.43); x.stroke(); x.restore();
  for (const s of [-1, 1]) blob(x, () => { x.beginPath(); x.ellipse(cx + s * w * 0.07, cy - h * 0.45, w * 0.075, w * 0.032, -s * 0.45, 0, Math.PI * 2); }, '#7BD84A', lw);
  blob(x, () => { x.beginPath(); x.moveTo(cx - w * 0.5, cy + h * 0.28);
    x.bezierCurveTo(cx - w * 0.56, cy - h * 0.5, cx + w * 0.56, cy - h * 0.5, cx + w * 0.5, cy + h * 0.28);
    x.bezierCurveTo(cx + w * 0.47, cy + h * 0.52, cx - w * 0.47, cy + h * 0.52, cx - w * 0.5, cy + h * 0.28); }, body, lw);
  animeEye(x, cx - w * 0.2, cy + h * 0.02, w * 0.13, h * 0.2, { iris, flip: 1 });
  animeEye(x, cx + w * 0.2, cy + h * 0.02, w * 0.13, h * 0.2, { iris, flip: -1 });
  x.save(); x.fillStyle = 'rgba(255,80,130,.6)';
  for (const s of [-1, 1]) { x.beginPath(); x.ellipse(cx + s * w * 0.36, cy + h * 0.2, w * 0.07, h * 0.045, 0, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(200,30,80,.8)'; x.lineWidth = lw * 0.9; for (let k = -1; k <= 1; k++) { x.beginPath(); x.moveTo(cx + s * w * 0.36 + k * w * 0.025 - w * 0.008, cy + h * 0.2 + h * 0.02); x.lineTo(cx + s * w * 0.36 + k * w * 0.025 + w * 0.008, cy + h * 0.2 - h * 0.02); x.stroke(); } }
  x.restore();
  // 嘴：小小的 ω，里面一点粉
  x.save(); x.strokeStyle = INK; x.lineWidth = lw * 1.6; x.lineCap = 'round';
  for (const s of [-1, 1]) { x.beginPath(); x.arc(cx + s * w * 0.028, cy + h * 0.2, w * 0.028, Math.PI * 0.05, Math.PI * 0.95); x.stroke(); }
  x.restore();
}

// 贴纸字：彩色粗边 → 黑边 → 白字（全平涂）
export function stickerText(x, text, px, py, font, { fill = '#FFFFFF', outer = '#FF4FA3', ow = 0.2, iw = 0.1, size = 300, align = 'left', spacing = '0px' } = {}) {
  x.save(); x.font = font; x.textAlign = align; x.textBaseline = 'alphabetic'; x.lineJoin = 'round'; x.letterSpacing = spacing;
  x.strokeStyle = outer; x.lineWidth = size * ow * 2; x.strokeText(text, px, py);
  x.strokeStyle = INK; x.lineWidth = size * iw * 2; x.strokeText(text, px, py);
  x.fillStyle = fill; x.fillText(text, px + MIS[0], py + MIS[1]);
  x.restore();
}

// 撒小花：拒绝采样，避开给定的区域
export function scatter(W, H, n, { seed = 5, rmin = 40, rmax = 200, avoid = [] } = {}) {
  const r = rng(seed), out = [];
  for (let tries = 0; out.length < n && tries < n * 60; tries++) {
    const R = rmin + Math.pow(r(), 2.2) * (rmax - rmin), p = [r() * W, r() * H];
    if (avoid.some(a => a(p[0], p[1], R))) continue;
    if (out.some(o => Math.hypot(o[0] - p[0], o[1] - p[1]) < (o[2] + R) * 0.82)) continue;
    out.push([p[0], p[1], R, r(), r(), r()]);
  }
  return out;
}
