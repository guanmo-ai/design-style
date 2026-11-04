// 生成艺术小样共用：流场色带的生成与绘制、笔头、字的升起、规则卡
const W = 1920, H = 1080, PAPER = '#F3EEE2', INK = '#161616', RED = '#E8392B';
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const STEP = 4, GAP = 5;
const PAL_A = [['#E8392B',14],['#FF7A1A',10],['#FFC530',12],['#FF8FB8',8],['#2346E0',12],['#7CC6F2',8],['#1F9E6A',7],['#161616',8],['#FFFFFF',6],['#F6D9B8',4]];
const PAL_B = [['#2346E0',14],['#161616',9],['#7CC6F2',10],['#FFFFFF',8],['#FFC530',5],['#E8392B',3]];
const WID = [[6,20],[10,26],[16,18],[26,12],[40,8],[64,4],[96,2]];
// 方向场：几层正弦叠成平滑的“风”
const field = (seed, rot) => (x, y) => rot + 1.25*Math.sin(x*0.0019+0.4+seed%7) + 0.9*Math.cos(y*0.0026-x*0.0009+1.1) + 0.45*Math.sin((x*0.6+y)*0.0042) - 0.35;
// 长出一张画：色带只顺着风走，碰到别人就停；记下前端是被谁挡住的
function build(seed, pal, rot) {
  const rnd = mulberry(seed), ang = field(seed, rot);
  const pick = (list) => { let s = list.reduce((a, b) => a + b[1], 0) * rnd(); for (const [v, w] of list) if ((s -= w) < 0) return v; return list[0][0]; };
  const CS = 4, GW = Math.ceil(W / CS) + 2, GH = Math.ceil(H / CS) + 2, occ = new Int32Array(GW * GH).fill(-1);
  const scan = (x, y, r, fn) => { const r2 = r * r; for (let yy = Math.floor((y - r) / CS); yy <= Math.ceil((y + r) / CS); yy++) for (let xx = Math.floor((x - r) / CS); xx <= Math.ceil((x + r) / CS); xx++) {
    if (xx < 0 || yy < 0 || xx >= GW || yy >= GH) continue; const dx = xx * CS - x, dy = yy * CS - y; if (dx * dx + dy * dy <= r2) { const v = fn(yy * GW + xx); if (v !== undefined) return v; } } return -1; };
  const blocker = (x, y, r, id) => scan(x, y, r, k => occ[k] !== -1 && occ[k] !== id ? occ[k] : undefined);
  const mark = (x, y, r, id) => scan(x, y, r, k => { occ[k] = id; });
  const out = [];
  for (let n = 0; n < 9000 && out.length < 1500; n++) {
    const w = pick(WID), x0 = rnd() * (W + 200) - 100, y0 = rnd() * (H + 200) - 100;
    if (blocker(x0, y0, w / 2 + GAP, -2) !== -1) continue;
    const id = out.length, pts = [[x0, y0]]; let hit = null;
    for (const dir of [1, -1]) { let x = x0, y = y0;
      for (let s = 0; s < 220; s++) { const a = ang(x, y), nx = x + Math.cos(a) * STEP * dir, ny = y + Math.sin(a) * STEP * dir;
        if (nx < -120 || nx > W + 120 || ny < -120 || ny > H + 120) break;
        const b = blocker(nx, ny, w / 2 + GAP, id); if (b !== -1) { if (dir > 0) hit = {by: b}; break; }
        mark(x, y, w / 2 + GAP * 0.3, id); x = nx; y = ny; dir > 0 ? pts.push([x, y]) : pts.unshift([x, y]); } }
    if (pts.length * STEP < Math.max(60, w * 4)) continue;
    pts.forEach(p => mark(p[0], p[1], w / 2 + GAP * 0.3, id));
    out.push({pts, w, c: pick(pal), L: (pts.length - 1) * STEP, hit, r: rnd()});
  }
  return {ribbons: out, ang};
}
// 画一条色带的前 len 像素
function ribbon(ctx, R, len, color, from = 0) {
  if (len <= 0.5) return null;
  const i0 = Math.max(0, Math.floor(from / STEP)), end = from + len;
  const n = Math.min(R.pts.length - 1, Math.floor(end / STEP)), fr = end / STEP - n;
  ctx.strokeStyle = color || R.c; ctx.lineWidth = R.w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(R.pts[i0][0], R.pts[i0][1]);
  for (let k = i0 + 1; k <= n; k++) ctx.lineTo(R.pts[k][0], R.pts[k][1]);
  let head = R.pts[n];
  if (n < R.pts.length - 1 && fr > 0) { const a = R.pts[n], b = R.pts[n + 1]; head = [a[0] + (b[0] - a[0]) * fr, a[1] + (b[1] - a[1]) * fr]; ctx.lineTo(head[0], head[1]); }
  ctx.stroke();
  if (R.c === '#FFFFFF' || R.c === '#F6D9B8') { ctx.strokeStyle = 'rgba(22,22,22,.12)'; ctx.lineWidth = 1; ctx.stroke(); }
  return head;
}
function penHead(ctx, R, len, head, look) {
  ctx.lineWidth = 3; ctx.strokeStyle = INK;
  ctx.beginPath(); ctx.arc(head[0], head[1], R.w / 2 + 6, 0, 7); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(head[0], head[1], 4, 0, 7); ctx.fill();
  if (look) {                                    // 接下来要走的路：虚线
    const k0 = Math.floor(len / STEP), k1 = Math.min(R.pts.length - 1, k0 + Math.round(look / STEP));
    if (k1 > k0) { ctx.setLineDash([2, 10]); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(22,22,22,.6)'; ctx.beginPath(); ctx.moveTo(head[0], head[1]);
      for (let k = k0 + 1; k <= k1; k++) ctx.lineTo(R.pts[k][0], R.pts[k][1]); ctx.stroke(); ctx.setLineDash([]); }
  }
}
// 文字：从遮罩里升起
function rise(ctx, text, x, y, font, color, f, at, dur = 16) {
  const p = ease.out3(clamp((f - at) / dur)); if (p <= 0) return 0;
  ctx.save(); ctx.font = font; ctx.textBaseline = 'alphabetic';
  const m = ctx.measureText(text), h = parseFloat(font.match(/(\d+)px/)[1]);
  ctx.beginPath(); ctx.rect(x - 4, y - h * 1.1, m.width + 14, h * 1.38); ctx.clip();
  ctx.fillStyle = color; ctx.fillText(text, x, y + (1 - p) * h * 1.3); ctx.restore(); return m.width;
}
// 规则卡：奶油底 + 墨色描边，弹出来；cardW 由内容决定
function card(ctx, f, at, out, tag, line, code, x = 60, y = 60) {
  if (f < at || f >= out + 12) return;
  const pin = ease.outBack(clamp((f - at) / 14), 1.8), q = f >= out ? ease.in3((f - out) / 12) : 0;
  ctx.save(); ctx.font = '900 64px NotoSC'; const wl = ctx.measureText(line).width; ctx.font = '700 28px JBM'; const wc = code ? ctx.measureText(code).width : 0;
  const cw = Math.max(wl, wc) + 72, ch = code ? 238 : 172;
  ctx.translate(x, y - q * 60); ctx.globalAlpha = 1 - q; ctx.scale(lerp(0.85, 1, pin), lerp(0.85, 1, pin));
  ctx.fillStyle = INK; ctx.fillRect(8, 8, cw, ch);
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, cw, ch); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.strokeRect(0, 0, cw, ch);
  rise(ctx, tag, 36, 54, '700 24px JBM', RED, f, at + 3, 12);
  rise(ctx, line, 34, 136, '900 64px NotoSC', INK, f, at + 6, 16);
  if (code) { ctx.fillStyle = '#E7E0D0'; ctx.fillRect(28, 162, cw - 56, 50); rise(ctx, code, 42, 198, '700 28px JBM', '#2346E0', f, at + 12, 14); }
  ctx.restore();
}

