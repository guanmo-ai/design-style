"""
Design Style · 风格 017 · 中世纪现代 Mid-Century Modern —— 配乐与音效（第四版，纯代码合成，无外部音源）

主人反馈：第三版（片头爵士）太急、难听；“就要一个好听的 BGM，尽量和风格搭，但好听第一”。
第四版：放松的波萨诺瓦（Bossa Nova，1958—），和中世纪现代同一个年代，旋律能哼。
  144 BPM 的格子、半速的感觉（听起来是 72 BPM 的慢摇）· F 大调 · 每小节 100 帧，从第 25 帧起
  · 电钢琴（FM 的 Rhodes，带左右摆的颤音）按波萨的切分弹七和弦 / 九和弦
  · 颤音琴 + 长笛齐奏主旋律（长音为主）
  · 原声贝斯走“根音—五音”，第二拍后半提前进
  · 打击乐只有很轻的边击（3-2 克拉维）和很轻的沙锤；没有镲、没有军鼓
  · 换章：一串竖琴似的琶音往上 + 一层柔和的弦乐铺底；纸落下 = 落在和弦音上的木琴 / 颤音琴音（音乐的一部分）
和弦（每小节）：Fmaj9 | Gm9 C13 | Am7 D7 | Gm9 C13 | Fmaj9 F7 | B♭maj7 B♭m6 | Am7 D7 | Gm9 C13 | Fmaj9
900 帧 = 9 小节，余音折回第 0 帧（循环无缝）。

用法：python3 styles/017-mid-century-modern/audio/make_music.py
输出：public/017-mid-century-modern/music.wav（响度 −14 LUFS，峰值 < −1.5 dBFS）
"""
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'scripts'))
from lib.audio import AudioKit  # noqa: E402

DURATION = 900
audio = AudioKit(duration=DURATION / 60, seed=17, fps=60)
SR = audio.SR
BEAT, E8 = 25, 12.5
BAR0 = 25  # 第一小节从第 25 帧开始
fr, place, sfx, tt, midi, filt = audio.fr, audio.place, audio.sfx, audio.tt, audio.midi, audio.fft_filter
rng = np.random.default_rng(1958)


def env(t, att, dec):
    return np.minimum(1, t / att) * np.exp(-t / dec)


def release(t, d, rel):
    return np.where(t < d, 1.0, np.exp(-(t - d) / rel))


# ───────── 乐器（都是正弦 / FM，干净、暖） ─────────
def rhodes(ms, d=0.6, level=1.0):
    """电钢琴：FM（调制比 1，指数衰减的调制深度）+ 一点“叮”的音叉泛音；左右摆的颤音由声像完成"""
    t = tt(d + 0.6)
    y = np.zeros_like(t)
    for m in ms:
        f = midi(m)
        idx = 1.4 * np.exp(-t / 0.35) + 0.25
        y += np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t))
        y += 0.12 * np.sin(2 * np.pi * f * 14 * t) * np.exp(-t / 0.02)
    y *= np.minimum(1, t / 0.004) * np.exp(-t / 1.6) * release(t, d, 0.18)
    return y / np.sqrt(len(ms)) * level * 0.13


def vibe(m, d=0.8, level=1.0):
    f = midi(m)
    t = tt(d + 1.0)
    y = np.sin(2 * np.pi * f * t) + 0.18 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t / 0.18)
    trem = 1 - 0.22 * (0.5 - 0.5 * np.cos(2 * np.pi * 5.0 * t))
    return y * trem * np.minimum(1, t / 0.003) * np.exp(-t / 1.4) * release(t, d, 0.25) * level * 0.14


def flute(m, d=0.6, level=1.0):
    """长笛：基音 + 一点 2、3 次泛音，起音慢一点，进来后才有颤音"""
    t = tt(d + 0.15)
    f = midi(m) * (1 + 0.004 * np.sin(2 * np.pi * 5.0 * t) * np.clip((t - 0.15) / 0.2, 0, 1))
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) + 0.18 * np.sin(2 * ph) + 0.06 * np.sin(3 * ph)
    return y * np.minimum(1, t / 0.06) * release(t, d, 0.08) * level * 0.1


def bass(m, d=0.5, level=1.0):
    t = tt(d + 0.1)
    f = midi(m)
    y = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) * np.exp(-t / 0.15)
    return y * np.minimum(1, t / 0.006) * np.exp(-t / 0.7) * release(t, d, 0.05) * level * 0.33


def pad(ms, d, level=1.0):
    """柔和的弦乐铺底：每个音三根微失谐的正弦，慢起慢收"""
    t = tt(d)
    y = np.zeros_like(t)
    for m in ms:
        for det in (-0.004, 0, 0.004):
            y += np.sin(2 * np.pi * midi(m) * (1 + det) * t + rng.random() * 6.28)
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5
    return y * e / (3 * np.sqrt(len(ms))) * level * 0.06


