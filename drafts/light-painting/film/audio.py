"""光绘 配乐：夜里、开阔、有一点电子。100 BPM（一拍 = 36 帧）· A 小调（Am — F — C — G）。
琶音合成器 + 低音从第 0 帧就在；光点甩过去的“呼”音量跟着光点的速度走（速度取自 events.json，和画面同一份数）；
火星是细碎的“滋啦”，密度跟着钢丝棉出火星的速率；快门“咔”落在每个小节线上当打击乐，最后一声在 TL.final 合上。
python3 audio.py out.wav（先 node -r ./pw.cjs ../../_lib/events.cjs film.html events.json）"""
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
B = TL['beat']
AM, F, C, G = [57, 60, 64], [57, 60, 65], [55, 60, 64], [55, 59, 62]
CH = []
for bar in range(8):                                   # 四拍一个和弦：Am F C G 循环
    CH.append((bar * 4 * B, [45, 41, 36, 43][bar % 4], [AM, F, C, G][bar % 4]))
END, FIN = TL['end'], TL['final']


class FilmSong(Song):
    def shutter(self, level=1.0, big=False):
        """快门：一声金属的“咔”（两片叶片先后落下）+ 很短的低频“咚”"""
        t = self.tt(0.25)
        y = np.zeros_like(t)
        for k, (dt, lv) in enumerate([(0.0, 1.0), (0.034 if big else 0.022, 0.7)]):
            i = int(dt * self.SR)
            n = self.fft_filter(self.rng.standard_normal(len(t) - i), lo=2200, hi=12000) * np.exp(-t[:len(t) - i] / 0.006)
            y[i:] += n * lv
        body = np.sin(2 * np.pi * np.cumsum(140 + 90 * np.exp(-t / 0.01)) / self.SR) * np.exp(-t / (0.06 if big else 0.03))
        return (y * 0.7 + body * (0.8 if big else 0.4)) * level

    def crackle(self, f0, f1, rate_fn, level=1.0, pan=0.0):
        """火星的“滋啦”：一串很短的高频脉冲，每秒个数跟着 rate_fn(帧)"""
        rng = np.random.default_rng(11 + f0)
        sig = np.zeros(int(self.fr(f1 - f0 + 30) * self.SR))
        t = 0.0
        while t < self.fr(f1 - f0):
            r = max(1.0, rate_fn(f0 + t * 60))
            t += rng.exponential(1 / r)
            i = int(t * self.SR)
            if i >= len(sig) - 400 or rate_fn(f0 + t * 60) < 2:
                continue
            L = int(self.SR * rng.uniform(0.0008, 0.004))
            sig[i:i + L] += rng.standard_normal(L) * np.exp(-np.arange(L) / (L / 4)) * rng.uniform(0.3, 1.0)
        sig = self.fft_filter(sig, lo=1800, hi=12000)
        self.sfx(sig * level, self.fr(f0), 1.0, pan, send=0.25)


S = FilmSong(END, CH, beat=B, seed=5)
fr = S.fr

# —— 乐队：第 0 帧就有琶音和低音（封面那一刻已经在“曲中”）——
S.pad(1.0, wave='saw', fc=1300)
S.arp(0, FIN, 0.95, wave='saw', pattern=(0, 2, 1, 2, 3, 2, 1, 2), octv=1)
S.bassline(0, FIN, 0.85, skip=[(TL['stickEnd'], TL['wool'])])
S.drums(TL['orb'], FIN, level=0.75, skip=[(TL['stickEnd'], TL['wool']), (TL['open'], FIN)])
for fm in range(0, TL['orb'], B):                      # 前两小节只有闭镲（不用底鼓也有推进）
    S.place(S.hat(0.8), fr(fm), 0.8, -0.3); S.place(S.hat(0.6), fr(fm + B / 2), 0.7, 0.3)
S.hook(TL['orb'], [(0, 76, 2), (2, 74, 1), (3, 72, 1), (4, 71, 4)], 0.8)
S.hook(TL['wool'], [(0, 76, 2), (2, 79, 2), (4, 77, 1), (5, 76, 1), (6, 74, 2)], 0.8)

# —— 快门“咔”落在每个小节线上；最后一声合上 ——
for bar in range(0, FIN, 4 * B):
    S.sfx(S.shutter(0.9), fr(bar), 0.55, 0.15, send=0.2)
S.sfx(S.shutter(1.4, big=True), fr(FIN), 1.0, 0.0, send=0.4)
S.place(S.kick(1.3), fr(FIN), 1.0); S.kicks.append(FIN)
S.place(S.crash(0.8), fr(FIN), 0.5, send=0.6)
S.sfx(S.boom(0.8), fr(FIN), 0.6)

# —— 光点甩过去的“呼”：带通噪声，音量 ∝ 速度（平方根，夹到 0—1）——
spd = np.array(EV['speed'], dtype=float)
n = int(fr(END) * S.SR)
tt = np.arange(n) / S.SR
v = np.interp(tt * 60, np.arange(len(spd)), spd)
amp = np.clip(np.sqrt(v / 12.0), 0, 1.0)
orb = (tt * 60 >= TL['orb']) & (tt * 60 < TL['orbOut'] + 18)
amp = amp * np.where(orb, 0.55 + 0.45 * np.sin(2 * np.pi * 4.2 * tt) ** 2, 1.0)   # 绳上转圈：每圈“呜”一下
amp[tt * 60 >= FIN] = 0
noise = S.rng.standard_normal(n)
lo = S.fft_filter(noise, lo=300, hi=1600)
hi = S.fft_filter(noise, lo=1600, hi=6000)
wh = lo * amp + hi * amp ** 2 * 0.8
k = int(0.02 * S.SR)
wh = np.convolve(wh, np.ones(k) / k * 0 + np.hanning(k) / np.hanning(k).sum(), mode='same')
S.sfx(wh * 1.6, 0.0, 0.8, 0.0, send=0.3)

# —— 火星的“滋啦”：封面那一圈（到收快门后烧完）+ 高潮 ——
S.crackle(0, TL['close1'] + 40, lambda f: 260 * (1 - np.clip((f - TL['close1'] - 4) / 36, 0, 1)), 0.5, -0.2)
S.crackle(TL['wool'], TL['woolEnd'], lambda f: 520 * np.clip((f - TL['wool'] - 6) / 14, 0, 1) * (1 - np.clip((f - TL['woolEnd'] + 30) / 30, 0, 1)), 0.6, 0.25)
S.sfx(S.whoosh(0.5, 500, 9000, 1.0, 0.2), fr(TL['wool']), 0.6, 0.2)            # 点燃
S.sfx(S.whoosh(0.35, 7000, 400, 1.0, 0.7), fr(TL['close1']), 0.35, -0.2)       # 收快门：光被“吸”走
S.sfx(S.riser(fr(TL['opened'] - TL['open'])), fr(TL['open']), 0.35)           # 快门重新拉长：所有光回来
S.sfx(S.whoosh(0.4, 400, 6000, 1.0, 0.8), fr(TL['stick'] - 10), 0.35, -0.3)    # 光棒展开

# —— 文字：每个字落定一声“嗒” ——
S.text_cues(EV['cues'], 0.7)

S.master(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), loop=False)
