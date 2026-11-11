// scenes.js — __TITLE__ 的“导演”：每个零件每一帧在哪（poses）、这一帧的镜头 / 光 / 颜色 / 要画的东西（stateAt）。
// 每一帧都是帧号的纯函数，所以能并行渲、断了能接着渲。通用的部分在 ../../_lib/kit/（见那里的 README.md）。
// 起步版只用了舞台自带的亮珠子当主角。换成你的渲染器：在 film.html 的 renderFrame 里，st.begin 和 st.end 之间画你的东西。
// 要毛 / 草 / 毛线这类“很多根细东西”：照 ../../plush/film/scenes.js 用 ../../_lib/fur/fur.js。

const BG = { blue: ['#2f58ff', '#1b36c9'], green: ['#12a67c', '#0a7d5c'] };          // 每个颜色名 = [墙色, 地色]
const BGS = [[0, 'blue'], [TL.ch1 - 10, 'green']];                                    // 背景色接力：到这一帧开始往新颜色渐变
// 镜头关键帧：[帧, 眼睛, 看向, 视角]
const CAM = [[0, [0, 1.7, 5.6], [0, 1.5, 0], 0.55], [TL.hit + 34, [0, 1.5, 6.8], [0, 1.15, 0], 0.55], [TL.ch1, [0, 1.45, 6.0], [0, 1.1, 0], 0.55],   // 主角停着的时候镜头在慢慢推：画面不要有死区
  [TL.ch1 + 40, [0.6, 1.6, 6.0], [0, 1.1, 0], 0.55], [TL.final, [0, 1.2, 6.4], [0, 0.75, 0], 0.55], [TL.end, [0, 1.2, 6.0], [0, 0.75, 0], 0.55]];   // 片尾把主角抬到画面中间，给下面的署名让位
const SAT = ['#ff4f97', '#ffc02e', '#5c93ff', '#c9ff45', '#b08cff', '#ffffff'];        // 小珠子的颜色

// 主角的姿态：砸下来（第 0 帧之前也在落）→ 弹两下 → 第 swing 帧左右甩
function poses(f) {
  let x = 0, y = 0;
  if (f < TL.hit) y = 1.3 * (1 - f / TL.hit);
  else if (f < TL.hit + 60) { const t = (f - TL.hit) / 60; y = 0.7 * Math.abs(Math.sin(Math.PI * 2 * t)) * (1 - t) ** 2; }
  if (f >= TL.swing) { const t = f - TL.swing; x = 0.9 * Math.sin(6.28318 * t / 26) * (t < 78 ? 1 : 0); }
  return { P: [M.T(x, 0.7 + y, 0)] };
}
// 签名物理：附属物 = 主角过去 60 帧的位置 ⊗ 弹簧的冲激响应（软 / 硬两根）。改频率和阻尼就是改材料。
const SOFT = KIT.springKernel(2.0, 0.22, 60, 60), STIFF = KIT.springKernel(3.6, 0.3, 60, 60);

// 这一帧交给渲染器的全部参数
function stateAt(f) {
  const { now, filtered: [soft, stiff] } = springPoses(poses, f, [SOFT, STIFF]);
  const s = { t: f / 60, f, ...camAt(CAM, f), bg: colorAt(BGS, BG, f), occ: [], beads: [] };
  const c = xf(now.P[0], [0, 0, 0]), cs = xf(soft[0], [0, 0, 0]), ch = xf(stiff[0], [0, 0, 0]);
  const land = squash(f, TL.hit, 0.2, 4);                                              // 落地那一下压扁（珠子是圆的，这里只缩一下半径示意）
  s.beads.push([c[0], c[1], c[2], 0.7 * land, 0.9, 0.12, 0.3, 1]);                     // [x, y, z, 半径, r, g, b, 光泽]
  s.occ.push([c[0], c[1], c[2], 0.7]);                                                 // 挡光的球：地上的影子从这里来
  SAT.forEach((hex, i) => { const p = pop(f, TL.pops[i], 3.2, 0.4); if (p <= 0) return;
    const a = i / SAT.length * 6.28318 + f * 0.012, lag = i % 2 ? cs : ch, col = KIT.srgb(hex);
    s.beads.push([lag[0] + Math.cos(a) * 1.25 * p, lag[1] + 0.25 * Math.sin(a * 2), lag[2] + Math.sin(a) * 1.25 * p, 0.2 * p, ...col, 1]); });
  s.fade = 1 - prog(f, TL.end - 14, TL.end - 1) ** 2;                                  // 第 0 帧就是封面，不淡入；片尾淡出
  return s;
}