def marimba(m, level=1.0):
    f = midi(m)
    t = tt(0.45)
    return (np.sin(2 * np.pi * f * t) * env(t, 0.002, 0.16) + 0.3 * np.sin(2 * np.pi * 3.9 * f * t) * env(t, 0.001, 0.03)) * level * 0.14


def harp(m, level=1.0):
    """竖琴似的拨弦：正弦 + 2 次泛音，短起长尾"""
    f = midi(m)
    t = tt(1.2)
    return (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t) * np.exp(-t / 0.2)) * env(t, 0.002, 0.5) * level * 0.1


def rim(level=1.0):
    """边击：有音高的短“嗒”（木头），不是噪声"""
    t = tt(0.06)
    return (np.sin(2 * np.pi * 1700 * t) * np.exp(-t / 0.006) + 0.6 * np.sin(2 * np.pi * 820 * t) * np.exp(-t / 0.012)) * level * 0.12


def shaker(level=1.0):
    t = tt(0.05)
    n = filt(rng.standard_normal(len(t)), lo=6500, hi=11000)
    return n / (np.abs(n).max() + 1e-9) * env(t, 0.004, 0.012) * level * 0.035


def soft_kick(level=1.0):
    t = tt(0.3)
    f = 48 + 40 * np.exp(-t / 0.04)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(t, 0.004, 0.11) * level * 0.4


# ───────── 和声 ─────────
# 每小节两个半小节（各 50 帧）：(贝斯根音, 五音, 电钢琴音位)
CH = {
    'Fmaj9': (41, 48, [57, 60, 64, 67]),
    'F7': (41, 48, [57, 60, 63, 67]),
    'Gm9': (43, 50, [58, 62, 65, 69]),
    'C13': (36, 43, [58, 62, 64, 69]),
    'Am7': (45, 52, [55, 60, 64, 67]),
    'D7': (38, 45, [54, 57, 60, 64]),
    'Bbmaj7': (46, 41, [57, 62, 65, 69]),
    'Bbm6': (46, 41, [56, 61, 62, 65]),
}
BARS = [('Fmaj9', 'Fmaj9'), ('Gm9', 'C13'), ('Am7', 'D7'), ('Gm9', 'C13'), ('Fmaj9', 'F7'),
        ('Bbmaj7', 'Bbm6'), ('Am7', 'D7'), ('Gm9', 'C13'), ('Fmaj9', 'Fmaj9')]


