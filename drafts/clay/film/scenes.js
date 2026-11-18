// 黏土 · 每一帧的场景（帧号的纯函数）。stateAt(f) → { scene（交给 CLAY.render）, hud（画面上的字要用的点和状态） }
// 一团泥接力到底：字 → 泥卷（同一个距离场 lMix 混过去）→ 切成片 → 片在俯视里变成按钮 → 拼回泥卷 → 立回字。
const HEX = h => CLAY.hex(h);
// 四套泥（每套 4 色，螺旋 / 大理石纹按这 4 色一圈圈排）
const SETS = [
  ['#FF5A3C', '#FFB199', '#FFF2E2', '#C2362B'],   // 0 珊瑚
  ['#1FAF8B', '#9BE3C8', '#F3FBF5', '#0E6B57'],   // 1 薄荷
  ['#7357FF', '#BBA8FF', '#F1ECFF', '#FF7EB6'],   // 2 葡萄
  ['#F4B940', '#FBE3A6', '#D9663E', '#FFF6E8'],   // 3 蜂蜜
];
const MARBLE = SETS.map(s => s.map(HEX));
// 背景：同色系的“高级灰”，一章一个，颜色接力；最后一章是黑场 + 一池光
const BGS = [
  [0, { floor: '#D9CFC3', top: '#E7DFD5' }],
  [60, { floor: '#D9CFC3', top: '#E7DFD5' }],
  [118, { floor: '#C2CFC1', top: '#D2DDD1' }],
  [340, { floor: '#C2CFC1', top: '#D2DDD1' }],
  [395, { floor: '#CCC7DB', top: '#D9D5E6' }],
  [520, { floor: '#CCC7DB', top: '#D9D5E6' }],
  [590, { floor: '#232126', top: '#302C33' }],
];
const sm = t => t * t * (3 - 2 * t);
function keyed(keys, f, mixf) {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i + 1 < keys.length; i++) { const [a, va] = keys[i], [b, vb] = keys[i + 1]; if (f < b) return mixf(va, vb, sm((f - a) / (b - a))); }
  return keys[keys.length - 1][1];
}
const mixRGB = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
function bgAt(f) {
  const k = BGS.map(([fr, v]) => [fr, { floor: HEX(v.floor), top: HEX(v.top) }]);
  return keyed(k, f, (a, b, t) => ({ floor: mixRGB(a.floor, b.floor, t), top: mixRGB(a.top, b.top, t) }));
}
// 镜头：关键帧之间用三次 Hermite（切线 = 前后两帧的差 / 时间差），速度连续，不会一站一站地停
const CAM = [
  [0, [0.4, 2.3, 13.2], [0.4, 1.75, 0], 30],
  [60, [0.2, 2.5, 11.4], [0.2, 1.45, 0], 30],
  [112, [2.6, 3.8, 10.4], [0.7, 0.8, 0.5], 32],
  [200, [7.4, 2.7, 7.2], [2.3, 0.7, 1.4], 30],
  [245, [8.7, 1.85, 4.8], [3.5, 0.6, 1.6], 30],
  [335, [9.9, 2.1, 3.6], [5.3, 0.45, 1.6], 31],
  [400, [7.75, 13.0, 0.0], [7.7, 0, 0.0], 40, 1],
  [495, [7.75, 12.2, 0.0], [7.7, 0, 0.0], 39, 1],
  [550, [5.5, 4.6, 10.4], [1.4, 0.9, 0.5], 31],
  [598, [0.4, 2.35, 12.6], [0.4, 1.7, 0], 30],
  [660, [-0.4, 2.6, 12.0], [0.3, 1.7, 0], 30],
  [720, [-1.3, 2.9, 11.3], [0.2, 1.68, 0], 30],
];
function hermite(keys, f, pick) {
  const n = keys.length; if (f <= keys[0][0]) return pick(keys[0]); if (f >= keys[n - 1][0]) return pick(keys[n - 1]);
  let i = 0; while (f >= keys[i + 1][0]) i++;
  const k0 = keys[Math.max(0, i - 1)], k1 = keys[i], k2 = keys[i + 1], k3 = keys[Math.min(n - 1, i + 2)];
  const p1 = pick(k1), p2 = pick(k2), dt = k2[0] - k1[0], t = (f - k1[0]) / dt;
  const tan = (a, b, c, ta, tc) => a === c ? b.map(() => 0) : b.map((_, j) => (pick(c)[j] - pick(a)[j]) / (tc - ta));
  const m1 = (i === 0 || k1[4]) ? p1.map(() => 0) : tan(k0, p1, k2, k0[0], k2[0]), m2 = (i + 2 >= n || k2[4]) ? p2.map(() => 0) : tan(k1, p2, k3, k1[0], k3[0]); // 第 5 项 = 停住的关键帧（切线 0）
  const t2 = t * t, t3 = t2 * t, h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
  return p1.map((_, j) => h00 * p1[j] + h10 * dt * m1[j] + h01 * p2[j] + h11 * dt * m2[j]);
}
// 落地“咚”一下：只往下、很短（DESIGN_NOTES：镜头不要一直抖）
const thump = (f, f0, amp) => f < f0 ? 0 : -amp * Math.exp(-(f - f0) / 5) * Math.sin(Math.min(Math.PI, (f - f0) / 7 * Math.PI));

