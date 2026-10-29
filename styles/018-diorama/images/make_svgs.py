"""
018 微缩景观 · 四张图（1080×1350）
  python3 make_svgs.py <正片帧目录>   # 例如 ../video3d/out（render.cjs 渲出来的 f0000.png …）
先从正片里裁出几帧（frames/*.jpg），再写 poster / cheatsheet / app-ui / steps 四张 SVG；
然后 python3 scripts/build_images.py styles/018-diorama/images 生成 preview/（内嵌字体和图片）和 png/。
"""
import os
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1080, 1350
C = dict(paper='#F6EEDD', cream='#FFF7EC', soil='#C99A72', soil2='#DDB48A', soil3='#EED0A6', mint='#7FCBA8',
         pink='#F28AA6', peach='#F7C9D3', lilac='#CDB9F0', sky='#7DB8E8', butter='#F5C451', coral='#F27D6A',
         ink='#3B3552', shade='#7A5C86', mute='#8A7FA0', lamp='#FFC77A')
CN = "font-family=\"'Noto Sans SC'\""

# 帧号 → 裁切框（1920×1080 里的 x0, y0, x1, y1）：避开左上的章节名和左下的规则卡
CROPS = {
    'night':  (470, (420, 20, 1560, 905)),
    'street': (120, (330, 60, 1330, 925)),
    'room':   (200, (760, 40, 1900, 1000)),
    'rubble': (8, (100, 70, 1100, 900)),
    'base':   (40, (430, 20, 1480, 910)),
    'tilt':   (300, (620, 120, 1700, 940)),
}


def cut(src):
    os.makedirs(os.path.join(HERE, 'frames'), exist_ok=True)
    for name, (f, box) in CROPS.items():
        im = Image.open(os.path.join(src, f'f{f:04d}.png')).convert('RGB').crop(box)
        im.thumbnail((1400, 1400))
        im.save(os.path.join(HERE, 'frames', f'{name}.jpg'), quality=86, optimize=True)


def svg(body, bg=C['paper']):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">\n'
            f'  <defs>\n    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%">'
            f'<feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="{C["shade"]}" flood-opacity=".28"/></filter>\n  </defs>\n'
            f'  <rect width="{W}" height="{H}" fill="{bg}"/>\n{body}\n</svg>\n')


