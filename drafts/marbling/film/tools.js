// tools.js — 正在做动作的“工具”（梳子 / 耙 / 针 / 落下的那一滴）和两张纸签，Canvas 2D 画在水面上一层。
// 工具的位置全部从 scene.js 的同一份动作参数里算（齿尖就是公式里的 tip），所以工具和颜料不会对不上。
const LABELS = (() => {
  function paper(ctx, w, h, seed) {
    ctx.fillStyle = '#FBF6EC'; ctx.fillRect(0, 0, w, h);
    const r = rng(seed);
    for (let i = 0; i < 2600; i++) { ctx.fillStyle = `rgba(120,96,60,${0.02 + r() * 0.05})`; ctx.fillRect(r() * w, r() * h, 1 + r() * 9, 1); }
    ctx.strokeStyle = 'rgba(23,20,15,0.85)'; ctx.lineWidth = 4; ctx.strokeRect(22, 22, w - 44, h - 44);
    ctx.lineWidth = 1.5; ctx.strokeRect(34, 34, w - 68, h - 68);
  }
  function seal(ctx, x, y, s) {
    ctx.save(); ctx.fillStyle = '#E2402A'; ctx.fillRect(x, y, s, s);
    ctx.fillStyle = '#FBF6EC'; ctx.font = `700 ${s * 0.4}px SerifSC`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('观', x + s / 2, y + s * 0.29); ctx.fillText('默', x + s / 2, y + s * 0.71); ctx.restore();
  }
  // 第 0 帧贴在水面上的签条：大字「湿拓」
  function front() {
    const w = 1200, h = 608, cv = document.createElement('canvas'); cv.width = w; cv.height = h; const ctx = cv.getContext('2d');
    paper(ctx, w, h, 3);
    ctx.fillStyle = '#17140F'; ctx.textBaseline = 'alphabetic';
    ctx.font = '900 330px SerifSC'; ctx.fillText('湿拓', 78, 400);
    ctx.font = 'italic 92px Instrument'; ctx.fillText('Marbling', 82, 520);
    ctx.font = '500 30px GeistMono'; ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(23,20,15,0.75)';
    ctx.fillText('颜色不混，只互相推开', w - 82, 512);
    seal(ctx, w - 230, 80, 140);
    return cv;
  }
  // 最后贴在成品上的签条
  function back() {
    const w = 1440, h = 640, cv = document.createElement('canvas'); cv.width = w; cv.height = h; const ctx = cv.getContext('2d');
    paper(ctx, w, h, 5);
    ctx.fillStyle = '#17140F';
    ctx.font = '900 300px SerifSC'; ctx.fillText('湿拓', 86, 360);
    ctx.font = 'italic 120px Instrument'; ctx.fillText('MARBLING', 690, 230);
    ctx.font = '500 34px GeistMono'; ctx.fillStyle = 'rgba(23,20,15,0.8)';
    ctx.fillText('滴 → 耙 → 梳 → 卷', 696, 330);
    ctx.font = '500 27px GeistMono'; ctx.fillText('P′ = C + (P−C)·√(1 + r²/|P−C|²)', 92, 470);
    ctx.fillText('P′ = P + z·u^d·M', 92, 520);
    const P = ['#1F3FD8', '#F0452B', '#F6B81A', '#19B5A5', '#FF7AA8', '#17140F'];
    P.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(700 + i * 62, 470, 48, 48); });
    seal(ctx, w - 240, 420, 150);
    return cv;
  }
  return { front, back };
})();

