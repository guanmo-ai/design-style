// 生成艺术小样的时间轴（帧，60fps，120 BPM：一拍 30 帧）。audio.py 读同一份数字。
const TL = {"A1": 90, "B": 90, "arrows": [96, 132], "dot": [128, 178], "C": 180, "zoom": [180, 204], "retract": [196, 206], "regrow": [210, 246],
  "D": 270, "clear": [270, 278], "waves": [[277, 316, 40, 999], [306, 352, 14, 39], [334, 386, 0, 13]],
  "E": 390, "rewind": [398, 420], "grow2": [420, 456], "title": 440, "end": 480};
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = {
  in2: t => t * t, in3: t => t * t * t, out2: t => 1 - (1 - t) * (1 - t), out3: t => 1 - Math.pow(1 - t, 3),
  inOut3: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outBack: (t, s = 1.7) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
};
