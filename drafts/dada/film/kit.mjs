// 达达 · 画纸片的工具：字体、随机、纸的纹理、剪的 / 撕的轮廓、把一张纸片烤成贴图（正面、背面、两档影子）、网点照片、齿轮、手、剪刀。
// 不用浏览器：@napi-rs/canvas（Skia）直接在 Node 里画，每帧是帧号的纯函数。
import { createCanvas, GlobalFonts, Path2D } from '@napi-rs/canvas';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export { createCanvas, Path2D };
export const W = 1920, H = 1080, D = Math.PI / 180;
export const C = { PAPER: '#E7DDC8', NEWS: '#F3ECDD', KRAFT: '#C5A070', INK: '#16130F', RED: '#D3261C', OCHRE: '#D9A72B', PINK: '#E2B19D', PHOTO: '#DCD6C8', GRAPH: '#EDE7D8', BLUE: '#2F4E8C' };

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FONTS = process.env.FONTS || path.resolve(HERE, '../../../public/fonts');
for (const [k, f] of Object.entries({ Abril: 'AbrilFatface-Regular.ttf', Anton: 'Anton-Regular.ttf', Rye: 'Rye-Regular.ttf', Slab: 'AlfaSlabOne-Regular.ttf',
  Type: 'SpecialElite-Regular.ttf', Arch: 'ArchivoBlack-Regular.ttf', Hei: 'NotoSansSC-Black.otf', Sans: 'NotoSansSC-Bold.otf', Song: 'NotoSerifSC.ttf',
  Ma: 'MaShanZheng-Regular.ttf', Kuai: 'ZCOOLKuaiLe-Regular.ttf' })) {
  if (!GlobalFonts.registerFromPath(path.join(FONTS, f), k)) throw new Error('缺字体 ' + f + '（先下载到 public/fonts）');
}

// —— 数学 ——
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const eio = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const eo = t => 1 - Math.pow(1 - t, 3);
export const hash = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
export function rng(seed) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function mix(a, b, t) {
  const p = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, '0')).join('');
}

