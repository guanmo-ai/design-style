"""把一组静帧拼成带帧号的胶片条：python3 scripts/strip.py OUT.jpg COLS W img1 img2 ..."""
import os, sys
from PIL import Image, ImageDraw, ImageFont
out, cols, w = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
files = sys.argv[4:]
ims = [Image.open(f).convert('RGB') for f in files]
h = int(w * ims[0].height / ims[0].width)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w, rows * (h + 26)), (17, 17, 17))
d = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype(os.path.join(os.path.dirname(__file__), '..', 'public/fonts/JetBrainsMono.ttf'), 18)
except OSError:
    font = None
for i, (f, im) in enumerate(zip(files, ims)):
    x, y = (i % cols) * w, (i // cols) * (h + 26)
    sheet.paste(im.resize((w, h)), (x, y + 26))
    d.text((x + 6, y + 3), 'f' + os.path.basename(f).split('.')[0].lstrip('0') or 'f0', fill=(230, 230, 230), font=font)
sheet.save(out, quality=88)
print(out, sheet.size)
