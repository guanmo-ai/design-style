"""液态金属全片 · 第二版配乐（一整首歌，18 秒）。120 BPM（一拍 = 30 帧）· D 小调 · 合成器流行：八度贝斯、门控和弦、FM 玻璃钟主旋律。
一滴落地的重击 → 四个字一个个站起来（每个字一声上扬的“咕噜”，音越来越高）→ 第 90 帧全乐队进来。
每件作品一种招牌声音：鸟 = 金色的钟和弦；气球狗 = 十节“吱”（音高走和弦）；磁流体 = 每圈一记低音咆哮 + 颗粒噼啪；
云门 = 焊接火花 + 抛光的风；规则卡 = 一卡一记重拍；手机 = 轻；片尾落回水银、字再站起来。时间取自 timeline.js；文字的声音取自 events.json（node ../../_lib/events.cjs film.html events.json）。python3 audio.py out.wav"""
import json
import re
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_lib'))
from song import Song  # noqa: E402

TL = json.loads(re.sub(r'//[^\n]*', '', re.search(r'const TL = (\{.*?\});', (HERE / 'timeline.js').read_text(), re.S).group(1)))
DM, BB, F, C, GM, A7 = [62, 65, 69], [62, 65, 70], [60, 65, 69], [60, 64, 67], [62, 67, 70], [61, 64, 67, 69]
CH = [(0, 38, DM), (90, 34, BB), (122, 38, DM), (160, 41, F), (214, 34, BB), (259, 36, C), (304, 43, GM), (346, 33, A7),
      (390, 41, F), (420, 36, C), (448, 34, BB), (480, 38, DM), (510, 34, BB), (540, 41, F), (570, 36, C), (600, 33, A7),
      (630, 38, DM), (690, 34, BB), (750, 41, F), (810, 36, C), (870, 38, DM), (900, 34, BB), (960, 36, C), (1020, 38, DM)]
END = TL['end']
S = Song(END, CH, seed=41)
fr = S.fr
rng = np.random.default_rng(5)
FIN = TL['final']


def plink(m, level=1.0, dec=0.22):
    """一滴水银的“叮”：高音正弦 + 一点往下滑的音高"""
    t = S.tt(dec * 3)
    f0 = S.midi(m)
    f = f0 * (1 + 0.35 * np.exp(-t / 0.012))
    y = np.sin(2 * np.pi * np.cumsum(f) / S.SR) + 0.25 * np.sin(2 * np.pi * np.cumsum(f * 2.01) / S.SR) * np.exp(-t / 0.03)
    return y * np.minimum(1, t / 0.0008) * np.exp(-t / dec) * level * 0.45


def gloop(m0, m1, d=0.18, level=1.0):
    """融合的“咕噜”：低音正弦滑下去 + 一点共振"""
    t = S.tt(d + 0.15)
    f = S.midi(m0) * (S.midi(m1) / S.midi(m0)) ** np.minimum(1, t / d)
    y = np.sin(2 * np.pi * np.cumsum(f) / S.SR) * (1 + 0.4 * np.sin(2 * np.pi * 28 * t))
    return np.tanh(y * 1.4) * np.sin(np.pi * np.minimum(1, t / (d + 0.15))) ** 0.6 * level * 0.5


def splash(level=1.0, d=0.5):
    """溅水：带通噪声，亮起来再暗下去"""
    t = S.tt(d)
    n = S.fft_filter(S.rng.standard_normal(len(t)), lo=900, hi=9000)
    return n * np.exp(-t / 0.09) * (1 - np.exp(-t / 0.004)) * level * 0.35


def crackle(d, density, level=1.0):
    """磁流体的颗粒声：一串随机的小咔哒"""
    n = int(d * S.SR)
    y = np.zeros(n)
    for k in range(int(d * density)):
        i = int(rng.uniform(0, n - 200))
        c = S.click(1.0, lo=2500, hi=11000, d=0.002)
        y[i:i + len(c)] += c[:n - i] * rng.uniform(0.3, 1.0)
    return y * level


