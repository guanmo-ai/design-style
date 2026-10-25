/** 011 · Claymorphism —— 时间轴（帧）。120 BPM，1 拍 = 30 帧；24.0s = 48 拍 = 1440 帧 */
export const AT = {
  open: 0, // 0.0–4.0s  捏：面团落下 → 第一拍掐成按钮
  corners: 240, // 4.0–8.0s  圆角：直角胀成胖圆角，尖卡被捏走
  shadows: 480, // 8.0–12.0s 双阴影：光绕一圈，内外影成对呼吸
  pastel: 720, // 12.0–16.0s 软色 + 挤捏：四色入场，按钮按下去
  product: 960, // 16.0–20.0s 产品：同一颗按钮落进 PINCH 焦点应用
  end: 1200, // 20.0–24.0s 片尾：粘土信息幕
} as const;

export const DURATION = 1440;

export const CHAPTERS: [string, string, number][] = [
  ['圆角', 'CORNERS', AT.corners],
  ['阴影', 'SHADOWS', AT.shadows],
  ['软色', 'PASTEL', AT.pastel],
  ['产品', 'PRODUCT', AT.product],
];
