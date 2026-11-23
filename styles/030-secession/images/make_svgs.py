"""从风格图源码和发布视频生成画廊图解。"""
from base64 import b64encode
from html import escape, unescape
from io import BytesIO
from pathlib import Path
import random
import re
import subprocess
import sys

from fontTools import subset
from fontTools.ttLib import TTFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
DRAFT = ROOT / 'drafts/secession'
sys.path.insert(0, str(DRAFT))

from secession import BONE, GOLD, INK, PAPER, BOLE, checker_band, gilded, motif, word, gold_defs

WIDTH, HEIGHT = 1920, 1080
FONTS = {
    'Jost': ('Jost.ttf', 'jost', '100 900'),
    'Song': ('NotoSerifSC.ttf', 'notoserifsc', '200 900'),
    'Qk': ('ZCOOLQingKeHuangYou.ttf', 'zcoolqingkehuangyou', '400'),
}


def svg(body):
    return f'<svg width="{WIDTH}" height="{HEIGHT}" viewBox="0 0 {WIDTH} {HEIGHT}">{body}</svg>'


def text(x, y, value, size, fill=PAPER, font='Song'):
    return (f'<text x="{x}" y="{y}" font-size="{size}" font-weight="600" '
            f'font-family="{font}" fill="{fill}">{escape(value)}</text>')


def write_image(name, source):
    source = source.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ', 1)
    (HERE / f'{name}.svg').write_text(source + '\n', encoding='utf-8')
    rules, licenses = [], []
    for alias, (filename, license_name, weight) in FONTS.items():
        labels = re.findall(r'<text\b[^>]*font-family="' + alias + r'"[^>]*>([^<]+)</text>', source)
        if not labels:
            continue
        with TTFont(ROOT / 'public/fonts' / filename, recalcTimestamp=False) as font, BytesIO() as buffer:
            glyphs = subset.Subsetter()
            glyphs.populate(text=unescape(''.join(labels)))
            glyphs.subset(font)
            font.flavor = 'woff'
            font.save(buffer)
            data = b64encode(buffer.getvalue()).decode()
        rules.append(f"@font-face{{font-family:{alias};font-weight:{weight};src:url(data:font/woff;base64,{data}) format('woff')}}")
        licenses.append((HERE.parent / 'fonts' / f'OFL-{license_name}.txt').read_text(encoding='utf-8'))
    embedded = f'<metadata>{escape(chr(10).join(licenses))}</metadata><style>{"".join(rules)}</style>'
    head, body = source.split('>', 1)
    (HERE / 'preview' / f'{name}.svg').write_text(f'{head}>{embedded}{body}\n', encoding='utf-8')


def quick_reference():
    body = [f'<rect width="{WIDTH}" height="{HEIGHT}" fill="{INK}"/>',
            f'<defs>{gold_defs()}</defs>',
            text(104, 88, 'VIENNA SECESSION   /   1897', 28, GOLD, 'Jost'),
            text(104, 185, '从一个正方形开始', 72),
            checker_band(104, 233, 1712, 12)]
    for index, heading in enumerate(('八列方格', '方格四分', '方形金箔', '高腰线条字')):
        x = 104 + (index % 2) * 880
        y = 304 + (index // 2) * 322
        body.extend([f'<rect x="{x}" y="{y}" width="832" height="284" fill="#211E1A"/>',
                     text(x + 32, y + 70, heading, 38)])
        if index == 0:
            body.append(text(x + 32, y + 123, '图片用方形，内容跨整数列', 25, BONE))
            for column in range(8):
                body.append(f'<rect x="{x + 32 + column * 62}" y="{y + 165}" width="54" height="82" fill="{PAPER}" opacity=".75"/>')
        elif index == 1:
            body.append(text(x + 32, y + 123, '重复外框，替换格内的纹样', 25, BONE))
            for column, kind in enumerate(('frame', 'ring', 'check2', 'gold')):
                fill, background = (INK, PAPER) if kind == 'check2' else (PAPER, INK)
                body.append(motif(kind, x + 44 + column * 130, y + 146, 100, fill=fill, bg=background))
        elif index == 2:
            body.append(text(x + 32, y + 123, '金色集中在一处，缝隙露出底漆', 25, BONE))
            body.append(gilded(f'<rect x="{x + 32}" y="{y + 154}" width="360" height="96"/>',
                               x + 32, y + 154, 360, 96, 12, random.Random(7), 'samples', seam=2))
        else:
            body.append(text(x + 32, y + 123, '横画抬到字高的 2.4／7', 25, BONE))
            body.append(word('SECESSION', x + 35, y + 155, 13, fill=PAPER, dot=GOLD))
    for index, color in enumerate((INK, PAPER, GOLD, BOLE)):
        x = 104 + index * 440
        body.append(f'<rect x="{x}" y="974" width="54" height="54" fill="{color}" stroke="{BONE}"/>')
        body.append(text(x + 75, 1010, color, 31, PAPER, 'Jost'))
    return svg(''.join(body))


def storyboard(master):
    shots = [
        (120, '摇臂下降', 'Crane down'), (260, '树冠绕拍', 'Orbit'),
        (495, '方格铺开', 'Grid'), (655, '字母生长', 'Lettering'),
        (850, '门票移焦', 'Rack focus'), (1090, '合回方板', 'Final panel'),
    ]
    body = [f'<rect width="{WIDTH}" height="{HEIGHT}" fill="{INK}"/>',
            text(100, 76, '维也纳分离派 · 成片选帧', 43),
            text(1450, 76, '19.50 s   /   60 fps', 29, GOLD, 'Jost')]
    for i, (frame, zh, en) in enumerate(shots):
        jpg = subprocess.check_output([
            'ffmpeg', '-v', 'error', '-ss', f'{frame / 60:.6f}', '-i', str(master),
            '-an', '-frames:v', '1', '-vf', 'scale=560:315',
            '-c:v', 'mjpeg', '-q:v', '3', '-f', 'image2pipe', '-',
        ])
        if not jpg:
            raise RuntimeError(f'成片缺少第 {frame} 帧')
        x = 100 + (i % 3) * 580
        y = 128 + (i // 3) * 427
        encoded = b64encode(jpg).decode()
        body.extend([f'<image x="{x}" y="{y}" width="560" height="315" href="data:image/jpeg;base64,{encoded}"/>',
                     text(x, y + 359, zh, 31),
                     text(x + 185, y + 359, en, 29, BONE, 'Jost'),
                     text(x + 485, y + 359, f'{frame / 60:.2f}', 25, GOLD, 'Jost')])
    return svg(''.join(body))


if __name__ == '__main__':
    master = Path(sys.argv[1]).resolve(strict=True)
    for script, name in (('cover', 'poster'), ('ui', 'app-ui')):
        subprocess.run([sys.executable, f'{script}.py'], cwd=DRAFT, check=True)
        html = (DRAFT / f'{script}.html').read_text(encoding='utf-8')
        write_image(name, re.search(r'<svg\b.*?</svg>', html, re.DOTALL)[0])
    write_image('cheatsheet', quick_reference())
    write_image('storyboard', storyboard(master))
