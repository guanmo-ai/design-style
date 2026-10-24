"""Build storyboard / motion / timeline process sheets from the master film."""
import json
import os
import subprocess

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.normpath(os.path.join(ROOT, '..', '..', '..'))
MASTER = os.path.join(REPO, 'out', '03-card-stack-master.mp4')
STILLS = os.path.join(REPO, 'out', 'l03-stills')
FONT_DIR = os.path.join(REPO, 'public', 'fonts')

BOARD = [
    (18, '风暴 n=16', 'slam + 错峰'),
    (60, '风暴 4×4', '落格'),
    (102, '乱叠', '16 压成一堆'),
    (180, '刊 · 抽', '4 大 + 12 脊'),
    (300, '层 · 提', '16 条穿过 z'),
    (420, '样 · 扇', '弧形扇开'),
    (480, '选定+压', '一张放大'),
    (540, '看板', '发牌进泳道'),
    (600, '跨列', 'To → Doing'),
    (660, '相册 · 洗', '宝丽来洗牌'),
    (780, '通知 · 压', '新层压下'),
    (900, '支付 · 扇', '手牌抽出'),
    (1020, '作品集', '三叠 3–4'),
    (1080, 'z 炸开', '看见深度'),
    (1140, '坏例 n=24', '挤乱'),
    (1206, '吸入 n=4', '弹簧叠回'),
]

PAIRS = [
    (12, 36, '16 张错峰砸进'),
    (48, 72, '散射 → 4×4'),
    (210, 250, '抽走顶刊'),
    (330, 370, '后层提起'),
    (420, 460, '扇开样张'),
    (570, 610, '看板跨列'),
    (690, 726, '相册洗牌'),
    (1190, 1220, '24 → 4 吸入'),
]


def font(name, size):
    path = os.path.join(FONT_DIR, name)
    return ImageFont.truetype(path, size)


def grab(frame, dest):
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    t = frame / 60.0
    subprocess.run(
        ['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{t:.4f}', '-i', MASTER, '-frames:v', '1', dest],
        check=True,
    )


def label(draw, xy, text, fnt, fill, stroke=None):
    if stroke:
        draw.text(xy, text, font=fnt, fill=fill, stroke_width=stroke[0], stroke_fill=stroke[1])
    else:
        draw.text(xy, text, font=fnt, fill=fill)


def storyboard():
    cols, rows = 4, 4
    tw, th = 420, 236
    pad, head, foot = 28, 110, 52
    W = pad + cols * (tw + pad)
    H = head + rows * (th + foot) + pad
    img = Image.new('RGB', (W, H), '#0B0B0D')
    draw = ImageDraw.Draw(img)
    title = font('NotoSansSC-Bold.otf', 36)
    sub = font('Inter-Medium.ttf', 18)
    cap = font('NotoSansSC-Medium.otf', 20)
    why = font('NotoSansSC-Regular.otf', 15)
    draw.text((pad, 28), '布局 03 · Card Stack v7 分镜', font=title, fill='#F5F5F7')
    draw.text((pad, 74), '22s · 16 卡同屏 · 8 方案 · 14 招', font=sub, fill='#94A3B8')
    for i, (fr, name, cause) in enumerate(BOARD):
        r, c = divmod(i, cols)
        x = pad + c * (tw + pad)
        y = head + r * (th + foot)
        src = os.path.join(STILLS, f'b{fr:04d}.jpg')
        grab(fr, src)
        tile = Image.open(src).convert('RGB').resize((tw, th), Image.Resampling.LANCZOS)
        img.paste(tile, (x, y))
        draw.text((x, y + th + 8), f'{name}  ·  f{fr}', font=cap, fill='#E2E8F0')
        draw.text((x, y + th + 30), cause, font=why, fill='#94A3B8')
    out = os.path.join(ROOT, '01-storyboard.jpg')
    img.save(out, quality=92, optimize=True)
    print('wrote', out)


