"""Build the four editable plates and their self-contained, font-subset previews."""

from base64 import b64encode
from html import escape
from math import cos, pi, sin, sqrt, tanh
from pathlib import Path
from subprocess import check_output
from tempfile import TemporaryDirectory
import sys

from fontTools import subset

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
FILM = ROOT / "drafts/honeycomb/film/honeycomb-film.mp4"
FONT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "public/fonts/NotoSansSC-Medium.otf"
INK, PAPER, BLUE, AMBER = "#101016", "#F2EFE8", "#0D254B", "#F2AF43"
WHITE, MUTED = "#F8F4EB", "#5C544B"
WIDTH, HEIGHT = 1080, 1350


def label(x, y, content, size, fill=INK, anchor="start"):
    return (
        f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" '
        f'text-anchor="{anchor}">{escape(content)}</text>'
    )


def hexagon(x, y, radius, fill, stroke):
    points = " ".join(
        f"{x + radius * cos(k * pi / 3 - pi / 2):.1f},"
        f"{y + radius * sin(k * pi / 3 - pi / 2):.1f}" for k in range(6)
    )
    return f'<polygon points="{points}" fill="{fill}" stroke="{stroke}" stroke-width="2"/>'


def still(frame, x, y, width):
    picture = check_output([
        "ffmpeg", "-v", "error", "-i", str(FILM), "-vf",
        f"select=eq(n\\,{frame}),scale={width}:-2", "-frames:v", "1",
        "-c:v", "mjpeg", "-q:v", "3", "-f", "image2pipe", "pipe:1",
    ])
    return (
        f'<image x="{x}" y="{y}" width="{width}" height="{round(width * 9 / 16)}" '
        f'href="data:image/jpeg;base64,{b64encode(picture).decode()}"/>'
    )


def poster():
    parts = [
        label(76, 144, "蜂窝布局", 88, WHITE),
        label(80, 220, "Honeycomb", 46, AMBER),
    ]
    for row in range(-3, 4):
        for col in range(-3, 4):
            if max(abs(col), abs(row), abs(col + row)) > 3:
                continue
            ring = max(abs(col), abs(row), abs(col + row))
            x, y = 540 + 125 * (col + row / 2), 680 + 125 * sqrt(3) / 2 * row
            fill = {0: AMBER, 1: "#674420"}.get(ring, "#191820")
            stroke = AMBER if ring <= 1 else "#38333B"
            parts.append(hexagon(x, y, 105 / sqrt(3), fill, stroke))
    parts.extend([
        label(80, 1190, "中心一格，六个最近邻", 52, WHITE),
        label(80, 1252, "相邻行错开半格，中心与六邻等距", 31, "#C8B9A8"),
    ])
    return parts


def geometry():
    parts = [
        label(76, 134, "错列网格与鱼眼", 70),
        label(78, 201, "相邻两行错开半个中心距", 33, MUTED),
    ]
    for row in range(3):
        for col in range(5):
            parts.append(hexagon(171 + col * 156 + row % 2 * 78, 348 + row * 156 * sqrt(3) / 2,
                                 75, BLUE if (row, col) == (1, 2) else "#E0E6F1", BLUE))
    parts.extend([
        '<path d="M171 348H327M249 483.1L171 348" fill="none" stroke="#8C480D" stroke-width="4" stroke-dasharray="8 8"/>',
        label(78, 751, "中心距 150 px  /  图标 132 px  /  缝 18 px", 33),
        label(78, 856, "中心保持原大，外圈逐渐缩小", 42),
        '<path d="M120 912V1160H984" fill="none" stroke="#908171" stroke-width="2"/>',
        label(136, 955, "1:1", 28, MUTED),
        label(970, 1212, "离中心的距离", 28, MUTED, "end"),
    ])
    curve = []
    for i in range(81):
        radius = i / 80
        scale = 1 - tanh(max(0, radius - 0.32) / 0.58) ** 2
        curve.append(f"{140 + radius * 812:.1f},{1158 - 180 * scale:.1f}")
    parts.append(f'<polyline points="{" ".join(curve)}" fill="none" stroke="#8C480D" stroke-width="6"/>')
    return parts


def interfaces():
    return [
        label(76, 132, "同一网格，两块屏幕", 63),
        still(703, 76, 197, 928),
        label(76, 772, "表盘 · 让焦点停在中心", 34, MUTED),
        still(830, 148, 816, 784),
        label(76, 1305, "手机 · 给选中的格子加上勾选标记", 32, MUTED),
    ]


def storyboard():
    parts = [
        label(76, 132, "从蜂巢到数据地图", 67, WHITE),
        label(79, 196, "蜂窝 v4 · 18 秒短片选帧", 35, AMBER),
    ]
    frames = [
        (236, 76, 239, "03.93 秒 · 蜂蜡"),
        (339, 552, 239, "05.65 秒 · 蓝图"),
        (451, 76, 653, "07.52 秒 · 三色对称"),
        (886, 552, 653, "14.77 秒 · 六边形分箱"),
    ]
    for frame, x, y, caption in frames:
        parts.extend([still(frame, x, y, 452), label(x, y + 308, caption, 30, WHITE)])
    parts.append(label(78, 1210, "沿用同一套格心坐标，让内容和媒介接力", 35, "#C8B9A8"))
    return parts


def svg(title, background, parts, font_url):
    content = "\n  ".join(parts)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" '
        f'viewBox="0 0 {WIDTH} {HEIGHT}" role="img" aria-labelledby="title">\n'
        f'  <title id="title">{escape(title)}</title>\n'
        f'  <style>@font-face{{font-family:Plate;src:url("{font_url}")}}'
        'text{font-family:Plate,"Noto Sans SC",sans-serif}</style>\n'
        f'  <rect width="{WIDTH}" height="{HEIGHT}" fill="{background}"/>\n'
        f'  {content}\n</svg>\n'
    )


def main():
    plates = [
        ("poster", "蜂窝布局海报", INK, poster()),
        ("geometry", "蜂窝网格与鱼眼速查", PAPER, geometry()),
        ("interfaces", "表盘与手机中的蜂窝", PAPER, interfaces()),
        ("storyboard", "蜂窝 v4 分镜选帧", INK, storyboard()),
    ]
    captions = "".join(part for _, title, _, parts in plates
                       for part in [title, *(part for part in parts if part.startswith("<text"))])
    with TemporaryDirectory() as directory:
        font = Path(directory) / "plate.woff2"
        subset.main([str(FONT), f"--text={captions}", "--flavor=woff2", f"--output-file={font}"])
        embedded_font = "data:font/woff2;base64," + b64encode(font.read_bytes()).decode()
    preview = HERE / "preview"
    preview.mkdir(exist_ok=True)
    relative_font = "../../../public/fonts/NotoSansSC-Medium.otf"
    for name, title, background, parts in plates:
        (HERE / f"{name}.svg").write_text(svg(title, background, parts, relative_font), encoding="utf-8")
        (preview / f"{name}.svg").write_text(svg(title, background, parts, embedded_font), encoding="utf-8")


if __name__ == "__main__":
    main()
