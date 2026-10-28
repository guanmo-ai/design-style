"""
液态玻璃的“镜片”生成器：给一个形状（有向距离场 SDF），算出两张贴图——

  map      位移贴图（R = x 方向、G = y 方向，0.5 = 不动；A = 形状本身，当遮罩用）
           交给 SVG 的 feDisplacementMap：玻璃后面的内容按它弯过来
  overlay  玻璃自己的光：边缘高光（迎光的一侧亮）、背光一侧的暗边、一层极淡的底色、玻璃外的投影

一条物理规则贯穿全部：**折射量 = 边缘的坡度**。
玻璃中间是平的，几乎不弯；越靠边越陡，弯得越狠——所以“玻璃感”全在边上那一圈（bevel）。

形状之间用 smooth-min 合并：两滴玻璃靠近时，会先长出一道“颈”，再融成一块。
"""
import base64
import io

import numpy as np
from PIL import Image

SS = 2  # 贴图按 2 倍密度生成，PNG 2x 输出时边缘也不糊


# ---------- 形状：返回“到边缘的距离”，里面为正 ----------

def sdf_round_rect(x, y, w, h, r):
    cx, cy = x + w / 2, y + h / 2

    def f(px, py):
        qx = np.abs(px - cx) - (w / 2 - r)
        qy = np.abs(py - cy) - (h / 2 - r)
        out = np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - r
        return -out
    return f


def sdf_circle(cx, cy, r):
    return lambda px, py: r - np.hypot(px - cx, py - cy)


def smooth_union(k, *fs):
    """多个形状的 smooth-min 合并（k 越大，颈越粗）。内部为正，所以对“外部距离”取 smin"""
    def f(px, py):
        d = -fs[0](px, py)
        for g in fs[1:]:
            e = -g(px, py)
            hh = np.clip(0.5 + 0.5 * (e - d) / k, 0, 1)
            d = e * (1 - hh) + d * hh - k * hh * (1 - hh)
        return -d
    return f


# ---------- 贴图 ----------

