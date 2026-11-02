// 018 微缩景观的动画底座：所有零件都“一块块搭出来”。
//   Shards：成百上千块小碎块（InstancedMesh，一种材质一次绘制），每块有自己的起始时间和动作
//   Groups：成组的零件（房子、树、卡车……），整组升起 / 落下 / 弹出 / 拉出
// 时间都是全片秒数；每个场景构建时传入自己的起点 T0。
import { THREE, mesh, mat, lowpoly, rng, mergeGeometries, rbox, blob } from './lib.js';

export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const smooth = e => e * e * (3 - 2 * e);
export const back = (e, s = 1.2) => { e -= 1; return 1 + (s + 1) * e ** 3 + s * e ** 2; };   // s=1.2 过冲约 5%
export const lerp = (a, b, t) => a + (b - a) * t;
export const lerpC = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);

// 砸下来：前 60% 自由落体，落地后压扁 16% 再回弹（以底面为原点，不陷进地里）
// 第三版：落地后不是一下弹回，而是像软胶一样抖 1.5 下慢慢停住（衰减正弦，速度连续）
export function slam(e, height = 8) {
  const land = 0.6;
  if (e <= 0) return { dy: height, sx: 1, sy: 1 };
  if (e < land) { const u = e / land; return { dy: height * (1 - u * u), sx: 1 - 0.05 * u * u, sy: 1 + 0.12 * u * u }; }   // 越落越快，越落越长
  const k = (e - land) / (1 - land), sq = 0.27 * Math.sin(3 * Math.PI * k) * Math.exp(-3.5 * k) * (1 - k * k);
  return { dy: 0, sx: 1 + sq * 0.5, sy: 1 - sq };
}
// 弹簧：0 → 1，过冲约 6%，再抖一下停住；起点速度不为零（东西是“冒”出来的）
export const spring = (e, w = 5, z = 5.6) => e >= 1 ? 1 : 1 - Math.exp(-z * e) * Math.cos(w * e) * (1 - e ** 6);
// 体积守恒：竖着拉长时横向收一点，压扁时横向鼓一点
const keepVol = sy => Math.min(1.18, Math.max(0.9, 1 / Math.sqrt(Math.max(0.55, sy))));

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
    if ((type === 'drop' || type === 'spin') && opt.dust !== false) { const G = this.G; this.G = null; this.puff(px, Math.max(0, py - (opt.dustDrop ?? 0)), pz, t0 + dur * 0.6, opt.dustR || 2.2); this.G = G; }
  }
  add(...ms) {
    for (const m of ms) {
      if (this.G) { m.position.x -= this.PIV[0]; m.position.y -= this.PIV[1]; m.position.z -= this.PIV[2]; this.G.add(m); }
      else this.root.add(m);
    }
  }
  B(w, h, d, x, y, z, color, o = {}) {
    const m = mesh(rbox(w, h, d, o.r).translate(x, y + h / 2, z), typeof color === 'string' ? mat(color, o) : color, o);
    this.add(m); return m;
  }
  glow(c, i = 1.6) { const m = mat(c, { emissive: c, ei: i * 0.35, rough: 0.35 }); m.userData.base = i; m.userData.T0 = this.T0; this.emissive.push(m); return m; }

  // ---- 碎块 ----
  // items: [{x,y,z,w,h,d,c,t0,dur,type}]，type: 'slam'（从上砸下）| 'slide'（从左推进）| 'flip'（翻着落下）| 'pop'
  shards(items, { rough = 0.7 } = {}) {
    // 第三版：按尺寸分桶，每桶一块真正的圆角方块几何体（不用拉伸单位方块，圆角才不会被压扁）
    const buckets = new Map();
    items.forEach(it => { it.t0 += this.T0; const k = [it.w, it.h, it.d].map(v => v.toFixed(3)).join('|'); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(it); });
    const out = [];
    for (const list of buckets.values()) {
      const { w, h, d } = list[0];
      const geo = rbox(w, h, d, Math.min(0.16, Math.min(w, h, d) * 0.3), 1).translate(0, h / 2, 0);
      const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: rough }), list.length);
      m.castShadow = m.receiveShadow = true;
      m.frustumCulled = false;   // 包围球是在全都藏着时算的，会被错误剔除
      list.forEach((it, i) => m.setColorAt(i, new THREE.Color(it.c)));
      this.root.add(m); out.push(m);
      this.shardSets.push({ m, items: list, dummy: new THREE.Object3D() });
    }
    return out;
  }

  // ---- 扬尘：在 (x, z) 处、时间 t 落地，半径 r ----
  puff(x, y, z, t, r = 2.5, n = 9) {
    const pm = new THREE.MeshStandardMaterial({ color: '#FFF7EC', roughness: 1, transparent: true, opacity: 0.85 });
    const list = [];
    for (let k = 0; k < n; k++) {
      const m = mesh(blob(1, k * 7 + Math.round(x * 13), 0.12, 1), pm, { cast: false });
      const a = k / n * Math.PI * 2 + (k % 2) * 0.3;
      m.userData = { a, t: this.T0 + t, x, y, z, r, s: 0.35 + (k % 3) * 0.12 };
      this.root.add(m); list.push(m);
    }
    this.puffs = (this.puffs || []).concat(list);
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
      if (type === 'rise') { const sy = Math.max(0.001, spring(e)); g.scale.set(keepVol(sy), sy, keepVol(sy)); }
      else if (type === 'pop') { const k = Math.max(0.001, spring(e, 7, 7)); g.scale.set(k, Math.max(0.001, spring(clamp((t - t0 - 0.05) / dur), 7.5, 7.2)), k); }
      else if (type === 'drawx') g.scale.x = Math.max(0.001, smooth(e));
      else if (type === 'drop') { const s = slam(e, h); g.position.y = base + s.dy; g.scale.set(s.sx, s.sy, s.sx); }
      else if (type === 'spin') { const s = slam(e, h); g.position.y = base + s.dy; g.rotation.y = (1 - smooth(clamp(e / 0.6))) * Math.PI; g.scale.set(s.sx, s.sy, s.sx); }
      if (g.userData.anim) g.userData.anim(g, t, e);   // 二级动画：树摇、人走、尾巴甩……
    }
    for (const p of this.puffs || []) {
      const { a, t: tp, x, y, z, r, s } = p.userData, tt = timeOf(p.userData), e = clamp((tt - tp) / 0.55);
      if (e <= 0 || e >= 1) { p.visible = false; continue; }
      p.visible = true;
      const d = r * (0.5 + 0.9 * (1 - (1 - e) ** 3));
      p.position.set(x + Math.cos(a) * d, y + 0.2 + 0.9 * (1 - (1 - e) ** 2), z + Math.sin(a) * d);
      p.scale.setScalar(s * (1 - (1 - Math.min(1, e * 2.2)) ** 3) * (1 - e) ** 1.5);
    }
    for (const S of this.shardSets) {
      const { m, items, dummy } = S;
      items.forEach((it, i) => {
        const t = timeOf(it);
        let e = clamp((t - it.t0) / it.dur);
        dummy.position.set(it.x, it.y, it.z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1);
        if (e <= 0) { dummy.position.y = -1e4; dummy.scale.set(1e-4, 1e-4, 1e-4); }
        else if (it.type === 'slam') { const s = slam(e, it.hgt ?? 9); dummy.position.y = it.y + s.dy; dummy.scale.set(s.sx, s.sy, s.sx); const fall = 1 - smooth(clamp(e / 0.6)); dummy.rotation.set(fall * (it.tumble || 0), fall * (it.spin || 0), fall * (it.tumble || 0) * 0.6); }
        else if (it.type === 'slide') dummy.position.x = it.x - 24 * (1 - spring(e, 6, 6.4));
        else if (it.type === 'flip') { dummy.position.y = it.y + 2.6 * (1 - smooth(e)); dummy.rotation.x = Math.PI * (1 - spring(e, 6, 6.2)); }
        else if (it.type === 'pop') { const k = Math.max(1e-4, spring(e, 7, 7)); dummy.scale.set(k, k, k); }
        dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
    }
  }
}

