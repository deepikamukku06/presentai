from sqlalchemy.orm import Session
from models.skill_mastery import SkillMastery
from models.tutorial_video import TutorialVideo


def map_level(score: float):

    if score < 60:
        return "beginner"
    elif score < 80:
        return "intermediate"
    else:
        return "advanced"


def get_recommendations(db: Session, user_id: int):

    mastery_records = (
        db.query(SkillMastery)
        .filter(SkillMastery.user_id == user_id)
        .all()
    )

    if not mastery_records:
        return {}

    recommendations = {}

    for record in mastery_records:

        skill = record.skill_type
        score = record.mastery_score

        level = map_level(score)

        videos = (
            db.query(TutorialVideo)
            .filter(
                TutorialVideo.skill_type == skill,
                TutorialVideo.level == level
            )
            .limit(3)
            .all()
        )

        recommendations[skill] = [
            {
                "tutorial_id": video.id,
                "level": video.level,
                "file_path": video.file_path
            }
            for video in videos
        ]

    return recommendations
