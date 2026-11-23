// 朋克复印机 · 工具：字体、数学、噪声、一张现算的“照片”（莫西干头对着麦克风喊）、网点、剪贴字、胶带、复印（阈值 + 墨点 + 纸色）。
// 不用浏览器：@napi-rs/canvas（Skia）直接在 Node 里画，每帧是帧号的纯函数。
import { createCanvas, GlobalFonts, Path2D } from '@napi-rs/canvas';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export { createCanvas, Path2D };
export const W = 1920, H = 1080, D = Math.PI / 180;
// 纸色（复印件的颜色全在纸上）和墨
export const P = { PINK: '#FF3E9A', YELLOW: '#FFE21A', WHITE: '#F1EEE4', GREEN: '#7BE86A', ORIG: '#F6F4EE', INK: '#121012', TAPE: '#F2D64B', RED: '#E3262E' };

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FONTS = process.env.FONTS || path.resolve(HERE, '../../../public/fonts');
for (const [k, f] of Object.entries({ Hei: 'NotoSansSC-Black.otf', HeiB: 'NotoSansSC-Bold.otf', HY: 'ZCOOLQingKeHuangYou.ttf', Kuai: 'ZCOOLKuaiLe-Regular.ttf',
  Ma: 'MaShanZheng-Regular.ttf', Cang: 'LongCang-Regular.ttf', Anton: 'Anton-Regular.ttf', Arch: 'ArchivoBlack-Regular.ttf', Abril: 'AbrilFatface-Regular.ttf',
  Slab: 'AlfaSlabOne-Regular.ttf', Bang: 'Bangers-Regular.ttf', Type: 'SpecialElite-Regular.ttf', Mark: 'PermanentMarker-Regular.ttf',
  Frak: 'UnifrakturMaguntia.ttf', Mono: 'SpaceMono-Bold.ttf', MonoR: 'SpaceMono-Regular.ttf', Rye: 'Rye-Regular.ttf' })) {
  if (!GlobalFonts.registerFromPath(path.join(FONTS, f), k)) throw new Error('缺字体 ' + f + '（先 npm run fonts）');
}

// —— 数学 ——
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const eio = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const eo = t => 1 - Math.pow(1 - t, 3);
export const ei = t => t * t * t;
export const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
// 落定的弹簧：0→1，冲过头约 5%，再抖回来（u 是落地后的帧数）
export const settle = (u, k = 6, f = .9) => (u <= 0 ? 0 : 1 - Math.exp(-u / k) * Math.cos(f * u / k * 2.2));
export const hash = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
export function rng(seed) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const rgb = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
export function mixHex(a, b, t) { const A = rgb(a), B = rgb(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, '0')).join(''); }

