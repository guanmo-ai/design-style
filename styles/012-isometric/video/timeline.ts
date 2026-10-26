/** 012 · Isometric —— 时间轴（帧）。120 BPM，1 拍 = 30 帧；全片 24 秒 = 48 拍 = 1440 帧 */
export const AT = {
  open: 0, // 开场：扁平卡片锁上 30° 轴，弹出体积
  rules: 210, // 三条规则：锁轴角 / 等比例 / 无透视
  build: 510, // 一块块堆出产品小世界
  variants: 1020, // 经典 / 军事 / 产品 三种变体
  end: 1260, // 片尾
};

export const RULE = {
  axes: 210, // 01 锁轴角
  scale: 310, // 02 等比例
  persp: 410, // 03 无透视
};

export const DURATION = 1440;

export const CHAPTERS: [string, string, number][] = [
  ['开场', 'HOOK', AT.open],
  ['锁轴', 'AXES', AT.rules],
  ['堆体积', 'STACK', AT.build],
  ['变体', 'VARIANTS', AT.variants],
];
