from __future__ import annotations

from datetime import datetime, timezone

from app.db.store import store
from app.services.model_registry import load_registry, save_registry


def train_v1() -> dict:
    registry = load_registry()

    # Mock calibration from current in-memory pilot data
    total_orders = len(store.orders)
    freshness_avg = (
        sum(o.get("freshness_score", 0.0) for o in store.orders) / total_orders
        if total_orders
        else 88.0
    )
    repeat_rate = 0.1
    if total_orders > 1:
        customers = [o.get("customer_name", "").strip().lower() for o in store.orders]
        repeat_rate = max(0.0, min(0.95, (len(customers) - len(set(customers))) / len(customers)))

    demand_weights = registry["demand_conversion"]["weights"]
    demand_weights["freshness_score"] = round(max(0.02, min(0.08, freshness_avg / 2500)), 4)
    demand_weights["repeat_rate"] = round(max(0.3, min(1.2, 0.4 + repeat_rate * 1.3)), 4)

    sla_weights = registry["freshness_sla"]["weights"]
    sla_weights["freshness_score"] = round(max(0.015, min(0.05, freshness_avg / 3000)), 4)

    registry["meta"]["version"] = "v1"
    registry["meta"]["trained_on"] = datetime.now(timezone.utc).isoformat()
    registry["meta"]["samples_seen"] = total_orders

    save_registry(registry)
    return {
        "status": "ok",
        "trained_on": registry["meta"]["trained_on"],
        "samples_seen": total_orders,
        "freshness_avg": round(freshness_avg, 2),
        "repeat_rate": round(repeat_rate, 3),
    }


if __name__ == "__main__":
    result = train_v1()
    print("train_v1 completed")
    for k, v in result.items():
        print(f"- {k}: {v}")
