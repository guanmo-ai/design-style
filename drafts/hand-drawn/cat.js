// 一只可以摆姿势的猫：只出多边形，怎么画（墨线 / 蜡笔 / 平涂）由各个场景决定。
// 侧面：CAT.side(姿势, {x,y,s,r,fx})；正脸：CAT.face({x,y,s,r})。
const CAT = (() => {
  const { thick, ellipse, cr, xf } = HD;
  const POSES = {
    // 腾空：前爪够出去，后腿蹬直
    leap: { spine: [[-170, 6], [-80, -30], [30, -44], [130, -18]], sr: [60, 54, 68, 60], head: { x: 226, y: -70, r: -0.1, s: 1.22 },
      fn: [[118, 8], [200, 54], [290, 74], [368, 76]], ff: [[140, -6], [232, 20], [316, 26], [384, 18]],
      hn: [[-160, 20], [-262, 62], [-352, 74], [-444, 104]], hf: [[-176, 2], [-284, 24], [-376, 26], [-466, 46]],
      tail: [[-214, -22], [-300, -66], [-370, -130], [-450, -160], [-540, -140]] },
    // 落地：前爪先砸到地上，后半身还在天上
    land: { spine: [[-150, -130], [-70, -150], [20, -110], [90, -46]], sr: [60, 56, 68, 60], head: { x: 184, y: -74, r: 0.08, s: 1.22 },
      fn: [[84, -20], [130, 50], [120, 118], [160, 150]], ff: [[112, -30], [200, 30], [214, 104], [256, 140]],
      hn: [[-146, -116], [-240, -160], [-326, -140], [-410, -168]], hf: [[-160, -138], [-262, -190], [-350, -196], [-432, -234]],
      tail: [[-190, -160], [-262, -236], [-262, -330], [-200, -396], [-116, -388]] },
  };
  // 头（侧面，朝右）：有棱角的轮廓，耳朵是尖的
  const HEAD = [[-62, 42], [-68, -4], [-58, -40], [-54, -50], [-50, -132], [-6, -64], [6, -60], [14, -66], [44, -126], [52, -52], [60, -34], [70, -14], [86, 2], [94, 10], [87, 19], [85, 29], [70, 41], [54, 47], [30, 51], [12, 74], [4, 50], [-18, 78], [-24, 48], [-46, 62]];
  const EAR_IN = [[-44, -56], [-46, -108], [-18, -68]];
  const EYE = [[20, -8], [38, -30], [66, -18], [46, -1]];
  // 逆着运动方向的那一侧长出毛尖
  function fur(poly, back, amp, wave = 38) { const p = HD.resample(poly, 4, true), n = p.length; let A = 0; for (let i = 0; i < n; i++) { const a = p[i], b = p[(i + 1) % n]; A += a[0] * b[1] - b[0] * a[1]; } const sg = A > 0 ? 1 : -1;
    return p.map((q, i) => { const a = p[(i - 1 + n) % n], b = p[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = dy / l * sg, ny = -dx / l * sg, d = nx * back[0] + ny * back[1];
      if (d < 0.4) return q; const u = i * 4 / wave + Math.sin(i * 0.11) * 0.6, ki = Math.floor(u), ph = u - ki, hh = Math.abs(Math.sin(ki * 91.7 + 3.1) * 43758.5) % 1, saw = ph < 0.8 ? ph / 0.8 : (1 - ph) / 0.2, k = amp * (0.25 + hh * 1.5) * saw * Math.min(1, (d - 0.4) * 2.6); return [q[0] + (nx * 0.45 + back[0] * 0.9) * k, q[1] + (ny * 0.45 + back[1] * 0.9) * k]; }); }
  function side(pose, T = {}, { furAmp = 0, back = [-1, 0] } = {}) { const p = typeof pose === 'string' ? POSES[pose] : pose, t = pts => xf(pts, T), f = pl => furAmp ? fur(pl, back, furAmp) : pl;
    const leg = (pts, hind) => { const e = pts[pts.length - 1], d = pts[pts.length - 2], a = Math.atan2(e[1] - d[1], e[0] - d[0]), cx = e[0] + Math.cos(a) * 8, cy = e[1] + Math.sin(a) * 8;
      const claws = [-0.5, 0, 0.5].map(k => { const bx = cx + Math.cos(a) * 22 - Math.sin(a) * k * 18, by = cy + Math.sin(a) * 22 + Math.cos(a) * k * 18; return t([[bx - Math.sin(a) * 4, by + Math.cos(a) * 4], [bx + Math.cos(a + 0.5) * 20, by + Math.sin(a + 0.5) * 20], [bx + Math.sin(a) * 4, by - Math.cos(a) * 4]]); });
      return { limb: t(f(thick(pts, hind ? [56, 36, 19, 15] : [36, 26, 17, 15]))), paw: t(ellipse(cx, cy, hind ? 27 : 25, 17, a)), claws }; };
    const H = { x: p.head.x, y: p.head.y, r: p.head.r, s: p.head.s || 1 }, ht = pts => t(xf(pts, H));
    return { tail: t(thick(p.tail, [22, 23, 21, 17, 7])), hf: leg(p.hf, true), ff: leg(p.ff, false), body: t(f(thick(p.spine, p.sr))), hn: leg(p.hn, true), fn: leg(p.fn, false),
      neck: t(thick([p.spine[p.spine.length - 1], [p.head.x - 30, p.head.y + 16]], [58, 54])),
      head: ht(HEAD), earIn: ht(EAR_IN),
      eye: ht(cr(EYE, true, 8)), pupil: ht(ellipse(45, -15, 5, 13, 0.45, 16)), glint: ht(ellipse(52, -20, 4, 3, 0, 10)), nose: ht([[84, 2], [95, 9], [87, 17]]),
      whisk: [[[70, 26], [112, 34], [156, 28]], [[66, 32], [106, 52], [144, 62]], [[68, 22], [112, 14], [154, -4]]].map(w => ht(cr(w, false, 8))),
      spinePts: t(cr(p.spine, false, 10)), scale: T.s || 1 }; }
  // 分组（同组做并集，边缘光只出现在外轮廓上）
  const groups = c => [[c.tail], [c.hf.limb, c.hf.paw], [c.ff.limb, c.ff.paw], [c.body, c.neck, c.head], [c.hn.limb, c.hn.paw], [c.fn.limb, c.fn.paw]];
  const far = [0, 1, 1, 0, 0, 0];
  const order = c => [c.tail, c.hf.limb, c.hf.paw, c.ff.limb, c.ff.paw, c.body, c.neck, c.hn.limb, c.hn.paw, c.fn.limb, c.fn.paw, c.head];

  // 正脸
  function face(T = {}) { const t = pts => xf(pts, T), mir = pts => pts.map(p => [-p[0], p[1]]).reverse();
    const half = [[0, -120], [72, -114], [130, -62], [152, 0], [182, 36], [146, 50], [170, 86], [118, 88], [64, 124], [0, 134]];
    const head = cr(half.concat(mir(half).slice(1, -1)), true, 8);
    const earR = [[48, -112], [108, -168], [150, -210], [156, -130], [140, -52]], innR = [[78, -112], [116, -150], [140, -176], [142, -124], [128, -80]];
    const eyeR = cr([[24, 2], [60, -42], [108, -24], [68, 22]], true, 10), eyeL = eyeR.map(p => [-p[0], p[1]]);
    const wh = [[[52, 62], [130, 50], [230, 30]], [[54, 70], [136, 76], [236, 84]], [[50, 78], [124, 102], [214, 136]]];
    return { head: t(head), earR: t(earR), earL: t(mir(earR)), innR: t(innR), innL: t(mir(innR)), eyeR: t(eyeR), eyeL: t(eyeL),
      pupR: t(ellipse(66, -10, 9, 30, 0.08, 20)), pupL: t(ellipse(-66, -10, 9, 30, -0.08, 20)), irisR: [66, -10], irisL: [-66, -10],
      nose: t(cr([[-16, 40], [0, 36], [16, 40], [0, 56]], true, 6)), mouth: [t(cr([[0, 56], [0, 70], [-14, 82], [-32, 76]], false, 8)), t(cr([[0, 70], [14, 82], [32, 76]], false, 8))],
      whiskR: wh.map(w => t(cr(w, false, 10))), whiskL: wh.map(w => t(cr(w.map(p => [-p[0], p[1]]), false, 10))), T }; }
  return { POSES, side, order, groups, far, face };
})();
