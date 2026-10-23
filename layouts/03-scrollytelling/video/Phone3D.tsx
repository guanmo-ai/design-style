/**
 * 主角：一台用 three.js 实时渲染的手机（程序化建模，没有任何模型 / 贴图素材）。
 * 钛金属中框、磨砂背板、三摄镜头（带虹彩镀膜）、屏幕、盖板玻璃；可以沿 Z 轴拆开成 6 层。
 * 反射来自一个“虚拟摄影棚”：几块柔光箱 + 两条彩色轮廓光，做成环境贴图（PMREM）。
 */
import React, {useEffect, useLayoutEffect, useRef} from 'react';
import {continueRender, delayRender} from 'remotion';
import * as THREE from 'three';

export type PhoneState = {
  /** 手机中心在画布里的位置（px） */
  x: number;
  y: number;
  /** 手机高度（px） */
  h: number;
  rx?: number;
  ry?: number;
  rz?: number;
  explode?: number;
  /** 芯片发光 0–1 */
  hi?: number;
  /** 屏幕亮度 0–1 */
  screen?: number;
  /** 屏幕内容：0 = 锁屏 9:41 */
  wall?: number;
  /** 盖板玻璃上的扫光 0–1（位置） */
  sweep?: number;
  /** 曝光：0 = 全黑（从暗处浮现），1 = 正常 */
  exposure?: number;
};

const PW = 71.5;
const PH = 147;
const PD = 8.25;
const PR = 11.5;

const rr = (w: number, h: number, r: number, x = 0, y = 0) => {
  const s = new THREE.Shape();
  const l = x - w / 2;
  const b = y - h / 2;
  s.moveTo(l + r, b);
  s.lineTo(l + w - r, b);
  s.quadraticCurveTo(l + w, b, l + w, b + r);
  s.lineTo(l + w, b + h - r);
  s.quadraticCurveTo(l + w, b + h, l + w - r, b + h);
  s.lineTo(l + r, b + h);
  s.quadraticCurveTo(l, b + h, l, b + h - r);
  s.lineTo(l, b + r);
  s.quadraticCurveTo(l, b, l + r, b);
  return s;
};
// 更圆润的“超椭圆”圆角（苹果的连续曲率圆角近似）
const squircle = (w: number, h: number, r: number, x = 0, y = 0, n = 18) => {
  const s = new THREE.Shape();
  const pts: THREE.Vector2[] = [];
  const corner = (cx: number, cy: number, a0: number) => {
    for (let i = 0; i <= n; i++) {
      const a = a0 + (Math.PI / 2) * (i / n);
      const c = Math.cos(a);
      const si = Math.sin(a);
      const k = 0.72; // 指数 < 1 → 更“方”的圆角
      pts.push(new THREE.Vector2(cx + r * Math.sign(c) * Math.pow(Math.abs(c), k), cy + r * Math.sign(si) * Math.pow(Math.abs(si), k)));
    }
  };
  corner(x + w / 2 - r, y - h / 2 + r, -Math.PI / 2);
  corner(x + w / 2 - r, y + h / 2 - r, 0);
  corner(x - w / 2 + r, y + h / 2 - r, Math.PI / 2);
  corner(x - w / 2 + r, y - h / 2 + r, Math.PI);
  s.setFromPoints(pts);
  return s;
};

const planarUV = (g: THREE.BufferGeometry, w: number, h: number) => {
  const p = g.attributes.position;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = p.getX(i) / w + 0.5;
    uv[i * 2 + 1] = p.getY(i) / h + 0.5;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
};

