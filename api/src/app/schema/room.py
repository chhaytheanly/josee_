from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from src.app.schema.query import QueryParameters


class RoomCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=255)
    price: float = Field(..., gt=0)
    is_available: Optional[bool] = True


class RoomUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=255)
    price: Optional[float] = Field(None, gt=0)
    is_available: Optional[bool] = None


class TenantAssignRequest(BaseModel):
    tenant_id: int


class RoomDetailResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: float
    is_available: bool
    status: str
    tenant: Optional[dict] = None
    payment_status: Optional[str] = None
    amount_due: float = 0.0
    due_date: Optional[date] = None
    latest_payment: Optional[dict] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True