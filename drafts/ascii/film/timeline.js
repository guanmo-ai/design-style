// 字符画小样的时间轴（帧，60fps，120 BPM：一拍 30 帧）。audio.py 读同一份数字，画面和声音不会对不上。
const TL = {"A1": 54, "B": 60, "C": 150, "steps": [[150, 30], [180, 21], [210, 14], [225, 10], [233, 8]],
  "D": 240, "dive0": 258, "dive1": 322, "E": 330, "end": 480, "diveFs": 8, "sEnd": 6000};
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = {
  in2: t => t * t, in3: t => t * t * t, out3: t => 1 - Math.pow(1 - t, 3),
  inOut3: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outBack: (t, s = 1.7) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
};
