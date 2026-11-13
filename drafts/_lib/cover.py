"""第一个画面的检查：X 上静音自动播放，第 0 帧就是封面，决定别人停不停下来。
python3 drafts/_lib/cover.py <成片.mp4> [输出目录=成片所在目录]
- 存下第 0 帧原图 <名字>-frame0.jpg，和手机信息流里的大小 <名字>-frame0-thumb.jpg（宽 360）。**两张都要自己看一眼**：缩到 360 还认得出主角、读得出标题吗？
- 量四件事，不过就报“要改”：
  1. 第 0 帧是不是空的 / 暗的（和全片最“满”的那些帧比：亮度、对比、细节量）——带着淡入、黑场、空舞台开场都会在这里露出来；
  2. 第 0 帧是不是比 0.5 秒后明显弱（= 画面是“进场”的，最抓人的一刻不在第 0 帧）；
  3. 0.2 秒内有没有动作；
  4. 前 2 秒有没有停住。
它量的是“有没有犯低级错”，量不出抓不抓人——抓不抓人，最后要主人看。"""
import os
import subprocess
import sys

import numpy as np

path = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(os.path.abspath(path))
stem = os.path.join(out, os.path.splitext(os.path.basename(path))[0].replace('-film', ''))
ff = ['ffmpeg', '-y', '-loglevel', 'error', '-i', path]
subprocess.run(ff + ['-frames:v', '1', '-q:v', '2', f'{stem}-frame0.jpg'], check=True)
subprocess.run(ff + ['-frames:v', '1', '-vf', 'scale=360:-2', '-q:v', '3', f'{stem}-frame0-thumb.jpg'], check=True)

W, H = 320, 180
raw = subprocess.run(ff[:-2] + ['-i', path, '-vf', f'scale={W}:{H},format=gray', '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
f = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
fps = 60 if len(f) > 700 else 30


def stat(a):
    """亮度、对比（标准差）、细节量（相邻像素差的平均）"""
    return a.mean(), a.std(), (np.abs(np.diff(a, axis=0)).mean() + np.abs(np.diff(a, axis=1)).mean()) / 2


s0, sall = stat(f[0]), np.array([stat(a) for a in f[::6]])
top = np.percentile(sall, 75, axis=0)                       # 全片比较“满”的帧
half = stat(f[int(0.5 * fps)])
d = np.abs(np.diff(f[:2 * fps + 1], axis=0)).mean(axis=(1, 2))
bad = []
if s0[1] < 0.6 * top[1] or s0[2] < 0.6 * top[2]:
    bad.append(f'第 0 帧比全片的好帧空：对比 {s0[1]:.0f} / {top[1]:.0f}，细节 {s0[2]:.1f} / {top[2]:.1f}（是不是从空舞台、黑场或淡入开始的？）')
if s0[1] < 0.8 * half[1] or s0[2] < 0.8 * half[2]:
    bad.append(f'第 0 帧比 0.5 秒后弱：对比 {s0[1]:.0f} → {half[1]:.0f}，细节 {s0[2]:.1f} → {half[2]:.1f}（画面是“进场”的，把最抓人的一刻挪到第 0 帧）')
if d[:int(0.2 * fps)].max() < 0.15:
    bad.append(f'0.2 秒内没有动作（前 {int(0.2 * fps)} 帧最大变化 {d[:int(0.2 * fps)].max():.2f}）')
if (d < 0.03).sum() > 0.2 * fps:
    bad.append(f'前 2 秒里有 {(d < 0.03).sum() / fps:.2f} 秒停住不动')
print(f'第 0 帧：亮度 {s0[0]:.0f} · 对比 {s0[1]:.0f} · 细节 {s0[2]:.1f}　｜　全片好帧：对比 {top[1]:.0f} · 细节 {top[2]:.1f}　｜　前 0.2 秒变化 {d[:int(0.2 * fps)].mean():.2f}')
print(f'存了 {stem}-frame0.jpg 和 {stem}-frame0-thumb.jpg（宽 360 = 手机信息流里的大小），两张都看一眼')
print('要改：\n- ' + '\n- '.join(bad) if bad else '没有低级错（不空、不弱、0.2 秒内在动、前 2 秒没停）。抓不抓人要看图、要主人看。')
