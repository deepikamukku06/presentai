import numpy as np
import librosa

class PitchAnalyzer:

    def __init__(self, sample_rate=16000):
        self.sample_rate = sample_rate

    def loudness(self, audio):
        return float(np.sqrt(np.mean(audio ** 2)))

    def pitch(self, audio):

        pitches, mags = librosa.piptrack(
            y=audio,
            sr=self.sample_rate,
        )

        if mags.size == 0:
            return 0.0

        idx = mags.argmax()
        return float(pitches.flatten()[idx])
