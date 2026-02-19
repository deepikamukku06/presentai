from sqlalchemy.orm import Session
from models.session import Session as SessionModel
from models.skill_mastery import SkillMastery
from datetime import datetime


# ------------------------------------------------
# SAVE SESSION
# ------------------------------------------------

def save_session(
    db: Session,
    user_id: int,
    gesture: float,
    posture: float,
    eye: float,
    speech: float,
    overall: float,
    video_url: str
):

    session = SessionModel(
        user_id=user_id,
        gesture_score=gesture,
        posture_score=posture,
        eye_score=eye,
        speech_score=speech,
        overall_score=overall,
        video_url=video_url 
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return session


# ------------------------------------------------
# UPDATE MASTERY
# ------------------------------------------------

def update_mastery(db: Session, user_id: int):

    skills = {
        "gesture": "gesture_score",
        "posture": "posture_score",
        "eye": "eye_score",
        "speech": "speech_score"
    }

    for skill_name, column_name in skills.items():

        last_sessions = (
            db.query(SessionModel)
            .filter(SessionModel.user_id == user_id)
            .order_by(SessionModel.id.desc())
            .limit(5)
            .all()
        )

        if not last_sessions:
            continue

        scores = [getattr(s, column_name) for s in last_sessions]

        mastery_value = sum(scores) / len(scores)

        existing = (
            db.query(SkillMastery)
            .filter(
                SkillMastery.user_id == user_id,
                SkillMastery.skill_type == skill_name
            )
            .first()
        )

        if existing:
            existing.mastery_score = mastery_value
            existing.updated_at = datetime.utcnow()
        else:
            new_mastery = SkillMastery(
                user_id=user_id,
                skill_type=skill_name,
                mastery_score=mastery_value
            )
            db.add(new_mastery)

    db.commit()
