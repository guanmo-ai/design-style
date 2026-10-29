"""从任意 wght / wdth 可变字体生成逐字排版用的前进宽度表。"""
import json
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

def write_metrics(font_path, output, wdth=(62, 75, 87.5, 100, 112.5, 125), wght=(700, 800, 900), chars=None):
    WDTH = list(wdth)
    WGHT = list(wght)
    CHARS = chars or "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÀÈÌÒÙàèìòù0123456789 .,:!?·—-/%+=×÷'\"’"
    out = {}
    cap = None
    for wg in WGHT:
        rows = {c: [] for c in CHARS}
        for wd in WDTH:
            f = instancer.instantiateVariableFont(TTFont(font_path), {'wght': wg, 'wdth': wd})
            upm = f['head'].unitsPerEm
            cmap = f.getBestCmap()
            hm = f['hmtx']
            if cap is None:
                cap = f['OS/2'].sCapHeight / upm
            for c in CHARS:
                g = cmap.get(ord(c))
                rows[c].append(round(hm[g][0] / upm, 4) if g else 0.5)
        out[wg] = rows

    with open(str(output), 'w', encoding='utf-8') as fh:
        fh.write('// 由 make_metrics.py 生成，不要手改。Archivo 每个字母的前进宽度（em），按 wdth 取样\n')
        fh.write(f'export const WDTH_SAMPLES = {json.dumps(WDTH)};\n')
        fh.write(f'export const CAP = {cap:.4f};\n')
        fh.write('export const ADV: Record<number, Record<string, number[]>> = ')
        fh.write(json.dumps(out, ensure_ascii=False, separators=(',', ':')))
        fh.write(';\n')
