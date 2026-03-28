from uuid import uuid4

from fastapi import APIRouter

from app.db.store import now_utc, store
from app.schemas.fisher import AddFisherRequest, AddFisherResponse

router = APIRouter()


def _income_uplift_percent(avg_weekly_catch_kg: float) -> float:
    base = 14.0
    scale_bonus = min(8.0, (avg_weekly_catch_kg / 250.0) * 4.0)
    return round(base + scale_bonus, 1)


@router.get("/api/fishers")
def get_fishers():
    return store.fishers


@router.post("/api/add-fisher", response_model=AddFisherResponse)
def onboard_fisher(payload: AddFisherRequest):
    uplift = _income_uplift_percent(payload.avg_weekly_catch_kg)
    fisher_id = str(uuid4())
    record = {
        "id": fisher_id,
        "name": payload.name,
        "boat_id": payload.boat_id,
        "species_focus": payload.species_focus,
        "avg_weekly_catch_kg": payload.avg_weekly_catch_kg,
        "commitment_level": payload.commitment_level,
        "income_uplift_pct": uplift,
        "status": "Onboarded",
        "created_at": now_utc(),
    }
    store.add_fisher(record)
    return {
        "id": fisher_id,
        "status": "Onboarded",
        "income_uplift_pct": uplift,
        "message": "Fisher onboarded successfully",
        "onboarded_card": {
            "fisher_name": payload.name,
            "boat_id": payload.boat_id,
            "committed_weekly_supply_kg": payload.avg_weekly_catch_kg,
            "projected_income_uplift_pct": uplift,
            "collective_status": "Onboarded into Malpe Meen Collective",
        },
    }
