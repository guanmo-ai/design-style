"""生成艺术全片的配乐（一整首歌，18 秒）。120 BPM（一拍 = 30 帧）· C 大调 · 轻快的独立电子（木琴 + 钢片琴主旋律、拨弦琶音、八度贝斯）。
从第一拍到最后一拍同一支乐队一直在走；换章只换和弦 + 一句新的主旋律，换章前 16 帧风声 + 滑哨。只在种子落地前留一拍空（405—420）。
和弦跟着画面讲故事：C（01 流场）| Am（02 方块整齐）→ F → G（越来越乱，越来越紧）| C（210 一下归位 = 回到主和弦）→ Am（03 瓷砖）
| F → G（04 网页 + 手机）| 留空 | C（420 种子落地）→ Am → F（05 树）| C（片名）
“画在弹琴”保留，但音都取当前和弦里的音、压在音乐下面。时间取自 timeline.js 和 events.json。python3 audio.py out.wav"""
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[2] / 'scripts' / 'lib'))
from audio.song import Song  # noqa: E402

TL = json.loads(re.sub(r'//[^\n]*', '', re.search(r'const TL = (\{.*?\});', (HERE.parent / 'video' / 'timeline.js').read_text(), re.S).group(1)))
EV = json.loads((HERE.parent / 'video' / 'events.json').read_text())
C, AM, F, G = [60, 64, 67], [57, 60, 64], [57, 60, 65], [55, 59, 62]
E7 = [56, 59, 62, 64]
CH = [(0, 36, C), (90, 33, AM), (150, 29, F), (180, 31, G), (210, 36, C), (255, 33, AM), (300, 29, F), (360, 31, G),
      (420, 36, C), (465, 33, AM), (480, 29, F),
      (510, 36, C), (570, 33, AM), (630, 29, F), (660, 31, G),        # 06 五条规则
      (690, 36, C), (750, 33, AM), (780, 29, F), (825, 31, G), (870, 40, E7),   # 07 用在手机上（E7 往 Am 拽）
      (900, 33, AM), (936, 29, F), (990, 31, G), (1020, 36, C)]       # 片尾：Am → F → G → C 收在主和弦
END = TL['end'][1]
FIN = TL['final']
S = Song(END, CH, seed=33)
fr = S.fr
BRK = [(405, 420)]
rng = np.random.default_rng(9)


def pluck(m):
    return S.synth(m, 0.11, 'saw', 3200, 700, 0.04, dec=0.09, rel=0.03)


def lead(m, d):
    """木琴 + 高八度钢片琴叠在一起"""
    y = S.marimba(m, 1.0) * 3.2
    c = S.celesta(m + 12, max(d, 0.4), 0.6) * 2.0
    n = max(len(y), len(c))
    return np.pad(y, (0, n - len(y))) + np.pad(c, (0, n - len(c)))


# —— 乐队 ——
S.drums(0, FIN, skip=BRK)
for fm in np.arange(0, FIN, 7.5):                       # 十六分沙锤，让律动更“软”、更连
    if fm < FIN and not any(a <= fm < z for a, z in BRK):
        S.place(S.shaker(1.0), fr(fm), 1.4 if fm % 15 else 0.8, -0.35)
S.bassline(0, FIN, skip=BRK)
S.pad(0.9, fc=1400)
S.arp(0, FIN, 1.3, skip=BRK, inst=pluck)
S.place(S.kick(1.2), fr(FIN), 1.0); S.kicks.append(FIN)
S.place(S.sbass(36, 1.6), fr(FIN), 0.5, bus=S.PUMP); S.place(S.sbass(48, 1.6), fr(FIN), 0.3, bus=S.PUMP)
S.place(S.crash(1.2), fr(FIN), 0.9, send=0.5)
for k, m in enumerate([72, 76, 79, 84, 88]):
    S.place(S.bell(m, 0.8), fr(FIN + k * 3), 0.6, send=0.4)

