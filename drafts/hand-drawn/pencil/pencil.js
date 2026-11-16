// 铅笔原画：纸、石墨、蓝铅笔、红铅笔、面粉袋、时间表。
// 石墨先画在透明层上，再按“纸纹”去掉一部分：轻的笔只落在纸纹的凸起上（颗粒），重的笔把沟也填满。
const PEN = (() => {
  const { rng, makeNoise, fbm, clamp, lerp, smooth, mix, css, canvas } = HD;
  const GRAPH = [44, 44, 52], BLUE = [58, 128, 214], RED = [208, 66, 58];

  function layer(w, h, S) { const c = canvas(w * S, h * S), g = c.getContext('2d'); g.scale(S, S); g.lineCap = g.lineJoin = 'round'; return [c, g]; }
  // 纸纹（0—1），高频 + 一点纤维方向
  function tooth(w, h, seed = 1) {
    const n = makeNoise(seed), n2 = makeNoise(seed + 9), T = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) T[y * w + x] = .5 + .5 * (n(x * .55, y * .62) * .6 + n2(x * .18 + y * .05, y * .9) * .3 + n(x * 1.7, y * 1.5) * .25);
    return T;
  }
  // 把石墨层“落”到纸上：轻的地方颗粒、重的地方实
  function grain(c, T, tw) {
    const g = c.getContext('2d'), im = g.getImageData(0, 0, c.width, c.height), d = im.data, w = c.width;
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      const a = d[i + 3] / 255; if (!a) continue;
      const x = p % w, y = (p / w) | 0, t = T[(y % tw) * tw + (x % tw)];
      d[i + 3] = 255 * a * smooth(.72 - a * .62, .9 - a * .45, t + .12);
    }
    g.putImageData(im, 0, 0);
  }
  // 一笔铅笔线：手会抖一点、两头轻中间重；passes > 1 就是来回描了几遍
  function line(g, pts, o = {}) {
    const { w = 1.6, col = GRAPH, a = .9, passes = 1, wob = .7, seed = 1, taper = .25, press } = o;
    const n = makeNoise(seed), r = rng(seed);
    // 细分：每段不超过 6 px，压力曲线才有地方起作用
    const R = [pts[0]]; for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i], k = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 6)); for (let j = 1; j <= k; j++) R.push([ax + (bx - ax) * j / k, ay + (by - ay) * j / k]); }
    pts = R;
    for (let p = 0; p < passes; p++) {
      const ox = (r() - .5) * wob * 1.6 * p, oy = (r() - .5) * wob * 1.6 * p;
      let L = 0; const acc = [0]; for (let i = 1; i < pts.length; i++) { L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); acc.push(L); }
      for (let i = 1; i < pts.length; i++) {
        const u = acc[i] / (L || 1), pr = press ? press(u) : Math.min(1, u / taper, (1 - u) / taper) ** .6;
        const j0 = n(acc[i - 1] * .02 + p * 7, 0) * wob, j1 = n(acc[i] * .02 + p * 7, 0) * wob;
        g.strokeStyle = css(col, a * (.35 + .65 * pr) * (p ? .55 : 1)); g.lineWidth = Math.max(.35, w * (.35 + .65 * pr));
        g.beginPath(); g.moveTo(pts[i - 1][0] + ox + j0, pts[i - 1][1] + oy - j0); g.lineTo(pts[i][0] + ox + j1, pts[i][1] + oy - j1); g.stroke();
      }
    }
  }
  function catmull(P, closed, seg = 10) {
    const out = [], n = P.length, get = i => closed ? P[(i + n) % n] : P[Math.max(0, Math.min(n - 1, i))];
    const m = closed ? n : n - 1;
    for (let i = 0; i < m; i++) { const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2); for (let s = 0; s < seg; s++) { const t = s / seg, t2 = t * t, t3 = t2 * t; out.push([.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), .5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } }
    out.push(closed ? out[0] : P[n - 1]); return out;
  }
  // 起稿的椭圆：画过头一点、两三圈
  function roughEllipse(g, cx, cy, rx, ry, rot, o = {}) {
    const r = rng(o.seed || 3), loops = o.loops || 2;
    for (let k = 0; k < loops; k++) {
      const a0 = r() * 6.28, sweep = 6.28 * (1.08 + r() * .15), dx = (r() - .5) * rx * .08, dy = (r() - .5) * ry * .08, s = 1 + (r() - .5) * .06;
      const pts = []; for (let t = 0; t <= 1; t += .02) { const a = a0 + sweep * t; const x = Math.cos(a) * rx * s, y = Math.sin(a) * ry * s; pts.push([cx + dx + x * Math.cos(rot) - y * Math.sin(rot), cy + dy + x * Math.sin(rot) + y * Math.cos(rot)]); }
      line(g, pts, { w: o.w || 1.3, col: o.col || BLUE, a: o.a || .55, wob: 1.2, seed: (o.seed || 3) + k, taper: .15 });
    }
  }
  // 面粉袋：动画课第一课的那个袋子。w/h 控制挤压拉伸（面积不变），ears 是两只耳朵的角度（跟随）
  function sack(o) {
    const { x = 0, y = 0, w = 120, h = 150, rot = 0, lean = 0, earL = -2.3, earR = -.85, bulge = .05, earLen = .17 } = o;
    // 一只耳朵：从外侧根部出去，圆头，回到内侧根部
    const ear = (bo, bi, ang, len) => { const mx = (bo[0] + bi[0]) / 2, my = (bo[1] + bi[1]) / 2, dx = Math.cos(ang), dy = Math.sin(ang), px = -dy, py = dx, tx = mx + dx * len, ty = my + dy * len;
      return [bo, [tx + px * .045 + dx * -.01, ty + py * .045], [tx + dx * .025, ty + dy * .025], [tx - px * .045, ty - py * .045], bi]; };
    const P = [[0, .5], [.38, .5], [.49, .43], [.52 + bulge, .12], [.5, -.16],
      ...ear([.46, -.28], [.3, -.34], earR, earLen), [.14, -.31], [.05, -.27], [.07, -.34], [0, -.37], [-.07, -.34], [-.05, -.27], [-.14, -.31],
      ...ear([-.3, -.34], [-.46, -.28], earL, earLen), [-.5, -.16], [-.52 - bulge, .12], [-.49, .43], [-.38, .5]];
    const tr = ([u, v]) => { const X = (u + lean * v) * w, Y = v * h; return [x + X * Math.cos(rot) - Y * Math.sin(rot), y + X * Math.sin(rot) + Y * Math.cos(rot)]; };
    return { pts: catmull(P.map(tr), true, 8), tr };
  }
  function drawSack(g, o, st = {}) {
    const { pts, tr } = sack(o), seed = st.seed || 5;
    const col = st.col || GRAPH;
    if (st.construct) {
      // 蓝铅笔：体块的椭圆 + 动作线
      const [cx, cy] = tr([0, .02]);
      roughEllipse(g, cx, cy, o.w * .5, o.h * .48, o.rot, { seed, a: .5 });
      const a = tr([o.lean * -.3, .75]), b = tr([o.lean * .3, -.7]);
      line(g, catmull([a, [(a[0] + b[0]) / 2 + Math.cos(o.rot) * o.w * .12, (a[1] + b[1]) / 2 + Math.sin(o.rot) * o.w * .12], b], false), { w: 1.4, col: BLUE, a: .6, seed: seed + 3 });
      line(g, [tr([-.55, .1]), tr([.55, .06])], { w: 1, col: BLUE, a: .4, seed: seed + 4 });
    }
    if (st.shade) {
      // 影：袋子右下半边，斜排线
      const [c2] = [canvas(g.canvas.width, g.canvas.height)], k = c2.getContext('2d'); k.setTransform(g.getTransform()); k.lineCap = 'round';
      const r = rng(seed + 11), [cx, cy] = tr([0, 0]);
      for (let t = -o.h; t < o.h * 1.4; t += 5) { const ax = cx + t - o.h * .2, ay = cy - o.h * .7; line(k, [[ax + o.w * .05, ay], [ax - o.h * .6, ay + o.h * 1.3]], { w: 1.3, col, a: .55 + r() * .2, seed: seed + t | 0, wob: .5, taper: .2 }); }
      for (let t = -o.h; t < o.h * 1.4; t += 7) { const ax = cx + t - o.h * .1, ay = cy + o.h * .05; line(k, [[ax, ay], [ax + o.h * .5, ay + o.h * .5]], { w: 1.1, col, a: .32 + r() * .15, seed: seed + 900 + t | 0, wob: .5, taper: .2 }); }
      k.globalCompositeOperation = 'destination-in'; k.beginPath(); pts.forEach(([x, y], i) => i ? k.lineTo(x, y) : k.moveTo(x, y)); k.fill();
      // 只留离光远的一边
      const sx = tr([.75, .9]), lx = tr([-.4, -.5]); const lg = k.createLinearGradient(lx[0], lx[1], sx[0], sx[1]); lg.addColorStop(0, 'rgba(0,0,0,0)'); lg.addColorStop(.42, 'rgba(0,0,0,0)'); lg.addColorStop(.52, 'rgba(0,0,0,.6)'); lg.addColorStop(.64, 'rgba(0,0,0,1)'); lg.addColorStop(1, 'rgba(0,0,0,1)');
      k.fillStyle = lg; k.fillRect(-4000, -4000, 8000, 8000);
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(c2, 0, 0); g.restore();
    }
    // 外轮廓：右下（背光）那一侧压重
    const [cx, cy] = tr([0, 0]);
    const press = u => { const p = pts[Math.min(pts.length - 1, Math.floor(u * (pts.length - 1)))], s = ((p[0] - cx) * .6 + (p[1] - cy) * .8) / Math.max(o.w, o.h); return clamp(.55 + s * 1.1, .35, 1); };
    line(g, pts, { w: st.w || 2.6, col, a: st.a || .92, passes: st.passes || 2, seed, wob: .6, press });
    if (st.detail !== false) {
      // 袋口扎绳 + 两道褶
      // 扎口的绳：两道
      line(g, catmull([tr([-.075, -.29]), tr([0, -.275]), tr([.075, -.29])], false), { w: 2, col, a: .9, seed: seed + 6 });
      line(g, catmull([tr([-.07, -.265]), tr([0, -.25]), tr([.07, -.265])], false), { w: 1.6, col, a: .75, seed: seed + 9 });
      // 从扎口散下来的褶
      line(g, catmull([tr([-.05, -.24]), tr([-.14, -.12]), tr([-.2, .02])], false), { w: 1.4, col, a: .6, seed: seed + 7 });
      line(g, catmull([tr([.05, -.24]), tr([.15, -.13]), tr([.23, -.04])], false), { w: 1.3, col, a: .55, seed: seed + 8 });
      line(g, catmull([tr([0, -.23]), tr([.02, -.13])], false), { w: 1.1, col, a: .45, seed: seed + 10 });
      // 底部压出来的一道
      line(g, catmull([tr([-.32, .42]), tr([0, .45]), tr([.3, .41])], false), { w: 1.1, col, a: .4, seed: seed + 12 });
    }
  }
  // 写字：用字体写，再让它落到纸纹里
  function write(g, txt, x, y, o = {}) {
    const { size = 28, font = 'Caveat', weight = 600, col = GRAPH, a = .85, rot = 0, align = 'left' } = o;
    g.save(); g.translate(x, y); g.rotate(rot); g.font = `${weight} ${size}px ${font}`; g.textAlign = align; g.fillStyle = css(col, a); g.fillText(txt, 0, 0); g.restore();
  }
  // 时间表（timing chart）：一根竖线 + 刻度；关键张画圈，中间张画三角
  function chart(g, x, y, len, ticks, o = {}) {
    const { keys = [], bds = [], col = GRAPH, labels = true, horiz = false } = o;
    const P = t => horiz ? [x + t * len, y] : [x, y + t * len];
    line(g, [P(0), P(1)], { w: 1.8, col, a: .85, seed: 41, taper: .05 });
    ticks.forEach((t, i) => {
      const [px, py] = P(t), L = keys.includes(i + 1) ? 22 : 13;
      line(g, horiz ? [[px, py - L / 2], [px, py + L / 2]] : [[px - L / 2, py], [px + L / 2, py]], { w: 1.5, col, a: .85, seed: 50 + i, taper: .2 });
      if (labels) write(g, String(i + 1), px + (horiz ? -6 : (i % 2 ? -40 : 16)), py + (horiz ? 34 : 7), { size: 19, col, a: .8 });
      if (keys.includes(i + 1)) roughEllipse(g, px + (horiz ? 0 : (i % 2 ? -34 : 22)), py + (horiz ? 27 : 1), 14, 14, 0, { col: RED, a: .8, w: 1.6, seed: 60 + i, loops: 1 });
      if (bds.includes(i + 1)) { const bx = px + (horiz ? 0 : (i % 2 ? -34 : 22)), by = py + (horiz ? 27 : 1); line(g, [[bx - 14, by + 11], [bx, by - 13], [bx + 14, by + 11], [bx - 15, by + 11]], { w: 1.4, col: RED, a: .75, seed: 70 + i, taper: .05 }); }
    });
  }
  // 线影排线填一个区域（标题字）
  function hatchText(g, txt, x, y, o = {}) {
    const { size = 120, font = 'SerifSC', weight = 900, col = GRAPH, gap = 4.2, ang = -.9, S = 1 } = o;
    const W2 = g.canvas.width, H2 = g.canvas.height;
    const m = canvas(W2, H2), mg = m.getContext('2d'); mg.setTransform(g.getTransform()); mg.lineCap = 'round';
    mg.font = `${weight} ${size}px ${font}`;
    const tw = mg.measureText(txt).width;
    const r = rng(9);
    for (let t = -size * 2; t < tw + size * 2; t += gap) { const ax = x + t, ay = y - size; line(mg, [[ax, ay - 10], [ax + Math.cos(ang) * size * 1.6, ay + Math.sin(-ang) * size * 1.6 + 10]], { w: 1.25, col, a: .5 + r() * .2, seed: t | 0, wob: .4, taper: .25 }); }
    mg.globalCompositeOperation = 'destination-in'; mg.fillStyle = '#000'; mg.fillText(txt, x, y);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(m, 0, 0); g.restore();
    g.save(); g.font = `${weight} ${size}px ${font}`; g.lineJoin = 'round';
    for (let k = 0; k < 2; k++) { g.strokeStyle = css(col, k ? .45 : .85); g.lineWidth = k ? 1 : 1.8; g.strokeText(txt, x + (r() - .5) * 2 * k, y + (r() - .5) * 2 * k); }
    g.restore();
    return tw;
  }
  return { GRAPH, BLUE, RED, layer, tooth, grain, line, catmull, roughEllipse, sack, drawSack, write, chart, hatchText };
})();
