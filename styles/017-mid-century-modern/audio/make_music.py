"""
Design Style · 风格 017 · 中世纪现代 Mid-Century Modern —— 配乐与音效（纯代码合成，无外部音源）

120 BPM（1 拍 = 30 帧）· F 大调 · 摇摆的冷爵士（cool jazz）：
  前奏 0—120   Bass《金臂人》式的紧张：低音提琴 8 分音符的固定音型（F F A♭ F B♭ F A♭ F），
               纸条每扎下一根 = 一声调好音的木块（十六分音符，一级级往上）
  74—120       纸条旋进钟里：刷子“沙——”地扫一圈 + 上扬
  120          落定（第 4 拍）：低音“咚”+ 钹 + 颤音琴 Fmaj9；鼓（摇摆的叮叮镲 + 二四拍响指）和行走低音进来
  132—207      11 颗球落上去 = 11 个颤音琴音（F 大调五声音阶往上走），声像跟着球在钟上的位置
  240          手把红球按下（Gm7 进来）；244—300 指针转两圈：棘轮“咔哒”跟着分针每 30° 一声，先快后慢，第 10 拍“叮”
  284—322      MID-CENTURY 十一个字母：三十二分音符的小木块
  330—368      MODERN：钢琴和弦音一个一个按下去；390 的 O：全队一起落在第 2 拍（钹 + 低音 + Fmaj9）
  405—450      6 点的球掉下去：往下滑的“呜”
和弦：前奏 C7sus（F 持续音）| Fmaj7 | Gm7 C7 | Fmaj7 …（每小节 120 帧）

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
BEAT = 30
SWING = 20  # 摇摆的后半拍：一拍的 2/3 处
fr, place, sfx, tt, midi = audio.fr, audio.place, audio.sfx, audio.tt, audio.midi


# ───────── 自己的两件乐器：颤音琴、低音提琴 ─────────
def vibe(m, level=1.0, dec=1.4):
    """颤音琴：基音 + 4 倍泛音（金属片），5.5 Hz 的颤音电机"""
    f = midi(m)
    t = tt(dec * 2.5)
    y = np.sin(2 * np.pi * f * t) + 0.22 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t / 0.25) + 0.08 * np.sin(2 * np.pi * 10 * f * t) * np.exp(-t / 0.05)
    trem = 1 - 0.28 * (0.5 - 0.5 * np.cos(2 * np.pi * 5.5 * t))
    return y * trem * np.minimum(1, t / 0.002) * np.exp(-t / dec) * level * 0.16


def upright(m, d=0.42, level=1.0):
    """低音提琴：拨弦（Karplus-Strong，暗一点）+ 一点指头的“噗”"""
    y = audio.pluck_string(m, d, 1.0, 0.25)
    n = min(len(y), int(0.012 * SR))
    y[:n] += audio.rng.standard_normal(n) * np.linspace(0.25, 0, n)
    y = audio.fft_filter(y, lo=30, hi=1800)
    return y * level * 2.2


def brush(d, level=1.0):
    """刷子扫鼓面：粉红噪声，带通，起伏"""
    t = tt(d)
    x = audio.rng.standard_normal(len(t))
    x = audio.fft_filter(x, lo=1500, hi=9000)
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5
    return x * env * level * 0.05


def snap(level=1.0):
    """响指"""
    return audio.click(level * 0.9, 1800, 6000, 0.006)


def ride(level=1.0):
    return audio.hat(level * 0.55, d=0.22, open_=True)


# ───────── 画面上的时刻（与 video/opening.tsx 一致） ─────────
land_a = [-15 + 7.5 * i for i in range(12)]
BALL_ORDER = [0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11]
ball_land = [132 + 7.5 * j for j in range(11)]
mid_land = [284 + 3.75 * i for i in range(11)]
MOD_LAND = {0: 330, 2: 345, 3: 352.5, 4: 360, 5: 367.5, 1: 390}


def pan_of(i):
    """钟上第 i 个位置 → 声像（3 点在右、9 点在左）"""
    return 0.75 * math.cos(math.radians(i * 30 - 90))


# ───────── 前奏：固定音型 + 纸条木块 ─────────
OST = [41, 41, 44, 41, 46, 41, 44, 41]
for k in range(8):
    place(upright(OST[k], 0.22, 1.0), fr(k * 15))
for k, m in enumerate([40, 41, 42, 43]):  # 落定前的半音上行
    place(upright(m, 0.18, 0.8), fr(60 + k * 15))
PENTA = [65, 67, 69, 72, 74, 77, 79, 81, 84, 86, 89, 91]
for i, f in enumerate(land_a):
    sfx(audio.thock(PENTA[i] - 12, 1.0), fr(f), pan=-0.5 + 0.09 * i, send=0.15)
    sfx(audio.click(0.35, 1200, 5000, 0.004), fr(f), pan=-0.5 + 0.09 * i)
for k in range(4):  # 前奏的二四拍响指
    if k % 2 == 1:
        place(snap(0.9), fr(k * BEAT), pan=0.3, send=0.2)
place(audio.pad([58, 62, 65, 67], fr(120), 0.35, att=0.6), 0, send=0.4)  # C7sus 铺底

# 74—120：纸条一起提起来、旋进去
sfx(brush(fr(46), 1.4), fr(74), pan=-0.2)
sfx(audio.riser(fr(44), 0.6, 500, 6000), fr(76))
sfx(audio.whoosh(fr(30), 300, 4000, 0.5, 0.7), fr(92), pan=0.2)

# 120：落定
sfx(audio.boom(0.9, 110, 40, 0.8), fr(120))
place(audio.crash(0.55), fr(120), send=0.3)
for m in (57, 60, 64, 67, 72):
    place(vibe(m, 0.8, 2.0), fr(120), pan=-0.1, send=0.35)

# ───────── 节奏组：从 120 起 ─────────
for b in range(4, 40):
    f = b * BEAT
    if f >= 1150:
        break
    place(ride(0.9 if b % 2 == 0 else 0.75), fr(f), pan=0.35, send=0.08)
    if b % 2 == 1:
        place(ride(0.55), fr(f + SWING), pan=0.35)
        place(snap(0.85), fr(f), pan=-0.25, send=0.2)
        place(audio.hat(0.5, d=0.02), fr(f), pan=0.1)
    if b % 4 == 0:
        place(audio.kick(0.45), fr(f))

CH = {  # 和弦：根音（行走低音用）+ 钢琴的无根音位
    'F': ([41, 45, 48, 52], [57, 60, 64, 67]),
    'Gm': ([43, 46, 50, 41], [58, 62, 65, 69]),
    'C7': ([36, 40, 43, 46], [58, 62, 64, 69]),
}
PROG = ['F', 'F', 'Gm', 'Gm', 'C7', 'C7', 'F', 'F'] + ['F', 'F', 'Gm', 'C7'] * 4  # 每半小节一个
for h, name in enumerate(PROG):
    f0 = 120 + h * 60
    if f0 >= 1140:
        break
    walk, voicing = CH[name]
    for k in range(2):
        m = walk[(h % 2) * 2 + k]
        place(upright(m, 0.45, 1.0), fr(f0 + k * BEAT))
    # 钢琴 Charleston：第 1 拍短 + 第 2 拍后半（摇摆）
    if h % 2 == 0:
        place(audio.piano(voicing, 0.18, 0.55), fr(f0), pan=0.15, send=0.25)
    else:
        place(audio.piano(voicing, 0.3, 0.5), fr(f0 - BEAT + SWING), pan=0.15, send=0.25)

# ───────── 11 颗球 = 11 个颤音琴音 ─────────
for j, f in enumerate(ball_land):
    i = BALL_ORDER[j]
    place(vibe(PENTA[j], 0.9, 1.1), fr(f), pan=pan_of(i), send=0.3)
    sfx(audio.click(0.25, 600, 2400, 0.008), fr(f), pan=pan_of(i))  # 纸落在桌上的“啪”
# 背景纸滑进来
sfx(brush(fr(40), 0.7), fr(150), pan=0.4)
sfx(brush(fr(40), 0.7), fr(158), pan=-0.6)

# ───────── 手：送球、按下、抽走 ─────────
sfx(audio.whoosh(fr(34), 200, 2500, 0.35, 0.8), fr(190), pan=0.7)
sfx(audio.thock(53, 1.1), fr(240), pan=0.4, send=0.2)
place(vibe(84, 1.0, 1.6), fr(240), pan=0.45, send=0.4)
sfx(audio.whoosh(fr(28), 2500, 300, 0.35, 0.3), fr(252), pan=0.8)

# 指针转两圈：分针每过 30° 一声“咔哒”
def minute_angle(t):
    u = min(1, max(0, (t - 244) / 56))
    e = 4 * u ** 3 if u < 0.5 else 1 - (-2 * u + 2) ** 3 / 2
    return 720 * e


last = 0
for k in range(244 * 8, 300 * 8):
    t = k / 8
    a = minute_angle(t)
    if a >= last + 30:
        last += 30
        sfx(audio.click(0.5, 2500, 9000, 0.003), fr(t), pan=0.1)
place(audio.bell(88, 0.6, 1.2), fr(300), pan=0.0, send=0.5)

# ───────── 片名 ─────────
for i, f in enumerate(mid_land):
    sfx(audio.thock(72 + [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17][i], 0.55), fr(f), pan=0.2 + 0.05 * i)
MOD_NOTE = {0: 60, 2: 64, 3: 67, 4: 69, 5: 72}
for i, f in MOD_LAND.items():
    if i == 1:
        continue
    place(audio.piano([MOD_NOTE[i], MOD_NOTE[i] + 12], 0.4, 0.75), fr(f), pan=0.3, send=0.3)
    sfx(audio.click(0.3, 500, 2000, 0.01), fr(f), pan=0.3)
sfx(audio.whoosh(fr(26), 300, 5000, 0.4, 0.75), fr(364), pan=0.4)
# O：第 13 拍
sfx(audio.boom(1.0, 95, 38, 0.9), fr(390))
place(audio.crash(0.8), fr(390), send=0.35)
place(upright(29, 0.9, 1.3), fr(390))
place(audio.piano([53, 57, 60, 64, 67, 72], 1.2, 0.8), fr(390), pan=0.1, send=0.4)
for m in (69, 72, 76, 79):
    place(vibe(m, 0.6, 2.2), fr(392), pan=-0.2, send=0.45)

# 6 点的球掉下去
sfx(audio.glide(79, 55, fr(40), 0.5), fr(410), pan=-0.1, send=0.3)

audio.master(ROOT / 'public/017-mid-century-modern/music.wav')
