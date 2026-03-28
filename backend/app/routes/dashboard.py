from fastapi import APIRouter
from app.services.metrics_service import get_dashboard_metrics
from app.db.store import store

router = APIRouter()

@router.get("/api/dashboard-metrics")
def get_metrics():
    return get_dashboard_metrics(store)
