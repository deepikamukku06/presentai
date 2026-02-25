import requests
import time
import sys
from pathlib import Path

# Add Speech dir so we can import api_secrets
sys.path.append(str(Path(__file__).resolve().parent.parent.parent / "Speech"))
from api_secrets import GEMINI_API_KEY

GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models/"

# Try these models in order (separate quotas) - use valid v1beta models only
MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"]


def call_gemini(prompt: str, max_tokens: int = 4096, temperature: float = 0.7):
    """Call Gemini API with automatic model fallback and retry."""

    payload = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ],
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": temperature,
        },
    }

    last_error = None

    for model in MODELS:
        url = f"{GEMINI_BASE}{model}:generateContent?key={GEMINI_API_KEY}"

        for attempt in range(2):  # Reduced from 3 to 2 attempts per model
            try:
                response = requests.post(
                    url,
                    headers={"Content-Type": "application/json"},
                    json=payload,
                    timeout=60,
                )

                data = response.json()

                # Rate limited — wait with shorter backoff (faster failure)
                if response.status_code == 429:
                    wait = [3, 8][min(attempt, 1)]  # Reduced from 10/30/60 to 3/8
                    print(f"⏳ Rate limited on {model} (attempt {attempt+1}), retrying in {wait}s...")
                    time.sleep(wait)
                    continue

                if "candidates" in data:
                    print(f"✅ Gemini response from {model}")
                    return data["candidates"][0]["content"]["parts"][0]["text"]

                last_error = data
                break  # non-429 error, try next model

            except Exception as e:
                last_error = str(e)
                break

    raise Exception(f"All Gemini models failed: {last_error}")