import sounddevice as sd

class AudioStream:

    def __init__(self, sample_rate, callback):

        self.sample_rate = sample_rate
        self.callback = callback
        self.stream = None

    def start(self):

        self.stream = sd.InputStream(
            samplerate=self.sample_rate,
            channels=1,
            callback=self.callback,
            blocksize=1024,
        )

        self.stream.start()

    def stop(self):

        if self.stream:
            self.stream.stop()
            self.stream.close()
            self.stream = None
