"""像素风小样 v2 的声音：雨、蓄电、两道雷，和一段 150 BPM 的 8-bit 方波配乐。

时间点全部来自 film.mjs 写出的 cues.json（真实时间，已经算进卡帧）。
卡帧一松开就是第一拍；一拍 0.4 秒 = 12 帧，十六分音符 0.1 秒 = 3 帧。
第二道雷劈下来时音乐跟着断电，招牌从右往左重新亮的那 8 帧只剩一路往上的电流声，第 7 拍全部回来。

用法：python3 audio.py <cues.json> <out.wav>
"""
import json, sys, wave
import numpy as np

SR = 48000
cues = json.load(open(sys.argv[1]))
DUR = cues["frames"] / cues["fps"]
n = int(DUR * SR)
music = np.zeros(n)
sfx = np.zeros(n)
rng = np.random.default_rng(3)


def place(buf, sig, t0, gain=1.0):
    i = int(round(t0 * SR))
    if i >= n:
        return
    j = min(n, i + len(sig))
    buf[i:j] += sig[: j - i] * gain


def env(length, a=0.002, d=0.1):
    t = np.arange(int(length * SR)) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)


def phase(f, length):
    return (np.cumsum(np.broadcast_to(np.asarray(f, float), (int(length * SR),))) / SR) % 1.0


square = lambda f, L, duty=0.5: np.where(phase(f, L) < duty, 1.0, -1.0)
tri = lambda f, L: 4 * np.abs(phase(f, L) - 0.5) - 1
sine = lambda f, L: np.sin(2 * np.pi * phase(f, L))
noise = lambda L: rng.uniform(-1, 1, int(L * SR))
hz = lambda m: 440 * 2 ** ((m - 69) / 12)


def lowpass(x, a):
    y, acc = np.empty_like(x), 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc)
        y[i] = acc
    return y


# ---- 雨
rain = noise(DUR)
sfx += (rain - lowpass(rain, 0.08)) * 0.045
for _ in range(50):
    place(sfx, noise(0.01) * env(0.01, 0.0005, 0.003), rng.uniform(0, DUR), 0.07)

# ---- 开场：远处一道雷（第 0 帧就响），霓虹的嗡声，闪两下，断电
place(sfx, noise(0.05) * env(0.05, 0.0003, 0.012), cues["bolt0"], 0.55)
place(sfx, lowpass(noise(1.6), 0.008) * 8 * env(1.6, 0.01, 0.45), cues["bolt0"] + 0.02, 0.45)
D0 = cues["die"]
buzz = (square(120, D0, 0.5) * 0.6 + square(240, D0, 0.3) * 0.4) * np.minimum(1, np.arange(int(D0 * SR)) / (0.004 * SR))
place(sfx, buzz, 0, 0.05)
for tf in cues["flicker"]:
    place(sfx, noise(0.025) * square(1800, 0.025, 0.2) * env(0.025, 0.0003, 0.008), tf, 0.16)
place(sfx, square(np.geomspace(440, 35, int(0.28 * SR)), 0.28, 0.5) * env(0.28, 0.002, 0.11), D0, 0.2)
place(sfx, noise(0.03) * env(0.03, 0.0003, 0.006), D0, 0.3)

# ---- 蓄电：避雷针上的电越积越多（方波嗡声往上爬 + 噼啪）
c0, c1 = cues["charge"]
L = c1 - c0
hum = square(np.geomspace(55, 220, int(L * SR)), L, 0.3) * np.linspace(0.2, 1, int(L * SR)) ** 2
place(sfx, hum, c0, 0.06)
for k in range(14):
    tk = c0 + L * (k / 14) ** 0.7
    place(sfx, noise(0.012) * square(2400, 0.012, 0.2) * env(0.012, 0.0003, 0.004), tk, 0.05 + 0.1 * k / 14)
for t0 in cues["flashes"]:
    x = lowpass(noise(1.0), 0.006) * 9
    place(sfx, x * env(1.0, 0.15, 0.35), t0 + 0.08, 0.25)
place(sfx, noise(0.1) * square(np.linspace(900, 300, int(0.1 * SR)), 0.1, 0.25) * env(0.1, 0.002, 0.05), cues["leader"], 0.18)

# ---- 落雷：脆响 + 方波往下掉 + 长雷
def thunder(t0, big=1.0):
    place(sfx, noise(0.06) * env(0.06, 0.0003, 0.015), t0, 0.9 * big)
    place(sfx, square(np.geomspace(1600, 60, int(0.3 * SR)), 0.3) * env(0.3, 0.001, 0.1), t0, 0.3 * big)
    place(sfx, lowpass(noise(2.0), 0.01) * 7 * env(2.0, 0.005, 0.55), t0 + 0.01, 0.5 * big)

thunder(cues["strike"])
thunder(cues["strike2"], 0.8)
# 断电：一声往下掉的“嗡——”
place(sfx, square(np.geomspace(330, 30, int(0.3 * SR)), 0.3, 0.5) * env(0.3, 0.002, 0.12), cues["strike2"] + 0.04, 0.16)

