from __future__ import annotations

import json
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parents[1]
MODELS_DIR = BASE_DIR / "models"
REGISTRY_PATH = MODELS_DIR / "model_registry.json"

DEFAULT_REGISTRY: dict[str, Any] = {
    "demand_conversion": {
        "intercept": -1.2,
        "weights": {
            "community_size": 0.002,
            "freshness_score": 0.045,
            "discount_pct": 0.03,
            "weekend": 0.18,
            "price_penalty": -0.0015,
            "logistics_eta_hours": -0.08,
            "repeat_rate": 0.8,
        },
    },
    "loi_closure": {
        "intercept": -1.0,
        "weights": {
            "sample_sent": 0.9,
            "lab_report_shared": 0.7,
            "meeting_count": 0.22,
            "monthly_volume_kg": 0.0009,
            "days_in_pipeline": 0.03,
            "decision_maker_contacted": 0.65,
        },
    },
    "freshness_sla": {
        "intercept": -0.4,
        "weights": {
            "cold_chain_ok": 1.0,
            "freshness_score": 0.03,
            "eta_hours": -0.09,
            "distance_km": -0.001,
        },
    },
    "bandit": {
        "arms": {},
    },
    "meta": {
        "version": "v1",
        "trained_on": None,
    },
}


def load_registry() -> dict[str, Any]:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    if not REGISTRY_PATH.exists():
        save_registry(DEFAULT_REGISTRY)
        return DEFAULT_REGISTRY

    with REGISTRY_PATH.open("r", encoding="utf-8") as f:
        data = json.load(f)

    merged = DEFAULT_REGISTRY | data
    if "bandit" not in merged:
        merged["bandit"] = {"arms": {}}
    if "arms" not in merged["bandit"]:
        merged["bandit"]["arms"] = {}
    return merged


def save_registry(data: dict[str, Any]) -> None:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    with REGISTRY_PATH.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
