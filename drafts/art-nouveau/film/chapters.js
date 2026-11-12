// 每一章自己的东西。back(ctx, f) 画在主线下面，front(ctx, f) 画在主线上面（都在世界坐标里）。
const CH = (() => {
  const { MASTER, M } = WORLD;
  const E = ENG, S = SCENES, P = S.PAL;
  const D2R = Math.PI / 180;
  const T = (s, d = 0) => E.tpass(s) + d;          // 主线经过 s 的时刻
  const FONT = { serif: '"NotoSerif"', corm: '"Corm"', cinzel: '"Cinzel"' };

  // ── A · 标题 ──
  function titleBack(ctx, f) {
    const cx = -2500, cy = -1300;
    ctx.save();
    { const g = E.spring((f + 60) / 40); ctx.beginPath(); ctx.arc(cx, cy + 40, 300 * g, 0, 7); ctx.fillStyle = 'rgba(231,211,166,.55)'; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy + 40, 236 * g, 0, 7); ctx.strokeStyle = E.rgba(P.GOLD, .5); ctx.lineWidth = 2; ctx.stroke();
      for (let i = 0; i < 56; i++) { const a = i / 56 * Math.PI * 2 - Math.PI / 2, p = E.spring((f + 30 - i * .5) / 16, .5, 10); if (p <= 0) continue;
        ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 340, cy + 40 + Math.sin(a) * 340, (i % 2 ? 8 : 5) * p, 0, 7); ctx.fillStyle = i % 2 ? P.GOLD : P.PLUM; ctx.fill(); ctx.strokeStyle = P.INK; ctx.lineWidth = 1.6; ctx.stroke(); } }
    for (let i = 0; i < 36; i++) {          // 拱里的放射金线：跟着主线一根根亮
      const a = Math.PI + i / 35 * Math.PI, p = E.smr(T(M.A0 + 2389 * i / 35), T(M.A0 + 2389 * i / 35) + 20, f);
      if (p <= 0) continue;
      ctx.strokeStyle = E.rgba(P.GOLD, .35 * p); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 120, cy + 140 + Math.sin(a) * 120); ctx.lineTo(cx + Math.cos(a) * (120 + 260 * p), cy + 140 + Math.sin(a) * (120 + 260 * p)); ctx.stroke();
    }
    ctx.restore();
  }
  function titleFront(ctx, f) {
    const cx = -2500;
    E.riseText(ctx, 'ART NOUVEAU', cx, -1440, f, -40, { font: `700 50px ${FONT.cinzel}`, size: 50, align: 'center', color: P.PLUM, kind: 'none' });
    E.riseText(ctx, '新艺术', cx, -1268, f, -40, { font: `900 150px ${FONT.serif}`, size: 150, align: 'center', color: P.INK, kind: 'none' });
    E.riseText(ctx, '运动', cx, -1100, f, -40, { font: `900 150px ${FONT.serif}`, size: 150, align: 'center', color: P.INK, kind: 'none' });
    E.riseText(ctx, '1890 — 1910', cx, -1010, f, -40, { font: `600 54px ${FONT.corm}`, size: 54, align: 'center', color: P.INK, kind: 'none' });
  }

  // ── B · 曲率梳：沿线每隔一段竖一根金线，长度 = 那里的曲率。越往梢头越长 ──
  const COMB = [];
  for (let s = M.B0 + 40; s < M.Bloop - 300; s += 26) {
    const a = PATH.at(MASTER, s - 8), b = PATH.at(MASTER, s + 8), q = PATH.at(MASTER, s);
    const k = (b.th - a.th) / 16;
    COMB.push({ q, k, t: T(s + 60) });
  }
  function comb(ctx, f) {
    const fade = 1 - E.smr(330, 400, f);
    if (fade <= 0) return;
    const tips = [];
    ctx.save(); ctx.lineWidth = 2.2;
    for (const c of COMB) {
      const p = E.easeOut((f - c.t) / 14); if (p <= 0) { tips.push(null); continue; }
      const len = Math.min(300, Math.abs(c.k) * 52000) * p, sg = -Math.sign(c.k) || 1;
      const nx = -Math.sin(c.q.th) * sg, ny = Math.cos(c.q.th) * sg, x0 = c.q.x + nx * 18, y0 = c.q.y + ny * 18;
      ctx.strokeStyle = E.rgba(P.GOLD, .9 * fade); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + nx * len, y0 + ny * len); ctx.stroke();
      tips.push([x0 + nx * len, y0 + ny * len]);
    }
    ctx.strokeStyle = E.rgba(P.PLUM, .8 * fade); ctx.lineWidth = 3; ctx.beginPath();
    let on = false; for (const t of tips) { if (!t) { on = false; continue; } on ? ctx.lineTo(t[0], t[1]) : ctx.moveTo(t[0], t[1]); on = true; } ctx.stroke();
    ctx.restore();
  }

  // ── C · 穆夏的光环 ──
  const HX = 2350, HY = -1150, HR = 560;
  const tC0 = T(M.C0);
  const angT = a => T(M.C0 + HR * a);                     // 主线绕到角度 a（从左边起顺时针）的时刻
  function haloBack(ctx, f) {
    const g = E.spring((f - tC0 - 6) / 40, .7, 8); if (g <= 0) return;
    ctx.save();
    ctx.beginPath(); ctx.arc(HX, HY, (HR - 30) * g, 0, 7); ctx.fillStyle = '#E7D3A6'; ctx.fill();
    for (const [r, c, dl] of [[HR - 90, '#DDC28C', 10], [HR - 190, '#E9D8AE', 18], [HR - 290, '#DDC28C', 26]]) {
      const gg = E.spring((f - tC0 - dl) / 40, .7, 8); if (gg <= 0) continue;
      ctx.beginPath(); ctx.arc(HX, HY, r * gg, 0, 7); ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = E.rgba(P.INK, .35); ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.strokeStyle = E.rgba(P.GOLD, .5); ctx.lineWidth = 2;
    for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, p = E.smr(tC0 + 20 + i * .9, tC0 + 44 + i * .9, f); if (p <= 0) continue;
      ctx.beginPath(); ctx.moveTo(HX + Math.cos(a) * 70, HY + Math.sin(a) * 70); ctx.lineTo(HX + Math.cos(a) * (70 + (HR - 110) * p), HY + Math.sin(a) * (70 + (HR - 110) * p)); ctx.stroke(); }
    // 马赛克小圆点：主线绕到哪，哪里就“啵”地冒出来；没绕到的那 90° 接着按顺序冒
    for (let i = 0; i < 84; i++) {
      const a = Math.PI + i / 84 * Math.PI * 2, t = i < 63 ? angT(i / 84 * Math.PI * 2) + 4 : angT(1.5 * Math.PI) + 4 + (i - 63) * 1.6;
      const p = E.spring((f - t) / 18, .5, 10); if (p <= 0) continue;
      const r = (i % 2 ? 11 : 7) * p;
      ctx.beginPath(); ctx.arc(HX + Math.cos(a) * (HR + 44), HY + Math.sin(a) * (HR + 44), r, 0, 7); ctx.fillStyle = i % 2 ? P.GOLD : P.PLUM; ctx.fill(); ctx.strokeStyle = P.INK; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.restore();
  }
  // 花冠：中心一朵大花；从花心甩出九根“卷发”，风一吹一起飘
  const HAIR = [];
  for (let i = 0; i < 9; i++) {
    const a = 100 + i * 17, sg = i % 2 ? 1 : -1;
    HAIR.push({ base: [HX + Math.cos(a * D2R) * 60, HY + Math.sin(a * D2R) * 60], at: TL.bloom + 10 + i * 3, ang: a, L: 520 + (i % 3) * 120, a: -.4, b: 22 + (i % 3) * 4, p: 5, sign: sg, w0: 11, w1: 1.6, dur: 50, color: i % 3 === 1 ? P.TEAL : P.OLIVE, sway: .9, sf: .45, ph: i * .55 });
  }
  for (const h of HAIR) { h.t0 = h.at; S.BR.push(h); }
  function haloFront(ctx, f) { if (f > TL.bloom - 5) S.bigFlower(ctx, HX, HY, f, TL.bloom, 220); }

  // ── D · 吉马德的地铁口 ──
  function metroBack(ctx, f) {
    const g = E.smr(T(M.D0), T(M.D0) + 40, f); if (g <= 0) return;
    ctx.save(); ctx.globalAlpha = g;
    const rg = ctx.createLinearGradient(1700, 0, 3700, 0); rg.addColorStop(0, 'rgba(140,132,120,0)'); rg.addColorStop(.2, 'rgba(140,132,120,1)'); rg.addColorStop(.8, 'rgba(140,132,120,1)'); rg.addColorStop(1, 'rgba(140,132,120,0)');
    ctx.fillStyle = rg; ctx.fillRect(1700, 1650, 2000, 14);                                // 街面
    ctx.restore();
  }
  function lampGlow(ctx, x, y, f, k) {
    let on = E.spring((f - TL.lamps - k * 6) / 30, .55, 8);
    const r = 70 + 220 * Math.max(0, on); on *= .35 + .65 * E.NIGHT;
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, E.rgba('#FFD88A', .85 * Math.max(0, on))); gr.addColorStop(1, E.rgba('#FFB347', 0));
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  }
  function metroFront(ctx, f) {
    // 两盏灯：灯杆梢头的琥珀色玻璃花苞
    for (const [B, k] of [[S.lampL, 0], [S.lampR, 1]]) {
      const r = E.branchPts(B, f); if (!r || r.g < .85) continue;
      const q = r.pts[r.pts.length - 1], g = E.spring((r.g - .85) / .15 * .6 + (f - B.t0 - B.dur) / 30);
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.th - Math.PI / 2);
      ctx.beginPath(); ctx.ellipse(0, 30 * g, 34 * g, 52 * g, 0, 0, 7);
      const on = E.clamp(E.spring((f - TL.lamps - k * 6) / 30, .55, 8));
      ctx.fillStyle = E.mixc('#B5652B', '#FFD27A', on); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = P.INK; ctx.stroke();
      ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; lampGlow(ctx, q.x + Math.cos(q.th) * 30, q.y + Math.sin(q.th) * 30, f, k); ctx.restore();
    }
    // 牌子：从拱顶垂下来，弹一下
    const t = T(M.Dtop) + 6, g = E.spring((f - t) / 30, .45, 9); if (g <= 0) return;
    ctx.save(); ctx.translate(2600, 820);
    ctx.rotate(.06 * Math.sin((f - t) / 9) * Math.exp(-(f - t) / 40));
    const y0 = 70 * g - 70;
    ctx.strokeStyle = P.INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-140, -40); ctx.lineTo(-140, y0 + 60); ctx.moveTo(140, -40); ctx.lineTo(140, y0 + 60); ctx.stroke();
    ctx.globalAlpha = E.clamp(g * 2);
    ctx.beginPath(); ctx.roundRect(-190, y0 + 56, 380, 84, 40); ctx.fillStyle = '#E9D79C'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = P.GUIMARD; ctx.stroke();
    ctx.font = `700 38px ${FONT.cinzel}`; ctx.textAlign = 'center'; ctx.fillStyle = P.GUIMARD; ctx.fillText('Métropolitain', 0, y0 + 112);
    ctx.restore();
  }

  // ── E · 蒂芙尼台灯 ──
  const LX = 0, LY = 1300, LR = 420;
  const CELLS = (() => {
    const rnd = E.rng(5), rows = [0, 92, 168, 236, 298, 360, 420], cnt = [3, 6, 8, 11, 13, 15];
    // 每一行的边界是一条微微起伏的弧（像手工切的），每一格的左右边界随机偏一点
    const rb = (k, a) => k === 0 ? 0 : k === rows.length - 1 ? rows[k] : rows[k] + 9 * Math.sin(a * (5 + k) + k * 1.7) + 5 * Math.sin(a * 13 + k);
    const fam = [['#1F2A5C', '#2B2F6E', '#30245E'], ['#3B3F8C', '#4B3B8A', '#2F4C8C'], ['#6A58B0', '#7A62BC', '#5E6CB8', '#8A6AC0'], ['#9C84D4', '#B49AE0', '#7F8CD0', '#C4A8E4'], ['#5E8A4E', '#7FA35E', '#9A7FCC', '#6E9455'], ['#3F6A3E', '#557E46', '#C98A3A', '#4C7444']];
    const out = []; let order = 0;
    for (let k = 0; k < cnt.length; k++) {
      const n = cnt[k], cuts = [0];
      for (let j = 1; j < n; j++) cuts.push((j + (rnd() - .5) * .5) / n);
      cuts.push(1);
      for (let j = 0; j < n; j++) {
        const a0 = Math.PI + cuts[j] * Math.PI, a1 = Math.PI + cuts[j + 1] * Math.PI, pts = [];
        for (let t = 0; t <= 6; t++) { const a = a0 + (a1 - a0) * t / 6; pts.push([LX + Math.cos(a) * rb(k + 1, a), LY + Math.sin(a) * rb(k + 1, a)]); }
        for (let t = 6; t >= 0; t--) { const a = a0 + (a1 - a0) * t / 6; pts.push([LX + Math.cos(a) * rb(k, a), LY + Math.sin(a) * rb(k, a)]); }
        const F = fam[k], c = F[Math.floor(rnd() * F.length)], am = (a0 + a1) / 2, rm = (rows[k] + rows[k + 1]) / 2;
        out.push({ pts, c, order: order++, k, cx: LX + Math.cos(am) * rm, cy: LY + Math.sin(am) * rm, rr: (rows[k + 1] - rows[k]) * .9 + 20, mot: rnd() });
      }
    }
    return out;
  })();
  function lampBack(ctx, f) {
    const g = E.smr(T(M.E0), T(M.E0) + 40, f); if (g <= 0) return;
    const on = E.clamp(E.spring((f - TL.light) / 34, .6, 7));
    ctx.save();
    ctx.globalAlpha = g;                                                                          // 桌面：两头淡出去
    const tg = ctx.createLinearGradient(-1300, 0, 1300, 0); tg.addColorStop(0, 'rgba(74,56,38,0)'); tg.addColorStop(.25, 'rgba(74,56,38,1)'); tg.addColorStop(.75, 'rgba(74,56,38,1)'); tg.addColorStop(1, 'rgba(74,56,38,0)');
    ctx.fillStyle = tg; ctx.fillRect(-1300, 1960, 2600, 14);
    if (on > 0) {                                                                                 // 灯下的一圈光
      const gr = ctx.createRadialGradient(0, 1966, 10, 0, 1966, 900); gr.addColorStop(0, E.rgba('#FFC870', .5 * on * (.3 + .7 * E.NIGHT))); gr.addColorStop(1, E.rgba('#FFC870', 0));
      ctx.save(); ctx.scale(1, .2); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 1966 / .2, 900, 0, 7); ctx.fill(); ctx.restore();
      ctx.globalCompositeOperation = 'lighter';
      const g2 = ctx.createRadialGradient(LX, LY - 120, 40, LX, LY - 120, 1100); g2.addColorStop(0, E.rgba('#FFB860', .45 * on)); g2.addColorStop(1, E.rgba('#FF9A40', 0));
      ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(LX, LY - 120, 1100, 0, 7); ctx.fill();
    }
    ctx.restore();
    // 底座
    const b = E.spring((f - T(M.Ebase) + 10) / 30); if (b > 0) {
      ctx.save(); ctx.translate(0, 1960); ctx.scale(b, b);
      ctx.beginPath(); ctx.moveTo(-190, 0); ctx.bezierCurveTo(-170, -70, -60, -80, -40, -150); ctx.lineTo(40, -150); ctx.bezierCurveTo(60, -80, 170, -70, 190, 0); ctx.closePath();
      ctx.fillStyle = '#5A3E1E'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = P.INK; ctx.stroke(); ctx.restore();
    }
  }
  function lampFront(ctx, f) {
    const t0 = TL.glass, on = E.clamp(E.spring((f - TL.light) / 34, .6, 7));
    if (f < t0 - 2) return;
    ctx.save();
    ctx.lineJoin = 'round';
    for (const c of CELLS) {
      const p = E.spring((f - t0 - c.order * .55) / 14, .55, 9); if (p <= 0) continue;
      ctx.beginPath(); c.pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
      const col = E.mixc(E.mixc(c.c, '#140F18', .45), E.mixc(c.c, '#FFF1C8', .08), on);
      ctx.globalAlpha = E.clamp(p);
      const base = E.mixc('#FFE9B8', col, E.clamp(p * 1.2)), g = ctx.createRadialGradient(c.cx - 10, c.cy - 14, 2, c.cx, c.cy, c.rr);
      g.addColorStop(0, E.mixc(base, '#FFF4D8', .18 + .25 * on * c.mot)); g.addColorStop(1, E.mixc(base, '#0A0610', .25 - .1 * on)); ctx.fillStyle = g; ctx.fill();
    }
    ctx.globalAlpha = E.smr(t0, t0 + 20, f);
    ctx.strokeStyle = '#1E150C'; ctx.lineWidth = 6;
    for (const c of CELLS) { ctx.beginPath(); c.pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.stroke(); }
    ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(LX, LY, LR + 4, Math.PI, 2 * Math.PI); ctx.stroke();
    ctx.restore();
    if (on > 0) {                                                                                  // 玻璃自己在发光
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const gr = ctx.createRadialGradient(LX, LY - 60, 30, LX, LY - 60, 520); gr.addColorStop(0, E.rgba('#FFDDA0', .2 * on)); gr.addColorStop(1, E.rgba('#FFB060', 0));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(LX, LY, LR + 6, Math.PI, 2 * Math.PI); ctx.fill(); ctx.restore();
    }
  }

  // ── F · 手机：主线描出机身，里面的界面一块块弹出来 ──
  const PX = -2640, PY = 680, PW = 480, PH = 960;
  function phone(ctx, f) {
    const tS = T(M.F1) - 6;
    const sc = E.smr(tS - 10, tS + 16, f); if (sc <= 0) return;
    ctx.save();
    ctx.beginPath(); ctx.roundRect(PX + 14, PY + 14, PW - 28, PH - 28, 56); ctx.fillStyle = E.rgba(P.CREAM, sc); ctx.fill(); ctx.clip();
    const pp = (k, d = 26) => E.spring((f - tS - k) / d, .6, 9);
    const y = (k, dy) => (1 - Math.min(1, pp(k))) * dy;
    ctx.globalAlpha = 1;
    ctx.font = `600 22px ${FONT.corm}`; ctx.fillStyle = P.INK; ctx.fillText('9:41', PX + 52, PY + 62);
    E.riseText(ctx, '早上好', PX + 44, PY + 130, f, tS + 4, { font: `700 24px ${FONT.serif}`, size: 24, color: P.PLUM, kind: 'small' });
    E.riseText(ctx, '我的花园', PX + 44, PY + 190, f, tS + 8, { font: `900 50px ${FONT.serif}`, size: 50, color: P.OLIVE });
    // 进度环：一根藤沿着圆弧长到 72%
    const cx = PX + PW / 2, cy = PY + 380, R = 118, prog = .72 * E.easeOut((f - tS - 14) / 70), progN = .72 * E.easeOut((Math.round(f) - tS - 14) / 70);
    ctx.strokeStyle = '#DCCFAE'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(cx, cy, R, 135 * D2R, 405 * D2R); ctx.stroke();
    if (prog > 0) {
      const n = 120, pts = [];
      for (let i = 0; i <= n; i++) { const a = (135 + 270 * prog * i / n) * D2R; pts.push({ x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R, th: a + Math.PI / 2, s: i, w: 20 - 8 * i / n }); }
      for (const q of pts) q.wd = q.w * (.15 + .85 * E.smr(0, 30, n - q.s));
      S.ribbon(ctx, pts, P.OLIVE, { ol: 2.5 });
      for (let k = 1; k < 8; k++) { const q = pts[Math.floor(k / 8 * n)]; if (!q) continue; const o = E.spring((f - tS - 14 - k / 8 * 50) / 14); S.leaf(ctx, q.x, q.y, q.th + (k % 2 ? -1 : 1) * 1.1, 40 * o, P.SAGE); }
      const q = pts[n]; const gr = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, 26); gr.addColorStop(0, 'rgba(255,231,163,.95)'); gr.addColorStop(1, 'rgba(255,231,163,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(q.x, q.y, 26, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(q.x, q.y, 7, 0, 7); ctx.fillStyle = P.GOLD; ctx.fill();
    }
    ctx.textAlign = 'center'; ctx.fillStyle = P.INK; ctx.font = `700 64px ${FONT.corm}`; ctx.fillText(Math.round(progN * 100) + '%', cx, cy + 14);
    ctx.font = `700 20px ${FONT.serif}`; ctx.fillText('龟背竹在长', cx, cy + 46); ctx.textAlign = 'left';
    // 三张卡：拱顶的小窗
    const cards = [['鸢尾', '两天后浇水', P.ROSE], ['蕨', '今天喷一点水', '#B9C7A0'], ['百合', '开得正好', '#E2C98E']];
    cards.forEach(([t, s2, c], i) => {
      const k = 30 + i * 7, o = pp(k, 24); if (o <= 0) return;
      const yy = PY + 560 + i * 112 + y(k, 60);
      ctx.save(); ctx.globalAlpha = E.clamp(o * 1.5);
      ctx.beginPath(); ctx.roundRect(PX + 34, yy, PW - 68, 96, [44, 44, 16, 16]); ctx.fillStyle = P.PAPER; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = P.INK; ctx.stroke();
      ctx.beginPath(); ctx.roundRect(PX + 50, yy + 12, 56, 72, [28, 28, 6, 6]); ctx.fillStyle = c; ctx.fill(); ctx.stroke();
      S.leaf(ctx, PX + 62, yy + 78, -1.1, 54 * Math.min(1, o), P.SAGE);
      ctx.fillStyle = P.INK; ctx.font = `900 30px ${FONT.serif}`; ctx.fillText(t, PX + 124, yy + 46); ctx.font = `600 20px ${FONT.serif}`; ctx.fillStyle = '#6b5e45'; ctx.fillText(s2, PX + 124, yy + 76);
      ctx.restore();
      if (o > .02) E.cue(Math.round(tS + k), t.length + s2.length, .8, 'small');
    });
    ctx.restore();
  }
  // 设计师能拿走的：三条规则 + 色板
  function rules(ctx, f) {
    const x = -1860, t0 = TL.ui - 24;
    if (f < t0) return;
    const out = 1100;
    const opt = (size, w, c, kind, fam = FONT.serif) => ({ font: `${w} ${size}px ${fam}`, size, color: c, kind, out });
    E.riseText(ctx, '新艺术运动的三条规则', x, 930, f, t0, opt(46, 900, P.INK, 'text'));
    const R = [['①', '没有一根直线', '曲率从根到梢一路变大：κ(s) = a + b·s⁶'], ['②', '根粗梢细，约 10 : 1', '粗细跟着弧长走，梢头收成一个点'], ['③', '一个拐点，一个涡', '先往一边缓弯，再往另一边越卷越紧']];
    R.forEach(([n, a, b], i) => {
      const y = 1030 + i * 128, ti = t0 + 14 + i * 14;
      E.riseText(ctx, n, x, y, f, ti, opt(42, 700, P.GOLD, 'none', FONT.serif));
      E.riseText(ctx, a, x + 58, y, f, ti, opt(40, 900, P.INK, 'text'));
      E.riseText(ctx, b, x + 58, y + 46, f, ti + 6, opt(26, 600, '#5a4f40', 'small'));
    });
    const chips = [['#4E5A34', '橄榄'], ['#7F8F5E', '鼠尾草'], ['#C49A4A', '金'], ['#6B3A4A', '李紫'], ['#D9A39A', '玫瑰'], ['#EFE6CF', '奶油']];
    chips.forEach(([c, nm], i) => {
      const t = t0 + 60 + i * 4, o = E.spring((f - t) / 22, .55, 9) * (1 - E.smr(out, out + 24, f)); if (o <= 0) return;
      const cx = x + 30 + i * 128, cy = 1450;
      ctx.save(); ctx.translate(cx + 50, cy + 50); ctx.scale(o, o);
      ctx.beginPath(); ctx.roundRect(-50, -50, 100, 100, [50, 50, 10, 10]); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = P.INK; ctx.stroke(); ctx.restore();
      ctx.save(); ctx.globalAlpha = E.clamp(o); ctx.fillStyle = P.INK; ctx.textAlign = 'center';
      ctx.font = `700 22px ${FONT.serif}`; ctx.fillText(nm, cx + 50, cy + 134); ctx.font = `600 21px ${FONT.corm}`; ctx.fillText(c, cx + 50, cy + 160); ctx.restore();
      E.cue(Math.round(t), 1, 1, 'small');
    });
  }

  // ── 收束：主线回到标题脚下卷进去；梢头开一朵百合 ──
  function finale(ctx, f) {
    const q = PATH.at(MASTER, M.G2), o = E.spring((f - TL.curl + 4) / 30, .5, 9);
    if (o > 0) S.lily(ctx, q.x, q.y, q.th - 1.2, 110, P.ROSE, o);
  }
  // 给配乐：每个动作的时刻
  const EV = {
    halo: tC0 + 6, bloom: TL.bloom, sign: T(M.Dtop) + 6,
    dots: Array.from({ length: 84 }, (_, i) => i < 63 ? angT(i / 84 * Math.PI * 2) + 4 : angT(1.5 * Math.PI) + 4 + (i - 63) * 1.6),
    cells: CELLS.map(c => TL.glass + c.order * .55),
    cards: [0, 1, 2].map(i => T(M.F1) - 6 + 30 + i * 7),
    chips: [0, 1, 2, 3, 4, 5].map(i => TL.ui - 24 + 60 + i * 4),
  };
  return { EV, titleBack, titleFront, comb, haloBack, haloFront, metroBack, metroFront, lampBack, lampFront, phone, rules, finale, FONT };
})();
