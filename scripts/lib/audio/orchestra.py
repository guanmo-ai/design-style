"""电影感配乐用的音色（018 / 019 起）：三角钢琴、弦乐群、竖琴、拨弦、钢片琴、定音鼓、
电影冲击、倒放膨胀、人声垫。全部 numpy 向量化；和 AudioKit 一起用：CineKit(AudioKit, Orchestra)。"""
import numpy as np
from scipy.signal import butter, lfilter, sosfilt


class Orchestra:

    def _lp(self, x, fc, order=2):
        return sosfilt(butter(order, min(fc, self.SR * 0.45), 'low', fs=self.SR, output='sos'), x)

    def _bp(self, x, lo, hi, order=2):
        return sosfilt(butter(order, [lo, min(hi, self.SR * 0.45)], 'band', fs=self.SR, output='sos'), x)

    def grand(self, m, d=2.5, vel=0.8):
        """三角钢琴：带非谐性的十几个泛音，每个泛音两根弦稍微失谐；高泛音先衰减；击弦噪声。力度越大越亮。"""
        t = self.tt(d)
        f0 = self.midi(m)
        B = 0.00035 * (f0 / 261.6) ** 0.5
        y = np.zeros_like(t)
        bright = 0.6 + 0.8 * vel
        for n in range(1, 14):
            fn = n * f0 * np.sqrt(1 + B * n * n)
            if fn > self.SR * 0.42:
                break
            a = (1 / n ** (1.6 - 0.5 * vel)) * (1 if n == 1 else bright)
            dec = 2.6 * (261.6 / f0) ** 0.35 / (1 + 0.32 * (n - 1))
            for det in (-0.6, 0.6):
                y += a * 0.5 * np.sin(2 * np.pi * (fn + det * n * 0.08) * t + n * 1.3) * (0.7 * np.exp(-t / (dec * 0.25)) + 0.3 * np.exp(-t / dec))
        h = int(0.004 * self.SR)
        y[:h] += self._bp(self.rng.standard_normal(h), 1500, 7000) * 0.25 * vel
        y *= np.minimum(1, t / 0.0015)
        tail = int(0.08 * self.SR)
        y[-tail:] *= np.linspace(1, 0, tail)
        return y * vel * 0.16

    def strings(self, ms, d, level=1.0, att=0.6, rel=1.2, bright=2400, vib=5.2, swell=False):
        """弦乐群：每个音 7 根失谐锯齿 + 慢颤音 + 低通，像一排小提琴 / 中提琴。swell=True 时由弱到强。"""
        t = self.tt(d + rel * 2.5)
        y = np.zeros_like(t)
        for m in ms:
            f = self.midi(m)
            for k in range(7):
                det = (k - 3) * 0.055
                ph0 = self.rng.random()
                fv = f * 2 ** (det / 12) * (1 + 0.0035 * np.sin(2 * np.pi * (vib + k * 0.13) * t + k))
                ph = np.cumsum(fv) / self.SR + ph0
                y += (2 * (ph % 1.0) - 1) / 7
        y = self._lp(y, bright, 2)
        y = self._lp(y, bright * 1.6, 2)
        e = np.minimum(1, t / att) ** (2 if swell else 1) * np.where(t < d, 1.0, np.exp(-(t - d) / rel))
        return y * e * level * 0.06 / np.sqrt(len(ms))

    def choir(self, ms, d, level=1.0, att=0.8, rel=1.5):
        """人声垫“啊——”：锯齿过三个元音共振峰。"""
        t = self.tt(d + rel * 2.5)
        src = np.zeros_like(t)
        for m in ms:
            for det in (-0.08, 0.0, 0.07):
                f = self.midi(m + det) * (1 + 0.004 * np.sin(2 * np.pi * 4.8 * t + det * 30))
                ph = np.cumsum(f) / self.SR + self.rng.random()
                src += 2 * (ph % 1.0) - 1
        y = self._bp(src, 650, 1100) * 1.0 + self._bp(src, 1000, 1400) * 0.5 + self._bp(src, 2500, 3000) * 0.25
        e = np.minimum(1, t / att) * np.where(t < d, 1.0, np.exp(-(t - d) / rel))
        return y * e * level * 0.05 / np.sqrt(len(ms))

    def harp(self, m, d=2.0, level=1.0):
        """竖琴：Karplus-Strong（lfilter 实现的梳状反馈），亮一点、尾巴长。"""
        f = self.midi(m)
        L = int(round(self.SR / f))
        n = int(d * self.SR)
        x = np.zeros(n)
        x[:L] = self._lp(self.rng.uniform(-1, 1, L), 6000, 1)
        g = 0.998 ** (440 / f) ** 0.3
        a = np.zeros(L + 2); a[0] = 1; a[L] = -g * 0.5; a[L + 1] = -g * 0.5
        y = lfilter([1.0], a, x)
        return self._lp(y, 5000, 1) * np.minimum(1, np.arange(n) / 30) * level * 0.22

    def pizz(self, m, level=1.0):
        """弦乐拨弦：短、闷、有一点木头声。"""
        y = self.harp(m, 0.6, 1.0)
        t = self.tt(0.6)
        return self._lp(y, 2200, 2) * np.exp(-t / 0.12) * level * 1.6

    def celesta(self, m, d=1.6, level=1.0):
        """钢片琴 / 八音盒：几根高泛音，敲击亮、尾巴纯。"""
        t = self.tt(d)
        f = self.midi(m)
        y = np.sin(2 * np.pi * f * t) * np.exp(-t / (d * 0.4)) + 0.35 * np.sin(2 * np.pi * 4.0 * f * t) * np.exp(-t / 0.08) + 0.15 * np.sin(2 * np.pi * 9.2 * f * t) * np.exp(-t / 0.03)
        return y * np.minimum(1, t / 0.001) * level * 0.12

    def marimba(self, m, level=1.0):
        t = self.tt(0.7)
        f = self.midi(m)
        y = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.22) + 0.4 * np.sin(2 * np.pi * 3.93 * f * t) * np.exp(-t / 0.05) + 0.12 * np.sin(2 * np.pi * 9.9 * f * t) * np.exp(-t / 0.012)
        return y * np.minimum(1, t / 0.0008) * level * 0.16

    def timpani(self, m=38, level=1.0, d=2.2):
        """定音鼓：音高先高一点再落到位，皮面噪声，长尾。"""
        t = self.tt(d)
        f0 = self.midi(m)
        f = f0 * (1 + 0.08 * np.exp(-t / 0.05))
        ph = np.cumsum(f) / self.SR
        y = (np.sin(2 * np.pi * ph) + 0.5 * np.sin(2 * np.pi * 1.5 * ph) * np.exp(-t / 0.3) + 0.3 * np.sin(2 * np.pi * 1.99 * ph) * np.exp(-t / 0.5)) * np.exp(-t / 0.8)
        n = int(0.03 * self.SR)
        y[:n] += self._bp(self.rng.standard_normal(n), 200, 2000) * np.linspace(0.8, 0, n)
        return y * level * 0.35

    def hit(self, level=1.0, m=31):
        """电影冲击：次低音下坠 + 定音鼓 + 一层亮的金属噪声 + 长尾。"""
        t = self.tt(3.0)
        f = self.midi(m) * (1 + 1.5 * np.exp(-t / 0.04))
        sub = np.sin(2 * np.pi * np.cumsum(f) / self.SR) * np.exp(-t / 0.9)
        noise = self._bp(self.rng.standard_normal(len(t)), 300, 6000) * np.exp(-t / 0.18) * 0.5
        y = sub + noise
        y[:len(self.timpani(m + 7, 1.0, 3.0))] += self.timpani(m + 7, 1.0, 3.0) * 1.4
        return y * level * 0.45

    def swell(self, ms, d=1.2, level=1.0):
        """倒放膨胀：一个和弦的混响尾巴倒过来，越来越响，正好在拍点上停。"""
        x = sum(self.grand(m, d + 0.6, 0.9) for m in ms)
        y = self.reverb(np.r_[x, np.zeros(int(1.0 * self.SR))], 7, dec=0.9, length=2.2)
        y = y[:int(d * self.SR)][::-1]
        t = self.tt(d)
        return y * (t / d) ** 1.5 * level * 1.4

    def riser2(self, d, level=1.0):
        """上升：带通噪声从低扫到高 + 上滑的正弦，最后一下最响。"""
        t = self.tt(d)
        x = self.rng.standard_normal(len(t))
        seg = 24
        out = np.zeros_like(x)
        for k in range(seg):
            a, b = k * len(x) // seg, (k + 1) * len(x) // seg
            c = 300 * (40 ** ((k + 0.5) / seg))
            out[a:b] = self._bp(x, c * 0.7, c * 1.4)[a:b]
        f = 150 * 10 ** (t / d)
        out += 0.3 * np.sin(2 * np.pi * np.cumsum(f) / self.SR)
        return out * (t / d) ** 2.5 * level * 0.25

    def tape_stop(self, sig_len=1.0, m=50, level=1.0):
        """倒带 / 磁带停转：音高一路往下掉的和弦。"""
        t = self.tt(sig_len)
        y = np.zeros_like(t)
        for k, iv in enumerate((0, 7, 12, 16)):
            f = self.midi(m + iv) * (1 - 0.85 * (t / sig_len) ** 1.3)
            y += np.sin(2 * np.pi * np.cumsum(f) / self.SR + k) / (1 + k * 0.5)
        return self._lp(y, 3000) * np.minimum(1, t / 0.02) * (1 - t / sig_len) ** 0.5 * level * 0.2
