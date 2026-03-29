"""
API routes for Dynamic Spoilage Re-routing.

Endpoints:
  POST /api/spoilage/evaluate-reroute
      Accepts order context + cold-chain telemetry, runs the ML engine,
      returns a RerouteDecision.

  GET  /api/spoilage/simulate/{scenario}
      Pre-built simulation scenarios for demo/testing:
        d2c_safe | flash_discount | reroute_restaurant | hold_and_inspect
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.spoilage_rerouter import (
    ColdChainEvent,
    evaluate_reroute,
)

router = APIRouter()


# ──────────────────────────────────────────────────────────────
# Request / Response schemas
# ──────────────────────────────────────────────────────────────
class ColdChainEventPayload(BaseModel):
    detected_at: str = Field(description="ISO-8601 timestamp of drift detection")
    observed_temp_c: float = Field(ge=0, le=40, description="Observed temperature in °C")
    duration_minutes: float = Field(default=30.0, ge=0, description="Duration of drift in minutes")


class RerouteRequest(BaseModel):
    order_id: str
    species: str = "Seer Fish"
    catch_time: str = Field(description="ISO-8601 catch timestamp")
    arrival_eta: str = Field(description="ISO-8601 expected delivery timestamp")
    current_temp_c: float = Field(default=2.0, ge=0, le=40)
    drift_event: Optional[ColdChainEventPayload] = None
    delivery_lat: float = 12.9698
    delivery_lng: float = 77.7500
    quantity_kg: float = 1.0
    original_price_per_kg: float = 949.0



def _parse_dt(value: str) -> datetime:
    dt = datetime.fromisoformat(value)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def _decision_to_dict(decision, species: str) -> dict:
    return {
        "order_id":                   decision.order_id,
        "species":                    species,
        "action":                     decision.action,
        "confidence":                 decision.confidence,
        "survival_probability_pct":   decision.survival_probability_pct,
        "projected_shelf_life_hours": decision.projected_shelf_life_hours,
        "hours_to_d2c_eta":           decision.hours_to_d2c_eta,
        "salvage_discount_pct":       decision.salvage_discount_pct,
        "restaurant_partner":         decision.restaurant_partner,
        "original_price_per_kg":      decision.original_price_per_kg,
        "salvage_price_per_kg":       decision.salvage_price_per_kg,
        "rationale":                  decision.rationale,
        "drift_severity":             decision.drift_severity,
        "ml_features":                decision.ml_features,
    }


# ──────────────────────────────────────────────────────────────
# POST /api/spoilage/evaluate-reroute
# ──────────────────────────────────────────────────────────────
@router.post("/api/spoilage/evaluate-reroute")
def evaluate_reroute_endpoint(req: RerouteRequest):
    """Run the ML rerouting engine against live telemetry."""
    catch_time   = _parse_dt(req.catch_time)
    arrival_eta  = _parse_dt(req.arrival_eta)

    drift = None
    if req.drift_event:
        drift = ColdChainEvent(
            detected_at=_parse_dt(req.drift_event.detected_at),
            observed_temp_c=req.drift_event.observed_temp_c,
            duration_minutes=req.drift_event.duration_minutes,
        )

    decision = evaluate_reroute(
        order_id=req.order_id,
        species=req.species,
        catch_time=catch_time,
        arrival_eta=arrival_eta,
        current_temp_c=req.current_temp_c,
        drift_event=drift,
        delivery_lat=req.delivery_lat,
        delivery_lng=req.delivery_lng,
        quantity_kg=req.quantity_kg,
        original_price_per_kg=req.original_price_per_kg,
    )

    return _decision_to_dict(decision, req.species)


# ──────────────────────────────────────────────────────────────
# GET /api/spoilage/simulate/{scenario}
# Pre-built scenarios for frontend demo without a real order
# ──────────────────────────────────────────────────────────────
@router.get("/api/spoilage/simulate/{scenario}")
def simulate_scenario(scenario: str):
    """
    Simulate a cold-chain scenario.
    scenario: d2c_safe | flash_discount | reroute_restaurant | hold_and_inspect
    """
    now = datetime.now(timezone.utc)

    SCENARIOS = {
        "d2c_safe": {
            "order_id": "DEMO-SAFE-001",
            "species": "Seer Fish",
            "catch_time": (now - timedelta(hours=8)).isoformat(),
            "arrival_eta": (now + timedelta(hours=6)).isoformat(),
            "current_temp_c": 2.1,
            "drift_event": None,
        },
        "flash_discount": {
            "order_id": "DEMO-FLASH-002",
            "species": "Pomfret",
            "catch_time": (now - timedelta(hours=16)).isoformat(),
            "arrival_eta": (now + timedelta(hours=5)).isoformat(),
            "current_temp_c": 5.5,
            "drift_event": {
                "detected_at": (now - timedelta(minutes=45)).isoformat(),
                "observed_temp_c": 5.5,
                "duration_minutes": 45,
            },
        },
        "reroute_restaurant": {
            "order_id": "DEMO-REROUTE-003",
            "species": "Prawns",
            "catch_time": (now - timedelta(hours=14)).isoformat(),
            "arrival_eta": (now + timedelta(hours=4)).isoformat(),
            "current_temp_c": 7.8,
            "drift_event": {
                "detected_at": (now - timedelta(minutes=90)).isoformat(),
                "observed_temp_c": 7.8,
                "duration_minutes": 90,
            },
        },
        "hold_and_inspect": {
            "order_id": "DEMO-HOLD-004",
            "species": "Sardine",
            "catch_time": (now - timedelta(hours=22)).isoformat(),
            "arrival_eta": (now + timedelta(hours=3)).isoformat(),
            "current_temp_c": 12.0,
            "drift_event": {
                "detected_at": (now - timedelta(hours=2)).isoformat(),
                "observed_temp_c": 12.0,
                "duration_minutes": 120,
            },
        },
    }

    if scenario not in SCENARIOS:
        return {
            "error": f"Unknown scenario '{scenario}'. "
                     f"Choose from: {', '.join(SCENARIOS)}"
        }

    data = SCENARIOS[scenario]
    catch_time  = _parse_dt(data["catch_time"])
    arrival_eta = _parse_dt(data["arrival_eta"])

    drift = None
    if data["drift_event"]:
        drift = ColdChainEvent(
            detected_at=_parse_dt(data["drift_event"]["detected_at"]),
            observed_temp_c=data["drift_event"]["observed_temp_c"],
            duration_minutes=data["drift_event"]["duration_minutes"],
        )

    decision = evaluate_reroute(
        order_id=data["order_id"],
        species=data["species"],
        catch_time=catch_time,
        arrival_eta=arrival_eta,
        current_temp_c=data["current_temp_c"],
        drift_event=drift,
        quantity_kg=1.5,
        original_price_per_kg=949.0,
    )

    return {"scenario": scenario, **_decision_to_dict(decision, data["species"])}
