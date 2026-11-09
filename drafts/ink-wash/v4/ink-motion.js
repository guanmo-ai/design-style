// 水墨 v4 · 时间轴（动效配方图、视频共用）
(function (G) {
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const eo3 = x => 1 - Math.pow(1 - cl(x), 3);
  const eio = x => { x = cl(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const eback = x => { x = cl(x); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  function state(t) {
    const spread = t < 1.4 ? .03 + .22 * eo3(t / 1.4) : .25 + .06 * eo3((t - 1.4) / 3.6);
    const redR = t < 2.4 ? 0 : .03 + .08 * eo3((t - 2.4) / 1.6);
    const back = .5 * eo3(t / 2.2);
    const title = eio((t - 3.2) / 1.6);
    const sealK = cl((t - 4.4) / .24);
    const seal = sealK > 0 ? 1.5 + (1 - 1.5) * eback(sealK) : 0;
    const wipe = -.22 * (1 - eo3(t / 1.8));   // 开场只有一滴，墨丝 1.8s 内慢慢长满
    return { spread, redR, back, title, seal, sealK, wipe, flowT: 1.2 + t * .42 };
  }
  function params(t, extra) {
    const s = state(t);
    return Object.assign({
      t: s.flowT, seed: 3.7, c: [.44, .48], spread: s.spread, scale: 2.5, back: s.back, wipe: s.wipe,
      red: s.redR > 0 ? [.63, .68, s.redR, 1] : [0, 0, .1, 0]
    }, extra || {});
  }
  G.InkMotion = { state, params };
})(window);
