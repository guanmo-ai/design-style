// 第 2 章 · 房间剖面：切掉两面墙，45° 看进去。地板一条条木板砸下来，墙一块块垒高，家具一件件落进来。
import { THREE, mesh, mat, lowpoly, rng, blob } from '../lib.js';
import { plinth } from '../kit.js';
import { festoon } from './props.js';

export function buildRoom(K, { x = 0, z = 0, T0 = 0 } = {}) {
  K.scene_(x, z, T0);
  const R = rng(8);
  plinth(K, { T: -0.25, seed: 5, top: '#E8C9A0', speed: 0.6 });
  const it = [];
  // 地板：横向木条，从左往右一条条砸下（每条再切成三段，错开一点）
  for (let i = 0; i < 24; i++) for (let k = 0; k < 3; k++)
    it.push({ x: -11.5 + i, y: 0, z: -8 + k * 8, w: 0.97, h: 0.22, d: 7.96, c: ['#E3B583', '#D9A673', '#EBC293'][(i + k) % 3], t0: 0.35 + i * 0.022 + k * 0.05, dur: 0.28, type: 'slam', hgt: 6 });
  // 两面墙：1×1 的砖一排排垒上去（左墙沿 z、后墙沿 x），留出窗洞
  const H = 10;
  for (let row = 0; row < H; row++) for (let i = 0; i < 24; i++) {
    const tt = 0.85 + row * 0.07 + i * 0.006;
    const winL = i >= 13 && i <= 18 && row >= 3 && row <= 6;        // 左墙窗
    if (!winL) it.push({ x: -12.25, y: row, z: -11.5 + i, w: 0.5, h: 0.98, d: 0.98, c: row === 0 ? '#E7B9A6' : (row + i) % 5 === 0 ? '#F3D9CF' : '#F6E3DA', t0: tt, dur: 0.25, type: 'slam', hgt: 3 });
    const winB = false;
    if (!winB) it.push({ x: -11.5 + i, y: row, z: -12.25, w: 0.98, h: 0.98, d: 0.5, c: row === 0 ? '#C9B6E6' : (row + i) % 6 === 0 ? '#E6DCF6' : '#DCD0F2', t0: tt + 0.02, dur: 0.25, type: 'slam', hgt: 3 });
  }
  // 地毯：一块块小方毯拼出来
  for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++)
    it.push({ x: -1.5 + i, y: 0.22, z: 1 + j, w: 0.98, h: 0.05, d: 0.98, c: (i === 0 || j === 0 || i === 5 || j === 4) ? '#F28AA6' : (i + j) % 2 ? '#FFD6C2' : '#FFE6D6', t0: 1.65 + (i + j) * 0.03, dur: 0.22, type: 'flip' });
  K.shards(it);
  for (let row = 0; row < H; row += 2) K.ev(T0 + 0.85 + row * 0.07 + 0.15, 'tick', -0.3);
  K.ev(T0 + 0.35 + 0.17, 'rumble', 0);

  // 窗外的天（窗洞里）+ 月亮
  K.begin('window', 'pop', 1.6, 0.35, -12.4, 5, 4);
  K.B(0.1, 4, 6, -12.4, 3, 4, mat('#BFE0F6', { emissive: '#8FB4E8', ei: 0.45, rough: .3 }));   // 窗外的天：不跟着入夜变亮，免得糊成一块白
  K.B(0.12, 0.25, 6.2, -12.2, 2.9, 4, '#FFFDF7'); K.B(0.12, 4.2, 0.2, -12.2, 2.9, 4, '#FFFDF7');
  K.B(0.14, 0.9, 0.9, -12.3, 5.2, 5.8, K.glow('#FFF4C8', 0.6));
  // 书架 + 书
  K.begin('shelf', 'drop', 1.9, 0.5, -4, 5.5, -11.7);
  K.B(6.5, 0.25, 1.1, -4, 5.5, -11.4, '#B98757');
  K.B(6.5, 0.25, 1.1, -4, 7.5, -11.4, '#B98757');
  const bc = ['#F27D6A', '#7DB8E8', '#F5C451', '#7FCBA8', '#B79CFF', '#F28AA6'];
  for (let k = 0; k < 11; k++) K.B(0.45, 1.2 + (k % 3) * 0.25, 0.8, -7 + k * 0.55, 5.75, -11.4, bc[k % 6]);
  for (let k = 0; k < 8; k++) K.B(0.5, 1.0 + (k % 2) * 0.3, 0.8, -6.8 + k * 0.6, 7.75, -11.4, bc[(k + 2) % 6]);
  // 床
  K.begin('bed', 'drop', 2.0, 0.55, 6, 0.22, -8);
  K.B(8, 1.4, 6, 6, 0.22, -8.5, '#C9A27E');
  K.B(7.8, 0.9, 5.8, 6, 1.62, -8.5, '#FFFDF7');
  K.B(5.2, 0.4, 6.1, 7.4, 2.45, -8.5, '#7DB8E8', { rough: .9, r: 0.2 });
  K.B(2, 0.6, 4.4, 3.2, 2.52, -8.5, '#FFFFFF', { r: 0.28 });
  K.B(0.6, 4, 6, 1.7, 0.22, -8.5, '#B98757');
  // 书桌 + 显示器 + 椅子（左墙边）
  K.begin('desk', 'drop', 2.15, 0.5, -9.5, 0.22, -3);
  K.B(4, 0.3, 7, -9.8, 3.3, -3, '#E3B583');
  for (const [dx, dz] of [[-1.7, -3.2], [1.7, -3.2], [-1.7, 3.2], [1.7, 3.2]]) K.B(0.25, 3.1, 0.25, -9.8 + dx, 0.22, -3 + dz, '#B98757');
  K.B(0.35, 2.4, 3.6, -11.3, 3.6, -3, '#3B3552');
  K.B(0.05, 2.0, 3.2, -11.1, 3.8, -3, K.glow('#9FE0FF', 0.45));
  K.B(1.0, 0.9, 0.9, -9.0, 3.6, -0.6, '#F27D6A');
  K.begin('chair', 'spin', 2.35, 0.5, -7, 0.22, -3);
  K.B(2, 0.3, 2, -7, 2.0, -3, '#F5C451'); K.B(0.3, 2.4, 2, -6.1, 2.3, -3, '#F5C451');
  K.B(0.3, 1.8, 0.3, -7, 0.22, -3, '#3B3552');
  // 落地灯
  K.begin('lamp', 'drop', 2.45, 0.5, 9.8, 0.22, 2);
  K.B(1.2, 0.2, 1.2, 9.8, 0.22, 2, '#3B3552'); K.B(0.18, 6, 0.18, 9.8, 0.42, 2, '#3B3552');
  K.add(mesh(new THREE.ConeGeometry(1.3, 1.6, 10, 1, true).translate(9.8, 6.9, 2), new THREE.MeshStandardMaterial({ color: '#FFD27A', side: THREE.DoubleSide, flatShading: true })));
  { const bulb = K.glow('#FFF1C2', 1.6); bulb.userData.lamp = true; K.add(mesh(new THREE.SphereGeometry(0.45, 24, 16).translate(9.8, 6.5, 2), bulb)); }
  { const pl = new THREE.PointLight('#FFC77A', 0, 14, 1.5); pl.position.set(9.8, 6.2, 2); pl.userData.lamp = true; K.add(pl); K.lamps.push(pl); }
  // 豆袋沙发 + 植物 + 唱片机 + 猫
  K.begin('beanbag', 'drop', 2.6, 0.55, 3, 0.27, 6);
  K.add(mesh(blob(2, 4, 0.06, 3).scale(1, 0.62, 1).translate(3, 1.4, 6), mat('#B79CFF', { rough: .8 })));
  K.add(mesh(blob(1.0, 5, 0.06, 2).scale(1.2, 0.5, 1).translate(3.4, 2.5, 5.6), mat('#C9B4FF', { rough: .8 })));   // 豆袋上被压出的窝
  K.begin('plant', 'pop', 2.75, 0.45, -9.5, 0.22, 8.5);
  K.B(1.6, 1.4, 1.6, -9.5, 0.22, 8.5, '#F27D6A');
  for (let k = 0; k < 6; k++) K.add(mesh(blob(0.8 + R() * 0.4, k + 30, 0.1).translate(-9.5 + (R() - .5) * 1.4, 2.4 + k * 0.5, 8.5 + (R() - .5) * 1.4), mat(['#4DAF72', '#7FCBA8', '#5BBE74'][k % 3])));
  K.begin('record', 'pop', 2.85, 0.4, 9.5, 0.22, -2.5);
  K.B(2.4, 1.6, 2.4, 9.5, 0.22, -2.5, '#7FCBA8'); K.B(2.2, 0.2, 2.2, 9.5, 1.82, -2.5, '#3B3552');
  K.add(mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.06, 24).translate(9.5, 2.06, -2.5), mat('#1F1B2E', { rough: .3 })));
  K.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 24).translate(9.5, 2.08, -2.5), mat('#F28AA6')));
  K.begin('cat', 'drop', 3.05, 0.5, 1.5, 0.27, 3);
  K.B(1.6, 0.8, 0.8, 1.5, 0.27, 3, '#F08A3A'); K.B(0.8, 0.75, 0.75, 2.6, 0.6, 3, '#F08A3A');
  K.add(mesh(new THREE.ConeGeometry(0.18, 0.35, 4).translate(2.4, 1.5, 2.8), mat('#E07A2E')), mesh(new THREE.ConeGeometry(0.18, 0.35, 4).translate(2.4, 1.5, 3.2), mat('#E07A2E')));
  K.B(1.2, 0.2, 0.2, 0.3, 0.5, 3.3, '#F08A3A');
  // 海报
  K.begin('poster', 'pop', 2.9, 0.4, 5, 6, -12);
  K.B(3, 3.6, 0.1, 5, 4.6, -11.9, '#F5C451'); K.B(2.4, 1.4, 0.05, 5, 6.1, -11.83, '#F27D6A'); K.B(2.4, 0.7, 0.05, 5, 5.1, -11.83, '#7DB8E8');

  // ---------- 第三版加的细节 ----------
  // 窗帘：一褶褶的粉色布（竖着的圆柱一排）
  K.begin('curtain', 'pop', 1.75, 0.4, -11.7, 5, 4);
  for (const z0 of [0.7, 7.3]) for (let k = 0; k < 5; k++) K.add(mesh(new THREE.CylinderGeometry(0.17, 0.2, 4.6, 16).translate(-11.6 + (k % 2) * 0.12, 4.9, z0 + (k - 2) * 0.3), mat('#F7A9BE', { rough: .85 })));
  K.B(0.15, 0.15, 8.6, -11.6, 7.3, 4, '#B98757');
  // 后墙顶上一串小彩灯（入夜亮，台灯关了也还亮着）
  K.begin('fairy', 'drawx', 2.0, 0.5, -11, 9.2, -11.5);
  festoon(K, [-11.4, 9.4, -11.5], [11.4, 9.4, -11.5], 16, 0.9);
  // 挂钟：指针在走
  K.begin('clock', 'pop', 2.5, 0.35, -0.5, 7.6, -11.9);
  K.add(mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.16, 40).rotateX(Math.PI / 2).translate(-0.5, 7.6, -11.92), mat('#F27D6A')));
  K.add(mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.18, 40).rotateX(Math.PI / 2).translate(-0.5, 7.6, -11.9), mat('#FFFDF7')));
  { const hand = (L, w) => { const g = new THREE.Group(); g.position.set(-0.5, 7.6, -11.78); g.add(mesh(new THREE.BoxGeometry(w, L, 0.03).translate(0, L / 2 - 0.05, 0), mat('#3B3552'))); K.add(g); return g; };
    const hm = hand(0.55, 0.07), hh = hand(0.38, 0.09); K.hooks = K.hooks || []; K.hooks.push(t => { hm.rotation.z = -t * 1.2; hh.rotation.z = -t * 0.1 - 1; }); }
  // 书桌上一杯热可可，冒三缕热气
  K.begin('mug', 'pop', 2.65, 0.35, -9.2, 3.6, -5.2);
  K.add(mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.55, 24).translate(-9.2, 3.88, -5.2), mat('#F5C451')));
  K.add(mesh(new THREE.TorusGeometry(0.16, 0.05, 10, 20).rotateY(Math.PI / 2).translate(-9.2, 3.88, -5.52), mat('#F5C451')));
  { const steam = []; for (let k = 0; k < 4; k++) { const m = mesh(blob(0.14, k + 3, 0.1, 1), new THREE.MeshStandardMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.55, roughness: 1 }), { cast: false }); m.position.set(-9.2, 4.3, -5.2); K.add(m); steam.push(m); }
    K.hooks.push(t => steam.forEach((m, k) => { const a = (t * 0.7 + k / 4) % 1; m.position.set(0.12 * Math.sin(a * 6 + k), 0.65 + a * 1.4, 0); /* 组内坐标：组的原点在杯子底下 */ m.scale.setScalar((0.6 + a * 1.4) * Math.sin(Math.PI * a)); })); }
  // 墙上两幅小画、床头一个闹钟、地上一双拖鞋
  K.begin('frames', 'pop', 2.95, 0.35, -6, 6, -11.9);
  K.B(1.6, 1.2, 0.12, -7.6, 1.8 + 0.2, -11.9, '#FFFDF7'); K.B(1.3, 0.9, 0.06, -7.6, 2.15, -11.82, '#7FCBA8');
  K.B(1.2, 1.6, 0.12, 9.6, 6.6, -11.9, '#FFFDF7'); K.B(0.9, 1.3, 0.06, 9.6, 6.75, -11.82, '#F28AA6');
  K.begin('slippers', 'drop', 3.1, 0.4, 4.5, 0.22, -3.8, { h: 3 });
  for (const dx of [0, 0.75]) K.B(0.6, 0.22, 1.2, 4.2 + dx, 0.22, -3.8 + dx * 0.2, '#F28AA6', { r: 0.1 });
  K.begin(null);
}
