from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class FisherBase(BaseModel):
    name: str
    boat_id: str
    primary_catch: str
    harbor_cluster: str

class FisherCreate(FisherBase):
    digital_id_hash: str

class FisherResponse(FisherBase):
    id: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
