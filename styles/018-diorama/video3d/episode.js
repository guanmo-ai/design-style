// 018 · 微缩景观 Diorama · 全片时间轴（20 秒，120 BPM，一拍 0.5 秒）
//   01 城市街角   0.0— 4.2  规则：一块块搭（第一秒地板、房子一起砸下来，镜头往后拉）
//   02 房间剖面   4.2— 7.8  规则：切开一面墙
//   03 模型铁路   7.8—11.2  规则：移轴 = 变小
//   04 落到界面  11.2—14.2  规则：房间就是遥控器
//   05 天黑了    14.2—16.4  规则：暖光 = 有人住
//   结尾 16.4—20.0：镜头一路慢慢推向房间那扇亮着的窗，片名和署名升起；18.6 台灯“咔”地关掉，
//   房间只剩月光和小彩灯，镜头继续缓推到最后一帧（第三版：去掉倒带，结尾是一个安静的收束）
import { THREE, setup, makeComposer, rng } from './lib.js';
import { Kit, clamp, smooth, back, lerp, lerpC } from './kit.js';
import { buildStreet } from './scenes/street.js';
import { buildRoom } from './scenes/room.js';
import { buildValley } from './scenes/valley.js';

const Q = new URLSearchParams(location.search);
const W = +(Q.get('w') || 1920), H = +(Q.get('h') || 1080), PR = +(Q.get('pr') || 1);
const DUR = 20;
const ctx = setup({ W, H, pr: PR, exposure: 0.92, env: 0.3 });
const { scene } = ctx;

// ---------- 天空（画布渐变，逐帧重画） ----------
const skyC = document.createElement('canvas'); skyC.width = 2; skyC.height = 512;
const skyG = skyC.getContext('2d'), skyT = new THREE.CanvasTexture(skyC); skyT.colorSpace = THREE.SRGBColorSpace; scene.background = skyT;
function sky(stops) { const g = skyG.createLinearGradient(0, 0, 0, 512); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); skyG.fillStyle = g; skyG.fillRect(0, 0, 2, 512); skyT.needsUpdate = true; }
const DAY = ['#F8F1E3', '#F6EEDD', '#F3E8D6'], DUSK = ['#FBE3C4', '#F8C9A8', '#F2B29C'], NIGHT = ['#C3A6E6', '#F0BCD2', '#FFD3B4'];

// ---------- 光（第三版：电影布光——低角度暖色主光拉出长影子、冷色天光补暗部、背后一盏粉色轮廓光勾边） ----------
const HEMI = new THREE.HemisphereLight('#DDE8FF', '#E9C9A6', 0.6); scene.add(HEMI);
const SUN = new THREE.DirectionalLight('#FFE6C4', 3.8); SUN.castShadow = true;
SUN.shadow.mapSize.set(4096, 4096); SUN.shadow.bias = -0.0004; SUN.shadow.normalBias = 0.03; SUN.shadow.radius = 4; scene.add(SUN, SUN.target);
const RIM = new THREE.DirectionalLight('#FFD6EC', 1.3); scene.add(RIM, RIM.target);

// ---------- 桌面：三块底座真的放在一张铺了纸的桌子上（长焦 + 移轴下，远处的桌面自然虚掉） ----------
{
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'), Rt = rng(77), Math_random = Rt;   // 固定种子：分段并行渲染时每个进程的纹理一致
  g.fillStyle = '#F4E8D4'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) { const v = Math_random(); g.fillStyle = `rgba(${v < .5 ? '170,130,90' : '255,250,240'},${0.035 + Math_random() * 0.05})`; g.fillRect(Math_random() * 512, Math_random() * 512, 1 + Math_random() * 40, 1 + Math_random() * 2); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(14, 14); tex.anisotropy = 8;
  const table = new THREE.Mesh(new THREE.PlaneGeometry(700, 700).rotateX(-Math.PI / 2).translate(38, -4.42, 0), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92 }));
  table.receiveShadow = true; scene.add(table); window.__table = table;
}

// ---------- 场景 ----------
const K = new Kit(scene);
const P_STREET = [0, 0], P_ROOM = [38, -4], P_VALLEY = [76, 0];
buildStreet(K, { x: P_STREET[0], z: P_STREET[1], T0: 0 });
buildRoom(K, { x: P_ROOM[0], z: P_ROOM[1], T0: 3.9 });
buildValley(K, { x: P_VALLEY[0], z: P_VALLEY[1], T0: 7.5 });

