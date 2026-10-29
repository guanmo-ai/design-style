"""画剧本曲线（probe 版）：每个数一行子图，竖线 = 拍点（BEAT 帧）。
用法：python3 scripts/plot_probe.py out/curves.json OUT.png [起始帧 结束帧] [--beat 25]"""
import argparse
import json
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager as fm


def plot_probe(source, output, start=0, end=None, beat=25):
    if beat <= 0:
        raise ValueError('拍点间隔必须大于 0')
    rows = json.loads(Path(source).read_text())
    end = end if end is not None else (rows[-1]['f'] + 1 if rows else 0)
    rows = [r for r in rows if start <= r['f'] < end]
    if not rows:
        raise ValueError('所选区间没有曲线数据')
    keys = [k for k in rows[0] if k != 'f']
    if not keys:
        raise ValueError('曲线至少需要一个数值通道')
    font = Path(__file__).resolve().parents[1] / 'public/fonts/NotoSansSC-Bold.otf'
    if font.exists():
        fm.fontManager.addfont(str(font))
        plt.rcParams['font.family'] = fm.FontProperties(fname=font).get_name()
        plt.rcParams['font.weight'] = 700
    plt.rcParams['axes.unicode_minus'] = False
    frames = np.array([r['f'] for r in rows])
    fig, axes = plt.subplots(len(keys), 1, figsize=(18, 1.7 * len(keys)), sharex=True, squeeze=False)
    colors = ['#3157D5', '#E16B48', '#9164C4', '#B98523', '#5082A8', '#B35B85']
    for i, key in enumerate(keys):
        axis = axes[i, 0]
        y = np.array([np.nan if r[key] is None else r[key] for r in rows], dtype=float)
        axis.plot(frames, y, lw=1.4, color=colors[i % len(colors)])
        axis.set_ylabel(key, rotation=0, ha='right', va='center', fontsize=9)
        for tick in range((start // beat) * beat, end, beat):
            axis.axvline(tick, color='#ccc', lw=0.5, zorder=0)
    fig.tight_layout()
    fig.savefig(output, dpi=60)
    plt.close(fig)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source')
    parser.add_argument('output')
    parser.add_argument('start', nargs='?', type=int, default=0)
    parser.add_argument('end', nargs='?', type=int)
    parser.add_argument('--beat', type=int, default=25)
    args = parser.parse_args()
    plot_probe(args.source, args.output, args.start, args.end, args.beat)
    print(args.output)
