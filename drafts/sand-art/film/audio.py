"""沙画 v2 配乐（一整首歌，19 秒）。120 BPM（一拍 = 30 帧）· F 大调（F–C–Dm–B♭，每两拍换一个和弦）。
照毛绒那一首的做法：从第一拍到最后一拍是同一支乐队——鼓、沙锤、贝斯、竖琴分解和弦、马林巴 + 钢片琴的主旋律。
没有任何噪声类音效（第一版的“沙沙”声叠在一起就是噪音）：每次换幕是一串竖琴刮奏，沙落定是钢片琴的亮点，音高都跟着和弦走。
时间取自 timeline.js；每个字落定的“嗒”取自 events.json（node ../../_lib/events.cjs film.html events.json）。python3 audio.py out.wav"""
import json
import re
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_lib'))
from song import Song  # noqa: E402
from softfx import SoftFX  # noqa: E402

TL = json.loads(re.sub(r'//[^\n]*', '', re.search(r'const TL = (\{.*?\});', (HERE / 'timeline.js').read_text(), re.S).group(1)))
END = TL['end']
F, C, DM, BB, GM, A = [65, 69, 72], [64, 67, 72], [62, 65, 69], [62, 65, 70], [62, 67, 70], [64, 69, 73]
PROG = [(41, F), (36, C), (38, DM), (34, BB)]
CH = []
for k, f0 in enumerate(range(0, END + 60, 60)):
    r, ch = PROG[k % 4]
    CH.append((f0, r, ch))
CH[-3] = (CH[-3][0], 34, BB)          # 片尾：B♭ → C → F 收住
CH[-2] = (CH[-2][0], 36, C)
CH[-1] = (CH[-1][0], 41, F)


class FilmSong(Song, SoftFX):
    def gliss(self, at, n=8, up=True, level=1.0):
        """竖琴刮奏：沿和弦一个音一个音往上（或往下），十六分音符的一半"""
        for i in range(n):
            k = i if up else n - 1 - i
            m = self.tone(at, k, 0)
            self.sfx(self.harp(m, 1.2, 0.9), self.fr(at + i * 3.75), 0.32 * level, -0.5 + i / n, send=0.4)


S = FilmSong(END, CH, seed=31)
fr = S.fr
T = {name: f0 for (f0, f1, a, b, name) in [tuple(t) for t in TL['trans']]}


def lead(m, d):
    y = S.marimba(m, 1.0) * 1.4
    c = S.celesta(m + 12, max(d, 0.3), 0.3)
    n = max(len(y), len(c))
    return np.pad(y, (0, n - len(y))) + np.pad(c, (0, n - len(c)))


# —— 乐队（片头 2 拍只有竖琴和铺底；第 60 帧鼓进来；收束前一拍抽掉鼓）——
FIN = TL['title']
BRK = [(TL['storm'] - 30, TL['storm'])]
S.pad(0.9, wave='square', fc=1200)
S.arp(0, END - 30, 1.3, pattern=(0, 1, 2, 3, 2, 1, 2, 4), inst=lambda m: S.harp(m, 1.0, 0.8))
S.drums(60, FIN, skip=BRK, level=0.75)
for fm in np.arange(60, FIN, 7.5):
    if not any(a <= fm < z for a, z in BRK):
        S.place(S.shaker(0.9), fr(fm), 0.7 if fm % 15 else 0.4, -0.35)
S.bassline(60, FIN, skip=BRK, level=0.85)
HOOK = {}
for b in range(2, (FIN // 30) - 1, 2):
    s0 = b * 30
    k = (b // 2) % 4
    HOOK[s0] = [[(0, 77, 1), (1, 74, 1), (2, 72, 2)], [(0, 76, 1), (1, 79, 1), (2, 84, 2)], [(0, 81, 1), (1, 77, 1), (2, 74, 2)], [(0, 77, 1), (1, 82, 1), (2, 86, 2)]][k]
for s0, notes in HOOK.items():
    if not any(a <= s0 < z for a, z in BRK):
        S.hook(s0, notes, 0.85, inst=lead)

# —— 每次换幕：竖琴刮奏 + 一把很轻的风（沙飞起来），速度最快的一刻一记低音 ——
for (f0, f1, a, b, kind) in TL['trans']:
    if f1 < 0:
        continue
    f0 = max(0, f0)
    S.gliss(f0, 8, up=kind != 'pour', level=1.0)
    mid = (f0 + f1) / 2
    S.sfx(S.bop(S.tone(mid, 0, -1), 0.9, 0.3), fr(mid), 0.35, send=0.3)
    for i in range(4):                                     # 沙落定：钢片琴的亮点，沿和弦往上
        S.sfx(S.celesta(S.tone(f1, i, 1), 1.0, 0.5), fr(f1 - 12 + i * 3.75), 0.22, 0.6 - 0.4 * i, send=0.5)

# —— 主要动作 ——
S.thump(40, 0.8)                                            # 第一幕落定
S.sfx(S.marimba(S.tone(TL['eye'] + 50, 2, 1), 1.0), fr(TL['eye'] + 50), 0.4, 0.5)    # 瞳孔往右看
S.sfx(S.marimba(S.tone(TL['eye'] + 90, 0, 1), 1.0), fr(TL['eye'] + 90), 0.4, -0.5)   # 往左看
S.place(S.swell([60, 65, 69, 72], fr(TL['trans'][2][0] - TL['dive']), 0.7), fr(TL['dive']), 0.3, send=0.5)   # 钻进瞳孔：和弦慢慢涨上来
S.place(S.timpani(41, 1.0), fr(TL['whale']), 0.6); S.kicks.append(TL['whale'])            # 炸开 → 鲸鱼
S.place(S.choir([65, 69, 72], 2.0, 0.6), fr(TL['whale']), 0.25, send=0.6)
S.sfx(S.glide(53, 77, 0.6, 0.8), fr(TL['whale'] + 20), 0.25, send=0.4)                   # 鲸鱼跃起
S.sfx(S.glide(48, 72, 1.0, 0.7), fr(TL['finger']), 0.25, send=0.4)                       # 一指分开沙带
S.sfx(S.glide(60, 72, 1.4, 0.6), fr(TL['ui'] + 10), 0.2, send=0.4)                        # 进度：沙流过去
S.sfx(S.bop(S.tone(TL['toggle'], 2, 1), 1.0, 0.2), fr(TL['toggle'] + 12), 0.6, 0.3)      # 开关拨过去
S.place(S.rev_cymbal(0.9, 0.7), fr(TL['storm']) - 0.9, 0.4)                              # 沙暴前吸一口气
S.place(S.swell([65, 69, 72, 77], 1.4, 0.8), fr(TL['storm']), 0.3, send=0.6)
S.thump(TL['title'], 1.0)                                                                 # 片名落定
S.place(S.crash(0.7), fr(TL['title']), 0.45, send=0.5)
S.thump(TL['dot'], 0.9)                                                                   # 最后一撮沙
for i, m in enumerate([77, 81, 84, 89]):
    S.sfx(S.celesta(m, 1.6, 0.8), fr(TL['dot'] + i * 3.75), 0.35, -0.3 + 0.2 * i, send=0.6)

# —— 文字：每个字落定一声“嗒”（压低一点，不抢旋律）——
S.text_cues(json.loads((HERE / 'events.json').read_text())['cues'], 0.5)

S.master(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), loop=False)
