// 赛璐璐 · 开场 6 秒（按孟菲斯 / 构成主义的丝滑做法：弹簧入场、错峰、恒速环绕、底边压扁、节拍呼吸）
(function () {
  const TL = window.TL, E = window.Eye, W0 = 1920, H0 = 1080;
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  // 缓动（与 src/lib/anim.ts 相同的贝塞尔）
  function bez(x1, y1, x2, y2) {
    const A = (a, b) => 1 - 3 * b + 3 * a, B = (a, b) => 3 * b - 6 * a, C = a => 3 * a;
    const cal = (t, a, b) => ((A(a, b) * t + B(a, b)) * t + C(a)) * t, slope = (t, a, b) => 3 * A(a, b) * t * t + 2 * B(a, b) * t + C(a);
    return x => { x = cl(x); let t = x; for (let i = 0; i < 8; i++) { const s = slope(t, x1, x2); if (Math.abs(s) < 1e-6) break; t -= (cal(t, x1, x2) - x) / s; } return cal(cl(t), y1, y2); };
  }
  const Eo = bez(.16, 1, .3, 1), EinOut = bez(.65, 0, .35, 1), Ein = bez(.55, 0, .9, .3);
  const tween = (f, s, d, ease = Eo) => ease(cl((f - s) / d));
  // 弹簧（与 Remotion spring 同一个解析解）：SNAP / POP / SMOOTH
  const SNAP = { c: 11, m: .7, k: 170 }, POP = { c: 8, m: .5, k: 220 }, SMOOTH = { c: 20, m: .9, k: 120 };
  function spr(f, f0, P = SNAP) {
    const t = (f - f0) / 60; if (t <= 0) return 0;
    const w0 = Math.sqrt(P.k / P.m), z = P.c / (2 * Math.sqrt(P.k * P.m));
    if (z < 1) { const wd = w0 * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + z * w0 / wd * Math.sin(wd * t)); }
    return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  }
  function rng(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

  // ——— 眼睛的 5 张片（预先画好）———
  const sheets = E.LAYERS.map(L => { const c = document.createElement('canvas'); c.width = 1400; c.height = 1000; const x = c.getContext('2d'); x.translate(700, 540); L.f(x, 1); return c; });
  const eyeFlat = (ctx, o) => { for (const L of E.LAYERS) { ctx.save(); L.f(ctx, o); ctx.restore(); } };

  // ——— 蓝铅笔原画：每根线一条折线，按顺序“画”出来 ———
  const BL = 'rgba(52,108,230,';
  const circ = (cx, cy, rr, n = 48) => { const p = []; for (let i = 0; i <= n; i++) { const a = i / n * 6.283 - 1.6; p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return p; };
  const r0 = rng(7);
  const jit = (pts, amt) => pts.map(([x, y]) => [x + (r0() - .5) * amt, y + (r0() - .5) * amt]);
  const PENCIL = [
    { p: [[-560, E.IR[1]], [620, E.IR[1]]], w: 2, a: .4, dash: true },
    { p: [[E.IR[0], -480], [E.IR[0], 360]], w: 2, a: .4, dash: true },
    { p: circ(20, -30, 520, 64).map(([x, y]) => [x, -30 + (y + 30) * .58]), w: 2, a: .35, dash: true },
    { p: jit(circ(E.IR[0], E.IR[1], E.IRR), 7), w: 3, a: .6 },
    { p: jit(circ(E.IR[0], E.IR[1], E.IRR + 5), 9), w: 2.5, a: .45 },
    { p: jit(E.XS.map(x => [x, E.Up(x)]), 8), w: 3.4, a: .65 },
    { p: jit(E.XS.map(x => [x, E.Up(x) - 4]), 10), w: 2.6, a: .45 },
    { p: jit(E.XS.filter(x => E.uOf(x) > .2).map(x => [x, E.Lo(x)]), 8), w: 2.6, a: .5 },
    { p: jit(circ(E.IR[0], E.IR[1] + 15, 82), 6), w: 2.5, a: .55 },
    { p: jit([[-390, -350], [-150, -410], [100, -425], [400, -395]], 8), w: 3.4, a: .6 },
    { p: jit(E.XS.filter(x => E.uOf(x) > .18 && E.uOf(x) < .8).map(x => [x, E.Up(x) - 68]), 8), w: 2.4, a: .45 }
  ];
  function polyLen(p) { let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return L; }
  PENCIL.forEach(l => l.L = polyLen(l.p));
  function drawPencil(ctx, f) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    PENCIL.forEach((l, i) => {
      const u = 1;   // 第 0 帧原画就已经画好
      ctx.strokeStyle = BL + l.a + ')'; ctx.lineWidth = l.w;
      ctx.setLineDash(l.dash ? [14, 10] : []);
      ctx.beginPath();
      let left = l.L * u;
      ctx.moveTo(l.p[0][0], l.p[0][1]);
      for (let k = 1; k < l.p.length && left > 0; k++) {
        const s = Math.hypot(l.p[k][0] - l.p[k - 1][0], l.p[k][1] - l.p[k - 1][1]);
        if (s <= left) { ctx.lineTo(l.p[k][0], l.p[k][1]); left -= s; }
        else { const q = left / s; ctx.lineTo(lerp(l.p[k - 1][0], l.p[k][0], q), lerp(l.p[k - 1][1], l.p[k][1], q)); left = 0; }
      }
      ctx.stroke();
    });
    ctx.setLineDash([]);
  }

  // ——— 分割线：从原画那边一路扫过去（SMOOTH 弹簧，带一点过冲）———
  const Eslide = bez(.42, 0, .18, 1);   // 起步就在动、收尾很慢
  function slideX(f) { return lerp(1010, -200, Eslide(cl((f - TL.slide) / 70))); }
  const TILT_DX = -180;   // 分割线是斜的：顶端比底端往右 180

  // ——— 拆层 / 砸回 ———
  function gapK(i, f) {   // 第 i 张与第 i−1 张之间（1..4）
    const up = spr(f, TL.pop + (i - 1) * TL.popStep, SNAP);
    const ta = TL.slam[4 - i];
    const down = f < ta ? 1 : 1 - Ein(cl((f - ta) / 7));
    return up * down;
  }
  function tiltK(f) { return spr(f, TL.tilt, SMOOTH) * (1 - spr(f, TL.flat, SMOOTH)); }
  function orbit(f) { return .55 + .0045 * Math.max(0, f - TL.tilt); }   // 恒速环绕：一直在转
  function squash(f) {   // 最后一张落地：以底边为原点压扁，衰减余弦回弹
    let s = 0;
    for (const ta of TL.slam) { const u = f - ta - 7; if (u >= 0) s += .06 * Math.exp(-u / 8) * Math.cos(u * .38); }
    return s;
  }
  function blinkO(f) {
    const u = Math.floor((f - TL.blink) / 2) * 2;   // 一拍二
    if (f < TL.blink || u > 26) return 1;
    const seq = [1, .5, .06, .06, .06, .5, 1];
    return seq[Math.min(seq.length - 1, Math.floor(u / 4))];
  }
  function cam(f) {
    const S = lerp(1.0, .74, spr(f, TL.tilt, SMOOTH)) ;
    const S2 = lerp(S, 1.0, spr(f, TL.flat, SMOOTH));
    const push = (1 + .0006 * Math.max(0, f - TL.flat)) * (1 + .0012 * Math.min(f, TL.tilt) - .0012 * TL.tilt * spr(f, TL.tilt, SMOOTH));   // 开场慢推、拼好以后继续慢推
    return { S: S2 * push, cx: lerp(930, 900, tiltK(f)), cy: lerp(650, 640, tiltK(f)) };
  }
  function drawEye(ctx, f) {
    const c = cam(f), K = tiltK(f), ph = orbit(f);
    const ISO = [Math.cos(ph), .52 * Math.sin(ph), -Math.sin(ph), .52 * Math.cos(ph)];
    const A = [lerp(1, ISO[0], K), lerp(0, ISO[1], K), lerp(0, ISO[2], K), lerp(1, ISO[3], K)];
    const ys = [0]; for (let i = 1; i < 5; i++) ys.push(ys[i - 1] - 210 * gapK(i, f));
    const mean = ys.reduce((a, b) => a + b, 0) / 5;
    const sq = squash(f);
    const lab = [];
    if (K < .01) {
      ctx.setTransform(c.S * (1 + sq), 0, 0, c.S * (1 - sq), c.cx, c.cy + 300 * c.S * sq);
      eyeFlat(ctx, blinkO(f));
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      return lab;
    }
    for (let i = 0; i < 5; i++) {
      const ox = c.cx + (i - 2) * 30 * K, oy = c.cy + (ys[i] - mean) * c.S + 8 * K * Math.sin(f * .1 + i * 1.3);
      ctx.setTransform(A[0] * c.S, A[1] * c.S, A[2] * c.S, A[3] * c.S, ox, oy);
      ctx.drawImage(sheets[i], -700, -540);
      ctx.globalAlpha = K;
      ctx.fillStyle = 'rgba(190,215,255,.14)'; ctx.fillRect(-700, -540, 1400, 1000);
      ctx.lineWidth = 3 / c.S; ctx.strokeStyle = 'rgba(70,100,170,.75)'; ctx.strokeRect(-700, -540, 1400, 1000);
      ctx.fillStyle = 'rgba(70,100,170,.8)'; for (const px of [-90, 0, 90]) ctx.fillRect(px - 22, -520, 44, 16);
      ctx.globalAlpha = 1;
      lab.push({ i, x: A[0] * c.S * 700 + A[2] * c.S * -540 + ox, y: A[1] * c.S * 700 + A[3] * c.S * -540 + oy });
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return lab;
  }

  // ——— 片尾：瞳孔张开吞掉整屏 → 标题 ———
  function speed(ctx, f) {
    const pulse = 1 + .06 * Math.exp(-((f - TL.title) % TL.beat) / 6) * (f >= TL.title ? 1 : 0);
    const r = rng(3);
    ctx.fillStyle = 'rgba(255,210,63,.9)';
    for (let k = 0; k < 64; k++) {
      const a = r() * 6.283 + f * .002, r1 = (300 + r() * 200) * pulse, w = .008 + r() * .016;
      ctx.beginPath(); ctx.moveTo(960 + Math.cos(a) * r1, 540 + Math.sin(a) * r1);
      ctx.lineTo(960 + Math.cos(a - w) * 1500, 540 + Math.sin(a - w) * 1500); ctx.lineTo(960 + Math.cos(a + w) * 1500, 540 + Math.sin(a + w) * 1500); ctx.closePath(); ctx.fill();
    }
  }

  function drawWorld(ctx, f) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
    // 背景：原画纸 / 皮肤
    if (f < TL.iris + TL.irisDur) {
      ctx.fillStyle = '#FFE3CF'; ctx.fillRect(0, 0, W0, H0);
      const sx = slideX(f);
      if (sx > -150) {   // 原画那一侧（分割线左边）
        ctx.save(); ctx.beginPath(); ctx.moveTo(sx + TILT_DX * .5, -20); ctx.lineTo(-20, -20); ctx.lineTo(-20, H0 + 20); ctx.lineTo(sx - TILT_DX * .5, H0 + 20); ctx.closePath(); ctx.clip();
        ctx.fillStyle = '#F7F4EA'; ctx.fillRect(0, 0, W0, H0);
        const c = cam(f); ctx.setTransform(c.S, 0, 0, c.S, c.cx, c.cy); drawPencil(ctx, f); ctx.restore();
        ctx.save(); ctx.beginPath(); ctx.moveTo(sx + TILT_DX * .5, -20); ctx.lineTo(W0 + 20, -20); ctx.lineTo(W0 + 20, H0 + 20); ctx.lineTo(sx - TILT_DX * .5, H0 + 20); ctx.closePath(); ctx.clip();
        drawEye(ctx, f); ctx.restore();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.strokeStyle = '#14142B'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(sx + TILT_DX * .5, -20); ctx.lineTo(sx - TILT_DX * .5, H0 + 20); ctx.stroke();
        ctx.strokeStyle = '#FFD23F'; ctx.lineWidth = 5; ctx.stroke();
        ctx.fillStyle = '#FFD23F'; ctx.strokeStyle = '#14142B'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(sx - TILT_DX * .08, 640, 34, 0, 6.283); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#14142B'; ctx.font = '400 30px "Geist Mono"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⇆', sx - TILT_DX * .08, 642);
        return null;
      }
      const lab = drawEye(ctx, f);
      // 瞳孔张开（深蓝圆形开孔，带金色描边）
      if (f >= TL.iris) {
        const c = cam(f), u = EinOut(cl((f - TL.iris) / TL.irisDur));
        const px = c.cx + c.S * E.IR[0], py = c.cy + c.S * (E.IR[1] + 15);
        const R = lerp(80 * c.S, 1500, u);
        ctx.fillStyle = '#121A4E'; ctx.beginPath(); ctx.arc(lerp(px, 960, u), lerp(py, 540, u), R, 0, Math.PI * 2); ctx.fill();
      }
      return lab;
    }
    ctx.fillStyle = '#121A4E'; ctx.fillRect(0, 0, W0, H0);
    speed(ctx, f);
    return null;
  }

  // ——— 字（DOM）———
  const $ = id => document.getElementById(id);
  function ui(f, lab) {
    // 钩子：第 0 帧就在，54 帧往上弹走
    const out = spr(f, TL.hookOut, SNAP);
    $('hook').style.transform = `translateY(${-out * 260}px)`; $('hook').style.opacity = 1 - cl((f - TL.hookOut - 10) / 8);
    $('hook2').style.transform = `translateY(${-out * 260}px)`; $('hook2').style.opacity = 1 - cl((f - TL.hookOut - 10) / 8);
    // 层名：POP 弹出，跟着片子走
    for (let i = 0; i < 5; i++) {
      const e = $('l' + i), k = spr(f, TL.label + i * TL.popStep, POP) * (1 - spr(f, TL.slam[4 - i] - 4, SNAP));
      const L = lab && lab.find(q => q.i === i);
      if (!L || k < .01) { e.style.opacity = 0; continue; }
      e.style.opacity = 1; e.style.transform = `translate(${L.x + 26}px, ${L.y - 34}px) scale(${k})`;
    }
    // 一拍二读数
    const bk = spr(f, TL.blink - 4, POP) * (1 - spr(f, TL.iris, SNAP));
    $('blink').style.transform = `scale(${bk})`; $('blink').style.opacity = bk > .01 ? 1 : 0;
    $('blinkN').textContent = Math.min(7, Math.max(1, Math.floor((f - TL.blink) / 4) + 1));
    // 标题：逐字弹出 + 节拍呼吸
    const pulse = f >= TL.title ? 1 + .035 * Math.exp(-((f - TL.title) % TL.beat) / 6) : 1;
    ['t0', 't1', 't2'].forEach((id, i) => { const k = spr(f, TL.title + i * TL.titleStep, POP); $(id).style.transform = `translateY(${(1 - k) * 120}px) scale(${k * pulse}) rotate(${(1 - k) * (i % 2 ? 12 : -12)}deg)`; $(id).style.opacity = k > .01 ? 1 : 0; });
    const S = '一张画 = 5 张赛璐璐片 · 一拍二 · 冲击帧', n = Math.floor(Math.max(0, f - TL.sub) / 2.4);
    $('sub').textContent = S.slice(0, n); $('sub').style.opacity = n > 0 ? 1 : 0;
    $('sub').style.transform = `translateX(-50%) scale(${spr(f, TL.sub, POP)})`;
    const ck = spr(f, TL.credit, POP); $('credit').style.transform = `scale(${ck})`; $('credit').style.opacity = ck > .01 ? 1 : 0;
  }

  // ——— 逐帧：5 个子帧运动模糊 ———
  const cv = $('c'), ctx = cv.getContext('2d');
  const off = document.createElement('canvas'); off.width = W0; off.height = H0; const octx = off.getContext('2d');
  window.frame = async fr => {
    const SUB = 5, SH = .5;
    let lab = null;
    for (let k = 0; k < SUB; k++) {
      const fs = fr + (k / (SUB - 1) - .5) * SH;
      const l = drawWorld(octx, fs); if (k === SUB - 1) lab = l;
      ctx.globalAlpha = 1 / (k + 1); ctx.drawImage(off, 0, 0);
    }
    ctx.globalAlpha = 1;
    ui(fr, lab);
  };
  Promise.all([document.fonts.load('400 100px "ZCOOL QingKe HuangYou"', '赛璐璐左边'), document.fonts.load('400 20px "Geist Mono"', 'A一')])
    .then(() => document.fonts.ready).then(async () => { await window.frame(0); window.ready = true; });
})();
