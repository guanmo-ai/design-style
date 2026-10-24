"""v6 分镜页：每格新元素 + 因果动效。不依赖成片，证明不是旧片换皮。"""
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.normpath(os.path.join(ROOT, '..', '..', '..'))
FONT_DIR = os.path.join(REPO, 'public', 'fonts')

PAPER, CREAM, INK, RED, TEAL, SAND, NIGHT = '#EDE6D6', '#F6F0E4', '#111111', '#E31C23', '#163A3A', '#C8B89A', '#0C0C0E'
BONE = '#E8DFD0'

CELLS = [
    (0, '砸进', '四张竖版海报砸出', '过冲落成一叠', 'stack', '抽'),
    (30, '砸进', '朱红刊 03 在最前', '顶刊再抬 18px', 'lift', '抽'),
    (90, '刊·抽', '巨字「抽」扎进封面', '这本正在被读', 'read', '抽'),
    (120, '刊·抽', '朱红刊沿弧抽出', '换层 = 抽走正在看的', 'pull', '提'),
    (150, '刊·抽', '奶油刊「提」接手', '下一本弹到最前', 'land', '提'),
    (210, '刊·抽', '奶油刊再抽一次', '动作可重复', 'pull2', '压'),
    (240, '刊·抽', '墨刊「压」到顶', '同一叠，换封面', 'land2', '压'),
    (300, '层·提', '压扁成四块图层板', '形态变、身份不变', 'sheets', 'L'),
    (330, '层·提', 'L4 被红框点名', '要处理的不是最上面', 'mark', 'L4'),
    (360, '层·提', 'L4 穿过深度挤上来', '换层 = 提', 'rise', 'L4'),
    (480, '样·压', '扇开四张印刷样', 'Munken / Curious', 'fan', '样'),
    (540, '样·压', '第二张放大选定', '推到交互面', 'pick', '选'),
    (570, '样·压', '其余压暗收回', '换层 = 压', 'press', '压'),
    (630, '拆解', '沿 z 炸开 + 规则', '3–4 / 一张 / 抽提压', 'teach', '3–4'),
    (840, '坏→好', '八张杂刊在动', '第五张开始数不清', 'noise', '杂'),
    (960, '坏→好', '四张弹簧叠回', '3–4、抬、露、暗', 'fix', '叠'),
]


def font(name, size):
    return ImageFont.truetype(os.path.join(FONT_DIR, name), size)


def stack_posters(draw, x, y, w, h, colors, lift=0, skip=0, verb='', vfnt=None, vfill='#F6F0E4'):
    shown = colors[skip:]
    for i, c in reversed(list(enumerate(shown[:4]))):
        pw, ph = 92, int(h - 56)
        px = x + 48 - i * 18
        py = y + 22 - i * 12 - (lift if i == 0 else 0)
        draw.rounded_rectangle([px, py, px + pw, py + ph], 5, fill=c, outline='#111111', width=1)
        if i == 0 and verb and vfnt:
            draw.text((px + 10, py + 16), verb, font=vfnt, fill=vfill)


