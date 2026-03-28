from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class LOIBase(BaseModel):
    buyer_name: str
    buyer_type: str
    commitment_volume: str
    duration_days: int

class LOICreate(LOIBase):
    pass

class LOIResponse(LOIBase):
    id: str
    status: str
    blockchain_hash: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
