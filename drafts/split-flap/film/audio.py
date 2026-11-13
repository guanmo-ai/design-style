"""翻牌显示 配乐。112.5 BPM（一拍 32 帧，一张牌 4 帧 = 三十二分音符）· D 小调。
机械、干、有律动：“嗒”声本身就是打击乐——每一块牌落定一声，取自页面算出来的落定时间（events.json 的 lands：每帧落定几块）。
乐队只有：很干的底鼓、原声贝斯（拨弦）、颤音琴。没有铺底的大合成器。
python3 audio.py out.wav（先 node ../../_lib/events.cjs film.html events.json）"""
import json
import re
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_lib'))
from song import Song  # noqa: E402

TL = json.loads(re.sub(r',\s*}', '}', re.sub(r'(\w+):', r'"\1":', re.sub(r'//[^\n]*', '', re.search(r'const TL = (\{.*?\});', (HERE / 'scenes.js').read_text(), re.S).group(1)))))
EV = json.loads((HERE / 'events.json').read_text())
END, B = TL['end'], 32
BAR = 4 * B
# 和弦：Dm9 – Bbmaj7 – Gm9 – A7sus→A7，每小节一个
PROG = [(38, [62, 65, 69, 72, 76]), (34, [62, 65, 69, 70, 74]), (31, [62, 65, 67, 70, 74]), (33, [61, 64, 67, 69, 76])]
CH = [(k * BAR, *PROG[k % 4]) for k in range(END // BAR + 2)]
S = Song(END, CH, beat=B, seed=11, tail=2.5)
fr = S.fr
rng = np.random.default_rng(5)


def pluck(m, d=0.6, level=1.0):
    """原声贝斯：Karplus–Strong 拨弦"""
    sr, f = S.SR, S.midi(m)
    n, p = int(d * sr), max(2, int(sr / f))
    buf = rng.uniform(-1, 1, p) * np.hanning(p)
    y = np.zeros(n)
    for i in range(n):
        y[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.996
    t = S.tt(d)
    y = S.fft_filter(y, hi=1400) + 0.35 * np.sin(2 * np.pi * f * t) * np.exp(-t / 0.35)
    return y * np.minimum(1, t / 0.003) * level


def vibes(ms, d=1.6, level=1.0):
    """颤音琴：正弦 + 4 倍泛音，慢的颤音"""
    t = S.tt(d)
    trem = 1 - 0.25 * (0.5 + 0.5 * np.sin(2 * np.pi * 5.2 * t))
    y = sum(np.sin(2 * np.pi * S.midi(m) * t) + 0.18 * np.sin(2 * np.pi * S.midi(m) * 4.0 * t) * np.exp(-t / 0.15) for m in ms)
    return y * np.exp(-t / 0.9) * np.minimum(1, t / 0.002) * trem * level / len(ms)


def click_bank(k=16):
    """一块牌落定的“嗒”：塑料片撞挡片——一下很短的带通噪声 + 一个木质的小音，每个音高略不同"""
    out = []
    for i in range(k):
        t = S.tt(0.045)
        n = S.fft_filter(rng.standard_normal(len(t)), lo=1800 + 200 * i, hi=9000) * np.exp(-t / 0.0018)
        f = 1100 + 90 * i
        b = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.006)
        out.append((n * 0.9 + b * 0.4) * np.minimum(1, t / 0.0002))
    return out


CL = click_bank()


def thock(level=1.0):
    """特写里的一块牌：更近、更大的“嗒”，带一点低频"""
    t = S.tt(0.12)
    n = S.fft_filter(rng.standard_normal(len(t)), lo=700, hi=7000) * np.exp(-t / 0.004)
    body = np.sin(2 * np.pi * 420 * t) * np.exp(-t / 0.02) + 0.6 * np.sin(2 * np.pi * 160 * t) * np.exp(-t / 0.04)
    return (n + body * 0.7) * np.minimum(1, t / 0.0003) * level


# —— 落定声：每帧落定几块就几声（多了取样、按 √n 加响）——
lands = EV['lands']
for f, n in enumerate(lands):
    if n <= 0 or f >= END + 40:
        continue
    k = min(n, 8)
    g = 0.11 * np.sqrt(n) / np.sqrt(k)
    for j in range(k):
        at = fr(f) + rng.uniform(0, 1 / 60)
        S.sfx(CL[int(rng.integers(0, len(CL)))], at, g * rng.uniform(0.6, 1.0), float(rng.uniform(-0.7, 0.7)), send=0.06)

# —— 特写里倒计时：每一张都是近处的一声 ——
for tk in TL['ticks']:
    S.sfx(thock(1.0), fr(tk + 4), 0.9, 0.15, send=0.2)

# —— 乐队 ——
kick_from, kick_to = TL['impact'], TL['lastLand'] - 8
for f in range(kick_from, kick_to, B):
    if TL['push1'] <= f < TL['pull0']:
        continue                       # 特写里只留牌的声音和贝斯
    S.place(S.kick(0.8), fr(f), 0.8); S.kicks.append(f)
for f in range(0, TL['lastLand'] - 8, B // 2):           # 贝斯：八分音符，根音 / 五度 / 八度
    root = S.chord(f)[1]
    step = (f // (B // 2)) % 4
    m = root + [0, 7, 12, 7][step] - 12 * (step == 0 and f % BAR == 0) * 0
    S.place(pluck(m, 0.45, 1.0), fr(f), 0.55 if step % 2 == 0 else 0.4, -0.1)
for k in range(0, TL['lastLand'], BAR):                  # 颤音琴：每小节一个和弦，第三拍补一个
    ms = S.chord(k)[2]
    S.place(vibes(ms[:4], 1.8), fr(k), 0.5, 0.25, send=0.35)
    S.place(vibes(ms[2:], 1.2), fr(k + 2 * B + B // 2), 0.28, 0.35, send=0.35)

# —— 动作 ——
S.place(S.kick(1.4), fr(TL['impact']), 1.0)                                       # 球砸到底边
S.sfx(S.whoosh(0.5, 200, 4000, 1.0, 0.7), fr(TL['impact'] - 26), 0.35)
S.sfx(S.whoosh(1.6, 300, 6000, 1.0, 0.85), fr(TL['push0'] + 20), 0.28)           # 推近
S.sfx(S.whoosh(1.6, 5000, 300, 1.0, 0.25), fr(TL['pull0']), 0.25)                # 拉远

# —— 收束：最后一块牌（“默”）单独落定 = 一声大的“嗒” + 低音 + 颤音琴的主和弦 ——
L = EV['last']
S.sfx(thock(1.3), fr(L), 1.0, 0.0, send=0.3)
S.place(pluck(26, 2.0, 1.2), fr(L), 0.9)
S.place(S.kick(1.2), fr(L), 0.9); S.kicks.append(int(L))
S.place(vibes([62, 65, 69, 74, 77], 2.4), fr(L), 0.8, 0.0, send=0.5)

# —— 画面上的字 ——
S.text_cues(EV['cues'], 0.8)

S.master(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), loop=False)
