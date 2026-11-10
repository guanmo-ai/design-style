"""Measure the promo soundtrack against the brief (you cannot listen, so measure).
usage: python3 promo/audio/check_music.py [music.wav] [out.png]"""
import json
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parents[2]
TL = json.loads((ROOT / 'promo' / 'timeline.json').read_text())
WAV = sys.argv[1] if len(sys.argv) > 1 else str(ROOT / 'public' / 'promo' / 'music.wav')
PNG = sys.argv[2] if len(sys.argv) > 2 else str(ROOT / 'out' / 'promo-audio-check.png')
FPS = TL['fps']

with wave.open(WAV) as w:
    sr, ch, n = w.getframerate(), w.getnchannels(), w.getnframes()
    y = np.frombuffer(w.readframes(n), '<i2').reshape(-1, ch).astype(float) / 32768
mono = y.mean(axis=1)
db = lambda x: 20 * np.log10(x + 1e-12)
rms = lambda x: np.sqrt(np.mean(x ** 2))
spf = sr // FPS
ok = True


def check(name, cond, val):
    global ok
    ok &= bool(cond)
    print('%-44s %-28s %s' % (name, val, 'PASS' if cond else 'FAIL'))


print('== format')
check('samples / rate / channels', n == TL['duration'] * spf and sr == 48000 and ch == 2, '%d @ %d x%d' % (n, sr, ch))
check('no NaN, peak < 1.0', np.isfinite(y).all() and np.abs(y).max() < 1.0, 'peak %.3f (%.2f dBFS)' % (np.abs(y).max(), db(np.abs(y).max())))
check('last 50 ms RMS < -60 dBFS', db(rms(y[-sr // 20:])) < -60, '%.1f dBFS' % db(rms(y[-sr // 20:])))
first = np.abs(mono[:int(0.02 * sr)])
check('hit onset in first 20 ms', first.max() > 0.3 and np.argmax(first > 0.1) < int(0.005 * sr),
      'peak %.2f, >0.1 at %.2f ms' % (first.max(), 1000 * np.argmax(first > 0.1) / sr))

r = subprocess.run(['ffmpeg', '-hide_banner', '-i', WAV, '-af', 'loudnorm=print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
js = json.loads(r.stderr[r.stderr.rindex('{'):r.stderr.rindex('}') + 1])
check('integrated loudness ~ -14 LUFS', abs(float(js['input_i']) + 14) < 0.5, '%s LUFS' % js['input_i'])
check('true peak <= -1 dBTP', float(js['input_tp']) <= -1.0, '%s dBTP' % js['input_tp'])

print('\n== stamp onsets (energy rise, >1 kHz, 1 ms hop)')
hp = sosfilt(butter(2, 1000, 'high', fs=sr, output='sos'), mono)
hop, win = sr // 1000, sr // 500
e = np.sqrt(np.convolve(hp ** 2, np.ones(win) / win, 'same'))[::hop]
flux_hp = db(e[5:]) - db(e[:-5])                               # dB rise over 5 ms (>1 kHz)
ef = np.sqrt(np.convolve(mono ** 2, np.ones(win) / win, 'same'))[::hop]
flux_fb = db(ef[5:]) - db(ef[:-5])                             # full band (low hits: dong, wall)
cues = [('slam', TL['hook']['slam'])] + [(s['id'], s['at']) for s in TL['scenes']] + \
       [(k, v) for k, v in TL['accents'].items()] + [('wall', TL['wall']['at']), ('end', TL['end']['at'])] + \
       [('chip%d' % i, c) for i, c in enumerate(TL['end']['chips'])] + [('seal', TL['end']['seal'])]
worst = 0
print('  %-14s %5s %9s %8s' % ('cue', 'frame', 'offset ms', 'rise dB'))
for name, f in cues:
    c = int(f * 1000 / FPS)
    lo, hi = max(0, c - 17 - 5), c + 17 - 5
    flux = max((flux_hp, flux_fb), key=lambda fl: fl[lo:hi].max())
    k = lo + int(np.argmax(flux[lo:hi]))
    off = k + 5 - c - 2                                      # rise window end ~ onset (+-2 ms)
    if f == 0:
        off = int(np.argmax(np.abs(mono) > 0.05) * 1000 / sr)
    worst = max(worst, abs(off))
    print('  %-14s %5d %9d %8.1f' % (name, f, off, flux[k] if f else 99))
check('max |stamp onset error| <= 1 frame (16.7 ms)', worst <= 16.7, '%d ms' % worst)

print('\n== section levels')
st = lambda a, b: db(rms(mono[int(a * spf):int(b * spf)]))
ink0, ink1 = TL['scenes'][18]['at'], TL['wall']['at']
full = st(TL['scenes'][12]['at'], ink0)
check('INK break >= 10 dB under bars 6-7', full - st(ink0, ink1) >= 10, 'bars6-7 %.1f / ink %.1f dB' % (full, st(ink0, ink1)))
w4 = int(0.4 * sr)
srms = np.sqrt(np.convolve(mono ** 2, np.ones(w4) / w4, 'valid'))
loud_t = (np.argmax(srms) + w4 / 2) / sr
check('loudest 400 ms window starts at WALL', abs(np.argmax(srms) / sr - TL['wall']['at'] / FPS) < 0.15,
      'max at %.2f s (wall %.2f s)' % (np.argmax(srms) / sr, TL['wall']['at'] / FPS))
secs = [('hook', 0, TL['scenes'][0]['at']), ('relayA', TL['scenes'][0]['at'], TL['scenes'][4]['at']),
        ('relayB 4-5', TL['scenes'][4]['at'], TL['scenes'][12]['at']), ('relayB 6-7', TL['scenes'][12]['at'], ink0),
        ('ink', ink0, ink1), ('wall', ink1, TL['end']['at']), ('end', TL['end']['at'], TL['duration'])]
bands = [('<60', None, 60), ('60-250', 60, 250), ('250-2k', 250, 2000), ('2k-8k', 2000, 8000), ('>8k', 8000, None)]


def band(x, lo, hi):
    if lo and hi:
        return sosfilt(butter(4, [lo, hi], 'band', fs=sr, output='sos'), x)
    return sosfilt(butter(4, lo or hi, 'high' if lo else 'low', fs=sr, output='sos'), x)


B = {nm: band(mono, lo, hi) for nm, lo, hi in bands}
print('  %-11s %6s ' % ('section', 'all') + ' '.join('%7s' % b[0] for b in bands))
for nm, a, b in secs:
    sl = slice(int(a * spf), int(b * spf))
    print('  %-11s %6.1f ' % (nm, db(rms(mono[sl]))) + ' '.join('%7.1f' % db(rms(B[k][sl])) for k, _, _ in bands))
kick_sub = np.mean([db(rms(B['<60'][int(f * spf):int((f + 6) * spf)])) for f in range(96, 624, 24)])
check('sub (<60 Hz) present on kicks', kick_sub > -30, '%.1f dB' % kick_sub)
hat = db(rms(B['>8k'][int(TL['scenes'][4]['at'] * spf):int(ink0 * spf)]))
check('hats present above 8 kHz', hat > -45, '%.1f dB' % hat)

# —— image ——
import matplotlib  # noqa: E402
matplotlib.use('Agg')
import matplotlib.pyplot as plt  # noqa: E402
Path(PNG).parent.mkdir(parents=True, exist_ok=True)
fig, ax = plt.subplots(2, 1, figsize=(18, 8), sharex=True, gridspec_kw={'height_ratios': [1, 1.4]})
t = np.arange(n) / sr
ax[0].plot(t[::8], y[::8, 0], lw=0.3, color='#333')
ax[0].set_ylim(-1, 1); ax[0].set_ylabel('L')
ax[0].set_title('promo music.wav  |  %s LUFS  TP %s dBTP  |  cue lines from timeline.json' % (js['input_i'], js['input_tp']))
ax[1].specgram(mono, NFFT=2048, Fs=sr, noverlap=1536, cmap='magma', vmin=-130)
ax[1].set_yscale('symlog', linthresh=200); ax[1].set_ylim(30, 20000); ax[1].set_ylabel('Hz'); ax[1].set_xlabel('s')
col = {'scene': '#00bcd4', 'accent': '#8bc34a', 'big': '#f44336', 'chip': '#ffc107', 'text': '#9c27b0'}
lines = [(TL['scenes'][i]['at'], 'scene', TL['scenes'][i]['id']) for i in range(len(TL['scenes']))]
lines += [(v, 'accent', k) for k, v in TL['accents'].items()]
lines += [(v, 'text', k) for k, v in TL['hook'].items() if k not in ('at', 'slam')]
lines += [(TL['hook']['slam'], 'big', 'slam'), (TL['wall']['at'], 'big', 'wall'), (TL['end']['at'], 'big', 'end'), (TL['end']['seal'], 'big', 'seal')]
lines += [(c, 'chip', 'chip') for c in TL['end']['chips']]
lines += [(v, 'accent', 'flip/push') for v in TL['wall']['flip'] + TL['wall']['push']] + [(TL['wall']['settle'], 'accent', 'settle')]
for f, kind, lab in lines:
    for a in ax:
        a.axvline(f / FPS, color=col[kind], lw=0.8, alpha=0.8)
    ax[0].text(f / FPS, 0.92 if kind != 'accent' else -0.95, lab, rotation=90, fontsize=6, color=col[kind], va='top' if kind != 'accent' else 'bottom')
ax[1].set_xlim(0, n / sr)
plt.tight_layout()
plt.savefig(PNG, dpi=110)
print('\nsaved', PNG)
print('ALL PASS' if ok else 'SOME CHECKS FAILED')
