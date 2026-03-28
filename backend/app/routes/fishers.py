from fastapi import APIRouter
from app.schemas.fisher import FisherCreate, FisherResponse

router = APIRouter()

@router.get("/")
def get_fishers():
    """
    Retrieve all onboarded fishers.
    """
    return []

@router.post("/", response_model=FisherResponse)
def onboard_fisher(fisher: FisherCreate):
    """
    Onboard a new fisher to the collective.
    """
    return {
        "id": "fish_123",
        "name": fisher.name,
        "boat_id": fisher.boat_id,
        "primary_catch": fisher.primary_catch,
        "harbor_cluster": fisher.harbor_cluster,
        "status": "verified",
        "created_at": "2026-03-28T10:00:00Z"
    }
