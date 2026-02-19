# from flask import Flask, render_template
# from flask_socketio import SocketIO
# import cv2
# import mediapipe as mp
# import base64
# import time
# import threading
# import os

# from posture import PostureTracker
# from eye_contact import EyeContactTracker
# from gesture import GestureTracker

# # ----------------------------
# # SCORE STATE (FINAL REPORT)
# # ----------------------------

# score_state = {
#     "posture": [],
#     "eye": [],
#     "gesture": [],
# }

# WEIGHTS = {
#     "posture": 0.4,
#     "eye": 0.35,
#     "gesture": 0.25,
# }

# # ----------------------------
# # FLASK
# # ----------------------------

# app = Flask(__name__)
# socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# # ----------------------------
# # MEDIAPIPE
# # ----------------------------

# mp_pose = mp.solutions.pose
# mp_face = mp.solutions.face_mesh

# pose = mp_pose.Pose()
# face_mesh = mp_face.FaceMesh(refine_landmarks=True)

# # ----------------------------
# # TRACKERS
# # ----------------------------

# posture_tracker = PostureTracker()
# eye_tracker = EyeContactTracker()
# gesture_tracker = GestureTracker()

# # ----------------------------
# # CAMERA STATE
# # ----------------------------

# camera_running = False
# camera_lock = threading.Lock()

# session_start_time = None

# video_writer = None
# VIDEO_DIR = "recordings"
# os.makedirs(VIDEO_DIR, exist_ok=True)

# CAMERA_INDEX = 0   # change to 1 if needed

# # ----------------------------
# # CAMERA LOOP
# # ----------------------------

# def camera_loop():

#     global video_writer, session_start_time

#     cap = cv2.VideoCapture(CAMERA_INDEX)

#     if not cap.isOpened():
#         print("❌ ERROR: Webcam could not be opened.")
#         return

#     print("✅ Webcam opened successfully.")

#     width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
#     height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

#     if width == 0 or height == 0:
#         width, height = 640, 480

#     fourcc = cv2.VideoWriter_fourcc(*"mp4v")

#     video_path = os.path.join(VIDEO_DIR, "session_video.mp4")

#     video_writer = cv2.VideoWriter(
#         video_path,
#         fourcc,
#         30,
#         (width, height),
#     )

#     print("🎥 Recording video:", video_path)

#     first_frame = True

#     while True:

#         with camera_lock:
#             if not camera_running:
#                 break

#         ok, frame = cap.read()
#         if not ok:
#             print("❌ ERROR: Failed to read frame from webcam.")
#             break

#         if first_frame:
#             print("✅ Webcam stream started successfully.")
#             first_frame = False

#         now = time.time()
#         timestamp = round(now - session_start_time, 2)

#         rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

#         # ---------- ANALYSIS ----------

#         pose_res = pose.process(rgb)
#         face_res = face_mesh.process(rgb)

#         posture_status, angle, posture_pct = posture_tracker.analyze(
#             pose_res.pose_landmarks
#         )

#         eye_status, eye_pct = eye_tracker.analyze(
#             face_res.multi_face_landmarks
#         )

#         gesture_status, gesture_pct = gesture_tracker.analyze(
#             frame, now
#         )

#         # ---------- COLLECT SCORES ----------

#         score_state["posture"].append(posture_pct)
#         score_state["eye"].append(eye_pct)
#         score_state["gesture"].append(gesture_pct)

#         # ---------- EMIT LIVE DATA ----------

#         socketio.emit(
#             "posture",
#             {
#                 "status": posture_status,
#                 "angle": round(angle, 1),
#                 "percent_good": posture_pct,
#                 "time": timestamp,
#             },
#         )

#         socketio.emit(
#             "eye",
#             {
#                 "status": eye_status,
#                 "percent_good": eye_pct,
#                 "time": timestamp,
#             },
#         )

#         socketio.emit(
#             "gesture",
#             {
#                 "status": gesture_status,
#                 "percent_active": gesture_pct,
#                 "time": timestamp,
#             },
#         )

#         # ---------- STREAM VIDEO ----------

#         _, buf = cv2.imencode(".jpg", frame)

#         socketio.emit(
#             "video_feed",
#             {
#                 "frame": base64.b64encode(buf).decode(),
#                 "time": timestamp,
#             },
#         )

#         # ---------- RECORD ----------

#         video_writer.write(frame)

#         socketio.sleep(0.03)

#     cap.release()

#     if video_writer:
#         video_writer.release()
#         print("📁 Video saved:", video_path)


# # ----------------------------
# # SOCKET EVENTS
# # ----------------------------

# @socketio.on("start_camera")
# def start_camera():

#     global camera_running, session_start_time

#     # reset score buffers
#     for k in score_state:
#         score_state[k].clear()

#     with camera_lock:

#         if camera_running:
#             return

#         camera_running = True
#         session_start_time = time.time()

#     socketio.start_background_task(camera_loop)


# @socketio.on("stop_camera")
# def stop_camera():

#     global camera_running

