"""毛绒全片配乐（一整首歌，20 秒）。120 BPM（一拍 = 30 帧）· F 大调 · 软乎乎的：马林巴主旋律、拨弦琶音、圆底鼓，所有音头都磨圆。
招牌声音是“噗”（毛蓬开）：一团低通噪声，音头慢、尾巴短。每个零件“啵”一声（音高走和弦），每落定一个字一声“嗒”。
时间取自 timeline.js；文字的声音取自 events.json（node ../../_lib/events.cjs film.html events.json）。python3 audio.py out.wav"""
import json
import re
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_lib'))
from song import Song  # noqa: E402

TL = json.loads(re.sub(r'//[^\n]*', '', re.search(r'const TL = (\{.*?\});', (HERE / 'timeline.js').read_text(), re.S).group(1)))
F, DM, BB, C, AM = [65, 69, 72], [62, 65, 69], [62, 65, 70], [60, 64, 67], [64, 69, 72]
CH = [(0, 41, F), (60, 34, BB), (120, 38, DM), (180, 36, C), (225, 41, F), (285, 34, BB), (330, 38, DM), (390, 36, C), (435, 34, BB), (480, 36, C),
      (525, 41, F), (570, 38, DM), (615, 34, BB), (660, 36, C), (705, 33, AM), (750, 41, F), (810, 34, BB), (870, 38, DM), (930, 36, C),
      (990, 34, BB), (1020, 36, C), (1080, 41, F), (1140, 41, F)]
END, FIN = TL['end'], TL['final']
S = Song(END, CH, seed=23)
fr = S.fr
rng = np.random.default_rng(9)


def poof(level=1.0, d=0.32, fc=1500):
    """毛蓬开的“噗”：低通噪声，音头 20 毫秒，像拍了一下枕头"""
    t = S.tt(d)
    n = S.fft_filter(S.rng.standard_normal(len(t)), lo=120, hi=fc)
    return n * np.minimum(1, t / 0.02) * np.exp(-t / (d * 0.3)) * level * 0.9


def bop(m, level=1.0, d=0.16):
    """零件“啵”地弹出来：正弦，音高先往上一挑再落回"""
    t = S.tt(d)
    f = S.midi(m) * (1 + 0.5 * np.exp(-t / 0.018))
    y = np.sin(2 * np.pi * np.cumsum(f) / S.SR) + 0.2 * np.sin(4 * np.pi * np.cumsum(f) / S.SR)
    return y * np.minimum(1, t / 0.003) * np.exp(-t / (d * 0.4)) * level * 0.5


def brush(d=0.4, level=1.0, up=True):
    """一大把毛飞过去：带通噪声扫频，很软"""
    t = S.tt(d)
    n = S.rng.standard_normal(len(t))
    lo = S.fft_filter(n, lo=300, hi=1400) * (1 - t / d if up else t / d) + S.fft_filter(n, lo=1400, hi=5200) * (t / d if up else 1 - t / d)
    return lo * np.sin(np.pi * t / d) ** 1.4 * level * 0.5


def boing(m, level=1.0, d=0.5):
    """压扁再弹回：音高跟着弹簧抖"""
    t = S.tt(d)
    f = S.midi(m) * (1 + 0.22 * np.exp(-t / 0.11) * np.cos(2 * np.pi * 5.5 * t))
    return np.sin(2 * np.pi * np.cumsum(f) / S.SR) * np.minimum(1, t / 0.004) * np.exp(-t / 0.2) * level * 0.4


def lead(m, d):
    y = S.marimba(m, 1.0) * 1.5
    c = S.celesta(m + 12, max(d, 0.3), 0.35)
    n = max(len(y), len(c))
    return np.pad(y, (0, n - len(y))) + np.pad(c, (0, n - len(c)))


def pluck(m):
    return S.pizz(m + 12, 0.9)


def thump(at, level=1.0):
    """落地：圆底鼓 + 低频 + 噗"""
    S.place(S.kick(1.2 * level), fr(at), 1.0); S.kicks.append(at)
    S.sfx(S.boom(0.8 * level, 100, 36, 0.7), fr(at), 0.7)
    S.sfx(poof(1.0 * level, 0.4), fr(at), 0.9, send=0.25)


