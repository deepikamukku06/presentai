import math
import mediapipe as mp
import cv2


class GestureTracker:

    def __init__(self):

        self.mp_hands = mp.solutions.hands
        self.drawer = mp.solutions.drawing_utils

        self.hands = self.mp_hands.Hands(
            max_num_hands=2,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.6,
        )

        self.prev_hands = None
        self.last_move = 0

        self.total = 0
        self.moving_frames = 0

    def analyze(self, frame, now):

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        res = self.hands.process(rgb)

        hands = []

        if res.multi_hand_landmarks:

            h, w, _ = frame.shape

            for hand in res.multi_hand_landmarks:

                lm_list = []

                for i, lm in enumerate(hand.landmark):
                    lm_list.append(
                        [i, int(lm.x * w), int(lm.y * h)]
                    )

                hands.append(lm_list)

        moving = False

        if hands and self.prev_hands:

            for a, b in zip(self.prev_hands, hands):

                total = 0

                for pid in [0, 8, 12]:

                    total += math.hypot(
                        b[pid][1] - a[pid][1],
                        b[pid][2] - a[pid][2],
                    )

                if total / 3 > 9:
                    moving = True
                    self.last_move = now

        elif hands:
            self.last_move = now

        self.prev_hands = hands

        idle = now - self.last_move

        if idle > 8:
            status = "NO GESTURES"
            current_frame_score = 0  # No hands detected = 0%
        elif moving:
            status = "MOVING"
            current_frame_score = 100  # Active gestures = 100%
        else:
            status = "IDLE"
            current_frame_score = 50  # Hands present but not moving = 50%

        self.total += 1
        if status == "MOVING":
            self.moving_frames += 1

        # Return current frame score for live display
        percent = float(current_frame_score)

        return status, percent
