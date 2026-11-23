// 维也纳分离派 · 场景。世界坐标 = 方板坐标（方板左上角 0,0，边长 880）。
const SC = (() => {
  const E = ENG, P = E.PAL, G = GEOM, I = E.IMG, T = TL;
  const EV = [];                                   // 动作时刻（给配音用）：{f, k: 种类, v: 力度}
  const ev = (f, k, v = 1) => EV.push({ f: Math.round(f * 100) / 100, k, v });

  // —— 树冠：7×7 张金箔，裁成圆 ——————————————————————————————————————————————
  const N = G.N, R = G.R, CX = G.CX, CY = G.CROWN_Y, TS = 2 * R / N;
  const TILES = [];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = CX - R + (i + .5) * TS, y = CY - R + (j + .5) * TS, d = Math.hypot(x - CX, y - CY);
    if (d < R + TS * .45) TILES.push({ i, j, x, y, a: Math.atan2(y - CY, x - CX) * 180 / Math.PI, d, k: Math.floor(E.hash(i, j, 3) * 12) });
  }
  // 最后一击落在树冠正上方那一格；开场缺的那些按角度顺时针排，每个八分音符落一张
  const FINAL = TILES.find(t => t.i === 3 && t.j === 0);
  const SWEEP = TILES.filter(t => t !== FINAL && t.a > -172 && t.a < 40 && t.d > TS * .3).sort((a, b) => a.a - b.a);
  const LANDS = [T.firstHit, ...Array.from({ length: 18 }, (_, k) => T.tick0 + k * T.tick)];
  const MISS = SWEEP.slice(0, LANDS.length);
  const LEAVES = MISS.map((t, n) => {
    const r = E.rng(n * 31 + 7);
    const dur = n === 0 ? 52 : n === 1 ? 124 : n === 2 ? 128 : 56;
    return { tile: t, land: LANDS[n], dur, seed: n * 17 + 3, s: TS, x1: t.x, y1: t.y, x0: t.x - 40 - r() * 90, y0: t.y - 200 - r() * 160, rot0: (r() - .5) * 2.6, big: 1.4, k: t.k };
  });
  LEAVES.push({ tile: FINAL, land: T.final, dur: 46, seed: 991, s: TS, x1: FINAL.x, y1: FINAL.y, x0: FINAL.x + 160, y0: FINAL.y - 520, rot0: 1.3, big: 3.2, k: 4, final: true });
  LEAVES.forEach(l => { l.tile.leaf = l; ev(l.land, l.final ? 'final' : 'leaf', l.final ? 1 : .55 + .45 * E.hash(l.seed)); });

  const SHADOW = (() => { const c = document.createElement('canvas'); c.width = c.height = 160; const x = c.getContext('2d'); x.filter = 'blur(14px)'; x.fillStyle = '#000'; x.fillRect(40, 40, 80, 80); return c; })();

  function crown(ctx, f, opt = {}) {
    ctx.save();
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = P.bole; ctx.fillRect(CX - R, CY - R, 2 * R, 2 * R);
    for (const t of TILES) {
      const l = t.leaf;
      if (l && f < l.land) continue;
      ctx.fillStyle = '#4a2e08'; ctx.fillRect(t.x - TS / 2, t.y - TS / 2, TS, TS);
      const age = l ? f - l.land : 999;
      const sq = l ? 1 + .06 * Math.exp(-age / 3) * Math.cos(age * .9) : 1;
      E.leaf(ctx, t.k, t.x, t.y, (TS - .9) * sq, 0, 0, 0, { glint: l ? Math.exp(-age / 8) * .8 : 0 });
    }
    // 擦亮：一道斜光扫过树冠
    if (opt.sheen != null && opt.sheen > -.2 && opt.sheen < 1.2) {
      const p = opt.sheen, x = CX - R * 1.6 + p * R * 3.2;
      const g = ctx.createLinearGradient(x - 60, CY - R, x + 60, CY + R);
      g.addColorStop(0, 'rgba(255,240,200,0)'); g.addColorStop(.5, 'rgba(255,240,200,.26)'); g.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(CX - R, CY - R, 2 * R, 2 * R);
    }
    ctx.restore();
  }
  // 还在空中的金箔（画在所有东西上面，带影子）
  function flying(ctx, f, zoom = 1) {
    for (const l of LEAVES) {
      const q = E.fall(f, l);
      if (!q || q.landed) continue;
      const h = q.h, s = q.s;
      ctx.save(); ctx.globalAlpha = .55 * Math.pow(1 - h, 1.4);
      const so = s * (1 + h * 1.2);
      ctx.drawImage(SHADOW, q.x + h * s * 1.1 - so, q.y + h * s * 2.2 - so, so * 2, so * 2); ctx.restore();
      const blur = l.final ? E.clamp((h - .35) * 4.5, 0, 2.6) : E.clamp((h - .55) * 3.5, 0, 1.6);
      E.leaf(ctx, l.k, q.x, q.y, s, q.rot, q.ax, q.ay, { blur });
    }
  }
  // 落定那一下：几粒金屑弹起来
  function dust(ctx, f) {
    for (const l of LEAVES) {
      const a = f - l.land; if (a < 0 || a > 30) continue;
      const r = E.rng(l.seed + 5), n = l.final ? 26 : 7;
      for (let i = 0; i < n; i++) {
        const ang = -Math.PI / 2 + (r() - .5) * 2.6, sp = (l.final ? 5 : 2.2) * (.4 + r()), t = a / 30;
        const x = l.x1 + Math.cos(ang) * sp * a * 1.2, y = l.y1 + Math.sin(ang) * sp * a * 1.2 + .09 * a * a, sz = (l.final ? 3.2 : 1.8) * (.5 + r());
        ctx.globalAlpha = (1 - t) * .9; ctx.fillStyle = r() < .5 ? P.goldHi : P.gold; ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
      }
      ctx.globalAlpha = 1;
    }
  }

  const PANEL_SH = (() => { const c = document.createElement('canvas'); c.width = c.height = 300; const x = c.getContext('2d'); x.filter = 'blur(26px)'; x.fillStyle = '#000'; x.fillRect(60, 60, 180, 180); return c; })();
  function world(ctx, f, cam, opt = {}) {
    // 标题块（方板左边）
    if (opt.title !== false) { ctx.globalAlpha = opt.titleAlpha ?? 1; ctx.drawImage(I.title, -886, 0, G.TW, G.TH); ctx.globalAlpha = 1; }
    ctx.globalAlpha = .7; ctx.drawImage(PANEL_SH, -150, -90, 1180, 1180); ctx.globalAlpha = 1;
    ctx.drawImage(cam.z < .45 ? I.panel_full : I.panel, 0, 0, G.PS, G.PS);
    if (cam.z >= .45) crown(ctx, f, opt);
    dust(ctx, f);
    flying(ctx, f, cam.z);
  }

  // —— 前景里虚着飘过的大金箔（景深，屏幕坐标）————————————————————————————————————
  const AMB = Array.from({ length: 7 }, (_, n) => { const r = E.rng(n * 13 + 101); return { x0: 2100 + r() * 300, y0: -200 + r() * 900, vx: -(2.2 + r() * 3), vy: .6 + r() * 1.4, s: 110 + r() * 150, k: n * 2, ph: r() * 6, t0: -80 + n * 46 + r() * 30 }; });
  function ambient(ctx, f, alpha = 1, slow = 1) {
    if (alpha <= 0) return;
    for (const a of AMB) {
      const t = (f - a.t0) * slow;
      for (const rep of [0, 520]) {
        const tt = t - rep; if (tt < 0) continue;
        const x = a.x0 + a.vx * tt, y = a.y0 + a.vy * tt + Math.sin(tt * .03 + a.ph) * 40;
        if (x < -300 || x > 2300 || y > 1300) continue;
        E.leaf(ctx, a.k, x, y, a.s, tt * .006 + a.ph, Math.sin(tt * .021 + a.ph) * 1.1, Math.cos(tt * .017 + a.ph) * .9, { blur: 2, alpha: .55 * alpha });
      }
    }
  }

  // —— 打出来的字（屏幕坐标）：中文一个字一个字出，每个字一声“嗒”；英文一行跟着滑出来 ——————————
  const LABELS = [];
  function label(f0, f1, zh, en, x, y, o = {}) {
    LABELS.push({ f0, f1, zh, en, x, y, o });
    [...zh].forEach((ch, i) => { if (ch.trim()) ev(f0 + i * 2.2, 'type', .5); });
    if (en) ev(f0 + zh.length * 2.2 + 2, 'swish', .35);
  }
  function labels(ctx, f) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.textBaseline = 'alphabetic';
    for (const L of LABELS) {
      if (f < L.f0 - 1 || f > L.f1 + 1) continue;
      const out = E.clamp((L.f1 - f) / 10), size = L.o.size || 76, col = L.o.col || P.paper, al = L.o.align || 'left';
      ctx.font = `700 ${size}px Song`;
      const chars = [...L.zh], ws = chars.map(c => ctx.measureText(c).width), W = ws.reduce((a, b) => a + b, 0);
      // 铭牌：黑底、细金框，从左往右展开
      if (L.o.plate !== false) {
        ctx.font = `500 ${L.o.enSize || 24}px Jost`; ctx.letterSpacing = '5px'; const EW = L.en ? ctx.measureText(L.en).width : 0; ctx.letterSpacing = '0px';
        ctx.font = `700 ${size}px Song`;
        const pw = Math.max(W, EW) + 88, ph = size + (L.en ? 118 : 70), px0 = (al === 'center' ? L.x - W / 2 : al === 'right' ? L.x - W : L.x) - 44, py0 = L.y - size - 30;
        const pe = E.ease.o5(E.clamp((f - L.f0 + 6) / 14));
        ctx.globalAlpha = .9 * out; ctx.fillStyle = P.ink; ctx.fillRect(px0, py0, pw * pe, ph);
        ctx.globalAlpha = .8 * out; ctx.strokeStyle = P.gold; ctx.lineWidth = 2; ctx.strokeRect(px0 + 8, py0 + 8, pw * pe - 16, ph - 16);
      }
      let x = al === 'center' ? L.x - W / 2 : al === 'right' ? L.x - W : L.x;
      chars.forEach((c, i) => {
        const t = E.clamp((f - (L.f0 + i * 2.2)) / 9); if (t <= 0) { x += ws[i]; return; }
        const e = E.ease.o3(t);
        ctx.globalAlpha = e * out; ctx.fillStyle = col;
        ctx.fillText(c, x, L.y + (1 - e) * 22 - (1 - out) * 14);
        x += ws[i];
      });
      // 一条金线 + 英文
      const t2 = E.clamp((f - (L.f0 + chars.length * 2.2)) / 14), e2 = E.ease.o5(t2);
      if (t2 > 0) {
        const x0 = al === 'center' ? L.x - W / 2 : al === 'right' ? L.x - W : L.x;
        ctx.globalAlpha = out; ctx.fillStyle = P.gold;
        ctx.fillRect(al === 'right' ? x0 + W - 90 * e2 : x0, L.y + 26, 90 * e2, 5);
        if (L.en) {
          ctx.font = `500 ${L.o.enSize || 24}px Jost`; ctx.letterSpacing = '5px';
          ctx.globalAlpha = e2 * out; ctx.fillStyle = L.o.enCol || P.gold;
          const ew = ctx.measureText(L.en).width;
          ctx.fillText(L.en, (al === 'center' ? L.x - ew / 2 : al === 'right' ? L.x - ew : L.x) + (1 - e2) * -30, L.y + 70);
          ctx.letterSpacing = '0px';
        }
      }
    }
    ctx.restore();
  }

  // —— 画面外框（封面那一圈细金框，只在开场和片尾）————————————————————————————————
  function frameLines(ctx, a) {
    if (a <= 0) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a * .55; ctx.strokeStyle = P.gold; ctx.lineWidth = 2;
    ctx.strokeRect(34, 34, 1920 - 68, 1080 - 68); ctx.globalAlpha = a; ctx.fillStyle = P.gold;
    for (const [x, y] of [[34, 34], [1886, 34], [34, 1046], [1886, 1046]]) ctx.fillRect(x - 7, y - 7, 14, 14);
    ctx.restore();
  }

  // —— 后期：暗角 + 颗粒 ——————————————————————————————————————————————————————
  const GRAIN = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), d = x.createImageData(256, 256), r = E.rng(9);
    for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 18; } x.putImageData(d, 0, 0); return c; })();
  function post(ctx, f) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const g = ctx.createRadialGradient(960, 540, 420, 960, 540, 1180);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.5)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
    const ox = Math.floor(E.hash(f, 1) * 256), oy = Math.floor(E.hash(f, 2) * 256);
    ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = ctx.createPattern(GRAIN, 'repeat');
    ctx.translate(-ox, -oy); ctx.fillRect(ox, oy, 1920, 1080);
    ctx.restore();
  }

  return { EV, ev, label, labels, world, ambient, frameLines, post, crown, flying, TILES, LEAVES, TS, CX, CY, R, SHADOW };
})();
