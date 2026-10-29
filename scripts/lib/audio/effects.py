import numpy as np

class Effects:

    def whoosh(self, d=0.6, c0=300, c1=7000, level=1.0, peak=0.5):
        t = self.tt(d)
        e = np.sin(np.pi * np.clip(t / d, 0, 1) ** (np.log(0.5) / np.log(peak))) ** 2
        return self.sweep(self.rng.standard_normal(len(t)), c0, c1) * e * level * 0.45

    def riser(self, d, level=1.0, c0=400, c1=9000):
        t = self.tt(d)
        y = self.sweep(self.rng.standard_normal(len(t)), c0, c1)
        f = 200 * 8 ** (t / d)
        y += 0.25 * np.sin(2 * np.pi * np.cumsum(f) / self.SR)
        return y * (t / d) ** 2.2 * level * 0.3

    def boom(self, level=1.0, f0=120, f1=38, d=0.9):
        t = self.tt(d)
        f = f1 + (f0 - f1) * np.exp(-t / 0.05)
        y = np.sin(2 * np.pi * np.cumsum(f) / self.SR) * np.exp(-t / 0.3)
        y += 0.25 * self.fft_filter(self.rng.standard_normal(len(t)), lo=200, hi=3000) * np.exp(-t / 0.04)
        return y * level * 0.6

    def thock(self, m, level=1.0):
        """字母贴上镜头：木块一样的“咚”，调好了音"""
        t = self.tt(0.25)
        f = self.midi(m)
        y = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.06) + 0.5 * np.sin(2 * np.pi * 2.7 * f * t) * np.exp(-t / 0.02)
        y[:int(0.002 * self.SR)] += self.rng.standard_normal(int(0.002 * self.SR)) * 0.4
        return y * level * 0.28

    def click(self, level=1.0, lo=1800, hi=9000, d=0.004):
        t = self.tt(0.03)
        return self.fft_filter(self.rng.standard_normal(len(t)), lo=lo, hi=hi) * np.exp(-t / d) * level * 0.25

    def heel(self, level=1.0):
        t = self.tt(0.12)
        y = np.sin(2 * np.pi * 1900 * t) * np.exp(-t / 0.012) + self.fft_filter(self.rng.standard_normal(len(t)), lo=2500) * np.exp(-t / 0.006)
        return y * level * 0.12

    def rip(self, d=0.5, level=1.0):
        """横幅撕开：噼啪的纸声"""
        t = self.tt(d)
        y = np.zeros_like(t)
        for _ in range(60):
            i = int(self.rng.random() ** 1.6 * len(t) * 0.9)
            n = min(len(t) - i, int(0.004 * self.SR))
            y[i:i + n] += self.rng.standard_normal(n) * np.exp(-np.arange(n) / (0.001 * self.SR)) * (1 - i / len(t))
        return self.fft_filter(y, lo=1500, hi=10000) * level * 0.5

    def screech(self, d, m0=98, m1=86, level=1.0):
        t = self.tt(d)
        f = self.midi(m0) * (self.midi(m1) / self.midi(m0)) ** (t / d)
        y = np.sin(2 * np.pi * np.cumsum(f) / self.SR + 0.7 * np.sin(2 * np.pi * 41 * t))
        e = np.minimum(1, t / 0.03) * np.minimum(1, (d - t) / 0.05)
        return y * e * level * 0.05

    def engine(self, d, f0, f1, level=1.0, curve=1.0, near=None):
        """引擎：两个失谐的锯齿 + 低频噪声，音高 f0 → f1；near 给出“越来越近”的音量包络"""
        t = self.tt(d)
        u = (t / d) ** curve
        f = f0 * (f1 / f0) ** u
        y = self.saw(f) * 0.5 + self.saw(f * 1.5) * 0.25 + self.saw(f * 0.5) * 0.3
        y = self.fft_filter(y, hi=2400) + 0.12 * self.fft_filter(self.rng.standard_normal(len(t)), hi=500)
        e = near if near is not None else np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.05)
        return y * e * level * 0.12

    def slowmo(self, d, level=1.0):
        """慢动作的“呜——”：一个往下掉的低音 + 倒放的噪声"""
        t = self.tt(d)
        f = 160 * 0.35 ** (t / d)
        y = np.sin(2 * np.pi * np.cumsum(f) / self.SR) * 0.8 + 0.3 * self.sweep(self.rng.standard_normal(len(t)), 3000, 300)
        return y * np.sin(np.pi * t / d) * level * 0.4

    def shimmer(self, d, level=1.0):
        t = self.tt(d)
        y = sum((np.sin(2 * np.pi * self.midi(m) * t + m) for m in (93, 97, 100))) / 3
        return y * np.sin(np.pi * t / d) ** 2 * level * 0.06

    def clank(self, level=1.0):
        t = self.tt(1.2)
        f0 = 180
        y = sum((a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t / k) for r, a, k in ((1, 1, 0.5), (2.76, 0.6, 0.25), (5.4, 0.35, 0.1))))
        y += 0.6 * self.fft_filter(self.rng.standard_normal(len(t)), lo=500, hi=6000) * np.exp(-t / 0.03)
        return y * level * 0.3

    def anvil(self, m=69, level=1.0, d=0.8):
        t = self.tt(d)
        f0 = self.midi(m)
        y = sum((a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t / (d * k)) for r, a, k in ((1, 1, 0.5), (2.76, 0.55, 0.25), (5.4, 0.35, 0.12))))
        y += 0.4 * self.fft_filter(self.rng.standard_normal(len(t)), lo=2000) * np.exp(-t / 0.01)
        return y * np.minimum(1, t / 0.0005) * level * 0.2

    def tom(self, m, level=1.0):
        t = self.tt(0.6)
        f = self.midi(m) * (1 + 0.6 * np.exp(-t / 0.03))
        y = np.sin(2 * np.pi * np.cumsum(f) / self.SR) * np.exp(-t / 0.22)
        return y * level * 0.5

    def hiss(self, d, level=1.0):
        t = self.tt(d)
        y = self.fft_filter(self.rng.standard_normal(len(t)), lo=3500, hi=11000)
        return y * np.minimum(1, t / 0.02) * np.exp(-np.maximum(0, t - d * 0.5) / (d * 0.25)) * level * 0.2

    def glide(self, m0, m1, d, level=1.0):
        t = self.tt(d)
        f = self.midi(m0) * (self.midi(m1) / self.midi(m0)) ** (t / d)
        return np.sin(2 * np.pi * np.cumsum(f) / self.SR) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.6 * level * 0.07
