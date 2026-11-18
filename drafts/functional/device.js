// 功能主义候选图共用：一台原创收音机（机身、打孔喇叭网、滚花铝旋钮 + 刻度、橙色键、推子）、橡木桌面。
import { THREE, mesh } from '/drafts/_3d/lib.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const ORANGE = '#FF4A0E';
export const shell = () => new THREE.MeshPhysicalMaterial({ color: '#EEEAE2', roughness: 0.48, clearcoat: 0.25, clearcoatRoughness: 0.5 });
export const alu = () => new THREE.MeshStandardMaterial({ color: '#F2F3F5', metalness: 0.9, roughness: 0.38, envMapIntensity: 2.6 });

function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

export function oak() {
  const map = canvasTex(2048, 1024, (x, w, h) => {
    x.fillStyle = '#C8A47A'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { const y = Math.random() * h, a = 0.04 + Math.random() * 0.12; x.strokeStyle = Math.random() < .5 ? `rgba(120,80,40,${a})` : `rgba(240,210,170,${a})`; x.lineWidth = 1 + Math.random() * 5;
      x.beginPath(); x.moveTo(0, y); for (let px = 0; px <= w; px += 64) x.lineTo(px, y + Math.sin(px * 0.004 + i) * 10 + Math.sin(px * 0.017 + i * 3) * 3); x.stroke(); }
  });
  map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(2, 1);
  return new THREE.MeshStandardMaterial({ map, roughness: 0.55 });
}

// 打孔板：圆角矩形外形 + 一格一格的圆孔，挤出一点厚度（孔壁会有明暗）
function perforated(w, h, r, step, depth, mat) {
  const s = new THREE.Shape(); const rad = 0.12;
  s.moveTo(-w / 2 + rad, -h / 2); s.lineTo(w / 2 - rad, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + rad); s.lineTo(w / 2, h / 2 - rad); s.quadraticCurveTo(w / 2, h / 2, w / 2 - rad, h / 2);
  s.lineTo(-w / 2 + rad, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - rad); s.lineTo(-w / 2, -h / 2 + rad); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + rad, -h / 2);
  const nx = Math.floor((w - step) / step), ny = Math.floor((h - step) / step);
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const px = (i - nx / 2) * step, py = (j - ny / 2) * step; const p = new THREE.Path(); p.absarc(px, py, r, 0, Math.PI * 2, true); s.holes.push(p); }
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 10 });
  return mesh(g, mat);
}

// 滚花旋钮：侧面按角度做齿，顶面一圈刻线 + 指示槽
function knob(R, H, mat, angle) {
  const g = new THREE.CylinderGeometry(R, R, H, 360, 1);
  const p = g.attributes.position, n = 361 * 2;
  for (let i = 0; i < n; i++) { const vx = p.getX(i), vz = p.getZ(i), a = Math.atan2(vz, vx); const k = 1 + 0.018 * (Math.sin(a * 90) > 0 ? 1 : 0); p.setX(i, vx * k); p.setZ(i, vz * k); }
  g.computeVertexNormals();
  const grp = new THREE.Group(); const body = mesh(g, mat); body.rotation.x = Math.PI / 2; grp.add(body);
  // 顶面：微微下凹的一块浅色铝 + 指示槽
  const cap = mesh(new THREE.CylinderGeometry(R * 0.86, R * 0.86, 0.02, 128), new THREE.MeshStandardMaterial({ color: '#F4F5F7', metalness: 0.9, roughness: 0.3, envMapIntensity: 2.6 })); cap.rotation.x = Math.PI / 2; cap.position.z = H / 2 + 0.002; grp.add(cap);
  const notch = mesh(new THREE.BoxGeometry(0.06, R * 0.55, 0.03), new THREE.MeshStandardMaterial({ color: ORANGE, roughness: 0.4 }));
  notch.position.set(Math.sin(angle) * R * 0.5, Math.cos(angle) * R * 0.5, H / 2 + 0.015); notch.rotation.z = -angle; grp.add(notch);
  return grp;
}

