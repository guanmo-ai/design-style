/**
 * 017 · 中世纪现代 —— 时间轴（帧，60fps）。144 BPM，1 拍 = 25 帧，全片不变速。
 * 结构照 003 / 004：开场先把海报搭出来（1.6 秒），然后每章一件代表作、一张新的彩纸当底（约 1.5 秒一章）。
 */
export const W = 1920;
export const H = 1080;
export const FPS = 60;
export const BEAT = 25;
export const DURATION = 1200;

export const AT = {
  poster: 0, // 开场：太阳落下、辐条从钟心炸开、12 颗球 2.5 帧一颗落满、字从镜头上方砸下来
  big: 75, // MODERN 的 O 最后砸下（第 3 拍），镜头沉一下
  lift: 90, // 辐条从钟上弹起来
  sheet1: 96, // 蓝纸从右边滑进来盖住桌面（18 帧）
  bass: 114, // 01 片头 · Bass：辐条在空中翻面（墨 → 白），落成折线手臂（第 5 拍）
  sheet2: 178, // 绿松石纸滑进来 → 02
  end: 210,
};
