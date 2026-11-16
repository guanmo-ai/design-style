"""FUI 小样 · 配乐（5 秒，120 BPM，一拍 30 帧，A 小调）。
暗的合成器脉冲 + 一直在“算”的数据声（十六分音符的小电子音，音高取当前和弦）；
锁定 = 两声上行的哔 + 低音一沉；钻进去 = 上升的风声 + 落地重击；第二层仪表启动 = 每件一声“刷 + 咔”；
每次出字都有声音（song.text_cues）。时间全部来自页面：node ../../_lib/events.cjs film.html events.json；python3 audio.py out.wav"""
import json
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_lib'))
from song import Song  # noqa: E402

EV = json.loads((HERE / 'events.json').read_text())
END, BEAT, LOCK, D0, D1 = EV['end'], EV['beat'], EV['lock'], EV['dive0'], EV['dive1']
AM, F, DM, E = [57, 60, 64], [53, 57, 60], [50, 53, 57], [52, 56, 59]
CH = [(0, 45, AM), (120, 41, F), (180, 38, DM), (240, 40, E)]


class FuiSong(Song):
    def blip(self, m, d=0.06, level=1.0, wave='sine'):
        t = self.tt(d + 0.02)
        f = self.midi(m)
        y = np.sin(2 * np.pi * f * t) if wave == 'sine' else np.sign(np.sin(2 * np.pi * f * t)) * 0.4
        return y * np.minimum(1, t / 0.002) * np.exp(-t / (d * 0.5)) * level

    def scan(self, d=0.3, level=1.0):
        """面板长出来：一道往上扫的窄带噪声 + 收尾的咔"""
        t = self.tt(d)
        n = self.rng.standard_normal(len(t))
        lo = 800 + 5000 * (t / d) ** 2
        y = np.zeros_like(t)
        k = 8
        for i in range(k):
            a, b = int(i * len(t) / k), int((i + 1) * len(t) / k)
            seg = self.fft_filter(n, lo=lo[a], hi=lo[a] * 1.5)[a:b]
            y[a:b] = seg
        y *= np.sin(np.pi * t / d) ** 2 * 0.6
        c = self.fft_filter(self.rng.standard_normal(len(t)), lo=2000, hi=9000) * np.exp(-np.maximum(0, t - d * 0.85) / 0.003) * (t > d * 0.85)
        return (y + c * 0.8) * level


S = FuiSong(END, CH, beat=BEAT, seed=19, tail=2.5)
fr = S.fr

# ===== 乐队 =====
S.pad(0.8, wave='saw', fc=1100)
# 脉冲贝斯：八分音符，从第 0 帧就在走
for fm in np.arange(0, END, BEAT / 2):
    root = S.chord(fm)[1]
    S.place(S.sbass(root, 0.12, 1.0), fr(fm), 0.55 if fm < D1 else 0.7, 0, bus=S.PUMP)
# 鼓：前半只有闭镲 + 底鼓在锁定处起；钻进去落地后全套
for fm in np.arange(0, D1, BEAT / 4):
    S.place(S.hat(0.6), fr(fm), 0.28 if (fm / (BEAT / 4)) % 2 else 0.16, 0.3)
for fm in (LOCK, LOCK + 2 * BEAT):
    S.place(S.kick(1.0), fr(fm), 0.9); S.kicks.append(fm)
S.drums(D1, END + 1, level=0.9)
# 数据声：十六分音符的小电子音，音高在和弦里随机走，一直在“算”
rng = np.random.default_rng(3)
for fm in np.arange(0, END, BEAT / 4):
    if rng.random() < 0.7:
        m = S.tone(fm, int(rng.integers(0, 6)), 2)
        S.sfx(S.blip(m, 0.04, 1.0, 'square' if rng.random() < 0.3 else 'sine'), fr(fm), 0.07 + 0.04 * rng.random(), float(rng.uniform(-.7, .7)), send=0.25)
# 主旋律：钻进去之后，一句短的方波 + 马林巴
for p, m, ln in [(0, 76, 1), (1, 72, 1), (2, 69, 2), (4, 74, 1), (5, 72, 1), (6, 69, 1), (7, 68, 1)]:
    pass
S.hook(D1, [(0, 69, 2), (2, 72, 1), (3, 76, 1), (4, 74, 2), (6, 72, 1), (7, 71, 1)], 0.7, inst=lambda m, d: S.synth(m, d, 'square', 2600, 1200, 0.2, att=0.004, rel=0.05, det=0.004) * 0.5)

# ===== 动作 =====
S.sfx(S.rev_cymbal(0.5, 1.0), fr(LOCK) - 0.5, 0.35, 0, send=0.3)
S.sfx(S.blip(88, 0.09, 1.0), fr(LOCK), 0.45, 0.2, send=0.3)
S.sfx(S.blip(93, 0.12, 1.0), fr(LOCK + 5), 0.45, 0.2, send=0.3)
S.sfx(S.boom(0.8, 110, 40, 0.6), fr(LOCK), 0.55)
S.sfx(S.riser(fr(D1 - D0), 1.0, 300, 8000), fr(D0), 0.35, 0, send=0.3)
S.sfx(S.whoosh(fr(D1 - D0 - 10), 200, 6000, 1.0, 0.75), fr(D0 + 10), 0.55, 0, send=0.3)
S.place(S.crash(1.0), fr(D1), 0.75, 0.1, send=0.4)
S.place(S.kick(1.3), fr(D1), 1.0); S.kicks.append(D1)
S.sfx(S.boom(0.9, 120, 36, 0.9), fr(D1), 0.6)
for a in EV['acts']:
    if a['kind'] in ('panel', 'line') and a['t'] != LOCK:
        S.sfx(S.scan(0.22, 1.0), fr(a['t']), 0.22, float(np.sin(a['t']) * 0.4), send=0.2)
# 每次出字都有声音
S.text_cues([tuple(c) for c in EV['text']], 1.0)
S.master(sys.argv[1] if len(sys.argv) > 1 else 'fui.wav')
