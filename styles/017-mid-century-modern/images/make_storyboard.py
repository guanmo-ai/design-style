"""
017 · 中世纪现代 —— 动效分镜（1920×1080），开做视频之前给主人看“它准备怎么动”。

六格 = 六章，一章一件真实代表作；每格写清：时间、代表作、主动作、接力到下一格的东西。
虚线 = 零件要落的位置；影子越长 = 离桌面越高 = 正在动。
用法：python3 styles/017-mid-century-modern/images/make_storyboard.py
     → process/01-storyboard.jpg
"""
import math
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(ROOT, 'scripts'))
from cut import (INK, JOST, MUST, MUTE, PAPER, SC, TANG, TEAL, Sheet, bar, boomerang, circle, kidney,  # noqa: E402
                 move, multiply, overprint, path_d, poly, rect, rot, rough, rrect, star, t, union, word, fit)
from make_svgs import clock, hand, record, tri  # noqa: E402

W, H = 1920, 1080
FW, FH = 560, 315


def dashed(polys, op=0.55, w=1.6):
    return f'<path d="{path_d(polys)}" fill="none" stroke="{INK}" stroke-width="{w}" stroke-dasharray="6 6" opacity="{op}"/>'


def arc(x0, y0, x1, y1, lift, col=INK, op=0.5):
    mx, my = (x0 + x1) / 2, min(y0, y1) - lift
    return f'<path d="M{x0} {y0} Q{mx} {my} {x1} {y1}" fill="none" stroke="{col}" stroke-width="2" stroke-dasharray="3 7" stroke-linecap="round" opacity="{op}"/>'


# ---------------------------------------------------------------- 六格
def f_bass(sh):
    """片头：Bass《金臂人》式——白纸条一根根扎进黑场，围住一条折线手臂；字母跟着落下。"""
    b = [f'<rect width="{FW}" height="{FH}" fill="{INK}"/>']
    bars = [(-20, 58, 250, 58, 26), (-20, 104, 170, 104, 18), (370, 0, 370, 140, 24), (420, 0, 420, 90, 14),
            (330, 196, 600, 196, 22)]
    for k, (x0, y0, x1, y1, w) in enumerate(bars):
        b.append(sh.piece(rough(bar(x0, y0, x1, y1, w), 10 + k, lo=10, hi=22), PAPER, 4))
    # 正在扎进来的一根：前一张的位置留虚线（一秒 12 张），影子长 = 还在空中
    b.append(f'<g stroke="{PAPER}">' + dashed(bar(-20, 150, 120, 150, 22), op=0.6).replace(f'stroke="{INK}"', f'stroke="{PAPER}"') + '</g>')
    b.append(sh.piece(rough(bar(-20, 150, 220, 150, 22), 20, lo=10, hi=22), PAPER, 22))
    # 折线手臂（Bass 的“金臂”）：一张纸剪出来的锯齿
    arm = [[(170, 315), (205, 250), (186, 236), (236, 176), (220, 164), (300, 96), (318, 112), (262, 178), (282, 190),
            (238, 258), (256, 270), (214, 315)]]
    b.append(sh.piece(rough(arm, 30, lo=10, hi=20), PAPER, 6))
    # 标题字母一个个拍下来
    for p, i in word('MID-', 64, 344, 290, seed=31, tilt=3, bounce=0.03, lift={3: (10, -30, 14)}):
        b.append(sh.piece(p, TANG, 22 if i == 3 else 4))
    return ''.join(b)


def f_clock(sh):
    """球钟：纸条转成 12 根辐条，12 颗球按十六分音符一颗颗落上去，最后一颗手送。"""
    b = [f'<rect width="{FW}" height="{FH}" fill="{TANG}"/>']
    sun = rough(circle(430, 90, 120), 4, lo=14, hi=28)
    b.append(sh.piece(sun, MUST, 4))
    g = Sheet(FW, FH)
    c, pos = clock(sh, 250, 160, 0.42, hold=3, lifted=1)
    b.append(c)
    tx, ty = pos[3]
    b.append(sh.piece(rough(circle(tx + 18, ty - 14, 21), 63, lo=5, hi=10), INK, 22))
    b.append(hand(sh, tx + 18, ty - 14, 0.44, -12, h=22, r=21))
    # 计数：12 颗 = 12 个十六分音符
    for k in range(12):
        x = 30 + k * 16
        b.append(f'<rect x="{x}" y="288" width="10" height="10" fill="{INK if k < 11 else "none"}" stroke="{INK}" stroke-width="1.5"/>')
    del g
    return ''.join(b)


