"""折纸小样的声音：120 BPM 明快节拍 + 每个动作一个声音（时间直接从 frames.py 取）。python3 audio.py out.wav"""
import array
import math
import random
import sys
import wave

import frames as F

SR, DUR = 44100, 5.0
N = int(SR * DUR)
L = [0.0] * N
Rr = [0.0] * N
rnd = random.Random(3)


def add(t0, samples, gain=1.0, pan=0.0):
    i0 = int(t0 * SR)
    gl, gr = gain * (1 - max(0, pan)), gain * (1 + min(0, pan))
    for k, v in enumerate(samples):
        i = (i0 + k) % N                                    # 超出结尾的折回开头：循环无缝
        L[i] += v * gl
        Rr[i] += v * gr


def env(n, a, d):
    return [min(1, k / max(1, a)) * math.exp(-k / max(1, d)) for k in range(n)]


def kick():
    n = int(0.35 * SR)
    out, ph = [], 0
    for k in range(n):
        f = 45 + 110 * math.exp(-k / (SR * 0.03))
        ph += f / SR
        out.append(math.sin(ph * math.tau) * math.exp(-k / (SR * 0.12)))
    return out


def tick(freq, dur=0.02):
    n = int(dur * SR)
    return [(rnd.random() * 2 - 1) * 0.6 * math.exp(-k / (SR * 0.004)) + math.sin(k / SR * freq * math.tau) * 0.4 * math.exp(-k / (SR * 0.01)) for k in range(n)]


def bloop(f0, f1, dur=0.22):
    n, ph, out = int(dur * SR), 0, []
    for k in range(n):
        f = f0 + (f1 - f0) * min(1, k / (SR * 0.06))
        ph += f / SR
        out.append(math.sin(ph * math.tau) * math.exp(-k / (SR * 0.07)) * min(1, k / 80))
    return out


def noise_burst(dur, lp=0.85, decay=0.06):
    n, y, out = int(dur * SR), 0, []
    for k in range(n):
        y = y * lp + (rnd.random() * 2 - 1) * (1 - lp)
        out.append(y * 3 * math.exp(-k / (SR * decay)) * min(1, k / 200))
    return out


def tone(freq, dur, gain=1.0):
    n = int(dur * SR)
    return [gain * (math.sin(k / SR * freq * math.tau) * 0.7 + 0.3 * math.sin(k / SR * freq * 2 * math.tau)) * math.exp(-k / (SR * dur * 0.5)) * min(1, k / 300) for k in range(n)]


# 节拍：底鼓每拍、踩镲反拍、贝斯走 C 大调五声
K = kick()
hat = noise_burst(0.05, lp=0.1, decay=0.012)
bass = [65.41, 65.41, 98.0, 87.31, 65.41, 65.41, 110.0, 98.0, 87.31, 98.0]
for b in range(10):
    add(b * 0.5, K, 0.55)
    add(b * 0.5 + 0.25, hat, 0.12, pan=0.3)
    add(b * 0.5, tone(bass[b], 0.45), 0.22)
# 三角面翻起来：纸声，按落地时刻（翻页结束前一点）
for (tri, hinge, delay, col) in F.TRIS:
    t = delay + 0.5 * 0.82
    if 0 <= t < DUR:
        add(t, tick(1800 + rnd.random() * 1600, 0.015), 0.035, pan=rnd.uniform(-0.6, 0.6))
# 树：每簇一个和弦“啵”
notes = [523.25, 659.25, 783.99, 880.0, 1046.5]
for (x, y, z, tpop, kind, col, s) in F.TREES:
    add(tpop + 0.06, bloop(notes[int(abs(x * 7)) % 5] * 0.5, notes[int(abs(x * 7)) % 5]), 0.06, pan=max(-0.8, min(0.8, x / 30)))
# 枕木落下
for x in F.SLEEPERS:
    t_drop = 2.0 + (x + 34) / 40 * 2.4 * 0.62 - 0.35
    t = t_drop + 0.3 * 0.55
    if 0 <= t < DUR:
        add(t, tick(900 + rnd.random() * 200, 0.03), 0.09, pan=max(-0.8, min(0.8, x / 30)))
# 火车：每半拍一声“哧”
for k in range(10):
    add(2.0 + k * 0.25, noise_burst(0.18, lp=0.92, decay=0.05), 0.16)
# 结尾蒸汽：一声由小变大的“呼——”，在第 0 帧前收住
n = int(1.1 * SR)
y, sw = 0, []
for k in range(n):
    y = y * 0.96 + (rnd.random() * 2 - 1) * 0.04
    sw.append(y * 6 * (k / n) ** 2 * (1 - max(0, (k - n * 0.93) / (n * 0.07))))
add(3.88, sw, 0.5)

peak = max(max(abs(v) for v in L), max(abs(v) for v in Rr)) or 1
data = array.array('h')
for a, b in zip(L, Rr):
    data.append(int(a / peak * 0.85 * 32767)); data.append(int(b / peak * 0.85 * 32767))
w = wave.open(sys.argv[1] if len(sys.argv) > 1 else 'origami.wav', 'wb')
w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes()); w.close()
