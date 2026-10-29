"""019 低多边形 · 配乐第三版：电子 future bass（D 大调，120 BPM，20 秒，不循环）。
python3 audio/make_music.py <out.wav>

第二版的“管弦乐”是合成出来的，弦乐和人声一听就假。这一版换成本来就是合成器的音色：
超锯齿和弦 + 侧链抽吸、亚低音、拨弦、钟琴、“人声切片”（共振峰合成）、电子鼓。

小节线从 0.5 秒开始（开头半拍是弱起），这样第 2 章“砸下来”的 4.5 秒正好是一个强拍上的 drop。
  弱起 + 1—2 小节   山谷：拨弦分解和弦 + 钟琴主题，鼓只有一半；第 2 小节军鼓滚奏、滤波打开、4.25 秒空一拍
  3—4  （4.5—8.5）  灯塔：drop——四踩、拍手、侧链抽吸的超锯齿和弦、人声切片主旋律；三角形砸下来是调过音的“嗒”
  8.0 换章            鼓全停半拍，面飞回来是一串亮晶晶的钟琴
  5    （8.5—10.5）  小星球：半速；9.75 / 10.25 两次减面——整条音乐跟着“降采样”（面越少，声音越糙），再弹回来
  6—7  （10.5—14.5） App：弹跳的贝斯和反拍和弦，天气卡片一格格弹出是拨弦
  8    （15.0 起）    夜：鼓和贝斯全停，只剩铺底、人声“呜”和钟琴，三档颜色三个音
  9    （16.5—18.5） 重新蓄力：底鼓回来、滚奏、上升音；17.4 山谷翻回纸
  10   （18.5—20）   片名升起，落在主和弦 D 上（全片第一次回到主和弦），一记冲击后自然收掉；不接回开头
"""
import math
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..', '..')
sys.path.insert(0, os.path.join(ROOT, 'scripts', 'lib'))
sys.path.insert(0, os.path.join(HERE, '..', 'video'))
from audio import AudioKit  # noqa: E402
from audio.orchestra import Orchestra  # noqa: E402
import ch1_valley as C1  # noqa: E402
import ch2_lighthouse as C2  # noqa: E402


class Kit(AudioKit, Orchestra):
    pass


A = Kit(duration=20.0, seed=19, fps=30.0, tail=2.0)
SR = A.SR
BEAT = 0.5
b = lambda bar, beat=0.0: 0.5 + (bar - 1) * 2.0 + beat * BEAT   # 第几小节第几拍 → 秒（小节线从 0.5 秒开始）
CHORDS = A.MUS * 0                                                # 和弦单独一条总线，最后乘侧链抽吸
PUMP = np.ones(A.N)

# 和弦（亚低音根音, 和弦音）
G, Am, Fm, Bm, Em, A7, Asus, D = ((31, [55, 59, 62, 66, 69]), (33, [57, 61, 64, 66, 69]), (30, [54, 57, 61, 64, 69]),
                                   (35, [59, 62, 66, 69, 74]), (28, [55, 59, 62, 64, 67]), (33, [57, 61, 64, 67, 69]),
                                   (33, [57, 62, 64, 69, 71]), (38, [62, 66, 69, 74, 76]))
BARS = {1: G, 2: Am, 3: G, 4: Am, 5: Fm, 6: Bm, 7: Em, 8: G, 9: Asus, 10: D}


# ---------------- 音色 ----------------
def supersaw(ms, d, level=1.0, cut=4000, att=0.008, rel=0.3, voices=7, spread=0.16):
    t = A.tt(d + rel * 4)
    y = np.zeros_like(t)
    for m in ms:
        for v in range(voices):
            det = spread * (v - (voices - 1) / 2) / ((voices - 1) / 2)
            ph = (A.midi(m + det) * t + A.rng.random()) % 1.0
            y += 2 * ph - 1
    y = A.fft_filter(y, lo=150, hi=cut)
    e = np.minimum(1, t / att) * np.where(t < d, 1.0, np.exp(-(t - d) / rel))
    return y * e * level * 0.26 / math.sqrt(len(ms) * voices)


def chord(ms, t0, d, level=1.0, cut=4000, width=0.65, **kw):
    """超锯齿和弦：左右各渲一遍（相位不同）= 宽"""
    for p in (-width, width):
        A.place(supersaw(ms, d, level, cut, **kw), t0, 1.0, pan=p, send=0.25, bus=CHORDS)


