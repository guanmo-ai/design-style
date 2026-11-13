"""封面方向 C：一叠马克笔效果图被拇指翻开——几十张、每张都不一样，最上面一张正翻过去（带运动模糊）。
python3 c_flipbook.py <帧目录> <out.jpg>（帧取自成片的逐帧图）"""
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

src, out = sys.argv[1], sys.argv[2]
FONTS = __file__.rsplit('/drafts/', 1)[0] + '/public/fonts/'
W, H = 1920, 1080
frames = [1159, 868, 722, 522, 372, 188, 1000, 800, 640, 470, 300, 120, 1159, 868, 722, 522, 372, 188]
bg = Image.new('RGB', (W, H), '#1E1F23')
d = ImageDraw.Draw(bg)
for i in range(0, W, 3):                                   # 桌面：深色、一点木纹
    d.line([(i, 0), (i + 60, H)], fill=(30 + (i * 7) % 6, 31 + (i * 5) % 5, 35), width=3)
bg = bg.filter(ImageFilter.GaussianBlur(2))
CW, CH = 980, 520
piv = (330, 1000)                                          # 拇指在左下角按住


def card(f):
    im = Image.open(f'{src}/{f:04d}.jpg'); im = im.crop((0, 110, 1920, 1080)).resize((CW - 28, CH - 28))
    c = Image.new('RGBA', (CW, CH), (251, 250, 246, 255)); c.paste(im, (14, 14)); return c


def place(base, c, ang, dx, dy, blur=0, sh=.45):
    big = Image.new('RGBA', (W * 2, H * 2), (0, 0, 0, 0))
    ox, oy = W - piv[0] + piv[0], H - piv[1] + piv[1]
    big.paste(c, (W + piv[0] - 40 + dx, H + piv[1] - CH + 40 + dy))
    big = big.rotate(ang, center=(W + piv[0], H + piv[1]), resample=Image.BICUBIC)
    big = big.crop((W, H, W * 2, H * 2))
    if blur: big = big.filter(ImageFilter.GaussianBlur(blur))
    a = big.split()[3]
    shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0)); shadow.putalpha(a.point(lambda v: int(v * sh)).filter(ImageFilter.GaussianBlur(22)))
    base.alpha_composite(shadow, (18, 26)); base.alpha_composite(big)


base = bg.convert('RGBA')
n = 14
for i in range(n):                                          # 底下一叠：越往上翻得越开
    ang = 2 + i * 3.2
    place(base, card(frames[i % len(frames)]), ang, int(i * 6), int(-i * 2))
place(base, card(frames[n % len(frames)]), 58, 40, -30, blur=5, sh=.3)   # 正在翻过去的一张
place(base, card(188), 1, 0, 0)                   # 最下面压着的（看得最清楚）

im = base.convert('RGB')
dd = ImageDraw.Draw(im)
f1 = ImageFont.truetype(FONTS + 'NotoSansSC-Bold.otf', 120); f2 = ImageFont.truetype(FONTS + 'LongCang-Regular.ttf', 72)
dd.text((1330, 120), '15 秒', font=f1, fill='#FBFAF6')
dd.text((1330, 270), '30 张', font=f1, fill='#F0642E')
dd.text((1336, 420), '马克笔效果图', font=f2, fill='#FBFAF6')
im.save(out, quality=93)
print('wrote', out)
