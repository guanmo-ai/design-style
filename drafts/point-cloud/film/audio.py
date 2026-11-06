"""点云全片 · 第二版配乐（一整首歌，18 秒）。120 BPM（一拍 = 30 帧）· F# 小调 · 数字感的电子：四拍底鼓、超锯齿和弦、方波主旋律、声呐、8-bit。
开场一个点的“嘀”→ 第 12 帧炸开 → 鼓慢慢进来、军鼓越滚越密 → 第 90 帧标题锁定 = 全乐队落地。
每章换一组和弦和一种“招牌声音”：故障人头 = 整段卡顿（stutter）；激光雷达 = 声呐 + 转圈的嗡嗡声；楼梯 = 往下扫的噪声；
体素 = 8-bit 方波；颜料墙 = 和弦全打开；高斯泼溅 = 只剩铺底（呼吸）；规则卡 = 一卡一记重拍；手机 = 轻；片尾吸回一个点，空一拍，再炸开。
时间取自 timeline.js。python3 audio.py out.wav"""
import json
import re
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_lib'))
from song import Song  # noqa: E402

TL = json.loads(re.sub(r'//[^\n]*', '', re.search(r'const TL = (\{.*?\});', (HERE / 'timeline.js').read_text(), re.S).group(1)))
FSM, D, A, E, BM, CS7 = [61, 66, 69], [62, 66, 69], [61, 64, 69], [59, 64, 68], [62, 66, 71], [61, 65, 68, 71]
CH = [(0, 42, FSM), (90, 38, D), (120, 42, FSM), (165, 40, E), (210, 38, D), (255, 45, A), (300, 47, BM), (345, 37, CS7),
      (390, 42, FSM), (435, 38, D), (480, 45, A), (525, 40, E),
      (570, 42, FSM), (600, 38, D), (630, 45, A), (660, 40, E), (690, 37, CS7),
      (720, 42, FSM), (780, 38, D), (840, 45, A), (900, 40, E), (930, 47, BM), (960, 37, CS7), (1020, 42, FSM)]
END = TL['end']
S = Song(END, CH, seed=61)
fr = S.fr
rng = np.random.default_rng(3)
FIN = TL['final']
DROP = TL['lock']


# —— 音色 ——
def ping(m, level=1.0, dec=0.18):
    t = S.tt(dec * 3)
    y = np.sin(2 * np.pi * S.midi(m) * t) + 0.2 * np.sin(2 * np.pi * S.midi(m) * 3 * t) * np.exp(-t / 0.02)
    return y * np.minimum(1, t / 0.0006) * np.exp(-t / dec) * level * 0.4


def sonar(m, level=1.0):
    """声呐：长尾巴的正弦 + 三次回声"""
    t = S.tt(2.2)
    y = np.zeros_like(t)
    for k, (dl, g) in enumerate([(0, 1), (0.25, 0.45), (0.5, 0.22), (0.75, 0.1)]):
        i = int(dl * S.SR)
        tt = t[:len(t) - i]
        y[i:] += g * np.sin(2 * np.pi * S.midi(m) * tt) * np.exp(-tt / 0.35) * np.minimum(1, tt / 0.003)
    return y * level * 0.5


def stab(ms, d=0.16, level=1.0, bright=6500):
    """超锯齿和弦：每个音 3 个失谐声部，滤波包络很快关上"""
    y = None
    for m in ms:
        for dv in (-0.012, 0.0, 0.012):
            v = S.synth(m, d, 'saw', bright, 900, 0.05, att=0.002, rel=0.06, det=0.0)
            v = S.synth(m + dv * 12, d, 'saw', bright, 900, 0.05, att=0.002, rel=0.06) if dv else v
            y = v if y is None else (np.pad(y, (0, max(0, len(v) - len(y)))) + np.pad(v, (0, max(0, len(y) - len(v)))))
    return np.tanh(y * 0.5) * level


