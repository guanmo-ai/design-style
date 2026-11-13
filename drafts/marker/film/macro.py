"""马克笔 v5 · 开场的微距（放大 40 倍的一笔）。和 film.html 用同一个镜头（events.json 的 opening.cams），
画纸角上的那道试色条：纸的纤维、干了的蓝、刚落下的橙（叠出深的一档）、笔停过的那一团积墨和湿的反光、很浅的景深。
镜头往外拉到 XF0—XF1 之间和 film.html 渲出来的帧交叉淡化。每帧是帧号的纯函数。
python3 macro.py <帧目录>（会覆盖 0..XF1 帧；XF0..XF1 读同一目录里 film.html 渲好的帧来混合）"""
import json
import os
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from scipy import ndimage as nd
from scipy.spatial import cKDTree

HERE = Path(__file__).resolve().parent
FONTS = str(HERE.parents[2] / 'public' / 'fonts') + '/'
EV = json.loads((HERE / 'events.json').read_text())
OP = EV['opening']
W, H = 1920, 1080
XF0, XF1 = 70, 86
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
PAPER = np.array([0.985, 0.978, 0.955], np.float32)
Z0 = OP['Z0']


def camM(f):
    i = (f - OP['f0']) / OP['step']; i0 = int(np.floor(i)); u = i - i0
    a = np.array(OP['cams'][max(0, min(len(OP['cams']) - 1, i0))]); b = np.array(OP['cams'][max(0, min(len(OP['cams']) - 1, i0 + 1))])
    return a * (1 - u) + b * u


# —— 世界坐标里的噪声（值噪声 + 分形），这样放大缩小时纸纹跟着纸走 ——
def hash2(ix, iy, seed):
    h = (ix * 374761393 + iy * 668265263 + seed * 2147483647) & 0xFFFFFFFF
    h = (h ^ (h >> 13)) * 1274126177 & 0xFFFFFFFF
    return ((h ^ (h >> 16)) & 0xFFFF) / 65535.0


def vnoise(X, Y, seed):
    ix, iy = np.floor(X).astype(np.int64), np.floor(Y).astype(np.int64); fx, fy = X - ix, Y - iy
    fx, fy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    a, b, c, d = hash2(ix, iy, seed), hash2(ix + 1, iy, seed), hash2(ix, iy + 1, seed), hash2(ix + 1, iy + 1, seed)
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy - 0.5


def fbm(X, Y, seed, oct=4):
    s, a, t = 0, 1.0, 0
    for o in range(oct):
        s += a * vnoise(X * 2 ** o, Y * 2 ** o, seed + o); t += a; a *= .5
    return s / t


# 纸纤维：试色条附近撒一些短纤维（世界坐标）
R = np.random.default_rng(5)
FIB = [(R.uniform(1300, 1720), R.uniform(780, 1010), R.uniform(0, np.pi), R.uniform(1.2, 6.0), R.uniform(.4, 1)) for _ in range(4200)]
SW = OP['swatch']


def stroke_field(Ps, w, Minv_scale, M, seed, pool=None, tt=0):
    """返回墨的浓度（0..1.35）。Ps 世界坐标的折线；在屏幕上算距离，再换成世界单位"""
    z = Minv_scale
    S = np.array([[M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]] for x, y in Ps], np.float32)
    seg = []
    for i in range(len(S) - 1):
        n = max(2, int(np.hypot(*(S[i + 1] - S[i])) / 2)); t = np.linspace(0, 1, n, endpoint=False)[:, None]; seg.append(S[i] + (S[i + 1] - S[i]) * t)
    seg.append(S[-1:]); D = np.concatenate(seg)
    # 距离场很平滑：在半分辨率上算，再放大（快 4 倍）
    hy, hx = np.mgrid[0:H:2, 0:W:2].astype(np.float32) + .5
    tree = cKDTree(D); dist, idx = tree.query(np.stack([hx.ravel(), hy.ravel()], 1), workers=-1)
    dist = dist.reshape(hx.shape); idx = idx.reshape(hx.shape)
    Tg = D[np.clip(idx + 1, 0, len(D) - 1)] - D[np.clip(idx - 1, 0, len(D) - 1)]; Tg /= (np.linalg.norm(Tg, axis=2, keepdims=True) + 1e-6)
    rel = np.dstack([hx, hy]) - D[idx]
    across = (Tg[..., 0] * rel[..., 1] - Tg[..., 1] * rel[..., 0])
    # 有符号距离：放大前把“哪一边”乘进去，放大以后在线上也是连续的
    up = lambda A: nd.zoom(A, (H / A.shape[0], W / A.shape[1]), order=1)[:H, :W]
    across = up(across) / z; dist = np.abs(up(np.sign(across[::2, ::2] if False else 1) * dist)) / z
    return dist, across, None


