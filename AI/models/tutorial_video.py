from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from database import Base

class TutorialVideo(Base):
    __tablename__ = "tutorial_videos"

    id = Column(Integer, primary_key=True)

    skill_type = Column(String, nullable=False)   # gesture/posture/eye
    level = Column(String, nullable=False)        # beginner/intermediate/advanced

    file_path = Column(String, nullable=False)    # videos/gesture/beginner_1.mp4
    duration = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
