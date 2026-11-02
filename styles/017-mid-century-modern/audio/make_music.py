"""
Design Style · 风格 017 · 中世纪现代 Mid-Century Modern —— 配乐与音效（纯代码合成，无外部音源）

第二版（主人反馈“噪音太多”）：全片不用任何噪声做的声音——没有镲、刷子、响指、嗖嗖声和上扬噪声。
只用有音高的干净音色：原声贝斯（正弦泛音 + 起音时音高往下滑一点）、钢琴、颤音琴、木琴，和一个纯正弦的软底鼓。
换章 = 颤音琴往上刷一串（像竖琴滑奏）；每个落点 = 一个调好音的木琴 / 颤音琴音。

144 BPM（1 拍 = 25 帧）· F 大调 · 轻快的摇摆三重奏（贝斯 + 钢琴 + 颤音琴）
  0—96     开场搭海报：钟心落下 = 低音 F；12 颗球 = 颤音琴一口气往上刷（F 大调五声音阶）；
           MID- / CENTURY = 木琴小音阶；MODERN 五个字 = 钢琴五个和弦往上走；O = 全队落在 F6/9（第 3 拍）
  96—114   蓝纸滑进来：颤音琴滑奏
  114—178  01 Bass《金臂人》：贝斯换成 F A♭ B♭ 的固定音型，手臂七节 = 木琴七声往上爬，1955 = 四个钢琴重和弦
  196—900  02 挂衣架 · 03 唱片 · 04 建筑 · 05 今天 · 五条规则：每一块纸落下都对一个调好音的木琴 / 颤音琴 / 钢琴音
  850      最后一个音的余音折回第 0 帧（循环无缝）
和弦（每半小节 50 帧）：F6/9 F6/9 | D♭9 C13 …

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

DURATION = 850
audio = AudioKit(duration=DURATION / 60, seed=17, fps=60)
SR = audio.SR
BEAT = 25
SWING = 16.7  # 摇摆的后半拍：一拍的 2/3 处
fr, place, tt, midi = audio.fr, audio.place, audio.tt, audio.midi


def env(t, att, dec):
    return np.minimum(1, t / att) * np.exp(-t / dec)


# ───────── 干净的乐器（全部是正弦泛音，没有噪声） ─────────
def bass(m, d=0.42, level=1.0):
    """原声贝斯：基音 + 2、3、4 次泛音，高泛音先衰减；起音时音高从 +0.25 半音滑下来（手指拨弦的“弹”）"""
    t = tt(d)
    f = midi(m) * 2 ** (0.25 * np.exp(-t / 0.02) / 12)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = (np.sin(ph) + 0.5 * np.sin(2 * ph) * np.exp(-t / 0.18) + 0.22 * np.sin(3 * ph) * np.exp(-t / 0.09)
         + 0.08 * np.sin(4 * ph) * np.exp(-t / 0.05))
    y *= np.minimum(1, t / 0.004) * np.exp(-t / 0.5) * np.minimum(1, (d - t) / 0.03)
    return y * level * 0.32


def vibe(m, level=1.0, dec=1.0):
    """颤音琴：基音 + 4 倍泛音（金属片），5.5 Hz 的颤音"""
    f = midi(m)
    t = tt(dec * 2.5)
    y = np.sin(2 * np.pi * f * t) + 0.2 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t / 0.2)
    trem = 1 - 0.25 * (0.5 - 0.5 * np.cos(2 * np.pi * 5.5 * t))
    return y * trem * env(t, 0.003, dec) * level * 0.15


def marimba(m, level=1.0):
    """木琴：基音 + 3.9 倍泛音（木条），短"""
    f = midi(m)
    t = tt(0.45)
    y = np.sin(2 * np.pi * f * t) * env(t, 0.002, 0.16) + 0.35 * np.sin(2 * np.pi * 3.9 * f * t) * env(t, 0.001, 0.03)
    return y * level * 0.2


def piano(ms, d=0.4, level=1.0):
    return audio.piano(ms, d, level)


def soft_kick(level=1.0):
    """纯正弦的软底鼓：90 → 48 Hz，没有起音的“嗒”"""
    t = tt(0.3)
    f = 48 + 42 * np.exp(-t / 0.04)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(t, 0.003, 0.12)
    return y * level * 0.5


def gliss(f0, notes, step, level=0.6, pan=0.4):
    """颤音琴滑奏：notes 依次相隔 step 帧"""
    for k, m in enumerate(notes):
        place(vibe(m, level * (0.6 + 0.4 * k / len(notes)), 0.6), fr(f0 + k * step), pan=pan - 0.08 * k, send=0.3)


# ───────── 画面上的时刻（与 video/film.tsx 一致） ─────────
BALL = [2 + 2.5 * i for i in range(12)]
MID = [22 + 2 * i for i in range(4)]
CENT = [30 + 2 * i for i in range(7)]
MOD = [37.5, 43.75, 50, 56.25, 62.5]
BIG = 75
SHEET1, BASS, SHEET2 = 96, 114, 196
ARM = [BASS + 6 + 1.6 * k for k in range(7)]
BARS = [131, 137.25, 143.5, 149.75, 156]
YEAR = [158 + 4 * i for i in range(4)]


def pan_clock(i):
    return 0.6 * math.cos(math.radians(i * 30 - 90))


# ───────── 三重奏的底：行走贝斯 + 钢琴 Charleston + 软底鼓（1、3 拍） ─────────
CH = {
    'F': ([41, 45, 48, 50], [57, 60, 62, 67]),  # F6/9（钢琴：A C D G）
    'Db9': ([37, 41, 44, 47], [53, 59, 60, 65]),  # D♭9（无根：F B C F）
    'C13': ([36, 40, 43, 46], [52, 58, 62, 69]),  # C13（E B♭ D A）
}
PROG = ['F', 'F', 'Db9', 'C13'] * 5
for h, name in enumerate(PROG):
    f0 = h * 50
    if f0 >= DURATION:
        break
    walk, voicing = CH[name]
    in_bass = BASS <= f0 < SHEET2
    for k in range(2):
        m = walk[(h % 2) * 2 + k] if not in_bass else [41, 44, 46, 44][(h * 2 + k) % 4]
        place(bass(m, 0.4, 1.0), fr(f0 + k * BEAT), pan=-0.05)
    if not in_bass:
        place(piano(voicing, 0.22, 0.55), fr(f0 + (0 if h % 2 == 0 else -BEAT + SWING)), pan=0.2, send=0.2)
    place(soft_kick(0.45), fr(f0))

# ───────── 开场：搭海报 ─────────
place(bass(29, 0.9, 1.3), fr(-4))  # 钟心落下：低音 F
PENTA = [65, 67, 69, 72, 74, 77, 79, 81, 84, 86, 89, 91]
for i, f in enumerate(BALL):  # 12 颗球 = 颤音琴往上刷
    place(vibe(PENTA[i], 0.7, 0.7), fr(f), pan=pan_clock(i), send=0.25)
place(marimba(84, 0.6), fr(14))  # 钟心点
SCALE = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17]
for i, f in enumerate(MID + CENT):  # 木琴小音阶
    place(marimba(72 + SCALE[i], 0.55), fr(f), pan=-0.4 + 0.05 * i)
MOD_CH = [[53, 57, 60], [55, 58, 62], [57, 60, 64], [58, 62, 65], [60, 64, 67]]
for f, ms in zip(MOD, MOD_CH):  # MODERN：钢琴往上走
    place(piano(ms + [ms[0] + 12], 0.35, 0.75), fr(f), pan=0.1, send=0.2)
# O：第 3 拍，全队落在 F6/9
place(bass(29, 1.0, 1.4), fr(BIG))
place(soft_kick(1.0), fr(BIG))
place(piano([41, 53, 57, 60, 62, 67, 72], 1.2, 0.9), fr(BIG), send=0.35)
for m in (69, 74, 79, 84):
    place(vibe(m, 0.55, 1.6), fr(BIG + 2), pan=-0.2, send=0.4)

# ───────── 换章 → 01 Bass ─────────
gliss(SHEET1, [65, 69, 72, 77, 81, 84], 3)
for k, f in enumerate(ARM):  # 手臂七节往上爬
    place(marimba(53 + [0, 3, 5, 6, 7, 10, 12][k], 0.75), fr(f), pan=-0.5 + 0.15 * k)
place(piano([41, 53, 59, 60, 65], 0.5, 0.8), fr(ARM[0]), send=0.25)
for f in BARS:  # 四周纸条：低音木琴
    place(marimba(48, 0.5), fr(f), pan=0.3)
for k, f in enumerate(YEAR):  # 1955：四个钢琴重和弦
    ms = [[52, 58, 62], [53, 59, 63], [52, 58, 62], [48, 52, 58, 62]][k]
    place(piano(ms + [ms[-1] + 12], 0.4, 0.8), fr(f), pan=0.15, send=0.25)
gliss(SHEET2, [65, 69, 72, 77, 81, 84], 3)
place(piano([41, 53, 57, 60, 62, 67], 0.9, 0.7), fr(SHEET2 + 18), send=0.3)

# ───────── 02 挂衣架 ─────────
for i in range(12):  # 纸条翻回墨色、落成钢丝折线
    place(marimba(60 + [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26][i], 0.45), fr(222 + 1.2 * i), pan=-0.5 + 0.09 * i)
for j in range(14):  # 14 颗球
    place(vibe([77, 74, 72, 69, 67, 65, 69, 72, 74, 77, 79, 81, 84, 86][j], 0.6, 0.7), fr(236 + 2.5 * j), pan=-0.6 + 0.09 * (j % 7) * 2, send=0.25)
for k in range(4):  # 1953
    place(piano([[52, 57, 60], [53, 57, 60], [55, 58, 62], [53, 57, 60, 65]][k], 0.35, 0.7), fr(272 + 4 * k), pan=0.2, send=0.2)

# ───────── 03 唱片 ─────────
gliss(296, [65, 69, 72, 77, 81, 84], 3)
for k, m in enumerate([84, 81, 77, 72, 69, 65, 60]):  # 球越飞越大：往下滑
    place(vibe(m, 0.4, 0.5), fr(292 + 5 * k), pan=0.1, send=0.3)
place(bass(29, 0.8, 1.2), fr(330))
place(soft_kick(0.8), fr(330))
place(piano([51, 55, 58, 62], 0.5, 0.7), fr(330), send=0.25)  # E♭maj7：蓝调一点
for k in range(3):  # B · O · P
    place(piano([[48, 51, 55], [51, 55, 58], [53, 56, 60]][k], 0.3, 0.85), fr(348 + 4 * k), pan=-0.3, send=0.2)
    place(soft_kick(0.4), fr(348 + 4 * k))
place(vibe(86, 0.6, 0.8), fr(362), pan=-0.5, send=0.4)  # 粉圆叠印
for k in range(4):  # 1956
    place(piano([[52, 57, 60], [53, 57, 60], [55, 58, 62], [55, 60, 64]][k], 0.35, 0.7), fr(366 + 4 * k), pan=0.3, send=0.2)

# ───────── 04 建筑 ─────────
gliss(396, [65, 69, 72, 77, 81, 84], 3)
place(bass(34, 0.6, 1.0), fr(416))
place(bass(29, 0.6, 1.0), fr(422))
for m in (69, 72, 76, 81):  # 落日落定
    place(vibe(m, 0.45, 1.4), fr(430), pan=-0.4, send=0.4)
for k, f in enumerate([446, 448, 452, 456]):  # 柱、楼板、盒子、屋顶
    place(marimba(48 + [0, 5, 7, 12][k], 0.6), fr(f), pan=0.4)
for k in range(6):  # 窗一盏盏亮
    place(vibe(84 + [0, 2, 4, 7, 9, 12][k], 0.45, 0.6), fr(460 + 3.125 * k), pan=0.3 + 0.05 * k, send=0.35)
for k in range(4):  # 1960
    place(piano([[50, 57, 60], [52, 57, 60], [53, 57, 62], [52, 57, 60, 64]][k], 0.35, 0.7), fr(466 + 4 * k), pan=-0.4, send=0.2)
for f, m in ((476, 96), (482, 93)):
    place(vibe(m, 0.3, 0.6), fr(f), pan=0.6, send=0.5)

# ───────── 05 今天 ─────────
gliss(496, [65, 69, 72, 77, 81, 84], 3)
place(bass(29, 0.7, 1.2), fr(528))
place(soft_kick(0.8), fr(528))
for k, f in enumerate([536, 542, 548]):  # 屏幕、封面、小唱片
    place(marimba(65 + [0, 4, 7][k], 0.55), fr(f), pan=0.1)
for i in range(6):  # ATOMIC
    place(marimba(72 + [0, 2, 4, 7, 9, 12][i], 0.45), fr(554 + 1.5 * i), pan=-0.2 + 0.08 * i)
for k in range(16):  # 波形条立起来
    place(vibe(89 + (k % 5) * 2, 0.18, 0.3), fr(560 + 1.5 * k), pan=-0.3 + 0.04 * k)
place(marimba(77, 0.6), fr(570))
place(soft_kick(1.0), fr(598))  # 手按下播放键
place(piano([53, 57, 60, 62, 67, 72], 0.8, 0.8), fr(598), send=0.35)
for k in range(4):  # 2026
    place(piano([[57, 60, 64], [58, 62, 65], [57, 60, 64], [60, 64, 67, 72]][k], 0.35, 0.7), fr(574 + 4 * k), pan=-0.3, send=0.2)

# ───────── 五条规则 → 回到第 0 帧 ─────────
gliss(616, [65, 69, 72, 77, 81, 84], 3)
RULE_CH = [[53, 57, 60, 64], [55, 58, 62, 65], [57, 60, 64, 67], [58, 62, 65, 69], [60, 64, 67, 72]]
for k in range(5):
    f = 644 + 18.75 * k
    place(piano(RULE_CH[k], 0.5, 0.8), fr(f), send=0.3)
    place(soft_kick(0.7), fr(f))
    place(bass([41, 43, 45, 46, 48][k], 0.4, 1.0), fr(f))
for k, m in enumerate([84, 81, 77, 72, 69]):  # 卡片飞走
    place(vibe(m, 0.4, 0.5), fr(782 + 3 * k), pan=-0.4 + 0.2 * k, send=0.35)

audio.master(ROOT / 'public/017-mid-century-modern/music.wav')
