"""蜂窝布局 · 全片配乐（一整首歌，18.5 秒）。120 BPM（一拍 = 30 帧）· F 大调 · 干净、亮、像手表：马林巴 + 钢片琴的主旋律、拨弦琶音、短底鼓。
招牌声音是“表冠”：放大的时候一格一格“嗒嗒嗒”（越转越密、越转越高）。甩 = 一阵风，吸附 = “咔”+ 一个调好音的“啵”，
点开 = 往上扬，收起 = 往下落，七颗六边形落定 = 重拍 + 镲 + 砸字。每个字落定一声“嗒”（时间来自 events.json）。
时间取自 events.json（node ../../_lib/events.cjs film.html events.json）。python3 audio.py out.wav"""
import json
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_lib'))
from song import Song  # noqa: E402
from softfx import SoftFX  # noqa: E402

EV = json.loads((HERE / 'events.json').read_text())
TL = EV['tl']
END, FIN = TL['end'], TL['final']
F, DM, BB, C = [65, 69, 72], [62, 65, 69], [62, 65, 70], [60, 64, 67]
# 换章那一帧换和弦（150 / 330 / 510 / 690 / 900 是章节起点，1020 是落定）
CH = [(0, 41, F), (60, 34, BB), (150, 38, DM), (240, 36, C), (330, 41, F), (420, 34, BB), (510, 38, DM), (600, 34, BB),
      (690, 41, F), (780, 36, C), (840, 38, DM), (900, 34, BB), (960, 36, C), (FIN, 41, F)]


class HoneySong(Song, SoftFX):
    pass


S = HoneySong(END, CH, seed=31)
fr = S.fr


def lead(m, d):
    y = S.marimba(m, 1.0) * 1.4
    c = S.celesta(m + 12, max(d, 0.3), 0.3)
    n = max(len(y), len(c))
    return np.pad(y, (0, n - len(y))) + np.pad(c, (0, n - len(c)))


# —— 乐队：第 0 帧就进；点开那一下（600—645）和落定前一拍（990—1020）留空 ——
BRK = [(600, 645), (990, FIN)]
S.drums(0, FIN, skip=BRK, level=0.8)
for fm in np.arange(0, FIN, 7.5):
    if not any(a <= fm < z for a, z in BRK):
        S.place(S.shaker(1.0), fr(fm), 0.8 if fm % 15 else 0.45, -0.35)
S.bassline(0, FIN, skip=BRK, level=0.85)
S.pad(1.0, wave='square', fc=1200)
S.arp(0, FIN, 1.3, skip=BRK, inst=lambda m: S.pizz(m + 12, 0.85), pattern=(0, 2, 1, 3, 2, 4, 3, 1))
HOOK = {
    0: [(0, 77, 1), (1, 81, 1), (2, 84, 2), (4, 81, 1), (5, 77, 1), (6, 72, 2)],
    150: [(0, 74, 1), (1, 77, 1), (2, 81, 2), (4, 77, 2), (6, 74, 2)],
    240: [(0, 76, 1), (1, 79, 1), (2, 84, 2), (4, 79, 2)],
    330: [(0, 81, 2), (2, 77, 1), (3, 81, 1), (4, 84, 4)],
    420: [(0, 82, 1), (1, 77, 1), (2, 74, 2), (4, 77, 2)],
    510: [(0, 81, 1), (1, 77, 1), (2, 74, 1), (3, 77, 1), (4, 81, 2)],
    690: [(0, 77, 1), (1, 81, 1), (2, 84, 2), (4, 89, 2)],
    780: [(0, 84, 1), (1, 79, 1), (2, 76, 2)],
    840: [(0, 81, 2), (2, 77, 2)],
    900: [(0, 82, 1), (1, 86, 1), (2, 89, 2)],
    960: [(0, 84, 1), (1, 88, 1), (2, 91, 2)],
    FIN: [(0, 89, 8)],
}
for s0, notes in HOOK.items():
    S.hook(s0, notes, 1.0, inst=lead)
for t in (330, 510, 690):
    S.transition(t, t != 510, 0.5)

# —— 第 0 帧：一记底鼓 + 镲（封面就在动）——
S.place(S.crash(0.7), fr(0), 0.5, send=0.4)
S.sfx(S.boom(0.7, 110, 40, 0.6), fr(0), 0.6)

# —— 甩：一阵风；吸附：“咔” + 调好音的“啵” ——
for f0, kind in TL['moves']:
    if kind == 'flick':
        S.sfx(S.whoosh(0.45, 300, 5200, 0.9, 0.35), fr(max(0, f0)), 0.55, -0.2, send=0.2)
    else:
        S.sfx(S.click(1.3, lo=1600, hi=7000, d=0.005), fr(f0 + 20), 0.8)
        S.sfx(S.bop(S.tone(f0 + 20, 2, 1), 1.0, 0.2), fr(f0 + 20), 0.6, 0.1, send=0.3)

