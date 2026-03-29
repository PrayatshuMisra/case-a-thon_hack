"""
spoilage_rerouter.py
────────────────────
Pure-ML Dynamic Spoilage Re-routing Engine.

When a cold-chain drift event is detected (temperature > 4°C), this engine:
  1. Recalculates remaining shelf life using species-decay curves.
  2. Projects whether the fish will survive the full D2C ETA window.
  3. If survival is unlikely → selects the nearest Restaurant Partner for
     emergency re-routing at a 20% salvage discount to save revenue.
  4. Returns a structured RerouteDecision with full ML rationale.

No randomness — every number is derived from measurable inputs.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Literal

# ──────────────────────────────────────────────────────────────
# Species-decay constants (hours of usable shelf life at 2°C)
# ──────────────────────────────────────────────────────────────
SPECIES_SHELF_LIFE_HOURS: dict[str, float] = {
    "prawns":     18.0,
    "sardine":    20.0,
    "pomfret":    28.0,
    "seer fish":  36.0,
    "mixed":      24.0,
}

# Bacterial-growth Q10 factor: for every +10°C the decay rate doubles.
Q10 = 2.0
REFERENCE_TEMP_C = 2.0   # optimal storage temp


# ──────────────────────────────────────────────────────────────
# Mock restaurant-partner registry (in production → Supabase)
# ──────────────────────────────────────────────────────────────
RESTAURANT_PARTNERS: list[dict] = [
    {
        "id": "RST-001",
        "name": "The Coastal Kitchen",
        "locality": "Whitefield",
        "lat": 12.9698,
        "lng": 77.7480,
        "cuisine": "Seafood Grill",
        "capacity_kg": 50,
        "contact": "+91 98450 11001",
    },
    {
        "id": "RST-002",
        "name": "Mangalore Fish House",
        "locality": "Koramangala",
        "lat": 12.9352,
        "lng": 77.6245,
        "cuisine": "Coastal Cuisine",
        "capacity_kg": 30,
        "contact": "+91 98450 22002",
    },
    {
        "id": "RST-003",
        "name": "Harbor Bites",
        "locality": "HSR Layout",
        "lat": 12.9116,
        "lng": 77.6389,
        "cuisine": "Modern Seafood",
        "capacity_kg": 40,
        "contact": "+91 98450 33003",
    },
    {
        "id": "RST-004",
        "name": "Fisherman's Wharf",
        "locality": "Indiranagar",
        "lat": 12.9784,
        "lng": 77.6408,
        "cuisine": "Traditional Coastal",
        "capacity_kg": 60,
        "contact": "+91 98450 44004",
    },
]


# ──────────────────────────────────────────────────────────────
# Data structures
# ──────────────────────────────────────────────────────────────
@dataclass
class ColdChainEvent:
    """Represents a temperature excursion event."""
    detected_at: datetime
    observed_temp_c: float          # e.g. 6.2
    duration_minutes: float = 30.0  # how long drift has been active


@dataclass
class RerouteDecision:
    order_id: str
    action: Literal["d2c_safe", "flash_discount", "reroute_restaurant", "hold_and_inspect"]
    confidence: float                       # 0–1
    survival_probability_pct: float         # probability fish survives D2C ETA
    projected_shelf_life_hours: float       # hours of usable life left
    hours_to_d2c_eta: float
    salvage_discount_pct: float = 0.0
    restaurant_partner: dict | None = None
    original_price_per_kg: float = 0.0
    salvage_price_per_kg: float = 0.0
    rationale: list[str] = field(default_factory=list)
    drift_severity: Literal["none", "mild", "moderate", "critical"] = "none"
    ml_features: dict = field(default_factory=dict)


# ──────────────────────────────────────────────────────────────
# Helper functions
# ──────────────────────────────────────────────────────────────
def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance between two GPS points (km)."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _decay_rate_multiplier(drift_temp_c: float, duration_minutes: float) -> float:
    """
    Effective decay acceleration caused by the temperature excursion.
    Uses Q10 bacterial-growth kinetics combined with exposure duration.
    Drift > 4°C triggers the penalty; ≤ 4°C is nominal.
    """
    if drift_temp_c <= 4.0:
        return 1.0
    # Each +10°C doubles decay rate (Q10 = 2)
    excess_temp = drift_temp_c - REFERENCE_TEMP_C
    instant_multiplier = Q10 ** (excess_temp / 10.0)
    # Blend: only part of the journey was at elevated temp
    exposure_fraction = min(duration_minutes / 60.0, 1.0)  # cap at 1 h equivalent
    return 1.0 + (instant_multiplier - 1.0) * exposure_fraction


def _remaining_shelf_life(
    species: str,
    hours_since_catch: float,
    drift_event: ColdChainEvent | None,
) -> float:
    """Return projected usable shelf-life hours remaining."""
    base_life = SPECIES_SHELF_LIFE_HOURS.get(species.lower(), 24.0)

    # Normal age consumption
    remaining = base_life - hours_since_catch

    # Apply drift penalty if detected
    if drift_event and drift_event.observed_temp_c > 4.0:
        multiplier = _decay_rate_multiplier(
            drift_event.observed_temp_c,
            drift_event.duration_minutes,
        )
        # The drift has been consuming shelf-life at an accelerated rate
        drift_hours = drift_event.duration_minutes / 60.0
        extra_consumed = drift_hours * (multiplier - 1.0) * base_life / 24.0
        remaining -= extra_consumed

    return max(0.0, round(remaining, 2))


def _survival_probability(
    shelf_life_remaining: float,
    hours_to_eta: float,
    drift_severity: str = "none",
) -> float:
    """
    Composite quality-safety model.

    Stage 1 — Time model (sigmoid):
      P_time = sigmoid(k * (shelf_life - eta))
      Captures whether enough shelf life remains for transit.

    Stage 2 — Severity multiplier:
      High temperatures cause histamine formation and bacterial growth
      independent of remaining shelf life. Apply a safety haircut:
        none     → 1.00  (no penalty)
        mild     → 0.88  (slight integrity reduction)
        moderate → 0.50  (cold-chain SLA breached)
        critical → 0.15  (food-safety risk, must not reach consumer)
    """
    margin = shelf_life_remaining - hours_to_eta
    k = 0.8
    base_prob = 1.0 / (1.0 + math.exp(-k * margin))

    severity_weight = {"none": 1.00, "mild": 0.88, "moderate": 0.50, "critical": 0.15}
    adjusted = base_prob * severity_weight.get(drift_severity, 1.0)
    return round(adjusted, 4)


def _nearest_restaurant(
    delivery_lat: float,
    delivery_lng: float,
    quantity_kg: float,
) -> dict | None:
    """Select nearest restaurant with sufficient capacity."""
    candidates = [
        (r, _haversine_km(delivery_lat, delivery_lng, r["lat"], r["lng"]))
        for r in RESTAURANT_PARTNERS
        if r["capacity_kg"] >= quantity_kg
    ]
    if not candidates:
        return None
    candidates.sort(key=lambda x: x[1])
    partner, dist_km = candidates[0]
    return {**partner, "distance_km": round(dist_km, 1)}


# ──────────────────────────────────────────────────────────────
# Main decision function
# ──────────────────────────────────────────────────────────────
def evaluate_reroute(
    *,
    order_id: str,
    species: str,
    catch_time: datetime,
    arrival_eta: datetime,
    current_temp_c: float,
    drift_event: ColdChainEvent | None = None,
    delivery_lat: float = 12.9698,   # default: Whitefield
    delivery_lng: float = 77.7500,
    quantity_kg: float = 1.0,
    original_price_per_kg: float = 949.0,
    reference_time: datetime | None = None,
) -> RerouteDecision:
    """
    Core ML decision function.

    Returns a RerouteDecision with action, rationale, partner (if any),
    and all ML features used in the decision.
    """
    now = reference_time or datetime.now(timezone.utc)

    hours_since_catch = max((now - catch_time).total_seconds() / 3600, 0.0)
    hours_to_eta      = max((arrival_eta - now).total_seconds() / 3600, 0.0)

    # ── Compute drift severity FIRST — needed by survival model ──
    drift_severity: Literal["none", "mild", "moderate", "critical"] = "none"
    if drift_event:
        t = drift_event.observed_temp_c
        if t <= 4.0:
            drift_severity = "none"
        elif t <= 6.0:
            drift_severity = "mild"
        elif t <= 9.0:
            drift_severity = "moderate"
        else:
            drift_severity = "critical"

    shelf_life = _remaining_shelf_life(species, hours_since_catch, drift_event)
    survival_p = _survival_probability(shelf_life, hours_to_eta, drift_severity)
    survival_pct = round(survival_p * 100, 1)

    ml_features = {
        "hours_since_catch":    round(hours_since_catch, 2),
        "hours_to_d2c_eta":     round(hours_to_eta, 2),
        "shelf_life_remaining": shelf_life,
        "survival_probability": survival_p,
        "drift_temp_c":         drift_event.observed_temp_c if drift_event else current_temp_c,
        "drift_duration_min":   drift_event.duration_minutes if drift_event else 0,
        "drift_severity":       drift_severity,
        "species_sensitivity":  SPECIES_SHELF_LIFE_HOURS.get(species.lower(), 24.0),
        "quantity_kg":          quantity_kg,
    }

    rationale: list[str] = []

    # ── Decision tree: severity-gated first, survival-probability second ──────
    # "none" severity → pure survival-probability logic
    if drift_severity == "none":
        if survival_pct >= 80:
            action = "d2c_safe"
            confidence = round(survival_p * 0.95, 4)
            salvage_pct = 0.0
            partner = None
            rationale += [
                f"Current temp ({current_temp_c}°C) is within cold-chain bounds (≤ 4°C).",
                f"Projected shelf life: {shelf_life}h remaining vs {round(hours_to_eta, 1)}h to ETA.",
                f"Survival model confidence: {survival_pct}% — D2C delivery is safe to proceed.",
            ]
        elif survival_pct >= 55:
            action = "flash_discount"
            salvage_pct = 10.0
            confidence = round(survival_p * 0.85, 4)
            partner = None
            rationale += [
                f"Nominal cold-chain but shelf life is tight: {shelf_life}h left vs {round(hours_to_eta, 1)}h to ETA.",
                f"Survival probability is borderline at {survival_pct}%.",
                "Applying 10% flash discount to incentivise rapid fulfilment.",
                "Order remains D2C but flagged for priority delivery slot.",
            ]
        else:
            action = "reroute_restaurant"
            salvage_pct = 20.0
            partner = _nearest_restaurant(delivery_lat, delivery_lng, quantity_kg)
            confidence = round((1 - survival_p) * 0.90, 4)
            rationale += [
                f"Shelf life critically low: {shelf_life}h remaining, {round(hours_to_eta, 1)}h to ETA.",
                f"Survival probability only {survival_pct}% — D2C delivery is not viable.",
                f"Re-routing to nearest restaurant partner: {partner['name'] if partner else 'N/A'} "
                f"({partner['distance_km'] if partner else '?'} km) for immediate use.",
                "20% salvage discount applied — prevents total refund and eliminates food waste.",
            ]

    # "mild" severity → discount-based response, survival still matters
    elif drift_severity == "mild":
        if survival_pct >= 70:
            action = "flash_discount"
            salvage_pct = 10.0
            confidence = round(survival_p * 0.85, 4)
            partner = None
            rationale += [
                f"Mild cold-chain drift detected: temp reached {drift_event.observed_temp_c if drift_event else current_temp_c}°C "
                f"for {drift_event.duration_minutes if drift_event else 0} min.",
                f"Shelf life reduced to {shelf_life}h — survival probability is {survival_pct}%, delivery is still viable.",
                "Applying 10% flash discount to account for marginal integrity loss.",
                "Order remains D2C but flagged for priority delivery slot.",
            ]
        else:
            action = "reroute_restaurant"
            salvage_pct = 20.0
            partner = _nearest_restaurant(delivery_lat, delivery_lng, quantity_kg)
            confidence = round((1 - survival_p) * 0.90, 4)
            rationale += [
                f"Mild drift ({drift_event.observed_temp_c if drift_event else current_temp_c}°C, "
                f"{drift_event.duration_minutes if drift_event else 0} min) has pushed survival below threshold ({survival_pct}%).",
                f"Shelf life remaining: {shelf_life}h vs {round(hours_to_eta, 1)}h ETA — margin is insufficient.",
                f"Re-routing to nearest restaurant: {partner['name'] if partner else 'N/A'} "
                f"({partner['distance_km'] if partner else '?'} km) for immediate culinary use.",
                "Revenue salvaged at 20% discount — avoids full refund.",
            ]

    # "moderate" severity → ALWAYS reroute regardless of remaining shelf life.
    # Cold-chain integrity is compromised at this temperature band (6–9°C).
    elif drift_severity == "moderate":
        action = "reroute_restaurant"
        salvage_pct = 20.0
        partner = _nearest_restaurant(delivery_lat, delivery_lng, quantity_kg)
        confidence = round(min(0.90 + (1 - survival_p) * 0.05, 0.97), 4)
        rationale += [
            f"MODERATE cold-chain drift: temperature reached {drift_event.observed_temp_c if drift_event else current_temp_c}°C "
            f"(safe limit: 4°C) for {drift_event.duration_minutes if drift_event else 0} min.",
            "At this temperature, bacterial growth is accelerated even if total shelf life appears sufficient — "
            "cold-chain integrity cannot be guaranteed for D2C delivery to a consumer.",
            f"Even with {survival_pct}% survival probability on paper, the {drift_severity} severity "
            "breaches the quality SLA required for direct-to-consumer delivery.",
            f"Emergency re-route to: {partner['name'] if partner else 'N/A'} "
            f"({partner['distance_km'] if partner else '?'} km) — kitchen use eliminates consumer risk.",
            "20% salvage discount applied — revenue protected, zero consumer food-safety exposure.",
        ]

    # "critical" severity → ALWAYS hold for inspection. Never deliver.
    else:  # critical
        action = "hold_and_inspect"
        salvage_pct = 0.0
        partner = None
        confidence = 0.97
        rationale += [
            f"CRITICAL cold-chain failure: temperature reached {drift_event.observed_temp_c if drift_event else current_temp_c}°C "
            f"for {drift_event.duration_minutes if drift_event else 0} min.",
            "Temperatures above 9°C trigger rapid histamine formation in fish — unacceptable risk for any delivery pathway.",
            f"Remaining shelf life of {shelf_life}h is unreliable at this severity level.",
            "Order HELD at nearest Quality Hub for physical inspection.",
            "Full refund will be issued if inspection confirms product integrity failure.",
        ]

    salvage_price = round(original_price_per_kg * (1 - salvage_pct / 100), 2) if salvage_pct > 0 else 0.0

    return RerouteDecision(
        order_id=order_id,
        action=action,
        confidence=confidence,
        survival_probability_pct=survival_pct,
        projected_shelf_life_hours=shelf_life,
        hours_to_d2c_eta=round(hours_to_eta, 2),
        salvage_discount_pct=salvage_pct,
        restaurant_partner=partner,
        original_price_per_kg=original_price_per_kg,
        salvage_price_per_kg=salvage_price,
        rationale=rationale,
        drift_severity=drift_severity,
        ml_features=ml_features,
    )
