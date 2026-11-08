// boxart.js — 盲盒的印刷面（Canvas 现画）：正面认角色，侧面列全系列 + 隐藏款剪影
(function (G) {
  function hoodShape(x, kind, cx, cy, s, col) {
    x.fillStyle = col;
    x.beginPath(); x.ellipse(cx, cy, 64 * s, 60 * s, 0, 0, 7); x.fill();
    if (kind === 0) { for (const d of [-1, 1]) { x.beginPath(); x.arc(cx + d * 28 * s, cy - 52 * s, 20 * s, 0, 7); x.fill(); } }
    if (kind === 1) { for (const d of [-1, 1]) { x.beginPath(); x.arc(cx + d * 46 * s, cy - 44 * s, 18 * s, 0, 7); x.fill(); } }
    if (kind === 2) { for (const d of [-1, 1]) { x.beginPath(); x.ellipse(cx + d * 26 * s, cy - 90 * s, 13 * s, 40 * s, d * .2, 0, 7); x.fill(); } }
    if (kind === 3) { for (const d of [-1, 1]) { x.beginPath(); x.moveTo(cx + d * 22 * s, cy - 50 * s); x.lineTo(cx + d * 56 * s, cy - 88 * s); x.lineTo(cx + d * 60 * s, cy - 30 * s); x.fill(); } }
    x.beginPath(); x.ellipse(cx, cy + 82 * s, 44 * s, 40 * s, 0, 0, 7); x.fill();
  }
  function boxArt() {
    const c = document.createElement('canvas'); c.width = 2048; c.height = 1024;
    const x = c.getContext('2d');
    // 正面
    x.fillStyle = '#ffe9a6'; x.fillRect(0, 0, 1024, 1024);
    x.fillStyle = '#ffdf86'; for (let i = -10; i < 20; i++) { x.save(); x.translate(i * 120, 0); x.rotate(.35); x.fillRect(0, -200, 50, 1600); x.restore(); }
    x.fillStyle = '#2b2340'; x.font = '900 300px Fredoka'; x.textAlign = 'center'; x.fillText('BOBO', 512, 380);
    x.font = '600 56px Fredoka'; x.fillText('RAINY DAY SERIES', 512, 470);
    x.fillStyle = '#fff'; x.beginPath(); x.roundRect(180, 540, 664, 380, 40); x.fill();
    hoodShape(x, 0, 512, 730, 1.35, '#7cc27a');
    x.fillStyle = '#ffd8c0'; x.beginPath(); x.ellipse(512, 745, 52, 48, 0, 0, 7); x.fill();
    x.fillStyle = '#2b2340'; x.fillRect(478, 742, 22, 6); x.fillRect(524, 742, 22, 6);
    x.font = '700 40px Fredoka'; x.fillText('?', 900, 980);
    x.fillStyle = '#ff6b5e'; x.beginPath(); x.arc(110, 110, 70, 0, 7); x.fill(); x.fillStyle = '#fff'; x.font = '700 44px Fredoka'; x.fillText('NEW', 110, 126);
    // 侧面：系列一览
    x.fillStyle = '#fff4dc'; x.fillRect(1024, 0, 1024, 1024);
    x.fillStyle = '#2b2340'; x.font = '700 60px Fredoka'; x.fillText('COLLECT ALL 4 + 1', 1536, 120);
    const cols = ['#7cc27a', '#a77a5a', '#f4f0ea', '#4a4258'];
    for (let i = 0; i < 6; i++) {
      const cx = 1024 + 200 + (i % 3) * 312, cy = 330 + Math.floor(i / 3) * 360;
      x.fillStyle = '#fff'; x.beginPath(); x.roundRect(cx - 130, cy - 140, 260, 300, 30); x.fill();
      if (i < 4) hoodShape(x, i, cx, cy, .95, cols[i]);
      else if (i === 4) { hoodShape(x, 0, cx, cy, .95, '#2b2340'); x.fillStyle = '#ffd34d'; x.font = '700 110px Fredoka'; x.fillText('?', cx, cy + 40); }
      else { x.fillStyle = '#2b2340'; x.font = '600 34px Fredoka'; x.fillText('1 / 144', cx, cy + 10); x.font = '500 26px Fredoka'; x.fillText('SECRET', cx, cy + 52); }
    }
    return c;
  }
  G.BOXART = { boxArt };
})(window);
