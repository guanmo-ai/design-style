"""维也纳分离派 · 声音：原配乐由本地文件提供，上面按画面的动作时刻叠一层合成的音效。
动作时刻从页面导出（node ../../_lib/events.cjs film.html events.json）。音效压在配乐下面约 16 dB，
最后整体响度拉到 -14 LUFS、峰值不过 -1 dBTP。SECESSION_MUSIC=/path/to/music.m4a python3 audio.py out.wav"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
SR = 48000
TL = (HERE / 'timeline.js').read_text()
END = int(re.search(r'end:\s*(\d+)', TL).group(1))
N = int(END / 60 * SR)
EV = json.loads((HERE / os.environ.get('EVENTS', 'events-notext.json')).read_text())
rng = np.random.default_rng(7)


def music():
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.environ['SECESSION_MUSIC'], '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    y = np.frombuffer(raw, np.float32).reshape(-1, 2).T.astype(np.float64)
    out = np.zeros((2, N))
    n = min(N, y.shape[1])
    out[:, :n] = y[:, :n]
    fade = int(.35 * SR)
    out[:, N - fade:] *= np.linspace(1, 0, fade) ** 2
    return out


def env(n, a=.002, d=.2):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)


def noise(n):
    return rng.standard_normal(n)


def bp(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, len(x))


def ting(f0=2200, d=.28, n=None):
    """金箔落定：一点点金属的“叮”，几个不成整数倍的泛音，再垫一下纸的轻响。"""
    n = n or int(d * 3 * SR)
    t = np.arange(n) / SR
    y = sum(a * np.sin(2 * np.pi * f0 * k * t + rng.random() * 6) * np.exp(-t / (d / (1 + k * .6))) for k, a in ((1, 1), (2.76, .5), (5.4, .25), (8.93, .12)))
    tap = bp(noise(n), 2500, 7000) * env(n, .001, .012) * .5
    return (y * env(n, .001, d) + tap) * .5


def tick(n=int(.05 * SR)):
    return bp(noise(n), 2000, 6000) * env(n, .0005, .006) * .8 + np.sin(2 * np.pi * 3100 * np.arange(n) / SR) * env(n, .0005, .01) * .25


def swish(dur=.3, lo=800, hi=6000):
    n = int(dur * SR)
    x = bp(noise(n), lo, hi)
    t = np.arange(n) / n
    return x * np.sin(np.pi * t) ** 2 * .5


def whoosh(dur=.55):
    n = int(dur * SR)
    t = np.arange(n) / n
    x = noise(n)
    # 一段从低到高再回落的带通噪声
    out = np.zeros(n)
    seg = 8
    for i in range(seg):
        a, b = i * n // seg, (i + 1) * n // seg
        c = 400 + 4000 * np.sin(np.pi * (i + .5) / seg)
        out[a:b] = bp(x, c * .5, c * 1.6)[a:b]
    return out * np.sin(np.pi * t) ** 1.5 * .7


def thump(f0=70, d=.35):
    n = int(d * 2.5 * SR)
    t = np.arange(n) / SR
    f = f0 * (1 + .6 * np.exp(-t / .03))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .002, d) + tick(n) * .4


def clack(v=1):
    n = int(.25 * SR)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * 1150 * t) * env(n, .0008, .03) * .6 + np.sin(2 * np.pi * 620 * t) * env(n, .0008, .05) * .4
    return body + bp(noise(n), 1500, 5000) * env(n, .0005, .008) * .6 + thump(55, .12)[:n] * .5 * v


def chime():
    return sum(ting(f, .9, int(2.2 * SR)) * a for f, a in ((1320, .6), (1760, .45), (2640, .3)))


def final():
    n = int(2.4 * SR)
    y = np.zeros(n)
    y[:len(thump(48, .6))] += thump(48, .6)[:n] * 1.2
    for f, a in ((2093, .5), (2637, .4), (3136, .35), (4186, .25)):
        y += ting(f, 1.1, n) * a
    sw = bp(noise(n), 4000, 12000) * env(n, .03, .5) * .25
    return y + sw


def place(buf, x, f, gain, pan=0.):
    i = int(f / 60 * SR)
    if i >= buf.shape[1]:
        return
    x = x[: buf.shape[1] - i]
    buf[0, i:i + len(x)] += x * gain * (1 - max(0, pan))
    buf[1, i:i + len(x)] += x * gain * (1 + min(0, pan))


def sfx():
    y = np.zeros((2, N))
    for e in EV:
        f, k, v = e['f'], e['k'], e['v']
        pan = (rng.random() - .5) * .5
        if k == 'leaf':
            place(y, ting(1900 + rng.random() * 900), f, .55 * v, pan)
        elif k == 'final':
            place(y, final(), f, .7)
        elif k == 'type':
            place(y, tick(), f, .35 * v, pan * .4)
        elif k == 'tick':
            place(y, tick(), f, .4 * v, pan)
        elif k == 'swish':
            place(y, swish(.28, 1500, 7000), f - 4, .45 * v)
        elif k == 'stroke':
            place(y, swish(.18, 2500, 9000), f, .35 * v, pan)
        elif k == 'dots':
            for j in range(4):
                place(y, ting(2600 + j * 330, .2), f + j * 1.5, .35 * v, (j - 1.5) * .2)
        elif k == 'split':
            place(y, clack(v), f, .7 * v)
        elif k == 'whoosh':
            place(y, whoosh(), f - 14, .7 * v)
        elif k == 'thump':
            place(y, thump(62, .4), f, .65 * v)
        elif k == 'flip':
            place(y, swish(.3, 600, 5000), f, .6 * v)
        elif k == 'rise':
            place(y, swish(.45, 300, 3000), f, .55 * v)
        elif k == 'merge':
            place(y, clack(v), f, .55 * v)
        elif k == 'sign':
            place(y, chime(), f, .45 * v)
    return y


def lufs(y):
    tmp = HERE / '_measure.wav'
    write(tmp, y)
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(tmp), '-af', 'loudnorm=print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    tmp.unlink()
    js = json.loads(r.stderr[r.stderr.rindex('{'):r.stderr.rindex('}') + 1])
    return float(js['input_i']), float(js['input_tp'])


def write(path, y):
    import wave
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(y.T, -1, 1) * 32767).astype('<i2').tobytes())


def rms_db(x):
    return 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12)


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'secession.wav')
    M, S = music(), sfx()
    # 音效整体压在配乐下面约 16 dB（按全片 RMS 算）
    S *= 10 ** ((rms_db(M) - 16 - rms_db(S)) / 20)
    mix = M + S
    I, tp = lufs(mix)
    mix *= 10 ** ((-14 - I) / 20)
    peak = np.abs(mix).max()
    if peak > 10 ** (-1.2 / 20):                      # 简单限幅：只压最响的几下
        thr = 10 ** (-1.2 / 20)
        mix = np.where(np.abs(mix) > thr * .8, np.sign(mix) * (thr * .8 + (thr * .2) * np.tanh((np.abs(mix) - thr * .8) / (thr * .2))), mix)
    write(out, mix)
    I2, tp2 = lufs(mix)
    print(f'wrote {out}  {END / 60:.2f}s  {I2:.1f} LUFS  {tp2:.1f} dBTP  ({len(EV)} 个音效)')
