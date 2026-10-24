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
    (24, '钩子', '六张读不了'),
    (102, '成叠', '只留 3–4'),
    (186, '抽', 'Harbor 离开'),
    (234, '接手', '下一张 SNAP'),
    (342, '深度', '沿 z 拉开'),
    (414, '提', 'Night Bus 穿过'),
    (546, '比较', '浅扇'),
    (666, '压', '选定 Stairwell'),
    (750, '作品集', '一次一张'),
    (966, '看板', 'To → Doing'),
    (1146, '定稿', '压下去'),
    (1218, '吸入', '回到 3–4'),
]

PAIRS = [
    (12, 40, '乱叠：读不了'),
    (90, 130, '吸成可读叠'),
    (186, 234, '抽走 → 接手'),
    (402, 450, '后层提起'),
    (606, 666, '比较 → 压下'),
    (954, 1002, '看板跨列'),
    (1134, 1160, '样张定稿'),
    (1170, 1220, '鬼叠 → 3–4'),
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
    draw.text((pad, 28), '布局 03 · Card Stack v8 分镜', font=title, fill='#F5F5F7')
    draw.text((pad, 74), '22s · 选片台 · 抽 / 提 / 压', font=sub, fill='#94A3B8')
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
    draw.text((pad, 28), '布局 03 · v8 运动证据', font=title, fill='#F5F5F7')
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
    draw.text((32, 24), '布局 03 · v8 时间轴  1320f / 22s · 选片台一条线', font=title, fill='#F5F5F7')
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
