"""019 低多边形 · 第 4 章 · 落到界面：天气 App（本地 0—3.4 秒）。
上一章的小星球飞进手机，变成 App 图标；卡片里是一座会随天气换光的小山：晴 → 下雪。"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from poly3d import Camera, Scene, render  # noqa: E402
from common import *  # noqa: E402,F401,F403
import ch3_planet as C3  # noqa: E402

PX, PY, PW, PH = 1150, 70, 470, 940          # 手机屏幕


def mountain(snow, seed=3):
    S = Scene()
    def h(x, z):
        return max(0.0, 9 - math.hypot(x, z) * 0.9 + 1.5 * math.sin(x * 0.8 + seed))
    def col(x, y, z):
        if y > 6.2 - 2.2 * snow:
            return WHITE
        if y > 4.6:
            return PERI
        return [GRN, LGRN, YEL, MINT][int(abs(x * 3 + z)) % 4] if snow < 0.5 else ['#CFE4F2', WHITE, '#DCEAF4', LGRN][int(abs(x * 3 + z)) % 4]
    S.terrain(-12, -12, 24, 24, 12, 12, h, col, seed=seed)
    return S


def card_svg(t, w, h, snow):
    S = mountain(snow)
    a = 0.4 + t * 0.35
    cam = Camera(eye=(math.sin(a) * 22, 10, math.cos(a) * 22), target=(0, 3.5, 0), fov=44, W=w, H=h)
    body = render(S, cam, light=(-0.6, 0.6, -0.5), bands=(0.3, 0.12, 0.0), tint=SHADE, seam=0.8)
    flakes = ''
    if snow > 0:
        for k in range(26):
            fx = (k * 97 % w)
            fy = ((k * 53 + t * 140 * (1 + k % 3)) % (h + 40)) - 20
            r = 4 + k % 3 * 2
            flakes += f'<polygon points="{fx},{fy - r} {fx + r},{fy} {fx},{fy + r} {fx - r},{fy}" fill="#FFFFFF" opacity="{snow:.2f}"/>'
    sky = lambda a_, b_: f'<linearGradient id="cs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{a_}"/><stop offset="1" stop-color="{b_}"/></linearGradient>'
    top = '#' + ''.join(f'{round(int("8FB8F0"[i:i + 2], 16) * (1 - snow) + int("B8C4DE"[i:i + 2], 16) * snow):02x}' for i in (0, 2, 4))
    return f'<defs>{sky(top, "#FFF4E8")}</defs><rect width="{w}" height="{h}" rx="30" fill="url(#cs)"/>{body}{flakes}'


def icon_planet(t, size=84):
    S = Scene()
    for (tri, cen, col) in C3.MESH[1]:
        pts = [C3.rot_y(p, t * 1.5) for p in tri]
        S.tri(*[(p[0] * 3, p[1] * 3, p[2] * 3) for p in pts], col)
    cam = Camera(eye=(0, 1.5, 11), target=(0, 0, 0), fov=40, W=size, H=size)
    return render(S, cam, light=(-0.6, 0.6, 0.5), bands=(0.3, 0.12, 0.0), tint=SHADE, seam=0.6)


def tiny(kind, size=56):
    S = Scene()
    if kind == 'sun':
        S.ico(0, 0, 0, 1.4, YEL, jitter=0)
    elif kind == 'cloud':
        S.ico(-0.6, 0, 0, 1.0, WHITE, jitter=0); S.ico(0.7, 0.2, 0, 1.2, WHITE, jitter=0)
    else:
        S.ico(0, 0.2, 0, 1.2, '#DCEAF4', jitter=0)
    cam = Camera(eye=(0, 1.5, -8), target=(0, 0, 0), fov=40, W=size, H=size)
    return render(S, cam, light=(-0.5, 0.8, -0.6), bands=(0.3, 0.12, 0.0), tint=SHADE, seam=0.6)


def body(t):
    pe = ease_out_back(clamp(t / 0.45), 1.3)
    snow = ease_in_out(clamp((t - 1.75) / 0.5))
    s = 0.6 + 0.4 * pe
    cx, cy = PX + PW / 2, PY + PH / 2
    g = [f'<g transform="translate({cx},{cy}) scale({s}) translate({-cx},{-cy})" opacity="{clamp(t / 0.15):.2f}">']
    g.append(f'<rect x="{PX - 14}" y="{PY - 14}" width="{PW + 28}" height="{PH + 28}" rx="64" fill="{INK}"/>')
    g.append(f'<rect x="{PX}" y="{PY}" width="{PW}" height="{PH}" rx="50" fill="#F8F2E6"/>')
    g.append(f'<text x="{PX + 40}" y="{PY + 48}" font-family="Inter" font-weight="700" font-size="18" fill="{INK}">9:41</text>')
    g.append(f'<svg x="{PX + 26}" y="{PY + 74}" width="84" height="84">{icon_planet(t)}</svg>')
    g.append(f'<text x="{PX + 120}" y="{PY + 108}" font-family="NotoSC" font-weight="700" font-size="20" fill="#8A7FA0">现在 · 山谷</text>')
    temp = '14°' if snow < 0.5 else '-2°'
    g.append(f'<text x="{PX + 118}" y="{PY + 162}" font-family="Inter" font-weight="900" font-size="64" fill="{INK}">{temp}</text>')
    cw, ch_ = PW - 40, 430
    g.append(f'<svg x="{PX + 20}" y="{PY + 196}" width="{cw}" height="{ch_}">{card_svg(t, cw, ch_, snow)}</svg>')
    tag = '晴 · 云在中午散开' if snow < 0.5 else '雪 · 2800 米以上积雪'
    g.append(f'<rect x="{PX + 38}" y="{PY + 196 + ch_ - 62}" width="{len(tag) * 19 + 34}" height="42" rx="21" fill="#FFFFFFdd"/>'
             f'<text x="{PX + 55}" y="{PY + 196 + ch_ - 34}" font-family="NotoSC" font-weight="700" font-size="19" fill="{INK}">{tag}</text>')
    days = [('一', 'sun', '18°'), ('二', 'cloud', '15°'), ('三', 'snow', '-1°'), ('四', 'cloud', '9°'), ('五', 'sun', '12°')]
    for k, (d, kind, tp) in enumerate(days):
        e = ease_out_back(clamp((t - 0.55 - k * 0.08) / 0.3), 2.2)
        x = PX + 44 + k * 84
        g.append(f'<g transform="translate({x + 28},{PY + 700}) scale({e}) translate({-x - 28},{-PY - 700})">'
                 f'<text x="{x + 28}" y="{PY + 672}" text-anchor="middle" font-family="NotoSC" font-weight="700" font-size="18" fill="#8A7FA0">周{d}</text>'
                 f'<svg x="{x}" y="{PY + 684}" width="56" height="56">{tiny(kind)}</svg>'
                 f'<text x="{x + 28}" y="{PY + 770}" text-anchor="middle" font-family="Inter" font-weight="800" font-size="22" fill="{INK}">{tp}</text></g>')
    g.append(f'<rect x="{PX + 20}" y="{PY + PH - 96}" width="{PW - 40}" height="70" rx="35" fill="{INK}"/>'
             f'<rect x="{PX + 36}" y="{PY + PH - 84}" width="130" height="46" rx="23" fill="{YEL}"/>'
             f'<text x="{PX + 101}" y="{PY + PH - 54}" text-anchor="middle" font-family="NotoSC" font-weight="700" font-size="19" fill="{INK}">今天</text>'
             f'<text x="{PX + 250}" y="{PY + PH - 54}" text-anchor="middle" font-family="NotoSC" font-weight="700" font-size="19" fill="#FFFFFFaa">一周</text>'
             f'<text x="{PX + 370}" y="{PY + PH - 54}" text-anchor="middle" font-family="NotoSC" font-weight="700" font-size="19" fill="#FFFFFFaa">地图</text>')
    g.append('</g>')
    # 左边：落地页文案（按行升起）
    left = []
    for k, (txt, size, wt, col, dy) in enumerate([('一张卡，', 76, 900, INK, 330), ('一座小山。', 76, 900, INK, 420), ('天气变了，山就换一身颜色。', 30, 700, '#6A6080', 490)]):
        e = clamp((t - 0.3 - k * 0.1) / 0.27)
        if e > 0:
            left.append(f'<clipPath id="lc{k}"><rect x="120" y="{dy - size}" width="900" height="{size * 1.3}"/></clipPath><g clip-path="url(#lc{k})"><text x="140" y="{dy + (1 - e) ** 3 * size * 1.2:.0f}" font-family="NotoSC" font-weight="{wt}" font-size="{size}" fill="{col}">{txt}</text></g>')
    be = ease_out_back(clamp((t - 0.75) / 0.3), 2.2)
    left.append(f'<g transform="translate(260,580) scale({be}) translate(-260,-580)"><rect x="140" y="550" width="300" height="72" rx="20" fill="{PINK}"/><text x="290" y="597" text-anchor="middle" font-family="NotoSC" font-weight="900" font-size="28" fill="#FFFFFF">下载试试 →</text></g>')
    return ''.join(g) + ''.join(left)
