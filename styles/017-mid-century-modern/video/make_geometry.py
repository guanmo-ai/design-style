"""
把视频要用的纸片一次剪好，写成 geo.ts（视频里只做平移 / 旋转 / 缩放，不再重剪——画面才“丝滑”）。

每块纸都以自己的中心（或转轴）为原点；剪法和风格图共用 images/cut.py，所以视频和图是同一批纸。
用法：python3 styles/017-mid-century-modern/video/make_geometry.py
"""
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'images'))
from cut import (bar, bbox, boomerang, circle, crescent, fit, kidney, move, path_d, rect, rough, rrect, star, union, word)  # noqa: E402


def d(polys):
    return path_d(polys, 1)


def centered(polys):
    x0, y0, x1, y1 = bbox(polys)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    return move(polys, -cx, -cy), cx, cy


out = {}

# 球钟：辐条（以辐条中点为原点，沿 +x）、球、中心盘、指针（以转轴为原点）
SPOKE_L = [330 if i % 3 == 0 else 262 for i in range(12)]
out['spokes'] = [d(rough(bar(-L / 2, 0, L / 2, 0, 24, 16), 40 + i)) for i, L in enumerate(SPOKE_L)]
out['spokeLen'] = SPOKE_L
BALL_R = [56 if i % 3 == 0 else 47 for i in range(12)]
out['balls'] = [d(rough(circle(0, 0, r), 60 + i)) for i, r in enumerate(BALL_R)]
out['ballR'] = BALL_R
out['disc'] = d(rough(circle(0, 0, 96), 80))
out['discDot'] = d(rough(circle(0, 0, 34), 81))
out['minute'] = d(rough(bar(-26, 0, 236, 0, 16, 6), 82))
out['hour'] = d(rough(bar(-22, 0, 166, 0, 21, 8), 83))

# 剪纸的手：球心为原点，手腕朝 +x（和风格图里的手同一个剪法）
g = 50
index = union(bar(g * 0.55, -g * 0.92, 150, -70, 30, 40), circle(g * 0.55, -g * 0.92, 15))
thumb = union(bar(g * 0.62, g * 0.86, 132, 40, 32, 44), circle(g * 0.62, g * 0.86, 16))
back = union(rrect(118, -96, 150, 150, 46), circle(142, -94, 24), circle(184, -100, 25), circle(226, -94, 24))
out['hand'] = {'palm': d(rough(union(index, thumb, back), 90)), 'cuff': d(rough(rect(258, -98, 46, 162), 91)),
               'sleeve': d(rough(bar(300, -20, 1300, 10, 132, 170), 92))}

# 大字：每个字母以自己的中心为原点；x / y 是中心相对“基线起点”的位置
def letters(text, width, seed, tracking=0.02, size=None):
    size = size or fit(text, width, tracking=tracking)
    res = []
    for p, i in word(text, size, 0, 0, seed=seed, tilt=0, bounce=0, tracking=tracking):
        c, cx, cy = centered(p)
        x0, y0, x1, y1 = bbox(p)
        res.append({'d': d(c), 'x': round(cx, 1), 'y': round(cy, 1), 'w': round(x1 - x0, 1), 'h': round(y1 - y0, 1)})
    return {'size': round(size, 1), 'letters': res}


# 海报开场：MODERN 横跨画面（1560 宽），MID- / CENTURY 两行叠在左上
out['modern'] = letters('MODERN', 1560, 12)
sz = fit('CENTURY', 400)
out['mid'] = letters('MID-', 0, 11, size=sz)
out['century'] = letters('CENTURY', 0, 13, size=sz)

out['y1955'] = letters('1955', 560, 21)
for yr, sd in (('1953', 22), ('1956', 23), ('1960', 24), ('2026', 25)):
    out['y' + yr] = letters(yr, 520, sd)
out['bop'] = letters('BOP', 540, 26)
out['atomic'] = letters('ATOMIC', 300, 27)


def cen(polys, seed, amp=None):
    return d(rough(centered(polys)[0], seed, amp=amp))


