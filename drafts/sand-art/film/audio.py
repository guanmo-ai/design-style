"""沙画 配乐（一整首歌）。120 BPM（一拍 = 30 帧）· A 小调：钢琴分解和弦 + 弦乐铺底，从第一章起轻轻加一点鼓。
每一个手法都有声音：手指 = 一道短的沙沙声，倒沙 = 更细的“嘶”，手掌 = 长而厚的一把沙推过去；最后一撮沙落下 = 一记闷鼓 + 镲。
时间都来自 events.json（node ../../_lib/events.cjs film.html events.json）：手法的起止帧、每个字落定的“嗒”。python3 audio.py out.wav"""
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
EV = json.loads((HERE / 'events.json').read_text())
AM, F, C, G, E = [69, 72, 76], [65, 69, 72], [67, 72, 76], [67, 71, 74], [68, 71, 76]
CH = [(0, 45, AM), (120, 41, F), (TL['ch1'], 48, C), (330, 43, G), (TL['ch2'], 45, AM), (600, 41, F), (TL['ch3'], 48, C), (840, 40, E),
      (TL['fin'], 41, F), (TL['title'], 43, G), (TL['dot'], 45, AM)]
END = TL['end']


class FilmSong(Song, SoftFX):
    def sand(self, d, level=1.0, fine=False):
        """沙沙声：带通噪声，颗粒感来自随机的小脉冲；fine = 倒沙的细嘶声"""
        t = self.tt(max(0.06, d))
        n = self.rng.standard_normal(len(t))
        grit = (self.rng.random(len(t)) < (0.012 if fine else 0.006)) * self.rng.standard_normal(len(t)) * 3
        lo, hi = (2500, 9000) if fine else (700, 5200)
        y = self.fft_filter(n * 0.6 + grit, lo=lo, hi=hi)
        env = np.minimum(1, t / 0.03) * np.minimum(1, (t[-1] - t + 1e-3) / 0.08) * (0.75 + 0.25 * np.sin(np.pi * t / t[-1]))
        return y * env * level * 0.35


S = FilmSong(END, CH, seed=11)
fr = S.fr

# —— 乐队：钢琴分解和弦从第 0 帧起；弦乐铺底；第一章起轻鼓；收束前一拍抽掉鼓 ——
for i, (s, _, ns) in enumerate(CH):
    e = CH[i + 1][0] if i + 1 < len(CH) else END + 90
    S.place(S.strings([n - 12 for n in ns], fr(e - s) + 0.4, 0.8, att=0.5, rel=1.0), fr(s), 0.22, send=0.45, bus=S.PUMP)
S.arp(0, TL['dot'], 0.9, pattern=(0, 1, 2, 4, 2, 1), inst=lambda m: S.grand(m - 12, 1.2, 0.55))
S.drums(TL['ch1'], TL['fin'] - 30, clap=False, open_hat=False, level=0.45)
S.bassline(TL['ch2'], TL['fin'] - 30, 0.5)
S.hook(TL['ch2'], [(0, 81, 2), (2, 79, 2), (4, 76, 4), (8, 74, 2), (10, 76, 6)], 0.7, inst=lambda m, d: S.grand(m, d + 0.6, 0.6) * 1.4)
S.hook(TL['ch3'], [(0, 79, 2), (2, 81, 2), (4, 84, 4), (8, 83, 2), (10, 79, 6)], 0.7, inst=lambda m, d: S.grand(m, d + 0.6, 0.6) * 1.4)
for t in (TL['ch1'], TL['ch2'], TL['ch3']):
    S.transition(t, True, 0.35)
S.place(S.rev_cymbal(0.9, 0.7), fr(TL['fin']) - 0.9, 0.5)                    # 收束前：反向镲吸进去
S.place(S.timpani(41, 1.0), fr(TL['fin']), 0.8); S.kicks.append(TL['fin'])    # 两掌推下去
S.place(S.choir([57, 60, 65], fr(TL['dot'] - TL['fin']) + 0.5, 0.6), fr(TL['fin']), 0.35, send=0.5)

# —— 每个手法一个声音 ——
for o in EV['ops']:
    if o['f1'] < 0:
        continue
    f0 = max(0, o['f0']); d = fr(o['f1'] - f0)
    if o['kind'] == 'push':
        if o['palm']:
            S.sfx(S.sand(d + 0.1, 1.6), fr(f0), 0.9, 0.0, send=0.3)
            S.sfx(S.poof(0.8, d * 0.8, 600), fr(f0), 0.5)
        else:
            lvl = 0.45 + min(0.6, o['r'] / 20)
            S.sfx(S.sand(d, lvl), fr(f0), 0.7, -0.3 + 0.6 * ((f0 * 7919) % 100) / 100, send=0.2)
    elif o['kind'] == 'pour':
        S.sfx(S.sand(d + 0.05, 0.55, fine=True), fr(f0), 0.6, 0.2, send=0.25)
    elif o['kind'] == 'morph':
        S.sfx(S.sand(d, 0.5, fine=True), fr(f0), 0.5, send=0.3)
    elif o['kind'] == 'fn':
        S.sfx(S.sand(d, 0.7, fine=True), fr(f0), 0.6, send=0.3)

# 收束：最后一撮沙落在拍上
S.thump(TL['dot'], 0.9)
S.place(S.crash(0.7), fr(TL['dot']), 0.45, send=0.5)
S.place(S.grand(45, 4.0, 0.9) + S.grand(57, 4.0, 0.7) + S.grand(64, 4.0, 0.6), fr(TL['dot']), 0.5, send=0.4)

# —— 文字：每个字落定一声“嗒” ——
S.text_cues(EV['cues'], 0.6)

S.master(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), loop=False)
