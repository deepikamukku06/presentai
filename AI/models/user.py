from sqlalchemy import Column, Integer, Float, String, ForeignKey, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True)
    name = Column(String)
    password_hash = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
