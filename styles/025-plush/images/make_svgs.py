"""从已审毛绒成片抽帧生成图解；文字与布局可编辑，不改动成片。"""
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
MASTER = ROOT / 'drafts/plush/film/plush-film.mp4'
LICENSE = (HERE.parent / 'fonts/OFL-notosanssc.txt').read_text()
INK, PAPER, RED = '#302438', '#faf1f5', '#aa3c70'


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
{txt(60, 85, '毛绒 / PLUSH', 18, 400, '#6b6b66')}
{txt(1020, 77, '观默', 26, 700, '#444444', 'end')}
{txt(1020, 106, '@guanmo_ai', 16, 400, '#777777', 'end')}
{txt(60, 182, title, 64, 700)}
{txt(60, 231, subtitle, 22, 400, '#6b6b66')}
<path d="M60 262H1020" stroke="#c8c1b4"/>
{content}
<path d="M60 1264H1020" stroke="#c8c1b4"/>
{txt(60, 1305, '20 秒 · 1920 × 1080 · 60 fps', 18, 400, '#6b6b66')}
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
    with tempfile.TemporaryDirectory() as temp:
        def frame(time):
            path = Path(temp) / f'{time}.jpg'
            if not path.exists():
                subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(time), '-i', str(MASTER), '-frames:v', '1', '-q:v', '2', str(path), '-y'], check=True)
            return path
        poster = picture(HERE.parent / 'video/cover.jpg', 60, 310, 960, 540)
        poster += txt(60, 950, '先让身体动，毛再晚半拍。', 46, 700)
        poster += txt(60, 1020, '根深尖浅、根粗尖细，一根毛长成一整个形状。', 26)
        poster += txt(60, 1080, '同一批 409,600 根毛，从毛球接力到界面。', 26)
        poster += txt(60, 1160, '弹簧 · 压扁 · 回弹 · 跟随', 24, 400, RED)
        rules = [
            ('根深尖浅', '深色扎在根部，浅色留在毛尖。', 9.25),
            ('乱一点', '长短、方向与成撮变化，避免齐步走。', 10.0),
            ('逆光镶边', '让轮廓的毛尖接住背后的光。', 10.75),
            ('慢半拍', '毛尖跟随主体的历史姿态，停下后仍有回弹。', 11.5),
            ('一按就倒', '按压拨开毛束，松手再回到原来的形状。', 12.25),
        ]
        cheatsheet = ''
        for i, (title, detail, time) in enumerate(rules):
            y = 310 + i * 178
            cheatsheet += picture(frame(time), 60, y, 240, 135)
            cheatsheet += txt(335, y + 35, f'0{i+1}  {title}', 34, 700)
            cheatsheet += txt(335, y + 85, detail, 23)
        app = picture(frame(14.1), 60, 310, 960, 540)
        for i, (title, detail) in enumerate([
            ('点赞', '按下压扁，松手弹回；毛再跟着晃一下。'),
            ('开关', '先让按钮滑过去，再让毛束慢半拍归位。'),
            ('加载', '三个毛球错开起跳，让节奏持续流动。'),
        ]):
            y = 945 + i * 100
            app += txt(60, y, title, 32, 700)
            app += txt(260, y, detail, 24)
        board = ''
        times = [1.5, 3.3, 4.8, 6.6, 8.2, 14.1]
        labels = ['毛绒片名', '一根毛，长成四十万根', '皮毛早餐', '九个零件，拼成泰迪熊', '毛毛渔夫帽', '点赞、开关与加载']
        for i, (time, label) in enumerate(zip(times, labels)):
            x, y = 60 + (i % 2) * 500, 300 + (i // 2) * 310
            board += picture(frame(time), x, y, 460, 258.75)
            board += txt(x, y + 286, f'{time:04.1f} s · {label}', 19)
        sheets = {
            'poster':sheet('毛绒', '把柔软的触感，变成可以看见的设计语言', poster),
            'cheatsheet':sheet('五条毛绒规则', '从本片提炼的材质与动作做法', cheatsheet),
            'app-ui':sheet('软乎乎的交互', '虚构 App「毛绒日记」的三种概念反馈', app),
            'storyboard':sheet('同一批毛的接力', '六张选帧均来自已审成片', board),
        }
        for name, svg in sheets.items():
            (HERE / f'{name}.svg').write_text(svg)
            (HERE / f'preview/{name}.svg').write_text(fonts(svg))
    print('毛绒四张图解已生成；原片未改动。')


if __name__ == '__main__':
    main()
