"""019 低多边形 · 全片（18 秒，30fps 预览 / 60fps 正片，120 BPM）。
python3 episode.py <输出目录> [fps] [起始帧 结束帧]  → fNNNN.svg；再用 render.cjs 截成 PNG。

  01 山谷与小火车   0.0— 4.5  规则 1 · 一个面，一个颜色
  02 海边灯塔       4.5— 8.0  规则 2 · 光一转，面就翻
  03 小星球         8.0—11.6  规则 3 · 面越少，越有性格
  04 落到界面      11.6—15.0  规则 4 · 一张卡，一座山
  05 夜里的山谷    15.0—17.5  规则 5 · 三档明暗就够了
  回到第 0 帧      17.5—18.0（纸云散开就是开头那张纸，首尾同一帧）
每一章都从一张纸翻出来，结尾被一团纸云盖住——纸云就是下一章的纸。"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from common import *  # noqa: E402,F401,F403
import ch1_valley as C1  # noqa: E402
import ch2_lighthouse as C2  # noqa: E402
import ch3_planet as C3  # noqa: E402
import ch4_app as C4  # noqa: E402

DUR = 18.0
FONT = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'public', 'fonts'))

CH = [  # (起, 止, 编号, 名称, 小字, 规则, 说明)
    (0.0, 4.5, '01', '山谷与小火车', 'LOW POLY · 1993 星际火狐 →', '一个面，一个颜色', '不画渐变：每个三角面只有一种颜色'),
    (4.5, 8.0, '02', '海边灯塔', 'FLAT SHADING · 平涂着色', '光一转，面就翻', '明暗按面算，光一动，整片面跟着跳'),
    (8.0, 11.6, '03', '小星球', 'POLYGON BUDGET · 面数', '面越少，越有性格', '1280 → 320 → 80：少到刚好认得出'),
    (11.6, 15.0, '04', '落到界面', 'WEATHER APP · 2026', '一张卡，一座山', '图标、插画、空状态都能用'),
    (15.0, 17.5, '05', '夜里的山谷', 'NIGHT · 三档明暗', '三档明暗就够了', '亮、中、暗三档，阴影混一点暖紫'),
]


def rise_g(t, t0, d=0.27):
    """按行从遮罩里升起（16 帧左右 ease-out）。返回 (位移比例, 是否可见)。"""
    e = clamp((t - t0) / d)
    return (1 - e) ** 3, e > 0


def text_block(t):
    c = next((c for c in CH if c[0] <= t < c[1]), None)
    if not c:
        return ''
    t0 = c[0] + 0.15
    out = []

    def line(x, y, size, txt, weight, fill, ts, lh=1.2, family='NotoSC', track=0, bg=None):
        dy, vis = rise_g(t, ts)
        if not vis:
            return
        h = size * lh
        cid = f'c{int(x)}{int(y)}'
        rect = (f'<rect x="{x - 18}" y="{y - size * 0.95}" width="{len(txt) * size * 1.02 + 36}" height="{size * 1.35}" rx="12" fill="{bg}"/>' if bg else '')
        out.append(f'<clipPath id="{cid}"><rect x="{x - 40}" y="{y - size * 1.05}" width="1600" height="{h + 10}"/></clipPath>'
                   f'<g clip-path="url(#{cid})"><g transform="translate(0,{dy * h * 1.1:.1f})">{rect}'
                   f'<text x="{x}" y="{y}" font-family="{family}" font-weight="{weight}" font-size="{size}" fill="{fill}" letter-spacing="{track}">{txt}</text></g></g>')

    line(64, 80, 22, f'{c[2]} · {c[4]}', 800, '#8A7FA0', t0, family='Inter', track=4)
    line(64, 150, 58, c[3], 900, INK, t0 + 0.08)
    line(82, 990, 44, f'规则 {int(c[2])} · {c[5]}', 900, WHITE, t0 + 0.5, bg=INK)
    line(64, 1040, 28, c[6], 700, INK, t0 + 0.62)
    out.append(f'<text x="{W - 64}" y="1040" text-anchor="end" font-family="Inter" font-weight="800" font-size="28" letter-spacing="3" fill="{INK}">{c[2]} / 05</text>')
    if t < 4.0 or t > 17.5:
        out.append(f'<text x="{W - 64}" y="104" text-anchor="end" font-family="NotoSC" font-weight="900" font-size="64" fill="{INK}">低多边形</text>'
                   f'<text x="{W - 64}" y="142" text-anchor="end" font-family="Inter" font-weight="800" font-size="22" letter-spacing="7" fill="{INK}">LOW POLY · 019</text>')
    return ''.join(out)


def world(t):
    if t < 4.5:
        return C1.body(t, cover=(3.65, 4.5))
    if t < 8.0:
        return C2.body(t - 4.5, cover=(2.75, 3.5))
    if t < 11.6:
        return C3.body(t - 8.0)
    if t < 15.0:
        return '', C4.body(t - 11.6)
    if t < 17.5:
        return night(t - 15.0)
    # 回到第 0 帧：纸云收回去，露出第 1 章开头那张纸（本地时间 -0.5 → 0）
    w, _ = C1.body(t - 18.0, cover=None)
    return w, C1.paper_cloud(1 - ease_in_out(clamp((t - 17.5) / 0.5)), W / 2 + 200, H / 2 + 260)


def night(tl):
    """第 5 章：回到山谷，天黑。三档明暗压进深蓝紫，车窗亮着；右边列出三档颜色。"""
    nt = ease_in_out(clamp(tl / 0.6))
    c = []
    w, over = C1.body(3.3 + tl * 0.45, cover=None, night=nt, center=c)
    sky = (f'<linearGradient id="ns" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A3470"/><stop offset="1" stop-color="#8E6FA8"/></linearGradient>'
           f'<rect width="{W}" height="{H}" fill="url(#ns)" opacity="{nt:.2f}"/>')
    stars = ''.join(f'<polygon points="{x},{y - 7} {x + 2},{y - 2} {x + 7},{y} {x + 2},{y + 2} {x},{y + 7} {x - 2},{y + 2} {x - 7},{y} {x - 2},{y - 2}" fill="#FFF4C8" opacity="{nt * (0.5 + 0.5 * math.sin(tl * 6 + k)):.2f}"/>'
                    for k, (x, y) in enumerate([(220, 160), (420, 240), (760, 130), (1100, 210), (1460, 150), (1700, 260), (980, 300), (300, 330)]))
    moon = f'<circle cx="1560" cy="210" r="46" fill="#FFF4C8" opacity="{nt:.2f}"/><circle cx="1580" cy="196" r="40" fill="#5A4A8A" opacity="{nt:.2f}"/>'
    # 三档颜色：亮 / 中 / 暗
    sw = ''
    for k, (name, col) in enumerate([('亮', '#86BF4C'), ('中', '#6E8E64'), ('暗', '#4A4E66')]):
        e = ease_out_back(clamp((tl - 0.8 - k * 0.12) / 0.3), 2.2)
        x, y = 1480, 420 + k * 120
        sw += (f'<g transform="translate({x},{y}) scale({e}) translate({-x},{-y})"><rect x="{x}" y="{y}" width="300" height="96" rx="20" fill="#FFFDF7"/>'
               f'<rect x="{x + 16}" y="{y + 16}" width="64" height="64" rx="14" fill="{col}"/>'
               f'<text x="{x + 100}" y="{y + 50}" font-family="NotoSC" font-weight="900" font-size="30" fill="{INK}">{name}</text>'
               f'<text x="{x + 100}" y="{y + 80}" font-family="Inter" font-weight="700" font-size="20" fill="#8A7FA0">{col}</text></g>')
    over2 = ''
    if c:
        over2 = C1.paper_cloud(clamp((tl - 2.0) / 0.5), c[0][0], c[0][1])
    return sky + stars + moon + w, sw + over2


def frame(t):
    w, over = world(t)
    style = (f'<style>@font-face{{font-family:Inter;src:url({FONT}/Inter.ttf);font-weight:100 900}}'
             f'@font-face{{font-family:NotoSC;src:url({FONT}/NotoSansSC-Black.otf);font-weight:900}}'
             f'@font-face{{font-family:NotoSC;src:url({FONT}/NotoSansSC-Bold.otf);font-weight:700}}</style>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{style}{DEFS}'
            f'<rect width="{W}" height="{H}" fill="{BG}"/><g mask="url(#edge)">{w}</g>{over}{text_block(t)}'
            f'<rect width="{W}" height="{H}" filter="url(#grain)"/></svg>')


if __name__ == '__main__':
    out = sys.argv[1]
    fps = int(sys.argv[2]) if len(sys.argv) > 2 else 30
    n = int(DUR * fps)
    f0, f1 = (int(sys.argv[3]), int(sys.argv[4])) if len(sys.argv) > 4 else (0, n - 1)
    step = int(os.environ.get('STEP', 1))
    os.makedirs(out, exist_ok=True)
    for f in range(f0, f1 + 1, step):
        open(os.path.join(out, f'f{f:04d}.svg'), 'w').write(frame(f / fps))
