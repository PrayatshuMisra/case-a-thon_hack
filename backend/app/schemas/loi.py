from datetime import datetime
from pydantic import BaseModel, Field


class GenerateLoiRequest(BaseModel):
    buyer_type: str = Field(description="Restaurant | RWA | Export")
    buyer_name: str = Field(min_length=2, max_length=120)
    monthly_volume_kg: float = Field(gt=0, le=100000)
    duration_days: int = Field(ge=7, le=3650)
    price_note: str = Field(default="Indicative price subject to pilot demand")
    delivery_terms: str = Field(default="Delivered with cold-chain compliance")
    special_notes: str | None = Field(default=None, max_length=1500)
    status: str = Field(default="Draft")


class GenerateLoiResponse(BaseModel):
    id: str
    status: str
    message: str
    preview: dict


class LoiRecord(BaseModel):
    id: str
    buyer_type: str
    buyer_name: str
    monthly_volume_kg: float
    duration_days: int
    price_note: str
    delivery_terms: str
    special_notes: str | None = None
    status: str
    created_at: datetime
