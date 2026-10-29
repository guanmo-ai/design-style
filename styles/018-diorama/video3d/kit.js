// 018 微缩景观的动画底座：所有零件都“一块块搭出来”。
//   Shards：成百上千块小碎块（InstancedMesh，一种材质一次绘制），每块有自己的起始时间和动作
//   Groups：成组的零件（房子、树、卡车……），整组升起 / 落下 / 弹出 / 拉出
// 时间都是全片秒数；每个场景构建时传入自己的起点 T0。
import { THREE, mesh, mat, lowpoly, rng, mergeGeometries } from './lib.js';

export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const smooth = e => e * e * (3 - 2 * e);
export const back = (e, s = 1.2) => { e -= 1; return 1 + (s + 1) * e ** 3 + s * e ** 2; };   // s=1.2 过冲约 5%
export const lerp = (a, b, t) => a + (b - a) * t;
export const lerpC = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);

// 砸下来：前 60% 自由落体，落地后压扁 16% 再回弹（以底面为原点，不陷进地里）
export function slam(e, height = 8) {
  const land = 0.6;
  if (e <= 0) return { dy: height, sx: 1, sy: 1 };
  if (e < land) return { dy: height * (1 - (e / land) ** 2), sx: 1, sy: 1 + 0.12 * (e / land) };   // 下落时略拉长
  const k = (e - land) / (1 - land), sq = 0.16 * Math.sin(Math.PI * k) * (1 - k);
  return { dy: 0, sx: 1 + sq * 0.45, sy: 1 - sq };
}

export class Kit {
  constructor(scene) {
    this.scene = scene; this.groups = []; this.shardSets = []; this.emissive = []; this.lamps = []; this.events = [];
    this.root = scene; this.G = null; this.PIV = [0, 0, 0]; this.T0 = 0;
  }
  // 事件：给配乐用（时间、种类、声像）
  ev(t, kind, pan = 0) { this.events.push({ t: +t.toFixed(3), kind, pan: +pan.toFixed(2) }); }

  // ---- 场景根节点 ----
  scene_(x, z, T0) { const r = new THREE.Group(); r.position.set(x, 0, z); this.scene.add(r); this.root = r; this.T0 = T0; return r; }

  // ---- 成组零件 ----
  begin(name, type, t0, dur, px = 0, py = 0, pz = 0, opt = {}) {
    if (!name) { this.G = null; return; }
    const g = new THREE.Group(); g.position.set(px, py, pz);
    g.userData = { type, t0: this.T0 + t0, dur, base: py, bx: px, ...opt };
    this.PIV = [px, py, pz]; this.root.add(g); this.groups.push(g); this.G = g;
    const tt = this.T0 + t0;
    this.ev(tt + (type === 'drop' ? dur * 0.6 : type === 'pop' ? 0.05 : 0), type, px / 14);
  }
  add(...ms) {
    for (const m of ms) {
      if (this.G) { m.position.x -= this.PIV[0]; m.position.y -= this.PIV[1]; m.position.z -= this.PIV[2]; this.G.add(m); }
      else this.root.add(m);
    }
  }
  B(w, h, d, x, y, z, color, o = {}) {
    const m = mesh(new THREE.BoxGeometry(w, h, d).translate(x, y + h / 2, z), typeof color === 'string' ? mat(color, o) : color, o);
    this.add(m); return m;
  }
  glow(c, i = 1.6) { const m = mat(c, { emissive: c, ei: i * 0.35 }); m.userData.base = i; m.userData.T0 = this.T0; this.emissive.push(m); return m; }