# —— 表冠：放大的时候一格一格“嗒”，越转越密、越转越高 ——
for a, b in TL['crown']:
    n = 14
    for k in range(n):
        u = (k / (n - 1)) ** 0.8
        at = a + (b - a) * u
        S.sfx(S.click(0.9, lo=2200 + 2600 * u, hi=9500, d=0.0025), fr(at), 0.55, 0.3)
        S.sfx(S.tink(84 + int(7 * u), 0.5, 0.05), fr(at), 0.12, 0.3)

# —— 01：圆变六边形（一串往上的亮音）→ 蜂蜡（钢片琴和弦）→ 变回去 ——
h0, h1 = TL['hex']
for k in range(6):
    S.sfx(S.celesta(S.tone(h0, k, 1), 0.6, 0.5), fr(h0 + (h1 - h0) * k / 6), 0.35, -0.4 + 0.16 * k, send=0.5)
S.sfx(S.shimmer(0.9, 0.8), fr(h0 + 10), 0.35, send=0.5)
S.sfx(S.swell([62, 69, 74], 1.2, 0.5), fr(TL['honey']), 0.25, send=0.6)
S.sfx(S.brush(0.35, 0.8, up=False), fr(TL['unhex']), 0.5)
S.sfx(S.glide(77, 65, 0.25, 0.6), fr(TL['unhex'] + 4), 0.25)

# —— 02：变线框（一下“叮”）；标注各一声；变回来 ——
S.sfx(S.glide(65, 77, 0.2, 0.6), fr(TL['wire']), 0.3)
S.sfx(S.tink(89, 0.8, 0.3), fr(TL['wire'] + 10), 0.35, send=0.4)
S.sfx(S.tink(84, 0.8, 0.3), fr(392), 0.4, -0.2, send=0.4)
S.sfx(S.tink(91, 0.8, 0.3), fr(462), 0.4, 0.2, send=0.4)
S.sfx(S.brush(0.3, 0.7), fr(TL['unwire']), 0.45)

# —— 03：点开往上扬，收起往下落 ——
S.sfx(S.glide(60, 84, 0.35, 0.8), fr(TL['open']), 0.4, send=0.3)
S.sfx(S.whoosh(0.5, 200, 6000, 0.9, 0.6), fr(TL['open']), 0.5, send=0.3)
S.sfx(S.swell([65, 72, 77, 81], 1.2, 0.6), fr(TL['open'] + 12), 0.35, send=0.6)
S.sfx(S.glide(84, 62, 0.3, 0.8), fr(TL['close']), 0.35, send=0.3)
S.sfx(S.poof(0.9, 0.3), fr(TL['close'] + 30), 0.6)
S.sfx(S.bop(S.tone(TL['close'] + 30, 0, 1), 1.0), fr(TL['close'] + 30), 0.5)

# —— 04：缩进手表“咚”；摊成地图一串马林巴；变回去 ——
S.sfx(S.whoosh(0.4, 400, 3000, 0.8, 0.7), fr(TL['watch']), 0.4)
S.sfx(S.thock(53, 1.0), fr(TL['watch'] + 40), 0.6)
for k in range(10):
    S.sfx(S.marimba(S.tone(TL['data'], k, 1), 0.9), fr(TL['data'] + k * 3), 0.35, -0.5 + 0.1 * k, send=0.3)
S.sfx(S.brush(0.35, 0.8), fr(TL['undata']), 0.5)

# —— 收束：往中心收（上升音 + 倒放镲）→ 第 1020 帧落定（重拍 + 镲；砸字的声音来自 events.json）——
S.sfx(S.riser(fr(FIN - TL['col']), 0.8, 300, 7000), fr(TL['col']), 0.35)
S.place(S.kick(1.3), fr(FIN), 1.0); S.kicks.append(FIN)
S.place(S.crash(1.0), fr(FIN), 0.7, send=0.5)
for k, m in enumerate([77, 81, 84, 89]):
    S.sfx(S.celesta(m, 1.4, 0.7), fr(FIN + 6 + k * 3.75), 0.4, -0.3 + 0.2 * k, send=0.6)
S.sfx(S.bell(89, 0.6, 1.4), fr(FIN + 30), 0.25, send=0.6)

# —— 文字 ——
S.text_cues(EV['cues'], 0.8)

S.master(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), loop=False)
