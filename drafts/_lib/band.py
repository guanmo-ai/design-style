"""band.py · 更好的配乐引擎（numpy + scipy，没有采样）。在 song.py 的“一整首歌”骨架上加：

乐器 —— 每一件都按真实乐器的发声方式合成：
  kick2 / snare2 / brush / rim / hat2 / ride / shaker2 / clap2   鼓组：音高下滑的正弦 + 敲击、金属感用不和谐的方波叠加
  upright(m)   立式贝斯：Karplus–Strong 弦（lfilter 做梳状滤波，很快）+ 琴身低通 + 拨弦的“噗”
  sub(m)       电子贝斯的超低音
  rhodes(m)    电钢琴：FM（1:1 主体 + 14:1 音叉的叮）+ 颤音，力度越大越亮
  brass(ms)    铜管齐奏：失谐锯齿 + 滤波包络 + 起音滑音 + 尾巴下滑（fall）
  clarinet(m)  单簧管 / 弱音小号的旋律：奇次泛音 + 渐入颤音 + 气声
  glock(m)     钢片琴 / 钟琴
  pluck(m)     电子摇摆里的吉他切音
  vinyl(d)     黑胶底噪

混音 —— 分轨（drums / bass / keys / lead / pad / brass / sfx），每一轨自己的音量、声像宽度、混响送量；
  贝斯、键盘、铺底按底鼓做侧链；双混响（房间 + 板式）、预延迟、高频衰减；磁带饱和、M/S 加宽、胶水压缩；最后 -14 LUFS。
用法见 drafts/pencil-test/film/audio.py。"""
import numpy as np
from scipy.signal import lfilter

from song import Song
from softfx import SoftFX

BUSES = ('drums', 'bass', 'keys', 'lead', 'pad', 'brass')