def chord_at(f):
    b = int((f - BAR0) // 100) % 9 if f >= BAR0 else 8
    half = int(((f - BAR0) % 100) // 50)
    return BARS[b][half]


def tones(name):
    """这个和弦的音（给木琴 / 颤音琴音效挑音用），从低到高"""
    v = CH[name][2]
    return sorted(set([m + 12 for m in v] + [m + 24 for m in v]))


# 主旋律（颤音琴 + 长笛）：(小节, 拍, 音, 拍数)
MELODY = [
    (0, 0, 69, 1.5), (0, 1.5, 72, 0.5), (0, 2, 76, 1.5), (0, 3.5, 74, 0.5),
    (1, 0, 72, 1.5), (1, 1.5, 70, 0.5), (1, 2, 69, 1), (1, 3, 67, 1),
    (2, 0, 72, 1.5), (2, 1.5, 76, 0.5), (2, 2, 79, 1.5), (2, 3.5, 78, 0.5),
    (3, 0, 77, 2), (3, 2, 76, 1), (3, 3, 74, 1),
    (4, 0, 72, 1.5), (4, 1.5, 69, 0.5), (4, 2, 72, 1), (4, 3, 75, 1),
    (5, 0, 74, 2), (5, 2, 73, 2),
    (6, 0, 72, 1.5), (6, 1.5, 76, 0.5), (6, 2, 74, 1), (6, 3, 72, 1),
    (7, 0, 70, 1), (7, 1, 69, 1), (7, 2, 67, 1), (7, 3, 64, 1),
    (8, 0, 65, 2.5), (8, 3, 67, 0.5), (8, 3.5, 69, 0.5),
]

# ───────── 编排 ─────────
for b in range(-1, 9):
    for half in range(2):
        f0 = BAR0 + b * 100 + half * 50
        name = BARS[b % 9][half]
        root, fifth, voicing = CH[name]
        # 贝斯：根音（1.5 拍）→ 五音（第二拍后半提前进）
        place(bass(root, fr(1.4 * BEAT), 1.0), fr(f0), pan=-0.05)
        place(bass(fifth, fr(0.45 * BEAT), 0.85), fr(f0 + 1.5 * BEAT), pan=-0.05)
        # 电钢琴：波萨的切分（第 1 拍、第 2 拍后半）
        place(rhodes(voicing, fr(0.9 * BEAT), 0.9), fr(f0), pan=-0.25, send=0.25)
        place(rhodes(voicing, fr(0.45 * BEAT), 0.7), fr(f0 + 1.5 * BEAT), pan=0.25, send=0.25)
        # 软底鼓跟贝斯
        place(soft_kick(0.8), fr(f0))
        place(soft_kick(0.5), fr(f0 + 1.5 * BEAT))
    # 3-2 克拉维的边击（两小节一轮，这里每小节用一半）+ 很轻的八分沙锤
    pat = [0, 3, 6] if b % 2 == 0 else [2, 4]
    for e in pat:
        place(rim(0.8), fr(BAR0 + b * 100 + e * E8), pan=0.35)
    for e in range(8):
        place(shaker(1.0 if e % 2 else 0.6), fr(BAR0 + b * 100 + e * E8), pan=0.4)

for bar, beat, m, d in MELODY:
    f = BAR0 + bar * 100 + beat * BEAT
    place(vibe(m, fr(d * BEAT), 0.9), fr(f), pan=-0.1, send=0.35)
    place(flute(m + 12, fr(d * BEAT), 0.55), fr(f), pan=0.15, send=0.4)

# ───────── 换章：竖琴琶音往上 + 弦乐铺底（落在新小节第一拍） ─────────
CHAPTERS = [125, 225, 325, 425, 525, 650]
for f in CHAPTERS:
    name = chord_at(f)
    ts = tones(name)
    for k, m in enumerate(ts[:7]):
        place(harp(m, 0.8), fr(f - 18 + k * 2.5), pan=-0.5 + 0.15 * k, send=0.4)
    place(pad(CH[name][2], fr(2.2 * BEAT * 2), 1.0), fr(f), send=0.5)

# ───────── 纸落下的声音 = 和弦里的音 ─────────
def pling(f, k, level=0.7, inst='marimba', pan=0.0):
    ts = tones(chord_at(f))
    m = ts[k % len(ts)]
    sig = marimba(m, level) if inst == 'marimba' else vibe(m, fr(0.3 * BEAT), level * 0.6)
    place(sig, fr(f), pan=pan, send=0.25)


for i in range(12):  # 开场：12 颗球
    pling(2 + 2.5 * i, i, 0.6, 'vibe', -0.6 + 0.1 * i)
for i, f in enumerate([22 + 2 * k for k in range(4)] + [30 + 2 * k for k in range(7)]):  # MID- / CENTURY
    pling(f, i, 0.45, pan=-0.4)
for k, f in enumerate([37.5, 43.75, 50, 56.25, 62.5, 75]):  # MODERN（O = 75）
    pling(f, k + 2, 0.8 if f < 75 else 1.0)
place(pad(CH['Fmaj9'][2], fr(1.6 * BEAT * 2), 0.8), fr(75), send=0.5)
for k in range(7):  # 01 手臂
    pling(131 + 1.6 * k, k, 0.5, pan=-0.5 + 0.15 * k)
for k in range(4):  # 年份：1955 / 1953 / 1956 / 1960 / 2026
    for base in (169, 283, 377, 477, 581):
        pling(base + 4 * k, k + 3, 0.55, pan=0.3)
for i in range(12):  # 02 钢丝
    pling(233 + 1.2 * i, i, 0.35, pan=-0.5 + 0.09 * i)
for j in range(14):  # 02 球
    pling(247 + 2.5 * j, j, 0.5, 'vibe', -0.6 + 0.18 * (j % 7))
pling(341, 0, 0.9)  # 03 唱片落定
for k in range(3):  # B O P
    pling(359 + 4 * k, k + 2, 0.7)
for k in range(6):  # 04 窗一盏盏亮
    pling(471 + 3.125 * k, k + 4, 0.5, 'vibe', 0.3 + 0.05 * k)
pling(539, 0, 0.9)  # 05 手机落定
for i in range(6):
    pling(565 + 1.5 * i, i + 2, 0.4, pan=-0.2 + 0.08 * i)
place(pad(CH[chord_at(600)][2], fr(1.6 * BEAT * 2), 0.9), fr(600), send=0.5)  # 按下播放键
pling(600, 4, 1.0, 'vibe')
for k, f in enumerate([675, 700, 725, 750, 775]):  # 五张规则卡
    pling(f, k + 3, 0.8)
for k in range(7):  # 片尾：卡片飞走，颤音琴往下
    pling(826 + 3 * k, 12 - k, 0.45, 'vibe', 0.5 - 0.15 * k)

audio.master(ROOT / 'public/017-mid-century-modern/music.wav')
