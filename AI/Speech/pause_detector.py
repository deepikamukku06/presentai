import time
import numpy as np

class PauseDetector:

    def __init__(self, silence_threshold=0.003, max_pause=3):
        self.silence_threshold = silence_threshold
        self.max_pause = max_pause
        self.silent_start = None
        self.alerted = False

    def process_audio(self, audio_chunk):

        rms = np.sqrt(np.mean(audio_chunk ** 2))
        now = time.time()

        if rms < self.silence_threshold:
            if self.silent_start is None:
                self.silent_start = now
            elif now - self.silent_start >= self.max_pause and not self.alerted:
                self.alerted = True
                return True   # LONG PAUSE detected
        else:
            self.silent_start = None
            self.alerted = False

        return False
