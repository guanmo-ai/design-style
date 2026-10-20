"""
把某一期 images/ 目录下的 SVG 源文件构建成：
  1) preview/*.svg —— 内嵌字体子集（base64 WOFF）的自包含 SVG，GitHub 上可直接预览
  2) png/*.png     —— 2x 位图（2160×2700），用于发帖

用法：python3 scripts/build_images.py styles/001-bauhaus/images
依赖：fontTools（pip install fonttools）、Node + playwright、Chromium
字体：先运行 npm run fonts（下载到 public/fonts/）
"""
import base64
import html
import io
import os
import re
import subprocess
import sys

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(ROOT, 'public', 'fonts')

FACES = [  # (family, file, weight)
    ('Jost', 'Jost.ttf', '100 900'),
    ('JetBrains Mono', 'JetBrainsMono.ttf', '100 800'),
    ('Noto Sans SC', 'NotoSansSC-Medium.otf', '500'),
    ('Noto Sans SC', 'NotoSansSC-Bold.otf', '700'),
    ('Noto Sans SC', 'NotoSansSC-Black.otf', '900'),
]


def text_chars(svg: str) -> str:
    chunks = re.findall(r'>([^<>]+)<', svg)
    chars = set(''.join(html.unescape(c) for c in chunks))
    chars |= set('0123456789')
    return ''.join(sorted(c for c in chars if not c.isspace())) + ' '


def subset_b64(path: str, chars: str) -> str:
    opts = subset.Options()
    opts.flavor = 'woff'
    opts.layout_features = ['*']
    opts.name_IDs = ['*']
    opts.notdef_outline = True
    font = TTFont(path)
    sub = subset.Subsetter(opts)
    sub.populate(text=chars)
    sub.subset(font)
    buf = io.BytesIO()
    font.flavor = 'woff'
    font.save(buf)
    return base64.b64encode(buf.getvalue()).decode()


def embed(svg: str) -> str:
    chars = text_chars(svg)
    rules = []
    for family, file, weight in FACES:
        path = os.path.join(FONTS, file)
        if not os.path.exists(path):
            print(f'  ! 缺少字体 {file}，跳过')
            continue
        data = subset_b64(path, chars)
        rules.append(
            f"@font-face{{font-family:'{family}';font-weight:{weight};"
            f"src:url(data:font/woff;base64,{data}) format('woff');}}"
        )
    style = '<style>' + ''.join(rules) + '</style>'
    return svg.replace('<defs>', '<defs>\n    ' + style, 1)


def main(folder: str):
    folder = os.path.abspath(folder)
    prev = os.path.join(folder, 'preview')
    png = os.path.join(folder, 'png')
    os.makedirs(prev, exist_ok=True)
    os.makedirs(png, exist_ok=True)
    jobs = []
    for name in sorted(os.listdir(folder)):
        if not name.endswith('.svg'):
            continue
        src = open(os.path.join(folder, name), encoding='utf-8').read()
        out = os.path.join(prev, name)
        open(out, 'w', encoding='utf-8').write(embed(src))
        m = re.search(r'width="(\d+)" height="(\d+)"', src)
        jobs.append((out, os.path.join(png, name.replace('.svg', '.png')), int(m.group(1)), int(m.group(2))))
        print('preview', os.path.relpath(out, ROOT), f'{os.path.getsize(out) / 1024:.0f} KB')
    script = os.path.join(ROOT, 'scripts', 'svg_to_png.mjs')
    for svg, out, w, h in jobs:
        subprocess.run(['node', script, svg, out, str(w), str(h)], check=True, cwd=ROOT)
        print('png    ', os.path.relpath(out, ROOT))


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'styles/001-bauhaus/images')
