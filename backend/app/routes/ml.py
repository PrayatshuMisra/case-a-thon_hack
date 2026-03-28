from fastapi import APIRouter

from app.schemas.ml import MlRetrainResponse, MlScenarioRequest, MlScenarioResponse
from app.services.ml_trained_model import load_or_train_models, predict_scenario, train_and_save_models

router = APIRouter()


@router.get("/api/ml/status")
def ml_status():
    model = load_or_train_models()
    return {
        "model_version": model.get("model_version"),
        "trained_at": model.get("trained_at"),
        "samples_trained": model.get("samples_trained"),
    }


@router.post("/api/ml/predict-scenario", response_model=MlScenarioResponse)
def ml_predict(payload: MlScenarioRequest):
    out = predict_scenario(payload.model_dump())
    return MlScenarioResponse(
        model_version=out["model_version"],
        feasible_probability=out["feasible_probability"],
        predicted_profit=out["predicted_profit"],
        predicted_wastage_pct=out["predicted_wastage_pct"],
        recommended_action=out["recommended_action"],
    )


@router.post("/api/ml/retrain", response_model=MlRetrainResponse)
def ml_retrain():
    artifacts = train_and_save_models(samples=4500)
    return MlRetrainResponse(
        model_version="v1.0-trained",
        samples_trained=artifacts.samples_trained,
        status="retrained",
    )
