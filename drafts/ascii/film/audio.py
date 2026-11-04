"""字符画开头小样（第二版）的配乐与音效：120 BPM、A 小调芯片音乐。每一段换主角，声音也换：
甜甜圈的律动 → 字雨落地（由高到低，像倒水）→ 鼠标点击、进度条一格一个音、完成和弦 → 字飞去手机 →
心跳律动（“咚—咚”和心形封面同步）→ 着火的噼啪声 → 片名重击 → 风 → 片尾和弦。
时间全部取自 timeline.js 和 events.json。python3 audio.py out.wav"""
import json
import re
import sys
from pathlib import Path

import numpy as np


def grid(f0, step):
    """起点吸到全片的节拍网格上（否则底鼓、踩镲会错开拍点）"""
    return float(np.ceil(f0 / step - 1e-9) * step)

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[2] / 'scripts' / 'lib'))
from audio import AudioKit  # noqa: E402
from audio.orchestra import Orchestra  # noqa: E402


class Kit(AudioKit, Orchestra):
    pass


TL = json.loads(re.sub(r'//[^\n]*', '', re.search(r'const TL = (\{.*?\});', (HERE / 'timeline.js').read_text(), re.S).group(1)))
EV = json.loads((HERE / 'events.json').read_text())
FPS, BEAT = 60, 30
END = TL['end'][1]
A = Kit(duration=END / FPS, seed=21, fps=FPS, tail=3.0)
fr = A.fr
rng = np.random.default_rng(5)


def square(m, d, duty=0.5, level=1.0, dec=0.18, att=0.002, vib=0.0):
    t = A.tt(d)
    f = A.midi(m) * (1 + vib * np.sin(2 * np.pi * 6 * t))
    ph = np.cumsum(f) / A.SR % 1.0
    return A.fft_filter(np.where(ph < duty, 1.0, -1.0), hi=6000) * A.env(t, att, dec) * level * 0.11


def tri(m, d, level=1.0, dec=0.3):
    t = A.tt(d)
    ph = np.cumsum(np.full(len(t), A.midi(m))) / A.SR % 1.0
    return (4 * np.abs(ph - 0.5) - 1) * A.env(t, 0.003, dec) * level * 0.32


def noise(d, lo=None, hi=None, level=1.0):
    return A.fft_filter(A.rng.standard_normal(int(d * A.SR)), lo=lo, hi=hi) * level


CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]      # Am | F | C | G
ROOT = [33, 29, 36, 31]


