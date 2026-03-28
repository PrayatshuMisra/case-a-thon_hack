from datetime import datetime
from pydantic import BaseModel, Field


class AddFisherRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    boat_id: str = Field(min_length=2, max_length=40)
    species_focus: str = Field(min_length=2, max_length=80)
    avg_weekly_catch_kg: float = Field(gt=0, le=10000)
    commitment_level: str = Field(min_length=2, max_length=40)
    mobile_number: str | None = Field(default=None, max_length=20)


class AddFisherResponse(BaseModel):
    id: str
    status: str
    income_uplift_pct: float
    message: str
    onboarded_card: dict


class FisherRecord(BaseModel):
    id: str
    name: str
    boat_id: str
    species_focus: str
    avg_weekly_catch_kg: float
    commitment_level: str
    income_uplift_pct: float
    status: str
    created_at: datetime