# —— 乐队：开场只有落地的重击，炸开拼字那一拍（52）全乐队进来；“一根毛”（120—165）和片尾最后一跳前留空 ——
BRK = [(120, 165), (1050, 1080)]
S.drums(60, FIN, skip=BRK, level=0.85)
for fm in np.arange(60, FIN, 7.5):
    if not any(a <= fm < z for a, z in BRK):
        S.place(S.shaker(1.0), fr(fm), 0.9 if fm % 15 else 0.5, -0.35)
S.bassline(60, FIN, skip=BRK, level=0.9)
S.pad(1.0, wave='square', fc=1100)
S.arp(60, FIN, 1.5, skip=[(120, 150), (1050, 1080)], inst=pluck, pattern=(0, 2, 1, 3, 2, 4, 3, 1))
HOOK = {
    60: [(0, 77, 1), (1, 74, 1), (2, 70, 2)], 90: [(0, 74, 1), (1, 77, 1), (2, 82, 2)],
    165: [(0, 72, 1), (1, 76, 1), (2, 79, 1), (3, 84, 1)], 195: [(0, 79, 1), (1, 76, 1), (2, 72, 2)],
    225: [(0, 81, 1), (1, 77, 1), (2, 72, 2)], 255: [(0, 77, 1), (1, 81, 1), (2, 84, 2)], 285: [(0, 82, 1), (1, 77, 1), (2, 74, 1), (3, 77, 1)],
    330: [(0, 81, 1), (1, 77, 1), (2, 74, 2)], 360: [(0, 77, 1), (1, 81, 1), (2, 86, 2)], 390: [(0, 84, 1), (1, 79, 1), (2, 76, 1), (3, 79, 1)],
    435: [(0, 82, 2), (2, 86, 2)], 465: [(0, 86, 1), (1, 82, 1), (2, 77, 2)], 495: [(0, 79, 1), (1, 76, 1), (2, 72, 2)],
    750: [(0, 77, 1), (1, 81, 1), (2, 84, 2)], 810: [(0, 82, 1), (1, 77, 1), (2, 74, 2)], 870: [(0, 81, 2), (2, 77, 2)], 930: [(0, 79, 1), (1, 84, 1), (2, 88, 2)],
    990: [(0, 86, 1), (1, 82, 1), (2, 77, 2)], 1020: [(0, 79, 2), (2, 76, 2)], 1080: [(0, 77, 1), (1, 81, 1), (2, 84, 1), (3, 89, 1)], 1110: [(0, 84, 2), (2, 81, 2)], 1140: [(0, 89, 8)],
}
for s0, notes in HOOK.items():
    S.hook(s0, notes, 1.0, inst=lead)
for t, up in ((TL['cup'], True), (TL['bear'], False), (TL['hat'], True), (TL['rules'][0], False), (TL['ui'], True)):
    S.transition(t, up, 0.6)

# —— 00：砸下来 → 弹一下 → 蓄力 → 炸开拼成两个字 ——
thump(TL['hit'], 1.2)
S.place(S.crash(0.7), fr(TL['hit']), 0.5, send=0.4)
S.sfx(boing(53, 1.0), fr(TL['hit'] + 5), 0.6)
thump(TL['land'], 0.7)
S.sfx(S.glide(48, 41, 0.1, 0.8), fr(TL['antic'][0]), 0.4)
for b0, gl in ((TL['burst'][0], TL['glyphs']), (TL['burst2'][0], TL['glyphs2'])):
    S.sfx(poof(1.3, 0.5, 2600), fr(b0), 1.0, send=0.3)
    S.sfx(brush(fr(34), 1.0), fr(b0 + 2), 0.9, send=0.3)
    S.sfx(S.glide(53, 77, 0.3, 0.8), fr(b0), 0.3, send=0.3)
    for k, g in enumerate(gl):
        S.sfx(bop(S.tone(g, k * 2, 1), 1.0, 0.22), fr(g), 0.7, -0.4 + 0.8 * k, send=0.3)
        S.sfx(poof(0.9, 0.3, 2200), fr(g + 12), 0.6, -0.4 + 0.8 * k, send=0.3)
for k, m in enumerate([77, 81, 84, 89]):
    S.sfx(S.celesta(m, 1.2, 0.7), fr(TL['burst'][1] + k * 3.75), 0.4, -0.3 + 0.2 * k, send=0.5)

