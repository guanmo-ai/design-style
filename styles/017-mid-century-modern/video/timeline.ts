/**
 * 017 · 中世纪现代 —— 时间轴（帧，60fps）。120 BPM，1 拍 = 30 帧，全片不变速。
 * 先做开场 0—330（5.5 秒），审过再往后排章节。
 */
export {BEAT} from '../tokens';
export const W = 1920;
export const H = 1080;
export const FPS = 60;
export const DURATION = 1200;

export const AT = {
  bass: 0, // 00 片头：彩色纸条按十六分音符扎进红场（第 0 帧已落 5 根，正扎下第 6 根）
  gather: 50, // 纸条一起提起来，旋进 12 根辐条；红场缩成钟心
  clock: 90, // 落定（第 3 拍）
  balls: 96, // 11 颗球从画外抛进来，5 帧一颗
  hand: 118, // 手把最后一颗红球送到 3 点
  place: 150, // 按下（第 5 拍）
  spin: 154, // 指针转两圈
  title: 172, // MID-CENTURY 一个个落下（三十二分音符），MODERN 十六分音符
  big: 270, // O 最后落下（第 9 拍），镜头往下“咚”一下
  tease: 285, // 6 点的球掉下去 → 下一章
  end: 330,
};
