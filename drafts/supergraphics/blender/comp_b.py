# 构图 B · 混凝土中庭仰视：粗野主义的六层中庭，从底层往上看；同心的四色圆环碎在每层楼板边、栏板、楼梯和墙上，
# 从这里看是一个完整的靶心；顶上是天光。
import sys, os, math; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import hall as H, bpy
out = sys.argv[1] if len(sys.argv) > 1 else '/tmp/b.png'
w, h, spp = (int(v) for v in (sys.argv[2:5] if len(sys.argv) > 4 else (960, 540, 64)))
H.reset()
BAND = [(0.012, 0.09, 0.85), (0.86, 0.02, 0.008), (1.0, 0.27, 0.0), (1.0, 0.66, 0.0)]   # 群青 / 红 / 橙 / 黄（线性）
rings = []; r = 0.17; bw = 0.062; gap = 0.052
for i in range(4): rings.append((r + bw, r, i)); r += bw + gap
paint = H.window_paint(H.disc_masks(0.0, 0.0, rings, soft=0.001), BAND)
conc = H.pbr('conc', 'Concrete042A', 0.3, tint=(0.95, 0.94, 0.92), paint=paint)
slab = H.pbr('slab', 'Concrete034', 0.25, tint=(0.85, 0.84, 0.82), paint=paint)
S, V, LV, FH = 22.0, 9.0, 7, 4.2          # 外框边长、中间空洞边长、层数、层高
for k in range(LV):
    z = k * FH
    # 外墙（四面）
    for ang in range(4):
        a = ang * math.pi / 2; cx, cy = math.cos(a) * S / 2, math.sin(a) * S / 2
        H.box(f'w{k}{ang}', (0.6 if ang % 2 == 0 else S, S if ang % 2 == 0 else 0.6, FH), (cx, cy, z + FH / 2), conc)
    if k == 0: continue
    # 楼板：围着空洞的一圈（四块）
    t = (S - V) / 2
    for sx, sy, wx, wy in [(0, (V + t) / 2, S, t), (0, -(V + t) / 2, S, t), ((V + t) / 2, 0, t, V), (-(V + t) / 2, 0, t, V)]:
        H.box(f's{k}{sx}{sy}', (wx, wy, 0.45), (sx, sy, z - 0.225), slab)
    # 栏板：空洞边上一圈 1.1 米高的实心混凝土
    for sx, sy, wx, wy in [(0, V / 2, V + 0.3, 0.25), (0, -V / 2, V + 0.3, 0.25), (V / 2, 0, 0.25, V), (-V / 2, 0, 0.25, V)]:
        H.box(f'p{k}{sx}{sy}', (wx, wy, 1.1), (sx, sy, z + 0.55), slab)
    # 楼板下的梁：一圈加厚
    for sx, sy, wx, wy in [(0, V / 2 + 0.4, V + 1, 0.8), (0, -V / 2 - 0.4, V + 1, 0.8), (V / 2 + 0.4, 0, 0.8, V), (-V / 2 - 0.4, 0, 0.8, V)]:
        H.box(f'b{k}{sx}{sy}', (wx, wy, 0.9), (sx, sy, z - 0.9), conc)
# 每层一段斜跨空洞一角的楼梯（让圆环在斜面上折）
for k in range(1, LV - 1, 2):
    z0 = k * FH; p0 = (-V / 2 + 0.6, -V / 2 + 1.2, z0); p1 = (-V / 2 + 0.6, V / 2 - 1.2, z0 + FH)
    H.beam(f'st{k}', p0, p1, 1.6, 0.35, slab)
# 顶：开着，天光
H.lights(sun_dir=(0.25, 0.35, 0.9), sun_strength=7.0, sky_strength=1.4, haze=0.006, bounds=((-V / 2, -V / 2, 0), (V / 2, V / 2, LV * FH)))
c = H.camera((0.0, 0.0, 1.5), (0.0, 0.0001, 40.0), lens=14)
c.rotation_mode = 'XYZ'; c.rotation_euler = (math.pi, 0, 0)    # 正对天顶
H.box('ground', (S, S, 0.2), (0, 0, -0.1), slab)
bpy.context.scene.view_settings.exposure = 0.9
H.person((2.6, 3.2, 3 * FH), 0)
H.render(out, w, h, spp)
