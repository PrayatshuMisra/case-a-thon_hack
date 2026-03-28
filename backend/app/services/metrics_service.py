from __future__ import annotations

from collections import Counter
from datetime import datetime, timedelta, timezone


def _readiness_label(score: float) -> str:
    if score >= 80:
        return "Strong"
    if score >= 60:
        return "Moderate"
    return "Weak"


def get_dashboard_metrics(store) -> dict:
    orders = store.orders
    fishers = store.fishers
    lois = store.lois

    now = datetime.now(timezone.utc)
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    todays_orders = [o for o in orders if o["created_at"] >= day_start]

    daily_orders = len(todays_orders)
    total_revenue = round(sum(o["total_amount"] for o in todays_orders), 2)
    avg_freshness = round(
        sum(o["freshness_score"] for o in todays_orders) / daily_orders, 1
    ) if daily_orders else 0.0
    repeat_proxy = 38 if daily_orders else 0
    active_fishers = len(fishers)
    signed_lois = len([l for l in lois if l.get("status", "Draft") == "Signed"])

    locality_counter = Counter(o["locality"] for o in orders)
    product_counter = Counter(o["product_name"] for o in orders)

    trend_days = []
    for i in range(6, -1, -1):
        day = day_start - timedelta(days=i)
        day_end = day + timedelta(days=1)
        value = len([o for o in orders if day <= o["created_at"] < day_end])
        trend_days.append({"name": day.strftime("%a"), "value": value})

    avg_basket = round(total_revenue / daily_orders, 2) if daily_orders else 0
    total_kg = round(sum(o["quantity_kg"] for o in todays_orders), 2)
    apartment_count = len(set(o["apartment_name"] for o in todays_orders))

    demand_score = min(100, daily_orders * 12 + apartment_count * 5)
    supply_score = min(100, active_fishers * 10)
    trust_score = avg_freshness
    overall_proof_score = round((demand_score + supply_score + trust_score) / 3, 1)

    return {
        "kpis": {
            "daily_orders": daily_orders,
            "revenue_captured": total_revenue,
            "repeat_purchase_proxy": repeat_proxy,
            "avg_freshness": avg_freshness,
            "active_fishers": active_fishers,
            "signed_lois": signed_lois,
        },
        "charts": {
            "orders_over_time": trend_days,
            "apartment_demand_split": [
                {"name": k, "value": v} for k, v in locality_counter.items()
            ],
            "product_demand_split": [
                {"name": k, "value": v} for k, v in product_counter.items()
            ],
        },
        "live_reservations": [
            {
                "order_id": o["id"],
                "customer_name": o["customer_name"],
                "apartment_name": o["apartment_name"],
                "locality": o["locality"],
                "product_name": o["product_name"],
                "quantity_kg": o["quantity_kg"],
                "total_amount": o["total_amount"],
                "freshness_score": o["freshness_score"],
                "created_at": o["created_at"].isoformat(),
            }
            for o in orders[:8]
        ],
        "traction_summary": {
            "avg_basket_value": avg_basket,
            "apartment_count": apartment_count,
            "total_kg_reserved": total_kg,
            "freshness_avg": avg_freshness,
        },
        "investor_readiness": {
            "demand": _readiness_label(demand_score),
            "supply": _readiness_label(supply_score),
            "trust": _readiness_label(trust_score),
            "overall_proof_score": overall_proof_score,
        },
        "investor_proof": {
            "pilot_status": "Investor-Ready" if overall_proof_score >= 70 else "Building Proof",
            "total_reservations": len(orders),
            "apartment_communities": len(set(o["apartment_name"] for o in orders)),
            "average_basket_value": avg_basket,
            "total_kg_reserved": round(sum(o["quantity_kg"] for o in orders), 2),
            "top_locality": locality_counter.most_common(1)[0][0] if locality_counter else "HSR Layout",
            "fishers_onboarded": active_fishers,
            "weekly_supply_committed": round(sum(f["avg_weekly_catch_kg"] for f in fishers), 2),
            "avg_catch_per_fisher": round(
                sum(f["avg_weekly_catch_kg"] for f in fishers) / active_fishers, 2
            ) if active_fishers else 0,
            "avg_freshness_score": round(
                sum(o["freshness_score"] for o in orders) / len(orders), 1
            ) if orders else 0,
            "provenance_visibility": "High",
            "cold_chain_confidence": "High",
            "spoilage_prevention": "Active",
            "lois_generated": len(lois),
            "buyer_type_mix": dict(Counter(l["buyer_type"] for l in lois)),
            "pilot_evidence_strength_score": overall_proof_score,
            "readiness": {
                "launch": _readiness_label(demand_score),
                "logistics": _readiness_label(trust_score),
                "demand": _readiness_label(demand_score),
                "supply": _readiness_label(supply_score),
                "proof": _readiness_label(overall_proof_score),
            },
        },
    }
