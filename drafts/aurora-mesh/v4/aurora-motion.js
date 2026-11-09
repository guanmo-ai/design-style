// 极光 v4 · 时间轴（动效配方图、视频共用）
// 0.3–2.0s 极光从黑里亮起；光帘持续飘动；2.5–4.2s 玻璃球从湖里升起（带回弹），涟漪随之扩散；4.2–5.8s 标题收拢。
(function (G) {
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const eio = x => { x = cl(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const eback = (x, s = 1.2) => { x = cl(x); const c3 = s + 1; return 1 + c3 * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };
  function state(t) {
    const int = eio((t - .3) / 1.7) * (1 + .04 * Math.sin(t * 3.1));
    const rise = eback((t - 2.5) / 1.7);
    const orbY = t < 2.5 ? -.2 : -.12 + (.45 + .12) * rise;
    const rip = t < 2.5 ? .3 : .3 + 2.2 * Math.exp(-(t - 2.6) * 1.5);
    const title = eio((t - 4.2) / 1.6);
    return { int, orbY, rip, title, flowT: 2.0 + t * 1.8 };
  }
  function params(t, extra) {
    const s = state(t);
    return Object.assign({ t: s.flowT, int: s.int, orb: s.orbY > -.15 ? { x: .70, y: s.orbY, r: .115 } : null, hor: .30, rip: s.rip, seed: 1.3 }, extra || {});
  }
  G.AuroraMotion = { state, params };
})(window);
