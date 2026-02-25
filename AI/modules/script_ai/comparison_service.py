import json
import re
from .llm_service import call_gemini


def compare_script(reference_script: str, transcript: str, gesture_score: float = 0, posture_score: float = 0, eye_contact_score: float = 0):
    """
    Compare a reference script against the actual transcript with delivery metrics.
    Returns structured JSON with missing points, suggestions, and AI feedback.
    """

    # Guard: if transcript is too short, skip Gemini call
    if not transcript or len(transcript.strip().split()) < 5:
        return {
            "coverage_percent": 0,
            "missing_points": ["Transcript too short to analyze"],
            "content_suggestions": ["Speak more during your presentation"],
            "AI_feedback_on_presentation": {
                "encouragement": "Keep practicing your delivery.",
                "improvement_tip": "Speak more to enable analysis."
            }
        }

    # Calculate coverage and missing points locally first
    ref_words = set(reference_script.lower().split())
    trans_words = set(transcript.lower().split())
    common = ref_words & trans_words
    coverage_percent = round((len(common) / max(len(ref_words), 1)) * 100, 1)
    
    # Find key phrases/sentences from script that may be missing
    # Split script into sentences and check if key words appear in transcript
    ref_sentences = [s.strip() for s in re.split(r'[.!?]', reference_script) if s.strip()]
    transcript_lower = transcript.lower()
    
    missing_sentences = []
    for sentence in ref_sentences:
        sentence_words = set(sentence.lower().split())
        # Remove common words
        key_words = {w for w in sentence_words if len(w) > 4}
        if key_words:
            # Check how many key words appear in transcript
            matches = sum(1 for w in key_words if w in transcript_lower)
            if matches < len(key_words) * 0.3:  # Less than 30% of key words present
                # Shorten to max 8 words
                short = ' '.join(sentence.split()[:8])
                if len(short) > 0:
                    missing_sentences.append(short + ("..." if len(sentence.split()) > 8 else ""))
    
    # Limit to top 5 missing points
    local_missing_points = missing_sentences[:5]
    
    # Generate local suggestions based on scores
    local_suggestions = []
    if gesture_score < 50:
        local_suggestions.append("Use more hand gestures")
    if posture_score < 50:
        local_suggestions.append("Maintain better posture")
    if eye_contact_score < 50:
        local_suggestions.append("Increase eye contact")
    if coverage_percent < 50:
        local_suggestions.append("Cover more of your script")
    
    # Generate local feedback
    avg_delivery = (gesture_score + posture_score + eye_contact_score) / 3
    if avg_delivery >= 70:
        local_encouragement = "Great delivery skills!"
        local_tip = "Focus on content coverage."
    elif avg_delivery >= 50:
        local_encouragement = "Good effort overall."
        local_tip = "Work on consistency."
    else:
        local_encouragement = "Keep practicing!"
        local_tip = "Focus on confidence."

    prompt = f"""You are an expert presentation evaluator.

Compare the Reference Script and Actual Transcript strictly.

Identify concepts present in the Reference Script that are missing or insufficiently explained in the Transcript.

Use delivery scores only to generate short coaching feedback.

Reference Script:
{reference_script}

Actual Transcript:
{transcript}

Metrics:
Coverage Score: {coverage_percent}
Gesture Score: {gesture_score}
Posture Score: {posture_score}
Eye Contact Score: {eye_contact_score}

Return ONLY valid JSON in this format:

{{
  "missing_points": [],
  "content_suggestions": [],
  "AI_feedback_on_presentation": {{
    "encouragement": "",
    "improvement_tip": ""
  }}
}}

Rules:
- Maximum 8 words per line.
- No paragraphs.
- No markdown.
- No explanations.
- Do not calculate scores.
- Do not add extra keys.
- If unable, return {{}}.
"""

    try:
        result = call_gemini(prompt, max_tokens=512, temperature=0)
        parsed = _extract_json(result)
        
        if parsed:
            # Add coverage_percent to the result
            parsed["coverage_percent"] = coverage_percent
            # Validate expected keys exist, merge with local analysis
            if not parsed.get("missing_points"):
                parsed["missing_points"] = local_missing_points
            if not parsed.get("content_suggestions"):
                parsed["content_suggestions"] = local_suggestions if local_suggestions else []
            parsed.setdefault("AI_feedback_on_presentation", {
                "encouragement": local_encouragement,
                "improvement_tip": local_tip
            })
            return parsed
        else:
            print(f"⚠️ compare_script: Could not parse JSON, using local analysis")
            return _local_fallback(coverage_percent, local_missing_points, local_suggestions, local_encouragement, local_tip)
            
    except Exception as e:
        print(f"⚠️ compare_script exception: {e}, using local analysis")
        return _local_fallback(coverage_percent, local_missing_points, local_suggestions, local_encouragement, local_tip)


def _local_fallback(coverage_percent: float, missing_points: list, suggestions: list, encouragement: str, tip: str):
    """Return local analysis results when Gemini fails."""
    return {
        "coverage_percent": coverage_percent,
        "missing_points": missing_points,
        "content_suggestions": suggestions if suggestions else ["Review your presentation delivery."],
        "AI_feedback_on_presentation": {
            "encouragement": encouragement,
            "improvement_tip": tip
        }
    }


def _default_response(coverage_percent: float = 0):
    """Return a safe default response when Gemini fails (no local data available)."""
    return {
        "coverage_percent": coverage_percent,
        "missing_points": [],
        "content_suggestions": ["Review your script coverage."],
        "AI_feedback_on_presentation": {
            "encouragement": "Keep practicing your delivery.",
            "improvement_tip": "Focus on key talking points."
        }
    }


def _extract_json(text: str):
    """Robustly extract a JSON object from text that may contain markdown fences."""
    if not text:
        return None
        
    # Strip markdown code fences if present
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)
    text = text.strip()

    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Find JSON object by matching braces
    start = text.find('{')
    if start == -1:
        return None

    brace_count = 0
    end = start
    for i in range(start, len(text)):
        if text[i] == '{':
            brace_count += 1
        elif text[i] == '}':
            brace_count -= 1
            if brace_count == 0:
                end = i + 1
                break

    if brace_count != 0:
        return None

    try:
        return json.loads(text[start:end])
    except json.JSONDecodeError:
        return None
