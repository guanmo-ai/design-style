// scene.js — 封面那张画的“设计稿”：构图、透视、每样东西放在哪
// 乡下的夏天下午：左边一棵大树压住画面，树荫和光斑落在土路上；积乱云在正中长高；
// 路右边一排电线杆退到远处；稻田被风吹出一道道亮纹。光从左上来。
(function (G) {
  function cover(W, H, o = {}) {
    const R = PAINT.rng(o.seed || 31);
    const S = { W, H, seed: o.seed || 31, yh: o.yh ?? 640, vpx: o.vpx ?? 1010, foc: o.foc ?? 1500, hc: o.hc ?? 2.2,
      road: o.road || [0.35, 0.42, 3.4], sun: o.sun || [-0.62, -0.58], shDir: o.shDir || [0.8, -0.6], wind: o.wind ?? 1.2 };
    const yh = S.yh, gp = (X, Z, Y) => PAINT.ground(S, X, Z, Y), k = S.foc / 1500;
    S.ridges = {
      far: PAINT.ridgeLine(W, R, x => yh - 30 * k - 62 * k * Math.exp(-Math.pow((x - W * .8) / (W * .13), 2)) - 30 * k * Math.exp(-Math.pow((x - W * .52) / (W * .1), 2)) - 22 * k * Math.exp(-Math.pow((x - W * .2) / (W * .12), 2)), 5 * k, 0.005 / k, 4),
      forest: PAINT.ridgeLine(W, R, x => x < W * .4 ? yh - 120 * k * Math.pow(1 - x / (W * .4), 1.2) - 10 * k : (x > W * .78 ? yh - 26 * k - 12 * k * Math.sin(x * .012 / k) : yh + 3), 3 * k, 0.02 / k, 3),
    };
    S.clouds = o.clouds || [
      { x: W * .6, base: yh - 52, w: W * .5, h: yh - 60, bud: 2, lean: -.03, tower: .9 },
      { x: W * .93, base: yh - 90, w: W * .17, h: 90, bud: 2, tower: .2 },
      { x: W * .33, base: yh - 80, w: W * .16, h: 70, bud: 1, tower: .2 },
    ];
    const fy = x => S.ridges.forest[Math.max(0, Math.min(W - 1, Math.round(x)))];
    S.back = [{ circles: PAINT.treeline(R, -30, W * .41, fy, 14 * k, 36 * k), base: yh, top: yh - 170 * k }, { circles: PAINT.treeline(R, W * .77, W + 30, fy, 10 * k, 22 * k), base: yh, top: yh - 70 * k }];
    // 大树：在路左边 4.8 m、离镜头 15 m
    const T = o.tree || { X: -4.8, Z: 15 };
    const [tx, tby] = gp(T.X, T.Z, 0), [, tcy] = gp(T.X, T.Z, 6.6);
    S.tree = { tx, tby, tcy };
    S.front = o.noTree ? [] : [{ x: tx - 30 * k, y: tcy - 10 * k, w: 960 * k, h: 620 * k, big: true }];
    const ppm = S.foc / T.Z, cw = 960 * k, ch = 620 * k, cx0 = tx - 30 * k, cy0 = tcy - 10 * k;
    S.crownSpheres = [[-.3, -.02, .21], [-.04, -.2, .24], [.26, -.1, .2], [.4, .12, .13], [-.43, .17, .13], [.06, .1, .17], [-.17, .27, .1], [.2, .26, .09], [-.12, -.36, .12], [.16, -.34, .1]]
      .map(([dx, dy, r]) => [T.X + (cx0 + dx * cw - tx) / ppm, 6.6 - (cy0 + dy * ch * 1.3 - tcy) / ppm, T.Z, r * 1.05 * cw / ppm]);
    S.treeShadow = o.noTree ? [0, 0, 0, 0] : [T.X, T.Z, 1, 1];
    if (o.noTree) S.crownSpheres = [];
    S.sun3 = [-.62, .6, .5];
    S.solidBack = ctx => {
      // 远处右边林子前的老房子：白墙、深色木头、铁皮屋顶
      const [hx, hy] = [W * .865, yh + 6 * k];
      ctx.save(); ctx.translate(hx, hy); ctx.scale(k * 1.4, k * 1.4);
      ctx.fillStyle = '#eee4cf'; ctx.fillRect(-30, -18, 46, 18);
      ctx.fillStyle = '#c9bea8'; ctx.fillRect(16, -15, 16, 15);
      ctx.fillStyle = '#4b3a2e'; for (let i = 0; i < 3; i++) ctx.fillRect(-26 + i * 14, -14, 6, 8);
      ctx.fillStyle = '#3e3029'; ctx.fillRect(-30, -3, 46, 3);
      ctx.fillStyle = '#a54c3c'; ctx.beginPath(); ctx.moveTo(-35, -17); ctx.lineTo(-20, -31); ctx.lineTo(12, -31); ctx.lineTo(22, -17); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c8705a'; ctx.beginPath(); ctx.moveTo(-35, -17); ctx.lineTo(-20, -31); ctx.lineTo(-14, -31); ctx.lineTo(-28, -17); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(40,30,30,.35)'; ctx.fillRect(-30, -17, 46, 3);
      ctx.fillStyle = '#626a74'; ctx.beginPath(); ctx.moveTo(14, -15); ctx.lineTo(24, -24); ctx.lineTo(36, -15); ctx.closePath(); ctx.fill();
      ctx.restore();
      if (o.noTree) return;
      ctx.save(); ctx.translate(tx, tby); ctx.scale(k, k); ctx.translate(-tx, -tby);
      // 大树的树干 + 几根主枝伸进叶团（光从左边来：左亮右暗）
      const limb = (pts, w0, w1) => {
        const n = 30, L = [], Rr = [];
        const P = t => { const u = 1 - t; return [u * u * u * pts[0][0] + 3 * u * u * t * pts[1][0] + 3 * u * t * t * pts[2][0] + t * t * t * pts[3][0], u * u * u * pts[0][1] + 3 * u * u * t * pts[1][1] + 3 * u * t * t * pts[2][1] + t * t * t * pts[3][1]]; };
        for (let i = 0; i <= n; i++) { const t = i / n, p = P(t), q = P(Math.min(1, t + .01)), p0 = P(Math.max(0, t - .01)); let dx = q[0] - p0[0], dy = q[1] - p0[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; const w = (w0 + (w1 - w0) * t) / 2; L.push([p[0] - dy * w, p[1] + dx * w]); Rr.push([p[0] + dy * w, p[1] - dx * w]); }
        const g = ctx.createLinearGradient(pts[0][0] - w0, 0, pts[0][0] + w0, 0); g.addColorStop(0, '#7d6650'); g.addColorStop(.35, '#4a3c32'); g.addColorStop(1, '#1f1b1a');
        ctx.fillStyle = g; ctx.beginPath(); L.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); for (let i = Rr.length - 1; i >= 0; i--) ctx.lineTo(...Rr[i]); ctx.closePath(); ctx.fill();
      };
      limb([[tx, tby + 8], [tx - 4, tby - 120], [tx - 12, tby - 220], [tx - 6, tby - 300]], 92, 54);
      limb([[tx - 10, tby - 280], [tx - 70, tby - 360], [tx - 180, tby - 420], [tx - 300, tby - 470]], 44, 10);
      limb([[tx - 4, tby - 290], [tx + 40, tby - 380], [tx + 120, tby - 450], [tx + 230, tby - 500]], 40, 9);
      limb([[tx - 8, tby - 296], [tx - 14, tby - 400], [tx + 10, tby - 500], [tx - 20, tby - 600]], 34, 8);
      limb([[tx - 120, tby - 400], [tx - 160, tby - 460], [tx - 150, tby - 520], [tx - 190, tby - 580]], 16, 5);
      // 树干上漏下来的几块光
      ctx.fillStyle = 'rgba(190,160,110,.28)'; for (const [dx, dy, w, h] of [[-30, -70, 5, 16], [-34, -160, 4, 10], [-36, -24, 5, 9]]) { ctx.beginPath(); ctx.ellipse(tx + dx, tby + dy, w, h, .2, 0, 7); ctx.fill(); }
      // 根
      ctx.fillStyle = '#4a3c30'; for (const [dx, w] of [[-58, 26], [52, 22], [-20, 18]]) { ctx.beginPath(); ctx.ellipse(tx + dx, tby + 6, w, 6, 0, 0, 7); ctx.fill(); }
      ctx.restore();
      // 树根边的草影
      ctx.fillStyle = 'rgba(20,40,30,.45)'; ctx.beginPath(); ctx.ellipse(tx + 4, tby + 4, 70, 9, 0, 0, 7); ctx.fill();
    };
    // 电线杆：路右边，一根根往远处排
    S.poles = [];
    for (let Z = o.poleZ0 ?? 9; Z < 420; Z += 22) S.poles.push([PAINT.roadX(S, Z) + 3.1, Z]);
    S.drawPoles = ctx => {
      for (let i = S.poles.length - 1; i >= 0; i--) {
        const [X, Z] = S.poles[i];
        const [x, yb] = gp(X, Z, 0), [, yt] = gp(X, Z, 10.5);
        const w = Math.max(1, .3 * S.foc / Z);
        const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, '#a89c8e'); g.addColorStop(.45, '#6e655c'); g.addColorStop(1, '#3a3634');
        ctx.fillStyle = g; ctx.fillRect(x - w / 2, yt, w, yb - yt);
        const [, ya] = gp(X, Z, 9.6), aw = 1.6 * S.foc / Z;
        ctx.fillStyle = '#4a4440'; ctx.fillRect(x - aw / 2, ya, aw, Math.max(1, .14 * S.foc / Z));
        ctx.fillStyle = '#eceae2'; for (const k of [-.42, 0, .42]) { const ix = x + k * aw, iw = Math.max(1, .1 * S.foc / Z); ctx.fillRect(ix - iw / 2, ya - iw * 1.6, iw, iw * 1.6); }
        if (i === 2) { const [, yt2] = gp(X, Z, 7.6); const tw = .6 * S.foc / Z; ctx.fillStyle = '#8a9496'; ctx.fillRect(x + w / 2, yt2, tw, tw * 1.3); ctx.fillStyle = '#5b6466'; ctx.fillRect(x + w / 2 + tw * .75, yt2, tw * .25, tw * 1.3); }
      }
    };
    S.strokeScale = o.strokeScale ?? 1;
    return S;
  }
  // 电线：三根，带下垂
  function wires(ctx, S, color = 'rgba(38,38,46,.88)') {
    ctx.strokeStyle = color; ctx.lineCap = 'round';
    for (const k of [-.42, 0, .42]) {
      for (let i = 0; i < S.poles.length - 1; i++) {
        const [X0, Z0] = S.poles[i], [X1, Z1] = S.poles[i + 1];
        ctx.lineWidth = Math.max(.6, 1.5 * 9 / Z0);
        ctx.beginPath();
        for (let t = 0; t <= 24; t++) {
          const u = t / 24, X = X0 + (X1 - X0) * u + k * 1.6, Z = Z0 + (Z1 - Z0) * u, Y = 9.75 - 1.1 * 4 * u * (1 - u);
          const p = PAINT.ground(S, X, Z, Y); t ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
        }
        ctx.stroke();
      }
    }
  }
  G.SCENE = { cover, wires, poles: (ctx, S) => S.drawPoles(ctx) };
})(window);
