"""把一个目录里的帧拼成联系表：python3 drafts/_lib/contact.py <帧目录> <out.jpg> [列数=6] [每格宽=320]"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw
d, out = Path(sys.argv[1]), sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6
cw = int(sys.argv[4]) if len(sys.argv) > 4 else 320
fs = sorted(list(d.glob('*.png')) + list(d.glob('*.jpg')))
ch = cw * 9 // 16
rows = (len(fs) + cols - 1) // cols
sheet = Image.new('RGB', (cols * cw, rows * (ch + 18)), (12, 12, 14))
dr = ImageDraw.Draw(sheet)
for i, f in enumerate(fs):
    im = Image.open(f).convert('RGB').resize((cw, ch), Image.LANCZOS)
    x, y = (i % cols) * cw, (i // cols) * (ch + 18)
    sheet.paste(im, (x, y))
    dr.text((x + 4, y + ch + 3), f.stem, fill=(200, 200, 210))
sheet.save(out, quality=88)
print('wrote', out, len(fs), 'frames')