// —— 噪声（全屏，静态；复印每一代把读的位置挪一下，就是一张新的墨） ——
export const NF = new Float32Array(W * H);                      // 细：0..1 白噪声
{ const r = rng(11); for (let i = 0; i < NF.length; i++) NF[i] = r(); }
function lowNoise(cells, seed, blurPx) {                         // 低频：一块块的墨团、纸的斑驳
  const s = createCanvas(cells[0], cells[1]), sx = s.getContext('2d'), im = sx.createImageData(cells[0], cells[1]), r = rng(seed);
  for (let i = 0; i < cells[0] * cells[1]; i++) { const v = r() * 255; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
  sx.putImageData(im, 0, 0);
  const c = createCanvas(W, H), x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.filter = `blur(${blurPx}px)`; x.drawImage(s, -40, -40, W + 80, H + 80);
  const d = x.getImageData(0, 0, W, H).data, out = new Float32Array(W * H);
  let lo = 1, hi = 0; for (let i = 0; i < out.length; i++) { out[i] = d[i * 4] / 255; lo = Math.min(lo, out[i]); hi = Math.max(hi, out[i]); }
  for (let i = 0; i < out.length; i++) out[i] = (out[i] - lo) / (hi - lo);
  return out;
}
export const NM = lowNoise([320, 180], 23, 3);                   // 中频（约 6px 一块）
export const NL = lowNoise([64, 36], 31, 10);                    // 低频（约 30px 一块）

// —— 照片：舞台上一支话筒的特写。追光从左上打下来，背后是虚掉的灯和人头。灰度，1 = 白 ——
// 话筒是现算的：球形网罩（网格按球面弯过去）、一圈金属箍、镀铬的锥形手柄；背景全部虚焦，像真的照片
function sphereMap(q, r) {                      // 平面上的点 → 贴到半径 r 的球上看到的位置
  const d = Math.hypot(q[0], q[1]); if (d < 1e-6) return q;
  const k = r * Math.sin(Math.min(d / r, Math.PI / 2)) / d; return [q[0] * k, q[1] * k];
}
let PHOTO = null;
export function photo() {                // { canvas: 1920×1080 灰度, lum(x, y) 0..1 }
  if (PHOTO) return PHOTO;
  const c = createCanvas(W, H), x = c.getContext('2d');
  x.fillStyle = '#161616'; x.fillRect(0, 0, W, H);
  // 追光的光晕 + 虚掉的舞台灯
  const halo = x.createRadialGradient(860, 330, 40, 860, 360, 1000); halo.addColorStop(0, '#c4c4c4'); halo.addColorStop(.4, '#6e6e6e'); halo.addColorStop(1, '#1a1a1a');
  x.fillStyle = halo; x.fillRect(0, 0, W, H);
  { const r = rng(21);
    x.save(); x.filter = 'blur(7px)';
    for (let i = 0; i < 16; i++) {
      const bx = 80 + r() * 1760, by = 40 + r() * 360, br = 28 + r() * 60, v = 150 + r() * 100;
      x.fillStyle = `rgba(${v},${v},${v},${.35 + r() * .4})`; x.beginPath(); x.arc(bx, by, br, 0, Math.PI * 2); x.fill();
      x.strokeStyle = `rgba(255,255,255,${.25 + r() * .3})`; x.lineWidth = 4; x.stroke();
    }
    x.restore(); }
  // 斜着打下来的一道光束（很淡）
  x.save(); x.globalCompositeOperation = 'lighter'; x.filter = 'blur(30px)';
  const beam = x.createLinearGradient(300, 0, 900, 900); beam.addColorStop(0, 'rgba(90,90,90,.55)'); beam.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = beam; x.beginPath(); x.moveTo(250, -50); x.lineTo(700, -50); x.lineTo(1250, H); x.lineTo(500, H); x.closePath(); x.fill(); x.restore();
  // 前排人头：虚焦的剪影，顶上一点亮边
  { const r = rng(8);
    const heads = []; for (let i = 0; i < 9; i++) heads.push([i * 240 - 40 + r() * 80, 930 + r() * 60, 120 + r() * 40]);
    x.save(); x.filter = 'blur(16px)';
    x.fillStyle = '#5c5c5c'; for (const [hx, hy, hr] of heads) { x.beginPath(); x.ellipse(hx, hy - 10, hr * .82, hr, 0, 0, Math.PI * 2); x.fill(); x.fillRect(hx - hr * 1.6, hy + hr * .7, hr * 3.2, 400); }
    x.fillStyle = '#0b0b0b'; for (const [hx, hy, hr] of heads) { x.beginPath(); x.ellipse(hx + 6, hy + 4, hr * .8, hr, 0, 0, Math.PI * 2); x.fill(); x.fillRect(hx - hr * 1.6 + 6, hy + hr * .75, hr * 3.2, 400); }
    x.restore(); }
  // 话筒
  const R = 255;
  x.save(); x.translate(1040, 430); x.rotate(-16 * D);
  // 手柄：上粗下细，横向是镀铬的明暗条
  x.save(); x.filter = 'blur(1px)';
  const hp = new Path2D(); hp.moveTo(-R * .56, R * .9); hp.lineTo(R * .56, R * .9); hp.lineTo(R * .3, R * 4.2); hp.lineTo(-R * .3, R * 4.2); hp.closePath();
  const hg = x.createLinearGradient(-R * .56, 0, R * .56, 0);
  [[0, '#0c0c0c'], [.18, '#3a3a3a'], [.3, '#d8d8d8'], [.38, '#7a7a7a'], [.62, '#2a2a2a'], [.85, '#555'], [1, '#0e0e0e']].forEach(([o, col]) => hg.addColorStop(o, col));
  x.fillStyle = hg; x.fill(hp); x.restore();
  // 箍
  const bg = x.createLinearGradient(-R * .66, 0, R * .66, 0);
  [[0, '#111'], [.25, '#bbb'], [.33, '#f0f0f0'], [.45, '#666'], [1, '#111']].forEach(([o, col]) => bg.addColorStop(o, col));
  x.fillStyle = bg; x.beginPath(); x.ellipse(0, R * .86, R * .66, R * .2, 0, 0, Math.PI * 2); x.fill();
  x.fillRect(-R * .66, R * .78, R * 1.32, R * .1);
  // 网罩：球的明暗
  const sg = x.createRadialGradient(-R * .38, -R * .42, R * .05, -R * .1, -R * .1, R * 1.08);
  [[0, '#f2f2f2'], [.3, '#a8a8a8'], [.7, '#3c3c3c'], [1, '#0c0c0c']].forEach(([o, col]) => sg.addColorStop(o, col));
  x.fillStyle = sg; x.beginPath(); x.arc(0, 0, R, 0, Math.PI * 2); x.fill();
  // 网：两组斜线，按球面弯过去
  x.save(); x.beginPath(); x.arc(0, 0, R - 1, 0, Math.PI * 2); x.clip();
  x.strokeStyle = 'rgba(0,0,0,.5)'; x.lineWidth = 3.2;
  const L = R * Math.PI / 2;
  for (const dir of [1, -1]) for (let k = -L * 1.5; k <= L * 1.5; k += 21) {
    x.beginPath(); let first = true;
    for (let s = -L * 1.5; s <= L * 1.5; s += 6) {
      const q = [(k + s) * Math.SQRT1_2, (dir * (s - k)) * Math.SQRT1_2]; if (Math.hypot(...q) > L) { first = true; continue; }
      const p = sphereMap(q, R); first ? x.moveTo(...p) : x.lineTo(...p); first = false;
    }
    x.stroke();
  }
  x.restore();
  // 高光
  x.save(); x.filter = 'blur(14px)'; x.fillStyle = 'rgba(255,255,255,.85)'; x.beginPath(); x.ellipse(-R * .42, -R * .45, R * .22, R * .14, -40 * D, 0, Math.PI * 2); x.fill(); x.restore();
  // 背光：球的右下沿一圈亮边
  x.save(); x.filter = 'blur(5px)'; x.strokeStyle = 'rgba(235,235,235,.75)'; x.lineWidth = 12; x.beginPath(); x.arc(0, 0, R - 7, -20 * D, 110 * D); x.stroke(); x.restore();
  x.restore();
  // 胶片颗粒
  const im = x.getImageData(0, 0, W, H), d = im.data, lum = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) { let v = d[i * 4] / 255 + (NM[i] - .5) * .1 + (NF[i] - .5) * .05; v = clamp(v); lum[i] = v; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v * 255; }
  x.putImageData(im, 0, 0);
  const s = createCanvas(W, H), sx = s.getContext('2d'); sx.filter = 'blur(1.2px)'; sx.drawImage(c, 0, 0);
  PHOTO = { canvas: s, lum: (px, py) => { const i = clamp(Math.round(py), 0, H - 1) * W + clamp(Math.round(px), 0, W - 1); return lum[i]; } };
  return PHOTO;
}

