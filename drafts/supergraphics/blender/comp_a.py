# 构图 A · 厂房纵深：一个巨大的红色正圆刷在柱子、屋架、地面和尽头墙上，从这里看是完美的圆；圆心里尽头站着一个人。
# /home/user/bpyenv/bin/python comp_a.py out.png [宽 高 采样]
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import hall as H

out = sys.argv[1] if len(sys.argv) > 1 else '/tmp/a.png'
w, h, spp = (int(v) for v in (sys.argv[2:5] if len(sys.argv) > 4 else (960, 540, 64)))
H.reset()
RED = (0.86, 0.012, 0.006)
paint = H.window_paint(H.disc_masks(0.0, -0.165, [(0.30, 0, 0)]), [RED])
mats = {
    'wall': H.pbr('wall', 'Plaster007', 0.35, tint=(0.95, 0.93, 0.88), paint=paint),
    'floor': H.pbr('floor', 'Concrete034', 0.18, tint=(0.62, 0.6, 0.57), rough_mul=0.55, paint=paint),
    'steel': H.pbr('steel', 'Metal064', 0.6, tint=(0.7, 0.66, 0.62), paint=paint),
    'wood': H.pbr('wood', 'Planks037A', 0.3, tint=(0.8, 0.75, 0.7), paint=paint),
}
H.hall(mats)
H.person((0.0, 63.0, 0.0), 0)
H.lights(sun_dir=(-0.62, 0.28, 0.42), sun_strength=10.0, sky_strength=1.6, haze=0.007, bounds=((-9, -2, 0), (9, 64, 14)))
c = H.camera((0.0, -1.5, 1.7), (0.0, 60.0, 1.7), lens=30)
c.data.shift_y = 0.12
import bpy; bpy.context.scene.view_settings.exposure = 1.1
H.render(out, w, h, spp)
