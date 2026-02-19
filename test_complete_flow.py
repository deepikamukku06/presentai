#!/usr/bin/env python3
"""
Test the complete flow: start session → send frames → stop session
"""

import requests
import base64
import time
import json
from pathlib import Path

API_BASE = "http://localhost:9000/api"

# Create a simple test image (100x100 JPEG)
def create_test_frame():
    """Create a simple gray JPEG frame"""
    import cv2
    import numpy as np
    
    # Create gray frame
    frame = np.ones((100, 100, 3), dtype=np.uint8) * 128
    
    # Encode to JPEG
    ret, jpeg = cv2.imencode('.jpg', frame)
    if not ret:
        raise Exception("Failed to encode frame")
    
    # Convert to base64
    b64 = base64.b64encode(jpeg.tobytes()).decode('utf-8')
    return b64

def main():
    print("🧪 Testing complete presentation coaching flow...\n")
    
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
    
    # Step 2: Send frames
    print(f"\n2️⃣ Sending 5 frames...")
    try:
        frame_data = create_test_frame()
        
        for i in range(5):
            print(f"   Sending frame {i+1}/5...", end=" ")
            resp = requests.post(
                f"{API_BASE}/frame",
                json={"frame": frame_data},
                timeout=60
            )
            resp.raise_for_status()
            data = resp.json()
            
            posture = data.get('posture_score', 0)
            eye = data.get('eye_score', 0)
            gesture = data.get('gesture_score', 0)
            
            print(f"✅ scores: posture={posture:.0f}% eye={eye:.0f}% gesture={gesture:.0f}%")
            time.sleep(0.5)
    except Exception as e:
        print(f"❌ Failed to send frames: {e}")
        return
    
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
    
    print("\n✨ Complete flow test passed!")

if __name__ == "__main__":
    main()