// —— 网点：把照片画成 45° 的点。g 已经在照片坐标里；只画落在 [x0,y0,x1,y1]（照片坐标）里的点 ——
// pitch：点距（照片 px）；gain：点扩大（复印越多点越胖）；wob：点的边不圆（0..1）；seed：每一代不一样的歪
export function halftone(g, { pitch = 12, gain = 1, wob = 0, seed = 1, box = [0, 0, W, H], ink = '#000', angle = 45, extra = 0, lum = null } = {}) {
  // angle：网角（度）；gain：点按比例胖多少；extra：每颗点再加多少半径（以点距为单位，1 ≈ 整片连成黑）
  const ph = photo(), L = lum ?? ph.lum, a = angle * D, ca = Math.cos(a), sa = Math.sin(a), [x0, y0, x1, y1] = box;
  const cs = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]], us = cs.map(([x, y]) => x * ca + y * sa), vs = cs.map(([x, y]) => -x * sa + y * ca);
  const u0 = Math.floor(Math.min(...us) / pitch) - 1, u1 = Math.ceil(Math.max(...us) / pitch) + 1, v0 = Math.floor(Math.min(...vs) / pitch) - 1, v1 = Math.ceil(Math.max(...vs) / pitch) + 1;
  g.fillStyle = ink;
  const p = new Path2D();
  for (let iu = u0; iu <= u1; iu++) for (let iv = v0; iv <= v1; iv++) {
    const u = iu * pitch, v = iv * pitch, x = u * ca - v * sa, y = u * sa + v * ca;
    if (x < x0 - pitch || y < y0 - pitch || x > x1 + pitch || y > y1 + pitch) continue;
    const dark = 1 - L(x, y), r = pitch * .72 * Math.sqrt(dark) * gain + pitch * extra;
    if (r < .25) continue;
    if (wob > 0) {
      const n = 14, h0 = hash(iu * 7.1 + seed, iv * 3.3);
      for (let k = 0; k <= n; k++) {
        const t = k / n * Math.PI * 2, rr = r * (1 + wob * (.22 * Math.sin(t * 2 + h0 * 6) + .14 * Math.sin(t * 3 + h0 * 11) + .08 * Math.sin(t * 5 + h0 * 17)));
        k ? p.lineTo(x + Math.cos(t) * rr, y + Math.sin(t) * rr) : p.moveTo(x + Math.cos(t) * rr, y + Math.sin(t) * rr);
      }
      p.closePath();
    } else { p.moveTo(x + r, y); p.arc(x, y, r, 0, Math.PI * 2); }
  }
  g.fill(p);
}

