// 赛璐璐 v4 · 砸字的时间轴（动效配方图、视频共用）
// 0–0.52s 从 z=−10 加速冲向镜头并转正；0.40–0.52s 蓄力压扁；0.52–0.60s 冲击帧（反相黑白 2 帧）；
// 0.60s 闪白 1 帧；之后弹簧回弹到 1。全部是时间的纯函数。
(function (G) {
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const eo3 = x => 1 - Math.pow(1 - cl(x), 3);
  const ei3 = x => Math.pow(cl(x), 3);
  const T1 = .52, T2 = .60;
  function state(t) {
    const z = t < T1 ? -10 + 10.4 * ei3(t / T1) : .4 - .4 * eo3((t - T1) / .5);
    const ry = 2.4 + (-0.42 - 2.4) * eo3(t / T1);
    let sy = 1, sx = 1;
    if (t >= .40 && t < T1) { const k = eo3((t - .40) / .12); sy = 1 - .22 * k; sx = 1 + .18 * k; }
    else if (t >= T1 && t < T2) { sy = 1.16; sx = .88; }
    else if (t >= T2) { const u = t - T2; const w = Math.cos(u * 22) * Math.exp(-u * 7); sy = 1 + .16 * w; sx = 1 - .12 * w; }
    const impact = (t >= T1 && t < T2) ? 1 : 0;
    const flash = (t >= T2 && t < T2 + 1 / 30) ? .85 : 0;
    const burst = t < T1 ? .3 + .4 * ei3(t / T1) : .9 + .7 * Math.exp(-(t - T1) * 3);
    const sla = t < T1 ? .25 + .5 * ei3(t / T1) : .45 + .5 * Math.exp(-(t - T1) * 2);
    const shake = t >= T1 ? .12 * Math.exp(-(t - T1) * 8) : 0;
    return { z, ry, sq: [sx, sy, sx], impact, flash, burst, sla, shake };
  }
  function params(t, extra) {
    const s = state(t);
    // 沿镜头视线飞来：z<0 表示在目标点后面，z>0 表示冲到目标点前面
    const C = [1.9, -2.1, 4.9], Tg = [0, .12, 0];
    const f = [Tg[0] - C[0], Tg[1] - C[1], Tg[2] - C[2]];
    const fl = Math.hypot(f[0], f[1], f[2]);
    const pos = [0, 1, 2].map(i => Tg[i] - f[i] / fl * s.z);
    return Object.assign({
      mode: 0, bg: 0, depth: .30, pos, rot: [.10, s.ry, .08], sq: s.sq,
      cam: [1.9 + s.shake * Math.sin(t * 90), -2.1 + s.shake * Math.cos(t * 77), 4.9], tgt: [0, .12, 0], fov: 2.05,
      impact: s.impact, flash: s.flash, burst: s.burst, sla: s.sla, cen: [.52, .52], time: t, lw: .035
    }, extra || {});
  }
  G.CelMotion = { state, params, T1, T2 };
})(window);
