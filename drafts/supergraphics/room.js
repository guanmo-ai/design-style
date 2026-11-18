// 超级平面候选图共用：两层高的白房子（楼梯 + 回廊 + 栏板 + 门洞 + 开窗的右墙）、四色带画布、比例尺小人、光柱。
import { THREE, mesh } from '/drafts/_3d/lib.js';

export const BAND = ['#1B4DFF', '#FF2D1A', '#FF8A00', '#FFC400'];

function box(w, h, d, x, y, z, m) { const o = mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); return o; }

export function buildRoom(scene, { wall, floor, ceilingY = 7.6 }) {
  const g = new THREE.Group();
  // 地面、天花板
  g.add(box(16, 0.2, 16, 2.5, -0.1, 0.5, floor));
  g.add(box(16, 0.2, 16, 2.5, ceilingY + 0.1, 0.5, wall));
  // 左墙
  g.add(box(0.3, ceilingY, 16, -4.15, ceilingY / 2, 0.5, wall));
  // 后墙（带门洞）：用形状挖洞
  { const s = new THREE.Shape(); s.moveTo(-4.3, 0); s.lineTo(10.5, 0); s.lineTo(10.5, ceilingY); s.lineTo(-4.3, ceilingY); s.lineTo(-4.3, 0);
    const h = new THREE.Path(); h.moveTo(6.2, 3.0); h.lineTo(7.8, 3.0); h.lineTo(7.8, 5.6); h.lineTo(6.2, 5.6); h.lineTo(6.2, 3.0); s.holes.push(h);
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: false }); const o = mesh(geo, wall); o.position.z = -6.3; g.add(o);
    // 门外：亮的
    const out = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ color: '#FFF3DE' })); out.position.set(7.0, 4.3, -7.2); g.add(out);
    // 门里的地面延伸
    g.add(box(2, 0.2, 1.5, 7.0, 2.9, -7, floor));
  }
  // 楼梯：贴着后墙，从左下 x=-1.2 往右爬到 x=4.4（高 3.0），15 级；侧面朝镜头，露出锯齿
  const N = 15, H = 3.0, rise = H / N, run = 5.6 / N, d = 1.5;
  for (let i = 0; i < N; i++) { const top = (i + 1) * rise; g.add(box(run + 0.002, top, d, -1.2 + (i + 0.5) * run, top / 2, -6 + d / 2, wall)); }
  // 平台
  g.add(box(6.2, H, d, 4.4 + 3.1, H / 2, -6 + d / 2, wall));
  // 细栏杆：一根斜扶手 + 平台扶手（深色钢）
  { const steel = new THREE.MeshStandardMaterial({ color: '#1C1C1C', roughness: 0.4, metalness: 0.6 });
    const z = -6 + d - 0.06, a0 = new THREE.Vector3(-1.2, 0.95, z), a1 = new THREE.Vector3(4.4, H + 0.95, z);
    const L = a0.distanceTo(a1), r = mesh(new THREE.CylinderGeometry(0.025, 0.025, L, 10), steel);
    r.position.copy(a0).add(a1).multiplyScalar(0.5); r.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), a1.clone().sub(a0).normalize()); g.add(r);
    const r2 = mesh(new THREE.CylinderGeometry(0.025, 0.025, 6, 10), steel); r2.rotation.z = Math.PI / 2; r2.position.set(7.4, H + 0.95, z); g.add(r2);
    for (let i = 0; i <= 10; i++) { const t = i / 10, p = a0.clone().lerp(a1, t); const post = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.95, 6), steel); post.position.set(p.x, p.y - 0.475, z); g.add(post); }
    for (let i = 0; i <= 8; i++) { const post = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.95, 6), steel); post.position.set(4.4 + i * 0.75, H + 0.475, z); g.add(post); } }
  // 两根柱子 + 一道梁：离镜头近，字和色带在它们身上断开
  for (const [x, z] of [[-1.6, 0.4], [3.3, -1.2]]) g.add(box(0.55, ceilingY, 0.55, x, ceilingY / 2, z, wall));
  g.add(box(16, 0.55, 0.5, 2.5, ceilingY - 0.275, -1.2, wall));
  // 右墙：开三扇高窗（中间一道横棂），只为了投窗影
  { const s = new THREE.Shape(); s.moveTo(-9, -1); s.lineTo(10, -1); s.lineTo(10, 10); s.lineTo(-9, 10); s.lineTo(-9, -1);
    for (const [z0, z1] of [[-5.2, -3.1], [-2.4, -0.3], [0.4, 2.5], [3.2, 5.3]]) for (const [y0, y1] of [[0.5, 3.4], [3.6, 6.6]]) {
      const h = new THREE.Path(); h.moveTo(z0, y0); h.lineTo(z1, y0); h.lineTo(z1, y1); h.lineTo(z0, y1); h.lineTo(z0, y0); s.holes.push(h); }
    const o = new THREE.Mesh(new THREE.ShapeGeometry(s), new THREE.MeshBasicMaterial({ color: '#000', side: THREE.DoubleSide, colorWrite: false, depthWrite: false }));
    o.castShadow = true; o.rotation.y = -Math.PI / 2; o.position.x = 10.4; g.add(o);
    const sh = new THREE.Mesh(new THREE.ShapeGeometry(s), new THREE.MeshDepthMaterial()); }
  scene.add(g);
  return g;
}