// —— 剪贴字：一个字一张纸片 ——
// o: { font, size, fg, bg, rot, pad, shadow, skew, w（宽度覆盖） }；(x, y) 是纸片中心
export function chip(g, ch, x, y, o = {}) {
  const size = o.size ?? 120, pad = o.pad ?? size * .12;
  g.save(); g.translate(x, y); g.rotate((o.rot ?? 0) * D);
  g.font = `${size}px ${o.font ?? 'Hei'}`;
  const m = g.measureText(ch), w = (o.w ?? m.width) + pad * 2, asc = size * (o.asc ?? .78), desc = size * (o.desc ?? .14), h = asc + desc + pad * 2;
  if (o.bg) {
    const r = rng(o.seed ?? (ch.charCodeAt(0) + size)), k = Math.min(w, h) * .05;
    const pts = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([a, b]) => [a + (r() - .5) * 2 * k, b + (r() - .5) * 2 * k]);
    const pp = new Path2D(); pts.forEach(([a, b], i) => (i ? pp.lineTo(a, b) : pp.moveTo(a, b))); pp.closePath();
    if (o.shadow) { g.save(); g.translate(o.shadow * .6, o.shadow); g.fillStyle = 'rgba(0,0,0,.28)'; g.filter = `blur(${o.shadow * .7}px)`; g.fill(pp); g.restore(); }
    g.fillStyle = o.bg; g.fill(pp);
  }
  g.fillStyle = o.fg ?? P.INK; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.fillText(ch, 0, (asc - desc) / 2);
  g.restore();
  return w;
}
// 一串剪贴字：letters = [[字, {font, fg, bg, rot, dy, size}], …]，自动排开；返回总宽
export function ransom(g, letters, x, y, base = {}) {
  let cx = x;
  const ws = letters.map(([ch, o]) => { g.font = `${(o.size ?? base.size ?? 120)}px ${o.font ?? base.font ?? 'Hei'}`; return g.measureText(ch).width + 2 * (o.size ?? base.size ?? 120) * .12; });
  letters.forEach(([ch, o], i) => { const o2 = { ...base, ...o }; chip(g, ch, cx + ws[i] / 2, y + (o.dy ?? 0), o2); cx += ws[i] + (base.gap ?? 6); });
  return cx - x;
}