def pluck(m, d=0.7, level=1.0, tau=0.32):
    """拨弦：加法合成，高次谐波掉得快（像滤波器关上）"""
    t = A.tt(d)
    f = A.midi(m)
    y = np.zeros_like(t)
    for n in range(1, 18):
        if f * n > 15000:
            break
        y += np.sin(2 * np.pi * f * n * t + n * 0.7) / n * np.exp(-t * n ** 0.9 / tau)
    return y * np.minimum(1, t / 0.002) * np.exp(-t / (tau * 2)) * level * 0.22


def crystal(m, level=1.0, dec=0.5):
    """玻璃钟琴：FM，调制比 7，像小星球上的面一闪一闪"""
    t = A.tt(dec * 3)
    f = A.midi(m)
    idx = 2.2 * np.exp(-t / 0.05)
    return np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * 7.0 * f * t)) * np.minimum(1, t / 0.001) * np.exp(-t / dec) * level * 0.12


VOWEL = {'a': ((850, 1.0, 110), (1250, 0.55, 120), (3000, 0.22, 200)),
         'o': ((560, 1.0, 90), (950, 0.5, 100), (2900, 0.12, 200)),
         'e': ((470, 1.0, 80), (2150, 0.45, 150), (2900, 0.25, 200)),
         'u': ((380, 1.0, 70), (800, 0.3, 90), (2700, 0.06, 200))}


def vox(m, d, vowel='a', level=1.0, slide=-1.5, att=0.012, rel=0.06, vib=0.0):
    """人声切片：声门脉冲的谐波按元音共振峰加权（共振峰抬高 15%，更“可爱”）；起音从下面滑上来"""
    t = A.tt(d + rel * 4)
    m_t = m + slide * np.exp(-t / 0.03) + vib * 0.25 * np.sin(2 * np.pi * 5.5 * t) * np.minimum(1, t / 0.3)
    f_t = A.midi(m_t)
    ph = 2 * np.pi * np.cumsum(f_t) / SR
    f0 = A.midi(m)
    y = np.zeros_like(t)
    for n in range(1, 40):
        fn = f0 * n
        if fn > 9000:
            break
        a = sum(g / (1 + ((fn - F * 1.15) / bw) ** 2) for F, g, bw in VOWEL[vowel]) / n ** 0.3
        y += a * np.sin(n * ph)
    y += A.fft_filter(A.rng.standard_normal(len(t)), lo=4000, hi=9000) * 0.03    # 一点气声
    e = np.minimum(1, t / att) * np.where(t < d, 1.0, np.exp(-(t - d) / rel))
    return y * e * level * 0.13


def sub(m, d, level=1.0, rel=0.08):
    """亚低音 + 中低音（手机喇叭放不出亚低音，靠中低音的谐波听到贝斯）"""
    t = A.tt(d + rel * 4)
    f = A.midi(m)
    y = np.sin(2 * np.pi * f * t) + 0.35 * A.fft_filter(A.saw(np.full(len(t), f * 2)), hi=700)
    e = np.minimum(1, t / 0.005) * np.where(t < d, 1.0, np.exp(-(t - d) / rel))
    return np.tanh(y * 1.4) * e * level * 0.2


def kick(level=1.0):
    t = A.tt(0.36)
    f = 46 + 190 * np.exp(-t / 0.022)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.2)
    y = np.tanh(y * 1.8) / np.tanh(1.8)
    n = int(0.004 * SR)
    y[:n] += A.fft_filter(A.rng.standard_normal(n), lo=2500) * 0.4 * np.linspace(1, 0, n)
    return y * level * 0.6


def snare(level=1.0):
    t = A.tt(0.3)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.05)
    noise = A.fft_filter(A.rng.standard_normal(len(t)), lo=1400, hi=10000) * np.exp(-t / 0.11)
    return (tone * 0.5 + noise * 0.7) * level * 0.2


def zap(level=1.0):
    """减面的“咔嚓”：一声往下扫的方波"""
    t = A.tt(0.14)
    f = 2400 * np.exp(-t / 0.03) + 120
    return np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-t / 0.05) * level * 0.08


