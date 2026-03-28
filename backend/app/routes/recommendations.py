from fastapi import APIRouter

from app.db.store import store
from app.schemas.ml import ModelTractionScoreResponse, TomorrowRecommendationResponse
from app.services.ml_decision_engine import model_traction_score, recommend_tomorrow

router = APIRouter()


@router.get("/api/recommendation/tomorrow", response_model=TomorrowRecommendationResponse)
def get_tomorrow_recommendation():
    return recommend_tomorrow(store)


@router.get("/api/model/traction-score", response_model=ModelTractionScoreResponse)
def get_model_traction_score():
    return model_traction_score(store)