def f_hang(sh):
    """Eames 挂衣架：球钟的球掉下来，一颗颗弹进挂钩。"""
    b = [f'<rect width="{FW}" height="{FH}" fill="{PAPER}"/>']
    cols = [TANG, MUST, TEAL, INK, PAPER]
    # 钢丝框：3 排斜交的折线
    pts = []
    for row in range(3):
        y = 92 + row * 70
        for k in range(5):
            x = 80 + k * 90 + (45 if row % 2 else 0)
            pts.append((x, y))
            b.append(f'<path d="M{x - 45} {y + 35} L{x} {y} L{x + 45} {y + 35}" stroke="{INK}" stroke-width="5" fill="none"/>')
    b.append(f'<rect x="40" y="60" width="500" height="6" fill="{INK}"/>')
    for k, (x, y) in enumerate(pts):
        if k in (12, 13, 14):
            continue
        b.append(sh.piece(rough(circle(x, y - 4, 17), 200 + k, lo=5, hi=10), cols[k % 5], 4))
    # 还在空中的三颗：抛物线 + 落位虚线
    for j, k in enumerate((12, 13, 14)):
        x, y = pts[k]
        b.append(dashed(circle(x, y - 4, 17)))
        fx, fy = x - 60 + j * 30, y - 80 - j * 26
        b.append(arc(fx, fy, x, y - 4, 40))
        b.append(sh.piece(rough(circle(fx, fy, 17), 220 + j, lo=5, hi=10), cols[k % 5], 14 + j * 8))
    return ''.join(b)


def f_record(sh):
    """Blue Note 式唱片封套（Reid Miles）：一颗球长成唱片，从封套里滑出来；大字只露一半。"""
    b = [f'<rect width="{FW}" height="{FH}" fill="{MUST}"/>']
    rec = rough([circle(360, 158, 120)[0], list(reversed(circle(360, 158, 5)[0]))], 40, lo=12, hi=26)
    sleeve = rough(rect(40, 30, 255, 255), 41, lo=14, hi=30)
    b.append(sh.piece(rec, INK, 18, rule='evenodd'))
    b.append(sh.piece(rough([circle(360, 158, 42)[0], list(reversed(circle(360, 158, 5)[0]))], 42, lo=8, hi=14), TANG, 0, rule='evenodd'))
    b.append(dashed(circle(168, 158, 120), op=0.35))
    b.append(sh.piece(sleeve, TEAL, 6))
    b.append(f'<svg x="40" y="30" width="255" height="255" overflow="hidden">')
    for p, i in word('BLUE', fit('BLUE', 222), 16, 240, seed=43, tilt=2, bounce=0.02):
        b.append(sh.piece(p, PAPER, 3))
    b.append(sh.piece(rough(circle(196, 64, 46), 44), TANG, 0, 'style="mix-blend-mode:multiply"'))
    b.append('</svg>')
    b.append(t(56, 60, 12, 'THE RAND QUARTET', JOST, 700, PAPER, '2'))
    return ''.join(b)


