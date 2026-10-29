"""从静帧场景 diorama.html 生成动画版 diorama_anim.html：按段落拆成零件组，加时间轴。python3 gen_anim.py"""
src = open('diorama.html').read()
marks = [
    ("  const x0 = -11.2, x1 = -1.6", "AFTER:begin('cafe1','rise',0.0,0.5,0,0,0);"),
    ("  // 条纹遮阳篷", "begin('awning','pop',1.0,0.45,(x0+x1)/2,3.3,z1);"),
    ("  // 二层", "begin('cafe2','drop',0.5,0.6,0,3.5,0);"),
    ("  // 晾衣杆 + 衣服", "begin('laundry','pop',2.75,0.45,x0+6.2,5.3,z1+0.9);"),
    ("  // 屋顶：女儿墙、水箱、天线", "begin('cafeRoof','drop',1.0,0.6,0,6.5,0);"),
    ("  // 竖招牌", "begin('sign','pop',1.25,0.45,x1+0.2,3.7,z1-0.4);"),
    ("  // 门口：两张小桌", "begin('tables','pop',2.5,0.45,x0+3.5,0.18,1.4);"),
    ("  const x0 = 0.4, x1 = 6.4", "AFTER:begin('house','rise',0.25,0.55,0,0,0);"),
    ("  // 瓦屋顶", "begin('houseRoof','drop',1.25,0.6,0,5.5,0);"),
    ("  // 门口：盆栽", "begin('houseProps','pop',2.5,0.45,x0+3,0.18,z1+0.6);"),
    ("// ---------- 右后：小院子", "AFTER2:begin('yard','rise',0.5,0.45,0,0,0);"),
    ("  // 樱花树", "begin('tree','pop',2.0,0.6,9.2,0.1,-6);"),
    ("  // 石灯笼", "begin('lantern','pop',2.25,0.45,8.8,0.1,-6);"),
    ("  // 售货机", "begin('vending','drop',2.0,0.6,8.3,0.18,-1.45);"),
    ("// ---------- 电线杆", "AFTER:begin('poles','rise',1.5,0.45,0,0,0);"),
    ("const wires = [];", "begin('wires','drawx',1.75,0.5,-11.4,8.5,2.2);"),
    ("// 路灯（前人行道）", "begin('lamps','rise',1.5,0.45,0,0,0);"),
    ("// 反射镜（橙色杆）", "begin('mirror','rise',1.6,0.45,0,0,0);"),
    ("// ---------- 路上：一辆小卡车", "AFTER2:begin('truck','drive',2.6,0.6,0,0,0);"),
    ("const person = (x, z, shirt, rot)", "begin('people','drop',2.75,0.55,0,0.18,0);"),
    ("// 猫（院墙上）", "begin('cat','drop',3.0,0.55,8.4,1.32,-2.2);"),
    ("// 店门口洒到人行道上的暖光", "begin(null);"),
]
out, pend = [], None
for ln in src.split('\n'):
    if pend:                                    # AFTER2：放在下一行（块的 { 之后）
        out.append(ln); out.append('  ' + pend); pend = None; continue
    hit = next((c for m, c in marks if ln.startswith(m)), None)
    if hit and hit.startswith('AFTER2:'):
        out.append(ln); pend = hit[7:]; continue
    if hit and hit.startswith('AFTER:'):
        out.append(ln); out.append('  ' + hit[6:]); continue
    if hit:
        out.append(hit)
    out.append(ln)
s = '\n'.join(out)
head, body = s.split('// ---------- 底座', 1)
s = head + 'const LAMPS = [];\n// ---------- 底座' + body.replace('scene.add(', 'T().add(')
rep = {
 "const B = (w, h, d, x, y, z, color, o = {}) => { const m = mesh(new THREE.BoxGeometry(w, h, d).translate(x, y + h / 2, z), typeof color === 'string' ? mat(color, o) : color, o); scene.add(m); return m; };":
 """// 零件组：每组有自己的动作和起始时间；组的原点放在支点上，子物体减去支点，世界坐标不变
const GROUPS = [];
let G = null, PIV = [0, 0, 0];
function begin(name, type, t0, dur, px = 0, py = 0, pz = 0) {
  if (!name) { G = null; return; }
  G = new THREE.Group(); G.position.set(px, py, pz); G.userData = { type, t0, dur, base: py }; PIV = [px, py, pz]; scene.add(G); GROUPS.push(G);
}
const T = () => G ? { add: (...ms) => { for (const m of ms) { m.position.x -= PIV[0]; m.position.y -= PIV[1]; m.position.z -= PIV[2]; G.add(m); } } } : scene;
const EMISSIVE = [];
const B = (w, h, d, x, y, z, color, o = {}) => { const m = mesh(new THREE.BoxGeometry(w, h, d).translate(x, y + h / 2, z), typeof color === 'string' ? mat(color, o) : color, o); T().add(m); return m; };""",
 "const glow = (c, i = 1.6) => mat(c, { emissive: c, ei: i * 0.35 });":
 "const glow = (c, i = 1.6) => { const m = mat(c, { emissive: c, ei: i * 0.35 }); m.userData.base = i; EMISSIVE.push(m); return m; };",
 "import { THREE, setup, finish, mesh, mat, lowpoly, rng, mergeGeometries } from './lib.js';":
 "import { THREE, setup, makeComposer, mesh, mat, lowpoly, rng, mergeGeometries } from './lib.js';",
 """  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t;
}""": """  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t;
  window.__sky = (stops) => { const gr2 = g.createLinearGradient(0, 0, 0, 512); stops.forEach((col, i) => gr2.addColorStop(i / (stops.length - 1), col)); g.fillStyle = gr2; g.fillRect(0, 0, 2, 512); t.needsUpdate = true; };
}""",
 "scene.add(new THREE.HemisphereLight('#E6F0FF', '#D8B898', 1.25));": "const HEMI = new THREE.HemisphereLight('#E6F0FF', '#D8B898', 1.25); scene.add(HEMI);",
 "const pl = new THREE.PointLight('#FFC77A', 0, 9, 1.6);": "const pl = new THREE.PointLight('#FFC77A', 0, 9, 1.6); LAMPS.push(pl);",
 "T().add(spot, spot.target);": "T().add(spot, spot.target); window.__spot = spot;",
 "const shop = new THREE.PointLight('#FFB060', 0, 8, 1.5);": "const shop = new THREE.PointLight('#FFB060', 0, 8, 1.5); LAMPS.push(shop);",
}
for a, b in rep.items():
    assert a in s, a[:70]
    s = s.replace(a, b)
a = s.index("const cam = new THREE.PerspectiveCamera(20, W / H, 1, 400);")
b = s.index("</script>", a)
s = s[:a] + open('anim_timeline.js').read() + s[b:]
open('diorama_anim.html', 'w').write(s)
