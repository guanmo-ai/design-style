#!/usr/bin/env python3
"""时间轴图：章节色块 + 配乐波形 + 拍点网格，用来检查“剪辑点是否都落在拍子上”。

用法：python3 scripts/timeline_chart.py SEGMENTS.json music.wav OUT.png
SEGMENTS.json: {"fps":60,"bpm":120,"frames":900,"title":"...","segments":[{"label":"开场","start":0,"dur":120,"color":"#F0E9DA"},...]}
"""
import json, sys, wave
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager as fm
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
fm.fontManager.addfont(os.path.join(ROOT, 'public/fonts/NotoSansSC-Bold.otf'))
plt.rcParams['font.family'] = fm.FontProperties(fname=os.path.join(ROOT, 'public/fonts/NotoSansSC-Bold.otf')).get_name()

INK, PAPER, GREY = '#161514', '#F0E9DA', '#8C877E'


def lum(hexc):
    r, g, b = (int(hexc[i:i + 2], 16) / 255 for i in (1, 3, 5))
    return 0.299 * r + 0.587 * g + 0.114 * b


def main(seg_path, wav_path, out):
    cfg = json.load(open(seg_path, encoding='utf-8'))
    fps, bpm, total = cfg['fps'], cfg['bpm'], cfg['frames']
    beat = fps * 60 / bpm
    w = wave.open(wav_path)
    sr, n, ch = w.getframerate(), w.getnframes(), w.getnchannels()
    x = np.frombuffer(w.readframes(n), dtype=np.int16).reshape(-1, ch).mean(axis=1) / 32768
    hop = sr // fps // 4
    env = np.sqrt(np.convolve(x ** 2, np.ones(hop) / hop, mode='same'))[::hop]
    t = np.arange(len(env)) * hop / sr * fps

    fig = plt.figure(figsize=(19.2, 6.2), dpi=100, facecolor=INK)
    ax = fig.add_axes([0.03, 0.12, 0.94, 0.68], facecolor=INK)
    for s in cfg['segments']:
        ax.add_patch(plt.Rectangle((s['start'], 1.08), s['dur'], 0.62, facecolor=s['color'], edgecolor=INK, lw=3))
        ax.text(s['start'] + s['dur'] / 2, 1.39, s['label'], ha='center', va='center', fontsize=13,
                color=INK if lum(s['color']) > 0.5 else PAPER)
        ax.axvline(s['start'], color='#F2B419', lw=1.4, alpha=0.9, ymax=0.62)
    for b in np.arange(0, total + 1, beat):
        ax.axvline(b, color=GREY, lw=0.6, alpha=0.35, ymax=0.62)
    ax.fill_between(t, -env / env.max(), env / env.max(), color=PAPER, lw=0, alpha=0.85)
    ax.set_xlim(0, total)
    ax.set_ylim(-1.05, 1.75)
    ax.set_yticks([])
    ticks = np.arange(0, total + 1, fps)
    ax.set_xticks(ticks)
    ax.set_xticklabels([f'{int(v / fps)}s' for v in ticks], color=GREY, fontsize=11)
    for sp in ax.spines.values():
        sp.set_visible(False)
    ax.tick_params(length=0)
    fig.text(0.03, 0.9, cfg.get('title', ''), color=PAPER, fontsize=24)
    fig.text(0.03, 0.845, f'{bpm} BPM · 1 拍 = {beat:.0f} 帧 · 灰线 = 拍点 · 黄线 = 剪辑点 · 白色 = 配乐响度包络',
             color=GREY, fontsize=13)
    fig.savefig(out, facecolor=INK)
    print(out)


if __name__ == '__main__':
    main(*sys.argv[1:4])