/* ───────────── 屏幕：锁屏壁纸 + 9:41 + 灵动岛（画在 2D canvas 上） ───────────── */
const drawScreen = (cv: HTMLCanvasElement, t: number) => {
  const W = cv.width;
  const H = cv.height;
  const g = cv.getContext('2d', {willReadFrequently: true})!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, W, H);
  const blob = (x: number, y: number, r: number, col: string) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, col);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
  };
  const ph = t * Math.PI * 2;
  g.fillStyle = '#1a0630';
  g.fillRect(0, 0, W, H);
  blob(W * (0.15 + 0.05 * Math.sin(ph)), H * 0.12, W * 1.1, 'rgba(255,122,47,0.95)');
  blob(W * 1.0, H * (0.42 + 0.04 * Math.cos(ph)), W * 1.0, 'rgba(139,61,255,0.95)');
  blob(W * 0.2, H * 1.0, W * 1.2, 'rgba(41,151,255,0.95)');
  blob(W * (0.55 + 0.05 * Math.cos(ph)), H * 0.55, W * 0.7, 'rgba(255,46,126,0.85)');
  // 细微的颗粒，避免色带
  const img = g.getImageData(0, 0, W, H);
  let seed = 7;
  for (let i = 0; i < img.data.length; i += 4) {
    seed = (seed * 16807) % 2147483647;
    const n = ((seed / 2147483647) - 0.5) * 6;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  // 时间与日期
  g.fillStyle = 'rgba(255,255,255,0.94)';
  g.textAlign = 'center';
  g.font = `600 ${Math.round(W * 0.06)}px 'Inter', sans-serif`;
  g.fillText('Thursday, October 22', W / 2, H * 0.135);
  g.font = `700 ${Math.round(W * 0.27)}px 'Inter Display', sans-serif`;
  g.fillText('9:41', W / 2, H * 0.29);
  // 底部两个按钮
  for (const sx of [0.2, 0.8]) {
    g.fillStyle = 'rgba(255,255,255,0.16)';
    g.beginPath();
    g.arc(W * sx, H * 0.9, W * 0.07, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = 'rgba(255,255,255,0.7)';
  g.fillRect(W * 0.36, H * 0.972, W * 0.28, H * 0.006);
  // 灵动岛
  g.fillStyle = '#000';
  const iw = W * 0.3;
  const ih = W * 0.088;
  const ix = (W - iw) / 2;
  const iy = H * 0.018;
  g.beginPath();
  g.roundRect(ix, iy, iw, ih, ih / 2);
  g.fill();
};

/* ───────────── 主板贴图：金色走线 + 元件 ───────────── */
const drawBoard = (cv: HTMLCanvasElement) => {
  const W = cv.width;
  const H = cv.height;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#0c1410';
  g.fillRect(0, 0, W, H);
  let seed = 3;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  g.strokeStyle = 'rgba(214,178,94,0.6)';
  g.lineWidth = 1.2;
  for (let i = 0; i < 160; i++) {
    let x = rnd() * W;
    let y = rnd() * H;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 4; k++) {
      if (rnd() > 0.5) x += (rnd() - 0.5) * 120;
      else y += (rnd() - 0.5) * 120;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  for (let i = 0; i < 70; i++) {
    const w = 8 + rnd() * 40;
    const h = 6 + rnd() * 26;
    g.fillStyle = rnd() > 0.6 ? '#1f2a25' : '#2a2c30';
    g.fillRect(rnd() * W, rnd() * H, w, h);
  }
};

type Ctx = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  cam: THREE.PerspectiveCamera;
  root: THREE.Group;
  parts: Record<string, THREE.Object3D>;
  screenCv: HTMLCanvasElement;
  screenTex: THREE.CanvasTexture;
  screenMat: THREE.MeshBasicMaterial;
  chipMat: THREE.MeshStandardMaterial;
  glassMat: THREE.MeshPhysicalMaterial;
  sweepMat: THREE.ShaderMaterial;
  dispose: () => void;
  redraw: () => void;
};

const studio = (renderer: THREE.WebGLRenderer) => {
  // 虚拟摄影棚：近黑的房间 + 几块边缘柔和的柔光箱 + 品牌色（橙 / 蓝 / 粉）的轮廓光 → 环境贴图（PMREM）
  const env = new THREE.Scene();
  const room = new THREE.Mesh(
    new THREE.SphereGeometry(50, 48, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      vertexShader: 'varying vec3 vW; void main(){ vW = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      // 上亮下暗的渐变墙：给金属一个柔和的“地平线”
      fragmentShader: 'varying vec3 vW; void main(){ float t = clamp(vW.y*0.5+0.5,0.0,1.0); vec3 c = mix(vec3(0.004), vec3(0.07,0.072,0.08), smoothstep(0.4,1.0,t)); gl_FragColor = vec4(c,1.0); }',
    }),
  );
  env.add(room);
  // 柔光箱：中心亮、边缘柔和地衰减（反射里看不到硬边）
  const panel = (w: number, h: number, col: THREE.ColorRepresentation, k: number, pos: [number, number, number], soft = 0.5) => {
    const c = new THREE.Color(col).multiplyScalar(k);
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        uniforms: {c: {value: new THREE.Vector3(c.r, c.g, c.b)}, soft: {value: soft}},
        vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader:
          'uniform vec3 c; uniform float soft; varying vec2 vU; void main(){ vec2 d = abs(vU-0.5)*2.0; float a = (1.0-smoothstep(1.0-soft,1.0,d.x))*(1.0-smoothstep(1.0-soft,1.0,d.y)); gl_FragColor = vec4(c*a,1.0); }',
      }),
    );
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    env.add(m);
  };
  panel(44, 16, 0xffffff, 1.5, [0, 30, 4], 0.7); // 顶部大柔光箱：玻璃上一片渐隐的反光
  panel(6, 50, 0xffffff, 2.2, [-24, 4, 14], 0.6); // 左前条灯 → 中框左边一条亮线
  panel(4, 44, 0xffffff, 0.9, [24, 0, 12], 0.6); // 右前条灯（弱）
  panel(3, 46, 0xff7a2f, 3.2, [-20, 0, -26], 0.5); // 暖色轮廓光（品牌橙，放在身后：只照亮中框边缘）
  panel(3, 46, 0x2997ff, 3.2, [20, 2, -24], 0.5); // 冷色轮廓光（品牌蓝）
  panel(22, 6, 0xff2e7e, 1.6, [0, 20, -24], 0.6); // 顶后方一抹粉
  panel(34, 28, 0xf2f0ec, 0.8, [-14, 14, -28], 0.9); // 背面：大而软的斜向光 → 磨砂背板上的渐变
  panel(30, 4, 0xffffff, 0.6, [0, -20, 22], 0.6); // 前下方补光：玻璃底边一条亮边
  panel(46, 34, 0xdfe6f5, 0.22, [-16, 16, 34], 1.0); // 相机身后左上：黑屏玻璃上一道很淡的斜向渐变反光
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(env, 0.02);
  pm.dispose();
  return rt;
};

