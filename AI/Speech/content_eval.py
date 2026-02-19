import requests
from api_secrets import GEMINI_API_KEY


# Use stable v1 endpoint with gemini-2.0-flash (newer and widely available)
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.0-flash:generateContent"
)


def evaluate_content(text, pitch, vision):

    prompt = f"""
You are a public speaking coach.

Analyze this talk:

{text}

Pitch stats: {pitch}
Vision scores: {vision}

Give:
1) Clarity /100
2) Engagement /100
3) Structure /100
4) Feedback
5) Improved rewritten version
"""

    payload = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ]
    }

    try:

        r = requests.post(
            f"{GEMINI_URL}?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=25,
        )

        data = r.json()

        # PRINT for debugging
        print("🟡 Gemini raw response:", data)

        # SAFE extraction
        if "candidates" not in data:
            return {
                "error": "Gemini API failed",
                "raw": data,
            }

        return data["candidates"][0]["content"]["parts"][0]["text"]

    except Exception as e:

        return {
            "error": "Gemini exception",
            "message": str(e),
        }