// —— 纸的纹理 ——
function noise(n, seed, lo, hi) {
  const c = createCanvas(n, n), x = c.getContext('2d'), im = x.createImageData(n, n), r = rng(seed);
  for (let i = 0; i < n * n; i++) { const v = lo + (hi - lo) * r(); im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
  x.putImageData(im, 0, 0);
  return c;
}
const GRAIN = noise(256, 5, 214, 255), MOTTLE = noise(64, 9, 196, 255);
export function texture(x, x0, y0, w, h, k = 1) {
  x.save();
  x.globalCompositeOperation = 'multiply';
  x.globalAlpha = .55 * k; x.fillStyle = x.createPattern(GRAIN, 'repeat'); x.fillRect(x0, y0, w, h);
  x.globalAlpha = .5 * k; x.imageSmoothingEnabled = true; x.save(); x.scale(9, 9); x.fillStyle = x.createPattern(MOTTLE, 'repeat'); x.fillRect(x0 / 9, y0 / 9, w / 9 + 1, h / 9 + 1); x.restore();
  x.restore();
}

// —— 轮廓 ——
// tear = 0：剪刀剪的，四条直边，每个角歪一点；tear > 0：手撕的，边上每隔 step 抖一下
export function edgePts(w, h, r, tear = 0, step = 20, k = .035) {
  const kk = Math.min(w, h) * k;
  const Cn = [[0, 0], [w, 0], [w, h], [0, h]].map(([x, y]) => [x + (r() * 2 - 1) * kk, y + (r() * 2 - 1) * kk]);
  const pts = [];
  for (let i = 0; i < 4; i++) {
    const a = Cn[i], b = Cn[(i + 1) % 4], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = tear ? Math.max(1, Math.floor(L / step)) : 1;
    const nx = (b[1] - a[1]) / L, ny = -(b[0] - a[0]) / L;
    for (let j = 0; j < n; j++) { const t = j / n, d = tear && j ? (r() * 2 - 1) * tear : 0; pts.push([a[0] + (b[0] - a[0]) * t + nx * d, a[1] + (b[1] - a[1]) * t + ny * d]); }
  }
  return pts;
}
export function polyPath(pts) { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; }

// —— 把一张纸片烤成贴图 ——
// o: { id, w, h, fill, tear, seed, paint(ctx, w, h), pts | path, rule, free（不裁、不铺底：字母 / 手这类镂空的形）, res, back:false }
// 局部坐标：左上角 (0,0)；画的时候以中心为原点。返回 { face, back, sh:[近, 远], path, w, h, pad, sp }
export function makeScrap(o) {
  const { w, h } = o, R = o.res ?? 1.5, r = rng(o.seed ?? 1);
  const pts = o.path ? null : (o.pts ?? edgePts(w, h, r, o.tear ?? 0, o.step ?? 20, o.k ?? .035));
  const P = o.path ?? polyPath(pts);
  const pad = Math.ceil(o.pad ?? (Math.min(w, h) * (o.k ?? .035) + (o.tear ?? 0) + 6));
  const mk = () => { const c = createCanvas(Math.ceil((w + 2 * pad) * R), Math.ceil((h + 2 * pad) * R)), x = c.getContext('2d'); x.scale(R, R); x.translate(pad, pad); return [c, x]; };
  const side = (fill, alpha) => {
    const [c, x] = mk();
    if (o.free) { o.paint(x, w, h); return c; }
    if (o.tear) { x.save(); x.strokeStyle = '#FBF8F0'; x.lineWidth = 3.4; x.lineJoin = 'round'; x.stroke(P); x.restore(); }   // 撕口露出来的白纤维
    if (o.bleed) { x.save(); x.strokeStyle = fill; x.lineWidth = 1.6; x.lineJoin = 'round'; x.stroke(P); x.restore(); }                    // 还连着的时候，接缝不露底
    x.save(); x.clip(P, o.rule ?? 'nonzero');
    x.fillStyle = fill; x.fillRect(-pad, -pad, w + 2 * pad, h + 2 * pad);
    if (o.paint) { x.save(); x.globalAlpha = alpha; o.paint(x, w, h); x.restore(); }
    texture(x, -pad, -pad, w + 2 * pad, h + 2 * pad, o.tex ?? 1);
    x.restore();
    return c;
  };
  const face = side(o.fill, 1);
  const back = o.free || o.back === false ? null : side(o.backFill ?? mix(o.fill, '#E9E1CF', o.fill === C.NEWS || o.fill === C.PHOTO ? .35 : .22), .07);   // 背面：同一个轮廓，正面的字透过来一点点
  const q = 4, sp = 56;
  const sh = blur => {
    const cw = Math.ceil((w + 2 * sp) / q), ch = Math.ceil((h + 2 * sp) / q), t = createCanvas(cw, ch), tx = t.getContext('2d');
    tx.drawImage(face, (sp - pad) / q, (sp - pad) / q, (w + 2 * pad) / q, (h + 2 * pad) / q);
    tx.globalCompositeOperation = 'source-in'; tx.fillStyle = '#231503'; tx.fillRect(0, 0, cw, ch);
    const c = createCanvas(cw, ch), x = c.getContext('2d'); x.filter = `blur(${blur}px)`; x.drawImage(t, 0, 0);
    return c;
  };
  // 剪影（翻面时用来压暗）
  const sil = createCanvas(Math.ceil(w + 2 * pad), Math.ceil(h + 2 * pad)), sx = sil.getContext('2d');
  sx.drawImage(face, 0, 0, sil.width, sil.height); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = '#1a1208'; sx.fillRect(0, 0, sil.width, sil.height);
  return { id: o.id, w, h, pad, sp, face, back, sil, sh: [sh(.8), sh(5.5)], path: o.free ? null : P, rule: o.rule ?? 'nonzero', o };
}

// —— 字 ——
const MC = createCanvas(8, 8).getContext('2d');
export function tw(s, font, ls = 0) { MC.font = font; MC.letterSpacing = ls + 'px'; return MC.measureText(s).width; }
export function txt(x, s, X, Y, font, col, align = 'left', ls = 0) { x.font = font; x.letterSpacing = ls + 'px'; x.fillStyle = col; x.textAlign = align; x.textBaseline = 'alphabetic'; x.fillText(s, X, Y); x.letterSpacing = '0px'; }
// 一张只印一个字的卡片
export const letter = (id, ch, w, h, size, font, col, fill, seed, tear = 0, dy = 0) =>
  makeScrap({ id, w, h, fill, seed, tear, paint: x => txt(x, ch, w / 2, h / 2 + size * .35 + dy, `${size}px ${font}`, col, 'center') });
// 一条剪下来的字条（宽度按字量出来）
export function strip(id, s, size, font, fill, col, seed, o = {}) {
  const f = `${o.weight ?? 900} ${size}px ${font}`, pad = o.padx ?? size * .42, w = Math.ceil(tw(s, f, o.ls ?? 0) + pad * 2), h = Math.ceil(size * (o.hk ?? 1.55));
  const sc = makeScrap({ id, w, h, fill, seed, tear: o.tear ?? 0, k: o.k ?? .03, paint: x => txt(x, s, pad, h / 2 + size * .35, f, col, 'left', o.ls ?? 0) });
  sc.text = { s, f, pad, n: [...s].length, tw: w - pad * 2, fill };
  return sc;
}

// —— 网点照片：亮度函数 lum(x, y)（0 = 白纸，1 = 全黑）印成转了 ang 度的网点，越黑点越大 ——
export function halftone(x, w, h, lum, pitch = 9, ang = 45, col = C.INK, x0 = -1e9, y0 = -1e9, x1 = 1e9, y1 = 1e9) {
  const ca = Math.cos(ang * D), sa = Math.sin(ang * D), n = Math.floor((w + h) / pitch) + 2;
  x.fillStyle = col; x.beginPath();
  for (let i = -n; i < n; i++) for (let j = -n; j < n; j++) {
    const X = (i * ca - j * sa) * pitch + w / 2, Y = (i * sa + j * ca) * pitch + h / 2;
    if (X < -pitch || X > w + pitch || Y < -pitch || Y > h + pitch || X < x0 || X > x1 || Y < y0 || Y > y1) continue;
    const rr = pitch * .74 * Math.sqrt(clamp(lum(X, Y)));
    if (rr > .6) { x.moveTo(X + rr, Y); x.arc(X, Y, rr, 0, 6.2832); }
  }
  x.fill();
}
// 一只眼睛：眉毛、上眼睑的暗、眼白、虹膜、瞳孔和一块高光
export const EYE = (w, h) => ({ cx: w * .5, cy: h * .58, a: w * .42, b: h * .27 });
export function eyeLum(w, h, g = 0) {      // g：眼珠往左（−1）还是往右（+1）看
  const { cx, cy, a, b } = EYE(w, h), ri = b * .98;
  return (x, y) => {
    const u = (x - cx) / a, v = (y - cy) / b;
    if (Math.abs(u) < 1.2) { const yb = cy - b * (1.75 + .5 * (1 - u * u)), th = b * .3 * (1 - .55 * Math.abs(u) / 1.2); if (Math.abs(y - yb) < th) return .96; }
    if (Math.abs(u) < 1) {
      const lid = Math.pow(1 - u * u, .8);
      if (Math.abs(v) < lid) {
        const d = Math.hypot(x - cx - a * (.04 + g * .36), y - cy + b * .12);
        if (Math.hypot(x - cx - a * g * .36 + ri * .3, y - cy + b * .12 + ri * .36) < ri * .2) return 0;
        if (d < ri * .44) return 1;
        if (d < ri) return .55 + .35 * Math.pow(d / ri, 3);
        return .05 + .5 * Math.max(0, -v / lid - .45);
      }
      if (v < 0 && Math.abs(v) < lid + .22) return 1;
      if (v > 0 && Math.abs(v) < lid + .1) return .6;
      if (v < 0 && Math.abs(Math.abs(v) - lid * 1.55) < .09) return .7;
    }
    return .16 + .12 * Math.max(0, 1 - Math.abs(u));
  };
}
// 一张嘴：上唇的弓、下唇的高光、唇缝、下唇底下的影子
export const LIPS = (w, h) => ({ cx: w * .5, cy: h * .48, W: w * .42, H: h * .3 });
export const lipUp = (u, Hh) => Hh * (1 - Math.pow(Math.abs(u), 1.7)) * (.92 - .36 * Math.exp(-((u / .2) ** 2)));
export const lipLo = (u, Hh) => Hh * 1.2 * Math.pow(Math.max(0, 1 - u * u), .75);
export function lipsLum(w, h) {
  const { cx, cy, W: Wd, H: Hh } = LIPS(w, h);
  return (x, y) => {
    const u = (x - cx) / Wd, dy = y - cy;
    if (Math.abs(u) < 1) {
      const up = lipUp(u, Hh), lo = lipLo(u, Hh);
      if (Math.abs(dy) < Hh * .07 * (1.2 - Math.abs(u))) return 1;
      if (-up < dy && dy < 0) return .86;
      if (dy >= 0 && dy < lo) return .78 - .6 * Math.exp(-((u / .5) ** 2) - (((dy - lo * .48) / (Hh * .26)) ** 2));
      if (Math.abs(u) < .75 && dy > 0) return .16 + .34 * Math.exp(-(((dy - lo - Hh * .2) / (Hh * .22)) ** 2));
    }
    return .16;
  };
}
