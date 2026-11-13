// 翻牌墙：牌堆、日程表、整片的“目标画面”。
// 全片只有一条规则：每块牌是一叠按固定顺序排的卡片，只能往前翻，一张 4 帧。
// 画面只决定“这块牌在第几帧开始想要哪一张”（目标），什么时候到站是规则算出来的：到站 = 起跑 + 张数 × 4 帧。
const WALL = (() => {
  const COLS = 60, ROWS = 26, N = COLS * ROWS, F = 4;              // F：一张牌掉下来 4 帧 = 67 ms
  // 牌堆顺序（循环）。黄紧跟在空白后面：点亮只要 1 张；熄灭要翻过整副 42 张——所以动的东西后面拖着一条“还在翻”的尾巴
  const DECK = [' ', '#Y', '9', '8', '7', '6', '5', '4', '3', '2', '1', '0', ':', '-', '#R',
    ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '观', '默'];
  const NC = DECK.length;                                          // 43
  const ID = ch => { const i = DECK.indexOf(ch); if (i < 0) throw new Error('not in deck: ' + ch); return i; };
  const BL = 0, YEL = 1, RED = ID('#R');
  const cx = c => (c - (COLS - 1) / 2) * 1.0, cy = r => ((ROWS - 1) / 2 - r) * 1.3;
  const hash = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7 + 7.3) * 43758.5453; return x - Math.floor(x); };

  // —— 卡面图集（8 × 6 格）——
  const CW = 288, CH = 384;
  function atlas() {
    const cv = document.createElement('canvas'); cv.width = CW * 8; cv.height = CH * 6;
    const g = cv.getContext('2d');
    g.fillStyle = '#0a0a0a'; g.fillRect(0, 0, cv.width, cv.height);
    DECK.forEach((ch, i) => {
      const x0 = (i % 8) * CW, y0 = Math.floor(i / 8) * CH;
      g.save(); g.translate(x0, y0);
      const bg = ch === '#Y' ? '#FFD400' : ch === '#R' ? '#E8392B' : '#161616';
      g.beginPath(); g.roundRect(0, 0, CW, CH, 18); g.fillStyle = bg; g.fill(); g.clip();
      // 很弱的竖向渐变 + 磨损
      const gr = g.createLinearGradient(0, 0, 0, CH); gr.addColorStop(0, 'rgba(255,255,255,0.05)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.10)');
      g.fillStyle = gr; g.fillRect(0, 0, CW, CH);
      if (ch.length === 1 && ch !== ' ') {
        g.fillStyle = '#F2EDE3'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
        const cjk = /[一-鿿]/.test(ch);
        g.font = cjk ? `900 ${CH * 0.62}px "NotoSC"` : `600 ${CH * 0.80}px "Oswald"`;
        const m = g.measureText(ch), hgt = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
        const sx = Math.min(1, (CW * 0.86) / m.width);
        g.save(); g.translate(CW / 2, CH / 2 + hgt / 2 - m.actualBoundingBoxDescent); g.scale(sx, 1); g.fillText(ch, 0, 0); g.restore();
      }
      // 边缘磨损：亮一点的细边 + 星点
      g.strokeStyle = ch === '#Y' ? 'rgba(255,250,210,0.35)' : 'rgba(255,255,255,0.08)'; g.lineWidth = 3;
      g.beginPath(); g.roundRect(2, 2, CW - 4, CH - 4, 16); g.stroke();
      for (let k = 0; k < 140; k++) {
        const e = hash(i, k) * 4 | 0, p = hash(k, i + 9);
        const px = e === 0 ? p * CW : e === 1 ? CW - hash(k, 3) * 10 : e === 2 ? p * CW : hash(k, 4) * 10;
        const py = e === 0 ? hash(k, 5) * 10 : e === 1 ? p * CH : e === 2 ? CH - hash(k, 6) * 10 : p * CH;
        g.fillStyle = `rgba(${ch === '#Y' ? '255,245,200' : '210,205,195'},${0.05 + 0.12 * hash(k, i + 2)})`;
        g.fillRect(px, py, 1 + hash(k, 8) * 3, 1 + hash(k, 7) * 3);
      }
      g.restore();
    });
    return cv;
  }

  // —— 像素字：把一个字按格子（宽 1.0、高 1.3）量覆盖率 ——
  function pixelGlyph(ch, cols, rows, font, thr = 0.42) {
    const s = 24, cv = document.createElement('canvas'); cv.width = cols * s; cv.height = Math.round(rows * 1.3 * s);
    const g = cv.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.font = `${font} ${cv.height}px "NotoSC"`;
    const m = g.measureText(ch), hh = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent, ww = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    g.save(); g.translate(cv.width / 2, cv.height / 2); g.scale(cv.width / ww * 0.98, cv.height / hh * 0.98);
    g.fillText(ch, (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2, (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2); g.restore();
    const d = g.getImageData(0, 0, cv.width, cv.height).data, out = [];
    const ch_ = cv.height / rows;
    for (let r = 0; r < rows; r++) { const row = []; for (let c = 0; c < cols; c++) {
      let sum = 0, n = 0;
      for (let y = Math.floor(r * ch_); y < Math.floor((r + 1) * ch_); y += 2) for (let x = c * s; x < (c + 1) * s; x += 2) { sum += d[(y * cv.width + x) * 4]; n++; }
      row.push(sum / n / 255 > thr ? 1 : 0); } out.push(row); }
    return out;
  }

  // —— 日程表：目标(格, 帧) 扫一遍 → 每格一串 [帧, 目标牌] ——
  let EV = null, C0 = null;
  function build(target, f0, f1) {
    EV = []; C0 = new Int16Array(N);
    for (let id = 0; id < N; id++) {
      const ev = []; let cur = target(id, f0); C0[id] = cur;
      for (let f = f0 + 1; f < f1; f++) { const t = target(id, f); if (t !== cur) { ev.push([f, t]); cur = t; } }
      EV.push(ev);
    }
  }
  // 第 id 格在时间 t（帧，可带小数）的状态：k 当前牌；u ∈ [0,1) 正在掉的进度（-1 = 没在翻）；land 上一次落定的时间
  function state(id, t) {
    let k = C0[id], free = -1e9, land = -1e9;
    const ev = EV[id];
    for (let j = 0; j < ev.length; j++) {
      const [s, T] = ev[j];
      if (s > t) break;
      const start = Math.max(s, free);
      const n = ((T - k) % NC + NC) % NC;
      const lim = j + 1 < ev.length ? ev[j + 1][0] : 1e9;
      const m = start >= lim ? 0 : Math.min(n, Math.ceil((lim - start) / F));
      if (m > 0 && t < start + m * F) {
        if (t < start) return { k, u: -1, land };
        const i = Math.floor((t - start) / F);
        return { k: (k + i) % NC, u: (t - start) / F - i, land: i > 0 ? start + i * F : land };
      }
      if (m > 0) { k = (k + m) % NC; free = start + m * F; land = free; }
    }
    return { k, u: -1, land };
  }
  // 全部落定的时间（给配乐“嗒”）
  function landings(id, f1) {
    const out = []; let k = C0[id], free = -1e9; const ev = EV[id];
    for (let j = 0; j < ev.length; j++) {
      const [s, T] = ev[j]; const start = Math.max(s, free);
      const n = ((T - k) % NC + NC) % NC, lim = j + 1 < ev.length ? ev[j + 1][0] : 1e9;
      const m = start >= lim ? 0 : Math.min(n, Math.ceil((lim - start) / F));
      for (let i = 1; i <= m; i++) if (start + i * F < f1) out.push(start + i * F);
      if (m > 0) { k = (k + m) % NC; free = start + m * F; }
    }
    return out;
  }

  // —— 一个时刻的所有片 ——
  const BOUNCE = 0.04, BDUR = 3;
  const theta = u => Math.PI * u * u;                               // 重力：θ ∝ t²
  function pieces(t, out) {
    let n = 0;
    const put = (x, y, th, kind, a, b, e, s) => { const o = n * 8; out[o] = x; out[o + 1] = y; out[o + 2] = th; out[o + 3] = kind; out[o + 4] = a; out[o + 5] = b; out[o + 6] = e; out[o + 7] = s; n++; };
    for (let id = 0; id < N; id++) {
      const c = id % COLS, r = (id / COLS) | 0, x = cx(c), y = cy(r);
      const st = state(id, t);
      const nx = (st.k + 1) % NC;
      const since = t - st.land;
      const bth = since >= 0 && since < BDUR ? Math.PI * BOUNCE * Math.sin(Math.PI * since / BDUR) : 0;
      if (st.u < 0) {
        put(x, y, 0, 0, st.k, 0, 0, 0);
        put(x, y, Math.PI - bth, 1, 0, st.k, 0, 0);
      } else {
        const th = theta(st.u);
        const ext = Math.max(0, Math.min(1, -(Math.cos(th) - 1.15 * Math.sin(th)) * 0.9));
        const str = 0.6 * Math.min(1, Math.max(0, (th - 0.35 * Math.PI) / (0.6 * Math.PI)));
        put(x, y, 0, 0, nx, 0, 0, 0);
        put(x, y, Math.PI - bth, 1, 0, st.k, ext, str);
        put(x, y, th, 2, st.k, nx, 0, 0);
      }
      put(x, y, 0, 3, 0, 0, 0, 0);
    }
    return n;
  }
  return { COLS, ROWS, N, F, DECK, NC, ID, BL, YEL, RED, cx, cy, hash, atlas, pixelGlyph, build, state, landings, pieces, theta, BOUNCE, BDUR, get EV() { return EV; }, get C0() { return C0; } };
})();
