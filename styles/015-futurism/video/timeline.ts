/**
 * 015 · 未来主义 —— 时间轴（帧）。144 BPM，1 拍 = 25 帧；全片不变速，20 秒 = 48 拍 = 12 小节。
 * 每章 4 拍（100 帧 = 1.67 秒）；今天 6 拍；规则 10 拍；片尾 4 拍。最后一帧接回第 0 帧。
 */
import {BEAT} from '../tokens';

export {BEAT};
export const AT = {
  open: 0, // 开场：FUTURISM 刹车进场（f25 停）→ 起步冲走，只剩 I
  dog: 100, // 01 绘画 · 巴拉
  sculpt: 200, // 02 雕塑 · 波丘尼
  words: 300, // 03 文学 · 马里内蒂
  city: 400, // 04 建筑 · 圣伊利亚
  train: 500, // 05 机器 · 塞维里尼
  sky: 600, // 06 天空 · 克拉利
  today: 700, // 07 今天 · App / 网页
  rules: 850, // 五条规则（每张 50 帧）
  end: 1100, // 片尾：一句话 → FUTURISM 再冲进来 = 第 0 帧
};
export const DURATION = 1200;

export type Credit = {n: string; field: string; who: string; work: string; year: string; trick: string; at: number; to: number; dark?: boolean};
export const CREDITS: Credit[] = [
  {n: '01', field: '绘画', who: '巴拉', work: '拴着皮带的狗的动态', year: '1912', trick: '摆得最快的腿，残影最多', at: AT.dog + 8, to: AT.sculpt - 6},
  {n: '02', field: '雕塑', who: '波丘尼', work: '空间中连续性的独特形式', year: '1913', trick: '残影凝固，就是形体', at: AT.sculpt + 10, to: AT.words - 8},
  {n: '03', field: '文学', who: '马里内蒂', work: 'Zang Tumb Tuuum', year: '1914', trick: '越响越大 · 每级 ÷ 1.5', at: AT.words + 12, to: AT.city - 6},
  {n: '04', field: '建筑', who: '圣伊利亚', work: '新城市', year: '1914', trick: '电梯：起步拉开，到站收拢', at: AT.city + 8, to: AT.train - 8},
  {n: '05', field: '机器', who: '塞维里尼', work: '郊区火车抵达巴黎', year: '1915', trick: '刹车：残影收回车身', at: AT.train + 8, to: AT.sky - 6, dark: true},
  {n: '06', field: '天空', who: '克拉利', work: '俯冲进城市', year: '1939', trick: '冲向镜头：残影越近越大', at: AT.sky + 10, to: AT.today - 6, dark: true},
  {n: '07', field: '今天', who: 'App', work: '网页', year: '2026', trick: '字宽 = 速度 · 残影 = text-shadow', at: AT.today + 14, to: AT.rules - 6},
];
