"""Promo film "One circle. 21 styles." -- soundtrack (one song, 15.000 s, synthesized with numpy, no samples).

150 BPM (1 beat = 24 frames at 60 fps) · C major · nu-disco / electro-pop: four-on-the-floor kick, claps on 2 & 4,
funky octave bass, side-chained saw pad, square lead with ping-pong delay. One band from start to end; sections
only add / remove layers.

Chords (every change sits on a scene start read from timeline.json):
  HOOK      Am (slam) ............ G (windup, dominant)
  RELAY A   C | G | Am | F                      (one chord per 2-beat scene)
  RELAY B   C G Am F (half-bar each) -> C G (half-bar) F G (one beat each, harmonic rhythm accelerates)
  INK       Am (break: A-minor pentatonic = C-major pentatonic, guqin-like pluck)
  WALL      F (biggest downbeat) -> G7 (lead walks G F D B ...)
  END       C (resolved tonic at end.at, again at end.seal)

Signature: every scene start = a "stamp" (dry clap-snap + short tuned wood body on the chord root, identical recipe).
Every on-screen text appearance has a sound (title key ticks, code type ticks, chips, seals).
All time positions come from promo/timeline.json (frames may be nudged; this script follows).

usage: python3 promo/audio/make_music.py [out.wav]     (default: public/promo/music.wav)
"""
import json
import os
import subprocess
import sys
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / 'drafts' / '_lib'))
from song import Song  # noqa: E402

TL = json.loads((ROOT / 'promo' / 'timeline.json').read_text())
FPS, BEAT, DUR = TL['fps'], TL['beat'], TL['duration']
E8, S16 = BEAT / 2, BEAT / 4
SC = [s['at'] for s in TL['scenes']]
HK, AC, WL, EN = TL['hook'], TL['accents'], TL['wall'], TL['end']
INK = SC[18]
# section boundaries (all from the file)
RA, RB, RB5, RB6 = SC[0], SC[4], SC[8], SC[12]
WALL, ENDF, SEAL = WL['at'], EN['at'], EN['seal']

# —— chord table: (frame, bass root midi, chord notes) ——
AM, G, C, F = [57, 60, 64], [55, 59, 62], [55, 60, 64], [57, 60, 65]
CH = [(HK['slam'], 33, AM), (HK['windup'], 31, G),
      (SC[0], 36, C), (SC[1], 31, G), (SC[2], 33, AM), (SC[3], 29, F),                 # relay A
      (SC[4], 36, C), (SC[6], 31, G), (SC[8], 33, AM), (SC[10], 29, F),                # relay B, bars 4-5
      (SC[12], 36, C), (SC[14], 31, G), (SC[16], 29, F), (SC[17], 31, G),              # bars 6-7
      (INK, 33, AM),                                                                   # break
      (WALL, 29, F), (WALL + 2 * BEAT, 31, G),                                         # wall
      (ENDF, 36, C)]                                                                   # end card
S = Song(DUR, CH, fps=FPS, beat=BEAT, seed=21, tail=3.0)
fr = S.fr
SR = S.SR
rng = np.random.default_rng(150)
FIN = np.zeros((2, S.N))          # the final seal: bypasses the end-of-band fade

KPK = np.abs(S.kick(1.0)).max() * 0.95          # reference: kick peak as placed


def rel(sig, db):
    """scale a sound so its peak sits `db` relative to the kick peak (mix rule: ticks ~-5 dB under the kick)"""
    return sig * (KPK * 10 ** (db / 20) / (np.abs(sig).max() + 1e-12))


def taper(sig, ms=4.0):
    n = min(len(sig), int(ms * 1e-3 * SR))
    sig = sig.copy()
    sig[-n:] *= np.linspace(1, 0, n) ** 2
    return sig


def lp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'low', fs=SR, output='sos'), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)


