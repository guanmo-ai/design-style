// 一根线的几何：曲率沿弧长积分出来的点列（每 2px 一个点：x, y, 方向 th, 弧长 s, 粗细 w）。
// 鞭线 = 曲率随弧长变化的曲线；整支片子的主线就是一串这样的段首尾相接（位置、方向都连续）。
const PATH = (() => {
  const DS = 2;
  const sm = t => t * t * (3 - 2 * t);
  function Builder(x, y, deg, w) {
    this.p = [{ x, y, th: deg * Math.PI / 180, s: 0, w }];
    this.marks = {};
  }
  Builder.prototype = {
    get last() { return this.p[this.p.length - 1]; },
    push(x, y, th, w) { const q = this.last; this.p.push({ x, y, th, s: q.s + Math.hypot(x - q.x, y - q.y), w }); },
    // 曲率函数 k(u)（u = 0..1，单位 1/px）走 L 长
    clo(L, k, w1, wease = sm) {
      const q0 = this.last, n = Math.max(2, Math.round(L / DS)), ds = L / n, w0 = q0.w;
      let { x, y, th } = q0;
      for (let i = 0; i < n; i++) {
        const u = (i + .5) / n;
        th += k(u) * ds; x += Math.cos(th) * ds; y += Math.sin(th) * ds;
        this.push(x, y, th, w0 + ((w1 ?? w0) - w0) * wease((i + 1) / n));
      }
      return this;
    },
    // 圆弧：deg > 0 往右（顺时针）转
    arc(R, deg, w1) { const L = Math.abs(deg) * Math.PI / 180 * R; return this.clo(L, () => Math.sign(deg) / R, w1); },
    // 光滑地走到 (x, y)，到达时方向 deg（三次 Hermite，再按弧长重采样）
    to(x, y, deg, w1, tension = 1) {
      const q0 = this.last, w0 = q0.w;
      const d = Math.hypot(x - q0.x, y - q0.y) * tension, a1 = deg * Math.PI / 180;
      const m0 = [Math.cos(q0.th) * d, Math.sin(q0.th) * d], m1 = [Math.cos(a1) * d, Math.sin(a1) * d];
      const N = Math.ceil(d * 2) + 20, raw = [];
      for (let i = 0; i <= N; i++) {
        const t = i / N, t2 = t * t, t3 = t2 * t;
        const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
        raw.push([h00 * q0.x + h10 * m0[0] + h01 * x + h11 * m1[0], h00 * q0.y + h10 * m0[1] + h01 * y + h11 * m1[1]]);
      }
      const acc = [0];
      for (let i = 1; i < raw.length; i++) acc.push(acc[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]));
      const L = acc[acc.length - 1], n = Math.max(2, Math.round(L / DS));
      let j = 0, prevTh = q0.th;
      for (let i = 1; i <= n; i++) {
        const s = L * i / n;
        while (j < acc.length - 2 && acc[j + 1] < s) j++;
        const f = (s - acc[j]) / Math.max(1e-9, acc[j + 1] - acc[j]);
        const px = raw[j][0] + (raw[j + 1][0] - raw[j][0]) * f, py = raw[j][1] + (raw[j + 1][1] - raw[j][1]) * f;
        const q = this.last;
        let th = Math.atan2(py - q.y, px - q.x);
        while (th - prevTh > Math.PI) th -= 2 * Math.PI;
        while (th - prevTh < -Math.PI) th += 2 * Math.PI;
        prevTh = th;
        this.push(px, py, th, w0 + ((w1 ?? w0) - w0) * sm(i / n));
      }
      return this;
    },
    mark(name) { this.marks[name] = this.last.s; return this; },
  };
  // 鞭线的曲率：先往一边缓弯（a），再往另一边越卷越紧（b·u^p）。sign 决定往哪边卷
  const whip = (L, a, b, p, sign = 1) => u => sign * (a + b * Math.pow(u, p)) / L * 2;
  // 在点列上按弧长取点（二分）
  function at(P, s) {
    if (s <= 0) return Object.assign({}, P[0], { i: 0 });
    if (s >= P[P.length - 1].s) return Object.assign({}, P[P.length - 1], { i: P.length - 1 });
    let lo = 0, hi = P.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (P[m].s < s) lo = m; else hi = m; }
    const a = P[lo], b = P[hi], f = (s - a.s) / Math.max(1e-9, b.s - a.s);
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, th: a.th + (b.th - a.th) * f, s, w: a.w + (b.w - a.w) * f, i: lo };
  }
  // 一次性的曲线（给枝条用）：从 (x,y,th) 出发，曲率 k(u)，长 L，粗细 w0→w1
  function curve(x, y, th, L, k, w0, w1, n) {
    n = n || Math.max(8, Math.round(L / 4));
    const P = [{ x, y, th, s: 0, w: w0 }], ds = L / n;
    for (let i = 0; i < n; i++) {
      const u = (i + .5) / n;
      th += k(u) * ds; x += Math.cos(th) * ds; y += Math.sin(th) * ds;
      P.push({ x, y, th, s: (i + 1) * ds, w: w0 + (w1 - w0) * Math.pow((i + 1) / n, .8) });
    }
    return P;
  }
  return { Builder, whip, at, curve, DS };
})();
if (typeof module !== 'undefined') module.exports = PATH;
