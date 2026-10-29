// 018 · 微缩景观 Diorama · 全片时间轴（18 秒，120 BPM，一拍 0.5 秒）
//   01 城市街角   0.0— 5.0  规则：一块块搭
//   02 房间剖面   5.0— 8.6  规则：切开一面墙
//   03 模型铁路   8.6—12.0  规则：移轴 = 变小
//   04 落到界面  12.0—15.0  规则：房间就是遥控器
//   05 天黑了    15.0—17.0  规则：暖光 = 有人住
//   倒带回第 0 帧 17.0—18.0（首尾同一帧）
import { THREE, setup, makeComposer } from './lib.js';
import { Kit, clamp, smooth, back, lerp, lerpC } from './kit.js';
import { buildStreet } from './scenes/street.js';
import { buildRoom } from './scenes/room.js';
import { buildValley } from './scenes/valley.js';

const Q = new URLSearchParams(location.search);
const W = +(Q.get('w') || 1920), H = +(Q.get('h') || 1080), PR = +(Q.get('pr') || 1);
const DUR = 18;
const ctx = setup({ W, H, pr: PR, exposure: 0.95 });
const { scene } = ctx;

// ---------- 天空（画布渐变，逐帧重画） ----------
const skyC = document.createElement('canvas'); skyC.width = 2; skyC.height = 512;
const skyG = skyC.getContext('2d'), skyT = new THREE.CanvasTexture(skyC); skyT.colorSpace = THREE.SRGBColorSpace; scene.background = skyT;
function sky(stops) { const g = skyG.createLinearGradient(0, 0, 0, 512); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); skyG.fillStyle = g; skyG.fillRect(0, 0, 2, 512); skyT.needsUpdate = true; }
const DAY = ['#F8F1E3', '#F6EEDD', '#F3E8D6'], DUSK = ['#FBE3C4', '#F8C9A8', '#F2B29C'], NIGHT = ['#C3A6E6', '#F0BCD2', '#FFD3B4'];

// ---------- 光 ----------
const HEMI = new THREE.HemisphereLight('#E6F0FF', '#D8B898', 1.25); scene.add(HEMI);
const SUN = new THREE.DirectionalLight('#FFF3E0', 3.0); SUN.castShadow = true;
SUN.shadow.mapSize.set(4096, 4096); SUN.shadow.bias = -0.0005; SUN.shadow.normalBias = 0.02; scene.add(SUN, SUN.target);
const RIM = new THREE.DirectionalLight('#CFE2FF', 0.6); RIM.position.set(30, 20, -30); scene.add(RIM);

// ---------- 场景 ----------
const K = new Kit(scene);
const P_STREET = [0, 0], P_ROOM = [38, -4], P_VALLEY = [76, 0];
buildStreet(K, { x: P_STREET[0], z: P_STREET[1], T0: 0 });
buildRoom(K, { x: P_ROOM[0], z: P_ROOM[1], T0: 4.7 });
buildValley(K, { x: P_VALLEY[0], z: P_VALLEY[1], T0: 8.3 });

// 倒带：17.0—18.0 所有零件按时间倒放飞回天上，18.0 时正好回到第 0 帧的状态（首尾同一帧）
const REW0 = 17.0, REW1 = 18.0;
const rewind = (t) => t <= REW0 ? t : REW0 - (REW0) * smooth(clamp((t - REW0) / (REW1 - REW0))) ;   // 把街角的“本地时间”从 17 倒回 0