def bit(m, d=0.09, level=1.0):
    """8-bit：方波，振幅只有 8 级，采样率降到 1/6"""
    y = S.synth(m, d, 'square', 9000, 6000, 0.2, att=0.001, rel=0.01)
    y = np.round(y * 4) / 4
    y = np.repeat(y[::6], 6)[:len(y)]
    return y * level * 0.5


def lead(m, d):
    a = S.synth(m, d, 'square', 3800, 1800, 0.25, att=0.004, rel=0.08, det=0.004, vib=0.2) * 1.2
    b = ping(m + 12, 0.6, 0.25)
    n = max(len(a), len(b))
    return np.pad(a, (0, n - len(a))) + np.pad(b, (0, n - len(b)))


def pluck(m):
    return S.synth(m, 0.11, 'saw', 5200, 900, 0.035, dec=0.08, rel=0.03)


def glitter(d, density, m_lo=84, m_hi=108, level=1.0):
    n = int(d * S.SR)
    y = np.zeros(n)
    for _ in range(int(d * density)):
        i = int(rng.uniform(0, max(1, n - 4000)))
        p = ping(int(rng.uniform(m_lo, m_hi)), rng.uniform(0.2, 1.0), 0.05)
        y[i:i + len(p)] += p[:n - i]
    return y * level


def scan(d, f0, f1, level=1.0, q=0.18):
    t = S.tt(d)
    n = S.rng.standard_normal(len(t))
    out = np.zeros_like(t)
    seg = int(0.02 * S.SR)
    for i in range(0, len(t), seg):
        fc = f0 * (f1 / f0) ** (i / len(t))
        out[i:i + seg] = S.fft_filter(n[i:i + seg * 3], lo=fc * (1 - q), hi=fc * (1 + q))[:len(out[i:i + seg])]
    return out * np.sin(np.pi * t / d) ** 0.5 * level * 0.6


def stutter(f0, slice_frames, n, gain=1.0):
    """卡顿：把 f0 开始的一小段在所有音乐总线上重复 n 次"""
    i0, L = int(fr(f0) * S.SR), int(fr(slice_frames) * S.SR)
    for bus in (S.MUS, S.PUMP, S.LEAD):
        seg = bus[:, i0:i0 + L].copy()
        for k in range(1, n):
            a = i0 + k * L
            if a + L > bus.shape[1]:
                break
            bus[:, a:a + L] = seg * (gain ** k)


# —— 乐队 ——
BRK = [(TL['splat'][0], TL['toTerrain'][0]), (TL['implode'][1], TL['burst2'])]
# 开场的积蓄：12—90 只有底鼓（越来越响）和越滚越密的军鼓
for b in range(1, 3):
    S.place(S.kick(0.6 + 0.2 * b), fr(b * 30), 0.8); S.kicks.append(b * 30)
for k, fm in enumerate(np.arange(60, DROP, 3.75)):
    S.place(S.snare(1.0), fr(fm), 0.08 + 0.45 * (k / 8) ** 1.6, 0.1 * (-1) ** k, send=0.2)
S.sfx(S.riser(fr(DROP - 30), 0.9, 300, 9000), fr(30), 0.45)
S.drums(DROP, FIN, skip=BRK)
for fm in np.arange(DROP, FIN, 7.5):
    if not any(a <= fm < z for a, z in BRK):
        S.place(S.shaker(1.0), fr(fm), 1.3 if fm % 15 else 0.8, 0.35)
S.bassline(DROP, FIN, skip=BRK)
S.pad(1.1, fc=1700)
S.arp(DROP, FIN, 1.15, skip=BRK, inst=pluck, pattern=(0, 2, 4, 2, 1, 3, 5, 3))
# 落地拍上的和弦重击（每章第一拍），反拍上的短和弦
for at in [DROP, 120, 210, 300, 390, 480, 720, 1020]:
    S.place(stab([n + 12 for n in S.chord(at)[2]], 0.5, 1.0), fr(at), 0.22, 0.0, send=0.35, bus=S.PUMP)