def _png_b64(arr):
    im = Image.fromarray(arr.astype(np.uint8), 'RGBA')
    buf = io.BytesIO()
    im.save(buf, 'PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()


def lens(sdf, bbox, bevel=40, edge=1.0, mag=0.06, scale=None, light=(-0.6, -0.8),
         tint=(255, 255, 255, 0.06), rim=0.85, shadow=0.20, pad=40):
    """
    bbox   (x, y, w, h)  形状所在范围（用户坐标）
    bevel  边缘那一圈的宽度（px）：坡从这里开始
    edge   边缘最大位移 = bevel × edge（px）
    mag    中间整体放大的比例（0.06 = 放大 6%）
    返回 dict：map / overlay 两张 data URI，以及它们的摆放范围和 feDisplacementMap 的 scale
    """
    x, y, w, h = bbox
    X0, Y0, W, H = x - pad, y - pad, w + 2 * pad, h + 2 * pad
    nx, ny = int(W * SS), int(H * SS)
    px = X0 + (np.arange(nx) + 0.5) / SS
    py = Y0 + (np.arange(ny) + 0.5) / SS
    PX, PY = np.meshgrid(px, py)
    d = sdf(PX, PY)

    # 法线：距离场的梯度（指向形状内部）
    gy, gx = np.gradient(d, 1 / SS)
    gl = np.hypot(gx, gy) + 1e-6
    inx, iny = gx / gl, gy / gl

    # 坡度：bevel 内按圆弧截面，越靠外越陡
    t = np.clip(1 - d / bevel, 0, 1)            # 0 = 平的内部，1 = 最外缘
    slope = t ** 2.4                              # 位移量
    cx, cy = x + w / 2, y + h / 2
    # 往“里面”取样 → 边缘被拉宽（像凸透镜）；中间再整体放大一点
    # feDisplacementMap：取样点 = P + scale·(C − 0.5)，这里的 (dx, dy) 就是这段偏移
    dx = inx * slope * bevel * edge - (PX - cx) * mag
    dy = iny * slope * bevel * edge - (PY - cy) * mag
    if scale is None:
        scale = 2 * max(np.abs(dx[d > 0]).max(initial=1), np.abs(dy[d > 0]).max(initial=1)) + 2
    inside = np.clip(d * SS + 0.5, 0, 1)          # 抗锯齿遮罩

    m = np.zeros((ny, nx, 4))
    m[..., 0] = np.clip(0.5 + dx / scale, 0, 1) * 255
    m[..., 1] = np.clip(0.5 + dy / scale, 0, 1) * 255
    m[..., 2] = 128
    m[..., 3] = inside * 255

    # ---- 玻璃自己的光 ----
    lx, ly = light
    ll = np.hypot(lx, ly)
    lx, ly = lx / ll, ly / ll
    facing = -(inx * lx + iny * ly)              # 外法线 = −inward；朝光 > 0
    band = np.exp(-np.maximum(d, 0) / 2.2) * inside          # 最外 2px 的细边
    wide = np.clip(1 - d / (bevel * 0.9), 0, 1) ** 3 * inside  # 整个 bevel 的柔光
    hi = np.clip(facing, 0, 1) ** 1.6 * (0.95 * band + 0.35 * wide) * rim
    hi += np.clip(-facing, 0, 1) ** 2 * band * 0.45 * rim      # 背光侧也有一点透出来的亮边
    lo = np.clip(-facing, 0, 1) * wide * 0.10                  # 背光侧轻微压暗
    tr, tg, tb, ta = tint
    a_tint = ta * inside

    # 投影：只画在玻璃外面，往下偏
    ds = sdf(PX, PY - 10)
    sh = shadow * np.exp(-np.maximum(-ds, 0) / 16) * (1 - inside) * (ds < 6)
    sh *= np.clip((ds + 30) / 30, 0, 1)

    # 合成：白光 / 暗边 / 底色 / 投影 → 预乘后转回普通 RGBA
    A = np.clip(hi + lo + a_tint + sh, 0, 1)
    R = (255 * hi + 0 * lo + tr * a_tint + 10 * sh) / np.maximum(A, 1e-6)
    Gc = (255 * hi + 0 * lo + tg * a_tint + 12 * sh) / np.maximum(A, 1e-6)
    B = (255 * hi + 0 * lo + tb * a_tint + 30 * sh) / np.maximum(A, 1e-6)
    o = np.stack([R, Gc, B, A * 255], -1)
    o = np.clip(o, 0, 255)

    return {
        'map': _png_b64(m), 'overlay': _png_b64(o), 'scale': scale,
        'x': X0, 'y': Y0, 'w': W, 'h': H,
    }


def svg_lens(lid, L, source='#bg', blur=0.0, chroma=0.06):
    """
    一块玻璃 = 一个滤镜（取后面的内容 → 按位移贴图弯 → R/G/B 各弯得略不一样（色散）→ 用形状遮住）
             + 一张光的贴图
    返回 (defs, body)
    """
    s = L['scale']
    box = f'x="{L["x"]:.1f}" y="{L["y"]:.1f}" width="{L["w"]:.1f}" height="{L["h"]:.1f}"'
    blur_fx = f'<feGaussianBlur in="rgb" stdDeviation="{blur}" result="rgb"/>' if blur else ''
    defs = (
        f'<filter id="{lid}" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" {box} '
        f'color-interpolation-filters="sRGB">'
        f'<feImage href="{L["map"]}" {box} preserveAspectRatio="none" result="map"/>'
        f'<feDisplacementMap in="SourceGraphic" in2="map" scale="{s * (1 + chroma):.2f}" xChannelSelector="R" yChannelSelector="G" result="dr"/>'
        f'<feDisplacementMap in="SourceGraphic" in2="map" scale="{s:.2f}" xChannelSelector="R" yChannelSelector="G" result="dg"/>'
        f'<feDisplacementMap in="SourceGraphic" in2="map" scale="{s * (1 - chroma):.2f}" xChannelSelector="R" yChannelSelector="G" result="db"/>'
        '<feColorMatrix in="dr" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/>'
        '<feColorMatrix in="dg" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g"/>'
        '<feColorMatrix in="db" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b"/>'
        '<feComposite in="r" in2="g" operator="arithmetic" k2="1" k3="1" result="rg"/>'
        '<feComposite in="rg" in2="b" operator="arithmetic" k2="1" k3="1" result="rgb0"/>'
        '<feColorMatrix in="rgb0" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0 1" result="rgb"/>'
        f'{blur_fx}'
        '<feComposite in="rgb" in2="map" operator="in"/>'
        '</filter>'
    )
    body = (
        f'<use href="{source}" filter="url(#{lid})"/>'
        f'<image href="{L["overlay"]}" {box} preserveAspectRatio="none"/>'
    )
    return defs, body
