from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timezone
from math import exp
from typing import Any

from app.db.store import PRODUCT_CATALOG, now_utc
from app.services.model_registry import load_registry, save_registry


@dataclass
class ArmContext:
    arm_id: str
    locality: str
    product_name: str
    channel: str
    offer: str
    discount_pct: float
    community_size: int
    logistics_eta_hours: float


def _sigmoid(x: float) -> float:
    return 1 / (1 + exp(-x))


def _label(prob: float) -> str:
    if prob >= 0.75:
        return "High"
    if prob >= 0.5:
        return "Medium"
    return "Low"


def _freshness_from_shipments(store, product_name: str) -> float:
    shipment = store.get_shipment_for_product(product_name)
    if not shipment:
        return 82.0

    age_hours = max((datetime.now(timezone.utc) - shipment["catch_time"]).total_seconds() / 3600, 0)
    score = 98 - (age_hours * 1.6)
    if not shipment.get("cold_chain_ok", True):
        score -= 12
    return max(55.0, min(98.0, round(score, 1)))


def _price_for(product_name: str, discount_pct: float) -> float:
    base = PRODUCT_CATALOG.get(product_name, {}).get("base_price", 349.0)
    return round(base * (1 - discount_pct / 100), 2)


def _default_arm_contexts() -> list[ArmContext]:
    return [
        ArmContext("hsr-seer-rwa-wa", "HSR Layout", "Seer Fish", "rwa_whatsapp", "early_bird_5", 5.0, 1800, 8.0),
        ArmContext("whitefield-prawns-chef", "Whitefield", "Prawns", "chef_direct", "sample_pack", 3.0, 2600, 9.0),
        ArmContext("koramangala-pomfret-inst", "Koramangala", "Pomfret", "insta_lead", "flash_drop", 7.0, 1400, 8.5),
        ArmContext("indiranagar-seer-rwa", "Indiranagar", "Seer Fish", "rwa_whatsapp", "family_combo", 4.0, 1200, 8.2),
    ]


def _repeat_rate(store) -> float:
    if not store.orders:
        return 0.12
    names = [o["customer_name"].strip().lower() for o in store.orders]
    unique_count = len(set(names))
    if unique_count == 0:
        return 0.12
    repeats = len(names) - unique_count
    return max(0.0, min(1.0, repeats / len(names)))


def recommend_tomorrow(store) -> dict[str, Any]:
    registry = load_registry()
    demand = registry["demand_conversion"]
    sla = registry["freshness_sla"]

    repeat_rate = _repeat_rate(store)
    locality_orders = Counter(o["locality"] for o in store.orders)

    candidates: list[dict[str, Any]] = []
    for arm in _default_arm_contexts():
        freshness_score = _freshness_from_shipments(store, arm.product_name)
        price = _price_for(arm.product_name, arm.discount_pct)
        prior_orders_7d = locality_orders.get(arm.locality, 0)

        demand_logit = (
            demand["intercept"]
            + demand["weights"]["community_size"] * arm.community_size
            + demand["weights"]["freshness_score"] * freshness_score
            + demand["weights"]["discount_pct"] * arm.discount_pct
            + demand["weights"]["weekend"] * (1 if now_utc().weekday() >= 5 else 0)
            + demand["weights"]["price_penalty"] * price
            + demand["weights"]["logistics_eta_hours"] * arm.logistics_eta_hours
            + demand["weights"]["repeat_rate"] * repeat_rate
            + (prior_orders_7d * 0.015)
        )
        conversion_probability = max(0.03, min(0.92, _sigmoid(demand_logit)))

        sla_logit = (
            sla["intercept"]
            + sla["weights"]["cold_chain_ok"] * 1.0
            + sla["weights"]["freshness_score"] * freshness_score
            + sla["weights"]["eta_hours"] * arm.logistics_eta_hours
            + sla["weights"]["distance_km"] * 380
        )
        sla_confidence = max(0.1, min(0.97, _sigmoid(sla_logit)))

        expected_orders = round(max(1.0, arm.community_size * 0.01 * conversion_probability), 2)
        expected_gmv = round(expected_orders * price, 2)

        risk_flags: list[str] = []
        if sla_confidence < 0.6:
            risk_flags.append("SLA confidence below preferred threshold")
        if freshness_score < 85:
            risk_flags.append("Freshness may need flash-drop communication")

        candidates.append(
            {
                "arm_id": arm.arm_id,
                "locality": arm.locality,
                "product_name": arm.product_name,
                "channel": arm.channel,
                "offer": arm.offer,
                "expected_orders": expected_orders,
                "expected_gmv": expected_gmv,
                "conversion_probability": round(conversion_probability, 3),
                "sla_confidence": round(sla_confidence, 3),
                "confidence_band": _label((conversion_probability + sla_confidence) / 2),
                "risk_flags": risk_flags,
            }
        )

    candidates.sort(key=lambda x: (x["expected_gmv"], x["conversion_probability"]), reverse=True)

    return {
        "generated_at": now_utc(),
        "budget_context_inr": 1200000,
        "top_arms": candidates[:3],
        "rationale": [
            "Prioritized by expected GMV under bootstrapped working-capital constraints.",
            "SLA and freshness confidence included to protect trust signals.",
            "Shortlisted arms maximize probability of first repeat purchases in pilot localities.",
        ],
    }