HOOK = {
    0: [(0, 76, 1), (1, 79, 1), (2, 84, 2), (4, 81, 1), (5, 79, 1)],
    60: [(0, 76, 1), (1, 74, 1), (2, 72, 2)],
    90: [(0, 72, 1), (1, 76, 1), (2, 81, 2), (4, 79, 1), (5, 76, 1)],
    150: [(0, 77, 1), (1, 81, 1), (2, 84, 1), (3, 81, 1)],
    180: [(0, 79, 1), (1, 83, 1), (2, 86, 2)],
    210: [(0, 84, 2), (2, 79, 1), (3, 76, 1), (4, 79, 2)],
    255: [(0, 81, 1), (1, 76, 1), (2, 72, 2)],
    300: [(0, 77, 1), (1, 81, 1), (2, 84, 2), (4, 86, 1), (5, 84, 1)],
    360: [(0, 83, 1), (1, 86, 1), (2, 91, 2)],
    420: [(0, 72, 2), (2, 76, 2), (4, 79, 2)],
    465: [(0, 81, 1), (1, 79, 1), (2, 76, 1), (3, 72, 1)],
    510: [(0, 84, 1), (1, 79, 1), (2, 76, 2), (4, 79, 2)],
    570: [(0, 81, 1), (1, 84, 1), (2, 88, 2)],
    630: [(0, 77, 1), (1, 81, 1), (2, 84, 2)], 660: [(0, 83, 1), (1, 86, 1), (2, 91, 2)],
    690: [(0, 84, 2), (2, 79, 1), (3, 76, 1), (4, 79, 2)],
    750: [(0, 81, 1), (1, 76, 1), (2, 72, 2)],
    780: [(0, 77, 1), (1, 81, 1), (2, 84, 2), (4, 86, 1), (5, 84, 1)],
    825: [(0, 83, 1), (1, 79, 1), (2, 74, 2)], 870: [(0, 80, 1), (1, 83, 1), (2, 88, 2)],
    900: [(0, 81, 2), (2, 84, 2), (4, 88, 2)], 936: [(0, 84, 1), (1, 81, 1), (2, 77, 2), (4, 81, 2)],
    990: [(0, 79, 2), (2, 83, 2)], 1020: [(0, 84, 8)],
}
for s, notes in HOOK.items():
    S.hook(s, notes, 1.0, inst=lead)

for t, up in ((90, False), (210, True), (300, False), (510, True), (690, False), (900, True)):
    S.transition(t, up)
# 种子落地前：滚奏 + 上扬，留一拍空，420 落地重拍
for k, fm in enumerate(np.arange(375, 405, 3.75)):
    S.place(S.snare(1.0), fr(fm), 0.12 + 0.45 * (k / 8) ** 1.5, 0.1 * (-1) ** k, send=0.2)
S.sfx(S.riser(0.75, level=0.8), fr(375))
S.place(S.kick(1.3), fr(420), 1.0); S.place(S.crash(1.1), fr(420), 0.9, send=0.4)
S.sfx(S.thock(48, 1.2), fr(420), 0.8, send=0.2)


def slots(times, f0, f1, per=7.5):
    out = defaultdict(int)
    for t in times:
        if f0 <= t < f1:
            out[round(t / per)] += 1
    return sorted(out.items())


def chime(fm, k, level=0.3, octv=1, inst='tink'):
    m = S.tone(fm, k, octv)
    sig = S.tink(m, 1.0, 0.25) if inst == 'tink' else S.celesta(m, 0.6, 1.0) * 2.0
    S.sfx(sig, fr(fm), level, float(rng.uniform(-0.6, 0.6)), send=0.3)


# 01 色带出生：画面越靠上音越高，但只取当前和弦里的音
for s, n in slots([b[0] for b in EV['grow']], 0, TL['flow'][1]):
    ys = [b[1] for b in EV['grow'] if round(b[0] / 7.5) == s]
    chime(s * 7.5, int((1 - np.median(ys) / 1080) * 6), 0.22, 1)
# 色带缩成圆点、飞到网格：一串往上走的小音
for k, (s, n) in enumerate(slots(EV['gather'], TL['gather'][0], TL['schotter'][0] + 10, 3.75)):
    chime(s * 3.75, k % 9, 0.12, 1)
