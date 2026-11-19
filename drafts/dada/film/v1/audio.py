"""达达 · 配乐：一支小调的卡巴莱进行曲。120 BPM（一拍 = 30 帧），A 小调，40 拍从头到尾不断。
钢琴“嘭—恰”打底，方波小号吹旋律；每张纸片落地一声“啪”（越大越沉、按落点摆声像），剪刀每合一次一声“咔嚓”，
袋子摇的时候是沙锤，每落定一个字一声打字机。时间全部来自 events.json（node render.mjs events events.json）。
python3 audio.py out.wav"""
import json
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_lib'))
sys.path.insert(0, str(HERE.parents[2] / 'scripts' / 'lib'))
from song import Song  # noqa: E402
from softfx import SoftFX  # noqa: E402

EV = json.loads((HERE / 'events.json').read_text())
END, B = EV['end'], EV['beat']
AM, DM, E7, F, C, G = (45, [57, 60, 64]), (50, [57, 62, 65]), (52, [56, 59, 62]), (53, [57, 60, 65]), (48, [55, 60, 64]), (55, [55, 59, 62])
PLAN = [(0, AM), (7, DM), (9, E7), (11, F), (15, G), (17, E7), (18, AM), (22, DM), (26, E7), (28, C), (32, F), (34, E7), (36, AM)]
CH = [(b * B, r, ns) for b, (r, ns) in PLAN]


class Cabaret(Song, SoftFX):
    def paper(self, w=1.0):
        """纸片拍在纸上：一小段很干的噪声 + 一点低频（越大越沉）"""
        t = self.tt(0.16)
        n = self.fft_filter(self.rng.standard_normal(len(t)), lo=500 / (0.6 + w), hi=6500) * np.exp(-t / 0.014)
        low = np.sin(2 * np.pi * (150 - 50 * min(w, 1.4)) * t) * np.exp(-t / 0.045) * 0.7 * min(w, 1.5)
        return (n + low) * 0.5

    def snip(self):
        t = self.tt(0.12)
        y = self.fft_filter(self.rng.standard_normal(len(t)), lo=3500, hi=11000) * (np.exp(-t / 0.006) + 0.7 * np.exp(-np.abs(t - 0.035) / 0.005))
        y += 0.25 * np.sin(2 * np.pi * 5200 * t) * np.exp(-t / 0.03)
        return y * 0.45


S = Cabaret(END, CH, beat=B, seed=16)
fr = S.fr
BREAK = [(510, 540), (1050, 1080)]            # 换章前一拍，鼓停一下
inbreak = lambda f: any(a <= f < z for a, z in BREAK)

# —— 钢琴：拍上低音，反拍和弦（“嘭—恰”）——
for b in range(40):
    f = b * B
    r, ns = S.chord(f)[1], S.chord(f)[2]
    lv = 0.55 if b < 3 else 1.0
    S.place(S.grand(r + (7 if b % 2 else 0) - (12 if b % 2 else 0) + 12, 0.5, 0.8), fr(f), 0.5 * lv, -0.15, send=0.15)
    if not inbreak(f):
        S.place(sum(S.grand(m, 0.3, 0.6) for m in ns), fr(f + B / 2), 0.26 * lv, 0.2, send=0.15)
S.drums(90, 1080, level=0.8, skip=BREAK)
S.bassline(90, 1170, level=0.8, skip=BREAK)
S.pad(0.7)

# —— 旋律：每个和弦一句，音从和弦里取 ——
PH = [[(0, 2, 1), (1, 3, 1), (2, 4, 2), (4, 3, 1), (5, 2, 1), (6, 3, 2)], [(0, 4, 3), (3, 3, 1), (4, 2, 2), (6, 1, 2)]]
for i, (b, _) in enumerate(PLAN):
    nb = (PLAN[i + 1][0] if i + 1 < len(PLAN) else 40) - b
    if b < 3:
        continue
    for bar in range(0, nb, 4):
        f0 = (b + bar) * B
        S.hook(f0, [(p, S.tone(f0, k, 1), ln) for p, k, ln in PH[(i + bar // 4) % 2] if p / 2 < nb - bar], level=0.9)
for f in EV['chapters'][1:-1]:
    S.transition(f, level=0.8)

# —— 每张纸片落地一声 ——
for L in EV['land']:
    w = L['w']
    if L['thump']:
        S.thump(L['f'], min(1.0, 0.55 + 0.3 * L['thump']))
    S.sfx(S.paper(w), fr(L['f']), 0.32 + 0.22 * min(w, 1.5), 0.7 * L['pan'], send=0.12)
    if L['kind'] == 'out':                                            # 从袋子里抽出来的词：一声往上挑的“啵”
        S.sfx(S.bop(S.tone(L['f'], int(L['f']) % 4, 2), 0.8), fr(L['f'] - 6), 0.3, 0.3 * L['pan'])
S.thump(EV['cut']['shift'], 0.9)
for f in EV['snaps']:
    S.sfx(S.snip(), fr(f), 0.55, 0.1, send=0.1)
S.sfx(S.rip(fr(EV['cut']['b'] - EV['cut']['a']), 0.5), fr(EV['cut']['a']), 0.3, 0.0)   # 剪刀走过照片
for f in (EV['liftoff'], EV['toss'], EV['chapters'][5] - 14):          # 一大批纸片同时起飞
    S.sfx(S.brush(0.5, 1.0), fr(f), 0.6, 0.0, send=0.2)
sh = EV['shake']
for k in range(int(sh['dur'] / 5)):                                    # 摇袋子
    S.sfx(S.shaker(1.0), fr(sh['f'] + k * 5), 0.6, 0.3 * (-1) ** k)
S.text_cues(EV['cues'], 0.55)

# —— 收束：署名拍下来那一下，全和弦 ——
E = max(L['f'] for L in EV['land'])
S.place(sum(S.grand(m, 2.2, 0.9) for m in (45, 57, 60, 64, 69)), fr(E), 0.5, 0, send=0.4)
S.place(S.crash(0.8), fr(E), 0.6, 0.1, send=0.3)
S.master(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), loop=False)