def room(x, dec=0.12, length=0.5, seed=3):
    """small dry room (for the seals)"""
    t = S.tt(length)
    ir = np.random.default_rng(seed).standard_normal(len(t)) * np.exp(-t / dec)
    ir = lp(ir, 5000)
    ir[:int(0.006 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    y = np.convolve(x, ir)[:len(x) + len(t)]
    return y


def pad_to(x, n):
    return np.r_[x, np.zeros(max(0, n - len(x)))]


# ======================================================================================
# new instruments
# ======================================================================================
_STAMP_NOISE = np.random.default_rng(1919).standard_normal(int(0.25 * SR))


def stamp(m):
    """THE signature: tight, dry 'stamp' -- clap-like snap + short tuned wood body + low thud. Same noise every time."""
    t = S.tt(0.25)
    f = S.midi(m) * (1 + 0.6 * np.exp(-t / 0.005))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.05)
    wood = 0.45 * np.sin(2 * np.pi * 2.76 * S.midi(m) * t) * np.exp(-t / 0.016)
    thud = 0.7 * np.sin(2 * np.pi * np.cumsum(70 + 160 * np.exp(-t / 0.008)) / SR) * np.exp(-t / 0.035)
    e = np.exp(-t / 0.005) + 0.75 * np.exp(-np.maximum(0, t - 0.009) / 0.009) * (t >= 0.009) + 0.25 * np.exp(-t / 0.05)
    snap = bp(_STAMP_NOISE[:len(t)], 1300, 9000) * e * 2.2
    y = np.tanh(1.5 * (body * 0.8 + wood + thud + snap))
    return taper(y * np.minimum(1, t / 0.0003))


def small_hit(m):
    """secondary accent: little tuned block + click"""
    y = S.thock(m, 1.0)
    y[:len(S.click(1.0))] += S.click(1.2, 1500, 8000, 0.003)
    return taper(y)


def boing(m):
    """rubbery cartoon boing / thump (Memphis bounce)"""
    t = S.tt(0.55)
    f = S.midi(m) * (1 + 0.28 * np.exp(-t / 0.13) * np.sin(2 * np.pi * 13 * t)) * (1 + 0.4 * np.exp(-t / 0.01))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)
    thump = np.sin(2 * np.pi * np.cumsum(60 + 180 * np.exp(-t / 0.012)) / SR) * np.exp(-t / 0.05)
    return taper(np.tanh(1.3 * (y + 0.8 * thump)) * np.minimum(1, t / 0.0006), 20)


def water_drop(m):
    """pitched 'plip': sine gliding up ~an octave, quick decay, plus a small second droplet"""
    def one(m0, d):
        t = S.tt(d)
        f = S.midi(m0) * 2 ** (1.1 * (1 - np.exp(-t / 0.01)))
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.03) * np.minimum(1, t / 0.0006)
    y = pad_to(one(m, 0.25), int(0.4 * SR))
    i = int(0.075 * SR)
    y[i:i + int(0.15 * SR)] += 0.3 * one(m + 7, 0.15)
    return taper(y, 10)


def guqin(m, d=1.6):
    """plucked silk string: Karplus-Strong harp, darker, with a tiny pitch settle"""
    y = lp(S.harp(m, d, 1.0), 2600)
    y += 0.15 * S.harp(m + 12, d, 1.0) * np.exp(-S.tt(d) / 0.3)
    return taper(y, 60)


def brush(d):
    """ink brush stroke: airy band-passed noise with bristle grain, swelling then dragging out"""
    t = S.tt(d)
    n = rng.standard_normal(len(t))
    y = bp(n, 700, 5000) * 0.6 + bp(n, 3000, 9000) * 0.25
    grain = 1 + 0.35 * lp(rng.standard_normal(len(t)), 40) * 8
    u = t / d
    env = np.sin(np.pi * np.clip(u, 0, 1) ** 0.6) ** 1.5
    return y * np.clip(grain, 0.3, 2) * env


def dong(m=33):
    """soft deep drum / temple 'dong' that opens the break"""
    t = S.tt(2.2)
    f0 = S.midi(m)
    y = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 0.15 * np.exp(-t / 0.03))) / SR) * np.exp(-t / 0.6)
    y += 0.35 * np.sin(2 * np.pi * 2.0 * f0 * t) * np.exp(-t / 0.45) + 0.18 * np.sin(2 * np.pi * 2.9 * f0 * t) * np.exp(-t / 0.3)
    y += 0.2 * lp(rng.standard_normal(len(t)), 600) * np.exp(-t / 0.03)
    return taper(y * np.minimum(1, t / 0.004), 200)


