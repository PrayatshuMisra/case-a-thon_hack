from pydantic import BaseModel, Field


class MlScenarioRequest(BaseModel):
    species: str = Field(min_length=2, max_length=40)
    strategy_id: str = Field(min_length=2, max_length=40)
    freshness_score: float = Field(ge=0, le=100)
    health_score: float = Field(ge=0, le=100)
    available_kg: float = Field(gt=0, le=500)
    forecast_demand_kg: float = Field(gt=0, le=500)
    base_price_per_kg: float = Field(gt=0, le=5000)
    cold_chain_maintained: bool


class MlScenarioResponse(BaseModel):
    model_version: str
    feasible_probability: float
    predicted_profit: float
    predicted_wastage_pct: float
    recommended_action: str


class MlRetrainResponse(BaseModel):
    model_version: str
    samples_trained: int
    status: str
