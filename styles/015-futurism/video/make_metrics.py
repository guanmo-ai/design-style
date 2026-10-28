"""
Archivo 的字宽表：每个字母在 wdth 62 / 75 / 87.5 / 100 / 112.5 / 125 时的前进宽度（em），按字重 700 / 800 / 900 各一份。
短片里的大字是一个字母一个字母排的（每个字母要单独前倾、单独拖残影），所以要知道 wdth 变化时每个字母有多宽。
可变字体在相邻母版之间是线性插值，这里按 12.5 一档取样，中间线性插值，误差 < 0.002 em。
用法：python3 styles/015-futurism/video/make_metrics.py  →  video/metrics.ts
"""
import json
import os

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(HERE, '..', '..', '..', 'public', 'fonts', 'Archivo.ttf')
WDTH = [62, 75, 87.5, 100, 112.5, 125]
WGHT = [700, 800, 900]
CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÀÈÌÒÙàèìòù0123456789 .,:!?·—-/%+=×÷\'"’'

out = {}
cap = None
for wg in WGHT:
    rows = {c: [] for c in CHARS}
    for wd in WDTH:
        f = instancer.instantiateVariableFont(TTFont(FONT), {'wght': wg, 'wdth': wd})
        upm = f['head'].unitsPerEm
        cmap = f.getBestCmap()
        hm = f['hmtx']
        if cap is None:
            cap = f['OS/2'].sCapHeight / upm
        for c in CHARS:
            g = cmap.get(ord(c))
            rows[c].append(round(hm[g][0] / upm, 4) if g else 0.5)
    out[wg] = rows

with open(os.path.join(HERE, 'metrics.ts'), 'w', encoding='utf-8') as fh:
    fh.write('// 由 make_metrics.py 生成，不要手改。Archivo 每个字母的前进宽度（em），按 wdth 取样\n')
    fh.write(f'export const WDTH_SAMPLES = {json.dumps(WDTH)};\n')
    fh.write(f'export const CAP = {cap:.4f};\n')
    fh.write('export const ADV: Record<number, Record<string, number[]>> = ')
    fh.write(json.dumps(out, ensure_ascii=False, separators=(',', ':')))
    fh.write(';\n')
print('metrics.ts', 'cap', cap)