/* ───────────── 中板（铝）与电池的贴图 ───────────── */
const drawMid = (cv: HTMLCanvasElement) => {
  const W = cv.width;
  const H = cv.height;
  const g = cv.getContext('2d')!;
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#9a9da4');
  bg.addColorStop(0.5, '#7d8087');
  bg.addColorStop(1, '#a3a6ad');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  // 车削纹：同心细圆
  g.strokeStyle = 'rgba(255,255,255,0.05)';
  for (let r = 6; r < W; r += 5) {
    g.beginPath();
    g.arc(W / 2, H * 0.62, r, 0, Math.PI * 2);
    g.stroke();
  }
  // MagSafe 磁环
  g.lineWidth = W * 0.035;
  g.strokeStyle = 'rgba(40,42,48,0.55)';
  g.beginPath();
  g.arc(W / 2, H * 0.62, W * 0.26, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = W * 0.008;
  g.strokeStyle = 'rgba(255,255,255,0.35)';
  g.beginPath();
  g.arc(W / 2, H * 0.62, W * 0.29, 0, Math.PI * 2);
  g.stroke();
  // 螺丝孔 + 开槽
  g.fillStyle = 'rgba(30,32,36,0.8)';
  for (const [x, y] of [
    [0.1, 0.06],
    [0.9, 0.06],
    [0.1, 0.94],
    [0.9, 0.94],
    [0.5, 0.05],
  ]) {
    g.beginPath();
    g.arc(W * x, H * y, W * 0.018, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = 'rgba(30,32,36,0.6)';
  g.beginPath();
  g.roundRect(W * 0.12, H * 0.12, W * 0.76, H * 0.26, W * 0.04);
  g.fill();
};
const drawBattery = (cv: HTMLCanvasElement) => {
  const W = cv.width;
  const H = cv.height;
  const g = cv.getContext('2d')!;
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#3a3c42');
  bg.addColorStop(1, '#222328');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,0.85)';
  g.textAlign = 'center';
  g.font = `600 ${Math.round(W * 0.085)}px 'Inter', sans-serif`;
  g.fillText('Li-ion · 3.87 V', W / 2, H * 0.47);
  g.fillStyle = 'rgba(255,255,255,0.45)';
  g.font = `500 ${Math.round(W * 0.05)}px 'Inter', sans-serif`;
  g.fillText('4 685 mAh · 18.13 Wh', W / 2, H * 0.56);
  g.fillStyle = '#c9a44f';
  g.fillRect(W * 0.38, 0, W * 0.24, H * 0.045);
};

const build = (canvas: HTMLCanvasElement, w: number, h: number): Ctx => {
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance'});
  renderer.setPixelRatio(1);
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const envRT = studio(renderer);
  scene.environment = envRT.texture;
  const cam = new THREE.PerspectiveCamera(16, w / h, 10, 5000);
  cam.position.set(0, 0, 1000);
  cam.lookAt(0, 0, 0);
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(-300, 400, 500);
  scene.add(key);
  // 两盏无衰减的点光：给磨砂背板一个从左上到右下的渐变，给拆开的内部件一点正面光
  const backKey = new THREE.PointLight(0xf4f1ec, 2.2, 0, 0);
  backKey.position.set(-260, 320, -380);
  scene.add(backKey);
  const inner = new THREE.PointLight(0xffffff, 0.9, 0, 0);
  inner.position.set(240, 260, 520);
  scene.add(inner);

  const root = new THREE.Group();
  scene.add(root);
  const parts: Record<string, THREE.Object3D> = {};
  const add = (name: string, o: THREE.Object3D) => {
    parts[name] = o;
    root.add(o);
    return o;
  };

  const ti = new THREE.MeshPhysicalMaterial({color: 0x5c5d63, metalness: 1, roughness: 0.3, clearcoat: 0.3, clearcoatRoughness: 0.25, envMapIntensity: 1.15});
  const tiBright = new THREE.MeshPhysicalMaterial({color: 0x75767c, metalness: 1, roughness: 0.26, envMapIntensity: 1.2});
  // 背板：磨砂玻璃（深海军蓝），反射是柔和的渐变而不是一整片灰
  const backMat = new THREE.MeshPhysicalMaterial({color: 0x2a3344, metalness: 0.0, roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.5, envMapIntensity: 2.0});
  const black = new THREE.MeshStandardMaterial({color: 0x050506, roughness: 0.4, metalness: 0.2});

  // 中框：带倒角的钛金属环
  const band = rr(PW, PH, PR);
  band.holes.push(rr(PW - 3.2, PH - 3.2, PR - 1.6) as unknown as THREE.Path);
  const bev = 0.9;
  const frameG = new THREE.ExtrudeGeometry(band, {depth: PD - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev * 0.9, bevelSegments: 5, curveSegments: 28});
  frameG.translate(0, 0, -(PD - 2 * bev) / 2);
  const frame = new THREE.Group();
  frame.add(new THREE.Mesh(frameG, ti));
  // 侧键
  const btn = (x: number, y: number, len: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.4, len, 3.2), tiBright);
    m.position.set(x, y, 0);
    frame.add(m);
  };
  btn(PW / 2 + 0.55, 28, 16);
  btn(-PW / 2 - 0.55, 38, 7);
  btn(-PW / 2 - 0.55, 24, 11);
  btn(-PW / 2 - 0.55, 10, 11);
  add('frame', frame);

  // 中板（拆开时才看得见）
  const midG = new THREE.ShapeGeometry(rr(PW - 3.4, PH - 3.4, PR - 1.7), 24);
  const midCv = document.createElement('canvas');
  midCv.width = 512;
  midCv.height = 1040;
  drawMid(midCv);
  const midTex = new THREE.CanvasTexture(midCv);
  midTex.colorSpace = THREE.SRGBColorSpace;
  planarUV(midG, PW - 3.4, PH - 3.4);
  const mid = new THREE.Mesh(midG, new THREE.MeshPhysicalMaterial({map: midTex, metalness: 0.55, roughness: 0.45, envMapIntensity: 1.2}));
  mid.position.z = -0.6;
  add('mid', mid);

  // 背板 + 摄像头模组
  const back = new THREE.Group();
  const backG = new THREE.ShapeGeometry(rr(PW - 1.6, PH - 1.6, PR - 0.8), 28);
  const backM = new THREE.Mesh(backG, backMat);
  backM.rotation.y = Math.PI;
  back.add(backM);
  const plateS = rr(35, 35, 9);
  const plateG = new THREE.ExtrudeGeometry(plateS, {depth: 0.8, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5, bevelSegments: 4, curveSegments: 20});
  const plate = new THREE.Mesh(plateG, new THREE.MeshPhysicalMaterial({color: 0x34353a, metalness: 0.2, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05}));
  plate.rotation.y = Math.PI;
  plate.position.set(PW / 2 - 4.2 - 17.5, PH / 2 - 4.2 - 17.5, -0.05);
  back.add(plate);
  const lensRing = new THREE.MeshPhysicalMaterial({color: 0x6b6c72, metalness: 1, roughness: 0.18});
  const lensGlass = new THREE.MeshPhysicalMaterial({color: 0x020306, metalness: 0, roughness: 0.02, clearcoat: 1, clearcoatRoughness: 0, iridescence: 0.45, iridescenceIOR: 1.4, iridescenceThicknessRange: [150, 380], envMapIntensity: 1.6});
  const lens = (lx: number, ly: number) => {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(6.9, 6.9, 2.4, 48), lensRing);
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    const glass = new THREE.Mesh(new THREE.CircleGeometry(6.0, 48), lensGlass);
    glass.rotation.y = Math.PI;
    glass.position.z = -1.22;
    g.add(glass);
    const inner = new THREE.Mesh(new THREE.CircleGeometry(3.0, 40), new THREE.MeshPhysicalMaterial({color: 0x070a16, roughness: 0.05, clearcoat: 1, iridescence: 0.3}));
    inner.rotation.y = Math.PI;
    inner.position.z = -1.24;
    g.add(inner);
    g.position.set(plate.position.x + lx, plate.position.y + ly, -1.9);
    back.add(g);
  };
  lens(7.6, 7.6);
  lens(7.6, -7.6);
  lens(-7.6, 0);
  const flash = new THREE.Mesh(new THREE.CircleGeometry(2.0, 24), new THREE.MeshStandardMaterial({color: 0xd9cdb0, roughness: 0.3, emissive: 0x332b18}));
  flash.rotation.y = Math.PI;
  flash.position.set(plate.position.x - 8.5, plate.position.y + 10.5, -1.4);
  back.add(flash);
  back.position.z = -PD / 2 + 0.05;
  add('back', back);

  // 电池
  const batG = new THREE.ExtrudeGeometry(rr(54, 72, 4), {depth: 3.2, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4, bevelSegments: 2});
  batG.translate(0, 0, -1.6);
  const batCv = document.createElement('canvas');
  batCv.width = 540;
  batCv.height = 720;
  drawBattery(batCv);
  const batTex = new THREE.CanvasTexture(batCv);
  batTex.colorSpace = THREE.SRGBColorSpace;
  planarUV(batG, 54, 72);
  const bat = new THREE.Mesh(batG, [
    new THREE.MeshPhysicalMaterial({map: batTex, metalness: 0, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.3}),
    new THREE.MeshPhysicalMaterial({color: 0x1a1b1f, metalness: 0.4, roughness: 0.4}),
  ]);
  bat.position.set(0, -26, -1.4);
  add('battery', bat);

  // 主板 + 芯片
  const boardCv = document.createElement('canvas');
  boardCv.width = 512;
  boardCv.height = 512;
  drawBoard(boardCv);
  const boardTex = new THREE.CanvasTexture(boardCv);
  boardTex.colorSpace = THREE.SRGBColorSpace;
  const boardS = rr(60, 52, 5);
  const boardG = planarUV(new THREE.ExtrudeGeometry(boardS, {depth: 1.0, bevelEnabled: false, curveSegments: 12}), 60, 52);
  const board = new THREE.Group();
  const boardMats = [new THREE.MeshStandardMaterial({map: boardTex, roughness: 0.55, metalness: 0.3}), new THREE.MeshStandardMaterial({color: 0x0c1410, roughness: 0.6})];
  board.add(new THREE.Mesh(boardG, boardMats));
  const chipMat = new THREE.MeshStandardMaterial({color: 0xb9bcc4, metalness: 1, roughness: 0.25, emissive: new THREE.Color(0x2997ff), emissiveIntensity: 0});
  const chip = new THREE.Mesh(new THREE.BoxGeometry(15, 15, 1.4), chipMat);
  chip.position.set(-6, 4, 1.4);
  board.add(chip);
  for (const [cx, cy, cw, ch] of [
    [14, 10, 10, 8],
    [14, -6, 12, 6],
    [-18, -14, 9, 9],
    [0, -16, 14, 5],
  ]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(cw, ch, 1.0), black);
    m.position.set(cx, cy, 1.0);
    board.add(m);
  }
  board.position.set(0, 40, -1.6);
  add('board', board);

  // 屏幕
  const screenCv = document.createElement('canvas');
  screenCv.width = 600;
  screenCv.height = 1240;
  drawScreen(screenCv, 0);
  const screenTex = new THREE.CanvasTexture(screenCv);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.anisotropy = 8;
  const sw = PW - 4.6;
  const sh = PH - 4.6;
  const screenG = planarUV(new THREE.ShapeGeometry(squircle(sw, sh, PR - 2.3), 24), sw, sh);
  const screenMat = new THREE.MeshBasicMaterial({map: screenTex, toneMapped: false});
  const screenM = new THREE.Mesh(screenG, screenMat);
  const panelBack = new THREE.Mesh(new THREE.ShapeGeometry(rr(PW - 2.6, PH - 2.6, PR - 1.3), 24), new THREE.MeshBasicMaterial({color: 0x000000}));
  panelBack.position.z = -0.05;
  const display = new THREE.Group();
  display.add(panelBack);
  display.add(screenM);
  display.position.z = PD / 2 - 0.55;
  add('display', display);

  // 盖板玻璃：只加反射（加法混合），不挡屏幕
  const glassMat = new THREE.MeshPhysicalMaterial({color: 0x000000, metalness: 0, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 0.9, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false});
  const glassG = new THREE.ShapeGeometry(rr(PW - 1.2, PH - 1.2, PR - 0.6), 28);
  const glass = new THREE.Group();
  glass.add(new THREE.Mesh(glassG, glassMat));
  // 玻璃边缘一圈细亮边（2.5D 弧边玻璃的高光）
  const edgeS = rr(PW - 1.0, PH - 1.0, PR - 0.5);
  edgeS.holes.push(rr(PW - 2.6, PH - 2.6, PR - 1.3) as unknown as THREE.Path);
  const edge = new THREE.Mesh(
    new THREE.ShapeGeometry(edgeS, 28),
    new THREE.MeshPhysicalMaterial({color: 0x050506, metalness: 0.6, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 2.2}),
  );
  edge.position.z = 0.01;
  edge.visible = false;
  glass.add(edge);
  // 扫光：一条斜向的高光带，位置由 sweep 控制
  const sweepMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {u: {value: -1}, k: {value: 0}},
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader:
      'uniform float u; uniform float k; varying vec2 vP; void main(){ float d = (vP.x * 0.55 + vP.y) / 160.0 - u; float a = exp(-d*d*90.0) * k; gl_FragColor = vec4(vec3(1.0,0.97,0.94)*a*0.3, 1.0); }',
  });
  const sweepM = new THREE.Mesh(glassG, sweepMat);
  sweepM.position.z = 0.02;
  glass.add(sweepM);
  glass.position.z = PD / 2 + 0.02;
  add('glass', glass);

  const redraw = () => {
    drawScreen(screenCv, 0);
    screenTex.needsUpdate = true;
    drawBattery(batCv);
    batTex.needsUpdate = true;
  };
  const dispose = () => {
    renderer.dispose();
    renderer.forceContextLoss();
    envRT.dispose();
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
    });
  };
  return {renderer, scene, cam, root, parts, screenCv, screenTex, screenMat, chipMat, glassMat, sweepMat, dispose, redraw};
};

