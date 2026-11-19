"""蜂窝布局 · 全片配乐 v4（一整首歌，18 秒）。120 BPM（一拍 = 30 帧）· F 大调 · 干净、亮、像手表：马林巴 + 钢片琴的主旋律、拨弦琶音、短底鼓。
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
# 换章那一帧换和弦：10 个画面的起点（100 / 172 / 262 / 380 / 482 / 560 / 628 / 735 / 835 / 925），990 落定
CH = [(0, 41, F), (60, 34, BB), (100, 38, DM), (172, 41, F), (220, 36, C), (262, 38, DM), (320, 34, BB), (380, 36, C), (420, 41, F), (450, 34, BB),
      (482, 38, DM), (560, 34, BB), (628, 41, F), (690, 36, C), (735, 38, DM), (790, 34, BB), (835, 41, F), (880, 36, C), (925, 38, DM), (960, 36, C), (FIN, 41, F)]


class HoneySong(Song, SoftFX):
    pass


S = HoneySong(END, CH, seed=31)
fr = S.fr


def lead(m, d):
    y = S.marimba(m, 1.0) * 1.4
    c = S.celesta(m + 12, max(d, 0.3), 0.3)
    n = max(len(y), len(c))
    return np.pad(y, (0, n - len(y))) + np.pad(c, (0, n - len(c)))


# —— 乐队：第 0 帧就进；点开那一下（590—626）和落定前一拍（960—990）留空 ——
BRK = [(590, 626), (960, FIN)]
S.drums(0, FIN, skip=BRK, level=0.8)
for fm in np.arange(0, FIN, 7.5):
    if not any(a <= fm < z for a, z in BRK):
        S.place(S.shaker(1.0), fr(fm), 0.8 if fm % 15 else 0.45, -0.35)
S.bassline(0, FIN, skip=BRK, level=0.85)
S.pad(1.0, wave='square', fc=1200)
S.arp(0, FIN, 1.3, skip=BRK, inst=lambda m: S.pizz(m + 12, 0.85), pattern=(0, 2, 1, 3, 2, 4, 3, 1))
HOOK = {
    0: [(0, 77, 1), (1, 81, 1), (2, 84, 2), (4, 81, 1), (5, 77, 1), (6, 72, 2)],
    100: [(0, 74, 1), (1, 77, 1), (2, 81, 2), (4, 77, 2)],
    172: [(0, 77, 1), (1, 81, 1), (2, 84, 2), (4, 89, 2)],
    262: [(0, 81, 2), (2, 77, 1), (3, 81, 1), (4, 84, 4)],
    380: [(0, 79, 1), (1, 84, 1), (2, 88, 2), (4, 84, 2)],
    482: [(0, 77, 1), (1, 81, 1), (2, 84, 1), (3, 81, 1), (4, 77, 2)],
    628: [(0, 77, 1), (1, 81, 1), (2, 84, 2), (4, 89, 2)],
    735: [(0, 74, 1), (1, 77, 1), (2, 81, 2), (4, 86, 2)],
    835: [(0, 77, 1), (1, 84, 1), (2, 81, 1), (3, 89, 1), (4, 84, 2)],
    925: [(0, 82, 1), (1, 86, 1), (2, 89, 2)],
    960: [(0, 84, 1), (1, 88, 1), (2, 91, 2)],
    FIN: [(0, 89, 8)],
}
for s0, notes in HOOK.items():
    S.hook(s0, notes, 1.0, inst=lead)
for t in (172, 380, 628, 835):
    S.transition(t, t != 380, 0.4)

# —— 第 0 帧：一记底鼓 + 镲（封面就在动）——
S.place(S.crash(0.7), fr(0), 0.5, send=0.4)
S.sfx(S.boom(0.7, 110, 40, 0.6), fr(0), 0.6)

# —— 甩：一阵风；吸附：“咔” + 调好音的“啵”（封面那片 + 里面那片）——
for f0, kind in TL['outer'] + TL['inner']:
    if kind == 'flick':
        S.sfx(S.whoosh(0.45, 300, 5200, 0.9, 0.35), fr(max(0, f0)), 0.55, -0.2, send=0.2)
    else:
        S.sfx(S.click(1.3, lo=1600, hi=7000, d=0.005), fr(f0 + 18), 0.8)
        S.sfx(S.bop(S.tone(f0 + 18, 2, 1), 1.0, 0.2), fr(f0 + 18), 0.6, 0.1, send=0.3)

# —— 钻进一格：往上冲的风 + 往上滑 + 进去那一下一记低音 ——
S.sfx(S.riser(fr(34), 0.6, 500, 8000), fr(TL['dive']), 0.4)
S.sfx(S.glide(60, 84, 0.5, 0.7), fr(TL['dive']), 0.3, send=0.3)
S.sfx(S.boom(0.8, 120, 40, 0.6), fr(TL['dive'] + 34), 0.6)
S.place(S.crash(0.6), fr(TL['dive'] + 34), 0.45, send=0.4)

# —— 照片墙：放大镜扫过去（一道亮的沙沙声）——
S.sfx(S.shimmer(1.2, 0.7), fr(TL['mag'] + 4), 0.3, send=0.5)

# —— 转 60°：一阵转过去的风 + 往上滑的音 ——
for t in TL['rot']:
    S.sfx(S.whoosh(0.7, 250, 4800, 0.9, 0.55), fr(t), 0.5, 0.2, send=0.3)
    S.sfx(S.glide(60, 72, 0.4, 0.6), fr(t + 8), 0.22, send=0.3)

# —— 涟漪：落进水里的“咚”（往下滑的短音）+ 一圈亮音往外荡 ——
for t in TL['rips']:
    S.sfx(S.glide(74, 58, 0.16, 0.9), fr(t), 0.4)
    S.sfx(S.poof(0.8, 0.3), fr(t), 0.5)
    for k in range(4):
        S.sfx(S.tink(S.tone(t, k, 2), 0.6, 0.25), fr(t + 5 + k * 5), 0.18 * (1 - k * .18), -0.3 + 0.2 * k, send=0.5)

# —— 照片 → 蜂蜡：一串往上的亮音，从中心往外传，再铺一个和弦 ——
for k in range(6):
    S.sfx(S.celesta(S.tone(TL['wave'], k, 1), 0.6, 0.5), fr(TL['wave'] + 5 * k), 0.35, -0.4 + 0.16 * k, send=0.5)
S.sfx(S.swell([62, 69, 74], 1.0, 0.5), fr(TL['wave'] + 24), 0.25, send=0.6)

# —— 翻牌：从中心往外一颗颗翻（36 帧里一串越来越密的“嗒”，音高往上走）——
for t in TL['flips']:
    for k in range(12):
        u = k / 11
        at = t + 6 + 30 * u ** 1.3
        S.sfx(S.click(0.9, lo=1500 + 2500 * u, hi=8000, d=0.003), fr(at), 0.45, -0.5 + u, send=0.1)
    S.sfx(S.glide(65, 77, 0.3, 0.5), fr(t + 4), 0.18, send=0.3)

# —— 蓝图：标注各一声 ——
S.sfx(S.tink(84, 0.8, 0.3), fr(322), 0.4, -0.2, send=0.4)
S.sfx(S.tink(91, 0.8, 0.3), fr(344), 0.4, 0.2, send=0.4)

# —— 对称：每转一下一记重的“咔嗒”（像拨盘）+ 低音 ——
for t in TL['steps']:
    S.sfx(S.thock(48, 1.0), fr(t), 0.7)
    S.sfx(S.click(1.2, lo=900, hi=5000, d=0.006), fr(t), 0.6)
    S.sfx(S.glide(70, 58, 0.12, 0.7), fr(t), 0.25)

# —— 手表 → 手机：一下变形的“嗖”；手机里每点一下“嗒”+ 一个往上走的音 ——
S.sfx(S.whoosh(0.5, 400, 4000, 0.8, 0.5), fr(TL['morph']), 0.45, send=0.3)
S.sfx(S.glide(62, 74, 0.4, 0.6), fr(TL['morph'] + 6), 0.25, send=0.3)
for k, t in enumerate(TL['taps']):
    S.sfx(S.click(1.3, lo=2000, hi=8000, d=0.004), fr(t), 0.6)
    S.sfx(S.bop(S.tone(t, k + 2, 1), 1.0, 0.2), fr(t + 2), 0.55, -0.3 + 0.3 * k, send=0.3)

# —— 03：点开往上扬，收起往下落 ——
S.sfx(S.glide(60, 84, 0.35, 0.8), fr(TL['open']), 0.4, send=0.3)
S.sfx(S.whoosh(0.5, 200, 6000, 0.9, 0.6), fr(TL['open']), 0.5, send=0.3)
S.sfx(S.swell([65, 72, 77, 81], 1.0, 0.6), fr(TL['open'] + 10), 0.35, send=0.6)
S.sfx(S.glide(84, 62, 0.3, 0.8), fr(TL['close']), 0.35, send=0.3)

# —— 04：缩进手表“咚”；地图一串马林巴 ——
S.sfx(S.thock(53, 1.0), fr(TL['watch'] + 44), 0.6)
for k in range(10):
    S.sfx(S.marimba(S.tone(835, k, 1), 0.9), fr(835 + 14 + k * 3), 0.35, -0.5 + 0.1 * k, send=0.3)

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