// ---------- 镜头关键帧（位置、看向、视角） ----------
const camAt = (P, ang, rad, h, ty = 1, fov = 20) => ({ pos: [P[0] - 0.5 + Math.sin(ang) * rad, h, P[1] + 0.2 + Math.cos(ang) * rad], tgt: [P[0] - 0.5, ty, P[1] + 0.2], fov });
const KEYS = [
  [0.0, camAt(P_STREET, 0.74, 62, 34, 0.8)],
  [4.3, camAt(P_STREET, 0.48, 50, 27, 1.6)],
  [5.3, camAt(P_ROOM, 0.80, 70, 40, 2.5)],
  [8.2, camAt(P_ROOM, 0.62, 60, 34, 3.0)],
  [9.0, camAt(P_VALLEY, 0.70, 60, 32, 1.5)],
  [11.8, camAt(P_VALLEY, 0.42, 48, 24, 1.5)],
  [12.7, camAt(P_STREET, 0.60, 98, 50, 1.0)],
  [14.6, camAt(P_STREET, 0.66, 102, 52, 1.0)],
  [15.6, camAt([38, -2], 0.62, 150, 86, 0, 22)],
  [16.9, camAt([38, -2], 0.70, 140, 80, 0, 22)],
  [18.0, camAt(P_STREET, 0.74, 62, 34, 0.8)],
];
function camera(t) {
  let i = 0; while (i < KEYS.length - 2 && t > KEYS[i + 1][0]) i++;
  const [ta, A] = KEYS[i], [tb, B] = KEYS[i + 1], e = smooth(clamp((t - ta) / (tb - ta)));
  const L = (a, b) => a.map((v, k) => lerp(v, b[k], e));
  return { pos: L(A.pos, B.pos), tgt: L(A.tgt, B.tgt), fov: lerp(A.fov, B.fov, e) };
}
const cam = new THREE.PerspectiveCamera(20, W / H, 1, 800);
const comp = makeComposer(ctx, cam, { ao: true, aoRadius: 0.5, aoDist: 0.3, bloom: 0.5, bloomRadius: 0.45, bloomThreshold: 0.86, vig: 0.2, grain: 0.012, tilt: { focus: 0.56, band: 0.26, amount: 2.0 }, edge: 0.11, paper: '#F7F0E2' });
const PASS = n => comp.passes.filter(p => p.constructor.name === n);
const [GTAO] = PASS('GTAOPass'), [BLOOM] = PASS('UnrealBloomPass'), AO_FULL = GTAO.blendIntensity;
const TILT = comp.passes.filter(p => p.uniforms && p.uniforms.focus);

// ---------- 字幕层（DOM 叠在画布上，一起截图） ----------
const $ = id => document.getElementById(id);
const CH = [
  [0.0, 5.0, '01', '城市街角', '东京下町 · 咖啡店与民居', '一块块搭', '底座、土层、方砖，全是数得清的小块'],
  [5.0, 8.6, '02', '房间剖面', '等距房间 · Monument Valley 2014 之后', '切开一面墙', '45° 俯视，剖面里看得见生活'],
  [8.6, 12.0, '03', '模型铁路', 'Miniatur Wunderland 2001', '移轴 = 变小', '上下虚、中间实，世界立刻像模型'],
  [12.0, 15.0, '04', '落到界面', '智能家居 · 2026', '房间就是遥控器', '点哪件家具，哪件就亮'],
  [15.0, 17.2, '05', '天黑了', '整座小城', '暖光 = 有人住', '窗户一盏盏亮，模型就活了'],
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
  const showT = t < 4.6 || t > 17.2;
  $('title').innerHTML = showT ? `<div style="font:900 64px/1 NotoSC">微缩景观</div><div style="font:800 22px Inter;letter-spacing:.32em;margin-top:10px">DIORAMA · 018</div>` : '';
  // 第 4 章：整屏的“洞”收成一部手机，外面是纸
  const e = smooth(clamp((t - 12.1) / 0.6)) * (1 - smooth(clamp((t - 14.75) / 0.5)));
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
    ui.push(`<div style="position:absolute;left:${sx + 30}px;top:${sy + 78}px;font:900 34px NotoSC;${pop(12.75)}">我的街角</div>`);
    const chips = [['咖啡店', '营业中 · 3 人在店里', '#7FCBA8', 13.05, 120, 640], ['二楼的灯', '暖光 40%', '#F5C451', 13.25, 230, 720], ['售货机', '可乐还剩 6 瓶', '#F27D6A', 13.45, 90, 800]];
    for (const [a, b, c, t0, ox, oy] of chips) ui.push(`<div class="chip" style="left:${sx + ox}px;top:${sy + oy}px;${pop(t0)};transform-origin:left center"><span class="dot" style="background:${c}"></span>${a}<small>${b}</small></div>`);
    const lx = 140, ly = 210;
    ui.push(`<div style="position:absolute;left:${lx}px;top:${ly}px;width:620px"><div class="line"><span style="${rise(t, 12.8)};font:900 72px/1.1 NotoSC">把家，</span></div><div class="line"><span style="${rise(t, 12.9)};font:900 72px/1.1 NotoSC">做成一个模型。</span></div>
      <div class="line" style="margin-top:22px"><span style="${rise(t, 13.15)};font:500 28px/1.6 NotoSC;color:#6A6080">每件家具都是一个开关：点哪里，哪里就亮。</span></div>
      <div style="margin-top:34px;display:inline-block;${pop(13.5)};background:#F28AA6;color:#fff;font:900 28px NotoSC;padding:18px 30px;border-radius:18px">打开我的房间 →</div></div>`);
  }
  $('appui').innerHTML = ui.join('');
}

