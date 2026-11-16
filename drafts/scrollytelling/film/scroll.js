const W = 1920, H = 1080, BEAT = 30, END = 300, VH = 1080;
const cv = document.getElementById('c'), x = cv.getContext('2d');
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (v, a, b) => clamp((v - a) / (b - a));
const ss = t => (t = clamp(t), t * t * t * (t * (6 * t - 15) + 10));
const eout = t => 1 - Math.pow(1 - clamp(t), 3);
const mix = (c1, c2, t) => { const a = c1.match(/\w\w/g).map(h => parseInt(h, 16)), b = c2.match(/\w\w/g).map(h => parseInt(h, 16)); return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t))).join(',')})`; };
const INK = '#111214', BLUE = '#2F5BFF', ORA = '#FF5B1F';

// ---------- 滚动：几次“甩”，每次 = 手指拖动 r 秒 + 松手后指数减速（τ）----------
const TAU = 0.42, R = 0.12;
// 速度最快的时刻（松手那一刻）落在拍点上；第一次在第 0 帧之前就开始了，所以第 0 帧已经在动
const FLICKS = [[-12, .42], [48, .62], [108, .66], [168, .86], [228, .92]];   // [松手帧, 这一甩滑多远（视口高）]
const g = u => u <= 0 ? 0 : u < R ? u * u / (2 * R) : u - R / 2;      // 拖动段：速度从 0 平滑升上去
function scrollAt(f) {
  let y = 0;
  for (const [t0, D] of FLICKS) { const u = (f - t0) / 60 + R; if (u > 0) y += D * (1 - Math.exp(-g(u) / TAU)) / (1 - Math.exp(-(R / 2) / TAU) * 0 + 0); }
  return y;
}
const velAt = f => (scrollAt(f + .5) - scrollAt(f - .5)) * 60;          // 视口高 / 秒

// ---------- 产品：五层，等距 3D ----------
const LAYERS = [
  { name: '玻璃', en: 'GLASS', spec: '0.6 mm · 透光 92%', top: 'rgba(210,225,248,.55)', side: 'rgba(170,190,220,.7)', h: 6 },
  { name: '屏幕', en: 'DISPLAY', spec: '2400 × 1080 · 420 ppi', top: '#0E1116', side: '#05070A', h: 8, screen: true },
  { name: '中框', en: 'FRAME', spec: '铝 · 7.8 mm', top: '#C9CCD1', side: '#9A9EA5', h: 16, frame: true },
  { name: '电池', en: 'BATTERY', spec: '4000 mAh', top: '#2A2C30', side: '#17181B', h: 12, battery: true },
  { name: '背板', en: 'BACK', spec: '磨砂玻璃 · 橙', top: '#FF6A2E', side: '#D9480F', h: 8 },
];
function rrect(w, d, r, n = 8) {   // 圆角矩形的轮廓点（XZ 平面）
  const pts = [], cs = [[w / 2 - r, d / 2 - r, 0], [-w / 2 + r, d / 2 - r, Math.PI / 2], [-w / 2 + r, -d / 2 + r, Math.PI], [w / 2 - r, -d / 2 + r, Math.PI * 1.5]];
  for (const [cx, cz, a0] of cs) for (let i = 0; i <= n; i++) { const a = a0 + i / n * Math.PI / 2; pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); }
  return pts;
}
const OUT = rrect(300, 620, 52);
function proj(px, py, pz, cam) {
  const c = Math.cos(cam.yaw), s = Math.sin(cam.yaw);
  const X = px * c - pz * s, Z = px * s + pz * c;
  const ct = Math.cos(cam.tilt), st = Math.sin(cam.tilt);
  return [cam.cx + X * cam.k, cam.cy - (py * ct - Z * st) * cam.k, Z * ct + py * st];
}
function drawPlate(L, y, cam, alpha = 1) {
  const top = OUT.map(([a, b]) => proj(a, y + L.h, b, cam)), bot = OUT.map(([a, b]) => proj(a, y, b, cam));
  x.globalAlpha = alpha;
  // 侧面：只画朝向镜头的那几段
  for (let i = 0; i < OUT.length; i++) { const j = (i + 1) % OUT.length; const a = bot[i], b = bot[j];
    if ((b[0] - a[0]) * 1 < 0 && a[1] + b[1] < 0) continue;
    x.fillStyle = L.side; x.beginPath(); x.moveTo(top[i][0], top[i][1]); x.lineTo(top[j][0], top[j][1]); x.lineTo(b[0], b[1]); x.lineTo(a[0], a[1]); x.closePath(); x.fill(); }
  x.fillStyle = L.top; x.beginPath(); top.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.fill();
  // 细节
  const inner = (w, d, r, yy) => rrect(w, d, r).map(([a, b]) => proj(a, yy, b, cam));
  const poly = (ps, fs, ss_) => { x.beginPath(); ps.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); if (fs) { x.fillStyle = fs; x.fill(); } if (ss_) { x.strokeStyle = ss_; x.stroke(); } };
  if (L.screen) { const ps = inner(276, 596, 42, y + L.h + .1); const c0 = proj(-138, y + L.h, -298, cam), c1 = proj(138, y + L.h, 298, cam);
    const gr = x.createLinearGradient(c0[0], c0[1], c1[0], c1[1]); gr.addColorStop(0, '#3D6BFF'); gr.addColorStop(.5, '#9A5BFF'); gr.addColorStop(1, '#FF7A3D'); poly(ps, gr); }
  if (L.frame) { poly(inner(270, 590, 40, y + L.h + .1), '#E6E8EB'); poly(inner(250, 570, 34, y + L.h + .2), null, 'rgba(0,0,0,.15)'); }
  if (L.battery) { poly(inner(200, 380, 14, y + L.h + .1), '#3A3D42'); const p = proj(0, y + L.h + .2, 0, cam); x.fillStyle = 'rgba(255,255,255,.7)'; x.font = `${14 * cam.k}px GM`; x.textAlign = 'center'; x.fillText('Li-ion', p[0], p[1]); }
  if (L.top.startsWith('rgba(210')) { const a = proj(-120, y + L.h, -300, cam), b = proj(40, y + L.h, 300, cam); x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 2; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); }
  // 顶面的高光边
  x.strokeStyle = L.top.startsWith('rgba(210') ? 'rgba(90,120,170,.8)' : 'rgba(255,255,255,.35)'; x.lineWidth = L.top.startsWith('rgba(210') ? 1.5 : 1; x.beginPath(); top.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.stroke();
  x.globalAlpha = 1;
  return top;
}

// ---------- 页面 ----------
// 页面的段落（单位：视口高）：01 开场 0—1 钉住；02 拆解 1—3 钉住；03 揭示 3—4
const SEC = [{ id: '01', name: 'HERO', a: 0, b: 1.0, pin: true }, { id: '02', name: '拆解 EXPLODE', a: 1.0, b: 3.0, pin: true }, { id: '03', name: '揭示 REVEAL', a: 3.0, b: 4.2, pin: false }];
const PAGE = 4.2, REVEAL = { cx: 0, cy: 0, r: 0 };
function page(f) {
  const sc = scrollAt(f);
  const p1 = prog(sc, 0, 1), p2 = prog(sc, 1, 2.9), p3 = prog(sc, 2.55, 3.5);
  // 背景色跟着滚动接力：暖白 → 冷白
  x.fillStyle = mix('F4F2EE', 'E8EDF4', ss(prog(sc, .6, 1.6))); x.fillRect(0, 0, W, H);
  // —— 01 开场：大标题被滚动缩小、推上去 ——
  const hy = 330 - 230 * ss(p1) - Math.max(0, sc - 1) * VH;
  const hs = lerp(1, .6, ss(p1));
  if (hy > -300) {
    x.save(); x.translate(780, hy); x.scale(hs, hs); x.textAlign = 'center';
    x.fillStyle = INK; x.font = '190px NSK'; x.fillText('滚动叙事', 0, 0);
    x.font = '64px ID'; x.fillStyle = mix('111214', '7A7D85', p1); x.fillText('Scrollytelling', 0, 92);
    x.restore();
    x.textAlign = 'center'; x.font = '30px NSM'; x.fillStyle = `rgba(17,18,20,${.65 * (1 - ss(prog(p1, .2, .6)))})`;
    x.fillText('时间，就是滚动的距离', 780, hy + 170 * hs);
  }
  // —— 舞台上的产品：开场时从下面升上来，02 段里按滚动拆开 ——
  const rise = ss(prog(sc, -.9, 1.0));
  const cam = { cx: lerp(780, 700, ss(p2)), cy: lerp(1280, lerp(700, 610, ss(p2)), rise), k: lerp(.8, lerp(1.0, .76, ss(p2)), rise), yaw: lerp(-.95, -.62, ss(prog(sc, 0, 3))), tilt: lerp(.82, .5, ss(p2)) };
  const n = LAYERS.length, tops = [];
  let y = -40;
  for (let i = n - 1; i >= 0; i--) {                              // 从底往上画：背板在最下
    const L = LAYERS[i], k = n - 1 - i;
    const pi = ss(prog(p2 * 1.5 - (n - 1 - k) * .1, 0, 1));          // 上面的层先走，下面的层晚一点（层层错开）
    const yy = y + pi * (n - 1 - k) * 0 + k * 0;
    tops[i] = { L, y: -60 + k * 16 + pi * k * 0 };
  }
  // 位置：每层的高度 = 静止叠放 + 拆开的距离（越上面的层拆得越高）
  const base = -50;
  let acc = base;
  const ys = [];
  for (let k = 0; k < n; k++) { const i = n - 1 - k; const L = LAYERS[i]; ys[i] = acc; acc += L.h; }
  const ex = [];
  for (let i = 0; i < n; i++) { const k = n - 1 - i; const pi = ss(prog(p2 * 1.6 - i * .13, 0, 1)); ex[i] = ys[i] + pi * k * 175 - pi * 330; }
  // 阴影
  const sh = proj(0, base - 30, 0, cam);
  const sg = x.createRadialGradient(sh[0], sh[1] + 40, 10, sh[0], sh[1] + 40, 360); sg.addColorStop(0, 'rgba(30,40,60,.22)'); sg.addColorStop(1, 'rgba(30,40,60,0)');
  x.fillStyle = sg; x.beginPath(); x.ellipse(sh[0], sh[1] + 40, 380, 150, 0, 0, 7); x.fill();
  const topPts = [];
  for (let i = n - 1; i >= 0; i--) topPts[i] = drawPlate(LAYERS[i], ex[i], cam);
  // 每层的标注：拆开到一定程度才画（先线，再字），文字跟着滚动速度走
  for (let i = 0; i < n; i++) {
    const a = ss(prog(p2 * 1.6 - i * .13, .55, .9)); if (a <= 0) continue;
    const L = LAYERS[i], p = [[150, 310], [150, -310], [-150, 310], [-150, -310]].map(([a, b]) => proj(a * .82, ex[i] + L.h, b * .82, cam)).sort((u, v) => v[0] - u[0])[0];   // 从屏幕上最靠右的角引出，线不穿过产品
    const tx = 1150, ty = p[1] - 6;
    x.strokeStyle = `rgba(47,91,255,${a})`; x.lineWidth = 1.5; x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(lerp(p[0], tx - 14, a), ty); x.stroke();
    x.fillStyle = BLUE; x.beginPath(); x.arc(p[0], p[1], 4, 0, 7); x.fill();
    x.globalAlpha = ss(prog(a, .5, 1)); x.textAlign = 'left';
    x.fillStyle = INK; x.font = '34px NSB'; x.fillText(L.name, tx, ty + 6);
    x.fillStyle = '#5B5F68'; x.font = '19px GM'; x.fillText(L.spec, tx + 86, ty + 4);
    x.globalAlpha = 1;
  }
  // —— 02 段里的说明块：不钉住，按正常滚动速度从舞台前面经过 ——
  const blocks = [[1.55, '一层一层拆开', '进度 = (scrollY − 起点) ÷ 段长'], [2.35, '上面的层先走', '每层晚 0.13 · 层层错开']];
  for (const [py, t1, t2] of blocks) {
    const vy = (py - sc) * VH + 540;
    if (vy < -200 || vy > H + 200) continue;
    x.textAlign = 'left'; x.fillStyle = INK; x.font = '54px NSK'; x.fillText(t1, 120, vy);
    x.fillStyle = BLUE; x.font = '20px GM'; x.fillText(t2, 122, vy + 44);
  }
  // —— 03 揭示：圆形遮罩从产品中心张开（半径挂在滚动上）——
  REVEAL.r = 0;
  if (p3 > 0) {
    const c = proj(0, 0, 0, cam), r = Math.hypot(W, H) * 1.05 * Math.pow(p3, 1.4);   // 起步慢：圆的大部分面积在屏幕外，按面积线性长会在前几帧就盖住半屏
    REVEAL.cx = c[0]; REVEAL.cy = c[1]; REVEAL.r = r;
    x.save(); x.beginPath(); x.arc(c[0], c[1], r, 0, 7); x.clip();
    x.fillStyle = '#0B0C0F'; x.fillRect(0, 0, W, H);
    x.save(); x.translate(0, 160 - (sc - 2.85) * VH * .55);      // 揭示后的字：以 0.55 倍滚动速度往上走（视差）
    x.textAlign = 'left'; x.fillStyle = '#FFFFFF'; x.font = '150px NSK'; x.fillText('一个场景', 120, 470);
    x.font = '210px ID'; x.fillStyle = ORA; x.fillText('150vh', 112, 690);
    x.font = '24px GM'; x.fillStyle = 'rgba(255,255,255,.75)';
    x.fillText('position: sticky; top: 0;', 124, 790);
    x.fillText('animation-timeline: view();', 124, 828);
    x.restore(); x.restore();
  }
  return sc;
}

// ---------- 讲解层：整页缩略图 + 速度曲线 ----------
function guide(f, sc, dk = false) {
  const T1 = dk ? '#FFFFFF' : '#111214', T2 = dk ? 'rgba(255,255,255,.65)' : '#5B5F68';
  const MX = 1640, MY = 170, MW = 200, MH = 760, k = MH / PAGE;
  const dark = ss(prog(sc, 2.85, 3.55)) > .5 && false;
  x.textAlign = 'left'; x.font = '18px GM'; x.fillStyle = T2; x.fillText('整页 · 420vh', MX, MY - 24);
  for (const s of SEC) {
    const y0 = MY + s.a * k, y1 = MY + s.b * k;
    x.fillStyle = s.pin ? 'rgba(47,91,255,.10)' : 'rgba(17,18,20,.05)'; x.fillRect(MX, y0, MW, y1 - y0 - 3);
    x.fillStyle = s.pin ? BLUE : T2; x.font = '18px GM'; x.fillText(s.id, MX + 10, y0 + 26);
    x.font = '17px GM'; x.fillText(Math.round((s.b - s.a) * 100) + 'vh', MX + 10, y0 + 50);
    if (s.pin) { x.fillStyle = BLUE; x.fillRect(MX - 10, y0, 3, y1 - y0 - 3); x.font = '15px GM'; x.fillText('STICKY', MX + 10, y1 - 16); }
  }
  // 视口
  const vy = MY + sc * k;
  x.strokeStyle = ORA; x.lineWidth = 2.5; x.strokeRect(MX - 4, vy, MW + 8, k);
  x.fillStyle = ORA; x.font = '16px GM'; x.textAlign = 'right'; x.fillText('视口', MX - 30, vy + 20);
  x.fillStyle = T1; x.fillText('y ' + Math.round(sc * VH), MX - 30, vy + 42); x.textAlign = 'left';
  // 速度曲线（最近 2 秒）
  const GX = 120, GY = 960, GW = 420, GH = 70;
  x.strokeStyle = dk ? 'rgba(255,255,255,.3)' : 'rgba(17,18,20,.25)'; x.lineWidth = 1; x.beginPath(); x.moveTo(GX, GY); x.lineTo(GX + GW, GY); x.stroke();
  x.strokeStyle = ORA; x.lineWidth = 2; x.beginPath();
  for (let i = 0; i <= 120; i++) { const ff = f - 120 + i, v = velAt(ff), px = GX + i / 120 * GW, py = GY - v / 2.6 * GH; i ? x.lineTo(px, py) : x.moveTo(px, py); }
  x.stroke();
  const v = velAt(f); x.fillStyle = ORA; x.beginPath(); x.arc(GX + GW, GY - v / 2.6 * GH, 5, 0, 7); x.fill();
  x.fillStyle = T1; x.font = '20px GM'; x.textAlign = 'left';
  x.fillText('滚动速度  v = v₀ · e^(−t / 0.42s)', GX, GY + 34);
  x.fillStyle = T2; x.fillText((v * VH).toFixed(0).padStart(5, ' ') + ' px/s', GX + GW + 18, GY - v / 2.6 * GH + 6);
  // 外框
  x.fillStyle = T1; x.font = '20px GM'; x.fillText('布局 · SCROLLYTELLING', 64, 70);
  x.textAlign = 'right'; x.fillText('2012 — 今天', W - 64, 70);
  x.fillStyle = 'rgba(17,18,20,.12)'; x.fillRect(W - 284, 86, 220, 3); x.fillStyle = ORA; x.fillRect(W - 284, 86, 220 * (.03 + .97 * f / END * .25), 3);
}

window.frame = async f => {
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1;
  const sc = page(f);
  guide(f, sc);
  // 揭示的圆里，讲解层换成白字
  if (REVEAL.r > 0) { x.save(); x.beginPath(); x.arc(REVEAL.cx, REVEAL.cy, REVEAL.r, 0, 7); x.clip(); guide(f, sc, true); x.restore(); }
};
window.events = () => {
  const n = LAYERS.length, ev = { sep: [], label: [], block: [], reveal: null };
  const lay = (f, i, lo) => prog(prog(scrollAt(f), 1, 2.9) * 1.6 - i * .13, lo, lo === 0 ? 1 : .9);
  for (let f = -30; f < END; f++) {
    for (let i = 0; i < n; i++) {
      if (lay(f, i, 0) > .02 && lay(f - 1, i, 0) <= .02) ev.sep.push({ t: f, i });
      if (prog(prog(scrollAt(f), 1, 2.9) * 1.6 - i * .13, .55, .9) > .5 && prog(prog(scrollAt(f - 1), 1, 2.9) * 1.6 - i * .13, .55, .9) <= .5) ev.label.push({ t: f, i, n: LAYERS[i].name.length + LAYERS[i].spec.length });
    }
    for (const py of [1.55, 2.35]) { const vy = s => (py - scrollAt(s)) * VH + 540; if (vy(f) < H - 60 && vy(f - 1) >= H - 60) ev.block.push({ t: f }); }
    if (ev.reveal === null && prog(scrollAt(f), 2.55, 3.5) > 0) ev.reveal = f;
  }
  return { end: END, beat: BEAT, flicks: FLICKS.map(([t, d]) => ({ t, d })), ...ev };
};
Promise.all(['190px NSK', '64px ID', '30px NSM', '54px NSK', '20px GM', '30px NSB'].map(s => document.fonts.load(s))).then(() => { window.ready = true; });