def f_house(sh):
    """Case Study House #22（1960）：唱片变成落日，玻璃盒子悬在山崖上；纸层视差推镜。"""
    b = [f'<rect width="{FW}" height="{FH}" fill="{TEAL}"/>']
    b.append(sh.piece(rough(circle(150, 150, 70), 50, lo=10, hi=20), MUST, 4))
    hills = [(rough(poly((0, 230), (140, 190), (300, 215), (560, 170), (560, 315), (0, 315)), 51, lo=16, hi=30), multiply(TEAL, TEAL), 4),
             (rough(poly((0, 260), (220, 236), (380, 250), (560, 228), (560, 315), (0, 315)), 52, lo=16, hi=30), INK, 6)]
    for p, c, hh in hills:
        b.append(sh.piece(p, c, hh))
    # 房子：一块奶油纸平板挑出崖外 + 墨色玻璃盒 + 芥末色的灯
    b.append(sh.piece(rough(rect(250, 150, 270, 14), 53, lo=12, hi=24), PAPER, 10))
    b.append(sh.piece(rough(rect(270, 164, 210, 62), 54, lo=12, hi=24), INK, 10))
    for k in range(5):
        b.append(sh.piece(rough(rect(282 + k * 40, 174, 28, 42), 55 + k, lo=6, hi=12), MUST if k != 3 else multiply(MUST, PAPER), 0))
    b.append(sh.piece(rough(rect(260, 226, 230, 10), 60, lo=12, hi=24), PAPER, 10))
    b.append(sh.piece(rough(rect(300, 236, 16, 30), 61), PAPER, 6))
    b.append(sh.piece(rough(star(470, 70, 16, 3, 4), 62, lo=3, hi=6), PAPER, 3))
    b.append(sh.piece(rough(star(80, 46, 10, 2, 4), 63, lo=3, hi=6), PAPER, 3))
    # 视差箭头：越近的层走得越快
    for k, (y, L) in enumerate([(296, 60), (304, 110)]):
        b.append(f'<path d="M{540 - L} {y} h{L} m-8 -5 l8 5 l-8 5" stroke="{PAPER}" stroke-width="2" fill="none" opacity=".7"/>')
    return ''.join(b)


def f_app(sh):
    """今天：唱片落进手机，播放键是一张纸——按下去影子收紧。"""
    b = [f'<rect width="{FW}" height="{FH}" fill="{PAPER}"/>']
    b.append(sh.piece(rough(kidney(90, 250, 80, -10), 70, lo=14, hi=28), TEAL, 4))
    px, py, pw, ph = 190, 26, 170, 330
    b.append(sh.piece(rrect(px, py, pw, ph, 28, 8), INK, 10))
    b.append(f'<path d="{path_d(rrect(px + 7, py + 7, pw - 14, ph - 14, 22, 8))}" fill="{PAPER}"/>')
    b.append(sh.piece(rect(px + 20, py + 34, pw - 40, pw - 40), MUST, 3))
    b.append(record(sh, px + pw / 2, py + 34 + (pw - 40) / 2, 52, TEAL, TANG, True, 71, h=3))
    for k in range(12):
        hh = 6 + 14 * abs(math.sin(k * 0.9))
        b.append(f'<rect x="{px + 22 + k * 10.5}" y="{py + 206 - hh}" width="7" height="{hh}" fill="{INK if k < 7 else "#D8C7A2"}"/>')
    b.append(sh.piece(rough(circle(px + pw / 2, py + 252, 22), 72, lo=5, hi=10), TANG, 0))
    b.append(sh.piece(rough(tri(px + pw / 2 + 3, py + 252, 10), 73, lo=3, hi=6), PAPER, 0))
    # 按下去的那一刻：虚线是平时（提起）的位置
    b.append(dashed(circle(px + pw / 2 - 6, py + 240, 22), op=0.6))
    b.append(t(400, 120, 13, '按下 h 12 → 0', SC, 700, INK) + t(400, 140, 13, '松手 h 16 → 12', SC, 700, INK))
    return ''.join(b)


FRAMES = [
    (f_bass, '0:00', '片头', 'Saul Bass《金臂人》片头 · 1955', '白纸条一根根扎进黑场，拼成折线手臂；第 0 帧就在扎的那一下', '纸条 → 辐条'),
    (f_clock, '0:03', '产品', 'George Nelson 球钟 · 1949', '纸条一转成 12 根辐条，12 颗球踩着十六分音符落上去，最后一颗手送', '一颗球掉下来'),
    (f_hang, '0:06', '家具', 'Eames Hang-It-All 挂衣架 · 1953', '球钟的球掉下来，沿抛物线一颗颗弹进钢丝挂钩', '一颗球长成唱片'),
    (f_record, '0:09', '唱片', 'Reid Miles · Blue Note 封套 · 1956—', '唱片从封套里滑出来，大字一个个拍上去；两层油墨叠印', '唱片变成落日'),
    (f_house, '0:12', '建筑', 'Case Study House #22 · 1960', '落日沉下去，玻璃盒子悬在崖边亮灯；纸层越近走得越快', '唱片落进手机'),
    (f_app, '0:15', '今天', '爵士电台 App', '唱片落进手机，播放键是一张纸：按下影子收紧，松手弹回', '回到第 0 帧'),
]


