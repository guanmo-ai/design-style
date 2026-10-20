#!/usr/bin/env python3
"""联系表（contact sheet）：把视频帧或现有图片拼成一张带标注的过程图。

用法：
  python3 scripts/contact_sheet.py OUT.jpg --title "标题" --cols 4 \
      --video out/001-bauhaus.mp4 --fps 60  "100|开场" "165|01 色彩" ...
  python3 scripts/contact_sheet.py OUT.jpg --title "v1" --cols 6  "out/final/f045.png|f045" ...

每个条目写成 “帧号|标注” 或 “图片路径|标注”；帧号会用 ffmpeg 从 --video 里精确抽出。
"""
import argparse, os, subprocess, tempfile
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_CN = os.path.join(ROOT, 'public/fonts/NotoSansSC-Bold.otf')
FONT_MONO = os.path.join(ROOT, 'public/fonts/JetBrainsMono.ttf')
INK, PAPER, RED, GREY = (17, 17, 17), (236, 231, 220), (219, 58, 38), (150, 146, 138)


def grab(video, frame, fps, tmp):
    path = os.path.join(tmp, f'f{frame:04d}.png')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{frame / fps:.4f}', '-i', video,
                    '-frames:v', '1', path], check=True)
    return path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('out')
    ap.add_argument('items', nargs='+')
    ap.add_argument('--title', default='')
    ap.add_argument('--note', default='')
    ap.add_argument('--video')
    ap.add_argument('--fps', type=float, default=60)
    ap.add_argument('--cols', type=int, default=4)
    ap.add_argument('--width', type=int, default=480, help='每格宽度（16:9）')
    a = ap.parse_args()

    w, h, gap, pad, lab = a.width, a.width * 9 // 16, 14, 40, 34
    rows = (len(a.items) + a.cols - 1) // a.cols
    head = (100 if a.note else 70) if a.title else 0
    W = pad * 2 + a.cols * w + (a.cols - 1) * gap
    H = pad * 2 + head + rows * (h + lab) + (rows - 1) * gap
    sheet = Image.new('RGB', (W, H), INK)
    d = ImageDraw.Draw(sheet)
    f_title = ImageFont.truetype(FONT_CN, 36)
    f_note = ImageFont.truetype(FONT_CN, 18)
    f_lab = ImageFont.truetype(FONT_CN, 18)
    if a.title:
        d.rectangle([pad, pad + 8, pad + 12, pad + 44], fill=RED)
        d.text((pad + 28, pad - 2), a.title, font=f_title, fill=PAPER)
        if a.note:
            d.text((pad + 28, pad + 52), a.note, font=f_note, fill=GREY)

    with tempfile.TemporaryDirectory() as tmp:
        for i, item in enumerate(a.items):
            src, _, label = item.partition('|')
            path = grab(a.video, int(src), a.fps, tmp) if src.isdigit() else src
            im = Image.open(path).convert('RGB').resize((w, h), Image.LANCZOS)
            r, c = divmod(i, a.cols)
            x = pad + c * (w + gap)
            y = pad + head + r * (h + lab + gap)
            sheet.paste(im, (x, y))
            d.text((x, y + h + 6), label, font=f_lab, fill=PAPER)
    sheet.save(a.out, quality=88)
    print(a.out, sheet.size)


if __name__ == '__main__':
    main()
