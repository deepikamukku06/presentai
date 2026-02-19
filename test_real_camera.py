#!/usr/bin/env python3
"""
Test the complete flow with real camera frames
"""

import requests
import base64
import time
import cv2
import numpy as np

API_BASE = "http://localhost:9000/api"

def main():
    print("🧪 Testing complete presentation coaching flow with REAL camera frames...\n")
    
    # Step 1: Start session
    print("1️⃣ Starting session...")
    try:
        resp = requests.post(f"{API_BASE}/start", timeout=10)
        resp.raise_for_status()
        data = resp.json()
        print(f"   ✅ Session started: {data}")
        session_id = data.get('session_id')
        if not session_id:
            print("   ❌ No session_id in response!")
            return
    except Exception as e:
        print(f"   ❌ Failed to start session: {e}")
        return
    
    # Step 2: Capture 5 real frames from camera and send them
    print(f"\n2️⃣ Capturing and sending 5 REAL camera frames...\n")
    
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("   ❌ Cannot open camera!")
        return
    
    try:
        frame_count = 0
        while frame_count < 5:
            ret, frame = cap.read()
            if not ret:
                print("   ❌ Failed to capture frame")
                break
            
            # Resize for speed (optional)
            frame = cv2.resize(frame, (320, 240))
            
            # Encode to JPEG
            ret, jpeg = cv2.imencode('.jpg', frame)
            if not ret:
                print("   ❌ Failed to encode frame")
                continue
            
            # Convert to base64
            b64 = base64.b64encode(jpeg.tobytes()).decode('utf-8')
            
            print(f"   Sending real camera frame {frame_count+1}/5...", end=" ", flush=True)
            resp = requests.post(
                f"{API_BASE}/frame",
                json={"frame": b64},
                timeout=60
            )
            resp.raise_for_status()
            data = resp.json()
            
            posture = data.get('posture_score', 0)
            eye = data.get('eye_score', 0)
            gesture = data.get('gesture_score', 0)
            
            print(f"✅ posture={posture:.0f}% eye={eye:.0f}% gesture={gesture:.0f}%")
            
            frame_count += 1
            time.sleep(0.2)  # Small delay between frames
    finally:
        cap.release()
    
    # Step 3: Stop session
    print(f"\n3️⃣ Stopping session...")
    try:
        resp = requests.post(f"{API_BASE}/stop", timeout=30)
        resp.raise_for_status()
        data = resp.json()
        print(f"   ✅ Session stopped: {data}")
    except Exception as e:
        print(f"   ❌ Failed to stop session: {e}")
        return
    
    print("\n✨ Complete flow test PASSED with real camera frames!")

if __name__ == "__main__":
    main()