def flip_tick(m):
    """card flip: paper flick + tiny tuned tink"""
    t = S.tt(0.12)
    n = bp(rng.standard_normal(len(t)), 2500, 11000) * (np.exp(-t / 0.002) + 0.4 * np.exp(-np.maximum(0, t - 0.006) / 0.003) * (t > 0.006))
    b = np.sin(2 * np.pi * S.midi(m) * t) * np.exp(-t / 0.04) * np.minimum(1, t / 0.0005)
    return taper(n * 0.8 + b * 0.5)


def stab(ms, d=0.6, bright=6500, fdec=0.25):
    y = sum(S.synth(n, d, 'saw', bright, 1200, fdec, att=0.002, rel=0.25, det=0.008) for n in ms)
    return taper(y / np.sqrt(len(ms)), 30)


def soft_bell(m, d=0.6, dec=0.13):
    t = S.tt(d)
    f = S.midi(m)
    y = np.sin(2 * np.pi * f * t + 0.8 * np.exp(-t / 0.05) * np.sin(2 * np.pi * 3.5 * f * t)) * np.exp(-t / dec)
    y += 0.25 * np.sin(2 * np.pi * 2.0 * f * t) * np.exp(-t / (dec * 0.5))
    return y * np.minimum(1, t / 0.002) * (1 - t / d) ** 2


def seal(size=1.0, m=48):
    """red seal stamped on paper: woody thock + low thud (+ a soft bell on the tonic for the big one)"""
    t = S.tt(0.6)
    wood = pad_to(S.thock(m + 24, 1.0), len(t))[:len(t)]
    wood += 0.5 * pad_to(S.thock(m + 31, 1.0), len(t))[:len(t)] * np.exp(-t / 0.02)
    paper = bp(rng.standard_normal(len(t)), 900, 6000) * np.exp(-t / 0.006) * 0.35
    y = wood + paper
    if size >= 1:
        thud = np.sin(2 * np.pi * np.cumsum(S.midi(m - 12) * (1 + 1.2 * np.exp(-t / 0.01))) / SR) * np.exp(-t / 0.09)
        y = y + 0.9 * thud + 0.55 * soft_bell(m + 36, 0.6, 0.14)
    y = y * np.minimum(1, t / 0.0004) * (1 - t / 0.6) ** 1.5
    wet = room(y, 0.08 if size < 1 else 0.11)[:len(t)]
    return y + wet * (0.25 if size < 1 else 0.35)


def lead(m, d):
    return S.synth(m, d, 'square', 3400, 2000, 0.28, att=0.004, rel=0.08, det=0.004, vib=0.22)


def lead_saw(m, d):
    return S.synth(m, d, 'saw', 2600, 1200, 0.2, att=0.004, rel=0.06, det=0.006) * 0.7


def pluck(m):
    return S.synth(m, 0.11, 'saw', 4200, 800, 0.035, dec=0.08, rel=0.03)


def kick_f(level=1.0):
    """filtered kick (heartbeat pulse of the hook)"""
    return lp(S.kick(level), 220, 2) * 1.6


# ======================================================================================
# the band
# ======================================================================================
def beats(f0, f1):
    b = np.ceil(f0 / BEAT - 1e-9) * BEAT
    return np.arange(b, f1 - 1e-9, BEAT)


def groove(f0, f1, kick=1.0, clap=True, ohat=True, hats16=False, shaker=False, lvl=1.0):
    for fm in beats(f0, f1):
        S.place(S.kick(kick), fr(fm), 0.95); S.kicks.append(fm)
        if clap and round(fm / BEAT) % 2 == 1:
            S.place(S.clap(lvl), fr(fm), 0.95, 0.05, send=0.22)
            S.place(S.snare(lvl), fr(fm), 0.45, -0.05, send=0.18)
        if ohat:
            S.place(S.hat(lvl, open_=True), fr(fm + E8), 1.15 * lvl, 0.25)
        if hats16:
            for s, g in ((0, 0.6), (1, 0.85), (3, 1.0)):
                S.place(S.hat(lvl), fr(fm + s * S16), g * lvl, -0.3)
        if shaker:
            for s in range(4):
                S.place(S.shaker(1.0), fr(fm + s * S16), (1.3 if s % 2 else 0.8) * lvl, 0.4)


