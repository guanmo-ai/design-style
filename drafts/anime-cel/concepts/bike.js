// 赛璐璐 · 摩托（从 opening/scene.js 抽出）
(function (G) {
  function bikeXf(roll) { return { sy: Math.cos(roll), kx: -Math.sin(roll) * .55, r: -.06 * Math.sin(roll) }; }
  const BY = 0;
  function drawBike(ctx, x, lean, alpha) {
    const X = bikeXf(lean);
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, BY + 96); ctx.rotate(X.r); ctx.scale(1, X.sy); ctx.transform(1, 0, X.kx, 1, 0, 0); ctx.translate(0, -96);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const INKC = '#0D0D1A';
    // 前叉、车架
    ctx.strokeStyle = INKC; ctx.lineWidth = 22;
    ctx.beginPath(); ctx.moveTo(-235, 0); ctx.lineTo(-170, -150); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(235, 0); ctx.lineTo(120, -90); ctx.stroke();
    // 轮子：大、露在车身外
    for (const wx of [-235, 235]) {
      ctx.fillStyle = INKC; ctx.beginPath(); ctx.arc(wx, 0, 96, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#2A2E52'; ctx.beginPath(); ctx.arc(wx, 0, 56, 0, 6.283); ctx.fill();
      ctx.strokeStyle = '#5C7CFF'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(wx, 0, 74, 3.7, 5.3); ctx.stroke();
      ctx.fillStyle = '#9AA6D8'; ctx.beginPath(); ctx.arc(wx, 0, 14, 0, 6.283); ctx.fill();
    }
    // 车身：低趴的红色胶囊，从前叉到后轮上方
    ctx.beginPath();
    ctx.moveTo(-205, -118); ctx.quadraticCurveTo(-200, -205, -90, -212); ctx.lineTo(90, -200);
    ctx.quadraticCurveTo(200, -192, 268, -118); ctx.lineTo(250, -70); ctx.lineTo(60, -62); ctx.lineTo(-30, -40); ctx.lineTo(-150, -60); ctx.closePath();
    ctx.fillStyle = '#E8202E'; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#8E0B2A'; ctx.fillRect(-300, -110, 600, 90);       // 下半：硬边阴影
    ctx.fillStyle = '#FF8A7E'; ctx.fillRect(-300, -214, 600, 24);       // 顶：硬边高光
    ctx.restore();
    ctx.strokeStyle = INKC; ctx.lineWidth = 10; ctx.stroke();
    // 座位
    ctx.fillStyle = INKC; ctx.beginPath(); ctx.moveTo(40, -205); ctx.quadraticCurveTo(120, -238, 200, -196); ctx.lineTo(60, -196); ctx.closePath(); ctx.fill();
    // 挡风
    ctx.beginPath(); ctx.moveTo(-170, -200); ctx.quadraticCurveTo(-200, -300, -90, -300); ctx.lineTo(-50, -212); ctx.closePath();
    ctx.fillStyle = '#9FD8FF'; ctx.fill(); ctx.lineWidth = 9; ctx.stroke();
    // 车头灯、尾灯
    ctx.fillStyle = '#FFF4B0'; ctx.beginPath(); ctx.arc(-214, -150, 22, 0, 6.283); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#FF3040'; ctx.beginPath(); ctx.ellipse(262, -128, 12, 18, 0, 0, 6.283); ctx.fill();
    ctx.restore();
  }
  G.drawBike = drawBike;
})(window);
