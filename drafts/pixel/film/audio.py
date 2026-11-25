"""像素风小样的声音：雨、远雷、落雷，和一段 8-bit 方波配乐。

时间点全部来自 film.mjs 写出的 cues.json（真实时间，已经算进卡帧的 4 帧）。
卡帧一松开就是配乐的第一拍：120 BPM，之后每个事件都落在拍子或十六分音符上。

用法：python3 audio.py <cues.json> <out.wav>
"""
import json, sys, wave
import numpy as np

SR = 48000
cues = json.load(open(sys.argv[1]))
DUR = cues["frames"] / cues["fps"]
n = int(DUR * SR)
mix = np.zeros(n)
rng = np.random.default_rng(3)
t_all = np.arange(n) / SR


def place(sig, t0, gain=1.0):
    i = int(round(t0 * SR))
    if i >= n:
        return
    j = min(n, i + len(sig))
    if i < 0:
        sig, i = sig[-i:], 0
        j = min(n, len(sig))
    mix[i:j] += sig[: j - i] * gain


def env(length, a=0.002, d=0.1):
    t = np.arange(int(length * SR)) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)


def square(f, length, duty=0.5):
    t = np.arange(int(length * SR)) / SR
    ph = (np.cumsum(np.broadcast_to(f, t.shape)) / SR) % 1.0
    return np.where(ph < duty, 1.0, -1.0)


def tri(f, length):
    t = np.arange(int(length * SR)) / SR
    ph = (np.cumsum(np.broadcast_to(f, t.shape)) / SR) % 1.0
    return 4 * np.abs(ph - 0.5) - 1


def lowpass(x, a):
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc)
        y[i] = acc
    return y


def noise(length):
    return rng.uniform(-1, 1, int(length * SR))


hz = lambda m: 440 * 2 ** ((m - 69) / 12)

# ---- 雨：高通的白噪声底，偶尔一颗“嗒”
rain = noise(DUR)
rain = rain - lowpass(rain, 0.08)
mix += rain * 0.05
for k in range(60):
    place(noise(0.01) * env(0.01, 0.0005, 0.003), rng.uniform(0, DUR), 0.08)

# ---- 云里的闪：远处的闷雷（低通噪声，慢起慢落）
for t0 in cues["flashes"]:
    if t0 >= cues["strike"] - 0.01:
        continue
    L = 1.4
    x = lowpass(noise(L), 0.006) * 9
    e = np.minimum(1, np.arange(len(x)) / (0.25 * SR)) * np.exp(-np.arange(len(x)) / (0.5 * SR))
    place(x * e, t0 + 0.12, 0.35)

# ---- 先导：三帧往下爬的电
place(noise(0.1) * square(np.linspace(900, 300, int(0.1 * SR)), 0.1, 0.25) * env(0.1, 0.002, 0.05), cues["leader"], 0.18)

# ---- 落雷：脆的一声 + 方波往下掉 + 长的雷
S = cues["strike"]
place(noise(0.06) * env(0.06, 0.0003, 0.015), S, 0.9)
place(square(np.geomspace(1600, 60, int(0.35 * SR)), 0.35, 0.5) * env(0.35, 0.001, 0.12), S, 0.32)
boom = lowpass(noise(2.6), 0.01) * 7
place(boom * env(2.6, 0.005, 0.7), S + 0.01, 0.55)

# ---- 配乐：卡帧松开那一刻是第一拍
B0, BEAT = S + cues["freeze"], 0.5
chords = [(57, [69, 72, 76]), (53, [65, 69, 72]), (48, [64, 67, 72]), (55, [67, 71, 74]), (57, [69, 72, 76])]
for b in range(7):
    tb = B0 + b * BEAT
    if tb >= DUR:
        break
    root, arp = chords[min(b // 2, 4)] if b < 6 else chords[4]
    # 鼓：底鼓（正弦往下掉）每拍，反拍一个噪声镲
    place(np.sin(2 * np.pi * np.cumsum(np.geomspace(150, 45, int(0.18 * SR))) / SR) * env(0.18, 0.001, 0.07), tb, 0.55)
    place((noise(0.05) - lowpass(noise(0.05), 0.3)) * env(0.05, 0.0005, 0.012), tb + BEAT / 2, 0.16)
    # 贝斯：三角波八分音符
    for e8 in range(2):
        place(tri(hz(root - 12), 0.22) * env(0.22, 0.003, 0.12), tb + e8 * BEAT / 2, 0.3)
    # 琶音：方波十六分音符（25% 占空比）
    for s16 in range(4):
        m = arp[s16 % 3] + (12 if s16 == 3 else 0)
        place(square(hz(m), 0.11, 0.25) * env(0.11, 0.002, 0.04), tb + s16 * BEAT / 4, 0.07)

# ---- 灯泡一组一组亮：短促的电流声，音高一路往上
for i, t0 in enumerate(cues["bulbs"]):
    f = 700 + i * 45
    place(square(f, 0.03, 0.125) * noise(0.03) * env(0.03, 0.0005, 0.01), t0, 0.07)
# 每个字点满：一声“咔”（出字的声音）
for t0 in cues["chars"]:
    place(square(hz(45), 0.08) * env(0.08, 0.001, 0.025) + noise(0.08) * env(0.08, 0.0003, 0.008), t0, 0.22)

# ---- 副标题：每个字母一声方波“哔”，大调五声音阶往上走
penta = [72, 74, 76, 79, 81, 84, 86, 88]
for i, t0 in enumerate(cues["sub"]):
    place(square(hz(penta[i % 8]), 0.05, 0.5) * env(0.05, 0.001, 0.02), t0, 0.1)

# ---- 收束：大雨滴落进积水（正弦往上滑的“咚”）+ 一声叮，带两次回声
D = cues["drop"]
place(np.sin(2 * np.pi * np.cumsum(np.geomspace(300, 900, int(0.08 * SR))) / SR) * env(0.08, 0.001, 0.03), D, 0.35)
ding = (square(hz(93), 0.6, 0.5) * 0.4 + tri(hz(81), 0.6)) * env(0.6, 0.002, 0.18)
for k, g in enumerate([0.32, 0.14, 0.06]):
    place(ding, D + k * 0.125, g)

# ---- 结尾 60 ms 淡出，峰值压到 -1 dBFS
fade = int(0.06 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)
mix *= 10 ** (-1 / 20) / max(1e-9, np.abs(mix).max())
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
with wave.open(sys.argv[2], "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
rms = 20 * np.log10(np.sqrt(np.mean(mix**2)))
print(f"{DUR:.2f}s  rms {rms:.1f} dBFS")
