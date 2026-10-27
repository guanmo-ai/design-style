"""
把某一期 images/ 目录下的 SVG 源文件构建成：
  1) preview/*.svg —— 内嵌字体子集（base64 WOFF）的自包含 SVG，GitHub 上可直接预览
  2) png/*.png     —— 2x 位图（2160×2700），用于发帖

用法：python3 scripts/build_images.py styles/001-bauhaus/images（布局：layouts/01-bento-grid/images）
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

FACES = [  # (family, file, weight[, style])
    ('Instrument Serif', 'InstrumentSerif-Regular.ttf', '400'),
    ('Instrument Serif', 'InstrumentSerif-Italic.ttf', '400', 'italic'),
    ('Jost', 'Jost.ttf', '100 900'),
    ('JetBrains Mono', 'JetBrainsMono.ttf', '100 800'),
    ('Inter Display', 'InterDisplay-Medium.ttf', '500'),
    ('Inter Display', 'InterDisplay-SemiBold.ttf', '600'),
    ('Inter Display', 'InterDisplay-Bold.ttf', '700'),
    ('Inter', 'Inter-Regular.ttf', '400'),
    ('Inter', 'Inter-Medium.ttf', '500'),
    ('Geist Mono', 'GeistMono-Regular.ttf', '400'),
    ('Geist Mono', 'GeistMono-Medium.ttf', '500'),
    ('Selawik', 'Selawik-Light.ttf', '300'),
    ('Selawik', 'Selawik.ttf', '400'),
    ('TeX Gyre Heros', 'TeXGyreHeros-Regular.otf', '400'),
    ('TeX Gyre Heros', 'TeXGyreHeros-Bold.otf', '700'),
    ('Noto Sans SC', 'NotoSansSC-Regular.otf', '400'),
    ('Noto Sans SC', 'NotoSansSC-Medium.otf', '500'),
    ('Noto Sans SC', 'NotoSansSC-Bold.otf', '700'),
    ('Noto Sans SC', 'NotoSansSC-Black.otf', '900'),
    ('Oswald', 'Oswald.ttf', '200 700'),
    ('Fredoka', 'Fredoka.ttf', '300 700'),
    ('Bangers', 'Bangers-Regular.ttf', '400'),
    ('Unbounded', 'Unbounded.ttf', '200 900'),
    ('Michroma', 'Michroma-Regular.ttf', '400'),
    ('Silkscreen', 'Silkscreen-Regular.ttf', '400'),
    ('Archivo', 'Archivo.ttf', '100 900'),
    ('Space Mono', 'SpaceMono-Regular.ttf', '400'),
    ('Space Mono', 'SpaceMono-Bold.ttf', '700'),
    ('Poiret One', 'PoiretOne-Regular.ttf', '400'),
    ('Limelight', 'Limelight-Regular.ttf', '400'),
    ('Bodoni Moda', 'BodoniModa.ttf', '400 900'),
    ('Noto Serif SC', 'NotoSerifSC.ttf', '200 900'),
    ('Monoton', 'Monoton-Regular.ttf', '400'),
    ('Space Grotesk', 'SpaceGrotesk.ttf', '300 700'),
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
    for family, file, weight, *rest in FACES:
        style = rest[0] if rest else 'normal'
        if family not in svg:  # 只嵌入这张图实际用到的字体
            continue
        path = os.path.join(FONTS, file)
        if not os.path.exists(path):
            print(f'  ! 缺少字体 {file}，跳过')
            continue
        data = subset_b64(path, chars)
        rules.append(
            f"@font-face{{font-family:'{family}';font-weight:{weight};font-style:{style};"
            f"src:url(data:font/woff;base64,{data}) format('woff');}}"
        )
    style = '<style>' + ''.join(rules) + '</style>'
    return svg.replace('<defs>', '<defs>\n    ' + style, 1)


def inline_images(svg: str, folder: str) -> str:
    """把 <image href="相对路径"> 换成 data URI，让 preview 也是自包含的
    照片（.jpg）：缩到最长边 900px 的 JPEG；带透明的图层（.png / .webp，如 006 的铬层）：保留透明，最长边 2700px 的 WebP"""
    def rep(m):
        rel = html.unescape(m.group(1))
        path = os.path.normpath(os.path.join(folder, rel))
        if not os.path.exists(path):
            print(f'  ! 缺少图片 {path}，跳过')
            return m.group(0)
        alpha = rel.lower().endswith(('.png', '.webp'))
        mime = 'image/webp' if alpha else 'image/jpeg'
        try:
            from PIL import Image
            im = Image.open(path)
            buf = io.BytesIO()
            if alpha:
                im = im.convert('RGBA')
                im.thumbnail((2700, 2700))
                im.save(buf, 'WEBP', quality=90, method=6)
            else:
                im = im.convert('RGB')
                im.thumbnail((900, 900))
                im.save(buf, 'JPEG', quality=84, optimize=True)
            data = buf.getvalue()
        except ImportError:
            data = open(path, 'rb').read()
        return f'href="data:{mime};base64,{base64.b64encode(data).decode()}"'
    return re.sub(r'href="(?!data:|#|https?:)([^"]+\.(?:jpe?g|png|webp))"', rep, svg)


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
        open(out, 'w', encoding='utf-8').write(embed(inline_images(src, folder)))
        m = re.search(r'width="(\d+)" height="(\d+)"', src)
        jobs.append((out, os.path.join(png, name.replace('.svg', '.png')), int(m.group(1)), int(m.group(2))))
        print('preview', os.path.relpath(out, ROOT), f'{os.path.getsize(out) / 1024:.0f} KB')
    script = os.path.join(ROOT, 'scripts', 'svg_to_png.mjs')
    for svg, out, w, h in jobs:
        subprocess.run(['node', script, svg, out, str(w), str(h)], check=True, cwd=ROOT)
        print('png    ', os.path.relpath(out, ROOT))


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'styles/001-bauhaus/images')
