from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TrackingEventBase(BaseModel):
    order_id: str
    event_type: str
    location: str
    temperature_celsius: Optional[float] = None

class TrackingEventCreate(TrackingEventBase):
    pass

class TrackingEventResponse(TrackingEventBase):
    id: str
    timestamp: datetime

    class Config:
        from_attributes = True
