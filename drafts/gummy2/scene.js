// 场景：魔幻时刻的逆光（《天国之日》），长焦低机位；第 0 帧 = 主角熊刚落地、被压扁的那一刻
window.GUMMY_COLORS = {
  ruby:    { sigA: [0.95, 5.0, 6.0],  sigS: 0.07 },   // 草莓红
  emerald: { sigA: [4.5, 0.9, 3.4],  sigS: 0.07 },   // 青苹果绿
  amber:   { sigA: [0.2, 1.1, 3.4], sigS: 0.08 },   // 橙
  lemon:   { sigA: [0.15, 0.4, 3.0], sigS: 0.08 },    // 柠檬
  rasp:    { sigA: [0.9, 5.0, 1.6],  sigS: 0.07 },    // 树莓粉
  grape:   { sigA: [1.2, 2.6, 0.5],   sigS: 0.4 },    // 葡萄紫
};
window.coverScene = function (u = 0.5) {   // u = 快门里的时刻（0—1），做运动模糊
  const sh = u - 0.5;
  const C = window.GUMMY_COLORS;
  const ob = (type, color, o) => Object.assign({ type, sigA: C[color].sigA, sigS: C[color].sigS }, o);
  return {
    cam: { pos: [0.0, 1.6, 4.5], tgt: [0.05, 0.98, 0], fov: 33, focus: 4.55 },
    sun: { dir: [0.11, 0.07, -1.0], col: [22, 12, 5.0] },
    sky: { hor: [0.34, 0.12, 0.045], zen: [0.018, 0.045, 0.11], back: [0.012, 0.03, 0.07] },
    field: { near: -3.0, cell: 1.25 },
    floor: { col: [0.06, 0.056, 0.06], gloss: 0.6 },
    objs: [
      ob('bear', 'ruby', { pos: [-0.25, 0, 0], scale: 1.12, squash: 0.80, lagZ: 0.22, lagX: -0.08, yaw: 0.25 }),
      ob('bear', 'emerald', { pos: [1.75 - 0.10*sh, 1.45 - 0.22*sh, -1.9], scale: 0.5, squash: 1.06, yaw: -0.6, pitch: 0.5, roll: -0.9 + 0.35*sh }),
      ob('ring', 'rasp', { pos: [1.9, 0, -2.2], scale: 0.8, round: 0.24, yaw: 0.3 }),
      ob('drop', 'amber', { pos: [-1.9, 0, 1.6], scale: 0.55 }),
    ],
    post: { aper: 40, maxR: 36, thr: 3.0, exposure: 1.0, bloom: 0.12, streak: 0.0, grain: 0.03, vign: 0.35, ca: 0.012, sat: 1.08,
            shadowTint: [0.93, 0.97, 1.07], highTint: [1.04, 1.0, 0.95] },
  };
};