// ---------- 每帧 ----------
const tOn = K.emissive.map((m, i) => 15.25 + ((i * 7) % 13) / 13 * 0.9);
window.renderFrame = (f, fps = 30) => {
  const t = f / fps;
  // 街角在倒带段用“倒回去的本地时间”，其他场景照常
  const tl = rewind(t);
  K.update(tl);
  (K.hooks || []).forEach(h => h(tl));
  // 天色：15.0 黄昏 → 15.6 入夜；倒带时退回白天
  const nightT = t > REW0 ? lerp(16.9, 14.9, smooth(clamp((t - REW0) / 0.8))) : t;
  const dusk = smooth(clamp((nightT - 15.0) / 0.5)), night = smooth(clamp((nightT - 15.4) / 0.6));
  sky([0, 1, 2].map(i => '#' + lerpC(lerpC(DAY[i], DUSK[i], dusk), NIGHT[i], night).getHexString()));
  SUN.color.copy(lerpC(lerpC('#FFF3E0', '#FFC08A', dusk), '#C9B4FF', night)); SUN.intensity = 3.0 - 0.6 * dusk - 0.7 * night;
  HEMI.intensity = 1.25 - 0.1 * dusk - 0.15 * night; HEMI.color.copy(lerpC('#E6F0FF', '#B9A8E8', night));
  K.emissive.forEach((m, i) => { const on = smooth(clamp((nightT - tOn[i]) / 0.12)); m.emissiveIntensity = m.userData.base * (0.35 + on * 2.2); });
  const lamp = smooth(clamp((nightT - 15.6) / 0.15));
  K.lamps.forEach(l => l.intensity = 30 * lamp); if (K.spot) K.spot.intensity = 45 * lamp;
  BLOOM.strength = 0.08 + 0.4 * night; BLOOM.threshold = 0.95 - 0.1 * night;
  // 镜头 + 阴影框跟着镜头看的地方走
  const C = camera(t);
  cam.position.set(...C.pos); cam.lookAt(...C.tgt); cam.fov = C.fov;
  const hx = smooth(clamp((t - 12.1) / 0.6)) * (1 - smooth(clamp((t - 14.75) / 0.5)));   // 第 4 章：画面往右挪，让模型落在手机屏幕里
  if (hx > 0) cam.setViewOffset(W, H, -330 * hx * W / 1920, 0, W, H); else cam.clearViewOffset();
  cam.updateProjectionMatrix();
  const wide = t > 12.3 && t < 17.6 ? 1 : 0, S = wide && t > 15.0 ? 70 : 24;
  SUN.target.position.set(C.tgt[0], 0, C.tgt[2]); SUN.position.set(C.tgt[0] - 26, 44, C.tgt[2] + 18);
  Object.assign(SUN.shadow.camera, { left: -S, right: S, top: S, bottom: -S, near: 1, far: 160 }); SUN.shadow.camera.updateProjectionMatrix();
  // 移轴：第 3 章里先关掉，“咔”一下打开（规则演示）；远景时减弱
  const demo = t > 8.6 && t < 12.0 ? smooth(clamp((t - 9.55) / 0.25)) : 1;
  TILT.forEach(p => { p.uniforms.amount.value = 2.0 * demo * (1 - 0.6 * wide) + (t > 8.6 && t < 12 ? 1.4 * demo : 0); p.uniforms.band.value = 0.26 - (t > 8.6 && t < 12 ? 0.08 * demo : 0); });
  // GTAO：底座拼装时关（大平板掠射角会出方形空洞）
  GTAO.enabled = t > 1.25; GTAO.blendIntensity = AO_FULL * smooth(clamp((t - 1.25) / 0.4));
  overlay(t);
  comp.render();
  return true;
};
window.__events = K.events;
window.__ready = true;
if (!Q.get('anim')) { window.renderFrame(+(Q.get('f') || 0)); window.__done = true; }
