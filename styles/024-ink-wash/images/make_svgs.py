"""从已通过的原片生成四张图解；保留可编辑文字，不改动视频。"""
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
MASTER = ROOT / 'drafts/ink-wash/opening/ink-full.mp4'
LICENSE = (HERE.parent / 'fonts/OFL-notosanssc.txt').read_text()
INK, PAPER, RED = '#141413', '#F2EDE1', '#C8372D'


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
{txt(60, 85, '水墨 / INK WASH', 18, 400, '#6b6b66')}
{txt(1020, 77, '观默', 26, 700, '#444444', 'end')}
{txt(1020, 106, '@guanmo_ai', 16, 400, '#777777', 'end')}
{txt(60, 182, title, 64, 700)}
{txt(60, 231, subtitle, 22, 400, '#6b6b66')}
<path d="M60 262H1020" stroke="#c8c1b4"/>
{content}
<path d="M60 1264H1020" stroke="#c8c1b4"/>
{txt(60, 1305, '024 · 18.75 秒 · 1920 × 1080 · 60 fps', 18, 400, '#6b6b66')}
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


def main():
    (HERE / 'preview').mkdir(exist_ok=True)
    (HERE.parent / 'video').mkdir(exist_ok=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-ss', '18.1', '-i', str(MASTER), '-frames:v', '1', '-q:v', '2', str(HERE.parent / 'video/cover.jpg'), '-y'], check=True)
    with tempfile.TemporaryDirectory() as temp:
        frames = []
        times = [1.5, 3.3, 5.5, 7.7, 10.6, 13.5]
        for i, time in enumerate(times):
            path = Path(temp) / f'{i}.jpg'
            subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(time), '-i', str(MASTER), '-frames:v', '1', '-q:v', '2', str(path), '-y'], check=True)
            frames.append(path)
        poster = picture(frames[3], 60, 330, 960, 540)
        poster += txt(60, 965, '一笔 · 一滴 · 留白', 48, 700)
        poster += txt(60, 1034, '从笔触、墨点与山水，走向界面里的反馈和转场。', 26)
        poster += txt(60, 1100, '浓淡组织层级，朱砂点出确认，让空白参与构图。', 26)
        rules = [
            ('墨分五色', '用浓淡组织层级，让一色墨产生不同的距离。'),
            ('起 · 行 · 收', '行笔、停顿与出锋，通过粗细变化留下节奏。'),
            ('让空白参与构图', '片中以大面积留白组织两岸，不把空处填满。'),
            ('朱砂只用一处', '把红色留给印章和最重要的确认反馈。'),
            ('飞白也是笔触', '用断续、干湿与笔锋变化保留书写感。'),
        ]
        cheatsheet = ''
        for i, (title, detail) in enumerate(rules):
            y = 355 + i * 174
            cheatsheet += txt(60, y, f'0{i + 1}', 22, 700, RED)
            cheatsheet += txt(140, y + 5, title, 39, 700)
            cheatsheet += txt(140, y + 58, detail, 23)
            cheatsheet += f'<path d="M140 {y + 95}H1020" stroke="#d7d0c3"/>'
        app = picture(frames[4], 60, 330, 960, 540)
        for i, (title, detail) in enumerate([
            ('按下 = 一滴墨', '以墨点晕开回应操作。'),
            ('转场 = 墨晕满', '让同一滴墨连接列表与详情。'),
            ('确认 = 盖章', '红色印章与轻微回弹共同落定。'),
        ]):
            y = 945 + i * 95
            app += txt(60, y, title, 30, 700)
            app += txt(450, y, detail, 24)
        board = ''
        labels = ['写“水”', '墨滴与蝌蚪', '淡墨成虾', '一河两岸', '茶馆界面', '规则演示']
        for i, frame in enumerate(frames):
            x, y = 60 + (i % 2) * 500, 300 + (i // 2) * 310
            board += picture(frame, x, y, 460, 258.75)
            board += txt(x, y + 286, f'{times[i]:04.1f} s · {labels[i]}', 20)
        sheets = {
            'poster': sheet('水墨', '一笔下去，墨与留白共同构成画面', poster),
            'cheatsheet': sheet('五条视觉规则', '从本片提炼的视觉做法；比例参数属于本片设计', cheatsheet),
            'app-ui': sheet('落到界面', '虚构茶馆 App「墨舍」的概念动效', app),
            'storyboard': sheet('原片分镜', '六张选帧均来自已通过的完整成片', board),
        }
        for name, svg in sheets.items():
            (HERE / f'{name}.svg').write_text(svg)
            (HERE / f'preview/{name}.svg').write_text(fonts(svg))
    print('水墨四张图解与封面已生成；原片未改动。')


if __name__ == '__main__':
    main()
