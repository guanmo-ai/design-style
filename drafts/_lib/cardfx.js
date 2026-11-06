// 快节奏的规则卡（主人 2026-11-06 审液态金属第三版 / 点云第四版：“快节奏还不如这个视频”“有点看不清”“音效一般”）。
// 对标：观默《Awesome AI Motion》宣传片 4.5—8 秒那一段，一张卡 0.5 秒也看得清。拆下来是：
//   1. 字 3—5 帧内整块到位，然后一动不动——不逐字解码、不模糊、不慢慢放大；
//   2. 一道竖光从左往右扫过去，把字“刷”出来（换卡的转场就是这道光）；
//   3. 版面只有一个大标题 + 一行英文 + 一个大一点的公式；左边压暗，保证在任何画面上都能读；
//   4. 每张卡换一个颜色（标签、光、底下一层光晕），一眼就知道“换了一张”；
//   5. 声音：一卡一记干净的重击，落在拍点上（见 song.py 的 card_hit），不再一个字一声“嗒”。
// CARD.html(lf, o) —— lf：这张卡的第几帧；o = { k, n, title, en, fx, accent, scrim, glow:[x, y, r, a] }
const CARD = (() => {
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const out3 = t => 1 - Math.pow(1 - t, 3), out2 = t => 1 - (1 - t) * (1 - t);
  const css = `
.cfx-scrim { position: absolute; inset: 0; }
.cfx-glow { position: absolute; inset: 0; mix-blend-mode: screen; }
.cfx { position: absolute; left: 72px; top: 132px; }
.cfx .no { display: flex; align-items: center; gap: 14px; font-family: GeistMono; font-size: 20px; letter-spacing: .12em; }
.cfx .no i { display: block; width: 26px; height: 4px; border-radius: 2px; background: rgba(255,255,255,.22); }
.cfx .w { font-family: NotoSC; font-weight: 900; font-size: 210px; line-height: 1; margin-top: 14px; letter-spacing: -.02em; color: #fff; text-shadow: 0 6px 40px rgba(0,0,0,.55); transform-origin: 0 60%; white-space: nowrap; }
.cfx .en { font-family: GeistMono; font-size: 26px; letter-spacing: .38em; color: #e6edf5; margin-top: 22px; text-shadow: 0 2px 16px rgba(0,0,0,.8); }
.cfx .fx { font-family: GeistMono; font-size: 32px; color: #fff; margin-top: 26px; padding: 14px 20px; background: rgba(0,0,0,.72); border-left: 5px solid; display: inline-block; white-space: nowrap; }
.cfx-bar { position: absolute; top: 0; height: 1080px; width: 10px; margin-left: -5px; }`;
  if (typeof document !== 'undefined' && !document.getElementById('cfx-css')) {
    const st = document.createElement('style'); st.id = 'cfx-css'; st.textContent = css; document.head.appendChild(st);
  }
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  // 竖光的位置（屏幕 x）：第 0 帧已经在标题第一个字上（切过来的第一帧就有东西），5 帧扫到 1150px（字都在这条线左边）
  const barX = lf => 150 + 1000 * out2(clamp((lf + 1) / 6));
  function html(lf, o) {
    const A = o.accent, x = barX(lf), L = 72, vis = Math.max(0, x - L);
    const clip = `clip-path:inset(-60px calc(100% - ${vis.toFixed(1)}px) -60px -60px)`;
    const sc = 1.06 - 0.06 * out3(clamp(lf / 8)), dx = -18 * (1 - out3(clamp(lf / 8)));
    let h = '';
    if (o.glow) { const [gx, gy, gr, ga] = o.glow, a = ga * (0.55 + 0.45 * out3(clamp(lf / 6)));
      h += `<div class="cfx-glow" style="background:radial-gradient(${gr}px ${gr * 0.8}px at ${gx}px ${gy}px, ${rgba(A, a)}, ${rgba(A, a * 0.35)} 45%, rgba(0,0,0,0) 100%)"></div>`; }
    const s = o.scrim ?? 0.6;
    if (s > 0) h += `<div class="cfx-scrim" style="background:linear-gradient(90deg, rgba(0,0,0,${s}) 0, rgba(0,0,0,${s * 0.75}) 26%, rgba(0,0,0,${s * 0.3}) 46%, rgba(0,0,0,0) 62%)"></div>`;
    const ticks = Array.from({ length: o.n }, (_, i) => `<i style="${i === o.k ? `background:${A};box-shadow:0 0 10px ${A}` : i < o.k ? 'background:rgba(255,255,255,.6)' : ''}"></i>`).join('');
    h += `<div class="cfx" style="${clip}">`
      + `<div class="no" style="color:${A}">RULE ${String(o.k + 1).padStart(2, '0')}<span style="display:flex;gap:6px">${ticks}</span></div>`
      + `<div class="w" style="transform:translateX(${dx.toFixed(1)}px) scale(${sc.toFixed(4)})">${o.title}</div>`
      + `<div class="en">${o.en}</div>`
      + `<div class="fx" style="border-color:${A}">${o.fx}</div></div>`;
    // 竖光：白芯 + 这张卡的颜色的光晕，扫完 3 帧内淡掉
    const bo = 1 - clamp((lf - 4) / 3);
    if (bo > 0) h += `<div class="cfx-bar" style="left:${x.toFixed(1)}px;opacity:${bo.toFixed(3)};background:linear-gradient(90deg, rgba(255,255,255,0), #fff 45%, #fff 55%, rgba(255,255,255,0));box-shadow:0 0 30px 10px ${rgba(A, 0.85)}, 0 0 120px 40px ${rgba(A, 0.35)}"></div>`;
    return h;
  }
  return { html, barX };
})();
