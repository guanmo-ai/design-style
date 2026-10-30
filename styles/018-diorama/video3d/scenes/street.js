// 第 1 章 · 城市街角：咖啡店、民居、售货机、电线杆、银杏（零件表来自 drafts/_3d/diorama.html，时间是相对本章起点的秒数）
import { THREE, mesh, mat, lowpoly, rng, mergeGeometries } from '../lib.js';
import { plinth } from '../kit.js';

export function buildStreet(K, { x = 0, z = 0, T0 = 0, BASE = 0.55 } = {}) {
  K.scene_(x, z, T0);
  const R = rng(21);
  ground(K, R);
  K.T0 = T0 + BASE;          // 地面拼完再长房子
  // ---------- 咖啡店（左后）----------
  {
    const x0 = -11.2, x1 = -1.6, z0 = -10, z1 = -0.6, cx = (x0 + x1) / 2, w = x1 - x0, d = z1 - z0;
    K.begin('cafe1','rise',0.0,0.5,0,0,0);
    K.B(w, 3.4, d, cx, 0.1, (z0 + z1) / 2, '#7FCBA8');                                       // 一层（深色外框）
    K.B(w * 0.86, 2.5, 0.1, cx - 0.4, 0.4, z1 + 0.02, mat('#BFE4F2', { rough: .15, metal: .2 }));                   // 橱窗玻璃
    for (let k = 0; k <= 5; k++) K.B(0.12, 2.6, 0.16, x0 + 0.65 + k * 1.55, 0.35, z1 + 0.06, '#F7F2E8');   // 窗棂
    K.B(w * 0.86, 0.12, 0.16, cx - 0.4, 1.9, z1 + 0.06, '#F7F2E8');
    K.B(1.0, 2.4, 0.12, x1 - 1.0, 0.35, z1 + 0.07, '#5A3A28');                                // 门
    // 店里：吧台、吊灯、两个人影
    K.B(4.0, 1.0, 0.8, cx - 1.2, 0.1, z1 - 1.2, '#7A4E34'); 
    for (const dx of [-3, -1, 1]) { K.B(0.04, 0.8, 0.04, cx + dx, 2.4, z1 - 0.9, '#222'); K.add(mesh(new THREE.SphereGeometry(0.22, 10, 6).translate(cx + dx, 2.3, z1 - 0.9), K.glow('#FFE6B0', 3))); }
  K.begin('awning','pop',1.0,0.45,(x0+x1)/2,3.3,z1);
    // 条纹遮阳篷
    for (let k = 0; k < 12; k++) { const g = new THREE.BoxGeometry(w / 12, 0.08, 1.7).rotateX(0.42).translate(x0 + (k + .5) * w / 12, 3.25, z1 + 0.75); K.add(mesh(g, mat(k % 2 ? '#FFFDF7' : '#F28AA6'))); }
    for (let k = 0; k < 12; k++) { const g = new THREE.CylinderGeometry(w / 24, w / 24, 0.06, 8, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2).translate(x0 + (k + .5) * w / 12, 2.92, z1 + 1.52); K.add(mesh(g, mat(k % 2 ? '#FFFDF7' : '#F28AA6'))); }
  K.begin('cafe2','drop',0.5,0.6,0,3.5,0);
    // 二层
    K.B(w, 3.0, d, cx, 3.5, (z0 + z1) / 2, '#F7C9D3');
    K.B(w + 0.2, 0.25, d + 0.2, cx, 3.4, (z0 + z1) / 2, '#C9B79C');
    for (const [wx, lit] of [[x0 + 1.8, true], [x0 + 4.8, false], [x0 + 7.8, true]]) {
      K.B(1.9, 1.6, 0.1, wx, 4.4, z1 + 0.02, lit ? K.glow('#FFD49A', 1.0) : mat('#4A5878', { rough: .3, metal: .2 }));
      K.B(2.1, 0.12, 0.3, wx, 4.3, z1 + 0.1, '#C9B79C');
      if (!lit) K.B(0.9, 1.5, 0.05, wx - 0.45, 4.45, z1 + 0.08, '#D98C6E');                  // 拉了一半的窗帘
    }
    K.B(4.2, 0.15, 1.4, x0 + 3.2, 3.5, z1 + 0.7, '#B9A88E');                                 // 阳台
    for (let k = 0; k <= 10; k++) K.B(0.05, 0.9, 0.05, x0 + 1.1 + k * 0.42, 3.65, z1 + 1.35, '#3A3A40');
    K.B(4.2, 0.06, 0.06, x0 + 3.2, 4.52, z1 + 1.35, '#3A3A40');
    K.B(0.9, 0.6, 0.45, x0 + 1.6, 3.65, z1 + 0.5, '#E8E8EA');                                // 空调外机
    K.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 12).rotateX(Math.PI / 2).translate(x0 + 1.6, 3.95, z1 + 0.74), mat('#8A8A90')));
    for (let k = 0; k < 3; k++) { K.B(0.35, 0.35, 0.35, x0 + 3.4 + k * 0.6, 3.65, z1 + 1.0, '#C46A4A'); K.add(mesh(lowpoly(new THREE.IcosahedronGeometry(0.32, 0).translate(x0 + 3.4 + k * 0.6, 4.25, z1 + 1.0), .08, k), mat('#4E9A5A'))); }
  K.begin('laundry','pop',2.75,0.45,x0+6.2,5.3,z1+0.9);
    // 晾衣杆 + 衣服
    K.B(3.6, 0.04, 0.04, x0 + 6.2, 5.3, z1 + 0.9, '#666');
    [['#F2C14A', 0.6], ['#5B8DE0', 0.8], ['#F4F0E8', 0.55]].forEach(([c, h], k) => K.B(0.6, h, 0.05, x0 + 5.0 + k * 1.0, 5.28 - h, z1 + 0.9, c));
  K.begin('cafeRoof','drop',1.0,0.6,0,6.5,0);
    // 屋顶：女儿墙、水箱、天线
    K.B(w + 0.2, 0.5, d + 0.2, cx, 6.5, (z0 + z1) / 2, '#FFF7EC');
    // 灰色屋面顶端高于奶油色基底 0.02，避免两个顶面共面而随镜头闪烁。
    K.B(w - 0.6, 0.1, d - 0.6, cx, 6.92, (z0 + z1) / 2, '#8A8580');
    K.add(mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.6, 12).translate(x0 + 2.5, 8.1, z0 + 2.5), mat('#B9C2CC', { metal: .4, rough: .4 })));
    for (const [dx, dz] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) K.B(0.08, 0.9, 0.08, x0 + 2.5 + dx, 6.9, z0 + 2.5 + dz, '#555');
    K.B(0.06, 2.2, 0.06, x1 - 1.5, 6.9, z0 + 1.5, '#444'); K.B(1.2, 0.05, 0.05, x1 - 1.5, 8.6, z0 + 1.5, '#444'); K.B(0.8, 0.05, 0.05, x1 - 1.5, 8.2, z0 + 1.5, '#444');
  K.begin('sign','pop',1.25,0.45,x1+0.2,3.7,z1-0.4);
    // 竖招牌（无字：一只杯子的图形）
    K.B(0.25, 2.6, 1.0, x1 + 0.2, 3.7, z1 - 0.4, '#F5C451');
    K.B(0.06, 2.4, 0.85, x1 + 0.36, 3.8, z1 - 0.4, '#FFFFFF');
    K.add(mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.5, 10).translate(x1 + 0.42, 4.9, z1 - 0.4), mat('#E8483B'), { cast: false }));
  K.begin('tables','pop',2.5,0.45,x0+3.5,0.18,1.4);
    // 门口：两张小桌、四把椅子、立式黑板
    for (const tx of [x0 + 2.0, x0 + 5.0]) {
      K.add(mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.06, 12).translate(tx, 0.95, 1.4), mat('#F4EEE2')));
      K.B(0.06, 0.75, 0.06, tx, 0.18, 1.4, '#333');
      for (const dx of [-0.75, 0.75]) { K.B(0.45, 0.06, 0.45, tx + dx, 0.6, 1.4, '#F4C33A'); K.B(0.45, 0.5, 0.06, tx + dx, 0.6, 1.62, '#F4C33A'); for (const ox of [-0.18, 0.18]) K.B(0.05, 0.42, 0.05, tx + dx + ox, 0.18, 1.4, '#333'); }
      K.add(mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.18, 8).translate(tx + 0.1, 1.07, 1.35), mat('#FFFFFF')));
    }
    K.B(0.7, 1.0, 0.08, x1 - 2.3, 0.2, 0.6, '#2B2B2E');
  }

  // ---------- 民居（中后）：瓦屋顶、木格子、拉门 ----------
  {
    const x0 = 0.4, x1 = 6.4, z0 = -9.5, z1 = -1.6, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0;
    K.begin('house','rise',0.25,0.55,0,0,0);
    K.B(w, 2.8, d, cx, 0.1, cz, '#FFF7EC');
    K.B(w, 2.6, d, cx, 2.9, cz, '#CDB9F0');
    K.B(w + 0.4, 0.12, d + 0.4, cx, 2.85, cz, '#5A4A40');
    for (let k = 0; k < 14; k++) K.B(0.07, 2.4, 0.08, x0 + 0.4 + k * 0.4, 0.3, z1 + 0.04, '#6B4A30');      // 一层木格子
    K.B(2.4, 2.1, 0.06, x0 + 1.6, 0.35, z1 + 0.03, '#F6E9CF');                                   // 拉门透光
    K.B(1.8, 1.0, 0.06, x1 - 1.4, 3.6, z1 + 0.03, mat('#BFE4F2', { rough: .15, metal: .2 }));
    K.B(2.0, 0.1, 0.4, x1 - 1.4, 3.5, z1 + 0.2, '#5A4A40');
  K.begin('houseRoof','drop',1.25,0.6,0,5.5,0);
    // 瓦屋顶：两坡，表面一道道瓦楞
    const roof = (side) => { for (let k = 0; k < 9; k++) { const g = new THREE.CylinderGeometry(0.16, 0.16, w + 0.8, 6).rotateZ(Math.PI / 2).translate(0, 0, (side * (k + .5) * (d / 2 + 0.5)) / 9).rotateX(side * 0.5).translate(cx, 7.35, cz); K.add(mesh(g, mat('#7E9BE6', { rough: .5 }))); }
      const p = new THREE.BoxGeometry(w + 0.8, 0.14, d / 2 + 0.6).translate(0, -0.12, side * (d / 4 + 0.3)).rotateX(side * 0.5).translate(cx, 7.35, cz); K.add(mesh(p, mat('#6A86D6'))); };
    roof(1); roof(-1);
    K.B(w + 0.9, 0.3, 0.4, cx, 7.3, cz, '#6A86D6');
    // 山墙（两端的三角）
    for (const ex of [x0 + 0.01, x1 - 0.01]) { const sh = new THREE.Shape(); sh.moveTo(-d / 2, 0); sh.lineTo(d / 2, 0); sh.lineTo(0, 1.85); sh.lineTo(-d / 2, 0); K.add(mesh(new THREE.ShapeGeometry(sh).rotateY(Math.PI / 2).translate(ex, 5.5, cz), new THREE.MeshStandardMaterial({ color: '#CDB9F0', side: THREE.DoubleSide, flatShading: true }))); }
  K.begin('houseProps','pop',2.5,0.45,x0+3,0.18,z1+0.6);
    // 门口：盆栽、自行车、红色邮筒
    for (let k = 0; k < 4; k++) { K.B(0.4, 0.4, 0.4, x0 + 3.6 + k * 0.55, 0.18, z1 + 0.5, k % 2 ? '#B85C3C' : '#8A5A3C'); K.add(mesh(lowpoly(new THREE.IcosahedronGeometry(0.3 + R() * .1, 0).translate(x0 + 3.6 + k * 0.55, 0.85, z1 + 0.5), .1, 40 + k), mat(['#3E8A4A', '#5AA05A'][k % 2]))); }
    const bike = new THREE.Group();
    for (const dx of [-0.55, 0.55]) bike.add(mesh(new THREE.TorusGeometry(0.34, 0.04, 6, 16).translate(dx, 0.4, 0), mat('#222')));
    bike.add(mesh(new THREE.BoxGeometry(1.1, 0.05, 0.05).rotateZ(0.2).translate(0, 0.62, 0), mat('#D9483B')));
    bike.add(mesh(new THREE.BoxGeometry(0.05, 0.5, 0.05).translate(-0.25, 0.6, 0), mat('#D9483B')));
    bike.add(mesh(new THREE.BoxGeometry(0.3, 0.05, 0.12).translate(-0.25, 0.86, 0), mat('#222')));
    bike.add(mesh(new THREE.BoxGeometry(0.05, 0.4, 0.5).translate(0.5, 0.95, 0), mat('#888')));
    bike.position.set(x0 + 1.2, 0.18, 0.9); bike.rotation.y = 0.3; K.add(bike);
    K.B(0.5, 1.1, 0.5, -0.7, 0.18, 0.7, '#D23A2E'); K.add(mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.5, 12, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2).translate(-0.7, 1.28, 0.7), mat('#D23A2E')));
  }

  // ---------- 右后：小院子 + 樱花树 + 售货机 ----------
  {
    K.begin('yard','rise',0.5,0.45,0,0,0);
    K.B(4.6, 1.2, 0.3, 9.4, 0.1, -2.2, '#F2EADF'); K.B(0.3, 1.2, 7.4, 11.75, 0.1, -5.6, '#F2EADF');
    for (let i = 0; i < 40; i++) K.B(0.18, 0.04 + R() * 0.05, 0.18, 7.5 + R() * 4, 0.1, -9 + R() * 6.5, R() < .5 ? '#D9D2C6' : '#E6DFD3');   // 碎石
  K.begin('tree','pop',2.0,0.6,9.2,0.1,-6);
    // 樱花树：扭一点的树干 + 一团团粉色
    const trunk = new THREE.CatmullRomCurve3([new THREE.Vector3(9.2, 0.1, -6), new THREE.Vector3(9.0, 2, -5.8), new THREE.Vector3(9.5, 3.6, -6.2), new THREE.Vector3(9.1, 4.8, -5.8)]);
    K.add(mesh(new THREE.TubeGeometry(trunk, 12, 0.3, 6), mat('#9C7158')));
    for (const [a, b] of [[[9.4, 3.4, -6], [11, 4.6, -7]], [[9.2, 3.0, -6], [7.4, 4.2, -5]], [[9.1, 4.4, -5.9], [8.6, 5.8, -7.2]]])
      K.add(mesh(new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(...a), new THREE.Vector3(...b)), 1, 0.13, 5), mat('#9C7158')));
    const blossom = [];
    for (let i = 0; i < 26; i++) { const r = 0.8 + R() * 0.8; blossom.push(lowpoly(new THREE.IcosahedronGeometry(r, 1).translate(9.2 + (R() - .5) * 4.6, 5.0 + R() * 2.2, -6 + (R() - .5) * 4.0), r * .25, i)); }
    K.add(mesh(mergeGeometries(blossom.map(g => g.index ? g.toNonIndexed() : g)), mat('#FFD65C', { rough: .9, emissive: '#C98A1A', ei: .25 })));
    const petals = [];
    for (let i = 0; i < 160; i++) petals.push(new THREE.BoxGeometry(0.12, 0.02, 0.1).rotateY(R() * 3).translate(6 + R() * 6, 0.13 + R() * 0.03, -8 + R() * 11));
    for (let i = 0; i < 30; i++) petals.push(new THREE.BoxGeometry(0.12, 0.02, 0.1).rotateX(R() * 3).rotateZ(R() * 3).translate(7 + R() * 5, 1 + R() * 4, -5 + R() * 6));   // 空中飘落的
    K.add(mesh(mergeGeometries(petals), mat('#F7D36E'), { cast: false }));
  K.begin('lantern','pop',2.25,0.45,8.8,0.1,-6);
    // 石灯笼 + 长椅
    K.B(0.6, 0.15, 0.6, 7.6, 0.1, -8, '#9A948A'); K.B(0.25, 0.9, 0.25, 7.6, 0.25, -8, '#9A948A'); K.B(0.7, 0.55, 0.7, 7.6, 1.15, -8, '#A9A398');
    K.B(0.4, 0.3, 0.4, 7.6, 1.25, -7.82, K.glow('#FFD08A', 2.2)); K.add(mesh(new THREE.ConeGeometry(0.62, 0.45, 4).rotateY(Math.PI / 4).translate(7.6, 1.92, -8), mat('#8E887E')));
    K.B(2.0, 0.1, 0.6, 10.2, 0.6, -3.6, '#8A5A3C'); for (const dx of [-0.8, 0.8]) K.B(0.1, 0.5, 0.5, 10.2 + dx, 0.1, -3.6, '#333');
  K.begin('vending','drop',2.0,0.6,8.3,0.18,-1.45);
    // 售货机 ×2（人行道上，背靠院墙）
    [['#F27D6A', 7.6], ['#7DB8E8', 9.0]].forEach(([c, x]) => {
      K.B(1.25, 2.3, 0.9, x, 0.18, -1.45, c);
      K.B(1.0, 1.0, 0.04, x, 1.25, -0.98, K.glow('#EAF6FF', 1.6));
      for (let r2 = 0; r2 < 2; r2++) for (let k = 0; k < 4; k++) K.B(0.16, 0.32, 0.06, x - 0.36 + k * 0.24, 1.35 + r2 * 0.45, -0.95, K.glow(['#FF6A5B', '#5BC0FF', '#FFD24A', '#6BE08A'][(k + r2) % 4], 0.8));
      K.B(0.8, 0.22, 0.05, x, 0.55, -0.98, '#222'); K.B(0.18, 0.22, 0.05, x + 0.35, 0.95, -0.98, '#DDD');
    });
  }

  // ---------- 电线杆 + 下垂的电线 ----------
    K.begin('poles','rise',1.5,0.45,0,0,0);
  function pole(x, z) {
    K.add(mesh(new THREE.CylinderGeometry(0.16, 0.2, 9.5, 8).translate(x, 4.75 + 0.1, z), mat('#D9D2C6')));
    K.B(2.2, 0.14, 0.14, x, 8.4, z, '#5A5A5E'); K.B(1.6, 0.14, 0.14, x, 7.6, z, '#5A5A5E');
    K.add(mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.9, 10).translate(x + 0.5, 6.5, z), mat('#7A7E86')));
    for (const dx of [-0.9, 0, 0.9]) K.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 6).translate(x + dx, 8.62, z), mat('#EDEDED')));
  }
  pole(-0.9, 2.2); pole(11.0, 2.2); pole(-11.4, 2.2);
  K.begin('wires','drawx',1.75,0.5,-11.4,8.5,2.2);
  const wires = [];
  for (const [xa, xb] of [[-11.4, -0.9], [-0.9, 11.0]]) for (const [dy, dz] of [[8.7, 0], [7.7, 0]]) for (const dx of [-0.9, 0, 0.9]) {
    if (dy === 7.7 && dx === 0) continue;
    const a = new THREE.Vector3(xa + dx * (dy > 8 ? 1 : 0.7), dy, 2.2), b = new THREE.Vector3(xb + dx * (dy > 8 ? 1 : 0.7), dy, 2.2);
    const pts = []; for (let t = 0; t <= 1.0001; t += 0.05) pts.push(new THREE.Vector3().lerpVectors(a, b, t).add(new THREE.Vector3(0, -0.9 * 4 * t * (1 - t), 0)));
    wires.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.025, 4));
  }
  K.add(mesh(mergeGeometries(wires), mat('#1E1E22'), { receive: false }));
  K.begin('lamps','rise',1.5,0.45,0,0,0);
  // 路灯（前人行道）
  for (const x of [-7, 6.5]) {
    K.add(mesh(new THREE.CylinderGeometry(0.08, 0.1, 5.2, 8).translate(x, 2.7, 10.4), mat('#3A3E46')));
    K.B(1.2, 0.1, 0.12, x - 0.5, 5.2, 10.4, '#3A3E46');
    K.B(0.6, 0.18, 0.4, x - 1.0, 5.05, 10.4, K.glow('#FFE2A8', 3));
    const pl = new THREE.PointLight('#FFC77A', 0, 9, 1.6); K.lamps.push(pl); pl.position.set(x - 1.0, 4.7, 10.4); K.add(pl);
  }
  K.begin('mirror','rise',1.6,0.45,0,0,0);
  // 反射镜（橙色杆）
  K.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8).translate(4.4, 1.7, 2.6), mat('#F07A2A')));
  K.add(mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 16).rotateX(Math.PI / 2).rotateY(-0.6).translate(4.4, 3.3, 2.6), mat('#CFE6F2', { metal: .9, rough: .1 })));
  K.add(mesh(new THREE.TorusGeometry(0.5, 0.05, 6, 20).rotateY(-0.6).translate(4.4, 3.3, 2.6), mat('#F07A2A')));

  // ---------- 路上：一辆小卡车（车灯亮着）+ 两个行人 ----------
  {
    K.begin('truck','drop',2.6,0.6,0,0,0);
    const g = new THREE.Group(), c = '#F4F1EA';
    g.add(mesh(new THREE.BoxGeometry(1.5, 1.3, 1.5).translate(0, 0.95, 0), mat(c)));
    g.add(mesh(new THREE.BoxGeometry(0.06, 0.6, 1.3).translate(0.76, 1.25, 0), mat('#5B7A9A', { metal: .3, rough: .2 })));
    g.add(mesh(new THREE.BoxGeometry(2.4, 0.35, 1.5).translate(-1.95, 0.55, 0), mat(c)));
    for (const s of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(2.4, 0.4, 0.06).translate(-1.95, 0.9, s * 0.72), mat('#D9D4C8')));
    g.add(mesh(new THREE.BoxGeometry(0.06, 0.4, 1.44).translate(-3.12, 0.9, 0), mat('#D9D4C8')));
    for (const [dx, s] of [[0.1, 1], [0.1, -1], [-2.4, 1], [-2.4, -1]]) g.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.22, 12).rotateX(Math.PI / 2).translate(dx, 0.3, s * 0.68), mat('#222')));
    for (const s of [-0.5, 0.5]) g.add(mesh(new THREE.BoxGeometry(0.05, 0.16, 0.26).translate(0.77, 0.6, s), K.glow('#FFF6D8', 4), { cast: false }));
    // 货斗里的橘子箱
    for (let k = 0; k < 4; k++) g.add(mesh(new THREE.BoxGeometry(0.55, 0.35, 0.6).translate(-1.2 - (k % 2) * 0.62, 0.9, (k < 2 ? -0.32 : 0.32)), mat('#C98A4A')));
    g.position.set(-3.5, 0.02, 4.6); K.add(g);
    const spot = new THREE.SpotLight('#FFF0D0', 0, 12, 0.45, 0.6, 1.4); spot.position.set(-2.6, 0.7, 4.6); spot.target.position.set(4, 0, 4.6); K.add(spot, spot.target); K.spot = spot;
  }
  K.begin('people','drop',2.75,0.55,0,0.18,0);
  const person = (x, z, shirt, rot) => {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CapsuleGeometry(0.2, 0.55, 4, 8).translate(0, 0.95, 0), mat(shirt)));
    for (const dx of [-0.09, 0.09]) g.add(mesh(new THREE.CylinderGeometry(0.075, 0.07, 0.6, 6).translate(dx, 0.32, 0), mat('#2B2E3A')));
    g.add(mesh(new THREE.SphereGeometry(0.17, 10, 8).translate(0, 1.5, 0), mat('#E9C2A0')));
    g.add(mesh(new THREE.SphereGeometry(0.18, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 1.54, -0.02), mat('#2A1F1A')));
    g.position.set(x, 0.18, z); g.rotation.y = rot; K.add(g);
  };
  person(-4.6, 1.8, '#E26B4A', 0.4); person(-4.0, 2.0, '#F2D35A', -0.6); person(8.3, 10.5, '#4A7FD8', 1.6);
  K.begin('cat','drop',3.0,0.55,8.4,1.32,-2.2);
  // 猫（院墙上）
  { const g = new THREE.Group(); g.add(mesh(new THREE.BoxGeometry(0.55, 0.28, 0.24).translate(0, 0.14, 0), mat('#F08A3A'))); g.add(mesh(new THREE.BoxGeometry(0.24, 0.22, 0.22).translate(0.32, 0.3, 0), mat('#F08A3A')));
    for (const dz of [-0.07, 0.07]) g.add(mesh(new THREE.ConeGeometry(0.05, 0.1, 4).translate(0.34, 0.45, dz), mat('#E07A2E')));
    g.add(mesh(new THREE.BoxGeometry(0.4, 0.05, 0.05).rotateZ(0.6).translate(-0.4, 0.28, 0), mat('#F08A3A')));
    g.position.set(8.4, 1.32, -2.2); K.add(g); }


  K.begin(null);

  const shop = new THREE.PointLight('#FFB060', 0, 8, 1.5); shop.position.set(-6, 1.6, 0.6); K.add(shop); K.lamps.push(shop);
  K.T0 = T0;
}

