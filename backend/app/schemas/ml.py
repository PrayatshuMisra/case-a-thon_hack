from datetime import datetime
from pydantic import BaseModel, Field


class RecommendationArm(BaseModel):
    arm_id: str
    locality: str
    product_name: str
    channel: str
    offer: str
    expected_orders: float
    expected_gmv: float
    conversion_probability: float = Field(ge=0, le=1)
    sla_confidence: float = Field(ge=0, le=1)
    confidence_band: str
    risk_flags: list[str] = Field(default_factory=list)


class TomorrowRecommendationResponse(BaseModel):
    generated_at: datetime
    budget_context_inr: int
    top_arms: list[RecommendationArm]
    rationale: list[str]


class ExperimentLogRequest(BaseModel):
    arm_id: str = Field(min_length=3, max_length=120)
    locality: str = Field(min_length=2, max_length=120)
    product_name: str = Field(min_length=2, max_length=80)
    channel: str = Field(min_length=2, max_length=60)
    offer: str = Field(min_length=2, max_length=120)
    impressions: int = Field(ge=0, le=1000000)
    orders: int = Field(ge=0, le=1000000)
    revenue: float = Field(ge=0, le=1000000000)


class ExperimentLogResponse(BaseModel):
    status: str
    arm_id: str
    updated_alpha: float
    updated_beta: float
    empirical_conversion_rate: float
    next_best_arm_id: str


class TractionScoreComponent(BaseModel):
    name: str
    score: float
    label: str


class ModelTractionScoreResponse(BaseModel):
    generated_at: datetime
    traction_score: float
    components: list[TractionScoreComponent]
    notes: list[str]