def photo(name, x, y, w, h, r=32, cid=None):
    cid = cid or f'c-{name}-{x}-{y}'
    return (f'<clipPath id="{cid}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}"/></clipPath>'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{C["cream"]}" filter="url(#sh)"/>'
            f'<image href="frames/{name}.jpg" x="{x}" y="{y}" width="{w}" height="{h}" '
            f'preserveAspectRatio="xMidYMid slice" clip-path="url(#{cid})"/>')


def pill(x, y, text, size=22, fg=C['cream'], bg=C['ink'], anchor='start'):
    w = sum(size * (1.0 if ord(ch) > 255 else 0.6) for ch in text) + size * 1.2
    x0 = x - w / 2 if anchor == 'middle' else x
    return (f'<rect x="{x0:.0f}" y="{y - size * 1.05:.0f}" width="{w:.0f}" height="{size * 1.55:.0f}" rx="{size * 0.55:.0f}" fill="{bg}"/>'
            f'<text x="{x0 + size * 0.6:.0f}" y="{y:.0f}" {CN} font-weight="700" font-size="{size}" fill="{fg}">{text}</text>')


def text(x, y, s, size, weight=700, fill=C['ink'], anchor='start', ls=0):
    return (f'<text x="{x}" y="{y}" {CN} font-weight="{weight}" font-size="{size}" fill="{fill}" '
            f'text-anchor="{anchor}" letter-spacing="{ls}">{s}</text>')


def block(x, y, w, h, top, side, front):
    """一块等距小方块（底面中心在 x, y）"""
    d = w * 0.5
    return (f'<path d="M{x - d},{y - h} l{d},{-d * 0.5} l{d},{d * 0.5} l{-d},{d * 0.5}z" fill="{top}"/>'
            f'<path d="M{x - d},{y - h} l{d},{d * 0.5} v{h} l{-d},{-d * 0.5}z" fill="{front}"/>'
            f'<path d="M{x + d},{y - h} l{-d},{d * 0.5} v{h} l{d},{-d * 0.5}z" fill="{side}"/>')


SWATCH = ['paper', 'cream', 'soil', 'mint', 'pink', 'lilac', 'sky', 'butter', 'coral', 'ink', 'shade']
RULES = [('一块块搭', '砸下来：60% 自由落体 · 压扁 16% · 回弹'),
         ('切开一面墙', '底座四边切齐，露出 4 层土'),
         ('移轴 = 变小', '长焦 fov 20° · 俯视 30° · 清楚带 26%'),
         ('房间就是遥控器', '点哪件家具，就开关哪件'),
         ('暖光 = 有人住', '奶油 → 蜜桃粉 → 薰衣草；灯 #FFC77A')]


def poster():
    b = [photo('night', 64, 64, 952, 900, 40)]
    b.append(pill(104, 128, '018 · DIORAMA', 22))
    b.append(text(64, 1110, '微缩景观', 132, 900))
    b.append(text(68, 1172, '把世界放上桌面', 40, 700, C['shade']))
    b.append(text(68, 1226, '一块块搭 · 切开一面墙 · 移轴 = 变小 · 暖光 = 有人住', 22, 700, C['mute']))
    for i, k in enumerate(['mint', 'pink', 'lilac', 'butter', 'sky', 'coral']):
        b.append(f'<circle cx="{770 + i * 46}" cy="1282" r="16" fill="{C[k]}"/>')
    b.append(text(68, 1290, '1950s 模型铁路 → 2001 Miniatur Wunderland → 今天', 18, 700, C['mute']))
    return svg('\n'.join(b))


def cheatsheet():
    b = [text(64, 120, '微缩景观 · 速查', 64, 900), text(66, 166, 'DIORAMA CHEAT SHEET · 018', 20, 700, C['mute'], ls=4)]
    # 五条规则
    for i, (t, d) in enumerate(RULES):
        y = 250 + i * 92
        b.append(f'<circle cx="92" cy="{y - 14}" r="26" fill="{C[["mint", "pink", "sky", "butter", "lilac"][i]]}"/>')
        b.append(text(92, y - 4, f'0{i + 1}', 22, 900, C['ink'], 'middle'))
        b.append(text(138, y - 8, t, 32, 900))
        b.append(text(138, y + 26, d, 19, 700, C['mute']))
    # 签名物理：一块方块落下 → 压扁 → 回弹 → 停
    y0 = 900
    b.append(text(64, 712, '签名物理 · slam', 28, 900))
    b.append(f'<line x1="64" y1="{y0}" x2="1016" y2="{y0}" stroke="{C["soil"]}" stroke-width="4" stroke-linecap="round"/>')
    stages = [(150, 60, 80, '出发'), (330, 25, 80, '越落越快'), (510, 0, 67, '压扁 16%'), (690, 0, 84, '过冲 5%'), (870, 0, 80, '停')]
    for x, lift, h, lab in stages:
        b.append(f'<ellipse cx="{x}" cy="{y0 + 4}" rx="{44 - lift * 0.2}" ry="9" fill="{C["shade"]}" opacity=".18"/>')
        w = 80 * (80 / h) ** 0.5
        b.append(block(x, y0 - lift, w, h, C['peach'], C['pink'], '#E77895'))
        b.append(text(x, y0 + 46, lab, 20, 700, C['shade'], 'middle'))
    for x in (240, 420, 600, 780):
        b.append(f'<path d="M{x - 16},{y0 - 120} l24,0 m-8,-8 l8,8 l-8,8" stroke="{C["mute"]}" stroke-width="3" fill="none" stroke-linecap="round"/>')
    # 色板
    b.append(text(64, 1004, '色板', 28, 900))
    for i, k in enumerate(SWATCH):
        x = 64 + (i % 6) * 160
        y = 1032 + (i // 6) * 132
        b.append(f'<rect x="{x}" y="{y}" width="140" height="74" rx="18" fill="{C[k]}" stroke="#3B355222"/>')
        b.append(text(x + 4, y + 100, C[k].upper(), 17, 700, C['ink']))
    b.append(text(64 + 5 * 160, 1032 + 132 + 30, '阴影往暖紫里混', 18, 700, C['shade']))
    b.append(text(64 + 5 * 160, 1032 + 132 + 58, '不发灰', 18, 700, C['shade']))
    b.append(text(64, 1310, '字体：Noto Sans SC Black · Inter 800    镜头：长焦 + 俯视 + 移轴', 18, 700, C['mute']))
    return svg('\n'.join(b))


def app_ui():
    b = [text(64, 120, '如果微缩景观来做 App', 52, 900), text(66, 166, '智能家居：房间就是遥控器', 24, 700, C['shade'])]
    px, py, pw, ph = 120, 220, 520, 1060
    b.append(f'<rect x="{px}" y="{py}" width="{pw}" height="{ph}" rx="64" fill="{C["ink"]}" filter="url(#sh)"/>')
    sx, sy, sw, sh = px + 18, py + 18, pw - 36, ph - 36
    b.append(f'<rect x="{sx}" y="{sy}" width="{sw}" height="{sh}" rx="48" fill="{C["cream"]}"/>')
    b.append(text(sx + 36, sy + 52, '9:41', 20, 700))
    b.append(text(sx + 36, sy + 116, '我的房间', 38, 900))
    b.append(text(sx + 36, sy + 150, '3 盏灯亮着 · 22°C', 19, 700, C['mute']))
    b.append(photo('room', sx + 20, sy + 178, sw - 40, 420, 30, 'c-app-room'))
    # 模型上的热点
    for hx, hy, k in ((sx + 330, sy + 300, 'butter'), (sx + 180, sy + 420, 'pink'), (sx + 360, sy + 470, 'sky')):
        b.append(f'<circle cx="{hx}" cy="{hy}" r="20" fill="{C[k]}" stroke="{C["cream"]}" stroke-width="5"/>')
    cards = [('落地灯', '开 · 暖光 2700K', 'butter', True), ('唱片机', '正在播放', 'pink', True),
             ('空调', '22°C · 自动', 'sky', False), ('窗帘', '关', 'lilac', False)]
    for i, (t, d, k, on) in enumerate(cards):
        cx = sx + 20 + (i % 2) * ((sw - 52) / 2 + 12)
        cy = sy + 624 + (i // 2) * 176
        cw = (sw - 52) / 2
        b.append(f'<rect x="{cx:.0f}" y="{cy}" width="{cw:.0f}" height="160" rx="28" fill="{C[k] if on else "#FFFDF7"}" stroke="#3B35521a"/>')
        b.append(block(cx + 44, cy + 64, 40, 26, C['cream'], C[k] if not on else C['ink'], C['shade']))
        b.append(text(int(cx + 24), cy + 108, t, 26, 900))
        b.append(text(int(cx + 24), cy + 138, d, 17, 700, C['ink'] if on else C['mute']))
        tx = cx + cw - 82
        b.append(f'<rect x="{tx:.0f}" y="{cy + 24}" width="60" height="34" rx="17" fill="{C["ink"] if on else "#E6DED0"}"/>')
        b.append(f'<circle cx="{tx + (43 if on else 17):.0f}" cy="{cy + 41}" r="12" fill="#FFFDF7"/>')
    # 右边的批注
    notes = [(560, '模型就是控件', '点哪件家具，就开关哪件'), (780, '颜色一一对应', '卡片的颜色 = 家具的颜色'),
             (1000, '开着的灯会亮', '暖光 #FFC77A，关掉就暗'), (1180, '进场一块块搭', '打开 App 时房间从碎块里搭起来')]
    for y, t, d in notes:
        b.append(f'<line x1="{px + pw + 10}" y1="{y - 10}" x2="{px + pw + 44}" y2="{y - 10}" stroke="{C["shade"]}" stroke-width="3"/>')
        b.append(text(px + pw + 56, y, t, 26, 900))
        b.append(text(px + pw + 56, y + 34, d, 17, 700, C['mute']))
    return svg('\n'.join(b))


def steps():
    b = [text(64, 120, '四步：从一堆方块到微缩景观', 50, 900), text(66, 166, 'FOUR STEPS · 018 DIORAMA', 20, 700, C['mute'], ls=4)]
    panels = [('rubble', '碎块砸下来', '先有一堆小块：自由落体、压扁、回弹'),
              ('base', '底座切齐', '四边切齐，看到土层和木框'),
              ('street', '一块块搭好', '房子升起、屋顶砸下、电线拉过去'),
              ('night', '移轴 + 入夜', '长焦、上下变虚；窗户一盏盏亮')]
    for i, (n, t, d) in enumerate(panels):
        x = 64 + (i % 2) * 484
        y = 220 + (i // 2) * 560
        b.append(photo(n, x, y, 468, 420, 30))
        b.append(f'<circle cx="{x + 40}" cy="{y + 40}" r="24" fill="{C["ink"]}"/>')
        b.append(text(x + 40, y + 49, str(i + 1), 24, 900, C['cream'], 'middle'))
        b.append(text(x + 4, y + 470, t, 32, 900))
        b.append(text(x + 4, y + 506, d, 19, 700, C['mute']))
    return svg('\n'.join(b))


if __name__ == '__main__':
    if len(sys.argv) > 1:
        cut(sys.argv[1])
    for name, fn in (('poster', poster), ('cheatsheet', cheatsheet), ('app-ui', app_ui), ('steps', steps)):
        open(os.path.join(HERE, f'{name}.svg'), 'w', encoding='utf-8').write(fn())
        print('wrote', name)