const END = 20.0;

// ---------- 镜头关键帧（位置、看向、视角） ----------
const camAt = (P, ang, rad, h, ty = 1, fov = 20) => ({ pos: [P[0] - 0.5 + Math.sin(ang) * rad, h, P[1] + 0.2 + Math.cos(ang) * rad], tgt: [P[0] - 0.5, ty, P[1] + 0.2], fov });
const KEYS = [
  [0.0, camAt(P_STREET, 0.86, 54, 24, -1.0, 24)],         // 第 0 帧：低一点、近一点，碎块正砸下来
  [1.3, camAt(P_STREET, 0.72, 62, 34, 0.8)],              // 一秒多拉开，看到整块底座
  [3.6, camAt(P_STREET, 0.50, 50, 27, 1.6)],
  [4.5, camAt(P_ROOM, 0.80, 70, 40, 2.5)],
  [7.4, camAt(P_ROOM, 0.62, 60, 34, 3.0)],
  [8.2, camAt(P_VALLEY, 0.70, 60, 32, 1.5)],
  [11.0, camAt(P_VALLEY, 0.42, 48, 24, 1.5)],
  [11.9, camAt(P_STREET, 0.60, 98, 50, 1.0)],
  [13.8, camAt(P_STREET, 0.66, 102, 52, 1.0)],
  [14.9, camAt([38, -2], 0.62, 120, 66, 0, 22)],
  [16.4, camAt([38, -2], 0.70, 112, 62, 0, 22)],
  [18.6, camAt(P_ROOM, 0.70, 70, 36, 2.6, 22)],           // 结尾：推向房间——整间屋子像一个亮着的娃娃屋
  [20.0, camAt(P_ROOM, 0.74, 65, 33, 2.8, 21.5)],        // 关灯后继续缓推，最后一帧停在小彩灯里
];
// 第三版：镜头走单调三次样条（Fritsch–Carlson），经过关键帧时速度连续，不再“到一个点停一下”
function pchip(ts, ys) {
  const n = ts.length, h = [], dl = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) { h[i] = ts[i + 1] - ts[i]; dl[i] = (ys[i + 1] - ys[i]) / h[i]; }
  m[0] = dl[0] * 0.5; m[n - 1] = dl[n - 2] * 0.5;   // 起点、终点也带一点速度：第 0 帧镜头就在动
  for (let i = 1; i < n - 1; i++) {
    if (dl[i - 1] * dl[i] <= 0) continue;
    const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1];
    m[i] = (w1 + w2) / (w1 / dl[i - 1] + w2 / dl[i]);
  }
  return t => {
    let i = 0; while (i < n - 2 && t > ts[i + 1]) i++;
    const u = clamp((t - ts[i]) / h[i]), u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * h[i] * m[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * h[i] * m[i + 1];
  };
}
const TS = KEYS.map(k => k[0]);
const CURVES = { pos: [0, 1, 2].map(k => pchip(TS, KEYS.map(K_ => K_[1].pos[k]))), tgt: [0, 1, 2].map(k => pchip(TS, KEYS.map(K_ => K_[1].tgt[k]))), fov: pchip(TS, KEYS.map(K_ => K_[1].fov)) };
function camera(t) {
  return { pos: CURVES.pos.map(f => f(t)), tgt: CURVES.tgt.map(f => f(t)), fov: CURVES.fov(t) };
}
const cam = new THREE.PerspectiveCamera(20, W / H, 1, 800);
const comp = makeComposer(ctx, cam, { ao: true, aoRadius: 0.5, aoDist: 0.3, bloom: 0.5, bloomRadius: 0.45, bloomThreshold: 0.86, vig: 0.28, grain: 0.014, sat: 1.12, con: 1.08, tilt: { focus: 0.56, band: 0.26, amount: 2.0 }, edge: 0.11, paper: '#F7F0E2' });
const PASS = n => comp.passes.filter(p => p.constructor.name === n);
const [GTAO] = PASS('GTAOPass'), [BLOOM] = PASS('UnrealBloomPass'), AO_FULL = GTAO.blendIntensity;
const TILT = comp.passes.filter(p => p.uniforms && p.uniforms.focus);
const GRADE = comp.passes.find(p => p.uniforms && p.uniforms.vig);

