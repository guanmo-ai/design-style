// 距离场 → 网格：字（任意字体）和由几个球融成的软东西（果冻熊、黏土），都先写成距离函数，再用 MarchingCubes 取等值面。
import { THREE } from './lib.js';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';

// 一维平方距离变换（Felzenszwalb & Huttenlocher）
function edt1(f, n) {
  const d = new Float32Array(n), v = new Int32Array(n), z = new Float32Array(n + 1); let k = 0; v[0] = 0; z[0] = -1e20; z[1] = 1e20;
  for (let q = 1; q < n; q++) { let s; do { const p = v[k]; s = ((f[q] + q * q) - (f[p] + p * p)) / (2 * q - 2 * p); if (s <= z[k]) k--; else break; } while (k >= 0); k++; v[k] = q; z[k] = s; z[k + 1] = 1e20; }
  k = 0; for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; const p = v[k]; d[q] = (q - p) * (q - p) + f[p]; } return d;
}
function edt(mask, w, h) {   // mask=1 的像素到最近 mask=0 像素的距离
  const INF = 1e20, g = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) g[i] = mask[i] ? INF : 0;
  const col = new Float32Array(h);
  for (let x = 0; x < w; x++) { for (let y = 0; y < h; y++) col[y] = g[y * w + x]; const d = edt1(col, h); for (let y = 0; y < h; y++) g[y * w + x] = d[y]; }
  const row = new Float32Array(w);
  for (let y = 0; y < h; y++) { for (let x = 0; x < w; x++) row[x] = g[y * w + x]; const d = edt1(row, w); for (let x = 0; x < w; x++) g[y * w + x] = Math.sqrt(d[x]); }
  return g;
}
// 一个字的二维有符号距离（世界单位，字高 = size）。返回 d(x, y)：x 向右、y 向上，原点在字的包围盒底部中心
export function glyph2D(ch, fontCSS, size, px = 420) {
  const pad = Math.round(px * 0.25), W = px + pad * 2, H = px + pad * 2;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, W, H); x.fillStyle = '#fff'; x.font = `${px}px ${fontCSS}`; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  const m = x.measureText(ch); const asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent;
  const by = H / 2 + (asc - desc) / 2; x.fillText(ch, W / 2, by);
  const img = x.getImageData(0, 0, W, H).data, inside = new Uint8Array(W * H), outside = new Uint8Array(W * H);
  let minY = H, maxY = 0, minX = W, maxX = 0;
  for (let i = 0; i < W * H; i++) { const on = img[i * 4] > 127; inside[i] = on; outside[i] = !on; if (on) { const yy = (i / W) | 0, xx = i % W; minY = Math.min(minY, yy); maxY = Math.max(maxY, yy); minX = Math.min(minX, xx); maxX = Math.max(maxX, xx); } }
  const dOut = edt(outside, W, H), dIn = edt(inside, W, H);
  let sd = new Float32Array(W * H); for (let i = 0; i < W * H; i++) sd[i] = dOut[i] - dIn[i];   // 外正内负
  // 模糊几遍：笔画中线（距离场的“脊”）变圆，挤出来的枕头就没有折痕
  const R = Math.round(px * 0.012), tmp = new Float32Array(W * H);
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < H; y++) { let acc = 0; for (let x = -R; x <= R; x++) acc += sd[y * W + Math.min(W - 1, Math.max(0, x))]; for (let x = 0; x < W; x++) { tmp[y * W + x] = acc / (2 * R + 1); acc += sd[y * W + Math.min(W - 1, x + R + 1)] - sd[y * W + Math.max(0, x - R)]; } }
    for (let x = 0; x < W; x++) { let acc = 0; for (let y = -R; y <= R; y++) acc += tmp[Math.min(H - 1, Math.max(0, y)) * W + x]; for (let y = 0; y < H; y++) { sd[y * W + x] = acc / (2 * R + 1); acc += tmp[Math.min(H - 1, y + R + 1) * W + x] - tmp[Math.max(0, y - R) * W + x]; } }
  }
  const k = size / (maxY - minY), cx = (minX + maxX) / 2;
  const fn = (X, Y) => {   // 双线性取样
    const u = X / k + cx, v = maxY - Y / k;
    const i = Math.max(0, Math.min(W - 2, Math.floor(u))), j = Math.max(0, Math.min(H - 2, Math.floor(v))), fu = Math.min(1, Math.max(0, u - i)), fv = Math.min(1, Math.max(0, v - j));
    const a = sd[j * W + i], b = sd[j * W + i + 1], cc = sd[(j + 1) * W + i], d = sd[(j + 1) * W + i + 1];
    let r = (a * (1 - fu) + b * fu) * (1 - fv) + (cc * (1 - fu) + d * fu) * fv;
    if (u < 0 || u > W - 1 || v < 0 || v > H - 1) r = Math.max(r, 8);
    return r * k;
  };
  fn.width = (maxX - minX) * k; fn.height = size;
  return fn;
}
// 把一个 2D 距离场挤出成“枕头”：中间厚、边缘圆。h0 = 边缘半厚，bulge = 往里每走一个单位多鼓多少，r = 圆角
export function pillow(d2, { h0 = 0.3, bulge = 0.9, maxH = 0.8, r = 0.18 } = {}) {
  return (x, y, z) => {
    const d = d2(x, y) + r;
    const h = Math.min(maxH, h0 + bulge * Math.max(0, -d2(x, y)));
    const qx = d, qy = Math.abs(z) - h + r;
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
  };
}
// 平滑并集
export const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
export const sdEllipsoid = (x, y, z, rx, ry, rz) => { const k0 = Math.hypot(x / rx, y / ry, z / rz), k1 = Math.hypot(x / rx / rx, y / ry / ry, z / rz / rz); return k0 * (k0 - 1) / k1; };
// 距离函数 → MarchingCubes 网格。box = [cx, cy, cz, 半边长]（立方体），res = 每边格数
export function meshSDF(fn, box, res, material, maxPoly = 600000) {
  const [cx, cy, cz, s] = box;
  const mc = new MarchingCubes(res, material, false, false, maxPoly);
  mc.isolation = 0;
  const N = res, F = mc.field;
  for (let k = 0; k < N; k++) for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const hN = N / 2, x = cx + (i - hN) / hN * s, y = cy + (j - hN) / hN * s, z = cz + (k - hN) / hN * s;   // 与 MarchingCubes 内部的 fx = (x − N/2)/(N/2) 对齐
    F[i + j * N + k * N * N] = -fn(x, y, z) / s * 40;   // 里面为正
  }
  mc.update();
  // 把 MarchingCubes 的 [-1,1] 空间放回世界
  mc.position.set(cx, cy, cz); mc.scale.set(s, s, s);
  // 拷成普通网格（可以随意变换、投影）
  const g = mc.geometry; const n = mc.count;
  const geo = new THREE.BufferGeometry();
  const P = g.attributes.position.array.slice(0, n * 3), Nn = g.attributes.normal.array.slice(0, n * 3);
  for (let i = 0; i < n; i++) { P[i * 3] = P[i * 3] * s; P[i * 3 + 1] = P[i * 3 + 1] * s; P[i * 3 + 2] = P[i * 3 + 2] * s; }
  geo.setAttribute('position', new THREE.BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(Nn, 3));
  const m = new THREE.Mesh(geo, material); m.castShadow = true; m.receiveShadow = true;
  return m;   // 局部原点 = box 中心
}
