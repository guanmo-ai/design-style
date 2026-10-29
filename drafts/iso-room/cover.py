"""等距微缩房间 · 第 0 帧（1920×1080）：一间剖开的小屋，夜里台灯和屏幕亮着，豆袋沙发正“扑”地落下来。
python3 cover.py && node ../_lib/shot.cjs cover.html png/cover.png"""
import sys

sys.path.insert(0, '../_lib')
from poly3d import Camera, Scene, render  # noqa: E402
from room import build  # noqa: E402

S = Scene()
build(S)
cam = Camera(eye=(6 + 50, 3 + 42, 6 + 50), target=(6, 3.4, 6), ortho=17)
body = render(S, cam, light=(0.35, 0.75, 0.55), sun='#FFD9A8', sky='#B9A8FF', ground='#6B4E6A', amb=0.62)
W, H = 1920, 1080
lamp = cam.proj((5.45, 4.3, 1.05)); scr = cam.proj((0.7, 4.0, 3.2)); bag = cam.proj((5.5, 0.06, 8.6))
def poly(pts):
    return ' '.join(f'{cam.proj(p)[0]:.0f},{cam.proj(p)[1]:.0f}' for p in pts)
beam = poly([(0.1, 3.0, 6.4), (0.1, 3.0, 10.8), (6.8, 0.03, 12.0), (6.8, 0.03, 7.4)])
beam_floor = poly([(1.4, 0.03, 6.6), (1.4, 0.03, 10.8), (6.8, 0.03, 12.0), (6.8, 0.03, 7.6)])
pool = cam.proj((5.45, 0.03, 1.05))
html = f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:Inter;src:url(../../public/fonts/Inter.ttf);font-weight:100 900}}
@font-face{{font-family:NotoSC;src:url(../../public/fonts/NotoSansSC-Black.otf);font-weight:900}}
html,body{{margin:0;width:{W}px;height:{H}px;overflow:hidden;background:radial-gradient(circle at 50% 55%,#3B2F6E,#1A1433 75%)}}
.lab{{position:absolute;color:#F4EEFF}}
</style>
<svg width="{W}" height="{H}" style="position:absolute;left:0;top:0">
<defs><radialGradient id="warm"><stop offset="0" stop-color="#FFC56B" stop-opacity=".55"/><stop offset="1" stop-color="#FFC56B" stop-opacity="0"/></radialGradient>
<radialGradient id="cool"><stop offset="0" stop-color="#6FD6FF" stop-opacity=".45"/><stop offset="1" stop-color="#6FD6FF" stop-opacity="0"/></radialGradient>
<filter id="bl"><feGaussianBlur stdDeviation="8"/></filter></defs>
{body}
<ellipse cx="{bag[0]:.0f}" cy="{bag[1]:.0f}" rx="70" ry="34" fill="#2a1d3a" opacity=".35" filter="url(#bl)"/>
<polygon points="{beam}" fill="#B9C6FF" opacity=".10"/><polygon points="{beam_floor}" fill="#C9D4FF" opacity=".16"/>
<ellipse cx="{pool[0]:.0f}" cy="{pool[1]:.0f}" rx="260" ry="130" fill="url(#warm)" style="mix-blend-mode:screen"/>
<g style="mix-blend-mode:screen"><circle cx="{lamp[0]:.0f}" cy="{lamp[1] + 60:.0f}" r="330" fill="url(#warm)"/><circle cx="{scr[0]:.0f}" cy="{scr[1]:.0f}" r="220" fill="url(#cool)"/></g>
</svg>
<div class="lab" style="left:64px;top:56px;font:900 86px/1 NotoSC;letter-spacing:.06em">等距微缩</div>
<div class="lab" style="left:68px;top:156px;font:800 24px Inter;letter-spacing:.4em">ISOMETRIC DIORAMA</div>
'''
open('cover.html', 'w').write(html)