// 地面：底座碎块从上往下砸；方砖一波波砸下来；柏油从左往右推；斑马线翻下来
function ground(K, R) {
  plinth(K, { T: -0.3, seed: 3, speed: 0.45 });
  const it = [];
  for (let i = 0; i < 12; i++) for (let j = 0; j < 6; j++)
    it.push({ x: -11 + i * 2, y: 0, z: -11 + j * 2, w: 1.96, h: 0.1, d: 1.96, c: (i + j) % 2 ? '#E9DFCB' : '#E2D5BD', t0: 0.42 + (i + j) * 0.026, dur: 0.3, type: 'slam', hgt: 6 });
  for (const [z0, lag] of [[0, 0.6], [9, 0.74]]) for (let i = 0; i < 24; i++) for (let j = 0; j < 3; j++)
    it.push({ x: -11.5 + i, y: 0, z: z0 + 0.5 + j, w: 0.96, h: 0.18, d: 0.96, c: (i + j) % 2 ? '#EFE4D2' : '#F7EEE0', t0: lag + i * 0.02 + j * 0.03 + R() * 0.03, dur: 0.28, type: R() < 0.5 ? 'slam' : 'flip', hgt: 5 + R() * 3, spin: (R() - 0.5) * 2 });
  for (let i = 0; i < 24; i++) it.push({ x: -11.5 + i, y: 0, z: 6, w: 0.98, h: 0.02, d: 6, c: '#B9B6C6', t0: 0.92 + i * 0.016, dur: 0.24, type: 'slide' });
  for (const z of [3.0, 9.0]) for (let i = 0; i < 12; i++) it.push({ x: -11 + i * 2, y: 0, z, w: 1.96, h: 0.24, d: 0.2, c: '#9E968C', t0: 1.0 + i * 0.02 + (z > 5 ? 0.06 : 0), dur: 0.25, type: 'slam', hgt: 4 });
  let k = 0; for (let x = -11; x < 12; x += 2.4) it.push({ x, y: 0.01, z: 6, w: 1.2, h: 0.03, d: 0.18, c: '#E8E2D0', t0: 1.25 + (k++) * 0.03, dur: 0.22, type: 'pop' });
  for (let k2 = 0; k2 < 7; k2++) it.push({ x: 5.2 + k2 * 0.95, y: 0.01, z: 6, w: 0.55, h: 0.03, d: 5.2, c: '#EDE8DA', t0: 1.32 + k2 * 0.05, dur: 0.28, type: 'flip' });
  const SP = 0.42;   // 地面整体压缩：第一秒里地板、房子一起来，不让人等
  for (const o of it) o.t0 = o.t0 * SP - 0.12;
  K.shards(it);
  for (let i = 0; i < 24; i += 2) K.ev(K.T0 + (0.6 + i * 0.02 + 0.2) * SP - 0.12, 'tick', -0.8 + i / 15);
  for (let k2 = 0; k2 < 7; k2++) K.ev(K.T0 + (1.32 + k2 * 0.05) * SP - 0.12 + 0.24, 'note' + k2, 0.4);
  K.ev(K.T0 + 0.92 * SP - 0.12, 'zip', 0);
}
