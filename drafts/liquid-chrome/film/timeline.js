// 液态金属全片的时间轴：帧，60fps，120 BPM（一拍 30 帧），1080 帧 = 18 秒。audio.py 读同一份数字。
// 签名物理：表面张力——两滴一碰先长“颈”再合成一滴、合完了晃几下、拉长了就断成一串珠子。
// 接力元素：同一滩水银。字从里面站起来、化成四颗珠、合成一颗、拉成柱、断成珠、倒进手机，最后又落回水银里。
const TL = {
  "dropHit": 24,                 // 00 第一滴落地（前 0.5 秒的重击）
  "rise": [30, 96],              // 字从水银里站起来，带着拉丝；96 拍点停稳
  "hang": [96, 150],             // 挂着的液丝一颗颗掉下去
  "morph": [150, 192],           // 01 字从左到右化成四颗珠
  "merge1": [186, 222], "snap1": 210,   // 两两靠近 → 210 拍点“啪”地合上
  "merge2": [240, 276], "snap2": 270,   // 两颗再合成一颗
  "env": [330, 480], "hues": [420, 450],  // 02 形状不动，世界在转；420 / 450 换两次“世界”
  "stretch": [480, 548],         // 03 拉成一根柱子
  "pinch": [540, 572], "brk": 570,       // 瑞利–普拉托：颈越来越细，570 拍点断成五颗
  "gather": [600, 672],          // 04 五颗收成一颗，同时画面“倒”进手机
  "mask": [630, 676],
  "idle": [676, 736], "tapMic": 722,
  "listen": [736, 812], "words": [744, 800],
  "answer": [812, 870], "emit": [818, 834, 850], "land": [836, 852, 868],
  "tapChip": 876, "back": [878, 896], "toast": 892,
  "out": [900, 944],             // 05 手机退开，珠子落回水银
  "drop2": [944, 962],           // 再落一滴（呼应开场）
  "rise2": [966, 1004], "card": [1000, 1080], "final": 1050,
  "end": 1080,
  "chapters": [[0, "00", "从水银里站起来", "液态金属 · Liquid Chrome"], [150, "01", "融合", "两滴一碰，先长出一道颈"], [330, "02", "倒影", "形状不动，世界在转"],
    [480, "03", "断开", "柱子越拉越细，断成一串珠"], [630, "04", "用在界面", "一滴会听话的金属"], [900, "05", "落回去", ""]]
};
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (f, a, b) => clamp((f - a) / (b - a));
const ease = {
  in2: t => t * t, in3: t => t * t * t, in4: t => t * t * t * t, out2: t => 1 - (1 - t) * (1 - t), out3: t => 1 - Math.pow(1 - t, 3),
  inOut3: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outBack: (t, s = 1.7) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
};
// 欠阻尼弹簧：0 → 1，freq 次/秒，zeta 阻尼比（越小晃得越久）
const spring = (sec, freq = 2.2, zeta = 0.35) => {
  if (sec <= 0) return 0; const w = 2 * Math.PI * freq, wd = w * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * w * sec) * (Math.cos(wd * sec) + zeta * w / wd * Math.sin(wd * sec));
};
// 衰减振荡（合上以后的“晃”）：返回 −A..A
const wobble = (sec, A = 0.2, freq = 3.2, tau = 0.22) => sec <= 0 ? 0 : A * Math.exp(-sec / tau) * Math.cos(2 * Math.PI * freq * sec);