def frame(f):
    M = camM(f); a, b, c, d, e, g = M; det = a * d - b * c
    z = np.sqrt(abs(det))
    # 屏幕 → 世界
    Xw = (d * (xx - e) - c * (yy - g)) / det; Yw = (-b * (xx - e) + a * (yy - g)) / det
    tooth = fbm(Xw * 2.2, Yw * 2.2, 3) * 1.6 + fbm(Xw * .5, Yw * .5, 9) * 1.0
    fade_fib = np.clip((z - 8) / 5, 0, 1)
    fade_tooth = np.clip((z - 5.5) / 5, 0, 1)
    fibimg = Image.new('L', (W, H), 0); fd = ImageDraw.Draw(fibimg)
    if fade_fib > 0:
        for x, y, ang, l, k in FIB:
            p = (a * x + c * y + e, b * x + d * y + g)
            if -200 < p[0] < W + 200 and -200 < p[1] < H + 200:
                q = (p[0] + (a * np.cos(ang) + c * np.sin(ang)) * l, p[1] + (b * np.cos(ang) + d * np.sin(ang)) * l)
                fd.line([p, q], fill=int(255 * k), width=max(1, int(0.07 * z)))
        fib = nd.gaussian_filter(np.asarray(fibimg, np.float32) / 255, 0.8 + 0.03 * z) * fade_fib
    else:
        fib = np.zeros((H, W), np.float32)
    tooth = (tooth + 0.9 * fib) * fade_tooth

    img = np.ones((H, W, 3), np.float32) * PAPER
    img *= (1 - 0.045 * np.clip(tooth, -2, 2)[..., None])

    def ink(sw, seed, pool=None):
        dist, across, u = stroke_field(sw['P'], sw['w'], z, M, seed)
        w = sw['w']
        edge = w / 2 + 0.35 * tooth + 0.45 * fbm(Xw * 1.2, Yw * 1.2, seed) + 0.9 * fbm(Xw * .25, Yw * .25, seed + 1)
        sharp = max(0.06, 1.6 / z)
        core = np.clip((edge - dist) / sharp, 0, 1)
        bleed = np.clip((edge + .9 + .8 * np.clip(fib - .2, 0, 2) - dist) / .7, 0, 1) * .26
        r1 = np.random.default_rng(seed + 3).standard_normal(6000).astype(np.float32)
        s1 = nd.gaussian_filter1d(r1, 3.0) * 2.2 + nd.gaussian_filter1d(r1, 11.0) * 3.0; s1 = (s1 - s1.mean()) / s1.std()
        streak = 0.86 + 0.10 * np.tanh(np.interp(across, np.linspace(-60, 60, 6000), s1))
        dens = np.maximum(core * streak, bleed) * (1 - 0.05 * tooth)
        a2 = np.abs(across) / (w / 2)
        dens = np.clip(dens + 0.22 * np.exp(-((a2 - 0.97) / 0.05) ** 2) * core, 0, 1)
        if pool is not None:
            px, py, r = pool; dp = np.hypot(Xw - px, Yw - py)
            pe = r + 0.35 * tooth + 0.7 * fbm(Xw * .9, Yw * .9, seed + 5) + 1.1 * fbm(Xw * .2, Yw * .2, seed + 6)
            pm = np.clip((pe - dp) / sharp, 0, 1); pb = np.clip((pe + 1 - dp) / .7, 0, 1) * .3
            ring = np.exp(-((dp / pe - .95) / .045) ** 2)
            dens = np.clip(np.maximum(dens, pb) + pm * (0.42 + 0.35 * ring), 0, 1.35)
        return dens

    def mult(img, dens, col, alpha):
        col = np.array([int(col[i:i + 2], 16) / 255 for i in (1, 3, 5)], np.float32)
        return img * (1 - alpha * dens[..., None] * (1 - col))

    blue = ink(SW[0], 11)
    rp = 16.5 * (0.94 + 0.06 * (1 - np.exp(-(f + 8) / 22)))                  # 积墨还在慢慢往外渗
    oran = ink(SW[1], 21, pool=(OP['pool'][0], OP['pool'][1], rp))
    img = mult(img, blue, SW[0]['color'], 0.62)
    img = mult(img, oran, SW[1]['color'], 0.86)
    # 湿的反光
    hgt = nd.gaussian_filter(np.clip(oran, 0, 1.35), 0.6 * z) * 2.4 * z
    gy, gx = np.gradient(hgt)
    nv = np.dstack([-gx, -gy, np.ones_like(hgt)]); nv /= np.linalg.norm(nv, axis=2, keepdims=True)
    lx, ly = -0.55 + 0.04 * np.sin(f * .21), -0.7
    L = np.array([lx, ly, 0.45]); L /= np.linalg.norm(L); Hh = (L + [0, 0, 1]); Hh /= np.linalg.norm(Hh)
    dryness = np.clip(1 - (np.hypot(Xw - OP['pool'][0], Yw - OP['pool'][1]) - 6) / 40, 0, 1)   # 离积墨远的地方已经干了
    spec = np.clip((nv * Hh).sum(2), 0, 1) ** 90 * np.clip(oran - .2, 0, 1) * dryness
    img = np.clip(img + 0.75 * spec[..., None] + 0.35 * nd.gaussian_filter(spec, 6)[..., None], 0, 1)
    # 景深：放大越多越浅
    dof = np.clip((z - 4) / 12, 0, 1)
    if dof > 0:
        pp = (a * OP['pool'][0] + c * OP['pool'][1] + e, b * OP['pool'][0] + d * OP['pool'][1] + g)
        focus = np.abs((yy - pp[1]) * 0.9 + (xx - pp[0]) * 0.25) / 520
        k = (np.clip(focus - 0.25, 0, 1) ** 1.4 * dof)[..., None]
        blur = np.dstack([nd.gaussian_filter(img[..., j], 11) for j in range(3)])
        img = img * (1 - k) + blur * k
    # 纸的边、桌面、纸的影子（和 film.html 的 sheet() 对上：影子是屏幕像素，blur 70、往下 26）
    sh = OP['sheet']; cr, sr = np.cos(sh['rot']), np.sin(sh['rot'])
    lx_, ly_ = Xw - sh['cx'], Yw - sh['cy']; ux, uy = cr * lx_ + sr * ly_, -sr * lx_ + cr * ly_
    inside = ((np.abs(ux) <= sh['w'] / 2) & (np.abs(uy) <= sh['h'] / 2)).astype(np.float32)
    inside = nd.gaussian_filter(inside, 0.6)
    desk = np.array([int(OP['desk'][i:i + 2], 16) / 255 for i in (1, 3, 5)], np.float32)
    shadow = nd.gaussian_filter(nd.shift(inside, (26, 0), order=0), 35) * .55
    deskimg = np.ones((H, W, 3), np.float32) * desk * (1 - shadow[..., None])
    img = img * inside[..., None] + deskimg * (1 - inside[..., None])
    # 场景光（film.html：径向渐变，中心在世界 (820, 380)，半径 200—1500 个世界单位）
    dw = np.hypot(Xw - 820, Yw - 380); t = np.clip((dw - 200) / 1300, 0, 1)
    al = np.where(t < .5, .10, .10 + (t - .5) / .5 * .52)
    colr = np.where(t[..., None] < .5, np.array([255, 200, 120]) / 255 * (1 - t[..., None] * 2) + np.array([12, 10, 8]) / 255 * (t[..., None] * 2), np.array([12, 10, 8]) / 255)
    img = img * (1 - al[..., None]) + colr * al[..., None]
    return np.clip(img, 0, 1), z