def bar(f):
    return int(f // 120) % 4


def arp(f0, f1, level=1.0, step=7.5, octave=12):
    k, f = 0, grid(f0, step)
    while f < f1:
        m = CH[bar(f)][k % 3] + octave + (12 if k % 8 >= 6 else 0)
        A.place(square(m, 0.14, 0.25 if k % 2 else 0.5, level, dec=0.07), fr(f), pan=-0.25 if k % 2 else 0.25, send=0.15)
        k += 1
        f += step


def bassline(f0, f1, level=1.0):
    for f in np.arange(grid(f0, 15), f1, 15):
        r = ROOT[bar(f)]
        A.place(tri(r if int(f // 15) % 2 == 0 else r + 12, 0.24, level, dec=0.16), fr(f))
        A.place(A.bass(r, 0.22, level * 0.7), fr(f))


def drums(f0, f1, kick=True, clap=True, hats=True, level=1.0, heart=False):
    for f in np.arange(grid(f0, 7.5), f1, 7.5):
        on = abs(f % BEAT) < 0.01
        if kick and on:
            A.place(A.kick(level), fr(f)); A.sidechain(f)
            if heart:                                      # 心跳的第二下（“咚—咚”），和封面的第二次鼓起同一帧
                A.place(A.kick(level * 0.55), fr(f + 8))
        if clap and on and int(f // BEAT) % 2 == 1:
            A.place(A.clap(level), fr(f), send=0.25)
        if hats and abs(f % 15) < 0.01:
            A.place(A.hat(level * (0.6 if on else 1.0)), fr(f), pan=0.25)


def ticks(times, f0, f1, m_hi, m_lo, per=3.75, level=0.6):
    """很多个落地时间 → 按 32 分音符归格，每格一个 bleep，音高从高滑到低（字雨像倒水）"""
    slots = sorted({round(t / per) for t in times if f0 <= t < f1})
    for k, s in enumerate(slots):
        m = int(round(m_hi + (m_lo - m_hi) * k / max(1, len(slots) - 1)))
        A.sfx(square(m, 0.06, 0.25, level, dec=0.02), fr(s * per), pan=float(rng.uniform(-0.6, 0.6)), send=0.15)


# ① 0—90 甜甜圈：第 0 帧音乐已在跑
d0, d1 = TL['donut']
bassline(d0, d1, 0.9); arp(d0, d1, 0.9); drums(d0, d1, clap=False, level=0.95)
A.sfx(A.riser(1.4, level=0.4), fr(d1) - 1.4)

# 炸开 → 字雨拼网页
r0, r1 = TL['rain']
A.place(A.kick(1.3), fr(r0)); A.sfx(A.boom(1.0), fr(r0), send=0.4); A.place(A.crash(0.9), fr(r0), send=0.4)
A.sfx(A.whoosh(0.5, 300, 8000, 0.8, peak=0.25), fr(r0), send=0.2)
ticks(EV['rainLand'], r0, r1 + 10, 96, 69, level=0.55)
A.place(A.pad([57, 64, 69], 1.0, 1.0, att=0.3), fr(r0 + 6), send=0.5)

# ② 网页：光标滑过去，点击，安装进度一格一个音，完成和弦
w0 = TL['web'][0]
A.place(A.kick(1.0), fr(w0)); A.place(square(69, 0.4, 0.5, 0.8, dec=0.2), fr(w0), send=0.3)
bassline(w0, TL['morph'][0], 0.85); drums(w0 + 8, TL['morph'][0], level=0.85)
A.sfx(A.whoosh(0.45, 600, 4000, 0.35, peak=0.5), fr(w0 + 8))
c = TL['click']
A.sfx(A.click(1.4, lo=1200, hi=6000, d=0.006), fr(c)); A.sfx(A.thock(76, 0.7), fr(c))
f0, f1 = TL['fill']
for k, f in enumerate(np.arange(f0, f1, 3.75)):
    A.sfx(square([69, 72, 76, 79, 81, 84, 88][k % 7] + 12 * (k // 7) % 24, 0.07, 0.25, 0.6, dec=0.03), fr(f), pan=-0.3 + 0.1 * (k % 7))
for k, m in enumerate([76, 81, 85, 88]):
    A.sfx(A.bell(m, 0.8), fr(f1 + k * 2), send=0.4)

# 每个字飞去手机
m0, m1 = TL['morph']
A.sfx(A.whoosh((m1 - m0) / FPS + 0.2, 400, 9000, 0.8, peak=0.4), fr(m0), send=0.3)
ticks(EV['morphLand'], m0 + 10, m1 + 6, 84, 100, level=0.45)
arp(m0, m1, 0.6, step=3.75)

# ③ 手机：心跳律动 + 粉色主旋律；歌词解码的细碎声
p0, p1 = TL['phone']
A.place(A.kick(1.2), fr(p0)); A.place(A.crash(0.6), fr(p0), send=0.4)
bassline(p0, p1, 0.9); drums(p0, p1, level=1.0, heart=True); arp(p0, p1, 0.55)
for k, m in enumerate([76, 79, 81, 79, 76, 74, 72, 74, 76, 81, 84]):
    A.place(square(m, 0.3, 0.5, 0.8, dec=0.2, vib=0.004), fr(p0 + 6 + k * 7.5), send=0.35)
for at in (p0 + 6, p0 + 30, p0 + 56):
    for q in range(0, 24, 3):
        A.sfx(A.click(0.25), fr(at + q * 1.2), pan=0.4)

# 心脏放大，手机散落
g0, g1 = TL['grow']
A.sfx(A.riser2((g1 - g0) / FPS, 1.0), fr(g0))
for k in range(4):                                      # 心跳越来越快
    A.place(A.kick(0.9 + 0.1 * k), fr(g0 + k * 7)); A.place(A.kick(0.5), fr(g0 + k * 7 + 3))
for k in range(10):
    A.sfx(A.click(0.5, lo=600, hi=3000, d=0.01), fr(g0 + 6 + k * 2), pan=float(rng.uniform(-0.7, 0.7)))

# ④ 着火：轰的一下 + 一直在噼啪的火；片名重击
F0, F1 = TL['fire']
A.place(A.kick(1.4), fr(F0)); A.place(A.hit(1.0, m=33), fr(F0), send=0.3)
n = noise((F1 - F0) / FPS + 0.6, lo=200, hi=3000, level=0.05)
n *= np.minimum(1, A.tt((F1 - F0) / FPS + 0.6) / 0.15)
A.sfx(n, fr(F0), send=0.1)
for f in np.arange(F0, F1, 1.0):                         # 噼啪：随机的小爆点
    if rng.random() < 0.28:
        A.sfx(A.click(float(rng.uniform(0.3, 1.0)), lo=1500, hi=9000, d=0.002), fr(f + rng.random()), pan=float(rng.uniform(-0.8, 0.8)))
bassline(F0, F1, 1.0); drums(F0 + 30, TL['title'], clap=False, level=0.9)
T = TL['title']
A.place(A.kick(1.4), fr(T)); A.place(A.hit(1.2, m=33), fr(T), send=0.4); A.place(A.crash(1.1), fr(T), send=0.5)
drums(T + 30, F1, level=1.0); arp(T, F1, 0.9)
for k, m in enumerate([81, 84, 88, 86, 84, 81, 79, 81]):
    A.place(square(m, 0.5, 0.5, 0.75, dec=0.3, vib=0.004), fr(T + 15 + k * 7.5), send=0.3)

# 风把字吹走；⑤ 片尾
W0 = TL['wind'][0]
A.sfx(A.whoosh(1.1, 200, 7000, 1.0, peak=0.35), fr(W0), send=0.4)
A.sfx(noise(1.2, lo=300, hi=2500, level=0.06) * np.sin(np.pi * A.tt(1.2) / 1.2), fr(W0))
E0 = TL['end'][0]
A.place(A.kick(1.1), fr(E0 + 6)); A.place(A.pad([57, 60, 64, 69, 76], 3.0, 1.4, att=0.1), fr(E0 + 6), send=0.5)
A.place(A.bass(33, 1.6, 0.9), fr(E0 + 6))
for k in range(3):
    A.sfx(A.thock(64 + k * 3, 0.8), fr(E0 + 6 + k * 5 + 9), send=0.2)
for k in range(9):
    A.sfx(A.click(0.45), fr(E0 + 22 + k * 2 + 6), pan=-0.3 + k * 0.07)
for k, m in enumerate([69, 72, 76, 81, 84, 88]):
    A.place(A.bell(m, 0.7), fr(E0 + 52 + k * 2.5), send=0.5)

A.master(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), loop=False)