# —— 01：毛缩回去 → 一根毛“啵”地长出来（全场最安静的一刻）→ ×8、×8、×8…… 每一级一个音，越来越高 ——
S.sfx(brush(0.3, 0.8, up=False), fr(TL['bald'][0]), 0.6)
S.sfx(S.swell([62, 69, 74], 1.0, 0.5), fr(TL['bald'][0] + 4), 0.3, send=0.6)
S.sfx(bop(74, 1.2, 0.3), fr(TL['oneGrow']), 0.9, send=0.4)
S.sfx(S.celesta(86, 1.5, 1.0), fr(TL['oneGrow'] + 3), 0.5, send=0.6)
for k, at in enumerate(TL['counts']):
    S.sfx(bop(S.tone(at, k, 1), 1.0), fr(at), 0.6, -0.5 + 0.2 * k, send=0.3)
    S.sfx(S.marimba(S.tone(at, k, 2), 1.0), fr(at), 0.5, -0.5 + 0.2 * k, send=0.3)
    S.sfx(poof(0.4 + 0.15 * k, 0.2, 1800 + 300 * k), fr(at), 0.5)
S.sfx(S.riser(fr(TL['counts'][5] - TL['counts'][0]), 0.6, 400, 6000), fr(TL['counts'][0]), 0.3)
S.sfx(boing(60, 1.0), fr(TL['shake']), 0.6)
S.sfx(poof(0.9, 0.35), fr(TL['shake']), 0.7)

# —— 02 皮毛早餐：碟、杯、勺三声（瓷器的“叮”包在毛里）；转台“啪”地一转 ——
for k, at in enumerate(TL['cupPops']):
    S.sfx(bop(S.tone(at, k, 0), 1.0, 0.2), fr(at), 0.7, -0.3 + 0.3 * k, send=0.3)
    S.sfx(S.bell(S.tone(at, k, 2), 0.5, 0.5), fr(at + 7), 0.3, -0.3 + 0.3 * k, send=0.5)
    S.sfx(poof(0.8, 0.25), fr(at + 7), 0.6)
S.sfx(brush(0.3, 0.9), fr(TL['cupSpin']), 0.7)
S.sfx(boing(58, 0.8, 0.4), fr(TL['cupSpin'] + 6), 0.5)

# —— 03 泰迪熊：九个零件九声“啵”，沿和弦往上爬；眼睛“叮”；招手 ——
for k, at in enumerate(TL['bearPops']):
    S.sfx(bop(S.tone(at, k, 0), 1.0), fr(at), 0.65, -0.6 + 0.15 * k, send=0.3)
    S.sfx(poof(0.6, 0.2, 2000), fr(at + 5), 0.45, -0.6 + 0.15 * k)
for k in range(3):
    S.sfx(S.tink(86 + [0, 0, 5][k], 0.9, 0.2), fr(TL['eyes'] + k * 2.5), 0.5, [-0.3, 0.3, 0.0][k], send=0.4)
S.sfx(S.glide(65, 77, 0.2, 0.7), fr(TL['nod']), 0.3)
for k in range(3):
    S.sfx(brush(0.12, 0.6), fr(TL['nod'] + 8 + k * 10), 0.4, 0.4)

# —— 04 渔夫帽：抛起来翻一圈（往上的风 + 落下的噗）——
S.sfx(bop(58, 1.0, 0.25), fr(TL['hat'] - 2), 0.7)
S.sfx(poof(1.0, 0.35), fr(TL['hat'] + 6), 0.7)
S.sfx(S.whoosh(0.45, 300, 4200, 0.9, 0.5), fr(TL['hatToss'] - 2), 0.5, send=0.3)
S.sfx(S.glide(60, 79, 0.25, 0.7), fr(TL['hatToss']), 0.3)
S.sfx(poof(1.1, 0.4), fr(TL['hatToss'] + 30), 0.8)
S.sfx(boing(55, 0.9), fr(TL['hatToss'] + 30), 0.5)

