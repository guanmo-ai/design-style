/**
 * 014 · 液态玻璃 —— 动作的基本件
 *
 * 全片的动作都由这几样拼出来，保证每个大动作都有：
 *   起势（antic：先往反方向蓄一下）· 过冲约 5% 的落地（land）· 液体落地后的抖动（wobble，抖形状不抖位置）·
 *   抛物线（ballistic）· 带滞后的跟随（follow，附属的东西晚几帧跟上）
 * 全部是时间 t（帧，可以是小数）的纯函数：Remotion 可以乱序、多进程渲染，运动模糊也要取子帧。
 */

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const prog = (t: number, a: number, d: number) => clamp((t - a) / d);

// ───────── 缓动 ─────────
export const ease = {
  out: (u: number) => 1 - Math.pow(1 - u, 3),
  out5: (u: number) => 1 - Math.pow(1 - u, 5),
  in: (u: number) => u * u * u,
  in2: (u: number) => u * u,
  inOut: (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
  inOut5: (u: number) => (u < 0.5 ? 16 * Math.pow(u, 5) : 1 - Math.pow(-2 * u + 2, 5) / 2),
  sine: (u: number) => 0.5 - 0.5 * Math.cos(Math.PI * u),
};
export const tw = (t: number, a: number, d: number, e: (u: number) => number = ease.inOut) => e(prog(t, a, d));

/**
 * 落地弹簧：从 0 到 1，过冲约 5%（阻尼比 ≈ 0.69），dur 帧内走完
 * 解析解，不用逐帧积分
 */
export const land = (t: number, a: number, dur = 24, zeta = 0.69) => {
  const u = (t - a) / dur;
  if (u <= 0) return 0;
  if (u >= 1.6) return 1;
  const w = 7.2; // 让 u = 1 时基本落定
  const wd = w * Math.sqrt(1 - zeta * zeta);
  const e = Math.exp(-zeta * w * u);
  return 1 - e * (Math.cos(wd * u) + ((zeta * w) / wd) * Math.sin(wd * u));
};

/**
 * 起势 + 落地：先往反方向退 antic（比例）用 pre 帧，再用弹簧冲到 1
 */
export const anticLand = (t: number, a: number, pre = 8, dur = 26, antic = 0.08) => {
  if (t < a) return 0;
  if (t < a + pre) return -antic * ease.sine(prog(t, a, pre));
  return -antic + (1 + antic) * land(t, a + pre, dur);
};

/** 液体的抖动：衰减的正弦（抖形状用），start 之前为 0 */
export const wobble = (t: number, start: number, amp: number, period = 16, decay = 18, phase = 0) => {
  if (t < start) return 0;
  const x = t - start;
  return amp * Math.exp(-x / decay) * Math.sin((2 * Math.PI * x) / period + phase);
};

/** 抛物线：起点 p0、初速 v（px/帧）、重力 g（px/帧²） */
export const ballistic = (t: number, t0: number, p0: number, v: number, g: number) => {
  const x = Math.max(0, t - t0);
  return p0 + v * x + 0.5 * g * x * x;
};

/** 三次 Hermite：两端指定速度（每帧位移），用来让镜头的停与走没有顿挫 */
export const hermite = (p0: number, p1: number, v0: number, v1: number, u: number, dur: number) => {
  const u2 = u * u;
  const u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * v0 * dur + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * v1 * dur;
};

/**
 * 带滞后的跟随：对目标轨迹 target(t) 做一阶低通（时间常数 tau 帧），解析地对过去 6·tau 帧做指数加权平均。
 * 镜头跟拍、附属元素晚几帧跟上都用它。
 */
export const follow = (target: (t: number) => number, t: number, tau = 8, step = 1) => {
  let s = 0;
  let w = 0;
  const n = Math.ceil((6 * tau) / step);
  for (let i = 0; i <= n; i++) {
    const k = Math.exp(-(i * step) / tau);
    s += target(t - i * step) * k;
    w += k;
  }
  return s / w;
};

/** 关键帧轨道：[帧, 值, 缓动]，在相邻关键帧之间插值；第一个之前、最后一个之后保持 */
export type Key = [number, number, ((u: number) => number)?];
export const track = (t: number, keys: Key[]) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [f1, v1, e] = keys[i];
    const [f0, v0] = keys[i - 1];
    if (t <= f1) return lerp(v0, v1, (e ?? ease.inOut)((t - f0) / Math.max(1e-6, f1 - f0)));
  }
  return keys[keys.length - 1][1];
};

/** 单向的“咚”：往下沉一下再回来，不来回颤 */
export const thump = (t: number, at: number, amp: number, dur = 14) => {
  const u = (t - at) / dur;
  return u > 0 && u < 1 ? amp * Math.sin(Math.PI * u) * (1 - u) : 0;
};