# 02 方块长出来；混乱三拍（“哗啦”一下）；210 一下归位
S.sfx(S.thock(60, 0.7), fr(TL['schotter'][0]), 0.5)
for k, st in enumerate(TL['steps']):
    S.sfx(S.fft_filter(S.rng.standard_normal(int(0.25 * S.SR)), lo=800, hi=5000) * np.exp(-S.tt(0.25) / 0.06) * 0.25, fr(st), 0.8, -0.3 + 0.3 * k)
    S.sfx(S.thock(55 + k * 4, 0.6), fr(st), 0.5)
S.sfx(S.thock(72, 1.0), fr(TL['snap'][1]), 0.7, send=0.3)
# 03 瓷砖翻转：每一波一串棘轮声
for w in TL['flips']:
    for k in range(10):
        S.sfx(S.click(0.5, lo=1500, hi=5000, d=0.005), fr(w + k * 1.2), 0.5, float(np.sin(k * 0.7)) * 0.6)
S.sfx(S.whoosh(0.4, 5000, 400, 0.6, 0.6), fr(TL['shrink'][0]), 0.4)
# 04 拖滑块（滑音从和弦音到和弦音）、重新生成、导出
d0, d1 = TL['drag']
S.sfx(S.glide(67, 79, fr(d1 - d0), 0.8), fr(d0), 0.6, send=0.3)
S.sfx(S.click(1.2, lo=1200, hi=6000, d=0.006), fr(TL['reroll'][0] - 2), 0.7)
for k in range(6):
    chime(TL['reroll'][0] + 4 + k * 1.9, k + 2, 0.3, 1, 'celesta')
S.sfx(S.click(1.2, lo=1200, hi=6000, d=0.006), fr(TL['export']), 0.7)
S.sfx(S.whoosh(0.35, 6000, 300, 0.8, 0.85), fr(TL['collapse'][0]), 0.5)
# 05 树：每层分叉一个拨弦音往上走；开花一串钢片琴
for s, n in slots([b[0] for b in EV['branch']], TL['tree'][0], TL['rules'][0]):
    d = max(b[1] for b in EV['branch'] if round(b[0] / 7.5) == s)
    S.sfx(S.pizz(S.tone(s * 7.5, d, 0), 1.0), fr(s * 7.5), 0.35, float(rng.uniform(-0.4, 0.4)), send=0.3)
for k, (s, n) in enumerate(slots(EV['bloom'], TL['bloom'][0], TL['rules'][0] + 10, 3.75)):
    chime(s * 3.75, k % 7 + 2, 0.18, 1, 'celesta')
# 06 规则卡：每张从一个点“啵”地长出来，一声调好音的木琴
for k, at in enumerate(TL['cards']):
    S.sfx(S.glide(60 + k * 2, 72 + k * 2, 0.22, 0.8), fr(at - 14), 0.5)          # 花飞过去
    S.sfx(S.marimba(S.tone(at, k, 1), 1.0) * 3, fr(at), 0.5, -0.6 + 0.3 * k, send=0.3)
    S.sfx(S.thock(55 + [0, 4, 7, 12, 16][k], 0.8), fr(at), 0.5)
S.sfx(S.whoosh(0.4, 5000, 400, 0.6, 0.6), fr(TL['today'][0]), 0.4)
# 07 手机：每个界面从一个点长出来——一声“啵”；头像一个个冒出来；完成提示
for k, sw in enumerate(TL['screens']):
    S.sfx(S.glide(67, 79, 0.18, 0.7), fr(sw), 0.4)
    chime(sw + 6, k + 2, 0.35, 1, 'celesta')
for q in range(12):
    chime(TL['screens'][0] + q * 2.2, q % 7, 0.16, 1)
for k in range(8):
    chime(TL['screens'][4] + k * 1.8, k + 3, 0.3, 1, 'celesta')
# 片尾：色带再长一遍（画在弹琴，和开场一样）
for s, n in slots([b[0] for b in EV['endGrow']], TL['end'][0], TL['end'][0] + 120):
    ys = [b[1] for b in EV['endGrow'] if round(b[0] / 7.5) == s]
    chime(s * 7.5, int((1 - np.median(ys) / 1080) * 6), 0.2, 1)
S.sfx(S.thock(48, 1.0), fr(TL['endTitle']), 0.7, send=0.3)

S.master(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), loop=False)
