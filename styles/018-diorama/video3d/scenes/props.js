// 第三版的小道具：棉花云、小彩灯串、小鸟、小人、灌木。
// 造型往 3D 动画电影靠：圆、软、头大身小；每样东西都有一点自己的“呼吸”（二级动画，挂在 K.hooks 上）。
import { THREE, mesh, mat, blob, mergeGeometries } from '../lib.js';

const hook = (K, fn) => { K.hooks = K.hooks || []; K.hooks.push(fn); };

// 棉花云：几团软球压扁拼起来，顶上一根细线吊着（线一直伸出画面）
export function cottonCloud(K, x, y, z, s = 1, seed = 1) {
  const parts = [[0, 0, 0, 1.3], [1.2, -0.15, 0.1, 1.0], [-1.25, -0.2, -0.1, 0.95], [0.4, 0.55, -0.1, 0.9], [-0.5, 0.4, 0.2, 0.8], [2.0, -0.4, 0, 0.6], [-2.0, -0.45, 0, 0.55]];
  const g = parts.map(([dx, dy, dz, r], i) => blob(r * s, seed + i, 0.08).scale(1, 0.82, 0.9).translate(x + dx * s, y + dy * s, z + dz * s));
  K.add(mesh(mergeGeometries(g), mat('#FFFDF7', { rough: 0.95 }), { receive: false }));
  K.add(mesh(new THREE.CylinderGeometry(0.015, 0.015, 30, 6).translate(x, y + 15.5 * s, z), mat('#CFC6D8'), { cast: false }));
}

// 小彩灯串：一根下垂的线 + n 颗灯泡，每颗灯泡一个自发光材质（入夜时一颗颗亮）
export function festoon(K, a, b, n = 10, sag = 0.7) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), at = u => new THREE.Vector3().lerpVectors(A, B, u).add(new THREE.Vector3(0, -sag * 4 * u * (1 - u), 0));
  const pts = []; for (let i = 0; i <= 24; i++) pts.push(at(i / 24));
  K.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.022, 6), mat('#2A2630'), { receive: false }));
  const cols = ['#FFD27A', '#FFB0C4', '#FFE9B0', '#B9F0D6'];
  for (let i = 1; i < n; i++) {
    const p = at(i / n);
    K.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 10).translate(p.x, p.y - 0.06, p.z), mat('#3B3552'), { receive: false }));
    K.add(mesh(new THREE.SphereGeometry(0.13, 16, 12).scale(1, 1.2, 1).translate(p.x, p.y - 0.22, p.z), K.glow(cols[i % 4], 2.4), { cast: false }));
  }
}

// 小鸟：圆身子 + 圆头 + 小尖嘴，站在电线上，时不时点一下头
export function bird(K, x, y, z, ph = 0) {
  const g = new THREE.Group(), c = ['#7DB8E8', '#F27D6A', '#F5C451'][Math.round(ph * 3) % 3];
  g.add(mesh(new THREE.SphereGeometry(0.2, 20, 14).scale(1.25, 1, 1).translate(0, 0.2, 0), mat(c)));
  const head = new THREE.Group(); head.position.set(0.2, 0.38, 0);
  head.add(mesh(new THREE.SphereGeometry(0.13, 20, 14), mat(c)));
  head.add(mesh(new THREE.ConeGeometry(0.045, 0.12, 10).rotateZ(-Math.PI / 2).translate(0.16, -0.01, 0), mat('#F5A13A')));
  for (const s of [-1, 1]) head.add(mesh(new THREE.SphereGeometry(0.025, 8, 6).translate(0.08, 0.04, s * 0.09), mat('#1E1B2A', { rough: .2 })));
  g.add(head);
  g.add(mesh(new THREE.ConeGeometry(0.09, 0.28, 10).rotateZ(Math.PI / 2 + 0.4).translate(-0.3, 0.2, 0), mat(c)));
  g.position.set(x, y, z); K.add(g);
  hook(K, t => { const k = (t * 0.9 + ph) % 2.2; head.rotation.z = k < 0.3 ? -0.5 * Math.sin(Math.PI * k / 0.3) : 0; g.rotation.y = 0.3 * Math.sin(t * 0.4 + ph * 3); });
}

// 小人：头大身小、圆滚滚（3D 动画电影的比例）。pose: 'stand' | 'sit' | 'walk'
export function person(K, x, z, shirt, rot = 0, pose = 'stand', y = 0.18) {
  const g = new THREE.Group(), skin = ['#F1C9A5', '#E3B08A', '#C98F6A'][Math.abs(Math.round(x * 7)) % 3];
  const sit = pose === 'sit', by = sit ? 0.48 : 0.62;
  const body = new THREE.Group(); body.position.y = by; g.add(body);
  body.add(mesh(new THREE.CapsuleGeometry(0.24, 0.32, 8, 16).translate(0, 0.38, 0), mat(shirt)));
  body.add(mesh(new THREE.SphereGeometry(0.27, 24, 16).translate(0, 0.98, 0), mat(skin)));
  body.add(mesh(new THREE.SphereGeometry(0.29, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55).translate(0, 1.02, -0.03), mat(['#2A1F1A', '#5A3A28', '#1E1B2A'][Math.abs(Math.round(z * 5)) % 3], { rough: .5 })));
  for (const s of [-1, 1]) body.add(mesh(new THREE.SphereGeometry(0.03, 8, 6).translate(0.24, 1.0, s * 0.09), mat('#1E1B2A', { rough: .2 })));
  const legs = [];
  for (const s of [-1, 1]) {
    const L = new THREE.Group(); L.position.set(0, by + 0.12, s * 0.1);
    L.add(mesh(new THREE.CapsuleGeometry(0.075, sit ? 0.18 : 0.36, 6, 10).translate(0, sit ? -0.12 : -0.26, 0), mat('#3B3552')));
    if (sit) L.rotation.z = Math.PI / 2;
    g.add(L); legs.push(L);
  }
  g.position.set(x, sit ? 0.66 - 0.48 + 0.1 : y, z); g.rotation.y = rot; K.add(g);
  const ph = x * 1.7 + z;
  hook(K, t => {
    body.scale.y = 1 + 0.025 * Math.sin(t * 3 + ph);   // 呼吸
    if (pose === 'walk') { const w = Math.sin(t * 9 + ph); legs[0].rotation.z = 0.5 * w; legs[1].rotation.z = -0.5 * w; body.position.y = by + 0.04 * Math.abs(w); }
    if (sit) body.rotation.z = 0.06 * Math.sin(t * 1.4 + ph);   // 聊天时身子前后晃
  });
  return g;
}

// 院子里的几团灌木
export function bush(K) {
  K.begin('bushes', 'pop', 2.3, 0.45, 9.5, 0.1, -6);
  for (const [x, z, r, c] of [[11.0, -8.7, 0.75, '#4FA36A'], [10.3, -8.9, 0.55, '#68B97A'], [8.2, -3.0, 0.6, '#4FA36A'], [7.4, -9.0, 0.45, '#7FCBA8']])
    K.add(mesh(blob(r, Math.round(x * z), 0.12).scale(1, 0.8, 1).translate(x, 0.1 + r * 0.7, z), mat(c)));
}
