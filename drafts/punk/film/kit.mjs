// 朋克复印机 · 工具：字体、数学、噪声、几张现算的“照片”（话筒、吉他、人群、音箱）、网点、剪贴字、胶带、复印（阈值 + 墨点 + 纸色）。
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
// 几张“原稿”：话筒、吉他、人群、音箱。都是现算的灰度照片，同一套胶片颗粒和轻微失焦（finishPhoto）
const PHOTOS = new Map();
export function photo(name = 'mic') {    // { canvas: 1920×1080 灰度, lum(x, y) 0..1 }
  if (!PHOTOS.has(name)) PHOTOS.set(name, finishPhoto(({ mic: drawMic, guitar: drawGuitar, crowd: drawCrowd, amp: drawAmp })[name]()));
  return PHOTOS.get(name);
}
function finishPhoto(c) {
  const x = c.getContext('2d');
  const im = x.getImageData(0, 0, W, H), d = im.data, lum = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) { let v = d[i * 4] / 255 + (NM[i] - .5) * .1 + (NF[i] - .5) * .05; v = clamp(v); lum[i] = v; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v * 255; }
  x.putImageData(im, 0, 0);
  const s = createCanvas(W, H), sx = s.getContext('2d'); sx.filter = 'blur(1.2px)'; sx.drawImage(c, 0, 0);
  return { canvas: s, lum: (px, py) => { const i = clamp(Math.round(py), 0, H - 1) * W + clamp(Math.round(px), 0, W - 1); return lum[i]; } };
}
function bokeh(x, seed, n, y0, y1, rmin, rmax, blur = 7) {      // 虚焦的舞台灯：一圈圈亮斑
  const r = rng(seed); x.save(); x.filter = `blur(${blur}px)`;
  for (let i = 0; i < n; i++) {
    const bx = 40 + r() * 1840, by = y0 + r() * (y1 - y0), br = rmin + r() * (rmax - rmin), v = 150 + r() * 100;
    x.fillStyle = `rgba(${v},${v},${v},${.35 + r() * .4})`; x.beginPath(); x.arc(bx, by, br, 0, Math.PI * 2); x.fill();
    x.strokeStyle = `rgba(255,255,255,${.25 + r() * .3})`; x.lineWidth = 4; x.stroke();
  }
  x.restore();
}
function drawMic() {
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
  return c;
}
// —— 吉他：琴颈从右下的琴身斜着伸向左上，六根弦反光；右边一盏侧光，背后虚焦的灯 ——
function drawGuitar() {
  const c = createCanvas(W, H), x = c.getContext('2d');
  x.fillStyle = '#121212'; x.fillRect(0, 0, W, H);
  const halo = x.createRadialGradient(1380, 260, 30, 1300, 300, 1100); halo.addColorStop(0, '#d0d0d0'); halo.addColorStop(.35, '#707070'); halo.addColorStop(1, '#141414');
  x.fillStyle = halo; x.fillRect(0, 0, W, H);
  bokeh(x, 33, 14, 30, 520, 24, 70, 9);
  x.save(); x.translate(1430, 800); x.rotate(30 * D); x.scale(1.45, 1.45);
  // 琴身：双切角，深色亮漆
  const body = new Path2D();
  body.moveTo(-330, -120); body.bezierCurveTo(-300, -250, -200, -300, -120, -250); body.bezierCurveTo(-40, -200, 60, -330, 200, -290);
  body.bezierCurveTo(360, -240, 420, -80, 400, 40); body.bezierCurveTo(380, 220, 260, 330, 80, 320); body.bezierCurveTo(-60, 310, -120, 250, -200, 250);
  body.bezierCurveTo(-300, 250, -300, 140, -330, 110); body.closePath();
  const bg = x.createLinearGradient(-300, -300, 300, 300); [[0, '#5a5a5a'], [.25, '#1c1c1c'], [.55, '#0c0c0c'], [.8, '#3a3a3a'], [1, '#0a0a0a']].forEach(([o, col]) => bg.addColorStop(o, col));
  x.fillStyle = bg; x.fill(body);
  x.save(); x.clip(body); x.filter = 'blur(18px)'; x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.ellipse(120, -200, 260, 34, -.5, 0, Math.PI * 2); x.fill(); x.restore();
  x.save(); x.filter = 'blur(3px)'; x.strokeStyle = 'rgba(230,230,230,.7)'; x.lineWidth = 6; x.stroke(body); x.restore();
  // 白色护板
  const pg = new Path2D(); pg.moveTo(-320, -60); pg.bezierCurveTo(-300, -150, -180, -170, -60, -140); pg.lineTo(60, -120); pg.bezierCurveTo(140, -60, 130, 120, 40, 200); pg.bezierCurveTo(-60, 250, -220, 220, -300, 120); pg.closePath();
  x.fillStyle = '#d6d6d2'; x.fill(pg); x.strokeStyle = '#202020'; x.lineWidth = 4; x.stroke(pg);
  // 两个双线圈拾音器 + 极柱
  for (const px of [-250, -70]) {
    x.fillStyle = '#151515'; x.fillRect(px - 40, -110, 80, 220);
    x.fillStyle = '#2c2c2c'; x.fillRect(px - 34, -104, 30, 208); x.fillRect(px + 4, -104, 30, 208);
    for (let k = 0; k < 6; k++) for (const ox of [-19, 19]) { const py = -84 + k * 33.6; const pgr = x.createRadialGradient(px + ox - 3, py - 3, 1, px + ox, py, 9); pgr.addColorStop(0, '#fff'); pgr.addColorStop(1, '#666'); x.fillStyle = pgr; x.beginPath(); x.arc(px + ox, py, 8, 0, Math.PI * 2); x.fill(); }
  }
  // 琴桥 + 弦钮
  const brg = x.createLinearGradient(20, 0, 70, 0); brg.addColorStop(0, '#888'); brg.addColorStop(.4, '#f4f4f4'); brg.addColorStop(1, '#555');
  x.fillStyle = brg; x.fillRect(20, -120, 50, 240); x.fillStyle = '#333'; for (let k = 0; k < 6; k++) x.fillRect(26, -86 + k * 34, 38, 4);
  for (const [kx, ky] of [[200, 120], [270, 50], [250, 190], [320, 140]]) { const kg = x.createRadialGradient(kx - 8, ky - 8, 2, kx, ky, 30); kg.addColorStop(0, '#fff'); kg.addColorStop(.5, '#9a9a9a'); kg.addColorStop(1, '#222'); x.fillStyle = kg; x.beginPath(); x.arc(kx, ky, 28, 0, Math.PI * 2); x.fill(); }
  // 琴颈：玫瑰木指板、品丝、点位
  const L = 1700, nut = -L, fret = n => nut + L * (1 - Math.pow(2, -n / 12));
  x.fillStyle = '#0e0e0e'; x.beginPath(); x.moveTo(-300, -62); x.lineTo(nut - 200, -52); x.lineTo(nut - 200, 52); x.lineTo(-300, 62); x.closePath(); x.fill();
  const nk = x.createLinearGradient(0, -60, 0, 60); nk.addColorStop(0, '#5a5a5a'); nk.addColorStop(.15, '#262626'); nk.addColorStop(.85, '#1a1a1a'); nk.addColorStop(1, '#444');
  x.fillStyle = nk; x.beginPath(); x.moveTo(-300, -56); x.lineTo(nut - 200, -48); x.lineTo(nut - 200, 48); x.lineTo(-300, 56); x.closePath(); x.fill();
  for (let n = 1; n <= 22; n++) { const fx = fret(n); if (fx > -300) break; const fg = x.createLinearGradient(fx - 4, 0, fx + 4, 0); fg.addColorStop(0, '#666'); fg.addColorStop(.5, '#f0f0f0'); fg.addColorStop(1, '#555'); x.fillStyle = fg; x.fillRect(fx - 4, -54, 8, 108); }
  x.fillStyle = '#e8e8e2';
  for (const n of [3, 5, 7, 9, 12, 15, 17, 19, 21]) { const m = (fret(n - 1) + fret(n)) / 2; if (m > -300) continue; const ys = n === 12 ? [-26, 26] : [0]; for (const yy of ys) { x.beginPath(); x.arc(m, yy, 10, 0, Math.PI * 2); x.fill(); } }
  // 六根弦：亮线 + 下面一道影子
  for (let k = 0; k < 6; k++) {
    const yb = -85 + k * 34, yn = -38 + k * 15.2, w = 2.2 + k * .55;
    x.strokeStyle = 'rgba(0,0,0,.6)'; x.lineWidth = w + 2; x.beginPath(); x.moveTo(45, yb + 5); x.lineTo(nut - 200, yn + 5 + (yn - yb) * 200 / (L + 45)); x.stroke();
    const sg = x.createLinearGradient(45, 0, nut, 0); sg.addColorStop(0, '#fafafa'); sg.addColorStop(.3, '#bdbdbd'); sg.addColorStop(.55, '#ffffff'); sg.addColorStop(1, '#8a8a8a');
    x.strokeStyle = sg; x.lineWidth = w; x.beginPath(); x.moveTo(45, yb); x.lineTo(nut - 200, yn + (yn - yb) * 200 / (L + 45)); x.stroke();
  }
  x.restore();
  // 侧光在弦上的一道亮
  x.save(); x.globalCompositeOperation = 'lighter'; x.filter = 'blur(40px)'; x.fillStyle = 'rgba(120,120,120,.5)'; x.beginPath(); x.ellipse(820, 420, 420, 90, -.49, 0, Math.PI * 2); x.fill(); x.restore();
  return c;
}
// —— 人群：逆光的舞台灯，一片举起来的手和拳头；越远越虚、越灰 ——
function drawCrowd() {
  const c = createCanvas(W, H), x = c.getContext('2d');
  x.fillStyle = '#2a2a2a'; x.fillRect(0, 0, W, H);
  const halo = x.createRadialGradient(980, 160, 20, 980, 220, 1150); halo.addColorStop(0, '#ffffff'); halo.addColorStop(.18, '#dedede'); halo.addColorStop(.5, '#7a7a7a'); halo.addColorStop(1, '#262626');
  x.fillStyle = halo; x.fillRect(0, 0, W, H);
  // 光束：从灯里扇出去
  x.save(); x.globalCompositeOperation = 'lighter'; x.filter = 'blur(22px)';
  for (const [a, wd, al] of [[-62, 7, .35], [-40, 5, .3], [-18, 6, .4], [8, 5, .35], [30, 7, .3], [55, 6, .35]]) {
    const r = 1700, a0 = (90 + a - wd) * D, a1 = (90 + a + wd) * D;
    x.fillStyle = `rgba(150,150,150,${al})`; x.beginPath(); x.moveTo(980, 160); x.lineTo(980 + r * Math.cos(a0), 160 + r * Math.sin(a0)); x.lineTo(980 + r * Math.cos(a1), 160 + r * Math.sin(a1)); x.closePath(); x.fill();
  }
  x.restore();
  bokeh(x, 52, 10, 20, 300, 20, 50, 6);
  // 一只举起来的胳膊：从画外往上，末端是拳头 / 张开的手 / 犄角
  const arm = (bx, by, tx, ty, w, kind, col, bend) => {
    // 上臂 + 小臂：肘部往一边弯出去，手腕略细
    const ex = (bx + tx) / 2 + bend * w * 2.2, ey = (by + ty) / 2 + Math.abs(bend) * w * .6;
    x.strokeStyle = col; x.lineCap = 'round'; x.lineJoin = 'round';
    x.lineWidth = w * 1.45; x.beginPath(); x.moveTo(bx, by); x.lineTo(ex, ey); x.stroke();
    x.lineWidth = w * 1.0; x.beginPath(); x.moveTo(ex, ey); x.lineTo(tx, ty); x.stroke();
    x.fillStyle = col;
    const ang = Math.atan2(ty - ey, tx - ex) + Math.PI / 2;
    x.save(); x.translate(tx, ty); x.rotate(ang);
    if (kind === 0) { x.beginPath(); x.roundRect(-w * .62, -w * 1.15, w * 1.24, w * 1.25, w * .35); x.fill(); }
    else if (kind === 1) { x.beginPath(); x.ellipse(0, -w * .45, w * .6, w * .62, 0, 0, Math.PI * 2); x.fill();
      x.lineCap = 'round'; x.strokeStyle = col; x.lineWidth = w * .26; for (const [fa, fl] of [[-.55, .9], [-.2, 1.15], [.08, 1.2], [.36, 1.05], [-1.1, .7]]) { x.beginPath(); x.moveTo(0, -w * .5); x.lineTo(Math.sin(fa) * w * 1.5 * fl, -w * .5 - Math.cos(fa) * w * 1.5 * fl); x.stroke(); } }
    else { x.beginPath(); x.roundRect(-w * .6, -w * .95, w * 1.2, w * 1.05, w * .3); x.fill(); x.lineCap = 'round'; x.strokeStyle = col; x.lineWidth = w * .27;
      for (const fa of [-.35, .35]) { x.beginPath(); x.moveTo(Math.sin(fa) * w * .4, -w * .8); x.lineTo(Math.sin(fa) * w * 1.3, -w * .8 - Math.cos(fa) * w * 1.1); x.stroke(); } }
    x.restore();
  };
  const r = rng(19);
  for (const [n, y0, w0, blur, col] of [[18, 700, 26, 9, '#626262'], [11, 820, 42, 5, '#303030'], [6, 960, 72, 2.5, '#0c0c0c']]) {
    x.save(); x.filter = `blur(${blur}px)`;
    for (let i = 0; i < n; i++) {
      const bx = (i + .1 + r() * .8) / n * 2000 - 40, by = y0 + w0 * 2.4, tx = bx + (r() - .5) * w0 * 4, ty = by - w0 * (6.5 + r() * 3.5);
      arm(bx, by, tx, ty, w0, Math.floor(r() * 3), col, (r() - .5) * 1.4);
    }
    x.fillStyle = col; for (let i = 0; i < n * 1.4; i++) { const hx = (i + r()) / (n * 1.4) * 2100 - 90, hr = w0 * 1.9; x.beginPath(); x.ellipse(hx, y0 + 40 + r() * 40, hr * .85, hr, 0, 0, Math.PI * 2); x.fill(); x.fillRect(hx - hr * 1.5, y0 + 40 + hr * .6, hr * 3, 600); }
    x.restore();
  }
  return c;
}
// —— 音箱：上面一排旋钮的箱头，下面 2×2 的喇叭，金属包角；左上一盏灯 ——
function drawAmp() {
  const c = createCanvas(W, H), x = c.getContext('2d');
  x.fillStyle = '#1a1a1a'; x.fillRect(0, 0, W, H);
  const halo = x.createRadialGradient(560, 120, 30, 700, 300, 1400); halo.addColorStop(0, '#9a9a9a'); halo.addColorStop(.5, '#3a3a3a'); halo.addColorStop(1, '#121212');
  x.fillStyle = halo; x.fillRect(0, 0, W, H);
  // 箱头：面板 + 一排旋钮
  x.fillStyle = '#0d0d0d'; x.fillRect(300, -40, 1320, 210);
  const pn = x.createLinearGradient(0, 30, 0, 140); pn.addColorStop(0, '#d8d8d4'); pn.addColorStop(1, '#8c8c88'); x.fillStyle = pn; x.fillRect(340, 40, 1240, 100);
  for (let k = 0; k < 9; k++) {
    const kx = 420 + k * 128, ky = 90;
    x.fillStyle = 'rgba(0,0,0,.45)'; x.beginPath(); x.arc(kx + 6, ky + 8, 34, 0, Math.PI * 2); x.fill();
    const kg = x.createRadialGradient(kx - 10, ky - 12, 2, kx, ky, 34); kg.addColorStop(0, '#ffffff'); kg.addColorStop(.35, '#b8b8b8'); kg.addColorStop(.75, '#3a3a3a'); kg.addColorStop(1, '#111');
    x.fillStyle = kg; x.beginPath(); x.arc(kx, ky, 32, 0, Math.PI * 2); x.fill();
    const a = (-130 + hash(k, 4) * 260) * D; x.strokeStyle = '#111'; x.lineWidth = 5; x.beginPath(); x.moveTo(kx, ky); x.lineTo(kx + Math.sin(a) * 28, ky - Math.cos(a) * 28); x.stroke();
  }
  // 箱体：皮面 + 包角
  x.fillStyle = '#0b0b0b'; x.fillRect(300, 190, 1320, 1000);
  x.fillStyle = '#1e1e1e'; x.fillRect(340, 230, 1240, 960);
  for (const [cx, cy] of [[300, 190], [1620, 190]]) { const cg = x.createLinearGradient(cx - 60, cy, cx + 60, cy + 60); cg.addColorStop(0, '#666'); cg.addColorStop(.5, '#eee'); cg.addColorStop(1, '#444'); x.fillStyle = cg; x.beginPath(); x.moveTo(cx - 6, cy - 6); x.lineTo(cx + (cx < 900 ? 90 : -90), cy - 6); x.lineTo(cx - 6 + (cx < 900 ? 0 : 0), cy + 90); x.closePath(); x.fill(); }
  // 四个喇叭：外圈折环、纸盆的放射纹、防尘帽的高光、一圈螺丝
  for (const [cx, cy] of [[655, 500], [1265, 500], [655, 1050], [1265, 1050]]) {
    const R = 260;
    const ring = x.createRadialGradient(cx - 60, cy - 60, R * .7, cx, cy, R); ring.addColorStop(0, '#3a3a3a'); ring.addColorStop(.6, '#bdbdbd'); ring.addColorStop(1, '#222');
    x.fillStyle = ring; x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.fill();
    const cone = x.createRadialGradient(cx - 50, cy - 60, 20, cx, cy, R * .86); cone.addColorStop(0, '#9a9a9a'); cone.addColorStop(.35, '#3c3c3c'); cone.addColorStop(.8, '#181818'); cone.addColorStop(1, '#5a5a5a');
    x.fillStyle = cone; x.beginPath(); x.arc(cx, cy, R * .86, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(255,255,255,.07)'; x.lineWidth = 3; for (let k = 0; k < 36; k++) { const a = k / 36 * Math.PI * 2; x.beginPath(); x.moveTo(cx + Math.cos(a) * R * .3, cy + Math.sin(a) * R * .3); x.lineTo(cx + Math.cos(a) * R * .84, cy + Math.sin(a) * R * .84); x.stroke(); }
    const cap = x.createRadialGradient(cx - 30, cy - 34, 4, cx, cy, R * .3); cap.addColorStop(0, '#ffffff'); cap.addColorStop(.4, '#9c9c9c'); cap.addColorStop(1, '#141414');
    x.fillStyle = cap; x.beginPath(); x.arc(cx, cy, R * .3, 0, Math.PI * 2); x.fill();
    for (let k = 0; k < 8; k++) { const a = (k + .5) / 8 * Math.PI * 2, sx = cx + Math.cos(a) * (R + 22), sy = cy + Math.sin(a) * (R + 22); const sg = x.createRadialGradient(sx - 2, sy - 2, 1, sx, sy, 9); sg.addColorStop(0, '#fff'); sg.addColorStop(1, '#444'); x.fillStyle = sg; x.beginPath(); x.arc(sx, sy, 8, 0, Math.PI * 2); x.fill(); }
  }
  x.save(); x.globalCompositeOperation = 'lighter'; x.filter = 'blur(60px)'; x.fillStyle = 'rgba(90,90,90,.45)'; x.beginPath(); x.ellipse(620, 380, 520, 300, -.3, 0, Math.PI * 2); x.fill(); x.restore();
  return c;
}


// —— 网点：把照片画成 45° 的点。g 已经在照片坐标里；只画落在 [x0,y0,x1,y1]（照片坐标）里的点 ——
// pitch：点距（照片 px）；gain：点扩大（复印越多点越胖）；wob：点的边不圆（0..1）；seed：每一代不一样的歪
export function halftone(g, { pitch = 12, gain = 1, wob = 0, seed = 1, box = [0, 0, W, H], ink = '#000', angle = 45, extra = 0, lum = null, shape = 'dot' } = {}) {
  // shape：dot 圆点 · line 线条（线网） · square 方点 · cross 十字
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
    } else if (shape === 'dot') { p.moveTo(x + r, y); p.arc(x, y, r, 0, Math.PI * 2); }
    else {
      const box4 = (du, dv) => { const q = [[-du, -dv], [du, -dv], [du, dv], [-du, dv]]; q.forEach(([a1, b1], k) => { const X = (u + a1) * ca - (v + b1) * sa, Y = (u + a1) * sa + (v + b1) * ca; k ? p.lineTo(X, Y) : p.moveTo(X, Y); }); p.closePath(); };
      if (shape === 'line') box4(pitch * .52, Math.min(pitch * .5, pitch * .5 * dark * gain * 1.15 + pitch * extra));
      else if (shape === 'square') { const h = Math.min(pitch * .5 + pitch * extra, r * .9); box4(h, h); }
      else { const h = r * 1.15, w = h * .34 + pitch * extra * .5; box4(h, w); box4(w, h); }
    }
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
