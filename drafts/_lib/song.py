"""一整首配乐的骨架（照 004 孟菲斯的做法）：从第一拍到最后一拍是同一首歌，换章只换和弦、不换乐队。

- 和弦表 CH：[(起始帧, 根音, [和弦音…])]，换章那一帧换和弦（第一版、第二版的问题就是每段换一套声音，BGM 断了）
- 总线：MUS 鼓 · PUMP 跟着底鼓“泵”的铺底 / 贝斯 / 琶音 · LEAD 主旋律（乒乓延迟）· SFX 音效（压低、调好音）
- 换章前 16 帧：风声 + 滑哨扫过去（transition；不能叫 sweep，会盖掉 Mixer.sweep 滤波），重拍上一记镲
- 母带：混响、侧链、-14 LUFS（用 AudioKit 的响度 / 限幅）
用法见 drafts/ascii/film/audio.py。"""
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts' / 'lib'))
from audio import AudioKit  # noqa: E402
from audio.orchestra import Orchestra  # noqa: E402


class Song(AudioKit, Orchestra):
    def __init__(self, end_frame, ch, fps=60, beat=30, seed=7, tail=3.0):
        super().__init__(duration=end_frame / fps, seed=seed, fps=fps, tail=tail)
        self.CH, self.BEAT, self.END = ch, beat, end_frame
        self.PUMP = np.zeros((2, self.N))
        self.LEAD = np.zeros((2, self.N))
        self.kicks = []

    # —— 和弦 ——
    def chord(self, f):
        c = self.CH[0]
        for x in self.CH:
            if f >= x[0]:
                c = x
        return c

    def tone(self, f, k, octv=0):
        ns = self.chord(f)[2]
        return ns[k % len(ns)] + 12 * (k // len(ns)) + 12 * octv

    # —— 音色 ——
    def lp1(self, x, fc):
        """一阶低通（向量化：按块近似成 FFT 低通）"""
        return self.fft_filter(x, hi=fc)

    def synth(self, m, d, wave='saw', fc0=4000, fc1=800, fdec=0.12, att=0.004, dec=None, rel=0.05, det=0.0, vib=0.0, level=1.0):
        """加法合成的模拟合成器：锯齿 / 方波 + 滤波包络；det = 两个声部的失谐"""
        f0 = self.midi(m)
        t = self.tt(d + rel)
        fc = fc1 + (fc0 - fc1) * np.exp(-t / fdec)
        y = np.zeros_like(t)
        voices = (0.0,) if det == 0 else (-det, det)
        for dv in voices:
            f = f0 * (1 + dv)
            ph = 2 * np.pi * f * t + (vib * np.sin(2 * np.pi * 5.5 * t) * np.minimum(1, t / 0.25) if vib else 0)
            for h in range(1, 48):
                if f * h > 12000:
                    break
                if wave == 'square' and h % 2 == 0:
                    continue
                y += 1 / h / (1 + (f * h / fc) ** 4) * np.sin(h * ph + (self.rng.random() * 6.28 if dv else 0))
        y /= len(voices)
        env = np.minimum(1, t / att)
        if dec is not None:
            env = env * np.exp(-t / dec)
        env = env * np.where(t < d, 1, np.exp(-(t - d) / max(rel / 4, 1e-3)))
        return y * env * level

    def sbass(self, m, d=0.2, level=1.0):
        y = self.synth(m, d, 'saw', 2400, 260, 0.06, 0.003, None, 0.03)
        t = self.tt(d + 0.03)
        y = y[:len(t)] + 0.5 * np.sin(2 * np.pi * self.midi(m) * t) * np.where(t < d, 1, 0.2)
        return np.tanh(y * 1.6) * level

    def snare(self, level=1.0):
        t = self.tt(0.3)
        body = np.sin(2 * np.pi * np.cumsum(180 + 60 * np.exp(-t / 0.02)) / self.SR) * np.exp(-t / 0.05)
        n = self.fft_filter(self.rng.standard_normal(len(t)), lo=1200, hi=8000) * np.exp(-t / 0.08)
        return (body * 0.6 + n * 0.8) * level * 0.5

    def whistle(self, m0, m1, d=0.24, level=1.0):
        t = self.tt(d)
        f = self.midi(m0) * (self.midi(m1) / self.midi(m0)) ** (t / d)
        return np.sin(2 * np.pi * np.cumsum(f) / self.SR) * np.sin(np.pi * t / d) ** 0.7 * level * 0.5

    def tink(self, m, level=1.0, dec=0.35):
        t = self.tt(dec * 3)
        f = self.midi(m)
        y = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t / 0.05)
        return y * np.minimum(1, t / 0.001) * np.exp(-t / dec) * level * 0.4

    # —— 编曲 ——
    def drums(self, f0, f1, clap=True, open_hat=True, level=1.0, skip=()):
        """四拍底鼓、二四拍拍手 + 军鼓、反拍开镲、十六分闭镲；skip 里的帧段整段不打（break）"""
        b0 = int(np.ceil(f0 / self.BEAT - 1e-9))
        for b in range(b0, int(np.ceil(f1 / self.BEAT))):
            fm = b * self.BEAT
            if any(a <= fm < z for a, z in skip):
                continue
            self.place(self.kick(level), self.fr(fm), 0.95); self.kicks.append(fm)
            if clap and b % 2 == 1:
                self.place(self.clap(level), self.fr(fm), 0.9, 0.05, send=0.25)
                self.place(self.snare(level), self.fr(fm), 0.5, -0.05, send=0.2)
            if open_hat:
                self.place(self.hat(level, open_=True), self.fr(fm + self.BEAT / 2), 1.2, 0.25)
            for s in (0, 0.25, 0.75):
                self.place(self.hat(level), self.fr(fm + s * self.BEAT), 1.0, -0.3)

    def bassline(self, f0, f1, level=1.0, skip=()):
        """八度跳跃的八分音符"""
        st = self.BEAT / 2
        for k, fm in enumerate(np.arange(np.ceil(f0 / st - 1e-9) * st, f1, st)):
            if any(a <= fm < z for a, z in skip):
                continue
            r = self.chord(fm)[1]
            self.place(self.sbass(r + (12 if k % 2 else 0), 0.19), self.fr(fm), 0.4 * level, bus=self.PUMP)

    def pad(self, level=1.0, wave='saw', fc=1800):
        """和弦铺底：每个和弦一段，接缝处交叉淡入，从头铺到尾"""
        for i, (s, _, ns) in enumerate(self.CH):
            e = self.CH[i + 1][0] if i + 1 < len(self.CH) else self.END + 90
            d = self.fr(e - s) + 0.15
            p = sum(self.synth(n, d, wave, fc, fc * 0.75, 9, att=0.08, rel=0.4, det=0.006) for n in ns)
            self.place(p, self.fr(s), 0.05 * level, send=0.35, bus=self.PUMP)

    def arp(self, f0, f1, level=1.0, wave='square', pattern=(0, 1, 2, 3, 4, 3, 2, 1), octv=0, skip=(), inst=None):
        st = self.BEAT / 4
        for k, fm in enumerate(np.arange(np.ceil(f0 / st - 1e-9) * st, f1, st)):
            if any(a <= fm < z for a, z in skip):
                continue
            m = self.tone(fm, pattern[k % len(pattern)], octv)
            acc = 1.0 if k % 4 == 0 else 0.7
            sig = inst(m) if inst else self.synth(m, 0.09, wave, 5000, 900, 0.05, dec=0.09, rel=0.03)
            self.place(sig, self.fr(fm), 0.06 * acc * level, 0.35 * (-1) ** k, send=0.15, bus=self.PUMP)

    def hook(self, start, notes, level=1.0, inst=None, eighth=None):
        """主旋律一句：[(八分音符位置, MIDI, 长度（八分音符）)]"""
        e = eighth or self.BEAT / 2
        for pos, m, ln in notes:
            sig = inst(m, self.fr(e * ln) * 0.9) if inst else self.synth(m, self.fr(e * ln) * 0.9, 'square', 3200, 2200, 0.3, att=0.006, rel=0.08, det=0.003, vib=0.25)
            self.place(sig, self.fr(start + e * pos), 0.11 * level, -0.1, send=0.3, bus=self.LEAD)

    def transition(self, t, up=True, level=1.0):
        """换章：拍点前 16 帧开始的风声 + 滑哨，重拍上一记镲"""
        self.sfx(self.whoosh(0.3, 300, 7000, 1.0, 0.8), self.fr(t - 16), 0.5 * level)
        self.sfx(self.whistle(74, 86, 0.24) if up else self.whistle(86, 72, 0.24), self.fr(t - 15), 0.18 * level, 0.2)
        self.place(self.crash(0.9 * level), self.fr(t), 0.8, 0.2, send=0.2)

    # —— 文字的声音（主人 2026-11-06：“文字变得很快，但是少了音效跟它搭配”）——
    def type_tick(self, m, level=1.0, bright=1.0):
        """解码的“嗒”：一下很短的高通噪声 + 一个调好音的数字小音（取当前和弦里的音）"""
        t = self.tt(0.05)
        n = self.fft_filter(self.rng.standard_normal(len(t)), lo=2400 * bright, hi=11000) * np.exp(-t / 0.0022)
        f = self.midi(m)
        b = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.012) * np.minimum(1, t / 0.0004)
        return (n * 0.9 + b * 0.35) * level

    def key_tick(self, m, level=1.0):
        """标题一个字落定：更沉的键帽声（咔 + 一个短的木质音）"""
        t = self.tt(0.12)
        n = self.fft_filter(self.rng.standard_normal(len(t)), lo=900, hi=7000) * np.exp(-t / 0.004)
        f = self.midi(m)
        b = (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t / 0.01)) * np.exp(-t / 0.03)
        return (n * 0.8 + b * 0.55) * np.minimum(1, t / 0.0005) * level

    def rev_cymbal(self, d=0.3, level=1.0):
        """倒放的镲：吸进去，正好在砸字那一帧停"""
        t = self.tt(d)
        y = self.fft_filter(self.rng.standard_normal(len(t)), lo=2500, hi=14000) * (t / d) ** 2.6
        y += 0.5 * self.fft_filter(self.rng.standard_normal(len(t)), lo=300, hi=2000) * (t / d) ** 4
        return y * level * 0.5

    def slam(self, m=38, level=1.0):
        """大字砸下来（预告片的字卡）：次低音 + 一记很干的“啪” + 金属的余振"""
        t = self.tt(1.4)
        f = self.midi(m) * (1 + 2.2 * np.exp(-t / 0.025))
        sub = np.sin(2 * np.pi * np.cumsum(f) / self.SR) * np.exp(-t / 0.35)
        snap = self.fft_filter(self.rng.standard_normal(len(t)), lo=180, hi=6500) * np.exp(-t / 0.035)
        ring = sum(a * np.sin(2 * np.pi * self.midi(m + 36) * r * t) * np.exp(-t / k) for r, a, k in ((1, 0.25, 0.4), (2.76, 0.14, 0.18), (5.4, 0.08, 0.08)))
        y = np.tanh((sub * 1.1 + snap * 0.9) * 1.6) + ring
        return y * np.minimum(1, t / 0.0006) * level * 0.55

    def text_cues(self, cues, level=1.0, pan=0.0):
        """读页面登记的 cue：[起始帧, 字数, 每字帧数, 种类]。每落定一个字一声（一帧最多一声）；slam = 砸字"""
        for f0, n, rate, kind in cues:
            if kind == 'slam':
                self.sfx(self.rev_cymbal(0.28, 1.0), self.fr(f0) - 0.28, 0.75 * level, 0.0, send=0.3)
                self.sfx(self.slam(self.chord(f0)[1] - 12 if self.chord(f0)[1] > 40 else self.chord(f0)[1], 1.0), self.fr(f0), 1.0 * level, 0.0, send=0.35)
                continue
            step = max(rate, 1.0)
            k_n = int(np.ceil(n * rate / step))
            for j in range(k_n):
                at = f0 + j * step
                m = self.tone(at, int(self.rng.integers(0, 5)), 2 if kind != 'title' else 1)
                p = pan + 0.5 * np.sin(j * 0.9 + f0)
                if kind == 'title':
                    self.sfx(self.key_tick(m, 1.0), self.fr(at), 0.7 * level, p * 0.5, send=0.2)
                elif kind == 'small':
                    self.sfx(self.type_tick(m, float(self.rng.uniform(0.5, 1.0)), 1.3), self.fr(at), 0.26 * level, p, send=0.1)
                else:
                    self.sfx(self.type_tick(m, float(self.rng.uniform(0.6, 1.0))), self.fr(at), 0.4 * level, p, send=0.15)

    def master(self, output, loop=False):
        # 侧链：PUMP 跟着每一记底鼓往下压
        tsec = np.arange(self.N) / self.SR
        ks = np.array(sorted(self.fr(k) for k in self.kicks)) if self.kicks else np.array([1e9])
        idx = np.searchsorted(ks, tsec, side='right') - 1
        since = np.where(idx >= 0, tsec - ks[np.clip(idx, 0, None)], 9.0)
        duck = 1 - 0.35 * (1 - np.clip(since / 0.22, 0, 1)) ** 2
        self.MUS += self.PUMP * duck[None, :]
        # 主旋律：乒乓延迟（附点八分）
        D = int(self.fr(self.BEAT * 0.75) * self.SR)
        lead = self.LEAD.copy()
        lead[0, D:] += self.LEAD[1, :-D] * 0.3
        lead[1, 2 * D:] += self.LEAD[0, :-2 * D] * 0.2
        self.MUS += lead
        self.SEND += lead * 0.25
        self.DUCK[:] = 1.0
        super().master(output, loop=loop)
