// 后半段的场景（屏幕坐标）：高腰字、海报、网页、门票、封面；以及它们之间的转场。
const MON = (() => {
  const E = ENG, P = E.PAL, I = E.IMG, T = TL;

  // —— 预模糊的贴图（移焦用）：先缩小再模糊，便宜 ——————————————————————————————
  const BLUR = {};
  function prep() {
    for (const [name, levels] of [['web', [3, 8, 16]], ['phone', [4, 12, 24]]]) {
      const im = I[name], k = .25, w = Math.round(im.width * k), h = Math.round(im.height * k);
      BLUR[name] = levels.map(b => { const c = document.createElement('canvas'); c.width = w + 4 * b; c.height = h + 4 * b; const x = c.getContext('2d');
        x.filter = `blur(${b * k * 2}px)`; x.drawImage(im, 2 * b, 2 * b, w, h); return { c, pad: 2 * b / k }; });
    }
  }
  // 画一张图，blur 在 0..3 之间连续：在相邻两级之间交叉淡入
  function blurred(ctx, name, x, y, w, h, b) {
    if (b <= .02) { ctx.drawImage(I[name], x, y, w, h); return; }
    const L = BLUR[name], lo = Math.min(2, Math.floor(b)), t = E.clamp(b - lo);
    const draw = (lv, a) => { if (a <= 0) return; ctx.globalAlpha *= a; if (lv < 0) ctx.drawImage(I[name], x, y, w, h);
      else { const B = L[lv], sx = w / I[name].width, pad = B.pad * sx; ctx.drawImage(B.c, x - pad, y - pad * (h / w) / (I[name].height / I[name].width), w + 2 * pad, h + 2 * pad * (h / w) / (I[name].height / I[name].width)); } ctx.globalAlpha /= a; };
    const ga = ctx.globalAlpha;
    draw(lo - 1, 1); ctx.globalAlpha = ga * t; draw(lo, 1); ctx.globalAlpha = ga;
  }

  // —— 高腰字 ————————————————————————————————————————————————————————
  const U = 44;
  let WS = null, WX = 0, WY = 0;
  function initLetters() {
    const tmp = E.wordStrokes('SECESSION', 0, 0, U);
    WX = 960 - tmp.w / 2; WY = 540 - 3.5 * U - 60;
    WS = E.wordStrokes('SECESSION', WX, WY, U);
    WS.strokes.forEach((s, i) => { s.t0 = T.whip - 6 + i * 4.2; s.dur = 16; SC.ev(Math.max(s.t0, T.whip + 4), 'stroke', .45); });
    SC.ev(T.hit2, 'dots', .8);
  }
  function letters(ctx, f, o = {}) {
    ctx.fillStyle = P.ink; ctx.fillRect(0, 0, 1920, 1080);
    const g = ctx.createRadialGradient(960, 420, 50, 960, 420, 900);
    g.addColorStop(0, 'rgba(120,86,30,.32)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
    const p = E.prog(f, T.whip, T.drop + 10);
    ctx.save();
    ctx.translate(960, 540); ctx.scale(1 + p * .05, 1 + p * .05); ctx.translate(-960 + 50 - p * 100, -540);
    // 三条参考线：顶、腰（2.4）、底（7）
    const gl = E.ease.o5(E.prog(f, T.whip - 8, T.whip + 14));
    [[0, '0'], [2.4, '2.4'], [7, '7']].forEach(([k, t], i) => {
      const y = WY + k * U;
      ctx.globalAlpha = .85 * gl; ctx.fillStyle = k === 2.4 ? P.gold : '#6d655a';
      ctx.fillRect(WX - 120, y - (k === 2.4 ? 1.5 : 1), (WS.w + 240) * E.ease.o5(E.prog(f, T.whip - 8 + i * 3, T.whip + 18 + i * 3)), k === 2.4 ? 3 : 2);
      ctx.globalAlpha = gl; ctx.font = '600 30px Jost'; ctx.fillStyle = k === 2.4 ? P.gold : P.grey; ctx.textAlign = 'right';
      ctx.fillText(t, WX - 136, y + 8); ctx.textAlign = 'left';
    });
    // 笔画：先是一道金光画过去，画完慢慢变成纸白
    ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
    for (const s of WS.strokes) {
      const t = E.clamp((f - s.t0) / s.dur); if (t <= 0) continue;
      const e = E.ease.io(t), cool = E.clamp((f - s.t0 - s.dur) / 18);
      ctx.globalAlpha = 1; ctx.lineWidth = U;
      ctx.strokeStyle = E.mixc('#F3D98A', P.paper, cool);
      ctx.setLineDash([s.len * e + .01, s.len * 2]); ctx.stroke(s.p);
      if (t < 1) { ctx.globalAlpha = .45 * (1 - t); ctx.lineWidth = U * 1.9; ctx.strokeStyle = '#FFE7A0'; ctx.filter = 'blur(10px)'; ctx.stroke(s.p); ctx.filter = 'none'; }
    }
    ctx.setLineDash([]);
    // 字怀里的小方点：在第二下重拍时弹出来
    for (const d of WS.dots) {
      const t = (f - T.hit2 - d.li * .6) / 14; if (t <= 0) continue;
      const sc = E.spring(t), s = d.s * sc;
      ctx.globalAlpha = 1; ctx.fillStyle = P.gold; ctx.fillRect(d.x - s / 2, d.y - s / 2, s, s);
    }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  // O 的小方点在屏幕上的位置（光圈从这里打开）
  function dotScreen(f) {
    const d = WS.dots.find(d => d.li === 7) || WS.dots[WS.dots.length - 1];
    const p = E.prog(f, T.whip, T.drop + 10), sc = 1 + p * .05;
    return [960 + (d.x + 50 - p * 100 - 960) * sc, 540 + (d.y - 540) * sc, d.s * sc];
  }

  // —— 海报 / 网页 / 门票 / 封面 ——————————————————————————————————————————————
  function stage(ctx, tone = 0) {
    ctx.fillStyle = tone ? '#1a1815' : P.ink; ctx.fillRect(0, 0, 1920, 1080);
    const g = ctx.createRadialGradient(960, 500, 80, 960, 540, 1100);
    g.addColorStop(0, 'rgba(110,80,30,.22)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
  }
  const SHD = (() => { const c = document.createElement('canvas'); c.width = c.height = 200; const x = c.getContext('2d'); x.filter = 'blur(22px)'; x.fillStyle = '#000'; x.fillRect(40, 40, 120, 120); return c; })();
  const shadow = (ctx, x, y, w, h, a = .6) => { ctx.globalAlpha = a; ctx.drawImage(SHD, x - w * .25, y - h * .15, w * 1.5, h * 1.45); ctx.globalAlpha = 1; };

  // 一张卡片绕竖轴转 ang（弧度）：竖条切片做透视
  function card(ctx, img, cx, cy, w, h, ang, o = {}) {
    const c = Math.cos(ang), s = Math.sin(ang), D = 2600, n = 48;
    if (Math.abs(c) < .002) return;
    const flip = c < 0;
    for (let i = 0; i < n; i++) {
      const u0 = i / n - .5, u1 = (i + 1) / n - .5;
      const z0 = u0 * w * s, z1 = u1 * w * s, k0 = D / (D + z0), k1 = D / (D + z1);
      const x0 = cx + u0 * w * c * k0, x1 = cx + u1 * w * c * k1;
      const sx = flip ? (1 - (i + 1) / n) : i / n;
      const hh = h * (k0 + k1) / 2;
      ctx.drawImage(img, sx * img.width, 0, img.width / n + .5, img.height, Math.min(x0, x1) - .3, cy - hh / 2, Math.abs(x1 - x0) + .6, hh);
    }
    // 转到侧面时边上反一下光
    const glint = Math.pow(1 - Math.abs(c), 3) * .5;
    if (glint > .01) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = glint; ctx.fillStyle = '#FFE7A0';
      ctx.fillRect(cx - Math.abs(w * c) / 2, cy - h / 2, Math.abs(w * c), h); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
  }

  const PS = 860;                                   // 海报在画面里的边长
  const WEBW = 1180, WEBH = WEBW * 956 / 1300;      // 网页在画面里的大小
  const CXL = 800;                                  // 蒙太奇的东西放在画面偏左，右下角留给字幕
  function poster(ctx, f) {
    stage(ctx);
    const kick = 16 * Math.exp(-Math.max(0, f - T.drop) / 5) * Math.cos(Math.max(0, f - T.drop) * .55) * (f >= T.drop ? 1 : 0);
    const p = E.prog(f, T.drop, T.flip), sc = 1.04 - p * .04;
    const w = PS * sc, x = CXL - w / 2, y = 540 - w / 2 + kick;
    shadow(ctx, x, y + 20, w, w);
    ctx.drawImage(I.poster, x, y, w, w);
  }
  // 翻卡：海报转过去，背面是网页
  function flipCard(ctx, f) {
    stage(ctx);
    const t = E.ease.io(E.prog(f, T.flip, T.flip + 30)), ang = t * Math.PI;
    const w = E.lerp(PS, WEBW, t), h = E.lerp(PS, WEBH, t);
    shadow(ctx, CXL - w / 2 * Math.abs(Math.cos(ang)), 540 - h / 2 + 20, w * Math.abs(Math.cos(ang)), h, .5);
    if (ang < Math.PI / 2) card(ctx, I.poster, CXL, 540, w, h, ang);
    else card(ctx, I.web, CXL, 540, w, h, ang - Math.PI);
    // 8 列方格：翻完以后在网页上画出来
    const g = E.prog(f, T.flip + 32, T.flip + 52), gout = 1 - E.prog(f, T.dolly - 10, T.dolly);
    if (g > 0) {
      const sx = WEBW / 1300, x0 = CXL - WEBW / 2 + 64 * sx, cw = (1172 + 16) / 8 * sx, y0 = 540 - WEBH / 2 + 54 * sx;
      for (let i = 0; i < 8; i++) {
        const a = E.ease.o5(E.clamp(g * 8 - i * .6));
        ctx.globalAlpha = .16 * a * gout; ctx.fillStyle = P.gold;
        ctx.fillRect(x0 + i * cw, y0, cw - 16 * sx, (WEBH - 54 * sx) * a);
      }
      ctx.globalAlpha = 1;
    }
  }
  // 希区柯克变焦：按钮在画面里大小不变，背后的网页往后退；然后按下去，变金
  const BTN = GEOM.web.btn;
  function dolly(ctx, f) {
    stage(ctx);
    const t = E.ease.io(E.prog(f, T.dolly, T.rack)), s0 = WEBW / 1300;
    // 按钮中心固定在画面中心偏左，网页围绕它缩小
    const bx = BTN[0] + BTN[2] / 2, by = BTN[1] + BTN[3] / 2;
    const start = [CXL - WEBW / 2 + bx * s0, 540 - WEBH / 2 + by * s0];
    const anchor = [E.lerp(start[0], 700, E.ease.io(E.prog(f, T.dolly, T.dolly + 20))), E.lerp(start[1], 560, E.ease.io(E.prog(f, T.dolly, T.dolly + 20)))];
    const sPage = s0 * E.lerp(1, .7, t), sBtn = s0 * E.lerp(1, 2.1, E.ease.io(E.prog(f, T.dolly, T.dolly + 20)));
    const pw = 1300 * sPage, ph = 956 * sPage, px = anchor[0] - bx * sPage, py = anchor[1] - by * sPage;
    shadow(ctx, px, py + 18, pw, ph, .5);
    ctx.globalAlpha = 1; blurred(ctx, 'web', px, py, pw, ph, t * 1.6);
    ctx.fillStyle = `rgba(10,9,8,${.35 * t})`; ctx.fillRect(px, py, pw, ph);
    // 按钮（从网页里裁出来，单独放大）
    const press = f - T.press, pr = press > 0 ? 1 - .07 * Math.exp(-press / 4) * Math.cos(press * .6) : 1;
    const bw = BTN[2] * sBtn * pr, bh = BTN[3] * sBtn * pr, x = anchor[0] - bw / 2, y = anchor[1] - bh / 2;
    const k = I.web.width / 1300;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
    ctx.drawImage(I.web, BTN[0] * k, BTN[1] * k, BTN[2] * k, BTN[3] * k, x, y, bw, bh); ctx.restore();
    if (press > 0) {
      // 金箔一张张铺满按钮
      const n = 6, tw = bw / n;
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, bw, bh); ctx.clip();
      for (let i = 0; i < n; i++) for (let j = 0; j < 2; j++) {
        const a = E.clamp((press - (i + j) * 1.4) / 6); if (a <= 0) continue;
        E.leaf(ctx, i * 2 + j, x + (i + .5) * tw, y + (j + .5) * bh / 2, Math.max(tw, bh / 2) * 1.02 * E.ease.o3(a), 0, 0, 0, { glint: Math.exp(-press / 10) * .6 });
      }
      ctx.restore();
      ctx.font = `600 ${Math.round(17 * sBtn * pr)}px Jost`; ctx.letterSpacing = `${3.5 * sBtn}px`; ctx.textAlign = 'center'; ctx.fillStyle = P.ink;
      ctx.globalAlpha = E.clamp(press / 8); ctx.fillText('BOOK A SLOT  →', anchor[0], anchor[1] + 6 * sBtn); ctx.globalAlpha = 1; ctx.textAlign = 'left'; ctx.letterSpacing = '0px';
    }
  }
  // 移焦：网页虚掉退后，门票从下面升起来、由虚变实
  function rack(ctx, f) {
    stage(ctx);
    const t = E.prog(f, T.rack, T.rack + 34), e = E.ease.io(t);
    const s0 = WEBW / 1300 * .7, bx = BTN[0] + BTN[2] / 2, by = BTN[1] + BTN[3] / 2;
    const sPage = s0 * E.lerp(1, .82, e), pw = 1300 * sPage, ph = 956 * sPage, px = 700 - bx * sPage + e * 220, py = 560 - by * sPage;
    ctx.globalAlpha = 1 - e * .35; blurred(ctx, 'web', px, py, pw, ph, 1.6 + e * 1.4); ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(10,9,8,${.35 + .2 * e})`; ctx.fillRect(px, py, pw, ph);
    const H = 980, W = H * 400 / 930, rise = E.ease.o5(E.prog(f, T.rack, T.rack + 30));
    const x = 1240 - W / 2, y = 1080 + 60 - rise * (1080 + 60 - (540 - H / 2));
    shadow(ctx, x, y + 30, W, H, .55);
    blurred(ctx, 'phone', x, y, W, H, (1 - E.ease.o3(E.prog(f, T.rack + 4, T.rack + 34))) * 2.6);
  }
  // 封面：三本方形杂志，在第 887 帧之后依次抬起
  function covers(ctx, f) {
    stage(ctx, 1);
    const sz = 500, gap = 70, y = 540 - sz / 2 - 20;
    for (let n = 0; n < 3; n++) {
      const x = 960 + (n - 1) * (sz + gap) - sz / 2;
      const lift = E.spring(E.clamp((f - (T.checker + 22 + n * 7)) / 18)), dy = -14 * lift + 14;
      shadow(ctx, x, y + 26 + dy, sz, sz, .55);
      ctx.drawImage(I['cover' + n], x, y + dy, sz, sz);
    }
  }

  // —— 棋盘格翻牌：画面切成 120 的方格，按斜向波浪一格格翻过去 ——————————————————————————
  function checkerWipe(ctx, f, A, B, t0, dur = 34) {
    const C = 120, nx = 16, ny = 9;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 1920, 1080);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const d = (i + j) / (nx + ny - 2), t = E.clamp((f - t0 - d * dur * .6) / (dur * .4)), ang = E.ease.io(t) * Math.PI;
      const c = Math.cos(ang), src = c >= 0 ? A : B, w = C * Math.abs(c);
      const x = i * C + (C - w) / 2, y = j * C;
      ctx.drawImage(src, i * C, j * C, C, C, x, y, w, C);
      if (t > 0 && t < 1) { ctx.globalAlpha = Math.pow(1 - Math.abs(c), 2) * .5; ctx.fillStyle = P.goldHi; ctx.fillRect(x, y, w, C); ctx.globalAlpha = 1; }
    }
  }

  return { prep, initLetters, letters, dotScreen, poster, flipCard, dolly, rack, covers, checkerWipe, card, stage, shadow, PS };
})();
