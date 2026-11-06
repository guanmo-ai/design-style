// 点云全片 · 第二版时间轴：帧，60fps，120 BPM（一拍 30 帧），1080 帧 = 18 秒。audio.py 读同一份数字。
// 照标杆的骨架：开场 4 拍 → 五章各 3 拍（每章一件真实代表作，按 16 分音符搭起来）→ 五条规则（一拍一张）→ 用在手机上 → 回到开场的一个点。
// 接力元素：从头到尾同一批点——一个点 → 标题 → 斯坦福兔子 → 街道 → 楼梯井 → 体素 → 颜料墙 → 盆景 → 山地 → 手机里的盆景 → 一个点 → 标题。
const TL = {
  "burst": 12, "assemble": [12, 84], "lock": 90,                 // 00 一个点炸开，拼成立体标题
  "wave": [92, 120],                                              // 标题锁定后，一道波从左往右推过字面
  "toBunny": [100, 134],                                          // 标题散成十块彩色的“扫描”，各自歪着、离开原位
  "snaps": [136, 141, 146, 151, 156, 161, 166, 171, 176, 181],    // 01 十次扫描一块块“咔”地对齐（配准）
  "dissolve": [186, 236],                                         // 被风吹散，落到街上
  "beam": [212, 292],                                             // 02 激光束转两圈
  "drain": [286, 330],                                            // 街道倒进楼梯井
  "sweep": [306, 372],                                            // 03 扫描面往下走
  "voxel": [364, 390],                                            // 体素降采样
  "toWall": [386, 420], "flow": [404, 480],                       // 04 体素变成颜料墙，颜料流起来
  "toBonsai": [462, 500], "splat": [500, 530], "focus": [526, 548], "cursor": [538, 566],   // 05 点长成面
  "toTerrain": [556, 578], "cards": [570, 600, 630, 660, 690],    // 06 五条规则
  "today": [720, 930], "mask": [720, 744], "pScan": [744, 790], "pBuild": [790, 826], "pDone": [826, 852],
  "tap1": 858, "tap2": 872, "measure": [872, 900], "place": [904, 930],                        // 07 手机
  "out": [930, 950], "implode": [944, 1004], "dot": [1004, 1020], "burst2": 1020, "relock": [1020, 1050], "final": 1050,
  "end": 1080,
  "chapters": [[0, "00", "点云", "每个点只有：位置 · 颜色 · 大小"],
    [120, "01", "斯坦福兔子", "Turk & Levoy · 1994 · 10 次扫描拼成一只兔子"],
    [210, "02", "自动驾驶的眼睛", "Velodyne HDL-64E · 2007 · 64 束激光转一圈"],
    [300, "03", "扫描一座建筑", "ScanLAB Projects · 伦敦 · 2010—"],
    [390, "04", "数据绘画", "Refik Anadol · 《Machine Hallucinations》· 2019"],
    [480, "05", "高斯泼溅", "Kerbl 等 · SIGGRAPH 2023 · 点长成面"],
    [570, "06", "五条规则", "拿去就能用"],
    [720, "07", "用在手机上", "扫描 · 聚拢 · 量尺寸 · 放进房间"],
    [930, "08", "", ""]]
};
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (f, a, b) => clamp((f - a) / (b - a));
const ease = {
  in2: t => t * t, in3: t => t * t * t, out2: t => 1 - (1 - t) * (1 - t), out3: t => 1 - Math.pow(1 - t, 3), out5: t => 1 - Math.pow(1 - t, 5),
  inOut3: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outBack: (t, s = 1.7) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
};
const logLerp = (a, b, t) => a * Math.pow(b / a, t);
// 欠阻尼弹簧：0 → 1（扫描“咔”地对齐时冲过头一点再回来）
const spring = (sec, freq = 2.2, zeta = 0.35) => {
  if (sec <= 0) return 0; const w = 2 * Math.PI * freq, wd = w * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * w * sec) * (Math.cos(wd * sec) + zeta * w / wd * Math.sin(wd * sec));
};