  // ---- 碎块 ----
  // items: [{x,y,z,w,h,d,c,t0,dur,type}]，type: 'slam'（从上砸下）| 'slide'（从左推进）| 'flip'（翻着落下）| 'pop'
  shards(items, { rough = 0.85 } = {}) {
    const geo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ flatShading: true, roughness: rough }), items.length);
    m.castShadow = m.receiveShadow = true;
    m.frustumCulled = false;   // 包围球是在全都藏着时算的，会被错误剔除
    items.forEach((it, i) => { m.setColorAt(i, new THREE.Color(it.c)); it.t0 += this.T0; });
    this.root.add(m);
    this.shardSets.push({ m, items, dummy: new THREE.Object3D() });
    return m;
  }

  // ---- 每帧 ----
  update(T, timeOf = () => T) {
    for (const g of this.groups) {
      const { type, t0, dur, base, bx, h = 9 } = g.userData;
      const t = timeOf(g.userData);
      let e = clamp((t - t0) / dur);
      g.visible = e > 0;
      g.scale.set(1, 1, 1); g.position.y = g.visible ? base : -1e4; g.position.x = bx; g.rotation.set(0, 0, 0);
      if (!g.visible) continue;
      if (type === 'rise') g.scale.y = Math.max(0.001, back(e));
      else if (type === 'pop') { const k = Math.max(0.001, back(e, 2.2)); g.scale.set(k, Math.max(0.001, back(clamp((t - t0 - 0.05) / dur), 2.6)), k); }
      else if (type === 'drawx') g.scale.x = Math.max(0.001, smooth(e));
      else if (type === 'drop') { const s = slam(e, h); g.position.y = base + s.dy; g.scale.set(s.sx, s.sy, s.sx); }
      else if (type === 'spin') { const s = slam(e, h); g.position.y = base + s.dy; g.rotation.y = (1 - smooth(clamp(e / 0.6))) * Math.PI; g.scale.set(s.sx, s.sy, s.sx); }
    }
    for (const S of this.shardSets) {
      const { m, items, dummy } = S;
      items.forEach((it, i) => {
        const t = timeOf(it);
        let e = clamp((t - it.t0) / it.dur);
        dummy.position.set(it.x, it.y, it.z); dummy.rotation.set(0, 0, 0); dummy.scale.set(it.w, it.h, it.d);
        if (e <= 0) { dummy.position.y = -1e4; dummy.scale.set(1e-4, 1e-4, 1e-4); }
        else if (it.type === 'slam') { const s = slam(e, it.hgt ?? 9); dummy.position.y = it.y + s.dy; dummy.scale.set(it.w * s.sx, it.h * s.sy, it.d * s.sx); dummy.rotation.y = (1 - clamp(e / 0.6)) * (it.spin || 0); }
        else if (it.type === 'slide') dummy.position.x = it.x - 24 * (1 - back(e, 1.1));
        else if (it.type === 'flip') { dummy.position.y = it.y + 2.6 * (1 - smooth(e)); dummy.rotation.x = Math.PI * (1 - back(e, 1.2)); }
        else if (it.type === 'pop') { const k = Math.max(1e-4, back(e, 2.4)); dummy.scale.set(it.w * k, it.h * k, it.d * k); }
        dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
    }
  }
}

// 底座：木框 + 四层土，全部切成 2×2 的小块，从上往下一层层砸（土层）+ 从左往右推（木框条）
export function plinth(K, { size = 24, T = 0, seed = 1, top = '#A9C98A', layers } = {}) {
  const R = rng(seed), half = size / 2, n = size / 2, items = [];
  layers = layers || [['#C99A72', 1.4], ['#DDB48A', 0.9], ['#EED0A6', 0.6], [top, 0.3]];   // 合计 3.2：顶面正好在 y=0
  // 木框：四周 16 根木条，从左往右推进来
  for (let k = 0; k < 8; k++) {
    items.push({ x: -half - 1 + k * (size + 2) / 8 + (size + 2) / 16, y: -4.4, z: 0, w: (size + 2) / 8 - 0.04, h: 1.2, d: size + 2, c: k % 2 ? '#FFF7EC' : '#F6EBDA', t0: T + k * 0.035, dur: 0.3, type: 'slide' });
  }
  let ly = -3.2, li = 0;
  for (const [c, h] of layers) {
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const x = -half + 1 + i * 2, z = -half + 1 + j * 2;
      const d = Math.hypot(i - n / 2, j - n / 2) / n;   // 从中间往外，一圈圈砸下来
      const col = new THREE.Color(c).offsetHSL(0, 0, (R() - 0.5) * 0.05).getStyle();
      items.push({ x, y: ly, z, w: 1.96, h, d: 1.96, c: col, t0: T + 0.22 + li * 0.14 + d * 0.32 + R() * 0.05, dur: 0.32, type: 'slam', hgt: 7 + R() * 3, spin: (R() - 0.5) * 1.2 });
    }
    ly += h; li++;
  }
  K.shards(items);
  for (let li2 = 0; li2 < layers.length; li2++) K.ev(T + 0.22 + li2 * 0.14 + 0.2, 'rumble', 0);
  return ly;   // 顶面高度
}
