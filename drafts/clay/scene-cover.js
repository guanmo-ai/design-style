// 第 0 帧：一张切割垫上，“黏土”两个字刚被捏好平放着；土字正被拇指从上往下按——变薄、往四周摊开，坑里印着指纹。
// 旁边一根搓好的泥条写着 clay，几颗球、一块按扁的饼、一把木刀、几粒碎屑。
const PAL_HEX = ['#EE5B30', '#F3B23A', '#1E8C86', '#F3A1B6', '#F2E6CF', '#3557C9', '#9ED7B8', '#B7A3E6'];
const C = { orange: 0, mustard: 1, teal: 2, pink: 3, cream: 4, cobalt: 5, mint: 6, lilac: 7 };

// Catmull-Rom 细分：几个手点的控制点 → 顺滑的泥条
function spline(pts, per = 8) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push(p1.map((_, j) => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
// 手写体 clay，一笔连下来（字高 1：x 高 0.5，l 到 1，y 下伸到 -0.5）
const CLAY_PATH = [
  [0.44, 0.40], [0.33, 0.50], [0.16, 0.45], [0.06, 0.27], [0.10, 0.08], [0.26, -0.01], [0.42, 0.04], [0.52, 0.16],
  [0.64, 0.45], [0.73, 0.78], [0.72, 0.98], [0.63, 1.0], [0.57, 0.80], [0.59, 0.42], [0.64, 0.10], [0.73, 0.0], [0.84, 0.07],
  [0.96, 0.30], [1.04, 0.44], [0.93, 0.50], [0.82, 0.40], [0.80, 0.18], [0.88, 0.02], [1.00, 0.06], [1.07, 0.30], [1.09, 0.48],
  [1.08, 0.18], [1.13, 0.02], [1.22, 0.05], [1.29, 0.30], [1.31, 0.47], [1.30, 0.20], [1.36, 0.03], [1.47, 0.06], [1.55, 0.30], [1.57, 0.48],
  [1.55, 0.10], [1.50, -0.25], [1.42, -0.45], [1.32, -0.47], [1.30, -0.32], [1.40, -0.14], [1.58, 0.0], [1.72, 0.10],
];

const BG = {
  sand: { floorCol: CLAY.hex('#E6D3BC'), bgTop: CLAY.hex('#E9DAC6'), bgBot: CLAY.hex('#E6D3BC'), floorTex: [0.05, 0.0, 1.0, 0] },
  mat: { floorCol: CLAY.hex('#8FB5A2'), bgTop: CLAY.hex('#9DBFAD'), bgBot: CLAY.hex('#8FB5A2'), floorTex: [0.04, 0.5, 1.0, 0] },
  lilac: { floorCol: CLAY.hex('#B9B3EA'), bgTop: CLAY.hex('#C4BFEF'), bgBot: CLAY.hex('#B9B3EA'), floorTex: [0.04, 0.45, 1.0, 0] },
};
function buildCover(gl, Q) {
  const n = (k, d) => (Q.get(k) != null ? +Q.get(k) : d);
  const text = CLAY.textField(gl, { text: '黏土', font: Q.get('font') || '{S} ZCOOL', worldWidth: n('ww', 8.6), W: n('tw', 3072), Hh: Math.round(n('tw', 3072) * 0.6), letterSpacing: 0.06, blur: 3 });
  const tp = [n('tx', -0.3), 0, n('tz', 1.2)];
  const g = text.glyphs;
  const H = n('H', 0.2), R = n('R', 0.13), dome = n('dome', 0.1), c0 = H * 0.9 + R * 0.4;
  const sq = n('sq', 0.72), sx = 1 / Math.sqrt(sq);
  const topY = (s1) => (H + dome * 0.6 + R + c0) * s1; // 平放的字，顶面离桌多高
  // 文字局部坐标（x 向右，y 向“上”= 世界 -z）→ 世界坐标；第 k 个字按 sy 压扁时绕它的底边中点摊开
  const W = (k, x, y, s1 = 1) => { const cx = (g[k][0] + g[k][1]) / 2, f = 1 / Math.sqrt(s1); return [tp[0] + cx + (x - cx) * f, tp[2] - y * f]; };
  // 在第 k 个字里找一块实心、离边远的点（靠近给定的比例位置）
  const solidAt = (k, fx, fy) => { const [l, r] = g[k]; let best = null, bd = 1e9;
    for (let y = 0.05; y < text.top; y += 0.03) for (let x = l; x < r; x += 0.03) {
      let ok = true; for (const [dx, dy] of [[0, 0], [0.16, 0], [-0.16, 0], [0, 0.16], [0, -0.16]]) if (!text.solid(x + dx, y + dy)) { ok = false; break; }
      if (!ok) continue; const dd = Math.hypot(x - (l + fx * (r - l)), y - fy * text.top); if (dd < bd) { bd = dd; best = [x, y]; } }
    return best; };
  const tuP = solidAt(1, 0.5, Q.get('dy') != null ? +Q.get('dy') : 0.5), tuW = W(1, ...tuP, sq);
  const nianP = solidAt(0, 0.78, 0.3), nianW = W(0, ...nianP);
  const dents = [
    // 土：拇指正按着（第 0 帧的动作）——坑最深，指纹最清楚
    { p: [tuW[0], topY(sq) + 0.02, tuW[1]], n: [0.05, -1, -0.42], size: n('ts', 0.66), depth: n('td', 0.14), up: [0.15, 0, -1], freq: 15, pad: n('pad', 1.25), padCol: C.teal },
    // 黏：早先按过的一下，浅一点
    { p: [nianW[0], topY(1) + 0.02, nianW[1]], n: [-0.18, -1, -0.2], size: 0.46, depth: 0.08, up: [-0.4, 0, -1], freq: 14 },
  ];
  // 拿捏时蹭上的浅指印（几乎看不见，但让表面像被手碰过）
  for (const [k, fx, fy, nn, ux] of [[0, 0.3, 0.75, [0.3, -1, 0.2], 0.4], [0, 0.2, 0.25, [-0.2, -1, -0.3], -0.3], [1, 0.15, 0.12, [0.3, -1, 0.1], 0.2], [1, 0.85, 0.62, [-0.3, -1, 0.2], -0.5]]) {
    const pp = solidAt(k, fx, fy); if (!pp) continue; const w = W(k, ...pp, k === 1 ? sq : 1);
    dents.push({ p: [w[0], topY(k === 1 ? sq : 1) + 0.02, w[1]], n: nn, size: 0.34, depth: 0.025, up: [ux, 0, -1], freq: 13 });
  }
  const tuR = W(1, g[1][1] - 0.25, 0.25, sq), tuL = W(1, g[1][0] + 0.2, 0.25, sq);
  window.__marks = { tu: [tuW[0], topY(sq) - 0.1, tuW[1]], tuR: [tuR[0], topY(sq) * 0.7, tuR[1]], tuL: [tuL[0], topY(sq) * 0.7, tuL[1]], nian: [nianW[0], topY(1), nianW[1]], tuEdge: [tp[0] + g[1][1] * sx - 0.1 * sx, topY(sq) * 0.6, tp[2] - text.top * 0.08] };
  const blobs = [];
  const ball = (x, z, r, c, s = [1, 1, 1]) => blobs.push({ p: [x, r * s[1] * 0.93, z], r, s, c });
  // 一块按扁的粉色饼，中间一个拇指坑
  ball(5.6, -2.7, 0.8, C.pink, [1.0, 0.34, 1.0]); window.__disc = [5.62, 0.5, -2.7];
  dents.push({ p: [5.62, 0.8 * 0.34 * 1.86 + 0.01, -2.7], n: [0.1, -1, -0.15], size: 0.5, depth: 0.12, up: [0.3, 0, -1], freq: 14 });
  ball(6.1, -0.4, 0.5, C.cobalt);
  ball(4.6, -1.35, 0.3, C.mustard);
  ball(7.0, -1.6, 0.24, C.cream);
  ball(-6.4, 3.0, 0.62, C.mint);
  ball(-5.15, 3.9, 0.3, C.lilac);
  ball(-6.6, -2.2, 0.36, C.pink);
  // 碎屑
  let sd = 11; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const crumbs = [[-1.2, 2.3], [0.9, 2.0], [-3.6, 2.1], [4.1, 0.5], [-5.2, 0.4], [3.2, -3.4], [-2.6, -3.6], [5.0, 1.4], [2.2, 4.2]];
  crumbs.forEach(([x, z], i) => { const r = 0.04 + rnd() * 0.05; ball(x, z, r, [C.orange, C.teal, C.mustard, C.pink][i % 4], [1.25, 0.7, 0.9]); });
  // 搓好的泥条：手写 clay
  const S = n('cs', 1.55), cx0 = n('cx', 1.3), cz0 = n('cz', 3.55), cr = n('cr', 0.115);
  const pts = spline(CLAY_PATH, 5).map(([x, y], i, a) => {
    const end = Math.min(i, a.length - 1 - i);
    const r = cr * (0.72 + 0.28 * Math.min(1, end / 6)) * (1 + 0.05 * Math.sin(i * 0.7));
    return [cx0 + x * S, r * 0.92, cz0 - y * S, r];
  });
  const coils = [{ pts, c: C.mustard }];
  window.__marks.coil = [cx0 + 1.57 * S, 0.2, cz0 + 0.3 * S]; window.__marks.coilStart = [cx0 + 0.1 * S, 0.2, cz0 - 0.27 * S];
  // 还没搓完的一截：泥条一头连着一团
  const tail = spline([[-5.9, -3.3], [-5.2, -3.45], [-4.55, -3.3]], 6).map(([x, z], i, a) => [x, 0.16, z, 0.17 + 0.05 * i / a.length]);
  coils.push({ pts: tail, c: C.cobalt });
  ball(-4.2, -3.25, 0.42, C.cobalt, [1.05, 0.82, 1.0]);
  // 木刀
  const tools = [{ a: [-7.6, 0.1, 5.0], b: [-4.2, 0.1, 2.0], ra: 0.11, rb: 0.075 }];
  const off = (Q.get('off') || '').split(',');
  if (off.includes('blob')) blobs.length = 0; if (off.includes('coil')) coils.length = 0; if (off.includes('dent')) dents.length = 0; if (off.includes('tool')) tools.length = 0;
  const cam = { pos: [n('camx', 0.3), n('camy', 6.6), n('camz', 11.2)], tgt: [n('tgx', 0.3), 0.2, n('tgz', -0.5)], fov: n('fov', 30) };
  const fd = Math.hypot(tuW[0] - cam.pos[0], topY(sq) - cam.pos[1], tuW[1] - cam.pos[2]);
  return {
    text: off.includes('text') ? null : text, textPos: tp, flat: true, H, R, warp: 0.05, dome,
    gCol: [C.orange, C.teal], gSq: [1, sq], gRot: [0.035, -0.045],
    blobs, coils, dents, tools,
    palette: PAL_HEX.map(CLAY.hex),
    cam, shift: [n('shx', 0), n('shy', 0)],
    light: { dir: [n('lx', -0.62), n('ly', 0.62), n('lz', -0.48)], key: [2.7, 2.3, 1.9], sky: [0.34, 0.4, 0.52], bounce: [0.24, 0.2, 0.16] },
    ...BG[Q.get('bg') || 'sand'],
    fog: [30, 60], shadowK: n('sk', 6), seed: 3, dbg: n('dbg', 0),
    focus: fd, aperture: n('ap', 16),
  };
}
