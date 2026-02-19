from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, String
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    
    # Category: eye_contact, posture, gesture, voice, filler
    category = Column(String, nullable=False)
    
    # Status message from backend
    status = Column(String, nullable=False)
    
    # Score for this feedback
    score = Column(Float, nullable=True)
    
    # Timestamp in seconds from session start
    timestamp = Column(Float, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    session = relationship("Session", backref="feedback_records")
