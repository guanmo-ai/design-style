"""B 版：明亮律动（照 015 第二版：大调、四拍底鼓、八度跳的贝斯、反拍钢琴、钟琴主旋律），对齐 017 的时间轴。"""
import sys
from pathlib import Path
import numpy as np
ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'scripts'))
from lib.audio import AudioKit

audio = AudioKit(duration=15.0, seed=170, fps=60)
fr, place, sfx = audio.fr, audio.place, audio.sfx
BEAT, BAR0 = 25, 25
# F 大调：F | C | Dm | B♭ | F | C | B♭ | C | F（每小节 100 帧，从 25 起）
CH = {'F': (41, [65, 69, 72, 77]), 'C': (36, [64, 67, 72, 76]), 'Dm': (38, [65, 69, 74, 77]), 'Bb': (34, [65, 70, 74, 77]), 'Gm': (43, [67, 70, 74, 79])}
PROG = ['F', 'C', 'Dm', 'Bb', 'F', 'C', 'Bb', 'C', 'F']
def chord_at(f):
    b = int((f - BAR0) // 100) % 9 if f >= BAR0 else 8
    return PROG[b]
for b in range(-1, 36):
    f = BAR0 + b * BEAT
    if f >= 900: break
    place(audio.kick(0.9), fr(f)); audio.sidechain(f)
    if b % 2 == 1: place(audio.clap(0.75), fr(f), send=0.12)
    place(audio.hat(0.7, d=0.03, open_=True), fr(f + 12.5), pan=0.25)
    for s in range(4):
        place(audio.shaker(0.45 if s % 2 else 0.3), fr(f + s * 6.25), pan=-0.3)
BASSPAT = [0, 12, 0, 12, 0, 12, 7, 12]
for b in range(-1, 9):
    root, tones_ = CH[PROG[b % 9]]
    f0 = BAR0 + b * 100
    for k in range(8):
        place(audio.bass(root + BASSPAT[k], 0.2, 0.9), fr(f0 + k * 12.5))
    for k in range(4):
        place(audio.piano([m - 12 for m in tones_], 0.4, 0.8), fr(f0 + k * BEAT + 12.5), pan=0.2, send=0.3)
MOTIF = [(0, 77), (12.5, 81), (25, 84), (37.5, 82), (50, 81), (62.5, 77), (75, 74), (87.5, 77)]
for base in (125, 325, 525, 725):
    for dt, m in MOTIF:
        place(audio.bell(m, 0.6), fr(base + dt), pan=-0.2, send=0.4)
for f in (125, 225, 325, 425, 525, 650):
    place(audio.crash(0.45), fr(f), send=0.3)
    place(audio.pad([m - 12 for m in CH[chord_at(f)][1]], fr(50), 0.6, att=0.3), fr(f), send=0.5)
for i in range(12):
    place(audio.bell(72 + [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26][i], 0.35, 0.5), fr(2 + 2.5 * i), pan=-0.6 + 0.1 * i, send=0.3)
for k, f in enumerate([37.5, 43.75, 50, 56.25, 62.5]):
    sfx(audio.thock(65 + [0, 2, 4, 7, 9][k], 0.8), fr(f))
sfx(audio.boom(0.7, 110, 40, 0.6), fr(75)); place(audio.crash(0.6), fr(75), send=0.3)
for k, f in enumerate([675, 700, 725, 750, 775]):
    sfx(audio.thock(65 + [0, 4, 7, 9, 12][k], 0.9), fr(f))
sfx(audio.boom(0.6, 110, 40, 0.5), fr(600)); place(audio.bell(84, 0.7, 1.0), fr(600), send=0.5)
audio.master(ROOT / 'out/017/music-b.wav')