def rev_crash(d=1.0, level=1.0):
    return A.crash(level)[:int(d * SR)][::-1] * np.linspace(0, 1, int(d * SR)) ** 1.5


def paper(level=1.0):
    t = A.tt(0.05)
    return A._bp(A.rng.standard_normal(len(t)), 1500, 5000) * np.exp(-t / 0.012) * level * 0.1


def pump_at(tt, depth=0.8, d=0.42):
    """侧链：底鼓一响，和弦先压下去，再在 d 秒里抽回来"""
    i, n = int(tt * SR), int(d * SR)
    if i >= A.N:
        return
    n = min(n, A.N - i)
    x = np.arange(n) / n
    PUMP[i:i + n] = np.minimum(PUMP[i:i + n], 1 - depth * (1 - x ** 0.6))


def hit_kick(tt, level=1.0, depth=0.8):
    A.place(kick(level), tt, 0.95)
    pump_at(tt, depth)
    A.sidechain(tt * A.fps, 0.2, 0.75)


def hats(t0, t1, level=1.0, sixteenth=True, swing=0.018):
    step = BEAT / (4 if sixteenth else 2)
    k = 0
    while t0 + k * step < t1 - 1e-6:
        tt = t0 + k * step + (swing if k % 2 else 0)
        vel = (1.0, 0.45, 0.7, 0.45)[k % 4] if sixteenth else (0.5, 1.0)[k % 2]
        A.place(A.hat(vel * level), tt, 1.0, pan=0.25)
        k += 1


def roll(t0, t1, level=1.0):
    """军鼓滚奏：越来越密、越来越响"""
    tt = t0
    while tt < t1:
        e = (tt - t0) / (t1 - t0)
        A.place(snare(level * (0.3 + 0.8 * e)), tt, 1.0, pan=0.05)
        tt += BEAT / (2 if e < 0.4 else 4 if e < 0.75 else 8)


# ---------------- 弱起 + 1—2 小节：山谷 ----------------
for tt, m in ((0.0, 81), (0.25, 83)):
    A.place(A.bell(m, 0.6, 0.8), tt, 1.0, pan=0.2, send=0.4)
A.place(A.swell([62, 66, 69], 0.5, 0.6), 0.0, 1.0)
for bar in (1, 2):
    lo, ms = BARS[bar]
    cut = 900 if bar == 1 else None
    if bar == 1:
        chord(ms[:4], b(1), 2.0, 0.55, cut=900)
    else:                                                     # 第 2 小节：滤波一点点打开
        for k in range(4):
            chord(ms[:4], b(2, k), 0.5, 0.55 + 0.1 * k, cut=1200 * 1.8 ** k, rel=0.05)
    for k in range(8):                                        # 拨弦分解和弦
        m = ms[[0, 2, 3, 4, 3, 2, 1, 2][k]] + 12
        A.place(pluck(m, 0.6, 0.8), b(bar, k * 0.5), 1.0, pan=(-0.3, 0.3)[k % 2], send=0.3)
    A.place(sub(lo + 12, 1.8, 0.45), b(bar), 1.0)
for bar, notes in {1: [(0, 86), (0.5, 83), (1, 78), (1.5, 81), (2.5, 83), (3, 86)], 2: [(0, 85), (1, 83), (1.5, 81), (2, 76)]}.items():
    for beat, m in notes:
        A.place(A.bell(m, 0.75, 0.9), b(bar, beat), 1.0, pan=0.15, send=0.45)
for k in range(4):                                            # 鼓：一半
    hit_kick(b(1, k * 2), 0.6, 0.35)
hats(b(1), b(2, 2), 0.6, sixteenth=False)
hit_kick(b(2), 0.7, 0.4)
hit_kick(b(2, 1), 0.7, 0.4)
roll(b(2, 1.5), b(2, 3.5), 0.8)
A.place(A.riser(2.0, 0.9), b(2, 3.5) - 2.0, 1.0)
A.place(vox(81, 0.45, 'a', 0.7, slide=-5), b(2, 3), 1.0, send=0.4)   # 空拍前一声“啊”往上滑
A.place(rev_crash(0.75, 1.0), b(3) - 0.75, 1.0, pan=-0.1)

