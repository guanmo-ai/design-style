// kit/director.js — “导演”的基本件（任何风格都能用，依赖 motion.js）：镜头关键帧、颜色接力、形状之间的转场、3D ↔ 屏幕。
// 全部是帧号的纯函数。

// 镜头：keys = [[帧, 眼睛, 看向, 视角], …]。两帧之间“看向”线性走，眼睛到目标的距离按等比走（推拉的速度才均匀，不会最后几帧突然冲脸）。
function camAt(keys, f) {
  let i = 0; while (i + 2 < keys.length && f >= keys[i + 1][0]) i++;
  const a = keys[i], b = keys[i + 1], t = ease.inOut3(prog(f, a[0], b[0]));
  const at = lerp3(a[2], b[2], t), da = [0, 1, 2].map(k => a[1][k] - a[2][k]), db = [0, 1, 2].map(k => b[1][k] - b[2][k]);
  const la = Math.hypot(...da), lb = Math.hypot(...db), dir = lerp3(da.map(v => v / la), db.map(v => v / lb), t), dl = Math.hypot(...dir), dist = la * Math.pow(lb / la, t);
  return { eye: [0, 1, 2].map(k => at[k] + dir[k] / dl * dist), at, fov: lerp(a[3], b[3], t) };
}
// 两个 #rrggbb 在线性光里混（直接混十六进制会发灰）
const hexMix = (a, b, t) => { const A = KIT.srgb(a), B = KIT.srgb(b); return '#' + [0, 1, 2].map(k => Math.round(255 * Math.pow(lerp(A[k], B[k], t), 1 / 2.2)).toString(16).padStart(2, '0')).join(''); };
// 两组参数混：颜色按 hexMix，数字按 lerp（色板、材质、任何一袋参数）
const mixObj = (a, b, t) => Object.fromEntries(Object.keys(b).map(k => [k, typeof b[k] === 'string' ? hexMix(a[k], b[k], t) : lerp(a[k], b[k], t)]));
// 颜色接力：list = [[帧, 名字, 渐变帧数 = 26], …]，table[名字] = [颜色, 颜色, …]。到了那一帧开始往新颜色渐变。
function colorAt(list, table, f) {
  let i = 0; while (i + 1 < list.length && f >= list[i + 1][0]) i++;
  const cur = table[list[i][1]], prev = table[list[Math.max(0, i - 1)][1]], t = ease.inOut2(prog(f, list[i][0], list[i][0] + (list[i][2] ?? 26)));
  return cur.map((c, k) => hexMix(prev[k], c, t));
}
// 转场：list = [[起始帧, 结束帧, 从哪个形状, 到哪个形状, 弧高], …]。返回这一帧在第几次转场里（mi，-1 = 还没开始）和交给渲染器的参数：
// mix 0—1 是飞到哪了；settle 是落定以后过了多久（给“落定时蓬一下”用）。转场结束后一直停在 B（mix = 1）。
function morphAt(list, f, first, spread = 0.6) {
  let mi = -1; list.forEach((m, i) => { if (f >= m[0]) mi = i; });
  if (mi < 0) return { mi, set: { A: first } };
  const m = list[mi], D = m[1] - m[0];
  return { mi, set: { A: m[2], B: m[3], arc: m[4], spread, mix: prog(f, m[0], m[1]), settle: Math.max(0, f - m[1]) / D * 1.6 } };
}
// 现在在第几章：chapters = [[起始帧, …], …]
const chapterAt = (chapters, f) => { let ci = 0; chapters.forEach((c, i) => { if (f >= c[0]) ci = i; }); return ci; };
// 4×4 矩阵乘一个点
const xf = (m, p) => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
// 3D 点 → 屏幕像素（VP 是渲染器返回的那个）：给标注线、手指、跟着物体走的字用
const proj = (VP, p, W = 1920, H = 1080) => { const w = VP[3] * p[0] + VP[7] * p[1] + VP[11] * p[2] + VP[15];
  return [((VP[0] * p[0] + VP[4] * p[1] + VP[8] * p[2] + VP[12]) / w * 0.5 + 0.5) * W, (0.5 - (VP[1] * p[0] + VP[5] * p[1] + VP[9] * p[2] + VP[13]) / w * 0.5) * H]; };
// “正对一面墙”的镜头（界面、海报、平面内容）：base = { eye, at, fov }，墙在 z = 0。
// wallCam(base) 返回 { px(x, y) → 墙上的世界坐标, cam(cx, cy, k) → 以像素 (cx, cy) 为中心放大 k 倍的 [眼睛, 看向, 视角], css(cam) → 让 DOM 跟着这台镜头缩放的 transform }
function wallCam(base, W = 1920, H = 1080) {
  const d = base.eye[2], ppu = H / (2 * d * Math.tan(base.fov / 2));
  const px = (x, y) => [(x - W / 2) / ppu + base.at[0], base.at[1] + (H / 2 - y) / ppu];
  const cam = (cx, cy, k) => { const w = px(cx, cy); return [[w[0], w[1], d / k], [w[0], w[1], 0], base.fov]; };
  const css = c => { const k = d / c.eye[2], cxp = W / 2 + (c.at[0] - base.at[0]) * ppu, cyp = H / 2 - (c.at[1] - base.at[1]) * ppu;
    return `translate(${(W / 2 - k * cxp).toFixed(2)}px,${(H / 2 - k * cyp).toFixed(2)}px) scale(${k.toFixed(4)})`; };
  return { ppu, px, cam, css };
}
