"""软的声音（毛绒那一期做的，任何“软、圆、可爱”的片子都能用）：混进 Song 里用——
    class MySong(Song, SoftFX): pass
“噗”（东西蓬开、落在软的地方）、“啵”（零件弹出来）、一把刷过去（很多细东西飞过）、压扁弹回的弹簧音、软的落地重击。
每个函数返回一段波形，自己用 S.sfx(波形, S.fr(帧号), 音量, 声像) 放到时间轴上；thump 直接放好。"""
import numpy as np


class SoftFX:
    def poof(self, level=1.0, d=0.32, fc=1500):
        """毛蓬开的“噗”：低通噪声，音头 20 毫秒，像拍了一下枕头"""
        t = self.tt(d)
        n = self.fft_filter(self.rng.standard_normal(len(t)), lo=120, hi=fc)
        return n * np.minimum(1, t / 0.02) * np.exp(-t / (d * 0.3)) * level * 0.9

    def bop(self, m, level=1.0, d=0.16):
        """零件“啵”地弹出来：正弦，音高先往上一挑再落回"""
        t = self.tt(d)
        f = self.midi(m) * (1 + 0.5 * np.exp(-t / 0.018))
        y = np.sin(2 * np.pi * np.cumsum(f) / self.SR) + 0.2 * np.sin(4 * np.pi * np.cumsum(f) / self.SR)
        return y * np.minimum(1, t / 0.003) * np.exp(-t / (d * 0.4)) * level * 0.5

    def brush(self, d=0.4, level=1.0, up=True):
        """一大把毛飞过去：带通噪声扫频，很软"""
        t = self.tt(d)
        n = self.rng.standard_normal(len(t))
        lo = self.fft_filter(n, lo=300, hi=1400) * (1 - t / d if up else t / d) + self.fft_filter(n, lo=1400, hi=5200) * (t / d if up else 1 - t / d)
        return lo * np.sin(np.pi * t / d) ** 1.4 * level * 0.5

    def boing(self, m, level=1.0, d=0.5):
        """压扁再弹回：音高跟着弹簧抖"""
        t = self.tt(d)
        f = self.midi(m) * (1 + 0.22 * np.exp(-t / 0.11) * np.cos(2 * np.pi * 5.5 * t))
        return np.sin(2 * np.pi * np.cumsum(f) / self.SR) * np.minimum(1, t / 0.004) * np.exp(-t / 0.2) * level * 0.4

    def thump(self, at, level=1.0):
        """落地：圆底鼓 + 低频 + 噗"""
        self.place(self.kick(1.2 * level), self.fr(at), 1.0); self.kicks.append(at)
        self.sfx(self.boom(0.8 * level, 100, 36, 0.7), self.fr(at), 0.7)
        self.sfx(self.poof(1.0 * level, 0.4), self.fr(at), 0.9, send=0.25)
