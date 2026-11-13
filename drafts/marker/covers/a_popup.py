"""封面方向 A：纸上的马克笔手稿“站起来”——左边还贴在纸上，往右一点点鼓起来、离开纸面，纸上只剩蓝底和铅笔线。
输入：film.html 渲出来的三张图（flat / sketch / car，见 grab.cjs）；输出 1920×1080。python3 a_popup.py <输入目录> <out.jpg>"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy import ndimage as nd

src, out = sys.argv[1], sys.argv[2]
FONTS = __file__.rsplit('/drafts/', 1)[0] + '/public/fonts/'
sk = np.asarray(Image.open(f'{src}/sketch.png').convert('RGB'), np.float32) / 255
car = np.asarray(Image.open(f'{src}/car.png').convert('RGBA'), np.float32) / 255
H, W = sk.shape[:2]
paper = np.array([0xFB, 0xFA, 0xF6], np.float32) / 255
a = car[..., 3:4]
car_rgb = car[..., :3] * a + paper * (1 - a)              # 车画在白纸上的样子（透明墨）

# 车的轮廓：最大的连通块，填洞
m = car[..., 3] > 0.04
m = nd.binary_closing(m, iterations=6)
lab, n = nd.label(m); sizes = nd.sum(m, lab, range(1, n + 1)); m = lab == (np.argmax(sizes) + 1)
m = nd.binary_fill_holes(m)
m = nd.binary_opening(m, iterations=4)

# 鼓起来：边上圆，中间一点穹顶（充气的手感）
d = nd.distance_transform_edt(m)
R = 120.0
h = np.where(d < R, R * np.sqrt(np.clip(1 - (1 - d / R) ** 2, 0, 1)), R) + 0.18 * d
h = nd.gaussian_filter(h, 2.5)
gy, gx = np.gradient(h)
nrm = np.dstack([-gx * 2.2, -gy * 2.2, np.ones_like(h)]); nrm /= np.linalg.norm(nrm, axis=2, keepdims=True)
L = np.array([-0.5, -0.65, 0.58]); L /= np.linalg.norm(L)
V = np.array([0, 0, 1.0]); Hh = (L + V) / np.linalg.norm(L + V)
lam = np.clip((nrm * L).sum(2), 0, 1)
spec = np.clip((nrm * Hh).sum(2), 0, 1) ** 42
rim = (1 - np.clip(nrm[..., 2], 0, 1)) ** 1.6
ao = np.clip(d / 18, 0, 1) ** .5
shade = (0.42 + 0.78 * lam)[..., None] * (0.75 + 0.25 * ao[..., None])
lit = np.clip(car_rgb * shade + 0.75 * spec[..., None] + 0.12 * rim[..., None], 0, 1)

# 整辆车离开纸面：往上抬、车头微微翘起；纸上留下蓝底、铅笔线和地上的影子那一笔
sk2 = np.asarray(Image.open(f'{src}/shadow.png').convert('RGB'), np.float32) / 255
base = sk * sk2 / paper                                   # 两张纸上的东西相乘（马克笔本来就是相乘）
ys, xs = np.nonzero(m)
ang, lift, piv = np.deg2rad(-5.5), 150.0, (xs.max() - 120, ys.max())
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
c, s_ = np.cos(ang), np.sin(ang)
# 输出像素 → 车的原坐标（逆变换）
X0, Y0 = xx - piv[0], yy - piv[1] + lift
sx = c * X0 + s_ * Y0 + piv[0]; sy = -s_ * X0 + c * Y0 + piv[1]
mm = nd.map_coordinates(m.astype(np.float32), [sy, sx], order=1)
lit_w = np.dstack([nd.map_coordinates(lit[..., k], [sy, sx], order=1) for k in range(3)])
# 影子：落在纸上，离得越远越虚
shm = nd.map_coordinates(m.astype(np.float32), [sy - lift * 0.82, sx - 40], order=1)
sh = nd.gaussian_filter(shm, 26)
base = base * (1 - 0.5 * sh[..., None])
out_img = base * (1 - mm[..., None]) + lit_w * mm[..., None]
img = Image.fromarray((np.clip(out_img, 0, 1) * 255).astype(np.uint8))
# 暗角
vig = Image.new('L', (W, H), 0); dv = ImageDraw.Draw(vig); dv.ellipse((-300, -260, W + 300, H + 260), fill=255); vig = vig.filter(ImageFilter.GaussianBlur(160))
dark = Image.new('RGB', (W, H), (40, 30, 20)); img = Image.composite(img, Image.blend(img, dark, .35), vig)
d2 = ImageDraw.Draw(img)
f1 = ImageFont.truetype(FONTS + 'NotoSansSC-Bold.otf', 124); f2 = ImageFont.truetype(FONTS + 'LongCang-Regular.ttf', 74)
d2.text((96, 60), '画出来，它就站起来了', font=f1, fill='#1F2126')
d2.text((104, 212), '马克笔 · 一笔一层', font=f2, fill='#2148A8')
img.save(out, quality=93)
print('wrote', out)
