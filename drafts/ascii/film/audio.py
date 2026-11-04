"""字符画开头小样的配乐（第三版：一整首歌）。120 BPM（一拍 = 30 帧）· A 小调 · 合成器流行（方波主旋律 + 十六分琶音 + 八度贝斯）。
从第一拍到最后一拍是同一支乐队：四拍底鼓、二四拍拍手、反拍开镲、铺底、琶音、贝斯一直在走；换章只换和弦 + 一句新的主旋律，
换章前 16 帧风声 + 滑哨扫过去。只在片名前留一拍空（405—420），420 重拍落片名。
和弦：Am（01 甜甜圈）| F（02 字雨）| C → G（03 网页，G 在点按钮那一下）| Am → F（04 手机）| Dm → E（05 火，E 把耳朵往回拽）| Am（片名）→ F → C → Am（片尾）
音效全都调到和弦里、按十六分音符对齐、压在音乐下面。时间取自 timeline.js 和 events.json。python3 audio.py out.wav"""
import json
import re
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_lib'))
from song import Song  # noqa: E402

TL = json.loads(re.sub(r'//[^\n]*', '', re.search(r'const TL = (\{.*?\});', (HERE / 'timeline.js').read_text(), re.S).group(1)))
EV = json.loads((HERE / 'events.json').read_text())
AM, F, C, G, DM, E = [57, 60, 64], [57, 60, 65], [55, 60, 64], [55, 59, 62], [57, 62, 65], [56, 59, 64]
CH = [(0, 33, AM), (90, 29, F), (150, 36, C), (195, 31, G), (240, 33, AM), (285, 29, F), (330, 38, DM), (375, 40, E),
      (420, 33, AM), (450, 29, F), (480, 36, C), (510, 33, AM)]
END = TL['end'][1]
S = Song(END, CH, seed=21)
fr = S.fr
BRK = [tuple(TL['brk'])]
rng = np.random.default_rng(4)

# —— 乐队：从第 0 帧一直走到片尾 ——
S.drums(0, 570, skip=BRK)
S.bassline(0, 570, skip=BRK)
S.pad(1.0)
S.arp(0, 570, 1.0, skip=BRK)
S.place(S.kick(1.1), fr(570), 1.0); S.kicks.append(570)
S.place(S.sbass(33, 1.4), fr(570), 0.5, bus=S.PUMP)
S.place(S.crash(1.0), fr(570), 0.7, send=0.4)

# —— 主旋律：每章一句（八分音符位置, MIDI, 长度）——
HOOK = {
    0: [(0, 81, 1), (1, 79, 1), (2, 76, 1), (3, 72, 1), (4, 76, 2)],
    60: [(0, 74, 1), (1, 76, 1), (2, 79, 2)],
    90: [(0, 77, 1), (1, 76, 1), (2, 72, 2), (4, 69, 1), (5, 72, 1)],
    150: [(0, 76, 1), (1, 79, 1), (2, 84, 2), (4, 83, 1), (5, 79, 1)],
    195: [(1, 79, 1), (2, 83, 1), (3, 86, 2)],
    240: [(0, 84, 1), (1, 81, 1), (2, 76, 1), (3, 81, 1), (4, 84, 2)],
    285: [(0, 81, 1), (1, 77, 1), (2, 72, 2), (4, 77, 1), (5, 81, 1)],
    330: [(0, 77, 2), (2, 81, 2), (4, 86, 2)],
    375: [(0, 83, 1), (1, 80, 1), (2, 76, 1), (3, 80, 1)],
    420: [(0, 88, 2), (2, 84, 1), (3, 81, 1), (4, 84, 2), (6, 88, 2)],
    480: [(0, 84, 1), (1, 79, 1), (2, 76, 2)],
    510: [(0, 81, 6)],
}
for s, notes in HOOK.items():
    S.hook(s, notes, 1.0)

# —— 换章：风声 + 滑哨 + 镲 ——
for t, up in ((90, False), (150, True), (240, False), (330, True), (510, False)):
    S.transition(t, up)
# 片名前：军鼓滚奏 + 上扬，留一拍空，420 重拍
for k, fm in enumerate(np.arange(375, 405, 3.75)):
    S.place(S.snare(1.0), fr(fm), 0.15 + 0.5 * (k / 8) ** 1.5, 0.1 * (-1) ** k, send=0.2)
S.sfx(S.riser(0.75, level=0.9), fr(375))
S.place(S.kick(1.3), fr(420), 1.0); S.place(S.hit(0.8, m=33), fr(420), 0.8, send=0.3); S.place(S.crash(1.2), fr(420), 1.0, send=0.4)

# —— 音效：调到和弦里、按十六分音符对齐 ——
def chime(fm, k, level=0.3, octv=1):
    S.sfx(S.tink(S.tone(fm, k, octv), 1.0, 0.25), fr(fm), level, float(rng.uniform(-0.5, 0.5)), send=0.3)


# 02 字雨落地：按十六分音符归格，和弦音从高往低“倒下来”
slots = sorted({round(t / 7.5) for t in EV['rainLand'] if TL['rain'][0] <= t < TL['web'][0] + 8})
for k, s in enumerate(slots):
    chime(s * 7.5, len(slots) - k + 2, 0.22, 1)
# 03 网页：点按钮“咔”、安装完成三声
S.sfx(S.click(1.4, lo=1200, hi=6000, d=0.006), fr(TL['click']), 0.8)
S.sfx(S.thock(79, 0.8), fr(TL['click']), 0.5)
for k in range(3):
    chime(TL['fill'][1] + k * 3.75, k + 3, 0.4, 1)
# 03 → 04 每个字飞到手机上：落位的细碎声
slots = sorted({round(t / 7.5) for t in EV['morphLand'] if TL['morph'][0] <= t < TL['phone'][0] + 6})
for k, s in enumerate(slots):
    chime(s * 7.5, k + 2, 0.18, 1)
# 04 手机：心跳的第二下（和心形封面的第二次鼓起同一帧）
for fm in range(240, 330, 30):
    S.place(S.kick(0.5), fr(fm + 8), 0.55)
# 心脏放大 → 着火
S.sfx(S.riser2(fr(TL['grow'][1] - TL['grow'][0]), 0.6), fr(TL['grow'][0]))
S.sfx(S.boom(0.8, 90, 36, 0.9), fr(TL['fire'][0]), 0.6, send=0.3)
n = S.fft_filter(S.rng.standard_normal(int(fr(TL['wind'][0] - TL['fire'][0]) * S.SR)), lo=300, hi=3000) * 0.03
S.sfx(n * np.minimum(1, S.tt(len(n) / S.SR) / 0.2), fr(TL['fire'][0]), 1.0)
for fm in np.arange(TL['fire'][0], TL['wind'][0], 1.0):     # 火的噼啪：稀疏的小爆点
    if rng.random() < 0.18:
        S.sfx(S.click(float(rng.uniform(0.2, 0.6)), lo=1500, hi=9000, d=0.002), fr(fm + rng.random()), 0.5, float(rng.uniform(-0.8, 0.8)))
# 风；片尾标题一字一声
S.sfx(S.whoosh(1.0, 200, 6000, 1.0, 0.4), fr(TL['wind'][0]), 0.6, send=0.3)
for k in range(3):
    S.sfx(S.thock(69 + k * 3, 0.7), fr(TL['end'][0] + 6 + k * 5 + 9), 0.6)
for k in range(6):
    chime(TL['end'][0] + 52 + k * 2.5, k, 0.35, 1)

S.master(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), loop=False)