def fm_bell(m, level=1.0, dec=1.2):
    """玻璃钟：FM，泛音是 3.5 倍"""
    t = S.tt(dec * 2.5)
    f = S.midi(m)
    y = np.sin(2 * np.pi * f * t + 2.2 * np.exp(-t / 0.25) * np.sin(2 * np.pi * f * 3.5 * t))
    return y * np.exp(-t / dec) * np.minimum(1, t / 0.002) * level * 0.4


def lead(m, d):
    y = fm_bell(m, 1.0, max(0.35, d * 1.6)) * 1.6
    c = S.celesta(m + 12, max(d, 0.3), 0.5) * 1.2
    n = max(len(y), len(c))
    return np.pad(y, (0, n - len(y))) + np.pad(c, (0, n - len(c)))


def pluck(m):
    return S.synth(m, 0.1, 'square', 4200, 700, 0.04, dec=0.08, rel=0.03)


# —— 新音色 ——
def squeak(m, level=1.0, d=0.12):
    """气球“吱”：正弦，音高往上一挑，带快速颤音"""
    t = S.tt(d)
    f = S.midi(m) * (1 + 0.06 * np.minimum(1, t / 0.03)) * (1 + 0.02 * np.sin(2 * np.pi * 38 * t))
    y = np.sin(2 * np.pi * np.cumsum(f) / S.SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / S.SR)
    return y * np.sin(np.pi * t / d) ** 0.5 * level * 0.4


def growl(m, level=1.0, d=0.35):
    """磁流体的低音咆哮：FM 锯齿，调制越来越弱"""
    t = S.tt(d)
    f = S.midi(m)
    y = np.sin(2 * np.pi * f * t + 3.0 * np.exp(-t / 0.12) * np.sin(2 * np.pi * f * 2 * t))
    return np.tanh(y * 2) * np.exp(-t / 0.18) * np.minimum(1, t / 0.003) * level * 0.5


def stab(ms, d=0.16, level=1.0):
    y = None
    for m in ms:
        for dv in (-0.1, 0.0, 0.1):
            v = S.synth(m + dv, d, 'saw', 6000, 900, 0.05, att=0.002, rel=0.06)
            y = v if y is None else (np.pad(y, (0, max(0, len(v) - len(y)))) + np.pad(v, (0, max(0, len(y) - len(v)))))
    return np.tanh(y * 0.5) * level


def stutter(f0, slice_frames, n, gain=1.0):
    i0, L = int(fr(f0) * S.SR), int(fr(slice_frames) * S.SR)
    for bus in (S.MUS, S.PUMP, S.LEAD):
        seg = bus[:, i0:i0 + L].copy()
        for k in range(1, n):
            a = i0 + k * L
            if a + L > bus.shape[1]:
                break
            bus[:, a:a + L] = seg * (gain ** k)


# —— 乐队：字站稳（90）全乐队进来；云门底下（448—480）和最后一滴落下前（930—966）留空 ——
BRK = [(448, 480), (930, 966)]
for k, g in enumerate(TL['glyphs']):
    S.place(S.kick(0.6 + 0.15 * k), fr(g + 10), 0.8); S.kicks.append(g + 10)
for k, fm in enumerate(np.arange(72, 90, 3.75)):
    S.place(S.snare(1.0), fr(fm), 0.12 + 0.4 * (k / 4) ** 1.4, 0.1 * (-1) ** k, send=0.2)
S.drums(90, FIN, skip=BRK)
for fm in np.arange(90, FIN, 7.5):
    if not any(a <= fm < z for a, z in BRK):
        S.place(S.shaker(1.0), fr(fm), 1.2 if fm % 15 else 0.7, -0.35)
S.bassline(90, FIN, skip=BRK)
S.pad(1.1, fc=1400)
S.arp(122, FIN, 1.0, skip=BRK, inst=pluck, pattern=(0, 2, 1, 3, 2, 4, 3, 1))
for at in [90, 122, 214, 304, 390, 630, 1020]:
    S.place(stab([n + 12 for n in S.chord(at)[2]], 0.5, 1.0), fr(at), 0.2, 0.0, send=0.35, bus=S.PUMP)
