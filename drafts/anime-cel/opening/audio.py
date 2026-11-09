"""赛璐璐 · 开场配乐（纯代码合成，无外部音源）。120 BPM（一拍 = 30 帧）· D 大调 · 动画片头式流行：
四拍底鼓 + 二四拍拍手 + 十六分闭镲 + 八度贝斯 + 方波主旋律 + 琶音，一整首从头走到尾；换章只换和弦和一句旋律。
和弦：D（00 拆层）| A（眨眼、钻进瞳孔）| Bm（01 夜街）| G（侧滑）| A（停下）| D（02 冲击帧 · 标题）
每个零件一个声音，时间全部取自 timeline.js：
  第 0 帧：冲击（次低音 + 镲）· 拆层：5 声解码“嗒”往上爬 · 砸回：5 声键帽“咔”往下走，最后一张一记重拍
  眨眼：两声钢片琴 · 钻进瞳孔：倒放镲 + 风声 · 多层摄影台：树擦过镜头一声风
  太阳冲过来：上滑哨 + 冲击 · 圆形开孔：一记镲 · 摩托：引擎降调 + 轮胎尖叫 + 火花沙沙 · 停下：定音鼓
  冲击帧：倒放镲吸进去 → 砸字 + 镲 · 字幕：每字一声 · 署名：钟
用法：python3 audio.py out.wav"""
import json
import re
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_lib'))
from song import Song  # noqa: E402

TL = json.loads(re.search(r'window\.TL = (\{.*\})', (HERE / 'timeline.js').read_text(), re.S).group(1))
F = lambda s: s * 60          # 秒 → 帧
D, A_, BM, G = [62, 66, 69], [61, 64, 69], [62, 66, 71], [62, 67, 71]
CH = [(0, 38, D), (F(TL['blink']), 33, A_), (F(TL['iris'][0]), 35, BM), (F(TL['skid']), 31, G),
      (F(TL['bikeStop']), 33, A_), (F(TL['impact']), 38, D)]
END = F(TL['end'])
S = Song(END, CH, fps=60, beat=30, seed=88)
fr = S.fr

brk = [(F(TL['dive'][0]), F(TL['dive'][1])), (F(TL['impact']) - 15, F(TL['impact']))]
S.drums(0, END, skip=brk)
S.bassline(0, END, skip=brk)
S.pad(level=1.0)
S.arp(F(TL['dive'][1]), F(TL['impact']) - 15, level=.9, pattern=(0, 1, 2, 3, 2, 1, 2, 3))
# 主旋律：两句（00 拆层 · 03 标题）
S.hook(F(.25), [(0, 74, 1), (1, 78, 1), (2, 81, 2), (4, 79, 1), (5, 78, 1), (6, 76, 2), (8, 74, 1), (9, 76, 1), (10, 78, 2), (12, 81, 3)], level=1.0)
S.hook(F(TL['iris'][0]) + 15, [(0, 76, 1), (1, 78, 1), (2, 81, 1), (3, 83, 1), (4, 85, 3), (8, 81, 1), (9, 83, 1), (10, 85, 2)], level=.9)
S.hook(F(TL['title']) + 20, [(0, 86, 2), (2, 85, 1), (3, 81, 1), (4, 86, 4)], level=1.0)

# —— 第 0 帧冲击 ——
S.place(S.slam(38, 1.1), 0.0, 1.0, send=.3)
S.place(S.crash(1.0), 0.0, .9, .2, send=.3)
# —— 拆层：5 声“嗒”往上爬 ——
for k in range(5):
    t = TL['split'] + k * TL['splitStep']
    S.sfx(S.type_tick(S.tone(F(t), k, 2), 1.0), t, .55, -.4 + .2 * k, send=.2)
    S.sfx(S.whoosh(.2, 800, 7000, .5, .3), t, .35, -.4 + .2 * k)
# —— 砸回：5 声“咔”往下走 ——
for k, t in enumerate(TL['slam']):
    S.sfx(S.key_tick(S.tone(F(t), 4 - k, 1), 1.0), t, .8, .3 - .15 * k, send=.2)
S.place(S.slam(38, .7), TL['slam'][4], .7, send=.3)
# —— 眨眼 ——
S.place(S.celesta(85, 1.0, 1.0), TL['blink'] + 2 / 12, .9, .2, send=.3)
S.place(S.celesta(90, 1.0, 1.0), TL['blink'] + 4 / 12, .9, .3, send=.3)
# —— 钻进高光 ——
S.sfx(S.rev_cymbal(TL['dive'][1] - TL['dive'][0], 1.0), TL['dive'][0], .9, send=.3)
S.sfx(S.whoosh(TL['dive'][1] - TL['dive'][0], 300, 9000, 1.0, .85), TL['dive'][0], .7, send=.3)
# —— 钻进瞳孔 → 圆形开孔 ——
S.place(S.slam(33, .8), TL['iris'][0], .8, send=.3)
S.place(S.crash(1.0), TL['iris'][0], .8, .2, send=.3)
# —— 摩托 ——
S.sfx(S.engine(TL['bikeStop'] - TL['bikeIn'] + .3, 220, 70, 1.0), TL['bikeIn'], .55, .6, send=.15)
S.sfx(S.screech(TL['bikeStop'] - TL['skid'] + .1, 98, 84, 1.0), TL['skid'], .45, 0, send=.25)
S.sfx(S.hiss(TL['bikeStop'] - TL['skid'], .8), TL['skid'], .4, .3, send=.2)
S.place(S.timpani(38, 1.0, 1.4), TL['bikeStop'], .9, send=.25)
# —— 冲击帧 · 标题 ——
S.sfx(S.rev_cymbal(.5, 1.0), TL['impact'] - .5, .9, send=.3)
S.place(S.slam(26, 1.3), TL['impact'], 1.1, send=.35)
S.place(S.crash(1.2), TL['impact'], 1.0, 0, send=.4)
sub = '一张画 = 5 张赛璐璐片 · 一拍二 · 冲击帧'
for j in range(len(sub)):
    t = TL['title'] + .35 + j / 18
    if sub[j] != ' ':
        S.sfx(S.type_tick(S.tone(F(t), j % 5, 2), .8), t, .28, .4 * np.sin(j), send=.1)
S.place(S.bell(86, .9, 2.0), TL['credit'], .7, send=.5)

S.master(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), loop=False)
