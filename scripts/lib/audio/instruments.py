import numpy as np

class Instruments:

    def kick(self, level=1.0):
        t = self.tt(0.32)
        f = 48 + 120 * np.exp(-t / 0.03)
        y = np.sin(2 * np.pi * np.cumsum(f) / self.SR) * np.exp(-t / 0.14)
        y[:int(0.003 * self.SR)] += self.fft_filter(self.rng.standard_normal(int(0.003 * self.SR)), lo=2000) * 0.3
        return y * level * 0.62

    def clap(self, level=1.0):
        t = self.tt(0.22)
        e = sum((np.exp(-np.maximum(0, t - d) / 0.007) * (t >= d) for d in (0, 0.008, 0.017))) + 0.7 * np.exp(-np.maximum(0, t - 0.025) / 0.05) * (t >= 0.025)
        return self.fft_filter(self.rng.standard_normal(len(t)), lo=900, hi=7000) * e * level * 0.16

    def hat(self, level=1.0, d=0.03, open_=False):
        t = self.tt(0.4 if open_ else d * 4)
        y = self.fft_filter(self.rng.standard_normal(len(t)), lo=7000)
        return y * np.exp(-t / (0.11 if open_ else d)) * level * (0.04 if open_ else 0.04)

    def shaker(self, level=1.0):
        t = self.tt(0.06)
        return self.fft_filter(self.rng.standard_normal(len(t)), lo=5000, hi=12000) * np.sin(np.pi * t / 0.06) ** 2 * level * 0.022

    def crash(self, level=1.0):
        t = self.tt(2.0)
        y = self.fft_filter(self.rng.standard_normal(len(t)), lo=3500) * np.exp(-t / 0.7)
        return y * level * 0.09

    def bass(self, m, d, level=1.0):
        t = self.tt(d)
        f = self.midi(m)
        y = self.saw(np.full(len(t), f)) * 0.55 + np.sin(2 * np.pi * f * t) * 0.6
        y = self.fft_filter(y, hi=900)
        return y * self.env(t, 0.004, 0.16) * level * 0.3

    def piano(self, ms, d=0.5, level=1.0):
        """钢琴和弦：几个泛音、快起慢落，高泛音先消失"""
        t = self.tt(d)
        y = np.zeros_like(t)
        for m in ms:
            f = self.midi(m)
            for n, a in ((1, 1.0), (2, 0.45), (3, 0.25), (4, 0.12), (5, 0.06)):
                y += a * np.sin(2 * np.pi * f * n * t + n) * np.exp(-t / (0.35 / n ** 0.6))
        return y * np.minimum(1, t / 0.002) * level * 0.055 / np.sqrt(len(ms))

    def bell(self, m, level=1.0, dec=0.9):
        """钟琴：FM，调制比 3.5，亮"""
        f0 = self.midi(m)
        t = self.tt(dec * 3)
        idx = 1.6 * np.exp(-t / 0.08)
        y = np.sin(2 * np.pi * f0 * t + idx * np.sin(2 * np.pi * 3.5 * f0 * t))
        return y * np.minimum(1, t / 0.001) * np.exp(-t / dec) * level * 0.14

    def pad(self, ms, d, level=1.0, att=0.4, rel=0.8):
        t = self.tt(d + rel * 3)
        y = np.zeros_like(t)
        for m in ms:
            for det in (-0.07, 0.0, 0.08):
                f = self.midi(m + det)
                for n in range(1, 5):
                    y += 1 / n ** 1.8 * np.sin(2 * np.pi * n * f * t + self.rng.random() * 6)
        e = np.minimum(1, t / att) * np.where(t < d, 1.0, np.exp(-(t - d) / rel))
        return self.fft_filter(y, hi=2800) * e * level * 0.028 / np.sqrt(len(ms))

    def pluck_string(self, m, d=0.8, level=1.0, bright=0.5):
        """弹拨弦（Karplus-Strong）：狗绳“嘣”的一声"""
        f = self.midi(m)
        L = int(self.SR / f)
        buf = self.rng.uniform(-1, 1, L)
        out = np.zeros(int(d * self.SR))
        for i in range(len(out)):
            j = i % L
            nxt = (j + 1) % L
            v = buf[j]
            buf[j] = 0.996 * (bright * buf[j] + (1 - bright) * buf[nxt]) if i >= L else buf[j]
            out[i] = v
        return out * level * 0.25
