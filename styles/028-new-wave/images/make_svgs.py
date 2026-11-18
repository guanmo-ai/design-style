"""用新浪潮第二版的封面和选帧生成四张可编辑图解。"""
import base64
from html import escape
from io import BytesIO
from pathlib import Path
import re
import subprocess

from fontTools import subset
from fontTools.ttLib import TTFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
FILM = ROOT / 'drafts/new-wave/film/new-wave-film.mp4'
PAPER, INK, MAGENTA, CYAN, YELLOW = '#E6E2DA', '#141414', '#EC1C8C', '#12A8D8', '#FFD21F'

def text(x, y, value, size, weight=400, color=INK, anchor='start'):
    return (f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" '
            f'fill="{color}" text-anchor="{anchor}">{escape(value)}</text>')

def photo(data, x, y, width):
    base64_data = base64.b64encode(data).decode()
    return (f'<image x="{x}" y="{y}" width="{width}" height="{width * 9 / 16}" '
            f'href="data:image/jpeg;base64,{base64_data}"/>')

def frame(index, x, y, width):
    jpeg = subprocess.check_output([
        'ffmpeg', '-v', 'error', '-ss', f'{index / 60:.6f}', '-i', str(FILM),
        '-frames:v', '1', '-vf', f'scale={width}:-2', '-q:v', '2', '-f', 'mjpeg', '-',
    ])
    return photo(jpeg, x, y, width)

def sheet(kicker, title, content):
    grid = ''.join(f'<path d="M{x} 272V1280"/>' for x in range(60, 1021, 80))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
<rect width="1080" height="1350" fill="{PAPER}"/>
<g stroke="{INK}" opacity=".12">{grid}</g>
<rect x="60" y="60" width="56" height="10" fill="{MAGENTA}"/>
<g font-family="Noto Sans SC, sans-serif">
{text(60, 112, kicker, 20, 700)}
{text(60, 229, title, 76, 700)}
{text(1020, 85, '观默', 28, 700, anchor='end')}
{text(1020, 117, '@guanmo_ai', 19, anchor='end')}
{content}
</g>
<path d="M60 260H1020 M60 1290H1020" stroke="{INK}"/>
</svg>
'''

def write_svg(name, svg):
    (HERE / f'{name}.svg').write_text(svg)
    chars = ''.join(sorted(set(''.join(re.findall(r'<text[^>]*>([^<]*)</text>', svg)))))
    rules = []
    for weight, style in [(400, 'Regular'), (700, 'Bold')]:
        font = TTFont(ROOT / f'public/fonts/NotoSansSC-{style}.otf')
        cutter = subset.Subsetter()
        cutter.populate(text=chars)
        cutter.subset(font)
        font.flavor = 'woff'
        stream = BytesIO()
        font.save(stream)
        encoded = base64.b64encode(stream.getvalue()).decode()
        rules.append(f"@font-face{{font-family:'Noto Sans SC';font-weight:{weight};"
                     f"src:url(data:font/woff;base64,{encoded}) format('woff')}}")
    license_text = (HERE.parent / 'fonts/OFL-notosanssc.txt').read_text()
    embedded = f"<metadata>{escape(license_text)}</metadata><defs><style>{''.join(rules)}</style></defs>"
    (HERE / f'preview/{name}.svg').write_text(svg.replace('<rect', embedded + '\n<rect', 1))

def main():
    cover = (HERE.parent / 'video/cover.jpg').read_bytes()
    poster = photo(cover, 60, 310, 960)
    poster += text(60, 950, '让字离开基线，让色片彼此叠合。', 48, 700)
    poster += text(60, 1030, '偏移、错位、网点，都发生在同一套 12 栏网格上。', 28)
    poster += text(60, 1215, 'NEW WAVE TYPOGRAPHY / 20 S / 60 FPS', 24, 700)
    write_svg('poster', sheet('NEW WAVE TYPOGRAPHY / 01', '新浪潮字体设计', poster))

    rules = [
        (200, '乘法叠色', '品红、青与黄保持独立，在交叠处形成新颜色。'),
        (320, '四分之一字高', '字母逐级下降，把阅读方向变成看得见的斜线。'),
        (468, '极端字距', '从 −150 到 +700（千分之一 em），观察词形怎样变化。'),
        (600, '错开版面', '打散各个块，保留它们与 12 栏网格的对齐关系。'),
        (757, '旋转网点', '网点网格转 45°，用点的半径表现明暗。'),
    ]
    cheat = ''
    for i, (index, title, description) in enumerate(rules):
        y = 305 + i * 171
        cheat += frame(index, 60, y, 256)
        cheat += text(360, y + 52, title, 33, 700)
        cheat += text(360, y + 105, description, 24)
    for i, color in enumerate([MAGENTA, CYAN, YELLOW, PAPER, INK]):
        x = 60 + i * 192
        cheat += f'<rect x="{x}" y="1170" width="166" height="38" fill="{color}" stroke="{INK}"/>'
        cheat += text(x, 1244, color, 20)
    write_svg('cheatsheet', sheet('NEW WAVE TYPOGRAPHY / 02', '五条排版规则', cheat))

    ui = frame(909, 60, 310, 960)
    ui += frame(936, 60, 902, 512)
    ui += text(612, 954, '音乐播放器', 34, 700)
    ui += text(612, 1009, '用大字和网点组织专辑封面。', 24)
    ui += text(612, 1109, '网页首屏', 34, 700)
    ui += text(612, 1164, '把彩色块错开，仍对齐栏线。', 24)
    write_svg('app-ui', sheet('NEW WAVE TYPOGRAPHY / 03', '从印刷到屏幕', ui))

    board = ''
    scenes = [(0, '封面'), (200, '叠色'), (320, '台阶'), (468, '字距'),
              (600, '网格'), (757, '网点'), (909, '版式应用'), (1155, '套准收束')]
    for i, (index, title) in enumerate(scenes):
        x, y = 60 + i % 2 * 496, 304 + i // 2 * 245
        board += frame(index, x, y, 384)
        board += text(x, y + 239, f'{index / 60:05.2f} s  /  {title}', 22, 700)
    write_svg('storyboard', sheet('NEW WAVE TYPOGRAPHY / 04', '八场动效分镜', board))

if __name__ == '__main__':
    main()