// ---------- 字幕层（DOM 叠在画布上，一起截图） ----------
const $ = id => document.getElementById(id);
const CH = [
  [0.0, 4.2, '01', '城市街角', '东京下町 · 咖啡店与民居', '一块块搭', '底座、土层、方砖，全是数得清的小块'],
  [4.2, 7.8, '02', '房间剖面', '等距房间 · Monument Valley 2014 之后', '切开一面墙', '45° 俯视，剖面里看得见生活'],
  [7.8, 11.2, '03', '模型铁路', 'Miniatur Wunderland 2001', '移轴 = 变小', '上下虚、中间实，世界立刻像模型'],
  [11.2, 14.2, '04', '落到界面', '智能家居 · 2026', '房间就是遥控器', '点哪件家具，哪件就亮'],
  [14.2, 16.4, '05', '天黑了', '整座小城', '暖光 = 有人住', '窗户一盏盏亮，模型就活了'],
];
const rise = (t, t0, d = 0.27) => { const e = clamp((t - t0) / d); return `transform:translateY(${(1 - (1 - (1 - e) ** 3)) * 110}%);opacity:${e > 0 ? 1 : 0}`; };
function overlay(t) {
  const c = CH.find(c => t >= c[0] && t < c[1]);
  if (!c) { $('chap').innerHTML = $('rule').innerHTML = $('count').innerHTML = ''; }
  else {
    const t0 = c[0] + 0.15;
    $('chap').innerHTML = `<div class="line"><span style="${rise(t, t0)};font:800 22px Inter;letter-spacing:.2em;color:#8A7FA0">${c[2]} · ${c[4]}</span></div>
      <div class="line"><span style="${rise(t, t0 + 0.08)};font:900 58px/1.15 NotoSC">${c[3]}</span></div>`;
    $('rule').innerHTML = `<div class="line"><span style="${rise(t, t0 + 0.5)};font:900 44px/1.2 NotoSC;background:#3B3552;color:#FFFDF7;padding:6px 18px;border-radius:12px">规则 ${+c[2]} · ${c[5]}</span></div>
      <div class="line" style="margin-top:12px"><span style="${rise(t, t0 + 0.62)};font:700 28px NotoSC">${c[6]}</span></div>`;
    $('count').innerHTML = `${c[2]} / 05`;
  }
  // 片名：第 0 帧就在，倒带结尾回来
  const showT = t < 3.8;
  $('title').innerHTML = showT ? `<div style="font:900 64px/1 NotoSC">微缩景观</div><div style="font:800 22px Inter;letter-spacing:.32em;margin-top:10px">DIORAMA · 018</div>` : '';
  // 结尾：片名在画面中间升起，台灯关掉后落下去
  const fin = t > 16.4;
  const down = 0;   // 第三版：片名和署名一直留到最后一帧
  $('finale').innerHTML = fin ? `<div class="line"><span style="${rise(t, 16.5, 0.4)};${down ? `transform:translateY(${down * 110}%)` : ''};font:900 132px/1.1 NotoSC;color:#FFFDF7;text-shadow:0 6px 30px #3B355255">微缩景观</span></div>
    <div class="line"><span style="${rise(t, 16.7, 0.4)};${down ? `transform:translateY(${down * 110}%)` : ''};font:800 30px Inter;letter-spacing:.4em;color:#FFFDF7">DIORAMA · 把世界放上桌面</span></div>
    <div class="line" style="margin-top:34px"><span style="${rise(t, 17.0, 0.4)};${down ? `transform:translateY(${down * 110}%)` : ''};font:700 28px NotoSC;letter-spacing:.5em;color:#FFFDF7">观默</span></div>` : '';
  // 第 4 章：整屏的“洞”收成一部手机，外面是纸
  const e = smooth(clamp((t - 11.3) / 0.6)) * (1 - smooth(clamp((t - 13.95) / 0.5)));
  const SC = W / 1920, pw = lerp(W + 40, 470 * SC, e), ph = lerp(H + 40, 940 * SC, e), r = lerp(0, 62 * SC, e);
  const px = W / 2 - pw / 2 + lerp(0, 330 * SC, e), py = H / 2 - ph / 2;
  Object.assign($('hole').style, { left: px + 'px', top: py + 'px', width: pw + 'px', height: ph + 'px', borderRadius: r + 'px', display: e > 0.001 ? 'block' : 'none' });
  Object.assign($('phone').style, { left: (px - 14) + 'px', top: (py - 14) + 'px', width: (pw + 28) + 'px', height: (ph + 28) + 'px', borderRadius: (r + 14) + 'px', display: e > 0.3 ? 'block' : 'none', opacity: clamp((e - 0.3) / 0.3) });
  // 手机里的 App 界面 + 左边的卡片
  const ui = [];
  if (e > 0.6) {
    const pop = (t0) => { const k = back(clamp((t - t0) / 0.3), 2); return `transform:scale(${k});opacity:${k > 0 ? 1 : 0}`; };
    const sx = px, sy = py;
    ui.push(`<div style="position:absolute;left:${sx + 30}px;top:${sy + 34}px;font:700 16px Inter">9:41</div>`);
    ui.push(`<div style="position:absolute;left:${sx + 30}px;top:${sy + 78}px;font:900 34px NotoSC;${pop(11.95)}">我的街角</div>`);
    const chips = [['咖啡店', '营业中 · 3 人在店里', '#7FCBA8', 12.25, 120, 640], ['二楼的灯', '暖光 40%', '#F5C451', 12.45, 230, 720], ['售货机', '可乐还剩 6 瓶', '#F27D6A', 12.65, 90, 800]];
    for (const [a, b, c, t0, ox, oy] of chips) ui.push(`<div class="chip" style="left:${sx + ox}px;top:${sy + oy}px;${pop(t0)};transform-origin:left center"><span class="dot" style="background:${c}"></span>${a}<small>${b}</small></div>`);
    const lx = 140, ly = 210;
    ui.push(`<div style="position:absolute;left:${lx}px;top:${ly}px;width:620px"><div class="line"><span style="${rise(t, 12.0)};font:900 72px/1.1 NotoSC">把家，</span></div><div class="line"><span style="${rise(t, 12.1)};font:900 72px/1.1 NotoSC">做成一个模型。</span></div>
      <div class="line" style="margin-top:22px"><span style="${rise(t, 12.35)};font:500 28px/1.6 NotoSC;color:#6A6080">每件家具都是一个开关：点哪里，哪里就亮。</span></div>
      <div style="margin-top:34px;display:inline-block;${pop(12.7)};background:#F28AA6;color:#fff;font:900 28px NotoSC;padding:18px 30px;border-radius:18px">打开我的房间 →</div></div>`);
  }
  $('appui').innerHTML = ui.join('');
}

