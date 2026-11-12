// 沙画 v2 · 每一幕的“沙厚度图”。用 Canvas 画：越黑 = 沙越厚。坐标按 1920×1080 写，画布是 960×540（缩一半）。
// 每一幕可以有好几层：layer.move(f) 让这一层的沙在停留期间自己动（平移 / 旋转 / 缩放 / 任意函数）。
const GW = 960, GH = 540;
function paint(fn, hmax = 1.6) {
  const c = document.createElement('canvas'); c.width = GW; c.height = GH; const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, GW, GH); g.scale(GW / 1920, GH / 1080); fn(g);
  const d = g.getImageData(0, 0, GW, GH).data, D = new Float32Array(GW * GH);
  for (let i = 0; i < GW * GH; i++) D[i] = (1 - d[i * 4] / 255) * hmax;
  return D;
}
const gray = v => { const x = Math.round(255 * (1 - v)); return `rgb(${x},${x},${x})`; };   // v = 沙厚 0..1（× hmax）
const R0 = GRAINS.rng(77);
function waves(g, y0, y1, n, seed, avoid) { const R = GRAINS.rng(seed); g.strokeStyle = '#fff'; g.lineCap = 'round'; for (let k = 0; k < n; k++) { const u = k / (n - 1); const y = y0 + Math.pow(u, 1.6) * (y1 - y0); g.lineWidth = 1.5 + u * 5; let x = -40 + R() * 120; while (x < 1960) { const len = 80 + R() * (180 + u * 380); if (!avoid || !avoid(x + len / 2, y)) { g.beginPath(); for (let xx = x; xx < x + len; xx += 10) { const yy = y + (2 + u * 12) * Math.sin(xx / (60 + u * 150) + k * 1.7); xx === x ? g.moveTo(xx, yy) : g.lineTo(xx, yy); } g.stroke(); } x += len + 70 + R() * 240; } } }
function bird(g, x, y, s) { const w = 34 * s; g.lineWidth = 6 * s + 1; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - w, y - w * 0.25); g.quadraticCurveTo(x - w * 0.45, y - w * 0.6, x, y + w * 0.05); g.quadraticCurveTo(x + w * 0.45, y - w * 0.6, x + w, y - w * 0.25); g.stroke(); }

