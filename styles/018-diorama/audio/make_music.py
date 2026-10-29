"""018 微缩景观 · 配乐与音效（纯 Python 合成，无外部素材）。
python3 make_music.py <events.json> <out.wav>

120 BPM、F 大调、一拍 0.5 秒，全片 18 秒 = 36 拍。暖暖的电钢琴和弦 + 轻鼓 + 贝斯；
每个零件落地一个声音（事件表由 video3d/render.cjs 从时间轴导出），落地声按当前和弦调音。
17—18 秒倒带：磁带倒放的“呜”声，尾巴折回开头，循环无缝。"""
import array
import json
import math
import random
import sys
import wave

SR, DUR, BPM = 44100, 18.0, 120
BEAT = 60 / BPM
N = int(SR * DUR)
L, R = [0.0] * N, [0.0] * N
rnd = random.Random(16)


def add(t0, smp, g=1.0, pan=0.0, wrap=True):
    i0 = int(t0 * SR)
    gl, gr = g * min(1, 1 - pan), g * min(1, 1 + pan)
    for k, v in enumerate(smp):
        i = i0 + k
        if wrap:
            i %= N
        elif not 0 <= i < N:
            continue
        L[i] += v * gl; R[i] += v * gr


def env(n, a, d):
    return [min(1, k / max(1, a * SR)) * math.exp(-k / (d * SR)) for k in range(n)]


def epiano(f, dur, vel=1.0):
    """电钢琴：基频 + 轻微失谐的二次谐波 + 钟声泛音，带颤音。"""
    n = int(dur * SR)
    return [vel * (math.sin(math.tau * f * k / SR) * 0.6 + 0.25 * math.sin(math.tau * f * 2.003 * k / SR) * math.exp(-k / (0.25 * SR))
                   + 0.12 * math.sin(math.tau * f * 7 * k / SR) * math.exp(-k / (0.04 * SR)))
            * (1 + 0.12 * math.sin(math.tau * 4.5 * k / SR)) * math.exp(-k / (dur * 0.55 * SR)) * min(1, k / 200) for k in range(n)]


def glock(f, dur=0.6):
    n = int(dur * SR)
    return [(math.sin(math.tau * f * k / SR) + 0.4 * math.sin(math.tau * f * 2.76 * k / SR) * math.exp(-k / (0.05 * SR))) * math.exp(-k / (0.22 * SR)) * min(1, k / 60) for k in range(n)]


def kick():
    n, ph, o = int(0.3 * SR), 0, []
    for k in range(n):
        ph += (48 + 90 * math.exp(-k / (SR * 0.025))) / SR
        o.append(math.sin(ph * math.tau) * math.exp(-k / (SR * 0.11)))
    return o


def noise(dur, lp, decay, attack=0.001):
    y, o = 0, []
    for k in range(int(dur * SR)):
        y = y * lp + (rnd.random() * 2 - 1) * (1 - lp)
        o.append(y * 4 * math.exp(-k / (SR * decay)) * min(1, k / max(1, attack * SR)))
    return o


def thud(f):
    n, ph, o = int(0.25 * SR), 0, []
    for k in range(n):
        ph += f * (1 + 0.8 * math.exp(-k / (SR * 0.01))) / SR
        o.append(math.sin(ph * math.tau) * math.exp(-k / (SR * 0.06)))
    return [a + 0.4 * b for a, b in zip(o, noise(0.25, 0.85, 0.02))]


def knock(f):   # 木头敲击
    n = int(0.12 * SR)
    return [(math.sin(math.tau * f * k / SR) + 0.5 * math.sin(math.tau * f * 2.4 * k / SR)) * math.exp(-k / (0.025 * SR)) for k in range(n)]


def bloop(f):
    n, ph, o = int(0.22 * SR), 0, []
    for k in range(n):
        ph += f * (0.6 + 0.4 * min(1, k / (SR * 0.05))) / SR
        o.append(math.sin(ph * math.tau) * math.exp(-k / (SR * 0.07)) * min(1, k / 80))
    return o


def hz(m):
    return 440 * 2 ** ((m - 69) / 12)


# 和弦进行（每两拍一个）：Fmaj7 Em7 Dm7 Cmaj7 / Bbmaj7 Am7 Gm7 C7 —— 循环
PROG = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59], [46, 50, 53, 57], [45, 48, 52, 55], [43, 46, 50, 53], [48, 52, 55, 58]]
SCALE = [65, 67, 69, 70, 72, 74, 76, 77, 79, 81]