// —— 泥卷 ——
const R0 = 0.82, R1 = 0.68, L0 = 3.0, Z1 = 1.6;
const L1 = L0 * (R0 / R1) * (R0 / R1);
// 泥卷沿 x 分成几段（归一化长度 -1—1）：主体柠檬，右头四片依次是 葡萄 / 薄荷 / 珊瑚（最右）……切的顺序从右往左
const SEG = [[-1, 0.52, 3], [0.52, 0.64, 3], [0.64, 0.76, 2], [0.76, 0.88, 1], [0.88, 1.0, 0]];
// 第 i 刀切下 SEG[4 - i]
function rollP(f) { return f < TL.back[0] ? ease.inOut3(prog(f, TL.roll[0], TL.roll[1])) : 1 - ease.inOut3(prog(f, TL.back[0] + 6, TL.back[1])); }
function logGeom(f) { const p = rollP(f), r = lerp(R0, R1, p), L = L0 * (R0 / r) * (R0 / r), z = lerp(0, Z1, p); return { r, L, z, spin: z / ((R0 + R1) / 2) }; }
const GAP = 0.07, SLOT = 2 * R1 + 0.32;
// 切下来以后的一片：tip 0→1 倒下去，然后滑进第 k 格；sq 是按扁的程度（1 = 没按）
function sliceAt(i, f, g) {
  const s = SEG[4 - i], a = s[0] * g.L, b = s[1] * g.L, h = (b - a) / 2, F = TL.cuts[i];
  const X0 = SEG[4][1] * L1 + R1 + 0.32;
  // 这一片自己的“故事时间”：倒带阶段反着走
  let fe = f;
  if (f >= TL.back[0]) { const k = ease.inOut3(prog(f, TL.back[0] + (3 - i) * 7, TL.back[0] + (3 - i) * 7 + 26)); fe = lerp(TL.prints[3] + 20, F - 6, k); }
  const sep = ease.out3(prog(fe, F - 1, F + 5)) * GAP;
  const tipT = prog(fe, F + 3, F + 19), th = Math.PI / 2 * tipT * tipT;          // 像被重力拉倒：越倒越快
  // 落地：压扁一点，留在那（塑性，不弹回）
  const land = fe >= F + 19 ? 1 - 0.07 * ease.out3(prog(fe, F + 19, F + 23)) : 1;
  // 按指纹（印）：倒带时保留——形状就是状态
  let slot = 0;
  for (let j = i + 1; j < 4; j++) slot += ease.inOut3(prog(fe, TL.cuts[j] - 4, TL.cuts[j] + 10));
  const pr = TL.prints[i < 4 ? slotIndexAtEnd(i) : 0];
  // 倒带时指纹也跟着退回去（整段倒放）
  const unp = f >= TL.back[0] ? ease.inOut3(prog(f, TL.back[0] + (3 - i) * 7, TL.back[0] + (3 - i) * 7 + 20)) : 0;
  const press = ease.out5(prog(f, pr - 2, pr + 4)) * (1 - unp);
  const sy = land * (1 - 0.24 * press);
  const hh = h * sy, rr = g.r / Math.sqrt(sy);
  const pivotX = b + sep, landX = pivotX + g.r;                                    // 倒下后的中心 x（还没滑）
  const glide = ease.inOut3(prog(fe, F + 19, F + 33));
  const restX = lerp(landX, X0 + slot * SLOT, glide);
  const dx = restX - landX;
  const v = [-hh * Math.cos(th) + rr * Math.sin(th), hh * Math.sin(th) + rr * Math.cos(th)];
  const c = [pivotX + dx + v[0], v[1], g.z];
  const ax = [Math.cos(th), -Math.sin(th), 0];
  return { p: c, ax, r: rr, h: hh, c: 20 + s[2], off: (s[0] + s[1]) * 2.1, rr: 0.05, spin: th > 0 ? g.spin : g.spin, attached: fe < F - 3 ? 1 : fe < F ? (F - fe) / 3 : 0, press, top: [c[0] - ax[0] * hh, c[1] - ax[1] * hh, c[2]], th };
}
// 每一片最后在第几格（第 0 刀切下的那片被推得最远）→ 第几下被按：从上（靠近泥卷）往下按
function slotIndexAtEnd(i) { return 3 - i; }