def storyboard():
    sh = Sheet(W, H)
    b = [f'<rect width="{W}" height="{H}" fill="{PAPER}"/>']
    L = 60
    for p, i in word('MOTION', 70, L, 118, seed=81, tilt=2, bounce=0.02):
        b.append(sh.piece(p, INK, 4))
    b.append(t(L + 262, 84, 34, '动效分镜 · 中世纪现代（草案）', SC, 900, INK))
    b.append(t(L + 262, 118, 17, '一章一件真实代表作；整片只有一种物理：纸片。虚线 = 要落的位置，影子越长 = 离桌面越高 = 正在动。', SC, 500, MUTE))
    rules = [('影子 = 高度', '(0.5h, h) · 模糊 0.4h'), ('一秒 12 张', '零件走台阶，镜头走 60 帧'), ('先蓄后落', '提起 6 帧 → 落下 → 歪一下停住')]
    for k, (a, v) in enumerate(rules):
        x = 1360 + 0 * k
        y = 52 + k * 30
        b.append(t(x, y, 16, a, SC, 900, TANG) + t(x + 112, y, 15, v, SC, 500, INK))
    b.append(f'<rect x="{L}" y="150" width="{W - 2 * L}" height="3" fill="{INK}"/>')

    for k, (fn, tc, chap, work, act, relay) in enumerate(FRAMES):
        col, row = k % 3, k // 3
        x, y = L + col * (FW + 60), 190 + row * (FH + 140)
        b.append(f'<g filter="url(#{sh.shadow_id(6)})"><rect x="{x}" y="{y}" width="{FW}" height="{FH}" fill="{INK}"/></g>')
        b.append(f'<svg x="{x}" y="{y}" width="{FW}" height="{FH}" viewBox="0 0 {FW} {FH}" overflow="hidden">{fn(sh)}</svg>')
        # 角标：时间码
        b.append(f'<rect x="{x + 12}" y="{y + 12}" width="62" height="26" fill="{PAPER}"/>')
        b.append(t(x + 43, y + 31, 15, tc, JOST, 700, INK, anchor='middle'))
        ty = y + FH + 36
        b.append(t(x, ty, 15, f'0{k + 1}', JOST, 700, TANG, '1.5') + t(x + 30, ty, 21, chap, SC, 900, INK)
                 + t(x + 80, ty - 1, 15, work, SC, 700, MUTE))
        b.append(t(x, ty + 30, 16, act, SC, 500, INK))
        b.append(t(x, ty + 58, 14, f'接力 → {relay}', SC, 700, TEAL))
        if col < 2:
            b.append(sh.piece(rough(tri(x + FW + 30, y + FH / 2, 12), 95 + k), TANG, 3))

    b.append(sh.texture(0.8))
    return sh.doc('\n'.join(b))


if __name__ == '__main__':
    import build_images  # noqa: E402
    out_dir = os.path.join(HERE, '..', 'process')
    os.makedirs(out_dir, exist_ok=True)
    svg = os.path.join(out_dir, '01-storyboard.svg')
    with open(svg, 'w', encoding='utf-8') as f:
        f.write(build_images.embed(storyboard()))
    png = svg.replace('.svg', '.png')
    subprocess.run(['node', os.path.join(ROOT, 'scripts', 'svg_to_png.mjs'), svg, png, str(W), str(H)], check=True, cwd=ROOT)
    from PIL import Image
    Image.open(png).convert('RGB').save(svg.replace('.svg', '.jpg'), quality=86, optimize=True)
    os.remove(png)
    os.remove(svg)
    print('wrote process/01-storyboard.jpg')
