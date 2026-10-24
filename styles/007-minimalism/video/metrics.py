"""
007 · Minimalism —— 从真实字体里读出字宽，写进 metrics.ts（视频里逐字母排版、算标签宽度用）

用法：python3 styles/007-minimalism/video/metrics.py
需要：pip install fonttools；字体先用 npm run fonts 下载到 public/fonts
"""
import json
import os

from fontTools.ttLib import TTFont

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
FONTS = {
    'd100': 'InterDisplay-Thin.ttf',
    'd200': 'InterDisplay-ExtraLight.ttf',
    'd300': 'InterDisplay-Light.ttf',
    't300': 'Inter-Light.ttf',
    't400': 'Inter-Regular.ttf',
    't500': 'Inter-Medium.ttf',
    'mono': 'GeistMono-Regular.ttf',
    'sc300': 'NotoSansSC-Light.otf',
}
CHARS = ''.join(chr(c) for c in range(32, 127)) + '—–·→×éüö’“”…'

out = {}
for key, file in FONTS.items():
    f = TTFont(os.path.join(ROOT, 'public', 'fonts', file))
    upm = f['head'].unitsPerEm
    cmap = f.getBestCmap()
    hmtx = f['hmtx']
    out[key] = {ch: round(hmtx[cmap[ord(ch)]][0] / upm, 4) for ch in CHARS if ord(ch) in cmap}

path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'metrics.ts')
with open(path, 'w', encoding='utf-8') as fp:
    fp.write('// 由 metrics.py 生成，请勿手改：每个字符的步进宽度（em）。中文按全角 1em 计\n')
    fp.write('export const ADV: Record<string, Record<string, number>> = ')
    fp.write(json.dumps(out, ensure_ascii=False, separators=(',', ':')))
    fp.write(';\n')
print('wrote', path)
