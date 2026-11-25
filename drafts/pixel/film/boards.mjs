// 像素风 · 全片中段的四块板：色阶、整数倍率、卡帧、像素气象台。
//
// 每块板都画在和招牌同一张 320 × 180 的像素网格上，用同一套 23 色色板，镜头 6 倍。
// 字是缝合像素字体 12 px 的点阵（glyphs.json），标题按 2 倍整数放大。
// 出字一律“砸下来”：提前 2 帧从上方 6 px、2 px 落下，落地那一帧白一帧，同时配一声（时间点写进 events）。
//
// draw(d, k, t)：d 是当帧的画笔（solid / rect / p），k 是板内真实帧号（不受卡帧影响），t 是世界时间（卡帧时停住）。

import { Rng, bolt, rand, Particles, P } from "./vendor/pixelfx/core/index.js";

export function makeBoards({ C, GLYPHS, CYAN_LIGHT, PINK_LIGHT, FLASH_LIGHT }) {
  const G = (ch) => {
    const g = GLYPHS[ch];
    if (!g) throw new Error("glyphs.json 里没有：" + ch);
    return g;
  };
  const textW = (s, sc = 1) => [...s].reduce((w, ch) => w + (ch === " " ? 4 : G(ch).w), 0) * sc;
  function text(d, s, x, y, c, sc = 1) {
    for (const ch of s) {
      if (ch === " ") { x += 4 * sc; continue; }
      const g = G(ch);
      g.rows.forEach((row, r) => { for (let col = 0; col < row.length; col++) if (row[col] === "#") d.rect(x + col * sc, y + r * sc, sc, sc, c); });
      x += g.w * sc;
    }
  }
  // 砸下来：k0 落地（白一帧），k0 - 2、k0 - 1 两帧在空中
  const slam = (k, k0) => (k < k0 - 2 ? null : k < k0 - 1 ? { dy: -6, flash: false } : k < k0 ? { dy: -2, flash: false } : { dy: 0, flash: k === k0 });
  function slamText(d, k, it) {
    const s = slam(k, it.k0);
    if (!s) return;
    text(d, it.s, it.x, it.y + s.dy, s.flash ? C.neon[0] : it.c, it.sc ?? 1);
    if (s.flash) d.p.glow(it.x + textW(it.s, it.sc ?? 1) / 2, it.y + 6 * (it.sc ?? 1), 10 + textW(it.s, it.sc ?? 1) / 3, CYAN_LIGHT, 0.25);
  }
  const hexOf = (c) => "#" + [c & 255, (c >>> 8) & 255, (c >>> 16) & 255].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();

  // 背景：墨色 + 每 8 px 一个点，网格本身就是这一期的主角
  function ground(d) {
    for (let y = 0; y < 180; y++) for (let x = 0; x < 320; x++) d.Cc[y * 320 + x] = (x & 7) === 4 && (y & 7) === 4 ? C.sky[1] : C.ink;
    d.rain();
  }

  // 16 × 16 雷云图标：o 描边、h 高光、L 云、S 云底、w 闪电
  const ICON = [
    "................",
    "......oooo......",
    "....oohhhhoo....",
    "...ohhLLLLhho...",
    ".ooohLLLLLLLLo..",
    "ohhhLLLLLLLLLLo.",
    "ohLLLLLLLLLLLLLo",
    "oLLLLLLLLLLLLLLo",
    "oSSSSSSwwSSSSSSo",
    ".oooooowwoooooo.",
    "......wwo.......",
    ".....wwwwo......",
    "......owwo......",
    ".....oww........",
    ".....ow.........",
    "......o.........",
  ];
  const ICON_PAL = { o: C.ink, h: C.cyan[1], L: C.rain[2], S: C.rain[1], w: C.bolt[0] };
  function sprite(d, rows, pal, x, y, sc = 1, override) {
    rows.forEach((row, r) => [...row].forEach((ch, col) => {
      if (ch === ".") return;
      d.rect(x + col * sc, y + r * sc, sc, sc, override ?? pal[ch]);
    }));
  }
  // 非整数倍率的反例：最近邻按 2.5 倍放大，像素有的 2 格宽、有的 3 格宽
  function spriteFrac(d, rows, pal, x, y, sc) {
    const n = Math.round(rows.length * sc);
    for (let yy = 0; yy < n; yy++) for (let xx = 0; xx < n; xx++) {
      const ch = rows[Math.floor(yy / sc)][Math.floor(xx / sc)];
      if (ch !== ".") d.solid(x + xx, y + yy, pal[ch]);
    }
  }
  const MINI = {
    cloud: ["........", "...##...", "..####..", ".######.", "########", ".######.", "........", "........"],
    storm: ["...##...", "..####..", ".######.", "########", "...ww...", "..ww....", "...w....", "........"],
    rain: ["...##...", "..####..", ".######.", "########", "........", ".w..w...", "...w..w.", "........"],
    moon: ["..###...", ".##.....", "##......", "##......", "##......", ".##.....", "..###...", "........"],
  };

  // ------------------------------------------------------------------ 板 2 · 色阶
  const RAMPS = [["夜空", C.sky], ["云", C.cloud], ["雨", C.rain], ["霓虹", C.neon], ["青", C.cyan], ["暖窗", C.warm], ["闪电", C.bolt]];
  const rowY = (r) => 50 + r * 16;
  const SW = { x0: 48, w: 12, h: 10, pitch: 14 };
  const B2 = {
    texts: [
      { s: "色阶", x: 16, y: 10, c: C.neon[2], sc: 2, k0: 0 },
      { s: "23 色 · 7 条色阶", x: 72, y: 22, c: C.rain[2], k0: 0 },
      ...RAMPS.map(([name], r) => ({ s: name, x: 16, y: rowY(r) - 1, c: C.rain[2], k0: 3 + 3 * r })),
      { s: "每 1/15 秒降一阶", x: 168, y: 122, c: C.cyan[1], k0: 36 },
      { s: "只在色板里跳，不做渐变", x: 168, y: 140, c: C.neon[2], k0: 48 },
    ],
    demo: 24, // 大灯泡出现；之后每拍重新烧白一次
  };
  // 灯泡冷却：和招牌上的灯泡同一条规则，每 2 帧（1/15 秒）降一阶
  const COOL = [
    [C.neon[0], C.neon[0], C.neon[1]],
    [C.neon[0], C.neon[1], C.neon[2]],
    [C.neon[1], C.neon[2], C.neon[3]],
    [C.neon[2], C.neon[3], C.neon[4]],
  ];
  function draw2(d, k) {
    ground(d);
    for (const it of B2.texts) slamText(d, k, it);
    RAMPS.forEach(([, ramp], r) => {
      const s = slam(k, 3 + 3 * r);
      if (!s) return;
      ramp.forEach((c, i) => {
        const x = SW.x0 + i * SW.pitch, y = rowY(r) + s.dy;
        d.rect(x, y, SW.w, SW.h, s.flash ? C.neon[0] : c);
        if (c === C.ink || c === C.sky[0]) for (let xx = x; xx < x + SW.w; xx++) d.solid(xx, y, C.sky[2]); // 最暗的两格在墨底上描一条顶边
      });
      if (s.flash) d.p.glowLine(SW.x0, rowY(r) + 5, SW.x0 + ramp.length * SW.pitch, rowY(r) + 5, 8, ramp[Math.min(ramp.length - 1, 2)], 0.35);
    });
    if (k >= B2.demo - 2) {
      const a = k - B2.demo, beatK = a < 0 ? 0 : a % 12, step = a < 0 ? 0 : Math.min(3, Math.floor(beatK / 2));
      const [core, arm, corner] = COOL[step], X = 196, Y = 46, P = 12;
      const look = [[corner, arm, corner], [arm, core, arm], [corner, arm, corner]];
      const s = slam(k, B2.demo);
      look.forEach((row, r) => row.forEach((c, cc) => d.rect(X + cc * P, Y + r * P + s.dy, P, P, c)));
      d.p.glow(X + 18, Y + 18, 40 - step * 6, step < 2 ? C.neon[1] : PINK_LIGHT, [0.7, 0.45, 0.3, 0.18][step]);
      // 色值：大字跟着灯泡芯一起跳
      text(d, hexOf(core), 172 + Math.round((132 - textW(hexOf(core), 2)) / 2), 88 + s.dy, step < 2 ? C.neon[0] : C.neon[2], 2);
      // 霓虹那一行下面的小箭头，指着现在在第几阶
      const idx = C.neon.indexOf(core), ax = SW.x0 + idx * SW.pitch + 5, ay = rowY(3) + 11;
      d.solid(ax + 1, ay, C.neon[0]); d.rect(ax, ay + 1, 3, 1, C.neon[0]);
    }
  }

  // ------------------------------------------------------------------ 板 3 · 整数倍率
  const SC = [
    { sc: 1, x: 18, k0: 9 },
    { sc: 2, x: 42, k0: 6 },
    { sc: 3, x: 82, k0: 3 },
    { sc: 4, x: 136, k0: -99 }, // 镜头从它的一个像素里退出来，所以一开始就在
  ];
  const BASE = 112;
  const B3 = {
    texts: [
      { s: "整数倍率", x: 16, y: 10, c: C.cyan[1], sc: 2, k0: 0 },
      { s: "最近邻放大", x: 120, y: 22, c: C.rain[2], k0: 0 },
      { s: "×2.5", x: 228, y: 118, c: C.neon[3], k0: 24 },
      { s: "像素宽窄不一", x: 212, y: 134, c: C.neon[2], k0: 27 },
      { s: "形 15 fps", x: 16, y: 140, c: C.cyan[1], k0: 36 },
      { s: "光 30 fps", x: 16, y: 158, c: C.warm[0], k0: 39 },
    ],
  };
  for (const s of SC) B3.texts.push({ s: "×" + s.sc, x: s.x + Math.round((16 * s.sc - textW("×" + s.sc)) / 2), y: BASE + 4, c: C.rain[2], k0: Math.max(0, s.k0) });
  function draw3(d, k, t) {
    ground(d);
    for (const s of SC) {
      const sl = slam(k, s.k0);
      if (!sl) continue;
      sprite(d, ICON, ICON_PAL, s.x, BASE - 16 * s.sc + sl.dy, s.sc, sl.flash ? C.neon[0] : undefined);
    }
    const bad = slam(k, 24);
    if (bad) {
      spriteFrac(d, ICON, ICON_PAL, 220, BASE - 40 + bad.dy, 2.5);
      if (k >= 27) { // 打叉：两条 2 px 粗的斜线
        for (let i = 0; i < 44; i++) for (const o of [0, 1]) { d.solid(218 + i + o, BASE - 42 + i, C.neon[3]); d.solid(262 - i - o, BASE - 42 + i, C.neon[3]); }
        if (k < 29) d.p.glow(240, BASE - 20, 30, PINK_LIGHT, 0.4);
      }
    }
    for (const it of B3.texts) slamText(d, k, it);
    // 两条轨道：上面按 15 fps 一格一格挪（形），下面每帧都走（光）。同样的速度 60 px/s
    if (k >= 36) {
      const x0 = 96, len = 200, v = 60;
      const sec = (k - 36) / 30, xs = x0 + (Math.floor(sec * 15) / 15 * v) % len, xl = x0 + (sec * v) % len;
      for (let x = x0; x < x0 + len; x += 4) { d.solid(x, 147, C.sky[2]); d.solid(x, 165, C.sky[2]); }
      sprite(d, MINI.storm, { "#": C.rain[2], w: C.bolt[0] }, Math.floor(xs), 140);
      d.rect(Math.floor(xl), 163, 3, 3, C.warm[0]);
      d.p.glow(Math.floor(xl) + 1.5, 164.5, 9, C.warm[1], 0.45);
      for (let i = 1; i <= 4; i++) d.p.dot(Math.floor(xl) - i * 3, 164, C.warm[1], 0.5 - i * 0.1);
    }
  }

  // ------------------------------------------------------------------ 板 4 · 卡帧
  const WIN = { x: 16, y: 44, w: 154, h: 112 };
  const ROD4 = { x: 95, top: 94 };
  const BOLT4 = bolt(new Rng(31), 62, WIN.y + 1, ROD4.x + 0.5, ROD4.top + 0.5, { jag: 0.26, depth: 5 });
  const BOLT4b = bolt(new Rng(37), 150, WIN.y + 1, 143.5, 118.5, { jag: 0.3, depth: 4 });
  const SKY4 = Array.from({ length: 9 }, (_, i) => ({ x: WIN.x + 1 + i * 17, w: 17, top: WIN.y + 70 + Math.floor(rand(i, 71) * 22) }));
  const B4 = {
    hero: 12, release: 16, strike2: 36,
    texts: [
      { s: "卡帧", x: 16, y: 10, c: C.bolt[1], sc: 2, k0: 0 },
      { s: "撞击时世界停住", x: 72, y: 22, c: C.rain[2], k0: 0 },
      { s: "一拍 = 12 帧", x: 186, y: 40, c: C.rain[2], k0: 6 },
      { s: "反相 1 帧", x: 198, y: 70, c: C.neon[0], k0: 16 },
      { s: "冻结 3 帧", x: 198, y: 86, c: C.bolt[2], k0: 19 },
      { s: "震 3 · 2 · 1 px", x: 186, y: 102, c: C.cyan[1], k0: 22 },
      { s: "次要撞击 冻结 1 帧", x: 186, y: 142, c: C.bolt[2], k0: 40 },
    ],
  };
  const sparks4 = new Particles({ seed: 41, ground: (x) => (x >= 60 && x < 130 ? 128 : WIN.y + WIN.h - 2), sparks: ["#ffffff", "#cfe8ff", "#7fb0ff"] });
  function draw4(d, k, t) {
    ground(d);
    // 小窗：一片夜空、远处的楼、屋顶和避雷针
    // 窗里的天空不算“实体”（英雄帧反相时变成亮的，楼和闪电变成剪影）
    for (let y = WIN.y; y < WIN.y + WIN.h; y++) d.Cc.fill(C.sky[1], y * 320 + WIN.x, y * 320 + WIN.x + WIN.w);
    for (const b of SKY4) d.rect(b.x, b.top, b.w, WIN.y + WIN.h - b.top, C.sky[2]);
    for (const [i, b] of SKY4.entries()) for (let y = b.top + 3; y < WIN.y + WIN.h - 4; y += 5) for (let x = b.x + 2; x < b.x + b.w - 3; x += 4)
      if (rand(i, x, y) < 0.18) d.solid(x, y, rand(i, y, x) < 0.5 ? C.warm[2] : C.sky[4]);
    d.rain([WIN.x + 1, WIN.y + 1, WIN.w - 2, WIN.h - 2]); // 小窗里的雨：卡帧时一起停住
    d.rect(60, 128, 70, WIN.y + WIN.h - 128, C.ink);
    d.rect(136, 119, 22, WIN.y + WIN.h - 119, C.ink);
    for (let x = 62; x < 128; x += 6) d.solid(x, 136, C.warm[1]);
    for (let y = ROD4.top; y < 128; y++) d.solid(ROD4.x, y, C.sky[4]);
    d.solid(ROD4.x - 1, ROD4.top + 1, C.sky[4]); d.solid(ROD4.x + 1, ROD4.top + 1, C.sky[4]);
    for (let x = WIN.x; x < WIN.x + WIN.w; x++) { d.solid(x, WIN.y, C.sky[3]); d.solid(x, WIN.y + WIN.h - 1, C.sky[3]); }
    for (let y = WIN.y; y < WIN.y + WIN.h; y++) { d.solid(WIN.x, y, C.sky[3]); d.solid(WIN.x + WIN.w - 1, y, C.sky[3]); }
    // 蓄电
    if (k < B4.hero) {
      const charge = Math.max(0, k + 6) / (B4.hero + 6), st = Math.floor(t * 15);
      for (let i = 0; i < 1 + Math.floor(charge * 4); i++) {
        const r = new Rng(st * 17 + i), a = r.range(-Math.PI, 0), l = 2 + r.range(0, 3 + charge * 5);
        d.p.polyline(bolt(r, ROD4.x + 0.5, ROD4.top + 0.5, ROD4.x + 0.5 + Math.cos(a) * l, ROD4.top + 0.5 + Math.sin(a) * l, { jag: 0.4, depth: 2 }), C.bolt[2]);
      }
      d.p.glow(ROD4.x + 0.5, ROD4.top + 0.5, 6 + charge * 8, C.bolt[2], 0.25 + charge * 0.4);
    }
    if (k >= B4.hero - 3 && k < B4.hero) {
      const n = Math.floor(BOLT4.length * [0.35, 0.6, 0.85][k - B4.hero + 3]);
      d.p.polyline(BOLT4.slice(0, n), C.bolt[2]);
    }
    const a = k - B4.hero;
    const col = a < 0 ? null : a < 5 ? 0 : a < 7 ? 1 : a < 9 ? 2 : a < 11 ? 3 : null; // 卡住的 4 帧一直是白的
    if (col !== null) {
      d.p.polyline(BOLT4.map(([x, y]) => [x + 1, y]), C.bolt[Math.min(3, col + 1)]);
      d.p.polyline(BOLT4, C.bolt[col]);
      if (col === 0) d.p.glow(ROD4.x, ROD4.top, 30, C.bolt[1], 0.5);
    }
    const b2 = k - B4.strike2, col2 = b2 < 0 ? null : b2 < 3 ? 0 : b2 < 5 ? 1 : b2 < 7 ? 2 : b2 < 9 ? 3 : null;
    if (col2 !== null) { d.p.polyline(BOLT4b, C.bolt[col2]); if (col2 === 0) d.p.glow(143, 118, 20, C.bolt[1], 0.4); }
    sparks4.draw(d.p, "front");
    for (const it of B4.texts) slamText(d, k, it);
    // 胶片条：一格一帧，按真实时间往前走（世界停住了，钟没停）
    const cell = (x, y, c) => d.rect(x, y, 8, 8, c);
    if (k >= 4) for (let i = 0; i < 12; i++) {
      const x = 186 + i * 10, y = 54, on = k >= B4.hero + i;
      for (let xx = x; xx < x + 8; xx++) { d.solid(xx, y + 8, C.sky[2]); }
      if (on) cell(x, y, i === 0 ? C.neon[0] : i <= 3 ? C.bolt[2] : C.cyan[3]);
      if (k === B4.hero + i) d.p.glow(x + 4, y + 4, 8, i === 0 ? C.bolt[1] : CYAN_LIGHT, 0.5);
    }
    if (k >= B4.release) { const s = slam(k, 16); d.rect(186, 72 + s.dy, 6, 6, s.flash ? C.neon[0] : C.neon[0]); }
    if (k >= B4.release + 3) { const s = slam(k, 19); d.rect(186, 88 + s.dy, 6, 6, s.flash ? C.neon[0] : C.bolt[2]); }
    if (k >= B4.strike2 - 2) for (let i = 0; i < 12; i++) {
      const x = 186 + i * 10, y = 124, on = k >= B4.strike2 + i;
      for (let xx = x; xx < x + 8; xx++) d.solid(xx, y + 8, C.sky[2]);
      if (on) cell(x, y, i === 0 ? C.bolt[2] : C.cyan[3]);
    }
  }
  // 板 4 的粒子按世界时间步进，由 film.mjs 在松开那一帧撒
  const spawn4 = (SR) => {
    for (let i = 0; i < 36; i++) { const a = SR.range(-Math.PI, 0.1), sp = SR.range(70, 260); sparks4.spawn(P.SPARK, ROD4.x, ROD4.top + 2, Math.cos(a) * sp, Math.sin(a) * sp, SR.range(0.35, 0.8)); }
  };

  // ------------------------------------------------------------------ 板 5 · 像素气象台
  const PH = { x: 28, y: 6, w: 88, h: 168 };
  const BTN = { x: 36, y: 146, w: 72, h: 14 };
  const BAR = { x: 36, y: 130, cells: 24, fill: 22 };
  const B5 = {
    press: 60,
    texts: [
      { s: "像素气象台", x: 136, y: 6, c: C.neon[2], sc: 2, k0: 0 },
      { s: "20:48", x: 36, y: 13, c: C.rain[2], k0: 0 },
      { s: "23°", x: 74, y: 30, c: C.neon[0], sc: 2, k0: 3 },
      { s: "雷阵雨", x: 36, y: 66, c: C.cyan[1], k0: 6 },
      { s: "21", x: 37, y: 96, c: C.rain[2], k0: 9 }, { s: "22", x: 57, y: 96, c: C.rain[2], k0: 9 },
      { s: "23", x: 77, y: 96, c: C.rain[2], k0: 9 }, { s: "00", x: 97, y: 96, c: C.rain[2], k0: 9 },
      { s: "降雨", x: 36, y: 114, c: C.rain[2], k0: 12 },
      { s: "图标 15 fps", x: 140, y: 54, c: C.cyan[1], k0: 24 },
      { s: "1 px 描边", x: 140, y: 78, c: C.cyan[1], k0: 30 },
      { s: "进度一格 3 px", x: 140, y: 127, c: C.cyan[1], k0: 36 },
      { s: "按下位移 1 px", x: 140, y: 147, c: C.cyan[1], k0: 42 },
    ],
    // [出现的帧, 起点 x, y, 终点 x]：y 对着标注文字的中线
    leaders: [[24, 70, 60, 136], [30, 118, 84, 136], [36, 110, 133, 136], [42, 110, 153, 136]],
  };
  function draw5(d, k, t) {
    ground(d);
    // 机身：2 px 边框，四角各去一格做成圆角
    d.rect(PH.x, PH.y, PH.w, PH.h, C.sky[3]);
    d.rect(PH.x + 2, PH.y + 2, PH.w - 4, PH.h - 4, C.sky[0]);
    for (const [x, y] of [[PH.x, PH.y], [PH.x + PH.w - 1, PH.y], [PH.x, PH.y + PH.h - 1], [PH.x + PH.w - 1, PH.y + PH.h - 1]]) d.solid(x, y, C.ink);
    d.rect(PH.x + 34, PH.y + 4, 20, 2, C.sky[2]);
    // 图标：雨点按 15 fps 往下掉，闪电每拍闪一下
    const ix = 36, iy = 28, st = Math.floor(t * 15), beatK = ((k % 12) + 12) % 12;
    sprite(d, ICON, ICON_PAL, ix, iy, 2);
    if (k >= 0 && beatK < 2) { sprite(d, ICON.map((r) => r.replace(/[^w]/g, ".")), ICON_PAL, ix, iy, 2, C.neon[0]); d.p.glow(ix + 16, iy + 24, 16, C.bolt[1], 0.4); }
    for (let i = 0; i < 3; i++) { const yy = ((st * 2 + i * 7) % 14); d.rect(ix + 6 + i * 9, iy + 30 + yy, 1, 2, C.rain[2]); }
    for (const it of B5.texts) slamText(d, k, it);
    // 逐时预报的小图标
    ["storm", "rain", "cloud", "moon"].forEach((name, i) => {
      const s = slam(k, 9);
      if (s) sprite(d, MINI[name], { "#": name === "moon" ? C.warm[0] : C.rain[2], w: C.bolt[0] }, 38 + i * 20, 84 + s.dy, 1, s.flash ? C.neon[0] : undefined);
    });
    // 进度条：一格 2 px 填色 + 1 px 空隙 = 3 px，每 2 帧涨 2 格，停在 90%
    if (k >= 10) {
      const filled = Math.min(BAR.fill, Math.max(0, Math.floor((k - 12) / 2) * 2 + 2));
      for (let i = 0; i < BAR.cells; i++) d.rect(BAR.x + i * 3, BAR.y, 2, 6, i < filled && k >= 12 ? (i === filled - 1 && k < 28 ? C.neon[0] : C.cyan[2]) : C.sky[2]);
      if (k >= 12) { const pct = Math.round((filled / BAR.fill) * 90) + "%"; text(d, pct, 108 - textW(pct), 114, C.neon[0]); }
    }
    // 按钮：1 px 描边，底下 1 px 投影；按下去整体往下 1 px，投影消失
    if (k >= 13) {
      const s = slam(k, 15), down = k >= B5.press && k < B5.press + 4 ? 1 : 0, y = BTN.y + s.dy + down;
      if (!down) d.rect(BTN.x, BTN.y + BTN.h + s.dy, BTN.w, 1, C.neon[5]);
      d.rect(BTN.x, y, BTN.w, BTN.h, C.ink);
      d.rect(BTN.x + 1, y + 1, BTN.w - 2, BTN.h - 2, down ? C.neon[2] : s.flash ? C.neon[0] : C.neon[3]);
      d.rect(BTN.x + 1, y + 1, BTN.w - 2, 1, down ? C.neon[3] : C.neon[2]);
      text(d, "提醒我", BTN.x + Math.round((BTN.w - textW("提醒我")) / 2), y + 1, C.neon[0]);
      if (k >= B5.press && k < B5.press + 3) d.p.glow(BTN.x + BTN.w / 2, y + 7, 40, PINK_LIGHT, 0.5);
    }
    // 标注线
    for (const [k0, x0, y0, x1] of B5.leaders) if (k >= k0) {
      const n = Math.min(x1 - x0, (k - k0 + 1) * 12);
      for (let x = x0; x < x0 + n; x += 2) d.solid(x, y0, C.sky[4]);
      d.rect(x0 - 1, y0 - 1, 3, 3, C.cyan[2]);
    }
  }

  return {
    draw2, draw3, draw4, draw5, spawn4, sparks4, BOLT4, text, textW, slam, hexOf,
    B2, B3, B4, B5,
    // 转场时镜头钻进 / 退出的那一格（世界坐标）
    target: {
      b2In: [SW.x0 + 1 * SW.pitch + 6, rowY(6) + 5], // “闪电”第二格
      b3Out: [136 + 7 * 4 + 2, BASE - 64 + 8 * 4 + 2], // ×4 图标闪电的白格
      b3In: [136 + 8 * 4 + 2, BASE - 64 + 6 * 4 + 2], // ×4 图标的云
      b4Out: [ROD4.x, ROD4.top], // 避雷针尖
      b4In: [186 + 4, 54 + 4], // 胶片条第一格（反相那一帧，白）
      b5Out: [36 + 7 * 2 + 1, 28 + 8 * 2 + 1], // 手机图标的闪电
      b5In: [40, 150], // 按钮的粉
    },
    // 出字的时间（板内帧号），给配乐用
    textCues: {
      b2: [...new Set(B2.texts.map((x) => x.k0))].concat([B2.demo]),
      b3: [...new Set(B3.texts.map((x) => x.k0).concat(SC.map((s) => s.k0).filter((x) => x >= 0)))],
      b4: [...new Set(B4.texts.map((x) => x.k0))],
      b5: [...new Set(B5.texts.map((x) => x.k0).concat([15]))],
    },
  };
}
