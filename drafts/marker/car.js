// 一辆概念跑车的马克笔侧视草图（原创造型）。drawCar(ctx, {x, y, s, body:[浅,中,深], bg, stage}) —— stage 0..1 是“画到哪一步”，片子里逐帧推进。
(function () {
  const { stroke, pencil, liner, ellipsePts, dense, rng } = MK;
  const R0 = 100; // 轮半径
  const WF = -345, WR = 345; // 前后轮中心 x（车头朝左）

  function bodyPts() {
    const arch = (cx) => { const o = []; for (let i = 0; i <= 18; i++) { const a = -0.36 + (Math.PI + 0.72) * i / 18; o.push([cx + 124 * Math.cos(a), -90 - 124 * Math.sin(a)]); } return o; };
    return [
      [-524, -44], [-554, -92], [-552, -146], [-526, -176], [-440, -204], [-345, -224], [-220, -238], [-140, -250],
      [-40, -308], [40, -338], [190, -348], [300, -334], [420, -294], [520, -254], [576, -238],
      [584, -222], [574, -170], [562, -92], [550, -46], [480, -44],
      ...arch(WR), ...arch(WF), [-480, -44]
    ];
  }
  function path(pts, s, x, y, close = true) {
    const P = new Path2D(); pts.forEach((p, i) => i ? P.lineTo(x + p[0] * s, y + p[1] * s) : P.moveTo(x + p[0] * s, y + p[1] * s)); if (close) P.closePath(); return P;
  }
  const T = (pts, s, x, y) => pts.map(p => [x + p[0] * s, y + p[1] * s]);

  const greenhouse = [[-128, -258], [-40, -304], [40, -330], [190, -340], [295, -326], [404, -284], [360, -266], [200, -261], [40, -259], [-128, -258]];
  const shoulder = [[-546, -152], [-345, -198], [-100, -214], [200, -216], [420, -214], [578, -204]];
  const lower = [[-500, -84], [-300, -98], [-100, -104], [120, -106], [218, -100]];
  const door = [[-124, -256], [-118, -180], [-112, -90], [-104, -54]];
  const door2 = [[175, -261], [180, -180], [190, -112], [210, -78]];

  function smoothBody(s, x, y) {
    // 车身外形做一次平滑，转角不尖
    const P = dense(bodyPts(), 6); return path(P, s, x, y);
  }

  function drawCar(ctx, o = {}) {
    const x = o.x || 0, y = o.y || 0, s = o.s || 1, st = o.stage == null ? 1 : o.stage;
    const [cL, cM, cD] = o.body || ['#ff8a4c', '#ec4f2a', '#9e2c1c'];
    const BODY = smoothBody(s, x, y); const R = rng(o.seed || 21);
    const ph = (a, b) => Math.max(0, Math.min(1, (st - a) / (b - a))); // 每一步的进度
    const W = (p) => [x + p[0] * s, y + p[1] * s];

    // 1. 结构线（蓝色铅笔）
    const p1 = ph(0, 0.12);
    if (p1 > 0) {
      pencil(ctx, [W([-760, 0]), W([780, 0])], { seed: 1, over: 0, alpha: p1, color: 'rgba(60,110,210,.55)' });
      pencil(ctx, [W([-700, -100]), W([720, -100])], { seed: 2, over: 0, alpha: p1 * .6, color: 'rgba(60,110,210,.4)', passes: 1 });
      for (const cx of [WF, WR]) {
        pencil(ctx, [W([cx, -250]), W([cx, 40])], { seed: cx + 3, alpha: p1, color: 'rgba(60,110,210,.5)' });
        pencil(ctx, T(ellipsePts(cx, -100, R0 + 4, R0 + 4, -0.4, Math.PI * 2 + 0.3, 60), s, x, y), { seed: cx + 9, over: 0, alpha: p1, color: 'rgba(60,110,210,.5)' });
      }
      pencil(ctx, T(bodyPts().slice(0, 21), s, x, y), { seed: 4, over: 0, alpha: p1 * .8, color: 'rgba(60,110,210,.45)', jit: 3 });
      pencil(ctx, [W([-640, -360]), W([680, -220])], { seed: 5, alpha: p1 * .5, color: 'rgba(60,110,210,.35)', passes: 1 });
    }

    // 2. 背景色块：大笔斜扫，躲开车身（马克笔的“底”）
    const p2 = ph(0.1, 0.3);
    if (p2 > 0 && o.bg !== false) {
      const outside = new Path2D(); outside.rect(x - 2000, y - 2000, 4000, 4000); outside.addPath(BODY);
      const clipOut = new Path2D(); clipOut.addPath(outside); // evenodd 在下面 clip 时用
      ctx.save(); ctx.beginPath(); ctx.rect(x - 2000, y - 2000, 4000, 4000); ctx.clip(); ctx.restore();
      const n = 24;
      for (let i = 0; i < n; i++) {
        const t = Math.max(0, Math.min(1, p2 * n - i)); if (t <= 0) break;
        // 斜着一笔一笔往右扫：左下 → 右上，越往后越高，像设计师垫底色的那几下
        const u = i / (n - 1); const bx = -560 + u * 1260 + (R() - .5) * 20;
        const h0 = 120 + 330 * Math.pow(Math.sin(Math.PI * (0.15 + u * 0.8)), 0.7) + (R() - .5) * 50;
        const a = [bx - 30, -10 - (R() * 30)], b = [bx + 60 + h0 * 0.3, -40 - h0];
        ctx.save(); ctx.clip(outside, 'evenodd');
        stroke(ctx, [W(a), W([(a[0] + b[0]) / 2 + 6, (a[1] + b[1]) / 2]), W(b)], { w: 62 * s, color: o.bgColor || '#2f6fe0', alpha: 0.46, seed: 300 + i, t, taper: 0.8, pool: 0.5, nib: 0.2 });
        ctx.restore();
      }
    }

    // 3. 车身铺色：浅色一遍，肩线下留一道白（高光）
    const p3 = ph(0.28, 0.48);
    if (p3 > 0) {
      const rows = []; for (let yy = -352; yy <= -30; yy += 21) rows.push(yy);
      rows.forEach((yy, i) => {
        const t = Math.max(0, Math.min(1, p3 * rows.length - i)); if (t <= 0) return;
        if (yy > -206 && yy < -180) return; // 高光带：肩线下面那一道“天光”
        const tilt = 0.06;
        stroke(ctx, [W([-600, yy + 22]), W([0, yy + 2]), W([640, yy - 16])], { w: 34 * s, color: cL, alpha: 0.78, clip: BODY, seed: 40 + i, t, taper: 0.4, nib: tilt });
      });
    }
    // 4. 第二层：肩线以下压中间色；尾部再叠一层（叠 = 深）
    const p4 = ph(0.46, 0.62);
    if (p4 > 0) {
      const rows = []; for (let yy = -168; yy <= -40; yy += 21) rows.push(yy);
      rows.forEach((yy, i) => { const t = Math.max(0, Math.min(1, p4 * rows.length * 1.4 - i)); if (t <= 0) return; stroke(ctx, [W([-560, yy + 10]), W([600, yy - 10])], { w: 30 * s, color: cM, alpha: 0.7, clip: BODY, seed: 80 + i, t, taper: 0.5 }); });
      for (let i = 0; i < 6; i++) { const t = Math.max(0, Math.min(1, p4 * 8 - i - 1)); if (t <= 0) break; stroke(ctx, [W([630, -300 + i * 36]), W([300, -190 + i * 32])], { w: 30 * s, color: cM, alpha: 0.6, clip: BODY, seed: 120 + i, t }); }
    }
    // 5. 第三层：最深的颜色只放在底边、轮拱、尾灯下——三层就够了
    const p5 = ph(0.6, 0.72);
    if (p5 > 0) {
      for (let i = 0; i < 3; i++) stroke(ctx, [W([-560, -52 - i * 15]), W([600, -56 - i * 14])], { w: 22 * s, color: cD, alpha: 0.75 * p5, clip: BODY, seed: 140 + i, taper: 0.7 });
      for (const cx of [WF, WR]) stroke(ctx, T(ellipsePts(cx, -90, 140, 140, Math.PI + 0.35, Math.PI * 2 - 0.35, 30), s, x, y), { w: 26 * s, color: cD, alpha: 0.7 * p5, clip: BODY, seed: 150 + cx, taper: 0.6 });
      stroke(ctx, [W([400, -282]), W([490, -258]), W([580, -230])], { w: 18 * s, color: cD, alpha: 0.6 * p5, clip: BODY, seed: 160 });
    }
    // 6. 玻璃：深灰斜扫，中间空出一道反光
    const p6 = ph(0.5, 0.66);
    if (p6 > 0) {
      const G = path(greenhouse, s, x, y);
      for (let i = 0; i < 16; i++) {
        const t = Math.max(0, Math.min(1, p6 * 18 - i)); if (t <= 0) break;
        if (i === 7 || i === 8 || i === 11) continue; // 反光
        const xx = -150 + i * 34;
        stroke(ctx, [W([xx - 60, -240]), W([xx + 70, -360])], { w: 40 * s, color: '#2b3039', alpha: 0.8, clip: G, seed: 200 + i, t, taper: 0.3 });
      }
      stroke(ctx, [W([-130, -266]), W([380, -274])], { w: 16 * s, color: '#15171b', alpha: 0.7 * p6, clip: G, seed: 230 });
    }
    // 7. 轮子
    const p7 = ph(0.62, 0.76);
    if (p7 > 0) {
      for (const cx of [WF, WR]) {
        const C = new Path2D(); C.arc(x + cx * s, y - 100 * s, R0 * s, 0, Math.PI * 2);
        for (let i = 0; i < 7; i++) stroke(ctx, [W([cx - 130, -170 + i * 26]), W([cx + 130, -150 + i * 26])], { w: 30 * s, color: '#1b1c20', alpha: 0.9 * p7, clip: C, seed: 250 + i + cx });
        const RIM = new Path2D(); RIM.arc(x + cx * s, y - 100 * s, 72 * s, 0, Math.PI * 2);
        for (let i = 0; i < 5; i++) stroke(ctx, [W([cx - 90, -150 + i * 30]), W([cx + 90, -140 + i * 30])], { w: 30 * s, color: i < 2 ? '#c3c8cf' : '#7d838c', alpha: 0.8 * p7, clip: RIM, seed: 270 + i + cx, taper: .2 });
        if (p7 > .5) {
          for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + 0.3; liner(ctx, [W([cx + Math.cos(a) * 14, -100 + Math.sin(a) * 14]), W([cx + Math.cos(a + .25) * 68, -100 + Math.sin(a + .25) * 68])], { w: 5 * s, color: '#24262b', seed: k }); }
          liner(ctx, T(ellipsePts(cx, -100, 72, 72, 0, Math.PI * 2, 50), s, x, y), { w: 1.8 * s });
          liner(ctx, T(ellipsePts(cx, -100, 12, 12, 0, Math.PI * 2, 20), s, x, y), { w: 2 * s });
        }
      }
    }
    // 8. 地面阴影：黑马克笔横扫两遍
    const p8 = ph(0.7, 0.8);
    if (p8 > 0) {
      for (let i = 0; i < 4; i++) { const t = Math.max(0, Math.min(1, p8 * 5 - i)); if (t <= 0) break; stroke(ctx, [W([-620 + i * 40, 4 + i * 6]), W([660 - i * 50, -2 + i * 6])], { w: 18 * s, color: '#25272c', alpha: 0.85, seed: 330 + i, t, taper: 0.8 }); }
    }
    // 9. 针管笔勾线：下面重、上面轻
    const p9 = ph(0.76, 0.92);
    if (p9 > 0) {
      const heavyFn = (p) => Math.max(0, (p[1] - (y - 140 * s)) / (140 * s));
      const out = dense(bodyPts(), 6); const n = Math.round(out.length * p9);
      liner(ctx, T(out.slice(0, n + 1), s, x, y).map(p => p), { w: 2.2 * s, heavy: 1.2, heavyFn });
      if (p9 > 0.4) { liner(ctx, T(greenhouse, s, x, y), { w: 1.8 * s }); liner(ctx, T(shoulder, s, x, y), { w: 1.4 * s, alpha: .8 }); liner(ctx, T(lower, s, x, y), { w: 1.2 * s, alpha: .7 }); liner(ctx, T(door, s, x, y), { w: 1.3 * s, alpha: .8 }); liner(ctx, T(door2, s, x, y), { w: 1.3 * s, alpha: .8 }); }
      if (p9 > 0.7) {
        liner(ctx, [W([-549, -150]), W([-500, -168]), W([-430, -182])], { w: 4 * s, color: '#15161a' }); // 前灯
        liner(ctx, [W([566, -230]), W([582, -218])], { w: 6 * s, color: '#d81e2c' }); // 尾灯
        liner(ctx, [W([-20, -236]), W([30, -234])], { w: 3 * s, alpha: .8 }); // 门把手
        liner(ctx, [W([182, -342]), W([176, -262])], { w: 3.5 * s }); // B 柱
      }
    }
    // 10. 白色高光：一笔白色铅笔 + 几个白点，整张画就“亮”了
    const p10 = ph(0.9, 1);
    if (p10 > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'source-over';
      const hl = (pts, w, a) => { ctx.globalAlpha = a * p10; ctx.strokeStyle = '#fffdf8'; ctx.lineWidth = w * s; ctx.lineCap = 'round'; ctx.beginPath(); T(dense(pts, 4), s, x, y).forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); };
      hl([[-520, -178], [-400, -204], [-200, -232]], 3, .95);
      hl([[-40, -314], [60, -340], [200, -350]], 2.5, .9);
      hl([[-480, -178], [-150, -208], [200, -212], [470, -208]], 2, .75);
      hl([[60, -268], [128, -334]], 7, .5); hl([[100, -268], [154, -322]], 3, .45);
      for (const cx of [WF, WR]) hl(ellipsePts(cx, -100, 64, 64, -2.4, -1.4, 12), 3, .8);
      ctx.fillStyle = '#ffffff'; ctx.globalAlpha = p10;
      for (const [px, py, r] of [[-524, -178, 6], [-200, -232, 4.5], [60, -342, 4], [-460, -180, 3]]) { ctx.beginPath(); ctx.arc(x + px * s, y + py * s, r * s, 0, 7); ctx.fill(); }
      ctx.restore();
    }
  }
  window.CAR = { drawCar, R0, WF, WR };
})();
