"""街角小样的声音：120 BPM 轻快节拍 + 每个零件一个声音，时间取自 _3d/gen_anim.py 的零件表。python3 audio.py out.wav"""
import array
import math
import os
import random
import re
import sys
import wave

SR, DUR, SHIFT, OFFSET = 44100, 6.5, 0.0, 1.3   # OFFSET：底座拼装占用的时间（与 _3d/gen_anim.py 一致）
N = int(SR * DUR)
L, R = [0.0] * N, [0.0] * N
rnd = random.Random(5)


def add(t0, smp, g=1.0, pan=0.0):
    i0 = int(t0 * SR)
    for k, v in enumerate(smp):
        i = i0 + k
        if 0 <= i < N:
            L[i] += v * g * (1 - max(0, pan)); R[i] += v * g * (1 + min(0, pan))


def osc(f, d, decay, shape=lambda p: math.sin(p)):
    return [shape(k / SR * f * math.tau) * math.exp(-k / (SR * decay)) * min(1, k / 120) for k in range(int(d * SR))]


def sweep(f0, f1, d, decay):
    ph, o = 0, []
    for k in range(int(d * SR)):
        ph += (f0 + (f1 - f0) * min(1, k / (SR * d))) / SR
        o.append(math.sin(ph * math.tau) * math.exp(-k / (SR * decay)) * min(1, k / 100))
    return o


def noise(d, lp, decay, attack=0.002):
    y, o = 0, []
    for k in range(int(d * SR)):
        y = y * lp + (rnd.random() * 2 - 1) * (1 - lp)
        o.append(y * 4 * math.exp(-k / (SR * decay)) * min(1, k / (SR * attack)))
    return o


thud = [a + b for a, b in zip(sweep(160, 50, 0.3, 0.09), noise(0.3, 0.9, 0.03) + [0] * 0)]
pop = lambda f: sweep(f * 0.6, f, 0.2, 0.06)
zip_ = [v * min(1, k / (SR * 0.35)) for k, v in enumerate(noise(0.4, 0.4, 0.5, 0.3))]
click = noise(0.03, 0.2, 0.004)
rise = [v * (k / (SR * 0.45)) for k, v in enumerate(noise(0.45, 0.93, 1.0, 0.2))]

# 节拍：底鼓 + 反拍沙锤 + 一段 C 大调分解和弦（入夜后降到 A 小调）
kick = sweep(140, 45, 0.3, 0.1)
for b in range(13):
    add(b * 0.5, kick, 0.5)
    add(b * 0.5 + 0.25, noise(0.06, 0.1, 0.015), 0.1, 0.3)
arp_day = [523.25, 659.25, 783.99, 659.25]
arp_night = [440.0, 523.25, 659.25, 523.25]
for k in range(26):
    t = k * 0.25
    f = (arp_day if t < 3.5 + OFFSET else arp_night)[k % 4]
    add(t, osc(f, 0.22, 0.08, lambda p: 0.6 * math.sin(p) + 0.4 * math.sin(2 * p)), 0.07, -0.2 if k % 2 else 0.2)

# 零件：从生成脚本里读出每组的动作和起始时间
src = open(os.path.join(os.path.dirname(__file__), '..', '..', '_3d', 'gen_anim.py')).read()
for name, typ, t0, dur in re.findall(r"begin\('(\w+)','(\w+)',([\d.]+),([\d.]+)", src):
    t0, dur = float(t0) - SHIFT + OFFSET, float(dur)   # 零件表里是挪之前的时间
    if typ == 'rise':
        add(t0, rise, 0.25); add(t0 + dur * 0.55, thud, 0.35)
    elif typ in ('drop', 'drive'):
        add(t0 + dur * 0.55, thud, 0.5)
    elif typ == 'pop':
        add(t0 + 0.05, pop(600 + (hash(name) % 5) * 120), 0.25)
    elif typ == 'drawx':
        add(t0, zip_, 0.18)
# 底座拼装（时间与 _3d/base_build.js 一致）
add(0.0, thud, 0.6)                                                     # 底板落地（第 0 帧之前就开始了）
for li in range(4):
    for k in range(4):
        add(-0.12 + li * 0.13 + k * 0.045 + 0.3, noise(0.08, 0.6, 0.02), 0.18, -0.6 + k * 0.4)   # 土块推到位
tap = osc(1500, 0.03, 0.006)
for i in range(12):
    for j in range(6):
        if (i + j) % 2 == 0: add(0.4 + (i + j) * 0.028 + 0.18, tap, 0.05, -0.8 + i / 7)   # 后面的方砖
for z0, lag in ((0, 0.62), (9, 0.78)):
    for i in range(24):
        add(lag + i * 0.022 + 0.27, osc(1900 + i * 20, 0.025, 0.005), 0.06, -0.8 + i / 15)  # 人行道一排排翻落
add(0.95, zip_, 0.25)                                                   # 柏油刷开
for k in range(10):
    add(1.3 + k * 0.03 + 0.1, click, 0.08, -0.8 + k / 6)                # 中线
for k in range(7):
    add(1.38 + k * 0.05 + 0.25, osc(880 + k * 110, 0.06, 0.02), 0.12)   # 斑马线：一条一个音，往上走
# 入夜：开灯的“咔哒”；路灯一声；卡车开走
for k in range(12):
    add(OFFSET + 3.25 + k * 0.075 + rnd.random() * 0.03, click, 0.12, rnd.uniform(-0.6, 0.6))
add(OFFSET + 3.7, osc(110, 0.9, 0.5), 0.12)
add(OFFSET + 4.05, noise(1.1, 0.97, 0.6, 0.3), 0.35, 0.4)

peak = max(max(map(abs, L)), max(map(abs, R))) or 1
data = array.array('h')
for a, b in zip(L, R):
    data.append(int(a / peak * 0.85 * 32767)); data.append(int(b / peak * 0.85 * 32767))
w = wave.open(sys.argv[1] if len(sys.argv) > 1 else 'diorama.wav', 'wb')
w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes()); w.close()
