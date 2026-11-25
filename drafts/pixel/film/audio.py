"""像素风全片的声音：雨、蓄电、雷，和一段 150 BPM 的 8-bit 方波配乐。

时间点全部来自 film.mjs 写出的 cues.json（真实时间，已经算进卡帧）。
卡帧一松开就是第一拍；一拍 0.4 秒 = 12 帧，十六分音符 0.1 秒 = 3 帧。

- 第二道雷劈下来时音乐整拍断电，招牌从右往左重新亮的那 8 帧只剩一路往上的电流声。
- 每次卡帧（画面冻结）配乐也一起停住，冻结完原样接上。
- 屏幕上每次出字都有一声方波“哔”，音高按五声音阶往上走，换一块板重新开始。
- 镜头钻进一格 / 退出来：每一级一声，进去往下、出来往上；那一格冷下来时每一阶一声，一路往下。
- 收尾：最后一滴雨落进积水，“咚”一声加一个叮，两次回声，之后只剩雨。

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


def blip(m, t0, gain=0.1, L=0.05, duty=0.5):
    place(sfx, square(hz(m), L, duty) * env(L, 0.001, L * 0.4), t0, gain)


# ---- 雨（全片）
rain = noise(DUR)
sfx += (rain - lowpass(rain, 0.08)) * 0.045
for _ in range(220):
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
def charge(c0, c1, g=1.0):
    L = c1 - c0
    hum = square(np.geomspace(55, 220, int(L * SR)), L, 0.3) * np.linspace(0.2, 1, int(L * SR)) ** 2
    place(sfx, hum, c0, 0.06 * g)
    for k in range(14):
        tk = c0 + L * (k / 14) ** 0.7
        place(sfx, noise(0.012) * square(2400, 0.012, 0.2) * env(0.012, 0.0003, 0.004), tk, (0.05 + 0.1 * k / 14) * g)


charge(*cues["charge"])
charge(*cues["charge3"], 0.8)
for t0 in cues["flashes"]:
    x = lowpass(noise(1.0), 0.006) * 9
    place(sfx, x * env(1.0, 0.15, 0.35), t0 + 0.08, 0.25)
for t0 in [cues["leader"]] + cues["leaders"]:
    place(sfx, noise(0.1) * square(np.linspace(900, 300, int(0.1 * SR)), 0.1, 0.25) * env(0.1, 0.002, 0.05), t0, 0.18)


# ---- 落雷：脆响 + 方波往下掉 + 长雷
def thunder(t0, big=1.0):
    place(sfx, noise(0.06) * env(0.06, 0.0003, 0.015), t0, 0.9 * big)
    place(sfx, square(np.geomspace(1600, 60, int(0.3 * SR)), 0.3) * env(0.3, 0.001, 0.1), t0, 0.3 * big)
    place(sfx, lowpass(noise(2.0), 0.01) * 7 * env(2.0, 0.005, 0.55), t0 + 0.01, 0.5 * big)


thunder(cues["strike"])
thunder(cues["strike2"], 0.8)
for s in cues["strikes"]:
    thunder(s["t"], s["big"])
# 断电：一声往下掉的“嗡——”
place(sfx, square(np.geomspace(330, 30, int(0.3 * SR)), 0.3, 0.5) * env(0.3, 0.002, 0.12), cues["strike2"] + 0.04, 0.16)

# ---- 配乐：150 BPM。Am – F – C – G，两拍一个和弦
B0, BEAT = cues["beat0"], 60 / cues["bpm"]
S2, BACK, DROP, DROP2 = cues["strike2"], cues["back"], cues["drop"], cues["drop2"]
AM, FM, CM, GM = (57, [69, 72, 76]), (53, [65, 69, 72]), (48, [64, 67, 72]), (55, [67, 71, 74])
chords = {0: AM, 1: AM, 2: FM, 3: FM, 4: CM, 6: GM, 7: AM, 8: AM}  # 第 5 拍（第二道雷）整拍断电
NB = int((DUR - B0) / BEAT) + 1
for b in range(9, NB):
    chords[b] = [AM, AM, FM, FM, CM, CM, GM, GM][(b - 9) % 8]
LAST = round((DROP2 - B0) / BEAT)  # 最后一滴雨那一拍起只剩琶音的回声
kick = lambda: sine(np.geomspace(160, 45, int(0.16 * SR)), 0.16) * env(0.16, 0.001, 0.06)
snare = lambda: (noise(0.12) - lowpass(noise(0.12), 0.2)) * env(0.12, 0.0005, 0.04) + sine(190, 0.12) * env(0.12, 0.001, 0.03)
hat = lambda: (noise(0.04) - lowpass(noise(0.04), 0.4)) * env(0.04, 0.0003, 0.01)
crash = lambda: (noise(1.2) - lowpass(noise(1.2), 0.3)) * env(1.2, 0.001, 0.35)
# 主旋律：四块板上才有，每拍两个八分音符
MEL = [76, 74, 72, 74, 76, 79, 76, 72, 77, 76, 72, 69, 71, 74, 79, 74]
for b in range(NB):
    tb = B0 + b * BEAT
    if tb >= DUR or b not in chords:
        continue
    root, arp = chords[b]
    tail = b >= LAST
    if not tail:
        place(music, kick(), tb, 0.6)
        if b % 2 == 1:
            place(music, snare(), tb, 0.32)
        for h in range(2):
            place(music, hat(), tb + h * BEAT / 2 + BEAT / 4, 0.12)
        for e in range(2):
            place(music, tri(hz(root - 12), 0.18) * env(0.18, 0.003, 0.1), tb + e * BEAT / 2, 0.32)
        if 10 <= b < 38:
            for e in range(2):
                place(music, square(hz(MEL[(2 * b + e) % 16]), 0.16, 0.5) * env(0.16, 0.004, 0.09), tb + e * BEAT / 2, 0.045)
    for s in range(4):
        m = arp[s % 3] + (12 if s == 3 else 0)
        place(music, square(hz(m), 0.09, 0.25) * env(0.09, 0.002, 0.035), tb + s * BEAT / 4, 0.07 * (0.5 ** (b - LAST + 1) if tail else 1))
for tc in (cues["surge"], BACK, cues["boards"]["b2"], cues["surge3"]):
    place(music, crash(), tc, 0.22)

# ---- 卡帧：画面冻结的时候配乐也停住（前后各 3 ms 斜坡）
r = int(0.003 * SR)
for a, b in cues["freezes"]:
    i, j = int(a * SR), int(b * SR)
    g = np.ones(n)
    g[i:j] = 0
    g[i - r:i] = np.linspace(1, 0, r)
    g[j:j + r] = np.linspace(0, 1, r)
    music *= g

# ---- 灯泡一组一组亮：电流“滋”，音高一路往上；每个字点满一声“咔”
for i, t0 in enumerate(cues["bulbs"]):
    place(sfx, square(700 + i * 90, 0.03, 0.125) * noise(0.03) * env(0.03, 0.0005, 0.01), t0, 0.08)
for t0 in cues["chars"]:
    place(sfx, square(hz(45), 0.08) * env(0.08, 0.001, 0.025) + noise(0.08) * env(0.08, 0.0003, 0.008), t0, 0.24)
# 浪涌：往上冲的方波
for t0 in (cues["surge"], cues["surge3"]):
    place(sfx, square(np.geomspace(200, 1800, int(0.12 * SR)), 0.12, 0.25) * env(0.12, 0.002, 0.08), t0 - 0.06, 0.12)
# 副标题：字母砸下来，每个一声方波“哔”（五声音阶往上）+ 一点落地声
penta = [72, 74, 76, 79, 81, 84, 86, 88]
for i, t0 in enumerate(cues["sub"]):
    blip(penta[i % 8], t0, 0.1)
    place(sfx, noise(0.02) * env(0.02, 0.0003, 0.005), t0, 0.06)
# 重新点亮：从右往左扫，电流声一路升到第 7 拍
for i, t0 in enumerate(cues["relight"]):
    place(sfx, square(500 * 1.25 ** i, 0.05, 0.125) * env(0.05, 0.001, 0.02), t0, 0.1)
place(sfx, square(np.geomspace(100, 900, int((BACK - S2 - 0.12) * SR)), BACK - S2 - 0.12, 0.25) * np.linspace(0, 1, int((BACK - S2 - 0.12) * SR)) ** 2, S2 + 0.12, 0.07)
# 第 8 拍：雨滴落水，一声“咚”和一声短叮（不是收尾，所以短）
place(sfx, sine(np.geomspace(300, 900, int(0.08 * SR)), 0.08) * env(0.08, 0.001, 0.03), DROP, 0.3)
blip(93, DROP, 0.12, 0.2)

# ---- 钻进一格：每一级一声，音高往下；那一格冷下来：每一阶一声，继续往下
for i, t0 in enumerate(cues["zoom1"]):
    blip(88 - i * 5, t0, 0.12, 0.06, 0.25)
    place(sfx, noise(0.06) * env(0.06, 0.001, 0.02), t0, 0.05)
for i, t0 in enumerate(cues["fill"]):
    blip(81 - i * 2, t0, 0.08, 0.05, 0.125)
for T in cues["trans"]:
    for i in range(3):
        blip(84 - i * 5, T + i * 2 / 30, 0.1, 0.05, 0.25)  # 进去：往下
        blip(69 + i * 5, T + (6 + i * 2) / 30, 0.1, 0.05, 0.25)  # 出来：往上
    place(sfx, (noise(0.4) - lowpass(noise(0.4), 0.2)) * np.hanning(int(0.4 * SR)), T, 0.08)
for i, t0 in enumerate(cues["zoom3"]):
    place(sfx, square(700 + i * 300, 0.03, 0.125) * noise(0.03) * env(0.03, 0.0005, 0.01), t0, 0.1)

# ---- 板上出字：每次一声“哔”
starts = sorted(cues["boards"].values())
count = {}
for t0 in cues["text"]:
    b = max(s for s in starts if s <= t0 + 1e-6)
    k = count.get(b, 0)
    count[b] = k + 1
    blip(penta[k % 8], t0, 0.09)
    place(sfx, noise(0.02) * env(0.02, 0.0003, 0.005), t0, 0.05)
# 灯泡重新烧白：电流“滋”
for t0 in cues["heat"]:
    place(sfx, square(1400, 0.06, 0.125) * noise(0.06) * env(0.06, 0.001, 0.025), t0, 0.08)
# ×2.5 打叉：低音方波“嗡”
place(sfx, square(hz(40), 0.18, 0.5) * env(0.18, 0.002, 0.08), cues["wrong"], 0.14)
# 进度条：每 2 帧一声小咔，音高往上
for i, t0 in enumerate(cues["bar"]):
    blip(84 + i, t0, 0.035, 0.02, 0.125)
# 按下按钮：咔 + 叮叮
place(sfx, noise(0.02) * env(0.02, 0.0003, 0.004), cues["press"], 0.25)
blip(88, cues["press"] + 0.02, 0.1, 0.18)
blip(93, cues["press"] + 0.1, 0.08, 0.2)

# ---- 收尾：署名砸下来一声，最后一滴雨落进积水（“咚”）+ 一声叮，两次回声
blip(84, cues["sig"], 0.1)
place(sfx, noise(0.02) * env(0.02, 0.0003, 0.005), cues["sig"], 0.06)
place(sfx, sine(np.geomspace(300, 900, int(0.08 * SR)), 0.08) * env(0.08, 0.001, 0.03), DROP2, 0.35)
ding = (square(hz(93), 0.6) * 0.4 + tri(hz(81), 0.6)) * env(0.6, 0.002, 0.18)
for k, g in enumerate([0.32, 0.14, 0.06]):
    place(sfx, ding, DROP2 + k * BEAT / 2, g)

mix = music + sfx
fade = int(0.08 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)
mix /= max(1e-9, np.abs(mix).max())


# 响度：雷的脆响是全片最高的峰，只按峰值归一化整体会偏轻（约 -21 LUFS）。
# 软膝限幅只压 0.7 以上的峰，把整体抬到 RMS 约 -12.5 dBFS（成片实测 -17 LUFS，真峰值 -1.5 dBFS）。
# 方波边沿很陡，编码成 AAC 后样本之间会冲出约 3 dB：限幅前后各切掉 15 kHz 以上，
# 再按 4 倍过采样量真峰值，留 1.5 dB。
def soft(x, k=0.7):
    a = np.abs(x)
    return np.where(a < k, x, np.sign(x) * (k + (1 - k) * np.tanh((a - k) / (1 - k))))


def band(x, hi=15000):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= np.clip((hi + 1000 - f) / 2000, 0, 1)  # 14—16 kHz 线性滚降
    return np.fft.irfft(X, len(x))


def true_peak(x):
    X = np.fft.rfft(x)
    return np.abs(np.fft.irfft(X, len(x) * 4) * 4).max()


mix = band(mix)
mix /= np.abs(mix).max()
g = 1.0
for _ in range(40):
    y = soft(mix * g)
    if 20 * np.log10(np.sqrt(np.mean(y ** 2))) >= -12.5:
        break
    g *= 10 ** (0.25 / 20)
y = band(y)
mix = y * 10 ** (-1.5 / 20) / true_peak(y)
with wave.open(sys.argv[2], "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
rms = lambda x: 20 * np.log10(max(1e-9, np.sqrt(np.mean(x ** 2))))
print(f"{DUR:.2f}s  mix rms {rms(mix):.1f} dBFS  music {rms(music):.1f} / sfx {rms(sfx):.1f} dB（混音前）")
