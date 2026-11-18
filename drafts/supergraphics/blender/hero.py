# 超级平面 · 第二版风格图：旧厂房里一个红色正圆。
#   hero  —— 站在对点的位置：完美的圆，圆心是尽头的门洞，一个人站在门洞的光里
#   reveal —— 同一座厂房换个角度：圆碎成柱子、屋架、地面、墙上的红色碎块
# /home/user/bpyenv/bin/python hero.py <hero|reveal> out.png [宽 高 采样]
import sys, os, math; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import hall as H, bpy
mode = sys.argv[1]; out = sys.argv[2]
w, h, spp = (int(v) for v in (sys.argv[3:6] if len(sys.argv) > 5 else (960, 540, 32)))
H.reset()
RED = (0.86, 0.012, 0.006)
CAM = dict(pos=(0.0, -1.5, 1.7), look=(0.0, 60.0, 1.7), lens=30, shift_y=0.12)
paint = H.window_paint(H.disc_masks(0.0, -0.165, [(0.30, 0, 0)]), [RED], proj=CAM)
mats = {
    'wall': H.pbr('wall', 'Plaster007', 0.35, tint=(0.95, 0.93, 0.88), paint=paint),
    'floor': H.pbr('floor', 'Concrete034', 0.18, tint=(0.62, 0.6, 0.57), rough_mul=0.55, paint=paint, puddle=1.0),
    'steel': H.pbr('steel', 'Metal064', 0.6, tint=(0.7, 0.66, 0.62), paint=paint),
    'wood': H.pbr('wood', 'Planks037A', 0.3, tint=(0.8, 0.75, 0.7), paint=paint),
}
H.hall(mats)
# 一点旧东西：靠墙的木托盘、几块碎砖、一根倒在地上的木梁（都在漆的投影范围里，会被刷上）
pal = mats['wood']
for i, (x, y, rz) in enumerate([(-7.6, 14, 0.1), (-7.4, 15.4, -0.05), (7.5, 27, 0.2), (7.7, 44, 0), (-7.5, 38, 0.3)]):
    for k in range(3): H.box(f'pal{i}{k}', (1.2, 1.0, 0.04), (x, y, 0.06 + k * 0.16), pal, rot=(0, 0, rz))
    for k in range(3): H.box(f'palb{i}{k}', (1.2, 0.1, 0.1), (x, y - 0.45 + k * 0.45, 0.05), pal, rot=(0, 0, rz))
H.beam('fallen', (2.5, 20, 0.12), (5.8, 23.5, 0.12), 0.24, 0.24, mats['steel'])
for i, (x, y) in enumerate([(-3.1, 9.0), (-2.6, 9.4), (3.9, 17.0), (-4.4, 31.0), (1.8, 46.0)]):
    H.box(f'brick{i}', (0.22, 0.11, 0.07), (x, y, 0.035), mats['wall'], rot=(0, 0, i * 0.7))
H.person((0.0, 63.0, 0.0), 0)
H.lights(sun_dir=(-0.62, 0.28, 0.42), sun_strength=10.0, sky_strength=1.6, haze=0.0085, bounds=((-9, -2, 0), (9, 64, 14)))
if mode == 'hero':
    c = H.camera(CAM['pos'], CAM['look'], lens=CAM['lens']); c.data.shift_y = CAM['shift_y']
    bpy.context.scene.view_settings.exposure = 1.1
else:
    c = H.camera((-6.6, 10.0, 1.65), (2.6, 36.0, 3.6), lens=24)
    bpy.context.scene.view_settings.exposure = 1.2
H.render(out, w, h, spp)
