"""
Design Style · 风格 017 · 中世纪现代 Mid-Century Modern —— 配乐与音效（纯代码合成，无外部音源）

144 BPM（1 拍 = 25 帧）· F 大调 · 快速摇摆的 bebop：叮叮镲 + 二四拍响指 + 行走低音提琴 + 钢琴 Charleston + 颤音琴
  0—96     开场搭海报：钟心“咚”、12 根辐条炸开（一串细碎的“咔”）、12 颗球 = 12 个颤音琴音一口气往上刷；
           MID- / CENTURY = 小木块；MODERN 五个字 = 五声钢琴重音（十六分音符），O = 钹 + 低音 + 全和弦（第 3 拍）
  90—114   辐条弹起来（上扬）、蓝纸滑进来（刷子“唰”）
  114—178  01 Bass《金臂人》：Bernstein 式的紧张——低音 F A♭ B♭ 固定音型、手臂七节 = 七声往上爬的木块、
           四周纸条 = 军鼓边击、1955 四个数字 = 四声铜管式的钢琴重和弦
  178      绿松石纸滑进来 → 02
和弦（每小节 100 帧）：F6/9 | D♭7 C7 | F6/9 …

用法：python3 styles/017-mid-century-modern/audio/make_music.py
输出：public/017-mid-century-modern/music.wav（响度 −14 LUFS，峰值 < −1.5 dBFS）
"""
import math
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'scripts'))
from lib.audio import AudioKit  # noqa: E402

audio = AudioKit(duration=20.0, seed=17, fps=60)
SR = audio.SR
BEAT = 25
SWING = 16.7  # 摇摆的后半拍：一拍的 2/3 处
fr, place, sfx, tt, midi = audio.fr, audio.place, audio.sfx, audio.tt, audio.midi


# ───────── 自己的乐器：颤音琴、低音提琴、刷子、响指 ─────────
def vibe(m, level=1.0, dec=1.2):
    """颤音琴：基音 + 4 倍泛音（金属片），5.5 Hz 的颤音电机"""
    f = midi(m)
    t = tt(dec * 2.5)
    y = np.sin(2 * np.pi * f * t) + 0.22 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t / 0.25) + 0.08 * np.sin(2 * np.pi * 10 * f * t) * np.exp(-t / 0.05)
    trem = 1 - 0.28 * (0.5 - 0.5 * np.cos(2 * np.pi * 5.5 * t))
    return y * trem * np.minimum(1, t / 0.002) * np.exp(-t / dec) * level * 0.16


def upright(m, d=0.36, level=1.0):
    """低音提琴：拨弦（Karplus-Strong，暗一点）+ 一点指头的“噗”"""
    y = audio.pluck_string(m, d, 1.0, 0.25)
    n = min(len(y), int(0.012 * SR))
    y[:n] += audio.rng.standard_normal(n) * np.linspace(0.25, 0, n)
    return audio.fft_filter(y, lo=30, hi=1800) * level * 2.2


def brush(d, level=1.0):
    t = tt(d)
    x = audio.fft_filter(audio.rng.standard_normal(len(t)), lo=1500, hi=9000)
    return x * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5 * level * 0.05


def snap(level=1.0):
    return audio.click(level * 0.9, 1800, 6000, 0.006)


def ride(level=1.0):
    return audio.hat(level * 0.5, d=0.2, open_=True)


def stab(ms, level=1.0):
    """铜管式的重和弦：钢琴两层八度 + 一点低音“咚”"""
    return audio.piano(ms + [m + 12 for m in ms[-2:]], 0.35, level)


# ───────── 画面上的时刻（与 video/film.tsx 一致） ─────────
SPOKE = [-5 + 0.9 * i for i in range(12)]
BALL = [2 + 2.5 * i for i in range(12)]
MID = [22 + 2 * i for i in range(4)]
CENT = [30 + 2 * i for i in range(7)]
MOD = [37.5, 43.75, 50, 56.25, 62.5]
BIG = 75
LIFT, SHEET1, BASS, SHEET2 = 90, 96, 114, 178
ARM = [BASS + 6 + 1.6 * k for k in range(7)]
BARS = [131, 137.25, 143.5, 149.75, 156]
YEAR = [158 + 4 * i for i in range(4)]


def pan_clock(i):
    return 0.7 * math.cos(math.radians(i * 30 - 90))


# ───────── 节奏组：从第 0 拍就在跑（片尾接回开头） ─────────
for b in range(-1, 48):
    f = b * BEAT
    place(ride(0.9 if b % 2 == 0 else 0.75), fr(f), pan=0.35, send=0.08)
    if b % 2 == 1:
        place(ride(0.55), fr(f + SWING), pan=0.35)
        place(snap(0.85), fr(f), pan=-0.25, send=0.2)
        place(audio.hat(0.45, d=0.02), fr(f), pan=0.1)

