import time

class WPMTracker:

    def __init__(self):
        self.start_time = None
        self.total_words = 0

    def start(self):
        self.start_time = time.time()
        self.total_words = 0

    def add_words(self, count):

        if not self.start_time:
            return 0

        self.total_words += count

        minutes = max((time.time() - self.start_time) / 60, 1e-6)
        return int(self.total_words / minutes)
