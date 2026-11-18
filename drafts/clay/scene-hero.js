// 封面（第二版，主人：“不用聚焦在真实，聚焦在视觉效果顶尖”）：
// 钴蓝底上两个巨大的、几色泥没揉匀的“黏土”站着；一根切泥线刚把“土”斜着切开，上半块正滑下去，露出截面里的大理石纹。
const HERO_PAL = ['#FF5A2E', '#FFC93C', '#1FB5A8', '#FF9EC0', '#FFF1DC', '#3247E6', '#9EF0C8', '#C7B2FF'];
const HC = { orange: 0, mustard: 1, teal: 2, pink: 3, cream: 4, cobalt: 5, mint: 6, lilac: 7 };
function buildHero(gl, Q) {
  const n = (k, d) => (Q.get(k) != null ? +Q.get(k) : d);
  const text = CLAY.textField(gl, { text: '黏土', font: Q.get('font') || '{S} ZCOOL', worldWidth: n('ww', 7.7), W: n('tw', 3072), Hh: Math.round(n('tw', 3072) * 0.6), letterSpacing: 0.05, blur: 3 });
  const tp = [n('tx', -0.75), 0, 0];
  const g = text.glyphs, top = text.top;
  const cx1 = (g[1][0] + g[1][1]) / 2, split = (g[0][1] + g[1][0]) / 2;
  // 切面：往右下斜，并且朝镜头倾——下半截的截面正对着看
  const N = [n('nx', 0.3), 1, n('nz', 0.8)], nl = Math.hypot(...N), Nn = N.map(v => v / nl);
  const P0 = [cx1, top * n('cy', 0.56), 0];
  const c = Nn[0] * P0[0] + Nn[1] * P0[1] + Nn[2] * P0[2];
  const norm = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
  const t1 = norm([Nn[1], -Nn[0], 0]); // 切面里往右下
  const t2 = norm([Nn[1] * t1[2] - Nn[2] * t1[1], Nn[2] * t1[0] - Nn[0] * t1[2], Nn[0] * t1[1] - Nn[1] * t1[0]]); // 切面里另一个方向
  const sl = n('slide', 0.7), sb = n('back', 0.45);
  const off = [0, 1, 2].map(k => t1[k] * sl + t2[k] * sb * Math.sign(t2[2] || 1) * -1);
  const blobs = [], coils = [], dents = [], tools = [];
  const ball = (x, z, r, cc, s = [1, 1, 1], y) => blobs.push({ p: [x, y ?? r * s[1] * 0.93, z], r, s, c: cc });
  // 切下来掉落的碎屑（半空中）

  // 地上的球
  ball(-5.6, 1.6, 0.62, HC.pink); ball(-4.5, 2.6, 0.32, HC.mustard); ball(3.0, 2.7, 0.34, HC.mint); ball(6.6, 2.9, 0.22, HC.cream); ball(7.2, -1.6, 0.5, HC.pink);
  ball(-6.4, -1.4, 0.8, HC.lilac, [1.15, 0.55, 1.1]);
  
  // 一根搓好的泥卷，竖着朝镜头躺在“土”右边；切泥线刚切下两片：一片还立着，一片倒向镜头——截面是螺旋
  const LX = n('lx0', 4.55), LR = n('lr', 0.74), LZ = n('lz0', -0.1);
  const cyls = [
    { p: [LX, LR, LZ - 0.9], ax: [0, 0, 1], r: LR, h: 1.1, off: -1.25, rr: 0.07, c: 20 },
    { p: [LX + 0.05, LR, LZ + 0.55], ax: [0.08, 0, 1], r: LR, h: 0.2, off: 0.0, rr: 0.05, c: 20 },
  ];
  // 倒下的一片：轴从 z 转向 y（倒向镜头，截面朝上朝前）
  const tip = n('tip', 1.05), sz = 1.45;
  cyls.push({ p: [LX + 0.2, 0.2 * Math.sin(tip) + LR * Math.cos(tip) * 0.98, LZ + sz + LR * Math.sin(tip) * 0.8], ax: [0.12, Math.sin(tip), Math.cos(tip)], r: LR, h: 0.2, off: 0.42, rr: 0.05, c: 20 });
  // 切下来时崩出的碎屑（半空中，往镜头这边掉）
  const cw = [LX - 0.9, 1.9, LZ + 0.6];
  [[0, 0, 0.07], [-0.35, -0.5, 0.05], [-0.15, -0.95, 0.06], [-0.55, -1.25, 0.04], [0.1, -1.5, 0.05]].forEach(([dx, dy, r], i) => ball(cw[0] + dx, cw[2] + 0.25 * i, r, [HC.orange, HC.pink, HC.mustard, HC.cream, HC.orange][i], [1, 1.1, 1], cw[1] + dy));
  // 切泥线：绷在第一刀的缝里，两头木把手
  const wz = LZ + 0.32, A = [LX - 1.3, LR * 2 + 0.55, wz], B = [LX + 1.6, LR * 2 + 0.75, wz];
  tools.push({ a: A, b: B, ra: 0.013, rb: 0.013 });
  tools.push({ a: [A[0], A[1] - 0.3, A[2]], b: [A[0], A[1] + 0.3, A[2]], ra: 0.085, rb: 0.085 });
  tools.push({ a: [B[0], B[1] - 0.3, B[2]], b: [B[0], B[1] + 0.3, B[2]], ra: 0.085, rb: 0.085 });
  window.__hero = { nian: [tp[0] + g[1][1] - 0.35, top * 0.73, 0.55], log: [LX + 0.25, LR * 1.25, LZ + 1.75], wire: [LX + 0.9, LR * 2 + 0.7, wz], tu: [tp[0] + cx1, top * 0.12, 0.6] };
  const cam = { pos: [n('camx', 0.9), n('camy', 2.7), n('camz', 12.6)], tgt: [n('tgx', 1.15), n('tgy', 1.5), 0], fov: n('fov', 32) };
  const offL = (Q.get('off') || '').split(',');
  if (offL.includes('blob')) blobs.length = 0; if (offL.includes('tool')) tools.length = 0; if (offL.includes('cyl')) cyls.length = 0;
  return {
    text: offL.includes('text') ? null : text, textPos: tp, flat: false, H: n('H', 0.34), R: n('R', 0.2), warp: 0.05, dome: n('dome', 0.14),
    gCol: [10, 10], gSq: [1, 1], gRot: [0.02, -0.025],
    cut: !Q.get('cut') ? null : { n: Nn, c, off, x: split },
    marble: ['#FF5A2E', '#FF9EC0', '#FFC93C', '#FFF1DC'].map(CLAY.hex), marbleScale: n('ms', 1.3),
    blobs, coils, dents, tools, cyls,
    palette: HERO_PAL.map(CLAY.hex),
    cam, shift: [0, n('shy', 0)],
    light: { dir: [n('lx', -0.45), n('ly', 0.72), n('lz', 0.55)], key: [2.6, 2.35, 2.1], sky: [0.16, 0.24, 0.62], bounce: [0.1, 0.13, 0.4],
      rimDir: [0.7, 0.35, -0.6], rim: [1.6, 0.55, 1.0] },
    floorCol: CLAY.hex(Q.get('bgc') || '#3A50EE'), bgTop: CLAY.hex('#4A63FF'), bgBot: CLAY.hex(Q.get('bgc') || '#3A50EE'), floorTex: [0.02, 0, 1, 0],
    fog: [16, 34], shadowK: n('sk', 7), seed: 3,
    focus: Math.hypot(cam.pos[2], cam.pos[1] - 2), aperture: n('ap', 10),
  };
}