def chord_at(t):
    return PROG[int(t / (2 * BEAT)) % len(PROG)]


NIGHT0, NIGHT1, REW = 15.0, 17.0, 17.0
for b in range(36):
    t = b * BEAT
    if t >= REW:
        break
    night = NIGHT0 <= t < NIGHT1
    ch = chord_at(t)
    if b % 2 == 0:                                   # 和弦：每两拍弹一次，夜里更轻、更长
        for i, m in enumerate(ch):
            add(t + i * 0.012, epiano(hz(m + 12), 1.3 if not night else 2.0, 0.55), 0.09, -0.3 + i * 0.2)
        add(t, epiano(hz(ch[0] - 12), 1.0), 0.16)      # 贝斯
    if not night:
        if b % 2 == 0:
            add(t, kick(), 0.38)
        add(t + BEAT / 2, noise(0.05, 0.1, 0.012), 0.08, 0.35)    # 反拍沙锤
        if b % 4 == 2:
            add(t, noise(0.15, 0.5, 0.05), 0.12, -0.1)             # 轻军鼓
    else:
        add(t, noise(0.08, 0.2, 0.03), 0.03, 0.4)

# 章节开头：钢片琴一个上行三音
for t0 in (0.0, 5.0, 8.6, 12.0, 15.0):
    for i, m in enumerate([72, 76, 79]):
        add(t0 + 0.15 + i * 0.125, glock(hz(m)), 0.10, 0.2)

# 零件的声音
events = json.load(open(sys.argv[1])) if len(sys.argv) > 1 else []
ticks = 0
for e in events:
    t, kind, pan = e['t'], e['kind'], max(-0.8, min(0.8, e.get('pan', 0)))
    if t < 0 or t >= REW:
        continue
    root = chord_at(t)[0]
    note = hz(SCALE[int(abs(pan * 13) + t * 3) % len(SCALE)])
    if kind == 'drop' or kind == 'spin':
        add(t, thud(hz(root - 12)), 0.28, pan)
    elif kind == 'rumble':
        add(t, thud(hz(root - 24)), 0.35, 0)
        add(t, noise(0.3, 0.92, 0.08), 0.18, 0)
    elif kind == 'pop':
        add(t, bloop(note), 0.10, pan)
    elif kind == 'rise':
        add(t, [v * (k / (SR * 0.3)) for k, v in enumerate(noise(0.3, 0.9, 1.0, 0.2))], 0.12, pan)
    elif kind in ('drawx', 'zip'):
        add(t, [v * min(1, k / (SR * 0.3)) for k, v in enumerate(noise(0.35, 0.5, 0.5, 0.2))], 0.10, pan)
    elif kind == 'tick':
        ticks += 1
        add(t, knock(1400 + (ticks % 5) * 140), 0.05, pan)
    elif kind.startswith('note'):
        add(t, glock(hz(SCALE[int(kind[4:]) + 2])), 0.07, pan)

# 入夜：开灯的“咔哒”和一个低音铺底
for k in range(14):
    add(15.25 + k * 0.065 + rnd.random() * 0.02, knock(2400), 0.05, rnd.uniform(-0.6, 0.6))
add(15.0, [math.sin(math.tau * hz(41) * k / SR) * min(1, k / (SR * 0.4)) * math.exp(-k / (SR * 1.5)) for k in range(int(2 * SR))], 0.12)

# 倒带：17—18 秒，一段由高到低的“呜——”（磁带倒放），尾巴折回开头
n, ph, sw = int(1.0 * SR), 0, []
for k in range(n):
    f = 900 * (1 - k / n) ** 1.5 + 60
    ph += f / SR
    sw.append((math.sin(ph * math.tau) * 0.5 + (rnd.random() - 0.5) * 0.3) * min(1, k / (SR * 0.05)) * (1 - (k / n) ** 4))
add(REW, sw, 0.22)
add(REW, noise(1.0, 0.95, 0.6, 0.3), 0.15)

peak = max(max(map(abs, L)), max(map(abs, R))) or 1
data = array.array('h')
for a, b in zip(L, R):
    data.append(int(a / peak * 0.86 * 32767)); data.append(int(b / peak * 0.86 * 32767))
w = wave.open(sys.argv[2] if len(sys.argv) > 2 else 'diorama.wav', 'wb')
w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes()); w.close()
