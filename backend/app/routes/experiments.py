from fastapi import APIRouter

from app.db.store import store
from app.schemas.ml import ExperimentLogRequest, ExperimentLogResponse
from app.services.ml_decision_engine import log_experiment

router = APIRouter()


@router.post("/api/experiment/log", response_model=ExperimentLogResponse)
def create_experiment_log(payload: ExperimentLogRequest):
    return log_experiment(store, payload.model_dump())


@router.get("/api/experiment/logs")
def get_experiment_logs(limit: int = 20):
    return {
        "count": len(store.experiments),
        "items": store.experiments[: max(1, min(limit, 200))],
    }
