"""015 提炼的可复用音色与混音器。所有随机音色共用同一实例的 RNG。"""
import numpy as np
from .mix import Mixer
from .instruments import Instruments
from .effects import Effects

class AudioKit(Mixer, Instruments, Effects):
    def __init__(self, duration=20.0, sample_rate=48000, seed=15, fps=60.0, tail=3.0):
        self.SR = sample_rate
        self.DUR = duration
        self.NV = int(sample_rate * duration)
        self.N = int(sample_rate * (duration + tail))
        self.fps = fps
        self.rng = np.random.default_rng(seed)
        self.MUS = np.zeros((2, self.N))
        self.SFX = np.zeros((2, self.N))
        self.SEND = np.zeros((2, self.N))
        self.DUCK = np.ones(self.N)

    def sidechain(self, frame, duration=0.18, floor=0.45, power=0.7):
        i = int(self.fr(frame) * self.SR)
        n = int(duration * self.SR)
        self.DUCK[i:i + n] = np.minimum(self.DUCK[i:i + n], floor + (1 - floor) * (np.arange(n) / n) ** power)