// 四条色带：一组同心大圆弧 + 往右拉出的直线（Sea Ranch 式），画在投影机的画面里
export function bandsCanvas({ W = 4096, H = 3072 } = {}) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const cx = W * 0.78, cy = H * 1.02, bw = H * 0.085, gap = H * 0.012, r0 = H * 0.52;
  BAND.forEach((col, i) => {
    const r = r0 + (BAND.length - 1 - i) * (bw + gap);
    x.strokeStyle = col; x.lineWidth = bw; x.lineCap = 'butt';
    x.beginPath(); x.arc(cx, cy, r + bw / 2, Math.PI, Math.PI * 1.5); x.lineTo(W * 1.1, cy - r - bw / 2);
    x.moveTo(cx - r - bw / 2, cy); x.lineTo(cx - r - bw / 2, H * 1.2); x.stroke();
  });
  // 一颗大黑圆点，压在色带上
  x.fillStyle = '#121212'; x.beginPath(); x.arc(W * 0.17, H * 0.2, H * 0.085, 0, Math.PI * 2); x.fill();
  return c;
}

// 比例尺小人：深色，几段胶囊
export function person(p, ry = 0, s = 1) {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: '#2A2622', roughness: 0.8 });
  const cap = (r, l, x, y, z, rz = 0) => { const o = mesh(new THREE.CapsuleGeometry(r, l, 6, 12), m); o.position.set(x, y, z); o.rotation.z = rz; g.add(o); };
  cap(0.07, 0.7, -0.09, 0.45, 0.02, 0.04); cap(0.07, 0.7, 0.09, 0.45, -0.04, -0.06);
  cap(0.17, 0.42, 0, 1.17, 0); cap(0.05, 0.55, -0.24, 1.12, 0, 0.12); cap(0.05, 0.55, 0.24, 1.12, 0, -0.1);
  const hd = mesh(new THREE.SphereGeometry(0.11, 20, 14), m); hd.position.set(0, 1.62, 0); g.add(hd);
  g.position.set(...p); g.rotation.y = ry; g.scale.setScalar(s); return g;
}

// 光柱：从每扇窗沿太阳方向拉出的长棱柱，加法混合，越远越淡
export function beams(scene, light, { strength = 0.05 } = {}) {
  const dir = light.position.clone().sub(light.target.position).normalize().multiplyScalar(-1);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { s: { value: strength } },
    vertexShader: 'attribute float t; varying float vt; void main(){ vt=t; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform float s; varying float vt; void main(){ float a = s * (1.0 - vt) * smoothstep(0.0, 0.08, vt); gl_FragColor = vec4(vec3(1.0, 0.86, 0.66) * a, 1.0); }',
  });
  for (const [z0, z1] of [[-5.2, -3.1], [-2.4, -0.3], [0.4, 2.5], [3.2, 5.3]]) for (const [y0, y1] of [[0.5, 3.4], [3.6, 6.6]]) {
    const L = 16, pts = [[z0, y0], [z1, y0], [z1, y1], [z0, y1]], pos = [], t = [], idx = [];
    for (const [z, y] of pts) { pos.push(10.4, y, z); t.push(0); const e = new THREE.Vector3(10.4, y, z).addScaledVector(dir, L); pos.push(e.x, e.y, e.z); t.push(1); }
    for (let i = 0; i < 4; i++) { const a = i * 2, b = ((i + 1) % 4) * 2; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('t', new THREE.Float32BufferAttribute(t, 1)); geo.setIndex(idx);
    scene.add(new THREE.Mesh(geo, mat));
  }
}
