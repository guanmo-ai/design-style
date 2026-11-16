#!/bin/bash
# 出全部六张：2 倍超采样（3840×2160），再缩一份 1920×1080
cd "$(dirname "$0")"
r() { node shot.cjs "$1" "png/hi/$2.png" 1920 1080 2 && echo "done $2"; }
(r anime/cover.html anime-cover; r anime/layers.html anime-layers; r pencil/cover.html pencil-cover; r pencil/spacing.html pencil-spacing) &
(r painterly/cover.html painterly-cover; r painterly/process.html painterly-process) &
wait
python3 - <<'PY'
from PIL import Image
import glob, os
for f in sorted(glob.glob('png/hi/*.png')):
    n = os.path.basename(f)[:-4]
    im = Image.open(f).convert('RGB')
    im.save(f'png/hi/{n}.jpg', quality=93, optimize=True)
    im.resize((1920, 1080), Image.LANCZOS).save(f'png/{n}.png', optimize=True)
    os.remove(f)
    print(n, os.path.getsize(f'png/hi/{n}.jpg') // 1024, 'KB')
PY
