// 手作材质候选图的共用件：字体 → 3D 字、环境光、柔光背景、透光光斑。配合 lib.js 用。
import { THREE } from './lib.js';
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
export { TextGeometry };

const FONTS = {};
export async function font(file) {
  if (FONTS[file]) return FONTS[file];
  const json = await new Promise((ok, err) => new TTFLoader().load('/public/fonts/' + file, ok, undefined, err));
  return (FONTS[file] = new Font(json));
}
// 一个字一个几何体（居中到自己的包围盒底部中点），方便每个字单独摆、单独压扁
export function glyphGeo(f, ch, o) {
  const g = new TextGeometry(ch, { font: f, size: o.size, depth: o.depth, curveSegments: o.curve ?? 10, bevelEnabled: true, bevelThickness: o.bevelT ?? o.bevel, bevelSize: o.bevel, bevelSegments: o.bevelSeg ?? 8 });
  g.computeBoundingBox(); const b = g.boundingBox;
  g.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2);
  g.computeVertexNormals();
  return g;
}
export function envMap(renderer, intensity = 1) {
  const pm = new THREE.PMREMGenerator(renderer);
  const t = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  return t;
}
// 无缝背景：地面接一面向上弯的墙（摄影棚的 cyc）
export function cyc(color, { w = 60, d = 40, r = 8, h = 30 } = {}) {
  const shape = [];
  const pts = [];
  for (let i = 0; i <= 20; i++) pts.push(new THREE.Vector2(-d / 2 + i / 20 * (d / 2 - r), 0));
  for (let i = 1; i <= 24; i++) { const a = -Math.PI / 2 + i / 24 * Math.PI / 2; pts.push(new THREE.Vector2(-r * 0 + (d / 2 - r) + Math.cos(a) * r, r + Math.sin(a) * r)); }
  for (let i = 1; i <= 10; i++) pts.push(new THREE.Vector2(d / 2, r + i / 10 * h));
  // 沿 x 方向拉成面
  const pos = [], idx = [];
  const nx = 2;
  pts.forEach((p, j) => { for (let i = 0; i < nx; i++) pos.push(-w / 2 + i * w, p.y, -p.x); });
  for (let j = 0; j < pts.length - 1; j++) { const a = j * nx, b = (j + 1) * nx; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, roughness: 0.9, side: THREE.DoubleSide }));
  m.receiveShadow = true;
  return m;
}
// 透光光斑：贴在地上的径向渐变（加法混合），模拟光穿过彩色果冻落在地上
export function glowSpot(color, size, opacity = 0.6) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.35, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), new THREE.MeshBasicMaterial({ map: t, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.01;
  return m;
}
// 直接用 opentype.js 按 cmap 取字形轮廓（TTFLoader 对 CID 字体会丢字）→ THREE.Shape[]（字的左下角在原点附近，y 向上）
import opentype from 'three/addons/libs/opentype.module.js';
const OT = {};
export async function textShapes(file, text, size) {
  if (!OT[file]) OT[file] = opentype.parse(await (await fetch('/public/fonts/' + file)).arrayBuffer());
  const path = OT[file].getPath(text, 0, 0, size);
  const sp = new THREE.ShapePath();
  for (const c of path.commands) {
    if (c.type === 'M') sp.moveTo(c.x, -c.y); else if (c.type === 'L') sp.lineTo(c.x, -c.y);
    else if (c.type === 'Q') sp.quadraticCurveTo(c.x1, -c.y1, c.x, -c.y); else if (c.type === 'C') sp.bezierCurveTo(c.x1, -c.y1, c.x2, -c.y2, c.x, -c.y);
  }
  return sp.toShapes(true);
}
