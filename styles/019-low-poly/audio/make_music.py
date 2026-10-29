"""019 低多边形 · 配乐与音效（纯 Python 合成）。python3 audio/make_music.py out.wav
120 BPM、C 大调，明快的木琴 + 拨弦 + 轻鼓；每个动作一个声音，时间直接从各章脚本里取。"""
import array
import math
import os
import random
import sys
import wave

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'video'))
import ch1_valley as C1  # noqa: E402
import ch2_lighthouse as C2  # noqa: E402
import ch3_planet as C3  # noqa: E402

SR, DUR, BEAT = 44100, 18.0, 0.5
N = int(SR * DUR)
L, R = [0.0] * N, [0.0] * N
rnd = random.Random(19)


def add(t0, smp, g=1.0, pan=0.0):
    i0 = int(t0 * SR)
    gl, gr = g * min(1, 1 - pan), g * min(1, 1 + pan)
    for k, v in enumerate(smp):
        i = (i0 + k) % N                     # 折回开头：循环无缝
        L[i] += v * gl; R[i] += v * gr


def hz(m): return 440 * 2 ** ((m - 69) / 12)


def mallet(f, d=0.35):
    n = int(d * SR)
    return [(math.sin(math.tau * f * k / SR) + 0.3 * math.sin(math.tau * f * 4 * k / SR) * math.exp(-k / (0.02 * SR))) * math.exp(-k / (d * 0.35 * SR)) * min(1, k / 60) for k in range(n)]


def pluck(f, d=0.5):
    n = int(d * SR)
    return [(math.sin(math.tau * f * k / SR) * 0.7 + 0.3 * math.sin(math.tau * f * 2 * k / SR)) * math.exp(-k / (d * 0.3 * SR)) * min(1, k / 80) for k in range(n)]


def noise(d, lp, decay, attack=0.001):
    y, o = 0, []
    for k in range(int(d * SR)):
        y = y * lp + (rnd.random() * 2 - 1) * (1 - lp)
        o.append(y * 4 * math.exp(-k / (SR * decay)) * min(1, k / max(1, attack * SR)))
    return o


def kick():
    n, ph, o = int(0.3 * SR), 0, []
    for k in range(n):
        ph += (50 + 100 * math.exp(-k / (SR * 0.025))) / SR
        o.append(math.sin(ph * math.tau) * math.exp(-k / (SR * 0.1)))
    return o


def paper(d=0.03):   # 纸翻过去的“嚓”
    return noise(d, 0.3, 0.008)


