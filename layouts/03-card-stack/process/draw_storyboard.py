"""v8 专业意义分镜：每格 观众学到什么 + 动效招式。"""
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.normpath(os.path.join(ROOT, '..', '..', '..'))
FONT_DIR = os.path.join(REPO, 'public', 'fonts')
PAPER, INK, RED, TEAL, NIGHT, CREAM, SAND = '#EDE6D6', '#111111', '#E31C23', '#163A3A', '#0C0C0E', '#F6F0E4', '#C8B89A'
SHOTS = ['#1B2A38', '#C8B89A', '#121214', '#D4E2EA', '#9A3B2F', '#8A8E92']

CELLS = [
    (0, '钩子 · 选片台', '六张一样亮，读不了', '乱叠挤在一起', '先认出这是坏的审片'),
    (90, '原则 · 成叠', '只留 3–4 张，读最上面', '弹簧叠回', '证明：第五张是噪声'),
    (186, '原则 · 抽', '换层 = 抽走正在看的', 'Harbor 弧线离开', '不是瞬切'),
    (234, '原则 · 接手', '下一张弹到交互面', 'Stairwell SNAP 补位', '深度排序在工作'),
    (342, '原则 · 深度', '层叠是前后，不是平铺', '沿 z 轻轻拉开', '仍只读一张'),
    (414, '原则 · 提', '后层提到最前才可读', 'Night Bus 穿过 z', '提 = 换焦点'),
    (546, '原则 · 比较', '可以看几张，还没决定', '浅扇', '扇不是每张都当焦点'),
    (666, '原则 · 压', '选定封面，其余压回', '压下 Stairwell', '同时只读一张'),
    (750, '落地 · 作品集', '选封面：一次只定一张', '变形进作品集', '同一原则，一个决策'),
    (966, '落地 · 看板', '跨列：只处理这一张', 'To → Doing', '正在处理 = 焦点卡'),
    (1146, '落地 · 样张', '定稿：压下去', '样张压实', '印刷定稿也是压'),
    (1218, '坏→好 + 定妆', '叠太多 → 3–4 张', '挤乱再吸入', '三句话都已用画面证明'),
]


def font(name, size):
    return ImageFont.truetype(os.path.join(FONT_DIR, name), size)


def mini(draw, x, y, w, h, kind):
    if kind.startswith('钩子'):
        for i, c in enumerate(SHOTS):
            draw.rounded_rectangle([x + 40 + i * 28, y + 36 + (i % 3) * 18, x + 200 + i * 18, y + 200 + (i % 2) * 10], 4, fill=c)
        return
    if '成叠' in kind or '接手' in kind or '压' in kind or '坏' in kind:
        for i, c in enumerate(SHOTS[:4]):
            draw.rounded_rectangle([x + 90 - i * 16, y + 28 - i * 12, x + 230 - i * 16, y + 210 - i * 8], 4, fill=c)
        return
    if '抽' in kind:
        draw.rounded_rectangle([x + 24, y + 40, x + 120, y + 170], 4, fill=SHOTS[0])
        for i, c in enumerate(SHOTS[1:4]):
            draw.rounded_rectangle([x + 150 - i * 14, y + 36 - i * 10, x + 280 - i * 14, y + 210 - i * 8], 4, fill=c)
        return
    if '深度' in kind or '提' in kind:
        for i, c in enumerate(SHOTS[:4]):
            draw.rounded_rectangle([x + 30 + i * 18, y + 24 + i * 36, x + w - 30, y + 52 + i * 36], 3, fill=c)
        return
    if '比较' in kind or '样张' in kind:
        for i, c in enumerate(SHOTS[:5]):
            draw.rounded_rectangle([x + 28 + i * 52, y + 30 + abs(i - 2) * 10, x + 70 + i * 52, y + h - 24], 3, fill=c)
        return
    if '看板' in kind:
        for c in range(3):
            for r in range(2):
                draw.rounded_rectangle([x + 24 + c * 110, y + 28 + r * 80, x + 120 + c * 110, y + 96 + r * 80], 4, fill=SHOTS[c * 2 + r])
        return
    if '作品集' in kind:
        draw.rounded_rectangle([x + 24, y + 28, x + 150, y + 210], 4, fill=SHOTS[1])
        for i, c in enumerate(SHOTS[2:5]):
            draw.rounded_rectangle([x + 170 - i * 10, y + 40 - i * 8, x + 280 - i * 10, y + 200 - i * 6], 4, fill=c)
        return


def main():
    cols, rows = 4, 3
    tw, th = 400, 236
    pad, head, foot = 28, 150, 86
    W = pad + cols * (tw + pad)
    H = head + rows * (th + foot) + pad
    img = Image.new('RGB', (W, H), PAPER)
    draw = ImageDraw.Draw(img)
    title = font('NotoSansSC-Bold.otf', 32)
    sub = font('NotoSansSC-Regular.otf', 16)
    cap = font('NotoSansSC-Bold.otf', 16)
    why = font('NotoSansSC-Regular.otf', 14)
    tiny = font('GeistMono-Regular.ttf', 13)
    draw.rectangle([0, 0, W, 8], fill=RED)
    draw.text((pad, 22), '布局 03 · v8 专业意义分镜', font=title, fill=INK)
    draw.text((pad, 68), '一件事：层叠 = 深度排序 + 只读一张 + 抽 / 提 / 压。不是 v7 减卡。', font=sub, fill='#5C564C')
    draw.text((pad, 98), '每格：观众学到什么  +  动效招式     22s · 选片台一条线', font=tiny, fill=RED)
    for i, (fr, act, learn, move, cause) in enumerate(CELLS):
        r, c = divmod(i, cols)
        x = pad + c * (tw + pad)
        y = head + r * (th + foot)
        bg = NIGHT if act.startswith('钩子') or '提' in act or '看板' in act else (SAND if '压' in act or '样' in act else CREAM)
        draw.rounded_rectangle([x, y, x + tw, y + th], 6, fill=bg)
        mini(draw, x, y, tw, th, act)
        draw.text((x, y + th + 6), f'{act}  ·  f{fr}', font=tiny, fill=RED)
        draw.text((x, y + th + 26), learn, font=cap, fill=INK)
        draw.text((x, y + th + 50), f'{move}  ·  {cause}', font=why, fill='#5C564C')
    out = os.path.join(ROOT, '00-meaning.jpg')
    img.save(out, quality=94, optimize=True)
    print('wrote', out)


if __name__ == '__main__':
    main()
