"""画剧本曲线：主角（第 1 组）的屏幕位置、大小、速度、离墙高度，镜头位置与缩放；竖线 = 拍点。
用法：python3 scripts/plot_curves.py out/curves.json OUT.png [起始帧 结束帧]"""
import json, sys
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager as fm
import os
_F = os.path.join(os.path.dirname(__file__), "..", "public/fonts/NotoSansSC-Bold.otf")
fm.fontManager.addfont(_F)
plt.rcParams["font.family"] = fm.FontProperties(fname=_F).get_name()
plt.rcParams["axes.unicode_minus"] = False
rows = json.load(open(sys.argv[1]))
a, b = (int(sys.argv[3]), int(sys.argv[4])) if len(sys.argv) > 4 else (0, len(rows))
rows = rows[a:b]
f = np.array([r['f'] for r in rows])
def g1(key):
    out = []
    for r in rows:
        s = [x for x in r['shapes'] if x['group'] == 1]
        out.append(np.mean([x[key] for x in s]) if s else np.nan)
    return np.array(out)
cx, cy, hw, hh = g1('cx'), g1('cy'), g1('hw'), g1('hh')
sp = np.hypot(np.gradient(cx), np.gradient(cy))
cam = np.array([r['cam']['cx'] for r in rows]); camy = np.array([r['cam']['cy'] for r in rows]); z = np.array([r['cam']['z'] for r in rows])
h1 = np.array([r['groups'][1]['h'] for r in rows])
fig, ax = plt.subplots(5, 1, figsize=(16, 13), sharex=True)
ax[0].plot(f, cx, label='x'); ax[0].plot(f, cy, label='y'); ax[0].set_ylabel('主角屏幕位置'); ax[0].legend()
ax[1].plot(f, hw, label='hw'); ax[1].plot(f, hh, label='hh'); ax[1].set_ylabel('主角半宽 / 半高'); ax[1].legend()
ax[2].plot(f, sp, color='C3'); ax[2].set_ylabel('主角屏幕速度 px/帧')
ax[3].plot(f, h1, color='C4'); ax[3].set_ylabel('离墙高度')
ax[4].plot(f, np.gradient(cam), label='镜头 x 速度'); ax[4].plot(f, np.gradient(camy), label='镜头 y 速度'); ax[4].plot(f, (z - 1) * 20, label='(z−1)×20'); ax[4].legend(); ax[4].set_ylabel('镜头')
for x in ax:
    for bt in range((a // 30) * 30, b, 30):
        x.axvline(bt, color='#bbb', lw=0.6, zorder=0)
    x.grid(False)
plt.tight_layout(); plt.savefig(sys.argv[2], dpi=70)
print(sys.argv[2])