def bass(f0, f1, lvl=1.0, ghost=False, bright=1.0):
    for k, fm in enumerate(np.arange(np.ceil(f0 / E8 - 1e-9) * E8, f1 - 1e-9, E8)):
        r = S.chord(fm)[1]
        S.place(S.sbass(r + (12 if k % 2 else 0), 0.19), fr(fm), 0.4 * lvl, bus=S.PUMP)
        if ghost and k % 2 == 1 and fm + S16 < f1:
            S.place(S.sbass(r + 12, 0.07), fr(fm + S16), 0.22 * lvl, bus=S.PUMP)


def pad(f0, f1, fc, lvl=1.0, rel=0.12):
    """chord pad from f0 to f1, one segment per chord, filter cutoff fc (Hz)"""
    cuts = sorted({f0, f1} | {c[0] for c in CH if f0 < c[0] < f1})
    for a, b in zip(cuts[:-1], cuts[1:]):
        ns = S.chord(a)[2]
        d = fr(b - a) + 0.04
        p = sum(S.synth(n, d, 'saw', fc, fc * 0.75, 9, att=0.03, rel=rel, det=0.006) for n in ns)
        S.place(p, fr(a), 0.05 * lvl, send=0.35, bus=S.PUMP)


def counter(f0, f1, lvl=1.0):
    """counter-melody: plucked chord tones on the off-16ths (k = chord-tone index, one octave up)"""
    for fm in np.arange(np.ceil(f0 / S16 - 1e-9) * S16, f1 - 1e-9, S16):
        s = int(round(fm / S16)) % 8
        if s in (2, 5, 7):
            m = S.tone(fm, {2: 2, 5: 1, 7: 0}[s], 1)
            S.place(S.marimba(m) + 0.4 * pad_to(pluck(m), int(0.7 * SR))[:int(0.7 * SR)], fr(fm), 0.5 * lvl, 0.3 if s != 5 else -0.3, send=0.2, bus=S.PUMP)


# —— HOOK (bar 1): slam, heartbeat pulse, windup ——
S.place(S.slam(33, 1.2), fr(HK['slam']), 1.0, 0.0, send=0.3)
S.place(S.kick(1.3), fr(HK['slam']), 1.0); S.kicks.append(HK['slam'])
S.place(S.crash(1.0), fr(HK['slam']), 0.7, 0.2, send=0.3)
S.place(stab([45, 57, 60, 64, 69], 0.45, 5000), fr(HK['slam']), 0.16, send=0.45)
for fm in beats(HK['slam'] + BEAT, HK['windup']):                           # heartbeat: filtered kick on the beats
    S.place(kick_f(1.0), fr(fm), 0.7); S.kicks.append(fm)
for fm in np.arange(HK['slam'] + BEAT, HK['windup'], E8):                     # muted bass 8ths
    S.place(lp(S.sbass(33 + (12 if (fm / E8) % 2 else 0), 0.08), 500), fr(fm), 0.45, bus=S.PUMP)
for fm in np.arange(HK['windup'], RA - S16, S16):                            # windup: 16th bass on G, getting brighter
    u = (fm - HK['windup']) / (RA - HK['windup'])
    S.place(lp(S.sbass(31 + 12 * (round(fm / S16) % 2), 0.05), 500 + 3000 * u), fr(fm), 0.4, bus=S.PUMP)
roll = list(np.arange(HK['windup'], HK['windup'] + BEAT / 2, S16)) + list(np.arange(HK['windup'] + BEAT / 2, RA - S16, S16 / 2))
for k, fm in enumerate(roll):                                                # 16ths -> 32nds, last 16th silent
    S.place(S.snare(1.0), fr(fm), 0.18 + 0.5 * (k / max(1, len(roll) - 1)) ** 1.5, 0.12 * (-1) ** k, send=0.2)
rz = fr(RA - S16 - HK['windup'])
S.sfx(taper(S.riser2(rz, 1.0), 6), fr(HK['windup']), 0.8, send=0.3)

# title / code text in the hook
for j in range(3):                                                           # line 1: 3 big characters
    S.sfx(rel(S.key_tick(S.tone(HK['line1'], [4, 2, 0][j], 1)), -7), fr(HK['line1'] + 4 * j), 1.0, -0.3 + 0.3 * j, send=0.2)