for fm in np.arange(105, FIN, 30):
    if not any(a <= fm < z for a, z in BRK) and not (480 <= fm < 630):
        S.place(stab([n + 12 for n in S.chord(fm)[2]], 0.12, 0.8), fr(fm), 0.09, 0.2 * (-1) ** int(fm // 30), send=0.15, bus=S.PUMP)
S.place(S.kick(1.3), fr(FIN), 1.0); S.kicks.append(FIN)
S.place(S.sbass(38, 1.6), fr(FIN), 0.5, bus=S.PUMP); S.place(S.sbass(50, 1.6), fr(FIN), 0.3, bus=S.PUMP)
S.place(S.crash(1.2), fr(FIN), 0.9, send=0.5)
for k, m in enumerate([74, 77, 81, 86, 89]):
    S.place(fm_bell(m, 1.0, 1.4), fr(FIN + k * 3), 0.5, -0.4 + 0.2 * k, send=0.45)

HOOK = {
    90: [(0, 74, 1), (1, 77, 1), (2, 81, 1), (3, 79, 1)],
    122: [(0, 81, 1), (1, 77, 1), (2, 74, 2)], 160: [(0, 77, 1), (1, 81, 1), (2, 84, 2)],
    214: [(0, 82, 1), (1, 86, 1), (2, 89, 1), (3, 86, 1)], 259: [(0, 84, 1), (1, 79, 1), (2, 76, 2)],
    304: [(0, 79, 1), (1, 74, 1), (2, 70, 2)], 346: [(0, 76, 1), (1, 79, 1), (2, 81, 1), (3, 85, 1)],
    390: [(0, 81, 2), (2, 84, 2)], 420: [(0, 84, 1), (1, 88, 1), (2, 91, 2)],
    630: [(0, 74, 1), (1, 77, 1), (2, 81, 2)], 690: [(0, 82, 2), (2, 77, 2)], 750: [(0, 81, 1), (1, 84, 1), (2, 89, 2)], 810: [(0, 88, 2), (2, 84, 2)], 870: [(0, 86, 1), (1, 81, 1), (2, 77, 2)],
    900: [(0, 82, 2), (2, 86, 2)], 966: [(0, 84, 1), (1, 88, 1), (2, 91, 2)], 1020: [(0, 86, 4)], 1050: [(0, 86, 8)],
}
for s0, notes in HOOK.items():
    S.hook(s0, notes, 1.0, inst=lead)
for t, up in ((122, True), (214, False), (304, True), (390, False), (630, True)):
    S.transition(t, up, 0.8)

# —— 00：一滴 → 重击 → 四个字一个个站起来 ——
S.sfx(S.glide(93, 81, fr(TL['dropHit'] + 12), 0.5), 0, 0.25, 0.1, send=0.4)
for at in (TL['dropHit'], TL['drop2'][1]):
    S.place(S.kick(1.4), fr(at), 1.0); S.kicks.append(at)
    S.sfx(S.boom(1.0, 110, 34, 1.1), fr(at), 0.9)
    S.sfx(splash(1.0), fr(at), 0.8, 0.0, send=0.3)
    S.place(S.crash(1.0), fr(at), 0.7, send=0.4)
    for k in range(6):
        S.sfx(plink(S.tone(at, k + 3, 2), 0.8), fr(at + 18 + k * 4 + rng.uniform(0, 3)), 0.22, float(rng.uniform(-0.7, 0.7)), send=0.4)
for gs in (TL['glyphs'], TL['glyphs2']):
    for k, g in enumerate(gs):
        S.sfx(gloop(38 + k * 5, 50 + k * 5, 0.22, 0.9), fr(g), 0.5, -0.6 + 0.4 * k)
        S.sfx(plink(S.tone(g, k + 2, 2), 1.0, 0.3), fr(g + 8), 0.3, -0.6 + 0.4 * k, send=0.4)
S.sfx(gloop(55, 36, 0.3, 1.0), fr(TL['melt'][0] + 6), 0.6)

# —— 01 鸟：底座 / 细脖 / 身子一节节长上去，金色的钟和弦 ——
for k, at in enumerate(TL['birdParts']):
    S.sfx(S.thock(50 + k * 7, 1.0), fr(at), 0.55, send=0.2)
S.sfx(S.glide(50, 86, 0.6, 0.6), fr(TL['birdParts'][2]), 0.3, send=0.3)
for k, m in enumerate(S.chord(TL['birdTop'])[2] + [S.chord(TL['birdTop'])[2][0] + 12]):
    S.sfx(fm_bell(m + 12, 1.0, 1.2), fr(TL['birdTop'] - 20 + k * 3.75), 0.4, -0.4 + 0.25 * k, send=0.5)
S.sfx(plink(88, 1.0, 0.3), fr(TL['tipDrop'][0]), 0.4, 0.2, send=0.4)
S.sfx(S.glide(88, 64, 0.4, 0.5), fr(TL['tipDrop'][0] + 2), 0.2)
S.sfx(gloop(43, 31, 0.3, 0.9), fr(TL['birdMelt'][0]), 0.5)
S.sfx(splash(0.8), fr(212), 0.6, send=0.3)

# —— 02 气球狗：十节“吱”，音高走和弦；最后漏气 ——
for k, at in enumerate(TL['dogPops']):
    S.sfx(squeak(S.tone(at, k, 1), 1.0), fr(at), 0.5, -0.6 + 0.12 * k, send=0.25)
    S.sfx(S.click(0.8, lo=1500, hi=7000, d=0.003), fr(at), 0.35)
d = fr(TL['deflate'][1] - TL['deflate'][0])
t = S.tt(d); pf = S.midi(79) * np.exp(-t / 0.18) + 120
pff = np.sin(2 * np.pi * np.cumsum(pf) / S.SR) * 0.3 + S.fft_filter(S.rng.standard_normal(len(t)), lo=600, hi=3000) * 0.4
S.sfx(pff * np.exp(-t / 0.2), fr(TL['deflate'][0]), 0.5)

# —— 03 磁流体：每圈一记低音 + 颗粒噼啪 ——
for k, at in enumerate(TL['rings']):
    S.sfx(growl(S.chord(at)[1] + 12 + [0, 3, 7, 12, 15][k], 1.0), fr(at), 0.55, send=0.2)
    S.sfx(crackle(0.25, 120, 0.6), fr(at), 0.35, (-1) ** k * 0.4)
S.sfx(S.swell([55, 62, 67], 0.6, 0.6), fr(TL['retract'][0]), 0.3, send=0.4)
S.sfx(S.glide(43, 62, 0.35, 0.6), fr(TL['retract'][0] + 4), 0.3)

# —— 04 云门：焊缝一条条亮起（火花），然后抛光（风往上扫），城市的钟 ——
for k, fm in enumerate(np.arange(TL['seams'][0], TL['seams'][1], 3.75)):
    S.sfx(crackle(0.08, 300, 1.0), fr(fm), 0.3, float(np.sin(k * 1.3)) * 0.6)
    S.sfx(S.click(1.0, lo=4000, hi=12000, d=0.002), fr(fm), 0.3, float(np.sin(k * 1.3)) * 0.6)
S.sfx(S.whoosh(fr(TL['polish'][1] - TL['polish'][0]), 400, 9000, 0.9, 0.7), fr(TL['polish'][0]), 0.45, send=0.4)
S.sfx(S.shimmer(1.0, 0.8), fr(TL['polish'][1] - 10), 0.35, send=0.5)
S.sfx(S.swell([65, 69, 72, 76], 1.2, 0.9), fr(TL['under'][0]), 0.4, send=0.6)
S.sfx(S.riser(fr(480 - 452), 0.9, 400, 9000), fr(452), 0.45)

# —— 05 五条规则（第四版）：对标片一卡一声——吸气 → 音乐挖空 2 帧 → 一记很低很干净的重击（song.py 的 cards）；
# 每张自己的小声音压到重击下面（× 0.6），不再一卡叠底鼓 + 和弦 + 冲击 + 倒放镲 + 砸字
S.cards(TL['cards'], 1.0)
G = 0.6
S.sfx(S.glide(60, 72, 0.25, 0.6), fr(484), 0.3 * G); S.sfx(gloop(50, 31, 0.22, 1.0), fr(497), 0.6 * G)    # 融合
S.sfx(S.whoosh(0.45, 300, 7000, 0.9, 0.5), fr(514), 0.45 * G, send=0.3)                                 # 倒影
S.sfx(S.shimmer(0.5, 0.8), fr(544), 0.4 * G, send=0.5)                                                   # 菲涅尔
for k, m in enumerate([86, 81, 77, 74, 69]):
    S.sfx(plink(m, 1.0, 0.25), fr(588 + k * 1.5), 0.4 * G, -0.6 + 0.3 * k, send=0.4)                     # 断开
t = S.tt(0.5); boing = np.sin(2 * np.pi * np.cumsum(S.midi(55) * (1 + 0.25 * np.exp(-t / 0.1) * np.cos(2 * np.pi * 5.2 * t))) / S.SR) * np.exp(-t / 0.2)
S.sfx(boing * 0.4, fr(606), 0.6 * G)                                                                    # 回弹
S.sfx(S.whoosh(0.7, 5000, 400, 0.8, 0.7), fr(TL['mask'][0]), 0.45)

# —— 06 界面 ——
S.sfx(S.swell([62, 69, 74], 1.0, 0.6), fr(TL['idle'][0]), 0.25, send=0.5)
S.sfx(S.click(1.2, lo=1500, hi=6000, d=0.006), fr(TL['tapMic']), 0.7)
SYL = [TL['words'][0] + k * 4.2 + (3 if k > 6 else 0) for k in range(13)]
for k, at in enumerate(SYL):
    n = S.fft_filter(S.rng.standard_normal(int(0.07 * S.SR)), lo=500 + 300 * (k % 3), hi=2600 + 400 * (k % 2))
    S.sfx(n * np.hanning(len(n)) * 0.3, fr(at), 0.5, 0.0, send=0.2)
S.sfx(crackle(fr(TL['answer'][0] - TL['listen'][0]), 70, 0.5), fr(TL['listen'][0]), 0.35, 0.2, send=0.2)
S.sfx(S.glide(50, 62, 0.15, 0.6), fr(TL['listen'][0]), 0.35)
S.sfx(S.glide(62, 50, 0.2, 0.6), fr(TL['answer'][0]), 0.35)
for k, (e, l) in enumerate(zip(TL['emit'], TL['land'])):
    S.sfx(plink(S.tone(e, k + 4, 2), 0.9), fr(e), 0.35, -0.3 + 0.2 * k, send=0.3)
    S.sfx(S.thock(60 + [0, 4, 7][k], 0.8), fr(l), 0.45)
S.sfx(S.click(1.2, lo=1500, hi=6000, d=0.006), fr(TL['tapChip']), 0.7)
S.sfx(S.glide(67, 79, 0.25, 0.7), fr(TL['back'][0]), 0.35)
S.sfx(gloop(55, 43, 0.14, 0.8), fr(TL['back'][1]), 0.4)
for k, m in enumerate([81, 86]):
    S.sfx(fm_bell(m, 1.0, 0.8), fr(TL['toast'] + k * 4), 0.4, send=0.4)

# —— 07 落回去 ——
S.sfx(S.whoosh(0.7, 400, 5000, 0.8, 0.4), fr(TL['out'][0]), 0.45)
S.sfx(S.glide(74, 55, 0.6, 0.7), fr(TL['out'][0] + 6), 0.3)
S.sfx(S.boom(0.8, 90, 32, 0.9), fr(945), 0.5)
S.sfx(splash(0.8), fr(945), 0.6, send=0.3)
S.sfx(S.glide(93, 81, fr(TL['drop2'][1] - TL['drop2'][0]), 0.5), fr(TL['drop2'][0]), 0.25, -0.1, send=0.4)
stutter(TL['drop2'][1] - 8, 3.75, 2, 0.7)

# —— 文字：每个字落定一声“嗒”，标题是键帽声，规则卡大字是倒放镲 + 砸字（cue 由 film.html 空跑 HUD 导出到 events.json）——
S.text_cues(json.loads((HERE / 'events.json').read_text())['cues'], 1.0)

S.master(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), loop=False)