const TOOLS = (() => {
  const PALH = MARBLE.ORDER.map(k => MARBLE.PAL[k]);
  // 一根齿碰水：一圈亮的弯月面 + 一圈暗
  function meniscus(ctx, x, y, r) {
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = Math.max(1.2, r * 0.35); ctx.beginPath(); ctx.arc(x, y, r * 1.25, 0, 7); ctx.stroke();
    ctx.strokeStyle = 'rgba(23,20,15,0.18)'; ctx.lineWidth = Math.max(1, r * 0.4); ctx.beginPath(); ctx.arc(x, y, r * 2.0, 0, 7); ctx.stroke();
  }
  // 梳子 / 耙：齿尖排成一条线（齿尖 = 公式里的 tip），木头梳背斜在后面，地上有影子
  function comb(ctx, cam, M, N, tip, n0, s, back, pinR, alpha = 1) {
    const z = cam[2], pts = [];
    for (let k = -80; k <= 80; k++) {
      const n = n0 + k * s, x = M[0] * tip + N[0] * n, y = M[1] * tip + N[1] * n;
      const p = toScreen(cam, x, y); if (p[0] < -200 || p[0] > 2120 || p[1] < -200 || p[1] > 1280) continue;
      const q = toScreen(cam, x - M[0] * back, y - M[1] * back); pts.push([p, q]);
    }
    if (pts.length < 2) return;
    ctx.save(); ctx.globalAlpha = alpha;
    const a = pts[0][1], b = pts[pts.length - 1][1], sh = [16 * z, 22 * z];
    const bw = Math.max(14, 44 * z);
    // 梳背的影子
    ctx.strokeStyle = 'rgba(23,20,15,0.28)'; ctx.lineWidth = bw * 1.3; ctx.lineCap = 'round'; ctx.filter = `blur(${Math.max(4, 10 * z)}px)`;
    ctx.beginPath(); ctx.moveTo(a[0] + sh[0], a[1] + sh[1]); ctx.lineTo(b[0] + sh[0], b[1] + sh[1]); ctx.stroke(); ctx.filter = 'none';
    // 齿
    for (const [p, q] of pts) {
      ctx.strokeStyle = 'rgba(23,20,15,0.25)'; ctx.lineWidth = pinR * 1.2; ctx.beginPath(); ctx.moveTo(p[0] + 3, p[1] + 4); ctx.lineTo(q[0] + sh[0] * .6, q[1] + sh[1] * .6); ctx.stroke();
      const g = ctx.createLinearGradient(p[0], p[1], q[0], q[1]); g.addColorStop(0, '#8d8a84'); g.addColorStop(1, '#e8e2d6');
      ctx.strokeStyle = g; ctx.lineWidth = pinR; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
      meniscus(ctx, p[0], p[1], pinR * 0.9);
    }
    // 梳背（胡桃木）
    const nx = -(b[1] - a[1]), ny = b[0] - a[0], nl = Math.hypot(nx, ny), ox = nx / nl * bw * 0.5, oy = ny / nl * bw * 0.5;
    const g = ctx.createLinearGradient(a[0] - ox, a[1] - oy, a[0] + ox, a[1] + oy);
    g.addColorStop(0, '#3b2416'); g.addColorStop(0.35, '#7a4f2e'); g.addColorStop(0.55, '#8e6038'); g.addColorStop(1, '#2e1c11');
    ctx.strokeStyle = g; ctx.lineWidth = bw; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    ctx.restore();
  }
  function needle(ctx, cam, x, y, lift = 0) {
    const p = toScreen(cam, x, y), z = cam[2], L = 120 * Math.min(z, 2), hx = p[0] - L * 0.55, hy = p[1] - L * 0.85 - lift * 40;
    ctx.save();
    ctx.strokeStyle = 'rgba(23,20,15,0.25)'; ctx.lineWidth = 6; ctx.filter = 'blur(4px)'; ctx.beginPath(); ctx.moveTo(p[0] + 4, p[1] + 5); ctx.lineTo(hx + 50, hy + 70); ctx.stroke(); ctx.filter = 'none';
    const g = ctx.createLinearGradient(p[0], p[1], hx, hy); g.addColorStop(0, '#6f6b64'); g.addColorStop(1, '#f2ede2');
    ctx.strokeStyle = g; ctx.lineWidth = 4.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.fillStyle = '#E2402A'; ctx.beginPath(); ctx.arc(hx, hy, 13, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(hx - 4, hy - 4, 4, 0, 7); ctx.fill();
    if (!lift) meniscus(ctx, p[0], p[1], 4);
    ctx.restore();
  }
  // 落下来的那一滴：越近越大，影子从旁边收到落点
  function bead(ctx, cam, d, u) {
    const p = toScreen(cam, d.x, d.y), z = cam[2], r0 = (d.small ? 6 : 13) * Math.min(z, 1.8), k = 1 - u;
    const r = r0 * (1 + 2.2 * k * k), sx = p[0] + 70 * k * z, sy = p[1] + 90 * k * z;
    ctx.save();
    ctx.fillStyle = `rgba(23,20,15,${0.12 + 0.2 * u})`; ctx.filter = `blur(${2 + 8 * k}px)`; ctx.beginPath(); ctx.ellipse(sx, sy, r0 * (1 + k), r0 * (1 + k) * 0.8, 0, 0, 7); ctx.fill(); ctx.filter = 'none';
    const c = PALH[d.col], g = ctx.createRadialGradient(p[0] - r * 0.35, p[1] - r * 0.4, r * 0.1, p[0], p[1], r);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.18, c); g.addColorStop(1, c);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7); ctx.fill();
    ctx.restore();
  }
  // 针沿着四个漩涡中心走过去，每到一处绕一圈
  function needleAt(f) {
    const cc = B.cc, T = TL.curls;
    if (f < T[0] - 30 || f > T[3] + 34) return null;
    let k = 0; while (k < 3 && f >= T[k + 1] - 12) k++;
    const t0 = T[k] - 12, t1 = k < 3 ? T[k + 1] - 12 : T[3] + 30;
    const u = clamp((f - t0) / (t1 - t0));
    const c = cc[k], dir = Math.sign(B.th[k]);
    // 先绕中心转一圈（半径慢慢收），再走到下一个中心
    const ang = dir * u * Math.PI * 2.2, rr = 70 * (1 - u * 0.6);
    let x = c[0] + rr * Math.cos(ang - Math.PI / 2), y = c[1] + rr * Math.sin(ang - Math.PI / 2);
    if (k < 3) { const w = ease.inOut2(clamp((u - 0.55) / 0.45)); x = lerp(x, cc[k + 1][0] + 0, w); y = lerp(y, cc[k + 1][1] - 70, w); }
    if (f < T[0] - 12) { const w = ease.out3(prog(f, T[0] - 30, T[0] - 12)); x = lerp(c[0] - 700, x, w); y = lerp(c[1] - 400, y, w); }
    const lift = k === 3 ? ease.in2(prog(f, T[3] + 16, T[3] + 34)) : 0;
    if (lift > 0) { x += 500 * lift; y -= 300 * lift; }
    return [x, y, lift];
  }
  function draw(cv, f, s) {
    const ctx = cv.getContext('2d'), cam = s.cam;
    ctx.clearRect(0, 0, cv.width, cv.height);
    // 第一把梳子（第 0 帧正拉到画面中间）
    if (f < 80) comb(ctx, cam, [1, 0], [0, 1], TL.combA.x0 + TL.combA.v * f, 0, 26, 64, 3.6 * cam[2]);
    // 耙：三道
    TL.rake.forEach(([a, b], i) => {
      if (f < a - 2 || f > b + 2) return;
      const down = i === 0, tip = B.rakeTip(f, [a, b]);
      const M = down ? [0, 1] : [0, -1], N = down ? [-1, 0] : [1, 0], n0 = [0, 150][i];
      comb(ctx, cam, M, N, tip, n0, 300, 60, 5 * cam[2]);
    });
    if (f >= TL.comb[0] - 2 && f <= TL.comb[1] + 2) comb(ctx, cam, [1, 0], [0, 1], B.combTip(f), 6, 28, 64, 3.6 * cam[2]);
    const nd = needleAt(f); if (nd) needle(ctx, cam, nd[0], nd[1], nd[2]);
    for (const d of B.drops) { const u = (f - (d.f - 10)) / 10; if (u >= 0 && u < 1) bead(ctx, cam, d, u); }
    HUDM.lines(ctx, f, s);
  }
  return { draw, needleAt };
})();
