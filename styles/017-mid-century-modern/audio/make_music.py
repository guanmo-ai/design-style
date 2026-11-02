"""
Design Style · 风格 017 · 中世纪现代 Mid-Century Modern —— 配乐与音效（第三版，纯代码合成，无外部音源）

主人反馈：第二版“太一般，没有震撼感”。对照 003 / 004 的配乐：它们都是一整首有鼓、有贝斯、有铜管或主旋律的歌，
换幕前有军鼓滚奏 + 上扬，换幕那一拍是“底鼓 + 低频 + 镲 + 铜管齐奏”的重击。第三版照这个做，风格换成
50 年代片头爵士（Elmer Bernstein《金臂人》、Henry Mancini《Peter Gunn》）：

  144 BPM（1 拍 = 25 帧）· F 小调布鲁斯 · 直八分
  · 一条推着走的固定音型：电贝斯 + 上方八度的上低音萨克斯齐奏 F F G F A♭ F B♭ A♭（每章换一个根音：F → B♭ → F → C → F）
  · 鼓：1、3 拍底鼓，2、4 拍军鼓，八分音符闭镲（短，不拖尾）；镲片只在换章重击时出现
  · 大乐队铜管齐奏：换章重击、每个年份大字一下、MODERN 每个字母一下、五张规则卡一张一下
  · 加弱音器的小号吹主题（规则段），颤音琴给球和窗户的亮点
  · 每次换章前两拍：军鼓十六分音符滚奏渐强 + 上扬 → 重击（底鼓 + 低频 + 镲 + 铜管 + 贝斯长音）
  · 音效都短、都有音高：纸落地 = 低“噗”、翻面 = “嘶”、换纸 = 一下“唰”、碎片 = 细碎的“叮”、按钮 = “嗒”
  · 贝斯 / 萨克斯 / 铜管跟着底鼓“泵”（侧链）

小节从第 25 帧开始（每小节 100 帧），换章重击全部落在小节第一拍：125 / 225 / 325 / 425 / 525；
O = 75（第 3 拍）；按下播放键 = 600；规则卡 675—775 一拍一张；900 帧 = 9 小节，余音折回第 0 帧。

用法：python3 styles/017-mid-century-modern/audio/make_music.py
输出：public/017-mid-century-modern/music.wav（响度 −14 LUFS，峰值 < −1.5 dBFS）
"""
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'scripts'))
from lib.audio import AudioKit  # noqa: E402

DURATION = 900
audio = AudioKit(duration=DURATION / 60, seed=17, fps=60)
SR = audio.SR
BEAT, E8, S16 = 25, 12.5, 6.25
fr, place, sfx, tt, midi, filt = audio.fr, audio.place, audio.sfx, audio.tt, audio.midi, audio.fft_filter
rng = np.random.default_rng(1955)

PUMP = np.zeros_like(audio.MUS)  # 跟着底鼓泵的总线：贝斯、萨克斯、铜管
KICKS: list[float] = []


def noise(d):
    return rng.standard_normal(int(d * SR))


def env(t, att, dec):
    return np.minimum(1, t / att) * np.exp(-t / dec)


def additive(f0, d, nh=24, kc0=12.0, kc1=2.0, kdec=0.08, att=0.004, dec=None, rel=0.05, voices=1, detune=0.0, vib=0.0, odd=0.0):
    """加法合成的锯齿：截止所在的谐波号从 kc0 按 kdec 落到 kc1（滤波包络），可多声部微失谐、可加颤音"""
    t = tt(d + rel)
    kc = kc1 + (kc0 - kc1) * np.exp(-t / kdec)
    y = np.zeros_like(t)
    for v in range(voices):
        det = 0.0 if voices == 1 else (v / (voices - 1) - 0.5) * 2 * detune
        f = f0 * (1 + det)
        ph = 2 * np.pi * np.cumsum(f * (1 + vib * np.sin(2 * np.pi * 5.2 * t) * np.clip((t - 0.1) / 0.15, 0, 1))) / SR
        p0 = rng.random() * 6.283
        for h in range(1, nh + 1):
            if f * h > 14000:
                break
            a = (1.0 / h) * ((1 - odd) if h % 2 == 0 else 1.0)
            y += np.sin(h * (ph + p0)) * a * np.exp(-(h - 1) / kc)
    y /= voices
    e = np.minimum(1, t / att)
    if dec:
        e = e * np.exp(-t / dec)
    e = e * np.where(t < d, 1, np.exp(-(t - d) / (rel / 3)))
    return y * e


