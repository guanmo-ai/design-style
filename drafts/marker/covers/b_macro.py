"""封面方向 B：放大 40 倍的一笔马克笔。纸的纤维、干了的蓝色一笔、刚落下的橙色一笔压在上面（叠出深的一档），
橙色这一笔的笔头刚停过——末端一团积墨，湿的地方有反光；景深很浅，像微距镜头。python3 b_macro.py <out.jpg>"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as nd

out = sys.argv[1]
FONTS = __file__.rsplit('/drafts/', 1)[0] + '/public/fonts/'
W, H = 1920, 1080
rng = np.random.default_rng(7)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)


def noise(scale, seed, aniso=(1, 1)):
    r = np.random.default_rng(seed).standard_normal((H, W)).astype(np.float32)
    return nd.gaussian_filter(r, (scale * aniso[0], scale * aniso[1]))


# —— 纸：纤维 + 颗粒（高度图）——
fib = np.zeros((H, W), np.float32)
for _ in range(2600):
    x, y, a, l = rng.uniform(0, W), rng.uniform(0, H), rng.uniform(0, np.pi), rng.uniform(20, 120)
    n = int(l); t = np.linspace(0, 1, n)
    px = (x + np.cos(a) * l * t).astype(int); py = (y + np.sin(a) * l * t).astype(int)
    ok = (px >= 0) & (px < W) & (py >= 0) & (py < H); fib[py[ok], px[ok]] += rng.uniform(.4, 1)
fib = nd.gaussian_filter(fib, 1.6)
tooth = noise(2.2, 3) * 3 + noise(9, 4) * 6 + fib * 1.4
tooth = (tooth - tooth.mean()) / tooth.std()
paper = np.array([0.985, 0.978, 0.955], np.float32)


# —— 一笔：沿着一条弧线，扁头宽 w；纤维纹沿着走向；边上被纸纤维“吸”出毛边 ——
def stroke(p0, p1, bend, w, seed, pool=None):
    # 到弧线的距离（用很多点近似）
    t = np.linspace(0, 1, 400)[:, None]
    p0, p1 = np.array(p0, np.float32), np.array(p1, np.float32)
    nrm = np.array([-(p1 - p0)[1], (p1 - p0)[0]]); nrm /= np.linalg.norm(nrm)
    P = p0 + (p1 - p0) * t + nrm * bend * 4 * t * (1 - t)
    from scipy.spatial import cKDTree
    tree = cKDTree(P); pts = np.stack([xx.ravel(), yy.ravel()], 1)
    dist, idx = tree.query(pts, workers=-1); dist = dist.reshape(H, W); idx = idx.reshape(H, W); u = idx / 399.0
    Tg = P[np.clip(idx + 1, 0, 399)] - P[np.clip(idx - 1, 0, 399)]; Tg /= (np.linalg.norm(Tg, axis=2, keepdims=True) + 1e-6)
    rel = np.dstack([xx, yy]) - P[idx]
    across = Tg[..., 0] * rel[..., 1] - Tg[..., 1] * rel[..., 0]                 # 有符号的横向距离
    # 毛边：边上一点点被纸纤维吸开（很细），整体还是利落的
    edge = w / 2 + 2.5 * tooth + 3.5 * noise(6, seed) + 6 * noise(30, seed + 1)
    core = np.clip((edge - dist) / 1.6, 0, 1)
    bleed = np.clip((edge + 7 + 6 * np.clip(fib - .3, 0, 2) - dist) / 5, 0, 1) * 0.28    # 顺着纤维渗出去的一圈淡的
    # 纤维纹：只跟横向位置有关 → 条纹顺着笔走
    r1 = np.random.default_rng(seed + 3).standard_normal(4000).astype(np.float32)
    s1 = nd.gaussian_filter1d(r1, 3.0) * 2.2 + nd.gaussian_filter1d(r1, 11.0) * 3.0
    s1 = (s1 - s1.mean()) / s1.std()
    streak = 0.86 + 0.10 * np.tanh(np.interp(across, np.linspace(-2000, 2000, 4000), s1))
    # 墨量随走向慢慢变：起笔重、中间轻
    along = 0.92 + 0.08 * np.cos(np.pi * u)
    dens = np.maximum(core * streak * along, bleed) * (1 - 0.05 * tooth)
    a2 = np.abs(across) / (w / 2)
    wet_edge = np.exp(-((a2 - 0.97) / 0.05) ** 2) * core
    dens = np.clip(dens + 0.22 * wet_edge, 0, 1)
    if pool is not None:                                                # 笔停过的地方：一团圆的积墨，边上一圈更深（像咖啡渍）
        cx, cy, r = pool; dp = np.hypot(xx - cx, yy - cy)
        pe = r + 3 * tooth + 6 * noise(8, seed + 5) + 10 * noise(40, seed + 6)
        pm = np.clip((pe - dp) / 1.8, 0, 1); pb = np.clip((pe + 9 - dp) / 6, 0, 1) * 0.3
        ring = np.exp(-((dp / pe - .95) / .045) ** 2)
        dens = np.clip(np.maximum(dens, pb) + pm * (0.42 + 0.35 * ring), 0, 1.35)
    return dens, dist, u


blue, _, _ = stroke((-200, 1250), (2100, -150), 160, 640, 11)
oran, odist, ou = stroke((-150, 180), (1260, 640), -90, 520, 21, pool=(1240, 640, 300))
oran = np.where(xx > 1560, 0, oran)                                      # 笔还没走到右边

def mult(base, dens, col, alpha):
    col = np.array(col, np.float32)
    return base * (1 - alpha * dens[..., None] * (1 - col))

img = np.ones((H, W, 3), np.float32) * paper
img *= (1 - 0.035 * np.clip(tooth, -2, 2)[..., None])                   # 纸的颗粒
img = mult(img, blue, (0.23, 0.45, 0.89), 0.62)
img = mult(img, np.clip(oran, 0, 1.3), (0.94, 0.39, 0.18), 0.86)

# —— 湿的反光：只在刚落下的橙色上；墨厚度当高度，灯在左上 ——
hgt = nd.gaussian_filter(np.clip(oran, 0, 1.35), 10) * 40
gy, gx = np.gradient(hgt)
nv = np.dstack([-gx, -gy, np.ones_like(hgt)]); nv /= np.linalg.norm(nv, axis=2, keepdims=True)
L = np.array([-0.55, -0.7, 0.45]); L /= np.linalg.norm(L); Hh = (L + [0, 0, 1]) / np.linalg.norm(L + [0, 0, 1])
spec = np.clip((nv * Hh).sum(2), 0, 1) ** 90 * np.clip(oran - .2, 0, 1) * (xx > 700)
soft = nd.gaussian_filter(spec, 6)
img = np.clip(img + 0.75 * spec[..., None] + 0.35 * soft[..., None], 0, 1)

# —— 景深：只有一条斜带是清楚的 ——
focus = np.abs((yy - 560) * 0.9 + (xx - 960) * 0.25) / 520
blur = np.dstack([nd.gaussian_filter(img[..., k], 11) for k in range(3)])
k = np.clip(focus - 0.25, 0, 1)[..., None] ** 1.4
img = img * (1 - k) + blur * k
# 暗角
v = 1 - 0.35 * np.clip((np.hypot(xx - 960, yy - 540) / 1100) ** 2, 0, 1)
img *= v[..., None]

im = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8))
d = ImageDraw.Draw(im)
f1 = ImageFont.truetype(FONTS + 'NotoSansSC-Bold.otf', 112); f2 = ImageFont.truetype(FONTS + 'JetBrainsMono.ttf', 36)
d.text((90, 820), '放大 40 倍的一笔马克笔', font=f1, fill='#1F2126')
d.text((96, 970), '× 40 · ALCOHOL INK · 0.1 S', font=f2, fill='#3C3F46')
im.save(out, quality=93)
print('wrote', out)