def _arm_posterior(registry: dict[str, Any], arm_id: str) -> tuple[float, float]:
    arms = registry["bandit"]["arms"]
    if arm_id not in arms:
        arms[arm_id] = {"alpha": 1.0, "beta": 1.0}
    return float(arms[arm_id]["alpha"]), float(arms[arm_id]["beta"])


def log_experiment(store, payload: dict[str, Any]) -> dict[str, Any]:
    registry = load_registry()
    arms = registry["bandit"]["arms"]

    alpha, beta = _arm_posterior(registry, payload["arm_id"])
    orders = max(payload["orders"], 0)
    failures = max(payload["impressions"] - payload["orders"], 0)

    alpha += orders
    beta += failures

    arms[payload["arm_id"]] = {"alpha": round(alpha, 3), "beta": round(beta, 3)}

    # Choose next-best arm by posterior mean alpha/(alpha+beta)
    best_arm = payload["arm_id"]
    best_score = 0.0
    for arm_id, vals in arms.items():
        score = vals["alpha"] / (vals["alpha"] + vals["beta"])
        if score > best_score:
            best_score = score
            best_arm = arm_id

    registry["meta"]["trained_on"] = now_utc().isoformat()
    save_registry(registry)

    store.add_experiment(
        {
            **payload,
            "created_at": now_utc(),
            "posterior_alpha": alpha,
            "posterior_beta": beta,
        }
    )

    conversion = 0.0 if payload["impressions"] == 0 else payload["orders"] / payload["impressions"]
    return {
        "status": "logged",
        "arm_id": payload["arm_id"],
        "updated_alpha": round(alpha, 3),
        "updated_beta": round(beta, 3),
        "empirical_conversion_rate": round(conversion, 4),
        "next_best_arm_id": best_arm,
    }


def model_traction_score(store) -> dict[str, Any]:
    orders = len(store.orders)
    fishers = len(store.fishers)
    lois_signed = len([l for l in store.lois if l.get("status", "Draft") == "Signed"])

    demand_score = min(100.0, orders * 6.5)
    supply_score = min(100.0, fishers * 5.0)
    loi_score = min(100.0, lois_signed * 25.0)

    freshness_avg = (
        sum(o.get("freshness_score", 0.0) for o in store.orders) / len(store.orders)
        if store.orders
        else 82.0
    )
    trust_score = max(0.0, min(100.0, freshness_avg))

    traction_score = round((demand_score * 0.35 + supply_score * 0.2 + loi_score * 0.25 + trust_score * 0.2), 1)

    def label(score: float) -> str:
        if score >= 75:
            return "Strong"
        if score >= 50:
            return "Moderate"
        return "Weak"

    return {
        "generated_at": now_utc(),
        "traction_score": traction_score,
        "components": [
            {"name": "Demand", "score": round(demand_score, 1), "label": label(demand_score)},
            {"name": "Supply", "score": round(supply_score, 1), "label": label(supply_score)},
            {"name": "LOI Pipeline", "score": round(loi_score, 1), "label": label(loi_score)},
            {"name": "Trust/SLA", "score": round(trust_score, 1), "label": label(trust_score)},
        ],
        "notes": [
            "Score calibrated for 90-day pilot stage and bootstrapped working-capital operations.",
            "Demand component reflects transaction volume growth; LOI component reflects signed institutional proof.",
        ],
    }