// —— 第 0 幕：月夜海面（封面）——
const HZ = 640, MOON = [1180, 350, 150];
const S_moon = {
  layers: [
    { dens: paint(g => {
      const sky = g.createLinearGradient(0, 0, 0, HZ); sky.addColorStop(0, gray(0.78)); sky.addColorStop(0.75, gray(0.42)); sky.addColorStop(1, gray(0.2)); g.fillStyle = sky; g.fillRect(0, 0, 1920, HZ);
      const halo = g.createRadialGradient(MOON[0], MOON[1], MOON[2] * 0.9, MOON[0], MOON[1], MOON[2] * 2.8); halo.addColorStop(0, '#fff'); halo.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = halo; g.fillRect(0, 0, 1920, HZ);
      g.fillStyle = gray(0.85); g.beginPath(); g.moveTo(0, HZ); for (let x = 0; x <= 1920; x += 20) { const h = 150 * Math.exp(-Math.pow((x - 330) / 380, 2)) + 110 * Math.exp(-Math.pow((x - 1790) / 260, 2)) + 14 * Math.sin(x / 37); g.lineTo(x, HZ - Math.max(0, h)); } g.lineTo(1920, HZ); g.fill();
      const sea = g.createLinearGradient(0, HZ, 0, 1080); sea.addColorStop(0, gray(0.35)); sea.addColorStop(1, gray(0.8)); g.fillStyle = sea; g.fillRect(0, HZ, 1920, 1080 - HZ);
      g.fillStyle = '#fff'; g.beginPath(); g.arc(MOON[0], MOON[1], MOON[2], 0, 7); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, HZ); g.lineTo(1920, HZ); g.stroke();
      const R = GRAINS.rng(4); for (let i = 0; i < 40; i++) { const u = i / 39, y = HZ + 10 + Math.pow(u, 1.5) * 420, hw = 20 + u * 170 * (0.6 + R()); g.lineWidth = 3 + u * 8; g.beginPath(); g.moveTo(MOON[0] - hw * (0.4 + 0.6 * R()), y); g.lineTo(MOON[0] + hw * (0.4 + 0.6 * R()), y); g.stroke(); }
      waves(g, HZ + 18, 1060, 18, 9, (x) => Math.abs(x - MOON[0]) < 220);
    }) },
    { dens: paint(g => { g.fillStyle = gray(1); const bx = 1040, by = 770; g.beginPath(); g.moveTo(bx - 75, by - 8); g.quadraticCurveTo(bx, by + 26, bx + 80, by - 10); g.closePath(); g.fill(); g.fillRect(bx - 4, by - 70, 8, 64); g.beginPath(); g.moveTo(bx + 2, by - 66); g.lineTo(bx + 52, by - 20); g.lineTo(bx + 2, by - 18); g.fill(); g.beginPath(); g.arc(bx - 30, by - 28, 10, 0, 7); g.fill(); g.fillRect(bx - 36, by - 22, 12, 16); }),
      move: f => ({ dx: 40 * Math.sin(f / 90), dy: 3 * Math.sin(f / 23) }) },          // 船在漂
    { dens: paint(g => { g.strokeStyle = gray(1); [[1020, 230, 1], [1110, 300, 0.75], [1300, 260, 0.6], [880, 320, 0.55], [1380, 190, 0.5]].forEach(([x, y, s]) => bird(g, x, y, s)); }),
      move: f => ({ dx: f * 2.8, dy: -f * 0.7 }) },                                       // 鸟往右上飞
  ]
};

// —— 第 1 幕：眼睛（月亮就是虹膜）——
const EYE = { c: [MOON[0] - 220, 480], w: 1240, h: 520 };
function eyePath(g, open = 1) { const [cx, cy] = EYE.c, a = EYE.w / 2, b = EYE.h / 2 * open; g.beginPath(); g.moveTo(cx - a, cy); g.bezierCurveTo(cx - a * 0.45, cy - b * 1.15, cx + a * 0.45, cy - b * 1.15, cx + a, cy); g.bezierCurveTo(cx + a * 0.45, cy + b * 1.15, cx - a * 0.45, cy + b * 1.15, cx - a, cy); g.closePath(); }
const IRIS = 190;
const S_eye = {
  layers: [
    { dens: paint(g => {
      const bg = g.createRadialGradient(EYE.c[0], EYE.c[1], 200, EYE.c[0], EYE.c[1], 1100); bg.addColorStop(0, gray(0.55)); bg.addColorStop(1, gray(0.95)); g.fillStyle = bg; g.fillRect(0, 0, 1920, 1080);
      g.save(); eyePath(g); g.clip(); const sc = g.createRadialGradient(EYE.c[0], EYE.c[1], 120, EYE.c[0], EYE.c[1], 640); sc.addColorStop(0, gray(0.02)); sc.addColorStop(1, gray(0.45)); g.fillStyle = sc; g.fillRect(0, 0, 1920, 1080);
      g.fillStyle = gray(0.12); g.beginPath(); g.arc(EYE.c[0], EYE.c[1], IRIS, 0, 7); g.fill();
      g.strokeStyle = gray(0.7); g.lineCap = 'round'; for (let i = 0; i < 40; i++) { const a = i / 40 * 6.283; g.lineWidth = 3 + (i % 3); g.beginPath(); g.moveTo(EYE.c[0] + Math.cos(a) * 92, EYE.c[1] + Math.sin(a) * 92); g.lineTo(EYE.c[0] + Math.cos(a + 0.04) * (IRIS - 18 - (i % 4) * 12), EYE.c[1] + Math.sin(a + 0.04) * (IRIS - 18 - (i % 4) * 12)); g.stroke(); }
      g.lineWidth = 10; g.strokeStyle = gray(0.85); g.beginPath(); g.arc(EYE.c[0], EYE.c[1], IRIS, 0, 7); g.stroke(); g.restore();
      g.lineWidth = 14; g.strokeStyle = gray(0.0); eyePath(g); g.stroke();                     // 眼睑：一道亮的指痕
      g.strokeStyle = gray(0.1); g.lineWidth = 8; g.lineCap = 'round'; for (let i = 0; i < 9; i++) { const u = 0.18 + i * 0.08; const x = EYE.c[0] - EYE.w / 2 + EYE.w * u; const y = EYE.c[1] - EYE.h / 2 * 1.15 * Math.sin(Math.PI * u) * 0.86 - 14; const a = -Math.PI / 2 + (u - 0.5) * 1.8; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * 40, y + Math.sin(a) * 40, x + Math.cos(a - 0.35) * 86, y + Math.sin(a - 0.35) * 86); g.stroke(); }
    }) },
    { dens: paint(g => { g.fillStyle = gray(1); g.beginPath(); g.arc(EYE.c[0], EYE.c[1], 86, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(EYE.c[0] - 30, EYE.c[1] - 32, 22, 0, 7); g.fill(); }),
      move: f => { const t = f - TL.eye; const look = t < 40 ? 0 : t < 60 ? GRAINS.sm((t - 40) / 20) : t < 80 ? 1 : t < 100 ? 1 - 2 * GRAINS.sm((t - 80) / 20) : -1 + GRAINS.sm(GRAINS.clamp((t - 110) / 16)); return { dx: look * 70, dy: -Math.abs(look) * 12 }; } },   // 瞳孔往右看、往左看、回到中间
  ]
};

