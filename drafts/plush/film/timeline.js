// 毛绒全片 · 时间轴：帧，60fps，120 BPM（一拍 30 帧），1200 帧 = 20 秒。audio.py 读同一份数字。
// 骨架：开场 4 拍 → 一根毛 × 409,600（3.5 拍）→ 三件真实代表作（各 3—3.5 拍）→ 五条规则（一张 1.5 拍）→ 用在手机上（9 拍）→ 片尾。
// 签名物理：每根毛是一根弹簧——身体停了，毛尖晚 5 帧到、冲过头、再抖回来。接力元素：从头到尾同一批 409,600 根毛。
const TL = {
  "hit": 8, "hop": [16, 40], "land": 40, "antic": [46, 52], "burst": [52, 92], "glyphs": [62, 72],          // 00 毛球砸下来 → 炸开拼成「毛绒」
  "one": 120, "bald": [120, 134], "oneGrow": 150, "counts": [165, 172.5, 180, 187.5, 195, 202.5], "shake": 208,   // 01 一根毛 → ×409,600
  "cup": 225, "cupMorph": [217, 252], "cupPops": [229, 236.5, 244], "cupSpin": 285,                           // 02 皮毛早餐
  "bear": 330, "bearMorph": [322, 348], "bearPops": [334, 341.5, 349, 353, 356.5, 360.5, 364, 368, 371.5], "eyes": 379, "nod": 398,   // 03 泰迪熊
  "hat": 435, "hatMorph": [427, 460], "hatToss": 472,                                                          // 04 毛毛渔夫帽
  "rules": [525, 570, 615, 660, 705], "ruleOn": 16,                                                            // 05 五条规则（每张第 16 帧“打开”）
  "ui": 750, "uiMorph": [744, 792], "phone": [750, 772], "tapHeart": 825, "toggle": 900, "load": [960, 1020], "dots": [960, 967.5, 975, 990, 997.5, 1005],   // 06 用在界面
  "out": 1020, "outMorph": [1014, 1050], "drop2": 1065, "burst2": [1080, 1116], "glyphs2": [1090, 1100], "final": 1140, "sign": 1150,   // 07 片尾
  "end": 1200,
  "chapters": [[0, "00", "毛绒", "PLUSH · 一摸就想捏的设计风格"],
    [120, "01", "一根毛 × 409,600", "根深、尖浅、越到尖越细"],
    [225, "02", "《物体》皮毛早餐", "梅拉·奥本海姆 · 1936 · 超现实主义"],
    [330, "03", "泰迪熊", "Steiff · 1902 · 马海毛"],
    [435, "04", "毛毛渔夫帽", "Kangol Furgora · 1980s → 今天的街头"],
    [525, "05", "五条规则", "拿去就能用"],
    [750, "06", "用在界面", "按钮会被捏扁，毛晚半拍"],
    [1020, "07", "", ""]]
};
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
