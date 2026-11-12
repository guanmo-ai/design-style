// 沙画 v2 · 一百万粒沙。每一幕是一张“沙厚度图”（目标），沙粒从上一幕的位置飞到这一幕的位置。
// 换幕的编舞：wind 风吹 / vortex 旋涡 / burst 炸开 / pour 从天上倒下来 / storm 沙暴。每粒沙的出发时间按它在风里的先后错开，
// 所以换幕是一道“沙浪”扫过整张画，而不是整张一起淡入淡出。每一帧 = 帧号的纯函数。
// 一幕可以分层（layers）：每层有自己的动作（月亮升起、瞳孔转动、鲸鱼跃起、开关拨过去），层里的沙跟着走。
(function () {
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const sm = t => t * t * t * (t * (t * 6 - 15) + 10);           // smootherstep：起步和落地速度都是 0
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  // scenes: [{ layers: [{ dens: Float32Array(GW*GH), move(f) → {dx,dy,rot,cx,cy,s} }] }]
  // trans:  [{ f0, f1, from, to, kind, dir, spread, lift, amp, c:[x,y], turns }]
  function build(o) {
    const { W, H, GW, GH, N, m } = o; const cw = W / GW, ch = H / GH; const R = rng(o.seed || 5);
    const S = o.scenes.length; const P = [], L = [];               // P[s] = Float32Array(2N)：每粒沙在第 s 幕的位置；L[s] = 层号
    const r1 = new Float32Array(N), r2 = new Float32Array(N), r3 = new Float32Array(N);
    for (let i = 0; i < N; i++) { r1[i] = R(); r2[i] = R(); r3[i] = R(); }
    // 采样：每一格按厚度 / m 放沙粒（确定性），不够的放到画外“备用沙”
    function sample(sc, dir) {
      const X = new Float32Array(N * 2), Lr = new Uint8Array(N); let n = 0; const rr = rng(sc.seed || 17);
      sc.layers.forEach((ly, li) => { const D = ly.dens; for (let j = 0; j < GW * GH && n < N; j++) { const v = D[j] / m; let k = Math.floor(v + rr()); const gx = j % GW, gy = (j / GW) | 0; while (k-- > 0 && n < N) { X[2 * n] = (gx + rr()) * cw; X[2 * n + 1] = (gy + rr()) * ch; Lr[n] = li; n++; } } });
      sc.count = n;
      // 备用沙：顺着风停在画外（下一次换幕从那儿飞进来）
      const dx = Math.cos(dir), dy = Math.sin(dir);
      for (let i = n; i < N; i++) { const t = rr(); const ex = W / 2 + dx * (W * 0.75 + rr() * 300) - dy * (t - 0.5) * W * 1.4, ey = H / 2 + dy * (H * 0.9 + rr() * 300) + dx * (t - 0.5) * H * 1.4; X[2 * i] = ex; X[2 * i + 1] = ey; Lr[i] = 255; }
      return { X, Lr };
    }
    // 配对：两边都按风向投影排序，第 k 名配第 k 名 → 每粒沙基本顺着风走
    const keyOf = (X, i, dx, dy) => X[2 * i] * dx + X[2 * i + 1] * dy;
    function order(X, dx, dy) { const K = new Float64Array(N); for (let i = 0; i < N; i++) K[i] = Math.round((keyOf(X, i, dx, dy) + 20000) * 64) * 2097152 + i; K.sort(); const out = new Uint32Array(N); for (let i = 0; i < N; i++) out[i] = K[i] % 2097152; return out; }
    const first = sample(o.scenes[0], o.trans[0] ? o.trans[0].dir + Math.PI : 0); P.push(first.X); L.push(first.Lr);
    const U = [];                                                    // U[t] = 每粒沙在第 t 次换幕里的出发先后（0..1）
    for (let s = 1; s < S; s++) {
      const tr = o.trans.find(t => t.to === s); const dir = tr.dir || 0, dx = Math.cos(dir), dy = Math.sin(dir);
      const nx = o.trans.find(t => t.from === s); const B = sample(o.scenes[s], (nx ? nx.dir : dir) + Math.PI);
      // 配对：看得见的沙和看得见的沙按风向排好一一对上；多出来 / 不够的，均匀地从画外的备用沙补进来、或飞回备用沙
      const A = P[s - 1], LA = L[s - 1];
      const oa = order(A, dx, dy), ob = order(B.X, dx, dy);
      const va = [], ra = [], vb = [], rb = [];
      for (let k = 0; k < N; k++) { (LA[oa[k]] === 255 ? ra : va).push(oa[k]); (B.Lr[ob[k]] === 255 ? rb : vb).push(ob[k]); }
      const X = new Float32Array(N * 2), Lr = new Uint8Array(N), u = new Float32Array(N);
      const put = (i, j, uu) => { X[2 * i] = B.X[2 * j]; X[2 * i + 1] = B.X[2 * j + 1]; Lr[i] = B.Lr[j]; u[i] = uu; };
      let ia = 0, ir = 0, jb = 0, jr = 0;
      if (va.length <= vb.length) {
        const na = va.length, nb = vb.length;
        for (let j = 0; j < nb; j++) { const take = Math.floor((j + 1) * na / nb) > Math.floor(j * na / nb); const i = take && ia < na ? va[ia++] : ra[ir++]; put(i, vb[j], j / nb); }
        while (ia < na) put(va[ia++], rb[jr++], 1);
        while (ir < ra.length) put(ra[ir++], rb[jr++], 1);
      } else {
        const na = va.length, nb = vb.length;
        for (let k = 0; k < na; k++) { const take = Math.floor((k + 1) * nb / na) > Math.floor(k * nb / na); const j = take && jb < nb ? vb[jb++] : rb[jr++]; put(va[k], j, k / na); }
        while (ir < ra.length) put(ra[ir++], rb[jr++], 1);
      }
      // 旋涡 / 炸开 / 沙暴：先后按到中心的距离
      if (tr.kind === 'burst' || tr.kind === 'vortex' || tr.kind === 'storm') { const c = tr.c || [W / 2, H / 2]; const K = new Float64Array(N); for (let i = 0; i < N; i++) { const A = P[s - 1]; K[i] = Math.round(Math.hypot(A[2 * i] - c[0], A[2 * i + 1] - c[1]) * 16) * 2097152 + i; } K.sort(); for (let k = 0; k < N; k++) u[K[k] % 2097152] = tr.kind === 'storm' ? 1 - k / N : k / N;
        if (tr.kind === 'burst') { const A = P[s - 1]; for (let i = 0; i < N; i++) u[i] = Math.pow(Math.min(1, Math.hypot(A[2 * i] - c[0], A[2 * i + 1] - c[1]) / 1400), 0.35); } }   // 炸开：先后按真实距离，洞是一圈圈张开的
      P.push(X); L.push(Lr); U.push(u); tr.U = u;
    }
    // —— 某一帧每粒沙在哪 ——
    // 返回：gx/gy（落在玻璃上的）写进 ground，飞在空中的写进 air（带高度 z）
    function layerPos(s, li, x, y, f) { const ly = o.scenes[s].layers[li]; if (!ly || !ly.move) return [x, y]; const M = ly.move(f); if (!M) return [x, y]; let X = x, Y = y; if (M.sx != null || M.sy != null || (M.s && M.s !== 1)) { X = M.cx + (X - M.cx) * (M.sx ?? M.s ?? 1); Y = M.cy + (Y - M.cy) * (M.sy ?? M.s ?? 1); } if (M.rot) { const c = Math.cos(M.rot), sn = Math.sin(M.rot), ux = X - M.cx, uy = Y - M.cy; X = M.cx + ux * c - uy * sn; Y = M.cy + ux * sn + uy * c; } if (M.fn) return M.fn(X + (M.dx || 0), Y + (M.dy || 0), x, y); return [X + (M.dx || 0), Y + (M.dy || 0)]; }
    function frame(f, ground, air, airZ) {
      ground.fill(0); air.fill(0); airZ.fill(0);
      const tr = o.trans.find(t => f >= t.f0 && f < t.f1);
      let s; if (tr) s = tr.from; else { s = 0; for (const t of o.trans) if (f >= t.f1) s = t.to; }
      const Ps = P[s], Ls = L[s];
      const RW = o.RW, RH = o.RH, rk = RW / W, w4 = m * (W / GW) * (H / GH) / (rk * rk);   // 渲染网格是全分辨率：一粒沙 = 一个点
      const splat = (x, y, w) => { const fx = x * rk - 0.5, fy = y * rk - 0.5; if (fx < 0 || fy < 0 || fx >= RW - 1 || fy >= RH - 1) return; const xi = fx | 0, yi = fy | 0, a = fx - xi, b = fy - yi, j = yi * RW + xi; const ww = w4; ground[j] += ww * (1 - a) * (1 - b); ground[j + 1] += ww * a * (1 - b); ground[j + RW] += ww * (1 - a) * b; ground[j + RW + 1] += ww * a * b; };
      const AW = o.AW, AH = o.AH, ak = AW / W, BW = AW >> 2, BH = AH >> 2;
      // 空中的沙：低的是清楚的小点（air），高的离镜头近、失焦成软的大斑（airZ 存四分之一分辨率的“虚”层）
      const fly = (x, y, z) => { if (z > 0.5) { const X = (x * ak / 4) | 0, Y = (y * ak / 4) | 0; if (X < 0 || Y < 0 || X >= BW || Y >= BH) return; airZ[Y * BW + X] += 1; return; } const X = (x * ak) | 0, Y = (y * ak) | 0; if (X < 0 || Y < 0 || X >= AW || Y >= AH) return; air[Y * AW + X] += 1; };
      if (!tr) {
        // 停在这一幕：每层按自己的动作走
        const lc = new Map();
        for (let i = 0; i < N; i++) { const li = Ls[i]; if (li === 255) continue; const x = Ps[2 * i], y = Ps[2 * i + 1]; const ly = o.scenes[s].layers[li]; if (ly && ly.move) { const q = layerPos(s, li, x, y, f); if (q[2] > 0.02) fly(q[0], q[1], q[2]); else splat(q[0], q[1], m); } else splat(x, y, m); }
        return { s, tr: null };
      }
      const Pt = P[tr.to], Lt = L[tr.to], u = tr.U; const T = clamp((f - tr.f0) / (tr.f1 - tr.f0)); const sp = tr.spread == null ? 0.5 : tr.spread;
      const lift = tr.lift == null ? 1 : tr.lift, amp = tr.amp == null ? 60 : tr.amp; const c = tr.c || [W / 2, H / 2];
      const fa = tr.f0, fb = tr.f1;
      for (let i = 0; i < N; i++) {
        const la = Ls[i], lb = Lt[i]; if (la === 255 && lb === 255) continue;
        let p = clamp((T - sp * u[i]) / (1 - sp)); const e = sm(p), bump = Math.sin(Math.PI * e);
        let ax = Ps[2 * i], ay = Ps[2 * i + 1]; if (la !== 255) { const q = layerPos(s, la, ax, ay, fa); ax = q[0]; ay = q[1]; }
        let bx = Pt[2 * i], by = Pt[2 * i + 1]; if (lb !== 255) { const q = layerPos(tr.to, lb, bx, by, fb); bx = q[0]; by = q[1]; }
        let x = ax + (bx - ax) * e, y = ay + (by - ay) * e; let z = bump * lift * (0.35 + 0.65 * r2[i]);
        if (tr.kind === 'wind') { const dir = tr.dir || 0; const nx = -Math.sin(dir), ny = Math.cos(dir); const w = bump * amp * (r1[i] - 0.5) * 2 + bump * amp * 0.6 * Math.sin(r3[i] * 6.28 + e * 7); x += nx * w; y += ny * w; }
        else if (tr.kind === 'vortex' || tr.kind === 'storm') { const ang = bump * (tr.turns || 1) * 6.283 * (0.6 + 0.4 * r1[i]) * (tr.kind === 'storm' ? 1 : 1); const ux = x - c[0], uy = y - c[1]; const cs = Math.cos(ang), sn = Math.sin(ang); const rs = 1 + bump * (tr.kind === 'storm' ? 0.25 * (r3[i] - 0.3) : -0.15); x = c[0] + (ux * cs - uy * sn) * rs; y = c[1] + (ux * sn + uy * cs) * rs; }
        else if (tr.kind === 'burst') { const ux = x - c[0], uy = y - c[1]; const d = Math.hypot(ux, uy) || 1; const k = bump * amp * (0.4 + r1[i]); x += ux / d * k; y += uy / d * k; }
        else if (tr.kind === 'pour') { // 先被吸到画面上方，再从上面落下来（越落越快）
          const top = -40 - r1[i] * 160; if (e < 0.45) { const q = sm(e / 0.45); x = ax + (bx - ax) * q * 0.85; y = ay + (top - ay) * q; z = lift * (0.5 + 0.5 * q); } else { const q = (e - 0.45) / 0.55, g = q * q; x = bx + (r3[i] - 0.5) * 8 * (1 - q); y = top + (by - top) * g; z = lift * (1 - q) * 0.9; } }
        if (z > 0.06 && p > 0 && p < 1) fly(x, y, z); else splat(x, y, m);
      }
      return { s, tr, T };
    }
    return { frame, P, L };
  }

  // —— 渲染：镜头（平移 / 缩放 / 旋转）+ 灯箱颜色 + 沙的透光 + 空中沙粒 ——
  function renderer(ctx, W, H, RW, RH, AW, AH) {
    const img = ctx.createImageData(W, H), D = img.data; for (let i = 3; i < D.length; i += 4) D[i] = 255;
    const NL = 4096, TMAX = 4, tint = [0.8, 1.12, 1.75], k = 2.6; const LUT = [new Float32Array(NL), new Float32Array(NL), new Float32Array(NL)];
    for (let c = 0; c < 3; c++) for (let i = 0; i < NL; i++) { const th = i / (NL - 1) * TMAX; let T = Math.exp(-k * th * tint[c]); T = T * T * (3 - 2 * T) * 0.6 + T * 0.4; LUT[c][i] = T; }
    const tmp = new Float32Array(RW * RH), g2 = new Float32Array(RW * RH); const BW = AW >> 2, BH = AH >> 2, b2 = new Float32Array(BW * BH), b3 = new Float32Array(BW * BH);
    const sm6 = document.createElement('canvas'); sm6.width = W / 6 | 0; sm6.height = H / 6 | 0; const gs = sm6.getContext('2d');
    function blur121(src, dst, w, h, pass = 1) { for (let p = 0; p < pass; p++) { const a = p ? dst : src; for (let y = 0; y < h; y++) { const r = y * w; tmp[r] = a[r]; tmp[r + w - 1] = a[r + w - 1]; for (let x = 1; x < w - 1; x++) tmp[r + x] = (a[r + x - 1] + 2 * a[r + x] + a[r + x + 1]) * 0.25; } for (let x = 0; x < w; x++) { dst[x] = tmp[x]; dst[(h - 1) * w + x] = tmp[(h - 1) * w + x]; } for (let y = 1; y < h - 1; y++) { const r = y * w; for (let x = 0; x < w; x++) dst[r + x] = (tmp[r - w + x] + 2 * tmp[r + x] + tmp[r + w + x]) * 0.25; } } }
    return function draw(ground, air, airZ, cam, light, o = {}) {
      blur121(ground, g2, RW, RH, 1);
      // 失焦的沙：四分之一分辨率，模糊三遍
      b2.set(airZ); for (let p = 0; p < 3; p++) { for (let y = 1; y < BH - 1; y++) for (let x = 1; x < BW - 1; x++) { const j = y * BW + x; b3[j] = (b2[j] * 4 + b2[j - 1] + b2[j + 1] + b2[j - BW] + b2[j + BW]) * 0.125; } b2.set(b3); }
      const { cx, cy, zoom, rot } = cam; const cs = Math.cos(rot) / zoom, sn = Math.sin(rot) / zoom; const sx = RW / W, ax = AW / W;
      const [LR, LG, LB] = light.col, lc = light.c || [W * 0.5, H * 0.55];
      for (let Y = 0; Y < H; Y++) {
        const yy = Y - H / 2;
        for (let X = 0; X < W; X++) {
          const xx = X - W / 2; const wx = cx + xx * cs - yy * sn, wy = cy + xx * sn + yy * cs;
          let hv; const fx = wx * sx - 0.5, fy = wy * sx - 0.5;
          if (fx >= 0 && fy >= 0 && fx < RW - 1 && fy < RH - 1) { const xi = fx | 0, yi = fy | 0, a = fx - xi, b = fy - yi, j = yi * RW + xi; hv = g2[j] * (1 - a) * (1 - b) + g2[j + 1] * a * (1 - b) + g2[j + RW] * (1 - a) * b + g2[j + RW + 1] * a * b; }
          else hv = 3;
          const q = Math.min(NL - 1, (hv / TMAX * (NL - 1)) | 0);
          const dx = (wx - lc[0]) / W, dy = (wy - lc[1]) / H; const li = 0.72 + 0.28 * Math.exp(-(dx * dx * 1.6 + dy * dy * 2.4) * 2.2);
          let at = 1; const axi = (wx * ax) | 0, ayi = (wy * ax) | 0;
          if (axi >= 0 && ayi >= 0 && axi < AW && ayi < AH) { const av = air[ayi * AW + axi]; if (av > 0) at = Math.exp(-0.8 * av); }
          // 失焦层用屏幕坐标（离镜头近，不跟着镜头转）
          const bxi = X * BW / W, byi = Y * BH / H, bxx = bxi | 0, byy = byi | 0; if (bxx < BW - 1 && byy < BH - 1) { const a = bxi - bxx, b = byi - byy, j = byy * BW + bxx; const bv = b2[j] * (1 - a) * (1 - b) + b2[j + 1] * a * (1 - b) + b2[j + BW] * (1 - a) * b + b2[j + BW + 1] * a * b; if (bv > 0.001) at *= Math.exp(-0.05 * bv); }
          const p = (Y * W + X) * 4;
          D[p] = LR * li * LUT[0][q] * at + 10 * (1 - LUT[0][q]); D[p + 1] = LG * li * LUT[1][q] * at + 5 * (1 - LUT[1][q]); D[p + 2] = LB * li * LUT[2][q] * at + 3 * (1 - LUT[2][q]);
        }
      }
      ctx.putImageData(img, 0, 0);
      gs.filter = 'blur(6px) brightness(1.1)'; gs.drawImage(ctx.canvas, 0, 0, sm6.width, sm6.height);
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = o.bloom == null ? 0.4 : o.bloom; ctx.drawImage(sm6, 0, 0, W, H); ctx.restore();
    };
  }
  window.GRAINS = { build, renderer, rng, sm, clamp };
})();