for fm in np.arange(DROP + 15, FIN, 30):
    if not any(a <= fm < z for a, z in BRK) and not (570 <= fm < 720):
        S.place(stab([n + 12 for n in S.chord(fm)[2]], 0.12, 0.8, 5000), fr(fm), 0.1, 0.2 * (-1) ** int(fm // 30), send=0.15, bus=S.PUMP)
S.place(S.kick(1.4), fr(FIN), 1.0); S.kicks.append(FIN)
S.place(S.sbass(42, 1.6), fr(FIN), 0.55, bus=S.PUMP); S.place(S.sbass(54, 1.6), fr(FIN), 0.3, bus=S.PUMP)
S.place(S.crash(1.3), fr(FIN), 0.9, send=0.5)
S.place(stab([66, 69, 73, 78], 1.4, 1.0), fr(FIN), 0.3, send=0.5, bus=S.PUMP)

# 主旋律：一个四音的动机（C# F# E C#），每章跟着和弦变
HOOK = {
    90: [(0, 73, 1), (1, 78, 1), (2, 76, 1), (3, 73, 1)],
    120: [(0, 73, 1), (1, 78, 1), (2, 76, 1), (3, 73, 2), (5, 69, 1)], 165: [(0, 71, 1), (1, 76, 1), (2, 80, 2)],
    210: [(0, 74, 1), (1, 78, 1), (2, 81, 1), (3, 78, 1)], 255: [(0, 76, 1), (1, 81, 1), (2, 85, 2)],
    300: [(0, 78, 1), (1, 74, 1), (2, 71, 2)], 345: [(0, 77, 1), (1, 80, 1), (2, 83, 1), (3, 85, 1)],
    390: [(0, 73, 1), (1, 78, 1), (2, 76, 1), (3, 73, 1), (4, 81, 2)], 435: [(0, 78, 2), (2, 74, 2)],
    480: [(0, 76, 4)], 525: [(0, 76, 2), (2, 80, 2)],
    720: [(0, 73, 1), (1, 78, 1), (2, 76, 1), (3, 73, 1)], 780: [(0, 74, 1), (1, 78, 1), (2, 81, 2)], 840: [(0, 76, 1), (1, 81, 1), (2, 85, 2)],
    900: [(0, 80, 2), (2, 76, 2)],
    1020: [(0, 73, 1), (1, 78, 1), (2, 76, 1), (3, 73, 1)], 1050: [(0, 78, 6)],
}
for s0, notes in HOOK.items():
    S.hook(s0, notes, 1.0, inst=lead)
for t, up in ((120, False), (210, True), (300, False), (390, True), (480, False), (720, True)):
    S.transition(t, up, 0.8)

# —— 00：一个点 → 炸开 → 拼成标题 ——
for k in range(2):
    S.sfx(ping(90, 1.0, 0.1), fr(k * 6), 0.5, 0.0, send=0.5)
S.sfx(S.whoosh(0.2, 300, 6000, 0.8, 0.95), fr(0), 0.3)
at = TL['burst']
S.place(S.kick(1.5), fr(at), 1.0); S.kicks.append(at)
S.sfx(S.boom(1.1, 130, 34, 1.4), fr(at), 0.9)
S.place(S.crash(1.2), fr(at), 0.8, send=0.5)
S.sfx(glitter(1.4, 300, 79, 108, 1.0), fr(at), 0.55, 0.0, send=0.4)
S.sfx(S.whoosh(1.2, 8000, 300, 0.9, 0.12), fr(at), 0.55, send=0.3)
S.sfx(S.hit(1.0, 42), fr(DROP), 0.7, send=0.3)
S.sfx(scan(0.4, 7000, 900, 0.9), fr(DROP), 0.35, send=0.3)

# —— 01 House of Cards：每次错行 = 一次卡顿 + 一声 8-bit ——
S.sfx(S.choir([66, 69, 73], 1.5, 0.6), fr(124), 0.25, send=0.5)
for k, g in enumerate(TL['glitch']):
    S.sfx(bit(S.tone(g, k + 3, 1), 0.06, 1.0), fr(g), 0.45, (-1) ** k * 0.5)
    S.sfx(S.click(1.2, lo=2500, hi=11000, d=0.003), fr(g), 0.5, (-1) ** k * 0.5)
S.sfx(S.whoosh(0.9, 400, 8000, 1.0, 0.3), fr(TL['dissolve'][0]), 0.6, 0.5, send=0.3)
S.sfx(glitter(0.9, 180, 80, 104, 0.8), fr(TL['dissolve'][0] + 4), 0.4, 0.6, send=0.4)

# —— 02 激光雷达：每一圈开头一声声呐；转圈的嗡嗡声跟着方位角左右摆 ——
b0, b1 = TL['beam']
for k in range(2):
    S.sfx(sonar(78 + k * 2, 1.0), fr(b0 + k * (b1 - b0) / 2), 0.5, 0.0, send=0.5)
d = fr(b1 - b0)
t = S.tt(d)
hum = S.fft_filter(S.rng.standard_normal(len(t)), lo=1500, hi=3500) * (0.6 + 0.4 * np.sin(2 * np.pi * 7.5 * t)) * 0.25
ang = np.linspace(0, 4 * np.pi, len(t))
S.SFX[0, int(fr(b0) * S.SR):int(fr(b0) * S.SR) + len(t)] += hum * (0.5 + 0.5 * np.cos(ang)) * 0.6
S.SFX[1, int(fr(b0) * S.SR):int(fr(b0) * S.SR) + len(t)] += hum * (0.5 - 0.5 * np.cos(ang)) * 0.6
S.sfx(S.whoosh(0.8, 6000, 250, 0.9, 0.4), fr(TL['drain'][0]), 0.55, send=0.3)

# —— 03 楼梯：扫描声往下；体素化 = 一串 8-bit（十六分音符）——
S.sfx(scan(fr(360 - TL['sweep'][0]), 5000, 500, 0.9, 0.12), fr(TL['sweep'][0]), 0.45, send=0.3)
for k, fm in enumerate(np.arange(TL['voxel'][0], TL['voxel'][1] + 1, 3.75)):
    S.sfx(bit(S.tone(fm, k, 1), 0.05, 1.0), fr(fm), 0.35, -0.6 + 0.15 * k)
stutter(375, 3.75, 4, 0.9)

# —— 04 颜料墙：和弦全打开，一层亮片 ——
S.sfx(S.swell([66, 73, 78], 1.4, 0.8), fr(TL['flow'][0]), 0.3, send=0.6)
S.sfx(glitter(1.2, 90, 86, 108, 0.7), fr(TL['flow'][0] + 10), 0.3, send=0.5)
S.sfx(S.whoosh(0.7, 300, 5000, 0.8, 0.6), fr(TL['toBonsai'][0]), 0.45)

# —— 05 高斯泼溅：鼓停，只剩铺底在呼吸；点 → 面 = 一个慢慢打开的和弦 ——
S.sfx(S.swell([57, 64, 69, 73], 1.5, 1.0), fr(TL['splat'][0]), 0.45, send=0.6)
S.sfx(S.choir([69, 73, 76], 1.2, 0.7), fr(TL['focus'][0]), 0.25, send=0.6)
c0, c1 = TL['cursor']
brush = S.fft_filter(S.rng.standard_normal(int(fr(c1 - c0) * S.SR)), lo=1500, hi=7000) * 0.18
S.sfx(brush * np.sin(np.pi * np.linspace(0, 1, len(brush))) ** 0.5, fr(c0), 0.45, 0.0, send=0.2)
S.sfx(S.riser(fr(570 - 540), 0.9, 400, 8000), fr(540), 0.45)
for k, fm in enumerate(np.arange(554, 570, 3.75)):
    S.place(S.snare(1.0), fr(fm), 0.15 + 0.4 * (k / 4), 0.1 * (-1) ** k, send=0.2)

# —— 06 五条规则：一卡一记重拍，每张一个自己的声音 ——
for k, at in enumerate(TL['cards']):
    S.place(S.kick(1.3), fr(at), 1.0); S.kicks.append(at)
    S.place(stab([n + 12 for n in S.chord(at)[2]], 0.35, 1.0), fr(at), 0.25, -0.4 + 0.2 * k, send=0.4, bus=S.PUMP)
    S.sfx(S.hit(0.8, 42), fr(at), 0.4, send=0.3)
S.sfx(S.whoosh(0.5, 300, 7000, 0.8, 0.5), fr(570), 0.4)                                   # 近大远小：贴地飞过去
S.sfx(scan(0.45, 7000, 900, 0.9), fr(600), 0.4, send=0.3)                                  # 扫描面
for k in range(6):
    S.sfx(bit(S.tone(630, k, 1), 0.05, 1.0), fr(630 + k * 3.75), 0.4, -0.5 + 0.2 * k)     # 体素
for k in range(5):
    S.sfx(ping(S.tone(660, k + 2, 1), 0.9, 0.15), fr(660 + k * 3.75), 0.4, -0.5 + 0.25 * k, send=0.4)   # 色带：一串往上
S.sfx(S.fft_filter(S.rng.standard_normal(int(0.45 * S.SR)), lo=1500, hi=7000) * 0.25, fr(692), 0.5, 0.0)   # 拨开

# —— 07 手机 ——
S.sfx(S.whoosh(0.6, 5000, 400, 0.8, 0.7), fr(TL['mask'][0]), 0.45)
for k, fm in enumerate(np.arange(TL['pScan'][0], TL['pScan'][1], 5)):
    S.sfx(ping(S.tone(fm, k, 2), 0.7, 0.05), fr(fm), 0.22, -0.4 + 0.08 * k, send=0.3)
S.sfx(glitter(fr(TL['pDone'][0] - TL['pBuild'][0]), 200, 80, 106, 0.9), fr(TL['pBuild'][0]), 0.4, send=0.4)
for k, m in enumerate(S.chord(TL['pDone'][0])[2]):
    S.sfx(S.bell(m + 12, 0.8, 0.7), fr(TL['pDone'][0] + k * 3), 0.4, -0.3 + 0.3 * k, send=0.4)
for at, m in ((TL['tap1'], 85), (TL['tap2'], 90)):
    S.sfx(S.click(1.2, lo=1500, hi=6000, d=0.006), fr(at), 0.6)
    S.sfx(ping(m, 1.0, 0.2), fr(at), 0.4, send=0.4)
S.sfx(S.glide(78, 90, 0.2, 0.7), fr(TL['tap2']), 0.3)
S.sfx(S.click(1.2, lo=1500, hi=6000, d=0.006), fr(TL['place'][0]), 0.6)
S.sfx(S.thock(54, 1.0), fr(TL['place'][0] + 6), 0.5, send=0.3)

# —— 片尾：吸回一个点（倒放的风 + 上扬），空一拍只剩“嘀”，再炸开 ——
S.sfx(S.whoosh(0.8, 300, 7000, 0.8, 0.5), fr(TL['out'][0]), 0.4)
i0, L = int(fr(TL['implode'][0]) * S.SR), int(fr(TL['implode'][1] - TL['implode'][0]) * S.SR)
suck = S.whoosh(fr(TL['implode'][1] - TL['implode'][0]), 300, 9000, 1.0, 0.95)
S.sfx(suck, fr(TL['implode'][0]), 0.6, send=0.3)
S.sfx(S.riser2(fr(TL['implode'][1] - TL['implode'][0]), 1.0), fr(TL['implode'][0]), 0.5)
for k in range(2):
    S.sfx(ping(90, 1.0, 0.1), fr(TL['dot'][0] + 2 + k * 6), 0.5, 0.0, send=0.5)
at = TL['burst2']
S.place(S.kick(1.5), fr(at), 1.0); S.kicks.append(at)
S.sfx(S.boom(1.1, 130, 34, 1.4), fr(at), 0.9)
S.place(S.crash(1.2), fr(at), 0.8, send=0.5)
S.sfx(glitter(1.2, 300, 79, 108, 1.0), fr(at), 0.55, 0.0, send=0.4)
S.sfx(scan(0.45, 7000, 900, 0.9), fr(FIN), 0.35, send=0.3)

S.master(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), loop=False)
