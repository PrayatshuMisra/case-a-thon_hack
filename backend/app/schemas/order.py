from datetime import datetime
from pydantic import BaseModel, Field


class ReserveOrderRequest(BaseModel):
    customer_name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=8, max_length=20)
    apartment_name: str = Field(min_length=2, max_length=120)
    locality: str = Field(min_length=2, max_length=80)
    product_name: str = Field(min_length=2, max_length=80)
    quantity_kg: float = Field(gt=0, le=50)


class ReserveOrderResponse(BaseModel):
    order_id: str
    freshness_score: float
    freshness_label: str
    price_per_kg: float
    total_amount: float
    flash_drop: bool
    tracking_url: str


class OrderRecord(BaseModel):
    id: str
    customer_name: str
    phone: str
    apartment_name: str
    locality: str
    product_name: str
    quantity_kg: float
    price_per_kg: float
    total_amount: float
    freshness_score: float
    freshness_label: str
    status: str
    shipment_id: str
    created_at: datetime
