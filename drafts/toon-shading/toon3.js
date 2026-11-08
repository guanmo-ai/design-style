// toon3.js — 卡通渲染 v3：真模型 + 真管线（three.js + @pixiv/three-vrm 的 MToon）
// 模型：VRoid Studio 早期以 CC0 发布的样例角色（AvatarSample_F「ヴィータ」），见 models/README.md
// 同一个模型渲染四遍，每遍一张缓冲：
//   ① 灰模（普通的兰伯特光照，看得出“这是 3D”）
//   ② 两阶光影（MToon：亮色 / 阴影色两色，交界很硬；关掉描边和边缘光）
//   ③ + 描边（MToon 的背面外扩描边）
//   ④ + 撮影（边缘光、泛光、渐变叠色、光粒）
// 最后一个合成着色器按斜条把四遍拼在一起，背景是游戏立绘式的天空
import * as THREE from 'three';
import { GLTFLoader } from './vendor/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

export async function loadVRM(url) {
  const loader = new GLTFLoader(); loader.register(p => new VRMLoaderPlugin(p));
  const g = await loader.loadAsync(url);
  const vrm = g.userData.vrm; VRMUtils.rotateVRM0(vrm);
  vrm.scene.traverse(o => { if (o.isMesh) o.frustumCulled = false; });
  return vrm;
}

const D = Math.PI / 180;
// 姿势：骨骼名 → [x, y, z]（度）
export const POSES = {
  wave: {
    hips: [0, 8, 0], spine: [-2, 0, 3], chest: [0, -4, 2], neck: [0, -6, -4], head: [6, -10, -8],
    leftUpperArm: [0, 0, 64], leftLowerArm: [0, -14, 0], leftHand: [0, 0, 6],
    rightUpperArm: [0, 40, -70], rightLowerArm: [0, 0, 120], rightHand: [0, 0, -10],
    leftUpperLeg: [-4, 0, 3], leftLowerLeg: [10, 0, 0], rightUpperLeg: [6, 0, -3], rightLowerLeg: [2, 0, 0],
  },
  idle: {
    hips: [0, 4, 0], spine: [-2, 0, 0], neck: [0, -4, 0], head: [4, -6, -6],
    leftUpperArm: [0, 0, 68], leftLowerArm: [0, -12, 0], rightUpperArm: [0, 0, -68], rightLowerArm: [0, 12, 0],
  },
  peace: {
    hips: [0, 10, 0], spine: [-3, 0, 2], chest: [0, -6, 0], neck: [0, -6, -4], head: [6, -10, -8],
    leftUpperArm: [0, 0, 64], leftLowerArm: [0, -14, 0], leftHand: [0, 0, 6],
    rightUpperArm: [0, 55, -72], rightLowerArm: [0, 25, 128], rightHand: [0, 0, 0],
    rightRingProximal: [0, 0, -80], rightRingIntermediate: [0, 0, -90], rightRingDistal: [0, 0, -60],
    rightLittleProximal: [0, 0, -80], rightLittleIntermediate: [0, 0, -90], rightLittleDistal: [0, 0, -60],
    rightIndexProximal: [0, 0, 6], rightMiddleProximal: [0, 0, -6],
    leftUpperLeg: [-3, 0, 2], rightUpperLeg: [4, 0, -4], rightLowerLeg: [6, 0, 0],
  },
};
export function pose(vrm, p, expr = {}) {
  const h = vrm.humanoid;
  for (const [k, [x, y, z]] of Object.entries(p)) { const b = h.getNormalizedBoneNode(k); if (b) b.rotation.set(x * D, y * D, z * D); }
  const em = vrm.expressionManager;
  if (em) { for (const k of ['happy', 'relaxed', 'surprised', 'aa', 'blink', 'angry', 'sad']) em.setValue(k, 0); for (const [k, v] of Object.entries(expr)) em.setValue(k, v); }
  // 让头发、裙子的弹簧骨骼先“荡”一会儿：给一阵风，停在被吹起来的样子
  if (vrm.springBoneManager) {
    for (const j of vrm.springBoneManager.joints) { j.settings.gravityDir = new THREE.Vector3(.55, -.6, -.35).normalize(); j.settings.gravityPower = Math.max(j.settings.gravityPower, .35); }
  }
  for (let i = 0; i < 120; i++) vrm.update(1 / 60);
}

// 收集材质：原样（MToon）+ 描边材质
function collect(vrm) {
  const list = [];
  vrm.scene.traverse(o => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    list.push({ mesh: o, orig: o.material, mats });
  });
  return list;
}