// —— 胶带：半透明、两头撕口。u = 0..1 拉出来多少（从左往右） ——
export function tape(g, x, y, w, h, rot, u = 1, col = 'rgba(242,214,75,.82)', seed = 3) {
  if (u <= 0) return;
  const r = rng(seed), ww = w * u;
  g.save(); g.translate(x, y); g.rotate(rot * D);
  const p = new Path2D(); p.moveTo(-w / 2, -h / 2);
  for (let i = 0; i <= 6; i++) p.lineTo(-w / 2 + (r() - .5) * 8, -h / 2 + h * i / 6);
  const xe = -w / 2 + ww; p.lineTo(xe, h / 2);
  for (let i = 6; i >= 0; i--) p.lineTo(xe + (u < 1 ? 0 : (r() - .5) * 9), -h / 2 + h * i / 6);
  p.closePath();
  g.save(); g.translate(2, 4); g.fillStyle = 'rgba(0,0,0,.14)'; g.filter = 'blur(3px)'; g.fill(p); g.restore();
  g.fillStyle = col; g.fill(p);
  g.globalAlpha = .25; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(-w / 2, -h / 2 + 4); g.lineTo(xe, -h / 2 + 4); g.stroke();
  g.restore();
}

// —— 订书钉：两条腿的小金属条 ——
export function staple(g, x, y, rot = 0, s = 1, col = '#8d8f94') {
  g.save(); g.translate(x, y); g.rotate(rot * D); g.scale(s, s);
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-21, 1, 44, 7);
  g.fillStyle = col; g.fillRect(-22, -4, 44, 7);
  g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(-22, -4, 44, 2);
  g.restore();
}

// —— 马克笔：沿路径写出来（u = 0..1 写到哪），线头圆 ——
export function scrawl(g, pts, u, col, wid) {
  if (u <= 0) return;
  let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); L += l; }
  let left = L * u;
  g.save(); g.strokeStyle = col; g.lineWidth = wid; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(...pts[0]);
  for (let i = 1; i < pts.length && left > 0; i++) { const k = Math.min(1, left / seg[i - 1]); g.lineTo(lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)); left -= seg[i - 1]; }
  g.stroke(); g.restore();
}

// —— 复印：把画好的彩色原稿（已模糊）变成纸上的墨 ——
// 每个像素：灰度 v = 原稿亮度 + 噪声；v < 阈值 就上墨。参数：
//   th 阈值、soft 边的软度、n 细噪、nm 中噪（边起毛）、nl 低噪（墨团）、speck 墨点密度、seed 每一代换一张噪声、paper 纸色、dens 墨的浓度
export function xeroxPixel(src, dst, i, L, q) {
  const j = (i + q.sh) % NF.length, jm = (i + q.shm) % NF.length;
  const v = L + (NF[j] - .5) * q.n + (NM[jm] - .5) * q.nm + (NL[jm] - .5) * q.nl;
  let ink = sstep(q.th + q.soft, q.th - q.soft, v);
  if (q.speck > 0 && NF[(j * 7 + 13) % NF.length] > 1 - q.speck * (.3 + 1.4 * NM[(jm + 5000) % NF.length] ** 3)) ink = Math.max(ink, .85);
  return ink * q.dens;
}
