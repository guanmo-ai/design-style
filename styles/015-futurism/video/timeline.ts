/**
 * 015 · 未来主义 —— 时间轴（帧）。144 BPM，1 拍 = 25 帧；全片不变速，20 秒 = 48 拍 = 12 小节。
 * 开场 4 拍；01 巴拉 6 拍；其余每章 4 拍（100 帧 = 1.67 秒）；规则 10 拍；片尾 4 拍。最后一帧接回第 0 帧。
 */
import {BEAT} from '../tokens';

export {BEAT};
export const AT = {
  open: 0, // 开场：夜路，赛车撕开横幅，字母贴到镜头前（f25 遮幅打开）→ 赛车冲向镜头，车身盖满画面
  dog: 100, // 01 绘画 · 巴拉（路灯下）
  sculpt: 250, // 02 雕塑 · 波丘尼（美术馆的聚光灯）
  words: 350, // 03 文学 · 马里内蒂
  city: 450, // 04 建筑 · 圣伊利亚
  train: 550, // 05 机器 · 塞维里尼
  sky: 650, // 06 天空 · 克拉利
  today: 750, // 07 今天 · App / 网页
  rules: 850, // 五条规则（每张 50 帧）
  end: 1100, // 片尾：一句话 → 夜路，赛车从远处冲过来 = 第 0 帧
};
export const DURATION = 1200;
/** 03—06 四章沿用第一版的剧本（写在 300—750 的绝对帧上），整体往后挪 50 帧 */
export const SHIFT = 50;

export type Credit = {n: string; field: string; who: string; work: string; year: string; trick: string; at: number; to: number; dark?: boolean};
export const CREDITS: Credit[] = [
  {n: '00', field: '宣言', who: '马里内蒂', work: '未来主义宣言', year: '1909', trick: '“一辆吼叫的汽车，比胜利女神更美”', at: 30, to: 84, dark: true},
  {n: '01', field: '绘画', who: '巴拉', work: '拴着皮带的狗的动态', year: '1912', trick: '摆得最快的腿，残影最多', at: AT.dog + 18, to: AT.sculpt - 10, dark: true},
  {n: '02', field: '雕塑', who: '波丘尼', work: '空间中连续性的独特形式', year: '1913', trick: '残影凝固，就是形体', at: AT.sculpt + 14, to: AT.words - 10, dark: true},
  {n: '03', field: '文学', who: '马里内蒂', work: 'Zang Tumb Tuuum', year: '1914', trick: '越响越大 · 每级 ÷ 1.5', at: AT.words + 12, to: AT.city - 6},
  {n: '04', field: '建筑', who: '圣伊利亚', work: '新城市', year: '1914', trick: '电梯：起步拉开，到站收拢', at: AT.city + 8, to: AT.train - 8},
  {n: '05', field: '机器', who: '塞维里尼', work: '郊区火车抵达巴黎', year: '1915', trick: '刹车：残影收回车身', at: AT.train + 8, to: AT.sky - 6, dark: true},
  {n: '06', field: '天空', who: '克拉利', work: '俯冲进城市', year: '1939', trick: '冲向镜头：残影越近越大', at: AT.sky + 10, to: AT.today - 6, dark: true},
  {n: '07', field: '今天', who: 'App', work: '网页', year: '2026', trick: '字宽 = 速度 · 残影 = text-shadow', at: AT.today + 10, to: AT.rules - 4},
];