const D2R = Math.PI / 180;

const apply = (c: Ctx, st: PhoneState, w: number, h: number) => {
  const visH = 2 * c.cam.position.z * Math.tan((c.cam.fov / 2) * D2R);
  const k = visH / h; // 世界单位 / px
  const s = (st.h * k) / PH;
  c.root.position.set((st.x - w / 2) * k, -(st.y - h / 2) * k, 0);
  c.root.scale.setScalar(s);
  c.root.rotation.set((st.rx ?? 0) * D2R, (st.ry ?? 0) * D2R, (st.rz ?? 0) * D2R, 'YXZ');
  const e = st.explode ?? 0;
  const L = 34;
  const p = c.parts;
  p.glass.position.z = PD / 2 + 0.02 + 2.0 * L * e;
  p.display.position.z = PD / 2 - 0.55 + 1.15 * L * e;
  p.frame.position.z = 0.25 * L * e;
  p.board.position.z = -1.6 - 0.2 * L * e;
  p.mid.position.z = -0.6 - 0.75 * L * e;
  p.battery.position.z = -1.4 - 1.25 * L * e;
  p.back.position.z = -PD / 2 + 0.05 - 2.0 * L * e;
  // 拆开时内部件可见；合上时藏起来（省渲染）
  for (const n of ['mid', 'board', 'battery']) p[n].visible = e > 0.002;
  const hi = st.hi ?? 0;
  c.chipMat.emissiveIntensity = 2.2 * hi;
  c.renderer.toneMappingExposure = 1.2 * (st.exposure ?? 1);
  const sc = st.screen ?? 1;
  c.screenMat.color.setScalar(sc);
  c.sweepMat.uniforms.u.value = -1.2 + 2.4 * (st.sweep ?? -1);
  c.sweepMat.uniforms.k.value = st.sweep === undefined ? 0 : 1;
};

