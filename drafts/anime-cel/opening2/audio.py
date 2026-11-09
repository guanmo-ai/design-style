"""赛璐璐 · 开场 6 秒配乐。120 BPM · D 大调动画片头流行（Song 骨架）：一整首，和弦 D → A → Bm → G → D。
分割线扫过 = 一记长风 + 古典的“刷”；拆层 = 5 声往上爬的键帽；砸回 = 5 声往下走的“咚”；
眨眼 = 两声钢片琴；瞳孔吞屏 = 倒放镲 → 重拍；标题 = 3 个字 3 声砸字 + 字幕每字一声；署名 = 钟。用法：python3 audio.py out.wav"""
import re
import sys
import json
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_lib'))
from song import Song  # noqa: E402

TL = json.loads(re.search(r'window\.TL = (\{.*\})', re.sub(r'//[^\n]*', '', (HERE / 'timeline.js').read_text()), re.S).group(1))
D, A_, BM, G = [62, 66, 69], [61, 64, 69], [62, 66, 71], [62, 67, 71]
CH = [(0, 38, D), (60, 33, A_), (120, 35, BM), (180, 31, G), (TL['iris'] + TL['irisDur'], 38, D)]
END = TL['end']
S = Song(END, CH, fps=60, beat=30, seed=33)
brk = [(TL['iris'] - 10, TL['iris'] + TL['irisDur'])]
S.drums(0, END, skip=brk)
S.bassline(0, END, skip=brk)
S.pad()
S.arp(30, TL['iris'] - 10, level=.8, pattern=(0, 1, 2, 3, 2, 1, 2, 3))
S.hook(0, [(0, 74, 1), (1, 78, 1), (2, 81, 2), (4, 79, 1), (5, 78, 1), (6, 76, 2), (8, 74, 1), (9, 76, 1), (10, 78, 2), (12, 81, 2), (14, 83, 2)], level=1.0)
S.hook(TL['title'], [(0, 86, 2), (2, 85, 1), (3, 81, 1), (4, 83, 2), (6, 86, 4)], level=1.0)
fr = S.fr
S.place(S.slam(38, .9), 0.0, .8, send=.3)
S.place(S.crash(.8), 0.0, .6, .2, send=.3)
S.sfx(S.whoosh(70 / 60, 300, 7000, 1.0, .35), 0.0, .6, -.3, send=.2)
for k in range(5):
    t = TL['pop'] + k * TL['popStep']
    S.sfx(S.key_tick(S.tone(t, k, 2), 1.0), fr(t), .6, -.4 + .2 * k, send=.2)
for k, t in enumerate(TL['slam']):
    S.sfx(S.key_tick(S.tone(t, 4 - k, 1), 1.0), fr(t + 7), .8, .3 - .15 * k, send=.2)
S.place(S.slam(38, .6), fr(TL['slam'][4] + 7), .6, send=.3)
S.place(S.celesta(85, 1.0, 1.0), fr(TL['blink'] + 8), .8, .2, send=.3)
S.place(S.celesta(90, 1.0, 1.0), fr(TL['blink'] + 20), .8, .3, send=.3)
S.sfx(S.rev_cymbal(fr(TL['irisDur'] + 10), 1.0), fr(TL['iris'] - 10), .9, send=.3)
S.place(S.slam(33, 1.0), fr(TL['iris'] + TL['irisDur']), .9, send=.35)
S.place(S.crash(1.0), fr(TL['iris'] + TL['irisDur']), .8, 0, send=.4)
for i in range(3):
    t = TL['title'] + i * TL['titleStep']
    S.sfx(S.slam(38 + [0, 4, 7][i], .6), fr(t), .5, -.3 + .3 * i, send=.3)
sub = '一张画 = 5 张赛璐璐片 · 一拍二 · 冲击帧'
for j, ch in enumerate(sub):
    if ch != ' ':
        t = TL['sub'] + j * 2.4
        S.sfx(S.type_tick(S.tone(t, j % 5, 2), .8), fr(t), .26, .4 * np.sin(j), send=.1)
S.place(S.bell(86, .9, 2.0), fr(TL['credit']), .7, send=.5)
S.master(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), loop=False)