// —— 第 2 幕：鲸鱼跃出海面（红色的光）——
const SUN = [1360, 300, 120];
function whale(g) { g.save(); g.translate(960, 600); g.rotate(-0.52); g.beginPath(); g.moveTo(-300, 10); g.bezierCurveTo(-260, -95, 120, -125, 300, -40); g.bezierCurveTo(360, -10, 380, 30, 350, 60); g.bezierCurveTo(250, 85, -120, 95, -300, 10); g.fill();
  g.beginPath(); g.moveTo(-290, 0); g.bezierCurveTo(-360, -10, -420, -60, -470, -110); g.bezierCurveTo(-430, -40, -440, 10, -520, 30); g.bezierCurveTo(-430, 40, -370, 30, -290, 20); g.fill();
  g.beginPath(); g.moveTo(60, 60); g.bezierCurveTo(30, 150, -20, 190, -70, 200); g.bezierCurveTo(-40, 140, -20, 100, 0, 60); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(250, -10, 9, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 4; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(180 - i * 40, 50); g.lineTo(150 - i * 40, 72); g.stroke(); } g.restore(); }
const S_whale = {
  layers: [
    { dens: paint(g => {
      const sky = g.createLinearGradient(0, 0, 0, 700); sky.addColorStop(0, gray(0.55)); sky.addColorStop(1, gray(0.12)); g.fillStyle = sky; g.fillRect(0, 0, 1920, 700);
      const halo = g.createRadialGradient(SUN[0], SUN[1], SUN[2], SUN[0], SUN[1], SUN[2] * 3); halo.addColorStop(0, '#fff'); halo.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = halo; g.fillRect(0, 0, 1920, 1080);
      g.fillStyle = '#fff'; g.beginPath(); g.arc(SUN[0], SUN[1], SUN[2], 0, 7); g.fill();
      g.fillStyle = gray(0.9); g.fillRect(0, 700, 1920, 380); waves(g, 712, 1070, 16, 21);
    }) },
    { dens: paint(g => { g.fillStyle = gray(1); whale(g); }, 1.7),
      move: f => { const t = GRAINS.clamp((f - TL.whale) / 88); return { cx: 960, cy: 700, rot: -0.25 + 0.55 * t, dx: -120 + 260 * t, dy: 120 - 200 * Math.sin(Math.PI * Math.min(1, t * 0.85)) }; } },
    { dens: paint(g => { g.fillStyle = gray(0.9); const R = GRAINS.rng(31); for (let i = 0; i < 160; i++) { const a = -Math.PI * (0.1 + 0.8 * R()), r = 40 + R() * 260; g.beginPath(); g.arc(840 + Math.cos(a) * r * 1.4, 720 + Math.sin(a) * r, 2 + R() * 9, 0, 7); g.fill(); } }),
      move: f => { const t = GRAINS.clamp((f - TL.whale) / 88); return { cx: 840, cy: 720, s: 0.4 + 0.9 * t, dy: 40 * t * t }; } },   // 水花往外散
  ]
};

