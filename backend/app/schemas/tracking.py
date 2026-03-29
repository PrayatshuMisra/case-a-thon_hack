from pydantic import BaseModel


class TrackingStage(BaseModel):
    key: str
    label: str
    timestamp: str | None = None
    completed: bool
    current: bool = False


class FreshnessAuditItem(BaseModel):
    label: str
    value: str
    status: str  # 'pass', 'warn', 'info'
    impact: str


class OrderTrackingResponse(BaseModel):
    order_id: str
    status: str
    customer_name: str
    phone: str
    apartment_name: str
    locality: str
    product_name: str
    quantity_kg: float
    total_amount: float
    freshness_score: float
    freshness_label: str
    source_boat: str
    catch_zone: str
    cold_chain_maintained: bool
    eta: str
    timeline: list[TrackingStage]
    freshness_audit: list[FreshnessAuditItem] = []