# ---------------- 3—4 小节：drop（灯塔） ----------------
A.place(A.crash(1.2), b(3), 1.0, send=0.3)
A.place(A.boom(0.6), b(3), 1.0)
for bar in (3, 4):
    lo, ms = BARS[bar]
    beats = 4 if bar == 3 else 3
    chord(ms, b(bar), beats * BEAT, 1.0, cut=6000)
    chord([m + 12 for m in ms[2:4]], b(bar), beats * BEAT, 0.35, cut=8000, width=0.9)
    for k in range(beats):
        hit_kick(b(bar, k), 1.0)
        A.place(sub(lo, BEAT * 0.9, 0.9), b(bar, k), 1.0)
        A.place(sub(lo + 12, BEAT * 0.4, 0.4), b(bar, k + 0.5), 1.0)
        if k % 2:
            A.place(A.clap(1.1), b(bar, k), 1.0, send=0.25)
            A.place(snare(0.6), b(bar, k), 1.0)
        A.place(A.hat(0.9, open_=True), b(bar, k + 0.5), 1.0, pan=-0.25)
    hats(b(bar), b(bar, beats), 0.8)
LEAD = {3: [(0, 78, 0.5, 'a'), (0.75, 81, 0.25, 'o'), (1.5, 83, 0.5, 'a'), (2, 81, 0.5, 'e'), (2.75, 78, 0.25, 'a'), (3, 74, 0.75, 'o')],
        4: [(0, 76, 0.5, 'a'), (0.5, 78, 0.5, 'o'), (1, 81, 0.5, 'a'), (1.5, 85, 0.5, 'e'), (2, 83, 0.25, 'a'), (2.25, 81, 0.25, 'o'), (2.5, 76, 0.5, 'a')]}
for bar, notes in LEAD.items():
    for beat, m, dur, v in notes:
        A.place(vox(m, dur * BEAT * 0.9, v, 1.0), b(bar, beat), 1.0, pan=0.05, send=0.35)
        A.place(A.bell(m + 12, 0.35, 0.5), b(bar, beat), 1.0, pan=-0.2, send=0.4)
# 三角形砸下来：调过音的“嗒”（量化到十六分音符，用当前和弦的音）
seen = set()
for (_, _, d, *_r) in C2.TRIS:
    tt = 4.5 + d + 0.42 * 0.62
    q = round(tt / 0.0625)
    if q in seen or not 4.5 <= tt < 8.0:
        continue
    seen.add(q)
    ms = BARS[3 if tt < b(4) else 4][1]
    A.sfx(A.thock(ms[q % 5] + 12, 0.55), q * 0.0625, pan=A.rng.uniform(-0.5, 0.5), send=0.15)
for n in range(6):                                            # 灯塔一节节弹上去
    A.sfx(crystal(81 + [0, 2, 4, 7, 9, 12][n], 0.8), 4.5 + 1.15 + n * 0.06 + 0.12, 1.0, send=0.4)

# ---------------- 8.0 换章：鼓停半拍，面飞回来 ----------------
A.place(A.whoosh(0.5, 600, 8000, 0.6), 7.8, 1.0, send=0.3)
for k in range(24):
    A.sfx(crystal(86 + [0, 2, 4, 7, 9][k % 5] + (12 if k % 3 == 0 else 0), 0.5, 0.25), 8.0 + 0.04 + k * 0.02,
          1.0, pan=A.rng.uniform(-0.7, 0.7), send=0.5)

# ---------------- 5 小节：小星球（半速 + 两次“降采样”） ----------------
lo, ms = BARS[5]
chord(ms, b(5), 4 * BEAT, 0.85, cut=5000)
A.place(A.crash(0.8), b(5), 1.0, send=0.3)
for k in (0, 2):
    hit_kick(b(5, k), 1.0)
    A.place(sub(lo, BEAT * 1.8, 0.9), b(5, k), 1.0)
for k in (1, 3):
    A.place(snare(1.0), b(5, k), 1.0, send=0.2)
    A.place(A.clap(0.9), b(5, k), 1.0, send=0.25)
hats(b(5), b(6), 0.7, sixteenth=False)
for k in range(16):                                           # 玻璃钟琴十六分音符
    m = ms[[1, 2, 3, 4][k % 4]] + 12 + (12 if k % 8 >= 4 else 0)
    A.place(crystal(m, 0.55), b(5, k * 0.25), 1.0, pan=(-0.4, 0.4)[k % 2], send=0.4)
