from sqlalchemy import Boolean, Column, DateTime, Integer, String, Identity
from sqlalchemy.orm import relationship
from datetime import datetime

from src.app.config.base import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, Identity(start=1), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    status = Column(Boolean, nullable=True, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    users = relationship("User", back_populates="role")