def motion():
    tw, th = 400, 225
    gap, pad, head = 16, 28, 110
    cols = 2
    rows = len(PAIRS)
    W = pad + cols * (tw * 2 + gap + 36) // 1
    # two frames + arrow per row
    cell_w = tw * 2 + gap + 48
    W = pad * 2 + cell_w
    H = head + rows * (th + 48) + pad
    img = Image.new('RGB', (W, H), '#0B0B0D')
    draw = ImageDraw.Draw(img)
    title = font('NotoSansSC-Bold.otf', 36)
    sub = font('Inter-Medium.ttf', 18)
    cap = font('NotoSansSC-Medium.otf', 18)
    draw.text((pad, 28), '布局 03 · v7 运动证据', font=title, fill='#F5F5F7')
    draw.text((pad, 74), '同一机位相隔约 0.3s · 必须看出位移或形变', font=sub, fill='#94A3B8')
    for i, (a, b, name) in enumerate(PAIRS):
        y = head + i * (th + 48)
        sa = os.path.join(STILLS, f'm{a:04d}.jpg')
        sb = os.path.join(STILLS, f'm{b:04d}.jpg')
        grab(a, sa)
        grab(b, sb)
        ia = Image.open(sa).convert('RGB').resize((tw, th), Image.Resampling.LANCZOS)
        ib = Image.open(sb).convert('RGB').resize((tw, th), Image.Resampling.LANCZOS)
        img.paste(ia, (pad, y))
        img.paste(ib, (pad + tw + 48, y))
        cx = pad + tw + 18
        cy = y + th // 2
        draw.polygon([(cx, cy - 8), (cx + 22, cy), (cx, cy + 8)], fill='#FF2D6F')
        draw.text((pad, y + th + 8), f'{name}   f{a} → f{b}', font=cap, fill='#E2E8F0')
    out = os.path.join(ROOT, '02-motion.jpg')
    img.save(out, quality=92, optimize=True)
    print('wrote', out)


def timeline():
    with open(os.path.join(ROOT, 'timeline.json'), encoding='utf-8') as f:
        data = json.load(f)
    W, H = 1600, 420
    img = Image.new('RGB', (W, H), '#0B0B0D')
    draw = ImageDraw.Draw(img)
    title = font('NotoSansSC-Bold.otf', 32)
    sub = font('Inter-Medium.ttf', 16)
    small = font('NotoSansSC-Regular.otf', 14)
    draw.text((32, 24), '布局 03 · v7 时间轴  1320f / 22s · 16 卡 / 8 方案', font=title, fill='#F5F5F7')
    draw.text((32, 68), '每一格都能说出为什么动', font=sub, fill='#94A3B8')
    x0, x1, y = 32, W - 32, 160
    frames = data['frames']
    for seg in data['segments']:
        a = x0 + (x1 - x0) * seg['start'] / frames
        b = x0 + (x1 - x0) * (seg['start'] + seg['dur']) / frames
        draw.rounded_rectangle([a, y, b - 4, y + 56], 8, fill=seg['color'])
        ink = '#0F172A' if seg['color'] in ('#F4F5F7', '#E8E4DC') else '#F8FAFC'
        draw.text((a + 10, y + 18), seg['label'], font=small, fill=ink)
    for beat in data['beats']:
        x = x0 + (x1 - x0) * beat['f'] / frames
        draw.line([(x, y + 70), (x, y + 86)], fill='#FF2D6F', width=2)
    ticks = font('GeistMono-Regular.ttf', 12)
    for sec in range(0, 22, 3):
        x = x0 + (x1 - x0) * (sec * 60) / frames
        draw.text((x, y + 96), f'{sec}s', font=ticks, fill='#64748B')
    out = os.path.join(ROOT, '04-timeline.png')
    img.save(out)
    print('wrote', out)


if __name__ == '__main__':
    os.makedirs(STILLS, exist_ok=True)
    storyboard()
    motion()
    timeline()
