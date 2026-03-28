from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class OrderBase(BaseModel):
    customer_id: str
    product_name: str
    quantity_kg: float
    status: str

class OrderCreate(OrderBase):
    pass

class OrderResponse(OrderBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
