// 厚涂 Painterly：先搭一张“参考”（雨夜的街、路灯、红伞），再用几万笔有方向、有厚度的笔触把它重画一遍。
// 笔触顺着形状走（结构张量），湿地面一律竖着拖；每一笔同时画在颜色层和“厚度”层，最后用厚度层打一次侧光 = 油彩的起伏。
var PAINT_BRISTLE = { v: .22, a: .55 };
const PAINT = (() => {
  const { rng, makeNoise, fbm, clamp, lerp, smooth, mix, css, canvas } = HD;
  const W = 1920, H = 1080, HOR = 548, VPX = 1010, F = 880, CAMH = 1.7;
  const proj = (X, Y, Z) => [VPX + X * F / Z, HOR - (Y - CAMH) * F / Z];

  // ───────── 参考图：电影里的一帧 ─────────
  const WALL = 7.5;
  const contact = x => HOR + CAMH * Math.abs(x - VPX) / WALL; // 墙脚线（墙和地面的交线）
  function person(gg, x0, y0, sc, mirror, lit = true) {
    gg.save(); gg.translate(x0, y0); gg.scale(sc, mirror ? -sc * .85 : sc);
    const coat = '#141f26', dark = '#0b1216';
    // 腿：左腿撑地，右腿抬起脚跟
    gg.fillStyle = dark;
    gg.beginPath(); gg.moveTo(-30, -128); gg.lineTo(-27, -40); gg.lineTo(-24, -4); gg.lineTo(-8, -2); gg.lineTo(-10, -44); gg.lineTo(-6, -128); gg.fill();
    gg.beginPath(); gg.moveTo(4, -128); gg.lineTo(14, -60); gg.lineTo(20, -22); gg.lineTo(34, -30); gg.lineTo(30, -64); gg.lineTo(26, -128); gg.fill();
    // 风衣：肩宽、下摆张开
    gg.fillStyle = coat; gg.beginPath();
    gg.moveTo(-14, -262); gg.quadraticCurveTo(-44, -258, -50, -236); gg.quadraticCurveTo(-58, -190, -60, -130); gg.lineTo(-56, -112);
    gg.quadraticCurveTo(-6, -102, 52, -114); gg.lineTo(54, -132); gg.quadraticCurveTo(52, -192, 46, -236); gg.quadraticCurveTo(40, -258, 14, -262); gg.closePath(); gg.fill();
    // 左臂垂着，右臂抬到胸口握伞
    gg.beginPath(); gg.moveTo(-50, -236); gg.quadraticCurveTo(-66, -190, -62, -150); gg.lineTo(-50, -150); gg.quadraticCurveTo(-52, -190, -40, -222); gg.fill();
    // 头 + 领子
    gg.fillStyle = dark; gg.beginPath(); gg.ellipse(0, -282, 19, 23, 0, 0, 7); gg.fill();
    gg.fillStyle = coat; gg.beginPath(); gg.moveTo(-18, -268); gg.lineTo(0, -252); gg.lineTo(18, -268); gg.lineTo(14, -246); gg.lineTo(-14, -246); gg.fill();
    // 伞：稍微往左歪
    gg.save(); gg.translate(8, -318); gg.rotate(-.1);
    gg.strokeStyle = '#0f1518'; gg.lineWidth = 4; gg.beginPath(); gg.moveTo(4, 120); gg.lineTo(0, -48); gg.stroke();
    const canopy = () => { gg.beginPath(); gg.moveTo(-132, 8); gg.bezierCurveTo(-116, -44, -60, -62, 0, -64); gg.bezierCurveTo(60, -62, 116, -44, 132, 8); for (let k = 0; k < 8; k++) { const x0 = 132 - k * 33, x1 = x0 - 33; gg.quadraticCurveTo((x0 + x1) / 2, -4, x1, 8); } gg.closePath(); };
    canopy(); gg.fillStyle = '#b8231f'; gg.fill();
    if (lit && !mirror) {
      gg.save(); canopy(); gg.clip();
      let ug = gg.createRadialGradient(10, -70, 10, 10, -60, 150); ug.addColorStop(0, 'rgba(255,150,90,.9)'); ug.addColorStop(.5, 'rgba(225,60,40,.25)'); ug.addColorStop(1, 'rgba(70,6,8,.55)');
      gg.fillStyle = ug; gg.fillRect(-140, -70, 280, 90);
      gg.strokeStyle = 'rgba(110,14,14,.8)'; gg.lineWidth = 2.2;
      for (let k = 1; k < 8; k++) { const x1 = 132 - k * 33; gg.beginPath(); gg.moveTo(0, -63); gg.quadraticCurveTo(x1 * .75, -40, x1, 6); gg.stroke(); }
      gg.restore();
      gg.strokeStyle = 'rgba(255,205,150,.95)'; gg.lineWidth = 3.2;
      gg.beginPath(); gg.moveTo(-128, 2); gg.bezierCurveTo(-114, -42, -60, -60, 0, -62); gg.bezierCurveTo(60, -60, 114, -42, 128, 2); gg.stroke();
      gg.fillStyle = 'rgba(40,4,6,.7)'; gg.beginPath(); gg.moveTo(-132, 8); for (let k = 0; k < 8; k++) { const x0 = -132 + k * 33, x1 = x0 + 33; gg.quadraticCurveTo((x0 + x1) / 2, -4, x1, 8); } gg.quadraticCurveTo(0, 22, -132, 8); gg.fill();
    }
    gg.restore();
    if (lit && !mirror) {
      // 逆光：远处街口的暖光从人背后打过来，轮廓亮一圈
      gg.strokeStyle = 'rgba(255,190,130,.8)'; gg.lineWidth = 2.6;
      gg.beginPath(); gg.moveTo(-50, -236); gg.quadraticCurveTo(-58, -190, -60, -130); gg.stroke();
      gg.beginPath(); gg.moveTo(46, -236); gg.quadraticCurveTo(52, -192, 54, -132); gg.stroke();
      gg.beginPath(); gg.moveTo(-18, -296); gg.quadraticCurveTo(0, -308, 18, -296); gg.stroke();
      gg.lineWidth = 1.8; gg.beginPath(); gg.moveTo(-30, -126); gg.lineTo(-25, -6); gg.moveTo(30, -126); gg.lineTo(33, -32); gg.stroke();
    }
    gg.restore();
  }
  function ref(S, o = {}) {
    const c = canvas(W * S, H * S), g = c.getContext('2d'); g.scale(S, S);
    const U = canvas(W * S, H * S), u = U.getContext('2d'); u.scale(S, S);
    const r = rng(8), n = makeNoise(4);
    // 天：青黑，地平线附近被城市的光烘成暖橙
    let gr = u.createLinearGradient(0, 0, 0, HOR + 40);
    gr.addColorStop(0, '#06141c'); gr.addColorStop(.5, '#0e3442'); gr.addColorStop(.85, '#2f5a62'); gr.addColorStop(1, '#b07a4c');
    u.fillStyle = gr; u.fillRect(0, 0, W, H);
    let rg = u.createRadialGradient(VPX, HOR - 10, 10, VPX, HOR - 10, 560);
    rg.addColorStop(0, 'rgba(255,200,130,1)'); rg.addColorStop(.22, 'rgba(240,150,90,.55)'); rg.addColorStop(1, 'rgba(200,120,80,0)');
    u.fillStyle = rg; u.fillRect(0, 0, W, H);
    const lights = [];
    const side = (sgn, seed) => {
      const q = rng(seed); let z = 3.2;
      while (z < 170) {
        const len = 5 + q() * 8, ht = 8 + q() * 15, X = sgn * WALL;
        const P = (Y, Z) => proj(X, Y, Z);
        const fog = clamp(z / 130), near = z < 9;
        const wall = mix(mix(sgn < 0 ? '#14262e' : '#11212a', '#24363d', q() * .6), '#7a6650', fog * .85);
        const quad = (pts, col) => { u.fillStyle = css(col); u.beginPath(); pts.forEach(([x, y], i) => i ? u.lineTo(x, y) : u.moveTo(x, y)); u.fill(); };
        quad([P(0, z), P(ht, z), P(ht, z + len), P(0, z + len)], near ? mix(wall, '#05090c', .5) : wall);
        // 楼与楼之间的竖缝
        u.strokeStyle = 'rgba(0,0,0,.45)'; u.lineWidth = Math.max(1, 12 / z); u.beginPath(); u.moveTo(...P(0, z)); u.lineTo(...P(ht, z)); u.stroke();
        for (let fy = 3.4; fy < ht - 1; fy += 2.5) for (let fz = z + .7; fz < z + len - 1.2; fz += 2.0) {
          const lit = q() < (near ? .22 : .42), warm = q() < .78;
          const col = lit ? (warm ? mix('#ffb45e', '#ffd99a', q()) : mix('#7fe0e0', '#bff4ff', q())) : mix('#0b171e', '#1e3038', q());
          quad([P(fy, fz), P(fy + 1.3, fz), P(fy + 1.3, fz + 1.05), P(fy, fz + 1.05)], mix(col, '#8a7a62', fog * .65));
          if (lit && fz < 70) lights.push({ X, Y: fy + .65, Z: fz + .5, col, w: .9, k: .5 });
        }
        if (q() < .8) {
          const col = [mix('#ffb060', '#ffd38a', q()), mix('#ff4d5e', '#ff7a6a', q()), mix('#36d8c8', '#8ff0e0', q())][q() < .5 ? 0 : q() < .5 ? 1 : 2];
          const dim = near ? .55 : 1;
          quad([P(.3, z + .5), P(2.7, z + .5), P(2.7, z + len - .5), P(.3, z + len - .5)], mix(mix('#0b1418', col, dim), '#9a8466', fog * .5));
          // 雨棚
          quad([P(2.7, z + .3), P(3.1, z + .3), proj(X - sgn * 1.3, 2.75, z + .3), proj(X - sgn * 1.3, 2.75, z + len - .3), P(3.1, z + len - .3), P(2.7, z + len - .3)], mix('#0e1a1f', '#6a5a48', fog));
          if (!near) lights.push({ X, Y: 1.4, Z: z + len / 2, col, w: len * .5, k: .8 });
          if (q() < .75 && z < 100 && !near) {
            const sz = z + 1 + q() * (len - 2), sx = X - sgn * 1.5, sc = [mix('#ff3d55', '#ff8a6a', q()), mix('#3fe8d8', '#9ff', q()), mix('#ffd05a', '#fff0a0', q())][Math.floor(q() * 3)];
            quad([proj(X, 3.6, sz), proj(sx, 3.6, sz), proj(sx, 8.2, sz), proj(X, 8.2, sz)], mix(sc, '#a08868', fog * .4));
            lights.push({ X: (X + sx) / 2, Y: 5.9, Z: sz, col: sc, w: 1.4, k: 1.1, sign: true });
          }
        }
        z += len + q() * 1.2;
      }
    };
    side(-1, 3); side(1, 5);
    // 近处两块竖的霓虹招牌，把上半边的暗压住
    const neon = (X0, X1, y0, y1, z, col, glyphs) => {
      const q = [proj(X0, y0, z), proj(X1, y0, z), proj(X1, y1, z), proj(X0, y1, z)];
      u.fillStyle = '#1a0c10'; u.beginPath(); q.forEach(([x, y], i) => i ? u.lineTo(x, y) : u.moveTo(x, y)); u.fill();
      const [xa, ya] = proj(X0 + (X1 - X0) * .15, y1 - .4, z), [xb, yb] = proj(X1 - (X1 - X0) * .15, y0 + .4, z);
      u.fillStyle = css(col); u.fillRect(Math.min(xa, xb), ya, Math.abs(xb - xa), yb - ya);
      u.fillStyle = 'rgba(30,6,10,.85)';
      const n2 = glyphs, hh = (yb - ya) / n2;
      for (let k = 0; k < n2; k++) { const cy = ya + hh * (k + .5), cw = Math.abs(xb - xa) * .56, cx = (xa + xb) / 2; u.fillRect(cx - cw / 2, cy - hh * .05, cw, hh * .1); u.fillRect(cx - hh * .05, cy - hh * .32, hh * .1, hh * .64); u.fillRect(cx - cw / 2, cy + hh * .22, cw, hh * .08); }
      lights.push({ X: (X0 + X1) / 2, Y: (y0 + y1) / 2, Z: z, col, w: 3, k: 1.3, sign: true });
    };
    neon(-7.5, -5.7, 3.8, 11.5, 7.2, [255, 70, 90], 4);
    neon(7.5, 6.0, 4.2, 10.5, 10.5, [70, 235, 215], 3);
    for (let z = 8; z < 150; z += 12) {
      const [xb, yb] = proj(5.2, 0, z), [xt, yt] = proj(5.2, 6.2, z), [xh, yh] = proj(4.1, 6.2, z), s = F / z;
      u.strokeStyle = 'rgba(14,22,26,.95)'; u.lineWidth = Math.max(1, .15 * s);
      u.beginPath(); u.moveTo(xb, yb); u.lineTo(xt, yt); u.quadraticCurveTo(xt, yt - .35 * s, xh, yh); u.stroke();
      lights.push({ X: 4.1, Y: 6.1, Z: z, col: [255, 196, 120], w: .6, k: 1.5, lamp: true });
    }
    u.globalCompositeOperation = 'lighter';
    for (const L of lights) {
      const [x, y] = proj(L.X, L.Y, L.Z), s = F / L.Z, R = (L.lamp ? 3.2 : L.sign ? 2.2 : 1.2) * s * (L.w ** .3) * L.k;
      const fog = clamp(L.Z / 130);
      const rg2 = u.createRadialGradient(x, y, 0, x, y, R);
      rg2.addColorStop(0, css(L.col, (L.lamp ? .95 : .3) * (1 - fog * .5))); rg2.addColorStop(.22, css(L.col, (L.lamp ? .35 : .1))); rg2.addColorStop(1, css(L.col, 0));
      u.fillStyle = rg2; u.beginPath(); u.arc(x, y, R, 0, 7); u.fill();
      if (L.lamp) { u.fillStyle = 'rgba(255,245,220,1)'; u.beginPath(); u.ellipse(x, y, .26 * s, .11 * s, 0, 0, 7); u.fill(); }
    }
    u.globalCompositeOperation = 'source-over';
    gr = u.createLinearGradient(0, HOR - 280, 0, HOR + 60);
    gr.addColorStop(0, 'rgba(150,130,110,0)'); gr.addColorStop(.8, 'rgba(200,150,105,.22)'); gr.addColorStop(1, 'rgba(150,120,95,.05)');
    u.fillStyle = gr; u.fillRect(0, HOR - 280, W, 340);
    g.drawImage(U, 0, 0, W, H);
    // 地面：墙脚线以下
    const groundPath = gg => { gg.beginPath(); gg.moveTo(0, contact(0)); gg.lineTo(VPX, HOR); gg.lineTo(W, contact(W)); gg.lineTo(W, H); gg.lineTo(0, H); gg.closePath(); };
    gr = g.createLinearGradient(0, HOR, 0, H); gr.addColorStop(0, '#4a3c34'); gr.addColorStop(.12, '#1c2830'); gr.addColorStop(1, '#091318');
    g.fillStyle = gr; groundPath(g); g.fill();
    // 倒影：每一列以墙脚线为镜子翻过去，再往下拖成一道道
    const Rf = canvas(W * S, H * S), rf = Rf.getContext('2d');
    for (let x = 0; x < W * S; x += 2) {
      const X = x / S, y0 = contact(X) * S;
      rf.save(); rf.translate(0, 2 * y0); rf.scale(1, -1); rf.drawImage(U, x, 0, 2, y0, x, 0, 2, y0); rf.restore();
    }
    const Sm = canvas(W * S, H * S), sm = Sm.getContext('2d');
    sm.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 16; k++) { sm.globalAlpha = 1 / 16; sm.drawImage(Rf, (k % 3 - 1) * S, k * k * .45 * S); }
    sm.globalCompositeOperation = 'destination-in'; sm.globalAlpha = 1; sm.setTransform(S, 0, 0, S, 0, 0); groundPath(sm); sm.fillStyle = '#fff'; sm.fill();
    // 水洼：倒影在水洼里最清楚，柏油上淡
    const Pm = canvas(W, H), pm = Pm.getContext('2d'), pim = pm.createImageData(W, H);
    for (let y = HOR; y < H; y++) for (let x = 0; x < W; x++) {
      const z = CAMH * F / Math.max(1, y - HOR), wx = (x - VPX) * z / F;
      const pud = smooth(-.1, .25, fbm(n, wx * .18, z * .1, 3));
      const k = (y * W + x) * 4; pim.data[k] = pim.data[k + 1] = pim.data[k + 2] = 255; pim.data[k + 3] = 255 * (.45 + .55 * pud);
    }
    pm.putImageData(pim, 0, 0);
    sm.globalCompositeOperation = 'destination-in'; sm.setTransform(1, 0, 0, 1, 0, 0); sm.drawImage(Pm, 0, 0, W * S, H * S);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = .85; g.globalCompositeOperation = 'screen'; g.drawImage(Sm, 0, 0); g.restore();
    // 路灯在地上的长光
    g.globalCompositeOperation = 'lighter';
    for (const L of lights) {
      if (!L.lamp && !L.sign || L.Z > 110) continue;
      const [x, y0] = proj(L.X, 0, L.Z), [, ym] = proj(L.X, -L.Y, L.Z), s = F / L.Z, len = (ym - y0) * 1.8, wd = Math.max(1.5, .22 * s);
      const lg = g.createLinearGradient(0, y0, 0, y0 + len), a = (L.lamp ? .5 : .3) * (1 - clamp(L.Z / 110));
      lg.addColorStop(0, css(L.col, 0)); lg.addColorStop(.4, css(L.col, a)); lg.addColorStop(1, css(L.col, 0));
      g.fillStyle = lg; g.fillRect(x - wd, y0, wd * 2, len);
    }
    // 人：撑红伞往灯里走
    const fx = 880, fy = 878, fs = 1.06;
    const M = canvas(W * S, H * S), mg = M.getContext('2d'); mg.scale(S, S); person(mg, fx, fy, fs, true, false);
    g.globalCompositeOperation = 'source-over';
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = .6; g.filter = `blur(${2.5 * S}px)`; g.drawImage(M, 0, 4 * S); g.restore();
    g.globalCompositeOperation = 'lighter';
    let lg = g.createLinearGradient(0, fy + 250, 0, fy + 330); lg.addColorStop(0, 'rgba(190,30,25,.0)'); lg.addColorStop(.3, 'rgba(190,30,25,.45)'); lg.addColorStop(1, 'rgba(190,30,25,0)');
    g.fillStyle = lg; g.fillRect(fx - 130, fy + 230, 280, 120);
    g.globalCompositeOperation = 'source-over';
    person(g, fx, fy, fs, false);
    // 雨
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < (o.norain ? 0 : 1100); i++) {
      const x = r() * W, y = r() * H, L = 14 + r() * 46, a = .04 + r() * .1;
      g.strokeStyle = `rgba(200,225,235,${a})`; g.lineWidth = .8 + r() * 1.3; g.beginPath(); g.moveTo(x, y); g.lineTo(x - L * .16, y + L); g.stroke();
    }
    for (let i = 0; i < (o.norain ? 0 : 380); i++) {
      const y = HOR + 30 + Math.pow(r(), .7) * (H - HOR - 30), x = r() * W, s2 = (y - HOR) / (H - HOR);
      g.strokeStyle = `rgba(255,215,170,${.06 + r() * .14})`; g.lineWidth = 1; g.beginPath(); g.ellipse(x, y, 3 + s2 * 12, 1 + s2 * 3, 0, 0, 7); g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
    rg = g.createRadialGradient(VPX, 600, 280, VPX, 600, 1250);
    rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,6,10,.62)'); g.fillStyle = rg; g.fillRect(0, 0, W, H);
    return c;
  }

  // ───────── 笔触方向：结构张量（顺着边走）+ 区域的默认方向 ─────────
  function flow(refC, fo = {}) {
    const w = 480, h = 270, c = canvas(w, h), g = c.getContext('2d');
    g.drawImage(refC, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data, Lm = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) Lm[i] = (d[i * 4] * .3 + d[i * 4 + 1] * .59 + d[i * 4 + 2] * .11) / 255;
    let Jxx = new Float32Array(w * h), Jxy = new Float32Array(w * h), Jyy = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx = (Lm[i - w + 1] + 2 * Lm[i + 1] + Lm[i + w + 1] - Lm[i - w - 1] - 2 * Lm[i - 1] - Lm[i + w - 1]);
      const gy = (Lm[i + w - 1] + 2 * Lm[i + w] + Lm[i + w + 1] - Lm[i - w - 1] - 2 * Lm[i - w] - Lm[i - w + 1]);
      Jxx[i] = gx * gx; Jxy[i] = gx * gy; Jyy[i] = gy * gy;
    }
    const blur = (A, rad) => { const T = new Float32Array(A.length); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0, n = 0; for (let k = -rad; k <= rad; k++) { const xx = x + k; if (xx >= 0 && xx < w) { s += A[y * w + xx]; n++; } } T[y * w + x] = s / n; } for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0, n = 0; for (let k = -rad; k <= rad; k++) { const yy = y + k; if (yy >= 0 && yy < h) { s += T[yy * w + x]; n++; } } A[y * w + x] = s / n; } };
    blur(Jxx, 4); blur(Jxy, 4); blur(Jyy, 4);
    const nz = makeNoise(17), ang = new Float32Array(w * h), coh = new Float32Array(w * h), mag = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, a = Jxx[i], b = Jxy[i], c2 = Jyy[i];
      const tr = a + c2, det = Math.sqrt((a - c2) ** 2 + 4 * b * b);
      const l1 = (tr + det) / 2, l2 = (tr - det) / 2;
      const C = tr > 1e-6 ? (l1 - l2) / (l1 + l2 + 1e-6) : 0;
      let th = .5 * Math.atan2(2 * b, a - c2) + Math.PI / 2; // 顺着边
      const X = x * 4, Y = y * 4;
      // 默认方向：天 = 横着、带一点卷；地 = 竖着拖（湿地倒影）；楼 = 竖
      let def = fo.def ? fo.def(X, Y, nz) : null;
      if (def !== null) {}
      else if (Y < HOR - 30) def = fbm(nz, X * .0015, Y * .002, 3) * .55 + (X < VPX ? .18 : -.18) * smooth(HOR - 300, HOR, Y);
      else if (Y > HOR + 12) def = Math.PI / 2 + (X - VPX) * .00012;
      else def = 0;
      const wgt = smooth(.25, .7, C) * smooth(.002, .02, tr) * (fo.edge ? fo.edge(X, Y) : (Y > HOR + 12 ? .35 : 1));
      // 角度按倍角混合（方向没有正负）
      const vx = lerp(Math.cos(2 * def), Math.cos(2 * th), wgt), vy = lerp(Math.sin(2 * def), Math.sin(2 * th), wgt);
      ang[i] = .5 * Math.atan2(vy, vx); coh[i] = C; mag[i] = Math.sqrt(tr);
    }
    return { w, h, ang, coh, mag, at(X, Y) { const x = clamp(Math.round(X / 4), 0, w - 1), y = clamp(Math.round(Y / 4), 0, h - 1); return y * w + x; } };
  }

  // ───────── 画：粗 → 细，每一笔两份（颜色 + 厚度） ─────────
  const PASSES = [
    { R: 22, step: 16, len: 10, thr: 60, p: 1 },
    { R: 11, step: 8.5, len: 11, thr: 34, p: .95, detail: .012 },
    { R: 5.5, step: 4.6, len: 9, thr: 22, p: 1, detail: .045, focus: .3 },
    { R: 2.8, step: 2.8, len: 7, thr: 16, p: 1, detail: .12, focus: -.15 },
  ];
  // 算出全部笔触（不画）：{ path, R, col, pass, imp, seed }
  function plan(refC, fl, opt = {}) {
    const { seed = 3 } = opt, S = refC.width / W;
    const rd = refC.getContext('2d').getImageData(0, 0, refC.width, refC.height).data, RW = refC.width;
    const px = (X, Y) => { const x = clamp(Math.round(X * S), 0, RW - 1), y = clamp(Math.round(Y * S), 0, refC.height - 1), k = (y * RW + x) * 4; return [rd[k], rd[k + 1], rd[k + 2], rd[k + 3]]; };
    const r = rng(seed), list = [], passes = opt.passes || PASSES, jv = opt.jv ?? .14, jw = opt.jw ?? 14;
    passes.slice(0, opt.maxPass ?? passes.length).forEach((P, pi) => {
      const pts = [];
      for (let y = 0; y < H; y += P.step) for (let x = 0; x < W; x += P.step) pts.push([x + (r() - .5) * P.step, y + (r() - .5) * P.step]);
      for (let i = pts.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pts[i], pts[j]] = [pts[j], pts[i]]; }
      for (const [x0, y0] of pts) {
        if (r() > P.p) continue;
        const k0 = fl.at(x0, y0);
        if (P.detail && fl.mag[k0] < P.detail * (.6 + r() * .8)) continue;
        if (P.focus !== undefined) { const f = Math.exp(-(((x0 - (opt.fx ?? 900)) / 1.4) ** 2 + (y0 - (opt.fy ?? 600)) ** 2) / (2 * 260 ** 2)); if (r() > P.focus + f * 1.1) continue; }
        const c0 = px(x0, y0);
        if (c0[3] < 140) continue;
        const path = [[x0, y0]];
        let x = x0, y = y0, dx = 0, dy = 0;
        for (let s2 = 0; s2 < P.len; s2++) {
          const a = fl.ang[fl.at(x, y)];
          let ux = Math.cos(a), uy = Math.sin(a);
          if (s2 && ux * dx + uy * dy < 0) { ux = -ux; uy = -uy; }
          dx = ux; dy = uy; x += ux * P.R * .9; y += uy * P.R * .9;
          const c = px(x, y);
          if ((Math.abs(c[0] - c0[0]) + Math.abs(c[1] - c0[1]) + Math.abs(c[2] - c0[2]) > P.thr * 3 || c[3] < 140) && s2 > 0) break;
          path.push([x, y]);
          if (s2 >= 2 && r() < .07) break;
        }
        const v = 1 + (r() - .5) * jv, wt = (r() - .5) * jw;
        list.push({ path, R: P.R * (.8 + r() * .4), col: [clamp(c0[0] * v + wt, 0, 255), clamp(c0[1] * v, 0, 255), clamp(c0[2] * v - wt, 0, 255)], pass: pi, imp: 1, seed: (r() * 1e9) | 0 });
      }
    });
    // 高光
    for (let i = 0; i < (opt.hi ?? 26000); i++) {
      const x0 = r() * W, y0 = r() * H, c0 = px(x0, y0), lum = (c0[0] * .3 + c0[1] * .59 + c0[2] * .11) / 255;
      if (lum < .62 + r() * .2 || c0[3] < 140) continue;
      const a = fl.ang[fl.at(x0, y0)], L = 3 + r() * 7, R = 2 + r() * 3.2;
      list.push({ path: [[x0 - Math.cos(a) * L, y0 - Math.sin(a) * L], [x0 + Math.cos(a) * L, y0 + Math.sin(a) * L]], R, col: [Math.min(255, c0[0] * 1.12 + 14), Math.min(255, c0[1] * 1.1 + 10), Math.min(255, c0[2] * 1.05 + 4)], pass: 4, imp: 1.4, seed: (r() * 1e9) | 0 });
    }
    // 雨
    for (let i = 0; i < (opt.rain ?? 320); i++) {
      const x0 = r() * W, y0 = r() * H, c0 = px(x0, y0), L = 10 + r() * 26, lum = (c0[0] + c0[1] + c0[2]) / 765;
      if (r() > .2 + lum * 1.4) continue;
      list.push({ path: [[x0, y0], [x0 - L * .16, y0 + L]], R: .9 + r() * .9, col: [Math.min(255, c0[0] * .7 + 70), Math.min(255, c0[1] * .7 + 78), Math.min(255, c0[2] * .7 + 84)], pass: 5, imp: 1, seed: (r() * 1e9) | 0 });
    }
    return list;
  }
  // 一张空画布（颜色层 + 厚度层），可选先糊一层底色
  function surface(S, refC, o = {}) {
    const out = canvas(W * S, H * S), g = out.getContext('2d'), hc = canvas(W * S, H * S), hg = hc.getContext('2d');
    if (refC && o.under !== false) { g.filter = `blur(${(o.underBlur ?? 10) * S}px)`; g.drawImage(refC, 0, 0, W * S, H * S); g.filter = 'none'; }
    const im = hg.createImageData(hc.width, hc.height), d = im.data, per = (o.weave ?? 5) * S, amp = o.weaveAmp ?? 22;
    for (let y = 0; y < hc.height; y++) for (let x = 0; x < hc.width; x++) { const a = Math.sin(x / per * Math.PI * 2), b = Math.sin(y / per * Math.PI * 2), v = 128 + amp * (((Math.floor(x / per) + Math.floor(y / per)) & 1) ? a * a : b * b) - amp / 2; const k = (y * hc.width + x) * 4; d[k] = d[k + 1] = d[k + 2] = v; d[k + 3] = 255; }
    hg.putImageData(im, 0, 0);
    g.scale(S, S); hg.scale(S, S); g.lineCap = hg.lineCap = 'round'; g.lineJoin = hg.lineJoin = 'round';
    return { out, g, hc, hg, S };
  }
  // 画一笔（可以只画前 prog 那一段：笔正在走）
  function draw1(sf, s, prog = 1, impasto = 1) {
    let path = s.path;
    if (prog < 1) { const n = path.length; if (n < 2) { path = path; } else { const t = prog * (n - 1), i = Math.floor(t), u = t - i; path = path.slice(0, i + 1); if (i < n - 1) path.push([lerp(s.path[i][0], s.path[i + 1][0], u), lerp(s.path[i][1], s.path[i + 1][1], u)]); } }
    stroke(sf.g, sf.hg, path, s.R * (prog < 1 ? .6 + .4 * prog : 1), s.col, rng(s.seed), impasto * s.imp);
  }
  function paint(refC, fl, S, opt = {}) {
    const { light = [-.6, -.75], impasto = 1 } = opt;
    const list = plan(refC, fl, { ...opt, hi: (opt.maxPass ?? 4) < 4 ? 0 : opt.hi, rain: (opt.maxPass ?? 4) < 4 ? 0 : opt.rain });
    const sf = surface(S, refC, opt);
    for (const s of list) draw1(sf, s, 1, impasto);
    if (opt.extra) { const r = rng(99); opt.extra(sf.g, sf.hg, (path, R, col) => stroke(sf.g, sf.hg, path, R, col, r, impasto), r); }
    if (impasto > 0) relight(sf.out, sf.hc, light, impasto);
    if (opt.mask) { const g = sf.out.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-in'; g.drawImage(refC, 0, 0, W * S, H * S); g.globalCompositeOperation = 'source-over'; }
    sf.out.count = list.length;
    return sf.out;
  }
  function ribbon(path, R, taper = true) {
    const L = [], Rt = [], n = path.length;
    for (let i = 0; i < n; i++) {
      const a = path[Math.max(0, i - 1)], b = path[Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1]; const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
      const u = n > 1 ? i / (n - 1) : .5, w = R * (taper ? (.75 + .25 * Math.sin(Math.PI * Math.min(1, u * 1.2 + .1))) : 1);
      L.push([path[i][0] - ty * w, path[i][1] + tx * w]); Rt.push([path[i][0] + ty * w, path[i][1] - tx * w]);
    }
    return [L, Rt];
  }
  function stroke(g, hg, path, R, col, r, impasto) {
    if (path.length === 1) { const a = r() * 7; path = [[path[0][0] - Math.cos(a) * R * .5, path[0][1] - Math.sin(a) * R * .5], [path[0][0] + Math.cos(a) * R * .5, path[0][1] + Math.sin(a) * R * .5]]; }
    // 头尾圆一点：在两端各补半个圆
    const [L, Rt] = ribbon(path, R);
    const shape = gg => { gg.beginPath(); L.forEach(([x, y], i) => i ? gg.lineTo(x, y) : gg.moveTo(x, y)); const e = path[path.length - 1]; gg.arc(e[0], e[1], R * .92, Math.atan2(L[L.length - 1][1] - e[1], L[L.length - 1][0] - e[0]), Math.atan2(Rt[Rt.length - 1][1] - e[1], Rt[Rt.length - 1][0] - e[0]), true); for (let i = Rt.length - 1; i >= 0; i--) gg.lineTo(...Rt[i]); gg.closePath(); };
    g.fillStyle = css(col); shape(g); g.fill();
    // 刷毛：几道细线，深浅各不同
    const nb = Math.max(3, Math.min(9, Math.round(R * .7)));
    for (let k = 0; k < nb; k++) {
      const t = (k + .5) / nb * 2 - 1, v = 1 + (r() - .5) * (PAINT_BRISTLE.v);
      g.strokeStyle = css([col[0] * v, col[1] * v, col[2] * v], PAINT_BRISTLE.a); g.lineWidth = R * 2 / nb * .75;
      g.beginPath(); path.forEach(([x, y], i) => { const a = path[Math.max(0, i - 1)], b = path[Math.min(path.length - 1, i + 1)]; let tx = b[0] - a[0], ty = b[1] - a[1]; const m = Math.hypot(tx, ty) || 1; const ox = -ty / m * t * R * .85, oy = tx / m * t * R * .85; i ? g.lineTo(x + ox, y + oy) : g.moveTo(x + ox, y + oy); }); g.stroke();
    }
    if (!impasto) return;
    // 厚度：新的一笔盖住旧的；刷毛是一道道沟，边上和收笔处堆得高
    hg.fillStyle = 'rgb(128,128,128)'; shape(hg); hg.fill();
    for (let k = 0; k < nb; k++) {
      const t = (k + .5) / nb * 2 - 1, hv = 128 + (r() - .5) * 70 + Math.abs(t) * 30;
      hg.strokeStyle = `rgb(${hv},${hv},${hv})`; hg.lineWidth = R * 2 / nb * .55;
      hg.beginPath(); path.forEach(([x, y], i) => { const a = path[Math.max(0, i - 1)], b = path[Math.min(path.length - 1, i + 1)]; let tx = b[0] - a[0], ty = b[1] - a[1]; const m = Math.hypot(tx, ty) || 1; const ox = -ty / m * t * R * .85, oy = tx / m * t * R * .85; i ? hg.lineTo(x + ox, y + oy) : hg.moveTo(x + ox, y + oy); }); hg.stroke();
    }
    const e = path[path.length - 1];
    const eg = hg.createRadialGradient(e[0], e[1], 0, e[0], e[1], R);
    eg.addColorStop(0, 'rgba(200,200,200,.45)'); eg.addColorStop(1, 'rgba(128,128,128,0)');
    hg.fillStyle = eg; hg.beginPath(); hg.arc(e[0], e[1], R, 0, 7); hg.fill();
    hg.strokeStyle = 'rgba(170,170,170,.38)'; hg.lineWidth = Math.max(.8, R * .16); shape(hg); hg.stroke();
  }
  function relight(out, hc, light, amt, gs = 1) {
    const w = out.width, h = out.height, g = out.getContext('2d');
    const im = g.getImageData(0, 0, w, h), d = im.data, hd = hc.getContext('2d').getImageData(0, 0, w, h).data;
    const [lx, ly] = light, lz = .55, m = Math.hypot(lx, ly, lz);
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx = (hd[(i + 1) * 4] - hd[(i - 1) * 4]) / 255, gy = (hd[(i + w) * 4] - hd[(i - w) * 4]) / 255;
      const nx = -gx * 2.2 * gs, ny = -gy * 2.2 * gs, nz = 1, nm = Math.hypot(nx, ny, nz);
      const ndl = (nx * lx + ny * ly + nz * lz) / (nm * m), base = lz / m;
      const sh = 1 + (ndl - base) * 1.1 * amt;
      const spec = Math.pow(Math.max(0, ndl), 34) * 26 * amt;
      const k = i * 4; d[k] = d[k] * sh + spec; d[k + 1] = d[k + 1] * sh + spec; d[k + 2] = d[k + 2] * sh + spec * .9;
    }
    g.putImageData(im, 0, 0);
  }
  // 单独画几笔样笔（透明底 + 自己的厚度层）
  function samples(S, list) {
    const c = canvas(W * S, H * S), g = c.getContext('2d'), hc = canvas(W * S, H * S), hg = hc.getContext('2d');
    hg.fillStyle = '#808080'; hg.fillRect(0, 0, hc.width, hc.height);
    g.scale(S, S); hg.scale(S, S); g.lineCap = hg.lineCap = 'round'; g.lineJoin = hg.lineJoin = 'round';
    const r = rng(2); list.forEach(([path, R, col]) => stroke(g, hg, path, R, col, r, 1));
    relight(c, hc, [-.6, -.75], 1.3); return c;
  }
  return { W, H, HOR, VPX, ref, flow, paint, plan, surface, draw1, stroke, relight, samples, PASSES };
})();
