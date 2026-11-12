"""从已审新艺术运动成片抽帧生成图解；文字与布局可编辑，不改动成片。"""
import base64
import html
import io
from pathlib import Path
import subprocess
import tempfile

from fontTools import subset
from fontTools.ttLib import TTFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
MASTER = ROOT / 'drafts/art-nouveau/film/art-nouveau-film.mp4'
LICENSE = (HERE.parent / 'fonts/OFL-notosanssc.txt').read_text()
INK, PAPER, RED = '#2E2A1F', '#F3EBD8', '#6B3A4A'


def txt(x, y, value, size=28, weight=400, fill=INK, anchor='start'):
    return f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}">{html.escape(value)}</text>'


def picture(path, x, y, w, h):
    data = base64.b64encode(path.read_bytes()).decode()
    return f'<image x="{x}" y="{y}" width="{w}" height="{h}" href="data:image/jpeg;base64,{data}"/>'


def sheet(title, subtitle, content):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
<metadata>{html.escape(LICENSE)}</metadata><defs></defs>
<rect width="1080" height="1350" fill="{PAPER}"/>
<g font-family="Noto Sans SC, sans-serif">
{txt(60, 85, '新艺术运动 / ART NOUVEAU', 18, 400, '#6b6b66')}
{txt(1020, 77, '观默', 26, 700, '#444444', 'end')}
{txt(1020, 106, '@guanmo_ai', 16, 400, '#777777', 'end')}
{txt(60, 182, title, 64, 700)}
{txt(60, 231, subtitle, 22, 400, '#6b6b66')}
<path d="M60 262H1020" stroke="#c8c1b4"/>
{content}
<path d="M60 1264H1020" stroke="#c8c1b4"/>
{txt(60, 1305, '21 秒 · 1920 × 1080 · 60 fps', 18, 400, '#6b6b66')}
</g></svg>'''


def fonts(svg):
    chars = ''.join(sorted(set(html.unescape(''.join(__import__('re').findall(r'>([^<>]+)<', svg))))))
    rules = []
    for weight, name in [(400, 'Regular'), (700, 'Bold')]:
        font = TTFont(ROOT / f'public/fonts/NotoSansSC-{name}.otf')
        options = subset.Options()
        options.layout_features = ['*']
        options.name_IDs = ['*']
        sub = subset.Subsetter(options)
        sub.populate(text=chars)
        sub.subset(font)
        font.flavor = 'woff'
        out = io.BytesIO()
        font.save(out)
        data = base64.b64encode(out.getvalue()).decode()
        rules.append(f"@font-face{{font-family:'Noto Sans SC';font-weight:{weight};src:url(data:font/woff;base64,{data}) format('woff')}}")
    return svg.replace('<defs>', '<defs><style>' + ''.join(rules) + '</style>')


def chip(x, y, color, name, hexv):
    return (f'<rect x="{x}" y="{y}" width="130" height="130" rx="10" fill="{color}" stroke="{INK}" stroke-width="2"/>'
            + txt(x, y + 166, name, 22, 700) + txt(x, y + 196, hexv, 18, 400, '#6b6b66'))


def main():
    (HERE / 'preview').mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as temp:
        def frame(time):
            path = Path(temp) / f'{time}.jpg'
            if not path.exists():
                subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(time), '-i', str(MASTER), '-frames:v', '1', '-q:v', '2', str(path), '-y'], check=True)
            return path
        poster = picture(HERE.parent / 'video/cover.jpg', 60, 310, 960, 540)
        poster += txt(60, 950, '直线都换成会长的藤蔓。', 46, 700)
        poster += txt(60, 1020, '一根鞭线从根到梢越卷越紧，梢头像蕨菜一样一边长一边松开。', 26)
        poster += txt(60, 1080, '整支片子只有一根线：标题、光环、地铁口、台灯、手机都是它画的。', 26)
        poster += txt(60, 1160, '鞭线 · 光环 · 铸铁 · 彩色玻璃 · 1890—1910', 24, 400, RED)
        rules = [
            ('没有一根直线', '曲率从根到梢一路变大：κ(s) = a + b·s⁶。', 4.25),
            ('根粗梢细，约 10 : 1', '粗细跟着弧长走，梢头收成一个点。', 2.9),
            ('一个拐点，一个涡', '先往一边缓弯，再往另一边越卷越紧。', 4.9),
        ]
        cheatsheet = ''
        for i, (title, detail, time) in enumerate(rules):
            y = 300 + i * 178
            cheatsheet += picture(frame(time), 60, y, 240, 135)
            cheatsheet += txt(335, y + 35, f'0{i+1}  {title}', 34, 700)
            cheatsheet += txt(335, y + 85, detail, 23)
        cheatsheet += txt(60, 860, '用曲率梳检查：沿线竖起的金线越长，那里弯得越急；金线一路变长才是鞭线。', 22, 400, RED)
        cheatsheet += txt(60, 920, '色板', 32, 700)
        for i, (c, n) in enumerate([('#4E5A34', '橄榄'), ('#7F8F5E', '鼠尾草'), ('#C49A4A', '金'), ('#6B3A4A', '李紫'), ('#D9A39A', '玫瑰'), ('#EFE6CF', '奶油')]):
            cheatsheet += chip(60 + i * 160, 950, c, n, c)
        cheatsheet += txt(60, 1225, '字体：Noto Serif SC（中文标题）· Cormorant（年份与正文）· Cinzel Decorative（花饰大写）', 21, 400, '#6b6b66')
        app = picture(frame(17.5), 60, 310, 960, 540)
        for i, (title, detail) in enumerate([
            ('进度环', '一根藤沿着圆弧长到当前进度，梢头带一点金光。'),
            ('拱顶卡片', '卡片和缩略图用马蹄形的拱顶，不用直角。'),
            ('分隔线', '中间一个金点，两头各甩出一个涡卷。'),
        ]):
            y = 945 + i * 100
            app += txt(60, y, title, 32, 700)
            app += txt(260, y, detail, 24)
        board = ''
        times = [0.0, 4.3, 7.6, 10.2, 13.6, 20.9]
        labels = ['标题拱长出来', '鞭线与曲率梳', '穆夏 · 光环与花冠', '吉马德 · 地铁口亮灯', '蒂芙尼 · 台灯亮', '拉远：整支片子一根线']
        for i, (time, label) in enumerate(zip(times, labels)):
            x, y = 60 + (i % 2) * 500, 300 + (i // 2) * 310
            board += picture(frame(time), x, y, 460, 258.75)
            board += txt(x, y + 286, f'{time:04.1f} s · {label}', 19)
        sheets = {
            'poster': sheet('新艺术运动', '1890—1910：线是长出来的，不是画出来的', poster),
            'cheatsheet': sheet('三条规则与色板', '从本片提炼的鞭线做法', cheatsheet),
            'app-ui': sheet('一根线，用在界面上', '虚构 App「我的花园」的三种概念元素', app),
            'storyboard': sheet('一根线的接力', '六张选帧均来自已审成片', board),
        }
        for name, svg in sheets.items():
            (HERE / f'{name}.svg').write_text(svg)
            (HERE / f'preview/{name}.svg').write_text(fonts(svg))
    print('新艺术运动四张图解已生成；原片未改动。')


if __name__ == '__main__':
    main()