// 第一步“固有色”：只有贴图、没有光（保留透明裁切）
const flatCache = new Map();
function greyOf(m) {
  if (flatCache.has(m)) return flatCache.get(m);
  const g = new THREE.MeshBasicMaterial({ color: m.color ? m.color.clone() : 0xffffff, map: m.map || null, side: m.side, transparent: m.transparent, alphaTest: m.alphaTest || (m.map ? .5 : 0) });
  g.visible = !m.isOutline;
  flatCache.set(m, g); return g;
}

// 设置成第几步
function stage(list, s, opt) {
  for (const it of list) {
    if (s === 1) { it.mesh.material = Array.isArray(it.orig) ? it.orig.map(greyOf) : greyOf(it.orig); continue; }
    it.mesh.material = it.orig;
    for (const m of it.mats) {
      if (!m.isMToonMaterial) continue;
      if (m.__o === undefined) m.__o = { rim: m.rimLightingMixFactor, prc: m.parametricRimColorFactor.clone(), ow: m.outlineWidthFactor, toony: m.shadingToonyFactor, shift: m.shadingShiftFactor, gi: m.giEqualizationFactor };
      m.visible = m.isOutline ? s >= 3 : true;
      m.shadingToonyFactor = opt.toony ?? .95; m.shadingShiftFactor = opt.shift ?? -.05;
      if (s >= 4) { m.rimLightingMixFactor = 1; m.parametricRimColorFactor.set(opt.rimColor || 0xffe0f0); m.parametricRimFresnelPowerFactor = opt.rimPower ?? 4.5; m.parametricRimLiftFactor = .05; }
      else { m.parametricRimColorFactor.set(0x000000); }
      if (!m.__col) m.__col = m.color.clone();
      m.color.copy(m.__col); if (opt.hairTint && /hair/i.test(m.name)) m.color.set(opt.hairTint);
    }
  }
}

const FS_BLUR = `
  uniform sampler2D src; uniform vec2 dir; varying vec2 vUv;
  void main(){ vec4 s = vec4(0.); float w[7]; w[0]=.1964;w[1]=.1747;w[2]=.1210;w[3]=.0656;w[4]=.0277;w[5]=.0091;w[6]=.0024;
    s += texture2D(src, vUv) * w[0];
    for (int i = 1; i < 7; i++){ s += texture2D(src, vUv + dir * float(i)) * w[i]; s += texture2D(src, vUv - dir * float(i)) * w[i]; }
    gl_FragColor = s; }`;
const FS_BRIGHT = `uniform sampler2D src; uniform float thr; varying vec2 vUv;
  void main(){ vec4 c = texture2D(src, vUv); float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(c.rgb * smoothstep(thr, thr + .35, l) * c.a, c.a); }`;
