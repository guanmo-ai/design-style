// 候选图用的 three.js 底座：渲染器（ACES、软阴影）+ 后期（GTAO 环境光遮蔽、辉光、移轴景深、暗角、颗粒）+ 低多边形小工具。
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
export { THREE, mergeGeometries };

// 可复现的随机数
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// 二维值噪声 + 分形
export function noise2(seed = 7) {
  const r = rng(seed), P = [];
  for (let i = 0; i < 512; i++) P.push(r());
  const h = (x, y) => P[((x * 73856093) ^ (y * 19349663)) & 511];
  const s = t => t * t * (3 - 2 * t);
  const n = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
    return a + (b - a) * s(xf) + (c - a) * s(yf) + (a - b - c + d) * s(xf) * s(yf);
  };
  return (x, y, oct = 4) => { let v = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { v += a * n(x * f, y * f); a *= 0.5; f *= 2.03; } return v; };
}

// 低多边形：拆成不共享顶点（每个面独立法线），再把顶点抖一下
export function lowpoly(geo, amount = 0, seed = 1) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  if (amount) {
    const r = rng(seed), p = g.attributes.position, map = new Map();
    for (let i = 0; i < p.count; i++) {
      const k = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
      if (!map.has(k)) map.set(k, [(r() - .5) * amount, (r() - .5) * amount, (r() - .5) * amount]);
      const d = map.get(k);
      p.setXYZ(i, p.getX(i) + d[0], p.getY(i) + d[1], p.getZ(i) + d[2]);
    }
  }
  g.computeVertexNormals();
  return g;
}

export const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: o.rough ?? 0.85, metalness: o.metal ?? 0, emissive: o.emissive ?? 0x000000, emissiveIntensity: o.ei ?? 1, transparent: !!o.opacity, opacity: o.opacity ?? 1, vertexColors: !!o.vc });

export function mesh(geo, material, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, material); m.castShadow = cast; m.receiveShadow = receive; return m;
}

// 移轴：按屏幕纵向离焦带的距离做高斯模糊（上下各一遍）
const TiltShift = {
  uniforms: { tDiffuse: { value: null }, res: { value: new THREE.Vector2() }, dir: { value: new THREE.Vector2(1, 0) }, focus: { value: 0.5 }, band: { value: 0.18 }, amount: { value: 3.0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 res; uniform vec2 dir; uniform float focus, band, amount; varying vec2 vUv;
  void main(){ float d = max(0., abs(vUv.y - focus) - band); float r = clamp(d * amount, 0., 1.) * 6.;
    vec4 c = vec4(0.); float w = 0.;
    for (int i = -6; i <= 6; i++) { float t = float(i); float k = exp(-t*t/(2.*max(r,.001)*max(r,.001)+.0001)); c += texture2D(tDiffuse, vUv + dir * t * r / res * 1.6) * k; w += k; }
    gl_FragColor = c / w; }`,
};
// 暗角 + 胶片颗粒 + 轻微调色
const Grade = {
  uniforms: { tDiffuse: { value: null }, vig: { value: 0.35 }, grain: { value: 0.035 }, lift: { value: new THREE.Vector3(0, 0, 0) }, seed: { value: 1.0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float vig, grain, seed; uniform vec3 lift; varying vec2 vUv;
  float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + seed) * 43758.5453); }
  void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 q = vUv - .5; float v = 1. - vig * dot(q, q) * 2.2;
    c.rgb = c.rgb * v + lift; c.rgb += (h(vUv * 1000.) - .5) * grain; gl_FragColor = c; }`,
};

export function setup({ W = 1920, H = 1080, pr = 2, bg = '#bcd', exposure = 1.0, tone = 'neutral' } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(pr); renderer.setSize(W, H);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = tone === 'aces' ? THREE.ACESFilmicToneMapping : THREE.NeutralToneMapping;   // Neutral 不洗色，适合玩具般的纯色 renderer.toneMappingExposure = exposure;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);
  renderer.domElement.style.cssText = `width:${W}px;height:${H}px;display:block`;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(bg);
  return { renderer, scene, W, H, pr };
}

export function finish(ctx, camera, { ao = true, aoRadius = 0.6, aoDist = 0.25, bloom = 0, bloomRadius = 0.5, bloomThreshold = 0.85, tilt = null, vig = 0.35, grain = 0.03, lift = [0, 0, 0] } = {}) {
  const { renderer, scene, W, H, pr } = ctx;
  const comp = new EffectComposer(renderer);
  comp.setPixelRatio(pr); comp.setSize(W, H);
  comp.addPass(new RenderPass(scene, camera));
  if (ao) {
    const g = new GTAOPass(scene, camera, W * pr, H * pr);
    g.updateGtaoMaterial({ radius: aoRadius, distanceExponent: 1.5, thickness: 1.0, scale: 1.0, samples: 16, distanceFallOff: 1.0 });
    g.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
    g.blendIntensity = aoDist * 4;
    comp.addPass(g);
  }
  if (bloom) comp.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), bloom, bloomRadius, bloomThreshold));
  comp.addPass(new OutputPass());
  if (tilt) {
    for (const d of [[1, 0], [0, 1]]) {
      const p = new ShaderPass(TiltShift);
      p.uniforms.res.value.set(W * pr, H * pr); p.uniforms.dir.value.set(...d);
      p.uniforms.focus.value = tilt.focus; p.uniforms.band.value = tilt.band; p.uniforms.amount.value = tilt.amount;
      comp.addPass(p);
    }
  }
  const gr = new ShaderPass(Grade); gr.uniforms.vig.value = vig; gr.uniforms.grain.value = grain; gr.uniforms.lift.value.set(...lift);
  comp.addPass(gr);
  comp.addPass(new SMAAPass(W * pr, H * pr));
  comp.render();
  window.__done = true;
}

// 平行光的阴影框收紧到场景范围，阴影才锐利
export function sun(scene, { color = '#fff4e0', intensity = 3, pos = [30, 40, 20], target = [0, 0, 0], size = 40, map = 4096, bias = -0.0004 } = {}) {
  const l = new THREE.DirectionalLight(color, intensity);
  l.position.set(...pos); l.target.position.set(...target);
  l.castShadow = true; l.shadow.mapSize.set(map, map); l.shadow.bias = bias; l.shadow.normalBias = 0.02;
  const c = l.shadow.camera; c.left = -size; c.right = size; c.top = size; c.bottom = -size; c.near = 1; c.far = 400;
  l.shadow.radius = 3;
  scene.add(l, l.target);
  return l;
}
