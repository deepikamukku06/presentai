from sqlalchemy import Column, Integer, Float, Boolean, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class UserTutorialProgress(Base):
    __tablename__ = "user_tutorial_progress"

    id = Column(Integer, primary_key=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tutorial_id = Column(Integer, ForeignKey("tutorial_videos.id"), nullable=False)

    watched_seconds = Column(Float, default=0)
    watch_percent = Column(Float, default=0)

    completed = Column(Boolean, default=False)
    last_position = Column(Float, default=0)

    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "tutorial_id", name="unique_user_tutorial"),
    )

    user = relationship("User", backref="tutorial_progress")
    tutorial = relationship("TutorialVideo", backref="user_progress")