const FS_COMP = `
  uniform sampler2D s1, s2, s3, s4, bl, bl2, txt; uniform vec2 res; uniform float px, stageAll, bandX, bandX2, txtOn, seed;
  uniform vec4 strips; uniform vec2 sdir;
  uniform vec3 sky0, sky1, sky2, sky3, halo, gradA, gradB; uniform vec2 haloC; uniform float haloR;
  varying vec2 vUv;
  float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)) + seed) * 43758.5453); }
  vec3 lin(vec3 c){ return pow(c, vec3(2.2)); }
  vec3 splash(vec2 cpx){
    vec2 f = cpx / (res / px);
    vec3 c = mix(sky0, sky1, smoothstep(.0, .45, f.y));
    c = mix(c, sky2, smoothstep(.4, .78, f.y)); c = mix(c, sky3, smoothstep(.75, 1., f.y));
    float d = length(cpx - haloC);
    c = mix(c, halo, smoothstep(haloR * 1.2, haloR * .1, d) * .6);
    c = mix(c, halo, smoothstep(2., 0., abs(d - haloR)) * .55);
    c = mix(c, halo, smoothstep(1.2, 0., abs(d - haloR * 1.22)) * .3);
    float ray = sin((cpx.x * .8 + cpx.y * .45) * .012) * .5 + .5; c += vec3(1., .9, .85) * smoothstep(.86, 1., ray) * .07 * (1. - f.y);
    if (txtOn > 0.) { vec4 t = texture2D(txt, vec2(f.x, 1. - f.y)); c = mix(c, t.rgb, t.a); }
    return c;
  }
  vec3 viewport(vec2 cpx){
    vec3 c = mix(vec3(.14, .145, .17), vec3(.2, .21, .24), 1. - vUv.y);
    vec2 g = abs(fract(cpx / 48.) - .5) * 48.; c += smoothstep(1., 0., min(g.x, g.y)) * .045;
    vec2 g2 = abs(fract(cpx / 240.) - .5) * 240.; c += smoothstep(1., 0., min(g2.x, g2.y)) * .05;
    return c;
  }
  void main(){
    vec2 cpx = vec2(vUv.x * res.x, (1. - vUv.y) * res.y) / px;
    float sx = dot(cpx - strips.xy, sdir);
    float st = stageAll > 0. ? stageAll : ((cpx.x < bandX || cpx.x > bandX2) ? strips.w : clamp(floor(sx / strips.z) + 1., 1., strips.w));
    vec4 a = st < 1.5 ? texture2D(s1, vUv) : st < 2.5 ? texture2D(s2, vUv) : st < 3.5 ? texture2D(s3, vUv) : texture2D(s4, vUv);
    vec3 bg = st < 1.5 ? viewport(cpx) : lin(splash(cpx));
    if (st < 1.5) bg = lin(bg);
    vec3 col = mix(bg, a.rgb / max(a.a, 1e-4), a.a);
    if (st > 3.5) {
      // 撮影：泛光“滤色”叠上去 + 渐变叠色（柔光）+ 光粒
      vec3 b = texture2D(bl, vUv).rgb * .55 + texture2D(bl2, vUv).rgb * .45;
      col = 1. - (1. - col) * (1. - b);
      vec2 f = cpx / (res / px);
      vec3 g = mix(gradA, gradB, clamp(f.x * .6 + f.y * .6 - .1, 0., 1.));
      vec3 c2 = pow(col, vec3(1. / 2.2));
      vec3 sl = mix(2. * c2 * g, 1. - 2. * (1. - c2) * (1. - g), step(vec3(.5), c2));
      col = pow(mix(c2, sl, .22), vec3(2.2));
      for (int i = 0; i < 22; i++) { float fi = float(i); vec2 c = vec2(h21(vec2(fi, 1.3)), h21(vec2(fi, 7.1))) * (res / px); float r = 3. + 22. * pow(h21(vec2(fi, 3.3)), 3.); col += vec3(1., .9, .95) * smoothstep(r, r * .65, length(cpx - c)) * (.03 + .06 * h21(vec2(fi, 9.))); }
      vec2 cell = floor(cpx / 26.); if (h21(cell) > .97) { vec2 cc = (cell + .5) * 26.; vec2 dp = abs(cpx - cc); float sz = 2. + 6. * h21(cell + 2.); col += (smoothstep(1.2, 0., dp.x) * smoothstep(sz, 0., dp.y) + smoothstep(1.2, 0., dp.y) * smoothstep(sz, 0., dp.x)) * .7; }
    }
    col = pow(clamp(col, 0., 1.), vec3(1. / 2.2));
    if (stageAll <= 0.) {
      float fx = fract(sx / strips.z) * strips.z; float edge = min(fx, strips.z - fx);
      if (cpx.x > bandX && cpx.x < bandX2 && sx > strips.z * .5 && sx < strips.z * (strips.w - .5)) col = mix(col, vec3(1.), smoothstep(1.6, .3, edge) * .9);
      if (sx < strips.z * (strips.w - 1.)) col = mix(col, vec3(1.), max(smoothstep(1.4, .3, abs(cpx.x - bandX)), smoothstep(1.4, .3, abs(cpx.x - bandX2))) * .9 * step(bandX, cpx.x) * step(cpx.x, bandX2 + 1.));
    }
    col += (h21(vUv * res) - .5) * .008;
    gl_FragColor = vec4(col, 1.);
  }`;
const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;

function quad(mat) { const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); const s = new THREE.Scene(); s.add(m); return s; }
const hexL = h => { const c = new THREE.Color(h); return new THREE.Vector3(Math.pow(c.r, 1), Math.pow(c.g, 1), Math.pow(c.b, 1)); };

function nameTexture(w, h, n) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  if (n) { g.font = `900 ${n.size}px Unbounded`; g.lineWidth = Math.max(1.5, n.size / 110); g.strokeStyle = 'rgba(255,255,255,.42)'; g.strokeText(n.text, n.x, n.y); g.fillStyle = 'rgba(255,255,255,.07)'; g.fillText(n.text, n.x, n.y); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t;
}