for j in range(22):                                                          # code: 22 chars, 1 frame each
    m = S.tone(HK['code'], int(rng.integers(0, 5)), 2)
    S.sfx(rel(S.type_tick(m, float(rng.uniform(0.6, 1.0))), -13 + rng.uniform(-1.5, 0)), fr(HK['code'] + j), 1.0, 0.5 * np.sin(j * 0.9), send=0.1)
for j in range(6):                                                           # line 2: 6 characters, 3 frames apart
    S.sfx(rel(S.key_tick(S.tone(HK['line2'], j, 1)), -8), fr(HK['line2'] + 3 * j), 1.0, -0.5 + 0.2 * j, send=0.2)

# —— DROP / RELAY A ——
S.place(S.crash(1.1), fr(RA), 0.85, -0.2, send=0.3)
S.place(S.boom(1.0, 120, 40, 0.6), fr(RA), 0.55)
groove(RA, RB)
bass(RA, RB)
pad(RA, RB, 1400)

# —— RELAY B: a layer per bar ——
groove(RB, RB5, hats16=True)
groove(RB5, RB6, hats16=True, shaker=True)
groove(RB6, INK, kick=1.05, hats16=True, shaker=True)
bass(RB, RB5)
bass(RB5, INK, ghost=True)
pad(RB, RB5, 1900)
pad(RB5, RB6, 2500)
pad(RB6, INK, 3300, 1.1, rel=0.05)
S.arp(RB, RB5, 0.8, octv=0)
S.arp(RB5, RB6, 1.0, octv=0, pattern=(0, 2, 4, 2, 1, 3, 5, 3))
S.arp(RB6, INK, 1.15, octv=1, inst=pluck, pattern=(0, 2, 4, 2, 1, 3, 5, 3))
counter(RB5, INK, 1.0)
for at in (RB, RB6):
    S.place(S.crash(0.9), fr(at), 0.7, 0.3, send=0.25)
for k, fm in enumerate(np.arange(SC[17], INK - S16 / 2, S16 / 2)):           # little 32nd fill into the cut
    S.place(S.snare(1.0), fr(fm), 0.1 + 0.25 * k / 6, 0.15 * (-1) ** k, send=0.15)

# —— INK WASH: the break ——
S.sfx(rel(dong(33), -10), fr(INK), 1.0, 0.0, send=0.6)
bd = fr(0.75 * TL['scenes'][18]['len'])                                     # brush runs scene start -> ~3/4 of the break
bs = brush(bd)
pan = np.linspace(-0.6, 0.6, len(bs))
i0 = int(fr(INK) * SR)
seg = rel(bs, -24)
S.SFX[0, i0:i0 + len(seg)] += seg * np.cos((pan + 1) * np.pi / 4)
S.SFX[1, i0:i0 + len(seg)] += seg * np.sin((pan + 1) * np.pi / 4)
S.SEND[:, i0:i0 + len(seg)] += seg * 0.5
S.sfx(rel(water_drop(76), -12), fr(AC['inkDrop']), 1.0, 0.2, send=0.9)
S.sfx(rel(guqin(57, 1.4), -10), fr(AC['inkDrop']) + 0.012, 1.0, -0.2, send=0.6)
S.sfx(rel(seal(0.5, 48), -13), fr(AC['inkSeal']), 1.0, 0.1, send=0.1)       # small red seal: the ending's echo
rc = fr(WALL - AC['inkSeal']) * 0.9
S.sfx(S.rev_cymbal(rc, 1.0), fr(WALL) - rc, 0.6, 0.0, send=0.2)

# —— WALL ——
S.place(S.kick(1.4), fr(WALL), 1.0)
S.place(S.crash(1.4), fr(WALL), 0.9, 0.0, send=0.5)
S.place(S.hit(1.0, 29), fr(WALL), 0.8, send=0.3)
S.place(stab([41, 53, 57, 60, 65, 69, 72, 77], 0.9, 7000, 0.35), fr(WALL), 0.3, send=0.5)
groove(WALL, ENDF, kick=1.1, hats16=True, shaker=True)
bass(WALL, ENDF, 1.1, ghost=True)
pad(WALL, ENDF, 3600, 1.15)
S.arp(WALL, ENDF, 1.2, octv=1, inst=pluck, pattern=(0, 2, 4, 2, 1, 3, 5, 3))
counter(WALL, ENDF, 1.0)
f0, f1 = WL['flip']
for k in range(21):                                                          # 21 tiles flip: ascending pentatonic ticks
    fm = f0 + k * (f1 - f0) / 20
    r = S.chord(fm)[1] % 12
    pent = sorted(n for o in range(5, 9) for n in (12 * o + r + i for i in (0, 2, 4, 7, 9)))
    target = 79 + 20 * k / 20
    m = min(pent, key=lambda n: (abs(n - target), n))
    S.sfx(rel(flip_tick(m), -11 + 2 * k / 20), fr(fm), 1.0, -0.7 + 1.4 * k / 20, send=0.2)
