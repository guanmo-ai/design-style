// ───────────────────────── No.07 after forty years in the forest: one design sheet, flat cel colour ─────────────────────────
const MP = {
  cream: '#ead4a8', creamSh: '#a597ad', creamDk: '#c9ab82', teal: '#86b4a6', tealSh: '#5b8889', tealDk: '#4b7175',
  red: '#b4503a', redSh: '#7c3b36', roof: '#8f879a', roofSh: '#686079', under: '#3a343c', bogie: '#4a4350',
  glass: '#34474e', glassHi: '#6f8f93', wear: '#c8a67e', wear2: '#9c8faa', rust: '#a6653e', ink: '#332a30',
  lit: '#ffd88a', litHi: '#fff1c4', seat: '#a45f3e', head: '#403c42',
  wheel: '#3a3440', wheelHi: '#8a8090',
};
const TREE_ROOF = { x: 92, y: -330 };

function wearOn(g, path, x, y, w, h, seed, onTeal) {
  // large, smooth camouflage-like islands of grime, faded paint and rust
  patches(g, path, x, y, w, h, { sx: 58, sy: 42, seed, oct: 3, res: 0.6,
    bands: onTeal ? [{ lo: 0.58, hi: 0.67, c: MP.tealDk }, { lo: 0.67, hi: 0.73, c: MP.wear }, { lo: 0.73, c: MP.rust }]
      : [{ lo: 0.56, hi: 0.65, c: MP.wear }, { lo: 0.65, hi: 0.71, c: MP.wear2 }, { lo: 0.71, c: MP.rust }] });
}
function roofTree(g, x, y, s = 1, P = MZ.leafSun) {
  const tw = [[x, y + 6], [x + 4 * s, y - 40 * s], [x - 2 * s, y - 80 * s], [x + 8 * s, y - 118 * s]];
  g.strokeStyle = '#5a4632'; g.lineCap = 'round';
  for (let i = 0; i < tw.length - 1; i++) { g.lineWidth = (11 - i * 3) * s; g.beginPath(); g.moveTo(...tw[i]); g.lineTo(...tw[i + 1]); g.stroke(); }
  g.strokeStyle = '#8a6e4c'; g.lineWidth = 2.5 * s; g.beginPath(); g.moveTo(x + 3 * s, y); g.lineTo(x + 6 * s, y - 40 * s); g.lineTo(x + 1 * s, y - 80 * s); g.stroke();
  ink(g, resample(tw, 4, 0.4, 11), 1.3 * s, MZ.ink, 11);
  // roots gripping the roof
  for (const k of [-1, 1, -0.5, 0.6]) { g.strokeStyle = '#4a3a2c'; g.lineWidth = 3 * s; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + k * 20 * s, y + 2, x + k * 34 * s, y + 10 * s); g.stroke(); }
  dabClump(g, x - 34 * s, y - 120 * s, 40 * s, 34 * s, 71, P, { ds: 3.2 * s });
  dabClump(g, x + 36 * s, y - 132 * s, 44 * s, 36 * s, 72, P, { ds: 3.2 * s });
  dabClump(g, x + 2 * s, y - 158 * s, 52 * s, 40 * s, 73, P, { ds: 3.2 * s });
}
function mossBed(g, pts, seed, s = 1, P = MZ.moss) {
  pts.forEach(([x, y, rx, ry], i) => dabClump(g, x, y, rx, ry, seed + i * 5, P, { ds: 2.6 * s, lx: 0.5, ly: -0.86 }));
}
function flowersOn(g, seed, pts, s = 1) {
  const r = RNG(seed);
  pts.forEach(([x, y, rx, ry, n]) => starFlowers(g, r, n, (rr) => { const a = rr() * TAU, d = Math.sqrt(rr()); return [x + Math.cos(a) * rx * d, y + Math.sin(a) * ry * d, s]; }, 1));
  pts.forEach(([x, y, rx, ry, n], i) => { for (let k = 0; k < n * 0.6; k++) { const gx = x + r.range(-rx, rx), gy = y - ry * r.range(0, 0.6); grassClump(g, gx, gy, r.range(12, 26) * s, 4, seed * 3 + i * 17 + k, ['#4f7d35', '#79a33f', '#a9c45a', '#36602f']); } });
}

