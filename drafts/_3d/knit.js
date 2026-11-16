// 针织：每一针 = 两条斜放的长椭球拼成的 V（平针的正面），用 InstancedMesh 一次画完。
// 一格 = 一针；针比行宽（常见密度 22 针 × 30 行 / 10 cm → 宽 : 高 ≈ 1.3 : 1），所以画图表的格子要用 4 : 3。
import { THREE } from './lib.js';

// 毛线的捻纹：斜条纹（明暗 + 凹凸）
export function plyTexture() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, 64, 256);
  for (let i = -8; i < 24; i++) { x.save(); x.translate(0, i * 16); x.transform(1, -0.9, 0, 1, 0, 0);
    const g = x.createLinearGradient(0, 0, 0, 16); g.addColorStop(0, 'rgba(0,0,0,.0)'); g.addColorStop(.5, 'rgba(0,0,0,.32)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 16); x.restore(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
export function yarnMaterial() {
  const t = plyTexture();
  return new THREE.MeshPhysicalMaterial({ color: '#ffffff', map: t, bumpMap: t, bumpScale: 2.2, roughness: .92, sheen: 1, sheenColor: '#ffffff', sheenRoughness: .75 });
}
// cols × rows 针；colorAt(c, r) → 颜色或 null（没织到的地方）；surf(c, r) → [x, y, z] 每一针的位置（可以弯）
export function knitPanel({ cols, rows, colorAt, surf, dx = 0.13, dy = 0.1, mat }) {
  const legGeo = new THREE.SphereGeometry(1, 18, 12);
  const n = cols * rows * 2;
  const im = new THREE.InstancedMesh(legGeo, mat, n);
  im.castShadow = true; im.receiveShadow = true;
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S = new THREE.Vector3(), P = new THREE.Vector3(), col = new THREE.Color();
  let k = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const hex = colorAt(c, r); if (!hex) continue;
    const [x, y, z] = surf(c, r);
    for (const s of [-1, 1]) {
      // 一条腿：长轴沿 y，往中间斜 28°，稍微往外鼓
      P.set(x + s * dx * 0.24, y + dy * 0.12, z);
      E.set(0.18, s * 0.25, s * 0.5); Q.setFromEuler(E);
      S.set(dx * 0.27, dy * 0.86, dx * 0.2);
      M.compose(P, Q, S); im.setMatrixAt(k, M);
      col.set(hex); col.offsetHSL(0, 0, (Math.sin(c * 12.9 + r * 78.2 + s) * 43758.5 % 1) * 0.04 - 0.02);
      im.setColorAt(k, col); k++;
    }
  }
  im.count = k;
  im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
  return im;
}
// 毛线团：一颗球 + 几十圈绕在上面的线
export function yarnBall(color, r, mat, seed = 3) {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(r * .97, 48, 32), mat.clone()); core.material.color = new THREE.Color(color); core.material.map = null; core.material.bumpMap = null; g.add(core);
  let s = seed; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 130; i++) {
    const ax = new THREE.Vector3(rnd() - .5, rnd() - .5, rnd() - .5).normalize();
    const u = new THREE.Vector3(1, 0, 0).cross(ax).normalize(); const v = ax.clone().cross(u);
    const pts = []; const rr = r * (1 + rnd() * .02);
    for (let j = 0; j <= 64; j++) { const a = j / 64 * Math.PI * 2; pts.push(u.clone().multiplyScalar(Math.cos(a) * rr).add(v.clone().multiplyScalar(Math.sin(a) * rr))); }
    const tg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 96, r * .05, 6, true);
    const m = new THREE.Mesh(tg, mat); m.castShadow = true; m.receiveShadow = true;
    const c = new THREE.Color(color); c.offsetHSL(0, 0, (rnd() - .5) * .06);
    m.material = mat.clone(); m.material.color = c; m.material.map = mat.map.clone(); m.material.map.repeat.set(30, 1); m.material.map.needsUpdate = true;
    g.add(m);
  }
  return g;
}
