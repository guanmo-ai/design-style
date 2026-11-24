"""从发布成片提取海报、技术图解和分镜。"""

from base64 import b64encode
from html import escape
from pathlib import Path
import subprocess
import sys


HERE = Path(__file__).resolve().parent
INK = "#121012"
PAPER = "#F1EEE4"
YELLOW = "#FFE21A"
PINK = "#FF3E9A"


def frame(master, index, x, y, width, height):
    data = subprocess.check_output([
        "ffmpeg", "-v", "error", "-ss", f"{index / 60:.9f}", "-i", str(master),
        "-an", "-frames:v", "1", "-vf", f"scale={width}:{height}",
        "-c:v", "mjpeg", "-q:v", "2", "-f", "image2pipe", "-",
    ])
    if not data:
        raise ValueError(f"成片缺少第 {index} 帧")
    encoded = b64encode(data).decode("ascii")
    return (f'<image x="{x}" y="{y}" width="{width}" height="{height}" '
            f'href="data:image/jpeg;base64,{encoded}"/>')


def label(x, y, value, size, color=PAPER):
    return (f'<text x="{x}" y="{y}" fill="{color}" font-family="monospace" '
            f'font-size="{size}" font-weight="700">{escape(value)}</text>')


def write_image(name, title, body):
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" '
           f'viewBox="0 0 1920 1080"><title>{escape(title)}</title>\n'
           f'<rect width="1920" height="1080" fill="{INK}"/>\n'
           + "\n".join(body) + "\n</svg>\n")
    for directory in (HERE, HERE / "preview"):
        directory.mkdir(exist_ok=True)
        (directory / f"{name}.svg").write_text(svg, encoding="utf-8")


def frame_grid(master, name, title, shots, columns, colors=()):
    body = [label(64, 94, title, 53, YELLOW)]
    width = 576 if columns == 3 else 640
    height = width * 9 // 16
    gap = 32
    left = (1920 - (width * columns + gap * (columns - 1))) // 2
    for i, (index, caption) in enumerate(shots):
        x = left + i % columns * (width + gap)
        y = 143 + i // columns * (height + 56)
        body.append(frame(master, index, x, y, width, height))
        body.append(label(x, y + height + 34, caption, 22))
    for i, (name_text, color) in enumerate(colors):
        x = left + i * 290
        body.append(f'<rect x="{x}" y="1010" width="30" height="30" fill="{color}" stroke="{PAPER}"/>')
        body.append(label(x + 43, 1034, f"{name_text} {color}", 21))
    write_image(name, title, body)


def main(master):
    write_image("poster", "Punk Xerox cover", [frame(master, 0, 0, 0, 1920, 1080)])
    write_image("gig-poster", "Basement gig poster", [frame(master, 654, 0, 0, 1920, 1080)])
    frame_grid(master, "cheatsheet", "PUNK XEROX / COPY SETTINGS", (
        (122, "01 / THRESHOLD"), (253, "02 / HALFTONE"),
        (550, "03 / COPY GENERATIONS"), (755, "04 / PAPER STOCK"),
    ), 2, (("PINK", PINK), ("YELLOW", YELLOW), ("WHITE", PAPER), ("GREEN", "#7BE86A"), ("INK", INK)))
    frame_grid(master, "storyboard", "PUNK XEROX / STORYBOARD", (
        (30, "00.50 / COVER"), (150, "02.50 / FEED"),
        (248, "04.13 / HALFTONE"), (418, "06.97 / SCAN"),
        (595, "09.92 / TEAR"), (1018, "16.97 / TITLE"),
    ), 3)


if __name__ == "__main__":
    main(Path(sys.argv[1]).resolve(strict=True))
