from fastapi import APIRouter
from app.schemas.loi import LOICreate, LOIResponse

router = APIRouter()

@router.get("/")
def get_lois():
    """
    Retrieve all Letters of Intent.
    """
    return []

@router.post("/", response_model=LOIResponse)
def generate_loi(loi: LOICreate):
    """
    Generate a new Letter of Intent.
    """
    return {
        "id": "loi_123",
        "buyer_name": loi.buyer_name,
        "buyer_type": loi.buyer_type,
        "commitment_volume": loi.commitment_volume,
        "duration_days": loi.duration_days,
        "status": "generated",
        "blockchain_hash": "0x72a...f912",
        "created_at": "2026-03-28T10:00:00Z"
    }