def nib(im, f):
    """开场的头几帧：笔头刚抬起来，从画面右上角离开（很虚）"""
    if f > 18: return im
    u = (f + 7) / 24; u = u * u
    M = camM(f); px = M[0] * OP['pool'][0] + M[2] * OP['pool'][1] + M[4]; py = M[1] * OP['pool'][0] + M[3] * OP['pool'][1] + M[5]
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0)); dl = ImageDraw.Draw(lay)
    cx, cy = px + 260 + 1500 * u, py - 300 - 900 * u
    s = 0.8 + .3 * u
    poly = [(cx - 300 * s, cy + 90 * s), (cx + 120 * s, cy - 260 * s), (cx + 420 * s, cy - 120 * s), (cx + 40 * s, cy + 230 * s)]
    dl.polygon(poly, fill=(214, 82, 40, 235))
    dl.polygon([(cx + 120 * s, cy - 260 * s), (cx + 900 * s, cy - 900 * s), (cx + 1300 * s, cy - 500 * s), (cx + 420 * s, cy - 120 * s)], fill=(222, 222, 226, 240))
    lay = lay.filter(ImageFilter.GaussianBlur(40))
    im = im.convert('RGBA'); im.alpha_composite(lay); return im.convert('RGB')


def text(im, f, z):
    al = min(1, max(0, (f - 4) / 10)) * (1 - min(1, max(0, (f - 64) / 14)))
    if al <= 0: return im
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    f1 = ImageFont.truetype(FONTS + 'NotoSansSC-Bold.otf', 112); f2 = ImageFont.truetype(FONTS + 'JetBrainsMono.ttf', 40)
    t = '放大 40 倍的一笔马克笔'; n = int(min(len(t), max(0, (f - 6) / 1.8)))
    d.text((90, 820), t[:n], font=f1, fill=(31, 33, 38, int(255 * al)))
    mag = max(1, round(40 * z / Z0))
    d.text((96, 970), f'× {mag:>2} · ALCOHOL INK · 0.1 S', font=f2, fill=(60, 63, 70, int(255 * al)))
    im = im.convert('RGBA'); im.alpha_composite(lay); return im.convert('RGB')


def render(f):
    sub = 1 if f < 50 else 2
    acc = None
    for i in range(sub):
        fs = f + ((i + .5) / sub - .5) * .5 if sub > 1 else f
        img, z = frame(fs)
        acc = img if acc is None else acc + img
    img = acc / sub
    im = Image.fromarray((img * 255).astype(np.uint8))
    im = nib(im, f); im = text(im, f, z)
    return im


if __name__ == '__main__':
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    fr = range(int(sys.argv[2]), int(sys.argv[3])) if len(sys.argv) > 3 else range(0, XF1)
    for f in fr:
        p = f'{out}/{f:04d}.jpg'
        im = render(f)
        if f >= XF0:
            k = (f - XF0) / (XF1 - XF0); k = k * k * (3 - 2 * k)
            cv = Image.open(f'{out}/canvas-{f:04d}.jpg') if os.path.exists(f'{out}/canvas-{f:04d}.jpg') else Image.open(p)
            im = Image.blend(im, cv.convert('RGB'), k)
        im.save(p, quality=95)
        print(f, flush=True)
