// 一朵大花（原创构图）：背景湿画法两色互渗 → 叶子 → 三圈花瓣逐层罩染 → 花心 → 回流花、垂流、甩点。
function drawFlower(P, o = {}) {
  const { petal, ellipse, rng } = WC; const cx = o.cx || 1150, cy = o.cy || 520, s = o.s || 1; const R = rng(o.seed || 4);
  const pal = o.pal || { bgA: '#5b8fe0', bgB: '#f6a07a', leaf: '#3c9a6a', leaf2: '#1d6a55', outer: '#ef5d8a', mid: '#f47a5f', inner: '#c4185a', heart: '#f6b73c', dot: '#8a2448' };
  const step = o.step == null ? 99 : o.step; let n = 0; const go = () => (n++ < step);
  const RF = 420 * s; const avoid = (x, y) => { const d = Math.hypot(x - cx, y - cy) + (WC.fbm(x / 60, y / 60, 3) - 0.5) * 160 * s; return 0.08 + 0.92 * Math.min(1, Math.max(0, (d - RF * 0.85) / (RF * 0.35))); };
  // 1 背景：两片湿画法，大模糊 → 互相渗
  if (go()) P.wash([[[cx - 900 * s, cy - 520 * s], [cx + 120 * s, cy - 600 * s], [cx + 260 * s, cy - 120 * s], [cx - 300 * s, cy + 160 * s], [cx - 1000 * s, cy + 40 * s]]], { color: pal.bgA, layers: 30, alpha: 0.05, blur: 22, amt: 1.1, edge: 1.4, gran: 1.4, strength: 0.8, seed: 11, mask: avoid, bloom: [[cx - 380 * s, cy - 260 * s, 120 * s, 0.6]] });
  if (go()) P.wash([[[cx - 100 * s, cy + 60 * s], [cx + 700 * s, cy - 200 * s], [cx + 820 * s, cy + 520 * s], [cx - 300 * s, cy + 600 * s]]], { color: pal.bgB, layers: 30, alpha: 0.05, blur: 22, amt: 1.1, edge: 1.4, gran: 1.2, strength: 0.75, seed: 12, mask: avoid, bloom: [[cx + 470 * s, cy + 250 * s, 95 * s, 0.55]] });
  // 2 叶子
  const leaf = (a, len, w) => petal(cx, cy, len * s, w * s, a, 0.0, 250 * s);
  if (go()) P.wash([leaf(2.3, 380, 150), leaf(0.6, 360, 130)], { color: pal.leaf, layers: 36, alpha: 0.04, amt: 0.35, baseAmt: 0.2, edge: 2.4, strength: 0.9, seed: 21 });
  if (go()) P.wash([leaf(2.75, 300, 105), leaf(-2.6, 260, 95)], { color: pal.leaf2, layers: 32, alpha: 0.04, amt: 0.35, baseAmt: 0.2, edge: 2.4, strength: 0.9, seed: 22 });
  const half = (a, len, w) => { const full = petal(cx, cy, len * s, w * s, a, 0.0, 250 * s); return full.slice(0, 16); };
  if (go()) P.wash([half(2.3, 380, 150), half(0.6, 360, 130), half(2.75, 300, 105), half(-2.6, 260, 95)], { color: pal.leaf2, layers: 30, alpha: 0.04, amt: 0.3, baseAmt: 0.15, edge: 2.4, strength: 0.8, seed: 23 });
  // 3 外圈花瓣：两组交错，重叠处自然更深
  const ring = (k, N, len, wid, off, jit, r0 = 0) => { const out = []; for (let i = k; i < N; i += 2) { const a = off + i / N * Math.PI * 2 + (R() - .5) * jit; out.push(petal(cx, cy, len * s * (0.9 + 0.2 * R()), wid * s * (0.9 + 0.2 * R()), a, 0.04, r0 * s)); } return out; };
  const base = (r0, len) => (x, y) => { const r = Math.hypot(x - cx, y - cy) / s; return 0.5 + 0.75 * (1 - Math.min(1, Math.max(0, (r - r0) / len))); };
  const o1 = ring(0, 10, 250, 230, 0.2, 0.15, 110), o2 = ring(1, 10, 240, 220, 0.2, 0.15, 105);
  if (go()) P.wash(o1, { color: pal.outer, layers: 40, alpha: 0.035, amt: 0.4, baseAmt: 0.18, edge: 2.6, strength: 0.75, seed: 31, mask: base(110, 260), bloom: [[cx + 230 * s, cy - 150 * s, 70 * s, 0.6]] });
  if (go()) P.wash(o2, { color: pal.outer, layers: 40, alpha: 0.035, amt: 0.4, baseAmt: 0.18, edge: 2.6, strength: 0.7, seed: 32, mask: base(105, 250), bloom: [[cx - 200 * s, cy + 190 * s, 60 * s, 0.6]] });
  const m1 = ring(0, 8, 170, 160, 0.6, 0.2, 50), m2 = ring(1, 8, 160, 150, 0.6, 0.2, 48);
  if (go()) P.wash(m1, { color: pal.mid, layers: 36, alpha: 0.035, amt: 0.4, baseAmt: 0.18, edge: 2.6, strength: 0.75, seed: 41, mask: base(50, 180) });
  if (go()) P.wash(m2, { color: pal.mid, layers: 36, alpha: 0.035, amt: 0.4, baseAmt: 0.18, edge: 2.6, strength: 0.75, seed: 42, mask: base(48, 170) });
  const i1 = ring(0, 7, 110, 100, 1.0, 0.3, 14).concat(ring(1, 7, 100, 95, 1.0, 0.3, 12));
  if (go()) P.wash(i1, { color: pal.inner, layers: 34, alpha: 0.04, amt: 0.4, baseAmt: 0.18, edge: 2.8, strength: 0.9, seed: 51 });
  // 湿中湿：趁花瓣没干，往里点一笔暖黄，自己晕开
  if (go()) P.wash([WC.ellipse(cx + 40 * s, cy - 30 * s, 210 * s, 170 * s, 0.4, 16)], { color: '#ffc04a', layers: 24, alpha: 0.05, blur: 26, amt: 0.9, edge: 0.6, gran: 0.6, strength: 0.6, seed: 55 });
  // 4 花心：黄色一点，再点几下深色
  if (go()) P.wash([ellipse(cx, cy, 52 * s, 48 * s, 0, 14)], { color: pal.heart, layers: 30, alpha: 0.05, amt: 0.5, edge: 2.2, strength: 1.0, seed: 61 });
  if (go()) { const dots = []; for (let i = 0; i < 26; i++) { const a = R() * 7, r = Math.sqrt(R()) * 46 * s; dots.push(ellipse(cx + Math.cos(a) * r, cy + Math.sin(a) * r, (3 + R() * 5) * s, (3 + R() * 5) * s, 0, 8)); } P.wash(dots, { color: pal.dot, layers: 8, alpha: 0.25, amt: 0.3, depth: 1, edge: 1.4, strength: 1.2, seed: 62 }); }
  // 5 垂流 + 甩点
  if (go()) { P.splatter(cx + 160 * s, cy - 40 * s, 520 * s, 70, { color: pal.outer, size: 9 * s, seed: 81, sx: 1.3, sy: 0.8 }); P.splatter(cx - 420 * s, cy - 120 * s, 360 * s, 40, { color: pal.bgA, size: 8 * s, seed: 82 }); P.splatter(cx + 50 * s, cy + 30 * s, 300 * s, 30, { color: pal.inner, size: 6 * s, seed: 83 }); }
}
