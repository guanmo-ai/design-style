// Frutiger Aero 候选图共用：天空（渐变球 + 云 + 太阳）、用天空自己做的反射环境、亮绿山坡、会反光的水面、彩虹泡泡、亮面叶子。
import { THREE, mesh, noise2, rng } from '/drafts/_3d/lib.js';
import { Water } from 'three/addons/objects/Water.js';

export const SUN_DIR = new THREE.Vector3(0.36, 0.36, -0.86).normalize();

function canvasTex(w, h, draw, srgb = true) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; }

// 天空球：顶上深蓝 → 地平线浅青，太阳一侧更亮
export function skyDome({ top = '#0B4BD6', mid = '#2F93FF', hor = '#B8E8FF', sun = SUN_DIR } = {}) {
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: { top: { value: new THREE.Color(top) }, mid: { value: new THREE.Color(mid) }, hor: { value: new THREE.Color(hor) }, sd: { value: sun } },
    vertexShader: 'varying vec3 vd; void main(){ vd = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform vec3 top, mid, hor, sd; varying vec3 vd;
      void main(){ float y = max(vd.y, 0.0); vec3 c = mix(hor, mid, smoothstep(0.0, 0.18, y)); c = mix(c, top, smoothstep(0.18, 0.75, y));
        float s = max(dot(normalize(vd), sd), 0.0); c += vec3(1.0, 0.97, 0.88) * (pow(s, 600.0) * 6.0 + pow(s, 24.0) * 0.35 + pow(s, 4.0) * 0.12);
        if (vd.y < 0.0) c = mix(hor, vec3(0.25, 0.55, 0.2), smoothstep(0.0, 0.2, -vd.y));
        gl_FragColor = vec4(c, 1.0); }` });
  return new THREE.Mesh(new THREE.SphereGeometry(500, 64, 32), m);
}

export function cloudSprite(seed = 1) {
  return canvasTex(512, 256, (x, w, h) => { const r = rng(seed);
    for (let i = 0; i < 26; i++) { const cx = w * (0.18 + r() * 0.64), cy = h * (0.45 + (r() - .5) * 0.3), rr = h * (0.12 + r() * 0.22);
      const g = x.createRadialGradient(cx, cy - rr * 0.2, 0, cx, cy, rr); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.6, 'rgba(250,253,255,.6)'); g.addColorStop(1, 'rgba(235,245,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }
  });
}
export function clouds(scene, list) {
  for (const [x, y, z, s, seed] of list) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudSprite(seed), transparent: true, depthWrite: false, fog: false })); sp.position.set(x, y, z); sp.scale.set(s * 2, s, 1); scene.add(sp); }
}

// 反射环境：只用天空、太阳、绿地、几朵云做一个小场景，生成 PMREM —— 玻璃上映出的是蓝天和草地
export function skyEnv(renderer) {
  const s = new THREE.Scene(); s.add(skyDome());
  const g = new THREE.Mesh(new THREE.CircleGeometry(400, 64), new THREE.MeshBasicMaterial({ color: '#3DAF2E' })); g.rotation.x = -Math.PI / 2; g.position.y = -20; s.add(g);
  const sunM = new THREE.Mesh(new THREE.SphereGeometry(18, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(8, 7.6, 6.6) })); sunM.position.copy(SUN_DIR).multiplyScalar(300); s.add(sunM);
  for (const [x, y, z] of [[-120, 60, -200], [150, 90, -160], [0, 140, 120], [-180, 40, 100]]) { const c = new THREE.Mesh(new THREE.SphereGeometry(40, 16, 12), new THREE.MeshBasicMaterial({ color: '#ffffff' })); c.position.set(x, y, z); c.scale.set(2, 0.6, 1); s.add(c); }
  // 头顶前方一块大柔光板：玻璃和泡泡顶上那道“窗户”高光
  const box = new THREE.Mesh(new THREE.PlaneGeometry(260, 90), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 3.2, 3.2), side: THREE.DoubleSide })); box.position.set(0, 170, 140); box.lookAt(0, 0, 0); s.add(box);
  const pm = new THREE.PMREMGenerator(renderer); return pm.fromScene(s, 0.02).texture;
}

// 山坡：一个大鼓包 + 噪声，颜色从坡顶的亮绿到坡脚的深绿
export function hill({ cx = -14, cz = -46, r = 52, h = 13, seed = 3, w = 160, d = 120 } = {}) {
  const geo = new THREE.PlaneGeometry(w, d, 220, 160); geo.rotateX(-Math.PI / 2);
  const n = noise2(seed), p = geo.attributes.position, col = [];
  const c1 = new THREE.Color('#A6F040'), c2 = new THREE.Color('#48C52C'), c3 = new THREE.Color('#1E8A24');
  for (let i = 0; i < p.count; i++) { const x = p.getX(i) + cx, z = p.getZ(i) + cz; const dd = Math.hypot((x - cx) / r, (z - cz) / (r * 0.7));
    const y = h * Math.exp(-dd * dd * 1.6) + n(x * 0.03, z * 0.03, 3) * 2.2 - 2.4; p.setXYZ(i, x, y, z);
    const t = THREE.MathUtils.clamp((y + 2) / (h + 1), 0, 1); const c = c3.clone().lerp(c2, Math.min(1, t * 2)).lerp(c1, Math.max(0, t * 1.4 - 0.4)); col.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
  return mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72 }), { cast: false });
}

// 水面：three 的 Water（反射 + 法线扰动），法线贴图用噪声现做
export function water(scene, { size = 400, color = '#0A6FB8', distortion = 2.4, time = 3 } = {}) {
  const N = 512, n = noise2(19);
  const normals = canvasTex(N, N, (x) => { const img = x.createImageData(N, N), H = (i, j) => n(i / 48, j / 48, 4) + 0.35 * n(i / 13, j / 13, 2);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const dx = H((i + 1) % N, j) - H((i - 1 + N) % N, j), dy = H(i, (j + 1) % N) - H(i, (j - 1 + N) % N);
      const v = new THREE.Vector3(-dx * 6, -dy * 6, 1).normalize(), k = (j * N + i) * 4; img.data[k] = (v.x * .5 + .5) * 255; img.data[k + 1] = (v.y * .5 + .5) * 255; img.data[k + 2] = (v.z * .5 + .5) * 255; img.data[k + 3] = 255; }
    x.putImageData(img, 0, 0); }, false);
  normals.wrapS = normals.wrapT = THREE.RepeatWrapping;
  const w = new Water(new THREE.PlaneGeometry(size, size), { textureWidth: 1024, textureHeight: 1024, waterNormals: normals, sunDirection: SUN_DIR.clone(), sunColor: 0xffffff, waterColor: new THREE.Color(color), distortionScale: distortion, alpha: 1 });
  w.rotation.x = -Math.PI / 2; w.material.uniforms.time.value = time; w.material.uniforms.size.value = 6;
  scene.add(w); return w;
}

// 泡泡：薄膜（透射 + 彩虹干涉 + 清漆），越大越晃
export function bubbleMat() {
  return new THREE.MeshPhysicalMaterial({ color: '#ffffff', transmission: 1, thickness: 0.02, roughness: 0, ior: 1.05, iridescence: 1, iridescenceIOR: 1.33, iridescenceThicknessRange: [180, 620], clearcoat: 1, clearcoatRoughness: 0, specularIntensity: 1, envMapIntensity: 1.4, transparent: true });
}
export function bubbles(scene, list, mat = bubbleMat()) {
  const geo = new THREE.SphereGeometry(1, 64, 48);
  for (const [x, y, z, r] of list) { const b = new THREE.Mesh(geo, mat); b.position.set(x, y, z); b.scale.setScalar(r); scene.add(b); }
}

// 亮面叶子：一片弯起来的椭圆叶
export function leaf(len = 2, color = '#5BD12E') {
  const s = new THREE.Shape(); s.moveTo(0, 0); s.bezierCurveTo(len * 0.25, len * 0.22, len * 0.75, len * 0.22, len, 0); s.bezierCurveTo(len * 0.75, -len * 0.22, len * 0.25, -len * 0.22, 0, 0);
  const g = new THREE.ShapeGeometry(s, 24); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, -Math.pow(y / (len * 0.2), 2) * len * 0.06 + Math.sin(x / len * Math.PI) * len * 0.08); }
  g.computeVertexNormals();
  return mesh(g, new THREE.MeshPhysicalMaterial({ color, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.05, side: THREE.DoubleSide, sheen: 0.4, sheenColor: '#E8FFB0' }));
}

// Aero 的招牌光泽：叠在物体正面的上半截，一块上亮下淡的白（边缘利落），底部再透一点反光
export function glossMat({ cut = 0.5, top = 0.62, bottom = 0.18, wave = 0.04 } = {}) {
  return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    uniforms: { zMax: { value: 1 }, yMin: { value: 0 }, yMax: { value: 1 }, xMin: { value: 0 }, xMax: { value: 1 }, cut: { value: cut }, top: { value: top }, bottom: { value: bottom }, wave: { value: wave } },
    vertexShader: 'varying vec3 vP; varying vec3 vN; void main(){ vP = position; vN = normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform float zMax, yMin, yMax, xMin, xMax, cut, top, bottom, wave; varying vec3 vP; varying vec3 vN;
      void main(){ if (vN.z < 0.6 || vP.z < zMax - 0.03) discard; float y = (vP.y - yMin) / (yMax - yMin), x = (vP.x - xMin) / (xMax - xMin);
        float edge = cut + wave * sin(x * 3.14159);
        float a = step(edge, y) * mix(top * 0.35, top, smoothstep(edge, 1.0, y));
        a += bottom * (1.0 - smoothstep(0.0, 0.22, y));
        gl_FragColor = vec4(1.0, 1.0, 1.0, a); }` });
}
export function addGloss(meshObj, opts) {
  const g = meshObj.geometry; g.computeBoundingBox(); const b = g.boundingBox, m = glossMat(opts);
  m.uniforms.zMax.value = b.max.z; m.uniforms.yMin.value = b.min.y; m.uniforms.yMax.value = b.max.y; m.uniforms.xMin.value = b.min.x; m.uniforms.xMax.value = b.max.x;
  const o = new THREE.Mesh(g, m); o.renderOrder = 2; meshObj.add(o); return o;
}