class Band(Song, SoftFX):
    def __init__(self, end_frame, ch, fps=60, beat=30, seed=7, tail=3.0, swing=0.0):
        super().__init__(end_frame, ch, fps=fps, beat=beat, seed=seed, tail=tail)
        self.B = {k: np.zeros((2, self.N)) for k in BUSES}
        self.swing = swing          # 0 = 直八分，0.33 = 三连音摇摆
        self.kick_times = []

    # ───── 时间 ─────
    def at(self, beat):
        """第几拍（可以是小数）→ 帧；八分音符的后半拍按 swing 往后推"""
        b = np.floor(beat); frac = beat - b
        if abs(frac - .5) < 1e-6 and self.swing:
            frac = .5 + self.swing * .5
        return (b + frac) * self.BEAT

    def put(self, bus, sig, beat=None, frame=None, gain=1.0, pan=0.0):
        f = self.at(beat) if frame is None else frame
        self.place(sig, self.fr(f), gain, pan, 0.0, self.B[bus])

    # ───── 工具 ─────
    def _lp1(self, x, fc):
        a = np.exp(-2 * np.pi * fc / self.SR)
        return lfilter([1 - a], [1, -a], x)

    def _hp1(self, x, fc):
        return x - self._lp1(x, fc)

    def _env(self, n, att, dec, sus=0.0, rel=None):
        t = np.arange(n) / self.SR
        e = np.minimum(1, t / max(att, 1e-4))
        e = e * (sus + (1 - sus) * np.exp(-np.maximum(0, t - att) / max(dec, 1e-4)))
        if rel:
            r = int(rel * self.SR)
            if r < n:
                e[-r:] *= np.linspace(1, 0, r) ** 2
        return e

    def _additive(self, f0, d, amps, phase_mod=None, det=0.0):
        t = self.tt(d)
        y = np.zeros_like(t)
        for h, a in enumerate(amps, 1):
            if f0 * h > 16000 or a == 0:
                continue
            ph = 2 * np.pi * f0 * h * (1 + det) * t
            if phase_mod is not None:
                ph = ph + phase_mod * h
            y += a * np.sin(ph + self.rng.random() * 6.28)
        return y

    # ───── 鼓 ─────
    def kick2(self, level=1.0, punch=1.0, d=0.45):
        t = self.tt(d)
        f = 46 + 110 * np.exp(-t / 0.03) + 30 * np.exp(-t / 0.005)
        body = np.sin(2 * np.pi * np.cumsum(f) / self.SR) * np.exp(-t / 0.16)
        click = self._hp1(self.rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.004) * 0.35 * punch
        y = np.tanh((body + click) * 1.8) * level
        return y

    def snare2(self, level=1.0, tone=185, d=0.3, wire=1.0):
        t = self.tt(d)
        body = (np.sin(2 * np.pi * tone * t) + 0.5 * np.sin(2 * np.pi * tone * 1.6 * t)) * np.exp(-t / 0.05)
        n = self.fft_filter(self.rng.standard_normal(len(t)), lo=1200, hi=9000) * np.exp(-t / 0.11) * wire
        return np.tanh((body * 0.6 + n * 0.9) * 1.4) * level * 0.7

    def brush(self, level=1.0, d=0.22, sweep=False):
        t = self.tt(d)
        n = self.fft_filter(self.rng.standard_normal(len(t)), lo=1800, hi=9000)
        env = (np.minimum(1, t / 0.035) * np.exp(-t / 0.08)) if not sweep else np.sin(np.pi * t / d) ** 1.5
        return n * env * level * 0.6

    def rim(self, level=1.0):
        t = self.tt(0.06)
        y = (np.sin(2 * np.pi * 1700 * t) + 0.6 * np.sin(2 * np.pi * 820 * t)) * np.exp(-t / 0.008)
        return y * level * 0.5

    def _metal(self, d, dec, lo=6000):
        t = self.tt(d)
        y = np.zeros_like(t)
        for fq in (205.3, 304.4, 369.6, 522.7, 540.0, 800.0):
            y += np.sign(np.sin(2 * np.pi * fq * 9.2 * t + self.rng.random() * 6.28))
        y = self.fft_filter(y, lo=lo, hi=16000)
        return y * np.exp(-t / dec)

    def hat2(self, level=1.0, open_=False):
        d = 0.35 if open_ else 0.06
        return self._metal(d, 0.12 if open_ else 0.018) * level * 0.22

    def ride(self, level=1.0, ping=1.0):
        t = self.tt(1.4)
        y = self._metal(1.4, 0.6, lo=3500) * 0.18
        y += ping * np.sin(2 * np.pi * 3150 * t) * np.exp(-t / 0.25) * 0.05
        return y * level

    def shaker2(self, level=1.0):
        t = self.tt(0.09)
        return self.fft_filter(self.rng.standard_normal(len(t)), lo=4000, hi=12000) * np.sin(np.pi * t / 0.09) ** 2 * level * 0.25

    def clap2(self, level=1.0):
        t = self.tt(0.3)
        n = self.fft_filter(self.rng.standard_normal(len(t)), lo=900, hi=6000)
        e = np.zeros_like(t)
        for k, o in enumerate((0, 0.009, 0.019, 0.03)):
            e += (t >= o) * np.exp(-np.maximum(0, t - o) / (0.006 if k < 3 else 0.1))
        return n * e * level * 0.5

    def vinyl(self, d, level=1.0):
        n = int(d * self.SR)
        hiss = self.fft_filter(self.rng.standard_normal(n), lo=3000, hi=12000) * 0.03
        pops = np.zeros(n)
        idx = self.rng.integers(0, n, int(d * 9))
        pops[idx] = self.rng.uniform(0.2, 1, len(idx)) * self.rng.choice([-1, 1], len(idx))
        pops = self.fft_filter(np.convolve(pops, np.exp(-np.arange(60) / 8), 'same'), lo=800, hi=9000)
        return (hiss + pops * 0.25) * level

    # ───── 低音 ─────
    def upright(self, m, d=0.6, level=1.0, bright=0.5):
        """Karplus–Strong：一段噪声在长度 = 周期的延迟线里来回、每次被平均一下（= 低通），就是一根弦"""
        f0 = self.midi(m)
        n = int((d + 0.15) * self.SR)
        P = self.SR / f0
        N = int(P)
        frac = P - N
        exc = np.zeros(n)
        burst = self.fft_filter(self.rng.standard_normal(N + 2), hi=600 + 2400 * bright)
        exc[:N + 2] = burst
        g = 0.996 - 0.01 * (1 - bright)
        a = np.zeros(N + 3); a[0] = 1; a[N] = -g * (1 - frac) * 0.5; a[N + 1] = -g * 0.5; a[N + 2] = -g * frac * 0.5
        y = lfilter([1.0], a, exc)
        y = self._lp1(y, 900 + 1500 * bright)
        t = np.arange(n) / self.SR
        thump = np.sin(2 * np.pi * f0 * t) * np.exp(-t / 0.04) * 0.5
        y = (y / (np.abs(y).max() + 1e-9) + thump) * self._env(n, 0.003, d * 0.8, 0.0, 0.08)
        return np.tanh(y * 1.3) * level * 0.8

    def sub(self, m, d, level=1.0):
        t = self.tt(d)
        y = np.sin(2 * np.pi * self.midi(m) * t) + 0.15 * np.sin(4 * np.pi * self.midi(m) * t)
        return np.tanh(y * 1.4) * self._env(len(t), 0.01, d, 0.7, 0.06) * level * 0.7

    def pluck(self, m, d=0.25, level=1.0):
        return self.upright(m, d, level, bright=1.0) * 0.8

    # ───── 键盘 ─────
    def rhodes(self, m, d=2.0, vel=0.7):
        t = self.tt(d + 0.6)
        f0 = self.midi(m)
        idx = (1.2 + 2.5 * vel) * np.exp(-t / 0.45)
        mod = np.sin(2 * np.pi * f0 * t) * idx
        body = np.sin(2 * np.pi * f0 * t + mod)
        tine = np.sin(2 * np.pi * f0 * 14.0 * t + 0.5 * np.sin(2 * np.pi * f0 * t)) * np.exp(-t / 0.018) * (0.25 + 0.5 * vel)
        bark = np.sin(2 * np.pi * f0 * 2 * t) * np.exp(-t / 0.25) * 0.25 * vel
        env = np.minimum(1, t / 0.003) * np.exp(-t / (0.9 + 2.2 * (60 / max(m, 30)))) * self._env(len(t), 0.001, 99, 1, 0.25)
        trem = 1 + 0.12 * np.sin(2 * np.pi * 4.8 * t)
        return np.tanh((body + tine + bark) * env * trem * 1.2) * vel * 0.55

    def glock(self, m, d=1.6, level=1.0):
        t = self.tt(d)
        f0 = self.midi(m)
        y = sum(a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t / (dd)) for r, a, dd in ((1, 1, 0.9), (2.76, .35, .25), (5.4, .2, .08), (8.9, .1, .03)))
        return y * np.minimum(1, t / 0.001) * level * 0.35

    # ───── 管乐 ─────
    def brass(self, ms, d=0.35, level=1.0, fall=False, scoop=True, bright=1.0):
        t = self.tt(d + 0.25)
        n = len(t)
        out = np.zeros(n)
        for m in ms:
            f0 = self.midi(m)
            pitch = 1 - (0.03 * np.exp(-t / 0.04) if scoop else 0)
            if fall:
                pitch = pitch * (1 - 0.12 * np.clip((t - d * 0.6) / (d * 0.6), 0, 1) ** 2)
            for det in (-0.004, 0.0, 0.005):
                ph = 2 * np.pi * np.cumsum(f0 * pitch * (1 + det)) / self.SR
                # 锯齿，泛音按亮度包络衰减：起音最亮
                y = np.zeros(n)
                for h in range(1, 18):
                    if f0 * h > 12000:
                        break
                    y += np.sin(h * ph) / h * np.exp(-h / (2 + 9 * bright * (0.35 + 0.65 * np.exp(-t / 0.12))))
                out += y
        env = self._env(n, 0.012, d * 0.7, 0.55, 0.12)
        env[int(d * self.SR):] *= np.exp(-np.arange(n - int(d * self.SR)) / (0.06 * self.SR))
        return np.tanh(out / len(ms) * env * 2.2) * level * 0.5

    def clarinet(self, m, d=0.4, level=1.0, vib=True):
        t = self.tt(d + 0.2)
        f0 = self.midi(m)
        v = 1 + (0.006 * np.sin(2 * np.pi * 5.6 * t) * np.clip((t - 0.15) / 0.25, 0, 1) if vib else 0)
        ph = 2 * np.pi * np.cumsum(f0 * v) / self.SR
        y = sum(a * np.sin(h * ph) for h, a in ((1, 1), (3, .45), (5, .25), (7, .12), (9, .06), (2, .08), (4, .05)))
        breath = self.fft_filter(self.rng.standard_normal(len(t)), lo=1500, hi=6000) * 0.04
        env = self._env(len(t), 0.03, 9, 1.0, 0.1)
        env[int(d * self.SR):] *= np.exp(-np.arange(len(t) - int(d * self.SR)) / (0.05 * self.SR))
        return (y + breath) * env * level * 0.35

    # ───── 节奏型 ─────
    def kick_at(self, frame, level=1.0, punch=1.0):
        self.put('drums', self.kick2(level, punch), frame=frame, gain=1.0)
        self.kick_times.append(frame)

    # ───── 混音 ─────
    def _reverb2(self, x, seed, dec, pre=0.02, damp=7000, length=None):
        length = length or dec * 4
        t = self.tt(length)
        r = np.random.default_rng(seed)
        ir = r.standard_normal(len(t)) * np.exp(-t / dec)
        # 越往后越暗（高频先没）
        ir = self.fft_filter(ir, hi=damp) * 0.6 + self.fft_filter(ir * np.exp(-t / (dec * .35)), lo=damp) * 0.4
        ir[:int(pre * self.SR)] = 0
        for k, d in enumerate((0.011, 0.019, 0.027, 0.037)):          # 早反射
            i = int((pre + d) * self.SR)
            if i < len(ir):
                ir[i] += (0.6 - k * 0.1) * (1 if k % 2 else -1)
        ir /= np.sqrt(np.sum(ir ** 2))
        n = len(x) + len(ir)
        nfft = 1 << (n - 1).bit_length()
        return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[:len(x)]

    def mix(self, output, levels=None, sends=None, widths=None, duck=None, room=1.2, plate=0.8, sat=1.15, loop=False, air=1.5, lowcut=0.3):
        import os
        self.final = os.fspath(output); os.makedirs(os.path.dirname(os.path.abspath(self.final)), exist_ok=True)
        levels = {**dict(drums=0.9, bass=0.85, keys=0.7, lead=0.75, pad=0.5, brass=0.75), **(levels or {})}
        sends = {**dict(drums=0.08, bass=0.02, keys=0.25, lead=0.3, pad=0.45, brass=0.22), **(sends or {})}
        widths = {**dict(drums=1.0, bass=0.0, keys=1.3, lead=1.1, pad=1.6, brass=1.2), **(widths or {})}
        duck = {**dict(bass=0.5, keys=0.3, pad=0.45, lead=0.1, brass=0.15), **(duck or {})}
        tsec = np.arange(self.N) / self.SR
        ks = np.array(sorted(self.fr(k) for k in self.kick_times)) if self.kick_times else np.array([1e9])
        i = np.searchsorted(ks, tsec, side='right') - 1
        since = np.where(i >= 0, tsec - ks[np.clip(i, 0, None)], 9.0)
        pump = (1 - np.clip(since / 0.2, 0, 1)) ** 2
        MUS = np.zeros((2, self.N)); SEND = np.zeros((2, self.N))
        # 旧接口写进来的东西（song.py 的 place 默认 MUS）也算进来
        MUS += self.MUS + self.PUMP + self.LEAD
        SEND += self.SEND
        for k, x in self.B.items():
            x = x * levels[k]
            if duck.get(k):
                x = x * (1 - duck[k] * pump)[None, :]
            if widths[k] > 1:                                          # 哈斯：一边晚十几毫秒，单声道的乐器也有了宽度
                dl = int((0.007 + 0.006 * (hash(k) % 3)) * self.SR)
                x = np.stack([x[0] * 0.8 + np.roll(x[1], dl) * 0.35, x[1] * 0.8 + np.roll(x[0], dl * 2 + 37) * 0.35])
            mid, side = (x[0] + x[1]) / 2, (x[0] - x[1]) / 2 * widths[k]
            x = np.stack([mid + side, mid - side])
            if k == 'bass':
                mid = self.fft_filter(mid, lo=38)
                x = np.stack([self.fft_filter(mid, hi=200) + self.fft_filter(x[0], lo=200), self.fft_filter(mid, hi=200) + self.fft_filter(x[1], lo=200)])
            MUS += x
            SEND += x * sends[k]
        wet = np.stack([self._reverb2(SEND[0], 1, room * .45, damp=6500) + self._reverb2(SEND[0], 3, plate * .3, pre=0.008, damp=9000) * .5,
                        self._reverb2(SEND[1], 2, room * .45, damp=6500) + self._reverb2(SEND[1], 4, plate * .3, pre=0.008, damp=9000) * .5])
        mix = MUS + wet * 0.5 + self.SFX * 0.62
        for c in range(2):
            mix[c] = self.fft_filter(mix[c], lo=32)
            mix[c] += self.fft_filter(mix[c], lo=5500) * (air - 1)            # 高频搁架：亮一点
            mix[c] -= self.fft_filter(mix[c], lo=32, hi=110) * lowcut         # 低频收一点
        # 胶水压缩：慢的 RMS 包络，压 3 dB 左右
        rms = np.sqrt(np.convolve((mix ** 2).mean(0), np.ones(int(0.05 * self.SR)) / int(0.05 * self.SR), 'same') + 1e-9)
        thr = np.percentile(rms[rms > 1e-6], 70) if np.any(rms > 1e-6) else 1
        gain = np.where(rms > thr, (thr / rms) ** 0.35, 1.0)
        gain = lfilter([0.002], [1, -0.998], gain) / (lfilter([0.002], [1, -0.998], np.ones_like(gain)) + 1e-9)
        mix = mix * gain[None, :]
        mix = mix[:, :self.NV] if not loop else mix
        if not loop:
            n = int(0.3 * self.SR); mix[:, -n:] *= np.linspace(1, 0, n) ** 2
        mix /= np.abs(mix).max() + 1e-9
        mix = np.tanh(mix * sat) / np.tanh(sat)                       # 磁带饱和
        y = mix.T * 0.5
        for _ in range(3):
            li = self.loudness(y)
            y = self.limit(y * 10 ** ((-14.0 - li) / 20))
        print('loudness %.2f LUFS' % self.loudness(y))
        self.write(output, y)
        print('wrote', output)
