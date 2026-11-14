// hud.js — 画面上的字：设计师能拿走的数直接标在正在发生的地方（小号等宽字 + 一根标注线），不单独开一章。
// 每个字都走 TFX.decode（落定一个字登记一个声音 cue，配乐读 events.json）。
const HUDM = (() => {
  const $ = id => document.getElementById(id);
  const D = (h, f, f0, o = {}) => TFX.decode(h, f, f0, Object.assign({ rate: 0.7 }, o));
  const fade = (f, a, b, d = 10) => Math.min(prog(f, a, a + d), 1 - prog(f, b - d, b));
  // 标注：[开始, 结束, 锚点(f) → 水面坐标, 字块相对锚点的偏移, 行]
  const R1 = f => { const st = B.ops[0](f); return st ? Math.sqrt(st[3]) : 0; };
  // 锚点都是桌面坐标（B 盘在 x = TB）
  const NOTES = [
    [178, 396, f => [TB + B.c1[0] + 0.71 * R1(f), B.c1[1] - 0.71 * R1(f)], [90, -200], f => [
      '<span class="k">滴</span>P′ = C + (P−C)·√(1 + r²/|P−C|²)',
      '<span class="s">r ∝ √t：面积匀速流出，开头快、后面慢</span>',
      `<span class="s">r = ${String(Math.round(R1(f))).padStart(3, '0')} px</span>`]],
    [446, 560, f => { const i = f < TL.rake[1][0] ? 0 : 1, [a, b] = TL.rake[i], t = B.rakeTip(f, [a, b]); return [TB + [-600, 750][i], i === 1 ? -t : t]; }, { fixed: [1130, 150] }, () => [
      '<span class="k">耙</span>P′ = P + z·u<sup>d</sup>·M',
      '<span class="s">齿距 300 · z 150 · 下去、再错开半齿上来</span>']],
    [562, 644, f => [TB + B.combTip(f), 6 + 28 * 9], [50, 40], () => [
      '<span class="k">梳</span>同一条公式，齿距 28 px',
      '<span class="s">z 80 · λ 7 · 拉一道 = 一排羽纹</span>']],
    [652, 730, () => [TB + B.cc[1][0], B.cc[1][1]], [120, 160], () => [
      '<span class="k">卷</span>θ(r) = θ₀·e<sup>−r²/R²</sup>',
      '<span class="s">R 175 · θ₀ 1.2 圈 · 转多少圈都保面积</span>']],
    [744, 836, null, null, () => [
      '放大 21 倍，边缘还是锐的',
      '<span class="s">每个像素倒着查回它落进的那一滴</span>']],
    [872, 980, f => { const e = eggAt(Math.min(f, TL.dip[2])); return [e.x + EGG.a * 0.95, e.z, 0]; }, { fixed: [60, 120] }, () => [
      '<span class="k">浸</span>沉下去吃掉多少膜，蛋上就包多少',
      '<span class="s">πρ₀² = 蛋上包住的面积 = 2πa·h（阿基米德）</span>',
      '<span class="s">四周的膜往里流：|P′−C|² = |P−C|² − ρ₀²</span>']],
  ];
  const PHASES = [[168, '滴'], [444, '耙'], [560, '梳'], [640, '卷'], [842, '浸']];
  function noteBox(f, n, cam) {
    const [a, b, anchor, off] = n; if (f < a || f >= b) return null;
    if (!anchor) return { x: 64, y: 150, p: null, a };
    const an = anchor(f), p = toScreen(cam, an[0], an[1], an[2] || 0);
    if (!isFinite(p[0]) || !isFinite(p[1])) return off.fixed ? { x: off.fixed[0], y: off.fixed[1], p: null, a } : null;
    if (off.fixed) return { x: off.fixed[0], y: off.fixed[1], p: p[1] > -50 && p[1] < 1130 ? p : null, a };
    let x = p[0] + off[0], y = p[1] + off[1];
    x = clamp(x, 40, 1920 - 760); y = clamp(y, 140, 1080 - 200);
    return { x, y, p, a };
  }
  function draw(f, s) {
    let h = '';
    // 动作的顺序：滴 → 耙 → 梳 → 卷
    if (f >= 168 && f < 990) {
      let cur = -1; PHASES.forEach(([t], i) => { if (f >= t) cur = i; });
      const op = fade(f, 168, 990, 12);
      h += `<div class="tag" id="chain" style="opacity:${op.toFixed(3)}">${PHASES.map(([t, w], i) => `<span class="${i === cur ? 'on' : ''}">${D(w, f, t, { rate: 1 })}</span>`).join(D(' → ', f, 170, { rate: 1, kind: 'small' }))}</div>`;
    }
    NOTES.forEach(n => {
      const bx = noteBox(f, n, s.cam); if (!bx) return;
      const op = fade(f, n[0], n[1], 8), lines = n[4](f);
      h += `<div class="tag" style="left:${bx.x.toFixed(1)}px;top:${bx.y.toFixed(1)}px;opacity:${op.toFixed(3)}">${lines.map((l, i) => `<div>${D(l, f, n[0] + 4 + i * 14)}</div>`).join('')}</div>`;
    });
    // ×20 的读数
    if (f >= TL.dive[0] && f < TL.dive[2]) {
      const z = s.cam[2] / 1.0, op = fade(f, TL.dive[0], TL.dive[2], 10);
      h += `<div id="zoom" style="opacity:${op.toFixed(3)}">×${D(z.toFixed(1).padStart(4, '0'), f, TL.dive[0] + 2, { rate: 1, kind: 'small' })}</div>`;
    }
    // 色板：每种颜色第一次滴下去时亮出来
    if (f >= 178 && f < 400) {
      const used = new Map(); B.drops.forEach(d => { if (!used.has(d.col)) used.set(d.col, d.f); });
      const op = fade(f, 176, 400, 10);
      h += `<div class="tag" id="pal" style="opacity:${op.toFixed(3)}">${[...used.entries()].filter(([c, t]) => f >= t && c !== 6).map(([c, t]) => `<span><i style="background:${MARBLE.PAL[MARBLE.ORDER[c]]}"></i>${D(MARBLE.PAL[MARBLE.ORDER[c]], f, t, { rate: 0.8, kind: 'small' })}</span>`).join('')}<span><i style="background:#F4EBDD"></i>${D('#F4EBDD 水', f, 300, { rate: 0.8, kind: 'small' })}</span></div>`;
    }
    // 片尾署名
    if (f >= TL.sign) {
      h += `<div class="tag" style="left:1530px;top:680px;transform:translateX(-50%);font-family:SerifSC;font-weight:700;font-size:40px;letter-spacing:0.35em;padding:10px 18px 10px 30px">${D('观默', f, TL.sign, { rate: 3, kind: 'title' })}</div>`;
    }
    $('hud').innerHTML = h;
  }
  // 标注线（画在工具那层 canvas 上）
  function lines(ctx, f, s) {
    NOTES.forEach(n => {
      const bx = noteBox(f, n, s.cam); if (!bx || !bx.p) return;
      const op = fade(f, n[0], n[1], 8) * prog(f, n[0], n[0] + 6);
      const tx = bx.x < bx.p[0] ? bx.x + 20 : bx.x, ty = bx.y < bx.p[1] ? bx.y + 60 : bx.y;
      ctx.save(); ctx.globalAlpha = op; ctx.strokeStyle = '#17140F'; ctx.fillStyle = '#17140F'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(bx.p[0], bx.p[1]); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.beginPath(); ctx.arc(bx.p[0], bx.p[1], 7, 0, 7); ctx.fill();
      ctx.fillStyle = '#FBF6EC'; ctx.beginPath(); ctx.arc(bx.p[0], bx.p[1], 3, 0, 7); ctx.fill();
      ctx.restore();
    });
  }
  return { draw, lines };
})();
