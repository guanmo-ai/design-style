"""从已审马克笔手绘成片抽帧生成图解；文字与布局可编辑，不改动成片。"""
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
MASTER = ROOT / 'drafts/marker/film/marker-film.mp4'
LICENSE = (HERE.parent / 'fonts/OFL-notosanssc.txt').read_text()
INK, PAPER, RED = '#22252B', '#FAF3E7', '#E4562C'


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
{txt(60, 85, '马克笔手绘 / MARKER', 18, 400, '#6b6b66')}
{txt(1020, 77, '观默', 26, 700, '#444444', 'end')}
{txt(1020, 106, '@guanmo_ai', 16, 400, '#777777', 'end')}
{txt(60, 182, title, 64, 700)}
{txt(60, 231, subtitle, 22, 400, '#6b6b66')}
<path d="M60 262H1020" stroke="#c8c1b4"/>
{content}
<path d="M60 1264H1020" stroke="#c8c1b4"/>
{txt(60, 1305, '19.3 秒 · 1920 × 1080 · 60 fps', 18, 400, '#6b6b66')}
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
        poster += txt(60, 940, '一笔一层，画完让它动起来。', 44, 700)
        poster += txt(60, 1010, '扁头的宽窄、叠笔的深浅、纸上的留白，组成手绘的视觉语言。', 25)
        poster += txt(60, 1070, '汽车、球鞋、建筑、官网、App、海报，六个场景用巨笔接力。', 25)
        poster += txt(60, 1170, '产品草图 / 插画 / 品牌页面 / 界面概念', 26, 400, RED)

        cheatsheet = ''
        rules = [
            ('一笔一层', '相邻笔画叠到一起，颜色加深一档。', 7.8),
            ('白是留出来的', '先留纸白，再上颜色；让亮部透气。', 2.5),
            ('停得越久，墨越深', '把停留变成局部积墨，避免均匀涂满。', 5.3),
            ('最后一笔才是白', '用少量不透明白色补高光，收住轮廓。', 17.4),
        ]
        for i, (title, detail, time) in enumerate(rules):
            y = 300 + i * 175
            cheatsheet += picture(frame(time), 60, y, 240, 135)
            cheatsheet += txt(330, y + 36, f'0{i+1}  {title}', 33, 700)
            cheatsheet += txt(330, y + 88, detail, 24)
        cheatsheet += txt(60, 1065, '本片色板', 30, 700)
        for i, color in enumerate(['#2148A8', '#E4562C', '#D8CBAE', '#6E52D8', '#F2B01E', '#FAF3E7']):
            x = 60 + i * 160
            cheatsheet += f'<rect x="{x}" y="1100" width="130" height="65" fill="{color}"/>'
            cheatsheet += txt(x, 1195, color, 19)

        app = picture(frame(10.7), 60, 300, 960, 540)
        app += picture(frame(13.7), 60, 890, 500, 281.25)
        app += txt(600, 915, '把笔触带进产品', 30, 700)
        for i, line in enumerate(['按钮：一笔刷出的色块', '换色：换一支笔重画', '卡片：手稿变成可选产品', '进度：一笔从左画到右']):
            app += txt(600, 980 + 58 * i, line, 24)

        board = ''
        for i, (time, label) in enumerate([(2.5, '汽车 · 设计草图'), (5.3, '球鞋 · 积墨笔触'), (7.8, '建筑 · 透视叠色'), (10.7, '官网 · 手绘首页'), (13.7, 'App · 换色重画'), (17.4, '海报 · 大字与规则')]):
            x, y = 60 + (i % 2) * 500, 300 + (i // 2) * 310
            board += picture(frame(time), x, y, 460, 258.75)
            board += txt(x, y + 286, f'{time:04.1f} s · {label}', 20)

        sheets = {
            'poster': sheet('马克笔手绘', 'MARKER：扁头笔触、叠色与留白', poster),
            'cheatsheet': sheet('四条视觉规则', '从本片提炼的手绘做法，数值与色板可按项目调整', cheatsheet),
            'app-ui': sheet('从纸上到界面里', '已审 v4 的官网与手机配置器概念', app),
            'storyboard': sheet('六个场景的接力', '选帧全部来自已审 v4 原片', board),
        }
        for name, svg in sheets.items():
            (HERE / f'{name}.svg').write_text(svg)
            (HERE / f'preview/{name}.svg').write_text(fonts(svg))
    print('马克笔手绘四张图解已生成；已审 v4 原片未改动。')


if __name__ == '__main__':
    main()
