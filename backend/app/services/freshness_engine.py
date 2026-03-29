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
    """Return freshness intelligence and pricing hints using weighted multi-factor logic."""
    now = reference_time or datetime.now(timezone.utc)
    species_factor = SPECIES_SENSITIVITY.get(species.lower(), 1.0)

    hours_since_catch = _hours_between(catch_time, now)
    packing_delay = _hours_between(landing_time, packing_time)
    dispatch_delay = _hours_between(packing_time, dispatch_time)
    eta_hours = _hours_between(now, arrival_eta)

    score = 100.0
    audit = []

    # 1. Catch to Now (Overall Age)
    age_penalty = round(hours_since_catch * 1.2 * species_factor, 1)
    score -= age_penalty
    audit.append({
        "label": "Time Since Catch",
        "value": f"{round(hours_since_catch, 1)}h",
        "status": "pass" if hours_since_catch < 12 else "warn",
        "impact": f"-{age_penalty} pts"
    })

    # 2. Thermal Stability
    if cold_chain_ok:
        thermal_bonus = 2.5
        score += thermal_bonus
        audit.append({
            "label": "Thermal Stability",
            "value": "2°C - 4°C",
            "status": "pass",
            "impact": f"+{thermal_bonus} pts (Stable)"
        })
    else:
        score -= 15
        audit.append({
            "label": "Cold-Chain Integrity",
            "value": "Drift Detected",
            "status": "at_risk",
            "impact": "-15.0 pts"
        })

    # 3. Processing Efficiency
    process_penalty = round(packing_delay * 0.8 * species_factor, 1)
    score -= process_penalty
    audit.append({
        "label": "Hub Processing",
        "value": f"Landed to Packed in {round(packing_delay, 1)}h",
        "status": "pass" if packing_delay < 3 else "info",
        "impact": f"-{process_penalty} pts"
    })

    # 4. Species Sensitivity
    if species_factor > 1.1:
        audit.append({
            "label": "Species Stability",
            "value": f"{species.capitalize()} (High Decay)",
            "status": "info",
            "impact": "Increased weighting applied"
        })

    score = max(0.0, min(100.0, round(score, 1)))
    return {
        "freshness_score": score,
        "freshness_label": _label(score),
        "spoilage_risk": _spoilage_risk(score),
        "flash_drop": score < 80,
        "audit": audit
    }
