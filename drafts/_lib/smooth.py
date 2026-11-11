"""“丝滑”的数字检查（Claude 看不了播放，只能量）：相邻两帧差多少、有没有突然跳一下、有没有停住不动的死区。
python3 drafts/_lib/smooth.py <成片.mp4> [fps=60]
- 跳变：这一帧的变化量是前后 12 帧中位数的 4 倍以上（硬切、某个东西突然出现 / 消失）。拍点上的重击会算进来，逐个核对是不是有意的。
- 死区：连续 0.4 秒以上几乎没变（画面停住了）。
它量的是“有没有不连续”，量不出“好不好看”。基准：drafts/plush/film/plush-film.mp4（主人 2026-11-11：“很丝滑”）。"""
import subprocess
import sys

import numpy as np

path, fps = sys.argv[1], float(sys.argv[2]) if len(sys.argv) > 2 else 60.0
W, H = 192, 108
raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-vf', f'scale={W}:{H},format=gray', '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
f = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
d = np.abs(np.diff(f, axis=0)).mean(axis=(1, 2))                 # 第 i+1 帧和第 i 帧平均差多少（0—255）
med = np.array([np.median(d[max(0, i - 12):i + 13]) for i in range(len(d))])
jumps = [i + 1 for i in range(len(d)) if d[i] > 4 * max(med[i], 0.15)]
still = d < 0.03
runs, start = [], None
for i, s in enumerate(list(still) + [False]):
    if s and start is None:
        start = i
    if not s and start is not None:
        if i - start >= 0.4 * fps:
            runs.append((start, i))
        start = None
print(f'{len(f)} 帧 · 相邻帧平均差 {d.mean():.2f}（中位 {np.median(d):.2f}，最大 {d.max():.2f} @ 第 {int(d.argmax()) + 1} 帧）')
print(f'跳变 {len(jumps)} 处：{jumps[:40]}')
print(f'死区 {len(runs)} 段：{[(a, b, round((b - a) / fps, 2)) for a, b in runs]}')