// front view, lamps off (lights are layered on live)
const MF_S = 2.6;
function makeMossFront() {
  const L = mk(460 * MF_S, 640 * MF_S), g = L.g;
  g.translate(230 * MF_S, 560 * MF_S); g.scale(MF_S, MF_S);
  // skirt & wheels (mostly swallowed by the ground)
  g.fillStyle = MP.under; g.fillRect(-124, -50, 248, 34);
  for (const wx of [-58, 58]) { g.fillStyle = MP.wheel; g.beginPath(); g.ellipse(wx, -18, 9, 20, 0, 0, TAU); g.fill(); }
  g.fillStyle = MP.bogie; rrect(g, -132, -56, 264, 22, 6); g.fill();
  const B = new Path2D();
  B.moveTo(-148, -50); B.lineTo(-150, -232); B.quadraticCurveTo(-150, -288, -88, -294); B.lineTo(88, -294); B.quadraticCurveTo(150, -288, 150, -232); B.lineTo(148, -50); B.quadraticCurveTo(146, -40, 136, -40); B.lineTo(-136, -40); B.quadraticCurveTo(-146, -40, -148, -50); B.closePath();
  g.fillStyle = MP.cream; g.fill(B);
  g.save(); g.clip(B);
  g.fillStyle = MP.teal; g.fillRect(-160, -140, 320, 110);
  wearOn(g, null, -160, -300, 320, 160, 3, false);
  g.save(); g.beginPath(); g.rect(-160, -140, 320, 110); g.clip(); g.fillStyle = MP.teal; g.fillRect(-160, -140, 320, 110); wearOn(g, null, -160, -140, 320, 110, 4, true); g.restore();
  g.fillStyle = MP.red; g.fillRect(-160, -149, 320, 10); g.fillStyle = MP.redSh; g.fillRect(-160, -141, 320, 2.5);
  // hard cel shadow: the left flank turns away from the sun
  g.fillStyle = rgba(MP.creamSh, 0.92); g.beginPath(); g.moveTo(-170, -300); g.lineTo(-104, -300); g.quadraticCurveTo(-118, -170, -106, -30); g.lineTo(-170, -30); g.fill();
  g.fillStyle = rgba(MP.tealSh, 0.75); g.fillRect(-170, -76, 340, 40);
  g.fillStyle = rgba(MP.creamSh, 0.8); g.fillRect(-160, -164, 320, 8);
  g.restore();
  // windscreen (dark glass, one pane cracked)
  for (const [x0, x1] of [[-128, -8], [8, 128]]) {
    g.fillStyle = MP.creamSh; rrect(g, x0 - 5, -277, x1 - x0 + 10, 102, 10); g.fill();
    g.fillStyle = MP.glass; rrect(g, x0, -272, x1 - x0, 92, 8); g.fill();
    g.save(); rrect(g, x0, -272, x1 - x0, 92, 8); g.clip();
    g.fillStyle = MP.glassHi; g.beginPath(); g.moveTo(x0 + 34, -272); g.lineTo(x0 + 56, -272); g.lineTo(x0 + 18, -180); g.lineTo(x0 - 4, -180); g.fill();
    g.fillStyle = rgba('#20303a', 0.8); g.fillRect(x0, -204, x1 - x0, 24); // dashboard shadow
    g.restore();
    ink(g, resample(rrPts(x0, -272, x1 - x0, 92, 8), 4, 0.3, x0 + 300), 1.2, MP.ink, x0 + 300);
  }
  { const cx = 70, cy = -236, r = RNG(5); g.strokeStyle = rgba('#d8e4e4', 0.75); g.lineWidth = 0.9; for (let k = 0; k < 7; k++) { let x = cx, y = cy, a = (k / 7) * TAU + r(); g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 4; j++) { x += Math.cos(a) * r.range(6, 14); y += Math.sin(a) * r.range(6, 14); a += r.range(-0.5, 0.5); g.lineTo(x, y); } g.stroke(); } }
  // destination blind, faded
  g.fillStyle = MP.under; rrect(g, -46, -292, 92, 14, 3); g.fill(); g.fillStyle = rgba('#efe3c6', 0.7); g.font = `600 10px ${CJK_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('终 点 站', 0, -285);
  // headlight with grille + markers
  g.fillStyle = MP.creamDk; g.beginPath(); g.arc(0, -104, 22, 0, TAU); g.fill();
  g.fillStyle = MP.head; g.beginPath(); g.arc(0, -104, 16, 0, TAU); g.fill();
  g.strokeStyle = rgba('#6e6872', 0.9); g.lineWidth = 1.3; for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; g.beginPath(); g.moveTo(Math.cos(a) * 4, -104 + Math.sin(a) * 4); g.lineTo(Math.cos(a) * 15, -104 + Math.sin(a) * 15); g.stroke(); }
  g.beginPath(); g.arc(0, -104, 4, 0, TAU); g.stroke();
  for (const mx of [-108, 108]) { g.fillStyle = MP.tealDk; g.beginPath(); g.arc(mx, -104, 10, 0, TAU); g.fill(); g.fillStyle = '#7a5a40'; g.beginPath(); g.arc(mx, -104, 6.5, 0, TAU); g.fill(); }
  g.fillStyle = MP.cream; rrect(g, -22, -76, 44, 20, 3); g.fill(); g.fillStyle = MP.ink; g.font = `700 14px ${LATIN_FONT}`; g.fillText('07', 0, -65.5);
  // roof
  g.fillStyle = MP.roof; g.beginPath(); g.moveTo(-150, -236); g.quadraticCurveTo(-146, -300, -86, -304); g.lineTo(86, -304); g.quadraticCurveTo(146, -300, 150, -236); g.quadraticCurveTo(146, -288, 88, -294); g.lineTo(-88, -294); g.quadraticCurveTo(-146, -288, -150, -236); g.fill();
  // outlines
  ink(g, resample([[-148, -50], [-150, -232], [-140, -272], [-118, -290], [-88, -294], [88, -294], [118, -290], [140, -272], [150, -232], [148, -50], [136, -40], [-136, -40], [-148, -50]], 5, 0.5, 80), 1.6, MP.ink, 80);
  inkLine(g, -150, -149, 150, -149, 0.9, MP.ink, 82, 0.3); inkLine(g, -150, -139, 150, -139, 0.8, MP.ink, 83, 0.3);
  for (const x of [-150, 150]) inkLine(g, x * 0.97, -136, x * 0.97, -46, 0.7, rgba(MP.ink, 0.6), x + 9, 0.3);
  // roof lantern with a nest in it
  g.fillStyle = MP.roofSh; g.fillRect(-106, -322, 22, 18); g.fillStyle = '#5d564a'; g.fillRect(-103, -330, 16, 10); g.fillStyle = MP.roofSh; g.beginPath(); g.moveTo(-108, -330); g.quadraticCurveTo(-95, -342, -82, -330); g.fill();
  { const r = RNG(14); g.strokeStyle = '#8a6a44'; g.lineWidth = 1.1; for (let i = 0; i < 40; i++) { const a = r() * Math.PI, x = -95 + Math.cos(a) * r.range(4, 14), y = -334 - Math.sin(a) * r.range(1, 5); g.beginPath(); g.moveTo(x, y); g.lineTo(x + r.range(-8, 8), y + r.range(-3, 3)); g.stroke(); } }
  // forty years of moss
  mossBed(g, [[-40, -306, 120, 30], [70, -312, 90, 32], [-128, -290, 34, 26], [134, -282, 30, 30], [-148, -238, 16, 40], [150, -200, 14, 52], [-60, -300, 50, 22], [10, -322, 60, 22]], 400);
  for (const [x, len] of [[-136, 70], [-112, 120], [-70, 46], [-30, 92], [24, 64], [58, 128], [112, 84], [140, 150]]) vine(g, x, -292, len, 600 + x, MZ.moss, 0.7);
  mossBed(g, [[-140, -64, 30, 30], [120, -58, 40, 26], [-40, -46, 70, 18], [60, -44, 50, 14]], 500, 1, MZ.mossDeep);
  roofTree(g, TREE_ROOF.x, TREE_ROOF.y, 1);
  flowersOn(g, 21, [[-40, -312, 100, 18, 9], [70, -318, 70, 18, 7], [-130, -296, 24, 16, 3], [134, -290, 20, 16, 2], [-40, -54, 60, 12, 5], [110, -60, 30, 10, 3]], 1);
  L.ax = 230 * MF_S; L.ay = 560 * MF_S; L.S = MF_S;
  return L;
}
function litPane(g, x, y, w, h, r, k = 1) {
  g.fillStyle = '#ffcb72'; rrect(g, x, y, w, h, r); g.fill();
  g.save(); rrect(g, x, y, w, h, r); g.clip();
  g.fillStyle = '#fff0c4'; g.fillRect(x, y, w, h * 0.42);
  g.fillStyle = '#ffe39a'; g.fillRect(x, y + h * 0.42, w, h * 0.12);
  g.fillStyle = '#ad6440'; const sw = w / Math.max(1, Math.round(w / 34)); for (let sx = x + 3; sx < x + w - 4; sx += sw) { rrect(g, sx, y + h * 0.66, sw - 6, h * 0.5, 5 * k); g.fill(); }
  g.fillStyle = '#8a4a32'; for (let sx = x + 3; sx < x + w - 4; sx += sw) g.fillRect(sx, y + h * 0.66, sw - 6, 3 * k);
  g.strokeStyle = '#c98a52'; g.lineWidth = 1.1 * k; for (let sx = x + 10 * k; sx < x + w - 6; sx += 16 * k) { g.beginPath(); g.moveTo(sx, y + 3); g.lineTo(sx, y + h * 0.2); g.stroke(); g.beginPath(); g.arc(sx, y + h * 0.2 + 3 * k, 2.6 * k, 0, TAU); g.stroke(); }
  g.fillStyle = 'rgba(255,250,232,.55)'; g.beginPath(); g.moveTo(x + w * 0.58, y); g.lineTo(x + w * 0.74, y); g.lineTo(x + w * 0.4, y + h); g.lineTo(x + w * 0.24, y + h); g.fill();
  g.restore();
}
// warm light layered over the front view (k: 0..1 windows, h: 0..1 headlight)
function frontLights(ctx, x, y, sc, k, h, flick = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  if (k > 0) {
    ctx.globalAlpha = k;
    for (const [x0, x1] of [[-128, -8], [8, 128]]) {
      litPane(ctx, x0, -272, x1 - x0, 92, 8, 1);
    }
    ctx.globalAlpha = 1;
    glow(ctx, -68, -226, 170, '#ffcf7a', 0.35 * k); glow(ctx, 68, -226, 170, '#ffcf7a', 0.35 * k);
  }
  if (h > 0) {
    ctx.globalAlpha = h * flick; ctx.fillStyle = MP.litHi; ctx.beginPath(); ctx.arc(0, -104, 16, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgba('#c58a4a', 0.8); ctx.lineWidth = 1.3; for (let j = 0; j < 8; j++) { const a = (j / 8) * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 4, -104 + Math.sin(a) * 4); ctx.lineTo(Math.cos(a) * 15, -104 + Math.sin(a) * 15); ctx.stroke(); }
    for (const mx of [-108, 108]) { ctx.fillStyle = '#ffcf7a'; ctx.beginPath(); ctx.arc(mx, -104, 6.5, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
    glow(ctx, 0, -104, 150, '#fff0c4', 0.75 * h * flick); glow(ctx, 0, -104, 46, '#ffffff', 0.8 * h * flick);
    for (const mx of [-108, 108]) glow(ctx, mx, -104, 40, '#ffc870', 0.6 * h);
  }
  ctx.restore();
}

// side view, awake (windows lit)
const MS_S = 1.8;
function makeMossSide() {
  const L = mk(800 * MS_S, 640 * MS_S), g = L.g;
  g.translate(400 * MS_S, 520 * MS_S); g.scale(MS_S, MS_S);
  g.fillStyle = MP.under; rrect(g, -326, -70, 652, 22, 5); g.fill();
  for (const bx of [-215, 215]) { g.fillStyle = MP.bogie; rrect(g, bx - 84, -60, 168, 24, 8); g.fill(); ink(g, resample(rrPts(bx - 84, -60, 168, 24, 8), 5, 0.3, bx), 1.1, MP.ink, bx); }
  const body = new Path2D(); bodyPath(body);
  g.fillStyle = MP.cream; g.fill(body);
  g.save(); g.clip(body);
  wearOn(g, null, -360, -260, 720, 110, 31, false);
  g.save(); g.beginPath(); g.rect(-360, -150, 720, 100); g.clip(); g.fillStyle = MP.teal; g.fillRect(-360, -150, 720, 100); wearOn(g, null, -360, -150, 720, 100, 32, true); g.restore();
  g.fillStyle = MP.red; g.fillRect(-360, -158, 720, 10); g.fillStyle = MP.redSh; g.fillRect(-360, -150, 720, 2.5);
  g.fillStyle = rgba(MP.tealSh, 0.8); g.fillRect(-360, -90, 720, 50);
  g.fillStyle = rgba(MP.creamSh, 0.85); g.fillRect(-360, -252, 720, 12); g.fillRect(-360, -170, 720, 10);
  g.fillStyle = rgba(MP.creamSh, 0.6); g.beginPath(); g.moveTo(316, -260); g.quadraticCurveTo(330, -150, 320, -40); g.lineTo(380, -40); g.lineTo(380, -260); g.fill();
  for (const x of SIDE_WIN) {
    g.fillStyle = MP.creamSh; rrect(g, x - 4, -240, 74, 70, 9); g.fill();
    litPane(g, x, -236, 66, 62, 7, 0.9);
    ink(g, resample(rrPts(x, -236, 66, 62, 7), 4, 0.3, x + 900), 1.1, MP.ink, x + 900);
  }
  g.fillStyle = MP.creamSh; rrect(g, -72, -240, 60, 180, 5); g.fill(); g.fillStyle = MP.cream; rrect(g, -69, -237, 54, 174, 4); g.fill();
  g.fillStyle = MP.tealSh; g.fillRect(-69, -150, 54, 87); litPane(g, -62, -228, 40, 56, 6, 0.8);
  ink(g, resample(rrPts(-69, -237, 54, 174, 4), 5, 0.3, 40), 1.1, MP.ink, 40);
  g.fillStyle = MP.creamSh; g.beginPath(); g.moveTo(262, -240); g.lineTo(312, -240); g.quadraticCurveTo(340, -236, 344, -176); g.lineTo(262, -176); g.closePath(); g.fill();
  g.save(); g.beginPath(); g.moveTo(266, -236); g.lineTo(310, -236); g.quadraticCurveTo(336, -232, 339, -180); g.lineTo(266, -180); g.closePath(); g.clip(); litPane(g, 262, -240, 80, 62, 2, 0.9); g.restore();
  g.fillStyle = MP.cream; rrect(g, 120, -128, 46, 26, 4); g.fill(); g.fillStyle = MP.ink; g.font = `700 18px ${LATIN_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('07', 143, -114.5);
  g.restore();
  const roof = new Path2D(); roof.moveTo(-334, -250); roof.quadraticCurveTo(-330, -270, -290, -274); roof.lineTo(276, -274); roof.quadraticCurveTo(336, -270, 344, -228); roof.quadraticCurveTo(320, -250, 282, -252); roof.lineTo(-302, -252); roof.closePath();
  g.fillStyle = MP.roof; g.fill(roof);
  g.fillStyle = MP.creamDk; g.beginPath(); g.ellipse(344, -112, 9, 14, 0, 0, TAU); g.fill(); g.fillStyle = MP.litHi; g.beginPath(); g.ellipse(346, -112, 6, 11, 0, 0, TAU); g.fill();
  ink(g, resample([[-340, -60], [-341, -214], [-338, -236], [-330, -246], [-302, -252], [282, -252], [318, -246], [340, -226], [350, -200], [352, -176], [353, -84], [350, -68], [330, -60], [-340, -60]], 5, 0.5, 70), 1.7, MP.ink, 70);
  ink(g, resample([[-334, -250], [-330, -266], [-290, -274], [276, -274], [320, -266], [344, -228]], 5, 0.5, 71), 1.5, MP.ink, 71);
  inkLine(g, -340, -158, 352, -158, 0.9, MP.ink, 72, 0.4); inkLine(g, -340, -148, 352, -148, 0.8, MP.ink, 73, 0.4);
  // moss along the roof, vines between windows, the little tree near the front
  mossBed(g, [[-260, -276, 90, 22], [-120, -282, 110, 26], [30, -280, 100, 24], [170, -278, 90, 22], [290, -262, 50, 22], [-330, -246, 24, 30], [345, -220, 16, 30]], 700);
  for (const [x, len] of [[-318, 90], [-232, 50], [-150, 70], [-40, 110], [-8, 40], [74, 60], [160, 46], [248, 76], [330, 110]]) vine(g, x, -252, len, 800 + x, MZ.moss, 0.7);
  mossBed(g, [[-300, -78, 40, 18], [-120, -70, 60, 14], [180, -74, 50, 16], [300, -80, 30, 16]], 760, 1, MZ.mossDeep);
  roofTree(g, 180, -290, 0.95);
  flowersOn(g, 41, [[-120, -286, 90, 14, 7], [30, -284, 80, 14, 6], [-260, -280, 70, 12, 5], [170, -282, 60, 12, 4]], 1);
  L.ax = 400 * MS_S; L.ay = 520 * MS_S; L.S = MS_S;
  return L;
}
function drawMossSide(ctx, spr, x, y, sc, ang, dist, lights = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.save(); ctx.scale(sc, sc); const P = { wheel: MP.wheel, wheelHi: MP.wheelHi, ink: MP.ink };
  for (const wx of WHEELS) wheel(ctx, wx, -26, 25, dist / 25, P);
  ctx.restore();
  const k = sc / spr.S; ctx.drawImage(spr, -spr.ax * k, -spr.ay * k, spr.w * k, spr.h * k);
  ctx.scale(sc, sc);
  for (const wx of SIDE_WIN) glow(ctx, wx + 33, -205, 80, '#ffc870', 0.3 * lights);
  glow(ctx, 350, -112, 130, '#fff0c4', 0.85 * lights); glow(ctx, 350, -112, 30, '#ffffff', 0.9 * lights);
  ctx.restore();
}