// 底座：木框 + 四层土，全部切成 2×2 的小块，从上往下一层层砸（土层）+ 从左往右推（木框条）
export function plinth(K, { size = 24, T = 0, seed = 1, top = '#A9C98A', layers, speed = 1 } = {}) {
  const R = rng(seed), half = size / 2, n = size / 2, items = [];
  layers = layers || [['#C99A72', 1.4], ['#DDB48A', 0.9], ['#EED0A6', 0.6], [top, 0.3]];   // 合计 3.2：顶面正好在 y=0
  // 木框：四周 16 根木条，从左往右推进来
  for (let k = 0; k < 8; k++) {
    items.push({ x: -half - 1 + k * (size + 2) / 8 + (size + 2) / 16, y: -4.4, z: 0, w: (size + 2) / 8 - 0.04, h: 1.2, d: size + 2, c: k % 2 ? '#FFF7EC' : '#F6EBDA', t0: T + k * 0.035 * speed, dur: 0.3 * Math.max(0.6, speed), type: 'slide' });
  }
  let ly = -3.2, li = 0;
  for (const [c, h] of layers) {
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const x = -half + 1 + i * 2, z = -half + 1 + j * 2;
      const d = Math.hypot(i - n / 2, j - n / 2) / n;   // 从中间往外，一圈圈砸下来
      const col = new THREE.Color(c).offsetHSL(0, 0, (R() - 0.5) * 0.05).getStyle();
      items.push({ x, y: ly, z, w: 1.96, h, d: 1.96, c: col, t0: T + (0.22 + li * 0.14 + d * 0.32 + R() * 0.05) * speed, dur: 0.32 * Math.max(0.7, speed), type: 'slam', hgt: 7 + R() * 3, spin: (R() - 0.5) * 1.2, tumble: (R() - 0.5) * 2.2 });
    }
    ly += h; li++;
  }
  K.shards(items);
  for (let li2 = 0; li2 < layers.length; li2++) K.ev(T + (0.22 + li2 * 0.14 + 0.2) * speed, 'rumble', 0);
  return ly;   // 顶面高度
}
