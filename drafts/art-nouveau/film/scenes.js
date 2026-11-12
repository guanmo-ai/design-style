// 内容：镜头关键帧、枝条、叶子、花，以及每一章自己的东西（光环、地铁口、台灯、手机、片尾）。
const SCENES = (() => {
  const { MASTER, M } = WORLD;
  const E = ENG;
  const INK = '#2E2A1F', CREAM = '#EFE6CF', PAPER = '#F5EEDC', SAGE = '#7F8F5E', OLIVE = '#4E5A34', GOLD = '#C49A4A',
    PLUM = '#6B3A4A', ROSE = '#D9A39A', TEAL = '#4F7A72', GUIMARD = '#2F5D4A', BRONZE = '#6E4E26', AMBER = '#F2A541';
  const PAL = { INK, CREAM, PAPER, SAGE, OLIVE, GOLD, PLUM, ROSE, TEAL, GUIMARD, BRONZE, AMBER };
  const D2R = Math.PI / 180;

  // —— 镜头：[帧, x, y, 缩放] 或 [帧, 'tip', 缩放, 偏移 x, 偏移 y] ——
  const CAM = [
    [0, -2500, -1330, .90], [60, -2470, -1300, .80], [104, 'tip', .72, 120, -260], [168, 'tip', .70, 260, 150],
    [222, -230, -1170, .53], [290, -150, -1150, .53], [324, 1050, -1000, .52], [372, 2330, -1080, .74], [470, 2330, -1030, .72],
    [498, 'tip', .64, 0, 0], [538, 2560, 1180, .80], [606, 2600, 1210, .80],
    [632, 'tip', .62, 0, -120], [684, 20, 1430, .88], [866, 0, 1420, .88], [900, 'tip', .70, 0, 0], [930, -2060, 1160, .92], [1084, -2030, 1160, .92],
    [1126, 'tip', .55, 0, 0], [1210, -180, 90, .262], [1260, -180, 90, .258]];

  // —— 主线的颜色：各章换一种材料（橄榄 → 吉马德的铸铁绿 → 蒂芙尼的青铜 → 墨 → 橄榄），按弧长渐变 ——
  const CSEG = [[0, OLIVE], [M.D0 + 300, OLIVE], [M.D0 + 900, GUIMARD], [M.E0 + 300, GUIMARD], [M.E0 + 900, BRONZE], [M.E1, BRONZE], [M.E1 + 600, INK], [M.F1 + 200, INK], [M.F1 + 900, OLIVE], [1e9, OLIVE]];
  function masterColor(s) { let i = 0; while (CSEG[i + 1][0] < s) i++; const [s0, c0] = CSEG[i], [s1, c1] = CSEG[i + 1]; return E.mixc(c0, c1, E.sm((s - s0) / (s1 - s0))); }

  // —— 枝条 ——
  const BR = [];
  function br(anchor, o) {
    const B = Object.assign({ L: 300, a: .3, b: 22, p: 5, sign: 1, w0: 12, w1: 1.6, dur: 40, delay: 0, color: SAGE, sway: .25, sf: .4, ph: Math.random() * 6 }, o);
    if (typeof anchor === 'number') { B.anchor = anchor; B.t0 = E.tpass(anchor + E.U * .8) + B.delay; if (o.abs !== undefined) B.ang = o.abs - PATH.at(MASTER, anchor).th / D2R; }
    else { B.base = anchor; B.t0 = B.at; }
    BR.push(B); return B;
  }
  Math.random = E.rng(11);
  // A · 标题拱
  br(M.A0 + 2, { abs: 80, L: 380, a: .2, b: 26, p: 5, sign: -1, w0: 20, w1: 2, color: OLIVE, leaves: [.25, .45] });
  br(M.Afoot - 2, { abs: 100, L: 380, a: .2, b: 26, p: 5, sign: 1, w0: 20, w1: 2, color: OLIVE, leaves: [.25, .45] });
  br(M.Atop - 40, { abs: -150, L: 230, a: .1, b: 24, p: 4, sign: 1, w0: 10, w1: 1.5, color: OLIVE });
  br(M.Atop + 40, { abs: -30, L: 230, a: .1, b: 24, p: 4, sign: -1, w0: 10, w1: 1.5, color: OLIVE });
  br(M.A0 + 380, { ang: -70, L: 360, a: -.3, b: 18, p: 4, sign: -1, w0: 9, color: SAGE, flower: { size: 60, color: CREAM } });
  br(M.Afoot - 380, { ang: 70, L: 360, a: -.3, b: 18, p: 4, sign: 1, w0: 9, color: SAGE, flower: { size: 60, color: ROSE } });
  br(M.A0 + 900, { ang: -80, L: 300, a: .2, b: 24, p: 5, sign: 1, w0: 8, color: TEAL });
  br(M.Afoot - 900, { ang: 80, L: 300, a: .2, b: 24, p: 5, sign: -1, w0: 8, color: TEAL });
  br(M.Afoot - 620, { ang: -75, L: 260, a: -.3, b: 18, p: 4, sign: -1, w0: 8, color: SAGE, flower: { size: 52, color: CREAM } });
  // B · 鞭线：顶上两根卷须，圈旁一朵百合
  br(M.B0 + 600, { ang: -60, L: 300, a: -.3, b: 22, p: 5, sign: -1, w0: 9, color: SAGE, leaves: [.3] });
  br(M.Bpeak - 300, { ang: -75, L: 380, a: .2, b: 26, p: 5, sign: 1, w0: 10, color: SAGE });
  br(M.Bpeak + 200, { ang: -80, L: 330, a: -.4, b: 22, p: 5, sign: -1, w0: 9, color: TEAL, flower: { size: 64, color: ROSE } });
  br(M.Bloop0 + 120, { ang: 80, L: 380, a: -.5, b: 20, p: 4, sign: -1, w0: 10, color: SAGE, flower: { size: 70, color: CREAM }, leaves: [.35] });
  br(M.Bloop + 400, { ang: 70, L: 300, a: .2, b: 22, p: 5, sign: 1, w0: 8, color: TEAL });
  // C · 光环：离开光环时甩出两根
  br(M.C1 + 300, { ang: 70, L: 360, a: -.3, b: 24, p: 5, sign: 1, w0: 10, color: SAGE, leaves: [.3] });
  // D · 地铁口：两根灯杆从柱顶往外弯、垂下来，梢头是一盏琥珀色的灯
  const lampL = br(M.Dl + 470, { abs: -112, L: 440, a: .9, b: 10, p: 2, sign: -1, w0: 14, w1: 6, color: GUIMARD, lamp: 1, dur: 46, sway: .08 });
  const lampR = br(M.Dr - 470, { abs: -68, L: 440, a: .9, b: 10, p: 2, sign: 1, w0: 14, w1: 6, color: GUIMARD, lamp: 1, dur: 46, sway: .08 });
  // E · 台灯：底座的根，灯罩左半边
  for (const [ang, sg, L] of [[160, 1, 300], [20, -1, 300], [130, 1, 200], [50, -1, 200]]) br(M.Ebase - 40, { abs: ang, L, a: -.3, b: 22, p: 4, sign: sg, w0: 12, w1: 2, color: BRONZE, dur: 30, sway: 0 });
  // F · 手机里：分隔线两头的涡卷
  // G · 回家：沿途几片叶子和一朵百合
  br(M.G0 + 300, { ang: -70, L: 340, a: -.3, b: 22, p: 5, sign: -1, w0: 10, color: SAGE, leaves: [.3], flower: { size: 66, color: ROSE } });
  br(M.G1 - 500, { ang: 70, L: 300, a: -.3, b: 22, p: 5, sign: 1, w0: 9, color: SAGE, leaves: [.35] });

  // —— 主线上的叶子 ——
  const LEAVES = [];
  const leafOn = (s, side, size, color) => LEAVES.push({ s, side, size, color: color || SAGE, t0: E.tpass(s + 120) });
  for (const [a, b, every] of [[M.A0 + 120, M.Atop - 200, 260], [M.Atop + 200, M.Afoot - 120, 260], [M.B0, M.Bpeak, 300], [M.Bpeak + 300, M.Bloop0, 300],
    [M.C1 + 100, M.D0, 260], [M.Afoot + 160, M.B0, 200], [M.Bloop + 200, M.C0 - 100, 260], [M.E1 + 200, M.F0 - 100, 300], [M.E0 + 200, M.Ebase - 300, 230], [M.D0 + 300, M.Dl - 200, 340], [M.F1 + 400, M.G1, 380]]) {
    let k = 0; for (let s = a; s < b; s += every, k++) leafOn(s, k % 2 ? 1 : -1, 92 - (k % 3) * 12, k % 3 === 1 ? OLIVE : SAGE);
  }

  // —— 画：带子、叶子、花 ——
  const LIGHT = [-.6, -.8];
  function polygon(ctx, pts, wmul, off) {
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) { const q = pts[i], nx = -Math.sin(q.th), ny = Math.cos(q.th), o = off ? (nx * LIGHT[0] + ny * LIGHT[1]) * off * q.wd : 0, w = q.wd * wmul / 2 + (wmul > 1 ? 1.5 : 0);
      i ? ctx.lineTo(q.x + nx * (w + o), q.y + ny * (w + o)) : ctx.moveTo(q.x + nx * (w + o), q.y + ny * (w + o)); }
    for (let i = pts.length - 1; i >= 0; i--) { const q = pts[i], nx = -Math.sin(q.th), ny = Math.cos(q.th), o = off ? (nx * LIGHT[0] + ny * LIGHT[1]) * off * q.wd : 0, w = q.wd * wmul / 2 + (wmul > 1 ? 1.5 : 0);
      ctx.lineTo(q.x - nx * (w - o), q.y - ny * (w - o)); }
    ctx.closePath();
  }
  // 一条带子：先画一圈墨色的边（加粗的同形），再填色，再沿着受光的一侧压一道高光
  function ribbon(ctx, pts, color, opt = {}) {
    if (pts.length < 2) return;
    const ol = opt.ol ?? 3.2;
    for (const q of pts) q.wd = q.wd ?? q.w;
    ctx.fillStyle = opt.ink || INK;
    polygon(ctx, pts.map(q => Object.assign({}, q, { wd: q.wd + ol * 2 })), 1, 0); ctx.fill();
    if (typeof color === 'function') {
      for (let i = 0; i < pts.length - 1; i += 40) { const seg = pts.slice(i, i + 42); ctx.fillStyle = color(seg[Math.floor(seg.length / 2)].s); polygon(ctx, seg, 1, 0); ctx.fill(); }
    } else { ctx.fillStyle = color; polygon(ctx, pts, 1, 0); ctx.fill(); }
    ctx.fillStyle = opt.hi || 'rgba(255,240,200,.28)'; polygon(ctx, pts, .34, .7); ctx.fill();
    if (opt.gold) { ctx.strokeStyle = E.rgba(GOLD, opt.gold); ctx.lineWidth = 1.6; ctx.beginPath(); pts.forEach((q, i) => q.wd > 8 && (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.stroke(); }
  }
  function leaf(ctx, x, y, ang, s, fill, open = 1) {
    if (s <= 1) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s / 100, s / 100);
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(30, -34 * open, 72, -26 * open, 100, 0);
    ctx.bezierCurveTo(70, 14 * open, 34, 18 * open, 0, 0); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 3.4; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, 0); ctx.quadraticCurveTo(50, -10 * open, 96, 0); ctx.lineWidth = 2; ctx.strokeStyle = E.rgba(INK, .55); ctx.stroke();
    ctx.restore();
  }
  // 百合：五片尖瓣从一点张开（open 0 → 1 是花苞到盛开）
  function lily(ctx, x, y, ang, s, fill, open) {
    if (open <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    const sp = .25 + .75 * open, ln = .55 + .45 * Math.min(1, open);
    for (const [da, ls] of [[-62, .8], [62, .8], [-30, 1], [30, 1], [0, 1.1]]) {
      const a = da * sp * D2R, L = s * ls * ln, ex = Math.cos(a) * L, ey = Math.sin(a) * L, nx = -Math.sin(a) * s * .26, ny = Math.cos(a) * s * .26;
      const mx = ex * .5, my = ey * .5;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(mx + nx, my + ny, ex + Math.cos(a + da * D2R * .4) * s * .08 * open, ey + Math.sin(a + da * D2R * .4) * s * .08 * open);
      ctx.quadraticCurveTo(mx - nx, my - ny, 0, 0); ctx.closePath();
      ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(ex * .66, ey * .66); ctx.strokeStyle = GOLD; ctx.lineWidth = 2.6; ctx.stroke();
    }
    for (const da of [-10, 12]) { const a = da * sp * D2R, L = s * .78 * ln; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * L, Math.sin(a) * L); ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.stroke();
      ctx.beginPath(); ctx.arc(Math.cos(a) * L, Math.sin(a) * L, 6, 0, 7); ctx.fillStyle = PLUM; ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }
  // 正面的大花：几圈尖瓣，从里往外一圈圈打开
  function bigFlower(ctx, x, y, f, f0, R = 200) {
    const rings = [[16, 1, ROSE, 0], [16, .76, PLUM, 6], [10, .5, ROSE, 12], [8, .3, '#E7B98A', 18]];
    for (const [nP, rr, col, dl] of rings) {
      const o = E.spring((f - f0 - dl) / 34, .5, 9); if (o <= 0) continue;
      const Rr = R * rr * o, rot = (1 - Math.min(1, o)) * .6 + dl * .02;
      for (let i = 0; i < nP; i++) {
        const a = (i + (dl % 12 ? .5 : 0)) / nP * Math.PI * 2 + rot, ex = x + Math.cos(a) * Rr, ey = y + Math.sin(a) * Rr, nx = -Math.sin(a) * Rr * .3, ny = Math.cos(a) * Rr * .3, mx = x + Math.cos(a) * Rr * .55, my = y + Math.sin(a) * Rr * .55;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(mx + nx, my + ny, ex, ey); ctx.quadraticCurveTo(mx - nx, my - ny, x, y);
        ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
      }
    }
    const c = E.spring((f - f0 - 22) / 26); if (c > 0) {
      ctx.beginPath(); ctx.arc(x, y, 44 * c, 0, 7); ctx.fillStyle = GOLD; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = INK; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 30 * c, y + Math.sin(a) * 30 * c, 4.5 * c, 0, 7); ctx.fill(); }
    }
  }

  return { CAM, BR, LEAVES, PAL, masterColor, ribbon, leaf, lily, bigFlower, polygon, lampL, lampR };
})();
