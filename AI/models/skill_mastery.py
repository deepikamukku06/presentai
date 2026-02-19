from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class SkillMastery(Base):
    __tablename__ = "skill_mastery"

    id = Column(Integer, primary_key=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skill_type = Column(String, nullable=False)

    mastery_score = Column(Float, nullable=False)

    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "skill_type", name="unique_user_skill"),
    )

    user = relationship("User", backref="mastery")
