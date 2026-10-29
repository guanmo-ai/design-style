// 第 3 章 · 模型铁路：低多边形的小山、湖和一圈铁轨。地形是一根根方柱从下面顶上来，树“噗”地冒出来，小火车开起来。
import { THREE, mesh, mat, lowpoly, rng, noise2, mergeGeometries } from '../lib.js';
import { plinth, clamp } from '../kit.js';

export function heightAt(i, j) {
  const x = i - 5.5, z = j - 5.5;
  const hill = 5.5 * Math.exp(-((x + 2.5) ** 2 + (z + 2.5) ** 2) / 7) + 3.2 * Math.exp(-((x - 3) ** 2 + (z + 3.5) ** 2) / 5);
  const lake = (x - 1.5) ** 2 / 4 + (z - 2) ** 2 / 3 < 1.6 ? -1 : 0;
  return lake < 0 ? -1 : Math.max(0, Math.round(hill * 2) / 2);
}

export function buildValley(K, { x = 0, z = 0, T0 = 0 } = {}) {
  K.scene_(x, z, T0);
  const R = rng(13);
  plinth(K, { T: -0.25, seed: 9, top: '#9ED7A8', speed: 0.6 });
  const it = [];
  // 12×12 根地形柱，从中间往外一圈圈“顶”上来（slam 从上砸下，柱子越高越晚落定）
  for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) {
    const h = heightAt(i, j), x0 = -11 + i * 2, z0 = -11 + j * 2;
    const d = Math.hypot(i - 5.5, j - 5.5);
    if (h < 0) { it.push({ x: x0, y: 0, z: z0, w: 1.98, h: 0.18, d: 1.98, c: (i + j) % 2 ? '#8CC8EE' : '#7DB8E8', t0: 0.4 + d * 0.035, dur: 0.3, type: 'flip' }); continue; }
    const cols = h > 4.5 ? '#F7F3EC' : h > 3 ? '#BDB6E8' : h > 1.5 ? '#A9DDB4' : ['#9ED7A8', '#F5D27A', '#A9DDB4', '#F6B4C4'][(i * 3 + j * 5) % 4];
    for (let s = 0; s <= h * 2; s++) {   // 每根柱子由 0.5 高的小块叠起来，一块块砸
      const top = s === Math.floor(h * 2);
      it.push({ x: x0, y: s * 0.5, z: z0, w: 1.98, h: 0.5, d: 1.98, c: top ? cols : (s % 2 ? '#C99A72' : '#D6A97E'), t0: 0.4 + d * 0.035 + s * 0.045, dur: 0.26, type: 'slam', hgt: 4 + s * 0.4 });
    }
  }
  K.shards(it);
  K.ev(T0 + 0.6, 'rumble', 0);
  // 树：在草地格子上
  for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) {
    const h = heightAt(i, j);
    if (h < 0 || h > 3 || R() > 0.32 || (j >= 9)) continue;
    const xx = -11 + i * 2 + (R() - .5), zz = -11 + j * 2 + (R() - .5), y = h + 0.5;
    K.begin('tree', 'pop', 1.2 + Math.hypot(i - 5.5, j - 5.5) * 0.05 + R() * 0.2, 0.4, xx, y, zz);
    const s = 0.8 + R() * 0.5;
    K.B(0.3 * s, 1 * s, 0.3 * s, xx, y, zz, '#A0715A');
    if (R() < 0.6) { K.add(mesh(new THREE.ConeGeometry(1.1 * s, 2 * s, 6).translate(xx, y + 1.8 * s, zz), mat('#3E9A68'))); K.add(mesh(new THREE.ConeGeometry(0.8 * s, 1.6 * s, 6).translate(xx, y + 2.8 * s, zz), mat('#52B27C'))); }
    else K.add(mesh(lowpoly(new THREE.IcosahedronGeometry(1.1 * s, 0).translate(xx, y + 2.0 * s, zz), .2, i * 31 + j), mat(['#F5D27A', '#F6A8BE', '#7FCBA8'][(i + j) % 3])));
  }
  // 铁轨：沿前面两排绕一圈（长方形），枕木一根根落
  const track = [];
  const path = (u) => {   // u∈[0,1) 沿长方形 x∈[-9,9], z∈[6,10]
    const L = 2 * 18 + 2 * 4, d = u * L;
    if (d < 18) return [-9 + d, 10, 0]; if (d < 22) return [9, 10 - (d - 18), -Math.PI / 2];
    if (d < 40) return [9 - (d - 22), 6, Math.PI]; return [-9, 6 + (d - 40), Math.PI / 2];
  };
  for (let k = 0; k < 44; k++) { const [px, pz, a] = path(k / 44); track.push({ x: px, y: 0.5, z: pz, w: a % Math.PI ? 1.8 : 0.3, h: 0.12, d: a % Math.PI ? 0.3 : 1.8, c: '#B98466', t0: 1.0 + k * 0.012, dur: 0.22, type: 'slam', hgt: 3 }); }
  K.shards(track);
  K.ev(T0 + 1.0, 'zip', 0);
  // 小火车：车头 + 两节，沿轨道跑（位置由 update 钩子算）
  const train = new THREE.Group(); K.root.add(train);
  const car = (c, roof) => { const g = new THREE.Group(); g.add(mesh(new THREE.BoxGeometry(1.7, 1.1, 1.2).translate(0, 1.15, 0), mat(c))); g.add(mesh(new THREE.BoxGeometry(1.8, 0.15, 1.3).translate(0, 1.78, 0), mat(roof))); for (const dx of [-0.5, 0.5]) for (const dz of [-0.6, 0.6]) g.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 10).rotateX(Math.PI / 2).translate(dx, 0.75, dz), mat('#3B3552'))); return g; };
  const loco = car('#F27D6A', '#3B3552'); loco.add(mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.6, 8).translate(0.5, 2.1, 0), mat('#3B3552')));
  const cars = [loco, car('#F5C451', '#FFFDF7'), car('#7DB8E8', '#FFFDF7')];
  cars.forEach(c => train.add(c));
  const puffs = []; for (let k = 0; k < 6; k++) { const p = mesh(lowpoly(new THREE.IcosahedronGeometry(0.5, 1), .1, k), mat('#FFFDF7'), { cast: false }); train.add(p); puffs.push(p); }
  K.hooks = K.hooks || [];
  K.hooks.push((t) => {
    const e = clamp((t - T0 - 1.35) / 0.35);
    train.visible = e > 0;
    const u0 = Math.max(0, t - T0 - 1.35) * 0.09;
    cars.forEach((c, k) => { const [px, pz, a] = path(((u0 - k * 0.045) % 1 + 1) % 1); c.position.set(px, 0.5 + (1 - e) * 5, pz); c.rotation.y = -a; });
    puffs.forEach((p, k) => { const age = ((t * 2.2 + k / 6) % 1); const [px, pz] = path((((u0 - age * 0.04) % 1) + 1) % 1); p.position.set(px, 3 + age * 2.4, pz); p.scale.setScalar((0.4 + age * 1.3) * e); });
  });
  K.begin(null);
}
