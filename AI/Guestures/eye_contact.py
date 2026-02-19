class EyeContactTracker:

    def __init__(self):
        self.good = 0
        self.total = 0

    def analyze(self, face_landmarks):

        eye_status = "NO FACE"
        current_frame_score = 0  # Score for THIS frame (0-100)

        if face_landmarks:

            m = face_landmarks[0].landmark

            iris = m[468].x
            l = m[33].x
            r = m[133].x

            ratio = (iris - l) / (r - l)

            if 0.42 < ratio < 0.58:
                eye_status = "GOOD"
                current_frame_score = 100  # Good eye contact = 100%
            else:
                eye_status = "BAD"
                # Score based on how close to ideal ratio
                ideal_ratio = 0.5
                distance = abs(ratio - ideal_ratio)
                current_frame_score = max(0, 100 - (distance * 200))  # Closer to center = higher score

        self.total += 1
        if current_frame_score == 100:  # Only count as "good" if perfect
            self.good += 1

        # Return current frame score for live display
        percent = float(current_frame_score)

        return eye_status, percent
