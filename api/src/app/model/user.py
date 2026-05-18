from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Identity, CheckConstraint
from sqlalchemy.orm import relationship

from src.app.config.base import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("email LIKE '%@%'", name="valid_email"),
    )

    id = Column(Integer, Identity(start=1), primary_key=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    password = Column(String(255), nullable=False)
    image = Column(String(255), nullable=True)

    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    role = relationship("Role", back_populates="users")