/**
 * 017 · 中世纪现代 Mid-Century Modern —— 设计令牌（视频、图片、tokens.css / tokens.json 共用同一组数）
 * 一条物理规则：每一块都是一张纸。纸离桌面 h px，影子往右下偏 (0.5h, h)，模糊 0.4h；离镜头越近，纸越大一点。
 */
export const C = {
  paper: '#FBF3E3', // 暖白纸 40%
  ink: '#1E1B19', // 墨 4%（底和字另算）
  red: '#F2542D', // 番茄红 14%
  sun: '#FFC62E', // 向日葵黄 14%
  pink: '#F57AA8', // Girard 粉 12%
  turq: '#1FB3A6', // 绿松石 10%
  blue: '#2F6BD8', // 钴蓝 6%
  mute: '#8A7F72', // 说明文字
  shadow: '#3A1C0C', // 影子
} as const;

export const FONT = {
  sans: "'Jost', 'Noto Sans SC', sans-serif", // Futura 的开源替代
  sc: "'Noto Sans SC', sans-serif",
} as const;

/** 纸片物理 */
export const PAPER = {
  rest: 4, // 贴着桌面的高度
  dx: 0.5, // 影子偏移 = (0.5h, h)
  dy: 1,
  blur: 0.4, // 影子模糊 = 0.4h
  persp: 0.0032, // 离桌面 h，纸放大 1 + 0.0032h（离镜头更近）
  opacity: (h: number) => Math.max(0.16, 0.3 - h * 0.004),
} as const;

export const BEAT = 30; // 120 BPM @ 60fps
