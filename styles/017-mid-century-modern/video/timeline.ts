/**
 * 017 · 中世纪现代 —— 时间轴（帧，60fps）。120 BPM，1 拍 = 30 帧，全片不变速。
 * 先做开场 0—450（7.5 秒），审过再往后排章节。
 */
export {BEAT} from '../tokens';
export const W = 1920;
export const H = 1080;
export const FPS = 60;
export const DURATION = 1200;

export const AT = {
  bass: 0, // 00 片头：白纸条按十六分音符扎进黑场（第 0 帧正扎下第三根）
  gather: 74, // 纸条一起提起来，旋进 12 根辐条；黑场缩成钟心
  clock: 120, // 落定（第 4 拍）
  balls: 126, // 11 颗球从画外抛进来，十六分音符一颗
  hand: 188, // 手把最后一颗红球送到 3 点
  place: 240, // 按下（第 8 拍）
  spin: 244, // 指针转两圈，第 10 拍停
  title: 282, // MID-CENTURY 一个个落下（三十二分音符），MODERN 八分音符
  big: 390, // O 最后落下（第 13 拍），镜头往下“咚”一下
  tease: 405, // 6 点的球掉下去 → 下一章
  end: 450,
};
