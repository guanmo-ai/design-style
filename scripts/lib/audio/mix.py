import json
import os
import shutil
import subprocess
import wave
import numpy as np

class Mixer:

    def fr(self, f):
        return f / self.fps

    def place(self, sig, t, gain=1.0, pan=0.0, send=0.0, bus=None):
        bus = self.MUS if bus is None else bus
        i = int(round(t * self.SR))
        if i < 0:
            i += self.NV
        if i >= self.N:
            return
        sig = sig[:self.N - i]
        gl = np.cos((pan + 1) * np.pi / 4) * gain
        gr = np.sin((pan + 1) * np.pi / 4) * gain
        bus[0, i:i + len(sig)] += sig * gl
        bus[1, i:i + len(sig)] += sig * gr
        if send:
            self.SEND[0, i:i + len(sig)] += sig * gl * send
            self.SEND[1, i:i + len(sig)] += sig * gr * send

    def sfx(self, sig, t, gain=1.0, pan=0.0, send=0.2):
        self.place(sig, t, gain, pan, send, self.SFX)

    def tt(self, d):
        return np.arange(int(d * self.SR)) / self.SR

    def midi(self, m):
        return 440.0 * 2 ** ((m - 69) / 12)

    def fft_filter(self, x, lo=None, hi=None):
        n = len(x)
        X = np.fft.rfft(x)
        f = np.fft.rfftfreq(n, 1 / self.SR)
        g = np.ones_like(f)
        if lo:
            g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1)) ** 4)
        if hi:
            g *= 1 / np.sqrt(1 + (f / hi) ** 4)
        return np.fft.irfft(X * g, n)

    def sweep(self, x, c0, c1):
        """一阶低通，截止频率从 c0 指数滑到 c1（逐样本，用在短的声音上）"""
        c = np.geomspace(c0, c1, len(x))
        a = np.exp(-2 * np.pi * c / self.SR)
        y = np.empty_like(x)
        acc = 0.0
        for i in range(len(x)):
            acc = (1 - a[i]) * x[i] + a[i] * acc
            y[i] = acc
        return y

    def saw(self, f):
        ph = np.cumsum(f) / self.SR
        return 2 * (ph % 1.0) - 1

    def env(self, t, a, d):
        return np.minimum(1, t / max(a, 0.0001)) * np.exp(-t / d)

    def reverb(self, x, seed, dec=0.6, length=2.4):
        t = self.tt(length)
        ir = np.random.default_rng(seed).standard_normal(len(t)) * np.exp(-t / dec)
        ir = self.fft_filter(ir, hi=6500)
        ir[:int(0.02 * self.SR)] = 0
        ir /= np.sqrt(np.sum(ir ** 2))
        n = len(x) + len(ir)
        nfft = 1 << (n - 1).bit_length()
        return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[:len(x)]

    def write(self, path, y):
        with wave.open(path, 'wb') as w:
            w.setnchannels(2)
            w.setsampwidth(2)
            w.setframerate(self.SR)
            w.writeframes((np.clip(y, -1, 1) * 32767).astype('<i2').tobytes())

    def loudness(self, y):
        tmp = self.final + '.measure.wav'
        self.write(tmp, y)
        r = subprocess.run(['ffmpeg', '-hide_banner', '-i', tmp, '-af', 'loudnorm=print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
        os.remove(tmp)
        js = r.stderr[r.stderr.rindex('{'):r.stderr.rindex('}') + 1]
        return float(json.loads(js)['input_i'])

    def limit(self, y, ceil=0.84, win=0.008):
        w = int(win * self.SR)
        need = np.minimum(1.0, ceil / (np.abs(y).max(axis=1) + 1e-12))
        nb = -(-len(need) // w)
        pad_ = np.ones(nb * w)
        pad_[:len(need)] = need
        blk = pad_.reshape(nb, w).min(axis=1)
        blk = np.minimum(blk, np.minimum(np.r_[1.0, blk[:-1]], np.r_[blk[1:], 1.0]))
        g = np.repeat(blk, w)[:len(need)]
        c = np.cumsum(np.r_[0.0, g])
        h = w // 2
        lo = np.clip(np.arange(len(g)) - h, 0, len(g))
        hi = np.clip(np.arange(len(g)) + h, 0, len(g))
        g = (c[hi] - c[lo]) / np.maximum(hi - lo, 1)
        return y * g[:, None]

    def master(self, output):
        self.final = os.fspath(output)
        os.makedirs(os.path.dirname(os.path.abspath(self.final)), exist_ok=True)
        duck = 0.65 + 0.35 * self.DUCK
        mix = self.MUS * duck + self.SFX * 0.62
        mix[0] += self.reverb(self.SEND[0], 1) * 0.4
        mix[1] += self.reverb(self.SEND[1], 2) * 0.4
        for ch in range(2):
            mix[ch] = self.fft_filter(mix[ch], lo=30)
        mix[:, :self.N - self.NV] += mix[:, self.NV:]
        mix = mix[:, :self.NV]
        mix = mix.T
        mix /= np.abs(mix).max() + 1e-09
        mix = np.tanh(mix * 1.2) / np.tanh(1.2)
        if shutil.which('ffmpeg'):
            y = mix * 0.5
            for _ in range(3):
                i = self.loudness(y)
                y = self.limit(y * 10 ** ((-14.0 - i) / 20))
            print('loudness %.2f LUFS' % self.loudness(y))
            self.write(self.final, y)
        else:
            self.write(self.final, mix * 0.89)
        print('wrote', self.final)
