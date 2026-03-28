from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_live_drops():
    """
    Get active live drops from Malpe Harbor.
    """
    return [
        {
            "id": "1",
            "product": "Seer Fish",
            "vessel": "MAL-74",
            "freshness": 94,
            "status": "active"
        }
    ]