# ---- 配乐：150 BPM
B0, BEAT = cues["beat0"], 60 / cues["bpm"]
S2, BACK, DROP = cues["strike2"], cues["back"], cues["drop"]
chords = {0: (57, [69, 72, 76]), 1: (57, [69, 72, 76]), 2: (53, [65, 69, 72]), 3: (53, [65, 69, 72]),
          4: (48, [64, 67, 72]), 6: (55, [67, 71, 74]), 7: (57, [69, 72, 76]), 8: (57, [69, 72, 76])}
kick = lambda: sine(np.geomspace(160, 45, int(0.16 * SR)), 0.16) * env(0.16, 0.001, 0.06)
snare = lambda: (noise(0.12) - lowpass(noise(0.12), 0.2)) * env(0.12, 0.0005, 0.04) + sine(190, 0.12) * env(0.12, 0.001, 0.03)
hat = lambda: (noise(0.04) - lowpass(noise(0.04), 0.4)) * env(0.04, 0.0003, 0.01)
crash = lambda: (noise(1.2) - lowpass(noise(1.2), 0.3)) * env(1.2, 0.001, 0.35)
for b in range(10):
    tb = B0 + b * BEAT
    if tb >= DUR or b not in chords:
        continue  # 第 5 拍（第二道雷）整拍断电
    root, arp = chords[b]
    tail = b >= 8  # 落水之后只剩琶音的回声
    if not tail:
        place(music, kick(), tb, 0.6)
        if b % 2 == 1:
            place(music, snare(), tb, 0.32)
        for h in range(2):
            place(music, hat(), tb + h * BEAT / 2 + BEAT / 4, 0.12)
        for e in range(2):
            place(music, tri(hz(root - 12), 0.18) * env(0.18, 0.003, 0.1), tb + e * BEAT / 2, 0.32)
    for s in range(4):
        m = arp[s % 3] + (12 if s == 3 else 0)
        place(music, square(hz(m), 0.09, 0.25) * env(0.09, 0.002, 0.035), tb + s * BEAT / 4, 0.07 * (0.5 ** (b - 7) if tail else 1))
for tc in (cues["surge"], BACK):
    place(music, crash(), tc, 0.22)

# ---- 灯泡一组一组亮：电流“滋”，音高一路往上；每个字点满一声“咔”
for i, t0 in enumerate(cues["bulbs"]):
    place(sfx, square(700 + i * 90, 0.03, 0.125) * noise(0.03) * env(0.03, 0.0005, 0.01), t0, 0.08)
for t0 in cues["chars"]:
    place(sfx, square(hz(45), 0.08) * env(0.08, 0.001, 0.025) + noise(0.08) * env(0.08, 0.0003, 0.008), t0, 0.24)
# 浪涌：往上冲的方波
place(sfx, square(np.geomspace(200, 1800, int(0.12 * SR)), 0.12, 0.25) * env(0.12, 0.002, 0.08), cues["surge"] - 0.06, 0.12)
# 副标题：字母砸下来，每个一声方波“哔”（五声音阶往上）+ 一点落地声
penta = [72, 74, 76, 79, 81, 84, 86, 88]
for i, t0 in enumerate(cues["sub"]):
    place(sfx, square(hz(penta[i % 8]), 0.05) * env(0.05, 0.001, 0.02), t0, 0.1)
    place(sfx, noise(0.02) * env(0.02, 0.0003, 0.005), t0, 0.06)
# 重新点亮：从右往左扫，电流声一路升到第 7 拍
for i, t0 in enumerate(cues["relight"]):
    place(sfx, square(500 * 1.25 ** i, 0.05, 0.125) * env(0.05, 0.001, 0.02), t0, 0.1)
place(sfx, square(np.geomspace(100, 900, int((BACK - S2 - 0.12) * SR)), BACK - S2 - 0.12, 0.25) * np.linspace(0, 1, int((BACK - S2 - 0.12) * SR)) ** 2, S2 + 0.12, 0.07)

# ---- 收束：大雨滴落进积水（“咚”）+ 一声叮，两次回声
place(sfx, sine(np.geomspace(300, 900, int(0.08 * SR)), 0.08) * env(0.08, 0.001, 0.03), DROP, 0.35)
ding = (square(hz(93), 0.6) * 0.4 + tri(hz(81), 0.6)) * env(0.6, 0.002, 0.18)
for k, g in enumerate([0.32, 0.14, 0.06]):
    place(sfx, ding, DROP + k * BEAT / 2, g)

mix = music + sfx
fade = int(0.08 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)
mix *= 10 ** (-1 / 20) / max(1e-9, np.abs(mix).max())
with wave.open(sys.argv[2], "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
print(f"{DUR:.2f}s  rms {20 * np.log10(np.sqrt(np.mean(mix ** 2))):.1f} dBFS")
