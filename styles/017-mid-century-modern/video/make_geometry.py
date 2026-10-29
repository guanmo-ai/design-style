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
from cut import (bar, bbox, circle, crescent, fit, kidney, move, path_d, rect, rough, rrect, star, union, word)  # noqa: E402


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

# 换章用的大张纸：左边是剪出来的毛边，其余三边在画外
out['sheet'] = d(rough([[(0, -300), (2700, -300), (2700, 1400), (0, 1400)]], 5, amp=7))

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