# 02 挂衣架：钢丝用辐条（翻面后变细），球用球钟的球
# 03 唱片封套
out['sleeve'] = cen(rect(0, 0, 640, 640), 30)
# 04 Case Study House #22：两层山、楼板、玻璃盒子、窗、柱
def hill(w, base, amps, seed):
    pts = [(x, base - sum(a * math.sin(x / l + p) for a, l, p in amps)) for x in range(0, w + 1, 40)]
    return [pts + [(w, base + 700), (0, base + 700)]]
out['hillFar'] = d(rough(move(hill(2600, 0, [(70, 260, 0.4), (30, 120, 1.3)], 1), -1300, 0), 31, amp=4))
out['hillNear'] = d(rough(move(hill(2600, 0, [(50, 300, 2.1), (24, 90, 0.2)], 2), -1300, 0), 32, amp=4))
out['slab'] = cen(rect(0, 0, 780, 26), 33)
out['box'] = cen(rect(0, 0, 560, 150), 34)
out['win'] = cen(rect(0, 0, 70, 112), 35)
# 玻璃盒子上的 6 扇窗（以盒子中心为原点）：盒子飞走时和盒子是同一张纸
out['wins'] = [d(rough(rect(-245 + 84 * k, -56, 70, 112), 60 + k)) for k in range(6)]
out['col'] = cen(rect(0, 0, 18, 170), 36)
# 05 App：手机、屏幕、封面、波形条、播放键
out['phone'] = cen(rrect(0, 0, 420, 860, 60, 10), 40)
out['screen'] = cen(rrect(0, 0, 384, 824, 44, 10), 41)
out['cover'] = cen(rect(0, 0, 300, 300), 42)
out['strip'] = cen(rect(0, 0, 12, 60), 43, amp=0.6)
out['play'] = d(rough(circle(0, 0, 48), 44))
out['tri'] = d(rough([[(-14, -20), (24, 0), (-14, 20)]], 45, amp=0.6))
# 规则卡
out['card'] = cen(rrect(0, 0, 320, 440, 18, 6), 50)
out['swatch'] = cen(rect(0, 0, 210, 30), 51, amp=0.8)
out['square'] = cen(rect(0, 0, 110, 110), 52)
out['boomerang'] = d(rough(centered(boomerang(0, 0, 56, -12))[0], 53))
out['kidneyS'] = d(rough(centered(kidney(0, 0, 50, -10))[0], 54))
out['circleL'] = d(rough(circle(0, 0, 80), 55))

# 换章用的大张纸：左边是剪出来的毛边，其余三边在画外
# 两侧各 1600、纵深 2900（从任何方向进来都盖得满屏幕），原点在毛边上，纸往 +x 延伸
out['sheet'] = d(rough([[(0, -1600), (2900, -1600), (2900, 1600), (0, 1600)]], 5, amp=7))
# 落地时溅起的彩纸碎片（剪剩的边角料）
out['scraps'] = [d(rough(centered(p)[0], 80 + k)) for k, p in enumerate([
    rect(0, 0, 26, 14), star(0, 0, 18, 4, 4, 0), crescent(0, 0, 16, 5, 30), rect(0, 0, 12, 30),
    circle(0, 0, 10), [[(0, 0), (30, 6), (8, 22)]], rect(0, 0, 20, 20), crescent(0, 0, 13, 4, 200)])]

# 背景纸：太阳、腰果、星芒、月牙边角料
out['sun'] = d(rough(circle(0, 0, 250), 4))
out['bean'] = d(rough(kidney(0, 0, 260, 0), 3))
out['star'] = d(rough(star(0, 0, 40, 8, 4, 0), 70))
out['starS'] = d(rough(star(0, 0, 20, 4, 4, 0), 71))
out['crescent'] = d(rough(centered(crescent(0, 0, 40, 12, 200))[0], 72))

with open(os.path.join(HERE, 'geo.ts'), 'w', encoding='utf-8') as f:
    f.write('/** 由 make_geometry.py 生成，请勿手改。所有纸片都已剪好，以自身中心 / 转轴为原点。 */\n')
    f.write('export const GEO = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ' as const;\n')
print('wrote geo.ts', os.path.getsize(os.path.join(HERE, 'geo.ts')) // 1024, 'KB')