GLITCH = (b(5, 2.5), b(5, 3.5))                               # 9.75 / 10.25：1280 → 320 → 80
for i, tt in enumerate(GLITCH):
    A.sfx(zap(1.0 + i * 0.4), tt, 1.0, send=0.1)
    A.sfx(A.boom(0.45 + 0.2 * i, 160, 40, 0.5), tt, 1.0)
    for k in range(8):                                        # 和弦按三十二分音符切碎
        A.place(supersaw(ms[:4], 0.04, 0.8, cut=3000 - 1200 * i, rel=0.01), tt + k * BEAT / 8, 1.0, pan=(-0.5, 0.5)[k % 2], bus=CHORDS)

# ---------------- 6—7 小节：App（弹跳） ----------------
for bar in (6, 7):
    lo, ms = BARS[bar]
    halves = [(0, 4, BARS[bar])] if bar == 6 else [(0, 2, Em), (2, 4, A7)]
    for k0, k1, (lo, ms) in halves:
        for k in range(k0, k1):
            A.place(sub(lo, BEAT * 0.35, 0.8), b(bar, k), 1.0)
            A.place(sub(lo + 12, BEAT * 0.3, 0.6), b(bar, k + 0.5), 1.0)
            chord(ms[:4], b(bar, k + 0.5), BEAT * 0.3, 0.75, cut=5000, rel=0.08, width=0.4)   # 反拍和弦
    for k in range(4):
        hit_kick(b(bar, k), 0.9, 0.5)
        if k % 2:
            A.place(A.clap(1.0), b(bar, k), 1.0, send=0.25)
    A.place(kick(0.5), b(bar, 1.75), 0.9)
    hats(b(bar), b(bar, 4), 0.7)
for bar, notes in {6: [(0, 74), (0.5, 78), (1, 81), (1.75, 78), (2, 83), (3, 81)], 7: [(0, 79), (0.5, 78), (1, 76), (2, 76), (2.5, 78), (3, 81)]}.items():
    for beat, m in notes:
        A.place(pluck(m + 12, 0.5, 0.8, tau=0.22), b(bar, beat), 1.0, pan=0.2, send=0.35)
        A.place(A.bell(m + 12, 0.3, 0.4), b(bar, beat), 1.0, pan=-0.2, send=0.4)
A.place(A.whoosh(0.6, 400, 6000, 0.6), 11.0, 1.0, send=0.3)     # 星球缩成图标
for k in range(5):                                              # 天气卡片一格格弹出
    A.sfx(pluck(86 + [0, 2, 4, 7, 9][k], 0.4, 0.9, tau=0.12), 11.6 + 0.55 + k * 0.08 + 0.08, 1.0, pan=-0.4 + k * 0.2, send=0.3)

# ---------------- 8 小节：夜（15.0 起鼓停） ----------------
lo, ms = BARS[8]
hit_kick(b(8), 0.9, 0.5)
A.place(sub(lo, BEAT * 0.9, 0.8), b(8), 1.0)
chord(ms[:4], b(8), BEAT, 0.7, cut=4000)
A.place(A.boom(0.4, 90, 30, 1.2), 15.0, 1.0)
A.place(A.pad([m - 12 for m in ms[:4]] + ms[2:4], 3.4, 1.6, att=0.25, rel=0.8), 15.0, 1.0, send=0.5)
A.place(vox(74, 1.6, 'u', 0.45, slide=0, att=0.3, rel=0.5, vib=1.0), 15.05, 1.0, pan=-0.2, send=0.6)
A.place(vox(78, 1.6, 'u', 0.35, slide=0, att=0.3, rel=0.5, vib=1.0), 15.05, 1.0, pan=0.2, send=0.6)
for beat, m in ((1, 78), (2, 81), (2.5, 83), (3, 81)):
    A.place(A.bell(m, 0.6, 1.1), b(8, beat), 1.0, pan=0.1, send=0.6)
for k, m in enumerate((90, 93, 88, 95, 90, 86)):                # 星星一闪一闪
    A.place(crystal(m, 0.25, 0.4), 15.2 + k * 0.23, 1.0, pan=0.6 * math.sin(k * 2.1), send=0.6)