def posters(draw, x, y, w, h, kind, verb, vfnt, sfnt):
    cols = [RED, CREAM, NIGHT, TEAL]
    if kind == 'stack':
        stack_posters(draw, x, y, w, h, cols, 0, 0, verb, vfnt, CREAM)
    elif kind == 'lift':
        stack_posters(draw, x, y, w, h, cols, 16, 0, verb, vfnt, CREAM)
    elif kind == 'read':
        stack_posters(draw, x + 20, y, w, h, cols, 8, 0, verb, vfnt, CREAM)
    elif kind == 'pull':
        draw.polygon([(x + 16, y + 36), (x + 4, y + 70), (x + 16, y + 104)], fill=RED)
        stack_posters(draw, x + 10, y, w, h, cols, 4, 1, verb, vfnt, INK)
    elif kind == 'land':
        stack_posters(draw, x, y, w, h, cols[1:], 14, 0, verb, vfnt, INK)
    elif kind == 'pull2':
        draw.polygon([(x + 16, y + 36), (x + 4, y + 70), (x + 16, y + 104)], fill=RED)
        stack_posters(draw, x + 10, y, w, h, [NIGHT, TEAL], 4, 0, verb, vfnt, CREAM)
    elif kind == 'land2':
        stack_posters(draw, x, y, w, h, [NIGHT, TEAL], 14, 0, verb, vfnt, CREAM)
    elif kind == 'sheets':
        for i, c in enumerate(cols):
            px, py = x + 28 + i * 12, y + 36 + (3 - i) * 28
            draw.rounded_rectangle([px, py, px + w - 80, py + 36], 3, fill=c)
            draw.text((px + 10, py + 8), f'L{i + 1}', font=sfnt, fill=CREAM if c != CREAM else INK)
    elif kind == 'mark':
        for i, c in enumerate(cols):
            px, py = x + 28 + i * 12, y + 36 + (3 - i) * 28
            draw.rounded_rectangle([px, py, px + w - 80, py + 36], 3, fill=c)
        draw.rectangle([x + 28, y + 36, x + w - 40, y + 76], outline=RED, width=3)
        draw.text((x + 40, y + 42), 'L4', font=sfnt, fill=RED)
    elif kind == 'rise':
        for i, c in enumerate([RED, CREAM, NIGHT]):
            px, py = x + 40 + i * 10, y + 70 + i * 22
            draw.rounded_rectangle([px, py, px + w - 100, py + 32], 3, fill=c)
        draw.rounded_rectangle([x + 24, y + 18, x + w - 48, y + 62], 4, fill=TEAL, outline=RED, width=3)
        draw.text((x + 40, y + 26), 'L4  提到最前', font=sfnt, fill=CREAM)
    elif kind == 'fan':
        names = ['MK', 'CU', 'FE', 'CP']
        for i, c in enumerate(cols):
            px = x + 28 + i * 84
            py = y + 20 + abs(i - 1.5) * 10
            draw.rounded_rectangle([px, py, px + 72, py + h - 44], 4, fill=c)
            draw.text((px + 8, py + 12), names[i], font=sfnt, fill=CREAM if c != CREAM else INK)
    elif kind == 'pick':
        draw.rounded_rectangle([x + 24, y + 48, x + 90, y + h - 28], 4, fill=RED)
        draw.rounded_rectangle([x + 108, y + 16, x + w - 28, y + h - 16], 5, fill=CREAM, outline=RED, width=4)
        draw.text((x + 124, y + 36), 'CURIOUS', font=sfnt, fill=INK)
        draw.text((x + 124, y + 64), '选定', font=vfnt, fill=RED)
    elif kind == 'press':
        stack_posters(draw, x + 20, y, w, h, [CREAM, RED, NIGHT, TEAL], 12, 0, verb, vfnt, INK)
    elif kind == 'teach':
        for i, t in enumerate(['3–4', '一张', '抽提压', '24×30']):
            px, py = x + 24 + i * 22, y + 22 + i * 32
            draw.rounded_rectangle([px, py, px + 150, py + 40], 4, fill=CREAM, outline=INK, width=1)
            draw.rectangle([px, py, px + 10, py + 40], fill=RED)
            draw.text((px + 18, py + 8), t, font=sfnt, fill=INK)
    elif kind == 'noise':
        extras = [SAND, RED, TEAL, BONE, NIGHT, CREAM, '#5C564C', '#C4161C']
        for i, c in enumerate(extras):
            px = x + 20 + (i % 4) * 88 + (i % 2) * 6
            py = y + 18 + (i // 4) * 78
            draw.rounded_rectangle([px, py, px + 78, py + 66], 4, fill=c)
        draw.text((x + 28, y + 28), '杂', font=vfnt, fill=INK)
    elif kind == 'fix':
        stack_posters(draw, x, y, w, h, cols, 16, 0, '叠', vfnt, CREAM)


def main():
    cols, rows = 4, 4
    tw, th = 400, 248
    pad, head, foot = 28, 140, 72
    W = pad + cols * (tw + pad)
    H = head + rows * (th + foot) + pad
    img = Image.new('RGB', (W, H), PAPER)
    draw = ImageDraw.Draw(img)
    title = font('NotoSansSC-Bold.otf', 36)
    sub = font('NotoSansSC-Regular.otf', 17)
    cap = font('NotoSansSC-Bold.otf', 18)
    why = font('NotoSansSC-Regular.otf', 15)
    tiny = font('GeistMono-Regular.ttf', 13)
    vfnt = font('NotoSansSC-Black.otf', 28)
    sfnt = font('NotoSansSC-Bold.otf', 16)
    draw.rectangle([0, 0, W, 8], fill=RED)
    draw.text((pad, 26), '布局 03 · v6 全新分镜  ·  刊 / 层 / 样', font=title, fill=INK)
    draw.text((pad, 76), '每格新元素 + 因果动效。已扔掉登机牌 / Stripe / 白 UI / 手机壳。不是旧片换皮。', font=sub, fill='#5C564C')
    draw.text((pad, 104), '22s · 1320f · 120 BPM · 抽 / 提 / 压', font=tiny, fill=RED)
    dark = {'砸进', '层·提', '拆解'}
    for i, (fr, act, el, cause, kind, verb) in enumerate(CELLS):
        r, c = divmod(i, cols)
        x = pad + c * (tw + pad)
        y = head + r * (th + foot)
        bg = NIGHT if act in dark and kind in ('stack', 'sheets', 'mark', 'rise', 'teach') else CREAM
        draw.rounded_rectangle([x, y, x + tw, y + th], 6, fill=bg)
        posters(draw, x, y, tw, th, kind, verb, vfnt, sfnt)
        draw.text((x, y + th + 8), f'{act}  ·  f{fr}', font=tiny, fill=RED)
        draw.text((x, y + th + 28), el, font=cap, fill=INK)
        draw.text((x, y + th + 50), cause, font=why, fill='#5C564C')
    out = os.path.join(ROOT, '01-storyboard.jpg')
    img.save(out, quality=94, optimize=True)
    print('wrote', out)


if __name__ == '__main__':
    main()