# —— 05 五条规则：一卡一记重拍（砸字的声音来自 events.json），第 16 帧“打开”一声，再加每条自己的声音 ——
for k, at in enumerate(TL['rules']):
    S.place(S.kick(1.2), fr(at), 1.0); S.kicks.append(at)
    S.sfx(poof(1.0, 0.3), fr(at + 3), 0.7)
    if k < 4:
        S.sfx(S.click(1.0, lo=1200, hi=5000, d=0.005), fr(at + TL['ruleOn']), 0.5)
        S.sfx(S.celesta(S.tone(at, 2, 2), 0.8, 0.9), fr(at + TL['ruleOn']), 0.45, send=0.5)
r = TL['rules']
S.sfx(S.glide(53, 65, 0.25, 0.7), fr(r[0] + 16), 0.3)                                # 根深尖浅：颜色“沉”下去
S.sfx(brush(0.3, 0.9), fr(r[1] + 16), 0.7)                                           # 乱一点：一把揉乱
S.sfx(S.shimmer(0.6, 0.9), fr(r[2] + 16), 0.45, send=0.6)                             # 逆光：一圈光
for k in range(5):
    S.sfx(brush(0.1, 0.7, up=bool(k % 2)), fr(r[3] + 4 + k * 7), 0.5, 0.5 * (-1) ** k)   # 慢半拍：左右甩
S.sfx(boing(57, 1.0), fr(r[3] + 39), 0.6)
S.sfx(brush(fr(34), 1.0), fr(r[4] + 6), 0.8, send=0.3)                               # 一按就倒：手指划过去

# —— 06 界面：手机弹上来 → 点赞 → 开关 → 三颗球轮流跳 ——
S.sfx(S.whoosh(0.3, 250, 3000, 0.8, 0.6), fr(TL['phone'][0]), 0.5)
S.sfx(S.thock(53, 0.9), fr(TL['phone'][0] + 9), 0.5)
S.sfx(S.click(1.2, lo=1500, hi=6000, d=0.006), fr(TL['tapHeart']), 0.7)
S.sfx(poof(1.0, 0.25), fr(TL['tapHeart'] + 2), 0.7)
S.sfx(boing(65, 1.0), fr(TL['tapHeart'] + 5), 0.6)
for k, m in enumerate([77, 81, 84]):
    S.sfx(S.celesta(m + 12, 0.9, 0.9), fr(TL['tapHeart'] + 6 + k * 3), 0.45, send=0.5)
S.sfx(S.click(1.2, lo=1500, hi=6000, d=0.006), fr(TL['toggle'] - 3), 0.7)
S.sfx(S.glide(62, 74, 0.12, 0.8), fr(TL['toggle']), 0.4)
S.sfx(S.thock(62, 0.9), fr(TL['toggle'] + 7), 0.5)
S.sfx(poof(0.7, 0.2), fr(TL['toggle'] + 7), 0.5)
for k, at in enumerate(TL['dots']):
    S.sfx(bop(S.tone(at, k % 3, 1), 0.9, 0.14), fr(at), 0.55, -0.3 + 0.3 * (k % 3), send=0.3)
    S.sfx(S.marimba(S.tone(at, k % 3, 1), 0.9), fr(at + 22), 0.5, -0.3 + 0.3 * (k % 3), send=0.3)

# —— 07 片尾：毛飞回来聚成球，砸下来，再炸开拼成两个字，收在主和弦 ——
S.sfx(brush(fr(36), 1.0, up=False), fr(TL['outMorph'][0]), 0.8, send=0.3)
thump(TL['drop2'], 1.2)
S.sfx(boing(53, 1.0), fr(TL['drop2'] + 4), 0.6)
S.place(S.kick(1.3), fr(FIN), 1.0); S.kicks.append(FIN)
S.place(S.sbass(41, 1.6), fr(FIN), 0.45, bus=S.PUMP)
S.place(S.crash(0.9), fr(FIN), 0.6, send=0.5)
S.sfx(poof(1.2, 0.5, 2400), fr(FIN), 0.8, send=0.3)
for k, m in enumerate([77, 81, 84, 89, 93]):
    S.sfx(S.celesta(m, 1.8, 0.9), fr(FIN + k * 3), 0.5, -0.4 + 0.2 * k, send=0.5)

# —— 文字：每个字落定一声“嗒”，标题是键帽声，规则卡大字是倒放镲 + 砸字 ——
S.text_cues(json.loads((HERE / 'events.json').read_text())['cues'], 0.8)

S.master(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), loop=False)
