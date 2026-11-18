# 构图 C · 字：同一座厂房，“超级平面”四个明黄大字刷在柱子、地面、屋架和尽头墙上，从这里看可以读。
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import hall as H, bpy
from PIL import Image, ImageDraw, ImageFont
out = sys.argv[1] if len(sys.argv) > 1 else '/tmp/c.png'
w, h, spp = (int(v) for v in (sys.argv[2:5] if len(sys.argv) > 4 else (960, 540, 64)))
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
mask = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets', 'mask_c.png')
im = Image.new('L', (3840, 2160), 0); d = ImageDraw.Draw(im)
f = ImageFont.truetype(os.path.join(ROOT, 'public/fonts/NotoSansSC-Black.otf'), 760)
d.text((1920, 1240), '超级平面', font=f, fill=255, anchor='mm'); im.save(mask)
H.reset()
YEL = (1.0, 0.62, 0.0)
paint = H.window_paint(H.image_masks(mask, 0), [YEL])
mats = {
    'wall': H.pbr('wall', 'Plaster007', 0.35, tint=(0.95, 0.93, 0.88), paint=paint),
    'floor': H.pbr('floor', 'Concrete034', 0.18, tint=(0.62, 0.6, 0.57), rough_mul=0.55, paint=paint),
    'steel': H.pbr('steel', 'Metal064', 0.6, tint=(0.7, 0.66, 0.62), paint=paint),
    'wood': H.pbr('wood', 'Planks037A', 0.3, tint=(0.8, 0.75, 0.7), paint=paint),
}
H.hall(mats)
H.person((1.2, 40.0, 0.0), 0)
H.lights(sun_dir=(-0.62, 0.28, 0.42), sun_strength=10.0, sky_strength=1.6, haze=0.007, bounds=((-9, -2, 0), (9, 64, 14)))
c = H.camera((0.0, -1.5, 1.7), (0.0, 60.0, 1.7), lens=30); c.data.shift_y = 0.12
bpy.context.scene.view_settings.exposure = 1.1
H.render(out, w, h, spp)
