import requests
import cv2
import base64
import sys
import time
sys.path.insert(0, r'C:\Users\hepsi\OneDrive\Desktop\win\AI')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Use same DB as backend (PostgreSQL)
DATABASE_URL = "postgresql://postgres:Hepsiba%402005@localhost:5432/presentation_ai"
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
Session = sessionmaker(bind=engine)
db = Session()

# Stop any running session
print("🛑 Stopping any running session...")
try:
    requests.post('http://localhost:9000/api/stop', json={}, timeout=5)
except:
    pass

time.sleep(1)

# Start a session
print("🎬 Starting session...")
resp = requests.post('http://localhost:9000/api/start', json={}, timeout=5)
print(f"Response: {resp.json()}")
session_id = resp.json().get('session_id')
if not session_id:
    print("❌ Failed to create session")
    sys.exit(1)
print(f"✅ Session created: {session_id}")

# Capture and send 3 frames
print("\n📸 Sending 3 frames...")
cap = cv2.VideoCapture(0)

for i in range(3):
    ret, frame = cap.read()
    if not ret:
        print(f"❌ Cannot read frame {i+1}")
        continue
    
    # Encode
    _, buffer = cv2.imencode('.jpg', frame)
    base64_frame = base64.b64encode(buffer).decode()
    
    # Send
    resp = requests.post('http://localhost:9000/api/frame', json={'frame': base64_frame}, timeout=10)
    result = resp.json()
    
    print(f"  Frame {i+1}: Posture={result['posture_score']}%, Eye={result['eye_score']}%, Gesture={result['gesture_score']}%")

cap.release()

# Check database
print("\n💾 Checking database...")
from models.feedback import Feedback
feedbacks = db.query(Feedback).filter(Feedback.session_id == session_id).all()
print(f"✅ Found {len(feedbacks)} feedback records for session {session_id}")

for fb in feedbacks:
    print(f"  - {fb.category}: {fb.score}% (status: {fb.status}, timestamp: {fb.timestamp:.2f}s)")

db.close()