// 渲染一张：canvas（CSS 尺寸 cw×ch），vrm，相机参数，合成参数
export async function render(canvas, vrm, o) {
  const cw = o.width, ch = o.height, dpr = o.dpr || devicePixelRatio;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, alpha: false });
  renderer.setPixelRatio(dpr); renderer.setSize(cw, ch, false);
  canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  const W = Math.round(cw * dpr), H = Math.round(ch * dpr);
  const scene = new THREE.Scene();
  scene.add(vrm.scene);
  const key = new THREE.DirectionalLight(0xffffff, o.keyI ?? 2.6); key.position.set(...(o.key || [-1.2, 1.6, 1.6])); scene.add(key);
  scene.add(new THREE.AmbientLight(0xffffff, o.ambI ?? .55));
  const cam = new THREE.PerspectiveCamera(o.fov || 24, cw / ch, .05, 50); cam.position.set(...o.cam); cam.lookAt(...o.tgt);
  const list = collect(vrm);
  const mk = () => new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
  const need = o.stageAll ? [o.stageAll] : [1, 2, 3, 4];
  const rts = {};
  renderer.setClearColor(0x000000, 0);
  for (const s of need) {
    stage(list, s, o);
    const rt = mk(); renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, cam); rts[s] = rt;
  }
  stage(list, 4, o);
  renderer.setRenderTarget(null);
  // 泛光：从第 4 遍里取亮部，糊两级
  const src4 = rts[4] || rts[need[0]];
  const blurs = [];
  const mBright = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS_BRIGHT, uniforms: { src: { value: src4.texture }, thr: { value: o.bloomThr ?? .9 } } });
  const mBlur = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS_BLUR, uniforms: { src: { value: null }, dir: { value: new THREE.Vector2() } } });
  for (const k of [4, 12]) {
    const a = new THREE.WebGLRenderTarget(Math.ceil(W / k), Math.ceil(H / k), { type: THREE.HalfFloatType }), b = a.clone();
    renderer.setRenderTarget(a); renderer.render(quad(mBright), cam);
    for (let i = 0; i < 2; i++) {
      mBlur.uniforms.src.value = a.texture; mBlur.uniforms.dir.value.set(1.5 / a.width, 0); renderer.setRenderTarget(b); renderer.render(quad(mBlur), cam);
      mBlur.uniforms.src.value = b.texture; mBlur.uniforms.dir.value.set(0, 1.5 / a.height); renderer.setRenderTarget(a); renderer.render(quad(mBlur), cam);
    }
    blurs.push(a);
  }
  const bg = Object.assign({ sky0: '#1d2466', sky1: '#5d4cc0', sky2: '#ff93b6', sky3: '#ffd6a6', halo: '#fff2d8' }, o.bg || {});
  const v3 = h => new THREE.Color(h);
  const mComp = new THREE.ShaderMaterial({
    vertexShader: VS, fragmentShader: FS_COMP,
    uniforms: {
      s1: { value: (rts[1] || src4).texture }, s2: { value: (rts[2] || src4).texture }, s3: { value: (rts[3] || src4).texture }, s4: { value: src4.texture },
      bl: { value: blurs[0].texture }, bl2: { value: blurs[1].texture }, txt: { value: nameTexture(cw, ch, o.name) }, txtOn: { value: o.name ? 1 : 0 },
      res: { value: new THREE.Vector2(W, H) }, px: { value: dpr }, stageAll: { value: o.stageAll || 0 }, bandX: { value: o.bandX ?? -1 }, bandX2: { value: o.bandX2 ?? 1e5 }, seed: { value: 1.7 },
      strips: { value: new THREE.Vector4(...(o.strips || [0, 0, 1e5, 4])) }, sdir: { value: new THREE.Vector2(...(o.sdir || [1, 0])) },
      sky0: { value: v3(bg.sky0) }, sky1: { value: v3(bg.sky1) }, sky2: { value: v3(bg.sky2) }, sky3: { value: v3(bg.sky3) }, halo: { value: v3(bg.halo) },
      gradA: { value: v3(o.gradA || '#ffd2a8') }, gradB: { value: v3(o.gradB || '#8aa0ff') },
      haloC: { value: new THREE.Vector2(...(o.halo || [cw * .5, ch * .3])) }, haloR: { value: o.haloR || 300 },
    },
  });
  renderer.setRenderTarget(null); renderer.render(quad(mComp), cam);
  scene.remove(vrm.scene);
  return { cam };
}

// 3D 点 → 画面（CSS px）
export function project(cam, p, w, h) { const v = new THREE.Vector3(...p).project(cam); return [(v.x * .5 + .5) * w, (-v.y * .5 + .5) * h]; }
export function bonePos(vrm, name) { const b = vrm.humanoid.getNormalizedBoneNode(name) || vrm.humanoid.getRawBoneNode(name); const v = new THREE.Vector3(); vrm.scene.updateMatrixWorld(true); b.getWorldPosition(v); return [v.x, v.y, v.z]; }
