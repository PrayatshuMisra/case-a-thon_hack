from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal


SPECIES_SENSITIVITY = {
    "prawns": 1.25,
    "sardine": 1.2,
    "pomfret": 1.1,
    "seer fish": 0.9,
}


def _hours_between(start: datetime, end: datetime) -> float:
    return max((end - start).total_seconds() / 3600, 0.0)


def _label(score: float) -> Literal["Excellent", "High", "Moderate", "At Risk"]:
    if score >= 90:
        return "Excellent"
    if score >= 80:
        return "High"
    if score >= 70:
        return "Moderate"
    return "At Risk"


def _spoilage_risk(score: float) -> Literal["Low", "Medium", "High"]:
    if score >= 85:
        return "Low"
    if score >= 70:
        return "Medium"
    return "High"


def calculate_freshness_intelligence(
    *,
    catch_time: datetime,
    landing_time: datetime,
    packing_time: datetime,
    dispatch_time: datetime,
    arrival_eta: datetime,
    species: str,
    cold_chain_ok: bool,
    reference_time: datetime | None = None,
) -> dict:
    """Return freshness intelligence and pricing hints using weighted degradation logic."""
    now = reference_time or datetime.now(timezone.utc)
    species_factor = SPECIES_SENSITIVITY.get(species.lower(), 1.0)

    hours_since_catch = _hours_between(catch_time, now)
    packing_delay = _hours_between(landing_time, packing_time)
    dispatch_delay = _hours_between(packing_time, dispatch_time)
    eta_hours = _hours_between(now, arrival_eta)

    score = 100.0
    score -= hours_since_catch * 1.5 * species_factor
    score -= packing_delay * 1.0 * species_factor
    score -= dispatch_delay * 1.2
    score -= max(eta_hours - 8, 0) * 0.8
    if not cold_chain_ok:
        score -= 18

    score = max(0.0, min(100.0, round(score, 1)))
    return {
        "freshness_score": score,
        "freshness_label": _label(score),
        "spoilage_risk": _spoilage_risk(score),
        "flash_drop": score < 80,
    }