export function radio({ knobAngle = -0.6, W = 6.4, Hh = 3.7, D = 2.2 } = {}) {
  const g0 = new THREE.Group(), g = new THREE.Group(); g.position.y = 0.08; g0.add(g);
  const body = mesh(new RoundedBoxGeometry(W, Hh, D, 8, 0.22), shell()); body.position.y = Hh / 2; g.add(body);
  const front = D / 2;
  // 喇叭网：左边一块铝打孔板，后面一层深灰
  const gw = 3.1, gh = 3.0;
  const back = mesh(new THREE.PlaneGeometry(gw - 0.1, gh - 0.1), new THREE.MeshStandardMaterial({ color: '#2B2B2B', roughness: 0.9 })); back.position.set(-W / 2 + 0.35 + gw / 2, Hh / 2, front + 0.004); g.add(back);
  const grille = perforated(gw, gh, 0.052, 0.17, 0.05, new THREE.MeshStandardMaterial({ color: '#E9E7E2', metalness: 0.55, roughness: 0.35 }));
  grille.position.set(-W / 2 + 0.35 + gw / 2, Hh / 2, front + 0.01); g.add(grille);
  // 刻度：印在面板上（一圈 0—10）
  const kx = 1.55, ky = Hh / 2 + 0.38, KR = 0.95;
  const dial = canvasTex(1024, 1024, (x, w, h) => {
    x.translate(w / 2, h / 2); x.fillStyle = '#2A2A28'; x.strokeStyle = '#2A2A28';
    for (let i = 0; i <= 40; i++) { const a = -Math.PI * 0.75 + i / 40 * Math.PI * 1.5; const big = i % 4 === 0; x.lineWidth = big ? 7 : 4;
      x.beginPath(); x.moveTo(Math.sin(a) * 400, -Math.cos(a) * 400); x.lineTo(Math.sin(a) * (big ? 460 : 440), -Math.cos(a) * (big ? 460 : 440)); x.stroke();
      if (big) { x.font = '500 52px GM'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(i / 4), Math.sin(a) * 500, -Math.cos(a) * 500); } }
  });
  const dm = new THREE.Mesh(new THREE.PlaneGeometry(KR * 2.45, KR * 2.45), new THREE.MeshStandardMaterial({ map: dial, transparent: true, roughness: 0.5 })); dm.position.set(kx, ky, front + 0.003); g.add(dm);
  const k = knob(KR * 0.72, 0.42, alu(), knobAngle); k.position.set(kx, ky, front + 0.21); g.add(k);
  // 橙色键 + 两个灰键 + 一条推子
  const btn = (col, x, y, r = 0.2) => { const b = mesh(new THREE.CylinderGeometry(r, r, 0.16, 64), new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.42, clearcoat: 0.3, clearcoatRoughness: 0.3 })); b.rotation.x = Math.PI / 2; b.position.set(x, y, front + 0.06); g.add(b); };
  btn(ORANGE, 0.75, 0.62, 0.24); btn('#BDBAB3', 1.45, 0.62); btn('#BDBAB3', 2.05, 0.62);
  const slot = mesh(new THREE.BoxGeometry(1.5, 0.07, 0.02), new THREE.MeshStandardMaterial({ color: '#2A2A28', roughness: 0.8 })); slot.position.set(1.45, 1.05, front + 0.006); g.add(slot);
  const lever = mesh(new RoundedBoxGeometry(0.16, 0.3, 0.16, 3, 0.04), new THREE.MeshPhysicalMaterial({ color: '#2A2A28', roughness: 0.5 })); lever.position.set(1.15, 1.05, front + 0.08); g.add(lever);
  // 脚
  for (const sx of [-1, 1]) { const f = mesh(new THREE.BoxGeometry(0.8, 0.08, D * 0.8), new THREE.MeshStandardMaterial({ color: '#3A3A38', roughness: 0.8 })); f.position.set(sx * (W / 2 - 0.7), 0.04, 0); g0.add(f); }
  return g0;
}