p0, p1 = WL['push']
pd = fr(p1 - p0)
S.sfx(taper(S.riser2(pd, 1.0), 3), fr(p1) - pd, 0.8, send=0.3)
S.sfx(S.whoosh(pd, 400, 8000, 1.0, 0.85), fr(p1) - pd, 0.7, send=0.3)

# —— END CARD ——
S.place(S.kick(1.3), fr(ENDF), 1.0); S.kicks.append(ENDF)
S.place(S.slam(36, 1.0), fr(ENDF), 0.75, send=0.3)
S.place(S.crash(1.0), fr(ENDF), 0.75, 0.0, send=0.4)
S.place(stab([36, 48, 55, 60, 64, 67, 72, 76], 0.8, 6000, 0.3), fr(ENDF), 0.24, send=0.5)
LAST = EN['chips'][-2]                                                       # light pulse breathes until the chips finish
for k, fm in enumerate(beats(ENDF + BEAT, LAST + 1)):
    S.place(S.kick(0.75 - 0.08 * k), fr(fm), 0.85); S.kicks.append(fm)
    S.place(S.hat(0.8, open_=True), fr(fm + E8), 0.7, 0.25)
for fm in beats(ENDF + BEAT, LAST + 1):
    S.place(S.sbass(36, 0.16), fr(fm), 0.3, bus=S.PUMP)
pad(ENDF, SEAL, 1800, 0.9, rel=0.3)
for k, at in enumerate(EN['chips']):                                         # six chips: C D E G A C
    m = [72, 74, 76, 79, 81, 84][k]
    S.sfx(rel(S.marimba(m)[:int(0.6 * SR)] + 0.6 * S.celesta(m + 12, 0.6), -9), fr(at), 1.0, -0.5 + 0.2 * k, send=0.3)
sl = seal(1.0, 48)                                                           # the last action + the last sound
i = int(fr(SEAL) * SR)
n = min(len(sl), S.N - i)
FIN[0, i:i + n] += rel(sl, -2)[:n] * 0.72
FIN[1, i:i + n] += rel(sl, -2)[:n] * 0.70

# —— stamps: one per scene start (the ink scene gets the dong instead) ——
for at in SC[:18]:
    S.place(rel(stamp(S.chord(at)[1] % 12 + 48), -1.5), fr(at), 1.0, 0.0, send=0.06)
for key in ('bauhaus2', 'swiss2', 'wedge2'):
    at = AC[key]
    S.place(rel(small_hit(S.tone(at, 1, 1)), -9), fr(at), 1.0, 0.35, send=0.12)
S.place(rel(boing(S.chord(AC['memphisBounce'])[1] + 24), -6), fr(AC['memphisBounce']), 1.0, -0.2, send=0.12)

