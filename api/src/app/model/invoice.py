from sqlalchemy import Column, Integer, Float, Date, DateTime, ForeignKey, Enum as SQLEnum, Identity, CheckConstraint, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from src.app.config.base import Base


class InvoiceStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    late = "late"


class Invoice(Base):
    __tablename__ = "invoices"
    __table_args__ = (
        CheckConstraint("month BETWEEN 1 AND 12", name="valid_month"),
        CheckConstraint("year >= 2000", name="valid_year"),
        CheckConstraint("amount > 0", name="positive_amount"),
        CheckConstraint("amount_paid >= 0", name="non_negative_amount_paid"),
        Index("ix_invoice_tenant_period", "tenant_id", "year", "month"),
    )

    id = Column(Integer, Identity(start=1), primary_key=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)

    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)

    amount = Column(Float, nullable=False)
    amount_paid = Column(Float, default=0.0)

    due_date = Column(Date, nullable=False)
    status = Column(SQLEnum(InvoiceStatus), default=InvoiceStatus.pending)

    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)

    room = relationship("Room", back_populates="invoices")
    tenant = relationship("Tenant", back_populates="invoices")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete")