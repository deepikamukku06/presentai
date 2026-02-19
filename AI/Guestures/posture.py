import numpy as np
from collections import deque

TILT_THRESHOLD = 14
SMOOTHING_WINDOW = 15

angle_buffer = deque(maxlen=SMOOTHING_WINDOW)


def get_torso_angle(lm):

    ms_x = (lm[11].x + lm[12].x) / 2
    ms_y = (lm[11].y + lm[12].y) / 2

    mh_x = (lm[23].x + lm[24].x) / 2
    mh_y = (lm[23].y + lm[24].y) / 2

    return np.degrees(
        np.arctan2(abs(ms_x - mh_x), abs(ms_y - mh_y))
    )


class PostureTracker:

    def __init__(self):
        self.good = 0
        self.total = 0

    def analyze(self, pose_landmarks):

        posture_status = "NO BODY"
        avg_angle = 0
        current_frame_score = 0  # Score for THIS frame (0-100)

        if pose_landmarks:

            lm = pose_landmarks.landmark

            ang = get_torso_angle(lm)
            angle_buffer.append(ang)

            avg_angle = sum(angle_buffer) / len(angle_buffer)

            shoulder_diff = abs(lm[11].y - lm[12].y)

            if avg_angle > TILT_THRESHOLD or shoulder_diff > 0.05:
                posture_status = "BAD"
                current_frame_score = 20  # Poor posture = 20%
            else:
                posture_status = "GOOD"
                current_frame_score = 100  # Good posture = 100%

        self.total += 1
        if current_frame_score == 100:  # Only count as "good" if perfect
            self.good += 1

        # Return current frame score for live display
        percent = float(current_frame_score)

        return posture_status, avg_angle, percent