# —— lead melody: anchored to the chord frames, (eighth position, midi, length in eighths) ——
PH = [
    (SC[0], [(0, 79, 1), (1, 76, .5), (1.5, 79, .5), (2, 84, 2)]),                   # C   G E G C
    (SC[1], [(0, 83, 1), (1, 86, .5), (1.5, 83, .5), (2, 79, 2)]),                   # G   B D B G
    (SC[2], [(0, 84, 1), (1, 88, .5), (1.5, 84, .5), (2, 81, 2)]),                   # Am  C E C A
    (SC[3], [(0, 81, 1), (1, 79, 1), (2, 77, 1), (3, 76, 1)]),                       # F   A (G) F (E)
    (SC[4], [(0, 79, 1), (1, 76, .5), (1.5, 79, .5), (2, 84, 2)]),
    (SC[6], [(0, 83, 1), (1, 86, .5), (1.5, 83, .5), (2, 79, 2)]),
    (SC[8], [(0, 84, 1), (1, 88, .5), (1.5, 84, .5), (2, 81, 2)]),
    (SC[10], [(0, 77, .5), (.5, 81, .5), (1, 84, 1), (2, 89, 2)]),                   # F   rising answer
    (SC[12], [(0, 84, 1), (1, 88, .5), (1.5, 91, .5), (2, 88, 1), (3, 84, 1)]),      # C   high
    (SC[14], [(0, 86, 1), (1, 91, .5), (1.5, 86, .5), (2, 83, 1), (3, 86, 1)]),      # G
    (SC[16], [(0, 89, 1), (1, 84, 1)]),                                              # F
    (SC[17], [(0, 83, .5), (.5, 86, .5), (1, 91, 1)]),                               # G   -> cut
    (WALL, [(0, 93, 1.5), (1.5, 91, .5), (2, 89, 2)]),                               # F   highest phrase
    (WALL + 2 * BEAT, [(0, 91, 1), (1, 89, 1), (2, 86, 1), (3, 83, 1)]),             # G7  walks down to B
    (ENDF, [(0, 84, 5)]),                                                            # C   resolved
]
for a, notes in PH:
    S.hook(a, notes, 1.0, inst=lead)
    if a >= RB6:                                                                     # octave-down saw double at full tilt
        S.hook(a, [(p, m - 12, ln) for p, m, ln in notes], 0.55, inst=lead_saw)


# ======================================================================================
# master
# ======================================================================================
def measure(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'loudnorm=print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True)
    js = json.loads(r.stderr[r.stderr.rindex('{'):r.stderr.rindex('}') + 1])
    return float(js['input_i']), float(js['input_tp'])


def finish(out):
    tsec = np.arange(S.N) / SR
    ks = np.array(sorted(fr(k) for k in S.kicks))
    idx = np.searchsorted(ks, tsec, side='right') - 1
    since = np.where(idx >= 0, tsec - ks[np.clip(idx, 0, None)], 9.0)
    duck = 1 - 0.38 * (1 - np.clip(since / 0.2, 0, 1)) ** 2
    mus = S.MUS + S.PUMP * duck[None, :]
    D = int(fr(BEAT * 0.75) * SR)                                       # ping-pong delay, dotted 8th
    ld = S.LEAD.copy()
    ld[0, D:] += S.LEAD[1, :-D] * 0.3
    ld[1, 2 * D:] += S.LEAD[0, :-2 * D] * 0.2
    mus += ld
    send = S.SEND + ld * 0.25
    wet = np.stack([S.reverb(send[0], 1), S.reverb(send[1], 2)]) * 0.4
    # band + sfx bow out before the final seal (the seal is the last sound)
    a, b = fr(SEAL - BEAT * 0.75), fr(SEAL + BEAT * 0.25)
    env = np.clip((b - tsec) / (b - a), 0, 1) ** 2
    mix = (mus + wet + S.SFX) * env[None, :] + FIN
    hp = butter(2, 28, 'high', fs=SR, output='sos')
    mix = sosfilt(hp, mix, axis=1)
    mix = mix[:, :S.NV].T                                              # exactly DUR frames
    n = int(0.25 * SR)                                                 # final ring-out taper (raised cosine)
    mix[-n:] *= (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, n)))[:, None] ** 1.5
    mix /= np.abs(mix).max() + 1e-9
    mix = np.tanh(mix * 1.15) / np.tanh(1.15)
    out = os.fspath(out)
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    tmp = out + '.measure.wav'
    y, ceil = mix * 0.5, 0.85
    for _ in range(6):
        S.write(tmp, y)
        li, tp = measure(tmp)
        if abs(li + 14) < 0.15 and tp <= -1.0:
            break
        if tp > -1.0:
            ceil *= 10 ** ((-1.1 - tp) / 20)
        y = S.limit(y * 10 ** ((-14.0 - li) / 20), ceil)
    os.remove(tmp)
    S.write(out, y)
    print('loudness %.2f LUFS, true peak %.2f dBTP' % measure(out))
    print('wrote', out, y.shape)


finish(sys.argv[1] if len(sys.argv) > 1 else str(ROOT / 'public' / 'promo' / 'music.wav'))