// ---------- 每帧 ----------
// 镜头往下“咚”的时刻：街角二层砸下、房间的床、模型铁路的山
const THUMPS = [0.55 + 0.5 + 0.36, 3.9 + 2.0 + 0.33, 7.5 + 0.6];
const tOn = K.emissive.map((m, i) => 14.45 + ((i * 7) % 13) / 13 * 0.9);
window.renderFrame = (f, fps = 30) => {
  const t = f / fps;
  // 街角在倒带段用“倒回去的本地时间”，其他场景照常
  const tl = t;
  K.update(tl);
  (K.hooks || []).forEach(h => h(tl));
  // 天色：15.0 黄昏 → 15.6 入夜；倒带时退回白天
  const nightT = t;
  const dusk = smooth(clamp((nightT - 14.2) / 0.5)), night = smooth(clamp((nightT - 14.6) / 0.6));
  const off = smooth(clamp((t - 18.5) / 0.1));   // 结尾：台灯关掉
  sky([0, 1, 2].map(i => '#' + lerpC(lerpC(DAY[i], DUSK[i], dusk), NIGHT[i], night).getHexString()));
  // 夜：月光偏蓝紫、天光压暗，让暖色的窗、彩灯、路灯成为画面里最亮的东西（动画电影的夜景）
  SUN.color.copy(lerpC(lerpC('#FFE6C4', '#FFB27A', dusk), '#8F9BFF', night)); SUN.intensity = (3.8 - 0.6 * dusk - 2.7 * night) * (1 - 0.35 * off);
  HEMI.intensity = (0.6 - 0.05 * dusk - 0.3 * night) * (1 - 0.3 * off); HEMI.color.copy(lerpC('#DDE8FF', '#7D74D8', night)); HEMI.groundColor.copy(lerpC('#E9C9A6', '#5E4A78', night));
  GRADE.uniforms.vig.value = 0.28 + 0.22 * night;
  window.__table.material.color.copy(lerpC('#FFFFFF', '#FFC4DA', night));   // 桌面入夜偏粉：月光的蓝 × 粉 = 第二版的薰衣草夜色
  { const pc = lerpC('#F7F0E2', '#F1E6EE', night); GRADE.uniforms.paper.value.set(pc.r, pc.g, pc.b); }   // 纸屑边入夜也染一点薰衣草
  RIM.color.copy(lerpC('#FFD6EC', '#B7C4FF', night)); RIM.intensity = 1.3 + 0.6 * night;
  scene.environmentIntensity = 0.3 * (1 - 0.5 * night) * (1 - 0.3 * off);
  // 第三版：关灯只关房间的落地灯；小彩灯、窗户、路灯继续亮，结尾停在一间被小彩灯照着的房间
  K.emissive.forEach((m, i) => { const on = smooth(clamp((nightT - tOn[i]) / 0.18)) * (m.userData.lamp ? 1 - off : 1); m.emissiveIntensity = m.userData.base * (0.35 + on * 3.0); });
  const lamp = smooth(clamp((nightT - 14.8) / 0.2));
  K.lamps.forEach(l => l.intensity = 42 * lamp * (l.userData.lamp ? 1 - off : 1)); if (K.spot) K.spot.intensity = 45 * lamp;
  BLOOM.strength = 0.08 + 0.62 * night; BLOOM.threshold = 0.95 - 0.17 * night;
  // 镜头 + 阴影框跟着镜头看的地方走
  const C = camera(t);
  let thump = 0;
  for (const th of THUMPS) { const d = t - th; if (d > 0 && d < 0.35) thump += 0.55 * Math.sin(Math.PI * clamp(d / 0.12)) * (d < 0.12 ? 1 : Math.exp(-(d - 0.12) * 14)); }
  C.pos[1] -= thump; C.tgt[1] -= thump;
  cam.position.set(...C.pos); cam.lookAt(...C.tgt); cam.fov = C.fov;
  const hx = smooth(clamp((t - 11.3) / 0.6)) * (1 - smooth(clamp((t - 13.95) / 0.5)));   // 第 4 章：画面往右挪，让模型落在手机屏幕里
  if (hx > 0) cam.setViewOffset(W, H, -330 * hx * W / 1920, 0, W, H); else cam.clearViewOffset();
  cam.updateProjectionMatrix();
  // 第三版：所有开关都做成平滑过渡（原来是 0/1 硬切，移轴和阴影会“跳”一下）
  const wide = smooth(clamp((t - 11.2) / 0.7)) * (1 - smooth(clamp((t - 16.4) / 1.6)));
  const S = lerp(24, 70, smooth(clamp((t - 13.9) / 0.9)) * (1 - smooth(clamp((t - 16.4) / 1.4))));
  SUN.target.position.set(C.tgt[0], 0, C.tgt[2]); SUN.position.set(C.tgt[0] - 36, 30, C.tgt[2] + 4);   // 低一点的太阳：影子长，像傍晚前的金色时刻
  RIM.target.position.set(C.tgt[0], 0, C.tgt[2]); RIM.position.set(C.tgt[0] - 20, 22, C.tgt[2] - 40);
  Object.assign(SUN.shadow.camera, { left: -S, right: S, top: S, bottom: -S, near: 1, far: 160 }); SUN.shadow.camera.updateProjectionMatrix();
  // 移轴：第 3 章里先关掉，“咔”一下打开（规则演示）；远景时减弱
  const inCh3 = smooth(clamp((t - 7.45) / 0.35)) * (1 - smooth(clamp((t - 11.0) / 0.5))), demo = smooth(clamp((t - 8.75) / 0.25));
  const amt = lerp(2.0 * (1 - 0.6 * wide), 3.4 * demo, inCh3), band = lerp(0.26, 0.26 - 0.08 * demo, inCh3);
  TILT.forEach(p => { p.uniforms.amount.value = amt; p.uniforms.band.value = band; });
  // GTAO：底座拼装时关（大平板掠射角会出方形空洞）
  GTAO.enabled = t > 0.7 && Q.get('ao') !== '0'; GTAO.blendIntensity = AO_FULL * smooth(clamp((t - 0.7) / 0.4));
  overlay(t);
  comp.render();
  return true;
};
window.__events = K.events;
window.__ready = true;
if (!Q.get('anim')) { window.renderFrame(+(Q.get('f') || 0)); window.__done = true; }
