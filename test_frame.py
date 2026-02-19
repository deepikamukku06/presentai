import cv2
import base64
import requests
import numpy as np

# Try to capture from camera
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ Cannot open camera")
    exit(1)

print("✓ Camera opened, capturing frame...")

ret, frame = cap.read()
cap.release()

if not ret:
    print("❌ Cannot read frame from camera")
    exit(1)

print(f"✓ Captured frame: {frame.shape}")

# Convert to base64
ret, buffer = cv2.imencode('.jpg', frame)
base64_frame = base64.b64encode(buffer).decode()

print(f"✓ Encoded frame: {len(base64_frame)} bytes")

# Send to backend
url = "http://localhost:9000/api/frame"
payload = {"frame": base64_frame}

print("\n🚀 Sending to backend...")

try:
    response = requests.post(url, json=payload, timeout=10)
    response.raise_for_status()
    result = response.json()
    
    print("\n📊 Response received:")
    for key, value in result.items():
        print(f"  {key}: {value}")
    
    # Verify score values
    posture = float(result.get('posture_score', 0))
    eye = float(result.get('eye_score', 0))
    gesture = float(result.get('gesture_score', 0))
    
    print(f"\n✓ Analysis Results:")
    print(f"  Posture Status: {result.get('posture_status')}")
    print(f"  Eye Status: {result.get('eye_status')}")
    print(f"  Gesture Status: {result.get('gesture_status')}")
    print(f"\n  Posture Score: {posture}%")
    print(f"  Eye Score: {eye}%")
    print(f"  Gesture Score: {gesture}%")
    print(f"  Overall: {((posture * 0.4) + (eye * 0.35) + (gesture * 0.25)):.1f}%")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