# ───────── 鼓 ─────────
def kick(level=1.0):
    t = tt(0.4)
    f = 46 + 110 * np.exp(-t / 0.03)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)
    click = filt(noise(0.4), lo=2500) * np.exp(-t / 0.0025) * 0.22
    return np.tanh((body + click) * 1.5) * level * 0.9


def snare(level=1.0):
    t = tt(0.22)
    body = np.sin(2 * np.pi * np.cumsum(190 + 60 * np.exp(-t / 0.01)) / SR) * np.exp(-t / 0.045)
    n = filt(noise(0.22), lo=1500, hi=7500) * np.exp(-t / 0.055)
    return (0.6 * body + 0.75 * n / (np.abs(n).max() + 1e-9)) * level * 0.7


def hat(level=1.0, dec=0.016):
    t = tt(0.08)
    n = filt(noise(0.08), lo=7000)
    return n / (np.abs(n).max() + 1e-9) * env(t, 0.0008, dec) * level * 0.22


def crash(level=1.0, d=1.6):
    t = tt(d)
    n = filt(noise(d), lo=4000, hi=12000)
    n /= np.abs(n).max() + 1e-9
    return n * np.minimum(1, t / 0.002) * (0.5 * np.exp(-t / 0.09) + 0.5 * np.exp(-t / 0.55)) * level * 0.5


def sub(level=1.0):
    """重击的低频：38 Hz 起的“咚”"""
    t = tt(0.9)
    f = 36 + 80 * np.exp(-t / 0.06)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.32) * 1.6) * level * 0.8


KICK, SNARE, HAT, CRASH, SUB = kick(), snare(), hat(), crash(), sub()


def kick_at(f, level=1.0):
    place(KICK * level, fr(f))
    KICKS.append(f)


# ───────── 乐器 ─────────
def ebass(m, d=0.16, level=1.0):
    """电贝斯：亮的起音、很快变暗；8 分音符固定音型用"""
    y = additive(midi(m), d, nh=14, kc0=9, kc1=2.2, kdec=0.05, att=0.003, dec=0.4, rel=0.03)
    return np.tanh(y * 2.2) * level * 0.5


def bari(m, d=0.15, level=1.0):
    """上低音萨克斯：两声部微失谐的锯齿，带一点咬；和贝斯齐奏高一个八度"""
    y = additive(midi(m), d, nh=20, kc0=10, kc1=4, kdec=0.06, att=0.008, dec=0.6, rel=0.04, voices=2, detune=0.004)
    return np.tanh(y * 2.6) * level * 0.3


def brass(notes, d=0.22, level=1.0, bright=1.0):
    """大乐队铜管齐奏（“哒！”）：每个音 3 个微失谐的锯齿声部，滤波包络从亮到暗"""
    out = None
    for m in notes:
        y = additive(midi(m), d, nh=28, kc0=4 + 12 * bright, kc1=2.4 + 2 * bright, kdec=0.07, att=0.006, voices=3, detune=0.005, dec=0.5, rel=0.09)
        out = y if out is None else out[:min(len(out), len(y))] + y[:min(len(out), len(y))]
    return np.tanh(out / max(1, len(notes)) * 2.4) * level * 0.42


