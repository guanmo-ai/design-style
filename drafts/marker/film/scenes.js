// 马克笔 v3 · 六个场景。每个场景一个世界（家里的镜头 = 1920×1080），自己的底色、主角、构图、镜头。
// 换场景 = 一组铺满屏幕的巨笔扫过去：这几笔的颜色就是下一个场景的底色（底色本身就是马克笔扫出来的）。
// 144 BPM：一拍 = 25 帧，一小节 = 100 帧，第一小节的重拍在第 50 帧。
const SCN = (() => {
  const BEAT = 25, BAR = 100;
  const SC = [];
  const rot = (cx, cy, a) => { const c = Math.cos(a), s = Math.sin(a); return [c, s, -s, c, cx - c * cx + s * cy, cy - s * cx - c * cy]; };
  const rect = (x, y, w, h, r = 0) => { const P = new Path2D(); if (r) P.roundRect(x, y, w, h, r); else P.rect(x, y, w, h); return P; };

  // —— 一组铺满屏幕的巨笔：之字形，6 道，每道 720 宽，最后一道扫完的那一帧 = hit ——
  function swipe(gen, color, hit, o = {}) {
    const ang = o.ang ?? -0.5, u = [Math.cos(ang), Math.sin(ang)], n = [-u[1], u[0]], C = [960, 540], out = [];
    const N = 6, dur = 7, gap = 2.6, t0 = hit - (N - 1) * gap - dur;
    for (let i = 0; i < N; i++) {
      const d = -1600 + i * 640, c = [C[0] + n[0] * d, C[1] + n[1] * d], a = [c[0] - u[0] * 1900, c[1] - u[1] * 1900], b = [c[0] + u[0] * 1900, c[1] + u[1] * 1900];
      const [p, q] = i % 2 ? [b, a] : [a, b];
      out.push(gen.add('marker', [p, [(p[0] + q[0]) / 2 + n[0] * 30, (p[1] + q[1]) / 2 + n[1] * 30], q], { w: 760, th: 190, nib: Math.atan2(n[1], n[0]), color, alpha: .97, mode: 'source-over', dens: 3.2, dur, t0: t0 + i * gap, prof: 'press', layer: 'swipe', tool: 'giant', sheen: 0 }));
    }
    return out;
  }

  // 场景时间：hit = 巨笔扫完、这个场景接管画面的那一帧
  const HITS = [50, 250, 400, 550, 750, 900], CAP = 1100, END = 1160;
  const SWIPE0 = k => HITS[k] - 5 * 2.6 - 7;
  // 布景入场：巨笔扫完以后，纸 / 卡片 / 浏览器 / 手机从画外弹进来（弹簧，过冲约 5%）
  const spr = t => { if (t <= 0) return 0; const z = .55, w = 9, wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + z * w / wd * Math.sin(wd * t)); };
  const enter = (f, hit, dx, dy, da, cx, cy, dur = 30) => { const u = 1 - spr((f - hit) / dur); return INK.mul([1, 0, 0, 1, dx * u, dy * u], rot(cx, cy, da * u)); };
  const BG = ['#2A2C31', '#11A086', '#D8CBAE', '#6E52D8', '#F2B01E', '#F0642E'];
  const NAMES = ['01 汽车 · 设计草图', '02 球鞋', '03 建筑 · 两点透视', '04 网页 · 官网', '05 App · 配置器', '06 一支笔'];

  // —— 画完以后让它动起来 ——
  const IDM = [1, 0, 0, 1, 0, 0];
  const about = (px, py, M) => INK.mul([1, 0, 0, 1, px, py], INK.mul(M, [1, 0, 0, 1, -px, -py]));
  // 跳一下：先蹲（8 帧）→ 腾空（dur 帧，可以翻一圈）→ 落地压扁再弹回；每一段首尾都接得上
  function hopM(f, t0, px, py, o) {
    const p = f - t0; if (p <= -8) return IDM;
    let sx = 1, sy = 1, tx = 0, ty = 0, r = 0;
    if (p < 0) { const a = Math.sin(Math.PI * (p + 8) / 8); sy = 1 - .16 * a; sx = 1 + .08 * a; }
    else if (p < o.dur) { const u = p / o.dur, e = u * u * (3 - 2 * u); ty = -o.H * 4 * u * (1 - u); r = (o.spin || 0) * e + (o.rot || 0) * Math.sin(Math.PI * u); tx = (o.dx || 0) * e; const st = Math.sin(Math.PI * u); sy = 1 + .1 * st; sx = 1 - .05 * st; }
    else { const q = p - o.dur, d = Math.exp(-q / 7) * Math.sin(q * .55); sy = 1 - .18 * d; sx = 1 + .09 * d; tx = o.dx || 0; r = o.spin || 0; }
    const c = Math.cos(r), s2 = Math.sin(r);
    return INK.mul([1, 0, 0, 1, px + tx, py + ty], INK.mul([c, s2, -s2, c, 0, 0], INK.mul([sx, 0, 0, sy, 0, 0], [1, 0, 0, 1, -px, -py])));
  }
  // 摇 / 晃：绕支点转，衰减振荡，从 0 开始
  function rockM(f, t0, px, py, A, w = .45, dec = 22) { const q = f - t0; if (q <= 0) return IDM; const r = A * Math.sin(q * w) * Math.exp(-q / dec); const c = Math.cos(r), s2 = Math.sin(r); return about(px, py, [c, s2, -s2, c, 0, 0]); }
  function pulseM(f, t0, px, py, A = .14) { const q = f - t0; if (q <= 0) return IDM; const k = 1 + A * Math.sin(q * .5) * Math.exp(-q / 10); return about(px, py, [k, 0, 0, k, 0, 0]); }

  function scene(k, build) {
    const all = [], gen = GEN(all, 11 + k * 17), G = {};
    const S = { k, all, gen, G, hit: HITS[k], end: k < 5 ? HITS[k + 1] : END, bg: BG[k], name: NAMES[k], dots: [], marks: {} };
    S.swipe = swipe(gen, BG[k], S.hit, { ang: k % 2 ? 0.45 : -0.5 });
    S.swipe0 = Math.min(...S.swipe.map(s => s.t0));
    build(S, gen, G);
    // 画不完就整体压快：最后一笔要在下一组巨笔开扫前 10 帧画完（白点、批注跟着一起缩）
    const body = S.all.filter(s => s.layer !== 'swipe' && s.layer !== 'deco'), t0 = S.hit + 2, last = Math.max(...body.map(s => s.t0 + (s.dwell || 0) + s.dur)), lim = (k < 5 ? SWIPE0(k + 1) : CAP - 30) - 10 - (S.tail || 0);
    if (last > lim) { const sc = (lim - t0) / (last - t0); for (const s of body) { if (s.t0 < t0) continue; s.t0 = t0 + (s.t0 - t0) * sc; s.dur *= sc; if (s.dwell) s.dwell *= sc; }
      for (const d of S.dots) d.t = t0 + (d.t - t0) * sc; for (const key of ['dwellAt', 'grayStart', 'T_PROG', 'T_CLICK', 'T_SCROLL', 'T_WHITE', 'T_TEXT', 'carEnd', 'T_HOP', 'T_LIGHT', 'T_DRIVE', 'T_WAVE']) if (S[key] > t0) S[key] = t0 + (S[key] - t0) * sc;
      for (const key in S.marks) S.marks[key] = t0 + (S.marks[key] - t0) * sc; for (const K of S.cam) if (K[0] > t0 && K[0] < S.end - 10) K[0] = t0 + (K[0] - t0) * sc; S.fit = sc; }
    S.all.sort((a, b) => a.t0 - b.t0);
    S.all.forEach(s => { s.end = s.t0 + (s.dwell || 0) + s.dur; s.scene = k; });
    SC.push(S); return S;
  }
  const tools = (list, name) => list.forEach(s => { if (s.tool === undefined) s.tool = s.kind === 'marker' ? name : s.kind; });

  // ================= 01 汽车：暗的工作室，台灯照着一张纸 =================
  scene(0, (S, gen, G) => {
    S.sheet = { cx: 960, cy: 560, w: 1440, h: 800, rot: -0.025 };
    G.paper = f => INK.mul(enter(f, S.hit, 0, 900, 0.12, 960, 560), rot(S.sheet.cx, S.sheet.cy, S.sheet.rot));
    // 车画完就开走：先往后一蹲，再加速冲出纸面（车头朝左）
    S.T_DRIVE = 1e9;
    G.drive = f => { const q = f - S.T_DRIVE; if (q <= -6) return IDM; const sq = q < 0 ? Math.sin(Math.PI * (q + 6) / 6) : 0; const dx = q > 0 ? -1300 * Math.pow(q / 26, 2.2) : 0;
      const pitch = (q < 0 ? -.03 * sq : .035 * Math.exp(-q / 6) * Math.min(1, q / 3)); const c2 = Math.cos(pitch), s2 = Math.sin(pitch);
      return INK.mul([1, 0, 0, 1, dx + 18 * sq, 0], about(960 + 345 * .9, 800, [c2, s2, -s2, c2, 0, 0])); };
    const c = gen.car({ x: 960, y: 800, s: .9, color: gen.COL.orange, t0: S.hit + 4, rate: 1.6, hop: .3, G: f => G.paper(f), Gbody: f => INK.mul(G.paper(f), G.drive(f)), layer: 'paper', tools: true, dotGap: 2.5 });
    S.dots = c.dots; S.marks = c.marks; S.carEnd = c.end; S.T_DRIVE = c.end + 14;
    S.tail = 16;
    // 速度线：车冲出去的那一刻，在车尾后面甩几笔
    S.speed = [];
    for (let i = 0; i < 7; i++) { const y = 800 - 40 - i * 34, x0 = 960 + 560 * .9 + 30 - (i % 2) * 40; S.speed.push(gen.add('marker', [[x0 - 40, y], [x0 + 260 + i * 20, y - 4]], { w: 14, th: 4, nib: 1.5, color: i % 2 ? '#3B74E3' : '#24262B', alpha: .85, dur: 3, prof: 'flick', taper: .9, t0: S.T_DRIVE + 2 + i * 1.2, G: f => G.paper(f), layer: 'paper' })); }
    S.cam = [[S.hit - 20, 720, 600, 1.3, -6], [S.hit + 70, 1120, 620, 1.22, 3], [S.hit + 130, 1000, 600, 1.1, 1], [S.T_DRIVE, 980, 580, 1.0, 0], [S.end - 4, 760, 560, .94, -3]];
  });

  // ================= 02 球鞋：青色底上一张斜放的卡片 =================
  scene(1, (S, gen, G) => {
    S.sheet = { cx: 960, cy: 560, w: 1540, h: 900, rot: 0.05 };
    G.card = f => INK.mul(enter(f, S.hit, 700, -900, -0.3, 960, 560), rot(S.sheet.cx, S.sheet.cy, S.sheet.rot));
    gen.PROD.shoe = { shapes: [
      { poly: [[-200, -38], [-196, -60], [-176, -76], [-130, -88], [-80, -100], [-40, -118], [0, -140], [40, -158], [80, -168], [112, -170], [140, -160], [158, -172], [176, -160], [192, -128], [202, -90], [204, -38]], c: 'main' },
      { poly: [[-200, -38], [-196, -60], [-176, -76], [-140, -86], [-128, -38]], c: 'main' },
      { poly: [[150, -38], [150, -110], [176, -150], [194, -122], [204, -90], [204, -38]], c: '#2B2D33' },
      { poly: [[-206, -38], [206, -38], [210, -16], [196, 0], [-188, 0], [-208, -20]], c: '#C3C8CF' }],
      lines: [[[-120, -60], [-40, -82], [40, -106], [120, -112]], [[-200, -18], [206, -18]], [[80, -168], [110, -150], [140, -150]], [[-44, -112], [86, -160]],
        ...[0, 1, 2, 3, 4].map(i => [[-36 + i * 26, -104 - i * 10], [-24 + i * 26, -130 - i * 10]]), [[-128, -38], [-140, -86]], [[150, -38], [150, -110]]],
      hl: [[-180, -74], [-130, -86], [-80, -98], [-40, -116]] };
    S.T_HOP = 1e9; G.shoe = f => INK.mul(G.card(f), hopM(f, S.T_HOP, 980, 800, { H: 300, dur: 30, spin: -Math.PI * 2, dx: -60 }));
    const p = gen.product('shoe', { x: 980, y: 800, s: 3.1, color: '#E8473C', t0: S.hit + 4, rate: 1.3, G: f => G.shoe(f), layer: 'paper' });
    // 规则 ③：笔停在鞋头上，墨一圈圈晕开
    const T = q => [980 + q[0] * 3.1, 800 + q[1] * 3.1];
    S.dwell = gen.add('marker', [T([-170, -56]), T([-120, -60]), T([-60, -66])], { w: 120, th: 34, nib: 1.35, color: '#B8231B', alpha: .62, dur: 6, dwell: 14, prof: 'press', G: f => G.shoe(f), layer: 'paper', dens: 1.3, sheen: 1.3 });
    const iD = 12; S.dwell.t0 = p.list[iD].t0 + 2; const shift = S.dwell.dwell + S.dwell.dur + 2; for (const s of p.list.slice(iD)) s.t0 += shift;
    S.dwellAt = S.dwell.t0; S.dwellPt = T([-170, -56]);
    S.T_HOP = Math.max(...p.list.map(s => s.t0 + s.dur)) + 12;
    S.tail = 46;
    tools(S.all.filter(s => s.layer === 'paper'), 'shoe');
    S.cam = [[S.hit - 20, 960, 560, .96, 7], [S.dwellAt - 12, 980, 600, 1.05, 4], [S.dwellAt + 2, S.dwellPt[0] + 150, S.dwellPt[1] + 30, 1.9, 2], [S.dwellAt + 18, S.dwellPt[0] + 220, S.dwellPt[1] + 10, 1.75, 1], [S.T_HOP - 10, 990, 560, .98, -1], [S.end - 4, 960, 520, .9, -3]];
  });

  // ================= 03 建筑：牛皮纸上的两点透视 =================
  scene(2, (S, gen, G) => {
    const H = 640, VL = [-1400, H], VR = [3400, H], FX = 900, FT = 120, FB = 1000, LX = 380, RX = 1600;
    const at = (V, p, x) => { const t = (x - p[0]) / (V[0] - p[0]); return [x, p[1] + t * (V[1] - p[1])]; };
    const TL = at(VL, [FX, FT], LX), BL = at(VL, [FX, FB], LX), TR = at(VR, [FX, FT], RX), BRt = at(VR, [FX, FB], RX);
    const LF = [TL, [FX, FT], [FX, FB], BL], RF = [[FX, FT], TR, BRt, [FX, FB]], SH = [[FX, FB], BRt, [1980, 1010], [1180, 1110]];
    const clipL = gen.pathOf(LF), clipR = gen.pathOf(RF), clipS = gen.pathOf(SH);
    const OUT = (() => { const P = new Path2D(); P.rect(-2000, -2000, 6000, 6000); P.addPath(clipL); P.addPath(clipR); return P; })();
    const L = [], A = (k, pts, o) => { const s = gen.add(k, pts, Object.assign({ layer: 'paper' }, o)); L.push(s); return s; };
    const lerpP = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    // 透视辅助线：从灭点射出来
    for (const [V, p] of [[VL, [FX, FT]], [VL, [FX, FB]], [VR, [FX, FT]], [VR, [FX, FB]]]) { const e = lerpP(V, p, 1.55); A('pencil', [V, e], { w: 2, color: '#4F82D8', alpha: .55, dur: 3.2, prof: 'flick' }); }
    A('pencil', [[-200, H], [2120, H]], { w: 2, color: '#4F82D8', alpha: .45, dur: 3 });
    // 棱
    for (const [a, b] of [[TL, [FX, FT]], [[FX, FT], TR], [BL, [FX, FB]], [[FX, FB], BRt], [TL, BL], [[FX, FT], [FX, FB]], [TR, BRt]]) A('liner', [a, b], { w: 2.6, color: '#1A1B1F', dur: 2.6, prof: 'flick' });
    // 天：蓝色斜扫，绕开楼
    for (let i = 0; i < 8; i++) { const x = 60 + i * 240, a = [x, 640 - (i % 3) * 30], b = [x + 160, 80 + (i % 2) * 40]; A('marker', i % 2 ? [b, a] : [a, b], { w: 130, th: 34, nib: .25, color: '#3B74E3', alpha: .45, dur: 2.4, clip: OUT, clipRule: 'evenodd', tool: 'sky' }); }
    // 规则 ①：同一支灰笔，左面一遍、右面两遍、影子三遍
    const rows = (face, clip, n, color, alpha, tool, V) => { const [a, b, c2, d] = face; for (let i = 0; i < n; i++) { const t = (i + .5) / n; const p = lerpP(a, d, t), q = lerpP(b, c2, t); A('marker', i % 2 ? [q, p] : [p, q], { w: 96, th: 26, nib: 1.5, color, alpha, dur: 2.1, clip, tool }); } };
    rows(LF, clipL, 7, '#8E949E', .42, 'gray');
    rows(RF, clipR, 7, '#8E949E', .42, 'gray'); rows(RF, clipR, 7, '#8E949E', .42, 'gray');
    for (let k = 0; k < 3; k++) for (let i = 0; i < 2; i++) { const a = lerpP([FX, FB], [1180, 1110], (i + .5) / 2), b = lerpP(BRt, [1980, 1010], (i + .5) / 2); A('marker', [a, b], { w: 70, th: 20, nib: 1.5, color: '#8E949E', alpha: .45, dur: 1.8, clip: clipS, tool: 'gray' }); }
    // 每层的玻璃带
    for (let f = 1; f < 8; f++) { const s = f / 8 - .03; const pf = lerpP([FX, FT], [FX, FB], s); const l = at(VL, pf, LX + 20), r = at(VR, pf, RX - 20);
      A('marker', [l, [FX - 8, pf[1]]], { w: 30, th: 9, nib: 1.55, color: '#2D3442', alpha: .72, dur: 1.4, clip: clipL, tool: 'black' }); A('marker', [[FX + 8, pf[1]], r], { w: 30, th: 9, nib: 1.55, color: '#2D3442', alpha: .8, dur: 1.4, clip: clipR, tool: 'black' }); }
    // 树
    for (const [x, y, r] of [[300, 930, 90], [470, 980, 70], [1720, 960, 80]]) { const pts = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 4.2; pts.push([x + Math.cos(a) * r * (.5 + .5 * (i / 40)), y - r + Math.sin(a) * r * .8 * (.5 + .5 * (i / 40))]); } A('marker', pts, { w: 40, th: 12, nib: .9, color: '#3C9A5A', alpha: .6, dur: 3.2, tool: 'green' }); }
    // 白：楼角一道 + 几个窗的反光
    A('white', [[FX, FT + 8], [FX, FB - 8]], { w: 4, color: '#FFFDF7', alpha: .95, dur: 3, prof: 'flick' });
    A('white', [[FX + 6, FT + 10], at(VR, [FX, FT + 10], RX - 30)], { w: 3, color: '#FFFDF7', alpha: .9, dur: 2.4, prof: 'flick' });
    let tEnd = gen.seq(L, S.hit + 3, .3);
    // 画完：窗户一层层亮起来（暖黄一笔，从下往上）
    S.lights = [];
    for (let fl = 7; fl >= 1; fl--) { const sv = fl / 8 - .03; const pf = lerpP([FX, FT], [FX, FB], sv); const l = at(VL, pf, LX + 40), r = at(VR, pf, RX - 40);
      for (const [a, b, cl] of [[lerpP(l, [FX - 10, pf[1]], .15), lerpP(l, [FX - 10, pf[1]], .85), clipL], [lerpP([FX + 10, pf[1]], r, .15), lerpP([FX + 10, pf[1]], r, .85), clipR]])
        S.lights.push(gen.add('marker', [a, b], { w: 22, th: 7, nib: 1.55, color: '#FFD45C', alpha: .92, mode: 'source-over', dur: 2.2, clip: cl, layer: 'paper', sheen: 1.5 })); }
    S.T_LIGHT = tEnd + 2; tEnd = gen.seq(S.lights, S.T_LIGHT, .15);
    S.birds = [0, 1, 2, 3, 4].map(i => ({ t0: S.hit + 30 + i * 6, y: 160 + i * 34 + (i % 2) * 20, x0: -120 - i * 60, sp: 13 + i * 1.5, s: 1 - i * .1 }));
    S.dots = [[1000, 300, 5], [1180, 420, 4], [1320, 560, 4.5], [640, 380, 4]].map((d, i) => ({ p: [d[0], d[1]], r: d[2], t: tEnd + 2 + i * 3 }));
    S.faceLabels = { L: [610, 560], R: [1240, 560], S: [1480, 1060] };
    S.grayStart = L.find(s => s.tool === 'gray').t0;
    S.cam = [[S.hit - 20, 960, 600, .92, -4], [S.hit + 30, 1000, 540, 1.0, -2], [S.grayStart + 10, 980, 560, 1.08, 0], [S.T_LIGHT, 980, 560, 1.0, 1], [S.end - 4, 900, 620, .9, 4]];
  });

  // ================= 04 网页：紫色底上一整面官网 =================
  scene(3, (S, gen, G) => {
    const BR = S.BR = { x: 150, y: 70, w: 1620, h: 940, chrome: 54 };
    S.WEBCLIP = rect(BR.x, BR.y + BR.chrome, BR.w, BR.h - BR.chrome);
    S.SCROLL = 560; S.T_SCROLL = S.hit + 92;
    const scrollAt = f => S.SCROLL * (t => (t = Math.min(1, Math.max(0, t)), t * t * t * (t * (6 * t - 15) + 10)))((f - S.T_SCROLL) / 22);
    S.scrollAt = scrollAt;
    G.dev = f => INK.mul(enter(f, S.hit, 0, 1100, 0.06, 960, 540), rot(960, 540, -0.02));
    G.web = f => INK.mul(G.dev(f), [1, 0, 0, 1, BR.x, BR.y + BR.chrome - scrollAt(f)]);
    const wb = { G: f => G.web(f), vclip: S.WEBCLIP, layer: 'web' };
    const hero = gen.letters('KITE 01', 70, 150, 170, Object.assign({ dur: 1.8 }, wb)); gen.seq(hero, S.hit + 4, .5);
    S.car = gen.car({ x: 1140, y: 560, s: .56, color: gen.COL.orange, t0: S.hit + 2, rate: .5, hop: .1, G: f => G.web(f), vclip: S.WEBCLIP, layer: 'web', dotGap: 1.5 });
    S.cta = gen.add('marker', [[70, 600], [370, 594]], Object.assign({ w: 80, th: 22, nib: 1.45, color: gen.COL.orange, alpha: .78, dur: 4, t0: S.hit + 30, prof: 'press' }, wb));
    const CARDS = [['sneaker', gen.COL.teal, '运动鞋'], ['phones', gen.COL.violet, '耳机'], ['chair', gen.COL.yellow, '躺椅'], ['lamp', gen.COL.red, '台灯']];
    S.cards = CARDS.map(([n, c, label], i) => { const cx = 60 + i * 390 + 180, cy = 1060; const card = { n, c, label, cx, cy, tA: 1e9 };
      const anim = f => n === 'sneaker' ? hopM(f, card.tA, cx, cy, { H: 70, dur: 16, spin: -Math.PI * 2 }) : n === 'phones' ? pulseM(f, card.tA, cx, cy - 70, .16) : n === 'chair' ? rockM(f, card.tA, cx, cy, .22) : rockM(f, card.tA, cx - 52, cy - 10, .35, .35, 26);
      const p = gen.product(n, { x: cx, y: cy, s: .74, color: c, t0: S.T_SCROLL + 12 + i * 3, rate: .9, G: f => INK.mul(G.web(f), anim(f)), vclip: S.WEBCLIP, layer: 'web' });
      Object.assign(card, p); card.tA = p.end + 4 + i * 5; return card; });
    S.tail = 24;
    S.dots = S.car.dots;
    S.T_CLICK = S.cta.t0 + 30;
    S.cam = [[S.hit - 20, 960, 540, .94, 3], [S.hit + 40, 760, 470, 1.25, 1], [S.T_CLICK + 4, 520, 620, 1.45, -1], [S.T_SCROLL + 16, 960, 560, 1.0, 0], [S.end - 4, 980, 560, 1.06, 1]];
  });

  // ================= 05 App：黄色底，一部大手机 =================
  scene(4, (S, gen, G) => {
    const PH = S.PH = { w: 560, h: 1220, inset: 26 }; PH.sw = PH.w - 2 * PH.inset; PH.sh = PH.h - 2 * PH.inset;
    const sc = .84, ox = 960 - PH.w * sc / 2, oy = 540 - PH.h * sc / 2;
    G.dev = f => INK.mul(enter(f, S.hit, 0, 1300, -0.1, 960, 540), [sc, 0, 0, sc, ox, oy]);
    G.phone = f => INK.mul(G.dev(f), [1, 0, 0, 1, PH.inset, PH.inset]);
    S.PHCLIP = rect(PH.inset, PH.inset, PH.sw, PH.sh, 56);
    const pb = { G: f => G.phone(f), vclip: S.PHCLIP, layer: 'phone' };
    S.swatches = [gen.COL.orange, gen.COL.teal, '#4A4E57', gen.COL.blue].map((c, i) => gen.add('marker', [[46 + i * 112, 690], [124 + i * 112, 686]], Object.assign({ w: 60, th: 17, nib: 1.45, color: c, alpha: .8, dur: 2 }, pb)));
    gen.seq(S.swatches, S.hit + 4, .8);
    // 手机两边：三大笔色块（和手机里的三种颜色是同一支笔）
    S.blobs = [[gen.COL.orange, 330, 260], [gen.COL.teal, 1600, 330], ['#4A4E57', 1570, 760]].map(([c, x, y], i) => gen.add('marker', [[x - 300, y + 40], [x, y + 6], [x + 300, y - 30]], { w: 110, th: 30, nib: 1.45, color: c, alpha: .82, dur: 4.5, t0: S.hit + 6 + i * 3, layer: 'deco', sheen: 1.2, taper: .7 }));
    S.taps = []; S.cards = [];
    const colors = [gen.COL.orange, gen.COL.teal, '#4A4E57']; let tc = S.hit + 10;
    colors.forEach((c, k) => { const name = 'card' + k; const cc = gen.car({ x: 254, y: 560, s: .34, color: c, t0: tc, rate: .38, hop: .07, G: f => G[name](f), vclip: S.PHCLIP, layer: 'phone', pencil: false, sweepColor: k === 2 ? gen.COL.yellow : gen.COL.blue, dotGap: 1.2 });
      S.cards.push({ name, t0: tc, end: cc.end, dots: cc.dots }); if (k < colors.length - 1) { const tap = cc.end + 4; S.taps.push({ t: tap, sw: k + 1 }); tc = tap + 8; } });
    S.T_PROG = S.cards[2].end + 4;
    S.prog = gen.add('marker', [[40, 1004], [470, 1000]], Object.assign({ w: 30, th: 9, nib: 1.45, color: gen.COL.orange, alpha: .85, dur: 16, t0: S.T_PROG, prof: 'even' }, pb));
    const TAPS = S.taps.map(t => t.t);
    const ss = t => (t = Math.min(1, Math.max(0, t)), t * t * t * (t * (6 * t - 15) + 10));
    const cardX = (k, f) => { const inn = k === 0 ? -1e9 : TAPS[k - 1] + 2, outt = k < TAPS.length ? TAPS[k] + 2 : 1e9; return PH.sw * (1 - ss((f - inn) / 12)) * (k === 0 ? 0 : 1) - PH.sw * ss((f - outt) / 12); };
    S.cards.forEach((c, k) => { G[c.name] = f => INK.mul(G.phone(f), [1, 0, 0, 1, cardX(k, f), 0]); });
    S.dots = S.cards.flatMap(c => c.dots);
    const CW = [ox + (PH.inset + 254) * sc, oy + (PH.inset + 520) * sc];
    S.cam = [[S.hit - 20, 960, 540, .98, -4], [S.hit + 20, CW[0], CW[1] + 40, 1.32, -2], [TAPS[1] + 4, CW[0], CW[1] + 60, 1.42, 1], [S.T_PROG + 4, 960, 600, 1.12, 0], [S.end - 4, 960, 560, 1.04, 2]];
  });

  // ================= 06 一支笔：橙色底，整屏大字 =================
  scene(5, (S, gen, G) => {
    S.T_WAVE = 1e9; S.LG = [];
    const lt = gen.letters('MARKER', 150, 200, 340, { dur: 4, tool: 'giantBlack', layer: 'paper', w: 92, th: 22, letterG: (i, cx, by) => { const g = f => hopM(f, S.T_WAVE + i * 4, cx, by, { H: 90, dur: 16 }); S.LG[i] = g; return g; } });
    let t = gen.seq(lt, S.hit + 2, .9);
    // 白：每个字母的左边一道高光
    const hl = [[150 + 20, 230, 150 + 34, 520], [150 + 92 * 3.4 + 40, 300, 150 + 92 * 3.4 + 90, 260], [150 + (92 + 84) * 3.4 + 20, 240, 150 + (92 + 84) * 3.4 + 20, 510], [150 + (92 + 84 + 80) * 3.4 + 20, 240, 150 + (92 + 84 + 80) * 3.4 + 20, 510], [150 + (92 + 84 + 80 + 80) * 3.4 + 20, 240, 150 + (92 + 84 + 80 + 80) * 3.4 + 20, 510], [150 + (92 + 84 + 80 + 80 + 82) * 3.4 + 20, 240, 150 + (92 + 84 + 80 + 80 + 82) * 3.4 + 20, 510]];
    const wh = hl.map(([a, b, c, d], i) => gen.add('white', [[a, b], [a + (c - a) * .4, b + (d - b) * .4]], { G: f => S.LG[i](f), w: 6, color: '#FFFDF7', alpha: .95, dur: 2.2, prof: 'flick', layer: 'paper' }));
    S.T_WHITE = t + 4; t = gen.seq(wh, S.T_WHITE, .9);
    S.dots = [[150 + 30, 236, 9, 0], [150 + (92 + 84) * 3.4 + 26, 246, 8, 2], [150 + (92 + 84 + 80 + 80 + 82) * 3.4 + 26, 246, 9, 5]].map((d, i) => ({ p: [d[0], d[1]], r: d[2], t: t + 2 + i * BEAT / 2, G: f => S.LG[d[3]](f) }));
    S.T_WAVE = t + 2 + 3 * BEAT / 2 + 4;
    S.T_TEXT = t + 6;
    S.cam = [[S.hit - 20, 900, 400, 1.3, -4], [S.hit + 50, 1000, 420, 1.15, -1], [S.T_TEXT, 960, 540, 1.02, 0], [END, 960, 540, 1.0, 0]];
  });

  const ALL = SC.flatMap(s => s.all);
  return { SC, BEAT, BAR, HITS, CAP, END, ALL, NAMES };
})();