for k in range(3):                                              # 三档颜色：亮 / 中 / 暗
    A.sfx(A.bell([88, 85, 81][k], 0.7, 0.8), 15.0 + 0.8 + k * 0.12 + 0.08, 1.0, send=0.5)

# ---------------- 9 小节：蓄力 + 17.4 翻回纸 ----------------
lo, ms = BARS[9]
A.place(A.pad(ms[:4], 1.9, 1.3, att=0.6, rel=0.3), b(9), 1.0, send=0.4)
for k in range(4):
    hit_kick(b(9, k), 0.5 + 0.15 * k, 0.3)
    A.place(sub(lo + 12, BEAT * 0.8, 0.5), b(9, k), 1.0)
for k in range(8):
    A.place(pluck(ms[[0, 2, 3, 4][k % 4]] + 12, 0.4, 0.7, tau=0.2), b(9, k * 0.5), 1.0, pan=(-0.3, 0.3)[k % 2], send=0.3)
roll(b(9, 1.5), b(9, 3.5), 0.9)
A.place(A.riser(1.6, 1.0), b(10) - 0.25 - 1.6, 1.0)
A.place(A.whoosh(1.0, 400, 5000, 0.7), 17.4, 1.0, send=0.3)
seen = set()
for (tri, hinge, delay, col) in C1.TRIS:                        # 翻回纸：远处先翻
    rd = 0.25 + (sum(p[2] for p in tri) / 3 - C1.Z0) / (C1.Z1 - C1.Z0) * 0.8
    tt = 17.4 + rd + 0.25
    q = round(tt / 0.0625)
    if q in seen or not 17.4 <= tt < 18.9:
        continue
    seen.add(q)
    A.sfx(paper(0.6), q * 0.0625, pan=A.rng.uniform(-0.6, 0.6), send=0.1)
A.place(vox(86, 0.4, 'a', 0.6, slide=-7), b(9, 3), 1.0, send=0.5)
A.place(rev_crash(0.75, 1.1), b(10) - 0.75, 1.0)

# ---------------- 10 小节：片名，落在主和弦 ----------------
lo, ms = D
A.place(A.crash(1.5), b(10), 1.0, send=0.4)
A.place(A.boom(0.8, 130, 36, 1.4), b(10), 1.0)
A.place(kick(1.1), b(10), 1.0)
chord(ms, b(10), 1.0, 1.0, cut=7000, rel=0.45)
chord([m + 12 for m in ms[1:4]], b(10), 1.0, 0.4, cut=9000, width=0.9, rel=0.45)
A.place(sub(lo, 1.0, 1.0, rel=0.4), b(10), 1.0)
A.place(vox(86, 0.9, 'a', 0.9, slide=-3, rel=0.25, vib=0.8), b(10), 1.0, send=0.5)
A.place(A.pad(ms[:4], 1.4, 0.9, att=0.05, rel=0.35), b(10), 1.0, send=0.5)
for k, m in enumerate((86, 81, 78, 74)):                        # 尾巴：钟琴往下走回主音
    A.place(A.bell(m, 0.55 - 0.05 * k, 0.9), b(10, 1 + k * 0.5), 1.0, pan=0.25 * (-1) ** k, send=0.6)

# ---------------- 混音：和弦乘侧链抽吸；两次减面整条音乐“降采样” ----------------
A.MUS += CHORDS * PUMP


def crush(bus, t0, t1, hold, bits, fade=0.004):
    i0, i1 = int(t0 * SR), int(t1 * SR)
    seg = bus[:, i0:i1]
    held = np.repeat(seg[:, ::hold], hold, axis=1)[:, :seg.shape[1]]
    q = 2 ** (bits - 1)
    wet = np.round(held * q) / q
    n = int(fade * SR)
    w = np.ones(seg.shape[1])
    w[:n] = np.linspace(0, 1, n)
    w[-n:] = np.linspace(1, 0, n)
    bus[:, i0:i1] = seg * (1 - w) + wet * w


for bus in (A.MUS, A.SEND):
    crush(bus, GLITCH[0], GLITCH[0] + 0.25, 6, 7)                 # 1280 → 320：有点糙
    crush(bus, GLITCH[1], b(6), 16, 4)                            # 320 → 80：很糙，下一小节弹回来

A.master(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'lowpoly.wav'), loop=False)
