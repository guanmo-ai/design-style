// kit/motion.js — 动作的基本件（任何风格都能用，无依赖）。
// 全局函数：clamp / lerp / lerp3 / prog / ease / spring / pop / squash；矩阵 M（= KIT.m4）、about / sq / popIn / ID；
// KIT.springKernel + springPoses：“身体停了，附属的东西晚半拍、冲过头、抖回来”——不做模拟，每帧仍是帧号的纯函数。
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const prog = (f, a, b) => clamp((f - a) / (b - a));
const ease = {
  in2: t => t * t, in3: t => t * t * t, out2: t => 1 - (1 - t) * (1 - t), out3: t => 1 - Math.pow(1 - t, 3), out5: t => 1 - Math.pow(1 - t, 5),
  inOut2: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  inOut3: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outBack: (t, s = 1.7) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
};
// 欠阻尼弹簧的阶跃响应：0 → 1，冲过头再回来
const spring = (sec, freq = 2.6, zeta = 0.38) => {
  if (sec <= 0) return 0; const w = 2 * Math.PI * freq, wd = w * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * w * sec) * (Math.cos(wd * sec) + zeta * w / wd * Math.sin(wd * sec));
};
const pop = (f, f0, freq, zeta) => spring((f - f0) / 60, freq, zeta);
// 一下“压扁再弹回”：f0 那一帧开始，d 帧压到最扁（1 − amt），之后弹簧弹回 1
const squash = (f, f0, amt = 0.25, d = 5, freq = 3.2, zeta = 0.3) => f < f0 ? 1 : f < f0 + d ? 1 - amt * ease.out2((f - f0) / d) : 1 - amt * (1 - spring((f - f0 - d) / 60, freq, zeta));

const KIT = (() => {
  const m4 = {
    ident: () => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
    mul(a, b) { const o = new Float32Array(16);
      for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
      return o; },
    T: (x, y, z) => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]),
    S: (x, y = x, z = x) => new Float32Array([x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1]),
    RX(a) { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); },
    RY(a) { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]); },
    RZ(a) { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); },
    chain(...ms) { return ms.reduce((a, b) => m4.mul(a, b)); },
    persp(fovy, asp, n, f) { const t = 1 / Math.tan(fovy / 2);
      return new Float32Array([t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]); },
    look(e, c, up = [0, 1, 0]) {
      let z = [e[0] - c[0], e[1] - c[1], e[2] - c[2]]; const zl = Math.hypot(...z); z = z.map(v => v / zl);
      let x = [up[1] * z[2] - up[2] * z[1], up[2] * z[0] - up[0] * z[2], up[0] * z[1] - up[1] * z[0]]; const xl = Math.hypot(...x); x = x.map(v => v / xl);
      const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
      return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
        -(x[0] * e[0] + x[1] * e[1] + x[2] * e[2]), -(y[0] * e[0] + y[1] * e[1] + y[2] * e[2]), -(z[0] * e[0] + z[1] * e[1] + z[2] * e[2]), 1]); },
    // 法线矩阵（上 3×3 的逆转置），压扁时法线才不会歪
    normal(m) { const a = m[0], b = m[1], c = m[2], d = m[4], e = m[5], f = m[6], g = m[8], h = m[9], i = m[10];
      const A = e * i - f * h, B = f * g - d * i, C = d * h - e * g, det = a * A + b * B + c * C || 1e-9;
      return [A / det, B / det, C / det, (c * h - b * i) / det, (a * i - c * g) / det, (b * g - a * h) / det, (b * f - c * e) / det, (c * d - a * f) / det, (a * e - b * d) / det]; },
  };

  // 欠阻尼弹簧的冲激响应，按帧采样、归一到和为 1：毛尖位置 = Σ h[k] · 身体在 k 帧前的位置
  function springKernel(freq = 3.0, zeta = 0.3, fps = 60, len = 48) {
    const w = 2 * Math.PI * freq, wd = w * Math.sqrt(1 - zeta * zeta), h = new Float32Array(len);
    let s = 0;
    for (let k = 0; k < len; k++) { const t = (k + 0.5) / fps; h[k] = Math.exp(-zeta * w * t) * Math.sin(wd * t); s += h[k]; }
    for (let k = 0; k < len; k++) h[k] /= s;
    return h;
  }

  const srgb = hex => { const n = parseInt(hex.slice(1), 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => Math.pow(v / 255, 2.2)); };
  return { m4, springKernel, srgb };
})();
const M = KIT.m4, ID = M.ident();
// 绕着 p 这一点做变换 m
const about = (p, m) => M.chain(M.T(p[0], p[1], p[2]), m, M.T(-p[0], -p[1], -p[2]));
// 压扁（体积不变）：以 pivot 为“脚底”，高 ×sy，宽 ×1/√sy
const sq = (pivot, sy) => about(pivot, M.S(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy)));
// 一个零件“啵”地弹出来：从 pivot 那一点长到原大（过冲），顺便从上面掉下来一点
const popIn = (f, f0, pivot, drop = 0) => { const p = pop(f, f0, 3.4, 0.36); return M.chain(M.T(0, drop * (1 - Math.min(1, prog(f, f0, f0 + 7)) ** 2), 0), about(pivot, M.S(Math.max(0.002, p)))); };
// 弹簧滤波：poses(f) → { P: [每个零件的 4×4 姿态…] } 必须是帧号的纯函数。
// 返回 now（这一帧）和 filtered[j][零件]（过去 kernels[j].length 帧的姿态 ⊗ 第 j 个弹簧的冲激响应）。
// 附属物的根用 now，尖往 filtered 那边弯，就有了跟随、过冲和回抖。
function springPoses(poses, f, kernels) {
  const now = poses(f), out = kernels.map(() => now.P.map(() => new Float32Array(16))), len = kernels[0].length;
  for (let k = 0; k < len; k++) { const p = k === 0 ? now.P : poses(f - k - 0.5).P;
    for (let s = 0; s < p.length; s++) { const m = p[s]; for (let j = 0; j < kernels.length; j++) { const o = out[j][s], w = kernels[j][k]; for (let i = 0; i < 16; i++) o[i] += m[i] * w; } } }
  return { now, filtered: out };
}