/** 超采样倍数：只渲染手机所在的那一块（setViewOffset），再按 1.5 倍像素渲染 → 边缘更细腻 */
const SS = 1.5;
/** 手机在画布里占的矩形（留足拆开、透视的余量） */
const cropOf = (st: PhoneState, w: number, h: number) => {
  const R = st.h * (0.6 + 0.55 * (st.explode ?? 0)) * 1.1 + 40;
  const x0 = Math.max(0, Math.floor(st.x - R));
  const y0 = Math.max(0, Math.floor(st.y - R));
  const x1 = Math.min(w, Math.ceil(st.x + R));
  const y1 = Math.min(h, Math.ceil(st.y + R));
  return {x0, y0, cw: Math.max(2, x1 - x0), ch: Math.max(2, y1 - y0), off: x1 <= x0 || y1 <= y0};
};

/** ss：超采样倍数（X 光里舞台被缩小到 0.36，就没必要按 1.5 倍渲染） */
export const Phone3D: React.FC<{w: number; h: number; st: PhoneState; style?: React.CSSProperties; ss?: number}> = ({w, h, st, style, ss = SS}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const ctx = useRef<Ctx | null>(null);
  const box = cropOf(st, w, h);
  const draw = () => {
    const c = ctx.current;
    if (!c) return;
    c.renderer.setPixelRatio(ss);
    c.renderer.setSize(box.cw, box.ch, false);
    c.cam.aspect = w / h;
    c.cam.setViewOffset(w, h, box.x0, box.y0, box.cw, box.ch);
    c.cam.updateProjectionMatrix();
    apply(c, st, w, h);
    c.renderer.render(c.scene, c.cam);
  };
  useLayoutEffect(() => {
    if (!ref.current) return;
    if (!ctx.current) ctx.current = build(ref.current, box.cw, box.ch);
    draw();
  });
  useEffect(() => {
    // 字体到了再画一次屏幕（9:41 用 Inter Display）
    const hd = delayRender('phone fonts');
    Promise.all([document.fonts.load("700 100px 'Inter Display'"), document.fonts.load("600 30px 'Inter'")])
      .catch(() => null)
      .then(() => {
        ctx.current?.redraw();
        draw();
        continueRender(hd);
      });
    return () => {
      ctx.current?.dispose();
      ctx.current = null;
    };
  }, []);
  return (
    <canvas
      ref={ref}
      style={{position: 'absolute', left: box.x0, top: box.y0, width: box.cw, height: box.ch, visibility: box.off ? 'hidden' : undefined, ...style}}
    />
  );
};