// —— 第 3 幕：规则 1 · 越厚越暗（一条从薄到厚的沙带）——
const BAND = { x0: 240, x1: 1680, y0: 470, y1: 630 };
const S_wedge = { layers: [{ dens: paint(g => { const gr = g.createLinearGradient(BAND.x0, 0, BAND.x1, 0); gr.addColorStop(0, gray(0.03)); gr.addColorStop(1, gray(1)); g.fillStyle = gr; g.fillRect(BAND.x0, BAND.y0, BAND.x1 - BAND.x0, BAND.y1 - BAND.y0); g.fillStyle = gr; g.fillRect(BAND.x0, BAND.y0, BAND.x1 - BAND.x0, BAND.y1 - BAND.y0); }) }] };

// —— 第 4 幕：规则 2 · 沙守恒（一条均匀的沙带，被一指分开；沙量和上一条楔形沙带一样多：只往左匀，不从画外补）——
const FIN = { y0: 550, R: 46, f0: TL.finger, f1: TL.finger + 60 };
const S_band = { layers: [{ dens: paint(g => { g.fillStyle = gray(0.41); g.fillRect(BAND.x0, BAND.y0 - 20, BAND.x1 - BAND.x0, BAND.y1 - BAND.y0 + 40); }),
  move: f => { const t = GRAINS.sm(GRAINS.clamp((f - FIN.f0) / (FIN.f1 - FIN.f0))); const tip = BAND.x0 - 60 + (BAND.x1 - BAND.x0 + 120) * t; if (f < FIN.f0) return null;
    return { fn: (x, y) => { const k = 1 - GRAINS.sm(GRAINS.clamp((x - tip + 70) / 70)); if (k <= 0) return [x, y]; const d = y - FIN.y0, a = Math.abs(d), sg = d < 0 ? -1 : 1, R = FIN.R, span = R * 2.6; if (a > span) return [x, y]; const nd = R + a * (span - R) / span; return [x, FIN.y0 + sg * (a + (nd - a) * k)]; } }; } }] };

