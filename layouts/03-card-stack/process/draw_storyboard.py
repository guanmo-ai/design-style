"""v7 高密度分镜：每格 同屏 n + 场景 + 动效招式。"""
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.normpath(os.path.join(ROOT, '..', '..', '..'))
FONT_DIR = os.path.join(REPO, 'public', 'fonts')
PAPER, INK, RED, TEAL, NIGHT, CREAM = '#EDE6D6', '#111111', '#E31C23', '#163A3A', '#0C0C0E', '#F6F0E4'
COLS = ['#E31C23', '#F6F0E4', '#0C0C0E', '#163A3A', '#C8B89A', '#9A3B2F', '#3D4A2C', '#D4A59A',
        '#E36A4A', '#3A3F4B', '#C4A35A', '#2F4F3E', '#2B4C7E', '#6B3FA0', '#C45C26', '#1F6B6B']

CELLS = [
    (0, 16, '风暴', 'slam + 错峰', '16 张不同尺寸角度砸进'),
    (30, 16, '风暴', '散射', '继续散开，不是四张停'),
    (60, 16, '风暴', '落 4×4', '错峰落拍进格'),
    (90, 16, '风暴', '压成乱叠', '16→一堆'),
    (180, 16, '刊', '抽', '4 大刊 + 12 脊'),
    (300, 16, '层', '提', '16 条图层穿过 z'),
    (420, 16, '样', '扇', '弧形扇开'),
    (480, 16, '样', '选定+压', '一张放大其余压回'),
    (540, 16, '看板', '发牌', '3 列泳道'),
    (600, 16, '看板', '跨列', 'To → Doing'),
    (660, 16, '相册', '洗牌', '宝丽来错位'),
    (780, 16, '通知', '压下', '新层从顶上压进'),
    (900, 16, '支付', '扇出手牌', '卡组在手里'),
    (1020, 16, '作品集', '分组叠 + 炸开', '三叠，每叠 3–4'),
    (1140, 24, '坏例', '挤乱', '再加 8 张'),
    (1200, 4, '好例', '吸入叠回', '弹簧吸回 3–4'),
]


def font(name, size):
    return ImageFont.truetype(os.path.join(FONT_DIR, name), size)


def mini(draw, x, y, w, h, n, kind):
    if kind in ('风暴', '相册', '坏例'):
        for i in range(min(n, 16)):
            px = x + 16 + (i % 4) * 90 + (i % 3) * 4
            py = y + 16 + (i // 4) * 50
            draw.rounded_rectangle([px, py, px + 70, py + 42], 3, fill=COLS[i % 16])
        return
    if kind == '层':
        for i in range(8):
            draw.rounded_rectangle([x + 20 + i * 6, y + 24 + i * 22, x + w - 30, y + 48 + i * 22], 2, fill=COLS[i])
        return
    if kind == '样':
        for i in range(6):
            draw.rounded_rectangle([x + 24 + i * 58, y + 30 + abs(i - 2.5) * 8, x + 70 + i * 58, y + h - 30], 3, fill=COLS[i])
        return
    if kind == '看板':
        for c in range(3):
            for r in range(4):
                draw.rounded_rectangle([x + 24 + c * 120, y + 22 + r * 48, x + 130 + c * 120, y + 60 + r * 48], 3, fill=COLS[c * 4 + r])
        return
    if kind == '通知':
        for i in range(6):
            draw.rounded_rectangle([x + 40, y + 20 + i * 32, x + w - 40, y + 46 + i * 32], 4, fill=COLS[i])
        return
    if kind in ('刊', '支付', '作品集', '好例'):
        for i in range(min(4, n)):
            draw.rounded_rectangle([x + 80 - i * 22, y + 28 - i * 14, x + 200 - i * 22, y + h - 36 - i * 8], 4, fill=COLS[i])
        return


def main():
    cols, rows = 4, 4
    tw, th = 400, 248
    pad, head, foot = 28, 140, 78
    W = pad + cols * (tw + pad)
    H = head + rows * (th + foot) + pad
    img = Image.new('RGB', (W, H), PAPER)
    draw = ImageDraw.Draw(img)
    title = font('NotoSansSC-Bold.otf', 34)
    sub = font('NotoSansSC-Regular.otf', 16)
    cap = font('NotoSansSC-Bold.otf', 17)
    why = font('NotoSansSC-Regular.otf', 14)
    tiny = font('GeistMono-Regular.ttf', 13)
    draw.rectangle([0, 0, W, 8], fill=RED)
    draw.text((pad, 24), '布局 03 · v7 高密度分镜  ·  16 卡 / 8 方案 / 14 招', font=title, fill=INK)
    draw.text((pad, 72), '每格：同屏 n + 场景 + 动效招式。不是四张海报换皮。对照 Swiss 72 格 / Bento 7 卡 8 布局。', font=sub, fill='#5C564C')
    draw.text((pad, 100), '22s · 1320f · 120 BPM', font=tiny, fill=RED)
    for i, (fr, n, act, move, cause) in enumerate(CELLS):
        r, c = divmod(i, cols)
        x = pad + c * (tw + pad)
        y = head + r * (th + foot)
        bg = NIGHT if act in ('风暴', '层', '通知', '支付') else CREAM
        draw.rounded_rectangle([x, y, x + tw, y + th], 6, fill=bg)
        mini(draw, x, y, tw, th, n, act)
        draw.text((x, y + th + 8), f'n={n}  ·  {act}  ·  f{fr}', font=tiny, fill=RED)
        draw.text((x, y + th + 28), move, font=cap, fill=INK)
        draw.text((x, y + th + 50), cause, font=why, fill='#5C564C')
    out = os.path.join(ROOT, '01-storyboard.jpg')
    img.save(out, quality=94, optimize=True)
    print('wrote', out)


if __name__ == '__main__':
    main()
