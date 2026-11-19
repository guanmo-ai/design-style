"""用达达第二版成片和候选图生成四张 SVG 图解。"""

import base64
from html import escape
from io import BytesIO
from pathlib import Path
import re
import subprocess

from fontTools import subset
from fontTools.ttLib import TTFont
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
DRAFT = ROOT / 'drafts/dada'
FILM = DRAFT / 'film/dada-film.mp4'
PAPER, NEWS, INK, RED = '#E7DDC8', '#F3ECDD', '#16130F', '#D3261C'
OCHRE, BLUE = '#D9A72B', '#2F4E8C'


def text(x, y, value, size, weight=400, color=INK, anchor='start'):
    return (f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" '
            f'fill="{color}" text-anchor="{anchor}">{escape(value)}</text>')


def photo(jpeg, x, y, width):
    data = base64.b64encode(jpeg).decode()
    return (f'<image x="{x}" y="{y}" width="{width}" height="{width * 9 / 16}" '
            f'href="data:image/jpeg;base64,{data}"/>')


def still(path, x, y, width):
    with Image.open(path) as source, BytesIO() as stream:
        source.convert('RGB').resize((width, width * 9 // 16), Image.Resampling.LANCZOS).save(stream, format='JPEG', quality=91)
        return photo(stream.getvalue(), x, y, width)


def frame(index, x, y, width):
    jpeg = subprocess.check_output([
        'ffmpeg', '-v', 'error', '-ss', f'{index / 60:.6f}', '-i', str(FILM),
        '-frames:v', '1', '-vf', f'scale={width}:-2', '-q:v', '2', '-f', 'mjpeg', '-',
    ])
    if not jpeg:
        raise ValueError(f'成片缺少第 {index} 帧')
    return photo(jpeg, x, y, width)


def sheet(section, title, content, accent=RED):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
<rect width="1080" height="1350" fill="{PAPER}"/>
<path d="M0 0H1080V254L1020 250L942 261L841 252L758 264L655 251L583 259L465 250L338 262L242 250L114 260L0 251Z" fill="{NEWS}"/>
<path d="M64 75h45v10H64z" fill="{accent}"/>
<path d="M64 1210H1016" stroke="{INK}" stroke-width="2"/>
<g font-family="Noto Sans SC, sans-serif">
{text(122, 89, section, 25, 700, accent)}
{text(64, 203, title, 69, 700)}
{text(1016, 82, '观默', 25, 700, anchor='end')}
{text(1016, 113, '@guanmo_ai', 20, anchor='end')}
{content}
{text(64, 1270, '达达  /  DADA', 21, 700)}
{text(1016, 1270, 'DESIGN STYLE', 21, 700, anchor='end')}
</g>
</svg>
'''


def write_svg(name, svg):
    (HERE / f'{name}.svg').write_text(svg, encoding='utf-8')
    chars = ''.join(sorted(set(''.join(re.findall(r'<text[^>]*>([^<]*)</text>', svg)))))
    rules = []
    for weight, style in [(400, 'Regular'), (700, 'Bold')]:
        with TTFont(ROOT / f'public/fonts/NotoSansSC-{style}.otf') as font, BytesIO() as stream:
            cutter = subset.Subsetter()
            cutter.populate(text=chars)
            cutter.subset(font)
            font.flavor = 'woff'
            font.save(stream)
            data = base64.b64encode(stream.getvalue()).decode()
            rules.append(f"@font-face{{font-family:'Noto Sans SC';font-weight:{weight};src:url(data:font/woff;base64,{data}) format('woff')}}")
    license_text = (HERE.parent / 'fonts/OFL-notosanssc.txt').read_text(encoding='utf-8')
    embedded = f"<metadata>{escape(license_text)}</metadata><defs><style>{''.join(rules)}</style></defs>"
    (HERE / f'preview/{name}.svg').write_text(svg.replace('<rect', embedded + '\n<rect', 1), encoding='utf-8')


def main():
    poster = still(HERE.parent / 'video/cover.jpg', 64, 308, 952)
    poster += text(64, 970, '一个字，一种字体，一块纸。', 46, 700)
    poster += text(64, 1042, '同一批纸片，从片头接力到手机界面。', 29)
    poster += text(64, 1132, '17.87 S  /  60 FPS  /  PAPER COLLAGE', 22, 700, RED)
    write_svg('poster', sheet('纸片拼贴', '达达', poster))

    rules = [(775, '每个字换一种字体', '把字形的反差留给标题，正文统一字体。'),
             (835, '每张纸歪 3–9°', '让卡片各自倾斜，保留共同的对齐线。'),
             (876, '纸片越高，影子越远', '抬高 130px 时，片中影子的偏移约 86px。')]
    cheat = ''
    for i, (index, title, description) in enumerate(rules):
        y = 300 + 236 * i
        cheat += frame(index, 64, y, 336)
        cheat += text(438, y + 66, title, 42, 700)
        cheat += text(438, y + 125, description, 24)
        cheat += f'<path d="M64 {y + 208}H1016" stroke="{INK}" stroke-opacity=".23"/>'
    for i, color in enumerate([RED, OCHRE, INK, BLUE, PAPER]):
        x = 64 + i * 192
        cheat += f'<rect x="{x}" y="1033" width="166" height="54" fill="{color}" stroke="{INK}"/>'
        cheat += text(x, 1132, color, 23, 700)
    write_svg('cheatsheet', sheet('规则速查', '字体、角度和影子', cheat))

    ui = still(DRAFT / 'png/ui.png', 64, 308, 952)
    ui += text(64, 952, '网页用剪报做节目主视觉。', 36, 700)
    ui += text(64, 1033, '手机票夹沿用纸片形状，时间和地点按行对齐。', 28)
    write_svg('app-ui', sheet('界面应用', '从剪报到票夹', ui, BLUE))

    board = ''
    scenes = [(0, '标题'), (237, '剪｜照片蒙太奇'), (360, '偶然｜随机落点'),
              (611, '词｜抽签成诗'), (832, '今天｜拼贴进手机'), (1050, '收束｜回到封面')]
    for i, (index, title) in enumerate(scenes):
        x, y = 64 + i % 2 * 488, 300 + i // 2 * 294
        board += frame(index, x, y, 464)
        board += text(x, y + 272, f'{index / 60:05.2f}s  /  {title}', 23, 700)
    write_svg('storyboard', sheet('分镜选帧', '同一批纸片接力', board))


if __name__ == '__main__':
    main()