// —— 第 5 幕：用在界面上（一台沙做的手机）——
const PH = { x: 960, y: 540, w: 470, h: 960, r: 70 };
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
const UIY = { art: 380, title: 640, bar: 720, btn: 840, tog: 970 };
const S_ui = {
  layers: [
    { dens: paint(g => {
      const bg = g.createLinearGradient(0, 0, 1920, 0); bg.addColorStop(0, gray(0.5)); bg.addColorStop(0.5, gray(0.15)); bg.addColorStop(1, gray(0.5)); g.fillStyle = bg; g.fillRect(0, 0, 1920, 1080);
      g.fillStyle = gray(0.95); rr(g, PH.x - PH.w / 2 - 18, PH.y - PH.h / 2 - 18, PH.w + 36, PH.h + 36, PH.r + 16); g.fill();
      g.fillStyle = gray(0.04); rr(g, PH.x - PH.w / 2, PH.y - PH.h / 2, PH.w, PH.h, PH.r); g.fill();
      // 封面：一枚小月亮
      g.fillStyle = gray(0.8); rr(g, PH.x - 170, UIY.art - 170, 340, 340, 40); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(PH.x + 40, UIY.art - 40, 70, 0, 7); g.fill(); g.fillStyle = gray(0.95); g.fillRect(PH.x - 170, UIY.art + 70, 340, 100); waves(g, UIY.art + 80, UIY.art + 160, 4, 3);
      g.fillStyle = gray(0.9); g.font = '400 64px Brush'; g.textAlign = 'center'; g.fillText('月亮掉进海里', PH.x, UIY.title);
      g.fillStyle = gray(0.35); rr(g, PH.x - 190, UIY.bar - 5, 380, 10, 5); g.fill();
      g.fillStyle = gray(0.85); [PH.x - 140, PH.x + 140].forEach((x, i) => { g.beginPath(); g.moveTo(x + (i ? -14 : 14), UIY.btn - 18); g.lineTo(x + (i ? -14 : 14), UIY.btn + 18); g.lineTo(x + (i ? 14 : -14), UIY.btn); g.fill(); });
      g.fillStyle = gray(0.4); rr(g, PH.x + 60, UIY.tog - 30, 120, 60, 30); g.fill(); g.fillStyle = gray(0.7); g.font = '500 30px NotoSC'; g.textAlign = 'left'; g.fillText('定时关灯', PH.x - 180, UIY.tog + 10);
    }) },
    { dens: paint(g => { g.fillStyle = gray(1); rr(g, PH.x - 190, UIY.bar - 7, 380, 14, 7); g.fill(); g.beginPath(); g.arc(PH.x + 190, UIY.bar, 16, 0, 7); g.fill(); }),
      move: f => { const p = 0.08 + 0.64 * GRAINS.sm(GRAINS.clamp((f - TL.ui - 10) / 90)); return { cx: PH.x - 190, cy: UIY.bar, s: 1, sx: p, sy: 1, fn: (x, y, ox, oy) => (ox > PH.x + 170 ? [PH.x - 190 + 380 * p + (ox - PH.x - 190), oy] : [x, y]) }; } },   // 进度：沙流过去
    { dens: paint(g => { g.fillStyle = gray(1); g.beginPath(); g.arc(PH.x, UIY.btn, 58, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(PH.x - 16, UIY.btn - 26); g.lineTo(PH.x - 16, UIY.btn + 26); g.lineTo(PH.x + 28, UIY.btn); g.fill(); }),
      move: f => { const b = a => { const t = (f - a) / 14; return t > 0 && t < 1 ? Math.sin(Math.PI * t) : 0; }; return { cx: PH.x, cy: UIY.btn, s: 1 - 0.14 * b(TL.ui + 30) - 0.14 * b(TL.ui + 60) + 0.06 * b(TL.ui + 44) }; } },   // 播放键：按两下
    { dens: paint(g => { g.fillStyle = gray(1); g.beginPath(); g.arc(PH.x + 90, UIY.tog, 24, 0, 7); g.fill(); }),
      move: f => ({ dx: 60 * GRAINS.sm(GRAINS.clamp((f - TL.toggle) / 16)) }) },      // 开关：圆钮拨过去
  ]
};

// —— 第 6 幕：片名 ——
const S_title = {
  layers: [
    { dens: paint(g => { const bg = g.createRadialGradient(960, 520, 200, 960, 520, 1200); bg.addColorStop(0, gray(0.0)); bg.addColorStop(1, gray(0.35)); g.fillStyle = bg; g.fillRect(0, 0, 1920, 1080); g.fillStyle = gray(1); g.font = '400 330px Brush'; g.textAlign = 'center'; g.fillText('沙 画', 930, 640); }) },
    { dens: paint(g => { g.fillStyle = gray(1); g.beginPath(); g.arc(1300, 618, 20, 0, 7); g.fill(); }),
      move: f => { const t = GRAINS.clamp((f - TL.dot + 18) / 18); const drop = (1 - t * t) * 700; return { fn: (x, y) => [x + (t < 1 ? Math.sin(y * 0.3) * 3 * (1 - t) : 0), y - drop, t < 1 ? 0.8 * (1 - t) : 0] }; } },   // 最后一撮沙从上面落下来
  ]
};
