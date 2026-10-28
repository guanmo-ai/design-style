"""画剧本曲线（probe 版）：每个数一行子图，竖线 = 拍点（BEAT 帧）。
用法：python3 scripts/plot_probe.py out/curves.json OUT.png [起始帧 结束帧] [--beat 25]"""
import json, sys, os
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager as fm
_F = os.path.join(os.path.dirname(__file__), '..', 'public/fonts/NotoSansSC-Bold.otf')
if os.path.exists(_F):
    fm.fontManager.addfont(_F)
    plt.rcParams['font.family'] = fm.FontProperties(fname=_F).get_name()
plt.rcParams['axes.unicode_minus'] = False
args = [a for a in sys.argv[1:] if not a.startswith('--')]
beat = 25
if '--beat' in sys.argv:
    beat = int(sys.argv[sys.argv.index('--beat') + 1])
    args = [a for a in args if a != str(beat)]
rows = json.load(open(args[0]))
a, b = (int(args[2]), int(args[3])) if len(args) > 3 else (0, len(rows))
rows = rows[a:b]
keys = [k for k in rows[0] if k != 'f']
f = np.array([r['f'] for r in rows])
fig, ax = plt.subplots(len(keys), 1, figsize=(18, 1.7 * len(keys)), sharex=True)
for i, k in enumerate(keys):
    y = np.array([np.nan if r[k] is None else r[k] for r in rows], dtype=float)
    ax[i].plot(f, y, lw=1.4, color=f'C{i % 10}')
    ax[i].set_ylabel(k, rotation=0, ha='right', va='center', fontsize=9)
    for bt in range((a // beat) * beat, b, beat):
        ax[i].axvline(bt, color='#ccc', lw=0.5, zorder=0)
plt.tight_layout()
plt.savefig(args[1], dpi=60)
print(args[1])
