from pydantic import BaseModel, Field
from typing import Optional


class TenantCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: Optional[str] = Field(None)
    phone: Optional[str] = Field(None, max_length=50)
    id_card: Optional[str] = Field(None, max_length=100)

    class Config:
        from_attributes = True