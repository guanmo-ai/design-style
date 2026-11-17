// 厚涂 v3 · 另外三幅画的“参考帧”（第一幅雨夜红伞用 PAINT.ref）。都是 1920 × 1080 的普通画布：形和光对了就行，笔触交给 PAINT。
// 每幅还带一个 def(X, Y, nz)：没有边的地方笔往哪个方向走；edge(X, Y)：边的方向占多大权重。
const REFS = (() => {
  const { rng, makeNoise, fbm, clamp, lerp, smooth, canvas } = HD;
  const W = 1920, H = 1080;
  const mk = () => { const c = canvas(W, H); return [c, c.getContext('2d')]; };
  const lg = (g, x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  const rg = (g, x, y, r0, r1, stops) => { const gr = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  const blob = (g, x, y, rx, ry, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); };

  // ② 麦田 · 金色的傍晚：低处的太阳、打旋的云、风吹出一道道麦浪、一条斜穿的小路、近处的麦穗和几朵虞美人
  function wheat() {
    const [c, g] = mk(), r = rng(11), n = makeNoise(12), HZ = 590, SUN = [1330, 470];
    g.fillStyle = lg(g, 0, 0, 0, HZ, [[0, '#1d4f86'], [.35, '#3f86b0'], [.62, '#9cc7c4'], [.82, '#f2d08a'], [1, '#ffcf73']]); g.fillRect(0, 0, W, HZ + 10);
    g.fillStyle = rg(g, SUN[0], SUN[1], 0, 900, [[0, 'rgba(255,244,200,1)'], [.12, 'rgba(255,214,120,.85)'], [.4, 'rgba(255,170,80,.25)'], [1, 'rgba(255,170,80,0)']]); g.fillRect(0, 0, W, HZ + 10);
    // 云：一条条横的，底下被太阳照成橙，上沿冷
    for (let i = 0; i < 26; i++) { const y = 80 + r() * 380, x = r() * W, w = 160 + r() * 420, h = 18 + r() * 34, warm = clamp((y - 120) / 340);
      blob(g, x, y, w, h, `rgba(${lerp(70, 255, warm)},${lerp(110, 170, warm)},${lerp(160, 110, warm)},.75)`); blob(g, x - w * .1, y - h * .35, w * .8, h * .5, `rgba(${lerp(200, 255, warm)},${lerp(220, 230, warm)},${lerp(235, 190, warm)},.7)`); }
    g.fillStyle = '#fff6d8'; g.beginPath(); g.arc(SUN[0], SUN[1], 46, 0, 7); g.fill();
    // 远处的树林和一间农舍
    g.fillStyle = '#2f4a52'; g.beginPath(); g.moveTo(0, HZ); for (let x = 0; x <= W; x += 8) g.lineTo(x, HZ - 22 - (fbm(n, x * .003, 1, 2) * .5 + .5) * 46 - Math.abs(Math.sin(x * .021)) * 14 - (x < 500 ? 24 : 0)); g.lineTo(W, HZ + 4); g.lineTo(0, HZ + 4); g.fill();
    g.fillStyle = '#c47a4a'; g.fillRect(380, HZ - 40, 70, 34); g.fillStyle = '#7a3a2a'; g.beginPath(); g.moveTo(370, HZ - 40); g.lineTo(415, HZ - 70); g.lineTo(460, HZ - 40); g.fill();
    // 麦田：近亮远暗，风吹出的麦浪（沿着地面拉长的亮暗带）
    const im = g.getImageData(0, HZ, W, H - HZ), d = im.data;
    for (let y = 0; y < H - HZ; y++) for (let x = 0; x < W; x++) {
      const Y = y + HZ, z = 300 / Math.max(2, Y - HZ + 4), wx = (x - 960) * z;
      const wave = fbm(n, wx * .0009 + z * .05, z * .7, 3) + .25 * Math.sin(z * 2.2 + wx * .002), band = smooth(-.15, .45, wave);
      const near = clamp((Y - HZ) / (H - HZ)), sunSide = Math.exp(-((x - SUN[0]) ** 2) / (2 * 420 ** 2)) * (1 - near);
      let R = lerp(232, 196, near), G = lerp(168, 120, near), B = lerp(70, 34, near);
      R = lerp(R * .78, R * 1.08, band) + sunSide * 30; G = lerp(G * .74, G * 1.06, band) + sunSide * 26; B = lerp(B * .7, B, band);
      const k = (y * W + x) * 4; d[k] = R; d[k + 1] = G; d[k + 2] = B; d[k + 3] = 255;
    }
    g.putImageData(im, 0, HZ);
    // 小路：从右下斜到远处
    g.fillStyle = lg(g, 0, HZ, 0, H, [[0, 'rgba(230,200,150,.7)'], [1, 'rgba(210,170,110,.95)']]);
    g.beginPath(); g.moveTo(1500, H); g.bezierCurveTo(1300, 860, 1050, 700, 900, HZ + 4); g.lineTo(930, HZ + 4); g.bezierCurveTo(1120, 700, 1440, 860, 1760, H); g.fill();
    // 近处的麦穗（竖线 + 穗）和虞美人
    for (let i = 0; i < 260; i++) { const x = r() * W, y = H - r() * 200, h = 60 + r() * 150, lean = (r() - .3) * 30;
      g.strokeStyle = `rgba(${150 + r() * 60},${100 + r() * 40},40,.9)`; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y + 40); g.quadraticCurveTo(x + lean * .4, y - h * .5, x + lean, y - h); g.stroke();
      g.fillStyle = `rgb(${235 + r() * 20},${180 + r() * 40},${70 + r() * 30})`; g.beginPath(); g.ellipse(x + lean, y - h - 12, 6, 18, lean * .02, 0, 7); g.fill(); }
    for (let i = 0; i < 40; i++) { const x = r() * W, y = HZ + 120 + Math.pow(r(), .6) * (H - HZ - 120), s = 4 + (y - HZ) / 40; blob(g, x, y, s, s * .8, '#d8321f'); blob(g, x - s * .3, y - s * .3, s * .4, s * .3, '#ff6a3a'); }
    // 乌鸦
    for (let i = 0; i < 7; i++) { const x = 700 + r() * 600, y = 160 + r() * 160, s = 10 + r() * 8; g.strokeStyle = '#1a1c24'; g.lineWidth = 4; g.beginPath(); g.moveTo(x - s, y - s * .4); g.quadraticCurveTo(x - s * .4, y - s * .6, x, y); g.quadraticCurveTo(x + s * .4, y - s * .6, x + s, y - s * .4); g.stroke(); }
    const def = (X, Y, nz) => Y < HZ - 10 ? fbm(nz, X * .0022, Y * .0035, 3) * 2.2 + Math.sin(X * .004 + Y * .006) * .5 : Y < HZ + 20 ? 0 : Math.PI / 2 - .25 + fbm(nz, X * .004, Y * .004, 2) * .5;
    return { c, def, edge: (X, Y) => Y < HZ ? .3 : .45, focus: [SUN[0], SUN[1] + 60], name: 'wheat' };
  }

  // ③ 海浪 · 正午：一道卷起来的浪，浪尖透着绿光，白沫往上炸；远处平的海和积云
  function wave() {
    const [c, g] = mk(), r = rng(21), n = makeNoise(22), HZ = 420;
    g.fillStyle = lg(g, 0, 0, 0, HZ, [[0, '#2f76c4'], [.6, '#7fb8e6'], [1, '#d6ecf6']]); g.fillRect(0, 0, W, HZ + 4);
    for (let i = 0; i < 9; i++) { const x = 80 + r() * 900, y = 250 + r() * 120, w = 120 + r() * 200; for (let k = 0; k < 6; k++) blob(g, x + (r() - .5) * w, y - r() * 70, w * (.3 + r() * .3), 30 + r() * 30, k < 3 ? '#a9bfd8' : '#f6f8fb'); }
    g.fillStyle = lg(g, 0, HZ, 0, H, [[0, '#2a6f9a'], [.3, '#1c557c'], [1, '#0f3552']]); g.fillRect(0, HZ, W, H - HZ);
    for (let i = 0; i < 160; i++) { const y = HZ + Math.pow(r(), 1.5) * (H - HZ), x = r() * W, w = 20 + (y - HZ) * .4; g.fillStyle = `rgba(200,230,240,${.25 + r() * .3})`; g.fillRect(x, y, w, 2 + (y - HZ) * .01); }
    // 浪身：从左往右涨起来，在右边卷过来
    const body = new Path2D(); body.moveTo(-20, 900); body.bezierCurveTo(300, 820, 700, 640, 1000, 470); body.bezierCurveTo(1200, 350, 1440, 300, 1560, 380);
    body.bezierCurveTo(1660, 450, 1640, 560, 1560, 600); body.bezierCurveTo(1500, 630, 1460, 600, 1470, 560); body.bezierCurveTo(1340, 640, 1300, 800, 1380, 960); body.lineTo(1940, 1100); body.lineTo(-20, 1100); body.closePath();
    g.fillStyle = lg(g, 900, 360, 1200, 980, [[0, '#4fd2c4'], [.25, '#1f9aa4'], [.6, '#0e5f7c'], [1, '#08364e']]); g.fill(body);
    // 管道里面：暗
    g.fillStyle = rg(g, 1500, 520, 10, 160, [[0, '#06283c'], [1, 'rgba(8,54,78,0)']]); g.beginPath(); g.ellipse(1510, 540, 120, 90, -.3, 0, 7); g.fill();
    // 浪面上的白沫纹：顺着浪往下拉
    for (let i = 0; i < 70; i++) { const t = r(), x0 = lerp(200, 1450, t), y0 = lerp(860, 420, t) + r() * 160; g.strokeStyle = `rgba(230,250,250,${.35 + r() * .4})`; g.lineWidth = 2 + r() * 5;
      g.beginPath(); g.moveTo(x0, y0); g.bezierCurveTo(x0 + 40, y0 + 60, x0 - 30, y0 + 140, x0 + 20, y0 + 200 + r() * 100); g.stroke(); }
    // 浪尖的白沫 + 往上炸的水花
    for (let i = 0; i < 260; i++) { const t = r(), x = lerp(980, 1640, t) + (r() - .5) * 60, y = (t < .85 ? lerp(470, 330, Math.sin(t / .85 * Math.PI / 2)) : lerp(330, 520, (t - .85) / .15)) + (r() - .5) * 50, s = 10 + r() * 34;
      blob(g, x, y, s, s * .8, r() < .3 ? '#d4ece8' : '#ffffff'); }
    for (let i = 0; i < 240; i++) { const a = -Math.PI / 2 + (r() - .3) * 1.6, d = 40 + r() * 260, x = 1380 + (r() - .5) * 340 + Math.cos(a) * d, y = 330 + Math.sin(a) * d * .9; blob(g, x, y, 3 + r() * 10, 3 + r() * 9, `rgba(255,255,255,${.5 + r() * .5})`); }
    // 前景：碎掉的白沫铺满
    for (let i = 0; i < 500; i++) { const x = r() * W, y = 930 + r() * 170, s = 14 + r() * 40; blob(g, x, y, s * 1.6, s * .5, r() < .4 ? '#bfe0e0' : '#f2fbfa'); }
    for (let i = 0; i < 300; i++) { const x = r() * W, y = 900 + r() * 200; blob(g, x, y, 8 + r() * 24, 3 + r() * 6, '#2a7f94'); }
    const def = (X, Y, nz) => Y < HZ ? fbm(nz, X * .002, Y * .003, 2) * .4 : Y > 930 ? fbm(nz, X * .004, Y * .01, 2) * .6 : -.5 + fbm(nz, X * .003, Y * .003, 2) * .6;
    return { c, def, edge: (X, Y) => Y < HZ ? .4 : .9, focus: [1400, 430], name: 'wave' };
  }

  // ④ 雪山 · 黎明：太阳从右边刚出来，亮面是粉橙，影子是蓝紫；山腰一条云海；近处一排松林
  function peak() {
    const [c, g] = mk(), r = rng(31), n = makeNoise(32);
    g.fillStyle = lg(g, 0, 0, 0, 760, [[0, '#3a3f86'], [.35, '#8a6aa8'], [.62, '#e99aa0'], [.85, '#ffc9a0'], [1, '#ffe2bc']]); g.fillRect(0, 0, W, H);
    g.fillStyle = rg(g, 1760, 600, 0, 700, [[0, 'rgba(255,236,190,.9)'], [.3, 'rgba(255,190,150,.35)'], [1, 'rgba(255,190,150,0)']]); g.fillRect(0, 0, W, H);
    // 山：主峰在中偏左，山脊线左暗右亮
    const ridge = x => { const u = (x - 820) / 760; return 170 + Math.abs(u) ** 1.25 * 560 - (fbm(n, x * .008, 3, 4) - .5) * 70 + (x > 1300 ? Math.sin((x - 1300) * .012) * 40 : 0); };
    const M = new Path2D(); M.moveTo(-20, 900); for (let x = -20; x <= W + 20; x += 6) M.lineTo(x, Math.min(900, ridge(x))); M.lineTo(W + 20, 900); M.closePath();
    g.fillStyle = '#4a5c9e'; g.fill(M);
    g.save(); g.clip(M);
    // 亮面：从峰顶往右下的锯齿分界
    const L = new Path2D(); let x = 820, y = 160; L.moveTo(x, y); while (y < 900) { y += 18 + r() * 26; x += 6 + r() * 30 - (r() < .3 ? 30 : 0); L.lineTo(x, y); } L.lineTo(W + 40, 900); L.lineTo(W + 40, 0); L.lineTo(820, 0); L.closePath();
    g.fillStyle = lg(g, 820, 160, 1600, 900, [[0, '#ffe0c8'], [.4, '#f6a98a'], [1, '#c77f88']]); g.fill(L);
    // 沟：一道道斜的暗 / 亮
    for (let i = 0; i < 90; i++) { const x0 = 300 + r() * 1300, y0 = ridge(x0) + 20 + r() * 260, len = 40 + r() * 140, lit = x0 > 820 + (y0 - 160) * .4;
      g.strokeStyle = lit ? `rgba(150,90,120,${.3 + r() * .3})` : `rgba(30,40,90,${.3 + r() * .3})`; g.lineWidth = 3 + r() * 6; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + (x0 > 820 ? 1 : -1) * len * .5, y0 + len); g.stroke(); }
    // 雪线以下：岩石和林子的冷色
    g.fillStyle = lg(g, 0, 600, 0, 900, [[0, 'rgba(60,70,120,0)'], [1, 'rgba(40,52,96,.85)']]); g.fillRect(0, 600, W, 300);
    g.restore();
    // 山腰的云海：粉色的顶、蓝紫的底
    for (let i = 0; i < 70; i++) { const x = r() * W, y = 700 + r() * 60, s = 50 + r() * 90; blob(g, x, y + s * .25, s * 1.6, s * .55, '#9c8ac0'); blob(g, x - s * .2, y, s * 1.3, s * .45, '#f3c6c0'); }
    // 近处的松林：一棵棵深蓝绿的三角，右边被照到一点
    for (let i = 0; i < 70; i++) { const x = r() * W, base = 1000 + r() * 100, h = 180 + r() * 260, w = h * .28;
      g.fillStyle = '#16323a'; g.beginPath(); g.moveTo(x, base - h); g.lineTo(x - w, base); g.lineTo(x + w, base); g.fill();
      g.fillStyle = 'rgba(150,84,96,.55)'; g.beginPath(); g.moveTo(x, base - h); g.lineTo(x + w * .2, base - h * .3); g.lineTo(x + w * .9, base); g.lineTo(x + w, base); g.fill(); }
    g.fillStyle = '#0f2228'; g.fillRect(0, 1060, W, 20);
    const def = (X, Y, nz) => Y < 300 || (Y < ridge(X) - 4) ? fbm(nz, X * .002, Y * .003, 2) * .3 : Y > 900 ? Math.PI / 2 : X < 820 ? 1.15 : 2.0;
    return { c, def, edge: (X, Y) => Y < 900 ? .9 : .6, focus: [960, 380], name: 'peak' };
  }
  // ⑤ 风暴 · 灯塔：铅灰的天在打旋，右边礁石上一座白灯塔，光柱扫过雨幕；巨浪砸在礁石上炸成白沫
  function lighthouse() {
    const [c, g] = mk(), r = rng(41), n = makeNoise(42), HZ = 640, LX = 1430, LY = 300;
    g.fillStyle = lg(g, 0, 0, 0, HZ, [[0, '#0e1a22'], [.45, '#1f3440'], [.8, '#3e5560'], [1, '#56707a']]); g.fillRect(0, 0, W, HZ + 10);
    // 打旋的云：一圈圈深浅
    for (let i = 0; i < 90; i++) { const a = r() * 6.28, d = 120 + r() * 900, x = LX - 500 + Math.cos(a) * d * 1.4, y = 200 + Math.sin(a) * d * .35, w = 120 + r() * 300, h = 20 + r() * 40, lt = r();
      g.save(); g.translate(x, y); g.rotate(a + 1.57); blob(g, 0, 0, w, h, `rgba(${lerp(20, 120, lt)},${lerp(36, 140, lt)},${lerp(44, 148, lt)},.55)`); g.restore(); }
    // 光柱：从灯往左下扫出去，雨幕里亮
    g.save(); g.globalCompositeOperation = 'lighter';
    const bm = g.createLinearGradient(LX, LY, 300, 520); bm.addColorStop(0, 'rgba(255,236,170,.95)'); bm.addColorStop(1, 'rgba(255,236,170,0)');
    g.fillStyle = bm; g.beginPath(); g.moveTo(LX, LY - 6); g.lineTo(100, 330); g.lineTo(160, 720); g.lineTo(LX, LY + 8); g.fill();
    g.fillStyle = rg(g, LX, LY, 0, 260, [[0, 'rgba(255,246,200,1)'], [.2, 'rgba(255,220,140,.6)'], [1, 'rgba(255,200,120,0)']]); g.fillRect(LX - 300, LY - 300, 600, 600);
    g.restore();
    // 远海
    g.fillStyle = lg(g, 0, HZ, 0, H, [[0, '#2b4a52'], [.4, '#16303a'], [1, '#0a1a20']]); g.fillRect(0, HZ, W, H - HZ);
    for (let i = 0; i < 200; i++) { const y = HZ + Math.pow(r(), 1.4) * (H - HZ), x = r() * W, w = 30 + (y - HZ) * .5; g.fillStyle = `rgba(150,190,190,${.15 + r() * .25})`; g.fillRect(x, y, w, 2 + (y - HZ) * .012); }
    // 礁石
    g.fillStyle = '#121a1c'; g.beginPath(); g.moveTo(1180, H); g.lineTo(1220, 720); g.lineTo(1300, 640); g.lineTo(1380, 600); g.lineTo(1520, 590); g.lineTo(1640, 640); g.lineTo(1760, 700); g.lineTo(1920, 760); g.lineTo(1920, H); g.fill();
    g.fillStyle = '#2a3436'; g.beginPath(); g.moveTo(1300, 640); g.lineTo(1380, 600); g.lineTo(1450, 610); g.lineTo(1400, 700); g.fill();
    // 灯塔：白身红条，灯室亮
    const tw = (y) => lerp(54, 36, (700 - y) / 400);
    g.fillStyle = '#d8d4c6'; g.beginPath(); g.moveTo(LX - 58, 610); g.lineTo(LX - 38, 330); g.lineTo(LX + 38, 330); g.lineTo(LX + 58, 610); g.fill();
    g.fillStyle = '#a82a22'; for (const [y0, y1] of [[560, 500], [440, 390]]) { g.beginPath(); g.moveTo(LX - tw(y0 + 120), y0); g.lineTo(LX - tw(y1 + 120), y1); g.lineTo(LX + tw(y1 + 120), y1); g.lineTo(LX + tw(y0 + 120), y0); g.fill(); }
    g.fillStyle = 'rgba(30,40,50,.7)'; g.beginPath(); g.moveTo(LX + 6, 610); g.lineTo(LX + 6, 330); g.lineTo(LX + 38, 330); g.lineTo(LX + 58, 610); g.fill();
    g.fillStyle = '#1e2224'; g.fillRect(LX - 48, 318, 96, 14); g.fillRect(LX - 30, 262, 60, 8);
    g.fillStyle = '#fff4c8'; g.fillRect(LX - 28, 270, 56, 48); g.fillStyle = '#2a2a2a'; g.beginPath(); g.moveTo(LX - 34, 262); g.lineTo(LX, 232); g.lineTo(LX + 34, 262); g.fill();
    // 巨浪砸在礁石上：白沫往上炸
    for (let i = 0; i < 300; i++) { const a = -1.9 + (r() - .5) * 1.4, d = r() ** .7 * 300, x = 1170 + Math.cos(a) * d * .8 + (r() - .5) * 80, y = 740 + Math.sin(a) * d, s = 6 + r() * 22;
      blob(g, x, y, s, s * .8, r() < .35 ? '#9fb8b8' : '#eef6f4'); }
    // 前景的浪：深青的身、白沫的顶
    const wv = new Path2D(); wv.moveTo(-20, 1100); wv.lineTo(-20, 860); for (let x = -20; x <= 1300; x += 20) wv.lineTo(x, 860 - Math.sin(x * .006) * 60 - Math.max(0, Math.sin((x - 700) * .004)) * 120); wv.lineTo(1300, 1100); wv.closePath();
    g.fillStyle = lg(g, 0, 700, 0, 1080, [[0, '#2f6a70'], [.4, '#17414a'], [1, '#08202a']]); g.fill(wv);
    for (let i = 0; i < 260; i++) { const x = r() * 1300, y = 860 - Math.sin(x * .006) * 60 - Math.max(0, Math.sin((x - 700) * .004)) * 120 + (r() - .3) * 40, s = 10 + r() * 28; blob(g, x, y, s * 1.4, s * .6, r() < .3 ? '#a8c4c2' : '#f2f8f6'); }
    for (let i = 0; i < 70; i++) { const t = r(), x0 = t * 1250, y0 = 900 + r() * 150; g.strokeStyle = `rgba(220,240,240,${.3 + r() * .4})`; g.lineWidth = 2 + r() * 4; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + 60, y0 + 40, x0 + 140, y0 + 30); g.stroke(); }
    // 斜着的雨
    for (let i = 0; i < 500; i++) { const x = r() * W, y = r() * H, L = 30 + r() * 50; g.strokeStyle = `rgba(200,215,220,${.12 + r() * .2})`; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x - L * .35, y + L); g.stroke(); }
    const def = (X, Y, nz) => Y < HZ ? Math.atan2(Y - 200, X - (LX - 500)) + 1.57 + fbm(nz, X * .002, Y * .002, 2) * .5 : Y > 820 ? fbm(nz, X * .003, Y * .006, 2) * .8 - .2 : fbm(nz, X * .003, Y * .01, 2) * .3;
    return { c, def, edge: (X, Y) => .7, focus: [LX, 360], name: 'lighthouse' };
  }
  return { wheat, wave, peak, lighthouse };
})();