function stateAt(f, text) {
  const g = logGeom(f);
  // 字 ↔ 泥卷
  const lMix = f < TL.slump[0] ? 1 : f < TL.slump[1] ? 1 - ease.inOut3(prog(f, TL.slump[0], TL.slump[1])) : f < TL.form[0] ? 0 : ease.inOut3(prog(f, TL.form[0], TL.form[1]));
  // 字被按扁：土在第 15 帧、黏在第 45 帧；先往上提一点（预备），再按下去，留在那；最后一拍两个字一起被砸扁一点
  const pressTo = (f0, s) => f < f0 - 12 ? 1 : f < f0 ? 1 + 0.05 * sm(prog(f, f0 - 12, f0 - 2)) : lerp(1.05, s, ease.out5(prog(f, f0, f0 + 6))) + (f > f0 + 6 ? -0.015 * Math.exp(-(f - f0 - 6) / 6) * Math.sin((f - f0 - 6) / 4) : 0);
  const fin = f >= TL.form[0];
  const slam = (s0) => f < TL.final - 8 ? s0 : f < TL.final ? s0 * (1 + 0.06 * sm(prog(f, TL.final - 8, TL.final - 1))) : lerp(s0 * 1.06, s0 * 0.8, ease.out5(prog(f, TL.final, TL.final + 5)));
  const gSq = fin ? [slam(1), slam(1)] : [pressTo(TL.press[1], 0.72), pressTo(TL.press[0], 0.62)];
  const cyls = [], dents = [], tools = [], hud = { slots: [] };
  if (lMix < 1) {
    // 泥卷的几段（还连着的段之间用平滑并集，看不出缝）
    for (let k = 0; k < SEG.length; k++) {
      const i = 4 - k; // 第 i 刀切下的段（k = 0 是主体，不切）
      if (k >= 1 && f >= TL.cuts[i] - 3) {
        const sl = sliceAt(i, f, g); cyls.push({ p: sl.p, ax: sl.ax, r: sl.r, h: sl.h, off: sl.off, rr: 0.05, c: sl.c, spin: sl.spin, k: 0.07 * sl.attached });
        if (sl.press > 0) dents.push({ p: [sl.top[0], sl.top[1] + 0.01, sl.top[2]], n: [sl.ax[0] * 0.95, sl.ax[1], 0.1], size: 0.58, depth: 0.13 * sl.press, up: [-1, 0, 0.2 * (i - 1.5)], freq: 15 });
        hud.slots.push({ i, p: [sl.p[0], 0, sl.p[2]], th: sl.th, press: sl.press });
        continue;
      }
      const s = SEG[k], a = s[0] * g.L, b = s[1] * g.L;
      cyls.push({ p: [(a + b) / 2, g.r, g.z], ax: [1, 0, 0], r: g.r, h: (b - a) / 2, off: (s[0] + s[1]) * 2.1, rr: 0.05, c: 20 + s[2], spin: g.spin, k: 0.07 });
    }
  }
  // 钢丝：一拍一刀，刀与刀之间抬起来、挪到下一刀
  const C = TL.cuts;
  if (f > C[0] - 30 && f < C[3] + 26) {
    const cx = i => { const s = SEG[4 - i]; return s[0] * L1; };
    let x, y;
    if (f < C[0] - 9) { const t = ease.inOut3(prog(f, C[0] - 30, C[0] - 9)); x = lerp(cx(0) + 3.5, cx(0), t); y = lerp(3.6, 2.2, t); }
    else {
      let j = 0; while (j < 3 && f >= C[j] + 8) j++;
      const F = C[j];
      if (f < F) { x = cx(j); y = lerp(2.2, -0.08, ease.in2(prog(f, F - 9, F))); }
      else { const up = ease.out3(prog(f, F, F + 9)); y = lerp(-0.08, 2.2, up); x = j < 3 ? lerp(cx(j), cx(j + 1), ease.inOut3(prog(f, F + 3, C[j + 1] - 9))) : lerp(cx(3), cx(3) - 1.5, prog(f, F + 6, F + 26)); if (j === 3) y = lerp(y, 4, prog(f, F + 6, F + 26)); }
    }
    const z0 = Z1 - 1.55, z1 = Z1 + 1.55;
    tools.push({ a: [x, y, z0], b: [x, y, z1], ra: 0.014, rb: 0.014 });
    tools.push({ a: [x, y - 0.3, z0 - 0.05], b: [x, y + 0.3, z0 - 0.05], ra: 0.085, rb: 0.085 });
    tools.push({ a: [x, y - 0.3, z1 + 0.05], b: [x, y + 0.3, z1 + 0.05], ra: 0.085, rb: 0.085 });
  }
  // 俯视那一段：桌上亮起一块手机屏（底板颜色从桌面渐到白），泥片就躺在屏上当按钮
  const bg = bgAt(f);
  const ui = prog(f, 372, 398) * (1 - prog(f, 500, 522));
  const panels = [];
  if (ui > 0) {
    const X0 = SEG[4][1] * L1 + R1 + 0.32, xa = X0 - 2.3, xb = X0 + 3 * SLOT + 1.5, za = Z1 - 5.2, zb = Z1 + 1.45;
    panels.push({ r: [xa - 0.18, za - 0.18, xb + 0.18, zb + 0.18], c: mixRGB(bg.floor, HEX('#1E1C22'), ui), rad: 0.85 });
    panels.push({ r: [xa, za, xb, zb], c: mixRGB(bg.floor, HEX('#FBF8F3'), ui), rad: 0.7 });
    hud.phone = { ui, corners: [[xa, 0, za], [xb, 0, zb]], head: [xa + 0.55, 0, Z1 + R1 - 0.05] };
  }
  hud.ui = ui;
  // 镜头
  const pos = hermite(CAM, f, k => k[1]), tgt = hermite(CAM, f, k => k[2]), fov = hermite(CAM, f, k => [k[3]])[0];
  const dy = thump(f, TL.press[0], 0.07) + thump(f, TL.final, 0.1);
  pos[1] += dy; tgt[1] += dy;
  const dark = prog(f, 560, 592);
  const scene = {
    text: lMix > 0 ? text : null, textPos: [-0.35, 0, 0], flat: false, H: 0.34, R: 0.2, warp: 0.05, dome: 0.14,
    gCol: [10, 12], gSq, gRot: [0.02, -0.025], lMix: lMix > 0 && lMix < 1 ? lMix : lMix >= 1 ? 1 : 0,
    marble: MARBLE, marbleScale: 1.3,
    blobs: [], coils: [], dents, tools, cyls, panels,
    palette: SETS.map(s => HEX(s[0])),
    cam: { pos, tgt, fov }, shift: [0, 0],
    light: { dir: [-0.45, 0.72, 0.55], key: [2.5, 2.35, 2.15].map(v => v * lerp(1, 1.12, dark)),
      sky: mixRGB(bg.top.map(v => v * 0.62), [0.06, 0.07, 0.1], dark), bounce: bg.floor.map(v => v * 0.32),
      rimDir: [0.7, 0.35, -0.6], rim: lerp3([0.5, 0.35, 0.4], [1.1, 1.5, 1.7], dark) },
    floorCol: bg.floor, bgTop: bg.top, bgBot: bg.floor, floorTex: [0.02, 0, 1, 0],
    fog: [lerp(24, 16, dark), lerp(48, 30, dark)], shadowK: 7, seed: 3,
    spot: [0.4, 0.6, 5.2, 0.7 * dark],
    focus: Math.hypot(pos[0] - tgt[0], pos[1] - tgt[1], pos[2] - tgt[2]), aperture: 9,
  };
  // 每段的 k（还连着的平滑并集）放进 cyl 的第 4 行
  return { scene, hud, lMix, dark };
}
