// 赛璐璐 · 开场 8 秒（Canvas 2D）
// 00 一张画 = 5 张赛璐璐片（反相冲击帧 → 拆层 → 砸回 → 一拍二眨眼）→ 钻进高光
// 01 白雪公主 1937 · 多层摄影台（近快远慢）→ 太阳变红冲向镜头
// 02 AKIRA 1988 · 尾灯光轨（圆形开孔转场 → 侧滑）→ 03 冲击帧 · 标题
(function () {
  const TL = window.TL, W0 = 1920, H0 = 1080;
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const eio = x => { x = cl(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const eo3 = x => 1 - Math.pow(1 - cl(x), 3);
  const ei3 = x => Math.pow(cl(x), 3);
  const lerp = (a, b, u) => a + (b - a) * u;
  const mix = (c1, c2, u) => c1.map((v, i) => Math.round(lerp(v, c2[i], u)));
  const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const on2 = t => Math.floor(t * 12) / 12;   // 一拍二：作画 12 张 / 秒
  function rng(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

  // ═══════════ 眼睛（眼睛本地坐标，宽约 910）═══════════
  const X0 = -430, X1 = 480;
  const uOf = x => (x - X0) / (X1 - X0);
  const Up = x => { const u = uOf(x); return 40 - 235 * Math.pow(Math.sin(Math.PI * u), .85) + 30 * u; };
  const Lo = x => { const u = uOf(x); return 40 + 115 * Math.pow(Math.sin(Math.PI * u), 1.3) - 25 * u; };
  const Uo = (x, o) => Lo(x) + (Up(x) - Lo(x)) * o;
  const XS = []; for (let i = 0; i <= 90; i++) XS.push(lerp(X0, X1, i / 90));
  const IR = [30, -15], IRR = 185;
  function eyePath(ctx, o) {
    ctx.beginPath();
    XS.forEach((x, i) => i ? ctx.lineTo(x, Uo(x, o)) : ctx.moveTo(x, Uo(x, o)));
    for (let i = XS.length - 1; i >= 0; i--) ctx.lineTo(XS[i], Lo(XS[i]));
    ctx.closePath();
  }
  const L_BG = ctx => {
    ctx.fillStyle = '#FFE3CF'; ctx.fillRect(-700, -540, 1400, 1000);
    const g = ctx.createRadialGradient(150, 300, 20, 150, 300, 420);
    g.addColorStop(0, 'rgba(255,160,140,.40)'); g.addColorStop(1, 'rgba(255,160,140,0)');
    ctx.fillStyle = g; ctx.fillRect(-700, -540, 1400, 1000);
    ctx.strokeStyle = 'rgba(232,96,96,.6)'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(60 + k * 46, 330); ctx.lineTo(30 + k * 46, 392); ctx.stroke(); }
  };
  const L_COLOR = (ctx, o) => {
    ctx.save(); eyePath(ctx, o); ctx.clip();
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-700, -540, 1400, 1000);
    ctx.beginPath(); ctx.arc(IR[0], IR[1], IRR, 0, 6.283); ctx.fillStyle = '#3F6BFF'; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(IR[0], IR[1], IRR, 0, 6.283); ctx.clip();
    ctx.beginPath(); ctx.ellipse(IR[0], IR[1] + 120, 175, 110, 0, 0, 6.283); ctx.fillStyle = '#86ACFF'; ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(IR[0], IR[1] + 15, 72, 92, 0, 0, 6.283); ctx.fillStyle = '#121A4E'; ctx.fill();
    ctx.restore();
  };
  const L_SHADOW = (ctx, o) => {
    ctx.save(); eyePath(ctx, o); ctx.clip();
    ctx.beginPath();
    XS.forEach((x, i) => i ? ctx.lineTo(x, Uo(x, o) - 4) : ctx.moveTo(x, Uo(x, o) - 4));
    for (let i = XS.length - 1; i >= 0; i--) ctx.lineTo(XS[i], Uo(XS[i], o) + 74);
    ctx.closePath(); ctx.fillStyle = 'rgba(46,30,120,.34)'; ctx.fill();
    ctx.beginPath(); ctx.arc(IR[0], IR[1], IRR, 0, 6.283); ctx.clip();
    ctx.beginPath();
    XS.forEach((x, i) => i ? ctx.lineTo(x, Uo(x, o) - 4) : ctx.moveTo(x, Uo(x, o) - 4));
    for (let i = XS.length - 1; i >= 0; i--) ctx.lineTo(XS[i], Uo(XS[i], o) + 130);
    ctx.closePath(); ctx.fillStyle = 'rgba(10,10,70,.42)'; ctx.fill();
    ctx.restore();
  };
  const L_LINE = (ctx, o) => {
    ctx.fillStyle = '#1A1426';
    const w = u => 6 + 30 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.05)), .6) + 14 * Math.max(0, u - .7) / .3;
    ctx.beginPath();
    XS.forEach((x, i) => { const y = Uo(x, o) - w(uOf(x)); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    for (let i = XS.length - 1; i >= 0; i--) ctx.lineTo(XS[i], Uo(XS[i], o) + 4);
    ctx.closePath(); ctx.fill();
    // 睫毛：外眼角三簇
    [[.80, -60, -70], [.88, -20, -78], [.96, 30, -60]].forEach(([u, dx, dy]) => {
      const x = lerp(X0, X1, u), y = Uo(x, o) - w(u) + 4;
      ctx.beginPath(); ctx.moveTo(x - 26, y + 8); ctx.quadraticCurveTo(x + dx * .4, y + dy * .6, x + dx, y + dy * (.4 + .6 * o)); ctx.lineTo(x + 18, y + 6); ctx.closePath(); ctx.fill();
    });
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#3A2A3A'; ctx.lineWidth = 6;
    ctx.beginPath(); XS.filter(x => uOf(x) > .25 && uOf(x) < .95).forEach((x, i) => i ? ctx.lineTo(x, Lo(x)) : ctx.moveTo(x, Lo(x))); ctx.stroke();
    if (o > .3) {
      ctx.save(); eyePath(ctx, o); ctx.clip();
      ctx.strokeStyle = '#1C2560'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(IR[0], IR[1], IRR, 0, 6.283); ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = 'rgba(70,40,50,.75)'; ctx.lineWidth = 5;
      ctx.beginPath(); XS.filter(x => uOf(x) > .18 && uOf(x) < .8).forEach((x, i) => { const y = Up(x) - 62 * o - 6; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
    }
    // 眉毛
    ctx.fillStyle = '#3A2630';
    ctx.beginPath();
    for (let i = 0; i <= 30; i++) { const u = i / 30, x = lerp(-390, 400, u), y = -350 - 70 * Math.sin(Math.PI * u * .9) + 10 * u; i ? ctx.lineTo(x, y - 6 - 26 * Math.sin(Math.PI * Math.min(1, u * 1.2))) : ctx.moveTo(x, y); }
    for (let i = 30; i >= 0; i--) { const u = i / 30, x = lerp(-390, 400, u), y = -350 - 70 * Math.sin(Math.PI * u * .9) + 10 * u; ctx.lineTo(x, y + 6); }
    ctx.closePath(); ctx.fill();
  };
  const L_HI = (ctx, o) => {
    if (o < .5) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.ellipse(-25, -75, 54, 40, -.4, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(95, 55, 18, 0, 6.283); ctx.fill();
    const s = 26; ctx.beginPath(); ctx.moveTo(-110, 40 - s); ctx.lineTo(-104, 34); ctx.lineTo(-110 + s, 40); ctx.lineTo(-104, 46); ctx.lineTo(-110, 40 + s); ctx.lineTo(-116, 46); ctx.lineTo(-110 - s, 40); ctx.lineTo(-116, 34); ctx.closePath(); ctx.fill();
  };
  const LAYERS = [
    { f: L_BG, n: '01 背景', d: '手绘 · 不描线' },
    { f: L_COLOR, n: '02 上色', d: '平涂 · 4 色' },
    { f: L_SHADOW, n: '03 阴影', d: '硬边 · 单独一张' },
    { f: L_LINE, n: '04 线稿', d: '粗细 6 → 36px' },
    { f: L_HI, n: '05 高光', d: '纯白 · 最后叠' }
  ];
  const sheetCv = LAYERS.map(L => { const c = document.createElement('canvas'); c.width = 1400; c.height = 1000; const x = c.getContext('2d'); x.translate(700, 540); L.f(x, 1); return c; });
  function eyeVector(ctx, o) { for (const L of LAYERS) { ctx.save(); L.f(ctx, o); ctx.restore(); } }

  // 拆层：每两张之间一条“缝” g（0–1），从上往下砸回去
  function gap(i, t) {   // 第 i 张与第 i−1 张之间（i = 1..4）
    const sep = eo3((t - TL.split - (i - 1) * TL.splitStep) / .45);
    const ta = TL.slam[4 - i];
    const back = t < ta - .12 ? 1 : 1 - ei3((t - (ta - .12)) / .12);
    return sep * back;
  }
  function tilt(t) { return eo3((t - TL.split) / .5) * (1 - eio((t - TL.slam[4] + .1) / .32)); }
  // 拆开以后整叠片子一直在绕着转（不停）
  function orbit(t) { return .62 + .55 * eio((t - TL.split) / (TL.slam[4] - TL.split)); }
  function blinkO(t) {
    const u = on2(t - TL.blink);
    if (t < TL.blink || u > .42) return 1;
    const seq = [1, .45, .04, .04, .5, 1];
    return seq[Math.min(seq.length - 1, Math.round(u * 12))];
  }
  // 00 的镜头：中心 + 比例
  function cam00(t) {
    const S0 = 1.30, S1 = .74, S2 = .98;
    let S = lerp(S0, S1, eo3((t - TL.split) / .55));
    S = lerp(S, S2, eio((t - TL.slam[0] - .05) / .5));
    let cx = lerp(960, 860, eo3((t - TL.split) / .55)), cy = lerp(560, 640, eo3((t - TL.split) / .55));
    cx = lerp(cx, 960, eio((t - TL.slam[0] - .05) / .5)); cy = lerp(cy, 600, eio((t - TL.slam[0] - .05) / .5));
    return { S, cx, cy };
  }
  const ISO = [.78, .26, -.62, .40];
  const GAP = 200;
  function drawStack(ctx, t) {
    const c = cam00(t), K = tilt(t);
    const ph = orbit(t), ISOt = [Math.cos(ph) * 1.0, .52 * Math.sin(ph), -Math.sin(ph) * 1.0, .52 * Math.cos(ph)];
    const A = [lerp(1, ISOt[0], K), lerp(0, ISOt[1], K), lerp(0, ISOt[2], K), lerp(1, ISOt[3], K)];
    const ys = [0]; for (let i = 1; i < 5; i++) ys.push(ys[i - 1] - GAP * gap(i, t));
    const mean = ys.reduce((a, b) => a + b, 0) / 5;
    const labels = [];
    for (let i = 0; i < 5; i++) {
      const ox = c.cx + (i - 2) * 26 * K, oy = c.cy + (ys[i] - mean) * c.S + 10 * K * Math.sin(t * 6 + i * 1.3);
      ctx.setTransform(A[0] * c.S, A[1] * c.S, A[2] * c.S, A[3] * c.S, ox, oy);
      if (K < .02) { ctx.save(); LAYERS[i].f(ctx, blinkO(t)); ctx.restore(); }
      else {
        ctx.globalAlpha = 1;
        ctx.drawImage(sheetCv[i], -700, -540);
        ctx.globalAlpha = K;
        ctx.fillStyle = 'rgba(190,215,255,.16)'; ctx.fillRect(-700, -540, 1400, 1000);
        ctx.lineWidth = 3 / c.S; ctx.strokeStyle = 'rgba(80,110,170,.7)'; ctx.strokeRect(-700, -540, 1400, 1000);
        ctx.fillStyle = 'rgba(80,110,170,.75)';
        for (const px of [-90, 0, 90]) ctx.fillRect(px - 22, -520, 44, 16);
        ctx.globalAlpha = 1;
        labels.push({ i, x: A[0] * c.S * 700 + A[2] * c.S * -540 + ox, y: A[1] * c.S * 700 + A[3] * c.S * -540 + oy, a: K });
      }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return labels;
  }

  // ═══════════ 01 多层摄影台 · 黄金时刻（电影级动画背景）═══════════
  const VP = [960, 560], SUN = [1230, 545];
  function camZ(t) { return 5.6 * eio((t - TL.multi[0]) / (TL.multi[1] - TL.multi[0] + .3)); }
  const layerS = (z, t) => { const d = z - camZ(t); return d > .15 ? z / d : 0; };
  const Tz = (s, x, y) => [VP[0] + (x - VP[0]) * s, VP[1] + (y - VP[1]) * s];

  // 积云精灵：剪影 → 向光面暖白 → 高光 → 底部压暗（只算一次）
  function makeCloud(seed, w, h, flip) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'), r = rng(seed), C = [];
    for (let i = 0; i < 46; i++) {
      const u = .08 + .84 * r(), bell = Math.pow(Math.sin(Math.PI * u), 1.4);
      const rad = w * (.05 + .11 * r()) * (.6 + .6 * bell);
      const cy0 = h * .86 - rad * .6 - r() * h * .62 * bell;
      C.push([Math.min(Math.max(u * w, rad + 4), w - rad - 4), Math.max(cy0, rad + 4), rad]);
    }
    for (let i = 0; i < 10; i++) C.push([w * (.14 + .72 * i / 9), Math.min(h * .84, h - w * .08 - 4), w * .08]);
    const L = flip ? [-.75, -.62] : [.75, -.62];
    x.fillStyle = '#A3A6DA'; for (const [cx, cy, rr] of C) { x.beginPath(); x.arc(cx, cy, rr, 0, 6.283); x.fill(); }
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = '#C9C3EC'; for (const [cx, cy, rr] of C) { x.beginPath(); x.arc(cx + L[0] * rr * .18, cy + L[1] * rr * .18, rr * .95, 0, 6.283); x.fill(); }
    x.fillStyle = '#FFF2DE'; for (const [cx, cy, rr] of C) { x.beginPath(); x.arc(cx + L[0] * rr * .34, cy + L[1] * rr * .34, rr * .84, 0, 6.283); x.fill(); }
    x.fillStyle = '#FFFFFF'; for (const [cx, cy, rr] of C) { x.beginPath(); x.arc(cx + L[0] * rr * .52, cy + L[1] * rr * .52, rr * .55, 0, 6.283); x.fill(); }
    const g = x.createLinearGradient(0, h * .55, 0, h); g.addColorStop(0, 'rgba(96,92,170,0)'); g.addColorStop(1, 'rgba(96,92,170,.55)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    const g2 = x.createLinearGradient(flip ? w : 0, 0, flip ? 0 : w, 0); g2.addColorStop(0, 'rgba(255,190,120,0)'); g2.addColorStop(1, 'rgba(255,190,120,.30)');
    x.fillStyle = g2; x.fillRect(0, 0, w, h);
    return c;
  }
  const CLOUDS = [
    { cv: makeCloud(11, 1300, 760, false), x: 120, y: 120, w: 1050, z: 70 },
    { cv: makeCloud(23, 1100, 640, true), x: 1500, y: 170, w: 760, z: 60 },
    { cv: makeCloud(37, 900, 500, false), x: -300, y: 330, w: 620, z: 44 },
    { cv: makeCloud(41, 800, 460, true), x: 1680, y: 400, w: 520, z: 40 },
    { cv: makeCloud(53, 600, 340, false), x: 640, y: 420, w: 330, z: 52 }
  ];
  function ridge(seed, x0, x1, base, amp, freq) {
    const n = rng(seed), ph = n() * 9, ph2 = n() * 9;
    return x => base - amp * (.5 + .32 * Math.sin(x * freq + ph) + .18 * Math.sin(x * freq * 2.7 + ph2) + .06 * Math.sin(x * freq * 9.3));
  }
  // 一层山：渐变填充（大气透视）+ 逆光山脊亮边
  function hill(ctx, s, yf, top, bot, rim, rimW) {
    const pts = []; for (let x = -1800; x <= 3800; x += 24) pts.push(Tz(s, x, yf(x)));
    let ymin = 1e9; for (const p of pts) ymin = Math.min(ymin, p[1]);
    const g = ctx.createLinearGradient(0, ymin, 0, ymin + 380 * s);
    g.addColorStop(0, top); g.addColorStop(1, bot);
    ctx.fillStyle = g; ctx.beginPath();
    pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    let q = Tz(s, 3800, 2600); ctx.lineTo(q[0], q[1]); q = Tz(s, -1800, 2600); ctx.lineTo(q[0], q[1]); ctx.closePath(); ctx.fill();
    if (rim) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'round';
      const rg = ctx.createLinearGradient(SUN[0] - 1100, 0, SUN[0] + 1100, 0);
      rg.addColorStop(0, 'rgba(255,200,120,0)'); rg.addColorStop(.5, rim); rg.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.strokeStyle = rg; ctx.lineWidth = rimW * Math.max(s, .5);
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1] + rimW * .4 * s) : ctx.moveTo(p[0], p[1] + rimW * .4 * s)); ctx.stroke(); ctx.restore();
    }
  }
  const R_FAR = ridge(3, 0, 0, 640, 210, .0031), R_FAR2 = ridge(7, 0, 0, 655, 140, .0047);
  const R_MID = ridge(9, 0, 0, 790, 80, .0052), R_NEAR = ridge(13, 0, 0, 880, 70, .0068);
  function makeTree(seed) {
    const W = 1200, H = 1300, c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d'), r = rng(seed), C = [];
    for (let i = 0; i < 34; i++) { const a = r() * 6.283, d = Math.sqrt(r()) * 330; C.push([600 + Math.cos(a) * d * 1.15, 470 + Math.sin(a) * d * .8, 90 + 110 * r()]); }
    // 树干和枝
    x.strokeStyle = '#2A1D24'; x.lineCap = 'round'; x.lineWidth = 64;
    x.beginPath(); x.moveTo(610, 1290); x.quadraticCurveTo(570, 900, 600, 600); x.stroke();
    x.lineWidth = 30; x.beginPath(); x.moveTo(596, 800); x.quadraticCurveTo(470, 690, 400, 600); x.stroke();
    x.beginPath(); x.moveTo(604, 760); x.quadraticCurveTo(730, 680, 820, 590); x.stroke();
    x.save();
    x.fillStyle = '#163B2E'; for (const [cx, cy, rr] of C) { x.beginPath(); x.arc(cx, cy, rr, 0, 6.283); x.fill(); }
    x.globalCompositeOperation = 'source-atop';
    const L = [.72, -.6];
    x.fillStyle = '#2C6A45'; for (const [cx, cy, rr] of C) { x.beginPath(); x.arc(cx + L[0] * rr * .22, cy + L[1] * rr * .22, rr * .9, 0, 6.283); x.fill(); }
    x.fillStyle = '#6FB45A'; for (const [cx, cy, rr] of C) { x.beginPath(); x.arc(cx + L[0] * rr * .46, cy + L[1] * rr * .46, rr * .7, 0, 6.283); x.fill(); }
    x.fillStyle = '#A9D873'; for (const [cx, cy, rr] of C) { x.beginPath(); x.arc(cx + L[0] * rr * .68, cy + L[1] * rr * .68, rr * .34, 0, 6.283); x.fill(); }
    const g = x.createLinearGradient(1000, 0, 200, 0); g.addColorStop(0, 'rgba(255,190,110,.35)'); g.addColorStop(1, 'rgba(255,190,110,0)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.restore();
    return c;
  }
  const TREE_CV = [makeTree(71), makeTree(83)];
  function bigTree(ctx, s, x, y, h, t, k) {
    const cv = TREE_CV[k], sway = Math.sin(t * 1.6 + x) * .01;
    const w = h * cv.width / cv.height * s, hh = h * s, p = Tz(s, x, y);
    ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(sway); ctx.drawImage(cv, -w / 2, -hh, w, hh); ctx.restore();
  }
  const GRASS = [3.4, 4.6].map((z, L) => { const r = rng(500 + L), B = []; for (let i = 0; i < 700; i++) B.push([-1100 + 4200 * r(), 80 + 190 * r(), .6 + .8 * r(), r() * 6]); return { z, B, y: L ? 1000 : 1060 }; });
  function grass(ctx, s, G, t) {
    // 草团：深色底，顶边起伏
    const nz = rng(G.z * 100 | 0), ph = nz() * 9;
    ctx.fillStyle = '#0F2A1C'; ctx.beginPath();
    for (let x = -1200; x <= 3200; x += 40) { const p = Tz(s, x, G.y - 40 - 35 * Math.sin(x * .011 + ph) - 18 * Math.sin(x * .037)); x === -1200 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]); }
    let q = Tz(s, 3200, 2400); ctx.lineTo(q[0], q[1]); q = Tz(s, -1200, 2400); ctx.lineTo(q[0], q[1]); ctx.closePath(); ctx.fill();
    // 草叶：宽 → 尖的锥形，暗绿，叶尖被逆光照亮
    for (const [bx, h, k, ph2] of G.B) {
      const base = Tz(s, bx, G.y + 30), hh = h * k * s, sw = Math.sin(t * 2.2 + ph2 + bx * .004) * hh * .25 + hh * .12 * Math.sin(ph2 * 3);
      if (base[0] < -200 || base[0] > W0 + 200) continue;
      const w = Math.max(3, 14 * s * k * .6);
      const tip = [base[0] + sw, base[1] - hh], mid = [base[0] + sw * .35, base[1] - hh * .55];
      ctx.fillStyle = ph2 < 2 ? '#1D4A2C' : (ph2 < 4 ? '#163D25' : '#2A5E35');
      ctx.beginPath(); ctx.moveTo(base[0] - w, base[1]); ctx.quadraticCurveTo(mid[0] - w * .4, mid[1], tip[0], tip[1]); ctx.quadraticCurveTo(mid[0] + w * .4, mid[1], base[0] + w, base[1]); ctx.closePath(); ctx.fill();
      // 逆光：朝太阳一侧的叶缘一道亮线（只在靠近太阳的草上）
      const near = 1 - Math.min(1, Math.abs(base[0] - SUN[0]) / 1100);
      if (near > .05) {
        ctx.strokeStyle = `rgba(255,226,140,${.85 * near})`; ctx.lineWidth = Math.max(1.2, w * .28);
        ctx.beginPath(); ctx.moveTo(mid[0] + w * .25, mid[1]); ctx.quadraticCurveTo((mid[0] + tip[0]) / 2 + w * .2, (mid[1] + tip[1]) / 2, tip[0], tip[1]); ctx.stroke();
      }
    }
  }
  const MOTES = (() => { const r = rng(808), M = []; for (let i = 0; i < 90; i++) M.push([r() * 2200 - 140, 200 + r() * 800, 3 + 20 * r(), r() * 6, 1 + 3 * r()]); return M; })();
  function nightAmt(t) { return eio((t - TL.sunRed) / .5); }
  function drawMulti(ctx, t) {
    const n = nightAmt(t);
    // 天空：四段渐变，地平线最暖
    const g = ctx.createLinearGradient(0, 0, 0, 700);
    g.addColorStop(0, '#1A4FC4'); g.addColorStop(.42, '#3C98EA'); g.addColorStop(.72, '#9ED4F4'); g.addColorStop(.92, '#FFDDA8'); g.addColorStop(1, '#FFC27A');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W0, H0);
    // 太阳 + 光晕 + 光束（屏幕空间，太阳不随推镜移动——它在无穷远）
    const sunR = t < TL.sunRed ? 64 : 64 * Math.exp((t - TL.sunRed) * 8.4);
    const sp = [lerp(SUN[0], VP[0], eio((t - TL.sunRed) / .5)), lerp(SUN[1], VP[1], eio((t - TL.sunRed) / .5))];
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const bl = ctx.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], 760);
    bl.addColorStop(0, 'rgba(255,236,190,.95)'); bl.addColorStop(.12, 'rgba(255,214,150,.55)'); bl.addColorStop(.4, 'rgba(255,170,110,.18)'); bl.addColorStop(1, 'rgba(255,150,100,0)');
    ctx.fillStyle = bl; ctx.fillRect(0, 0, W0, H0);
    for (let k = 0; k < 16; k++) {
      const a = k / 16 * 6.283 + t * .05, w = .05 + .04 * Math.sin(k * 3.7);
      ctx.fillStyle = `rgba(255,226,170,${.045 + .03 * Math.sin(k * 1.9 + t)})`;
      ctx.beginPath(); ctx.moveTo(sp[0], sp[1]); ctx.lineTo(sp[0] + Math.cos(a - w) * 2600, sp[1] + Math.sin(a - w) * 2600); ctx.lineTo(sp[0] + Math.cos(a + w) * 2600, sp[1] + Math.sin(a + w) * 2600); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // 云（远 → 近）
    for (const c of CLOUDS) {
      const sc = layerS(c.z, t); if (!sc) continue;
      const p = Tz(sc, c.x, c.y), w = c.w * sc, h = w * c.cv.height / c.cv.width;
      ctx.drawImage(c.cv, p[0], p[1], w, h);
    }
    // 太阳本体（在远山之前画会被山挡住一半——压在地平线上）
    const sunC = mix(hex('#FFF8DC'), hex('#E8202E'), eio((t - TL.sunRed + .05) / .25));
    const drawSun = () => { ctx.fillStyle = rgb(sunC); ctx.beginPath(); ctx.arc(sp[0], sp[1], sunR, 0, 6.283); ctx.fill(); };
    if (t < TL.sunRed) drawSun();
    if (sunR < 1000) {
      // 远山两层：越远越淡、越偏蓝；逆光山脊亮边
      hill(ctx, layerS(80, t), R_FAR, 'rgba(150,170,226,1)', 'rgba(190,200,236,1)', 'rgba(255,214,160,.5)', 2);
      hill(ctx, layerS(48, t), R_FAR2, '#7D96D2', '#A4B6E2', 'rgba(255,214,160,.55)', 2.5);
      // 湖：倒映天空 + 太阳的光柱 + 闪烁的光点
      const sl = layerS(24, t), y0 = Tz(sl, 0, 648)[1], y1 = Tz(sl, 0, 800)[1];
      const lg = ctx.createLinearGradient(0, y0, 0, y1); lg.addColorStop(0, '#FFD9A0'); lg.addColorStop(.5, '#9FCFEF'); lg.addColorStop(1, '#4F8FD8');
      ctx.fillStyle = lg; ctx.fillRect(0, y0, W0, y1 - y0);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const col = ctx.createLinearGradient(sp[0] - 120, 0, sp[0] + 120, 0); col.addColorStop(0, 'rgba(255,220,160,0)'); col.addColorStop(.5, 'rgba(255,230,180,.7)'); col.addColorStop(1, 'rgba(255,220,160,0)');
      ctx.fillStyle = col; ctx.fillRect(sp[0] - 120, y0, 240, y1 - y0);
      const r = rng(Math.floor(t * 20));
      for (let k = 0; k < 70; k++) { const x = sp[0] + (r() - .5) * 900 * (1 + r()), y = y0 + (y1 - y0) * r(); const a = r() * (1 - Math.abs(x - sp[0]) / 900); if (a > .1) { ctx.fillStyle = `rgba(255,248,220,${a})`; ctx.fillRect(x - 6, y, 12 + 10 * r(), 2); } }
      ctx.restore();
      // 中景、近景山丘
      hill(ctx, layerS(18, t), R_MID, '#86C85E', '#3E8A4C', 'rgba(255,236,150,.85)', 3);
      bigTree(ctx, layerS(16, t), 1560, 770, 300, t, 1);
      hill(ctx, layerS(9, t), R_NEAR, '#5DAA52', '#1F5A38', 'rgba(255,240,160,.9)', 3.5);
      bigTree(ctx, layerS(9, t), 420, 880, 600, t, 0);
      // 前景草（两层，推镜时从下方掠过）
      for (const G of GRASS.slice().reverse()) { const sg = layerS(G.z, t); if (sg) grass(ctx, sg, G, t); }
      // 逆光光尘
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const [mx, my, z, ph, sz] of MOTES) {
        const sm = layerS(z, t); if (!sm) continue;
        const p = Tz(sm, mx + 30 * Math.sin(t * .7 + ph), my - 20 * t + 12 * Math.sin(t * 1.3 + ph));
        const rr = sz * sm; if (rr > 60) continue;
        const gg = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], rr * 2.2);
        gg.addColorStop(0, 'rgba(255,236,190,.75)'); gg.addColorStop(1, 'rgba(255,236,190,0)');
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(p[0], p[1], rr * 2.2, 0, 6.283); ctx.fill();
      }
      // 镜头光斑：沿 太阳 → 画面中心 的连线
      const dx = 960 - sp[0], dy = 540 - sp[1];
      [[.5, 40, 'rgba(160,220,255,.16)'], [.9, 22, 'rgba(255,200,140,.22)'], [1.35, 90, 'rgba(140,255,200,.08)'], [1.8, 30, 'rgba(255,160,200,.14)']].forEach(([k, rr, c]) => {
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(sp[0] + dx * k, sp[1] + dy * k, rr, 0, 6.283); ctx.fill();
      });
      ctx.restore();
    }
    if (t >= TL.sunRed) drawSun();   // 变红以后冲到所有景物前面
    // 调色：暖色叠加 + 暗角；太阳变红时整片压成洋红黄昏
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(255,170,90,.35)'; ctx.fillRect(0, 0, W0, H0);
    if (n > 0) { ctx.globalCompositeOperation = 'multiply'; const dg = ctx.createLinearGradient(0, 0, 0, H0); dg.addColorStop(0, `rgba(90,40,150,${n})`); dg.addColorStop(1, `rgba(255,110,70,${n})`); ctx.fillStyle = dg; ctx.fillRect(0, 0, W0, H0); }
    ctx.globalCompositeOperation = 'source-over';
    const vg = ctx.createRadialGradient(960, 540, 500, 960, 540, 1250); vg.addColorStop(0, 'rgba(10,10,40,0)'); vg.addColorStop(1, 'rgba(10,10,40,.38)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W0, H0);
    ctx.restore();
    if (sunR > 380) { ctx.fillStyle = `rgba(232,32,46,${cl((sunR - 380) / 700)})`; ctx.fillRect(0, 0, W0, H0); }
  }

  // ═══════════ 02 夜街 · 侧滑 ═══════════
  function bikeX(t) {
    const u = (t - TL.bikeIn) / (TL.bikeStop - TL.bikeIn);
    if (u <= 0) return 2600;
    return lerp(2600, 820, 1 - Math.pow(1 - cl(u), 2.4));
  }
  // 压车（绕行进方向的翻滚角，弧度）：侧面看 = 车身压扁 + 往远离镜头的一侧斜
  function bikeLean(t) {
    const a = eo3((t - TL.skid + .1) / .2), b = eio((t - TL.bikeStop + .05) / .35);
    return .75 * a * (1 - b) + .12 * b;
  }
  function bikeXf(roll) { return { sy: Math.cos(roll), kx: -Math.sin(roll) * .55, r: -.06 * Math.sin(roll) }; }
  const BY = 760;
  function drawBike(ctx, x, lean, alpha) {
    const X = bikeXf(lean);
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, BY + 96); ctx.rotate(X.r); ctx.scale(1, X.sy); ctx.transform(1, 0, X.kx, 1, 0, 0); ctx.translate(0, -96);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const INKC = '#0D0D1A';
    // 前叉、车架
    ctx.strokeStyle = INKC; ctx.lineWidth = 22;
    ctx.beginPath(); ctx.moveTo(-235, 0); ctx.lineTo(-170, -150); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(235, 0); ctx.lineTo(120, -90); ctx.stroke();
    // 轮子：大、露在车身外
    for (const wx of [-235, 235]) {
      ctx.fillStyle = INKC; ctx.beginPath(); ctx.arc(wx, 0, 96, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#2A2E52'; ctx.beginPath(); ctx.arc(wx, 0, 56, 0, 6.283); ctx.fill();
      ctx.strokeStyle = '#5C7CFF'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(wx, 0, 74, 3.7, 5.3); ctx.stroke();
      ctx.fillStyle = '#9AA6D8'; ctx.beginPath(); ctx.arc(wx, 0, 14, 0, 6.283); ctx.fill();
    }
    // 车身：低趴的红色胶囊，从前叉到后轮上方
    ctx.beginPath();
    ctx.moveTo(-205, -118); ctx.quadraticCurveTo(-200, -205, -90, -212); ctx.lineTo(90, -200);
    ctx.quadraticCurveTo(200, -192, 268, -118); ctx.lineTo(250, -70); ctx.lineTo(60, -62); ctx.lineTo(-30, -40); ctx.lineTo(-150, -60); ctx.closePath();
    ctx.fillStyle = '#E8202E'; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#8E0B2A'; ctx.fillRect(-300, -110, 600, 90);       // 下半：硬边阴影
    ctx.fillStyle = '#FF8A7E'; ctx.fillRect(-300, -214, 600, 24);       // 顶：硬边高光
    ctx.restore();
    ctx.strokeStyle = INKC; ctx.lineWidth = 10; ctx.stroke();
    // 座位
    ctx.fillStyle = INKC; ctx.beginPath(); ctx.moveTo(40, -205); ctx.quadraticCurveTo(120, -238, 200, -196); ctx.lineTo(60, -196); ctx.closePath(); ctx.fill();
    // 挡风
    ctx.beginPath(); ctx.moveTo(-170, -200); ctx.quadraticCurveTo(-200, -300, -90, -300); ctx.lineTo(-50, -212); ctx.closePath();
    ctx.fillStyle = '#9FD8FF'; ctx.fill(); ctx.lineWidth = 9; ctx.stroke();
    // 车头灯、尾灯
    ctx.fillStyle = '#FFF4B0'; ctx.beginPath(); ctx.arc(-214, -150, 22, 0, 6.283); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#FF3040'; ctx.beginPath(); ctx.ellipse(262, -128, 12, 18, 0, 0, 6.283); ctx.fill();
    ctx.restore();
  }
  function tailPt(t) {
    const X = bikeXf(bikeLean(t));
    let px = 262, py = -128 - 96;
    px += X.kx * py; py *= X.sy;
    const c = Math.cos(X.r), sn = Math.sin(X.r);
    return [bikeX(t) + c * px - sn * py, BY + 96 + sn * px + c * py];
  }
  function drawNight(ctx, t, camx) {
    const g = ctx.createLinearGradient(0, 0, 0, 640);
    g.addColorStop(0, '#060A24'); g.addColorStop(1, '#1D2160');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W0, 640);
    // 城市：两层剪影 + 窗
    const r = rng(77);
    for (let L = 0; L < 2; L++) {
      const par = L ? .5 : .25;
      ctx.fillStyle = L ? '#141A48' : '#1E2662';
      let x = -200 - (camx * par) % 400;
      while (x < W0 + 200) {
        const w = 90 + r() * 140, h = 120 + r() * (L ? 300 : 200);
        ctx.fillRect(x, 640 - h, w, h);
        if (L) { ctx.fillStyle = '#FFD86B'; for (let k = 0; k < 6; k++) if (r() < .5) ctx.fillRect(x + 12 + (k % 3) * 26, 640 - h + 20 + Math.floor(k / 3) * 40, 12, 18); ctx.fillStyle = '#141A48'; }
        x += w + 10;
      }
    }
    // 路面
    ctx.fillStyle = '#121428'; ctx.fillRect(0, 640, W0, H0 - 640);
    ctx.fillStyle = '#1B1E3A'; ctx.fillRect(0, 640, W0, 14);
    ctx.fillStyle = '#E6E3D6';
    const off = (camx * 1.4) % 260;
    for (let x = -off - 260; x < W0 + 260; x += 260) ctx.fillRect(x, 905, 140, 10);
    // 光轨：尾灯过去 0.4 秒的位置（停下后慢慢变淡）
    const t0 = Math.max(TL.bikeIn, t - .6), fadeOut = 1 - cl((t - TL.bikeStop - .5) / 1.0);
    if (t > TL.bikeIn && fadeOut > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      const pts = []; for (let k = 0; k <= 40; k++) { const tt = lerp(t0, t, k / 40); pts.push(tailPt(Math.min(tt, TL.bikeStop + .05))); }
      for (const [w, a, c] of [[90, .12, '255,30,60'], [44, .35, '255,40,70'], [18, .9, '255,90,110'], [6, 1, '255,225,225']]) {
        ctx.strokeStyle = `rgba(${c},${a * fadeOut})`; ctx.lineWidth = w;
        ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
        ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0] - 30, p[1] + 52) : ctx.moveTo(p[0] - 30, p[1] + 52)); ctx.stroke();
      }
      ctx.restore();
    }
    // 拖影：最快的那几帧画 4 张残影
    const v = Math.abs(bikeX(t) - bikeX(t - 1 / 60)) * 60;
    if (v > 2500) for (let k = 4; k >= 1; k--) drawBike(ctx, bikeX(t) + k * v * .012, bikeLean(t), .12 * (5 - k) / 4);
    drawBike(ctx, bikeX(t), bikeLean(t), 1);
    // 火花
    if (t > TL.skid) {
      const rr = rng(91);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      for (let k = 0; k < 60; k++) {
        const born = TL.skid + rr() * (TL.bikeStop - TL.skid), age = t - born;
        if (age < 0 || age > .45) continue;
        const bx = bikeX(born) + 235, by = BY + 92, vx = 300 + rr() * 900, vy = -400 - rr() * 500;
        const x = bx + vx * age, y = by + vy * age + 1600 * age * age;
        ctx.strokeStyle = `rgba(255,${200 + rr() * 55},120,${1 - age / .45})`; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - vx * .02, y - (vy + 3200 * age) * .02); ctx.stroke();
      }
      ctx.restore();
    }
  }

  // ═══════════ 冲击帧 ═══════════
  function speedLines(ctx, t, col, n) {
    const r = rng(Math.floor(t * 12) + 3);
    ctx.fillStyle = col;
    for (let k = 0; k < n; k++) {
      const a = r() * 6.283, r0 = 260 + r() * 260, w = .01 + r() * .02;
      ctx.beginPath();
      ctx.moveTo(960 + Math.cos(a) * r0, 540 + Math.sin(a) * r0);
      ctx.lineTo(960 + Math.cos(a - w) * 1500, 540 + Math.sin(a - w) * 1500);
      ctx.lineTo(960 + Math.cos(a + w) * 1500, 540 + Math.sin(a + w) * 1500);
      ctx.closePath(); ctx.fill();
    }
  }

  // ═══════════ 全场 ═══════════
  function drawWorld(ctx, t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    let labels = null;
    if (t < TL.dive[1]) {
      ctx.fillStyle = '#FFF3D6'; ctx.fillRect(0, 0, W0, H0);
      if (t < TL.dive[0]) labels = drawStack(ctx, t);
      else {
        // 钻进高光：对数推镜
        const c = cam00(t), u = eio((t - TL.dive[0]) / (TL.dive[1] - TL.dive[0])), Z = Math.exp(Math.log(46) * u);
        const fx = c.cx + c.S * -25, fy = c.cy + c.S * -75;
        ctx.setTransform(c.S * Z, 0, 0, c.S * Z, fx + (c.cx - fx) * Z, fy + (c.cy - fy) * Z);
        eyeVector(ctx, 1);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = `rgba(255,255,255,${ei3((u - .55) / .45)})`; ctx.fillRect(0, 0, W0, H0);
      }
    } else if (t < TL.iris[0]) {
      drawMulti(ctx, t);
      const w = 1 - eo3((t - TL.dive[1]) / .22);
      if (w > 0) { ctx.fillStyle = `rgba(255,255,255,${w})`; ctx.fillRect(0, 0, W0, H0); }
    } else {
      const camx = (TL.bikeIn - Math.min(t, TL.bikeStop + .2)) * -900;
      const push = 1 + .1 * eio((t - TL.bikeStop) / 1.2);
      ctx.setTransform(push, 0, 0, push, 960 * (1 - push), 600 * (1 - push));
      drawNight(ctx, t, camx);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      // 圆形开孔：从满屏红里打开
      const ir = 2300 * eo3((t - TL.iris[0]) / (TL.iris[1] - TL.iris[0]));
      if (ir < 2250) {
        ctx.fillStyle = '#E8202E'; ctx.beginPath(); ctx.rect(0, 0, W0, H0); ctx.arc(960, 560, ir, 0, 6.283, true); ctx.fill('evenodd');
        ctx.strokeStyle = '#0D0D1A'; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(960, 560, ir, 0, 6.283); ctx.stroke();
      }
    }
    return labels;
  }
  // 落地往下“咚”一下（只往下）
  function dip(t) {
    let d = 0;
    for (const [ts, A] of [[TL.slam[0], 6], [TL.slam[4], 12], [TL.iris[0], 8], [TL.bikeStop, 14], [TL.impact, 18]]) if (t >= ts) d += A * (1 - Math.exp(-(t - ts) * 90)) * Math.exp(-(t - ts) * 10);
    return d;
  }
  function impactMode(t) {
    if (t < TL.impact0[1]) return 1;
    if (t >= TL.impact && t < TL.impact + 1 / 12) return 1;
    if (t >= TL.impact + 1 / 12 && t < TL.impact + 2 / 12) return 2;
    return 0;
  }

  // ═══════════ 外框 / 读数 ═══════════
  const $ = id => document.getElementById(id);
  const CHAP = [
    [0, '00', '赛璐璐', 'CEL ANIMATION', '一张画 = 5 张透明片叠起来'],
    [TL.dive[1], '01', '白雪公主', '1937 · 迪士尼 · 多层摄影台', '景分几层，近的走得快，远的走得慢'],
    [TL.iris[0], '02', 'AKIRA', '1988 · 大友克洋 · 尾灯光轨', '光轨 = 尾灯过去 0.6 秒走过的路'],
    [TL.impact, '03', '冲击帧', 'IMPACT FRAME', '最重的那一下：反相 2 张']
  ];
  let curChap = -1;
  function frameUI(t) {
    let ci = 0; for (let i = 0; i < CHAP.length; i++) if (t >= CHAP[i][0]) ci = i;
    if (ci !== curChap) {
      curChap = ci; const c = CHAP[ci];
      $('cn').textContent = c[1]; $('ct').textContent = c[2]; $('cy').textContent = c[3]; $('cs').textContent = c[4];
      $('pg').textContent = `${c[1]} / 05`;
    }
    const dark = (t >= TL.iris[0] && t < TL.impact) || impactMode(t) === 1;
    document.body.classList.toggle('dark', dark);
    const rise = ci === 0 ? 1 : eo3((t - CHAP[ci][0]) / (16 / 60));
    for (const id of ['cn', 'ct', 'cy', 'cs']) $(id).style.transform = `translateY(${(1 - rise) * 110}%)`;
    $('frame').style.opacity = t >= TL.title + .1 ? 1 - cl((t - TL.title - .1) / .2) : 1;
  }
  function tag(ctx, x, y, a, main, sub, dark) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    ctx.font = '400 19px "Geist Mono"';
    const w = Math.max(ctx.measureText(main).width, sub ? ctx.measureText(sub).width * .9 : 0) + 26;
    ctx.fillStyle = dark ? 'rgba(13,13,26,.85)' : '#FFFDF5'; ctx.strokeStyle = dark ? '#FFD23F' : '#14142B'; ctx.lineWidth = 3;
    ctx.fillRect(x, y, w, sub ? 58 : 34); ctx.strokeRect(x, y, w, sub ? 58 : 34);
    ctx.fillStyle = dark ? '#FFD23F' : '#14142B'; ctx.fillText(main, x + 13, y + 24);
    if (sub) { ctx.font = '400 16px "Geist Mono"'; ctx.fillStyle = dark ? '#FFFDF5' : '#E8202E'; ctx.fillText(sub, x + 13, y + 47); }
    ctx.restore();
  }
  function readouts(ctx, t, labels) {
    if (labels) for (const L of labels) tag(ctx, L.x + 24, L.y - 30, cl((L.a - .6) / .3), LAYERS[L.i].n, LAYERS[L.i].d);
    if (t >= TL.blink - .05 && t < TL.dive[0] + .05) {
      const u = on2(t - TL.blink), k = Math.min(6, Math.max(1, Math.round(u * 12) + 1));
      tag(ctx, 1290, 250, cl((t - TL.blink + .05) / .1), `一拍二 · 12 张 / 秒`, `眨眼 第 ${k} / 6 张`);
    }
    if (t > TL.dive[1] + .25 && t < TL.sunRed + .1) {
      const a = cl((t - TL.dive[1] - .25) / .15) * (1 - cl((t - TL.sunRed) / .1));
      const spd = z => { const d = z - camZ(t); return d > .15 ? z / (d * d) : 0; };
      const base = spd(18);
      tag(ctx, 1480, 470, a, `远山 ×${(spd(48) / base).toFixed(2)}`, null);
      tag(ctx, 1480, 520, a, `中景 ×1.00`, null);
      { const v = spd(4.6) / base; tag(ctx, 1480, 570, a, v > 0 && v < 40 ? `前景草 ×${v.toFixed(1)}` : '前景草 · 已擦过镜头', null); }
      tag(ctx, 1480, 620, a, '同一个镜头 · 9 层速度', null);
    }
    if (t > TL.skid && t < TL.impact) {
      const p = tailPt(Math.min(t, TL.bikeStop)), a = cl((t - TL.skid) / .12);
      tag(ctx, Math.min(p[0] + 60, 1540), p[1] - 210, a, '光轨 = 过去 0.6 秒', '尾灯的路径 · 叠加发光', true);
      if (t < TL.bikeStop + .3) tag(ctx, 1180, 900, a, '拖影 4 张 · 只在最快的几帧', null, true);
      if (t > TL.bikeStop) tag(ctx, 200, 980, cl((t - TL.bikeStop) / .15), '侧滑：车身压低 43° · 火花 60 颗', null, true);
    }
  }
  function titleUI(t) {
    const tt = t - TL.title, e = $('title'), sub = $('sub'), cr = $('credit');
    if (tt < 0) { e.style.opacity = 0; sub.style.opacity = 0; cr.style.opacity = 0; return; }
    const q = on2(tt);   // 字也是一拍二
    const seq = [2.4, 1.5, .9, 1.06, .98, 1];
    const s = seq[Math.min(seq.length - 1, Math.round(q * 12))];
    e.style.opacity = 1; e.style.transform = `translate(-50%, -50%) rotate(-4deg) scale(${s})`;
    e.classList.toggle('inv', impactMode(t) > 0);
    const n = Math.floor(Math.max(t - TL.title - .35, 0) * 18), S = '一张画 = 5 张赛璐璐片 · 一拍二 · 冲击帧';
    sub.textContent = S.slice(0, Math.min(n, S.length)); sub.style.opacity = n > 0 ? 1 : 0;
    cr.style.opacity = cl((t - TL.credit) / .25);
  }

  // ═══════════ 逐帧 ═══════════
  const cv = $('c'), ctx = cv.getContext('2d');
  const off = document.createElement('canvas'); off.width = W0; off.height = H0;
  const octx = off.getContext('2d');
  const acc = document.createElement('canvas'); acc.width = W0; acc.height = H0;
  const actx = acc.getContext('2d');
  window.frame = async f => {
    const t = f / 60;
    const im = impactMode(t);
    const fast = (t > TL.dive[0] && t < TL.dive[1] + .1) || (t > TL.bikeIn && t < TL.bikeStop) || (t > TL.sunRed + .2 && t < TL.iris[1]) || (t > TL.split && t < TL.split + .5) || (t > TL.slam[0] - .05 && t < TL.slam[4] + .35);
    const SUB = im ? 1 : (fast ? 9 : 4), SH = .5 / 60;
    let labels = null;
    for (let k = 0; k < SUB; k++) {
      const ts = SUB === 1 ? t : t + (k / (SUB - 1) - .5) * SH;
      // 冲击帧（第 0 帧）画的是拼好的眼睛
      const lb = drawWorld(octx, im && t < 1 ? 1.95 + 0 * ts : (im && t > TL.impact - .1 ? TL.impact - .02 : ts));
      if (k === SUB - 1) labels = lb;
      actx.globalAlpha = 1 / (k + 1); actx.drawImage(off, 0, 0);
    }
    actx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W0, H0);
    const d = dip(t);
    if (im) {
      ctx.filter = im === 1 ? 'grayscale(1) contrast(9) invert(1)' : 'grayscale(1) contrast(9)';
      ctx.drawImage(acc, 0, d); ctx.filter = 'none';
      speedLines(ctx, t, im === 1 ? '#FFFFFF' : '#0D0D1A', 70);
    } else {
      ctx.drawImage(acc, 0, d);
      readouts(ctx, t, labels && !im ? labels : null);
    }
    frameUI(t); titleUI(t);
  };
  Promise.all([document.fonts.load('400 120px "ZCOOL QingKe HuangYou"', '赛璐璐'), document.fonts.load('400 19px "Geist Mono"', 'A一')])
    .then(() => document.fonts.ready).then(async () => { await window.frame(0); window.ready = true; });
})();