PROG = [[60, 64, 67], [57, 60, 64], [65, 69, 72], [67, 71, 74]]   # C Am F G
SCALE = [72, 74, 76, 79, 81, 84, 86, 88]
K = kick()
for b in range(36):
    t = b * BEAT
    ch = PROG[(b // 2) % 4]
    night = 15.0 <= t < 17.5
    add(t, K, 0.42 if not night else 0.15)
    add(t + 0.25, noise(0.05, 0.1, 0.012), 0.08 if not night else 0.03, 0.3)
    if b % 2 == 0:
        add(t, pluck(hz(ch[0] - 24), 0.9), 0.22)
        for i, m in enumerate(ch):
            add(t + 0.25 + i * 0.0, pluck(hz(m), 0.4), 0.06, -0.3 + i * 0.3)
    # 木琴分解和弦，一拍两个音
    for h in range(2):
        m = ch[(b * 2 + h) % 3] + 12
        add(t + h * 0.25, mallet(hz(m), 0.3 if not night else 0.8), 0.06 if not night else 0.08, 0.2 if h else -0.2)

# 章节开头：上行三音
for t0 in (0.0, 4.5, 8.0, 11.6, 15.0):
    for i, m in enumerate([79, 84, 88]):
        add(t0 + 0.12 + i * 0.1, mallet(hz(m), 0.4), 0.09)

# 第 1 章：三角形翻到位（只取一部分，按十六分音符量化，避免太密）
def flips(TRIS, off, dur=0.5):
    seen = set()
    for item in TRIS:
        tt = off + item[2] + dur * 0.82
        q = round(tt / 0.0625)
        if q in seen or not 0 <= tt < DUR:
            continue
        seen.add(q)
        add(q * 0.0625, paper(), 0.10, rnd.uniform(-0.6, 0.6))
        add(q * 0.0625, mallet(hz(SCALE[q % len(SCALE)]), 0.15), 0.025)


flips(C1.TRIS, 0.0)
for (x, y, z, tpop, kind, col, s) in C1.TREES:
    add(tpop + 0.06, pluck(hz(SCALE[int(abs(x)) % len(SCALE)]), 0.25), 0.04, max(-0.8, min(0.8, x / 30)))
for k in range(9):
    add(2.0 + k * 0.25, noise(0.16, 0.92, 0.05), 0.14)      # 火车“哧”
for t0, l in ((3.65, 0.85), (7.25, 0.75), (17.0, 0.5)):       # 纸云盖屏的“呼——”
    n = int(l * SR)
    add(t0, [v * (k / n) ** 1.5 for k, v in enumerate(noise(l, 0.96, 2.0, 0.1))], 0.5)
# 第 2 章
flips([(None, None, d) for (_, _, d, *_r) in C2.TRIS], 4.5)
for n in range(6):
    add(4.5 + 1.15 + n * 0.06 + 0.12, mallet(hz(72 + n * 2), 0.25), 0.08)
add(4.5 + 1.9, [math.sin(math.tau * hz(84) * k / SR) * math.exp(-k / (0.6 * SR)) for k in range(int(1.2 * SR))], 0.08)
# 第 3 章：面飞回来是一串细碎的“叮”，每次减面一声闷响 + 一个低音
for k in range(40):
    add(8.0 + 0.1 + k * 0.02 + rnd.random() * 0.02, mallet(hz(SCALE[k % len(SCALE)] + 12), 0.08), 0.02, rnd.uniform(-0.7, 0.7))
for t0, l in C3.LEVEL_T[1:]:
    add(8.0 + t0, K, 0.6)
    add(8.0 + t0, pluck(hz(48 if l == 2 else 43), 0.8), 0.3)
add(8.0 + 3.0, [math.sin(math.tau * (300 + 900 * k / (0.5 * SR)) * k / SR) * 0.4 * (1 - k / (0.5 * SR)) for k in range(int(0.5 * SR))], 0.15)
# 第 4 章：手机弹出、预报一格格弹出、下雪“叮铃”
add(11.6, K, 0.5)
for k in range(5):
    add(11.6 + 0.55 + k * 0.08 + 0.08, pluck(hz(SCALE[k + 2]), 0.2), 0.08)
for k in range(8):
    add(11.6 + 1.75 + k * 0.06, mallet(hz(SCALE[(k * 3) % len(SCALE)] + 12), 0.4), 0.04, rnd.uniform(-0.5, 0.5))
# 第 5 章：夜里一个长和弦铺底，三档颜色各一声
for m in (48, 55, 60, 64):
    add(15.0, [math.sin(math.tau * hz(m) * k / SR) * min(1, k / (0.5 * SR)) * math.exp(-k / (2.2 * SR)) for k in range(int(2.5 * SR))], 0.05)
for k in range(3):
    add(15.0 + 0.8 + k * 0.12 + 0.08, mallet(hz([76, 72, 67][k]), 0.5), 0.12)

peak = max(max(map(abs, L)), max(map(abs, R))) or 1
data = array.array('h')
for a, b in zip(L, R):
    data.append(int(a / peak * 0.86 * 32767)); data.append(int(b / peak * 0.86 * 32767))
w = wave.open(sys.argv[1] if len(sys.argv) > 1 else 'lowpoly.wav', 'wb')
w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes()); w.close()