def trumpet(m, d=0.3, level=1.0):
    """加弱音器的小号：偏窄的谐波 + 颤音"""
    y = additive(midi(m), d, nh=16, kc0=7, kc1=4.5, kdec=0.1, att=0.02, rel=0.08, vib=0.006, odd=0.35)
    return filt(np.tanh(y * 2), lo=500, hi=5000) * level * 0.32


def vibe(m, level=1.0, dec=0.9):
    f = midi(m)
    t = tt(dec * 2.5)
    y = np.sin(2 * np.pi * f * t) + 0.2 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t / 0.2)
    return y * (1 - 0.25 * (0.5 - 0.5 * np.cos(2 * np.pi * 5.5 * t))) * env(t, 0.003, dec) * level * 0.15


def marimba(m, level=1.0):
    f = midi(m)
    t = tt(0.4)
    return (np.sin(2 * np.pi * f * t) * env(t, 0.002, 0.14) + 0.35 * np.sin(2 * np.pi * 3.9 * f * t) * env(t, 0.001, 0.03)) * level * 0.2


# ───────── 音效（短、有音高） ─────────
def slap(level=1.0, f0=150):
    """纸落到桌上：低“噗” + 8 毫秒的纸声"""
    t = tt(0.12)
    body = np.sin(2 * np.pi * np.cumsum(f0 * 0.5 + f0 * 0.5 * np.exp(-t / 0.012)) / SR) * np.exp(-t / 0.035)
    paper = filt(noise(0.12), lo=1800, hi=7000) * np.exp(-t / 0.008)
    return (body * 0.8 + paper / (np.abs(paper).max() + 1e-9) * 0.35) * level * 0.5


def fwip(level=1.0):
    """纸翻面：一下短的“嘶”，从低往高扫"""
    d = 0.09
    t = tt(d)
    x = noise(d)
    y = audio.sweep(x, 800, 7000)
    return y / (np.abs(y).max() + 1e-9) * np.sin(np.pi * t / d) ** 2 * level * 0.25


def swoosh(d=0.3, level=1.0):
    """一整张纸拍进来：低通噪声从暗到亮再到暗，平滑的“唰”"""
    t = tt(d)
    x = noise(d)
    y = audio.sweep(x, 300, 5000)
    return y / (np.abs(y).max() + 1e-9) * np.sin(np.pi * t / d) ** 1.6 * level * 0.35


def riser(d, level=1.0):
    t = tt(d)
    u = t / d
    n = audio.sweep(noise(d), 500, 9000)
    tone = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (2 * u)) / SR) * 0.3
    return (n / (np.abs(n).max() + 1e-9) * 0.6 + tone) * u ** 2.2 * level * 0.35


def tink(m, level=1.0):
    f = midi(m)
    t = tt(0.25)
    return np.sin(2 * np.pi * f * t) * env(t, 0.001, 0.05) * level * 0.12


def button(level=1.0):
    t = tt(0.08)
    return (np.sin(2 * np.pi * 1800 * t) * np.exp(-t / 0.01) + np.sin(2 * np.pi * 600 * t) * np.exp(-t / 0.02)) * level * 0.25


# ───────── 和声与固定音型 ─────────
RIFF = [0, 0, 2, 0, 3, 0, 5, 3]  # F F G F A♭ F B♭ A♭（相对根音，半音：0 0 2 0 3 0 5 3 → 再加小三度、四度）
RIFF_ST = [0, 0, 2, 0, 3, 0, 5, 3]
ROOTS = {'F': 41, 'Bb': 46, 'C': 36}
CH = {'F': [56, 60, 63, 65, 68], 'Bb': [56, 61, 62, 65, 68], 'C': [55, 58, 61, 64, 67], 'Db': [56, 60, 61, 65, 68]}  # 铜管的 7♯9 / 9 音位
# 每小节（从第 25 帧起）的和弦：小节 0 = −75…25（片尾的最后一小节，接回开头）
BAR_CH = ['F', 'F', 'F', 'Bb', 'F', 'C', 'F', 'F', 'C']


