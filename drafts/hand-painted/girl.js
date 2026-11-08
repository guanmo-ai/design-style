// girl.js — 走在土路上的女孩（背影），赛璐璐画法：细线 + 平涂 + 一层阴影
// 光从左上来（右边是阴影），风从左往右吹（头发、飘带、裙摆往右）
(function (G) {
  const C = {
    line: '#4b3832', skin: '#f6d6c2', skinS: '#dfa894', hair: '#3a2925', hairS: '#24191a', hairH: '#6b4a3e',
    dress: '#fbfaf3', dressS: '#c3cbe2', hat: '#ecd393', hatS: '#c7a462', band: '#d4473a', bandS: '#a83228',
    bag: '#6f93b6', bagS: '#4e6f92', sock: '#ffffff', shoe: '#7a4a33',
  };
  function girl(ctx, x, y, h, o = {}) {
    const s = h / 150;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const lw = 1.25 / Math.max(.6, s) * (o.lw || 1);
    // 贝塞尔路径：[x0,y0, c1x,c1y, c2x,c2y, x,y, ...]
    const path = (p) => { ctx.beginPath(); ctx.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 6) ctx.bezierCurveTo(p[i], p[i + 1], p[i + 2], p[i + 3], p[i + 4], p[i + 5]); ctx.closePath(); };
    const shape = (p, fill, line = true) => { path(p); ctx.fillStyle = fill; ctx.fill(); if (line) { ctx.strokeStyle = C.line; ctx.lineWidth = lw; ctx.stroke(); } };
    const shade = (p, fill) => { path(p); ctx.fillStyle = fill; ctx.fill(); };
    // 投影（往右前方）
    ctx.fillStyle = 'rgba(40,52,70,.32)'; ctx.beginPath(); ctx.ellipse(16, -1, 30, 4.5, .06, 0, 7); ctx.fill();
    // —— 后腿（迈向前，画面上偏高、偏小）——
    shape([4, -50, 5, -36, 6, -20, 6, -10, 7, -8, 11, -8, 11, -10, 11, -20, 10, -36, 10, -50], C.skinS);
    shape([5, -12, 5, -9, 6, -6, 7, -6, 10, -6, 12, -8, 11, -11, 10, -12, 6, -12, 5, -12], C.sock, true);
    shape([5, -7, 3, -5, 5, -3, 9, -3, 13, -3, 14, -5, 12, -7, 9, -8, 6, -8, 5, -7], C.shoe);
    // —— 前腿（往后蹬，靠近镜头）——
    shape([-10, -50, -11, -34, -12, -16, -12, -6, -11, -3, -6, -3, -6, -5, -6, -16, -5, -34, -3, -50], C.skin);
    shade([-6, -50, -6, -34, -7, -16, -7, -6, -6, -5, -6, -5, -6, -6, -6, -16, -5, -34, -3, -50], C.skinS);
    shape([-12, -8, -12, -5, -12, -2, -11, -1, -7, -1, -5, -2, -6, -5, -6, -8, -9, -8, -12, -8], C.sock);
    shape([-13, -1, -15, 1, -13, 3, -9, 3, -4, 3, -3, 1, -5, -1, -8, -2, -11, -2, -13, -1], C.shoe);
    // —— 裙子：A 字，下摆被风吹向右 ——
    shape([-15, -104, -20, -88, -28, -66, -27, -50, -18, -44, -6, -49, 4, -45, 14, -40, 26, -45, 38, -46, 34, -66, 22, -88, 15, -104], C.dress);
    shade([5, -102, 12, -88, 22, -68, 30, -50, 34, -46, 38, -46, 34, -66, 22, -88, 15, -104, 15, -104, 10, -103, 5, -102], C.dressS);
    shade([-27, -50, -20, -47, -12, -48, -6, -49, -8, -54, -18, -55, -26, -56, -26, -56, -27, -53, -27, -50], C.dressS);
    // 裙褶
    ctx.strokeStyle = C.line; ctx.lineWidth = lw * .8;
    for (const [a, b, c2, d] of [[-6, -86, -9, -60, -8, -50], [6, -84, 10, -62, 14, -42]]) { ctx.beginPath(); ctx.moveTo(a, b); ctx.quadraticCurveTo(c2, d, c2 + 1, d + 8); ctx.stroke(); }
    // —— 斜挎小包 ——
    ctx.strokeStyle = C.bagS; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-12, -104); ctx.quadraticCurveTo(4, -86, 18, -72); ctx.stroke();
    shape([12, -78, 12, -70, 13, -64, 15, -62, 22, -61, 28, -63, 28, -66, 28, -72, 27, -78, 20, -80, 14, -79, 12, -78], C.bag);
    shade([22, -79, 27, -78, 28, -72, 28, -66, 28, -63, 24, -62, 22, -62, 24, -70, 23, -76, 22, -79, 22, -79, 22, -79], C.bagS);
    // —— 左臂（往后摆，受光）——
    shape([-14, -102, -20, -94, -24, -82, -26, -72, -25, -68, -21, -67, -20, -71, -18, -82, -15, -92, -10, -100], C.skin);
    // —— 右臂（往前摆，在阴影里，被身体挡掉一半）——
    shape([14, -101, 19, -94, 22, -86, 22, -78, 21, -75, 18, -75, 18, -79, 17, -86, 14, -93, 11, -99], C.skinS);
    // —— 头发：披到肩，往右飘 ——
    shape([-14, -132, -18, -122, -17, -108, -12, -100, -4, -97, 6, -98, 16, -100, 30, -102, 44, -104, 36, -112, 24, -124, 16, -134], C.hair);
    shade([6, -128, 14, -118, 22, -110, 34, -106, 44, -104, 36, -112, 26, -122, 16, -132, 16, -132, 12, -132, 6, -128], C.hairS);
    shape([22, -118, 32, -112, 46, -110, 56, -104, 48, -114, 36, -120, 28, -124, 26, -122, 24, -120, 22, -118, 22, -118, 22, -118], C.hair);
    ctx.strokeStyle = C.hairH; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(-8, -120); ctx.quadraticCurveTo(-6, -110, -2, -102); ctx.stroke();
    // —— 草帽：从后上方看，帽檐是扁椭圆 ——
    ctx.save(); ctx.translate(1, -134); ctx.rotate(-.1);
    ctx.fillStyle = C.hat; ctx.beginPath(); ctx.ellipse(0, 0, 33, 10.5, 0, 0, 7); ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = lw; ctx.stroke();
    ctx.fillStyle = C.hatS; ctx.beginPath(); ctx.ellipse(5, 2.5, 27, 6.5, 0, -.15, Math.PI + .15); ctx.fill();
    ctx.fillStyle = C.hat; ctx.beginPath(); ctx.moveTo(-15, -2); ctx.bezierCurveTo(-15, -15, -8, -19, 0, -19); ctx.bezierCurveTo(9, -19, 15, -15, 15, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.hatS; ctx.beginPath(); ctx.moveTo(5, -18); ctx.bezierCurveTo(11, -16, 15, -12, 15, -2); ctx.lineTo(8, -2); ctx.bezierCurveTo(9, -9, 8, -14, 5, -18); ctx.fill();
    ctx.fillStyle = C.band; ctx.fillRect(-15, -7, 30, 5); ctx.strokeStyle = C.line; ctx.strokeRect(-15, -7, 30, 5);
    ctx.restore();
    // 飘带
    shape([15, -142, 26, -147, 38, -140, 54, -146, 50, -141, 40, -133, 27, -138, 19, -138], C.band);
    shape([15, -140, 24, -135, 35, -126, 48, -128, 44, -124, 33, -120, 24, -130, 17, -136], C.bandS);
    ctx.restore();
  }
  // 两只红蜻蜓
  function dragonfly(ctx, x, y, s, a) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.strokeStyle = 'rgba(80,60,60,.5)'; ctx.lineWidth = .6;
    for (const [dx, sy] of [[-2, -1], [-2, 1], [2, -1], [2, 1]]) { ctx.beginPath(); ctx.ellipse(dx, sy * 5, 1.8, 5.5, sy * .25, 0, 7); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#c8402e'; ctx.beginPath(); ctx.ellipse(-6, 0, 9, 1.2, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(3.5, 0, 1.8, 0, 7); ctx.fill();
    ctx.restore();
  }
  G.GIRL = { girl, dragonfly, C };
})(window);