CH = {
    'F': ([41, 45, 48, 50], [57, 60, 62, 67]),  # F6/9：A C D G
    'Db7': ([37, 41, 44, 47], [53, 59, 60, 65]),  # D♭9（无根）：F B C F
    'C7': ([36, 40, 43, 46], [52, 58, 62, 69]),  # C13：E B♭ D A
}
PROG = ['F', 'F', 'Db7', 'C7'] * 12  # 每半小节（50 帧）一个
for h, name in enumerate(PROG):
    f0 = h * 50
    if f0 >= 1150:
        break
    walk, voicing = CH[name]
    in_bass = BASS <= f0 < SHEET2
    for k in range(2):
        m = walk[(h % 2) * 2 + k] if not in_bass else [41, 44, 46, 44][(h * 2 + k) % 4]
        place(upright(m, 0.32, 1.0), fr(f0 + k * BEAT))
    if not in_bass:
        place(audio.piano(voicing, 0.16, 0.5), fr(f0 + (0 if h % 2 == 0 else -BEAT + SWING)), pan=0.15, send=0.25)

# ───────── 开场：搭海报 ─────────
sfx(audio.whoosh(fr(22), 6000, 400, 0.4, 0.8), fr(-20), pan=0.5)  # 太阳从镜头上方落下
sfx(audio.boom(0.7, 120, 50, 0.4), fr(4), pan=0.5)
sfx(audio.boom(0.8, 140, 45, 0.5), fr(-4))  # 钟心落下
for i, f in enumerate(SPOKE):  # 辐条炸开
    sfx(audio.click(0.4, 2500, 9000, 0.003), fr(f), pan=pan_clock(i))
place(audio.crash(0.4), fr(0), send=0.3)
PENTA = [65, 67, 69, 72, 74, 77, 79, 81, 84, 86, 89, 91]
for i, f in enumerate(BALL):
    place(vibe(PENTA[i], 0.75, 0.9), fr(f), pan=pan_clock(i), send=0.3)
sfx(audio.thock(72, 0.8), fr(14))  # 钟心点
for i, f in enumerate(MID + CENT):
    sfx(audio.thock(64 + [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17][i], 0.5), fr(f), pan=-0.5 + 0.04 * i)
MOD_CH = [[53, 57, 60], [55, 58, 62], [57, 60, 64], [58, 62, 65], [60, 64, 67]]
for f, ms in zip(MOD, MOD_CH):
    place(stab(ms, 0.6), fr(f), pan=0.1, send=0.25)
    sfx(audio.tom(43, 0.5), fr(f))
for k in range(48 * 8, 78 * 8):  # 分针转一圈：每 30° 一声
    t = k / 8
    u = min(1, max(0, (t - 48) / 30))
    a = 360 * (4 * u ** 3 if u < 0.5 else 1 - (-2 * u + 2) ** 3 / 2)
    u0 = min(1, max(0, (t - 1 / 8 - 48) / 30))
    a0 = 360 * (4 * u0 ** 3 if u0 < 0.5 else 1 - (-2 * u0 + 2) ** 3 / 2)
    if int(a // 30) != int(a0 // 30):
        sfx(audio.click(0.3, 3000, 9000, 0.002), fr(t), pan=0.05)
sfx(audio.whoosh(fr(16), 300, 5000, 0.45, 0.8), fr(BIG - 16), pan=-0.1)
sfx(audio.boom(1.0, 95, 38, 0.8), fr(BIG))
place(audio.crash(0.75), fr(BIG), send=0.35)
place(upright(29, 0.7, 1.3), fr(BIG))
place(stab([53, 57, 60, 62, 67], 0.85), fr(BIG), send=0.4)
for f, m in ((70, 88), (74, 91), (76, 93)):  # 星芒
    place(audio.bell(m, 0.35, 0.6), fr(f), pan=0.6, send=0.4)

# ───────── 换章 → 01 Bass ─────────
sfx(audio.riser(fr(24), 0.6, 600, 7000), fr(LIFT))
sfx(brush(fr(20), 2.2), fr(SHEET1), pan=0.6)
sfx(audio.whoosh(fr(18), 4000, 300, 0.5, 0.4), fr(SHEET1), pan=0.5)
for k, f in enumerate(ARM):  # 手臂七节往上爬
    sfx(audio.thock(53 + [0, 3, 5, 6, 7, 10, 12][k], 0.9), fr(f), pan=-0.5 + 0.15 * k, send=0.15)
place(stab([53, 59, 60, 65], 0.9), fr(ARM[0]), send=0.3)
for f in BARS:  # 四周纸条：军鼓边击
    sfx(audio.click(0.6, 900, 5000, 0.012), fr(f), pan=0.3)
    sfx(audio.tom(48, 0.35), fr(f), pan=0.3)
for k, f in enumerate(YEAR):  # 1955
    place(stab([[52, 58, 62], [53, 59, 63], [52, 58, 62], [48, 52, 58, 62]][k], 0.8), fr(f), pan=0.2, send=0.3)
    sfx(audio.boom(0.4, 110, 50, 0.3), fr(f))
sfx(brush(fr(20), 2.2), fr(SHEET2), pan=0.6)
sfx(audio.whoosh(fr(18), 4000, 300, 0.5, 0.4), fr(SHEET2), pan=0.5)
place(audio.crash(0.5), fr(SHEET2 + 18), send=0.3)

audio.master(ROOT / 'public/017-mid-century-modern/music.wav')