def bar_of(f):
    return int((f - 25) // 100) % 9 if f >= 25 else 8


def chord_at(f):
    return BAR_CH[bar_of(f)]


HITS = [125, 225, 325, 425, 525]  # 换章重击（小节第一拍）
BIG = 75  # O
PRESS = 600
CARDS = [675, 700, 725, 750, 775]
OUT = 826


def hit(f, level=1.0, crash_=1.0):
    kick_at(f, 1.0)
    sfx(SUB * level, fr(f), send=0.1)
    place(CRASH * crash_, fr(f), pan=0.2, send=0.25)
    place(brass(CH[chord_at(f)], 0.32, 1.0, 1.0) * level, fr(f), send=0.3, bus=PUMP)
    place(ebass(ROOTS[chord_at(f)] - 12, 0.6, 1.2), fr(f), bus=PUMP)


def build(f, beats=2, level=1.0):
    """换章前：军鼓十六分音符滚奏渐强 + 上扬，落在 f"""
    n = int(beats * 4)
    for k in range(n):
        place(SNARE * (0.25 + 0.75 * (k / n) ** 1.5) * level, fr(f - (n - k) * S16), pan=-0.15)
    sfx(riser(fr(beats * BEAT), 0.8 * level), fr(f - beats * BEAT), send=0.2)


# ───────── 节奏组：全片一直在跑（规则段后半和片尾留一口气） ─────────
for b in range(-3, 36):
    f = 25 + b * BEAT
    if f < -75 or f >= DURATION:
        continue
    beat = b % 4
    if beat in (0, 2):
        kick_at(f, 0.85)
    if beat in (1, 3):
        place(SNARE * 0.75, fr(f), pan=-0.1, send=0.12)
    for e8 in (0, E8):
        place(HAT * (1.0 if e8 == 0 else 0.7), fr(f + e8), pan=0.3)

# 固定音型：贝斯 + 萨克斯（高八度），每个八分音符一下
for k in range(-6, int(DURATION / E8)):
    f = 25 + k * E8
    root = ROOTS[chord_at(f)]
    m = root + RIFF_ST[k % 8]
    place(ebass(m, 0.14, 1.0), fr(f), bus=PUMP)
    place(bari(m + 12, 0.13, 0.9), fr(f), pan=-0.25, bus=PUMP, send=0.08)

# ───────── 开场：海报（0—125） ─────────
kick_at(0, 1.0)  # 第 0 帧：辐条从钟心炸开
place(brass(CH['F'], 0.18, 0.8, 0.8), fr(0), send=0.25, bus=PUMP)
for i in range(12):  # 辐条
    sfx(fwip(0.6), fr(-5 + 0.9 * i), pan=-0.6 + 0.1 * i)
PENTA = [65, 68, 70, 72, 75, 77, 80, 82, 84, 87, 89, 92]
for i in range(12):  # 12 颗球：颤音琴往上刷
    place(vibe(PENTA[i], 0.6, 0.6), fr(2 + 2.5 * i), pan=-0.6 + 0.1 * i, send=0.25)
    sfx(slap(0.35, 260), fr(2 + 2.5 * i), pan=-0.6 + 0.1 * i)
for i, f in enumerate([22 + 2 * k for k in range(4)] + [30 + 2 * k for k in range(7)]):  # MID- / CENTURY
    place(marimba(72 + [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24][i], 0.45), fr(f), pan=-0.5 + 0.05 * i)
    sfx(slap(0.25, 220), fr(f))
for k, f in enumerate([37.5, 43.75, 50, 56.25, 62.5]):  # MODERN：铜管一级级往上
    place(brass([n + [0, 2, 3, 5, 7][k] for n in CH['F'][:3]], 0.14, 0.7, 0.9), fr(f), send=0.2, bus=PUMP)
    sfx(slap(0.7, 120), fr(f))
build(BIG, 1, 0.7)
hit(BIG, 1.25, 1.0)  # O
sfx(slap(1.0, 90), fr(BIG))
build(125, 2)

# ───────── 01 Bass（125—225） ─────────
hit(125)
for i in range(12):  # 辐条在空中翻面
    sfx(fwip(0.5), fr(101 + 0.5 * i + 14), pan=0.5 - 0.08 * i)
sfx(swoosh(fr(18), 1.0), fr(107), pan=0.6)
for k in range(7):  # 手臂一节节落定
    place(marimba(53 + [0, 3, 5, 6, 7, 10, 12][k], 0.6), fr(131 + 1.6 * k), pan=-0.5 + 0.15 * k)
    sfx(slap(0.5, 160), fr(131 + 1.6 * k))
for f in [142 + 6.25 * k for k in range(5)]:
    sfx(slap(0.6, 140), fr(f), pan=0.3)
for k in range(4):  # 1955
    place(brass([n + [0, 0, 3, 5][k] for n in CH['F']], 0.12, 0.8, 1.0), fr(169 + 4 * k), send=0.2, bus=PUMP)
    sfx(slap(0.7, 110), fr(169 + 4 * k))
build(225)
sfx(swoosh(fr(18), 1.0), fr(207), pan=0.0)

# ───────── 02 Eames（225—325） ─────────
hit(225)
for i in range(12):
    sfx(fwip(0.4), fr(201 + 0.6 * i + 10), pan=-0.4 + 0.07 * i)
    place(marimba(60 + [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24, 27][i], 0.4), fr(233 + 1.2 * i), pan=-0.5 + 0.09 * i)
for j in range(14):  # 14 颗球
    place(vibe([70, 72, 75, 77, 80, 82, 84, 87, 84, 82, 80, 77, 75, 77][j], 0.55, 0.5), fr(247 + 2.5 * j), pan=-0.6 + 0.18 * (j % 7), send=0.25)
    sfx(slap(0.3, 280), fr(247 + 2.5 * j))
for k in range(4):  # 1953
    place(brass([n + [0, 0, 3, 5][k] for n in CH['Bb']], 0.12, 0.8, 1.0), fr(283 + 4 * k), send=0.2, bus=PUMP)
    sfx(slap(0.7, 110), fr(283 + 4 * k))
build(325)
sfx(swoosh(fr(18), 1.0), fr(307), pan=-0.6)

# ───────── 03 唱片（325—425） ─────────
hit(325)
sfx(fwip(0.8), fr(320))
hit(341, 1.1, 0.6)  # 唱片落定
sfx(swoosh(fr(16), 0.6), fr(341), pan=-0.6)  # 封套滑进来
for k in range(3):  # B · O · P
    place(brass([n + [0, 3, 5][k] for n in CH['F']], 0.16, 0.95, 1.0), fr(359 + 4 * k), send=0.25, bus=PUMP)
    sfx(slap(0.9, 100), fr(359 + 4 * k))
place(vibe(87, 0.6, 0.8), fr(373), pan=-0.5, send=0.4)
for k in range(4):  # 1956
    place(brass([n + [0, 0, 3, 5][k] for n in CH['F']], 0.12, 0.8, 1.0), fr(377 + 4 * k), send=0.2, bus=PUMP)
    sfx(slap(0.6, 110), fr(377 + 4 * k))
build(425)
sfx(fwip(0.8), fr(399))
sfx(swoosh(fr(18), 1.0), fr(407), pan=0.0)

# ───────── 04 建筑（425—525） ─────────
hit(425)
for m in (72, 75, 79, 84):  # 落日落定
    place(vibe(m, 0.4, 1.2), fr(441), pan=-0.4, send=0.4)
for k, f in enumerate([457, 459, 463, 467]):  # 柱、楼板、玻璃盒子、屋顶
    sfx(slap(0.8, [180, 140, 110, 150][k]), fr(f), pan=0.4)
for k in range(6):  # 窗一盏盏亮
    place(vibe(84 + [0, 3, 5, 7, 10, 12][k], 0.45, 0.5), fr(471 + 3.125 * k), pan=0.3 + 0.05 * k, send=0.35)
for k in range(4):  # 1960
    place(brass([n + [0, 0, 3, 5][k] for n in CH['C']], 0.12, 0.8, 1.0), fr(477 + 4 * k), send=0.2, bus=PUMP)
    sfx(slap(0.6, 110), fr(477 + 4 * k))
build(525)
sfx(fwip(0.8), fr(499))
sfx(swoosh(fr(18), 1.0), fr(507), pan=0.6)

# ───────── 05 今天（525—632） ─────────
hit(525)
hit(539, 0.9, 0.4)  # 手机落定
for k, f in enumerate([547, 553, 559]):
    place(marimba(65 + [0, 3, 7][k], 0.55), fr(f), pan=0.1)
    sfx(slap(0.4, 200), fr(f))
for i in range(6):  # ATOMIC
    place(marimba(72 + [0, 3, 5, 7, 10, 12][i], 0.45), fr(565 + 1.5 * i), pan=-0.2 + 0.08 * i)
for k in range(16):  # 波形条
    place(tink(89 + (k % 5) * 2, 0.6), fr(571 + 1.5 * k), pan=-0.3 + 0.04 * k)
for k in range(4):  # 2026
    place(brass([n + [0, 0, 3, 5][k] for n in CH['F']], 0.12, 0.75, 1.0), fr(581 + 4 * k), send=0.2, bus=PUMP)
build(PRESS, 1, 0.8)
hit(PRESS, 1.3, 1.0)  # 手按下播放键
sfx(button(1.0), fr(PRESS))
build(650)
sfx(swoosh(fr(18), 1.0), fr(632), pan=0.0)

# ───────── 五条规则（650—826）：小号吹主题，五张卡五记铜管 ─────────
hit(650, 0.9, 0.7)
CARD_CH = [[56, 60, 63, 65], [58, 61, 65, 67], [60, 63, 67, 68], [61, 65, 68, 70], [63, 67, 70, 72]]
for k, f in enumerate(CARDS):
    place(brass(CARD_CH[k], 0.2, 1.0, 1.0), fr(f), send=0.25, bus=PUMP)
    kick_at(f, 0.9)
    sfx(slap(0.9, 100), fr(f))
place(CRASH * 0.6, fr(CARDS[-1]), send=0.3)
HOOK = [(0, 72, 0.2), (12.5, 75, 0.2), (25, 77, 0.35), (50, 80, 0.2), (62.5, 79, 0.2), (75, 77, 0.45)]  # C E♭ F A♭ G F
for base in (650, 750):
    for dt, m, d in HOOK:
        place(trumpet(m, d, 0.9), fr(base + dt), pan=0.25, send=0.35)
# 卡片飞走 → 片尾：海报重新落下，接回第 0 帧
for k in range(5):
    sfx(fwip(0.5), fr(OUT + 3 * k), pan=-0.6 + 0.3 * k)
sfx(swoosh(fr(24), 0.9), fr(OUT), pan=0.2)
build(DURATION, 2)  # 片尾的滚奏落到第 0 帧
sfx(swoosh(fr(22), 0.6), fr(DURATION - 22), pan=0.5)  # 太阳从镜头上方落下

# ───────── 侧链：贝斯、萨克斯、铜管跟着底鼓泵 ─────────
duck = np.ones(audio.N)
for f in KICKS:
    i = int(round(fr(f) * SR)) % audio.NV
    n = int(0.16 * SR)
    seg = 1 - 0.55 * np.exp(-np.arange(n) / (0.05 * SR))
    j = min(audio.N, i + n)
    duck[i:j] = np.minimum(duck[i:j], seg[:j - i])
audio.MUS += PUMP * duck
audio.master(ROOT / 'public/017-mid-century-modern/music.wav')