#     with camera_lock:
#         camera_running = False


# # ----------------------------
# # ROUTE
# # ----------------------------

# @app.route("/")
# def index():
#     return render_template("index.html")


# # ----------------------------
# # MASTER CONTROL
# # ----------------------------

# def start_camera_system():

#     global camera_running, session_start_time

#     # reset scores for new run
#     for k in score_state:
#         score_state[k].clear()

#     with camera_lock:
#         camera_running = True
#         session_start_time = time.time()

#     socketio.start_background_task(camera_loop)


# def stop_camera_system():

#     global camera_running

#     with camera_lock:
#         camera_running = False


# # ----------------------------
# # FINAL SCORE HELPERS
# # ----------------------------

# def compute_scores():
#     """
#     Returns average posture / eye / gesture scores for the session.
#     """

#     def avg(lst):
#         return round(sum(lst) / len(lst), 1) if lst else 0

#     posture_avg = avg(score_state["posture"])
#     eye_avg = avg(score_state["eye"])
#     gesture_avg = avg(score_state["gesture"])

#     overall = round(
#         posture_avg * WEIGHTS["posture"]
#         + eye_avg * WEIGHTS["eye"]
#         + gesture_avg * WEIGHTS["gesture"],
#         1,
#     )

#     return {
#         "posture": posture_avg,
#         "eye": eye_avg,
#         "gesture": gesture_avg,
#         "overall": overall,
#     }



import cv2
import mediapipe as mp
import base64
import time
import numpy as np

from posture import PostureTracker
from eye_contact import EyeContactTracker
from gesture import GestureTracker

# ----------------------------
# SCORE STATE (FINAL REPORT)
# ----------------------------

score_state = {
    "posture": [],
    "eye": [],
    "gesture": [],
}

WEIGHTS = {
    "posture": 0.4,
    "eye": 0.35,
    "gesture": 0.25,
}

# ----------------------------
# MEDIAPIPE INITIALIZATION
# ----------------------------

mp_pose = mp.solutions.pose
mp_face = mp.solutions.face_mesh

pose = mp_pose.Pose()
face_mesh = mp_face.FaceMesh(refine_landmarks=True)

# ----------------------------
# TRACKERS
# ----------------------------

posture_tracker = PostureTracker()
eye_tracker = EyeContactTracker()
gesture_tracker = GestureTracker()

# ----------------------------
# RESET SCORES (CALL AT START)
# ----------------------------

def reset_scores():
    global posture_tracker, eye_tracker, gesture_tracker, score_state
    
    # Clear score state lists
    for k in score_state:
        score_state[k].clear()
    
    # Reset tracker instances
    posture_tracker.__init__()
    eye_tracker.__init__()
    gesture_tracker.__init__()


# ----------------------------
# PROCESS FRAME FROM WEBRTC
# ----------------------------

def process_frame_from_webrtc(frame_base64: str):

    try:
        # Decode base64 image
        img_bytes = base64.b64decode(frame_base64)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            return {
                "posture_status": "ERROR",
                "eye_status": "ERROR",
                "gesture_status": "ERROR",
                "posture_score": 0,
                "eye_score": 0,
                "gesture_score": 0,
            }

        now = time.time()

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # ---------- ANALYSIS ----------

        pose_res = pose.process(rgb)
        face_res = face_mesh.process(rgb)

        posture_status, angle, posture_pct = posture_tracker.analyze(
            pose_res.pose_landmarks
        )

        eye_status, eye_pct = eye_tracker.analyze(
            face_res.multi_face_landmarks
        )

        gesture_status, gesture_pct = gesture_tracker.analyze(
            frame, now
        )

        # ---------- COLLECT SCORES ----------

        score_state["posture"].append(posture_pct)
        score_state["eye"].append(eye_pct)
        score_state["gesture"].append(gesture_pct)

        return {
            "posture_status": posture_status,
            "eye_status": eye_status,
            "gesture_status": gesture_status,
            "posture_score": float(posture_pct),
            "eye_score": float(eye_pct),
            "gesture_score": float(gesture_pct),
        }
    except Exception as e:
        print(f"Error in process_frame_from_webrtc: {e}")
        return {
            "posture_status": "ERROR",
            "eye_status": "ERROR",
            "gesture_status": "ERROR",
            "posture_score": 0,
            "eye_score": 0,
            "gesture_score": 0,
        }


# ----------------------------
# FINAL SCORE CALCULATION
# ----------------------------

def compute_scores():

    def avg(lst):
        return round(sum(lst) / len(lst), 1) if lst else 0

    posture_avg = avg(score_state["posture"])
    eye_avg = avg(score_state["eye"])
    gesture_avg = avg(score_state["gesture"])

    overall = round(
        posture_avg * WEIGHTS["posture"]
        + eye_avg * WEIGHTS["eye"]
        + gesture_avg * WEIGHTS["gesture"],
        1,
    )

    return {
        "posture": posture_avg,
        "eye": eye_avg,
        "gesture": gesture_avg,
        "overall": overall,
    }
