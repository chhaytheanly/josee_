from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import date, datetime
from enum import Enum


class InvoiceStatus(str, Enum):
    pending = "pending"
    paid = "paid"
    late = "late"


class InvoiceCreate(BaseModel):
    tenant_id: int = Field(..., gt=0)
    room_id: int = Field(..., gt=0)
    for_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    is_first_invoice: Optional[bool] = False
    check_in_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")

    @field_validator('for_date', 'check_in_date')
    @classmethod
    def validate_date_format(cls, v):
        if v is None:
            return v
        date.fromisoformat(v)
        return v


class PaymentCreate(BaseModel):
    amount: float = Field(..., gt=0)
    image: Optional[str] = None


class RoomSummary(BaseModel):
    id: int
    name: str
    price: float

    model_config = {"from_attributes": True}


class TenantSummary(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None

    model_config = {"from_attributes": True}


class PaymentSummary(BaseModel):
    id: int
    amount: float
    status: str
    paid_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class InvoiceResponse(BaseModel):
    id: int
    room_id: int
    tenant_id: int
    month: int
    year: int
    amount: float
    amount_paid: float
    due_date: date
    status: InvoiceStatus
    created_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    room: Optional[RoomSummary] = None
    tenant: Optional[TenantSummary] = None
    payments: Optional[List[PaymentSummary]] = None

    model_config = {"from_attributes": True}


class PaymentResponse(BaseModel):
    id: int
    invoice_id: int
    amount: float
    image: Optional[str]
    status: str
    paid_at: datetime
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class MetaResponse(BaseModel):
    page: int
    limit: int
    total: int


class PaginatedInvoiceResponse(BaseModel):
    data: list[InvoiceResponse]
    meta: MetaResponse


class GenerateAllRequest(BaseModel):
    for_date: Optional[str] = None


class ApplyLateFeesRequest(BaseModel):
    grace_period_days: int = 3
