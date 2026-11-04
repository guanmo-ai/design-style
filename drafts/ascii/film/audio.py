"""字符画小样的配乐与音效：120 BPM、A 小调芯片音乐（方波琶音 + 次低音 + 鼓），每个画面动作一个声音。
时间全部取自 timeline.js 和 events.json（探针在阶梯上每换一个字 = 一个音）。
python3 audio.py out.wav"""
import json
import re
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[2] / 'scripts' / 'lib'))
from audio import AudioKit  # noqa: E402

TL = json.loads(re.search(r'const TL = (\{.*?\});', (HERE / 'timeline.js').read_text(), re.S).group(1))
EV = json.loads((HERE / 'events.json').read_text())
FPS, BEAT = 60, 30                      # 120 BPM：一拍 30 帧
END = TL['end']
A = AudioKit(duration=END / FPS, seed=21, fps=FPS, tail=2.5)
fr = A.fr


def square(m, d, duty=0.5, level=1.0, dec=0.18, att=0.002, vib=0.0):
    """芯片方波：占空比可调，轻微低通去掉刺耳的高次谐波"""
    t = A.tt(d)
    f = A.midi(m) * (1 + vib * np.sin(2 * np.pi * 6 * t))
    ph = np.cumsum(f) / A.SR % 1.0
    y = np.where(ph < duty, 1.0, -1.0)
    y = A.fft_filter(y, hi=6000)
    return y * A.env(t, att, dec) * level * 0.11


def tri(m, d, level=1.0, dec=0.3):
    t = A.tt(d)
    ph = np.cumsum(np.full(len(t), A.midi(m))) / A.SR % 1.0
    return (4 * np.abs(ph - 0.5) - 1) * A.env(t, 0.003, dec) * level * 0.32


def noise(d, lo=None, hi=None, dec=0.05, level=1.0):
    t = A.tt(d)
    return A.fft_filter(A.rng.standard_normal(len(t)), lo=lo, hi=hi) * A.env(t, 0.001, dec) * level


def bleep(m, level=1.0):
    return square(m, 0.12, 0.25, level, dec=0.045)


# 和弦：Am | F | C | G（一小节 = 4 拍 = 120 帧）
CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
ROOT = [33, 29, 36, 31]
PENTA = [57, 60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84, 86, 88, 91, 93]   # A 小调五声，阶梯上 16 个字一字一音


def bar_of(f):
    return min(3, f // 120)


def arp(f0, f1, level=1.0, step=7.5, octave=12):
    """16 分音符琶音（一拍 4 个）"""
    k, f = 0, f0
    while f < f1:
        ch = CH[bar_of(int(f))]
        m = ch[k % 3] + octave + (12 if k % 8 >= 6 else 0)
        A.place(square(m, 0.14, 0.25 if k % 2 else 0.5, level, dec=0.07), fr(f), pan=-0.25 if k % 2 else 0.25, send=0.15)
        k += 1
        f += step


def bassline(f0, f1, level=1.0):
    f = f0
    while f < f1:
        r = ROOT[bar_of(int(f))]
        A.place(tri(r if (f // 15) % 2 == 0 else r + 12, 0.24, level, dec=0.16), fr(f))
        A.place(A.bass(r, 0.22, level * 0.7), fr(f))
        f += 15


def drums(f0, f1, kick=True, clap=True, hats=True, level=1.0):
    for f in range(f0, f1, 15):
        on = (f % BEAT) == 0
        if kick and on:
            A.place(A.kick(level), fr(f)); A.sidechain(f)
        if clap and on and (f // BEAT) % 2 == 1:
            A.place(A.clap(level * 1.1), fr(f), send=0.25)
        if hats:
            A.place(A.hat(level * (1.0 if on else 0.7)), fr(f), pan=0.3)
            A.place(A.hat(level * 0.45), fr(f + 7.5), pan=-0.3)


# ── A 0—60：扫描线解码。音乐已经在跑（第 0 帧就有声音）+ 一串数据噪声 ──
bassline(0, TL['B'], 0.9)
arp(0, TL['B'], 0.9)
drums(0, TL['B'], clap=False, level=0.9)
rng = np.random.default_rng(3)
for k in range(46):                               # 扫描线经过：密集的高音数据 bleep，越来越快
    f = TL['A1'] * (k / 46) ** 0.8
    A.sfx(square(rng.choice([81, 84, 86, 88, 91, 93, 96]), 0.05, 0.125, 0.5, dec=0.015), fr(f), pan=float(rng.uniform(-0.6, 0.6)), send=0.1)
A.sfx(noise(TL['A1'] / FPS, lo=4000, dec=9, level=0.02) * np.linspace(0.2, 1, int(TL['A1'] / FPS * A.SR)), 0, send=0.1)
A.sfx(A.riser(TL['B'] / FPS, level=0.35), 0)

# ── B 60：灯灭的重拍；然后光从背面绕到正面，探针每换一个字 = 一个音（越亮越高）──
B = TL['B']
A.place(A.kick(1.2), fr(B)); A.sfx(A.boom(1.0), fr(B), send=0.4); A.place(A.crash(0.8), fr(B), send=0.4)
A.place(A.pad([57, 64, 69], 2.6, 1.3, att=0.9, rel=1.0), fr(B + 6), send=0.5)
A.place(A.bass(33, 1.4, 0.8), fr(B))
for f, k in EV['ramp']:
    A.sfx(bleep(PENTA[min(k, len(PENTA) - 1)], 0.9), fr(f), pan=-0.4 + k * 0.05, send=0.35)
for f in range(B + 30, TL['C'], 15):              # 后半段节拍慢慢回来
    A.place(A.hat(0.5 + (f - B) / 180), fr(f), pan=0.3)
A.place(A.kick(0.8), fr(B + 60)); A.place(A.kick(0.9), fr(B + 75))

# ── C 150—240：字号按拍变细，每一步一个“咔”，音一步比一步高 ──
for i, (f, fs) in enumerate(TL['steps']):
    A.sfx(A.thock(60 + i * 5, 1.0), fr(f), send=0.2)
    A.place(A.kick(1.0), fr(f)); A.sidechain(f)
    A.sfx(square(72 + i * 5, 0.25, 0.5, 0.8, dec=0.12), fr(f), send=0.3)
bassline(TL['C'], TL['D'], 0.9)
arp(TL['C'] + 30, TL['D'], 0.7)
drums(TL['C'], TL['D'], kick=False, level=0.9)

# ── D 240—330：锁定（两声确认音），俯冲（上扬 + 呼啸越来越快），落地前空 8 帧吸一口气 ──
D, d0, d1, E = TL['D'], TL['dive0'], TL['dive1'], TL['E']
A.sfx(square(88, 0.08, 0.5, 0.9, dec=0.03), fr(D)); A.sfx(square(93, 0.12, 0.5, 0.9, dec=0.05), fr(D + 8))
A.sfx(A.riser((d1 - d0) / FPS, level=0.9, c0=300, c1=12000), fr(d0), send=0.3)
A.sfx(A.whoosh((d1 - d0) / FPS + 0.1, 200, 9000, level=0.8, peak=0.85), fr(d0), send=0.2)
for k in range(24):                               # 军鼓滚奏越来越密
    f = d0 + (d1 - d0) * (1 - (1 - k / 24) ** 1.8)
    A.place(A.clap(0.35 + 0.6 * k / 24), fr(f), send=0.2)
bassline(D, d0 + 30, 0.7)
arp(D, d1, 0.55, step=3.75)

# ── E 330：落进“@”，新的星球。重拍 + 全曲进来；标题一个字一声 ──
A.place(A.kick(1.3), fr(E)); A.sfx(A.boom(1.2, f0=90, f1=32), fr(E), send=0.5); A.place(A.crash(1.1), fr(E), send=0.5)
A.place(A.pad([57, 60, 64, 69], 2.5, 1.0), fr(E), send=0.4)
bassline(E, END + 30, 1.0)
arp(E, END + 30, 0.9)
drums(E, END + 30, level=1.0)
for k, m in enumerate([81, 84, 88, 86, 84, 81, 79, 81]):     # 主旋律：一小节
    A.place(square(m, 0.5, 0.5, 0.75, dec=0.3, vib=0.004), fr(E + 30 + k * 15), send=0.3)
for k in range(3):                                # “字符画”三个字落定
    A.sfx(A.thock(67 + k * 3, 0.8), fr(E + 18 + k * 5 + 9), send=0.2)
for k in range(9):                                # “ASCII ART”逐字
    A.sfx(A.click(0.5), fr(E + 34 + k * 2 + 6), pan=-0.3 + k * 0.07)

A.master(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), loop=False)
