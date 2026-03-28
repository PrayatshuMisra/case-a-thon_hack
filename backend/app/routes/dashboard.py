from fastapi import APIRouter
from app.services.metrics_service import get_dashboard_metrics

router = APIRouter()

@router.get("/metrics")
def get_metrics():
    """
    Retrieve operational dashboard metrics.
    """
    return get_dashboard_metrics()
