// 赛璐璐 · 动画眼睛（从 opening/scene.js 抽出，概念图共用）
(function (G) {
  const lerp = (a, b, u) => a + (b - a) * u;
  // ═══════════ 眼睛（眼睛本地坐标，宽约 910）═══════════
  const X0 = -430, X1 = 480;
  const uOf = x => (x - X0) / (X1 - X0);
  const Up = x => { const u = uOf(x); return 40 - 235 * Math.pow(Math.sin(Math.PI * u), .85) + 30 * u; };
  const Lo = x => { const u = uOf(x); return 40 + 115 * Math.pow(Math.sin(Math.PI * u), 1.3) - 25 * u; };
  const Uo = (x, o) => Lo(x) + (Up(x) - Lo(x)) * o;
  const XS = []; for (let i = 0; i <= 90; i++) XS.push(lerp(X0, X1, i / 90));
  const IR = [30, -15], IRR = 185;
  function eyePath(ctx, o) {
    ctx.beginPath();
    XS.forEach((x, i) => i ? ctx.lineTo(x, Uo(x, o)) : ctx.moveTo(x, Uo(x, o)));
    for (let i = XS.length - 1; i >= 0; i--) ctx.lineTo(XS[i], Lo(XS[i]));
    ctx.closePath();
  }
  const L_BG = ctx => {
    ctx.fillStyle = '#FFE3CF'; ctx.fillRect(-700, -540, 1400, 1000);
    const g = ctx.createRadialGradient(150, 300, 20, 150, 300, 420);
    g.addColorStop(0, 'rgba(255,160,140,.40)'); g.addColorStop(1, 'rgba(255,160,140,0)');
    ctx.fillStyle = g; ctx.fillRect(-700, -540, 1400, 1000);
    ctx.strokeStyle = 'rgba(232,96,96,.6)'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(60 + k * 46, 330); ctx.lineTo(30 + k * 46, 392); ctx.stroke(); }
  };
  const L_COLOR = (ctx, o) => {
    ctx.save(); eyePath(ctx, o); ctx.clip();
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-700, -540, 1400, 1000);
    ctx.beginPath(); ctx.arc(IR[0], IR[1], IRR, 0, 6.283); ctx.fillStyle = '#3F6BFF'; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(IR[0], IR[1], IRR, 0, 6.283); ctx.clip();
    ctx.beginPath(); ctx.ellipse(IR[0], IR[1] + 120, 175, 110, 0, 0, 6.283); ctx.fillStyle = '#86ACFF'; ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(IR[0], IR[1] + 15, 72, 92, 0, 0, 6.283); ctx.fillStyle = '#121A4E'; ctx.fill();
    ctx.restore();
  };
  const L_SHADOW = (ctx, o) => {
    ctx.save(); eyePath(ctx, o); ctx.clip();
    ctx.beginPath();
    XS.forEach((x, i) => i ? ctx.lineTo(x, Uo(x, o) - 4) : ctx.moveTo(x, Uo(x, o) - 4));
    for (let i = XS.length - 1; i >= 0; i--) ctx.lineTo(XS[i], Uo(XS[i], o) + 74);
    ctx.closePath(); ctx.fillStyle = 'rgba(46,30,120,.34)'; ctx.fill();
    ctx.beginPath(); ctx.arc(IR[0], IR[1], IRR, 0, 6.283); ctx.clip();
    ctx.beginPath();
    XS.forEach((x, i) => i ? ctx.lineTo(x, Uo(x, o) - 4) : ctx.moveTo(x, Uo(x, o) - 4));
    for (let i = XS.length - 1; i >= 0; i--) ctx.lineTo(XS[i], Uo(XS[i], o) + 130);
    ctx.closePath(); ctx.fillStyle = 'rgba(10,10,70,.42)'; ctx.fill();
    ctx.restore();
  };
  const L_LINE = (ctx, o) => {
    ctx.fillStyle = '#1A1426';
    const w = u => 6 + 30 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.05)), .6) + 14 * Math.max(0, u - .7) / .3;
    ctx.beginPath();
    XS.forEach((x, i) => { const y = Uo(x, o) - w(uOf(x)); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    for (let i = XS.length - 1; i >= 0; i--) ctx.lineTo(XS[i], Uo(XS[i], o) + 4);
    ctx.closePath(); ctx.fill();
    // 睫毛：外眼角三簇
    [[.80, -60, -70], [.88, -20, -78], [.96, 30, -60]].forEach(([u, dx, dy]) => {
      const x = lerp(X0, X1, u), y = Uo(x, o) - w(u) + 4;
      ctx.beginPath(); ctx.moveTo(x - 26, y + 8); ctx.quadraticCurveTo(x + dx * .4, y + dy * .6, x + dx, y + dy * (.4 + .6 * o)); ctx.lineTo(x + 18, y + 6); ctx.closePath(); ctx.fill();
    });
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#3A2A3A'; ctx.lineWidth = 6;
    ctx.beginPath(); XS.filter(x => uOf(x) > .25 && uOf(x) < .95).forEach((x, i) => i ? ctx.lineTo(x, Lo(x)) : ctx.moveTo(x, Lo(x))); ctx.stroke();
    if (o > .3) {
      ctx.save(); eyePath(ctx, o); ctx.clip();
      ctx.strokeStyle = '#1C2560'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(IR[0], IR[1], IRR, 0, 6.283); ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = 'rgba(70,40,50,.75)'; ctx.lineWidth = 5;
      ctx.beginPath(); XS.filter(x => uOf(x) > .18 && uOf(x) < .8).forEach((x, i) => { const y = Up(x) - 62 * o - 6; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
    }
    // 眉毛
    ctx.fillStyle = '#3A2630';
    ctx.beginPath();
    for (let i = 0; i <= 30; i++) { const u = i / 30, x = lerp(-390, 400, u), y = -350 - 70 * Math.sin(Math.PI * u * .9) + 10 * u; i ? ctx.lineTo(x, y - 6 - 26 * Math.sin(Math.PI * Math.min(1, u * 1.2))) : ctx.moveTo(x, y); }
    for (let i = 30; i >= 0; i--) { const u = i / 30, x = lerp(-390, 400, u), y = -350 - 70 * Math.sin(Math.PI * u * .9) + 10 * u; ctx.lineTo(x, y + 6); }
    ctx.closePath(); ctx.fill();
  };
  const L_HI = (ctx, o) => {
    if (o < .5) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.ellipse(-25, -75, 54, 40, -.4, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(95, 55, 18, 0, 6.283); ctx.fill();
    const s = 26; ctx.beginPath(); ctx.moveTo(-110, 40 - s); ctx.lineTo(-104, 34); ctx.lineTo(-110 + s, 40); ctx.lineTo(-104, 46); ctx.lineTo(-110, 40 + s); ctx.lineTo(-116, 46); ctx.lineTo(-110 - s, 40); ctx.lineTo(-116, 34); ctx.closePath(); ctx.fill();
  };
  const LAYERS = [
    { f: L_BG, n: '01 背景', d: '手绘 · 不描线' },
    { f: L_COLOR, n: '02 上色', d: '平涂 · 4 色' },
    { f: L_SHADOW, n: '03 阴影', d: '硬边 · 单独一张' },
    { f: L_LINE, n: '04 线稿', d: '粗细 6 → 36px' },
    { f: L_HI, n: '05 高光', d: '纯白 · 最后叠' }
  ];
  G.Eye = { LAYERS, eyePath, Up, Lo, Uo, XS, X0, X1, uOf, IR, IRR };
})(window);
